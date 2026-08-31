import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Crosshair, Hand, Maximize2, Minus, Plus } from 'lucide-react';
import { rgbToHex, type RGB } from '../lib/color';
import { nearestSwatch, type Swatch } from '../lib/quantize';

// ============================================================================
// The canvas stage
// ----------------------------------------------------------------------------
// Zoom at the cursor, pan, an eyedropper with a real loupe, and a hold-to-
// compare that swaps the photo for the same photo rebuilt out of the current
// palette — which is the honest way to show whether the palette is any good.
//
// Painting is synchronous, never inside requestAnimationFrame. rAF is frozen
// in background tabs, so a rAF-driven canvas comes back blank (and stuck at the
// default 300x150) when the user returns to the tab.
// ============================================================================

export type StageMode = 'pan' | 'pick';

interface ImageStageProps {
  bitmap: ImageBitmap | null;
  palette: Swatch[];
  mode: StageMode;
  onPick: (color: RGB) => void;
  /** Alt / right click: the inverse gesture — drop the swatch nearest the
   *  colour under the cursor instead of adding one. */
  onUnpick: (color: RGB) => void;
  t: any;
}

interface View {
  scale: number;
  x: number;
  y: number;
}

const MIN_SCALE = 0.05;
const MAX_SCALE = 32;
/** Full-resolution sampling canvas is capped here; past this the readback cost
 *  outweighs any precision a person can see through a 9x loupe. */
const SAMPLE_CAP = 4096;
/** The recoloured preview is rebuilt per palette change, so it is capped low. */
const PREVIEW_CAP = 1400;

