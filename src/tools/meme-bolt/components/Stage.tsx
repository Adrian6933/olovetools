import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Copy,
  Eye,
  Hand,
  Lock,
  Maximize2,
  Redo2,
  Trash2,
  Undo2,
  Unlock,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { Layer } from '../types';
import { canvasBox, layerSize, onStickerReady, renderToCanvas, type Backdrop } from '../lib/render';
import type { MemeDocApi } from '../lib/useMemeDoc';

// ============================================================================
// The stage
// ----------------------------------------------------------------------------
// The canvas is the ONLY renderer. The overlay on top of it draws selection
// chrome and nothing else — the old version painted every caption twice (once
// on the canvas, once as absolutely-positioned DOM at a different font size),
// which is why the preview showed a permanent ghost and never matched the PNG.
// ============================================================================

interface StageProps {
  api: MemeDocApi;
  backdrop: Backdrop;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  t: any;
}

type Gesture =
  | { mode: 'move'; id: string; startX: number; startY: number; layerX: number; layerY: number }
  | { mode: 'scale'; id: string; centreX: number; centreY: number; startDist: number; startSize: number; startBox: number }
  | { mode: 'rotate'; id: string; centreX: number; centreY: number; startAngle: number; startRotation: number }
  | { mode: 'pan'; startX: number; startY: number; panX: number; panY: number };

/** Pointer capture throws when the pointer is already gone (touch cancel, a
 *  synthetic event); losing capture is never a reason to abort the gesture. */
