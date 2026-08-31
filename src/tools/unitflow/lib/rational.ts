// ============================================================================
// Aritmética racional exacta sobre BigInt.
// ----------------------------------------------------------------------------
// El conversor anterior multiplicaba `Number` por factores flotantes y luego
// redondeaba a 10 cifras significativas. Eso devolvía números MAL, no sólo
// imprecisos: 1 TiB salía como 1 099 511 628 000 bytes en vez de
// 1 099 511 627 776, y 1 acre como 4 046 856 422 mm² en vez de 4 046 856 422,4.
//
// Aquí cada valor viaja como una fracción exacta n/d de enteros grandes. La
// conversión entera es exacta y el redondeo ocurre UNA sola vez, al escribir el
// resultado en pantalla. Eso hace el pipeline no destructivo: cambiar la
// precisión, intercambiar unidades o encadenar diez conversiones no pierde ni un
// dígito, porque lo que se guarda en el estado es la fracción, nunca el texto ya
// formateado.
// ============================================================================

export interface Rational {
  /** Numerador con signo. */
  n: bigint;
  /** Denominador, siempre > 0 y coprimo con `n`. */
  d: bigint;
}

const TEN = 10n;

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x;
}

/** Normaliza signo y reduce. Denominador 0 se trata como "no representable". */
export function rat(n: bigint, d: bigint = 1n): Rational {
  if (d === 0n) return { n: 0n, d: 0n };
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  if (n === 0n) return { n: 0n, d: 1n };
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

export const ZERO: Rational = { n: 0n, d: 1n };
export const ONE: Rational = { n: 1n, d: 1n };
export const INVALID: Rational = { n: 0n, d: 0n };

export const isValid = (r: Rational): boolean => !!r && r.d !== 0n;
export const isZero = (r: Rational): boolean => isValid(r) && r.n === 0n;
export const isNegative = (r: Rational): boolean => isValid(r) && r.n < 0n;

export const add = (a: Rational, b: Rational): Rational => rat(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Rational, b: Rational): Rational => rat(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Rational, b: Rational): Rational => rat(a.n * b.n, a.d * b.d);
export const div = (a: Rational, b: Rational): Rational =>
  b.n === 0n ? INVALID : rat(a.n * b.d, a.d * b.n);
export const neg = (a: Rational): Rational => ({ n: -a.n, d: a.d });
export const abs = (a: Rational): Rational => (a.n < 0n ? neg(a) : a);

/** -1, 0 o 1. */
export function cmp(a: Rational, b: Rational): number {
  const l = a.n * b.d;
  const r = b.n * a.d;
  return l < r ? -1 : l > r ? 1 : 0;
}

export const eq = (a: Rational, b: Rational): boolean => a.n === b.n && a.d === b.d;

/** 10^e como BigInt, con e >= 0. */
const pow10 = (e: number): bigint => TEN ** BigInt(e);

// ---------------------------------------------------------------------------
// Lectura
// ---------------------------------------------------------------------------

/**
 * "12", "-3.5", "1.25e-4", "2,5" → fracción exacta. Devuelve null si el texto no
 * es un número: el llamante decide si eso es un error o un campo a medio
 * escribir.
 */
export function parseDecimal(input: string): Rational | null {
  const s = input.trim().replace(/−/g, '-').replace(/[\s_  ]/g, '');
  if (!s) return null;
  const m = /^([+-]?)(\d*)(?:[.,](\d*))?(?:[eE]([+-]?\d+))?$/.exec(s);
  if (!m) return null;
  const sign = m[1];
  const intPart = m[2] || '';
  const fracPart = m[3] || '';
  const expPart = m[4];
  if (!intPart && !fracPart) return null;
  const digits = `${intPart}${fracPart}` || '0';
  let n = BigInt(digits);
  let d = pow10(fracPart.length);
  const exp = expPart ? parseInt(expPart, 10) : 0;
  if (!Number.isFinite(exp) || Math.abs(exp) > 5000) return null;
  if (exp > 0) n *= pow10(exp);
  else if (exp < 0) d *= pow10(-exp);
  if (sign === '-') n = -n;
  return rat(n, d);
}

/**
 * Acepta además fracciones ("3/4"), números mixtos ("1 1/2") y porcentajes
 * ("12%"). Es la puerta de entrada de la interfaz.
 */
export function parseValue(input: string): Rational | null {
  const raw = input.trim();
  if (!raw) return null;

  const percent = /%$/.test(raw);
  const body = percent ? raw.slice(0, -1).trim() : raw;

  const scale = (r: Rational | null): Rational | null =>
    r === null ? null : percent ? div(r, rat(100n)) : r;

  // Mixto: "1 1/2", "-2 3/8"
  const mixed = /^([+-]?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(body);
  if (mixed) {
    if (mixed[4] === '0') return null;
    const value = add(rat(BigInt(mixed[2])), rat(BigInt(mixed[3]), BigInt(mixed[4])));
    return scale(mixed[1] === '-' ? neg(value) : value);
  }

  // Fracción simple: "3/4", "-7/8", "1.5/2"
  const slash = body.indexOf('/');
  if (slash > 0) {
    const a = parseDecimal(body.slice(0, slash));
    const b = parseDecimal(body.slice(slash + 1));
    if (!a || !b || b.n === 0n) return null;
    return scale(div(a, b));
  }

  return scale(parseDecimal(body));
}

// ---------------------------------------------------------------------------
// Escritura
// ---------------------------------------------------------------------------

/** Cuenta de dígitos decimales de |x| (0 cuenta como 1). */
function digitCount(x: bigint): number {
  const a = x < 0n ? -x : x;
  if (a === 0n) return 1;
  return a.toString().length;
}

/** round(n/d) al entero más próximo, con empates alejándose del cero. */
function roundDiv(n: bigint, d: bigint): bigint {
  const negative = n < 0n;
  const a = negative ? -n : n;
  const q = a / d;
  const r = a % d;
  const rounded = r * 2n >= d ? q + 1n : q;
  return negative ? -rounded : rounded;
}

/**
 * Exponente decimal: el único e con 10^e <= |r| < 10^(e+1). Devuelve 0 para el
 * cero, que no tiene exponente pero tampoco molesta.
 */
export function exponentOf(r: Rational): number {
  if (!isValid(r) || r.n === 0n) return 0;
  const a = r.n < 0n ? -r.n : r.n;
  const b = r.d;
  let e = digitCount(a) - digitCount(b);
  const atLeast = (exp: number): boolean =>
    exp >= 0 ? a >= b * pow10(exp) : a * pow10(-exp) >= b;
  if (!atLeast(e)) e -= 1;
  else if (atLeast(e + 1)) e += 1;
  return e;
}

/**
 * Cadena decimal con exactamente `places` decimales (places puede ser negativo
 * para redondear a decenas, centenas…). Sin separadores de miles.
 */
export function toFixed(r: Rational, places: number): string {
  if (!isValid(r)) return 'NaN';
  const safe = Math.max(-400, Math.min(400, Math.trunc(places)));
  const p = Math.max(0, safe);
  let scaled: bigint;
  if (safe >= 0) {
    scaled = roundDiv(r.n * pow10(safe), r.d);
  } else {
    const unit = pow10(-safe);
    scaled = roundDiv(r.n, r.d * unit) * unit;
  }
  const negative = scaled < 0n;
  let digits = (negative ? -scaled : scaled).toString();
  if (p > 0) {
    if (digits.length <= p) digits = digits.padStart(p + 1, '0');
    digits = `${digits.slice(0, digits.length - p)}.${digits.slice(digits.length - p)}`;
  }
  return `${negative && scaled !== 0n ? '-' : ''}${digits}`;
}

/** Redondea a `digits` cifras significativas y devuelve la cadena decimal. */
export function toSignificant(r: Rational, digits: number): string {
  if (!isValid(r)) return 'NaN';
  if (r.n === 0n) return '0';
  const d = Math.max(1, Math.min(50, Math.trunc(digits)));
  // El redondeo puede subir el exponente (9,99 → 10,0): se recalcula una vez.
  let e = exponentOf(r);
  let out = toFixed(r, d - 1 - e);
  const reparsed = parseDecimal(out);
  if (reparsed && reparsed.n !== 0n && exponentOf(reparsed) !== e) {
    e = exponentOf(reparsed);
    out = toFixed(r, d - 1 - e);
  }
  return out;
}

/**
 * Expansión decimal exacta, o null si la fracción es periódica. Un racional
 * tiene decimal finito exactamente cuando su denominador reducido sólo tiene
 * factores 2 y 5.
 */
export function exactDecimal(r: Rational, maxPlaces = 400): string | null {
  if (!isValid(r)) return null;
  if (r.n === 0n) return '0';
  let d = r.d;
  let twos = 0;
  let fives = 0;
  while (d % 2n === 0n) {
    d /= 2n;
    twos++;
  }
  while (d % 5n === 0n) {
    d /= 5n;
    fives++;
  }
  if (d !== 1n) return null;
  const places = Math.max(twos, fives);
  if (places > maxPlaces) return null;
  return trimZeros(toFixed(r, places));
}

/** Quita ceros finales de la parte decimal, y el punto si queda huérfano. */
export function trimZeros(s: string): string {
  if (!s.includes('.')) return s;
  const out = s.replace(/0+$/, '').replace(/\.$/, '');
  return out === '' || out === '-' ? '0' : out;
}

export interface FormatOptions {
  /** 'auto' usa el decimal exacto si cabe, si no cifras significativas. */
  notation: 'auto' | 'fixed' | 'significant' | 'scientific' | 'engineering';
  /** Decimales para 'fixed', cifras significativas para el resto. */
  digits: number;
  /** Separador de miles ('' para ninguno). */
  group: string;
  /** Separador decimal. */
  decimal: string;
}

export const DEFAULT_FORMAT: FormatOptions = {
  notation: 'auto',
  digits: 12,
  group: '',
  decimal: '.',
};

function applySeparators(s: string, opt: FormatOptions): string {
  const negative = s.startsWith('-');
  const body = negative ? s.slice(1) : s;
  const dot = body.indexOf('.');
  const int = dot === -1 ? body : body.slice(0, dot);
  const frac = dot === -1 ? '' : body.slice(dot + 1);
  // Con cuatro dígitos ("1000") el separador estorba más de lo que ayuda; es la
  // misma regla que usan las hojas de cálculo para los años.
  const grouped =
    opt.group && int.length > 4 ? int.replace(/\B(?=(\d{3})+(?!\d))/g, opt.group) : int;
  const out = frac ? `${grouped}${opt.decimal}${frac}` : grouped;
  return negative ? `-${out}` : out;
}

function mantissaExponent(r: Rational, digits: number, step: number, opt: FormatOptions): string {
  const e = exponentOf(r);
  // En notación de ingeniería el exponente baja al múltiplo de 3 más cercano por
  // debajo, y la mantisa sube en consecuencia (1,2e4 → 12e3).
  const shown = step === 1 ? e : Math.floor(e / step) * step;
  const scaled = shown >= 0 ? div(r, rat(pow10(shown))) : mul(r, rat(pow10(-shown)));
  const mantissaDigits = Math.max(1, digits + (e - shown));
  const mantissa = trimZeros(toSignificant(scaled, mantissaDigits)).replace('.', opt.decimal);
  return `${mantissa}e${shown >= 0 ? '+' : '-'}${Math.abs(shown)}`;
}

/** Punto de entrada único para escribir un racional en pantalla. */
export function format(r: Rational, opt: FormatOptions = DEFAULT_FORMAT): string {
  if (!isValid(r)) return '—';
  if (r.n === 0n) return '0';

  switch (opt.notation) {
    case 'fixed':
      return applySeparators(toFixed(r, opt.digits), opt);
    case 'significant':
      return applySeparators(trimZeros(toSignificant(r, opt.digits)), opt);
    case 'scientific':
      return mantissaExponent(r, opt.digits, 1, opt);
    case 'engineering':
      return mantissaExponent(r, opt.digits, 3, opt);
    default: {
      const e = exponentOf(r);
      // Fuera de este rango el decimal plano es ilegible (un año luz en
      // milímetros son 19 dígitos), así que se pasa a científica.
      if (e >= 16 || e <= -7) return mantissaExponent(r, opt.digits, 1, opt);
      // La precisión pedida NUNCA puede comerse la parte entera: redondear
      // 1 099 511 627 776 bytes a 10 cifras devuelve 1 099 511 628 000, que es
      // el número equivocado, no el mismo número con menos detalle. Por eso el
      // mínimo efectivo son los dígitos enteros del propio valor.
      const effective = Math.max(opt.digits, Math.max(1, e + 1));
      const exact = exactDecimal(r, opt.digits + 4);
      // El decimal exacto sólo gana si además cabe: 1/3 de pulgada en nanómetros
      // es exacto y tiene 30 dígitos, y eso no lo quiere leer nadie.
      if (exact !== null && exact.replace(/[-.]/g, '').replace(/^0+/, '').length <= effective) {
        return applySeparators(exact, opt);
      }
      return applySeparators(trimZeros(toSignificant(r, effective)), opt);
    }
  }
}

/**
 * El valor "de verdad": decimal exacto cuando existe, y si no la fracción
 * irreducible. Es lo que se enseña al mantener Alt.
 */
export function exactLabel(r: Rational): string {
  if (!isValid(r)) return '—';
  const exact = exactDecimal(r, 60);
  if (exact !== null) return exact;
  return `${r.n} / ${r.d}`;
}

/** Sólo para gráficas y comparaciones aproximadas; nunca para mostrar. */
export function toNumber(r: Rational): number {
  if (!isValid(r)) return NaN;
  if (r.d === 1n && r.n < 9007199254740992n && r.n > -9007199254740992n) return Number(r.n);
  // Number(bigint) desborda a Infinity con magnitudes enormes (un año luz en
  // nanómetros): pasar por notación científica de 17 dígitos lo evita.
  return Number(mantissaExponent(r, 17, 1, DEFAULT_FORMAT));
}

export function fromNumber(x: number): Rational {
  if (!Number.isFinite(x)) return INVALID;
  if (Number.isInteger(x) && Math.abs(x) < 9007199254740992) return rat(BigInt(x));
  return parseDecimal(x.toExponential(17)) ?? INVALID;
}
