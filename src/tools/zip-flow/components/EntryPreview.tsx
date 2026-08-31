import React, { useEffect, useMemo, useState } from 'react';
import { Download, Loader2, X } from 'lucide-react';
import type { EntryMeta } from '../types';
import { extensionOf } from '../lib/presets';
import { formatBytes, formatDate } from '../lib/files';
import { NextStepBar } from './NextStepBar';

const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'bmp', 'ico', 'svg']);
const AUDIO_EXT = new Set(['mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'flac', 'opus']);
const VIDEO_EXT = new Set(['mp4', 'webm', 'mov', 'm4v']);

/** Above this the text pane shows the head of the file instead of all of it. */
const TEXT_LIMIT = 256 * 1024;

interface PreviewProps {
  entry: EntryMeta;
  blob: Blob | null;
  loading: boolean;
  error: string | null;
  lang: string;
  t: any;
  onClose: () => void;
  onDownload: () => void;
}

type Kind = 'image' | 'audio' | 'video' | 'text' | 'binary';

/** Extension first, then a cheap sniff: a NUL byte means it is not text. */
async function detectKind(entry: EntryMeta, blob: Blob): Promise<{ kind: Kind; text?: string }> {
  const ext = extensionOf(entry.path);
  if (IMAGE_EXT.has(ext)) return { kind: 'image' };
  if (AUDIO_EXT.has(ext)) return { kind: 'audio' };
  if (VIDEO_EXT.has(ext)) return { kind: 'video' };

  const head = new Uint8Array(await blob.slice(0, 4096).arrayBuffer());
  for (let i = 0; i < head.length; i++) if (head[i] === 0) return { kind: 'binary' };

  const text = await blob.slice(0, TEXT_LIMIT).text();
  // A run of replacement characters means we decoded binary as UTF-8.
  const bad = (text.match(/�/g) || []).length;
  if (bad > text.length * 0.02) return { kind: 'binary' };
  return { kind: 'text', text };
}

function hexDump(bytes: Uint8Array): string {
  const lines: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += 16) {
    const slice = bytes.subarray(offset, offset + 16);
    const hex = Array.from(slice, b => b.toString(16).padStart(2, '0')).join(' ').padEnd(47, ' ');
    const ascii = Array.from(slice, b => (b >= 32 && b < 127 ? String.fromCharCode(b) : '·')).join('');
    lines.push(`${offset.toString(16).padStart(8, '0')}  ${hex}  ${ascii}`);
  }
  return lines.join('\n');
}

export const EntryPreview: React.FC<PreviewProps> = ({
  entry,
  blob,
  loading,
  error,
  lang,
  t,
  onClose,
  onDownload,
}) => {
  const [kind, setKind] = useState<Kind>('binary');
  const [text, setText] = useState<string>('');
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setText('');
    if (!blob) return;

    detectKind(entry, blob).then(async result => {
      if (cancelled) return;
      setKind(result.kind);
      if (result.kind === 'text') setText(result.text || '');
      if (result.kind === 'binary') {
        const bytes = new Uint8Array(await blob.slice(0, 2048).arrayBuffer());
        if (!cancelled) setText(hexDump(bytes));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [blob, entry]);

  // One object URL per blob, revoked when it is replaced or the panel closes:
  // leaving these behind pins the whole decompressed entry in memory.
  useEffect(() => {
    if (!blob) return;
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => {
      URL.revokeObjectURL(next);
      setUrl(null);
    };
  }, [blob]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const ratio = entry.size ? Math.max(0, Math.round((1 - entry.packed / entry.size) * 100)) : 0;
  const name = useMemo(() => entry.path.split('/').pop() || entry.path, [entry.path]);
  const truncated = kind === 'text' && entry.size > TEXT_LIMIT;

  return (
    <div className="rounded-3xl border border-white/10 bg-black/40 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/5 bg-white/[0.02]">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white truncate">{name}</p>
          <p className="text-[11px] font-mono text-slate-500 truncate">{entry.path}</p>
        </div>
        <button
          onClick={onDownload}
          className="shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase text-amber-500 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/25 hover:text-white transition-all cursor-pointer outline-none flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t.extract_single_download || 'Download'}</span>
        </button>
        <button
          onClick={onClose}
          aria-label={t.previewClose || 'Close preview'}
          className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border-none outline-none"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5 text-center">
        {[
          { label: t.previewSize || 'Size', value: formatBytes(entry.size) },
          { label: t.previewPacked || 'Packed', value: formatBytes(entry.packed) },
          { label: t.previewRatio || 'Saved', value: `${ratio}%` },
          { label: t.previewDate || 'Modified', value: formatDate(entry.date, lang) },
        ].map(cell => (
          <div key={cell.label} className="bg-black/40 py-2.5 px-2">
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-600">{cell.label}</p>
            <p className="text-xs font-mono font-bold text-slate-200 truncate">{cell.value}</p>
          </div>
        ))}
      </div>

      <div className="p-4 min-h-[180px] max-h-[340px] overflow-auto flex items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center gap-2 text-slate-500 text-sm">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            <span>{t.previewLoading || 'Extracting this entry…'}</span>
          </div>
        ) : error ? (
          <p className="text-sm text-red-400 font-medium text-center">{error}</p>
        ) : kind === 'image' && url ? (
          <img src={url} alt={name} className="max-h-[300px] max-w-full object-contain rounded-xl" />
        ) : kind === 'audio' && url ? (
          <audio src={url} controls className="w-full" />
        ) : kind === 'video' && url ? (
          <video src={url} controls className="max-h-[300px] max-w-full rounded-xl" />
        ) : (
          <pre className="w-full text-left text-[11px] leading-relaxed font-mono text-slate-300 whitespace-pre-wrap break-all">
            {text}
            {truncated && (
              <span className="block mt-3 text-amber-500/70 not-italic">
                {t.previewTruncated || 'Preview truncated — download the file to see all of it.'}
              </span>
            )}
          </pre>
        )}
      </div>

      {blob && !loading && !error && (
        <div className="px-4 pb-4">
          <NextStepBar
            lang={lang}
            t={t}
            path={entry.path}
            getResult={async () => ({ blob, name })}
          />
        </div>
      )}
    </div>
  );
};

export default EntryPreview;
