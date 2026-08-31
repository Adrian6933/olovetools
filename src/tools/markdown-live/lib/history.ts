// ============================================================================
// Undo/redo that stores edits, not documents.
// ----------------------------------------------------------------------------
// Keeping a copy of the whole text per step is what makes an editor eat
// hundreds of megabytes: 200 undo levels over a 300 KB README is 60 MB of
// retained strings for a session of ordinary typing. Each step here keeps only
// the characters that actually changed, found by trimming the common prefix and
// suffix — typing one character stores one character.
//
// It is a reducer instead of a pile of useState + refs so that the text, its
// history and the byte budget can never describe different moments in time.
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

/** Roughly 2 MB of stored edits: a full session of real work. */
const BUDGET = 2 * 1024 * 1024;
const MAX_STEPS = 250;
/** Keystrokes closer together than this fold into a single undo step. */
const COALESCE_MS = 600;

interface Step {
  patch: TextPatch;
  /** Dictionary key of the tool that made the edit, or null for typing. */
  label: string | null;
}

interface State {
  text: string;
  past: Step[];
  future: Step[];
  bytes: number;
  lastEdit: number;
}

type Action =
  | { type: 'set'; text: string; coalesce: boolean; label: string | null; now: number }
  | { type: 'load'; text: string }
  | { type: 'undo' }
  | { type: 'redo' };

function trim(past: Step[], bytes: number): { past: Step[]; bytes: number } {
  let kept = past;
  let size = bytes;
  // Nobody undoes 250 edits, but everybody notices a tab that grew to a gigabyte.
  while (kept.length > MAX_STEPS || (size > BUDGET && kept.length > 1)) {
    size -= patchCost(kept[0].patch);
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
        action.coalesce &&
        action.label === null &&
        state.past.length > 0 &&
        state.past[state.past.length - 1].label === null &&
        action.now - state.lastEdit < COALESCE_MS;

      let past: Step[];
      let bytes: number;

      if (folding) {
        // Replay the previous step backwards so the stored patch keeps
        // describing one reversible edit instead of two overlapping ones.
        const previous = state.past[state.past.length - 1];
        const older = applyPatch(state.text, invertPatch(previous.patch));
        const merged = makePatch(older, action.text);
        past = state.past.slice(0, -1);
        bytes = state.bytes - patchCost(previous.patch);
        if (merged) {
          past = [...past, { patch: merged, label: null }];
          bytes += patchCost(merged);
        }
      } else {
        past = [...state.past, { patch, label: action.label }];
        bytes = state.bytes + patchCost(patch);
      }

      const capped = trim(past, bytes);
      return { text: action.text, past: capped.past, future: [], bytes: capped.bytes, lastEdit: action.now };
    }

    case 'undo': {
      const step = state.past[state.past.length - 1];
      if (!step) return state;
      return {
        text: applyPatch(state.text, invertPatch(step.patch)),
        past: state.past.slice(0, -1),
        future: [...state.future, step],
        bytes: state.bytes - patchCost(step.patch),
        lastEdit: 0,
      };
    }

    case 'redo': {
      const step = state.future[state.future.length - 1];
      if (!step) return state;
      return {
        text: applyPatch(state.text, step.patch),
        past: [...state.past, step],
        future: state.future.slice(0, -1),
        bytes: state.bytes + patchCost(step.patch),
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
  setText: (next: string, options?: { coalesce?: boolean; label?: string }) => void;
  /** Replaces the text and drops the history (a file load, a reset). */
  load: (next: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  /** Dictionary key of the last edit, for the "compare with before" button. */
  lastLabel: string | null;
  /** The text as it was before the last edit — computed only when read. */
  previous: () => string;
  /** Bytes of retained history, shown in the status line. */
  bytes: number;
  steps: number;
}

/**
 * `initial` accepts a thunk so the restored draft can be read out of storage
 * before the first paint: doing it in an effect makes the sample document flash
 * on screen and then get replaced on every single reload.
 */
export function useTextDoc(initial: string | (() => string) = ''): TextDoc {
  const [state, dispatch] = useReducer(
    reducer,
    null,
    (): State => ({
      text: typeof initial === 'function' ? initial() : initial,
      past: [],
      future: [],
      bytes: 0,
      lastEdit: 0,
    })
  );

  const setText = useCallback(
    (next: string, options?: { coalesce?: boolean; label?: string }) =>
      dispatch({
        type: 'set',
        text: next,
        coalesce: options?.coalesce ?? false,
        label: options?.label ?? null,
        now: Date.now(),
      }),
    []
  );
  const load = useCallback((next: string) => dispatch({ type: 'load', text: next }), []);
  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const redo = useCallback(() => dispatch({ type: 'redo' }), []);

  const last = state.past[state.past.length - 1] ?? null;
  const previous = useCallback(() => {
    if (!last) return state.text;
    return applyPatch(state.text, invertPatch(last.patch));
  }, [last, state.text]);

  return useMemo(
    () => ({
      text: state.text,
      setText,
      load,
      undo,
      redo,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
      lastLabel: last ? last.label : null,
      previous,
      bytes: state.bytes,
      steps: state.past.length,
    }),
    [state.text, state.past.length, state.future.length, state.bytes, last, previous, setText, load, undo, redo]
  );
}
