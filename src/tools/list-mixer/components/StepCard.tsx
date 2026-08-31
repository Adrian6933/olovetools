import React from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Trash2 } from 'lucide-react';
import type { CaseMode, SetMode, SortKind, Step, StepStat } from '../types';

// ============================================================================
// One step of the recipe, with its own controls.
// ----------------------------------------------------------------------------
// Because the pipeline is a description rather than an applied change, every
// field here can be edited after the fact: change the separator of a numbering
// step you added ten operations ago and the output re-derives. The eye toggle
// disables a step without deleting it, which is the cheap way to answer "what
// did this one actually do?".
// ============================================================================

interface StepCardProps {
  step: Step;
  stat: StepStat;
  index: number;
  total: number;
  t: any;
  onChange: (next: Step) => void;
  onRemove: () => void;
  onMove: (delta: number) => void;
}

const fieldClass =
  'min-w-0 px-2 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[11px] text-slate-100 font-mono outline-none focus:border-orange-500/50 transition-colors';

const chipClass = (active: boolean) =>
  `px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-colors cursor-pointer ${
    active
      ? 'bg-orange-500/20 border-orange-500/50 text-orange-200'
      : 'bg-white/[0.03] border-white/10 text-slate-500 hover:text-slate-300'
  }`;

/** A labelled on/off chip; the whole thing is one clickable control. */
const Toggle: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button type="button" onClick={onClick} className={chipClass(active)}>
    {label}
  </button>
);

