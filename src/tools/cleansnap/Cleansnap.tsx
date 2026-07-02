import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Eraser,
  Paintbrush,
  Square,
  Circle,
  Upload,
  Download,
  Undo2,
  RotateCcw,
  Trash2,
  Wand2,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';

interface CleansnapProps {
  lang: string;
  dictionary: any;
}

type Tool = 'brush' | 'eraser' | 'rect' | 'circle';
type Mode = 'manual' | 'ai';
type FillMethod = 'content' | 'blur' | 'pixelate';

const MASK_RGBA = 'rgba(139,92,246,1)';
const MAX_DIM = 1920;

// ---------------------------------------------------------------------------
// Local inpainting helpers (100% client-side, no upload, no model download)
// ---------------------------------------------------------------------------

function boundingBox(sel: Uint8Array, W: number, H: number) {
  let minX = W, minY = H, maxX = -1, maxY = -1, any = false;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (sel[y * W + x]) {
        any = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { any, minX, minY, maxX, maxY };
}

// Heat-diffusion (content-aware) inpainting restricted to the masked bounding box
function diffusionInpaint(img: ImageData, sel: Uint8Array, W: number, H: number, smart: boolean) {
  const bb = boundingBox(sel, W, H);
  if (!bb.any) return;
  const pad = smart ? 6 : 3;
  const x0 = Math.max(0, bb.minX - pad);
  const y0 = Math.max(0, bb.minY - pad);
  const x1 = Math.min(W - 1, bb.maxX + pad);
  const y1 = Math.min(H - 1, bb.maxY + pad);
  const bw = x1 - x0 + 1;
  const bh = y1 - y0 + 1;
  const data = img.data;

  const r = new Float32Array(bw * bh);
  const g = new Float32Array(bw * bh);
  const b = new Float32Array(bw * bh);
  const mk = new Uint8Array(bw * bh);

  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      const gi = (y0 + y) * W + (x0 + x);
      const li = y * bw + x;
      r[li] = data[gi * 4];
      g[li] = data[gi * 4 + 1];
      b[li] = data[gi * 4 + 2];
      mk[li] = sel[gi];
    }
  }

  const span = Math.max(bw, bh);
  const iters = smart
    ? Math.min(1200, Math.max(250, span * 3))
    : Math.min(500, Math.max(100, span));

  for (let it = 0; it < iters; it++) {
    for (let y = 0; y < bh; y++) {
      for (let x = 0; x < bw; x++) {
        const li = y * bw + x;
        if (!mk[li]) continue;
        let sr = 0, sg = 0, sb = 0, c = 0;
        if (x > 0) { const n = li - 1; sr += r[n]; sg += g[n]; sb += b[n]; c++; }
        if (x < bw - 1) { const n = li + 1; sr += r[n]; sg += g[n]; sb += b[n]; c++; }
        if (y > 0) { const n = li - bw; sr += r[n]; sg += g[n]; sb += b[n]; c++; }
        if (y < bh - 1) { const n = li + bw; sr += r[n]; sg += g[n]; sb += b[n]; c++; }
        if (c) { r[li] = sr / c; g[li] = sg / c; b[li] = sb / c; }
      }
    }
  }

  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      const li = y * bw + x;
      if (!mk[li]) continue;
      const gi = ((y0 + y) * W + (x0 + x)) * 4;
      data[gi] = r[li];
      data[gi + 1] = g[li];
      data[gi + 2] = b[li];
      data[gi + 3] = 255;
    }
  }
}

function blurFill(img: ImageData, sel: Uint8Array, W: number, H: number) {
  const bb = boundingBox(sel, W, H);
  if (!bb.any) return;
  const data = img.data;
  const src = new Uint8ClampedArray(data); // sample from a snapshot
  const k = 9;
  for (let y = bb.minY; y <= bb.maxY; y++) {
    for (let x = bb.minX; x <= bb.maxX; x++) {
      if (!sel[y * W + x]) continue;
      let sr = 0, sg = 0, sb = 0, c = 0;
      for (let dy = -k; dy <= k; dy += 2) {
        for (let dx = -k; dx <= k; dx += 2) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          if (sel[ny * W + nx]) continue; // only sample from outside the mask
          const ni = (ny * W + nx) * 4;
          sr += src[ni]; sg += src[ni + 1]; sb += src[ni + 2]; c++;
        }
      }
      const gi = (y * W + x) * 4;
      if (c) { data[gi] = sr / c; data[gi + 1] = sg / c; data[gi + 2] = sb / c; data[gi + 3] = 255; }
    }
  }
}

