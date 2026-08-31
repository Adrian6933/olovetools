// ============================================================================
// Renderer
// ----------------------------------------------------------------------------
// One single drawing routine for the preview and for the export. The previous
// version had two: the canvas drew the meme and a parallel DOM layer drew the
// same text again at a different size, which is why the preview showed a ghost
// and never matched the file you downloaded.
//
// Templates are SVG, so they are rasterised AT the requested size instead of
// being upscaled from a 500 px bitmap — a 4x export is genuinely 4x sharp.
// ============================================================================

import type { BackdropSource, Layer, MemeDoc, StickerLayer, TextLayer } from '../types';
import { STICKERS, stickerSvg, type StickerDef } from './stickers';
import { layoutText, prepareContext } from './text';

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------
export interface CanvasBox {
  width: number;
  height: number;
  /** Height of the white caption bar on top, in canvas pixels. */
  barPx: number;
}

export function canvasBox(doc: MemeDoc): CanvasBox {
  const barPx = Math.round((doc.height * doc.captionBar) / 100);
  return { width: doc.width, height: doc.height + barPx, barPx };
}

/** Unrotated size of a layer, in canvas pixels. */
export function layerSize(layer: Layer, box: CanvasBox): { width: number; height: number } {
  if (layer.kind === 'text') {
    const l = layoutText(layer, box.width, box.height);
    // A little padding so the handles do not sit on the glyphs themselves.
    return { width: l.width + l.fontPx * 0.3, height: l.height + l.fontPx * 0.2 };
  }
  const def = STICKERS[layer.sticker];
  const width = (layer.size / 100) * box.width;
  return { width, height: def ? width / def.ratio : width };
}

// ---------------------------------------------------------------------------
// SVG rasterisation
// ---------------------------------------------------------------------------
function svgAt(source: string, width: number, height: number): string {
  return source.replace(/width="[^"]*"/, `width="${width}"`).replace(/height="[^"]*"/, `height="${height}"`);
}

