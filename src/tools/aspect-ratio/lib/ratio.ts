// ============================================================================
// The whole engine of the tool: pure functions over numbers, no DOM, no React.
// ----------------------------------------------------------------------------
// The previous version was `gcd(parseInt(w), parseInt(h))` and nothing else,
// which cannot express any of the ratios people actually look up. 1.85:1 came
// out as 37:20 and 2.39:1 as 239:100. Everything here exists to fix that:
// an exact path when the numbers divide cleanly, a bounded rational
// approximation when they do not, and a catalogue to name the result.
// ============================================================================

import type { FitMode, FitResult, KnownRatio, RationalRatio, Size } from '../types';

// ---------------------------------------------------------------------------
// Number plumbing
// ---------------------------------------------------------------------------

/**
 * Parses a dimension the user typed. `parseInt` was wrong twice over: it turns
 * "1e3" into 1 and silently truncates "1920.5", and an <input type="number">
 * happily produces both.
 */
export function parseDimension(raw: string): number {
  const value = Number(String(raw).trim().replace(',', '.'));
  if (!isFinite(value) || value <= 0) return 0;
  return value;
}

/** Largest whole number dividing both, for the exact path. */
export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

/**
 * Best rational approximation of `x` with denominator at most `maxDen`, via the
 * convergents of its continued fraction. This is what makes 1.85 come back as
 * 37:20 only when you ask for a large denominator, and as a usable pair
 * otherwise — and it is exact for anything that genuinely is a simple ratio.
 */
export function bestRational(x: number, maxDen: number): Size {
  if (!isFinite(x) || x <= 0) return { w: 1, h: 1 };
  let h0 = 0;
  let k0 = 1;
  let h1 = 1;
  let k1 = 0;
  let v = x;

  for (let i = 0; i < 64; i++) {
    const a = Math.floor(v);
    const h2 = a * h1 + h0;
    const k2 = a * k1 + k0;
    if (k2 > maxDen || !isFinite(h2) || !isFinite(k2)) break;
    h0 = h1;
    k0 = k1;
    h1 = h2;
    k1 = k2;
    const rem = v - a;
    if (rem < 1e-12) break;
    v = 1 / rem;
  }

  if (k1 <= 0) return { w: Math.max(1, Math.round(x)), h: 1 };
  return { w: h1, h: k1 };
}

/**
 * Simplifies a pair of dimensions into a ratio.
 *
 * Takes the exact route (divide by the GCD) whenever both numbers are whole and
 * the simplified denominator stays readable; otherwise falls back to the
 * bounded approximation and reports how far off it is, so the UI can say
 * "≈ 1.85:1 (0.02% off)" instead of pretending 37:20 is what you wanted.
 */
export function simplifyRatio(w: number, h: number, maxDen = 40): RationalRatio {
  if (!(w > 0) || !(h > 0)) {
    return { w: 1, h: 1, decimal: 1, error: 0, exact: false };
  }

  const decimal = w / h;
  const whole = Number.isInteger(w) && Number.isInteger(h);

  if (whole) {
    const g = gcd(w, h);
    const rw = w / g;
    const rh = h / g;
    if (rh <= maxDen) {
      return { w: rw, h: rh, decimal, error: 0, exact: true };
    }
  }

  const approx = bestRational(decimal, maxDen);
  const approxDecimal = approx.w / approx.h;
  const error = Math.abs(approxDecimal - decimal) / decimal;
  return {
    w: approx.w,
    h: approx.h,
    decimal,
    error,
    exact: error < 1e-12,
  };
}

/** Rounds to the nearest multiple of `m`, never returning 0. */
export function roundToMultiple(n: number, m: number): number {
  if (m <= 1) return Math.max(1, Math.round(n));
  return Math.max(m, Math.round(n / m) * m);
}

/** Megapixels of a size, to one decimal. */
export function megapixels(size: Size): number {
  return (size.w * size.h) / 1_000_000;
}

/** Physical size in centimetres at a given DPI. */
export function toCentimetres(px: number, dpi: number): number {
  return (px / Math.max(1, dpi)) * 2.54;
}

/** Pixels needed for a physical size in centimetres at a given DPI. */
export function fromCentimetres(cm: number, dpi: number): number {
  return Math.round((cm / 2.54) * Math.max(1, dpi));
}

// ---------------------------------------------------------------------------
// Resizing
// ---------------------------------------------------------------------------

/**
 * Scales `source` so that the pinned dimension hits `target`, keeping the
 * ratio, then snaps both sides to a multiple — encoders reject odd dimensions
 * (H.264 needs even, most hardware paths want 4 or 8), which the old version
 * happily produced and left as the user's problem.
 */
