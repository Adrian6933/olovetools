import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, Braces, Check, Copy, Delete, Download, FileText, Image as ImageIcon, Keyboard, RotateCcw } from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { KeyboardView } from './components/KeyboardView';
import { NextStepBar } from './components/NextStepBar';
import {
  HeroArt,
  IconBoard,
  IconLayoutMap,
  IconOffline,
  IconReport,
  IconRollover,
  IconStuck,
  StepArm,
  StepPress,
  StepShare,
  StepSpot,
} from './components/Illustrations';
import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';
import { useKeyboard } from './lib/useKeyboard';
import { useLayoutMap } from './lib/layoutMap';
import { guessLayout, layoutFromCode } from './lib/layouts';
import { coverageOf, renderPNG, toJSON, toText } from './lib/report';
import type { LayoutKind } from './types';

interface KeyDoctorProps {
  lang: string;
  dictionary: any;
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoked on a timer: Safari cancels an in-flight download if the URL goes
  // away in the same tick.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

const LAYOUT_OPTIONS: { id: LayoutKind; label: string }[] = [
  { id: 'ansi', label: 'ANSI' },
  { id: 'iso', label: 'ISO' },
  { id: 'jis', label: 'JIS' },
];

export default function KeyDoctor({ lang, dictionary }: KeyDoctorProps) {
  const t = dictionary || {};
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [layout, setLayout] = useState<LayoutKind>(() => guessLayout(lang));
  const [layoutPinned, setLayoutPinned] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const surfaceRef = useRef<HTMLButtonElement | null>(null);

  const layoutMap = useLayoutMap();

  // A board that emits IntlBackslash or IntlYen has told us what it physically
  // is, which beats guessing from the interface language. The user's own choice
  // always wins over the detection.
  const onNewCode = useCallback(
    (code: string) => {
      if (layoutPinned) return;
      const detected = layoutFromCode(code);
      if (detected) setLayout(detected);
    },
    [layoutPinned]
  );

  const kb = useKeyboard(onNewCode);
  const { current, history, stats, held, rollover, timing, armed } = kb;

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 700);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!copiedField) return;
    const id = setTimeout(() => setCopiedField(null), 1500);
    return () => clearTimeout(id);
  }, [copiedField]);

  const coverage = useMemo(() => coverageOf(layout, stats), [layout, stats]);
  const pct = Math.round((coverage.tested / Math.max(1, coverage.total)) * 100);
  const anythingTested = coverage.tested > 0;

  const reportInput = useMemo(
    () => ({
      layout,
      stats,
      labels: layoutMap.labels,
      rollover,
      timing,
      history,
      realLabels: layoutMap.real,
    }),
    [layout, stats, layoutMap.labels, layoutMap.real, rollover, timing, history]
  );

  const legendSource = layoutMap.real
    ? t.legendsReal || 'Real legends read from your keyboard layout'
    : t.legendsFallback || 'Generic legends: this browser does not expose the layout map';

  const copyValue = useCallback((value: string, field: string) => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopiedField(field);
  }, []);

  const makePng = useCallback(() => renderPNG(reportInput), [reportInput]);

  const doExport = useCallback(
    async (kind: 'png' | 'txt' | 'json') => {
      setBusy(kind);
      try {
        if (kind === 'png') {
          const blob = await makePng();
          if (blob) download(blob, 'keyboard-test.png');
          return;
        }
        if (kind === 'txt') {
          download(new Blob([toText(reportInput, legendSource)], { type: 'text/plain' }), 'keyboard-test.txt');
          return;
        }
        download(new Blob([toJSON(reportInput)], { type: 'application/json' }), 'keyboard-test.json');
      } finally {
        setBusy(null);
      }
    },
    [legendSource, makePng, reportInput]
  );

  const getHandoffResult = useCallback(async () => {
    const blob = await makePng();
    return blob ? { blob, name: 'keyboard-test.png' } : null;
  }, [makePng]);

  const pickLayout = (id: LayoutKind) => {
    setLayout(id);
    setLayoutPinned(true);
  };

  const inspector: { label: string; value: string; field: string }[] = [
    { label: 'event.key', value: current ? JSON.stringify(current.key) : '—', field: 'key' },
    { label: 'event.code', value: current?.code ?? '—', field: 'code' },
    { label: 'event.keyCode', value: current ? String(current.keyCode) : '—', field: 'keyCode' },
    {
      label: 'event.location',
      value: current
        ? `${current.location} · ${['standard', 'left', 'right', 'numpad'][current.location] || '?'}`
        : '—',
      field: 'location',
    },
  ];

  const modifiers = [
    { on: !!current?.ctrl, label: 'Ctrl' },
    { on: !!current?.alt, label: 'Alt' },
    { on: !!current?.shift, label: 'Shift' },
    { on: !!current?.meta, label: 'Meta' },
  ];
  const locks = [
    { on: !!current?.capsLock, label: 'Caps Lock' },
    { on: !!current?.numLock, label: 'Num Lock' },
    { on: !!current?.scrollLock, label: 'Scroll Lock' },
  ];

  const steps = [
    { art: StepArm, title: t.step1Title || 'Arm the capture', text: t.step1Text || 'Click the panel once. Only then does the page start swallowing keystrokes — Escape hands them back.' },
    { art: StepPress, title: t.step2Title || 'Walk the whole board', text: t.step2Text || 'Every key you press lights up and stays lit, so what is left dark is what you have not tried.' },
    { art: StepSpot, title: t.step3Title || 'Spot what is wrong', text: t.step3Text || 'Dead keys stay dark, keys that never come back up turn red, and the rollover count shows how many register at once.' },
    { art: StepShare, title: t.step4Title || 'Prove it to someone', text: t.step4Text || 'Save the board as a picture, or the numbers as text or JSON, for a listing, a return or a support ticket.' },
  ];

  const features = [
    { icon: IconLayoutMap, title: t.feat1Title || 'Your legends, not a US board', text: t.feat1Text || 'Reads the layout map from the browser, so the drawn keys say what your keys actually say.' },
    { icon: IconBoard, title: t.feat2Title || 'ANSI, ISO and JIS', text: t.feat2Text || 'The right physical shape, detected from the keys you press and switchable by hand.' },
    { icon: IconStuck, title: t.feat3Title || 'Finds stuck and dead keys', text: t.feat3Text || 'A key held with no release is flagged in red; a key never seen stays dark.' },
    { icon: IconRollover, title: t.feat4Title || 'Rollover and timing', text: t.feat4Text || 'How many keys register at once, plus repeat delay, repeat rate and how long you hold a key.' },
    { icon: IconReport, title: t.feat5Title || 'A result you can send', text: t.feat5Text || 'Picture of the board, plain-text summary or JSON — or pass the image straight to another tool.' },
    { icon: IconOffline, title: t.feat6Title || 'Nothing leaves the page', text: t.feat6Text || 'Keystrokes are read and thrown away in memory. Nothing is stored and nothing is sent.' },
  ];

  const faq: { question: string; answer: string }[] = Array.isArray(t.faq) ? t.faq : [];

  /**
   * Reinicio desde el nombre de la herramienta en la cabecera.
   * Vuelve a la distribucion deducida del idioma y suelta la captura.
   * El scroll arriba lo pone withScrollToTop en el propio Header.
   */
  const handleSoftReset = () => {
    setLayout(guessLayout(lang));
    setLayoutPinned(false);
    setCopiedField(null);
    setBusy(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0802] text-slate-200 font-sans relative overflow-x-hidden pt-36 md:pt-24">
      <Header
        onReset={handleSoftReset} currentLang={lang} onLanguageChange={l => (window.location.href = `/${l.toLowerCase()}/key-doctor`)} t={t} />

      {/* The max width lives on <main>: AdRail measures this element to decide
          whether the fixed side rails fit, so reserving 440px from 1400px up is
          what keeps them visible instead of silently suppressed. */}
      <main className="flex-grow w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))] px-4 md:px-8 py-8 relative z-10 flex flex-col gap-12 md:gap-20">
        <AdBanner id="adsense-key-doctor-top" />

        {/* Hero ------------------------------------------------------------ */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 text-[11px] font-black uppercase tracking-[0.2em] text-amber-300">
              <Keyboard className="w-3.5 h-3.5" />
              {t.heroBadge || 'Runs in your browser'}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-[1.1]">
              {t.seoHeroTitle || 'Key Inspector'}
            </h1>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-xl">{t.seoHeroText}</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  surfaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  surfaceRef.current?.focus();
                }}
                className="px-5 py-3 rounded-xl bg-amber-500 text-[#0c0802] font-black text-sm hover:bg-amber-400 active:scale-95 transition-all shadow-lg shadow-amber-500/25 cursor-pointer"
              >
                {t.heroCta || 'Start testing'}
              </button>
              <a
                href="#how-it-works"
                className="px-5 py-3 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:border-amber-500/30 font-bold text-sm transition-all"
              >
                {t.heroSecondary || 'See how it works'}
              </a>
            </div>
          </div>
          <HeroArt className="w-full h-auto max-w-lg mx-auto" />
        </section>

        {/* Capture surface -------------------------------------------------- */}
        <section className="space-y-4">
          {/* A button, not a div with tabIndex: capture has to be reachable and
              triggerable from the keyboard too, and it must announce itself. */}
          <button
            ref={surfaceRef}
            type="button"
            aria-pressed={armed}
            onFocus={() => kb.setArmed(true)}
            onBlur={() => kb.setArmed(false)}
            className={`w-full relative rounded-3xl border p-6 md:p-10 min-h-[220px] flex flex-col items-center justify-center text-center transition-all cursor-pointer outline-none ${
              armed
                ? 'border-amber-400/70 bg-gradient-to-br from-amber-950/40 via-[#0c0802] to-[#0c0802] shadow-[0_0_40px_-12px_rgba(251,191,36,0.5)]'
                : 'border-white/10 bg-white/[0.02] hover:border-amber-500/30'
            }`}
          >
            <span
              className={`absolute top-4 left-4 flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase font-bold ${
                armed ? 'text-amber-300' : 'text-slate-500'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${armed ? 'bg-amber-400' : 'bg-slate-600'}`} />
              {armed ? t.captureOn || 'Capturing — Esc to stop' : t.captureOff || 'Capture off'}
            </span>

            {current ? (
              <span className="flex flex-col items-center gap-5">
                <span className="text-6xl md:text-7xl font-black text-amber-400 tracking-tighter break-all max-w-full leading-none">
                  {current.key === ' ' ? 'Space' : current.key}
                </span>
                <span className="font-mono text-xs tracking-[0.25em] uppercase text-amber-400/60">{current.code}</span>
              </span>
            ) : (
              <span className="flex flex-col items-center gap-4 text-slate-500">
                <Keyboard className="w-14 h-14 text-amber-400/30" />
                <span className="text-sm tracking-widest uppercase font-bold">
                  {armed ? t.pressAnyKey || 'Press any key' : t.clickToStart || 'Click here, then press any key'}
                </span>
              </span>
            )}
          </button>

          {/* Modifier + lock state. getModifierState is the only way to read the
              locks; no plain event field carries them. */}
          <div className="flex flex-wrap gap-2">
            {modifiers.map(m => (
              <span
                key={m.label}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase border transition-all ${
                  m.on ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-white/[0.02] border-white/10 text-slate-500'
                }`}
              >
                {m.label}
              </span>
            ))}
            <span className="w-px self-stretch bg-white/10 mx-1" />
            {locks.map(m => (
              <span
                key={m.label}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase border transition-all ${
                  m.on ? 'bg-emerald-500/15 border-emerald-400/60 text-emerald-300' : 'bg-white/[0.02] border-white/10 text-slate-500'
                }`}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Board ---------------------------------------------------------- */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center rounded-lg border border-white/10 bg-white/5 overflow-hidden h-9">
              {LAYOUT_OPTIONS.map(o => (
                <button
                  key={o.id}
                  onClick={() => pickLayout(o.id)}
                  className={`h-full px-3 text-xs font-bold transition-colors cursor-pointer ${
                    layout === o.id ? 'bg-amber-500/20 text-amber-200' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 flex-1 min-w-[220px]">{legendSource}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={kb.clearHistory}
                disabled={history.length === 0}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 text-xs font-bold text-slate-400 hover:text-amber-300 hover:border-amber-500/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <Delete className="w-3.5 h-3.5" /> {t.clear || 'Clear'}
              </button>
              <button
                onClick={kb.reset}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 text-xs font-bold text-slate-400 hover:text-amber-300 hover:border-amber-500/40 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> {t.reset || 'Reset'}
              </button>
            </div>
          </div>

          <KeyboardView layout={layout} stats={stats} labels={layoutMap.labels} highlightUntested t={t} />

          {/* Numbers -------------------------------------------------------- */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="glass-card rounded-2xl p-4">
              <div className="text-[10px] tracking-[0.25em] uppercase text-amber-400/60 font-bold">
                {t.statCoverage || 'Keys tested'}
              </div>
              <div className="text-2xl font-black text-white tabular-nums mt-1">
                {coverage.tested}
                <span className="text-slate-500 text-base"> / {coverage.total}</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="glass-card rounded-2xl p-4">
              <div className="text-[10px] tracking-[0.25em] uppercase text-amber-400/60 font-bold">
                {t.statRollover || 'At once (rollover)'}
              </div>
              <div className="text-2xl font-black text-white tabular-nums mt-1">{rollover.max || '—'}</div>
              <p className="text-[11px] text-slate-500 mt-1 truncate" title={rollover.best.join(' + ')}>
                {rollover.best.length ? rollover.best.join(' + ') : t.rolloverHint || 'Hold several keys together'}
              </p>
            </div>
            <div className="glass-card rounded-2xl p-4">
              <div className="text-[10px] tracking-[0.25em] uppercase text-amber-400/60 font-bold">
                {t.statRepeat || 'Auto-repeat'}
              </div>
              <div className="text-2xl font-black text-white tabular-nums mt-1">
                {timing.repeatRate ? `${timing.repeatRate} ms` : '—'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {(t.repeatDelayLabel || 'delay {v}').replace('{v}', timing.repeatDelay ? `${timing.repeatDelay} ms` : '—')}
              </p>
            </div>
            <div className="glass-card rounded-2xl p-4">
              <div className="text-[10px] tracking-[0.25em] uppercase text-amber-400/60 font-bold">
                {t.statStuck || 'Stuck keys'}
              </div>
              <div className={`text-2xl font-black tabular-nums mt-1 ${coverage.stuck.length ? 'text-red-400' : 'text-white'}`}>
                {coverage.stuck.length}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 truncate">
                {held.length ? (t.heldNow || '{n} held now').replace('{n}', String(held.length)) : t.noneHeld || 'nothing held'}
              </p>
            </div>
          </div>

          {/* Inspector ------------------------------------------------------ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {inspector.map(card => (
              <div key={card.field} className="glass-card rounded-2xl p-4">
                <div className="text-[10px] tracking-[0.25em] uppercase text-amber-400/60 font-bold">{card.label}</div>
                <div className="text-xl font-black text-white break-all min-h-[2rem] flex items-center font-mono mt-1">
                  {card.value}
                </div>
                <button
                  onClick={() => copyValue(card.value, card.field)}
                  disabled={!current}
                  className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {copiedField === card.field ? (
                    <><Check className="w-3.5 h-3.5" /> {t.copied || 'Copied'}</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" /> {t.copy || 'Copy'}</>
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* History */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/10">
                <h3 className="text-sm font-black tracking-tight text-white uppercase">{t.historyTitle || 'History Log'}</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {history.length === 0 ? (
                  <p className="px-5 py-8 text-center text-xs text-slate-600 italic">
                    {t.historyEmpty || 'No keys pressed yet'}
                  </p>
                ) : (
                  <table className="w-full text-left text-xs font-mono">
                    <tbody>
                      {history.map((r, i) => (
                        <tr key={i} className="border-b border-white/5 last:border-0">
                          <td className="px-4 py-2 text-amber-300">{r.code}</td>
                          <td className="px-2 py-2 text-white">{JSON.stringify(r.key)}</td>
                          <td className="px-2 py-2 text-slate-500 tabular-nums">{r.keyCode}</td>
                          <td className="px-4 py-2 text-slate-600">
                            {[r.ctrl && 'C', r.alt && 'A', r.shift && 'S', r.meta && 'M'].filter(Boolean).join('')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Report */}
            <div className="space-y-4">
              <div className="glass-card rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-black tracking-tight text-white">{t.reportTitle || 'Save the result'}</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => doExport('png')}
                    disabled={!anythingTested || busy !== null}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:border-amber-500/30 text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ImageIcon className="w-4 h-4 text-amber-400" /> PNG
                  </button>
                  <button
                    onClick={() => doExport('txt')}
                    disabled={!anythingTested || busy !== null}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:border-amber-500/30 text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FileText className="w-4 h-4 text-amber-400" /> TXT
                  </button>
                  <button
                    onClick={() => doExport('json')}
                    disabled={!anythingTested || busy !== null}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:border-amber-500/30 text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Braces className="w-4 h-4 text-amber-400" /> JSON
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {t.reportNote ||
                    'The picture shows which keys answered and which never did — handy for a second-hand listing, a warranty claim or a support ticket.'}
                </p>
              </div>
              <NextStepBar lang={lang} t={t} disabled={!anythingTested} getResult={getHandoffResult} />
            </div>
          </div>
        </section>

        <AdBanner id="adsense-key-doctor-mid" />

        {/* How it works ---------------------------------------------------- */}
        <section id="how-it-works" className="space-y-8 scroll-mt-28">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white text-center">
            {t.howTitle || 'How it works'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((s, i) => (
              <div key={i} className="glass-card rounded-2xl p-4 space-y-3">
                <s.art />
                <div className="space-y-1.5">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-amber-500/15 text-amber-300 text-[11px] font-black flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    {s.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features -------------------------------------------------------- */}
        <section className="space-y-8">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white text-center">
            {t.featuresTitle || 'What it actually does'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 space-y-3">
                <div className="w-10 h-10">
                  <f.icon />
                </div>
                <h3 className="text-sm font-black text-white">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ ------------------------------------------------------------- */}
        {faq.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white text-center">
              {t.faqTitle || 'Frequently Asked Questions'}
            </h2>
            <div className="space-y-3 max-w-3xl mx-auto w-full">
              {faq.map((item, i) => (
                <details key={i} className="group glass-card rounded-2xl overflow-hidden">
                  <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none text-sm font-bold text-white hover:text-amber-300 transition-colors">
                    <span>{item.question}</span>
                    <span className="text-amber-400 text-lg leading-none shrink-0 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="px-5 pb-5 text-sm text-slate-400 leading-relaxed">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <AdBanner id="adsense-key-doctor-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={m => setLegalModal(m)} />

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={t.scrollTop || 'Back to top'}
          className="fixed bottom-6 right-6 z-[190] w-11 h-11 rounded-full bg-amber-500 text-[#0c0802] flex items-center justify-center shadow-lg shadow-amber-500/30 hover:bg-amber-400 transition-all cursor-pointer"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

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
