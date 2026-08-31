// ============================================================================
// The document store.
// ----------------------------------------------------------------------------
// Two separate things happen to the text, and keeping them apart is the whole
// design:
//
//   · validation — cheap, always live, off-thread above a size threshold. It
//     answers "is this valid and where does it break" while you type.
//   · building   — the AST, the tree, the table. Expensive, and never started
//     by the mere act of opening a file. Small documents build automatically
//     because that is instant and expected; anything larger waits for a click,
//     and Manual mode makes *everything* wait for a click.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DocStats, JsonNode, IssueCode, ParseIssue } from '../types';
import { parseJson } from './parse';
import { computeStats } from './stats';
import { applyPatch, EMPTY_HISTORY, invertPatch, makePatch, pushHistory, type HistoryState } from './history';
import type { WorkerRequest, WorkerResponse } from './worker';

/** Above this many characters the parse moves off-thread and stops being automatic. */
export const AUTO_BUILD_LIMIT = 256 * 1024;
/** Above this, a dropped file is not even loaded into the editor without a click. */
export const PARK_FILE_LIMIT = 2 * 1024 * 1024;

export interface Analysis {
  ok: boolean;
  issues: ParseIssue[];
  repairs: IssueCode[];
  stats: DocStats;
  ms: number;
  repairable: boolean;
  /** Validation has been requested but has not come back yet. */
  pending: boolean;
}

export interface BuiltDoc {
  root: JsonNode;
  /** The exact text this AST was built from. */
  source: string;
}

const EMPTY_STATS: DocStats = {
  bytes: 0,
  lines: 0,
  nodes: 0,
  depth: 0,
  keys: 0,
  types: { object: 0, array: 0, string: 0, number: 0, boolean: 0, null: 0 },
  largestArrays: [],
  uniqueKeys: 0,
};

const IDLE: Analysis = {
  ok: true,
  issues: [],
  repairs: [],
  stats: EMPTY_STATS,
  ms: 0,
  repairable: false,
  pending: false,
};

