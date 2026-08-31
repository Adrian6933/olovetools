import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownAZ,
  ArrowRight,
  ArrowUpDown,
  Blend,
  Brackets,
  CaseSensitive,
  Check,
  ClipboardPaste,
  Copy,
  CopyCheck,
  CopyMinus,
  Cpu,
  Dices,
  Download,
  Eraser,
  Eye,
  FileText,
  Filter,
  FoldVertical,
  Gauge,
  Layers,
  ListMinus,
  ListOrdered,
  Loader2,
  Pencil,
  Play,
  Plus,
  Redo2,
  Replace,
  Rows3,
  Ruler,
  ScanText,
  Scissors,
  Shuffle,
  Sparkles,
  TextQuote,
  Trash2,
  Undo2,
  Upload,
  X,
} from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { StepCard } from './components/StepCard';
import { NextStepBar } from './components/NextStepBar';
import {
  IconCollator,
  IconDraw,
  IconLocalOnly,
  IconRecipe,
  IconSets,
  IconShapes,
  IconWorker,
  ListMixerHeroArt,
  StepPaste,
  StepShip,
  StepStack,
  StepTune,
} from './components/Illustrations';
import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';
import { useHandoffIntake } from '../../lib/useHandoff';

import { GROUPS, GROUP_OPS, HAS_INVERSE, NEEDS_LIST_B, RECIPES, buildRecipe, makeStep } from './lib/catalog';
import { useListDoc } from './lib/history';
import {
  DEFAULT_INPUT,
  DEFAULT_OUTPUT,
  JOIN_MODES,
  PRESETS,
  SPLIT_MODES,
  escapeForPreset,
  joinItems,
  matchPreset,
} from './lib/parse';
import { AUTO_LIMIT } from './lib/pipeline';
import { useRunner } from './lib/useRunner';
import type { InputFormat, JoinMode, OpId, OutputFormat, SplitMode, Step } from './types';

interface ListMixerProps {
  lang: string;
  dictionary: any;
}

/** A staged file: read, counted, and waiting for the user to decide. */
interface Staged {
  name: string;
  size: number;
  body: string;
  from: string;
}

/** 8 MB of text. Past this a browser textarea stops being usable at all. */
const MAX_FILE_BYTES = 8 * 1024 * 1024;

const OP_ICONS: Record<OpId, React.ComponentType<{ className?: string }>> = {
  sort: ArrowDownAZ,
  reverse: ArrowUpDown,
  shuffle: Shuffle,
  sample: Dices,
  slice: Rows3,
  trim: Scissors,
  collapse: FoldVertical,
  removeEmpty: Eraser,
  dedupe: CopyMinus,
  onlyDupes: CopyCheck,
  dedupeWords: TextQuote,
  case: CaseSensitive,
  replace: Replace,
  affix: Brackets,
  number: ListOrdered,
  unnumber: ListMinus,
  filter: Filter,
  length: Ruler,
  set: Blend,
};

