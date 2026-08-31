import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy, Download, FileCode2, Loader2 } from 'lucide-react';
import type { Rgb } from '../lib/color';
import { serializePalette, type ExportFormat } from '../lib/export';

interface ExportPanelProps {
  t: any;
  colors: Rgb[];
  onCopy: (text: string) => Promise<boolean>;
}

const FORMATS: Array<{ id: ExportFormat; label: string }> = [
  { id: 'css', label: 'CSS' },
  { id: 'tailwind', label: 'Tailwind' },
  { id: 'scss', label: 'SCSS' },
  { id: 'json', label: 'JSON' },
  { id: 'svg', label: 'SVG' },
  { id: 'gpl', label: 'GIMP' },
  { id: 'txt', label: 'TXT' },
  { id: 'png', label: 'PNG' },
];

export const ExportPanel: React.FC<ExportPanelProps> = ({ t, colors, onCopy }) => {
  const [format, setFormat] = useState<ExportFormat>('css');
  const [text, setText] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // La vista previa se regenera al cambiar de formato o de paleta. PNG no tiene
  // vista previa de texto: se descarga o se manda a otra herramienta.
  useEffect(() => {
    if (format === 'png') {
      setText('');
      return;
    }
    let cancelled = false;
    serializePalette(colors, format).then((result) => {
      if (!cancelled) setText(result?.text ?? '');
    });
    return () => {
      cancelled = true;
    };
  }, [colors, format]);

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const download = async () => {
    setBusy(true);
    try {
      const result = await serializePalette(colors, format);
      if (!result) return;
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.name;
      link.click();
      // Revocar en el mismo tick cancela la descarga en Firefox; un margen
      // corto basta y no deja el Blob vivo en memoria.
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!text) return;
    const ok = await onCopy(text);
    if (!ok) return;
    setCopied(true);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card rounded-3xl p-5 md:p-7 space-y-5 border border-white/5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-teal-400">
          <FileCode2 className="w-4 h-4" />
          {t.export_title || 'Export the palette'}
        </span>
        <span className="h-px flex-1 min-w-[2rem] bg-white/5" />
        <span className="text-[11px] text-slate-500">
          {(t.export_count || '{n} colours').replace('{n}', String(colors.length))}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FORMATS.map((entry) => (
          <button
            key={entry.id}
            onClick={() => setFormat(entry.id)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer outline-none ${
              format === entry.id
                ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:border-white/15'
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {format === 'png' ? (
        <div className="rounded-2xl bg-black/40 border border-white/5 p-6 text-center text-xs text-slate-500">
          {t.export_png_hint ||
            'A swatch sheet with the hex code printed on every colour. Download it or send it straight to another tool.'}
        </div>
      ) : (
        <pre className="rounded-2xl bg-black/40 border border-white/5 p-4 overflow-auto max-h-64 font-mono text-[11px] leading-relaxed text-slate-300 whitespace-pre">
          {text}
        </pre>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={copy}
          disabled={!text}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-colors cursor-pointer outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
            copied
              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
              : 'bg-white/5 border border-white/10 hover:bg-teal-500/20 hover:border-teal-500/30 text-slate-200'
          }`}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? t.copied || 'Copied' : t.copy || 'Copy'}
        </button>
        <button
          onClick={download}
          disabled={busy}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-[#03211d] text-xs font-black transition-colors cursor-pointer outline-none"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {t.export_download || 'Download'}
        </button>
      </div>
    </div>
  );
};
