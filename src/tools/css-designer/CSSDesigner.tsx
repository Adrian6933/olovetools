import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Download,
  Droplets,
  ImagePlus,
  Keyboard,
  Layers,
  Palette,
  Redo2,
  RotateCcw,
  Sliders,
  Sparkles,
  Undo2,
  X,
} from 'lucide-react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { Panel } from './components/Panels';
import { Preview } from './components/Preview';
import { CodePanel } from './components/CodePanel';
import { NextStepBar } from './components/NextStepBar';
import {
  CssHeroArt,
  IconColorSpace,
  IconCorner,
  IconHandoff,
  IconHistory,
  IconKeys,
  IconLayers,
  IconLocal,
  IconParse,
  STEP_ART,
} from './components/Illustrations';
import { createTranslator } from '../../locales/meta';
import { AdBanner } from '../../components/shared/AdBanner';
import { useHandoffIntake } from '../../lib/useHandoff';
import type { CodeFormat, ColorSpace, Design, PreviewBackdrop, TabId } from './types';
import { TAB_ORDER } from './lib/defaults';
import { formatCode } from './lib/serialize';
import { encodeDesign, useDesignStore } from './lib/useDesign';
import { parseCss } from './lib/parse';
import { canvasToBlob, extractPalette, loadImage, renderDesign } from './lib/render';
import { copyText } from './lib/clipboard';

interface CSSDesignerProps {
  lang: string;
  dictionary?: any;
}

const TAB_META: { id: TabId; key: string; fallback: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'glass', key: 'tab_glassmorphism', fallback: 'Glassmorphism', icon: Sparkles as never },
  { id: 'shadow', key: 'tab_box_shadow', fallback: 'Box Shadow', icon: Layers as never },
  { id: 'gradient', key: 'tab_gradients', fallback: 'Gradients', icon: Palette as never },
  { id: 'radius', key: 'tab_border_radius', fallback: 'Border Radius', icon: Sliders as never },
  { id: 'filter', key: 'tab_filters', fallback: 'Filters', icon: Droplets as never },
];

const EXPORT_SIZES: { id: string; label: string; width: number; height: number }[] = [
  { id: 'wide', label: '1600 × 900', width: 1600, height: 900 },
  { id: 'square', label: '1200 × 1200', width: 1200, height: 1200 },
  { id: 'story', label: '1080 × 1920', width: 1080, height: 1920 },
];

