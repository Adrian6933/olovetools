import React, { useEffect, useRef } from 'react';
import { ArrowDown, ArrowUp, CaseSensitive, Regex, Replace, ReplaceAll, WholeWord, X } from 'lucide-react';
import type { FindOptions } from '../lib/transforms';

interface FindReplaceProps {
  t: any;
  query: string;
  replacement: string;
  options: FindOptions;
  total: number;
  index: number;
  invalid: boolean;
  onQuery: (value: string) => void;
  onReplacement: (value: string) => void;
  onOption: (key: keyof FindOptions) => void;
  onStep: (delta: number) => void;
  onReplaceOne: () => void;
  onReplaceAll: () => void;
  onClose: () => void;
}

const toggleClass = (active: boolean) =>
  `p-2 rounded-lg border text-xs transition-all cursor-pointer ${
    active
      ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
      : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'
  }`;

export const FindReplace: React.FC<FindReplaceProps> = ({
  t,
  query,
  replacement,
  options,
  total,
  index,
  invalid,
  onQuery,
  onReplacement,
  onOption,
  onStep,
  onReplaceOne,
  onReplaceAll,
  onClose,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-3 space-y-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[10rem]">
          <input
            ref={inputRef}
            value={query}
            onChange={event => onQuery(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onStep(event.shiftKey ? -1 : 1);
              }
              if (event.key === 'Escape') onClose();
            }}
            placeholder={t.findPlaceholder || 'Find'}
            className={`w-full pl-3 pr-16 py-2 rounded-xl bg-black/50 border text-sm text-slate-100 outline-none transition-colors ${
              invalid ? 'border-red-500/60' : 'border-white/10 focus:border-teal-500/50'
            }`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-slate-500 tabular-nums">
            {invalid ? '!' : total === 0 ? '0' : `${index + 1}/${total}`}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button type="button" title={t.findCase || 'Match case'} onClick={() => onOption('caseSensitive')} className={toggleClass(options.caseSensitive)}>
            <CaseSensitive className="w-4 h-4" />
          </button>
          <button type="button" title={t.findWord || 'Whole word'} onClick={() => onOption('wholeWord')} className={toggleClass(options.wholeWord)}>
            <WholeWord className="w-4 h-4" />
          </button>
          <button type="button" title={t.findRegex || 'Regular expression'} onClick={() => onOption('regex')} className={toggleClass(options.regex)}>
            <Regex className="w-4 h-4" />
          </button>
          <span className="w-px h-6 bg-white/10 mx-0.5" />
          <button type="button" title={t.findPrev || 'Previous'} disabled={total === 0} onClick={() => onStep(-1)} className={`${toggleClass(false)} disabled:opacity-30 disabled:cursor-not-allowed`}>
            <ArrowUp className="w-4 h-4" />
          </button>
          <button type="button" title={t.findNext || 'Next'} disabled={total === 0} onClick={() => onStep(1)} className={`${toggleClass(false)} disabled:opacity-30 disabled:cursor-not-allowed`}>
            <ArrowDown className="w-4 h-4" />
          </button>
          <button type="button" title={t.close || 'Close'} onClick={onClose} className={toggleClass(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={replacement}
          onChange={event => onReplacement(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              event.preventDefault();
              if (event.ctrlKey || event.metaKey) onReplaceAll();
              else onReplaceOne();
            }
            if (event.key === 'Escape') onClose();
          }}
          placeholder={t.replacePlaceholder || 'Replace with'}
          className="flex-1 min-w-[10rem] px-3 py-2 rounded-xl bg-black/50 border border-white/10 focus:border-teal-500/50 text-sm text-slate-100 outline-none transition-colors"
        />
        <button
          type="button"
          onClick={onReplaceOne}
          disabled={total === 0}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <Replace className="w-3.5 h-3.5" />
          {t.replaceOne || 'Replace'}
        </button>
        <button
          type="button"
          onClick={onReplaceAll}
          disabled={total === 0}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-xs font-bold text-teal-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <ReplaceAll className="w-3.5 h-3.5" />
          {(t.replaceAll || 'Replace all ({n})').replace('{n}', String(total))}
        </button>
      </div>
    </div>
  );
};

export default FindReplace;
