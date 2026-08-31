// ============================================================================
// Histogram worker
// ----------------------------------------------------------------------------
// Only the expensive half runs here: decode the bitmap onto an OffscreenCanvas
// and fold ~2 million pixels into a few thousand bins. Solving the palette from
// those bins is a millisecond of work, so it stays on the main thread where the
// UI can call it on every slider tick.
//
// The ImageBitmap arrives as a transfer (zero copy) and the histogram's typed
// arrays go back the same way.
// ============================================================================

import { buildHistogram, type Histogram, type Quality } from './quantize';

interface Request {
  id: number;
  bitmap: ImageBitmap;
  quality: Quality;
}

interface Response {
  id: number;
  hist?: Histogram;
  error?: string;
}

self.onmessage = (event: MessageEvent<Request>) => {
  const { id, bitmap, quality } = event.data;

  try {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('no-context');

    ctx.drawImage(bitmap, 0, 0);
    const data = ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;
    bitmap.close();

    const hist = buildHistogram(data, quality);

    const response: Response = { id, hist };
    (self as unknown as Worker).postMessage(response, [
      hist.index.buffer,
      hist.count.buffer,
      hist.r.buffer,
      hist.g.buffer,
      hist.b.buffer,
    ]);
  } catch (err) {
    const response: Response = { id, error: err instanceof Error ? err.message : 'failed' };
    (self as unknown as Worker).postMessage(response);
  }
};
