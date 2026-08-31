import type { Pt, Shape } from '../types';
import { isFree, isGeo } from '../types';

// ============================================================================
// Pure geometry helpers: simplification, smoothing, bounds and hit testing.
// No DOM, no canvas — so they can run inside a worker.
// ============================================================================

export const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

/** Perpendicular distance from `p` to the segment a→b. */
export function distToSegment(p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return dist(p, a);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/**
 * Ramer–Douglas–Peucker. A 4-second scribble arrives as ~900 raw samples;
 * simplifying on commit cuts that to ~120 with no visible difference, which is
 * what keeps the undo history and the exported SVG small.
 */
export function simplify(points: Pt[], tolerance = 0.7): Pt[] {
  if (points.length < 3) return points;

  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;

  const stack: [number, number][] = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop()!;
    let maxDist = 0;
    let index = -1;
    for (let i = first + 1; i < last; i++) {
      const d = distToSegment(points[i], points[first], points[last]);
      if (d > maxDist) {
        maxDist = d;
        index = i;
      }
    }
    if (maxDist > tolerance && index > 0) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }

  const out: Pt[] = [];
  for (let i = 0; i < points.length; i++) if (keep[i]) out.push(points[i]);
  return out;
}

/** Drops samples closer than `min` apart — raw pointer streams are very dense. */
export function thin(points: Pt[], min = 1.2): Pt[] {
  if (points.length < 2) return points;
  const out: Pt[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    if (dist(points[i], out[out.length - 1]) >= min) out.push(points[i]);
  }
  out.push(points[points.length - 1]);
  return out;
}

/** Centripetal-ish smoothing pass: averages each point with its neighbours. */
export function smooth(points: Pt[], strength = 0.5): Pt[] {
  if (points.length < 3) return points;
  const out: Pt[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const next = points[i + 1];
    out.push({
      x: cur.x + ((prev.x + next.x) / 2 - cur.x) * strength,
      y: cur.y + ((prev.y + next.y) / 2 - cur.y) * strength,
      p: cur.p + ((prev.p + next.p) / 2 - cur.p) * strength,
    });
  }
  out.push(points[points.length - 1]);
  return out;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function boundsOf(shape: Shape): Rect {
  if (isFree(shape)) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of shape.points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    if (!isFinite(minX)) return { x: 0, y: 0, w: 0, h: 0 };
    const pad = shape.width / 2 + 1;
    return { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 };
  }

  if (shape.type === 'text') {
    // Rough box: good enough for selection and for the export crop.
    const lines = shape.text.split('\n');
    const longest = lines.reduce((m, l) => Math.max(m, l.length), 0);
    return {
      x: shape.a.x - 4,
      y: shape.a.y - 4,
      w: longest * shape.size * 0.56 + 8,
      h: lines.length * shape.size * 1.25 + 8,
    };
  }

  const a = shape.a;
  const b = shape.b;
  if (shape.type === 'ellipse') {
    const rx = Math.abs(b.x - a.x);
    const ry = Math.abs(b.y - a.y);
    return { x: a.x - rx, y: a.y - ry, w: rx * 2, h: ry * 2 };
  }
  const pad = shape.type === 'image' ? 0 : shape.width / 2 + 1;
  return {
    x: Math.min(a.x, b.x) - pad,
    y: Math.min(a.y, b.y) - pad,
    w: Math.abs(b.x - a.x) + pad * 2,
    h: Math.abs(b.y - a.y) + pad * 2,
  };
}

export function unionBounds(shapes: Shape[]): Rect | null {
  if (!shapes.length) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const s of shapes) {
    const b = boundsOf(s);
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.w);
    maxY = Math.max(maxY, b.y + b.h);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

const inRect = (p: { x: number; y: number }, r: Rect, slack = 0) =>
  p.x >= r.x - slack && p.x <= r.x + r.w + slack && p.y >= r.y - slack && p.y <= r.y + r.h + slack;

/**
 * True when `p` is close enough to be considered "on" the shape. Outlines are
 * hit on their stroke, filled shapes and images anywhere inside.
 */
