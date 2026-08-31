// ============================================================================
// Scheduling
// ----------------------------------------------------------------------------
// The whole search runs in *civil* time — a plain {y, mo, d, h, mi, s} struct
// with hand-written calendar arithmetic — and only converts to an instant once
// a match is found. Doing it the obvious way instead (mutating a local `Date`
// with setHours/setMinutes) is what produced the DST bugs in the old build:
// on the spring-forward Sunday `d.setHours(d.getHours() + 1, 0, 0, 0)` either
// skips an hour or lands on one that does not exist, and there is no way to
// ask a local `Date` about a schedule that runs in another timezone anyway.
//
// Timezones come from Intl, so there is no library and no network cost.
// ============================================================================

import type { Cron, Field, Term } from './cron';

export interface Civil {
  y: number;
  mo: number; // 1-12
  d: number;  // 1-31
  h: number;
  mi: number;
  s: number;
}

export interface Occurrence {
  /** The instant, as epoch milliseconds. */
  ts: number;
  /** Wall-clock fields in the schedule's timezone. */
  civil: Civil;
  /**
   * True when the wall-clock time does not exist in that timezone (the hour a
   * DST spring-forward removed) and the run was pushed to the next real
   * instant. Real cron implementations differ here; we surface it.
   */
  dstShifted: boolean;
}

// ----------------------------------------------------------------------------
// Calendar arithmetic
// ----------------------------------------------------------------------------

export function isLeap(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function daysInMonth(y: number, mo: number): number {
  return mo === 2 && isLeap(y) ? 29 : MONTH_LENGTHS[mo - 1];
}

/** 0 = Sunday. Uses UTC so it never touches the host timezone. */
export function dayOfWeek(y: number, mo: number, d: number): number {
  return new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
}

// ----------------------------------------------------------------------------
// Timezone conversion
// ----------------------------------------------------------------------------

const offsetFormatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(tz: string): Intl.DateTimeFormat {
  let f = offsetFormatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      era: 'short',
    });
    offsetFormatters.set(tz, f);
  }
  return f;
}

/** The wall-clock fields an instant shows in `tz`. */
export function instantToCivil(ts: number, tz: string): Civil {
  const parts = formatterFor(tz).formatToParts(new Date(ts));
  const get = (type: string) => {
    for (const p of parts) if (p.type === type) return parseInt(p.value, 10);
    return 0;
  };
  // `hour12: false` still renders midnight as 24 in some ICU versions.
  const h = get('hour') % 24;
  return { y: get('year'), mo: get('month'), d: get('day'), h, mi: get('minute'), s: get('second') };
}

/** Offset of `tz` at a given instant, in milliseconds (east of UTC positive). */
function offsetAt(ts: number, tz: string): number {
  const c = instantToCivil(ts, tz);
  const asUtc = Date.UTC(c.y, c.mo - 1, c.d, c.h, c.mi, c.s);
  return asUtc - ts;
}

/**
 * Turns wall-clock fields in `tz` into an instant.
 *
 * Two passes: the first guesses with the offset at the naive UTC instant, the
 * second corrects it using the offset that actually applies at the candidate.
 * `shifted` reports the spring-forward hole, where no instant maps back to the
 * requested wall clock.
 */
export function civilToInstant(c: Civil, tz: string): { ts: number; shifted: boolean } {
  const naive = Date.UTC(c.y, c.mo - 1, c.d, c.h, c.mi, c.s);
  let ts = naive - offsetAt(naive, tz);
  ts = naive - offsetAt(ts, tz);
  const back = instantToCivil(ts, tz);
  const shifted = back.h !== c.h || back.mi !== c.mi || back.d !== c.d;
  return { ts, shifted };
}

/** IANA name of the visitor's own zone, with a safe fallback. */
export function localTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// ----------------------------------------------------------------------------
// Matching
// ----------------------------------------------------------------------------

