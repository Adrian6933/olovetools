// ============================================================================
// Text ⇄ items, and the output shapes people actually need.
// ----------------------------------------------------------------------------
// Splitting only on "\n" was the single biggest gap in the old tool: real lists
// arrive as a CSV cell, a comma-separated paste from a spreadsheet, or a
// tab-separated column. And they usually have to leave as something structured
// — a SQL `IN (…)`, a JS array, a Markdown list — which is the presets below.
// ============================================================================

import type { InputFormat, JoinMode, OutputFormat, PresetId, SplitMode } from '../types';

export const SPLIT_MODES: SplitMode[] = ['lines', 'comma', 'semicolon', 'tab', 'spaces', 'custom', 'regex'];
export const JOIN_MODES: JoinMode[] = ['newline', 'comma', 'commaSpace', 'semicolon', 'tab', 'space', 'custom'];

export const DEFAULT_INPUT: InputFormat = { split: 'lines', custom: '' };

export const DEFAULT_OUTPUT: OutputFormat = {
  join: 'newline',
  custom: '',
  itemPrefix: '',
  itemSuffix: '',
  listPrefix: '',
  listSuffix: '',
};

/**
 * Splits text into items. Returns `{ items, error }` rather than throwing so a
 * half-typed regex leaves the previous result on screen instead of a blank
 * panel — and `{value, error}` instead of a union because this project builds
 * without `strictNullChecks`.
 */
export function splitText(text: string, format: InputFormat): { items: string[]; error: string } {
  if (!text) return { items: [], error: '' };

  switch (format.split) {
    case 'lines':
      // Normalise CRLF first: a Windows paste otherwise leaves "\r" glued to
      // every item, which silently breaks dedupe against a Unix-sourced list.
      return { items: text.replace(/\r\n?/g, '\n').split('\n'), error: '' };
    case 'comma':
      return { items: text.split(','), error: '' };
    case 'semicolon':
      return { items: text.split(';'), error: '' };
    case 'tab':
      return { items: text.split('\t'), error: '' };
    case 'spaces':
      return { items: text.split(/\s+/), error: '' };
    case 'custom':
      if (!format.custom) return { items: [text], error: '' };
      return { items: text.split(format.custom), error: '' };
    case 'regex': {
      if (!format.custom) return { items: [text], error: '' };
      try {
        return { items: text.split(new RegExp(format.custom, 'u')), error: '' };
      } catch (err) {
        return { items: [text], error: err instanceof Error ? err.message : 'Invalid pattern' };
      }
    }
    default:
      return { items: text.split('\n'), error: '' };
  }
}

const JOIN_LITERAL: Record<JoinMode, string> = {
  newline: '\n',
  comma: ',',
  commaSpace: ', ',
  semicolon: ';',
  tab: '\t',
  space: ' ',
  custom: '',
};

/** Turns escape sequences typed in a text field into real characters. */
export function unescapeLiteral(raw: string): string {
  return raw
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r')
    .replace(/\\\\/g, '\\');
}

export function joinItems(items: string[], format: OutputFormat): string {
  const separator = format.join === 'custom' ? unescapeLiteral(format.custom) : JOIN_LITERAL[format.join];
  const body =
    format.itemPrefix || format.itemSuffix
      ? items.map(item => format.itemPrefix + item + format.itemSuffix).join(separator)
      : items.join(separator);
  return format.listPrefix + body + format.listSuffix;
}

export interface Preset {
  id: PresetId;
  /** What the preset writes into the output format. */
  output: OutputFormat;
  /** One-item example rendered in the picker so the shape is visible. */
  sample: string;
}

export const PRESETS: Preset[] = [
  { id: 'plain', output: { ...DEFAULT_OUTPUT }, sample: 'red\ngreen' },
  {
    id: 'csv',
    output: { ...DEFAULT_OUTPUT, join: 'commaSpace' },
    sample: 'red, green',
  },
  {
    id: 'quoted',
    output: { ...DEFAULT_OUTPUT, itemPrefix: '"', itemSuffix: '"' },
    sample: '"red"\n"green"',
  },
  {
    id: 'json',
    output: {
      join: 'commaSpace',
      custom: '',
      itemPrefix: '"',
      itemSuffix: '"',
      listPrefix: '[',
      listSuffix: ']',
    },
    sample: '["red", "green"]',
  },
  {
    id: 'sql',
    output: {
      join: 'commaSpace',
      custom: '',
      itemPrefix: "'",
      itemSuffix: "'",
      listPrefix: 'IN (',
      listSuffix: ')',
    },
    sample: "IN ('red', 'green')",
  },
  {
    id: 'js',
    output: {
      join: 'commaSpace',
      custom: '',
      itemPrefix: "'",
      itemSuffix: "'",
      listPrefix: '[',
      listSuffix: ']',
    },
    sample: "['red', 'green']",
  },
  {
    id: 'markdown',
    output: { ...DEFAULT_OUTPUT, itemPrefix: '- ' },
    sample: '- red\n- green',
  },
  {
    id: 'html',
    output: {
      join: 'newline',
      custom: '',
      itemPrefix: '  <li>',
      itemSuffix: '</li>',
      listPrefix: '<ul>\n',
      listSuffix: '\n</ul>',
    },
    sample: '<ul>\n  <li>red</li>\n</ul>',
  },
];

/**
 * Which preset an output format corresponds to, so switching away and back does
 * not silently mark a pristine format as `custom`.
 */
export function matchPreset(format: OutputFormat): PresetId {
  for (const preset of PRESETS) {
    const o = preset.output;
    if (
      o.join === format.join &&
      o.custom === format.custom &&
      o.itemPrefix === format.itemPrefix &&
      o.itemSuffix === format.itemSuffix &&
      o.listPrefix === format.listPrefix &&
      o.listSuffix === format.listSuffix
    ) {
      return preset.id;
    }
  }
  return 'custom';
}

/** JSON-escapes each item when the preset is a JSON array, so quotes survive. */
export function escapeForPreset(items: string[], preset: PresetId): string[] {
  if (preset === 'json') return items.map(item => JSON.stringify(item).slice(1, -1));
  if (preset === 'sql' || preset === 'js') return items.map(item => item.replace(/'/g, "''"));
  if (preset === 'html') {
    return items.map(item => item.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
  }
  return items;
}
