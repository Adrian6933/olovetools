import React, { useState } from 'react';
import { ArrowRight, FileCode2, FileJson, Fingerprint, GitCompare, Loader2, PenLine } from 'lucide-react';
import { sendToTool } from '../../../lib/handoff';

// ============================================================================
// Handing the result to the next tool.
// ----------------------------------------------------------------------------
// Same mechanism as the rest of the suite (src/lib/handoff.ts): the file is
// parked in IndexedDB and the target opens with ?handoff=1. What leaves here
// is text — the substituted output, or the matches as JSON/CSV — so the next
// steps are the tools that take a document.
// ============================================================================

interface NextStepBarProps {
  lang: string;
  t: (key: string) => string;
  /** Produces the file to hand over. Called lazily, only on a click. */
  getResult: () => Promise<{ blob: Blob; name: string } | null>;
  disabled?: boolean;
}

const STEPS = [
  { slug: 'wordflow', icon: <PenLine className="w-4 h-4" />, key: 'nextWordflow' },
  { slug: 'diffsnap', icon: <GitCompare className="w-4 h-4" />, key: 'nextDiff' },
  { slug: 'json-flow', icon: <FileJson className="w-4 h-4" />, key: 'nextJson' },
  { slug: 'codecard', icon: <FileCode2 className="w-4 h-4" />, key: 'nextCodecard' },
  { slug: 'hash-bolt', icon: <Fingerprint className="w-4 h-4" />, key: 'nextHash' },
];

export const NextStepBar: React.FC<NextStepBarProps> = ({ lang, t, getResult, disabled }) => {
  const [pending, setPending] = useState<string | null>(null);

  const go = async (slug: string) => {
    if (pending || disabled) return;
    setPending(slug);
    try {
      const result = await getResult();
      if (!result) {
        setPending(null);
        return;
      }
      await sendToTool(slug, lang, result.blob, result.name, 'regex-flow');
    } catch {
      setPending(null);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-white/5 bg-black/30 p-4">
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          {t('nextStepTitle')}
        </span>
        <span className="h-px flex-1 bg-white/5" />
        <span className="hidden truncate text-[10px] font-medium text-slate-600 sm:inline">{t('nextStepHint')}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {STEPS.map(step => (
          <button
            key={step.slug}
            type="button"
            onClick={() => void go(step.slug)}
            disabled={pending !== null || disabled}
            className="group flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-bold text-slate-300 transition-all hover:border-fuchsia-500/30 hover:bg-fuchsia-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="text-fuchsia-400">
              {pending === step.slug ? <Loader2 className="w-4 h-4 animate-spin" /> : step.icon}
            </span>
            {t(step.key)}
            <ArrowRight className="w-3 h-3 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default NextStepBar;
