import React, { useState } from 'react';
import { ArrowRight, Binary, Braces, FileCode2, Fingerprint, GitCompareArrows, Loader2 } from 'lucide-react';
import { sendToTool } from '../../../lib/handoff';

// ============================================================================
// Hand the result to the next tool without a download / re-upload round trip.
// Same mechanism as everywhere else in the suite: the blob is parked in
// IndexedDB and the target page picks it up via useHandoffIntake.
// ============================================================================

interface NextStepBarProps {
  lang: string;
  t: any;
  /** Produces the current result as a file. Called lazily, only on a click. */
  getResult: () => Promise<{ blob: Blob; name: string } | null>;
  disabled?: boolean;
}

interface Step {
  slug: string;
  icon: React.ReactNode;
  key: string;
  fallback: string;
}

const STEPS: Step[] = [
  { slug: 'json-flow', icon: <Braces className="h-4 w-4" />, key: 'nextJsonFlow', fallback: 'Explore the claims' },
  { slug: 'base64-bolt', icon: <Binary className="h-4 w-4" />, key: 'nextBase64', fallback: 'Decode by hand' },
  { slug: 'diffsnap', icon: <GitCompareArrows className="h-4 w-4" />, key: 'nextDiff', fallback: 'Compare two tokens' },
  { slug: 'hash-bolt', icon: <Fingerprint className="h-4 w-4" />, key: 'nextHash', fallback: 'Hash it' },
  { slug: 'codecard', icon: <FileCode2 className="h-4 w-4" />, key: 'nextCodecard', fallback: 'Make a code image' },
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
      await sendToTool(slug, lang, result.blob, result.name, 'jwt-bolt');
    } catch {
      setPending(null);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-white/5 bg-black/30 p-4">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          {t.nextStepTitle || 'Keep going'}
        </span>
        <span className="h-px flex-1 bg-white/5" />
        <span className="hidden text-[10px] font-medium text-slate-600 sm:inline">
          {t.nextStepHint || 'The document travels with you — no download, no re-upload'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {STEPS.map(step => (
          <button
            key={step.slug}
            type="button"
            onClick={() => go(step.slug)}
            disabled={pending !== null || disabled}
            className="group flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-bold text-slate-300 outline-none transition-all hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="text-violet-400">
              {pending === step.slug ? <Loader2 className="h-4 w-4 animate-spin" /> : step.icon}
            </span>
            {t[step.key] || step.fallback}
            <ArrowRight className="h-3 w-3 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default NextStepBar;
