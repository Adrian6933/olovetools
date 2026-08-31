import { useCallback, useEffect, useRef } from 'react';
import { NAMED_KINDS, generateBatch, type BatchRequest, type BatchResult } from './engine';
import type { WorkerRequest, WorkerResponse } from './uuid.worker';

interface Pending {
  resolve: (result: BatchResult) => void;
  reject: (error: Error) => void;
}

/**
 * Promise wrapper around the generation worker, with a main-thread fallback.
 *
 * The fallback matters: `new Worker(new URL(...))` fails outright under a
 * strict CSP without `worker-src`, and in that case a tool that only knows how
 * to talk to a worker is a tool that does nothing at all. Small batches are
 * also cheaper to run inline than to round-trip.
 */
export function useUuidEngine() {
  const workerRef = useRef<Worker | null>(null);
  const brokenRef = useRef(false);
  const pending = useRef(new Map<string, Pending>());

  const ensureWorker = useCallback((): Worker | null => {
    if (brokenRef.current) return null;
    if (workerRef.current) return workerRef.current;

    try {
      const worker = new Worker(new URL('./uuid.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const message = event.data;
        const entry = pending.current.get(message.id);
        if (!entry) return;
        pending.current.delete(message.id);
        if (message.type === 'error') {
          entry.reject(new Error(message.message));
          return;
        }
        entry.resolve({
          kind: message.kind,
          bytes: message.bytes ? new Uint8Array(message.bytes) : null,
          strings: message.strings,
          count: message.count,
          ms: message.ms,
          duplicates: message.duplicates,
        });
      };
      worker.onerror = () => {
        brokenRef.current = true;
        workerRef.current = null;
        const error = new Error('WORKER_CRASHED');
        pending.current.forEach(entry => entry.reject(error));
        pending.current.clear();
      };
      workerRef.current = worker;
      return worker;
    } catch {
      brokenRef.current = true;
      return null;
    }
  }, []);

  useEffect(
    () => () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      pending.current.clear();
    },
    []
  );

  /**
   * Main-thread path. Only the name-based kinds need hashing, so the wasm
   * module is fetched lazily and only when v3/v5 actually run there.
   */
  const runInline = useCallback(async (request: BatchRequest): Promise<BatchResult> => {
    if (!NAMED_KINDS.includes(request.kind)) return generateBatch(request);
    const { preferNativeDigest } = await import('./wasmDigest');
    return generateBatch(request, preferNativeDigest);
  }, []);

  /** Runs a batch. Falls back to the main thread when no worker is available. */
  const run = useCallback(
    async (request: BatchRequest): Promise<BatchResult> => {
      const worker = ensureWorker();
      if (!worker) return runInline(request);

      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const message: WorkerRequest = { ...request, id };
      return new Promise<BatchResult>((resolve, reject) => {
        pending.current.set(id, { resolve, reject });
        worker.postMessage(message);
      }).catch(error => {
        // A dead worker must not cost the user their click.
        if (brokenRef.current) return runInline(request);
        throw error;
      });
    },
    [ensureWorker, runInline]
  );

  return { run };
}
