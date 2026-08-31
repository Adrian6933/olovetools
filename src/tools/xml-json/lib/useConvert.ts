// ============================================================================
// The conversion hook.
// ----------------------------------------------------------------------------
// Deliberately NOT reactive to typing. The old version recomputed both
// directions inside a useMemo on every keystroke, which is how a 5 MB paste
// froze the tab. Here the conversion only ever runs when `run()` is called: the
// Convert button, a shortcut, or an explicit "convert now" after loading a
// file. Typing costs nothing but a stale flag.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConversionResult, Direction, ToJsonOptions, ToXmlOptions } from '../types';
import { EMPTY_RESULT } from '../types';
import { jsonToXml, xmlToJson } from './convert';
import type { WorkerRequest, WorkerResponse } from './worker';

/** Above this, the worker earns its keep; below it the round trip is noise. */
const OFF_THREAD_BYTES = 40 * 1024;

export interface ConvertState {
  result: ConversionResult;
  running: boolean;
  /** The input changed since the last conversion. */
  stale: boolean;
}

export function useConvert() {
  const [state, setState] = useState<ConvertState>({ result: EMPTY_RESULT, running: false, stale: false });
  const workerRef = useRef<Worker | null>(null);
  const requestId = useRef(0);
  const failedWorker = useRef(false);

  useEffect(
    () => () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    },
    []
  );

  const markStale = useCallback(() => {
    setState(current => (current.stale ? current : { ...current, stale: true }));
  }, []);

  const reset = useCallback(() => {
    requestId.current += 1;
    setState({ result: EMPTY_RESULT, running: false, stale: false });
  }, []);

  const run = useCallback(
    (direction: Direction, source: string, jsonOptions: ToJsonOptions, xmlOptions: ToXmlOptions, roundTrip: boolean) => {
      const id = (requestId.current += 1);
      const finish = (result: ConversionResult) => {
        // A late answer from a superseded run must not overwrite the current one.
        if (id !== requestId.current) return;
        setState({ result, running: false, stale: false });
      };

      const small = source.length < OFF_THREAD_BYTES;
      if (small || failedWorker.current) {
        setState(current => ({ ...current, running: true }));
        const result =
          direction === 'xml-to-json'
            ? xmlToJson(source, jsonOptions, roundTrip)
            : jsonToXml(source, xmlOptions, roundTrip);
        finish(result);
        return;
      }

      if (!workerRef.current) {
        try {
          workerRef.current = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
        } catch {
          workerRef.current = null;
          failedWorker.current = true;
        }
      }

      const worker = workerRef.current;
      if (!worker) {
        const result =
          direction === 'xml-to-json'
            ? xmlToJson(source, jsonOptions, roundTrip)
            : jsonToXml(source, xmlOptions, roundTrip);
        finish(result);
        return;
      }

      setState(current => ({ ...current, running: true }));
      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { id: answerId, ...result } = event.data;
        if (answerId !== requestId.current) return;
        finish(result as ConversionResult);
      };
      worker.onerror = () => {
        // One failure is enough: fall back for the rest of the session.
        failedWorker.current = true;
        worker.terminate();
        workerRef.current = null;
        finish(
          direction === 'xml-to-json'
            ? xmlToJson(source, jsonOptions, roundTrip)
            : jsonToXml(source, xmlOptions, roundTrip)
        );
      };

      const request: WorkerRequest = { id, direction, source, jsonOptions, xmlOptions, roundTrip };
      worker.postMessage(request);
    },
    []
  );

  return { ...state, run, reset, markStale };
}
