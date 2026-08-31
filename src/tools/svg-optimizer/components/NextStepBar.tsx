import React, { useState } from 'react';
import { ArrowRight, FileImage, Loader2, Package, QrCode, Star } from 'lucide-react';
import { sendToTool } from '../../../lib/handoff';

// ============================================================================
// Where an optimized SVG usually goes next.
// ----------------------------------------------------------------------------
// Same mechanism as the rest of the suite: the file is parked in IndexedDB and
// the target tool picks it up, so nothing is downloaded and re-uploaded. Every
// destination here was checked to actually accept `image/svg+xml`.
// ============================================================================

interface NextStepBarProps {
  lang: string;
  t: any;
  /** Produces the optimized file. Called lazily, only when a step is picked. */
  getResult: () => Promise<{ blob: Blob; name: string } | null>;
}

const STEPS = [
  { slug: 'favicon-bolt', icon: <Star className="w-4 h-4" />, key: 'nextFavicon', fallback: 'Make a favicon' },
  { slug: 'formatflow', icon: <FileImage className="w-4 h-4" />, key: 'nextFormat', fallback: 'Convert to PNG' },
  { slug: 'qr-bolt', icon: <QrCode className="w-4 h-4" />, key: 'nextQr', fallback: 'Use as a QR logo' },
  { slug: 'zip-flow', icon: <Package className="w-4 h-4" />, key: 'nextZip', fallback: 'Zip it up' },
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
      await sendToTool(slug, lang, result.blob, result.name, 'svg-optimizer');
    } catch {
      setPending(null);
    }
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-black/30 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 shrink-0">
          {t.nextStepTitle || 'Keep going'}
        </span>
        <span className="h-px flex-1 bg-white/5" />
        <span className="hidden sm:block text-[10px] font-medium text-slate-600 shrink-0">
          {t.nextStepHint || 'Your file travels with you — no re-upload'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {STEPS.map(step => (
          <button
            key={step.slug}
            type="button"
            onClick={() => go(step.slug)}
            disabled={pending !== null}
            className="group flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/30 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-wait"
          >
            <span className="text-cyan-400">
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
