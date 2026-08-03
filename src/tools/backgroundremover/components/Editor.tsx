import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Eraser,
  Paintbrush,
  Wand2,
  Lasso,
  Sparkles,
  Undo2,
  Redo2,
  RotateCcw,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize,
  Loader2,
  Hand,
  Brush,
  SlidersHorizontal,
  Layers,
  Copy,
  Check,
  Crop,
  FlipHorizontal2,
  Image as ImageIcon,
  X,
} from 'lucide-react';

import type { ImageItem } from '../types';
import {
  blurMask,
  composite,
  despill as despillPixels,
  expandMask,
  fillPolygon,
  floodFill,
  globalColorFill,
  invertMask,
  maskBounds,
  paintDisc,
  paintDiscByColor,
  sampleColor,
  sharpenMaskEdges,
} from '../lib/mask';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tool = 'pan' | 'erase' | 'restore' | 'magicbrush' | 'wand' | 'lasso';
/** Shared by the magic brush, the wand and the lasso. */
type Mode = 'erase' | 'restore';
type LassoShape = 'polygon' | 'freehand';
type BgKind = 'transparent' | 'color' | 'gradient' | 'blur' | 'image';
type ExportFormat = 'png' | 'webp' | 'jpeg';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface EditorProps {
  item: ImageItem;
  t: any;
  onCommit: (blob: Blob, url: string) => void;
  onRerunAI: () => void;
}

const GRADIENTS = [
  ['#f0abfc', '#818cf8'],
  ['#fbbf24', '#f97316'],
  ['#34d399', '#0ea5e9'],
  ['#f43f5e', '#7c3aed'],
  ['#e5e7eb', '#94a3b8'],
];

const SOLIDS = ['#ffffff', '#000000', '#e879f9', '#22d3ee', '#22c55e', '#f59e0b'];

/** Undo entries are one byte per pixel; cap the stack by memory, not by count. */
const MAX_HISTORY_BYTES = 96 * 1024 * 1024;

// ---------------------------------------------------------------------------