function pixelateFill(img: ImageData, sel: Uint8Array, W: number, H: number) {
  const bb = boundingBox(sel, W, H);
  if (!bb.any) return;
  const data = img.data;
  const block = Math.max(8, Math.round(Math.max(bb.maxX - bb.minX, bb.maxY - bb.minY) / 14));
  for (let by = bb.minY; by <= bb.maxY; by += block) {
    for (let bx = bb.minX; bx <= bb.maxX; bx += block) {
      let sr = 0, sg = 0, sb = 0, c = 0;
      for (let y = by; y < Math.min(by + block, H); y++) {
        for (let x = bx; x < Math.min(bx + block, W); x++) {
          const i = (y * W + x) * 4;
          sr += data[i]; sg += data[i + 1]; sb += data[i + 2]; c++;
        }
      }
      if (!c) continue;
      const ar = sr / c, ag = sg / c, ab = sb / c;
      for (let y = by; y < Math.min(by + block, H); y++) {
        for (let x = bx; x < Math.min(bx + block, W); x++) {
          if (!sel[y * W + x]) continue;
          const i = (y * W + x) * 4;
          data[i] = ar; data[i + 1] = ag; data[i + 2] = ab; data[i + 3] = 255;
        }
      }
    }
  }
}

export default function Cleansnap({ lang, dictionary }: CleansnapProps) {
  const t = dictionary || {};
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [fileName, setFileName] = useState('');
  const [tool, setTool] = useState<Tool>('brush');
  const [mode, setMode] = useState<Mode>('manual');
  const [fillMethod, setFillMethod] = useState<FillMethod>('content');
  const [brushSize, setBrushSize] = useState(40);
  const [processing, setProcessing] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const viewRef = useRef<HTMLCanvasElement>(null);
  const workRef = useRef<HTMLCanvasElement | null>(null);
  const maskRef = useRef<HTMLCanvasElement | null>(null);
  const originalRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<ImageData[]>([]);
  const drawingRef = useRef(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const previewRef = useRef<{ x0: number; y0: number; x1: number; y1: number } | null>(null);

  const L = {
    drop: t.ui_drop || 'Drag & drop an image or click to upload',
    formats: t.ui_formats || 'JPG · PNG · WebP — never leaves your device',
    select: t.ui_select || 'Select image',
    brush: t.ui_brush || 'Brush',
    eraser: t.ui_eraser || 'Erase selection',
    rect: t.ui_rect || 'Rectangle',
    circle: t.ui_circle || 'Circle',
    size: t.ui_size || 'Brush size',
    manual: t.ui_manual || 'Manual',
    ai: t.ui_ai || 'AI mode',
    method: t.ui_method || 'Fill',
    contentAware: t.ui_contentAware || 'Content-aware',
    blur: t.ui_blur || 'Blur',
    pixelate: t.ui_pixelate || 'Pixelate',
    remove: t.ui_remove || 'Remove selection',
    aiRemove: t.ui_aiRemove || 'Smart remove',
    clearSel: t.ui_clearSel || 'Clear selection',
    undo: t.ui_undo || 'Undo',
    reset: t.ui_reset || 'Reset',
    download: t.ui_download || 'Download',
    aiNote: t.ui_aiNote || 'Smart content-aware fill — runs locally, nothing is uploaded.',
    hint: t.ui_hint || 'Paint over the watermark, then press Remove. Use a tight selection for best results.',
    processing: t.ui_processing || 'Processing…',
  };

  const renderView = useCallback(() => {
    const view = viewRef.current;
    const work = workRef.current;
    const mask = maskRef.current;
    if (!view || !work || !mask) return;
    const ctx = view.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, view.width, view.height);
    ctx.drawImage(work, 0, 0);
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.drawImage(mask, 0, 0);
    ctx.restore();
    const p = previewRef.current;
    if (p) {
      ctx.save();
      ctx.strokeStyle = '#a78bfa';
      ctx.fillStyle = 'rgba(139,92,246,0.3)';
      ctx.lineWidth = Math.max(2, view.width / 400);
      const x = Math.min(p.x0, p.x1), y = Math.min(p.y0, p.y1);
      const w = Math.abs(p.x1 - p.x0), h = Math.abs(p.y1 - p.y0);
      if (tool === 'rect') {
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
      } else {
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
  }, [tool]);

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let w = img.naturalWidth, h = img.naturalHeight;
      if (Math.max(w, h) > MAX_DIM) {
        const s = MAX_DIM / Math.max(w, h);
        w = Math.round(w * s);
        h = Math.round(h * s);
      }
      const work = document.createElement('canvas');
      work.width = w; work.height = h;
      work.getContext('2d')!.drawImage(img, 0, 0, w, h);
      workRef.current = work;

      const original = document.createElement('canvas');
      original.width = w; original.height = h;
      original.getContext('2d')!.drawImage(work, 0, 0);
      originalRef.current = original;

      const mask = document.createElement('canvas');
      mask.width = w; mask.height = h;
      maskRef.current = mask;

      historyRef.current = [];
      setCanUndo(false);
      setFileName(file.name);
      setImageLoaded(true);
      URL.revokeObjectURL(url);
      requestAnimationFrame(() => {
        if (viewRef.current) {
          viewRef.current.width = w;
          viewRef.current.height = h;
          renderView();
        }
      });
    };
    img.src = url;
  }, [renderView]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) loadFile(e.target.files[0]);
    e.target.value = '';
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) loadFile(e.dataTransfer.files[0]);
  };

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const view = viewRef.current!;
    const rect = view.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * view.width,
      y: ((e.clientY - rect.top) / rect.height) * view.height,
    };
  };

  const paintAt = (x: number, y: number) => {
    const mask = maskRef.current;
    if (!mask) return;
    const mctx = mask.getContext('2d')!;
    mctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    mctx.fillStyle = MASK_RGBA;
    mctx.beginPath();
    mctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    mctx.fill();
    mctx.globalCompositeOperation = 'source-over';
    renderView();
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!imageLoaded) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const { x, y } = getPos(e);
    if (tool === 'brush' || tool === 'eraser') {
      paintAt(x, y);
    } else {
      startRef.current = { x, y };
      previewRef.current = { x0: x, y0: y, x1: x, y1: y };
    }
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const { x, y } = getPos(e);
    if (tool === 'brush' || tool === 'eraser') {
      paintAt(x, y);
    } else if (startRef.current) {
      previewRef.current = { x0: startRef.current.x, y0: startRef.current.y, x1: x, y1: y };
      renderView();
    }
  };
  const onPointerUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const p = previewRef.current;
    if ((tool === 'rect' || tool === 'circle') && p && maskRef.current) {
      const mctx = maskRef.current.getContext('2d')!;
      mctx.fillStyle = MASK_RGBA;
      const x = Math.min(p.x0, p.x1), y = Math.min(p.y0, p.y1);
      const w = Math.abs(p.x1 - p.x0), h = Math.abs(p.y1 - p.y0);
      if (w > 1 && h > 1) {
        if (tool === 'rect') {
          mctx.fillRect(x, y, w, h);
        } else {
          mctx.beginPath();
          mctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
          mctx.fill();
        }
      }
    }
    previewRef.current = null;
    startRef.current = null;
    renderView();
  };

  const clearSelection = () => {
    const mask = maskRef.current;
    if (!mask) return;
    mask.getContext('2d')!.clearRect(0, 0, mask.width, mask.height);
    renderView();
  };

  const applyRemoval = () => {
    const work = workRef.current;
    const mask = maskRef.current;
    if (!work || !mask || processing) return;
    const W = work.width, H = work.height;
    const mctx = mask.getContext('2d')!;
    const mdata = mctx.getImageData(0, 0, W, H).data;
    const sel = new Uint8Array(W * H);
    let any = false;
    for (let i = 0; i < W * H; i++) {
      if (mdata[i * 4 + 3] > 10) { sel[i] = 1; any = true; }
    }
    if (!any) return;

    setProcessing(true);
    setTimeout(() => {
      const wctx = work.getContext('2d')!;
      const img = wctx.getImageData(0, 0, W, H);
      // history snapshot (cap to 12)
      historyRef.current.push(wctx.getImageData(0, 0, W, H));
      if (historyRef.current.length > 12) historyRef.current.shift();
      setCanUndo(true);

      if (mode === 'ai') {
        diffusionInpaint(img, sel, W, H, true);
      } else if (fillMethod === 'content') {
        diffusionInpaint(img, sel, W, H, false);
      } else if (fillMethod === 'blur') {
        blurFill(img, sel, W, H);
      } else {
        pixelateFill(img, sel, W, H);
      }

      wctx.putImageData(img, 0, 0);
      mctx.clearRect(0, 0, W, H);
      renderView();
      setProcessing(false);
    }, 30);
  };

  const undo = () => {
    const work = workRef.current;
    const snap = historyRef.current.pop();
    if (!work || !snap) return;
    work.getContext('2d')!.putImageData(snap, 0, 0);
    setCanUndo(historyRef.current.length > 0);
    renderView();
  };

  const resetImage = () => {
    const work = workRef.current;
    const original = originalRef.current;
    const mask = maskRef.current;
    if (!work || !original || !mask) return;
    work.getContext('2d')!.drawImage(original, 0, 0);
    mask.getContext('2d')!.clearRect(0, 0, mask.width, mask.height);
    historyRef.current = [];
    setCanUndo(false);
    renderView();
  };

  const newImage = () => {
    workRef.current = null;
    maskRef.current = null;
    originalRef.current = null;
    historyRef.current = [];
    setImageLoaded(false);
    setFileName('');
    setCanUndo(false);
  };

  const download = () => {
    const work = workRef.current;
    if (!work) return;
    const base = (fileName.replace(/\.[^.]+$/, '') || 'cleansnap').replace(/[^a-z0-9-_]+/gi, '_');
    work.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${base}_clean.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    }, 'image/png');
  };

  useEffect(() => () => { /* canvases are GC'd; object URLs revoked on load */ }, []);

  const toolBtn = (id: Tool, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => setTool(id)}
      title={label}
      aria-label={label}
      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
        tool === id ? 'bg-violet-500/20 border-violet-500/40 text-violet-300' : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
      }`}
    >
      {icon}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0408] text-slate-200 font-sans relative overflow-x-hidden pt-24">
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none z-0" />

      <Header
        currentLang={lang}
        onLanguageChange={(l) => (window.location.href = `/${l.toLowerCase()}/cleansnap`)}
        onReset={newImage}
        t={t}
      />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 md:px-8 py-8 relative z-10 flex flex-col space-y-8">
        <div className="text-center md:text-left space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center md:justify-start gap-3">
            <Eraser className="w-8 h-8 text-violet-400" />
            <span>{t.seoHeroTitle || 'CleanSnap'}</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed">
            {t.seoHeroText || 'Remove watermarks and unwanted objects from images by painting over them.'}
          </p>
        </div>

        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-cleansnap-top" />

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInput} className="hidden" />

        {!imageLoaded ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            className={`group relative rounded-3xl border-2 border-dashed cursor-pointer px-8 py-24 flex flex-col items-center justify-center text-center transition-all duration-300 ${
              isDragging ? 'border-violet-400 bg-violet-500/10 scale-[1.01]' : 'border-white/10 bg-white/[0.015] hover:border-violet-500/40 hover:bg-white/[0.03]'
            }`}
          >
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 transition-all ${isDragging ? 'bg-violet-500/20 text-violet-300 scale-110' : 'bg-white/5 text-violet-400'}`}>
              <Upload className="w-9 h-9" strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-black text-white tracking-tight mb-2">{L.drop}</p>
            <p className="text-slate-500 text-sm font-medium mb-6">{L.formats}</p>
            <span className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all active:scale-95 shadow-lg shadow-violet-600/30">
              <Upload className="w-4 h-4" /> {L.select}
            </span>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Mode tabs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode('manual')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer border ${
                  mode === 'manual' ? 'bg-violet-500/20 border-violet-500/40 text-violet-200' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Paintbrush className="w-4 h-4" /> {L.manual}
              </button>
              <button
                onClick={() => setMode('ai')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer border ${
                  mode === 'ai' ? 'bg-violet-500/20 border-violet-500/40 text-violet-200' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4" /> {L.ai}
              </button>
            </div>

            {/* Toolbar */}
            <div className="glass-card rounded-2xl p-3 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                {toolBtn('brush', <Paintbrush className="w-5 h-5" />, L.brush)}
                {toolBtn('rect', <Square className="w-5 h-5" />, L.rect)}
                {toolBtn('circle', <Circle className="w-5 h-5" />, L.circle)}
                {toolBtn('eraser', <Eraser className="w-5 h-5" />, L.eraser)}
              </div>

              {(tool === 'brush' || tool === 'eraser') && (
                <label className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{L.size}</span>
                  <input type="range" min={6} max={150} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-28 h-1.5 rounded bg-white/10 accent-violet-500 cursor-pointer" />
                  <span className="font-mono text-slate-300 w-8">{brushSize}</span>
                </label>
              )}

              {mode === 'manual' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mr-1">{L.method}</span>
                  {([['content', L.contentAware], ['blur', L.blur], ['pixelate', L.pixelate]] as [FillMethod, string][]).map(([m, label]) => (
                    <button
                      key={m}
                      onClick={() => setFillMethod(m)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        fillMethod === m ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40' : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex-1" />

              <button onClick={clearSelection} title={L.clearSel} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold transition-all cursor-pointer">
                <Trash2 className="w-4 h-4" /> {L.clearSel}
              </button>
              <button
                onClick={applyRemoval}
                disabled={processing}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black text-sm transition-all active:scale-95 cursor-pointer shadow-lg shadow-violet-600/30 disabled:opacity-60"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {mode === 'ai' ? L.aiRemove : L.remove}
              </button>
            </div>

            {mode === 'ai' && (
              <p className="text-xs text-violet-300/80 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" /> {L.aiNote}
              </p>
            )}

            {/* Canvas */}
            <div className="glass-card rounded-3xl p-3 md:p-4 flex items-center justify-center overflow-auto">
              <canvas
                ref={viewRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
                className="max-w-full h-auto rounded-xl touch-none cursor-crosshair bg-[#0c0612]"
                style={{ maxHeight: '65vh' }}
              />
            </div>

            <p className="text-center text-[11px] text-slate-600 font-medium">{L.hint}</p>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button onClick={undo} disabled={!canUndo} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-bold text-sm transition-all cursor-pointer disabled:opacity-40">
                <Undo2 className="w-4 h-4" /> {L.undo}
              </button>
              <button onClick={resetImage} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-bold text-sm transition-all cursor-pointer">
                <RotateCcw className="w-4 h-4" /> {L.reset}
              </button>
              <button onClick={download} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-black hover:bg-violet-500 hover:text-white font-black text-sm transition-all active:scale-95 cursor-pointer shadow-lg">
                <Download className="w-4 h-4" /> {L.download}
              </button>
            </div>
          </div>
        )}

        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-cleansnap-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={(modal) => setLegalModal(modal)} />
      <LegalModal isOpen={legalModal === 'privacy'} onClose={() => setLegalModal(null)} title={legalTranslations[lang]?.privacy.title || 'Privacy Policy'} content={legalTranslations[lang]?.privacy.content} t={t} />
      <LegalModal isOpen={legalModal === 'terms'} onClose={() => setLegalModal(null)} title={legalTranslations[lang]?.terms.title || 'Terms of Service'} content={legalTranslations[lang]?.terms.content} t={t} />
      <LegalModal isOpen={legalModal === 'cookies'} onClose={() => setLegalModal(null)} title={legalTranslations[lang]?.cookies.title || 'Cookie Policy'} content={legalTranslations[lang]?.cookies.content} t={t} />
    </div>
  );
}
