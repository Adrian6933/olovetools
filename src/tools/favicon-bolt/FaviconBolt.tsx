import React, { useState, useEffect, useRef } from 'react';
import { Palette, Download, Upload, Info, RefreshCw, Layers, Compass, Smartphone, Globe } from 'lucide-react';
import { useTranslation, Language } from '../../locales/dictionary';
import { AdBanner } from '../../components/shared/AdBanner';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { legalTranslations } from '../../locales/legal';
import JSZip from 'jszip';

interface FaviconBoltProps {
  lang: string;
  dictionary: any;
}

export const FaviconBolt: React.FC<FaviconBoltProps> = ({ lang, dictionary }) => {
  const { t } = useTranslation(lang as Language, 'favicon-bolt');

  // Parameters
  const [mode, setMode] = useState<'image' | 'emoji'>('emoji');
  const [emoji, setEmoji] = useState<string>('⚡');
  const [bgShape, setBgShape] = useState<'none' | 'circle' | 'square' | 'squircle'>('squircle');
  const [bgColor, setBgColor] = useState<string>('#3b82f6');
  const [padding, setPadding] = useState<number>(15); // Percentage padding
  const [borderWidth, setBorderWidth] = useState<number>(0);
  const [borderColor, setBorderColor] = useState<string>('#ffffff');
  const [fontFamily, setFontFamily] = useState<string>('sans-serif');
  const [fontScale, setFontScale] = useState<number>(65); // Font size percentage of icon size

  // Image source state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageImgEl, setImageImgEl] = useState<HTMLImageElement | null>(null);

  // Exporter progress
  const [isCompiling, setIsCompiling] = useState<boolean>(false);

  // Modals
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'privacy' | 'terms' | 'cookies'>('privacy');

  // Refs
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load image file helper
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      const img = new Image();
      img.onload = () => {
        setImageImgEl(img);
      };
      img.src = url;
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setImageImgEl(null);
    }
  }, [imageFile]);

  // Squircle drawing path utility
  const drawSquircle = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  // Render favicon on any canvas size
  const renderFaviconFrame = (
    canvas: HTMLCanvasElement,
    size: number,
    options: {
      mode: 'image' | 'emoji';
      emoji: string;
      bgShape: 'none' | 'circle' | 'square' | 'squircle';
      bgColor: string;
      padding: number;
      borderWidth: number;
      borderColor: string;
      fontFamily: string;
      fontScale: number;
      imageImgEl: HTMLImageElement | null;
    }
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = size;
    canvas.height = size;
    ctx.clearRect(0, 0, size, size);

    // Apply Background Shape
    if (options.bgShape !== 'none') {
      ctx.save();
      ctx.fillStyle = options.bgColor;
      
      const strokeW = (options.borderWidth / 100) * size;
      const innerSize = size - strokeW;
      const offset = strokeW / 2;

      // Draw background fills
      if (options.bgShape === 'circle') {
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, innerSize / 2, 0, Math.PI * 2);
        ctx.fill();
        if (strokeW > 0) {
          ctx.lineWidth = strokeW;
          ctx.strokeStyle = options.borderColor;
          ctx.stroke();
        }
      } else if (options.bgShape === 'square') {
        ctx.fillRect(offset, offset, innerSize, innerSize);
        if (strokeW > 0) {
          ctx.lineWidth = strokeW;
          ctx.strokeStyle = options.borderColor;
          ctx.strokeRect(offset, offset, innerSize, innerSize);
        }
      } else if (options.bgShape === 'squircle') {
        const radius = innerSize * 0.22; // Squircle golden corner ratio
        drawSquircle(ctx, offset, offset, innerSize, innerSize, radius);
        ctx.fill();
        if (strokeW > 0) {
          ctx.lineWidth = strokeW;
          ctx.strokeStyle = options.borderColor;
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // Apply Content (Image vs Emoji)
    const contentPadding = (options.padding / 100) * size;
    const contentSize = size - contentPadding * 2;

    if (options.mode === 'emoji') {
      ctx.save();
      const actualFontSize = (options.fontScale / 100) * contentSize;
      ctx.font = `${actualFontSize}px ${options.fontFamily}, sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      
      // Vertical adjustment for center alignment depending on OS font baseline shifts
      const vertOffset = size * 0.02;
      ctx.fillText(options.emoji || '⚡', size / 2, size / 2 + vertOffset);
      ctx.restore();
    } else if (options.mode === 'image' && options.imageImgEl) {
      ctx.save();
      
      // Proportional scale sizing
      let drawW = contentSize;
      let drawH = contentSize;
      const ratio = options.imageImgEl.width / options.imageImgEl.height;
      if (ratio > 1) {
        drawH = contentSize / ratio;
      } else {
        drawW = contentSize * ratio;
      }

      const drawX = (size - drawW) / 2;
      const drawY = (size - drawH) / 2;

      // Crop clipping inside bg shape if transparent is disabled
      if (options.bgShape === 'circle') {
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.clip();
      } else if (options.bgShape === 'squircle') {
        drawSquircle(ctx, 0, 0, size, size, size * 0.22);
        ctx.clip();
      }

      ctx.drawImage(options.imageImgEl, drawX, drawY, drawW, drawH);
      ctx.restore();
    }
  };

  // Keep preview canvas updated live
  useEffect(() => {
    if (!previewCanvasRef.current) return;
    renderFaviconFrame(previewCanvasRef.current, 256, {
      mode,
      emoji,
      bgShape,
      bgColor,
      padding,
      borderWidth,
      borderColor,
      fontFamily,
      fontScale,
      imageImgEl
    });
  }, [
    mode,
    emoji,
    bgShape,
    bgColor,
    padding,
    borderWidth,
    borderColor,
    fontFamily,
    fontScale,
    imageImgEl
  ]);

  // Binary multi-frame ICO file pack generator
  const createIcoFromPngs = async (pngBlobs: Blob[]): Promise<Blob> => {
    const headersSize = 6;
    const dirSize = 16;
    const dirCount = pngBlobs.length;
    const headerAndDirsSize = headersSize + dirSize * dirCount;
    
    const arrayBuffers = await Promise.all(pngBlobs.map(b => b.arrayBuffer()));
    
    let totalSize = headerAndDirsSize;
    arrayBuffers.forEach(ab => {
      totalSize += ab.byteLength;
    });
    
    const outBuffer = new Uint8Array(totalSize);
    const view = new DataView(outBuffer.buffer);
    
    // Header
    view.setUint16(0, 0, true); // Reserved
    view.setUint16(2, 1, true); // Type (1 = ICO)
    view.setUint16(4, dirCount, true); // Number of images
    
    let currentOffset = headerAndDirsSize;
    const sizes = [16, 32, 48]; // sizes mapped to indices
    
    for (let i = 0; i < dirCount; i++) {
      const ab = arrayBuffers[i];
      const size = sizes[i];
      const dirOffset = headersSize + i * dirSize;
      
      view.setUint8(dirOffset + 0, size === 256 ? 0 : size); // Width
      view.setUint8(dirOffset + 1, size === 256 ? 0 : size); // Height
      view.setUint8(dirOffset + 2, 0); // Color count (0 = >256 colors)
      view.setUint8(dirOffset + 3, 0); // Reserved
      view.setUint16(dirOffset + 4, 1, true); // Color planes
      view.setUint16(dirOffset + 6, 32, true); // Bits per pixel
      view.setUint32(dirOffset + 8, ab.byteLength, true); // Size of image data
      view.setUint32(dirOffset + 12, currentOffset, true); // Offset of image data
      
      outBuffer.set(new Uint8Array(ab), currentOffset);
      currentOffset += ab.byteLength;
    }
    
    return new Blob([outBuffer], { type: 'image/x-icon' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setMode('image');
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  // ZIP packaging and trigger download
  const handleZipDownload = async () => {
    setIsCompiling(true);
    const zip = new JSZip();
    const tempCanvas = document.createElement('canvas');

    const drawFrameAndGetBlob = (size: number): Promise<Blob> => {
      renderFaviconFrame(tempCanvas, size, {
        mode,
        emoji,
        bgShape,
        bgColor,
        padding,
        borderWidth,
        borderColor,
        fontFamily,
        fontScale,
        imageImgEl
      });
      return new Promise<Blob>((resolve) => {
        tempCanvas.toBlob((blob) => resolve(blob || new Blob()), 'image/png');
      });
    };

    try {
      // 1. Generate individual PNG sizes
      const pngSizes = [
        { name: 'favicon-16x16.png', size: 16 },
        { name: 'favicon-32x32.png', size: 32 },
        { name: 'apple-touch-icon.png', size: 180 },
        { name: 'android-chrome-192x192.png', size: 192 },
        { name: 'android-chrome-512x512.png', size: 512 }
      ];

      const pngBlobs: Blob[] = [];

      for (const item of pngSizes) {
        const blob = await drawFrameAndGetBlob(item.size);
        zip.file(item.name, blob);
      }

      // 2. Generate ICO frame assets (16x16, 32x32, 48x48)
      const icoFrameSizes = [16, 32, 48];
      const icoBlobs: Blob[] = [];
      for (const size of icoFrameSizes) {
        const blob = await drawFrameAndGetBlob(size);
        icoBlobs.push(blob);
      }

      // 3. Compile Binary ICO file
      const icoBlob = await createIcoFromPngs(icoBlobs);
      zip.file('favicon.ico', icoBlob);

      // 4. Generate site.webmanifest JSON metadata
      const manifest = {
        name: t.title || 'FaviconBolt',
        short_name: t.title || 'FaviconBolt',
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        theme_color: bgColor,
        background_color: '#030712',
        display: 'standalone'
      };
      zip.file('site.webmanifest', JSON.stringify(manifest, null, 2));

      // 5. Build ZIP and trigger download
      const zipContent = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipContent);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `favicon-bolt-pack.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
    } catch (err) {
      console.error('ICO/ZIP Compile failure:', err);
      alert('Failed to compile files.');
    } finally {
      setIsCompiling(false);
    }
  };

  const resetAll = () => {
    setImageFile(null);
    setImageImgEl(null);
    setEmoji('⚡');
    setMode('emoji');
    setBgColor('#3b82f6');
    setBgShape('squircle');
    setPadding(15);
    setBorderWidth(0);
  };

  const handleOpenLegal = (type: 'privacy' | 'terms' | 'cookies') => {
    setModalType(type);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 font-sans flex flex-col">
      <Header
        currentLang={lang}
        onLanguageChange={(newLang) => {
          window.location.href = `/${newLang.toLowerCase()}/favicon-bolt`;
        }}
        onReset={resetAll}
        t={t}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-12 pt-36 pb-24 relative z-10 flex flex-col justify-center">
        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-favicon-bolt-top" />
        {/* Title SEO Hero */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-4xl md:text-6xl font-black font-outfit tracking-tight text-white mb-4">
            {t.seoHeroTitle || 'Generate Professional Favicons Offline'}
          </h1>
          <p className="text-slate-400 text-lg max-w-3xl mx-auto leading-relaxed font-medium">
            {t.seoHeroText || 'Convert images or emojis into valid multi-frame ICO files and touch assets.'}
          </p>
        </div>

        {/* 3-Column Creator Workspace Dashboard */}
        <div className="w-full bg-[#0a0f1d]/40 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 md:p-8 shadow-2xl relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch glow-indigo">
          
          {/* COLUMN 1: Customizations (Col-span 4) */}
          <div className="lg:col-span-4 flex flex-col gap-6 bg-black/20 p-6 rounded-2xl border border-white/5 justify-between">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-blue-500 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  {t.title || 'FaviconBolt'}
                </h3>
              </div>

              {/* Mode switch */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
                <button
                  onClick={() => setMode('emoji')}
                  className={`py-2 px-3 text-xs font-black uppercase rounded-lg transition-all cursor-pointer border-none outline-none ${
                    mode === 'emoji'
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t.label_mode_emoji || 'Emoji Icon'}
                </button>
                <button
                  onClick={() => setMode('image')}
                  className={`py-2 px-3 text-xs font-black uppercase rounded-lg transition-all cursor-pointer border-none outline-none ${
                    mode === 'image'
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t.label_mode_image || 'Image File'}
                </button>
              </div>

              {/* Mode specific controls */}
              {mode === 'emoji' ? (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {t.label_emoji_input || 'Type Emoji'}
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={emoji}
                      onChange={(e) => setEmoji(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-center text-2xl focus:border-blue-500 outline-none transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Font Family
                    </label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none cursor-pointer"
                    >
                      <option value="sans-serif">System Sans</option>
                      <option value="serif">System Serif</option>
                      <option value="monospace">System Mono</option>
                      <option value="'Segoe UI Emoji'">Segoe UI (Windows)</option>
                      <option value="'Apple Color Emoji'">Apple Emoji</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <span>Font Size Scaling</span>
                      <span className="text-blue-500 font-mono">{fontScale}%</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="95"
                      value={fontScale}
                      onChange={(e) => setFontScale(parseInt(e.target.value))}
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {t.label_image_file || 'Select Image File'}
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <div
                      onClick={triggerFileInput}
                      className="border-2 border-dashed border-white/15 hover:border-blue-500/50 bg-black/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-black/40 group text-center"
                    >
                      {imageFile ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <img
                            src={imageImgEl?.src || ''}
                            alt="Logo preview"
                            className="w-12 h-12 object-contain rounded bg-white/5 border border-white/10 p-1"
                          />
                          <span className="text-xs font-bold text-white truncate max-w-[200px]">
                            {imageFile.name}
                          </span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Upload PNG / SVG
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Background Shape & Border styling configs */}
              <div className="flex flex-col gap-4 border-t border-white/5 pt-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {t.label_bg_shape || 'Background Shape'}
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    {[
                      { key: 'none', label: t.shape_none || 'None' },
                      { key: 'circle', label: t.shape_circle || 'Circle' },
                      { key: 'square', label: t.shape_square || 'Square' },
                      { key: 'squircle', label: t.shape_squircle || 'Squircle' }
                    ].map((s) => (
                      <button
                        key={s.key}
                        onClick={() => setBgShape(s.key as any)}
                        className={`py-2 font-bold uppercase border rounded-lg transition-all cursor-pointer outline-none ${
                          bgShape === s.key
                            ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                            : 'border-white/10 hover:border-white/20 text-slate-300'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {bgShape !== 'none' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {t.label_bg_color || 'Background Color'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-10 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer p-0"
                      />
                      <input
                        type="text"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white uppercase outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Border width for outline */}
                {bgShape !== 'none' && (
                  <div className="flex flex-col gap-4 border-t border-white/5 pt-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <span>{t.label_border_width || 'Border Width'}</span>
                        <span className="text-blue-500 font-mono">{borderWidth}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="15"
                        value={borderWidth}
                        onChange={(e) => setBorderWidth(parseInt(e.target.value))}
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                    </div>

                    {borderWidth > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          {t.label_border_color || 'Border Color'}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={borderColor}
                            onChange={(e) => setBorderColor(e.target.value)}
                            className="w-10 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer p-0"
                          />
                          <input
                            type="text"
                            value={borderColor}
                            onChange={(e) => setBorderColor(e.target.value)}
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white uppercase outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Padding slider */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <span>{t.label_padding || 'Icon Padding'}</span>
                    <span className="text-blue-500 font-mono">{padding}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="45"
                    value={padding}
                    onChange={(e) => setPadding(parseInt(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* DOWNLOAD TRIGGER */}
            <div className="border-t border-white/5 pt-4">
              <button
                onClick={handleZipDownload}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black text-sm uppercase rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-3 active:scale-95 duration-200 outline-none shadow-lg shadow-blue-500/20"
              >
                <Download className="w-4 h-4" />
                <span>{t.btn_download_zip || 'Download ZIP'}</span>
              </button>
            </div>
          </div>

          {/* COLUMN 2: Previews (Col-span 5) */}
          <div className="lg:col-span-5 flex flex-col gap-6 bg-black/40 border border-white/5 p-6 rounded-2xl justify-between overflow-hidden">
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b border-white/5 pb-2">
                {t.preview_title || 'Favicon Context Previews'}
              </h3>

              {/* Canvas (256x256 Base) hidden behind but shown scaled */}
              <div className="flex items-center justify-center p-6 bg-black/60 rounded-xl border border-white/5">
                <canvas
                  ref={previewCanvasRef}
                  className="w-32 h-32 object-contain shadow-2xl rounded-xl"
                />
              </div>

              {/* REAL WORLD CONTEXT PREVIEWS */}
              <div className="flex flex-col gap-4">
                
                {/* 1. Browser Tab Mockup */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-blue-500" />
                    {t.preview_tab || 'Browser Tab'}
                  </span>
                  <div className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 flex items-center gap-2 text-xs text-slate-300 font-medium select-none shadow-md">
                    <div className="w-4 h-4 shrink-0 flex items-center justify-center bg-black/20 rounded">
                      <canvas
                        ref={(c) => {
                          if (c) {
                            renderFaviconFrame(c, 32, {
                              mode,
                              emoji,
                              bgShape,
                              bgColor,
                              padding,
                              borderWidth,
                              borderColor,
                              fontFamily,
                              fontScale,
                              imageImgEl
                            });
                          }
                        }}
                        className="w-3.5 h-3.5 object-contain"
                      />
                    </div>
                    <span className="truncate">oLoveTools | {t.title}</span>
                    <span className="ml-auto text-[10px] text-slate-600 font-bold">✕</span>
                  </div>
                </div>

                {/* 2. Google Search Result Mockup */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-blue-500" />
                    {t.preview_search || 'Google Search'}
                  </span>
                  <div className="w-full bg-slate-950 border border-white/10 rounded-lg p-3 flex flex-col gap-1 text-xs select-none shadow-md">
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      <div className="w-4.5 h-4.5 bg-black/40 rounded-full flex items-center justify-center border border-white/5">
                        <canvas
                          ref={(c) => {
                            if (c) {
                              renderFaviconFrame(c, 32, {
                                mode,
                                emoji,
                                bgShape,
                                bgColor,
                                padding,
                                borderWidth,
                                borderColor,
                                fontFamily,
                                fontScale,
                                imageImgEl
                              });
                            }
                          }}
                          className="w-3 h-3 object-contain"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-white text-xs leading-none">oLoveTools</span>
                        <span className="text-[9px] text-slate-500 leading-none">https://olovetools.com › {lang} › favicon</span>
                      </div>
                    </div>
                    <span className="text-blue-400 font-semibold text-sm leading-tight hover:underline cursor-pointer">
                      FaviconBolt | {t.seo_title || 'Favicon Generator'}
                    </span>
                  </div>
                </div>

                {/* 3. Mobile Smartphone Home Overlay Mockup */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                    {t.preview_mobile || 'Mobile Home Screen'}
                  </span>
                  <div className="w-full bg-slate-950 border border-white/10 rounded-lg p-4 flex items-center justify-center gap-6 select-none shadow-md relative min-h-[90px] overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/20 to-blue-900/10 opacity-30 pointer-events-none" />
                    <div className="flex flex-col items-center gap-1.5 relative z-10">
                      <div className="w-12 h-12 bg-black/25 rounded-xl border border-white/10 p-1.5 flex items-center justify-center shadow-lg">
                        <canvas
                          ref={(c) => {
                            if (c) {
                              renderFaviconFrame(c, 192, {
                                mode,
                                emoji,
                                bgShape,
                                bgColor,
                                padding,
                                borderWidth,
                                borderColor,
                                fontFamily,
                                fontScale,
                                imageImgEl
                              });
                            }
                          }}
                          className="w-full h-full object-contain rounded-lg"
                        />
                      </div>
                      <span className="text-[9px] text-slate-400 font-bold leading-none uppercase tracking-wide">
                        {t.title}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* COLUMN 3: Outputs List (Col-span 3) */}
          <div className="lg:col-span-3 flex flex-col gap-4 bg-black/20 p-6 rounded-2xl border border-white/5">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b border-white/5 pb-2">
              {t.label_output_files || 'Assets List'}
            </h3>
            
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 max-h-[350px] lg:max-h-[400px]">
              {[
                { name: 'favicon.ico', detail: '16x16, 32x32, 48x48 Multi-frame' },
                { name: 'favicon-16x16.png', detail: '16x16 standard PNG' },
                { name: 'favicon-32x32.png', detail: '32x32 standard PNG' },
                { name: 'apple-touch-icon.png', detail: '180x180 mobile WebKit format' },
                { name: 'android-chrome-192x192.png', detail: '192x192 Android launcher' },
                { name: 'android-chrome-512x512.png', detail: '512x512 Android splash' },
                { name: 'site.webmanifest', detail: 'Web App manifest configurations' }
              ].map((item) => (
                <div key={item.name} className="flex items-center gap-3 p-2.5 rounded-xl border border-white/5 bg-black/30 text-left">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex flex-col gap-0.5">
                    <span className="text-[11px] font-bold text-white font-mono truncate">
                      {item.name}
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold">
                      {item.detail}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Compile dialog indicator */}
            {isCompiling && (
              <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-[#0b0f1d] border border-blue-500/20 p-8 rounded-3xl shadow-2xl w-full max-w-sm flex flex-col items-center text-center gap-4">
                  <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-black text-white uppercase tracking-wider">
                      Compiling assets...
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      {t.progress_generating || 'Writing binary ICO header & offsets...'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      {/* Bloque AdSense Horizontal */}
      <AdBanner id="adsense-favicon-bolt-bottom" />
      </main>

      {/* FOOTER & MOCK FAQS */}
      <Footer lang={lang} t={t} onOpenModal={handleOpenLegal} />

      {/* PRIVACY MODAL OVERLAYS */}
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

export default FaviconBolt;
