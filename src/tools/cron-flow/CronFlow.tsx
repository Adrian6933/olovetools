import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AdBanner } from '../../components/shared/AdBanner';
import { LegalModal } from './components/LegalModal';
import { Clock, Copy, Check, RotateCcw, Calendar, Play, Zap } from 'lucide-react';
import { legalTranslations } from '../../locales/legal';

interface CronFlowProps {
  lang: string;
  dictionary: any;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_ALIASES: Record<string, number> = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };
const WEEKDAY_ALIASES: Record<string, number> = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };

type FieldKind = 'minute' | 'hour' | 'day' | 'month' | 'weekday';

interface ParsedCron {
  minute: number[] | null;
  hour: number[] | null;
  day: number[] | null;
  month: number[] | null;
  weekday: number[] | null;
  dayRestricted: boolean;
  weekdayRestricted: boolean;
  raw: string[];
  error?: string;
}

const SEGMENTS: { key: FieldKind; label: string; sub: string }[] = [
  { key: 'minute', label: 'Minute', sub: '0-59' },
  { key: 'hour', label: 'Hour', sub: '0-23' },
  { key: 'day', label: 'Day', sub: '1-31' },
  { key: 'month', label: 'Month', sub: '1-12' },
  { key: 'weekday', label: 'Weekday', sub: '0-6' },
];

const PRESETS: { label: string; value: string }[] = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 5 minutes', value: '*/5 * * * *' },
  { label: 'Hourly', value: '0 * * * *' },
  { label: 'Daily', value: '0 0 * * *' },
  { label: 'Weekly', value: '0 0 * * 0' },
  { label: 'Monthly', value: '0 0 1 * *' },
  { label: 'Weekdays 9am', value: '0 9 * * 1-5' },
];

const DEFAULT_EXPRESSION = '*/5 * * * *';

function normalizeField(field: string, kind: FieldKind): string {
  let f = field.trim().toUpperCase();
  if (kind === 'month') {
    for (const [alias, num] of Object.entries(MONTH_ALIASES)) {
      f = f.replace(new RegExp(alias, 'g'), String(num));
    }
  } else if (kind === 'weekday') {
    for (const [alias, num] of Object.entries(WEEKDAY_ALIASES)) {
      f = f.replace(new RegExp(alias, 'g'), String(num));
    }
  }
  return f;
}

function parseField(field: string, min: number, max: number): number[] | null {
  if (field === '') return null;
  const result = new Set<number>();
  const parts = field.split(',');
  for (const part of parts) {
    const p = part.trim();
    if (p === '') continue;
    if (p === '*') {
      for (let i = min; i <= max; i++) result.add(i);
      continue;
    }
    if (p.includes('/')) {
      const [rangePart, stepPart] = p.split('/');
      const step = parseInt(stepPart, 10);
      if (isNaN(step) || step <= 0) return null;
      let lo: number, hi: number;
      if (rangePart === '*' || rangePart === '') {
        lo = min;
        hi = max;
      } else if (rangePart.includes('-')) {
        const [a, b] = rangePart.split('-');
        lo = parseInt(a, 10);
        hi = parseInt(b, 10);
      } else {
        lo = parseInt(rangePart, 10);
        hi = max;
      }
      if (isNaN(lo) || isNaN(hi) || lo < min || hi > max || lo > hi) return null;
      for (let i = lo; i <= hi; i += step) result.add(i);
      continue;
    }
    if (p.includes('-')) {
      const [a, b] = p.split('-');
      const lo = parseInt(a, 10);
      const hi = parseInt(b, 10);
      if (isNaN(lo) || isNaN(hi) || lo < min || hi > max || lo > hi) return null;
      for (let i = lo; i <= hi; i++) result.add(i);
      continue;
    }
    const n = parseInt(p, 10);
    if (isNaN(n) || n < min || n > max) return null;
    result.add(n);
  }
  if (result.size === 0) return null;
  return Array.from(result).sort((a, b) => a - b);
}

