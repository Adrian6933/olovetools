import React from 'react';
import { Image as ImageIcon, Loader2, PenLine, Sparkles, Wand2, X } from 'lucide-react';
import type { PendingImage } from '../types';

// ============================================================================
// Staging area for a file the user just dropped, pasted or received from
// another tool. Dropping a file costs nothing here: the picture waits, the
// user picks how it should land on the board, and only then does anything run.
// ============================================================================

export type TraceDetail = 'low' | 'medium' | 'high';

interface ImportPanelProps {
  t: any;
  pending: PendingImage;
  busy: boolean;
  detail: TraceDetail;
  onDetail: (detail: TraceDetail) => void;
  sampleColor: boolean;
  onSampleColor: (value: boolean) => void;
  keepPhoto: boolean;
  onKeepPhoto: (value: boolean) => void;
  onPlace: () => void;
  onTrace: () => void;
  onCancel: () => void;
}

const DETAILS: TraceDetail[] = ['low', 'medium', 'high'];

export const ImportPanel: React.FC<ImportPanelProps> = ({
  t,
  pending,
  busy,
  detail,
  onDetail,
  sampleColor,
  onSampleColor,
  keepPhoto,
  onKeepPhoto,
  onPlace,
  onTrace,
  onCancel,
}) => {
  const detailLabels: Record<TraceDetail, string> = {
    low: t.traceLow || 'Rough',
    medium: t.traceMedium || 'Balanced',
    high: t.traceHigh || 'Detailed',
  };

  return (
    <div className="rounded-3xl border border-purple-500/25 bg-[#120d20]/80 p-4 sm:p-5 space-y-4">
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-2xl overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center">
          <img src={pending.url} alt="" className="max-w-full max-h-full object-contain" />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <p className="text-sm font-bold text-white truncate">{pending.name}</p>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold tabular-nums">
            {pending.width} × {pending.height} px
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {pending.from
              ? (t.importedFrom || 'Handed over by {tool} — nothing has been added to the board yet.').replace(
                  '{tool}',
                  pending.from
                )
              : t.importWaiting || 'Nothing has run yet. Choose how it should land on the board.'}
          </p>
        </div>

        <button
          onClick={onCancel}
          disabled={busy}
          title={t.discard || 'Discard'}
          className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-30"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="rounded-2xl border border-white/5 bg-black/25 p-3.5 space-y-3">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          <Wand2 className="w-3.5 h-3.5 text-purple-400" />
          {t.traceTitle || 'Trace it into editable strokes'}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/5">
            {DETAILS.map(level => (
              <button
                key={level}
                onClick={() => onDetail(level)}
                disabled={busy}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer disabled:cursor-wait ${
                  detail === level ? 'bg-purple-500/25 text-purple-200' : 'text-slate-500 hover:text-white'
                }`}
              >
                {detailLabels[level]}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sampleColor}
              onChange={e => onSampleColor(e.target.checked)}
              disabled={busy}
              className="accent-purple-500 w-3.5 h-3.5 cursor-pointer"
            />
            {t.traceSampleColor || 'Take colours from the photo'}
          </label>

          <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={keepPhoto}
              onChange={e => onKeepPhoto(e.target.checked)}
              disabled={busy}
              className="accent-purple-500 w-3.5 h-3.5 cursor-pointer"
            />
            {t.traceKeepPhoto || 'Keep the photo underneath'}
          </label>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          {t.traceHint ||
            'Contours are turned into ordinary pencil strokes: every line can be moved, recoloured, erased or undone on its own.'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2.5">
        <button
          onClick={onTrace}
          disabled={busy}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-purple-600/25 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 stroke-[3]" />}
          {busy ? t.traceRunning || 'Tracing…' : t.traceBtn || 'Trace into strokes'}
        </button>

        <button
          onClick={onPlace}
          disabled={busy}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest transition-all cursor-pointer disabled:opacity-40"
          title={t.placeHint || 'Drop it on the board as-is and draw over it yourself.'}
        >
          <PenLine className="w-4 h-4" />
          {t.placeBtn || 'Just place it'}
        </button>
      </div>
    </div>
  );
};

export default ImportPanel;
