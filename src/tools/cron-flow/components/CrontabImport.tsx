import React, { useRef, useState } from 'react';
import { AlertTriangle, FileText, Play, Upload, X } from 'lucide-react';
import { parseCrontab } from '../lib/crontab';
import type { CrontabDoc, CrontabLine } from '../lib/crontab';
import { describe, describeError } from '../lib/describe';

// ============================================================================
// Crontab import
// ----------------------------------------------------------------------------
// Inheriting a server means inheriting a crontab nobody has read in years.
// Paste it here and every line gets explained.
//
// Loading a file never analyses it. The text lands in the box, the button
// lights up, and the user decides — same rule as everywhere else in the suite.
// ============================================================================

interface CrontabImportProps {
  t: any;
  /** Set when another tool handed a file over; still needs the button. */
  pendingFrom: string;
  onPickExpression: (expression: string) => void;
  /** The parent owns the text so a handoff can fill it. */
  text: string;
  onTextChange: (value: string) => void;
  /** Applies the CRON_TZ the file declares, when it declares one. */
  onTimezone: (tz: string) => void;
}

const MAX_BYTES = 512 * 1024;

export const CrontabImport: React.FC<CrontabImportProps> = ({
  t,
  pendingFrom,
  onPickExpression,
  text,
  onTextChange,
  onTimezone,
}) => {
  const [doc, setDoc] = useState<CrontabDoc>(null);
  const [tooBig, setTooBig] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const analyse = () => {
    const parsed = parseCrontab(text);
    setDoc(parsed);
    if (parsed.timezone) onTimezone(parsed.timezone);
  };

  const readFile = (file: File) => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setTooBig(true);
      return;
    }
    setTooBig(false);
    file.text().then(value => {
      onTextChange(value);
      setDoc(null);
    });
  };

  const rowFor = (line: CrontabLine) => {
    const failed = !!line.error;
    return (
      <li
        key={line.number}
        className={`rounded-xl border p-3 space-y-1.5 ${
          failed ? 'border-red-500/25 bg-red-500/[0.05]' : 'border-white/5 bg-[#12081e]'
        }`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono text-slate-600 shrink-0">{line.number}</span>
          <button
            onClick={() => onPickExpression(line.expression)}
            className="px-2 py-1 rounded-lg bg-violet-600/15 border border-violet-600/30 text-violet-200 font-mono text-[11px] hover:bg-violet-600/25 transition-all cursor-pointer outline-none"
          >
            {line.expression}
          </button>
          {line.user && (
            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400">
              {line.user}
            </span>
          )}
          <code className="text-[11px] text-slate-500 font-mono truncate min-w-0 flex-1">{line.command}</code>
        </div>
        <p className={`text-[11px] leading-relaxed ${failed ? 'text-red-300' : 'text-slate-400'}`}>
          {failed ? describeError(line.error, t) : describe(line.cron, t)}
        </p>
      </li>
    );
  };

  return (
    <div className="space-y-4">
      {pendingFrom && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/25 text-violet-200 text-[11px] leading-relaxed">
          <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            {(
              t.import_handoff ||
              'A file arrived from {from}. Nothing has been read yet — press Analyse when you are ready.'
            ).replace('{from}', pendingFrom)}
          </span>
        </div>
      )}

      <textarea
        value={text}
        onChange={e => {
          onTextChange(e.target.value);
          setDoc(null);
        }}
        spellCheck={false}
        rows={7}
        placeholder={t.import_placeholder || '# paste a crontab here'}
        className="w-full px-4 py-3 rounded-2xl bg-[#12081e] border border-white/10 focus:border-violet-500/50 text-violet-100 font-mono text-xs leading-relaxed outline-none transition-colors resize-y"
      />

      {tooBig && (
        <div className="flex items-center gap-2 text-[11px] text-amber-300">
          <AlertTriangle className="w-3.5 h-3.5" />
          {t.import_tooBig || 'That file is larger than 512 KB — a crontab is never that big.'}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={analyse}
          disabled={text.trim() === ''}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 border border-violet-500 text-white text-xs font-black hover:bg-violet-500 transition-all cursor-pointer outline-none disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Play className="w-4 h-4" />
          {t.import_analyse || 'Analyse the file'}
        </button>
        <button
          onClick={() => fileInput.current && fileInput.current.click()}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/10 transition-all cursor-pointer outline-none"
        >
          <Upload className="w-4 h-4" />
          {t.import_openFile || 'Open a file'}
        </button>
        {doc && (
          <button
            onClick={() => {
              setDoc(null);
              onTextChange('');
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs font-bold hover:bg-white/10 transition-all cursor-pointer outline-none"
          >
            <X className="w-4 h-4" />
            {t.import_clear || 'Clear'}
          </button>
        )}
        <input
          ref={fileInput}
          type="file"
          accept=".crontab,.cron,.txt,.tab,text/plain"
          className="hidden"
          onChange={e => {
            readFile(e.target.files && e.target.files[0]);
            e.target.value = '';
          }}
        />
      </div>

      {doc && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 font-bold">
              {(t.import_jobCount || '{n} jobs').replace('{n}', String(doc.jobs.length))}
            </span>
            {doc.timezone && (
              <span className="px-2.5 py-1 rounded-lg bg-violet-600/15 border border-violet-600/30 text-violet-300 font-bold font-mono">
                {doc.timezone}
              </span>
            )}
            {doc.jobs.some(j => j.error) && (
              <span className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/25 text-red-300 font-bold">
                {(t.import_brokenCount || '{n} broken').replace(
                  '{n}',
                  String(doc.jobs.filter(j => j.error).length)
                )}
              </span>
            )}
          </div>
          {doc.jobs.length > 0 && <ul className="space-y-2">{doc.jobs.map(rowFor)}</ul>}
        </div>
      )}
    </div>
  );
};

export default CrontabImport;
