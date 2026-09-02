import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, Check, Clock, Copy, Sun, Zap } from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { ZonePicker } from './components/ZonePicker';
import {
  HeroArt,
  IconDst,
  IconOffline,
  IconPrecise,
  IconSystems,
  IconUnits,
  IconZones,
  StepCompare,
  StepPaste,
  StepRead,
  StepZone,
} from './components/Illustrations';
import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';
import { allSystems, detectUnit, formatStamp, nsToMs, parseStamp, subMs } from './lib/epochs';
import {
  dateToWallClock,
  formatIn,
  isoIn,
  localZone,
  offsetLabel,
  relative,
  wallClockToDate,
  weekdayIn,
  zoneInfo,
} from './lib/format';
import { SYSTEM_SPECS, SYSTEMS, UNITS, type System, type Unit } from './types';

interface EpochFlowProps {
  lang: string;
  dictionary: any;
}

const CopyCard: React.FC<{
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  copyLabel: string;
  copiedLabel: string;
}> = ({ label, value, copied, onCopy, copyLabel, copiedLabel }) => (
  <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 space-y-3 hover:border-sky-500/20 transition-colors">
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] font-black uppercase tracking-widest text-sky-400/80">{label}</span>
      <button
        onClick={onCopy}
        disabled={!value}
        title={copied ? copiedLabel : copyLabel}
        aria-label={copied ? copiedLabel : `${copyLabel}: ${label}`}
        className={`w-8 h-8 shrink-0 rounded-lg border flex items-center justify-center transition-all cursor-pointer outline-none ${
          copied
            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
            : 'bg-white/5 border-white/5 hover:bg-sky-500/20 hover:border-sky-500/30 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed'
        }`}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
    <div className="font-mono text-sm text-white break-all min-h-[1.25rem] select-all">
      {value || <span className="text-slate-600">—</span>}
    </div>
  </div>
);

const UNIT_LABEL: Record<Unit, string> = { s: 's', ms: 'ms', us: 'µs', ns: 'ns' };

