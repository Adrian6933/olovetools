import React, { useState } from 'react';
import { Braces, Download, FileCode2, Hash, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ExportPanelProps {
  t: any;
  empty: boolean;
  scale: number;
  transparent: boolean;
  onScale: (s: number) => void;
  onTransparent: (v: boolean) => void;
  onExport: (kind: 'png' | 'svg' | 'json' | 'md') => Promise<void>;
  /** Pixel size the PNG will come out at, computed from the board bounds. */
  pngSize: { w: number; h: number };
}

const btn =
  'flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:border-cyan-500/30 hover:bg-cyan-500/10 text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

export const ExportPanel: React.FC<ExportPanelProps> = ({
  t,
  empty,
  scale,
  transparent,
  onScale,
  onTransparent,
  onExport,
  pngSize,
}) => {
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (kind: 'png' | 'svg' | 'json' | 'md') => {
    if (busy || empty) return;
    setBusy(kind);
    try {
      await onExport(kind);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Download className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-black tracking-tight text-white">{t.exportTitle || 'Export the board'}</h3>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-lg border border-white/10 bg-white/5 overflow-hidden">
          {[1, 2, 3].map(s => (
            <button
              key={s}
              onClick={() => onScale(s)}
              className={`px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                scale === s ? 'bg-cyan-500/20 text-cyan-200' : 'text-slate-400 hover:text-white'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={transparent}
            onChange={e => onTransparent(e.target.checked)}
            className="w-4 h-4 accent-cyan-500 cursor-pointer"
          />
          {t.exportTransparent || 'Transparent background'}
        </label>

        <span className="text-[11px] font-mono text-slate-500 tabular-nums">
          {pngSize.w} x {pngSize.h} px
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button onClick={() => run('png')} disabled={empty} className={btn}>
          {busy === 'png' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4 text-cyan-400" />}
          PNG
        </button>
        <button onClick={() => run('svg')} disabled={empty} className={btn}>
          {busy === 'svg' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCode2 className="w-4 h-4 text-cyan-400" />}
          SVG
        </button>
        <button onClick={() => run('json')} disabled={empty} className={btn}>
          {busy === 'json' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Braces className="w-4 h-4 text-cyan-400" />}
          JSON
        </button>
        <button onClick={() => run('md')} disabled={empty} className={btn}>
          {busy === 'md' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hash className="w-4 h-4 text-cyan-400" />}
          Markdown
        </button>
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed">
        {t.exportNote ||
          'SVG keeps the text as real vector text. JSON round-trips back into the board. Markdown gives you a checklist per lane.'}
      </p>
    </div>
  );
};

export default ExportPanel;
