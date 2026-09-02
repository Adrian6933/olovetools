import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Braces,
  Check,
  ChevronDown,
  Code2,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileDown,
  Film,
  Info,
  Loader2,
  Redo2,
  RotateCcw,
  Sparkles,
  Trash2,
  Undo2,
  Upload,
  Wand2,
  X,
} from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { AdBanner } from '../../components/shared/AdBanner';
import { NextStepBar } from './components/NextStepBar';
import { Stage, type StageHandle } from './components/Stage';
import {
  IconFrames,
  IconHandoff,
  IconLayers,
  IconLocal,
  IconPalette,
  IconReport,
  IconShrink,
  PlayerHeroArt,
  StepDropArt,
  StepExportArt,
  StepInspectArt,
  StepRecolorArt,
} from './components/Illustrations';

import { PRESETS } from './utils/presetAnimations';
import {
  applyColorMap,
  applyHiddenLayers,
  countLayers,
  describeLayers,
  extractColorRefs,
  groupSwatches,
  isLightHex,
} from './utils/colorHelper';
import {
  LARGE_FILE_BYTES,
  LottieParseError,
  baseName,
  formatBytes,
  readLottieFile,
  readLottieText,
} from './utils/lottieFile';
import { DEFAULT_OPTIMIZE, optimizeLottie } from './utils/optimize';
import {
  canRecordWebm,
  downloadBlob,
  exportCurrentSvg,
  exportDotLottie,
  exportFramePng,
  exportFrameSequenceZip,
  exportWebm,
} from './utils/exporters';
import { buildEmbedSnippet, type EmbedFlavor } from './utils/embed';
import { buildDiagnostics } from './utils/validate';
import type {
  ColorSwatch,
  EditState,
  Finding,
  LottieJson,
  OptimizeOptions,
  OptimizeResult,
  StagedFile,
} from './types';

import { legalTranslations } from '../../locales/legal';
import { useHandoffIntake } from '../../lib/useHandoff';
import { useReducedMotion } from '../../components/shared/motion';

interface LottieViewerProps {
  lang: string;
  dictionary: any;
}

interface OpenDocument {
  /** Pristine, never mutated. Every edit is expressed as a patch over this. */
  json: LottieJson;
  name: string;
  source: StagedFile['source'];
}

const EMPTY_EDIT: EditState = { colors: {}, hiddenLayers: [], trim: null, fps: null };

const PRESET_KEYS = ['spinner', 'square', 'circle', 'gradient'] as const;
type PresetKey = (typeof PRESET_KEYS)[number];

const PRESET_META: Record<PresetKey, { labelKey: string; fallback: string; descKey: string; descFallback: string }> = {
  spinner: { labelKey: 'preset_bars', fallback: 'Bouncing Bars', descKey: 'preset_bars_desc', descFallback: 'Three-colour loader, 60 frames' },
  square: { labelKey: 'preset_square', fallback: 'Rotating Square', descKey: 'preset_square_desc', descFallback: 'Single animated rotation property' },
  circle: { labelKey: 'preset_circle', fallback: 'Pulsing Circle', descKey: 'preset_circle_desc', descFallback: 'Elastic scale loop' },
  gradient: { labelKey: 'preset_gradient', fallback: 'Gradient Sweep', descKey: 'preset_gradient_desc', descFallback: 'Gradient fill with three editable stops' },
};

/** Cheap structural equality for the (deliberately tiny) edit state. */
function sameEdit(a: EditState, b: EditState): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function interpolate(template: string, count?: number): string {
  return count === undefined ? template : template.replace(/\{n\}/g, String(count));
}

