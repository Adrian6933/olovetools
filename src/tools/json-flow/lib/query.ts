// ============================================================================
// A JSONPath subset, evaluated in the page.
// ----------------------------------------------------------------------------
// Supported: $ . name  ['name']  [0]  [-1]  [1:3]  [*]  .*  ..name (recursive)
//            [?(@.field > 10)]  with == != > >= < <= =~ and bare existence.
//
// Deliberately not a full JSONPath: no script expressions, no `eval`. Every
// operator here is implemented by hand precisely so nothing user-typed is ever
// executed.
// ============================================================================

export interface QueryMatch {
  path: string;
  value: unknown;
}

export interface QueryResult {
  ok: boolean;
  matches: QueryMatch[];
  error?: string;
}

type Step =
  | { kind: 'child'; name: string }
  | { kind: 'index'; at: number }
  | { kind: 'slice'; from: number | null; to: number | null }
  | { kind: 'wildcard' }
  | { kind: 'descend'; name: string | null }
  | { kind: 'filter'; field: string; op: string; literal: unknown };

const OPERATORS = ['==', '!=', '>=', '<=', '=~', '>', '<'];

function parseLiteral(text: string): unknown {
  const trimmed = text.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (/^'.*'$/.test(trimmed) || /^".*"$/.test(trimmed)) return trimmed.slice(1, -1);
  return trimmed;
}

function parseFilter(body: string): Step {
  // body is what sat between "?(" and ")"
  const inner = body.replace(/^\s*\(?\s*/, '').replace(/\s*\)?\s*$/, '');
  for (const op of OPERATORS) {
    const at = inner.indexOf(op);
    if (at > 0) {
      const left = inner.slice(0, at).trim();
      const right = inner.slice(at + op.length).trim();
      return { kind: 'filter', field: left.replace(/^@\.?/, ''), op, literal: parseLiteral(right) };
    }
  }
  return { kind: 'filter', field: inner.replace(/^@\.?/, ''), op: 'exists', literal: null };
}

