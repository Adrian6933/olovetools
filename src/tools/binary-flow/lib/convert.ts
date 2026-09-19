import { MAX_BASE, MIN_BASE, type BitOp, type ParseResult, type Width } from '../types';

// ============================================================================
// Parsing and formatting
// ----------------------------------------------------------------------------
// BigInt throughout, so nothing silently loses precision past 2^53 the way a
// Number-based converter does. Widths are applied as an interpretation on top
// of the parsed value, never during the parse itself.
// ============================================================================

const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';

const digitValue = (ch: string): number => DIGITS.indexOf(ch);

/**
 * Reads a value in `base`.
 *
 * Accepts what people actually paste: a leading sign, `0x`/`0b`/`0o` prefixes
 * when they match the base, and spaces, underscores or dots used as digit
 * grouping. The old parser rejected all of those outright, so pasting
 * "1010 1010" or "0xFF" just said "Invalid" with no explanation.
 */
export function parseInBase(input: string, base: number): ParseResult {
  const fail = (error: string, at = ''): ParseResult => ({ value: 0n, error, at, negative: false });

  let v = input.trim().toLowerCase();
  if (!v) return fail('empty');

  let negative = false;
  if (v[0] === '-' || v[0] === '+') {
    negative = v[0] === '-';
    v = v.slice(1);
  }

  // Strip a base prefix only when it agrees with the selected base, so "0b" in
  // base 16 stays two real hex digits.
  if ((base === 16 && v.startsWith('0x')) || (base === 2 && v.startsWith('0b')) || (base === 8 && v.startsWith('0o'))) {
    v = v.slice(2);
  }
  // Punto y coma valen como separador de miles ("1.000.000", "1,048,576"),
  // pero solo si lo parecen: grupos de 3 cifras en decimal, de 4 u 8 en las
  // demas bases. Antes se borraban siempre, y "12.5" pasaba a ser 125 sin
  // avisar; ahora eso se señala como decimal, que un entero no admite.
  if (/[.,]/.test(v)) {
    const groups = v.replace(/[\s_]/g, '').split(/[.,]/);
    const size = base === 10 ? [3] : [4, 8];
    const grouped = groups[0].length > 0 && groups.slice(1).every(g => size.includes(g.length));
    if (!grouped) return fail('fraction', v.match(/[.,]/)![0]);
  }
  v = v.replace(/[\s_.,]/g, '');
  if (!v) return fail('empty');

  const bigBase = BigInt(base);
  let result = 0n;
  for (const ch of v) {
    const d = digitValue(ch);
    if (d < 0 || d >= base) return fail('digit', ch);
    result = result * bigBase + BigInt(d);
  }
  return { value: negative ? -result : result, error: '', at: '', negative };
}

export function toBaseString(value: bigint, base: number): string {
  const negative = value < 0n;
  let v = negative ? -value : value;
  if (v === 0n) return '0';
  const bigBase = BigInt(base);
  let out = '';
  while (v > 0n) {
    out = DIGITS[Number(v % bigBase)] + out;
    v /= bigBase;
  }
  return negative ? '-' + out : out;
}

/** Inserts a separator every `size` digits, counting from the right. */
export function group(text: string, size: number, sep = ' '): string {
  if (size <= 0) return text;
  const neg = text.startsWith('-');
  const body = neg ? text.slice(1) : text;
  const parts: string[] = [];
  for (let end = body.length; end > 0; end -= size) {
    parts.unshift(body.slice(Math.max(0, end - size), end));
  }
  return (neg ? '-' : '') + parts.join(sep);
}

// ---------------------------------------------------------------------------
// Widths and two's complement
// ---------------------------------------------------------------------------

export const widthMask = (width: Width): bigint => (width === 0 ? 0n : (1n << BigInt(width)) - 1n);

export interface Fitted {
  /** The value as stored in `width` bits, always non-negative. */
  raw: bigint;
  /** The same bits read as a signed two's complement number. */
  signed: bigint;
  /** True when the input did not fit and had to wrap. */
  overflow: boolean;
}

/**
 * Applies a fixed width. A negative input becomes its two's complement, which
 * is the entire reason -1 shows as 0xFF at 8 bits and 0xFFFFFFFF at 32.
 */
export function fit(value: bigint, width: Width): Fitted {
  if (width === 0) {
    return { raw: value < 0n ? value : value, signed: value, overflow: false };
  }
  const mask = widthMask(width);
  const raw = ((value % (mask + 1n)) + mask + 1n) & mask;
  const overflow = value < 0n ? value < -(1n << BigInt(width - 1)) : value > mask;
  const signBit = 1n << BigInt(width - 1);
  const signed = raw >= signBit ? raw - (mask + 1n) : raw;
  return { raw, signed, overflow };
}

/** Bit string of `value` padded to `width` (or its natural length at width 0). */
export function toBits(raw: bigint, width: Width): string {
  const bits = toBaseString(raw < 0n ? -raw : raw, 2);
  if (width === 0) return bits;
  return bits.padStart(width, '0').slice(-width);
}

/** Splits a padded bit string into bytes for display. */
export function toByteRows(bits: string): string[] {
  const padded = bits.padStart(Math.ceil(bits.length / 8) * 8, '0');
  const out: string[] = [];
  for (let i = 0; i < padded.length; i += 8) out.push(padded.slice(i, i + 8));
  return out;
}

/** Flips one bit of a stored value, counting from the most significant bit. */
export function toggleBit(raw: bigint, width: Width, indexFromMsb: number, totalBits: number): bigint {
  const fromLsb = BigInt(totalBits - 1 - indexFromMsb);
  const next = raw ^ (1n << fromLsb);
  return width === 0 ? next : next & widthMask(width);
}

// ---------------------------------------------------------------------------
// Bitwise operations
// ---------------------------------------------------------------------------

/**
 * Applies a bitwise operation at the chosen width. JavaScript's own `&`, `|`
 * and `^` on Numbers truncate to 32 bits, which is exactly the trap this tool
 * exists to avoid, so everything stays in BigInt and the width is explicit.
 */
export function applyOp(a: bigint, b: bigint, op: BitOp, width: Width): bigint {
  const mask = widthMask(width);
  const clip = (v: bigint) => (width === 0 ? v : v & mask);
  switch (op) {
    case 'and':
      return clip(a & b);
    case 'or':
      return clip(a | b);
    case 'xor':
      return clip(a ^ b);
    case 'not':
      // Without a width there is no highest bit to flip against, so NOT falls
      // back to the arbitrary-precision definition.
      return width === 0 ? -a - 1n : clip(~a);
    case 'shl':
      return clip(a << (b < 0n ? 0n : b));
    case 'shr':
      return a >> (b < 0n ? 0n : b);
    default:
      return a;
  }
}

export const OP_SYMBOL: Record<BitOp, string> = {
  and: '&',
  or: '|',
  xor: '^',
  not: '~',
  shl: '<<',
  shr: '>>',
};

// ---------------------------------------------------------------------------
// Bases
// ---------------------------------------------------------------------------

export function clampBase(n: number): number {
  if (!Number.isFinite(n)) return 10;
  return Math.min(MAX_BASE, Math.max(MIN_BASE, Math.round(n)));
}

/** Digit grouping that matches how each base is normally written. */
export function groupSizeFor(base: number): number {
  if (base === 2) return 8;
  if (base === 16) return 2;
  if (base === 10) return 3;
  return 0;
}
