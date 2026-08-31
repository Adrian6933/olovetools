import React, { useState } from 'react';
import { ArrowRight, Braces, FileCode2, Fingerprint, GitCompareArrows, Loader2, Repeat } from 'lucide-react';
import { sendToTool } from '../../../lib/handoff';

interface NextStepBarProps {
  lang: string;
  t: any;
  /** Produces the current document as a file. Called lazily, only on a click. */
  getResult: () => Promise<{ blob: Blob; name: string } | null>;
  disabled?: boolean;
}

interface Step {
  slug: string;
  icon: React.ReactNode;
  key: string;
  fallback: string;
}

// What leaves this tool is a text file, so the next steps are the text tools:
// compare two payloads, screenshot a snippet, hash it, or keep converting.
const STEPS: Step[] = [
  { slug: 'diffsnap', icon: <GitCompareArrows className="w-4 h-4" />, key: 'nextDiff', fallback: 'Compare it' },
  { slug: 'codecard', icon: <FileCode2 className="w-4 h-4" />, key: 'nextCodecard', fallback: 'Make a code image' },
  { slug: 'xml-json', icon: <Repeat className="w-4 h-4" />, key: 'nextXml', fallback: 'XML ⇄ JSON' },
  { slug: 'hash-bolt', icon: <Fingerprint className="w-4 h-4" />, key: 'nextHash', fallback: 'Hash it' },
  { slug: 'markdown-live', icon: <Braces className="w-4 h-4" />, key: 'nextMarkdown', fallback: 'Write it up' },
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
      await sendToTool(slug, lang, result.blob, result.name, 'json-flow');
    } catch {
      setPending(null);
    }
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-black/30 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          {t.nextStepTitle || 'Keep going'}
        </span>
        <span className="h-px flex-1 bg-white/5" />
        <span className="hidden sm:inline text-[10px] font-medium text-slate-600">
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
            className="group flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="text-emerald-400">
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
