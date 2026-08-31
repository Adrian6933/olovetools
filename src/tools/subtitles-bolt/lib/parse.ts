// ============================================================================
// Parsers
// ----------------------------------------------------------------------------
// Nine formats in. Two rules apply to all of them:
//
//  1. Nothing is dropped in silence. A block that cannot be read becomes a
//     ParseIssue with its line number, so the UI can say "3 of 500 cues could
//     not be read" instead of quietly handing back 497.
//  2. Everything that a round trip could preserve is preserved — the WebVTT
//     identifier and settings, the ASS style and speaker, the header blocks.
//
// TTML is read with regexes rather than DOMParser on purpose: this module is
// imported by a server-rendered island, and DOMParser does not exist in Node.
// ============================================================================

import type { Cue, Format, ParseIssue, Track } from './model';
import { nextUid, normaliseNewlines, parseTime, sortCues, stripBom } from './model';

// ----------------------------------------------------------------------------
// Detection
// ----------------------------------------------------------------------------

/** Returns null rather than guessing "srt" when nothing matches. */
export function detectFormat(input: string): Format {
  const text = stripBom(input || '').trim();
  if (text === '') return null;

  if (/^WEBVTT/i.test(text)) return 'vtt';
  if (/^\[Script Info\]/im.test(text) || /^\s*Dialogue:\s*\d*,/m.test(text)) return 'ass';
  if (/<tt[\s>]/i.test(text) || /xmlns=["']http:\/\/www\.w3\.org\/ns\/ttml/i.test(text)) return 'ttml';
  if (text.startsWith('[') && /^\s*\[/.test(text)) {
    // Could be LRC or a JSON array; the timestamp tag decides.
    if (/^\s*\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]/m.test(text)) return 'lrc';
    if (/^\s*\[\s*\{/.test(text)) return 'json';
  }
  if (/-->/.test(text)) {
    // Both SRT and VTT use an arrow; the fraction separator tells them apart,
    // and a leading integer index is SRT's fingerprint.
    if (/\d{2}:\d{2}:\d{2},\d{3}\s*-->/.test(text)) return 'srt';
    if (/^\d+\s*\n\s*\d/.test(text)) return 'srt';
    return 'vtt';
  }
  if (/^\d{1,2}:\d{2}:\d{2}\.\d{1,3},\d{1,2}:\d{2}:\d{2}\.\d{1,3}/m.test(text)) return 'sbv';
  if (/^\s*[[{]/.test(text)) return 'json';
  if (/^[^\n,]*,[^\n,]*,/.test(text) && /\d{1,2}:\d{2}/.test(text)) return 'csv';
  return null;
}

// ----------------------------------------------------------------------------
// Shared block splitting
// ----------------------------------------------------------------------------

interface Block {
  lines: string[];
  /** 1-based line number of the block's first line. */
  line: number;
}

function toBlocks(text: string): Block[] {
  const rows = text.split('\n');
  const blocks: Block[] = [];
  let current: string[] = [];
  let start = 1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].trim() === '') {
      if (current.length > 0) {
        blocks.push({ lines: current, line: start });
        current = [];
      }
      start = i + 2;
      continue;
    }
    if (current.length === 0) start = i + 1;
    current.push(rows[i]);
  }
  if (current.length > 0) blocks.push({ lines: current, line: start });
  return blocks;
}

function makeCue(start: number, end: number, lines: string[], extra?: Partial<Cue>): Cue {
  return {
    uid: nextUid(),
    start,
    end,
    lines: lines.map(l => l.replace(/\s+$/, '')),
    ...(extra || {}),
  };
}

/** Records the issue and returns nothing, so callers read as a single line. */
function issue(issues: ParseIssue[], line: number, code: ParseIssue['code'], sample: string): void {
  issues.push({ line, code, sample: sample.trim().slice(0, 80) });
}

// ----------------------------------------------------------------------------
// SRT and WebVTT
// ----------------------------------------------------------------------------

const ARROW = /^(.+?)\s*-->\s*([^\s]+)(?:\s+(.*))?$/;

function parseArrowBlocks(text: string, format: Format): Track {
  const issues: ParseIssue[] = [];
  const cues: Cue[] = [];
  let header = '';
  let body = text;

  if (format === 'vtt') {
    const headerMatch = /^WEBVTT[^\n]*\n/i.exec(body);
    if (headerMatch) {
      header = headerMatch[0].trimEnd();
      body = body.slice(headerMatch[0].length);
    }
  }

  const blocks = toBlocks(body);
  const keptHeaderBlocks: string[] = [];

  for (const block of blocks) {
    // WebVTT metadata blocks: kept verbatim in the header instead of dropped.
    if (format === 'vtt' && /^(NOTE|STYLE|REGION)\b/i.test(block.lines[0])) {
      keptHeaderBlocks.push(block.lines.join('\n'));
      continue;
    }

    let index = 0;
    let identifier = '';

    // An SRT block opens with its number; a VTT block may open with a name.
    if (!block.lines[0].includes('-->')) {
      if (block.lines.length < 2) {
        issue(issues, block.line, 'noTiming', block.lines.join(' '));
        continue;
      }
      identifier = block.lines[0].trim();
      index = 1;
    }

    const arrow = ARROW.exec(block.lines[index]);
    if (!arrow) {
      issue(issues, block.line + index, 'noTiming', block.lines[index]);
      continue;
    }

    const start = parseTime(arrow[1]);
    const end = parseTime(arrow[2]);
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      issue(issues, block.line + index, 'badTiming', block.lines[index]);
      continue;
    }

    const lines = block.lines.slice(index + 1);
    if (lines.length === 0 || lines.join('').trim() === '') {
      issue(issues, block.line, 'emptyText', block.lines.join(' '));
      continue;
    }
    if (end < start) issue(issues, block.line + index, 'reversed', block.lines[index]);

    // SRT numbers are display order, not identity — they get renumbered on the
    // way out — so a purely numeric identifier is not worth keeping.
    const keepId = format === 'vtt' && identifier !== '' && !/^\d+$/.test(identifier);

    cues.push(
      makeCue(start, end, lines, {
        id: keepId ? identifier : undefined,
        settings: format === 'vtt' && arrow[3] ? arrow[3].trim() : undefined,
      })
    );
  }

  if (keptHeaderBlocks.length > 0) {
    header = [header, ...keptHeaderBlocks].filter(Boolean).join('\n\n');
  }
  return { cues, format, header, issues };
}

// ----------------------------------------------------------------------------
// SBV (YouTube)
// ----------------------------------------------------------------------------

function parseSbv(text: string): Track {
  const issues: ParseIssue[] = [];
  const cues: Cue[] = [];
  for (const block of toBlocks(text)) {
    const match = /^([^,]+),(.+)$/.exec(block.lines[0]);
    if (!match) {
      issue(issues, block.line, 'noTiming', block.lines[0]);
      continue;
    }
    const start = parseTime(match[1]);
    const end = parseTime(match[2]);
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      issue(issues, block.line, 'badTiming', block.lines[0]);
      continue;
    }
    const lines = block.lines.slice(1);
    if (lines.join('').trim() === '') {
      issue(issues, block.line, 'emptyText', block.lines[0]);
      continue;
    }
    cues.push(makeCue(start, end, lines));
  }
  return { cues, format: 'sbv', header: '', issues };
}

// ----------------------------------------------------------------------------
// ASS / SSA
// ----------------------------------------------------------------------------

/** Strips the `{\pos(…)}` style override runs; `\N` is a hard line break. */
export function assTextToLines(raw: string): string[] {
  return raw
    .replace(/\{[^}]*\}/g, '')
    .split(/\\N/i)
    .map(l => l.replace(/\\h/g, ' ').trim());
}

