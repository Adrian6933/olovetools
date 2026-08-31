// ============================================================================
// Key Doctor - keyboard capture model
// ----------------------------------------------------------------------------
// Everything the tool reports is derived from two streams: keydown and keyup,
// keyed by `event.code` (the physical key) rather than `event.key` (what the
// layout produces). That split is what lets the same board be drawn correctly
// for a Spanish, US or Japanese layout.
// ============================================================================

export type LayoutKind = 'ansi' | 'iso' | 'jis';

/** One physical key on the drawn board. */
export interface PhysicalKey {
  /** KeyboardEvent.code, the identity used everywhere else. */
  code: string;
  /** Width in key units (1 = a normal letter key). */
  w: number;
  /** Height in key units. ISO Enter is the only 2-high key we draw. */
  h?: number;
  /** Label used when the browser cannot report the real one. */
  fallback: string;
  /** Second legend (shifted symbol) for the fallback labelling. */
  fallbackShift?: string;
}

export type KeyRow = (PhysicalKey | { spacer: number })[];

export interface KeyBlock {
  id: 'main' | 'nav' | 'numpad';
  rows: KeyRow[];
}

/** A single keydown, with everything the inspector shows. */
export interface KeyRecord {
  key: string;
  code: string;
  keyCode: number;
  /** 0 standard, 1 left, 2 right, 3 numpad. Tells ShiftLeft from ShiftRight. */
  location: number;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
  /** Lock states read with getModifierState, which no plain event field exposes. */
  capsLock: boolean;
  numLock: boolean;
  scrollLock: boolean;
  repeat: boolean;
  /** event.timeStamp: monotonic and sub-millisecond, unlike Date.now(). */
  at: number;
}

/** Per-physical-key tally, the thing the drawn board is coloured from. */
export interface KeyStat {
  downs: number;
  /** Shortest and longest press, in ms. */
  minHold: number;
  maxHold: number;
  /** Still down right now. */
  held: boolean;
  /** Held longer than STUCK_MS without a keyup: a real fault on used boards. */
  stuck: boolean;
  /** Last logical value this physical key produced. */
  lastKey: string;
}

export interface Timing {
  /** Gap between the first repeat and the keydown that started it. */
  repeatDelay: number;
  /** Gap between consecutive repeats. */
  repeatRate: number;
  /** Median dwell time across every press. */
  medianHold: number;
  samples: number;
}

export interface Rollover {
  /** Most keys observed held down at the same time. */
  max: number;
  /** The codes that made up that best simultaneous set. */
  best: string[];
}

export type Mode = 'inspect' | 'test' | 'rollover';

/** A key held this long with no keyup is reported as stuck. */
export const STUCK_MS = 4000;

export const MODIFIER_CODES = [
  'ShiftLeft',
  'ShiftRight',
  'ControlLeft',
  'ControlRight',
  'AltLeft',
  'AltRight',
  'MetaLeft',
  'MetaRight',
];