export const Editor: React.FC<EditorProps> = ({ item, t, onCommit, onRerunAI }) => {
  // --- DOM refs -------------------------------------------------------------
  const viewRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // --- Image data (never re-rendered through React state) -------------------
  const originalRef = useRef<Uint8ClampedArray | null>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskRef = useRef<Uint8ClampedArray | null>(null);
  const baseMaskRef = useRef<Uint8ClampedArray | null>(null);
  const cutoutCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cutoutImageRef = useRef<ImageData | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const sizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const loadedIdRef = useRef<string | null>(null);

  // --- Interaction refs -----------------------------------------------------
  const undoStack = useRef<Uint8ClampedArray[]>([]);
  const redoStack = useRef<Uint8ClampedArray[]>([]);
  const drawing = useRef(false);
  const panning = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const brushSample = useRef<{ r: number; g: number; b: number } | null>(null);
  const lassoPoints = useRef<{ x: number; y: number }[]>([]);
  const lassoPreview = useRef<{ x: number; y: number } | null>(null);
  const lassoDrag = useRef<{ start: { x: number; y: number }; travelled: number } | null>(null);
  /** Alt or right-click flips whatever the active tool normally does. */
  const inverted = useRef(false);
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const viewRefState = useRef({ scale: 0, ox: 0, oy: 0, fit: true });

  // --- UI state -------------------------------------------------------------
  const [tool, setTool] = useState<Tool>('erase');
  const [mode, setMode] = useState<Mode>('erase');
  const [lassoShape, setLassoShape] = useState<LassoShape>('polygon');
  const [brushSize, setBrushSize] = useState(48);
  const [hardness, setHardness] = useState(0.6);
  const [tolerance, setTolerance] = useState(28);
  const [contiguous, setContiguous] = useState(true);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [historyTick, setHistoryTick] = useState(0);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [lassoActive, setLassoActive] = useState(false);
  const [zoomLabel, setZoomLabel] = useState('FIT');
  const [compare, setCompare] = useState(false);
  const [panel, setPanel] = useState<'refine' | 'background' | 'export'>('refine');
  const [copied, setCopied] = useState(false);

  // Background composition
  const [bgKind, setBgKind] = useState<BgKind>('transparent');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [bgGradient, setBgGradient] = useState(GRADIENTS[0]);
  const [bgBlur, setBgBlur] = useState(24);
  const [shadow, setShadow] = useState(false);

  // Edge refinement (applied on top of the painted mask)
  const [feather, setFeather] = useState(0);
  const [edgeShift, setEdgeShift] = useState(0);
  const [decontaminate, setDecontaminate] = useState(0);

  // Export
  const [format, setFormat] = useState<ExportFormat>('png');
  const [exportScale, setExportScale] = useState(100);
  const [trim, setTrim] = useState(false);

  const working = item.status !== 'done';
  const bumpHistory = () => setHistoryTick(n => n + 1);

  // =========================================================================
  // Loading: decode the original once, take a copy of the AI mask
  // =========================================================================
  useEffect(() => {
    if (item.status !== 'done' || !item.mask) return;
    if (loadedIdRef.current === item.id + ':' + item.maskVersion) return;

    let cancelled = false;
    setReady(false);

    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const width = item.width || img.naturalWidth;
      const height = item.height || img.naturalHeight;

      const oc = document.createElement('canvas');
      oc.width = width;
      oc.height = height;
      const octx = oc.getContext('2d', { willReadFrequently: true })!;
      octx.drawImage(img, 0, 0, width, height);
      originalCanvasRef.current = oc;
      originalRef.current = octx.getImageData(0, 0, width, height).data;

      const cc = document.createElement('canvas');
      cc.width = width;
      cc.height = height;
      cutoutCanvasRef.current = cc;
      cutoutImageRef.current = cc.getContext('2d')!.createImageData(width, height);

      sizeRef.current = { width, height };
      baseMaskRef.current = item.mask!;
      maskRef.current = new Uint8ClampedArray(item.mask!);
      undoStack.current = [];
      redoStack.current = [];
      lassoPoints.current = [];
      setLassoActive(false);
      setFeather(0);
      setEdgeShift(0);
      setDecontaminate(0);
      loadedIdRef.current = item.id + ':' + item.maskVersion;

      updateCutout();
      fitToStage();
      bumpHistory();
      setReady(true);
      scheduleCommit();
    };
    img.onerror = () => setReady(false);
    img.src = item.originalUrl;

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id, item.status, item.maskVersion]);

  // =========================================================================
  // Compositing
  // =========================================================================

  /** Rebuilds `cutoutCanvas` from original × mask, optionally only inside `rect`. */
  const updateCutout = useCallback((rect?: Rect) => {
    const original = originalRef.current;
    const mask = maskRef.current;
    const img = cutoutImageRef.current;
    const canvas = cutoutCanvasRef.current;
    if (!original || !mask || !img || !canvas) return;
    const { width, height } = sizeRef.current;

    if (!rect) {
      composite(original, mask, img.data);
      canvas.getContext('2d')!.putImageData(img, 0, 0);
      return;
    }

    const x0 = Math.max(0, Math.floor(rect.x));
    const y0 = Math.max(0, Math.floor(rect.y));
    const x1 = Math.min(width, Math.ceil(rect.x + rect.w));
    const y1 = Math.min(height, Math.ceil(rect.y + rect.h));
    if (x1 <= x0 || y1 <= y0) return;

    const data = img.data;
    for (let y = y0; y < y1; y++) {
      const row = y * width;
      for (let x = x0; x < x1; x++) {
        const i = row + x;
        const p = i * 4;
        data[p] = original[p];
        data[p + 1] = original[p + 1];
        data[p + 2] = original[p + 2];
        data[p + 3] = (original[p + 3] * mask[i]) / 255;
      }
    }
    // putImageData's dirty rect keeps the blit proportional to what changed.
    canvas.getContext('2d')!.putImageData(img, 0, 0, x0, y0, x1 - x0, y1 - y0);
  }, []);

  /** Paints the background layer (colour/gradient/blur/image) into any context. */
  const paintBackdrop = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      if (bgKind === 'transparent') return;
      if (bgKind === 'color') {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, w, h);
        return;
      }
      if (bgKind === 'gradient') {
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, bgGradient[0]);
        g.addColorStop(1, bgGradient[1]);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        return;
      }
      if (bgKind === 'blur' && originalCanvasRef.current) {
        ctx.save();
        ctx.filter = `blur(${Math.max(1, (bgBlur * w) / 800)}px)`;
        // Slight overdraw so the blur doesn't fade out at the edges.
        ctx.drawImage(originalCanvasRef.current, -w * 0.04, -h * 0.04, w * 1.08, h * 1.08);
        ctx.restore();
        return;
      }
      if (bgKind === 'image' && bgImageRef.current) {
        const bi = bgImageRef.current;
        const scale = Math.max(w / bi.naturalWidth, h / bi.naturalHeight);
        const dw = bi.naturalWidth * scale;
        const dh = bi.naturalHeight * scale;
        ctx.drawImage(bi, (w - dw) / 2, (h - dh) / 2, dw, dh);
      }
    },
    [bgKind, bgColor, bgGradient, bgBlur]
  );

  /** Draws the visible canvas: backdrop + shadow + cutout, under the current view. */
  const draw = useCallback(() => {
    const view = viewRef.current;
    const stage = stageRef.current;
    const cutout = cutoutCanvasRef.current;
    if (!view || !stage || !cutout) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cw = stage.clientWidth;
    const ch = stage.clientHeight;
    if (view.width !== Math.round(cw * dpr) || view.height !== Math.round(ch * dpr)) {
      view.width = Math.round(cw * dpr);
      view.height = Math.round(ch * dpr);
      view.style.width = cw + 'px';
      view.style.height = ch + 'px';
    }

    const ctx = view.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);

    const { scale, ox, oy } = viewRefState.current;
    const { width, height } = sizeRef.current;
    const dw = width * scale;
    const dh = height * scale;

    ctx.save();
    ctx.translate(ox, oy);

    // Checkerboard only under the artwork, so transparency reads clearly.
    if (bgKind === 'transparent') {
      const s = 12;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, dw, dh);
      ctx.clip();
      ctx.fillStyle = '#191024';
      ctx.fillRect(0, 0, dw, dh);
      ctx.fillStyle = '#221733';
      for (let y = 0; y < dh; y += s) {
        for (let x = ((y / s) % 2) * s; x < dw; x += s * 2) ctx.fillRect(x, y, s, s);
      }
      ctx.restore();
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, dw, dh);
      ctx.clip();
      paintBackdrop(ctx, dw, dh);
      ctx.restore();
    }

    if (compare) {
      // Split view: untouched photo on the left, live cutout on the right.
      const split = dw / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, split, dh);
      ctx.clip();
      if (originalCanvasRef.current) ctx.drawImage(originalCanvasRef.current, 0, 0, dw, dh);
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.rect(split, 0, dw - split, dh);
      ctx.clip();
      drawCutout(ctx, dw, dh);
      ctx.restore();

      ctx.strokeStyle = '#e879f9';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(split, 0);
      ctx.lineTo(split, dh);
      ctx.stroke();
    } else {
      drawCutout(ctx, dw, dh);
    }

    // Lasso overlay
    const pts = lassoPoints.current;
    if (tool === 'lasso' && pts.length > 0) {
      ctx.save();
      ctx.scale(scale, scale);
      ctx.lineWidth = 2 / scale;
      ctx.strokeStyle = '#e879f9';
      ctx.setLineDash([8 / scale, 6 / scale]);
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      if (lassoPreview.current) ctx.lineTo(lassoPreview.current.x, lassoPreview.current.y);
      ctx.stroke();
      if (pts.length >= 2) {
        ctx.setLineDash([2 / scale, 6 / scale]);
        ctx.beginPath();
        const last = lassoPreview.current || pts[pts.length - 1];
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(pts[0].x, pts[0].y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.fillStyle = '#e879f9';
      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4 / scale, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore();

    function drawCutout(c: CanvasRenderingContext2D, w: number, h: number) {
      if (!cutout) return;
      if (shadow) {
        c.save();
        c.shadowColor = 'rgba(0,0,0,0.45)';
        c.shadowBlur = Math.max(6, w * 0.03);
        c.shadowOffsetY = Math.max(4, h * 0.02);
        c.drawImage(cutout, 0, 0, w, h);
        c.restore();
      }
      c.drawImage(cutout, 0, 0, w, h);
    }
  }, [bgKind, compare, shadow, tool, paintBackdrop]);

  const requestDraw = useCallback(() => {
    // Hidden tabs never run rAF callbacks, which would leave the canvas blank
    // (and the pending frame stuck) for anything that finishes in the
    // background. Canvas work itself is still allowed, so just draw.
    if (typeof document !== 'undefined' && document.hidden) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      draw();
      return;
    }
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      draw();
    });
  }, [draw]);

  useEffect(() => {
    requestDraw();
  }, [requestDraw, bgKind, bgColor, bgGradient, bgBlur, shadow, compare, historyTick]);

  // requestAnimationFrame never fires while the tab is hidden, so a cutout that
  // finishes in the background would come back to a blank canvas.
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) requestDraw();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [requestDraw]);

  // Keep the canvas in step with container resizes.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const ro = new ResizeObserver(() => {
      if (viewRefState.current.fit) fitToStage();
      else requestDraw();
    });
    ro.observe(stage);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================================================================
  // View transform
  // =========================================================================
  const fitToStage = useCallback(() => {
    const stage = stageRef.current;
    const { width, height } = sizeRef.current;
    if (!stage || !width) return;
    const pad = 24;
    const scale = Math.min(
      (stage.clientWidth - pad) / width,
      (stage.clientHeight - pad) / height,
      4
    );
    viewRefState.current = {
      scale,
      ox: (stage.clientWidth - width * scale) / 2,
      oy: (stage.clientHeight - height * scale) / 2,
      fit: true,
    };
    setZoomLabel('FIT');
    requestDraw();
  }, [requestDraw]);

  const zoomAt = useCallback(
    (factor: number, anchorX?: number, anchorY?: number) => {
      const stage = stageRef.current;
      // Before the first fit there is no scale to zoom around.
      if (!stage || !viewRefState.current.scale) return;
      const v = viewRefState.current;
      const next = Math.min(16, Math.max(0.05, v.scale * factor));
      const ax = anchorX ?? stage.clientWidth / 2;
      const ay = anchorY ?? stage.clientHeight / 2;
      // Keep the point under the cursor pinned while zooming.
      viewRefState.current = {
        scale: next,
        ox: ax - ((ax - v.ox) * next) / v.scale,
        oy: ay - ((ay - v.oy) * next) / v.scale,
        fit: false,
      };
      setZoomLabel(Math.round(next * 100) + '%');
      requestDraw();
    },
    [requestDraw]
  );

  // Wheel zoom has to be a non-passive native listener to preventDefault.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = stage.getBoundingClientRect();
      zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - r.left, e.clientY - r.top);
    };
    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  const toImage = (e: { clientX: number; clientY: number }) => {
    const stage = stageRef.current!;
    const r = stage.getBoundingClientRect();
    const v = viewRefState.current;
    return {
      x: (e.clientX - r.left - v.ox) / v.scale,
      y: (e.clientY - r.top - v.oy) / v.scale,
    };
  };

  // =========================================================================
  // History
  // =========================================================================
  const pushUndo = () => {
    const mask = maskRef.current;
    if (!mask) return;
    undoStack.current.push(new Uint8ClampedArray(mask));
    let bytes = undoStack.current.length * mask.length;
    while (undoStack.current.length > 1 && bytes > MAX_HISTORY_BYTES) {
      undoStack.current.shift();
      bytes -= mask.length;
    }
    redoStack.current = [];
    bumpHistory();
  };

  const applyMask = (next: Uint8ClampedArray) => {
    maskRef.current = next;
    // The refine sliders re-derive from a frozen base; replacing the mask
    // wholesale (undo, redo, reset, invert) invalidates it.
    paintedMaskRef.current = null;
    updateCutout();
    requestDraw();
    scheduleCommit();
    bumpHistory();
  };

  const undo = () => {
    const snap = undoStack.current.pop();
    if (!snap || !maskRef.current) return;
    redoStack.current.push(new Uint8ClampedArray(maskRef.current));
    applyMask(snap);
  };

  const redo = () => {
    const snap = redoStack.current.pop();
    if (!snap || !maskRef.current) return;
    undoStack.current.push(new Uint8ClampedArray(maskRef.current));
    applyMask(snap);
  };

  const resetEdits = () => {
    if (!baseMaskRef.current) return;
    pushUndo();
    setFeather(0);
    setEdgeShift(0);
    setDecontaminate(0);
    applyMask(new Uint8ClampedArray(baseMaskRef.current));
  };

  // =========================================================================
  // Commit the flattened result back to the parent (debounced)
  // =========================================================================
  const buildOutputCanvas = useCallback(
    (scalePercent = 100, forExport = false): HTMLCanvasElement | null => {
      const cutout = cutoutCanvasRef.current;
      const original = originalRef.current;
      const mask = maskRef.current;
      if (!cutout || !original || !mask) return null;
      const { width, height } = sizeRef.current;

      // Optional colour decontamination is destructive, so it only ever runs on
      // a throwaway copy at export time.
      let source: HTMLCanvasElement = cutout;
      if (forExport && decontaminate > 0) {
        const tmp = document.createElement('canvas');
        tmp.width = width;
        tmp.height = height;
        const tctx = tmp.getContext('2d')!;
        const img = tctx.createImageData(width, height);
        composite(original, mask, img.data);
        despillPixels(img.data, mask, { width, height }, decontaminate);
        tctx.putImageData(img, 0, 0);
        source = tmp;
      }

      let crop = { x: 0, y: 0, w: width, h: height };
      if (forExport && trim) {
        const b = maskBounds(mask, { width, height });
        if (b) crop = { x: b.x, y: b.y, w: b.width, h: b.height };
      }

      const factor = Math.max(0.05, scalePercent / 100);
      const out = document.createElement('canvas');
      out.width = Math.max(1, Math.round(crop.w * factor));
      out.height = Math.max(1, Math.round(crop.h * factor));
      const ctx = out.getContext('2d')!;
      ctx.imageSmoothingQuality = 'high';

      const opaque = bgKind !== 'transparent' || (forExport && format === 'jpeg');
      if (opaque) {
        if (bgKind === 'transparent') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, out.width, out.height);
        } else {
          ctx.save();
          // The backdrop is painted over the full frame, then cropped with it.
          ctx.translate((-crop.x * factor), (-crop.y * factor));
          paintBackdrop(ctx, width * factor, height * factor);
          ctx.restore();
        }
      }

      if (shadow) {
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.45)';
        ctx.shadowBlur = Math.max(6, out.width * 0.03);
        ctx.shadowOffsetY = Math.max(4, out.height * 0.02);
        ctx.drawImage(source, crop.x, crop.y, crop.w, crop.h, 0, 0, out.width, out.height);
        ctx.restore();
      }
      ctx.drawImage(source, crop.x, crop.y, crop.w, crop.h, 0, 0, out.width, out.height);
      return out;
    },
    [bgKind, decontaminate, format, paintBackdrop, shadow, trim]
  );

  const scheduleCommit = useCallback(() => {
    if (commitTimer.current) clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(() => {
      const out = buildOutputCanvas(100, false);
      if (!out) return;
      out.toBlob(blob => {
        if (!blob) return;
        onCommit(blob, URL.createObjectURL(blob));
      }, 'image/png');
    }, 450);
  }, [buildOutputCanvas, onCommit]);

  // Background / shadow changes alter the flattened result too.
  useEffect(() => {
    if (ready) scheduleCommit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgKind, bgColor, bgGradient, bgBlur, shadow, ready]);

  // =========================================================================
  // Edge refinement — recomputed from the painted mask so sliders stay live
  // =========================================================================
  const paintedMaskRef = useRef<Uint8ClampedArray | null>(null);

  const applyRefinements = useCallback(
    (featherPx: number, shiftPx: number) => {
      const base = paintedMaskRef.current;
      if (!base) return;
      const next = new Uint8ClampedArray(base);
      if (shiftPx !== 0) expandMask(next, sizeRef.current, shiftPx);
      if (featherPx > 0) blurMask(next, sizeRef.current, featherPx);
      else if (featherPx === 0 && shiftPx !== 0) sharpenMaskEdges(next, 0.25);
      maskRef.current = next;
      updateCutout();
      requestDraw();
      scheduleCommit();
    },
    [requestDraw, scheduleCommit, updateCutout]
  );

  /** Freezes the current mask as the base the refine sliders operate on. */
  const snapshotPainted = () => {
    if (maskRef.current) paintedMaskRef.current = new Uint8ClampedArray(maskRef.current);
  };

  const onRefineChange = (nextFeather: number, nextShift: number) => {
    if (!paintedMaskRef.current) snapshotPainted();
    setFeather(nextFeather);
    setEdgeShift(nextShift);
    applyRefinements(nextFeather, nextShift);
  };

  // Painting invalidates the refine base.
  const invalidateRefineBase = () => {
    paintedMaskRef.current = null;
    if (feather !== 0 || edgeShift !== 0) {
      setFeather(0);
      setEdgeShift(0);
    }
  };

  // =========================================================================
  // Pointer handling
  // =========================================================================
  /** The value a paint operation writes, after Alt/right-click inversion. */
  const paintValue = (base: Mode) => {
    const effective = inverted.current ? (base === 'erase' ? 'restore' : 'erase') : base;
    return effective === 'erase' ? 0 : 255;
  };

  const strokeTo = (x: number, y: number) => {
    const mask = maskRef.current;
    const original = originalRef.current;
    if (!mask || !original) return;
    const radius = brushSize / 2 / viewRefState.current.scale;
    const from = lastPos.current || { x, y };
    const dist = Math.hypot(x - from.x, y - from.y);
    const steps = Math.max(1, Math.ceil(dist / Math.max(1, radius / 3)));
    const size = sizeRef.current;
    const value = paintValue(tool === 'magicbrush' ? mode : tool === 'erase' ? 'erase' : 'restore');

    for (let i = 0; i <= steps; i++) {
      const px = from.x + ((x - from.x) * i) / steps;
      const py = from.y + ((y - from.y) * i) / steps;
      if (tool === 'magicbrush') {
        // The colour is sampled once, on the first dab, so the whole stroke
        // targets the same tone instead of drifting into the subject.
        if (!brushSample.current) brushSample.current = sampleColor(original, size, px, py);
        paintDiscByColor(mask, original, size, px, py, radius, tolerance, value, brushSample.current);
      } else {
        paintDisc(mask, size, px, py, radius, value, hardness);
      }
    }

    const pad = radius + 2;
    updateCutout({
      x: Math.min(from.x, x) - pad,
      y: Math.min(from.y, y) - pad,
      w: Math.abs(x - from.x) + pad * 2,
      h: Math.abs(y - from.y) + pad * 2,
    });
    requestDraw();
    lastPos.current = { x, y };
  };

  const runWand = (x: number, y: number) => {
    const mask = maskRef.current;
    const original = originalRef.current;
    if (!mask || !original) return;
    setBusy(true);
    // Yield once so the spinner paints before a multi-megapixel flood fill.
    setTimeout(() => {
      try {
        const size = sizeRef.current;
        const value = paintValue(mode);
        if (contiguous) floodFill(mask, original, size, x, y, tolerance, value);
        else globalColorFill(mask, original, x, y, size.width, tolerance, value);
        updateCutout();
        requestDraw();
        scheduleCommit();
      } finally {
        setBusy(false);
      }
    }, 16);
  };

  const closeLasso = useCallback(() => {
    const pts = lassoPoints.current;
    const mask = maskRef.current;
    if (pts.length < 3 || !mask) {
      lassoPoints.current = [];
      lassoPreview.current = null;
      lassoDrag.current = null;
      setLassoActive(false);
      requestDraw();
      return;
    }
    pushUndo();
    invalidateRefineBase();
    fillPolygon(mask, sizeRef.current, pts, paintValue(mode));
    lassoPoints.current = [];
    lassoPreview.current = null;
    lassoDrag.current = null;
    setLassoActive(false);
    updateCutout();
    requestDraw();
    scheduleCommit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, requestDraw, scheduleCommit, updateCutout]);

  const cancelLasso = useCallback(() => {
    lassoPoints.current = [];
    lassoPreview.current = null;
    lassoDrag.current = null;
    setLassoActive(false);
    requestDraw();
  }, [requestDraw]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!ready || busy || working) return;
    try {
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    } catch {
      /* capture is best-effort */
    }
    const p = toImage(e);
    // Alt or the right button temporarily flips erase into restore and back.
    inverted.current = e.altKey || e.button === 2;

    // Middle button and the pan tool both grab the canvas.
    if (tool === 'pan' || e.button === 1 || e.shiftKey) {
      const v = viewRefState.current;
      panning.current = { x: e.clientX, y: e.clientY, ox: v.ox, oy: v.oy };
      return;
    }

    if (tool === 'lasso') {
      const pts = lassoPoints.current;
      const closeDist = 12 / viewRefState.current.scale;
      if (lassoShape === 'polygon' && pts.length >= 3 && Math.hypot(p.x - pts[0].x, p.y - pts[0].y) < closeDist) {
        closeLasso();
        return;
      }
      if (lassoShape === 'freehand') lassoPoints.current = [];
      // Track the drag so a click-and-drag draws freehand while a plain click
      // keeps placing polygon corners.
      lassoDrag.current = { start: p, travelled: 0 };
      lassoPoints.current.push(p);
      setLassoActive(true);
      requestDraw();
      return;
    }

    if (tool === 'wand') {
      pushUndo();
      invalidateRefineBase();
      runWand(p.x, p.y);
      return;
    }

    pushUndo();
    invalidateRefineBase();
    drawing.current = true;
    lastPos.current = null;
    brushSample.current = null;
    strokeTo(p.x, p.y);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const stage = stageRef.current;
    if (stage) {
      const r = stage.getBoundingClientRect();
      setCursor({ x: e.clientX - r.left, y: e.clientY - r.top });
    }

    if (panning.current) {
      const v = viewRefState.current;
      viewRefState.current = {
        ...v,
        ox: panning.current.ox + (e.clientX - panning.current.x),
        oy: panning.current.oy + (e.clientY - panning.current.y),
        fit: false,
      };
      requestDraw();
      return;
    }

    if (tool === 'lasso' && lassoPoints.current.length > 0) {
      const p = toImage(e);
      const drag = lassoDrag.current;
      if (drag) {
        // Dragging = freehand outline: sample the path as the pointer moves.
        const last = lassoPoints.current[lassoPoints.current.length - 1];
        const step = Math.hypot(p.x - last.x, p.y - last.y);
        drag.travelled += step;
        const minStep = 2 / viewRefState.current.scale;
        if (step >= minStep) lassoPoints.current.push(p);
      } else {
        lassoPreview.current = p;
      }
      requestDraw();
      return;
    }

    if (!drawing.current) return;
    const p = toImage(e);
    strokeTo(p.x, p.y);
  };

  const endStroke = (e?: React.PointerEvent) => {
    panning.current = null;

    if (tool === 'lasso' && lassoDrag.current) {
      const dragged = lassoDrag.current.travelled * viewRefState.current.scale;
      lassoDrag.current = null;
      // A real drag closes the shape immediately; a tap just dropped a corner.
      if (dragged > 12) {
        closeLasso();
        return;
      }
      if (lassoShape === 'freehand' && e) {
        // Freehand needs a drag — a stray tap should not leave a stub behind.
        cancelLasso();
        return;
      }
    }

    if (drawing.current) scheduleCommit();
    drawing.current = false;
    lastPos.current = null;
    brushSample.current = null;
    inverted.current = false;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (mod && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault(); redo(); return;
      }
      if (e.key === 'Escape') cancelLasso();
      if (e.key === 'Enter' && lassoPoints.current.length >= 3) closeLasso();
      if (mod) return;
      const map: Record<string, Tool> = { e: 'erase', r: 'restore', b: 'magicbrush', w: 'wand', l: 'lasso', h: 'pan' };
      const next = map[e.key.toLowerCase()];
      if (next) setTool(next);
      if (e.key === '[') setBrushSize(s => Math.max(4, s - 6));
      if (e.key === ']') setBrushSize(s => Math.min(300, s + 6));
      if (e.key === '0') fitToStage();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closeLasso, cancelLasso, fitToStage]);

  // =========================================================================
  // Actions
  // =========================================================================
  const doInvert = () => {
    if (!maskRef.current) return;
    pushUndo();
    invalidateRefineBase();
    const next = new Uint8ClampedArray(maskRef.current);
    invertMask(next);
    applyMask(next);
  };

  const exportBlob = useCallback(
    (): Promise<Blob | null> =>
      new Promise(resolve => {
        const out = buildOutputCanvas(exportScale, true);
        if (!out) return resolve(null);
        const mime = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
        out.toBlob(b => resolve(b), mime, format === 'png' ? undefined : 0.92);
      }),
    [buildOutputCanvas, exportScale, format]
  );

  const download = async () => {
    const blob = await exportBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const base = item.name.replace(/\.[a-z0-9]+$/i, '') || item.name;
    const link = document.createElement('a');
    link.href = url;
    link.download = `${base}-cutout.${format === 'jpeg' ? 'jpg' : format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const copyToClipboard = async () => {
    try {
      const out = buildOutputCanvas(exportScale, true);
      if (!out) return;
      // Clipboard images must be PNG.
      const blob: Blob | null = await new Promise(r => out.toBlob(b => r(b), 'image/png'));
      if (!blob) return;
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard-write is unavailable or denied */
    }
  };

  const pickBackgroundImage = (file: File) => {
    const img = new Image();
    img.onload = () => {
      bgImageRef.current = img;
      setBgKind('image');
      requestDraw();
      scheduleCommit();
    };
    img.src = URL.createObjectURL(file);
  };

  const megapixels = useMemo(() => {
    const { width, height } = sizeRef.current;
    return width && height ? (width * height) / 1e6 : 0;
  }, [historyTick]);

  // =========================================================================
  // Render helpers
  // =========================================================================
  const toolBtn = (key: Tool, icon: React.ReactNode, label: string, shortcut: string) => (
    <button
      key={key}
      onClick={() => {
        if (tool === 'lasso' && key !== 'lasso') cancelLasso();
        setTool(key);
      }}
      title={`${label} (${shortcut})`}
      aria-label={label}
      aria-pressed={tool === key}
      className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all cursor-pointer relative group
        ${tool === key
          ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-300 shadow-[0_0_14px_rgba(232,121,249,0.3)]'
          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
    >
      {icon}
      <span className="pointer-events-none absolute left-full ml-2 px-2 py-1 rounded-md bg-black/90 border border-white/10 text-[10px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity hidden lg:block z-30">
        {label} <span className="text-slate-500">{shortcut}</span>
      </span>
    </button>
  );

  const actionBtn = (onClick: () => void, icon: React.ReactNode, label: string, disabled = false) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="w-11 h-11 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
    >
      {icon}
    </button>
  );

  const slider = (
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    onChange: (v: number) => void,
    suffix = ''
  ) => (
    <label className="block space-y-1.5">
      <span className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
        {label}
        <span className="text-fuchsia-400 tabular-nums">{value}{suffix}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded bg-white/10 outline-none accent-fuchsia-500 cursor-pointer"
      />
    </label>
  );

  const swatch = (active: boolean, style: React.CSSProperties, onClick: () => void, title: string) => (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`w-8 h-8 rounded-lg border-2 transition-all cursor-pointer shrink-0 ${
        active ? 'border-fuchsia-400 scale-110' : 'border-white/20 hover:border-white/50'
      }`}
      style={style}
    />
  );

  const panelTab = (key: typeof panel, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => setPanel(key)}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
        panel === key ? 'bg-fuchsia-500/15 text-fuchsia-300' : 'text-slate-500 hover:text-white'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  const showBrushRing = ready && !working && !busy && (tool === 'erase' || tool === 'restore' || tool === 'magicbrush');

  return (
    <div className="space-y-3">
      <div className="flex flex-col lg:flex-row gap-3">
        {/* ---------------------------------------------------------------- */}
        {/* Tool rail                                                        */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex lg:flex-col flex-wrap items-center gap-2 lg:w-11 shrink-0 order-2 lg:order-1">
          <button
            onClick={onRerunAI}
            disabled={working}
            title={t.autoAiTool || 'AI auto cutout'}
            aria-label={t.autoAiTool || 'AI auto cutout'}
            className="w-11 h-11 rounded-xl border border-fuchsia-500/40 bg-fuchsia-600/20 flex items-center justify-center text-fuchsia-300 hover:bg-fuchsia-600/40 transition-all cursor-pointer disabled:opacity-40"
          >
            <Sparkles className="w-[18px] h-[18px]" />
          </button>
          <div className="lg:w-8 lg:h-px w-px h-8 bg-white/10 lg:mx-auto" />
          {toolBtn('erase', <Eraser className="w-[18px] h-[18px]" />, t.eraseTool || 'Erase', 'E')}
          {toolBtn('restore', <Paintbrush className="w-[18px] h-[18px]" />, t.restoreTool || 'Restore', 'R')}
          {toolBtn('magicbrush', <Brush className="w-[18px] h-[18px]" />, t.magicBrushTool || 'Magic brush', 'B')}
          {toolBtn('wand', <Wand2 className="w-[18px] h-[18px]" />, t.wandTool || 'Magic wand', 'W')}
          {toolBtn('lasso', <Lasso className="w-[18px] h-[18px]" />, t.lassoTool || 'Lasso', 'L')}
          {toolBtn('pan', <Hand className="w-[18px] h-[18px]" />, t.panTool || 'Pan', 'H')}
          <div className="lg:w-8 lg:h-px w-px h-8 bg-white/10 lg:mx-auto" />
          {actionBtn(undo, <Undo2 className="w-[18px] h-[18px]" />, t.undoBtn || 'Undo', undoStack.current.length === 0)}
          {actionBtn(redo, <Redo2 className="w-[18px] h-[18px]" />, t.redoBtn || 'Redo', redoStack.current.length === 0)}
          {actionBtn(doInvert, <FlipHorizontal2 className="w-[18px] h-[18px]" />, t.invertBtn || 'Invert selection', !ready)}
          {actionBtn(resetEdits, <RotateCcw className="w-[18px] h-[18px]" />, t.resetEditsBtn || 'Reset edits', !ready)}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Stage                                                            */}
        {/* ---------------------------------------------------------------- */}
        <div
          ref={stageRef}
          /* `lg:flex-1`, never plain `flex-1`: below lg the parent is a column,
             where flex-basis:0% governs the *height* and collapses the stage to
             nothing, silently overriding h-[420px]. */
          className="relative w-full lg:flex-1 min-w-0 h-[420px] md:h-[540px] rounded-2xl border border-white/10 overflow-hidden bg-[#0a0710] order-1 lg:order-2"
          onPointerLeave={() => setCursor(null)}
        >
          <canvas
            ref={viewRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endStroke}
            onPointerCancel={endStroke}
            onDoubleClick={() => tool === 'lasso' && closeLasso()}
            onContextMenu={e => e.preventDefault()}
            className="absolute inset-0 select-none"
            style={{
              touchAction: 'none',
              cursor: tool === 'pan' ? 'grab' : showBrushRing ? 'none' : 'crosshair',
            }}
          />

          {/* Brush ring */}
          {cursor && showBrushRing && (
            <div
              className="absolute pointer-events-none rounded-full border-2 border-fuchsia-400/90 shadow-[0_0_10px_rgba(232,121,249,0.6)]"
              style={{
                left: cursor.x - brushSize / 2,
                top: cursor.y - brushSize / 2,
                width: brushSize,
                height: brushSize,
              }}
            />
          )}

          {/* Compare labels */}
          {compare && (
            <>
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur border border-white/10 text-[10px] font-black uppercase tracking-widest text-white pointer-events-none">
                {t.originalLabel || 'Original'}
              </div>
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-fuchsia-950/80 backdrop-blur border border-fuchsia-500/30 text-[10px] font-black uppercase tracking-widest text-fuchsia-300 pointer-events-none">
                {t.processedLabel || 'Cut-out'}
              </div>
            </>
          )}

          {(working || !ready || busy) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm gap-3 z-20">
              <Loader2 className="w-10 h-10 text-fuchsia-400 animate-spin" />
              {working && (
                <p className="text-xs font-bold text-white uppercase tracking-wider">
                  {item.status === 'loading_model' ? t.statusDownloadingModel : t.statusProcessing}
                </p>
              )}
            </div>
          )}

          {/* Hold to see the untouched photo next to the live cutout. */}
          <button
            onPointerDown={() => setCompare(true)}
            onPointerUp={() => setCompare(false)}
            onPointerCancel={() => setCompare(false)}
            onPointerLeave={() => setCompare(false)}
            title={t.compareHint || 'Hold to compare with the original'}
            className={`absolute bottom-3 left-3 z-10 flex items-center gap-1.5 px-3 py-2 rounded-xl backdrop-blur border text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
              compare
                ? 'bg-fuchsia-500/25 border-fuchsia-500/50 text-fuchsia-200'
                : 'bg-black/70 border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {t.compareBtn || 'Compare'}
          </button>

          {/* Zoom controls */}
          <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 p-1.5 rounded-xl bg-black/70 backdrop-blur border border-white/10">
            <button onClick={() => zoomAt(1 / 1.25)} title={t.zoomOutLabel || 'Zoom out'} className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-black text-slate-400 w-11 text-center tabular-nums">{zoomLabel}</span>
            <button onClick={() => zoomAt(1.25)} title={t.zoomInLabel || 'Zoom in'} className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={fitToStage} title={t.zoomFitLabel || 'Fit'} className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer">
              <Maximize className="w-4 h-4" />
            </button>
          </div>

          {/* Image info */}
          {ready && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur border border-white/5 text-[10px] font-bold text-slate-400 tabular-nums pointer-events-none">
              {sizeRef.current.width}×{sizeRef.current.height}
              {megapixels > 0 && <span className="text-slate-600 ml-1.5">{megapixels.toFixed(1)} MP</span>}
              {item.device === 'gpu' && <span className="text-fuchsia-400 ml-1.5">GPU</span>}
            </div>
          )}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Side panel                                                       */}
        {/* ---------------------------------------------------------------- */}
        <div className="lg:w-64 shrink-0 order-3 rounded-2xl bg-black/30 border border-white/5 p-3 space-y-3">
          <div className="flex gap-1 p-1 rounded-xl bg-black/40">
            {panelTab('refine', <SlidersHorizontal className="w-3.5 h-3.5" />, t.panelRefine || 'Refine')}
            {panelTab('background', <ImageIcon className="w-3.5 h-3.5" />, t.panelBackground || 'Background')}
            {panelTab('export', <Download className="w-3.5 h-3.5" />, t.panelExport || 'Export')}
          </div>

          {/* ---- Refine ---- */}
          {panel === 'refine' && (
            <div className="space-y-4">
              {/* The magic tools all work in either direction. */}
              {(tool === 'magicbrush' || tool === 'wand' || tool === 'lasso') && (
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {t.modeLabel || 'Action'}
                  </span>
                  <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-black/40">
                    {(['erase', 'restore'] as Mode[]).map(m => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          mode === m ? 'bg-fuchsia-500/20 text-fuchsia-300' : 'text-slate-500 hover:text-white'
                        }`}
                      >
                        {m === 'erase' ? <Eraser className="w-3.5 h-3.5" /> : <Paintbrush className="w-3.5 h-3.5" />}
                        {m === 'erase' ? t.modeErase || 'Remove' : t.modeRestore || 'Restore'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(tool === 'erase' || tool === 'restore' || tool === 'magicbrush') && (
                <>
                  {slider(t.brushSizeLabel || 'Brush size', brushSize, 4, 300, 1, setBrushSize, 'px')}
                  {tool === 'magicbrush'
                    ? slider(t.toleranceLabel || 'Tolerance', tolerance, 5, 120, 1, setTolerance)
                    : slider(t.hardnessLabel || 'Hardness', Math.round(hardness * 100), 0, 100, 1, v => setHardness(v / 100), '%')}
                </>
              )}

              {tool === 'wand' && (
                <>
                  {slider(t.toleranceLabel || 'Tolerance', tolerance, 5, 120, 1, setTolerance)}
                  <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contiguous}
                      onChange={e => setContiguous(e.target.checked)}
                      className="accent-fuchsia-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    {t.contiguousLabel || 'Contiguous only'}
                  </label>
                </>
              )}

              {tool === 'lasso' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {(['polygon', 'freehand'] as LassoShape[]).map(s => (
                      <button
                        key={s}
                        onClick={() => {
                          cancelLasso();
                          setLassoShape(s);
                        }}
                        className={`px-2 py-2 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          lassoShape === s
                            ? 'bg-fuchsia-500/15 border-fuchsia-500/40 text-fuchsia-300'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {s === 'polygon' ? t.lassoPolygon || 'Corners' : t.lassoFreehand || 'Freehand'}
                      </button>
                    ))}
                  </div>
                  {lassoActive && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={closeLasso}
                        className="py-2 rounded-lg bg-fuchsia-600 text-black text-[10px] font-black uppercase tracking-widest cursor-pointer active:scale-95"
                      >
                        {t.applyBtn || 'Apply'}
                      </button>
                      <button
                        onClick={cancelLasso}
                        className="py-2 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest cursor-pointer"
                      >
                        {t.cancelBtn || 'Cancel'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-1 border-t border-white/5 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                  {t.edgeSectionLabel || 'Edges'}
                </p>
                {slider(t.featherLabel || 'Feather', feather, 0, 12, 1, v => onRefineChange(v, edgeShift), 'px')}
                {slider(t.edgeShiftLabel || 'Edge shift', edgeShift, -8, 8, 1, v => onRefineChange(feather, v), 'px')}
                {slider(t.decontaminateLabel || 'Decontaminate', Math.round(decontaminate * 100), 0, 100, 5, v => setDecontaminate(v / 100), '%')}
              </div>

              <div className="space-y-2">
                <p className="text-[10px] leading-relaxed text-slate-600 font-medium">
                  {tool === 'lasso'
                    ? lassoShape === 'freehand'
                      ? t.lassoFreehandHint || 'Hold and draw the outline. Releasing closes it. Esc cancels.'
                      : t.lassoHint || 'Click to add points; double-click or Enter closes; Esc cancels.'
                    : tool === 'wand'
                    ? t.wandHint || 'Click a colour to erase every pixel like it.'
                    : tool === 'magicbrush'
                    ? t.magicBrushHint || 'Drag over the background: only colours like the first one you touch are removed.'
                    : tool === 'erase'
                    ? t.eraseHint || 'Paint over anything you want to remove.'
                    : tool === 'restore'
                    ? t.restoreHint || 'Paint to bring back parts of the original photo.'
                    : t.panHint || 'Drag to move the canvas. Scroll to zoom.'}
                </p>
                {tool !== 'pan' && (
                  <p className="text-[10px] leading-relaxed text-fuchsia-400/70 font-medium">
                    {t.altHint || 'Hold Alt (or use the right button) to do the opposite without switching tools.'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ---- Background ---- */}
          {panel === 'background' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {swatch(
                  bgKind === 'transparent',
                  {
                    backgroundImage:
                      'linear-gradient(45deg,#333 25%,transparent 25%),linear-gradient(-45deg,#333 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#333 75%),linear-gradient(-45deg,transparent 75%,#333 75%)',
                    backgroundSize: '8px 8px',
                    backgroundPosition: '0 0,0 4px,4px -4px,-4px 0',
                    backgroundColor: '#111',
                  },
                  () => setBgKind('transparent'),
                  t.bgTransparent || 'Transparent'
                )}
                {SOLIDS.map(c =>
                  swatch(bgKind === 'color' && bgColor === c, { background: c }, () => {
                    setBgColor(c);
                    setBgKind('color');
                  }, c)
                )}
                <label
                  title={t.bgCustom || 'Custom colour'}
                  className="w-8 h-8 rounded-lg border-2 border-white/20 hover:border-white/50 cursor-pointer overflow-hidden shrink-0 relative"
                  style={{ background: 'conic-gradient(from 0deg,#f43f5e,#f59e0b,#22c55e,#06b6d4,#8b5cf6,#f43f5e)' }}
                >
                  <input
                    type="color"
                    value={bgColor}
                    onChange={e => {
                      setBgColor(e.target.value);
                      setBgKind('color');
                    }}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                  />
                </label>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                  {t.bgGradientLabel || 'Gradients'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {GRADIENTS.map((g, i) =>
                    swatch(
                      bgKind === 'gradient' && bgGradient === g,
                      { background: `linear-gradient(135deg, ${g[0]}, ${g[1]})` },
                      () => {
                        setBgGradient(g);
                        setBgKind('gradient');
                      },
                      `gradient ${i + 1}`
                    )
                  )}
                </div>
              </div>

              <button
                onClick={() => setBgKind('blur')}
                className={`w-full py-2 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                  bgKind === 'blur'
                    ? 'bg-fuchsia-500/15 border-fuchsia-500/40 text-fuchsia-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {t.bgBlurLabel || 'Blurred original'}
              </button>
              {bgKind === 'blur' && slider(t.blurAmountLabel || 'Blur', bgBlur, 4, 80, 1, setBgBlur, 'px')}

              <label className="block">
                <span className="sr-only">{t.bgImageLabel || 'Custom image'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => e.target.files?.[0] && pickBackgroundImage(e.target.files[0])}
                  className="hidden"
                />
                <span className="block w-full py-2 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest text-center cursor-pointer transition-all">
                  {t.bgImageLabel || 'Custom image'}
                </span>
              </label>

              <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 cursor-pointer pt-1 border-t border-white/5">
                <input
                  type="checkbox"
                  checked={shadow}
                  onChange={e => setShadow(e.target.checked)}
                  className="accent-fuchsia-500 w-3.5 h-3.5 cursor-pointer"
                />
                {t.shadowLabel || 'Drop shadow'}
              </label>
            </div>
          )}

          {/* ---- Export ---- */}
          {panel === 'export' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-1.5">
                {(['png', 'webp', 'jpeg'] as ExportFormat[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`py-2 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      format === f
                        ? 'bg-fuchsia-500/15 border-fuchsia-500/40 text-fuchsia-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {f === 'jpeg' ? 'JPG' : f.toUpperCase()}
                  </button>
                ))}
              </div>
              {format === 'jpeg' && bgKind === 'transparent' && (
                <p className="text-[10px] text-amber-400/80 font-medium leading-relaxed">
                  {t.jpegWarning || 'JPG has no transparency — the cutout will be exported on white.'}
                </p>
              )}

              {slider(t.exportScaleLabel || 'Size', exportScale, 10, 100, 5, setExportScale, '%')}

              <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={trim}
                  onChange={e => setTrim(e.target.checked)}
                  className="accent-fuchsia-500 w-3.5 h-3.5 cursor-pointer"
                />
                <Crop className="w-3.5 h-3.5" />
                {t.trimLabel || 'Trim empty edges'}
              </label>

              <button
                onClick={download}
                disabled={!ready}
                className="w-full py-3 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-black font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-600/25 active:scale-95 cursor-pointer disabled:opacity-40"
              >
                <Download className="w-4 h-4 stroke-[3]" />
                {t.downloadBtn || 'Download'}
              </button>

              <button
                onClick={copyToClipboard}
                disabled={!ready}
                className="w-full py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-fuchsia-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t.copiedLabel || 'Copied' : t.copyBtn || 'Copy image'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile hint for the lasso, which has no visible cancel affordance */}
      {tool === 'lasso' && lassoActive && (
        <button
          onClick={cancelLasso}
          className="lg:hidden w-full py-2 rounded-xl border border-white/10 bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest cursor-pointer flex items-center justify-center gap-2"
        >
          <X className="w-3.5 h-3.5" />
          {t.cancelBtn || 'Cancel'}
        </button>
      )}
    </div>
  );
};

export default Editor;