export const ImageStage: React.FC<ImageStageProps> = ({
  bitmap,
  palette,
  mode,
  onPick,
  onUnpick,
  t,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sampleRef = useRef<HTMLCanvasElement | null>(null);
  const sampleScaleRef = useRef(1);
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const previewKeyRef = useRef('');
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<View>({ scale: 1, x: 0, y: 0 });
  const [hover, setHover] = useState<{ color: RGB; sx: number; sy: number } | null>(null);
  const [showRecolored, setShowRecolored] = useState(false);
  const [comparing, setComparing] = useState(false);

  const paletteKey = useMemo(
    () => palette.map(s => `${s.r},${s.g},${s.b}`).join('|'),
    [palette]
  );

  // -------------------------------------------------------------------------
  // Container size. Measured directly rather than through ResizeObserver alone:
  // RO does not fire while the document is hidden, which leaves the canvas at
  // its previous size after a background resize.
  // -------------------------------------------------------------------------
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      setSize(prev =>
        Math.abs(prev.w - rect.width) < 1 && Math.abs(prev.h - rect.height) < 1
          ? prev
          : { w: rect.width, h: rect.height }
      );
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  // -------------------------------------------------------------------------
  // Sampling canvas: the source of truth for the eyedropper.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!bitmap) {
      sampleRef.current = null;
      return;
    }
    const scale = Math.min(SAMPLE_CAP / bitmap.width, SAMPLE_CAP / bitmap.height, 1);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    sampleRef.current = canvas;
    sampleScaleRef.current = scale;
    previewKeyRef.current = '';
  }, [bitmap]);

  // -------------------------------------------------------------------------
  // Fit on load / resize
  // -------------------------------------------------------------------------
  const fit = useCallback(() => {
    if (!bitmap || size.w === 0 || size.h === 0) return;
    const scale = Math.min(size.w / bitmap.width, size.h / bitmap.height) * 0.94;
    setView({
      scale,
      x: (size.w - bitmap.width * scale) / 2,
      y: (size.h - bitmap.height * scale) / 2,
    });
  }, [bitmap, size.w, size.h]);

  useEffect(() => {
    fit();
  }, [fit]);

  // -------------------------------------------------------------------------
  // Recoloured preview, built lazily and cached by palette signature
  // -------------------------------------------------------------------------
  const buildPreview = useCallback(() => {
    const sample = sampleRef.current;
    if (!sample || palette.length === 0) return null;
    if (previewKeyRef.current === paletteKey && previewRef.current) return previewRef.current;

    const scale = Math.min(PREVIEW_CAP / sample.width, PREVIEW_CAP / sample.height, 1);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(sample.width * scale));
    canvas.height = Math.max(1, Math.round(sample.height * scale));
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    ctx.drawImage(sample, 0, 0, canvas.width, canvas.height);
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = image.data;

    // A 32768-entry memo over the 5-bit colour cube: without it this is a
    // nearest-neighbour search per pixel and the preview takes seconds.
    const memo = new Int16Array(32768).fill(-1);

    for (let i = 0; i < data.length; i += 4) {
      const key = ((data[i] >> 3) << 10) | ((data[i + 1] >> 3) << 5) | (data[i + 2] >> 3);
      let idx = memo[key];
      if (idx < 0) {
        idx = nearestSwatch({ r: data[i], g: data[i + 1], b: data[i + 2] }, palette);
        memo[key] = idx;
      }
      data[i] = palette[idx].r;
      data[i + 1] = palette[idx].g;
      data[i + 2] = palette[idx].b;
    }

    ctx.putImageData(image, 0, 0);
    previewRef.current = canvas;
    previewKeyRef.current = paletteKey;
    return canvas;
  }, [palette, paletteKey]);

  // -------------------------------------------------------------------------
  // Paint
  // -------------------------------------------------------------------------
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.w === 0 || size.h === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(size.w * dpr);
    const h = Math.round(size.h * dpr);
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.w, size.h);
    if (!bitmap) return;

    // Holding the compare control flips whichever view is active, so it works
    // in both directions: peek at the palette build, or peek back at the photo.
    const wantRecolored = comparing ? !showRecolored : showRecolored;
    const preview = wantRecolored ? buildPreview() : null;

    ctx.imageSmoothingEnabled = view.scale < 4;
    const src: CanvasImageSource = preview || bitmap;
    ctx.drawImage(src, view.x, view.y, bitmap.width * view.scale, bitmap.height * view.scale);
  }, [bitmap, size, view, showRecolored, comparing, buildPreview]);

  // -------------------------------------------------------------------------
  // Sampling
  // -------------------------------------------------------------------------
  const sampleAt = useCallback((clientX: number, clientY: number): RGB | null => {
    const canvas = canvasRef.current;
    const sample = sampleRef.current;
    if (!canvas || !sample || !bitmap) return null;

    const rect = canvas.getBoundingClientRect();
    const imgX = (clientX - rect.left - view.x) / view.scale;
    const imgY = (clientY - rect.top - view.y) / view.scale;
    if (imgX < 0 || imgY < 0 || imgX >= bitmap.width || imgY >= bitmap.height) return null;

    const sx = Math.floor(imgX * sampleScaleRef.current);
    const sy = Math.floor(imgY * sampleScaleRef.current);
    const ctx = sample.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    // 3x3 mean rather than the single pixel under the cursor: on a photo the
    // exact pixel is usually sensor noise, and the neighbourhood is the colour
    // the person believes they are pointing at.
    const x0 = Math.max(0, sx - 1);
    const y0 = Math.max(0, sy - 1);
    const w = Math.min(3, sample.width - x0);
    const h = Math.min(3, sample.height - y0);
    const data = ctx.getImageData(x0, y0, w, h).data;

    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 8) continue;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      n++;
    }
    if (n === 0) return null;
    return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
  }, [bitmap, view]);

  // -------------------------------------------------------------------------
  // Pointer
  // -------------------------------------------------------------------------
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!bitmap) return;
    const panning = mode === 'pan' || e.button === 1 || e.shiftKey;
    if (panning) {
      dragRef.current = { x: e.clientX, y: e.clientY, ox: view.x, oy: view.y };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }
    if (e.button !== 0) return;
    const color = sampleAt(e.clientX, e.clientY);
    if (!color) return;
    if (e.altKey) onUnpick(color);
    else onPick(color);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (drag) {
      setView(v => ({ ...v, x: drag.ox + (e.clientX - drag.x), y: drag.oy + (e.clientY - drag.y) }));
      return;
    }
    if (mode !== 'pick') {
      if (hover) setHover(null);
      return;
    }
    const color = sampleAt(e.clientX, e.clientY);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!color || !rect) {
      setHover(null);
      return;
    }
    setHover({ color, sx: e.clientX - rect.left, sy: e.clientY - rect.top });
  };

  const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragRef.current) {
      dragRef.current = null;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Pointer already released (the browser does this on its own when the
        // pointer leaves the window during a drag).
      }
    }
  };

  const onContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'pick' || !bitmap) return;
    e.preventDefault();
    const color = sampleAt(e.clientX, e.clientY);
    if (color) onUnpick(color);
  };

  // Wheel zoom is bound manually: React's onWheel is passive, so it cannot
  // preventDefault and the page scrolls behind the zoom.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      if (!bitmap) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      setView(v => {
        const factor = Math.exp(-e.deltaY * 0.0015);
        const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, v.scale * factor));
        const k = scale / v.scale;
        // Keep the image point under the cursor pinned to the cursor.
        return { scale, x: px - (px - v.x) * k, y: py - (py - v.y) * k };
      });
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [bitmap]);

  const zoomBy = (factor: number) => {
    setView(v => {
      const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, v.scale * factor));
      const k = scale / v.scale;
      const cx = size.w / 2;
      const cy = size.h / 2;
      return { scale, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k };
    });
  };

  const hoverHex = hover ? rgbToHex(hover.color.r, hover.color.g, hover.color.b) : '';

  return (
    <div className="relative w-full">
      <div
        ref={wrapRef}
        className="relative w-full h-[300px] sm:h-[380px] lg:h-[520px] rounded-2xl overflow-hidden border border-white/5 bg-[#08010400] bg-[linear-gradient(45deg,#160509_25%,transparent_25%),linear-gradient(-45deg,#160509_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#160509_75%),linear-gradient(-45deg,transparent_75%,#160509_75%)] bg-[length:22px_22px] bg-[position:0_0,0_11px,11px_-11px,-11px_0]"
      >
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full touch-none ${
            mode === 'pick' ? 'cursor-crosshair' : dragRef.current ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ width: '100%', height: '100%' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={() => setHover(null)}
          onContextMenu={onContextMenu}
        />

        {/* Loupe */}
        {hover && (
          <div
            className="pointer-events-none absolute z-20 flex items-center gap-2 px-2.5 py-2 rounded-xl bg-black/85 border border-white/15 backdrop-blur shadow-2xl"
            style={{
              left: Math.min(Math.max(hover.sx + 18, 8), Math.max(8, size.w - 168)),
              top: Math.min(Math.max(hover.sy - 46, 8), Math.max(8, size.h - 56)),
            }}
          >
            <span
              className="w-9 h-9 rounded-lg border border-white/20 shrink-0"
              style={{ backgroundColor: hoverHex }}
            />
            <span className="font-mono text-[13px] font-black text-white tracking-wide">{hoverHex}</span>
          </div>
        )}

        {/* Zoom controls */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 p-1 rounded-xl bg-black/70 border border-white/10 backdrop-blur">
          <button
            onClick={() => zoomBy(1 / 1.4)}
            aria-label={t.zoomOut || 'Zoom out'}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-black text-slate-400 tabular-nums w-12 text-center">
            {Math.round(view.scale * 100)}%
          </span>
          <button
            onClick={() => zoomBy(1.4)}
            aria-label={t.zoomIn || 'Zoom in'}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={fit}
            aria-label={t.zoomFit || 'Fit to view'}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Mode hint */}
        <div className="absolute top-3 left-3 px-2.5 py-1.5 rounded-lg bg-black/70 backdrop-blur border border-white/10 text-[10px] font-black uppercase tracking-widest text-rose-300 flex items-center gap-1.5">
          {mode === 'pick' ? <Crosshair className="w-3 h-3" /> : <Hand className="w-3 h-3" />}
          {mode === 'pick' ? t.modePick || 'Eyedropper' : t.modePan || 'Pan'}
        </div>

        {(showRecolored || comparing) && palette.length > 0 && (
          <div className="absolute top-3 right-3 px-2.5 py-1.5 rounded-lg bg-black/70 backdrop-blur border border-white/10 text-[10px] font-black uppercase tracking-widest text-rose-300">
            {(comparing ? !showRecolored : showRecolored)
              ? t.viewRecolored || 'Palette render'
              : t.viewOriginal || 'Original'}
          </div>
        )}
      </div>

      {/* Compare strip */}
      {palette.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowRecolored(v => !v)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              showRecolored
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {t.toggleRecolored || 'Rebuild image from palette'}
          </button>
          <button
            onPointerDown={() => setComparing(true)}
            onPointerUp={() => setComparing(false)}
            onPointerLeave={() => setComparing(false)}
            onBlur={() => setComparing(false)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer select-none"
          >
            {t.holdCompare || 'Hold to compare'}
          </button>
          <span className="text-[11px] text-slate-600 font-medium">
            {t.stageHint || 'Scroll to zoom · drag to pan · Alt-click removes the nearest swatch'}
          </span>
        </div>
      )}
    </div>
  );
};

export default ImageStage;