const capture = (event: React.PointerEvent) => {
  try {
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  } catch {
    /* the gesture still works, it just is not captured */
  }
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
/** Snap threshold for the centre guides, in canvas percent. */
const SNAP = 1.2;

export const Stage: React.FC<StageProps> = ({ api, backdrop, selectedId, onSelect, t }) => {
  const { doc } = api;
  const box = canvasBox(doc);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const movedRef = useRef(false);

  const [cssWidth, setCssWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [compare, setCompare] = useState(false);
  const [guides, setGuides] = useState({ x: false, y: false });
  const [, repaint] = useState(0);

  const selected = doc.layers.find(l => l.id === selectedId) || null;

  // --- measurement -------------------------------------------------------
  // Measured on every render as well as from the observer: ResizeObserver does
  // not fire in a hidden tab, and coming back to a background tab would
  // otherwise leave the canvas sized for the previous layout.
  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const width = el.clientWidth;
    if (width && Math.abs(width - cssWidth) > 0.5) setCssWidth(width);
  });

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => setCssWidth(el.clientWidth);
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  useEffect(() => onStickerReady(() => repaint(n => n + 1)), []);

  // --- painting ----------------------------------------------------------
  // Synchronous, never inside requestAnimationFrame: rAF is suspended while the
  // tab is hidden, and the canvas would come back blank at its default 300x150.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !cssWidth) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const target = cssWidth * zoom * dpr;
    const scale = Math.min(target, 4096) / box.width;
    renderToCanvas(canvas, doc, backdrop, scale, { backdropOnly: compare });
  });

  // --- coordinate helpers ------------------------------------------------
  const toCanvas = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / rect.width) * box.width,
        y: ((clientY - rect.top) / rect.height) * box.height,
      };
    },
    [box.width, box.height]
  );

  const hitTest = useCallback(
    (px: number, py: number): Layer | null => {
      for (let i = doc.layers.length - 1; i >= 0; i--) {
        const layer = doc.layers[i];
        if (layer.locked) continue;
        const size = layerSize(layer, box);
        const cx = (layer.x / 100) * box.width;
        const cy = (layer.y / 100) * box.height;
        const a = (-layer.rotation * Math.PI) / 180;
        const dx = px - cx;
        const dy = py - cy;
        const lx = dx * Math.cos(a) - dy * Math.sin(a);
        const ly = dx * Math.sin(a) + dy * Math.cos(a);
        const pad = Math.max(size.width, size.height) * 0.04;
        if (Math.abs(lx) <= size.width / 2 + pad && Math.abs(ly) <= size.height / 2 + pad) return layer;
      }
      return null;
    },
    [doc.layers, box]
  );

  // --- gestures ----------------------------------------------------------
  const startMove = (e: React.PointerEvent, layer: Layer) => {
    const point = toCanvas(e.clientX, e.clientY);
    gestureRef.current = {
      mode: 'move',
      id: layer.id,
      startX: point.x,
      startY: point.y,
      layerX: layer.x,
      layerY: layer.y,
    };
    api.begin();
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button === 2) return; // right button drives hold-to-compare
    capture(e);
    movedRef.current = false;

    const point = toCanvas(e.clientX, e.clientY);
    const hit = hitTest(point.x, point.y);

    if (e.button === 1 || (!hit && zoom > 1)) {
      gestureRef.current = { mode: 'pan', startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
      return;
    }

    if (!hit) {
      onSelect(null);
      gestureRef.current = null;
      return;
    }

    onSelect(hit.id);
    startMove(e, hit);
  };

  const onHandleDown = (e: React.PointerEvent, mode: 'scale' | 'rotate') => {
    e.stopPropagation();
    if (!selected) return;
    capture(e);

    const centreX = (selected.x / 100) * box.width;
    const centreY = (selected.y / 100) * box.height;
    const point = toCanvas(e.clientX, e.clientY);
    const dx = point.x - centreX;
    const dy = point.y - centreY;

    if (mode === 'scale') {
      gestureRef.current = {
        mode: 'scale',
        id: selected.id,
        centreX,
        centreY,
        startDist: Math.max(1, Math.hypot(dx, dy)),
        startSize: selected.kind === 'text' ? selected.fontSize : selected.size,
        startBox: selected.kind === 'text' ? selected.boxWidth : 0,
      };
    } else {
      gestureRef.current = {
        mode: 'rotate',
        id: selected.id,
        centreX,
        centreY,
        startAngle: (Math.atan2(dy, dx) * 180) / Math.PI,
        startRotation: selected.rotation,
      };
    }
    api.begin();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const gesture = gestureRef.current;
    if (!gesture) return;
    movedRef.current = true;

    if (gesture.mode === 'pan') {
      setPan({ x: gesture.panX + (e.clientX - gesture.startX), y: gesture.panY + (e.clientY - gesture.startY) });
      return;
    }

    const point = toCanvas(e.clientX, e.clientY);

    if (gesture.mode === 'move') {
      let x = gesture.layerX + ((point.x - gesture.startX) / box.width) * 100;
      let y = gesture.layerY + ((point.y - gesture.startY) / box.height) * 100;

      if (e.shiftKey) {
        // Axis lock: whichever way the pointer has travelled furthest wins.
        if (Math.abs(point.x - gesture.startX) > Math.abs(point.y - gesture.startY)) y = gesture.layerY;
        else x = gesture.layerX;
      }

      const snapX = Math.abs(x - 50) < SNAP;
      const snapY = Math.abs(y - 50) < SNAP;
      if (snapX) x = 50;
      if (snapY) y = 50;
      setGuides({ x: snapX, y: snapY });

      api.patchLayer(gesture.id, { x: clamp(x, -10, 110), y: clamp(y, -10, 110) }, true);
      return;
    }

    if (gesture.mode === 'scale') {
      const dist = Math.max(1, Math.hypot(point.x - gesture.centreX, point.y - gesture.centreY));
      const factor = dist / gesture.startDist;
      const layer = doc.layers.find(l => l.id === gesture.id);
      if (!layer) return;
      if (layer.kind === 'text') {
        api.patchLayer(
          gesture.id,
          {
            fontSize: clamp(gesture.startSize * factor, 1, 40),
            boxWidth: clamp(gesture.startBox * factor, 8, 100),
          } as Partial<Layer>,
          true
        );
      } else {
        api.patchLayer(gesture.id, { size: clamp(gesture.startSize * factor, 3, 160) } as Partial<Layer>, true);
      }
      return;
    }

    if (gesture.mode === 'rotate') {
      const angle = (Math.atan2(point.y - gesture.centreY, point.x - gesture.centreX) * 180) / Math.PI;
      let rotation = gesture.startRotation + (angle - gesture.startAngle);
      rotation = ((rotation + 540) % 360) - 180;
      if (e.shiftKey) rotation = Math.round(rotation / 15) * 15;
      api.patchLayer(gesture.id, { rotation: Math.round(rotation) }, true);
    }
  };

  const endGesture = (e: React.PointerEvent) => {
    if (gestureRef.current) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* the pointer may already be gone on touch cancel */
      }
      if (gestureRef.current.mode !== 'pan') api.commit();
      gestureRef.current = null;
    }
    setGuides({ x: false, y: false });
  };

  // --- zoom --------------------------------------------------------------
  const applyZoom = useCallback(
    (next: number, originClientX?: number, originClientY?: number) => {
      const viewport = viewportRef.current;
      const clamped = clamp(next, MIN_ZOOM, MAX_ZOOM);
      if (!viewport) {
        setZoom(clamped);
        return;
      }
      const rect = viewport.getBoundingClientRect();
      const ox = (originClientX ?? rect.left + rect.width / 2) - rect.left;
      const oy = (originClientY ?? rect.top + rect.height / 2) - rect.top;

      setPan(prev => {
        const ratio = clamped / zoom;
        const x = ox - (ox - prev.x) * ratio;
        const y = oy - (oy - prev.y) * ratio;
        return clamped === 1 ? { x: 0, y: 0 } : { x, y };
      });
      setZoom(clamped);
    },
    [zoom]
  );

  // Non-passive listener: React's onWheel is passive, so preventDefault there
  // is ignored and ctrl+wheel zooms the whole page instead of the meme.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      applyZoom(zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX, e.clientY);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [applyZoom, zoom]);

  const fit = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // --- selection chrome --------------------------------------------------
  const chrome = (() => {
    if (!selected) return null;
    const size = layerSize(selected, box);
    return {
      left: `${(selected.x / 100) * 100}%`,
      top: `${(selected.y / 100) * 100}%`,
      width: `${(size.width / box.width) * 100}%`,
      height: `${(size.height / box.height) * 100}%`,
      transform: `translate(-50%, -50%) rotate(${selected.rotation}deg)`,
    };
  })();

  const duplicate = () => {
    if (!selected) return;
    api.mutate(d => {
      const copy = { ...selected, id: `${selected.kind[0]}_${Date.now().toString(36)}`, x: selected.x + 4, y: selected.y + 4 } as Layer;
      return { ...d, layers: [...d.layers, copy] };
    });
    onSelect(null);
  };

  const remove = () => {
    if (!selected) return;
    api.mutate(d => ({ ...d, layers: d.layers.filter(l => l.id !== selected.id) }));
    onSelect(null);
  };

  const toggleLock = () => {
    if (!selected) return;
    api.patchLayer(selected.id, { locked: !selected.locked });
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-white/5 bg-black/30 px-2.5 py-2">
        <ToolButton onClick={api.undo} disabled={!api.canUndo} label={t.undo || 'Undo'} hint="Ctrl+Z">
          <Undo2 className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={api.redo} disabled={!api.canRedo} label={t.redo || 'Redo'} hint="Ctrl+Y">
          <Redo2 className="w-4 h-4" />
        </ToolButton>

        <span className="w-px h-5 bg-white/10 mx-1" />

        <ToolButton onClick={() => applyZoom(zoom / 1.25)} disabled={zoom <= MIN_ZOOM} label={t.zoomOut || 'Zoom out'}>
          <ZoomOut className="w-4 h-4" />
        </ToolButton>
        <span className="text-[10px] font-black tabular-nums text-slate-400 w-11 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <ToolButton onClick={() => applyZoom(zoom * 1.25)} disabled={zoom >= MAX_ZOOM} label={t.zoomIn || 'Zoom in'}>
          <ZoomIn className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={fit} disabled={zoom === 1 && pan.x === 0 && pan.y === 0} label={t.zoomFit || 'Fit'}>
          <Maximize2 className="w-4 h-4" />
        </ToolButton>

        <span className="w-px h-5 bg-white/10 mx-1" />

        <button
          onPointerDown={() => setCompare(true)}
          onPointerUp={() => setCompare(false)}
          onPointerLeave={() => setCompare(false)}
          title={t.compareHint || 'Hold to see the background without any layer'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer border ${
            compare
              ? 'bg-fuchsia-500 text-white border-fuchsia-400'
              : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          {t.compare || 'Compare'}
        </button>

        <span className="flex-1" />

        <ToolButton onClick={toggleLock} disabled={!selected} label={t.lockLayer || 'Lock layer'}>
          {selected?.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
        </ToolButton>
        <ToolButton onClick={duplicate} disabled={!selected} label={t.duplicate || 'Duplicate'} hint="Ctrl+D">
          <Copy className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={remove} disabled={!selected} label={t.deleteLayer || 'Delete'} hint="Del" danger>
          <Trash2 className="w-4 h-4" />
        </ToolButton>
      </div>

      {/* Canvas viewport */}
      <div
        ref={viewportRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endGesture}
        onPointerCancel={endGesture}
        onContextMenu={e => e.preventDefault()}
        onMouseDown={e => e.button === 2 && setCompare(true)}
        onMouseUp={e => e.button === 2 && setCompare(false)}
        style={{ aspectRatio: `${box.width} / ${box.height}` }}
        className={`relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22><rect width=%2224%22 height=%2224%22 fill=%22%230b0710%22/><rect width=%2212%22 height=%2212%22 fill=%22%23150e1f%22/><rect x=%2212%22 y=%2212%22 width=%2212%22 height=%2212%22 fill=%22%23150e1f%22/></svg>')] touch-none select-none ${
          zoom > 1 ? 'cursor-grab' : 'cursor-crosshair'
        }`}
      >
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{ width: cssWidth * zoom, transform: `translate(${pan.x}px, ${pan.y}px)` }}
        >
          <canvas ref={canvasRef} className="block w-full h-auto" />

          <div className="absolute inset-0 pointer-events-none">
            {guides.x && <div className="absolute left-1/2 top-0 bottom-0 w-px bg-fuchsia-400/70" />}
            {guides.y && <div className="absolute top-1/2 left-0 right-0 h-px bg-fuchsia-400/70" />}

            {chrome && selected && !compare && (
              <div
                className="absolute border border-dashed border-fuchsia-400/90 pointer-events-auto cursor-move"
                style={chrome}
                onPointerDown={e => {
                  e.stopPropagation();
                  if (selected.locked) return;
                  capture(e);
                  startMove(e, selected);
                }}
                onPointerMove={onPointerMove}
                onPointerUp={endGesture}
              >
                {!selected.locked && (
                  <>
                    <span
                      onPointerDown={e => onHandleDown(e, 'scale')}
                      onPointerMove={onPointerMove}
                      onPointerUp={endGesture}
                      title={t.handleScale || 'Drag to resize'}
                      className="absolute -right-2 -bottom-2 w-4 h-4 rounded-full bg-fuchsia-500 border-2 border-white shadow cursor-nwse-resize"
                    />
                    <span
                      onPointerDown={e => onHandleDown(e, 'scale')}
                      onPointerMove={onPointerMove}
                      onPointerUp={endGesture}
                      className="absolute -left-2 -bottom-2 w-4 h-4 rounded-full bg-fuchsia-500 border-2 border-white shadow cursor-nesw-resize"
                    />
                    <span
                      onPointerDown={e => onHandleDown(e, 'rotate')}
                      onPointerMove={onPointerMove}
                      onPointerUp={endGesture}
                      title={t.handleRotate || 'Drag to rotate · Shift snaps to 15°'}
                      className="absolute left-1/2 -top-7 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-fuchsia-500 shadow cursor-alias"
                    />
                    <span className="absolute left-1/2 -top-4 -translate-x-1/2 w-px h-4 bg-fuchsia-400/70" />
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {zoom > 1 && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-lg bg-black/70 px-2 py-1 text-[10px] font-bold text-slate-300 pointer-events-none">
            <Hand className="w-3 h-3 text-fuchsia-400" />
            {t.panHint || 'Drag the empty area to pan'}
          </div>
        )}
      </div>
    </div>
  );
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const ToolButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  label: string;
  hint?: string;
  danger?: boolean;
  children: React.ReactNode;
}> = ({ onClick, disabled, label, hint, danger, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={hint ? `${label} · ${hint}` : label}
    aria-label={label}
    className={`p-2 rounded-lg border transition-colors cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed ${
      danger
        ? 'border-white/10 bg-white/5 text-slate-400 hover:text-rose-300 hover:border-rose-500/40'
        : 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-fuchsia-500/40'
    }`}
  >
    {children}
  </button>
);

export default Stage;
