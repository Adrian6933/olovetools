import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ImagePlus, Keyboard, Sparkles, TriangleAlert, X } from 'lucide-react';
import { createTranslator } from '../../locales/meta';
import { AdBanner } from '../../components/shared/AdBanner';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { legalTranslations } from '../../locales/legal';
import { useHandoffIntake } from '../../lib/useHandoff';

import type { BackdropSource, ExportSettings, Layer } from './types';
import { canvasBox, resolveBackdrop, preloadStickers, type Backdrop } from './lib/render';
import { exportMeme, maxScale } from './lib/export';
import { blankDoc, docFromImage, docFromTemplate, templateSource } from './lib/doc';
import { getTemplate } from './lib/templates';
import { ACCEPT, firstImageFile, loadImageFile, MAX_BYTES, type IntakeError, type LoadedImage } from './lib/intake';
import { useMemeDoc } from './lib/useMemeDoc';
import { Stage } from './components/Stage';
import { Inspector, type InspectorTab } from './components/Inspector';
import { ExportBar } from './components/ExportBar';
import { NextStepBar } from './components/NextStepBar';
import {
  IconHandoff,
  IconKeys,
  IconLayers,
  IconLocal,
  IconVector,
  IconWrap,
  MemeHeroArt,
  StepExport,
  StepPick,
  StepTune,
  StepWrite,
} from './components/Illustrations';

interface MemeBoltProps {
  lang: string;
  dictionary: any;
}

const FIRST_TEMPLATE = 'two-panel';

/** How the picture is set up when the user presses "use this picture". */
type StagingMode = 'topBottom' | 'captionBar' | 'none';

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
};

