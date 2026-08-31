// ============================================================================
// Encadenado con el resto de la suite
// ----------------------------------------------------------------------------
// Mismo patrón que el de Background Remover: el resultado se aparca en
// IndexedDB (src/lib/handoff.ts) y la herramienta de destino lo recoge sola.
// Esto sustituye al `localStorage['pastesnap_transfer']` que FormatFlow se
// había montado por su cuenta, que guardaba base64 y sólo hablaba con una
// herramienta.
// ============================================================================

import React, { useState } from 'react';
import { ArrowRight, Crop, Eraser, Loader2, Minimize2, ShieldOff, Type } from 'lucide-react';
import { sendToTool } from '../../../lib/handoff';

interface NextStepBarProps {
  lang: string;
  t: any;
  /** Produce el archivo convertido. Se llama sólo al elegir un destino. */
  getResult: () => Promise<{ blob: Blob; name: string } | null>;
}

// Lo que la gente hace después de convertir: apretarlo más, recortarlo,
// limpiarle los metadatos, marcarlo o quitarle el fondo.
const STEPS = [
  { slug: 'compresssnap', icon: <Minimize2 className="w-4 h-4" />, key: 'nextCompress', fallback: 'Compress it' },
  { slug: 'cropsnap', icon: <Crop className="w-4 h-4" />, key: 'nextCrop', fallback: 'Crop it' },
  { slug: 'exif-clear', icon: <ShieldOff className="w-4 h-4" />, key: 'nextExif', fallback: 'Strip metadata' },
  { slug: 'watermark-snap', icon: <Type className="w-4 h-4" />, key: 'nextWatermark', fallback: 'Add a watermark' },
  { slug: 'backgroundremover', icon: <Eraser className="w-4 h-4" />, key: 'nextCutout', fallback: 'Remove background' },
];

export const NextStepBar: React.FC<NextStepBarProps> = ({ lang, t, getResult }) => {
  const [pending, setPending] = useState<string | null>(null);

  const go = async (slug: string) => {
    if (pending) return;
    setPending(slug);
    try {
      const result = await getResult();
      if (!result) { setPending(null); return; }
      await sendToTool(slug, lang, result.blob, result.name, 'formatflow');
    } catch {
      setPending(null);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          {t.nextStepTitle}
        </span>
        <span className="h-px flex-1 min-w-6 bg-slate-800" />
        <span className="text-[10px] font-medium text-slate-600">{t.nextStepHint}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {STEPS.map(step => (
          <button
            key={step.slug}
            type="button"
            onClick={() => go(step.slug)}
            disabled={pending !== null}
            className="group flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-indigo-500/10 hover:border-indigo-500/40 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-wait"
          >
            <span className="text-indigo-400">
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
