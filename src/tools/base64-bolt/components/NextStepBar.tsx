import React, { useState } from 'react';
import { ArrowRight, Crop, FileCode2, FileJson, Fingerprint, GitCompare, Image as ImageIcon, Link2, Loader2 } from 'lucide-react';
import { sendToTool } from '../../../lib/handoff';

interface NextStepBarProps {
  lang: string;
  t: any;
  /** Produces the file to hand over. Called lazily, only on a click. */
  getResult: () => Promise<{ blob: Blob; name: string } | null>;
  disabled?: boolean;
  /** Image steps only make sense once the payload is known to be an image. */
  isImage?: boolean;
}

interface Step {
  slug: string;
  icon: React.ReactNode;
  key: string;
  fallback: string;
  /** Only offered for image payloads. */
  imageOnly?: boolean;
}

// What leaves this tool is either a decoded file or a text payload, so the next
// steps split accordingly: image tools when the bytes turned out to be an
// image, document/text tools otherwise.
const STEPS: Step[] = [
  { slug: 'compresssnap', icon: <ImageIcon className="w-4 h-4" />, key: 'nextCompress', fallback: 'Compress it', imageOnly: true },
  { slug: 'cropsnap', icon: <Crop className="w-4 h-4" />, key: 'nextCrop', fallback: 'Crop it', imageOnly: true },
  { slug: 'favicon-bolt', icon: <ImageIcon className="w-4 h-4" />, key: 'nextFavicon', fallback: 'Make a favicon', imageOnly: true },
  { slug: 'hash-bolt', icon: <Fingerprint className="w-4 h-4" />, key: 'nextHash', fallback: 'Hash it' },
  { slug: 'json-flow', icon: <FileJson className="w-4 h-4" />, key: 'nextJson', fallback: 'Open the JSON' },
  { slug: 'url-bolt', icon: <Link2 className="w-4 h-4" />, key: 'nextUrl', fallback: 'URL-encode it' },
  { slug: 'diffsnap', icon: <GitCompare className="w-4 h-4" />, key: 'nextDiff', fallback: 'Compare two versions' },
  { slug: 'codecard', icon: <FileCode2 className="w-4 h-4" />, key: 'nextCodecard', fallback: 'Turn it into an image' },
];

export const NextStepBar: React.FC<NextStepBarProps> = ({ lang, t, getResult, disabled, isImage }) => {
  const [pending, setPending] = useState<string | null>(null);

  const steps = STEPS.filter(step => (step.imageOnly ? isImage : true));

  const go = async (slug: string) => {
    if (pending || disabled) return;
    setPending(slug);
    try {
      const result = await getResult();
      if (!result) {
        setPending(null);
        return;
      }
      await sendToTool(slug, lang, result.blob, result.name, 'base64-bolt');
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
        <span className="hidden sm:inline text-[10px] font-medium text-slate-600 truncate">
          {t.nextStepHint || 'The result travels with you — no download, no re-upload'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {steps.map(step => (
          <button
            key={step.slug}
            onClick={() => go(step.slug)}
            disabled={disabled || pending !== null}
            className="group flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-blue-500/10 hover:border-blue-500/30 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
