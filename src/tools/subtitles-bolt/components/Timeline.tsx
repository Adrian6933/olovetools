import React, { useMemo } from 'react';
import type { Cue } from '../lib/model';
import { toClock, totalDuration } from '../lib/model';
import type { QcIssue } from '../lib/qc';

// ============================================================================
// Track overview
// ----------------------------------------------------------------------------
// Subtitles are a shape in time and a list of rows hides it completely: a file
// that is fine for forty minutes and then falls apart looks exactly like a
// clean one until you scroll to cue 900. Each column is a slice of the running
// time, its height is how much of that slice is covered, and its colour is the
// worst issue inside it. Clicking a column jumps the editor there.
// ============================================================================

interface TimelineProps {
  cues: Cue[];
  issues: QcIssue[];
  onSeek: (uid: number) => void;
  t: any;
}

const COLUMNS = 80;

export const Timeline: React.FC<TimelineProps> = ({ cues, issues, onSeek, t }) => {
  const span = useMemo(() => totalDuration(cues), [cues]);

  const columns = useMemo(() => {
    if (cues.length === 0 || span <= 0) return [];
    const slice = span / COLUMNS;
    const buckets = Array.from({ length: COLUMNS }, () => ({
      covered: 0,
      severity: 'ok' as 'ok' | 'warning' | 'error',
      uid: 0,
    }));

    for (const cue of cues) {
      const from = Math.max(0, Math.floor(cue.start / slice));
      const to = Math.min(COLUMNS - 1, Math.floor(Math.max(cue.start, cue.end - 1) / slice));
      for (let i = from; i <= to; i++) {
        const left = i * slice;
        const right = left + slice;
        buckets[i].covered += Math.max(0, Math.min(cue.end, right) - Math.max(cue.start, left));
        if (buckets[i].uid === 0) buckets[i].uid = cue.uid;
      }
    }

    const worstByUid = new Map<number, 'warning' | 'error'>();
    for (const issue of issues) {
      const current = worstByUid.get(issue.uid);
      if (current !== 'error') worstByUid.set(issue.uid, issue.severity);
    }
    for (const cue of cues) {
      const severity = worstByUid.get(cue.uid);
      if (!severity) continue;
      const at = Math.min(COLUMNS - 1, Math.floor(cue.start / slice));
      if (severity === 'error' || buckets[at].severity === 'ok') {
        buckets[at].severity = severity;
        buckets[at].uid = cue.uid;
      }
    }

    return buckets.map((bucket, i) => ({
      ...bucket,
      ratio: Math.min(1, bucket.covered / slice),
      at: i * slice,
    }));
  }, [cues, issues, span]);

  if (columns.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-end gap-[2px] h-16" role="group" aria-label={t.timeline_label || 'Track overview'}>
        {columns.map((column, i) => (
          <button
            key={i}
            onClick={() => column.uid && onSeek(column.uid)}
            title={`${toClock(column.at)} — ${Math.round(column.ratio * 100)}%`}
            className={`flex-1 rounded-t-[2px] transition-opacity hover:opacity-100 cursor-pointer outline-none ${
              column.severity === 'error'
                ? 'bg-red-500/80'
                : column.severity === 'warning'
                  ? 'bg-amber-400/80'
                  : column.ratio > 0
                    ? 'bg-blue-500/70'
                    : 'bg-white/5'
            }`}
            style={{ height: column.ratio > 0 ? `${Math.max(12, column.ratio * 100)}%` : '8%' }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[9px] font-mono text-slate-600">
        <span>0:00</span>
        <span>{toClock(span / 2)}</span>
        <span>{toClock(span)}</span>
      </div>
    </div>
  );
};

export default Timeline;
