import React, { useState } from 'react';
import { Archive, ArrowRight, AudioLines, Crop, Eraser, FileImage, Film, Loader2, Minimize2, Scissors } from 'lucide-react';
import { sendToTool } from '../../../lib/handoff';

interface Step {
  slug: string;
  icon: React.ReactNode;
  key: string;
  fallback: string;
}

interface NextStepBarProps {
  lang: string;
  t: any;
  file: File;
}

/**
 * A file that has just been checksummed is usually on its way somewhere else.
 * The steps offered depend on what the file actually is — proposing "crop it"
 * for an ISO would be noise.
 */
function stepsFor(file: File): Step[] {
  const type = file.type || '';
  const name = file.name.toLowerCase();

  const zip: Step = { slug: 'zip-flow', icon: <Archive className="w-4 h-4" />, key: 'nextZip', fallback: 'Zip it' };

  if (type.startsWith('image/')) {
    return [
      { slug: 'compresssnap', icon: <Minimize2 className="w-4 h-4" />, key: 'nextCompress', fallback: 'Compress it' },
      { slug: 'formatflow', icon: <FileImage className="w-4 h-4" />, key: 'nextFormat', fallback: 'Change format' },
      { slug: 'exif-clear', icon: <Eraser className="w-4 h-4" />, key: 'nextExif', fallback: 'Strip metadata' },
      { slug: 'cropsnap', icon: <Crop className="w-4 h-4" />, key: 'nextCrop', fallback: 'Crop it' },
      zip,
    ];
  }
  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    return [
      { slug: 'pdf-flow', icon: <Scissors className="w-4 h-4" />, key: 'nextPdf', fallback: 'Split or merge it' },
      zip,
    ];
  }
  if (type.startsWith('video/')) {
    return [
      { slug: 'framesnap', icon: <Film className="w-4 h-4" />, key: 'nextFrames', fallback: 'Grab a frame' },
      zip,
    ];
  }
  if (type.startsWith('audio/')) {
    return [
      { slug: 'audiosnap', icon: <AudioLines className="w-4 h-4" />, key: 'nextAudio', fallback: 'Trim or convert it' },
      zip,
    ];
  }
  return [zip];
}

export const NextStepBar: React.FC<NextStepBarProps> = ({ lang, t, file }) => {
  const [pending, setPending] = useState<string | null>(null);
  const steps = stepsFor(file);

  const go = async (slug: string) => {
    if (pending) return;
    setPending(slug);
    try {
      await sendToTool(slug, lang, file, file.name, 'hash-bolt');
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
        <span className="hidden sm:block text-[10px] font-medium text-slate-600">
          {t.nextStepHint || 'The same file travels with you — no re-upload'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {steps.map(step => (
          <button
            key={step.slug}
            onClick={() => go(step.slug)}
            disabled={pending !== null}
            className="group flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-sky-500/10 hover:border-sky-500/30 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-wait"
          >
            <span className="text-sky-400">
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
