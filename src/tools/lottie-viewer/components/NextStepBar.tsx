import React, { useState } from 'react';
import { ArrowRight, Braces, Crop, Image as ImageIcon, Loader2, Minimize2, Star } from 'lucide-react';
import { sendToTool } from '../../../lib/handoff';

interface NextStepBarProps {
  lang: string;
  t: any;
  /**
   * Produces the file for the chosen target. Called lazily — rasterising a
   * frame costs real time, so nothing is rendered until a step is picked.
   */
  getResult: (kind: 'png' | 'svg' | 'json') => Promise<{ blob: Blob; name: string } | null>;
}

interface Step {
  slug: string;
  kind: 'png' | 'svg' | 'json';
  icon: React.ReactNode;
  key: string;
  fallback: string;
}

// Two natural exits: the animation as a still frame (compress it, crop it, turn
// it into a favicon) and the animation as data (inspect the JSON, tidy the SVG).
const STEPS: Step[] = [
  { slug: 'svg-optimizer', kind: 'svg', icon: <Minimize2 className="w-4 h-4" />, key: 'nextSvgOptimize', fallback: 'Optimize the SVG' },
  { slug: 'json-flow', kind: 'json', icon: <Braces className="w-4 h-4" />, key: 'nextJson', fallback: 'Inspect the JSON' },
  { slug: 'compresssnap', kind: 'png', icon: <ImageIcon className="w-4 h-4" />, key: 'nextCompress', fallback: 'Compress the frame' },
  { slug: 'cropsnap', kind: 'png', icon: <Crop className="w-4 h-4" />, key: 'nextCrop', fallback: 'Crop the frame' },
  { slug: 'favicon-bolt', kind: 'png', icon: <Star className="w-4 h-4" />, key: 'nextFavicon', fallback: 'Make a favicon' },
];

export const NextStepBar: React.FC<NextStepBarProps> = ({ lang, t, getResult }) => {
  const [pending, setPending] = useState<string | null>(null);

  const go = async (step: Step) => {
    if (pending) return;
    setPending(step.slug);
    try {
      const result = await getResult(step.kind);
      if (!result) {
        setPending(null);
        return;
      }
      await sendToTool(step.slug, lang, result.blob, result.name, 'lottie-viewer');
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
        <span className="hidden sm:block text-[10px] font-medium text-slate-600">
          {t.nextStepHint || 'The result travels with you — no re-upload'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {STEPS.map(step => (
          <button
            key={step.slug}
            onClick={() => go(step)}
            disabled={pending !== null}
            className="group flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-indigo-500/10 hover:border-indigo-500/30 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-wait"
          >
            <span className="text-indigo-400">
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
