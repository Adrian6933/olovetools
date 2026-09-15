// ============================================================================
// Canvas renderer. The preview is real CSS, so exporting it means re-drawing
// the same description with Canvas2D — no html2canvas, no screenshot API, no
// network. The result is what feeds both the PNG download and the handoff to
// the rest of the suite.
// ============================================================================

import type { Design, PreviewBackdrop, RadiusState, TabId } from '../types';
import { cssRgba, oklchToRgb, parseColor, rgbToOklch } from './color';
import { filterValue, glassBackdropValue, radiusValue } from './serialize';

export interface RenderOptions {
  width: number;
  height: number;
  backdrop: PreviewBackdrop;
  backdropImage?: HTMLImageElement | null;
  /** Fills the whole canvas with the styled surface instead of a centred card. */
  fullBleed?: boolean;
}

// ---------------------------------------------------------------------------
// Shape
// ---------------------------------------------------------------------------

type CornerRadii = [number, number, number, number] | { x: number; y: number }[];

/**
 * Turns a RadiusState into the per-corner radii Canvas2D wants. The organic
 * two-axis syntax maps onto roundRect's elliptical corners, which is exactly
 * what `border-radius: a b c d / e f g h` means in CSS.
 */
function cornerRadii(radius: RadiusState, w: number, h: number): CornerRadii {
  const value = radiusValue(radius);
  const [horizontal, vertical] = value.split('/').map(s => s.trim());
  const read = (part: string, extent: number): number[] => {
    const tokens = part.split(/\s+/).filter(Boolean);
    const nums = tokens.map(t => (t.endsWith('%') ? (parseFloat(t) / 100) * extent : parseFloat(t) || 0));
    const [a, b = a, c = a, d = b] = nums;
    return [a, b, c, d];
  };
  const hx = read(horizontal, w);
  if (!vertical) return hx as [number, number, number, number];
  const vy = read(vertical, h);
  return hx.map((x, i) => ({ x, y: vy[i] }));
}

function shapePath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radii: CornerRadii
): void {
  ctx.beginPath();
  // roundRect ships everywhere we target; the fallback keeps the export alive
  // on anything older rather than throwing mid-download.
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, radii as never);
  } else {
    const r = Math.min(Array.isArray(radii) && typeof radii[0] === 'number' ? (radii[0] as number) : 0, w / 2, h / 2);
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

// ---------------------------------------------------------------------------
// Gradient
// ---------------------------------------------------------------------------

/**
 * Canvas only ever interpolates in sRGB. When the design asks for oklab/oklch
 * we bake the curve in by inserting sampled stops, so the PNG matches what the
 * browser drew in the preview instead of showing the muddy sRGB midpoint.
 */
function expandStops(design: Design): { offset: number; color: string }[] {
  const g = design.gradient;
  const sorted = [...g.stops].sort((a, b) => a.position - b.position);
  const plain = sorted.map(s => ({ offset: Math.min(1, Math.max(0, s.position / 100)), color: cssRgba(s.color, s.opacity) }));
  if (g.interpolation === 'srgb' || g.interpolation === 'srgb-linear' || sorted.length < 2) return plain;

  const SAMPLES = 12;
  const out: { offset: number; color: string }[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    const ca = parseColor(a.color)!;
    const cb = parseColor(b.color)!;
    const la = rgbToOklch(ca.r, ca.g, ca.b);
    const lb = rgbToOklch(cb.r, cb.g, cb.b);
    // Shortest hue path, matching the CSS default for polar spaces.
    let dh = lb.h - la.h;
    if (g.interpolation === 'oklch' || g.interpolation === 'hsl') {
      if (dh > 180) dh -= 360;
      if (dh < -180) dh += 360;
    } else {
      dh = lb.h - la.h;
    }
    for (let s = 0; s <= SAMPLES; s++) {
      const t = s / SAMPLES;
      const mix = g.interpolation === 'hsl'
        ? hslMix(ca, cb, t)
        : g.interpolation === 'oklch'
          ? oklchToRgb(la.l + (lb.l - la.l) * t, la.c + (lb.c - la.c) * t, la.h + dh * t)
          : oklabMix(la, lb, t);
      const alpha = a.opacity + (b.opacity - a.opacity) * t;
      const offset = (a.position + (b.position - a.position) * t) / 100;
      out.push({
        offset: Math.min(1, Math.max(0, offset)),
        color: `rgba(${mix.r}, ${mix.g}, ${mix.b}, ${Math.round(alpha * 1000) / 1000})`,
      });
    }
  }
  return out;
}

/** CSS HSL interpolation is distinct from OKLCH; keep the PNG export aligned
 * with the browser preview when the user selects the HSL colour space. */
function hslMix(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }, t: number) {
  const ah = rgbToHslLocal(a.r, a.g, a.b);
  const bh = rgbToHslLocal(b.r, b.g, b.b);
  let dh = bh.h - ah.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  return hslToRgbLocal(ah.h + dh * t, ah.s + (bh.s - ah.s) * t, ah.l + (bh.l - ah.l) * t);
}

