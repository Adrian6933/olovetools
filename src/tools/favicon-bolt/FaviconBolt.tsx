import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUp,
  Check,
  Clipboard,
  ClipboardCheck,
  Download,
  FileCode2,
  Loader2,
  Package,
  Sparkles,
  Zap,
} from 'lucide-react';

import { createTranslator } from '../../locales/meta';
import { AdBanner } from '../../components/shared/AdBanner';
import { useReducedMotion, fadeInUp } from '../../components/shared/motion';
import { useHandoffIntake } from '../../lib/useHandoff';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { Controls } from './components/Controls';
import { Stage } from './components/Stage';
import { NextStepBar } from './components/NextStepBar';
import {
  FaviconHeroArt,
  IconHandoff,
  IconLocalOnly,
  IconMultiRes,
  IconSnippet,
  IconSquircle,
  IconTouchIcon,
  StepPreview,
  StepShip,
  StepSource,
  StepStyle,
} from './components/Illustrations';
import { legalTranslations } from '../../locales/legal';
import type { AssetId, IconSettings, SourceImage } from './types';
import { canvasToBlob, frameAt, renderMaster, type AnyCanvas } from './lib/engine';
import { loadSource, type LoadError } from './lib/source';
import { ALL_ASSETS, ASSET_FILES, DEFAULT_ASSETS, buildPack, buildSnippet, type PackResult } from './lib/pack';

interface FaviconBoltProps {
  lang: string;
  dictionary: any;
}

const DEFAULTS: IconSettings = {
  mode: 'emoji',
  emoji: '⚡',
  text: 'AB',
  textColor: '#ffffff',
  fontFamily: 'system-ui',
  fontWeight: 900,
  fontScale: 62,
  shape: 'squircle',
  fill: 'solid',
  bgColor: '#3b82f6',
  bgColor2: '#4338ca',
  gradientAngle: 135,
  padding: 14,
  borderWidth: 0,
  borderColor: '#ffffff',
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  rotation: 0,
  trim: true,
  clipToShape: true,
  appleBg: '#0b1220',
  sharpenSmall: true,
  appName: 'My Site',
  appShortName: 'My Site',
  themeColor: '#3b82f6',
};

/** Object URL bound to a blob's lifetime — revoked as soon as it is replaced. */
function useBlobUrl(blob: Blob | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob || blob.size === 0) {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  return url;
}

