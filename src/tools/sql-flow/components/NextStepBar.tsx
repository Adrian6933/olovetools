import React, { useState } from 'react';
import { ArrowRight, Binary, FileArchive, GitCompare, Hash, Image, Loader2 } from 'lucide-react';
import { sendToTool } from '../../../lib/handoff';

interface NextStepBarProps {
  lang: string;
  t: any;
  /** Produce el .sql ya formateado. Se llama sólo al elegir un destino. */
  getResult: () => Promise<{ blob: Blob; name: string } | null>;
  disabled?: boolean;
}

// El resultado es un .sql de texto: lo natural es compararlo con otra versión,
// convertirlo en imagen para documentarlo, firmarlo, codificarlo o empaquetarlo.
const STEPS = [
  { slug: 'diffsnap', icon: <GitCompare className="w-4 h-4" />, key: 'nextDiff', fallback: 'Compare versions' },
  { slug: 'codecard', icon: <Image className="w-4 h-4" />, key: 'nextCodecard', fallback: 'Make a code image' },
  { slug: 'hash-bolt', icon: <Hash className="w-4 h-4" />, key: 'nextHash', fallback: 'Hash it' },
  { slug: 'base64-bolt', icon: <Binary className="w-4 h-4" />, key: 'nextBase64', fallback: 'Encode it' },
  { slug: 'zip-flow', icon: <FileArchive className="w-4 h-4" />, key: 'nextZip', fallback: 'Zip it' },
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
      await sendToTool(slug, lang, result.blob, result.name, 'sql-flow');
    } catch {
      setPending(null);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-900/25 bg-black/30 p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">
          {t.nextStepTitle || 'Keep going'}
        </span>
        <span className="h-px flex-1 min-w-8 bg-amber-900/20" />
        <span className="text-[10px] font-medium text-stone-600">
          {t.nextStepHint || 'The query travels with you — no download, no re-upload'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {STEPS.map(step => (
          <button
            key={step.slug}
            onClick={() => go(step.slug)}
            disabled={pending !== null || disabled}
            className="group flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-amber-900/30 bg-white/[0.03] hover:bg-amber-500/10 hover:border-amber-500/40 text-stone-300 hover:text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="text-amber-400">
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