function lastDayMatches(term: Term, y: number, mo: number, d: number): boolean {
  const last = daysInMonth(y, mo);
  switch (term.kind) {
    case 'lastDay':
      return d === last - (term.offset || 0);
    case 'lastWeekday': {
      // The last Mon-Fri of the month.
      let candidate = last;
      while (dayOfWeek(y, mo, candidate) === 0 || dayOfWeek(y, mo, candidate) === 6) candidate--;
      return d === candidate;
    }
    case 'nearestWd': {
      // `15W`: the weekday nearest the 15th, never crossing into another month.
      const target = Math.min(term.values[0], last);
      const dow = dayOfWeek(y, mo, target);
      let candidate = target;
      if (dow === 6) candidate = target === 1 ? target + 2 : target - 1;
      else if (dow === 0) candidate = target === last ? target - 2 : target + 1;
      return d === candidate;
    }
    default:
      return false;
  }
}

function weekdaySpecialMatches(term: Term, y: number, mo: number, d: number): boolean {
  if (dayOfWeek(y, mo, d) !== term.dow) return false;
  if (term.kind === 'nthDow') {
    return Math.floor((d - 1) / 7) + 1 === term.nth;
  }
  if (term.kind === 'lastDow') {
    return d + 7 > daysInMonth(y, mo);
  }
  return false;
}

function dayFieldMatches(field: Field, y: number, mo: number, d: number): boolean {
  if (field.values.indexOf(d) !== -1) return true;
  for (const term of field.specials) if (lastDayMatches(term, y, mo, d)) return true;
  return false;
}

function weekdayFieldMatches(field: Field, y: number, mo: number, d: number): boolean {
  if (field.values.indexOf(dayOfWeek(y, mo, d)) !== -1) return true;
  for (const term of field.specials) if (weekdaySpecialMatches(term, y, mo, d)) return true;
  return false;
}

/** The Vixie OR rule: when both day fields are pinned, either one is enough. */
export function dateMatches(cron: Cron, y: number, mo: number, d: number): boolean {
  if (cron.fields.year.values.indexOf(y) === -1) return false;
  if (cron.fields.month.values.indexOf(mo) === -1) return false;

  const dayField = cron.fields.day;
  const weekdayField = cron.fields.weekday;

  // Both fields are always tested. `unrestricted` only picks the combinator,
  // exactly as Vixie does: a star in either field means AND, two pinned fields
  // mean OR. Skipping the test for an unrestricted field would be wrong for a
  // star-step, which is unrestricted (it starts with a star) yet still selects
  // a subset of the days.
  const domOk = dayFieldMatches(dayField, y, mo, d);
  const dowOk = weekdayFieldMatches(weekdayField, y, mo, d);

  if (!dayField.unrestricted && !weekdayField.unrestricted) return domOk || dowOk;
  return domOk && dowOk;
}

/** Whether a full civil timestamp is a scheduled run. */
export function civilMatches(cron: Cron, c: Civil): boolean {
  return (
    dateMatches(cron, c.y, c.mo, c.d) &&
    cron.fields.hour.values.indexOf(c.h) !== -1 &&
    cron.fields.minute.values.indexOf(c.mi) !== -1 &&
    cron.fields.second.values.indexOf(c.s) !== -1
  );
}

// ----------------------------------------------------------------------------
// Search
// ----------------------------------------------------------------------------

/** Smallest value in `sorted` that is >= n, or -1. */
function ceilIn(sorted: number[], n: number): number {
  for (let i = 0; i < sorted.length; i++) if (sorted[i] >= n) return sorted[i];
  return -1;
}

/** Largest value in `sorted` that is <= n, or -1. */
function floorIn(sorted: number[], n: number): number {
  for (let i = sorted.length - 1; i >= 0; i--) if (sorted[i] <= n) return sorted[i];
  return -1;
}

function addDays(c: Civil, delta: number): void {
  c.d += delta;
  while (c.d > daysInMonth(c.y, c.mo)) {
    c.d -= daysInMonth(c.y, c.mo);
    c.mo++;
    if (c.mo > 12) {
      c.mo = 1;
      c.y++;
    }
  }
  while (c.d < 1) {
    c.mo--;
    if (c.mo < 1) {
      c.mo = 12;
      c.y--;
    }
    c.d += daysInMonth(c.y, c.mo);
  }
}

