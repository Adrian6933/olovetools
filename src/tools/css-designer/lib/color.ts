// ============================================================================
// Colour maths — no dependency, everything the generator needs to speak hex,
// rgb, hsl and oklch. OKLCH matters here: it is the space CSS gradients should
// interpolate in, and printing an oklch() value is what tells a user the tool
// is from this decade.
// ============================================================================

import type { RGBA, ColorSpace } from '../types';

const clamp = (v: number, min = 0, max = 1) => (v < min ? min : v > max ? max : v);
const round = (v: number, digits = 2) => {
  const f = 10 ** digits;
  return Math.round(v * f) / f;
};

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/**
 * The CSS named colours, packed as `name:rrggbb` pairs. Pasted declarations
 * are full of `red`, `tomato` and `slategray`; without this table the whole
 * rule would be dropped as unparseable.
 */
const NAMED =
  'aliceblue:f0f8ff,antiquewhite:faebd7,aqua:00ffff,aquamarine:7fffd4,azure:f0ffff,beige:f5f5dc,bisque:ffe4c4,black:000000,blanchedalmond:ffebcd,blue:0000ff,blueviolet:8a2be2,brown:a52a2a,burlywood:deb887,cadetblue:5f9ea0,chartreuse:7fff00,chocolate:d2691e,coral:ff7f50,cornflowerblue:6495ed,cornsilk:fff8dc,crimson:dc143c,cyan:00ffff,darkblue:00008b,darkcyan:008b8b,darkgoldenrod:b8860b,darkgray:a9a9a9,darkgreen:006400,darkgrey:a9a9a9,darkkhaki:bdb76b,darkmagenta:8b008b,darkolivegreen:556b2f,darkorange:ff8c00,darkorchid:9932cc,darkred:8b0000,darksalmon:e9967a,darkseagreen:8fbc8f,darkslateblue:483d8b,darkslategray:2f4f4f,darkslategrey:2f4f4f,darkturquoise:00ced1,darkviolet:9400d3,deeppink:ff1493,deepskyblue:00bfff,dimgray:696969,dimgrey:696969,dodgerblue:1e90ff,firebrick:b22222,floralwhite:fffaf0,forestgreen:228b22,fuchsia:ff00ff,gainsboro:dcdcdc,ghostwhite:f8f8ff,gold:ffd700,goldenrod:daa520,gray:808080,green:008000,greenyellow:adff2f,grey:808080,honeydew:f0fff0,hotpink:ff69b4,indianred:cd5c5c,indigo:4b0082,ivory:fffff0,khaki:f0e68c,lavender:e6e6fa,lavenderblush:fff0f5,lawngreen:7cfc00,lemonchiffon:fffacd,lightblue:add8e6,lightcoral:f08080,lightcyan:e0ffff,lightgoldenrodyellow:fafad2,lightgray:d3d3d3,lightgreen:90ee90,lightgrey:d3d3d3,lightpink:ffb6c1,lightsalmon:ffa07a,lightseagreen:20b2aa,lightskyblue:87cefa,lightslategray:778899,lightslategrey:778899,lightsteelblue:b0c4de,lightyellow:ffffe0,lime:00ff00,limegreen:32cd32,linen:faf0e6,magenta:ff00ff,maroon:800000,mediumaquamarine:66cdaa,mediumblue:0000cd,mediumorchid:ba55d3,mediumpurple:9370db,mediumseagreen:3cb371,mediumslateblue:7b68ee,mediumspringgreen:00fa9a,mediumturquoise:48d1cc,mediumvioletred:c71585,midnightblue:191970,mintcream:f5fffa,mistyrose:ffe4e1,moccasin:ffe4b5,navajowhite:ffdead,navy:000080,oldlace:fdf5e6,olive:808000,olivedrab:6b8e23,orange:ffa500,orangered:ff4500,orchid:da70d6,palegoldenrod:eee8aa,palegreen:98fb98,paleturquoise:afeeee,palevioletred:db7093,papayawhip:ffefd5,peachpuff:ffdab9,peru:cd853f,pink:ffc0cb,plum:dda0dd,powderblue:b0e0e6,purple:800080,rebeccapurple:663399,red:ff0000,rosybrown:bc8f8f,royalblue:4169e1,saddlebrown:8b4513,salmon:fa8072,sandybrown:f4a460,seagreen:2e8b57,seashell:fff5ee,sienna:a0522d,silver:c0c0c0,skyblue:87ceeb,slateblue:6a5acd,slategray:708090,slategrey:708090,snow:fffafa,springgreen:00ff7f,steelblue:4682b4,tan:d2b48c,teal:008080,thistle:d8bfd8,tomato:ff6347,turquoise:40e0d0,violet:ee82ee,wheat:f5deb3,white:ffffff,whitesmoke:f5f5f5,yellow:ffff00,yellowgreen:9acd32';

