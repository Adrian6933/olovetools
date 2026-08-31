import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { HitRegion, Scene } from '../types';
import { hitTest, formatValue } from '../utils/scene';
import { IDENTITY_VIEW, paintScene, type View } from '../utils/render';

interface ChartCanvasProps {
  scene: Scene;
  /** Reports the measured content width so the parent can size the scene. */
  onWidth: (width: number) => void;
  t: any;
  /** Shown centred when there is nothing to draw yet. */
  placeholder?: React.ReactNode;
  empty?: boolean;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;

export const ChartCanvas: React.FC<ChartCanvasProps> = ({ scene, onWidth, t, placeholder, empty }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [view, setView] = useState<View>(IDENTITY_VIEW);
  const [hover, setHover] = useState<{ hit: HitRegion; x: number; y: number } | null>(null);
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  // ── Size ─────────────────────────────────────────────────────────────────
  // ResizeObserver is the primary signal, but it never fires while the
  // document is hidden, so an initial synchronous measure is not optional —
  // without it the canvas keeps its default 300×150 backing store.
  const reportWidth = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const w = Math.round(el.clientWidth);
    if (w > 0) onWidth(w);
  }, [onWidth]);

  useLayoutEffect(() => {
    reportWidth();
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(reportWidth);
    ro.observe(el);
    window.addEventListener('resize', reportWidth);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', reportWidth);
    };
  }, [reportWidth]);

  // ── Paint ────────────────────────────────────────────────────────────────
  // Synchronous, never inside requestAnimationFrame: rAF is throttled to zero
  // in a background tab, which would leave the canvas blank for anyone who
  // switches away mid-render and comes back.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    paintScene(canvas, scene, dpr, view);
  }, [scene, view]);

  // ── Pointer → scene coordinates ──────────────────────────────────────────
  const toScene = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const cssX = ((clientX - rect.left) / rect.width) * scene.width;
      const cssY = ((clientY - rect.top) / rect.height) * scene.height;
      return { x: (cssX - view.panX) / view.zoom, y: (cssY - view.panY) / view.zoom };
    },
    [scene.width, scene.height, view]
  );

  const handleMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragRef.current) {
        const d = dragRef.current;
        setView(v => ({ ...v, panX: d.panX + (e.clientX - d.x), panY: d.panY + (e.clientY - d.y) }));
        return;
      }
      const p = toScene(e.clientX, e.clientY);
      if (!p) return;
      const hit = hitTest(scene, p.x, p.y);
      if (!hit) {
        setHover(h => (h ? null : h));
        return;
      }
      setHover({
        hit,
        x: hit.anchorX * view.zoom + view.panX,
        y: hit.anchorY * view.zoom + view.panY,
      });
    },
    [scene, toScene, view]
  );

  // Wheel zoom anchored at the cursor, so the point under the pointer stays put.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const cx = ((e.clientX - rect.left) / rect.width) * scene.width;
      const cy = ((e.clientY - rect.top) / rect.height) * scene.height;

      setView(v => {
        const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, v.zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
        if (next === v.zoom) return v;
        const k = next / v.zoom;
        const panX = cx - (cx - v.panX) * k;
        const panY = cy - (cy - v.panY) * k;
        return next === 1
          ? IDENTITY_VIEW
          : { zoom: next, panX, panY };
      });
    };

    // Non-passive so preventDefault actually stops the page from scrolling.
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [scene.width, scene.height]);

  const startDrag = (e: React.PointerEvent) => {
    if (view.zoom <= 1) return;
    dragRef.current = { x: e.clientX, y: e.clientY, panX: view.panX, panY: view.panY };
    setDragging(true);
    setHover(null);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDragging(false);
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  };

  const resetView = () => setView(IDENTITY_VIEW);

  const zoomed = view.zoom > 1.001;

  return (
    <div ref={wrapRef} className="relative w-full">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={t.label_preview || 'Chart preview'}
        className={`w-full rounded-xl block touch-none ${
          dragging ? 'cursor-grabbing' : zoomed ? 'cursor-grab' : 'cursor-crosshair'
        }`}
        style={{
          height: `${scene.height}px`,
          aspectRatio: `${scene.width} / ${scene.height}`,
          background: scene.background,
        }}
        onPointerMove={handleMove}
        onPointerLeave={() => { setHover(null); }}
        onPointerDown={startDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={resetView}
      />

      {empty && placeholder && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-amber-500/50">
          {placeholder}
        </div>
      )}

      {/* Tooltip. Nudged away from the edges so it never leaves the panel. */}
      {hover && !dragging && (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full px-3 py-2 rounded-xl bg-[#0a0804]/95 border border-amber-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-sm"
          style={{
            left: `${Math.min(Math.max(hover.x, 60), scene.width - 60)}px`,
            top: `${Math.max(hover.y - 10, 34)}px`,
          }}
        >
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: hover.hit.color }} />
            <span className="text-[11px] font-bold text-white">{hover.hit.label}</span>
          </div>
          <div className="text-[11px] text-amber-300 font-mono font-bold mt-0.5 whitespace-nowrap">
            {formatValue(hover.hit.value, 'thousands')}
          </div>
          <div className="text-[10px] text-gray-500 font-medium whitespace-nowrap">{hover.hit.seriesName}</div>
        </div>
      )}

      {zoomed && (
        <button
          onClick={resetView}
          className="absolute top-3 right-3 z-20 px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/10 text-[10px] font-black text-amber-300 hover:bg-black/80 transition-colors cursor-pointer"
        >
          {(t.btn_reset_zoom || 'Reset zoom')} · {view.zoom.toFixed(1)}×
        </button>
      )}
    </div>
  );
};

export default ChartCanvas;
