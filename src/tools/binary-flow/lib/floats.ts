import type { FloatParts } from '../types';

// ============================================================================
// IEEE-754
// ----------------------------------------------------------------------------
// The bits are the source of truth, not the printed number. Decomposing them
// into sign / exponent / mantissa is the intermediate data that explains why
// 0.1 + 0.2 is not 0.3, and no amount of decimal formatting can show it.
// ============================================================================

const SPEC = {
  32: { exponentBits: 8, mantissaBits: 23, bias: 127 },
  64: { exponentBits: 11, mantissaBits: 52, bias: 1023 },
} as const;

export type Precision = 32 | 64;

/** Raw stored bits -> the number they denote. */
export function bitsToFloat(raw: bigint, precision: Precision): number {
  const buf = new ArrayBuffer(precision / 8);
  const view = new DataView(buf);
  if (precision === 32) {
    view.setUint32(0, Number(raw & 0xffffffffn), false);
    return view.getFloat32(0, false);
  }
  view.setBigUint64(0, raw & 0xffffffffffffffffn, false);
  return view.getFloat64(0, false);
}

/** A number -> the bits that store it. */
export function floatToBits(value: number, precision: Precision): bigint {
  const buf = new ArrayBuffer(precision / 8);
  const view = new DataView(buf);
  if (precision === 32) {
    view.setFloat32(0, value, false);
    return BigInt(view.getUint32(0, false));
  }
  view.setFloat64(0, value, false);
  return view.getBigUint64(0, false);
}

export function decompose(raw: bigint, precision: Precision): FloatParts {
  const { exponentBits, mantissaBits, bias } = SPEC[precision];
  const mantissaMask = (1n << BigInt(mantissaBits)) - 1n;
  const exponentMask = (1n << BigInt(exponentBits)) - 1n;

  const sign = Number((raw >> BigInt(exponentBits + mantissaBits)) & 1n);
  const rawExponent = Number((raw >> BigInt(mantissaBits)) & exponentMask);
  const rawMantissa = raw & mantissaMask;
  const value = bitsToFloat(raw, precision);

  let kind = 'normal';
  if (rawExponent === 0) kind = rawMantissa === 0n ? 'zero' : 'subnormal';
  else if (rawExponent === Number(exponentMask)) kind = rawMantissa === 0n ? 'infinity' : 'nan';

  return {
    sign,
    rawExponent,
    // Subnormals share the smallest exponent but drop the implicit leading 1,
    // so their effective exponent is 1 - bias, not 0 - bias.
    exponent: kind === 'normal' ? rawExponent - bias : kind === 'subnormal' ? 1 - bias : 0,
    rawMantissa,
    value,
    kind,
    exponentBits,
    mantissaBits,
  };
}

/**
 * The exact decimal value of a float, not its shortest round-tripping form.
 * `(0.1).toString()` prints "0.1"; this prints the 55 digits actually stored,
 * which is the whole point of looking at the bits.
 */
export function exactDecimal(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  if (Object.is(value, -0)) return '-0';
  const raw = floatToBits(value, 64);
  const exponent = Number((raw >> 52n) & 0x7ffn);
  const fraction = raw & ((1n << 52n) - 1n);
  const mantissa = exponent ? (1n << 52n) | fraction : fraction;
  const power = (exponent ? exponent - 1023 : -1022) - 52;
  const sign = value < 0 ? '-' : '';
  if (power >= 0) return sign + (mantissa << BigInt(power)).toString();
  // m / 2^k = m * 5^k / 10^k. At most 1074 decimal places,
  // including the smallest subnormal; no rounding and no English fallback.
  const places = -power;
  const digits = (mantissa * 5n ** BigInt(places)).toString().padStart(places + 1, '0');
  const fractional = digits.slice(-places).replace(/0+$/, '');
  return sign + digits.slice(0, -places) + (fractional ? '.' + fractional : '');
}

/** Distance to the next representable neighbour, i.e. the local precision. */
export function ulp(value: number, precision: Precision): number {
  if (!Number.isFinite(value)) return NaN;
  const parts = decompose(floatToBits(Math.abs(value), precision), precision);
  if (parts.kind === 'infinity') return NaN;
  return 2 ** ((parts.kind === 'zero' || parts.kind === 'subnormal' ? 1 - SPEC[precision].bias : parts.exponent) - parts.mantissaBits);
}

export const FIELD_LABELS = ['sign', 'exponent', 'mantissa'] as const;

/** Which field a bit belongs to, counting from the most significant bit. */
export function fieldOfBit(indexFromMsb: number, precision: Precision): 'sign' | 'exponent' | 'mantissa' {
  const { exponentBits } = SPEC[precision];
  if (indexFromMsb === 0) return 'sign';
  if (indexFromMsb <= exponentBits) return 'exponent';
  return 'mantissa';
}
