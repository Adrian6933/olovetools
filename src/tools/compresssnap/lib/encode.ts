// ============================================================================
// The encoder
// ----------------------------------------------------------------------------
// Runs unchanged in a Worker or on the main thread: it touches `OffscreenCanvas`
// when there is one and a DOM canvas otherwise, and never anything else from
// `document`. That is what lets the same code be the worker body and its own
// fallback, instead of two implementations that drift apart.
//
// Three things the old one-liner could not do:
//   * hit a byte budget, which needs a search rather than a single encode;
//   * make a PNG smaller, which needs the pixels, not a quality argument;
//   * say what the compression cost, which needs decoding the result back.
// ============================================================================

import type { CompressSettings, EncodeResponse, OutputFormat } from './types';
import { compareSsim } from './metrics';
import { applyPalette, buildPalette, countColors } from './quantize';

// ----------------------------------------------------------------------------
// Canvas abstraction
// ----------------------------------------------------------------------------

interface Surface {
  canvas: OffscreenCanvas | HTMLCanvasElement;
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
}

function makeSurface(width: number, height: number): Surface {
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) throw new Error('offscreen-2d-unavailable');
    return { canvas, ctx: ctx as OffscreenCanvasRenderingContext2D };
  }
  if (typeof document === 'undefined') throw new Error('no-canvas');
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas-2d-unavailable');
  return { canvas, ctx };
}

function toBlob(surface: Surface, mime: string, quality: number): Promise<Blob> {
  const canvas = surface.canvas as OffscreenCanvas;
  if (typeof OffscreenCanvas !== 'undefined' && canvas.convertToBlob) {
    return canvas.convertToBlob({ type: mime, quality });
  }
  return new Promise((resolve, reject) => {
    (surface.canvas as HTMLCanvasElement).toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('encode-failed'))),
      mime,
      quality
    );
  });
}

// ----------------------------------------------------------------------------
// Format support
// ----------------------------------------------------------------------------

const CANDIDATES: OutputFormat[] = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
let supportCache: Promise<OutputFormat[]> = null;

/**
 * Asks the encoder rather than the user agent string. A browser that cannot
 * write AVIF silently hands back a PNG from `toBlob`, so the only reliable
 * test is to encode one pixel and look at what came out.
 */
export function supportedFormats(): Promise<OutputFormat[]> {
  if (supportCache) return supportCache;
  supportCache = (async () => {
    const surface = makeSurface(2, 2);
    surface.ctx.fillStyle = '#123456';
    surface.ctx.fillRect(0, 0, 2, 2);
    const out: OutputFormat[] = ['original'];
    for (const mime of CANDIDATES) {
      try {
        const blob = await toBlob(surface, mime, 0.8);
        if (blob && blob.type === mime) out.push(mime);
      } catch {
        /* Unsupported formats throw or fall back; either way they are out. */
      }
    }
    return out;
  })();
  return supportCache;
}

// ----------------------------------------------------------------------------
// Geometry
// ----------------------------------------------------------------------------

/**
 * Browsers refuse to allocate a canvas past a surface limit that varies by
 * engine (Safari is the strictest). Clamping here turns "the tab died" into
 * "the image was capped", which is a result the user can see and accept.
 */
export const MAX_SIDE = 16384;
export const MAX_PIXELS = 40e6;

export function targetSize(
  width: number,
  height: number,
  settings: CompressSettings
): { width: number; height: number } {
  // Inputs normally come from ImageBitmap, but settings can also be restored
  // from an old local session or edited through automation. Keep invalid or
  // fractional dimensions from turning the aspect-ratio branch into NaN and
  // making canvas allocation fail later.
  // Do not cap the source before applying a resize. A 20 000px-wide panorama
  // scaled to 50% is a perfectly valid 10 000px export; capping it first
  // squashes only the long side and changes its aspect ratio.
  const sourceWidth = Math.max(1, Math.floor(Number.isFinite(width) ? width : 1));
  const sourceHeight = Math.max(1, Math.floor(Number.isFinite(height) ? height : 1));
  let w = sourceWidth;
  let h = sourceHeight;

  if (settings.resizeMode === 'scale') {
    const factor = Math.max(1, Math.min(100, Number.isFinite(settings.scale) ? settings.scale : 100)) / 100;
    w = Math.round(sourceWidth * factor);
    h = Math.round(sourceHeight * factor);
  } else if (settings.resizeMode === 'longEdge') {
    const longest = Math.max(sourceWidth, sourceHeight);
    const requested = Number.isFinite(settings.longEdge) ? settings.longEdge : 0;
    if (requested > 0 && longest > requested) {
      const factor = requested / longest;
      w = Math.round(sourceWidth * factor);
      h = Math.round(sourceHeight * factor);
    }
  } else if (settings.resizeMode === 'dimensions') {
    const boxW = Math.max(1, Math.min(MAX_SIDE, Math.floor(Number.isFinite(settings.width) ? settings.width : 1)));
    const boxH = Math.max(1, Math.min(MAX_SIDE, Math.floor(Number.isFinite(settings.height) ? settings.height : 1)));
    if (settings.maintainAspectRatio) {
      const ratio = sourceWidth / sourceHeight;
      // `contain`, not `cover`: the whole image has to fit inside the box the
      // user typed, or the crop is a surprise.
      if (boxW / boxH > ratio) {
        h = boxH;
        w = Math.round(h * ratio);
      } else {
        w = boxW;
        h = Math.round(w / ratio);
      }
    } else {
      w = boxW;
      h = boxH;
    }
  }

  w = Math.max(1, Math.min(MAX_SIDE, w));
  h = Math.max(1, Math.min(MAX_SIDE, h));
  if (w * h > MAX_PIXELS) {
    // Floor, not round: rounding both sides up can land back over the cap by a
    // few thousand pixels, and the cap exists precisely so the allocation
    // cannot fail.
    const factor = Math.sqrt(MAX_PIXELS / (w * h));
    w = Math.max(1, Math.floor(w * factor));
    h = Math.max(1, Math.floor(h * factor));
  }
  return { width: w, height: h };
}

