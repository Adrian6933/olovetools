// ============================================================================
// Captions built from the engine's own boundary metadata.
//
// These are not guessed from an average reading speed: every cue starts and
// ends on a timestamp the synthesiser reported for that exact render, so the
// SRT lines up with the MP3 to the millisecond.
// ============================================================================
import type { TimelineMark } from '../types';

export interface Cue {
  startMs: number;
  endMs: number;
  text: string;
}

/** Broadcast-ish defaults: two lines, ~42 characters each. */
const MAX_CUE_CHARS = 84;
const MAX_LINE_CHARS = 42;
/** Nobody can read a cue that flashes for 300 ms, so short ones get padded. */
const MIN_CUE_MS = 900;
const MAX_CUE_MS = 6500;

/**
 * Splits a run of words into cues, keeping each one under the character and
 * duration budget. `render` turns a slice of that run back into readable text.
 */
function groupWords(words: TimelineMark[], render: (from: number, to: number) => string): Cue[] {
  const cues: Cue[] = [];
  let start = 0;
  let chars = 0;

  const flush = (end: number) => {
    if (end < start) return;
    cues.push({
      startMs: words[start].t,
      endMs: words[end].t + words[end].d,
      text: render(start, end),
    });
    start = end + 1;
    chars = 0;
  };

  for (let i = 0; i < words.length; i++) {
    const wouldBeChars = chars + words[i].x.length + (i > start ? 1 : 0);
    const wouldBeMs = i > start ? words[i].t + words[i].d - words[start].t : 0;
    if (i > start && (wouldBeChars > MAX_CUE_CHARS || wouldBeMs > MAX_CUE_MS)) {
      flush(i - 1);
      chars = words[i].x.length;
    } else {
      chars = wouldBeChars;
    }
  }
  if (start < words.length) flush(words.length - 1);
  return cues;
}

/**
 * Locates each word inside the sentence text it came from.
 *
 * Word boundaries carry the bare token — "world", never "world." — so joining
 * them with spaces drops every comma and full stop. Mapping them back onto the
 * sentence lets a cue be cut out as a real substring, punctuation and all.
 */
function spanWords(sentence: string, words: TimelineMark[]): Array<[number, number]> {
  const spans: Array<[number, number]> = [];
  let cursor = 0;
  for (const word of words) {
    const at = sentence.indexOf(word.x, cursor);
    if (at < 0) {
      // Normalisation the engine applied that we cannot mirror; fall back to
      // "carry on from where we are" so later words still line up.
      spans.push([cursor, cursor]);
      continue;
    }
    spans.push([at, at + word.x.length]);
    cursor = at + word.x.length;
  }
  return spans;
}

/**
 * Sentences drive the cue boundaries when the engine reported them, because a
 * cue that breaks mid-sentence reads badly. Long sentences fall back to word
 * grouping so no single cue outstays its welcome.
 */
export function buildCues(marks: TimelineMark[]): Cue[] {
  const words = marks.filter(m => m.k === 'w');
  const sentences = marks.filter(m => m.k === 's');
  if (!words.length) return [];
  if (!sentences.length) {
    return normalise(groupWords(words, (from, to) => words.slice(from, to + 1).map(w => w.x).join(' ')));
  }

  const cues: Cue[] = [];
  let cursor = 0;
  for (let s = 0; s < sentences.length; s++) {
    const sentence = sentences[s];
    // The next sentence's start is the only reliable divider: a sentence's own
    // reported duration overlaps the following one, so `t + d` used to hand the
    // next sentence's first word to this cue.
    const limit = sentences[s + 1] ? sentences[s + 1].t : Infinity;
    const owned: TimelineMark[] = [];
    while (cursor < words.length && words[cursor].t < limit) {
      owned.push(words[cursor]);
      cursor++;
    }
    if (!owned.length) continue;

    const text = sentence.x.trim();
    const spanEnd = owned[owned.length - 1].t + owned[owned.length - 1].d;
    if (text.length <= MAX_CUE_CHARS && spanEnd - owned[0].t <= MAX_CUE_MS) {
      cues.push({ startMs: owned[0].t, endMs: spanEnd, text });
      continue;
    }

    const spans = spanWords(text, owned);
    cues.push(
      ...groupWords(owned, (from, to) =>
        // The last slice runs to the end of the sentence so its closing
        // punctuation is not left behind.
        text.slice(spans[from][0], to === owned.length - 1 ? text.length : spans[to][1]).trim()
      )
    );
  }
  // Words after the final sentence boundary (rare, but a truncated tail happens)
  if (cursor < words.length) {
    const tail = words.slice(cursor);
    cues.push(...groupWords(tail, (from, to) => tail.slice(from, to + 1).map(w => w.x).join(' ')));
  }

  return normalise(cues);
}

/** Enforces a readable minimum and keeps cues from overlapping each other. */
function normalise(cues: Cue[]): Cue[] {
  const out = cues.filter(c => c.text.trim().length > 0);
  for (let i = 0; i < out.length; i++) {
    if (out[i].endMs - out[i].startMs < MIN_CUE_MS) out[i].endMs = out[i].startMs + MIN_CUE_MS;
    const next = out[i + 1];
    if (next && out[i].endMs > next.startMs) out[i].endMs = Math.max(out[i].startMs + 200, next.startMs - 40);
  }
  return out;
}

/** Wraps a cue onto at most two balanced lines. */
function wrap(text: string): string {
  if (text.length <= MAX_LINE_CHARS) return text;
  const words = text.split(' ');
  const target = Math.ceil(text.length / 2);
  let line = '';
  let i = 0;
  while (i < words.length && (line + ' ' + words[i]).trim().length <= Math.max(target, MAX_LINE_CHARS)) {
    line = (line ? line + ' ' : '') + words[i];
    i++;
  }
  if (i === 0) return text;
  const rest = words.slice(i).join(' ');
  return rest ? `${line}\n${rest}` : line;
}

function stamp(ms: number, msSeparator: string): string {
  const clamped = Math.max(0, Math.round(ms));
  const h = Math.floor(clamped / 3600000);
  const m = Math.floor((clamped % 3600000) / 60000);
  const s = Math.floor((clamped % 60000) / 1000);
  const milli = clamped % 1000;
  return (
    `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` +
    `${msSeparator}${String(milli).padStart(3, '0')}`
  );
}

export function toSrt(cues: Cue[]): string {
  return (
    cues
      .map((cue, i) => `${i + 1}\n${stamp(cue.startMs, ',')} --> ${stamp(cue.endMs, ',')}\n${wrap(cue.text)}`)
      .join('\n\n') + '\n'
  );
}

export function toVtt(cues: Cue[]): string {
  return (
    'WEBVTT\n\n' +
    cues.map(cue => `${stamp(cue.startMs, '.')} --> ${stamp(cue.endMs, '.')}\n${wrap(cue.text)}`).join('\n\n') +
    '\n'
  );
}

/**
 * Index of the word playing at `timeMs`, or -1. Binary search: this runs on
 * every animation frame against scripts that can hold thousands of words.
 */
export function activeWordIndex(words: TimelineMark[], timeMs: number): number {
  let lo = 0;
  let hi = words.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (words[mid].t <= timeMs) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  if (found < 0) return -1;
  // Past the end of the last word's duration means nothing is highlighted.
  return timeMs <= words[found].t + words[found].d + 120 ? found : -1;
}
