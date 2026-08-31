// ============================================================================
// Driving the worker from React.
// ----------------------------------------------------------------------------
// Nothing here runs on its own. Dropping a file parks it; the user presses the
// button. That is deliberate and it is the suite's rule: the expensive
// operation is never a side effect of picking a file.
//
// Re-running after a *settings* change is different — the file is already in
// hand, the user is turning knobs and wants to see the effect — so that path is
// debounced rather than gated behind a second press.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import type { OptimizeResult, OptimizerSettings } from './types';

const DEBOUNCE_MS = 220;

export interface OptimizerState {
  result: OptimizeResult | null;
  busy: boolean;
  /** False when Worker is unavailable (strict CSP): runs happen inline. */
  sandboxed: boolean;
  /** Kick off a run now. */
  run: (source: string, settings: OptimizerSettings) => void;
  /** Kick off a run after a short pause, coalescing rapid changes. */
  runDebounced: (source: string, settings: OptimizerSettings) => void;
  /** Abandon the current run and drop its result. */
  cancel: () => void;
  reset: () => void;
}

export function useOptimizer(): OptimizerState {
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [sandboxed, setSandboxed] = useState(true);

  const workerRef = useRef<Worker | null>(null);
  const unavailable = useRef(false);
  const nextId = useRef(1);
  const pending = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const spawn = useCallback((): Worker | null => {
    if (workerRef.current) return workerRef.current;
    if (unavailable.current || typeof Worker === 'undefined') {
      unavailable.current = true;
      setSandboxed(false);
      return null;
    }
    try {
      const worker = new Worker(new URL('./engine.worker.ts', import.meta.url), {
        type: 'module',
      });
      worker.onmessage = (event: MessageEvent<OptimizeResult>) => {
        // Only the newest request counts: a slow big run must not overwrite a
        // fast newer one the user is already looking at.
        if (event.data.id !== pending.current) return;
        setResult(event.data);
        setBusy(false);
      };
      worker.onerror = () => {
        unavailable.current = true;
        workerRef.current = null;
        setSandboxed(false);
        setBusy(false);
      };
      workerRef.current = worker;
      return worker;
    } catch {
      // A strict CSP can refuse module workers outright.
      unavailable.current = true;
      setSandboxed(false);
      return null;
    }
  }, []);

  useEffect(() => {
    spawn();
    return () => {
      clearTimeout(debounceRef.current);
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [spawn]);

  const dispatch = useCallback(
    (source: string, settings: OptimizerSettings) => {
      const id = nextId.current++;
      pending.current = id;
      setBusy(true);

      const worker = spawn();
      if (!worker) {
        // No worker available: run inline and accept the stall. The UI says so.
        //
        // Imported dynamically, not at the top of the file. A static import
        // pulls svgo — around half a megabyte — into this island's chunk, which
        // loads eagerly on every visit, on top of the copy already inside the
        // worker bundle. Almost nobody takes this branch, so almost nobody
        // should pay for it.
        import('./engine').then(({ runOptimize }) =>
          runOptimize({ id, source, settings }).then(value => {
            if (value.id !== pending.current) return;
            setResult(value);
            setBusy(false);
          })
        );
        return;
      }
      worker.postMessage({ id, source, settings });
    },
    [spawn]
  );

  const run = useCallback(
    (source: string, settings: OptimizerSettings) => {
      clearTimeout(debounceRef.current);
      dispatch(source, settings);
    },
    [dispatch]
  );

  const runDebounced = useCallback(
    (source: string, settings: OptimizerSettings) => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => dispatch(source, settings), DEBOUNCE_MS);
    },
    [dispatch]
  );

  const cancel = useCallback(() => {
    clearTimeout(debounceRef.current);
    pending.current = -1;
    setBusy(false);
    // Terminating is the only way to stop svgo mid-pass; a fresh worker is
    // spawned lazily on the next run.
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  const reset = useCallback(() => {
    clearTimeout(debounceRef.current);
    pending.current = -1;
    setResult(null);
    setBusy(false);
  }, []);

  return { result, busy, sandboxed, run, runDebounced, cancel, reset };
}

// ---------------------------------------------------------------------------
// Undo/redo over settings.
// ---------------------------------------------------------------------------
// The history holds settings objects — a few dozen booleans and four numbers,
// well under a kilobyte each. Storing optimized *output* per step instead would
// mean holding a copy of the file for every toggle the user flicks, which for a
// batch of large SVGs is how a tab ends up using hundreds of megabytes. The
// output is cheap to recompute and the input never changes, so it is not worth
// keeping.
// ---------------------------------------------------------------------------

const HISTORY_LIMIT = 60;

export interface SettingsHistory {
  settings: OptimizerSettings;
  set: (next: OptimizerSettings) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function useSettingsHistory(initial: OptimizerSettings): SettingsHistory {
  const [past, setPast] = useState<OptimizerSettings[]>([]);
  const [settings, setSettings] = useState<OptimizerSettings>(initial);
  const [future, setFuture] = useState<OptimizerSettings[]>([]);

  // Pushing the outgoing value onto the past has to happen inside the updater:
  // reading `settings` from the closure captures a stale value when several
  // toggles fire in the same tick, and the history then records the wrong step.
  const set = useCallback((next: OptimizerSettings) => {
    setSettings(current => {
      setPast(prev => [...prev, current].slice(-HISTORY_LIMIT));
      setFuture([]);
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    setPast(prev => {
      if (prev.length === 0) return prev;
      const previous = prev[prev.length - 1];
      setSettings(current => {
        setFuture(f => [current, ...f].slice(0, HISTORY_LIMIT));
        return previous;
      });
      return prev.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture(prev => {
      if (prev.length === 0) return prev;
      const next = prev[0];
      setSettings(current => {
        setPast(p => [...p, current].slice(-HISTORY_LIMIT));
        return next;
      });
      return prev.slice(1);
    });
  }, []);

  return {
    settings,
    set,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
