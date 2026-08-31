import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { EditState, FitMode, Size } from '../types';
import { DropFrameArt } from './Illustrations';

// ============================================================================
// The visual editor.
//
// Nothing here is destructive: the source bitmap is drawn, never modified. The
// entire edit is the six numbers in `EditState` (ratio, mode, pan, zoom), which
// is also what makes undo cheap — the history holds those six numbers per step,
// not a copy of the bitmap.
// ============================================================================

export type BarFill = 'black' | 'white' | 'transparent' | 'blur';

interface RatioCanvasProps {
  source: { bitmap: CanvasImageSource; natural: Size } | null;
  edit: EditState;
  barFill: BarFill;
  /** Pan/zoom changes, coalesced by the caller into the history. */
  onEditChange: (next: EditState, commit: boolean) => void;
  t: any;
}

/** Geometry shared by the on-screen preview and the exported bitmap. */
export function placement(natural: Size, frame: Size, edit: EditState) {
  const scaleX = frame.w / natural.w;
  const scaleY = frame.h / natural.h;
  const base = edit.mode === 'cover' ? Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY);
  const s = base * edit.zoom;
  const dw = natural.w * s;
  const dh = natural.h * s;
  const slackX = Math.max(0, (dw - frame.w) / 2);
  const slackY = Math.max(0, (dh - frame.h) / 2);
  return {
    dw,
    dh,
    dx: (frame.w - dw) / 2 + edit.offsetX * slackX,
    dy: (frame.h - dh) / 2 + edit.offsetY * slackY,
    scale: s,
  };
}

/**
 * Paints one frame's worth of output into any 2D context. Shared by the preview
 * and by the exporter so what you download is what you saw.
 */
export function paintFrame(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  natural: Size,
  frame: Size,
  edit: EditState,
  barFill: BarFill,
  originX = 0,
  originY = 0
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(originX, originY, frame.w, frame.h);
  ctx.clip();

  if (barFill === 'blur' && edit.mode === 'contain') {
    // The trick Instagram uses for a portrait video on a square canvas: fill the
    // bars with an enlarged, blurred copy instead of a flat colour.
    const cover = placement(natural, frame, { ...edit, mode: 'cover', zoom: 1.16, offsetX: 0, offsetY: 0 });
    ctx.filter = 'blur(28px) brightness(0.7)';
    ctx.drawImage(source, originX + cover.dx, originY + cover.dy, cover.dw, cover.dh);
    ctx.filter = 'none';
  } else if (barFill !== 'transparent') {
    ctx.fillStyle = barFill === 'white' ? '#ffffff' : '#000000';
    ctx.fillRect(originX, originY, frame.w, frame.h);
  }
  // 'transparent' deliberately paints nothing: the export canvas starts empty,
  // and clearing here would wipe the chequerboard the preview draws underneath
  // to show that the bars really are transparent.

  const p = placement(natural, frame, edit);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, originX + p.dx, originY + p.dy, p.dw, p.dh);
  ctx.restore();
}

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