export function resizeProportional(
  source: Size,
  target: number,
  pin: 'width' | 'height',
  multiple = 1
): Size {
  if (!(source.w > 0) || !(source.h > 0) || !(target > 0)) return { w: 0, h: 0 };

  const raw =
    pin === 'width'
      ? { w: target, h: (target * source.h) / source.w }
      : { w: (target * source.w) / source.h, h: target };

  return {
    w: roundToMultiple(raw.w, multiple),
    h: roundToMultiple(raw.h, multiple),
  };
}

/** How far a rounded size drifted from the source ratio, as a fraction. */
export function ratioDrift(source: Size, result: Size): number {
  if (!(source.w > 0) || !(source.h > 0) || !(result.w > 0) || !(result.h > 0)) return 0;
  const a = source.w / source.h;
  const b = result.w / result.h;
  return Math.abs(b - a) / a;
}

// ---------------------------------------------------------------------------
// Fitting: the half of the job the old tool did not do at all
// ---------------------------------------------------------------------------

/**
 * Places `source` inside `frame` and reports everything that follows from it:
 * the drawn size, how much of the source survives a `cover` crop, and how thick
 * the letterbox/pillarbox bars are for `contain`.
 */
export function fitInto(source: Size, frame: Size, mode: FitMode): FitResult {
  const empty: FitResult = {
    frame,
    drawn: { w: 0, h: 0 },
    visible: { w: 0, h: 0 },
    barX: 0,
    barY: 0,
    cropped: 0,
    padded: 0,
    scale: 1,
  };
  if (!(source.w > 0) || !(source.h > 0) || !(frame.w > 0) || !(frame.h > 0)) return empty;

  const scaleX = frame.w / source.w;
  const scaleY = frame.h / source.h;
  const scale = mode === 'cover' ? Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY);

  const drawn = { w: source.w * scale, h: source.h * scale };

  if (mode === 'cover') {
    // The frame is filled; what is lost is whatever falls outside it.
    const visible = {
      w: Math.min(source.w, frame.w / scale),
      h: Math.min(source.h, frame.h / scale),
    };
    const cropped = 1 - (visible.w * visible.h) / (source.w * source.h);
    return {
      frame,
      drawn: { w: Math.round(drawn.w), h: Math.round(drawn.h) },
      visible: { w: Math.round(visible.w), h: Math.round(visible.h) },
      barX: 0,
      barY: 0,
      cropped: Math.max(0, cropped),
      padded: 0,
      scale,
    };
  }

  // contain: nothing is lost, bars are added on the short axis.
  const barX = Math.max(0, (frame.w - drawn.w) / 2);
  const barY = Math.max(0, (frame.h - drawn.h) / 2);
  const padded = 1 - (drawn.w * drawn.h) / (frame.w * frame.h);
  return {
    frame,
    drawn: { w: Math.round(drawn.w), h: Math.round(drawn.h) },
    visible: { w: Math.round(source.w), h: Math.round(source.h) },
    barX: Math.round(barX),
    barY: Math.round(barY),
    cropped: 0,
    padded: Math.max(0, padded),
    scale,
  };
}

/**
 * Largest frame with `ratio` that fits inside `bounds`. Used to turn "I want
 * 9:16 out of this 4000×3000 photo" into concrete pixel dimensions.
 */
export function frameForRatio(bounds: Size, ratioW: number, ratioH: number, multiple = 1): Size {
  if (![bounds.w, bounds.h, ratioW, ratioH, multiple].every(v => Number.isFinite(v) && v > 0)) return { w: 0, h: 0 };
  const ratio = simplifyRatio(ratioW, ratioH, 1000000);
  if (!ratio.exact) return { w: 0, h: 0 };
  // Scale the reduced integer pair together. Independent rounding changes
  // the requested ratio. Zero means no exact frame satisfies the constraints.
  const step = Math.max(1, Math.ceil(multiple));
  const unitW = ratio.w * step;
  const unitH = ratio.h * step;
  const count = Math.floor(Math.min(bounds.w / unitW, bounds.h / unitH));
  return { w: unitW * count, h: unitH * count };
}

// ---------------------------------------------------------------------------
// The catalogue
// ---------------------------------------------------------------------------

