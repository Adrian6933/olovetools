import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight, Check, Copy, Crop, Download, Frame, Image as ImageIcon, Keyboard,
  Loader2, Lock, Ratio, Redo2, RotateCcw, Ruler, Trash2, Undo2, Upload, X,
} from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { NextStepBar } from './components/NextStepBar';
import { RatioCanvas, paintFrame, type BarFill } from './components/RatioCanvas';
import {
  IconExactRatio, IconFit, IconHandEdit, IconHandoff, IconMultiple, IconOnDemand,
  RatioHeroArt, StepAdjust, StepChoose, StepExport, StepSource,
} from './components/Illustrations';

import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';
import { useHandoffIntake } from '../../lib/useHandoff';

import type { EditState, FitMode, LoadedSource, PendingSource, Size, Tab } from './types';
import {
  KNOWN_RATIOS, buildSnippets, fitInto, frameForRatio, identifySize, megapixels,
  orientation, parseDimension, ratioDrift, resizeProportional, roundToMultiple, simplifyRatio,
} from './lib/ratio';

interface AspectRatioProps {
  lang: string;
  dictionary: any;
}

const MULTIPLES = [1, 2, 4, 8, 16];
const GROUPS: { id: 'screen' | 'cinema' | 'social' | 'print'; key: string; fallback: string }[] = [
  { id: 'screen', key: 'group_screen', fallback: 'Screens' },
  { id: 'cinema', key: 'group_cinema', fallback: 'Cinema' },
  { id: 'social', key: 'group_social', fallback: 'Social' },
  { id: 'print', key: 'group_print', fallback: 'Print & photo' },
];

const DEFAULT_EDIT: EditState = {
  ratioW: 9,
  ratioH: 16,
  mode: 'cover',
  offsetX: 0,
  offsetY: 0,
  zoom: 1,
};

/** Formats a fraction as a percentage with just enough decimals to be useful. */
const pct = (fraction: number): string => {
  const v = fraction * 100;
  if (v === 0) return '0%';
  if (v < 0.01) return '<0.01%';
  if (v < 1) return `${v.toFixed(2)}%`;
  return `${v.toFixed(1)}%`;
};

