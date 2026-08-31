// ============================================================================
// El lienzo de trabajo
// ----------------------------------------------------------------------------
// La versión anterior mostraba la imagen con `max-w-full h-auto` y punto: con
// una foto de 1920 px encajada en 800, cada trazo del pincel se hacía a menos
// de la mitad de precisión y era imposible acercarse a una marca pequeña. Aquí
// hay zoom al cursor y desplazamiento, y lo que se pinta se convierte a
// coordenadas de imagen, así que la máscara siempre está a resolución completa.
//
// Todo el dibujado es SÍNCRONO. Pintar dentro de un requestAnimationFrame deja
// el lienzo en blanco cuando la pestaña no está visible, y volver a una
// pestaña en segundo plano con la imagen desaparecida es un fallo real, no
// sólo una molestia al depurar.
// ============================================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Hand, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import type { Tool } from '../lib/types';

interface EditorStageProps {
  work: React.RefObject<HTMLCanvasElement | null>;
  mask: React.RefObject<HTMLCanvasElement | null>;
  original: React.RefObject<HTMLCanvasElement | null>;
  /** Cambia con cada modificación de píxeles o máscara: obliga a repintar. */
  version: number;
  tool: Tool;
  brushSize: number;
  busy: boolean;
  progress: number;
  onMaskChanged: () => void;
  t: any;
}

const MIN_ZOOM = 0.05;
const MAX_ZOOM = 32;
const MASK_COLOR = 'rgba(139,92,246,1)';

