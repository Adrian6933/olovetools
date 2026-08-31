// ============================================================================
// El worker
// ----------------------------------------------------------------------------
// Guarda los `ImageBitmap` decodificados en su propio mapa: el bitmap se queda
// donde se decodificó y ahí se queda hasta que la imagen sale de la cola. Por
// eso el pool asigna cada imagen a un worker fijo (`slot`) en vez de repartir
// tareas sueltas — un ImageBitmap sólo se puede transferir una vez, y después
// queda inservible en el origen.
//
// Todos los imports son estáticos. Un `import()` dinámico aquí dentro rompe el
// build: el worker se empaqueta como IIFE y no admite carga diferida.
// ============================================================================

import { makeThumbnail, runEncode } from './encode';
import type { RawPixels } from './encode';
import type { Settings } from './types';

export interface LoadRequest {
  kind: 'load';
  id: string;
  blob: Blob;
  /** Lado mayor de la miniatura, o 0 para no generarla. */
  thumb: number;
}

export interface EncodeRequest {
  kind: 'encode';
  id: string;
  settings: Settings;
}

export interface ReleaseRequest {
  kind: 'release';
  id: string;
}

/** La petición tal y como la escribe el pool, sin el testigo. */
export type WorkerCall = LoadRequest | EncodeRequest | ReleaseRequest;

/** El pool identifica cada respuesta por este testigo, no por el id de la
 *  imagen: sobre una misma imagen hay varias peticiones en vuelo a la vez. */
export type WorkerRequest = WorkerCall & { token: string };

export type WorkerResponse = { token: string } & (
  | { kind: 'load'; id: string; ok: true; width: number; height: number; thumb: Blob | null }
  | {
      kind: 'encode'; id: string; ok: true; blob: Blob; rgba: RawPixels | null;
      width: number; height: number; mime: string; quality: number;
      ssim: number | null; ms: number; attempts: number; missedTarget: boolean;
      detail: 'ico-multisize' | null;
    }
  | { kind: 'release'; id: string; ok: true }
  | { kind: 'load' | 'encode' | 'release'; id: string; ok: false; error: string }
);

const bitmaps = new Map<string, ImageBitmap>();

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  const token = request.token;
  try {
    if (request.kind === 'load') {
      // `imageOrientation: 'from-image'` es lo que arregla las fotos de móvil
      // giradas: con un `<img>` desde dataURL, unos navegadores aplican la
      // etiqueta EXIF y otros no, y `drawImage` se quedaba con el original sin
      // girar. Aquí la orientación se resuelve en la descodificación, una vez.
      const bitmap = await createImageBitmap(request.blob, { imageOrientation: 'from-image' });
      const previous = bitmaps.get(request.id);
      if (previous) previous.close();
      bitmaps.set(request.id, bitmap);
      const thumb = request.thumb > 0 ? await makeThumbnail(bitmap, request.thumb) : null;
      const response: WorkerResponse = {
        kind: 'load', id: request.id, ok: true, token,
        width: bitmap.width, height: bitmap.height, thumb,
      };
      self.postMessage(response);
      return;
    }

    if (request.kind === 'encode') {
      const bitmap = bitmaps.get(request.id);
      if (!bitmap) throw new Error('bitmap-missing');
      const outcome = await runEncode(bitmap, request.settings);
      const response: WorkerResponse = { kind: 'encode', id: request.id, ok: true, token, ...outcome };
      // El buffer del ImageData se transfiere: son 4 bytes por píxel y
      // copiarlo para un TIFF de 24 MP son ~100 MB de más por conversión.
      self.postMessage(response, outcome.rgba ? [outcome.rgba.data.buffer as ArrayBuffer] : []);
      return;
    }

    const bitmap = bitmaps.get(request.id);
    if (bitmap) bitmap.close();
    bitmaps.delete(request.id);
    self.postMessage({ kind: 'release', id: request.id, ok: true, token } as WorkerResponse);
  } catch (error) {
    self.postMessage({
      kind: request.kind, id: request.id, ok: false, token,
      error: error instanceof Error ? error.message : 'unknown',
    } as WorkerResponse);
  }
};
