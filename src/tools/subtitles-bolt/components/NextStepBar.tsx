import React, { useState } from 'react';
import { ArrowRight, FileArchive, GitCompare, Loader2, Mic, Wand2 } from 'lucide-react';
import { sendToTool } from '../../../lib/handoff';

// ============================================================================
// Cross-tool handoff, outbound.
// Same mechanism as every other tool in the suite: park the blob in IndexedDB
// and navigate. The file is serialised lazily, only once a step is picked.
// ============================================================================

interface NextStepBarProps {
  lang: string;
  t: any;
  disabled: boolean;
  getResult: () => { blob: Blob; name: string };
}

interface Step {
  slug: string;
  icon: React.ReactNode;
  key: string;
  fallback: string;
}

// A finished subtitle file is rarely the end: people diff it against the
// translator's version, read it aloud, tidy the markup, or ship it zipped
// alongside the video.
const STEPS: Step[] = [
  { slug: 'diffsnap', icon: <GitCompare className="w-4 h-4" />, key: 'nextDiff', fallback: 'Compare two versions' },
  { slug: 'tts-bolt', icon: <Mic className="w-4 h-4" />, key: 'nextTts', fallback: 'Read it aloud' },
  { slug: 'formatflow', icon: <Wand2 className="w-4 h-4" />, key: 'nextFormat', fallback: 'Pretty-print it' },
  { slug: 'zip-flow', icon: <FileArchive className="w-4 h-4" />, key: 'nextZip', fallback: 'Zip it' },
];

export const NextStepBar: React.FC<NextStepBarProps> = ({ lang, t, disabled, getResult }) => {
  const [pending, setPending] = useState<string>(null);

  const go = async (step: Step) => {
    if (pending || disabled) return;
    setPending(step.slug);
    try {
      const result = getResult();
      if (!result) {
        setPending(null);
        return;
      }
      await sendToTool(step.slug, lang, result.blob, result.name, 'subtitles-bolt');
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
          {t.nextStepHint || 'The file travels with you — no download, no re-upload'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {STEPS.map(step => (
          <button
            key={step.slug}
            onClick={() => go(step)}
            disabled={disabled || pending !== null}
            className="group flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-blue-500/10 hover:border-blue-500/30 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed outline-none"
          >
            <span className="text-blue-400">
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
