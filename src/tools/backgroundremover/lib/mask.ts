// ============================================================================
// Mask operations
// ----------------------------------------------------------------------------
// Every editing tool in the workspace mutates a single-channel mask
// (0 = transparent, 255 = opaque) instead of the pixels themselves. The visible
// canvas is always `original RGB × mask`, so nothing is ever destroyed and the
// undo stack costs one byte per pixel instead of four.
// ============================================================================

export interface Size {
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Compositing
// ---------------------------------------------------------------------------

/**
 * Writes `original RGB` with `mask` as alpha into `out`. `out` is reused across
 * frames to avoid allocating a full ImageData on every brush stroke.
 */
export function composite(
  original: Uint8ClampedArray,
  mask: Uint8ClampedArray,
  out: Uint8ClampedArray
): void {
  for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
    out[p] = original[p];
    out[p + 1] = original[p + 1];
    out[p + 2] = original[p + 2];
    // Respect any transparency the source image already had.
    out[p + 3] = (original[p + 3] * mask[i]) / 255;
  }
}

// ---------------------------------------------------------------------------
// Brushes
// ---------------------------------------------------------------------------

/**
 * Paints a soft-edged disc into the mask.
 * `value` 0 erases, 255 restores. `hardness` (0..1) controls the falloff.
 */
export function paintDisc(
  mask: Uint8ClampedArray,
  { width, height }: Size,
  cx: number,
  cy: number,
  radius: number,
  value: number,
  hardness: number
): void {
  const r = Math.max(0.5, radius);
  const x0 = Math.max(0, Math.floor(cx - r));
  const x1 = Math.min(width - 1, Math.ceil(cx + r));
  const y0 = Math.max(0, Math.floor(cy - r));
  const y1 = Math.min(height - 1, Math.ceil(cy + r));
  const inner = r * Math.min(0.99, hardness);
  const falloff = Math.max(0.001, r - inner);
  const r2 = r * r;

  for (let y = y0; y <= y1; y++) {
    const dy = y - cy;
    const rowStart = y * width;
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      const d2 = dx * dx + dy * dy;
      if (d2 > r2) continue;
      const d = Math.sqrt(d2);
      // 1 in the core, ramping to 0 at the rim.
      const strength = d <= inner ? 1 : 1 - (d - inner) / falloff;
      if (strength <= 0) continue;
      const i = rowStart + x;
      mask[i] = mask[i] + (value - mask[i]) * strength;
    }
  }
}

/**
 * "Magic brush": like the eraser, but only affects pixels whose original colour
 * is within `tolerance` of the colour sampled under the brush centre. Lets the
 * user scrub over a messy edge without eating into the subject.
 */
export function paintDiscByColor(
  mask: Uint8ClampedArray,
  original: Uint8ClampedArray,
  { width, height }: Size,
  cx: number,
  cy: number,
  radius: number,
  tolerance: number,
  value: number,
  sample: { r: number; g: number; b: number }
): void {
  const r = Math.max(0.5, radius);
  const x0 = Math.max(0, Math.floor(cx - r));
  const x1 = Math.min(width - 1, Math.ceil(cx + r));
  const y0 = Math.max(0, Math.floor(cy - r));
  const y1 = Math.min(height - 1, Math.ceil(cy + r));
  const r2 = r * r;
  const tol2 = tolerance * tolerance * 3;

  for (let y = y0; y <= y1; y++) {
    const dy = y - cy;
    const rowStart = y * width;
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      if (dx * dx + dy * dy > r2) continue;
      const i = rowStart + x;
      const p = i * 4;
      const dr = original[p] - sample.r;
      const dg = original[p + 1] - sample.g;
      const db = original[p + 2] - sample.b;
      const dist2 = dr * dr + dg * dg + db * db;
      if (dist2 > tol2) continue;
      // Soft ramp near the tolerance limit keeps edges from looking cut out.
      const strength = 1 - Math.sqrt(dist2 / tol2) * 0.35;
      mask[i] = mask[i] + (value - mask[i]) * strength;
    }
  }
}

export function sampleColor(
  original: Uint8ClampedArray,
  { width, height }: Size,
  x: number,
  y: number
): { r: number; g: number; b: number } {
  const sx = Math.min(width - 1, Math.max(0, Math.round(x)));
  const sy = Math.min(height - 1, Math.max(0, Math.round(y)));
  const p = (sy * width + sx) * 4;
  return { r: original[p], g: original[p + 1], b: original[p + 2] };
}

