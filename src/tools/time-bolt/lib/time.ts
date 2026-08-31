import type { Transition, ZoneNow } from '../types';

// ============================================================================
// Zone arithmetic
// ============================================================================

const pad = (n: number) => String(n).padStart(2, '0');

interface Parts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export function zoneParts(tz: string, date: Date): Parts {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const map: Record<string, string> = {};
    fmt.formatToParts(date).forEach(p => {
      if (p.type !== 'literal') map[p.type] = p.value;
    });
    return {
      year: Number(map.year),
      month: Number(map.month),
      day: Number(map.day),
      // hourCycle h23 still reports midnight as "24" in some engines.
      hour: map.hour === '24' ? 0 : Number(map.hour),
      minute: Number(map.minute),
      second: Number(map.second),
    };
  } catch {
    return { year: 1970, month: 1, day: 1, hour: 0, minute: 0, second: 0 };
  }
}

export function offsetMinutes(tz: string, date: Date): number {
  const p = zoneParts(tz, date);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - date.getTime()) / 60000);
}

export function offsetLabel(minutes: number): string {
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  return `UTC${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

export function abbreviation(tz: string, date: Date, locale: string): string {
  try {
    const parts = new Intl.DateTimeFormat(locale, { timeZone: tz, timeZoneName: 'short' }).formatToParts(date);
    return parts.find(p => p.type === 'timeZoneName')?.value || '';
  } catch {
    return '';
  }
}

export function weekdayShort(tz: string, date: Date, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { timeZone: tz, weekday: 'short' }).format(date);
  } catch {
    return '';
  }
}

export function dateKey(tz: string, date: Date): string {
  const p = zoneParts(tz, date);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Everything one clock needs, computed once per zone per tick. */
export function zoneNow(tz: string, at: Date, referenceKey: string, locale: string): ZoneNow {
  const p = zoneParts(tz, at);
  const key = `${p.year}-${pad(p.month)}-${pad(p.day)}`;
  return {
    tz,
    hour: p.hour,
    minute: p.minute,
    second: p.second,
    date: key,
    weekday: weekdayShort(tz, at, locale),
    offsetMinutes: offsetMinutes(tz, at),
    abbreviation: abbreviation(tz, at, locale),
    dayShift: key === referenceKey ? 0 : key > referenceKey ? 1 : -1,
  };
}

/**
 * Wall-clock time in a zone -> the instant it denotes.
 *
 * Two passes because the first guess uses the offset of the wrong side of a
 * DST change; correcting once with the offset at the guessed instant lands on
 * the right one everywhere except inside the skipped hour, which does not
 * exist and is reported separately.
 */
export function instantFrom(tz: string, y: number, mo: number, d: number, h: number, mi: number): number {
  const guess = Date.UTC(y, mo - 1, d, h, mi, 0);
  const first = offsetMinutes(tz, new Date(guess));
  const corrected = guess - offsetMinutes(tz, new Date(guess - first * 60000)) * 60000;
  return corrected;
}

/**
 * The local hour a zone skips on a given day, or null when it skips none.
 *
 * A column of the grid is built from an instant, so it can never *be* a
 * non-existent time; what is worth saying is which hour vanished from that
 * day's clock. Tying the warning to the selected column instead was wrong on a
 * 23-hour day, where column 2 already shows 03:00.
 */
export function skippedHourOfDay(tz: string, dayStartMs: number): number | null {
  const tr = nextTransition(tz, new Date(dayStartMs - 1), 2);
  if (!tr || tr.at >= dayStartMs + 86400000) return null;
  if (tr.afterMinutes <= tr.beforeMinutes) return null; // clocks went back: no gap
  // Derived from the offsets, not from "one second before": the bisection lands
  // within a second of the boundary, and a second on the wrong side of it reads
  // the post-change hour and reports the gap an hour or two late.
  const localBefore = new Date(tr.at + tr.beforeMinutes * 60000);
  return localBefore.getUTCHours();
}

/**
 * Next clock change in a zone after `from`, found by bisecting the offset.
 *
 * Scanning day by day for a year and then narrowing to the minute costs a few
 * hundred Intl formats, which is cheap enough to do on demand and far simpler
 * than shipping a copy of the tz database.
 */
export function nextTransition(tz: string, from: Date, horizonDays = 400): Transition | null {
  const start = from.getTime();
  const startOffset = offsetMinutes(tz, from);
  const dayMs = 86400000;

  let loT = start;
  let loOff = startOffset;
  for (let d = 1; d <= horizonDays; d++) {
    const hiT = start + d * dayMs;
    const hiOff = offsetMinutes(tz, new Date(hiT));
    if (hiOff !== loOff) {
      // Narrow to the minute.
      // Down to the second: stopping at a minute leaves `at` up to 60 s past the
      // real boundary, which is enough to read the wrong side of the change.
      let lo = loT;
      let hi = hiT;
      while (hi - lo > 1000) {
        const mid = lo + Math.floor((hi - lo) / 2);
        if (offsetMinutes(tz, new Date(mid)) === loOff) lo = mid;
        else hi = mid;
      }
      return { at: hi, beforeMinutes: loOff, afterMinutes: offsetMinutes(tz, new Date(hi)) };
    }
    loT = hiT;
    loOff = hiOff;
  }
  return null;
}

/** Hour shown in a zone for a given UTC hour slot of the reference day. */
export function hourInZone(tz: string, instant: number): number {
  return zoneParts(tz, new Date(instant)).hour;
}

export function formatClock(h: number, m: number, use24: boolean): string {
  if (use24) return `${pad(h)}:${pad(m)}`;
  const suffix = h < 12 ? 'AM' : 'PM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${pad(m)} ${suffix}`;
}
