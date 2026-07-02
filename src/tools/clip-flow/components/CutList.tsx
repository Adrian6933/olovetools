import React from 'react';
import { Cut, CutExportState } from '../types';
import { CutCard } from './CutCard';

interface CutListProps {
  cuts: Cut[];
  activeCutId: string | null;
  duration: number;
  cutStates: Record<string, CutExportState>;
  onSelect: (id: string) => void;
  onChange: (cut: Cut) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onSetStartAtPlayhead: (id: string) => void;
  onSetEndAtPlayhead: (id: string) => void;
  onDownload: (id: string) => void;
  onCancelDownload: (id: string) => void;
  onDownloadTsFallback: (id: string) => void;
  t: any;
}

export const CutList: React.FC<CutListProps> = ({ cuts, activeCutId, duration, cutStates, onSelect, onChange, onRemove, onMove, onSetStartAtPlayhead, onSetEndAtPlayhead, onDownload, onCancelDownload, onDownloadTsFallback, t }) => {
  if (cuts.length === 0) {
    return (
      <div className="glass-card rounded-3xl p-8 text-center text-slate-500 text-sm">
        {t.noCutsYet || "No cuts yet — press 'Add cut' to mark your first range."}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {cuts.map((cut, index) => (
        <CutCard
          key={cut.id}
          cut={cut}
          index={index}
          total={cuts.length}
          isActive={cut.id === activeCutId}
          duration={duration}
          exportState={cutStates[cut.id] || { status: 'idle', progress: 0 }}
          onSelect={() => onSelect(cut.id)}
          onChange={onChange}
          onRemove={() => onRemove(cut.id)}
          onMoveUp={() => onMove(cut.id, -1)}
          onMoveDown={() => onMove(cut.id, 1)}
          onSetStartAtPlayhead={() => onSetStartAtPlayhead(cut.id)}
          onSetEndAtPlayhead={() => onSetEndAtPlayhead(cut.id)}
          onDownload={() => onDownload(cut.id)}
          onCancelDownload={() => onCancelDownload(cut.id)}
          onDownloadTsFallback={() => onDownloadTsFallback(cut.id)}
          t={t}
        />
      ))}
    </div>
  );
};
