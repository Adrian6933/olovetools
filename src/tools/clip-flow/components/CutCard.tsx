import React from 'react';
import { ArrowLeftToLine, ArrowRightToLine, ChevronUp, ChevronDown, Trash2, Download, CheckCircle2, X, FileVideo } from 'lucide-react';
import { Cut, CutExportState } from '../types';
import { TimeInput, formatHMS } from './TimeInput';

interface CutCardProps {
  cut: Cut;
  index: number;
  total: number;
  isActive: boolean;
  duration: number;
  exportState: CutExportState;
  onSelect: () => void;
  onChange: (cut: Cut) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSetStartAtPlayhead: () => void;
  onSetEndAtPlayhead: () => void;
  onDownload: () => void;
  onCancelDownload: () => void;
  onDownloadTsFallback: () => void;
  t: any;
}

export const CutCard: React.FC<CutCardProps> = ({ cut, index, total, isActive, duration, exportState, onSelect, onChange, onRemove, onMoveUp, onMoveDown, onSetStartAtPlayhead, onSetEndAtPlayhead, onDownload, onCancelDownload, onDownloadTsFallback, t }) => {
  const busy = exportState.status === 'downloading' || exportState.status === 'processing';
  const cutDuration = Math.max(0, cut.end - cut.start);

  return (
    <div
      onClick={onSelect}
      className={`rounded-2xl border p-4 space-y-3 cursor-pointer transition-colors ${isActive ? 'border-white/30 bg-white/[0.04]' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.03]'}`}
      style={{ borderLeftColor: cut.color, borderLeftWidth: 4 }}
    >
      <div className="flex items-center justify-between gap-2">
        <input
          value={cut.label}
          onChange={(e) => onChange({ ...cut, label: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          className="bg-transparent text-white font-bold text-sm outline-none border-b border-transparent focus:border-white/20 min-w-0 flex-grow"
        />
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button onClick={onMoveUp} disabled={index === 0} className="p-1 rounded hover:bg-white/10 disabled:opacity-20 text-slate-400 cursor-pointer disabled:cursor-not-allowed"><ChevronUp className="w-4 h-4" /></button>
          <button onClick={onMoveDown} disabled={index === total - 1} className="p-1 rounded hover:bg-white/10 disabled:opacity-20 text-slate-400 cursor-pointer disabled:cursor-not-allowed"><ChevronDown className="w-4 h-4" /></button>
          <button onClick={onRemove} className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <button onClick={onSetStartAtPlayhead} title={t.setStartAtPlayhead || 'Set start here'} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"><ArrowLeftToLine className="w-3.5 h-3.5" /></button>
          <TimeInput value={cut.start} min={0} max={Math.max(0, cut.end - 1)} onChange={(v) => onChange({ ...cut, start: v })} />
        </div>
        <span className="text-slate-600">&rarr;</span>
        <div className="flex items-center gap-1">
          <TimeInput value={cut.end} min={cut.start + 1} max={duration} onChange={(v) => onChange({ ...cut, end: v })} />
          <button onClick={onSetEndAtPlayhead} title={t.setEndAtPlayhead || 'Set end here'} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"><ArrowRightToLine className="w-3.5 h-3.5" /></button>
        </div>
        <span className="text-xs text-slate-500 ml-auto font-mono">{formatHMS(cutDuration)}</span>
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        {exportState.status === 'idle' && (
          <button onClick={onDownload} className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-violet-600 border border-white/10 hover:border-violet-500 text-white text-sm font-bold py-2 rounded-xl transition-colors cursor-pointer">
            <Download className="w-4 h-4" />
            {t.downloadCut || 'Download MP4'}
          </button>
        )}
        {busy && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{exportState.phaseLabel}</span>
              <button onClick={onCancelDownload} className="text-slate-500 hover:text-rose-400 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 transition-all" style={{ width: `${exportState.progress}%` }} />
            </div>
          </div>
        )}
        {exportState.status === 'done' && (
          <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-bold py-2">
            <CheckCircle2 className="w-4 h-4" />
            {t.exportDone || 'Done!'}
          </div>
        )}
        {exportState.status === 'error' && (
          <div className="space-y-2">
            <p className="text-rose-400 text-xs">{exportState.error || t.exportError || 'Export failed.'}</p>
            <div className="flex gap-2">
              <button onClick={onDownload} className="flex-grow bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-2 rounded-lg cursor-pointer">{t.downloadCut || 'Download MP4'}</button>
              <button onClick={onDownloadTsFallback} className="flex items-center gap-1 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold py-2 px-3 rounded-lg cursor-pointer"><FileVideo className="w-3.5 h-3.5" />{t.tsFallback || '.ts'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