function rgbToHslLocal(r: number, g: number, b: number) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn), d = max - min;
  const l = (max + min) / 2;
  if (!d) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === rn ? 60 * (((gn - bn) / d) % 6) : max === gn ? 60 * ((bn - rn) / d + 2) : 60 * ((rn - gn) / d + 4);
  if (h < 0) h += 360;
  return { h, s, l };
}

function hslToRgbLocal(h: number, s: number, l: number) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const seg = Math.floor((((h % 360) + 360) % 360) / 60);
  const [r, g, b] = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][seg];
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}

function oklabMix(a: { l: number; c: number; h: number }, b: { l: number; c: number; h: number }, t: number) {
  // Rectangular interpolation: convert both to a/b, lerp, convert back.
  const ax = a.c * Math.cos((a.h * Math.PI) / 180);
  const ay = a.c * Math.sin((a.h * Math.PI) / 180);
  const bx = b.c * Math.cos((b.h * Math.PI) / 180);
  const by = b.c * Math.sin((b.h * Math.PI) / 180);
  const x = ax + (bx - ax) * t;
  const y = ay + (by - ay) * t;
  const l = a.l + (b.l - a.l) * t;
  const c = Math.sqrt(x * x + y * y);
  const h = c < 1e-6 ? 0 : ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  return oklchToRgb(l, c, h);
}

function makeGradient(
  ctx: CanvasRenderingContext2D,
  design: Design,
  x: number,
  y: number,
  w: number,
  h: number
): CanvasGradient {
  const g = design.gradient;
  const cx = x + (g.posX / 100) * w;
  const cy = y + (g.posY / 100) * h;
  let grad: CanvasGradient;

  if (g.kind === 'linear') {
    // CSS 0deg points up and grows clockwise; the gradient line is sized so it
    // covers the box corners, same as the spec's definition.
    const rad = (g.angle * Math.PI) / 180;
    const len = Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad));
    const dx = Math.sin(rad) * (len / 2);
    const dy = -Math.cos(rad) * (len / 2);
    const mx = x + w / 2;
    const my = y + h / 2;
    grad = ctx.createLinearGradient(mx - dx, my - dy, mx + dx, my + dy);
  } else if (g.kind === 'radial') {
    const corners = [
      Math.hypot(cx - x, cy - y),
      Math.hypot(x + w - cx, cy - y),
      Math.hypot(cx - x, y + h - cy),
      Math.hypot(x + w - cx, y + h - cy),
    ];
    const sides = [cx - x, x + w - cx, cy - y, y + h - cy];
    const r =
      g.size === 'closest-side'
        ? Math.min(...sides)
        : g.size === 'farthest-side'
          ? Math.max(...sides)
          : g.size === 'closest-corner'
            ? Math.min(...corners)
            : Math.max(...corners);
    grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(1, r));
  } else {
    // Canvas conic starts on the +x axis, CSS starts at 12 o'clock.
    grad = ctx.createConicGradient(((g.angle - 90) * Math.PI) / 180, cx, cy);
  }

  let last = -1;
  for (const stop of expandStops(design)) {
    // addColorStop throws on a non-monotonic offset, which sorted input can
    // still produce after clamping.
    const offset = Math.min(1, Math.max(last, stop.offset));
    grad.addColorStop(offset, stop.color);
    last = offset;
  }
  return grad;
}

// ---------------------------------------------------------------------------
// Backdrop
// ---------------------------------------------------------------------------

