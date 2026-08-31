import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronsRight,
  Clock,
  Copy,
  History,
  Redo2,
  RotateCcw,
  Share2,
  Sparkles,
  Undo2,
  Zap,
} from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';
import { useHandoffIntake } from '../../lib/useHandoff';

import { parseCron } from './lib/cron';
import type { FieldKind } from './lib/cron';
import { describe, describeError, formatClock, vocabFrom } from './lib/describe';
import {
  frequency,
  instantToCivil,
  localTimezone,
  isValidTimezone,
  nextOccurrences,
  previousOccurrences,
} from './lib/schedule';
import type { Occurrence } from './lib/schedule';
import { EXPORT_FILENAME, generate } from './lib/exporters';
import type { ExportId } from './lib/exporters';

import {
  CronHeroArt,
  IconBuilder,
  IconCalendar,
  IconExport,
  IconLocal,
  IconPlatforms,
  IconTimezone,
  StepExport,
  StepPreview,
  StepWrite,
  StepZone,
} from './components/Illustrations';
import { FieldBuilder } from './components/FieldBuilder';
import { ScheduleCalendar } from './components/ScheduleCalendar';
import { ExportPanel } from './components/ExportPanel';
import { PlatformMatrix } from './components/PlatformMatrix';
import { CrontabImport } from './components/CrontabImport';
import { NextStepBar } from './components/NextStepBar';
import { TimezonePicker } from './components/TimezonePicker';

interface CronFlowProps {
  lang: string;
  dictionary: any;
}

const DEFAULT_EXPRESSION = '*/5 * * * *';
const RUN_COUNT = 6;

const PRESETS: { key: string; fallback: string; value: string }[] = [
  { key: 'preset_everyMinute', fallback: 'Every minute', value: '* * * * *' },
  { key: 'preset_every5', fallback: 'Every 5 minutes', value: '*/5 * * * *' },
  { key: 'preset_hourly', fallback: 'Hourly', value: '0 * * * *' },
  { key: 'preset_daily', fallback: 'Daily at midnight', value: '0 0 * * *' },
  { key: 'preset_workdays', fallback: 'Weekdays at 9am', value: '0 9 * * 1-5' },
  { key: 'preset_weekly', fallback: 'Weekly on Sunday', value: '0 0 * * 0' },
  { key: 'preset_monthly', fallback: 'First of the month', value: '0 0 1 * *' },
  { key: 'preset_lastDay', fallback: 'Last day of the month', value: '0 0 L * *' },
  { key: 'preset_thirdFriday', fallback: 'Third Friday', value: '0 12 ? * FRI#3' },
  { key: 'preset_quarterly', fallback: 'Quarterly', value: '0 0 1 1,4,7,10 *' },
];

const FEATURE_ICONS = [IconTimezone, IconBuilder, IconCalendar, IconExport, IconPlatforms, IconLocal];
const STEP_ART = [StepWrite, StepZone, StepPreview, StepExport];

/** Chunks the human-readable numbers without pulling Intl into the render. */
function groupDigits(n: number): string {
  const s = String(n);
  let out = '';
  for (let i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 === 0) out += ' ';
    out += s[i];
  }
  return out;
}

