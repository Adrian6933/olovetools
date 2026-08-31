// ============================================================================
// Timing operations
// ----------------------------------------------------------------------------
// The half of the job the old build did not do at all. Converting SRT to VTT
// is a five-minute problem; subtitles that start right and drift a second by
// the end of the film is the one people actually search for, and it is always
// the same cause — a file authored at one frame rate played back at another.
//
// Every operation returns a new cue array. Nothing mutates, so undo is a
// pointer swap rather than a deep copy.
// ============================================================================

import type { Cue } from './model';
import { sortCues } from './model';

/** The rates that actually collide in the wild. */
export const FRAME_RATES = [23.976, 24, 25, 29.97, 30, 48, 50, 59.94, 60];

/** Milliseconds, positive moves later. */
export function shift(cues: Cue[], deltaMs: number): Cue[] {
  if (deltaMs === 0) return cues;
  return cues.map(cue => ({
    ...cue,
    // Clamping at zero rather than going negative: a negative timestamp is not
    // representable in any of the nine formats, and players treat it as 0
    // anyway — but the cue must not end before it starts.
    start: Math.max(0, cue.start + deltaMs),
    end: Math.max(Math.max(0, cue.start + deltaMs), cue.end + deltaMs),
  }));
}

/** Multiplies every timestamp; `anchorMs` stays where it is. */
export function scale(cues: Cue[], factor: number, anchorMs = 0): Cue[] {
  if (!Number.isFinite(factor) || factor <= 0 || factor === 1) return cues;
  const at = (ms: number) => Math.max(0, Math.round(anchorMs + (ms - anchorMs) * factor));
  return cues.map(cue => ({ ...cue, start: at(cue.start), end: at(cue.end) }));
}

/**
 * Frame-rate conversion. A file authored for `from` fps and played at `to` fps
 * runs at the wrong speed by exactly from/to, so that is the factor.
 */
export function convertFrameRate(cues: Cue[], from: number, to: number): Cue[] {
  if (!from || !to || from === to) return cues;
  return scale(cues, from / to);
}

/**
 * Two-point linear resync: you know where two cues should actually land, and
 * everything between and around them follows. This fixes both a constant
 * offset and a drift in one operation, which is what a frame-rate mismatch
 * plus a trimmed intro looks like in practice.
 */
export function resync(cues: Cue[], fromA: number, toA: number, fromB: number, toB: number): Cue[] {
  const span = fromB - fromA;
  if (span === 0) return shift(cues, toA - fromA);
  const factor = (toB - toA) / span;
  if (!Number.isFinite(factor) || factor <= 0) return cues;
  const at = (ms: number) => Math.max(0, Math.round(toA + (ms - fromA) * factor));
  return cues.map(cue => ({ ...cue, start: at(cue.start), end: at(cue.end) }));
}

/** Rounds every timestamp onto a frame boundary. */
export function snapToFrames(cues: Cue[], fps: number): Cue[] {
  if (!fps || fps <= 0) return cues;
  const frame = 1000 / fps;
  const at = (ms: number) => Math.round(Math.round(ms / frame) * frame);
  return cues.map(cue => ({ ...cue, start: at(cue.start), end: at(cue.end) }));
}

export interface DurationRules {
  minMs: number;
  maxMs: number;
  /** Minimum blank between consecutive cues. */
  gapMs: number;
}

export const DURATION_DEFAULTS: DurationRules = { minMs: 833, maxMs: 7000, gapMs: 80 };

/**
 * Enforces minimum and maximum on-screen time.
 * A cue is extended forwards, never backwards, and never past the next cue's
 * start minus the required gap — extending backwards would make it appear
 * before the line is spoken, which is worse than a short cue.
 */
export function enforceDurations(cues: Cue[], rules: DurationRules): Cue[] {
  const sorted = sortCues(cues);
  return sorted.map((cue, i) => {
    let end = cue.end;
    const span = end - cue.start;
    if (span > rules.maxMs) end = cue.start + rules.maxMs;
    if (span < rules.minMs) {
      const next = sorted[i + 1];
      const ceiling = next ? next.start - rules.gapMs : Infinity;
      end = Math.min(cue.start + rules.minMs, Math.max(cue.end, ceiling));
    }
    return end === cue.end ? cue : { ...cue, end };
  });
}

