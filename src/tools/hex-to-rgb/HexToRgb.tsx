import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ClipboardPaste,
  Copy,
  ImagePlus,
  Keyboard,
  Pipette,
  Plus,
  Redo2,
  RotateCcw,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';
import { useHandoffIntake } from '../../lib/useHandoff';
import {
  FORMATTERS,
  formatHex,
  formatRgb,
  harmony,
  parseColor,
  parseColorList,
  rgbToOklch,
  type FormatId,
  type Rgb,
} from './lib/color';
import { serializePalette, type ExportFormat } from './lib/export';
import { MAX_COLORS, useColorWorkspace } from './lib/useColorWorkspace';
import { ImageStudio } from './components/ImageStudio';
import { Tuner, RampPanel, HarmonyPanel } from './components/DerivedPanels';
import { ContrastPanel, CvdPanel, NearestPanel } from './components/AnalysisPanels';
import { ExportPanel } from './components/ExportPanel';
import { NextStepBar } from './components/NextStepBar';
import {
  ColorHeroArt,
  IconContrast,
  IconCvd,
  IconDropper,
  IconExport,
  IconHarmony,
  IconLocal,
  IconRamp,
  IconSyntax,
  StepCheckArt,
  StepInputArt,
  StepShipArt,
  StepTuneArt,
} from './components/Illustrations';

interface HexToRgbProps {
  lang: string;
  dictionary: any;
}

declare global {
  interface Window {
    EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> };
  }
}

const FORMAT_ROWS: Array<{ id: FormatId; label: string }> = [
  { id: 'hex', label: 'HEX' },
  { id: 'rgb', label: 'RGB' },
  { id: 'hsl', label: 'HSL' },
  { id: 'hwb', label: 'HWB' },
  { id: 'oklch', label: 'OKLCH' },
  { id: 'oklab', label: 'OKLab' },
  { id: 'srgb', label: 'color()' },
  { id: 'cmyk', label: 'CMYK' },
  { id: 'swift', label: 'SwiftUI' },
  { id: 'android', label: 'Android' },
];

const STEP_ART = [StepInputArt, StepTuneArt, StepCheckArt, StepShipArt];
const FEATURE_ICONS = [
  IconSyntax,
  IconRamp,
  IconContrast,
  IconCvd,
  IconDropper,
  IconHarmony,
  IconExport,
  IconLocal,
];

