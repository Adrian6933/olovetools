// ============================================================================
// Engine plumbing
// ----------------------------------------------------------------------------
// Runs the pixel pass in a worker when the browser allows it, and degrades to
// the main thread when it does not (hardened browsers block module workers
// outright; OffscreenCanvas is missing on older Safari).
//
// `quantize.ts` is a few kilobytes of pure maths with no dependencies, so
// importing it in both paths does not duplicate anything meaningful in the
// bundle — the usual reason to avoid a static fallback import.
// ============================================================================

import { buildHistogram, type Histogram, type Quality } from './quantize';

let worker: Worker | null = null;
let workerBroken = false;
let nextId = 1;

interface Pending {
  resolve: (hist: Histogram) => void;
  reject: (err: unknown) => void;
}

const pending = new Map<number, Pending>();

function getWorker(): Worker | null {
  if (workerBroken) return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL('./histogram.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<{ id: number; hist?: Histogram; error?: string }>) => {
      const entry = pending.get(event.data.id);
      if (!entry) return;
      pending.delete(event.data.id);
      if (event.data.hist) entry.resolve(event.data.hist);
      else entry.reject(new Error(event.data.error || 'worker-failed'));
    };
    worker.onerror = () => {
      workerBroken = true;
      for (const entry of pending.values()) entry.reject(new Error('worker-error'));
      pending.clear();
      worker?.terminate();
      worker = null;
    };
    return worker;
  } catch {
    workerBroken = true;
    return null;
  }
}

/** Main-thread path. Only reached when the worker is unavailable. */
function histogramInline(bitmap: ImageBitmap, quality: Quality): Histogram {
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('no-context');
  ctx.drawImage(bitmap, 0, 0);
  const data = ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;
  return buildHistogram(data, quality);
}

/**
 * Builds the histogram for an image.
 *
 * The bitmap is cloned before it goes to the worker: the worker closes what it
 * receives, and the caller still needs the original alive for the canvas, the
 * eyedropper and the recoloured preview.
 */
export async function runHistogram(bitmap: ImageBitmap, quality: Quality): Promise<Histogram> {
  const w = typeof OffscreenCanvas !== 'undefined' ? getWorker() : null;

  if (!w) return histogramInline(bitmap, quality);

  let clone: ImageBitmap;
  try {
    clone = await createImageBitmap(bitmap);
  } catch {
    return histogramInline(bitmap, quality);
  }

  const id = nextId++;
  try {
    return await new Promise<Histogram>((resolve, reject) => {
      pending.set(id, { resolve, reject });
      w.postMessage({ id, bitmap: clone, quality }, [clone]);
    });
  } catch {
    pending.delete(id);
    return histogramInline(bitmap, quality);
  }
}

export function disposeEngine(): void {
  worker?.terminate();
  worker = null;
  pending.clear();
}
