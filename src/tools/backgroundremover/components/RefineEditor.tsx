import React, { useEffect, useRef, useState } from 'react';
import { Eraser, Paintbrush, Wand2, Undo2, RotateCcw, Check, X, Download, Loader2 } from 'lucide-react';

interface RefineEditorProps {
  originalUrl: string;
  processedUrl: string;
  name: string;
  t: any;
  onClose: () => void;
  onApply: (blob: Blob) => void;
}

type Tool = 'erase' | 'restore' | 'wand';

// Manual refinement over the AI cutout: erase brush, restore brush and a
// magic wand that removes color-similar regions (flood fill on the original).
export const RefineEditor: React.FC<RefineEditorProps> = ({
  originalUrl,
  processedUrl,
  name,
  t,
  onClose,
  onApply,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const originalRef = useRef<HTMLCanvasElement | null>(null);
  const initialRef = useRef<ImageData | null>(null);
  const undoStack = useRef<ImageData[]>([]);
  const drawing = useRef(false);
  const strokeStarted = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const [tool, setTool] = useState<Tool>('erase');
  const [brushSize, setBrushSize] = useState(36);
  const [tolerance, setTolerance] = useState(28);
  const [bg, setBg] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [undoCount, setUndoCount] = useState(0);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  // Load original + processed at the processed image's resolution
  useEffect(() => {
    let cancelled = false;
    const load = (src: string) =>
      new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = src;
      });
    (async () => {
      try {
        const [orig, proc] = await Promise.all([load(originalUrl), load(processedUrl)]);
        if (cancelled || !canvasRef.current) return;
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
        const ctx = c.getContext('2d')!;
        ctx.drawImage(proc, 0, 0);
        initialRef.current = ctx.getImageData(0, 0, w, h);
        setReady(true);
      } catch {
        /* image failed to load — close silently */
        onClose();
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalUrl, processedUrl]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushUndo = () => {
    const c = canvasRef.current!;
    undoStack.current.push(c.getContext('2d')!.getImageData(0, 0, c.width, c.height));
    if (undoStack.current.length > 15) undoStack.current.shift();
    setUndoCount(undoStack.current.length);
  };

  const undo = () => {
    const snap = undoStack.current.pop();
    if (!snap || !canvasRef.current) return;
    canvasRef.current.getContext('2d')!.putImageData(snap, 0, 0);
    setUndoCount(undoStack.current.length);
  };

  const resetAll = () => {
    if (!initialRef.current || !canvasRef.current) return;
    canvasRef.current.getContext('2d')!.putImageData(initialRef.current, 0, 0);
    undoStack.current = [];
    setUndoCount(0);
  };

  // Map a pointer event to canvas pixel coords + display→canvas scale
  const getPos = (e: { clientX: number; clientY: number }) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (c.width / r.width),
      y: (e.clientY - r.top) * (c.height / r.height),
      scale: c.width / r.width,
    };
  };

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
      // restore: draw the original pixels clipped to the brush circle
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

  // Magic wand: flood fill from the clicked point using color similarity
  // measured on the ORIGINAL image, erasing the matched region
  const wandAt = (x: number, y: number) => {
    const c = canvasRef.current!;
    const ctx = c.getContext('2d')!;
    const w = c.width;
    const h = c.height;
    const sx = Math.min(w - 1, Math.max(0, Math.round(x)));
    const sy = Math.min(h - 1, Math.max(0, Math.round(y)));
    setBusy(true);
    // Let the spinner paint before the (potentially long) fill.
    // setTimeout instead of requestAnimationFrame: rAF can be throttled to a
    // standstill in background/embedded tabs, which would freeze the wand.
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
      } finally {
        setBusy(false);
      }
    }, 20);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!ready || busy) return;
    try {
      (e.target as Element).setPointerCapture?.(e.pointerId);
    } catch {
      /* pointer no longer active — capture is best-effort */
    }
    const { x, y, scale } = getPos(e);
    pushUndo();
    if (tool === 'wand') {
      wandAt(x, y);
      return;
    }
    drawing.current = true;
    strokeStarted.current = true;
    lastPos.current = null;
    strokeTo(x, y, scale);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const wrap = wrapRef.current;
    if (wrap) {
      const r = wrap.getBoundingClientRect();
      setCursor({ x: e.clientX - r.left, y: e.clientY - r.top });
    }
    if (!drawing.current) return;
    const { x, y, scale } = getPos(e);
    strokeTo(x, y, scale);
  };

  const endStroke = () => {
    drawing.current = false;
    lastPos.current = null;
  };

  const exportBlob = (): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const c = canvasRef.current!;
      if (!bg) {
        c.toBlob(b => (b ? resolve(b) : reject(new Error('export failed'))), 'image/png');
        return;
      }
      const out = document.createElement('canvas');
      out.width = c.width;
      out.height = c.height;
      const octx = out.getContext('2d')!;
      octx.fillStyle = bg;
      octx.fillRect(0, 0, out.width, out.height);
      octx.drawImage(c, 0, 0);
      out.toBlob(b => (b ? resolve(b) : reject(new Error('export failed'))), 'image/png');
    });

  const downloadResult = async () => {
    try {
      const blob = await exportBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = (name.replace(/\.[a-z0-9]+$/i, '') || name) + '-cutout.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      /* export failed */
    }
  };

  const applyResult = async () => {
    try {
      onApply(await exportBlob());
    } catch {
      /* export failed */
    }
  };

  const toolBtn = (key: Tool, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => setTool(key)}
      title={label}
      className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer
        ${tool === key
          ? 'bg-fuchsia-500/15 border-fuchsia-500/50 text-fuchsia-300'
          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  const bgSwatch = (value: string | null, style: React.CSSProperties, title: string) => (
    <button
      onClick={() => setBg(value)}
      title={title}
      className={`w-8 h-8 rounded-lg border-2 transition-all cursor-pointer ${
        bg === value ? 'border-fuchsia-400 scale-110' : 'border-white/20 hover:border-white/50'
      }`}
      style={style}
    />
  );

  return (
    <div className="fixed inset-0 z-[220] flex flex-col bg-black/98 backdrop-blur-md p-3 md:p-6 animate-in fade-in duration-200">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 pb-3">
        <h3 className="text-sm md:text-lg font-black text-white truncate">
          {t.refineTitle || 'Refine cutout'} <span className="text-slate-500 font-bold hidden sm:inline">— {name}</span>
        </h3>
        <button
          onClick={onClose}
          aria-label="Close"
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Canvas area */}
      <div
        ref={wrapRef}
        className="relative flex-1 min-h-0 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center checkered-bg"
        style={bg ? { background: bg } : undefined}
        onPointerLeave={() => setCursor(null)}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          className="max-w-full max-h-full object-contain select-none"
          style={{ touchAction: 'none', cursor: 'crosshair' }}
        />
        {/* Brush size ring following the pointer */}
        {cursor && tool !== 'wand' && (
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
        {(!ready || busy) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="w-10 h-10 text-fuchsia-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="pt-3 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {toolBtn('erase', <Eraser className="w-4 h-4" />, t.eraseTool || 'Erase')}
          {toolBtn('restore', <Paintbrush className="w-4 h-4" />, t.restoreTool || 'Restore')}
          {toolBtn('wand', <Wand2 className="w-4 h-4" />, t.wandTool || 'Magic wand')}

          <div className="h-8 w-px bg-white/10 hidden sm:block" />

          <button
            onClick={undo}
            disabled={undoCount === 0}
            title={t.undoBtn || 'Undo'}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-xs font-bold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Undo2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t.undoBtn || 'Undo'}</span>
          </button>
          <button
            onClick={resetAll}
            title={t.resetEditsBtn || 'Reset edits'}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-xs font-bold transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">{t.resetEditsBtn || 'Reset edits'}</span>
          </button>

          <div className="flex-1" />

          {/* Background swatches */}
          <div className="flex items-center gap-2">
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
              className="w-8 h-8 rounded-lg border-2 border-white/20 bg-transparent cursor-pointer p-0"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {tool === 'wand' ? (
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
          ) : (
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

          <p className="text-[11px] text-slate-500 font-medium sm:max-w-[280px]">
            {tool === 'wand'
              ? t.wandHint || 'Click a color to erase every connected pixel that looks like it.'
              : tool === 'erase'
              ? t.eraseHint || 'Paint over anything you want to remove.'
              : t.restoreHint || 'Paint to bring back parts of the original photo.'}
          </p>

          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={downloadResult}
              disabled={!ready}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 font-bold text-xs transition-all cursor-pointer disabled:opacity-40"
            >
              <Download className="w-4 h-4" />
              {t.downloadBtn || 'Download'}
            </button>
            <button
              onClick={applyResult}
              disabled={!ready}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-black font-black text-xs transition-all shadow-lg shadow-fuchsia-600/20 active:scale-95 cursor-pointer disabled:opacity-40"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              {t.applyBtn || 'Apply'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
