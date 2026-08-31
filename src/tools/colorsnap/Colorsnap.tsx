import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Crosshair,
  Download,
  Hand,
  Image as ImageIcon,
  Layers,
  Palette,
  Redo2,
  RotateCcw,
  Sparkles,
  Undo2,
  Upload,
  Wand2,
} from 'lucide-react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';
import { useHandoffIntake } from '../../lib/useHandoff';
import { NextStepBar } from './components/NextStepBar';
import { ImageStage, type StageMode } from './components/ImageStage';
import { PalettePanel, FORMATS, formatColor, type ColorFormat } from './components/PalettePanel';
import { Inspector } from './components/Inspector';
import {
  ColorHeroArt,
  IconContrast,
  IconExport,
  IconLoupe,
  IconLocal,
  IconLock,
  IconPerceptual,
  StepDrop,
  StepExtract,
  StepRefine,
  StepTune,
} from './components/Illustrations';
import { ACCEPT, formatBytes } from './lib/decode';
import { MAX_PALETTE, useColorLab } from './lib/useColorLab';
import type { Quality } from './lib/quantize';
import { rgbToOklab, deltaEOk, type RGB } from './lib/color';
import {
  buildExport,
  download,
  downloadBlob,
  paletteBaseName,
  paletteSheet,
  EXPORT_EXTENSION,
  EXPORT_MIME,
  type ExportFormat,
} from './lib/exporters';

interface ColorsnapProps {
  lang: string;
  dictionary: any;
}

const QUALITIES: Quality[] = ['fast', 'balanced', 'precise'];
const EXPORT_FORMATS: ExportFormat[] = ['css', 'scss', 'tailwind', 'json', 'gpl', 'svg', 'text'];

