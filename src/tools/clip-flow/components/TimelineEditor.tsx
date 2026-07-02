import React, { useRef, useState, useLayoutEffect, useCallback, useEffect } from 'react';
import { Plus, Minus, PlusCircle } from 'lucide-react';
import { Cut } from '../types';
import { formatHMS } from './TimeInput';

interface TimelineEditorProps {
  duration: number;
  currentTime: number;
  cuts: Cut[];
  activeCutId: string | null;
  onSeek: (time: number) => void;
  onChangeCut: (cut: Cut) => void;
  onSelectCut: (id: string) => void;
  onAddCutAtPlayhead: () => void;
  t: any;
}

const ZOOM_LEVELS = [1, 2, 4, 8, 16, 32, 64];
const TICK_STEPS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200];

type DragMode = 'move' | 'start' | 'end';
interface DragState { id: string; mode: DragMode; startX: number; origStart: number; origEnd: number; }

export const TimelineEditor: React.FC<TimelineEditorProps> = ({ duration, currentTime, cuts, activeCutId, onSeek, onChangeCut, onSelectCut, onAddCutAtPlayhead, t }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [zoomIndex, setZoomIndex] = useState(0);
  const zoom = ZOOM_LEVELS[zoomIndex];

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.clientWidth || 800);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const safeDuration = Math.max(duration, 1);
  const trackWidth = containerWidth * zoom;
  const pxPerSecond = trackWidth / safeDuration;

  const tickStep = TICK_STEPS.find(step => step * pxPerSecond >= 70) || TICK_STEPS[TICK_STEPS.length - 1];
  const ticks: number[] = [];
  for (let tsec = 0; tsec <= safeDuration; tsec += tickStep) ticks.push(tsec);

  const timeFromClientX = useCallback((clientX: number) => {
    const el = scrollRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left + el.scrollLeft;
    return Math.min(safeDuration, Math.max(0, x / pxPerSecond));
  }, [pxPerSecond, safeDuration]);

  const handleTrackClick = (e: React.MouseEvent) => {
    onSeek(timeFromClientX(e.clientX));
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const x = currentTime * pxPerSecond;
    if (x < el.scrollLeft || x > el.scrollLeft + el.clientWidth) {
      el.scrollLeft = Math.max(0, x - el.clientWidth / 2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime]);

  const dragState = useRef<DragState | null>(null);

  const beginDrag = (e: React.PointerEvent, cut: Cut, mode: DragMode) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    dragState.current = { id: cut.id, mode, startX: e.clientX, origStart: cut.start, origEnd: cut.end };
    onSelectCut(cut.id);
  };

  const onDragMove = (e: React.PointerEvent) => {
    const drag = dragState.current;
    if (!drag) return;
    const deltaSeconds = (e.clientX - drag.startX) / pxPerSecond;
    const cut = cuts.find(c => c.id === drag.id);
    if (!cut) return;

    let start = drag.origStart;
    let end = drag.origEnd;

    if (drag.mode === 'move') {
      const span = drag.origEnd - drag.origStart;
      start = Math.min(safeDuration - span, Math.max(0, drag.origStart + deltaSeconds));
      end = start + span;
    } else if (drag.mode === 'start') {
      start = Math.min(drag.origEnd - 1, Math.max(0, drag.origStart + deltaSeconds));
    } else {
      end = Math.max(drag.origStart + 1, Math.min(safeDuration, drag.origEnd + deltaSeconds));
    }

    onChangeCut({ ...cut, start, end });
  };

  const endDrag = () => { dragState.current = null; };

  return (
    <div className="glass-card rounded-3xl p-4 md:p-6 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-sm font-bold text-slate-300">{t.timelineTitle || 'Timeline'}</h3>
        <div className="flex items-center gap-3">
          <button onClick={onAddCutAtPlayhead} className="flex items-center gap-1.5 text-xs font-bold text-violet-300 hover:text-violet-200 bg-violet-500/10 hover:bg-violet-500/20 px-3 py-1.5 rounded-lg transition-colors">
            <PlusCircle className="w-3.5 h-3.5" />
            {t.addCut || 'Add cut at playhead'}
          </button>
          <div className="flex items-center gap-1 text-slate-400">
            <button onClick={() => setZoomIndex(i => Math.max(0, i - 1))} disabled={zoomIndex === 0} className="p-1 rounded hover:bg-white/10 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] w-8 text-center font-mono">{zoom}x</span>
            <button onClick={() => setZoomIndex(i => Math.min(ZOOM_LEVELS.length - 1, i + 1))} disabled={zoomIndex === ZOOM_LEVELS.length - 1} className="p-1 rounded hover:bg-white/10 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="relative overflow-x-auto overflow-y-hidden rounded-xl bg-black/30 border border-white/5" style={{ height: 84 }}>
        <div
          className="relative h-full cursor-pointer select-none"
          style={{ width: trackWidth }}
          onClick={handleTrackClick}
          onPointerMove={onDragMove}
          onPointerUp={endDrag}
        >
          <div className="absolute top-0 left-0 right-0 h-5 border-b border-white/5">
            {ticks.map(tsec => (
              <div key={tsec} className="absolute top-0 h-full flex items-center" style={{ left: tsec * pxPerSecond }}>
                <div className="w-px h-2 bg-white/20" />
                <span className="text-[9px] text-slate-500 ml-1 font-mono whitespace-nowrap">{formatHMS(tsec)}</span>
              </div>
            ))}
          </div>

          <div className="absolute top-6 left-0 right-0 bottom-2">
            {cuts.map(cut => {
              const left = cut.start * pxPerSecond;
              const width = Math.max(4, (cut.end - cut.start) * pxPerSecond);
              const isActive = cut.id === activeCutId;
              return (
                <div
                  key={cut.id}
                  className={`absolute top-0 bottom-0 rounded-md border-2 transition-shadow cursor-grab active:cursor-grabbing ${isActive ? 'z-10 shadow-lg' : 'z-0 opacity-80'}`}
                  style={{ left, width, backgroundColor: `${cut.color}33`, borderColor: cut.color }}
                  onPointerDown={(e) => beginDrag(e, cut, 'move')}
                  onClick={(e) => { e.stopPropagation(); onSelectCut(cut.id); }}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize" onPointerDown={(e) => beginDrag(e, cut, 'start')} />
                  <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize" onPointerDown={(e) => beginDrag(e, cut, 'end')} />
                  <span className="absolute top-1 left-2 text-[10px] font-bold truncate max-w-[85%] pointer-events-none" style={{ color: cut.color }}>{cut.label}</span>
                </div>
              );
            })}
          </div>

          <div className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none z-20" style={{ left: currentTime * pxPerSecond }}>
            <div className="absolute -top-0.5 -left-[3px] w-2 h-2 rotate-45 bg-white" />
          </div>
        </div>
      </div>

      <p className="text-[11px] text-slate-500">{t.precisionNote || 'Cuts snap to the nearest keyframe (~2s) to stay lossless.'}</p>
      {cuts.length > 1 && <p className="text-[11px] text-slate-500">{t.overlapHint || 'Cuts may overlap; the joined video follows the list order.'}</p>}
    </div>
  );
};