function parseAss(text: string): Track {
  const issues: ParseIssue[] = [];
  const cues: Cue[] = [];
  const rows = text.split('\n');
  const headerRows: string[] = [];

  let fields: string[] = null;
  let inEvents = false;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const trimmed = row.trim();

    if (/^\[.*\]$/.test(trimmed)) {
      inEvents = /^\[events\]$/i.test(trimmed);
      headerRows.push(row);
      continue;
    }
    if (!inEvents) {
      headerRows.push(row);
      continue;
    }
    if (/^Format:/i.test(trimmed)) {
      fields = trimmed.slice(7).split(',').map(f => f.trim().toLowerCase());
      headerRows.push(row);
      continue;
    }
    if (!/^Dialogue:/i.test(trimmed)) {
      // Comment: lines and anything else in [Events] are kept, not lost.
      if (trimmed !== '') headerRows.push(row);
      continue;
    }

    // The Text field is last by definition and may itself contain commas, so
    // the split is capped at the field count rather than done greedily.
    const columns = fields || ['layer', 'start', 'end', 'style', 'name', 'marginl', 'marginr', 'marginv', 'effect', 'text'];
    const payload = trimmed.slice(9);
    const parts = payload.split(',');
    const head = parts.slice(0, columns.length - 1);
    const tail = parts.slice(columns.length - 1).join(',');
    const values = [...head, tail];

    const get = (name: string): string => {
      const at = columns.indexOf(name);
      return at === -1 ? '' : (values[at] || '').trim();
    };

    const start = parseTime(get('start'));
    const end = parseTime(get('end'));
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      issue(issues, i + 1, 'badTiming', trimmed);
      continue;
    }
    const lines = assTextToLines(get('text'));
    if (lines.join('').trim() === '') {
      issue(issues, i + 1, 'emptyText', trimmed);
      continue;
    }
    const style = get('style');
    const speaker = get('name');
    cues.push(
      makeCue(start, end, lines, {
        style: style && style !== 'Default' ? style : undefined,
        speaker: speaker || undefined,
      })
    );
  }

  return {
    cues,
    format: 'ass',
    header: headerRows.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
    issues,
  };
}

