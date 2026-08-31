import type { Board, BgPattern, Shape, Surface } from '../types';
import { isFree } from '../types';
import { bitmapToDataUrl } from './images';
import { PATTERN_SPACING, SURFACE_COLORS, patternInk } from './render';
import { outlineToSvgPath, strokeOutline } from './stroke';

// ============================================================================
// SVG export — a real vector file.
// ----------------------------------------------------------------------------
// The previous exporter drew eraser strokes as paint in the background colour,
// which only looked right on an opaque dark board and was plain wrong on a
// transparent export. Here erasers become an SVG <mask>, so the holes are real
// holes and stay holes when you open the file in Figma or Illustrator.
// ============================================================================

const f = (v: number) => Number(v.toFixed(2));

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function freehandPath(shape: Shape & { type: 'pencil' | 'marker' | 'eraser' }, fill: string, extra = '') {
  const outline = strokeOutline(shape.points, {
    size: shape.width,
    thinning: shape.type === 'pencil' ? 0.75 : 0,
    taper: shape.type === 'pencil',
  });
  const d = outlineToSvgPath(outline);
  if (!d) return '';
  return `<path d="${d}" fill="${fill}" fill-rule="nonzero"${extra}/>`;
}

function shapeToSvg(shape: Shape): string {
  const alpha = shape.opacity !== 1 ? ` opacity="${f(shape.opacity)}"` : '';

  if (isFree(shape)) {
    if (shape.type === 'eraser') return '';
    const blend = shape.type === 'marker' ? ' style="mix-blend-mode:multiply"' : '';
    return freehandPath(shape, shape.color, alpha + blend);
  }

  if (shape.type === 'image') {
    const href = bitmapToDataUrl(shape.src);
    if (!href) return '';
    const x = Math.min(shape.a.x, shape.b.x);
    const y = Math.min(shape.a.y, shape.b.y);
    return `<image href="${href}" x="${f(x)}" y="${f(y)}" width="${f(Math.abs(shape.b.x - shape.a.x))}" height="${f(
      Math.abs(shape.b.y - shape.a.y)
    )}" preserveAspectRatio="none"${alpha}/>`;
  }

  if (shape.type === 'text') {
    const lines = shape.text.split('\n');
    const spans = lines
      .map(
        (line, i) =>
          `<tspan x="${f(shape.a.x)}" y="${f(shape.a.y + shape.size * (0.82 + i * 1.25))}">${esc(line)}</tspan>`
      )
      .join('');
    return `<text font-family="Outfit, sans-serif" font-size="${f(shape.size)}" font-weight="600" fill="${
      shape.color
    }"${alpha}>${spans}</text>`;
  }

  const { a, b } = shape;
  const stroke = ` stroke="${shape.color}" stroke-width="${f(shape.width)}" stroke-linecap="round" stroke-linejoin="round"`;
  const paint = shape.fill ? ` fill="${shape.color}"` : ` fill="none"${stroke}`;

  if (shape.type === 'line') {
    return `<line x1="${f(a.x)}" y1="${f(a.y)}" x2="${f(b.x)}" y2="${f(b.y)}"${stroke}${alpha}/>`;
  }
  if (shape.type === 'arrow') {
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    const head = Math.max(shape.width * 3.2, 10);
    const p1 = `${f(b.x - head * Math.cos(angle - Math.PI / 7))},${f(b.y - head * Math.sin(angle - Math.PI / 7))}`;
    const p2 = `${f(b.x - head * Math.cos(angle + Math.PI / 7))},${f(b.y - head * Math.sin(angle + Math.PI / 7))}`;
    return `<g${alpha}><line x1="${f(a.x)}" y1="${f(a.y)}" x2="${f(b.x)}" y2="${f(
      b.y
    )}"${stroke}/><polygon points="${f(b.x)},${f(b.y)} ${p1} ${p2}" fill="${shape.color}"/></g>`;
  }
  if (shape.type === 'rect') {
    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    const w = Math.abs(b.x - a.x);
    const h = Math.abs(b.y - a.y);
    const r = Math.min(shape.width * 0.9, w / 2, h / 2);
    return `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(r)}"${paint}${alpha}/>`;
  }
  if (shape.type === 'ellipse') {
    return `<ellipse cx="${f(a.x)}" cy="${f(a.y)}" rx="${f(Math.abs(b.x - a.x))}" ry="${f(
      Math.abs(b.y - a.y)
    )}"${paint}${alpha}/>`;
  }
  return `<polygon points="${f((a.x + b.x) / 2)},${f(a.y)} ${f(a.x)},${f(b.y)} ${f(b.x)},${f(
    b.y
  )}"${paint}${alpha}/>`;
}

function patternDef(pattern: BgPattern, ink: string): string {
  if (pattern === 'none') return '';
  const s = PATTERN_SPACING;
  const body =
    pattern === 'dots'
      ? `<circle cx="${s / 2}" cy="${s / 2}" r="1.35" fill="${ink}"/>`
      : pattern === 'grid'
      ? `<path d="M0.5 0V${s}M0 0.5H${s}" stroke="${ink}" stroke-width="1" fill="none"/>`
      : `<path d="M0 0.5H${s}" stroke="${ink}" stroke-width="1" fill="none"/>`;
  return `<pattern id="dsPattern" width="${s}" height="${s}" patternUnits="userSpaceOnUse">${body}</pattern>`;
}

export interface SvgOptions {
  board: Board;
  shapes: Shape[];
  surface: Surface;
  pattern: BgPattern;
}

export function exportSvg({ board, shapes, surface, pattern }: SvgOptions): string {
  const erasers = shapes.filter(s => s.type === 'eraser') as Extract<Shape, { type: 'eraser' }>[];

  // Masks are suffixes of the eraser list: a shape is only cut by the erasers
  // drawn *after* it, exactly like the canvas compositing order.
  const usedMasks = new Set<number>();
  const body: string[] = [];
  let group: string[] = [];
  let erasersSoFar = 0;

  const flush = () => {
    if (!group.length) return;
    const remaining = erasers.length - erasersSoFar;
    if (remaining > 0) {
      usedMasks.add(erasersSoFar);
      body.push(`<g mask="url(#dsErase${erasersSoFar})">${group.join('')}</g>`);
    } else {
      body.push(group.join(''));
    }
    group = [];
  };

  for (const shape of shapes) {
    if (shape.type === 'eraser') {
      flush();
      erasersSoFar++;
      continue;
    }
    const markup = shapeToSvg(shape);
    if (markup) group.push(markup);
  }
  flush();

  const masks = Array.from(usedMasks)
    .map(from => {
      const cuts = erasers
        .slice(from)
        .map(e => freehandPath(e, '#000'))
        .join('');
      return `<mask id="dsErase${from}" maskUnits="userSpaceOnUse" x="0" y="0" width="${board.w}" height="${board.h}"><rect width="${board.w}" height="${board.h}" fill="#fff"/>${cuts}</mask>`;
    })
    .join('');

  const paper =
    surface === 'transparent'
      ? ''
      : `<rect width="${board.w}" height="${board.h}" fill="${SURFACE_COLORS[surface]}"/>`;
  const grid =
    pattern === 'none' ? '' : `<rect width="${board.w}" height="${board.h}" fill="url(#dsPattern)"/>`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${board.w}" height="${board.h}" viewBox="0 0 ${board.w} ${board.h}">` +
    `<defs>${patternDef(pattern, patternInk(surface))}${masks}</defs>` +
    paper +
    grid +
    body.join('') +
    `</svg>`
  );
}
