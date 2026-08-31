import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Compass, Globe, Maximize2, Move, Smartphone } from 'lucide-react';
import type { IconSettings, SourceImage } from '../types';
import { ctxOf, drawIcon, frameAt, type AnyCanvas } from '../lib/engine';

interface StageProps {
  settings: IconSettings;
  source: SourceImage | null;
  master: AnyCanvas | null;
  /** Live, uncommitted transform edits (drag / wheel) — not history-worthy. */
  onTransform: (patch: Partial<IconSettings>) => void;
  /** Called once a gesture ends, so one drag is one undo step. */
  onCommit: () => void;
  t: any;
  lang: string;
}

/** Sizes shown at their true pixel dimensions next to the artboard. */
const ACTUAL_SIZES = [16, 32, 48, 64];

/** Paints a canvas from the master at `size`, honouring devicePixelRatio. */
function paintFromMaster(canvas: HTMLCanvasElement | null, master: AnyCanvas | null, size: number, sharpen: boolean) {
  if (!canvas || !master) return;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(frameAt(master, size, sharpen) as CanvasImageSource, 0, 0);
}

export const Stage: React.FC<StageProps> = ({ settings, source, master, onTransform, onCommit, t, lang }) => {
  const boardRef = useRef<HTMLCanvasElement | null>(null);
  const chipRefs = useRef<Record<number, HTMLCanvasElement | null>>({});
  const tabRef = useRef<HTMLCanvasElement | null>(null);
  const searchRef = useRef<HTMLCanvasElement | null>(null);
  const homeRef = useRef<HTMLCanvasElement | null>(null);

  const [comparing, setComparing] = useState(false);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number; css: number } | null>(null);

  const BOARD = 320;

  // --- Painting -----------------------------------------------------------
  // Everything is drawn synchronously on purpose. requestAnimationFrame never
  // fires while the tab is hidden, and a favicon preview that comes back blank
  // after a tab switch is a real bug, not just a test-harness quirk.
  const paint = useCallback(() => {
    const board = boardRef.current;
    if (board) {
      board.width = BOARD;
      board.height = BOARD;
      const ctx = ctxOf(board);
      if (comparing && settings.mode === 'image' && source) {
        // Hold Alt / right-click: the untouched source, no plate, no transform.
        ctx.clearRect(0, 0, BOARD, BOARD);
        const ratio = source.width / source.height;
        const w = ratio > 1 ? BOARD : BOARD * ratio;
        const h = ratio > 1 ? BOARD / ratio : BOARD;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(source.img, (BOARD - w) / 2, (BOARD - h) / 2, w, h);
      } else {
        drawIcon(ctx, BOARD, { settings, source });
      }
    }

    for (const size of ACTUAL_SIZES) paintFromMaster(chipRefs.current[size], master, size, settings.sharpenSmall);
    paintFromMaster(tabRef.current, master, 32, settings.sharpenSmall);
    paintFromMaster(searchRef.current, master, 32, settings.sharpenSmall);
    paintFromMaster(homeRef.current, master, 192, false);
  }, [settings, source, master, comparing]);

  useEffect(paint, [paint]);

  // --- Alt to compare -----------------------------------------------------
  useEffect(() => {
    if (settings.mode !== 'image' || !source) return;
    const down = (e: KeyboardEvent) => {
      if (e.altKey) setComparing(true);
    };
    const up = (e: KeyboardEvent) => {
      if (!e.altKey) setComparing(false);
    };
    const blur = () => setComparing(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [settings.mode, source]);

  // --- Pan ----------------------------------------------------------------
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button === 2) {
      setComparing(true);
      return;
    }
    // The CSS width is not the 320px backing store (the column is narrower on
    // most viewports), so the delta has to be normalised against the rendered
    // size or the artwork drifts behind the cursor.
    drag.current = {
      x: e.clientX,
      y: e.clientY,
      ox: settings.offsetX,
      oy: settings.offsetY,
      css: e.currentTarget.getBoundingClientRect().width || BOARD,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Capture is a nicety (it keeps the drag alive outside the canvas), not
      // a requirement — never let it take the gesture down with it.
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drag.current) return;
    const dx = ((e.clientX - drag.current.x) / drag.current.css) * 100;
    const dy = ((e.clientY - drag.current.y) / drag.current.css) * 100;
    onTransform({
      offsetX: Math.max(-60, Math.min(60, drag.current.ox + dx)),
      offsetY: Math.max(-60, Math.min(60, drag.current.oy + dy)),
    });
  };

  const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setComparing(false);
    if (!drag.current) return;
    drag.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
    onCommit();
  };

  // --- Zoom at the cursor -------------------------------------------------
  const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    // No preventDefault here: React registers wheel as a passive listener, so
    // the call is a no-op that only logs a warning. The non-passive listener
    // installed below is what actually stops the page from scrolling.
    const rect = e.currentTarget.getBoundingClientRect();
    // Cursor position as a signed % of the board, measured from its centre —
    // the same unit offsetX/offsetY use.
    const cx = ((e.clientX - rect.left) / rect.width - 0.5) * 100;
    const cy = ((e.clientY - rect.top) / rect.height - 0.5) * 100;

    const old = settings.scale || 1;
    const next = Math.max(0.2, Math.min(4, old * (e.deltaY < 0 ? 1.08 : 1 / 1.08)));
    const k = next / old;

    onTransform({
      scale: next,
      offsetX: Math.max(-60, Math.min(60, cx - (cx - settings.offsetX) * k)),
      offsetY: Math.max(-60, Math.min(60, cy - (cy - settings.offsetY) * k)),
    });
  };

  // Chrome makes wheel listeners on React elements passive, so preventDefault
  // inside onWheel is ignored and the page scrolls under the cursor. A manual
  // non-passive listener is the only way to keep the gesture on the artboard.
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const stop = (e: WheelEvent) => e.preventDefault();
    el.addEventListener('wheel', stop, { passive: false });
    return () => el.removeEventListener('wheel', stop);
  }, []);

  const interactive = settings.mode === 'image' && !!source;

  return (
    <div className="flex flex-col gap-5">
      {/* Artboard */}
      <div className="relative rounded-2xl border border-white/5 bg-black/50 p-5 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.35] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(45deg, #111a2e 25%, transparent 25%), linear-gradient(-45deg, #111a2e 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111a2e 75%), linear-gradient(-45deg, transparent 75%, #111a2e 75%)',
            backgroundSize: '18px 18px',
            backgroundPosition: '0 0, 0 9px, 9px -9px, -9px 0',
          }}
        />
        <canvas
          ref={boardRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onWheel={onWheel}
          onContextMenu={e => e.preventDefault()}
          className={`relative mx-auto block w-full max-w-[320px] aspect-square rounded-xl ${
            interactive ? 'cursor-grab active:cursor-grabbing touch-none' : ''
          }`}
        />
        {interactive && (
          <div className="relative mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] font-bold text-slate-500">
            <span className="flex items-center gap-1.5">
              <Move className="w-3 h-3 text-blue-500" />
              {t.stageDragHint || 'Drag to move · wheel to zoom at the cursor'}
            </span>
            <span className="flex items-center gap-1.5">
              <Maximize2 className="w-3 h-3 text-blue-500" />
              {t.stageCompareHint || 'Hold Alt (or right-click) to see the original'}
            </span>
          </div>
        )}
      </div>

      {/* True pixel sizes */}
      <div className="rounded-2xl border border-white/5 bg-black/30 p-4">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">
          {t.previewActualSize || 'Actual size, exactly as exported'}
        </div>
        <div className="flex flex-wrap items-end gap-5">
          {ACTUAL_SIZES.map(size => (
            <div key={size} className="flex flex-col items-center gap-1.5">
              <div className="flex items-center justify-center rounded bg-white/5 p-1.5" style={{ minHeight: 20 }}>
                <canvas
                  ref={el => {
                    chipRefs.current[size] = el;
                  }}
                  style={{ width: size, height: size, imageRendering: 'pixelated' }}
                />
              </div>
              <span className="text-[9px] font-mono font-bold text-slate-500">{size}px</span>
            </div>
          ))}
        </div>
      </div>

      {/* Context mockups */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-blue-500" />
            {t.preview_tab || 'Browser Tab'}
          </span>
          <div className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 flex items-center gap-2 text-xs text-slate-300 font-medium select-none shadow-md">
            <div className="w-4 h-4 shrink-0 flex items-center justify-center">
              <canvas ref={tabRef} style={{ width: 16, height: 16 }} />
            </div>
            <span className="truncate">{settings.appName || 'My site'}</span>
            <span className="ml-auto text-[10px] text-slate-600 font-bold">✕</span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            {t.preview_search || 'Google Search Result'}
          </span>
          <div className="w-full bg-slate-950 border border-white/10 rounded-lg p-3 flex flex-col gap-1.5 text-xs select-none shadow-md overflow-hidden">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 shrink-0 bg-black/40 rounded-full flex items-center justify-center border border-white/5">
                <canvas ref={searchRef} style={{ width: 16, height: 16 }} />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-white text-[11px] leading-none truncate">
                  {settings.appShortName || settings.appName || 'My site'}
                </span>
                <span className="text-[9px] text-slate-500 leading-none truncate">
                  https://example.com › {lang}
                </span>
              </div>
            </div>
            <span className="text-blue-400 font-semibold text-sm leading-tight truncate">
              {settings.appName || 'My site'}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Smartphone className="w-3.5 h-3.5 text-blue-500" />
            {t.preview_mobile || 'Mobile Home Screen'}
          </span>
          <div className="w-full bg-slate-950 border border-white/10 rounded-lg p-4 flex items-center justify-center select-none shadow-md relative min-h-[96px] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/30 to-blue-900/10 pointer-events-none" />
            <div className="flex flex-col items-center gap-1.5 relative z-10">
              <div
                className="w-14 h-14 rounded-[1.1rem] overflow-hidden shadow-lg"
                style={{ background: settings.appleBg }}
              >
                <canvas ref={homeRef} className="w-full h-full" />
              </div>
              <span className="text-[9px] text-slate-300 font-bold leading-none truncate max-w-[80px]">
                {settings.appShortName || settings.appName || 'My site'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stage;
