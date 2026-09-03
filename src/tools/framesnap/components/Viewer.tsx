import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Maximize, Minus, Plus, Scan, Square } from 'lucide-react';

// ============================================================================
// The player surface: zoom to the cursor, pan, and hold to compare.
// ----------------------------------------------------------------------------
// The wheel handler is attached with addEventListener and `passive: false`,
// not with React's onWheel: React registers wheel listeners as passive, so
// preventDefault inside onWheel does nothing and the page scrolls away under
// the zoom.
//
// Mirar un fotograma de cerca no se hace sólo con la rueda: hay una barra con
// los mandos, un 1:1 que enseña el píxel real del vídeo (que es lo que importa
// para decidir si una captura está nítida) y un mapa que dice qué trozo se está
// viendo. Y el arrastre está limitado — antes se podía soltar la imagen fuera
// del marco y quedarte mirando un rectángulo negro sin forma de volver salvo
// el doble clic, que nadie sabía que existía.
// ============================================================================

const MIN_ZOOM = 1;
const MAX_ZOOM = 32;

export interface ViewTransform {
  zoom: number;
  x: number;
  y: number;
}

export const IDENTITY: ViewTransform = { zoom: 1, x: 0, y: 0 };

export interface ViewerLabels {
  zoomIn: string;
  zoomOut: string;
  reset: string;
  actual: string;
  fit: string;
}

const LABELS_FALLBACK: ViewerLabels = {
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  reset: 'Fit to the frame',
  actual: 'Actual pixels (1:1)',
  fit: 'Fill the view',
};

interface ViewerProps {
  children: React.ReactNode;
  /** Shown on top while the compare gesture is held. */
  compareSrc?: string | null;
  comparing: boolean;
  onTransform?: (transform: ViewTransform) => void;
  /** Tamaño real del vídeo, para poder ofrecer el 1:1. */
  natural?: { width: number; height: number } | null;
  labels?: Partial<ViewerLabels>;
  className?: string;
}

/**
 * Limita el desplazamiento para que el contenido no pueda salirse del marco.
 * A zoom Z el contenido mide Z veces el hueco, así que sobra (Z-1)/2 por lado.
 */
function clampPan(next: ViewTransform, host: HTMLElement | null): ViewTransform {
  if (!host || next.zoom <= 1) return next.zoom <= 1 ? IDENTITY : next;
  const maxX = ((next.zoom - 1) * host.clientWidth) / 2;
  const maxY = ((next.zoom - 1) * host.clientHeight) / 2;
  return {
    zoom: next.zoom,
    x: Math.max(-maxX, Math.min(maxX, next.x)),
    y: Math.max(-maxY, Math.min(maxY, next.y)),
  };
}

