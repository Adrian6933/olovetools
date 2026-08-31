// ============================================================================
// Subtitle model
// ----------------------------------------------------------------------------
// A cue is not "a string plus two numbers". WebVTT carries an identifier and
// per-cue layout settings, ASS carries a style name and a speaker, TTML carries
// a region — and the old build threw all of it away on the way in, so every
// conversion was lossy in a way nobody could see. Everything that survives a
// round trip lives here.
//
// Text is kept as an array of lines, not one string with newlines in it: line
// count and line length are two of the checks every broadcaster enforces, and
// re-splitting a joined string guesses wrong the moment a line legitimately
// contains a line break character.
// ============================================================================

export type Format = 'srt' | 'vtt' | 'sbv' | 'ass' | 'ttml' | 'lrc' | 'txt' | 'json' | 'csv';

export interface Cue {
  /** Stable key for React and for undo; never renumbered. */
  uid: number;
  /** Milliseconds from the start of the media. */
  start: number;
  end: number;
  /** One entry per rendered line. */
  lines: string[];
  /** WebVTT cue identifier, or the ASS/TTML id. Empty when there is none. */
  id?: string;
  /** WebVTT cue settings verbatim ("align:start position:10%"). */
  settings?: string;
  /** ASS style name, TTML region — whatever the source calls the look. */
  style?: string;
  /** ASS Name field / WebVTT <v Speaker> — who is talking. */
  speaker?: string;
}

/** A block the parser could not read, kept so the UI can show what it lost. */
export interface ParseIssue {
  /** 1-based line number in the source text. */
  line: number;
  /** Dictionary key for the message. */
  code: 'badTiming' | 'noTiming' | 'emptyText' | 'reversed' | 'unknownBlock' | 'truncated';
  /** The offending text, trimmed for display. */
  sample: string;
}

export interface Track {
  cues: Cue[];
  /** What the parser actually read it as. */
  format: Format;
  /**
   * Everything above the first cue that is not a cue: the WEBVTT line and its
   * header blocks, the ASS [Script Info] and [V4+ Styles] sections. Preserved
   * so an ASS → ASS or VTT → VTT round trip is not a downgrade.
   */
  header: string;
  /** Blocks the parser could not read. Reported, never silently dropped. */
  issues: ParseIssue[];
  /** Frames per second declared by the source, when it declares one. */
  fps?: number;
}

export const EMPTY_TRACK: Track = { cues: [], format: 'srt', header: '', issues: [] };

let uidCounter = 1;
export function nextUid(): number {
  return uidCounter++;
}

// ----------------------------------------------------------------------------
// Time
// ----------------------------------------------------------------------------

/**
 * Reads any of the timestamp shapes the formats use:
 *   00:01:02,500   SRT          00:01:02.500  VTT
 *   0:01:02.500    SBV          0:01:02.50    ASS (centiseconds)
 *   01:02.500      VTT short    62.5          seconds (TTML)
 * Returns NaN when it is not a timestamp at all, so callers can tell "broken"
 * from "zero" — the old parser collapsed both to 0.
 */
