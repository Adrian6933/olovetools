// ============================================================================
// GraphFlow — scene backends
// ----------------------------------------------------------------------------
// Two consumers of the same Scene: a canvas painter for the screen and PNG
// export, and an SVG serialiser for the vector export. Because both read the
// identical geometry, the downloaded SVG matches the preview exactly.
// ============================================================================

import { CHART_FONT, type Scene, type SceneNode, type TextMeasurer } from '../types';

// ── Text measurement ────────────────────────────────────────────────────────
// One detached context, reused. Layout must measure text before anything is
// drawn, and it must measure it the same way for both backends.

let measureCtx: CanvasRenderingContext2D | null = null;

export function getTextMeasurer(): TextMeasurer {
  if (!measureCtx && typeof document !== 'undefined') {
    measureCtx = document.createElement('canvas').getContext('2d');
  }
  return (text: string, size: number, weight = 400) => {
    if (!measureCtx) return text.length * size * 0.55; // SSR fallback
    measureCtx.font = `${weight} ${size}px ${CHART_FONT}`;
    return measureCtx.measureText(text).width;
  };
}

// ── Canvas backend ──────────────────────────────────────────────────────────

function applyStroke(ctx: CanvasRenderingContext2D, node: Extract<SceneNode, { kind: 'path' }>) {
  ctx.strokeStyle = node.stroke!;
  ctx.lineWidth = node.strokeWidth ?? 1;
  ctx.setLineDash(node.dash ?? []);
}

function paintNode(ctx: CanvasRenderingContext2D, node: SceneNode) {
  ctx.globalAlpha = node.opacity ?? 1;

  switch (node.kind) {
    case 'path': {
      // Path2D takes the very same `d` string the SVG backend writes out.
      const p = new Path2D(node.d);
      if (node.fill) {
        ctx.fillStyle = node.fill;
        ctx.fill(p);
      }
      if (node.stroke) {
        applyStroke(ctx, node);
        ctx.stroke(p);
        ctx.setLineDash([]);
      }
      break;
    }
    case 'rect': {
      if (node.r) {
        const p = new Path2D();
        p.roundRect(node.x, node.y, node.w, node.h, node.r);
        if (node.fill) { ctx.fillStyle = node.fill; ctx.fill(p); }
        if (node.stroke) { ctx.strokeStyle = node.stroke; ctx.lineWidth = node.strokeWidth ?? 1; ctx.stroke(p); }
      } else {
        if (node.fill) { ctx.fillStyle = node.fill; ctx.fillRect(node.x, node.y, node.w, node.h); }
        if (node.stroke) {
          ctx.strokeStyle = node.stroke;
          ctx.lineWidth = node.strokeWidth ?? 1;
          ctx.strokeRect(node.x, node.y, node.w, node.h);
        }
      }
      break;
    }
    case 'circle': {
      ctx.beginPath();
      ctx.arc(node.cx, node.cy, node.r, 0, Math.PI * 2);
      if (node.fill) { ctx.fillStyle = node.fill; ctx.fill(); }
      if (node.stroke) { ctx.strokeStyle = node.stroke; ctx.lineWidth = node.strokeWidth ?? 1; ctx.stroke(); }
      break;
    }
    case 'text': {
      if (!node.text) break;
      ctx.fillStyle = node.fill;
      ctx.font = `${node.weight ?? 400} ${node.size}px ${CHART_FONT}`;
      ctx.textAlign = node.anchor === 'end' ? 'right' : node.anchor === 'middle' ? 'center' : 'left';
      ctx.textBaseline = 'alphabetic';
      if (node.rotate) {
        ctx.save();
        ctx.translate(node.x, node.y);
        ctx.rotate((node.rotate * Math.PI) / 180);
        ctx.fillText(node.text, 0, 0);
        ctx.restore();
      } else {
        ctx.fillText(node.text, node.x, node.y);
      }
      break;
    }
  }
  ctx.globalAlpha = 1;
}

/** Zoom/pan applied on top of the scene, in scene units. */
export interface View {
  zoom: number;
  panX: number;
  panY: number;
}

export const IDENTITY_VIEW: View = { zoom: 1, panX: 0, panY: 0 };

/**
 * Paints a scene onto a canvas at `scale` device pixels per scene unit.
 *
 * `setTransform` rather than `scale`: the latter multiplies into whatever
 * matrix is already there, so a repaint that did not also resize the backing
 * store would silently draw at 2×, then 4×, then 8×.
 *
 * Zooming re-rasterises the primitives at the new scale rather than magnifying
 * pixels, so text and curves stay crisp all the way in.
 */