// ----------------------------------------------------------------------------
// TTML / DFXP
// ----------------------------------------------------------------------------

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&amp;/g, '&');
}

function parseTtml(text: string): Track {
  const issues: ParseIssue[] = [];
  const cues: Cue[] = [];
  const paragraph = /<p\b([^>]*)>([\s\S]*?)<\/p>/gi;
  const attr = (source: string, name: string): string => {
    const m = new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i').exec(source);
    return m ? m[1] : '';
  };

  let match: RegExpExecArray;
  while ((match = paragraph.exec(text)) !== null) {
    const line = text.slice(0, match.index).split('\n').length;
    const attrs = match[1];
    const begin = attr(attrs, 'begin');
    const endRaw = attr(attrs, 'end');
    const durRaw = attr(attrs, 'dur');

    const start = parseTime(begin);
    let end = endRaw ? parseTime(endRaw) : NaN;
    if (!Number.isFinite(end) && durRaw) {
      const d = parseTime(durRaw);
      if (Number.isFinite(d) && Number.isFinite(start)) end = start + d;
    }
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      issue(issues, line, 'badTiming', match[0]);
      continue;
    }

    const lines = decodeEntities(
      match[2]
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
    )
      .split('\n')
      .map(l => l.trim())
      .filter((l, i, arr) => l !== '' || (i > 0 && i < arr.length - 1));

    if (lines.join('').trim() === '') {
      issue(issues, line, 'emptyText', match[0]);
      continue;
    }
    const region = attr(attrs, 'region');
    cues.push(makeCue(start, end, lines, { style: region || undefined, id: attr(attrs, 'xml:id') || undefined }));
  }

  const headerMatch = /^([\s\S]*?)<body\b/i.exec(text);
  return { cues, format: 'ttml', header: headerMatch ? headerMatch[1].trim() : '', issues };
}

// ----------------------------------------------------------------------------
// LRC (lyrics)
// ----------------------------------------------------------------------------

