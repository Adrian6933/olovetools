import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { Globe, Plus, Trash2, Clock, Copy, Check, Sun, Moon, Search, RotateCcw } from 'lucide-react';
import { legalTranslations } from '../../locales/legal';

interface TimeBoltProps {
  lang: string;
  dictionary: any;
}

interface ZoneEntry {
  city: string;
  tz: string;
  country: string;
}

const TIMEZONE_LIST: ZoneEntry[] = [
  { city: 'New York', tz: 'America/New_York', country: 'USA' },
  { city: 'Los Angeles', tz: 'America/Los_Angeles', country: 'USA' },
  { city: 'Chicago', tz: 'America/Chicago', country: 'USA' },
  { city: 'Denver', tz: 'America/Denver', country: 'USA' },
  { city: 'Anchorage', tz: 'America/Anchorage', country: 'USA' },
  { city: 'Honolulu', tz: 'Pacific/Honolulu', country: 'USA' },
  { city: 'Toronto', tz: 'America/Toronto', country: 'Canada' },
  { city: 'Vancouver', tz: 'America/Vancouver', country: 'Canada' },
  { city: 'Mexico City', tz: 'America/Mexico_City', country: 'Mexico' },
  { city: 'Bogotá', tz: 'America/Bogota', country: 'Colombia' },
  { city: 'Lima', tz: 'America/Lima', country: 'Peru' },
  { city: 'Caracas', tz: 'America/Caracas', country: 'Venezuela' },
  { city: 'Santiago', tz: 'America/Santiago', country: 'Chile' },
  { city: 'Buenos Aires', tz: 'America/Argentina/Buenos_Aires', country: 'Argentina' },
  { city: 'São Paulo', tz: 'America/Sao_Paulo', country: 'Brazil' },
  { city: 'Rio de Janeiro', tz: 'America/Sao_Paulo', country: 'Brazil' },
  { city: 'Brasília', tz: 'America/Sao_Paulo', country: 'Brazil' },
  { city: 'Reykjavik', tz: 'Atlantic/Reykjavik', country: 'Iceland' },
  { city: 'Casablanca', tz: 'Africa/Casablanca', country: 'Morocco' },
  { city: 'Lisbon', tz: 'Europe/Lisbon', country: 'Portugal' },
  { city: 'London', tz: 'Europe/London', country: 'UK' },
  { city: 'Dublin', tz: 'Europe/Dublin', country: 'Ireland' },
  { city: 'Paris', tz: 'Europe/Paris', country: 'France' },
  { city: 'Brussels', tz: 'Europe/Brussels', country: 'Belgium' },
  { city: 'Amsterdam', tz: 'Europe/Amsterdam', country: 'Netherlands' },
  { city: 'Berlin', tz: 'Europe/Berlin', country: 'Germany' },
  { city: 'Zurich', tz: 'Europe/Zurich', country: 'Switzerland' },
  { city: 'Vienna', tz: 'Europe/Vienna', country: 'Austria' },
  { city: 'Prague', tz: 'Europe/Prague', country: 'Czechia' },
  { city: 'Warsaw', tz: 'Europe/Warsaw', country: 'Poland' },
  { city: 'Stockholm', tz: 'Europe/Stockholm', country: 'Sweden' },
  { city: 'Oslo', tz: 'Europe/Oslo', country: 'Norway' },
  { city: 'Copenhagen', tz: 'Europe/Copenhagen', country: 'Denmark' },
  { city: 'Helsinki', tz: 'Europe/Helsinki', country: 'Finland' },
  { city: 'Madrid', tz: 'Europe/Madrid', country: 'Spain' },
  { city: 'Rome', tz: 'Europe/Rome', country: 'Italy' },
  { city: 'Athens', tz: 'Europe/Athens', country: 'Greece' },
  { city: 'Lisbon', tz: 'Atlantic/Madeira', country: 'Portugal' },
  { city: 'Kyiv', tz: 'Europe/Kyiv', country: 'Ukraine' },
  { city: 'Bucharest', tz: 'Europe/Bucharest', country: 'Romania' },
  { city: 'Istanbul', tz: 'Europe/Istanbul', country: 'Turkey' },
  { city: 'Moscow', tz: 'Europe/Moscow', country: 'Russia' },
  { city: 'Cairo', tz: 'Africa/Cairo', country: 'Egypt' },
  { city: 'Lagos', tz: 'Africa/Lagos', country: 'Nigeria' },
  { city: 'Accra', tz: 'Africa/Accra', country: 'Ghana' },
  { city: 'Nairobi', tz: 'Africa/Nairobi', country: 'Kenya' },
  { city: 'Addis Ababa', tz: 'Africa/Addis_Ababa', country: 'Ethiopia' },
  { city: 'Johannesburg', tz: 'Africa/Johannesburg', country: 'South Africa' },
  { city: 'Dubai', tz: 'Asia/Dubai', country: 'UAE' },
  { city: 'Tehran', tz: 'Asia/Tehran', country: 'Iran' },
  { city: 'Baku', tz: 'Asia/Baku', country: 'Azerbaijan' },
  { city: 'Tbilisi', tz: 'Asia/Tbilisi', country: 'Georgia' },
  { city: 'Karachi', tz: 'Asia/Karachi', country: 'Pakistan' },
  { city: 'Delhi', tz: 'Asia/Kolkata', country: 'India' },
  { city: 'Mumbai', tz: 'Asia/Kolkata', country: 'India' },
  { city: 'Bengaluru', tz: 'Asia/Kolkata', country: 'India' },
  { city: 'Kathmandu', tz: 'Asia/Kathmandu', country: 'Nepal' },
  { city: 'Colombo', tz: 'Asia/Colombo', country: 'Sri Lanka' },
  { city: 'Dhaka', tz: 'Asia/Dhaka', country: 'Bangladesh' },
  { city: 'Yangon', tz: 'Asia/Yangon', country: 'Myanmar' },
  { city: 'Bangkok', tz: 'Asia/Bangkok', country: 'Thailand' },
  { city: 'Hanoi', tz: 'Asia/Ho_Chi_Minh', country: 'Vietnam' },
  { city: 'Jakarta', tz: 'Asia/Jakarta', country: 'Indonesia' },
  { city: 'Singapore', tz: 'Asia/Singapore', country: 'Singapore' },
  { city: 'Kuala Lumpur', tz: 'Asia/Kuala_Lumpur', country: 'Malaysia' },
  { city: 'Manila', tz: 'Asia/Manila', country: 'Philippines' },
  { city: 'Hong Kong', tz: 'Asia/Hong_Kong', country: 'Hong Kong' },
  { city: 'Shanghai', tz: 'Asia/Shanghai', country: 'China' },
  { city: 'Beijing', tz: 'Asia/Shanghai', country: 'China' },
  { city: 'Taipei', tz: 'Asia/Taipei', country: 'Taiwan' },
  { city: 'Seoul', tz: 'Asia/Seoul', country: 'South Korea' },
  { city: 'Tokyo', tz: 'Asia/Tokyo', country: 'Japan' },
  { city: 'Perth', tz: 'Australia/Perth', country: 'Australia' },
  { city: 'Darwin', tz: 'Australia/Darwin', country: 'Australia' },
  { city: 'Brisbane', tz: 'Australia/Brisbane', country: 'Australia' },
  { city: 'Adelaide', tz: 'Australia/Adelaide', country: 'Australia' },
  { city: 'Sydney', tz: 'Australia/Sydney', country: 'Australia' },
  { city: 'Melbourne', tz: 'Australia/Melbourne', country: 'Australia' },
  { city: 'Auckland', tz: 'Pacific/Auckland', country: 'New Zealand' },
  { city: 'Fiji', tz: 'Pacific/Fiji', country: 'Fiji' },
];

