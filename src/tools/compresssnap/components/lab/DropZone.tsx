import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ImagePlus } from 'lucide-react';
import { ToolTheme } from '../../../../lib/themes';

interface DropZoneProps {
  theme: ToolTheme;
  prompt: string;
  subtitle?: string;
  accept?: string;
  multiple?: boolean;
  onFiles: (files: FileList) => void;
  disabled?: boolean;
  hasItems?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  theme,
  prompt,
  subtitle,
  accept = 'image/jpeg,image/png,image/webp',
  multiple = true,
  onFiles,
  disabled = false,
  hasItems = false,
}) => {
  const [magnetic, setMagnetic] = useState(false);
  const [active, setActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const counter = useRef(0);

  const handleEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setActive(true);
  }, []);
  const handleLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setActive(false);
  }, []);
  const handleOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setMagnetic(true);
  }, []);
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setActive(false);
      setMagnetic(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFiles(e.dataTransfer.files);
      }
    },
    [onFiles]
  );

  const handleClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFiles(e.target.files);
    }
  };

  return (
    <motion.div
      onClick={handleClick}
      onDragEnter={handleEnter}
      onDragLeave={handleLeave}
      onDragOver={handleOver}
      onDrop={handleDrop}
      animate={{
        scale: magnetic ? 1.02 : 1,
      }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="relative group cursor-pointer"
      style={{
        borderRadius: theme.radius === 'full' ? '1.5rem' : theme.radius === 'sm' ? '0.75rem' : '1.25rem',
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInput}
        className="hidden"
      />

      {/* Magnetic glow effect */}
      <AnimatePresence>
        {magnetic && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -inset-2 pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, ${theme.primaryHex}25 0%, transparent 70%)`,
              borderRadius: 'inherit',
            }}
          />
        )}
      </AnimatePresence>

      {/* Border layer */}
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: 'inherit',
          border: `2px dashed ${active ? theme.primaryHex : theme.border}`,
          backgroundColor: active ? `${theme.primaryHex}10` : `${theme.primaryHex}05`,
          padding: hasItems ? '1rem 0.75rem' : '1.25rem 1rem',
          transition: 'all 0.2s ease',
        }}
      >
        {/* Scan line animation when active */}
        {active && (
          <motion.div
            initial={{ y: '-100%' }}
            animate={{ y: '300%' }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-x-0 h-0.5 pointer-events-none"
            style={{
              background: `linear-gradient(to right, transparent, ${theme.primaryHex}, transparent)`,
            }}
          />
        )}

        <div className={`flex ${hasItems ? 'flex-row items-center gap-3' : 'flex-row items-center gap-3 text-left'}`}>
          <div
            className="relative shrink-0"
            style={{
              width: hasItems ? '2rem' : '2.5rem',
              height: hasItems ? '2rem' : '2.5rem',
            }}
          >
            <div
              className="absolute inset-0 rounded-2xl blur-xl"
              style={{
                backgroundColor: theme.primaryHex,
                opacity: magnetic ? 0.5 : 0.2,
                transition: 'opacity 0.3s',
              }}
            />
            <div
              className="relative w-full h-full flex items-center justify-center"
              style={{
                backgroundColor: `${theme.primaryHex}25`,
                border: `1px solid ${theme.border}`,
                borderRadius: theme.radius === 'full' ? '9999px' : '0.75rem',
              }}
            >
              {hasItems ? (
                <ImagePlus className="w-4 h-4" style={{ color: theme.primaryHex }} strokeWidth={2.5} />
              ) : (
                <Upload
                  className="w-4 h-4"
                  style={{ color: theme.primaryHex }}
                  strokeWidth={2.5}
                />
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p
              className={`font-black tracking-tight ${hasItems ? 'text-xs' : 'text-xs'}`}
              style={{ color: theme.text }}
            >
              {active ? (prompt.toLowerCase().includes('drop') ? 'Release to ingest' : prompt) : prompt}
            </p>
            {subtitle && !hasItems && (
              <p
                className="text-[10px] mt-0.5 font-medium"
                style={{ color: theme.textMuted }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
