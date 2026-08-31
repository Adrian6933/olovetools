// ============================================================================
// El escenario de vista previa
// ----------------------------------------------------------------------------
// Dos <img> superpuestas con transformaciones CSS, a propósito: pintar esto en
// un canvas obligaría a repintar en cada rueda de ratón, y un canvas repintado
// dentro de un requestAnimationFrame se queda en blanco cuando la pestaña no
// está visible. Con imágenes y `transform` el navegador compone en la GPU y no
// hay nada que repintar.
//
// Zoom al cursor: el punto bajo el puntero es el que se queda quieto. Es lo
// que hace cualquier editor y lo que la gente espera sin pensarlo.
// ============================================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2, MoveHorizontal, ZoomIn, ZoomOut } from 'lucide-react';

interface PreviewStageProps {
  originalUrl: string;
  resultUrl: string | null;
  /** true mientras el resultado mostrado ya no corresponde a los ajustes. */
  stale: boolean;
  busy: boolean;
  t: any;
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 16;

export const PreviewStage: React.FC<PreviewStageProps> = ({ originalUrl, resultUrl, stale, busy, t }) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [fitted, setFitted] = useState(true);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [split, setSplit] = useState(50);
  const [holding, setHolding] = useState(false);
  const dragging = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  const reset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setFitted(true);
  }, []);

  useEffect(() => { reset(); }, [originalUrl, reset]);

  const applyZoom = useCallback((next: number, originX?: number, originY?: number) => {
    const frame = frameRef.current;
    setZoom(current => {
      const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next));
      if (frame && originX !== undefined && originY !== undefined) {
        const rect = frame.getBoundingClientRect();
        // El punto bajo el cursor, medido desde el centro del marco, tiene que
        // caer en el mismo sitio antes y después de escalar.
        const cx = originX - rect.left - rect.width / 2;
        const cy = originY - rect.top - rect.height / 2;
        const factor = clamped / current;
        setPan(p => ({ x: cx - (cx - p.x) * factor, y: cy - (cy - p.y) * factor }));
      }
      return clamped;
    });
    setFitted(false);
  }, []);

  // `onWheel` de React se registra pasivo, así que su preventDefault no hace
  // nada y la página seguiría desplazándose bajo el zoom. Hay que engancharlo
  // a mano con { passive: false }.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const step = event.deltaY < 0 ? 1.15 : 1 / 1.15;
      setZoom(current => {
        const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, current * step));
        const rect = frame.getBoundingClientRect();
        const cx = event.clientX - rect.left - rect.width / 2;
        const cy = event.clientY - rect.top - rect.height / 2;
        const factor = next / current;
        setPan(p => ({ x: cx - (cx - p.x) * factor, y: cy - (cy - p.y) * factor }));
        return next;
      });
      setFitted(false);
    };
    frame.addEventListener('wheel', onWheel, { passive: false });
    return () => frame.removeEventListener('wheel', onWheel);
  }, []);

  // Mantener pulsado = ver el original. Espacio y Alt hacen lo mismo; el clic
  // derecho también, porque es el gesto que ya existe en otros editores.
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.key === 'Alt') {
        if (event.code === 'Space') event.preventDefault();
        setHolding(true);
      }
    };
    const up = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.key === 'Alt') setHolding(false);
    };
    const blur = () => setHolding(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);

  const onPointerDown = (event: React.PointerEvent) => {
    if (event.button === 2) { setHolding(true); return; }
    dragging.current = { x: event.clientX, y: event.clientY, px: pan.x, py: pan.y };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const drag = dragging.current;
    if (!drag) return;
    setPan({ x: drag.px + (event.clientX - drag.x), y: drag.py + (event.clientY - drag.y) });
    setFitted(false);
  };

  const onPointerUp = (event: React.PointerEvent) => {
    dragging.current = null;
    if (event.button === 2) setHolding(false);
  };

  const showOriginal = holding || !resultUrl;
  const transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
  const sizing = fitted ? 'max-w-full max-h-full object-contain' : 'max-w-none';

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={frameRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onContextMenu={e => e.preventDefault()}
        className="relative overflow-hidden rounded-3xl border border-slate-800 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.04)_1px,_transparent_1px)] bg-[size:22px_22px] bg-slate-950/60 h-[300px] sm:h-[380px] lg:h-[460px] touch-none select-none cursor-grab active:cursor-grabbing"
      >
        {/* Capa inferior: el original, siempre presente. */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img src={originalUrl} alt="" draggable={false} style={{ transform }} className={`${sizing} pointer-events-none`} />
        </div>

        {/* Capa superior: el resultado, recortado por la cortina. */}
        {resultUrl && !showOriginal && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ clipPath: `inset(0 0 0 ${split}%)` }}
          >
            <img
              src={resultUrl}
              alt=""
              draggable={false}
              style={{ transform }}
              className={`${sizing} pointer-events-none ${stale ? 'opacity-60 saturate-50' : ''}`}
            />
          </div>
        )}

        {resultUrl && !showOriginal && split > 0 && split < 100 && (
          <div className="absolute inset-y-0 pointer-events-none" style={{ left: `${split}%` }}>
            <div className="w-px h-full bg-white/70 shadow-[0_0_12px_rgba(255,255,255,0.6)]" />
          </div>
        )}

        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 text-[10px] font-black uppercase tracking-widest text-slate-300 pointer-events-none">
          {showOriginal ? t.original : t.converted}
        </span>

        {busy && (
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
            <div className="w-9 h-9 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {stale && !busy && resultUrl && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-[10px] font-black uppercase tracking-widest text-amber-300 pointer-events-none">
            {t.stale}
          </span>
        )}
      </div>

      {/* Barra de mandos. flex-wrap porque a 375px no cabe en una línea. */}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => applyZoom(zoom / 1.4)} aria-label={t.zoomOut}
          className="p-2 rounded-lg bg-slate-800/70 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-colors cursor-pointer">
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="font-mono text-xs font-black text-slate-400 w-14 text-center tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <button type="button" onClick={() => applyZoom(zoom * 1.4)} aria-label={t.zoomIn}
          className="p-2 rounded-lg bg-slate-800/70 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-colors cursor-pointer">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button type="button" onClick={reset}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800/70 border border-slate-700 text-[11px] font-bold text-slate-300 hover:text-white hover:border-slate-500 transition-colors cursor-pointer">
          <Maximize2 className="w-3.5 h-3.5" /> {t.fit}
        </button>

        <label className="flex items-center gap-2 flex-1 min-w-[160px] px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <MoveHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="sr-only">{t.splitLabel}</span>
          <input type="range" min={0} max={100} value={split} disabled={!resultUrl}
            onChange={e => setSplit(parseInt(e.target.value, 10))}
            className="w-full accent-indigo-500 cursor-pointer disabled:opacity-30" />
        </label>
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed">{t.stageHint}</p>
    </div>
  );
};

export default PreviewStage;