export default function EpochFlow({ lang, dictionary }: EpochFlowProps) {
  const t = dictionary || {};

  // Nothing time-dependent may be rendered before hydration: this island is
  // server-rendered, and Date.now() or a zone-aware format would differ between
  // the two passes and blow the hydration up.
  const [mounted, setMounted] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    setMounted(true);
    setTick(Date.now());
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [rawInput, setRawInput] = useState('');
  const [system, setSystem] = useState<System>('unix');
  const [unit, setUnit] = useState<Unit>('s');
  const [unitPinned, setUnitPinned] = useState(false);
  const [zone, setZone] = useState('UTC');
  const [wallInput, setWallInput] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // The visitor's own zone can only be read in the browser.
  useEffect(() => setZone(localZone()), []);

  useEffect(() => {
    if (!mounted || rawInput !== '') return;
    const now = Date.now();
    setRawInput(String(Math.floor(now / 1000)));
    setWallInput(dateToWallClock(new Date(now), localZone()).slice(0, 19));
  }, [mounted, rawInput]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 700);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // The old copy handler left a dangling timer behind on unmount.
  useEffect(() => {
    if (!copiedField) return;
    const id = setTimeout(() => setCopiedField(null), 1800);
    return () => clearTimeout(id);
  }, [copiedField]);

  const copy = useCallback((field: string, value: string) => {
    if (!value) return;
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopiedField(field);
  }, []);

  // --- detection ------------------------------------------------------------

  const detection = useMemo(
    () => (system === 'unix' && tick ? detectUnit(rawInput, tick) : null),
    [rawInput, system, tick]
  );

  // The guess only moves the selector while the user has not chosen a unit
  // themselves: a heuristic about somebody else's log format is a suggestion,
  // never a decision.
  useEffect(() => {
    if (!detection || unitPinned || !detection.confident) return;
    if (detection.unit !== unit) setUnit(detection.unit);
  }, [detection, unit, unitPinned]);

  // --- parsing --------------------------------------------------------------

  const parsed = useMemo(() => parseStamp(rawInput, system, unit), [rawInput, system, unit]);
  const valid = !parsed.error;
  const date = useMemo(() => (valid ? new Date(nsToMs(parsed.ns)) : null), [parsed.ns, valid]);
  const fraction = useMemo(() => subMs(parsed.ns), [parsed.ns]);

  const info = useMemo(() => (mounted && date ? zoneInfo(date, zone, lang) : null), [date, zone, lang, mounted]);

  const outputs = useMemo(() => {
    if (!mounted || !date) return null;
    return {
      iso: isoIn(date, zone),
      isoUtc: date.toISOString(),
      local: formatIn(date, zone, lang),
      weekday: weekdayIn(date, zone, lang),
      relative: tick ? relative(date.getTime() - tick, lang) : '',
      rfc: date.toUTCString(),
    };
  }, [date, zone, lang, tick, mounted]);

  const systemsTable = useMemo(() => (valid ? allSystems(parsed.ns, unit) : []), [parsed.ns, unit, valid]);

  // --- date -> timestamp ----------------------------------------------------

  const wallDate = useMemo(() => (mounted ? wallClockToDate(wallInput, zone) : null), [wallInput, zone, mounted]);

  const pushNow = useCallback(() => {
    const now = Date.now();
    setSystem('unix');
    setUnit('s');
    setUnitPinned(true);
    setRawInput(String(Math.floor(now / 1000)));
    setWallInput(dateToWallClock(new Date(now), zone).slice(0, 19));
  }, [zone]);

  const stampToPicker = useCallback(() => {
    if (!date) return;
    setWallInput(dateToWallClock(date, zone).slice(0, 19));
  }, [date, zone]);

  const pickerToStamp = useCallback(() => {
    if (!wallDate) return;
    const ns = BigInt(wallDate.getTime()) * 1_000_000n;
    setRawInput(formatStamp(ns, system, unit));
  }, [wallDate, system, unit]);

  // --- copy for content sections -------------------------------------------

  const steps = [
    { art: StepPaste, title: t.step1Title || 'Paste the number', text: t.step1Text || 'Seconds, milliseconds, microseconds or nanoseconds. The guess is shown, and you can overrule it.' },
    { art: StepZone, title: t.step2Title || 'Pick the zone', text: t.step2Text || 'Every IANA zone your browser knows, with its offset at that exact instant — not today’s.' },
    { art: StepCompare, title: t.step3Title || 'Compare the systems', text: t.step3Text || 'The same instant as a Windows FILETIME, .NET ticks, an Excel serial and a Julian day.' },
    { art: StepRead, title: t.step4Title || 'Read it in your language', text: t.step4Text || 'Weekday, full date and “two years ago” come from Intl, so they are right in all nine languages.' },
  ];

  const features = [
    { icon: IconPrecise, title: t.feat1Title || 'Nanoseconds survive', text: t.feat1Text || 'Timestamps are carried as BigInt, so a nanosecond value is not rounded off the way a JavaScript number rounds it.' },
    { icon: IconUnits, title: t.feat2Title || 'You choose the unit', text: t.feat2Text || 'Seconds, ms, µs and ns, detected by which reading lands on a believable date and overridable at any time.' },
    { icon: IconZones, title: t.feat3Title || 'Real time zones', text: t.feat3Text || 'Any IANA zone, with the offset that applied at that instant rather than the one in force today.' },
    { icon: IconDst, title: t.feat4Title || 'Tells you about DST', text: t.feat4Text || 'Says whether the instant fell in daylight saving, and what the zone’s standard offset is.' },
    { icon: IconSystems, title: t.feat5Title || 'Not only Unix', text: t.feat5Text || 'Windows FILETIME, .NET ticks, Apple/Cocoa, Excel serials and Julian days, both ways.' },
    { icon: IconOffline, title: t.feat6Title || 'Never leaves the page', text: t.feat6Text || 'Everything is computed in your browser. Nothing is uploaded and nothing is stored.' },
  ];

  const faq: { question: string; answer: string }[] = Array.isArray(t.faq) ? t.faq : [];

  const errorText =
    parsed.error === 'nan'
      ? t.errorNotANumber || 'That is not a number.'
      : parsed.error === 'range'
      ? t.errorOutOfRange || 'That instant is outside the range a date can represent.'
      : '';

  /**
   * Reinicio desde el nombre de la herramienta en la cabecera.
   * Vacia la entrada y vuelve a Unix/segundos/UTC.
   * El scroll arriba lo pone withScrollToTop en el propio Header.
   */
  const handleSoftReset = () => {
    setRawInput('');
    setSystem('unix');
    setUnit('s');
    setUnitPinned(false);
    setZone('UTC');
    setWallInput('');
    setCopiedField(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#020813] text-slate-200 font-sans relative overflow-x-hidden pt-36 md:pt-24">
      <Header
        onReset={handleSoftReset} currentLang={lang} onLanguageChange={l => (window.location.href = `/${l.toLowerCase()}/epoch-flow`)} t={t} />

      {/* The max width lives on <main>: AdRail measures this element to decide
          whether the fixed side rails fit, so reserving 440px from 1400px up is
          what keeps them visible instead of silently suppressed. */}
      <main className="flex-grow w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))] px-4 md:px-8 py-8 relative z-10 flex flex-col gap-12 md:gap-20">
        <AdBanner id="adsense-epoch-flow-top" />

        {/* Hero ------------------------------------------------------------ */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-sky-500/25 bg-sky-500/10 text-[11px] font-black uppercase tracking-[0.2em] text-sky-300">
              <Clock className="w-3.5 h-3.5" />
              {t.heroBadge || 'Runs in your browser'}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-[1.1]">
              {t.seoHeroTitle || 'EpochFlow'}
            </h1>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-xl">{t.seoHeroText}</p>
            <a
              href="#how-it-works"
              className="inline-block px-5 py-3 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:border-sky-500/30 font-bold text-sm transition-all"
            >
              {t.heroSecondary || 'See how it works'}
            </a>
          </div>
          <HeroArt className="w-full h-auto max-w-lg mx-auto" />
        </section>

        {/* Live bar --------------------------------------------------------- */}
        <section className="flex items-center justify-between flex-wrap gap-4 bg-sky-500/5 border border-sky-500/20 rounded-2xl px-5 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-sky-400" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-widest text-sky-400/80">
                {t.label_live_epoch || 'Live Unix Epoch'}
              </div>
              {/* Empty until mounted: a clock rendered on the server is wrong by
                  definition and would not match on hydration. */}
              <div className="font-mono text-lg font-bold text-white tabular-nums h-7">
                {tick ? Math.floor(tick / 1000) : ''}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {mounted && <ZonePicker value={zone} at={date || new Date(tick || 0)} onChange={setZone} t={t} />}
            <button
              onClick={pushNow}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500/20 border border-sky-500/40 hover:bg-sky-500/30 text-sky-300 hover:text-white text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
            >
              <Zap className="w-4 h-4" />
              {t.button_now || 'Now'}
            </button>
          </div>
        </section>

        {/* Converter -------------------------------------------------------- */}
        <section className="flex flex-col bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl p-5 md:p-8 space-y-6">
          {/* system + unit */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex flex-wrap rounded-2xl bg-slate-950/60 border border-white/5 p-1">
              {SYSTEMS.map(s => (
                <button
                  key={s}
                  onClick={() => setSystem(s)}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                    system === s ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {SYSTEM_SPECS[s].label}
                </button>
              ))}
            </div>

            {system === 'unix' && (
              <div className="inline-flex rounded-2xl bg-slate-950/60 border border-white/5 p-1">
                {UNITS.map(u => (
                  <button
                    key={u}
                    onClick={() => {
                      setUnit(u);
                      setUnitPinned(true);
                    }}
                    className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                      unit === u ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {UNIT_LABEL[u]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-500">
            {t[`sysHint_${system}`] || SYSTEM_SPECS[system].hint}
            {system === 'unix' && detection && detection.confident && !unitPinned && (
              <span className="text-sky-400/80">
                {' · '}
                {(t.unitGuess || 'read as {u}, which lands in {y}')
                  .replace('{u}', UNIT_LABEL[detection.unit])
                  .replace('{y}', String(detection.year))}
              </span>
            )}
          </p>

          {/* timestamp input */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-sky-400 uppercase tracking-widest" htmlFor="ef-stamp">
              {t.label_epoch_input || 'Timestamp'}
            </label>
            <input
              id="ef-stamp"
              type="text"
              value={rawInput}
              onChange={e => setRawInput(e.target.value)}
              spellCheck={false}
              inputMode="numeric"
              aria-invalid={!!errorText}
              className={`w-full px-4 py-4 rounded-2xl bg-slate-950/50 border font-mono text-sm tracking-wider text-white outline-none transition-colors ${
                errorText ? 'border-red-500/50' : 'border-white/5 focus:border-sky-500/50'
              }`}
            />
            {errorText && <p className="text-xs font-bold text-red-400">{errorText}</p>}
          </div>

          {/* outputs */}
          {outputs && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CopyCard label={t.out_iso_zone || 'ISO 8601 (in the zone)'} value={outputs.iso} copied={copiedField === 'iso'} onCopy={() => copy('iso', outputs.iso)} copyLabel={t.tooltip_copy || 'Copy'} copiedLabel={t.emailCopied || 'Copied!'} />
              <CopyCard label={t.out_iso_utc || 'ISO 8601 (UTC)'} value={outputs.isoUtc} copied={copiedField === 'isoUtc'} onCopy={() => copy('isoUtc', outputs.isoUtc)} copyLabel={t.tooltip_copy || 'Copy'} copiedLabel={t.emailCopied || 'Copied!'} />
              <CopyCard label={t.out_local || 'Full date'} value={outputs.local} copied={copiedField === 'local'} onCopy={() => copy('local', outputs.local)} copyLabel={t.tooltip_copy || 'Copy'} copiedLabel={t.emailCopied || 'Copied!'} />
              <CopyCard label={t.out_rfc || 'RFC 1123 (UTC)'} value={outputs.rfc} copied={copiedField === 'rfc'} onCopy={() => copy('rfc', outputs.rfc)} copyLabel={t.tooltip_copy || 'Copy'} copiedLabel={t.emailCopied || 'Copied!'} />
            </div>
          )}

          {outputs && info && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-sky-400/80">
                  {t.out_weekday || 'Weekday'}
                </span>
                <p className="text-sm text-white">{outputs.weekday}</p>
              </div>
              <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-sky-400/80">
                  {t.out_relative || 'Relative'}
                </span>
                <p className="text-sm text-white">{outputs.relative}</p>
              </div>
              <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 space-y-1.5">
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-sky-400/80">
                  <Sun className="w-3 h-3" />
                  {t.out_offset || 'Offset at that moment'}
                </span>
                <p className="text-sm text-white font-mono">
                  UTC{offsetLabel(info.offsetMinutes)}
                  {info.abbreviation ? ` · ${info.abbreviation}` : ''}
                </p>
                <p className="text-[11px] text-slate-500">
                  {info.isDst
                    ? (t.dstOn || 'Daylight saving — standard is UTC{s}').replace('{s}', offsetLabel(info.standardOffsetMinutes))
                    : t.dstOff || 'Standard time, no daylight saving'}
                </p>
              </div>
            </div>
          )}

          {valid && (fraction.us > 0 || fraction.ns > 0) && (
            <p className="text-[11px] text-slate-500 font-mono">
              {(t.subMillisecond || 'Plus {us} µs and {ns} ns below the millisecond')
                .replace('{us}', String(fraction.us))
                .replace('{ns}', String(fraction.ns))}
            </p>
          )}

          {/* date picker <-> timestamp */}
          <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-sky-400/80">
              {t.label_date_input || 'Pick a date and time'}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="datetime-local"
                step="1"
                value={wallInput}
                onChange={e => setWallInput(e.target.value)}
                aria-label={t.label_date_input || 'Pick a date and time'}
                className="flex-1 min-w-[13rem] px-3 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 focus:border-sky-500/50 font-mono text-sm text-white outline-none transition-colors [color-scheme:dark]"
              />
              <button
                onClick={stampToPicker}
                disabled={!date}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:border-sky-500/30 text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                {t.button_to_picker || 'From the timestamp'}
              </button>
              <button
                onClick={pickerToStamp}
                disabled={!wallDate}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-sky-500 text-[#020813] text-xs font-black hover:bg-sky-400 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {t.button_to_stamp || 'To the timestamp'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              {(t.wallClockNote || 'The date above is wall-clock time in {z}.').replace('{z}', zone.replace(/_/g, ' '))}
            </p>
          </div>

          {/* every system at once */}
          {systemsTable.length > 0 && (
            <div className="rounded-2xl border border-white/5 bg-slate-950/40 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-sky-400/80">
                  {t.allSystemsTitle || 'The same instant in every system'}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <tbody>
                    {systemsTable.map(row => (
                      <tr key={row.id} className="border-b border-white/5 last:border-0">
                        <td className="px-4 py-2.5 font-bold text-slate-300 whitespace-nowrap">
                          {SYSTEM_SPECS[row.id].label}
                          {row.id === 'unix' ? ` (${UNIT_LABEL[unit]})` : ''}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-white break-all">{row.value}</td>
                        <td className="px-2 py-2.5 w-10">
                          <button
                            onClick={() => copy(`sys-${row.id}`, row.value)}
                            aria-label={`${t.tooltip_copy || 'Copy'}: ${SYSTEM_SPECS[row.id].label}`}
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                              copiedField === `sys-${row.id}`
                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                : 'bg-white/5 border-white/5 hover:bg-sky-500/20 text-slate-400 hover:text-white'
                            }`}
                          >
                            {copiedField === `sys-${row.id}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <AdBanner id="adsense-epoch-flow-mid" />

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
                    <span className="w-5 h-5 rounded-md bg-sky-500/15 text-sky-300 text-[11px] font-black flex items-center justify-center shrink-0">
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
                  <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none text-sm font-bold text-white hover:text-sky-300 transition-colors">
                    <span>{item.question}</span>
                    <span className="text-sky-400 text-lg leading-none shrink-0 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="px-5 pb-5 text-sm text-slate-400 leading-relaxed">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <AdBanner id="adsense-epoch-flow-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={m => setLegalModal(m)} />

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={t.scrollTop || 'Back to top'}
          className="fixed bottom-6 right-6 z-[190] w-11 h-11 rounded-full bg-sky-500 text-[#020813] flex items-center justify-center shadow-lg shadow-sky-500/30 hover:bg-sky-400 transition-all cursor-pointer"
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
