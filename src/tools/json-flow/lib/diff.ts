// ============================================================================
// Structural diff between two JSON documents.
// ----------------------------------------------------------------------------
// A line diff on formatted JSON reports "everything changed" the moment a key
// order differs. Comparing values by path is what an API contract review
// actually needs: added / removed / changed / type-changed, per path.
// ============================================================================

export type DiffKind = 'added' | 'removed' | 'changed' | 'type';

export interface DiffEntry {
  kind: DiffKind;
  path: string;
  before?: unknown;
  after?: unknown;
}

export interface DiffSummary {
  entries: DiffEntry[];
  added: number;
  removed: number;
  changed: number;
  /** True when the walk stopped at the entry cap. */
  truncated: boolean;
}

const typeOf = (value: unknown): string => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
};

const child = (path: string, key: string | number): string =>
  typeof key === 'number'
    ? `${path}[${key}]`
    : /^[A-Za-z_$][\w$]*$/.test(key)
      ? `${path}.${key}`
      : `${path}[${JSON.stringify(key)}]`;

export function diffJson(before: unknown, after: unknown, limit = 2000): DiffSummary {
  const entries: DiffEntry[] = [];
  let truncated = false;

  const walk = (a: unknown, b: unknown, path: string) => {
    if (entries.length >= limit) {
      truncated = true;
      return;
    }
    const ta = typeOf(a);
    const tb = typeOf(b);

    if (ta !== tb) {
      entries.push({ kind: 'type', path, before: a, after: b });
      return;
    }

    if (ta === 'array') {
      const arrayA = a as unknown[];
      const arrayB = b as unknown[];
      const max = Math.max(arrayA.length, arrayB.length);
      for (let i = 0; i < max; i++) {
        if (i >= arrayA.length) entries.push({ kind: 'added', path: child(path, i), after: arrayB[i] });
        else if (i >= arrayB.length) entries.push({ kind: 'removed', path: child(path, i), before: arrayA[i] });
        else walk(arrayA[i], arrayB[i], child(path, i));
        if (entries.length >= limit) {
          truncated = true;
          return;
        }
      }
      return;
    }

    if (ta === 'object') {
      const objectA = a as Record<string, unknown>;
      const objectB = b as Record<string, unknown>;
      const keys = new Set([...Object.keys(objectA), ...Object.keys(objectB)]);
      for (const key of keys) {
        if (!(key in objectA)) entries.push({ kind: 'added', path: child(path, key), after: objectB[key] });
        else if (!(key in objectB)) entries.push({ kind: 'removed', path: child(path, key), before: objectA[key] });
        else walk(objectA[key], objectB[key], child(path, key));
        if (entries.length >= limit) {
          truncated = true;
          return;
        }
      }
      return;
    }

    if (a !== b) entries.push({ kind: 'changed', path, before: a, after: b });
  };

  walk(before, after, '$');

  return {
    entries,
    added: entries.filter(e => e.kind === 'added').length,
    removed: entries.filter(e => e.kind === 'removed').length,
    changed: entries.filter(e => e.kind === 'changed' || e.kind === 'type').length,
    truncated,
  };
}

/** Short, single-line rendering of a value for the diff table. */
export function preview(value: unknown, max = 60): string {
  if (value === undefined) return '—';
  const text = typeof value === 'string' ? JSON.stringify(value) : JSON.stringify(value) ?? String(value);
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
