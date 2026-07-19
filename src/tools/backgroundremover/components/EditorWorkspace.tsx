import React, { useEffect, useRef, useState } from 'react';
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
} from 'lucide-react';
import { ImageItem } from '../types';

interface EditorWorkspaceProps {
  item: ImageItem;
  t: any;
  onCommit: (blob: Blob, url: string) => void;
  onRerunAI: () => void;
}

type Tool = 'erase' | 'restore' | 'wand' | 'lasso';
type LassoMode = 'erase' | 'keep';

// Inline professional-style editor: side tool palette, canvas workspace,
// per-tool options, undo/redo, zoom and automatic commit back to the item.
export const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({ item, t, onCommit, onRerunAI }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const originalRef = useRef<HTMLCanvasElement | null>(null);
  const initialRef = useRef<ImageData | null>(null);
  const loadedUrlRef = useRef<string | null>(null);
  const undoStack = useRef<ImageData[]>([]);
  const redoStack = useRef<ImageData[]>([]);
  const drawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const lassoPoints = useRef<{ x: number; y: number }[]>([]);
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [tool, setTool] = useState<Tool>('erase');
  const [lassoMode, setLassoMode] = useState<LassoMode>('erase');
  const [brushSize, setBrushSize] = useState(36);
  const [tolerance, setTolerance] = useState(28);
  const [bg, setBg] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number | 'fit'>('fit');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [historyTick, setHistoryTick] = useState(0);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [lassoActive, setLassoActive] = useState(false);

  const bumpHistory = () => setHistoryTick(n => n + 1);

  // ---------- Loading ----------
  useEffect(() => {
    if (!item.processedUrl || item.status !== 'done') return;
    if (item.processedUrl === loadedUrlRef.current) return;
    let cancelled = false;
    const load = (src: string) =>
      new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = src;
      });
    setReady(false);
    (async () => {
      try {
        const [orig, proc] = await Promise.all([load(item.originalUrl), load(item.processedUrl!)]);
        if (cancelled || !canvasRef.current || !overlayRef.current) return;
        const w = proc.naturalWidth;
        const h = proc.naturalHeight;
        const oc = document.createElement('canvas');
        oc.width = w;
        oc.height = h;
        oc.getContext('2d')!.drawImage(orig, 0, 0, w, h);
        originalRef.current = oc;
        const c = canvasRef.current;
        c.width = w;
        c.height = h;
        overlayRef.current.width = w;
        overlayRef.current.height = h;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(proc, 0, 0);
        initialRef.current = ctx.getImageData(0, 0, w, h);
        loadedUrlRef.current = item.processedUrl!;
        undoStack.current = [];
        redoStack.current = [];
        lassoPoints.current = [];
        setLassoActive(false);
        bumpHistory();
        setReady(true);
      } catch {
        /* image failed to load */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id, item.processedUrl, item.status]);

  // Keyboard: Esc cancels lasso, Enter closes it, Ctrl+Z / Ctrl+Y history.
  // The listener is registered once, so route through a ref to always call the
  // latest closeLasso closure (it reads lassoMode state).
  const closeLassoRef = useRef<() => void>(() => {});
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelLasso();
      if (e.key === 'Enter' && lassoPoints.current.length >= 3) closeLassoRef.current();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- History ----------
  const snapshot = () => {
    const c = canvasRef.current!;
    return c.getContext('2d')!.getImageData(0, 0, c.width, c.height);
  };
  const pushUndo = () => {
    undoStack.current.push(snapshot());
    if (undoStack.current.length > 15) undoStack.current.shift();
    redoStack.current = [];
    bumpHistory();
  };
  const undo = () => {
    const snap = undoStack.current.pop();
    if (!snap || !canvasRef.current) return;
    redoStack.current.push(snapshot());
    canvasRef.current.getContext('2d')!.putImageData(snap, 0, 0);
    bumpHistory();
    scheduleCommit();
  };
  const redo = () => {
    const snap = redoStack.current.pop();
    if (!snap || !canvasRef.current) return;
    undoStack.current.push(snapshot());
    canvasRef.current.getContext('2d')!.putImageData(snap, 0, 0);
    bumpHistory();
    scheduleCommit();
  };
  const resetAll = () => {
    if (!initialRef.current || !canvasRef.current) return;
    pushUndo();
    canvasRef.current.getContext('2d')!.putImageData(initialRef.current, 0, 0);
    scheduleCommit();
  };

  // ---------- Commit back to the item (debounced) ----------
  const scheduleCommit = () => {
    if (commitTimer.current) clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(() => {
      const c = canvasRef.current;
      if (!c) return;
      c.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        loadedUrlRef.current = url;
        onCommit(blob, url);
      }, 'image/png');
    }, 400);
  };

  // ---------- Coordinates ----------
  const getPos = (e: { clientX: number; clientY: number }) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (c.width / r.width),
      y: (e.clientY - r.top) * (c.height / r.height),
      scale: c.width / r.width,
    };
  };

  // ---------- Brushes ----------
  const paintDot = (px: number, py: number, radius: number) => {
    const ctx = canvasRef.current!.getContext('2d')!;
    if (tool === 'erase') {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(originalRef.current!, 0, 0);
      ctx.restore();
    }
  };

  const strokeTo = (x: number, y: number, scale: number) => {
    const radius = Math.max(2, (brushSize / 2) * scale);
    const from = lastPos.current || { x, y };
    const dist = Math.hypot(x - from.x, y - from.y);
    const steps = Math.max(1, Math.ceil(dist / Math.max(2, radius / 3)));
    for (let i = 0; i <= steps; i++) {
      paintDot(from.x + ((x - from.x) * i) / steps, from.y + ((y - from.y) * i) / steps, radius);
    }
    lastPos.current = { x, y };
  };

  // ---------- Magic wand ----------
  const wandAt = (x: number, y: number) => {
    const c = canvasRef.current!;
    const ctx = c.getContext('2d')!;
    const w = c.width;
    const h = c.height;
    const sx = Math.min(w - 1, Math.max(0, Math.round(x)));
    const sy = Math.min(h - 1, Math.max(0, Math.round(y)));
    setBusy(true);
    setTimeout(() => {
      try {
        const od = originalRef.current!.getContext('2d')!.getImageData(0, 0, w, h).data;
        const img = ctx.getImageData(0, 0, w, h);
        const d = img.data;
        const si = (sy * w + sx) * 4;
        const sr = od[si], sg = od[si + 1], sb = od[si + 2];
        const tol = tolerance * tolerance * 3;
        const visited = new Uint8Array(w * h);
        const stack = [sy * w + sx];
        visited[sy * w + sx] = 1;
        while (stack.length) {
          const p = stack.pop()!;
          const pi = p * 4;
          const dr = od[pi] - sr, dg = od[pi + 1] - sg, db = od[pi + 2] - sb;
          if (dr * dr + dg * dg + db * db > tol) continue;
          d[pi + 3] = 0;
          const px = p % w;
          if (px > 0 && !visited[p - 1]) { visited[p - 1] = 1; stack.push(p - 1); }
          if (px < w - 1 && !visited[p + 1]) { visited[p + 1] = 1; stack.push(p + 1); }
          if (p >= w && !visited[p - w]) { visited[p - w] = 1; stack.push(p - w); }
          if (p < w * (h - 1) && !visited[p + w]) { visited[p + w] = 1; stack.push(p + w); }
        }
        ctx.putImageData(img, 0, 0);
        scheduleCommit();
      } finally {
        setBusy(false);
      }
    }, 20);
  };

  // ---------- Polygon lasso ----------
  const drawLassoOverlay = (previewPoint?: { x: number; y: number }) => {
    const o = overlayRef.current;
    if (!o) return;
    const ctx = o.getContext('2d')!;
    ctx.clearRect(0, 0, o.width, o.height);
    const pts = lassoPoints.current;
    if (pts.length === 0) return;
    const scale = o.width / (o.getBoundingClientRect().width || o.width);
    ctx.lineWidth = Math.max(1.5, 2 * scale);
    ctx.strokeStyle = '#e879f9';
    ctx.setLineDash([8 * scale, 6 * scale]);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    if (previewPoint) ctx.lineTo(previewPoint.x, previewPoint.y);
    ctx.stroke();
    // closing hint back to the first point
    if (pts.length >= 2) {
      ctx.setLineDash([2 * scale, 6 * scale]);
      ctx.beginPath();
      ctx.moveTo((previewPoint || pts[pts.length - 1]).x, (previewPoint || pts[pts.length - 1]).y);
      ctx.lineTo(pts[0].x, pts[0].y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.fillStyle = '#e879f9';
    for (const p of pts) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(3, 4 * scale), 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const cancelLasso = () => {
    lassoPoints.current = [];
    setLassoActive(false);
    const o = overlayRef.current;
    if (o) o.getContext('2d')!.clearRect(0, 0, o.width, o.height);
  };

  const closeLasso = () => {
    const pts = lassoPoints.current;
    if (pts.length < 3) {
      cancelLasso();
      return;
    }
    pushUndo();
    const c = canvasRef.current!;
    const ctx = c.getContext('2d')!;
    if (lassoMode === 'erase') {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else {
      // keep only the selection: mask everything outside
      const mask = document.createElement('canvas');
      mask.width = c.width;
      mask.height = c.height;
      const mctx = mask.getContext('2d')!;
      mctx.fillStyle = '#000';
      mctx.beginPath();
      mctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) mctx.lineTo(pts[i].x, pts[i].y);
      mctx.closePath();
      mctx.fill();
      ctx.save();
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(mask, 0, 0);
      ctx.restore();
    }
    cancelLasso();
    scheduleCommit();
  };
  closeLassoRef.current = closeLasso;

  // ---------- Pointer handling ----------
  const onPointerDown = (e: React.PointerEvent) => {
    if (!ready || busy) return;
    const { x, y, scale } = getPos(e);
    if (tool === 'lasso') {
      const pts = lassoPoints.current;
      // clicking near the first point closes the polygon
      if (pts.length >= 3) {
        const d0 = Math.hypot(x - pts[0].x, y - pts[0].y);
        if (d0 < 12 * scale) {
          closeLasso();
          return;
        }
      }
      pts.push({ x, y });
      setLassoActive(true);
      drawLassoOverlay();
      return;
    }
    try {
      (e.target as Element).setPointerCapture?.(e.pointerId);
    } catch {
      /* capture is best-effort */
    }
    if (tool === 'wand') {
      pushUndo();
      wandAt(x, y);
      return;
    }
    pushUndo();
    drawing.current = true;
    lastPos.current = null;
    strokeTo(x, y, scale);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const stage = stageRef.current;
    if (stage) {
      const r = stage.getBoundingClientRect();
      setCursor({ x: e.clientX - r.left, y: e.clientY - r.top });
    }
    if (tool === 'lasso' && lassoPoints.current.length > 0) {
      drawLassoOverlay(getPos(e));
      return;
    }
    if (!drawing.current) return;
    const { x, y, scale } = getPos(e);
    strokeTo(x, y, scale);
  };

  const endStroke = () => {
    if (drawing.current) scheduleCommit();
    drawing.current = false;
    lastPos.current = null;
  };

  const onDoubleClick = () => {
    if (tool === 'lasso' && lassoPoints.current.length >= 3) closeLasso();
  };

  // ---------- Export ----------
  const downloadResult = () => {
    const c = canvasRef.current;
    if (!c) return;
    const finish = (canvas: HTMLCanvasElement) =>
      canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = (item.name.replace(/\.[a-z0-9]+$/i, '') || item.name) + '-cutout.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png');
    if (!bg) {
      finish(c);
      return;
    }
    const out = document.createElement('canvas');
    out.width = c.width;
    out.height = c.height;
    const octx = out.getContext('2d')!;
    octx.fillStyle = bg;
    octx.fillRect(0, 0, out.width, out.height);
    octx.drawImage(c, 0, 0);
    finish(out);
  };

  // ---------- Zoom ----------
  const zoomSteps = [0.25, 0.5, 0.75, 1, 1.5, 2, 3];
  const currentZoom = zoom === 'fit' ? null : zoom;
  const zoomBy = (dir: 1 | -1) => {
    const base = currentZoom ?? 1;
    const idx = zoomSteps.findIndex(z => z >= base - 0.001);
    const next = zoomSteps[Math.min(zoomSteps.length - 1, Math.max(0, (idx === -1 ? 3 : idx) + dir))];
    setZoom(next);
  };

  const canvasStyle: React.CSSProperties =
    zoom === 'fit'
      ? { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' as const }
      : { width: canvasRef.current ? canvasRef.current.width * zoom : undefined };

  // ---------- UI helpers ----------
  const working = item.status !== 'done';
  const toolButton = (key: Tool, icon: React.ReactNode, label: string) => (
    <button
      key={key}
      onClick={() => {
        if (tool === 'lasso' && key !== 'lasso') cancelLasso();
        setTool(key);
      }}
      title={label}
      aria-label={label}
      aria-pressed={tool === key}
      className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer
        ${tool === key
          ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-300 shadow-[0_0_12px_rgba(232,121,249,0.25)]'
          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
    >
      {icon}
    </button>
  );

  const actionButton = (
    onClick: () => void,
    icon: React.ReactNode,
    label: string,
    disabled = false
  ) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {icon}
    </button>
  );

  const bgSwatch = (value: string | null, style: React.CSSProperties, title: string) => (
    <button
      onClick={() => setBg(value)}
      title={title}
      className={`w-7 h-7 rounded-lg border-2 transition-all cursor-pointer ${
        bg === value ? 'border-fuchsia-400 scale-110' : 'border-white/20 hover:border-white/50'
      }`}
      style={style}
    />
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Stage */}
        <div
          ref={stageRef}
          className="relative flex-1 min-w-0 h-[380px] md:h-[480px] rounded-2xl border border-white/10 overflow-auto custom-scrollbar checkered-bg flex items-center justify-center"
          style={bg ? { background: bg } : undefined}
          onPointerLeave={() => setCursor(null)}
        >
          <div className="relative inline-flex max-w-full max-h-full items-center justify-center">
            <canvas
              ref={canvasRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endStroke}
              onPointerCancel={endStroke}
              onDoubleClick={onDoubleClick}
              className="select-none"
              style={{ ...canvasStyle, touchAction: 'none', cursor: 'crosshair' }}
            />
            <canvas ref={overlayRef} className="absolute inset-0 w-full h-full pointer-events-none" />
          </div>

          {/* Brush ring cursor */}
          {cursor && (tool === 'erase' || tool === 'restore') && ready && !working && (
            <div
              className="absolute pointer-events-none rounded-full border-2 border-fuchsia-400/90 shadow-[0_0_8px_rgba(232,121,249,0.5)]"
              style={{
                left: cursor.x - brushSize / 2,
                top: cursor.y - brushSize / 2,
                width: brushSize,
                height: brushSize,
              }}
            />
          )}

          {(working || !ready || busy) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs gap-3 z-10">
              <Loader2 className="w-10 h-10 text-fuchsia-400 animate-spin" />
              {working && (
                <p className="text-xs font-bold text-white uppercase tracking-wider">
                  {item.status === 'loading_model' ? t.statusDownloadingModel : t.statusProcessing}
                </p>
              )}
            </div>
          )}

          {/* Zoom controls */}
          <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 p-1.5 rounded-xl bg-black/70 backdrop-blur border border-white/10">
            <button onClick={() => zoomBy(-1)} title={t.zoomOutLabel || 'Zoom out'} className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-black text-slate-400 w-9 text-center">
              {zoom === 'fit' ? 'FIT' : Math.round(zoom * 100) + '%'}
            </span>
            <button onClick={() => zoomBy(1)} title={t.zoomInLabel || 'Zoom in'} className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={() => setZoom('fit')} title={t.zoomFitLabel || 'Fit'} className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer">
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tool palette */}
        <div className="flex lg:flex-col flex-wrap items-center gap-2 lg:w-12 shrink-0">
          <button
            onClick={onRerunAI}
            disabled={working}
            title={t.autoAiTool || 'AI auto cutout'}
            aria-label={t.autoAiTool || 'AI auto cutout'}
            className="w-10 h-10 rounded-xl border border-fuchsia-500/40 bg-fuchsia-600/20 flex items-center justify-center text-fuchsia-300 hover:bg-fuchsia-600/40 transition-all cursor-pointer disabled:opacity-40"
          >
            <Sparkles className="w-4.5 h-4.5 w-[18px] h-[18px]" />
          </button>
          <div className="lg:w-8 lg:h-px w-px h-8 bg-white/10 lg:mx-auto" />
          {toolButton('erase', <Eraser className="w-[18px] h-[18px]" />, t.eraseTool || 'Erase')}
          {toolButton('restore', <Paintbrush className="w-[18px] h-[18px]" />, t.restoreTool || 'Restore')}
          {toolButton('wand', <Wand2 className="w-[18px] h-[18px]" />, t.wandTool || 'Magic wand')}
          {toolButton('lasso', <Lasso className="w-[18px] h-[18px]" />, t.lassoTool || 'Lasso')}
          <div className="lg:w-8 lg:h-px w-px h-8 bg-white/10 lg:mx-auto" />
          {actionButton(undo, <Undo2 className="w-[18px] h-[18px]" />, t.undoBtn || 'Undo', undoStack.current.length === 0)}
          {actionButton(redo, <Redo2 className="w-[18px] h-[18px]" />, t.redoBtn || 'Redo', redoStack.current.length === 0)}
          {actionButton(resetAll, <RotateCcw className="w-[18px] h-[18px]" />, t.resetEditsBtn || 'Reset edits', !ready)}
          <div className="lg:w-8 lg:h-px w-px h-8 bg-white/10 lg:mx-auto" />
          {actionButton(downloadResult, <Download className="w-[18px] h-[18px]" />, t.downloadBtn || 'Download', !ready)}
        </div>
      </div>

      {/* Contextual tool options */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-2xl bg-black/30 border border-white/5 px-4 py-3">
        {(tool === 'erase' || tool === 'restore') && (
          <label className="flex items-center gap-3 flex-1 text-xs font-bold text-slate-400">
            <span className="shrink-0 uppercase tracking-widest text-[10px] text-slate-500">
              {t.brushSizeLabel || 'Brush size'} ({brushSize}px)
            </span>
            <input
              type="range"
              min="6"
              max="120"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="flex-1 h-1.5 rounded bg-white/10 outline-none accent-fuchsia-500 cursor-pointer"
            />
          </label>
        )}
        {tool === 'wand' && (
          <label className="flex items-center gap-3 flex-1 text-xs font-bold text-slate-400">
            <span className="shrink-0 uppercase tracking-widest text-[10px] text-slate-500">
              {t.toleranceLabel || 'Tolerance'} ({tolerance})
            </span>
            <input
              type="range"
              min="5"
              max="90"
              value={tolerance}
              onChange={(e) => setTolerance(Number(e.target.value))}
              className="flex-1 h-1.5 rounded bg-white/10 outline-none accent-fuchsia-500 cursor-pointer"
            />
          </label>
        )}
        {tool === 'lasso' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLassoMode('erase')}
              className={`px-3 py-2 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                lassoMode === 'erase'
                  ? 'bg-fuchsia-500/15 border-fuchsia-500/40 text-fuchsia-300'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {t.lassoEraseMode || 'Erase selection'}
            </button>
            <button
              onClick={() => setLassoMode('keep')}
              className={`px-3 py-2 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                lassoMode === 'keep'
                  ? 'bg-fuchsia-500/15 border-fuchsia-500/40 text-fuchsia-300'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {t.lassoKeepMode || 'Keep selection'}
            </button>
            {lassoActive && (
              <button
                onClick={closeLasso}
                className="px-3 py-2 rounded-lg bg-fuchsia-600 text-black text-[11px] font-black cursor-pointer active:scale-95"
              >
                OK
              </button>
            )}
          </div>
        )}

        <p className="text-[11px] text-slate-500 font-medium flex-1 sm:text-right">
          {tool === 'lasso'
            ? t.lassoHint || 'Click to add points; double-click, Enter or the first point closes; Esc cancels.'
            : tool === 'wand'
            ? t.wandHint || 'Click a color to erase every connected pixel that looks like it.'
            : tool === 'erase'
            ? t.eraseHint || 'Paint over anything you want to remove.'
            : t.restoreHint || 'Paint to bring back parts of the original photo.'}
        </p>

        {/* Background swatches */}
        <div className="flex items-center gap-2 justify-end">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 hidden md:inline">
            {t.bgLabel || 'Background'}
          </span>
          {bgSwatch(null, {
            backgroundImage:
              'linear-gradient(45deg,#333 25%,transparent 25%),linear-gradient(-45deg,#333 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#333 75%),linear-gradient(-45deg,transparent 75%,#333 75%)',
            backgroundSize: '8px 8px',
            backgroundPosition: '0 0,0 4px,4px -4px,-4px 0',
            backgroundColor: '#111',
          }, t.bgTransparent || 'Transparent')}
          {bgSwatch('#ffffff', { background: '#ffffff' }, '#ffffff')}
          {bgSwatch('#000000', { background: '#000000' }, '#000000')}
          <input
            type="color"
            value={bg && bg !== '#ffffff' && bg !== '#000000' ? bg : '#22d3ee'}
            onChange={(e) => setBg(e.target.value)}
            title={t.bgCustom || 'Custom color'}
            className="w-7 h-7 rounded-lg border-2 border-white/20 bg-transparent cursor-pointer p-0"
          />
        </div>
      </div>
    </div>
  );
};
