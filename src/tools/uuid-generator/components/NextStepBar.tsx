import React, { useState } from 'react';
import { ArrowRight, Braces, FileArchive, GitCompare, Hash, Loader2, Regex } from 'lucide-react';
import { sendToTool } from '../../../lib/handoff';
import type { ExportFormat } from '../lib/engine';

interface NextStepBarProps {
  lang: string;
  t: any;
  disabled: boolean;
  /** Serialises the current batch. Called lazily, only when a step is picked. */
  getResult: (format: ExportFormat) => Promise<{ blob: Blob; name: string } | null>;
}

interface Step {
  slug: string;
  icon: React.ReactNode;
  key: string;
  fallback: string;
  /** The shape the target tool actually understands. */
  format: ExportFormat;
}

// A generated list of identifiers is rarely the finish line: people diff it
// against a previous batch, hash it, feed it to a regex, or ship it as a file.
const STEPS: Step[] = [
  { slug: 'diffsnap', icon: <GitCompare className="w-4 h-4" />, key: 'nextDiff', fallback: 'Compare two batches', format: 'txt' },
  { slug: 'hash-bolt', icon: <Hash className="w-4 h-4" />, key: 'nextHash', fallback: 'Checksum the list', format: 'txt' },
  { slug: 'json-flow', icon: <Braces className="w-4 h-4" />, key: 'nextJson', fallback: 'Open as JSON', format: 'json' },
  { slug: 'regex-flow', icon: <Regex className="w-4 h-4" />, key: 'nextRegex', fallback: 'Test a pattern', format: 'txt' },
  { slug: 'zip-flow', icon: <FileArchive className="w-4 h-4" />, key: 'nextZip', fallback: 'Zip it', format: 'txt' },
];

export const NextStepBar: React.FC<NextStepBarProps> = ({ lang, t, disabled, getResult }) => {
  const [pending, setPending] = useState<string | null>(null);

  const go = async (step: Step) => {
    if (pending || disabled) return;
    setPending(step.slug);
    try {
      const result = await getResult(step.format);
      if (!result) {
        setPending(null);
        return;
      }
      await sendToTool(step.slug, lang, result.blob, result.name, 'uuid-generator');
    } catch {
      setPending(null);
    }
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-black/30 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          {t.nextStepTitle || 'Keep going'}
        </span>
        <span className="h-px flex-1 min-w-[2rem] bg-white/5" />
        <span className="text-[10px] font-medium text-slate-600">
          {t.nextStepHint || 'The list travels with you — no download, no re-upload'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {STEPS.map(step => (
          <button
            key={step.slug}
            onClick={() => go(step)}
            disabled={disabled || pending !== null}
            className="group flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-violet-500/10 hover:border-violet-500/30 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="text-violet-400">
              {pending === step.slug ? <Loader2 className="w-4 h-4 animate-spin" /> : step.icon}
            </span>
            {t[step.key] || step.fallback}
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default NextStepBar;
