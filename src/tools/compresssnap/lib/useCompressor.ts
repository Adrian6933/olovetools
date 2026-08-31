import { useCallback, useEffect, useRef, useState } from 'react';
import { encode, supportedFormats } from './encode';
import type { CompressSettings, OutputFormat } from './types';
import type { WorkerRequest, WorkerResponse } from './compress.worker';

// ============================================================================
// Worker wrapper with a main-thread fallback.
// ----------------------------------------------------------------------------
// The fallback is not defensive padding: `new Worker(new URL(...))` fails
// outright under a strict CSP without `worker-src`, and a tool that only knows
// how to talk to a worker is a tool that does nothing at all on those pages.
// A single photo on the main thread is a few hundred milliseconds — noticeable,
// not broken.
// ============================================================================

export interface EncodeOutcome {
  blob: Blob;
  width: number;
  height: number;
  mime: string;
  quality: number;
  ssim: number | null;
  ms: number;
  attempts: number;
}

export function useCompressor() {
  const workerRef = useRef<Worker>(null);
  const pending = useRef<Record<string, (response: WorkerResponse) => void>>({});
  const failed = useRef(false);
  const counter = useRef(0);
  const [formats, setFormats] = useState<OutputFormat[]>(['original', 'image/jpeg', 'image/png', 'image/webp']);

  const ensureWorker = useCallback((): Worker => {
    if (failed.current) return null;
    if (workerRef.current) return workerRef.current;
    try {
      const worker = new Worker(new URL('./compress.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const resolve = pending.current[event.data.id];
        if (!resolve) return;
        delete pending.current[event.data.id];
        resolve(event.data);
      };
      worker.onerror = () => {
        failed.current = true;
        workerRef.current = null;
        // Every in-flight request has to be released, or the queue stalls
        // forever waiting on a worker that is gone.
        Object.keys(pending.current).forEach(id => {
          const resolve = pending.current[id];
          delete pending.current[id];
          resolve({ id, ok: false, error: 'worker-failed' });
        });
      };
      workerRef.current = worker;
      return worker;
    } catch {
      failed.current = true;
      return null;
    }
  }, []);

  useEffect(
    () => () => {
      if (workerRef.current) workerRef.current.terminate();
      workerRef.current = null;
    },
    []
  );

  const ask = useCallback(
    (request: Omit<WorkerRequest, 'id'>, transfer: Transferable[]): Promise<WorkerResponse> => {
      const worker = ensureWorker();
      if (!worker) return Promise.resolve({ id: '', ok: false, error: 'no-worker' });
      const id = `r${++counter.current}`;
      return new Promise(resolve => {
        pending.current[id] = resolve;
        worker.postMessage({ ...request, id } as WorkerRequest, transfer);
      });
    },
    [ensureWorker]
  );

  // Which output formats this browser can actually write. Asked once, and on
  // the main thread when there is no worker — the answer is the same either way.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const worker = ensureWorker();
      if (worker) {
        const response = await ask({ kind: 'formats' }, []);
        if (!cancelled && response.ok && response.formats) {
          setFormats(response.formats);
          return;
        }
      }
      const local = await supportedFormats();
      if (!cancelled) setFormats(local);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [ask, ensureWorker]);

  /**
   * Encodes one frame. The bitmap is consumed either way — transferred to the
   * worker, or closed here after the inline encode — so callers must not reuse
   * it afterwards.
   */
  const run = useCallback(
    async (bitmap: ImageBitmap, settings: CompressSettings, sourceMime: string): Promise<EncodeOutcome> => {
      const worker = ensureWorker();
      if (worker) {
        const response = await ask({ kind: 'encode', bitmap, settings, sourceMime }, [bitmap as unknown as Transferable]);
        if (response.ok && response.blob) {
          return {
            blob: response.blob,
            width: response.width,
            height: response.height,
            mime: response.mime,
            quality: response.quality,
            ssim: response.ssim,
            ms: response.ms,
            attempts: response.attempts,
          };
        }
        // A transferred bitmap is gone from this thread, so there is nothing
        // left to retry with; the caller surfaces the error.
        throw new Error(response.error || 'encode-failed');
      }

      try {
        const result = await encode(bitmap, settings, sourceMime);
        return result;
      } finally {
        bitmap.close();
      }
    },
    [ask, ensureWorker]
  );

  return { run, formats, usingWorker: !failed.current };
}
