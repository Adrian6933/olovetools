// ============================================================================
// PNG colour quantisation
// ----------------------------------------------------------------------------
// The one thing that actually makes a PNG smaller.
//
// `canvas.toBlob('image/png', quality)` ignores the quality argument — PNG is
// lossless and there is no knob — so the old build's quality slider did
// literally nothing to a PNG unless the user also resized. What does work is
// reducing the number of distinct colours before the encode: PNG's filters and
// DEFLATE compress a 64-colour image several times better than a 16-million
// colour one, and on flat artwork, screenshots, logos and charts the result is
// visually identical.
//
// Median cut is the classic algorithm for choosing those colours, and it is
// what pngquant uses a refined version of. Working on the ImageData directly is
// the "lower-level API that hands you the intermediate data" — the canvas gives
// us the pixels, and we get to decide what they become.
// ============================================================================

interface Box {
  /** Indices into the sampled pixel list. */
  pixels: Int32Array;
  count: number;
  rMin: number; rMax: number;
  gMin: number; gMax: number;
  bMin: number; bMax: number;
}

/** Above this many pixels the palette is chosen from a sample, not the lot. */
const MAX_SAMPLE = 200000;

function buildBox(pixels: Int32Array, count: number, rgb: Uint8Array): Box {
  let rMin = 255, rMax = 0, gMin = 255, gMax = 0, bMin = 255, bMax = 0;
  for (let i = 0; i < count; i++) {
    const p = pixels[i] * 3;
    const r = rgb[p], g = rgb[p + 1], b = rgb[p + 2];
    if (r < rMin) rMin = r;
    if (r > rMax) rMax = r;
    if (g < gMin) gMin = g;
    if (g > gMax) gMax = g;
    if (b < bMin) bMin = b;
    if (b > bMax) bMax = b;
  }
  return { pixels, count, rMin, rMax, gMin, gMax, bMin, bMax };
}

function longestAxis(box: Box): 0 | 1 | 2 {
  const r = box.rMax - box.rMin;
  const g = box.gMax - box.gMin;
  const b = box.bMax - box.bMin;
  if (r >= g && r >= b) return 0;
  return g >= b ? 1 : 2;
}

/** Splits the box at the median along its widest colour axis. */
function split(box: Box, rgb: Uint8Array): [Box, Box] {
  const axis = longestAxis(box);
  const slice = box.pixels.subarray(0, box.count);
  const values = Array.from(slice).sort((a, b) => rgb[a * 3 + axis] - rgb[b * 3 + axis]);
  const half = Math.floor(values.length / 2);
  const left = Int32Array.from(values.slice(0, half));
  const right = Int32Array.from(values.slice(half));
  return [buildBox(left, left.length, rgb), buildBox(right, right.length, rgb)];
}

function averageColour(box: Box, rgb: Uint8Array): [number, number, number] {
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < box.count; i++) {
    const p = box.pixels[i] * 3;
    r += rgb[p];
    g += rgb[p + 1];
    b += rgb[p + 2];
  }
  const n = Math.max(1, box.count);
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

export interface Palette {
  /** Flat RGB triples. */
  colors: Uint8Array;
  size: number;
}