export const Viewer: React.FC<ViewerProps> = ({
  children,
  compareSrc,
  comparing,
  onTransform,
  natural,
  labels,
  className = '',
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<ViewTransform>(IDENTITY);
  const dragging = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const [hovering, setHovering] = useState(false);
  const txt = { ...LABELS_FALLBACK, ...(labels || {}) };

  const apply = useCallback(
    (next: ViewTransform) => {
      const clamped = clampPan(next, hostRef.current);
      setView(clamped);
      onTransform?.(clamped);
    },
    [onTransform]
  );

  /** Zoom manteniendo fijo un punto; sin punto, el centro del marco. */
  const zoomTo = useCallback(
    (target: number, anchor?: { x: number; y: number }) => {
      setView(current => {
        const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, target));
        if (zoom === current.zoom) return current;
        const cx = anchor?.x ?? 0;
        const cy = anchor?.y ?? 0;
        const ratio = zoom / current.zoom;
        const next =
          zoom === MIN_ZOOM
            ? IDENTITY
            : clampPan({ zoom, x: cx - (cx - current.x) * ratio, y: cy - (cy - current.y) * ratio }, hostRef.current);
        onTransform?.(next);
        return next;
      });
    },
    [onTransform]
  );

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey && Math.abs(event.deltaY) < 2) return;
      event.preventDefault();
      const rect = host.getBoundingClientRect();
      // Cursor position relative to the untransformed centre.
      const cx = event.clientX - rect.left - rect.width / 2;
      const cy = event.clientY - rect.top - rect.height / 2;
      setView(current => {
        const factor = Math.exp(-event.deltaY * 0.0015);
        const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current.zoom * factor));
        if (zoom === current.zoom) return current;
        const ratio = zoom / current.zoom;
        const next =
          zoom === MIN_ZOOM
            ? IDENTITY
            : clampPan({ zoom, x: cx - (cx - current.x) * ratio, y: cy - (cy - current.y) * ratio }, host);
        onTransform?.(next);
        return next;
      });
    };

    host.addEventListener('wheel', onWheel, { passive: false });
    return () => host.removeEventListener('wheel', onWheel);
  }, [onTransform]);

  // Teclado: +, - y 0, que es lo que espera cualquiera que haya usado un visor
  // de imágenes. Se ignora mientras se escribe en un campo.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.key === '+' || event.key === '=') { event.preventDefault(); zoomTo(view.zoom * 1.5); }
      else if (event.key === '-' || event.key === '_') { event.preventDefault(); zoomTo(view.zoom / 1.5); }
      else if (event.key === '0') { event.preventDefault(); apply(IDENTITY); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view.zoom, zoomTo, apply]);

  /**
   * Zoom al que un píxel del vídeo ocupa un píxel de pantalla. El vídeo se
   * pinta con object-contain, así que la escala en reposo es la del lado que
   * limita, y el 1:1 es su inverso.
   */
  const zoom1to1 = useMemo(() => {
    const host = hostRef.current;
    if (!host || !natural?.width || !natural?.height) return null;
    const encaje = Math.min(host.clientWidth / natural.width, host.clientHeight / natural.height);
    if (!Number.isFinite(encaje) || encaje <= 0) return null;
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, 1 / encaje));
  }, [natural, view.zoom]);

  const onPointerDown = (event: React.PointerEvent) => {
    if (view.zoom <= 1) return;
    // Capturar el puntero puede lanzar (NotFoundError) si ese id ya no está
    // activo. Sin proteger, la excepción cortaba el manejador antes de guardar
    // el estado y el arrastre dejaba de funcionar sin decir nada.
    try {
      (event.target as Element).setPointerCapture?.(event.pointerId);
    } catch { /* se arrastra igual sin captura */ }
    dragging.current = { x: event.clientX, y: event.clientY, startX: view.x, startY: view.y };
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const drag = dragging.current;
    if (!drag) return;
    apply({ zoom: view.zoom, x: drag.startX + (event.clientX - drag.x), y: drag.startY + (event.clientY - drag.y) });
  };

  const endDrag = () => {
    dragging.current = null;
  };

  const zoomed = view.zoom > 1;
  // El recuadro del mapa: qué fracción del contenido se ve y dónde.
  const vista = {
    ancho: `${100 / view.zoom}%`,
    alto: `${100 / view.zoom}%`,
    izq: `${50 - (view.x / (view.zoom * (hostRef.current?.clientWidth || 1))) * 100 - 50 / view.zoom}%`,
    arriba: `${50 - (view.y / (view.zoom * (hostRef.current?.clientHeight || 1))) * 100 - 50 / view.zoom}%`,
  };

  const boton =
    'flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-black/60 text-slate-200 transition-colors hover:border-orange-500/40 hover:bg-orange-500/20 hover:text-orange-200 disabled:cursor-not-allowed disabled:opacity-35 cursor-pointer';

  return (
    <div
      ref={hostRef}
      className={`relative overflow-hidden ${zoomed ? 'cursor-grab active:cursor-grabbing' : ''} ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onDoubleClick={() => apply(IDENTITY)}
    >
      <div
        className="h-full w-full origin-center"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`, transition: dragging.current ? 'none' : 'transform 90ms linear' }}
      >
        {children}
      </div>

      {comparing && compareSrc && (
        <img
          src={compareSrc}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}
        />
      )}

      {/* Los mandos aparecen al pasar por encima y se quedan mientras haya zoom:
          si sólo salieran con zoom, no habría forma de empezar a ampliar sin
          rueda, que es justo lo que falta en un portátil sin ratón. */}
      {(hovering || zoomed) && (
        <div className="pointer-events-auto absolute bottom-2 left-2 flex items-center gap-1 rounded-lg border border-white/10 bg-black/75 p-1 backdrop-blur-sm">
          <button type="button" className={boton} onClick={() => zoomTo(view.zoom / 1.5)} disabled={view.zoom <= MIN_ZOOM} title={txt.zoomOut} aria-label={txt.zoomOut}>
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[3.25rem] text-center font-mono text-[11px] font-bold text-orange-300">
            {view.zoom < 10 ? view.zoom.toFixed(1) : Math.round(view.zoom)}×
          </span>
          <button type="button" className={boton} onClick={() => zoomTo(view.zoom * 1.5)} disabled={view.zoom >= MAX_ZOOM} title={txt.zoomIn} aria-label={txt.zoomIn}>
            <Plus className="h-3.5 w-3.5" />
          </button>
          <span className="mx-0.5 h-4 w-px bg-white/10" />
          <button type="button" className={boton} onClick={() => apply(IDENTITY)} disabled={!zoomed} title={txt.reset} aria-label={txt.reset}>
            <Square className="h-3.5 w-3.5" />
          </button>
          {zoom1to1 && (
            <button type="button" className={boton} onClick={() => zoomTo(zoom1to1)} title={txt.actual} aria-label={txt.actual}>
              <Scan className="h-3.5 w-3.5" />
            </button>
          )}
          <button type="button" className={boton} onClick={() => zoomTo(Math.min(MAX_ZOOM, view.zoom * 4))} title={txt.fit} aria-label={txt.fit}>
            <Maximize className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Mapa: sin él, con mucho zoom se pierde por completo de qué parte del
          fotograma se está mirando. */}
      {zoomed && (
        <div className="pointer-events-none absolute right-2 top-2 h-14 w-24 overflow-hidden rounded-md border border-white/15 bg-black/70">
          <div
            className="absolute rounded-sm border-2 border-orange-400/90 bg-orange-400/10"
            style={{ width: vista.ancho, height: vista.alto, left: vista.izq, top: vista.arriba }}
          />
        </div>
      )}
    </div>
  );
};

export default Viewer;