// ---------------------------------------------------------------------------
// Magic wand (contiguous flood fill on the ORIGINAL colours)
// ---------------------------------------------------------------------------

export function floodFill(
  mask: Uint8ClampedArray,
  original: Uint8ClampedArray,
  { width, height }: Size,
  sx: number,
  sy: number,
  tolerance: number,
  value: number
): void {
  const startX = Math.min(width - 1, Math.max(0, Math.round(sx)));
  const startY = Math.min(height - 1, Math.max(0, Math.round(sy)));
  const start = startY * width + startX;
  const si = start * 4;
  const sr = original[si];
  const sg = original[si + 1];
  const sb = original[si + 2];
  const tol2 = tolerance * tolerance * 3;

  const visited = new Uint8Array(width * height);
  // Typed stack: a plain array of 12M numbers would thrash the GC.
  const stack = new Int32Array(width * height);
  let top = 0;
  stack[top++] = start;
  visited[start] = 1;

  while (top > 0) {
    const p = stack[--top];
    const pi = p * 4;
    const dr = original[pi] - sr;
    const dg = original[pi + 1] - sg;
    const db = original[pi + 2] - sb;
    if (dr * dr + dg * dg + db * db > tol2) continue;

    mask[p] = value;

    const px = p % width;
    if (px > 0 && !visited[p - 1]) { visited[p - 1] = 1; stack[top++] = p - 1; }
    if (px < width - 1 && !visited[p + 1]) { visited[p + 1] = 1; stack[top++] = p + 1; }
    if (p >= width && !visited[p - width]) { visited[p - width] = 1; stack[top++] = p - width; }
    if (p < width * (height - 1) && !visited[p + width]) { visited[p + width] = 1; stack[top++] = p + width; }
  }
}

/** Non-contiguous variant: every pixel similar to the sample, anywhere. */
export function globalColorFill(
  mask: Uint8ClampedArray,
  original: Uint8ClampedArray,
  sx: number,
  sy: number,
  width: number,
  tolerance: number,
  value: number
): void {
  const si = (Math.round(sy) * width + Math.round(sx)) * 4;
  const sr = original[si];
  const sg = original[si + 1];
  const sb = original[si + 2];
  const tol2 = tolerance * tolerance * 3;
  for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
    const dr = original[p] - sr;
    const dg = original[p + 1] - sg;
    const db = original[p + 2] - sb;
    if (dr * dr + dg * dg + db * db <= tol2) mask[i] = value;
  }
}

// ---------------------------------------------------------------------------
// Polygon selection
// ---------------------------------------------------------------------------

export function fillPolygon(
  mask: Uint8ClampedArray,
  { width, height }: Size,
  points: { x: number; y: number }[],
  value: number,
  invert = false
): void {
  if (points.length < 3) return;
  // Rasterise the polygon into a scratch canvas: the browser's even-odd fill is
  // both faster and more accurate than a hand-rolled scanline.
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
  ctx.fill();
  const poly = ctx.getImageData(0, 0, width, height).data;

  for (let i = 0, p = 3; i < mask.length; i++, p += 4) {
    const inside = poly[p] > 127;
    if (inside !== invert) mask[i] = value;
  }
}

// ---------------------------------------------------------------------------
// Edge refinement
// ---------------------------------------------------------------------------

/** Separable box blur — used for feathering and smoothing the mask. */
export function blurMask(mask: Uint8ClampedArray, { width, height }: Size, radius: number): void {
  const r = Math.round(radius);
  if (r < 1) return;
  const tmp = new Uint8ClampedArray(mask.length);
  const window = r * 2 + 1;

  // Horizontal pass
  for (let y = 0; y < height; y++) {
    const row = y * width;
    let sum = 0;
    for (let x = -r; x <= r; x++) sum += mask[row + Math.min(width - 1, Math.max(0, x))];
    for (let x = 0; x < width; x++) {
      tmp[row + x] = sum / window;
      const out = row + Math.min(width - 1, Math.max(0, x - r));
      const inn = row + Math.min(width - 1, Math.max(0, x + r + 1));
      sum += mask[inn] - mask[out];
    }
  }

  // Vertical pass
  for (let x = 0; x < width; x++) {
    let sum = 0;
    for (let y = -r; y <= r; y++) sum += tmp[Math.min(height - 1, Math.max(0, y)) * width + x];
    for (let y = 0; y < height; y++) {
      mask[y * width + x] = sum / window;
      const out = Math.min(height - 1, Math.max(0, y - r)) * width + x;
      const inn = Math.min(height - 1, Math.max(0, y + r + 1)) * width + x;
      sum += tmp[inn] - tmp[out];
    }
  }
}

