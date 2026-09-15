import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { DayRange } from './types';

/** YYYY-MM-DD en hora local. toISOString daria el dia UTC, uno menos a partir de medianoche en America. */
export const toDayKey = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const fromDayKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** Dias del rango contando los dos extremos. Por fecha y no por milisegundos: el cambio de hora hace dias de 23 y 25 horas. */
const countDays = (range: DayRange) => {
  const a = fromDayKey(range.from);
  const b = fromDayKey(range.to);
  return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000) + 1;
};

/** "3 sept – 10 sept", o solo "3 sept" si es un dia. El año solo aparece si no es el actual. */
export const formatDayRange = (range: DayRange, locale?: string) => {
  const from = fromDayKey(range.from);
  const to = fromDayKey(range.to);
  const thisYear = new Date().getFullYear();
  const fmt = (d: Date) => d.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    ...(d.getFullYear() !== thisYear ? { year: 'numeric' } : {}),
  });
  return range.from === range.to ? fmt(from) : `${fmt(from)} – ${fmt(to)}`;
};

/** Primer dia de la semana del idioma (0 = domingo). Firefox no tiene weekInfo: lunes, que es lo mas comun. */
const firstDayOfWeek = (locale?: string) => {
  try {
    const l: any = new Intl.Locale(locale || 'en');
    const info = typeof l.getWeekInfo === 'function' ? l.getWeekInfo() : l.weekInfo;
    if (info?.firstDay) return info.firstDay % 7;
  } catch { /* locale raro: se queda en lunes */ }
  return 1;
};

interface DayRangeFilterProps {
  value: DayRange | null;
  onChange: (range: DayRange | null) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  locale?: string;
  t: (key: string) => string;
}

/**
 * Boton "Por dias" y su calendario. Se elige el primer dia y luego el ultimo;
 * nada se pide a Twitch hasta pulsar Aplicar, porque cada cambio de rango vacia
 * la rejilla y vuelve a cargar desde cero.
 */
