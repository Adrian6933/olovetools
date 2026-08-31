// ============================================================================
// ZipFlow engine — the main-thread half of the worker protocol
// ----------------------------------------------------------------------------
// Also carries the inline fallback: a few hardened browsers (and Safari in
// Lockdown Mode) refuse to construct module workers, and packing a ZIP is too
// central to this tool to just fail there.
// ============================================================================

import type {
  BenchRow,
  EntryMeta,
  PackFile,
  Preset,
  WorkerRequest,
  WorkerRequestPayload,
  WorkerResponse,
  ZipErrorCode,
} from '../types';

export class ZipError extends Error {
  code: ZipErrorCode;
  constructor(code: ZipErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'ZipError';
  }
}

export type Progress = (percent: number, current: string | null) => void;

interface Pending {
  resolve: (value: any) => void;
  reject: (reason: unknown) => void;
  onProgress?: Progress;
}

/** Lazily loaded, and only when the worker is unavailable. */
type Core = typeof import('./zipCore');

export class ZipEngine {
  private worker: Worker | null = null;
  private workerBroken = false;
  private pending = new Map<number, Pending>();
  private nextId = 1;

  /** Remembered so a cancel (which terminates the worker) can re-open silently. */
  private openedFile: File | null = null;
  private openedCrc = false;

  private core: Core | null = null;
  private inlineSession: InstanceType<Core['ZipSession']> | null = null;

  // -------------------------------------------------------------------------
  // Worker plumbing
  // -------------------------------------------------------------------------

  private ensureWorker(): Worker | null {
    if (this.workerBroken) return null;
    if (this.worker) return this.worker;
    try {
      const worker = new Worker(new URL('./zip.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (event: MessageEvent<WorkerResponse>) => this.onMessage(event.data);
      worker.onerror = () => {
        // Fires for a worker that failed to load or threw outside the message
        // handler (errors *inside* it come back as a typed 'error' message).
        // Either way this thread is unusable, so stop handing work to it —
        // otherwise every later call retries a worker that will never answer,
        // instead of falling through to the inline path.
        this.workerBroken = true;
        this.failAll(new ZipError('unknown', 'Worker crashed'));
      };
      this.worker = worker;
      return worker;
    } catch {
      this.workerBroken = true;
      return null;
    }
  }

  private onMessage(msg: WorkerResponse) {
    const entry = this.pending.get(msg.id);
    if (!entry) return;
    if (msg.type === 'progress') {
      entry.onProgress?.(msg.percent, msg.current);
      return;
    }
    this.pending.delete(msg.id);
    if (msg.type === 'error') entry.reject(new ZipError(msg.code, msg.message));
    else entry.resolve(msg.result);
  }

  private failAll(err: unknown) {
    for (const entry of this.pending.values()) entry.reject(err);
    this.pending.clear();
    this.worker?.terminate();
    this.worker = null;
  }

  private send<T>(req: WorkerRequestPayload, onProgress?: Progress): Promise<T> {
    const worker = this.ensureWorker();
    if (!worker) return this.inline<T>(req, onProgress);
    const id = this.nextId++;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve, reject, onProgress });
      worker.postMessage({ ...req, id } as WorkerRequest);
    });
  }

  // -------------------------------------------------------------------------
  // Inline fallback — same zipCore, just without the worker
  // -------------------------------------------------------------------------

  private async inline<T>(req: WorkerRequestPayload, onProgress?: Progress): Promise<T> {
    const core = (this.core ||= await import('./zipCore'));
    this.inlineSession ||= new core.ZipSession();
    try {
      switch (req.type) {
        case 'create': {
          const started = performance.now();
          const blob = await core.createArchive(req.files, req.preset, req.comment, onProgress);
          return { blob, ms: performance.now() - started } as T;
        }
        case 'bench': {
          const rows: BenchRow[] = [];
          for (const preset of req.presets) {
            const started = performance.now();
            const blob = await core.createArchive(req.files, preset, '');
            rows.push({ preset, size: blob.size, ms: performance.now() - started });
          }
          return rows as T;
        }
        case 'open':
          return (await this.inlineSession.open(req.file, req.checkCrc)) as T;
        case 'read':
          return (await this.inlineSession.read(req.path, onProgress)) as T;
        case 'repack':
          return (await this.inlineSession.repack(req.paths, req.preset, onProgress)) as T;
        case 'close':
          this.inlineSession.close();
          return null as T;
      }
    } catch (err) {
      const { code, message } = core.classifyError(err);
      throw new ZipError(code, message);
    }
    return null as T;
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  create(files: PackFile[], preset: Preset, comment: string, onProgress?: Progress) {
    return this.send<{ blob: Blob; ms: number }>({ type: 'create', files, preset, comment }, onProgress);
  }

  bench(files: PackFile[], presets: Preset[], onProgress?: Progress) {
    return this.send<BenchRow[]>({ type: 'bench', files, presets }, onProgress);
  }

  async open(file: File, checkCrc: boolean): Promise<EntryMeta[]> {
    const entries = await this.send<EntryMeta[]>({ type: 'open', file, checkCrc });
    this.openedFile = file;
    this.openedCrc = checkCrc;
    return entries;
  }

  /** Re-opens the archive if a cancel tore the worker down mid-session. */
  private async ensureOpen(): Promise<void> {
    if (!this.openedFile) return;
    if (this.worker || this.workerBroken) return;
    await this.send<EntryMeta[]>({ type: 'open', file: this.openedFile, checkCrc: this.openedCrc });
  }

  async read(path: string, onProgress?: Progress): Promise<Blob> {
    await this.ensureOpen();
    return this.send<Blob>({ type: 'read', path }, onProgress);
  }

  async repack(paths: string[], preset: Preset, onProgress?: Progress): Promise<Blob> {
    await this.ensureOpen();
    return this.send<Blob>({ type: 'repack', paths, preset }, onProgress);
  }

  /**
   * JSZip has no abort hook, so the only honest way to stop a long deflate is
   * to kill the thread running it. Pending calls reject; the opened archive is
   * restored on the next read.
   */
  cancel(): void {
    this.failAll(new ZipError('unknown', 'cancelled'));
  }

  closeArchive(): void {
    this.openedFile = null;
    this.send({ type: 'close' }).catch(() => {});
  }

  dispose(): void {
    this.failAll(new ZipError('unknown', 'disposed'));
    this.openedFile = null;
    this.inlineSession?.close();
  }
}
