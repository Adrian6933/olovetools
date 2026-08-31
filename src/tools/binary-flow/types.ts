// ============================================================================
// BinaryFlow - conversion model
// ----------------------------------------------------------------------------
// Every view (bases, bit grid, float fields, byte dump) is derived from one
// value plus one interpretation. Keeping those two apart is what lets the same
// bits be read as an unsigned integer, a signed integer or a float without
// re-parsing anything.
// ============================================================================

export type Mode = 'number' | 'text' | 'bytes';

/** Interpretation of the bits, not of the input. */
export type Signedness = 'unsigned' | 'signed' | 'float';

/** Width in bits. `arbitrary` means BigInt with no ceiling at all. */
export type Width = 8 | 16 | 32 | 64 | 0;

export const WIDTHS: Width[] = [8, 16, 32, 64, 0];

export const COMMON_BASES = [2, 8, 10, 16] as const;
export const MIN_BASE = 2;
export const MAX_BASE = 36;

export type Endian = 'big' | 'little';

export type Encoding = 'utf-8' | 'utf-16le' | 'utf-16be' | 'latin-1';

export const ENCODINGS: Encoding[] = ['utf-8', 'utf-16le', 'utf-16be', 'latin-1'];

/** Parse outcome. A discriminated result rather than `bigint | null`, because
 *  this project builds without strictNullChecks and a bare null tells the UI
 *  nothing about *why* the input was rejected. */
export interface ParseResult {
  value: bigint;
  /** Empty when the parse succeeded. One of: 'empty' | 'digit' | 'range'. */
  error: string;
  /** The offending character, for the 'digit' error. */
  at: string;
  /** True when the input carried a leading minus. */
  negative: boolean;
}

/** IEEE-754 decomposition, the intermediate data a float really is. */
export interface FloatParts {
  sign: number;
  /** Raw stored exponent, before the bias is removed. */
  rawExponent: number;
  /** Unbiased exponent, or null for zero/subnormal/NaN/Infinity. */
  exponent: number;
  /** Raw mantissa bits as an unsigned integer. */
  rawMantissa: bigint;
  /** The number the bits actually denote. */
  value: number;
  /** 'normal' | 'subnormal' | 'zero' | 'infinity' | 'nan'. */
  kind: string;
  /** Bit counts for this precision. */
  exponentBits: number;
  mantissaBits: number;
}

export interface BitLayout {
  totalBits: number;
  /** Index ranges (from the most significant bit) for the float fields. */
  signEnd: number;
  exponentEnd: number;
}

export type BitOp = 'and' | 'or' | 'xor' | 'not' | 'shl' | 'shr';

export const BIT_OPS: BitOp[] = ['and', 'or', 'xor', 'not', 'shl', 'shr'];

/** How many bytes of a dropped file the byte view will read. */
export const MAX_DUMP_BYTES = 4096;