export function paintScene(canvas: HTMLCanvasElement, scene: Scene, scale = 1, view: View = IDENTITY_VIEW) {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

  const w = Math.max(1, Math.round(scene.width * scale));
  const h = Math.max(1, Math.round(scene.height * scale));
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = scene.background;
  ctx.fillRect(0, 0, w, h);

  const k = scale * view.zoom;
  ctx.setTransform(k, 0, 0, k, view.panX * scale, view.panY * scale);

  for (const node of scene.nodes) paintNode(ctx, node);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** Off-screen render at an arbitrary scale, for high-resolution PNG export. */
export function sceneToCanvas(scene: Scene, scale: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  paintScene(canvas, scene, scale);
  return canvas;
}

// ── SVG backend ─────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function attrs(pairs: Record<string, string | number | undefined>): string {
  return Object.entries(pairs)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}="${typeof v === 'string' ? esc(v) : v}"`)
    .join(' ');
}

function nodeToSVG(node: SceneNode): string {
  const common = { opacity: node.opacity !== undefined && node.opacity !== 1 ? node.opacity : undefined };

  switch (node.kind) {
    case 'path':
      return `<path ${attrs({
        d: node.d,
        fill: node.fill ?? 'none',
        stroke: node.stroke,
        'stroke-width': node.strokeWidth,
        'stroke-dasharray': node.dash?.join(' '),
        'stroke-linejoin': 'round',
        'stroke-linecap': 'round',
        ...common,
      })}/>`;
    case 'rect':
      return `<rect ${attrs({
        x: node.x, y: node.y, width: node.w, height: node.h, rx: node.r,
        fill: node.fill ?? 'none', stroke: node.stroke, 'stroke-width': node.strokeWidth,
        ...common,
      })}/>`;
    case 'circle':
      return `<circle ${attrs({
        cx: node.cx, cy: node.cy, r: node.r,
        fill: node.fill ?? 'none', stroke: node.stroke, 'stroke-width': node.strokeWidth,
        ...common,
      })}/>`;
    case 'text': {
      if (!node.text) return '';
      const anchor = node.anchor === 'end' ? 'end' : node.anchor === 'middle' ? 'middle' : 'start';
      return `<text ${attrs({
        x: node.x, y: node.y, fill: node.fill,
        'font-size': node.size, 'font-weight': node.weight ?? 400,
        'font-family': CHART_FONT, 'text-anchor': anchor,
        transform: node.rotate ? `rotate(${node.rotate} ${node.x} ${node.y})` : undefined,
        ...common,
      })}>${esc(node.text)}</text>`;
    }
  }
}

/**
 * Serialises the scene to standalone SVG. Real vector output — the FAQ has
 * promised this in nine languages since the tool shipped.
 */
export function sceneToSVG(scene: Scene): string {
  const body = scene.nodes.map(nodeToSVG).filter(Boolean).join('\n  ');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${scene.width}" height="${scene.height}" ` +
    `viewBox="0 0 ${scene.width} ${scene.height}" role="img">\n` +
    `  <rect width="${scene.width}" height="${scene.height}" fill="${scene.background}"/>\n` +
    `  ${body}\n</svg>`
  );
}

// ── Export helpers ──────────────────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoked on the next tick: Safari aborts the download if the URL dies in
  // the same frame the click happens.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Renders offscreen at `scale` and downloads a PNG. */
export function downloadPNG(scene: Scene, filename: string, scale: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const canvas = sceneToCanvas(scene, scale);
    canvas.toBlob(blob => {
      if (!blob) { reject(new Error('ENCODE_FAILED')); return; }
      triggerDownload(blob, filename);
      resolve();
    }, 'image/png');
  });
}

export function downloadSVG(scene: Scene, filename: string) {
  triggerDownload(new Blob([sceneToSVG(scene)], { type: 'image/svg+xml;charset=utf-8' }), filename);
}

export function downloadText(text: string, filename: string, mime: string) {
  triggerDownload(new Blob([text], { type: `${mime};charset=utf-8` }), filename);
}

/** PNG blob without touching the DOM — used for the cross-tool handoff. */
export function sceneToPNGBlob(scene: Scene, scale: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    sceneToCanvas(scene, scale).toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('ENCODE_FAILED'))),
      'image/png'
    );
  });
}

/**
 * Copies the chart to the clipboard as a PNG.
 *
 * Written as a real promise chain: the previous version awaited inside the
 * `toBlob` callback, so its surrounding try/catch had already returned and a
 * clipboard rejection (Firefox does not implement `ClipboardItem` writes)
 * surfaced as an unhandled rejection with no feedback at all.
 */
export async function copySceneToClipboard(scene: Scene, scale: number): Promise<void> {
  if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
    throw new Error('CLIPBOARD_UNSUPPORTED');
  }
  const blob = await sceneToPNGBlob(scene, scale);
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}
