import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Crosshair, ImageDown, Loader2, Minus, Plus, Sparkles, Trash2, X } from 'lucide-react';
import { extractPalette, formatHex, type Rgb } from '../lib/color';

interface ImageStudioProps {
  t: any;
  file: File | null;
  from: string | null;
  onClear: () => void;
  onPick: (rgb: Rgb) => void;
  onPalette: (colors: Rgb[]) => void;
}

interface View {
  scale: number;
  x: number;
  y: number;
}

/** Tope del lienzo de muestreo. Por encima de esto una foto de 48 Mpx ocupa
 *  cientos de MB en ImageData sin que el color del píxel cambie en nada. */
const SAMPLE_MAX = 4096;

export const ImageStudio: React.FC<ImageStudioProps> = ({
  t,
  file,
  from,
  onClear,
  onPick,
  onPalette,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceRef = useRef<HTMLCanvasElement | null>(null);
  const bitmapRef = useRef<ImageBitmap | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [view, setView] = useState<View>({ scale: 1, x: 0, y: 0 });
  const [hover, setHover] = useState<{ rgb: Rgb; x: number; y: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState(6);
  const [error, setError] = useState<string | null>(null);
  const drag = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean } | null>(null);

  // --- carga -----------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    if (!file) {
      bitmapRef.current?.close();
      bitmapRef.current = null;
      sourceRef.current = null;
      setSize(null);
      return;
    }
    setError(null);
    createImageBitmap(file)
      .then((bitmap) => {
        if (cancelled) {
          bitmap.close();
          return;
        }
        bitmapRef.current?.close();
        bitmapRef.current = bitmap;

        // Lienzo de muestreo a resolución (casi) nativa: la pipeta lee de aquí
        // y no del lienzo visible, para que el color no dependa del zoom.
        const scale = Math.min(1, SAMPLE_MAX / Math.max(bitmap.width, bitmap.height));
        const sw = Math.max(1, Math.round(bitmap.width * scale));
        const sh = Math.max(1, Math.round(bitmap.height * scale));
        const source = document.createElement('canvas');
        source.width = sw;
        source.height = sh;
        source.getContext('2d', { willReadFrequently: true })?.drawImage(bitmap, 0, 0, sw, sh);
        sourceRef.current = source;
        setSize({ w: sw, h: sh });
        setView({ scale: 1, x: 0, y: 0 });
      })
      .catch(() => {
        if (!cancelled) setError(t.image_error || 'This file could not be decoded as an image.');
      });
    return () => {
      cancelled = true;
    };
  }, [file, t.image_error]);

  // Al desmontar se cierra el bitmap: es memoria de GPU que el recolector de
  // basura no libera solo.
  useEffect(
    () => () => {
      bitmapRef.current?.close();
      bitmapRef.current = null;
    },
    []
  );

  // --- pintado ---------------------------------------------------------------
  // Síncrono, sin requestAnimationFrame: en una pestaña en segundo plano rAF no
  // dispara nunca, y al volver a ella el lienzo estaría en blanco.
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const source = sourceRef.current;
    if (!canvas || !source || !size) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#041313';
    ctx.fillRect(0, 0, w, h);

    const fit = Math.min(rect.width / size.w, rect.height / size.h);
    const scale = fit * view.scale * dpr;
    const dw = size.w * scale;
    const dh = size.h * scale;
    const ox = (w - dw) / 2 + view.x * dpr;
    const oy = (h - dh) / 2 + view.y * dpr;
    // A partir de 2× el usuario está mirando píxeles concretos: interpolar
    // los emborrona justo cuando quiere precisión.
    ctx.imageSmoothingEnabled = view.scale < 2;
    ctx.drawImage(source, ox, oy, dw, dh);
  }, [size, view]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const onResize = () => draw();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [draw]);

  // --- coordenadas -----------------------------------------------------------
  /** Punto del ratón → píxel de la imagen. Devuelve null fuera de la imagen. */
  const toImagePoint = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !size) return null;
      const rect = canvas.getBoundingClientRect();
      const fit = Math.min(rect.width / size.w, rect.height / size.h);
      const scale = fit * view.scale;
      const dw = size.w * scale;
      const dh = size.h * scale;
      const ox = (rect.width - dw) / 2 + view.x;
      const oy = (rect.height - dh) / 2 + view.y;
      const px = Math.floor((clientX - rect.left - ox) / scale);
      const py = Math.floor((clientY - rect.top - oy) / scale);
      if (px < 0 || py < 0 || px >= size.w || py >= size.h) return null;
      return { px, py };
    },
    [size, view]
  );

  const sample = useCallback((px: number, py: number): Rgb | null => {
    const source = sourceRef.current;
    if (!source) return null;
    const ctx = source.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    const d = ctx.getImageData(px, py, 1, 1).data;
    return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
  }, []);

  // --- interacción -----------------------------------------------------------
  // El listener de rueda se registra a mano con `passive: false`. React monta
  // `onWheel` como pasivo en la raíz, así que su preventDefault() no surte
  // efecto y la rueda hacía zoom Y desplazaba la página a la vez.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const cx = event.clientX - rect.left - rect.width / 2;
      const cy = event.clientY - rect.top - rect.height / 2;
      setView((prev) => {
        const next = Math.min(24, Math.max(1, prev.scale * (event.deltaY < 0 ? 1.18 : 1 / 1.18)));
        const k = next / prev.scale;
        // El zoom se ancla al cursor: el punto bajo el ratón no se mueve.
        return {
          scale: next,
          x: next === 1 ? 0 : cx - (cx - prev.x) * k,
          y: next === 1 ? 0 : cy - (cy - prev.y) * k,
        };
      });
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [size]);

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!size) return;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, vx: view.x, vy: view.y, moved: false };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = toImagePoint(event.clientX, event.clientY);
    if (point) {
      const rgb = sample(point.px, point.py);
      const rect = canvasRef.current!.getBoundingClientRect();
      if (rgb) setHover({ rgb, x: event.clientX - rect.left, y: event.clientY - rect.top });
    } else {
      setHover(null);
    }

    const d = drag.current;
    if (!d || !(event.buttons & 1)) return;
    const dx = event.clientX - d.x;
    const dy = event.clientY - d.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true;
    if (view.scale > 1) setView((prev) => ({ ...prev, x: d.vx + dx, y: d.vy + dy }));
  };

  const onPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    drag.current = null;
    // Un arrastre para encuadrar no debe además pipetear el píxel donde acabó.
    if (!d || d.moved) return;
    const point = toImagePoint(event.clientX, event.clientY);
    if (!point) return;
    const rgb = sample(point.px, point.py);
    if (rgb) onPick(rgb);
  };

  const runExtract = async () => {
    const bitmap = bitmapRef.current;
    if (!bitmap || busy) return;
    setBusy(true);
    setError(null);
    // Un fotograma de respiro para que el botón llegue a pintarse en su estado
    // de "trabajando" antes de que el k-means bloquee el hilo.
    await new Promise((resolve) => setTimeout(resolve, 16));
    try {
      const palette = extractPalette(bitmap, count);
      if (palette.length) onPalette(palette);
      else setError(t.image_error_pixels || 'No opaque pixels found in this image.');
    } catch {
      setError(t.image_error_pixels || 'No opaque pixels found in this image.');
    } finally {
      setBusy(false);
    }
  };

  if (!file) return null;

  return (
    <div className="rounded-2xl border border-white/5 bg-black/30 overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-white/5">
        <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-teal-400">
          <ImageDown className="w-3.5 h-3.5" />
          {t.image_title || 'Pick from an image'}
        </span>
        {from && (
          <span className="text-[10px] font-medium text-slate-500 truncate max-w-[14rem]">
            {(t.image_from || 'from {tool}').replace('{tool}', from)}
          </span>
        )}
        <span className="h-px flex-1 min-w-[1rem] bg-white/5" />
        <button
          onClick={onClear}
          title={t.image_close || 'Close the image'}
          className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 hover:bg-red-500/20 hover:border-red-500/30 text-slate-400 hover:text-red-300 flex items-center justify-center transition-colors cursor-pointer outline-none"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          className={`block w-full h-[300px] md:h-[360px] touch-none ${
            view.scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
          }`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={() => setHover(null)}
        />
        {hover && (
          <div
            className="pointer-events-none absolute z-10 flex items-center gap-2 px-2 py-1 rounded-lg bg-black/80 border border-white/10 backdrop-blur-sm -translate-x-1/2 -translate-y-[calc(100%+14px)]"
            style={{ left: hover.x, top: hover.y }}
          >
            <span
              className="w-4 h-4 rounded border border-white/20"
              style={{ backgroundColor: formatHex(hover.rgb) }}
            />
            <span className="font-mono text-[11px] text-white">{formatHex(hover.rgb)}</span>
          </div>
        )}
        <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 border border-white/10 text-[10px] font-mono text-slate-300">
          <Crosshair className="w-3 h-3 text-teal-400" />
          {view.scale.toFixed(1)}×
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-t border-white/5">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCount((c) => Math.max(2, c - 1))}
            className="w-7 h-7 rounded-lg bg-white/5 border border-white/5 hover:bg-teal-500/20 text-slate-300 flex items-center justify-center transition-colors cursor-pointer outline-none"
            aria-label={t.image_fewer || 'Fewer colors'}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-16 text-center font-mono text-xs text-white">
            {(t.image_count || '{n} colors').replace('{n}', String(count))}
          </span>
          <button
            onClick={() => setCount((c) => Math.min(8, c + 1))}
            className="w-7 h-7 rounded-lg bg-white/5 border border-white/5 hover:bg-teal-500/20 text-slate-300 flex items-center justify-center transition-colors cursor-pointer outline-none"
            aria-label={t.image_more || 'More colors'}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={runExtract}
          disabled={busy || !size}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-[#03211d] text-xs font-black transition-colors cursor-pointer outline-none"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {busy ? t.image_extracting || 'Extracting…' : t.image_extract || 'Extract palette'}
        </button>

        <span className="text-[11px] text-slate-500 flex-1 min-w-[12rem]">
          {t.image_hint || 'Click any pixel to take its colour. Scroll to zoom, drag to pan.'}
        </span>

        {error && (
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-red-400">
            <Trash2 className="w-3.5 h-3.5" />
            {error}
          </span>
        )}
      </div>
    </div>
  );
};