export default function Colorsnap({ lang, dictionary }: ColorsnapProps) {
  const t = dictionary || {};
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  const lab = useColorLab();
  const {
    stage,
    source,
    bitmapRef,
    settings,
    palette,
    report,
    error,
    busy,
    canUndo,
    canRedo,
  } = lab;

  const [mode, setMode] = useState<StageMode>('pan');
  const [format, setFormat] = useState<ColorFormat>('hex');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('css');
  const [selected, setSelected] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyAllTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(query.matches);
    const onChange = () => setPrefersReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  // Both copy confirmations are timer-driven; the old version cleaned up one of
  // the two and left the other firing setState after unmount.
  useEffect(
    () => () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      if (copyAllTimerRef.current) clearTimeout(copyAllTimerRef.current);
    },
    []
  );

  // -------------------------------------------------------------------------
  // Intake
  // -------------------------------------------------------------------------

  const openFile = useCallback(
    (file: File) => {
      setMode('pan');
      setSelected(0);
      lab.load(file);
    },
    [lab]
  );

  // Receives a file handed over by another tool. One line, by design.
  useHandoffIntake(openFile);

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) openFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) openFile(file);
    e.target.value = '';
  };

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = e.clipboardData?.files?.[0];
      if (file) openFile(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [openFile]);

  // -------------------------------------------------------------------------
  // Copying
  // -------------------------------------------------------------------------

  const copySwatch = useCallback(
    (index: number) => {
      const swatch = palette[index];
      if (!swatch) return;
      navigator.clipboard.writeText(formatColor(swatch, format));
      setCopiedIndex(index);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedIndex(null), 1600);
    },
    [palette, format]
  );

  const exportText = useMemo(
    () => (palette.length ? buildExport(exportFormat, palette, source?.name || 'image') : ''),
    [exportFormat, palette, source]
  );

  const copyExport = useCallback(() => {
    if (!exportText) return;
    navigator.clipboard.writeText(exportText);
    setCopiedAll(true);
    if (copyAllTimerRef.current) clearTimeout(copyAllTimerRef.current);
    copyAllTimerRef.current = setTimeout(() => setCopiedAll(false), 2000);
  }, [exportText]);

  const downloadExport = useCallback(() => {
    if (!exportText || !source) return;
    const base = paletteBaseName(source.name);
    download(exportText, `${base}.${EXPORT_EXTENSION[exportFormat]}`, EXPORT_MIME[exportFormat]);
  }, [exportText, exportFormat, source]);

  const downloadSheet = useCallback(async () => {
    if (!palette.length) return;
    const blob = await paletteSheet(palette, source?.name || 'image');
    if (blob) downloadBlob(blob, `${paletteBaseName(source?.name || 'palette')}.png`);
  }, [palette, source]);

  const getHandoffResult = useCallback(async () => {
    if (!palette.length) return null;
    const blob = await paletteSheet(palette, source?.name || 'image');
    if (!blob) return null;
    return { blob, name: `${paletteBaseName(source?.name || 'palette')}.png` };
  }, [palette, source]);

  // -------------------------------------------------------------------------
  // Picking
  // -------------------------------------------------------------------------

  const onPick = useCallback(
    (color: RGB) => {
      lab.addColor(color);
      setSelected(Math.min(palette.length, MAX_PALETTE - 1));
    },
    [lab, palette.length]
  );

  /** Alt-click / right click: remove whichever swatch is closest to what the
   *  cursor is over. The inverse of picking, on the same gesture. */
  const onUnpick = useCallback(
    (color: RGB) => {
      if (palette.length === 0) return;
      const target = rgbToOklab(color.r, color.g, color.b);
      let best = 0;
      let bestD = Infinity;
      palette.forEach((s, i) => {
        const d = deltaEOk(target, rgbToOklab(s.r, s.g, s.b));
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      lab.removeColor(best);
      setSelected(s => Math.max(0, Math.min(s, palette.length - 2)));
    },
    [lab, palette]
  );

  // -------------------------------------------------------------------------
  // Keyboard
  // -------------------------------------------------------------------------

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (stage !== 'done') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) lab.redo();
        else lab.undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        lab.redo();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key.toLowerCase();
      if (key === 'e') setMode('pick');
      else if (key === 'v' || key === 'h') setMode('pan');
      else if (key === 'c') copyExport();
      else if (key >= '1' && key <= '9') {
        const index = Number(key) - 1;
        if (palette[index]) {
          setSelected(index);
          copySwatch(index);
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stage, lab, palette, copySwatch, copyExport]);

  // -------------------------------------------------------------------------
  // Copy
  // -------------------------------------------------------------------------

  const errorText = error
    ? t[`error_${error}`] ||
      {
        size: 'That file is larger than 80 MB.',
        format: 'That is not an image file.',
        heic: 'This HEIC could not be converted in the browser.',
        tiff: 'This TIFF could not be decoded.',
        decode: 'The browser could not decode this image.',
      }[error]
    : null;

  const steps = [
    { art: StepDrop, title: t.step1Title || 'Bring an image in', text: t.step1Text || 'Drop it, pick it, paste it, or send it over from another oLoveTools tool. Nothing runs yet.' },
    { art: StepTune, title: t.step2Title || 'Set it up first', text: t.step2Text || 'Choose how many colours you want, how deeply to sample, and what to ignore.' },
    { art: StepExtract, title: t.step3Title || 'Extract when you say so', text: t.step3Text || 'Median cut narrows the field, then k-means refines it in a perceptual space.' },
    { art: StepRefine, title: t.step4Title || 'Fix it by hand', text: t.step4Text || 'Pin what works, drop what does not, and pick anything the maths missed with the eyedropper.' },
  ];

  const featureIcons = [IconPerceptual, IconLoupe, IconLock, IconContrast, IconLocal, IconExport];
  const features = Array.isArray(t.features) && t.features.length ? t.features : [
    { title: 'Sees colour the way you do', text: 'Clustering happens in OKLab, so two blues that look identical never both make the cut.' },
    { title: 'Eyedropper with a loupe', text: 'Zoom to the pixel, hover for the value, click to keep it. Alt-click drops the nearest swatch.' },
    { title: 'Pin what already works', text: 'Lock a swatch and the rest of the palette rebuilds around it instead of starting over.' },
    { title: 'Readability, checked', text: 'Real WCAG contrast ratios and protan/deutan/tritan simulation for the whole palette.' },
    { title: '100% in your browser', text: 'No upload, no CDN model, no network call. The image never leaves the tab.' },
    { title: 'Exports people actually use', text: 'CSS variables, SCSS, a Tailwind v4 theme block, JSON, GIMP .gpl, SVG and a PNG sheet.' },
  ];

  const faqs = Array.isArray(t.faq) ? t.faq : [];
  const keywords = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];
  const heroPoints: string[] = Array.isArray(t.seoHeroList) ? t.seoHeroList : [];

  const fidelityLabel = report
    ? report.fidelity < 3
      ? t.fidelityHigh || 'Faithful'
      : report.fidelity < 6
      ? t.fidelityMid || 'Close'
      : t.fidelityLow || 'Loose'
    : '';

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0204] text-slate-200 font-sans relative overflow-x-hidden">
      <Header
        currentLang={lang}
        onLanguageChange={l => (window.location.href = `/${l.toLowerCase()}/colorsnap`)}
        onReset={lab.reset}
        t={t}
      />

      {/* The max width lives on <main>: AdRail measures this element to decide
          whether the fixed side rails fit, and a full-width main leaves it a
          gap of zero at every viewport size. */}
      <main className="flex-1 flex flex-col items-center pt-36 md:pt-32 pb-24 px-4 md:px-12 relative z-10 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))]">
        <AdBanner id="adsense-colorsnap-top" />

        <div className="w-full space-y-20 md:space-y-28">
          {/* ================================================================ */}
          {/* Hero                                                             */}
          {/* ================================================================ */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center pt-2">
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex max-w-full items-center gap-2 px-4 py-2 rounded-full bg-rose-950/40 border border-rose-800/30 text-rose-400 text-[11px] font-black tracking-[0.2em] uppercase shadow-[0_0_25px_rgba(244,63,94,0.15)]">
                <Palette className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.badge || t.title}</span>
              </div>

              <h1 className="text-4xl md:text-6xl xl:text-7xl font-black tracking-tight leading-[0.95] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-400">
                {t.title}
              </h1>

              <p className="text-slate-400 text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
                {t.description || t.seoHeroText}
              </p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                {heroPoints.slice(0, 3).map((point, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-300"
                  >
                    <Check className="w-3.5 h-3.5 text-rose-400 stroke-[3]" />
                    {point}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-rose-500/10 blur-[80px] rounded-full" />
              <ColorHeroArt
                className="relative w-full max-w-lg mx-auto drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
                animated={!prefersReduced}
              />
            </div>
          </section>

          {/* ================================================================ */}
          {/* Workspace                                                        */}
          {/* ================================================================ */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-4">
              {!source ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={e => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={e => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`group relative border-2 border-dashed rounded-3xl p-10 md:p-16 flex flex-col items-center justify-center gap-5 cursor-pointer transition-all shadow-xl shadow-black/30 ${
                    isDragging
                      ? 'border-rose-400 bg-rose-500/10'
                      : 'border-rose-950 hover:border-rose-500/40 bg-[#120509]/40 hover:bg-[#16060c]/50'
                  }`}
                >
                  <div className="w-20 h-20 bg-[#160509] border border-white/5 rounded-2xl flex items-center justify-center text-rose-400 transition-transform group-hover:scale-105 group-hover:-translate-y-1 shadow-lg shadow-black/40">
                    {busy ? (
                      <div className="w-8 h-8 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-9 h-9" />
                    )}
                  </div>
                  <div className="space-y-2 text-center">
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {t.dropzonePrompt || 'Drop an image here or click to upload'}
                    </h2>
                    <p className="text-slate-500 text-sm font-medium max-w-md">
                      {t.dropzoneSubtitle ||
                        'PNG, JPG, WebP, AVIF, GIF, BMP, HEIC, TIFF and SVG — up to 80 MB, read in your browser'}
                    </p>
                  </div>
                  {errorText && (
                    <p className="text-sm font-bold text-rose-400 text-center max-w-md">{errorText}</p>
                  )}
                </div>
              ) : (
                <div className="rounded-3xl bg-[#120509]/60 border border-white/5 p-3 md:p-5 space-y-3 shadow-2xl">
                  {/* Toolbar. flex-wrap on purpose: at 375px these controls do
                      not fit on one line and must fall to the next. */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1 basis-full sm:basis-auto">
                      <ImageIcon className="w-4 h-4 text-rose-400 shrink-0" />
                      <span className="text-sm font-bold text-white truncate">{source.name}</span>
                      <span className="text-[11px] text-slate-600 font-medium shrink-0 hidden sm:inline">
                        {source.width}×{source.height} · {formatBytes(source.bytes)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/5">
                      <button
                        onClick={() => setMode('pan')}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          mode === 'pan' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Hand className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{t.modePan || 'Pan'}</span>
                      </button>
                      <button
                        onClick={() => setMode('pick')}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          mode === 'pick' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Crosshair className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{t.modePick || 'Eyedropper'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={lab.undo}
                        disabled={!canUndo}
                        aria-label={t.undo || 'Undo'}
                        className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-default transition-all cursor-pointer"
                      >
                        <Undo2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={lab.redo}
                        disabled={!canRedo}
                        aria-label={t.redo || 'Redo'}
                        className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-default transition-all cursor-pointer"
                      >
                        <Redo2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        aria-label={t.changeImage || 'Change image'}
                        className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                      <button
                        onClick={lab.reset}
                        aria-label={t.resetBtn || 'Reset'}
                        className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <ImageStage
                    bitmap={bitmapRef.current}
                    palette={palette}
                    mode={mode}
                    onPick={onPick}
                    onUnpick={onUnpick}
                    t={t}
                  />

                  {errorText && <p className="text-sm font-bold text-rose-400">{errorText}</p>}
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInput}
                accept={ACCEPT}
                className="hidden"
              />

              {palette.length > 0 && (
                <NextStepBar lang={lang} t={t} getResult={getHandoffResult} />
              )}
            </div>

            {/* ------------------------------------------------------------ */}
            {/* Right column                                                  */}
            {/* ------------------------------------------------------------ */}
            <div className="lg:col-span-5 space-y-5">
              {/* Settings — always visible once there is an image, because
                  nothing has run yet and these are the knobs that decide what
                  will. */}
              {source && (
                <div className="rounded-3xl bg-[#120509]/60 border border-white/5 p-5 md:p-6 space-y-5 shadow-2xl">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-rose-400" />
                    {t.settingsTitle || 'Extraction settings'}
                  </h3>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                        {t.sizeLabel || 'Colours'}
                      </label>
                      <span className="text-sm font-black text-rose-300 tabular-nums">{settings.size}</span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={MAX_PALETTE}
                      value={settings.size}
                      onChange={e => {
                        const size = Number(e.target.value);
                        if (stage === 'done') lab.resolve({ size });
                        else lab.setSettings(s => ({ ...s, size }));
                      }}
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                      {t.qualityLabel || 'Sampling depth'}
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {QUALITIES.map(q => (
                        <button
                          key={q}
                          onClick={() => {
                            // Sampling depth is the one setting that forces a
                            // new pixel pass; everything else re-solves from
                            // the bins that are already in memory.
                            if (stage === 'done') lab.extract({ quality: q });
                            else lab.setSettings(s => ({ ...s, quality: q }));
                          }}
                          className={`py-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                            settings.quality === q
                              ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                              : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          {t[`quality_${q}`] || q}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                        {t.minChromaLabel || 'Minimum saturation'}
                      </label>
                      <span className="text-[11px] font-bold text-slate-400 tabular-nums">
                        {Math.round(settings.filters.minChroma * 500)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(settings.filters.minChroma * 500)}
                      onChange={e => {
                        const filters = { ...settings.filters, minChroma: Number(e.target.value) / 500 };
                        if (stage === 'done') lab.resolve({ filters });
                        else lab.setSettings(s => ({ ...s, filters }));
                      }}
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                    <p className="text-[11px] text-slate-600 font-medium leading-snug">
                      {t.minChromaHint || 'Raise it to skip the greys and keep only the colours that carry the image.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.filters.maxLightness < 1}
                        onChange={e => {
                          const filters = { ...settings.filters, maxLightness: e.target.checked ? 0.93 : 1 };
                          if (stage === 'done') lab.resolve({ filters });
                          else lab.setSettings(s => ({ ...s, filters }));
                        }}
                        className="accent-rose-500 cursor-pointer"
                      />
                      <span className="text-[11px] font-bold text-slate-300">
                        {t.skipWhites || 'Skip near-white'}
                      </span>
                    </label>
                    <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.filters.minLightness > 0}
                        onChange={e => {
                          const filters = { ...settings.filters, minLightness: e.target.checked ? 0.12 : 0 };
                          if (stage === 'done') lab.resolve({ filters });
                          else lab.setSettings(s => ({ ...s, filters }));
                        }}
                        className="accent-rose-500 cursor-pointer"
                      />
                      <span className="text-[11px] font-bold text-slate-300">
                        {t.skipBlacks || 'Skip near-black'}
                      </span>
                    </label>
                  </div>

                  {stage !== 'done' && (
                    <div className="space-y-2 pt-1">
                      <button
                        onClick={() => lab.extract()}
                        disabled={stage === 'working'}
                        className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-600/20 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
                      >
                        {stage === 'working' ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {t.extracting || 'Extracting…'}
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            {t.extractBtn || 'Extract the palette'}
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          lab.startManual();
                          setMode('pick');
                        }}
                        className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Wand2 className="w-4 h-4" />
                        {t.manualBtn || 'Skip it — I will pick by hand'}
                      </button>
                    </div>
                  )}

                  {stage === 'done' && (
                    <button
                      onClick={() => lab.resolve({}, false)}
                      className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {t.reextractBtn || 'Re-extract, ignoring my edits'}
                    </button>
                  )}
                </div>
              )}

              {/* Palette */}
              <div className="rounded-3xl bg-[#120509]/60 border border-white/5 p-5 md:p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Palette className="w-4 h-4 text-rose-400" />
                    {t.paletteTitle || 'Palette'}
                  </h3>
                  {palette.length > 0 && (
                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/40 border border-white/5">
                      {FORMATS.map(f => (
                        <button
                          key={f}
                          onClick={() => setFormat(f)}
                          className={`px-2 py-1 rounded-md text-[10px] font-black uppercase transition-all cursor-pointer ${
                            format === f ? 'bg-rose-500/20 text-rose-300' : 'text-slate-500 hover:text-white'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {palette.length === 0 ? (
                  <div className="py-8 text-center space-y-3">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-rose-400/40">
                      <Crosshair className="w-7 h-7" />
                    </div>
                    <p className="text-slate-500 text-sm font-medium max-w-xs mx-auto">
                      {stage === 'done'
                        ? t.paletteManualEmpty || 'Eyedropper is on. Click anywhere on the image to start the palette.'
                        : source
                        ? t.paletteReady || 'Your image is loaded. Set it up and press the button when you are ready.'
                        : t.paletteEmpty || 'Load an image to build a palette from it.'}
                    </p>
                  </div>
                ) : (
                  <>
                    <PalettePanel
                      palette={palette}
                      format={format}
                      selected={selected}
                      copiedIndex={copiedIndex}
                      t={t}
                      onSelect={setSelected}
                      onCopy={copySwatch}
                      onToggleLock={lab.toggleLock}
                      onRemove={i => {
                        lab.removeColor(i);
                        setSelected(s => Math.max(0, Math.min(s, palette.length - 2)));
                      }}
                      onMove={lab.moveColor}
                      onEdit={lab.replaceColor}
                    />

                    {report && (
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <div className="px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                          <div className="text-sm font-black text-white tabular-nums">
                            {report.fidelity.toFixed(1)}
                          </div>
                          <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wide truncate">
                            {t.fidelityLabel || 'Deviation'} · {fidelityLabel}
                          </div>
                        </div>
                        <div className="px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                          <div className="text-sm font-black text-white tabular-nums">
                            {report.sampled.toLocaleString(lang)}
                          </div>
                          <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wide truncate">
                            {t.sampledLabel || 'Pixels read'}
                          </div>
                        </div>
                        <div className="px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                          <div className="text-sm font-black text-white tabular-nums">{report.ms} ms</div>
                          <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wide truncate">
                            {t.timeLabel || 'Time'}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="border-t border-white/5 pt-4 space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {EXPORT_FORMATS.map(f => (
                          <button
                            key={f}
                            onClick={() => setExportFormat(f)}
                            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer border ${
                              exportFormat === f
                                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                                : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={copyExport}
                          className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-600/20 active:scale-95 cursor-pointer"
                        >
                          {copiedAll ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copiedAll ? t.paletteCopied || 'Copied' : t.copyPalette || 'Copy'}
                        </button>
                        <button
                          onClick={downloadExport}
                          aria-label={t.downloadPalette || 'Download'}
                          className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white rounded-2xl transition-all cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={downloadSheet}
                          aria-label={t.downloadSheet || 'Download palette image'}
                          className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white rounded-2xl transition-all cursor-pointer"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {palette.length > 0 && (
                <div className="rounded-3xl bg-[#120509]/60 border border-white/5 p-5 md:p-6 shadow-2xl">
                  <Inspector
                    palette={palette}
                    selected={selected}
                    t={t}
                    onAdd={lab.addColor}
                    canAdd={palette.length < MAX_PALETTE}
                  />
                </div>
              )}
            </div>
          </section>

          <AdBanner id="adsense-colorsnap-mid" />

          {/* ================================================================ */}
          {/* How it works                                                     */}
          {/* ================================================================ */}
          <section className="space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                {t.howItWorksTitle || 'How it works'}
              </h2>
              <div className="h-1 w-16 bg-rose-500 mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {steps.map((step, i) => {
                const Art = step.art;
                return (
                  <div
                    key={i}
                    className="relative glass-card rounded-3xl p-6 space-y-4 border border-white/5 hover:border-rose-500/20 transition-all group"
                  >
                    <span className="absolute top-5 right-6 text-5xl font-black text-white/5 group-hover:text-rose-500/10 transition-colors">
                      {i + 1}
                    </span>
                    <Art className="w-24 h-auto text-rose-400" />
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
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature: any, idx: number) => {
              const Icon = featureIcons[idx] || IconPerceptual;
              return (
                <div
                  key={idx}
                  className="p-7 glass-card rounded-3xl text-left hover:-translate-y-1.5 transition-all duration-300 group border border-white/5"
                >
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-5 group-hover:scale-110 group-hover:border-rose-500/40 transition-all">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-white text-lg font-bold mb-2.5 group-hover:text-rose-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">{feature.text}</p>
                </div>
              );
            })}
          </section>

          {/* ================================================================ */}
          {/* SEO content + FAQ                                                */}
          {/* ================================================================ */}
          <section className="space-y-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="space-y-6">
                {keywords[0] && (
                  <div className="inline-block px-4 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 text-[11px] font-black uppercase tracking-[0.2em] border border-rose-500/20">
                    {keywords[0]}
                  </div>
                )}
                <h2 className="text-3xl md:text-5xl font-black text-white leading-[1.05] tracking-tighter">
                  {t.seoHeroTitle}
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed font-medium">{t.seoHeroText}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {heroPoints.map((point, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all"
                    >
                      <span className="w-7 h-7 shrink-0 bg-rose-500/20 text-rose-400 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                      <span className="text-slate-300 font-bold text-sm">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="glass-card rounded-3xl p-7 border border-white/5 space-y-3">
                  <h3 className="text-white font-bold text-lg">{t.seoBrowserSpeedTitle}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{t.seoBrowserSpeedText}</p>
                </div>
                <div className="glass-card rounded-3xl p-7 border border-white/5 space-y-3">
                  <h3 className="text-white font-bold text-lg">{t.seoUseCaseTitle}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{t.seoUseCaseText}</p>
                </div>
                <div className="glass-card rounded-3xl p-7 border border-white/5 space-y-3">
                  <h3 className="text-white font-bold text-lg">{t.seoPrivacyTitle}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{t.seoPrivacyText}</p>
                </div>
              </div>
            </div>

            {faqs.length > 0 && (
              <div className="max-w-4xl mx-auto w-full space-y-8">
                <div className="text-center space-y-3">
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{t.faqTitle}</h2>
                  <div className="h-1 w-16 bg-rose-500 mx-auto rounded-full" />
                </div>
                <div className="grid gap-3">
                  {faqs.map((faq: any, idx: number) => (
                    <details
                      key={idx}
                      className="glass-card rounded-2xl px-6 py-5 text-left border border-white/5 hover:border-rose-500/20 transition-colors group [&_summary::-webkit-details-marker]:hidden"
                    >
                      <summary className="flex items-start gap-3 cursor-pointer list-none text-base font-bold text-white group-hover:text-rose-400 transition-colors">
                        <span className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 text-[11px] font-black">
                          Q
                        </span>
                        <span className="flex-1">{faq.question}</span>
                        <span className="shrink-0 text-rose-400 transition-transform group-open:rotate-45 text-xl leading-none">
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
                  {t.seoKeywordsTitle || 'Related searches'}
                </h2>
                <div className="flex flex-wrap justify-center gap-2">
                  {keywords.map((keyword: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 transition-all cursor-default"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <AdBanner id="adsense-colorsnap-bottom" />
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