export const EditorStage: React.FC<EditorStageProps> = ({
  work, mask, original, version, tool, brushSize, busy, progress, onMaskChanged, t,
}) => {
  const frame = useRef<HTMLDivElement>(null);
  const view = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [fitted, setFitted] = useState(true);
  const [showOriginal, setShowOriginal] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  const painting = useRef(false);
  const panning = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const shape = useRef<{ x0: number; y0: number; x1: number; y1: number } | null>(null);

  // --- Encaje ---------------------------------------------------------------

  const fit = useCallback(() => {
    const box = frame.current;
    const canvas = work.current;
    if (!box || !canvas) return;
    const rect = box.getBoundingClientRect();
    const scale = Math.min(rect.width / canvas.width, rect.height / canvas.height);
    setZoom(scale > 0 ? scale : 1);
    setPan({ x: 0, y: 0 });
    setFitted(true);
  }, [work]);

  // Sólo al montar. El padre remonta con `key` cuando entra otra imagen, que
  // es más fiable que depender de `work.current`: un ref no dispara efectos.
  useEffect(() => { fit(); }, [fit]);

  // --- Dibujado -------------------------------------------------------------

  const draw = useCallback(() => {
    const box = frame.current;
    const canvas = view.current;
    const source = showOriginal ? original.current : work.current;
    if (!box || !canvas || !source) return;

    const rect = box.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cssWidth = Math.max(1, Math.round(rect.width));
    const cssHeight = Math.max(1, Math.round(rect.height));
    if (canvas.width !== cssWidth * dpr || canvas.height !== cssHeight * dpr) {
      canvas.width = cssWidth * dpr;
      canvas.height = cssHeight * dpr;
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const drawWidth = source.width * zoom;
    const drawHeight = source.height * zoom;
    const left = (cssWidth - drawWidth) / 2 + pan.x;
    const top = (cssHeight - drawHeight) / 2 + pan.y;

    // Cuadros de transparencia, para que se vea qué es imagen y qué es hueco.
    ctx.save();
    ctx.fillStyle = '#0c0612';
    ctx.fillRect(left, top, drawWidth, drawHeight);
    ctx.restore();

    ctx.imageSmoothingEnabled = zoom < 1;
    ctx.drawImage(source, left, top, drawWidth, drawHeight);

    if (!showOriginal && mask.current) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.imageSmoothingEnabled = zoom < 1;
      ctx.drawImage(mask.current, left, top, drawWidth, drawHeight);
      ctx.restore();
    }

    // Figura en curso (rectángulo o elipse), antes de soltar.
    const pending = shape.current;
    if (pending && !showOriginal) {
      ctx.save();
      ctx.strokeStyle = '#a78bfa';
      ctx.fillStyle = 'rgba(139,92,246,0.3)';
      ctx.lineWidth = 2;
      const x = left + Math.min(pending.x0, pending.x1) * zoom;
      const y = top + Math.min(pending.y0, pending.y1) * zoom;
      const w = Math.abs(pending.x1 - pending.x0) * zoom;
      const h = Math.abs(pending.y1 - pending.y0) * zoom;
      if (tool === 'rect') {
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
      } else {
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    // Anillo del pincel: sin él nadie sabe qué va a pintar hasta que lo pinta.
    if (cursor && (tool === 'brush' || tool === 'eraser') && !showOriginal && !busy) {
      ctx.save();
      ctx.strokeStyle = tool === 'eraser' ? '#f87171' : '#c4b5fd';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(left + cursor.x * zoom, top + cursor.y * zoom, (brushSize / 2) * zoom, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }, [zoom, pan, showOriginal, version, tool, brushSize, cursor, busy, work, mask, original]);

  useEffect(() => { draw(); }, [draw]);

  // El panel del navegador no dispara ResizeObserver con la pestaña oculta,
  // pero el evento `resize` de la ventana sí llega en un uso normal.
  useEffect(() => {
    const onResize = () => draw();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [draw]);

  // --- Coordenadas ----------------------------------------------------------

  const toImage = useCallback(
    (clientX: number, clientY: number) => {
      const box = frame.current;
      const canvas = work.current;
      if (!box || !canvas) return null;
      const rect = box.getBoundingClientRect();
      const drawWidth = canvas.width * zoom;
      const drawHeight = canvas.height * zoom;
      const left = rect.left + (rect.width - drawWidth) / 2 + pan.x;
      const top = rect.top + (rect.height - drawHeight) / 2 + pan.y;
      return { x: (clientX - left) / zoom, y: (clientY - top) / zoom };
    },
    [zoom, pan, work]
  );

  // --- Zoom -----------------------------------------------------------------

  const zoomAt = useCallback(
    (factor: number, clientX?: number, clientY?: number) => {
      const box = frame.current;
      setZoom(current => {
        const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, current * factor));
        if (box && clientX !== undefined && clientY !== undefined) {
          const rect = box.getBoundingClientRect();
          // El punto bajo el cursor se queda quieto: se mide desde el centro
          // del marco y se reescala la distancia.
          const cx = clientX - rect.left - rect.width / 2;
          const cy = clientY - rect.top - rect.height / 2;
          const ratio = next / current;
          setPan(p => ({ x: cx - (cx - p.x) * ratio, y: cy - (cy - p.y) * ratio }));
        }
        return next;
      });
      setFitted(false);
    },
    []
  );

  // `onWheel` de React se registra pasivo: su preventDefault no hace nada y la
  // página se desplazaría bajo el zoom. Hay que engancharlo a mano.
  useEffect(() => {
    const box = frame.current;
    if (!box) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomAt(event.deltaY < 0 ? 1.15 : 1 / 1.15, event.clientX, event.clientY);
    };
    box.addEventListener('wheel', onWheel, { passive: false });
    return () => box.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  // --- Ver el original ------------------------------------------------------

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.code === 'Space') { event.preventDefault(); setShowOriginal(true); }
    };
    const up = (event: KeyboardEvent) => {
      if (event.code === 'Space') setShowOriginal(false);
    };
    const blur = () => setShowOriginal(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);

  // --- Pintado --------------------------------------------------------------

  const stroke = useCallback(
    (from: { x: number; y: number } | null, to: { x: number; y: number }) => {
      const canvas = mask.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d')!;
      ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.strokeStyle = MASK_COLOR;
      ctx.fillStyle = MASK_COLOR;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = brushSize;
      if (from) {
        // Un trazo, no puntos sueltos: moviendo rápido el ratón, pintar sólo
        // en cada evento deja la máscara llena de agujeros.
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(to.x, to.y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    },
    [tool, brushSize, mask]
  );

  const onPointerDown = (event: React.PointerEvent) => {
    if (busy) return;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    if (event.button === 2) { setShowOriginal(true); return; }

    const middle = event.button === 1;
    if (tool === 'pan' || middle) {
      panning.current = { x: event.clientX, y: event.clientY, px: pan.x, py: pan.y };
      return;
    }
    const point = toImage(event.clientX, event.clientY);
    if (!point) return;
    painting.current = true;
    if (tool === 'brush' || tool === 'eraser') {
      stroke(null, point);
      last.current = point;
      onMaskChanged();
    } else {
      shape.current = { x0: point.x, y0: point.y, x1: point.x, y1: point.y };
      draw();
    }
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const point = toImage(event.clientX, event.clientY);
    if (point) setCursor(point);

    const drag = panning.current;
    if (drag) {
      setPan({ x: drag.px + (event.clientX - drag.x), y: drag.py + (event.clientY - drag.y) });
      setFitted(false);
      return;
    }
    if (!painting.current || !point) return;
    if (tool === 'brush' || tool === 'eraser') {
      stroke(last.current, point);
      last.current = point;
      onMaskChanged();
    } else if (shape.current) {
      shape.current = { ...shape.current, x1: point.x, y1: point.y };
      draw();
    }
  };

  const commitShape = () => {
    const pending = shape.current;
    const canvas = mask.current;
    shape.current = null;
    if (!pending || !canvas) return;
    const x = Math.min(pending.x0, pending.x1);
    const y = Math.min(pending.y0, pending.y1);
    const w = Math.abs(pending.x1 - pending.x0);
    const h = Math.abs(pending.y1 - pending.y0);
    if (w < 2 || h < 2) return;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = MASK_COLOR;
    if (tool === 'rect') {
      ctx.fillRect(x, y, w, h);
    } else {
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    onMaskChanged();
  };

  const onPointerUp = (event: React.PointerEvent) => {
    if (event.button === 2) setShowOriginal(false);
    panning.current = null;
    if (painting.current) {
      painting.current = false;
      last.current = null;
      if (tool === 'rect' || tool === 'circle') commitShape();
    }
    draw();
  };

  const cursorStyle =
    tool === 'pan' ? 'grab' : busy ? 'progress' : 'none';

  return (
    <div className="space-y-3">
      <div
        ref={frame}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={e => { onPointerUp(e); setCursor(null); }}
        onContextMenu={e => e.preventDefault()}
        style={{ cursor: cursorStyle }}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c0612] h-[320px] sm:h-[420px] lg:h-[540px] touch-none select-none"
      >
        <canvas ref={view} className="block" />

        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 text-[10px] font-black uppercase tracking-widest text-slate-300 pointer-events-none">
          {showOriginal ? t.stageOriginal : t.stageCurrent}
        </span>

        {busy && (
          <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/50 pointer-events-none">
            <div className="h-full bg-violet-500 transition-[width] duration-200" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => zoomAt(1 / 1.4)} aria-label={t.zoomOut}
          className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer">
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="font-mono text-xs font-black text-slate-400 w-14 text-center tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <button type="button" onClick={() => zoomAt(1.4)} aria-label={t.zoomIn}
          className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button type="button" onClick={fit}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[11px] font-bold transition-colors cursor-pointer ${
            fitted ? 'bg-violet-500/20 border-violet-500/40 text-violet-200' : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
          }`}>
          <Maximize2 className="w-3.5 h-3.5" /> {t.fit}
        </button>
        <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 ml-auto">
          <Hand className="w-3.5 h-3.5" /> {t.stageHint}
        </span>
      </div>
    </div>
  );
};

export default EditorStage;
