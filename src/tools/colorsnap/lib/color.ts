// ============================================================================
// Colour maths
// ----------------------------------------------------------------------------
// Everything that decides "are these two colours the same?", "is this readable
// on that?" or "what does a deuteranope see here?" lives in this file.
//
// The old tool did all of it in raw sRGB: it deduplicated swatches with a flat
// euclidean distance of 38 and called `0.299r + 0.587g + 0.114b` luminance.
// Neither is true. sRGB is not perceptually uniform (a distance of 38 is a
// different amount of "different" in the blues than in the greens) and those
// NTSC weights operate on gamma-encoded values, so contrast decisions built on
// them are wrong by a wide margin for saturated colours.
//
// So: OKLab for anything perceptual, and the real WCAG relative luminance for
// anything about readability.
// ============================================================================

export interface RGB {
  r: number;
  g: number;
  b: number;
}

// ---------------------------------------------------------------------------
// sRGB transfer function
// ---------------------------------------------------------------------------

/** 0-255 gamma-encoded → 0-1 linear-light. Table-backed: this runs once per
 *  pixel over millions of pixels during quantisation. */
const LINEAR = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  const c = i / 255;
  LINEAR[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function srgbToLinear(v: number): number {
  return LINEAR[v & 255];
}

function linearToSrgb(v: number): number {
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(c * 255)));
}

// ---------------------------------------------------------------------------
// OKLab — Björn Ottosson's perceptual space.
// ---------------------------------------------------------------------------
// Euclidean distance in OKLab tracks perceived difference far better than in
// sRGB or even CIELAB, and it stays cheap: two 3x3 matrices and a cube root.
// That matters because k-means calls this in its inner loop.

export interface Lab {
  L: number;
  a: number;
  b: number;
}

