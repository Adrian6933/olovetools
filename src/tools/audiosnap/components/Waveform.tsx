import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { sliceEnvelope } from '../lib/audio';
import type { PeakMip } from '../types';

interface View {
  from: number;
  to: number;
}

interface WaveformProps {
  mip: PeakMip;
  duration: number;
  inSec: number;
  outSec: number;
  playhead: number;
  view: View;
  height?: number;
  /** Draws the whole wave in grey — used while the "hear the original" button is held. */
  bypassed?: boolean;
  onViewChange: (view: View) => void;
  onSelectionChange: (inSec: number, outSec: number) => void;
  /** Fired once when a drag finishes, so the parent can push a single undo entry. */
  onCommit: () => void;
  onSeek: (sec: number) => void;
}

const HANDLE_HIT_PX = 11;
const MIN_SELECTION = 0.02;

type DragKind = 'in' | 'out' | 'pan' | 'select' | null;

/**
 * Waveform canvas with zoom, pan and draggable selection edges.
 *
 * It paints synchronously from a layout effect instead of inside
 * requestAnimationFrame. rAF never fires while the document is hidden, which
 * would leave the canvas blank at its default 300×150 for anyone who opens the
 * tool in a background tab and comes back to it.
 */
export const Waveform: React.FC<WaveformProps> = ({
  mip,
  duration,
  inSec,
  outSec,
  playhead,
  view,
  height = 200,
  bypassed = false,
  onViewChange,
  onSelectionChange,
  onCommit,
  onSeek,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ kind: DragKind; startX: number; startView: View; anchorSec: number; moved: boolean }>({
    kind: null,
    startX: 0,
    startView: view,
    anchorSec: 0,
    moved: false,
  });
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<'in' | 'out' | null>(null);

  const span = Math.max(1e-6, view.to - view.from);
  const secToX = useCallback((sec: number) => ((sec - view.from) / span) * width, [view.from, span, width]);
  const xToSec = useCallback((x: number) => view.from + (x / Math.max(1, width)) * span, [view.from, span, width]);

  // ------------------------------------------------------------------ paint
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    // Measured here rather than in a ResizeObserver callback: observers are
    // also silent on a hidden document, so the first paint after a background
    // load would otherwise use a stale width.
    const cssWidth = wrap.clientWidth;
    if (cssWidth !== width) setWidth(cssWidth);
    if (cssWidth <= 0) return;
    // Paint against the box we just measured, not the possibly stale state, so
    // the very first frame after a reflow is already the right size.

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(cssWidth * dpr);
    const pixelHeight = Math.round(height * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, height);

    const rulerHeight = 22;
    const waveTop = rulerHeight;
    const waveHeight = height - rulerHeight;
    const mid = waveTop + waveHeight / 2;

    // Backdrop
    ctx.fillStyle = '#0b0509';
    ctx.fillRect(0, 0, cssWidth, height);

    // Selection band
    const inX = secToX(inSec);
    const outX = secToX(outSec);
    ctx.fillStyle = 'rgba(244,63,94,0.09)';
    ctx.fillRect(inX, waveTop, Math.max(0, outX - inX), waveHeight);

    // Envelope
    const env = sliceEnvelope(mip, view.from, view.to, cssWidth);
    const scale = waveHeight / 2 - 6;

    for (let x = 0; x < cssWidth; x++) {
      const inside = x >= inX && x <= outX;
      const top = mid - Math.max(1, env.max[x] * scale);
      const bottom = mid - Math.min(-1, env.min[x] * scale);

      ctx.fillStyle = bypassed
        ? 'rgba(148,163,184,0.5)'
        : inside
          ? 'rgba(253,164,175,0.95)'
          : 'rgba(148,163,184,0.22)';
      ctx.fillRect(x, top, 1, Math.max(1, bottom - top));

      // Inner RMS body: reads as loudness at a glance, where the outer
      // envelope only shows the transient peaks.
      const rmsHeight = env.rms[x] * scale;
      if (rmsHeight > 1) {
        ctx.fillStyle = bypassed
          ? 'rgba(203,213,225,0.4)'
          : inside
            ? 'rgba(244,63,94,0.95)'
            : 'rgba(148,163,184,0.14)';
        ctx.fillRect(x, mid - rmsHeight, 1, rmsHeight * 2);
      }
    }

    // Zero line
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(0, mid, cssWidth, 1);

    // Ruler
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(0, 0, cssWidth, rulerHeight);
    const targetTicks = Math.max(2, Math.floor(cssWidth / 96));
    const rawStep = span / targetTicks;
    const niceSteps = [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
    const step = niceSteps.find(s => s >= rawStep) ?? 900;
    ctx.font = '10px ui-monospace, monospace';
    ctx.textBaseline = 'middle';
    for (let t = Math.ceil(view.from / step) * step; t <= view.to; t += step) {
      const x = secToX(t);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(Math.round(x), 0, 1, rulerHeight);
      ctx.fillStyle = 'rgba(148,163,184,0.75)';
      const label =
        step >= 1
          ? `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`
          : `${t.toFixed(2)}s`;
      ctx.fillText(label, Math.round(x) + 4, rulerHeight / 2);
    }

    // Selection edges
    for (const [x, active] of [
      [inX, hover === 'in'],
      [outX, hover === 'out'],
    ] as const) {
      if (x < -20 || x > cssWidth + 20) continue;
      ctx.fillStyle = active ? '#ffffff' : '#f43f5e';
      ctx.fillRect(Math.round(x) - 1, waveTop, 2, waveHeight);
      // Grip, drawn as plain rects: roundRect is still missing on older Safari.
      ctx.fillRect(Math.round(x) - 5, waveTop + 3, 10, 15);
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(Math.round(x) - 2, waveTop + 7, 1, 7);
      ctx.fillRect(Math.round(x) + 1, waveTop + 7, 1, 7);
    }

    // Playhead
    if (playhead >= view.from && playhead <= view.to) {
      const px = Math.round(secToX(playhead));
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.fillRect(px, waveTop, 1.5, waveHeight);
      ctx.beginPath();
      ctx.moveTo(px - 5, waveTop);
      ctx.lineTo(px + 5, waveTop);
      ctx.lineTo(px, waveTop + 7);
      ctx.closePath();
      ctx.fill();
    }
  }, [mip, view.from, view.to, span, inSec, outSec, playhead, width, height, hover, bypassed, secToX]);

  // The layout effect above only re-measures when something else already caused
  // a render, so a reflow on its own would leave a stretched bitmap. Two belts:
  // a ResizeObserver for container-only changes (a side panel appearing), and a
  // window listener because observers stay silent while the document is hidden.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const sync = () => {
      const next = wrap.clientWidth;
      setWidth(current => (current === next ? current : next));
    };

    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(sync);
      observer.observe(wrap);
    }
    window.addEventListener('resize', sync);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', sync);
    };
  }, []);

  // ----------------------------------------------------------------- pointer
  const clampView = useCallback(
    (from: number, to: number): View => {
      const minSpan = Math.max(0.01, duration / 5000);
      let nextSpan = Math.min(duration, Math.max(minSpan, to - from));
      let nextFrom = Math.min(Math.max(0, from), duration - nextSpan);
      return { from: nextFrom, to: nextFrom + nextSpan };
    },
    [duration]
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const sec = xToSec(x);
    event.currentTarget.setPointerCapture(event.pointerId);

    const nearIn = Math.abs(x - secToX(inSec)) <= HANDLE_HIT_PX;
    const nearOut = Math.abs(x - secToX(outSec)) <= HANDLE_HIT_PX;

    let kind: DragKind = 'select';
    if (event.button === 1 || event.shiftKey) kind = 'pan';
    else if (nearIn && (!nearOut || x < secToX(outSec))) kind = 'in';
    else if (nearOut) kind = 'out';

    dragRef.current = { kind, startX: x, startView: view, anchorSec: sec, moved: false };

    if (kind === 'select') {
      // Nothing changes yet: a plain click should seek, and only an actual drag
      // should redraw the selection.
      return;
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const drag = dragRef.current;

    if (!drag.kind) {
      const nearIn = Math.abs(x - secToX(inSec)) <= HANDLE_HIT_PX;
      const nearOut = Math.abs(x - secToX(outSec)) <= HANDLE_HIT_PX;
      setHover(nearIn ? 'in' : nearOut ? 'out' : null);
      return;
    }

    if (Math.abs(x - drag.startX) > 2) drag.moved = true;
    const sec = Math.min(duration, Math.max(0, xToSec(x)));

    if (drag.kind === 'in') {
      onSelectionChange(Math.min(sec, outSec - MIN_SELECTION), outSec);
    } else if (drag.kind === 'out') {
      onSelectionChange(inSec, Math.max(sec, inSec + MIN_SELECTION));
    } else if (drag.kind === 'pan') {
      const deltaSec = ((drag.startX - x) / Math.max(1, width)) * (drag.startView.to - drag.startView.from);
      onViewChange(clampView(drag.startView.from + deltaSec, drag.startView.to + deltaSec));
    } else if (drag.kind === 'select' && drag.moved) {
      const a = Math.min(drag.anchorSec, sec);
      const b = Math.max(drag.anchorSec, sec);
      if (b - a >= MIN_SELECTION) onSelectionChange(a, b);
    }
  };

  const endDrag = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag.kind) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (drag.kind === 'select' && !drag.moved) {
      onSeek(Math.min(duration, Math.max(0, drag.anchorSec)));
    } else if (drag.kind !== 'pan') {
      onCommit();
    }
    dragRef.current = { ...drag, kind: null, moved: false };
  };

  // Wheel is registered by hand with { passive: false }: React attaches wheel
  // listeners passively, so preventDefault inside onWheel is ignored and the
  // page scrolls away under the cursor while zooming.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;

      if (event.shiftKey) {
        const delta = (event.deltaY / Math.max(1, rect.width)) * span;
        onViewChange(clampView(view.from + delta, view.to + delta));
        return;
      }

      const cursorSec = view.from + (x / Math.max(1, rect.width)) * span;
      const factor = event.deltaY > 0 ? 1.18 : 1 / 1.18;
      const nextSpan = Math.min(duration, Math.max(Math.max(0.01, duration / 5000), span * factor));
      const ratio = (cursorSec - view.from) / span;
      onViewChange(clampView(cursorSec - ratio * nextSpan, cursorSec - ratio * nextSpan + nextSpan));
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [view.from, view.to, span, duration, clampView, onViewChange]);

  const cursor =
    hover || dragRef.current.kind === 'in' || dragRef.current.kind === 'out' ? 'ew-resize' : 'text';

  return (
    <div ref={wrapRef} className="relative w-full overflow-hidden rounded-2xl border border-white/10">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height, display: 'block', cursor, touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={() => !dragRef.current.kind && setHover(null)}
        onContextMenu={event => event.preventDefault()}
      />
    </div>
  );
};

export default Waveform;
