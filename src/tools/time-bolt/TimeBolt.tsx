import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowUp, CalendarPlus, Check, Copy, Globe, Plus, Search, Trash2, X } from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { OverlapGrid } from './components/OverlapGrid';
import {
  HeroArt,
  IconCalendar,
  IconDst,
  IconGrid,
  IconOffline,
  IconSave,
  IconZones,
  StepAdd,
  StepGrid,
  StepShare,
  StepWarn,
} from './components/Illustrations';
import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';
import { allZones, entryFor, localZone, searchZones } from './lib/zones';
import {
  dateKey,
  formatClock,
  instantFrom,
  skippedHourOfDay,
  nextTransition,
  offsetLabel,
  zoneNow,
} from './lib/time';
import { buildIcs, buildSummary } from './lib/ics';
import { DEFAULT_WORKING, STORAGE_KEY, type ZoneEntry } from './types';

interface TimeBoltProps {
  lang: string;
  dictionary: any;
}

const pad = (n: number) => String(n).padStart(2, '0');

function download(text: string, name: string, type: string) {
  const blob = new Blob([text], { type });
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

const DEFAULT_TZS = ['America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney'];

export default function TimeBolt({ lang, dictionary }: TimeBoltProps) {
  const t = dictionary || {};

  // Nothing time- or locale-dependent may render before hydration: this island
  // is server-rendered, and `new Date()` or the visitor's own zone would differ
  // between the two passes.
  const [mounted, setMounted] = useState(false);
  const [tick, setTick] = useState(0);

  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [catalogue, setCatalogue] = useState<ZoneEntry[]>([]);
  const [zones, setZones] = useState<ZoneEntry[]>([]);
  const [refTz, setRefTz] = useState('UTC');
  const [dayKeyState, setDayKeyState] = useState('');
  const [selectedHour, setSelectedHour] = useState(9);
  const [working, setWorking] = useState(DEFAULT_WORKING);
  const [use24, setUse24] = useState(true);
  const [duration, setDuration] = useState(60);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    setTick(Date.now());
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Catalogue, saved zones and the visitor's own zone can only be read in the
  // browser, so they are all filled in after mount.
  useEffect(() => {
    const list = allZones();
    setCatalogue(list);
    const home = localZone();
    setRefTz(home);

    let restored: ZoneEntry[] | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          restored = parsed
            .filter((z: any) => z && typeof z.tz === 'string')
            .map((z: any) => entryFor(z.tz, list));
        }
      }
    } catch {
      // Private mode or a corrupted value; falling back to the defaults.
    }

    const base = restored || [home, ...DEFAULT_TZS.filter(z => z !== home)].map(tz => entryFor(tz, list));
    setZones(base);
    setDayKeyState(dateKey(home, new Date()));
  }, []);

  // The old version kept nothing: every added zone was lost on reload.
  useEffect(() => {
    if (!mounted || zones.length === 0) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(zones.map(z => ({ tz: z.tz }))));
    } catch {
      // Storage refused; the session still works, it just will not come back.
    }
  }, [zones, mounted]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 700);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // The old copy handler left a dangling timer behind on unmount.
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(null), 1800);
    return () => clearTimeout(id);
  }, [copied]);

  useEffect(() => {
    if (!searchOpen) return;
    const close = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [searchOpen]);

  const copyText = useCallback((key: string, value: string) => {
    if (!value) return;
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopied(key);
  }, []);

  // --- clocks ---------------------------------------------------------------

  const now = useMemo(() => (tick ? new Date(tick) : null), [tick]);
  const refKey = useMemo(() => (now ? dateKey(refTz, now) : ''), [refTz, now]);

  const clocks = useMemo(() => {
    if (!now) return [];
    return zones.map(z => ({ zone: z, info: zoneNow(z.tz, now, refKey, lang) }));
  }, [zones, now, refKey, lang]);

  // --- planner --------------------------------------------------------------

  const dayStartMs = useMemo(() => {
    if (!dayKeyState) return 0;
    const [y, mo, d] = dayKeyState.split('-').map(Number);
    if (!y || !mo || !d) return 0;
    return instantFrom(refTz, y, mo, d, 0, 0);
  }, [dayKeyState, refTz]);

  const meetingMs = dayStartMs + selectedHour * 3600000;

  /** The hour the reference zone skips that day, if it skips one at all. */
  const skippedHour = useMemo(
    () => (dayStartMs ? skippedHourOfDay(refTz, dayStartMs) : null),
    [refTz, dayStartMs]
  );

  /** Zones whose clocks change on the chosen day: the classic planning trap. */
  const dstWarnings = useMemo(() => {
    if (!dayStartMs) return [];
    const dayEnd = dayStartMs + 86400000;
    return zones
      .map(z => {
        const tr = nextTransition(z.tz, new Date(dayStartMs - 1), 2);
        if (!tr || tr.at >= dayEnd) return null;
        return { zone: z, transition: tr };
      })
      .filter(Boolean) as { zone: ZoneEntry; transition: { at: number; beforeMinutes: number; afterMinutes: number } }[];
  }, [zones, dayStartMs]);

  const summary = useMemo(
    () => (mounted && dayStartMs ? buildSummary(meetingMs, zones, lang) : ''),
    [meetingMs, zones, lang, mounted, dayStartMs]
  );

  const exportIcs = useCallback(() => {
    const title = (t.meetingTitle || 'Meeting').toString();
    download(
      buildIcs({
        startMs: meetingMs,
        durationMinutes: duration,
        title,
        zones,
        lines: summary.split('\n'),
      }),
      'meeting.ics',
      'text/calendar'
    );
  }, [meetingMs, duration, zones, summary, t]);

  // --- zone list ------------------------------------------------------------

  const results = useMemo(() => searchZones(catalogue, query), [catalogue, query]);

  const addZone = useCallback((z: ZoneEntry) => {
    setZones(prev => (prev.some(a => a.tz === z.tz) ? prev : [...prev, z]));
  }, []);

  const removeZone = useCallback(
    (z: ZoneEntry) => {
      setZones(prev => prev.filter(a => a.tz !== z.tz));
      if (refTz === z.tz) setRefTz(prev => (zones.find(a => a.tz !== z.tz)?.tz ?? prev));
    },
    [refTz, zones]
  );

  const steps = [
    { art: StepAdd, title: t.step1Title || 'Add the places', text: t.step1Text || 'Search any city or zone your browser knows — around 400 of them, not a short hard-coded list.' },
    { art: StepGrid, title: t.step2Title || 'Read the overlap', text: t.step2Text || 'Twenty-four columns, one row per place. Green is working hours, and the number on top counts who is at work.' },
    { art: StepWarn, title: t.step3Title || 'Watch the clock changes', text: t.step3Text || 'If a zone shifts its clocks that day, or the hour you picked does not exist, it says so.' },
    { art: StepShare, title: t.step4Title || 'Send it out', text: t.step4Text || 'Copy the times as text, or download an .ics you can drop into any calendar.' },
  ];

  const features = [
    { icon: IconGrid, title: t.feat1Title || 'A real overlap grid', text: t.feat1Text || 'Every hour of the day against every place at once, so the good slot is visible instead of calculated by hand.' },
    { icon: IconZones, title: t.feat2Title || 'Every zone, not a shortlist', text: t.feat2Text || 'The whole IANA list from your browser, searchable by city, country or identifier, accents ignored.' },
    { icon: IconDst, title: t.feat3Title || 'Honest about DST', text: t.feat3Text || 'Warns when clocks move that day and refuses to pretend the skipped hour exists.' },
    { icon: IconCalendar, title: t.feat4Title || 'Straight into a calendar', text: t.feat4Text || 'An .ics file built in the page, with every local time listed in the description.' },
    { icon: IconSave, title: t.feat5Title || 'Remembers your places', text: t.feat5Text || 'The list of zones is kept in your browser, so it is still there tomorrow.' },
    { icon: IconOffline, title: t.feat6Title || 'Never leaves the page', text: t.feat6Text || 'Time-zone data comes from your own browser. Nothing is uploaded and nothing is tracked.' },
  ];

  const faq: { question: string; answer: string }[] = Array.isArray(t.faq) ? t.faq : [];

  /**
   * Reinicio desde el nombre de la herramienta en la cabecera.
   * Vuelve a la referencia y la franja por defecto. Las zonas elegidas se mantienen: son el trabajo del usuario, no estado pasajero.
   * El scroll arriba lo pone withScrollToTop en el propio Header.
   */
  const handleSoftReset = () => {
    setRefTz('UTC');
    setSelectedHour(9);
    setWorking(DEFAULT_WORKING);
    setDuration(60);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#020a08] text-slate-200 font-sans relative overflow-x-hidden pt-36 md:pt-24">
      <Header
        onReset={handleSoftReset} currentLang={lang} onLanguageChange={l => (window.location.href = `/${l.toLowerCase()}/time-bolt`)} t={t} />

      {/* The max width lives on <main>: AdRail measures this element to decide
          whether the fixed side rails fit, so reserving 440px from 1400px up is
          what keeps them visible instead of silently suppressed. */}
      <main className="flex-grow w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))] px-4 md:px-8 py-8 relative z-10 flex flex-col gap-12 md:gap-20">
        <AdBanner id="adsense-time-bolt-top" />

        {/* Hero ------------------------------------------------------------ */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-300">
              <Globe className="w-3.5 h-3.5" />
              {t.heroBadge || 'Runs in your browser'}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-[1.1]">
              {t.seoHeroTitle || 'TimeBolt'}
            </h1>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-xl">{t.seoHeroText}</p>
            <a
              href="#how-it-works"
              className="inline-block px-5 py-3 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:border-emerald-500/30 font-bold text-sm transition-all"
            >
              {t.heroSecondary || 'See how it works'}
            </a>
          </div>
          <HeroArt className="w-full h-auto max-w-lg mx-auto" />
        </section>

        {/* Clocks ----------------------------------------------------------- */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-black uppercase tracking-widest text-emerald-400/80">
              {t.section_world_clocks || 'World Clocks'}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUse24(v => !v)}
                className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
              >
                {use24 ? '24h' : '12h'}
              </button>
              <div ref={searchRef} className="relative">
                <button
                  onClick={() => setSearchOpen(o => !o)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:text-white hover:bg-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  {t.button_add_timezone || 'Add timezone'}
                </button>

                {searchOpen && (
                  <div className="absolute right-0 z-40 mt-2 w-[min(24rem,calc(100vw-3rem))] rounded-2xl border border-emerald-500/25 bg-[#020a08] shadow-2xl shadow-black/60 overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10">
                      <Search className="w-4 h-4 text-slate-500 shrink-0" />
                      <input
                        autoFocus
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder={t.search_timezones || 'Search city, country or timezone…'}
                        className="flex-1 bg-transparent text-sm text-white outline-none placeholder-slate-600"
                      />
                      {query && (
                        <button
                          onClick={() => setQuery('')}
                          aria-label={t.clear || 'Clear'}
                          className="p-1 rounded text-slate-500 hover:text-white cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {results.length === 0 && (
                        <p className="px-4 py-6 text-center text-xs text-slate-600">
                          {t.search_no_results || 'No timezones match your search.'}
                        </p>
                      )}
                      {results.map(z => {
                        const already = zones.some(a => a.tz === z.tz);
                        return (
                          <button
                            key={z.tz}
                            onClick={() => addZone(z)}
                            disabled={already}
                            className={`w-full flex items-center justify-between gap-3 px-4 py-2 text-left text-xs transition-colors ${
                              already ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:bg-white/5 cursor-pointer'
                            }`}
                          >
                            <span className="truncate">
                              <span className="font-bold text-white">{z.city}</span>
                              {z.country ? <span className="text-slate-500"> · {z.country}</span> : null}
                            </span>
                            <span className="font-mono text-[10px] text-slate-600 shrink-0">{z.tz}</span>
                          </button>
                        );
                      })}
                    </div>
                    {catalogue.length > 0 && (
                      <p className="px-4 py-2 text-[10px] text-slate-600 border-t border-white/5">
                        {(t.zoneCount || '{shown} of {total} zones — type to narrow')
                          .replace('{shown}', String(results.length))
                          .replace('{total}', String(catalogue.length))}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {clocks.length === 0 ? (
            <p className="rounded-2xl border border-white/5 bg-slate-950/40 px-5 py-8 text-center text-xs text-slate-600">
              {t.empty_clocks || 'No timezones yet. Add one above.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {clocks.map(({ zone, info }) => (
                <div
                  key={zone.tz}
                  className={`rounded-2xl border p-4 space-y-2 transition-colors ${
                    zone.tz === refTz ? 'border-emerald-500/40 bg-emerald-500/[0.07]' : 'border-white/5 bg-slate-950/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-white truncate">{zone.city}</p>
                      <p className="text-[11px] text-slate-500 truncate">{zone.country || zone.tz}</p>
                    </div>
                    <button
                      onClick={() => removeZone(zone)}
                      aria-label={`${t.remove || 'Remove'} ${zone.city}`}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="font-mono text-2xl font-bold text-white tabular-nums">
                    {formatClock(info.hour, info.minute, use24)}
                    <span className="text-sm text-slate-500">:{pad(info.second)}</span>
                  </p>
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-slate-400">
                      {info.weekday}
                      {info.dayShift !== 0 && (
                        <span className="text-emerald-400 font-bold">
                          {' '}
                          {info.dayShift > 0 ? t.nextDay || '(+1 day)' : t.prevDay || '(−1 day)'}
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-slate-500">{offsetLabel(info.offsetMinutes)}</span>
                  </div>
                  <button
                    onClick={() => setRefTz(zone.tz)}
                    disabled={zone.tz === refTz}
                    className="w-full mt-1 py-1.5 rounded-lg border border-white/10 text-[11px] font-bold text-slate-400 hover:text-emerald-300 hover:border-emerald-500/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {zone.tz === refTz ? t.isReference || 'Reference zone' : t.makeReference || 'Use as reference'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Planner ---------------------------------------------------------- */}
        <section className="space-y-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-emerald-400/80">
            {t.section_meeting_planner || 'Meeting Planner'}
          </h2>

          <div className="flex flex-wrap items-end gap-3">
            <label className="space-y-1.5">
              <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500">
                {t.planner_date || 'Date'}
              </span>
              <input
                type="date"
                value={dayKeyState}
                onChange={e => setDayKeyState(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 focus:border-emerald-500/50 font-mono text-sm text-white outline-none transition-colors [color-scheme:dark]"
              />
            </label>
            <label className="space-y-1.5">
              <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500">
                {t.workingHours || 'Working hours'}
              </span>
              <span className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={working.start}
                  onChange={e => setWorking(w => ({ ...w, start: Math.min(23, Math.max(0, Number(e.target.value))) }))}
                  aria-label={t.workStart || 'Start of working hours'}
                  className="w-16 px-2 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 font-mono text-sm text-white outline-none focus:border-emerald-500/50"
                />
                <span className="text-slate-600">–</span>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={working.end}
                  onChange={e => setWorking(w => ({ ...w, end: Math.min(24, Math.max(1, Number(e.target.value))) }))}
                  aria-label={t.workEnd || 'End of working hours'}
                  className="w-16 px-2 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 font-mono text-sm text-white outline-none focus:border-emerald-500/50"
                />
              </span>
            </label>
            <label className="space-y-1.5">
              <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500">
                {t.duration || 'Length (min)'}
              </span>
              <input
                type="number"
                min={15}
                step={15}
                value={duration}
                onChange={e => setDuration(Math.max(15, Number(e.target.value)))}
                className="w-24 px-3 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 font-mono text-sm text-white outline-none focus:border-emerald-500/50"
              />
            </label>
          </div>

          {mounted && zones.length > 0 && dayStartMs > 0 && (
            <OverlapGrid
              zones={zones}
              dayStartMs={dayStartMs}
              selected={selectedHour}
              onSelect={setSelectedHour}
              working={working}
              locale={lang}
              t={t}
            />
          )}

          {skippedHour !== null && (
            <p className="flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs font-bold text-amber-200">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              {(t.skippedHour || '{h}:00 does not exist in {z} that day: the clocks jump straight over it.')
                .replace('{h}', String(skippedHour).padStart(2, '0'))
                .replace('{z}', entryFor(refTz, catalogue).city)}
            </p>
          )}

          {dstWarnings.length > 0 && (
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3 space-y-1.5">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5" />
                {t.dstWarningTitle || 'Clocks change that day'}
              </p>
              {dstWarnings.map(w => (
                <p key={w.zone.tz} className="text-[11px] text-amber-100/80">
                  {(t.dstWarningLine || '{city}: {from} becomes {to}')
                    .replace('{city}', w.zone.city)
                    .replace('{from}', offsetLabel(w.transition.beforeMinutes))
                    .replace('{to}', offsetLabel(w.transition.afterMinutes))}
                </p>
              ))}
            </div>
          )}

          {mounted && summary && (
            <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400/80">
                  {t.summaryTitle || 'The meeting, everywhere'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyText('summary', summary)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      copied === 'summary'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:text-white hover:border-emerald-500/30'
                    }`}
                  >
                    {copied === 'summary' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied === 'summary' ? t.copied || 'Copied' : t.copyTimes || 'Copy the times'}
                  </button>
                  <button
                    onClick={exportIcs}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500 text-[#020a08] text-xs font-black hover:bg-emerald-400 transition-all cursor-pointer"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    {t.downloadIcs || 'Download .ics'}
                  </button>
                </div>
              </div>
              <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap break-words">{summary}</pre>
            </div>
          )}
        </section>

        <AdBanner id="adsense-time-bolt-mid" />

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
                    <span className="w-5 h-5 rounded-md bg-emerald-500/15 text-emerald-300 text-[11px] font-black flex items-center justify-center shrink-0">
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
                  <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none text-sm font-bold text-white hover:text-emerald-300 transition-colors">
                    <span>{item.question}</span>
                    <span className="text-emerald-400 text-lg leading-none shrink-0 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="px-5 pb-5 text-sm text-slate-400 leading-relaxed">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <AdBanner id="adsense-time-bolt-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={m => setLegalModal(m)} />

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={t.scrollTop || 'Back to top'}
          className="fixed bottom-6 right-6 z-[190] w-11 h-11 rounded-full bg-emerald-500 text-[#020a08] flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-all cursor-pointer"
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
