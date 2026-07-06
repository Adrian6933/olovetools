import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import DropZone from './components/DropZone';
import ControlPanel from './components/ControlPanel';
import LegalModal from './components/LegalModal';
import { ImageFormat, ConversionSettings, BatchImageItem, ConversionResult } from './types';
import { useTranslation, Language } from '../../locales/dictionary';
import { legalTranslations } from '../../locales/legal';
import { convertImage, formatBytes, readFileAsDataURL, loadImage, createBatchZip, processUploadedFile } from './services/imageService';
import { X, ArrowRight, ArrowUp, SplitSquareHorizontal, Layers, Ruler, ScanLine, FileImage, ShieldCheck, Zap, Maximize, FileType, Home, Sparkles, Wand2, ArrowRightLeft, Mail } from 'lucide-react';



interface FormatflowProps {
  lang: Language;
  dictionary?: any;
}

const Formatflow: React.FC<FormatflowProps> = ({ lang, dictionary: propDictionary }) => {
  const { dictionary: hookDictionary } = useTranslation((lang || 'en') as Language, 'formatflow');
  const dictionary = propDictionary || hookDictionary;
  const language = (lang || 'en') as Language;
  const t = dictionary.app;
  const tFeatures = dictionary.features;
  const tSeo = dictionary.seo;

  const handleLanguageChange = (newLang: Language) => {
    window.location.href = `/${newLang.toLowerCase()}/formatflow`;
  };

  const [images, setImages] = useState<BatchImageItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [settings, setSettings] = useState<ConversionSettings>({
    format: ImageFormat.JPEG,
    quality: 0.9,
    scale: 1,
  });
  
  const [isPreviewConverting, setIsPreviewConverting] = useState(false);
  const [previewResult, setPreviewResult] = useState<ConversionResult | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{current: number, total: number} | undefined>(undefined);
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('adrian.contact.me.69@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleFilesSelect = async (files: File[]) => {
    setIsBatchProcessing(true);
    try {
      const newImages: BatchImageItem[] = [];
      for (const file of files) {
        const sourceBlob = await processUploadedFile(file);
        const url = await readFileAsDataURL(sourceBlob);
        const img = await loadImage(url);
        
        newImages.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          sourceBlob,
          previewUrl: url,
          width: img.width,
          height: img.height,
          originalSize: file.size,
        });
      }
      setImages(prev => {
        const updated = [...prev, ...newImages];
        // Limit to 50 images total if needed, or just let it be
        return updated.slice(0, 50); 
      });
      if (images.length === 0) {
        setSelectedIndex(0);
        if (typeof window !== 'undefined') {
          window.history.pushState({ view: 'editor' }, '');
        }
      }
    } catch (error) {
      console.error("Error loading images", error);
      alert("Failed to load images.");
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleSpecificSettingsChange = (id: string, newSettings: ConversionSettings | undefined) => {
    setImages(prevImages => prevImages.map(img => 
      img.id === id ? { ...img, settings: newSettings } : img
    ));
  };

  const removeImage = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    const indexToRemove = images.findIndex(img => img.id === id);
    if (indexToRemove === -1) return;
    const newImages = images.filter(img => img.id !== id);
    if (newImages.length === 0) { reset(); return; }
    let newIndex = selectedIndex;
    if (indexToRemove === selectedIndex) {
      newIndex = Math.min(indexToRemove, newImages.length - 1);
    } else if (indexToRemove < selectedIndex) {
      newIndex = selectedIndex - 1;
    }
    setImages(newImages);
    setSelectedIndex(newIndex);
  };

  const activeImage = images[selectedIndex];
  const effectiveSettings = activeImage?.settings || settings;
  const currentScale = effectiveSettings.scale;
  const visualNormalization = Math.max(1, currentScale);
  const originalVisualScale = 1 / visualNormalization;
  const previewVisualScale = currentScale / visualNormalization;

  const previewWidth = activeImage ? Math.round(activeImage.width * currentScale) : 0;
  const previewHeight = activeImage ? Math.round(activeImage.height * currentScale) : 0;

  useEffect(() => {
    if (images.length === 0 || !activeImage) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setIsPreviewConverting(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        if (previewResult?.url) URL.revokeObjectURL(previewResult.url);
        const blob = await convertImage(activeImage.sourceBlob, effectiveSettings);
        const url = URL.createObjectURL(blob);
        setPreviewResult({ url, blob, size: blob.size });
      } catch (error) {
        console.error("Preview conversion failed", error);
      } finally {
        setIsPreviewConverting(false);
      }
    }, 400);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [selectedIndex, images, effectiveSettings]);

  const handlePaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      const pasteFiles: File[] = [];
      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            const file = new File([blob], `pasted-image-${Date.now()}.${blob.type.split('/')[1]}`, { type: blob.type });
            pasteFiles.push(file);
          }
        }
      }
      if (pasteFiles.length > 0) {
        handleFilesSelect(pasteFiles);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('paste', handlePaste as any);
    
    // Check for transfers from Pastesnap
    const transfer = localStorage.getItem('pastesnap_transfer');
    if (transfer) {
      try {
        const items = JSON.parse(transfer) as {name: string, type: string, data: string}[];
        const files = items.map(item => {
          const byteString = atob(item.data.split(',')[1]);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
          return new File([ab], item.name, { type: item.type });
        });
        handleFilesSelect(files);
        localStorage.removeItem('pastesnap_transfer');
      } catch (e) {
        console.error("Transfer failed", e);
      }
    }
    
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('paste', handlePaste as any);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [images]);

  // Manejo del botón atrás del navegador/ratón
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Si tenemos imágenes cargadas y el usuario pulsa atrás, volvemos a la landing
      if (images.length > 0) {
        reset();
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [images]);

  // Reset scroll to top when entering editor
  useEffect(() => {
    if (images.length > 0) {
      window.scrollTo(0, 0);
    }
  }, [images.length > 0]);

  const reset = () => {
    if (previewResult) URL.revokeObjectURL(previewResult.url);
    setImages([]);
    setPreviewResult(null);
    setBatchProgress(undefined);
  };

  const downloadAll = async () => {
    if (images.length === 0) return;
    setIsBatchProcessing(true);
    setBatchProgress({ current: 0, total: images.length });
    try {
      const zipBlob = await createBatchZip(images, settings, (current, total) => {
        setBatchProgress({ current, total });
      });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `formatflow_batch_${images.length}_images.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Batch processing failed", error);
    } finally {
      setIsBatchProcessing(false);
      setBatchProgress(undefined);
    }
  };

  const downloadSingle = async () => {
    if (!previewResult || !activeImage) return;
    const link = document.createElement('a');
    link.href = previewResult.url;
    const originalName = activeImage.file.name.substring(0, activeImage.file.name.lastIndexOf('.')) || activeImage.file.name;
    let ext = effectiveSettings.format.split('/')[1];
    if (ext === 'jpeg') ext = 'jpg';
    if (ext === 'svg+xml') ext = 'svg';
    if (ext === 'x-icon') ext = 'ico';
    if (ext === 'postscript') ext = 'png'; // EPS fallback
    if (ext === 'x-raw') ext = 'png'; // RAW fallback
    if (ext === 'heic') ext = 'jpg'; // HEIC outputs as JPG
    link.download = `${selectedIndex + 1}_${originalName}.${ext}`;
    link.click();
  };

  const getFileTypeLabel = (file: File) => {
    const name = file.name.toLowerCase();
    if (name.endsWith('.heic') || name.endsWith('.heif')) return 'HEIC';
    if (file.type) {
      let subtype = file.type.split('/')[1];
      if (subtype) {
        subtype = subtype.toUpperCase();
        if (subtype === 'JPEG') return 'JPG';
        if (subtype === 'SVG+XML') return 'SVG';
        if (subtype === 'X-ICON') return 'ICO';
        return subtype;
      }
    }
    return 'IMG';
  };

  const getOutputFormatLabel = (fmt: string) => {
    let raw = fmt.split('/')[1].toUpperCase();
    if (raw === 'JPEG') return 'JPG';
    if (raw === 'SVG+XML') return 'SVG';
    if (raw === 'X-ICON') return 'ICO';
    if (raw === 'POSTSCRIPT') return 'EPS (PNG)';
    if (raw === 'X-RAW') return 'RAW (PNG)';
    if (raw === 'HEIC') return 'HEIC (JPG)';
    return raw;
  };

  return (
    <div className="min-h-screen bg-dark text-slate-200 font-sans flex flex-col selection:bg-primary/30 relative z-0">
      {/* Ambient Background Glows */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[25%] h-[25%] bg-secondary/20 blur-[120px] rounded-full mix-blend-screen"></div>
      </div>

      <Header language={language} onLanguageChange={handleLanguageChange} onHomeClick={reset} />
      
      <main className="flex-1 container mx-auto px-4 py-12 flex flex-col gap-12">
        <AnimatePresence mode="wait">
        {images.length === 0 ? (
          <motion.div 
            key="landing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="flex-1 flex flex-col items-center justify-center w-full"
          >
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" }}
              className="text-center mb-16 space-y-6"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-4"
              >
                <Sparkles className="w-3.5 h-3.5" /> {t.comparing}
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-5xl md:text-8xl font-display font-black text-white tracking-tighter leading-none"
              >
                {t.title}<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-love to-secondary animate-pulse-slow">{t.titleHighlight}</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="text-slate-400 text-lg md:text-2xl max-w-2xl mx-auto font-medium opacity-80"
              >
                {t.subtitle}
              </motion.p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7, ease: "easeOut" }}
              className="w-full max-w-4xl"
            >
              <DropZone onFilesSelect={handleFilesSelect} language={language} />
            </motion.div>

            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
              className="mt-48 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full"
            >
               {[
                 { icon: FileImage, color: 'text-primary', bg: 'bg-primary/10', title: tFeatures.heicTitle, desc: tFeatures.heicDesc },
                 { icon: ShieldCheck, color: 'text-green-400', bg: 'bg-green-500/10', title: tFeatures.privacyTitle, desc: tFeatures.privacyDesc },
                 { icon: Layers, color: 'text-secondary', bg: 'bg-secondary/10', title: tFeatures.batchTitle, desc: tFeatures.batchDesc },
                 { icon: Maximize, color: 'text-orange-400', bg: 'bg-orange-500/10', title: tFeatures.resizeTitle, desc: tFeatures.resizeDesc },
                 { icon: FileType, color: 'text-blue-400', bg: 'bg-blue-500/10', title: tFeatures.formatsTitle, desc: tFeatures.formatsDesc },
                 { icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10', title: tFeatures.freeTitle, desc: tFeatures.freeDesc },
               ].map((feature, idx) => (
                 <motion.article 
                   key={idx} 
                   variants={{
                     hidden: { opacity: 0, y: 30 },
                     visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
                   }}
                   whileHover={{ y: -5, scale: 1.02 }}
                   className={`glass-card p-8 rounded-3xl hover:bg-slate-800/80 transition-all duration-500 group`}
                 >
                    <div className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                       <feature.icon className={`w-7 h-7 ${feature.color}`} aria-hidden="true" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-3">{feature.title}</h2>
                    <p className="text-slate-400 text-base leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">{feature.desc}</p>
                 </motion.article>
               ))}
            </motion.div>

            <motion.section 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={{
                hidden: { opacity: 0, y: 40 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut", staggerChildren: 0.1 } }
              }}
              className="mt-40 w-full max-w-6xl mx-auto"
            >
               <div className="flex items-center gap-4 mb-10">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-800"></div>
                  <h2 className="text-sm font-black uppercase tracking-[0.4em] text-slate-500">{useTranslation(language, 'formatflow').dictionary.formats?.title || 'Supported Formats'}</h2>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-800"></div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { id: 'svg', color: 'text-orange-400', bg: 'bg-orange-500/10' },
                    { id: 'ico', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                    { id: 'pdf', color: 'text-red-400', bg: 'bg-red-500/10' },
                    { id: 'tiff', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { id: 'heic', color: 'text-green-400', bg: 'bg-green-500/10' },
                    { id: 'eps', color: 'text-purple-400', bg: 'bg-purple-500/10' }
                  ].map((fmt, idx) => {
                    const formatData = useTranslation(language, 'formatflow').dictionary.formats?.[fmt.id];
                    if (!formatData || typeof formatData === 'string') return null;
                    return (
                      <motion.div 
                        key={idx} 
                        variants={{
                          hidden: { opacity: 0, scale: 0.95 },
                          visible: { opacity: 1, scale: 1 }
                        }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="glass-card p-6 rounded-2xl flex flex-col gap-3 group border border-slate-800 hover:border-slate-600 transition-all duration-300"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`px-3 py-1.5 rounded-lg font-black text-sm tracking-widest ${fmt.bg} ${fmt.color}`}>
                            {formatData.title}
                          </div>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                          {formatData.desc}
                        </p>
                      </motion.div>
                    );
                  })}
               </div>
            </motion.section>

            <motion.section 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={{
                hidden: { opacity: 0, y: 40 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut", staggerChildren: 0.05 } }
              }}
              className="mt-40 w-full max-w-6xl mx-auto"
            >
               <div className="flex items-center gap-4 mb-10">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-800"></div>
                  <h2 className="text-sm font-black uppercase tracking-[0.4em] text-slate-500">{tSeo.popularHeader}</h2>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-800"></div>
               </div>
               
               <div className="flex flex-wrap justify-center gap-4">
                  {tSeo.tags.map((tag, idx) => (
                    <motion.div 
                      key={idx} 
                      variants={{
                        hidden: { opacity: 0, scale: 0.9 },
                        visible: { opacity: 1, scale: 1 }
                      }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      className="w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.667rem)] lg:w-[calc(25%-0.75rem)] xl:w-[calc(16.666%-0.833rem)] glass-card p-4 rounded-2xl flex items-center gap-3 group cursor-default hover:bg-primary/10 hover:border-primary/30 transition-all duration-300"
                    >
                      <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary" aria-hidden="true" />
                      </div>
                      <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">{tag}</span>
                    </motion.div>
                  ))}
               </div>
               
               <div className="mt-12 flex flex-wrap justify-center gap-3">
                 {tSeo.actions.map((action, idx) => (
                   <motion.span 
                     key={idx} 
                     variants={{
                       hidden: { opacity: 0, y: 10 },
                       visible: { opacity: 1, y: 0 }
                     }}
                     whileHover={{ scale: 1.05 }}
                     className="px-5 py-2.5 bg-slate-900/50 border border-slate-800 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-slate-300 hover:border-slate-700 cursor-default transition-all shadow-lg"
                   >
                     {action}
                   </motion.span>
                 ))}
               </div>
            </motion.section>
          </motion.div>
        ) : (
          <motion.div 
            key="editor"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col lg:flex-row gap-10 items-start max-w-[1700px] mx-auto w-full"
          >
            
            <div className="w-full lg:w-[68%] space-y-10">
              <div className="flex flex-col gap-6 px-2">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-lg glow-primary">
                    <SplitSquareHorizontal className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-black text-white">{t.liveComparison}</h2>
                    <p className="text-sm text-slate-500 font-medium">{t.comparing}</p>
                  </div>
                </div>
                
                <button 
                  onClick={reset}
                  className="w-fit group flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 rounded-2xl shadow-xl transition-all active:scale-95 cursor-pointer"
                >
                  <Home className="w-4 h-4 group-hover:scale-110 transition-transform" /> {t.startOver}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                <div className="glass-card rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl transition-all hover:border-slate-700 group flex flex-col">
                  <div className="bg-slate-900/80 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                      <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">{t.original}</span>
                    </div>
                    <span className="text-xs font-mono text-slate-500 truncate max-w-[180px] opacity-60">{activeImage?.file.name}</span>
                  </div>
                  
                  <div key={`orig-${activeImage?.id}`} className="flex-1 p-8 flex items-center justify-center bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03)_1px,_transparent_1px)] bg-[size:24px_24px] bg-slate-900/40 min-h-[400px] animate-fade-in-quick">
                    {activeImage && (
                      <img 
                        src={activeImage.previewUrl} 
                        alt="Original" 
                        style={{ transform: `scale(${originalVisualScale})` }}
                        className="max-w-full max-h-[340px] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] group-hover:scale-[1.03] transition-transform duration-700 ease-out" 
                      />
                    )}
                  </div>

                  <div className="px-6 py-4 bg-slate-900/60 border-t border-slate-800 flex justify-between items-center">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                        <Ruler className="w-3.5 h-3.5" /> {t.dimensions}
                      </span>
                      <p className="font-mono text-sm text-slate-300 font-bold">
                        {activeImage?.width} <span className="text-slate-600">×</span> {activeImage?.height}
                      </p>
                    </div>

                    <div className="flex flex-col items-end space-y-1">
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{t.size}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">
                          {activeImage && getFileTypeLabel(activeImage.file)}
                        </span>
                        <span className="font-mono font-black text-white bg-slate-800/80 px-3 py-1 rounded-lg text-sm border border-slate-700">
                          {activeImage ? formatBytes(activeImage.originalSize) : '0 B'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <div className="bg-primary p-4 rounded-3xl shadow-[0_0_30px_rgba(99,102,241,0.5)] border-4 border-dark group transition-transform hover:scale-110">
                      <ArrowRight className="w-6 h-6 text-white" />
                    </div>
                </div>

                <div className={`glass-card rounded-[2.5rem] border-2 overflow-hidden shadow-2xl relative group flex flex-col transition-all duration-500 ${activeImage?.settings ? 'border-secondary/30 glow-secondary' : 'border-primary/30 glow-primary'}`}>
                  {isPreviewConverting && (
                    <div className="absolute inset-0 z-20 bg-dark/40 backdrop-blur-sm flex flex-col items-center justify-center transition-all animate-fade-in">
                        <Wand2 className={`w-10 h-10 mb-4 animate-bounce ${activeImage?.settings ? 'text-secondary' : 'text-primary'}`} />
                        <div className={`w-10 h-10 border-4 border-t-transparent rounded-full animate-spin ${activeImage?.settings ? 'border-secondary' : 'border-primary'}`}></div>
                    </div>
                  )}

                  <div className={`px-6 py-4 border-b flex justify-between items-center ${activeImage?.settings ? 'bg-secondary/5 border-secondary/10' : 'bg-primary/5 border-primary/10'}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${activeImage?.settings ? 'bg-secondary shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-primary shadow-[0_0_10px_rgba(99,102,241,0.5)]'}`}></div>
                      <span className={`text-[10px] font-black tracking-[0.2em] uppercase ${activeImage?.settings ? 'text-secondary' : 'text-primary'}`}>
                        {t.preview} {activeImage?.settings ? t.specific : t.global}
                      </span>
                    </div>
                    <span className={`text-[10px] font-black px-3 py-1 rounded-lg border shadow-sm ${activeImage?.settings ? 'bg-secondary/10 text-secondary border-secondary/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                      {getOutputFormatLabel(effectiveSettings.format)}
                    </span>
                  </div>
                  
                  <div key={`preview-${activeImage?.id}`} className="flex-1 p-8 flex items-center justify-center bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03)_1px,_transparent_1px)] bg-[size:24px_24px] bg-slate-900/40 min-h-[400px] animate-fade-in-quick">
                    {previewResult ? (
                      <img 
                        src={previewResult.url} 
                        alt="Preview" 
                        style={{ transform: `scale(${previewVisualScale})` }}
                        className={`max-w-full max-h-[340px] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-700 ease-out origin-center ${isPreviewConverting ? 'opacity-40 grayscale blur-sm' : 'opacity-100'}`} 
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-4">
                        <div className={`w-10 h-10 border-4 border-t-transparent rounded-full animate-spin ${activeImage?.settings ? 'border-secondary' : 'border-primary'}`}></div>
                        <span className="text-xs font-bold text-slate-500 animate-pulse">PREPARING...</span>
                      </div>
                    )}
                  </div>

                  <div className={`px-6 py-4 bg-slate-900/60 border-t flex justify-between items-center ${activeImage?.settings ? 'border-secondary/10' : 'border-primary/10'}`}>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                         <ScanLine className="w-3.5 h-3.5" /> {t.newDimensions}
                      </span>
                      <p className={`font-mono text-sm font-black ${currentScale > 1 ? 'text-green-400' : currentScale < 1 ? 'text-yellow-400' : 'text-slate-300'}`}>
                        {previewWidth} <span className="opacity-40">×</span> {previewHeight}
                      </p>
                    </div>

                    <div className="flex flex-col items-end space-y-1">
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{t.estSize}</span>
                      {previewResult && activeImage ? (
                        <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-black uppercase tracking-widest border px-2 py-0.5 rounded-md ${activeImage?.settings ? 'border-secondary/20 text-secondary/60' : 'border-primary/20 text-primary/60'}`}>
                               {getOutputFormatLabel(effectiveSettings.format)}
                            </span>
                            <span className={`font-mono font-black px-3 py-1 rounded-lg text-sm border shadow-lg whitespace-nowrap ${previewResult.size < activeImage.originalSize ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'}`}>
                              {formatBytes(previewResult.size)}
                            </span>
                        </div>
                      ) : (
                        <div className="w-20 h-6 bg-slate-800 animate-pulse rounded-lg"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {images.length > 0 && (
                <div className="glass-card rounded-[2rem] border border-slate-800 p-8 shadow-xl overflow-hidden">
                   <div className="flex items-center justify-between mb-6">
                     <div className="flex items-center gap-3 text-slate-400">
                        <div className="p-2 bg-slate-800 rounded-lg">
                          <Layers className="w-4 h-4 text-slate-300" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-[0.2em]">{t.queue} <span className="text-primary font-mono ml-1">[{images.length}]</span></h3>
                     </div>
                     <div className="flex gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-secondary/40"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-love/40"></div>
                     </div>
                   </div>
                   
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-8 pt-16 pb-8 px-12 max-h-[500px] overflow-y-auto pr-6 custom-scrollbar">
                      <AnimatePresence mode="popLayout" initial={false}>
                      {images.length < 50 && (
                        <motion.button
                          key="add-button"
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          onClick={() => document.getElementById('add-more-input')?.click()}
                          className="w-full aspect-square rounded-2xl border-4 border-dashed border-slate-700 hover:border-primary hover:bg-primary/5 flex flex-col items-center justify-center gap-2 transition-all duration-300 group/add cursor-pointer"
                        >
                          <div className="p-3 bg-slate-800 rounded-xl group-hover/add:bg-primary/20 group-hover/add:scale-110 transition-all">
                            <X className="w-6 h-6 text-slate-500 group-hover/add:text-primary rotate-45" />
                          </div>

                        </motion.button>
                      )}
                      
                      {images.map((img, idx) => (
                        <motion.div 
                          key={img.id} 
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                          transition={{ duration: 0.3 }}
                          className="relative group/item"
                        >
                          <button
                            onClick={() => setSelectedIndex(idx)}
                            className={`
                              w-full aspect-square rounded-2xl overflow-hidden border-4 transition-all duration-300 relative shadow-xl isolate cursor-pointer
                              ${idx === selectedIndex 
                                ? 'border-primary z-20 shadow-primary/40 shadow-2xl ring-4 ring-primary/30 ring-offset-2 ring-offset-dark' 
                                : img.settings 
                                  ? 'border-secondary/40 opacity-90 grayscale-0' 
                                  : 'border-slate-800 opacity-40 hover:opacity-100 hover:border-slate-600 grayscale-[0.5] hover:grayscale-0'
                              }
                            `}
                            style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}
                          >
                            <img 
                              src={img.previewUrl} 
                              alt={`Thumbnail ${idx}`}
                              className="w-full h-full object-cover" 
                            />
                            {idx === selectedIndex && (
                               <div className="absolute inset-0 bg-primary/10 backdrop-blur-[1px]"></div>
                            )}
                          </button>

                          {img.settings && (
                             <div className="absolute -bottom-1 -left-1 p-2 bg-secondary rounded-full border-2 border-dark z-30 shadow-lg animate-float">
                                <Sparkles className="w-3 h-3 text-white" />
                             </div>
                          )}
                          
                          <button
                             onClick={(e) => removeImage(e, img.id)}
                             className={`
                               absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-400 text-white rounded-full flex items-center justify-center shadow-[0_10px_20px_rgba(239,68,68,0.4)] z-40 opacity-100 lg:opacity-0 lg:group-hover/item:opacity-100 transition-all duration-300 hover:scale-110 active:scale-90 cursor-pointer
                             `}
                          >
                             <X className="w-4 h-4 stroke-[3px]" />
                          </button>
                        </motion.div>
                      ))}
                      </AnimatePresence>
                    </div>
                    
                    <input 
                      type="file" 
                      id="add-more-input" 
                      className="hidden" 
                      accept="image/*,.heic,.heif" 
                      multiple 
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleFilesSelect(Array.from(e.target.files));
                        }
                      }}
                    />
                </div>
              )}
            </div>

            <div className="w-full lg:w-[32%] h-full sticky top-32">
              <ControlPanel
                settings={settings}
                onSettingsChange={setSettings}
                onConvert={downloadAll}
                onDownloadSingle={downloadSingle}
                isProcessing={isBatchProcessing}
                fileCount={images.length}
                progress={batchProgress}
                activeImage={activeImage}
                onSpecificSettingsChange={handleSpecificSettingsChange}
                language={language}
              />
            </div>

          </motion.div>
        )}
        </AnimatePresence>
      </main>

      <footer className="py-10 border-t border-slate-900 bg-slate-900/20 mt-auto">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col items-center md:items-start gap-2">
              <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">
                {t.contactFeedback || 'CONTACT FOR IDEAS AND FEEDBACK:'}
              </span>
              <button 
                onClick={handleCopyEmail}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group cursor-pointer"
              >
                <Mail className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                <span className="font-mono text-sm">
                  {copiedEmail ? t.copiedEmail : 'adrian.contact.me.69@gmail.com'}
                </span>
              </button>
            </div>
            
            <div className="hidden md:block w-px h-12 bg-slate-800"></div>

            <div className="flex flex-col md:flex-row flex-wrap justify-center gap-y-2 md:gap-y-6 gap-x-6 md:gap-x-12 items-center w-full md:w-auto px-4">
              <a 
                href={`/${language}/privacy`} 
                className="w-full md:w-auto py-3 md:py-2 px-4 text-slate-400 hover:text-white active:bg-white/5 active:scale-95 transition-all cursor-pointer text-[13px] font-bold rounded-xl whitespace-nowrap text-center"
              >
                {legalTranslations[language]?.nav.privacy || 'Privacy Policy'}
              </a>
              <a 
                href={`/${language}/terms`} 
                className="w-full md:w-auto py-3 md:py-2 px-4 text-slate-400 hover:text-white active:bg-white/5 active:scale-95 transition-all cursor-pointer text-[13px] font-bold rounded-xl whitespace-nowrap text-center"
              >
                {legalTranslations[language]?.nav.terms || 'Terms of Service'}
              </a>
              <a 
                href={`/${language}/cookies`} 
                className="w-full md:w-auto py-3 md:py-2 px-4 text-slate-400 hover:text-white active:bg-white/5 active:scale-95 transition-all cursor-pointer text-[13px] font-bold rounded-xl whitespace-nowrap text-center"
              >
                {legalTranslations[language]?.nav.cookies || 'Cookie Policy'}
              </a>
              <a 
                href={`/${language}/about`} 
                className="w-full md:w-auto py-3 md:py-2 px-4 text-slate-400 hover:text-white active:bg-white/5 active:scale-95 transition-all cursor-pointer text-[13px] font-bold rounded-xl whitespace-nowrap text-center"
              >
                {legalTranslations[language]?.nav.about || 'About'}
              </a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-slate-800/50 text-center">
            <p className="text-slate-600 text-sm font-medium tracking-wide">
              © {new Date().getFullYear()} <span className="text-white font-black">FORMATFLOW</span>. {t.footer}
            </p>
          </div>
        </div>
      </footer>

      <LegalModal
        isOpen={activeModal === 'privacy'} 
        onClose={() => setActiveModal(null)} 
        title={t.privacyPolicy}
        language={language}
        content={
          <div className="space-y-6">
            <p>{useTranslation(language, 'formatflow').dictionary.app.privacyPolicyContent.intro}</p>
            
            <h3 className="text-lg font-bold text-white mt-8 mb-4">{useTranslation(language, 'formatflow').dictionary.app.privacyPolicyContent.section1.title}</h3>
            <p>{useTranslation(language, 'formatflow').dictionary.app.privacyPolicyContent.section1.text}</p>
            
            <h3 className="text-lg font-bold text-white mt-8 mb-4">{useTranslation(language, 'formatflow').dictionary.app.privacyPolicyContent.section2.title}</h3>
            <p>{useTranslation(language, 'formatflow').dictionary.app.privacyPolicyContent.section2.text}</p>
            
            <h3 className="text-lg font-bold text-white mt-8 mb-4">{useTranslation(language, 'formatflow').dictionary.app.privacyPolicyContent.section3.title}</h3>
            <p>{useTranslation(language, 'formatflow').dictionary.app.privacyPolicyContent.section3.text}</p>
          </div>
        }
      />

      <LegalModal 
        isOpen={activeModal === 'terms'} 
        onClose={() => setActiveModal(null)} 
        title={t.termsOfService}
        language={language}
        content={
          <div className="space-y-6">
            <p>{useTranslation(language, 'formatflow').dictionary.app.termsOfServiceContent.intro}</p>
            
            <h3 className="text-lg font-bold text-white mt-8 mb-4">{useTranslation(language, 'formatflow').dictionary.app.termsOfServiceContent.section1.title}</h3>
            <p>{useTranslation(language, 'formatflow').dictionary.app.termsOfServiceContent.section1.text}</p>
            
            <h3 className="text-lg font-bold text-white mt-8 mb-4">{useTranslation(language, 'formatflow').dictionary.app.termsOfServiceContent.section2.title}</h3>
            <p>{useTranslation(language, 'formatflow').dictionary.app.termsOfServiceContent.section2.text}</p>
            
            <h3 className="text-lg font-bold text-white mt-8 mb-4">{useTranslation(language, 'formatflow').dictionary.app.termsOfServiceContent.section3.title}</h3>
            <p>{useTranslation(language, 'formatflow').dictionary.app.termsOfServiceContent.section3.text}</p>
          </div>
        }
      />

      <LegalModal 
        isOpen={activeModal === 'cookies'} 
        onClose={() => setActiveModal(null)} 
        title={t.cookiePolicy}
        language={language}
        content={
          <div className="space-y-6">
            <p>{useTranslation(language, 'formatflow').dictionary.app.cookiePolicyContent.intro}</p>
            
            <h3 className="text-lg font-bold text-white mt-8 mb-4">{useTranslation(language, 'formatflow').dictionary.app.cookiePolicyContent.section1.title}</h3>
            <p>{useTranslation(language, 'formatflow').dictionary.app.cookiePolicyContent.section1.text}</p>
            
            <h3 className="text-lg font-bold text-white mt-8 mb-4">{useTranslation(language, 'formatflow').dictionary.app.cookiePolicyContent.section2.title}</h3>
            <p>{useTranslation(language, 'formatflow').dictionary.app.cookiePolicyContent.section2.text}</p>
            
            <h3 className="text-lg font-bold text-white mt-8 mb-4">{useTranslation(language, 'formatflow').dictionary.app.cookiePolicyContent.section3.title}</h3>
            <p>{useTranslation(language, 'formatflow').dictionary.app.cookiePolicyContent.section3.text}</p>
          </div>
        }
      />

      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 z-[200] w-14 h-14 bg-primary text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 hover:-translate-y-2 active:scale-95 transition-all cursor-pointer group"
          >
            <ArrowUp className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
export default Formatflow;