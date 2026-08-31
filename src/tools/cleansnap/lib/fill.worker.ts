// ============================================================================
// El worker de relleno
// ----------------------------------------------------------------------------
// La propagación de parches es cara por definición: por cada píxel del hueco
// recorre una ventana de búsqueda entera. En el hilo principal eso congelaba
// la pestaña —medido: 1.055 ms para una marca de 300x80 y más de 30 segundos
// para un objeto de 700x500—, y el `setTimeout(30)` que había antes de empezar
// sólo servía para que el spinner apareciera; girar, no giraba.
//
// Aquí el trabajo va fuera, informa del avance de verdad y se puede cancelar.
// Los píxeles viajan como buffer transferido, sin copias.
// ============================================================================

import {
  blurFill, createPatchSession, featherEdges, growMask, pixelateFill, smoothFill, stepPatch,
} from './inpaint';
import type { Mask, Plane } from './inpaint';
import type { FillSettings } from './types';

export interface FillRequest {
  kind: 'fill';
  id: string;
  pixels: Uint8ClampedArray;
  mask: Uint8Array;
  width: number;
  height: number;
  settings: FillSettings;
}

export interface CancelRequest {
  kind: 'cancel';
  id: string;
}

export type WorkerRequest = FillRequest | CancelRequest;

export type WorkerResponse =
  | { kind: 'progress'; id: string; done: number; remaining: number }
  | { kind: 'done'; id: string; pixels: Uint8ClampedArray; ms: number; cancelled: boolean }
  | { kind: 'error'; id: string; error: string };

/** Peticiones que el hilo principal ha cancelado mientras corrían. */
const cancelled = new Set<string>();

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;

  if (request.kind === 'cancel') {
    cancelled.add(request.id);
    return;
  }

  const started = Date.now();
  try {
    const plane: Plane = { data: request.pixels, width: request.width, height: request.height };
    const settings = request.settings;

    let mask: Mask = request.mask;
    if (settings.grow !== 0) {
      mask = growMask(mask, request.width, request.height, settings.grow);
    }

    // El avance se manda con freno: sin él, una máscara grande genera miles de
    // postMessage y la cola de mensajes cuesta más que el propio relleno.
    let lastPost = 0;
    const report = (done: number, remaining: number) => {
      const now = Date.now();
      if (now - lastPost < 80) return;
      lastPost = now;
      const message: WorkerResponse = { kind: 'progress', id: request.id, done, remaining };
      self.postMessage(message);
    };

    if (settings.method === 'patch') {
      // Por tramos con presupuesto de tiempo: entre tramo y tramo se cede el
      // control al bucle de eventos, que es el único momento en que el worker
      // puede leer un "cancela" de la cola.
      const session = createPatchSession(plane, mask, settings);
      if (session) {
        for (;;) {
          const step = stepPatch(session, 60);
          report(step.progress.done, step.progress.remaining);
          if (step.done || cancelled.has(request.id)) break;
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    } else if (settings.method === 'smooth') {
      smoothFill(plane, mask, p => report(p.done, p.remaining));
    } else if (settings.method === 'blur') {
      blurFill(plane, mask, settings.strength);
    } else {
      pixelateFill(plane, mask, settings.strength);
    }

    // El difuminado del contorno sólo tiene sentido cuando se ha reconstruido;
    // sobre un mosaico deliberado sólo lo emborronaría.
    if (settings.feather > 0 && (settings.method === 'patch' || settings.method === 'smooth')) {
      featherEdges(plane, mask, settings.feather);
    }

    const wasCancelled = cancelled.has(request.id);
    cancelled.delete(request.id);
    const response: WorkerResponse = {
      kind: 'done', id: request.id, pixels: request.pixels,
      ms: Date.now() - started, cancelled: wasCancelled,
    };
    self.postMessage(response, [request.pixels.buffer as ArrayBuffer]);
  } catch (error) {
    cancelled.delete(request.id);
    self.postMessage({
      kind: 'error', id: request.id,
      error: error instanceof Error ? error.message : 'unknown',
    } as WorkerResponse);
  }
};
