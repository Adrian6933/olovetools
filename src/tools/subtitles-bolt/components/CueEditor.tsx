import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Plus, Search, Trash2, XCircle } from 'lucide-react';
import type { Cue } from '../lib/model';
import { cps, duration, toSrtTime, parseTime } from '../lib/model';
import type { QcIssue } from '../lib/qc';

// ============================================================================
// Cue editor
// ----------------------------------------------------------------------------
// The old build was read-only: you could see that a cue was wrong and do
// nothing about it. This is the manual path — every timestamp and every line is
// editable, and the quality checks colour the rows so the broken ones are the
// ones you land on.
//
// Rows are paged rather than all mounted. A feature film is 1200-1800 cues, and
// mounting three textareas each is a second of layout on every keystroke.
// ============================================================================

const PAGE_SIZE = 40;

interface CueEditorProps {
  cues: Cue[];
  issuesByUid: Map<number, QcIssue[]>;
  onChange: (uid: number, patch: Partial<Cue>) => void;
  onDelete: (uid: number) => void;
  onInsertAfter: (uid: number) => void;
  /** Set by the QC panel when the user clicks an issue. */
  focusUid: number;
  t: any;
  maxCps: number;
}

export const CueEditor: React.FC<CueEditorProps> = ({
  cues,
  issuesByUid,
  onChange,
  onDelete,
  onInsertAfter,
  focusUid,
  t,
  maxCps,
}) => {
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const rowRefs = useRef<Record<number, HTMLDivElement>>({});

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle === '') return cues;
    return cues.filter(cue => cue.lines.join(' ').toLowerCase().indexOf(needle) !== -1);
  }, [cues, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  // Jumping to an issue has to turn the page first, or the row it wants to
  // scroll to is not mounted.
  useEffect(() => {
    if (!focusUid) return;
    const at = filtered.findIndex(cue => cue.uid === focusUid);
    if (at === -1) return;
    const target = Math.floor(at / PAGE_SIZE);
    if (target !== safePage) setPage(target);
    const row = rowRefs.current[focusUid];
    if (row) row.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [focusUid, filtered, safePage]);

  const commitTime = (uid: number, field: 'start' | 'end', raw: string) => {
    const ms = parseTime(raw);
    if (Number.isFinite(ms)) onChange(uid, { [field]: ms } as Partial<Cue>);
  };

  if (cues.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-10 text-center">
        {t.editor_empty || 'Load a subtitle file and every cue becomes editable here.'}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[10rem]">
          <Search className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder={t.editor_search || 'Search the text…'}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#08122a] border border-white/10 focus:border-blue-500/50 text-slate-200 text-xs outline-none transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={safePage === 0}
            aria-label={t.editor_prevPage || 'Previous page'}
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer outline-none disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-slate-500 tabular-nums px-1">
            {safePage + 1}/{pageCount}
          </span>
          <button
            onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
            disabled={safePage >= pageCount - 1}
            aria-label={t.editor_nextPage || 'Next page'}
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer outline-none disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="text-xs text-slate-500 py-6 text-center">{t.editor_noMatch || 'Nothing matches that search.'}</p>
      )}

      <div className="space-y-2">
        {visible.map(cue => {
          const issues = issuesByUid.get(cue.uid) || [];
          const worst = issues.some(i => i.severity === 'error') ? 'error' : issues.length > 0 ? 'warning' : 'ok';
          const speed = cps(cue);
          const index = cues.indexOf(cue) + 1;
          return (
            <div
              key={cue.uid}
              ref={el => {
                rowRefs.current[cue.uid] = el;
              }}
              className={`rounded-xl border p-3 space-y-2 transition-colors ${
                worst === 'error'
                  ? 'border-red-500/35 bg-red-500/[0.05]'
                  : worst === 'warning'
                    ? 'border-amber-500/30 bg-amber-500/[0.04]'
                    : 'border-white/5 bg-[#08122a]'
              } ${focusUid === cue.uid ? 'ring-2 ring-blue-400/60' : ''}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono text-slate-600 w-8 shrink-0 tabular-nums">{index}</span>
                <input
                  defaultValue={toSrtTime(cue.start)}
                  key={`s-${cue.uid}-${cue.start}`}
                  onBlur={e => commitTime(cue.uid, 'start', e.target.value)}
                  spellCheck={false}
                  aria-label={t.editor_start || 'Start'}
                  className="w-[7.5rem] px-2 py-1.5 rounded-lg bg-[#020610] border border-white/10 focus:border-blue-500/50 text-blue-200 font-mono text-[11px] outline-none transition-colors"
                />
                <span className="text-slate-600 text-xs">→</span>
                <input
                  defaultValue={toSrtTime(cue.end)}
                  key={`e-${cue.uid}-${cue.end}`}
                  onBlur={e => commitTime(cue.uid, 'end', e.target.value)}
                  spellCheck={false}
                  aria-label={t.editor_end || 'End'}
                  className="w-[7.5rem] px-2 py-1.5 rounded-lg bg-[#020610] border border-white/10 focus:border-blue-500/50 text-blue-200 font-mono text-[11px] outline-none transition-colors"
                />
                <span className="text-[10px] font-mono text-slate-600 tabular-nums">
                  {(duration(cue) / 1000).toFixed(1)}s
                </span>
                <span
                  className={`text-[10px] font-mono font-bold tabular-nums px-1.5 py-0.5 rounded ${
                    speed > maxCps ? 'bg-amber-500/15 text-amber-300' : 'text-slate-600'
                  }`}
                  title={t.editor_cps || 'Characters per second'}
                >
                  {Number.isFinite(speed) ? speed.toFixed(1) : '∞'} cps
                </span>
                <div className="ml-auto flex items-center gap-1">
                  <button
                    onClick={() => onInsertAfter(cue.uid)}
                    title={t.editor_insert || 'Insert a cue after this one'}
                    className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-blue-500/40 flex items-center justify-center transition-all cursor-pointer outline-none"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(cue.uid)}
                    title={t.editor_delete || 'Delete this cue'}
                    className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-red-300 hover:border-red-500/40 flex items-center justify-center transition-all cursor-pointer outline-none"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <textarea
                defaultValue={cue.lines.join('\n')}
                key={`t-${cue.uid}-${cue.lines.join('\n')}`}
                onBlur={e => onChange(cue.uid, { lines: e.target.value.split('\n') })}
                rows={Math.min(4, Math.max(1, cue.lines.length))}
                spellCheck={false}
                className="w-full px-3 py-2 rounded-lg bg-[#020610] border border-white/10 focus:border-blue-500/50 text-slate-200 text-xs leading-relaxed outline-none transition-colors resize-y"
              />

              {issues.length > 0 && (
                <ul className="space-y-0.5">
                  {issues.map((issue, i) => (
                    <li
                      key={i}
                      className={`flex items-center gap-1.5 text-[10px] font-medium ${
                        issue.severity === 'error' ? 'text-red-300' : 'text-amber-200/85'
                      }`}
                    >
                      {issue.severity === 'error' ? (
                        <XCircle className="w-3 h-3 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                      )}
                      {formatIssue(issue, t)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const FALLBACK: Record<string, string> = {
  fastReading: 'Too fast to read: {cps} cps (limit {max}).',
  tooShort: 'On screen for only {ms} ms (minimum {min}).',
  tooLong: 'On screen for {ms} ms (maximum {max}).',
  lineTooLong: 'A line is {n} characters (maximum {max}).',
  tooManyLines: '{n} lines (maximum {max}).',
  overlap: 'Overlaps the next cue by {ms} ms.',
  shortGap: 'Only {ms} ms before the next cue (minimum {min}).',
  reversed: 'Ends before it starts.',
  empty: 'No text.',
  outOfOrder: 'The file is not in chronological order.',
};

export function formatIssue(issue: QcIssue, t: any): string {
  const template = (t && typeof t[`qc_${issue.code}`] === 'string' ? t[`qc_${issue.code}`] : FALLBACK[issue.code]) || issue.code;
  return template.replace(/\{(\w+)\}/g, (whole: string, key: string) =>
    key in issue.data ? String(issue.data[key]) : whole
  );
}

export default CueEditor;
