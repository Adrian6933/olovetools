// ============================================================================
// Motor de color de hex-to-rgb
// ----------------------------------------------------------------------------
// Dos decisiones de fondo:
//
// 1. El parser de entrada no es una regex: es el propio motor del navegador.
//    `getComputedStyle` resuelve CUALQUIER sintaxis de CSS Color 4 — nombres,
//    hwb(), lab(), lch(), oklab(), oklch(), color(display-p3 …), color-mix() —
//    y nos devuelve el dato intermedio ya en sRGB. La regex hecha a mano queda
//    solo como respaldo determinista para el render de servidor y para los
//    navegadores que no exponen el parser (ahí perdemos sintaxis modernas, no
//    corrección).
//
// 2. Todo se calcula en coma flotante y solo se redondea al formatear. El tool
//    anterior redondeaba HSL a enteros dentro del propio cálculo, así que
//    HEX → HSL → HEX no volvía al punto de partida.
// ============================================================================

import { TAILWIND_PALETTE } from './tailwind-palette';

/** r, g, b en 0–255 (coma flotante, sin redondear); a en 0–1. */
export interface Rgb {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Oklch {
  /** Claridad perceptual 0–1 */
  l: number;
  /** Croma, 0 → gris. Sin techo fijo: depende del tono. */
  c: number;
  /** Tono en grados 0–360 */
  h: number;
}

export interface Hsl {
  h: number;
  s: number;
  l: number;
}
export interface Hwb {
  h: number;
  w: number;
  b: number;
}
export interface Cmyk {
  c: number;
  m: number;
  y: number;
  k: number;
}

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// ---------------------------------------------------------------------------
// sRGB ↔ lineal
// ---------------------------------------------------------------------------

export const srgbToLinear = (c: number): number =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

export const linearToSrgb = (c: number): number =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;

// ---------------------------------------------------------------------------
// OKLab / OKLCH (Björn Ottosson). Las matrices son las de la especificación
// CSS Color 4, así que oklch() de aquí y oklch() del navegador coinciden.
// ---------------------------------------------------------------------------

const LRGB_TO_LMS = [
  [0.4122214708, 0.5363325363, 0.0514459929],
  [0.2119034982, 0.6806995451, 0.1073969566],
  [0.0883024619, 0.2817188376, 0.6299787005],
];
const LMS_TO_OKLAB = [
  [0.2104542553, 0.793617785, -0.0040720468],
  [1.9779984951, -2.428592205, 0.4505937099],
  [0.0259040371, 0.7827717662, -0.808675766],
];
const OKLAB_TO_LMS = [
  [1.0, 0.3963377774, 0.2158037573],
  [1.0, -0.1055613458, -0.0638541728],
  [1.0, -0.0894841775, -1.291485548],
];
const LMS_TO_LRGB = [
  [4.0767416621, -3.3077115913, 0.2309699292],
  [-1.2684380046, 2.6097574011, -0.3413193965],
  [-0.0041960863, -0.7034186147, 1.707614701],
];

const mul = (m: number[][], v: number[]): [number, number, number] => [
  m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
  m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
  m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
];

export interface Oklab {
  l: number;
  a: number;
  b: number;
}

export const rgbToOklab = (rgb: Rgb): Oklab => {
  const lrgb = [srgbToLinear(rgb.r / 255), srgbToLinear(rgb.g / 255), srgbToLinear(rgb.b / 255)];
  const lms = mul(LRGB_TO_LMS, lrgb).map((v) => Math.cbrt(v));
  const [l, a, b] = mul(LMS_TO_OKLAB, lms);
  return { l, a, b };
};

/** OKLab → sRGB **lineal**, sin recortar: los negativos y los >1 son colores
 *  fuera del gamut sRGB, y necesitamos verlos para poder mapearlos. */
const oklabToLinearRgb = (lab: Oklab): [number, number, number] => {
  const lms = mul(OKLAB_TO_LMS, [lab.l, lab.a, lab.b]).map((v) => v * v * v);
  return mul(LMS_TO_LRGB, lms);
};

export const oklabToRgb = (lab: Oklab, alpha = 1): Rgb => {
  const [lr, lg, lb] = oklabToLinearRgb(lab);
  return {
    r: clamp(linearToSrgb(lr), 0, 1) * 255,
    g: clamp(linearToSrgb(lg), 0, 1) * 255,
    b: clamp(linearToSrgb(lb), 0, 1) * 255,
    a: alpha,
  };
};

export const rgbToOklch = (rgb: Rgb): Oklch => {
  const { l, a, b } = rgbToOklab(rgb);
  const c = Math.sqrt(a * a + b * b);
  // Por debajo de este croma el tono es ruido de coma flotante: un gris no
  // tiene tono, y dejarlo oscilar hace que las armonías salten al azar.
  let h = c < 1e-6 ? 0 : (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l, c, h };
};

export const oklchToOklab = ({ l, c, h }: Oklch): Oklab => ({
  l,
  a: c * Math.cos((h * Math.PI) / 180),
  b: c * Math.sin((h * Math.PI) / 180),
});

const EPS = 0.0001;
const linearInGamut = ([r, g, b]: [number, number, number]) =>
  r >= -EPS && r <= 1 + EPS && g >= -EPS && g <= 1 + EPS && b >= -EPS && b <= 1 + EPS;

export const oklchInSrgb = (oklch: Oklch): boolean =>
  linearInGamut(oklabToLinearRgb(oklchToOklab(oklch)));

/**
 * Lleva un OKLCH fuera de gamut a sRGB bajando el croma (nunca la claridad ni
 * el tono) por bisección, que es lo que manda CSS Color 4. Recortar los tres
 * canales a saco — lo que hace un `clamp` directo — desplaza el tono: un
 * oklch(0.7 0.25 145) recortado se vuelve visiblemente más amarillo.
 */
export const gamutMapOklch = (target: Oklch): { rgb: Rgb; clipped: boolean; deltaE: number } => {
  const direct = oklabToLinearRgb(oklchToOklab(target));
  if (linearInGamut(direct)) {
    return {
      rgb: {
        r: clamp(linearToSrgb(direct[0]), 0, 1) * 255,
        g: clamp(linearToSrgb(direct[1]), 0, 1) * 255,
        b: clamp(linearToSrgb(direct[2]), 0, 1) * 255,
        a: 1,
      },
      clipped: false,
      deltaE: 0,
    };
  }

  let lo = 0;
  let hi = target.c;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (oklchInSrgb({ ...target, c: mid })) lo = mid;
    else hi = mid;
  }
  const mapped = oklabToRgb(oklchToOklab({ ...target, c: lo }));
  return { rgb: mapped, clipped: true, deltaE: deltaEOk(target, rgbToOklch(mapped)) };
};

