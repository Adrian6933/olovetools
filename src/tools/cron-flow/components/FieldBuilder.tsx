import React, { useCallback, useMemo, useRef, useState } from 'react';
import { CheckCheck, Eraser, Info } from 'lucide-react';
import { FIELD_RANGES, valuesToField } from '../lib/cron';
import type { Cron, Field, FieldKind } from '../lib/cron';

// ============================================================================
// Visual field builder
// ----------------------------------------------------------------------------
// The manual path: it never needs the text input, so somebody who has no idea
// what a cron string looks like can click a schedule together and read the
// expression back afterwards. Every click writes a whole new expression, which
// is what keeps the text box and the grid from drifting apart — there is one
// source of truth (the string) and this is just another way to edit it.
// ============================================================================

interface FieldBuilderProps {
  cron: Cron;
  onChange: (expression: string) => void;
  t: any;
  /** Month and weekday names, so the grid is not numbers-only. */
  monthNames: string[];
  weekdayNames: string[];
}

const GRID_COLUMNS: Record<FieldKind, string> = {
  second: 'grid-cols-6 sm:grid-cols-10',
  minute: 'grid-cols-6 sm:grid-cols-10',
  hour: 'grid-cols-6 sm:grid-cols-8',
  day: 'grid-cols-7 sm:grid-cols-8',
  month: 'grid-cols-3 sm:grid-cols-4',
  weekday: 'grid-cols-4 sm:grid-cols-7',
  year: 'grid-cols-4 sm:grid-cols-6',
};

/** Steps offered as one-click shortcuts, per field. */
const QUICK_STEPS: Record<string, number[]> = {
  second: [5, 10, 15, 30],
  minute: [5, 10, 15, 30],
  hour: [2, 3, 4, 6, 12],
  day: [2, 7, 10],
  month: [2, 3, 6],
  weekday: [],
  year: [],
};

export const FieldBuilder: React.FC<FieldBuilderProps> = ({
  cron,
  onChange,
  t,
  monthNames,
  weekdayNames,
}) => {
  // El tipo va escrito a mano: desde TS 5.5 un filtro como este se infiere como
  // predicado de tipo y devuelve Exclude<FieldKind, 'year'>[], contra el que ya
  // no se puede buscar un FieldKind cualquiera. La lista sigue siendo de
  // FieldKind, sólo que sin el año.
  const editable: FieldKind[] = cron.order.filter(k => k !== 'year');
  const [active, setActive] = useState<FieldKind>('minute');
  // Anchor for shift-click range selection, per field.
  const anchor = useRef<Record<string, number>>({});

  const kind: FieldKind = editable.indexOf(active) === -1 ? editable[0] : active;
  const field: Field = cron.fields[kind];
  const range = FIELD_RANGES[kind];
  // Sunday is both 0 and 7 on input; the grid only ever shows 0-6.
  const top = kind === 'weekday' ? 6 : range.max;

  const selected = useMemo(() => new Set(field.values), [field]);

  const write = useCallback(
    (values: number[]) => {
      const raw = valuesToField(values, kind);
      onChange(cron.order.map(k => (k === kind ? raw : cron.fields[k].raw)).join(' '));
    },
    [cron, kind, onChange]
  );

  const toggle = useCallback(
    (value: number, shiftKey: boolean) => {
      const next = new Set(selected);
      const from = anchor.current[kind];
      if (shiftKey && typeof from === 'number') {
        const lo = Math.min(from, value);
        const hi = Math.max(from, value);
        const adding = !next.has(value);
        for (let v = lo; v <= hi; v++) {
          if (adding) next.add(v);
          else next.delete(v);
        }
      } else {
        if (next.has(value)) next.delete(value);
        else next.add(value);
        anchor.current[kind] = value;
      }
      write(Array.from(next).sort((a, b) => a - b));
    },
    [selected, kind, write]
  );

  const selectAll = () => {
    const all: number[] = [];
    for (let v = range.min; v <= top; v++) all.push(v);
    write(all);
  };

  const clear = () => {
    // An empty field is not expressible in cron, so "none" means "just the
    // first value" — which is what the user is about to build on anyway.
    write([range.min]);
  };

  const applyStep = (step: number) => {
    const values: number[] = [];
    for (let v = range.min; v <= top; v += step) values.push(v);
    write(values);
  };

  const labelFor = (value: number): string => {
    if (kind === 'month') return (monthNames[value - 1] || String(value)).slice(0, 3);
    if (kind === 'weekday') return (weekdayNames[value] || String(value)).slice(0, 3);
    return String(value);
  };

  const cells: number[] = [];
  for (let v = range.min; v <= top; v++) cells.push(v);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {editable.map(k => (
          <button
            key={k}
            onClick={() => setActive(k)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border transition-all cursor-pointer outline-none ${
              k === kind
                ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/25'
                : 'bg-[#160a24] border-white/5 text-slate-400 hover:text-white hover:border-violet-500/30'
            }`}
          >
            {t[`field_${k}`] || k}
            <span className="ml-2 font-mono normal-case tracking-normal opacity-60">{cron.fields[k].raw}</span>
          </button>
        ))}
      </div>

      {field.specials.length > 0 && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-[11px] leading-relaxed">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            {t.builder_specialWarning ||
              'This field uses an advanced token (L, W or #). Clicking the grid replaces it with plain values.'}
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={selectAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-[11px] font-bold hover:bg-white/10 transition-all cursor-pointer outline-none"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          {t.builder_all || 'Every value'}
        </button>
        <button
          onClick={clear}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-[11px] font-bold hover:bg-white/10 transition-all cursor-pointer outline-none"
        >
          <Eraser className="w-3.5 h-3.5" />
          {t.builder_clear || 'Reset to one'}
        </button>
        {(QUICK_STEPS[kind] || []).map(step => (
          <button
            key={step}
            onClick={() => applyStep(step)}
            className="px-3 py-1.5 rounded-lg bg-violet-600/10 border border-violet-600/25 text-violet-300 text-[11px] font-bold hover:bg-violet-600/20 transition-all cursor-pointer outline-none font-mono"
          >
            /{step}
          </button>
        ))}
        <span className="text-[10px] text-slate-600 font-medium ml-auto hidden sm:block">
          {t.builder_shiftHint || 'Shift-click to select a range'}
        </span>
      </div>

      <div className={`grid ${GRID_COLUMNS[kind]} gap-1.5`}>
        {cells.map(value => {
          const on = selected.has(value);
          return (
            <button
              key={value}
              onClick={e => toggle(value, e.shiftKey)}
              aria-pressed={on}
              className={`py-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer outline-none ${
                on
                  ? 'bg-violet-600/80 border-violet-400 text-white'
                  : 'bg-[#12081e] border-white/5 text-slate-500 hover:border-violet-500/30 hover:text-slate-300'
              }`}
            >
              {labelFor(value)}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FieldBuilder;
