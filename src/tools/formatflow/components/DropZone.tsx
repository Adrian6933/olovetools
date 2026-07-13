import React, { useCallback, useState, useEffect } from 'react';
import { UploadCloud, Layers, Sparkles, ClipboardCopy, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Language } from '../../../locales/meta';

interface DropZoneProps {
  onFilesSelect: (files: File[]) => void;
  language: Language;
  dictionary?: any;
}

const DropZone: React.FC<DropZoneProps> = ({ onFilesSelect, language, dictionary }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const t = (dictionary || {}).dropzone;

  const processFiles = (fileList: FileList | File[]) => {
    const validFiles: File[] = [];
    const maxFiles = 50;

    Array.from(fileList).forEach(file => {
      if (
        file.type.startsWith('image/') || 
        file.name.toLowerCase().endsWith('.heic') || 
        file.name.toLowerCase().endsWith('.heif')
      ) {
        validFiles.push(file);
      }
    });

    if (validFiles.length === 0) {
      alert(t.invalid);
      return;
    }

    if (validFiles.length > maxFiles) {
      alert(t.tooMany);
      onFilesSelect(validFiles.slice(0, maxFiles));
    } else {
      onFilesSelect(validFiles);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [onFilesSelect, t]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  }, [onFilesSelect, t]);



  return (
    <div className="flex flex-col gap-6">
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          w-full h-[400px] rounded-[3.5rem] border-4 border-dashed transition-all duration-700 flex flex-col items-center justify-center gap-6 p-12 cursor-pointer group relative overflow-hidden glass-card
          ${isDragOver 
            ? 'border-primary bg-primary/10 scale-[1.03] shadow-[0_0_80px_-20px_rgba(99,102,241,0.4)]' 
            : 'border-slate-800 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800/80 hover:shadow-2xl'
          }
        `}
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        {/* Decorative background glow */}
        <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000`}></div>
        
        <motion.div 
          animate={{ 
            scale: isDragOver ? 1.1 : 1,
            rotate: isDragOver ? 3 : 0
          }}
          className={`p-8 rounded-[2rem] transition-all duration-700 relative z-10 ${isDragOver ? 'bg-primary/20' : 'bg-slate-800 group-hover:bg-slate-700 group-hover:rotate-6'}`}
        >
          {isDragOver ? (
            <Sparkles className="w-16 h-16 text-primary animate-pulse" />
          ) : (
            <UploadCloud className="w-16 h-16 text-slate-400 group-hover:text-white transition-colors duration-500" />
          )}
        </motion.div>
        
        <div className="text-center space-y-6 z-10">
          <div className="flex flex-col items-center gap-4">
            {isDragOver ? (
              <h3 className="text-3xl font-display font-black text-primary animate-pulse tracking-tight">
                {t.drop}
              </h3>
            ) : (
              <div className="px-8 py-3 bg-primary text-white rounded-full font-bold shadow-[0_0_20px_rgba(99,102,241,0.4)] group-hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] group-hover:-translate-y-1 transition-all duration-300">
                {t.click}
              </div>
            )}
          </div>
          <p className="text-lg text-slate-500 max-w-sm mx-auto font-medium opacity-70 group-hover:opacity-100 transition-opacity">
            {t.dragInfoStart} <span className="text-primary font-black underline decoration-2 underline-offset-4">{t.dragInfoCount}</span> {t.dragInfoEnd}
            <br/>
            <span className="text-sm mt-2 block font-bold text-slate-600">{t.settingsInfo}</span>
          </p>
        </div>

        {isDragOver && (
          <div className="absolute inset-0 pointer-events-none border-8 border-primary/20 animate-pulse rounded-[3rem]"></div>
        )}

        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept="image/*,.heic,.heif"
          multiple
          onChange={handleFileInput}
        />
      </motion.div>

      {/* Referral Link to PasteSnap */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="flex justify-center mb-16"
      >
        <a 
          href={`/${language.toLowerCase()}/pastesnap`}
          className="group flex items-center gap-4 px-8 py-4 bg-slate-900/40 border border-slate-800 hover:border-secondary/50 rounded-full transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:bg-slate-800 cursor-pointer"
        >
          <div className="p-2 bg-secondary/10 rounded-lg group-hover:scale-110 transition-transform">
            <ClipboardCopy className="w-4 h-4 text-secondary" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-slate-400 transition-colors">{t.pastePrompt}</span>
            <span className="text-sm font-bold text-slate-300 group-hover:text-white flex items-center gap-2">
              {t.pasteAction}
            </span>
          </div>
        </a>
      </motion.div>
    </div>
  );
};

export default DropZone;