export const MemeBolt: React.FC<MemeBoltProps> = ({ lang, dictionary }) => {
  const t = createTranslator(dictionary);
  const prefersReduced = usePrefersReducedMotion();

  const initialDoc = useMemo(() => docFromTemplate(getTemplate(FIRST_TEMPLATE)), []);
  const api = useMemeDoc(initialDoc);
  const { doc } = api;

  const [source, setSource] = useState<BackdropSource>(() => templateSource(FIRST_TEMPLATE));
  const [templateId, setTemplateId] = useState<string | null>(FIRST_TEMPLATE);
  const [backdrop, setBackdrop] = useState<Backdrop>({ image: null, width: 1, height: 1 });

  const [pending, setPending] = useState<{ image: LoadedImage; from: string | null } | null>(null);
  const [stagingMode, setStagingMode] = useState<StagingMode>('topBottom');
  const [intakeError, setIntakeError] = useState<IntakeError | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<InspectorTab>('background');

  const [settings, setSettings] = useState<ExportSettings>({ format: 'image/png', scale: 2, quality: 0.92 });
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportError, setExportError] = useState(false);
  const [dragging, setDragging] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'privacy' | 'terms' | 'cookies'>('privacy');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const studioRef = useRef<HTMLDivElement | null>(null);

  // ------------------------------------------------------------------
  // Backdrop resolution. Templates are SVG, so they are rasterised for the
  // document's own pixel width instead of being blown up from a thumbnail.
  // ------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    const target = Math.min(Math.max(doc.width, 900), 2048);
    resolveBackdrop(source, target)
      .then(next => {
        if (!cancelled) setBackdrop(next);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [source, doc.width]);

  useEffect(() => {
    preloadStickers(doc);
  }, [doc]);

  // ------------------------------------------------------------------
  // Intake — nothing is applied to the canvas on drop. The picture waits in a
  // staging card until the user says how they want it used.
  // ------------------------------------------------------------------
  const acceptFile = useCallback(async (file: File, from: string | null = null) => {
    setIntakeError(null);
    const result = await loadImageFile(file);
    if (result.error || !result.value) {
      setIntakeError(result.error || 'decode');
      return;
    }
    setPending({ image: result.value, from });
    setStagingMode('topBottom');
    setTab('background');
    studioRef.current?.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
  }, [prefersReduced]);

  const acceptRef = useRef(acceptFile);
  acceptRef.current = acceptFile;

  useHandoffIntake((file, from) => {
    void acceptRef.current(file, from);
  });

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const file = firstImageFile(event.clipboardData?.items || null);
      if (!file) return;
      event.preventDefault();
      void acceptRef.current(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  const applyPending = () => {
    if (!pending) return;
    const { image } = pending;
    const next = docFromImage(image.width, image.height, {
      captionBar: stagingMode === 'captionBar' ? 22 : 0,
      withCaptions: stagingMode === 'topBottom',
    });
    // Release the previous decode before the reference is dropped.
    if (source.kind === 'image') (source.image as ImageBitmap).close?.();
    setSource({ kind: 'image', name: image.name, image: image.image, width: image.width, height: image.height });
    setTemplateId(null);
    api.replace(next);
    setSelectedId(next.layers[0]?.id ?? null);
    setPending(null);
    setTab(next.layers.length ? 'text' : 'canvas');
  };

  const discardPending = () => {
    if (pending) (pending.image.image as ImageBitmap).close?.();
    setPending(null);
  };

  const pickTemplate = (id: string) => {
    if (source.kind === 'image') (source.image as ImageBitmap).close?.();
    setTemplateId(id);
    setSource(templateSource(id));
    api.replace(docFromTemplate(getTemplate(id)));
    setSelectedId(null);
    setTab('text');
  };

  const startBlank = (ratio: number) => {
    if (source.kind === 'image') (source.image as ImageBitmap).close?.();
    const width = 1080;
    setTemplateId(null);
    setSource({ kind: 'blank', color: '#0b0710' });
    const next = blankDoc(width, Math.round(width / ratio), '#0b0710');
    api.replace(next);
    setSelectedId(next.layers[0]?.id ?? null);
    setTab('text');
  };

  const resetAll = () => {
    if (source.kind === 'image') (source.image as ImageBitmap).close?.();
    discardPending();
    setTemplateId(FIRST_TEMPLATE);
    setSource(templateSource(FIRST_TEMPLATE));
    api.replace(docFromTemplate(getTemplate(FIRST_TEMPLATE)));
    setSelectedId(null);
    setTab('background');
    setIntakeError(null);
  };

  // ------------------------------------------------------------------
  // Keyboard. Registered once and reading through a ref: re-registering on
  // every render would drop keystrokes that land mid-update.
  // ------------------------------------------------------------------
  const keyStateRef = useRef({ api, selectedId });
  keyStateRef.current = { api, selectedId };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable)) return;

      const { api: current, selectedId: id } = keyStateRef.current;
      const meta = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      if (meta && key === 'z') {
        event.preventDefault();
        event.shiftKey ? current.redo() : current.undo();
        return;
      }
      if (meta && key === 'y') {
        event.preventDefault();
        current.redo();
        return;
      }

      if (!id) return;
      // `current()` and not `current.doc`: `doc` is the value from the last
      // render, and holding an arrow key fires far faster than React re-renders,
      // so every repeat would read the same starting position and the layer
      // would move exactly one step no matter how long the key is held.
      const layer = current.current().layers.find(l => l.id === id);
      if (!layer) return;

      if (meta && key === 'd') {
        event.preventDefault();
        const copy = { ...layer, id: `${layer.kind[0]}_${Date.now().toString(36)}`, x: layer.x + 4, y: layer.y + 4 } as Layer;
        current.mutate(d => ({ ...d, layers: [...d.layers, copy] }));
        setSelectedId(copy.id);
        return;
      }
      if (event.key === 'Escape') {
        setSelectedId(null);
        return;
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        current.mutate(d => ({ ...d, layers: d.layers.filter(l => l.id !== id) }));
        setSelectedId(null);
        return;
      }

      const step = event.shiftKey ? 5 : 0.5;
      const nudge: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      };
      const delta = nudge[event.key];
      if (delta) {
        event.preventDefault();
        // Transient: a held arrow key is one gesture, so it collapses into a
        // single undo entry instead of one per auto-repeat tick.
        current.patchLayer(id, { x: layer.x + delta[0], y: layer.y + delta[1] }, true);
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key.startsWith('Arrow')) keyStateRef.current.api.commit();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // ------------------------------------------------------------------
  // Export
  // ------------------------------------------------------------------
  const baseName = source.kind === 'image' ? source.name : `meme-${templateId || 'blank'}`;
  const exportRef = useRef({ doc, source, settings, baseName });
  exportRef.current = { doc, source, settings, baseName };

  const renderResult = useCallback(async () => {
    const state = exportRef.current;
    const result = await exportMeme(state.doc, state.source, state.settings, state.baseName);
    return { blob: result.blob, name: result.name };
  }, []);

  const handleDownload = async () => {
    setBusy(true);
    setExportError(false);
    try {
      const result = await renderResult();
      const url = URL.createObjectURL(result.blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = result.name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      // Revoked late on purpose: Safari cancels the download if the URL dies first.
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      setExportError(true);
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    setBusy(true);
    setExportError(false);
    try {
      const state = exportRef.current;
      const result = await exportMeme(state.doc, state.source, { ...state.settings, format: 'image/png' }, state.baseName);
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': result.blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setExportError(true);
    } finally {
      setBusy(false);
    }
  };

  const box = canvasBox(doc);
  const effectiveScale = Math.min(settings.scale, maxScale(doc));
  const output = {
    width: Math.round(box.width * effectiveScale),
    height: Math.round(box.height * effectiveScale),
  };

  const handleOpenLegal = (type: 'privacy' | 'terms' | 'cookies') => {
    setModalType(type);
    setModalOpen(true);
  };

  const errorMessages: Record<IntakeError, string> = {
    size: t.errSize || `That file is over ${Math.round(MAX_BYTES / 1024 / 1024)} MB.`,
    decode: t.errDecode || 'This browser could not decode that picture.',
    heic: t.errHeic || 'That HEIC could not be converted. Export it as JPG from your phone and try again.',
    type: t.errType || 'That is not an image file.',
  };

  const steps = [
    { art: StepPick, key: 0 },
    { art: StepWrite, key: 1 },
    { art: StepTune, key: 2 },
    { art: StepExport, key: 3 },
  ];
  const stepCopy: any[] = Array.isArray(t.steps) ? t.steps : [];

  const featureIcons = [IconLocal, IconVector, IconWrap, IconLayers, IconKeys, IconHandoff];
  const features: any[] = Array.isArray(t.features) ? t.features : [];

  const shortcuts: any[] = Array.isArray(t.shortcuts) ? t.shortcuts : [];

  return (
    <div className="min-h-screen bg-[#020205] text-slate-200 font-sans flex flex-col overflow-x-hidden">
      <Header
        currentLang={lang}
        onLanguageChange={newLang => {
          window.location.href = `/${newLang.toLowerCase()}/meme-bolt`;
        }}
        onReset={resetAll}
        t={t}
      />

      {/* The max width lives on <main>: AdRail measures this element to decide
          whether the fixed side rails fit, and reserving 440px from 1400px up is
          what keeps them visible instead of silently suppressed. */}
      <main className="flex-1 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))] px-4 md:px-8 pt-36 pb-24 relative z-10 flex flex-col">
        <AdBanner id="adsense-meme-bolt-top" />

        <div className="w-full space-y-20 md:space-y-28">
          {/* ============================================================ */}
          {/* Hero                                                          */}
          {/* ============================================================ */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center pt-2">
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex max-w-full items-center gap-2 px-4 py-2 rounded-full bg-fuchsia-950/40 border border-fuchsia-800/30 text-fuchsia-400 text-[11px] font-black tracking-[0.2em] uppercase">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.badge || t.title}</span>
              </div>

              <h1 className="text-4xl md:text-6xl xl:text-7xl font-black tracking-tight leading-[0.95] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-400">
                {t.title}
              </h1>

              <p className="text-slate-400 text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">{t.description}</p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                {(t.seoHeroList || []).slice(0, 3).map((point: string, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-300"
                  >
                    <Check className="w-3.5 h-3.5 text-fuchsia-400 stroke-[3] shrink-0" />
                    {point}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-fuchsia-500/10 blur-[80px] rounded-full" />
              <MemeHeroArt
                className="relative w-full max-w-lg mx-auto drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
                animated={!prefersReduced}
              />
            </div>
          </section>

          {/* ============================================================ */}
          {/* Studio                                                        */}
          {/* ============================================================ */}
          <section
            ref={studioRef}
            onDragOver={e => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => {
              e.preventDefault();
              setDragging(false);
              const file = firstImageFile(e.dataTransfer?.files || null);
              if (file) void acceptFile(file);
            }}
            className={`glass-card rounded-3xl p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start glow-fuchsia transition-colors ${
              dragging ? 'ring-2 ring-fuchsia-400' : ''
            }`}
          >
            <div className="lg:col-span-7 min-w-0 flex flex-col gap-3">
              <Stage api={api} backdrop={backdrop} selectedId={selectedId} onSelect={setSelectedId} t={t} />

              <details className="rounded-2xl border border-white/5 bg-black/20 px-4 py-3 group [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center gap-2 cursor-pointer list-none text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-slate-300 transition-colors">
                  <Keyboard className="w-3.5 h-3.5 text-fuchsia-400" />
                  {t.shortcutsTitle || 'Keyboard & mouse'}
                  <span className="ml-auto text-fuchsia-400 text-sm leading-none group-open:rotate-45 transition-transform">+</span>
                </summary>
                <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 pt-3 list-none p-0 m-0">
                  {shortcuts.map((item: any, i: number) => (
                    <li key={i} className="flex items-baseline justify-between gap-3 text-[11px]">
                      <span className="text-slate-400">{item.label}</span>
                      <kbd className="shrink-0 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-300">
                        {item.keys}
                      </kbd>
                    </li>
                  ))}
                </ul>
              </details>
            </div>

            <div className="lg:col-span-5 min-w-0 flex flex-col gap-5 bg-black/20 p-4 md:p-5 rounded-2xl border border-white/5">
              <Inspector
                api={api}
                t={t}
                selectedId={selectedId}
                onSelect={setSelectedId}
                tab={tab}
                setTab={setTab}
                templateId={templateId}
                onPickTemplate={pickTemplate}
                onRequestUpload={() => fileInputRef.current?.click()}
                onBlankCanvas={startBlank}
              >
                {/* Staging card: an upload never redraws the canvas by itself. */}
                {pending && (
                  <div className="rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/5 p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <PendingThumb image={pending.image} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-white truncate">{pending.image.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold tabular-nums">
                          {pending.image.width} × {pending.image.height} px
                        </p>
                        {pending.from && (
                          <p className="text-[10px] text-fuchsia-400 font-bold mt-0.5">
                            {t.stagedFrom || 'Handed over by'} {pending.from}
                          </p>
                        )}
                        {pending.image.converted && (
                          <p className="text-[10px] text-amber-400/90 mt-0.5">{t.stagedHeic || 'HEIC converted to JPG'}</p>
                        )}
                        {pending.image.downscaled && (
                          <p className="text-[10px] text-amber-400/90 mt-0.5">
                            {t.stagedDownscaled || 'Scaled down to 4096 px on the long side'}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={discardPending}
                        aria-label={t.stagedCancel || 'Discard'}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                      {t.stagedHint || 'Nothing has been applied yet. Pick how the captions should start:'}
                    </p>

                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          ['topBottom', t.stagedTopBottom || 'Top + bottom'],
                          ['captionBar', t.stagedCaptionBar || 'White bar'],
                          ['none', t.stagedNone || 'Empty'],
                        ] as [StagingMode, string][]
                      ).map(([mode, label]) => (
                        <button
                          key={mode}
                          onClick={() => setStagingMode(mode)}
                          className={`py-2 px-1 rounded-lg border text-[10px] font-black uppercase tracking-wide transition-colors cursor-pointer ${
                            stagingMode === mode
                              ? 'bg-fuchsia-500 text-white border-fuchsia-400'
                              : 'bg-black/30 text-slate-400 border-white/10 hover:text-white'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={applyPending}
                      className="w-full py-2.5 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ImagePlus className="w-4 h-4" />
                      {t.stagedUse || 'Use this picture'}
                    </button>
                  </div>
                )}

                {intakeError && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/5 px-3 py-2.5 text-[11px] text-rose-300 font-medium">
                    <TriangleAlert className="w-4 h-4 shrink-0 mt-px" />
                    <span className="min-w-0">{errorMessages[intakeError]}</span>
                  </div>
                )}
              </Inspector>

              <input
                type="file"
                ref={fileInputRef}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) void acceptFile(file);
                  e.target.value = '';
                }}
                accept={ACCEPT}
                className="hidden"
              />

              <ExportBar
                t={t}
                settings={settings}
                onChange={setSettings}
                onDownload={handleDownload}
                onCopy={handleCopy}
                busy={busy}
                copied={copied}
                output={output}
                maxScale={maxScale(doc)}
              />

              {exportError && (
                <p className="text-[11px] text-rose-300 font-medium text-center">
                  {t.exportError || 'The meme could not be rendered. Try a smaller resolution.'}
                </p>
              )}

              <NextStepBar lang={lang} t={t} getResult={renderResult} />
            </div>
          </section>

          {/* ============================================================ */}
          {/* How it works                                                  */}
          {/* ============================================================ */}
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
                    key={step.key}
                    className="relative glass-card rounded-3xl p-6 space-y-4 border border-white/5 hover:border-fuchsia-500/20 transition-all group"
                  >
                    <span className="absolute top-5 right-6 text-5xl font-black text-white/5 group-hover:text-fuchsia-500/10 transition-colors">
                      {i + 1}
                    </span>
                    <Art className="w-24 h-auto text-fuchsia-400" />
                    <h3 className="text-base font-bold text-white leading-snug">{stepCopy[i]?.title}</h3>
                    <p className="text-slate-500 text-[13px] leading-relaxed font-medium">{stepCopy[i]?.text}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ============================================================ */}
          {/* Features                                                      */}
          {/* ============================================================ */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature: any, idx: number) => {
              const Icon = featureIcons[idx] || IconLocal;
              return (
                <div
                  key={idx}
                  className="p-7 glass-card rounded-3xl text-left hover:-translate-y-1.5 transition-all duration-300 group border border-white/5"
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
          </section>

          {/* ============================================================ */}
          {/* SEO copy                                                      */}
          {/* ============================================================ */}
          <section className="space-y-24 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-24 items-center">
              <div className="space-y-7">
                <div className="inline-block px-4 py-1.5 rounded-lg bg-fuchsia-500/10 text-fuchsia-400 text-[11px] font-black uppercase tracking-[0.2em] border border-fuchsia-500/20">
                  {(t.seoKeywords || [])[0]}
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

              <div className="relative glass-card rounded-[3rem] p-10 py-16 min-h-[360px] flex flex-col items-center justify-center gap-7 text-center overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-fuchsia-500/10 rounded-full blur-3xl" />
                <IconVector className="w-20 h-20 text-fuchsia-400 relative" />
                <div className="space-y-3 max-w-sm relative">
                  <h3 className="text-2xl font-black text-white tracking-tight leading-tight">{t.seoBrowserSpeedTitle}</h3>
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
                      <span className="flex-1 min-w-0">{faq.question}</span>
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
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">{t.seoKeywordsTitle}</h2>
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

        <AdBanner id="adsense-meme-bolt-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={handleOpenLegal} />

      <LegalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          modalType === 'privacy'
            ? legalTranslations[lang]?.nav.privacy || 'Privacy Policy'
            : modalType === 'terms'
              ? legalTranslations[lang]?.nav.terms || 'Terms of Service'
              : legalTranslations[lang]?.nav.cookies || 'Cookie Policy'
        }
        content={
          modalType === 'privacy'
            ? legalTranslations[lang]?.privacy.content || ''
            : modalType === 'terms'
              ? legalTranslations[lang]?.terms.content || ''
              : legalTranslations[lang]?.cookies.content || ''
        }
        t={t}
      />
    </div>
  );
};

/** Thumbnail of the staged picture, painted straight from the decoded source. */
const PendingThumb: React.FC<{ image: LoadedImage }> = ({ image }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const size = 56;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const scale = Math.max(size / image.width, size / image.height);
    const w = image.width * scale;
    const h = image.height * scale;
    ctx.drawImage(image.image, (size - w) / 2, (size - h) / 2, w, h);
  }, [image]);

  return <canvas ref={ref} className="w-14 h-14 rounded-lg border border-white/10 shrink-0 bg-black/40" />;
};

export default MemeBolt;
