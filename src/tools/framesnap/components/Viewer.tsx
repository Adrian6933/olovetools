import React, { useCallback, useEffect, useRef, useState } from 'react';

// ============================================================================
// The player surface: zoom to the cursor, pan, and hold to compare.
// ----------------------------------------------------------------------------
// The wheel handler is attached with addEventListener and `passive: false`,
// not with React's onWheel: React registers wheel listeners as passive, so
// preventDefault inside onWheel does nothing and the page scrolls away under
// the zoom.
// ============================================================================

const MIN_ZOOM = 1;
const MAX_ZOOM = 12;

export interface ViewTransform {
  zoom: number;
  x: number;
  y: number;
}

export const IDENTITY: ViewTransform = { zoom: 1, x: 0, y: 0 };

interface ViewerProps {
  children: React.ReactNode;
  /** Shown on top while the compare gesture is held. */
  compareSrc?: string | null;
  comparing: boolean;
  onTransform?: (transform: ViewTransform) => void;
  className?: string;
}

export const Viewer: React.FC<ViewerProps> = ({ children, compareSrc, comparing, onTransform, className = '' }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<ViewTransform>(IDENTITY);
  const dragging = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);

  const apply = useCallback(
    (next: ViewTransform) => {
      setView(next);
      onTransform?.(next);
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
        // Keep the point under the cursor fixed: solve for the translation
        // that maps the same source pixel back to the same screen pixel.
        const ratio = zoom / current.zoom;
        const next: ViewTransform =
          zoom === MIN_ZOOM
            ? IDENTITY
            : { zoom, x: cx - (cx - current.x) * ratio, y: cy - (cy - current.y) * ratio };
        onTransform?.(next);
        return next;
      });
    };

    host.addEventListener('wheel', onWheel, { passive: false });
    return () => host.removeEventListener('wheel', onWheel);
  }, [onTransform]);

  const onPointerDown = (event: React.PointerEvent) => {
    if (view.zoom <= 1) return;
    (event.target as Element).setPointerCapture?.(event.pointerId);
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

  return (
    <div
      ref={hostRef}
      className={`relative overflow-hidden ${view.zoom > 1 ? 'cursor-grab active:cursor-grabbing' : ''} ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
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

      {view.zoom > 1 && (
        <span className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-1 font-mono text-[10px] font-bold text-orange-300">
          {view.zoom.toFixed(1)}×
        </span>
      )}
    </div>
  );
};

export default Viewer;
