import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Image as ImageIcon, 
  Download, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  Eye, 
  RefreshCw, 
  Lock, 
  Zap, 
  Scissors,
  Check
} from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import type { Language } from '../../locales/meta';
import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';
import { ImageItem } from './types';

interface BackgroundremoverProps {
  lang: Language;
  dictionary?: any;
}

export const Backgroundremover: React.FC<BackgroundremoverProps> = ({ lang, dictionary }) => {
  const t = dictionary || {};
  
  // App state
  const [items, setItems] = useState<ImageItem[]>([]);
  const [activeItem, setActiveItem] = useState<ImageItem | null>(null);
  const [comparedItem, setComparedItem] = useState<ImageItem | null>(null);
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Inference progress state
  const [progress, setProgress] = useState<{ percent: number; step: 'downloading' | 'processing' } | null>(null);

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

  // Main Background Removal Core Logic
  const processImage = useCallback(async (item: ImageItem) => {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'loading_model' } : i));
    
    try {
      // Dynamic import to prevent Astro build failures on Node environment
      const { removeBackground } = await import('@imgly/background-removal');

      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'processing' } : i));

      const resultBlob = await removeBackground(item.file, {
        progress: (step, current, total) => {
          // Calculate percentage safely
          const percent = total > 0 ? Math.round((current / total) * 100) : 0;
          const currentStep = step.includes('fetch') ? 'downloading' : 'processing';
          setProgress({ percent, step: currentStep });
        }
      });

      const processedUrl = URL.createObjectURL(resultBlob);

      setItems(prev => prev.map(i => {
        if (i.id === item.id) {
          return {
            ...i,
            status: 'done',
            processedSize: resultBlob.size,
            processedUrl
          };
        }
        return i;
      }));

      // Update active selection to show output automatically
      setItems(currentItems => {
        const updated = currentItems.find(i => i.id === item.id);
        if (updated) setActiveItem(updated);
        return currentItems;
      });

      setProgress(null);
    } catch (err) {
      console.error('Background removal error:', err);
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', error: String(err) } : i));
      setProgress(null);
    }
  }, []);

  // Trigger background removal on file additions
  useEffect(() => {
    const idleItem = items.find(item => item.status === 'idle');
    if (idleItem) {
      processImage(idleItem);
    }
  }, [items, processImage]);

  // Handle uploaded files
  const addFiles = async (files: FileList) => {
    if (files.length === 0) return;
    
    // We only take the first image for focused AI processing, but support queue additions
    const newItems: ImageItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const originalUrl = URL.createObjectURL(file);
      newItems.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        originalSize: file.size,
        processedSize: null,
        originalUrl,
        processedUrl: null,
        status: 'idle'
      });
    }

    if (newItems.length > 0) {
      setItems(prev => [...prev, ...newItems]);
      // Set the first newly added item as active to display workspace loaders
      setActiveItem(newItems[0]);
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

  // Download transparent PNG
  const downloadImage = (item: ImageItem) => {
    if (!item.processedUrl) return;
    
    const originalName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
    const finalName = `${originalName}-cutout.png`;

    const link = document.createElement('a');
    link.href = item.processedUrl;
    link.download = finalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Remove single image
  const removeItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    setItems(prev => {
      const target = prev.find(i => i.id === id);
      if (target) {
        URL.revokeObjectURL(target.originalUrl);
        if (target.processedUrl) URL.revokeObjectURL(target.processedUrl);
      }
      return prev.filter(i => i.id !== id);
    });

    if (activeItem?.id === id) setActiveItem(null);
    if (comparedItem?.id === id) setComparedItem(null);
  };

  // Reset entire workflow
  const resetApp = () => {
    items.forEach(i => {
      URL.revokeObjectURL(i.originalUrl);
      if (i.processedUrl) URL.revokeObjectURL(i.processedUrl);
    });
    setItems([]);
    setActiveItem(null);
    setComparedItem(null);
    setProgress(null);
  };

  const handleLanguageChange = (newLang: string) => {
    window.location.href = `/${newLang.toLowerCase()}/backgroundremover`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#07050a] text-slate-100 selection:bg-pink-500/30 overflow-x-hidden font-sans">
      {/* Background Orbs */}
      

      <Header currentLang={lang} onLanguageChange={handleLanguageChange} onReset={resetApp} t={t} />

      <main className="flex-1 flex flex-col items-center pt-36 pb-32 px-4 md:px-12 relative z-10 w-full">
        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-backgroundremover-top" />
        <div className="max-w-6xl w-full text-center space-y-16 md:space-y-24">
          
          {/* Hero Header */}
          <div className="flex flex-col items-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center space-x-2 px-5 py-2 rounded-full bg-fuchsia-950/40 border border-fuchsia-800/30 text-fuchsia-400 text-xs font-black tracking-widest uppercase shadow-[0_0_25px_rgba(232,121,249,0.15)]">
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

          {/* Work Area Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left side: Upload dropzone and detailed workspace */}
            <div className="lg:col-span-8 space-y-6">
              
              {items.length === 0 ? (
                /* Dropzone when empty */
                <div 
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative border-2 border-dashed border-fuchsia-950 hover:border-fuchsia-500/40 bg-[#0f0a17]/30 hover:bg-[#150d22]/40 rounded-3xl p-12 md:p-20 flex flex-col items-center justify-center space-y-6 cursor-pointer transition-premium shadow-xl shadow-black/20"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileInput} 
                    accept="image/jpeg,image/png,image/webp" 
                    className="hidden" 
                  />
                  
                  <div className="relative">
                    <div className="absolute inset-0 bg-fuchsia-500/10 blur-xl rounded-full scale-125 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-20 h-20 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-center text-fuchsia-400 relative z-10 transition-transform group-hover:scale-105 group-hover:-translate-y-1 shadow-lg shadow-black/40">
                      <Upload className="w-10 h-10 animate-float" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white tracking-tight">{t.dropzonePrompt}</h3>
                    <p className="text-slate-500 text-sm font-medium">{t.dropzoneSubtitle}</p>
                  </div>
                </div>
              ) : (
                /* Workspace when images are loaded */
                <div className="glass-card rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden border border-white/5">
                  
                  {activeItem ? (
                    <div className="space-y-6">
                      
                      {/* Active File Rendering Canvas */}
                      <div className="relative aspect-video rounded-2xl overflow-hidden checkered-bg border border-white/5 flex items-center justify-center">
                        
                        {activeItem.status === 'done' && activeItem.processedUrl ? (
                          <img 
                            src={activeItem.processedUrl} 
                            alt="Cutout cutout" 
                            className="max-h-full max-w-full object-contain animate-fade-in"
                          />
                        ) : (
                          <img 
                            src={activeItem.originalUrl} 
                            alt="Original preview" 
                            className="max-h-full max-w-full object-contain opacity-40 blur-xs"
                          />
                        )}

                        {/* Processing Overlays */}
                        {(activeItem.status === 'loading_model' || activeItem.status === 'processing') && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs space-y-4">
                            <Loader2 className="w-12 h-12 text-fuchsia-400 animate-spin" />
                            <div className="space-y-1 text-center">
                              <p className="text-sm font-bold text-white uppercase tracking-wider">
                                {activeItem.status === 'loading_model' ? t.statusDownloadingModel : t.statusProcessing}
                              </p>
                              {progress && (
                                <div className="w-48 h-1.5 bg-white/10 rounded-full mx-auto overflow-hidden mt-2">
                                  <div 
                                    className="h-full bg-fuchsia-500 transition-all duration-300"
                                    style={{ width: `${progress.percent}%` }}
                                  ></div>
                                </div>
                              )}
                              {progress && (
                                <span className="text-xs text-fuchsia-400 font-bold mt-1 inline-block">
                                  {progress.percent}%
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {activeItem.status === 'error' && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 space-y-4">
                            <AlertCircle className="w-12 h-12 text-red-500" />
                            <p className="text-sm font-bold text-red-400">{t.statusError}</p>
                            <p className="text-xs text-slate-500 max-w-xs truncate">{activeItem.error}</p>
                          </div>
                        )}
                      </div>

                      {/* Workspace Footer Actions */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5 pt-4">
                        <div className="text-left w-full sm:w-auto">
                          <h4 className="text-sm font-bold text-white truncate max-w-[280px]">{activeItem.name}</h4>
                          <p className="text-xs text-slate-500 font-semibold mt-1">
                            {t.originalSize}: {formatBytes(activeItem.originalSize)}
                            {activeItem.processedSize && ` â€¢ ${t.processedSize}: ${formatBytes(activeItem.processedSize)}`}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                          {activeItem.status === 'done' && activeItem.processedUrl && (
                            <>
                              <button 
                                onClick={() => {
                                  setComparedItem(activeItem);
                                  setSliderPos(50);
                                }}
                                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                                <span>{t.compareBtn}</span>
                              </button>
                              
                              <button 
                                onClick={() => downloadImage(activeItem)}
                                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-black font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-600/20 active:scale-95 cursor-pointer"
                              >
                                <Download className="w-4 h-4 stroke-[3]" />
                                <span>{t.downloadBtn}</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-500">
                      Select an image from the queue to display.
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* Right side: File queue & metadata info */}
            <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
              
              {items.length > 0 && (
                <div className="glass-card rounded-3xl p-6 space-y-6 text-left shadow-2xl relative overflow-hidden border border-white/5">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/5 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-fuchsia-400" />
                      <span>Queue ({items.length})</span>
                    </h3>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-fuchsia-400 hover:text-fuchsia-300 font-bold transition-colors cursor-pointer"
                    >
                      + Add More
                    </button>
                  </div>

                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileInput} 
                    accept="image/jpeg,image/png,image/webp" 
                    className="hidden" 
                  />

                  {/* Thumbnail queue */}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                    {items.map((item) => {
                      const isActive = activeItem?.id === item.id;
                      
                      return (
                        <div 
                          key={item.id}
                          onClick={() => setActiveItem(item)}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer relative group
                            ${isActive 
                              ? 'bg-fuchsia-950/20 border-fuchsia-500/40 text-fuchsia-300' 
                              : 'bg-black/20 border-white/5 text-slate-400 hover:bg-black/40 hover:text-white'}`}
                        >
                          {/* Image mini thumb */}
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-black flex items-center justify-center">
                            <img src={item.originalUrl} alt={item.name} className="w-full h-full object-cover" />
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{item.name}</p>
                            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{formatBytes(item.originalSize)}</p>
                          </div>

                          {/* Loading / Done Indicators */}
                          <div className="shrink-0">
                            {item.status === 'idle' && (
                              <div className="w-2 h-2 rounded-full bg-slate-600 animate-pulse"></div>
                            )}
                            {(item.status === 'loading_model' || item.status === 'processing') && (
                              <Loader2 className="w-3.5 h-3.5 text-fuchsia-400 animate-spin" />
                            )}
                            {item.status === 'done' && (
                              <CheckCircle2 className="w-4 h-4 text-fuchsia-400" />
                            )}
                            {item.status === 'error' && (
                              <AlertCircle className="w-4 h-4 text-red-400" />
                            )}
                          </div>

                          {/* Hover delete button */}
                          <button 
                            onClick={(e) => removeItem(item.id, e)}
                            className="absolute right-2 top-2 p-1 rounded-lg bg-black/80 hover:bg-red-500/20 border border-white/10 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-white/5 pt-4 space-y-3">
                    <button 
                      onClick={resetApp}
                      className="w-full py-3 bg-red-500/5 hover:bg-red-500/15 border border-red-500/20 text-red-400 text-xs font-black tracking-widest uppercase rounded-xl transition-all cursor-pointer"
                    >
                      {t.resetBtn}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Value Propositions / Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16">
            {t.features.map((feature: any, idx: number) => (
              <div 
                key={idx}
                className="p-8 glass-card rounded-3xl text-left hover:-translate-y-2 hover:shadow-2xl hover:shadow-fuchsia-500/5 transition-all duration-300 group border border-white/5"
              >
                <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 mb-6 group-hover:scale-110 transition-all">
                  {[<Lock className="w-6 h-6" />, <Zap className="w-6 h-6" />, <Scissors className="w-6 h-6" />][idx]}
                </div>
                <h3 className="text-white text-xl font-bold mb-3 group-hover:text-fuchsia-400 transition-colors">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">{feature.text}</p>
              </div>
            ))}
          </div>

          {/* Extra Content - SEO Text */}
          <div className="pt-24 space-y-24 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 items-center">
              <div className="space-y-8">
                <div className="inline-block px-4 py-1.5 rounded-lg bg-fuchsia-500/10 text-fuchsia-400 text-xs font-black uppercase tracking-[0.2em] border border-fuchsia-500/20">
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
                      <div className="w-8 h-8 shrink-0 bg-fuchsia-500/20 text-fuchsia-400 rounded-xl flex items-center justify-center text-sm group-hover:rotate-12 transition-transform">
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

            <div className="p-8 md:p-16 rounded-3xl md:rounded-[2.5rem] bg-[#0d0816] border border-white/5 space-y-12">
              <div className="max-w-4xl space-y-4">
                <h3 className="text-3xl md:text-5xl font-black text-white leading-tight">{t.seoSecondaryTitle}</h3>
                <div className="h-1.5 w-20 bg-fuchsia-500 rounded-full"></div>
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
                <div className="h-1 w-16 bg-fuchsia-500 mx-auto rounded-full"></div>
              </div>
              <div className="grid gap-4">
                {t.faq.map((item: any, idx: number) => (
                  <div 
                    key={idx}
                    className="glass-card rounded-2xl p-6 text-left space-y-3 hover:border-fuchsia-500/20 transition-colors group"
                  >
                    <h3 className="text-lg font-bold text-white group-hover:text-fuchsia-400 transition-colors flex items-center gap-2">
                      <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400 text-xs font-black">Q</span>
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
                  <span key={idx} className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 hover:bg-fuchsia-500/10 hover:border-fuchsia-500/20 hover:text-fuchsia-400 transition-all cursor-default">
                    {keyword}
                  </span>
                ))}
              </div>
            </section>
          </div>

        </div>
      {/* Bloque AdSense Horizontal */}
      <AdBanner id="adsense-backgroundremover-bottom" />
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
              </div>

              {/* Processed Layer (clipped via clipPath) */}
              <div 
                className="absolute inset-0 overflow-hidden pointer-events-none checkered-bg"
                style={{ clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)` }}
              >
                <img 
                  src={comparedItem.processedUrl || comparedItem.originalUrl} 
                  alt="Processed" 
                  className="absolute inset-0 w-full h-full object-contain"
                />
              </div>
              <div className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-fuchsia-950/80 backdrop-blur border border-fuchsia-500/20 text-[10px] md:text-xs text-fuchsia-400 font-bold pointer-events-none z-20">
                {t.processedLabel} ({formatBytes(comparedItem.processedSize || 0)})
              </div>

              {/* Drag Handle Divider */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-fuchsia-400 pointer-events-none shadow-[0_0_10px_#ec4899] z-20"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-fuchsia-500 border-2 border-white text-black flex items-center justify-center shadow-2xl font-bold">
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
                onClick={() => downloadImage(comparedItem)}
                className="px-10 py-4 bg-fuchsia-600 hover:bg-fuchsia-500 text-black font-black text-lg rounded-2xl shadow-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
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

export default Backgroundremover;
