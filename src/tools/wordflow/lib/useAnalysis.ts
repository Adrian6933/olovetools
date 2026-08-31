// ============================================================================
// Driving the worker from React.
// ----------------------------------------------------------------------------
// Two rules shape this hook:
//
//  * Only the newest request matters. Every message carries an id and anything
//    that comes back stale is dropped, so a slow analysis of paragraph one can
//    never overwrite the fresh one of paragraph nine.
//  * Nothing expensive happens on its own past a point. Under AUTO_LIMIT the
//    analysis follows the caret; past it the tool waits for the button, which
//    is the same "you press it, not the upload" rule the rest of the suite has.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AUTO_LIMIT, analyze, emptyAnalysis } from './analyze';
import type { Analysis, LangId, WorkerRequest, WorkerResponse } from '../types';

const DEBOUNCE_MS = 220;

export interface AnalysisState {
  analysis: Analysis;
  /** A run is in flight. */
  busy: boolean;
  /** The text moved on and the result on screen no longer describes it. */
  stale: boolean;
  /** The document is past AUTO_LIMIT, so it only runs when asked. */
  manual: boolean;
  run: () => void;
}

export function useAnalysis(text: string, lang: LangId | null, enabled = true): AnalysisState {
  const [analysis, setAnalysis] = useState<Analysis>(() => emptyAnalysis());
  const [busy, setBusy] = useState(false);
  const [requested, setRequested] = useState(0);

  const workerRef = useRef<Worker | null>(null);
  const nextId = useRef(1);
  const pending = useRef(0);
  const failed = useRef(false);

  const manual = text.length > AUTO_LIMIT;

  useEffect(() => {
    if (typeof Worker === 'undefined') {
      failed.current = true;
      return;
    }
    let worker: Worker;
    try {
      worker = new Worker(new URL('./analyze.worker.ts', import.meta.url), { type: 'module' });
    } catch {
      // Blocked by a strict CSP or an ancient browser: fall back to running the
      // exact same module inline rather than showing an empty panel.
      failed.current = true;
      return;
    }
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      if (event.data.id !== pending.current) return;
      setAnalysis(event.data.analysis);
      setBusy(false);
    };
    worker.onerror = () => {
      failed.current = true;
      setBusy(false);
    };
    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const dispatch = useCallback(
    (value: string, forced: LangId | null) => {
      if (!value) {
        pending.current = 0;
        setAnalysis(emptyAnalysis());
        setBusy(false);
        return;
      }
      const id = nextId.current++;
      pending.current = id;
      const worker = workerRef.current;
      if (!worker || failed.current) {
        setAnalysis(analyze(value, forced));
        setBusy(false);
        return;
      }
      setBusy(true);
      const message: WorkerRequest = { id, text: value, lang: forced };
      worker.postMessage(message);
    },
    []
  );

  useEffect(() => {
    if (!enabled) return;
    if (manual && requested === 0) return;
    const timer = window.setTimeout(() => dispatch(text, lang), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [text, lang, enabled, manual, requested, dispatch]);

  // A manual run is only valid for the text it was asked about; typing again
  // puts the panel back into "press to analyse".
  useEffect(() => {
    if (!manual) setRequested(0);
  }, [manual]);

  const run = useCallback(() => {
    setRequested(value => value + 1);
    dispatch(text, lang);
  }, [dispatch, text, lang]);

  const stale = analysis.length !== text.length;

  return useMemo(
    () => ({ analysis, busy, stale, manual: manual && analysis.length !== text.length, run }),
    [analysis, busy, stale, manual, text.length, run]
  );
}
