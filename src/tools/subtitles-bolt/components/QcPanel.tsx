import React from 'react';
import { AlertTriangle, CheckCircle2, Wand2, XCircle } from 'lucide-react';
import type { PresetId, QcReport, Spec } from '../lib/qc';
import { PRESETS, countAutoFixable } from '../lib/qc';
import { formatIssue } from './CueEditor';

// ============================================================================
// Quality control panel
// ----------------------------------------------------------------------------
// The spec is editable, not hardcoded: the presets are the published numbers
// from Netflix, the BBC and YouTube, but every house style differs by a
// character or two and a tool that will not let you change them is a tool you
// stop using on the second job.
// ============================================================================

interface QcPanelProps {
  spec: Spec;
  preset: PresetId;
  onPreset: (id: PresetId) => void;
  onSpec: (patch: Partial<Spec>) => void;
  report: QcReport;
  onSeek: (uid: number) => void;
  onAutoFix: () => void;
  t: any;
}

const PRESET_LABELS: Record<PresetId, string> = {
  netflix: 'Netflix',
  bbc: 'BBC',
  youtube: 'YouTube',
  relaxed: 'Relaxed',
};

const FIELDS: { key: keyof Spec; labelKey: string; fallback: string; step: number }[] = [
  { key: 'maxCps', labelKey: 'spec_maxCps', fallback: 'Max characters/second', step: 1 },
  { key: 'maxLineLength', labelKey: 'spec_maxLineLength', fallback: 'Max characters/line', step: 1 },
  { key: 'maxLines', labelKey: 'spec_maxLines', fallback: 'Max lines', step: 1 },
  { key: 'minDuration', labelKey: 'spec_minDuration', fallback: 'Min duration (ms)', step: 50 },
  { key: 'maxDuration', labelKey: 'spec_maxDuration', fallback: 'Max duration (ms)', step: 100 },
  { key: 'minGap', labelKey: 'spec_minGap', fallback: 'Min gap (ms)', step: 10 },
];

export const QcPanel: React.FC<QcPanelProps> = ({
  spec, preset, onPreset, onSpec, report, onSeek, onAutoFix, t,
}) => {
  const fixable = countAutoFixable(report);
  // Only the first few of each kind are listed; a file with 400 fast cues does
  // not need 400 rows to make the point.
  const shown = report.issues.slice(0, 40);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(PRESETS) as PresetId[]).map(id => (
          <button
            key={id}
            onClick={() => onPreset(id)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer outline-none ${
              id === preset
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/25'
                : 'bg-[#08122a] border-white/5 text-slate-400 hover:text-white hover:border-blue-500/30'
            }`}
          >
            {t[`preset_${id}`] || PRESET_LABELS[id]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {FIELDS.map(field => (
          <label key={field.key} className="space-y-1 block">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 leading-tight block">
              {t[field.labelKey] || field.fallback}
            </span>
            <input
              type="number"
              min={0}
              step={field.step}
              value={spec[field.key]}
              onChange={e => {
                const value = Number(e.target.value);
                if (Number.isFinite(value) && value >= 0) onSpec({ [field.key]: value } as Partial<Spec>);
              }}
              className="w-full px-2 py-1.5 rounded-lg bg-[#020610] border border-white/10 focus:border-blue-500/50 text-blue-200 font-mono text-xs outline-none transition-colors"
            />
          </label>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5">
        <div className="text-center pt-3">
          <div className="text-lg font-black text-white tabular-nums">{report.errors}</div>
          <div className="text-[9px] uppercase tracking-wider text-slate-600 font-bold">{t.qc_errors || 'errors'}</div>
        </div>
        <div className="text-center pt-3">
          <div className="text-lg font-black text-white tabular-nums">{report.warnings}</div>
          <div className="text-[9px] uppercase tracking-wider text-slate-600 font-bold">{t.qc_warnings || 'warnings'}</div>
        </div>
        <div className="text-center pt-3">
          <div className="text-lg font-black text-white tabular-nums">{report.averageCps.toFixed(1)}</div>
          <div className="text-[9px] uppercase tracking-wider text-slate-600 font-bold">{t.qc_avgCps || 'avg cps'}</div>
        </div>
      </div>

      {fixable > 0 && (
        <button
          onClick={onAutoFix}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 border border-blue-500 text-white text-xs font-black hover:bg-blue-500 transition-all cursor-pointer outline-none"
        >
          <Wand2 className="w-4 h-4" />
          {(t.qc_autofix || 'Repair {n} timing problems').replace('{n}', String(fixable))}
        </button>
      )}
      {fixable > 0 && (
        <p className="text-[10px] text-slate-600 leading-relaxed -mt-3">
          {t.qc_autofixHint ||
            'Only the arithmetic ones: durations, overlaps, gaps and ordering. Reading speed and line length need rewriting, so they are left to you.'}
        </p>
      )}

      {report.issues.length === 0 ? (
        <div className="flex items-center gap-2 px-3 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {t.qc_clean || 'Every cue passes this spec.'}
        </div>
      ) : (
        <ul className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
          {shown.map((issue, i) => (
            <li key={i}>
              <button
                onClick={() => onSeek(issue.uid)}
                className={`w-full text-left flex items-start gap-2 px-3 py-2 rounded-lg border transition-colors cursor-pointer outline-none ${
                  issue.severity === 'error'
                    ? 'border-red-500/25 bg-red-500/[0.05] text-red-300 hover:border-red-500/50'
                    : 'border-amber-500/25 bg-amber-500/[0.04] text-amber-200/90 hover:border-amber-500/50'
                }`}
              >
                {issue.severity === 'error' ? (
                  <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                )}
                <span className="text-[11px] leading-relaxed flex-1 min-w-0">
                  <span className="font-mono text-slate-500 mr-1.5">#{issue.at + 1}</span>
                  {formatIssue(issue, t)}
                </span>
              </button>
            </li>
          ))}
          {report.issues.length > shown.length && (
            <li className="text-[10px] text-slate-600 px-3 pt-1">
              {(t.qc_more || '…and {n} more').replace('{n}', String(report.issues.length - shown.length))}
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default QcPanel;
