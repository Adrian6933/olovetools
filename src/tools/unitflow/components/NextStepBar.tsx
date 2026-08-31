import React, { useState } from 'react';
import { ArrowRight, Braces, FileText, GitCompare, Loader2, ListOrdered, Loader, Table2 } from 'lucide-react';
import { sendToTool } from '../../../lib/handoff';
import type { ExportFormat } from '../lib/export';

interface NextStepBarProps {
  lang: string;
  t: any;
  disabled: boolean;
  /** Serializa el resultado. Se llama en perezoso, sólo al elegir un destino. */
  getResult: (format: ExportFormat) => Promise<{ blob: Blob; name: string } | null>;
}

interface Step {
  slug: string;
  icon: React.ReactNode;
  key: string;
  fallback: string;
  /** La forma que la herramienta de destino entiende de verdad. */
  format: ExportFormat;
}

// Una tabla de conversiones casi nunca es el final: se ordena y se deduplica, se
// mete en un JSON, se compara con la tirada anterior o acaba en una tabla de
// markdown dentro de un documento.
const STEPS: Step[] = [
  { slug: 'list-mixer', icon: <ListOrdered className="w-4 h-4" />, key: 'nextList', fallback: 'Sort and clean the list', format: 'csv' },
  { slug: 'json-flow', icon: <Braces className="w-4 h-4" />, key: 'nextJson', fallback: 'Open as JSON', format: 'json' },
  { slug: 'markdown-live', icon: <Table2 className="w-4 h-4" />, key: 'nextMarkdown', fallback: 'Preview the Markdown table', format: 'md' },
  { slug: 'diffsnap', icon: <GitCompare className="w-4 h-4" />, key: 'nextDiff', fallback: 'Compare two runs', format: 'txt' },
  { slug: 'wordflow', icon: <FileText className="w-4 h-4" />, key: 'nextText', fallback: 'Analyse it as text', format: 'txt' },
];

export const NextStepBar: React.FC<NextStepBarProps> = ({ lang, t, disabled, getResult }) => {
  const [pending, setPending] = useState<string | null>(null);

  const go = async (step: Step) => {
    if (pending || disabled) return;
    setPending(step.slug);
    try {
      const result = await getResult(step.format);
      if (!result) {
        setPending(null);
        return;
      }
      await sendToTool(step.slug, lang, result.blob, result.name, 'unitflow');
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
          {t.nextStepHint || 'The table travels with you — no download, no re-upload'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {STEPS.map((step) => (
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
