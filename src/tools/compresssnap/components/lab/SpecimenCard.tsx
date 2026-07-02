import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, Eye, Loader2, AlertCircle, Download, Check } from 'lucide-react';
import { ToolTheme } from '../../../../lib/themes';
import { CompressedImageItem } from '../../types';
import { CompressionMeter } from './CompressionMeter';

interface SpecimenCardProps {
  theme: ToolTheme;
  item: CompressedImageItem;
  isActive: boolean;
  formatBytes: (bytes: number) => string;
  labels: {
    originalSize: string;
    individualSettings: string;
    compareBtn: string;
    downloadBtn: string;
    statusCompressing: string;
    statusError: string;
  };
  onSelect: () => void;
  onRemove: () => void;
  onPreview: () => void;
  onDownload: () => void;
}

export const SpecimenCard: React.FC<SpecimenCardProps> = ({
  theme,
  item,
  isActive,
  formatBytes,
  labels,
  onSelect,
  onRemove,
  onPreview,
  onDownload,
}) => {
  const isCompressing = item.status === 'compressing';
  const isDone = item.status === 'done';
  const isError = item.status === 'error';
  const savings = item.savings ?? 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -32 }}
      transition={{ duration: 0.25 }}
      onClick={onSelect}
      className="group relative cursor-pointer"
      style={{
        borderRadius: theme.radius === 'full' ? '1.5rem' : '0.875rem',
      }}
    >
      {/* Active ring */}
      {isActive && (
        <motion.div
          layoutId="active-specimen-ring"
          className="absolute -inset-0.5 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${theme.primaryHex}, ${theme.primaryHex}40)`,
            borderRadius: 'inherit',
            opacity: 0.6,
          }}
        />
      )}

      <div
        className="relative flex items-center gap-3 p-2.5"
        style={{
          backgroundColor: theme.surface,
          borderRadius: 'inherit',
          border: `1px solid ${isActive ? theme.primaryHex : theme.border}`,
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Thumbnail */}
        <div
          className="relative shrink-0 overflow-hidden"
          style={{
            width: '3rem',
            height: '3rem',
            borderRadius: theme.radius === 'full' ? '9999px' : '0.5rem',
            backgroundColor: '#000',
            border: `1px solid ${theme.border}`,
          }}
        >
          <img
            src={item.originalUrl}
            alt={item.name}
            className="w-full h-full object-contain"
          />
          {isCompressing && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            >
              <Loader2
                className="w-4 h-4 animate-spin"
                style={{ color: theme.primaryHex }}
              />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-bold truncate"
            style={{ color: theme.text }}
            title={item.name}
          >
            {item.name}
          </p>
          <div
            className="flex items-center gap-2 mt-0.5 text-[10px] tabular-nums font-mono font-bold"
            style={{ color: theme.textMuted }}
          >
            <span>{formatBytes(item.originalSize)}</span>
            {isDone && item.compressedSize != null && (
              <>
                <span style={{ color: theme.primaryHex }}>→</span>
                <span style={{ color: theme.primaryHex }}>
                  {formatBytes(item.compressedSize)}
                </span>
              </>
            )}
            {isError && (
              <span className="text-red-400">{labels.statusError}</span>
            )}
            {isCompressing && (
              <span style={{ color: theme.primaryHex }}>
                {labels.statusCompressing}
              </span>
            )}
          </div>
        </div>

        {/* Right: meter + actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isDone && savings > 0 && (
            <CompressionMeter
              theme={theme}
              value={savings}
              size={36}
              strokeWidth={3.5}
            />
          )}

          {/* Quick actions appear on hover */}
          <div
            className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            {isDone && (
              <>
                <button
                  onClick={onPreview}
                  className="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:scale-110"
                  style={{
                    backgroundColor: `${theme.primaryHex}20`,
                    color: theme.primaryHex,
                  }}
                  title={labels.compareBtn}
                >
                  <Eye className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
                <button
                  onClick={onDownload}
                  className="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:scale-110"
                  style={{
                    backgroundColor: theme.primaryHex,
                    color: '#fff',
                  }}
                  title={labels.downloadBtn}
                >
                  <Download className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
              </>
            )}
            <button
              onClick={onRemove}
              className="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:scale-110 hover:bg-red-500/20 hover:text-red-400"
              style={{
                color: theme.textMuted,
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {isDone && savings === 0 && (
            <span title="No savings" className="text-amber-400 text-[10px] font-black">
              <Check className="w-3.5 h-3.5" />
            </span>
          )}
          {isError && (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
        </div>
      </div>
    </motion.div>
  );
};