export function rgbToOklab(r: number, g: number, b: number): Lab {
  const lr = LINEAR[r & 255];
  const lg = LINEAR[g & 255];
  const lb = LINEAR[b & 255];

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

export function oklabToRgb(L: number, a: number, bb: number): RGB {
  const l = L + 0.3963377774 * a + 0.2158037573 * bb;
  const m = L - 0.1055613458 * a - 0.0638541728 * bb;
  const s = L - 0.0894841775 * a - 1.291485548 * bb;

  const l3 = l * l * l;
  const m3 = m * m * m;
  const s3 = s * s * s;

  return {
    r: linearToSrgb(4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3),
    g: linearToSrgb(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3),
    b: linearToSrgb(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3),
  };
}

/**
 * Perceptual distance. Returned in the same units the palette report uses, so
 * the number shown to the user ("average difference 2.4") is this value scaled
 * to a 0-100 range where ~2 is the just-noticeable threshold for large fields.
 */
export function deltaEOk(a: Lab, b: Lab): number {
  const dL = a.L - b.L;
  const da = a.a - b.a;
  const db = a.b - b.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

/** OKLCH: the polar form. Chroma is what "saturated" actually means here. */
export interface LCH {
  l: number;
  c: number;
  h: number;
}

export function rgbToOklch(r: number, g: number, b: number): LCH {
  const lab = rgbToOklab(r, g, b);
  const c = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
  let h = (Math.atan2(lab.b, lab.a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: lab.L, c, h };
}

export function oklchToRgb(l: number, c: number, h: number): RGB {
  const rad = (h * Math.PI) / 180;
  return oklabToRgb(l, c * Math.cos(rad), c * Math.sin(rad));
}

// ---------------------------------------------------------------------------
// HSL — kept because designers ask for it, not because anything internal uses it
// ---------------------------------------------------------------------------

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export function rgbToHsl(r: number, g: number, b: number): HSL {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;

  if (d === 0) return { h: 0, s: 0, l: Math.round(l * 100) };

  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToRgb(h: number, s: number, l: number): RGB {
  const sn = s / 100;
  const ln = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => ln - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return {
    r: Math.round(f(0) * 255),
    g: Math.round(f(8) * 255),
    b: Math.round(f(4) * 255),
  };
}

// ---------------------------------------------------------------------------
// HEX
// ---------------------------------------------------------------------------

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/** Accepts #abc, #aabbcc, abc, aabbcc. Returns null on anything else. */
export function hexToRgb(hex: string): RGB | null {
  const clean = hex.trim().replace(/^#/, '');
  if (clean.length === 3) {
    if (!/^[0-9a-f]{3}$/i.test(clean)) return null;
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  if (clean.length === 6) {
    if (!/^[0-9a-f]{6}$/i.test(clean)) return null;
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// WCAG contrast — the real formula, on linear-light values
// ---------------------------------------------------------------------------

export function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * LINEAR[r & 255] + 0.7152 * LINEAR[g & 255] + 0.0722 * LINEAR[b & 255];
}

/** WCAG 2.1 contrast ratio, 1 to 21. */
export function contrastRatio(a: RGB, b: RGB): number {
  const la = relativeLuminance(a.r, a.g, a.b);
  const lb = relativeLuminance(b.r, b.g, b.b);
  const light = Math.max(la, lb);
  const dark = Math.min(la, lb);
  return (light + 0.05) / (dark + 0.05);
}

export type WcagGrade = 'AAA' | 'AA' | 'AA-large' | 'fail';

export function wcagGrade(ratio: number): WcagGrade {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA-large';
  return 'fail';
}

/** Black or white, whichever is more readable on the given background. */
export function readableInk(c: RGB): RGB {
  const onWhite = contrastRatio(c, { r: 255, g: 255, b: 255 });
  const onBlack = contrastRatio(c, { r: 0, g: 0, b: 0 });
  return onWhite >= onBlack ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
}

// ---------------------------------------------------------------------------
// Colour vision deficiency simulation (Viénot, Brettel & Mollon 1999)
// ---------------------------------------------------------------------------
// Applied on linear-light values — running these matrices on gamma-encoded
// bytes, which is the common shortcut, produces noticeably wrong greens.

export type CvdType = 'protanopia' | 'deuteranopia' | 'tritanopia';

const CVD_MATRIX: Record<CvdType, number[]> = {
  protanopia: [0.1121, 0.8853, -0.0005, 0.1127, 0.8897, -0.0001, 0.0045, 0.0085, 1.0000],
  deuteranopia: [0.292, 0.7054, -0.0003, 0.2934, 0.7089, 0.0001, -0.0209, 0.0286, 1.0000],
  tritanopia: [1.0, 0.1502, -0.1517, 0.0, 0.8494, 0.1519, 0.0, 0.4713, 0.5259],
};

export function simulateCvd(c: RGB, type: CvdType): RGB {
  const m = CVD_MATRIX[type];
  const r = LINEAR[c.r & 255];
  const g = LINEAR[c.g & 255];
  const b = LINEAR[c.b & 255];
  return {
    r: linearToSrgb(m[0] * r + m[1] * g + m[2] * b),
    g: linearToSrgb(m[3] * r + m[4] * g + m[5] * b),
    b: linearToSrgb(m[6] * r + m[7] * g + m[8] * b),
  };
}

// ---------------------------------------------------------------------------
// Harmonies — rotations in OKLCH, so the derived colours keep the perceived
// lightness of the seed instead of drifting the way HSL rotations do.
// ---------------------------------------------------------------------------

export type HarmonyKind = 'complementary' | 'analogous' | 'triadic' | 'tetradic' | 'splitComplementary' | 'monochrome';

const HARMONY_ANGLES: Record<Exclude<HarmonyKind, 'monochrome'>, number[]> = {
  complementary: [0, 180],
  analogous: [-30, 0, 30],
  triadic: [0, 120, 240],
  tetradic: [0, 90, 180, 270],
  splitComplementary: [0, 150, 210],
};

export function harmony(seed: RGB, kind: HarmonyKind): RGB[] {
  const { l, c, h } = rgbToOklch(seed.r, seed.g, seed.b);

  if (kind === 'monochrome') {
    return [0.35, 0.5, 0.65, 0.8].map(step => oklchToRgb(step, c * (0.6 + step * 0.4), h));
  }

  return HARMONY_ANGLES[kind].map(angle => oklchToRgb(l, c, (h + angle + 360) % 360));
}

// ---------------------------------------------------------------------------
// Naming
// ---------------------------------------------------------------------------
// A compact hue/chroma/lightness classifier rather than a 30 kB name table:
// the label is a hint next to the hex, not a specification, and it has to
// translate into nine languages — so it emits a key, not a string.

export type ColorNameKey =
  | 'black' | 'white' | 'gray'
  | 'red' | 'orange' | 'brown' | 'yellow' | 'olive' | 'green' | 'teal'
  | 'cyan' | 'blue' | 'indigo' | 'violet' | 'magenta' | 'pink';

export type ToneKey = 'deep' | 'muted' | 'vivid' | 'soft' | 'pale';

export interface ColorName {
  hue: ColorNameKey;
  tone: ToneKey | null;
}

/**
 * Upper bounds of each hue band, in OKLCH degrees.
 *
 * These are NOT the familiar HSL angles — OKLCH puts the primaries somewhere
 * else entirely, and using the HSL numbers here labels pure red as orange and
 * mid green as teal. Measured anchors: red 29, orange 51, yellow 110,
 * green 143, cyan 195, blue 264, violet 301, magenta 328. Each boundary sits
 * midway between two anchors.
 *
 * Teal/cyan and indigo/violet are missing on purpose: each pair shares one hue
 * angle and is separated by lightness below, not by angle.
 */
const HUE_BANDS: Array<[number, ColorNameKey]> = [
  [40, 'red'],
  [80, 'orange'],
  [128, 'yellow'],
  [170, 'green'],
  [230, 'cyan'],
  [283, 'blue'],
  [315, 'violet'],
  [345, 'magenta'],
  [360, 'red'],
];

export function nameColor(c: RGB): ColorName {
  const { l, c: chroma, h } = rgbToOklch(c.r, c.g, c.b);

  if (chroma < 0.028) {
    if (l < 0.2) return { hue: 'black', tone: null };
    if (l > 0.92) return { hue: 'white', tone: null };
    return { hue: 'gray', tone: l < 0.45 ? 'deep' : l > 0.72 ? 'pale' : null };
  }

  let hue: ColorNameKey = 'red';
  for (const [limit, key] of HUE_BANDS) {
    if (h < limit) {
      hue = key;
      break;
    }
  }

  // Four names that share a hue angle with another name and are told apart by
  // lightness or chroma instead. Without these, brown comes out as orange,
  // olive as yellow, teal as cyan and indigo as violet — which is how these
  // classifiers usually end up feeling wrong on ordinary photos.
  if (hue === 'orange' && l < 0.55 && chroma < 0.14) hue = 'brown';
  else if (hue === 'yellow' && l < 0.6 && chroma < 0.13) hue = 'olive';
  else if (hue === 'cyan' && l < 0.7) hue = 'teal';
  else if (hue === 'violet' && l < 0.45) hue = 'indigo';
  else if ((hue === 'red' || hue === 'magenta') && l > 0.7 && chroma < 0.22) hue = 'pink';

  let tone: ToneKey;
  if (l < 0.4) tone = 'deep';
  else if (l > 0.82) tone = 'pale';
  else if (chroma > 0.16) tone = 'vivid';
  else if (chroma < 0.07) tone = 'muted';
  else tone = 'soft';

  return { hue, tone };
}
