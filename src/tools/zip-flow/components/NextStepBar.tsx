import React, { useState } from 'react';
import {
  ArrowRight,
  AudioLines,
  Crop,
  FileImage,
  FileJson,
  FileText,
  Film,
  Fingerprint,
  Loader2,
  Minimize2,
  Scissors,
} from 'lucide-react';
import { sendToTool } from '../../../lib/handoff';
import { extensionOf } from '../lib/presets';

interface Step {
  slug: string;
  icon: React.ReactNode;
  key: string;
  fallback: string;
}

const IMAGE = new Set(['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'bmp', 'heic', 'heif', 'tif', 'tiff']);
const AUDIO = new Set(['mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'flac', 'opus']);
const VIDEO = new Set(['mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v']);
const TEXTY = new Set(['txt', 'log', 'rtf']);

const STEP: Record<string, Step> = {
  compress: { slug: 'compresssnap', icon: <Minimize2 className="w-4 h-4" />, key: 'nextCompress', fallback: 'Compress it' },
  crop: { slug: 'cropsnap', icon: <Crop className="w-4 h-4" />, key: 'nextCrop', fallback: 'Crop it' },
  cutout: { slug: 'backgroundremover', icon: <Scissors className="w-4 h-4" />, key: 'nextCutout', fallback: 'Remove its background' },
  format: { slug: 'formatflow', icon: <FileImage className="w-4 h-4" />, key: 'nextFormat', fallback: 'Change format' },
  pdf: { slug: 'pdf-flow', icon: <FileText className="w-4 h-4" />, key: 'nextPdf', fallback: 'Edit the PDF' },
  json: { slug: 'json-flow', icon: <FileJson className="w-4 h-4" />, key: 'nextJson', fallback: 'Inspect the JSON' },
  xml: { slug: 'xml-json', icon: <FileJson className="w-4 h-4" />, key: 'nextXml', fallback: 'Convert the XML' },
  markdown: { slug: 'markdown-live', icon: <FileText className="w-4 h-4" />, key: 'nextMarkdown', fallback: 'Preview the Markdown' },
  words: { slug: 'wordflow', icon: <FileText className="w-4 h-4" />, key: 'nextWords', fallback: 'Analyse the text' },
  audio: { slug: 'audiosnap', icon: <AudioLines className="w-4 h-4" />, key: 'nextAudio', fallback: 'Edit the audio' },
  video: { slug: 'gif-bolt', icon: <Film className="w-4 h-4" />, key: 'nextGif', fallback: 'Turn it into a GIF' },
  hash: { slug: 'hash-bolt', icon: <Fingerprint className="w-4 h-4" />, key: 'nextHash', fallback: 'Checksum it' },
};

/**
 * Picks the moves that make sense for this particular entry. A JPEG inside the
 * archive gets image tools; a package-lock.json gets the JSON explorer.
 */
export function stepsFor(path: string): Step[] {
  const ext = extensionOf(path);
  if (IMAGE.has(ext)) return [STEP.compress, STEP.cutout, STEP.crop, STEP.format, STEP.hash];
  if (AUDIO.has(ext)) return [STEP.audio, STEP.hash];
  if (VIDEO.has(ext)) return [STEP.video, STEP.hash];
  if (ext === 'pdf') return [STEP.pdf, STEP.hash];
  if (ext === 'json') return [STEP.json, STEP.hash];
  if (ext === 'xml' || ext === 'svg') return [STEP.xml, STEP.hash];
  if (ext === 'md' || ext === 'markdown') return [STEP.markdown, STEP.words, STEP.hash];
  if (TEXTY.has(ext)) return [STEP.words, STEP.hash];
  return [STEP.hash];
}

interface NextStepBarProps {
  lang: string;
  t: any;
  /** Path of the entry the bar is offering to forward. */
  path: string;
  /** Extracts the entry. Called lazily, only once a destination is picked. */
  getResult: () => Promise<{ blob: Blob; name: string } | null>;
}

export const NextStepBar: React.FC<NextStepBarProps> = ({ lang, t, path, getResult }) => {
  const [pending, setPending] = useState<string | null>(null);
  const steps = stepsFor(path);

  const go = async (slug: string) => {
    if (pending) return;
    setPending(slug);
    try {
      const result = await getResult();
      if (!result) {
        setPending(null);
        return;
      }
      await sendToTool(slug, lang, result.blob, result.name, 'zip-flow');
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
        <span className="hidden sm:inline text-[10px] font-medium text-slate-600">
          {t.nextStepHint || 'The file travels with you — no download, no re-upload'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {steps.map(step => (
          <button
            key={step.slug}
            onClick={() => go(step.slug)}
            disabled={pending !== null}
            className="group flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-amber-500/10 hover:border-amber-500/30 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-wait"
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
