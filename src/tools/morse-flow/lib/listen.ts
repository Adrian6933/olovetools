// ============================================================================
// Decoding Morse out of a recording.
// ----------------------------------------------------------------------------
// This is the half the tool never had, and the one the low-level API makes
// possible: `decodeAudioData` hands over the raw samples, and from there the
// job is signal processing rather than string manipulation.
//
//   1. find the tone      — a coarse Goertzel sweep over the CW band picks the
//                           carrier instead of assuming 600 Hz.
//   2. build an envelope  — Goertzel at that one frequency, per short window,
//                           gives magnitude over time far more cheaply than an
//                           FFT would, because only one bin is wanted.
//   3. threshold          — Otsu's method on the magnitude histogram, so the
//                           on/off split comes from the recording rather than
//                           from a constant that works on one file.
//   4. measure the units  — cluster the mark and space run lengths. A dit and a
//                           dah differ by 3×, so the split is where the ratio
//                           is, not where a fixed millisecond count says.
//   5. read it            — with the unit known, the timing rules do the rest.
//
// Every intermediate is returned, because "it says NOTHING" needs a reason.
// ============================================================================

import { FROM_CODE } from './alphabet';
import { UNKNOWN } from './translate';

/** Window length for the envelope, in seconds. ~5 ms resolves 40 wpm. */
const WINDOW_SECONDS = 0.005;
/** The band a CW note realistically sits in. */
const MIN_HZ = 250;
const MAX_HZ = 1600;

export interface ListenResult {
  ok: boolean;
  text: string;
  morse: string;
  /** Carrier the sweep settled on. */
  frequency: number;
  /** Unit length in milliseconds, from the run-length clustering. */
  unitMs: number;
  wpm: number;
  /** 0..1: how cleanly the run lengths fell into their two groups. */
  confidence: number;
  /** Envelope, downsampled for the on-screen trace. */
  envelope: number[];
  /** Threshold Otsu picked, on the same scale as `envelope`. */
  threshold: number;
  reason: null | 'no-audio' | 'no-tone' | 'no-elements';
}

const EMPTY: ListenResult = {
  ok: false,
  text: '',
  morse: '',
  frequency: 0,
  unitMs: 0,
  wpm: 0,
  confidence: 0,
  envelope: [],
  threshold: 0,
  reason: 'no-audio',
};

/**
 * Goertzel magnitude for one frequency over one window. Cheaper than an FFT by
 * the ratio of bins wanted to bins computed, which here is 1 to 1024.
 */
function goertzel(samples: Float32Array, from: number, length: number, frequency: number, rate: number): number {
  const k = (2 * Math.PI * frequency) / rate;
  const coefficient = 2 * Math.cos(k);
  let s1 = 0;
  let s2 = 0;
  for (let i = 0; i < length; i += 1) {
    const s0 = samples[from + i] + coefficient * s1 - s2;
    s2 = s1;
    s1 = s0;
  }
  return Math.sqrt(s1 * s1 + s2 * s2 - coefficient * s1 * s2) / length;
}

/** Coarse sweep for the carrier, on a slice of the middle of the recording. */
function findTone(samples: Float32Array, rate: number): number {
  const window = Math.min(samples.length, Math.floor(rate * 0.05));
  const start = Math.max(0, Math.floor(samples.length / 2) - Math.floor(window / 2));
  let best = 0;
  let bestMagnitude = 0;

  for (let hz = MIN_HZ; hz <= MAX_HZ; hz += 10) {
    const magnitude = goertzel(samples, start, window, hz, rate);
    if (magnitude > bestMagnitude) {
      bestMagnitude = magnitude;
      best = hz;
    }
  }
  if (bestMagnitude === 0) return 0;

  // Refine around the winner at 1 Hz.
  let refined = best;
  let refinedMagnitude = bestMagnitude;
  for (let hz = Math.max(MIN_HZ, best - 10); hz <= Math.min(MAX_HZ, best + 10); hz += 1) {
    const magnitude = goertzel(samples, start, window, hz, rate);
    if (magnitude > refinedMagnitude) {
      refinedMagnitude = magnitude;
      refined = hz;
    }
  }
  return refined;
}

/** Otsu's threshold over a 64-bin histogram of the normalised envelope. */
function otsu(values: number[]): number {
  const BINS = 64;
  const max = values.reduce((m, v) => Math.max(m, v), 0);
  if (max <= 0) return 0;

  const histogram = new Array(BINS).fill(0);
  for (const value of values) histogram[Math.min(BINS - 1, Math.floor((value / max) * BINS))] += 1;

  const total = values.length;
  let sum = 0;
  for (let i = 0; i < BINS; i += 1) sum += i * histogram[i];

  let sumBackground = 0;
  let weightBackground = 0;
  let best = 0;
  let bestVariance = -1;

  for (let i = 0; i < BINS; i += 1) {
    weightBackground += histogram[i];
    if (weightBackground === 0) continue;
    const weightForeground = total - weightBackground;
    if (weightForeground === 0) break;
    sumBackground += i * histogram[i];
    const meanBackground = sumBackground / weightBackground;
    const meanForeground = (sum - sumBackground) / weightForeground;
    const variance = weightBackground * weightForeground * (meanBackground - meanForeground) ** 2;
    if (variance > bestVariance) {
      bestVariance = variance;
      best = i;
    }
  }

  return ((best + 0.5) / BINS) * max;
}

interface Run {
  on: boolean;
  windows: number;
}

/**
 * Splits run lengths into short and long around the widest gap in the sorted
 * list. Returns the boundary and how separated the two groups are, which is
 * the honest measure of whether this recording was readable at all.
 */
