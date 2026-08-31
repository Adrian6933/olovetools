import type { TraceOptions, TracedPath } from './trace';

// ============================================================================
// Runs the tracer off the main thread when the browser allows it, and falls
// back to a synchronous run when it does not (module workers are still blocked
// in a few embedded webviews). Either way the caller gets the same promise.
// ============================================================================

export interface TraceResult {
  paths: TracedPath[];
  /** Wall-clock time of the trace itself, surfaced in the UI so the setting is measurable. */
  ms: number;
  /** True when the work happened on a worker thread. */
  offThread: boolean;
}

/** Downscales to keep the trace fast and the contours meaningful. */
export const TRACE_MAX_SIDE = 900;

export function imageDataFor(img: HTMLImageElement): { data: ImageData; scale: number } | null {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h) return null;

  const scale = Math.min(1, TRACE_MAX_SIDE / Math.max(w, h));
  const cw = Math.max(2, Math.round(w * scale));
  const ch = Math.max(2, Math.round(h * scale));

  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, cw, ch);
  return { data: ctx.getImageData(0, 0, cw, ch), scale };
}

function runInWorker(image: ImageData, opts: TraceOptions): Promise<TracedPath[]> {
  return new Promise((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL('./trace.worker.ts', import.meta.url), { type: 'module' });
    } catch (error) {
      reject(error);
      return;
    }
    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error('timeout'));
    }, 30000);

    worker.onmessage = (event: MessageEvent<{ ok: boolean; paths?: TracedPath[]; error?: string }>) => {
      clearTimeout(timeout);
      worker.terminate();
      if (event.data.ok && event.data.paths) resolve(event.data.paths);
      else reject(new Error(event.data.error || 'trace failed'));
    };
    worker.onerror = error => {
      clearTimeout(timeout);
      worker.terminate();
      reject(error);
    };

    worker.postMessage({ image, opts });
  });
}

export async function runTrace(image: ImageData, opts: TraceOptions): Promise<TraceResult> {
  const started = performance.now();
  try {
    const paths = await runInWorker(image, opts);
    return { paths, ms: Math.round(performance.now() - started), offThread: true };
  } catch {
    const { traceImageData } = await import('./trace');
    const paths = traceImageData(image, opts);
    return { paths, ms: Math.round(performance.now() - started), offThread: false };
  }
}