export function compileQuery(expression: string): { steps: Step[] } | { error: string } {
  let text = expression.trim();
  if (!text) return { steps: [] };
  if (text.startsWith('$')) text = text.slice(1);

  const steps: Step[] = [];
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (ch === '.') {
      if (text[i + 1] === '.') {
        i += 2;
        // `..` followed by `[` means "every descendant, then index it".
        if (text[i] === '*' ) {
          steps.push({ kind: 'descend', name: null });
          i++;
          continue;
        }
        const match = /^[A-Za-z_$][\w$-]*/.exec(text.slice(i));
        if (!match) {
          steps.push({ kind: 'descend', name: null });
          continue;
        }
        steps.push({ kind: 'descend', name: match[0] });
        i += match[0].length;
        continue;
      }
      i++;
      if (text[i] === '*') {
        steps.push({ kind: 'wildcard' });
        i++;
        continue;
      }
      const match = /^[^.[\s]+/.exec(text.slice(i));
      if (!match) return { error: `Expected a property name after "." at ${i}.` };
      steps.push({ kind: 'child', name: match[0] });
      i += match[0].length;
      continue;
    }

    if (ch === '[') {
      const close = findClosing(text, i);
      if (close === -1) return { error: 'Unbalanced "[".' };
      const body = text.slice(i + 1, close).trim();
      i = close + 1;

      if (body === '*') {
        steps.push({ kind: 'wildcard' });
        continue;
      }
      if (body.startsWith('?')) {
        steps.push(parseFilter(body.slice(1)));
        continue;
      }
      if (/^-?\d+$/.test(body)) {
        steps.push({ kind: 'index', at: Number(body) });
        continue;
      }
      if (body.includes(':')) {
        const [from, to] = body.split(':');
        steps.push({
          kind: 'slice',
          from: from.trim() === '' ? null : Number(from),
          to: to.trim() === '' ? null : Number(to),
        });
        continue;
      }
      steps.push({ kind: 'child', name: body.replace(/^['"]|['"]$/g, '') });
      continue;
    }

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // A bare leading name ("users[0]") behaves like ".users".
    const match = /^[^.[\s]+/.exec(text.slice(i));
    if (!match) return { error: `Unexpected "${ch}" at ${i}.` };
    steps.push({ kind: 'child', name: match[0] });
    i += match[0].length;
  }

  return { steps };
}

function findClosing(text: string, open: number): number {
  let depth = 0;
  let quote: string | null = null;
  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      continue;
    }
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

const join = (path: string, key: string | number): string =>
  typeof key === 'number'
    ? `${path}[${key}]`
    : /^[A-Za-z_$][\w$]*$/.test(key)
      ? `${path}.${key}`
      : `${path}[${JSON.stringify(key)}]`;

function entriesOf(value: unknown): [string | number, unknown][] {
  if (Array.isArray(value)) return value.map((item, i) => [i, item] as [number, unknown]);
  if (value !== null && typeof value === 'object') return Object.entries(value as Record<string, unknown>);
  return [];
}

function compare(left: unknown, op: string, right: unknown): boolean {
  switch (op) {
    case 'exists':
      return left !== undefined;
    case '==':
      return left === right;
    case '!=':
      return left !== right;
    case '=~':
      try {
        return new RegExp(String(right)).test(String(left ?? ''));
      } catch {
        return false;
      }
    case '>':
      return (left as number) > (right as number);
    case '>=':
      return (left as number) >= (right as number);
    case '<':
      return (left as number) < (right as number);
    case '<=':
      return (left as number) <= (right as number);
    default:
      return false;
  }
}

function readField(value: unknown, field: string): unknown {
  if (value === null || typeof value !== 'object') return undefined;
  if (!field) return value;
  let current: unknown = value;
  for (const part of field.split('.')) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/** Runs the compiled path against a plain value. Never throws. */
export function runQuery(value: unknown, expression: string, limit = 5000): QueryResult {
  const compiled = compileQuery(expression);
  if ('error' in compiled) return { ok: false, matches: [], error: compiled.error };

  let current: QueryMatch[] = [{ path: '$', value }];

  for (const step of compiled.steps) {
    const next: QueryMatch[] = [];

    for (const match of current) {
      switch (step.kind) {
        case 'child': {
          const holder = match.value;
          if (holder !== null && typeof holder === 'object' && step.name in (holder as object)) {
            next.push({ path: join(match.path, step.name), value: (holder as Record<string, unknown>)[step.name] });
          }
          break;
        }
        case 'index': {
          const list = match.value;
          if (!Array.isArray(list)) break;
          const at = step.at < 0 ? list.length + step.at : step.at;
          if (at >= 0 && at < list.length) {
            next.push({ path: join(match.path, at), value: list[at] });
          }
          break;
        }
        case 'slice': {
          const list = match.value;
          if (!Array.isArray(list)) break;
          const from = step.from ?? 0;
          const to = step.to ?? list.length;
          const base = from < 0 ? list.length + from : from;
          list.slice(from, to).forEach((item, offset) => {
            next.push({ path: join(match.path, base + offset), value: item });
          });
          break;
        }
        case 'wildcard': {
          for (const [key, child] of entriesOf(match.value)) {
            next.push({ path: join(match.path, key), value: child });
          }
          break;
        }
        case 'descend': {
          // Depth-first in document order: `$..name` should read top to bottom
          // like the file does, not in whatever order a stack pops.
          const collect = (node: QueryMatch) => {
            for (const [key, child] of entriesOf(node.value)) {
              const childMatch = { path: join(node.path, key), value: child };
              if (step.name === null || key === step.name) next.push(childMatch);
              if (child !== null && typeof child === 'object') collect(childMatch);
            }
          };
          collect(match);
          break;
        }
        case 'filter': {
          for (const [key, child] of entriesOf(match.value)) {
            if (compare(readField(child, step.field), step.op, step.literal)) {
              next.push({ path: join(match.path, key), value: child });
            }
          }
          break;
        }
      }
      if (next.length > limit) break;
    }

    current = next.slice(0, limit);
    if (current.length === 0) break;
  }

  return { ok: true, matches: current };
}