export function hitTest(shape: Shape, p: { x: number; y: number }, slack: number): boolean {
  const b = boundsOf(shape);
  if (!inRect(p, b, slack)) return false;

  if (shape.type === 'image' || shape.type === 'text') return true;

  if (isFree(shape)) {
    const reach = shape.width / 2 + slack;
    const pts = shape.points;
    if (pts.length === 1) return dist(p, pts[0]) <= reach;
    for (let i = 1; i < pts.length; i++) {
      if (distToSegment(p, pts[i - 1], pts[i]) <= reach) return true;
    }
    return false;
  }

  if (isGeo(shape)) {
    const reach = shape.width / 2 + slack;
    const { a, b: bb } = shape;
    if (shape.type === 'line' || shape.type === 'arrow') return distToSegment(p, a, bb) <= reach;
    if (shape.fill) return true;
    if (shape.type === 'rect') {
      const r = { x: Math.min(a.x, bb.x), y: Math.min(a.y, bb.y), w: Math.abs(bb.x - a.x), h: Math.abs(bb.y - a.y) };
      const inner = { x: r.x + reach, y: r.y + reach, w: Math.max(0, r.w - reach * 2), h: Math.max(0, r.h - reach * 2) };
      return inRect(p, r, reach) && !inRect(p, inner, -reach);
    }
    if (shape.type === 'ellipse') {
      const rx = Math.abs(bb.x - a.x) || 0.001;
      const ry = Math.abs(bb.y - a.y) || 0.001;
      const norm = ((p.x - a.x) / rx) ** 2 + ((p.y - a.y) / ry) ** 2;
      const band = reach / Math.min(rx, ry);
      return norm >= (1 - band) ** 2 && norm <= (1 + band) ** 2;
    }
    // triangle
    const apex = { x: (a.x + bb.x) / 2, y: a.y };
    const left = { x: a.x, y: bb.y };
    const right = { x: bb.x, y: bb.y };
    return (
      distToSegment(p, apex, left) <= reach ||
      distToSegment(p, left, right) <= reach ||
      distToSegment(p, right, apex) <= reach
    );
  }

  return false;
}

/** Moves any shape by a board-space delta, returning a new object. */
export function translateShape(shape: Shape, dx: number, dy: number): Shape {
  if (isFree(shape)) {
    return { ...shape, points: shape.points.map(p => ({ x: p.x + dx, y: p.y + dy, p: p.p })) };
  }
  if (shape.type === 'text') {
    return { ...shape, a: { ...shape.a, x: shape.a.x + dx, y: shape.a.y + dy } };
  }
  return {
    ...shape,
    a: { ...shape.a, x: shape.a.x + dx, y: shape.a.y + dy },
    b: { ...shape.b, x: shape.b.x + dx, y: shape.b.y + dy },
  };
}

/** Uniform scale about `origin`, used by the selection resize handle. */
export function scaleShape(shape: Shape, origin: { x: number; y: number }, factor: number): Shape {
  const map = (p: Pt): Pt => ({
    x: origin.x + (p.x - origin.x) * factor,
    y: origin.y + (p.y - origin.y) * factor,
    p: p.p,
  });
  if (isFree(shape)) {
    return { ...shape, points: shape.points.map(map), width: Math.max(0.5, shape.width * factor) };
  }
  if (shape.type === 'text') {
    return { ...shape, a: map(shape.a), size: Math.max(6, shape.size * factor) };
  }
  if (shape.type === 'image') {
    return { ...shape, a: map(shape.a), b: map(shape.b) };
  }
  return { ...shape, a: map(shape.a), b: map(shape.b), width: Math.max(0.5, shape.width * factor) };
}

/** Snaps b to a square / circle / 45° line relative to a (Shift held). */
export function constrain(a: Pt, b: Pt, kind: 'line' | 'box'): Pt {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (kind === 'line') {
    const angle = Math.atan2(dy, dx);
    const step = Math.PI / 4;
    const snapped = Math.round(angle / step) * step;
    const len = Math.hypot(dx, dy);
    return { x: a.x + Math.cos(snapped) * len, y: a.y + Math.sin(snapped) * len, p: b.p };
  }
  const size = Math.max(Math.abs(dx), Math.abs(dy));
  return { x: a.x + Math.sign(dx || 1) * size, y: a.y + Math.sign(dy || 1) * size, p: b.p };
}
