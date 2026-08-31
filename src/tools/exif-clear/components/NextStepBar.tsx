import React, { useState } from 'react';
import { ArrowRight, Crop, FileImage, Loader2, Minimize2, Scissors, Type } from 'lucide-react';
import { sendToTool } from '../../../lib/handoff';

interface NextStepBarProps {
  lang: string;
  t: any;
  /** Produces the cleaned file. Called lazily, only when a step is picked. */
  getResult: () => Promise<{ blob: Blob; name: string } | null>;
}

interface Step {
  slug: string;
  icon: React.ReactNode;
  key: string;
  fallback: string;
}

// A stripped photo is usually on its way somewhere public, so the natural next
// moves are the ones you do before publishing.
const STEPS: Step[] = [
  { slug: 'compresssnap', icon: <Minimize2 className="w-4 h-4" />, key: 'nextCompress', fallback: 'Compress it' },
  { slug: 'cropsnap', icon: <Crop className="w-4 h-4" />, key: 'nextCrop', fallback: 'Crop it' },
  { slug: 'watermark-snap', icon: <Type className="w-4 h-4" />, key: 'nextWatermark', fallback: 'Add a watermark' },
  { slug: 'formatflow', icon: <FileImage className="w-4 h-4" />, key: 'nextFormat', fallback: 'Change format' },
  { slug: 'backgroundremover', icon: <Scissors className="w-4 h-4" />, key: 'nextCutout', fallback: 'Cut the background' },
];

export const NextStepBar: React.FC<NextStepBarProps> = ({ lang, t, getResult }) => {
  const [pending, setPending] = useState<string | null>(null);

  const go = async (slug: string) => {
    if (pending) return;
    setPending(slug);
    try {
      const result = await getResult();
      if (!result) {
        setPending(null);
        return;
      }
      await sendToTool(slug, lang, result.blob, result.name, 'exif-clear');
    } catch {
      setPending(null);
    }
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-black/30 p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          {t.nextStepTitle || 'Keep going'}
        </span>
        <span className="h-px flex-1 min-w-4 bg-white/5" />
        <span className="text-[10px] font-medium text-slate-600">
          {t.nextStepHint || 'The cleaned file travels with you — no re-upload'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {STEPS.map(step => (
          <button
            key={step.slug}
            onClick={() => go(step.slug)}
            disabled={pending !== null}
            className="group flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-wait"
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