export const LottieViewer: React.FC<LottieViewerProps> = ({ lang, dictionary }) => {
  const t = dictionary;
  const prefersReduced = useReducedMotion();

  const [lottie, setLottie] = useState<any>(null);
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  // --- Intake --------------------------------------------------------------
  const [staged, setStaged] = useState<StagedFile | null>(null);
  const [doc, setDoc] = useState<OpenDocument | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [busyReading, setBusyReading] = useState(false);

  // --- Edit state ----------------------------------------------------------
  const [edit, setEdit] = useState<EditState>(EMPTY_EDIT);
  const [committed, setCommitted] = useState<EditState>(EMPTY_EDIT);
  const [history, setHistory] = useState<EditState[]>([EMPTY_EDIT]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // --- Player metadata (pushed up from the Stage) --------------------------
  const [meta, setMeta] = useState({ totalFrames: 0, frameRate: 30, inPoint: 0 });

  // --- Optimizer -----------------------------------------------------------
  const [optimizeOptions, setOptimizeOptions] = useState<OptimizeOptions>(DEFAULT_OPTIMIZE);
  const [optimized, setOptimized] = useState<OptimizeResult | null>(null);
  const [optimizing, setOptimizing] = useState(false);

  // --- Export --------------------------------------------------------------
  const [exportWidth, setExportWidth] = useState(512);
  const [exportTransparent, setExportTransparent] = useState(true);
  const [exportBg, setExportBg] = useState('#0a0a0f');
  const [exportBusy, setExportBusy] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [embedFlavor, setEmbedFlavor] = useState<EmbedFlavor>('webComponent');

  const stageRef = useRef<StageHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // -------------------------------------------------------------------------
  // lottie-web is imported lazily: it is the single heaviest dependency on the
  // page and nothing above the fold needs it.
  // -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    import('lottie-web').then(module => {
      if (!cancelled) setLottie((module as any).default || module);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => () => clearTimeout(copyTimerRef.current), []);

  // -------------------------------------------------------------------------
  // Derived document data. Computed once per document, not per keystroke.
  // -------------------------------------------------------------------------
  const colorRefs = useMemo(() => (doc ? extractColorRefs(doc.json) : []), [doc]);
  const swatches = useMemo(() => groupSwatches(colorRefs), [colorRefs]);
  const layers = useMemo(() => (doc ? describeLayers(doc.json) : []), [doc]);

  // -------------------------------------------------------------------------
  // Debounced commit. Dragging a colour picker fires continuously; the player
  // only rebuilds once the user settles, and only committed states enter the
  // undo history.
  // -------------------------------------------------------------------------
  const committedRef = useRef(committed);
  committedRef.current = committed;
  const historyRef = useRef({ history, historyIndex });
  historyRef.current = { history, historyIndex };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (sameEdit(edit, committedRef.current)) return;
      setCommitted(edit);
      const { history: past, historyIndex: index } = historyRef.current;
      const next = [...past.slice(0, index + 1), edit].slice(-60);
      setHistory(next);
      setHistoryIndex(next.length - 1);
    }, 140);
    return () => clearTimeout(timer);
  }, [edit]);

  /**
   * The document handed to the player: a single copy of the original with the
   * committed patches written into it. Patching walks only the recorded colour
   * paths, so this stays cheap on multi-megabyte files.
   */
  const renderJson = useMemo(() => {
    if (!doc) return null;
    const copy = structuredClone(doc.json) as LottieJson;
    applyColorMap(copy, colorRefs, committed.colors);
    applyHiddenLayers(copy, committed.hiddenLayers);
    if (committed.fps) copy.fr = committed.fps;
    return copy;
  }, [doc, colorRefs, committed]);

  /** What every export and the embed snippet operate on. */
  const exportJson = optimized?.json ?? renderJson;

  const hasEdits = useMemo(() => !sameEdit(committed, EMPTY_EDIT), [committed]);

  // -------------------------------------------------------------------------
  // Intake
  // -------------------------------------------------------------------------
  const resetEdits = useCallback(() => {
    setEdit(EMPTY_EDIT);
    setCommitted(EMPTY_EDIT);
    setHistory([EMPTY_EDIT]);
    setHistoryIndex(0);
    setOptimized(null);
  }, []);

  const stageFile = useCallback(
    async (file: File) => {
      setErrorMsg('');
      setBusyReading(true);
      try {
        if (file.size > LARGE_FILE_BYTES) {
          setErrorMsg(
            interpolate(
              t.error_too_large ||
                'That file is {n} MB. Anything above 12 MB will lock up the tab while it parses.',
              Math.round(file.size / (1024 * 1024))
            )
          );
          return;
        }
        const result = await readLottieFile(file);
        setStaged(result);
      } catch (err: any) {
        const key = err instanceof LottieParseError ? err.key : 'error_no_lottie';
        setErrorMsg(t[key] || err?.message || 'Could not read that file');
      } finally {
        setBusyReading(false);
      }
    },
    [t]
  );

  // Receives a file handed over by another tool in the suite.
  useHandoffIntake(file => {
    void stageFile(file);
  });

  const openStaged = useCallback(() => {
    if (!staged) return;
    resetEdits();
    setDoc({ json: staged.json, name: staged.name, source: staged.source });
    setStaged(null);
  }, [resetEdits, staged]);

  const loadPreset = useCallback(
    (key: PresetKey) => {
      setErrorMsg('');
      setStaged(null);
      resetEdits();
      const json = PRESETS[key] as LottieJson;
      setDoc({ json, name: `${PRESET_META[key].fallback}.json`, source: 'json' });
    },
    [resetEdits]
  );

  const openPasted = useCallback(() => {
    setErrorMsg('');
    try {
      const result = readLottieText(pasteText);
      resetEdits();
      setDoc({ json: result.json, name: result.name, source: 'paste' });
      setPasteOpen(false);
      setPasteText('');
    } catch (err: any) {
      const key = err instanceof LottieParseError ? err.key : 'error_invalid_json';
      setErrorMsg(t[key] || 'Invalid JSON');
    }
  }, [pasteText, resetEdits, t]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files?.[0];
      if (file) void stageFile(file);
    },
    [stageFile]
  );

  // -------------------------------------------------------------------------
  // Editing
  // -------------------------------------------------------------------------
  const setColor = useCallback((hex: string, next: string) => {
    setEdit(prev => {
      const colors = { ...prev.colors };
      if (next.toLowerCase() === hex) delete colors[hex];
      else colors[hex] = next.toLowerCase();
      return { ...prev, colors };
    });
  }, []);

  const toggleLayer = useCallback((index: number) => {
    setEdit(prev => {
      const hidden = prev.hiddenLayers.includes(index)
        ? prev.hiddenLayers.filter(value => value !== index)
        : [...prev.hiddenLayers, index];
      return { ...prev, hiddenLayers: hidden };
    });
  }, []);

  const applyHistory = useCallback(
    (index: number) => {
      const target = history[index];
      if (!target) return;
      setHistoryIndex(index);
      setEdit(target);
      setCommitted(target);
    },
    [history]
  );

  const undo = useCallback(() => applyHistory(historyIndex - 1), [applyHistory, historyIndex]);
  const redo = useCallback(() => applyHistory(historyIndex + 1), [applyHistory, historyIndex]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key !== 'z' && key !== 'y') return;
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'TEXTAREA' || target?.tagName === 'INPUT') return;
      event.preventDefault();
      if (key === 'y' || event.shiftKey) redo();
      else undo();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [redo, undo]);

  // -------------------------------------------------------------------------
  // Optimizer
  // -------------------------------------------------------------------------
  const runOptimize = useCallback(() => {
    if (!renderJson) return;
    setOptimizing(true);
    // A tick of breathing room so the button can show its spinner before the
    // synchronous pass blocks the thread.
    setTimeout(() => {
      try {
        setOptimized(optimizeLottie(renderJson, optimizeOptions));
      } finally {
        setOptimizing(false);
      }
    }, 20);
  }, [optimizeOptions, renderJson]);

  // Any further edit invalidates a previous optimization result.
  useEffect(() => {
    setOptimized(null);
  }, [committed]);

  // -------------------------------------------------------------------------
  // Export
  // -------------------------------------------------------------------------
  const background = exportTransparent ? null : exportBg;
  const currentName = doc ? baseName(doc.name) : 'animation';
  const frameRange = useMemo<[number, number]>(() => {
    const last = Math.max(0, meta.totalFrames - 1);
    if (committed.trim) return [committed.trim[0], Math.min(committed.trim[1], last)];
    return [0, last];
  }, [committed.trim, meta.totalFrames]);

  const withBusy = useCallback(async (id: string, run: () => Promise<void>) => {
    setExportBusy(id);
    setExportProgress(0);
    try {
      await run();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Export failed');
    } finally {
      setExportBusy(null);
      setExportProgress(0);
    }
  }, []);

  const doExportJson = useCallback(() => {
    if (!exportJson) return;
    downloadBlob(
      new Blob([JSON.stringify(exportJson)], { type: 'application/json' }),
      `${currentName}${optimized ? '_optimized' : '_edited'}.json`
    );
  }, [currentName, exportJson, optimized]);

  const doExportDotLottie = useCallback(() => {
    if (!exportJson) return;
    void withBusy('dotlottie', async () => {
      const blob = await exportDotLottie(exportJson, currentName);
      downloadBlob(blob, `${currentName}.lottie`);
    });
  }, [currentName, exportJson, withBusy]);

  const doExportSvg = useCallback(() => {
    if (!exportJson) return;
    const blob = exportCurrentSvg(stageRef.current?.getContainer() ?? null, exportJson);
    if (!blob) {
      setErrorMsg(t.error_no_svg || 'Nothing is rendered yet');
      return;
    }
    downloadBlob(blob, `${currentName}_frame${stageRef.current?.getFrame() ?? 0}.svg`);
  }, [currentName, exportJson, t]);

  const doExportPng = useCallback(() => {
    if (!exportJson || !lottie) return;
    void withBusy('png', async () => {
      const frame = stageRef.current?.getFrame() ?? 0;
      const blob = await exportFramePng(lottie, exportJson, frame, { width: exportWidth, background });
      downloadBlob(blob, `${currentName}_frame${frame}.png`);
    });
  }, [background, currentName, exportJson, exportWidth, lottie, withBusy]);

  const doExportSequence = useCallback(() => {
    if (!exportJson || !lottie) return;
    void withBusy('sequence', async () => {
      stageRef.current?.pause();
      const blob = await exportFrameSequenceZip(
        lottie,
        exportJson,
        { width: exportWidth, background, from: frameRange[0], to: frameRange[1] },
        (done, total) => setExportProgress(Math.round((done / total) * 100))
      );
      downloadBlob(blob, `${currentName}_frames.zip`);
    });
  }, [background, currentName, exportJson, exportWidth, frameRange, lottie, withBusy]);

  const doExportWebm = useCallback(() => {
    if (!exportJson || !lottie) return;
    void withBusy('webm', async () => {
      stageRef.current?.pause();
      const blob = await exportWebm(
        lottie,
        exportJson,
        {
          width: exportWidth,
          background,
          from: frameRange[0],
          to: frameRange[1],
          fps: committed.fps || meta.frameRate || 30,
        },
        (done, total) => setExportProgress(Math.round((done / total) * 100))
      );
      downloadBlob(blob, `${currentName}.webm`);
    });
  }, [background, committed.fps, currentName, exportJson, exportWidth, frameRange, lottie, meta.frameRate, withBusy]);

  const copyToClipboard = useCallback(async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(null), 2000);
    } catch {
      setErrorMsg(t.error_clipboard || 'The browser blocked clipboard access');
    }
  }, [t]);

  /** Produces the file the NextStepBar hands to the next tool. */
  const getHandoffResult = useCallback(
    async (kind: 'png' | 'svg' | 'json') => {
      if (!exportJson) return null;
      if (kind === 'json') {
        return {
          blob: new Blob([JSON.stringify(exportJson)], { type: 'application/json' }),
          name: `${currentName}.json`,
        };
      }
      if (kind === 'svg') {
        const blob = exportCurrentSvg(stageRef.current?.getContainer() ?? null, exportJson);
        return blob ? { blob, name: `${currentName}.svg` } : null;
      }
      if (!lottie) return null;
      const frame = stageRef.current?.getFrame() ?? 0;
      const blob = await exportFramePng(lottie, exportJson, frame, { width: exportWidth, background });
      return { blob, name: `${currentName}_frame${frame}.png` };
    },
    [background, currentName, exportJson, exportWidth, lottie]
  );

  // -------------------------------------------------------------------------
  // Derived display values
  // -------------------------------------------------------------------------
  const liveDiagnostics = useMemo(() => (doc ? buildDiagnostics(doc.json) : null), [doc]);
  const embedSnippet = useMemo(
    () =>
      buildEmbedSnippet(embedFlavor, {
        fileName: `${currentName}.json`,
        loop: true,
        speed: 1,
        width: doc?.json.w || 300,
        height: doc?.json.h || 300,
      }),
    [currentName, doc, embedFlavor]
  );

  const steps = [
    { art: StepDropArt, title: t.step1Title || 'Drop the file', text: t.step1Text || '' },
    { art: StepInspectArt, title: t.step2Title || 'Read the report', text: t.step2Text || '' },
    { art: StepRecolorArt, title: t.step3Title || 'Recolour and trim', text: t.step3Text || '' },
    { art: StepExportArt, title: t.step4Title || 'Export or keep going', text: t.step4Text || '' },
  ];

  const featureIcons = [IconLocal, IconPalette, IconLayers, IconShrink, IconFrames, IconReport, IconHandoff];

  const findingTone: Record<Finding['level'], string> = {
    error: 'text-red-300 bg-red-500/10 border-red-500/25',
    warn: 'text-amber-300 bg-amber-500/10 border-amber-500/25',
    info: 'text-slate-300 bg-white/5 border-white/10',
  };

  const renderFindings = (findings: Finding[]) => (
    <ul className="flex flex-col gap-2 list-none p-0 m-0">
      {findings.map((finding, index) => (
        <li
          key={`${finding.key}-${index}`}
          className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-xs leading-relaxed font-medium ${findingTone[finding.level]}`}
        >
          {finding.level === 'info' ? (
            <Info className="w-4 h-4 shrink-0 mt-px" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
          )}
          <span>{interpolate(t[finding.key] || finding.fallback, finding.count)}</span>
        </li>
      ))}
    </ul>
  );

  const panelTitle = (icon: React.ReactNode, label: string, accent = 'text-indigo-400') => (
    <div className="flex items-center gap-2 text-[11px] font-black tracking-[0.2em] text-slate-400 uppercase">
      <span className={accent}>{icon}</span>
      <span>{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#05050a] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white">
      <Header
        onReset={resetEdits}
        currentLang={lang}
        onLanguageChange={l => {
          window.location.href = `/${l.toLowerCase()}/lottie-viewer`;
        }}
        t={t}
      />

      {/* The max width lives on <main> on purpose: AdRail measures this element
          to decide whether the fixed side rails fit. A full-width <main> leaves
          a zero gap and the rails silently never render at any screen size. */}
      <main className="flex-1 flex flex-col gap-10 pt-32 pb-24 px-4 md:px-8 relative z-10 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))]">
        <AdBanner id="adsense-lottie-viewer-top" />

        {/* ================================================================= */}
        {/* Hero                                                              */}
        {/* ================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
          <div className="space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.18em] text-indigo-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.badge_local || '100% in your browser'}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-gradient-to-r from-white via-indigo-200 to-cyan-400 bg-clip-text text-transparent leading-[1.05]">
              {t.seoHeroTitle}
            </h1>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-xl mx-auto lg:mx-0">
              {t.description}
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-2">
              {['.json', '.lottie', '.tgs', '.json.gz'].map(format => (
                <span
                  key={format}
                  className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-slate-400"
                >
                  {format}
                </span>
              ))}
            </div>
          </div>
          <PlayerHeroArt className="w-full max-w-md mx-auto h-auto" animated={!prefersReduced} />
        </section>

        {errorMsg && (
          <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm font-semibold">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-px" />
            <span className="flex-1">{errorMsg}</span>
            <button
              onClick={() => setErrorMsg('')}
              aria-label={t.btn_dismiss || 'Dismiss'}
              className="text-red-300/70 hover:text-red-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ================================================================= */}
        {/* Workspace                                                         */}
        {/* ================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* ---------------------------------------------------------- */}
            {/* Staged file: nothing renders until the user says so         */}
            {/* ---------------------------------------------------------- */}
            {staged && (
              <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col gap-5 border border-indigo-500/20">
                {panelTitle(<IconReport className="w-4 h-4" />, t.label_staged || 'Ready to open')}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-indigo-300 max-w-full truncate">
                    {staged.name}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    {formatBytes(staged.diagnostics.bytes)} · {staged.json.w}×{staged.json.h} ·{' '}
                    {staged.diagnostics.layerCount} {t.meta_layers || 'layers'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/25 text-[10px] font-black uppercase tracking-wider text-cyan-300">
                    {staged.source}
                  </span>
                </div>

                {renderFindings(staged.diagnostics.findings)}

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={openStaged}
                    className="flex-1 min-w-[200px] py-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-white font-bold rounded-2xl cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    {t.btn_open || 'Open in the player'}
                  </button>
                  <button
                    onClick={() => setStaged(null)}
                    className="px-5 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-slate-300 font-bold rounded-2xl cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t.btn_discard || 'Discard'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">
                  {t.staged_hint ||
                    'Nothing has been rendered or modified yet — the file is only parsed and inspected.'}
                </p>
              </div>
            )}

            {/* ---------------------------------------------------------- */}
            {/* Player                                                      */}
            {/* ---------------------------------------------------------- */}
            {doc ? (
              <div className="glass-card rounded-3xl p-5 md:p-7 flex flex-col gap-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-indigo-300 max-w-[min(100%,320px)] truncate">
                    {doc.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={undo}
                      disabled={historyIndex <= 0}
                      title={t.btn_undo || 'Undo'}
                      aria-label={t.btn_undo || 'Undo'}
                      className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      <Undo2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={redo}
                      disabled={historyIndex >= history.length - 1}
                      title={t.btn_redo || 'Redo'}
                      aria-label={t.btn_redo || 'Redo'}
                      className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      <Redo2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDoc(null);
                        resetEdits();
                      }}
                      title={t.btn_close || 'Close'}
                      aria-label={t.btn_close || 'Close'}
                      className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <Stage
                  ref={stageRef}
                  lottie={lottie}
                  json={renderJson}
                  compareJson={hasEdits ? doc.json : null}
                  trim={committed.trim}
                  t={t}
                  onMeta={setMeta}
                  onError={setErrorMsg}
                />
              </div>
            ) : (
              !staged && (
                <div className="glass-card rounded-3xl p-6 md:p-10 flex flex-col gap-6">
                  {panelTitle(<Upload className="w-4 h-4" />, t.label_lottie_file || 'Lottie file')}

                  <div
                    onDrop={onDrop}
                    onDragOver={event => {
                      event.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    className={`relative border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-all ${
                      isDragging
                        ? 'border-indigo-400/70 bg-indigo-500/10'
                        : 'border-white/10 hover:border-indigo-500/40 bg-black/20'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,.lottie,.tgs,.gz,application/json"
                      onChange={event => {
                        const file = event.target.files?.[0];
                        if (file) void stageFile(file);
                        event.target.value = '';
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      aria-label={t.drop_inactive || 'Choose a Lottie file'}
                    />
                    {busyReading ? (
                      <Loader2 className="w-9 h-9 text-indigo-400 mb-3 animate-spin" />
                    ) : (
                      <Upload className="w-9 h-9 text-slate-500 mb-3" />
                    )}
                    <span className="text-sm font-bold text-slate-200">
                      {isDragging ? t.drop_active || 'Drop it' : t.drop_inactive || 'Drag & drop a Lottie file'}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-2 font-mono uppercase tracking-wider">
                      .json · .lottie · .tgs · .json.gz
                    </span>
                  </div>

                  {/* Manual route: skip the file intake and the report entirely. */}
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => setPasteOpen(value => !value)}
                      className="flex items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-bold text-slate-200 cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-cyan-400" />
                        {t.btn_paste || 'Paste the JSON by hand'}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${pasteOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {pasteOpen && (
                      <div className="flex flex-col gap-3">
                        <textarea
                          value={pasteText}
                          onChange={event => setPasteText(event.target.value)}
                          placeholder={t.paste_placeholder || '{"v":"5.5.2","fr":30,...}'}
                          spellCheck={false}
                          className="w-full h-40 rounded-2xl bg-black/40 border border-white/10 p-4 font-mono text-xs text-slate-300 focus:outline-none focus:border-cyan-500/40 resize-y"
                        />
                        <button
                          onClick={openPasted}
                          disabled={!pasteText.trim()}
                          className="py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-white font-bold rounded-2xl cursor-pointer"
                        >
                          {t.btn_open_pasted || 'Open it straight away'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                      {t.label_presets || 'Sample animations'}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {PRESET_KEYS.map(key => (
                        <button
                          key={key}
                          onClick={() => loadPreset(key)}
                          className="text-left px-4 py-3 bg-white/5 border border-white/10 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all rounded-2xl cursor-pointer flex flex-col gap-0.5"
                        >
                          <span className="text-sm font-bold text-slate-200">
                            {t[PRESET_META[key].labelKey] || PRESET_META[key].fallback}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {t[PRESET_META[key].descKey] || PRESET_META[key].descFallback}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )
            )}

            {/* ---------------------------------------------------------- */}
            {/* Palette                                                     */}
            {/* ---------------------------------------------------------- */}
            {doc && (
              <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col gap-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-500" />
                <div className="flex flex-wrap justify-between items-center gap-3">
                  {panelTitle(<IconPalette className="w-4 h-4" />, t.label_layers_colors || 'Colours', 'text-cyan-400')}
                  {Object.keys(edit.colors).length > 0 && (
                    <button
                      onClick={() => setEdit(prev => ({ ...prev, colors: {} }))}
                      className="text-xs text-slate-400 hover:text-cyan-300 transition-colors border border-white/10 bg-white/5 px-3 py-1.5 rounded-lg cursor-pointer font-bold flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      {t.btn_reset_colors || 'Reset colours'}
                    </button>
                  )}
                </div>

                {swatches.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {swatches.map((swatch: ColorSwatch) => {
                        const current = edit.colors[swatch.hex] || swatch.hex;
                        const changed = current !== swatch.hex;
                        return (
                          <label
                            key={swatch.hex}
                            className={`relative flex flex-col gap-2 p-3 rounded-2xl border cursor-pointer transition-all ${
                              changed
                                ? 'bg-cyan-500/10 border-cyan-500/30'
                                : 'bg-black/40 border-white/5 hover:border-cyan-500/25'
                            }`}
                          >
                            <div className="relative w-full h-14 rounded-xl overflow-hidden border border-white/10">
                              <input
                                type="color"
                                value={current}
                                onChange={event => setColor(swatch.hex, event.target.value)}
                                className="absolute inset-[-6px] w-[calc(100%+12px)] h-[calc(100%+12px)] border-none p-0 cursor-pointer"
                                aria-label={`${t.label_layers_colors || 'Colour'} ${swatch.hex}`}
                              />
                              <span
                                className={`absolute bottom-1 right-1.5 text-[10px] font-black font-mono pointer-events-none ${
                                  isLightHex(current) ? 'text-black/60' : 'text-white/70'
                                }`}
                              >
                                {current.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1">
                              {/* A count and a multiplication sign: nothing to
                                  translate, so no dictionary key for it. */}
                              <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                                {swatch.refs.length}×
                              </span>
                              {swatch.kinds.map(kind => (
                                <span
                                  key={kind}
                                  className="text-[9px] uppercase tracking-wider font-black px-1.5 py-0.5 rounded bg-white/5 text-slate-500"
                                >
                                  {t[`kind_${kind}`] || kind}
                                </span>
                              ))}
                              {swatch.animated && (
                                <span className="text-[9px] uppercase tracking-wider font-black px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300">
                                  {t.kind_animated || 'anim'}
                                </span>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium">
                      {t.palette_hint ||
                        'Fills, strokes, gradient stops, animated colour keyframes and solid layers are all editable. Hold Compare on the player to see the original.'}
                    </p>
                  </>
                ) : (
                  <p className="py-4 text-sm text-slate-500 leading-relaxed">
                    {t.palette_empty ||
                      'This animation carries no editable colour values — its visuals probably come from embedded images or effects rather than vector fills.'}
                  </p>
                )}
              </div>
            )}

            {/* ---------------------------------------------------------- */}
            {/* Layer tree                                                  */}
            {/* ---------------------------------------------------------- */}
            {doc && layers.length > 0 && (
              <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col gap-4">
                {panelTitle(<IconLayers className="w-4 h-4" />, t.label_layers_tree || 'Layers')}
                <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-1">
                  {layers.map(layer => {
                    const hidden = committed.hiddenLayers.includes(layer.index) || layer.hidden;
                    return (
                      <div
                        key={layer.index}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition-colors ${
                          hidden ? 'bg-black/40 border-white/5 opacity-50' : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <button
                          onClick={() => toggleLayer(layer.index)}
                          aria-label={hidden ? t.btn_show_layer || 'Show layer' : t.btn_hide_layer || 'Hide layer'}
                          className="text-slate-400 hover:text-white cursor-pointer transition-colors"
                        >
                          {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <span className="flex-1 text-xs font-bold text-slate-200 truncate">{layer.name}</span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 shrink-0">
                          {layer.typeLabel}
                        </span>
                        {layer.hasExpressions && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 shrink-0">
                            fx
                          </span>
                        )}
                        {layer.hasMatte && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 shrink-0">
                            matte
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-600 font-medium">
                  {t.layers_hint ||
                    'Hidden layers stay in the file until you export with "drop hidden layers" enabled in the optimizer.'}
                </p>
              </div>
            )}

            {doc && <NextStepBar lang={lang} t={t} getResult={getHandoffResult} />}
          </div>

          {/* ============================================================= */}
          {/* Sidebar                                                       */}
          {/* ============================================================= */}
          <div className="flex flex-col gap-6">
            {/* Inspector */}
            <div className="glass-card rounded-3xl p-6 flex flex-col gap-4">
              {panelTitle(<Info className="w-4 h-4" />, t.label_metadata || 'Inspector')}
              {doc ? (
                <div className="flex flex-col gap-2 text-xs font-medium">
                  {[
                    [t.meta_version || 'Version', doc.json.v || 'N/A'],
                    [t.meta_dimensions || 'Dimensions', `${doc.json.w || 0} × ${doc.json.h || 0}`],
                    [t.meta_framerate || 'Framerate', `${committed.fps || meta.frameRate} fps`],
                    [
                      t.meta_duration || 'Duration',
                      `${meta.frameRate > 0 ? (meta.totalFrames / meta.frameRate).toFixed(2) : '0.00'} s`,
                    ],
                    [t.meta_total_frames || 'Frames', String(meta.totalFrames)],
                    [t.meta_layers || 'Layers', String(countLayers(doc.json))],
                    [t.meta_size || 'Size', formatBytes(liveDiagnostics?.bytes || 0)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-3 py-1.5 border-b border-white/5">
                      <span className="text-slate-500">{label}</span>
                      <span className="font-mono text-slate-200 text-right truncate">{value}</span>
                    </div>
                  ))}

                  <div className="flex flex-col gap-2 pt-2">
                    <label className="flex items-center justify-between gap-3 text-slate-400">
                      <span>{t.label_fps_override || 'Override fps'}</span>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={committed.fps ?? meta.frameRate}
                        onChange={event => {
                          const value = Number(event.target.value);
                          setEdit(prev => ({ ...prev, fps: value > 0 ? value : null }));
                        }}
                        className="w-20 px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-right font-mono text-slate-200 focus:outline-none focus:border-indigo-500/40"
                      />
                    </label>
                    <label className="flex items-center justify-between gap-3 text-slate-400">
                      <span>{t.label_trim || 'Trim (in / out)'}</span>
                      <span className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={Math.max(0, meta.totalFrames - 1)}
                          value={committed.trim?.[0] ?? 0}
                          onChange={event =>
                            setEdit(prev => ({
                              ...prev,
                              trim: [Number(event.target.value), prev.trim?.[1] ?? Math.max(0, meta.totalFrames - 1)],
                            }))
                          }
                          className="w-14 px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-right font-mono text-slate-200 focus:outline-none focus:border-indigo-500/40"
                        />
                        <input
                          type="number"
                          min={0}
                          max={Math.max(0, meta.totalFrames - 1)}
                          value={committed.trim?.[1] ?? Math.max(0, meta.totalFrames - 1)}
                          onChange={event =>
                            setEdit(prev => ({ ...prev, trim: [prev.trim?.[0] ?? 0, Number(event.target.value)] }))
                          }
                          className="w-14 px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-right font-mono text-slate-200 focus:outline-none focus:border-indigo-500/40"
                        />
                      </span>
                    </label>
                    {(committed.trim || committed.fps) && (
                      <button
                        onClick={() => setEdit(prev => ({ ...prev, trim: null, fps: null }))}
                        className="text-[11px] text-slate-500 hover:text-slate-300 cursor-pointer font-bold text-left"
                      >
                        {t.btn_reset_timing || 'Back to the file’s own timing'}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 leading-relaxed">
                  {t.inspector_empty || 'Open an animation to see its structure.'}
                </p>
              )}
            </div>

            {/* Compatibility report */}
            {doc && liveDiagnostics && (
              <div className="glass-card rounded-3xl p-6 flex flex-col gap-4">
                {panelTitle(<IconReport className="w-4 h-4" />, t.label_report || 'Compatibility')}
                {renderFindings(liveDiagnostics.findings)}
              </div>
            )}

            {/* Optimizer */}
            {doc && (
              <div className="glass-card rounded-3xl p-6 flex flex-col gap-4">
                {panelTitle(<IconShrink className="w-4 h-4" />, t.label_optimize || 'Optimizer')}

                <label className="flex flex-col gap-1.5 text-xs text-slate-400 font-medium">
                  <span className="flex justify-between">
                    <span>{t.opt_precision || 'Decimal precision'}</span>
                    <span className="font-mono text-slate-200">{optimizeOptions.precision}</span>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={6}
                    value={optimizeOptions.precision}
                    onChange={event =>
                      setOptimizeOptions(prev => ({ ...prev, precision: Number(event.target.value) }))
                    }
                    className="h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </label>

                {(
                  [
                    ['dropHidden', t.opt_drop_hidden || 'Drop hidden layers'],
                    ['dropNames', t.opt_drop_names || 'Drop author metadata'],
                    ['dropExpressions', t.opt_drop_expressions || 'Drop expressions'],
                  ] as [keyof OptimizeOptions, string][]
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2.5 text-xs text-slate-300 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(optimizeOptions[key])}
                      onChange={event =>
                        setOptimizeOptions(prev => ({ ...prev, [key]: event.target.checked }))
                      }
                      className="w-4 h-4 accent-indigo-500 cursor-pointer"
                    />
                    {label}
                  </label>
                ))}

                <button
                  onClick={runOptimize}
                  disabled={optimizing}
                  className="py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all text-white font-bold rounded-2xl cursor-pointer flex items-center justify-center gap-2 text-sm"
                >
                  {optimizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  {t.btn_optimize || 'Optimize'}
                </button>

                {optimized && (
                  <div className="rounded-2xl border border-green-500/25 bg-green-500/10 p-3.5 text-xs text-green-200 font-semibold space-y-1">
                    <div className="flex justify-between">
                      <span>{formatBytes(optimized.bytesBefore)}</span>
                      <span>→</span>
                      <span>{formatBytes(optimized.bytesAfter)}</span>
                    </div>
                    <div className="text-center text-lg font-black">
                      −
                      {optimized.bytesBefore > 0
                        ? Math.max(
                            0,
                            Math.round(
                              ((optimized.bytesBefore - optimized.bytesAfter) / optimized.bytesBefore) * 100
                            )
                          )
                        : 0}
                      %
                    </div>
                    {optimized.removedLayers > 0 && (
                      <div className="text-green-300/80">
                        {interpolate(t.opt_removed_layers || '{n} hidden layer(s) removed', optimized.removedLayers)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Export */}
            {doc && (
              <div className="glass-card rounded-3xl p-6 flex flex-col gap-4">
                {panelTitle(<FileDown className="w-4 h-4" />, t.label_export || 'Export')}

                <label className="flex items-center justify-between gap-3 text-xs text-slate-400 font-medium">
                  <span>{t.export_width || 'Raster width'}</span>
                  <input
                    type="number"
                    min={16}
                    max={4096}
                    value={exportWidth}
                    onChange={event => setExportWidth(Math.max(16, Number(event.target.value) || 16))}
                    className="w-24 px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-right font-mono text-slate-200 focus:outline-none focus:border-indigo-500/40"
                  />
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-300 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exportTransparent}
                    onChange={event => setExportTransparent(event.target.checked)}
                    className="w-4 h-4 accent-indigo-500 cursor-pointer"
                  />
                  {t.export_transparent || 'Transparent background'}
                </label>
                {!exportTransparent && (
                  <input
                    type="color"
                    value={exportBg}
                    onChange={event => setExportBg(event.target.value)}
                    aria-label={t.export_bg || 'Export background'}
                    className="w-full h-8 rounded-lg border border-white/10 bg-transparent cursor-pointer p-0"
                  />
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={doExportJson}
                    className="py-2.5 px-2 bg-indigo-600 hover:bg-indigo-500 transition-all text-white font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5 text-xs"
                  >
                    <Braces className="w-3.5 h-3.5" />
                    JSON
                  </button>
                  <button
                    onClick={doExportDotLottie}
                    disabled={exportBusy !== null}
                    className="py-2.5 px-2 bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40 transition-all text-slate-200 font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5 text-xs"
                  >
                    {exportBusy === 'dotlottie' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    .lottie
                  </button>
                  <button
                    onClick={doExportSvg}
                    className="py-2.5 px-2 bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-slate-200 font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5 text-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    SVG
                  </button>
                  <button
                    onClick={doExportPng}
                    disabled={exportBusy !== null}
                    className="py-2.5 px-2 bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40 transition-all text-slate-200 font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5 text-xs"
                  >
                    {exportBusy === 'png' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    PNG
                  </button>
                  <button
                    onClick={doExportSequence}
                    disabled={exportBusy !== null}
                    className="py-2.5 px-2 bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40 transition-all text-slate-200 font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5 text-xs col-span-2"
                  >
                    {exportBusy === 'sequence' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Film className="w-3.5 h-3.5" />
                    )}
                    {t.export_sequence || 'PNG sequence (ZIP)'}
                  </button>
                  {canRecordWebm() && (
                    <button
                      onClick={doExportWebm}
                      disabled={exportBusy !== null}
                      className="py-2.5 px-2 bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40 transition-all text-slate-200 font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5 text-xs col-span-2"
                    >
                      {exportBusy === 'webm' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Film className="w-3.5 h-3.5" />
                      )}
                      {t.export_webm || 'Video (WebM)'}
                    </button>
                  )}
                </div>

                {exportBusy && exportProgress > 0 && (
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                )}

                <button
                  onClick={() => exportJson && copyToClipboard('json', JSON.stringify(exportJson, null, 2))}
                  className="py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-slate-200 font-bold rounded-xl cursor-pointer flex items-center justify-center gap-2 text-xs"
                >
                  {copied === 'json' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-green-400">{t.copied || 'Copied'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      {t.btn_copy_json || 'Copy the JSON'}
                    </>
                  )}
                </button>

                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  {t.export_hint ||
                    'PNG, the sequence and the video are rasterised frame by frame on a canvas in this tab. WebM has no alpha channel, so a transparent export falls back to black.'}
                </p>
              </div>
            )}

            {/* Embed */}
            {doc && (
              <div className="glass-card rounded-3xl p-6 flex flex-col gap-3">
                {panelTitle(<Code2 className="w-4 h-4" />, t.label_embed || 'Embed')}
                <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 gap-1">
                  {(
                    [
                      ['webComponent', t.embed_wc || 'Web'],
                      ['react', t.embed_react || 'React'],
                      ['vanilla', t.embed_vanilla || 'JS'],
                    ] as [EmbedFlavor, string][]
                  ).map(([flavor, label]) => (
                    <button
                      key={flavor}
                      onClick={() => setEmbedFlavor(flavor)}
                      className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        embedFlavor === flavor ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <pre className="rounded-xl bg-black/50 border border-white/5 p-3 text-[10px] leading-relaxed text-slate-400 overflow-x-auto max-h-48">
                  <code>{embedSnippet}</code>
                </pre>
                <button
                  onClick={() => copyToClipboard('embed', embedSnippet)}
                  className="py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-slate-200 font-bold rounded-xl cursor-pointer flex items-center justify-center gap-2 text-xs"
                >
                  {copied === 'embed' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-green-400">{t.copied || 'Copied'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      {t.btn_copy_embed || 'Copy the snippet'}
                    </>
                  )}
                </button>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  {t.embed_hint ||
                    'The player script comes from a CDN; the animation file itself stays on your own server.'}
                </p>
              </div>
            )}
          </div>
        </section>

        <AdBanner id="adsense-lottie-viewer-mid" />

        {/* ================================================================= */}
        {/* How it works                                                      */}
        {/* ================================================================= */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              {t.howItWorksTitle || 'How it works'}
            </h2>
            <div className="h-1 w-16 bg-indigo-500 mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, index) => {
              const Art = step.art;
              return (
                <div
                  key={index}
                  className="relative glass-card rounded-3xl p-6 space-y-4 border border-white/5 hover:border-indigo-500/20 transition-all group"
                >
                  <span className="absolute top-5 right-6 text-5xl font-black text-white/5 group-hover:text-indigo-500/10 transition-colors">
                    {index + 1}
                  </span>
                  <Art className="w-24 h-auto text-indigo-400" />
                  <h3 className="text-base font-bold text-white leading-snug">{step.title}</h3>
                  <p className="text-slate-500 text-[13px] leading-relaxed font-medium">{step.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================================================================= */}
        {/* Features                                                          */}
        {/* ================================================================= */}
        {Array.isArray(t.features) && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {t.features.map((feature: any, index: number) => {
              const Icon = featureIcons[index % featureIcons.length];
              return (
                <div
                  key={index}
                  className="p-7 glass-card rounded-3xl text-left hover:-translate-y-1 transition-all duration-300 group border border-white/5"
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5 group-hover:border-indigo-500/40 transition-all">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-white text-lg font-bold mb-2.5 group-hover:text-indigo-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">{feature.text}</p>
                </div>
              );
            })}
          </section>
        )}

        {/* ================================================================= */}
        {/* SEO copy                                                          */}
        {/* ================================================================= */}
        <section className="space-y-16 text-left">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="space-y-5">
              <div className="inline-block px-4 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 text-[11px] font-black uppercase tracking-[0.2em] border border-indigo-500/20">
                {t.seoKeywords?.[0] || 'Lottie'}
              </div>
              <h2 className="text-2xl md:text-4xl font-black text-white leading-tight tracking-tighter">
                {t.seoBrowserSpeedTitle}
              </h2>
              <p className="text-slate-400 leading-relaxed font-medium">{t.seoBrowserSpeedText}</p>
              <p className="text-slate-400 leading-relaxed font-medium">{t.seoHeroText}</p>
            </div>
            <div className="p-8 md:p-10 rounded-3xl bg-[#0b0a1f] border border-white/5 space-y-8">
              <div className="space-y-3">
                <div className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-3">
                  <span className="w-6 h-px bg-white/20" />
                  {t.seoUseCaseTitle}
                </div>
                <p className="text-slate-400 text-sm leading-relaxed font-medium">{t.seoUseCaseText}</p>
              </div>
              <div className="space-y-3">
                <div className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-3">
                  <span className="w-6 h-px bg-white/20" />
                  {t.seoPrivacyTitle}
                </div>
                <p className="text-slate-400 text-sm leading-relaxed font-medium">{t.seoPrivacyText}</p>
              </div>
            </div>
          </div>

          {/* FAQ */}
          {Array.isArray(t.faq) && (
            <div className="max-w-4xl mx-auto w-full space-y-8">
              <div className="text-center space-y-3">
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{t.faqTitle}</h2>
                <div className="h-1 w-16 bg-indigo-500 mx-auto rounded-full" />
              </div>
              <div className="grid gap-3">
                {t.faq.map((item: any, index: number) => (
                  <details
                    key={index}
                    className="glass-card rounded-2xl px-5 md:px-6 py-5 text-left border border-white/5 hover:border-indigo-500/20 transition-colors group [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex items-start gap-3 cursor-pointer list-none text-base font-bold text-white group-hover:text-indigo-400 transition-colors">
                      <span className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-[11px] font-black">
                        Q
                      </span>
                      <span className="flex-1">{item.question}</span>
                      <span className="shrink-0 text-indigo-400 transition-transform group-open:rotate-45 text-xl leading-none">
                        +
                      </span>
                    </summary>
                    <p className="text-slate-400 leading-relaxed pl-9 pt-3 text-sm">{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(t.seoKeywords) && (
            <div className="max-w-4xl mx-auto w-full space-y-4 opacity-55 text-center">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                {t.seoKeywordsTitle || 'Keywords'}
              </h2>
              <div className="flex flex-wrap justify-center gap-2">
                {t.seoKeywords.map((keyword: string, index: number) => (
                  <span
                    key={index}
                    className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        <AdBanner id="adsense-lottie-viewer-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={modal => setActiveModal(modal)} />

      <LegalModal
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        title={
          activeModal === 'privacy'
            ? legalTranslations[lang]?.privacy.title || 'Privacy Policy'
            : activeModal === 'terms'
              ? legalTranslations[lang]?.terms.title || 'Terms of Service'
              : legalTranslations[lang]?.cookies.title || 'Cookie Policy'
        }
        content={
          activeModal === 'privacy'
            ? legalTranslations[lang]?.privacy.content || ''
            : activeModal === 'terms'
              ? legalTranslations[lang]?.terms.content || ''
              : legalTranslations[lang]?.cookies.content || ''
        }
        t={t}
      />
    </div>
  );
};

export default LottieViewer;
