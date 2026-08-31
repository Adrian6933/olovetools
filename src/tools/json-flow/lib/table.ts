// ============================================================================
// JSON ⇄ tabular (CSV / TSV).
// ----------------------------------------------------------------------------
// The old implementation flattened with "_" and then, on the way back, turned
// every "_" into a nesting level — so a plain `first_name` column round-tripped
// into `{ first: { name } }`. Here the separator is explicit and re-nesting is
// something you opt into, so the round trip is lossless by default.
// ============================================================================

import type { JsonNode, TableModel } from '../types';
import { toValue } from './parse';

export type ArrayMode = 'expand' | 'json' | 'join';

export interface FlattenOptions {
  /** Character between path segments. */
  separator: string;
  /** What to do with a nested array: index it, keep it as JSON, or join it. */
  arrayMode: ArrayMode;
  /** Stops runaway column counts on deeply nested documents. */
  maxDepth?: number;
}

export const DEFAULT_FLATTEN: FlattenOptions = { separator: '.', arrayMode: 'json', maxDepth: 12 };

function flattenValue(
  value: unknown,
  prefix: string,
  out: Record<string, unknown>,
  options: FlattenOptions,
  depth: number
) {
  if (value === null || typeof value !== 'object') {
    out[prefix] = value;
    return;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      // The old flattener dropped empty containers entirely, silently losing
      // the column. An empty cell is honest; a missing column is not.
      out[prefix] = '';
      return;
    }
    if (options.arrayMode === 'json') {
      out[prefix] = JSON.stringify(value);
      return;
    }
    if (options.arrayMode === 'join') {
      out[prefix] = value.map(v => (v === null || typeof v !== 'object' ? String(v) : JSON.stringify(v))).join(' | ');
      return;
    }
    if (depth >= (options.maxDepth ?? 12)) {
      out[prefix] = JSON.stringify(value);
      return;
    }
    value.forEach((item, i) => {
      flattenValue(item, `${prefix}${options.separator}${i}`, out, options, depth + 1);
    });
    return;
  }

  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) {
    out[prefix] = '';
    return;
  }
  if (depth >= (options.maxDepth ?? 12)) {
    out[prefix] = JSON.stringify(value);
    return;
  }
  for (const [key, child] of entries) {
    flattenValue(child, prefix ? `${prefix}${options.separator}${key}` : key, out, options, depth + 1);
  }
}

/** Flattens one record into a single row. */
export function flattenRecord(value: unknown, options: FlattenOptions = DEFAULT_FLATTEN): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (value === null || typeof value !== 'object') return { value };
  flattenValue(value, '', out, options, 0);
  return out;
}

/** Turns a document into a column/row model: one row per top-level array item. */
export function buildTable(root: JsonNode, options: FlattenOptions = DEFAULT_FLATTEN): TableModel {
  const value = toValue(root);
  const records = Array.isArray(value) ? value : [value];
  const rows = records.map(record => flattenRecord(record, options));

  // Insertion-ordered union of every row's keys — a ragged array of objects
  // still produces a complete header.
  const columns: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key);
        columns.push(key);
      }
    }
  }

  return { columns, rows, wrapped: !Array.isArray(value) };
}

function escapeCell(value: unknown, delimiter: string): string {
  if (value === undefined || value === null) return '';
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (text.includes(delimiter) || text.includes('"') || /[\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/** Serialises the table model. Excel opens the result without a locale dance. */
export function toDelimited(table: TableModel, delimiter = ','): string {
  const head = table.columns.map(c => escapeCell(c, delimiter)).join(delimiter);
  const body = table.rows.map(row =>
    table.columns.map(col => escapeCell(row[col], delimiter)).join(delimiter)
  );
  return [head, ...body].join('\r\n');
}

/** RFC 4180 reader: handles quotes, embedded newlines and doubled quotes. */
export function parseDelimited(text: string, delimiter = ','): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  let i = 0;

  const pushCell = () => {
    row.push(cell);
    cell = '';
  };
  const pushRow = () => {
    pushCell();
    // A file ending in a newline should not produce a phantom empty record.
    if (row.length > 1 || row[0] !== '') rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      cell += ch;
      i++;
      continue;
    }
    if (ch === '"' && cell === '') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === delimiter) {
      pushCell();
      i++;
      continue;
    }
    if (ch === '\r') {
      i++;
      continue;
    }
    if (ch === '\n') {
      pushRow();
      i++;
      continue;
    }
    cell += ch;
    i++;
  }
  if (cell !== '' || row.length) pushRow();
  return rows;
}

/** Guesses the delimiter from the header line (comma, semicolon or tab). */
export function sniffDelimiter(text: string): string {
  const line = text.split(/\r?\n/, 1)[0] || '';
  const counts: [string, number][] = [
    [',', (line.match(/,/g) || []).length],
    [';', (line.match(/;/g) || []).length],
    ['\t', (line.match(/\t/g) || []).length],
  ];
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : ',';
}

export interface CsvImportOptions {
  delimiter?: string;
  /** Rebuilds nested objects from `a.b` headers. Off by default: `user_id`
   *  must stay `user_id`, which is exactly what the old version got wrong. */
  nest?: boolean;
  /** Converts "12", "true" and "null" into real JSON types. */
  coerce?: boolean;
}

function coerceCell(text: string): unknown {
  if (text === '') return '';
  if (text === 'true') return true;
  if (text === 'false') return false;
  if (text === 'null') return null;
  if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(text)) {
    const asNumber = Number(text);
    // Long numeric ids stay strings rather than losing their last digits.
    if (String(asNumber) === text) return asNumber;
    return text;
  }
  if ((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']'))) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  return text;
}

function assignPath(target: Record<string, unknown>, header: string, value: unknown, nest: boolean) {
  if (!nest || !header.includes('.')) {
    target[header] = value;
    return;
  }
  const parts = header.split('.');
  let node: Record<string, unknown> = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (typeof node[part] !== 'object' || node[part] === null) node[part] = {};
    node = node[part] as Record<string, unknown>;
  }
  node[parts[parts.length - 1]] = value;
}

/** CSV/TSV text → array of records. */
export function delimitedToRecords(text: string, options: CsvImportOptions = {}): Record<string, unknown>[] {
  const delimiter = options.delimiter || sniffDelimiter(text);
  const coerce = options.coerce ?? true;
  const rows = parseDelimited(text.replace(/^﻿/, ''), delimiter);
  if (rows.length === 0) return [];

  const headers = rows[0].map((h, i) => h.trim() || `column${i + 1}`);
  return rows.slice(1).map(cells => {
    const record: Record<string, unknown> = {};
    headers.forEach((header, i) => {
      const raw = cells[i] ?? '';
      assignPath(record, header, coerce ? coerceCell(raw) : raw, options.nest ?? false);
    });
    return record;
  });
}
