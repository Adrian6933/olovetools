// ============================================================================
// The nineteen list operations, as pure functions.
// ----------------------------------------------------------------------------
// Each one takes the items and returns a new array plus how much it changed, so
// the UI can show "-1 284 items" next to the step instead of asking the user to
// eyeball two textareas. Nothing here touches React or the DOM: the same module
// runs on the main thread and inside the worker.
// ============================================================================

import { getCompare } from './collator';
import { makeRng, shuffleInPlace } from './rng';
import type { SetMode, Step } from '../types';

export interface OpContext {
  locale: string;
  /** Items of the second list, already split. Empty when the user has none. */
  listB: string[];
}

export interface OpOutcome {
  items: string[];
  /** Items whose text changed. Reorder/filter steps report 0. */
  edited: number;
  error: string;
}

const ok = (items: string[], edited = 0): OpOutcome => ({ items, edited, error: '' });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** The string two items are compared by when folding case/whitespace. */
function keyOf(item: string, ignoreCase: boolean, trimmed: boolean): string {
  let key = trimmed ? item.trim() : item;
  if (ignoreCase) key = key.toLocaleLowerCase();
  return key;
}

/** Counts how many entries differ between two same-length arrays. */
function countEdits(before: string[], after: string[]): number {
  let edited = 0;
  for (let i = 0; i < after.length; i++) if (before[i] !== after[i]) edited++;
  return edited;
}

function mapItems(items: string[], fn: (item: string) => string): OpOutcome {
  const next = items.map(fn);
  return ok(next, countEdits(items, next));
}

function buildRegExp(pattern: string, ignoreCase: boolean, global: boolean): { re: RegExp; error: string } {
  try {
    return { re: new RegExp(pattern, `u${global ? 'g' : ''}${ignoreCase ? 'i' : ''}`), error: '' };
  } catch (err) {
    return { re: null as any, error: err instanceof Error ? err.message : 'Invalid pattern' };
  }
}

/** Escapes a literal so it can go through the RegExp path unchanged. */
function escapeLiteral(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const WORD = /\p{L}[\p{L}\p{M}'’-]*/gu;

function titleCase(item: string): string {
  return item.toLocaleLowerCase().replace(WORD, word => word.charAt(0).toLocaleUpperCase() + word.slice(1));
}

function sentenceCase(item: string): string {
  const lower = item.toLocaleLowerCase();
  // First letter of the item, and of anything after . ! ? followed by a space.
  return lower.replace(/(^\s*|[.!?]\s+)(\p{L})/gu, (_all, lead, letter) => lead + letter.toLocaleUpperCase());
}

/** Leading `1.` / `12)` / `03 -` that `number` writes and `unnumber` removes. */
const NUMBER_PREFIX = /^\s*\d+\s*[.)\-:\]]?\s+/;

// ---------------------------------------------------------------------------
// Set operations against the second list
// ---------------------------------------------------------------------------

