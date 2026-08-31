// ============================================================================
// Undo/redo that stores edits, not documents.
// ----------------------------------------------------------------------------
// Snapshotting the whole text per step is what makes editors eat hundreds of
// megabytes: 100 undo levels on two 4 MB files is 800 MB of retained strings.
// Each step here keeps only the characters that actually changed, found by
// trimming the common prefix and suffix — typing one character stores one.
//
// It is a reducer rather than a pile of useState + refs on purpose: text,
// history and byte budget always move together, so there is no window where
// the undo stack describes a text that is no longer on screen.
// ============================================================================

import { useCallback, useMemo, useReducer } from 'react';
import type { TextPatch } from '../types';

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

const patchCost = (patch: TextPatch) => patch.removed.length + patch.inserted.length;

/** Roughly 2 MB of stored edits per side: a full session of real work. */
const BUDGET = 2 * 1024 * 1024;
const MAX_STEPS = 200;
/** Keystrokes closer together than this fold into one undo step. */
const COALESCE_MS = 600;

interface State {
  text: string;
  past: TextPatch[];
  future: TextPatch[];
  bytes: number;
  lastEdit: number;
}

type Action =
  | { type: 'set'; text: string; coalesce: boolean; now: number }
  /** Replaces the document and drops the history (a file load, a swap). */
  | { type: 'load'; text: string }
  | { type: 'undo' }
  | { type: 'redo' };

function trim(past: TextPatch[], bytes: number): { past: TextPatch[]; bytes: number } {
  let kept = past;
  let size = bytes;
  // Nobody undoes 200 edits, but everybody notices a tab that grew to a gigabyte.
  while (kept.length > MAX_STEPS || (size > BUDGET && kept.length > 1)) {
    size -= patchCost(kept[0]);
    kept = kept.slice(1);
  }
  return { past: kept, bytes: size };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'load':
      return { text: action.text, past: [], future: [], bytes: 0, lastEdit: 0 };

    case 'set': {
      const patch = makePatch(state.text, action.text);
      if (!patch) return state;

      const folding =
        action.coalesce && action.now - state.lastEdit < COALESCE_MS && state.past.length > 0;

      let past: TextPatch[];
      let bytes: number;

      if (folding) {
        // Replay the last step backwards so the stored patch keeps describing
        // one single reversible edit rather than two overlapping ones.
        const previous = state.past[state.past.length - 1];
        const older = applyPatch(state.text, invertPatch(previous));
        const merged = makePatch(older, action.text);
        past = state.past.slice(0, -1);
        bytes = state.bytes - patchCost(previous);
        if (merged) {
          past = [...past, merged];
          bytes += patchCost(merged);
        }
      } else {
        past = [...state.past, patch];
        bytes = state.bytes + patchCost(patch);
      }

      const capped = trim(past, bytes);
      return { text: action.text, past: capped.past, future: [], bytes: capped.bytes, lastEdit: action.now };
    }

    case 'undo': {
      const patch = state.past[state.past.length - 1];
      if (!patch) return state;
      return {
        text: applyPatch(state.text, invertPatch(patch)),
        past: state.past.slice(0, -1),
        future: [...state.future, patch],
        bytes: state.bytes - patchCost(patch),
        lastEdit: 0,
      };
    }

    case 'redo': {
      const patch = state.future[state.future.length - 1];
      if (!patch) return state;
      return {
        text: applyPatch(state.text, patch),
        past: [...state.past, patch],
        future: state.future.slice(0, -1),
        bytes: state.bytes + patchCost(patch),
        lastEdit: 0,
      };
    }

    default:
      return state;
  }
}

export interface TextDoc {
  text: string;
  /** `coalesce` folds fast consecutive edits (typing) into one undo step. */
  setText: (next: string, coalesce?: boolean) => void;
  /** Replaces the text and drops the history. */
  load: (next: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function useTextDoc(initial = ''): TextDoc {
  const [state, dispatch] = useReducer(reducer, {
    text: initial,
    past: [],
    future: [],
    bytes: 0,
    lastEdit: 0,
  });

  const setText = useCallback(
    (next: string, coalesce = false) =>
      dispatch({ type: 'set', text: next, coalesce, now: Date.now() }),
    []
  );
  const load = useCallback((next: string) => dispatch({ type: 'load', text: next }), []);
  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const redo = useCallback(() => dispatch({ type: 'redo' }), []);

  return useMemo(
    () => ({
      text: state.text,
      setText,
      load,
      undo,
      redo,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
    }),
    [state.text, state.past.length, state.future.length, setText, load, undo, redo]
  );
}