const FEATURE_ICONS = [IconRecipe, IconCollator, IconSets, IconDraw, IconWorker, IconShapes];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ListMixer({ lang, dictionary }: ListMixerProps) {
  const t = dictionary || {};

  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [source, setSource] = useState('');
  const [listB, setListB] = useState('');
  const [inputFormat, setInputFormat] = useState<InputFormat>(DEFAULT_INPUT);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>(DEFAULT_OUTPUT);
  const [showFormat, setShowFormat] = useState(false);
  const [staged, setStaged] = useState<Staged>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [altHeld, setAltHeld] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const copyTimer = useRef(0);

  // The pipeline starts empty on purpose: opening the tool, pasting a list or
  // arriving from another tool changes nothing about the list. Every operation
  // is something the user added.
  const doc = useListDoc([]);

  const runner = useRunner(source, listB, inputFormat, doc.pipeline, lang || 'en', !doc.manualActive);

  const preset = useMemo(() => matchPreset(outputFormat), [outputFormat]);

  const outputText = useMemo(() => {
    if (doc.manualActive) return doc.manual;
    if (!source) return '';
    return joinItems(escapeForPreset(runner.result.items, preset), outputFormat);
  }, [doc.manualActive, doc.manual, source, runner.result.items, preset, outputFormat]);

  /** What the hold-to-compare button shows: the list as it arrived. */
  const beforeText = useMemo(() => source, [source]);

  const itemsIn = runner.result.itemsIn;
  const itemsOut = doc.manualActive ? 0 : runner.result.items.length;
  const removed = itemsIn - itemsOut;
  const needsListB = doc.pipeline.some(step => step.enabled && NEEDS_LIST_B.indexOf(step.op) !== -1);

  // -------------------------------------------------------------------------
  // Reduced motion
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(query.matches);
    const onChange = () => setPrefersReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  // -------------------------------------------------------------------------
  // Intake: a file is staged, never applied. Same rule for a handoff.
  // -------------------------------------------------------------------------
  const stageFile = useCallback(
    (file: File, from: string) => {
      setError('');
      if (file.size > MAX_FILE_BYTES) {
        setError((t.errTooLarge || 'That file is over {max}.').replace('{max}', formatBytes(MAX_FILE_BYTES)));
        return;
      }
      file
        .text()
        .then(body => setStaged({ name: file.name || 'list.txt', size: file.size, body, from }))
        .catch(() => setError(t.errRead || 'That file could not be read.'));
    },
    [t.errTooLarge, t.errRead]
  );

  // One line, next to the normal intake path, is all "receive from another tool" takes.
  useHandoffIntake((file, from) => stageFile(file, from));

  const acceptStaged = (mode: 'replace' | 'append') => {
    if (!staged) return;
    setSource(current => (mode === 'append' && current ? `${current}\n${staged.body}` : staged.body));
    setStaged(null);
  };

  const stageIntoListB = () => {
    if (!staged) return;
    setListB(staged.body);
    setStaged(null);
  };

  const doPaste = async () => {
    setError('');
    try {
      const text = await navigator.clipboard.readText();
      if (text) setSource(text);
    } catch {
      setError(t.errClipboard || 'The browser refused clipboard access. Use Ctrl+V in the box instead.');
    }
  };

  // -------------------------------------------------------------------------
  // Pipeline editing — every change goes through the history
  // -------------------------------------------------------------------------
  const addStep = useCallback(
    (op: OpId, alt: boolean) => {
      doc.setPipeline([...doc.pipeline, makeStep(op, alt)], `op_${op}`);
    },
    [doc]
  );

  const updateStep = (index: number, next: Step) => {
    const pipeline = doc.pipeline.slice();
    pipeline[index] = next;
    doc.setPipeline(pipeline, `op_${next.op}`);
  };

  const removeStep = (index: number) => {
    const pipeline = doc.pipeline.slice();
    const [gone] = pipeline.splice(index, 1);
    doc.setPipeline(pipeline, `op_${gone.op}`);
  };

  const moveStep = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= doc.pipeline.length) return;
    const pipeline = doc.pipeline.slice();
    const [moved] = pipeline.splice(index, 1);
    pipeline.splice(target, 0, moved);
    doc.setPipeline(pipeline, `op_${moved.op}`);
  };

  const applyRecipe = (key: string) => {
    const recipe = RECIPES.find(entry => entry.key === key);
    if (!recipe) return;
    doc.setPipeline(buildRecipe(recipe.ops), `recipe_${key}`);
  };

  const clearPipeline = () => doc.setPipeline([], 'clearPipeline');

  const resetAll = useCallback(() => {
    setSource('');
    setListB('');
    setStaged(null);
    setError('');
    setInputFormat(DEFAULT_INPUT);
    setOutputFormat(DEFAULT_OUTPUT);
    doc.reset([]);
  }, [doc]);

  // -------------------------------------------------------------------------
  // Manual mode: the escape hatch out of the automation
  // -------------------------------------------------------------------------
  const toggleManual = () => {
    if (doc.manualActive) doc.exitManual();
    else doc.enterManual(outputText);
  };

  // -------------------------------------------------------------------------
  // Output
  // -------------------------------------------------------------------------
  const handleCopy = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // The old version showed "Copied!" here regardless, which is a lie in a
      // non-secure context or with the permission denied.
      setError(t.errCopy || 'The browser blocked the clipboard. Select the text and copy it manually.');
    }
  };

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  const handleDownload = () => {
    if (!outputText) return;
    const blob = new Blob([outputText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `list-mixer-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getResult = useCallback(
    async () => ({
      blob: new Blob([outputText], { type: 'text/plain;charset=utf-8' }),
      name: `list-mixer-${Date.now()}.txt`,
    }),
    [outputText]
  );

  // -------------------------------------------------------------------------
  // Keyboard: undo/redo, run, and Alt as the "inverted operation" modifier
  // -------------------------------------------------------------------------
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey) setAltHeld(true);

      const meta = event.ctrlKey || event.metaKey;
      if (!meta) return;
      const key = event.key.toLowerCase();

      if (key === 'z' && !event.shiftKey) {
        event.preventDefault();
        doc.undo();
      } else if ((key === 'z' && event.shiftKey) || key === 'y') {
        event.preventDefault();
        doc.redo();
      } else if (key === 'enter') {
        event.preventDefault();
        runner.run();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (!event.altKey) setAltHeld(false);
    };
    const onBlur = () => setAltHeld(false);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [doc, runner]);

  // -------------------------------------------------------------------------
  // Drag & drop straight onto the page
  // -------------------------------------------------------------------------
  const [dragging, setDragging] = useState(false);
  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files && event.dataTransfer.files[0];
    if (file) stageFile(file, 'drop');
  };

  // -------------------------------------------------------------------------
  // Content sections
  // -------------------------------------------------------------------------
  const steps = [
    { art: StepPaste, title: t.step1Title, text: t.step1Text },
    { art: StepStack, title: t.step2Title, text: t.step2Text },
    { art: StepTune, title: t.step3Title, text: t.step3Text },
    { art: StepShip, title: t.step4Title, text: t.step4Text },
  ];
  const features = Array.isArray(t.features) ? t.features : [];
  const faqs = Array.isArray(t.faq) ? t.faq : [];
  const keywords: string[] = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];
  const shortcuts = Array.isArray(t.shortcuts) ? t.shortcuts : [];

  const displayedOutput = comparing ? beforeText : outputText;

  return (
    <div
      className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-orange-500/20 selection:text-orange-100 relative"
      onDragOver={event => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <Header
        currentLang={lang}
        onLanguageChange={newLang => {
          window.location.href = `/${newLang.toLowerCase()}/list-mixer`;
        }}
        onReset={resetAll}
        t={t}
      />

      {dragging && (
        <div className="fixed inset-0 z-[90] bg-[#0a0502]/80 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="px-8 py-6 rounded-3xl border-2 border-dashed border-orange-500/60 bg-orange-500/10 text-orange-200 font-black text-sm uppercase tracking-[0.2em]">
            {t.dropHere || 'Drop the list here'}
          </div>
        </div>
      )}

      {/* The width cap lives on <main>: AdRail measures this element to decide
          whether the fixed side rails fit, so a full-width <main> silently
          hides them at every screen size. 440px reserves 160px of rail plus
          24px of air on each side. */}
      {/* pt-36 and not pt-28 on mobile: the header stacks into two rows below
          md (brand + language switcher) and measures 125 px, so 112 px of
          padding left the top ad banner sitting behind it. */}
      <main className="flex-1 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))] px-4 sm:px-6 pt-36 pb-20 flex flex-col gap-16 relative z-10">
        <AdBanner id="adsense-list-mixer-top" />

        {/* ================================================================= */}
        {/* Hero                                                              */}
        {/* ================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex max-w-full items-center gap-2 px-4 py-2 rounded-full bg-orange-950/40 border border-orange-800/40 text-orange-400 text-[11px] font-black tracking-[0.2em] uppercase">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t.badge || 'Local list workbench'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-[1.05] text-balance">
              {t.seoHeroTitle || 'List Sorter, Shuffler & Cleaner'}
            </h1>
            <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
              {t.description || t.seoHeroText}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-xl mx-auto lg:mx-0">
              {(Array.isArray(t.heroPoints) ? t.heroPoints : []).map((point: string, index: number) => (
                <div key={index} className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/5 text-left">
                  <span className="w-6 h-6 shrink-0 bg-orange-500/20 text-orange-300 rounded-lg flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                  <span className="text-slate-300 font-bold text-[13px] leading-snug">{point}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -top-10 -right-10 w-56 h-56 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
            <ListMixerHeroArt
              className="relative w-full max-w-lg mx-auto drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
              animated={!prefersReduced}
            />
          </div>
        </section>

        {/* ================================================================= */}
        {/* Workspace                                                         */}
        {/* ================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* -- lists column ----------------------------------------------- */}
          <div className="lg:col-span-2 space-y-4 min-w-0">
            {staged && (
              <div className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-9 h-9 shrink-0 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-300">
                    <FileText className="w-4 h-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate">{staged.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {formatBytes(staged.size)} ·{' '}
                      {staged.body.split('\n').length.toLocaleString()} {t.linesLabel || 'lines'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStaged(null)}
                    className="p-2 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title={t.stagedDiscard || 'Discard'}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {t.stagedHint || 'Nothing has run yet — decide where this list goes.'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => acceptStaged('replace')}
                    className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black transition-all cursor-pointer"
                  >
                    {t.stagedReplace || 'Use as list A'}
                  </button>
                  <button
                    type="button"
                    onClick={() => acceptStaged('append')}
                    className="px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-black transition-all cursor-pointer"
                  >
                    {t.stagedAppend || 'Append to list A'}
                  </button>
                  <button
                    type="button"
                    onClick={stageIntoListB}
                    className="px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-black transition-all cursor-pointer"
                  >
                    {t.stagedListB || 'Use as list B'}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[12px] text-red-200">
                <span className="flex-1">{error}</span>
                <button type="button" onClick={() => setError('')} className="text-red-300 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* -- toolbar --------------------------------------------------- */}
            <div className="glass-card rounded-3xl border border-white/10 overflow-hidden">
              <div className="flex flex-wrap items-center gap-1.5 px-3 py-2.5 border-b border-white/5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] font-bold text-slate-300 transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.openFile || 'Open file'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => void doPaste()}
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] font-bold text-slate-300 transition-all cursor-pointer"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.pasteText || 'Paste'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSource(String(t.sampleList || ''))}
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] font-bold text-slate-300 transition-all cursor-pointer"
                >
                  <ScanText className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.loadSample || 'Sample'}</span>
                </button>

                <span className="w-px h-6 bg-white/10 mx-0.5" />

                <button
                  type="button"
                  onClick={doc.undo}
                  disabled={!doc.canUndo}
                  title={`${t.undo || 'Undo'} (Ctrl+Z)`}
                  className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={doc.redo}
                  disabled={!doc.canRedo}
                  title={`${t.redo || 'Redo'} (Ctrl+Shift+Z)`}
                  className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={!source}
                  title={t.compareBefore || 'Hold to see the list before any operation'}
                  onMouseDown={() => setComparing(true)}
                  onMouseUp={() => setComparing(false)}
                  onMouseLeave={() => setComparing(false)}
                  onTouchStart={() => setComparing(true)}
                  onTouchEnd={() => setComparing(false)}
                  className={`p-2 rounded-lg border transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                    comparing ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>

                <span className="w-px h-6 bg-white/10 mx-0.5" />

                <button
                  type="button"
                  onClick={toggleManual}
                  title={t.manualHint || 'Edit the result by hand, bypassing the recipe'}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                    doc.manualActive
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                      : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{doc.manualActive ? t.manualOff || 'Back to recipe' : t.manualOn || 'Edit by hand'}</span>
                </button>

                <span className="flex-1" />

                {runner.manualRun && !doc.manualActive && (
                  <button
                    type="button"
                    onClick={runner.run}
                    title={`${t.runNow || 'Run'} (Ctrl+Enter)`}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-black transition-all cursor-pointer"
                  >
                    {runner.busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{runner.busy ? t.running || 'Running…' : t.runNow || 'Run'}</span>
                  </button>
                )}
                {runner.offThread && !runner.manualRun && (
                  <span
                    title={t.workerHint || 'This list is large enough that it runs on a background thread'}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[10px] font-black uppercase tracking-wider"
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t.workerBadge || 'Worker'}</span>
                  </span>
                )}
              </div>

              {/* -- input --------------------------------------------------- */}
              <div className="border-b border-white/5">
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-orange-400" />
                    {t.inputLabel || 'List A'}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                      {t.splitLabel || 'split by'}
                    </span>
                    {SPLIT_MODES.map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setInputFormat({ ...inputFormat, split: mode as SplitMode })}
                        className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-colors cursor-pointer ${
                          inputFormat.split === mode
                            ? 'bg-orange-500/20 border-orange-500/50 text-orange-200'
                            : 'bg-white/[0.03] border-white/10 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {t[`split_${mode}`] || mode}
                      </button>
                    ))}
                    {(inputFormat.split === 'custom' || inputFormat.split === 'regex') && (
                      <input
                        type="text"
                        value={inputFormat.custom}
                        onChange={event => setInputFormat({ ...inputFormat, custom: event.target.value })}
                        placeholder={t.splitCustomPlaceholder || 'separator'}
                        className="w-24 px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-[11px] font-mono text-slate-100 outline-none focus:border-orange-500/50"
                      />
                    )}
                  </div>
                </div>
                <textarea
                  value={source}
                  onChange={event => setSource(event.target.value)}
                  placeholder={t.inputPlaceholder || 'Paste your list here, one item per line…'}
                  spellCheck={false}
                  className="w-full h-56 lg:h-64 px-4 pb-4 bg-transparent border-none outline-none resize-y text-slate-100 placeholder:text-slate-600 text-sm font-mono leading-relaxed"
                />
              </div>

              {/* -- output -------------------------------------------------- */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-orange-400" />
                    {t.outputLabel || 'Result'}
                    {comparing && (
                      <span className="text-amber-300 normal-case tracking-normal font-bold">
                        · {t.beforeBadge || 'before'}
                      </span>
                    )}
                    {doc.manualActive && (
                      <span className="text-amber-300 normal-case tracking-normal font-bold">
                        · {t.manualBadge || 'edited by hand'}
                      </span>
                    )}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {PRESETS.map(entry => (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => setOutputFormat({ ...entry.output })}
                        title={entry.sample}
                        className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-colors cursor-pointer ${
                          preset === entry.id
                            ? 'bg-orange-500/20 border-orange-500/50 text-orange-200'
                            : 'bg-white/[0.03] border-white/10 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {t[`preset_${entry.id}`] || entry.id}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowFormat(value => !value)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-colors cursor-pointer ${
                        showFormat || preset === 'custom'
                          ? 'bg-orange-500/20 border-orange-500/50 text-orange-200'
                          : 'bg-white/[0.03] border-white/10 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {t.preset_custom || 'custom'}
                    </button>
                  </div>
                </div>

                {showFormat && (
                  <div className="px-4 py-3 border-b border-white/5 space-y-2.5 bg-black/20">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                        {t.joinLabel || 'join with'}
                      </span>
                      {JOIN_MODES.map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setOutputFormat({ ...outputFormat, join: mode as JoinMode })}
                          className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-colors cursor-pointer ${
                            outputFormat.join === mode
                              ? 'bg-orange-500/20 border-orange-500/50 text-orange-200'
                              : 'bg-white/[0.03] border-white/10 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {t[`join_${mode}`] || mode}
                        </button>
                      ))}
                      {outputFormat.join === 'custom' && (
                        <input
                          type="text"
                          value={outputFormat.custom}
                          onChange={event => setOutputFormat({ ...outputFormat, custom: event.target.value })}
                          placeholder="\n"
                          className="w-20 px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-[11px] font-mono text-slate-100 outline-none focus:border-orange-500/50"
                        />
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { key: 'itemPrefix', label: t.itemPrefixLabel || 'before item' },
                        { key: 'itemSuffix', label: t.itemSuffixLabel || 'after item' },
                        { key: 'listPrefix', label: t.listPrefixLabel || 'before list' },
                        { key: 'listSuffix', label: t.listSuffixLabel || 'after list' },
                      ].map(field => (
                        <label key={field.key} className="flex flex-col gap-1 min-w-0">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-600 truncate">
                            {field.label}
                          </span>
                          <input
                            type="text"
                            value={(outputFormat as any)[field.key]}
                            onChange={event => setOutputFormat({ ...outputFormat, [field.key]: event.target.value })}
                            className="w-full px-2 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[11px] font-mono text-slate-100 outline-none focus:border-orange-500/50"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <textarea
                  value={displayedOutput}
                  onChange={event => doc.setManual(event.target.value)}
                  readOnly={!doc.manualActive || comparing}
                  placeholder={t.outputPlaceholder || 'Add an operation on the right and the result shows up here…'}
                  spellCheck={false}
                  className={`w-full h-56 lg:h-64 px-4 py-4 bg-transparent border-none outline-none resize-y placeholder:text-slate-600 text-sm font-mono leading-relaxed ${
                    comparing ? 'text-amber-200/80' : doc.manualActive ? 'text-amber-100' : 'text-orange-200'
                  }`}
                />
              </div>

              {/* -- status line -------------------------------------------- */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 border-t border-white/5 bg-black/20">
                <span className="flex items-center gap-2 text-[12px] font-mono tabular-nums">
                  <span className="text-slate-300 font-bold">{itemsIn.toLocaleString()}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-orange-300 font-bold">{itemsOut.toLocaleString()}</span>
                  <span className="text-slate-600">{t.itemsLabel || 'items'}</span>
                </span>
                {removed !== 0 && !doc.manualActive && (
                  <span className="text-[11px] font-mono text-slate-500">
                    {removed > 0 ? '−' : '+'}
                    {Math.abs(removed).toLocaleString()} {t.removedLabel || 'removed'}
                  </span>
                )}
                <span className="text-[11px] font-mono text-slate-600 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5" />
                  {runner.result.ms.toFixed(1)} ms
                </span>
                <span className="text-[11px] font-mono text-slate-600" title={t.historyHint || 'Memory held by undo history'}>
                  {t.historyLabel || 'history'}: {formatBytes(doc.bytes)} · {doc.steps}
                </span>
                {runner.stale && !runner.manualRun && <span className="text-[11px] text-amber-400/80">{t.staleHint || 'updating…'}</span>}

                <span className="flex-1" />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCopy()}
                    disabled={!outputText}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-orange-500/10 border border-white/10 hover:border-orange-500/50 text-slate-300 hover:text-orange-300 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold transition-all cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-orange-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? t.copiedLabel || 'Copied!' : t.copyLabel || 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={!outputText}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 hover:border-orange-500/60 text-orange-300 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t.downloadLabel || 'Download'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* -- list B ------------------------------------------------------ */}
            {(needsListB || listB) && (
              <div className="glass-card rounded-3xl border border-white/10 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                    <Blend className="w-3.5 h-3.5 text-amber-400" />
                    {t.listBTitle || 'List B'}
                  </span>
                  <span className="text-[10px] text-slate-600">{t.listBHint || 'used by the mix operations'}</span>
                </div>
                <textarea
                  value={listB}
                  onChange={event => setListB(event.target.value)}
                  placeholder={t.listBPlaceholder || 'The second list, split the same way as list A…'}
                  spellCheck={false}
                  className="w-full h-36 px-4 py-4 bg-transparent border-none outline-none resize-y text-amber-100/90 placeholder:text-slate-600 text-sm font-mono leading-relaxed"
                />
              </div>
            )}

            <NextStepBar lang={lang} t={t} getResult={getResult} disabled={!outputText} />

            {shortcuts.length > 0 && (
              <div className="rounded-2xl border border-white/5 bg-black/20 px-4 py-3">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-2">
                  {t.shortcutsTitle || 'Shortcuts'}
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                  {shortcuts.map((entry: any, index: number) => (
                    <span key={index} className="text-[11px] text-slate-500">
                      <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-slate-300">
                        {entry.keys}
                      </kbd>{' '}
                      {entry.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* -- recipe column ---------------------------------------------- */}
          <div className="space-y-4 min-w-0">
            {/* Palette */}
            <div className="glass-card rounded-3xl border border-white/10 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  {t.paletteTitle || 'Operations'}
                </span>
                <span className="h-px flex-1 bg-white/5" />
                <span
                  className={`text-[10px] font-black uppercase tracking-wider transition-colors ${
                    altHeld ? 'text-amber-300' : 'text-slate-600'
                  }`}
                >
                  {t.altHint || 'hold Alt = opposite'}
                </span>
              </div>

              {GROUPS.map(group => (
                <div key={group} className="space-y-1.5">
                  <div className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-600">
                    {t[`group_${group}`] || group}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {GROUP_OPS[group].map(op => {
                      const Icon = OP_ICONS[op];
                      const invertible = HAS_INVERSE.indexOf(op) !== -1;
                      return (
                        <button
                          key={op}
                          type="button"
                          onClick={event => addStep(op, event.altKey)}
                          onContextMenu={event => {
                            if (!invertible) return;
                            event.preventDefault();
                            addStep(op, true);
                          }}
                          title={`${t[`op_${op}`] || op}${invertible ? ` · ${t.altHint || 'hold Alt = opposite'}` : ''}`}
                          className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                            altHeld && invertible
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                              : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-orange-500/10 hover:border-orange-500/40 hover:text-orange-200'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[7.5rem]">{t[`op_${op}`] || op}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Recipes */}
            <div className="glass-card rounded-3xl border border-white/10 p-4 space-y-2.5">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                {t.recipesTitle || 'Ready-made recipes'}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {RECIPES.map(recipe => (
                  <button
                    key={recipe.key}
                    type="button"
                    onClick={() => applyRecipe(recipe.key)}
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-orange-500/10 hover:border-orange-500/40 text-slate-300 hover:text-orange-200 text-[11px] font-bold transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate max-w-[9rem]">{t[`recipe_${recipe.key}`] || recipe.key}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* The recipe itself */}
            <div
              className={`glass-card rounded-3xl border p-4 space-y-3 transition-opacity ${
                doc.manualActive ? 'border-white/5 opacity-50' : 'border-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  {t.pipelineTitle || 'Your recipe'}
                </span>
                <span className="h-px flex-1 bg-white/5" />
                {doc.pipeline.length > 0 && (
                  <button
                    type="button"
                    onClick={clearPipeline}
                    title={t.clearPipeline || 'Remove every step'}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {doc.manualActive && (
                <p className="text-[11px] text-amber-300/90 leading-relaxed">
                  {t.manualPaused || 'The recipe is paused while you edit the result by hand.'}
                </p>
              )}

              {doc.pipeline.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center space-y-1.5">
                  <p className="text-[12px] font-bold text-slate-400">{t.pipelineEmpty || 'No operations yet'}</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {t.pipelineEmptyHint || 'Your list is untouched. Pick an operation above and it is added here.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {doc.pipeline.map((step, index) => (
                    <StepCard
                      key={step.id}
                      step={step}
                      stat={runner.result.stats.find(entry => entry.id === step.id)}
                      index={index}
                      total={doc.pipeline.length}
                      t={t}
                      onChange={next => updateStep(index, next)}
                      onRemove={() => removeStep(index)}
                      onMove={delta => moveStep(index, delta)}
                    />
                  ))}
                </div>
              )}

              {source.length > AUTO_LIMIT && (
                <p className="text-[11px] text-amber-300/80 leading-relaxed">
                  {(t.autoRunHint || 'This list is over {limit} characters, so nothing runs until you press Run.').replace(
                    '{limit}',
                    AUTO_LIMIT.toLocaleString()
                  )}
                </p>
              )}
            </div>
          </div>
        </section>

        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.csv,.tsv,.md,.log,.json,text/plain,text/csv"
          className="hidden"
          onChange={event => {
            const file = event.target.files && event.target.files[0];
            if (file) stageFile(file, 'file');
            event.target.value = '';
          }}
        />

        <AdBanner id="adsense-list-mixer-mid" />

        {/* ================================================================= */}
        {/* How it works                                                      */}
        {/* ================================================================= */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">{t.howItWorksTitle || 'How it works'}</h2>
            <div className="h-1 w-16 bg-orange-500 mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, index) => {
              const Art = step.art;
              return (
                <div
                  key={index}
                  className="relative glass-card rounded-3xl p-6 space-y-4 border border-white/5 hover:border-orange-500/20 transition-all group overflow-hidden"
                >
                  <span className="absolute top-4 right-5 text-5xl font-black text-white/5 group-hover:text-orange-500/10 transition-colors">
                    {index + 1}
                  </span>
                  <Art />
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
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature: any, index: number) => {
            const Icon = FEATURE_ICONS[index] || IconLocalOnly;
            return (
              <div key={index} className="p-6 glass-card rounded-3xl border border-white/5 hover:-translate-y-1 transition-all duration-300 group">
                <div className="w-11 h-11 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 mb-4 group-hover:scale-110 group-hover:border-orange-500/40 transition-all">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-white text-base font-bold mb-2 group-hover:text-orange-400 transition-colors">{feature.title}</h3>
                <p className="text-slate-500 text-[13px] leading-relaxed font-medium">{feature.text}</p>
              </div>
            );
          })}
        </section>

        {/* ================================================================= */}
        {/* SEO copy + FAQ                                                    */}
        {/* ================================================================= */}
        <section className="space-y-16 text-left">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="space-y-6">
              {keywords[0] && (
                <div className="inline-block px-4 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 text-[11px] font-black uppercase tracking-[0.2em] border border-orange-500/20">
                  {keywords[0]}
                </div>
              )}
              <h2 className="text-2xl md:text-4xl font-black text-white leading-tight tracking-tight">{t.seoBrowserSpeedTitle}</h2>
              <p className="text-slate-400 text-base leading-relaxed">{t.seoBrowserSpeedText}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(Array.isArray(t.seoHeroList) ? t.seoHeroList : []).map((point: string, index: number) => (
                  <div key={index} className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="w-6 h-6 shrink-0 bg-orange-500/20 text-orange-300 rounded-lg flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                    <span className="text-slate-300 font-bold text-[13px]">{point}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative glass-card rounded-[2.5rem] p-8 py-14 min-h-[340px] flex flex-col items-center justify-center gap-6 text-center overflow-hidden border border-white/5">
              <div className="absolute -top-16 -right-16 w-56 h-56 bg-orange-500/10 rounded-full blur-3xl" />
              <IconLocalOnly className="w-16 h-16 text-orange-400 relative" />
              <div className="space-y-3 max-w-sm relative">
                <h3 className="text-xl font-black text-white tracking-tight leading-tight">{t.seoPrivacyTitle}</h3>
                <p className="text-slate-400 font-medium text-sm leading-relaxed">{t.seoPrivacyText}</p>
              </div>
            </div>
          </div>

          <div className="p-7 md:p-12 rounded-3xl bg-[#170b03] border border-white/5 space-y-8">
            <div className="max-w-3xl space-y-3">
              <h2 className="text-xl md:text-3xl font-black text-white leading-tight">{t.seoSecondaryTitle}</h2>
              <div className="h-1.5 w-20 bg-orange-500 rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-3">
                  <span className="w-6 h-px bg-white/20" />
                  {t.seoUseCaseTitle}
                </div>
                <p className="text-slate-400 text-[15px] leading-relaxed">{t.seoUseCaseText}</p>
              </div>
              <div className="space-y-3">
                <div className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-3">
                  <span className="w-6 h-px bg-white/20" />
                  {t.seoHeroTitle}
                </div>
                <p className="text-slate-400 text-[15px] leading-relaxed">{t.seoHeroText}</p>
              </div>
            </div>
          </div>

          {faqs.length > 0 && (
            <div className="max-w-4xl mx-auto w-full space-y-8">
              <div className="text-center space-y-3">
                <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">{t.faqTitle}</h2>
                <div className="h-1 w-16 bg-orange-500 mx-auto rounded-full" />
              </div>
              <div className="grid gap-3">
                {faqs.map((faq: any, index: number) => (
                  <details
                    key={index}
                    className="glass-card rounded-2xl px-5 py-4 text-left border border-white/5 hover:border-orange-500/20 transition-colors group [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex items-start gap-3 cursor-pointer list-none text-[15px] font-bold text-white group-hover:text-orange-400 transition-colors">
                      <span className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 text-[11px] font-black">
                        Q
                      </span>
                      <span className="flex-1 min-w-0">{faq.question}</span>
                      <span className="shrink-0 text-orange-400 transition-transform group-open:rotate-45 text-xl leading-none">+</span>
                    </summary>
                    <p className="text-slate-400 leading-relaxed pl-9 pt-3 text-sm">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          )}

          {keywords.length > 0 && (
            <div className="max-w-4xl mx-auto w-full space-y-4 opacity-55 text-center">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">{t.seoKeywordsTitle || 'Keywords'}</h2>
              <div className="flex flex-wrap justify-center gap-2">
                {keywords.map((keyword: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 hover:bg-orange-500/10 hover:border-orange-500/20 hover:text-orange-400 transition-all cursor-default"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        <AdBanner id="adsense-list-mixer-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={modal => setActiveModal(modal)} />

      <LegalModal
        isOpen={activeModal === 'privacy'}
        onClose={() => setActiveModal(null)}
        title={legalTranslations[lang]?.nav.privacy || 'Privacy Policy'}
        content={legalTranslations[lang]?.privacy.content || ''}
        t={t}
      />
      <LegalModal
        isOpen={activeModal === 'terms'}
        onClose={() => setActiveModal(null)}
        title={legalTranslations[lang]?.nav.terms || 'Terms of Service'}
        content={legalTranslations[lang]?.terms.content || ''}
        t={t}
      />
      <LegalModal
        isOpen={activeModal === 'cookies'}
        onClose={() => setActiveModal(null)}
        title={legalTranslations[lang]?.nav.cookies || 'Cookie Policy'}
        content={legalTranslations[lang]?.cookies.content || ''}
        t={t}
      />
    </div>
  );
}