const NAMED_COLORS: Record<string, string> = Object.fromEntries(
  NAMED.split(',').map(pair => pair.split(':') as [string, string])
);

/**
 * Accepts #rgb, #rgba, #rrggbb, #rrggbbaa, rgb()/rgba(), hsl()/hsla() and the
 * CSS colour keywords. Returns null rather than throwing so callers can decide
 * what "unparseable" means.
 */
export function parseColor(input: string): RGBA | null {
  const raw = input.trim().toLowerCase();
  if (!raw) return null;

  if (raw === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  // `currentcolor` has no fixed value, so it cannot become a swatch.
  if (raw === 'currentcolor') return null;

  const named = NAMED_COLORS[raw];
  if (named) {
    return {
      r: parseInt(named.slice(0, 2), 16),
      g: parseInt(named.slice(2, 4), 16),
      b: parseInt(named.slice(4, 6), 16),
      a: 1,
    };
  }

  if (raw.startsWith('#')) {
    const hex = raw.slice(1);
    const expand = (s: string) => parseInt(s.length === 1 ? s + s : s, 16);
    if (hex.length === 3 || hex.length === 4) {
      return {
        r: expand(hex[0]),
        g: expand(hex[1]),
        b: expand(hex[2]),
        a: hex.length === 4 ? round(expand(hex[3]) / 255, 3) : 1,
      };
    }
    if (hex.length === 6 || hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: hex.length === 8 ? round(parseInt(hex.slice(6, 8), 16) / 255, 3) : 1,
      };
    }
    return null;
  }

  const fn = raw.match(/^(rgba?|hsla?)\s*\(([^)]*)\)$/);
  if (!fn) return null;
  // Both the legacy comma syntax and the modern space syntax with a `/` alpha.
  const parts = fn[2]
    .replace(/\//g, ' ')
    .split(/[\s,]+/)
    .filter(Boolean);
  if (parts.length < 3) return null;

  const num = (s: string, scale = 1) => {
    const v = parseFloat(s);
    if (Number.isNaN(v)) return 0;
    return s.trim().endsWith('%') ? (v / 100) * scale : v;
  };
  const alpha = parts[3] !== undefined ? clamp(num(parts[3], 1)) : 1;

  if (fn[1].startsWith('rgb')) {
    return {
      r: clamp(num(parts[0], 255), 0, 255),
      g: clamp(num(parts[1], 255), 0, 255),
      b: clamp(num(parts[2], 255), 0, 255),
      a: alpha,
    };
  }

  const h = ((parseFloat(parts[0]) % 360) + 360) % 360;
  const s = clamp(parseFloat(parts[1]) / 100);
  const l = clamp(parseFloat(parts[2]) / 100);
  return { ...hslToRgb(h, s, l), a: alpha };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const seg = Math.floor(h / 60) % 6;
  const [r1, g1, b1] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ][seg];
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === rn) h = 60 * (((gn - bn) / d) % 6);
  else if (max === gn) h = 60 * ((bn - rn) / d + 2);
  else h = 60 * ((rn - gn) / d + 4);
  return { h: (h + 360) % 360, s, l };
}