/** Hard ceiling on the walk, so a never-matching expression still returns. */
const YEAR_HORIZON = 8;
const MAX_STEPS = 400000;

/**
 * Next run strictly after `fromTs`, or null within the horizon.
 * `useSeconds` is false for 5-field expressions, where the second is pinned to
 * zero and stepping second-by-second would be 60x wasted work.
 */
export function nextOccurrence(cron: Cron, fromTs: number, tz: string): Occurrence {
  const start = instantToCivil(fromTs, tz);
  const usesSeconds = cron.order.indexOf('second') !== -1;
  const c: Civil = { ...start };

  // Advance one unit past the reference so "next" is strictly in the future.
  if (usesSeconds) c.s += 1;
  else {
    c.s = 0;
    c.mi += 1;
  }
  if (c.s > 59) {
    c.s -= 60;
    c.mi += 1;
  }
  if (c.mi > 59) {
    c.mi -= 60;
    c.h += 1;
  }
  if (c.h > 23) {
    c.h -= 24;
    addDays(c, 1);
  }

  const limitYear = start.y + YEAR_HORIZON;
  let steps = 0;

  while (c.y <= limitYear && steps < MAX_STEPS) {
    steps++;

    if (cron.fields.year.values.indexOf(c.y) === -1) {
      const nextYear = ceilIn(cron.fields.year.values, c.y);
      if (nextYear === -1) return null;
      c.y = nextYear;
      c.mo = 1;
      c.d = 1;
      c.h = 0;
      c.mi = 0;
      c.s = 0;
      continue;
    }
    if (cron.fields.month.values.indexOf(c.mo) === -1) {
      const nextMonth = ceilIn(cron.fields.month.values, c.mo);
      if (nextMonth === -1) {
        c.y++;
        c.mo = 1;
      } else {
        c.mo = nextMonth;
      }
      c.d = 1;
      c.h = 0;
      c.mi = 0;
      c.s = 0;
      continue;
    }
    if (!dateMatches(cron, c.y, c.mo, c.d)) {
      addDays(c, 1);
      c.h = 0;
      c.mi = 0;
      c.s = 0;
      continue;
    }
    const h = ceilIn(cron.fields.hour.values, c.h);
    if (h === -1) {
      addDays(c, 1);
      c.h = 0;
      c.mi = 0;
      c.s = 0;
      continue;
    }
    if (h !== c.h) {
      c.h = h;
      c.mi = 0;
      c.s = 0;
    }
    const mi = ceilIn(cron.fields.minute.values, c.mi);
    if (mi === -1) {
      c.h += 1;
      c.mi = 0;
      c.s = 0;
      if (c.h > 23) {
        addDays(c, 1);
        c.h = 0;
      }
      continue;
    }
    if (mi !== c.mi) {
      c.mi = mi;
      c.s = 0;
    }
    const s = ceilIn(cron.fields.second.values, c.s);
    if (s === -1) {
      c.mi += 1;
      c.s = 0;
      if (c.mi > 59) {
        c.mi = 0;
        c.h += 1;
        if (c.h > 23) {
          addDays(c, 1);
          c.h = 0;
        }
      }
      continue;
    }
    c.s = s;

    const { ts, shifted } = civilToInstant(c, tz);
    // A shifted run can land before the reference (the DST hole swallowed it);
    // skipping keeps the list monotonic.
    if (ts <= fromTs) {
      c.mi += 1;
      c.s = 0;
      if (c.mi > 59) {
        c.mi = 0;
        c.h += 1;
        if (c.h > 23) {
          addDays(c, 1);
          c.h = 0;
        }
      }
      continue;
    }
    return { ts, civil: { ...c }, dstShifted: shifted };
  }
  return null;
}

