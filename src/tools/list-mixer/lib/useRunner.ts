// ============================================================================
// Driving the pipeline from React.
// ----------------------------------------------------------------------------
// Three rules:
//
//  * Only the newest run matters. Every request carries a token and anything
//    that comes back stale is discarded, so a slow pass over 400k lines can
//    never overwrite the fresh result of the list the user is looking at now.
//  * Past AUTO_LIMIT nothing runs on its own. Pasting a 5 MB list parks it; the
//    user presses Run (or Ctrl+Enter). Same rule as a file upload elsewhere in
//    the suite: the expensive operation is a decision, not a side effect.
//  * The worker is an optimisation, never a requirement. If Worker is missing or
//    a CSP blocks the blob URL, the identical module runs inline.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AUTO_LIMIT, WORKER_THRESHOLD, runPipeline } from './pipeline';
import type { InputFormat, RunRequest, RunResponse, RunResult, Step } from '../types';

const DEBOUNCE_MS = 180;

const EMPTY: RunResult = { items: [], stats: [], itemsIn: 0, ms: 0 };

export interface RunnerState {
  result: RunResult;
  /** A run is in flight. */
  busy: boolean;
  /** True while the result on screen does not describe the current input. */
  stale: boolean;
  /** The list is past AUTO_LIMIT: it only runs when asked. */
  manualRun: boolean;
  /** The last run happened off the main thread. */
  offThread: boolean;
  run: () => void;
}

export function useRunner(
  source: string,
  listB: string,
  input: InputFormat,
  pipeline: Step[],
  locale: string,
  enabled: boolean
): RunnerState {
  const [result, setResult] = useState<RunResult>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [offThread, setOffThread] = useState(false);
  const [requested, setRequested] = useState(0);
  /** Signature of the inputs the result on screen was computed from. */
  const [shownFor, setShownFor] = useState('');

  const workerRef = useRef<Worker | null>(null);
  const brokenRef = useRef(false);
  const nextToken = useRef(1);
  const pendingToken = useRef(0);

  const tooBig = source.length > AUTO_LIMIT;

  // The signature deliberately hashes lengths + the pipeline descriptors rather
  // than the text itself: comparing two 5 MB strings on every render is exactly
  // the kind of cost this tool is trying to avoid.
  const signature = useMemo(
    () => `${source.length}|${listB.length}|${input.split}|${input.custom}|${JSON.stringify(pipeline)}`,
    [source.length, listB.length, input.split, input.custom, pipeline]
  );

  useEffect(() => {
    if (typeof Worker === 'undefined') {
      brokenRef.current = true;
      return;
    }
    let worker: Worker;
    try {
      worker = new Worker(new URL('./pipeline.worker.ts', import.meta.url), { type: 'module' });
    } catch {
      brokenRef.current = true;
      return;
    }
    worker.onmessage = (event: MessageEvent<RunResponse>) => {
      if (event.data.token !== pendingToken.current) return;
      setResult(event.data.result);
      setBusy(false);
      setOffThread(true);
    };
    worker.onerror = () => {
      brokenRef.current = true;
      setBusy(false);
    };
    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const dispatch = useCallback(
    (text: string, other: string, format: InputFormat, steps: Step[], sig: string) => {
      if (!text) {
        pendingToken.current = 0;
        setResult(EMPTY);
        setBusy(false);
        setOffThread(false);
        setShownFor(sig);
        return;
      }

      const token = nextToken.current++;
      pendingToken.current = token;
      setShownFor(sig);

      const worker = workerRef.current;
      // Rough item count without splitting: newlines is the common case and a
      // 20k-item guess is enough to pick a lane.
      const heavy = text.length > WORKER_THRESHOLD * 4;

      if (!worker || brokenRef.current || !heavy) {
        setOffThread(false);
        setResult(runPipeline(text, other, format, steps, locale));
        setBusy(false);
        return;
      }

      setBusy(true);
      const message: RunRequest = { token, source: text, listB: other, input: format, pipeline: steps, locale };
      worker.postMessage(message);
    },
    [locale]
  );

  useEffect(() => {
    if (!enabled) return;
    if (tooBig && requested === 0) return;
    const timer = window.setTimeout(() => dispatch(source, listB, input, pipeline, signature), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
    // `signature` stands in for source/listB/pipeline: it changes exactly when
    // they do, and comparing it is cheap.
  }, [signature, enabled, tooBig, requested, dispatch]);

  // A manual run is only valid for what it was asked about; changing anything
  // puts the panel back into "press Run".
  useEffect(() => {
    setRequested(0);
  }, [signature]);

  // Bumping the counter is enough: the effect above is what dispatches, so a
  // manual run cannot race with the debounced one.
  const run = useCallback(() => setRequested(value => value + 1), []);

  const stale = shownFor !== signature;

  return useMemo(
    () => ({ result, busy, stale, manualRun: tooBig && stale, offThread, run }),
    [result, busy, stale, tooBig, offThread, run]
  );
}
