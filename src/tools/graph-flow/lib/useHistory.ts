import { useCallback, useRef, useState } from 'react';

interface HistoryState<T> {
  past: { value: T; label: string }[];
  present: T;
  future: { value: T; label: string }[];
}

/**
 * Undo/redo over the *dataset*, not the rendered chart.
 *
 * A snapshot here is a few arrays of numbers — a 5,000×3 sheet is around
 * 120 KB — where a bitmap of the same chart at export resolution is several
 * megabytes. Keeping the model instead of the pixels is what makes a deep
 * history affordable; the chart is recomputed from it in a millisecond.
 */
export function useHistory<T>(initial: T, limit = 60) {
  const [state, setState] = useState<HistoryState<T>>({ past: [], present: initial, future: [] });

  // Consecutive edits of the same kind (dragging through a column of cells)
  // collapse into one history entry instead of 40.
  const lastPush = useRef<{ label: string; at: number }>({ label: '', at: 0 });

  const set = useCallback(
    (value: T, label: string) => {
      const now = Date.now();
      const merge = label === lastPush.current.label && now - lastPush.current.at < 700;
      lastPush.current = { label, at: now };

      setState(s => {
        if (merge && s.past.length > 0) {
          return { past: s.past, present: value, future: [] };
        }
        const past = [...s.past, { value: s.present, label }];
        return {
          past: past.length > limit ? past.slice(past.length - limit) : past,
          present: value,
          future: [],
        };
      });
    },
    [limit]
  );

  /** Replaces the value and wipes the history — loading a new dataset. */
  const reset = useCallback((value: T) => {
    lastPush.current = { label: '', at: 0 };
    setState({ past: [], present: value, future: [] });
  }, []);

  const undo = useCallback(() => {
    lastPush.current = { label: '', at: 0 };
    setState(s => {
      if (s.past.length === 0) return s;
      const prev = s.past[s.past.length - 1];
      return {
        past: s.past.slice(0, -1),
        present: prev.value,
        future: [{ value: s.present, label: prev.label }, ...s.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    lastPush.current = { label: '', at: 0 };
    setState(s => {
      if (s.future.length === 0) return s;
      const next = s.future[0];
      return {
        past: [...s.past, { value: s.present, label: next.label }],
        present: next.value,
        future: s.future.slice(1),
      };
    });
  }, []);

  return {
    value: state.present,
    set,
    reset,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    undoLabel: state.past.length ? state.past[state.past.length - 1].label : '',
    depth: state.past.length,
  };
}
