// ============================================================================
// Tool state
// ----------------------------------------------------------------------------
// Two rules shape this hook.
//
// 1. Dropping a file does not start the expensive work. The image lands in a
//    `ready` stage with its settings exposed, and nothing runs until the user
//    presses the button — or picks the manual route, which skips the automatic
//    extraction entirely.
//
// 2. Undo stores palettes, not bitmaps. A history entry is an array of at most
//    16 objects of five numbers: about 600 bytes. The previous generation of
//    this kind of editor kept full-resolution ImageData per step and ate
//    hundreds of megabytes.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { decodeFile, type DecodedImage, type IntakeError } from './decode';
import { runHistogram } from './engine';
import {
  DEFAULT_FILTERS,
  solvePalette,
  type Filters,
  type Histogram,
  type Quality,
  type Swatch,
} from './quantize';
import type { RGB } from './color';

export type Stage = 'empty' | 'ready' | 'working' | 'done';

export interface Settings {
  size: number;
  quality: Quality;
  filters: Filters;
}

export const DEFAULT_SETTINGS: Settings = {
  size: 6,
  quality: 'balanced',
  filters: DEFAULT_FILTERS,
};

export const MAX_PALETTE = 16;
const HISTORY_LIMIT = 60;

interface History {
  entries: Swatch[][];
  index: number;
}

export interface Report {
  fidelity: number;
  keptShare: number;
  sampled: number;
  total: number;
  bins: number;
  ms: number;
}

