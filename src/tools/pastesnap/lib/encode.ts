// ============================================================================
// Cliente de codificación
// ----------------------------------------------------------------------------
// Habla con el worker y, si el worker no arranca, hace el mismo trabajo en el
// hilo principal. El fallback no es relleno defensivo: `new Worker(new URL(...))`
// falla en algunos entornos (extensiones que bloquean blobs, CSP estrictas), y
// sin él la herramienta se quedaría sin convertir nada.
// ============================================================================

import type { EncodeRequest, EncodeResponse } from './encode.worker';
import { getFormat, type FormatId } from './formats';

export interface EncodeOptions {
  format: FormatId;
  /** 0-1. Los formatos sin pérdida lo ignoran. */
  quality: number;
  /** Lado mayor máximo en px. 0 = original. */
  maxDimension: number;
  /** Color contra el que aplanar la transparencia en formatos sin alfa. */
  background: string;
}

export interface EncodeResult {
  blob: Blob;
  width: number;
  height: number;
}

let worker: Worker | null = null;
let workerBroken = false;

function getWorker(): Worker | null {
  if (workerBroken) return null;
  if (!worker) {
    try {
      worker = new Worker(new URL('./encode.worker.ts', import.meta.url), { type: 'module' });
      worker.onerror = () => {
        workerBroken = true;
        worker = null;
      };
    } catch {
      workerBroken = true;
      return null;
    }
  }
  return worker;
}

function targetSize(width: number, height: number, maxDimension: number) {
  if (!maxDimension || Math.max(width, height) <= maxDimension) return { width, height };
  const scale = maxDimension / Math.max(width, height);
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** Misma operación que el worker, en el hilo principal. */
async function encodeOnMainThread(bitmap: ImageBitmap, options: EncodeOptions): Promise<EncodeResult> {
  const format = getFormat(options.format);
  const size = targetSize(bitmap.width, bitmap.height, options.maxDimension);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no-2d-context');
  if (format.needsFlatten) {
    ctx.fillStyle = options.background;
    ctx.fillRect(0, 0, size.width, size.height);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, size.width, size.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>(resolve =>
    canvas.toBlob(resolve, format.mime, format.lossy ? options.quality : undefined)
  );
  if (!blob) throw new Error('encode-failed');
  return { blob, width: size.width, height: size.height };
}

let requestCounter = 0;

/**
 * Codifica un bitmap. CONSUME el bitmap (lo cierra o lo transfiere), así que no
 * se puede reutilizar después: quien necesite varias salidas debe decodificar
 * una vez por salida.
 */
export function encodeBitmap(bitmap: ImageBitmap, options: EncodeOptions): Promise<EncodeResult> {
  const format = getFormat(options.format);
  const instance = getWorker();
  if (!instance) return encodeOnMainThread(bitmap, options);

  const id = `enc-${++requestCounter}`;
  return new Promise<EncodeResult>((resolve, reject) => {
    const onMessage = (event: MessageEvent<EncodeResponse>) => {
      if (event.data.id !== id) return;
      instance.removeEventListener('message', onMessage);
      if (event.data.ok && event.data.blob) {
        resolve({
          blob: event.data.blob,
          width: event.data.width || 0,
          height: event.data.height || 0,
        });
      } else {
        reject(new Error(event.data.error || 'encode-failed'));
      }
    };
    instance.addEventListener('message', onMessage);

    const request: EncodeRequest = {
      id,
      bitmap,
      mime: format.mime,
      quality: format.lossy ? options.quality : 1,
      maxDimension: options.maxDimension,
      flatten: format.needsFlatten ? options.background : null,
    };
    // El bitmap viaja transferido: cero copias de píxeles entre hilos.
    instance.postMessage(request, [bitmap]);
  });
}

/** Cierra el worker. Útil al desmontar para no dejar el hilo vivo. */
export function disposeEncoder(): void {
  worker?.terminate();
  worker = null;
  workerBroken = false;
}