export default function CronFlow({ lang, dictionary }: CronFlowProps) {
  const t = dictionary || {};
  const vocab = useMemo(() => vocabFrom(t), [t]);

  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies'>(null);
  // One piece of state, not three. Undo/redo written as three separate
  // useStates forces a setState inside another setState's updater to keep them
  // consistent, which is exactly the pattern that goes wrong under batching.
  const [history, setHistory] = useState<{ value: string; past: string[]; future: string[] }>({
    value: DEFAULT_EXPRESSION,
    past: [],
    future: [],
  });
  const expression = history.value;
  const [timezone, setTimezone] = useState('UTC');
  const [copied, setCopied] = useState<'expr' | 'link'>(null);
  const [mounted, setMounted] = useState(false);
  const [nowTs, setNowTs] = useState(0);
  const [tab, setTab] = useState<'builder' | 'import'>('builder');
  const [blanks, setBlanks] = useState<Record<number, boolean>>({});
  const [command, setCommand] = useState('');
  const [jobName, setJobName] = useState('');
  const [activeExport, setActiveExport] = useState<ExportId>('crontab');
  const [crontabText, setCrontabText] = useState('');
  const [pendingFrom, setPendingFrom] = useState('');

  const copyTimer = useRef<number>(null);

  // --------------------------------------------------------------------------
  // Time. Nothing that depends on the clock renders before mount: the island is
  // server-rendered, and a schedule computed from the server's `Date.now()` in
  // the server's zone is exactly the kind of markup that makes React throw the
  // tree away and rehydrate from scratch.
  // --------------------------------------------------------------------------
  useEffect(() => {
    setMounted(true);
    setNowTs(Date.now());
    const local = localTimezone();
    if (local && isValidTimezone(local)) setTimezone(local);

    const hash = window.location.hash.replace(/^#/, '');
    if (hash) {
      const params = new URLSearchParams(hash);
      const shared = params.get('e');
      const sharedTz = params.get('tz');
      if (shared) setHistory(h => ({ ...h, value: shared }));
      if (sharedTz && isValidTimezone(sharedTz)) setTimezone(sharedTz);
    }

    const id = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(
    () => () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
    },
    []
  );

  // --------------------------------------------------------------------------
  // Handoff in: park the file, never analyse it. The user presses the button.
  // --------------------------------------------------------------------------
  useHandoffIntake((file, from) => {
    file.text().then(text => {
      setCrontabText(text);
      setPendingFrom(from);
      setTab('import');
    });
  });

  // --------------------------------------------------------------------------
  // Expression state. One source of truth; undo/redo keeps strings, so a
  // hundred steps of history costs a few kilobytes rather than a few hundred
  // megabytes of snapshots.
  // --------------------------------------------------------------------------
  const commit = useCallback((next: string) => {
    setHistory(h =>
      h.value === next ? h : { value: next, past: [...h.past, h.value].slice(-100), future: [] }
    );
  }, []);

  const undo = useCallback(() => {
    setHistory(h =>
      h.past.length === 0
        ? h
        : {
            value: h.past[h.past.length - 1],
            past: h.past.slice(0, -1),
            future: [h.value, ...h.future].slice(0, 100),
          }
    );
  }, []);

  const redo = useCallback(() => {
    setHistory(h =>
      h.future.length === 0
        ? h
        : { value: h.future[0], past: [...h.past, h.value].slice(-100), future: h.future.slice(1) }
    );
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if ((key === 'z' && event.shiftKey) || key === 'y') {
        event.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  // --------------------------------------------------------------------------
  // Parsing and everything derived from it
  // --------------------------------------------------------------------------
  const parsed = useMemo(() => parseCron(expression), [expression]);
  const cron = parsed.cron;
  const description = useMemo(
    () => (cron ? describe(cron, t) : describeError(parsed.error, t)),
    [cron, parsed.error, t]
  );

  const parts = useMemo(() => {
    const split = expression.trim().split(/\s+/).filter(p => p !== '');
    while (split.length < 5) split.push('*');
    return split;
  }, [expression]);

  const fieldKinds: FieldKind[] = useMemo(() => {
    if (parts.length === 7) return ['second', 'minute', 'hour', 'day', 'month', 'weekday', 'year'];
    if (parts.length === 6) return ['second', 'minute', 'hour', 'day', 'month', 'weekday'];
    return ['minute', 'hour', 'day', 'month', 'weekday'];
  }, [parts.length]);

  /**
   * Emptying a segment used to rewrite the expression with one field fewer,
   * which silently shifted every box to the left. The value written out is
   * always a real token; the empty string only lives in `blanks`, so the input
   * can look empty while the user retypes.
   */
  const updateSegment = useCallback(
    (index: number, value: string) => {
      const cleaned = value.replace(/\s+/g, '');
      setBlanks(current => {
        const next = { ...current };
        if (cleaned === '') next[index] = true;
        else delete next[index];
        return next;
      });
      const nextParts = [...parts];
      nextParts[index] = cleaned === '' ? '*' : cleaned;
      commit(nextParts.join(' '));
    },
    [parts, commit]
  );

  const freq = useMemo(() => {
    if (!cron || !mounted) return null;
    return frequency(cron, instantToCivil(nowTs, timezone).y);
    // `nowTs` ticks every second but only its year matters here, so the memo is
    // keyed on the expression and the zone instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cron, timezone, mounted]);

  // Occurrence search is keyed on a minute-resolution clock, not the ticking
  // second: recomputing eight calendar walks every second to move a countdown
  // would be pure waste.
  const searchTs = useMemo(() => Math.floor(nowTs / 60000) * 60000, [nowTs]);

  const upcoming: Occurrence[] = useMemo(() => {
    if (!cron || !mounted) return [];
    return nextOccurrences(cron, searchTs, timezone, RUN_COUNT);
  }, [cron, searchTs, timezone, mounted]);

  const recent: Occurrence[] = useMemo(() => {
    if (!cron || !mounted) return [];
    return previousOccurrences(cron, searchTs, timezone, 3);
  }, [cron, searchTs, timezone, mounted]);

  const today = useMemo(
    () => (mounted ? instantToCivil(nowTs, timezone) : { y: 2026, mo: 1, d: 1, h: 0, mi: 0, s: 0 }),
    [mounted, nowTs, timezone]
  );

  // --------------------------------------------------------------------------
  // Actions
  // --------------------------------------------------------------------------
  const flash = (which: 'expr' | 'link') => {
    setCopied(which);
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  const copyExpression = () => {
    navigator.clipboard.writeText(expression).then(() => flash('expr'), () => setCopied(null));
  };

  const share = () => {
    const hash = `#e=${encodeURIComponent(expression)}&tz=${encodeURIComponent(timezone)}`;
    const url = `${window.location.origin}${window.location.pathname}${hash}`;
    window.history.replaceState({}, '', hash);
    navigator.clipboard.writeText(url).then(() => flash('link'), () => setCopied(null));
  };

  const resetWorkspace = () => {
    commit(DEFAULT_EXPRESSION);
    setBlanks({});
    setCopied(null);
  };

  const handoffResult = useCallback(() => {
    if (!cron) return null;
    const snippet = generate(activeExport, { cron, timezone, command, name: jobName });
    return {
      blob: new Blob([snippet], { type: 'text/plain' }),
      name: EXPORT_FILENAME[activeExport],
    };
  }, [cron, activeExport, timezone, command, jobName]);

  // --------------------------------------------------------------------------
  // Presentation helpers
  // --------------------------------------------------------------------------
  /**
   * Date order is a dictionary template, not a constant: Japanese and Chinese
   * write year → month → day, and hardcoding the Western order produced
   * "金曜日 21 8月 2026", which no reader would ever write.
   */
  const stamp = (occ: Occurrence): string => {
    const c = occ.civil;
    const weekday = vocab.weekdays[new Date(Date.UTC(c.y, c.mo - 1, c.d)).getUTCDay()] || '';
    const month = vocab.months[c.mo - 1] || String(c.mo);
    const template = t.stamp_format || '{wd} {d} {mo} {y} · {t}';
    return template
      .replace('{wd}', weekday.slice(0, 3))
      .replace('{d}', String(c.d))
      .replace('{mo}', month.slice(0, 3))
      .replace('{y}', String(c.y))
      .replace('{t}', formatClock(c.h, c.mi, vocab));
  };

  const countdown = (ts: number): string => {
    const delta = Math.max(0, Math.floor((ts - nowTs) / 1000));
    const days = Math.floor(delta / 86400);
    const hours = Math.floor((delta % 86400) / 3600);
    const minutes = Math.floor((delta % 3600) / 60);
    const seconds = delta % 60;
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const faqs = Array.isArray(t.faq) ? t.faq : [];
  const features = Array.isArray(t.features) ? t.features : [];
  const keywords = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];
  const steps = [1, 2, 3, 4].map((n, i) => ({
    title: t[`step${n}Title`] || '',
    text: t[`step${n}Text`] || '',
    art: STEP_ART[i],
  }));

  const valid = !!cron;
  const errorField = parsed.error && parsed.error.field;

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0408] text-slate-200 font-sans relative overflow-x-hidden">
      <Header
        currentLang={lang}
        onLanguageChange={l => (window.location.href = `/${l.toLowerCase()}/cron-flow`)}
        onReset={resetWorkspace}
        t={t}
      />

      {/* The max width lives on <main> on purpose: AdRail measures this element
          to decide whether the fixed side rails fit. A w-full <main> leaves a
          0px gap and the rails never render, at any window size. */}
      <main className="flex-1 flex flex-col items-center pt-40 md:pt-36 pb-24 px-4 md:px-12 relative z-10 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))]">
        <AdBanner id="adsense-cron-flow-top" />

        <div className="w-full space-y-20 md:space-y-28">
          {/* ================================================================ */}
          {/* Hero                                                             */}
          {/* ================================================================ */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center pt-2">
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex max-w-full items-center gap-2 px-4 py-2 rounded-full bg-violet-950/40 border border-violet-800/30 text-violet-400 text-[11px] font-black tracking-[0.2em] uppercase shadow-[0_0_25px_rgba(139,92,246,0.15)]">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.badge || t.title}</span>
              </div>

              <h1 className="text-4xl md:text-6xl xl:text-7xl font-black tracking-tight leading-[0.95] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-400">
                {t.title}
              </h1>

              <p className="text-slate-400 text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
                {t.description || t.seoHeroText}
              </p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                {(t.seoHeroList || []).slice(0, 3).map((point: string, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-300"
                  >
                    <Check className="w-3.5 h-3.5 text-violet-400 stroke-[3]" />
                    {point}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-violet-500/10 blur-[80px] rounded-full" />
              <CronHeroArt className="relative w-full max-w-lg mx-auto drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]" />
            </div>
          </section>

          {/* ================================================================ */}
          {/* Expression                                                       */}
          {/* ================================================================ */}
          <section className="space-y-6">
            <div className="glass-card rounded-3xl p-5 md:p-7 space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <span className="flex items-center gap-2 text-violet-400 text-[10px] font-black uppercase tracking-[0.3em] shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  {t.label_expression || 'Expression'}
                </span>
                <div className="flex-1 flex flex-wrap items-center gap-2 min-w-0">
                  <input
                    value={expression}
                    onChange={e => commit(e.target.value)}
                    spellCheck={false}
                    placeholder="* * * * *"
                    aria-label={t.label_expression || 'Expression'}
                    aria-invalid={!valid}
                    className={`flex-1 min-w-[12rem] px-4 py-3 bg-[#0d0518] border rounded-xl text-violet-100 font-mono text-base md:text-lg outline-none transition-all ${
                      valid ? 'border-violet-500/30 focus:border-violet-400' : 'border-red-500/50 focus:border-red-400'
                    }`}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={undo}
                      disabled={history.past.length === 0}
                      title={t.tooltip_undo || 'Undo (Ctrl+Z)'}
                      className="w-11 h-11 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white flex items-center justify-center transition-all cursor-pointer outline-none disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Undo2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={redo}
                      disabled={history.future.length === 0}
                      title={t.tooltip_redo || 'Redo (Ctrl+Shift+Z)'}
                      className="w-11 h-11 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white flex items-center justify-center transition-all cursor-pointer outline-none disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Redo2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={copyExpression}
                      title={t.tooltip_copy || 'Copy the expression'}
                      className="w-11 h-11 rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 hover:text-violet-100 flex items-center justify-center transition-all cursor-pointer outline-none"
                    >
                      {copied === 'expr' ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={share}
                      title={t.tooltip_share || 'Copy a link to this schedule'}
                      className="w-11 h-11 rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 hover:text-violet-100 flex items-center justify-center transition-all cursor-pointer outline-none"
                    >
                      {copied === 'link' ? <Check className="w-5 h-5 text-emerald-400" /> : <Share2 className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={resetWorkspace}
                      title={t.tooltip_reset || 'Reset'}
                      className="w-11 h-11 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white flex items-center justify-center transition-all cursor-pointer outline-none"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 md:gap-3">
                {fieldKinds.map((kind, i) => {
                  const broken = errorField === kind;
                  return (
                    <label key={kind} className="flex flex-col items-center gap-1.5 group">
                      <span className="text-[9px] uppercase tracking-[0.18em] text-violet-400/70 font-black">
                        {t[`field_${kind}`] || kind}
                      </span>
                      <input
                        value={blanks[i] ? '' : parts[i] || ''}
                        onChange={e => updateSegment(i, e.target.value)}
                        onBlur={() =>
                          setBlanks(current => {
                            const next = { ...current };
                            delete next[i];
                            return next;
                          })
                        }
                        spellCheck={false}
                        className={`w-[4.25rem] sm:w-20 md:w-24 px-2 py-2.5 rounded-xl text-center text-violet-100 font-mono text-sm outline-none transition-all border ${
                          broken
                            ? 'bg-red-500/10 border-red-500/50 focus:border-red-400'
                            : 'bg-violet-500/5 border-violet-500/30 focus:border-violet-400 focus:bg-violet-500/15'
                        }`}
                      />
                      <span className="text-[9px] text-violet-400/40 font-mono">
                        {t[`range_${kind}`] || ''}
                      </span>
                    </label>
                  );
                })}
              </div>

              {!valid && (
                <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{description}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {PRESETS.map(preset => {
                  const active = expression.trim() === preset.value;
                  return (
                    <button
                      key={preset.value}
                      onClick={() => commit(preset.value)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer outline-none ${
                        active
                          ? 'bg-violet-600 border-violet-500 text-white'
                          : 'bg-violet-500/5 border-violet-500/20 text-violet-300 hover:bg-violet-500/15 hover:border-violet-400/50'
                      }`}
                    >
                      <Zap className="w-3 h-3" />
                      {t[preset.key] || preset.fallback}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Human-readable ------------------------------------------------ */}
            <div className="bg-gradient-to-br from-violet-500/[0.09] to-fuchsia-500/[0.03] border border-violet-500/25 rounded-3xl p-7 md:p-12 text-center space-y-5">
              <span className="inline-flex items-center gap-2 text-violet-400 text-[10px] font-black uppercase tracking-[0.3em]">
                <Sparkles className="w-3.5 h-3.5" />
                {t.label_readable || 'In plain words'}
              </span>
              <p
                className={`text-2xl md:text-4xl font-black leading-snug tracking-tight ${
                  valid ? 'text-white' : 'text-red-300'
                }`}
              >
                {description}
              </p>
              {valid && (
                <div className="flex flex-wrap justify-center gap-2 text-[11px]">
                  <span className="px-3 py-1.5 rounded-full bg-black/30 border border-white/5 font-mono text-violet-300/80">
                    {cron.expression}
                  </span>
                  {cron.macro && (
                    <span className="px-3 py-1.5 rounded-full bg-black/30 border border-white/5 font-mono text-violet-300/60">
                      {cron.macro}
                    </span>
                  )}
                  <span className="px-3 py-1.5 rounded-full bg-black/30 border border-white/5 font-bold text-slate-400">
                    {t[`flavor_${cron.flavor}`] || cron.flavor}
                  </span>
                  {freq && (
                    <span className="px-3 py-1.5 rounded-full bg-black/30 border border-white/5 font-bold text-slate-400">
                      {(t.stat_perYear || '{n} runs a year').replace('{n}', groupDigits(freq.perYear))}
                    </span>
                  )}
                </div>
              )}
              {valid && freq && freq.perYear > 100000 && (
                <p className="text-amber-300/90 text-xs font-bold">
                  {t.warn_tooFrequent || 'That is a lot of runs. Most schedulers throttle anything under a minute.'}
                </p>
              )}
            </div>
          </section>

          {/* ================================================================ */}
          {/* Workspace                                                        */}
          {/* ================================================================ */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 min-w-0 space-y-5">
              <div className="flex gap-2">
                <button
                  onClick={() => setTab('builder')}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer outline-none ${
                    tab === 'builder'
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'bg-[#160a24] border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {t.tab_builder || 'Build it by clicking'}
                </button>
                <button
                  onClick={() => setTab('import')}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer outline-none ${
                    tab === 'import'
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'bg-[#160a24] border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {t.tab_import || 'Read a crontab'}
                </button>
              </div>

              <div className="glass-card rounded-3xl p-5 md:p-6">
                {tab === 'builder' ? (
                  valid ? (
                    <FieldBuilder
                      cron={cron}
                      onChange={commit}
                      t={t}
                      monthNames={vocab.months}
                      weekdayNames={vocab.weekdays}
                    />
                  ) : (
                    <p className="text-sm text-slate-500 py-6 text-center">
                      {t.builder_needsValid || 'Fix the expression above and the grid comes back.'}
                    </p>
                  )
                ) : (
                  <CrontabImport
                    t={t}
                    pendingFrom={pendingFrom}
                    text={crontabText}
                    onTextChange={setCrontabText}
                    onPickExpression={value => {
                      commit(value);
                      setTab('builder');
                    }}
                    onTimezone={tz => {
                      if (isValidTimezone(tz)) setTimezone(tz);
                    }}
                  />
                )}
              </div>
            </div>

            <div className="lg:col-span-5 min-w-0 space-y-5">
              <div className="glass-card rounded-3xl p-5 md:p-6 space-y-5">
                <TimezonePicker value={timezone} onChange={setTimezone} t={t} nowTs={nowTs} mounted={mounted} />

                <div className="space-y-2 pt-1 border-t border-white/5">
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 pt-3">
                    <ChevronsRight className="w-3.5 h-3.5 text-violet-400" />
                    {t.label_next || 'Next runs'}
                  </span>

                  {!mounted ? (
                    <p className="text-xs text-slate-600 py-3">{t.label_loading || 'Reading your clock…'}</p>
                  ) : !valid ? (
                    <p className="text-xs text-slate-600 py-3">
                      {t.empty_invalid || 'Enter a valid expression to see the schedule.'}
                    </p>
                  ) : upcoming.length === 0 ? (
                    <p className="text-xs text-amber-300/90 py-3">
                      {t.empty_never || 'This expression never fires — no date matches all its fields.'}
                    </p>
                  ) : (
                    <ol className="space-y-1.5">
                      {upcoming.map((occ, i) => (
                        <li
                          key={occ.ts}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
                            i === 0
                              ? 'bg-violet-600/15 border-violet-500/35'
                              : 'bg-[#0d0518] border-white/5'
                          }`}
                        >
                          <span className="shrink-0 w-6 h-6 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center text-violet-300 font-black text-[10px]">
                            {i + 1}
                          </span>
                          <span className="text-[11px] md:text-xs text-violet-100 font-medium truncate min-w-0 flex-1">
                            {stamp(occ)}
                          </span>
                          {i === 0 && (
                            <span className="shrink-0 font-mono text-[11px] text-fuchsia-300 tabular-nums">
                              {countdown(occ.ts)}
                            </span>
                          )}
                          {occ.dstShifted && (
                            <AlertTriangle
                              className="w-3.5 h-3.5 text-amber-400 shrink-0"
                              aria-label={t.warn_dst || 'That wall-clock time does not exist on this date'}
                            />
                          )}
                        </li>
                      ))}
                    </ol>
                  )}

                  {mounted && valid && upcoming.some(o => o.dstShifted) && (
                    <p className="text-[11px] text-amber-300/85 leading-relaxed">
                      {t.warn_dst ||
                        'A run falls in the hour daylight saving removes. Schedulers disagree on what to do; this one shows the next real instant.'}
                    </p>
                  )}

                  {mounted && valid && recent.length > 0 && (
                    <details className="pt-2 [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex items-center gap-1.5 cursor-pointer list-none text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors">
                        <History className="w-3.5 h-3.5" />
                        {t.label_previous || 'Previous runs'}
                      </summary>
                      <ol className="space-y-1.5 pt-2.5">
                        {recent.map(occ => (
                          <li
                            key={occ.ts}
                            className="px-3 py-2 rounded-xl bg-[#0d0518] border border-white/5 text-[11px] text-slate-400 truncate"
                          >
                            {stamp(occ)}
                          </li>
                        ))}
                      </ol>
                    </details>
                  )}
                </div>

                {mounted && valid && freq && (
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5">
                    <div className="text-center">
                      <div className="text-lg font-black text-white tabular-nums">{groupDigits(freq.perActiveDay)}</div>
                      <div className="text-[9px] uppercase tracking-wider text-slate-600 font-bold">
                        {t.stat_perDay || 'per active day'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-black text-white tabular-nums">{freq.activeDaysPerYear}</div>
                      <div className="text-[9px] uppercase tracking-wider text-slate-600 font-bold">
                        {t.stat_activeDays || 'days a year'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-black text-white tabular-nums">
                        {freq.evenInterval > 0 ? countdownLabel(freq.evenInterval, t) : '—'}
                      </div>
                      <div className="text-[9px] uppercase tracking-wider text-slate-600 font-bold">
                        {t.stat_interval || 'gap'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {valid && (
                <div className="glass-card rounded-3xl p-5 md:p-6">
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 mb-4">
                    <Calendar className="w-3.5 h-3.5 text-violet-400" />
                    {t.label_calendar || 'Where it lands'}
                  </span>
                  <ScheduleCalendar
                    cron={cron}
                    today={today}
                    t={t}
                    monthNames={vocab.months}
                    weekdayNames={vocab.weekdays}
                    runsPerDay={freq ? freq.perActiveDay : 1}
                  />
                </div>
              )}
            </div>
          </section>

          {/* ================================================================ */}
          {/* Platforms                                                        */}
          {/* ================================================================ */}
          {valid && (
            <section className="space-y-5">
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  {t.platforms_title || 'Will it run where you are putting it?'}
                </h2>
                <p className="text-slate-500 text-sm max-w-2xl">
                  {t.platforms_text ||
                    'The same five fields mean different things to different schedulers. These are the ones that would reject or reinterpret this expression.'}
                </p>
              </div>
              <PlatformMatrix cron={cron} evenIntervalMs={freq ? freq.evenInterval : 0} t={t} />
            </section>
          )}

          <AdBanner id="adsense-cron-flow-mid" />

          {/* ================================================================ */}
          {/* Export                                                           */}
          {/* ================================================================ */}
          {valid && (
            <section className="space-y-5">
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  {t.export_title || 'Take it with you'}
                </h2>
                <p className="text-slate-500 text-sm max-w-2xl">
                  {t.export_text || 'The expression is rarely the deliverable. Here is the file you actually paste.'}
                </p>
              </div>
              <div className="glass-card rounded-3xl p-5 md:p-6 space-y-5">
                <ExportPanel
                  cron={cron}
                  timezone={timezone}
                  t={t}
                  command={command}
                  onCommandChange={setCommand}
                  name={jobName}
                  onNameChange={setJobName}
                  active={activeExport}
                  onActiveChange={setActiveExport}
                />
                <NextStepBar lang={lang} t={t} disabled={!valid} getResult={handoffResult} />
              </div>
            </section>
          )}

          {/* ================================================================ */}
          {/* How it works                                                     */}
          {/* ================================================================ */}
          <section className="space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                {t.howItWorksTitle || 'How it works'}
              </h2>
              <div className="h-1 w-16 bg-violet-500 mx-auto rounded-full" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {steps.map((step, i) => {
                const Art = step.art;
                return (
                  <div
                    key={i}
                    className="relative glass-card rounded-3xl p-6 space-y-4 border border-white/5 hover:border-violet-500/20 transition-all group"
                  >
                    <span className="absolute top-5 right-6 text-5xl font-black text-white/5 group-hover:text-violet-500/10 transition-colors">
                      {i + 1}
                    </span>
                    <Art className="w-24 h-auto" />
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
          {features.length > 0 && (
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((feature: any, idx: number) => {
                const Icon = FEATURE_ICONS[idx] || IconLocal;
                return (
                  <div
                    key={idx}
                    className="p-7 glass-card rounded-3xl text-left hover:-translate-y-1.5 transition-all duration-300 group border border-white/5"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-5 group-hover:scale-110 group-hover:border-violet-500/40 transition-all">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-white text-lg font-bold mb-2.5 group-hover:text-violet-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">{feature.text}</p>
                  </div>
                );
              })}
            </section>
          )}

          {/* ================================================================ */}
          {/* SEO content                                                      */}
          {/* ================================================================ */}
          <section className="space-y-24 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-24 items-center">
              <div className="space-y-7">
                {keywords.length > 0 && (
                  <div className="inline-block px-4 py-1.5 rounded-lg bg-violet-500/10 text-violet-400 text-[11px] font-black uppercase tracking-[0.2em] border border-violet-500/20">
                    {keywords[0]}
                  </div>
                )}
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
                      <span className="w-7 h-7 shrink-0 bg-violet-500/20 text-violet-400 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                      <span className="text-slate-300 font-bold text-sm">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative glass-card rounded-[3rem] p-10 py-16 min-h-[400px] flex flex-col items-center justify-center gap-7 text-center overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-violet-500/10 rounded-full blur-3xl" />
                <IconTimezone className="w-20 h-20 text-violet-400 relative" />
                <div className="space-y-3 max-w-sm relative">
                  <h3 className="text-2xl font-black text-white tracking-tight leading-tight">
                    {t.seoBrowserSpeedTitle}
                  </h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">{t.seoBrowserSpeedText}</p>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-14 rounded-3xl md:rounded-[2.5rem] bg-[#120a1c] border border-white/5 space-y-10">
              <div className="max-w-4xl space-y-4">
                <h2 className="text-2xl md:text-4xl font-black text-white leading-tight">{t.seoSecondaryTitle}</h2>
                <div className="h-1.5 w-20 bg-violet-500 rounded-full" />
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

            {faqs.length > 0 && (
              <div className="max-w-4xl mx-auto w-full space-y-10">
                <div className="text-center space-y-3">
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{t.faqTitle}</h2>
                  <div className="h-1 w-16 bg-violet-500 mx-auto rounded-full" />
                </div>
                <div className="grid gap-3">
                  {faqs.map((faq: any, idx: number) => (
                    <details
                      key={idx}
                      className="glass-card rounded-2xl px-6 py-5 text-left border border-white/5 hover:border-violet-500/20 transition-colors group [&_summary::-webkit-details-marker]:hidden"
                    >
                      <summary className="flex items-start gap-3 cursor-pointer list-none text-base font-bold text-white group-hover:text-violet-400 transition-colors">
                        <span className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 text-[11px] font-black">
                          Q
                        </span>
                        <span className="flex-1">{faq.question}</span>
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
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                  {t.seoKeywordsTitle || 'Keywords'}
                </h2>
                <div className="flex flex-wrap justify-center gap-2">
                  {keywords.map((keyword: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 hover:bg-violet-500/10 hover:border-violet-500/20 hover:text-violet-400 transition-all cursor-default"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <AdBanner id="adsense-cron-flow-bottom" />
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

/** "5m", "2h", "1d" — the constant gap between runs, when there is one. */
function countdownLabel(ms: number, t: any): string {
  const seconds = Math.round(ms / 1000);
  if (seconds % 86400 === 0) return `${seconds / 86400}${t.unit_day || 'd'}`;
  if (seconds % 3600 === 0) return `${seconds / 3600}${t.unit_hour || 'h'}`;
  if (seconds % 60 === 0) return `${seconds / 60}${t.unit_minute || 'm'}`;
  return `${seconds}${t.unit_second || 's'}`;
}