export const oklchToRgb = (oklch: Oklch, alpha = 1): Rgb => {
  const { rgb } = gamutMapOklch(oklch);
  return { ...rgb, a: alpha };
};

/**
 * ΔE OK: distancia euclídea en OKLab. A diferencia de ΔE76 sobre CIELab, en
 * este espacio la distancia sí se corresponde con la diferencia percibida, así
 * que ~0.02 es el umbral en el que la mayoría de la gente empieza a ver dos
 * muestras como colores distintos.
 */
export const deltaEOk = (a: Oklch, b: Oklch): number => {
  const A = oklchToOklab(a);
  const B = oklchToOklab(b);
  return Math.sqrt((A.l - B.l) ** 2 + (A.a - B.a) ** 2 + (A.b - B.b) ** 2);
};

export const deltaEOkRgb = (a: Rgb, b: Rgb): number => deltaEOk(rgbToOklch(a), rgbToOklch(b));

// ---------------------------------------------------------------------------
// HSL / HWB / CMYK
// ---------------------------------------------------------------------------

export const rgbToHsl = ({ r, g, b }: Rgb): Hsl => {
  const rN = r / 255;
  const gN = g / 255;
  const bN = b / 255;
  const max = Math.max(rN, gN, bN);
  const min = Math.min(rN, gN, bN);
  const delta = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (delta > 1e-9) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (max === rN) h = ((gN - bN) / delta) % 6;
    else if (max === gN) h = (bN - rN) / delta + 2;
    else h = (rN - gN) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100 };
};

export const hslToRgb = ({ h, s, l }: Hsl, a = 1): Rgb => {
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const m = lN - c / 2;
  let rgb: [number, number, number];
  if (hp < 1) rgb = [c, x, 0];
  else if (hp < 2) rgb = [x, c, 0];
  else if (hp < 3) rgb = [0, c, x];
  else if (hp < 4) rgb = [0, x, c];
  else if (hp < 5) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return { r: (rgb[0] + m) * 255, g: (rgb[1] + m) * 255, b: (rgb[2] + m) * 255, a };
};

export const rgbToHwb = (rgb: Rgb): Hwb => {
  const { h } = rgbToHsl(rgb);
  const w = Math.min(rgb.r, rgb.g, rgb.b) / 255;
  const b = 1 - Math.max(rgb.r, rgb.g, rgb.b) / 255;
  return { h, w: w * 100, b: b * 100 };
};

/**
 * CMYK «naive»: la conversión aritmética sin perfil ICC. No es una separación
 * de imprenta y la UI lo dice — un CMYK real depende del papel, la tinta y el
 * perfil de salida, y no se puede calcular desde un sRGB suelto.
 */
export const rgbToCmyk = ({ r, g, b }: Rgb): Cmyk => {
  const rN = r / 255;
  const gN = g / 255;
  const bN = b / 255;
  const k = 1 - Math.max(rN, gN, bN);
  if (k >= 1 - 1e-9) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: ((1 - rN - k) / (1 - k)) * 100,
    m: ((1 - gN - k) / (1 - k)) * 100,
    y: ((1 - bN - k) / (1 - k)) * 100,
    k: k * 100,
  };
};

export const cmykToRgb = ({ c, m, y, k }: Cmyk, a = 1): Rgb => {
  const kN = k / 100;
  return {
    r: 255 * (1 - c / 100) * (1 - kN),
    g: 255 * (1 - m / 100) * (1 - kN),
    b: 255 * (1 - y / 100) * (1 - kN),
    a,
  };
};

