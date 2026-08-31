import React from 'react';
import { bandFor, type Band, type WorkingHours, type ZoneEntry } from '../types';
import { offsetLabel, offsetMinutes, zoneParts } from '../lib/time';

// ============================================================================
// The overlap grid.
// ----------------------------------------------------------------------------
// The point of a meeting planner is seeing, at a glance, which hour is decent
// for everyone. The old version converted one instant and stopped; a row of 24
// hours per zone is what actually answers the question.
// ============================================================================

interface OverlapGridProps {
  zones: ZoneEntry[];
  /** UTC ms of hour 0 of the reference day, in the reference zone. */
  dayStartMs: number;
  /** Currently selected hour offset from dayStart, 0-23. */
  selected: number;
  onSelect: (hour: number) => void;
  working: WorkingHours;
  locale: string;
  t: any;
}

const BAND_STYLE: Record<Band, string> = {
  night: 'bg-slate-800/40 text-slate-600',
  early: 'bg-emerald-500/10 text-emerald-300/70',
  work: 'bg-emerald-500/35 text-emerald-100',
  evening: 'bg-amber-500/15 text-amber-200/80',
};

const pad = (n: number) => String(n).padStart(2, '0');

export const OverlapGrid: React.FC<OverlapGridProps> = ({
  zones,
  dayStartMs,
  selected,
  onSelect,
  working,
  locale,
  t,
}) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // How many zones are inside working hours for each column: the number people
  // are really looking for.
  const score = hours.map(h => {
    const at = new Date(dayStartMs + h * 3600000);
    return zones.filter(z => {
      const hour = zoneParts(z.tz, at).hour;
      return hour >= working.start && hour < working.end;
    }).length;
  });
  const best = Math.max(...score, 0);

  return (
    <div className="rounded-2xl border border-white/5 bg-slate-950/40 overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          {/* header: how many zones are at work in each column */}
          <div className="flex items-end gap-px px-3 pt-3">
            <div className="w-32 shrink-0" />
            {hours.map(h => (
              <div key={h} className="flex-1 text-center">
                <div
                  className={`text-[9px] font-black tabular-nums ${
                    score[h] === best && best > 0 ? 'text-emerald-300' : 'text-slate-600'
                  }`}
                >
                  {score[h]}
                </div>
              </div>
            ))}
          </div>

          {zones.map(zone => {
            const off = offsetMinutes(zone.tz, new Date(dayStartMs));
            return (
              <div key={zone.tz} className="flex items-center gap-px px-3 py-1">
                <div className="w-32 shrink-0 pr-2 min-w-0">
                  <div className="text-xs font-bold text-white truncate">{zone.city}</div>
                  <div className="text-[10px] font-mono text-slate-500">{offsetLabel(off)}</div>
                </div>
                {hours.map(h => {
                  const at = new Date(dayStartMs + h * 3600000);
                  const p = zoneParts(zone.tz, at);
                  const band = bandFor(p.hour, working);
                  const isSelected = h === selected;
                  return (
                    <button
                      key={h}
                      onClick={() => onSelect(h)}
                      title={`${zone.city} ${pad(p.hour)}:${pad(p.minute)}`}
                      aria-label={`${zone.city} ${pad(p.hour)}:${pad(p.minute)}`}
                      className={`flex-1 h-8 text-[10px] font-bold tabular-nums transition-colors cursor-pointer ${
                        BAND_STYLE[band]
                      } ${isSelected ? 'ring-2 ring-emerald-400 ring-inset z-10 relative' : 'hover:brightness-125'} ${
                        p.hour === 0 ? 'border-l border-white/20' : ''
                      }`}
                    >
                      {pad(p.hour)}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3 border-t border-white/5 text-[10px] font-bold uppercase tracking-widest">
        <span className="flex items-center gap-1.5 text-emerald-100">
          <span className="w-3 h-3 rounded-sm bg-emerald-500/35" />
          {(t.legendWork || 'Working hours {a}-{b}').replace('{a}', String(working.start)).replace('{b}', String(working.end))}
        </span>
        <span className="flex items-center gap-1.5 text-emerald-300/70">
          <span className="w-3 h-3 rounded-sm bg-emerald-500/10" />
          {t.legendEarly || 'Early'}
        </span>
        <span className="flex items-center gap-1.5 text-amber-200/80">
          <span className="w-3 h-3 rounded-sm bg-amber-500/15" />
          {t.legendEvening || 'Evening'}
        </span>
        <span className="flex items-center gap-1.5 text-slate-500">
          <span className="w-3 h-3 rounded-sm bg-slate-800/60" />
          {t.legendNight || 'Night'}
        </span>
      </div>
    </div>
  );
};

export default OverlapGrid;
