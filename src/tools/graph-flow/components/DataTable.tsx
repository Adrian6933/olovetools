import React, { useState } from 'react';
import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import type { DataSet, SeriesType } from '../types';
import { parseNumber } from '../utils/dataParser';
import { seriesColor } from '../utils/scene';

interface DataTableProps {
  data: DataSet;
  onChange: (next: DataSet, label: string) => void;
  palette: string[];
  t: any;
}

/** Editing 5,000 rows by hand is not a thing; rendering them all is just slow. */
const VISIBLE_ROWS = 150;

/** Clones before mutating — the dataset is also sitting in the undo history. */
function edit(data: DataSet): DataSet {
  return {
    labels: [...data.labels],
    series: data.series.map(s => ({ ...s, values: [...s.values] })),
  };
}

const cellClass =
  'w-full bg-transparent px-2.5 py-1.5 text-xs text-white font-mono outline-none rounded-lg ' +
  'border border-transparent hover:border-white/10 focus:border-amber-500/50 focus:bg-white/5 transition-colors';

export const DataTable: React.FC<DataTableProps> = ({ data, onChange, palette, t }) => {
  // Cells are kept as raw strings while focused so a half-typed "-" or "1."
  // is not swallowed by the number parser on every keystroke. `base` is the
  // committed value the draft started from: if the dataset moves underneath
  // (an undo, a redo, a fresh import) the draft is stale and gets ignored,
  // rather than showing a number the chart no longer has.
  const [draft, setDraft] = useState<Record<string, { raw: string; base: string }>>({});

  const rowCount = data.labels.length;
  const shown = Math.min(rowCount, VISIBLE_ROWS);

  const setLabel = (i: number, value: string) => {
    const next = edit(data);
    next.labels[i] = value;
    onChange(next, t.hist_edit_label || 'Edit label');
  };

  const commitValue = (row: number, col: number, raw: string) => {
    const next = edit(data);
    next.series[col].values[row] = parseNumber(raw) ?? 0;
    onChange(next, t.hist_edit_value || 'Edit value');
  };

  const setSeriesName = (col: number, value: string) => {
    const next = edit(data);
    next.series[col].name = value;
    onChange(next, t.hist_rename_series || 'Rename series');
  };

  const setSeriesColor = (col: number, value: string) => {
    const next = edit(data);
    next.series[col].color = value;
    onChange(next, t.hist_series_color || 'Series colour');
  };

  const setSeriesType = (col: number, value: SeriesType) => {
    const next = edit(data);
    next.series[col].type = value;
    onChange(next, t.hist_series_type || 'Series type');
  };

  const toggleHidden = (col: number) => {
    const next = edit(data);
    next.series[col].hidden = !next.series[col].hidden;
    onChange(next, t.hist_toggle_series || 'Toggle series');
  };

  const addRow = () => {
    const next = edit(data);
    next.labels.push(`${t.label_row || 'Row'} ${next.labels.length + 1}`);
    next.series.forEach(s => s.values.push(0));
    onChange(next, t.hist_add_row || 'Add row');
  };

  const removeRow = (i: number) => {
    if (data.labels.length <= 1) return;
    const next = edit(data);
    next.labels.splice(i, 1);
    next.series.forEach(s => s.values.splice(i, 1));
    onChange(next, t.hist_remove_row || 'Remove row');
  };

  const addSeries = () => {
    const next = edit(data);
    next.series.push({
      name: `${t.label_series || 'Series'} ${next.series.length + 1}`,
      values: new Array(next.labels.length).fill(0),
    });
    onChange(next, t.hist_add_series || 'Add series');
  };

  const removeSeries = (col: number) => {
    if (data.series.length <= 1) return;
    const next = edit(data);
    next.series.splice(col, 1);
    onChange(next, t.hist_remove_series || 'Remove series');
  };

  return (
    <div className="space-y-3">
      {/* The table is the one element that legitimately scrolls sideways;
          it must do so inside its own box, never by widening the page. */}
      <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/20">
        <table className="w-full border-collapse min-w-[380px]">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-2 py-2 sticky left-0 bg-[#12100c] z-10 min-w-[110px]">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                  {t.th_label || 'Label'}
                </span>
              </th>
              {data.series.map((s, col) => (
                <th key={col} className="px-2 py-2 min-w-[150px] align-top">
                  <div className="flex items-center gap-1.5">
                    <label className="relative w-4 h-4 shrink-0 rounded-[5px] overflow-hidden border border-white/20 cursor-pointer">
                      <span
                        className="absolute inset-0"
                        style={{ background: seriesColor(s, col, palette) }}
                      />
                      <input
                        type="color"
                        aria-label={`${t.label_series_color || 'Series colour'} — ${s.name}`}
                        value={seriesColor(s, col, palette)}
                        onChange={e => setSeriesColor(col, e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </label>
                    <input
                      value={s.name}
                      onChange={e => setSeriesName(col, e.target.value)}
                      className="flex-1 min-w-0 bg-transparent text-[11px] font-bold text-gray-200 outline-none border border-transparent hover:border-white/10 focus:border-amber-500/50 rounded-md px-1.5 py-1 transition-colors"
                    />
                    <button
                      onClick={() => toggleHidden(col)}
                      title={s.hidden ? (t.btn_show_series || 'Show series') : (t.btn_hide_series || 'Hide series')}
                      className="p-1 text-gray-600 hover:text-amber-400 transition-colors cursor-pointer shrink-0"
                    >
                      {s.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    {data.series.length > 1 && (
                      <button
                        onClick={() => removeSeries(col)}
                        title={t.btn_remove_series || 'Remove series'}
                        className="p-1 text-gray-600 hover:text-red-400 transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <select
                    value={s.type || 'auto'}
                    onChange={e => setSeriesType(col, e.target.value as SeriesType)}
                    className="mt-1 w-full bg-white/5 border border-white/10 rounded-md px-1.5 py-1 text-[10px] font-bold text-gray-400 outline-none focus:border-amber-500/40 cursor-pointer"
                  >
                    <option value="auto">{t.series_type_auto || 'Follow chart type'}</option>
                    <option value="bar">{t.series_type_bar || 'Draw as bars'}</option>
                    <option value="line">{t.series_type_line || 'Draw as a line'}</option>
                  </select>
                </th>
              ))}
              <th className="w-9" />
            </tr>
          </thead>
          <tbody>
            {data.labels.slice(0, shown).map((label, row) => (
              <tr key={row} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-2 py-0.5 sticky left-0 bg-[#12100c] z-10">
                  <input
                    value={label}
                    onChange={e => setLabel(row, e.target.value)}
                    className={cellClass + ' font-sans font-semibold'}
                  />
                </td>
                {data.series.map((s, col) => {
                  const key = `${row}:${col}`;
                  const committed = String(s.values[row] ?? 0);
                  const pending = draft[key];
                  const value = pending && pending.base === committed ? pending.raw : committed;
                  return (
                    <td key={col} className="px-2 py-0.5">
                      <input
                        inputMode="decimal"
                        value={value}
                        onChange={e => setDraft(d => ({ ...d, [key]: { raw: e.target.value, base: committed } }))}
                        onBlur={e => {
                          commitValue(row, col, e.target.value);
                          setDraft(d => {
                            const { [key]: _drop, ...rest } = d;
                            return rest;
                          });
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        }}
                        className={cellClass + ' text-right'}
                      />
                    </td>
                  );
                })}
                <td className="px-1">
                  {data.labels.length > 1 && (
                    <button
                      onClick={() => removeRow(row)}
                      title={t.label_remove_row || 'Remove row'}
                      className="p-1.5 text-gray-700 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rowCount > shown && (
        <p className="text-[11px] text-gray-500 font-medium">
          {(t.note_rows_hidden || 'Editing the first {shown} of {total} rows — the chart uses all of them.')
            .replace('{shown}', String(shown))
            .replace('{total}', String(rowCount))}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={addRow}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> {t.label_add_row || 'Add row'}
        </button>
        <button
          onClick={addSeries}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> {t.label_add_series || 'Add series'}
        </button>
      </div>
    </div>
  );
};

export default DataTable;