const pad = (n: number): string => String(n).padStart(2, '0');

const safeLocale = (lang: string): string => (lang && lang.length >= 2 ? lang : 'en');

const getZoneParts = (tz: string, date: Date) => {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'short',
    });
    const map: Record<string, string> = {};
    for (const p of fmt.formatToParts(date)) {
      if (p.type !== 'literal') map[p.type] = p.value;
    }
    const hour = map.hour === '24' ? 0 : parseInt(map.hour, 10);
    return {
      year: parseInt(map.year, 10),
      month: parseInt(map.month, 10),
      day: parseInt(map.day, 10),
      hour,
      minute: parseInt(map.minute, 10),
      second: parseInt(map.second, 10),
      weekday: map.weekday,
    };
  } catch {
    return { year: 1970, month: 1, day: 1, hour: 0, minute: 0, second: 0, weekday: '—' };
  }
};

const getUtcOffsetMinutes = (tz: string, date: Date): number => {
  const p = getZoneParts(tz, date);
  const asUtcMs = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtcMs - date.getTime()) / 60000);
};

const formatOffset = (minutes: number): string => {
  const sign = minutes >= 0 ? '+' : '-';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `UTC${sign}${pad(h)}:${pad(m)}`;
};

const formatDateShort = (tz: string, date: Date, lang: string): string => {
  const locale = safeLocale(lang);
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone: tz,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    try {
      return new Intl.DateTimeFormat('en', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric' }).format(date);
    } catch {
      const p = getZoneParts(tz, date);
      return `${p.weekday}, ${p.month}/${p.day}`;
    }
  }
};

