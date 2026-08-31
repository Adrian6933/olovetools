// ============================================================================
// CropSnap rendering
// ----------------------------------------------------------------------------
// One renderer for every export path: single crop, batch, padded fit and the
// "all social sizes" pack. Cropper.js only knows about the image currently
// mounted in the editor, so anything that touches a second file has to be able
// to reproduce the same crop from a bitmap and a few numbers.
//
// The crop is stored as a *relative* rect (0–1) inside the rotated image, which
// is what makes "apply this framing to 40 other photos" meaningful when they
// are not all the same size.
// ============================================================================

import type { OutputFormat } from '../types';

export interface RelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type FitMode = 'cover' | 'contain';

export interface RenderOptions {
  source: CanvasImageSource & { width?: number; height?: number };
  sourceWidth: number;
  sourceHeight: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  /** Crop rect relative to the rotated image's bounding box. */
  crop: RelRect;
  outWidth: number;
  outHeight: number;
  /** `contain` letterboxes instead of cutting, filling the gaps with `background`. */
  fit: FitMode;
  /** Painted first. Required for JPEG, and for the bars in `contain` mode. */
  background?: string;
}

/** Bounding box of an image after rotating it by `deg`. */
export function rotatedBounds(width: number, height: number, deg: number): { width: number; height: number } {
  const rad = (deg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  return {
    width: width * cos + height * sin,
    height: width * sin + height * cos,
  };
}

/**
 * Draws the source with its rotation and mirroring applied, then cuts the crop
 * rect out of it at the requested output size.
 */
export function renderCrop(options: RenderOptions): HTMLCanvasElement {
  const bounds = rotatedBounds(options.sourceWidth, options.sourceHeight, options.rotation);

  // 1. The rotated image, at full source resolution.
  const stage = document.createElement('canvas');
  stage.width = Math.max(1, Math.round(bounds.width));
  stage.height = Math.max(1, Math.round(bounds.height));
  const stageCtx = stage.getContext('2d')!;
  stageCtx.imageSmoothingQuality = 'high';
  stageCtx.translate(stage.width / 2, stage.height / 2);
  stageCtx.rotate((options.rotation * Math.PI) / 180);
  stageCtx.scale(options.flipX ? -1 : 1, options.flipY ? -1 : 1);
  stageCtx.drawImage(
    options.source,
    -options.sourceWidth / 2,
    -options.sourceHeight / 2,
    options.sourceWidth,
    options.sourceHeight
  );

  // 2. The crop rect, in the pixels of that rotated stage.
  const sx = options.crop.x * stage.width;
  const sy = options.crop.y * stage.height;
  const sw = Math.max(1, options.crop.width * stage.width);
  const sh = Math.max(1, options.crop.height * stage.height);

  const out = document.createElement('canvas');
  out.width = Math.max(1, Math.round(options.outWidth));
  out.height = Math.max(1, Math.round(options.outHeight));
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';

  if (options.background) {
    ctx.fillStyle = options.background;
    ctx.fillRect(0, 0, out.width, out.height);
  }

  if (options.fit === 'contain') {
    // Letterbox: the whole crop survives and the leftover space is padding.
    const scale = Math.min(out.width / sw, out.height / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    ctx.drawImage(stage, sx, sy, sw, sh, (out.width - dw) / 2, (out.height - dh) / 2, dw, dh);
  } else {
    // Cover: fill the frame, trimming whatever does not fit.
    const scale = Math.max(out.width / sw, out.height / sh);
    const usableW = out.width / scale;
    const usableH = out.height / scale;
    ctx.drawImage(
      stage,
      sx + (sw - usableW) / 2,
      sy + (sh - usableH) / 2,
      usableW,
      usableH,
      0,
      0,
      out.width,
      out.height
    );
  }

  return out;
}

// ---------------------------------------------------------------------------
// Encoding
// ---------------------------------------------------------------------------

export function encode(canvas: HTMLCanvasElement, format: OutputFormat, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('encode failed'))),
      format,
      format === 'image/png' ? undefined : quality
    );
  });
}

export interface TargetSizeResult {
  blob: Blob;
  quality: number;
  /** True when even the lowest quality could not reach the target. */
  missed: boolean;
}

/**
 * Binary-searches the quality that lands just under `maxBytes`. PNG has no
 * quality knob, so the caller gets its single possible answer and a flag.
 */