/** Previous run strictly before `fromTs`. Mirrors nextOccurrence. */
export function previousOccurrence(cron: Cron, fromTs: number, tz: string): Occurrence {
  const start = instantToCivil(fromTs, tz);
  const usesSeconds = cron.order.indexOf('second') !== -1;
  const c: Civil = { ...start };

  if (usesSeconds) c.s -= 1;
  else {
    c.s = 0;
    c.mi -= 1;
  }
  if (c.s < 0) {
    c.s += 60;
    c.mi -= 1;
  }
  if (c.mi < 0) {
    c.mi += 60;
    c.h -= 1;
  }
  if (c.h < 0) {
    c.h += 24;
    addDays(c, -1);
  }

  const limitYear = start.y - YEAR_HORIZON;
  let steps = 0;

  while (c.y >= limitYear && steps < MAX_STEPS) {
    steps++;

    if (cron.fields.year.values.indexOf(c.y) === -1) {
      const prevYear = floorIn(cron.fields.year.values, c.y);
      if (prevYear === -1) return null;
      c.y = prevYear;
      c.mo = 12;
      c.d = 31;
      c.h = 23;
      c.mi = 59;
      c.s = 59;
      continue;
    }
    if (cron.fields.month.values.indexOf(c.mo) === -1) {
      const prevMonth = floorIn(cron.fields.month.values, c.mo);
      if (prevMonth === -1) {
        c.y--;
        c.mo = 12;
      } else {
        c.mo = prevMonth;
      }
      c.d = daysInMonth(c.y, c.mo);
      c.h = 23;
      c.mi = 59;
      c.s = 59;
      continue;
    }
    if (!dateMatches(cron, c.y, c.mo, c.d)) {
      addDays(c, -1);
      c.h = 23;
      c.mi = 59;
      c.s = 59;
      continue;
    }
    const h = floorIn(cron.fields.hour.values, c.h);
    if (h === -1) {
      addDays(c, -1);
      c.h = 23;
      c.mi = 59;
      c.s = 59;
      continue;
    }
    if (h !== c.h) {
      c.h = h;
      c.mi = 59;
      c.s = 59;
    }
    const mi = floorIn(cron.fields.minute.values, c.mi);
    if (mi === -1) {
      c.h -= 1;
      c.mi = 59;
      c.s = 59;
      if (c.h < 0) {
        addDays(c, -1);
        c.h = 23;
      }
      continue;
    }
    if (mi !== c.mi) {
      c.mi = mi;
      c.s = 59;
    }
    const s = floorIn(cron.fields.second.values, c.s);
    if (s === -1) {
      c.mi -= 1;
      c.s = 59;
      if (c.mi < 0) {
        c.mi = 59;
        c.h -= 1;
        if (c.h < 0) {
          addDays(c, -1);
          c.h = 23;
        }
      }
      continue;
    }
    c.s = s;

    const { ts, shifted } = civilToInstant(c, tz);
    if (ts >= fromTs) {
      c.mi -= 1;
      c.s = 59;
      if (c.mi < 0) {
        c.mi = 59;
        c.h -= 1;
        if (c.h < 0) {
          addDays(c, -1);
          c.h = 23;
        }
      }
      continue;
    }
    return { ts, civil: { ...c }, dstShifted: shifted };
  }
  return null;
}

export function nextOccurrences(cron: Cron, fromTs: number, tz: string, count: number): Occurrence[] {
  const out: Occurrence[] = [];
  let cursor = fromTs;
  for (let i = 0; i < count; i++) {
    const hit = nextOccurrence(cron, cursor, tz);
    if (!hit) break;
    out.push(hit);
    cursor = hit.ts;
  }
  return out;
}

export function previousOccurrences(cron: Cron, fromTs: number, tz: string, count: number): Occurrence[] {
  const out: Occurrence[] = [];
  let cursor = fromTs;
  for (let i = 0; i < count; i++) {
    const hit = previousOccurrence(cron, cursor, tz);
    if (!hit) break;
    out.push(hit);
    cursor = hit.ts;
  }
  return out;
}

