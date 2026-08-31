import { useCallback, useMemo, useRef, useState } from 'react';

// ============================================================================
// Undo/redo over a minimal snapshot
// ----------------------------------------------------------------------------
// A snapshot here is the *source* text plus a handful of flags — never the
// encoded output and never the decoded bytes, which is what makes 120 undo
// steps cost kilobytes instead of the hundreds of megabytes a naive history of
// "everything on screen" would pin down. The output is derived on demand.
//
// What also matters is not pushing one entry per keystroke — typing a
// 90-character string would leave 90 useless steps between the user and the
// state they wanted back — so consecutive edits inside `coalesceMs` replace the
// top of the stack instead of stacking on it.
//
// The three stacks live in ONE useState. Splitting them across three would
// force each transition to call one setter from inside another's updater, which
// React runs twice in StrictMode and which silently breaks as soon as two
// transitions land in the same tick (key repeat on Ctrl+Z).
// ============================================================================

interface HistoryOptions {
  /** Hard cap on stored snapshots. */
  limit?: number;
  /** Edits closer together than this collapse into one undo step. */
  coalesceMs?: number;
}

interface Stacks<T> {
  past: T[];
  present: T;
  future: T[];
}

export interface History<T> {
  state: T;
  /** `commit: true` forces a new undo step even inside the coalesce window. */
  set: (next: T | ((current: T) => T), commit?: boolean) => void;
  undo: () => void;
  redo: () => void;
  /** Replaces the state and wipes the stacks (loading a new document). */
  reset: (next: T) => void;
  canUndo: boolean;
  canRedo: boolean;
  steps: number;
}

export function useHistory<T>(initial: T, options: HistoryOptions = {}): History<T> {
  const { limit = 120, coalesceMs = 600 } = options;

  const [stacks, setStacks] = useState<Stacks<T>>({ past: [], present: initial, future: [] });
  const lastPush = useRef(0);

  const set = useCallback(
    (next: T | ((current: T) => T), commit = false) => {
      const now = Date.now();
      const coalesce = !commit && now - lastPush.current < coalesceMs;
      lastPush.current = now;

      setStacks(current => {
        const value = typeof next === 'function' ? (next as (c: T) => T)(current.present) : next;
        if (Object.is(value, current.present)) return current;

        const past = coalesce ? current.past : [...current.past, current.present];
        return {
          past: past.length > limit ? past.slice(past.length - limit) : past,
          present: value,
          future: [],
        };
      });
    },
    [coalesceMs, limit]
  );

  const undo = useCallback(() => {
    lastPush.current = 0;
    setStacks(current => {
      if (!current.past.length) return current;
      return {
        past: current.past.slice(0, -1),
        present: current.past[current.past.length - 1],
        future: [current.present, ...current.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    lastPush.current = 0;
    setStacks(current => {
      if (!current.future.length) return current;
      return {
        past: [...current.past, current.present],
        present: current.future[0],
        future: current.future.slice(1),
      };
    });
  }, []);

  const reset = useCallback((next: T) => {
    lastPush.current = 0;
    setStacks({ past: [], present: next, future: [] });
  }, []);

  return useMemo(
    () => ({
      state: stacks.present,
      set,
      undo,
      redo,
      reset,
      canUndo: stacks.past.length > 0,
      canRedo: stacks.future.length > 0,
      steps: stacks.past.length,
    }),
    [stacks, set, undo, redo, reset]
  );
}
