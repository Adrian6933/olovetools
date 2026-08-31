import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUp,
  Check,
  Code,
  Copy,
  Download,
  Eye,
  FileUp,
  Loader2,
  Maximize,
  Minus,
  Palette,
  PencilLine,
  Plus,
  Redo2,
  RefreshCw,
  Save,
  Settings,
  Sliders,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';

import { useHandoffIntake } from '../../lib/useHandoff';
import type { Language } from '../../locales/meta';
import { AdBanner } from '../../components/shared/AdBanner';

import { Header } from './components/Header';
import { CardCanvas } from './components/CardCanvas';
import { NextStepBar } from './components/NextStepBar';
import {
  CodeCardHeroArt,
  FocusLinesIcon,
  LocalOnlyIcon,
  ResolutionIcon,
  StepExportArt,
  StepPasteArt,
  StepStyleArt,
  TokenStreamIcon,
} from './components/Illustrations';

import { detectLanguage, getLanguage, LANGUAGE_GROUPS, LANGUAGES } from './lib/languages';
import { ensureGrammar, grammarReady, tokenize } from './lib/prism';
import { plainLines, rangesToText, textToRanges, toLines } from './lib/lines';
import { getTheme, themeCss, THEMES } from './lib/themes';
import { ASPECTS, backgroundFlat, GRADIENTS } from './lib/backgrounds';
import {
  canRedo,
  canUndo,
  cloneSettings,
  DEFAULT_CODE,
  DEFAULT_EXPORT,
  DEFAULT_SETTINGS,
  emptyHistory,
  loadLastSettings,
  loadPresets,
  pushHistory,
  saveLastSettings,
  savePresets,
  type History,
  type Preset,
} from './lib/settings';
import { copyToClipboard, downloadBlob, renderCard, safeFileName } from './lib/export';
import type { CardSettings, ExportFormat, ExportSettings, PendingFile, Status } from './types';

/** Por encima de esto tokenizar en cada tecla se nota, así que se avisa. */
const BIG_FILE_LINES = 3000;
const MAX_FILE_BYTES = 4 * 1024 * 1024;

interface CodecardProps {
  lang: Language;
  dictionary?: any;
}

