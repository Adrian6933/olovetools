// ============================================================================
// EpochFlow - timestamp model
// ----------------------------------------------------------------------------
// Everything is normalised to one value: milliseconds since 1970-01-01 UTC,
// carried as a BigInt of *nanoseconds* internally so a nanosecond timestamp
// from Go or InfluxDB survives the trip. Number would round it away silently.
// ============================================================================

/** Sub-second resolution of a Unix-style timestamp. */
export type Unit = 's' | 'ms' | 'us' | 'ns';

export const UNITS: Unit[] = ['s', 'ms', 'us', 'ns'];

/** Nanoseconds in one tick of each unit. */
export const UNIT_NS: Record<Unit, bigint> = {
  s: 1_000_000_000n,
  ms: 1_000_000n,
  us: 1_000n,
  ns: 1n,
};

/**
 * Timestamp systems that are not Unix epochs. These are the ones people paste
 * from a registry dump, a database column or a log line and cannot decode
 * anywhere else without a lookup table.
 */
export type System = 'unix' | 'filetime' | 'dotnet' | 'cocoa' | 'excel' | 'julian';

export const SYSTEMS: System[] = ['unix', 'filetime', 'dotnet', 'cocoa', 'excel', 'julian'];

export interface SystemSpec {
  id: System;
  label: string;
  /** Short note shown under the picker. */
  hint: string;
  /** Nanoseconds per unit of this system's count. */
  tickNs: bigint;
  /** Nanoseconds from the Unix epoch to this system's epoch (negative = earlier). */
  epochOffsetNs: bigint;
  /** Excel and Julian are fractional days, so they are read as floats. */
  fractional?: boolean;
}

const NS_PER_DAY = 86_400_000_000_000n;

export const SYSTEM_SPECS: Record<System, SystemSpec> = {
  unix: {
    id: 'unix',
    label: 'Unix',
    hint: 'Seconds (or ms/µs/ns) since 1970-01-01 UTC',
    tickNs: 1n, // set by the chosen unit instead
    epochOffsetNs: 0n,
  },
  filetime: {
    id: 'filetime',
    label: 'Windows FILETIME',
    hint: '100-nanosecond ticks since 1601-01-01 UTC',
    tickNs: 100n,
    // 1601-01-01 to 1970-01-01 is 11644473600 seconds.
    epochOffsetNs: -11_644_473_600n * 1_000_000_000n,
  },
  dotnet: {
    id: 'dotnet',
    label: '.NET ticks',
    hint: '100-nanosecond ticks since 0001-01-01',
    tickNs: 100n,
    // 0001-01-01 to 1970-01-01 is 62135596800 seconds.
    epochOffsetNs: -62_135_596_800n * 1_000_000_000n,
  },
  cocoa: {
    id: 'cocoa',
    label: 'Apple / Cocoa',
    hint: 'Seconds since 2001-01-01 UTC',
    tickNs: 1_000_000_000n,
    epochOffsetNs: 978_307_200n * 1_000_000_000n,
  },
  excel: {
    id: 'excel',
    label: 'Excel serial',
    hint: 'Days since 1899-12-30 (the 1900 leap-year bug included)',
    tickNs: NS_PER_DAY,
    // Excel counts from 1899-12-30 because it wrongly treats 1900 as a leap
    // year; using that date as the origin is what makes the arithmetic line up.
    epochOffsetNs: -25_569n * NS_PER_DAY,
    fractional: true,
  },
  julian: {
    id: 'julian',
    label: 'Julian day',
    hint: 'Days since 4713 BC, noon UTC',
    tickNs: NS_PER_DAY,
    epochOffsetNs: -2_440_587n * NS_PER_DAY - NS_PER_DAY / 2n,
    fractional: true,
  },
};

export interface ParsedStamp {
  /** Nanoseconds since the Unix epoch. */
  ns: bigint;
  /** Empty when the parse succeeded: 'empty' | 'nan' | 'range'. */
  error: string;
}

export interface ZoneInfo {
  id: string;
  /** Offset in minutes at the instant asked about, east of UTC. */
  offsetMinutes: number;
  /** Short name at that instant, e.g. "CEST". */
  abbreviation: string;
  /** True when the zone is in daylight saving at that instant. */
  isDst: boolean;
  /** Offset the zone uses outside DST, for the comparison. */
  standardOffsetMinutes: number;
}

/** Widest instant JavaScript's Date can represent, in ms. */
export const MAX_DATE_MS = 8_640_000_000_000_000;
