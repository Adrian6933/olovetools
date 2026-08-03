import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Maximize, ZoomIn, ZoomOut, AlertCircle } from 'lucide-react';

interface PdfViewerProps {
  /** The document to show. Changing it reloads the viewer from page 1. */
  file: Blob | null;
  t: any;
  /** Height of the page area. */
  className?: string;
  /** Compact mode drops the thumbnail strip (used in the narrow result panel). */
  compact?: boolean;
}

let pdfjsPromise: Promise<any> | null = null;
async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then(lib => {
      lib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
      return lib;
    });
  }
  return pdfjsPromise;
}

/**
 * A real page-by-page PDF viewer, so the document can be checked inside the
 * tool instead of being downloaded to find out what happened to it.
 *
 * Rendering goes through `intent: 'print'` on purpose: with the default intent
 * pdf.js schedules its render continuations on requestAnimationFrame, which
 * never fires while the tab is in the background, and the viewer would sit on a
 * spinner until the user came back.
 */
export const PdfViewer: React.FC<PdfViewerProps> = ({ file, t, className = '', compact = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<any>(null);
  const taskRef = useRef<any>(null);
  const renderRef = useRef<any>(null);
  const loadTokenRef = useRef(0);

  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState<number | 'fit'>('fit');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [thumbs, setThumbs] = useState<string[]>([]);

  // ---- Load ---------------------------------------------------------------
  useEffect(() => {
    if (!file) {
      setNumPages(0);
      setThumbs([]);
      return;
    }
    const token = ++loadTokenRef.current;
    setBusy(true);
    setError('');
    setPage(1);
    setThumbs([]);

    (async () => {
      try {
        const pdfjsLib = await getPdfjs();
        const data = await file.arrayBuffer();
        const task = pdfjsLib.getDocument({ data });
        const doc = await task.promise;
        if (loadTokenRef.current !== token) {
          await task.destroy();
          return;
        }
        // Tear down the previous document only once the new one is ready, so
        // the canvas never blanks out between files.
        if (taskRef.current) await taskRef.current.destroy().catch(() => {});
        taskRef.current = task;
        docRef.current = doc;
        setNumPages(doc.numPages);
      } catch (e: any) {
        if (loadTokenRef.current === token) setError(e?.message || 'Could not open this PDF.');
      } finally {
        if (loadTokenRef.current === token) setBusy(false);
      }
    })();

    return () => {
      loadTokenRef.current++;
    };
  }, [file]);

  useEffect(
    () => () => {
      renderRef.current?.cancel?.();
      taskRef.current?.destroy?.().catch(() => {});
    },
    []
  );

  // ---- Render current page ------------------------------------------------
  const renderPage = useCallback(async () => {
    const doc = docRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!doc || !canvas || !container || page < 1 || page > doc.numPages) return;

    setBusy(true);
    try {
      renderRef.current?.cancel?.();
      const pdfPage = await doc.getPage(page);
      const natural = pdfPage.getViewport({ scale: 1 });
      const available = container.clientWidth - 24;
      const fitScale = available > 0 ? available / natural.width : 1;
      const scale = zoom === 'fit' ? fitScale : fitScale * zoom;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const viewport = pdfPage.getViewport({ scale: scale * dpr });

      canvas.width = Math.max(1, Math.round(viewport.width));
      canvas.height = Math.max(1, Math.round(viewport.height));
      canvas.style.width = Math.round(viewport.width / dpr) + 'px';
      canvas.style.height = Math.round(viewport.height / dpr) + 'px';

      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const task = pdfPage.render({ canvasContext: ctx, viewport, intent: 'print' });
      renderRef.current = task;
      await task.promise;
      pdfPage.cleanup();
    } catch (e: any) {
      // A cancelled render is the expected outcome of paging quickly.
      if (e?.name !== 'RenderingCancelledException') setError(e?.message || 'Render failed.');
    } finally {
      setBusy(false);
    }
  }, [page, zoom]);

  useEffect(() => {
    if (numPages > 0) renderPage();
  }, [numPages, renderPage]);

  // Re-fit when the container changes width.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      if (zoom === 'fit') renderPage();
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [zoom, renderPage]);

  // ---- Thumbnail strip ----------------------------------------------------
  useEffect(() => {
    if (compact || numPages === 0) return;
    const token = loadTokenRef.current;
    let stopped = false;
    (async () => {
      const doc = docRef.current;
      if (!doc) return;
      const limit = Math.min(numPages, 40);
      for (let i = 1; i <= limit; i++) {
        if (stopped || loadTokenRef.current !== token) return;
        try {
          const p = await doc.getPage(i);
          const base = p.getViewport({ scale: 1 });
          const viewport = p.getViewport({ scale: 64 / base.width });
          const c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(viewport.width));
          c.height = Math.max(1, Math.round(viewport.height));
          const ctx = c.getContext('2d')!;
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, c.width, c.height);
          await p.render({ canvasContext: ctx, viewport, intent: 'print' }).promise;
          p.cleanup();
          const url = c.toDataURL('image/jpeg', 0.6);
          if (!stopped) setThumbs(prev => { const n = prev.slice(); n[i - 1] = url; return n; });
        } catch {
          /* one thumbnail is not worth failing the viewer over */
        }
      }
    })();
    return () => { stopped = true; };
  }, [numPages, compact]);

  // ---- Keyboard -----------------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA' || el?.tagName === 'SELECT') return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') setPage(p => Math.min(numPages, p + 1));
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') setPage(p => Math.max(1, p - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [numPages]);

  const zoomBy = (dir: 1 | -1) => {
    const steps = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
    const current = zoom === 'fit' ? 1 : zoom;
    const idx = steps.findIndex(s => s >= current - 0.001);
    setZoom(steps[Math.min(steps.length - 1, Math.max(0, (idx === -1 ? 2 : idx) + dir))]);
  };

  if (!file) return null;

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center ${className}`}>
        <AlertCircle className="w-6 h-6 text-red-400" />
        <p className="text-xs font-bold text-red-400">{t.viewerError || 'Could not open this PDF.'}</p>
        <p className="text-[10px] text-slate-500 max-w-xs break-words">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className={`relative rounded-2xl border border-white/10 bg-[#160d0f] overflow-auto custom-scrollbar flex items-start justify-center p-3 ${className}`}
      >
        <canvas ref={canvasRef} className="rounded shadow-2xl max-w-full" />
        {busy && (
          <span className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/70 backdrop-blur">
            <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/5">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            aria-label={t.prevPage || 'Previous page'}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            type="number"
            min={1}
            max={numPages}
            value={page}
            onChange={e => {
              const n = Number(e.target.value);
              if (n >= 1 && n <= numPages) setPage(n);
            }}
            className="w-12 bg-transparent text-center text-xs font-black text-white outline-none tabular-nums"
            aria-label={t.pageLabel || 'Page'}
          />
          <span className="text-xs font-bold text-slate-500 tabular-nums pr-1">/ {numPages}</span>
          <button
            onClick={() => setPage(p => Math.min(numPages, p + 1))}
            disabled={page >= numPages}
            aria-label={t.nextPage || 'Next page'}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/5">
          <button onClick={() => zoomBy(-1)} aria-label={t.zoomOutLabel || 'Zoom out'} className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-black text-slate-400 w-10 text-center">
            {zoom === 'fit' ? 'FIT' : Math.round(zoom * 100) + '%'}
          </span>
          <button onClick={() => zoomBy(1)} aria-label={t.zoomInLabel || 'Zoom in'} className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={() => setZoom('fit')} aria-label={t.zoomFitLabel || 'Fit'} className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer">
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Thumbnail strip */}
      {!compact && numPages > 1 && (
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
          {Array.from({ length: numPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              title={`${t.pageLabel || 'Page'} ${i + 1}`}
              className={`relative shrink-0 w-14 aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                page === i + 1 ? 'border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.35)]' : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'
              }`}
            >
              {thumbs[i] ? (
                <img src={thumbs[i]} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="w-full h-full bg-[#241618] flex items-center justify-center text-[10px] font-black text-slate-600">{i + 1}</span>
              )}
              <span className="absolute bottom-0.5 right-0.5 text-[9px] font-black bg-black/70 text-white px-1 rounded">{i + 1}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PdfViewer;
