import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AdBanner } from '../../components/shared/AdBanner';
import { LegalModal } from './components/LegalModal';
import { Clock, Copy, Check, RotateCcw, Calendar, Zap, ArrowRight, ArrowLeft } from 'lucide-react';
import { legalTranslations } from '../../locales/legal';

interface EpochFlowProps {
  lang: string;
  dictionary: any;
}

const pad = (n: number): string => String(n).padStart(2, '0');

const detectUnit = (value: number): 's' | 'ms' => (Math.abs(value) >= 1e11 ? 'ms' : 's');

const toMs = (value: number): number => (detectUnit(value) === 's' ? value * 1000 : value);

const UNIT_FALLBACKS: Record<string, { one: string; many: string }> = {
  rel_seconds: { one: 'second', many: 'seconds' },
  rel_minutes: { one: 'minute', many: 'minutes' },
  rel_hours: { one: 'hour', many: 'hours' },
  rel_days: { one: 'day', many: 'days' },
  rel_months: { one: 'month', many: 'months' },
  rel_years: { one: 'year', many: 'years' },
};

const formatRelative = (diffMs: number, t: any): string => {
  const abs = Math.abs(diffMs);
  const future = diffMs > 0;
  const sec = Math.round(abs / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  const month = Math.round(day / 30);
  const year = Math.round(day / 365);

  let amount: number;
  let unitKey: string;
  if (sec < 60) { amount = sec; unitKey = 'rel_seconds'; }
  else if (min < 60) { amount = min; unitKey = 'rel_minutes'; }
  else if (hr < 24) { amount = hr; unitKey = 'rel_hours'; }
  else if (day < 30) { amount = day; unitKey = 'rel_days'; }
  else if (month < 12) { amount = month; unitKey = 'rel_months'; }
  else { amount = year; unitKey = 'rel_years'; }

  const fb = UNIT_FALLBACKS[unitKey];
  const many = (t[unitKey] as string) || fb.many;
  const unit = amount === 1 ? (t[unitKey + '_one'] as string) || fb.one : many;

  if (amount === 0) return t.rel_now || 'just now';
  if (future) return `${t.rel_in || 'in'} ${amount} ${unit}`;
  return `${amount} ${unit} ${t.rel_ago || 'ago'}`;
};

const toDatetimeLocal = (date: Date): string => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const CopyCard: React.FC<{
  label: string;
  value: string;
  icon: React.ReactNode;
  copied: boolean;
  onCopy: () => void;
  copyLabel: string;
  copiedLabel: string;
}> = ({ label, value, icon, copied, onCopy, copyLabel, copiedLabel }) => (
  <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 space-y-3 hover:border-sky-500/20 transition-colors group">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-black uppercase tracking-widest text-sky-400/80 flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <button
        onClick={onCopy}
        disabled={!value}
        title={copied ? copiedLabel : copyLabel}
        className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer outline-none ${
          copied
            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
            : 'bg-white/5 border-white/5 hover:bg-sky-500/20 hover:border-sky-500/30 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed'
        }`}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
    <div className="font-mono text-sm text-white break-all min-h-[1.25rem] select-all">
      {value || <span className="text-slate-600">â€”</span>}
    </div>
  </div>
);

export default function EpochFlow({ lang, dictionary }: EpochFlowProps) {
  const t = dictionary || {};
  const initialNow = Date.now();
  const [epochInput, setEpochInput] = useState<string>(String(Math.floor(initialNow / 1000)));
  const [dateInput, setDateInput] = useState<string>(toDatetimeLocal(new Date(initialNow)));
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [tick, setTick] = useState<number>(initialNow);

  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const parsedEpoch = useMemo<number | null>(() => {
    const trimmed = epochInput.trim();
    if (trimmed === '' || trimmed === '-' || trimmed === '.') return null;
    const num = Number(trimmed);
    if (!Number.isFinite(num)) return null;
    return num;
  }, [epochInput]);

  const epochMs = useMemo<number | null>(() => (parsedEpoch === null ? null : toMs(parsedEpoch)), [parsedEpoch]);
  const epochDate = useMemo<Date | null>(() => (epochMs === null ? null : new Date(epochMs)), [epochMs]);
  const detectedUnit = parsedEpoch === null ? null : detectUnit(parsedEpoch);
  const isValidEpoch = epochDate !== null && !isNaN(epochDate.getTime());

  const utcOutput = useMemo(() => {
    if (!isValidEpoch || !epochDate) return '';
    return epochDate.toUTCString();
  }, [epochDate, isValidEpoch]);

  const localOutput = useMemo(() => {
    if (!isValidEpoch || !epochDate) return '';
    return epochDate.toLocaleString();
  }, [epochDate, isValidEpoch]);

  const isoOutput = useMemo(() => {
    if (!isValidEpoch || !epochDate) return '';
    return epochDate.toISOString();
  }, [epochDate, isValidEpoch]);

  const relativeOutput = useMemo(() => {
    if (!isValidEpoch || epochMs === null) return '';
    return formatRelative(epochMs - tick, t);
  }, [epochMs, tick, t, isValidEpoch]);

  const weekdayOutput = useMemo(() => {
    if (!isValidEpoch || !epochDate) return '';
    return WEEKDAYS[epochDate.getDay()];
  }, [epochDate, isValidEpoch]);

  const dateMs = useMemo<number | null>(() => {
    if (!dateInput) return null;
    const ms = new Date(dateInput).getTime();
    return Number.isFinite(ms) ? ms : null;
  }, [dateInput]);

  const dateSeconds = useMemo(() => (dateMs === null ? '' : String(Math.floor(dateMs / 1000))), [dateMs]);
  const dateMillis = useMemo(() => (dateMs === null ? '' : String(dateMs)), [dateMs]);

  const liveEpoch = useMemo(() => Math.floor(tick / 1000), [tick]);

  const copyToClipboard = (field: string, value: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleNow = useCallback(() => {
    const ms = Date.now();
    setEpochInput(String(Math.floor(ms / 1000)));
    setDateInput(toDatetimeLocal(new Date(ms)));
    setCopiedField(null);
  }, []);

  const handleEpochToPicker = useCallback(() => {
    if (!isValidEpoch || epochMs === null) return;
    setDateInput(toDatetimeLocal(new Date(epochMs)));
  }, [epochMs, isValidEpoch]);

  const handlePickerToEpoch = useCallback(() => {
    if (dateMs === null) return;
    setEpochInput(String(Math.floor(dateMs / 1000)));
  }, [dateMs]);

  const resetWorkspace = useCallback(() => {
    const ms = Date.now();
    setEpochInput(String(Math.floor(ms / 1000)));
    setDateInput(toDatetimeLocal(new Date(ms)));
    setCopiedField(null);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#020813] text-slate-200 font-sans relative overflow-x-hidden pt-24">
      
      

      <Header
        currentLang={lang}
        onLanguageChange={(l) => (window.location.href = `/${l.toLowerCase()}/epoch-flow`)}
        onReset={resetWorkspace}
        t={t}
      />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 md:px-12 py-8 relative z-10 flex flex-col space-y-8">
        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-epoch-flow-top" />
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center md:justify-start gap-3">
            <Clock className="w-8 h-8 text-sky-400" />
            <span>{t.seoHeroTitle || 'EpochFlow'}</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed">
            {t.seoHeroText}
          </p>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-4 bg-sky-500/5 border border-sky-500/20 rounded-2xl px-5 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-sky-400" />
            </div>
            <div className="text-left">
              <div className="text-[10px] font-black uppercase tracking-widest text-sky-400/80">
                {t.label_live_epoch || 'Live Unix Epoch'}
              </div>
              <div className="font-mono text-lg font-bold text-white tabular-nums">{liveEpoch}</div>
            </div>
          </div>
          <button
            onClick={handleNow}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500/20 border border-sky-500/40 hover:bg-sky-500/30 hover:border-sky-500/60 text-sky-300 hover:text-white text-xs font-bold transition-all cursor-pointer outline-none whitespace-nowrap"
          >
            <Zap className="w-4 h-4" />
            {t.button_now || 'Now'}
          </button>
        </div>

        <div className="flex flex-col bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <label className="text-xs font-black text-sky-400 uppercase tracking-widest text-left">
                {t.label_epoch_input || 'Unix Epoch Timestamp'}
              </label>
            </div>
            {detectedUnit && (
              <span className="text-[10px] font-mono font-bold text-sky-400/80 bg-sky-500/10 border border-sky-500/20 px-2 py-1 rounded uppercase tracking-widest">
                {detectedUnit === 's' ? (t.unit_seconds || 'seconds') : (t.unit_milliseconds || 'milliseconds')}
              </span>
            )}
          </div>

          <div className="relative flex items-center">
            <Clock className="absolute left-4 w-5 h-5 text-sky-400 pointer-events-none" />
            <input
              type="text"
              value={epochInput}
              onChange={(e) => setEpochInput(e.target.value)}
              placeholder="1718976000"
              spellCheck={false}
              inputMode="numeric"
              className={`w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-950/50 border font-mono text-sm text-white placeholder-slate-600 focus:ring-0 transition-colors outline-none ${
                isValidEpoch || epochInput.trim() === ''
                  ? 'border-white/5 focus:border-sky-500/50'
                  : 'border-red-500/40 focus:border-red-500/60'
              }`}
            />
            {!isValidEpoch && epochInput.trim() !== '' && (
              <span className="absolute right-4 text-[10px] font-bold text-red-400">
                {t.error_invalid_epoch || 'Invalid'}
              </span>
            )}
          </div>

          {isValidEpoch && (
            <>
              <div className="flex items-center justify-center gap-3 text-sky-400/80">
                <div className="h-px flex-1 bg-sky-500/10" />
                <ArrowRight className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {t.label_human_readable || 'Human Readable'}
                </span>
                <div className="h-px flex-1 bg-sky-500/10" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CopyCard
                  label={t.label_utc || 'UTC'}
                  value={utcOutput}
                  icon={<Clock className="w-3 h-3" />}
                  copied={copiedField === 'utc'}
                  onCopy={() => copyToClipboard('utc', utcOutput)}
                  copyLabel={t.tooltip_copy || 'Copy'}
                  copiedLabel={t.emailCopied || 'Copied!'}
                />
                <CopyCard
                  label={t.label_local || 'Local'}
                  value={localOutput}
                  icon={<Calendar className="w-3 h-3" />}
                  copied={copiedField === 'local'}
                  onCopy={() => copyToClipboard('local', localOutput)}
                  copyLabel={t.tooltip_copy || 'Copy'}
                  copiedLabel={t.emailCopied || 'Copied!'}
                />
                <CopyCard
                  label={t.label_iso || 'ISO 8601'}
                  value={isoOutput}
                  icon={<ArrowRight className="w-3 h-3" />}
                  copied={copiedField === 'iso'}
                  onCopy={() => copyToClipboard('iso', isoOutput)}
                  copyLabel={t.tooltip_copy || 'Copy'}
                  copiedLabel={t.emailCopied || 'Copied!'}
                />
                <CopyCard
                  label={t.label_relative || 'Relative'}
                  value={relativeOutput}
                  icon={<Zap className="w-3 h-3" />}
                  copied={copiedField === 'relative'}
                  onCopy={() => copyToClipboard('relative', relativeOutput)}
                  copyLabel={t.tooltip_copy || 'Copy'}
                  copiedLabel={t.emailCopied || 'Copied!'}
                />
              </div>

              <div className="flex items-center justify-between bg-slate-950/40 border border-white/5 rounded-2xl px-4 py-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-sky-400/80">
                  {t.label_weekday || 'Day of week'}
                </span>
                <span className="font-mono text-sm text-white">{weekdayOutput}</span>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleEpochToPicker}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-sky-500/20 hover:border-sky-500/30 text-slate-300 hover:text-sky-400 text-xs font-bold transition-all cursor-pointer outline-none"
                >
                  <ArrowRight className="w-4 h-4" />
                  {t.button_send_to_picker || 'Send to Date Picker'}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-400" />
            <label className="text-xs font-black text-sky-400 uppercase tracking-widest text-left">
              {t.label_date_picker || 'Date & Time Picker'}
            </label>
          </div>

          <div className="relative flex items-center">
            <Calendar className="absolute left-4 w-5 h-5 text-sky-400 pointer-events-none z-10" />
            <input
              type="datetime-local"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              step={1}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-950/50 border border-white/5 focus:border-sky-500/50 font-mono text-sm text-white focus:ring-0 transition-colors outline-none [color-scheme:dark]"
            />
          </div>

          {dateMs !== null && (
            <>
              <div className="flex items-center justify-center gap-3 text-sky-400/80">
                <div className="h-px flex-1 bg-sky-500/10" />
                <ArrowRight className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {t.label_epoch_output || 'Epoch Timestamps'}
                </span>
                <div className="h-px flex-1 bg-sky-500/10" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CopyCard
                  label={t.unit_seconds || 'Seconds'}
                  value={dateSeconds}
                  icon={<Clock className="w-3 h-3" />}
                  copied={copiedField === 'seconds'}
                  onCopy={() => copyToClipboard('seconds', dateSeconds)}
                  copyLabel={t.tooltip_copy || 'Copy'}
                  copiedLabel={t.emailCopied || 'Copied!'}
                />
                <CopyCard
                  label={t.unit_milliseconds || 'Milliseconds'}
                  value={dateMillis}
                  icon={<Zap className="w-3 h-3" />}
                  copied={copiedField === 'milliseconds'}
                  onCopy={() => copyToClipboard('milliseconds', dateMillis)}
                  copyLabel={t.tooltip_copy || 'Copy'}
                  copiedLabel={t.emailCopied || 'Copied!'}
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handlePickerToEpoch}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-sky-500/20 hover:border-sky-500/30 text-slate-300 hover:text-sky-400 text-xs font-bold transition-all cursor-pointer outline-none"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t.button_send_to_epoch || 'Send to Epoch'}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={resetWorkspace}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-sky-500/20 hover:border-sky-500/30 text-slate-300 hover:text-sky-400 text-xs font-bold transition-all cursor-pointer outline-none"
          >
            <RotateCcw className="w-4 h-4" />
            {t.button_reset || 'Reset'}
          </button>
        </div>
      {/* Bloque AdSense Horizontal */}
      <AdBanner id="adsense-epoch-flow-bottom" />
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
