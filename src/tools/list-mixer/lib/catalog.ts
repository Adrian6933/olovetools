// ============================================================================
// The palette: which operations exist, how they are grouped, and what the
// "inverted" variant of each one is.
// ----------------------------------------------------------------------------
// Holding Alt (or right-clicking) a palette button adds the opposite operation:
// sort descending instead of ascending, remove matches instead of keeping them,
// keep the last duplicate instead of the first. One button, both directions —
// which is how the pair fits in a palette that is already nineteen entries long.
// ============================================================================

import type { OpId, Step } from '../types';

export type GroupId = 'order' | 'clean' | 'text' | 'filter' | 'mix';

export const GROUPS: GroupId[] = ['order', 'clean', 'text', 'filter', 'mix'];

export const GROUP_OPS: Record<GroupId, OpId[]> = {
  order: ['sort', 'reverse', 'shuffle', 'sample', 'slice'],
  clean: ['trim', 'collapse', 'removeEmpty', 'dedupe', 'onlyDupes', 'dedupeWords'],
  text: ['case', 'replace', 'affix', 'number', 'unnumber'],
  filter: ['filter', 'length'],
  mix: ['set'],
};

/** Ops whose Alt variant is a genuinely different operation, for the tooltip. */
export const HAS_INVERSE: OpId[] = ['sort', 'dedupe', 'case', 'filter', 'length', 'set', 'slice'];

let counter = 0;
function nextId(op: OpId): string {
  counter += 1;
  return `${op}-${counter}`;
}

/**
 * Builds a step with sensible defaults. `alt` flips it to its opposite where
 * that makes sense; everywhere else it is ignored so the modifier never does
 * something surprising.
 */
export function makeStep(op: OpId, alt: boolean): Step {
  const id = nextId(op);
  switch (op) {
    case 'sort':
      return { id, enabled: true, op: 'sort', kind: 'text', desc: alt, ignoreCase: true };
    case 'reverse':
      return { id, enabled: true, op: 'reverse' };
    case 'shuffle':
      return { id, enabled: true, op: 'shuffle', seed: '' };
    case 'sample':
      return { id, enabled: true, op: 'sample', count: 1, seed: '' };
    case 'slice':
      // Alt: "everything except the first ten" is the other half of this pair.
      return { id, enabled: true, op: 'slice', from: alt ? 11 : 1, to: alt ? 0 : 10 };
    case 'trim':
      return { id, enabled: true, op: 'trim' };
    case 'collapse':
      return { id, enabled: true, op: 'collapse' };
    case 'removeEmpty':
      return { id, enabled: true, op: 'removeEmpty' };
    case 'dedupe':
      return { id, enabled: true, op: 'dedupe', ignoreCase: false, trimmed: true, keepLast: alt };
    case 'onlyDupes':
      return { id, enabled: true, op: 'onlyDupes', ignoreCase: false, trimmed: true };
    case 'dedupeWords':
      return { id, enabled: true, op: 'dedupeWords', ignoreCase: true };
    case 'case':
      return { id, enabled: true, op: 'case', mode: alt ? 'lower' : 'upper' };
    case 'replace':
      return { id, enabled: true, op: 'replace', find: '', replace: '', regex: false, ignoreCase: false };
    case 'affix':
      return { id, enabled: true, op: 'affix', prefix: '', suffix: '' };
    case 'number':
      return { id, enabled: true, op: 'number', start: 1, pad: 0, separator: '. ' };
    case 'unnumber':
      return { id, enabled: true, op: 'unnumber' };
    case 'filter':
      return { id, enabled: true, op: 'filter', remove: alt, pattern: '', regex: false, ignoreCase: true };
    case 'length':
      return { id, enabled: true, op: 'length', max: alt, value: 3 };
    case 'set':
      return { id, enabled: true, op: 'set', mode: alt ? 'diff' : 'intersect', ignoreCase: false, trimmed: true };
    default:
      return { id, enabled: true, op: 'trim' };
  }
}

/** Ops that need the second list to do anything. */
export const NEEDS_LIST_B: OpId[] = ['set'];

/**
 * Recipes offered as one-click starting points. Each entry is a list of
 * `[op, alt]` pairs; the labels live in the dictionary under `recipe<Name>`.
 */
export const RECIPES: { key: string; ops: [OpId, boolean][] }[] = [
  { key: 'tidy', ops: [['trim', false], ['removeEmpty', false], ['dedupe', false]] },
  { key: 'alphabetical', ops: [['trim', false], ['removeEmpty', false], ['dedupe', false], ['sort', false]] },
  { key: 'raffle', ops: [['trim', false], ['removeEmpty', false], ['dedupe', false], ['shuffle', false]] },
  { key: 'onlyRepeated', ops: [['trim', false], ['removeEmpty', false], ['onlyDupes', false]] },
  { key: 'numbered', ops: [['trim', false], ['removeEmpty', false], ['number', false]] },
];

export function buildRecipe(ops: [OpId, boolean][]): Step[] {
  return ops.map(([op, alt]) => makeStep(op, alt));
}
