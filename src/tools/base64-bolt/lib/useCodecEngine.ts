import { useCallback, useEffect, useRef } from 'react';
import type { EncodeOptions } from './base64';
import type { CodecRequest, CodecResponse, DecodeDone, EncodeDone } from './codec.worker';

interface Pending {
  resolve: (value: EncodeDone | DecodeDone | null) => void;
  reject: (error: Error) => void;
  onProgress?: (loaded: number, total: number) => void;
}

/**
 * Promise wrapper around the codec worker. One worker for the whole island: it
 * queues internally and is terminated on unmount, so an abandoned 200 MB encode
 * does not keep a core busy after the user navigates away.
 *
 * The worker is created lazily. Spinning one up on mount would cost every
 * visitor a thread and a module graph for a tool many of them will use only in
 * the text tab, where the work is small enough to stay inline.
 */
export function useCodecEngine() {
  const workerRef = useRef<Worker | null>(null);
  const pending = useRef(new Map<string, Pending>());

  const ensureWorker = useCallback((): Worker => {
    if (workerRef.current) return workerRef.current;

    const worker = new Worker(new URL('./codec.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<CodecResponse>) => {
      const message = event.data;
      const entry = pending.current.get(message.id);
      if (!entry) return;

      if (message.type === 'progress') {
        entry.onProgress?.(message.loaded, message.total);
        return;
      }
      pending.current.delete(message.id);
      if (message.type === 'encoded' || message.type === 'decoded') entry.resolve(message);
      else if (message.type === 'cancelled') entry.resolve(null);
      else entry.reject(new Error(message.code));
    };
    worker.onerror = () => {
      const error = new Error('crashed');
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
    (request: Exclude<CodecRequest, { type: 'cancel' }>, onProgress?: Pending['onProgress']) =>
      new Promise<EncodeDone | DecodeDone | null>((resolve, reject) => {
        pending.current.set(request.id, { resolve, reject, onProgress });
        ensureWorker().postMessage(request);
      }),
    [ensureWorker]
  );

  const encodeFile = useCallback(
    (id: string, file: File, options: EncodeOptions, extras: boolean, onProgress?: Pending['onProgress']) =>
      submit({ type: 'encode', id, file, options, extras }, onProgress) as Promise<EncodeDone | null>,
    [submit]
  );

  const encodeBytesOffThread = useCallback(
    (id: string, bytes: Uint8Array, options: EncodeOptions, extras: boolean) =>
      submit({ type: 'encode', id, bytes, options, extras }) as Promise<EncodeDone | null>,
    [submit]
  );

  const decodeText = useCallback(
    (id: string, text: string, extras: boolean) =>
      submit({ type: 'decode', id, text, extras }) as Promise<DecodeDone | null>,
    [submit]
  );

  const cancel = useCallback((id: string) => {
    workerRef.current?.postMessage({ type: 'cancel', id } as CodecRequest);
  }, []);

  return { encodeFile, encodeBytesOffThread, decodeText, cancel };
}
