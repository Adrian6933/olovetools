import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { checkAll } from '../lib/platforms';
import type { Level, PlatformId } from '../lib/platforms';
import type { Cron } from '../lib/cron';

// ============================================================================
// Platform compatibility matrix
// ----------------------------------------------------------------------------
// The part that stops someone shipping a schedule that reads fine here and
// never fires there: Quartz needs a `?`, GitHub Actions ignores your timezone,
// EventBridge numbers Sunday as 1, plain Vixie has never heard of `L`.
// ============================================================================

interface PlatformMatrixProps {
  cron: Cron;
  evenIntervalMs: number;
  t: any;
}

const NAMES: Record<PlatformId, string> = {
  vixie: 'Linux crontab',
  k8s: 'Kubernetes',
  github: 'GitHub Actions',
  quartz: 'Quartz',
  spring: 'Spring',
  aws: 'AWS EventBridge',
  nodecron: 'node-cron',
  jenkins: 'Jenkins',
};

const FALLBACK_NOTES: Record<string, string> = {
  plat_fieldCount: 'Takes {want} fields, not {got}.',
  plat_noSpecials: 'Does not understand {tokens}.',
  plat_noQuestionMark: 'Does not accept "?" in the day fields.',
  plat_needsQuestionMark: 'Requires "?" in either the day-of-month or the day-of-week field.',
  plat_noMacros: 'Does not expand {macro}.',
  plat_noHash: 'The Jenkins "H" token only works in Jenkins.',
  plat_fixedZone: 'Always runs in {zone}; the timezone above is ignored.',
  plat_minInterval: 'Intervals shorter than {n} minutes are not honoured.',
  plat_githubDelay: 'Scheduled runs are queued and can start much later under load.',
  plat_awsWeekday: 'Numbers Sunday as 1, so every weekday value shifts by one.',
  plat_orRule: 'Both day fields are set, so the schedule fires when EITHER matches.',
  plat_noSeconds: 'Has no seconds field.',
};

const ICONS: Record<Level, React.ReactNode> = {
  ok: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  warn: <AlertTriangle className="w-4 h-4 text-amber-400" />,
  error: <XCircle className="w-4 h-4 text-red-400" />,
};

const RING: Record<Level, string> = {
  ok: 'border-emerald-500/20 bg-emerald-500/[0.04]',
  warn: 'border-amber-500/25 bg-amber-500/[0.05]',
  error: 'border-red-500/25 bg-red-500/[0.05]',
};

export const PlatformMatrix: React.FC<PlatformMatrixProps> = ({ cron, evenIntervalMs, t }) => {
  const reports = useMemo(() => checkAll(cron, evenIntervalMs), [cron, evenIntervalMs]);

  const text = (key: string, data: Record<string, string | number>): string => {
    const template = typeof t[key] === 'string' ? t[key] : FALLBACK_NOTES[key] || key;
    return template.replace(/\{(\w+)\}/g, (whole: string, name: string) =>
      name in data ? String(data[name]) : whole
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {reports.map(report => (
        <div key={report.id} className={`rounded-2xl border p-4 space-y-2 ${RING[report.level]}`}>
          <div className="flex items-center gap-2">
            {ICONS[report.level]}
            <span className="text-sm font-bold text-white">{NAMES[report.id]}</span>
          </div>
          {report.notes.length === 0 ? (
            <p className="text-[11px] text-slate-500 font-medium">{t.plat_clean || 'Runs as written.'}</p>
          ) : (
            <ul className="space-y-1">
              {report.notes.map((note, i) => (
                <li
                  key={i}
                  className={`text-[11px] leading-relaxed font-medium ${
                    note.level === 'error' ? 'text-red-300' : 'text-amber-200/85'
                  }`}
                >
                  {text(note.key, note.data || {})}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};

export default PlatformMatrix;
