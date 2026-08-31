// ============================================================================
// Driving the engine from React, with a watchdog.
// ----------------------------------------------------------------------------
// Rules, in order of importance:
//
//  * A run that overruns is killed. The worker is terminated and a fresh one
//    takes its place, so the next keystroke works normally. Without this the
//    tool has no answer to the pattern its own lint panel warns about.
//  * Only the newest request counts. Every message carries an id; stale
//    replies are dropped so a slow run cannot overwrite a fast newer one.
//  * Past a size threshold nothing happens on its own. Small inputs stay live
//    as you type, big ones wait for the button — the same "you press it"
//    rule the rest of the suite follows.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { emptyResult, run as runInline } from './engine';
import type { RunMode, RunRequest, RunResult, RunState } from '../types';

const DEBOUNCE_MS = 180;
/** A run allowed to take longer than this is a run that is never coming back. */
export const TIMEOUT_MS = 2000;
/** Above this many characters the tool stops following the caret. */
export const AUTO_LIMIT = 40_000;
/** Matches kept with full group detail; the count keeps going past it. */
export const MATCH_LIMIT = 2000;

export interface RunInputs {
  pattern: string;
  flags: string;
  text: string;
  replacement: string;
  mode: RunMode;
}

export interface RegexRunState extends RunState {
  /** The run happens in a worker that can be killed. False = no Worker here. */
  sandboxed: boolean;
  /** The inputs are past AUTO_LIMIT, so nothing runs until asked. */
  manual: boolean;
  run: () => void;
}

export function useRegexRun(inputs: RunInputs, live: boolean): RegexRunState {
  const [result, setResult] = useState<RunResult>(() => emptyResult());
  const [busy, setBusy] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [sandboxed, setSandboxed] = useState(true);
  const [requested, setRequested] = useState(0);

  const workerRef = useRef<Worker | null>(null);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const nextId = useRef(1);
  const pending = useRef(0);
  const unavailable = useRef(false);

  const manual = inputs.text.length > AUTO_LIMIT;

  // -- worker lifecycle -----------------------------------------------------

  const spawn = useCallback((): Worker | null => {
    if (unavailable.current || typeof Worker === 'undefined') {
      unavailable.current = true;
      setSandboxed(false);
      return null;
    }
    try {
      const worker = new Worker(new URL('./engine.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (event: MessageEvent<RunResult>) => {
        if (event.data.id !== pending.current) return;
        clearTimeout(watchdogRef.current);
        setResult(event.data);
        setBusy(false);
        setTimedOut(false);
      };
      worker.onerror = () => {
        clearTimeout(watchdogRef.current);
        unavailable.current = true;
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
      clearTimeout(watchdogRef.current);
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [spawn]);

  // -- dispatch -------------------------------------------------------------

  const dispatch = useCallback(
    (current: RunInputs) => {
      const id = nextId.current++;
      pending.current = id;

      const request: RunRequest = {
        id,
        pattern: current.pattern,
        flags: current.flags,
        text: current.text,
        replacement: current.replacement,
        mode: current.mode,
        limit: MATCH_LIMIT,
      };

      if (!current.pattern) {
        clearTimeout(watchdogRef.current);
        setResult({ ...emptyResult(id), replaced: current.text, parts: [current.text] });
        setBusy(false);
        setTimedOut(false);
        return;
      }

      const worker = workerRef.current;
      if (!worker) {
        // No sandbox: run it here, and accept that a pathological pattern
        // stalls the tab. The UI tells the user this is the situation and
        // switches to manual runs so it is never a surprise.
        setResult(runInline(request));
        setBusy(false);
        return;
      }

      setBusy(true);
      setTimedOut(false);
      worker.postMessage(request);

      clearTimeout(watchdogRef.current);
      watchdogRef.current = setTimeout(() => {
        if (pending.current !== id) return;
        // The engine is stuck inside one `exec` call and will not answer a
        // message. Terminate is the only way out.
        workerRef.current?.terminate();
        workerRef.current = null;
        spawn();
        setBusy(false);
        setTimedOut(true);
        setResult(previous => ({ ...previous, id, matches: [], total: 0, truncated: false }));
      }, TIMEOUT_MS);
    },
    [spawn]
  );

  const { pattern, flags, text, replacement, mode } = inputs;

  useEffect(() => {
    if (!live) return;
    if (manual && requested === 0) return;
    const timer = window.setTimeout(
      () => dispatch({ pattern, flags, text, replacement, mode }),
      DEBOUNCE_MS
    );
    return () => window.clearTimeout(timer);
  }, [pattern, flags, text, replacement, mode, live, manual, requested, dispatch]);

  // A manual run only answers for the inputs it was asked about; changing them
  // puts the panel back into "press to run".
  useEffect(() => {
    setRequested(0);
  }, [pattern, flags, text, replacement, mode]);

  const runNow = useCallback(() => {
    setRequested(value => value + 1);
    dispatch({ pattern, flags, text, replacement, mode });
  }, [dispatch, pattern, flags, text, replacement, mode]);

  const stale = result.replaced !== '' && result.replaced.length !== text.length && mode === 'replace';

  return useMemo(
    () => ({
      ok: result.ok,
      error: result.error,
      matches: result.matches,
      truncated: result.truncated,
      total: result.total,
      replaced: result.replaced,
      parts: result.parts,
      ms: result.ms,
      busy,
      stale,
      timedOut,
      sandboxed,
      manual: (manual || !live) && requested === 0,
      run: runNow,
    }),
    [result, busy, stale, timedOut, sandboxed, manual, live, requested, runNow]
  );
}