/** A small segmented control for the enum fields. */
function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (next: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map(option => (
        <button key={option.id} type="button" onClick={() => onChange(option.id)} className={chipClass(value === option.id)}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

export const StepCard: React.FC<StepCardProps> = ({ step, stat, index, total, t, onChange, onRemove, onMove }) => {
  const label = t[`op_${step.op}`] || step.op;
  const delta = stat ? stat.itemsOut - stat.itemsIn : 0;
  const edited = stat ? stat.edited : 0;
  const error = stat ? stat.error : '';

  const body = (() => {
    switch (step.op) {
      case 'sort':
        return (
          <>
            <Segmented<SortKind>
              value={step.kind}
              options={[
                { id: 'text', label: t.sortKindText || 'A-Z' },
                { id: 'numeric', label: t.sortKindNumeric || '1-9' },
                { id: 'length', label: t.sortKindLength || 'len' },
              ]}
              onChange={kind => onChange({ ...step, kind })}
            />
            <Toggle label={t.sortDescShort || 'desc'} active={step.desc} onClick={() => onChange({ ...step, desc: !step.desc })} />
            <Toggle
              label={t.ignoreCaseShort || 'Aa'}
              active={step.ignoreCase}
              onClick={() => onChange({ ...step, ignoreCase: !step.ignoreCase })}
            />
          </>
        );

      case 'shuffle':
        return (
          <label className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 shrink-0">
              {t.seedLabel || 'seed'}
            </span>
            <input
              type="text"
              value={step.seed}
              onChange={event => onChange({ ...step, seed: event.target.value })}
              placeholder={t.seedPlaceholder || 'empty = crypto'}
              className={`${fieldClass} w-32`}
            />
          </label>
        );

      case 'sample':
        return (
          <>
            <label className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{t.countLabel || 'how many'}</span>
              <input
                type="number"
                min={1}
                value={step.count}
                onChange={event => onChange({ ...step, count: Number(event.target.value) })}
                className={`${fieldClass} w-16`}
              />
            </label>
            <label className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 shrink-0">
                {t.seedLabel || 'seed'}
              </span>
              <input
                type="text"
                value={step.seed}
                onChange={event => onChange({ ...step, seed: event.target.value })}
                placeholder={t.seedPlaceholder || 'empty = crypto'}
                className={`${fieldClass} w-28`}
              />
            </label>
          </>
        );

      case 'slice':
        return (
          <>
            <label className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{t.fromLabel || 'from'}</span>
              <input
                type="number"
                min={1}
                value={step.from}
                onChange={event => onChange({ ...step, from: Number(event.target.value) })}
                className={`${fieldClass} w-16`}
              />
            </label>
            <label className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{t.toLabel || 'to'}</span>
              <input
                type="number"
                min={0}
                value={step.to}
                onChange={event => onChange({ ...step, to: Number(event.target.value) })}
                className={`${fieldClass} w-16`}
              />
            </label>
            <span className="text-[10px] text-slate-600">{t.sliceHint || '0 = to the end'}</span>
          </>
        );

      case 'dedupe':
        return (
          <>
            <Toggle
              label={t.ignoreCaseShort || 'Aa'}
              active={step.ignoreCase}
              onClick={() => onChange({ ...step, ignoreCase: !step.ignoreCase })}
            />
            <Toggle
              label={t.trimmedShort || 'trim'}
              active={step.trimmed}
              onClick={() => onChange({ ...step, trimmed: !step.trimmed })}
            />
            <Toggle
              label={t.keepLastShort || 'keep last'}
              active={step.keepLast}
              onClick={() => onChange({ ...step, keepLast: !step.keepLast })}
            />
          </>
        );

      case 'onlyDupes':
        return (
          <>
            <Toggle
              label={t.ignoreCaseShort || 'Aa'}
              active={step.ignoreCase}
              onClick={() => onChange({ ...step, ignoreCase: !step.ignoreCase })}
            />
            <Toggle
              label={t.trimmedShort || 'trim'}
              active={step.trimmed}
              onClick={() => onChange({ ...step, trimmed: !step.trimmed })}
            />
          </>
        );

      case 'dedupeWords':
        return (
          <Toggle
            label={t.ignoreCaseShort || 'Aa'}
            active={step.ignoreCase}
            onClick={() => onChange({ ...step, ignoreCase: !step.ignoreCase })}
          />
        );

      case 'case':
        return (
          <Segmented<CaseMode>
            value={step.mode}
            options={[
              { id: 'upper', label: t.caseUpper || 'UPPER' },
              { id: 'lower', label: t.caseLower || 'lower' },
              { id: 'title', label: t.caseTitle || 'Title' },
              { id: 'sentence', label: t.caseSentence || 'Sentence' },
            ]}
            onChange={mode => onChange({ ...step, mode })}
          />
        );

      case 'filter':
        return (
          <>
            <Segmented<string>
              value={step.remove ? 'remove' : 'keep'}
              options={[
                { id: 'keep', label: t.filterKeep || 'keep' },
                { id: 'remove', label: t.filterRemove || 'remove' },
              ]}
              onChange={mode => onChange({ ...step, remove: mode === 'remove' })}
            />
            <input
              type="text"
              value={step.pattern}
              onChange={event => onChange({ ...step, pattern: event.target.value })}
              placeholder={t.patternPlaceholder || 'text or pattern'}
              className={`${fieldClass} flex-1 min-w-[8rem]`}
            />
            <Toggle label=".*" active={step.regex} onClick={() => onChange({ ...step, regex: !step.regex })} />
            <Toggle
              label={t.ignoreCaseShort || 'Aa'}
              active={step.ignoreCase}
              onClick={() => onChange({ ...step, ignoreCase: !step.ignoreCase })}
            />
          </>
        );

      case 'length':
        return (
          <>
            <Segmented<string>
              value={step.max ? 'max' : 'min'}
              options={[
                { id: 'min', label: t.lengthMin || 'at least' },
                { id: 'max', label: t.lengthMax || 'at most' },
              ]}
              onChange={mode => onChange({ ...step, max: mode === 'max' })}
            />
            <input
              type="number"
              min={0}
              value={step.value}
              onChange={event => onChange({ ...step, value: Number(event.target.value) })}
              className={`${fieldClass} w-16`}
            />
            <span className="text-[10px] text-slate-600">{t.charsLabel || 'characters'}</span>
          </>
        );

      case 'replace':
        return (
          <>
            <input
              type="text"
              value={step.find}
              onChange={event => onChange({ ...step, find: event.target.value })}
              placeholder={t.findPlaceholder || 'find'}
              className={`${fieldClass} flex-1 min-w-[6rem]`}
            />
            <input
              type="text"
              value={step.replace}
              onChange={event => onChange({ ...step, replace: event.target.value })}
              placeholder={t.replacePlaceholder || 'replace with'}
              className={`${fieldClass} flex-1 min-w-[6rem]`}
            />
            <Toggle label=".*" active={step.regex} onClick={() => onChange({ ...step, regex: !step.regex })} />
            <Toggle
              label={t.ignoreCaseShort || 'Aa'}
              active={step.ignoreCase}
              onClick={() => onChange({ ...step, ignoreCase: !step.ignoreCase })}
            />
          </>
        );

      case 'affix':
        return (
          <>
            <input
              type="text"
              value={step.prefix}
              onChange={event => onChange({ ...step, prefix: event.target.value })}
              placeholder={t.prefixPlaceholder || 'before'}
              className={`${fieldClass} flex-1 min-w-[5rem]`}
            />
            <span className="text-[10px] font-mono text-slate-600 shrink-0">item</span>
            <input
              type="text"
              value={step.suffix}
              onChange={event => onChange({ ...step, suffix: event.target.value })}
              placeholder={t.suffixPlaceholder || 'after'}
              className={`${fieldClass} flex-1 min-w-[5rem]`}
            />
          </>
        );

      case 'number':
        return (
          <>
            <label className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{t.startLabel || 'start'}</span>
              <input
                type="number"
                value={step.start}
                onChange={event => onChange({ ...step, start: Number(event.target.value) })}
                className={`${fieldClass} w-14`}
              />
            </label>
            <label className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{t.padLabel || 'pad'}</span>
              <input
                type="number"
                min={0}
                max={12}
                value={step.pad}
                onChange={event => onChange({ ...step, pad: Number(event.target.value) })}
                className={`${fieldClass} w-14`}
              />
            </label>
            <label className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 shrink-0">
                {t.separatorLabel || 'sep'}
              </span>
              <input
                type="text"
                value={step.separator}
                onChange={event => onChange({ ...step, separator: event.target.value })}
                className={`${fieldClass} w-16`}
              />
            </label>
          </>
        );

      case 'set':
        return (
          <>
            <Segmented<SetMode>
              value={step.mode}
              options={[
                { id: 'intersect', label: t.setIntersect || 'in both' },
                { id: 'diff', label: t.setDiff || 'only in A' },
                { id: 'symdiff', label: t.setSymdiff || 'not shared' },
                { id: 'union', label: t.setUnion || 'union' },
                { id: 'append', label: t.setAppend || 'B after' },
                { id: 'prepend', label: t.setPrepend || 'B before' },
                { id: 'interleave', label: t.setInterleave || 'alternate' },
              ]}
              onChange={mode => onChange({ ...step, mode })}
            />
            <Toggle
              label={t.ignoreCaseShort || 'Aa'}
              active={step.ignoreCase}
              onClick={() => onChange({ ...step, ignoreCase: !step.ignoreCase })}
            />
            <Toggle
              label={t.trimmedShort || 'trim'}
              active={step.trimmed}
              onClick={() => onChange({ ...step, trimmed: !step.trimmed })}
            />
          </>
        );

      default:
        return <span className="text-[10px] text-slate-600">{t.noOptions || 'No options'}</span>;
    }
  })();

  return (
    <div
      className={`rounded-2xl border px-3 py-2.5 space-y-2 transition-colors ${
        error
          ? 'border-red-500/40 bg-red-500/5'
          : step.enabled
            ? 'border-white/10 bg-white/[0.03] hover:border-orange-500/25'
            : 'border-white/5 bg-white/[0.01] opacity-55'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-5 h-5 shrink-0 rounded-md bg-orange-500/15 text-orange-300 text-[10px] font-black flex items-center justify-center">
          {index + 1}
        </span>
        <span className="text-[12px] font-bold text-white truncate min-w-0 flex-1">{label}</span>

        {stat && step.enabled && (
          <span className="shrink-0 text-[10px] font-mono text-slate-500 tabular-nums">
            {delta !== 0 && (
              <span className={delta < 0 ? 'text-orange-300' : 'text-emerald-300'}>
                {delta > 0 ? '+' : ''}
                {delta.toLocaleString()}
              </span>
            )}
            {delta === 0 && edited > 0 && <span className="text-amber-300">~{edited.toLocaleString()}</span>}
            {delta === 0 && edited === 0 && <span className="opacity-50">=</span>}
          </span>
        )}

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            title={t.moveUp || 'Move up'}
            className="p-1 rounded-md text-slate-500 hover:text-orange-300 hover:bg-white/5 disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            title={t.moveDown || 'Move down'}
            className="p-1 rounded-md text-slate-500 hover:text-orange-300 hover:bg-white/5 disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...step, enabled: !step.enabled })}
            title={step.enabled ? t.disableStep || 'Disable this step' : t.enableStep || 'Enable this step'}
            className="p-1 rounded-md text-slate-500 hover:text-orange-300 hover:bg-white/5 transition-colors cursor-pointer"
          >
            {step.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onRemove}
            title={t.removeStep || 'Remove this step'}
            className="p-1 rounded-md text-slate-500 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">{body}</div>

      {error && <p className="text-[10px] text-red-300 font-mono break-words">{error}</p>}
    </div>
  );
};

export default StepCard;
