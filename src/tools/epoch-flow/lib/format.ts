import type { ZoneInfo } from '../types';

// ============================================================================
// Formatting
// ----------------------------------------------------------------------------
// Everything user-visible goes through Intl, in the page's own locale. The old
// version hard-coded English weekday names and hand-rolled "3 months ago" from
// day/30, so every language got English words and rounded-off arithmetic.
// ============================================================================

/**
 * Offset of a zone at one instant, in minutes east of UTC.
 *
 * Formatting the instant in the zone and reading it back as if it were UTC is
 * the portable way to do this: `timeZoneName: 'longOffset'` is newer than some
 * of the browsers this site still serves.
 */
export function offsetMinutes(date: Date, zone: string): number {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const map: Record<string, string> = {};
    dtf.formatToParts(date).forEach(p => {
      map[p.type] = p.value;
    });
    const asUtc = Date.UTC(
      Number(map.year),
      Number(map.month) - 1,
      Number(map.day),
      Number(map.hour) % 24,
      Number(map.minute),
      Number(map.second)
    );
    return Math.round((asUtc - date.getTime()) / 60000);
  } catch {
    return 0;
  }
}

function abbreviation(date: Date, zone: string, locale: string): string {
  try {
    const parts = new Intl.DateTimeFormat(locale, { timeZone: zone, timeZoneName: 'short' }).formatToParts(date);
    return parts.find(p => p.type === 'timeZoneName')?.value || '';
  } catch {
    return '';
  }
}

/**
 * Whether the zone is on daylight saving at that instant.
 *
 * Comparing January against July and taking the smaller offset as standard
 * works in both hemispheres, and for zones with no DST both samples agree so
 * the answer is simply false.
 */
export function zoneInfo(date: Date, zone: string, locale: string): ZoneInfo {
  const year = date.getUTCFullYear();
  const jan = offsetMinutes(new Date(Date.UTC(year, 0, 1)), zone);
  const jul = offsetMinutes(new Date(Date.UTC(year, 6, 1)), zone);
  const standard = Math.min(jan, jul);
  const current = offsetMinutes(date, zone);
  return {
    id: zone,
    offsetMinutes: current,
    abbreviation: abbreviation(date, zone, locale),
    isDst: current > standard,
    standardOffsetMinutes: standard,
  };
}

export function offsetLabel(minutes: number): string {
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
}

/** Full date and time in one zone, in the page's locale. */
export function formatIn(date: Date, zone: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone: zone,
      dateStyle: 'full',
      timeStyle: 'medium',
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

export function weekdayIn(date: Date, zone: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { timeZone: zone, weekday: 'long' }).format(date);
  } catch {
    return '';
  }
}

/** ISO 8601 with the zone's own offset rather than a forced Z. */
export function isoIn(date: Date, zone: string): string {
  const offset = offsetMinutes(date, zone);
  const shifted = new Date(date.getTime() + offset * 60000);
  const base = shifted.toISOString().slice(0, 19);
  return offset === 0 ? `${base}Z` : `${base}${offsetLabel(offset)}`;
}

const REL_STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['second', 1000],
  ['minute', 60 * 1000],
  ['hour', 3600 * 1000],
  ['day', 86400 * 1000],
  ['week', 7 * 86400 * 1000],
  ['month', 30.436875 * 86400 * 1000],
  ['year', 365.2425 * 86400 * 1000],
];

/**
 * "3 months ago" in the page's own language, with correct plurals and word
 * order, instead of gluing a number between two translated fragments.
 */
export function relative(deltaMs: number, locale: string): string {
  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const abs = Math.abs(deltaMs);
    let chosen: Intl.RelativeTimeFormatUnit = 'second';
    let size = 1000;
    for (const [unit, ms] of REL_STEPS) {
      if (abs >= ms) {
        chosen = unit;
        size = ms;
      }
    }
    if (abs < 1000) return rtf.format(0, 'second');
    return rtf.format(Math.round(deltaMs / size), chosen);
  } catch {
    return '';
  }
}

const FALLBACK_ZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'America/Mexico_City',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Lisbon',
  'Europe/Moscow',
  'Africa/Cairo',
  'Africa/Lagos',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Singapore',
  'Australia/Sydney',
  'Pacific/Auckland',
];

/** Every IANA zone the browser knows, or a usable subset when it will not say. */
export function listZones(): string[] {
  try {
    const supported = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf;
    if (typeof supported === 'function') {
      const zones = supported('timeZone');
      if (Array.isArray(zones) && zones.length > 0) return ['UTC', ...zones.filter(z => z !== 'UTC')];
    }
  } catch {
    // Older browsers throw rather than returning nothing.
  }
  return FALLBACK_ZONES;
}

export function localZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Reads a `datetime-local` value as wall-clock time in a chosen zone.
 *
 * `new Date("2024-03-31T02:30")` is parsed in the *browser's* zone, so picking
 * a time for Tokyo while sitting in Madrid silently produced the wrong instant.
 * Guessing the offset then correcting once handles the DST edges, where the
 * offset before and after the shift disagree.
 */
export function wallClockToDate(value: string, zone: string): Date | null {
  if (!value) return null;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return null;
  const asUtc = Date.UTC(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(m[4]),
    Number(m[5]),
    Number(m[6] || 0)
  );
  const guess = new Date(asUtc - offsetMinutes(new Date(asUtc), zone) * 60000);
  const corrected = new Date(asUtc - offsetMinutes(guess, zone) * 60000);
  return corrected;
}

/** A `datetime-local` value showing the instant as wall-clock time in a zone. */
export function dateToWallClock(date: Date, zone: string): string {
  const shifted = new Date(date.getTime() + offsetMinutes(date, zone) * 60000);
  return shifted.toISOString().slice(0, 19);
}
