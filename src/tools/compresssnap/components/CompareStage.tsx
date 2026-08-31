import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Download, X } from 'lucide-react';
import type { CompressItem } from '../lib/types';
import { ssimBand } from '../lib/metrics';

// ============================================================================
// Before / after
// ----------------------------------------------------------------------------
// A wipe rather than two images side by side: at the sizes a browser can show,
// two thumbnails of the same photo look identical no matter what the encoder
// did, and the artefacts only become visible when the same pixels swap under a
// fixed edge.
//
// Holding the handle shows the original; releasing snaps back. That is the
// "compare by holding" gesture, and it is the fastest way to answer the only
// question the panel exists for: can I see the difference?
// ============================================================================

interface CompareStageProps {
  item: CompressItem;
  onClose: () => void;
  onDownload: () => void;
  formatBytes: (bytes: number) => string;
  t: any;
}

const BAND_KEY: Record<string, string> = {
  identical: 'bandIdentical',
  excellent: 'bandExcellent',
  good: 'bandGood',
  fair: 'bandFair',
  poor: 'bandPoor',
};

const BAND_FALLBACK: Record<string, string> = {
  identical: 'Indistinguishable',
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Visible loss',
};

export const CompareStage: React.FC<CompareStageProps> = ({ item, onClose, onDownload, formatBytes, t }) => {
  const [position, setPosition] = useState(50);
  const [held, setHeld] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  const move = useCallback((clientX: number) => {
    const box = frameRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, next)));
  }, []);

  // Pointer events rather than mouse + touch: one code path, and it keeps
  // tracking when the pointer leaves the element mid-drag.
  useEffect(() => {
    if (!held) return;
    const onMove = (event: PointerEvent) => move(event.clientX);
    const onUp = () => setHeld(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [held, move]);

  const result = item.result;
  const band = result && result.ssim !== null ? ssimBand(result.ssim) : null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl glass-card rounded-3xl border border-white/10 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-white/5">
          <span className="text-xs font-black text-white truncate min-w-0 flex-1">{item.name}</span>
          <button
            onClick={onDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 border border-cyan-600/30 text-cyan-300 text-[11px] font-bold hover:bg-cyan-600/30 transition-all cursor-pointer outline-none"
          >
            <Download className="w-3.5 h-3.5" />
            {t.downloadBtn || 'Download'}
          </button>
          <button
            onClick={onClose}
            aria-label={t.closeBtn || 'Close'}
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          ref={frameRef}
          onPointerDown={event => {
            setHeld(true);
            move(event.clientX);
          }}
          className="relative select-none touch-none cursor-ew-resize bg-[#050c12]"
          style={{ aspectRatio: item.width && item.height ? `${item.width} / ${item.height}` : '4 / 3', maxHeight: '65vh' }}
        >
          <img
            src={item.originalUrl}
            alt={t.originalLabel || 'Original'}
            className="absolute inset-0 w-full h-full object-contain"
            draggable={false}
          />
          {result && (
            <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 0 0 ${position}%)` }}>
              <img
                src={result.url}
                alt={t.compressedLabel || 'Compressed'}
                className="absolute inset-0 w-full h-full object-contain"
                draggable={false}
              />
            </div>
          )}

          <div className="absolute inset-y-0 w-0.5 bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.8)]" style={{ left: `${position}%` }}>
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-cyan-400 border-2 border-white/80 shadow-lg" />
          </div>

          <span className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/70 text-[10px] font-black uppercase tracking-wider text-slate-300">
            {t.originalLabel || 'Original'}
          </span>
          <span className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/70 text-[10px] font-black uppercase tracking-wider text-cyan-300">
            {t.compressedLabel || 'Compressed'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3 border-t border-white/5 text-[11px] font-mono">
          <span className="text-slate-500">
            {t.originalSize || 'Original'}: <span className="text-slate-300">{formatBytes(item.originalSize)}</span>
          </span>
          {result && (
            <>
              <span className="text-slate-500">
                {t.compressedSize || 'Compressed'}: <span className="text-cyan-300">{formatBytes(result.bytes)}</span>
              </span>
              <span className="text-slate-500">
                {result.width}×{result.height}
              </span>
              {band && (
                <span className="text-slate-500">
                  SSIM: <span className="text-cyan-300">{result.ssim.toFixed(3)}</span>{' '}
                  <span className="text-slate-400">({t[BAND_KEY[band]] || BAND_FALLBACK[band]})</span>
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompareStage;
