import type { Board, BgPattern, Shape, Surface } from '../types';
import { isFree } from '../types';
import { getBitmap } from './images';
import { outlinePath, strokeOutline } from './stroke';

// ============================================================================
// Canvas painting.
// ----------------------------------------------------------------------------
// Split into two passes on purpose:
//   paintPaper()  — surface + pattern, never touched by the eraser
//   paintShapes() — artwork only, on its own layer, so `destination-out`
//                   erases ink and nothing else
// The old single-pass renderer baked the grid into the same bitmap, which is
// why the eraser used to punch holes through the grid dots.
// ============================================================================

export const SURFACE_COLORS: Record<Exclude<Surface, 'transparent'>, string> = {
  dark: '#0c0a12',
  light: '#f8fafc',
};

export const patternInk = (surface: Surface) =>
  surface === 'light' ? 'rgba(15,23,42,0.13)' : 'rgba(255,255,255,0.10)';

export const PATTERN_SPACING = 32;

/** One cached tile per (pattern, colour) pair — repainting 3600 dots per frame was the old cost. */
const tileCache = new Map<string, HTMLCanvasElement>();

function patternTile(pattern: BgPattern, ink: string): HTMLCanvasElement | null {
  if (pattern === 'none') return null;
  const key = `${pattern}|${ink}`;
  const cached = tileCache.get(key);
  if (cached) return cached;

  const s = PATTERN_SPACING;
  const tile = document.createElement('canvas');
  tile.width = s;
  tile.height = s;
  const ctx = tile.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = ink;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1;

  if (pattern === 'dots') {
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, 1.35, 0, Math.PI * 2);
    ctx.fill();
  } else if (pattern === 'grid') {
    ctx.beginPath();
    ctx.moveTo(0.5, 0);
    ctx.lineTo(0.5, s);
    ctx.moveTo(0, 0.5);
    ctx.lineTo(s, 0.5);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(0, 0.5);
    ctx.lineTo(s, 0.5);
    ctx.stroke();
  }

  tileCache.set(key, tile);
  return tile;
}

/** Paints the paper (surface colour + pattern) in board coordinates. */
export function paintPaper(
  ctx: CanvasRenderingContext2D,
  board: Board,
  surface: Surface,
  pattern: BgPattern
) {
  if (surface !== 'transparent') {
    ctx.fillStyle = SURFACE_COLORS[surface];
    ctx.fillRect(0, 0, board.w, board.h);
  }
  const tile = patternTile(pattern, patternInk(surface));
  if (!tile) return;
  const fill = ctx.createPattern(tile, 'repeat');
  if (!fill) return;
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, board.w, board.h);
}

/** Draws one shape. Assumes the context is already in board coordinates. */
export function drawShape(ctx: CanvasRenderingContext2D, shape: Shape) {
  ctx.save();
  ctx.globalAlpha = shape.opacity;

  if (shape.type === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000';
  } else {
    ctx.globalCompositeOperation = shape.type === 'marker' ? 'multiply' : 'source-over';
    ctx.strokeStyle = shape.color;
    ctx.fillStyle = shape.color;
  }

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = shape.width;

  if (isFree(shape)) {
    const outline = strokeOutline(shape.points, {
      size: shape.width,
      thinning: shape.type === 'pencil' ? 0.75 : 0,
      taper: shape.type === 'pencil',
    });
    ctx.fill(outlinePath(outline));
    ctx.restore();
    return;
  }

  if (shape.type === 'image') {
    const img = getBitmap(shape.src);
    if (img) {
      const x = Math.min(shape.a.x, shape.b.x);
      const y = Math.min(shape.a.y, shape.b.y);
      ctx.drawImage(img, x, y, Math.abs(shape.b.x - shape.a.x), Math.abs(shape.b.y - shape.a.y));
    }
    ctx.restore();
    return;
  }

  if (shape.type === 'text') {
    ctx.font = `600 ${shape.size}px Outfit, ui-sans-serif, system-ui, sans-serif`;
    ctx.textBaseline = 'top';
    shape.text.split('\n').forEach((line, i) => {
      ctx.fillText(line, shape.a.x, shape.a.y + i * shape.size * 1.25);
    });
    ctx.restore();
    return;
  }

  const { a, b } = shape;
  ctx.beginPath();

  if (shape.type === 'line') {
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  } else if (shape.type === 'arrow') {
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    const head = Math.max(shape.width * 3.2, 10);
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x - head * Math.cos(angle - Math.PI / 7), b.y - head * Math.sin(angle - Math.PI / 7));
    ctx.lineTo(b.x - head * Math.cos(angle + Math.PI / 7), b.y - head * Math.sin(angle + Math.PI / 7));
    ctx.closePath();
    ctx.fill();
  } else if (shape.type === 'rect') {
    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    const w = Math.abs(b.x - a.x);
    const h = Math.abs(b.y - a.y);
    const r = Math.min(shape.width * 0.9, w / 2, h / 2);
    ctx.roundRect(x, y, w, h, r);
    shape.fill ? ctx.fill() : ctx.stroke();
  } else if (shape.type === 'ellipse') {
    ctx.ellipse(a.x, a.y, Math.abs(b.x - a.x), Math.abs(b.y - a.y), 0, 0, Math.PI * 2);
    shape.fill ? ctx.fill() : ctx.stroke();
  } else {
    ctx.moveTo((a.x + b.x) / 2, a.y);
    ctx.lineTo(a.x, b.y);
    ctx.lineTo(b.x, b.y);
    ctx.closePath();
    shape.fill ? ctx.fill() : ctx.stroke();
  }

  ctx.restore();
}

/** Paints artwork onto a dedicated layer, in board coordinates. */
export function paintShapes(ctx: CanvasRenderingContext2D, shapes: Shape[]) {
  for (const shape of shapes) drawShape(ctx, shape);
}

export interface ExportOptions {
  board: Board;
  shapes: Shape[];
  surface: Surface;
  pattern: BgPattern;
  /** 1 = board size, 2 = twice as many pixels per side, and so on. */
  scale: number;
}

/**
 * Renders the whole document off-screen at any multiplier. This is what makes
 * a real 2×/4× export possible: the old version could only ever hand back the
 * on-screen bitmap, i.e. whatever the container happened to measure.
 */
export function renderToCanvas(opts: ExportOptions): HTMLCanvasElement {
  const { board, shapes, surface, pattern, scale } = opts;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(board.w * scale);
  canvas.height = Math.round(board.h * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  paintPaper(ctx, board, surface, pattern);

  // The separate ink layer only exists so `destination-out` cannot eat the
  // paper. With no eraser on the board there is nothing to protect against,
  // and skipping it avoids allocating a second full-size canvas — at 4× of a
  // 1920×1080 board that is 130 MB saved.
  if (!shapes.some(s => s.type === 'eraser')) {
    paintShapes(ctx, shapes);
    return canvas;
  }

  const ink = document.createElement('canvas');
  ink.width = canvas.width;
  ink.height = canvas.height;
  const inkCtx = ink.getContext('2d')!;
  inkCtx.scale(scale, scale);
  paintShapes(inkCtx, shapes);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(ink, 0, 0);
  return canvas;
}