export async function encodeToTargetBytes(
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  maxBytes: number,
  floorQuality = 0.35
): Promise<TargetSizeResult> {
  if (format === 'image/png') {
    const blob = await encode(canvas, format, 1);
    return { blob, quality: 1, missed: blob.size > maxBytes };
  }

  let low = floorQuality;
  let high = 1;
  let best = await encode(canvas, format, high);
  let bestQuality = high;

  if (best.size <= maxBytes) return { blob: best, quality: high, missed: false };

  // Eight steps put us within ~0.3% of the crossover, which is well below the
  // granularity the encoder itself offers.
  for (let i = 0; i < 8; i++) {
    const mid = (low + high) / 2;
    const candidate = await encode(canvas, format, mid);
    if (candidate.size <= maxBytes) {
      best = candidate;
      bestQuality = mid;
      low = mid;
    } else {
      high = mid;
    }
  }

  if (best.size > maxBytes) {
    const floor = await encode(canvas, format, floorQuality);
    return { blob: floor, quality: floorQuality, missed: floor.size > maxBytes };
  }
  return { blob: best, quality: bestQuality, missed: false };
}

// ---------------------------------------------------------------------------
// Physical resolution metadata
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * Canvas exports carry no physical resolution, so an "A4 at 300 dpi" file has
 * the right pixel count and still opens as a 87×124 cm page in a print shop.
 * Writing the density back in is a few bytes in both containers.
 */
export async function withDpi(blob: Blob, format: OutputFormat, dpi: number): Promise<Blob> {
  if (!dpi || dpi <= 0) return blob;
  const bytes = new Uint8Array(await blob.arrayBuffer());

  if (format === 'image/png') {
    // pHYs: pixels per metre, and unit 1 meaning metres.
    const ppm = Math.round(dpi / 0.0254);
    const chunk = new Uint8Array(21);
    const view = new DataView(chunk.buffer);
    view.setUint32(0, 9); // data length
    chunk.set([0x70, 0x48, 0x59, 0x73], 4); // "pHYs"
    view.setUint32(8, ppm);
    view.setUint32(12, ppm);
    chunk[16] = 1;
    view.setUint32(17, crc32(chunk.subarray(4, 17)));

    // Must sit before IDAT; right after IHDR is the conventional spot.
    const ihdrEnd = 8 + 4 + 4 + 13 + 4;
    const out = new Uint8Array(bytes.length + chunk.length);
    out.set(bytes.subarray(0, ihdrEnd), 0);
    out.set(chunk, ihdrEnd);
    out.set(bytes.subarray(ihdrEnd), ihdrEnd + chunk.length);
    return new Blob([out], { type: format });
  }

  if (format === 'image/jpeg') {
    // The JFIF APP0 segment is always the first one Chrome writes; patch its
    // density units and values in place.
    if (bytes[2] === 0xff && bytes[3] === 0xe0) {
      const view = new DataView(bytes.buffer);
      bytes[13] = 1; // units = dots per inch
      view.setUint16(14, Math.round(dpi));
      view.setUint16(16, Math.round(dpi));
      return new Blob([bytes], { type: format });
    }
  }

  return blob;
}

// ---------------------------------------------------------------------------
// Auto-trim
// ---------------------------------------------------------------------------

/**
 * Finds the content inside a uniform border — transparent padding on a cutout,
 * or the white margin around a scan. Returns a relative rect so it can feed
 * straight back into the selection.
 */
export function findContentBounds(
  source: CanvasImageSource,
  width: number,
  height: number,
  tolerance = 12
): RelRect | null {
  // Sampling at a reduced size keeps a 40 MP scan from allocating 160 MB.
  const scale = Math.min(1, 900 / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  const at = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    return [data[i], data[i + 1], data[i + 2], data[i + 3]];
  };
  // The four corners vote on what "background" means here.
  const corners = [at(0, 0), at(w - 1, 0), at(0, h - 1), at(w - 1, h - 1)];
  const transparent = corners.every(c => c[3] < 16);
  const base = corners[0];

  const isBackground = (x: number, y: number) => {
    const p = at(x, y);
    if (transparent) return p[3] < 16;
    if (p[3] < 16) return true;
    return (
      Math.abs(p[0] - base[0]) <= tolerance &&
      Math.abs(p[1] - base[1]) <= tolerance &&
      Math.abs(p[2] - base[2]) <= tolerance
    );
  };

  let top = 0;
  let bottom = h - 1;
  let left = 0;
  let right = w - 1;
  const rowIsBackground = (y: number) => {
    for (let x = 0; x < w; x++) if (!isBackground(x, y)) return false;
    return true;
  };
  const colIsBackground = (x: number) => {
    for (let y = top; y <= bottom; y++) if (!isBackground(x, y)) return false;
    return true;
  };

  while (top < bottom && rowIsBackground(top)) top++;
  while (bottom > top && rowIsBackground(bottom)) bottom--;
  while (left < right && colIsBackground(left)) left++;
  while (right > left && colIsBackground(right)) right--;

  // Nothing to trim, or the image is entirely background.
  if (top === 0 && left === 0 && bottom === h - 1 && right === w - 1) return null;
  if (right <= left || bottom <= top) return null;

  return {
    x: left / w,
    y: top / h,
    width: (right - left + 1) / w,
    height: (bottom - top + 1) / h,
  };
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

/** Decodes a file into an <img>, honouring the EXIF orientation flag. */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('decode failed'));
    image.src = url;
  });
}