function parseCron(expr: string): ParsedCron {
  const parts = expr.trim().split(/\s+/);
  const empty: ParsedCron = {
    minute: null, hour: null, day: null, month: null, weekday: null,
    dayRestricted: false, weekdayRestricted: false, raw: parts,
  };
  if (parts.length !== 5) {
    return { ...empty, error: 'A cron expression must have exactly 5 fields separated by spaces.' };
  }
  const [m, h, d, mo, w] = parts;
  const minute = parseField(normalizeField(m, 'minute'), 0, 59);
  const hour = parseField(normalizeField(h, 'hour'), 0, 23);
  const day = parseField(normalizeField(d, 'day'), 1, 31);
  const month = parseField(normalizeField(mo, 'month'), 1, 12);
  let weekday = parseField(normalizeField(w, 'weekday'), 0, 7);
  if (weekday) {
    const set = new Set<number>();
    for (const v of weekday) set.add(v === 7 ? 0 : v);
    weekday = Array.from(set).sort((a, b) => a - b);
  }
  if (!minute || !hour || !day || !month || !weekday) {
    return {
      minute, hour, day, month, weekday,
      dayRestricted: d !== '*',
      weekdayRestricted: w !== '*',
      raw: parts,
      error: 'Invalid cron expression. Please check the field ranges and syntax.',
    };
  }
  return {
    minute, hour, day, month, weekday,
    dayRestricted: d !== '*',
    weekdayRestricted: w !== '*',
    raw: parts,
  };
}

