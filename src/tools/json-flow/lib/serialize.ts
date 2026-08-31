// ============================================================================
// Printing the AST back out.
// ----------------------------------------------------------------------------
// Everything here works from the AST rather than from a re-parsed JS value, so
// a document that arrived with 64-bit ids leaves with the same digits it came
// in with. `JSON.stringify(JSON.parse(x))` cannot promise that.
// ============================================================================

import type { IndentMode, JsonNode } from '../types';

export type SortMode = 'none' | 'asc' | 'desc';

export interface PrintOptions {
  indent: IndentMode;
  sort?: SortMode;
  /** Prints one value per line with no indentation at all. */
  minify?: boolean;
  /** Repairs non-JSON literals (NaN, Infinity) into null. */
  strictLiterals?: boolean;
}

const escapeMap: Record<string, string> = {
  '"': '\\"',
  '\\': '\\\\',
  '\b': '\\b',
  '\f': '\\f',
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t',
};

const NEEDS_ESCAPE = /[\\"\u0000-\u001F]/g;

export function quote(text: string): string {
  return `"${text.replace(NEEDS_ESCAPE, ch => escapeMap[ch] || `\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}`)}"`;
}

function numberLiteral(node: JsonNode, strictLiterals: boolean): string {
  const raw = node.raw;
  const value = node.value as number;
  if (!Number.isFinite(value)) return strictLiterals ? 'null' : raw || 'null';
  // The verbatim digits win — that is the whole point of keeping `raw` around.
  if (raw && /^-?\d+$/.test(raw)) return raw;
  if (raw && /^-?\d+\.\d+([eE][+-]?\d+)?$/.test(raw)) return raw;
  return String(value);
}

function childrenOf(node: JsonNode, sort: SortMode): JsonNode[] {
  const children = node.children || [];
  if (node.kind !== 'object' || sort === 'none') return children;
  const sorted = [...children].sort((a, b) => (a.key || '').localeCompare(b.key || ''));
  return sort === 'desc' ? sorted.reverse() : sorted;
}

/** Renders the node (and everything under it) as JSON text. */
export function printJson(node: JsonNode, options: PrintOptions): string {
  const sort = options.sort ?? 'none';
  const strictLiterals = options.strictLiterals ?? true;
  const unit = options.minify ? '' : options.indent === -1 ? '\t' : ' '.repeat(options.indent);
  const nl = options.minify ? '' : '\n';
  const colon = options.minify ? ':' : ': ';

  // An explicit stack, not recursion: a 400-deep document blew the call stack
  // on the previous implementation's `JSON.stringify` replacer path.
  const out: string[] = [];

  const write = (current: JsonNode, pad: string) => {
    switch (current.kind) {
      case 'object': {
        const kids = childrenOf(current, sort);
        if (kids.length === 0) {
          out.push('{}');
          return;
        }
        const inner = pad + unit;
        out.push('{', nl);
        kids.forEach((child, i) => {
          out.push(inner, quote(child.key as string), colon);
          write(child, inner);
          if (i < kids.length - 1) out.push(',');
          out.push(nl);
        });
        out.push(pad, '}');
        return;
      }
      case 'array': {
        const kids = current.children || [];
        if (kids.length === 0) {
          out.push('[]');
          return;
        }
        const inner = pad + unit;
        out.push('[', nl);
        kids.forEach((child, i) => {
          out.push(inner);
          write(child, inner);
          if (i < kids.length - 1) out.push(',');
          out.push(nl);
        });
        out.push(pad, ']');
        return;
      }
      case 'string':
        out.push(quote(current.value as string));
        return;
      case 'number':
        out.push(numberLiteral(current, strictLiterals));
        return;
      case 'boolean':
        out.push(current.value ? 'true' : 'false');
        return;
      default:
        out.push('null');
    }
  };

  write(node, '');
  return out.join('');
}

/** JSON Lines: one top-level array element per line, each minified. */
export function printJsonLines(node: JsonNode): string {
  const items = node.kind === 'array' ? node.children || [] : [node];
  return items.map(child => printJson(child, { indent: 2, minify: true })).join('\n');
}

/** Parses JSON Lines into a single array document. */
export function joinJsonLines(text: string): string {
  const rows = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
  return `[\n${rows.join(',\n')}\n]`;
}

/** True when the text looks like NDJSON rather than one JSON document. */
export function looksLikeJsonLines(text: string): boolean {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return false;
  const objectish = lines.filter(l => (l.startsWith('{') && l.endsWith('}')) || (l.startsWith('[') && l.endsWith(']')));
  return objectish.length === lines.length;
}