export function useDocument(initialText = '') {
  const [text, setTextRaw] = useState(initialText);
  const [history, setHistory] = useState<HistoryState>(EMPTY_HISTORY);
  const [analysis, setAnalysis] = useState<Analysis>(IDLE);
  const [doc, setDoc] = useState<BuiltDoc | null>(null);
  const [manual, setManual] = useState(false);
  const [building, setBuilding] = useState(false);

  // Refs mirror the latest state so the callbacks below can read it without
  // nesting one setState inside another updater — that pattern runs during
  // render and misfires under StrictMode's double invocation.
  const textRef = useRef(text);
  textRef.current = text;
  const historyRef = useRef(history);
  historyRef.current = history;

  const workerRef = useRef<Worker | null>(null);
  const requestId = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // -- editing ---------------------------------------------------------------

  const commit = useCallback((next: string, record = true) => {
    const current = textRef.current;
    if (current === next) return;
    if (record) {
      const patch = makePatch(current, next);
      if (patch) setHistory(pushHistory(historyRef.current, patch));
    }
    textRef.current = next;
    setTextRaw(next);
  }, []);

  const undo = useCallback(() => {
    const state = historyRef.current;
    const patch = state.past[state.past.length - 1];
    if (!patch) return;
    const next = applyPatch(textRef.current, invertPatch(patch));
    textRef.current = next;
    setTextRaw(next);
    setHistory({ past: state.past.slice(0, -1), future: [...state.future, patch], bytes: state.bytes });
  }, []);

  const redo = useCallback(() => {
    const state = historyRef.current;
    const patch = state.future[state.future.length - 1];
    if (!patch) return;
    const next = applyPatch(textRef.current, patch);
    textRef.current = next;
    setTextRaw(next);
    setHistory({ past: [...state.past, patch], future: state.future.slice(0, -1), bytes: state.bytes });
  }, []);

  const reset = useCallback(() => {
    textRef.current = '';
    setTextRaw('');
    setHistory(EMPTY_HISTORY);
    setAnalysis(IDLE);
    setDoc(null);
  }, []);

  // -- building --------------------------------------------------------------

  const autoEligible = !manual && text.length <= AUTO_BUILD_LIMIT;
  const stale = !!text.trim() && (!doc || doc.source !== text);

  /** Full parse on the main thread. This is the expensive call. */
  const build = useCallback((): BuiltDoc | null => {
    const source = textRef.current;
    if (!source.trim()) {
      setDoc(null);
      setAnalysis(IDLE);
      return null;
    }
    setBuilding(true);
    try {
      const strict = parseJson(source);
      const result = strict.ok ? strict : parseJson(source, { tolerant: true });
      const usedTolerant = !strict.ok && result.ok;

      setAnalysis({
        ok: strict.ok,
        issues: strict.ok ? strict.issues : [...strict.issues, ...(usedTolerant ? result.issues : [])],
        repairs: usedTolerant ? result.repairs : strict.repairs,
        stats: computeStats(result.ok ? result.root : null, source),
        ms: strict.ms + (usedTolerant ? result.ms : 0),
        repairable: usedTolerant,
        pending: false,
      });

      if (result.ok && result.root) {
        const built = { root: result.root, source };
        setDoc(built);
        return built;
      }
      setDoc(null);
      return null;
    } finally {
      setBuilding(false);
    }
  }, []);

  // -- validation ------------------------------------------------------------

  useEffect(() => {
    clearTimeout(timerRef.current);

    if (!text.trim()) {
      setAnalysis(IDLE);
      setDoc(null);
      return;
    }

    // Small documents: parse straight away, main thread, no worker round trip.
    if (text.length <= AUTO_BUILD_LIMIT) {
      timerRef.current = setTimeout(() => {
        if (manual) {
          // Manual mode still tells you whether the JSON is valid; it just
          // refuses to build the tree/table until you ask.
          const strict = parseJson(text);
          setAnalysis({
            ok: strict.ok,
            issues: strict.issues,
            repairs: strict.repairs,
            stats: computeStats(strict.ok ? strict.root : null, text),
            ms: strict.ms,
            repairable: !strict.ok && parseJson(text, { tolerant: true }).ok,
            pending: false,
          });
        } else {
          build();
        }
      }, 140);
      return () => clearTimeout(timerRef.current);
    }

    // Large documents: validate off-thread, never build without a click.
    setAnalysis(current => ({ ...current, pending: true }));
    timerRef.current = setTimeout(() => {
      if (!workerRef.current) {
        try {
          workerRef.current = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
        } catch {
          workerRef.current = null;
        }
      }

      const worker = workerRef.current;
      const id = ++requestId.current;

      if (!worker) {
        // No module workers (old Safari, hardened browsers): fall back to the
        // main thread. Slower, but never a dead "Validating…" spinner.
        const strict = parseJson(text);
        setAnalysis({
          ok: strict.ok,
          issues: strict.issues,
          repairs: strict.repairs,
          stats: computeStats(strict.ok ? strict.root : null, text),
          ms: strict.ms,
          repairable: !strict.ok && parseJson(text, { tolerant: true }).ok,
          pending: false,
        });
        return;
      }

      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        // Ignore answers to superseded requests, otherwise a slow parse of an
        // old draft overwrites the verdict for what is on screen now.
        if (event.data.id !== requestId.current) return;
        const { ok, issues, repairs, stats, ms, repairable } = event.data;
        setAnalysis({ ok, issues, repairs, stats, ms, repairable, pending: false });
      };
      const request: WorkerRequest = { id, text, tolerant: false };
      worker.postMessage(request);
    }, 220);

    return () => clearTimeout(timerRef.current);
  }, [text, manual, build]);

  useEffect(
    () => () => {
      clearTimeout(timerRef.current);
      workerRef.current?.terminate();
      workerRef.current = null;
    },
    []
  );

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return useMemo(
    () => ({
      text,
      setText: commit,
      undo,
      redo,
      canUndo,
      canRedo,
      reset,
      analysis,
      doc,
      stale,
      building,
      manual,
      setManual,
      autoEligible,
      build,
      historyBytes: history.bytes,
    }),
    [text, commit, undo, redo, canUndo, canRedo, reset, analysis, doc, stale, building, manual, autoEligible, build, history.bytes]
  );
}

export type DocumentStore = ReturnType<typeof useDocument>;
