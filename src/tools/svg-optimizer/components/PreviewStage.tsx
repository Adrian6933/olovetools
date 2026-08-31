import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Maximize, Minus, Plus } from 'lucide-react';
import { sanitizeForPreview } from '../lib/sanitize';
import { EmptyStageArt } from './Illustrations';

// ============================================================================
// The stage: zoom, pan, and hold-to-compare.
// ----------------------------------------------------------------------------
// Everything is a CSS transform on a wrapper div, deliberately: the SVG stays
// a live vector at every zoom level, so the preview shows what the optimizer
// actually produced rather than a resampled bitmap of it. No canvas, and no
// requestAnimationFrame — pointer events already arrive at the right rate, and
// rAF does not fire at all in a backgrounded tab.
// ============================================================================

export type Backdrop = 'checkered' | 'dark' | 'light' | 'cyan';

interface PreviewStageProps {
  original: string;
  optimized: string;
  backdrop: Backdrop;
  t: any;
}

const MIN_ZOOM = 0.05;
const MAX_ZOOM = 40;

const backdropStyle = (backdrop: Backdrop): React.CSSProperties => {
  switch (backdrop) {
    case 'checkered':
      return {
        backgroundImage: `
          linear-gradient(45deg, #12212b 25%, transparent 25%),
          linear-gradient(-45deg, #12212b 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #12212b 75%),
          linear-gradient(-45deg, transparent 75%, #12212b 75%)`,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        backgroundColor: '#070f14',
      };
    case 'light':
      return { backgroundColor: '#ffffff' };
    case 'dark':
      return { backgroundColor: '#000000' };
    case 'cyan':
      return { backgroundColor: '#042f2e' };
  }
};