/**
 * Grows (px > 0) or shrinks (px < 0) the opaque area. Shrinking by a pixel or
 * two is the classic fix for the pale halo left by the original background.
 */
export function expandMask(mask: Uint8ClampedArray, size: Size, px: number): void {
  const amount = Math.round(px);
  if (amount === 0) return;
  const { width, height } = size;
  const r = Math.abs(amount);
  const grow = amount > 0;
  const tmp = new Uint8ClampedArray(mask.length);

  // Horizontal min/max pass
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      let best = grow ? 0 : 255;
      const from = Math.max(0, x - r);
      const to = Math.min(width - 1, x + r);
      for (let k = from; k <= to; k++) {
        const v = mask[row + k];
        if (grow ? v > best : v < best) best = v;
      }
      tmp[row + x] = best;
    }
  }

  // Vertical min/max pass
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let best = grow ? 0 : 255;
      const from = Math.max(0, y - r);
      const to = Math.min(height - 1, y + r);
      for (let k = from; k <= to; k++) {
        const v = tmp[k * width + x];
        if (grow ? v > best : v < best) best = v;
      }
      mask[y * width + x] = best;
    }
  }
}

/**
 * Pushes contrast into the mask so semi-transparent noise resolves into either
 * subject or background. Keeps genuine soft edges (hair) intact by only acting
 * on the midtones.
 */
export function sharpenMaskEdges(mask: Uint8ClampedArray, amount: number): void {
  // amount 0..1 → gamma-style S-curve around 128
  const k = 1 + amount * 8;
  for (let i = 0; i < mask.length; i++) {
    const v = mask[i] / 255;
    if (v <= 0 || v >= 1) continue;
    mask[i] = (1 / (1 + Math.exp(-k * (v - 0.5)))) * 255;
  }
}

/**
 * Colour decontamination: edge pixels keep a tint of the background that was
 * removed. For every partially transparent pixel we pull its colour towards the
 * nearest fully opaque neighbour, which kills the green/white fringe.
 */
export function despill(
  rgba: Uint8ClampedArray,
  mask: Uint8ClampedArray,
  { width, height }: Size,
  strength: number
): void {
  if (strength <= 0) return;
  const src = new Uint8ClampedArray(rgba);
  const radius = 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const a = mask[i];
      if (a <= 4 || a >= 250) continue;

      let rs = 0, gs = 0, bs = 0, n = 0;
      const y0 = Math.max(0, y - radius);
      const y1 = Math.min(height - 1, y + radius);
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(width - 1, x + radius);
      for (let yy = y0; yy <= y1; yy++) {
        for (let xx = x0; xx <= x1; xx++) {
          const j = yy * width + xx;
          if (mask[j] < 250) continue;
          const q = j * 4;
          rs += src[q]; gs += src[q + 1]; bs += src[q + 2];
          n++;
        }
      }
      if (n === 0) continue;

      // Fully transparent pixels get pulled the hardest.
      const blend = strength * (1 - a / 255);
      const p = i * 4;
      rgba[p] = src[p] + (rs / n - src[p]) * blend;
      rgba[p + 1] = src[p + 1] + (gs / n - src[p + 1]) * blend;
      rgba[p + 2] = src[p + 2] + (bs / n - src[p + 2]) * blend;
    }
  }
}

// ---------------------------------------------------------------------------
// Guided-filter matting
// ---------------------------------------------------------------------------

/** Separable box blur over a Float32 plane. Used by the guided filter. */
function boxFloat(src: Float32Array, width: number, height: number, r: number): Float32Array {
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  const win = r * 2 + 1;

  for (let y = 0; y < height; y++) {
    const row = y * width;
    let sum = 0;
    for (let x = -r; x <= r; x++) sum += src[row + Math.min(width - 1, Math.max(0, x))];
    for (let x = 0; x < width; x++) {
      tmp[row + x] = sum / win;
      sum += src[row + Math.min(width - 1, x + r + 1)] - src[row + Math.max(0, x - r)];
    }
  }

  for (let x = 0; x < width; x++) {
    let sum = 0;
    for (let y = -r; y <= r; y++) sum += tmp[Math.min(height - 1, Math.max(0, y)) * width + x];
    for (let y = 0; y < height; y++) {
      out[y * width + x] = sum / win;
      sum +=
        tmp[Math.min(height - 1, y + r + 1) * width + x] - tmp[Math.max(0, y - r) * width + x];
    }
  }
  return out;
}