function loadSvg(source: string, width: number, height: number): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'sync';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('svg'));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgAt(source, width, height))}`;
  });
}

// ---------------------------------------------------------------------------
// Sticker cache
// ----------------------------------------------------------------------------
// Preview uses one fixed-resolution raster per (sticker, colour); the export
// re-rasterises at the exact pixel size so it never upscales.
// ---------------------------------------------------------------------------
const PREVIEW_STICKER_PX = 512;
const stickerCache = new Map<string, HTMLImageElement>();
const stickerPending = new Set<string>();
const stickerListeners = new Set<() => void>();

/** Repaint hook: the stage subscribes so a sticker appears as soon as it decodes. */
export function onStickerReady(cb: () => void): () => void {
  stickerListeners.add(cb);
  return () => stickerListeners.delete(cb);
}

function stickerKey(def: StickerDef, color: string): string {
  return `${def.id}|${def.tintable ? color : '-'}`;
}

/** Cached preview raster, or null while it decodes (a repaint follows). */
export function getStickerRaster(def: StickerDef, color: string): HTMLImageElement | null {
  const key = stickerKey(def, color);
  const hit = stickerCache.get(key);
  if (hit) return hit;
  if (stickerPending.has(key)) return null;

  stickerPending.add(key);
  const height = Math.round(PREVIEW_STICKER_PX / def.ratio);
  loadSvg(stickerSvg(def, color), PREVIEW_STICKER_PX, height)
    .then(img => {
      if (stickerCache.size > 40) stickerCache.clear();
      stickerCache.set(key, img);
      stickerListeners.forEach(cb => cb());
    })
    .catch(() => undefined)
    .finally(() => stickerPending.delete(key));

  return null;
}

/** Rasterises one sticker at an exact pixel size — the exporter never upscales. */
export function rasterizeSticker(
  def: StickerDef,
  color: string,
  width: number,
  height: number
): Promise<HTMLImageElement> {
  return loadSvg(stickerSvg(def, color), Math.max(1, Math.round(width)), Math.max(1, Math.round(height)));
}

/** Warms the cache for every sticker a document uses. */
export function preloadStickers(doc: MemeDoc): void {
  for (const layer of doc.layers) {
    if (layer.kind !== 'sticker') continue;
    const def = STICKERS[layer.sticker];
    if (def) getStickerRaster(def, layer.color);
  }
}

// ---------------------------------------------------------------------------
// Backdrop
// ---------------------------------------------------------------------------
export interface Backdrop {
  image: CanvasImageSource | null;
  width: number;
  height: number;
}

const backdropCache = new Map<string, HTMLImageElement>();

/**
 * Produces the picture that goes under the layers, rasterised for `targetW`.
 * Uploaded images are already bitmaps and are returned as they are.
 */
export async function resolveBackdrop(source: BackdropSource, targetW: number): Promise<Backdrop> {
  if (source.kind === 'image') {
    return { image: source.image, width: source.width, height: source.height };
  }
  if (source.kind === 'blank') {
    return { image: null, width: 1, height: 1 };
  }

  const width = Math.max(64, Math.min(4096, Math.round(targetW)));
  const height = Math.round(width / source.ratio);
  const key = `${source.id}@${width}`;
  const hit = backdropCache.get(key);
  if (hit) return { image: hit, width, height };

  const img = await loadSvg(source.svg, width, height);
  if (backdropCache.size > 12) backdropCache.clear();
  backdropCache.set(key, img);
  return { image: img, width, height };
}

function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  backdrop: Backdrop,
  x: number,
  y: number,
  w: number,
  h: number,
  fit: MemeDoc['fit']
): void {
  if (!backdrop.image || !backdrop.width || !backdrop.height) return;

  if (fit === 'stretch') {
    ctx.drawImage(backdrop.image, x, y, w, h);
    return;
  }

  const scale =
    fit === 'cover'
      ? Math.max(w / backdrop.width, h / backdrop.height)
      : Math.min(w / backdrop.width, h / backdrop.height);
  const dw = backdrop.width * scale;
  const dh = backdrop.height * scale;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(backdrop.image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Layers
// ---------------------------------------------------------------------------
function drawText(ctx: CanvasRenderingContext2D, layer: TextLayer, box: CanvasBox): void {
  const layout = layoutText(layer, box.width, box.height);
  prepareContext(ctx, layer, layout.fontPx);

  const strokePx = (layer.strokeWidth / 100) * layout.fontPx * 2;
  const startY = -layout.height / 2 + layout.lineHeightPx / 2;
  const half = layout.width / 2;
  const anchorX = layer.align === 'left' ? -half : layer.align === 'right' ? half : 0;

  // Shadow rides on the stroke pass so it wraps the outline, not just the fill.
  if (layer.shadow > 0) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.65)';
    ctx.shadowBlur = (layer.shadow / 100) * layout.fontPx;
    ctx.shadowOffsetY = (layer.shadow / 100) * layout.fontPx * 0.35;
    ctx.fillStyle = 'rgba(0,0,0,0.001)';
    layout.lines.forEach((line, i) => {
      if (strokePx > 0) {
        ctx.strokeStyle = layer.strokeColor;
        ctx.lineWidth = strokePx;
        ctx.strokeText(line, anchorX, startY + i * layout.lineHeightPx);
      } else {
        ctx.fillStyle = layer.color;
        ctx.fillText(line, anchorX, startY + i * layout.lineHeightPx);
      }
    });
    ctx.restore();
  }

  layout.lines.forEach((line, i) => {
    const y = startY + i * layout.lineHeightPx;
    if (strokePx > 0) {
      ctx.strokeStyle = layer.strokeColor;
      ctx.lineWidth = strokePx;
      // Two passes: a single stroke of an Impact outline leaves the inner
      // corners thin and the classic meme look needs a solid, even border.
      ctx.strokeText(line, anchorX, y);
      ctx.strokeText(line, anchorX, y);
    }
    ctx.fillStyle = layer.color;
    ctx.fillText(line, anchorX, y);
  });
}

function drawSticker(
  ctx: CanvasRenderingContext2D,
  layer: StickerLayer,
  box: CanvasBox,
  raster: CanvasImageSource | null
): void {
  if (!raster) return;
  const size = layerSize(layer, box);
  if (layer.flipX) ctx.scale(-1, 1);
  ctx.drawImage(raster, -size.width / 2, -size.height / 2, size.width, size.height);
}

export interface RenderOptions {
  /** Draw only the backdrop — used by the hold-to-compare control. */
  backdropOnly?: boolean;
  /** Exact rasters keyed by layer id, used by the exporter. */
  stickerRasters?: Map<string, CanvasImageSource>;
}

/** Draws a document into an already-sized context. `scale` maps doc px → device px. */
export function renderDoc(
  ctx: CanvasRenderingContext2D,
  doc: MemeDoc,
  backdrop: Backdrop,
  scale: number,
  options: RenderOptions = {}
): void {
  const box = canvasBox(doc);

  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, box.width, box.height);

  ctx.fillStyle = doc.padColor;
  ctx.fillRect(0, 0, box.width, box.height);

  drawBackdrop(ctx, backdrop, 0, box.barPx, box.width, doc.height, doc.fit);

  if (!options.backdropOnly) {
    for (const layer of doc.layers) {
      ctx.save();
      ctx.globalAlpha = layer.opacity;
      ctx.translate((layer.x / 100) * box.width, (layer.y / 100) * box.height);
      if (layer.rotation) ctx.rotate((layer.rotation * Math.PI) / 180);

      if (layer.kind === 'text') {
        drawText(ctx, layer, box);
      } else {
        const def = STICKERS[layer.sticker];
        const raster = options.stickerRasters?.get(layer.id) ?? (def ? getStickerRaster(def, layer.color) : null);
        drawSticker(ctx, layer, box, raster);
      }
      ctx.restore();
    }
  }

  ctx.restore();
}

/** Sizes a canvas for `doc` at `scale` and renders into it. */
export function renderToCanvas(
  canvas: HTMLCanvasElement,
  doc: MemeDoc,
  backdrop: Backdrop,
  scale: number,
  options?: RenderOptions
): void {
  const box = canvasBox(doc);
  const width = Math.max(1, Math.round(box.width * scale));
  const height = Math.max(1, Math.round(box.height * scale));
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingQuality = 'high';
  renderDoc(ctx, doc, backdrop, scale, options);
}
