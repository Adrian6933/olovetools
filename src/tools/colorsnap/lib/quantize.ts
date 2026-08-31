// ============================================================================
// The quantiser
// ----------------------------------------------------------------------------
// What the tool used to do: shrink the image to 220px, drop every pixel into a
// fixed 11x11x11 grid, average each cell and take the seven most populated.
// Three things are wrong with that. The 220px thumbnail throws away 99.6% of a
// phone photo (a small but important accent colour is interpolated out of
// existence before it is ever counted). Averaging a fixed grid cell invents
// colours that are not in the image. And ordering by raw population is not the
// same question as "which colours describe this image".
//
// What happens now, in three stages:
//
//   1. HISTOGRAM. Every sampled pixel goes into a 5-bit-per-channel bin
//      (32768 possible), which keeps the *exact* mean colour of everything
//      that landed in it. This is the intermediate representation, and it is
//      the whole point: it is small (a few thousand populated bins), it is
//      transferable, and every later decision — palette size, locked swatches,
//      "ignore the near-white background" — is recomputed from it in about a
//      millisecond, without ever touching pixel data again.
//
//   2. MEDIAN CUT. Split the colour volume along its longest axis at the
//      population median, repeatedly, until there are k boxes. Unlike a fixed
//      grid this adapts to the image: a photo that is all blues gets its boxes
//      spent on blues.
//
//   3. K-MEANS IN OKLAB. Refine those box centroids with Lloyd's algorithm in
//      a perceptually uniform space, weighted by population. This is what
//      stops two visually identical blues from both making the cut while the
//      one orange in the picture is dropped.
//
// Everything is measurable: `fidelity` is the population-weighted mean OKLab
// distance between each bin and the palette colour it was assigned to. Lower
// is better, and it is the number the UI shows.
// ============================================================================

import { deltaEOk, rgbToOklab, rgbToOklch, type Lab, type RGB } from './color';

/** 5 bits per channel. 4 bits loses distinct skin tones; 6 bits triples the
 *  bin count for a refinement k-means undoes anyway. */
const BITS = 5;
const LEVELS = 1 << BITS; // 32
const SHIFT = 8 - BITS;

export type Quality = 'fast' | 'balanced' | 'precise';

/** Sampling budget and k-means effort per quality level. */
const QUALITY: Record<Quality, { budget: number; iterations: number; kmeansPlusPlus: boolean }> = {
  fast: { budget: 120_000, iterations: 0, kmeansPlusPlus: false },
  balanced: { budget: 600_000, iterations: 10, kmeansPlusPlus: false },
  precise: { budget: 2_400_000, iterations: 40, kmeansPlusPlus: true },
};

export interface Filters {
  /** Drop bins brighter than this OKLab L (0-1). 1 keeps everything. */
  maxLightness: number;
  /** Drop bins darker than this OKLab L (0-1). 0 keeps everything. */
  minLightness: number;
  /** Drop bins below this OKLCH chroma. 0 keeps everything, including greys. */
  minChroma: number;
}

export const DEFAULT_FILTERS: Filters = { maxLightness: 1, minLightness: 0, minChroma: 0 };

/**
 * The intermediate representation. Plain typed arrays so it survives
 * `postMessage` as a transfer rather than a copy.
 */
export interface Histogram {
  /** Packed bin index, one entry per populated bin. */
  index: Uint32Array;
  /** How many sampled pixels landed in each bin. */
  count: Uint32Array;
  /** Exact mean colour of the bin, 0-255. Not the bin centre — the average of
   *  what actually landed there, which is why the palette contains real colours. */
  r: Float32Array;
  g: Float32Array;
  b: Float32Array;
  /** Total sampled (opaque) pixels. */
  sampled: number;
  /** Pixels in the source image, before sampling. */
  total: number;
  /** The sampling level this was built at. Changing it is the only edit that
   *  forces a new pixel pass; everything else re-solves from the bins. */
  quality: Quality;
}

export interface Swatch extends RGB {
  /** Share of the sampled image this swatch stands for, 0-1. */
  share: number;
  /** Set when the user pinned this colour; the solver treats it as fixed. */
  locked?: boolean;
}

export interface PaletteResult {
  swatches: Swatch[];
  /** Population-weighted mean OKLab distance, x100. ~2 is the just-noticeable
   *  threshold for large flat areas; under 5 is a faithful palette. */
  fidelity: number;
  /** Bins that survived the filters. Tells the user when a filter ate the image. */
  keptShare: number;
}

// ---------------------------------------------------------------------------
// Stage 1 — histogram
// ---------------------------------------------------------------------------