/** Only the last line has no successor, so it gets a nominal three seconds. */
const LRC_TAIL_MS = 3000;

function parseLrc(text: string): Track {
  const issues: ParseIssue[] = [];
  const raw: { start: number; line: string }[] = [];
  const headerRows: string[] = [];
  const rows = text.split('\n');

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.trim() === '') continue;
    // Metadata tags look like [ar:Artist]; timestamps start with a digit.
    if (/^\s*\[[a-z]{2,}:/i.test(row)) {
      headerRows.push(row.trim());
      continue;
    }
    const stamps = row.match(/\[(\d{1,2}:\d{2}(?:[.:]\d{1,3})?)\]/g);
    if (!stamps) {
      issue(issues, i + 1, 'noTiming', row);
      continue;
    }
    const content = row.replace(/\[[^\]]*\]/g, '').trim();
    for (const stamp of stamps) {
      const start = parseTime(stamp.slice(1, -1).replace(':', ':'));
      if (!Number.isFinite(start)) {
        issue(issues, i + 1, 'badTiming', row);
        continue;
      }
      raw.push({ start, line: content });
    }
  }

  raw.sort((a, b) => a.start - b.start);
  const cues: Cue[] = raw.map((entry, i) => {
    const next = raw[i + 1];
    const end = next ? next.start : entry.start + LRC_TAIL_MS;
    return makeCue(entry.start, end, [entry.line]);
  });

  return { cues, format: 'lrc', header: headerRows.join('\n'), issues };
}

// ----------------------------------------------------------------------------
// JSON and CSV
// ----------------------------------------------------------------------------

/** Accepts milliseconds, seconds, or a timestamp string. */
function coerceTime(value: unknown): number {
  if (typeof value === 'number') {
    // A plain number below 10000 is much more likely to be seconds than to be
    // a ten-second cue boundary measured in milliseconds.
    return value < 10000 && !Number.isInteger(value) ? Math.round(value * 1000) : Math.round(value);
  }
  if (typeof value === 'string') return parseTime(value);
  return NaN;
}

function parseJson(text: string): Track {
  const issues: ParseIssue[] = [];
  const cues: Cue[] = [];
  let data: any;
  try {
    data = JSON.parse(text);
  } catch (e) {
    issue(issues, 1, 'unknownBlock', String(e && (e as Error).message));
    return { cues, format: 'json', header: '', issues };
  }
  const list = Array.isArray(data) ? data : Array.isArray(data && data.cues) ? data.cues : [];
  list.forEach((entry: any, i: number) => {
    const start = coerceTime(entry && (entry.start ?? entry.startTime ?? entry.begin));
    const end = coerceTime(entry && (entry.end ?? entry.endTime));
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      issue(issues, i + 1, 'badTiming', JSON.stringify(entry));
      return;
    }
    const textValue = entry.text ?? entry.content ?? '';
    const lines = Array.isArray(entry.lines)
      ? entry.lines.map(String)
      : String(textValue).split('\n');
    if (lines.join('').trim() === '') {
      issue(issues, i + 1, 'emptyText', JSON.stringify(entry));
      return;
    }
    cues.push(makeCue(start, end, lines, { speaker: entry.speaker || undefined }));
  });
  return { cues, format: 'json', header: '', issues };
}

/** Minimal RFC 4180 reader: quoted fields, doubled quotes, embedded newlines. */
function splitCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter(r => r.some(c => c.trim() !== ''));
}

function parseCsv(text: string): Track {
  const issues: ParseIssue[] = [];
  const cues: Cue[] = [];
  const rows = splitCsvRows(text);
  let startAt = 0;
  if (rows.length > 0 && !Number.isFinite(parseTime(rows[0][0]))) startAt = 1; // header row
  for (let i = startAt; i < rows.length; i++) {
    const row = rows[i];
    const start = parseTime(row[0]);
    const end = parseTime(row[1]);
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      issue(issues, i + 1, 'badTiming', row.join(','));
      continue;
    }
    const lines = (row[2] || '').split('\n');
    if (lines.join('').trim() === '') {
      issue(issues, i + 1, 'emptyText', row.join(','));
      continue;
    }
    cues.push(makeCue(start, end, lines, { speaker: row[3] || undefined }));
  }
  return { cues, format: 'csv', header: '', issues };
}