// ---------------------------------------------------------------------------
// Contraste: WCAG 2.1 y APCA
// ---------------------------------------------------------------------------

export const relativeLuminance = ({ r, g, b }: Rgb): number =>
  0.2126 * srgbToLinear(r / 255) + 0.7152 * srgbToLinear(g / 255) + 0.0722 * srgbToLinear(b / 255);

/** Ratio WCAG 2.1, de 1 a 21. */
export const contrastWcag = (a: Rgb, b: Rgb): number => {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

// Constantes de APCA-W3 0.1.9 (el borrador de WCAG 3). No es normativo todavía,
// y la UI lo etiqueta como borrador.
const APCA = {
  trc: 2.4,
  Rco: 0.2126729,
  Gco: 0.7151522,
  Bco: 0.072175,
  normBG: 0.56,
  normTXT: 0.57,
  revTXT: 0.62,
  revBG: 0.65,
  blkThrs: 0.022,
  blkClmp: 1.414,
  scale: 1.14,
  loOffset: 0.027,
  loClip: 0.1,
  deltaYmin: 0.0005,
};

const apcaY = ({ r, g, b }: Rgb): number => {
  const y =
    APCA.Rco * Math.pow(r / 255, APCA.trc) +
    APCA.Gco * Math.pow(g / 255, APCA.trc) +
    APCA.Bco * Math.pow(b / 255, APCA.trc);
  return y > APCA.blkThrs ? y : y + Math.pow(APCA.blkThrs - y, APCA.blkClmp);
};

/**
 * Lc de APCA: −108…+106, con signo. Positivo = texto oscuro sobre fondo claro.
 * A diferencia del ratio de WCAG 2, no es simétrico: invertir texto y fondo da
 * un número distinto, que es justo el punto — el ojo no los ve igual.
 */
export const contrastApca = (text: Rgb, bg: Rgb): number => {
  const Ytxt = apcaY(text);
  const Ybg = apcaY(bg);
  if (Math.abs(Ybg - Ytxt) < APCA.deltaYmin) return 0;
  let sapc: number;
  let out: number;
  if (Ybg > Ytxt) {
    sapc = (Math.pow(Ybg, APCA.normBG) - Math.pow(Ytxt, APCA.normTXT)) * APCA.scale;
    out = sapc < APCA.loClip ? 0 : sapc - APCA.loOffset;
  } else {
    sapc = (Math.pow(Ybg, APCA.revBG) - Math.pow(Ytxt, APCA.revTXT)) * APCA.scale;
    out = sapc > -APCA.loClip ? 0 : sapc + APCA.loOffset;
  }
  return out * 100;
};

export type WcagLevel = 'AAA' | 'AA' | 'AA-large' | 'fail';

/** Nivel WCAG 2.1 **para texto normal**. `AA-large` deja claro que solo vale a
 *  partir de 18pt / 14pt negrita, en vez de pintarse como un aprobado a secas. */
export const wcagLevel = (ratio: number): WcagLevel => {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA-large';
  return 'fail';
};

/** Uso mínimo recomendado por APCA para un Lc dado (tabla de fuentes de APCA). */
export const apcaUse = (lc: number): 'body' | 'large' | 'ui' | 'none' => {
  const a = Math.abs(lc);
  if (a >= 75) return 'body';
  if (a >= 60) return 'large';
  if (a >= 45) return 'ui';
  return 'none';
};

// ---------------------------------------------------------------------------
// Simulación de daltonismo (Viénot, Brettel & Mollon 1999), aplicada en RGB
// lineal — aplicarla sobre los valores con gamma, que es el atajo habitual,
// da colores notablemente más saturados de lo que la persona ve.
// ---------------------------------------------------------------------------

export type CvdType = 'protanopia' | 'deuteranopia' | 'tritanopia';

const CVD_MATRICES: Record<CvdType, number[][]> = {
  protanopia: [
    [0, 1.05118294, -0.05116099],
    [0, 1, 0],
    [0, 0, 1],
  ],
  deuteranopia: [
    [1, 0, 0],
    [0.9513092, 0, 0.04866992],
    [0, 0, 1],
  ],
  tritanopia: [
    [1, 0, 0],
    [0, 1, 0],
    [-0.86744736, 1.86727089, 0],
  ],
};

export const simulateCvd = (rgb: Rgb, type: CvdType): Rgb => {
  const lrgb: [number, number, number] = [
    srgbToLinear(rgb.r / 255),
    srgbToLinear(rgb.g / 255),
    srgbToLinear(rgb.b / 255),
  ];
  const out = mul(CVD_MATRICES[type], lrgb);
  return {
    r: clamp(linearToSrgb(clamp(out[0], 0, 1)), 0, 1) * 255,
    g: clamp(linearToSrgb(clamp(out[1], 0, 1)), 0, 1) * 255,
    b: clamp(linearToSrgb(clamp(out[2], 0, 1)), 0, 1) * 255,
    a: rgb.a,
  };
};

// ---------------------------------------------------------------------------
// Parser de entrada
// ---------------------------------------------------------------------------

export interface ParseResult {
  rgb: Rgb | null;
  /** Sintaxis detectada, para poder decir en la UI qué se ha entendido. */
  syntax: string;
  /** true cuando lo ha resuelto el motor del navegador y no el respaldo. */
  native: boolean;
}

let nativeProbe: HTMLDivElement | null = null;
let nativeChecked = false;
let nativeAvailable = false;

/** El parser nativo solo existe en el cliente; en SSR se usa el respaldo. */
export const hasNativeParser = (): boolean => {
  if (nativeChecked) return nativeAvailable;
  nativeChecked = true;
  nativeAvailable =
    typeof document !== 'undefined' && typeof window !== 'undefined' && !!window.getComputedStyle;
  return nativeAvailable;
};

let rasterCtx: CanvasRenderingContext2D | null | undefined;

/**
 * Rasteriza un color en un lienzo de 1×1 y lee el píxel. Es el único camino
 * exacto para los espacios modernos: el valor calculado de `oklch()`, `lab()`
 * o `color-mix()` NO es un `rgb()` — la especificación manda conservarlo en su
 * propio espacio — así que hay que pedirle al navegador que lo pinte de verdad.
 * El alfa se saca aparte de la cadena y se rasteriza la versión opaca, porque
 * `getImageData` desmultiplica y perdería precisión en los canales.
 */
const rasterize = (value: string): { r: number; g: number; b: number } | null => {
  if (rasterCtx === undefined) {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    rasterCtx = canvas.getContext('2d', { willReadFrequently: true });
  }
  const ctx = rasterCtx;
  if (!ctx) return null;
  // Centinela: si el lienzo tampoco entiende la sintaxis, `fillStyle` se queda
  // como estaba en vez de lanzar, y pintaríamos el color anterior.
  ctx.fillStyle = '#010203';
  ctx.fillStyle = value;
  if (ctx.fillStyle === '#010203' && !/^#0*10*20*3$/i.test(value.trim())) return null;
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillRect(0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  return { r: d[0], g: d[1], b: d[2] };
};

/**
 * Resuelve un color con el motor del navegador. Se apoya en que `style.color`
 * descarta en silencio los valores que no entiende: si tras asignar el valor
 * la propiedad sigue en el centinela, la sintaxis no era válida.
 */
const parseNative = (input: string): Rgb | null => {
  if (!hasNativeParser()) return null;
  if (!nativeProbe) {
    nativeProbe = document.createElement('div');
    nativeProbe.style.display = 'none';
    // Sin adjuntar al documento getComputedStyle devuelve cadena vacía en
    // varios navegadores, así que la sonda vive (oculta) en el body.
    document.body.appendChild(nativeProbe);
  }
  const probe = nativeProbe;
  const SENTINEL = 'rgb(1, 2, 3)';
  probe.style.color = '';
  probe.style.color = SENTINEL;
  probe.style.color = input;
  const raw = probe.style.color;
  if (!raw || raw === SENTINEL) {
    // Puede ser un falso negativo: que el color pedido SEA rgb(1,2,3).
    if (!/^\s*rgba?\(\s*1\s*[, ]\s*2\s*[, ]\s*3\s*\)\s*$/i.test(input)) return null;
  }
  const computed = window.getComputedStyle(probe).color;

  // Camino corto: hex, nombres, rgb(), hsl() y hwb() sí se calculan a rgb().
  const m = computed.match(
    /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.%]+))?\s*\)$/i
  );
  if (m) {
    let a = 1;
    if (m[4] != null) a = m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return { r: parseFloat(m[1]), g: parseFloat(m[2]), b: parseFloat(m[3]), a: clamp(a, 0, 1) };
  }

  // Camino largo: lab(), lch(), oklab(), oklch(), color(...) y color-mix()
  // conservan su espacio en el valor calculado, así que se pintan para leerlos.
  const alphaMatch = computed.match(/\/\s*([\d.]+%?)\s*\)\s*$/);
  let alpha = 1;
  if (alphaMatch) {
    alpha = alphaMatch[1].endsWith('%')
      ? parseFloat(alphaMatch[1]) / 100
      : parseFloat(alphaMatch[1]);
  }
  const opaque = alphaMatch ? computed.replace(/\/\s*[\d.]+%?\s*\)\s*$/, ')') : computed;
  const raster = rasterize(opaque);
  if (!raster) return null;
  return { ...raster, a: clamp(alpha, 0, 1) };
};

