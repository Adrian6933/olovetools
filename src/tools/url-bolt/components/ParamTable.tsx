import React, { useCallback } from 'react';
import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from 'lucide-react';
import type { QueryParam } from '../lib/parse';
import { classify } from '../lib/tracking';

interface ParamTableProps {
  params: QueryParam[];
  onChange: (params: QueryParam[]) => void;
  t: any;
  /** Announces a copied value to the parent, which owns the toast. */
  onCopy?: (text: string) => void;
}

let localId = 0;
const newId = () => `n${++localId}`;

const GROUP_TONE: Record<string, string> = {
  campaign: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  ads: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  social: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  email: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  analytics: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  misc: 'text-slate-400 bg-white/5 border-white/10',
};

/**
 * The editable query string.
 *
 * Every mutation marks its row `dirty`, which is what tells `serialize` to
 * re-encode that parameter and leave every other one byte-for-byte alone.
 */
export const ParamTable: React.FC<ParamTableProps> = ({ params, onChange, t, onCopy }) => {
  const update = useCallback(
    (id: string, patch: Partial<QueryParam>) => {
      onChange(params.map(param => (param.id === id ? { ...param, ...patch, dirty: true } : param)));
    },
    [params, onChange]
  );

  const remove = useCallback((id: string) => onChange(params.filter(p => p.id !== id)), [params, onChange]);

  const move = useCallback(
    (index: number, delta: number) => {
      const target = index + delta;
      if (target < 0 || target >= params.length) return;
      const next = [...params];
      [next[index], next[target]] = [next[target], next[index]];
      onChange(next);
    },
    [params, onChange]
  );

  const add = useCallback(() => {
    onChange([
      ...params,
      { id: newId(), key: '', value: '', rawKey: '', rawValue: '', hasValue: true, dirty: true },
    ]);
  }, [params, onChange]);

  return (
    <div className="space-y-2">
      {params.length === 0 && (
        <p className="text-xs text-slate-500 font-medium px-1 py-3">
          {t.paramsEmpty || 'This URL has no query parameters. Add one to build a query string.'}
        </p>
      )}

      {params.map((param, index) => {
        const tracker = param.key ? classify(param.key) : null;
        return (
          <div
            key={param.id}
            className={`grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto] gap-2 p-2.5 rounded-2xl border transition-colors ${
              tracker
                ? 'bg-amber-500/[0.04] border-amber-500/15'
                : 'bg-white/[0.02] border-white/5 hover:border-white/10'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <input
                value={param.key}
                onChange={e => update(param.id, { key: e.target.value })}
                placeholder={t.paramKey || 'key'}
                spellCheck={false}
                className="w-full min-w-0 bg-transparent border border-white/5 focus:border-sky-500/40 rounded-lg px-2.5 py-1.5 font-mono text-xs text-sky-300 placeholder-slate-600 outline-none"
              />
              {tracker && (
                <span
                  className={`shrink-0 px-1.5 py-0.5 rounded border text-[9px] font-black uppercase tracking-wider ${
                    GROUP_TONE[tracker.group] || GROUP_TONE.misc
                  }`}
                  title={t.trackerBadgeHint || 'Recognised tracking parameter'}
                >
                  {t[`group_${tracker.group}`] || tracker.group}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <input
                value={param.value}
                onChange={e => update(param.id, { value: e.target.value, hasValue: true })}
                placeholder={param.hasValue ? t.paramValue || 'value' : t.paramNoValue || '(no value)'}
                spellCheck={false}
                className="w-full min-w-0 bg-transparent border border-white/5 focus:border-emerald-500/40 rounded-lg px-2.5 py-1.5 font-mono text-xs text-emerald-300 placeholder-slate-600 outline-none"
              />
            </div>

            <div className="flex items-center gap-1 justify-end">
              {onCopy && (
                <button
                  onClick={() => onCopy(param.value)}
                  title={t.tooltip_copy || 'Copy'}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => move(index, -1)}
                disabled={index === 0}
                title={t.paramMoveUp || 'Move up'}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => move(index, 1)}
                disabled={index === params.length - 1}
                title={t.paramMoveDown || 'Move down'}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => remove(param.id)}
                title={t.paramRemove || 'Remove'}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}

      <button
        onClick={add}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/5 text-slate-400 hover:text-emerald-300 text-xs font-bold transition-all cursor-pointer w-full justify-center"
      >
        <Plus className="w-3.5 h-3.5" />
        {t.paramAdd || 'Add parameter'}
      </button>
    </div>
  );
};

export default ParamTable;