/**
 * Removes overlaps by pulling the earlier cue's end back to the later cue's
 * start minus the gap. Cues that would collapse to nothing are left alone and
 * reported by the QC pass instead of being silently deleted.
 */
export function fixOverlaps(cues: Cue[], gapMs: number): Cue[] {
  const sorted = sortCues(cues);
  const out = [...sorted];
  for (let i = 0; i < out.length - 1; i++) {
    const current = out[i];
    const next = out[i + 1];
    const ceiling = next.start - gapMs;
    if (current.end > ceiling && ceiling > current.start) {
      out[i] = { ...current, end: ceiling };
    }
  }
  return out;
}

/**
 * A gap too small to read as a gap is a flicker, so it gets removed — but
 * "removed" means opening it to the required minimum, not closing it to zero.
 * Snapping to zero is what made the repair pass undo the separation
 * `fixOverlaps` had just created, leaving the checker flagging a 0 ms gap on a
 * file it had supposedly just fixed. With `minGapMs` at 0 this still closes the
 * gap completely, which is right for specs that do not require one.
 */
export function closeShortGaps(cues: Cue[], thresholdMs: number, minGapMs = 0): Cue[] {
  const sorted = sortCues(cues);
  const out = [...sorted];
  for (let i = 0; i < out.length - 1; i++) {
    const next = out[i + 1];
    const gap = next.start - out[i].end;
    if (gap <= 0 || gap >= thresholdMs) continue;
    const end = next.start - minGapMs;
    if (end > out[i].start) out[i] = { ...out[i], end };
  }
  return out;
}

/** Drops cues that fall entirely outside a range, and trims those that straddle it. */
export function trimRange(cues: Cue[], fromMs: number, toMs: number): Cue[] {
  const out: Cue[] = [];
  for (const cue of cues) {
    if (cue.end <= fromMs || cue.start >= toMs) continue;
    out.push({ ...cue, start: Math.max(cue.start, fromMs), end: Math.min(cue.end, toMs) });
  }
  // Re-based so the first surviving cue keeps its distance from the new zero.
  return out.map(cue => ({ ...cue, start: cue.start - fromMs, end: cue.end - fromMs }));
}

// ----------------------------------------------------------------------------
// Text operations
// ----------------------------------------------------------------------------

/** Removes every markup tag, for a target that cannot render any. */
export function stripTags(cues: Cue[]): Cue[] {
  return cues.map(cue => ({
    ...cue,
    lines: cue.lines.map(l => l.replace(/<[^>]+>/g, '').replace(/\{[^}]*\}/g, '').replace(/\s{2,}/g, ' ').trim()),
  }));
}

/**
 * Rewraps to at most `maxLines` lines of `width` characters, balanced.
 * "Balanced" matters: a 40/4 split reads worse than 22/22 even though both fit,
 * and it is the note every subtitling style guide opens with.
 */
export function rewrap(cues: Cue[], width: number, maxLines: number): Cue[] {
  return cues.map(cue => ({ ...cue, lines: balance(cue.lines.join(' ').replace(/\s{2,}/g, ' ').trim(), width, maxLines) }));
}

export function balance(text: string, width: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  if (text.length <= width) return [text];

  // Try every line count from 2 up to the maximum and keep the first that fits,
  // splitting as evenly as the word boundaries allow.
  for (let count = 2; count <= maxLines; count++) {
    const target = Math.ceil(text.length / count);
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      const candidate = current === '' ? word : `${current} ${word}`;
      if (current !== '' && candidate.length > target && lines.length < count - 1) {
        lines.push(current);
        current = word;
      } else current = candidate;
    }
    if (current !== '') lines.push(current);
    if (lines.length <= count && lines.every(l => l.length <= width)) return lines;
  }

  // Nothing fits: greedy wrap and let the caller's QC flag the long lines.
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current === '' ? word : `${current} ${word}`;
    if (candidate.length <= width || current === '') current = candidate;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current !== '') lines.push(current);
  return lines;
}

/** Renumbers nothing (SRT indices are generated on emit) but re-sorts and de-dupes. */
export function tidy(cues: Cue[]): Cue[] {
  const sorted = sortCues(cues);
  const out: Cue[] = [];
  for (const cue of sorted) {
    const previous = out[out.length - 1];
    const identical =
      previous && previous.start === cue.start && previous.end === cue.end &&
      previous.lines.join('\n') === cue.lines.join('\n');
    if (!identical) out.push(cue);
  }
  return out;
}
