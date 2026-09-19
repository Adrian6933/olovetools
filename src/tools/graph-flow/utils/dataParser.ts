import type { DataSet, Series } from '../types';

export type { DataSet, Series };

/** Beyond this a chart stops being readable and the browser starts to crawl. */
export const MAX_ROWS = 5000;
/** Refused outright — a spreadsheet this big is not a chart, it's a database. */
export const MAX_FILE_BYTES = 25 * 1024 * 1024;

export interface ParseResult {
  data: DataSet;
  /** Rows dropped because they exceeded MAX_ROWS. */
  truncated: number;
  /** Cells that did not contain a recognisable number and were read as 0. */
  coerced: number;
  delimiter: string;
}

/**
 * Splits one line, honouring RFC-4180 quoting: a doubled quote inside a quoted
 * field is a literal quote. The previous `inQuotes = !inQuotes` toggle silently
 * ate those, turning `"a""b"` into `ab`.
 */
function splitLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      out.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

/** Picks the delimiter that yields the most consistent column count. */
function detectDelimiter(lines: string[]): string {
  const candidates = [',', ';', '\t', '|'];
  let best = ',';
  let bestScore = -1;

  for (const d of candidates) {
    const counts = lines.slice(0, 20).map(l => splitLine(l, d).length);
    if (counts.length === 0) continue;
    const cols = counts[0];
    if (cols < 2) continue;
    // Reward many columns, punish rows that disagree with the header.
    const consistent = counts.filter(c => c === cols).length / counts.length;
    const score = cols * consistent;
    if (score > bestScore) {
      bestScore = score;
      best = d;
    }
  }
  return best;
}

/**
 * Reads a number written in any of the conventions a spreadsheet exports.
 *
 * The old implementation stripped every non-digit with a regex, which turned
 * the European `1.234,56` into `1.23456` — wrong by three orders of magnitude,
 * silently, on every CSV exported in Spain, France or Germany.
 *
 * Returns `null` when there is no number at all, so the caller can count how
 * many cells it had to fall back on instead of pretending they were zeroes.
 */
