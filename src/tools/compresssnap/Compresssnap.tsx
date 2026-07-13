import React, { useState, useEffect, useCallback, useRef } from 'react';
import JSZip from 'jszip';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Image as ImageIcon, 
  Settings, 
  Download, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  Eye, 
  ArrowRight, 
  Lock, 
  Zap, 
  RefreshCw, 
  Sliders,
  Check
} from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import type { Language } from '../../locales/meta';
import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';
import { CompressSettings, CompressedImageItem } from './types';

interface CompresssnapProps {
  lang: Language;
  dictionary?: any;
}

const DEFAULT_SETTINGS: CompressSettings = {
  quality: 80,
  format: 'original',
  scale: 100,
  resizeMode: 'none',
  width: 1920,
  height: 1080,
  maintainAspectRatio: true
};

export const Compresssnap: React.FC<CompresssnapProps> = ({ lang, dictionary }) => {
  const t = dictionary || {};
  
  // App state
  const [items, setItems] = useState<CompressedImageItem[]>([]);
  const [globalSettings, setGlobalSettings] = useState<CompressSettings>(DEFAULT_SETTINGS);
  const [comparedItem, setComparedItem] = useState<CompressedImageItem | null>(null);
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeItemSettings, setActiveItemSettings] = useState<string | null>(null); // item ID for individual config
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to top helper
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Format bytes helper
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Helper: Read file as Data URL
  const readFileAsDataURL = (file: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Helper: Load image from source URL
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  // Main Image Compression Core Logic
  const compressImage = useCallback(async (item: CompressedImageItem, settings: CompressSettings): Promise<{
    blob: Blob;
    width: number;
    height: number;
    compressedWidth: number;
    compressedHeight: number;
  }> => {
    // Load image elements
    const img = await loadImage(item.originalUrl);
    const originalWidth = img.naturalWidth || img.width;
    const originalHeight = img.naturalHeight || img.height;

    // Determine target dimensions
    let targetWidth = originalWidth;
    let targetHeight = originalHeight;

    if (settings.resizeMode === 'scale') {
      const scaleFactor = settings.scale / 100;
      targetWidth = Math.round(originalWidth * scaleFactor);
      targetHeight = Math.round(originalHeight * scaleFactor);
    } else if (settings.resizeMode === 'dimensions') {
      if (settings.maintainAspectRatio) {
        const ratio = originalWidth / originalHeight;
        if (settings.width / settings.height > ratio) {
          targetHeight = settings.height;
          targetWidth = Math.round(targetHeight * ratio);
        } else {
          targetWidth = settings.width;
          targetHeight = Math.round(targetWidth / ratio);
        }
      } else {
        targetWidth = settings.width;
        targetHeight = settings.height;
      }
    }

    // Canvas setup
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas 2D context could not be created.');
    }

    // Determine target mime type
    let mimeType = item.file.type;
    if (settings.format !== 'original') {
      mimeType = settings.format;
    }

    // For JPEG outputs, fill background with white (removes alpha channels safely)
    if (mimeType === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    // Draw image onto canvas
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    // Export blob
    return new Promise((resolve, reject) => {
      const qualityFactor = settings.quality / 100;
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({
              blob,
              width: originalWidth,
              height: originalHeight,
              compressedWidth: targetWidth,
              compressedHeight: targetHeight
            });
          } else {
            reject(new Error('Canvas export to blob failed.'));
          }
        },
        mimeType,
        qualityFactor
      );
    });
  }, []);

  // Process a single item in queue
  const processItem = useCallback(async (id: string, settings: CompressSettings) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, status: 'compressing' } : item));

    try {
      const item = items.find(i => i.id === id);
      if (!item) return;

      const result = await compressImage(item, settings);
      const url = URL.createObjectURL(result.blob);

      // Revoke previous compressed URL if it existed
      if (item.compressedUrl) {
        URL.revokeObjectURL(item.compressedUrl);
      }

      setItems(prev => prev.map(i => {
        if (i.id === id) {
          const savings = i.originalSize > 0 
            ? Math.max(0, Math.round(((i.originalSize - result.blob.size) / i.originalSize) * 100))
            : 0;

          return {
            ...i,
            status: 'done',
            compressedSize: result.blob.size,
            compressedUrl: url,
            width: result.width,
            height: result.height,
            compressedWidth: result.compressedWidth,
            compressedHeight: result.compressedHeight,
            savings,
            settings // Store settings applied
          };
        }
        return i;
      }));
    } catch (err) {
      console.error('Compression error:', err);
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'error', error: String(err) } : i));
    }
  }, [items, compressImage]);

  // Trigger compression on setting changes or file additions
  useEffect(() => {
    items.forEach(item => {
      // Re-compress if item is idle
      if (item.status === 'idle') {
        const settingsToUse = item.settings || globalSettings;
        processItem(item.id, settingsToUse);
      }
    });
  }, [items, globalSettings, processItem]);

  // Handle uploaded files
  const addFiles = async (files: FileList) => {
    const newItems: CompressedImageItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const originalUrl = URL.createObjectURL(file);
      newItems.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        originalSize: file.size,
        compressedSize: null,
        originalUrl,
        compressedUrl: null,
        width: null,
        height: null,
        compressedWidth: null,
        compressedHeight: null,
        status: 'idle',
        savings: null
      });
    }

    if (newItems.length > 0) {
      setItems(prev => [...prev, ...newItems]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
  };

  // Keyboard paste integration
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const files = e.clipboardData?.files;
    if (files && files.length > 0) {
      addFiles(files);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  // Download single item
  const downloadSingle = (item: CompressedImageItem) => {
    if (!item.compressedUrl) return;
    
    // Determine extension
    let ext: string = item.settings?.format || globalSettings.format;
    if (ext === 'original') {
      ext = item.file.type;
    }
    const extStr = ext.split('/')[1] === 'jpeg' ? 'jpg' : ext.split('/')[1];

    // Create file base name
    const originalName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
    const finalName = `${originalName}-compressed.${extStr}`;

    const link = document.createElement('a');
    link.href = item.compressedUrl;
    link.download = finalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download all as ZIP
  const downloadAll = async () => {
    const zip = new JSZip();
    const doneItems = items.filter(item => item.status === 'done' && item.compressedUrl);

    for (let i = 0; i < doneItems.length; i++) {
      const item = doneItems[i];
      const response = await fetch(item.compressedUrl!);
      const blob = await response.blob();

      let ext: string = item.settings?.format || globalSettings.format;
      if (ext === 'original') {
        ext = item.file.type;
      }
      const extStr = ext.split('/')[1] === 'jpeg' ? 'jpg' : ext.split('/')[1];

      const originalName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
      zip.file(`${i + 1}_${originalName}.${extStr}`, blob);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = 'compressed-images.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  // Remove single image
  const removeItem = (id: string) => {
    setItems(prev => {
      const target = prev.find(i => i.id === id);
      if (target) {
        URL.revokeObjectURL(target.originalUrl);
        if (target.compressedUrl) URL.revokeObjectURL(target.compressedUrl);
      }
      return prev.filter(i => i.id !== id);
    });
    if (activeItemSettings === id) setActiveItemSettings(null);
    if (comparedItem?.id === id) setComparedItem(null);
  };

  // Reset entire workflow
  const resetApp = () => {
    items.forEach(i => {
      URL.revokeObjectURL(i.originalUrl);
      if (i.compressedUrl) URL.revokeObjectURL(i.compressedUrl);
    });
    setItems([]);
    setGlobalSettings(DEFAULT_SETTINGS);
    setComparedItem(null);
    setActiveItemSettings(null);
  };

  // Apply individual settings change
  const updateItemSettings = (id: string, settingsUpdate: Partial<CompressSettings>) => {
    setItems(prev => prev.map(i => {
      if (i.id === id) {
        const currentSettings = i.settings || globalSettings;
        return {
          ...i,
          status: 'idle', // Reset to idle to trigger recalculation
          settings: { ...currentSettings, ...settingsUpdate } as CompressSettings
        };
      }
      return i;
    }));
  };

  const handleLanguageChange = (newLang: string) => {
    window.location.href = `/${newLang.toLowerCase()}/compresssnap`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#05090e] text-slate-100 selection:bg-cyan-500/30 overflow-x-hidden font-sans">
      {/* Background Orbs */}
      

      <Header currentLang={lang} onLanguageChange={handleLanguageChange} onReset={resetApp} t={t} />

      <main className="flex-1 flex flex-col items-center pt-36 pb-32 px-4 md:px-12 relative z-10 w-full">
        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-compresssnap-top" />
        <div className="max-w-6xl w-full text-center space-y-16 md:space-y-24">
          
          {/* Hero Header */}
          <div className="flex flex-col items-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center space-x-2 px-5 py-2 rounded-full bg-cyan-950/40 border border-cyan-800/30 text-cyan-400 text-xs font-black tracking-widest uppercase shadow-[0_0_25px_rgba(6,182,212,0.15)]">
              <Sparkles className="w-4 h-4 animate-float" />
              <span>{t.title}</span>
            </div>
            
            <h1 className="text-4xl md:text-[5.5rem] font-black tracking-tight leading-[0.9] text-white bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-400">
              {t.title}
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              {t.description}
            </p>
          </div>

          {/* Interactive Core */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left side: Upload area & queue */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Dropzone */}
              <div 
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="group relative border-2 border-dashed border-cyan-950 hover:border-cyan-500/40 bg-[#080d16]/30 hover:bg-[#0a1220]/40 rounded-3xl p-12 md:p-16 flex flex-col items-center justify-center space-y-6 cursor-pointer transition-premium shadow-xl shadow-black/20"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileInput} 
                  multiple 
                  accept="image/jpeg,image/png,image/webp" 
                  className="hidden" 
                />
                
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-500/10 blur-xl rounded-full scale-125 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="w-20 h-20 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-center text-cyan-400 relative z-10 transition-transform group-hover:scale-105 group-hover:-translate-y-1 shadow-lg shadow-black/40">
                    <Upload className="w-10 h-10 animate-float" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white tracking-tight">{t.dropzonePrompt}</h3>
                  <p className="text-slate-500 text-sm font-medium">{t.dropzoneSubtitle}</p>
                </div>
              </div>

              {/* Image Queue List */}
              {items.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-cyan-400" />
                      <span>{t.imagesInCollection} ({items.length})</span>
                    </h2>
                    
                    <button 
                      onClick={resetApp}
                      className="text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.clearBtn}</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    <AnimatePresence initial={false}>
                      {items.map((item) => {
                        const isConfigActive = activeItemSettings === item.id;
                        const itemSettings = item.settings || globalSettings;
                        const progressPercent = item.savings;

                        return (
                          <motion.div 
                            key={item.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                            className="glass-card rounded-2xl p-4 md:p-5 flex flex-col space-y-4 transition-all"
                          >
                            <div className="flex items-center justify-between gap-4">
                              {/* Thumbnail */}
                              <div className="w-16 h-16 bg-black/40 border border-white/5 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                                <img src={item.originalUrl} alt={item.name} className="w-full h-full object-contain" />
                              </div>

                              {/* Details */}
                              <div className="flex-1 min-w-0 text-left">
                                <h4 className="text-sm font-bold text-white truncate pr-4">{item.name}</h4>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-400 font-medium">
                                  <span>{t.originalSize}: <strong>{formatBytes(item.originalSize)}</strong></span>
                                  {item.width && item.height && (
                                    <span className="opacity-60">{item.width}x{item.height}</span>
                                  )}
                                </div>
                              </div>

                              {/* Compression Results */}
                              <div className="text-right shrink-0">
                                {item.status === 'compressing' && (
                                  <div className="flex items-center gap-1 text-cyan-400 text-xs font-bold animate-pulse">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>{t.statusCompressing}</span>
                                  </div>
                                )}
                                {item.status === 'done' && (
                                  <div className="flex flex-col items-end">
                                    <span className="text-sm font-black text-cyan-400">
                                      {formatBytes(item.compressedSize || 0)}
                                    </span>
                                    {progressPercent !== null && progressPercent > 0 && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/30 text-cyan-400 font-bold mt-1">
                                        -{progressPercent}%
                                      </span>
                                    )}
                                  </div>
                                )}
                                {item.status === 'error' && (
                                  <span className="text-xs text-red-400 font-bold flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    {t.statusError}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Individual custom settings drawer */}
                            {isConfigActive && (
                              <div className="border-t border-white/5 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left animate-in slide-in-from-top-4 duration-300">
                                <div>
                                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">{t.formatLabel}</label>
                                  <select 
                                    value={itemSettings.format}
                                    onChange={(e) => updateItemSettings(item.id, { format: e.target.value as any })}
                                    className="w-full bg-[#0a1019] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500"
                                  >
                                    <option value="original">{t.originalFormat}</option>
                                    <option value="image/webp">WebP</option>
                                    <option value="image/jpeg">JPG</option>
                                    <option value="image/png">PNG</option>
                                  </select>
                                </div>
                                
                                <div>
                                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">{t.qualityLabel} ({itemSettings.quality}%)</label>
                                  <input 
                                    type="range" 
                                    min="1" 
                                    max="100" 
                                    value={itemSettings.quality} 
                                    onChange={(e) => updateItemSettings(item.id, { quality: Number(e.target.value) })}
                                    className="w-full h-1.5 rounded bg-white/10 outline-none accent-cyan-500 cursor-pointer"
                                    disabled={itemSettings.format === 'image/png'}
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">{t.scaleLabel} ({itemSettings.scale}%)</label>
                                  <input 
                                    type="range" 
                                    min="10" 
                                    max="100" 
                                    value={itemSettings.scale} 
                                    onChange={(e) => updateItemSettings(item.id, { scale: Number(e.target.value), resizeMode: 'scale' })}
                                    className="w-full h-1.5 rounded bg-white/10 outline-none accent-cyan-500 cursor-pointer"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Card Footer Actions */}
                            <div className="flex items-center justify-between border-t border-white/5 pt-3">
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => setActiveItemSettings(isConfigActive ? null : item.id)}
                                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5
                                    ${isConfigActive 
                                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' 
                                      : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
                                >
                                  <Sliders className="w-3.5 h-3.5" />
                                  <span>{t.individualSettings}</span>
                                </button>

                                {item.status === 'done' && item.compressedUrl && (
                                  <button 
                                    onClick={() => {
                                      setComparedItem(item);
                                      setSliderPos(50);
                                    }}
                                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer flex items-center gap-1.5"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>{t.compareBtn}</span>
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => removeItem(item.id)}
                                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>

                                {item.status === 'done' && (
                                  <button 
                                    onClick={() => downloadSingle(item)}
                                    className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                                  >
                                    <Download className="w-3.5 h-3.5 stroke-[3]" />
                                    <span>{t.downloadBtn}</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>

            {/* Right side: Global control panel */}
            <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
              
              <div className="glass-card rounded-3xl p-6 md:p-8 space-y-6 text-left shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Settings className="w-5 h-5 text-cyan-400" />
                  <span>{t.globalSettings}</span>
                </h3>

                {/* Format selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.formatLabel}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'original', label: t.originalFormat },
                      { key: 'image/webp', label: 'WebP' },
                      { key: 'image/jpeg', label: 'JPG' },
                      { key: 'image/png', label: 'PNG' }
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => {
                          setGlobalSettings(prev => ({ ...prev, format: opt.key as any }));
                          // Trigger re-compression on items that don't have overrides
                          setItems(prev => prev.map(i => i.settings ? i : { ...i, status: 'idle' }));
                        }}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer
                          ${globalSettings.format === opt.key 
                            ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-inner' 
                            : 'bg-[#0a0f18]/40 border-white/5 text-slate-400 hover:text-white hover:bg-[#0a0f18]/80'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quality slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                    <span>{t.qualityLabel}</span>
                    <span className="text-cyan-400 font-bold">{globalSettings.quality}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={globalSettings.quality}
                    onChange={(e) => {
                      const quality = Number(e.target.value);
                      setGlobalSettings(prev => ({ ...prev, quality }));
                      setItems(prev => prev.map(i => i.settings ? i : { ...i, status: 'idle' }));
                    }}
                    className="w-full h-1.5 rounded bg-white/10 outline-none accent-cyan-500 cursor-pointer"
                    disabled={globalSettings.format === 'image/png'}
                  />
                  {globalSettings.format === 'image/png' && (
                    <p className="text-[10px] text-slate-500 font-medium italic mt-1">
                      * PNG uses lossless compression; quality changes will only apply if resized or converted.
                    </p>
                  )}
                </div>

                {/* Resize settings */}
                <div className="space-y-4 border-t border-white/5 pt-5">
                  <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                    <span>Resize Mode</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'none', label: 'None' },
                      { key: 'scale', label: 'Scale' },
                      { key: 'dimensions', label: 'Custom' }
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => {
                          setGlobalSettings(prev => ({ ...prev, resizeMode: opt.key as any }));
                          setItems(prev => prev.map(i => i.settings ? i : { ...i, status: 'idle' }));
                        }}
                        className={`px-2 py-2 rounded-lg border text-[11px] font-bold text-center transition-all cursor-pointer
                          ${globalSettings.resizeMode === opt.key 
                            ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' 
                            : 'bg-[#0a0f18]/40 border-white/5 text-slate-400 hover:text-white'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Render conditional resizing inputs */}
                  {globalSettings.resizeMode === 'scale' && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                        <span>{t.scaleLabel}</span>
                        <span className="text-cyan-400 font-bold">{globalSettings.scale}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="10" 
                        max="100" 
                        value={globalSettings.scale}
                        onChange={(e) => {
                          const scale = Number(e.target.value);
                          setGlobalSettings(prev => ({ ...prev, scale }));
                          setItems(prev => prev.map(i => i.settings ? i : { ...i, status: 'idle' }));
                        }}
                        className="w-full h-1.5 rounded bg-white/10 outline-none accent-cyan-500 cursor-pointer"
                      />
                    </div>
                  )}

                  {globalSettings.resizeMode === 'dimensions' && (
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] text-slate-500 font-black uppercase mb-1">Width (px)</label>
                          <input 
                            type="number" 
                            value={globalSettings.width}
                            onChange={(e) => {
                              const width = Math.max(1, Number(e.target.value));
                              setGlobalSettings(prev => ({ ...prev, width }));
                              setItems(prev => prev.map(i => i.settings ? i : { ...i, status: 'idle' }));
                            }}
                            className="w-full bg-[#0a1019] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 font-black uppercase mb-1">Height (px)</label>
                          <input 
                            type="number" 
                            value={globalSettings.height}
                            onChange={(e) => {
                              const height = Math.max(1, Number(e.target.value));
                              setGlobalSettings(prev => ({ ...prev, height }));
                              setItems(prev => prev.map(i => i.settings ? i : { ...i, status: 'idle' }));
                            }}
                            className="w-full bg-[#0a1019] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500"
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-2 text-xs text-slate-400 font-bold select-none cursor-pointer mt-2">
                        <input 
                          type="checkbox" 
                          checked={globalSettings.maintainAspectRatio}
                          onChange={(e) => {
                            const maintainAspectRatio = e.target.checked;
                            setGlobalSettings(prev => ({ ...prev, maintainAspectRatio }));
                            setItems(prev => prev.map(i => i.settings ? i : { ...i, status: 'idle' }));
                          }}
                          className="w-4 h-4 accent-cyan-500 rounded border-gray-700 bg-gray-900"
                        />
                        <span>Keep aspect ratio</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Batch downloads block */}
                {items.length > 0 && (
                  <div className="border-t border-white/5 pt-6 space-y-3 animate-fade-in">
                    <button 
                      onClick={downloadAll}
                      disabled={items.filter(i => i.status === 'done').length === 0}
                      className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black text-base rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-cyan-600/20 active:scale-95 cursor-pointer"
                    >
                      <Download className="w-5 h-5 stroke-[3]" />
                      <span>{t.downloadAllBtn}</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Value Propositions / Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16">
            {t.features.map((feature: any, idx: number) => (
              <div 
                key={idx}
                className="p-8 glass-card rounded-3xl text-left hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/5 transition-all duration-300 group border border-white/5"
              >
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-all">
                  {[<Lock className="w-6 h-6" />, <Zap className="w-6 h-6" />, <RefreshCw className="w-6 h-6" />][idx]}
                </div>
                <h3 className="text-white text-xl font-bold mb-3 group-hover:text-cyan-400 transition-colors">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">{feature.text}</p>
              </div>
            ))}
          </div>

          {/* Extra Content - SEO Text */}
          <div className="pt-24 space-y-24 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 items-center">
              <div className="space-y-8">
                <div className="inline-block px-4 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-black uppercase tracking-[0.2em] border border-cyan-500/20">
                  {t.seoKeywords[0]}
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.05] tracking-tighter">
                  {t.seoHeroTitle}
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed font-medium">
                  {t.seoHeroText}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  {t.seoHeroList.map((item: string, i: number) => (
                    <div key={i} className="flex items-center space-x-3 p-4 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
                      <div className="w-8 h-8 shrink-0 bg-cyan-500/20 text-cyan-400 rounded-xl flex items-center justify-center text-sm group-hover:rotate-12 transition-transform">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                      <span className="text-slate-300 font-bold text-base">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative group">
                
                <div className="relative glass-card rounded-[4rem] p-12 py-20 min-h-[420px] w-full flex flex-col items-center justify-center space-y-8 text-center overflow-hidden">
                  <div className="text-[7.5rem] animate-float drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]">🖼️</div>
                  <div className="space-y-4 max-w-sm px-4">
                    <h3 className="text-2xl font-black text-white tracking-tight leading-tight">{t.seoBrowserSpeedTitle}</h3>
                    <p className="text-slate-400 font-medium text-sm leading-relaxed">{t.seoBrowserSpeedText}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-16 rounded-3xl md:rounded-[2.5rem] bg-[#080d16] border border-white/5 space-y-12">
              <div className="max-w-4xl space-y-4">
                <h3 className="text-3xl md:text-5xl font-black text-white leading-tight">{t.seoSecondaryTitle}</h3>
                <div className="h-1.5 w-20 bg-cyan-500 rounded-full"></div>
              </div>
               
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <div className="text-white text-xs font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-3">
                    <span className="w-6 h-px bg-white/20"></span>
                    {t.seoUseCaseTitle}
                  </div>
                  <p className="text-slate-400 text-base leading-relaxed font-medium">{t.seoUseCaseText}</p>
                </div>
                <div className="space-y-4">
                  <div className="text-white text-xs font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-3">
                    <span className="w-6 h-px bg-white/20"></span>
                    {t.seoPrivacyTitle}
                  </div>
                  <p className="text-slate-400 text-base leading-relaxed font-medium">{t.seoPrivacyText}</p>
                </div>
              </div>
            </div>

            {/* FAQs */}
            <section className="max-w-4xl mx-auto w-full space-y-12 py-12">
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{t.faqTitle}</h2>
                <div className="h-1 w-16 bg-cyan-500 mx-auto rounded-full"></div>
              </div>
              <div className="grid gap-4">
                {t.faq.map((item: any, idx: number) => (
                  <div 
                    key={idx}
                    className="glass-card rounded-2xl p-6 text-left space-y-3 hover:border-cyan-500/20 transition-colors group"
                  >
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors flex items-center gap-2">
                      <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 text-xs font-black">Q</span>
                      {item.question}
                    </h3>
                    <p className="text-slate-400 leading-relaxed pl-8 text-sm">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Keyword Tags */}
            <section className="max-w-4xl mx-auto w-full space-y-6 opacity-55 text-center">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{t.seoKeywordsTitle}</h2>
              <div className="flex flex-wrap justify-center gap-2">
                {t.seoKeywords.map((keyword: string, idx: number) => (
                  <span key={idx} className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 hover:bg-cyan-500/10 hover:border-cyan-500/20 hover:text-cyan-400 transition-all cursor-default">
                    {keyword}
                  </span>
                ))}
              </div>
            </section>
          </div>

        </div>
      {/* Bloque AdSense Horizontal */}
      <AdBanner id="adsense-compresssnap-bottom" />
      </main>

      {/* Visual Image Comparison Slider Drawer */}
      {comparedItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 bg-black/98 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-4xl h-full flex flex-col justify-center space-y-6">
            <button 
              onClick={() => setComparedItem(null)}
              className="absolute top-4 right-0 p-3 text-slate-400 hover:text-white transition-all scale-125 hover:rotate-90 duration-300 z-50 cursor-pointer"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <h3 className="text-xl md:text-2xl font-black text-white text-center tracking-tight">{t.compareTitle}</h3>

            <div className="relative aspect-video w-full bg-[#0a0f18] rounded-2xl overflow-hidden border border-white/10 select-none shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
              {/* Original Layer */}
              <img 
                src={comparedItem.originalUrl} 
                alt="Original" 
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              />
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur border border-white/10 text-[10px] md:text-xs text-white font-bold pointer-events-none z-20">
                {t.originalLabel} ({formatBytes(comparedItem.originalSize)})
                {comparedItem.width && comparedItem.height && (
                  <span className="opacity-60 ml-2">({comparedItem.width}x{comparedItem.height})</span>
                )}
              </div>

              {/* Compressed Layer (clipped via clipPath) */}
              <div 
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)` }}
              >
                <img 
                  src={comparedItem.compressedUrl || comparedItem.originalUrl} 
                  alt="Compressed" 
                  className="absolute inset-0 w-full h-full object-contain"
                />
              </div>
              <div className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-cyan-950/80 backdrop-blur border border-cyan-500/20 text-[10px] md:text-xs text-cyan-400 font-bold pointer-events-none z-20">
                {t.compressedLabel} ({formatBytes(comparedItem.compressedSize || 0)})
                {comparedItem.compressedWidth && comparedItem.compressedHeight && (
                  <span className="opacity-60 ml-2">({comparedItem.compressedWidth}x{comparedItem.compressedHeight})</span>
                )}
              </div>

              {/* Drag Handle Divider */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 pointer-events-none shadow-[0_0_10px_#06b6d4] z-20"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-cyan-500 border-2 border-white text-black flex items-center justify-center shadow-2xl font-bold">
                  â†”
                </div>
              </div>

              {/* Overlay Input Range to catch click drags cleanly */}
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={sliderPos} 
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
              />
            </div>

            <div className="flex justify-center">
              <button 
                onClick={() => downloadSingle(comparedItem)}
                className="px-10 py-4 bg-cyan-600 hover:bg-cyan-500 text-black font-black text-lg rounded-2xl shadow-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Download className="w-5 h-5 stroke-[3]" />
                <span>{t.downloadBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Scroll Top button */}
      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-10 right-10 z-[200] w-14 h-14 bg-white text-black rounded-2xl shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 hover:-translate-y-1 cursor-pointer group"
        >
          <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24"><path d="M5 15l7-7 7 7" /></svg>
        </button>
      )}

      <LegalModal 
        isOpen={!!activeModal} 
        onClose={() => setActiveModal(null)} 
        title={activeModal === 'privacy' ? t.privacyPolicy : activeModal === 'terms' ? t.termsOfService : t.cookiePolicy}
        content={
          (activeModal === 'privacy' ? t.privacyContent : activeModal === 'terms' ? t.termsContent : t.cookiesContent)
            .split('\n')
            .map((paragraph: string, index: number) => <p key={index}>{paragraph}</p>)
        }
        t={t}
      />

      <Footer lang={lang} t={t} onOpenModal={(modal) => setActiveModal(modal)} />
    </div>
  );
};

export default Compresssnap;
