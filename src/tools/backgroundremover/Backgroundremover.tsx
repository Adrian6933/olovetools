import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eraser,
  Cpu,
  Check,
  Plus,
  Gauge,
  ArrowUp,
  Sparkles,
  Crosshair,
  Brush,
} from 'lucide-react';

import { Header } from './components/Header';
import { Editor } from './components/Editor';
import { NextStepBar } from './components/NextStepBar';
import {
  CutoutHeroArt,
  IconBatch,
  IconBrushTools,
  IconFullRes,
  IconHandoff,
  IconLocalAI,
  IconOffline,
  StepAI,
  StepDrop,
  StepExport,
  StepRefine,
} from './components/Illustrations';
import type { Language } from '../../locales/meta';
import { AdBanner } from '../../components/shared/AdBanner';
import { ImageItem, Quality } from './types';
import { computeMask, detectDevice, MODEL_SIZE_MB, preloadModel, type ProgressStep } from './lib/engine';
import { useHandoffIntake } from '../../lib/useHandoff';
import { useReducedMotion, fadeInUp } from '../../components/shared/motion';

interface BackgroundremoverProps {
  lang: Language;
  dictionary?: any;
}

const QUALITIES: Quality[] = ['fast', 'balanced', 'max'];

export const Backgroundremover: React.FC<BackgroundremoverProps> = ({ lang, dictionary }) => {
  const t = dictionary || {};

  const [items, setItems] = useState<ImageItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ percent: number; step: ProgressStep } | null>(null);
  const [quality, setQuality] = useState<Quality>('balanced');
  const [precision, setPrecision] = useState(true);
  const [device, setDevice] = useState<'gpu' | 'cpu' | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const processingRef = useRef(false);
  const prefersReduced = useReducedMotion();

  // `activeItem` is derived instead of mirrored: mirroring is what made the
  // previous version show stale sizes and previews after an edit.
  const activeItem = useMemo(() => items.find(i => i.id === activeId) ?? null, [items, activeId]);

  // -------------------------------------------------------------------------
  // Chrome
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    detectDevice().then(setDevice);
  }, []);

  const formatBytes = (bytes: number, decimals = 1) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  };

  // -------------------------------------------------------------------------
  // Intake
  // -------------------------------------------------------------------------

  /** iPhone photos arrive as HEIC, which no browser can draw to a canvas. */
  const normalise = async (file: File): Promise<File | null> => {
    const isHeic = /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
    if (!isHeic) return file.type.startsWith('image/') ? file : null;
    try {
      const heic2any = (await import('heic2any')).default as any;
      const converted = (await heic2any({ blob: file, toType: 'image/png' })) as Blob;
      return new File([converted], file.name.replace(/\.hei[cf]$/i, '.png'), { type: 'image/png' });
    } catch {
      return null;
    }
  };

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;

    const newItems: ImageItem[] = [];
    for (const raw of list) {
      const file = await normalise(raw);
      if (!file) continue;
      newItems.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        originalSize: file.size,
        processedSize: null,
        originalUrl: URL.createObjectURL(file),
        processedUrl: null,
        // Nothing runs until the user asks for it: the model download and the
        // inference are expensive, and they may only want to queue files up.
        status: 'ready',
      });
    }

    if (newItems.length === 0) return;
    setItems(prev => [...prev, ...newItems]);
    setActiveId(current => current ?? newItems[0].id);
  }, []);

  // Pick up a file handed over by another tool (e.g. "remove the background"
  // from CropSnap) instead of making the user export and re-upload.
  useHandoffIntake(file => addFiles([file]));

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files?.length) addFiles(e.clipboardData.files);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [addFiles]);

  // -------------------------------------------------------------------------
  // Inference
  // -------------------------------------------------------------------------
  const processImage = useCallback(
    async (item: ImageItem, q: Quality, refine: boolean) => {
      setItems(prev => prev.map(i => (i.id === item.id ? { ...i, status: 'loading_model' } : i)));
      setProgress({ percent: 0, step: 'downloading' });

      try {
        const result = await computeMask(
          item.file,
          q,
          (step, percent) => {
            setProgress({ percent, step });
            if (step !== 'downloading') {
              setItems(prev =>
                prev.map(i => (i.id === item.id && i.status === 'loading_model' ? { ...i, status: 'processing' } : i))
              );
            }
          },
          refine
        );

        setItems(prev =>
          prev.map(i =>
            i.id === item.id
              ? {
                  ...i,
                  status: 'done',
                  mask: result.mask,
                  maskVersion: (i.maskVersion ?? 0) + 1,
                  width: result.width,
                  height: result.height,
                  device: result.device,
                  quality: q,
                }
              : i
          )
        );
      } catch (err) {
        console.error('Background removal error:', err);
        setItems(prev =>
          prev.map(i => (i.id === item.id ? { ...i, status: 'error', error: String(err) } : i))
        );
      } finally {
        setProgress(null);
        processingRef.current = false;
      }
    },
    []
  );

  // One image at a time: two concurrent ONNX sessions on the same model just
  // fight over memory and finish later than they would in sequence. Only items
  // the user explicitly queued (`idle`) are picked up — `ready` ones wait.
  useEffect(() => {
    if (processingRef.current) return;
    const next = items.find(i => i.status === 'idle');
    if (!next) return;
    processingRef.current = true;
    processImage(next, quality, precision);
  }, [items, quality, precision, processImage]);

  /** Queues one image, or every pending image, for the cutout. */
  const startCut = (id?: string) => {
    setItems(prev =>
      prev.map(i =>
        (id ? i.id === id : i.status === 'ready') && i.status !== 'done' ? { ...i, status: 'idle' } : i
      )
    );
  };

  const rerunAI = () => {
    if (!activeItem) return;
    setItems(prev => prev.map(i => (i.id === activeItem.id ? { ...i, status: 'idle' } : i)));
  };

  /**
   * Opens the editor with nothing removed, so the whole cutout can be made by
   * hand with the wand, the lasso and the brushes. No model download, no
   * inference — useful when the AI guesses wrong or the subject is a shape the
   * model was never trained on (a logo, a diagram, a product on white).
   */
  const startManual = async (id: string) => {
    const target = items.find(i => i.id === id);
    if (!target) return;
    const img = new Image();
    img.src = target.originalUrl;
    try {
      await img.decode();
    } catch {
      return;
    }
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    // A fully opaque mask == the untouched photo.
    const mask = new Uint8ClampedArray(width * height).fill(255);
    setItems(prev =>
      prev.map(i =>
        i.id === id
          ? { ...i, status: 'done', mask, maskVersion: (i.maskVersion ?? 0) + 1, width, height }
          : i
      )
    );
  };

  const pendingCount = useMemo(() => items.filter(i => i.status === 'ready').length, [items]);

  const changeQuality = (q: Quality) => {
    setQuality(q);
    // Only warm the download; re-cutting stays an explicit action.
    if (!items.some(i => i.status === 'done')) preloadModel(q);
  };

  // -------------------------------------------------------------------------
  // Item management
  // -------------------------------------------------------------------------
  const commitEdit = useCallback(
    (blob: Blob, url: string) => {
      setItems(prev =>
        prev.map(i => {
          if (i.id !== activeId) return i;
          if (i.processedUrl && i.processedUrl !== url) URL.revokeObjectURL(i.processedUrl);
          return { ...i, processedUrl: url, processedSize: blob.size };
        })
      );
    },
    [activeId]
  );

  const removeItem = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setItems(prev => {
      const target = prev.find(i => i.id === id);
      if (target) {
        URL.revokeObjectURL(target.originalUrl);
        if (target.processedUrl) URL.revokeObjectURL(target.processedUrl);
      }
      const rest = prev.filter(i => i.id !== id);
      if (activeId === id) setActiveId(rest[0]?.id ?? null);
      return rest;
    });
  };

  const resetApp = () => {
    items.forEach(i => {
      URL.revokeObjectURL(i.originalUrl);
      if (i.processedUrl) URL.revokeObjectURL(i.processedUrl);
    });
    setItems([]);
    setActiveId(null);
    setProgress(null);
  };

  useEffect(() => {
    // Revoke everything when the island unmounts.
    return () => {
      items.forEach(i => {
        URL.revokeObjectURL(i.originalUrl);
        if (i.processedUrl) URL.revokeObjectURL(i.processedUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLanguageChange = (newLang: string) => {
    window.location.href = `/${newLang.toLowerCase()}/backgroundremover`;
  };

  /** Feeds NextStepBar the flattened result without keeping a second copy around. */
  const getResult = useCallback(async () => {
    if (!activeItem?.processedUrl) return null;
    const blob = await fetch(activeItem.processedUrl).then(r => r.blob());
    const base = activeItem.name.replace(/\.[a-z0-9]+$/i, '') || activeItem.name;
    return { blob, name: `${base}-cutout.png` };
  }, [activeItem]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  const qualityLabels: Record<Quality, string> = {
    fast: t.qualityFast || 'Fast',
    balanced: t.qualityBalanced || 'Balanced',
    max: t.qualityMax || 'Maximum',
  };

  const steps = [
    { art: StepDrop, title: t.step1Title || 'Drop your image', text: t.step1Text || 'JPG, PNG, WebP, AVIF or HEIC. Nothing is uploaded anywhere.' },
    { art: StepAI, title: t.step2Title || 'The AI cuts it out', text: t.step2Text || 'A segmentation model runs on your own GPU and returns a clean alpha mask.' },
    { art: StepRefine, title: t.step3Title || 'Refine what you want', text: t.step3Text || 'Magic brush, wand, lasso, feathering and edge shift — non-destructive.' },
    { art: StepExport, title: t.step4Title || 'Export or keep going', text: t.step4Text || 'PNG, WebP or JPG, or send it straight to another tool.' },
  ];

  const featureIcons = [IconLocalAI, IconFullRes, IconOffline];
  const editorFeatureIcons = [IconBrushTools, IconHandoff, IconBatch];
  const editorFeatures =
    t.editorFeatures || [
      { title: 'A real editor, not just a button', text: 'Magic brush, magic wand, lasso, feathering, edge shift and colour decontamination.' },
      { title: 'Chained with the rest of the suite', text: 'Send the cutout to compress, crop, convert or watermark it without downloading anything.' },
      { title: 'Batch queue', text: 'Drop a whole folder in. Each image keeps its own cutout and its own edits.' },
    ];

  return (
    <div className="min-h-screen flex flex-col bg-[#07050a] text-slate-100 selection:bg-fuchsia-500/30 overflow-x-hidden font-sans">
      <Header currentLang={lang} onLanguageChange={handleLanguageChange} onReset={resetApp} t={t} />

      {/* The max width lives on <main> on purpose: AdRail measures this element
          to decide whether the fixed side rails fit, and reserving 440px from
          1400px up is what keeps them visible instead of silently suppressed. */}
      <main className="flex-1 flex flex-col items-center pt-36 pb-32 px-4 md:px-12 relative z-10 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))]">
        <AdBanner id="adsense-backgroundremover-top" />

        <div className="w-full space-y-20 md:space-y-28">
          {/* ================================================================ */}
          {/* Hero                                                             */}
          {/* ================================================================ */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center pt-2">
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex max-w-full items-center gap-2 px-4 py-2 rounded-full bg-fuchsia-950/40 border border-fuchsia-800/30 text-fuchsia-400 text-[11px] font-black tracking-[0.2em] uppercase shadow-[0_0_25px_rgba(232,121,249,0.15)]">
                <Eraser className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.badge || t.title}</span>
              </div>

              <h1 className="text-4xl md:text-6xl xl:text-7xl font-black tracking-tight leading-[0.95] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-400">
                {t.title}
              </h1>

              <p className="text-slate-400 text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
                {t.description}
              </p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                {(t.seoHeroList || []).slice(0, 3).map((point: string, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-300"
                  >
                    <Check className="w-3.5 h-3.5 text-fuchsia-400 stroke-[3]" />
                    {point}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-fuchsia-500/10 blur-[80px] rounded-full" />
              <CutoutHeroArt className="relative w-full max-w-lg mx-auto drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]" animated={!prefersReduced} />
            </div>
          </section>

          {/* ================================================================ */}
          {/* Workspace                                                        */}
          {/* ================================================================ */}
          <section className="space-y-4">
            {/* Engine controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-white/5 bg-black/30 px-4 py-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <Gauge className="w-3.5 h-3.5 text-fuchsia-400" />
                {t.qualityLabel || 'Cutout quality'}
              </div>

              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/5">
                {QUALITIES.map(q => (
                  <button
                    key={q}
                    onClick={() => changeQuality(q)}
                    title={`${qualityLabels[q]} · ~${MODEL_SIZE_MB[q]} MB`}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      quality === q ? 'bg-fuchsia-500/20 text-fuchsia-300' : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    {qualityLabels[q]}
                    <span className="ml-1 opacity-50 normal-case tracking-normal">{MODEL_SIZE_MB[q]}MB</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <label
                  title={t.precisionHint || 'Re-aligns the AI mask with the real edges of the photo. Recovers hair and fine detail.'}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={precision}
                    onChange={e => setPrecision(e.target.checked)}
                    className="accent-fuchsia-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <Crosshair className="w-3.5 h-3.5" />
                  {t.precisionLabel || 'Edge precision'}
                </label>

                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                  <Cpu className="w-3.5 h-3.5" />
                  {device === 'gpu' ? (
                    <span className="text-fuchsia-400">{t.deviceGpu || 'WebGPU acceleration'}</span>
                  ) : device === 'cpu' ? (
                    <span>{t.deviceCpu || 'CPU (WebGPU unavailable)'}</span>
                  ) : (
                    <span className="opacity-50">…</span>
                  )}
                </div>
              </div>
            </div>

            {items.length === 0 ? (
              /* ---- Dropzone ---- */
              <div
                onDrop={handleDrop}
                onDragOver={e => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`group relative border-2 border-dashed rounded-3xl p-12 md:p-20 flex flex-col items-center justify-center space-y-6 cursor-pointer transition-all shadow-xl shadow-black/20 ${
                  dragging
                    ? 'border-fuchsia-400 bg-fuchsia-500/10 scale-[1.01]'
                    : 'border-fuchsia-950 hover:border-fuchsia-500/40 bg-[#0f0a17]/30 hover:bg-[#150d22]/40'
                }`}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-fuchsia-500/10 blur-xl rounded-full scale-125 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-20 h-20 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-center text-fuchsia-400 relative z-10 transition-transform group-hover:scale-105 group-hover:-translate-y-1 shadow-lg shadow-black/40">
                    <Upload className="w-10 h-10" />
                  </div>
                </div>

                <div className="space-y-2 text-center">
                  <h2 className="text-xl font-bold text-white tracking-tight">{t.dropzonePrompt}</h2>
                  <p className="text-slate-500 text-sm font-medium">{t.dropzoneSubtitle}</p>
                </div>
              </div>
            ) : (
              /* ---- Editor ---- */
              <div className="glass-card rounded-3xl p-4 md:p-6 space-y-4 shadow-2xl border border-white/5">
                {/* Filmstrip queue */}
                <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                  {items.map(item => {
                    const isActive = item.id === activeId;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveId(item.id)}
                        className={`group relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                          isActive
                            ? 'border-fuchsia-500 shadow-[0_0_14px_rgba(232,121,249,0.35)]'
                            : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'
                        }`}
                        title={item.name}
                      >
                        <img
                          src={item.processedUrl || item.originalUrl}
                          alt={item.name}
                          className="w-full h-full object-cover checkered-bg"
                        />
                        <span className="absolute bottom-0.5 right-0.5">
                          {item.status === 'ready' && <span className="block w-2 h-2 rounded-full bg-slate-500 ring-2 ring-black/50" />}
                          {item.status === 'idle' && <span className="block w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse" />}
                          {(item.status === 'loading_model' || item.status === 'processing') && (
                            <Loader2 className="w-3.5 h-3.5 text-fuchsia-300 animate-spin drop-shadow" />
                          )}
                          {item.status === 'done' && <CheckCircle2 className="w-3.5 h-3.5 text-fuchsia-400 drop-shadow" />}
                          {item.status === 'error' && <AlertCircle className="w-3.5 h-3.5 text-red-400 drop-shadow" />}
                        </span>
                        <span
                          onClick={e => removeItem(item.id, e)}
                          className="absolute top-0.5 left-0.5 p-0.5 rounded-md bg-black/80 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </span>
                      </button>
                    );
                  })}

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="shrink-0 w-16 h-16 rounded-xl border-2 border-dashed border-white/15 hover:border-fuchsia-500/50 text-slate-500 hover:text-fuchsia-400 flex items-center justify-center transition-all cursor-pointer"
                    title={t.addMoreBtn || 'Add more'}
                  >
                    <Plus className="w-5 h-5" />
                  </button>

                  <div className="ml-auto shrink-0 pl-3 flex items-center gap-2">
                    {pendingCount > 1 && (
                      <button
                        onClick={() => startCut()}
                        className="px-3 py-2 rounded-xl bg-fuchsia-600/20 hover:bg-fuchsia-600/35 border border-fuchsia-500/40 text-fuchsia-300 text-[10px] font-black tracking-widest uppercase transition-all cursor-pointer whitespace-nowrap"
                      >
                        {(t.removeAllBtn || 'Process all {n} images').replace('{n}', String(pendingCount))}
                      </button>
                    )}
                    <button
                      onClick={resetApp}
                      className="px-3 py-2 rounded-xl bg-red-500/5 hover:bg-red-500/15 border border-red-500/20 text-red-400 text-[10px] font-black tracking-widest uppercase transition-all cursor-pointer"
                    >
                      {t.resetBtn}
                    </button>
                  </div>
                </div>

                {activeItem ? (
                  <>
                    {activeItem.status === 'error' ? (
                      <div className="h-[420px] rounded-2xl border border-red-500/20 bg-red-500/5 flex flex-col items-center justify-center gap-3 text-center px-6">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                        <p className="text-sm font-bold text-red-400">{t.statusError}</p>
                        <p className="text-xs text-slate-500 max-w-md break-words">{activeItem.error}</p>
                        <button
                          onClick={rerunAI}
                          className="mt-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all cursor-pointer"
                        >
                          {t.retryBtn || 'Try again'}
                        </button>
                      </div>
                    ) : activeItem.status === 'ready' ? (
                      /* Loaded but untouched: the cutout only runs on request. */
                      <div className="relative h-[420px] md:h-[540px] rounded-2xl overflow-hidden border border-white/5 bg-[#0a0710] flex items-center justify-center">
                        <img
                          src={activeItem.originalUrl}
                          alt={activeItem.name}
                          className="max-h-full max-w-full object-contain"
                        />
                        <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col items-center gap-3">
                          <div className="flex flex-wrap items-center justify-center gap-3">
                            <button
                              onClick={() => startCut(activeItem.id)}
                              className="px-8 py-3.5 rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-500 text-black font-black text-sm uppercase tracking-widest transition-all flex items-center gap-2.5 shadow-xl shadow-fuchsia-600/30 hover:scale-[1.03] active:scale-95 cursor-pointer"
                            >
                              <Sparkles className="w-4 h-4 stroke-[3]" />
                              {t.removeBgBtn || 'Remove background'}
                            </button>
                            <button
                              onClick={() => startManual(activeItem.id)}
                              title={t.manualHint || 'Open the editor with nothing removed and cut it out yourself.'}
                              className="px-6 py-3.5 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer"
                            >
                              <Brush className="w-4 h-4" />
                              {t.manualBtn || 'Edit by hand'}
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium text-center max-w-md">
                            {t.readyHint || 'Nothing has been processed yet. Pick a quality above and start when you are ready.'}
                          </p>
                          {pendingCount > 1 && (
                            <button
                              onClick={() => startCut()}
                              className="text-[10px] font-black uppercase tracking-widest text-fuchsia-400 hover:text-fuchsia-300 transition-colors cursor-pointer"
                            >
                              {(t.removeAllBtn || 'Process all {n} images').replace('{n}', String(pendingCount))}
                            </button>
                          )}
                        </div>
                      </div>
                    ) : activeItem.status === 'done' && activeItem.mask ? (
                      <Editor
                        key={activeItem.id}
                        item={activeItem}
                        t={t}
                        onCommit={commitEdit}
                        onRerunAI={rerunAI}
                      />
                    ) : (
                      /* Processing */
                      <div className="relative h-[420px] md:h-[540px] rounded-2xl overflow-hidden checkered-bg border border-white/5 flex items-center justify-center">
                        <img
                          src={activeItem.originalUrl}
                          alt=""
                          className="max-h-full max-w-full object-contain opacity-30 blur-sm"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm gap-4">
                          <Loader2 className="w-12 h-12 text-fuchsia-400 animate-spin" />
                          <div className="space-y-2 text-center">
                            <p className="text-sm font-bold text-white uppercase tracking-wider">
                              {activeItem.status === 'loading_model'
                                ? t.statusDownloadingModel
                                : progress?.step === 'refining'
                                ? t.statusRefining || 'Refining the edges...'
                                : t.statusProcessing}
                            </p>
                            {progress && (
                              <>
                                <div className="w-56 h-1.5 bg-white/10 rounded-full mx-auto overflow-hidden">
                                  <div
                                    className="h-full bg-fuchsia-500 transition-all duration-300"
                                    style={{ width: `${progress.percent}%` }}
                                  />
                                </div>
                                <span className="text-xs text-fuchsia-400 font-black tabular-nums">
                                  {progress.percent}%
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* File meta */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3">
                      <div>
                        <h3 className="text-sm font-bold text-white truncate max-w-[320px]">{activeItem.name}</h3>
                        <p className="text-[11px] text-slate-500 font-semibold mt-0.5 tabular-nums">
                          {t.originalSize}: {formatBytes(activeItem.originalSize)}
                          {activeItem.processedSize
                            ? ` · ${t.processedSize}: ${formatBytes(activeItem.processedSize)}`
                            : ''}
                        </p>
                      </div>
                    </div>

                    {activeItem.status === 'done' && activeItem.processedUrl && (
                      <NextStepBar lang={lang} t={t} getResult={getResult} />
                    )}
                  </>
                ) : (
                  <div className="py-16 text-center text-slate-500 text-sm">
                    {t.selectFromQueue || 'Select an image from the queue to display.'}
                  </div>
                )}
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInput}
              accept="image/*,.heic,.heif"
              multiple
              className="hidden"
            />
          </section>

          {/* ================================================================ */}
          {/* How it works                                                     */}
          {/* ================================================================ */}
          <section className="space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                {t.howItWorksTitle || 'How it works'}
              </h2>
              <div className="h-1 w-16 bg-fuchsia-500 mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {steps.map((step, i) => {
                const Art = step.art;
                return (
                  <div
                    key={i}
                    className="relative glass-card rounded-3xl p-6 space-y-4 border border-white/5 hover:border-fuchsia-500/20 transition-all group"
                  >
                    <span className="absolute top-5 right-6 text-5xl font-black text-white/5 group-hover:text-fuchsia-500/10 transition-colors">
                      {i + 1}
                    </span>
                    <Art className="w-24 h-auto text-fuchsia-400" />
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
            {[...(t.features || []), ...editorFeatures].map((feature: any, idx: number) => {
              const Icon = [...featureIcons, ...editorFeatureIcons][idx] || IconLocalAI;
              return (
                <div
                  key={idx}
                  className="p-7 glass-card rounded-3xl text-left hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-fuchsia-500/5 transition-all duration-300 group border border-white/5"
                >
                  <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 mb-5 group-hover:scale-110 group-hover:border-fuchsia-500/40 transition-all">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-white text-lg font-bold mb-2.5 group-hover:text-fuchsia-400 transition-colors">
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
                <div className="inline-block px-4 py-1.5 rounded-lg bg-fuchsia-500/10 text-fuchsia-400 text-[11px] font-black uppercase tracking-[0.2em] border border-fuchsia-500/20">
                  {t.seoKeywords?.[0]}
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white leading-[1.05] tracking-tighter">
                  {t.seoHeroTitle}
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed font-medium">{t.seoHeroText}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(t.seoHeroList || []).map((point: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all"
                    >
                      <span className="w-7 h-7 shrink-0 bg-fuchsia-500/20 text-fuchsia-400 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                      <span className="text-slate-300 font-bold text-sm">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative glass-card rounded-[3rem] p-10 py-16 min-h-[400px] flex flex-col items-center justify-center gap-7 text-center overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-fuchsia-500/10 rounded-full blur-3xl" />
                <IconLocalAI className="w-20 h-20 text-fuchsia-400 relative" />
                <div className="space-y-3 max-w-sm relative">
                  <h3 className="text-2xl font-black text-white tracking-tight leading-tight">
                    {t.seoBrowserSpeedTitle}
                  </h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">{t.seoBrowserSpeedText}</p>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-14 rounded-3xl md:rounded-[2.5rem] bg-[#0d0816] border border-white/5 space-y-10">
              <div className="max-w-4xl space-y-4">
                <h2 className="text-2xl md:text-4xl font-black text-white leading-tight">{t.seoSecondaryTitle}</h2>
                <div className="h-1.5 w-20 bg-fuchsia-500 rounded-full" />
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

            {/* FAQ */}
            <div className="max-w-4xl mx-auto w-full space-y-10">
              <div className="text-center space-y-3">
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{t.faqTitle}</h2>
                <div className="h-1 w-16 bg-fuchsia-500 mx-auto rounded-full" />
              </div>
              <div className="grid gap-3">
                {(t.faq || []).map((faq: any, idx: number) => (
                  <details
                    key={idx}
                    className="glass-card rounded-2xl px-6 py-5 text-left border border-white/5 hover:border-fuchsia-500/20 transition-colors group [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex items-start gap-3 cursor-pointer list-none text-base font-bold text-white group-hover:text-fuchsia-400 transition-colors">
                      <span className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400 text-[11px] font-black">
                        Q
                      </span>
                      <span className="flex-1">{faq.question}</span>
                      <span className="shrink-0 text-fuchsia-400 transition-transform group-open:rotate-45 text-xl leading-none">
                        +
                      </span>
                    </summary>
                    <p className="text-slate-400 leading-relaxed pl-9 pt-3 text-sm">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>

            {/* Keywords */}
            <div className="max-w-4xl mx-auto w-full space-y-5 opacity-55 text-center">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                {t.seoKeywordsTitle}
              </h2>
              <div className="flex flex-wrap justify-center gap-2">
                {(t.seoKeywords || []).map((keyword: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 hover:bg-fuchsia-500/10 hover:border-fuchsia-500/20 hover:text-fuchsia-400 transition-all cursor-default"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>

        <AdBanner id="adsense-backgroundremover-bottom" />
      </main>

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={t.scrollTopLabel || 'Back to top'}
          className="fixed bottom-10 right-10 z-[200] w-12 h-12 bg-white text-black rounded-2xl shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 hover:-translate-y-1 cursor-pointer"
        >
          <ArrowUp className="w-5 h-5 stroke-[3]" />
        </button>
      )}
    </div>
  );
};

export default Backgroundremover;