/**
 * Guided filter (He et al.) with the photo's luminance as the guide.
 *
 * The segmentation model works on a downscaled input, so the mask it returns is
 * an upscaled — and therefore soft and slightly misaligned — approximation of
 * the real silhouette. Re-filtering it against the full-resolution image snaps
 * the mask back onto the actual edges and recovers hair and fur that a plain
 * resize turns to mush.
 *
 * O(n) regardless of radius, so it stays usable on 20+ megapixel photos.
 */
export function guidedRefine(
  mask: Uint8ClampedArray,
  rgba: Uint8ClampedArray,
  { width, height }: Size,
  radius = 4,
  eps = 1e-4
): void {
  const n = width * height;
  const guide = new Float32Array(n);
  const input = new Float32Array(n);

  for (let i = 0, p = 0; i < n; i++, p += 4) {
    // Rec. 709 luma, normalised — matches how the eye reads edge contrast.
    guide[i] = (0.2126 * rgba[p] + 0.7152 * rgba[p + 1] + 0.0722 * rgba[p + 2]) / 255;
    input[i] = mask[i] / 255;
  }

  const meanI = boxFloat(guide, width, height, radius);
  const meanP = boxFloat(input, width, height, radius);

  const ii = new Float32Array(n);
  const ip = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    ii[i] = guide[i] * guide[i];
    ip[i] = guide[i] * input[i];
  }
  const corrI = boxFloat(ii, width, height, radius);
  const corrIp = boxFloat(ip, width, height, radius);

  const a = new Float32Array(n);
  const b = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const varI = corrI[i] - meanI[i] * meanI[i];
    const covIp = corrIp[i] - meanI[i] * meanP[i];
    a[i] = covIp / (varI + eps);
    b[i] = meanP[i] - a[i] * meanI[i];
  }

  const meanA = boxFloat(a, width, height, radius);
  const meanB = boxFloat(b, width, height, radius);

  for (let i = 0; i < n; i++) {
    const v = meanA[i] * guide[i] + meanB[i];
    mask[i] = v <= 0 ? 0 : v >= 1 ? 255 : v * 255;
  }
}

/**
 * Linear contrast stretch: everything below `lo` becomes fully transparent,
 * everything above `hi` fully opaque, and the band between them is remapped
 * across the full range.
 */
export function contrastMask(mask: Uint8ClampedArray, lo: number, hi: number): void {
  const span = Math.max(1, hi - lo);
  for (let i = 0; i < mask.length; i++) {
    const v = mask[i];
    mask[i] = v <= lo ? 0 : v >= hi ? 255 : ((v - lo) / span) * 255;
  }
}

/**
 * Full post-pass applied to every fresh AI mask.
 *
 * The guided filter alone is not enough: where the guide image is flat (a sky,
 * a studio backdrop) its local variance collapses and it degenerates into a
 * plain box blur, which *widens* the transition instead of tightening it.
 *
 * The cleanup for that has to be selective. A global contrast stretch also
 * flattens regions where the model itself was genuinely unsure — a
 * half-confident limb gets deleted outright. So the stretch is applied only
 * where the model *was* confident before filtering: that is exactly where the
 * haze came from blurring a hard edge, and it leaves real uncertainty, hair and
 * motion blur untouched.
 */
export function refineAIMask(
  mask: Uint8ClampedArray,
  rgba: Uint8ClampedArray,
  size: Size,
  strength = 1
): void {
  if (strength <= 0) return;
  const confident = new Uint8Array(mask.length);
  for (let i = 0; i < mask.length; i++) confident[i] = mask[i] < 24 || mask[i] > 231 ? 1 : 0;

  // Scale the radius with the image so the effect looks the same at any size.
  const radius = Math.max(2, Math.round(Math.min(size.width, size.height) / 320));
  guidedRefine(mask, rgba, size, radius, 1e-4);

  const lo = 82;
  const hi = 174;
  const span = hi - lo;
  for (let i = 0; i < mask.length; i++) {
    if (!confident[i]) continue;
    const v = mask[i];
    mask[i] = v <= lo ? 0 : v >= hi ? 255 : ((v - lo) / span) * 255;
  }
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

/** Bounding box of everything above `threshold`, or null when the mask is empty. */
export function maskBounds(
  mask: Uint8ClampedArray,
  { width, height }: Size,
  threshold = 8
): { x: number; y: number; width: number; height: number } | null {
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      if (mask[row + x] <= threshold) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

export function invertMask(mask: Uint8ClampedArray): void {
  for (let i = 0; i < mask.length; i++) mask[i] = 255 - mask[i];
}