const HEX_RE = /^#?([0-9a-f]{3,8})$/i;

/** Respaldo determinista: hex de 3/4/6/8 y las funciones rgb()/hsl() clásicas. */
const parseFallback = (input: string): { rgb: Rgb; syntax: string } | null => {
  const value = input.trim();

  const hex = value.match(HEX_RE);
  if (hex) {
    const h = hex[1];
    const expand = (s: string) => parseInt(s.length === 1 ? s + s : s, 16);
    if (h.length === 3 || h.length === 4) {
      return {
        rgb: {
          r: expand(h[0]),
          g: expand(h[1]),
          b: expand(h[2]),
          a: h.length === 4 ? expand(h[3]) / 255 : 1,
        },
        syntax: h.length === 4 ? 'hex4' : 'hex3',
      };
    }
    if (h.length === 6 || h.length === 8) {
      return {
        rgb: {
          r: parseInt(h.slice(0, 2), 16),
          g: parseInt(h.slice(2, 4), 16),
          b: parseInt(h.slice(4, 6), 16),
          a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
        },
        syntax: h.length === 8 ? 'hex8' : 'hex6',
      };
    }
    return null;
  }

  const nums = (body: string) =>
    body
      .split(/[,\s/]+/)
      .map((s) => s.trim())
      .filter(Boolean);

  const rgbFn = value.match(/^rgba?\(([^)]*)\)$/i);
  if (rgbFn) {
    const p = nums(rgbFn[1]);
    if (p.length < 3) return null;
    const chan = (s: string) => (s.endsWith('%') ? (parseFloat(s) / 100) * 255 : parseFloat(s));
    const a = p[3] != null ? (p[3].endsWith('%') ? parseFloat(p[3]) / 100 : parseFloat(p[3])) : 1;
    const rgb = { r: chan(p[0]), g: chan(p[1]), b: chan(p[2]), a: clamp(a, 0, 1) };
    if ([rgb.r, rgb.g, rgb.b, rgb.a].some(Number.isNaN)) return null;
    return { rgb: { ...rgb, r: clamp(rgb.r, 0, 255), g: clamp(rgb.g, 0, 255), b: clamp(rgb.b, 0, 255) }, syntax: 'rgb' };
  }

  const hslFn = value.match(/^hsla?\(([^)]*)\)$/i);
  if (hslFn) {
    const p = nums(hslFn[1]);
    if (p.length < 3) return null;
    const a = p[3] != null ? (p[3].endsWith('%') ? parseFloat(p[3]) / 100 : parseFloat(p[3])) : 1;
    const hsl = { h: parseFloat(p[0]), s: parseFloat(p[1]), l: parseFloat(p[2]) };
    if ([hsl.h, hsl.s, hsl.l, a].some(Number.isNaN)) return null;
    return { rgb: hslToRgb(hsl, clamp(a, 0, 1)), syntax: 'hsl' };
  }

  return null;
};

