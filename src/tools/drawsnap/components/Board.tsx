import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  Circle,
  Copy,
  Crosshair,
  Download,
  Eraser,
  FileCode2,
  Grid3x3,
  Hand,
  Highlighter,
  ImagePlus,
  Keyboard,
  Layers,
  Maximize,
  Minus,
  MousePointer2,
  Palette,
  Pencil,
  Redo2,
  RotateCcw,
  Square,
  Trash2,
  Triangle,
  Type as TypeIcon,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

import type {
  BgPattern,
  Board as BoardSize,
  FreeShape,
  GeoShape,
  ImageShape,
  PendingImage,
  Pt,
  Shape,
  Surface,
  TextShape,
  ToolId,
  Viewport,
} from '../types';
import { BOARD_PRESETS, isFree, isGeo } from '../types';
import { boundsOf, constrain, hitTest, scaleShape, simplify, translateShape, unionBounds } from '../lib/geometry';
import { pressureFor } from '../lib/stroke';
import { SURFACE_COLORS, drawShape, paintPaper, paintShapes, renderToCanvas } from '../lib/render';
import { exportSvg } from '../lib/svg';
import { getBitmap, loadImageFile, releaseBitmaps } from '../lib/images';
import { clearDoc, peekDoc, rehydrateImages, saveDoc, type SavedDoc } from '../lib/persist';
import { TRACE_PRESETS } from '../lib/trace';
import { imageDataFor, runTrace } from '../lib/runTrace';
import { useHandoffIntake } from '../../../lib/useHandoff';
import { ImportPanel, type TraceDetail } from './ImportPanel';
import { NextStepBar } from './NextStepBar';

// ============================================================================
// The workspace: document state, input handling, rendering and export.
// ----------------------------------------------------------------------------
// Everything is stored in board coordinates and painted through a viewport, so
// resizing the window no longer clips the drawing and the export resolution is
// a deliberate choice instead of whatever the container happened to measure.
// ============================================================================

interface BoardProps {
  lang: string;
  t: any;
}

// --------------------------------------------------------------------------
// Document + history
// --------------------------------------------------------------------------
interface DocState {
  shapes: Shape[];
  past: Shape[][];
  future: Shape[][];
}

type DocAction =
  | { type: 'commit'; shapes: Shape[] }
  | { type: 'load'; shapes: Shape[] }
  | { type: 'undo' }
  | { type: 'redo' };

/**
 * History stores arrays of *references* to immutable shapes, not bitmaps: a
 * 1 000-shape board costs about 8 KB per undo step, so 120 steps fit in ~1 MB.
 */
const MAX_HISTORY = 120;

function docReducer(state: DocState, action: DocAction): DocState {
  switch (action.type) {
    case 'commit':
      return {
        shapes: action.shapes,
        past: [...state.past, state.shapes].slice(-MAX_HISTORY),
        future: [],
      };
    case 'load':
      return { shapes: action.shapes, past: [], future: [] };
    case 'undo': {
      if (!state.past.length) return state;
      return {
        shapes: state.past[state.past.length - 1],
        past: state.past.slice(0, -1),
        future: [state.shapes, ...state.future].slice(0, MAX_HISTORY),
      };
    }
    case 'redo': {
      if (!state.future.length) return state;
      return {
        shapes: state.future[0],
        past: [...state.past, state.shapes].slice(-MAX_HISTORY),
        future: state.future.slice(1),
      };
    }
    default:
      return state;
  }
}