export const KNOWN_RATIOS: KnownRatio[] = [
  // -- screens ---------------------------------------------------------------
  {
    id: '16-9', name: '16:9', w: 16, h: 9, group: 'screen', icon: 'monitor',
    labelKey: 'ratio_16_9', label: 'Widescreen HD',
    resolutions: [{ w: 1920, h: 1080 }, { w: 1280, h: 720 }, { w: 3840, h: 2160 }, { w: 2560, h: 1440 }],
  },
  {
    id: '16-10', name: '16:10', w: 16, h: 10, group: 'screen', icon: 'monitor',
    labelKey: 'ratio_16_10', label: 'Laptop widescreen',
    resolutions: [{ w: 1920, h: 1200 }, { w: 2560, h: 1600 }, { w: 1280, h: 800 }],
  },
  {
    id: '4-3', name: '4:3', w: 4, h: 3, group: 'screen', icon: 'monitor',
    labelKey: 'ratio_4_3', label: 'Classic display',
    resolutions: [{ w: 1024, h: 768 }, { w: 1600, h: 1200 }, { w: 2048, h: 1536 }],
  },
  {
    id: '21-9', name: '21:9', w: 64, h: 27, group: 'screen', icon: 'ultrawide',
    labelKey: 'ratio_21_9', label: 'Ultrawide monitor',
    resolutions: [{ w: 2560, h: 1080 }, { w: 3440, h: 1440 }, { w: 5120, h: 2160 }],
  },
  {
    id: '32-9', name: '32:9', w: 32, h: 9, group: 'screen', icon: 'ultrawide',
    labelKey: 'ratio_32_9', label: 'Super ultrawide',
    resolutions: [{ w: 3840, h: 1080 }, { w: 5120, h: 1440 }],
  },
  {
    id: '3-2', name: '3:2', w: 3, h: 2, group: 'screen', icon: 'camera',
    labelKey: 'ratio_3_2', label: '35 mm frame',
    resolutions: [{ w: 6000, h: 4000 }, { w: 3000, h: 2000 }, { w: 2160, h: 1440 }],
  },

  // -- cinema ----------------------------------------------------------------
  {
    id: '1-85', name: '1.85:1', w: 37, h: 20, group: 'cinema', icon: 'film',
    labelKey: 'ratio_185', label: 'Cinema flat', cinemaLabel: '1.85:1',
    resolutions: [{ w: 1998, h: 1080 }, { w: 3996, h: 2160 }],
  },
  {
    id: '2-39', name: '2.39:1', w: 239, h: 100, group: 'cinema', icon: 'film',
    labelKey: 'ratio_239', label: 'Anamorphic scope', cinemaLabel: '2.39:1',
    resolutions: [{ w: 2048, h: 858 }, { w: 4096, h: 1716 }],
  },
  {
    id: '2-35', name: '2.35:1', w: 47, h: 20, group: 'cinema', icon: 'film',
    labelKey: 'ratio_235', label: 'Classic scope', cinemaLabel: '2.35:1',
    resolutions: [{ w: 1920, h: 817 }],
  },
  {
    id: '1-43', name: '1.43:1', w: 143, h: 100, group: 'cinema', icon: 'film',
    labelKey: 'ratio_143', label: 'IMAX', cinemaLabel: '1.43:1',
    resolutions: [{ w: 4096, h: 2857 }],
  },

  // -- social ----------------------------------------------------------------
  {
    id: '9-16', name: '9:16', w: 9, h: 16, group: 'social', icon: 'phone',
    labelKey: 'ratio_9_16', label: 'Reels, Stories, Shorts, TikTok',
    resolutions: [{ w: 1080, h: 1920 }, { w: 720, h: 1280 }],
  },
  {
    id: '1-1', name: '1:1', w: 1, h: 1, group: 'social', icon: 'square',
    labelKey: 'ratio_1_1', label: 'Square post, avatar',
    resolutions: [{ w: 1080, h: 1080 }, { w: 512, h: 512 }],
  },
  {
    id: '4-5', name: '4:5', w: 4, h: 5, group: 'social', icon: 'portrait',
    labelKey: 'ratio_4_5', label: 'Instagram portrait feed',
    resolutions: [{ w: 1080, h: 1350 }],
  },
  {
    id: '191-100', name: '1.91:1', w: 191, h: 100, group: 'social', icon: 'ultrawide',
    labelKey: 'ratio_191', label: 'Link preview, LinkedIn, Open Graph', cinemaLabel: '1.91:1',
    resolutions: [{ w: 1200, h: 628 }, { w: 1910, h: 1000 }],
  },
  {
    id: '2-1', name: '2:1', w: 2, h: 1, group: 'social', icon: 'ultrawide',
    labelKey: 'ratio_2_1', label: 'Wide banner',
    resolutions: [{ w: 1500, h: 750 }, { w: 2400, h: 1200 }],
  },
  {
    id: '3-1', name: '3:1', w: 3, h: 1, group: 'social', icon: 'ultrawide',
    labelKey: 'ratio_3_1', label: 'X / LinkedIn cover',
    resolutions: [{ w: 1500, h: 500 }, { w: 1584, h: 528 }],
  },

  // -- print -----------------------------------------------------------------
  {
    // Defined portrait, because that is how an A4 page is held; `matchKnown`
    // tries both orientations anyway.
    id: '1-4142', name: '1:√2', w: 10000, h: 14142, group: 'print', icon: 'portrait',
    labelKey: 'ratio_a_series', label: 'A4, A3 and the whole A series', cinemaLabel: '1:1.414',
    resolutions: [{ w: 2480, h: 3508 }, { w: 3508, h: 4961 }],
  },
  {
    id: '5-4', name: '5:4', w: 5, h: 4, group: 'print', icon: 'portrait',
    labelKey: 'ratio_5_4', label: '8×10 print',
    resolutions: [{ w: 2400, h: 3000 }],
  },
  {
    id: '7-5', name: '7:5', w: 7, h: 5, group: 'print', icon: 'portrait',
    labelKey: 'ratio_7_5', label: '5×7 print',
    resolutions: [{ w: 2100, h: 1500 }],
  },
];

