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
let encoderVersion = 0;

function getWorker(): Worker | null {
  if (workerBroken) return null;
  if (!worker) {
    try {
      const instance = new Worker(new URL('./encode.worker.ts', import.meta.url), { type: 'module' });
      worker = instance;
      instance.onerror = () => {
        if (worker !== instance) return;
        workerBroken = true;
        instance.terminate();
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
  if (blob.type !== format.mime) throw new Error('unsupported-format');
  return { blob, width: size.width, height: size.height };
}

let requestCounter = 0;

/**
 * Codifica un bitmap. CONSUME el bitmap (lo cierra o lo transfiere), así que no
 * se puede reutilizar después: quien necesite varias salidas debe decodificar
 * una vez por salida.
 */
export async function encodeBitmap(bitmap: ImageBitmap, options: EncodeOptions): Promise<EncodeResult> {
  const format = getFormat(options.format);
  const instance = getWorker();
  if (!instance) return encodeOnMainThread(bitmap, options);

  // Keep the source alive until the worker succeeds. A worker can fail after
  // postMessage (CSP, unavailable OffscreenCanvas, a failed module download),
  // when its transferred bitmap can no longer be recovered.
  let transferable: ImageBitmap;
  const version = encoderVersion;
  try { transferable = await createImageBitmap(bitmap); }
  catch { return encodeOnMainThread(bitmap, options); }
  if (version !== encoderVersion) {
    transferable.close();
    bitmap.close();
    throw new DOMException('Encoder disposed', 'AbortError');
  }
  if (instance !== worker || workerBroken) {
    transferable.close();
    return encodeOnMainThread(bitmap, options);
  }
  const id = `enc-${++requestCounter}`;
  try {
    const result = await new Promise<EncodeResult>((resolve, reject) => {
      const cleanup = () => {
        instance.removeEventListener('message', onMessage);
        instance.removeEventListener('error', onError);
        instance.removeEventListener('messageerror', onError);
        pending.delete(id);
      };
      const fail = (error: Error) => { cleanup(); reject(error); };
      const onError = () => {
        if (worker === instance) { workerBroken = true; instance.terminate(); worker = null; }
        fail(new Error('worker-failed'));
      };
      const onMessage = (event: MessageEvent<EncodeResponse>) => {
        if (event.data.id !== id) return;
        cleanup();
        if (event.data.ok && event.data.blob?.type === format.mime) {
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
      instance.addEventListener('error', onError);
      instance.addEventListener('messageerror', onError);
      pending.set(id, fail);

      const request: EncodeRequest = {
        id,
        bitmap: transferable,
        mime: format.mime,
        quality: format.lossy ? options.quality : 1,
        maxDimension: options.maxDimension,
        flatten: format.needsFlatten ? options.background : null,
      };
      // El bitmap viaja transferido: cero copias de píxeles entre hilos.
      try { instance.postMessage(request, [transferable]); }
      catch { transferable.close(); fail(new Error('worker-failed')); }
    });
    bitmap.close();
    return result;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      bitmap.close();
      throw error;
    }
    return encodeOnMainThread(bitmap, options);
  }
}

const pending = new Map<string, (error: Error) => void>();

/** Cierra el worker. Útil al desmontar para no dejar el hilo vivo. */
export function disposeEncoder(): void {
  encoderVersion++;
  for (const fail of [...pending.values()]) fail(new DOMException('Encoder disposed', 'AbortError'));
  worker?.terminate();
  worker = null;
  workerBroken = false;
}
