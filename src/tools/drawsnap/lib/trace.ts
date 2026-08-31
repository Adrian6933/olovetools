// ============================================================================
// Photo → editable vector strokes.
// ----------------------------------------------------------------------------
// Instead of stamping a bitmap onto the board and calling it a day, this pulls
// iso-luminance contours out of the picture with marching squares and hands
// back polylines. They become ordinary pencil strokes, so every line the tracer
// produces can be moved, recoloured, erased or undone one by one — the whole
// point of exposing the intermediate data instead of a flattened result.
//
// Pure functions over ImageData: no DOM here, so it also runs inside a worker.
// ============================================================================

export interface TraceOptions {
  /** How many luminance thresholds to slice the image at (1–5). */
  levels: number;
  /** RDP tolerance in trace-space pixels. Higher = fewer, smoother points. */
  tolerance: number;
  /** Contours shorter than this (in points) are noise and get dropped. */
  minPoints: number;
  /** Contours whose bounding box is smaller than this are dropped. */
  minSize: number;
  /** Take each stroke's colour from the picture instead of using the ink colour. */
  sampleColor: boolean;
  /** Hard cap so a noisy photo cannot produce 50 000 shapes. */
  maxPaths: number;
}

export const TRACE_PRESETS: Record<'low' | 'medium' | 'high', TraceOptions> = {
  low: { levels: 1, tolerance: 2.2, minPoints: 8, minSize: 14, sampleColor: false, maxPaths: 1200 },
  medium: { levels: 3, tolerance: 1.4, minPoints: 6, minSize: 9, sampleColor: false, maxPaths: 3000 },
  high: { levels: 5, tolerance: 0.9, minPoints: 5, minSize: 6, sampleColor: false, maxPaths: 6000 },
};

export interface TracedPath {
  points: { x: number; y: number }[];
  color?: string;
}

const luminance = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/** 3×3 box blur — without it, JPEG noise turns into thousands of hairline loops. */
function blur(src: Float32Array, w: number, h: number): Float32Array {
  const out = new Float32Array(src.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= w) continue;
          sum += src[yy * w + xx];
          n++;
        }
      }
      out[y * w + x] = sum / n;
    }
  }
  return out;
}

