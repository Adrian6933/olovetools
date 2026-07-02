import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, ImageIcon } from 'lucide-react';
import { ToolTheme } from '../../../../lib/themes';
import { CompressedImageItem } from '../../types';

interface SplitStageProps {
  theme: ToolTheme;
  item: CompressedImageItem | null;
  formatBytes: (bytes: number) => string;
  labels: {
    originalLabel: string;
    compressedLabel: string;
    originalSize: string;
    compressedSize: string;
    savings: string;
    downloadBtn: string;
  };
  onDownload: () => void;
}

export const SplitStage: React.FC<SplitStageProps> = ({
  theme,
  item,
  formatBytes,
  labels,
  onDownload,
}) => {
  const [pos, setPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPos(pct);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return;
      const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
      handleMove(x);
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [handleMove]);

  // Empty state
  if (!item) {
    return (
      <div
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
        style={{
          backgroundColor: `${theme.primaryHex}05`,
          border: `1px solid ${theme.border}`,
          borderRadius: theme.radius === 'full' ? '1.5rem' : '1.25rem',
          minHeight: '24rem',
        }}
      >
        <div className="text-center space-y-3 max-w-xs px-6">
          <div
            className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              backgroundColor: `${theme.primaryHex}10`,
              border: `1px solid ${theme.border}`,
            }}
          >
            <ImageIcon className="w-8 h-8" style={{ color: theme.primaryHex }} strokeWidth={2} />
          </div>
          <p
            className="text-sm font-bold"
            style={{ color: theme.textMuted }}
          >
            Upload an image to begin compression
          </p>
          <p
            className="text-xs"
            style={{ color: theme.textMuted, opacity: 0.7 }}
          >
            Drop your files on the left to start
          </p>
        </div>
      </div>
    );
  }

  const isCompressing = item.status === 'compressing';
  const isDone = item.status === 'done';
  const compressedUrl = item.compressedUrl || item.originalUrl;
  const savings = item.savings ?? 0;

  return (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="relative w-full h-full flex flex-col gap-3"
    >
      {/* Image area with split view */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden select-none"
        style={{
          backgroundColor: '#000',
          border: `1px solid ${theme.border}`,
          borderRadius: theme.radius === 'full' ? '1.5rem' : '1.25rem',
          aspectRatio: '16 / 10',
        }}
        onMouseDown={(e) => {
          dragging.current = true;
          handleMove(e.clientX);
        }}
        onTouchStart={(e) => {
          dragging.current = true;
          handleMove(e.touches[0].clientX);
        }}
      >
        {/* Original */}
        <img
          src={item.originalUrl}
          alt="Original"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          draggable={false}
        />

        {/* Compressed overlay (clipped) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            clipPath: `polygon(${pos}% 0, 100% 0, 100% 100%, ${pos}% 100%)`,
          }}
        >
          <img
            src={compressedUrl}
            alt="Compressed"
            className="absolute inset-0 w-full h-full object-contain"
            draggable={false}
          />
        </div>

        {/* Labels */}
        <div
          className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider pointer-events-none"
          style={{
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {labels.originalLabel} · {formatBytes(item.originalSize)}
          {item.width && item.height && (
            <span className="opacity-60 ml-1.5">{item.width}×{item.height}</span>
          )}
        </div>

        <div
          className="absolute top-3 right-3 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider pointer-events-none"
          style={{
            backgroundColor: `${theme.primaryHex}e0`,
            color: '#fff',
            border: `1px solid ${theme.primaryHex}`,
          }}
        >
          {labels.compressedLabel} · {formatBytes(item.compressedSize ?? 0)}
          {item.compressedWidth && item.compressedHeight && (
            <span className="opacity-80 ml-1.5">{item.compressedWidth}×{item.compressedHeight}</span>
          )}
        </div>

        {/* Divider line */}
        <div
          className="absolute top-0 bottom-0 w-px pointer-events-none"
          style={{
            left: `${pos}%`,
            backgroundColor: theme.primaryHex,
            boxShadow: `0 0 12px ${theme.primaryHex}`,
          }}
        >
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center font-black"
            style={{
              backgroundColor: theme.primaryHex,
              color: '#fff',
              border: '2px solid #fff',
              boxShadow: `0 4px 16px ${theme.primaryHex}80`,
            }}
          >
            <span className="text-base">↔</span>
          </div>
        </div>

        {/* Compressing overlay */}
        {isCompressing && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          >
            <div
              className="px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest"
              style={{
                backgroundColor: `${theme.primaryHex}30`,
                border: `1px solid ${theme.primaryHex}`,
                color: theme.primaryHex,
              }}
            >
              Compressing...
            </div>
          </div>
        )}
      </div>

      {/* Stats row */}
      {isDone && (
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
            <div>
              <span style={{ color: theme.textMuted }}>Savings</span>{' '}
              <span style={{ color: theme.primaryHex }} className="text-base tabular-nums">
                -{savings}%
              </span>
            </div>
            {item.width && item.compressedWidth && item.width !== item.compressedWidth && (
              <div>
                <span style={{ color: theme.textMuted }}>Resize</span>{' '}
                <span style={{ color: theme.text }} className="tabular-nums">
                  {item.width}×{item.height} → {item.compressedWidth}×{item.compressedHeight}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: theme.primaryHex,
              color: '#fff',
            }}
          >
            <Download className="w-3.5 h-3.5" strokeWidth={3} />
            {labels.downloadBtn}
          </button>
        </div>
      )}
    </motion.div>
  );
};
