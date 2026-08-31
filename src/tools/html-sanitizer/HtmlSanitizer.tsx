import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AdBanner } from '../../components/shared/AdBanner';
import { LegalModal } from './components/LegalModal';
import { PolicyEditor } from './components/PolicyEditor';
import { RemovalReport } from './components/RemovalReport';
import { NextStepBar } from './components/NextStepBar';
import {
  SanitizerHeroArt,
  StepPaste,
  StepPolicy,
  StepClean,
  StepReview,
  IconPolicy,
  IconReport,
  IconUndo,
  IconScheme,
  IconPreview,
  IconLocalOnly,
  IconFormat,
  IconHandoff,
} from './components/Illustrations';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Copy,
  Download,
  Eye,
  FileCode,
  FileUp,
  Play,
  Redo2,
  RotateCcw,
  ShieldCheck,
  Sliders,
  Trash2,
  Undo2,
} from 'lucide-react';
import { legalTranslations } from '../../locales/legal';
import { useHandoffIntake } from '../../lib/useHandoff';
import { sanitize } from './lib/sanitize';
import { matchPreset, presetPolicy } from './lib/presets';
import { SAMPLE_ATTACK, SAMPLE_MESSY } from './lib/samples';
import { ensurePrism, tokenize, TOKEN_CLASS, HIGHLIGHT_LIMIT } from './lib/highlight';
import type { OutputFormat, Policy, PresetId, SanitizeResult } from './types';

interface HtmlSanitizerProps {
  lang: string;
  dictionary: any;
}

/** Undo/redo stores the policy, never the output — a few hundred bytes a step. */
interface Snapshot {
  policy: Policy;
  overrides: string[];
}

const PRESET_ORDER: PresetId[] = ['strict', 'email', 'content', 'text'];

const PRESET_FALLBACK: Record<PresetId, { label: string; hint: string }> = {
  strict: { label: 'Strict', hint: 'Text and links only. For anything you will store.' },
  email: { label: 'Email-safe', hint: 'Tables and inline style survive; scripting does not.' },
  content: { label: 'Rich content', hint: 'A CMS body: media, tables, data-* and aria-*.' },
  text: { label: 'Plain text', hint: 'Drop all markup, keep the reading order.' },
  custom: { label: 'Custom', hint: 'Your own tag and attribute lists.' },
};

