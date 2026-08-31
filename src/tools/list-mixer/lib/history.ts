// ============================================================================
// Undo/redo that stores decisions, not documents.
// ----------------------------------------------------------------------------
// What the user builds here is a recipe: an ordered list of step descriptors of
// a few dozen bytes each. So an undo level is a copy of that array — under a
// kilobyte — instead of a copy of the list, which is how an editor ends up
// holding hundreds of megabytes after an afternoon of work.
//
// Hand edits in manual mode are the one thing that is real text, and those are
// stored as prefix/suffix-trimmed patches: typing one character stores one
// character.
//
// It is a reducer rather than a pile of useState + refs so the pipeline, the
// manual text and the byte budget can never describe different moments in time.
// ============================================================================

import { useCallback, useMemo, useReducer } from 'react';
import type { Step, TextPatch } from '../types';

export function makePatch(before: string, after: string): TextPatch {
  if (before === after) return null as any;

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

type Edit =
  /** The pipeline as it was before this edit. */
  | { kind: 'pipeline'; label: string; pipeline: Step[] }
  /** A hand edit of the manual text, stored forward. */
  | { kind: 'manual'; label: string; patch: TextPatch }
  /** Entering or leaving manual mode; carries the text that was in there. */
  | { kind: 'mode'; label: string; active: boolean; manual: string };

interface State {
  pipeline: Step[];
  /** True when the output is hand-edited and the pipeline is bypassed. */
  manualActive: boolean;
  manual: string;
  past: Edit[];
  future: Edit[];
  bytes: number;
  lastEdit: number;
}

type Action =
  | { type: 'pipeline'; pipeline: Step[]; label: string }
  | { type: 'manual'; text: string; now: number }
  | { type: 'mode'; active: boolean; manual: string; label: string }
  | { type: 'reset'; pipeline: Step[] }
  | { type: 'undo' }
  | { type: 'redo' };

/** Roughly 2 MB of retained edits: a full session of real work. */
const BUDGET = 2 * 1024 * 1024;
const MAX_STEPS = 300;
/** Keystrokes closer together than this fold into one undo level. */
const COALESCE_MS = 600;

function editCost(edit: Edit): number {
  if (edit.kind === 'manual') return edit.patch.removed.length + edit.patch.inserted.length + 24;
  if (edit.kind === 'mode') return edit.manual.length + 24;
  // 80 bytes per descriptor is generous; a descriptor is ~10 short fields.
  return edit.pipeline.length * 80 + 24;
}

function trim(past: Edit[], bytes: number): { past: Edit[]; bytes: number } {
  let kept = past;
  let size = bytes;
  // Nobody undoes 300 edits, but everybody notices a tab that grew to a gigabyte.
  while (kept.length > MAX_STEPS || (size > BUDGET && kept.length > 1)) {
    size -= editCost(kept[0]);
    kept = kept.slice(1);
  }
  return { past: kept, bytes: size };
}

function push(state: State, edit: Edit, patch: Partial<State>): State {
  const capped = trim([...state.past, edit], state.bytes + editCost(edit));
  return { ...state, ...patch, past: capped.past, future: [], bytes: capped.bytes };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'reset':
      return {
        pipeline: action.pipeline,
        manualActive: false,
        manual: '',
        past: [],
        future: [],
        bytes: 0,
        lastEdit: 0,
      };

    case 'pipeline':
      return push(
        state,
        { kind: 'pipeline', label: action.label, pipeline: state.pipeline },
        { pipeline: action.pipeline, lastEdit: 0 }
      );

    case 'manual': {
      const patch = makePatch(state.manual, action.text);
      if (!patch) return state;

      const last = state.past[state.past.length - 1];
      const folding =
        last &&
        last.kind === 'manual' &&
        action.now - state.lastEdit < COALESCE_MS;

      if (folding) {
        // Replay the previous step backwards so the stored patch keeps
        // describing one reversible edit instead of two overlapping ones.
        const older = applyPatch(state.manual, invertPatch((last as any).patch));
        const merged = makePatch(older, action.text);
        let past = state.past.slice(0, -1);
        let bytes = state.bytes - editCost(last);
        if (merged) {
          const edit: Edit = { kind: 'manual', label: 'manual', patch: merged };
          past = [...past, edit];
          bytes += editCost(edit);
        }
        const capped = trim(past, bytes);
        return { ...state, manual: action.text, past: capped.past, future: [], bytes: capped.bytes, lastEdit: action.now };
      }

      return push(
        state,
        { kind: 'manual', label: 'manual', patch },
        { manual: action.text, lastEdit: action.now }
      );
    }

    case 'mode':
      return push(
        state,
        { kind: 'mode', label: action.label, active: state.manualActive, manual: state.manual },
        { manualActive: action.active, manual: action.manual, lastEdit: 0 }
      );

    case 'undo': {
      const edit = state.past[state.past.length - 1];
      if (!edit) return state;
      const past = state.past.slice(0, -1);
      const bytes = state.bytes - editCost(edit);

      if (edit.kind === 'pipeline') {
        return {
          ...state,
          pipeline: edit.pipeline,
          past,
          future: [...state.future, { kind: 'pipeline', label: edit.label, pipeline: state.pipeline }],
          bytes,
          lastEdit: 0,
        };
      }
      if (edit.kind === 'manual') {
        return {
          ...state,
          manual: applyPatch(state.manual, invertPatch(edit.patch)),
          past,
          future: [...state.future, edit],
          bytes,
          lastEdit: 0,
        };
      }
      return {
        ...state,
        manualActive: edit.active,
        manual: edit.manual,
        past,
        future: [...state.future, { kind: 'mode', label: edit.label, active: state.manualActive, manual: state.manual }],
        bytes,
        lastEdit: 0,
      };
    }

    case 'redo': {
      const edit = state.future[state.future.length - 1];
      if (!edit) return state;
      const future = state.future.slice(0, -1);

      if (edit.kind === 'pipeline') {
        const undoEdit: Edit = { kind: 'pipeline', label: edit.label, pipeline: state.pipeline };
        return {
          ...state,
          pipeline: edit.pipeline,
          past: [...state.past, undoEdit],
          future,
          bytes: state.bytes + editCost(undoEdit),
          lastEdit: 0,
        };
      }
      if (edit.kind === 'manual') {
        return {
          ...state,
          manual: applyPatch(state.manual, edit.patch),
          past: [...state.past, edit],
          future,
          bytes: state.bytes + editCost(edit),
          lastEdit: 0,
        };
      }
      const undoEdit: Edit = { kind: 'mode', label: edit.label, active: state.manualActive, manual: state.manual };
      return {
        ...state,
        manualActive: edit.active,
        manual: edit.manual,
        past: [...state.past, undoEdit],
        future,
        bytes: state.bytes + editCost(undoEdit),
        lastEdit: 0,
      };
    }

    default:
      return state;
  }
}

