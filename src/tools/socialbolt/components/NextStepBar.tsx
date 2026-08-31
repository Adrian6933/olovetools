import React, { useState } from 'react';
import { ArrowRight, Crop, Film, Image as ImageIcon, Loader2, Minimize2, Scissors, Sticker, Type } from 'lucide-react';
import { sendToTool } from '../../../lib/handoff';
import type { AssetKind } from '../types';

interface NextStepBarProps {
  lang: string;
  t: any;
  /** Tipo del asset activo: decide qué herramientas tienen sentido. */
  kind: AssetKind;
  /** Descarga el asset (perezosa: solo al elegir destino). */
  getResult: () => Promise<{ blob: Blob; name: string } | null>;
}

interface Step {
  slug: string;
  icon: React.ReactNode;
  key: string;
  fallback: string;
}

// Un vídeo descargado se corta, se convierte en GIF o se saca en fotogramas.
const VIDEO_STEPS: Step[] = [
  { slug: 'framesnap', icon: <Film className="w-4 h-4" />, key: 'nextFrames', fallback: 'Extract frames' },
  { slug: 'gif-bolt', icon: <Scissors className="w-4 h-4" />, key: 'nextGif', fallback: 'Turn it into a GIF' },
];

// Una imagen se recorta, se comprime, se marca o se convierte en meme.
const IMAGE_STEPS: Step[] = [
  { slug: 'cropsnap', icon: <Crop className="w-4 h-4" />, key: 'nextCrop', fallback: 'Crop it' },
  { slug: 'compresssnap', icon: <Minimize2 className="w-4 h-4" />, key: 'nextCompress', fallback: 'Compress it' },
  { slug: 'backgroundremover', icon: <ImageIcon className="w-4 h-4" />, key: 'nextCutout', fallback: 'Remove the background' },
  { slug: 'watermark-snap', icon: <Type className="w-4 h-4" />, key: 'nextWatermark', fallback: 'Add a watermark' },
  { slug: 'meme-bolt', icon: <Sticker className="w-4 h-4" />, key: 'nextMeme', fallback: 'Make a meme' },
];

export const NextStepBar: React.FC<NextStepBarProps> = ({ lang, t, kind, getResult }) => {
  const [pending, setPending] = useState<string | null>(null);

  const steps = kind === 'image' ? IMAGE_STEPS : kind === 'video' ? VIDEO_STEPS : [];
  if (!steps.length) return null;

  const go = async (slug: string) => {
    if (pending) return;
    setPending(slug);
    try {
      const result = await getResult();
      if (!result) {
        setPending(null);
        return;
      }
      await sendToTool(slug, lang, result.blob, result.name, 'socialbolt');
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
        <span className="hidden sm:block h-px flex-1 bg-white/5" />
        <span className="text-[10px] font-medium text-slate-600">
          {t.nextStepHint || 'The file travels with you — no re-upload'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {steps.map(step => (
          <button
            key={step.slug}
            onClick={() => go(step.slug)}
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