function splitRuns(lengths: number[]): { boundary: number; confidence: number } {
  if (lengths.length < 2) return { boundary: lengths[0] ?? 1, confidence: 0 };
  const sorted = [...lengths].sort((a, b) => a - b);
  let boundary = sorted[0];
  let widest = 0;
  for (let i = 1; i < sorted.length; i += 1) {
    const gap = sorted[i] - sorted[i - 1];
    if (gap > widest) {
      widest = gap;
      boundary = (sorted[i] + sorted[i - 1]) / 2;
    }
  }
  const span = sorted[sorted.length - 1] - sorted[0];
  return { boundary, confidence: span > 0 ? Math.min(1, widest / span) : 0 };
}

export async function listen(buffer: AudioBuffer): Promise<ListenResult> {
  const rate = buffer.sampleRate;
  const samples = buffer.getChannelData(0);
  if (samples.length < rate * 0.1) return { ...EMPTY, reason: 'no-audio' };

  const frequency = findTone(samples, rate);
  if (!frequency) return { ...EMPTY, reason: 'no-tone' };

  // ---- envelope ----------------------------------------------------------
  const windowLength = Math.max(16, Math.floor(rate * WINDOW_SECONDS));
  const windows = Math.floor(samples.length / windowLength);
  const envelope: number[] = new Array(windows);
  for (let w = 0; w < windows; w += 1) {
    envelope[w] = goertzel(samples, w * windowLength, windowLength, frequency, rate);
  }

  const threshold = otsu(envelope);
  if (threshold <= 0) return { ...EMPTY, frequency, envelope, reason: 'no-tone' };

  // ---- runs --------------------------------------------------------------
  const runs: Run[] = [];
  let currentOn = envelope[0] > threshold;
  let count = 0;
  for (const magnitude of envelope) {
    const on = magnitude > threshold;
    if (on === currentOn) {
      count += 1;
    } else {
      runs.push({ on: currentOn, windows: count });
      currentOn = on;
      count = 1;
    }
  }
  runs.push({ on: currentOn, windows: count });

  // Drop leading and trailing silence; it is not a gap between anything.
  while (runs.length && !runs[0].on) runs.shift();
  while (runs.length && !runs[runs.length - 1].on) runs.pop();
  if (runs.length === 0) return { ...EMPTY, frequency, envelope, threshold, reason: 'no-elements' };

  const marks = runs.filter(r => r.on).map(r => r.windows);
  const spaces = runs.filter(r => !r.on).map(r => r.windows);
  const markSplit = splitRuns(marks);
  const spaceSplit = splitRuns(spaces);

  // The unit is half of "one dit plus the symbol gap that follows it".
  //
  // Measuring dits alone reads high, and always by the same amount: the keying
  // envelope ramps up and down over a few milliseconds, so the first and last
  // windows of every mark fall under the threshold and are counted as silence.
  // Each mark loses that at both ends and each adjacent gap gains it, so a
  // mark-plus-gap pair is exactly two units however far the edges moved.
  //
  // The gaps have to be picked in two passes, because their run lengths fall
  // into three groups (1, 3 and 7 units) and the single widest split lands
  // between 3 and 7 — averaging everything below it would fold the letter gaps
  // in and overestimate the unit by half again.
  const dits = marks.filter(m => m <= markSplit.boundary);
  const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
  const ditWindows = dits.length > 0 ? mean(dits) : Math.min(...marks);
  const symbolGaps = spaces.filter(space => space < ditWindows * 2);

  const unitWindows = symbolGaps.length > 0 ? (ditWindows + mean(symbolGaps)) / 2 : ditWindows;
  const unitMs = unitWindows * WINDOW_SECONDS * 1000;

  // ---- symbols -----------------------------------------------------------
  // Thresholds sit at 2 and 5 units, halfway between the 1/3 and 3/7 the
  // standard defines, which tolerates a hand-sent fist far better than exact
  // comparisons would.
  let morse = '';
  for (const run of runs) {
    const units = run.windows / unitWindows;
    if (run.on) {
      morse += units >= 2 ? '-' : '.';
    } else if (units >= 5) {
      morse += ' / ';
    } else if (units >= 2) {
      morse += ' ';
    }
  }

  const text = morse
    .split(' / ')
    .map(word =>
      word
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(code => FROM_CODE[code] ?? UNKNOWN)
        .join('')
    )
    .join(' ')
    .trim();

  const wpm = unitMs > 0 ? Math.round((1200 / unitMs) * 10) / 10 : 0;
  const confidence = Math.round(Math.min(markSplit.confidence, spaceSplit.confidence || markSplit.confidence) * 100) / 100;

  // The trace is for a 320px-wide graph; a five-minute recording is 60 000
  // windows and none of them would be visible.
  const stride = Math.max(1, Math.floor(envelope.length / 320));
  const trace: number[] = [];
  for (let i = 0; i < envelope.length; i += stride) {
    let peak = 0;
    for (let j = i; j < Math.min(envelope.length, i + stride); j += 1) peak = Math.max(peak, envelope[j]);
    trace.push(peak);
  }

  return {
    ok: text.length > 0,
    text,
    morse: morse.trim(),
    frequency,
    unitMs: Math.round(unitMs * 10) / 10,
    wpm,
    confidence,
    envelope: trace,
    threshold,
    reason: text.length > 0 ? null : 'no-elements',
  };
}

/** Reads a file into an AudioBuffer with a throwaway context. */
export async function bufferFromFile(file: File): Promise<AudioBuffer | null> {
  const Ctor =
    typeof window === 'undefined'
      ? null
      : window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  const context = new Ctor();
  try {
    return await context.decodeAudioData(await file.arrayBuffer());
  } catch {
    return null;
  } finally {
    void context.close();
  }
}