export const Codecard: React.FC<CodecardProps> = ({ lang, dictionary }) => {
  const t = dictionary || {};
  const tr = (key: string, fallback: string): string => (typeof t[key] === 'string' ? t[key] : fallback);

  const [code, setCode] = useState<string>(DEFAULT_CODE);
  const [settings, setSettings] = useState<CardSettings>(DEFAULT_SETTINGS);
  const [exportSettings, setExportSettings] = useState<ExportSettings>(DEFAULT_EXPORT);
  const [activeTab, setActiveTab] = useState<'code' | 'style' | 'window' | 'export'>('code');

  const [status, setStatus] = useState<Status>('idle');
  const [statusDetail, setStatusDetail] = useState<string>('');
  const [pending, setPending] = useState<PendingFile | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [history, setHistory] = useState<History>(() => emptyHistory(DEFAULT_CODE, DEFAULT_SETTINGS));

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [altHeld, setAltHeld] = useState(false);
  const [showPlain, setShowPlain] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [highlightText, setHighlightText] = useState('');
  /** Se incrementa para pedirle al lienzo que vuelva a encuadrar la tarjeta. */
  const [fitToken, setFitToken] = useState(0);

  /** Sube cada vez que carga una gramática, para forzar el re-tokenizado. */
  const [grammarTick, setGrammarTick] = useState(0);

  const cardRef = useRef<HTMLDivElement>(null!);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastClickedLine = useRef<number>(1);
  const historyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // -------------------------------------------------------------------------
  // Ajustes persistidos
  // -------------------------------------------------------------------------
  useEffect(() => {
    const saved = loadLastSettings();
    if (saved) {
      setSettings(saved);
      setHistory(emptyHistory(DEFAULT_CODE, saved));
    }
    setPresets(loadPresets());
  }, []);

  useEffect(() => {
    saveLastSettings(settings);
  }, [settings]);

  // -------------------------------------------------------------------------
  // Gramática: se carga solo la del lenguaje elegido, con sus dependencias
  // -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    if (grammarReady(settings.language)) return;
    setStatus('loading-grammar');
    ensureGrammar(settings.language)
      .then(() => {
        if (cancelled) return;
        setGrammarTick(n => n + 1);
        setStatus('idle');
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
        setStatusDetail(tr('errorGrammar', 'Could not load the syntax grammar.'));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.language]);

  // -------------------------------------------------------------------------
  // Modelo de líneas — memoizado. Antes se re-tokenizaba en CADA render, así
  // que mover el slider del padding volvía a analizar el snippet entero.
  // -------------------------------------------------------------------------
  const lines = useMemo(() => {
    const tokens = tokenize(code, settings.language);
    return tokens ? toLines(tokens) : plainLines(code);
    // grammarTick entra a propósito: el resultado depende de si la gramática ya
    // está cargada, y eso no es un valor sino un efecto sobre el global Prism.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, settings.language, grammarTick]);

  const theme = getTheme(settings.theme);
  const styleCss = useMemo(() => themeCss(theme), [theme]);

  // -------------------------------------------------------------------------
  // Historial
  // -------------------------------------------------------------------------
  const commit = useCallback(
    (nextCode: string, nextSettings: CardSettings) => {
      setHistory(h => pushHistory(h, { code: nextCode, settings: nextSettings }));
    },
    []
  );

  /** Cambio de ajustes: entra en el historial de inmediato. */
  const update = useCallback(
    (patch: Partial<CardSettings>) => {
      setSettings(prev => {
        const next = { ...prev, ...patch };
        commit(code, next);
        return next;
      });
    },
    [code, commit]
  );

  /** Cambio de código: al historial con retardo, o cada tecla sería un paso. */
  const updateCode = useCallback(
    (nextCode: string) => {
      setCode(nextCode);
      clearTimeout(historyTimer.current);
      historyTimer.current = setTimeout(() => {
        setSettings(current => {
          commit(nextCode, current);
          return current;
        });
      }, 600);
    },
    [commit]
  );

  useEffect(() => () => clearTimeout(historyTimer.current), []);

  const travel = useCallback(
    (delta: number) => {
      setHistory(h => {
        const index = h.index + delta;
        if (index < 0 || index >= h.entries.length) return h;
        const entry = h.entries[index];
        setCode(entry.code);
        setSettings(cloneSettings(entry.settings));
        return { ...h, index };
      });
    },
    []
  );

  // -------------------------------------------------------------------------
  // Entrada de ficheros — nada se carga solo: el archivo queda en espera
  // -------------------------------------------------------------------------
  const receiveFile = useCallback((file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      setStatus('error');
      setStatusDetail(tr('errorTooBig', 'That file is over 4 MB.'));
      return;
    }
    void file.text().then(text => {
      setPending({
        file,
        name: file.name,
        size: file.size,
        lines: text.split('\n').length,
        language: detectLanguage(file.name, text),
        text,
      });
      setStatus('idle');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Un fragmento que llega de otra herramienta (JSONFlow → "haz una imagen").
  useHandoffIntake(file => receiveFile(file));

  const applyPending = (detect: boolean) => {
    if (!pending) return;
    const language = detect && pending.language ? pending.language : settings.language;
    const next: CardSettings = { ...settings, language, fileName: pending.name, highlightedLines: [] };
    setCode(pending.text);
    setSettings(next);
    setHighlightText('');
    commit(pending.text, next);
    setPending(null);
  };

  const startBlank = () => {
    const next: CardSettings = { ...settings, fileName: getLanguage(settings.language)?.sample || 'snippet.txt', highlightedLines: [] };
    setCode('');
    setSettings(next);
    setHighlightText('');
    commit('', next);
    setPending(null);
    setActiveTab('code');
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  // -------------------------------------------------------------------------
  // Resaltado de líneas
  // -------------------------------------------------------------------------
  const setHighlights = (next: Set<number>) => {
    const arr = [...next].sort((a, b) => a - b);
    update({ highlightedLines: arr });
    setHighlightText(rangesToText(next));
  };

  const onLineClick = (line: number, modifiers: { shift: boolean; invert: boolean }) => {
    const current = new Set(settings.highlightedLines);
    if (modifiers.invert) {
      // Alt invierte la selección completa: lo que estaba marcado se apaga y
      // al revés. Es lo que se previsualiza mientras se mantiene Alt.
      const inverted = new Set<number>();
      for (let n = settings.startLine; n < settings.startLine + lines.length; n++) {
        if (!current.has(n)) inverted.add(n);
      }
      setHighlights(inverted);
      return;
    }
    if (modifiers.shift) {
      const from = Math.min(lastClickedLine.current, line);
      const to = Math.max(lastClickedLine.current, line);
      for (let n = from; n <= to; n++) current.add(n);
    } else if (current.has(line)) {
      current.delete(line);
    } else {
      current.add(line);
    }
    lastClickedLine.current = line;
    setHighlights(current);
  };

  const onHighlightTextChange = (value: string) => {
    setHighlightText(value);
    update({ highlightedLines: [...textToRanges(value, lines.length + settings.startLine)].sort((a, b) => a - b) });
  };

  // -------------------------------------------------------------------------
  // Exportación
  // -------------------------------------------------------------------------
  const buildBlob = useCallback(
    async (format: ExportFormat) => {
      if (!cardRef.current) return null;
      return renderCard(cardRef.current, {
        format,
        scale: exportSettings.scale,
        quality: exportSettings.quality,
        background: backgroundFlat(settings.background),
      });
    },
    [exportSettings.quality, exportSettings.scale, settings.background]
  );

  const doDownload = async () => {
    setStatus('exporting');
    setStatusDetail('');
    try {
      const result = await buildBlob(exportSettings.format);
      if (!result) throw new Error('no-node');
      downloadBlob(result.blob, safeFileName(settings.fileName, exportSettings.format));
      setStatus('idle');
      setStatusDetail(
        `${result.width}×${result.height} px · ${(result.blob.size / 1024).toFixed(0)} KB`
      );
    } catch {
      setStatus('error');
      setStatusDetail(tr('statusError', 'Error capturing image. Please try again.'));
    }
  };

  const doCopy = async () => {
    setStatus('exporting');
    try {
      const result = await buildBlob('png');
      const ok = result ? await copyToClipboard(result.blob) : false;
      setStatus(ok ? 'copied' : 'error');
      setStatusDetail(ok ? '' : tr('copyFail', 'Your browser blocked the clipboard. Download it instead.'));
      if (ok) setTimeout(() => setStatus('idle'), 1800);
    } catch {
      setStatus('error');
      setStatusDetail(tr('statusError', 'Error capturing image. Please try again.'));
    }
  };

  /** Lo que consume NextStepBar: el PNG, generado solo si se elige un destino. */
  const getResultForHandoff = useCallback(async () => {
    const result = await buildBlob('png');
    if (!result) return null;
    return { blob: result.blob, name: safeFileName(settings.fileName, 'png') };
  }, [buildBlob, settings.fileName]);

  // -------------------------------------------------------------------------
  // Zoom y encuadre
  // -------------------------------------------------------------------------
  const clampZoom = (value: number) => Math.min(3, Math.max(0.2, value));

  const changeZoom = useCallback((next: number, origin?: { x: number; y: number }) => {
    const clamped = clampZoom(next);
    setZoom(prevZoom => {
      if (origin) {
        const ratio = clamped / prevZoom;
        setPan(prevPan => ({
          x: origin.x - (origin.x - prevPan.x) * ratio,
          y: origin.y - (origin.y - prevPan.y) * ratio,
        }));
      }
      return clamped;
    });
  }, []);

  const resetView = () => {
    setPan({ x: 0, y: 0 });
    setFitToken(n => n + 1);
  };

  // -------------------------------------------------------------------------
  // Teclado
  // -------------------------------------------------------------------------
  useEffect(() => {
    const isTyping = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      return !!el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.isContentEditable);
    };

    const down = (event: KeyboardEvent) => {
      if (event.altKey) setAltHeld(true);
      const mod = event.ctrlKey || event.metaKey;

      if (mod && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        travel(event.shiftKey ? 1 : -1);
        return;
      }
      if (mod && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        travel(1);
        return;
      }
      if (mod && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void doDownload();
        return;
      }
      if (mod && event.shiftKey && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        void doCopy();
        return;
      }
      if (mod && (event.key === '=' || event.key === '+')) {
        event.preventDefault();
        changeZoom(zoom * 1.15);
        return;
      }
      if (mod && event.key === '-') {
        event.preventDefault();
        changeZoom(zoom / 1.15);
        return;
      }
      if (mod && event.key === '0') {
        event.preventDefault();
        resetView();
        return;
      }
      if (event.key === 'Escape' && !isTyping(event.target)) {
        setHighlights(new Set());
      }
    };

    const up = (event: KeyboardEvent) => {
      if (!event.altKey) setAltHeld(false);
    };
    const blur = () => setAltHeld(false);

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [travel, zoom, changeZoom, settings, exportSettings]);

  /** Tab dentro del editor indenta en vez de saltar al siguiente control. */
  const onTextareaKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Tab' || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    const el = event.currentTarget;
    const pad = ' '.repeat(settings.tabSize);
    const { selectionStart, selectionEnd, value } = el;
    const next = value.slice(0, selectionStart) + pad + value.slice(selectionEnd);
    updateCode(next);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = selectionStart + pad.length;
    });
  };

  // -------------------------------------------------------------------------
  // Presets
  // -------------------------------------------------------------------------
  const savePreset = () => {
    const name = (settings.theme + ' · ' + settings.background.gradient).slice(0, 40);
    const next = [{ name, settings: cloneSettings(settings) }, ...presets.filter(p => p.name !== name)].slice(0, 12);
    setPresets(next);
    savePresets(next);
  };

  const applyPreset = (preset: Preset) => {
    const next = cloneSettings(preset.settings);
    setSettings(next);
    setHighlightText(rangesToText(new Set(next.highlightedLines)));
    commit(code, next);
  };

  const deletePreset = (name: string) => {
    const next = presets.filter(p => p.name !== name);
    setPresets(next);
    savePresets(next);
  };

  const resetAll = () => {
    setCode(DEFAULT_CODE);
    setSettings(DEFAULT_SETTINGS);
    setExportSettings(DEFAULT_EXPORT);
    setHighlightText('');
    setPending(null);
    setStatus('idle');
    setStatusDetail('');
    resetView();
    setHistory(emptyHistory(DEFAULT_CODE, DEFAULT_SETTINGS));
  };

  // -------------------------------------------------------------------------
  // Scroll
  // -------------------------------------------------------------------------
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const faqs = Array.isArray(t.faq) ? t.faq : [];
  const keywords = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];
  const featuresList = Array.isArray(t.features) ? t.features : [];
  const featureIcons = [TokenStreamIcon, FocusLinesIcon, ResolutionIcon, LocalOnlyIcon];

  const steps = [
    { art: StepPasteArt, title: tr('howStep1Title', 'Paste or drop your code'), text: tr('howStep1Text', '') },
    { art: StepStyleArt, title: tr('howStep2Title', 'Style it and pick the key lines'), text: tr('howStep2Text', '') },
    { art: StepExportArt, title: tr('howStep3Title', 'Export or send it onward'), text: tr('howStep3Text', '') },
  ];

  const labelCls = 'block text-xs font-black text-slate-500 uppercase tracking-widest';
  const fieldCls =
    'w-full h-11 bg-[#060408] border border-white/10 rounded-xl px-3 text-xs text-slate-300 outline-none focus:border-indigo-500';
  const chipCls = (active: boolean) =>
    `py-2 px-2 text-[10px] font-bold rounded-xl border text-center transition-all cursor-pointer outline-none ${
      active
        ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300'
        : 'bg-[#060408] border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-[#06050a] text-slate-100 selection:bg-indigo-500/30 overflow-x-hidden font-sans">
      <style dangerouslySetInnerHTML={{ __html: styleCss }} />
      <style
        dangerouslySetInnerHTML={{
          __html: `
/* Durante la captura el nodo se despega del ancho de la ventana: sin esto
   html-to-image serializa el recorte que se ve en pantalla. */
.codecard-exporting, .codecard-exporting * { overflow: visible !important; }
.codecard-line { min-height: 1em; }
@media (prefers-reduced-motion: reduce) {
  .codecard-hero-art animate, .codecard-hero-art animateTransform { display: none; }
}
`,
        }}
      />

      <Header currentLang={lang} onLanguageChange={newLang => (window.location.href = `/${newLang.toLowerCase()}/codecard`)} t={t} />

      <main className="flex-1 flex flex-col items-center pt-36 pb-24 px-4 md:px-12 relative z-10 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))]">
        <AdBanner id="adsense-codecard-top" />

        <div className="w-full space-y-16 md:space-y-24">
          {/* ---------------------------------------------------------------- */}
          {/* Héroe                                                            */}
          {/* ---------------------------------------------------------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 items-center pt-2">
            <div className="space-y-5 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-950/40 border border-indigo-800/30 text-indigo-300 text-[10px] font-black tracking-[0.2em] uppercase">
                <Code className="w-3.5 h-3.5" />
                <span>{tr('heroBadge', 'Code screenshot studio')}</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.02] text-white">
                {t.title}
              </h1>
              <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
                {t.description}
              </p>
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start pt-1">
                {[
                  tr('heroChipLanguages', `${LANGUAGES.length} languages`),
                  tr('heroChipLocal', 'Runs in your browser'),
                  tr('heroChipNoAccount', 'No account, no upload'),
                ].map(chip => (
                  <span
                    key={chip}
                    className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white/[0.04] border border-white/10 rounded-full px-3 py-1.5"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
            <CodeCardHeroArt className="codecard-hero-art w-full max-w-[420px] mx-auto h-auto" />
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Editor                                                           */}
          {/* ---------------------------------------------------------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Panel de controles */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex p-1 rounded-2xl bg-[#0e0c15]/80 border border-white/5 gap-1 w-full">
                {[
                  { id: 'code', label: t.tabCode, icon: Code },
                  { id: 'style', label: t.tabStyle, icon: Palette },
                  { id: 'window', label: t.tabWindow, icon: Settings },
                  { id: 'export', label: t.tabExport, icon: Download },
                ].map(tab => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer outline-none ${
                        active ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="glass-card rounded-3xl p-5 md:p-6 text-left space-y-5">
                {/* ---------------- TAB: CÓDIGO ---------------- */}
                {activeTab === 'code' && (
                  <div className="space-y-4">
                    {/* Archivo en espera: nada se carga hasta que el usuario pulsa */}
                    {pending && (
                      <div className="rounded-2xl border border-indigo-500/40 bg-indigo-950/25 p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-black text-white truncate">{pending.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {pending.size < 1024
                                ? `${pending.size} B`
                                : `${(pending.size / 1024).toFixed(1)} KB`}{' '}
                              · {pending.lines} {tr('pendingLines', 'lines')}
                              {pending.language ? ` · ${getLanguage(pending.language)?.label}` : ''}
                            </p>
                          </div>
                          <button
                            onClick={() => setPending(null)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                            aria-label={tr('pendingDiscard', 'Discard')}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {pending.lines > BIG_FILE_LINES && (
                          <p className="text-[10px] font-bold text-amber-400/90">
                            {tr('pendingBig', 'Large file: highlighting may feel slow while you type.')}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => applyPending(true)}
                            className="flex-1 min-w-[130px] py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black cursor-pointer transition-colors"
                          >
                            {tr('pendingLoad', 'Load into the editor')}
                          </button>
                          <button
                            onClick={() => applyPending(false)}
                            className="flex-1 min-w-[130px] py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-bold cursor-pointer transition-colors"
                          >
                            {tr('pendingLoadRaw', 'Load without detecting')}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <label className={labelCls} htmlFor="codecard-input">
                          {t.labelCodeInput}
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-300 hover:text-white cursor-pointer"
                          >
                            <FileUp className="w-3.5 h-3.5" />
                            {tr('dropBrowse', 'Open a file')}
                          </button>
                          <button
                            onClick={startBlank}
                            className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-white cursor-pointer"
                          >
                            <PencilLine className="w-3.5 h-3.5" />
                            {tr('startBlank', 'Start blank')}
                          </button>
                        </div>
                      </div>

                      <div
                        onDragOver={event => {
                          event.preventDefault();
                          setDragOver(true);
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={event => {
                          event.preventDefault();
                          setDragOver(false);
                          const file = event.dataTransfer.files?.[0];
                          if (file) receiveFile(file);
                        }}
                        className={`relative rounded-xl transition-colors ${dragOver ? 'ring-2 ring-indigo-500' : ''}`}
                      >
                        <textarea
                          id="codecard-input"
                          ref={textareaRef}
                          rows={12}
                          value={code}
                          spellCheck={false}
                          onChange={event => updateCode(event.target.value)}
                          onKeyDown={onTextareaKeyDown}
                          style={{ tabSize: settings.tabSize }}
                          className="w-full bg-[#060408] border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-slate-200 outline-none focus:border-indigo-500 resize-y leading-relaxed"
                        />
                        {dragOver && (
                          <div className="absolute inset-0 rounded-xl bg-indigo-950/80 flex items-center justify-center pointer-events-none text-xs font-black text-indigo-200 uppercase tracking-widest">
                            {tr('dropTitle', 'Drop the file here')}
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {lines.length} {tr('pendingLines', 'lines')} · {tr('dropHint', 'Drop a source file here, or paste the code.')}
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={event => {
                          const file = event.target.files?.[0];
                          if (file) receiveFile(file);
                          event.target.value = '';
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className={labelCls}>{t.labelLanguage}</label>
                        <select
                          value={settings.language}
                          onChange={event => update({ language: event.target.value })}
                          className={fieldCls}
                        >
                          {LANGUAGE_GROUPS.map(group => (
                            <optgroup key={group.key} label={tr(group.key, group.key)}>
                              {group.ids.map(id => (
                                <option key={id} value={id}>
                                  {getLanguage(id)?.label || id}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className={labelCls}>{t.labelTheme}</label>
                        <select
                          value={settings.theme}
                          onChange={event => update({ theme: event.target.value })}
                          className={fieldCls}
                        >
                          {THEMES.map(item => (
                            <option key={item.id} value={item.id}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className={labelCls}>{t.labelFileName}</label>
                        <input
                          type="text"
                          value={settings.fileName}
                          onChange={event => update({ fileName: event.target.value })}
                          className={fieldCls}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className={labelCls}>{tr('labelStartLine', 'First line number')}</label>
                        <input
                          type="number"
                          min={0}
                          max={99999}
                          value={settings.startLine}
                          onChange={event => update({ startLine: Math.max(0, Number(event.target.value) || 0) })}
                          className={fieldCls}
                        />
                      </div>
                    </div>

                    {/* Resaltado de líneas */}
                    <div className="space-y-2 border-t border-white/5 pt-4">
                      <div className="flex items-center justify-between gap-2">
                        <label className={labelCls}>{tr('labelHighlightLines', 'Highlighted lines')}</label>
                        {settings.highlightedLines.length > 0 && (
                          <button
                            onClick={() => setHighlights(new Set())}
                            className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white cursor-pointer"
                          >
                            {tr('clearHighlights', 'Clear')}
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={highlightText}
                        onChange={event => onHighlightTextChange(event.target.value)}
                        placeholder={tr('highlightPlaceholder', 'e.g. 3, 7-9, 12')}
                        className={fieldCls}
                      />
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                        {tr('highlightHint', 'Or click the line numbers in the preview. Shift+click for a range, Alt+click inverts, right-click clears.')}
                      </p>
                      <label className="flex items-center justify-between gap-3 pt-1 cursor-pointer">
                        <span className="text-[11px] font-bold text-slate-400">{tr('labelDimOthers', 'Dim the other lines')}</span>
                        <input
                          type="checkbox"
                          checked={settings.dimOthers}
                          onChange={event => update({ dimOthers: event.target.checked })}
                          className="accent-indigo-500 w-4 h-4 cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* ---------------- TAB: ESTILO ---------------- */}
                {activeTab === 'style' && (
                  <div className="space-y-5">
                    <div className="space-y-2.5">
                      <label className={labelCls}>{tr('labelBgMode', 'Background')}</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'gradient', label: tr('bgModeGradient', 'Gradient') },
                          { id: 'solid', label: tr('bgModeSolid', 'Solid') },
                          { id: 'none', label: tr('bgModeNone', 'None') },
                        ].map(mode => (
                          <button
                            key={mode.id}
                            onClick={() => update({ background: { ...settings.background, mode: mode.id as any } })}
                            className={chipCls(settings.background.mode === mode.id)}
                          >
                            {mode.label}
                          </button>
                        ))}
                      </div>

                      {settings.background.mode === 'gradient' && (
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          {GRADIENTS.map(gradient => {
                            const selected = settings.background.gradient === gradient.id;
                            return (
                              <button
                                key={gradient.id}
                                onClick={() => update({ background: { ...settings.background, gradient: gradient.id } })}
                                style={{ background: gradient.css }}
                                title={tr(`gradient${gradient.id.charAt(0).toUpperCase()}${gradient.id.slice(1)}`, gradient.id)}
                                aria-label={tr(`gradient${gradient.id.charAt(0).toUpperCase()}${gradient.id.slice(1)}`, gradient.id)}
                                className={`h-10 rounded-xl cursor-pointer transition-all border-2 outline-none ${
                                  selected ? 'border-white scale-105' : 'border-transparent opacity-80 hover:opacity-100'
                                }`}
                              />
                            );
                          })}
                        </div>
                      )}

                      {settings.background.mode === 'solid' && (
                        <div className="flex items-center gap-3 pt-1">
                          <input
                            type="color"
                            value={settings.background.color}
                            onChange={event => update({ background: { ...settings.background, color: event.target.value } })}
                            className="w-12 h-10 rounded-lg bg-transparent border border-white/10 cursor-pointer"
                            aria-label={tr('labelBgColor', 'Background colour')}
                          />
                          <input
                            type="text"
                            value={settings.background.color}
                            onChange={event => update({ background: { ...settings.background, color: event.target.value } })}
                            className={fieldCls}
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className={labelCls}>{tr('labelFontFamily', 'Font')}</label>
                        <select
                          value={settings.fontFamily}
                          onChange={event => update({ fontFamily: event.target.value as CardSettings['fontFamily'] })}
                          className={fieldCls}
                        >
                          <option value="jetbrains-mono">{t.fontJetBrains}</option>
                          <option value="fira-code">{t.fontFiraCode}</option>
                          <option value="source-code-pro">{t.fontSourceCode}</option>
                          <option value="ibm-plex-mono">{tr('fontIbmPlex', 'IBM Plex Mono')}</option>
                          <option value="system">{tr('fontSystem', 'System monospace')}</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className={labelCls}>{t.labelFontSize}</label>
                        <input
                          type="number"
                          min={10}
                          max={32}
                          value={settings.fontSize}
                          onChange={event => update({ fontSize: Math.min(32, Math.max(10, Number(event.target.value) || 14)) })}
                          className={fieldCls}
                        />
                      </div>
                    </div>

                    {[
                      { key: 'padding' as const, label: t.labelPadding, min: 0, max: 128, step: 4, unit: 'px' },
                      { key: 'borderRadius' as const, label: t.labelBorderRadius, min: 0, max: 40, step: 2, unit: 'px' },
                      { key: 'lineHeight' as const, label: tr('labelLineHeight', 'Line height'), min: 1.1, max: 2.4, step: 0.1, unit: '' },
                    ].map(slider => (
                      <div key={slider.key} className="space-y-2">
                        <div className="flex justify-between text-xs font-black text-slate-500 uppercase tracking-widest">
                          <span>{slider.label}</span>
                          <span className="text-indigo-400">
                            {settings[slider.key]}
                            {slider.unit}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={slider.min}
                          max={slider.max}
                          step={slider.step}
                          value={settings[slider.key] as number}
                          onChange={event => update({ [slider.key]: Number(event.target.value) } as Partial<CardSettings>)}
                          className="w-full h-1 bg-white/10 rounded outline-none accent-indigo-500 cursor-pointer"
                        />
                      </div>
                    ))}

                    <div className="space-y-2">
                      <label className={labelCls}>{t.labelShadow}</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: 'soft', label: t.shadowSoft },
                          { id: 'heavy', label: t.shadowHeavy },
                          { id: 'neon', label: t.shadowNeon },
                          { id: 'none', label: t.shadowNone },
                        ].map(shadow => (
                          <button
                            key={shadow.id}
                            onClick={() => update({ shadow: shadow.id as CardSettings['shadow'] })}
                            className={chipCls(settings.shadow === shadow.id)}
                          >
                            {shadow.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className={labelCls}>{tr('labelAspect', 'Aspect ratio')}</label>
                      <div className="grid grid-cols-5 gap-2">
                        {ASPECTS.map(aspect => (
                          <button
                            key={aspect.id}
                            onClick={() => update({ aspect: aspect.id })}
                            className={chipCls(settings.aspect === aspect.id)}
                          >
                            {tr(`aspect${aspect.id.charAt(0).toUpperCase()}${aspect.id.slice(1)}`, aspect.id)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ---------------- TAB: VENTANA ---------------- */}
                {activeTab === 'window' && (
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <label className={labelCls}>{t.labelWindowStyle}</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: 'mac', label: t.windowMac, desc: tr('windowMacDesc', 'Three traffic-light dots') },
                          { id: 'windows', label: t.windowWindows, desc: tr('windowWindowsDesc', 'Minimise, maximise, close') },
                          { id: 'simple', label: t.windowSimple, desc: tr('windowSimpleDesc', 'A single accent marker') },
                          { id: 'none', label: t.windowNone, desc: tr('windowNoneDesc', 'No title bar at all') },
                        ].map(item => (
                          <button
                            key={item.id}
                            onClick={() => update({ windowStyle: item.id as CardSettings['windowStyle'] })}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer outline-none flex flex-col gap-1 ${
                              settings.windowStyle === item.id
                                ? 'bg-indigo-950/40 border-indigo-500/50'
                                : 'bg-[#060408] border-white/5 hover:bg-white/5'
                            }`}
                          >
                            <span className="text-[11px] font-bold text-white leading-tight">{item.label}</span>
                            <span className="text-[9px] text-slate-500 font-medium leading-tight">{item.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 border-t border-white/5 pt-4">
                      {[
                        { key: 'showLineNumbers' as const, label: t.labelShowLineNumbers, hint: '' },
                        { key: 'wordWrap' as const, label: tr('labelWordWrap', 'Wrap long lines'), hint: tr('wordWrapHint', 'Off means the card grows as wide as the longest line.') },
                        { key: 'fontLigatures' as const, label: tr('labelLigatures', 'Font ligatures'), hint: tr('ligaturesHint', 'Turns => and !== into single glyphs.') },
                        { key: 'showWatermark' as const, label: t.labelShowWatermark, hint: tr('watermarkHint', 'Off by default. Nothing is stamped on your image unless you ask.') },
                      ].map(toggle => (
                        <label key={toggle.key} className="flex items-start justify-between gap-3 cursor-pointer">
                          <span className="min-w-0">
                            <span className="block text-[11px] font-bold text-slate-300">{toggle.label}</span>
                            {toggle.hint && <span className="block text-[9px] text-slate-500 font-medium">{toggle.hint}</span>}
                          </span>
                          <input
                            type="checkbox"
                            checked={settings[toggle.key] as boolean}
                            onChange={event => update({ [toggle.key]: event.target.checked } as Partial<CardSettings>)}
                            className="accent-indigo-500 w-4 h-4 shrink-0 mt-0.5 cursor-pointer"
                          />
                        </label>
                      ))}
                    </div>

                    {settings.wordWrap && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-black text-slate-500 uppercase tracking-widest">
                          <span>{tr('labelCardWidth', 'Card width')}</span>
                          <span className="text-indigo-400">{settings.cardWidth}px</span>
                        </div>
                        <input
                          type="range"
                          min={320}
                          max={1200}
                          step={20}
                          value={settings.cardWidth}
                          onChange={event => update({ cardWidth: Number(event.target.value) })}
                          className="w-full h-1 bg-white/10 rounded outline-none accent-indigo-500 cursor-pointer"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className={labelCls}>{tr('labelTabSize', 'Tab size')}</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[2, 4, 6, 8].map(size => (
                          <button key={size} onClick={() => update({ tabSize: size })} className={chipCls(settings.tabSize === size)}>
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ---------------- TAB: EXPORTAR ---------------- */}
                {activeTab === 'export' && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className={labelCls}>{tr('labelFormat', 'Format')}</label>
                      <div className="grid grid-cols-4 gap-2">
                        {(['png', 'jpeg', 'webp', 'svg'] as ExportFormat[]).map(format => (
                          <button
                            key={format}
                            onClick={() => setExportSettings(prev => ({ ...prev, format }))}
                            className={chipCls(exportSettings.format === format)}
                          >
                            {format.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className={labelCls}>{t.labelExportScale}</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4].map(scale => (
                          <button
                            key={scale}
                            onClick={() => setExportSettings(prev => ({ ...prev, scale }))}
                            className={chipCls(exportSettings.scale === scale)}
                            disabled={exportSettings.format === 'svg'}
                          >
                            {scale}x
                          </button>
                        ))}
                      </div>
                    </div>

                    {(exportSettings.format === 'jpeg' || exportSettings.format === 'webp') && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-black text-slate-500 uppercase tracking-widest">
                          <span>{tr('labelQuality', 'Quality')}</span>
                          <span className="text-indigo-400">{Math.round(exportSettings.quality * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min={0.5}
                          max={1}
                          step={0.02}
                          value={exportSettings.quality}
                          onChange={event => setExportSettings(prev => ({ ...prev, quality: Number(event.target.value) }))}
                          className="w-full h-1 bg-white/10 rounded outline-none accent-indigo-500 cursor-pointer"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-white/5 pt-4">
                      <button
                        onClick={doDownload}
                        disabled={status === 'exporting'}
                        className="py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:cursor-wait"
                      >
                        {status === 'exporting' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        <span>{tr('btnDownload', 'Download')}</span>
                      </button>
                      <button
                        onClick={doCopy}
                        disabled={status === 'exporting'}
                        className="py-3.5 border border-white/10 hover:border-indigo-500/40 hover:bg-white/5 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                      >
                        {status === 'copied' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        <span>{status === 'copied' ? tr('copyOk', 'Copied') : tr('btnCopy', 'Copy image')}</span>
                      </button>
                    </div>

                    {/* Presets */}
                    <div className="space-y-2 border-t border-white/5 pt-4">
                      <div className="flex items-center justify-between gap-2">
                        <label className={labelCls}>{tr('presetsTitle', 'Saved looks')}</label>
                        <button
                          onClick={savePreset}
                          className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-300 hover:text-white cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {tr('presetSave', 'Save current')}
                        </button>
                      </div>
                      {presets.length === 0 ? (
                        <p className="text-[10px] text-slate-500 font-medium">{tr('presetEmpty', 'Nothing saved yet. Presets stay in this browser.')}</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {presets.map(preset => (
                            <span
                              key={preset.name}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#060408] pl-3 pr-1.5 py-1.5"
                            >
                              <button
                                onClick={() => applyPreset(preset)}
                                className="text-[10px] font-bold text-slate-300 hover:text-white cursor-pointer"
                              >
                                {preset.name}
                              </button>
                              <button
                                onClick={() => deletePreset(preset.name)}
                                className="p-0.5 text-slate-500 hover:text-red-400 cursor-pointer"
                                aria-label={tr('presetDelete', 'Delete preset')}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Vista previa */}
            <div className="lg:col-span-7 space-y-4">
              <div className="glass-card rounded-3xl p-4 md:p-6 space-y-4">
                {/* Barra de herramientas — flex-wrap para que no se salga */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    {tr('previewTitle', 'Live preview')}
                  </h2>
                  <div className="flex items-center gap-1 flex-wrap">
                    <button
                      onClick={() => travel(-1)}
                      disabled={!canUndo(history)}
                      title={tr('undo', 'Undo') + ' (Ctrl+Z)'}
                      aria-label={tr('undo', 'Undo')}
                      className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => travel(1)}
                      disabled={!canRedo(history)}
                      title={tr('redo', 'Redo') + ' (Ctrl+Shift+Z)'}
                      aria-label={tr('redo', 'Redo')}
                      className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Redo2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-px h-5 bg-white/10 mx-1" />
                    <button
                      onClick={() => changeZoom(zoom / 1.15)}
                      title={tr('zoomOut', 'Zoom out')}
                      aria-label={tr('zoomOut', 'Zoom out')}
                      className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-black text-slate-400 tabular-nums w-10 text-center">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      onClick={() => changeZoom(zoom * 1.15)}
                      title={tr('zoomIn', 'Zoom in')}
                      aria-label={tr('zoomIn', 'Zoom in')}
                      className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={resetView}
                      title={tr('zoomFit', 'Reset view') + ' (Ctrl+0)'}
                      aria-label={tr('zoomFit', 'Reset view')}
                      className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                    >
                      <Maximize className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-px h-5 bg-white/10 mx-1" />
                    <button
                      onMouseDown={() => setShowPlain(true)}
                      onMouseUp={() => setShowPlain(false)}
                      onMouseLeave={() => setShowPlain(false)}
                      onTouchStart={() => setShowPlain(true)}
                      onTouchEnd={() => setShowPlain(false)}
                      title={tr('compareHold', 'Hold to see the raw code')}
                      aria-label={tr('compareHold', 'Hold to see the raw code')}
                      className={`p-2 rounded-lg border transition-all cursor-pointer ${
                        showPlain
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={resetAll}
                      title={t.resetBtn}
                      aria-label={t.resetBtn}
                      className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <CardCanvas
                  settings={settings}
                  lines={lines}
                  cardRef={cardRef}
                  zoom={zoom}
                  onZoomChange={changeZoom}
                  pan={pan}
                  onPanChange={setPan}
                  onLineClick={onLineClick}
                  onClearHighlights={() => setHighlights(new Set())}
                  altHeld={altHeld}
                  showPlain={showPlain}
                  fitToken={fitToken}
                />

                <div className="flex items-center justify-between gap-3 flex-wrap text-[10px] font-bold">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Sliders className="w-3 h-3 text-indigo-500/70" />
                    {tr('privacyNote', 'Highlighted in your browser. Your code never leaves this device.')}
                  </span>
                  {status === 'loading-grammar' && (
                    <span className="text-indigo-300 flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {tr('statusGrammar', 'Loading the grammar…')}
                    </span>
                  )}
                  {status === 'exporting' && (
                    <span className="text-indigo-300 flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {tr('statusExporting', 'Rendering the image…')}
                    </span>
                  )}
                  {status === 'error' && <span className="text-red-400">{statusDetail || t.statusError}</span>}
                  {status !== 'error' && status !== 'exporting' && statusDetail && (
                    <span className="text-emerald-400">
                      {t.statusDone} · {statusDetail}
                    </span>
                  )}
                </div>
              </div>

              <NextStepBar lang={lang} t={t} getResult={getResultForHandoff} />
            </div>
          </div>

          <AdBanner id="adsense-codecard-mid" />

          {/* ---------------------------------------------------------------- */}
          {/* Cómo funciona                                                    */}
          {/* ---------------------------------------------------------------- */}
          <section className="space-y-8">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight text-center">
              {tr('howTitle', 'How it works')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {steps.map((step, index) => {
                const Art = step.art;
                return (
                  <div key={index} className="glass-card rounded-3xl p-6 space-y-4 text-left">
                    <Art className="w-full max-w-[180px] h-auto" />
                    <div className="flex items-baseline gap-2">
                      <span className="text-indigo-400 font-black text-sm">{index + 1}</span>
                      <h3 className="text-base font-bold text-white tracking-tight">{step.title}</h3>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">{step.text}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* Características                                                   */}
          {/* ---------------------------------------------------------------- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuresList.map((feature: any, index: number) => {
              const Icon = featureIcons[index % featureIcons.length];
              return (
                <div
                  key={index}
                  className="glass-card p-7 rounded-3xl text-left hover:-translate-y-1 transition-all duration-300 border border-white/5"
                >
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5 p-2.5">
                    <Icon className="w-full h-full" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 tracking-tight">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.text}</p>
                </div>
              );
            })}
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* FAQ en <details>                                                  */}
          {/* ---------------------------------------------------------------- */}
          {faqs.length > 0 && (
            <section className="space-y-4 max-w-4xl mx-auto w-full text-left">
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight pb-2">{t.faqTitle}</h2>
              {faqs.map((item: any, index: number) => (
                <details key={index} className="glass-card rounded-2xl px-6 py-4 group">
                  <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-base font-bold text-white">
                    <span>{item.question}</span>
                    <span className="text-indigo-400 shrink-0 transition-transform group-open:rotate-45 text-xl leading-none">
                      +
                    </span>
                  </summary>
                  <p className="text-slate-400 text-sm leading-relaxed pt-3">{item.answer}</p>
                </details>
              ))}
            </section>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* SEO                                                              */}
          {/* ---------------------------------------------------------------- */}
          <div className="border-t border-white/5 pt-12 text-left max-w-4xl mx-auto space-y-10">
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-white tracking-tight">{t.seoHeroTitle}</h2>
              <p className="text-slate-400 text-sm leading-relaxed">{t.seoHeroText}</p>
              <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 list-none p-0">
                {Array.isArray(t.seoHeroList) &&
                  t.seoHeroList.map((item: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-xs font-bold text-indigo-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white tracking-tight">{t.seoBrowserSpeedTitle}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{t.seoBrowserSpeedText}</p>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white tracking-tight">{t.seoUseCaseTitle}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{t.seoUseCaseText}</p>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white tracking-tight">{t.seoPrivacyTitle}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{t.seoPrivacyText}</p>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white tracking-tight">{tr('seoEngineTitle', 'Built on the Prism token stream')}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{tr('seoEngineText', '')}</p>
              </div>
            </div>

            {keywords.length > 0 && (
              <div className="border-t border-white/5 pt-8 space-y-3">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">{t.seoKeywordsTitle}</h3>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword: string, index: number) => (
                    <span
                      key={index}
                      className="text-[10px] font-bold bg-[#0a0812] text-indigo-400 px-3 py-1.5 rounded-full border border-indigo-900/30"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <AdBanner id="adsense-codecard-bottom" />
      </main>

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={tr('backToTop', 'Back to top')}
          className="fixed bottom-8 right-8 z-[200] w-12 h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default Codecard;
