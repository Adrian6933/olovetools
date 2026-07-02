import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AdBanner } from '../../components/shared/AdBanner';
import { LegalModal } from './components/LegalModal';
import { legalTranslations } from '../../locales/legal';
import { Palette, Upload, Copy, Check, RotateCcw, Image as ImageIcon, Pipette, Download } from 'lucide-react';

interface ColorsnapProps {
  lang: string;
  dictionary: any;
}

interface ColorSwatch {
  r: number;
  g: number;
  b: number;
}

const rgbToHex = (r: number, g: number, b: number) => {
  const toHex = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

const getLuminance = (r: number, g: number, b: number) => {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

const PALETTE_SIZE = 7;

export default function Colorsnap({ lang, dictionary }: ColorsnapProps) {
  const t = dictionary || {};
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [colors, setColors] = useState<ColorSwatch[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageElRef = useRef<HTMLImageElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const extractColors = useCallback((img: HTMLImageElement): ColorSwatch[] => {
    const maxDim = 220;
    const naturalW = img.naturalWidth || img.width || 1;
    const naturalH = img.naturalHeight || img.height || 1;
    const scale = Math.min(maxDim / naturalW, maxDim / naturalH, 1);
    const w = Math.max(1, Math.round(naturalW * scale));
    const h = Math.max(1, Math.round(naturalH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return [];

    ctx.drawImage(img, 0, 0, w, h);
    let data: Uint8ClampedArray;
    try {
      data = ctx.getImageData(0, 0, w, h).data;
    } catch {
      return [];
    }

    const quant = 24;
    const buckets = new Map<string, { r: number; g: number; b: number; count: number }>();

    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a < 125) continue;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const key = `${Math.floor(r / quant)}-${Math.floor(g / quant)}-${Math.floor(b / quant)}`;
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.r += r;
        bucket.g += g;
        bucket.b += b;
        bucket.count += 1;
      } else {
        buckets.set(key, { r, g, b, count: 1 });
      }
    }

    const sorted = [...buckets.values()].sort((a, b) => b.count - a.count);

    const result: ColorSwatch[] = [];
    for (const bucket of sorted) {
      const r = Math.round(bucket.r / bucket.count);
      const g = Math.round(bucket.g / bucket.count);
      const b = Math.round(bucket.b / bucket.count);
      const tooClose = result.some((c) => {
        const dr = c.r - r;
        const dg = c.g - g;
        const db = c.b - b;
        return Math.sqrt(dr * dr + dg * dg + db * db) < 38;
      });
      if (!tooClose) {
        result.push({ r, g, b });
        if (result.length >= PALETTE_SIZE) break;
      }
    }

    if (result.length < PALETTE_SIZE) {
      for (const bucket of sorted) {
        const r = Math.round(bucket.r / bucket.count);
        const g = Math.round(bucket.g / bucket.count);
        const b = Math.round(bucket.b / bucket.count);
        if (!result.some((c) => c.r === r && c.g === g && c.b === b)) {
          result.push({ r, g, b });
          if (result.length >= PALETTE_SIZE) break;
        }
      }
    }

    return result;
  }, []);

  const processImage = useCallback(
    (src: string) => {
      setIsExtracting(true);
      setExtractError(null);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const extracted = extractColors(img);
          setColors(extracted);
        } catch {
          setExtractError(t.extractError || 'Could not read pixel data from this image.');
        } finally {
          setIsExtracting(false);
        }
      };
      img.onerror = () => {
        setIsExtracting(false);
        setExtractError(t.loadError || 'Failed to load image.');
      };
      img.src = src;
    },
    [extractColors, t.extractError, t.loadError]
  );

  const addFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setImageSrc(url);
      setImageName(file.name);
      setColors([]);
      processImage(url);
    },
    [processImage]
  );

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) addFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) addFile(file);
    e.target.value = '';
  };

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const file = e.clipboardData?.files?.[0];
    if (file && file.type.startsWith('image/')) addFile(file);
  }, [addFile]);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const copyHex = (swatch: ColorSwatch, index: number) => {
    const hex = rgbToHex(swatch.r, swatch.g, swatch.b);
    navigator.clipboard.writeText(hex);
    setCopiedIndex(index);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopiedIndex(null), 1600);
  };

  const copyPaletteAsCss = () => {
    if (colors.length === 0) return;
    const css = colors
      .map((c, i) => `  --color-${i + 1}: ${rgbToHex(c.r, c.g, c.b)}; /* rgb(${c.r}, ${c.g}, ${c.b}) */`)
      .join('\n');
    const block = `:root {\n${css}\n}`;
    navigator.clipboard.writeText(block);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const downloadPalette = () => {
    if (colors.length === 0) return;
    const lines = colors
      .map((c, i) => `${i + 1}. ${rgbToHex(c.r, c.g, c.b)}  rgb(${c.r}, ${c.g}, ${c.b})`)
      .join('\n');
    const content = `Image Color Lab â€” Palette\nSource: ${imageName}\n\n${lines}\n\n:root {\n${colors
      .map((c, i) => `  --color-${i + 1}: ${rgbToHex(c.r, c.g, c.b)};`)
      .join('\n')}\n}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'palette.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetWorkspace = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setImageSrc(null);
    setImageName('');
    setColors([]);
    setIsExtracting(false);
    setCopiedIndex(null);
    setCopiedAll(false);
    setExtractError(null);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0204] text-slate-200 font-sans relative overflow-x-hidden pt-24">
      
      

      <Header
        currentLang={lang}
        onLanguageChange={(l) => (window.location.href = `/${l.toLowerCase()}/colorsnap`)}
        onReset={resetWorkspace}
        t={t}
      />

      <main className="flex-grow max-w-6xl w-full mx-auto px-4 md:px-12 py-8 relative z-10 flex flex-col space-y-10">
        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-colorsnap-top" />
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center md:justify-start gap-3">
            <Palette className="w-8 h-8 text-rose-400" />
            <span>{t.seoHeroTitle || 'Image Color Lab'}</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed">
            {t.seoHeroText || 'Upload an image and instantly extract its dominant colors as a reusable palette. Click any swatch to copy its HEX code.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            {!imageSrc ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`group relative border-2 border-dashed rounded-3xl p-12 md:p-20 flex flex-col items-center justify-center space-y-6 cursor-pointer transition-all shadow-xl shadow-black/30 ${
                  isDragging
                    ? 'border-rose-400 bg-rose-500/10 scale-[1.01]'
                    : 'border-rose-950 hover:border-rose-500/40 bg-[#120509]/40 hover:bg-[#16060c]/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInput}
                  accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
                  className="hidden"
                />
                <div className="relative">
                  <div className="absolute inset-0 bg-rose-500/10 blur-xl rounded-full scale-125 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-20 h-20 bg-[#160509] border border-white/5 rounded-2xl flex items-center justify-center text-rose-400 relative z-10 transition-transform group-hover:scale-105 group-hover:-translate-y-1 shadow-lg shadow-black/40">
                    <Upload className="w-10 h-10" />
                  </div>
                </div>
                <div className="space-y-2 text-center">
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {t.dropzonePrompt || 'Drop an image here or click to upload'}
                  </h3>
                  <p className="text-slate-500 text-sm font-medium">
                    {t.dropzoneSubtitle || 'PNG, JPG, WebP, GIF â€” processed locally in your browser'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl bg-[#120509]/60 border border-white/5 p-4 md:p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between gap-3 px-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <ImageIcon className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="text-sm font-bold text-white truncate">{imageName}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-bold px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t.changeImage || 'Change'}</span>
                    </button>
                    <button
                      onClick={resetWorkspace}
                      className="text-xs font-bold px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t.resetBtn || 'Reset'}</span>
                    </button>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInput}
                    accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
                    className="hidden"
                  />
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-white/5 bg-black/40 flex items-center justify-center min-h-[260px]">
                  <img
                    ref={imageElRef}
                    src={imageSrc}
                    alt={imageName}
                    className="max-h-[420px] w-full object-contain"
                  />

                  {isExtracting && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm space-y-3">
                      <div className="w-10 h-10 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin" />
                      <p className="text-xs font-bold text-rose-300 uppercase tracking-widest">
                        {t.extracting || 'Extracting colorsâ€¦'}
                      </p>
                    </div>
                  )}

                  {!isExtracting && colors.length > 0 && (
                    <div className="absolute inset-x-0 bottom-0 h-2 flex">
                      {colors.map((c, i) => (
                        <div
                          key={i}
                          className="flex-1 transition-all"
                          style={{ backgroundColor: rgbToHex(c.r, c.g, c.b) }}
                          title={rgbToHex(c.r, c.g, c.b)}
                        />
                      ))}
                    </div>
                  )}

                  {!isExtracting && colors.length > 0 && (
                    <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur border border-white/10 text-[10px] font-black text-rose-300 uppercase tracking-widest flex items-center gap-1.5">
                      <Pipette className="w-3 h-3" />
                      {colors.length} {t.colorsFound || 'colors'}
                    </div>
                  )}

                  {extractError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 space-y-2 p-6 text-center">
                      <p className="text-sm font-bold text-rose-400">{extractError}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl bg-[#120509]/60 border border-white/5 p-6 md:p-7 space-y-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center justify-between relative">
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Palette className="w-5 h-5 text-rose-400" />
                  <span>{t.paletteTitle || 'Extracted Palette'}</span>
                </h3>
                {colors.length > 0 && (
                  <span className="text-[10px] font-black text-rose-400/70 uppercase tracking-widest">
                    {colors.length}/{PALETTE_SIZE}
                  </span>
                )}
              </div>

              {colors.length === 0 && !isExtracting ? (
                <div className="py-10 text-center space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-rose-400/40">
                    <Pipette className="w-7 h-7" />
                  </div>
                  <p className="text-slate-500 text-sm font-medium">
                    {t.paletteEmpty || 'Upload an image to reveal its dominant colors.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 relative">
                  {colors.map((c, i) => {
                    const hex = rgbToHex(c.r, c.g, c.b);
                    const isLight = getLuminance(c.r, c.g, c.b) > 0.6;
                    const isCopied = copiedIndex === i;
                    return (
                      <button
                        key={i}
                        onClick={() => copyHex(c, i)}
                        className="group w-full flex items-stretch rounded-2xl overflow-hidden border border-white/5 hover:border-rose-500/40 transition-all hover:scale-[1.01] cursor-pointer text-left"
                        title={t.copyHint || 'Click to copy HEX'}
                      >
                        <div
                          className="w-20 sm:w-24 shrink-0 flex items-center justify-center relative"
                          style={{ backgroundColor: hex }}
                        >
                          <span
                            className={`text-[10px] font-black tracking-widest opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ${
                              isLight ? 'text-black/70' : 'text-white/90'
                            }`}
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </span>
                        </div>
                        <div className="flex-1 px-4 py-3 bg-white/[0.02] flex flex-col justify-center min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-base font-black text-white tracking-wide font-mono">{hex}</span>
                            <span
                              className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                                isCopied ? 'text-rose-400' : 'text-slate-600 group-hover:text-rose-400/70'
                              }`}
                            >
                              {isCopied ? (t.copied || 'Copied') : (t.copy || 'Copy')}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 font-mono mt-0.5">
                            rgb({c.r}, {c.g}, {c.b})
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {colors.length > 0 && (
                <div className="border-t border-white/5 pt-4 space-y-3 relative">
                  <button
                    onClick={copyPaletteAsCss}
                    className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-600/20 active:scale-95 cursor-pointer"
                  >
                    {copiedAll ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedAll ? (t.paletteCopied || 'Palette Copied!') : (t.copyPalette || 'Copy Palette as CSS')}</span>
                  </button>
                  <button
                    onClick={downloadPalette}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t.downloadPalette || 'Download Palette'}</span>
                  </button>
                </div>
              )}
            </div>

            {colors.length > 0 && (
              <div className="rounded-3xl bg-[#120509]/40 border border-white/5 p-5 space-y-3">
                <h4 className="text-xs font-black text-rose-400/80 uppercase tracking-widest flex items-center gap-2">
                  <Pipette className="w-3.5 h-3.5" />
                  {t.tipTitle || 'Quick Tip'}
                </h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {t.tipText || 'Click any swatch above to copy its HEX code. Use "Copy Palette as CSS" to grab all colors as ready-to-paste CSS custom properties.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {Array.isArray(t.faq) && t.faq.length > 0 && (
          <div className="pt-8 border-t border-white/5">
            <h2 className="text-white font-black text-2xl mb-6 tracking-tight text-center">{t.faqTitle || 'FAQ'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {t.faq.map((item: any, i: number) => (
                <div
                  key={i}
                  className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl hover:border-rose-500/20 transition-colors"
                >
                  <h4 className="text-white font-bold text-base mb-2">{item.question}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      {/* Bloque AdSense Horizontal */}
      <AdBanner id="adsense-colorsnap-bottom" />
      </main>

      <Footer
        lang={lang}
        t={t}
        onOpenModal={(modal) => setLegalModal(modal)}
      />

      <LegalModal
        isOpen={legalModal === 'privacy'}
        onClose={() => setLegalModal(null)}
        title={legalTranslations[lang]?.privacy.title || 'Privacy Policy'}
        content={legalTranslations[lang]?.privacy.content}
        t={t}
      />
      <LegalModal
        isOpen={legalModal === 'terms'}
        onClose={() => setLegalModal(null)}
        title={legalTranslations[lang]?.terms.title || 'Terms of Service'}
        content={legalTranslations[lang]?.terms.content}
        t={t}
      />
      <LegalModal
        isOpen={legalModal === 'cookies'}
        onClose={() => setLegalModal(null)}
        title={legalTranslations[lang]?.cookies.title || 'Cookie Policy'}
        content={legalTranslations[lang]?.cookies.content}
        t={t}
      />
    </div>
  );
}