function resolveMime(settings: CompressSettings, sourceMime: string): string {
  if (settings.format !== 'original') return settings.format;
  // "Original" for something we cannot write back (HEIC, TIFF, SVG, BMP)
  // means "keep it a photo", and JPEG is the safe photographic default.
  if (CANDIDATES.indexOf(sourceMime as OutputFormat) !== -1) return sourceMime;
  return 'image/jpeg';
}

// ----------------------------------------------------------------------------
// Encoding
// ----------------------------------------------------------------------------

function draw(bitmap: ImageBitmap, width: number, height: number, mime: string): Surface {
  const surface = makeSurface(width, height);
  const ctx = surface.ctx as CanvasRenderingContext2D;
  // JPEG has no alpha: without this the transparent parts come out black
  // instead of white, which is the single most reported "bug" of every
  // PNG-to-JPEG converter.
  if (mime === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap as unknown as CanvasImageSource, 0, 0, width, height);
  return surface;
}

/** Number of encodes the byte-budget search is allowed. */
const MAX_ATTEMPTS = 8;

export async function encode(
  bitmap: ImageBitmap,
  settings: CompressSettings,
  sourceMime: string
): Promise<EncodeResponse> {
  const started = Date.now();
  const { width, height } = targetSize(bitmap.width, bitmap.height, settings);
  const mime = resolveMime(settings, sourceMime);

  const surface = draw(bitmap, width, height, mime);

  // --- PNG: quality does nothing, colour count does everything -------------
  if (mime === 'image/png' && settings.pngColors > 0) {
    const ctx = surface.ctx as CanvasRenderingContext2D;
    const image = ctx.getImageData(0, 0, width, height);
    // Quantising something that already has fewer colours than the target only
    // adds dithering noise and makes the file bigger.
    if (countColors(image.data) > settings.pngColors) {
      const palette = buildPalette(image.data, Math.max(2, Math.min(256, settings.pngColors)));
      applyPalette(image, palette, settings.dither);
      ctx.putImageData(image, 0, 0);
    }
  }

  let blob: Blob;
  let quality = Math.max(1, Math.min(100, settings.quality)) / 100;
  let attempts = 1;

  const lossless = mime === 'image/png';

  if (settings.targetBytes && settings.targetBytes > 0 && !lossless) {
    // Bisection on quality. The relationship between quality and bytes is
    // monotonic but wildly non-linear, so a search beats any formula — and
    // eight encodes of a resized frame is still well under a second.
    let low = 0.05;
    let high = 0.97;
    let best: Blob = null;
    let bestQuality = low;

    for (attempts = 1; attempts <= MAX_ATTEMPTS; attempts++) {
      const mid = (low + high) / 2;
      const candidate = await toBlob(surface, mime, mid);
      if (candidate.size <= settings.targetBytes) {
        // Under budget: keep it and try to spend the headroom on quality.
        best = candidate;
        bestQuality = mid;
        low = mid;
      } else {
        high = mid;
      }
      if (high - low < 0.02) break;
    }

    // Nothing fit: hand back the smallest we managed rather than nothing, and
    // let the UI say the budget was missed.
    blob = best || (await toBlob(surface, mime, low));
    quality = bestQuality;
  } else {
    blob = await toBlob(surface, mime, lossless ? 1 : quality);
  }

  // --- Measure what it cost -------------------------------------------------
  let ssim: number = null;
  if (settings.measureQuality) {
    try {
      const ctx = surface.ctx as CanvasRenderingContext2D;
      const before = ctx.getImageData(0, 0, width, height);
      const decoded = await createImageBitmap(blob);
      const check = makeSurface(decoded.width, decoded.height);
      (check.ctx as CanvasRenderingContext2D).drawImage(
        decoded as unknown as CanvasImageSource, 0, 0
      );
      const after = (check.ctx as CanvasRenderingContext2D).getImageData(
        0, 0, decoded.width, decoded.height
      );
      ssim = compareSsim(before, after);
      decoded.close();
    } catch {
      // A browser that will not decode what it just encoded is not a reason to
      // throw away a perfectly good compression.
      ssim = null;
    }
  }

  return {
    blob,
    width,
    height,
    mime: blob.type || mime,
    quality: Math.round(quality * 100),
    ssim,
    ms: Date.now() - started,
    attempts,
  };
}