export const RatioCanvas: React.FC<RatioCanvasProps> = ({ source, edit, barFill, onEditChange, t }) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [box, setBox] = useState<Size>({ w: 0, h: 0 });
  /** Held-down state: show the untouched source instead of the framed result. */
  const [comparing, setComparing] = useState(false);
  /** Alt (or right button) temporarily flips cover ⇄ contain. */
  const [inverted, setInverted] = useState(false);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const effectiveMode: FitMode = inverted ? (edit.mode === 'cover' ? 'contain' : 'cover') : edit.mode;

  // -- measuring -------------------------------------------------------------
  // ResizeObserver alone is not enough: it never fires while the document is
  // hidden, which is the normal state in a headless/background tab, and the
  // canvas would keep whatever size it had at mount.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setBox(prev => (Math.abs(prev.w - r.width) < 0.5 && Math.abs(prev.h - r.height) < 0.5 ? prev : { w: r.width, h: r.height }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    const poll = window.setInterval(measure, 500);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      clearInterval(poll);
    };
  }, []);

  // -- painting --------------------------------------------------------------
  // Drawn straight from the effect body, with no requestAnimationFrame in
  // between: rAF is throttled to zero in a background tab, so a deferred paint
  // leaves a blank 300×150 canvas behind whenever the tab is not in front.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || box.w < 4 || box.h < 4) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cw = Math.round(box.w);
    const ch = Math.round(box.h);
    if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
    }
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);

    if (!source) return;

    const ratio = edit.ratioW / edit.ratioH;
    // The frame, laid out inside the available box with a little air.
    const avail = { w: cw - 24, h: ch - 24 };
    let fw = avail.w;
    let fh = fw / ratio;
    if (fh > avail.h) {
      fh = avail.h;
      fw = fh * ratio;
    }
    const fx = (cw - fw) / 2;
    const fy = (ch - fh) / 2;

    if (comparing) {
      // Untouched source, letterboxed into the same box, so the eye can compare
      // like for like without the frame moving underneath it.
      const s = Math.min(avail.w / source.natural.w, avail.h / source.natural.h);
      const dw = source.natural.w * s;
      const dh = source.natural.h * s;
      ctx.drawImage(source.bitmap, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      return;
    }

    // Chequerboard behind, so a transparent letterbox reads as transparent.
    if (barFill === 'transparent') {
      const tile = 10;
      ctx.fillStyle = '#12200a';
      ctx.fillRect(fx, fy, fw, fh);
      ctx.fillStyle = '#1c3010';
      for (let y = 0; y < fh; y += tile) {
        for (let x = 0; x < fw; x += tile) {
          if (((x / tile) | 0) % 2 === ((y / tile) | 0) % 2) {
            ctx.fillRect(fx + x, fy + y, Math.min(tile, fw - x), Math.min(tile, fh - y));
          }
        }
      }
    }

    paintFrame(ctx, source.bitmap, source.natural, { w: fw, h: fh }, { ...edit, mode: effectiveMode }, barFill, fx, fy);

    // Frame outline + rule-of-thirds guides
    ctx.strokeStyle = 'rgba(163,230,53,0.9)';
    ctx.lineWidth = 2;
    ctx.strokeRect(fx + 1, fy + 1, fw - 2, fh - 2);
    ctx.strokeStyle = 'rgba(217,249,157,0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < 3; i++) {
      ctx.moveTo(fx + (fw * i) / 3, fy);
      ctx.lineTo(fx + (fw * i) / 3, fy + fh);
      ctx.moveTo(fx, fy + (fh * i) / 3);
      ctx.lineTo(fx + fw, fy + (fh * i) / 3);
    }
    ctx.stroke();
  }, [source, edit, effectiveMode, barFill, box, comparing]);

  // -- interaction -----------------------------------------------------------
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!source) return;
      if (e.button === 2) return; // right button is the invert gesture
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = { x: e.clientX, y: e.clientY, ox: edit.offsetX, oy: edit.offsetY };
    },
    [source, edit.offsetX, edit.offsetY]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || !source) return;
      // 220px of travel walks the image from one extreme to the other; without a
      // divisor the pan is unusable on a large photo.
      const nx = clamp(drag.ox + (e.clientX - drag.x) / 220, -1, 1);
      const ny = clamp(drag.oy + (e.clientY - drag.y) / 220, -1, 1);
      onEditChange({ ...edit, offsetX: nx, offsetY: ny }, false);
    },
    [source, edit, onEditChange]
  );

  const endDrag = useCallback(() => {
    if (dragRef.current) {
      dragRef.current = null;
      onEditChange(edit, true);
    }
  }, [edit, onEditChange]);

  const onWheel = useCallback(
    (e: WheelEvent) => {
      if (!source) return;
      e.preventDefault();
      const factor = Math.exp(-e.deltaY / 400);
      const zoom = clamp(edit.zoom * factor, 1, 8);
      if (zoom === edit.zoom) return;

      // Zoom towards the cursor: keep whatever is under the pointer under it.
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      const growth = zoom / edit.zoom - 1;
      onEditChange(
        {
          ...edit,
          zoom,
          offsetX: clamp(edit.offsetX - px * growth * 2, -1, 1),
          offsetY: clamp(edit.offsetY - py * growth * 2, -1, 1),
        },
        false
      );
    },
    [source, edit, onEditChange]
  );

  // Attached by hand because React's onWheel is passive, and a passive listener
  // cannot preventDefault — the page would scroll while you zoom.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setInverted(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setInverted(false);
    };
    const blur = () => {
      setInverted(false);
      setComparing(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);

  return (
    <div className="relative w-full">
      <div
        ref={boxRef}
        data-testid="ratio-canvas-box"
        className={`relative w-full h-[300px] sm:h-[380px] lg:h-[460px] rounded-2xl bg-[#0a1303] border border-lime-500/15 overflow-hidden ${
          source ? 'cursor-grab active:cursor-grabbing touch-none' : ''
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onContextMenu={e => {
          if (!source) return;
          e.preventDefault();
          setInverted(v => !v);
        }}
      >
        <canvas ref={canvasRef} className="block" />

        {!source && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-lime-500/70 pointer-events-none">
            <DropFrameArt className="w-40 h-32" animated={!window.matchMedia('(prefers-reduced-motion: reduce)').matches} />
            <p className="text-xs font-bold text-lime-600/80 px-6 text-center max-w-[18rem] leading-relaxed">
              {t.canvasEmpty || 'Load an image to place it inside the frame. Nothing is uploaded, and nothing runs until you ask.'}
            </p>
          </div>
        )}

        {source && inverted && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-lime-500/20 border border-lime-500/40 text-[10px] font-black uppercase tracking-widest text-lime-300 pointer-events-none">
            {effectiveMode === 'cover' ? t.modeCover || 'Cover' : t.modeContain || 'Contain'}
          </span>
        )}
      </div>

      {source && (
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button
            type="button"
            onPointerDown={() => setComparing(true)}
            onPointerUp={() => setComparing(false)}
            onPointerLeave={() => setComparing(false)}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] font-bold text-slate-300 hover:text-lime-300 hover:border-lime-500/30 transition-all cursor-pointer select-none"
          >
            {t.holdCompare || 'Hold to see the original'}
          </button>
          <span className="text-[11px] text-slate-500 font-medium">
            {t.canvasHint || 'Drag to reposition · wheel to zoom · Alt or right-click flips cover/contain'}
          </span>
        </div>
      )}
    </div>
  );
};

export default RatioCanvas;