export function useColorLab() {
  const [stage, setStage] = useState<Stage>('empty');
  const [source, setSource] = useState<DecodedImage | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [palette, setPalette] = useState<Swatch[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<IntakeError | null>(null);
  const [busy, setBusy] = useState(false);

  const histRef = useRef<Histogram | null>(null);
  const bitmapRef = useRef<ImageBitmap | null>(null);
  const urlRef = useRef<string | null>(null);
  const historyRef = useRef<History>({ entries: [], index: -1 });
  const [historyTick, setHistoryTick] = useState(0);

  const releaseSource = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    bitmapRef.current?.close();
    bitmapRef.current = null;
    histRef.current = null;
  }, []);

  useEffect(() => releaseSource, [releaseSource]);

  // -------------------------------------------------------------------------
  // History
  // -------------------------------------------------------------------------

  const pushHistory = useCallback((next: Swatch[]) => {
    const h = historyRef.current;
    h.entries = h.entries.slice(0, h.index + 1);
    h.entries.push(next.map(s => ({ ...s })));
    if (h.entries.length > HISTORY_LIMIT) h.entries.shift();
    h.index = h.entries.length - 1;
    setHistoryTick(t => t + 1);
  }, []);

  const commit = useCallback(
    (next: Swatch[]) => {
      setPalette(next);
      pushHistory(next);
    },
    [pushHistory]
  );

  const undo = useCallback(() => {
    const h = historyRef.current;
    if (h.index <= 0) return;
    h.index--;
    setPalette(h.entries[h.index].map(s => ({ ...s })));
    setHistoryTick(t => t + 1);
  }, []);

  const redo = useCallback(() => {
    const h = historyRef.current;
    if (h.index >= h.entries.length - 1) return;
    h.index++;
    setPalette(h.entries[h.index].map(s => ({ ...s })));
    setHistoryTick(t => t + 1);
  }, []);

  const canUndo = historyRef.current.index > 0;
  const canRedo = historyRef.current.index < historyRef.current.entries.length - 1;

  // -------------------------------------------------------------------------
  // Intake — loads, never extracts
  // -------------------------------------------------------------------------

  const load = useCallback(
    async (file: File) => {
      setBusy(true);
      setError(null);
      const result = await decodeFile(file);
      setBusy(false);

      if (!result.value) {
        setError(result.error);
        return;
      }

      releaseSource();
      bitmapRef.current = result.value.bitmap;
      urlRef.current = result.value.url;
      historyRef.current = { entries: [], index: -1 };

      setSource(result.value);
      setPalette([]);
      setReport(null);
      setStage('ready');
      setHistoryTick(t => t + 1);
    },
    [releaseSource]
  );

  // -------------------------------------------------------------------------
  // The expensive path, only on demand
  // -------------------------------------------------------------------------

  const extract = useCallback(
    async (override?: Partial<Settings>) => {
      const bitmap = bitmapRef.current;
      if (!bitmap) return;

      const next = { ...settings, ...override };
      setSettings(next);
      setStage('working');
      setError(null);

      const started = performance.now();
      try {
        // The histogram is only rebuilt when the sampling quality changes; the
        // palette size, the filters and the locks all resolve from the bins.
        if (!histRef.current || histRef.current.quality !== next.quality) {
          histRef.current = await runHistogram(bitmap, next.quality);
        }

        const hist = histRef.current;
        const solved = solvePalette(hist, {
          size: next.size,
          quality: next.quality,
          filters: next.filters,
        });

        setPalette(solved.swatches);
        pushHistory(solved.swatches);
        setReport({
          fidelity: solved.fidelity,
          keptShare: solved.keptShare,
          sampled: hist.sampled,
          total: hist.total,
          bins: hist.index.length,
          ms: Math.round(performance.now() - started),
        });
        setStage('done');
      } catch {
        setError('decode');
        setStage('ready');
      }
    },
    [settings, pushHistory]
  );

  /**
   * Re-solves from the cached bins. Instant, so sliders can call it directly.
   * Locked swatches survive; the rest are recomputed around them.
   */
  const resolve = useCallback(
    (override?: Partial<Settings>, keepLocks = true) => {
      const hist = histRef.current;
      if (!hist) return;

      const next = { ...settings, ...override };
      setSettings(next);

      const started = performance.now();
      const locked = keepLocks ? palette.filter(s => s.locked).map(s => ({ r: s.r, g: s.g, b: s.b })) : [];
      const solved = solvePalette(hist, {
        size: next.size,
        quality: next.quality,
        filters: next.filters,
        locked,
      });

      setPalette(solved.swatches);
      pushHistory(solved.swatches);
      setReport({
        fidelity: solved.fidelity,
        keptShare: solved.keptShare,
        sampled: hist.sampled,
        total: hist.total,
        bins: hist.index.length,
        ms: Math.round(performance.now() - started),
      });
    },
    [settings, palette, pushHistory]
  );

  /** Skips the automatic pass: an empty palette the user fills by hand. */
  const startManual = useCallback(() => {
    setPalette([]);
    historyRef.current = { entries: [[]], index: 0 };
    setReport(null);
    setStage('done');
    setHistoryTick(t => t + 1);
  }, []);

  // -------------------------------------------------------------------------
  // Manual palette edits
  // -------------------------------------------------------------------------

  const addColor = useCallback(
    (c: RGB) => {
      if (palette.length >= MAX_PALETTE) return;
      commit([...palette, { ...c, share: 0, locked: true }]);
    },
    [palette, commit]
  );

  const replaceColor = useCallback(
    (index: number, c: RGB) => {
      commit(palette.map((s, i) => (i === index ? { ...s, ...c, locked: true } : s)));
    },
    [palette, commit]
  );

  const removeColor = useCallback(
    (index: number) => {
      commit(palette.filter((_, i) => i !== index));
    },
    [palette, commit]
  );

  const toggleLock = useCallback(
    (index: number) => {
      commit(palette.map((s, i) => (i === index ? { ...s, locked: !s.locked } : s)));
    },
    [palette, commit]
  );

  const moveColor = useCallback(
    (from: number, to: number) => {
      if (to < 0 || to >= palette.length || from === to) return;
      const next = [...palette];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      commit(next);
    },
    [palette, commit]
  );

  const reset = useCallback(() => {
    releaseSource();
    historyRef.current = { entries: [], index: -1 };
    setSource(null);
    setPalette([]);
    setReport(null);
    setError(null);
    setStage('empty');
    setSettings(DEFAULT_SETTINGS);
    setHistoryTick(t => t + 1);
  }, [releaseSource]);

  return {
    stage,
    source,
    bitmapRef,
    settings,
    setSettings,
    palette,
    report,
    error,
    busy,
    historyTick,
    canUndo,
    canRedo,
    load,
    extract,
    resolve,
    startManual,
    addColor,
    replaceColor,
    removeColor,
    toggleLock,
    moveColor,
    undo,
    redo,
    reset,
    setError,
  };
}
