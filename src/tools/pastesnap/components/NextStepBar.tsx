import React, { useState } from 'react';
import { ArrowRight, Crop, Eraser, Loader2, Minimize2, Sticker, Type } from 'lucide-react';
import { sendToTool } from '../../../lib/handoff';

interface NextStepBarProps {
  lang: string;
  t: any;
  /** Produce la imagen que viaja. Se llama en perezoso, solo al elegir destino. */
  getResult: () => Promise<{ blob: Blob; name: string } | null>;
  disabled?: boolean;
}

interface Step {
  slug: string;
  icon: React.ReactNode;
  key: string;
  fallback: string;
}

// Lo que uno hace normalmente después de guardar una captura del portapapeles.
const STEPS: Step[] = [
  { slug: 'compresssnap', icon: <Minimize2 className="w-4 h-4" />, key: 'nextCompress', fallback: 'Compress it' },
  { slug: 'cropsnap', icon: <Crop className="w-4 h-4" />, key: 'nextCrop', fallback: 'Crop it' },
  { slug: 'cleansnap', icon: <Eraser className="w-4 h-4" />, key: 'nextClean', fallback: 'Erase objects' },
  { slug: 'watermark-snap', icon: <Type className="w-4 h-4" />, key: 'nextWatermark', fallback: 'Add a watermark' },
  { slug: 'meme-bolt', icon: <Sticker className="w-4 h-4" />, key: 'nextMeme', fallback: 'Make a meme' },
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
      await sendToTool(slug, lang, result.blob, result.name, 'pastesnap');
    } catch {
      setPending(null);
    }
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-black/30 p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
          {t.nextStepTitle || 'Keep going'}
        </span>
        <span className="h-px flex-1 bg-white/5 min-w-[20px]" />
        <span className="text-[10px] font-medium text-gray-600">
          {t.nextStepHint || 'The image travels with you — no re-upload'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {STEPS.map(step => (
          <button
            key={step.slug}
            onClick={() => go(step.slug)}
            disabled={pending !== null || disabled}
            className="group flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-indigo-500/10 hover:border-indigo-500/30 text-gray-300 hover:text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