const CSSDesigner: React.FC<CSSDesignerProps> = ({ lang, dictionary }) => {
  const t = createTranslator(dictionary);

  const store = useDesignStore();
  const { design, tab } = store;

  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [backdrop, setBackdrop] = useState<PreviewBackdrop>('mesh');
  const [format, setFormat] = useState<CodeFormat>('css');
  const [space, setSpace] = useState<ColorSpace>('hex');
  const [comparing, setComparing] = useState(false);
  const [shared, setShared] = useState(false);
  const [activeStop, setActiveStop] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Photo backdrop: parked, never processed on arrival.
  const [photo, setPhoto] = useState<{ url: string; image: HTMLImageElement; name: string } | null>(null);
  const [palette, setPalette] = useState<string[] | null>(null);
  const [paletteBusy, setPaletteBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const [exportSize, setExportSize] = useState(EXPORT_SIZES[0].id);
  const [fullBleed, setFullBleed] = useState(false);
  const [exporting, setExporting] = useState(false);

  const prefersReduced =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const code = useMemo(() => formatCode(format, tab, design, space), [format, tab, design, space]);

  // -- file intake ----------------------------------------------------------
  // Loading an image only swaps the preview backdrop. The expensive part —
  // scanning every pixel for a palette — waits for an explicit click.
  const acceptFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    try {
      const image = await loadImage(file);
      setPhoto(current => {
        if (current) URL.revokeObjectURL(current.url);
        return { url: image.src, image, name: file.name };
      });
      setPalette(null);
      setBackdrop('photo');
    } catch {
      // A corrupt or unsupported file: leave the current backdrop alone.
    }
  }, []);

  useHandoffIntake(file => {
    void acceptFile(file);
  });

  // `loadImage` revokes its own URL once the bitmap has decoded, so the only
  // thing left to clean up is the reference we keep for the CSS background.
  useEffect(() => {
    const url = photo?.url;
    return () => {
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
    };
  }, [photo?.url]);

  const runPalette = async () => {
    if (!photo || paletteBusy) return;
    setPaletteBusy(true);
    // Yield once so the button's busy state paints before the scan blocks.
    await new Promise(resolve => window.setTimeout(resolve, 0));
    setPalette(extractPalette(photo.image, 6));
    setPaletteBusy(false);
  };

  const applyPaletteColor = (hex: string) => {
    store.update(current => {
      switch (tab) {
        case 'glass':
          return { ...current, glass: { ...current.glass, bgColor: hex } };
        case 'shadow':
          return {
            ...current,
            shadow: {
              ...current.shadow,
              layers: current.shadow.layers.map(l => ({ ...l, color: hex })),
            },
          };
        case 'gradient': {
          const target = activeStop || current.gradient.stops[0]?.id;
          return {
            ...current,
            gradient: {
              ...current.gradient,
              stops: current.gradient.stops.map(s => (s.id === target ? { ...s, color: hex } : s)),
            },
          };
        }
        case 'radius':
          return { ...current, radius: { ...current.radius, fill: hex } };
        case 'filter':
          return { ...current, filter: { ...current.filter, dropShadowColor: hex } };
      }
    });
    store.commit();
  };

  // -- export ---------------------------------------------------------------
  const renderCurrent = useCallback((): HTMLCanvasElement => {
    const size = EXPORT_SIZES.find(s => s.id === exportSize) || EXPORT_SIZES[0];
    return renderDesign(tab, design, {
      width: size.width,
      height: size.height,
      backdrop,
      backdropImage: photo?.image || null,
      fullBleed,
    });
  }, [tab, design, backdrop, photo, fullBleed, exportSize]);

  const downloadPng = async () => {
    setExporting(true);
    try {
      const blob = await canvasToBlob(renderCurrent());
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `css-designer-${tab}.png`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const getResult = useCallback(async () => {
    const blob = await canvasToBlob(renderCurrent());
    return blob ? { blob, name: `css-designer-${tab}.png` } : null;
  }, [renderCurrent, tab]);

  // -- share ----------------------------------------------------------------
  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}#d=${encodeDesign(design, tab)}`;
    window.history.replaceState(null, '', url);
    if (await copyText(url)) {
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    }
  };

  // -- import ---------------------------------------------------------------
  const importCss = (text: string): string => {
    const result = parseCss(text);
    if (!result.tab || result.applied.length === 0) {
      return t.import_failed || 'Nothing recognised in that snippet.';
    }
    const next: Design = { ...design };
    for (const key of Object.keys(result.patch) as (keyof Design)[]) {
      next[key] = { ...(design[key] as object), ...(result.patch[key] as object) } as never;
    }
    store.replace(next, result.tab);
    if (result.patch.gradient?.stops?.length) setActiveStop(result.patch.gradient.stops[0].id);
    if (result.patch.shadow?.layers?.length) setActiveLayer(result.patch.shadow.layers[0].id);
    return (t.import_ok || 'Applied: {0}').replace('{0}', result.applied.join(', '));
  };

  // -- keyboard -------------------------------------------------------------
  useEffect(() => {
    const isTyping = (target: EventTarget | null): boolean => {
      const el = target as HTMLElement | null;
      if (!el) return false;
      return (
        el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA' ||
        el.tagName === 'SELECT' ||
        el.isContentEditable
      );
    };

    const down = (event: KeyboardEvent) => {
      if (isTyping(event.target)) return;
      const mod = event.ctrlKey || event.metaKey;

      if (mod && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) store.redo();
        else store.undo();
        return;
      }
      if (mod && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        store.redo();
        return;
      }
      if (mod && event.shiftKey && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        void copyText(code);
        return;
      }
      if (!mod && event.key >= '1' && event.key <= '5') {
        store.setTab(TAB_ORDER[Number(event.key) - 1]);
        return;
      }
      if (!mod && event.key.toLowerCase() === 'b' && !event.repeat) {
        setComparing(true);
      }
      if (event.key === 'Escape') setShowShortcuts(false);
    };

    const up = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'b') setComparing(false);
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [store, code]);

  const handleLanguageChange = (newLang: string) => {
    const segments = window.location.pathname.split('/');
    if (segments.length >= 3) {
      segments[1] = newLang.toLowerCase();
      window.location.pathname = segments.join('/');
    } else {
      window.location.href = `/${newLang.toLowerCase()}/css-designer`;
    }
  };

  const faqs = Array.isArray(t.faq) ? t.faq : [];
  const keywords = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];

  const steps = [
    { title: t.step1Title || 'Pick an effect', text: t.step1Text || 'Glass, layered shadow, gradient, radius or filter — five generators sharing one preview.' },
    { title: t.step2Title || 'Tune it', text: t.step2Text || 'Drag a slider or type the exact number. Every change is one undo step away.' },
    { title: t.step3Title || 'Check it', text: t.step3Text || 'Zoom at the cursor, pan, and hold to compare against the unstyled element.' },
    { title: t.step4Title || 'Ship it', text: t.step4Text || 'Copy CSS, Tailwind, SCSS or variables, share a link, or send the PNG to another tool.' },
  ];

  const featureIcons = [IconLayers, IconColorSpace, IconParse, IconCorner, IconHistory, IconHandoff, IconLocal, IconKeys];
  const features = Array.isArray(t.features) && t.features.length
    ? t.features
    : [
        { title: 'Multi-layer shadows', text: 'Stack as many layers as a real elevation needs, toggle each one, and reorder them without losing the rest.' },
        { title: 'Modern colour spaces', text: 'Interpolate gradients in OKLab or OKLCH and print any value as HEX, RGB, HSL or oklch().' },
        { title: 'Paste CSS back in', text: 'Drop an existing rule in and the controls jump to it, instead of rebuilding it slider by slider.' },
      ];

  const shortcuts: [string, string][] = [
    ['1 – 5', t.sc_tabs || 'Switch generator'],
    ['B', t.sc_compare || 'Hold to compare'],
    ['Ctrl / ⌘ + Z', t.sc_undo || 'Undo'],
    ['Ctrl / ⌘ + ⇧ + Z', t.sc_redo || 'Redo'],
    ['Ctrl / ⌘ + ⇧ + C', t.sc_copy || 'Copy the generated code'],
    ['Alt + ←/→', t.sc_fine || 'Fine slider steps (Shift for coarse)'],
  ];

  return (
    <div className="min-h-screen bg-[#07060b] text-slate-200 flex flex-col justify-between font-sans">
      <Header currentLang={lang} onLanguageChange={handleLanguageChange} t={t} />

      {/* The max width lives on <main> on purpose: AdRail measures this element
          against the viewport edge to decide whether the fixed side rails fit.
          A full-width <main> leaves a 0px gap and the rails never render. */}
      <main className="flex-1 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))] px-4 md:px-8 pt-32 md:pt-36 pb-20">
        <AdBanner id="adsense-css-designer-top" />

        {/* ================================================================ */}
        {/* Hero                                                             */}
        {/* ================================================================ */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-8 lg:gap-12 items-center mb-12">
          <div className="space-y-5 min-w-0">
            <span className="inline-block px-3.5 py-1.5 bg-violet-500/10 text-violet-400 text-[11px] font-black uppercase tracking-[0.2em] rounded-full border border-violet-500/20">
              {t.title} · {t.hero_badge || 'Playground'}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white font-outfit tracking-tight leading-[1.08]">
              {t.seoHeroTitle}
            </h1>
            <p className="text-slate-400 text-base md:text-lg font-medium leading-relaxed">{t.description}</p>
            <div className="flex flex-wrap gap-2">
              {(Array.isArray(t.seoHeroList) ? t.seoHeroList : []).map((point: string, i: number) => (
                <span
                  key={i}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[12px] font-bold text-slate-300"
                >
                  <Check className="w-3.5 h-3.5 text-violet-400 stroke-[3]" />
                  {point}
                </span>
              ))}
            </div>
          </div>
          <CssHeroArt className="w-full h-auto max-w-lg mx-auto" animated={!prefersReduced} />
        </section>

        {/* ================================================================ */}
        {/* Workspace                                                        */}
        {/* ================================================================ */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls */}
          <div className="lg:col-span-5 glass-card rounded-3xl p-5 sm:p-6 border border-white/5 space-y-5">
            <div
              role="tablist"
              aria-label={t.generators || 'Generators'}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-1.5 bg-slate-900/50 p-1.5 rounded-2xl border border-white/5"
            >
              {TAB_META.map((item, i) => {
                const Icon = item.icon;
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    title={`${t[item.key] || item.fallback} (${i + 1})`}
                    onClick={() => store.setTab(item.id)}
                    className={`flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer border min-w-0 ${
                      active
                        ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/25'
                        : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t[item.key] || item.fallback}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-4">
              <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-violet-400" />
                {t.configure || 'Configure'}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={store.undo}
                  disabled={!store.canUndo}
                  aria-label={t.undo || 'Undo'}
                  title={`${t.undo || 'Undo'} (Ctrl+Z)`}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={store.redo}
                  disabled={!store.canRedo}
                  aria-label={t.redo || 'Redo'}
                  title={`${t.redo || 'Redo'} (Ctrl+Shift+Z)`}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowShortcuts(true)}
                  aria-label={t.shortcuts || 'Keyboard shortcuts'}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Keyboard className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={store.reset}
                  className="flex items-center gap-1 px-2.5 h-8 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-[11px] uppercase rounded-lg transition-colors border border-white/10 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  {t.reset || 'Reset'}
                </button>
              </div>
            </div>

            <Panel
              tab={tab}
              design={design}
              update={store.update}
              commit={store.commit}
              t={t}
              activeStop={activeStop}
              setActiveStop={setActiveStop}
              activeLayer={activeLayer}
              setActiveLayer={setActiveLayer}
            />
          </div>

          {/* Preview + output */}
          <div className="lg:col-span-7 flex flex-col gap-6 min-w-0">
            <div className="glass-card rounded-3xl p-5 sm:p-6 border border-white/5 flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-bold text-slate-300">{t.preview_title || 'Interactive Preview'}</span>
                <div className="flex flex-wrap items-center gap-1 bg-slate-900/50 p-1 rounded-xl border border-white/5">
                  {[
                    { id: 'darkGrid' as const, label: t.theme_dark_grid || 'Dark Grid' },
                    { id: 'lightGrid' as const, label: t.theme_light_grid || 'Light Grid' },
                    { id: 'mesh' as const, label: t.theme_mesh || 'Color Mesh' },
                    { id: 'vibrant' as const, label: t.theme_vibrant || 'Vibrant' },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setBackdrop(item.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border-none ${
                        backdrop === item.id ? 'bg-slate-700 text-white' : 'bg-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => (photo ? setBackdrop('photo') : fileInput.current?.click())}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border-none ${
                      backdrop === 'photo' ? 'bg-slate-700 text-white' : 'bg-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ImagePlus className="w-3 h-3" />
                    {t.theme_photo || 'Your image'}
                  </button>
                </div>
              </div>

              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) void acceptFile(file);
                  e.target.value = '';
                }}
              />

              <Preview
                tab={tab}
                design={design}
                backdrop={backdrop}
                photoUrl={photo?.url || null}
                t={t}
                comparing={comparing}
                setComparing={setComparing}
              />

              {photo && (
                <div className="rounded-2xl border border-white/5 bg-black/30 p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[11px] font-bold text-slate-400 truncate max-w-[14rem]">{photo.name}</span>
                    <span className="h-px flex-1 bg-white/5 min-w-[1rem]" />
                    <button
                      type="button"
                      onClick={runPalette}
                      disabled={paletteBusy}
                      className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer border-none"
                    >
                      {paletteBusy ? t.working || 'Working…' : t.extract_palette || 'Extract palette'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPhoto(null);
                        setPalette(null);
                        setBackdrop('mesh');
                      }}
                      aria-label={t.remove_image || 'Remove image'}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {palette && palette.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {palette.map(hex => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => applyPaletteColor(hex)}
                          title={hex}
                          className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:border-violet-500/40 text-[11px] font-mono text-slate-300 cursor-pointer transition-colors"
                        >
                          <span className="w-4 h-4 rounded border border-white/20" style={{ backgroundColor: hex }} />
                          {hex.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  )}
                  {palette && palette.length === 0 && (
                    <p className="text-[11px] text-slate-500">{t.palette_failed || 'Could not read this image.'}</p>
                  )}
                </div>
              )}

              {/* Export */}
              <div className="rounded-2xl border border-white/5 bg-black/30 p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    {t.export_title || 'Export'}
                  </span>
                  <span className="h-px flex-1 bg-white/5 min-w-[1rem]" />
                  <div className="flex flex-wrap gap-1 bg-slate-900/50 p-1 rounded-xl border border-white/5">
                    {EXPORT_SIZES.map(size => (
                      <button
                        key={size.id}
                        type="button"
                        onClick={() => setExportSize(size.id)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer border-none ${
                          exportSize === size.id ? 'bg-violet-600/40 text-white' : 'bg-transparent text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setFullBleed(v => !v)}
                    aria-pressed={fullBleed}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                      fullBleed ? 'bg-violet-600/30 border-violet-500/40 text-white' : 'bg-white/5 border-white/10 text-slate-400'
                    }`}
                  >
                    {t.full_bleed || 'Full bleed'}
                  </button>
                  <button
                    type="button"
                    onClick={downloadPng}
                    disabled={exporting}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    PNG
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {t.export_hint || 'The PNG is redrawn from the same values on a canvas — not a screenshot — so it stays sharp at any size.'}
                </p>
              </div>

              <NextStepBar lang={lang} t={t} getResult={getResult} />
            </div>

            <CodePanel
              tab={tab}
              design={design}
              code={code}
              format={format}
              setFormat={setFormat}
              space={space}
              setSpace={setSpace}
              t={t}
              onImport={importCss}
              onShare={share}
              shared={shared}
            />
          </div>
        </section>

        {/* ================================================================ */}
        {/* How it works                                                     */}
        {/* ================================================================ */}
        <section className="mt-24 space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">
              {t.howItWorksTitle || 'How it works'}
            </h2>
            <div className="h-1 w-16 bg-violet-500 mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, i) => {
              const Art = STEP_ART[i];
              return (
                <div
                  key={i}
                  className="relative glass-card rounded-3xl p-6 space-y-4 border border-white/5 hover:border-violet-500/20 transition-all group"
                >
                  <span className="absolute top-5 right-6 text-5xl font-black text-white/5 group-hover:text-violet-500/10 transition-colors">
                    {i + 1}
                  </span>
                  <Art className="w-24 h-auto text-violet-400" />
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
        <section className="mt-20 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {features.map((feature: any, i: number) => {
            const Icon = featureIcons[i] || IconLayers;
            return (
              <div
                key={i}
                className="p-6 glass-card rounded-3xl border border-white/5 hover:-translate-y-1 transition-all duration-300 group"
              >
                <span className="w-11 h-11 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4 group-hover:border-violet-500/40 transition-all">
                  <Icon className="w-5 h-5" />
                </span>
                <h3 className="text-white text-base font-bold mb-2 group-hover:text-violet-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-500 text-[13px] leading-relaxed font-medium">{feature.text}</p>
              </div>
            );
          })}
        </section>

        {/* ================================================================ */}
        {/* SEO content                                                      */}
        {/* ================================================================ */}
        <section className="mt-24 space-y-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-6 min-w-0">
              {keywords[0] && (
                <span className="inline-block px-4 py-1.5 rounded-lg bg-violet-500/10 text-violet-400 text-[11px] font-black uppercase tracking-[0.2em] border border-violet-500/20">
                  {keywords[0]}
                </span>
              )}
              <h2 className="text-2xl md:text-4xl font-black text-white leading-[1.1] tracking-tight">
                {t.seoHeroTitle}
              </h2>
              <p className="text-slate-400 text-base md:text-lg leading-relaxed font-medium">{t.seoHeroText}</p>
            </div>
            <div className="relative glass-card rounded-[2.5rem] p-8 md:p-10 min-h-[320px] flex flex-col items-center justify-center gap-6 text-center overflow-hidden border border-white/5">
              <span className="absolute -top-16 -right-16 w-56 h-56 bg-violet-500/10 rounded-full blur-3xl" />
              <IconLocal className="w-16 h-16 text-violet-400 relative" />
              <div className="space-y-3 max-w-sm relative">
                <h3 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight">
                  {t.seoBrowserSpeedTitle}
                </h3>
                <p className="text-slate-400 font-medium text-sm leading-relaxed">{t.seoBrowserSpeedText}</p>
              </div>
            </div>
          </div>

          <div className="p-7 md:p-12 rounded-3xl bg-[#0d0816] border border-white/5 space-y-8">
            <div className="max-w-4xl space-y-4">
              <h2 className="text-xl md:text-3xl font-black text-white leading-tight">{t.seoSecondaryTitle}</h2>
              <div className="h-1.5 w-20 bg-violet-500 rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-3">
                  <span className="w-6 h-px bg-white/20" />
                  {t.seoUseCaseTitle}
                </div>
                <p className="text-slate-400 text-[15px] leading-relaxed font-medium">{t.seoUseCaseText}</p>
              </div>
              <div className="space-y-3">
                <div className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-3">
                  <span className="w-6 h-px bg-white/20" />
                  {t.seoPrivacyTitle}
                </div>
                <p className="text-slate-400 text-[15px] leading-relaxed font-medium">{t.seoPrivacyText}</p>
              </div>
            </div>
          </div>

          {faqs.length > 0 && (
            <div className="max-w-4xl mx-auto w-full space-y-8">
              <div className="text-center space-y-3">
                <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">{t.faqTitle}</h2>
                <div className="h-1 w-16 bg-violet-500 mx-auto rounded-full" />
              </div>
              <div className="grid gap-3">
                {faqs.map((faq: any, i: number) => (
                  <details
                    key={i}
                    className="glass-card rounded-2xl px-5 sm:px-6 py-5 text-left border border-white/5 hover:border-violet-500/20 transition-colors group [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex items-start gap-3 cursor-pointer list-none text-[15px] font-bold text-white group-hover:text-violet-400 transition-colors">
                      <span className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 text-[11px] font-black">
                        Q
                      </span>
                      <span className="flex-1 min-w-0">{faq.question}</span>
                      <span className="shrink-0 text-violet-400 transition-transform group-open:rotate-45 text-xl leading-none">
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
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">{t.seoKeywordsTitle}</h2>
              <div className="flex flex-wrap justify-center gap-2">
                {keywords.map((keyword: string, i: number) => (
                  <span
                    key={i}
                    className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        <AdBanner id="adsense-css-designer-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={m => setActiveModal(m)} />

      {showShortcuts && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={t.shortcuts || 'Keyboard shortcuts'}
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0d0816] p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">{t.shortcuts || 'Keyboard shortcuts'}</h3>
              <button
                type="button"
                onClick={() => setShowShortcuts(false)}
                aria-label={t.close || 'Close'}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="space-y-2 list-none p-0 m-0">
              {shortcuts.map(([keys, description]) => (
                <li key={keys} className="flex items-center justify-between gap-4 text-sm">
                  <kbd className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 font-mono text-[11px] text-violet-300 shrink-0">
                    {keys}
                  </kbd>
                  <span className="text-slate-400 text-right text-[13px]">{description}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <LegalModal
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        title={
          activeModal === 'privacy'
            ? t.privacyPolicy || 'Privacy Policy'
            : activeModal === 'terms'
              ? t.termsOfService || 'Terms of Service'
              : t.cookiePolicy || 'Cookie Policy'
        }
        content={
          activeModal === 'privacy' ? t.privacyContent : activeModal === 'terms' ? t.termsContent : t.cookiesContent
        }
        t={t}
      />
    </div>
  );
};

export default CSSDesigner;