function drawBackdrop(ctx: CanvasRenderingContext2D, opts: RenderOptions): void {
  const { width: w, height: h, backdrop, backdropImage } = opts;

  if (backdrop === 'photo' && backdropImage) {
    const scale = Math.max(w / backdropImage.naturalWidth, h / backdropImage.naturalHeight);
    const dw = backdropImage.naturalWidth * scale;
    const dh = backdropImage.naturalHeight * scale;
    ctx.drawImage(backdropImage, (w - dw) / 2, (h - dh) / 2, dw, dh);
    return;
  }

  if (backdrop === 'vibrant') {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#312e81');
    grad.addColorStop(0.5, '#581c87');
    grad.addColorStop(1, '#831843');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    return;
  }

  if (backdrop === 'mesh') {
    ctx.fillStyle = '#08060d';
    ctx.fillRect(0, 0, w, h);
    const blobs: [number, number, number, string][] = [
      [0.22, 0.18, 0.55, 'rgba(139, 92, 246, 0.55)'],
      [0.82, 0.28, 0.45, 'rgba(236, 72, 153, 0.45)'],
      [0.5, 0.9, 0.6, 'rgba(6, 182, 212, 0.35)'],
    ];
    for (const [bx, by, br, color] of blobs) {
      const r = br * Math.max(w, h) * 0.6;
      const grad = ctx.createRadialGradient(bx * w, by * h, 0, bx * w, by * h, r);
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
    return;
  }

  const light = backdrop === 'lightGrid';
  ctx.fillStyle = light ? '#f8fafc' : '#0f111a';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = light ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  const step = 24 * (w / 800 > 1 ? 2 : 1);
  ctx.beginPath();
  for (let x = 0; x <= w; x += step) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, h);
  }
  for (let y = 0; y <= h; y += step) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(w, y + 0.5);
  }
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// Shadow layers
// ---------------------------------------------------------------------------

function paintShadows(
  ctx: CanvasRenderingContext2D,
  design: Design,
  x: number,
  y: number,
  w: number,
  h: number,
  radii: CornerRadii
): void {
  const outset = design.shadow.layers.filter(l => l.enabled && !l.inset);
  for (const l of outset) {
    ctx.save();
    ctx.shadowColor = cssRgba(l.color, l.opacity);
    ctx.shadowBlur = l.blur;
    ctx.shadowOffsetX = l.x;
    ctx.shadowOffsetY = l.y;
    // CSS spread grows the shadow shape; canvas has no equivalent, so we grow
    // the caster and hide it behind the card that gets painted on top.
    const s = l.spread;
    shapePath(ctx, x - s, y - s, w + s * 2, h + s * 2, radii);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.restore();
  }
}

