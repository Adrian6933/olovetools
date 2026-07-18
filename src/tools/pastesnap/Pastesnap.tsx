import React, { useState, useEffect, useCallback, useRef } from 'react';
import JSZip from 'jszip';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardPaste,
  Upload,
  Download,
  Copy,
  Check,
  Trash2,
  Maximize2,
  X,
  ArrowRight,
  Package,
  Loader2,
  ArrowUp,
  ChevronDown,
} from 'lucide-react';
import { Header } from './components/Header';
import { LegalModal } from './components/LegalModal';
import { PastedImage } from './types';
import type { Language } from '../../locales/meta';
import { legalTranslations } from '../../locales/legal';
import { AdBanner } from '../../components/shared/AdBanner';

interface PastesnapProps {
  lang: Language;
  dictionary?: any;
}

const Pastesnap: React.FC<PastesnapProps> = ({ lang, dictionary }) => {
  const t = dictionary || {};
  const [images, setImages] = useState<PastedImage[]>([]);
  const [expandedImage, setExpandedImage] = useState<PastedImage | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formatMenuId, setFormatMenuId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const lastClipboardId = useRef<string | null>(null);
  const dragDepth = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fallback micro-labels (use dictionary when available, English default otherwise)
  const L = {
    select: t.selectImage || 'Select image',
    drop: t.dropPrompt || 'Drag & drop, paste or select an image',
    copy: t.copyBtn || 'Copy',
    copied: t.copiedBtn || 'Copied!',
    paste: t.pasteBtn || 'Paste',
    moreFormats: t.moreFormats || 'Download as…',
    dropHere: t.dropHere || 'Drop images to add them',
  };

  const handleLanguageChange = (newLang: string) => {
    window.location.href = `/${newLang.toLowerCase()}/pastesnap`;
  };

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    const ext = (file.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
    const newImg: PastedImage = {
      id: Math.random().toString(36).substring(2, 11),
      url,
      blob: file,
      name: `pastesnap-${Date.now()}.${ext}`,
      timestamp: new Date(),
      size: file.size,
      type: file.type,
    };
    const probe = new Image();
    probe.onload = () => {
      setImages((prev) =>
        prev.map((i) =>
          i.id === newImg.id ? { ...i, width: probe.naturalWidth, height: probe.naturalHeight } : i
        )
      );
    };
    probe.src = url;
    setImages((prev) => {
      if (prev.length === 0 && typeof window !== 'undefined') {
        window.history.pushState({ view: 'gallery' }, '');
      }
      return [...prev, newImg];
    });
  }, []);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      Array.from(files).forEach((file) => {
        if (file.type.startsWith('image/')) processFile(file);
      });
    },
    [processFile]
  );

  // Click-to-read from clipboard (Clipboard API)
  const handlePasteClick = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) return;
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageTypes = item.types.filter((type) => type.startsWith('image/'));
        if (imageTypes.length > 0) {
          const blob = await item.getType(imageTypes[0]);
          processFile(new File([blob], 'clipboard-image.png', { type: blob.type }));
          return;
        }
      }
    } catch {
      /* no readable image in clipboard or permission denied */
    }
  };

  const tryAutoPaste = useCallback(async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) return;
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageTypes = item.types.filter((type) => type.startsWith('image/'));
        if (imageTypes.length > 0) {
          const blob = await item.getType(imageTypes[0]);
          const clipboardId = `${blob.size}-${blob.type}`;
          if (lastClipboardId.current === clipboardId) continue;
          lastClipboardId.current = clipboardId;
          processFile(new File([blob], 'clipboard-image.png', { type: blob.type }));
        }
      }
    } catch {
      /* auto-paste suppressed when permission is not granted */
    }
  }, [processFile]);

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) processFile(blob);
        }
      }
    },
    [processFile]
  );

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    const onFocus = () => {
      setIsFocused(true);
      tryAutoPaste();
    };
    const onBlur = () => setIsFocused(false);
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    window.addEventListener('scroll', handleScroll);
    tryAutoPaste();
    return () => {
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handlePaste, tryAutoPaste]);

  // Browser back button: close expanded view first, then clear gallery
  useEffect(() => {
    const handlePopState = () => {
      if (expandedImage) {
        setExpandedImage(null);
        return;
      }
      if (images.length > 0) resetApp();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images, expandedImage]);

  useEffect(() => {
    if (images.length > 0) window.scrollTo(0, 0);
  }, [images.length > 0]);

  // Escape closes lightbox / format menu; any click closes the format menu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFormatMenuId(null);
        setExpandedImage(null);
      }
    };
    const onClick = () => setFormatMenuId(null);
    window.addEventListener('keydown', onKey);
    window.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('click', onClick);
    };
  }, []);

  // Global drag & drop: works in both empty state and gallery view,
  // and prevents the browser from navigating away when a file is dropped
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragDepth.current += 1;
    if (e.dataTransfer.types?.includes('Files')) setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDragging(false);
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = '';
  };

  const downloadImage = (img: PastedImage) => {
    const link = document.createElement('a');
    link.href = img.url;
    link.download = img.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Draw a blob onto a canvas to re-encode it in another format
  const reencodeBlob = async (
    blob: Blob,
    mime: 'image/png' | 'image/jpeg' | 'image/webp'
  ): Promise<Blob> => {
    if (blob.type === mime) return blob;
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d')!;
    if (mime === 'image/jpeg') {
      // JPEG has no alpha channel: flatten transparency onto white
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    return new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), mime, 0.92)
    );
  };

  // Chromium only accepts image/png in clipboard.write — re-encode other formats first
  const copyImage = async (img: PastedImage) => {
    try {
      const pngBlob = await reencodeBlob(img.blob, 'image/png');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
      setCopiedId(img.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* clipboard write not supported in this browser */
    }
  };

  const downloadImageAs = async (img: PastedImage, format: 'png' | 'jpeg' | 'webp') => {
    setFormatMenuId(null);
    try {
      const blob = await reencodeBlob(img.blob, `image/${format}` as const);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = img.name.replace(/\.[a-z0-9]+$/i, '') + '.' + format.replace('jpeg', 'jpg');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      /* conversion failed — fall back to original download */
      downloadImage(img);
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const downloadAllImages = async () => {
    if (isZipping) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      for (let i = 0; i < images.length; i++) {
        const response = await fetch(images[i].url);
        const blob = await response.blob();
        zip.file(`${i + 1}_${images[i].name}`, blob);
      }
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = 'pastesnap-images.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } finally {
      setIsZipping(false);
    }
  };

  const convertInFormatFlow = async () => {
    try {
      const dataToTransfer = await Promise.all(
        images.map(async (img) => {
          const response = await fetch(img.url);
          const blob = await response.blob();
          return new Promise<{ name: string; type: string; data: string }>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () =>
              resolve({ name: img.name, type: blob.type, data: reader.result as string });
            reader.readAsDataURL(blob);
          });
        })
      );
      localStorage.setItem('pastesnap_transfer', JSON.stringify(dataToTransfer));
    } catch {
      /* transfer skipped */
    } finally {
      window.location.href = `/${lang.toLowerCase()}/formatflow`;
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((img) => img.id !== id);
    });
  };

  const resetApp = () => {
    images.forEach((img) => URL.revokeObjectURL(img.url));
    setImages([]);
    setExpandedImage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      className="min-h-screen flex flex-col bg-[#04050a] text-gray-100 selection:bg-indigo-500/30 overflow-x-hidden"
    >
      {/* Global drop overlay (visible when dragging over the gallery view) */}
      <AnimatePresence>
        {isDragging && images.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[190] pointer-events-none flex items-center justify-center bg-indigo-950/60 backdrop-blur-sm"
          >
            <div className="px-10 py-8 rounded-3xl border-2 border-dashed border-indigo-400 bg-[#04050a]/80 text-center">
              <ClipboardPaste className="w-10 h-10 text-indigo-300 mx-auto mb-4" strokeWidth={1.5} />
              <p className="text-xl font-black text-white">{L.dropHere}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-600/10 blur-[150px] rounded-full animate-fast-pulse"></div>
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-pink-600/10 blur-[150px] rounded-full animate-fast-pulse"
          style={{ animationDelay: '4s' }}
        ></div>
      </div>

      <Header currentLang={lang || 'en'} onLanguageChange={handleLanguageChange} onReset={resetApp} t={t} />

      <main className="flex-1 flex flex-col items-center pt-32 md:pt-36 pb-24 px-4 md:px-8 relative z-10 w-full">
        <div className="max-w-5xl w-full space-y-12 md:space-y-16">
          {/* ---------- Uniform clean header: badge + H1 (SEO keyword) + 2-line description ---------- */}
          <header className="flex flex-col items-center text-center space-y-5 pt-4">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-bold tracking-[0.2em] uppercase">
              <span className="relative flex h-2 w-2">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full ${
                    isFocused ? 'bg-indigo-400 animate-ping' : ''
                  } opacity-75`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isFocused ? 'bg-indigo-500' : 'bg-gray-600'
                  }`}
                ></span>
              </span>
              {isFocused ? t.autoPasteActive : t.windowInactive}
            </span>

            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[1.05]">
              {t.title}
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">
                {t.onlineClipboardUtility}
              </span>
            </h1>

            <p className="text-gray-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
              {t.description}
            </p>
          </header>

          {/* Bloque AdSense Horizontal — debajo del header */}
          <AdBanner id="adsense-pastesnap-top" />

          {/* ---------- Workspace ---------- */}
          <section id="workspace" aria-label={t.title}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileInput}
              className="hidden"
            />

            {images.length === 0 ? (
              /* Empty state: minimal modern drop zone (drop handled globally on the root) */
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`group relative rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer px-8 py-20 md:py-28 flex flex-col items-center justify-center text-center
                  ${
                    isDragging
                      ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
                      : 'border-white/10 bg-white/[0.015] hover:border-indigo-500/40 hover:bg-white/[0.03]'
                  }`}
              >
                <div
                  className={`w-20 h-20 md:w-24 md:h-24 rounded-3xl flex items-center justify-center mb-8 transition-all duration-300 ${
                    isDragging ? 'bg-indigo-500/20 text-indigo-300 scale-110' : 'bg-white/5 text-indigo-400'
                  }`}
                >
                  <ClipboardPaste className="w-9 h-9 md:w-11 md:h-11" strokeWidth={1.5} />
                </div>

                <div className="hidden md:flex items-center gap-2 mb-5" aria-hidden="true">
                  <kbd className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-gray-100 text-base font-black shadow-[0_3px_0_rgba(255,255,255,0.12)]">
                    Ctrl
                  </kbd>
                  <span className="text-gray-500 font-black text-lg">+</span>
                  <kbd className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-gray-100 text-base font-black shadow-[0_3px_0_rgba(255,255,255,0.12)]">
                    V
                  </kbd>
                </div>
                <p className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
                  {t.pastePrompt}
                </p>
                <p className="text-gray-500 text-sm md:text-base font-medium mb-8">{L.drop}</p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePasteClick();
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all active:scale-95 shadow-lg shadow-indigo-600/30 cursor-pointer"
                  >
                    <ClipboardPaste className="w-4 h-4" /> {L.paste}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 font-bold text-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" /> {L.select}
                  </button>
                </div>

                <p className="mt-6 text-[11px] text-gray-600 font-bold uppercase tracking-[0.3em]">
                  {t.waitingForImage}
                </p>
              </div>
            ) : (
              /* Gallery */
              <div className="space-y-10">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <h2 className="text-2xl md:text-3xl font-black text-white">
                    {t.imagesInCollection} <span className="text-indigo-400">({images.length})</span>
                  </h2>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 font-bold text-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" /> {t.pasteMore}
                  </button>
                </div>

                <div className={`grid gap-6 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                  <AnimatePresence>
                    {images.map((img) => (
                      <motion.div
                        key={img.id}
                        initial={{ opacity: 0, scale: 0.95, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="group glass-card rounded-3xl p-5 flex flex-col gap-5"
                      >
                        <div className="relative aspect-video flex items-center justify-center overflow-hidden rounded-2xl bg-black/50 ring-1 ring-white/5">
                          <img
                            src={img.url}
                            alt={`${t.title} — ${img.timestamp.toLocaleTimeString()}`}
                            loading="lazy"
                            className="max-h-full max-w-full object-contain"
                          />
                          <div className="absolute top-3 right-3 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setExpandedImage(img);
                                if (typeof window !== 'undefined')
                                  window.history.pushState({ view: 'expanded' }, '');
                              }}
                              aria-label="Expand"
                              className="p-2.5 bg-white/10 hover:bg-white hover:text-black text-white rounded-xl backdrop-blur-xl border border-white/20 transition-all active:scale-90 cursor-pointer"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeImage(img.id)}
                              aria-label="Remove"
                              className="p-2.5 bg-red-500/20 hover:bg-red-500 text-white rounded-xl backdrop-blur-xl border border-red-500/40 transition-all active:scale-90 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="text-left">
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.25em] mb-1">
                              {t.pastedAt}
                            </p>
                            <p className="text-white font-bold text-lg leading-tight">
                              {img.timestamp.toLocaleTimeString()}
                            </p>
                            <p className="text-gray-500 text-xs font-semibold mt-1">
                              {img.width && img.height ? `${img.width}×${img.height} · ` : ''}
                              {formatBytes(img.size)}
                              {img.type
                                ? ` · ${(img.type.split('/')[1] || '').replace('jpeg', 'jpg').toUpperCase()}`
                                : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyImage(img)}
                              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 font-bold text-sm transition-all active:scale-95 cursor-pointer"
                            >
                              {copiedId === img.id ? (
                                <>
                                  <Check className="w-4 h-4 text-green-400" /> {L.copied}
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4" /> {L.copy}
                                </>
                              )}
                            </button>
                            <div className="relative flex">
                              <button
                                onClick={() => downloadImage(img)}
                                className="inline-flex items-center gap-1.5 pl-4 pr-3 py-2.5 rounded-l-xl bg-white text-black hover:bg-indigo-500 hover:text-white font-bold text-sm transition-all active:scale-95 cursor-pointer"
                              >
                                <Download className="w-4 h-4" /> {t.downloadBtn}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormatMenuId(formatMenuId === img.id ? null : img.id);
                                }}
                                aria-label={L.moreFormats}
                                aria-expanded={formatMenuId === img.id}
                                className="inline-flex items-center px-2 py-2.5 rounded-r-xl bg-white text-black hover:bg-indigo-500 hover:text-white border-l border-black/10 font-bold text-sm transition-all active:scale-95 cursor-pointer"
                              >
                                <ChevronDown
                                  className={`w-4 h-4 transition-transform ${
                                    formatMenuId === img.id ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>
                              {formatMenuId === img.id && (
                                <div className="absolute bottom-full right-0 mb-2 z-50 min-w-[150px] rounded-xl bg-[#0d0f1c] border border-white/10 shadow-2xl shadow-black/60 overflow-hidden">
                                  <p className="px-4 pt-3 pb-1 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                                    {L.moreFormats}
                                  </p>
                                  {(['png', 'jpeg', 'webp'] as const).map((f) => (
                                    <button
                                      key={f}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        downloadImageAs(img, f);
                                      }}
                                      className="w-full px-4 py-2.5 text-left text-sm font-bold text-gray-200 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"
                                    >
                                      {f.replace('jpeg', 'jpg').toUpperCase()}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Gallery actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 border-t border-white/5 pt-10">
                  <button
                    onClick={resetApp}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-red-500/5 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold uppercase tracking-wider text-sm transition-all active:scale-95 cursor-pointer"
                  >
                    {t.clearBtn}
                  </button>

                  {images.length > 1 && (
                    <button
                      onClick={downloadAllImages}
                      disabled={isZipping}
                      className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-white border border-green-500/20 font-bold uppercase tracking-wider text-sm transition-all active:scale-95 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
                    >
                      {isZipping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Package className="w-5 h-5" />}
                      {t.downloadAllBtn}
                    </button>
                  )}

                  <button
                    onClick={convertInFormatFlow}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600/10 hover:bg-indigo-500 text-indigo-400 hover:text-white border border-indigo-500/20 font-bold uppercase tracking-wider text-sm transition-all active:scale-95 inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {t.convertBtn} <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* ---------- Features ---------- */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
            {t.features.map((feature, idx) => (
              <div
                key={idx}
                className="p-7 glass-card rounded-3xl text-left transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10"
              >
                <div className="text-3xl mb-4">{['⚡', '🛡️', '✨'][idx]}</div>
                <h3 className="text-white text-lg font-bold mb-2 tracking-tight">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.text}</p>
              </div>
            ))}
          </section>

          {/* ---------- SEO content ---------- */}
          <section className="pt-8 space-y-16 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-5">
                <span className="inline-block px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-[0.25em] border border-indigo-500/20">
                  {t.seoKeywords[0]}
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-white leading-tight tracking-tight">
                  {t.seoHeroTitle}
                </h2>
                <p className="text-gray-400 text-base md:text-lg leading-relaxed">{t.seoHeroText}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {t.seoHeroList.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5"
                    >
                      <span className="w-7 h-7 shrink-0 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center text-sm">
                        ✓
                      </span>
                      <span className="text-gray-300 font-semibold text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-card rounded-3xl p-12 min-h-[320px] flex flex-col items-center justify-center text-center gap-6">
                <div className="text-7xl animate-float">🚀</div>
                <div className="space-y-3 max-w-sm">
                  <h3 className="text-2xl font-black text-white tracking-tight">{t.seoBrowserSpeedTitle}</h3>
                  <p className="text-gray-400 text-base leading-relaxed">{t.seoBrowserSpeedText}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-8 md:p-12 rounded-3xl bg-[#0a0c16] border border-white/5">
              <div className="space-y-3">
                <h3 className="text-white text-sm font-black uppercase tracking-[0.3em] opacity-40">
                  {t.seoUseCaseTitle}
                </h3>
                <p className="text-gray-400 text-base leading-relaxed">{t.seoUseCaseText}</p>
              </div>
              <div className="space-y-3">
                <h3 className="text-white text-sm font-black uppercase tracking-[0.3em] opacity-40">
                  {t.seoPrivacyTitle}
                </h3>
                <p className="text-gray-400 text-base leading-relaxed">{t.seoPrivacyText}</p>
              </div>
            </div>

            {/* FAQ */}
            <div className="max-w-3xl mx-auto w-full space-y-8">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight text-center">
                {t.faqTitle}
              </h2>
              <div className="grid gap-4">
                {t.faq.map((item, idx) => (
                  <div key={idx} className="glass-card rounded-2xl p-6 space-y-2">
                    <h3 className="text-base font-bold text-white flex items-center gap-3">
                      <span className="shrink-0 w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-xs">
                        Q
                      </span>
                      {item.question}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed pl-10">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Keyword cloud */}
            <div className="max-w-3xl mx-auto w-full space-y-5 opacity-70">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 text-center">
                {t.seoKeywordsTitle}
              </h2>
              <div className="flex flex-wrap justify-center gap-2">
                {t.seoKeywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Bloque AdSense Horizontal — al final, antes del footer */}
          <AdBanner id="adsense-pastesnap-bottom" />
        </div>
      </main>

      {/* Expanded image lightbox */}
      <AnimatePresence>
        {expandedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 bg-black/95 backdrop-blur-2xl"
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={expandedImage.url}
                alt="Expanded view"
                className="max-w-full max-h-full object-contain rounded-2xl ring-1 ring-white/10"
              />
              <button
                onClick={() => setExpandedImage(null)}
                aria-label="Close"
                className="absolute top-4 right-4 md:top-8 md:right-8 p-4 text-white/60 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-8 h-8" />
              </button>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
                <button
                  onClick={() => copyImage(expandedImage)}
                  className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl inline-flex items-center gap-2 backdrop-blur-xl border border-white/20 transition-all active:scale-95 cursor-pointer"
                >
                  {copiedId === expandedImage.id ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                  {copiedId === expandedImage.id ? L.copied : L.copy}
                </button>
                <button
                  onClick={() => downloadImage(expandedImage)}
                  className="px-8 py-4 bg-white text-black font-black rounded-2xl hover:bg-indigo-500 hover:text-white inline-flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-5 h-5" /> {t.downloadBtn}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll to top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            aria-label="Scroll to top"
            className="fixed bottom-8 right-8 z-[200] w-14 h-14 bg-white text-black rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all cursor-pointer"
          >
            <ArrowUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <LegalModal
        isOpen={!!activeModal}
        onClose={() => setActiveModal(null)}
        title={
          activeModal === 'privacy'
            ? t.privacyPolicy
            : activeModal === 'terms'
            ? t.termsOfService
            : t.cookiePolicy
        }
        content={(activeModal === 'privacy'
          ? t.privacyContent
          : activeModal === 'terms'
          ? t.termsContent
          : t.cookiesContent
        )
          .split('\n')
          .map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        t={t}
      />

      {/* Footer */}
      <footer className="py-20 md:py-28 border-t border-white/5 flex flex-col items-center space-y-12 relative z-10 bg-[#020308] w-full">
        <div className="flex flex-col items-center space-y-10 max-w-5xl px-8 text-center">
          <div className="text-gray-600 text-xs font-black tracking-[0.5em] uppercase opacity-40">
            {t.footerCredit}
          </div>

          <a
            href={`/${lang.toLowerCase()}/`}
            className="flex items-center space-x-4 group scale-110 outline-none shrink-0"
          >
            <div className="w-12 h-12 bg-indigo-600 rounded-[1.2rem] flex items-center justify-center group-hover:rotate-12 transition-transform shadow-[0_15px_30px_-5px_rgba(79,70,229,0.5)]">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            <div className="flex items-center space-x-1 font-black text-3xl tracking-tighter">
              <span className="text-white transition-all group-hover:text-indigo-400">oLove</span>
              <span className="text-pink-500 group-hover:translate-x-1 group-hover:text-white transition-all">
                Tools
              </span>
            </div>
          </a>

          <p className="text-gray-500 text-base md:text-lg font-medium leading-relaxed max-w-2xl">
            {t.footerTagline}
          </p>

          <div className="flex flex-col md:flex-row flex-wrap items-center justify-center gap-y-2 md:gap-y-4 gap-x-4 md:gap-x-8 text-gray-700 font-black text-[11px] md:text-xs tracking-widest pt-10 uppercase border-t border-white/5 w-full">
            <span className="w-full md:w-auto mb-2 md:mb-0 opacity-40">&copy; {new Date().getFullYear()} oLoveTools</span>
            <a href={`/${lang.toLowerCase()}/privacy`} className="hover:text-indigo-400 transition-all">
              {legalTranslations[lang]?.nav.privacy || 'Privacy Policy'}
            </a>
            <a href={`/${lang.toLowerCase()}/terms`} className="hover:text-indigo-400 transition-all">
              {legalTranslations[lang]?.nav.terms || 'Terms of Service'}
            </a>
            <a href={`/${lang.toLowerCase()}/cookies`} className="hover:text-indigo-400 transition-all">
              {legalTranslations[lang]?.nav.cookies || 'Cookie Policy'}
            </a>
            <a href={`/${lang.toLowerCase()}/about`} className="hover:text-indigo-400 transition-all">
              {legalTranslations[lang]?.nav.about || 'About'}
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(t.emailAddress);
                const button = document.getElementById('copy-email-btn');
                if (button) {
                  const originalText = button.innerText;
                  button.innerText = t.emailCopied;
                  setTimeout(() => {
                    button.innerText = originalText;
                  }, 2000);
                }
              }}
              id="copy-email-btn"
              className="hover:text-indigo-400 transition-all cursor-pointer"
            >
              {t.emailAddress}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Pastesnap;
