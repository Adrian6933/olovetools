import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { activeDaysOfMonth, dayOfWeek, daysInMonth, hourHistogram } from '../lib/schedule';
import type { Cron } from '../lib/cron';

// ============================================================================
// Month heatmap
// ----------------------------------------------------------------------------
// A cron expression is a shape in time, and a list of five timestamps hides
// that shape completely: "0 0 1 * MON" and "0 0 * * MON" look almost identical
// in a list and completely different on a calendar. Everything here is derived
// from the AST with plain arithmetic, so it repaints while the user types.
// ============================================================================

interface ScheduleCalendarProps {
  cron: Cron;
  /** Today, in the schedule's timezone. */
  today: { y: number; mo: number; d: number };
  t: any;
  monthNames: string[];
  weekdayNames: string[];
  /** Runs per active day, used to shade the cells. */
  runsPerDay: number;
}

export const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({
  cron,
  today,
  t,
  monthNames,
  weekdayNames,
  runsPerDay,
}) => {
  const [offset, setOffset] = useState(0);

  const { year, month } = useMemo(() => {
    const raw = today.mo - 1 + offset;
    return { year: today.y + Math.floor(raw / 12), month: ((raw % 12) + 12) % 12 + 1 };
  }, [today.y, today.mo, offset]);

  const active = useMemo(() => activeDaysOfMonth(cron, year, month), [cron, year, month]);
  const hours = useMemo(() => hourHistogram(cron), [cron]);
  const peakHour = useMemo(() => Math.max(1, ...hours), [hours]);

  const first = dayOfWeek(year, month, 1);
  const total = daysInMonth(year, month);
  const activeCount = active.filter(Boolean).length;

  // Monday-first grid: every language in the suite except English reads a
  // calendar that way, and the weekday header is built from the same rotation.
  const lead = (first + 6) % 7;
  const headers = [1, 2, 3, 4, 5, 6, 0];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setOffset(o => o - 1)}
          aria-label={t.calendar_prev || 'Previous month'}
          className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-violet-500/30 flex items-center justify-center transition-all cursor-pointer outline-none"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <div className="text-sm font-black text-white tracking-tight">
            {monthNames[month - 1]} {year}
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            {(t.calendar_activeDays || '{n} of {total} days').replace('{n}', String(activeCount)).replace('{total}', String(total))}
          </div>
        </div>
        <button
          onClick={() => setOffset(o => o + 1)}
          aria-label={t.calendar_next || 'Next month'}
          className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-violet-500/30 flex items-center justify-center transition-all cursor-pointer outline-none"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {headers.map(d => (
          <div key={d} className="text-[9px] font-black uppercase tracking-wider text-slate-600 pb-1">
            {(weekdayNames[d] || '').slice(0, 2)}
          </div>
        ))}
        {Array.from({ length: lead }).map((_, i) => (
          <div key={`lead-${i}`} />
        ))}
        {active.map((on, i) => {
          const day = i + 1;
          const isToday = year === today.y && month === today.mo && day === today.d;
          return (
            <div
              key={day}
              title={on ? ((runsPerDay === 1 && t.calendar_runs_one) || t.calendar_runs || '{n} runs').replace('{n}', String(runsPerDay)) : ''}
              className={`aspect-square rounded-lg flex items-center justify-center text-[11px] font-bold border transition-colors ${
                on
                  ? 'bg-violet-600/45 border-violet-400/60 text-white'
                  : 'bg-[#12081e] border-white/5 text-slate-600'
              } ${isToday ? 'ring-2 ring-fuchsia-400/70' : ''}`}
            >
              {day}
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <div className="text-[10px] font-black uppercase tracking-wider text-slate-600">
          {t.calendar_hours || 'Hours of an active day'}
        </div>
        <div className="flex items-end gap-[3px] h-14">
          {hours.map((count, h) => (
            <div
              key={h}
              title={`${String(h).padStart(2, '0')}:00 — ${count}`}
              className={`flex-1 rounded-t-[3px] transition-all ${count > 0 ? 'bg-violet-500/70' : 'bg-white/5'}`}
              style={{ height: count > 0 ? `${Math.max(14, (count / peakHour) * 100)}%` : '10%' }}
            />
          ))}
        </div>
        <div className="flex justify-between text-[9px] font-mono text-slate-600">
          <span>00</span>
          <span>06</span>
          <span>12</span>
          <span>18</span>
          <span>23</span>
        </div>
      </div>
    </div>
  );
};

export default ScheduleCalendar;
