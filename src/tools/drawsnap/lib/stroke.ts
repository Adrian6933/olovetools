import type { Pt } from '../types';
import { smooth, thin } from './geometry';

// ============================================================================
// Variable-width stroke outline.
// ----------------------------------------------------------------------------
// A polyline stroked with a constant lineWidth is what made the old board look
// like MS Paint. Here the centreline is turned into a closed polygon whose
// half-width follows pen pressure (or speed, for a mouse), which is what gives
// ink its taper. The same polygon feeds the canvas renderer *and* the SVG
// exporter, so what you download is exactly what you saw.
// ============================================================================

export interface OutlineOptions {
  /** Nominal stroke width in board units. */
  size: number;
  /** 0 = constant width (marker/highlighter), 1 = fully pressure driven. */
  thinning: number;
  /** Taper the first/last few points to a point (pencil ink). */
  taper: boolean;
}

const CAP_STEPS = 10;

/** Half-width at a point, in board units. */
const radiusAt = (pressure: number, size: number, thinning: number) => {
  const p = Math.max(0, Math.min(1, pressure));
  return (size / 2) * (1 - thinning + thinning * (0.35 + 0.65 * p));
};

/**
 * Returns the closed outline of a stroke as a flat point list. A single point
 * yields a dot. Self-intersections at sharp corners are intentional: both the
 * canvas fill and the SVG path use the nonzero rule, which welds them shut.
 */
export function strokeOutline(rawPoints: Pt[], opts: OutlineOptions): { x: number; y: number }[] {
  const { size, thinning, taper } = opts;
  const points = smooth(thin(rawPoints, Math.max(0.8, size * 0.08)), 0.45);

  if (points.length === 0) return [];

  if (points.length === 1) {
    const r = radiusAt(points[0].p, size, thinning);
    const out: { x: number; y: number }[] = [];
    for (let i = 0; i < CAP_STEPS * 2; i++) {
      const a = (i / (CAP_STEPS * 2)) * Math.PI * 2;
      out.push({ x: points[0].x + Math.cos(a) * r, y: points[0].y + Math.sin(a) * r });
    }
    return out;
  }

  const n = points.length;
  const left: { x: number; y: number }[] = [];
  const right: { x: number; y: number }[] = [];

  // Taper length scales with the stroke so short flicks do not vanish.
  const taperLen = taper ? Math.min(6, Math.floor(n / 3)) : 0;

  for (let i = 0; i < n; i++) {
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(n - 1, i + 1)];
    let dx = next.x - prev.x;
    let dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;

    let r = radiusAt(points[i].p, size, thinning);
    if (taperLen > 0) {
      const fromStart = i / taperLen;
      const fromEnd = (n - 1 - i) / taperLen;
      const k = Math.min(1, fromStart, fromEnd);
      // sqrt keeps the taper short and ink-like instead of a long spike.
      r *= 0.25 + 0.75 * Math.sqrt(Math.max(0, k));
    }

    left.push({ x: points[i].x - dy * r, y: points[i].y + dx * r });
    right.push({ x: points[i].x + dy * r, y: points[i].y - dx * r });
  }

  const cap = (center: Pt, from: { x: number; y: number }, to: { x: number; y: number }) => {
    const a0 = Math.atan2(from.y - center.y, from.x - center.x);
    const a1 = Math.atan2(to.y - center.y, to.x - center.x);
    const r = Math.hypot(from.x - center.x, from.y - center.y);
    let delta = a1 - a0;
    while (delta <= -Math.PI) delta += Math.PI * 2;
    while (delta > Math.PI) delta -= Math.PI * 2;
    const arc: { x: number; y: number }[] = [];
    for (let i = 1; i < CAP_STEPS; i++) {
      const a = a0 + (delta * i) / CAP_STEPS;
      arc.push({ x: center.x + Math.cos(a) * r, y: center.y + Math.sin(a) * r });
    }
    return arc;
  };

  const last = n - 1;
  return [
    ...left,
    ...cap(points[last], left[last], right[last]),
    ...right.slice().reverse(),
    ...cap(points[0], right[0], left[0]),
  ];
}

/** Builds a Path2D from an outline (canvas renderer). */
export function outlinePath(outline: { x: number; y: number }[]): Path2D {
  const path = new Path2D();
  if (!outline.length) return path;
  path.moveTo(outline[0].x, outline[0].y);
  for (let i = 1; i < outline.length; i++) path.lineTo(outline[i].x, outline[i].y);
  path.closePath();
  return path;
}

/** Builds an SVG `d` attribute from an outline (exporter). */
export function outlineToSvgPath(outline: { x: number; y: number }[], precision = 2): string {
  if (!outline.length) return '';
  const f = (v: number) => Number(v.toFixed(precision));
  let d = `M${f(outline[0].x)} ${f(outline[0].y)}`;
  for (let i = 1; i < outline.length; i++) d += `L${f(outline[i].x)} ${f(outline[i].y)}`;
  return `${d}Z`;
}

/**
 * Pressure for a pointer sample. Pens report a real value; for mouse and touch
 * we derive one from speed — fast strokes go thin, which reads as intent.
 */
export function pressureFor(
  pointerType: string,
  reported: number,
  speed: number,
  previous: number
): number {
  if (pointerType === 'pen' && reported > 0) return reported;
  // 0 px/ms → 1.0, ~3 px/ms → 0.35. Smoothed so the width does not flicker.
  const target = Math.max(0.35, Math.min(1, 1 - speed / 4.5));
  return previous + (target - previous) * 0.35;
}