function setOperation(items: string[], b: string[], mode: SetMode, ignoreCase: boolean, trimmed: boolean): OpOutcome {
  if (mode === 'append') return ok(items.concat(b));
  if (mode === 'prepend') return ok(b.concat(items));

  if (mode === 'interleave') {
    const out: string[] = [];
    const longest = Math.max(items.length, b.length);
    for (let i = 0; i < longest; i++) {
      if (i < items.length) out.push(items[i]);
      if (i < b.length) out.push(b[i]);
    }
    return ok(out);
  }

  const bKeys = new Set<string>();
  for (const item of b) bKeys.add(keyOf(item, ignoreCase, trimmed));

  if (mode === 'intersect') {
    return ok(items.filter(item => bKeys.has(keyOf(item, ignoreCase, trimmed))));
  }
  if (mode === 'diff') {
    return ok(items.filter(item => !bKeys.has(keyOf(item, ignoreCase, trimmed))));
  }

  const aKeys = new Set<string>();
  for (const item of items) aKeys.add(keyOf(item, ignoreCase, trimmed));

  if (mode === 'symdiff') {
    const onlyA = items.filter(item => !bKeys.has(keyOf(item, ignoreCase, trimmed)));
    const onlyB = b.filter(item => !aKeys.has(keyOf(item, ignoreCase, trimmed)));
    return ok(onlyA.concat(onlyB));
  }

  // union: A, then the entries of B that A does not already contain.
  const seen = new Set(aKeys);
  const out = items.slice();
  for (const item of b) {
    const key = keyOf(item, ignoreCase, trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return ok(out);
}

// ---------------------------------------------------------------------------
// The dispatcher
// ---------------------------------------------------------------------------

export function runStep(items: string[], step: Step, ctx: OpContext): OpOutcome {
  switch (step.op) {
    case 'sort': {
      const next = items.slice();
      if (step.kind === 'length') {
        // Length ties fall back to text order, otherwise the result looks
        // shuffled inside each length bucket on every re-run.
        const compare = getCompare(ctx.locale, false, step.ignoreCase);
        next.sort((a, b) => a.length - b.length || compare(a, b));
      } else {
        const compare = getCompare(ctx.locale, step.kind === 'numeric', step.ignoreCase);
        next.sort(compare);
      }
      if (step.desc) next.reverse();
      return ok(next);
    }

    case 'reverse':
      return ok(items.slice().reverse());

    case 'shuffle': {
      const next = items.slice();
      shuffleInPlace(next, makeRng(step.seed));
      return ok(next);
    }

    case 'dedupe': {
      const seen = new Set<string>();
      if (!step.keepLast) {
        const out: string[] = [];
        for (const item of items) {
          const key = keyOf(item, step.ignoreCase, step.trimmed);
          if (seen.has(key)) continue;
          seen.add(key);
          out.push(item);
        }
        return ok(out);
      }
      // Keep the last occurrence: walk backwards, then restore the order.
      const out: string[] = [];
      for (let i = items.length - 1; i >= 0; i--) {
        const key = keyOf(items[i], step.ignoreCase, step.trimmed);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(items[i]);
      }
      return ok(out.reverse());
    }

    case 'onlyDupes': {
      const counts = new Map<string, number>();
      for (const item of items) {
        const key = keyOf(item, step.ignoreCase, step.trimmed);
        counts.set(key, (counts.get(key) || 0) + 1);
      }
      const emitted = new Set<string>();
      const out: string[] = [];
      for (const item of items) {
        const key = keyOf(item, step.ignoreCase, step.trimmed);
        if ((counts.get(key) || 0) < 2 || emitted.has(key)) continue;
        emitted.add(key);
        out.push(item);
      }
      return ok(out);
    }

    case 'removeEmpty':
      return ok(items.filter(item => item.trim() !== ''));

    case 'trim':
      return mapItems(items, item => item.trim());

    case 'collapse':
      return mapItems(items, item => item.replace(/\s+/g, ' ').trim());

    case 'case': {
      if (step.mode === 'upper') return mapItems(items, item => item.toLocaleUpperCase());
      if (step.mode === 'lower') return mapItems(items, item => item.toLocaleLowerCase());
      if (step.mode === 'title') return mapItems(items, titleCase);
      return mapItems(items, sentenceCase);
    }

    case 'dedupeWords':
      return mapItems(items, item => {
        const words = item.split(/(\s+)/);
        const seen = new Set<string>();
        const out: string[] = [];
        for (const token of words) {
          if (/^\s*$/.test(token)) {
            if (out.length > 0) out.push(token);
            continue;
          }
          const key = step.ignoreCase ? token.toLocaleLowerCase() : token;
          if (seen.has(key)) {
            // Drop the separator we just pushed for the removed word.
            if (out.length > 0 && /^\s+$/.test(out[out.length - 1])) out.pop();
            continue;
          }
          seen.add(key);
          out.push(token);
        }
        return out.join('').trim();
      });

    case 'filter': {
      if (!step.pattern) return ok(items);
      const source = step.regex ? step.pattern : escapeLiteral(step.pattern);
      const built = buildRegExp(source, step.ignoreCase, false);
      if (built.error) return { items, edited: 0, error: built.error };
      return ok(items.filter(item => built.re.test(item) !== step.remove));
    }

    case 'length': {
      const value = Math.max(0, step.value | 0);
      return ok(items.filter(item => (step.max ? item.length <= value : item.length >= value)));
    }

    case 'slice': {
      // 1-based and inclusive, because that is how the numbers next to the
      // items read. `to = 0` means "to the end".
      const from = Math.max(1, step.from | 0);
      const to = step.to > 0 ? step.to | 0 : items.length;
      if (to < from) return ok([]);
      return ok(items.slice(from - 1, to));
    }

    case 'sample': {
      const count = Math.max(0, step.count | 0);
      if (count >= items.length) {
        const all = items.slice();
        shuffleInPlace(all, makeRng(step.seed));
        return ok(all);
      }
      const pool = items.slice();
      const rng = makeRng(step.seed);
      const out: string[] = [];
      // Partial Fisher-Yates: O(count), no bias, no repeats.
      for (let i = 0; i < count; i++) {
        const j = i + rng.int(pool.length - i);
        const swap = pool[i];
        pool[i] = pool[j];
        pool[j] = swap;
        out.push(pool[i]);
      }
      return ok(out);
    }

    case 'replace': {
      if (!step.find) return ok(items);
      const source = step.regex ? step.find : escapeLiteral(step.find);
      const built = buildRegExp(source, step.ignoreCase, true);
      if (built.error) return { items, edited: 0, error: built.error };
      // `$1` backreferences are useful with regex on, and a literal surprise
      // with regex off, so they are neutralised in literal mode.
      const replacement = step.regex ? step.replace : step.replace.replace(/\$/g, '$$$$');
      return mapItems(items, item => item.replace(built.re, replacement));
    }

    case 'affix':
      if (!step.prefix && !step.suffix) return ok(items);
      return mapItems(items, item => step.prefix + item + step.suffix);

    case 'number': {
      const start = step.start | 0;
      const pad = Math.max(0, Math.min(12, step.pad | 0));
      const separator = step.separator === '' ? '. ' : step.separator;
      const next = items.map((item, index) => String(start + index).padStart(pad, '0') + separator + item);
      return ok(next, countEdits(items, next));
    }

    case 'unnumber':
      return mapItems(items, item => item.replace(NUMBER_PREFIX, ''));

    case 'set':
      return setOperation(items, ctx.listB, step.mode, step.ignoreCase, step.trimmed);

    default:
      return ok(items);
  }
}
