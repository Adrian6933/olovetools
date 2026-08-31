import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Eye, Maximize2, Minus, Plus, RotateCcw } from 'lucide-react';
import type { Layer, LogoAsset } from '../types';
import { layerBounds, renderComposite, type RenderStats } from '../lib/render';

// ============================================================================
// El visor: zoom al cursor, paneo, arrastre de la capa y comparación
// antes/después.
//
// Detalle importante: el canvas mide lo que mide el visor en pantalla, NO la
// resolución del original. La versión anterior creaba un canvas de 6000×4000
// (96 MB de búfer) y lo recreaba en cada tick de slider. Aquí el lienzo tiene
// el tamaño del hueco visible y todo el dibujo se hace bajo una transformación
// zoom/pan, así que el coste no depende del tamaño de la foto y el resultado en
// pantalla es idéntico píxel a píxel al que se exporta (mismo `renderComposite`).
// ============================================================================

interface StageProps {
  bitmap: ImageBitmap;
  /** Dimensiones REALES del original: el espacio de coordenadas lógico. */
  width: number;
  height: number;
  layers: Layer[];
  assets: Map<string, LogoAsset>;
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  /** El usuario arrastró la capa: posición normalizada 0..1. */
  onMoveLayer: (id: string, pos: { x: number; y: number }, commit: boolean) => void;
  /** Comparación forzada desde el panel de controles. */
  compare: boolean;
  /** Cambia cuando algo externo al estado obliga a repintar (fuentes ya cargadas). */
  redrawKey?: number;
  onStats?: (stats: RenderStats) => void;
  t: any;
}

const MIN_ZOOM = 0.05;
const MAX_ZOOM = 8;

