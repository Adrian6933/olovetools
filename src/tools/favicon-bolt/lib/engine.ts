// ============================================================================
// FaviconBolt render engine
// ----------------------------------------------------------------------------
// One master render at 1024px, then every output size is derived from it by
// halving steps. That matters more than it sounds: the old code drew the emoji
// straight at `font-size: 10px` to fill the 16x16 frame, which is where colour
// emoji fonts fall back to their tiniest bitmap strike and turn to mush. A
// box-filtered downscale of a 1024px glyph keeps the shape.
// ============================================================================

import type { IconSettings, QualityReport, ShapeKind, SourceImage } from '../types';

/** Everything is rendered once at this size and downsampled from here. */
export const MASTER = 1024;

export type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;
export type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export function makeCanvas(w: number, h: number): AnyCanvas {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function ctxOf(canvas: AnyCanvas): Ctx2D {
  const ctx = (canvas as HTMLCanvasElement).getContext('2d', { willReadFrequently: false });
  if (!ctx) throw new Error('2d context unavailable');
  return ctx as Ctx2D;
}

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

function roundRectPath(ctx: Ctx2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
}

/**
 * A real squircle: the superellipse |x/r|^n + |y/r|^n = 1. n = 4.6 is the
 * closest single-exponent match to the continuous corner iOS uses. The old
 * version was a plain rounded rect at r = 22% and it read as one.
 */
function superellipsePath(ctx: Ctx2D, cx: number, cy: number, r: number, n = 4.6) {
  const steps = 240;
  const e = 2 / n;
  for (let i = 0; i <= steps; i++) {
    const th = (i / steps) * Math.PI * 2;
    const c = Math.cos(th);
    const s = Math.sin(th);
    const x = cx + r * Math.sign(c) * Math.pow(Math.abs(c), e);
    const y = cy + r * Math.sign(s) * Math.pow(Math.abs(s), e);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
}

/** Traces the plate outline inset by `inset` px. Leaves the path open-ended. */
export function shapePath(ctx: Ctx2D, size: number, shape: ShapeKind, inset: number) {
  const w = size - inset * 2;
  ctx.beginPath();
  if (shape === 'circle') {
    ctx.arc(size / 2, size / 2, w / 2, 0, Math.PI * 2);
  } else if (shape === 'square') {
    ctx.rect(inset, inset, w, w);
  } else if (shape === 'rounded') {
    roundRectPath(ctx, inset, inset, w, w, w * 0.22);
  } else if (shape === 'squircle') {
    superellipsePath(ctx, size / 2, size / 2, w / 2);
  }
  ctx.closePath();
}

/** SVG `d` for the same outline, so favicon.svg matches the raster exactly. */
export function shapePathData(size: number, shape: ShapeKind, inset: number): string {
  const w = size - inset * 2;
  const c = size / 2;
  if (shape === 'circle') {
    const r = w / 2;
    return `M ${c - r} ${c} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 Z`;
  }
  if (shape === 'square') {
    return `M ${inset} ${inset} H ${inset + w} V ${inset + w} H ${inset} Z`;
  }
  if (shape === 'rounded') {
    const r = w * 0.22;
    return (
      `M ${inset + r} ${inset} H ${inset + w - r} Q ${inset + w} ${inset} ${inset + w} ${inset + r}` +
      ` V ${inset + w - r} Q ${inset + w} ${inset + w} ${inset + w - r} ${inset + w}` +
      ` H ${inset + r} Q ${inset} ${inset + w} ${inset} ${inset + w - r}` +
      ` V ${inset + r} Q ${inset} ${inset} ${inset + r} ${inset} Z`
    );
  }
  // squircle
  const r = w / 2;
  const e = 2 / 4.6;
  const steps = 120;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const th = (i / steps) * Math.PI * 2;
    const cs = Math.cos(th);
    const sn = Math.sin(th);
    const x = c + r * Math.sign(cs) * Math.pow(Math.abs(cs), e);
    const y = c + r * Math.sign(sn) * Math.pow(Math.abs(sn), e);
    d += `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)} `;
  }
  return `${d}Z`;
}

// ---------------------------------------------------------------------------
// Text metrics
// ---------------------------------------------------------------------------

/**
 * First grapheme cluster, not first UTF-16 unit. `maxLength={2}` on the input
 * used to chop 👨‍👩‍👧‍👦 (11 units) and every flag in half, leaving a broken glyph.
 */
export function firstGrapheme(input: string): string {
  const s = (input || '').trim();
  if (!s) return '';
  const Seg = (Intl as any).Segmenter;
  if (Seg) {
    try {
      for (const g of new Seg(undefined, { granularity: 'grapheme' }).segment(s)) {
        return (g as { segment: string }).segment;
      }
    } catch {
      // Older engines without Segmenter fall through to the code-point split.
    }
  }
  return Array.from(s)[0] ?? '';
}

interface GlyphBox {
  fontSize: number;
  dx: number;
  dy: number;
}

/**
 * Picks the font size that makes the glyph's *ink* fill `target` px, and the
 * offset that centres that ink. Using the real bounding box instead of the
 * advance width is what removes the old `size * 0.02` vertical fudge, which
 * only ever looked right in one font on one OS.
 */
function fitGlyph(ctx: Ctx2D, glyph: string, font: (px: number) => string, target: number): GlyphBox {
  const probe = 200;
  ctx.font = font(probe);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const m = ctx.measureText(glyph);

  const left = m.actualBoundingBoxLeft ?? 0;
  const right = m.actualBoundingBoxRight ?? m.width;
  const asc = m.actualBoundingBoxAscent ?? probe * 0.8;
  const desc = m.actualBoundingBoxDescent ?? probe * 0.2;

  const w = right + left;
  const h = asc + desc;
  if (w <= 0 || h <= 0) return { fontSize: target, dx: 0, dy: target * 0.35 };

  const k = target / Math.max(w, h);
  const fontSize = probe * k;

  // With textAlign 'left' + alphabetic baseline the ink spans
  // x ∈ [X - left, X + right] and y ∈ [Y - asc, Y + desc], so drawing at
  // (-dx, dy) puts the centre of that box on the origin.
  const dx = ((right - left) / 2) * k;
  const dy = ((asc - desc) / 2) * k;
  return { fontSize, dx, dy };
}

export function fontStack(family: string, weight: number): (px: number) => string {
  return (px: number) => `${weight} ${px}px ${family}, "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
}

// ---------------------------------------------------------------------------
// Source preparation
// ---------------------------------------------------------------------------

export interface TrimBox {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

const trimCache = new WeakMap<HTMLImageElement, TrimBox>();

/**
 * Finds the bounding box of the non-transparent pixels. A logo exported with a
 * generous transparent margin used to end up at ~60% of the frame no matter
 * how the padding slider was set; trimming first makes padding mean something.
 */
export function trimBox(img: HTMLImageElement): TrimBox {
  const cached = trimCache.get(img);
  if (cached) return cached;

  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const full: TrimBox = { sx: 0, sy: 0, sw: w, sh: h };
  if (!w || !h) return full;

  // The scan runs on a downscaled copy: 256px is plenty to locate a margin and
  // it keeps a 6000px logo from costing 140 MB of ImageData.
  const scale = Math.min(1, 256 / Math.max(w, h));
  const sw = Math.max(1, Math.round(w * scale));
  const sh = Math.max(1, Math.round(h * scale));
  const c = makeCanvas(sw, sh);
  const ctx = ctxOf(c);
  ctx.drawImage(img, 0, 0, sw, sh);

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, sw, sh).data;
  } catch {
    return full; // tainted canvas — never happens with object URLs, but be safe
  }

  let minX = sw;
  let minY = sh;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      if (data[(y * sw + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return full; // fully transparent

  const inv = 1 / scale;
  const box: TrimBox = {
    sx: Math.max(0, Math.floor(minX * inv)),
    sy: Math.max(0, Math.floor(minY * inv)),
    sw: Math.min(w, Math.ceil((maxX - minX + 1) * inv)),
    sh: Math.min(h, Math.ceil((maxY - minY + 1) * inv)),
  };
  trimCache.set(img, box);
  return box;
}

// ---------------------------------------------------------------------------
// Master render
// ---------------------------------------------------------------------------

function applyFill(ctx: Ctx2D, s: IconSettings, size: number) {
  if (s.fill === 'gradient') {
    const a = (s.gradientAngle * Math.PI) / 180;
    const r = size / 2;
    const g = ctx.createLinearGradient(
      r - Math.cos(a) * r,
      r - Math.sin(a) * r,
      r + Math.cos(a) * r,
      r + Math.sin(a) * r
    );
    g.addColorStop(0, s.bgColor);
    g.addColorStop(1, s.bgColor2);
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = s.bgColor;
  }
}

export interface RenderInput {
  settings: IconSettings;
  source: SourceImage | null;
  /** Forces an opaque plate behind everything (apple-touch-icon, mstile). */
  flattenTo?: string;
  /** Shrinks the artwork into the Android maskable safe zone (80% circle). */
  maskable?: boolean;
}

/** Draws the icon at `size` on the given context. Fully synchronous. */
export function drawIcon(ctx: Ctx2D, size: number, input: RenderInput) {
  const s = input.settings;
  ctx.clearRect(0, 0, size, size);
  ctx.save();

  if (input.flattenTo) {
    ctx.fillStyle = input.flattenTo;
    ctx.fillRect(0, 0, size, size);
  }

  const strokeW = (s.borderWidth / 100) * size;
  // Android re-masks the maskable icon itself, so it must ship full-bleed:
  // shipping our own squircle here would get its corners rounded twice.
  const hasPlate = s.shape !== 'none' && !input.maskable;

  if (input.maskable && s.shape !== 'none') {
    ctx.save();
    applyFill(ctx, s, size);
    ctx.fillRect(0, 0, size, size);
    ctx.restore();
  }

  // --- Plate -------------------------------------------------------------
  if (hasPlate) {
    ctx.save();
    shapePath(ctx, size, s.shape, strokeW / 2);
    applyFill(ctx, s, size);
    ctx.fill();
    if (strokeW > 0) {
      ctx.lineWidth = strokeW;
      ctx.strokeStyle = s.borderColor;
      ctx.stroke();
    }
    ctx.restore();
  }

  // --- Artwork -----------------------------------------------------------
  ctx.save();

  if (hasPlate && s.clipToShape) {
    // Clip to the *inner* edge of the stroke so the border stays on top.
    shapePath(ctx, size, s.shape, strokeW);
    ctx.clip();
  }

  const maskShrink = input.maskable ? 0.8 : 1;
  const padPx = (s.padding / 100) * size + strokeW;
  const box = Math.max(1, (size - padPx * 2) * maskShrink);

  ctx.translate(size / 2 + (s.offsetX / 100) * size, size / 2 + (s.offsetY / 100) * size);
  if (s.rotation) ctx.rotate((s.rotation * Math.PI) / 180);
  const k = s.scale || 1;

  if (s.mode === 'image' && input.source) {
    const img = input.source.img;
    const t = s.trim ? trimBox(img) : { sx: 0, sy: 0, sw: img.naturalWidth || img.width, sh: img.naturalHeight || img.height };
    const ratio = t.sw / t.sh;
    let dw = box * k;
    let dh = box * k;
    if (ratio > 1) dh = dw / ratio;
    else dw = dh * ratio;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, t.sx, t.sy, t.sw, t.sh, -dw / 2, -dh / 2, dw, dh);
  } else {
    const glyph = s.mode === 'emoji' ? firstGrapheme(s.emoji) || '⚡' : (s.text || 'A').slice(0, 3);
    const font = fontStack(s.fontFamily, s.fontWeight);
    const target = box * (s.fontScale / 100) * k;
    const fit = fitGlyph(ctx, glyph, font, target);
    ctx.font = font(fit.fontSize);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    if (s.mode === 'text') ctx.fillStyle = s.textColor;
    ctx.fillText(glyph, -fit.dx, fit.dy);
  }

  ctx.restore();
  ctx.restore();
}

/** Renders the 1024px master once; every export size is derived from it. */
export function renderMaster(input: RenderInput): AnyCanvas {
  const canvas = makeCanvas(MASTER, MASTER);
  drawIcon(ctxOf(canvas), MASTER, input);
  return canvas;
}

// ---------------------------------------------------------------------------
// Downscaling + postprocess
// ---------------------------------------------------------------------------

/**
 * Halving steps down to the target.
 *
 * Measured against an exact box-filtered reference, Chrome's own
 * `imageSmoothingQuality: 'high'` already lands within 0.2/255 RMSE in a single
 * step, so this is not where the quality comes from — that comes from rendering
 * the 1024px master at all (87% less error at 16px than drawing the glyph
 * straight into a 16px frame). The halving stays because engines with a plain
 * bilinear downscale do drop source pixels, and the cost is a few tenths of a
 * millisecond.
 */
export function downscale(master: AnyCanvas, target: number): AnyCanvas {
  let cur: AnyCanvas = master;
  let size = master.width;

  while (size / 2 > target) {
    const next = Math.max(target, Math.floor(size / 2));
    const c = makeCanvas(next, next);
    const ctx = ctxOf(c);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(cur as CanvasImageSource, 0, 0, next, next);
    cur = c;
    size = next;
  }

  if (size === target) return cur;
  const out = makeCanvas(target, target);
  const ctx = ctxOf(out);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(cur as CanvasImageSource, 0, 0, target, target);
  return out;
}

/**
 * Unsharp mask on premultiplied RGBA. Premultiplying first is what stops the
 * halo of stray colour around the silhouette that a naive RGB sharpen leaves
 * wherever alpha is 0.
 */
export function sharpen(data: ImageData, amount: number): ImageData {
  const { width: w, height: h } = data;
  const src = data.data;
  const pre = new Float32Array(src.length);
  for (let i = 0; i < src.length; i += 4) {
    const a = src[i + 3] / 255;
    pre[i] = src[i] * a;
    pre[i + 1] = src[i + 1] * a;
    pre[i + 2] = src[i + 2] * a;
    pre[i + 3] = src[i + 3];
  }

  const out = new Uint8ClampedArray(src.length);
  const c = 1 + 4 * amount;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const up = y > 0 ? i - w * 4 : i;
      const dn = y < h - 1 ? i + w * 4 : i;
      const lf = x > 0 ? i - 4 : i;
      const rt = x < w - 1 ? i + 4 : i;
      for (let ch = 0; ch < 4; ch++) {
        const v = c * pre[i + ch] - amount * (pre[up + ch] + pre[dn + ch] + pre[lf + ch] + pre[rt + ch]);
        out[i + ch] = v;
      }
    }
  }

  // Unpremultiply so the PNG encoder gets straight alpha back.
  for (let i = 0; i < out.length; i += 4) {
    const a = out[i + 3] / 255;
    if (a > 0) {
      out[i] = Math.min(255, out[i] / a);
      out[i + 1] = Math.min(255, out[i + 1] / a);
      out[i + 2] = Math.min(255, out[i + 2] / a);
    }
  }
  return new ImageData(out, w, h);
}

/** Mean |Laplacian| of luminance — the number the sharpen toggle moves. */
export function edgeEnergy(data: ImageData): number {
  const { width: w, height: h, data: d } = data;
  const lum = new Float32Array(w * h);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const a = d[i + 3] / 255;
    lum[p] = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) * a;
  }
  let sum = 0;
  let n = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      sum += Math.abs(4 * lum[p] - lum[p - 1] - lum[p + 1] - lum[p - w] - lum[p + w]);
      n++;
    }
  }
  return n ? sum / n : 0;
}

export function measureSharpen(data: ImageData, amount: number): QualityReport {
  const before = edgeEnergy(data);
  const after = edgeEnergy(sharpen(data, amount));
  return { before, after, gainPct: before ? ((after - before) / before) * 100 : 0 };
}

/** Produces one export frame: downscale, optional sharpen, back to a canvas. */
export function frameAt(master: AnyCanvas, size: number, sharpenSmall: boolean): AnyCanvas {
  const scaled = downscale(master, size);
  // Below 64px is where the halving average goes soft and an unsharp pass
  // buys real contrast; above it the icon is already crisp.
  if (!sharpenSmall || size > 64) return scaled;
  const ctx = ctxOf(scaled) as CanvasRenderingContext2D;
  const data = ctx.getImageData(0, 0, size, size);
  ctx.putImageData(sharpen(data, size <= 16 ? 0.45 : 0.3), 0, 0);
  return scaled;
}

export async function canvasToBlob(canvas: AnyCanvas, type = 'image/png'): Promise<Blob> {
  if (typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type });
  }
  return new Promise<Blob>(resolve => {
    (canvas as HTMLCanvasElement).toBlob(b => resolve(b ?? new Blob()), type);
  });
}

export function canvasToImageData(canvas: AnyCanvas): ImageData {
  return (ctxOf(canvas) as CanvasRenderingContext2D).getImageData(0, 0, canvas.width, canvas.height);
}
