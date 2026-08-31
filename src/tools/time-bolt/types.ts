// ============================================================================
// TimeBolt - world clocks and meeting planner
// ============================================================================

export interface ZoneEntry {
  /** IANA identifier, the only thing that is authoritative. */
  tz: string;
  /** Display name: a real city when we know one, otherwise the zone's own tail. */
  city: string;
  country: string;
}

export interface ZoneNow {
  tz: string;
  hour: number;
  minute: number;
  second: number;
  /** Calendar date in that zone, as YYYY-MM-DD. */
  date: string;
  weekday: string;
  offsetMinutes: number;
  abbreviation: string;
  /** Day offset against the reference zone: -1, 0 or +1. */
  dayShift: number;
}

/** Bands used to shade the overlap grid. */
export type Band = 'night' | 'early' | 'work' | 'evening';

export interface WorkingHours {
  start: number;
  end: number;
}

export const DEFAULT_WORKING: WorkingHours = { start: 9, end: 18 };

export function bandFor(hour: number, work: WorkingHours): Band {
  if (hour >= work.start && hour < work.end) return 'work';
  if (hour >= 6 && hour < work.start) return 'early';
  if (hour >= work.end && hour < 22) return 'evening';
  return 'night';
}

/** A clock change: the instant, and the offsets either side of it. */
export interface Transition {
  at: number;
  beforeMinutes: number;
  afterMinutes: number;
}

export const STORAGE_KEY = 'time-bolt-zones-v1';