function rdp(points: { x: number; y: number }[], tolerance: number) {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack: [number, number][] = [[0, points.length - 1]];

  while (stack.length) {
    const [first, last] = stack.pop()!;
    let maxDist = 0;
    let index = -1;
    const ax = points[first].x;
    const ay = points[first].y;
    const bx = points[last].x;
    const by = points[last].y;
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    for (let i = first + 1; i < last; i++) {
      const px = points[i].x - ax;
      const py = points[i].y - ay;
      let d: number;
      if (len2 === 0) {
        d = Math.hypot(px, py);
      } else {
        let t = (px * dx + py * dy) / len2;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        d = Math.hypot(px - t * dx, py - t * dy);
      }
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

  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < points.length; i++) if (keep[i]) out.push(points[i]);
  return out;
}

/**
 * Marching squares at one threshold. Crossing points are keyed by the *edge*
 * they sit on (integer identity), so segments from neighbouring cells chain up
 * exactly instead of relying on float equality.
 */
function contoursAt(lum: Float32Array, w: number, h: number, threshold: number): { x: number; y: number }[][] {
  const coords = new Map<number, { x: number; y: number }>();
  const adjacency = new Map<number, number[]>();
  const segA: number[] = [];
  const segB: number[] = [];

  // Edge ids: horizontal edges 0..w*h-1, vertical edges offset by w*h.
  const HOFF = 0;
  const VOFF = w * h;

  const crossing = (id: number, ax: number, ay: number, va: number, bx: number, by: number, vb: number) => {
    if (!coords.has(id)) {
      const mu = (threshold - va) / (vb - va || 1e-6);
      coords.set(id, { x: ax + (bx - ax) * mu, y: ay + (by - ay) * mu });
    }
    return id;
  };

  const link = (node: number, seg: number) => {
    const list = adjacency.get(node);
    if (list) list.push(seg);
    else adjacency.set(node, [seg]);
  };

  const push = (a: number, b: number) => {
    const i = segA.length;
    segA.push(a);
    segB.push(b);
    link(a, i);
    link(b, i);
  };

  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w - 1; x++) {
      const i00 = y * w + x;
      const v00 = lum[i00];
      const v10 = lum[i00 + 1];
      const v01 = lum[i00 + w];
      const v11 = lum[i00 + w + 1];

      const a = v00 >= threshold;
      const b = v10 >= threshold;
      const c = v11 >= threshold;
      const d = v01 >= threshold;
      if (a === b && b === c && c === d) continue;

      const hits: number[] = [];
      if (a !== b) hits.push(crossing(HOFF + i00, x, y, v00, x + 1, y, v10));
      if (b !== c) hits.push(crossing(VOFF + i00 + 1, x + 1, y, v10, x + 1, y + 1, v11));
      if (d !== c) hits.push(crossing(HOFF + i00 + w, x, y + 1, v01, x + 1, y + 1, v11));
      if (a !== d) hits.push(crossing(VOFF + i00, x, y, v00, x, y + 1, v01));

      if (hits.length === 2) {
        push(hits[0], hits[1]);
      } else if (hits.length === 4) {
        // Saddle point: the cell centre decides which way the lines run.
        const centre = (v00 + v10 + v01 + v11) / 4;
        if (centre >= threshold) {
          push(hits[0], hits[1]);
          push(hits[2], hits[3]);
        } else {
          push(hits[0], hits[3]);
          push(hits[1], hits[2]);
        }
      }
    }
  }

  // Chain the segments into polylines.
  const used = new Uint8Array(segA.length);
  const paths: { x: number; y: number }[][] = [];

  const walk = (start: number, seed: number) => {
    const chain: number[] = [];
    let node = start;
    let seg = seed;
    while (seg !== -1 && !used[seg]) {
      used[seg] = 1;
      const next = segA[seg] === node ? segB[seg] : segA[seg];
      chain.push(next);
      node = next;
      const candidates = adjacency.get(node) ?? [];
      seg = candidates.find(s => !used[s]) ?? -1;
    }
    return chain;
  };

  for (let i = 0; i < segA.length; i++) {
    if (used[i]) continue;
    const forwardChain = walk(segA[i], i);
    // Walk the other way from the seed's first node to close open contours.
    const backSeed = (adjacency.get(segA[i]) ?? []).find(s => !used[s]) ?? -1;
    const backChain = backSeed === -1 ? [] : walk(segA[i], backSeed);

    const ids = [...backChain.reverse(), segA[i], ...forwardChain];
    const pts: { x: number; y: number }[] = [];
    for (const id of ids) {
      const p = coords.get(id);
      if (p) pts.push(p);
    }
    if (pts.length >= 3) paths.push(pts);
  }

  return paths;
}

const hex = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');

export function traceImageData(image: ImageData, opts: TraceOptions): TracedPath[] {
  const { width: w, height: h, data } = image;

  let lum = new Float32Array(w * h);
  let min = 255;
  let max = 0;
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const l = luminance(data[i], data[i + 1], data[i + 2]);
    lum[p] = l;
    if (l < min) min = l;
    if (l > max) max = l;
  }
  lum = blur(lum, w, h);

  const span = Math.max(1, max - min);
  const levels = Math.max(1, Math.min(5, Math.round(opts.levels)));
  const out: TracedPath[] = [];

  for (let k = 1; k <= levels; k++) {
    const threshold = min + (span * k) / (levels + 1);
    for (const raw of contoursAt(lum, w, h, threshold)) {
      if (raw.length < opts.minPoints) continue;

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const p of raw) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
      if (maxX - minX < opts.minSize && maxY - minY < opts.minSize) continue;

      const points = rdp(raw, opts.tolerance);
      if (points.length < 3) continue;

      let color: string | undefined;
      if (opts.sampleColor) {
        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        for (let i = 0; i < points.length; i += Math.max(1, Math.floor(points.length / 12))) {
          const px = Math.max(0, Math.min(w - 1, Math.round(points[i].x)));
          const py = Math.max(0, Math.min(h - 1, Math.round(points[i].y)));
          const idx = (py * w + px) * 4;
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
          n++;
        }
        if (n) color = `#${hex(r / n)}${hex(g / n)}${hex(b / n)}`;
      }

      out.push({ points, color });
      if (out.length >= opts.maxPaths) return out;
    }
  }

  return out;
}
