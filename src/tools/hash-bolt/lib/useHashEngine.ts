import { useCallback, useEffect, useRef } from 'react';
import type { AlgoId } from './algorithms';
import type { HashDone, HashRequest, HashResponse } from './hash.worker';

interface Pending {
  resolve: (value: HashDone | null) => void;
  reject: (error: Error) => void;
  onProgress?: (loaded: number, total: number, bytesPerSecond: number) => void;
}

/**
 * Thin promise wrapper around the hashing worker. One worker for the whole
 * page: it queues internally, survives navigation inside the island, and is
 * torn down on unmount so an abandoned 4 GB run does not keep a core busy.
 */
export function useHashEngine() {
  const workerRef = useRef<Worker | null>(null);
  const pending = useRef(new Map<string, Pending>());

  const ensureWorker = useCallback((): Worker => {
    if (workerRef.current) return workerRef.current;

    const worker = new Worker(new URL('./hash.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<HashResponse>) => {
      const message = event.data;
      const entry = pending.current.get(message.id);
      if (!entry) return;

      if (message.type === 'progress') {
        entry.onProgress?.(message.loaded, message.total, message.bytesPerSecond);
        return;
      }
      pending.current.delete(message.id);
      if (message.type === 'done') entry.resolve(message);
      else if (message.type === 'cancelled') entry.resolve(null);
      else entry.reject(new Error(message.message));
    };
    worker.onerror = event => {
      const error = new Error(event.message || 'The hashing worker crashed.');
      pending.current.forEach(entry => entry.reject(error));
      pending.current.clear();
    };

    workerRef.current = worker;
    return worker;
  }, []);

  useEffect(
    () => () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      pending.current.clear();
    },
    []
  );

  const submit = useCallback(
    (request: Exclude<HashRequest, { type: 'cancel' }>, onProgress?: Pending['onProgress']) =>
      new Promise<HashDone | null>((resolve, reject) => {
        pending.current.set(request.id, { resolve, reject, onProgress });
        ensureWorker().postMessage(request);
      }),
    [ensureWorker]
  );

  const hashFile = useCallback(
    (
      id: string,
      file: File,
      algos: AlgoId[],
      hmacKey: string,
      onProgress?: Pending['onProgress']
    ) => submit({ type: 'file', id, file, algos, hmacKey: hmacKey || undefined }, onProgress),
    [submit]
  );

  const hashBytes = useCallback(
    (id: string, bytes: Uint8Array, algos: AlgoId[], hmacKey: string) =>
      submit({ type: 'bytes', id, bytes, algos, hmacKey: hmacKey || undefined }),
    [submit]
  );

  const cancel = useCallback((id: string) => {
    workerRef.current?.postMessage({ type: 'cancel', id } as HashRequest);
  }, []);

  return { hashFile, hashBytes, cancel };
}
