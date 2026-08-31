import React, { useState } from 'react';
import { ArrowRight, Crop, FileImage, Loader2, Minimize2, Share2, Type } from 'lucide-react';
import { sendToTool } from '../../../lib/handoff';

interface NextStepBarProps {
  lang: string;
  t: any;
  /** Renders the finished meme. Called lazily, only when a step is picked. */
  getResult: () => Promise<{ blob: Blob; name: string } | null>;
}

// A finished meme is a flat picture, so the natural next moves are: shrink it
// for a chat, recrop it for a feed, change format, brand it, or resize it for a
// specific network.
const STEPS = [
  { slug: 'compresssnap', icon: <Minimize2 className="w-4 h-4" />, key: 'nextCompress', fallback: 'Compress it' },
  { slug: 'cropsnap', icon: <Crop className="w-4 h-4" />, key: 'nextCrop', fallback: 'Crop it' },
  { slug: 'formatflow', icon: <FileImage className="w-4 h-4" />, key: 'nextFormat', fallback: 'Change format' },
  { slug: 'watermark-snap', icon: <Type className="w-4 h-4" />, key: 'nextWatermark', fallback: 'Add a watermark' },
  { slug: 'socialbolt', icon: <Share2 className="w-4 h-4" />, key: 'nextSocial', fallback: 'Resize for social' },
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
      await sendToTool(slug, lang, result.blob, result.name, 'meme-bolt');
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
        <span className="text-[10px] font-medium text-slate-600 hidden sm:inline">
          {t.nextStepHint || 'Your meme travels with you — no re-upload'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {STEPS.map(step => (
          <button
            key={step.slug}
            onClick={() => go(step.slug)}
            disabled={pending !== null}
            className="group flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-fuchsia-500/10 hover:border-fuchsia-500/30 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-wait"
          >
            <span className="text-fuchsia-400">
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
