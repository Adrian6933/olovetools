import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, Maximize2, Minus, Plus, Sparkles } from 'lucide-react';
import type { Design, PreviewBackdrop, TabId } from '../types';
import { previewStyle } from '../lib/serialize';

interface PreviewProps {
  tab: TabId;
  design: Design;
  backdrop: PreviewBackdrop;
  photoUrl: string | null;
  t: any;
  /** True while the user holds the compare control. */
  comparing: boolean;
  setComparing: (value: boolean) => void;
}

const BACKDROP_CLASS: Record<Exclude<PreviewBackdrop, 'photo'>, string> = {
  darkGrid:
    'bg-[#0f111a] bg-[linear-gradient(to_right,#ffffff0d_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0d_1px,transparent_1px)] bg-[size:24px_24px]',
  lightGrid:
    'bg-[#f8fafc] bg-[linear-gradient(to_right,#0000000d_1px,transparent_1px),linear-gradient(to_bottom,#0000000d_1px,transparent_1px)] bg-[size:24px_24px]',
  mesh: 'bg-[#08060d]',
  vibrant: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900',
};

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 3;

export const Preview: React.FC<PreviewProps> = ({
  tab,
  design,
  backdrop,
  photoUrl,
  t,
  comparing,
  setComparing,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  // Wheel zoom has to be a non-passive listener or preventDefault is ignored
  // and the page scrolls out from under the cursor.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey && Math.abs(event.deltaY) < 2) return;
      event.preventDefault();
      const rect = stage.getBoundingClientRect();
      // Anchor the zoom at the pointer: keep the stage point under the cursor
      // fixed while the scale changes.
      const px = event.clientX - rect.left - rect.width / 2;
      const py = event.clientY - rect.top - rect.height / 2;
      setZoom(current => {
        const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, current * (event.deltaY < 0 ? 1.12 : 1 / 1.12)));
        setPan(p => ({
          x: px - ((px - p.x) * next) / current,
          y: py - ((py - p.y) * next) / current,
        }));
        return next;
      });
    };

    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!dragging.current) return;
      setPan({
        x: dragging.current.panX + (event.clientX - dragging.current.x),
        y: dragging.current.panY + (event.clientY - dragging.current.y),
      });
    };
    const up = () => {
      dragging.current = null;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const style = comparing ? { background: 'rgba(255,255,255,0.06)', borderRadius: '12px' } : previewStyle(tab, design);

  const backdropStyle: React.CSSProperties =
    backdrop === 'photo' && photoUrl
      ? { backgroundImage: `url(${photoUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : {};

  return (
    <div className="space-y-3">
      <div
        ref={stageRef}
        className={`relative w-full min-h-[320px] sm:min-h-[380px] rounded-2xl overflow-hidden border border-white/5 touch-none ${
          backdrop === 'photo' && photoUrl ? 'bg-[#08060d]' : BACKDROP_CLASS[backdrop as Exclude<PreviewBackdrop, 'photo'>] || BACKDROP_CLASS.mesh
        }`}
        style={backdropStyle}
        onPointerDown={event => {
          if (event.button !== 0 && event.button !== 1) return;
          dragging.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
        }}
      >
        {/* Mesh blobs — the previous version named this theme and drew nothing. */}
        {backdrop === 'mesh' && (
          <>
            <span className="absolute -top-16 -left-10 w-72 h-72 rounded-full bg-violet-600/30 blur-3xl" />
            <span className="absolute top-10 -right-16 w-72 h-72 rounded-full bg-pink-500/25 blur-3xl" />
            <span className="absolute -bottom-24 left-1/3 w-80 h-80 rounded-full bg-cyan-500/20 blur-3xl" />
          </>
        )}

        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div
            className="w-[78%] max-w-sm"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center' }}
          >
            <div
              style={style}
              className="p-7 flex flex-col gap-3 text-center select-none relative"
            >
              {/* A colourful sample so `filter` has something to act on. In
                  backdrop mode it would sit on top of the very backdrop being
                  filtered and hide the effect, so it is dropped there. */}
              {tab === 'filter' && !design.filter.backdrop && (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 rounded-[inherit] bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400"
                />
              )}
              <span className="w-11 h-11 rounded-full bg-white/15 border border-white/20 flex items-center justify-center mx-auto text-white">
                <Sparkles className="w-5 h-5" />
              </span>
              <h3 className="text-lg font-black text-white tracking-tight">{t.preview_text || 'CSS Playground'}</h3>
              <p className="text-white/70 text-xs font-medium leading-relaxed">
                {t.preview_subtext || 'Change controls on the left to see modifications in real-time.'}
              </p>
              <span className="mx-auto mt-1 px-4 py-2 bg-white text-slate-900 font-bold text-[11px] uppercase rounded-xl">
                {t.preview_button || 'Button'}
              </span>
            </div>
          </div>
        </div>

        {/* View controls */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-xl border border-white/10 bg-black/50 backdrop-blur-md p-1">
          <button
            type="button"
            aria-label={t.zoom_out || 'Zoom out'}
            onClick={() => setZoom(z => Math.max(ZOOM_MIN, z / 1.15))}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 cursor-pointer bg-transparent border-none"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={resetView}
            className="px-2 h-7 text-[11px] font-mono font-bold text-slate-300 hover:bg-white/10 rounded-lg cursor-pointer bg-transparent border-none"
            aria-label={t.reset_view || 'Reset view'}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            aria-label={t.zoom_in || 'Zoom in'}
            onClick={() => setZoom(z => Math.min(ZOOM_MAX, z * 1.15))}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 cursor-pointer bg-transparent border-none"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <span className="w-px h-4 bg-white/10 mx-0.5" />
          <button
            type="button"
            aria-label={t.reset_view || 'Reset view'}
            onClick={resetView}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 cursor-pointer bg-transparent border-none"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Hold to compare */}
        <button
          type="button"
          onPointerDown={() => setComparing(true)}
          onPointerUp={() => setComparing(false)}
          onPointerLeave={() => setComparing(false)}
          onBlur={() => setComparing(false)}
          className={`absolute bottom-3 left-3 flex items-center gap-1.5 px-3 h-9 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer backdrop-blur-md ${
            comparing
              ? 'bg-violet-600 border-violet-500 text-white'
              : 'bg-black/50 border-white/10 text-slate-300 hover:text-white'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          {t.hold_compare || 'Hold to compare'}
        </button>
      </div>

      <p className="text-[11px] text-slate-500">
        {t.preview_hint || 'Scroll to zoom at the cursor, drag to pan, hold B to compare with the unstyled element.'}
      </p>
    </div>
  );
};

export default Preview;