export default function AspectRatio({ lang, dictionary }: AspectRatioProps) {
  const t = dictionary || {};

  const [tab, setTab] = useState<Tab>('calculate');
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const copyTimer = useRef<number | undefined>(undefined);

  // -- manual numbers: always available, never gated behind a file ------------
  const [calcW, setCalcW] = useState('1920');
  const [calcH, setCalcH] = useState('1080');
  const [maxDen, setMaxDen] = useState(40);

  const [origW, setOrigW] = useState('1920');
  const [origH, setOrigH] = useState('1080');
  const [resizeTarget, setResizeTarget] = useState<'width' | 'height'>('width');
  const [targetW, setTargetW] = useState('1280');
  const [targetH, setTargetH] = useState('720');
  const [multiple, setMultiple] = useState(1);

  const [selectedPreset, setSelectedPreset] = useState('16-9');

  // -- source ----------------------------------------------------------------
  // A dropped file only *waits* here. Reading it (and everything that follows)
  // happens when the user presses the button, never on drop.
  const [pending, setPending] = useState<PendingSource | null>(null);
  const [loaded, setLoaded] = useState<LoadedSource | null>(null);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** Every object URL we ever created, so none of them leaks. */
  const urlsRef = useRef<Set<string>>(new Set());

  // -- editor ----------------------------------------------------------------
  const [edit, setEdit] = useState<EditState>(DEFAULT_EDIT);
  const [history, setHistory] = useState<EditState[]>([DEFAULT_EDIT]);
  const [histIndex, setHistIndex] = useState(0);
  const [barFill, setBarFill] = useState<BarFill>('black');
  const [outWidth, setOutWidth] = useState('1080');
  const [format, setFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/png');
  const [exporting, setExporting] = useState(false);

  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // ==========================================================================
  // Derived values
  // ==========================================================================

  const calcSize = useMemo<Size>(
    () => ({ w: parseDimension(calcW), h: parseDimension(calcH) }),
    [calcW, calcH]
  );

  const calcResult = useMemo(() => {
    if (!(calcSize.w > 0) || !(calcSize.h > 0)) return null;
    const ratio = simplifyRatio(calcSize.w, calcSize.h, maxDen);
    const known = identifySize({ w: Math.round(calcSize.w), h: Math.round(calcSize.h) });
    return {
      ratio,
      known,
      mp: megapixels(calcSize),
      orient: orientation(ratio.decimal),
      size: calcSize,
    };
  }, [calcSize, maxDen]);

  const origSize = useMemo<Size>(
    () => ({ w: parseDimension(origW), h: parseDimension(origH) }),
    [origW, origH]
  );

  const resizeResult = useMemo(() => {
    const target = parseDimension(resizeTarget === 'width' ? targetW : targetH);
    if (!(origSize.w > 0) || !(origSize.h > 0) || !(target > 0)) return null;
    const size = resizeProportional(origSize, target, resizeTarget, multiple);
    if (!(size.w > 0)) return null;
    return {
      size,
      drift: ratioDrift(origSize, size),
      mp: megapixels(size),
      scale: size.w / origSize.w,
    };
  }, [origSize, resizeTarget, targetW, targetH, multiple]);

  /** The ratio the visual preview and the editor are working with. */
  const activeRatio = useMemo(() => {
    if (tab === 'presets') {
      const p = KNOWN_RATIOS.find(x => x.id === selectedPreset);
      if (p) return { w: p.w, h: p.h };
    }
    if (tab === 'fit') return { w: edit.ratioW, h: edit.ratioH };
    if (tab === 'resize' && resizeResult) return { w: resizeResult.size.w, h: resizeResult.size.h };
    if (tab === 'calculate' && calcResult) return { w: calcResult.ratio.w, h: calcResult.ratio.h };
    return { w: 16, h: 9 };
  }, [tab, selectedPreset, edit.ratioW, edit.ratioH, resizeResult, calcResult]);

  const fitReport = useMemo(() => {
    const source = loaded ? loaded.natural : origSize.w > 0 ? origSize : null;
    if (!source) return null;
    const frame = frameForRatio(source, edit.ratioW, edit.ratioH, multiple);
    if (!(frame.w > 0)) return null;
    return { source, frame, cover: fitInto(source, frame, 'cover'), contain: fitInto(source, frame, 'contain') };
  }, [loaded, origSize, edit.ratioW, edit.ratioH, multiple]);

  /**
   * Output pixel size for the export, from the width the user asked for.
   *
   * The height follows the *frame* rather than the raw ratio whenever there is
   * one: the frame is already rounded to whole pixels, and re-deriving from
   * 9/16 reintroduced the rounding error, so a frame reported as 1688×3000
   * exported as 1688×3001.
   */
  const outputSize = useMemo<Size>(() => {
    const w = parseDimension(outWidth);
    if (!(w > 0)) return { w: 0, h: 0 };
    const width = roundToMultiple(w, multiple);
    const frame = fitReport?.frame;
    const height =
      frame && frame.w > 0
        ? roundToMultiple((width * frame.h) / frame.w, multiple)
        : roundToMultiple((width * edit.ratioH) / edit.ratioW, multiple);
    return { w: width, h: height };
  }, [outWidth, edit.ratioW, edit.ratioH, multiple, fitReport]);

  const snippets = useMemo(() => {
    const ratio = simplifyRatio(activeRatio.w, activeRatio.h, maxDen);
    const size =
      tab === 'fit' && outputSize.w > 0
        ? outputSize
        : tab === 'resize' && resizeResult
          ? resizeResult.size
          : calcSize.w > 0
            ? { w: Math.round(calcSize.w), h: Math.round(calcSize.h) }
            : { w: 1920, h: 1080 };
    return buildSnippets(ratio, size);
  }, [activeRatio, maxDen, tab, outputSize, resizeResult, calcSize]);

  // ==========================================================================
  // Source intake — nothing here decodes on its own
  // ==========================================================================

  const trackUrl = (url: string) => {
    urlsRef.current.add(url);
    return url;
  };

  const releaseUrl = (url: string | undefined) => {
    if (!url) return;
    if (urlsRef.current.delete(url)) URL.revokeObjectURL(url);
  };

  /** Parks a file. Reads nothing: `loaded` stays untouched until the button. */
  const acceptFile = useCallback((file: File, from?: string) => {
    setError(null);
    const kind: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image';
    setPending(prev => {
      releaseUrl(prev?.url);
      return { file, url: trackUrl(URL.createObjectURL(file)), kind, from };
    });
    setLoaded(prev => {
      releaseUrl(prev?.url);
      return null;
    });
  }, []);

  // One line, as designed: a file handed over by another tool lands in the very
  // same waiting room a dropped file does — it does not auto-run either.
  useHandoffIntake(acceptFile);

  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      urls.forEach(u => URL.revokeObjectURL(u));
      urls.clear();
      clearTimeout(copyTimer.current);
    };
  }, []);

  /** The expensive step, and the only one behind a button. */
  const readPending = useCallback(async () => {
    if (!pending || reading) return;
    setReading(true);
    setError(null);
    try {
      let natural: Size;
      let bitmap: CanvasImageSource | null = null;

      if (pending.kind === 'video') {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        video.src = pending.url;
        await new Promise<void>((resolve, reject) => {
          video.onloadeddata = () => resolve();
          video.onerror = () => reject(new Error('decode'));
        });
        natural = { w: video.videoWidth, h: video.videoHeight };
        // A still from the first frame is enough for framing decisions and
        // avoids keeping a decoding video element alive.
        const shot = document.createElement('canvas');
        shot.width = natural.w;
        shot.height = natural.h;
        shot.getContext('2d')?.drawImage(video, 0, 0);
        bitmap = shot;
        video.src = '';
      } else {
        const img = new Image();
        img.decoding = 'async';
        img.src = pending.url;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('decode'));
        });
        natural = { w: img.naturalWidth, h: img.naturalHeight };
        bitmap = img;
      }

      if (!(natural.w > 0) || !(natural.h > 0)) throw new Error('decode');

      setLoaded({ ...pending, natural, bitmap: bitmap as any });
      setCalcW(String(natural.w));
      setCalcH(String(natural.h));
      setOrigW(String(natural.w));
      setOrigH(String(natural.h));
      // Default to the largest frame the source can fill at native resolution.
      // A flat 1920 would silently upscale a portrait crop (1688px of real
      // pixels stretched to 1920) and hand back a softer image than the source.
      setOutWidth(String(frameForRatio(natural, edit.ratioW, edit.ratioH, multiple).w));
      setTab('fit');
    } catch {
      const ext = (pending.file.name.split('.').pop() || '').toUpperCase();
      setError(
        (t.errorDecode || 'Your browser could not decode this file ({format}). Convert it first — HEIC and some AVIF files are not supported everywhere.').replace(
          '{format}',
          ext || pending.file.type || '?'
        )
      );
    } finally {
      setReading(false);
    }
  }, [pending, reading, t.errorDecode, edit.ratioW, edit.ratioH, multiple]);

  const clearSource = useCallback(() => {
    setPending(prev => {
      releaseUrl(prev?.url);
      return null;
    });
    setLoaded(prev => {
      releaseUrl(prev?.url);
      return null;
    });
    setError(null);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) acceptFile(file);
    },
    [acceptFile]
  );

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items || []).find(i => i.type.startsWith('image/'));
      const file = item?.getAsFile();
      if (file) acceptFile(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [acceptFile]);

  // ==========================================================================
  // History — six numbers per step, so it costs bytes, not megabytes
  // ==========================================================================

  const pushEdit = useCallback(
    (next: EditState, commit: boolean) => {
      setEdit(next);
      if (!commit) return;
      setHistory(prev => {
        const trimmed = prev.slice(0, histIndex + 1);
        const last = trimmed[trimmed.length - 1];
        if (last && JSON.stringify(last) === JSON.stringify(next)) return prev;
        // 200 steps of six numbers is a few kilobytes in total.
        const grown = [...trimmed, next].slice(-200);
        setHistIndex(grown.length - 1);
        return grown;
      });
    },
    [histIndex]
  );

  const undo = useCallback(() => {
    setHistIndex(i => {
      if (i <= 0) return i;
      setEdit(history[i - 1]);
      return i - 1;
    });
  }, [history]);

  const redo = useCallback(() => {
    setHistIndex(i => {
      if (i >= history.length - 1) return i;
      setEdit(history[i + 1]);
      return i + 1;
    });
  }, [history]);

  const setRatio = useCallback(
    (w: number, h: number) => {
      pushEdit({ ...edit, ratioW: w, ratioH: h, offsetX: 0, offsetY: 0 }, true);
      // Keep the export at native resolution for the new frame rather than
      // leaving the width of the previous one behind.
      if (loaded) setOutWidth(String(frameForRatio(loaded.natural, w, h, multiple).w));
    },
    [edit, pushEdit, loaded, multiple]
  );

  const setMode = useCallback((mode: FitMode) => pushEdit({ ...edit, mode }, true), [edit, pushEdit]);

  // ==========================================================================
  // Shortcuts
  // ==========================================================================

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key.toLowerCase() === 'c') setMode(edit.mode === 'cover' ? 'contain' : 'cover');
      if (e.key.toLowerCase() === 'r') pushEdit({ ...edit, offsetX: 0, offsetY: 0, zoom: 1 }, true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, setMode, edit, pushEdit]);

  // ==========================================================================
  // Output
  // ==========================================================================

  const renderResult = useCallback(async (): Promise<{ blob: Blob; name: string } | null> => {
    if (!loaded || !loaded.bitmap || !(outputSize.w > 0)) return null;
    const canvas = document.createElement('canvas');
    canvas.width = outputSize.w;
    canvas.height = outputSize.h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    paintFrame(ctx, loaded.bitmap as CanvasImageSource, loaded.natural, outputSize, edit, barFill);

    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, format, format === 'image/png' ? undefined : 0.92)
    );
    if (!blob) return null;
    const ext = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';
    const stem = loaded.file.name.replace(/\.[^.]+$/, '') || 'image';
    return { blob, name: `${stem}-${edit.ratioW}x${edit.ratioH}.${ext}` };
  }, [loaded, outputSize, edit, barFill, format]);

  const download = useCallback(async () => {
    setExporting(true);
    try {
      const result = await renderResult();
      if (!result) return;
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.name;
      a.click();
      // Revoked on the next tick: revoking synchronously cancels the download
      // in Firefox before it has read the blob.
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } finally {
      setExporting(false);
    }
  }, [renderResult]);

  const handleCopy = useCallback(
    async (field: string, value: string) => {
      if (!value) return;
      try {
        await navigator.clipboard.writeText(value);
        setCopiedField(field);
        clearTimeout(copyTimer.current);
        copyTimer.current = window.setTimeout(() => setCopiedField(null), 2000);
      } catch {
        setError(t.errorClipboard || 'Your browser blocked clipboard access.');
      }
    },
    [t.errorClipboard]
  );

  const resetWorkspace = useCallback(() => {
    setCalcW('1920');
    setCalcH('1080');
    setOrigW('1920');
    setOrigH('1080');
    setResizeTarget('width');
    setTargetW('1280');
    setTargetH('720');
    setMultiple(1);
    setMaxDen(40);
    setSelectedPreset('16-9');
    setTab('calculate');
    setCopiedField(null);
    setEdit(DEFAULT_EDIT);
    setHistory([DEFAULT_EDIT]);
    setHistIndex(0);
    setBarFill('black');
    setFormat('image/png');
    clearSource();
  }, [clearSource]);

  // ==========================================================================
  // Small presentational helpers (declared outside the render path)
  // ==========================================================================

  const copyBtn = (field: string, value: string) => (
    <button
      type="button"
      onClick={() => handleCopy(field, value)}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer outline-none border shrink-0 ${
        copiedField === field
          ? 'bg-lime-500/20 border-lime-500/50 text-lime-400'
          : 'bg-white/5 border-white/5 hover:bg-lime-500/20 hover:border-lime-500/30 text-slate-400 hover:text-lime-400'
      }`}
      title={t.tooltip_copy || 'Copy'}
      aria-label={t.tooltip_copy || 'Copy'}
    >
      {copiedField === field ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </button>
  );

  const inputClass =
    'w-full min-w-0 px-4 py-3 bg-lime-950/30 border border-lime-500/15 rounded-xl text-lime-100 placeholder-lime-700 font-mono text-sm focus:outline-none focus:border-lime-500/50 focus:bg-lime-950/50 transition-all';

  const panelClass =
    'flex flex-col bg-lime-950/20 border border-lime-500/10 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl';

  const panelHead = (icon: React.ReactNode, label: string, right?: React.ReactNode) => (
    <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-lime-500/10 bg-lime-950/40">
      <span className="min-w-0 text-xs font-black text-lime-400/80 uppercase tracking-wider flex items-center gap-2">
        <span className="text-lime-400 shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
      </span>
      {right}
    </div>
  );

  const stat = (label: string, value: React.ReactNode, hint?: string) => (
    <div className="bg-lime-950/40 border border-lime-500/10 rounded-xl p-3 text-center min-w-0">
      <div className="text-[10px] text-lime-400/60 uppercase tracking-wider mb-1 truncate">{label}</div>
      <div className="text-base sm:text-lg font-black text-lime-100 font-mono break-words">{value}</div>
      {hint && <div className="text-[10px] text-slate-500 mt-1 truncate">{hint}</div>}
    </div>
  );

  const tabButton = (id: Tab, icon: React.ReactNode, label: string) => (
    <button
      role="tab"
      aria-selected={tab === id}
      onClick={() => setTab(id)}
      className={`px-3.5 sm:px-5 py-2.5 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer outline-none flex items-center gap-2 ${
        tab === id ? 'bg-lime-500 text-lime-950 shadow-lg shadow-lime-500/30' : 'text-slate-400 hover:text-lime-400'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  const features = Array.isArray(t.features) && t.features.length ? t.features : [];
  const featureIcons = [IconExactRatio, IconFit, IconMultiple, IconOnDemand, IconHandEdit, IconHandoff];
  const steps = [
    { art: StepChoose, title: t.step1Title, text: t.step1Text },
    { art: StepSource, title: t.step2Title, text: t.step2Text },
    { art: StepAdjust, title: t.step3Title, text: t.step3Text },
    { art: StepExport, title: t.step4Title, text: t.step4Text },
  ];

  const canvasSource = loaded && loaded.bitmap ? { bitmap: loaded.bitmap as CanvasImageSource, natural: loaded.natural } : null;

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div className="min-h-screen flex flex-col bg-[#080a02] text-slate-200 font-sans relative overflow-x-hidden">
      <Header
        currentLang={lang}
        onLanguageChange={l => (window.location.href = `/${l.toLowerCase()}/aspect-ratio`)}
        onReset={resetWorkspace}
        t={t}
      />

      <main className="flex-grow w-full mx-auto px-4 md:px-8 pt-40 md:pt-32 pb-16 relative z-10 flex flex-col gap-8 max-w-6xl min-[1400px]:max-w-[min(72rem,calc(100vw-440px))]">
        <AdBanner id="adsense-aspect-ratio-top" />

        {/* ---------------------------------------------------------------- */}
        {/* Hero                                                              */}
        {/* ---------------------------------------------------------------- */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="space-y-4 min-w-0">
            <span className="inline-flex max-w-full items-center gap-2 px-4 py-2 rounded-full bg-lime-950/40 border border-lime-800/40 text-lime-400 text-[10px] sm:text-[11px] font-black tracking-[0.18em] uppercase">
              <Ratio className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t.badge || 'Aspect ratio toolkit'}</span>
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.1]">
              {t.seoHeroTitle || 'Every ratio, and what it costs you'}
            </h1>
            <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
              {t.description || t.seoHeroText}
            </p>
            {Array.isArray(t.seoHeroList) && (
              <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
                {t.seoHeroList.map((item: string) => (
                  <li key={item} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-lime-300/80 bg-lime-500/10 border border-lime-500/20 rounded-lg px-2.5 py-1.5">
                    <Check className="w-3 h-3 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <RatioHeroArt
            className="w-full max-w-md mx-auto drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
            animated={!reducedMotion}
          />
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Source: manual first, file optional, nothing automatic            */}
        {/* ---------------------------------------------------------------- */}
        <section
          className={panelClass}
          onDragOver={e => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          {panelHead(<ImageIcon className="w-3.5 h-3.5" />, t.sourceTitle || 'Source (optional)')}
          <div className={`p-5 transition-colors ${dragOver ? 'bg-lime-500/10' : ''}`}>
            {!pending && !loaded && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <p className="text-sm text-slate-400 leading-relaxed flex-1 min-w-0">
                  {t.sourceIntro || 'The calculator works on typed numbers alone — you never need a file. Add one only if you want to see the frame on a real image.'}
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-lime-500/15 border border-lime-500/30 text-lime-300 text-xs font-black hover:bg-lime-500/25 transition-all cursor-pointer outline-none"
                >
                  <Upload className="w-4 h-4" />
                  {t.chooseFile || 'Choose an image or video'}
                </button>
              </div>
            )}

            {pending && !loaded && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-lime-100 truncate">{pending.file.name}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {(pending.file.size / 1024).toFixed(0)} KB · {t.waiting || 'waiting — nothing has been read yet'}
                    {pending.from ? ` · ${(t.fromTool || 'from {tool}').replace('{tool}', pending.from)}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={readPending}
                    disabled={reading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-lime-500 text-lime-950 text-xs font-black hover:bg-lime-400 transition-all cursor-pointer outline-none disabled:opacity-50"
                  >
                    {reading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ruler className="w-4 h-4" />}
                    {t.readDimensions || 'Read its dimensions'}
                  </button>
                  <button
                    onClick={clearSource}
                    className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-red-400 transition-all cursor-pointer outline-none"
                    aria-label={t.removeFile || 'Remove the file'}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {loaded && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-lime-100 truncate">{loaded.file.name}</div>
                  <div className="text-xs text-lime-400/70 font-mono mt-1">
                    {loaded.natural.w} × {loaded.natural.h} px · {megapixels(loaded.natural).toFixed(1)} MP
                  </div>
                </div>
                <button
                  onClick={clearSource}
                  className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs font-bold hover:text-red-400 transition-all cursor-pointer outline-none"
                >
                  <Trash2 className="w-4 h-4" />
                  {t.removeFile || 'Remove the file'}
                </button>
              </div>
            )}

            {error && (
              <p className="mt-4 text-xs font-bold text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                {error}
              </p>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,.heic,.heif,.avif"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) acceptFile(file);
                e.target.value = '';
              }}
            />
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Tabs                                                              */}
        {/* ---------------------------------------------------------------- */}
        <div role="tablist" aria-label={t.tabsLabel || 'Workspace'} className="flex flex-wrap gap-1 bg-lime-950/40 p-1.5 rounded-2xl border border-lime-500/10 self-start max-w-full">
          {tabButton('calculate', <Ratio className="w-4 h-4" />, t.tab_calculate || 'Ratio')}
          {tabButton('resize', <ArrowRight className="w-4 h-4" />, t.tab_resize || 'Resize')}
          {tabButton('fit', <Crop className="w-4 h-4" />, t.tab_fit || 'Fit & crop')}
          {tabButton('presets', <Frame className="w-4 h-4" />, t.tab_presets || 'Presets')}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Calculate                                                         */}
        {/* ---------------------------------------------------------------- */}
        {tab === 'calculate' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={panelClass}>
              {panelHead(<Ruler className="w-3.5 h-3.5" />, t.label_dimensions || 'Dimensions')}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="ar-calc-w" className="block text-[11px] font-bold text-lime-400/70 uppercase tracking-wider mb-2">
                      {t.label_width || 'Width'}
                    </label>
                    <input id="ar-calc-w" type="number" min="1" value={calcW} onChange={e => setCalcW(e.target.value)} placeholder="1920" className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="ar-calc-h" className="block text-[11px] font-bold text-lime-400/70 uppercase tracking-wider mb-2">
                      {t.label_height || 'Height'}
                    </label>
                    <input id="ar-calc-h" type="number" min="1" value={calcH} onChange={e => setCalcH(e.target.value)} placeholder="1080" className={inputClass} />
                  </div>
                </div>

                <div>
                  <label htmlFor="ar-maxden" className="block text-[11px] font-bold text-lime-400/70 uppercase tracking-wider mb-2">
                    {t.label_max_den || 'Largest denominator'}
                  </label>
                  <input
                    id="ar-maxden"
                    type="range"
                    min="4"
                    max="400"
                    step="1"
                    value={maxDen}
                    onChange={e => setMaxDen(Number(e.target.value))}
                    className="w-full accent-lime-500 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                    {(t.hint_max_den || 'Keeps the ratio readable. At {n}, 1998×1080 comes back as 1.85:1 instead of 999:540.').replace('{n}', String(maxDen))}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => { setCalcW('1920'); setCalcH('1080'); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-slate-400 text-[11px] font-bold hover:bg-lime-500/10 hover:text-lime-400 hover:border-lime-500/20 transition-all cursor-pointer outline-none"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    1920 × 1080
                  </button>
                  <button
                    onClick={() => { setCalcW(calcH); setCalcH(calcW); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-slate-400 text-[11px] font-bold hover:bg-lime-500/10 hover:text-lime-400 hover:border-lime-500/20 transition-all cursor-pointer outline-none"
                  >
                    <Redo2 className="w-3.5 h-3.5" />
                    {t.button_swap || 'Swap'}
                  </button>
                </div>
              </div>
            </div>

            <div className={panelClass}>
              {panelHead(
                <Ratio className="w-3.5 h-3.5" />,
                t.label_result || 'Result',
                calcResult ? copyBtn('calc-ratio', `${calcResult.ratio.w}:${calcResult.ratio.h}`) : undefined
              )}
              <div className="p-5 space-y-4">
                {calcResult ? (
                  <>
                    <div className="bg-lime-950/50 border border-lime-500/20 rounded-2xl p-5 text-center">
                      <div className="text-[11px] font-bold text-lime-400/60 uppercase tracking-wider mb-2">
                        {calcResult.ratio.exact ? t.label_simplified_ratio || 'Simplified ratio' : t.label_approx_ratio || 'Closest ratio'}
                      </div>
                      <div className="text-3xl sm:text-4xl font-black text-lime-400 tracking-tight font-mono break-words">
                        {!calcResult.ratio.exact && <span className="text-lime-500/60 mr-1">≈</span>}
                        {calcResult.ratio.w}
                        <span className="text-lime-500/50 mx-1">:</span>
                        {calcResult.ratio.h}
                      </div>
                      {!calcResult.ratio.exact && (
                        <div className="text-[11px] text-amber-300/80 font-bold mt-2">
                          {(t.label_error || 'off by {p}').replace('{p}', pct(calcResult.ratio.error))}
                        </div>
                      )}
                      {calcResult.known && (
                        <div className="text-xs text-lime-300/80 font-bold mt-3 inline-flex items-center gap-1.5 bg-lime-500/10 border border-lime-500/20 rounded-lg px-2.5 py-1.5">
                          <Check className="w-3 h-3 shrink-0" />
                          {calcResult.known.ratio.cinemaLabel || calcResult.known.ratio.name}
                          {' · '}
                          {t[calcResult.known.ratio.labelKey] || calcResult.known.ratio.label}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                      {stat(t.label_decimal || 'Decimal', calcResult.ratio.decimal.toFixed(4))}
                      {stat(t.label_megapixels || 'Megapixels', calcResult.mp.toFixed(2))}
                      {stat(
                        t.label_orientation || 'Orientation',
                        t[`orient_${calcResult.orient}`] || calcResult.orient
                      )}
                      {stat(t.label_input || 'Input', `${Math.round(calcSize.w)}×${Math.round(calcSize.h)}`)}
                    </div>
                  </>
                ) : (
                  <div className="min-h-[200px] flex items-center justify-center text-center text-slate-500 text-sm px-4">
                    {t.placeholder_enter_dims || 'Enter a width and a height to get the ratio.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Resize                                                            */}
        {/* ---------------------------------------------------------------- */}
        {tab === 'resize' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={panelClass}>
              {panelHead(<Ruler className="w-3.5 h-3.5" />, t.label_original || 'Original size')}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="ar-orig-w" className="block text-[11px] font-bold text-lime-400/70 uppercase tracking-wider mb-2">
                      {t.label_width || 'Width'}
                    </label>
                    <input id="ar-orig-w" type="number" min="1" value={origW} onChange={e => setOrigW(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="ar-orig-h" className="block text-[11px] font-bold text-lime-400/70 uppercase tracking-wider mb-2">
                      {t.label_height || 'Height'}
                    </label>
                    <input id="ar-orig-h" type="number" min="1" value={origH} onChange={e => setOrigH(e.target.value)} className={inputClass} />
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-lime-400/70 uppercase tracking-wider mb-2">
                    {t.label_lock_target || 'Pin this dimension'}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {(['width', 'height'] as const).map(target => (
                      <button
                        key={target}
                        onClick={() => setResizeTarget(target)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer outline-none border ${
                          resizeTarget === target
                            ? 'bg-lime-500/20 text-lime-400 border-lime-500/40'
                            : 'text-slate-500 hover:text-lime-400 border-transparent'
                        }`}
                      >
                        <Lock className="w-3 h-3" />
                        {target === 'width' ? t.target_width || 'Width' : t.target_height || 'Height'}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="1"
                    aria-label={resizeTarget === 'width' ? t.target_width || 'Width' : t.target_height || 'Height'}
                    value={resizeTarget === 'width' ? targetW : targetH}
                    onChange={e => (resizeTarget === 'width' ? setTargetW(e.target.value) : setTargetH(e.target.value))}
                    className={inputClass}
                  />
                </div>

                <div>
                  <div className="text-[11px] font-bold text-lime-400/70 uppercase tracking-wider mb-2">
                    {t.label_multiple || 'Snap both sides to a multiple of'}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {MULTIPLES.map(m => (
                      <button
                        key={m}
                        onClick={() => setMultiple(m)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black font-mono transition-all cursor-pointer outline-none border ${
                          multiple === m
                            ? 'bg-lime-500/20 text-lime-400 border-lime-500/40'
                            : 'text-slate-500 hover:text-lime-400 border-white/5 bg-white/5'
                        }`}
                      >
                        {m === 1 ? t.multiple_none || 'off' : m}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    {t.hint_multiple || 'H.264 refuses odd dimensions and most hardware encoders want multiples of 4 or 8.'}
                  </p>
                </div>
              </div>
            </div>

            <div className={panelClass}>
              {panelHead(
                <ArrowRight className="w-3.5 h-3.5" />,
                t.label_new_size || 'New size',
                resizeResult ? copyBtn('resize-result', `${resizeResult.size.w}×${resizeResult.size.h}`) : undefined
              )}
              <div className="p-5 space-y-4">
                {resizeResult ? (
                  <>
                    <div className="bg-lime-950/50 border border-lime-500/20 rounded-2xl p-5 text-center">
                      <div className="text-[11px] font-bold text-lime-400/60 uppercase tracking-wider mb-2">
                        {t.label_result_dimensions || 'Resulting dimensions'}
                      </div>
                      <div className="text-3xl sm:text-4xl font-black text-lime-400 tracking-tight font-mono break-words">
                        {resizeResult.size.w}
                        <span className="text-lime-500/50 mx-1">×</span>
                        {resizeResult.size.h}
                      </div>
                      <div className={`text-[11px] font-bold mt-2 ${resizeResult.drift > 0.002 ? 'text-amber-300/80' : 'text-lime-400/60'}`}>
                        {resizeResult.drift === 0
                          ? t.label_ratio_kept || 'ratio preserved exactly'
                          : (t.label_drift || 'ratio drifts by {p}').replace('{p}', pct(resizeResult.drift))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                      {stat(t.label_scale || 'Scale', `${(resizeResult.scale * 100).toFixed(1)}%`)}
                      {stat(t.label_megapixels || 'Megapixels', resizeResult.mp.toFixed(2))}
                      {stat(t.label_multiple_short || 'Multiple', multiple === 1 ? '—' : `×${multiple}`)}
                    </div>
                  </>
                ) : (
                  <div className="min-h-[200px] flex items-center justify-center text-center text-slate-500 text-sm px-4">
                    {t.placeholder_resize || 'Enter the original size and the dimension you want to pin.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Fit & crop                                                        */}
        {/* ---------------------------------------------------------------- */}
        {tab === 'fit' && (
          <div className="flex flex-col lg:flex-row gap-4">
            <div className={`${panelClass} lg:flex-1 min-w-0`}>
              {panelHead(
                <Crop className="w-3.5 h-3.5" />,
                t.label_editor || 'Frame editor',
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={undo}
                    disabled={histIndex <= 0}
                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-lime-400 disabled:opacity-30 transition-all cursor-pointer outline-none"
                    aria-label={t.undo || 'Undo'}
                    title={`${t.undo || 'Undo'} (Ctrl+Z)`}
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={redo}
                    disabled={histIndex >= history.length - 1}
                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-lime-400 disabled:opacity-30 transition-all cursor-pointer outline-none"
                    aria-label={t.redo || 'Redo'}
                    title={`${t.redo || 'Redo'} (Ctrl+Shift+Z)`}
                  >
                    <Redo2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="p-5 space-y-4">
                <RatioCanvas source={canvasSource} edit={edit} barFill={barFill} onEditChange={pushEdit} t={t} />

                <div className="flex flex-wrap gap-2">
                  {(['cover', 'contain'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setMode(mode)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer outline-none border ${
                        edit.mode === mode
                          ? 'bg-lime-500/20 text-lime-400 border-lime-500/40'
                          : 'text-slate-500 hover:text-lime-400 border-white/5 bg-white/5'
                      }`}
                    >
                      {mode === 'cover' ? t.modeCover || 'Cover (crop)' : t.modeContain || 'Contain (letterbox)'}
                    </button>
                  ))}
                  {edit.mode === 'contain' &&
                    (['black', 'white', 'blur', 'transparent'] as const).map(fill => (
                      <button
                        key={fill}
                        onClick={() => setBarFill(fill)}
                        className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer outline-none border ${
                          barFill === fill
                            ? 'bg-lime-500/20 text-lime-400 border-lime-500/40'
                            : 'text-slate-500 hover:text-lime-400 border-white/5 bg-white/5'
                        }`}
                      >
                        {t[`bar_${fill}`] || fill}
                      </button>
                    ))}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {KNOWN_RATIOS.slice(0, 10).map(r => {
                    const active = edit.ratioW === r.w && edit.ratioH === r.h;
                    return (
                      <button
                        key={r.id}
                        onClick={() => setRatio(r.w, r.h)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black font-mono transition-all cursor-pointer outline-none border ${
                          active ? 'bg-lime-500 text-lime-950 border-lime-500' : 'text-slate-400 bg-white/5 border-white/5 hover:text-lime-400'
                        }`}
                      >
                        {r.cinemaLabel || r.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className={`${panelClass} lg:w-[340px] lg:shrink-0`}>
              {panelHead(<Download className="w-3.5 h-3.5" />, t.label_output || 'Output')}
              <div className="p-5 space-y-4">
                {fitReport ? (
                  <div className="grid grid-cols-2 gap-2">
                    {stat(t.label_frame || 'Frame', `${fitReport.frame.w}×${fitReport.frame.h}`)}
                    {stat(
                      edit.mode === 'cover' ? t.label_cropped || 'Cropped away' : t.label_bars || 'Bars',
                      edit.mode === 'cover'
                        ? pct(fitReport.cover.cropped)
                        : `${fitReport.contain.barX || fitReport.contain.barY}px`,
                      edit.mode === 'cover'
                        ? (t.hint_cropped || 'of the original')
                        : fitReport.contain.barX
                          ? t.hint_pillarbox || 'pillarbox'
                          : t.hint_letterbox || 'letterbox'
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t.fitNeedsSize || 'Type an original size in the Resize tab, or load a file above, and the frame maths appears here.'}
                  </p>
                )}

                <div>
                  <label htmlFor="ar-outw" className="block text-[11px] font-bold text-lime-400/70 uppercase tracking-wider mb-2">
                    {t.label_output_width || 'Output width'}
                  </label>
                  <input id="ar-outw" type="number" min="1" value={outWidth} onChange={e => setOutWidth(e.target.value)} className={inputClass} />
                  <p className="text-[11px] text-lime-400/60 font-mono mt-2">
                    {outputSize.w > 0 ? `${outputSize.w} × ${outputSize.h} px` : '—'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(['image/png', 'image/jpeg', 'image/webp'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase transition-all cursor-pointer outline-none border ${
                        format === f ? 'bg-lime-500/20 text-lime-400 border-lime-500/40' : 'text-slate-500 hover:text-lime-400 border-white/5 bg-white/5'
                      }`}
                    >
                      {f.replace('image/', '')}
                    </button>
                  ))}
                </div>

                <button
                  onClick={download}
                  disabled={!loaded || exporting || !(outputSize.w > 0)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-lime-500 text-lime-950 text-xs font-black hover:bg-lime-400 transition-all cursor-pointer outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {t.button_download || 'Download the framed image'}
                </button>
                {!loaded && (
                  <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                    {t.exportNeedsFile || 'Exporting needs a file. The numbers above work without one.'}
                  </p>
                )}

                <div className="pt-1 border-t border-white/5">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 pt-3 pb-2">
                    <Keyboard className="w-3.5 h-3.5" />
                    {t.shortcutsTitle || 'Shortcuts'}
                  </div>
                  <ul className="space-y-1 list-none p-0 m-0 text-[11px] text-slate-500">
                    {[
                      ['Ctrl+Z / Ctrl+Shift+Z', t.sc_undo || 'undo, redo'],
                      ['C', t.sc_mode || 'flip cover / contain'],
                      ['R', t.sc_reset || 'recentre and reset zoom'],
                      ['Alt', t.sc_alt || 'preview the other mode'],
                    ].map(([keys, label]) => (
                      <li key={keys} className="flex items-center justify-between gap-2">
                        <code className="font-mono text-lime-400/70 shrink-0">{keys}</code>
                        <span className="truncate text-right">{label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Presets                                                           */}
        {/* ---------------------------------------------------------------- */}
        {tab === 'presets' && (
          <div className="space-y-8">
            {GROUPS.map(group => (
              <div key={group.id} className="space-y-3">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-lime-400/70">
                  {t[group.key] || group.fallback}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {KNOWN_RATIOS.filter(r => r.group === group.id).map(p => {
                    const isActive = selectedPreset === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedPreset(p.id);
                          setRatio(p.w, p.h);
                        }}
                        className={`text-left bg-lime-950/20 border rounded-3xl overflow-hidden shadow-2xl transition-all cursor-pointer outline-none ${
                          isActive ? 'border-lime-500/50 shadow-lime-500/10' : 'border-lime-500/10 hover:border-lime-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 px-5 py-3 border-b border-lime-500/10 bg-lime-950/40">
                          <span className="text-sm font-black text-white font-mono truncate">
                            {p.cinemaLabel || p.name}
                          </span>
                          {isActive && <Check className="w-4 h-4 text-lime-400 shrink-0" />}
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="text-[11px] font-bold text-lime-400/70 leading-relaxed">
                            {t[p.labelKey] || p.label}
                          </div>
                          <div className="space-y-1.5">
                            {(p.resolutions || []).map(r => (
                              <div key={`${r.w}x${r.h}`} className="flex items-center justify-between gap-2 bg-lime-950/40 border border-lime-500/10 rounded-lg px-3 py-1.5">
                                <span className="text-xs font-mono text-lime-100 truncate">{r.w} × {r.h}</span>
                                <span className="text-[10px] text-lime-400/40 font-mono shrink-0">px</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Snippets                                                          */}
        {/* ---------------------------------------------------------------- */}
        <section className={panelClass}>
          {panelHead(<Copy className="w-3.5 h-3.5" />, t.label_snippets || 'Ready to paste')}
          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-3">
            {snippets.map(s => (
              <div key={s.id} className="flex items-center gap-2 bg-lime-950/40 border border-lime-500/10 rounded-xl px-3 py-2.5 min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-lime-400/60 w-20 shrink-0 truncate">
                  {s.label}
                </span>
                <code className="flex-1 min-w-0 text-[11px] font-mono text-lime-100 truncate">{s.code}</code>
                {copyBtn(`snip-${s.id}`, s.code)}
              </div>
            ))}
          </div>
        </section>

        {loaded && <NextStepBar lang={lang} t={t} getResult={renderResult} />}

        <AdBanner id="adsense-aspect-ratio-mid" />

        {/* ---------------------------------------------------------------- */}
        {/* How it works                                                      */}
        {/* ---------------------------------------------------------------- */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black text-white tracking-tight">
            {t.howItWorksTitle || 'How it works'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, i) => {
              const Art = step.art;
              return (
                <div key={i} className="bg-lime-950/20 border border-lime-500/10 rounded-3xl p-5 space-y-3">
                  <Art className="w-full h-20 text-lime-400" />
                  <div className="text-[10px] font-black text-lime-400/50 uppercase tracking-[0.2em]">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3 className="text-base font-bold text-white leading-snug">{step.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{step.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Features                                                          */}
        {/* ---------------------------------------------------------------- */}
        {features.length > 0 && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature: any, i: number) => {
              const Icon = featureIcons[i % featureIcons.length];
              return (
                <div key={i} className="bg-lime-950/20 border border-lime-500/10 rounded-3xl p-5 space-y-3">
                  <span className="w-11 h-11 rounded-2xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center text-lime-400">
                    <Icon className="w-5 h-5" />
                  </span>
                  <h3 className="text-base font-bold text-white leading-snug">{feature.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feature.text}</p>
                </div>
              );
            })}
          </section>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* FAQ                                                               */}
        {/* ---------------------------------------------------------------- */}
        {Array.isArray(t.faq) && t.faq.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-2xl font-black text-white tracking-tight">
              {t.faqTitle || 'Frequently asked questions'}
            </h2>
            <div className="space-y-2">
              {t.faq.map((item: any, i: number) => (
                <details
                  key={i}
                  className="group bg-lime-950/20 border border-lime-500/10 rounded-2xl overflow-hidden open:border-lime-500/25"
                >
                  <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer list-none text-sm font-bold text-white hover:text-lime-300 transition-colors">
                    <span className="min-w-0">{item.question}</span>
                    <span className="shrink-0 text-lime-400/70 transition-transform group-open:rotate-45 text-xl leading-none">+</span>
                  </summary>
                  <p className="px-5 pb-5 text-sm text-slate-400 leading-relaxed">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={resetWorkspace}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 text-xs font-black hover:bg-lime-500/10 hover:text-lime-400 hover:border-lime-500/20 transition-all cursor-pointer outline-none"
          >
            <RotateCcw className="w-4 h-4" />
            {t.button_reset || 'Reset everything'}
          </button>
        </div>

        <AdBanner id="adsense-aspect-ratio-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={modal => setLegalModal(modal)} />

      <LegalModal
        isOpen={legalModal === 'privacy'}
        onClose={() => setLegalModal(null)}
        title={legalTranslations[lang]?.privacy.title || 'Privacy Policy'}
        content={legalTranslations[lang]?.privacy.content}
        t={t}
      />
      <LegalModal
        isOpen={legalModal === 'terms'}
        onClose={() => setLegalModal(null)}
        title={legalTranslations[lang]?.terms.title || 'Terms of Service'}
        content={legalTranslations[lang]?.terms.content}
        t={t}
      />
      <LegalModal
        isOpen={legalModal === 'cookies'}
        onClose={() => setLegalModal(null)}
        title={legalTranslations[lang]?.cookies.title || 'Cookie Policy'}
        content={legalTranslations[lang]?.cookies.content}
        t={t}
      />
    </div>
  );
}
