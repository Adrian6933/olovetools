// ============================================================================
// Undo/redo that stores edits, not documents.
// ----------------------------------------------------------------------------
// Keeping a snapshot per step is what makes editors eat hundreds of megabytes:
// 60 undo levels on a 4 MB payload is 240 MB of retained strings. Here each
// step keeps only the characters that actually changed, found by trimming the
// common prefix and suffix — pressing Beautify on a 4 MB document that only
// gains whitespace stores kilobytes, and typing one character stores one.
// ============================================================================

import type { TextPatch } from '../types';

/** Smallest replacement that turns `before` into `after`. */
export function makePatch(before: string, after: string): TextPatch | null {
  if (before === after) return null;

  const max = Math.min(before.length, after.length);
  let start = 0;
  while (start < max && before.charCodeAt(start) === after.charCodeAt(start)) start++;

  let end = 0;
  while (
    end < max - start &&
    before.charCodeAt(before.length - 1 - end) === after.charCodeAt(after.length - 1 - end)
  ) {
    end++;
  }

  return {
    at: start,
    removed: before.slice(start, before.length - end),
    inserted: after.slice(start, after.length - end),
  };
}

export function applyPatch(text: string, patch: TextPatch): string {
  return text.slice(0, patch.at) + patch.inserted + text.slice(patch.at + patch.removed.length);
}

export function invertPatch(patch: TextPatch): TextPatch {
  return { at: patch.at, removed: patch.inserted, inserted: patch.removed };
}

export function patchCost(patch: TextPatch): number {
  return patch.removed.length + patch.inserted.length;
}

export interface HistoryState {
  past: TextPatch[];
  future: TextPatch[];
  /** Sum of patchCost across both stacks, used to enforce the byte budget. */
  bytes: number;
}

export const EMPTY_HISTORY: HistoryState = { past: [], future: [], bytes: 0 };

/** Roughly 4 MB of stored edits, plenty for a full session of real work. */
const BUDGET = 4 * 1024 * 1024;
const MAX_STEPS = 200;

export function pushHistory(state: HistoryState, patch: TextPatch): HistoryState {
  const past = [...state.past, patch];
  let bytes = state.bytes + patchCost(patch);

  // Drop the oldest steps first: nobody undoes 200 edits, but everybody
  // notices a tab that grew to a gigabyte.
  while (past.length > MAX_STEPS || (bytes > BUDGET && past.length > 1)) {
    bytes -= patchCost(past.shift()!);
  }

  return { past, future: [], bytes };
}
