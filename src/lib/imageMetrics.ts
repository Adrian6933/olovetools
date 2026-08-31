// ============================================================================
// Quality measurement
// ----------------------------------------------------------------------------
// "Saved 68%" is half the story and the flattering half. Without a number for
// what the compression cost, quality 70 and quality 85 look identical in the
// UI, and the only way to choose between them is to squint at the preview.
//
// SSIM is the right measure here: it correlates with what people actually
// notice far better than PSNR, and unlike a real perceptual metric
// (butteraugli, SSIMULACRA) it is a hundred lines and runs in milliseconds.
// ============================================================================

/** Rec. 709 luma, the same weighting the eye applies. */
function toLuma(data: Uint8ClampedArray, width: number, height: number): Float32Array {
  const out = new Float32Array(width * height);
  for (let i = 0, p = 0; i < out.length; i++, p += 4) {
    out[i] = 0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2];
  }
  return out;
}

/**
 * Box-samples a luma plane down to a target size. SSIM on a full 24 MP photo
 * is both slow and wrong — the metric is defined on what a viewer sees, not on
 * a 1:1 pixel grid nobody looks at.
 */
function downsample(
  src: Float32Array, sw: number, sh: number, dw: number, dh: number
): Float32Array {
  if (sw === dw && sh === dh) return src;
  const out = new Float32Array(dw * dh);
  const xRatio = sw / dw;
  const yRatio = sh / dh;
  for (let y = 0; y < dh; y++) {
    const y0 = Math.floor(y * yRatio);
    const y1 = Math.min(sh, Math.max(y0 + 1, Math.floor((y + 1) * yRatio)));
    for (let x = 0; x < dw; x++) {
      const x0 = Math.floor(x * xRatio);
      const x1 = Math.min(sw, Math.max(x0 + 1, Math.floor((x + 1) * xRatio)));
      let sum = 0;
      let count = 0;
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          sum += src[yy * sw + xx];
          count++;
        }
      }
      out[y * dw + x] = count > 0 ? sum / count : 0;
    }
  }
  return out;
}

const WINDOW = 8;
const C1 = (0.01 * 255) ** 2;
const C2 = (0.03 * 255) ** 2;

/** Mean SSIM over 8x8 windows. 1 is identical; below ~0.95 starts to show. */
function meanSsim(a: Float32Array, b: Float32Array, width: number, height: number): number {
  let total = 0;
  let windows = 0;

  for (let wy = 0; wy + WINDOW <= height; wy += WINDOW) {
    for (let wx = 0; wx + WINDOW <= width; wx += WINDOW) {
      let sumA = 0;
      let sumB = 0;
      let sumAA = 0;
      let sumBB = 0;
      let sumAB = 0;

      for (let y = 0; y < WINDOW; y++) {
        const row = (wy + y) * width + wx;
        for (let x = 0; x < WINDOW; x++) {
          const va = a[row + x];
          const vb = b[row + x];
          sumA += va;
          sumB += vb;
          sumAA += va * va;
          sumBB += vb * vb;
          sumAB += va * vb;
        }
      }

      const n = WINDOW * WINDOW;
      const muA = sumA / n;
      const muB = sumB / n;
      const varA = sumAA / n - muA * muA;
      const varB = sumBB / n - muB * muB;
      const covAB = sumAB / n - muA * muB;

      const numerator = (2 * muA * muB + C1) * (2 * covAB + C2);
      const denominator = (muA * muA + muB * muB + C1) * (varA + varB + C2);
      total += denominator === 0 ? 1 : numerator / denominator;
      windows++;
    }
  }

  return windows === 0 ? 1 : total / windows;
}

/** Longest side the comparison runs at. Bigger buys no accuracy, only time. */
const MAX_SIDE = 512;

/**
 * Compares two decoded frames. They may differ in size — a resized output is
 * still being judged against its source — so both are box-sampled onto the
 * same grid first.
 */
export function compareSsim(
  a: ImageData,
  b: ImageData
): number {
  const ratio = Math.min(1, MAX_SIDE / Math.max(a.width, a.height));
  const dw = Math.max(WINDOW, Math.round(a.width * ratio));
  const dh = Math.max(WINDOW, Math.round(a.height * ratio));

  const lumaA = downsample(toLuma(a.data, a.width, a.height), a.width, a.height, dw, dh);
  const lumaB = downsample(toLuma(b.data, b.width, b.height), b.width, b.height, dw, dh);

  return meanSsim(lumaA, lumaB, dw, dh);
}

/**
 * A label for the number, because 0.982 means nothing to most people.
 * The thresholds are where visible artefacts typically start on photographic
 * content; they are advisory, and the raw figure is always shown next to them.
 */
export type QualityBand = 'identical' | 'excellent' | 'good' | 'fair' | 'poor';

export function ssimBand(ssim: number): QualityBand {
  if (ssim >= 0.995) return 'identical';
  if (ssim >= 0.98) return 'excellent';
  if (ssim >= 0.95) return 'good';
  if (ssim >= 0.90) return 'fair';
  return 'poor';
}