export const Stage: React.FC<StageProps> = ({
  bitmap,
  width,
  height,
  layers,
  assets,
  selectedLayerId,
  onSelectLayer,
  onMoveLayer,
  compare,
  redrawKey = 0,
  onStats,
  t,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [view, setView] = useState({ zoom: 1, x: 0, y: 0 });
  const [fitted, setFitted] = useState(false);
  const [peek, setPeek] = useState(false);
  const [cursor, setCursor] = useState<'grab' | 'grabbing' | 'move' | 'default'>('default');

  // Refs de gesto: no deben provocar re-render en cada movimiento del ratón.
  const gesture = useRef<{
    mode: 'none' | 'pan' | 'drag';
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    layerId: string | null;
    grabOffset: { x: number; y: number };
    moved: boolean;
    lastPos: { x: number; y: number };
  }>({
    mode: 'none',
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    layerId: null,
    grabOffset: { x: 0, y: 0 },
    moved: false,
    lastPos: { x: 0.5, y: 0.5 },
  });

  const viewRef = useRef(view);
  viewRef.current = view;

  // -------------------------------------------------------------------------
  // Encaje
  // -------------------------------------------------------------------------
  const fit = useCallback(() => {
    const box = containerRef.current?.getBoundingClientRect();
    if (!box || box.width < 2 || box.height < 2) return;
    const pad = 24;
    const zoom = Math.min((box.width - pad * 2) / width, (box.height - pad * 2) / height, 1);
    setView({ zoom, x: (box.width - width * zoom) / 2, y: (box.height - height * zoom) / 2 });
    setFitted(true);
  }, [width, height]);

  useLayoutEffect(() => {
    setFitted(false);
  }, [bitmap, width, height]);

  useLayoutEffect(() => {
    if (!fitted) fit();
  }, [fitted, fit]);

  useEffect(() => {
    const onResize = () => fit();
    window.addEventListener('resize', onResize);
    const observer = new ResizeObserver(() => fit());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      window.removeEventListener('resize', onResize);
      observer.disconnect();
    };
  }, [fit]);

  // -------------------------------------------------------------------------
  // Pintado
  // -------------------------------------------------------------------------
  // useLayoutEffect y dibujo SÍNCRONO, sin requestAnimationFrame: en una pestaña
  // en segundo plano rAF no se ejecuta nunca y el lienzo se quedaría en blanco.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const box = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = Math.max(1, Math.round(box.width));
    const cssH = Math.max(1, Math.round(box.height));

    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    ctx.save();
    ctx.translate(view.x, view.y);
    ctx.scale(view.zoom, view.zoom);

    // Tablero de ajedrez bajo la imagen, para que se vea la transparencia
    // real de un PNG en vez de un negro que engaña.
    ctx.save();
    ctx.fillStyle = '#0f0a05';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    const stats = renderComposite(ctx, bitmap, width, height, layers, assets, {
      highlightLayerId: selectedLayerId,
      screenScale: view.zoom * dpr,
      bypass: compare || peek,
    });
    ctx.restore();

    onStats?.(stats);
  }, [bitmap, width, height, layers, assets, selectedLayerId, view, compare, peek, redrawKey, onStats]);

  // -------------------------------------------------------------------------
  // Zoom con rueda (hacia el cursor)
  // -------------------------------------------------------------------------
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const box = el.getBoundingClientRect();
      const px = e.clientX - box.left;
      const py = e.clientY - box.top;
      setView(prev => {
        const factor = Math.exp(-e.deltaY * 0.0016);
        const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev.zoom * factor));
        const k = zoom / prev.zoom;
        return { zoom, x: px - (px - prev.x) * k, y: py - (py - prev.y) * k };
      });
    };
    // `passive: false` es obligatorio: si no, preventDefault no surte efecto y
    // la rueda hace scroll de la página en vez de zoom.
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const zoomBy = (factor: number) => {
    const box = containerRef.current?.getBoundingClientRect();
    if (!box) return;
    const px = box.width / 2;
    const py = box.height / 2;
    setView(prev => {
      const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev.zoom * factor));
      const k = zoom / prev.zoom;
      return { zoom, x: px - (px - prev.x) * k, y: py - (py - prev.y) * k };
    });
  };

  // -------------------------------------------------------------------------
  // Puntero
  // -------------------------------------------------------------------------
  const toImageSpace = (clientX: number, clientY: number) => {
    const box = containerRef.current!.getBoundingClientRect();
    const v = viewRef.current;
    return { x: (clientX - box.left - v.x) / v.zoom, y: (clientY - box.top - v.y) / v.zoom };
  };

  /** Capa arrastrable bajo el punto (de arriba abajo en la pila). */
  const pickLayer = (ix: number, iy: number): Layer | null => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return null;
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (!layer.visible || layer.placement === 'tile') continue;
      const box = layerBounds(ctx, layer, width, height, assets);
      if (!box) continue;
      const slack = Math.max(box.width, box.height) * 0.08;
      if (
        ix >= box.x - slack && ix <= box.x + box.width + slack &&
        iy >= box.y - slack && iy <= box.y + box.height + slack
      ) {
        return layer;
      }
    }
    return null;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 2) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const img = toImageSpace(e.clientX, e.clientY);
    const hit = e.button === 1 || e.shiftKey ? null : pickLayer(img.x, img.y);

    if (hit) {
      const ctx = canvasRef.current!.getContext('2d')!;
      const box = layerBounds(ctx, hit, width, height, assets)!;
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      gesture.current = {
        mode: 'drag',
        startX: e.clientX,
        startY: e.clientY,
        originX: 0,
        originY: 0,
        layerId: hit.id,
        grabOffset: { x: img.x - cx, y: img.y - cy },
        moved: false,
        lastPos: { x: cx / width, y: cy / height },
      };
      if (hit.id !== selectedLayerId) onSelectLayer(hit.id);
      setCursor('move');
    } else {
      gesture.current = {
        mode: 'pan',
        startX: e.clientX,
        startY: e.clientY,
        originX: viewRef.current.x,
        originY: viewRef.current.y,
        layerId: null,
        grabOffset: { x: 0, y: 0 },
        moved: false,
        lastPos: { x: 0.5, y: 0.5 },
      };
      setCursor('grabbing');
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const g = gesture.current;

    if (g.mode === 'none') {
      const img = toImageSpace(e.clientX, e.clientY);
      setCursor(pickLayer(img.x, img.y) ? 'move' : 'grab');
      return;
    }

    g.moved = true;

    if (g.mode === 'pan') {
      setView(prev => ({ ...prev, x: g.originX + (e.clientX - g.startX), y: g.originY + (e.clientY - g.startY) }));
      return;
    }

    if (g.mode === 'drag' && g.layerId) {
      const img = toImageSpace(e.clientX, e.clientY);
      const x = Math.min(1, Math.max(0, (img.x - g.grabOffset.x) / width));
      const y = Math.min(1, Math.max(0, (img.y - g.grabOffset.y) / height));
      g.lastPos = { x, y };
      onMoveLayer(g.layerId, { x, y }, false);
    }
  };

  const endGesture = () => {
    const g = gesture.current;
    // El commit sólo se emite al soltar: así el historial guarda un paso por
    // arrastre y no doscientos, uno por cada pixel de movimiento.
    if (g.mode === 'drag' && g.layerId && g.moved) onMoveLayer(g.layerId, g.lastPos, true);
    gesture.current = { ...g, mode: 'none', layerId: null, moved: false };
    setCursor('grab');
  };

  // Alt = ver el original un momento, sin soltar nada.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        e.preventDefault();
        setPeek(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setPeek(false);
    };
    const blur = () => setPeek(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);

  const showingOriginal = compare || peek;

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endGesture}
        onPointerCancel={endGesture}
        onContextMenu={e => e.preventDefault()}
        className="absolute inset-0 overflow-hidden rounded-2xl bg-[#0b0704] touch-none select-none"
        style={{ cursor }}
      >
        <canvas ref={canvasRef} className="block" />
      </div>

      {/* Barra de zoom */}
      <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-black/75 backdrop-blur px-1.5 py-1">
        <button
          onClick={() => zoomBy(1 / 1.25)}
          title={t.zoomOut || 'Zoom out'}
          className="p-1.5 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-white/10 transition-colors cursor-pointer border-none bg-transparent"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="px-1 text-[10px] font-black tabular-nums text-slate-400 min-w-[42px] text-center">
          {Math.round(view.zoom * 100)}%
        </span>
        <button
          onClick={() => zoomBy(1.25)}
          title={t.zoomIn || 'Zoom in'}
          className="p-1.5 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-white/10 transition-colors cursor-pointer border-none bg-transparent"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <span className="w-px h-4 bg-white/10 mx-0.5" />
        <button
          onClick={fit}
          title={t.zoomFit || 'Fit'}
          className="p-1.5 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-white/10 transition-colors cursor-pointer border-none bg-transparent"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            const box = containerRef.current?.getBoundingClientRect();
            if (!box) return;
            setView({ zoom: 1, x: (box.width - width) / 2, y: (box.height - height) / 2 });
          }}
          title={t.zoomActual || '100%'}
          className="p-1.5 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-white/10 transition-colors cursor-pointer border-none bg-transparent"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {showingOriginal && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest shadow-lg pointer-events-none">
          <Eye className="w-3.5 h-3.5" />
          {t.originalLabel || 'Original'}
        </div>
      )}
    </div>
  );
};

export default Stage;
