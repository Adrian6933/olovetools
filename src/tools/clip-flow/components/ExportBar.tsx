import React from 'react';
import { Download, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Cut, CutExportState, FfmpegLoadState } from '../types';
import { formatHMS } from './TimeInput';

interface ExportBarProps {
  cuts: Cut[];
  joinState: CutExportState;
  ffmpegState: FfmpegLoadState;
  ffmpegLoadPct: number;
  totalSeconds: number;
  estimatedBytes: number;
  memoryWarning: boolean;
  onExportAll: () => void;
  onCancel: () => void;
  t: any;
}

const formatBytes = (bytes: number): string => {
  if (!bytes || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) { val /= 1024; i++; }
  return `${val.toFixed(1)} ${units[i]}`;
};

export const ExportBar: React.FC<ExportBarProps> = ({ cuts, joinState, ffmpegState, ffmpegLoadPct, totalSeconds, estimatedBytes, memoryWarning, onExportAll, onCancel, t }) => {
  if (cuts.length === 0) return null;

  const busy = joinState.status === 'downloading' || joinState.status === 'processing' || ffmpegState === 'loading';

  return (
    <div className="sticky bottom-4 z-30">
      <div className="glass-card rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4 shadow-2xl">
        <div className="flex-grow min-w-0">
          <p className="text-sm font-bold text-white">
            {cuts.length} {cuts.length === 1 ? (t.cutLabel || 'cut') : (t.cutsLabel || 'cuts')} &middot; {formatHMS(totalSeconds)} {t.totalLabel || 'total'}
            {estimatedBytes > 0 && <span className="text-slate-500"> &middot; ~{formatBytes(estimatedBytes)}</span>}
          </p>
          {ffmpegState === 'loading' && (
            <div className="mt-2 space-y-1 max-w-sm">
              <p className="text-xs text-slate-400">{(t.loadingEngine || 'Loading video engine ({pct}%) — first time only…').replace('{pct}', String(ffmpegLoadPct))}</p>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 transition-all" style={{ width: `${ffmpegLoadPct}%` }} />
              </div>
            </div>
          )}
          {(joinState.status === 'downloading' || joinState.status === 'processing') && (
            <div className="mt-2 space-y-1 max-w-sm">
              <p className="text-xs text-slate-400">{joinState.phaseLabel}</p>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 transition-all" style={{ width: `${joinState.progress}%` }} />
              </div>
            </div>
          )}
          {joinState.status === 'error' && <p className="text-xs text-rose-400 mt-1">{joinState.error || t.exportError || 'Export failed.'}</p>}
          {memoryWarning && (
            <div className="flex items-center gap-1.5 text-amber-400 text-xs mt-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{t.memoryWarning || 'Very long cuts at source quality can exceed browser memory. Consider 720p or shorter cuts.'}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {busy ? (
            <button onClick={onCancel} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-3 rounded-xl transition-colors cursor-pointer">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t.cancel || 'Cancel'}
            </button>
          ) : joinState.status === 'done' ? (
            <div className="flex items-center gap-2 text-emerald-400 font-bold px-5 py-3">
              <CheckCircle2 className="w-4 h-4" />
              {t.exportDone || 'Done!'}
            </div>
          ) : (
            <button onClick={onExportAll} disabled={cuts.length === 0} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold px-5 py-3 rounded-xl transition-colors cursor-pointer">
              <Download className="w-4 h-4" />
              {t.downloadAllJoined || 'Download all joined (MP4)'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