// ----------------------------------------------------------------------------
// Frequency
// ----------------------------------------------------------------------------

export interface Frequency {
  /** Runs on an average day the schedule is active. */
  perActiveDay: number;
  /** Days the schedule fires in a calendar year, counted exactly. */
  activeDaysPerYear: number;
  /** Runs per calendar year. */
  perYear: number;
  /** Gap between consecutive runs in ms when it is constant, else 0. */
  evenInterval: number;
}

/**
 * Counted, not sampled: the time-of-day part is a plain product of the three
 * field sizes, and the calendar part walks one real year day by day (366 cheap
 * checks). No occurrence search involved, so it stays instant while typing.
 */
export function frequency(cron: Cron, referenceYear: number): Frequency {
  const perDay =
    cron.fields.hour.values.length * cron.fields.minute.values.length * cron.fields.second.values.length;

  let activeDays = 0;
  const years = cron.fields.year.values;
  const year = years.indexOf(referenceYear) !== -1 ? referenceYear : years[0] || referenceYear;
  for (let mo = 1; mo <= 12; mo++) {
    if (cron.fields.month.values.indexOf(mo) === -1) continue;
    const last = daysInMonth(year, mo);
    for (let d = 1; d <= last; d++) {
      if (dateMatches(cron, year, mo, d)) activeDays++;
    }
  }

  return {
    perActiveDay: perDay,
    activeDaysPerYear: activeDays,
    perYear: perDay * activeDays,
    evenInterval: evenIntervalOf(cron, perDay),
  };
}

/**
 * The constant gap between runs, or 0 when there isn't one.
 *
 * Materialising the day's run offsets and diffing them is the only way to get
 * this right across the three time fields at once; the shortcut of looking at
 * one field in isolation says "not even" for the single most common expression
 * there is (a star-step on minutes, where the hour field is a full star and so
 * looks "spread"). The list is bounded: anything denser than a few thousand
 * runs a day can only be a full second field, which is even by construction.
 */
function evenIntervalOf(cron: Cron, perDay: number): number {
  const everyDay =
    cron.fields.month.values.length === 12 &&
    cron.fields.day.unrestricted &&
    cron.fields.day.values.length === 31 &&
    cron.fields.weekday.unrestricted &&
    cron.fields.weekday.values.length === 7;
  if (!everyDay) return 0;
  if (perDay === 1) return 86400000;

  if (perDay > 5000) {
    const full =
      cron.fields.second.values.length === 60 &&
      cron.fields.minute.values.length === 60 &&
      cron.fields.hour.values.length === 24;
    return full ? 1000 : 0;
  }

  const offsets: number[] = [];
  for (const h of cron.fields.hour.values) {
    for (const mi of cron.fields.minute.values) {
      for (const s of cron.fields.second.values) offsets.push(h * 3600 + mi * 60 + s);
    }
  }
  offsets.sort((a, b) => a - b);
  const gaps = new Set<number>();
  for (let i = 1; i < offsets.length; i++) gaps.add(offsets[i] - offsets[i - 1]);
  gaps.add(offsets[0] + 86400 - offsets[offsets.length - 1]);
  return gaps.size === 1 ? Array.from(gaps)[0] * 1000 : 0;
}

/** Days of `month` (1-12) the schedule touches — the calendar heatmap's data. */
export function activeDaysOfMonth(cron: Cron, year: number, month: number): boolean[] {
  const last = daysInMonth(year, month);
  const out: boolean[] = [];
  for (let d = 1; d <= last; d++) out.push(dateMatches(cron, year, month, d));
  return out;
}

/** Runs per hour slot on a given day — the 24-column strip under the calendar. */
export function hourHistogram(cron: Cron): number[] {
  const perHour = cron.fields.minute.values.length * cron.fields.second.values.length;
  const out: number[] = [];
  for (let h = 0; h < 24; h++) out.push(cron.fields.hour.values.indexOf(h) !== -1 ? perHour : 0);
  return out;
}
