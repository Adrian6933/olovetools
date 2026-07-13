import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Crop as CropIcon, 
  RotateCw, 
  RotateCcw,
  Maximize2, 
  Download, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  RefreshCw, 
  Lock, 
  Zap, 
  Image as ImageIcon,
  Check,
  ChevronDown
} from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import type { Language } from '../../locales/meta';
import { AdBanner } from '../../components/shared/AdBanner';
import { AspectRatioPreset, OutputFormat } from './types';

interface CropsnapProps {
  lang: Language;
  dictionary?: any;
}

export const Cropsnap: React.FC<CropsnapProps> = ({ lang, dictionary }) => {
  const t = dictionary || {};

  // Tabs layout
  const [activeTab, setActiveTab] = useState<'crop' | 'adjust' | 'size' | 'export'>('crop');

  // Image states
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isProcessingHEIC, setIsProcessingHEIC] = useState<boolean>(false);
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Cropper settings states
  const [activePreset, setActivePreset] = useState<AspectRatioPreset>('free');
  const [targetWidth, setTargetWidth] = useState<string>('');
  const [targetHeight, setTargetHeight] = useState<string>('');
  const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(true);
  
  // Transforms
  const [scaleX, setScaleX] = useState<number>(1);
  const [scaleY, setScaleY] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Export properties
  const [format, setFormat] = useState<OutputFormat>('image/jpeg');
  const [quality, setQuality] = useState<number>(90);

  // UI state
  const [status, setStatus] = useState<'idle' | 'ready' | 'exporting' | 'error'>('idle');
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeFaqIdx, setActiveFaqIdx] = useState<number | null>(null);

  // References
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const cropperRef = useRef<any>(null);

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

  // Safe cleanup for URLs
  const cleanupImageUrl = useCallback(() => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
  }, [imageUrl]);

  // Clean up cropper instance
  const destroyCropper = () => {
    if (cropperRef.current) {
      cropperRef.current.destroy();
      cropperRef.current = null;
    }
  };

  const handleReset = () => {
    destroyCropper();
    cleanupImageUrl();
    setOriginalImage(null);
    setImageUrl('');
    setImageSize({ width: 0, height: 0 });
    setActivePreset('free');
    setTargetWidth('');
    setTargetHeight('');
    setMaintainAspectRatio(true);
    setScaleX(1);
    setScaleY(1);
    setZoomLevel(1);
    setFormat('image/jpeg');
    setQuality(90);
    setStatus('idle');
    setActiveTab('crop');
  };

  // Initialize CropperJS dynamically inside client environment
  const initCropper = useCallback(async (url: string) => {
    destroyCropper();

    const CropperClass = (await import('cropperjs')).default;
    if (!imageRef.current) return;

    const cropperInstance = new CropperClass(imageRef.current);

    const cropperImage = cropperInstance.getCropperImage();
    if (cropperImage) {
      cropperImage.$ready(() => {
        setStatus('ready');
        // Retrieve initial selection dimension info
        const selection = cropperInstance.getCropperSelection();
        if (selection) {
          const width = Math.round(selection.width);
          const height = Math.round(selection.height);
          setImageSize({ width, height });
          setTargetWidth(String(width));
          setTargetHeight(String(height));
        }
      });
    }

    // Handle selection change events to update dimensions in real-time
    imageRef.current.addEventListener('crop', (event: any) => {
      const selection = cropperInstance.getCropperSelection();
      if (selection) {
        const w = Math.round(selection.width);
        const h = Math.round(selection.height);
        setImageSize({ width: w, height: h });
        
        // Auto-update inputs without overriding user manual entries during interactive drags
        setTargetWidth(prev => {
          if (document.activeElement?.id === 'cropsnap-width-input') return prev;
          return String(w);
        });
        setTargetHeight(prev => {
          if (document.activeElement?.id === 'cropsnap-height-input') return prev;
          return String(h);
        });
      }
    });

    cropperRef.current = cropperInstance;
  }, []);

  // Set aspect ratios preset
  const handlePresetChange = (preset: AspectRatioPreset) => {
    setActivePreset(preset);
    if (!cropperRef.current) return;

    const selection = cropperRef.current.getCropperSelection();
    if (!selection) return;

    let ratio = 0; // free crop default
    if (preset === '1:1') ratio = 1;
    else if (preset === '16:9') ratio = 16 / 9;
    else if (preset === '4:3') ratio = 4 / 3;
    else if (preset === '9:16') ratio = 9 / 16;
    else if (preset === '3:4') ratio = 3 / 4;

    selection.aspectRatio = ratio;
    selection.$render();
  };

  // Perform rotations
  const handleRotate = (deg: number) => {
    if (!cropperRef.current) return;
    const cropperImage = cropperRef.current.getCropperImage();
    if (cropperImage) {
      // Rotate by radians
      cropperImage.$rotate(deg * (Math.PI / 180));
    }
  };

  // Perform scale reflections
  const handleFlip = (direction: 'horiz' | 'vert') => {
    if (!cropperRef.current) return;
    const cropperImage = cropperRef.current.getCropperImage();
    if (cropperImage) {
      if (direction === 'horiz') {
        const nextScaleX = scaleX === 1 ? -1 : 1;
        setScaleX(nextScaleX);
        cropperImage.$scale(nextScaleX, scaleY);
      } else {
        const nextScaleY = scaleY === 1 ? -1 : 1;
        setScaleY(nextScaleY);
        cropperImage.$scale(scaleX, nextScaleY);
      }
    }
  };

  // Perform zooms
  const handleZoom = (levelChange: number) => {
    if (!cropperRef.current) return;
    const cropperImage = cropperRef.current.getCropperImage();
    if (cropperImage) {
      const nextZoom = Math.max(0.1, Math.min(5, zoomLevel + levelChange));
      setZoomLevel(nextZoom);
      cropperImage.$zoom(levelChange);
    }
  };

  // Handle inputs changes for custom dimensions
  const handleDimensionChange = (val: string, type: 'width' | 'height') => {
    if (type === 'width') {
      setTargetWidth(val);
      if (maintainAspectRatio && val) {
        const numVal = Number(val);
        if (!isNaN(numVal) && imageSize.width > 0) {
          const ratio = imageSize.height / imageSize.width;
          setTargetHeight(String(Math.round(numVal * ratio)));
        }
      }
    } else {
      setTargetHeight(val);
      if (maintainAspectRatio && val) {
        const numVal = Number(val);
        if (!isNaN(numVal) && imageSize.height > 0) {
          const ratio = imageSize.width / imageSize.height;
          setTargetWidth(String(Math.round(numVal * ratio)));
        }
      }
    }
  };

  // Load selected files into workspace
  const handleImageFile = async (file: File) => {
    if (!file) return;
    cleanupImageUrl();
    
    let activeFile = file;
    // Client-side HEIC Conversion using heic2any
    if (file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic') {
      setIsProcessingHEIC(true);
      setStatus('idle');
      try {
        const heic2any = (await import('heic2any')).default;
        const resultBlob = await heic2any({ blob: file, toType: 'image/jpeg' });
        activeFile = new File([resultBlob as Blob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
      } catch (err) {
        console.error('HEIC local conversion failed:', err);
        setStatus('error');
        setIsProcessingHEIC(false);
        return;
      }
      setIsProcessingHEIC(false);
    }

    setOriginalImage(activeFile);
    const url = URL.createObjectURL(activeFile);
    setImageUrl(url);

    // Give browsers a microsecond frame to bind DOM elements
    setTimeout(() => {
      initCropper(url);
    }, 100);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleImageFile(e.target.files[0]);
    }
  };

  // Paste handler
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const files = e.clipboardData?.files;
    if (files && files.length > 0) {
      handleImageFile(files[0]);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  // Perform crop download
  const handleDownload = async () => {
    if (!cropperRef.current || !originalImage) return;
    setStatus('exporting');

    try {
      const cropperSelection = cropperRef.current.getCropperSelection();
      if (!cropperSelection) {
        setStatus('error');
        return;
      }

      // Convert selection coordinates to a canvas element
      const w = Number(targetWidth) || imageSize.width;
      const h = Number(targetHeight) || imageSize.height;

      const outputCanvas = await cropperSelection.$toCanvas({
        width: w,
        height: h
      });

      // Compress and download
      const q = quality / 100;
      const dataUrl = outputCanvas.toDataURL(format, q);

      const ext = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';
      const origName = originalImage.name.substring(0, originalImage.name.lastIndexOf('.')) || originalImage.name;
      const finalName = `${origName}-cropped.${ext}`;

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = finalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setStatus('ready');
    } catch (e) {
      console.error('Export rendering pipeline failed:', e);
      setStatus('error');
    }
  };

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      cleanupImageUrl();
      destroyCropper();
    };
  }, [cleanupImageUrl]);

  const faqs = Array.isArray(t.faq) ? t.faq : [];
  const keywords = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];
  const featuresList = Array.isArray(t.features) ? t.features : [];

  return (
    <div className="min-h-screen flex flex-col bg-[#07050a] text-slate-100 selection:bg-rose-500/30 overflow-x-hidden font-sans">
      {/* Background Orbs */}
      

      <Header currentLang={lang} onLanguageChange={(newLang) => window.location.href = `/${newLang.toLowerCase()}/cropsnap`} onReset={handleReset} t={t} />

      <main className="flex-1 flex flex-col items-center pt-36 pb-32 px-4 md:px-12 relative z-10 w-full">
        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-cropsnap-top" />
        <div className="max-w-6xl w-full text-center space-y-16 md:space-y-24">
          
          {/* Hero Header */}
          <div className="flex flex-col items-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center space-x-2 px-5 py-2 rounded-full bg-rose-950/40 border border-rose-800/30 text-rose-400 text-xs font-black tracking-widest uppercase shadow-[0_0_25px_rgba(244,63,94,0.15)]">
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

          {/* Interactive Core Box */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left box: Crop zone workspace */}
            <div className="lg:col-span-7 space-y-6">
              {imageUrl === '' ? (
                /* Empty Dropzone */
                <div 
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative border-2 border-dashed border-rose-950 hover:border-rose-500/40 bg-[#0f0a17]/30 hover:bg-[#150d22]/40 rounded-3xl p-12 md:p-20 flex flex-col items-center justify-center space-y-6 cursor-pointer transition-premium shadow-xl shadow-black/20"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileInput} 
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif" 
                    className="hidden" 
                  />
                  
                  <div className="relative">
                    <div className="absolute inset-0 bg-rose-500/10 blur-xl rounded-full scale-125 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-20 h-20 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-center text-rose-400 relative z-10 transition-transform group-hover:scale-105 group-hover:-translate-y-1 shadow-lg shadow-black/40">
                      {isProcessingHEIC ? (
                        <Loader2 className="w-10 h-10 animate-spin text-rose-400" />
                      ) : (
                        <Upload className="w-10 h-10 animate-float" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      {isProcessingHEIC ? 'Converting iPhone HEIC...' : t.labelUploadImage}
                    </h3>
                    <p className="text-slate-500 text-sm font-medium">
                      {isProcessingHEIC ? 'This happens locally in your browser' : 'PNG, JPEG, WEBP, or HEIC'}
                    </p>
                  </div>
                </div>
              ) : (
                /* Active Canvas Workspace */
                <div className="glass-card rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden border border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider block">Interactive Editor</span>
                      <h4 className="text-sm font-bold text-white truncate max-w-[280px] mt-0.5">{originalImage?.name}</h4>
                    </div>
                    <button 
                      onClick={handleReset}
                      className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                      title={t.btnReset}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="relative aspect-video rounded-2xl overflow-hidden checkered-bg border border-white/5 flex items-center justify-center max-h-[420px]">
                    <img 
                      ref={imageRef}
                      src={imageUrl} 
                      alt="Crop selection source" 
                      className="max-h-full max-w-full object-contain"
                    />

                    {status === 'exporting' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs space-y-4">
                        <Loader2 className="w-12 h-12 text-rose-400 animate-spin" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Generating export canvas...</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold border-t border-white/5 pt-4">
                    <span>File weight: {originalImage ? formatBytes(originalImage.size) : '0 B'}</span>
                    <span>Selection ratio: {imageSize.width} Ãƒâ€” {imageSize.height} px</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right box: Controller Sidebar */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Tab Selector buttons */}
              <div className="flex p-1 rounded-2xl bg-[#0e0c15]/80 border border-white/5 shadow-2xl gap-1 w-full overflow-x-auto custom-scrollbar">
                {[
                  { id: 'crop', label: t.tabCrop, icon: CropIcon },
                  { id: 'adjust', label: t.tabAdjust, icon: RotateCw },
                  { id: 'size', label: t.tabSize, icon: Maximize2 },
                  { id: 'export', label: t.tabExport, icon: Download }
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 flex items-center justify-center space-x-2 py-3.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer select-none outline-none whitespace-nowrap
                        ${isActive 
                          ? 'bg-rose-600 text-white shadow-[0_0_25px_rgba(244,63,94,0.4)]' 
                          : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Sidebar Content Panel */}
              <div className="glass-card rounded-3xl p-6 text-left space-y-5 min-h-[380px] relative overflow-hidden flex flex-col justify-between">
                

                {imageUrl === '' ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 space-y-2 py-12">
                    <CropIcon className="w-12 h-12 text-slate-600 animate-pulse" />
                    <p className="text-sm font-bold">Upload an image to unlock editing controls</p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-between h-full">
                    
                    {/* TAB 1: CROP & ASPECT PRESETS */}
                    {activeTab === 'crop' && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.labelAspectPresets}</label>
                        
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: 'free', label: t.ratioFree },
                            { id: '1:1', label: t.ratioSquare },
                            { id: '16:9', label: t.ratioLandscape16_9 },
                            { id: '4:3', label: t.ratioLandscape4_3 },
                            { id: '9:16', label: t.ratioPortrait9_16 },
                            { id: '3:4', label: t.ratioPortrait3_4 }
                          ].map(preset => {
                            const isSel = activePreset === preset.id;
                            return (
                              <button
                                key={preset.id}
                                onClick={() => handlePresetChange(preset.id as AspectRatioPreset)}
                                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer outline-none flex flex-col justify-between h-16
                                  ${isSel 
                                    ? 'bg-rose-950/20 border-rose-500/40 text-rose-400 shadow-inner' 
                                    : 'bg-[#060408] border-white/5 text-slate-400 hover:text-white hover:bg-white/5'}`}
                              >
                                <span className="text-[10px] font-black uppercase tracking-wider block">{preset.label.split(' ')[0]}</span>
                                <span className="text-xs font-bold text-white">{preset.label.includes('(') ? preset.label.substring(preset.label.indexOf('(')) : preset.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* TAB 2: ADJUST & TRANSFORMS */}
                    {activeTab === 'adjust' && (
                      <div className="space-y-5 animate-in fade-in duration-200">
                        
                        {/* Rotation grid */}
                        <div className="space-y-2.5">
                          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Rotation controls</label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => handleRotate(-90)}
                              className="py-3 px-4 bg-[#060408] border border-white/5 hover:bg-white/5 rounded-xl text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer outline-none"
                            >
                              <RotateCcw className="w-4 h-4 text-rose-400" />
                              <span>{t.btnRotateLeft}</span>
                            </button>
                            <button
                              onClick={() => handleRotate(90)}
                              className="py-3 px-4 bg-[#060408] border border-white/5 hover:bg-white/5 rounded-xl text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer outline-none"
                            >
                              <RotateCw className="w-4 h-4 text-rose-400" />
                              <span>{t.btnRotateRight}</span>
                            </button>
                          </div>
                        </div>

                        {/* Flip Grid */}
                        <div className="space-y-2.5">
                          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Flip reflections</label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => handleFlip('horiz')}
                              className="py-3 px-4 bg-[#060408] border border-white/5 hover:bg-white/5 rounded-xl text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer outline-none"
                            >
                              <span className="text-rose-400 font-bold">Ã¢â€ â€</span>
                              <span>{t.btnFlipHoriz}</span>
                            </button>
                            <button
                              onClick={() => handleFlip('vert')}
                              className="py-3 px-4 bg-[#060408] border border-white/5 hover:bg-white/5 rounded-xl text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer outline-none"
                            >
                              <span className="text-rose-400 font-bold">Ã¢â€ â€¢</span>
                              <span>{t.btnFlipVert}</span>
                            </button>
                          </div>
                        </div>

                        {/* Zoom control buttons */}
                        <div className="space-y-2.5">
                          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Zoom magnification</label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => handleZoom(0.1)}
                              className="py-3 px-4 bg-[#060408] border border-white/5 hover:bg-white/5 rounded-xl text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer outline-none"
                            >
                              <span className="text-rose-400 font-bold text-sm">+</span>
                              <span>{t.btnZoomIn}</span>
                            </button>
                            <button
                              onClick={() => handleZoom(-0.1)}
                              className="py-3 px-4 bg-[#060408] border border-white/5 hover:bg-white/5 rounded-xl text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer outline-none"
                            >
                              <span className="text-rose-400 font-bold text-sm">-</span>
                              <span>{t.btnZoomOut}</span>
                            </button>
                          </div>
                        </div>

                      </div>
                    )}

                    {/* TAB 3: RESIZE DIMENSIONS */}
                    {activeTab === 'size' && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.labelCustomSize}</label>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Width (px)</span>
                            <input
                              type="number"
                              id="cropsnap-width-input"
                              value={targetWidth}
                              onChange={(e) => handleDimensionChange(e.target.value, 'width')}
                              className="w-full h-11 bg-[#060408] border border-white/10 rounded-xl px-4 text-xs font-bold text-slate-200 outline-none focus:border-rose-500"
                              placeholder={String(imageSize.width)}
                            />
                          </div>

                          <div className="space-y-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Height (px)</span>
                            <input
                              type="number"
                              id="cropsnap-height-input"
                              value={targetHeight}
                              onChange={(e) => handleDimensionChange(e.target.value, 'height')}
                              className="w-full h-11 bg-[#060408] border border-white/10 rounded-xl px-4 text-xs font-bold text-slate-200 outline-none focus:border-rose-500"
                              placeholder={String(imageSize.height)}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3">
                          <div>
                            <span className="text-xs font-black text-slate-300 uppercase tracking-wider block">{t.labelMaintainRatio}</span>
                            <span className="text-[9px] text-slate-500 font-semibold block">Lock aspect ratio parameters to prevent distortion</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={maintainAspectRatio} 
                              onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                              className="sr-only peer outline-none" 
                            />
                            <div className="w-9 h-5 bg-[#080d0a] rounded-full border border-white/10 peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-400 after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:bg-rose-400 peer-checked:border-rose-500/50" />
                          </label>
                        </div>
                      </div>
                    )}

                    {/* TAB 4: EXPORT OPTIONS */}
                    {activeTab === 'export' && (
                      <div className="space-y-5 animate-in fade-in duration-200">
                        
                        {/* Format selector */}
                        <div className="space-y-2">
                          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.labelOutputFormat}</label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'image/jpeg', label: 'JPEG' },
                              { id: 'image/png', label: 'PNG' },
                              { id: 'image/webp', label: 'WEBP' }
                            ].map(f => {
                              const isSel = format === f.id;
                              return (
                                <button
                                  key={f.id}
                                  onClick={() => setFormat(f.id as OutputFormat)}
                                  className={`py-3 px-1 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer outline-none
                                    ${isSel 
                                      ? 'bg-rose-950/20 border-rose-500/40 text-rose-400 shadow-inner' 
                                      : 'bg-[#060408] border-white/5 text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                  {f.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Quality slider */}
                        {format !== 'image/png' && (
                          <div className="space-y-2 pt-2">
                            <div className="flex justify-between text-xs font-black text-slate-500 uppercase tracking-widest">
                              <span>{t.labelOutputQuality}</span>
                              <span className="text-rose-400 font-bold">{quality}%</span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="100"
                              value={quality}
                              onChange={(e) => setQuality(Number(e.target.value))}
                              className="w-full h-1 bg-white/10 rounded outline-none accent-rose-500 cursor-pointer"
                            />
                          </div>
                        )}

                      </div>
                    )}

                    {/* Download button trigger */}
                    <div className="pt-8 border-t border-white/5">
                      <button
                        onClick={handleDownload}
                        className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-black font-black text-xs uppercase tracking-widest rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer shadow-[0_0_20px_rgba(244,63,94,0.2)]"
                      >
                        <Download className="w-4 h-4 stroke-[3]" />
                        <span>{t.btnDownload}</span>
                      </button>
                    </div>

                  </div>
                )}

              </div>
            </div>

          </div>

          {/* Value Propositions / Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16">
            {featuresList.map((feature: any, idx: number) => (
              <div 
                key={idx}
                className="p-8 glass-card rounded-3xl text-left hover:-translate-y-2 hover:shadow-2xl hover:shadow-rose-500/5 transition-all duration-300 group border border-white/5"
              >
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-6 group-hover:scale-110 transition-all">
                  {[<CropIcon className="w-6 h-6" />, <Zap className="w-6 h-6" />, <Maximize2 className="w-6 h-6" />][idx]}
                </div>
                <h3 className="text-white text-xl font-bold mb-3 group-hover:text-rose-400 transition-colors">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">{feature.text}</p>
              </div>
            ))}
          </div>

          {/* Extra Content - SEO Text */}
          <div className="pt-24 space-y-24 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 items-center">
              <div className="space-y-8">
                <div className="inline-block px-4 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-black uppercase tracking-[0.2em] border border-rose-500/20">
                  {t.title}
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.05] tracking-tighter">
                  {t.seoHeroTitle}
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed font-medium">
                  {t.seoHeroText}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  {(t.seoHeroList || []).map((item: string, i: number) => (
                    <div key={i} className="flex items-center space-x-3 p-4 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
                      <div className="w-8 h-8 shrink-0 bg-rose-500/20 text-rose-400 rounded-xl flex items-center justify-center text-sm group-hover:rotate-12 transition-transform">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                      <span className="text-slate-300 font-bold text-base">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative group">
                
                <div className="relative glass-card rounded-[4rem] p-12 py-20 min-h-[420px] w-full flex flex-col items-center justify-center space-y-8 text-center overflow-hidden">
                  <div className="text-[7.5rem] animate-float drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]">Ã¢Å“â€šÃ¯Â¸Â</div>
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
                <div className="h-1.5 w-20 bg-rose-500 rounded-full"></div>
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
                <div className="h-1 w-16 bg-rose-500 mx-auto rounded-full"></div>
              </div>
              <div className="grid gap-4">
                {faqs.map((item: any, idx: number) => (
                  <div 
                    key={idx}
                    onClick={() => setActiveFaqIdx(activeFaqIdx === idx ? null : idx)}
                    className="glass-card rounded-2xl p-6 text-left space-y-3 hover:border-rose-500/20 transition-colors group cursor-pointer"
                  >
                    <h3 className="text-lg font-bold text-white group-hover:text-rose-400 transition-colors flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 text-xs font-black">Q</span>
                        {item.question}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${activeFaqIdx === idx ? 'rotate-180 text-rose-400' : ''}`} />
                    </h3>
                    <AnimatePresence initial={false}>
                      {(activeFaqIdx === idx) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <p className="text-slate-400 leading-relaxed pl-8 text-sm pt-2">
                            {item.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </section>

            {/* Keyword Tags */}
            <section className="max-w-4xl mx-auto w-full space-y-6 opacity-55 text-center">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{t.seoKeywordsTitle}</h2>
              <div className="flex flex-wrap justify-center gap-2">
                {keywords.map((keyword: string, idx: number) => (
                  <span key={idx} className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 transition-all cursor-default">
                    {keyword}
                  </span>
                ))}
              </div>
            </section>
          </div>

        </div>
      {/* Bloque AdSense Horizontal */}
      <AdBanner id="adsense-cropsnap-bottom" />
      </main>

      {/* Floating Scroll Top button */}
      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-10 right-10 z-[200] w-14 h-14 bg-white text-black rounded-2xl shadow-2xl flex items-center justify-center border-none transition-all hover:scale-110 active:scale-90 hover:-translate-y-1 cursor-pointer group"
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

export default Cropsnap;
