import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createUniqueNamer } from '../../lib/uniqueName';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  ClipboardPaste,
  Download,
  Eye,
  Loader2,
  Redo2,
  RotateCcw,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  Undo2,
  Upload,
} from 'lucide-react';
import JSZip from 'jszip';

import { createTranslator } from '../../locales/meta';
import { AdBanner } from '../../components/shared/AdBanner';
import { useReducedMotion, fadeInUp } from '../../components/shared/motion';
import { useHandoffIntake } from '../../lib/useHandoff';
import { legalTranslations } from '../../locales/legal';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { Inspector } from './components/Inspector';
import { NextStepBar } from './components/NextStepBar';
import {
  CleanerHeroArt,
  EmptyInspectorArt,
  IconFormats,
  IconLocalOnly,
  IconLossless,
  IconNoLocation,
  IconTagPicker,
  IconVerified,
  StepChoose,
  StepDrop,
  StepInspect,
  StepSave,
} from './components/Illustrations';

import {
  buildSelection,
  clean,
  formatBytes,
  inspect,
  type PresetId,
  type Report,
  type Selection,
} from './lib/report';
import { ACCEPT, cleanedName, loadFile, MAX_BYTES, MIME_BY_FORMAT, type IntakeError } from './lib/intake';
import type { ImageFormat } from './lib/containers';

interface EXIFClearProps {
  lang: string;
  dictionary: any;
}

interface CleanOutput {
  blob: Blob;
  name: string;
  verification: Report | null;
  removedBytes: number;
}

interface Item {
  id: string;
  /** The bytes we will re-read at export time. Never held decoded in state. */
  source: Blob;
  name: string;
  format: ImageFormat;
  converted: boolean;
  originalBytes: number;
  previewUrl: string;
  report: Report;
  /** Manual per-file selection. Null means "follow the preset". */
  override: Selection | null;
  result: CleanOutput | null;
  status: 'ready' | 'working' | 'done';
}

/** Waits a turn so React can paint the progress line between two files. */
const yieldToPaint = () => new Promise<void>(resolve => window.setTimeout(resolve, 0));

const cloneSelection = (selection: Selection): Selection => ({
  blocks: new Set(selection.blocks),
  tags: new Set(selection.tags),
  keepOrientation: selection.keepOrientation,
});

