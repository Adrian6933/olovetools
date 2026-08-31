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
  if (Number.isInteger(value) && Math.abs(value) < 1e21) return value.toLocaleString('en-US', { useGrouping: false });
  // toFixed caps at 100 digits, which is enough for every double: the smallest
  // subnormal needs 1074 fractional digits, so that one is reported as such.
  const abs = Math.abs(value);
  if (abs > 0 && abs < 1e-100) return value.toExponential(20) + ' (too small to print in full)';
  const fixed = value.toFixed(100).replace(/0+$/, '');
  return fixed.endsWith('.') ? fixed.slice(0, -1) : fixed;
}

/** Distance to the next representable neighbour, i.e. the local precision. */
export function ulp(value: number, precision: Precision): number {
  if (!Number.isFinite(value)) return NaN;
  const bits = floatToBits(value, precision);
  const next = bitsToFloat(bits + 1n, precision);
  const diff = Math.abs(next - value);
  return Number.isFinite(diff) ? diff : NaN;
}

export const FIELD_LABELS = ['sign', 'exponent', 'mantissa'] as const;

/** Which field a bit belongs to, counting from the most significant bit. */
export function fieldOfBit(indexFromMsb: number, precision: Precision): 'sign' | 'exponent' | 'mantissa' {
  const { exponentBits } = SPEC[precision];
  if (indexFromMsb === 0) return 'sign';
  if (indexFromMsb <= exponentBits) return 'exponent';
  return 'mantissa';
}
