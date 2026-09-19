import {
  MAX_DATE_MS,
  SYSTEM_SPECS,
  UNIT_NS,
  type ParsedStamp,
  type System,
  type Unit,
} from '../types';

// ============================================================================
// Timestamp arithmetic
// ----------------------------------------------------------------------------
// All conversions go through nanoseconds-since-1970 as a BigInt. The previous
// version used Number throughout, which cannot hold a nanosecond timestamp
// exactly: 1700000000123456789 comes back as ...456768.
// ============================================================================

const DIGITS = /^-?\d+$/;

/** Reads a count in the given system, tolerating separators people paste. */
export function parseStamp(input: string, system: System, unit: Unit): ParsedStamp {
  const cleaned = input.trim().replace(/[\s_,]/g, '');
  if (!cleaned || cleaned === '-') return { ns: 0n, error: 'empty' };

  const spec = SYSTEM_SPECS[system];
  const tick = system === 'unix' ? UNIT_NS[unit] : spec.tickNs;

  let ns: bigint;
  if (spec.fractional || cleaned.includes('.')) {
    // Excel serials and Julian days are fractional by nature, and people also
    // paste "1700000000.123" for Unix seconds.
    const asNumber = Number(cleaned);
    if (!Number.isFinite(asNumber)) return { ns: 0n, error: 'nan' };
    ns = BigInt(Math.round(asNumber * Number(tick)));
  } else {
    if (!DIGITS.test(cleaned)) return { ns: 0n, error: 'nan' };
    ns = BigInt(cleaned) * tick;
  }

  ns += spec.epochOffsetNs;

  // Date cannot represent instants outside ±100 000 000 days from the epoch,
  // so anything beyond that is reported rather than silently shown as
  // "Invalid Date".
  const ms = ns / 1_000_000n;
  if (ms > BigInt(MAX_DATE_MS) || ms < BigInt(-MAX_DATE_MS)) return { ns, error: 'range' };

  return { ns, error: '' };
}

/** Nanoseconds-since-epoch -> a count in the given system. */
export function formatStamp(ns: bigint, system: System, unit: Unit): string {
  const spec = SYSTEM_SPECS[system];
  const tick = system === 'unix' ? UNIT_NS[unit] : spec.tickNs;
  const shifted = ns - spec.epochOffsetNs;

  if (spec.fractional) {
    // Six decimals is a second and a half of a day: enough for a spreadsheet
    // cell without pretending to nanosecond precision.
    const days = Number(shifted) / Number(tick);
    return days.toFixed(6).replace(/\.?0+$/, '');
  }
  // Integer division truncates toward zero, which would move pre-1970 stamps
  // forward by one tick; flooring keeps them on the right side.
  const q = shifted / tick;
  const r = shifted % tick;
  return String(r !== 0n && shifted < 0n ? q - 1n : q);
}

// Suelo y no division truncada: `subMs` da el resto siempre positivo, asi que
// el milisegundo tiene que ser el de abajo. Truncando, -1 ns salia como
// 1970-01-01T00:00:00.000 "mas 999 µs" (despues de 1970, no antes) y -1500 µs
// caia en .999 en vez de .998.
export const nsToMs = (ns: bigint): number => {
  const q = ns / 1_000_000n;
  return Number(ns % 1_000_000n !== 0n && ns < 0n ? q - 1n : q);
};

/** The sub-millisecond remainder, for display next to the date. */
export function subMs(ns: bigint): { us: number; ns: number } {
  let rem = ns % 1_000_000n;
  if (rem < 0n) rem += 1_000_000n;
  return { us: Number(rem / 1000n), ns: Number(rem % 1000n) };
}

// ---------------------------------------------------------------------------
// Unit detection
// ---------------------------------------------------------------------------

export interface Detection {
  unit: Unit;
  /** True when the guess is unambiguous enough to trust. */
  confident: boolean;
  /** The year the guess lands on, which is what makes it believable or not. */
  year: number;
}

/**
 * Guesses the unit by asking which reading lands closest to now.
 *
 * The old rule was a single threshold (>= 1e11 means milliseconds), which reads
 * every microsecond timestamp as milliseconds and is wrong by a factor of a
 * thousand. This tries each unit and picks the one that produces a plausible
 * date — and the UI always lets the user override it, because a guess about
 * somebody else's log format should never be the last word.
 */
export function detectUnit(input: string, nowMs = Date.now()): Detection {
  const cleaned = input.trim().replace(/[\s_,]/g, '');
  const fallback: Detection = { unit: 's', confident: false, year: 1970 };
  if (!DIGITS.test(cleaned)) return fallback;

  const raw = BigInt(cleaned);
  const nowNs = BigInt(Math.round(nowMs)) * 1_000_000n;

  let best: Detection = fallback;
  let bestDistance = Infinity;

  (['s', 'ms', 'us', 'ns'] as Unit[]).forEach(unit => {
    const ns = raw * UNIT_NS[unit];
    const ms = ns / 1_000_000n;
    if (ms > BigInt(MAX_DATE_MS) || ms < BigInt(-MAX_DATE_MS)) return;
    const year = new Date(Number(ms)).getUTCFullYear();
    // Distance from now, in years, is a better score than digit count: it is
    // what a person actually checks when they eyeball a decoded timestamp.
    const distance = Math.abs(Number(ns - nowNs)) / 3.15e16;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = { unit, confident: false, year };
    }
  });

  // Confident when the winner lands within a human range and no other unit
  // lands anywhere near as close.
  const plausible = best.year >= 1970 && best.year <= 2200;
  return { ...best, confident: plausible && bestDistance < 60 };
}

/** Every system's rendering of the same instant, for the comparison table. */
export function allSystems(ns: bigint, unit: Unit): { id: System; value: string }[] {
  return (Object.keys(SYSTEM_SPECS) as System[]).map(id => ({
    id,
    value: formatStamp(ns, id, unit),
  }));
}
