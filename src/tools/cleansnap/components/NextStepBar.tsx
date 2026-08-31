// ============================================================================
// Encadenado con el resto de la suite
// ----------------------------------------------------------------------------
// Mismo mecanismo que las demás herramientas: el resultado se aparca en
// IndexedDB (src/lib/handoff.ts) y la de destino lo recoge sola. CleanSnap no
// tenía nada de esto: para seguir trabajando había que descargar y volver a
// subir.
// ============================================================================

import React, { useState } from 'react';
import { ArrowRight, Crop, FileImage, Loader2, Minimize2, ShieldOff, Type } from 'lucide-react';
import { sendToTool } from '../../../lib/handoff';

interface NextStepBarProps {
  lang: string;
  t: any;
  /** Produce la imagen limpia. Se llama sólo al elegir un destino. */
  getResult: () => Promise<{ blob: Blob; name: string } | null>;
}

// Lo que se suele hacer con una imagen ya limpia: recortarla, marcarla,
// aligerarla, cambiarle el formato o quitarle los metadatos.
const STEPS = [
  { slug: 'cropsnap', icon: <Crop className="w-4 h-4" />, key: 'nextCrop', fallback: 'Crop it' },
  { slug: 'watermark-snap', icon: <Type className="w-4 h-4" />, key: 'nextWatermark', fallback: 'Add your watermark' },
  { slug: 'compresssnap', icon: <Minimize2 className="w-4 h-4" />, key: 'nextCompress', fallback: 'Compress it' },
  { slug: 'formatflow', icon: <FileImage className="w-4 h-4" />, key: 'nextFormat', fallback: 'Change format' },
  { slug: 'exif-clear', icon: <ShieldOff className="w-4 h-4" />, key: 'nextExif', fallback: 'Strip metadata' },
];

export const NextStepBar: React.FC<NextStepBarProps> = ({ lang, t, getResult }) => {
  const [pending, setPending] = useState<string | null>(null);

  const go = async (slug: string) => {
    if (pending) return;
    setPending(slug);
    try {
      const result = await getResult();
      if (!result) { setPending(null); return; }
      await sendToTool(slug, lang, result.blob, result.name, 'cleansnap');
    } catch {
      setPending(null);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{t.nextStepTitle}</span>
        <span className="h-px flex-1 min-w-6 bg-white/10" />
        <span className="text-[10px] font-medium text-slate-600">{t.nextStepHint}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {STEPS.map(step => (
          <button
            key={step.slug}
            type="button"
            onClick={() => go(step.slug)}
            disabled={pending !== null}
            className="group flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-violet-500/10 hover:border-violet-500/40 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-wait"
          >
            <span className="text-violet-400">
              {pending === step.slug ? <Loader2 className="w-4 h-4 animate-spin" /> : step.icon}
            </span>
            {t[step.key] || step.fallback}
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default NextStepBar;
