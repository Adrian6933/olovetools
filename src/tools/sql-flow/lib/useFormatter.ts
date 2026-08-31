// ============================================================================
// Puente con el motor: worker primero, hilo principal sólo si no hay workers.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormatOptionsWithLanguage } from 'sql-formatter';
import { analyze, type Analysis } from './analyze';
import type { FormatRequest, FormatResponse } from './format.worker';
import { minify } from './transform';

export interface FormatResult {
  output: string;
  ok: boolean;
  engineError?: string;
  analysis: Analysis;
  ms: number;
  /** `false` cuando hubo que caer al hilo principal (navegador sin workers). */
  offthread: boolean;
}

export function useFormatter() {
  const workerRef = useRef<Worker | null>(null);
  const requestId = useRef(0);
  const pending = useRef(new Map<number, (result: FormatResult) => void>());
  const [busy, setBusy] = useState(false);

  const ensureWorker = useCallback((): Worker | null => {
    if (workerRef.current) return workerRef.current;
    try {
      const worker = new Worker(new URL('./format.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (event: MessageEvent<FormatResponse>) => {
        const resolve = pending.current.get(event.data.id);
        if (!resolve) return;
        pending.current.delete(event.data.id);
        resolve({ ...event.data, offthread: true });
      };
      // Un worker que revienta (memoria, CSP) no debe dejar la UI colgada:
      // se descarta y la siguiente petición se resuelve en el hilo principal.
      worker.onerror = () => {
        worker.terminate();
        workerRef.current = null;
        pending.current.clear();
        setBusy(false);
      };
      workerRef.current = worker;
      return worker;
    } catch {
      workerRef.current = null;
      return null;
    }
  }, []);

  const run = useCallback(
    async (
      text: string,
      mode: 'format' | 'minify',
      options: FormatOptionsWithLanguage,
      stripComments: boolean
    ): Promise<FormatResult> => {
      setBusy(true);
      try {
        const worker = ensureWorker();
        if (worker) {
          const id = ++requestId.current;
          const request: FormatRequest = { id, text, mode, options, stripComments };
          const result = await new Promise<FormatResult>(resolve => {
            pending.current.set(id, resolve);
            worker.postMessage(request);
          });
          return result;
        }

        // Sin workers: la librería se trae con import dinámico para que no
        // entre en el bundle inicial de la página.
        const started = performance.now();
        const analysis = analyze(text);
        let output = '';
        let ok = true;
        let engineError: string | undefined;
        try {
          if (mode === 'minify') {
            output = minify(text, { stripComments });
          } else {
            const { format } = await import('sql-formatter');
            output = format(text, options);
          }
        } catch (error) {
          ok = false;
          output = text;
          engineError = error instanceof Error ? error.message : String(error);
        }
        return {
          output,
          ok,
          engineError,
          analysis,
          ms: Math.round((performance.now() - started) * 10) / 10,
          offthread: false,
        };
      } finally {
        setBusy(false);
      }
    },
    [ensureWorker]
  );

  useEffect(
    () => () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      pending.current.clear();
    },
    []
  );

  return { run, busy };
}
