import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import { drawFrame } from '../lib/frames';
import type { FitMode, Frame } from '../types';

interface StageProps {
  frames: Frame[];
  index: number;
  playing: boolean;
  width: number;
  height: number;
  fit: FitMode;
  background: string | null;
  /** The encoded GIF, once there is one. Shown on top until you hold to compare. */
  resultUrl: string | null;
  onIndexChange: (index: number) => void;
  /** ms the current frame should be held for, honouring per-frame overrides. */
  delayFor: (frame: Frame) => number;
  t: any;
}

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 16;

/**
 * The preview surface: plays the frames, zooms to the cursor, pans, and lets
 * you hold to see the true-colour source under the encoded GIF.
 *
 * Playback runs on `setTimeout` rather than `requestAnimationFrame` on purpose.
 * rAF stops entirely in a hidden tab, and every frame here is drawn
 * synchronously, so switching away and back leaves the canvas painted instead
 * of blank.
 */
export const Stage: React.FC<StageProps> = ({
  frames,
  index,
  playing,
  width,
  height,
  fit,
  background,
  resultUrl,
  onIndexChange,
  delayFor,
  t,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [comparing, setComparing] = useState(false);
  const [dragging, setDragging] = useState(false);

  const frame = frames[Math.min(index, frames.length - 1)];

  // --- Painting -------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !frame) return;
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return;
    drawFrame(context, frame.bitmap, { width, height, fit, background });
  }, [frame, width, height, fit, background]);

  // --- Playback -------------------------------------------------------------
  const indexRef = useRef(index);
  indexRef.current = index;

  useEffect(() => {
    if (!playing || frames.length < 2) return;
    let timer = 0;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const current = frames[indexRef.current] ?? frames[0];
      timer = window.setTimeout(() => {
        if (cancelled) return;
        onIndexChange((indexRef.current + 1) % frames.length);
        tick();
      }, Math.max(20, delayFor(current)));
    };

    tick();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [playing, frames, onIndexChange, delayFor]);

  // --- Zoom to the cursor ---------------------------------------------------
  // The live zoom is mirrored into a ref so the wheel handler and `applyZoom`
  // can read it without a nested `setZoom(prev => { setPan(...) })`: an updater
  // that touches other state runs twice under StrictMode and pans twice as far.
  const zoomRef = useRef(zoom);

  const applyZoom = useCallback((next: number, originX?: number, originY?: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    const cx = originX ?? rect.width / 2;
    const cy = originY ?? rect.height / 2;

    const previous = zoomRef.current;
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next));
    if (clamped === previous) return;

    const ratio = clamped / previous;
    zoomRef.current = clamped;
    setZoom(clamped);
    // Keep whatever sits under the cursor exactly where it is.
    setPan(p => ({ x: cx - (cx - p.x) * ratio, y: cy - (cy - p.y) * ratio }));
  }, []);

  // Registered by hand because React's onWheel is passive, and a passive
  // listener cannot stop the page from scrolling underneath the zoom.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const factor = Math.exp(-event.deltaY * 0.0015);
      applyZoom(zoomRef.current * factor, event.clientX - rect.left, event.clientY - rect.top);
    };
    viewport.addEventListener('wheel', onWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', onWheel);
  }, [applyZoom]);

  const reset = useCallback(() => {
    zoomRef.current = 1;
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // --- Pan ------------------------------------------------------------------
  /** Capture throws if the pointer is already gone; that is not worth an exception. */
  const capture = (event: React.PointerEvent) => {
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // The button was released before this handler ran. Nothing to capture.
    }
  };

  const onPointerDown = (event: React.PointerEvent) => {
    // Right button and Alt both mean "show me the source", the same inversion
    // gesture the drawing tools in the suite use.
    if (event.button === 2 || event.altKey) {
      setComparing(true);
      capture(event);
      return;
    }
    if (event.button !== 0) return;
    setDragging(true);
    capture(event);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!dragging) return;
    setPan(p => ({ x: p.x + event.movementX, y: p.y + event.movementY }));
  };

  const endPointer = () => {
    setDragging(false);
    setComparing(false);
  };

  const showResult = !!resultUrl && !comparing;

  return (
    <div className="space-y-2.5">
      <div
        ref={viewportRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onContextMenu={event => event.preventDefault()}
        className={`relative overflow-hidden rounded-2xl border border-white/10 bg-[repeating-conic-gradient(#161018_0%_25%,#0d090f_0%_50%)] bg-[length:20px_20px] h-[min(58vh,420px)] touch-none ${
          dragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}
        >
          <div className="relative" style={{ width, height }}>
            <canvas
              ref={canvasRef}
              className="block w-full h-full"
              style={{ imageRendering: zoom >= 2 ? 'pixelated' : 'auto' }}
            />
            {showResult && (
              <img
                src={resultUrl!}
                alt=""
                className="absolute inset-0 w-full h-full"
                style={{ imageRendering: zoom >= 2 ? 'pixelated' : 'auto' }}
              />
            )}
          </div>
        </div>

        {/* Badge naming what is actually on screen right now */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 border border-white/10 text-[10px] font-black uppercase tracking-widest text-fuchsia-300 pointer-events-none">
          {showResult ? t.stageResult || 'Encoded GIF' : t.stageSource || 'Source frame'}
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <StageButton onClick={() => applyZoom(zoom / 1.4)} label={t.zoomOut || 'Zoom out'}>
            <ZoomOut className="w-3.5 h-3.5" />
          </StageButton>
          <span className="px-2 py-1 rounded-lg bg-black/70 border border-white/10 text-[10px] font-mono font-bold text-slate-300 tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <StageButton onClick={() => applyZoom(zoom * 1.4)} label={t.zoomIn || 'Zoom in'}>
            <ZoomIn className="w-3.5 h-3.5" />
          </StageButton>
          <StageButton onClick={reset} label={t.zoomReset || 'Reset the view'}>
            <Maximize2 className="w-3.5 h-3.5" />
          </StageButton>
        </div>

        {frame && (
          <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 border border-white/10 text-[10px] font-mono font-bold text-slate-400 pointer-events-none">
            {index + 1}/{frames.length} · {frame.label}
          </div>
        )}
      </div>

      <p className="text-[10px] text-slate-600 font-medium text-center">
        {resultUrl
          ? t.stageHintCompare || 'Wheel zooms to the cursor, drag pans. Hold Alt or the right button to see the source under the GIF.'
          : t.stageHint || 'Wheel zooms to the cursor, drag pans.'}
      </p>
    </div>
  );
};

const StageButton: React.FC<{ onClick: () => void; label: string; children: React.ReactNode }> = ({
  onClick,
  label,
  children,
}) => (
  <button
    onClick={onClick}
    title={label}
    aria-label={label}
    className="p-1.5 rounded-lg bg-black/70 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
  >
    {children}
  </button>
);

export default Stage;