const uid = () => `s_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const COLORS = ['#ffffff', '#0f172a', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899'];

const PAINT_TOOLS: ToolId[] = ['pencil', 'marker', 'eraser'];
const GEO_TOOLS: ToolId[] = ['line', 'arrow', 'rect', 'ellipse', 'triangle'];

interface LiveOp {
  kind: 'free' | 'geo' | 'move' | 'scale' | 'marquee' | 'objectErase';
  shape?: Shape;
  /** Board-space anchor for the current gesture. */
  origin: { x: number; y: number };
  last?: { x: number; y: number; t: number };
  pressure: number;
  /** Snapshot of the shapes being moved/scaled, keyed by id. */
  originals?: Map<string, Shape>;
  current?: { x: number; y: number };
  /** True for the temporary eraser (Alt / right button). */
  forcedEraser?: boolean;
}

export const Board: React.FC<BoardProps> = ({ lang, t }) => {
  const [doc, dispatch] = useReducer(docReducer, { shapes: [], past: [], future: [] });

  // Tool + brush -----------------------------------------------------------
  const [tool, setTool] = useState<ToolId>('pencil');
  const [color, setColor] = useState('#ffffff');
  const [width, setWidth] = useState(6);
  const [opacity, setOpacity] = useState(1);
  const [fill, setFill] = useState(false);
  const [eraserMode, setEraserMode] = useState<'pixel' | 'object'>('pixel');

  // Paper ------------------------------------------------------------------
  const [board, setBoard] = useState<BoardSize>({ w: 1920, h: 1080 });
  const [surface, setSurface] = useState<Surface>('dark');
  const [pattern, setPattern] = useState<BgPattern>('dots');

  // Viewport ---------------------------------------------------------------
  const [view, setView] = useState<Viewport>({ scale: 0.5, tx: 0, ty: 0 });
  const [selection, setSelection] = useState<string[]>([]);

  // Chrome -----------------------------------------------------------------
  const [pending, setPending] = useState<PendingImage | null>(null);
  const [busy, setBusy] = useState(false);
  const [traceDetail, setTraceDetail] = useState<TraceDetail>('medium');
  const [sampleColor, setSampleColor] = useState(false);
  const [keepPhoto, setKeepPhoto] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [restorable, setRestorable] = useState<SavedDoc | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [compare, setCompare] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [textEditor, setTextEditor] = useState<{ id?: string; x: number; y: number; value: string } | null>(null);
  const [exportScale, setExportScale] = useState(2);
  const [exportSurface, setExportSurface] = useState<'board' | 'transparent' | 'light'>('board');
  const [exportPattern, setExportPattern] = useState(false);

  // Imperative plumbing ----------------------------------------------------
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ringRef = useRef<HTMLSpanElement>(null);
  const inkRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const liveRef = useRef<LiveOp | null>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ dist: number; scale: number; cx: number; cy: number } | null>(null);
  const panRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const inkSigRef = useRef('');
  const inkListRef = useRef<Shape[] | null>(null);
  /** Bitmap key of the staged import, so cancelling frees exactly that one. */
  const pendingKeyRef = useRef<string | null>(null);
  const viewRef = useRef(view);
  viewRef.current = view;
  const spaceRef = useRef(spaceHeld);
  spaceRef.current = spaceHeld;

  const visibleShapes = useMemo(
    () => (compare ? doc.shapes.filter(s => s.type === 'image') : doc.shapes),
    [doc.shapes, compare]
  );

  // Read-only snapshot for the imperative renderer. Assigned during render, so
  // it is never a stale mirror of state.
  const renderRef = useRef({ board, surface, pattern, view, shapes: visibleShapes, selection });
  renderRef.current = { board, surface, pattern, view, shapes: visibleShapes, selection };

  const commit = useCallback((shapes: Shape[]) => dispatch({ type: 'commit', shapes }), []);

  const flash = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(current => (current === message ? null : current)), 3200);
  }, []);

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------
  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const ink = inkRef.current;
    const frame = frameRef.current;
    if (!canvas || !ink || !frame) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { board: bd, surface: sf, pattern: pt, view: vw, shapes, selection: sel } = renderRef.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const k = dpr * vw.scale;

    // --- ink layer (committed artwork), rebuilt only when it actually changed
    const sig = `${vw.scale}|${vw.tx}|${vw.ty}|${ink.width}|${ink.height}`;
    const inkCtx = ink.getContext('2d');
    if (inkCtx) {
      const prev = inkListRef.current;
      const appendOnly =
        sig === inkSigRef.current &&
        prev !== null &&
        shapes.length === prev.length + 1 &&
        prev.every((s, i) => s === shapes[i]);

      if (appendOnly) {
        inkCtx.setTransform(k, 0, 0, k, dpr * vw.tx, dpr * vw.ty);
        inkCtx.save();
        inkCtx.beginPath();
        inkCtx.rect(0, 0, bd.w, bd.h);
        inkCtx.clip();
        drawShape(inkCtx, shapes[shapes.length - 1]);
        inkCtx.restore();
      } else if (sig !== inkSigRef.current || prev !== shapes) {
        inkCtx.setTransform(1, 0, 0, 1, 0, 0);
        inkCtx.clearRect(0, 0, ink.width, ink.height);
        inkCtx.setTransform(k, 0, 0, k, dpr * vw.tx, dpr * vw.ty);
        inkCtx.save();
        inkCtx.beginPath();
        inkCtx.rect(0, 0, bd.w, bd.h);
        inkCtx.clip();
        paintShapes(inkCtx, shapes);
        inkCtx.restore();
      }
      inkSigRef.current = sig;
      inkListRef.current = shapes;
    }

    // --- live stroke on top of a copy of the ink, so a live eraser cuts ink
    //     without punching a hole through the paper underneath
    const live = liveRef.current;
    let composite: HTMLCanvasElement = ink;
    if (live?.shape) {
      const fctx = frame.getContext('2d');
      if (fctx) {
        fctx.setTransform(1, 0, 0, 1, 0, 0);
        fctx.clearRect(0, 0, frame.width, frame.height);
        fctx.drawImage(ink, 0, 0);
        fctx.setTransform(k, 0, 0, k, dpr * vw.tx, dpr * vw.ty);
        fctx.save();
        fctx.beginPath();
        fctx.rect(0, 0, bd.w, bd.h);
        fctx.clip();
        drawShape(fctx, live.shape);
        fctx.restore();
        composite = frame;
      }
    }

    // --- paper, artwork, overlay
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(k, 0, 0, k, dpr * vw.tx, dpr * vw.ty);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, bd.w, bd.h);
    ctx.clip();
    paintPaper(ctx, bd, sf, pt);
    ctx.restore();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(composite, 0, 0);

    ctx.setTransform(k, 0, 0, k, dpr * vw.tx, dpr * vw.ty);

    // Dim everything outside the paper. Ink is clipped to the board (on screen
    // and on export alike), so the edge has to be unmistakable — otherwise a
    // stroke started in the margin just silently disappears.
    ctx.save();
    ctx.beginPath();
    ctx.rect(-1e6, -1e6, 2e6, 2e6);
    ctx.rect(0, 0, bd.w, bd.h);
    ctx.fillStyle = 'rgba(4,2,8,0.55)';
    ctx.fill('evenodd');
    ctx.restore();

    ctx.lineWidth = 1 / vw.scale;
    ctx.strokeStyle = 'rgba(168,85,247,0.35)';
    ctx.strokeRect(0, 0, bd.w, bd.h);

    if (sel.length) {
      const picked = shapes.filter(s => sel.includes(s.id));
      const box = unionBounds(picked);
      if (box) {
        ctx.setLineDash([6 / vw.scale, 5 / vw.scale]);
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 1.5 / vw.scale;
        ctx.strokeRect(box.x, box.y, box.w, box.h);
        ctx.setLineDash([]);
        const handle = 9 / vw.scale;
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(box.x + box.w - handle / 2, box.y + box.h - handle / 2, handle, handle);
      }
    }

    if (live?.kind === 'marquee' && live.current) {
      ctx.setLineDash([5 / vw.scale, 4 / vw.scale]);
      ctx.strokeStyle = 'rgba(168,85,247,0.9)';
      ctx.fillStyle = 'rgba(168,85,247,0.10)';
      ctx.lineWidth = 1.5 / vw.scale;
      const x = Math.min(live.origin.x, live.current.x);
      const y = Math.min(live.origin.y, live.current.y);
      const w = Math.abs(live.current.x - live.origin.x);
      const h = Math.abs(live.current.y - live.origin.y);
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
    }
  }, []);

  /**
   * requestAnimationFrame never fires while the tab reports hidden, which left
   * the canvas blank when the page was opened in a background tab. Painting
   * synchronously in that case costs nothing and fixes it.
   */
  const schedule = useCallback(() => {
    if (rafRef.current !== null) return;
    if (typeof document !== 'undefined' && document.hidden) {
      paint();
      return;
    }
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      paint();
    });
  }, [paint]);

  // Repaint after every state change.
  useEffect(schedule);

  // -------------------------------------------------------------------------
  // Sizing
  // -------------------------------------------------------------------------
  const resize = useCallback(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width === w && canvas.height === h) return;

    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    if (!inkRef.current) inkRef.current = document.createElement('canvas');
    if (!frameRef.current) frameRef.current = document.createElement('canvas');
    inkRef.current.width = w;
    inkRef.current.height = h;
    frameRef.current.width = w;
    frameRef.current.height = h;
    inkSigRef.current = '';
    inkListRef.current = null;
    schedule();
  }, [schedule]);

  const fit = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const { board: bd } = renderRef.current;
    const scale = Math.min(rect.width / bd.w, rect.height / bd.h) * 0.94;
    setView({ scale, tx: (rect.width - bd.w * scale) / 2, ty: (rect.height - bd.h * scale) / 2 });
  }, []);

  useEffect(() => {
    resize();
    fit();
    const observer = new ResizeObserver(resize);
    if (wrapRef.current) observer.observe(wrapRef.current);
    // ResizeObserver is throttled to zero in hidden tabs, so keep the plain
    // listener as well instead of trusting one mechanism.
    window.addEventListener('resize', resize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, [resize, fit]);

  // Refit when the paper size changes.
  useEffect(() => {
    fit();
  }, [board.w, board.h, fit]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      releaseBitmaps();
    };
  }, []);

  // -------------------------------------------------------------------------
  // Autosave
  // -------------------------------------------------------------------------
  useEffect(() => {
    const saved = peekDoc();
    if (saved) setRestorable(saved);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      saveDoc({ board, surface, pattern, shapes: doc.shapes });
    }, 1200);
    return () => window.clearTimeout(id);
  }, [doc.shapes, board, surface, pattern]);

  const restore = useCallback(async () => {
    if (!restorable) return;
    await rehydrateImages(restorable.images);
    setBoard(restorable.board);
    setSurface(restorable.surface);
    setPattern(restorable.pattern);
    dispatch({ type: 'load', shapes: restorable.shapes });
    setRestorable(null);
    inkSigRef.current = '';
    inkListRef.current = null;
  }, [restorable]);

  // -------------------------------------------------------------------------
  // Coordinates
  // -------------------------------------------------------------------------
  const toBoard = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const v = viewRef.current;
    return { x: (clientX - rect.left - v.tx) / v.scale, y: (clientY - rect.top - v.ty) / v.scale };
  }, []);

  const zoomAt = useCallback((factor: number, clientX?: number, clientY?: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = (clientX ?? rect.left + rect.width / 2) - rect.left;
    const cy = (clientY ?? rect.top + rect.height / 2) - rect.top;
    setView(prev => {
      const scale = Math.max(0.05, Math.min(8, prev.scale * factor));
      const ratio = scale / prev.scale;
      return { scale, tx: cx - (cx - prev.tx) * ratio, ty: cy - (cy - prev.ty) * ratio };
    });
  }, []);

  // Non-passive wheel listener: React registers wheel passively, so
  // preventDefault() from a JSX handler is ignored and the page scrolls away
  // under the cursor mid-zoom.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return; // plain wheel keeps scrolling the page
      event.preventDefault();
      zoomAt(event.deltaY < 0 ? 1.12 : 1 / 1.12, event.clientX, event.clientY);
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  // -------------------------------------------------------------------------
  // Drawing
  // -------------------------------------------------------------------------
  const effectiveTool = useCallback(
    (forcedEraser: boolean): ToolId => (forcedEraser ? 'eraser' : tool),
    [tool]
  );

  // The marker is wider than the pencil by nature, but it never rewrites the
  // user's own settings the way the old tool did when you clicked it.
  const makeFree = (type: FreeShape['type'], p: Pt): FreeShape => ({
    id: uid(),
    type,
    points: [p],
    color,
    width: type === 'marker' ? width * 2.2 : width,
    opacity,
  });

  const makeGeo = (type: GeoShape['type'], a: Pt): GeoShape => ({
    id: uid(),
    type,
    a,
    b: a,
    color,
    width,
    opacity,
    fill,
  });

  const eraseObjectsAt = useCallback(
    (point: { x: number; y: number }) => {
      const slack = 6 / viewRef.current.scale;
      const survivors = doc.shapes.filter(s => !hitTest(s, point, slack));
      if (survivors.length !== doc.shapes.length) commit(survivors);
    },
    [doc.shapes, commit]
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      // The pointer can already be gone (fast taps, synthetic events); capture
      // is an optimisation, not a requirement.
    }
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    // Two fingers: pinch-zoom / pan, and cancel whatever stroke started.
    if (pointersRef.current.size === 2) {
      const [a, b] = Array.from(pointersRef.current.values());
      liveRef.current = null;
      panRef.current = null;
      pinchRef.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        scale: viewRef.current.scale,
        cx: (a.x + b.x) / 2,
        cy: (a.y + b.y) / 2,
      };
      schedule();
      return;
    }

    const panning = spaceRef.current || event.button === 1;
    if (panning) {
      panRef.current = { x: event.clientX, y: event.clientY, tx: view.tx, ty: view.ty };
      return;
    }

    const forcedEraser = event.altKey || event.button === 2;
    const active = effectiveTool(forcedEraser);
    const point = toBoard(event.clientX, event.clientY);
    const pt: Pt = { x: point.x, y: point.y, p: event.pointerType === 'pen' ? event.pressure || 0.5 : 1 };

    if (active === 'eraser' && eraserMode === 'object' && !forcedEraser) {
      eraseObjectsAt(point);
      liveRef.current = { kind: 'objectErase', origin: point, pressure: 1 };
      return;
    }

    if (active === 'text') {
      const existing = [...doc.shapes].reverse().find(s => s.type === 'text' && hitTest(s, point, 4)) as
        | TextShape
        | undefined;
      setTextEditor(
        existing
          ? { id: existing.id, x: existing.a.x, y: existing.a.y, value: existing.text }
          : { x: point.x, y: point.y, value: '' }
      );
      return;
    }

    if (active === 'select') {
      const box = unionBounds(doc.shapes.filter(s => selection.includes(s.id)));
      const handleSize = 12 / viewRef.current.scale;
      if (
        box &&
        Math.abs(point.x - (box.x + box.w)) < handleSize &&
        Math.abs(point.y - (box.y + box.h)) < handleSize
      ) {
        const originals = new Map(doc.shapes.filter(s => selection.includes(s.id)).map(s => [s.id, s]));
        liveRef.current = { kind: 'scale', origin: { x: box.x, y: box.y }, pressure: 1, originals, current: point };
        return;
      }

      const hit = [...doc.shapes].reverse().find(s => hitTest(s, point, 6 / viewRef.current.scale));
      if (hit) {
        const next = event.shiftKey
          ? selection.includes(hit.id)
            ? selection.filter(id => id !== hit.id)
            : [...selection, hit.id]
          : selection.includes(hit.id)
          ? selection
          : [hit.id];
        setSelection(next);
        const originals = new Map(doc.shapes.filter(s => next.includes(s.id)).map(s => [s.id, s]));
        liveRef.current = { kind: 'move', origin: point, pressure: 1, originals, current: point };
      } else {
        if (!event.shiftKey) setSelection([]);
        liveRef.current = { kind: 'marquee', origin: point, pressure: 1, current: point };
      }
      schedule();
      return;
    }

    if (PAINT_TOOLS.includes(active)) {
      const shape = makeFree(active as FreeShape['type'], pt);
      if (forcedEraser) {
        shape.type = 'eraser';
        shape.width = width * 1.6;
        shape.opacity = 1;
      }
      liveRef.current = {
        kind: 'free',
        shape,
        origin: point,
        last: { x: point.x, y: point.y, t: performance.now() },
        pressure: pt.p,
        forcedEraser,
      };
    } else if (GEO_TOOLS.includes(active)) {
      liveRef.current = { kind: 'geo', shape: makeGeo(active as GeoShape['type'], pt), origin: point, pressure: 1 };
    }
    schedule();
  };

  /**
   * The brush ring is moved by touching the DOM node directly. Holding the
   * cursor position in state would re-render the whole workspace on every
   * pointermove — and would also blow away the in-flight move preview stored
   * in renderRef.
   */
  const moveRing = (clientX: number, clientY: number) => {
    const ring = ringRef.current;
    const wrap = wrapRef.current;
    if (!ring || !wrap) return;
    if (!PAINT_TOOLS.includes(tool)) {
      ring.style.display = 'none';
      return;
    }
    const rect = wrap.getBoundingClientRect();
    const size = Math.max(6, (tool === 'marker' ? width * 2.2 : width) * viewRef.current.scale);
    ring.style.display = 'block';
    ring.style.width = `${size}px`;
    ring.style.height = `${size}px`;
    ring.style.transform = `translate(${clientX - rect.left - size / 2}px, ${clientY - rect.top - size / 2}px)`;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (pointersRef.current.has(event.pointerId)) {
      pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }
    moveRing(event.clientX, event.clientY);

    // Pinch
    if (pinchRef.current && pointersRef.current.size === 2) {
      const [a, b] = Array.from(pointersRef.current.values());
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const factor = dist / pinchRef.current.dist;
      const cx = (a.x + b.x) / 2 - rect.left;
      const cy = (a.y + b.y) / 2 - rect.top;
      setView(prev => {
        const scale = Math.max(0.05, Math.min(8, pinchRef.current!.scale * factor));
        const ratio = scale / prev.scale;
        return { scale, tx: cx - (cx - prev.tx) * ratio, ty: cy - (cy - prev.ty) * ratio };
      });
      return;
    }

    if (panRef.current) {
      const start = panRef.current;
      setView(prev => ({ ...prev, tx: start.tx + (event.clientX - start.x), ty: start.ty + (event.clientY - start.y) }));
      return;
    }

    const live = liveRef.current;
    if (!live) return;
    const point = toBoard(event.clientX, event.clientY);

    if (live.kind === 'objectErase') {
      eraseObjectsAt(point);
      return;
    }

    if (live.kind === 'free' && live.shape && isFree(live.shape)) {
      const now = performance.now();
      const last = live.last!;
      const dt = Math.max(1, now - last.t);
      const speed = Math.hypot(point.x - last.x, point.y - last.y) / dt;
      const pressure = pressureFor(event.pointerType, event.pressure, speed, live.pressure);
      live.pressure = pressure;
      live.last = { x: point.x, y: point.y, t: now };

      // getCoalescedEvents recovers the samples the browser batched away —
      // without it, fast strokes come out as visible straight segments.
      const samples =
        typeof event.nativeEvent.getCoalescedEvents === 'function'
          ? event.nativeEvent.getCoalescedEvents()
          : [event.nativeEvent];
      for (const sample of samples.length ? samples : [event.nativeEvent]) {
        const p = toBoard(sample.clientX, sample.clientY);
        live.shape.points.push({ x: p.x, y: p.y, p: pressure });
      }
    } else if (live.kind === 'geo' && live.shape && isGeo(live.shape)) {
      const raw: Pt = { x: point.x, y: point.y, p: 1 };
      live.shape.b = event.shiftKey
        ? constrain(live.shape.a, raw, live.shape.type === 'line' || live.shape.type === 'arrow' ? 'line' : 'box')
        : raw;
    } else if (live.kind === 'move' && live.originals?.size) {
      const dx = point.x - live.origin.x;
      const dy = point.y - live.origin.y;
      const moved = doc.shapes.map(s => {
        const original = live.originals!.get(s.id);
        return original ? translateShape(original, dx, dy) : s;
      });
      inkListRef.current = null;
      renderRef.current = { ...renderRef.current, shapes: moved };
      live.current = point;
      schedule();
      return;
    } else if (live.kind === 'scale' && live.originals?.size) {
      const box = unionBounds(Array.from(live.originals.values()));
      if (box) {
        const from = Math.hypot(box.w, box.h) || 1;
        const to = Math.hypot(point.x - box.x, point.y - box.y) || 1;
        const factor = Math.max(0.05, to / from);
        const scaled = doc.shapes.map(s => {
          const original = live.originals!.get(s.id);
          return original ? scaleShape(original, { x: box.x, y: box.y }, factor) : s;
        });
        inkListRef.current = null;
        renderRef.current = { ...renderRef.current, shapes: scaled };
        live.current = point;
        schedule();
      }
      return;
    } else if (live.kind === 'marquee') {
      live.current = point;
    }

    schedule();
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas?.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    panRef.current = null;

    const live = liveRef.current;
    liveRef.current = null;
    if (!live) {
      schedule();
      return;
    }

    if (live.kind === 'free' && live.shape && isFree(live.shape)) {
      const shape = live.shape;
      // Simplify on commit: a four-second scribble arrives as ~900 samples and
      // leaves as ~120 without any visible change.
      shape.points = simplify(shape.points, 0.6);
      commit([...doc.shapes, shape]);
    } else if (live.kind === 'geo' && live.shape && isGeo(live.shape)) {
      const shape = live.shape;
      const tiny = Math.hypot(shape.b.x - shape.a.x, shape.b.y - shape.a.y) < 2;
      if (!tiny) commit([...doc.shapes, shape]);
    } else if ((live.kind === 'move' || live.kind === 'scale') && live.originals?.size) {
      const next = renderRef.current.shapes;
      if (next !== doc.shapes) commit(next as Shape[]);
    } else if (live.kind === 'marquee' && live.current) {
      const x = Math.min(live.origin.x, live.current.x);
      const y = Math.min(live.origin.y, live.current.y);
      const w = Math.abs(live.current.x - live.origin.x);
      const h = Math.abs(live.current.y - live.origin.y);
      if (w > 4 || h > 4) {
        const inside = doc.shapes.filter(s => {
          const b = boundsOf(s);
          return b.x + b.w >= x && b.x <= x + w && b.y + b.h >= y && b.y <= y + h;
        });
        setSelection(inside.map(s => s.id));
      }
    }
    schedule();
  };

  // -------------------------------------------------------------------------
  // Text editing
  // -------------------------------------------------------------------------
  const commitText = useCallback(() => {
    if (!textEditor) return;
    const value = textEditor.value.trim();
    const existing = textEditor.id;
    if (!value) {
      if (existing) commit(doc.shapes.filter(s => s.id !== existing));
      setTextEditor(null);
      return;
    }
    if (existing) {
      commit(doc.shapes.map(s => (s.id === existing ? { ...(s as TextShape), text: value } : s)));
    } else {
      const shape: TextShape = {
        id: uid(),
        type: 'text',
        a: { x: textEditor.x, y: textEditor.y, p: 1 },
        text: value,
        size: Math.max(14, width * 4),
        color,
        width,
        opacity,
      };
      commit([...doc.shapes, shape]);
    }
    setTextEditor(null);
  }, [textEditor, doc.shapes, commit, color, width, opacity]);

  // -------------------------------------------------------------------------
  // Intake — nothing runs until the user asks for it
  // -------------------------------------------------------------------------
  const stageFile = useCallback(
    async (file: File, from?: string) => {
      const loaded = await loadImageFile(file);
      if (!loaded) {
        flash(t.errorUnsupported || 'That file could not be decoded as an image.');
        return;
      }
      // Only the previous *staged* bitmap is freed — anything already on the
      // board keeps its pixels.
      if (pendingKeyRef.current) releaseBitmaps([pendingKeyRef.current]);
      pendingKeyRef.current = loaded.key;
      setPending({ name: loaded.name, url: loaded.url, width: loaded.width, height: loaded.height, from });
    },
    [flash, t]
  );

  const discardPending = useCallback(() => {
    if (pendingKeyRef.current) releaseBitmaps([pendingKeyRef.current]);
    pendingKeyRef.current = null;
    setPending(null);
  }, []);

  useHandoffIntake((file, from) => {
    void stageFile(file, from);
  });

  const placeImage = useCallback(
    (key: string, img: PendingImage): ImageShape => {
      const bd = renderRef.current.board;
      const fitScale = Math.min((bd.w * 0.8) / img.width, (bd.h * 0.8) / img.height, 1);
      const w = img.width * fitScale;
      const h = img.height * fitScale;
      return {
        id: uid(),
        type: 'image',
        a: { x: (bd.w - w) / 2, y: (bd.h - h) / 2, p: 1 },
        b: { x: (bd.w + w) / 2, y: (bd.h + h) / 2, p: 1 },
        src: key,
        color: '#ffffff',
        width: 1,
        opacity: 1,
      };
    },
    []
  );

  const handlePlace = useCallback(() => {
    const key = pendingKeyRef.current;
    if (!pending || !key) return;
    commit([...doc.shapes, placeImage(key, pending)]);
    // The bitmap now belongs to the board, so it must NOT be released here.
    pendingKeyRef.current = null;
    setPending(null);
    setTool('pencil');
  }, [pending, doc.shapes, commit, placeImage]);

  const handleTrace = useCallback(async () => {
    const key = pendingKeyRef.current;
    if (!pending || !key || busy) return;

    setBusy(true);
    try {
      const img = getBitmap(key);
      if (!img) throw new Error('missing bitmap');

      const prepared = imageDataFor(img);
      if (!prepared) throw new Error('no image data');

      const preset = { ...TRACE_PRESETS[traceDetail], sampleColor };
      const result = await runTrace(prepared.data, preset);

      const bd = renderRef.current.board;
      const fitScale = Math.min((bd.w * 0.8) / pending.width, (bd.h * 0.8) / pending.height, 1);
      const drawW = pending.width * fitScale;
      const drawH = pending.height * fitScale;
      const offsetX = (bd.w - drawW) / 2;
      const offsetY = (bd.h - drawH) / 2;
      // Trace space is the downscaled bitmap; map it onto the placed picture.
      const k = drawW / (pending.width * prepared.scale);

      const strokes: Shape[] = result.paths.map(path => ({
        id: uid(),
        type: 'pencil' as const,
        points: path.points.map(p => ({ x: offsetX + p.x * k, y: offsetY + p.y * k, p: 0.85 })),
        color: path.color || color,
        width: Math.max(1, width * 0.5),
        opacity: 1,
      }));

      const base = keepPhoto ? [...doc.shapes, placeImage(key, pending)] : doc.shapes;
      commit([...base, ...strokes]);
      if (keepPhoto) {
        // The board owns the bitmap now; releasing it would blank the photo.
        pendingKeyRef.current = null;
        setPending(null);
      } else {
        discardPending();
      }
      setTool('select');
      flash(
        (t.traceDone || '{n} editable strokes in {ms} ms{thread}')
          .replace('{n}', String(strokes.length))
          .replace('{ms}', String(result.ms))
          .replace('{thread}', result.offThread ? ` · ${t.traceWorker || 'worker thread'}` : '')
      );
    } catch {
      flash(t.traceFailed || 'Tracing failed. You can still place the picture and draw over it.');
    } finally {
      setBusy(false);
    }
  }, [pending, busy, traceDetail, sampleColor, keepPhoto, doc.shapes, commit, placeImage, discardPending, color, width, flash, t]);

  const openFiles = (files: FileList | File[] | null) => {
    const list = Array.from(files || []);
    if (list.length) void stageFile(list[0]);
  };

  // Paste an image straight onto the board.
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const item = Array.from(event.clipboardData?.items || []).find(i => i.type.startsWith('image/'));
      if (!item) return;
      const file = item.getAsFile();
      if (file) {
        event.preventDefault();
        void stageFile(file, 'clipboard');
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [stageFile]);

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------
  const deleteSelection = useCallback(() => {
    if (!selection.length) return;
    commit(doc.shapes.filter(s => !selection.includes(s.id)));
    setSelection([]);
  }, [selection, doc.shapes, commit]);

  const duplicateSelection = useCallback(() => {
    if (!selection.length) return;
    const copies = doc.shapes
      .filter(s => selection.includes(s.id))
      .map(s => ({ ...translateShape(s, 24, 24), id: uid() }));
    commit([...doc.shapes, ...copies]);
    setSelection(copies.map(s => s.id));
  }, [selection, doc.shapes, commit]);

  const applyToSelection = useCallback(
    (patch: Partial<Pick<Shape, 'color' | 'width' | 'opacity'>>) => {
      if (!selection.length) return;
      commit(doc.shapes.map(s => (selection.includes(s.id) ? ({ ...s, ...patch } as Shape) : s)));
    },
    [selection, doc.shapes, commit]
  );

  const clearBoard = useCallback(() => {
    if (!doc.shapes.length) return;
    commit([]);
    setSelection([]);
    clearDoc();
  }, [doc.shapes.length, commit]);

  // -------------------------------------------------------------------------
  // Export
  // -------------------------------------------------------------------------
  const exportSurfaceValue: Surface =
    exportSurface === 'board' ? surface : exportSurface === 'light' ? 'light' : 'transparent';

  const buildCanvas = useCallback(
    (scale: number) =>
      renderToCanvas({
        board,
        shapes: doc.shapes,
        surface: exportSurfaceValue,
        pattern: exportPattern ? pattern : 'none',
        scale,
      }),
    [board, doc.shapes, exportSurfaceValue, exportPattern, pattern]
  );

  const download = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Keep the URL alive while the browser consumes a potentially large export.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const exportPng = useCallback(() => {
    const canvas = buildCanvas(exportScale);
    canvas.toBlob(blob => {
      if (!blob) return;
      download(blob, `drawsnap-${Date.now()}.png`);
      flash(
        (t.exportedPng || 'PNG exported at {w} × {h}')
          .replace('{w}', String(canvas.width))
          .replace('{h}', String(canvas.height))
      );
    }, 'image/png');
  }, [buildCanvas, exportScale, flash, t]);

  const exportSvgFile = useCallback(() => {
    const markup = exportSvg({
      board,
      shapes: doc.shapes,
      surface: exportSurfaceValue,
      pattern: exportPattern ? pattern : 'none',
    });
    download(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }), `drawsnap-${Date.now()}.svg`);
    flash((t.exportedSvg || 'SVG exported · {n} vector shapes').replace('{n}', String(doc.shapes.length)));
  }, [board, doc.shapes, exportSurfaceValue, exportPattern, pattern, flash, t]);

  const copyPng = useCallback(async () => {
    try {
      const canvas = buildCanvas(exportScale);
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('encode');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      flash(t.copied || 'Copied to the clipboard');
    } catch {
      flash(t.copyFailed || 'Your browser blocked the clipboard. Use the PNG button instead.');
    }
  }, [buildCanvas, exportScale, flash, t]);

  const getResult = useCallback(async () => {
    const canvas = buildCanvas(2);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
    return blob ? { blob, name: `drawsnap-${Date.now()}.png` } : null;
  }, [buildCanvas]);

  // -------------------------------------------------------------------------
  // Keyboard
  // -------------------------------------------------------------------------
  useEffect(() => {
    const isTyping = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTyping(event.target)) return;
      const meta = event.ctrlKey || event.metaKey;

      if (meta && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        dispatch({ type: event.shiftKey ? 'redo' : 'undo' });
        return;
      }
      if (meta && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        dispatch({ type: 'redo' });
        return;
      }
      if (meta && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        duplicateSelection();
        return;
      }
      if (meta && event.key === '0') {
        event.preventDefault();
        fit();
        return;
      }
      if (meta) return;

      switch (event.key) {
        case ' ':
          setSpaceHeld(true);
          event.preventDefault();
          break;
        case 'Delete':
        case 'Backspace':
          deleteSelection();
          break;
        case 'Escape':
          setSelection([]);
          setTextEditor(null);
          break;
        case '[':
          setWidth(w => Math.max(1, w - 1));
          break;
        case ']':
          setWidth(w => Math.min(80, w + 1));
          break;
        case '+':
        case '=':
          zoomAt(1.15);
          break;
        case '-':
          zoomAt(1 / 1.15);
          break;
        default: {
          const key = event.key.toLowerCase();
          const map: Record<string, ToolId> = {
            v: 'select',
            p: 'pencil',
            b: 'marker',
            e: 'eraser',
            l: 'line',
            a: 'arrow',
            r: 'rect',
            o: 'ellipse',
            g: 'triangle',
            t: 'text',
          };
          if (map[key]) setTool(map[key]);
          if (key === 'h') setCompare(true);
        }
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === ' ') setSpaceHeld(false);
      if (event.key.toLowerCase() === 'h') setCompare(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [deleteSelection, duplicateSelection, fit, zoomAt]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  const tools: { id: ToolId; icon: React.ReactNode; label: string; key: string }[] = [
    { id: 'select', icon: <MousePointer2 className="w-4 h-4" />, label: t.tool_select || 'Select', key: 'V' },
    { id: 'pencil', icon: <Pencil className="w-4 h-4" />, label: t.tool_pencil || 'Pencil', key: 'P' },
    { id: 'marker', icon: <Highlighter className="w-4 h-4" />, label: t.tool_marker || 'Marker', key: 'B' },
    { id: 'eraser', icon: <Eraser className="w-4 h-4" />, label: t.tool_eraser || 'Eraser', key: 'E' },
    { id: 'line', icon: <Minus className="w-4 h-4" />, label: t.tool_line || 'Line', key: 'L' },
    { id: 'arrow', icon: <ArrowUpRight className="w-4 h-4" />, label: t.tool_arrow || 'Arrow', key: 'A' },
    { id: 'rect', icon: <Square className="w-4 h-4" />, label: t.tool_rect || 'Rectangle', key: 'R' },
    { id: 'ellipse', icon: <Circle className="w-4 h-4" />, label: t.tool_circle || 'Ellipse', key: 'O' },
    { id: 'triangle', icon: <Triangle className="w-4 h-4" />, label: t.tool_triangle || 'Triangle', key: 'G' },
    { id: 'text', icon: <TypeIcon className="w-4 h-4" />, label: t.tool_text || 'Text', key: 'T' },
  ];

  const patterns: { id: BgPattern; label: string }[] = [
    { id: 'dots', label: t.patternDots || 'Dots' },
    { id: 'grid', label: t.patternGrid || 'Grid' },
    { id: 'lines', label: t.patternLines || 'Lines' },
    { id: 'none', label: t.patternNone || 'Plain' },
  ];

  const canvasCursor = spaceHeld
    ? 'grab'
    : tool === 'select'
    ? 'default'
    : tool === 'text'
    ? 'text'
    : 'none';

  return (
    <div className="space-y-4">
      {/* ---------------------------------------------------------------- */}
      {/* Restore banner                                                    */}
      {/* ---------------------------------------------------------------- */}
      {restorable && !doc.shapes.length && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-purple-500/25 bg-purple-500/5 px-4 py-3">
          <Layers className="w-4 h-4 text-purple-400 shrink-0" />
          <p className="text-xs text-slate-300 font-semibold flex-1 min-w-[200px]">
            {(t.restoreFound || 'A board with {n} shapes was saved in this browser.').replace(
              '{n}',
              String(restorable.shapes.length)
            )}
          </p>
          <button
            onClick={restore}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer"
          >
            {t.restoreBtn || 'Restore it'}
          </button>
          <button
            onClick={() => {
              clearDoc();
              setRestorable(null);
            }}
            className="px-4 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer"
          >
            {t.restoreDismiss || 'Start blank'}
          </button>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Staged import                                                     */}
      {/* ---------------------------------------------------------------- */}
      {pending && (
        <ImportPanel
          t={t}
          pending={pending}
          busy={busy}
          detail={traceDetail}
          onDetail={setTraceDetail}
          sampleColor={sampleColor}
          onSampleColor={setSampleColor}
          keepPhoto={keepPhoto}
          onKeepPhoto={setKeepPhoto}
          onPlace={handlePlace}
          onTrace={handleTrace}
          onCancel={discardPending}
        />
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Top bar                                                           */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/5 bg-black/30 px-3 py-2.5">
        <div className="flex items-center gap-1">
          <button
            onClick={() => dispatch({ type: 'undo' })}
            disabled={!doc.past.length}
            title={`${t.btn_undo || 'Undo'} · Ctrl+Z`}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-20 transition-colors cursor-pointer"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => dispatch({ type: 'redo' })}
            disabled={!doc.future.length}
            title={`${t.btn_redo || 'Redo'} · Ctrl+Shift+Z`}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-20 transition-colors cursor-pointer"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <button
            onClick={clearBoard}
            disabled={!doc.shapes.length}
            title={t.btn_clear || 'Clear board'}
            className="p-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-white/5 disabled:opacity-20 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <span className="h-6 w-px bg-white/10" />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-[11px] font-bold transition-colors cursor-pointer"
        >
          <ImagePlus className="w-3.5 h-3.5 text-purple-400" />
          {t.importBtn || 'Add image'}
        </button>

        <span className="h-6 w-px bg-white/10 hidden sm:block" />

        <div className="flex items-center gap-1">
          <button
            onClick={() => zoomAt(1 / 1.2)}
            title={t.zoomOut || 'Zoom out'}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={fit}
            title={`${t.zoomFit || 'Fit'} · Ctrl+0`}
            className="px-2 py-1.5 rounded-xl text-[11px] font-black tabular-nums text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer min-w-[52px]"
          >
            {Math.round(view.scale * 100)}%
          </button>
          <button
            onClick={() => zoomAt(1.2)}
            title={t.zoomIn || 'Zoom in'}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={fit}
            title={t.zoomFit || 'Fit to screen'}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 tabular-nums hidden md:inline">
            {(t.shapeCount || '{n} shapes').replace('{n}', String(doc.shapes.length))}
          </span>
          <button
            onClick={() => setShowShortcuts(v => !v)}
            title={t.shortcutsTitle || 'Keyboard shortcuts'}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Workspace                                                         */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Properties */}
        <aside className="w-full lg:w-60 lg:shrink-0 space-y-3 rounded-2xl border border-white/5 bg-black/30 p-3.5">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 mb-2">
              <Palette className="w-3 h-3 text-purple-400" />
              {t.label_color || 'Colour'}
            </span>
            <div className="grid grid-cols-5 gap-1.5">
              {COLORS.map(preset => (
                <button
                  key={preset}
                  onClick={() => {
                    setColor(preset);
                    applyToSelection({ color: preset });
                  }}
                  aria-label={preset}
                  className={`h-7 rounded-lg border transition-transform hover:scale-110 cursor-pointer ${
                    color === preset ? 'border-purple-400 scale-105' : 'border-white/10'
                  }`}
                  style={{ backgroundColor: preset }}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="color"
                value={/^#[0-9a-f]{6}$/i.test(color) ? color : '#ffffff'}
                onChange={e => {
                  setColor(e.target.value);
                  applyToSelection({ color: e.target.value });
                }}
                className="w-8 h-8 rounded-lg bg-transparent border border-white/10 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white font-mono uppercase focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="border-t border-white/5 pt-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {t.label_brush_size || 'Size'}
              </span>
              <span className="text-[11px] font-mono text-purple-400 tabular-nums">{width}px</span>
            </div>
            {/* Applied to the selection on release, not on every input event:
                otherwise dragging the slider once fills the undo history. */}
            <input
              type="range"
              min={1}
              max={80}
              value={width}
              onChange={e => setWidth(parseInt(e.target.value, 10))}
              onPointerUp={() => applyToSelection({ width })}
              onKeyUp={() => applyToSelection({ width })}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>

          <div className="border-t border-white/5 pt-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {t.label_opacity || 'Opacity'}
              </span>
              <span className="text-[11px] font-mono text-purple-400 tabular-nums">{Math.round(opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.05}
              value={opacity}
              onChange={e => setOpacity(parseFloat(e.target.value))}
              onPointerUp={() => applyToSelection({ opacity })}
              onKeyUp={() => applyToSelection({ opacity })}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>

          {GEO_TOOLS.includes(tool) && (
            <label className="border-t border-white/5 pt-3 flex items-center justify-between text-[11px] font-bold text-slate-300 cursor-pointer">
              {t.label_fill || 'Fill shapes'}
              <input
                type="checkbox"
                checked={fill}
                onChange={e => setFill(e.target.checked)}
                className="accent-purple-500 w-4 h-4 cursor-pointer"
              />
            </label>
          )}

          {tool === 'eraser' && (
            <div className="border-t border-white/5 pt-3 space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {t.eraserMode || 'Eraser mode'}
              </span>
              <div className="flex gap-1 p-1 rounded-xl bg-black/40 border border-white/5">
                {(['pixel', 'object'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setEraserMode(mode)}
                    className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                      eraserMode === mode ? 'bg-purple-500/25 text-purple-200' : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    {mode === 'pixel' ? t.eraserPixel || 'Ink' : t.eraserObject || 'Whole stroke'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-white/5 pt-3 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <Grid3x3 className="w-3 h-3 text-purple-400" />
              {t.label_paper || 'Paper'}
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {patterns.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPattern(p.id)}
                  className={`px-2 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-colors cursor-pointer ${
                    pattern === p.id
                      ? 'border-purple-500/40 bg-purple-500/15 text-purple-200'
                      : 'border-white/5 text-slate-500 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              {(['dark', 'light', 'transparent'] as Surface[]).map(s => (
                <button
                  key={s}
                  onClick={() => setSurface(s)}
                  title={s}
                  className={`flex-1 h-7 rounded-lg border transition-all cursor-pointer ${
                    surface === s ? 'border-purple-400 scale-[1.03]' : 'border-white/10'
                  }`}
                  style={{
                    background:
                      s === 'transparent'
                        ? 'repeating-conic-gradient(#2a2438 0% 25%, #1a1626 0% 50%) 50%/12px 12px'
                        : SURFACE_COLORS[s as 'dark' | 'light'],
                  }}
                />
              ))}
            </div>
            <select
              value={`${board.w}x${board.h}`}
              onChange={e => {
                const preset = BOARD_PRESETS.find(p => `${p.w}x${p.h}` === e.target.value);
                if (preset) setBoard({ w: preset.w, h: preset.h });
              }}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              {BOARD_PRESETS.map(preset => (
                <option key={preset.id} value={`${preset.w}x${preset.h}`}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>
        </aside>

        {/* Canvas. `lg:flex-1`, never a bare `flex-1`: on the mobile
            flex-col layout that would set flex-basis on the vertical axis and
            collapse the whole column. */}
        <div className="w-full lg:flex-1 min-w-0 space-y-3">
          <div
            ref={wrapRef}
            onDragOver={e => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault();
              setDragOver(false);
              openFiles(e.dataTransfer?.files || null);
            }}
            className={`relative h-[58vh] min-h-[380px] lg:h-[66vh] w-full rounded-3xl overflow-hidden border transition-colors ${
              dragOver ? 'border-purple-500/60' : 'border-white/10'
            } bg-[#0a0710] glow-purple`}
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0 touch-none select-none"
              style={{ cursor: canvasCursor }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onPointerLeave={() => {
                if (ringRef.current) ringRef.current.style.display = 'none';
              }}
              onContextMenu={e => e.preventDefault()}
            />

            {/* Brush size preview — positioned imperatively, see moveRing(). */}
            <span
              ref={ringRef}
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-0 rounded-full border border-white/70 mix-blend-difference"
              style={{ display: 'none' }}
            />

            {textEditor && (
              <textarea
                autoFocus
                value={textEditor.value}
                onChange={e => setTextEditor({ ...textEditor, value: e.target.value })}
                onBlur={commitText}
                onKeyDown={e => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setTextEditor(null);
                  }
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    commitText();
                  }
                }}
                placeholder={t.textPlaceholder || 'Type…'}
                className="absolute z-20 min-w-[140px] resize bg-black/70 border border-purple-500/50 rounded-lg px-2 py-1 text-white outline-none"
                style={{
                  left: textEditor.x * view.scale + view.tx,
                  top: textEditor.y * view.scale + view.ty,
                  fontSize: Math.max(12, width * 4 * view.scale),
                  lineHeight: 1.25,
                  color,
                }}
              />
            )}

            {/* Tool dock */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex flex-wrap justify-center items-center gap-1 p-1.5 bg-[#120d20]/92 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl max-w-[calc(100%-1.5rem)]">
              {tools.map(item => (
                <button
                  key={item.id}
                  onClick={() => setTool(item.id)}
                  title={`${item.label} · ${item.key}`}
                  aria-pressed={tool === item.id}
                  className={`p-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center ${
                    tool === item.id
                      ? 'bg-purple-500 text-black'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.icon}
                </button>
              ))}
            </div>

            {/* Hints */}
            <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
              {!doc.shapes.length && !pending && (
                <span className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-[11px] text-slate-400 font-semibold">
                  {t.emptyHint || 'Draw straight away, or drop an image to trace it.'}
                </span>
              )}
              {compare && (
                <span className="px-3 py-1.5 rounded-xl bg-purple-600/80 text-[11px] text-white font-black uppercase tracking-widest">
                  {t.compareOn || 'Showing the picture only'}
                </span>
              )}
            </div>

            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
              <span className="px-2.5 py-1.5 rounded-xl bg-black/60 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-500 hidden sm:flex items-center gap-1.5">
                <Hand className="w-3 h-3" />
                {t.panHint || 'Space to pan'}
              </span>
              <span className="px-2.5 py-1.5 rounded-xl bg-black/60 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-500 hidden md:flex items-center gap-1.5">
                <Crosshair className="w-3 h-3" />
                {t.altHint || 'Alt = erase'}
              </span>
            </div>
          </div>

          {/* Export bar */}
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/5 bg-black/30 px-3 py-2.5">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/5">
              {[1, 2, 4].map(scale => (
                <button
                  key={scale}
                  onClick={() => setExportScale(scale)}
                  title={`${board.w * scale} × ${board.h * scale}`}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                    exportScale === scale ? 'bg-purple-500/25 text-purple-200' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  {scale}×
                </button>
              ))}
            </div>

            <select
              value={exportSurface}
              onChange={e => setExportSurface(e.target.value as typeof exportSurface)}
              className="bg-black/40 border border-white/10 rounded-xl px-2 py-2 text-[11px] text-slate-300 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="board">{t.exportBgBoard || 'Board background'}</option>
              <option value="transparent">{t.exportBgTransparent || 'Transparent'}</option>
              <option value="light">{t.exportBgLight || 'White'}</option>
            </select>

            <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={exportPattern}
                onChange={e => setExportPattern(e.target.checked)}
                className="accent-purple-500 w-3.5 h-3.5 cursor-pointer"
              />
              {t.exportGrid || 'Include grid'}
            </label>

            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 tabular-nums hidden lg:inline">
              {board.w * exportScale} × {board.h * exportScale}
            </span>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <button
                onClick={copyPng}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-[11px] font-bold transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-purple-400" />
                {t.btn_copy || 'Copy'}
              </button>
              <button
                onClick={exportSvgFile}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-[11px] font-bold transition-colors cursor-pointer"
              >
                <FileCode2 className="w-3.5 h-3.5 text-purple-400" />
                SVG
              </button>
              <button
                onClick={exportPng}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white text-[11px] font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                PNG
              </button>
            </div>
          </div>

          {doc.shapes.length > 0 && <NextStepBar lang={lang} t={t} getResult={getResult} />}
        </div>
      </div>

      {/* Selection actions */}
      {selection.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-purple-500/20 bg-purple-500/5 px-3 py-2.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-300">
            {(t.selectionCount || '{n} selected').replace('{n}', String(selection.length))}
          </span>
          <button
            onClick={duplicateSelection}
            className="px-3 py-1.5 rounded-xl border border-white/10 text-slate-300 hover:text-white text-[11px] font-bold transition-colors cursor-pointer"
          >
            {t.duplicate || 'Duplicate'}
          </button>
          <button
            onClick={() => {
              const picked = doc.shapes.filter(s => selection.includes(s.id));
              commit([...doc.shapes.filter(s => !selection.includes(s.id)), ...picked]);
            }}
            className="px-3 py-1.5 rounded-xl border border-white/10 text-slate-300 hover:text-white text-[11px] font-bold transition-colors cursor-pointer"
          >
            {t.bringFront || 'Bring to front'}
          </button>
          <button
            onClick={deleteSelection}
            className="px-3 py-1.5 rounded-xl border border-red-500/20 text-red-400 hover:text-red-300 text-[11px] font-bold transition-colors cursor-pointer"
          >
            {t.deleteSelected || 'Delete'}
          </button>
          <button
            onClick={() => setSelection([])}
            className="ml-auto p-1.5 rounded-lg text-slate-500 hover:text-white transition-colors cursor-pointer"
            title={t.clearSelection || 'Clear selection'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Shortcuts */}
      {showShortcuts && (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t.shortcutsTitle || 'Keyboard shortcuts'}
            </h3>
            <button
              onClick={() => setShowShortcuts(false)}
              className="text-slate-500 hover:text-white text-xs cursor-pointer"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5">
            {(
              t.shortcuts || [
                { keys: 'V / P / B / E', label: 'Select · Pencil · Marker · Eraser' },
                { keys: 'L / A / R / O / G / T', label: 'Line · Arrow · Rect · Ellipse · Triangle · Text' },
                { keys: 'Alt / right drag', label: 'Erase without changing tool' },
                { keys: 'Space + drag', label: 'Pan the board' },
                { keys: 'Ctrl + wheel', label: 'Zoom at the cursor' },
                { keys: 'Shift', label: 'Square, circle and 45° lines' },
                { keys: 'H (hold)', label: 'Show the picture without your strokes' },
                { keys: '[ / ]', label: 'Brush size' },
                { keys: 'Ctrl+Z / Ctrl+Shift+Z', label: 'Undo · Redo' },
                { keys: 'Ctrl+D / Del', label: 'Duplicate · Delete selection' },
                { keys: 'Ctrl+0', label: 'Fit the board to the screen' },
                { keys: 'Ctrl+V', label: 'Paste an image' },
              ]
            ).map((row: any, i: number) => (
              <div key={i} className="flex items-baseline gap-2 text-[11px]">
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-purple-300 font-mono text-[10px] shrink-0">
                  {row.keys}
                </kbd>
                <span className="text-slate-500">{row.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {notice && (
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 px-4 py-2.5 text-[11px] font-semibold text-purple-200">
          {notice}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif,.avif"
        className="hidden"
        onChange={e => {
          openFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
};

export default Board;