export function parseTime(raw: string): number {
  const text = (raw || '').trim().replace(',', '.');
  if (text === '') return NaN;

  // Bare seconds, with or without the TTML "s" suffix.
  const seconds = /^(\d+(?:\.\d+)?)s?$/.exec(text);
  if (seconds) return Math.round(parseFloat(seconds[1]) * 1000);

  const match = /^(?:(\d+):)?(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?$/.exec(text);
  if (!match) return NaN;
  const h = match[1] ? parseInt(match[1], 10) : 0;
  const m = parseInt(match[2], 10);
  const s = parseInt(match[3], 10);
  // ASS writes centiseconds; ".5" means half a second, not five milliseconds.
  const fractionText = match[4] || '';
  const fraction = fractionText === '' ? 0 : parseInt(fractionText.padEnd(3, '0'), 10);
  if (m > 59 || s > 59) return NaN;
  return h * 3600000 + m * 60000 + s * 1000 + fraction;
}

function split(ms: number) {
  const clamped = Math.max(0, Math.round(ms));
  return {
    h: Math.floor(clamped / 3600000),
    m: Math.floor((clamped % 3600000) / 60000),
    s: Math.floor((clamped % 60000) / 1000),
    ms: clamped % 1000,
  };
}

const p2 = (n: number) => String(n).padStart(2, '0');
const p3 = (n: number) => String(n).padStart(3, '0');

export function toSrtTime(ms: number): string {
  const t = split(ms);
  return `${p2(t.h)}:${p2(t.m)}:${p2(t.s)},${p3(t.ms)}`;
}

export function toVttTime(ms: number): string {
  const t = split(ms);
  return `${p2(t.h)}:${p2(t.m)}:${p2(t.s)}.${p3(t.ms)}`;
}

export function toSbvTime(ms: number): string {
  const t = split(ms);
  return `${t.h}:${p2(t.m)}:${p2(t.s)}.${p3(t.ms)}`;
}

/** ASS uses one-digit hours and centiseconds. */
export function toAssTime(ms: number): string {
  const t = split(ms);
  return `${t.h}:${p2(t.m)}:${p2(t.s)}.${p2(Math.floor(t.ms / 10))}`;
}

export function toTtmlTime(ms: number): string {
  const t = split(ms);
  return `${p2(t.h)}:${p2(t.m)}:${p2(t.s)}.${p3(t.ms)}`;
}

/** LRC tags are [mm:ss.xx] and have no hour field. */
export function toLrcTime(ms: number): string {
  const clamped = Math.max(0, Math.round(ms));
  const m = Math.floor(clamped / 60000);
  const s = Math.floor((clamped % 60000) / 1000);
  const cs = Math.floor((clamped % 1000) / 10);
  return `${p2(m)}:${p2(s)}.${p2(cs)}`;
}

/**
 * "1h 23m 45s" is English. The unit suffixes come from the dictionary so the
 * nine languages each get their own.
 */
export function toReadable(ms: number, units: { h: string; m: string; s: string }): string {
  const t = split(ms);
  if (t.h > 0) return `${t.h}${units.h} ${p2(t.m)}${units.m} ${p2(t.s)}${units.s}`;
  if (t.m > 0) return `${t.m}${units.m} ${p2(t.s)}${units.s}`;
  return `${t.s}.${p3(t.ms).slice(0, 1)}${units.s}`;
}

/** Timeline scrubber label: always mm:ss or h:mm:ss, never localised. */
export function toClock(ms: number): string {
  const t = split(ms);
  return t.h > 0 ? `${t.h}:${p2(t.m)}:${p2(t.s)}` : `${t.m}:${p2(t.s)}`;
}

// ----------------------------------------------------------------------------
// Text helpers shared by every parser and emitter
// ----------------------------------------------------------------------------

/**
 * A UTF-8 BOM at the head of the file is what makes "^WEBVTT" and the SRT
 * index regex fail on anything exported from a Windows tool. Stripping it is
 * the single highest-value line in this file.
 */
export function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

export function normaliseNewlines(text: string): string {
  return stripBom(text).replace(/\r\n?/g, '\n');
}

export function cueText(cue: Cue): string {
  return cue.lines.join('\n');
}

export function charCount(cue: Cue): number {
  return cue.lines.join('').length;
}

export function duration(cue: Cue): number {
  return Math.max(0, cue.end - cue.start);
}

/** Characters per second — the number every broadcaster's spec is written in. */
export function cps(cue: Cue): number {
  const seconds = duration(cue) / 1000;
  if (seconds <= 0) return Infinity;
  return charCount(cue) / seconds;
}

export function wordCount(cue: Cue): number {
  const text = cue.lines.join(' ').trim();
  if (text === '') return 0;
  return text.split(/\s+/).length;
}

export function totalDuration(cues: Cue[]): number {
  if (cues.length === 0) return 0;
  let last = 0;
  for (const cue of cues) if (cue.end > last) last = cue.end;
  return last;
}

export function sortCues(cues: Cue[]): Cue[] {
  return [...cues].sort((a, b) => a.start - b.start || a.end - b.end);
}