/**
 * Builds the histogram from raw RGBA. `stride` picks every Nth pixel; it is
 * derived from the quality budget so a 50 MP panorama and a 200x200 avatar
 * both cost roughly the same.
 *
 * Sampling with a stride rather than downscaling is deliberate: downscaling
 * *blends* neighbouring pixels, which is exactly how the old version lost thin
 * accents. Skipping pixels leaves the ones it keeps untouched.
 */
export function buildHistogram(data: Uint8ClampedArray, quality: Quality): Histogram {
  const total = data.length >> 2;
  const budget = QUALITY[quality].budget;
  const stride = Math.max(1, Math.floor(total / budget));

  const counts = new Uint32Array(LEVELS * LEVELS * LEVELS);
  const sumR = new Float64Array(LEVELS * LEVELS * LEVELS);
  const sumG = new Float64Array(LEVELS * LEVELS * LEVELS);
  const sumB = new Float64Array(LEVELS * LEVELS * LEVELS);

  let sampled = 0;
  const step = stride * 4;

  for (let i = 0; i < data.length; i += step) {
    // Semi-transparent pixels are composited against nothing in particular, so
    // their colour is not a colour the viewer sees. Only near-opaque counts.
    if (data[i + 3] < 200) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const key = ((r >> SHIFT) << (BITS * 2)) | ((g >> SHIFT) << BITS) | (b >> SHIFT);
    counts[key]++;
    sumR[key] += r;
    sumG[key] += g;
    sumB[key] += b;
    sampled++;
  }

  let populated = 0;
  for (let i = 0; i < counts.length; i++) if (counts[i]) populated++;

  const hist: Histogram = {
    index: new Uint32Array(populated),
    count: new Uint32Array(populated),
    r: new Float32Array(populated),
    g: new Float32Array(populated),
    b: new Float32Array(populated),
    sampled,
    total,
    quality,
  };

  let w = 0;
  for (let i = 0; i < counts.length; i++) {
    const c = counts[i];
    if (!c) continue;
    hist.index[w] = i;
    hist.count[w] = c;
    hist.r[w] = sumR[i] / c;
    hist.g[w] = sumG[i] / c;
    hist.b[w] = sumB[i] / c;
    w++;
  }

  return hist;
}

// ---------------------------------------------------------------------------
// Filtering — applied to bins, so it is instant and reversible
// ---------------------------------------------------------------------------

interface Working {
  r: Float32Array;
  g: Float32Array;
  b: Float32Array;
  count: Float64Array;
  lab: Lab[];
  n: number;
  keptShare: number;
}

function applyFilters(hist: Histogram, filters: Filters): Working {
  const n0 = hist.index.length;
  const keep: number[] = [];
  let kept = 0;

  const needsCheck =
    filters.maxLightness < 1 || filters.minLightness > 0 || filters.minChroma > 0;

  for (let i = 0; i < n0; i++) {
    if (needsCheck) {
      const { l, c } = rgbToOklch(hist.r[i], hist.g[i], hist.b[i]);
      if (l > filters.maxLightness || l < filters.minLightness || c < filters.minChroma) continue;
    }
    keep.push(i);
    kept += hist.count[i];
  }

  const n = keep.length;
  const w: Working = {
    r: new Float32Array(n),
    g: new Float32Array(n),
    b: new Float32Array(n),
    count: new Float64Array(n),
    lab: new Array(n),
    n,
    keptShare: hist.sampled > 0 ? kept / hist.sampled : 0,
  };

  for (let j = 0; j < n; j++) {
    const i = keep[j];
    w.r[j] = hist.r[i];
    w.g[j] = hist.g[i];
    w.b[j] = hist.b[i];
    w.count[j] = hist.count[i];
    w.lab[j] = rgbToOklab(hist.r[i], hist.g[i], hist.b[i]);
  }

  return w;
}

// ---------------------------------------------------------------------------
// Stage 2 — median cut
// ---------------------------------------------------------------------------

interface Box {
  members: number[];
  population: number;
}

function boxRange(w: Working, members: number[]): { axis: 0 | 1 | 2; spread: number } {
  let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
  for (const i of members) {
    const r = w.r[i], g = w.g[i], b = w.b[i];
    if (r < minR) minR = r;
    if (r > maxR) maxR = r;
    if (g < minG) minG = g;
    if (g > maxG) maxG = g;
    if (b < minB) minB = b;
    if (b > maxB) maxB = b;
  }
  // Weighted by the luma coefficients: an equal numeric spread in green is a
  // much larger perceived spread than the same in blue, so cutting the raw
  // widest axis over-splits the blues.
  const dr = (maxR - minR) * 0.3;
  const dg = (maxG - minG) * 0.59;
  const db = (maxB - minB) * 0.11;
  if (dr >= dg && dr >= db) return { axis: 0, spread: dr };
  if (dg >= db) return { axis: 1, spread: dg };
  return { axis: 2, spread: db };
}