function formatList<T extends string | number>(items: T[]): string {
  if (items.length === 1) return String(items[0]);
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function formatTime(h: number, m: number): string {
  const period = h < 12 ? 'AM' : 'PM';
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

function describeCron(parsed: ParsedCron): string {
  if (parsed.error) return parsed.error;
  const [mRaw, hRaw, dRaw, moRaw, wRaw] = parsed.raw;
  const { minute, hour, day, month, weekday } = parsed;

  const mAll = mRaw === '*';
  const hAll = hRaw === '*';
  const dAll = dRaw === '*';
  const moAll = moRaw === '*';
  const wAll = wRaw === '*';

  const parts: string[] = [];

  if (mAll && hAll) {
    parts.push('Every minute');
  } else if (mRaw.toUpperCase().startsWith('*/')) {
    const n = parseInt(mRaw.slice(2), 10);
    parts.push(`Every ${n} minute${n !== 1 ? 's' : ''}`);
  } else if (hRaw.toUpperCase().startsWith('*/')) {
    const n = parseInt(hRaw.slice(2), 10);
    parts.push(`Every ${n} hour${n !== 1 ? 's' : ''}`);
    if (minute && minute.length === 1) parts.push(`at minute ${minute[0]}`);
  } else if (!mAll && !hAll && minute && hour && minute.length === 1 && hour.length === 1) {
    parts.push(`At ${formatTime(hour[0], minute[0])}`);
  } else {
    if (mAll) {
      parts.push('Every minute');
    } else if (minute) {
      if (minute.length === 1) parts.push(`At minute ${minute[0]}`);
      else parts.push(`At minutes ${formatList(minute)}`);
    }
    if (!hAll && hour) {
      if (hour.length === 1) parts.push(`past hour ${hour[0]}`);
      else parts.push(`past hours ${formatList(hour)}`);
    }
  }

  if (!dAll && day) {
    if (day.length === 1) parts.push(`on day ${day[0]} of the month`);
    else parts.push(`on days ${formatList(day)} of the month`);
  }

  if (!moAll && month) {
    if (month.length === 1) {
      parts.push(`in ${MONTH_NAMES[month[0] - 1]}`);
    } else {
      parts.push(`in ${formatList(month.map((n) => MONTH_NAMES[n - 1]))}`);
    }
  }

  if (!wAll && weekday) {
    if (weekday.length === 1) {
      parts.push(`on ${WEEKDAY_NAMES[weekday[0]]}`);
    } else {
      parts.push(`on ${formatList(weekday.map((n) => WEEKDAY_NAMES[n]))}`);
    }
  }

  return parts.length > 0 ? parts.join(' ') : 'Every minute';
}

function matchesCron(date: Date, parsed: ParsedCron): boolean {
  const m = date.getMinutes();
  const h = date.getHours();
  const dom = date.getDate();
  const mon = date.getMonth() + 1;
  const dow = date.getDay();

  if (!parsed.minute || !parsed.minute.includes(m)) return false;
  if (!parsed.hour || !parsed.hour.includes(h)) return false;
  if (!parsed.month || !parsed.month.includes(mon)) return false;

  const dayOk = parsed.day ? parsed.day.includes(dom) : true;
  const dowOk = parsed.weekday ? parsed.weekday.includes(dow) : true;

  if (parsed.dayRestricted && parsed.weekdayRestricted) {
    return dayOk || dowOk;
  }
  return dayOk && dowOk;
}

function findNext(parsed: ParsedCron, after: Date): Date | null {
  const d = new Date(after.getTime());
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() + 1);

  const limit = new Date(after.getTime());
  limit.setFullYear(limit.getFullYear() + 5);

  let guard = 0;
  while (d.getTime() < limit.getTime() && guard < 100000) {
    guard++;
    const mon = d.getMonth() + 1;
    if (!parsed.month || !parsed.month.includes(mon)) {
      d.setMonth(d.getMonth() + 1, 1);
      d.setHours(0, 0, 0, 0);
      continue;
    }
    const dom = d.getDate();
    const dow = d.getDay();
    const dayOk = parsed.day ? parsed.day.includes(dom) : true;
    const dowOk = parsed.weekday ? parsed.weekday.includes(dow) : true;
    const dayMatches = parsed.dayRestricted && parsed.weekdayRestricted
      ? dayOk || dowOk
      : dayOk && dowOk;
    if (!dayMatches) {
      d.setDate(d.getDate() + 1);
      d.setHours(0, 0, 0, 0);
      continue;
    }
    const h = d.getHours();
    if (!parsed.hour || !parsed.hour.includes(h)) {
      d.setHours(d.getHours() + 1, 0, 0, 0);
      continue;
    }
    const m = d.getMinutes();
    if (!parsed.minute || !parsed.minute.includes(m)) {
      d.setMinutes(d.getMinutes() + 1, 0, 0);
      continue;
    }
    return new Date(d.getTime());
  }
  return null;
}

function getNextTimes(parsed: ParsedCron, count: number): Date[] {
  if (parsed.error) return [];
  const result: Date[] = [];
  let after = new Date();
  for (let i = 0; i < count; i++) {
    const next = findNext(parsed, after);
    if (!next) break;
    result.push(next);
    after = next;
  }
  return result;
}

function formatDateForLang(date: Date, lang: string): string {
  const locale = lang && lang.length >= 2 ? lang : 'en';
  try {
    return date.toLocaleString(locale, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return date.toLocaleString('en', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

export default function CronFlow({ lang, dictionary }: CronFlowProps) {
  const t = dictionary || {};
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [expression, setExpression] = useState<string>(DEFAULT_EXPRESSION);
  const [copied, setCopied] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const parsed = useMemo(() => parseCron(expression), [expression]);
  const description = useMemo(() => describeCron(parsed), [parsed]);
  const segments = useMemo(() => {
    const parts = expression.trim().split(/\s+/);
    const segs = parts.length === 5 ? parts : ['', '', '', '', ''];
    return segs;
  }, [expression]);

  const nextTimes = useMemo(() => getNextTimes(parsed, 5), [parsed, refreshKey]);

  const updateSegment = useCallback((index: number, value: string) => {
    const cleaned = value.replace(/\s+/g, '');
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 5) {
      const newParts = ['', '', '', '', ''];
      newParts[index] = cleaned;
      setExpression(newParts.join(' '));
      return;
    }
    const newParts = [...parts];
    newParts[index] = cleaned;
    setExpression(newParts.join(' '));
  }, [expression]);

  const applyPreset = useCallback((value: string) => {
    setExpression(value);
  }, []);

  const resetWorkspace = useCallback(() => {
    setExpression(DEFAULT_EXPRESSION);
    setCopied(false);
    setRefreshKey((k) => k + 1);
  }, []);

  const copyExpression = useCallback(() => {
    navigator.clipboard.writeText(expression).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [expression]);

  const refreshNextTimes = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    setCopied(false);
  }, [expression]);

  const isValid = !parsed.error;

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0408] text-slate-200 font-sans relative overflow-x-hidden pt-24">
      
      
      

      <Header
        currentLang={lang}
        onLanguageChange={(l) => (window.location.href = `/${l.toLowerCase()}/cron-flow`)}
        onReset={resetWorkspace}
        t={t}
      />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 md:px-12 py-8 relative z-10 flex flex-col space-y-8">
        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-cron-flow-top" />
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center md:justify-start gap-3">
            <Clock className="w-8 h-8 text-violet-400" />
            <span>{t.seoHeroTitle || 'Cron-Flow'}</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed">
            {t.seoHeroText}
          </p>
        </div>

        <section className="bg-violet-500/[0.03] border border-violet-500/20 rounded-3xl p-6 md:p-8 space-y-6 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div className="flex items-center gap-2 text-violet-400 text-xs font-black uppercase tracking-[0.3em] shrink-0">
              <Clock className="w-4 h-4" />
              <span>Expression</span>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <input
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                spellCheck={false}
                placeholder="* * * * *"
                className={`flex-1 w-full px-4 py-3 bg-[#0a0408] border rounded-xl text-violet-100 font-mono text-base md:text-lg focus:outline-none transition-all ${
                  isValid
                    ? 'border-violet-500/30 focus:border-violet-400 focus:bg-violet-500/5'
                    : 'border-red-500/50 focus:border-red-400 focus:bg-red-500/5'
                }`}
              />
              <button
                onClick={copyExpression}
                className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 hover:text-violet-100 hover:border-violet-400 transition-all cursor-pointer"
                title="Copy expression"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
              <button
                onClick={resetWorkspace}
                className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 hover:text-violet-100 hover:border-violet-400 transition-all cursor-pointer"
                title="Reset"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-stretch justify-center md:justify-start gap-2 md:gap-3">
            {SEGMENTS.map((seg, i) => (
              <div key={seg.key} className="flex flex-col items-center group">
                <label className="text-[10px] uppercase tracking-[0.2em] text-violet-400/70 font-bold mb-1.5">
                  {seg.label}
                </label>
                <input
                  value={segments[i]}
                  onChange={(e) => updateSegment(i, e.target.value)}
                  spellCheck={false}
                  className="w-20 md:w-24 px-2 py-2.5 bg-violet-500/5 border border-violet-500/30 rounded-xl text-center text-violet-100 font-mono text-sm focus:outline-none focus:border-violet-400 focus:bg-violet-500/15 transition-all"
                />
                <span className="text-[9px] text-violet-400/40 mt-1 font-mono">{seg.sub}</span>
              </div>
            ))}
          </div>

          {!isValid && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {parsed.error}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {PRESETS.map((preset) => {
              const active = expression.trim() === preset.value.trim();
              return (
                <button
                  key={preset.value}
                  onClick={() => applyPreset(preset.value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    active
                      ? 'bg-violet-500/30 border-violet-400 text-violet-100'
                      : 'bg-violet-500/5 border-violet-500/20 text-violet-300 hover:bg-violet-500/15 hover:border-violet-400/50'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="bg-gradient-to-br from-violet-500/[0.07] to-fuchsia-500/[0.03] border border-violet-500/25 rounded-3xl p-8 md:p-12 text-center">
          <div className="flex items-center justify-center gap-2 text-violet-400 text-xs font-black uppercase tracking-[0.3em] mb-5">
            <Zap className="w-4 h-4" />
            <span>Human-readable</span>
          </div>
          <p className={`text-2xl md:text-4xl font-extrabold leading-snug tracking-tight ${isValid ? 'text-white' : 'text-red-300'}`}>
            {description}
          </p>
          {isValid && (
            <p className="mt-5 text-violet-300/60 font-mono text-sm md:text-base tracking-wider">
              {expression}
            </p>
          )}
        </section>

        <section className="bg-violet-500/[0.03] border border-violet-500/20 rounded-3xl p-6 md:p-8 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-violet-400 text-xs font-black uppercase tracking-[0.3em]">
              <Calendar className="w-4 h-4" />
              <span>Next 5 executions</span>
            </div>
            <button
              onClick={refreshNextTimes}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-bold hover:bg-violet-500/20 hover:text-violet-100 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {isValid && nextTimes.length > 0 ? (
            <ol className="space-y-2.5">
              {nextTimes.map((date, i) => (
                <li
                  key={i}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-[#0a0408] border border-violet-500/15 hover:border-violet-500/40 transition-all"
                >
                  <div className="shrink-0 w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-300 font-black text-sm">
                    {i + 1}
                  </div>
                  <Play className="w-4 h-4 text-violet-400/70 shrink-0" />
                  <span className="text-violet-100 font-medium text-sm md:text-base tracking-wide">
                    {formatDateForLang(date, lang)}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="px-4 py-6 rounded-2xl bg-[#0a0408] border border-violet-500/15 text-violet-300/60 text-sm text-center">
              {isValid ? 'No upcoming executions found within the next 5 years.' : 'Enter a valid cron expression to see upcoming execution times.'}
            </div>
          )}
        </section>
      {/* Bloque AdSense Horizontal */}
      <AdBanner id="adsense-cron-flow-bottom" />
      </main>

      <Footer
        lang={lang}
        t={t}
        onOpenModal={(modal) => setLegalModal(modal)}
      />

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