export const PreviewStage: React.FC<PreviewStageProps> = ({
  original,
  optimized,
  backdrop,
  t,
}) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [comparing, setComparing] = useState(false);
  const [dragging, setDragging] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  // Sanitising is not cheap on a large file, and the result feeds
  // dangerouslySetInnerHTML, so it is memoised per source rather than per render.
  const safeOptimized = useMemo(() => sanitizeForPreview(optimized), [optimized]);
  const safeOriginal = useMemo(() => sanitizeForPreview(original), [original]);

  const shown = comparing ? safeOriginal : safeOptimized;

  const fit = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  // Reset the view whenever a different file is loaded, otherwise the new SVG
  // inherits a pan from the old one and appears to be missing.
  useEffect(fit, [original, fit]);

  const zoomBy = useCallback((factor: number, originX?: number, originY?: number) => {
    setZoom(current => {
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current * factor));
      const applied = next / current;
      if (applied === 1) return current;

      // Zoom at the cursor: keep whatever sits under the pointer stationary.
      if (originX !== undefined && originY !== undefined) {
        setOffset(o => ({
          x: originX - (originX - o.x) * applied,
          y: originY - (originY - o.y) * applied,
        }));
      }
      return next;
    });
  }, []);

  const onWheel = useCallback(
    (event: React.WheelEvent) => {
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect) return;
      const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
      zoomBy(factor, event.clientX - rect.left - rect.width / 2, event.clientY - rect.top - rect.height / 2);
    },
    [zoomBy]
  );

  // Wheel has to be bound natively: React's synthetic wheel listener is passive,
  // so preventDefault() there is ignored and the page scrolls behind the zoom.
  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const handler = (event: WheelEvent) => event.preventDefault();
    node.addEventListener('wheel', handler, { passive: false });
    return () => node.removeEventListener('wheel', handler);
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      // Right button, or Alt held: peek at the original for as long as it is down.
      if (event.button === 2 || event.altKey) {
        setComparing(true);
        return;
      }
      if (event.button !== 0) return;
      setDragging(true);
      dragStart.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
      (event.target as Element).setPointerCapture?.(event.pointerId);
    },
    [offset]
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!dragging) return;
      setOffset({
        x: dragStart.current.ox + (event.clientX - dragStart.current.x),
        y: dragStart.current.oy + (event.clientY - dragStart.current.y),
      });
    },
    [dragging]
  );

  const endPointer = useCallback(() => {
    setDragging(false);
    setComparing(false);
  }, []);

  // Alt released without a pointer event still has to drop the comparison.
  useEffect(() => {
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Alt') setComparing(false);
    };
    const onBlur = () => setComparing(false);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === '+' || event.key === '=') { zoomBy(1.25); event.preventDefault(); }
      else if (event.key === '-') { zoomBy(1 / 1.25); event.preventDefault(); }
      else if (event.key === '0') { fit(); event.preventDefault(); }
      else if (event.key.toLowerCase() === 'b') { setComparing(c => !c); event.preventDefault(); }
    },
    [zoomBy, fit]
  );

  const empty = !optimized.trim();

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar. flex-wrap, not a fixed row: at 375px a single row would put
          the zoom readout off-screen. */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-white/5">
        <button
          type="button"
          onClick={() => zoomBy(1 / 1.25)}
          className="w-8 h-8 grid place-items-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition-colors cursor-pointer"
          title={t.stage_zoom_out || 'Zoom out'}
          aria-label={t.stage_zoom_out || 'Zoom out'}
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="min-w-[3.5rem] text-center text-xs font-mono font-bold text-cyan-300 tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => zoomBy(1.25)}
          className="w-8 h-8 grid place-items-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition-colors cursor-pointer"
          title={t.stage_zoom_in || 'Zoom in'}
          aria-label={t.stage_zoom_in || 'Zoom in'}
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={fit}
          className="h-8 px-2.5 inline-flex items-center gap-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-[11px] font-bold transition-colors cursor-pointer"
          title={t.stage_fit || 'Reset view'}
        >
          <Maximize className="w-3.5 h-3.5" />
          {t.stage_fit || 'Fit'}
        </button>

        <span className="flex-1 min-w-0" />

        <button
          type="button"
          onPointerDown={() => setComparing(true)}
          onPointerUp={() => setComparing(false)}
          onPointerLeave={() => setComparing(false)}
          disabled={empty}
          className={`h-8 px-3 inline-flex items-center gap-1.5 rounded-lg border text-[11px] font-bold transition-colors cursor-pointer select-none disabled:opacity-40 ${
            comparing
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
              : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
          }`}
          title={t.stage_compare_hint || 'Hold to see the original'}
        >
          <Eye className="w-3.5 h-3.5" />
          {comparing ? t.stage_showing_original || 'Original' : t.stage_compare || 'Hold to compare'}
        </button>
      </div>

      {/* Stage */}
      <div
        ref={stageRef}
        tabIndex={0}
        role="img"
        aria-label={t.stage_aria || 'Optimized SVG preview'}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onContextMenu={e => e.preventDefault()}
        onKeyDown={onKeyDown}
        className={`relative flex-1 min-h-[280px] md:min-h-[380px] overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 ${
          dragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={backdropStyle(backdrop)}
      >
        {empty ? (
          <div className="absolute inset-0 grid place-items-center text-cyan-500/40">
            <EmptyStageArt className="w-28 h-28" />
          </div>
        ) : (
          <div
            className="absolute inset-0 grid place-items-center"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
            }}
          >
            <div
              className="svgo-stage-art"
              // Sanitised above: scripts, event handlers and remote references
              // are gone before this string ever reaches the DOM.
              dangerouslySetInnerHTML={{ __html: shown.html }}
            />
          </div>
        )}

        {comparing && !empty && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-amber-500/25 border border-amber-400/40 text-[10px] font-black uppercase tracking-widest text-amber-100 pointer-events-none">
            {t.stage_showing_original || 'Original'}
          </div>
        )}

        {(shown.strippedScript || shown.strippedRemote) && !empty && (
          <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[10px] font-semibold text-amber-200 pointer-events-none">
            {shown.strippedRemote
              ? t.stage_stripped_remote || 'Remote references were blocked in this preview.'
              : t.stage_stripped_script || 'Executable content was blocked in this preview.'}
          </div>
        )}
      </div>

      <style>{`
        .svgo-stage-art svg { display: block; max-width: 300px; max-height: 300px; width: auto; height: auto; }
        @media (min-width: 768px) {
          .svgo-stage-art svg { max-width: 340px; max-height: 340px; }
        }
      `}</style>
    </div>
  );
};

export default PreviewStage;