function medianCut(w: Working, k: number): number[][] {
  if (w.n === 0) return [];

  const all: number[] = [];
  for (let i = 0; i < w.n; i++) all.push(i);

  let boxes: Box[] = [{ members: all, population: sum(w.count, all) }];

  while (boxes.length < k) {
    // Split the box with the largest population x spread. Population alone
    // never splits a small vivid region; spread alone chases noise.
    let best = -1;
    let bestScore = 0;
    for (let i = 0; i < boxes.length; i++) {
      if (boxes[i].members.length < 2) continue;
      const { spread } = boxRange(w, boxes[i].members);
      const score = spread * Math.cbrt(boxes[i].population);
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    }
    if (best < 0) break;

    const box = boxes[best];
    const { axis } = boxRange(w, box.members);
    const channel = axis === 0 ? w.r : axis === 1 ? w.g : w.b;
    const sorted = [...box.members].sort((a, b) => channel[a] - channel[b]);

    const half = box.population / 2;
    let acc = 0;
    let cut = 0;
    for (; cut < sorted.length - 1; cut++) {
      acc += w.count[sorted[cut]];
      if (acc >= half) break;
    }
    cut = Math.max(0, Math.min(sorted.length - 2, cut));

    const left = sorted.slice(0, cut + 1);
    const right = sorted.slice(cut + 1);
    boxes.splice(best, 1,
      { members: left, population: sum(w.count, left) },
      { members: right, population: sum(w.count, right) }
    );
  }

  return boxes.map(b => b.members);
}

function sum(counts: Float64Array, members: number[]): number {
  let s = 0;
  for (const i of members) s += counts[i];
  return s;
}

// ---------------------------------------------------------------------------
// Stage 3 — weighted k-means in OKLab
// ---------------------------------------------------------------------------

function centroidOf(w: Working, members: number[]): Lab {
  let L = 0, a = 0, b = 0, tot = 0;
  for (const i of members) {
    const c = w.count[i];
    L += w.lab[i].L * c;
    a += w.lab[i].a * c;
    b += w.lab[i].b * c;
    tot += c;
  }
  if (tot === 0) return { L: 0, a: 0, b: 0 };
  return { L: L / tot, a: a / tot, b: b / tot };
}

/**
 * Lloyd's algorithm, weighted by bin population, over the bins rather than the
 * pixels. That is the reason this is fast enough to run at 40 iterations: a
 * typical photo has ~6000 populated bins, not 12 million pixels.
 *
 * `fixed` holds locked swatches: they participate as attractors but are never
 * moved, so pinning a colour reshapes the rest of the palette around it.
 */
function refine(
  w: Working,
  seeds: Lab[],
  fixed: Lab[],
  iterations: number
): { centroids: Lab[]; assignment: Int32Array } {
  const centroids = seeds.map(s => ({ ...s }));
  const all = [...fixed, ...centroids];
  const assignment = new Int32Array(w.n).fill(-1);

  for (let iter = 0; iter <= iterations; iter++) {
    const groups: number[][] = all.map(() => []);
    let moved = false;

    for (let i = 0; i < w.n; i++) {
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < all.length; c++) {
        const d = deltaEOk(w.lab[i], all[c]);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      groups[best].push(i);
      if (assignment[i] !== best) {
        assignment[i] = best;
        moved = true;
      }
    }

    if (iter === iterations || !moved) break;

    // Only the non-fixed centroids move.
    for (let c = fixed.length; c < all.length; c++) {
      if (groups[c].length === 0) {
        // An emptied cluster is dead weight. Reseed it on the bin furthest
        // from its assigned centroid — that is where the palette is weakest.
        let worst = -1;
        let worstD = -1;
        for (let i = 0; i < w.n; i++) {
          const d = deltaEOk(w.lab[i], all[assignment[i]]) * Math.cbrt(w.count[i]);
          if (d > worstD) {
            worstD = d;
            worst = i;
          }
        }
        if (worst >= 0) all[c] = { ...w.lab[worst] };
        continue;
      }
      all[c] = centroidOf(w, groups[c]);
    }
  }

  return { centroids: all, assignment };
}

/** k-means++ seeding: pick spread-out starting points instead of trusting the
 *  median-cut boxes. Slower, and noticeably better on images with one huge
 *  flat background that median cut keeps subdividing. */
