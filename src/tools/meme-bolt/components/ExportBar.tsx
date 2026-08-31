import React from 'react';
import { Check, ClipboardCopy, Download, Loader2 } from 'lucide-react';
import type { ExportFormat, ExportSettings } from '../types';

interface ExportBarProps {
  t: any;
  settings: ExportSettings;
  onChange: (settings: ExportSettings) => void;
  onDownload: () => void;
  onCopy: () => void;
  busy: boolean;
  copied: boolean;
  /** Pixel size the current settings will produce. */
  output: { width: number; height: number };
  maxScale: number;
}

const FORMATS: { value: ExportFormat; label: string }[] = [
  { value: 'image/png', label: 'PNG' },
  { value: 'image/jpeg', label: 'JPG' },
  { value: 'image/webp', label: 'WebP' },
];

export const ExportBar: React.FC<ExportBarProps> = ({
  t,
  settings,
  onChange,
  onDownload,
  onCopy,
  busy,
  copied,
  output,
  maxScale,
}) => {
  const scales = [1, 2, 3, 4].filter(s => s <= maxScale + 0.001);
  const lossy = settings.format !== 'image/png';

  return (
    <div className="flex flex-col gap-4 border-t border-white/5 pt-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5 min-w-0">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            {t.exportFormat || 'Format'}
          </label>
          <div className="flex gap-1 p-1 rounded-xl bg-black/40 border border-white/10">
            {FORMATS.map(format => (
              <button
                key={format.value}
                onClick={() => onChange({ ...settings, format: format.value })}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-colors cursor-pointer ${
                  settings.format === format.value ? 'bg-fuchsia-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {format.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 min-w-0">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            {t.exportScale || 'Resolution'}
          </label>
          <div className="flex gap-1 p-1 rounded-xl bg-black/40 border border-white/10">
            {scales.map(scale => (
              <button
                key={scale}
                onClick={() => onChange({ ...settings, scale })}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-colors cursor-pointer ${
                  settings.scale === scale ? 'bg-fuchsia-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {scale}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {lossy && (
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider">
            <span>{t.exportQuality || 'Quality'}</span>
            <span className="text-fuchsia-400 font-mono tabular-nums">{Math.round(settings.quality * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.4}
            max={1}
            step={0.01}
            value={settings.quality}
            onChange={e => onChange({ ...settings, quality: parseFloat(e.target.value) })}
            className="w-full accent-fuchsia-500 cursor-pointer"
          />
        </div>
      )}

      <p className="text-[10px] text-slate-500 font-bold tabular-nums text-center">
        {t.exportOutput || 'Output'}: {output.width} × {output.height} px
      </p>

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={onDownload}
          disabled={busy}
          className="flex-1 py-4 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white font-black text-sm uppercase rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-3 active:scale-95 duration-200 outline-none shadow-lg shadow-fuchsia-500/20 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 disabled:cursor-wait"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span>{t.btn_download || 'Download meme'}</span>
        </button>

        <button
          onClick={onCopy}
          disabled={busy}
          title={t.copyHint || 'Copies the PNG to the clipboard, ready to paste into a chat'}
          className="sm:w-14 py-4 rounded-2xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:border-fuchsia-500/40 transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <ClipboardCopy className="w-4 h-4" />}
          <span className="sm:hidden text-xs font-black uppercase">{t.copy || 'Copy'}</span>
        </button>
      </div>
    </div>
  );
};

export default ExportBar;