/**
 * Finds the catalogue entry closest to a decimal ratio, within `tolerance`
 * (relative).
 *
 * Each entry is tried in both orientations, because the catalogue lists a
 * single one: without this, a portrait A4 scan (2480×3508) matched nothing at
 * all even though √2:1 is right there. `flipped` says which way round it hit,
 * so the UI can print "A series (portrait)".
 */
export function matchKnown(
  decimal: number,
  tolerance = 0.005
): { ratio: KnownRatio; error: number; flipped: boolean } | null {
  if (!isFinite(decimal) || decimal <= 0) return null;
  let best: { ratio: KnownRatio; error: number; flipped: boolean } | null = null;
  for (const r of KNOWN_RATIOS) {
    const upright = Math.abs(r.w / r.h - decimal) / decimal;
    const flipped = Math.abs(r.h / r.w - decimal) / decimal;
    // Ties go to the upright entry: 1080×1920 is exactly 9:16 *and* exactly
    // 16:9 rotated, and the catalogue lists both, so `<` alone would keep
    // whichever came first in the array and label a Reel as "Widescreen HD".
    const useFlipped = flipped < upright;
    const error = useFlipped ? flipped : upright;
    if (error <= tolerance && (!best || error < best.error - 1e-12)) {
      best = { ratio: r, error, flipped: useFlipped };
    }
  }
  return best;
}

/**
 * Names a size, preferring an exact hit in the catalogue's resolution tables
 * over the closest arithmetic match.
 *
 * 3440×1440 is *sold* as 21:9 but is arithmetically 2.389, i.e. nearer to the
 * cinema 2.39:1 than to 64:27. Answering "2.39:1" there is technically true and
 * practically useless, so a listed resolution wins.
 */
export function identifySize(
  size: Size,
  tolerance = 0.005
): { ratio: KnownRatio; error: number; flipped: boolean } | null {
  if (!(size.w > 0) || !(size.h > 0)) return null;
  // Two passes on purpose: 1080×1920 is listed upright under 9:16 and rotated
  // under 16:9, and a single pass would return whichever entry came first.
  for (const r of KNOWN_RATIOS) {
    for (const res of r.resolutions || []) {
      if (res.w === size.w && res.h === size.h) return { ratio: r, error: 0, flipped: false };
    }
  }
  for (const r of KNOWN_RATIOS) {
    for (const res of r.resolutions || []) {
      if (res.w === size.h && res.h === size.w) return { ratio: r, error: 0, flipped: true };
    }
  }
  return matchKnown(size.w / size.h, tolerance);
}

/** Orientation of a ratio, for labelling. */
export function orientation(decimal: number): 'landscape' | 'portrait' | 'square' {
  if (Math.abs(decimal - 1) < 1e-6) return 'square';
  return decimal > 1 ? 'landscape' : 'portrait';
}

// ---------------------------------------------------------------------------
// Snippets
// ---------------------------------------------------------------------------

/** Ready-to-paste code for the current ratio/size, one entry per language. */
export function buildSnippets(ratio: RationalRatio, size: Size): { id: string; label: string; code: string }[] {
  const w = Math.round(size.w);
  const h = Math.round(size.h);
  return [
    { id: 'css', label: 'CSS', code: `aspect-ratio: ${ratio.w} / ${ratio.h};` },
    { id: 'tailwind', label: 'Tailwind', code: `class="aspect-[${ratio.w}/${ratio.h}]"` },
    { id: 'ffmpeg', label: 'FFmpeg', code: `ffmpeg -i in.mp4 -vf "scale=${w}:${h}" out.mp4` },
    {
      id: 'ffmpeg-pad',
      label: 'FFmpeg letterbox',
      code: `ffmpeg -i in.mp4 -vf "scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2" out.mp4`,
    },
    { id: 'magick', label: 'ImageMagick', code: `magick in.jpg -resize ${w}x${h}^ -gravity center -extent ${w}x${h} out.jpg` },
    { id: 'svg', label: 'SVG', code: `<svg viewBox="0 0 ${ratio.w} ${ratio.h}" preserveAspectRatio="xMidYMid meet"></svg>` },
  ];
}