function kmeansPlusPlusSeeds(w: Working, k: number): Lab[] {
  const seeds: Lab[] = [];
  let first = 0;
  let bestCount = -1;
  for (let i = 0; i < w.n; i++) {
    if (w.count[i] > bestCount) {
      bestCount = w.count[i];
      first = i;
    }
  }
  seeds.push({ ...w.lab[first] });

  while (seeds.length < k && seeds.length < w.n) {
    let pick = -1;
    let bestScore = -1;
    for (let i = 0; i < w.n; i++) {
      let d = Infinity;
      for (const s of seeds) {
        const dd = deltaEOk(w.lab[i], s);
        if (dd < d) d = dd;
      }
      const score = d * d * w.count[i];
      if (score > bestScore) {
        bestScore = score;
        pick = i;
      }
    }
    if (pick < 0) break;
    seeds.push({ ...w.lab[pick] });
  }

  return seeds;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export interface SolveOptions {
  size: number;
  quality: Quality;
  filters: Filters;
  /** Colours the user pinned. They stay in the palette, exactly as given. */
  locked?: RGB[];
}

/**
 * Turns the histogram into a palette. Runs in ~1-15 ms for typical images, so
 * the UI can call it on every slider tick without re-reading a single pixel.
 */
export function solvePalette(hist: Histogram, opts: SolveOptions): PaletteResult {
  const locked = opts.locked || [];
  const w = applyFilters(hist, opts.filters);

  if (w.n === 0) {
    return {
      swatches: locked.map(c => ({ ...c, share: 0, locked: true })),
      fidelity: 0,
      keptShare: 0,
    };
  }

  const free = Math.max(0, Math.min(opts.size - locked.length, w.n));
  const { iterations, kmeansPlusPlus } = QUALITY[opts.quality];
  const fixedLab = locked.map(c => rgbToOklab(c.r, c.g, c.b));

  let seeds: Lab[];
  if (free === 0) {
    seeds = [];
  } else if (kmeansPlusPlus) {
    seeds = kmeansPlusPlusSeeds(w, free);
  } else {
    seeds = medianCut(w, free).map(members => centroidOf(w, members));
  }

  const { centroids, assignment } = refine(w, seeds, fixedLab, iterations);

  // Population and fidelity, in one pass over the bins.
  const population = new Float64Array(centroids.length);
  // The reported colour is the population-weighted mean of the *original* bin
  // colours in each cluster, not the OKLab centroid converted back. Those are
  // close but not identical, and the mean of real colours is the one that
  // actually appears in the image.
  const accR = new Float64Array(centroids.length);
  const accG = new Float64Array(centroids.length);
  const accB = new Float64Array(centroids.length);

  let errorSum = 0;
  let weightSum = 0;

  for (let i = 0; i < w.n; i++) {
    const c = assignment[i];
    const n = w.count[i];
    population[c] += n;
    accR[c] += w.r[i] * n;
    accG[c] += w.g[i] * n;
    accB[c] += w.b[i] * n;
    errorSum += deltaEOk(w.lab[i], centroids[c]) * n;
    weightSum += n;
  }

  const totalPop = weightSum || 1;
  const swatches: Swatch[] = [];

  for (let c = 0; c < centroids.length; c++) {
    const isLocked = c < fixedLab.length;
    if (isLocked) {
      swatches.push({ ...locked[c], share: population[c] / totalPop, locked: true });
      continue;
    }
    if (population[c] === 0) continue;
    swatches.push({
      r: Math.round(accR[c] / population[c]),
      g: Math.round(accG[c] / population[c]),
      b: Math.round(accB[c] / population[c]),
      share: population[c] / totalPop,
    });
  }

  // Locked colours keep their slot at the front; the rest lead with the most
  // of the image behind them.
  const lockedOut = swatches.filter(s => s.locked);
  const rest = swatches.filter(s => !s.locked).sort((a, b) => b.share - a.share);

  return {
    swatches: [...lockedOut, ...rest],
    fidelity: (errorSum / totalPop) * 100,
    keptShare: w.keptShare,
  };
}

/**
 * Maps an arbitrary colour to the closest palette entry, perceptually. Used by
 * the "recoloured with this palette" preview and by the fidelity readout.
 */
export function nearestSwatch(c: RGB, palette: RGB[]): number {
  const lab = rgbToOklab(c.r, c.g, c.b);
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < palette.length; i++) {
    const d = deltaEOk(lab, rgbToOklab(palette[i].r, palette[i].g, palette[i].b));
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}