function paintInsetShadows(
  ctx: CanvasRenderingContext2D,
  design: Design,
  x: number,
  y: number,
  w: number,
  h: number,
  radii: CornerRadii
): void {
  const inset = design.shadow.layers.filter(l => l.enabled && l.inset);
  if (!inset.length) return;
  ctx.save();
  shapePath(ctx, x, y, w, h, radii);
  ctx.clip();
  for (const l of inset) {
    ctx.save();
    ctx.shadowColor = cssRgba(l.color, l.opacity);
    ctx.shadowBlur = l.blur;
    ctx.shadowOffsetX = l.x;
    ctx.shadowOffsetY = l.y;
    // Fill everything *outside* the shape: its shadow then falls inwards.
    const pad = Math.max(w, h);
    ctx.beginPath();
    ctx.rect(x - pad, y - pad, w + pad * 2, h + pad * 2);
    const s = l.spread;
    if (typeof ctx.roundRect === 'function') ctx.roundRect(x + s, y + s, w - s * 2, h - s * 2, radii as never);
    ctx.fillStyle = '#000';
    ctx.fill('evenodd');
    ctx.restore();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

export function renderDesign(
  tab: TabId,
  design: Design,
  opts: RenderOptions
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(opts.width);
  canvas.height = Math.round(opts.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const w = canvas.width;
  const h = canvas.height;

  const full = !!opts.fullBleed;
  const cw = full ? w : Math.round(w * 0.62);
  const ch = full ? h : Math.round(h * 0.6);
  const cx = Math.round((w - cw) / 2);
  const cy = Math.round((h - ch) / 2);

  const radiusState: RadiusState =
    tab === 'radius'
      ? design.radius
      : tab === 'glass'
        ? { ...design.radius, organic: false, linked: true, unit: 'px', tl: design.glass.radius, tr: design.glass.radius, br: design.glass.radius, bl: design.glass.radius }
        : { ...design.radius, organic: false, linked: true, unit: 'px', tl: design.shadow.radius, tr: design.shadow.radius, br: design.shadow.radius, bl: design.shadow.radius };
  const radii = full && tab !== 'radius' ? ([0, 0, 0, 0] as CornerRadii) : cornerRadii(radiusState, cw, ch);

  drawBackdrop(ctx, opts);

  if (tab === 'gradient') {
    ctx.save();
    shapePath(ctx, cx, cy, cw, ch, radii);
    ctx.clip();
    ctx.fillStyle = makeGradient(ctx, design, cx, cy, cw, ch);
    ctx.fillRect(cx, cy, cw, ch);
    ctx.restore();
    return canvas;
  }

  if (tab === 'shadow') {
    paintShadows(ctx, design, cx, cy, cw, ch, radii);
    ctx.save();
    shapePath(ctx, cx, cy, cw, ch, radii);
    ctx.fillStyle = design.shadow.cardBg;
    ctx.fill();
    ctx.restore();
    paintInsetShadows(ctx, design, cx, cy, cw, ch, radii);
    return canvas;
  }

  if (tab === 'radius') {
    ctx.save();
    shapePath(ctx, cx, cy, cw, ch, radii);
    ctx.fillStyle = design.radius.fill;
    ctx.fill();
    ctx.restore();
    return canvas;
  }

  if (tab === 'filter') {
    // The filter applies to the content, so we re-draw the backdrop through it
    // inside the card — the same thing the CSS preview shows.
    const source = document.createElement('canvas');
    source.width = w;
    source.height = h;
    const sctx = source.getContext('2d');
    if (sctx) {
      drawBackdrop(sctx, opts);
      ctx.save();
      shapePath(ctx, cx, cy, cw, ch, radii);
      ctx.clip();
      ctx.filter = filterValue(design.filter, 'hex', false);
      ctx.drawImage(source, 0, 0);
      ctx.filter = 'none';
      ctx.restore();
    }
    return canvas;
  }

  // Glassmorphism: blur what is behind the pane, then lay the tint on top.
  const g = design.glass;
  const behind = document.createElement('canvas');
  behind.width = w;
  behind.height = h;
  const bctx = behind.getContext('2d');
  if (bctx) drawBackdrop(bctx, opts);

  if (g.shadowStrength > 0) {
    ctx.save();
    ctx.shadowColor = cssRgba('#000000', g.shadowStrength * 0.6);
    ctx.shadowBlur = 32;
    ctx.shadowOffsetY = 8;
    shapePath(ctx, cx, cy, cw, ch, radii);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  shapePath(ctx, cx, cy, cw, ch, radii);
  ctx.clip();
  ctx.filter = glassBackdropValue(g);
  ctx.drawImage(behind, 0, 0);
  ctx.filter = 'none';
  ctx.fillStyle = cssRgba(g.bgColor, g.opacity);
  ctx.fillRect(cx, cy, cw, ch);
  if (g.innerHighlight) {
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(cx, cy, cw, 1.5);
  }
  ctx.restore();

  if (g.borderWidth > 0) {
    ctx.save();
    shapePath(ctx, cx + g.borderWidth / 2, cy + g.borderWidth / 2, cw - g.borderWidth, ch - g.borderWidth, radii);
    ctx.strokeStyle = cssRgba(g.borderColor, g.borderOpacity);
    ctx.lineWidth = g.borderWidth;
    ctx.stroke();
    ctx.restore();
  }

  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png'): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(resolve, type, 0.95));
}

// ---------------------------------------------------------------------------
// Palette extraction — the one genuinely expensive operation in this tool, so
// it never runs on its own. The image waits until the user asks for it.
// ---------------------------------------------------------------------------

export function extractPalette(image: HTMLImageElement, count = 6): string[] {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];
  ctx.drawImage(image, 0, 0, size, size);

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, size, size).data;
  } catch {
    // A cross-origin image taints the canvas; nothing to recover from here.
    return [];
  }

  // 5 bits per channel is a coarse enough bucket to group near-identical
  // pixels and fine enough to keep two distinct accents apart.
  const buckets = new Map<number, { count: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const entry = buckets.get(key);
    if (entry) {
      entry.count++;
      entry.r += r;
      entry.g += g;
      entry.b += b;
    } else {
      buckets.set(key, { count: 1, r, g, b });
    }
  }

  const ranked = [...buckets.values()]
    .map(e => ({ count: e.count, r: e.r / e.count, g: e.g / e.count, b: e.b / e.count }))
    .sort((a, b) => b.count - a.count);

  const chosen: { r: number; g: number; b: number }[] = [];
  for (const candidate of ranked) {
    const tooClose = chosen.some(
      c => Math.hypot(c.r - candidate.r, c.g - candidate.g, c.b - candidate.b) < 42
    );
    if (tooClose) continue;
    chosen.push(candidate);
    if (chosen.length >= count) break;
  }

  const hex = (v: number) => Math.round(v).toString(16).padStart(2, '0');
  return chosen.map(c => `#${hex(c.r)}${hex(c.g)}${hex(c.b)}`);
}

/** Loads a File into an <img>, revoking the object URL once it has decoded. */
export function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('decode failed'));
    };
    img.src = url;
  });
}