// ---------------------------------------------------------------------------
// OKLCH — sRGB → linear sRGB → LMS → Oklab → polar.
// Matrices from Björn Ottosson's Oklab definition.
// ---------------------------------------------------------------------------

const srgbToLinear = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

const linearToSrgb = (v: number) => {
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
  return Math.round(clamp(c) * 255);
};

export function rgbToOklch(r: number, g: number, b: number): { l: number; c: number; h: number } {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  const okL = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const okA = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const okB = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const chroma = Math.sqrt(okA * okA + okB * okB);
  const hue = chroma < 1e-6 ? 0 : ((Math.atan2(okB, okA) * 180) / Math.PI + 360) % 360;
  return { l: okL, c: chroma, h: hue };
}

export function oklchToRgb(okL: number, chroma: number, hue: number): { r: number; g: number; b: number } {
  const rad = (hue * Math.PI) / 180;
  const okA = chroma * Math.cos(rad);
  const okB = chroma * Math.sin(rad);

  const l = (okL + 0.3963377774 * okA + 0.2158037573 * okB) ** 3;
  const m = (okL - 0.1055613458 * okA - 0.0638541728 * okB) ** 3;
  const s = (okL - 0.0894841775 * okA - 1.291485548 * okB) ** 3;

  return {
    r: linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  };
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function toHex({ r, g, b }: RGBA): string {
  const h = (v: number) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

export function toHexA(c: RGBA): string {
  if (c.a >= 1) return toHex(c);
  const a = Math.round(clamp(c.a) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${toHex(c)}${a}`;
}

/**
 * Prints a colour in the notation the user picked. `compact` drops the spaces
 * after commas, which is what Tailwind arbitrary values require.
 */
export function formatColor(color: RGBA, space: ColorSpace, compact = false): string {
  const sep = compact ? ',' : ', ';
  const r = Math.round(color.r);
  const g = Math.round(color.g);
  const b = Math.round(color.b);
  const a = round(clamp(color.a), 3);

  switch (space) {
    case 'hex':
      return toHexA(color);
    case 'rgb':
      return a >= 1 ? `rgb(${r}${sep}${g}${sep}${b})` : `rgba(${r}${sep}${g}${sep}${b}${sep}${a})`;
    case 'hsl': {
      const { h, s, l } = rgbToHsl(r, g, b);
      const base = `${round(h, 1)}${compact ? ',' : ', '}${round(s * 100, 1)}%${sep}${round(l * 100, 1)}%`;
      return a >= 1 ? `hsl(${base})` : `hsla(${base}${sep}${a})`;
    }
    case 'oklch': {
      const { l, c, h } = rgbToOklch(r, g, b);
      const base = `${round(l * 100, 2)}% ${round(c, 4)} ${round(h, 2)}`;
      return a >= 1 ? `oklch(${base})` : `oklch(${base} / ${a})`;
    }
  }
}

/** Convenience: a hex string plus an alpha, printed in the chosen notation. */
export function withAlpha(hex: string, alpha: number, space: ColorSpace, compact = false): string {
  const parsed = parseColor(hex) || { r: 0, g: 0, b: 0, a: 1 };
  return formatColor({ ...parsed, a: clamp(alpha) }, space, compact);
}

/** Always an `rgba(...)` string — what inline styles and canvas want. */
export function cssRgba(hex: string, alpha: number): string {
  const c = parseColor(hex) || { r: 0, g: 0, b: 0, a: 1 };
  return `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${round(clamp(alpha), 3)})`;
}

/** Relative luminance, used to decide whether to draw light or dark handles. */
export function luminance(hex: string): number {
  const c = parseColor(hex);
  if (!c) return 0;
  return 0.2126 * srgbToLinear(c.r) + 0.7152 * srgbToLinear(c.g) + 0.0722 * srgbToLinear(c.b);
}

/** Normalises anything the colour input might receive into a plain `#rrggbb`. */
export function normalizeHex(input: string): string | null {
  const c = parseColor(input);
  return c ? toHex(c) : null;
}