export const FaviconBolt: React.FC<FaviconBoltProps> = ({ lang, dictionary }) => {
  const t = createTranslator(dictionary);
  const prefersReduced = useReducedMotion();

  // --- Settings + undo history -------------------------------------------
  // History entries are plain settings objects: ~40 scalars each, so 60 steps
  // cost tens of KB instead of 60 full bitmaps.
  const [settings, setSettings] = useState<IconSettings>(DEFAULTS);
  const settingsRef = useRef(settings);
  const baseline = useRef(settings);
  const past = useRef<IconSettings[]>([]);
  const future = useRef<IconSettings[]>([]);
  const [historyTick, setHistoryTick] = useState(0);

  const update = useCallback((patch: Partial<IconSettings>, commit = false) => {
    const next = { ...settingsRef.current, ...patch };
    settingsRef.current = next;
    setSettings(next);
    if (!commit) return;
    if (JSON.stringify(baseline.current) === JSON.stringify(next)) return;
    past.current = [...past.current.slice(-59), baseline.current];
    future.current = [];
    baseline.current = next;
    setHistoryTick(v => v + 1);
  }, []);

  const applyHistory = useCallback((value: IconSettings) => {
    settingsRef.current = value;
    baseline.current = value;
    setSettings(value);
    setHistoryTick(v => v + 1);
  }, []);

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(baseline.current);
    applyHistory(prev);
  }, [applyHistory]);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(baseline.current);
    applyHistory(next);
  }, [applyHistory]);

  // The stacks live in refs (a 60-entry array in state would re-render on every
  // push); `historyTick` is the signal that tells these two to re-read them.
  const canUndo = useMemo(() => past.current.length > 0, [historyTick]);
  const canRedo = useMemo(() => future.current.length > 0, [historyTick]);

  // --- Source -------------------------------------------------------------
  const [source, setSource] = useState<SourceImage | null>(null);
  const [loadError, setLoadError] = useState<LoadError | null>(null);
  const sourceRef = useRef<SourceImage | null>(null);
  sourceRef.current = source;

  const replaceSource = useCallback((next: SourceImage | null) => {
    setSource(prev => {
      if (prev && prev.url !== next?.url) URL.revokeObjectURL(prev.url);
      return next;
    });
  }, []);

  useEffect(
    () => () => {
      if (sourceRef.current) URL.revokeObjectURL(sourceRef.current.url);
    },
    []
  );

  const pickFile = useCallback(
    async (file: File) => {
      setLoadError(null);
      const result = await loadSource(file);
      if ('error' in result) {
        setLoadError(result.error);
        return;
      }
      replaceSource(result.source);
      // The upload only parks the file: nothing expensive runs until the
      // Generate button is pressed.
      update({ mode: 'image', offsetX: 0, offsetY: 0, scale: 1, rotation: 0 }, true);
    },
    [replaceSource, update]
  );

  useHandoffIntake(file => {
    void pickFile(file);
  });

  // --- Master render ------------------------------------------------------
  // Debounced: the artboard draws itself directly and stays instant, while the
  // true-size chips come off the same 1024px master the export uses, so what
  // you see at 16px is byte-for-byte what lands in the ZIP.
  const [master, setMaster] = useState<AnyCanvas | null>(null);
  useEffect(() => {
    const id = setTimeout(() => setMaster(renderMaster({ settings, source })), 60);
    return () => clearTimeout(id);
  }, [settings, source]);

  // --- Assets + pack ------------------------------------------------------
  const [assets, setAssets] = useState<AssetId[]>(DEFAULT_ASSETS);
  const [pack, setPack] = useState<PackResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [genFailed, setGenFailed] = useState(false);

  // Any edit invalidates a generated pack — offering a stale ZIP would be worse
  // than asking for one more click.
  useEffect(() => {
    setPack(null);
  }, [settings, source, assets]);

  const zipUrl = useBlobUrl(pack?.zip ?? null);
  const icoUrl = useBlobUrl(pack?.ico ?? null);
  const svgBlob = useMemo(() => (pack ? new Blob([pack.svg], { type: 'image/svg+xml' }) : null), [pack]);
  const svgUrl = useBlobUrl(svgBlob);

  const livePreviewSnippet = useMemo(() => buildSnippet(settings, new Set(assets)), [settings, assets]);

  const generate = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setProgress(0);
    setGenFailed(false);
    try {
      const result = await buildPack(settingsRef.current, sourceRef.current, assets, (done, total) =>
        setProgress(Math.round((done / total) * 100))
      );
      setPack(result);
    } catch (err) {
      console.error('FaviconBolt pack build failed', err);
      setGenFailed(true);
    } finally {
      setBusy(false);
    }
  }, [assets, busy]);

  const snippetRef = useRef<HTMLPreElement | null>(null);

  const copySnippet = useCallback(async () => {
    const text = pack?.snippet || livePreviewSnippet;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    } catch {
      // The async clipboard needs a focused document and a secure context;
      // neither is guaranteed. Fall through instead of failing silently.
    }
    try {
      const scratch = document.createElement('textarea');
      scratch.value = text;
      scratch.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(scratch);
      scratch.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(scratch);
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
    } catch {
      // Last resort below.
    }
    // Nothing worked: select the block so Ctrl+C still does the job, and do
    // not claim it was copied.
    const node = snippetRef.current;
    if (node) {
      const range = document.createRange();
      range.selectNodeContents(node);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [pack, livePreviewSnippet]);

  const getHandoffResult = useCallback(async () => {
    const canvas = renderMaster({ settings: settingsRef.current, source: sourceRef.current });
    const blob = await canvasToBlob(frameAt(canvas, 512, false));
    return { blob, name: 'favicon-512.png' };
  }, []);

  // --- Keyboard -----------------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = !!el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
      }
      if (typing || mod) return;

      const s = settingsRef.current;
      const step = e.shiftKey ? 5 : 1;
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        update({ scale: Math.min(4, s.scale * 1.1) }, true);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        update({ scale: Math.max(0.2, s.scale / 1.1) }, true);
      } else if (e.key === '0') {
        e.preventDefault();
        update({ offsetX: 0, offsetY: 0, scale: 1, rotation: 0 }, true);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        update({ offsetX: Math.max(-60, s.offsetX - step) }, true);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        update({ offsetX: Math.min(60, s.offsetX + step) }, true);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        update({ offsetY: Math.max(-60, s.offsetY - step) }, true);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        update({ offsetY: Math.min(60, s.offsetY + step) }, true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, update]);

  // --- Chrome -------------------------------------------------------------
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'privacy' | 'terms' | 'cookies'>('privacy');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 700);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const resetAll = () => {
    replaceSource(null);
    past.current = [];
    future.current = [];
    applyHistory(DEFAULTS);
    setAssets(DEFAULT_ASSETS);
    setPack(null);
    setLoadError(null);
  };

  const errorText = loadError
    ? t[`error_${loadError}`] ||
      {
        type: 'That file is not an image we can read.',
        size: 'That file is over 30 MB. Try a smaller export.',
        heic: 'This HEIC could not be converted in the browser. Export it as PNG or JPG first.',
        decode: 'The file could not be decoded. It may be corrupt.',
        svgSize: 'This SVG has no width/height or viewBox, so browsers cannot size it.',
      }[loadError]
    : null;

  const steps = t.steps || [
    { title: 'Pick a source', text: 'An emoji, one to three letters, or your own logo. Nothing is uploaded.' },
    { title: 'Style the plate', text: 'Shape, colour or gradient, border and padding, all live.' },
    { title: 'Place it by hand', text: 'Drag, wheel-zoom at the cursor, rotate. Undo is one keystroke away.' },
    { title: 'Ship the pack', text: 'ICO, SVG, touch icons, manifest and the <head> snippet, ready to paste.' },
  ];
  const stepArt = [StepSource, StepStyle, StepPreview, StepShip];

  const features = t.features || [
    { title: 'A real multi-frame ICO', text: '16, 32 and 48 pixel frames written as BMP with an AND mask, not PNG streams.' },
    { title: 'True squircle', text: 'A superellipse, the same family of curve iOS uses — not a rounded rectangle.' },
    { title: 'Vector favicon.svg', text: 'Emoji and letter icons export as real vector, crisp at any resolution.' },
    { title: 'Correct iOS touch icon', text: 'Flattened onto your colour, because iOS renders alpha as black.' },
    { title: 'Head snippet included', text: 'The exact link tags for the files you picked, ready to paste.' },
    { title: 'Nothing leaves the tab', text: 'Canvas and JSZip in your browser. No upload, no API, no account.' },
  ];
  const featureIcons = [IconMultiRes, IconSquircle, IconSnippet, IconTouchIcon, IconHandoff, IconLocalOnly];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 font-sans flex flex-col overflow-x-hidden">
      <Header
        currentLang={lang}
        onLanguageChange={newLang => {
          window.location.href = `/${newLang.toLowerCase()}/favicon-bolt`;
        }}
        onReset={resetAll}
        t={t}
      />

      {/* The max width lives on <main>: AdRail measures this element to decide
          whether the fixed side rails fit, and the old max-w-7xl left a 57px
          gap at 1400px, which meant the rails were never rendered at all. */}
      <main className="flex-1 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))] px-4 md:px-8 pt-36 pb-24 relative z-10 flex flex-col">
        <AdBanner id="adsense-favicon-bolt-top" />

        <div className="w-full space-y-20 md:space-y-28">
          {/* ============================== Hero ============================== */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center pt-2">
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex max-w-full items-center gap-2 px-4 py-2 rounded-full bg-blue-950/40 border border-blue-800/30 text-blue-400 text-[11px] font-black tracking-[0.2em] uppercase">
                <Zap className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.badge || t.title}</span>
              </div>

              <h1 className="text-4xl md:text-5xl xl:text-6xl font-black font-outfit tracking-tight leading-[1.02] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-400">
                {t.seoHeroTitle || 'Create favicons and web app icons instantly'}
              </h1>

              <p className="text-slate-400 text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
                {t.seoHeroText || t.description}
              </p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                {(t.seoHeroList || []).slice(0, 3).map((point: string, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-300"
                  >
                    <Check className="w-3.5 h-3.5 text-blue-400 stroke-[3] shrink-0" />
                    {point}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/10 blur-[80px] rounded-full" />
              <FaviconHeroArt
                className="relative w-full max-w-lg mx-auto drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
                animated={!prefersReduced}
              />
            </div>
          </section>

          {/* ============================ Workspace =========================== */}
          <section className="glass-card rounded-3xl p-4 md:p-6 shadow-2xl glow-indigo grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-4 bg-black/20 border border-white/5 rounded-2xl p-5 overflow-hidden">
              <Controls
                settings={settings}
                source={source}
                update={update}
                onPickFile={pickFile}
                onClearSource={() => replaceSource(null)}
                onUndo={undo}
                onRedo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
                error={errorText}
                t={t}
              />
            </div>

            <div className="lg:col-span-5 bg-black/30 border border-white/5 rounded-2xl p-5 min-w-0">
              <Stage
                settings={settings}
                source={source}
                master={master}
                onTransform={patch => update(patch, false)}
                onCommit={() => update({}, true)}
                t={t}
                lang={lang}
              />
            </div>

            <div className="lg:col-span-3 bg-black/20 border border-white/5 rounded-2xl p-5 flex flex-col gap-4 min-w-0">
              <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest border-b border-white/5 pb-2">
                {t.label_output_files || 'Files to generate'}
              </h3>

              <div className="flex-1 flex flex-col gap-1.5 max-h-[420px] overflow-y-auto pr-1">
                {ALL_ASSETS.map(id => {
                  const on = assets.includes(id);
                  return (
                    <label
                      key={id}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        on ? 'border-blue-500/30 bg-blue-500/5' : 'border-white/5 bg-black/30 hover:border-white/10'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={e =>
                          setAssets(prev => (e.target.checked ? [...prev, id] : prev.filter(a => a !== id)))
                        }
                        className="accent-blue-500 w-3.5 h-3.5 mt-0.5 cursor-pointer shrink-0"
                      />
                      <span className="min-w-0 flex flex-col gap-0.5">
                        <span className="text-[11px] font-bold text-white font-mono break-all">
                          {ASSET_FILES[id]}
                        </span>
                        <span className="text-[9px] text-slate-500 font-bold leading-snug">
                          {t[`asset_${id}`] || ''}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>

              <button
                onClick={generate}
                disabled={busy || assets.length === 0}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black text-sm uppercase rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-3 active:scale-95 duration-200 outline-none shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                <span>{busy ? `${progress}%` : t.generateBtn || 'Generate the pack'}</span>
              </button>

              {genFailed && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] font-bold text-red-300">
                  {t.error_generate || 'The pack could not be built. Try fewer files or a smaller source image.'}
                </div>
              )}

              {pack && (
                <div className="flex flex-col gap-2 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-3">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    {t.readyLabel || 'Ready'}
                    <span className="ml-auto font-mono normal-case text-slate-400">
                      {(pack.bytes / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  {zipUrl && (
                    <a
                      href={zipUrl}
                      download="favicon-pack.zip"
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-black text-xs font-black uppercase hover:bg-slate-200 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {t.btn_download_zip || 'Download ZIP'}
                    </a>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {icoUrl && (
                      <a
                        href={icoUrl}
                        download="favicon.ico"
                        className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-white/10 bg-white/5 text-[10px] font-black uppercase text-slate-300 hover:bg-white/10 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        .ico
                      </a>
                    )}
                    {svgUrl && (
                      <a
                        href={svgUrl}
                        download="favicon.svg"
                        className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-white/10 bg-white/5 text-[10px] font-black uppercase text-slate-300 hover:bg-white/10 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        .svg
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ============================ Snippet ============================= */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <FileCode2 className="w-4 h-4 text-blue-400 shrink-0" />
              <h2 className="text-sm font-black uppercase tracking-widest text-white">
                {t.snippetTitle || 'Paste this in your <head>'}
              </h2>
              <button
                onClick={copySnippet}
                className="ml-auto flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-blue-500/10 hover:border-blue-500/30 text-[10px] font-black uppercase text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                {copied ? <ClipboardCheck className="w-3.5 h-3.5 text-blue-400" /> : <Clipboard className="w-3.5 h-3.5" />}
                {copied ? t.copiedLabel || 'Copied' : t.copyBtn || 'Copy'}
              </button>
            </div>
            <p className="text-slate-500 text-xs font-medium">
              {t.snippetHint || 'It updates with the files you ticked. Drop the pack in your site root and paste this.'}
            </p>
            <pre
              ref={snippetRef}
              className="rounded-2xl border border-white/5 bg-black/50 p-4 overflow-x-auto text-[11px] leading-relaxed text-slate-300 font-mono"
            >
              {livePreviewSnippet}
            </pre>

            <NextStepBar lang={lang} t={t} getResult={getHandoffResult} />
          </section>

          <AdBanner id="adsense-favicon-bolt-mid" />

          {/* ========================== How it works ========================== */}
          <section className="space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                {t.howTitle || 'How it works'}
              </h2>
              <div className="h-1 w-16 bg-blue-500 mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {steps.map((step: any, i: number) => {
                const Art = stepArt[i] || StepSource;
                return (
                  <div
                    key={i}
                    className="relative glass-card rounded-3xl p-6 space-y-4 border border-white/5 hover:border-blue-500/20 transition-all group overflow-hidden"
                  >
                    <span className="absolute top-5 right-6 text-5xl font-black text-white/5 group-hover:text-blue-500/10 transition-colors">
                      {i + 1}
                    </span>
                    <Art className="w-24 h-auto text-blue-400 relative" />
                    <h3 className="text-base font-bold text-white leading-snug relative">{step.title}</h3>
                    <p className="text-slate-500 text-[13px] leading-relaxed font-medium relative">{step.text}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ============================ Features ============================ */}
          <motion.section
            initial={prefersReduced ? false : 'hidden'}
            whileInView={prefersReduced ? undefined : 'visible'}
            viewport={{ once: true, amount: 0.15 }}
            variants={fadeInUp}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {features.map((feature: any, idx: number) => {
              const Icon = featureIcons[idx] || IconMultiRes;
              return (
                <div
                  key={idx}
                  className="p-7 glass-card rounded-3xl text-left hover:-translate-y-1.5 transition-all duration-300 group border border-white/5"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5 group-hover:scale-110 group-hover:border-blue-500/40 transition-all">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-white text-lg font-bold mb-2.5 group-hover:text-blue-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">{feature.text}</p>
                </div>
              );
            })}
          </motion.section>

          {/* ============================== SEO ============================== */}
          <section className="space-y-20 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="space-y-6">
                <div className="inline-block px-4 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-[11px] font-black uppercase tracking-[0.2em] border border-blue-500/20">
                  {(t.seoKeywords || [])[0] || 'favicon generator'}
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white leading-tight tracking-tight">
                  {t.seoBrowserSpeedTitle}
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed font-medium">{t.seoBrowserSpeedText}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(t.seoHeroList || []).map((point: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all"
                    >
                      <span className="w-7 h-7 shrink-0 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                      <span className="text-slate-300 font-bold text-sm">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative glass-card rounded-[2.5rem] p-10 py-14 min-h-[340px] flex flex-col items-center justify-center gap-6 text-center overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl" />
                <IconLocalOnly className="w-20 h-20 text-blue-400 relative" />
                <div className="space-y-3 max-w-sm relative">
                  <h3 className="text-2xl font-black text-white tracking-tight leading-tight">
                    {t.seoPrivacyTitle}
                  </h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">{t.seoPrivacyText}</p>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-12 rounded-3xl bg-[#080d1c] border border-white/5 space-y-8">
              <div className="max-w-4xl space-y-4">
                <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
                  {t.seoSecondaryTitle}
                </h2>
                <div className="h-1.5 w-20 bg-blue-500 rounded-full" />
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
                    {t.seoCompatTitle}
                  </div>
                  <p className="text-slate-400 text-base leading-relaxed font-medium">{t.seoCompatText}</p>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="max-w-4xl mx-auto w-full space-y-8">
              <div className="text-center space-y-3">
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{t.faqTitle}</h2>
                <div className="h-1 w-16 bg-blue-500 mx-auto rounded-full" />
              </div>
              <div className="grid gap-3">
                {(t.faq || []).map((faq: any, idx: number) => (
                  <details
                    key={idx}
                    className="glass-card rounded-2xl px-5 md:px-6 py-5 text-left border border-white/5 hover:border-blue-500/20 transition-colors group [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex items-start gap-3 cursor-pointer list-none text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                      <span className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 text-[11px] font-black">
                        Q
                      </span>
                      <span className="flex-1 min-w-0">{faq.question}</span>
                      <span className="shrink-0 text-blue-400 transition-transform group-open:rotate-45 text-xl leading-none">
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
                    className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>

        <AdBanner id="adsense-favicon-bolt-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={type => {
        setModalType(type);
        setModalOpen(true);
      }} />

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={t.scrollTopLabel || 'Back to top'}
          className="fixed bottom-8 right-6 md:bottom-10 md:right-10 z-[200] w-12 h-12 bg-white text-black rounded-2xl shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 cursor-pointer"
        >
          <ArrowUp className="w-5 h-5 stroke-[3]" />
        </button>
      )}

      <LegalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          modalType === 'privacy'
            ? legalTranslations[lang]?.privacy.title || 'Privacy Policy'
            : modalType === 'terms'
              ? legalTranslations[lang]?.terms.title || 'Terms of Service'
              : legalTranslations[lang]?.cookies.title || 'Cookie Policy'
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

export default FaviconBolt;