const DayRangeFilter: React.FC<DayRangeFilterProps> = ({ value, onChange, open, onOpenChange, disabled = false, locale, t }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [viewMonth, setViewMonth] = useState(() => new Date());
  const [draftFrom, setDraftFrom] = useState<string | null>(null);
  const [draftTo, setDraftTo] = useState<string | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);

  // Al abrir, el borrador parte de lo aplicado y el mes visible es el de su
  // ultimo dia (o el actual): abrir y ver otro mes despista.
  useEffect(() => {
    if (!open) return;
    setDraftFrom(value?.from ?? null);
    setDraftTo(value?.to ?? null);
    setHoverKey(null);
    const base = value ? fromDayKey(value.to) : new Date();
    setViewMonth(new Date(base.getFullYear(), base.getMonth(), 1));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) onOpenChange(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onOpenChange]);

  const todayKey = toDayKey(new Date());
  const weekStart = useMemo(() => firstDayOfWeek(locale), [locale]);

  const weekdayLabels = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
    // 2024-01-07 fue domingo: de ahi se sacan los siete en orden.
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, 7 + ((weekStart + i) % 7))));
  }, [locale, weekStart]);

  const cells = useMemo(() => {
    const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const offset = (first.getDay() - weekStart + 7) % 7;
    const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
    const out: (string | null)[] = Array.from({ length: offset }, () => null);
    for (let d = 1; d <= daysInMonth; d++) out.push(toDayKey(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d)));
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [viewMonth, weekStart]);

  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(viewMonth);
  const isCurrentMonth = viewMonth.getFullYear() === new Date().getFullYear() && viewMonth.getMonth() === new Date().getMonth();

  // Con el primer dia puesto y el raton encima de otro, se pinta el rango que
  // saldria: asi se ve antes de hacer clic si se esta eligiendo lo que se quiere.
  const previewEnd = draftTo ?? (draftFrom && hoverKey ? hoverKey : null);
  const [lo, hi] = draftFrom && previewEnd
    ? (draftFrom <= previewEnd ? [draftFrom, previewEnd] : [previewEnd, draftFrom])
    : [draftFrom, draftFrom];

  const pickDay = (key: string) => {
    if (!draftFrom || draftTo) {
      setDraftFrom(key);
      setDraftTo(null);
    } else if (key < draftFrom) {
      setDraftTo(draftFrom);
      setDraftFrom(key);
    } else {
      setDraftTo(key);
    }
  };

  const draft: DayRange | null = draftFrom ? { from: draftFrom, to: draftTo ?? draftFrom } : null;

  const apply = () => {
    if (!draft) return;
    onChange(draft);
    onOpenChange(false);
  };

  const dayCountLabel = (range: DayRange) => {
    const n = countDays(range);
    return (n === 1 ? t('range_day_count_one') : t('range_day_count_other')).replace('{n}', String(n));
  };

  const active = !!value || open;

  return (
    <div className="relative flex-shrink-0" ref={rootRef}>
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={() => !disabled && onOpenChange(!open)}
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="dialog"
          title={t('range_toggle_desc')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm transition-all font-medium whitespace-nowrap cursor-pointer border ${
            value ? 'rounded-l-md' : 'rounded-md'
          } ${
            active
              ? 'bg-twitch-base border-twitch-base text-[var(--color-accent-ink)] shadow-md'
              : 'border-twitch-surfaceAlt bg-twitch-black text-gray-400 hover:text-white hover:bg-twitch-surfaceAlt'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <CalendarDays className="w-4 h-4 flex-shrink-0" />
          <span>{value ? formatDayRange(value, locale) : t('range_toggle')}</span>
        </button>
        {value && (
          <button
            type="button"
            onClick={() => { onChange(null); onOpenChange(false); }}
            disabled={disabled}
            aria-label={t('range_clear')}
            title={t('range_clear')}
            className="flex items-center justify-center px-1.5 rounded-r-md border border-l-0 border-twitch-base bg-twitch-base text-[var(--color-accent-ink)] hover:brightness-110 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="block w-px h-4 bg-current opacity-25 -ml-1.5 mr-1.5" aria-hidden="true" />
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div
          role="dialog"
          aria-label={t('range_toggle')}
          className="absolute top-full left-0 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-twitch-surfaceAlt border border-twitch-surfaceAlt rounded-xl shadow-xl z-30 p-3 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
              aria-label={t('range_prev_month')}
              title={t('range_prev_month')}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-twitch-black transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-white capitalize">{monthLabel}</span>
            <button
              type="button"
              onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
              disabled={isCurrentMonth}
              aria-label={t('range_next_month')}
              title={t('range_next_month')}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-twitch-black transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1 text-center" onMouseLeave={() => setHoverKey(null)}>
            {weekdayLabels.map((label, i) => (
              <span key={i} className="text-[10px] font-black uppercase text-gray-500 py-1">{label}</span>
            ))}
            {cells.map((key, i) => {
              if (!key) return <span key={`e${i}`} />;
              const future = key > todayKey;
              const isEdge = key === lo || key === hi;
              const inside = !!lo && !!hi && key > lo && key < hi;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={future}
                  onClick={() => pickDay(key)}
                  onMouseEnter={() => setHoverKey(key)}
                  aria-pressed={isEdge || inside}
                  aria-label={fromDayKey(key).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  className={`h-8 text-xs tabular-nums transition-colors cursor-pointer disabled:cursor-not-allowed disabled:text-gray-700 ${
                    isEdge
                      ? 'bg-twitch-base text-[var(--color-accent-ink)] font-black rounded-md'
                      : inside
                        ? 'bg-twitch-base/20 text-white'
                        : `text-gray-300 rounded-md hover:bg-twitch-black ${key === todayKey ? 'ring-1 ring-inset ring-twitch-base/60' : ''}`
                  }`}
                >
                  {Number(key.slice(8))}
                </button>
              );
            })}
          </div>

          <p className="mt-3 min-h-[1rem] text-[11px] font-medium text-gray-400">
            {!draftFrom
              ? t('range_pick_start')
              : !draftTo
                ? t('range_pick_end')
                : `${formatDayRange(draft!, locale)} · ${dayCountLabel(draft!)}`}
          </p>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 py-2 rounded-lg text-xs font-bold text-gray-400 hover:text-white bg-twitch-black/60 hover:bg-twitch-black transition-colors cursor-pointer"
            >
              {t('range_cancel')}
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={!draft}
              className="flex-1 py-2 rounded-lg text-xs font-black bg-twitch-base text-[var(--color-accent-ink)] hover:brightness-110 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t('range_apply')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DayRangeFilter;
