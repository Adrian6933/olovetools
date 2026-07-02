import React, { useState, useEffect, useRef } from 'react';
import { Tag, Plus, Trash2, Download, RefreshCw, Upload, Move, Settings, Grid, Sparkles, AlertCircle, X, HelpCircle } from 'lucide-react';
import { useTranslation, Language } from '../../locales/dictionary';
import { AdBanner } from '../../components/shared/AdBanner';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { legalTranslations } from '../../locales/legal';
import JSZip from 'jszip';

interface WatermarkSnapProps {
  lang: string;
  dictionary: any;
}

interface ImageItem {
  id: string;
  file: File;
  name: string;
  dataUrl: string;
  width: number;
  height: number;
}

export const WatermarkSnap: React.FC<WatermarkSnapProps> = ({ lang, dictionary }) => {
  const { t } = useTranslation(lang as Language, 'watermark-snap');

  // Input files state
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  // Watermark parameters
  const [mode, setMode] = useState<'text' | 'logo'>('text');
  const [text, setText] = useState<string>('Watermark');
  const [fontSizeRatio, setFontSizeRatio] = useState<number>(40); // base width 1000px
  const [color, setColor] = useState<string>('#ffffff');
  const [opacity, setOpacity] = useState<number>(0.5);
  const [rotation, setRotation] = useState<number>(0);
  const [fontFamily, setFontFamily] = useState<string>('sans-serif');
  const [placementMode, setPlacementMode] = useState<'align' | 'tile' | 'custom'>('align');
  const [alignPreset, setAlignPreset] = useState<'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('center');
  const [customPos, setCustomPos] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  
  // Custom logo image states
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoImgEl, setLogoImgEl] = useState<HTMLImageElement | null>(null);
  const [logoSizeRatio, setLogoSizeRatio] = useState<number>(20); // logo size relative to base width

  // Batch Export & UI statuses
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [compileProgress, setCompileProgress] = useState<number>(0);
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);

  // Modal statuses
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'privacy' | 'terms' | 'cookies'>('privacy');

  // Refs
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const imageCacheRef = useRef<Record<string, HTMLImageElement>>({});
  const isDraggingRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const selectedImage = images.find(img => img.id === selectedImageId) || null;

  // Cleanup ObjectURLs on unmount
  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.dataUrl));
    };
  }, []);

  // Pre-load watermark logo image
  useEffect(() => {
    if (logoFile) {
      const url = URL.createObjectURL(logoFile);
      const img = new Image();
      img.onload = () => {
        setLogoImgEl(img);
      };
      img.src = url;
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setLogoImgEl(null);
    }
  }, [logoFile]);

  // Redraw preview canvas whenever dependencies modify
  useEffect(() => {
    if (!selectedImage || !previewCanvasRef.current) return;
    
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load or fetch cached image element for instant responsive drawings
    const draw = (imgEl: HTMLImageElement) => {
      canvas.width = selectedImage.width;
      canvas.height = selectedImage.height;
      
      drawWatermark(canvas, ctx, imgEl, {
        mode,
        text,
        fontSizeRatio,
        color,
        opacity,
        rotation,
        fontFamily,
        placementMode,
        alignPreset,
        customPos,
        logoImgEl,
        logoSizeRatio
      });
    };

    const cachedImg = imageCacheRef.current[selectedImage.id];
    if (cachedImg) {
      draw(cachedImg);
    } else {
      const img = new Image();
      img.onload = () => {
        imageCacheRef.current[selectedImage.id] = img;
        draw(img);
      };
      img.src = selectedImage.dataUrl;
    }
  }, [
    selectedImage,
    mode,
    text,
    fontSizeRatio,
    color,
    opacity,
    rotation,
    fontFamily,
    placementMode,
    alignPreset,
    customPos,
    logoImgEl,
    logoSizeRatio
  ]);

  // Core Watermark Rendering Engine
  const drawWatermark = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    imageElement: HTMLImageElement,
    options: {
      mode: 'text' | 'logo';
      text: string;
      fontSizeRatio: number;
      color: string;
      opacity: number;
      rotation: number;
      fontFamily: string;
      placementMode: 'align' | 'tile' | 'custom';
      alignPreset: string;
      customPos: { x: number; y: number };
      logoImgEl: HTMLImageElement | null;
      logoSizeRatio: number;
    }
  ) => {
    // 1. Draw source image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
    
    // 2. Set opacity & styling scale
    ctx.save();
    ctx.globalAlpha = options.opacity;
    
    const baseScale = canvas.width / 1000; // treating 1000px width as 1.0 scale
    
    if (options.mode === 'text') {
      const actualFontSize = Math.max(12, options.fontSizeRatio * baseScale);
      ctx.font = `bold ${actualFontSize}px ${options.fontFamily}, sans-serif`;
      ctx.fillStyle = options.color;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      
      const textMetrics = ctx.measureText(options.text);
      const textWidth = textMetrics.width;
      const textHeight = actualFontSize;
      
      if (options.placementMode === 'tile') {
        const stepX = textWidth * 2.2 + 60 * baseScale;
        const stepY = textHeight * 4.0 + 80 * baseScale;
        
        ctx.restore();
        ctx.save();
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.clip();
        
        const diag = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
        const startX = -diag;
        const endX = canvas.width + diag;
        const startY = -diag;
        const endY = canvas.height + diag;
        
        ctx.globalAlpha = options.opacity;
        
        for (let x = startX; x < endX; x += stepX) {
          for (let y = startY; y < endY; y += stepY) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((options.rotation * Math.PI) / 180);
            ctx.fillText(options.text, 0, 0);
            ctx.restore();
          }
        }
      } else {
        let posX = canvas.width / 2;
        let posY = canvas.height / 2;
        
        if (options.placementMode === 'align') {
          const padding = actualFontSize * 1.5;
          switch (options.alignPreset) {
            case 'top-left':
              posX = padding + textWidth / 2;
              posY = padding;
              break;
            case 'top-right':
              posX = canvas.width - padding - textWidth / 2;
              posY = padding;
              break;
            case 'bottom-left':
              posX = padding + textWidth / 2;
              posY = canvas.height - padding;
              break;
            case 'bottom-right':
              posX = canvas.width - padding - textWidth / 2;
              posY = canvas.height - padding;
              break;
            case 'center':
            default:
              posX = canvas.width / 2;
              posY = canvas.height / 2;
              break;
          }
        } else if (options.placementMode === 'custom') {
          posX = options.customPos.x * canvas.width;
          posY = options.customPos.y * canvas.height;
        }
        
        ctx.translate(posX, posY);
        ctx.rotate((options.rotation * Math.PI) / 180);
        ctx.fillText(options.text, 0, 0);
      }
    } else {
      // LOGO WATERMARK
      if (!options.logoImgEl) {
        ctx.restore();
        return;
      }
      
      const logoWidth = (options.logoSizeRatio / 100) * canvas.width;
      const logoHeight = (logoWidth / options.logoImgEl.width) * options.logoImgEl.height;
      
      if (options.placementMode === 'tile') {
        const stepX = logoWidth * 2.2 + 60 * baseScale;
        const stepY = logoHeight * 2.2 + 60 * baseScale;
        
        ctx.restore();
        ctx.save();
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.clip();
        
        const diag = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
        const startX = -diag;
        const endX = canvas.width + diag;
        const startY = -diag;
        const endY = canvas.height + diag;
        
        ctx.globalAlpha = options.opacity;
        
        for (let x = startX; x < endX; x += stepX) {
          for (let y = startY; y < endY; y += stepY) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((options.rotation * Math.PI) / 180);
            ctx.drawImage(options.logoImgEl, -logoWidth / 2, -logoHeight / 2, logoWidth, logoHeight);
            ctx.restore();
          }
        }
      } else {
        let posX = canvas.width / 2;
        let posY = canvas.height / 2;
        
        if (options.placementMode === 'align') {
          const padding = Math.max(15, baseScale * 30);
          switch (options.alignPreset) {
            case 'top-left':
              posX = padding + logoWidth / 2;
              posY = padding + logoHeight / 2;
              break;
            case 'top-right':
              posX = canvas.width - padding - logoWidth / 2;
              posY = padding + logoHeight / 2;
              break;
            case 'bottom-left':
              posX = padding + logoWidth / 2;
              posY = canvas.height - padding - logoHeight / 2;
              break;
            case 'bottom-right':
              posX = canvas.width - padding - logoWidth / 2;
              posY = canvas.height - padding - logoHeight / 2;
              break;
            case 'center':
            default:
              posX = canvas.width / 2;
              posY = canvas.height / 2;
              break;
          }
        } else if (options.placementMode === 'custom') {
          posX = options.customPos.x * canvas.width;
          posY = options.customPos.y * canvas.height;
        }
        
        ctx.translate(posX, posY);
        ctx.rotate((options.rotation * Math.PI) / 180);
        ctx.drawImage(options.logoImgEl, -logoWidth / 2, -logoHeight / 2, logoWidth, logoHeight);
      }
    }
    
    ctx.restore();
  };

  // Upload handlers
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addUploadedFiles(e.target.files);
    }
  };

  const addUploadedFiles = (fileList: FileList) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    Array.from(fileList).forEach(file => {
      if (!validTypes.includes(file.type)) return;
      
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const item: ImageItem = {
          id: Math.random().toString(36).substring(2, 11),
          file,
          name: file.name,
          dataUrl: url,
          width: img.width,
          height: img.height
        };
        imageCacheRef.current[item.id] = img;
        setImages(prev => {
          const next = [...prev, item];
          if (prev.length === 0) {
            setSelectedImageId(item.id);
          }
          return next;
        });
      };
      img.src = url;
    });
  };

  const deleteImage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      if (selectedImageId === id) {
        setSelectedImageId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
    // Cleanup cache
    if (imageCacheRef.current[id]) {
      delete imageCacheRef.current[id];
    }
  };

  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.dataUrl));
    setImages([]);
    setSelectedImageId(null);
    imageCacheRef.current = {};
  };

  // Drag and drop custom coordinate positioning handlers
  const handleDragStart = () => {
    if (placementMode !== 'custom') return;
    isDraggingRef.current = true;
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDraggingRef.current || !previewContainerRef.current) return;
    
    const rect = previewContainerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    let x = (clientX - rect.left) / rect.width;
    let y = (clientY - rect.top) / rect.height;
    
    // Clamp to [0, 1] bounds
    x = Math.max(0, Math.min(1, x));
    y = Math.max(0, Math.min(1, y));
    
    setCustomPos({ x, y });
  };

  const handleDragEnd = () => {
    isDraggingRef.current = false;
  };

  // Logo file upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  // Batch compilation & zip download
  const handleBatchDownload = async () => {
    if (images.length === 0) return;
    setIsCompiling(true);
    setCompileProgress(0);
    setActiveImageIdx(0);

    const zip = new JSZip();
    const offscreenCanvas = document.createElement('canvas');
    const offscreenCtx = offscreenCanvas.getContext('2d');

    if (!offscreenCtx) {
      setIsCompiling(false);
      alert('Could not allocate canvas resources.');
      return;
    }

    try {
      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        setActiveImageIdx(i);
        setCompileProgress(Math.round((i / images.length) * 100));

        // Ensure source image is loaded in cache
        let imgEl = imageCacheRef.current[item.id];
        if (!imgEl) {
          imgEl = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = item.dataUrl;
          });
          imageCacheRef.current[item.id] = imgEl;
        }

        // Draw on offscreen canvas
        offscreenCanvas.width = item.width;
        offscreenCanvas.height = item.height;

        drawWatermark(offscreenCanvas, offscreenCtx, imgEl, {
          mode,
          text,
          fontSizeRatio,
          color,
          opacity,
          rotation,
          fontFamily,
          placementMode,
          alignPreset,
          customPos,
          logoImgEl,
          logoSizeRatio
        });

        // Convert offscreen canvas to blob
        const blob = await new Promise<Blob | null>(resolve => {
          offscreenCanvas.toBlob(resolve, 'image/jpeg', 0.92);
        });

        if (blob) {
          // Keep base name without extension, append _watermarked
          const originalName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
          zip.file(`${originalName}_watermarked.jpg`, blob);
        }
      }

      setCompileProgress(100);
      
      const zipContent = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipContent);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `watermark-snap-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
    } catch (err) {
      console.error('Batch compilation failed:', err);
      alert('Failed compiling batch archive.');
    } finally {
      setIsCompiling(false);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const triggerLogoInput = () => {
    if (logoInputRef.current) logoInputRef.current.click();
  };

  const handleOpenLegal = (type: 'privacy' | 'terms' | 'cookies') => {
    setModalType(type);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#080604] text-slate-200 font-sans flex flex-col">
      <Header
        currentLang={lang}
        onLanguageChange={(newLang) => {
          window.location.href = `/${newLang.toLowerCase()}/watermark-snap`;
        }}
        onReset={clearAll}
        t={t}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-12 pt-36 pb-24 relative z-10 flex flex-col justify-center">
        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-watermark-snap-top" />
        {/* Title SEO Hero */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-4xl md:text-6xl font-black font-outfit tracking-tight text-white mb-4">
            {t.seoHeroTitle || 'Protect Images with Local Batch Watermarks'}
          </h1>
          <p className="text-slate-400 text-lg max-w-3xl mx-auto leading-relaxed font-medium">
            {t.seoHeroText || 'Overlay branding logos or custom text in bulk instantly. Runs 100% in-browser.'}
          </p>
        </div>

        {/* 3-Zone Workspace Dashboard Container */}
        <div className="w-full bg-[#120d09]/40 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 md:p-8 shadow-2xl relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch min-h-[650px] glow-amber">
          
          {/* ZONE 1: Left parameter controls (Col-span 4) */}
          <div className="lg:col-span-4 flex flex-col gap-6 bg-black/20 p-6 rounded-2xl border border-white/5 justify-between">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-amber-500 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  {t.title || 'Watermark-Snap'}
                </h3>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {mode === 'text' ? (t.label_mode_text || 'Text') : (t.label_mode_logo || 'Logo')}
                </span>
              </div>

              {/* Mode switch */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
                <button
                  onClick={() => setMode('text')}
                  className={`py-2 px-3 text-xs font-black uppercase rounded-lg transition-all cursor-pointer border-none outline-none ${
                    mode === 'text'
                      ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t.label_mode_text || 'Text'}
                </button>
                <button
                  onClick={() => setMode('logo')}
                  className={`py-2 px-3 text-xs font-black uppercase rounded-lg transition-all cursor-pointer border-none outline-none ${
                    mode === 'logo'
                      ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t.label_mode_logo || 'Logo'}
                </button>
              </div>

              {/* TEXT WATERMARK CONTROL FIELDS */}
              {mode === 'text' && (
                <div className="flex flex-col gap-4">
                  {/* Text string input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {t.label_watermark_text || 'Watermark Text'}
                    </label>
                    <input
                      type="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="e.g. © My Brand"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none transition-colors"
                    />
                  </div>

                  {/* Font select picker */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Font Family
                    </label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none transition-colors cursor-pointer"
                    >
                      <option value="sans-serif">System Sans</option>
                      <option value="serif">System Serif</option>
                      <option value="monospace">System Mono</option>
                      <option value="'Outfit'">Outfit (Google)</option>
                      <option value="'Plus Jakarta Sans'">Jakarta (Google)</option>
                      <option value="Impact">Impact</option>
                      <option value="Courier New">Courier New</option>
                    </select>
                  </div>

                  {/* Size Ratio slider */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <span>{t.label_font_size || 'Font Size'}</span>
                      <span className="text-amber-500 font-mono">{fontSizeRatio}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="120"
                      value={fontSizeRatio}
                      onChange={(e) => setFontSizeRatio(parseInt(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Hex Color picker */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {t.label_color || 'Text Color'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-10 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer p-0"
                      />
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white uppercase outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* LOGO WATERMARK CONTROL FIELDS */}
              {mode === 'logo' && (
                <div className="flex flex-col gap-4">
                  {/* File Upload drag area */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {t.label_logo_file || 'Logo Asset'}
                    </label>
                    <input
                      type="file"
                      ref={logoInputRef}
                      onChange={handleLogoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <div
                      onClick={triggerLogoInput}
                      className="border-2 border-dashed border-white/15 hover:border-amber-500/50 bg-black/20 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-black/40 group text-center"
                    >
                      {logoFile ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <img
                            src={logoImgEl?.src || ''}
                            alt="Watermark Logo Preview"
                            className="w-12 h-12 object-contain rounded bg-white/5 border border-white/10 p-1"
                          />
                          <span className="text-xs font-bold text-white truncate max-w-[200px]">
                            {logoFile.name}
                          </span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-slate-500 group-hover:text-amber-400 transition-colors" />
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Upload Logo Image
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Logo Size ratio slider */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <span>{t.label_logo_size || 'Logo Size'}</span>
                      <span className="text-amber-500 font-mono">{logoSizeRatio}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="80"
                      value={logoSizeRatio}
                      onChange={(e) => setLogoSizeRatio(parseInt(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* SHARED PARAMS: OPACITY & ROTATION */}
              <div className="flex flex-col gap-4 border-t border-white/5 pt-4">
                {/* Opacity */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <span>{t.label_opacity || 'Opacity'}</span>
                    <span className="text-amber-500 font-mono">{Math.round(opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={opacity}
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Rotation */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <span>{t.label_rotation || 'Rotation'}</span>
                    <span className="text-amber-500 font-mono">{rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={rotation}
                    onChange={(e) => setRotation(parseInt(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* PLACEMENT / ALIGNMENT SETTINGS */}
              <div className="flex flex-col gap-3 border-t border-white/5 pt-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {t.label_position || 'Positioning Mode'}
                </label>
                
                {/* Placement Mode Tabs */}
                <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-xl border border-white/5 text-[10px]">
                  <button
                    onClick={() => setPlacementMode('align')}
                    className={`py-1.5 font-bold uppercase rounded-lg transition-all cursor-pointer border-none outline-none ${
                      placementMode === 'align'
                        ? 'bg-amber-500 text-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Align
                  </button>
                  <button
                    onClick={() => setPlacementMode('tile')}
                    className={`py-1.5 font-bold uppercase rounded-lg transition-all cursor-pointer border-none outline-none ${
                      placementMode === 'tile'
                        ? 'bg-amber-500 text-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tile
                  </button>
                  <button
                    onClick={() => setPlacementMode('custom')}
                    className={`py-1.5 font-bold uppercase rounded-lg transition-all cursor-pointer border-none outline-none ${
                      placementMode === 'custom'
                        ? 'bg-amber-500 text-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Drag
                  </button>
                </div>

                {/* Preset alignment positions */}
                {placementMode === 'align' && (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'top-left', label: '◤ TL' },
                      { key: 'center', label: '✦ C' },
                      { key: 'top-right', label: '◥ TR' },
                      { key: 'bottom-left', label: '◣ BL' },
                      { key: 'bottom-right', label: '◢ BR' }
                    ].map((p) => (
                      <button
                        key={p.key}
                        onClick={() => setAlignPreset(p.key as any)}
                        className={`py-1.5 text-[10px] font-bold uppercase border rounded-lg transition-all cursor-pointer outline-none ${
                          alignPreset === p.key
                            ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                            : 'border-white/10 hover:border-white/20 text-slate-300'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Drag info details */}
                {placementMode === 'custom' && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-white/5 border border-white/5 rounded-xl p-2.5">
                    <Move className="w-4 h-4 text-amber-500 animate-bounce" />
                    <span>
                      Drag-and-drop the watermark on the preview container to place it.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ACTION: ZIP download trigger */}
            <div className="border-t border-white/5 pt-4">
              <button
                disabled={images.length === 0}
                onClick={handleBatchDownload}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:from-white/10 disabled:to-white/10 disabled:text-slate-500 text-black font-black text-sm uppercase rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-3 active:scale-95 duration-200 outline-none shadow-lg shadow-amber-500/20 disabled:shadow-none"
              >
                <Download className="w-4 h-4" />
                <span>{t.btn_download_zip || 'Download ZIP'}</span>
              </button>
            </div>
          </div>

          {/* ZONE 2: Middle interactive sandbox canvas (Col-span 5) */}
          <div className="lg:col-span-5 flex flex-col gap-4 bg-black/40 border border-white/5 p-6 rounded-2xl relative items-center justify-center overflow-hidden min-h-[350px] lg:min-h-0">
            {selectedImage ? (
              <div className="w-full h-full flex flex-col justify-between items-center relative">
                
                {/* Visual drag sandbox container */}
                <div
                  ref={previewContainerRef}
                  onMouseDown={handleDragStart}
                  onMouseMove={handleDragMove}
                  onMouseUp={handleDragEnd}
                  onMouseLeave={handleDragEnd}
                  onTouchStart={handleDragStart}
                  onTouchMove={handleDragMove}
                  onTouchEnd={handleDragEnd}
                  className={`max-w-full max-h-[450px] relative overflow-hidden bg-black/60 rounded-xl flex items-center justify-center ${
                    placementMode === 'custom' ? 'cursor-move' : ''
                  }`}
                >
                  <canvas
                    ref={previewCanvasRef}
                    className="max-w-full max-h-[450px] object-contain shadow-2xl rounded"
                  />
                  
                  {/* Absolute Drag Visual indicator overlay box */}
                  {placementMode === 'custom' && (
                    <div 
                      className="absolute w-8 h-8 rounded-full bg-amber-500/30 border-2 border-amber-500 flex items-center justify-center -translate-x-1/2 -translate-y-1/2 shadow-lg shadow-black/50 pointer-events-none"
                      style={{
                        left: `${customPos.x * 100}%`,
                        top: `${customPos.y * 100}%`
                      }}
                    >
                      <Move className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Current preview details */}
                <div className="w-full flex justify-between items-center mt-4 border-t border-white/5 pt-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <span className="truncate max-w-[200px]">{selectedImage.name}</span>
                  <span>{selectedImage.width}x{selectedImage.height}px</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8">
                <div 
                  onClick={triggerFileInput}
                  className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center hover:scale-105 active:scale-95 duration-300 shadow-xl group cursor-pointer mb-6"
                >
                  <Upload className="w-8 h-8 group-hover:rotate-6 transition-transform" />
                </div>
                <h4 className="text-lg font-black text-white uppercase tracking-wider mb-2">
                  No Image Loaded
                </h4>
                <p className="text-xs text-slate-500 max-w-xs font-medium leading-relaxed">
                  Drag and drop images here, or choose a file from the right panel to get started.
                </p>
              </div>
            )}
          </div>

          {/* ZONE 3: Right thumbnails list rack (Col-span 3) */}
          <div className="lg:col-span-3 flex flex-col gap-4 justify-between bg-black/20 p-6 rounded-2xl border border-white/5">
            <div className="flex flex-col gap-4 flex-1 overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  {t.label_images_count || 'Images'} ({images.length})
                </h4>
                {images.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-[10px] font-bold text-amber-500 hover:text-amber-400 bg-transparent border-none outline-none cursor-pointer uppercase tracking-wider"
                  >
                    {t.btn_clear || 'Clear'}
                  </button>
                )}
              </div>

              {/* Upload trigger hidden */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={onFileChange}
                accept="image/*"
                multiple
                className="hidden"
              />

              {/* Thumbnails list items scroll box */}
              {images.length > 0 ? (
                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 max-h-[350px] lg:max-h-[400px]">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      onClick={() => setSelectedImageId(img.id)}
                      className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                        selectedImageId === img.id
                          ? 'border-amber-500/60 bg-amber-500/5'
                          : 'border-white/10 hover:border-white/20 bg-black/20'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={img.dataUrl}
                          alt="Thumb"
                          className="w-10 h-10 object-cover rounded bg-black/40 border border-white/5"
                        />
                        <div className="min-w-0 flex flex-col gap-0.5 text-left">
                          <span className="text-[11px] font-bold text-white truncate max-w-[100px]">
                            {img.name}
                          </span>
                          <span className="text-[9px] text-slate-500 font-bold">
                            {img.width}x{img.height}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => deleteImage(img.id, e)}
                        className="p-1.5 hover:text-red-500 text-slate-500 transition-colors border-none bg-transparent outline-none cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 py-12 border-2 border-dashed border-white/10 rounded-xl bg-black/10">
                  <Tag className="w-6 h-6 text-slate-600 mb-2" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Rack Empty
                  </span>
                </div>
              )}
            </div>

            {/* Trigger input button */}
            <div className="border-t border-white/5 pt-4">
              <button
                onClick={triggerFileInput}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-white/10 outline-none"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.btn_add_files || 'Add Images'}</span>
              </button>
            </div>
          </div>

        </div>

        {/* BATCH EXPORT PROGRESS DIALOG OVERLAY */}
        {isCompiling && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#120d09] border border-amber-500/20 p-8 rounded-3xl shadow-2xl w-full max-w-md flex flex-col items-center text-center gap-6 relative">
              <div className="p-4 rounded-full bg-amber-500/10 text-amber-500 animate-pulse">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-black text-white uppercase tracking-wider">
                  Watermarking Batch...
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {t.progress_generating
                    ? t.progress_generating.replace('{current}', String(activeImageIdx + 1)).replace('{total}', String(images.length))
                    : `Processing image ${activeImageIdx + 1} of ${images.length}...`}
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full flex flex-col gap-2">
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300"
                    style={{ width: `${compileProgress}%` }}
                  />
                </div>
                <span className="text-[10px] text-amber-500 font-mono font-bold tracking-wider">
                  {compileProgress}% COMPLETE
                </span>
              </div>
            </div>
          </div>
        )}
      {/* Bloque AdSense Horizontal */}
      <AdBanner id="adsense-watermark-snap-bottom" />
      </main>

      {/* FOOTER & ACCORDION FAQ SECTIONS */}
      <Footer lang={lang} t={t} onOpenModal={handleOpenLegal} />

      {/* PRIVACY & COMPLIANCE MODALS */}
      <LegalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          modalType === 'privacy' 
            ? (legalTranslations[lang]?.privacy.title || 'Privacy Policy')
            : modalType === 'terms'
              ? (legalTranslations[lang]?.terms.title || 'Terms of Service')
              : (legalTranslations[lang]?.cookies.title || 'Cookie Policy')
        }
        content={
          modalType === 'privacy' 
            ? (legalTranslations[lang]?.privacy.content || '')
            : modalType === 'terms'
              ? (legalTranslations[lang]?.terms.content || '')
              : (legalTranslations[lang]?.cookies.content || '')
        }
        t={t}
      />
    </div>
  );
};

export default WatermarkSnap;