const isDaytime = (hour: number): boolean => hour >= 6 && hour < 18;

const instantFromZonedTime = (tz: string, year: number, month: number, day: number, hour: number, minute: number): number => {
  const guessUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offset1 = getUtcOffsetMinutes(tz, new Date(guessUtc));
  const realUtc = guessUtc - offset1 * 60000;
  const offset2 = getUtcOffsetMinutes(tz, new Date(realUtc));
  return guessUtc - offset2 * 60000;
};

const todayInTz = (tz: string, date: Date): string => {
  const p = getZoneParts(tz, date);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
};

const cityForTz = (tz: string): string => {
  const found = TIMEZONE_LIST.find((z) => z.tz === tz);
  if (found) return found.city;
  const last = tz.split('/').pop() || tz;
  return last.replace(/_/g, ' ');
};

const countryForTz = (tz: string): string => {
  const found = TIMEZONE_LIST.find((z) => z.tz === tz);
  return found ? found.country : '';
};

const detectLocalTz = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

const buildInitialAdded = (): ZoneEntry[] => {
  const localTz = detectLocalTz();
  const base: ZoneEntry[] = [
    { city: cityForTz(localTz), tz: localTz, country: countryForTz(localTz) },
    { city: 'New York', tz: 'America/New_York', country: 'USA' },
    { city: 'London', tz: 'Europe/London', country: 'UK' },
    { city: 'Tokyo', tz: 'Asia/Tokyo', country: 'Japan' },
    { city: 'Sydney', tz: 'Australia/Sydney', country: 'Australia' },
  ];
  const seen = new Set<string>();
  const out: ZoneEntry[] = [];
  for (const z of base) {
    const key = `${z.city}|${z.tz}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(z);
  }
  return out;
};

export default function TimeBolt({ lang, dictionary }: TimeBoltProps) {
  const t = dictionary || {};
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [added, setAdded] = useState<ZoneEntry[]>(buildInitialAdded);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [now, setNow] = useState<Date>(new Date());
  const [plannerTz, setPlannerTz] = useState<string>(() => buildInitialAdded()[0]?.tz || 'UTC');
  const [plannerDate, setPlannerDate] = useState<string>(() => todayInTz(buildInitialAdded()[0]?.tz || 'UTC', new Date()));
  const [plannerTime, setPlannerTime] = useState<string>('09:00');
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!added.some((a) => a.tz === plannerTz)) {
      setPlannerTz(added[0]?.tz || '');
    }
  }, [added, plannerTz]);

  useEffect(() => {
    if (!showSearch) return;
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSearch]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return TIMEZONE_LIST;
    return TIMEZONE_LIST.filter(
      (z) =>
        z.city.toLowerCase().includes(q) ||
        z.tz.toLowerCase().includes(q) ||
        z.country.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const isAdded = useCallback(
    (z: ZoneEntry) => added.some((a) => a.city === z.city && a.tz === z.tz),
    [added]
  );

  const addTimezone = useCallback((z: ZoneEntry) => {
    setAdded((prev) => (prev.some((a) => a.city === z.city && a.tz === z.tz) ? prev : [...prev, z]));
  }, []);

  const removeTimezone = useCallback((z: ZoneEntry) => {
    setAdded((prev) => prev.filter((a) => !(a.city === z.city && a.tz === z.tz)));
  }, []);

  const copy = useCallback((key: string, value: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  const plannerInstant = useMemo<number | null>(() => {
    if (!plannerTz) return null;
    const [y, mo, d] = plannerDate.split('-').map(Number);
    const [h, mi] = plannerTime.split(':').map(Number);
    if (!y || !mo || !d || isNaN(h) || isNaN(mi)) return null;
    return instantFromZonedTime(plannerTz, y, mo, d, h, mi);
  }, [plannerTz, plannerDate, plannerTime]);

  const handleToday = useCallback(() => {
    if (!plannerTz) return;
    setPlannerDate(todayInTz(plannerTz, now));
  }, [plannerTz, now]);

  const handleNow = useCallback(() => {
    if (!plannerTz) return;
    const p = getZoneParts(plannerTz, now);
    setPlannerDate(`${p.year}-${pad(p.month)}-${pad(p.day)}`);
    setPlannerTime(`${pad(p.hour)}:${pad(p.minute)}`);
  }, [plannerTz, now]);

  const resetWorkspace = useCallback(() => {
    const fresh = buildInitialAdded();
    setAdded(fresh);
    setPlannerTz(fresh[0]?.tz || 'UTC');
    setPlannerDate(todayInTz(fresh[0]?.tz || 'UTC', new Date()));
    setPlannerTime('09:00');
    setShowSearch(false);
    setSearchQuery('');
    setCopiedKey(null);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#020a08] text-slate-200 font-sans relative overflow-x-hidden pt-24">
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-teal-600/10 blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-teal-600/10 blur-[120px] pointer-events-none z-0" />

      <Header
        currentLang={lang}
        onLanguageChange={(l) => (window.location.href = `/${l.toLowerCase()}/time-bolt`)}
        onReset={resetWorkspace}
        t={t}
      />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 md:px-12 py-8 relative z-10 flex flex-col space-y-8">
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center md:justify-start gap-3">
            <Globe className="w-8 h-8 text-teal-400" />
            <span>{t.seoHeroTitle || 'Time-Bolt'}</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed">
            {t.seoHeroText}
          </p>
        </div>

        <div ref={searchRef} className="relative">
          <div className="flex items-center justify-between flex-wrap gap-3 bg-teal-500/5 border border-teal-500/20 rounded-2xl px-5 py-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
                <Globe className="w-5 h-5 text-teal-400" />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-black uppercase tracking-widest text-teal-400/80">
                  {t.section_world_clocks || 'World Clocks'}
                </div>
                <div className="text-sm text-slate-300">
                  {added.length} {added.length === 1 ? 'timezone' : 'timezones'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowSearch((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer outline-none whitespace-nowrap ${
                showSearch
                  ? 'bg-teal-500/30 border-teal-400 text-white'
                  : 'bg-teal-500/20 border-teal-500/40 hover:bg-teal-500/30 hover:border-teal-500/60 text-teal-300 hover:text-white'
              }`}
            >
              <Plus className={`w-4 h-4 transition-transform ${showSearch ? 'rotate-45' : ''}`} />
              {showSearch ? (t.button_close || 'Close') : (t.button_add_timezone || 'Add Timezone')}
            </button>
          </div>

          {showSearch && (
            <div className="absolute top-full left-0 right-0 mt-2 z-30 bg-[#020a08] border border-teal-500/25 rounded-2xl shadow-2xl shadow-black/50 backdrop-blur-2xl p-4 space-y-3 max-h-[420px] flex flex-col">
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 w-4 h-4 text-teal-400 pointer-events-none" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.search_timezones || 'Search city, country or timezone…'}
                  spellCheck={false}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-teal-500/5 border border-teal-500/20 focus:border-teal-400 focus:bg-teal-500/10 text-sm text-white placeholder-slate-500 focus:ring-0 transition-colors outline-none"
                />
              </div>
              <div className="overflow-y-auto space-y-1 -mr-2 pr-2">
                {filtered.length === 0 && (
                  <div className="text-center text-slate-500 text-sm py-6">
                    {t.search_no_results || 'No timezones match your search.'}
                  </div>
                )}
                {filtered.map((z) => {
                  const addedAlready = isAdded(z);
                  return (
                    <button
                      key={`${z.city}|${z.tz}`}
                      onClick={() => addTimezone(z)}
                      disabled={addedAlready}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                        addedAlready
                          ? 'bg-teal-500/5 border border-teal-500/10 cursor-not-allowed opacity-60'
                          : 'bg-transparent border border-transparent hover:bg-teal-500/10 hover:border-teal-500/25 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Clock className="w-4 h-4 text-teal-400/70 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm text-white font-bold truncate">{z.city}</div>
                          <div className="text-[11px] text-slate-500 font-mono truncate">{z.tz}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider hidden sm:inline">{z.country}</span>
                        {addedAlready ? (
                          <Check className="w-4 h-4 text-teal-400" />
                        ) : (
                          <Plus className="w-4 h-4 text-teal-400/80" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {added.length === 0 ? (
          <div className="bg-teal-500/[0.03] border border-dashed border-teal-500/20 rounded-3xl p-12 text-center">
            <Globe className="w-10 h-10 text-teal-400/50 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">
              {t.empty_clocks || 'No timezones yet. Add one above.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {added.map((z) => {
              const p = getZoneParts(z.tz, now);
              const offset = getUtcOffsetMinutes(z.tz, now);
              const day = isDaytime(p.hour);
              const timeStr = `${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
              const copyValue = `${z.city}: ${timeStr} (${formatOffset(offset)})`;
              const cardKey = `live|${z.city}|${z.tz}`;
              return (
                <div
                  key={cardKey}
                  className="group relative bg-teal-500/[0.03] border border-teal-500/15 rounded-2xl p-5 hover:border-teal-500/40 transition-colors overflow-hidden"
                >
                  <div
                    className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl pointer-events-none transition-opacity ${
                      day ? 'bg-amber-500/10' : 'bg-indigo-500/10'
                    }`}
                  />
                  <div className="flex items-start justify-between gap-3 relative">
                    <div className="min-w-0">
                      <div className="text-white font-black text-base truncate">{z.city}</div>
                      {z.country && (
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider truncate">{z.country}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                          day
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                            : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                        }`}
                        title={day ? (t.label_day || 'Day') : (t.label_night || 'Night')}
                      >
                        {day ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      </div>
                      <button
                        onClick={() => removeTimezone(z)}
                        title={t.button_remove || 'Remove'}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 hover:bg-red-500/20 hover:border-red-500/40 text-slate-400 hover:text-red-300 flex items-center justify-center transition-all cursor-pointer outline-none"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 relative">
                    <div className="font-mono text-3xl font-black text-white tabular-nums tracking-tight">
                      {timeStr}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {formatDateShort(z.tz, now, lang)}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between relative">
                    <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-1 rounded uppercase tracking-widest">
                      {formatOffset(offset)}
                    </span>
                    <button
                      onClick={() => copy(cardKey, copyValue)}
                      title={copiedKey === cardKey ? (t.emailCopied || 'Copied!') : (t.tooltip_copy || 'Copy')}
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer outline-none ${
                        copiedKey === cardKey
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                          : 'bg-white/5 border-white/5 hover:bg-teal-500/20 hover:border-teal-500/30 text-slate-400 hover:text-white'
                      }`}
                    >
                      {copiedKey === cardKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={resetWorkspace}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-teal-500/20 hover:border-teal-500/30 text-slate-300 hover:text-teal-400 text-xs font-bold transition-all cursor-pointer outline-none"
          >
            <RotateCcw className="w-4 h-4" />
            {t.button_reset || 'Reset'}
          </button>
        </div>

        <div className="bg-teal-500/[0.03] border border-teal-500/20 rounded-3xl p-6 md:p-8 space-y-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-teal-400 text-xs font-black uppercase tracking-[0.3em]">
            <Clock className="w-4 h-4" />
            <span>{t.section_meeting_planner || 'Meeting Planner'}</span>
          </div>

          {added.length === 0 || !plannerTz ? (
            <div className="text-center text-slate-500 text-sm py-8">
              {t.empty_planner || 'Add timezones to plan a meeting.'}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-teal-400/80">
                    {t.planner_source || 'Reference Timezone'}
                  </label>
                  <select
                    value={plannerTz}
                    onChange={(e) => setPlannerTz(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-teal-500/5 border border-teal-500/20 focus:border-teal-400 focus:bg-teal-500/10 text-sm text-white focus:ring-0 transition-colors outline-none [color-scheme:dark] cursor-pointer"
                  >
                    {added.map((a) => (
                      <option key={`${a.city}|${a.tz}`} value={a.tz}>
                        {a.city} — {a.tz}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-teal-400/80">
                    {t.planner_date || 'Date'}
                  </label>
                  <input
                    type="date"
                    value={plannerDate}
                    onChange={(e) => setPlannerDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-teal-500/5 border border-teal-500/20 focus:border-teal-400 focus:bg-teal-500/10 text-sm text-white focus:ring-0 transition-colors outline-none [color-scheme:dark]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-teal-400/80">
                    {t.planner_time || 'Time'}
                  </label>
                  <input
                    type="time"
                    value={plannerTime}
                    onChange={(e) => setPlannerTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-teal-500/5 border border-teal-500/20 focus:border-teal-400 focus:bg-teal-500/10 text-sm text-white focus:ring-0 transition-colors outline-none [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleToday}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-500/10 border border-teal-500/25 hover:bg-teal-500/20 hover:border-teal-400/50 text-teal-300 text-xs font-bold transition-all cursor-pointer outline-none"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {t.button_today || 'Today'}
                </button>
                <button
                  onClick={handleNow}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-500/10 border border-teal-500/25 hover:bg-teal-500/20 hover:border-teal-400/50 text-teal-300 text-xs font-bold transition-all cursor-pointer outline-none"
                >
                  <Clock className="w-3.5 h-3.5" />
                  {t.button_now || 'Now'}
                </button>
              </div>

              {plannerInstant !== null && (
                <div className="space-y-2">
                  {added.map((a) => {
                    const p = getZoneParts(a.tz, new Date(plannerInstant));
                    const np = getZoneParts(a.tz, now);
                    const diff = Math.round(
                      (Date.UTC(p.year, p.month - 1, p.day) - Date.UTC(np.year, np.month - 1, np.day)) / 86400000
                    );
                    const relTag =
                      diff === 0
                        ? t.planner_today || 'Today'
                        : diff === 1
                        ? t.planner_tomorrow || 'Tomorrow'
                        : diff === -1
                        ? t.planner_yesterday || 'Yesterday'
                        : '';
                    const day = isDaytime(p.hour);
                    const timeStr = `${pad(p.hour)}:${pad(p.minute)}`;
                    const offset = getUtcOffsetMinutes(a.tz, new Date(plannerInstant));
                    const dateStr = formatDateShort(a.tz, new Date(plannerInstant), lang);
                    const isSource = a.tz === plannerTz;
                    const rowKey = `plan|${a.city}|${a.tz}`;
                    const copyValue = `${a.city}: ${dateStr}, ${timeStr} (${formatOffset(offset)})`;
                    return (
                      <div
                        key={rowKey}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
                          isSource
                            ? 'bg-teal-500/10 border-teal-400/50'
                            : 'bg-[#020a08] border-teal-500/10 hover:border-teal-500/30'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                            day
                              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                              : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                          }`}
                        >
                          {day ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-sm truncate">{a.city}</span>
                            {isSource && (
                              <span className="text-[9px] font-black uppercase tracking-widest text-teal-400 bg-teal-500/15 border border-teal-500/30 px-1.5 py-0.5 rounded shrink-0">
                                {t.planner_source_tag || 'Source'}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {dateStr}
                            {relTag && (
                              <span className="ml-2 text-teal-400/80 font-bold">· {relTag}</span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-1 rounded uppercase tracking-widest shrink-0 hidden sm:inline">
                          {formatOffset(offset)}
                        </span>
                        <span className="font-mono text-lg font-black text-white tabular-nums shrink-0">
                          {timeStr}
                        </span>
                        <button
                          onClick={() => copy(rowKey, copyValue)}
                          title={copiedKey === rowKey ? (t.emailCopied || 'Copied!') : (t.tooltip_copy || 'Copy')}
                          className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer outline-none shrink-0 ${
                            copiedKey === rowKey
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                              : 'bg-white/5 border-white/5 hover:bg-teal-500/20 hover:border-teal-500/30 text-slate-400 hover:text-white'
                          }`}
                        >
                          {copiedKey === rowKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
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