/** Etiqueta la sintaxis para poder decirle al usuario qué se ha reconocido. */
const detectSyntax = (input: string): string => {
  const v = input.trim().toLowerCase();
  if (HEX_RE.test(v)) {
    const len = v.replace('#', '').length;
    return `hex${len}`;
  }
  const fn = v.match(/^([a-z-]+)\(/);
  if (fn) return fn[1];
  if (/^[a-z]+$/.test(v)) return 'named';
  return 'css';
};

/**
 * Punto de entrada único. Intenta primero el navegador (cubre nombres, hwb(),
 * lab(), oklch(), color-mix()…) y cae al respaldo cuando no hay DOM.
 */
export const parseColor = (input: string): ParseResult => {
  const value = input.trim();
  if (!value) return { rgb: null, syntax: '', native: false };

  const native = parseNative(value);
  if (native) return { rgb: native, syntax: detectSyntax(value), native: true };

  const fallback = parseFallback(value);
  if (fallback) return { rgb: fallback.rgb, syntax: fallback.syntax, native: false };

  return { rgb: null, syntax: detectSyntax(value), native: false };
};

/** Extrae todos los colores de un texto pegado (una paleta, un archivo CSS…). */
export const parseColorList = (text: string): Rgb[] => {
  const tokens = text.match(
    /#[0-9a-fA-F]{3,8}\b|(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^)]*\)/g
  );
  if (!tokens) return [];
  const out: Rgb[] = [];
  const seen = new Set<string>();
  for (const token of tokens) {
    const { rgb } = parseColor(token);
    if (!rgb) continue;
    const key = formatHex(rgb, true);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(rgb);
  }
  return out;
};

// ---------------------------------------------------------------------------
// Formateo
// ---------------------------------------------------------------------------

const r2 = (n: number, digits = 0) => {
  const f = Math.pow(10, digits);
  const v = Math.round(n * f) / f;
  return Object.is(v, -0) ? 0 : v;
};

const b255 = (n: number) => clamp(Math.round(n), 0, 255);

export const formatHex = (rgb: Rgb, withAlpha = false): string => {
  const h = (n: number) => b255(n).toString(16).padStart(2, '0');
  const base = `#${h(rgb.r)}${h(rgb.g)}${h(rgb.b)}`.toUpperCase();
  if (!withAlpha || rgb.a >= 1) return base;
  return base + clamp(Math.round(rgb.a * 255), 0, 255).toString(16).padStart(2, '0').toUpperCase();
};

export const formatRgb = (rgb: Rgb): string =>
  rgb.a >= 1
    ? `rgb(${b255(rgb.r)}, ${b255(rgb.g)}, ${b255(rgb.b)})`
    : `rgba(${b255(rgb.r)}, ${b255(rgb.g)}, ${b255(rgb.b)}, ${r2(rgb.a, 3)})`;

export const formatHsl = (rgb: Rgb): string => {
  const { h, s, l } = rgbToHsl(rgb);
  return rgb.a >= 1
    ? `hsl(${r2(h, 1)}, ${r2(s, 1)}%, ${r2(l, 1)}%)`
    : `hsla(${r2(h, 1)}, ${r2(s, 1)}%, ${r2(l, 1)}%, ${r2(rgb.a, 3)})`;
};

export const formatHwb = (rgb: Rgb): string => {
  const { h, w, b } = rgbToHwb(rgb);
  const alpha = rgb.a >= 1 ? '' : ` / ${r2(rgb.a, 3)}`;
  return `hwb(${r2(h, 1)} ${r2(w, 1)}% ${r2(b, 1)}%${alpha})`;
};

export const formatOklch = (rgb: Rgb): string => {
  const { l, c, h } = rgbToOklch(rgb);
  const alpha = rgb.a >= 1 ? '' : ` / ${r2(rgb.a, 3)}`;
  return `oklch(${r2(l * 100, 2)}% ${r2(c, 4)} ${r2(h, 2)}${alpha})`;
};

export const formatOklab = (rgb: Rgb): string => {
  const { l, a, b } = rgbToOklab(rgb);
  const alpha = rgb.a >= 1 ? '' : ` / ${r2(rgb.a, 3)}`;
  return `oklab(${r2(l * 100, 2)}% ${r2(a, 4)} ${r2(b, 4)}${alpha})`;
};

export const formatCmyk = (rgb: Rgb): string => {
  const { c, m, y, k } = rgbToCmyk(rgb);
  // Sin variante «cmyka»: no existe ni en CSS ni en artes gráficas. La opacidad
  // se aplica en pantalla, no en tinta, así que aquí no pinta nada.
  return `cmyk(${r2(c)}%, ${r2(m)}%, ${r2(y)}%, ${r2(k)}%)`;
};

export const formatCssColor = (rgb: Rgb): string => {
  const alpha = rgb.a >= 1 ? '' : ` / ${r2(rgb.a, 3)}`;
  return `color(srgb ${r2(rgb.r / 255, 4)} ${r2(rgb.g / 255, 4)} ${r2(rgb.b / 255, 4)}${alpha})`;
};

export const formatSwift = (rgb: Rgb): string =>
  `Color(red: ${r2(rgb.r / 255, 3)}, green: ${r2(rgb.g / 255, 3)}, blue: ${r2(rgb.b / 255, 3)}, opacity: ${r2(rgb.a, 3)})`;

export const formatAndroid = (rgb: Rgb): string => {
  const h = (n: number) => b255(n).toString(16).padStart(2, '0').toUpperCase();
  const a = clamp(Math.round(rgb.a * 255), 0, 255).toString(16).padStart(2, '0').toUpperCase();
  return rgb.a >= 1 ? `#${h(rgb.r)}${h(rgb.g)}${h(rgb.b)}` : `#${a}${h(rgb.r)}${h(rgb.g)}${h(rgb.b)}`;
};

export type FormatId =
  | 'hex'
  | 'rgb'
  | 'hsl'
  | 'hwb'
  | 'oklch'
  | 'oklab'
  | 'cmyk'
  | 'srgb'
  | 'swift'
  | 'android';

export const FORMATTERS: Record<FormatId, (rgb: Rgb) => string> = {
  hex: (c) => formatHex(c, true),
  rgb: formatRgb,
  hsl: formatHsl,
  hwb: formatHwb,
  oklch: formatOklch,
  oklab: formatOklab,
  cmyk: formatCmyk,
  srgb: formatCssColor,
  swift: formatSwift,
  android: formatAndroid,
};

// ---------------------------------------------------------------------------
// Armonías y rampas, en OKLCH
// ---------------------------------------------------------------------------

export type HarmonyId =
  | 'complementary'
  | 'analogous'
  | 'triadic'
  | 'split'
  | 'tetradic'
  | 'monochrome';

const HARMONY_OFFSETS: Record<Exclude<HarmonyId, 'monochrome'>, number[]> = {
  complementary: [0, 180],
  analogous: [-30, 0, 30],
  triadic: [0, 120, 240],
  split: [0, 150, 210],
  tetradic: [0, 90, 180, 270],
};

/**
 * Rota el tono en OKLCH y no en HSL. En HSL, girar 120° desde un amarillo da un
 * azul mucho más oscuro a igualdad de «lightness»; en OKLCH la claridad
 * percibida se mantiene, que es lo que uno espera de una armonía.
 */
export const harmony = (rgb: Rgb, kind: HarmonyId): Rgb[] => {
  const base = rgbToOklch(rgb);
  if (kind === 'monochrome') {
    return [-0.18, -0.09, 0, 0.09, 0.18].map((dl) =>
      oklchToRgb({ ...base, l: clamp(base.l + dl, 0.05, 0.98) }, rgb.a)
    );
  }
  return HARMONY_OFFSETS[kind].map((d) =>
    oklchToRgb({ ...base, h: (((base.h + d) % 360) + 360) % 360 }, rgb.a)
  );
};

/** Escalones y curvas medidos sobre el tema real de Tailwind v4 (scripts/gen-tw-palette.mjs). */
export const RAMP_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
const RAMP_L = [0.98, 0.956, 0.912, 0.851, 0.74, 0.638, 0.545, 0.466, 0.386, 0.332, 0.231];
const RAMP_C = [0.082, 0.19, 0.367, 0.616, 0.877, 1.0, 0.99, 0.876, 0.721, 0.582, 0.414];

export interface RampStop {
  step: number;
  rgb: Rgb;
  /** true cuando el croma pedido no cabía en sRGB y hubo que bajarlo. */
  clipped: boolean;
  deltaE: number;
}

/**
 * Rampa de 11 tonos con la forma de las escalas de Tailwind, pero anclada al
 * color del usuario: el escalón cuyo ΔE es menor pasa a ser exactamente su
 * color, y el resto se reconstruye alrededor.
 */
export const buildRamp = (rgb: Rgb): RampStop[] => {
  const base = rgbToOklch(rgb);
  // El escalón al que «pertenece» el color: el de claridad más parecida.
  let anchor = 0;
  let best = Infinity;
  for (let i = 0; i < RAMP_L.length; i++) {
    const d = Math.abs(RAMP_L[i] - base.l);
    if (d < best) {
      best = d;
      anchor = i;
    }
  }
  const cScale = RAMP_C[anchor] > 0 ? base.c / RAMP_C[anchor] : base.c;

  return RAMP_STEPS.map((step, i) => {
    if (i === anchor) return { step, rgb, clipped: false, deltaE: 0 };
    const target: Oklch = { l: RAMP_L[i], c: RAMP_C[i] * cScale, h: base.h };
    const { rgb: out, clipped, deltaE } = gamutMapOklch(target);
    return { step, rgb: { ...out, a: rgb.a }, clipped, deltaE };
  });
};

/** Mezcla perceptual entre dos colores (equivale a color-mix in oklch). */
export const mixOklch = (a: Rgb, b: Rgb, t: number): Rgb => {
  const A = rgbToOklch(a);
  const B = rgbToOklch(b);
  // Interpolación de tono por el arco corto: sin esto, ir de 350° a 10° pasa
  // por todo el espectro en vez de cruzar el rojo.
  let dh = B.h - A.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  return oklchToRgb(
    {
      l: A.l + (B.l - A.l) * t,
      c: A.c + (B.c - A.c) * t,
      h: (((A.h + dh * t) % 360) + 360) % 360,
    },
    a.a + (b.a - a.a) * t
  );
};

// ---------------------------------------------------------------------------
// Colores con nombre
// ---------------------------------------------------------------------------

/** Los 148 nombres de CSS Color 4. Sus valores NO se escriben aquí: los
 *  resuelve el propio navegador la primera vez que hacen falta, así que no hay
 *  forma de que la tabla se desvíe de lo que el navegador pinta. */
export const CSS_NAMES = [
  'aliceblue','antiquewhite','aqua','aquamarine','azure','beige','bisque','black','blanchedalmond','blue',
  'blueviolet','brown','burlywood','cadetblue','chartreuse','chocolate','coral','cornflowerblue','cornsilk','crimson',
  'cyan','darkblue','darkcyan','darkgoldenrod','darkgray','darkgreen','darkgrey','darkkhaki','darkmagenta','darkolivegreen',
  'darkorange','darkorchid','darkred','darksalmon','darkseagreen','darkslateblue','darkslategray','darkslategrey','darkturquoise','darkviolet',
  'deeppink','deepskyblue','dimgray','dimgrey','dodgerblue','firebrick','floralwhite','forestgreen','fuchsia','gainsboro',
  'ghostwhite','gold','goldenrod','gray','green','greenyellow','grey','honeydew','hotpink','indianred',
  'indigo','ivory','khaki','lavender','lavenderblush','lawngreen','lemonchiffon','lightblue','lightcoral','lightcyan',
  'lightgoldenrodyellow','lightgray','lightgreen','lightgrey','lightpink','lightsalmon','lightseagreen','lightskyblue','lightslategray','lightslategrey',
  'lightsteelblue','lightyellow','lime','limegreen','linen','magenta','maroon','mediumaquamarine','mediumblue','mediumorchid',
  'mediumpurple','mediumseagreen','mediumslateblue','mediumspringgreen','mediumturquoise','mediumvioletred','midnightblue','mintcream','mistyrose','moccasin',
  'navajowhite','navy','oldlace','olive','olivedrab','orange','orangered','orchid','palegoldenrod','palegreen',
  'paleturquoise','palevioletred','papayawhip','peachpuff','peru','pink','plum','powderblue','purple','rebeccapurple',
  'red','rosybrown','royalblue','saddlebrown','salmon','sandybrown','seagreen','seashell','sienna','silver',
  'skyblue','slateblue','slategray','slategrey','snow','springgreen','steelblue','tan','teal','thistle',
  'tomato','turquoise','violet','wheat','white','whitesmoke','yellow','yellowgreen',
] as const;

let namedCache: Array<{ name: string; oklch: Oklch }> | null = null;

const namedTable = (): Array<{ name: string; oklch: Oklch }> => {
  if (namedCache) return namedCache;
  if (!hasNativeParser()) return [];
  namedCache = CSS_NAMES.map((name) => {
    const { rgb } = parseColor(name);
    return { name, oklch: rgb ? rgbToOklch(rgb) : { l: 0, c: 0, h: 0 } };
  });
  return namedCache;
};

export interface NearestMatch {
  name: string;
  hex: string;
  deltaE: number;
  exact: boolean;
}

export const nearestCssName = (rgb: Rgb): NearestMatch | null => {
  const table = namedTable();
  if (!table.length) return null;
  const target = rgbToOklch(rgb);
  let best = table[0];
  let bestD = Infinity;
  for (const entry of table) {
    const d = deltaEOk(target, entry.oklch);
    if (d < bestD) {
      bestD = d;
      best = entry;
    }
  }
  const { rgb: bestRgb } = parseColor(best.name);
  return {
    name: best.name,
    hex: bestRgb ? formatHex(bestRgb) : '',
    deltaE: bestD,
    exact: bestD < 0.0005,
  };
};

let twCache: Array<{ name: string; hex: string; oklch: Oklch }> | null = null;

export const nearestTailwind = (rgb: Rgb): NearestMatch | null => {
  if (!twCache) {
    twCache = TAILWIND_PALETTE.map(([name, packed]) => {
      const c: Rgb = { r: (packed >> 16) & 255, g: (packed >> 8) & 255, b: packed & 255, a: 1 };
      return { name, hex: formatHex(c), oklch: rgbToOklch(c) };
    });
  }
  const target = rgbToOklch(rgb);
  let best = twCache[0];
  let bestD = Infinity;
  for (const entry of twCache) {
    const d = deltaEOk(target, entry.oklch);
    if (d < bestD) {
      bestD = d;
      best = entry;
    }
  }
  return { name: best.name, hex: best.hex, deltaE: bestD, exact: bestD < 0.0005 };
};

// ---------------------------------------------------------------------------
// Extracción de paleta desde una imagen
// ---------------------------------------------------------------------------

/**
 * k-means en OKLab sobre un muestreo de la imagen. En OKLab y no en RGB porque
 * los centroides de un k-means en RGB caen en colores que nadie describiría
 * como «dominantes»: la distancia euclídea en RGB no se parece a lo que ve el
 * ojo, y los marrones se comen a los azules.
 */
export const extractPalette = (
  image: ImageBitmap | HTMLImageElement,
  count = 6,
  maxSamples = 20000
): Rgb[] => {
  const w = 'naturalWidth' in image ? image.naturalWidth : image.width;
  const h = 'naturalHeight' in image ? image.naturalHeight : image.height;
  if (!w || !h) return [];

  const scale = Math.min(1, Math.sqrt(maxSamples / (w * h)));
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];
  ctx.drawImage(image as CanvasImageSource, 0, 0, cw, ch);
  const { data } = ctx.getImageData(0, 0, cw, ch);

  const points: Array<{ lab: Oklab; rgb: Rgb }> = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const rgb: Rgb = { r: data[i], g: data[i + 1], b: data[i + 2], a: 1 };
    points.push({ lab: rgbToOklab(rgb), rgb });
  }
  if (!points.length) return [];

  const k = Math.min(count, points.length);
  // Siembra determinista (k-means++ sin azar): mismo archivo, misma paleta.
  const centroids: Oklab[] = [points[0].lab];
  while (centroids.length < k) {
    let far = points[0];
    let farD = -1;
    for (const p of points) {
      let d = Infinity;
      for (const c of centroids) {
        const dd = (p.lab.l - c.l) ** 2 + (p.lab.a - c.a) ** 2 + (p.lab.b - c.b) ** 2;
        if (dd < d) d = dd;
      }
      if (d > farD) {
        farD = d;
        far = p;
      }
    }
    centroids.push(far.lab);
  }

  const assign = new Int32Array(points.length);
  for (let iter = 0; iter < 12; iter++) {
    let moved = false;
    for (let i = 0; i < points.length; i++) {
      let bestI = 0;
      let bestD = Infinity;
      for (let c = 0; c < centroids.length; c++) {
        const cc = centroids[c];
        const d =
          (points[i].lab.l - cc.l) ** 2 +
          (points[i].lab.a - cc.a) ** 2 +
          (points[i].lab.b - cc.b) ** 2;
        if (d < bestD) {
          bestD = d;
          bestI = c;
        }
      }
      if (assign[i] !== bestI) {
        assign[i] = bestI;
        moved = true;
      }
    }
    const sums = centroids.map(() => ({ l: 0, a: 0, b: 0, n: 0 }));
    for (let i = 0; i < points.length; i++) {
      const s = sums[assign[i]];
      s.l += points[i].lab.l;
      s.a += points[i].lab.a;
      s.b += points[i].lab.b;
      s.n++;
    }
    for (let c = 0; c < centroids.length; c++) {
      if (sums[c].n) {
        centroids[c] = { l: sums[c].l / sums[c].n, a: sums[c].a / sums[c].n, b: sums[c].b / sums[c].n };
      }
    }
    if (!moved) break;
  }

  const weights = centroids.map(() => 0);
  for (let i = 0; i < points.length; i++) weights[assign[i]]++;

  return centroids
    .map((c, i) => ({ rgb: oklabToRgb(c), n: weights[i] }))
    .filter((e) => e.n > 0)
    .sort((a, b) => b.n - a.n)
    .map((e) => e.rgb);
};