// ----------------------------------------------------------------------------
// Plain transcript
// ----------------------------------------------------------------------------

export interface TranscriptOptions {
  /** Reading speed used to allocate time, in characters per second. */
  cps: number;
  /** Never show a cue for less than this. */
  minMs: number;
  /** Gap inserted between consecutive cues. */
  gapMs: number;
  /** Characters per line before wrapping. */
  lineWidth: number;
}

export const TRANSCRIPT_DEFAULTS: TranscriptOptions = { cps: 17, minMs: 1200, gapMs: 80, lineWidth: 42 };

/** Greedy wrap that never splits a word. */
export function wrapText(text: string, width: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
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
  if (lines.length <= maxLines) return lines;
  // Too long for the allowed line count: keep the first lines and let the rest
  // ride on the last one rather than deleting the words.
  const head = lines.slice(0, maxLines - 1);
  head.push(lines.slice(maxLines - 1).join(' '));
  return head;
}

/**
 * Turns a timing-free transcript into cues by allocating time at a reading
 * speed. It is inventing the timings, and the UI says so — but "I have a
 * transcript and need a starting point" is a real job, and doing it by hand is
 * an afternoon.
 */
export function parseTranscript(text: string, options: TranscriptOptions): Track {
  const opts = { ...TRANSCRIPT_DEFAULTS, ...(options || {}) };
  const cues: Cue[] = [];
  // Split on sentence ends, keeping the punctuation with the sentence.
  const chunks = text
    .split(/\n{2,}/)
    .flatMap(paragraph =>
      paragraph
        .replace(/\n/g, ' ')
        .split(/(?<=[.!?…])\s+|(?<=[。！？])/)
        .map(s => s.trim())
        .filter(Boolean)
    );

  let cursor = 0;
  for (const chunk of chunks) {
    const lines = wrapText(chunk, opts.lineWidth, 2);
    const chars = lines.join('').length;
    const span = Math.max(opts.minMs, Math.round((chars / opts.cps) * 1000));
    cues.push(makeCue(cursor, cursor + span, lines));
    cursor += span + opts.gapMs;
  }
  return { cues, format: 'txt', header: '', issues: [] };
}

// ----------------------------------------------------------------------------
// Entry point
// ----------------------------------------------------------------------------

export function parseTrack(input: string, format: Format, transcript?: TranscriptOptions): Track {
  const text = normaliseNewlines(input || '');
  if (text.trim() === '') return { cues: [], format: format || 'srt', header: '', issues: [] };

  switch (format) {
    case 'srt':
      return parseArrowBlocks(text, 'srt');
    case 'vtt':
      return parseArrowBlocks(text, 'vtt');
    case 'sbv':
      return parseSbv(text);
    case 'ass':
      return parseAss(text);
    case 'ttml':
      return parseTtml(text);
    case 'lrc':
      return parseLrc(text);
    case 'json':
      return parseJson(text);
    case 'csv':
      return parseCsv(text);
    case 'txt':
      return parseTranscript(text, transcript || TRANSCRIPT_DEFAULTS);
    default:
      return { cues: [], format: 'srt', header: '', issues: [] };
  }
}

/** Detects the format and parses in one step; the caller may override either. */
export function readSubtitles(
  input: string,
  requested: Format,
  transcript?: TranscriptOptions
): { track: Track; detected: Format } {
  const detected = detectFormat(input);
  const format = requested || detected || 'srt';
  const track = parseTrack(input, format, transcript);
  // Sorting is not cosmetic: every timing operation and every QC check below
  // assumes chronological order, and plenty of real files are not.
  track.cues = sortCues(track.cues);
  return { track, detected };
}
