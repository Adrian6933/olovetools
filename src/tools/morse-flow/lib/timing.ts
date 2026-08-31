// ============================================================================
// PARIS timing, and Farnsworth.
// ----------------------------------------------------------------------------
// "PARIS" is fifty units long including the trailing word gap, which is what
// makes one unit 1.2/wpm seconds. The old player had that part right and then
// spent 2 units on a letter gap and 6 on a word gap, because it was adding them
// on top of the 1-unit gap it emitted after every symbol. The standard is 3 and
// 7 *total*, so its letters ran a third too close together.
//
// Farnsworth is the other half. Characters are sent at a speed you want to end
// up reading — 18 wpm, say — while the gaps are stretched to bring the overall
// rate down to something you can actually keep up with. Sending everything slow
// teaches you to count dots; Farnsworth does not.
// ============================================================================

import type { MorseSymbol } from './translate';

export interface Timing {
  /** Character speed: how fast the dits and dahs themselves are sent. */
  wpm: number;
  /** Overall speed. Equal to `wpm` disables Farnsworth. */
  farnsworthWpm: number;
}

export interface Scheduled {
  symbol: MorseSymbol;
  /** Seconds from the start of the message. */
  start: number;
  duration: number;
}

export interface Schedule {
  events: Scheduled[];
  total: number;
  unit: number;
  /** True when the gaps were stretched. */
  farnsworth: boolean;
}

/** One PARIS unit, in seconds. */
export function unitFor(wpm: number): number {
  return 1.2 / Math.max(1, wpm);
}

/**
 * Farnsworth delay, per ARRL: the extra time is spread over the 19 units of
 * inter-character and inter-word space in the word PARIS, in the ratio 3:4.
 */
function farnsworthUnits(wpm: number, overall: number): { letter: number; word: number } {
  if (overall >= wpm) return { letter: 3, word: 7 };
  const ta = (60 * wpm - 37.2 * overall) / (wpm * overall);
  const letterSeconds = (3 * ta) / 19;
  const wordSeconds = (7 * ta) / 19;
  const unit = unitFor(wpm);
  return { letter: letterSeconds / unit, word: wordSeconds / unit };
}

export function schedule(symbols: MorseSymbol[], timing: Timing): Schedule {
  const unit = unitFor(timing.wpm);
  const stretched = farnsworthUnits(timing.wpm, timing.farnsworthWpm);
  const farnsworth = timing.farnsworthWpm < timing.wpm;

  const events: Scheduled[] = [];
  let cursor = 0;

  for (const symbol of symbols) {
    const units =
      symbol.kind === 'letter-gap' ? stretched.letter : symbol.kind === 'word-gap' ? stretched.word : symbol.units;
    const duration = units * unit;
    events.push({ symbol, start: cursor, duration });
    cursor += duration;
  }

  return { events, total: cursor, unit, farnsworth };
}

/** Effective words per minute of a finished schedule, for the readout. */
export function effectiveWpm(total: number, characters: number): number {
  if (total <= 0 || characters <= 0) return 0;
  // A "word" is five characters by the same convention that defines PARIS.
  const words = characters / 5;
  return Math.round((words / (total / 60)) * 10) / 10;
}