export function parseNumber(raw: string, decimalMark?: ',' | '.'): number | null {
  let s = raw.trim();
  if (!s) return null;

  // Parentheses are accountancy notation for negatives: (1,234) === -1234
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }

  // Drop currency symbols, spaces (incl. NBSP/thin space thousands separators)
  // and percent signs, but keep digits, separators and the sign.
  s = s.replace(/[\s   ]/g, '').replace(/[^\d.,'\-+eE]/g, '');
  if (!s || !/\d/.test(s)) return null;

  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');

  if (lastComma > -1 && lastDot > -1) {
    // Both present: whichever comes last is the decimal mark.
    if (lastComma > lastDot) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
  } else if (lastComma > -1) {
    const after = s.length - lastComma - 1;
    // "1,234" and "1,234,567" are thousands groups; "1,5" and "1,234567" are decimals.
    const groups = s.split(',');
    const looksGrouped = groups.length > 1 && groups.slice(1).every(g => g.length === 3);
    s = looksGrouped && after === 3 ? s.replace(/,/g, '') : s.replace(',', '.');
  } else if (lastDot > -1) {
    const groups = s.split('.');
    // Un solo punto con tres cifras detras ("1.100") es ambiguo: mil cien o
    // uno coma uno. Si el resto del archivo usa coma decimal, es de miles.
    const minGroups = decimalMark === ',' ? 2 : 3;
    const looksGrouped = groups.length >= minGroups && groups.slice(1).every(g => g.length === 3);
    if (looksGrouped) s = s.replace(/\./g, '');
  }

  s = s.replace(/'/g, ''); // Swiss thousands separator

  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}

/**
 * La convención de todo el archivo, sacada de las celdas que no dejan duda:
 * "1.234,5" o "12,75" dicen coma decimal; "1,234.5" o "12.75" dicen punto.
 * Sirve para desempatar las que si la dejan, como "1.100".
 */
export function detectDecimalMark(cells: string[]): ',' | '.' | undefined {
  let comma = 0;
  let dot = 0;
  for (const raw of cells) {
    const s = raw.replace(/[^\d.,]/g, '');
    if (/\.\d{3},\d/.test(s) || /^\d*,\d{1,2}$/.test(s) || /,\d{4,}$/.test(s)) comma++;
    else if (/,\d{3}\.\d/.test(s) || /^\d*\.\d{1,2}$/.test(s) || /\.\d{4,}$/.test(s)) dot++;
  }
  if (comma > dot) return ',';
  if (dot > comma) return '.';
  return undefined;
}

/**
 * Parses a delimited text file into a DataSet: first row is headers, first
 * column is labels, remaining columns become series.
 *
 * Columns whose every cell fails to parse as a number are dropped rather than
 * charted as a flat row of zeroes.
 */
export function parseDelimited(text: string): ParseResult {
  // Strip a UTF-8 BOM — Excel puts one on every CSV it writes and it would
  // otherwise become part of the first header name.
  const clean = text.replace(/^﻿/, '');

  const lines = clean
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length < 2) {
    throw new Error('TOO_FEW_ROWS');
  }

  const delimiter = detectDelimiter(lines);
  const headers = splitLine(lines[0], delimiter);

  if (headers.length < 2) {
    throw new Error('TOO_FEW_COLUMNS');
  }

  const seriesNames = headers.slice(1).map((h, i) => h || `Series ${i + 1}`);
  const labels: string[] = [];
  const columns: number[][] = seriesNames.map(() => []);
  const parsedCount: number[] = seriesNames.map(() => 0);
  const coercedCount: number[] = seriesNames.map(() => 0);

  const limit = Math.min(lines.length, MAX_ROWS + 1);
  const decimalMark = detectDecimalMark(lines.slice(1, limit).flatMap(l => splitLine(l, delimiter).slice(1)));

  for (let i = 1; i < limit; i++) {
    const cols = splitLine(lines[i], delimiter);
    if (cols.length < 2) continue;

    labels.push(cols[0] || `#${labels.length + 1}`);
    for (let j = 0; j < seriesNames.length; j++) {
      const n = parseNumber(cols[j + 1] ?? '', decimalMark);
      if (n === null) {
        coercedCount[j]++;
        columns[j].push(0);
      } else {
        parsedCount[j]++;
        columns[j].push(n);
      }
    }
  }

  if (labels.length === 0) throw new Error('NO_ROWS');

  const series: Series[] = [];
  let coerced = 0;
  for (let j = 0; j < seriesNames.length; j++) {
    // A column with no parseable cell at all is text (a second label column,
    // a notes field); charting it as zeroes only adds noise. Its cells are not
    // counted as coerced either — the column is gone, so warning about the
    // zeroes it would have contributed only confuses.
    if (parsedCount[j] === 0) continue;
    coerced += coercedCount[j];
    series.push({ name: seriesNames[j], values: columns[j] });
  }

  if (series.length === 0) throw new Error('NO_NUMERIC_COLUMNS');

  return {
    data: { labels, series },
    truncated: Math.max(0, lines.length - 1 - MAX_ROWS),
    coerced,
    delimiter,
  };
}

/** Serialises back to CSV, quoting anything that needs it. */
export function datasetToCSV(data: DataSet): string {
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const header = ['Label', ...data.series.map(s => esc(s.name))].join(',');
  const rows = data.labels.map((label, i) =>
    [esc(label), ...data.series.map(s => String(s.values[i] ?? 0))].join(',')
  );
  return [header, ...rows].join('\n');
}

/** Structural clone so presets and history entries never share arrays. */
export function cloneDataSet(data: DataSet): DataSet {
  return {
    labels: [...data.labels],
    series: data.series.map(s => ({ ...s, values: [...s.values] })),
  };
}

/** An empty 3×2 grid for people who want to type their numbers straight in. */
export function emptyDataSet(): DataSet {
  return {
    labels: ['A', 'B', 'C'],
    series: [{ name: 'Series 1', values: [0, 0, 0] }],
  };
}