export interface ListDoc {
  pipeline: Step[];
  manualActive: boolean;
  manual: string;
  /** Replaces the pipeline; `label` is the dictionary key shown in the status line. */
  setPipeline: (next: Step[], label: string) => void;
  /** Hand edit of the output. Consecutive keystrokes fold into one undo level. */
  setManual: (text: string) => void;
  /** Detaches the output from the pipeline, seeded with `text`. */
  enterManual: (text: string) => void;
  /** Goes back to the derived output, dropping the hand edits. */
  exitManual: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  /** Dictionary key of the last edit, for the status line. */
  lastLabel: string;
  /** Bytes of retained history — shown, so the claim is checkable. */
  bytes: number;
  steps: number;
  reset: (pipeline: Step[]) => void;
}

export function useListDoc(initial: Step[]): ListDoc {
  const [state, dispatch] = useReducer(reducer, {
    pipeline: initial,
    manualActive: false,
    manual: '',
    past: [],
    future: [],
    bytes: 0,
    lastEdit: 0,
  });

  const setPipeline = useCallback(
    (next: Step[], label: string) => dispatch({ type: 'pipeline', pipeline: next, label }),
    []
  );
  const setManual = useCallback((text: string) => dispatch({ type: 'manual', text, now: Date.now() }), []);
  const enterManual = useCallback(
    (text: string) => dispatch({ type: 'mode', active: true, manual: text, label: 'manualOn' }),
    []
  );
  const exitManual = useCallback(
    () => dispatch({ type: 'mode', active: false, manual: '', label: 'manualOff' }),
    []
  );
  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const redo = useCallback(() => dispatch({ type: 'redo' }), []);
  const reset = useCallback((pipeline: Step[]) => dispatch({ type: 'reset', pipeline }), []);

  const last = state.past[state.past.length - 1];

  return useMemo(
    () => ({
      pipeline: state.pipeline,
      manualActive: state.manualActive,
      manual: state.manual,
      setPipeline,
      setManual,
      enterManual,
      exitManual,
      undo,
      redo,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
      lastLabel: last ? last.label : '',
      bytes: state.bytes,
      steps: state.past.length,
      reset,
    }),
    [
      state.pipeline,
      state.manualActive,
      state.manual,
      state.past.length,
      state.future.length,
      state.bytes,
      last,
      setPipeline,
      setManual,
      enterManual,
      exitManual,
      undo,
      redo,
      reset,
    ]
  );
}