const FORMATS: { id: OutputFormat; labelKey: string; fallback: string }[] = [
  { id: 'pretty', labelKey: 'format_pretty', fallback: 'Pretty' },
  { id: 'minified', labelKey: 'format_min', fallback: 'Minified' },
  { id: 'raw', labelKey: 'format_raw', fallback: 'As parsed' },
];

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return reduced;
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function HtmlSanitizer({ lang, dictionary }: HtmlSanitizerProps) {
  const t = dictionary || {};
  const prefersReduced = usePrefersReducedMotion();

  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [input, setInput] = useState('');
  const [sourceName, setSourceName] = useState<string | null>(null);
  const [policy, setPolicy] = useState<Policy>(() => presetPolicy('content'));
  const [overrides, setOverrides] = useState<Set<string>>(() => new Set());
  const [format, setFormat] = useState<OutputFormat>('pretty');
  const [result, setResult] = useState<SanitizeResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [stale, setStale] = useState(false);
  const [view, setView] = useState<'source' | 'preview' | 'report'>('source');
  const [policyOpen, setPolicyOpen] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [prismReady, setPrismReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [history, setHistory] = useState<Snapshot[]>([]);
  const [historyAt, setHistoryAt] = useState(-1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const presetId = useMemo(() => matchPreset(policy), [policy]);
  const textOnly = presetId === 'text';

  // -------------------------------------------------------------------------
  // Intake. Note what does NOT happen here: sanitising. A file landing in the
  // textarea only marks the workspace ready; the user presses the button.
  // -------------------------------------------------------------------------

  const acceptFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setInput(typeof reader.result === 'string' ? reader.result : '');
      setSourceName(file.name);
      setResult(null);
      setStale(false);
      setOverrides(new Set());
    };
    reader.readAsText(file);
  }, []);

  useHandoffIntake(acceptFile);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragging(false);
      const file = event.dataTransfer.files?.[0];
      if (file) acceptFile(file);
    },
    [acceptFile]
  );

  // -------------------------------------------------------------------------
  // The expensive part, behind an explicit press.
  // -------------------------------------------------------------------------

  const run = useCallback(
    (nextOverrides?: Set<string>) => {
      if (!input.trim()) return;
      setBusy(true);
      // One frame of breathing room so the button can paint its busy state
      // before a multi-megabyte parse blocks the thread.
      setTimeout(() => {
        const outcome = sanitize({
          html: input,
          policy,
          format,
          overrides: nextOverrides ?? overrides,
          textOnly,
        });
        setResult(outcome);
        setStale(false);
        setBusy(false);
        if (outcome.removals.length > 0 && view === 'source') setView('source');
      }, 0);
    },
    [input, policy, format, overrides, textOnly, view]
  );

  /** Policy edits mark the result stale instead of silently re-running. */
  const changePolicy = useCallback(
    (next: Policy) => {
      setHistory(prev => [
        ...prev.slice(0, historyAt + 1),
        { policy, overrides: [...overrides] },
      ]);
      setHistoryAt(at => at + 1);
      setPolicy(next);
      if (result) setStale(true);
    },
    [policy, overrides, historyAt, result]
  );

  const applyPreset = useCallback(
    (id: PresetId) => {
      changePolicy(presetPolicy(id));
      setOverrides(new Set());
    },
    [changePolicy]
  );

  /** Overruling one decision is a click, so it re-runs immediately. */
  const toggleOverride = useCallback(
    (id: string) => {
      const next = new Set(overrides);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setHistory(prev => [...prev.slice(0, historyAt + 1), { policy, overrides: [...overrides] }]);
      setHistoryAt(at => at + 1);
      setOverrides(next);
      run(next);
    },
    [overrides, policy, historyAt, run]
  );

  const restore = useCallback(
    (snapshot: Snapshot) => {
      setPolicy(snapshot.policy);
      setOverrides(new Set(snapshot.overrides));
      if (result) setStale(true);
    },
    [result]
  );

  const undo = useCallback(() => {
    if (historyAt < 0) return;
    const snapshot = history[historyAt];
    setHistory(prev => {
      const copy = [...prev];
      copy[historyAt] = { policy, overrides: [...overrides] };
      return copy;
    });
    setHistoryAt(at => at - 1);
    restore(snapshot);
  }, [history, historyAt, policy, overrides, restore]);

  const redo = useCallback(() => {
    if (historyAt >= history.length - 1) return;
    const snapshot = history[historyAt + 1];
    setHistory(prev => {
      const copy = [...prev];
      copy[historyAt + 1] = { policy, overrides: [...overrides] };
      return copy;
    });
    setHistoryAt(at => at + 1);
    restore(snapshot);
  }, [history, historyAt, policy, overrides, restore]);

  // Re-serialising is cheap and does not need a new sanitise pass, but the
  // fragment is not kept around, so the format switch re-runs when there is
  // already a result to keep in sync.
  const changeFormat = useCallback(
    (next: OutputFormat) => {
      setFormat(next);
      if (result && input.trim()) {
        setResult(sanitize({ html: input, policy, format: next, overrides, textOnly }));
      }
    },
    [result, input, policy, overrides, textOnly]
  );

  const output = result?.html ?? '';

  // -------------------------------------------------------------------------

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast(t.copy_failed || 'Your browser blocked clipboard access.');
    }
  }, [output, showToast, t.copy_failed]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const extension = textOnly ? 'txt' : 'html';
    const blob = new Blob([output], { type: textOnly ? 'text/plain' : 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const base = sourceName ? sourceName.replace(/\.[^.]+$/, '') : 'sanitized';
    link.download = `${base}-clean.${extension}`;
    link.click();
    // Revoking on the next task would race the download in Firefox; a frame is
    // enough for the click to have been consumed.
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, [output, sourceName, textOnly]);

  const getResult = useCallback(async () => {
    if (!output) return null;
    const extension = textOnly ? 'txt' : 'html';
    const base = sourceName ? sourceName.replace(/\.[^.]+$/, '') : 'sanitized';
    return {
      blob: new Blob([output], { type: textOnly ? 'text/plain' : 'text/html' }),
      name: `${base}-clean.${extension}`,
    };
  }, [output, sourceName, textOnly]);

  const resetWorkspace = useCallback(() => {
    setInput('');
    setSourceName(null);
    setResult(null);
    setPolicy(presetPolicy('content'));
    setOverrides(new Set());
    setStale(false);
    setHistory([]);
    setHistoryAt(-1);
    setCopied(false);
    setView('source');
  }, []);

  const loadSample = useCallback((sample: string) => {
    setInput(sample);
    setSourceName(null);
    setResult(null);
    setStale(false);
    setOverrides(new Set());
  }, []);

  // -------------------------------------------------------------------------
  // Keyboard
  // -------------------------------------------------------------------------

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const mod = event.ctrlKey || event.metaKey;
      if (!mod) return;
      const key = event.key.toLowerCase();
      if (key === 'enter') {
        event.preventDefault();
        run();
      } else if (key === 'z' && !event.shiftKey) {
        // Inside the textarea the browser's own undo is the right behaviour.
        if ((event.target as HTMLElement)?.tagName === 'TEXTAREA') return;
        event.preventDefault();
        undo();
      } else if ((key === 'z' && event.shiftKey) || key === 'y') {
        if ((event.target as HTMLElement)?.tagName === 'TEXTAREA') return;
        event.preventDefault();
        redo();
      } else if (key === 'b') {
        event.preventDefault();
        void handleCopy();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [run, undo, redo, handleCopy]);

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    []
  );

  // Hold to compare: releasing anywhere must restore the cleaned view, even if
  // the pointer left the pane first.
  useEffect(() => {
    if (!comparing) return;
    const release = () => setComparing(false);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    return () => {
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
    };
  }, [comparing]);

  useEffect(() => {
    if (!output || output.length > HIGHLIGHT_LIMIT) return;
    let alive = true;
    ensurePrism().then(ready => {
      if (alive && ready) setPrismReady(true);
    });
    return () => {
      alive = false;
    };
  }, [output]);

  // -------------------------------------------------------------------------
  // Derived display values
  // -------------------------------------------------------------------------

  const shownCode = comparing ? input : output;

  const highlighted = useMemo(() => {
    if (!shownCode) return null;
    if (!prismReady || shownCode.length > HIGHLIGHT_LIMIT) {
      return <span className="text-slate-300">{shownCode}</span>;
    }
    return tokenize(shownCode).map((span, index) => (
      <span key={index} className={TOKEN_CLASS[span.type] || 'text-slate-300'}>
        {span.text}
      </span>
    ));
  }, [shownCode, prismReady]);

  const previewDoc = useMemo(() => {
    if (!output || textOnly) return '';
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><style>body{font-family:-apple-system,system-ui,sans-serif;color:#0f172a;background:#fff;padding:16px;margin:0;line-height:1.6;font-size:14px}img{max-width:100%;height:auto}a{color:#0891b2;text-decoration:underline}table{border-collapse:collapse;max-width:100%}td,th{border:1px solid #e2e8f0;padding:6px 10px}pre{background:#f1f5f9;padding:12px;border-radius:8px;overflow:auto}code{background:#f1f5f9;padding:2px 5px;border-radius:4px;font-family:monospace}pre code{background:transparent;padding:0}blockquote{border-left:3px solid #0891b2;margin:0;padding-left:12px;color:#475569}h1,h2,h3,h4,h5,h6{margin:0.6em 0 0.3em;line-height:1.25}</style></head><body>${output}</body></html>`;
  }, [output, textOnly]);

  const inputBytes = useMemo(() => (input ? new TextEncoder().encode(input).length : 0), [input]);
  const removedCount = result ? result.removals.reduce((n, r) => n + r.count, 0) : 0;
  const dangerousCount = result
    ? result.removals.filter(r => r.dangerous).reduce((n, r) => n + r.count, 0)
    : 0;
  const delta = result ? result.bytesOut - result.bytesIn : 0;

  const steps = useMemo(
    () => [
      { art: StepPaste, title: t.step1Title, text: t.step1Text },
      { art: StepPolicy, title: t.step2Title, text: t.step2Text },
      { art: StepClean, title: t.step3Title, text: t.step3Text },
      { art: StepReview, title: t.step4Title, text: t.step4Text },
    ],
    [t]
  );

  const featureIcons = [IconPolicy, IconReport, IconUndo, IconScheme, IconPreview, IconFormat, IconHandoff, IconLocalOnly];
  const features: any[] = Array.isArray(t.features) ? t.features : [];
  const faqs: any[] = Array.isArray(t.faq) ? t.faq : [];
  const keywords: string[] = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];

  const canRun = input.trim().length > 0 && !busy;

  return (
    <div className="min-h-screen flex flex-col bg-[#04080a] text-slate-200 font-sans relative">
      <Header
        currentLang={lang}
        onLanguageChange={l => (window.location.href = `/${l.toLowerCase()}/html-sanitizer`)}
        onReset={resetWorkspace}
        t={t}
      />

      {/* The max width lives on <main> on purpose: AdRail measures this element
          to decide whether the fixed side rails fit. The previous max-w-7xl left
          a 57px gap at 1400px against the 168px the rails need, so they never
          rendered — and AdRail fails silently when that happens. */}
      <main className="flex-1 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))] px-4 md:px-8 pt-32 md:pt-36 pb-20">
        <AdBanner id="adsense-html-sanitizer-top" />

        <div className="w-full space-y-20 md:space-y-28">
          {/* ============================================================== */}
          {/* Hero                                                           */}
          {/* ============================================================== */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center pt-2">
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex max-w-full items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/40 border border-cyan-800/30 text-cyan-400 text-[11px] font-black tracking-[0.2em] uppercase shadow-[0_0_25px_rgba(6,182,212,0.15)]">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.badge || t.title}</span>
              </div>

              <h1 className="text-4xl md:text-6xl xl:text-7xl font-black tracking-tight leading-[0.95] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-400">
                {t.seoHeroTitle || 'HTML Cleaner & Sanitizer'}
              </h1>

              <p className="text-slate-400 text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
                {t.description || t.seoHeroText}
              </p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                {(t.heroPoints || []).slice(0, 3).map((point: string, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-300"
                  >
                    <Check className="w-3.5 h-3.5 text-cyan-400 stroke-[3]" />
                    {point}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/10 blur-[80px] rounded-full" />
              <SanitizerHeroArt
                className="relative w-full max-w-lg mx-auto drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
                animated={!prefersReduced}
              />
            </div>
          </section>

          {/* ============================================================== */}
          {/* Workspace                                                      */}
          {/* ============================================================== */}
          <section className="space-y-5">
            {/* ---- input ---- */}
            <div
              onDragOver={e => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`glass-card rounded-3xl overflow-hidden shadow-2xl transition-colors ${
                dragging ? 'border-cyan-500/50 bg-cyan-500/[0.06]' : ''
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-5 py-3 border-b border-white/5 bg-cyan-950/30">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2 min-w-0">
                  <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{sourceName || t.label_input || 'Raw HTML input'}</span>
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] text-slate-600 font-mono">{formatBytes(inputBytes)}</span>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-cyan-300 hover:border-cyan-500/30 transition-all cursor-pointer outline-none"
                  >
                    <FileUp className="w-3 h-3" />
                    {t.button_open_file || 'Open file'}
                  </button>
                  {input && (
                    <button
                      onClick={() => {
                        setInput('');
                        setSourceName(null);
                        setResult(null);
                      }}
                      title={t.button_clear || 'Clear'}
                      className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 border border-white/5 text-slate-400 hover:bg-rose-500/20 hover:border-rose-500/30 hover:text-rose-400 transition-all cursor-pointer outline-none"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <textarea
                value={input}
                onChange={e => {
                  setInput(e.target.value);
                  if (result) setStale(true);
                }}
                placeholder={
                  t.placeholder_input ||
                  'Paste HTML here, drop a .html file, or load one of the samples below. Nothing runs until you press Sanitize.'
                }
                className="w-full h-56 md:h-64 p-4 md:p-5 bg-transparent text-slate-200 placeholder-slate-600 font-mono text-[13px] leading-relaxed focus:outline-none resize-y scrollbar-thin"
                spellCheck={false}
              />

              <input
                ref={fileInputRef}
                type="file"
                accept=".html,.htm,.xhtml,.txt,.xml,.svg,text/html,text/plain"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) acceptFile(file);
                  e.target.value = '';
                }}
              />

              <div className="flex flex-wrap items-center gap-2 px-4 md:px-5 py-3 border-t border-white/5 bg-black/20">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                  {t.samples_title || 'Try it'}
                </span>
                <button
                  onClick={() => loadSample(SAMPLE_MESSY)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-bold text-slate-300 hover:text-cyan-300 hover:border-cyan-500/30 transition-all cursor-pointer outline-none"
                >
                  {t.sample_messy || 'Messy CMS paste'}
                </button>
                <button
                  onClick={() => loadSample(SAMPLE_ATTACK)}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-[11px] font-bold text-rose-200 hover:bg-rose-500/20 transition-all cursor-pointer outline-none"
                >
                  {t.sample_attack || 'Known XSS payloads'}
                </button>
              </div>
            </div>

            {/* ---- policy ---- */}
            <div className="glass-card rounded-3xl p-4 md:p-5 shadow-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  {t.label_policy || 'Cleaning policy'}
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={undo}
                    disabled={historyAt < 0}
                    title={`${t.button_undo || 'Undo'} (Ctrl+Z)`}
                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-cyan-300 transition-all cursor-pointer outline-none disabled:opacity-25 disabled:cursor-not-allowed"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={redo}
                    disabled={historyAt >= history.length - 1}
                    title={`${t.button_redo || 'Redo'} (Ctrl+Shift+Z)`}
                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-cyan-300 transition-all cursor-pointer outline-none disabled:opacity-25 disabled:cursor-not-allowed"
                  >
                    <Redo2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPolicyOpen(open => !open)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer outline-none ${
                      policyOpen
                        ? 'bg-cyan-500/15 border-cyan-500/35 text-cyan-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-cyan-300'
                    }`}
                  >
                    <Sliders className="w-3 h-3" />
                    {t.button_manual || 'Manual'}
                    <ChevronDown className={`w-3 h-3 transition-transform ${policyOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
                {PRESET_ORDER.map(id => {
                  const active = presetId === id;
                  return (
                    <button
                      key={id}
                      onClick={() => applyPreset(id)}
                      className={`flex flex-col gap-1 px-3.5 py-3 rounded-2xl border text-left transition-all cursor-pointer outline-none ${
                        active
                          ? 'bg-cyan-500/10 border-cyan-500/40 text-white'
                          : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200'
                      }`}
                    >
                      <span className="flex items-center gap-2 text-xs font-black">
                        <span
                          className={`w-3.5 h-3.5 rounded-full border shrink-0 transition-all ${
                            active ? 'bg-cyan-500 border-cyan-400' : 'border-white/20'
                          }`}
                        />
                        {t[`preset_${id}`] || PRESET_FALLBACK[id].label}
                      </span>
                      <span className="text-[10.5px] leading-snug text-slate-500 pl-5.5">
                        {t[`preset_${id}_hint`] || PRESET_FALLBACK[id].hint}
                      </span>
                    </button>
                  );
                })}
              </div>

              {presetId === 'custom' && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] font-bold text-amber-200">
                  <Sliders className="w-3.5 h-3.5 shrink-0" />
                  {t.preset_custom_active || 'Custom policy — edited by hand.'}
                </div>
              )}

              {policyOpen && (
                <div className="pt-2 border-t border-white/5">
                  <PolicyEditor policy={policy} onChange={changePolicy} t={t} />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={() => run()}
                  disabled={!canRun}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-cyan-600 text-white text-sm font-black shadow-lg shadow-cyan-600/25 hover:bg-cyan-500 transition-all cursor-pointer outline-none disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  <Play className="w-4 h-4" />
                  {busy ? t.button_working || 'Cleaning…' : t.button_run || 'Sanitize'}
                </button>

                {stale && result && (
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {t.stale_hint || 'Policy changed — run it again'}
                  </span>
                )}

                <span className="text-[10.5px] text-slate-600 hidden sm:inline">
                  {t.shortcut_hint || 'Ctrl+Enter to run · Ctrl+Z to undo a policy change'}
                </span>
              </div>
            </div>

            {/* ---- result ---- */}
            {result && (
              <>
                <div className="glass-card rounded-3xl overflow-hidden shadow-2xl">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 md:px-5 py-3 border-b border-white/5 bg-cyan-950/30">
                    <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-black/30 border border-white/5">
                      {(
                        [
                          { id: 'source', label: t.tab_source || 'Cleaned source' },
                          { id: 'preview', label: t.tab_preview || 'Preview' },
                          {
                            id: 'report',
                            label: `${t.tab_report || 'Removed'}${removedCount ? ` (${result.removals.length})` : ''}`,
                          },
                        ] as const
                      ).map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setView(tab.id)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer outline-none ${
                            view === tab.id ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {view === 'source' && !textOnly && (
                      <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-black/30 border border-white/5">
                        {FORMATS.map(item => (
                          <button
                            key={item.id}
                            onClick={() => changeFormat(item.id)}
                            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer outline-none ${
                              format === item.id ? 'bg-cyan-500/20 text-cyan-200' : 'text-slate-500 hover:text-white'
                            }`}
                          >
                            {t[item.labelKey] || item.fallback}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {view === 'source' && (
                    <div className="relative">
                      <pre className="w-full h-72 md:h-80 p-4 overflow-auto font-mono text-[12px] leading-relaxed bg-black/40 scrollbar-thin whitespace-pre-wrap break-words">
                        {output ? (
                          highlighted
                        ) : (
                          <span className="text-slate-600">
                            {t.output_empty || 'Everything was removed — nothing survived this policy.'}
                          </span>
                        )}
                      </pre>
                      {input && (
                        <button
                          onPointerDown={() => setComparing(true)}
                          className={`absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer outline-none select-none ${
                            comparing
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                              : 'bg-black/60 border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Eye className="w-3 h-3" />
                          {comparing ? t.compare_showing || 'Original' : t.compare_hold || 'Hold to compare'}
                        </button>
                      )}
                    </div>
                  )}

                  {view === 'preview' && (
                    <div className="bg-white h-72 md:h-80 w-full">
                      {textOnly ? (
                        <pre className="w-full h-full p-4 overflow-auto text-[13px] text-slate-800 whitespace-pre-wrap break-words font-sans">
                          {output}
                        </pre>
                      ) : output ? (
                        <iframe
                          title="sanitized-preview"
                          srcDoc={previewDoc}
                          sandbox=""
                          referrerPolicy="no-referrer"
                          className="w-full h-full border-0"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-950">
                          <span className="text-slate-600 text-xs">{t.output_empty || 'Nothing to preview'}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {view === 'report' && (
                    <div className="max-h-80 overflow-hidden flex flex-col">
                      <RemovalReport removals={result.removals} overrides={overrides} onToggle={toggleOverride} t={t} />
                    </div>
                  )}
                </div>

                {/* ---- stats + actions ---- */}
                <div className="glass-card rounded-3xl p-4 md:p-5 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Stat
                      label={t.stat_size || 'size'}
                      value={`${formatBytes(result.bytesIn)} → ${formatBytes(result.bytesOut)}`}
                      tone={delta <= 0 ? 'good' : 'warn'}
                    />
                    <Stat
                      label={t.stat_elements || 'elements'}
                      value={`${result.elementsIn} → ${result.elementsOut}`}
                      tone="plain"
                    />
                    <Stat
                      label={t.stat_removed || 'removed'}
                      value={String(removedCount)}
                      tone={removedCount > 0 ? 'warn' : 'plain'}
                    />
                    {dangerousCount > 0 && (
                      <Stat label={t.stat_dangerous || 'executable'} value={String(dangerousCount)} tone="bad" />
                    )}
                    <Stat label={t.stat_time || 'time'} value={`${result.durationMs.toFixed(1)} ms`} tone="plain" />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleCopy}
                      disabled={!output}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer outline-none border disabled:opacity-30 disabled:cursor-not-allowed ${
                        copied
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                          : 'bg-cyan-600/10 border-cyan-600/30 text-cyan-400 hover:bg-cyan-600/20'
                      }`}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? t.button_copied || 'Copied!' : t.button_copy || 'Copy'}
                    </button>
                    <button
                      onClick={handleDownload}
                      disabled={!output}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600/10 border border-cyan-600/30 text-cyan-400 text-xs font-black hover:bg-cyan-600/20 transition-all cursor-pointer outline-none disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Download className="w-4 h-4" />
                      {t.button_download || 'Download'}
                    </button>
                    <button
                      onClick={resetWorkspace}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 text-xs font-black hover:bg-white/10 hover:text-white transition-all cursor-pointer outline-none"
                    >
                      <RotateCcw className="w-4 h-4" />
                      {t.button_reset || 'Reset'}
                    </button>
                  </div>
                </div>

                {output && <NextStepBar lang={lang} t={t} getResult={getResult} />}
              </>
            )}
          </section>

          <AdBanner id="adsense-html-sanitizer-mid" />

          {/* ============================================================== */}
          {/* How it works                                                   */}
          {/* ============================================================== */}
          {steps.some(step => step.title) && (
            <section className="space-y-10">
              <div className="text-center space-y-3">
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                  {t.howItWorksTitle || 'How it works'}
                </h2>
                <div className="h-1 w-16 bg-cyan-500 mx-auto rounded-full" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {steps.map((step, index) => {
                  const Art = step.art;
                  return (
                    <div key={index} className="glass-card rounded-3xl p-5 space-y-4">
                      <Art className="w-full h-auto" animated={!prefersReduced} />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-cyan-500/15 text-cyan-300 text-[11px] font-black flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <h3 className="text-sm font-black text-white leading-tight">{step.title}</h3>
                        </div>
                        <p className="text-[12.5px] text-slate-400 leading-relaxed">{step.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ============================================================== */}
          {/* Features                                                       */}
          {/* ============================================================== */}
          {features.length > 0 && (
            <section className="space-y-10">
              <div className="text-center space-y-3">
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                  {t.featuresTitle || 'What it does'}
                </h2>
                <div className="h-1 w-16 bg-cyan-500 mx-auto rounded-full" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {features.map((feature, index) => {
                  const Icon = featureIcons[index % featureIcons.length];
                  return (
                    <div
                      key={index}
                      className="glass-card rounded-3xl p-5 space-y-3 hover:border-cyan-500/20 transition-colors"
                    >
                      <Icon className="w-8 h-8 text-cyan-400" />
                      <h3 className="text-sm font-black text-white leading-tight">{feature.title}</h3>
                      <p className="text-[12.5px] text-slate-400 leading-relaxed">{feature.text}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ============================================================== */}
          {/* SEO prose                                                      */}
          {/* ============================================================== */}
          <section className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-5">
                <h2 className="text-3xl md:text-5xl font-black text-white leading-[1.05] tracking-tighter">
                  {t.seoSecondaryTitle || t.seoUseCaseTitle}
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed font-medium">{t.seoHeroText}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(t.seoHeroList || []).map((point: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all"
                    >
                      <span className="w-7 h-7 shrink-0 bg-cyan-500/20 text-cyan-400 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                      <span className="text-slate-300 font-bold text-sm">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative glass-card rounded-[3rem] p-8 md:p-10 py-14 min-h-[360px] flex flex-col items-center justify-center gap-7 text-center overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl" />
                <IconLocalOnly className="w-20 h-20 text-cyan-400 relative" />
                <div className="space-y-3 max-w-sm relative">
                  <h3 className="text-2xl font-black text-white tracking-tight leading-tight">
                    {t.seoPrivacyTitle}
                  </h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">{t.seoPrivacyText}</p>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-14 rounded-3xl md:rounded-[2.5rem] bg-[#061620] border border-white/5 space-y-10">
              <div className="max-w-4xl space-y-4">
                <h2 className="text-2xl md:text-4xl font-black text-white leading-tight">{t.seoUseCaseTitle}</h2>
                <div className="h-1.5 w-20 bg-cyan-500 rounded-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <div className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-3">
                    <span className="w-6 h-px bg-white/20" />
                    {keywords[1] || t.seoUseCaseTitle}
                  </div>
                  <p className="text-slate-400 text-base leading-relaxed font-medium">{t.seoUseCaseText}</p>
                </div>
                <div className="space-y-3">
                  <div className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-3">
                    <span className="w-6 h-px bg-white/20" />
                    {t.seoBrowserSpeedTitle}
                  </div>
                  <p className="text-slate-400 text-base leading-relaxed font-medium">{t.seoBrowserSpeedText}</p>
                </div>
              </div>
            </div>

            {/* FAQ */}
            {faqs.length > 0 && (
              <div className="max-w-4xl mx-auto w-full space-y-8">
                <div className="text-center space-y-3">
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{t.faqTitle}</h2>
                  <div className="h-1 w-16 bg-cyan-500 mx-auto rounded-full" />
                </div>
                <div className="grid gap-3">
                  {faqs.map((faq, index) => (
                    <details
                      key={index}
                      className="glass-card rounded-2xl px-5 md:px-6 py-5 text-left border border-white/5 hover:border-cyan-500/20 transition-colors group [&_summary::-webkit-details-marker]:hidden"
                    >
                      <summary className="flex items-start gap-3 cursor-pointer list-none text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                        <span className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 text-[11px] font-black">
                          Q
                        </span>
                        <span className="flex-1">{faq.question}</span>
                        <span className="shrink-0 text-cyan-400 transition-transform group-open:rotate-45 text-xl leading-none">
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
                  {t.seoKeywordsTitle || 'Also known as'}
                </h2>
                <div className="flex flex-wrap justify-center gap-2">
                  {keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 hover:bg-cyan-500/10 hover:border-cyan-500/20 hover:text-cyan-400 transition-all cursor-default"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <AdBanner id="adsense-html-sanitizer-bottom" />
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[190] max-w-[90vw] px-4 py-3 rounded-2xl bg-[#07131a] border border-cyan-500/25 text-cyan-100 text-[12.5px] font-bold shadow-2xl">
          {toast}
        </div>
      )}

      <Footer lang={lang} t={t} onOpenModal={modal => setActiveModal(modal)} />

      <LegalModal
        isOpen={activeModal === 'privacy'}
        onClose={() => setActiveModal(null)}
        title={legalTranslations[lang]?.privacy.title || 'Privacy Policy'}
        content={legalTranslations[lang]?.privacy.content}
        t={t}
      />
      <LegalModal
        isOpen={activeModal === 'terms'}
        onClose={() => setActiveModal(null)}
        title={legalTranslations[lang]?.terms.title || 'Terms of Service'}
        content={legalTranslations[lang]?.terms.content}
        t={t}
      />
      <LegalModal
        isOpen={activeModal === 'cookies'}
        onClose={() => setActiveModal(null)}
        title={legalTranslations[lang]?.cookies.title || 'Cookie Policy'}
        content={legalTranslations[lang]?.cookies.content}
        t={t}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------

const Stat: React.FC<{ label: string; value: string; tone: 'good' | 'warn' | 'bad' | 'plain' }> = ({
  label,
  value,
  tone,
}) => {
  const styles =
    tone === 'bad'
      ? 'bg-rose-500/10 border-rose-500/25 text-rose-200'
      : tone === 'warn'
        ? 'bg-amber-500/10 border-amber-500/20 text-amber-200'
        : tone === 'good'
          ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-200'
          : 'bg-white/5 border-white/5 text-slate-300';
  return (
    <div className={`flex items-baseline gap-1.5 px-3 py-2 rounded-xl border ${styles}`}>
      <span className="font-mono text-[11.5px] font-bold">{value}</span>
      <span className="text-[10px] opacity-60 uppercase tracking-wider">{label}</span>
    </div>
  );
};
