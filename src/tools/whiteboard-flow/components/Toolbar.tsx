import React from 'react';
import {
  Columns3,
  Copy,
  Link2,
  Maximize,
  Plus,
  Redo2,
  Scan,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { COLOR_INK, NOTE_COLORS, type BoardLayout, type NoteColor } from '../types';

interface ToolbarProps {
  t: any;
  layout: BoardLayout;
  scale: number;
  selectionCount: number;
  canUndo: boolean;
  canRedo: boolean;
  onAdd: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onColor: (c: NoteColor) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onLayout: (l: BoardLayout) => void;
  onZoom: (delta: number) => void;
  onFit: () => void;
  onResetZoom: () => void;
}

const btn =
  'inline-flex items-center justify-center gap-1.5 h-9 px-2.5 rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:border-cyan-500/40 hover:bg-cyan-500/10 transition-all text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer';

export const Toolbar: React.FC<ToolbarProps> = ({
  t,
  layout,
  scale,
  selectionCount,
  canUndo,
  canRedo,
  onAdd,
  onUndo,
  onRedo,
  onColor,
  onDuplicate,
  onDelete,
  onLayout,
  onZoom,
  onFit,
  onResetZoom,
}) => {
  const hasSel = selectionCount > 0;

  return (
    // flex-wrap, not a single row: at 375px this bar holds a dozen controls and
    // an overflowing toolbar is worse than a two-line one.
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={onAdd} className={`${btn} !bg-cyan-500 !text-[#04080a] !border-cyan-400 hover:!bg-cyan-400 px-3.5`}>
        <Plus className="w-4 h-4" />
        <span>{t.addNote || 'Add note'}</span>
      </button>

      <div className="flex items-center gap-1">
        <button onClick={onUndo} disabled={!canUndo} className={btn} title={t.undo || 'Undo'} aria-label={t.undo || 'Undo'}>
          <Undo2 className="w-4 h-4" />
        </button>
        <button onClick={onRedo} disabled={!canRedo} className={btn} title={t.redo || 'Redo'} aria-label={t.redo || 'Redo'}>
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-1 px-1.5 h-9 rounded-lg border border-white/10 bg-white/5">
        {NOTE_COLORS.map(c => (
          <button
            key={c}
            onClick={() => onColor(c)}
            disabled={!hasSel}
            aria-label={`${t.color || 'Colour'}: ${c}`}
            title={t.colorHint || 'Colour of the selected notes'}
            className="w-4 h-4 rounded-full border border-black/20 transition-transform hover:scale-125 disabled:opacity-30 disabled:hover:scale-100 cursor-pointer"
            style={{ background: COLOR_INK[c].fill }}
          />
        ))}
      </div>

      <div className="flex items-center gap-1">
        <button onClick={onDuplicate} disabled={!hasSel} className={btn} title={t.duplicate || 'Duplicate'} aria-label={t.duplicate || 'Duplicate'}>
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          disabled={!hasSel}
          className={`${btn} hover:!border-red-500/40 hover:!bg-red-500/10 hover:!text-red-300`}
          title={t.deleteNote || 'Delete'}
          aria-label={t.deleteNote || 'Delete'}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center rounded-lg border border-white/10 bg-white/5 overflow-hidden h-9">
        <button
          onClick={() => onLayout('kanban')}
          className={`flex items-center gap-1.5 h-full px-2.5 text-xs font-bold transition-colors cursor-pointer ${
            layout === 'kanban' ? 'bg-cyan-500/20 text-cyan-200' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Columns3 className="w-4 h-4" />
          <span className="hidden sm:inline">{t.layoutKanban || 'Lanes'}</span>
        </button>
        <button
          onClick={() => onLayout('free')}
          className={`flex items-center gap-1.5 h-full px-2.5 text-xs font-bold transition-colors cursor-pointer ${
            layout === 'free' ? 'bg-cyan-500/20 text-cyan-200' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Link2 className="w-4 h-4" />
          <span className="hidden sm:inline">{t.layoutFree || 'Free'}</span>
        </button>
      </div>

      <div className="flex items-center gap-1 ml-auto">
        <button onClick={() => onZoom(-1)} className={btn} title={t.zoomOut || 'Zoom out'} aria-label={t.zoomOut || 'Zoom out'}>
          <ZoomOut className="w-4 h-4" />
        </button>
        <button onClick={onResetZoom} className={`${btn} tabular-nums min-w-[3.5rem]`} title={t.zoomReset || 'Reset zoom'}>
          {Math.round(scale * 100)}%
        </button>
        <button onClick={() => onZoom(1)} className={btn} title={t.zoomIn || 'Zoom in'} aria-label={t.zoomIn || 'Zoom in'}>
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={onFit} className={btn} title={t.fitBoard || 'Fit board'} aria-label={t.fitBoard || 'Fit board'}>
          <Maximize className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const CleanViewHint: React.FC<{ t: any }> = ({ t }) => (
  <div className="flex items-center gap-2 text-[11px] text-slate-500">
    <Scan className="w-3.5 h-3.5 text-cyan-500/60 shrink-0" />
    <span>{t.cleanViewHint || 'Hold H to preview the board exactly as it exports.'}</span>
  </div>
);

export default Toolbar;