/** Median-cut palette of at most `maxColors` entries. */
export function buildPalette(data: Uint8ClampedArray, maxColors: number): Palette {
  const total = data.length / 4;
  const step = Math.max(1, Math.ceil(total / MAX_SAMPLE));
  const sampled = Math.ceil(total / step);

  const rgb = new Uint8Array(sampled * 3);
  const indices = new Int32Array(sampled);
  for (let i = 0, s = 0; i < total; i += step, s++) {
    const p = i * 4;
    // Fully transparent pixels carry no colour worth keeping in the palette.
    rgb[s * 3] = data[p];
    rgb[s * 3 + 1] = data[p + 1];
    rgb[s * 3 + 2] = data[p + 2];
    indices[s] = s;
  }

  let boxes: Box[] = [buildBox(indices, sampled, rgb)];
  while (boxes.length < maxColors) {
    // Always split the box with the most pixels and some range left in it;
    // splitting an already-uniform box wastes a palette slot.
    let target = -1;
    let best = 0;
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      const range = Math.max(box.rMax - box.rMin, box.gMax - box.gMin, box.bMax - box.bMin);
      if (box.count > 1 && range > 0 && box.count > best) {
        best = box.count;
        target = i;
      }
    }
    if (target === -1) break;
    const [a, b] = split(boxes[target], rgb);
    boxes = [...boxes.slice(0, target), a, b, ...boxes.slice(target + 1)];
  }

  const colors = new Uint8Array(boxes.length * 3);
  boxes.forEach((box, i) => {
    const [r, g, b] = averageColour(box, rgb);
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  });
  return { colors, size: boxes.length };
}

/** Nearest palette entry by squared distance. Linear, but the palette is ≤256. */
function nearest(palette: Palette, r: number, g: number, b: number): number {
  let best = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < palette.size; i++) {
    const p = i * 3;
    const dr = r - palette.colors[p];
    const dg = g - palette.colors[p + 1];
    const db = b - palette.colors[p + 2];
    const distance = dr * dr + dg * dg + db * db;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  }
  return best;
}

/**
 * Maps every pixel onto the palette, in place.
 *
 * With `dither` the quantisation error is pushed onto the neighbours
 * (Floyd-Steinberg). That costs a few percent of file size because it adds
 * high-frequency noise for DEFLATE to chew on, but without it a gradient
 * turns into visible bands, which is the failure everyone recognises.
 */
export function applyPalette(
  image: ImageData,
  palette: Palette,
  dither: boolean
): void {
  const { data, width, height } = image;

  if (!dither) {
    for (let p = 0; p < data.length; p += 4) {
      const index = nearest(palette, data[p], data[p + 1], data[p + 2]) * 3;
      data[p] = palette.colors[index];
      data[p + 1] = palette.colors[index + 1];
      data[p + 2] = palette.colors[index + 2];
    }
    return;
  }

  // Errors are carried in a float buffer; accumulating them back into the
  // Uint8ClampedArray would clamp and lose the fraction that makes dithering
  // work at all.
  const error = new Float32Array(width * height * 3);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const p = i * 4;
      const e = i * 3;

      const r = data[p] + error[e];
      const g = data[p + 1] + error[e + 1];
      const b = data[p + 2] + error[e + 2];

      const index = nearest(
        palette,
        r < 0 ? 0 : r > 255 ? 255 : r,
        g < 0 ? 0 : g > 255 ? 255 : g,
        b < 0 ? 0 : b > 255 ? 255 : b
      ) * 3;

      const nr = palette.colors[index];
      const ng = palette.colors[index + 1];
      const nb = palette.colors[index + 2];
      data[p] = nr;
      data[p + 1] = ng;
      data[p + 2] = nb;

      const er = r - nr;
      const eg = g - ng;
      const eb = b - nb;

      const spread = (dx: number, dy: number, factor: number) => {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= width || ny >= height) return;
        const ne = (ny * width + nx) * 3;
        error[ne] += er * factor;
        error[ne + 1] += eg * factor;
        error[ne + 2] += eb * factor;
      };

      spread(1, 0, 7 / 16);
      spread(-1, 1, 3 / 16);
      spread(0, 1, 5 / 16);
      spread(1, 1, 1 / 16);
    }
  }
}

/** How many distinct colours the frame actually uses, capped for speed. */
export function countColors(data: Uint8ClampedArray, cap = 4096): number {
  const seen = new Set<number>();
  const total = data.length / 4;
  const step = Math.max(1, Math.ceil(total / MAX_SAMPLE));
  for (let i = 0; i < total; i += step) {
    const p = i * 4;
    seen.add((data[p] << 16) | (data[p + 1] << 8) | data[p + 2]);
    if (seen.size >= cap) return cap;
  }
  return seen.size;
}