export const EXIFClear: React.FC<EXIFClearProps> = ({ lang, dictionary }) => {
  const t = createTranslator(dictionary);
  const prefersReduced = useReducedMotion();

  const [items, setItems] = useState<Item[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preset, setPreset] = useState<PresetId>('full');
  const [keepOrientation, setKeepOrientation] = useState(true);
  const [removeIcc, setRemoveIcc] = useState(false);

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAfter, setShowAfter] = useState(false);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);
  const nextId = useRef(1);

  /** Undo/redo over the selected file's manual selection. Sets of ids only. */
  const historyRef = useRef<{ id: string; past: Selection[]; future: Selection[] }>({
    id: '',
    past: [],
    future: [],
  });
  const [historyTick, setHistoryTick] = useState(0);

  const selected = items.find(item => item.id === selectedId) || null;

  // Object URLs outlive React state unless someone revokes them.
  const itemsRef = useRef<Item[]>(items);
  itemsRef.current = items;
  useEffect(
    () => () => {
      for (const item of itemsRef.current) URL.revokeObjectURL(item.previewUrl);
    },
    []
  );

  // ==========================================================================
  // Intake
  // ==========================================================================
  const errorText = useCallback(
    (kind: IntakeError) => {
      const messages: Record<IntakeError, string> = {
        size: (t.errSize || 'That file is larger than {max}.').replace('{max}', formatBytes(MAX_BYTES)),
        format: t.errFormat || 'Only JPEG, PNG, WebP and HEIC files carry the metadata this tool reads.',
        heic: t.errHeic || 'That HEIC could not be converted. Export it as JPEG from your phone and try again.',
        read: t.errRead || 'That file could not be read.',
      };
      return messages[kind];
    },
    [t]
  );

  const addFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setLoading(true);
      setError(null);

      const added: Item[] = [];
      let failure: string | null = null;

      for (const file of files) {
        const loaded = await loadFile(file);
        if (!loaded.value) {
          failure = errorText(loaded.error || 'read');
          continue;
        }
        const inspection = inspect(loaded.value.bytes);
        if (!inspection) {
          failure = errorText('format');
          continue;
        }
        // Only the report survives this scope: the decoded buffer is dropped so
        // a batch of forty photos does not sit in memory twice over.
        const blob =
          loaded.value.converted || file.size !== loaded.value.bytes.byteLength
            ? new Blob([loaded.value.bytes.slice().buffer], { type: MIME_BY_FORMAT[loaded.value.format] })
            : file;

        added.push({
          id: `f${nextId.current++}`,
          source: blob,
          name: loaded.value.name,
          format: loaded.value.format,
          converted: loaded.value.converted,
          originalBytes: loaded.value.bytes.byteLength,
          previewUrl: URL.createObjectURL(blob),
          report: inspection.report,
          override: null,
          result: null,
          status: 'ready',
        });
        await yieldToPaint();
      }

      setLoading(false);
      if (failure) setError(failure);
      if (added.length === 0) return;

      setItems(prev => [...prev, ...added]);
      setSelectedId(prev => prev ?? added[0].id);
    },
    [errorText]
  );

  useHandoffIntake(file => {
    void addFiles([file]);
  });

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    const files = Array.from(event.dataTransfer?.files || []);
    if (files.length) void addFiles(files);
  };

  const pasteFromClipboard = useCallback(async () => {
    try {
      const entries = await navigator.clipboard.read();
      const files: File[] = [];
      for (const entry of entries) {
        const type = entry.types.find(candidate => candidate.startsWith('image/'));
        if (!type) continue;
        const blob = await entry.getType(type);
        files.push(new File([blob], `pasted-${Date.now()}.${type.split('/')[1] || 'png'}`, { type }));
      }
      if (files.length === 0) {
        setError(t.errNoClipboardImage || 'There is no image in your clipboard.');
        return;
      }
      void addFiles(files);
    } catch {
      setError(t.errClipboardBlocked || 'Your browser blocked clipboard access. Press Ctrl+V over the page instead.');
    }
  }, [addFiles, t]);

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const files = Array.from(event.clipboardData?.files || []).filter(f => f.type.startsWith('image/'));
      if (files.length) {
        event.preventDefault();
        void addFiles(files);
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [addFiles]);

  // ==========================================================================
  // Selection
  // ==========================================================================
  const effectiveSelection = useMemo<Selection>(() => {
    if (!selected) return { blocks: new Set(), tags: new Set(), keepOrientation };
    if (selected.override) return selected.override;
    return buildSelection(selected.report, preset, { keepOrientation, removeIcc });
  }, [selected, preset, keepOrientation, removeIcc]);

  const pushHistory = useCallback((id: string, snapshot: Selection) => {
    const history = historyRef.current;
    if (history.id !== id) {
      history.id = id;
      history.past = [];
      history.future = [];
    }
    history.past.push(cloneSelection(snapshot));
    if (history.past.length > 60) history.past.shift();
    history.future = [];
  }, []);

  const applyOverride = useCallback(
    (mutate: (draft: Selection) => void) => {
      if (!selected) return;
      const base = selected.override ?? effectiveSelection;
      pushHistory(selected.id, base);
      const draft = cloneSelection(base);
      mutate(draft);
      setItems(prev =>
        prev.map(item => (item.id === selected.id ? { ...item, override: draft, result: null } : item))
      );
      if (preset !== 'custom') setPreset('custom');
      setShowAfter(false);
      setHistoryTick(tick => tick + 1);
    },
    [selected, effectiveSelection, pushHistory, preset]
  );

  const toggleTags = useCallback(
    (ids: string[], remove: boolean) => {
      applyOverride(draft => {
        for (const id of ids) {
          if (remove) draft.tags.add(id);
          else draft.tags.delete(id);
        }
      });
    },
    [applyOverride]
  );

  const toggleBlocks = useCallback(
    (ids: string[], remove: boolean) => {
      applyOverride(draft => {
        for (const id of ids) {
          if (remove) draft.blocks.add(id);
          else draft.blocks.delete(id);
        }
      });
    },
    [applyOverride]
  );

  const setOverride = useCallback(
    (selection: Selection | null) => {
      if (!selected) return;
      setItems(prev =>
        prev.map(item => (item.id === selected.id ? { ...item, override: selection, result: null } : item))
      );
      setShowAfter(false);
    },
    [selected]
  );

  const undo = useCallback(() => {
    const history = historyRef.current;
    if (!selected || history.id !== selected.id || history.past.length === 0) return;
    const previous = history.past.pop()!;
    history.future.push(cloneSelection(selected.override ?? effectiveSelection));
    setOverride(previous);
    setHistoryTick(tick => tick + 1);
  }, [selected, effectiveSelection, setOverride]);

  const redo = useCallback(() => {
    const history = historyRef.current;
    if (!selected || history.id !== selected.id || history.future.length === 0) return;
    const next = history.future.pop()!;
    history.past.push(cloneSelection(selected.override ?? effectiveSelection));
    setOverride(next);
    setHistoryTick(tick => tick + 1);
  }, [selected, effectiveSelection, setOverride]);

  const choosePreset = (next: PresetId) => {
    setPreset(next);
    setShowAfter(false);
    // Switching preset is a fresh start: manual tweaks stop applying.
    setItems(prev => prev.map(item => ({ ...item, override: null, result: null })));
    historyRef.current = { id: '', past: [], future: [] };
    setHistoryTick(tick => tick + 1);
  };

  // ==========================================================================
  // Cleaning
  // ==========================================================================
  const cleanOne = useCallback(
    async (item: Item): Promise<CleanOutput | null> => {
      const bytes = new Uint8Array(await item.source.arrayBuffer());
      const inspection = inspect(bytes);
      if (!inspection) return null;
      const selection =
        item.override ?? buildSelection(inspection.report, preset, { keepOrientation, removeIcc });
      const result = clean(inspection, selection);
      return {
        blob: new Blob([result.bytes.slice().buffer], { type: MIME_BY_FORMAT[item.format] }),
        name: cleanedName(item.name),
        verification: result.verification,
        removedBytes: result.removedBytes,
      };
    },
    [preset, keepOrientation, removeIcc]
  );

  const runClean = useCallback(async () => {
    if (busy || items.length === 0) return;
    setBusy(true);
    setError(null);
    setShowAfter(true);

    const current = itemsRef.current;
    for (let index = 0; index < current.length; index++) {
      const item = current[index];
      setProgress({ current: index + 1, total: current.length, name: item.name });
      // Yield first: without it every setProgress in the loop batches into one
      // paint at the end and the progress line never actually moves.
      await yieldToPaint();
      try {
        const output = await cleanOne(item);
        setItems(prev =>
          prev.map(entry => (entry.id === item.id ? { ...entry, result: output, status: 'done' } : entry))
        );
      } catch {
        setItems(prev => prev.map(entry => (entry.id === item.id ? { ...entry, status: 'ready' } : entry)));
        setError(t.errClean || 'One of the files could not be rewritten and was left untouched.');
      }
    }

    setProgress(null);
    setBusy(false);
  }, [busy, items.length, cleanOne, t]);

  const download = useCallback(async () => {
    const ready = itemsRef.current.filter(item => item.result);
    if (ready.length === 0) return;

    const save = (blob: Blob, name: string) => {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    };

    if (ready.length === 1) {
      save(ready[0].result!.blob, ready[0].result!.name);
      return;
    }

    const zip = new JSZip();
    const uniqueName = createUniqueNamer();
    for (const item of ready) zip.file(uniqueName(item.result!.name), item.result!.blob);
    save(await zip.generateAsync({ type: 'blob' }), 'cleaned-images.zip');
  }, []);

  const removeItem = useCallback(
    (id: string) => {
      const target = itemsRef.current.find(item => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      setItems(prev => {
        const next = prev.filter(item => item.id !== id);
        setSelectedId(current => (current === id ? (next[0]?.id ?? null) : current));
        return next;
      });
    },
    []
  );

  const clearAll = useCallback(() => {
    for (const item of itemsRef.current) URL.revokeObjectURL(item.previewUrl);
    setItems([]);
    setSelectedId(null);
    setError(null);
    setShowAfter(false);
    historyRef.current = { id: '', past: [], future: [] };
  }, []);

  const resetAll = useCallback(() => {
    clearAll();
    setPreset('full');
    setKeepOrientation(true);
    setRemoveIcc(false);
  }, [clearAll]);

  // ==========================================================================
  // Keyboard
  // ==========================================================================
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      const meta = event.ctrlKey || event.metaKey;

      if (meta && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if (meta && event.key === 'Enter') {
        event.preventDefault();
        void runClean();
        return;
      }
      if (!meta && (event.key === 'Delete' || event.key === 'Backspace') && selectedId) {
        event.preventDefault();
        removeItem(selectedId);
        return;
      }
      if (!meta && (event.key === 'ArrowDown' || event.key === 'ArrowUp') && items.length > 1) {
        event.preventDefault();
        const index = items.findIndex(item => item.id === selectedId);
        const next = (index + (event.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length;
        setSelectedId(items[next].id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, runClean, removeItem, selectedId, items]);

  // ==========================================================================
  // Derived view data
  // ==========================================================================
  const totals = useMemo(() => {
    let metadata = 0;
    let tags = 0;
    let gps = 0;
    for (const item of items) {
      metadata += item.report.metadataBytes;
      tags += item.report.tags.length;
      if (item.report.gps) gps++;
    }
    return { metadata, tags, gps };
  }, [items]);

  const cleanedCount = items.filter(item => item.result).length;
  const savedBytes = items.reduce((sum, item) => sum + (item.result?.removedBytes ?? 0), 0);
  const leftoverTags = items.reduce(
    (sum, item) => sum + (item.result?.verification?.tags.length ?? 0),
    0
  );

  const canUndo =
    !!selected && historyRef.current.id === selected.id && historyRef.current.past.length > 0;
  const canRedo =
    !!selected && historyRef.current.id === selected.id && historyRef.current.future.length > 0;
  void historyTick; // the counter exists purely to re-render the undo buttons

  const shownReport = showAfter && selected?.result?.verification ? selected.result.verification : selected?.report;

  const presets: { id: PresetId; title: string; text: string }[] = [
    {
      id: 'full',
      title: t.presetFull || 'Remove everything',
      text: t.presetFullDesc || 'Exif, GPS, XMP, IPTC, comments and the embedded preview.',
    },
    {
      id: 'gps',
      title: t.presetGps || 'Location only',
      text: t.presetGpsDesc || 'Deletes the GPS tags and rebuilds the Exif block with everything else intact.',
    },
    {
      id: 'identity',
      title: t.presetIdentity || 'Keep the photography',
      text:
        t.presetIdentityDesc ||
        'Drops coordinates, serial numbers, owner names and edit history; keeps exposure, lens and dates.',
    },
    {
      id: 'custom',
      title: t.presetCustom || 'Manual',
      text: t.presetCustomDesc || 'Nothing is removed until you tick it yourself, tag by tag.',
    },
  ];

  const steps = [
    { art: StepDrop, title: t.step1Title || 'Bring the photos in', text: t.step1Text || '' },
    { art: StepInspect, title: t.step2Title || 'Read what is inside', text: t.step2Text || '' },
    { art: StepChoose, title: t.step3Title || 'Choose what goes', text: t.step3Text || '' },
    { art: StepSave, title: t.step4Title || 'Clean and check', text: t.step4Text || '' },
  ];

  const featureIcons = [IconNoLocation, IconTagPicker, IconLossless, IconLocalOnly, IconFormats, IconVerified];
  const features = Array.isArray(t.features) ? t.features : [];
  const faqs = Array.isArray(t.faq) ? t.faq : [];
  const keywords = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];

  // ==========================================================================
  // Render
  // ==========================================================================
  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-slate-200 font-sans relative overflow-x-hidden">
      <Header
        currentLang={lang}
        onLanguageChange={next => (window.location.href = `/${next.toLowerCase()}/exif-clear`)}
        onReset={resetAll}
        t={t}
      />

      {/* The max width lives on <main>: AdRail measures this element to decide
          whether the fixed side rails have room. With a plain w-full it measured
          a zero gap and the rails never rendered at any window size. */}
      <main className="flex-1 flex flex-col items-center pt-36 pb-32 px-4 md:px-12 relative z-10 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))]">
        <AdBanner id="adsense-exif-clear-top" />

        <div className="w-full space-y-20 md:space-y-28">
          {/* ================================================================ */}
          {/* Hero                                                             */}
          {/* ================================================================ */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center pt-2">
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex max-w-full items-center gap-2 px-4 py-2 rounded-full bg-emerald-950/40 border border-emerald-800/30 text-emerald-400 text-[11px] font-black tracking-[0.2em] uppercase shadow-[0_0_25px_rgba(16,185,129,0.15)]">
                <Shield className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.badge || 'Image metadata cleaner'}</span>
              </div>

              <h1 className="text-4xl md:text-6xl xl:text-7xl font-black tracking-tight leading-[0.95] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-400">
                {t.title}
              </h1>

              <p className="text-slate-400 text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">{t.description}</p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                {(t.seoHeroList || []).slice(0, 3).map((point: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-300"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                    {point}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/10 blur-[80px] rounded-full" />
              <CleanerHeroArt
                className="relative w-full max-w-lg mx-auto drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
                animated={!prefersReduced}
              />
            </div>
          </section>

          {/* ================================================================ */}
          {/* Workspace                                                        */}
          {/* ================================================================ */}
          <section
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
            onDragEnter={event => {
              event.preventDefault();
              dragDepth.current++;
              setDragging(true);
            }}
            onDragOver={event => event.preventDefault()}
            onDragLeave={event => {
              event.preventDefault();
              dragDepth.current--;
              if (dragDepth.current <= 0) setDragging(false);
            }}
            onDrop={onDrop}
          >
            {/* ---------------------------------------------------- files */}
            <div className="lg:col-span-4 space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT}
                multiple
                className="hidden"
                onChange={event => {
                  const files = Array.from(event.target.files || []);
                  if (files.length) void addFiles(files);
                  event.target.value = '';
                }}
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className={`rounded-3xl border-2 border-dashed p-7 text-center flex flex-col items-center gap-3 cursor-pointer transition-all ${
                  dragging
                    ? 'border-emerald-500/60 bg-emerald-500/5'
                    : 'border-white/10 hover:border-emerald-500/40 bg-black/20 hover:bg-black/40'
                }`}
              >
                {loading ? (
                  <Loader2 className="w-9 h-9 text-emerald-400 animate-spin" />
                ) : (
                  <Upload className="w-9 h-9 text-emerald-400/70" />
                )}
                <span className="text-sm font-bold text-white">{t.dropTitle || 'Drop your photos here'}</span>
                <span className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-[15rem]">
                  {t.dropHint || 'JPEG, PNG, WebP and iPhone HEIC — or press Ctrl+V anywhere on this page'}
                </span>
                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[11px] font-bold">
                    {t.browseBtn || 'Choose files'}
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={event => {
                      event.stopPropagation();
                      void pasteFromClipboard();
                    }}
                    onKeyDown={event => {
                      if (event.key === 'Enter') {
                        event.stopPropagation();
                        void pasteFromClipboard();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-[11px] font-bold hover:bg-white/10 transition-all"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    {t.pasteBtn || 'Paste'}
                  </span>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-[11px] text-amber-300 leading-relaxed">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="flex-1">{error}</span>
                  <button
                    onClick={() => setError(null)}
                    className="text-amber-400/60 hover:text-amber-300 font-black cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              )}

              <div className="rounded-3xl border border-white/5 bg-black/25 overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 truncate">
                    {t.filesTitle || 'Queue'} {items.length > 0 && `· ${items.length}`}
                  </span>
                  {items.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-rose-400 hover:text-rose-300 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                      {t.clearAllBtn || 'Clear'}
                    </button>
                  )}
                </div>

                {items.length === 0 ? (
                  <div className="px-6 py-10 flex flex-col items-center gap-3 text-center">
                    <EmptyInspectorArt className="w-20 h-20 text-emerald-400/60" animated={!prefersReduced} />
                    <span className="text-xs font-bold text-slate-400">{t.noFiles || 'Nothing queued yet'}</span>
                    <span className="text-[11px] text-slate-600 leading-relaxed max-w-[16rem]">
                      {t.noFilesHint ||
                        'Adding a photo only reads its headers. Nothing is rewritten until you press the button.'}
                    </span>
                  </div>
                ) : (
                  <div className="max-h-[420px] overflow-y-auto divide-y divide-white/5">
                    {items.map(item => {
                      const active = item.id === selectedId;
                      const badge = item.report.gps
                        ? { label: t.badgeGps || 'GPS', className: 'bg-rose-500/10 text-rose-400 border-rose-500/20' }
                        : item.report.tags.length || item.report.blocks.length
                          ? {
                              label: ((item.report.tags.length === 1 && t.badgeTags_one) || t.badgeTags || '{n} tags').replace('{n}', String(item.report.tags.length)),
                              className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                            }
                          : { label: t.badgeClean || 'Clean', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            setSelectedId(item.id);
                            setShowAfter(false);
                          }}
                          className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors group ${
                            active ? 'bg-emerald-500/[0.07]' : 'hover:bg-white/[0.03]'
                          }`}
                        >
                          <img
                            src={item.previewUrl}
                            alt=""
                            loading="lazy"
                            className="w-11 h-11 rounded-lg object-cover bg-black/50 border border-white/10 shrink-0"
                          />
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-xs font-bold text-white truncate">{item.name}</p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded border leading-none ${badge.className}`}
                              >
                                {badge.label}
                              </span>
                              <span className="text-[10px] text-slate-600 font-mono">
                                {formatBytes(item.originalBytes)}
                              </span>
                              {item.override && (
                                <span className="text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 leading-none">
                                  {t.customBadge || 'custom'}
                                </span>
                              )}
                              {item.result && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wide text-emerald-400">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  {t.doneBadge || 'done'}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={event => {
                              event.stopPropagation();
                              removeItem(item.id);
                            }}
                            aria-label={t.removeFile || 'Remove'}
                            className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {items.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: t.statFiles || 'Files', value: String(items.length) },
                    { label: t.statTags || 'Tags', value: String(totals.tags) },
                    { label: t.statMetadata || 'Metadata', value: formatBytes(totals.metadata) },
                  ].map(stat => (
                    <div key={stat.label} className="rounded-2xl border border-white/5 bg-black/25 px-3 py-3 text-center">
                      <p className="text-sm font-black text-white truncate">{stat.value}</p>
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-600 truncate">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ------------------------------------------------ inspector */}
            <div className="lg:col-span-8 space-y-4">
              <div className="glass-card rounded-3xl p-5 md:p-7 space-y-5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                    {showAfter ? t.afterLabel || 'After cleaning' : t.inspectorTitle || 'What is inside'}
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selected?.result && (
                      <button
                        onMouseDown={() => setShowAfter(true)}
                        onMouseUp={() => setShowAfter(false)}
                        onMouseLeave={() => setShowAfter(false)}
                        onTouchStart={() => setShowAfter(true)}
                        onTouchEnd={() => setShowAfter(false)}
                        onClick={event => event.preventDefault()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] font-bold text-slate-300 transition-all cursor-pointer select-none"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {t.compareBtn || 'Hold to see the result'}
                      </button>
                    )}
                    <button
                      onClick={undo}
                      disabled={!canUndo}
                      aria-label={t.undoLabel || 'Undo'}
                      className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={redo}
                      disabled={!canRedo}
                      aria-label={t.redoLabel || 'Redo'}
                      className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Redo2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {!selected || !shownReport ? (
                  <div className="py-14 flex flex-col items-center gap-4 text-center">
                    <EmptyInspectorArt className="w-28 h-28 text-emerald-400/50" animated={!prefersReduced} />
                    <p className="text-sm font-bold text-slate-400 max-w-sm">
                      {t.emptyInspector ||
                        'Add a photo and every tag hidden inside it shows up here — before anything is changed.'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-4 flex-wrap">
                      <img
                        src={selected.previewUrl}
                        alt=""
                        className="w-24 h-24 rounded-2xl object-cover bg-black/50 border border-white/10 shrink-0"
                      />
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <p className="text-sm font-bold text-white break-all">{selected.name}</p>
                        <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-slate-500">
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 uppercase">
                            {selected.format}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
                            {formatBytes(selected.originalBytes)}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
                            {(t.metaSize || 'metadata {n}').replace('{n}', formatBytes(shownReport.metadataBytes))}
                          </span>
                        </div>
                        {selected.converted && (
                          <p className="text-[11px] text-amber-400/90 leading-relaxed">
                            {t.convertedNote ||
                              'HEIC files have to be re-encoded to JPEG before they can be rewritten, so this one is not byte-identical to the original.'}
                          </p>
                        )}
                        {!shownReport.ok && (
                          <p className="text-[11px] text-amber-400/90 leading-relaxed">
                            {t.partialScan ||
                              'The byte scan stopped early on this file, so the list below may be incomplete.'}
                          </p>
                        )}
                      </div>
                    </div>

                    {showAfter && selected.result && (
                      <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div className="space-y-1 min-w-0">
                          <p className="text-sm font-bold text-white">
                            {(t.verifiedTitle || '{n} of metadata removed').replace(
                              '{n}',
                              formatBytes(selected.result.removedBytes)
                            )}
                          </p>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            {t.verifiedText ||
                              'This is not what we intended to remove — it is what a fresh parse of the finished file actually found.'}
                          </p>
                        </div>
                      </div>
                    )}

                    <Inspector
                      report={shownReport}
                      selection={showAfter ? { blocks: new Set(), tags: new Set(), keepOrientation } : effectiveSelection}
                      onToggleTags={showAfter ? () => {} : toggleTags}
                      onToggleBlocks={showAfter ? () => {} : toggleBlocks}
                      t={t}
                    />
                  </>
                )}
              </div>

              {/* ------------------------------------------------ controls */}
              <div className="glass-card rounded-3xl p-5 md:p-7 space-y-5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                    {t.presetTitle || 'What to remove'}
                  </h2>
                  {selected?.override && (
                    <button
                      onClick={() => setOverride(null)}
                      className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-white transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      {t.resetSelection || 'Back to the preset'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {presets.map(option => (
                    <button
                      key={option.id}
                      onClick={() => choosePreset(option.id)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        preset === option.id
                          ? 'bg-emerald-500/10 border-emerald-500/60'
                          : 'bg-black/30 border-white/5 hover:border-white/15'
                      }`}
                    >
                      <span className="flex items-center gap-2 mb-1.5">
                        <span
                          className={`w-3.5 h-3.5 rounded-full border-[3px] shrink-0 ${
                            preset === option.id ? 'border-emerald-400 bg-emerald-400/30' : 'border-white/20'
                          }`}
                        />
                        <span className="text-xs font-black text-white">{option.title}</span>
                      </span>
                      <span className="block text-[11px] text-slate-500 leading-relaxed">{option.text}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  {[
                    {
                      checked: keepOrientation,
                      toggle: () => setKeepOrientation(value => !value),
                      title: t.optKeepOrientation || 'Keep the rotation flag',
                      text:
                        t.optKeepOrientationHint ||
                        'Writes back a 30-byte Exif block holding nothing but Orientation, so portrait shots do not come out sideways.',
                    },
                    {
                      checked: removeIcc,
                      toggle: () => setRemoveIcc(value => !value),
                      title: t.optRemoveIcc || 'Also remove the colour profile',
                      text:
                        t.optRemoveIccHint ||
                        'The ICC profile is not personal data and dropping it can visibly shift colours, so it stays by default.',
                    },
                  ].map(option => (
                    <button
                      key={option.title}
                      onClick={() => {
                        option.toggle();
                        setItems(prev => prev.map(item => ({ ...item, result: null })));
                        setShowAfter(false);
                      }}
                      className="w-full flex items-start gap-3 p-3.5 rounded-2xl border border-white/5 bg-black/25 hover:bg-white/[0.03] text-left transition-colors cursor-pointer"
                    >
                      <span
                        className={`mt-0.5 w-4 h-4 shrink-0 rounded-[5px] border flex items-center justify-center transition-all ${
                          option.checked
                            ? 'bg-emerald-500 border-emerald-400 text-black'
                            : 'border-white/20 bg-black/40'
                        }`}
                      >
                        {option.checked && <Check className="w-3 h-3 stroke-[3.5]" />}
                      </span>
                      <span className="min-w-0 space-y-1">
                        <span className="block text-xs font-bold text-white">{option.title}</span>
                        <span className="block text-[11px] text-slate-500 leading-relaxed">{option.text}</span>
                      </span>
                    </button>
                  ))}
                </div>

                {progress && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400">
                      <span className="truncate">{progress.name}</span>
                      <span className="shrink-0 font-mono">
                        {progress.current}/{progress.total}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-[width] duration-200"
                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => void runClean()}
                    disabled={items.length === 0 || busy}
                    className="flex-1 py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-white font-black text-sm uppercase tracking-wide transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 disabled:shadow-none"
                  >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span className="truncate">
                      {busy
                        ? t.cleaningLabel || 'Cleaning…'
                        : ((items.length === 1 && t.cleanBtn_one) || t.cleanBtn || 'Clean {n} files').replace('{n}', String(items.length))}
                    </span>
                  </button>

                  <button
                    onClick={() => void download()}
                    disabled={cleanedCount === 0}
                    className="flex-1 py-4 px-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed text-emerald-300 font-black text-sm uppercase tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2.5"
                  >
                    <Download className="w-4 h-4" />
                    <span className="truncate">
                      {cleanedCount > 1 ? t.downloadZipBtn || 'Download .zip' : t.downloadBtn || 'Download'}
                    </span>
                  </button>
                </div>

                {cleanedCount > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { label: t.statCleaned || 'Cleaned', value: `${cleanedCount}/${items.length}` },
                      { label: t.statSaved || 'Bytes dropped', value: formatBytes(savedBytes) },
                      {
                        label: t.statLeftover || 'Tags left',
                        value: String(leftoverTags),
                        good: leftoverTags === 0,
                      },
                    ].map(stat => (
                      <div
                        key={stat.label}
                        className="rounded-2xl border border-white/5 bg-black/25 px-3 py-3 text-center"
                      >
                        <p
                          className={`text-sm font-black truncate ${
                            'good' in stat && stat.good ? 'text-emerald-400' : 'text-white'
                          }`}
                        >
                          {stat.value}
                        </p>
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-600 truncate">
                          {stat.label}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-slate-600 leading-relaxed">
                  {t.shortcutsHint ||
                    'Ctrl+Enter cleans, Ctrl+Z and Ctrl+Shift+Z undo and redo your tag picks, ↑ ↓ walk the queue, Del removes a file, Ctrl+V pastes one in.'}
                </p>
              </div>

              {selected && (
                <NextStepBar
                  lang={lang}
                  t={t}
                  getResult={async () => {
                    const output = selected.result ?? (await cleanOne(selected));
                    return output ? { blob: output.blob, name: output.name } : null;
                  }}
                />
              )}
            </div>
          </section>

          {/* ================================================================ */}
          {/* How it works                                                     */}
          {/* ================================================================ */}
          <section className="space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                {t.howItWorksTitle || 'How it works'}
              </h2>
              <div className="h-1 w-16 bg-emerald-500 mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {steps.map((step, index) => {
                const Art = step.art;
                return (
                  <div
                    key={index}
                    className="relative glass-card rounded-3xl p-6 space-y-4 border border-white/5 hover:border-emerald-500/20 transition-all group"
                  >
                    <span className="absolute top-5 right-6 text-5xl font-black text-white/5 group-hover:text-emerald-500/10 transition-colors">
                      {index + 1}
                    </span>
                    <Art className="w-24 h-auto text-emerald-400" />
                    <h3 className="text-base font-bold text-white leading-snug">{step.title}</h3>
                    <p className="text-slate-500 text-[13px] leading-relaxed font-medium">{step.text}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ================================================================ */}
          {/* Features                                                         */}
          {/* ================================================================ */}
          <motion.section
            initial={prefersReduced ? false : 'hidden'}
            whileInView={prefersReduced ? undefined : 'visible'}
            viewport={{ once: true, amount: 0.15 }}
            variants={fadeInUp}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {features.map((feature: any, index: number) => {
              const Icon = featureIcons[index] || IconNoLocation;
              return (
                <div
                  key={index}
                  className="p-7 glass-card rounded-3xl text-left hover:-translate-y-1.5 transition-all duration-300 group border border-white/5"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 group-hover:border-emerald-500/40 transition-all">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-white text-lg font-bold mb-2.5 group-hover:text-emerald-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">{feature.text}</p>
                </div>
              );
            })}
          </motion.section>

          {/* ================================================================ */}
          {/* SEO content                                                      */}
          {/* ================================================================ */}
          <section className="space-y-24 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-24 items-center">
              <div className="space-y-7">
                {keywords[0] && (
                  <div className="inline-block px-4 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[11px] font-black uppercase tracking-[0.2em] border border-emerald-500/20">
                    {keywords[0]}
                  </div>
                )}
                <h2 className="text-3xl md:text-5xl font-black text-white leading-[1.05] tracking-tighter">
                  {t.seoHeroTitle}
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed font-medium">{t.seoHeroText}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(t.seoHeroList || []).map((point: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all"
                    >
                      <span className="w-7 h-7 shrink-0 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                      <span className="text-slate-300 font-bold text-sm">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative glass-card rounded-[3rem] p-10 py-16 min-h-[400px] flex flex-col items-center justify-center gap-7 text-center overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl" />
                <IconLossless className="w-20 h-20 text-emerald-400 relative" />
                <div className="space-y-3 max-w-sm relative">
                  <h3 className="text-2xl font-black text-white tracking-tight leading-tight">
                    {t.seoBrowserSpeedTitle}
                  </h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">{t.seoBrowserSpeedText}</p>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-14 rounded-3xl md:rounded-[2.5rem] bg-[#04140f] border border-white/5 space-y-10">
              <div className="max-w-4xl space-y-4">
                <h2 className="text-2xl md:text-4xl font-black text-white leading-tight">{t.seoSecondaryTitle}</h2>
                <div className="h-1.5 w-20 bg-emerald-500 rounded-full" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <div className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-3">
                    <span className="w-6 h-px bg-white/20" />
                    {t.seoUseCaseTitle}
                  </div>
                  <p className="text-slate-400 text-base leading-relaxed font-medium">{t.seoUseCaseText}</p>
                </div>
                <div className="space-y-3">
                  <div className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-3">
                    <span className="w-6 h-px bg-white/20" />
                    {t.seoPrivacyTitle}
                  </div>
                  <p className="text-slate-400 text-base leading-relaxed font-medium">{t.seoPrivacyText}</p>
                </div>
              </div>
            </div>

            {faqs.length > 0 && (
              <div className="max-w-4xl mx-auto w-full space-y-10">
                <div className="text-center space-y-3">
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{t.faqTitle}</h2>
                  <div className="h-1 w-16 bg-emerald-500 mx-auto rounded-full" />
                </div>
                <div className="grid gap-3">
                  {faqs.map((faq: any, index: number) => (
                    <details
                      key={index}
                      className="glass-card rounded-2xl px-6 py-5 text-left border border-white/5 hover:border-emerald-500/20 transition-colors group [&_summary::-webkit-details-marker]:hidden"
                    >
                      <summary className="flex items-start gap-3 cursor-pointer list-none text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                        <span className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-[11px] font-black">
                          Q
                        </span>
                        <span className="flex-1">{faq.question}</span>
                        <span className="shrink-0 text-emerald-400 transition-transform group-open:rotate-45 text-xl leading-none">
                          +
                        </span>
                      </summary>
                      <p className="text-slate-400 leading-relaxed pl-9 pt-3 text-sm">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {keywords.length > 0 && (
              <div className="max-w-4xl mx-auto w-full space-y-5 opacity-55 text-center">
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                  {t.seoKeywordsTitle}
                </h2>
                <div className="flex flex-wrap justify-center gap-2">
                  {keywords.map((keyword: string, index: number) => (
                    <span
                      key={index}
                      className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-400 transition-all cursor-default"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <AdBanner id="adsense-exif-clear-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={modal => setLegalModal(modal)} />

      <LegalModal
        isOpen={legalModal === 'privacy'}
        onClose={() => setLegalModal(null)}
        title={legalTranslations[lang]?.nav.privacy || 'Privacy Policy'}
        content={legalTranslations[lang]?.privacy.content || ''}
        t={t}
      />
      <LegalModal
        isOpen={legalModal === 'terms'}
        onClose={() => setLegalModal(null)}
        title={legalTranslations[lang]?.nav.terms || 'Terms of Service'}
        content={legalTranslations[lang]?.terms.content || ''}
        t={t}
      />
      <LegalModal
        isOpen={legalModal === 'cookies'}
        onClose={() => setLegalModal(null)}
        title={legalTranslations[lang]?.nav.cookies || 'Cookie Policy'}
        content={legalTranslations[lang]?.cookies.content || ''}
        t={t}
      />
    </div>
  );
};

export default EXIFClear;