export default function HexToRgb({ lang, dictionary }: HexToRgbProps) {
  const t = dictionary || {};
  const workspace = useColorWorkspace();
  const { active, colors, bg, activeIndex } = workspace;

  const [draft, setDraft] = useState('');
  const [draftTouched, setDraftTouched] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [clipboardError, setClipboardError] = useState<string | null>(null);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const [altHeld, setAltHeld] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageFrom, setImageFrom] = useState<string | null>(null);
  const [hasEyeDropper, setHasEyeDropper] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const fileInput = useRef<HTMLInputElement>(null);
  const textInput = useRef<HTMLInputElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Un archivo que llega de otra herramienta NO se procesa solo: se queda
  // esperando en el visor y el usuario decide qué hacer con él.
  useHandoffIntake((file, from) => {
    setImageFile(file);
    setImageFrom(from);
  });

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(media.matches);
    const onChange = (event: MediaQueryListEvent) => setPrefersReduced(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => setHasEyeDropper(typeof window !== 'undefined' && 'EyeDropper' in window), []);

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  // El campo de texto refleja el color activo salvo mientras se está tecleando
  // en él: sobrescribirlo a media palabra impide escribir `oklch(…)` entero.
  useEffect(() => {
    if (!draftTouched) setDraft(formatHex(active, true));
  }, [active, draftTouched]);

  const parsed = useMemo(() => parseColor(draft), [draft]);
  const draftValid = parsed.rgb !== null;

  // --- portapapeles ----------------------------------------------------------
  /** Devuelve si de verdad se copió. El código anterior enseñaba "¡Copiado!"
   *  aunque la promesa del portapapeles se rechazara. */
  const copyText = useCallback(
    async (text: string): Promise<boolean> => {
      if (!text) return false;
      setClipboardError(null);
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        setClipboardError(t.error_clipboard || 'The browser refused clipboard access.');
        return false;
      }
    },
    [t.error_clipboard]
  );

  const copyField = useCallback(
    async (field: string, value: string) => {
      const ok = await copyText(value);
      if (!ok) return;
      setCopiedField(field);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopiedField(null), 2000);
    },
    [copyText]
  );

  // --- entrada ---------------------------------------------------------------
  const commitDraft = useCallback(
    (value: string) => {
      const { rgb } = parseColor(value);
      if (rgb) workspace.setActiveColor(rgb, { baseline: true });
    },
    [workspace]
  );

  const onDraftChange = (value: string) => {
    setDraft(value);
    setDraftTouched(true);
    commitDraft(value);
  };

  const pickWithEyeDropper = useCallback(async () => {
    if (!window.EyeDropper) return;
    try {
      const result = await new window.EyeDropper().open();
      const { rgb } = parseColor(result.sRGBHex);
      if (rgb) {
        workspace.setActiveColor(rgb, { baseline: true });
        setDraftTouched(false);
      }
    } catch {
      // El usuario canceló con Escape: no es un error.
    }
  }, [workspace]);

  const pasteList = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const list = parseColorList(text);
      if (list.length) {
        workspace.replaceAll(list);
        setDraftTouched(false);
      } else {
        setClipboardError(t.error_no_colors || 'No colours found in the clipboard.');
      }
    } catch {
      setClipboardError(t.error_clipboard_read || 'The browser refused to read the clipboard.');
    }
  }, [workspace, t.error_no_colors, t.error_clipboard_read]);

  const onFile = (file: File | null) => {
    if (!file) return;
    setImageFile(file);
    setImageFrom(null);
  };

  // --- atajos ----------------------------------------------------------------
  useEffect(() => {
    const isTyping = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Alt') setAltHeld(true);
      const mod = event.ctrlKey || event.metaKey;
      if (mod && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) workspace.redo();
        else workspace.undo();
        return;
      }
      if (mod && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        workspace.redo();
        return;
      }
      if (isTyping(event.target) || mod) return;
      if (event.key >= '1' && event.key <= '8') {
        workspace.setActiveIndex(Number(event.key) - 1);
        return;
      }
      if (event.key.toLowerCase() === 'c') copyField('hex', FORMATTERS.hex(active));
      if (event.key.toLowerCase() === 'e') pickWithEyeDropper();
      if (event.key === '?') setShowShortcuts((v) => !v);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Alt') setAltHeld(false);
    };
    // Alt+Tab se lleva el foco sin soltar la tecla: sin esto el modo alterno
    // se quedaría activo al volver a la pestaña.
    const onBlur = () => setAltHeld(false);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [workspace, active, copyField, pickWithEyeDropper]);

  // --- color mostrado --------------------------------------------------------
  const complement = useMemo(() => harmony(active, 'complementary')[1], [active]);
  /** Alt enseña el complementario sin tocar el estado; mantener pulsado sobre
   *  la muestra enseña el color de partida. Ninguno de los dos escribe nada. */
  const shown = comparing && workspace.baseline ? workspace.baseline : altHeld ? complement : active;
  const shownLabel = comparing && workspace.baseline
    ? t.preview_baseline || 'Starting colour'
    : altHeld
      ? t.preview_complement || 'Complement (Alt)'
      : null;

  const oklch = useMemo(() => rgbToOklch(shown), [shown]);

  const getResult = useCallback(
    (format: ExportFormat) => serializePalette(colors, format),
    [colors]
  );

  const resetWorkspace = useCallback(() => {
    workspace.reset();
    setImageFile(null);
    setImageFrom(null);
    setDraftTouched(false);
    setClipboardError(null);
  }, [workspace]);

  const faqs: any[] = Array.isArray(t.faq) ? t.faq : [];
  const features: any[] = Array.isArray(t.features) ? t.features : [];
  const steps: any[] = Array.isArray(t.steps) ? t.steps : [];
  const keywords: string[] = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];
  const shortcuts: any[] = Array.isArray(t.shortcuts) ? t.shortcuts : [];

  const checkerStyle: React.CSSProperties = {
    backgroundImage:
      'linear-gradient(45deg, #0f1f1c 25%, transparent 25%), linear-gradient(-45deg, #0f1f1c 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #0f1f1c 75%), linear-gradient(-45deg, transparent 75%, #0f1f1c 75%)',
    backgroundSize: '24px 24px',
    backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0px',
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#020a08] text-slate-200 font-sans relative">
      <Header
        currentLang={lang}
        onLanguageChange={(l) => (window.location.href = `/${l.toLowerCase()}/hex-to-rgb`)}
        onReset={resetWorkspace}
        t={t}
      />

      {/* El max-w vive en el propio <main>: AdRail mide ESTE elemento para
          decidir si caben los raíles laterales, y un <main> a ancho completo
          los deja fuera para siempre, en cualquier resolución. */}
      <main className="flex-grow w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))] px-4 md:px-10 pt-32 md:pt-32 pb-20 relative z-10 flex flex-col gap-10">
        <AdBanner id="adsense-hex-to-rgb-top" />

        {/* ------------------------------------------------------------- Héroe */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-8 items-center">
          <div className="space-y-5 text-center lg:text-left">
            <span className="inline-flex max-w-full items-center gap-2 px-4 py-2 rounded-full bg-teal-950/50 border border-teal-800/40 text-teal-400 text-[11px] font-black tracking-[0.2em] uppercase">
              {t.badge || 'Colour conversion'}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-[1.1] break-words">
              {t.seoHeroTitle || 'Colour Converter Studio'}
            </h1>
            <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
              {t.description || t.seoHeroText}
            </p>
          </div>
          <ColorHeroArt
            className="w-full max-w-lg mx-auto drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
            animated={!prefersReduced}
          />
        </section>

        {/* -------------------------------------------------------- Banco de trabajo */}
        <section className="glass-card rounded-3xl p-5 md:p-8 space-y-6 border border-white/5">
          {/* Paleta */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-400 w-full sm:w-auto">
              {t.palette_title || 'Palette'}
            </span>
            {colors.map((color, index) => (
              <div key={index} className="relative group">
                <button
                  onClick={() => {
                    workspace.setActiveIndex(index);
                    setDraftTouched(false);
                  }}
                  onContextMenu={(event) => {
                    // Clic derecho = complementario en el sitio, sin menú.
                    event.preventDefault();
                    workspace.setActiveIndex(index);
                    workspace.setActiveColor(harmony(color, 'complementary')[1]);
                    setDraftTouched(false);
                  }}
                  title={`${formatHex(color, true)} · ${index + 1}`}
                  className={`w-11 h-11 rounded-xl border-2 transition-transform hover:scale-105 cursor-pointer outline-none ${
                    index === activeIndex ? 'border-teal-400 scale-105' : 'border-white/10'
                  }`}
                  style={{ backgroundColor: formatRgb(color) }}
                />
                {colors.length > 1 && (
                  <button
                    onClick={() => workspace.removeColor(index)}
                    aria-label={t.palette_remove || 'Remove this colour'}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-900 border border-white/15 text-slate-400 hover:text-red-300 hover:border-red-500/40 opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center justify-center transition-all cursor-pointer outline-none"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            {colors.length < MAX_COLORS && (
              <button
                onClick={() => workspace.addColor(active)}
                title={t.palette_add || 'Add a slot'}
                className="w-11 h-11 rounded-xl border-2 border-dashed border-white/15 hover:border-teal-500/50 text-slate-500 hover:text-teal-400 flex items-center justify-center transition-colors cursor-pointer outline-none"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            <span className="h-px flex-1 min-w-[1rem] bg-white/5 hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <button
                onClick={workspace.undo}
                disabled={!workspace.canUndo}
                title={t.tooltip_undo || 'Undo (Ctrl+Z)'}
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/5 hover:bg-teal-500/20 hover:border-teal-500/30 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer outline-none"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={workspace.redo}
                disabled={!workspace.canRedo}
                title={t.tooltip_redo || 'Redo (Ctrl+Shift+Z)'}
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/5 hover:bg-teal-500/20 hover:border-teal-500/30 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer outline-none"
              >
                <Redo2 className="w-4 h-4" />
              </button>
              <button
                onClick={resetWorkspace}
                title={t.button_reset || 'Reset'}
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/5 hover:bg-red-500/20 hover:border-red-500/30 text-slate-300 hover:text-red-300 flex items-center justify-center transition-colors cursor-pointer outline-none"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Muestra grande */}
          <div className="rounded-3xl overflow-hidden border border-white/10 relative" style={checkerStyle}>
            <div
              className="h-40 md:h-52 w-full flex items-end justify-between p-4 md:p-5 gap-3 select-none cursor-pointer"
              style={{ backgroundColor: formatRgb(shown) }}
              onPointerDown={() => workspace.baseline && setComparing(true)}
              onPointerUp={() => setComparing(false)}
              onPointerLeave={() => setComparing(false)}
              title={t.preview_hold || 'Hold to compare with the starting colour'}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-black/45 backdrop-blur-md border border-white/10 font-mono text-xs font-bold text-white">
                  {formatHex(shown, true)}
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-black/45 backdrop-blur-md border border-white/10 font-mono text-[11px] text-white/90">
                  L {(oklch.l * 100).toFixed(1)}% · C {oklch.c.toFixed(3)} · H {oklch.h.toFixed(0)}°
                </span>
              </div>
              {shownLabel && (
                <span className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-teal-500/40 text-[10px] font-black uppercase tracking-[0.15em] text-teal-300">
                  {shownLabel}
                </span>
              )}
            </div>
          </div>

          {/* Entrada */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor="hex-to-rgb-input"
                className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-400"
              >
                {t.label_input || 'Any CSS colour'}
              </label>
              {draft.trim().length > 0 && (
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                    draftValid
                      ? 'bg-teal-500/15 border-teal-500/30 text-teal-300'
                      : 'bg-red-500/15 border-red-500/30 text-red-300'
                  }`}
                >
                  {draftValid ? parsed.syntax : t.error_invalid || 'not a colour'}
                </span>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-grow flex items-center">
                <Pipette className="absolute left-4 w-5 h-5 text-teal-400 pointer-events-none" />
                <input
                  id="hex-to-rgb-input"
                  ref={textInput}
                  type="text"
                  value={draft}
                  onChange={(event) => onDraftChange(event.target.value)}
                  onBlur={() => setDraftTouched(false)}
                  placeholder={t.placeholder_input || '#FF6347, rebeccapurple, oklch(70% 0.15 30)…'}
                  spellCheck={false}
                  autoComplete="off"
                  className={`w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-950/60 border font-mono text-sm text-white placeholder-slate-600 transition-colors outline-none ${
                    draftValid || !draft.trim()
                      ? 'border-white/10 focus:border-teal-500/60'
                      : 'border-red-500/40 focus:border-red-500/60'
                  }`}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <label
                  className="relative w-11 h-11 rounded-xl overflow-hidden border border-white/10 hover:border-teal-500/50 cursor-pointer transition-colors shrink-0"
                  title={t.tooltip_picker || 'System colour picker'}
                >
                  <span className="absolute inset-0" style={{ backgroundColor: formatHex(active) }} />
                  <input
                    type="color"
                    value={formatHex(active)}
                    onChange={(event) => {
                      const { rgb } = parseColor(event.target.value);
                      if (rgb) {
                        workspace.setActiveColor({ ...rgb, a: active.a }, { baseline: true });
                        setDraftTouched(false);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label={t.tooltip_picker || 'System colour picker'}
                  />
                </label>

                {hasEyeDropper && (
                  <button
                    onClick={pickWithEyeDropper}
                    title={t.tooltip_eyedropper || 'Pick a colour from anywhere on screen (E)'}
                    className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 hover:bg-teal-500/20 hover:border-teal-500/40 text-teal-400 flex items-center justify-center transition-colors cursor-pointer outline-none"
                  >
                    <IconDropper className="w-5 h-5" />
                  </button>
                )}

                <button
                  onClick={pasteList}
                  title={t.tooltip_paste || 'Paste a list of colours'}
                  className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 hover:bg-teal-500/20 hover:border-teal-500/40 text-slate-300 flex items-center justify-center transition-colors cursor-pointer outline-none"
                >
                  <ClipboardPaste className="w-5 h-5" />
                </button>

                <button
                  onClick={() => fileInput.current?.click()}
                  title={t.tooltip_image || 'Pick colours from an image'}
                  className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 hover:bg-teal-500/20 hover:border-teal-500/40 text-slate-300 flex items-center justify-center transition-colors cursor-pointer outline-none"
                >
                  <ImagePlus className="w-5 h-5" />
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    onFile(event.target.files?.[0] ?? null);
                    event.target.value = '';
                  }}
                />

                <button
                  onClick={() => setShowShortcuts((v) => !v)}
                  title={t.tooltip_shortcuts || 'Keyboard shortcuts (?)'}
                  className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-colors cursor-pointer outline-none ${
                    showShortcuts
                      ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                      : 'bg-white/5 border-white/10 hover:bg-teal-500/20 text-slate-300'
                  }`}
                >
                  <Keyboard className="w-5 h-5" />
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              {parsed.native
                ? t.hint_native ||
                  'Parsed by the browser itself, so named colours, hwb(), lab(), oklch() and color-mix() all work.'
                : t.hint_fallback || 'Hex, rgb() and hsl() are understood without any browser help.'}
            </p>

            {clipboardError && (
              <p className="flex items-center gap-2 text-[11px] font-bold text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
                {clipboardError}
              </p>
            )}

            {showShortcuts && shortcuts.length > 0 && (
              <div className="rounded-2xl bg-black/40 border border-white/5 p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                {shortcuts.map((entry: any, index: number) => (
                  <div key={index} className="flex items-baseline justify-between gap-3 text-[11px]">
                    <span className="text-slate-400">{entry.label}</span>
                    <kbd className="font-mono font-bold text-teal-300 shrink-0">{entry.keys}</kbd>
                  </div>
                ))}
              </div>
            )}
          </div>

          <ImageStudio
            t={t}
            file={imageFile}
            from={imageFrom}
            onClear={() => {
              setImageFile(null);
              setImageFrom(null);
            }}
            onPick={(rgb) => {
              workspace.setActiveColor(rgb, { baseline: true });
              setDraftTouched(false);
            }}
            onPalette={(palette) => {
              workspace.replaceAll(palette);
              setDraftTouched(false);
            }}
          />

          {/* Formatos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {FORMAT_ROWS.map((row) => {
              const value = FORMATTERS[row.id](shown);
              const copied = copiedField === row.id;
              return (
                <div
                  key={row.id}
                  className="flex items-center gap-3 rounded-2xl bg-slate-950/50 border border-white/5 hover:border-teal-500/25 px-3.5 py-3 transition-colors"
                >
                  <span className="shrink-0 w-[68px] font-mono text-[10px] font-black uppercase tracking-wider text-teal-400/90">
                    {row.label}
                  </span>
                  <span className="flex-1 min-w-0 font-mono text-[13px] text-white truncate select-all">
                    {value}
                  </span>
                  <button
                    onClick={() => copyField(row.id, value)}
                    title={copied ? t.copied || 'Copied' : t.copy || 'Copy'}
                    className={`shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer outline-none ${
                      copied
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-white/5 border-white/5 hover:bg-teal-500/20 hover:border-teal-500/30 text-slate-400 hover:text-white'
                    }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            {t.cmyk_disclaimer ||
              'CMYK here is the plain arithmetic conversion, not an ICC separation: a press-ready CMYK depends on paper, ink and output profile, and cannot be derived from an sRGB value alone.'}
          </p>

          <div className="border-t border-white/5 pt-6">
            <Tuner
              t={t}
              color={active}
              onChange={(rgb) => {
                workspace.setActiveColor(rgb);
                setDraftTouched(false);
              }}
            />
          </div>

          <NextStepBar lang={lang} t={t} disabled={!colors.length} getResult={getResult} />
        </section>

        <AdBanner id="adsense-hex-to-rgb-mid" />

        {/* -------------------------------------------------------------- Derivados */}
        <RampPanel
          t={t}
          color={active}
          onPick={(rgb) => {
            workspace.setActiveColor(rgb);
            setDraftTouched(false);
          }}
          onSendAll={(list) => workspace.replaceAll(list)}
        />

        <HarmonyPanel
          t={t}
          color={active}
          palette={colors}
          onPick={(rgb) => {
            workspace.setActiveColor(rgb);
            setDraftTouched(false);
          }}
          onSendAll={(list) => workspace.replaceAll(list)}
        />

        <ContrastPanel
          t={t}
          color={active}
          bg={bg}
          onBgChange={workspace.setBg}
          onSwap={() => {
            const previous = bg;
            workspace.setBg(active);
            workspace.setActiveColor(previous);
            setDraftTouched(false);
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <CvdPanel t={t} colors={colors} />
          <NearestPanel
            t={t}
            color={active}
            onPick={(hex) => {
              const { rgb } = parseColor(hex);
              if (rgb) {
                workspace.setActiveColor({ ...rgb, a: active.a }, { baseline: true });
                setDraftTouched(false);
              }
            }}
          />
        </div>

        <ExportPanel t={t} colors={colors} onCopy={copyText} />

        {/* ------------------------------------------------------------ Cómo funciona */}
        {steps.length > 0 && (
          <section className="space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">
                {t.howItWorksTitle || 'How it works'}
              </h2>
              <div className="h-1 w-16 bg-teal-500 mx-auto rounded-full" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              {steps.slice(0, 4).map((step: any, index: number) => {
                const Art = STEP_ART[index] ?? StepInputArt;
                return (
                  <div
                    key={index}
                    className="glass-card rounded-3xl p-6 space-y-4 border border-white/5 hover:border-teal-500/20 transition-colors"
                  >
                    <Art className="w-full h-24" animated={!prefersReduced} />
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-400">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <h3 className="text-base font-black text-white">{step.title}</h3>
                      <p className="text-sm text-slate-400 leading-relaxed">{step.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* -------------------------------------------------------------- Features */}
        {features.length > 0 && (
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {features.slice(0, 8).map((feature: any, index: number) => {
              const Icon = FEATURE_ICONS[index] ?? IconSyntax;
              return (
                <div
                  key={index}
                  className="glass-card rounded-2xl p-5 space-y-3 border border-white/5 hover:border-teal-500/20 transition-colors"
                >
                  <Icon className="w-8 h-8 text-teal-400" />
                  <h3 className="text-sm font-black text-white">{feature.title}</h3>
                  <p className="text-[13px] text-slate-400 leading-relaxed">{feature.text}</p>
                </div>
              );
            })}
          </section>
        )}

        {/* ------------------------------------------------------------------ SEO */}
        <section className="p-7 md:p-12 rounded-3xl bg-[#04130f] border border-white/5 space-y-9">
          <div className="max-w-3xl space-y-3">
            <h2 className="text-xl md:text-3xl font-black text-white leading-tight">
              {t.seoBrowserSpeedTitle || 'Instant local processing'}
            </h2>
            <div className="h-1.5 w-20 bg-teal-500 rounded-full" />
            <p className="text-slate-400 text-base leading-relaxed">{t.seoBrowserSpeedText}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2.5">
              <div className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-3">
                <span className="w-6 h-px bg-white/20" />
                {t.seoUseCaseTitle}
              </div>
              <p className="text-slate-400 text-[15px] leading-relaxed">{t.seoUseCaseText}</p>
            </div>
            <div className="space-y-2.5">
              <div className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-3">
                <span className="w-6 h-px bg-white/20" />
                {t.seoPrivacyTitle}
              </div>
              <p className="text-slate-400 text-[15px] leading-relaxed">{t.seoPrivacyText}</p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ FAQ */}
        {faqs.length > 0 && (
          <section className="max-w-4xl mx-auto w-full space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">
                {t.faqTitle || 'Frequently asked questions'}
              </h2>
              <div className="h-1 w-16 bg-teal-500 mx-auto rounded-full" />
            </div>
            <div className="grid gap-3">
              {faqs.map((faq: any, index: number) => (
                <details
                  key={index}
                  className="glass-card rounded-2xl px-5 md:px-6 py-5 text-left border border-white/5 hover:border-teal-500/20 transition-colors group [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex items-start gap-3 cursor-pointer list-none text-[15px] font-bold text-white group-hover:text-teal-400 transition-colors">
                    <span className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 text-[11px] font-black">
                      Q
                    </span>
                    <span className="flex-1">{faq.question}</span>
                    <span className="shrink-0 text-teal-400 transition-transform group-open:rotate-45 text-xl leading-none">
                      +
                    </span>
                  </summary>
                  <p className="text-slate-400 leading-relaxed pl-9 pt-3 text-sm">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {keywords.length > 0 && (
          <div className="max-w-4xl mx-auto w-full space-y-5 opacity-55 text-center">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
              {t.seoKeywordsTitle || 'Keywords'}
            </h2>
            <div className="flex flex-wrap justify-center gap-2">
              {keywords.map((keyword: string, index: number) => (
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

        <AdBanner id="adsense-hex-to-rgb-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={(modal) => setLegalModal(modal)} />

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
