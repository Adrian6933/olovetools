// ============================================================================
// Pool de workers
// ----------------------------------------------------------------------------
// Cada imagen queda asignada a un worker fijo, porque su `ImageBitmap` vive
// dentro de ese worker. Repartir por tarea obligaría a mandar el archivo entero
// otra vez en cada conversión, que es exactamente lo que hacía el motor viejo.
//
// El plan B en el hilo principal no es relleno defensivo: `new Worker(new
// URL(...))` falla de plano con una CSP sin `worker-src`, y una herramienta que
// sólo sabe hablar con un worker no hace absolutamente nada en esas páginas.
// ============================================================================

import { useCallback, useEffect, useRef } from 'react';
import { makeThumbnail, runEncode } from './encode';
import type { EncodeOutcome } from './encode';
import type { WorkerCall, WorkerResponse } from './convert.worker';
import type { Settings } from './types';

/** Cuatro es donde deja de notarse la ganancia y empieza a notarse la RAM. */
const MAX_WORKERS = 4;

export interface LoadOutcome {
  width: number;
  height: number;
  thumb: Blob | null;
  slot: number;
}

export function useConverter() {
  const workers = useRef<(Worker | null)[]>([]);
  const pending = useRef<Map<string, (response: WorkerResponse) => void>>(new Map());
  const bitmaps = useRef<Map<string, ImageBitmap>>(new Map());
  const disabled = useRef(false);
  const nextSlot = useRef(0);
  const counter = useRef(0);

  const poolSize = useRef(
    Math.max(1, Math.min(MAX_WORKERS, (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 2))
  );

  const workerAt = useCallback((slot: number): Worker | null => {
    if (disabled.current || typeof Worker === 'undefined') return null;
    const existing = workers.current[slot];
    if (existing) return existing;
    try {
      const worker = new Worker(new URL('./convert.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const token = event.data.token;
        const resolve = pending.current.get(token);
        if (!resolve) return;
        pending.current.delete(token);
        resolve(event.data);
      };
      worker.onerror = () => {
        disabled.current = true;
        // Cada petición en vuelo tiene que soltarse, o la cola se queda
        // esperando para siempre a un worker que ya no existe.
        pending.current.forEach((resolve, token) => {
          pending.current.delete(token);
          resolve({ kind: 'encode', id: token, token, ok: false, error: 'worker-failed' });
        });
      };
      workers.current[slot] = worker;
      return worker;
    } catch {
      disabled.current = true;
      return null;
    }
  }, []);

  const ask = useCallback(
    (slot: number, request: WorkerCall, transfer: Transferable[] = []): Promise<WorkerResponse> | null => {
      const worker = workerAt(slot);
      if (!worker) return null;
      const token = `t${counter.current++}`;
      return new Promise(resolve => {
        pending.current.set(token, resolve);
        worker.postMessage({ ...request, token }, transfer);
      });
    },
    [workerAt]
  );

  // --- Carga ----------------------------------------------------------------

  const load = useCallback(
    async (id: string, blob: Blob, thumb = 256): Promise<LoadOutcome> => {
      const slot = nextSlot.current % poolSize.current;
      nextSlot.current++;
      const response = await ask(slot, { kind: 'load', id, blob, thumb });
      if (response && response.ok && response.kind === 'load') {
        return { width: response.width, height: response.height, thumb: response.thumb, slot };
      }
      // Plan B: descodificar aquí y guardarnos el bitmap nosotros.
      const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
      const previous = bitmaps.current.get(id);
      if (previous) previous.close();
      bitmaps.current.set(id, bitmap);
      return {
        width: bitmap.width,
        height: bitmap.height,
        thumb: thumb > 0 ? await makeThumbnail(bitmap, thumb) : null,
        slot: -1,
      };
    },
    [ask]
  );

  // --- Conversión -----------------------------------------------------------

  const convert = useCallback(
    async (id: string, slot: number, settings: Settings): Promise<EncodeOutcome> => {
      if (slot >= 0) {
        const response = await ask(slot, { kind: 'encode', id, settings });
        if (response && response.ok && response.kind === 'encode') {
          const { kind, id: _id, ok, ...outcome } = response as any;
          return outcome as EncodeOutcome;
        }
        // Sin `strictNullChecks` el booleano `ok` no estrecha la unión, así
        // que el error se lee por presencia de la propiedad.
        const failure = (response as any) && (response as any).error as string;
        if (failure && failure !== 'worker-failed') throw new Error(failure);
      }
      const bitmap = bitmaps.current.get(id);
      if (!bitmap) throw new Error('bitmap-missing');
      return runEncode(bitmap, settings);
    },
    [ask]
  );

  const release = useCallback(
    (id: string, slot: number) => {
      if (slot >= 0) ask(slot, { kind: 'release', id });
      const bitmap = bitmaps.current.get(id);
      if (bitmap) {
        bitmap.close();
        bitmaps.current.delete(id);
      }
    },
    [ask]
  );

  useEffect(() => {
    const pool = workers.current;
    const local = bitmaps.current;
    return () => {
      pool.forEach(worker => worker && worker.terminate());
      local.forEach(bitmap => bitmap.close());
      local.clear();
    };
  }, []);

  return { load, convert, release, poolSize: poolSize.current };
}
