import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUp,
  Check,
  CheckSquare,
  ClipboardPaste,
  Copy,
  Download,
  Loader2,
  Package,
  Square,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

import { Header } from './components/Header';
import { NextStepBar } from './components/NextStepBar';
import {
  BatchIcon,
  ClipboardIcon,
  FormatsIcon,
  LocalIcon,
  PasteHeroArt,
  StepChooseArt,
  StepExportArt,
  StepPasteArt,
} from './components/Illustrations';
import type { Language } from '../../locales/meta';
import { AdBanner } from '../../components/shared/AdBanner';
import { useHandoffIntake } from '../../lib/useHandoff';

import { ACCEPTED_TYPES } from './lib/decode';
import { FORMATS, formatBytes, getFormat, supportedFormats, type FormatId } from './lib/formats';
import { useGallery, type GalleryItem } from './lib/useGallery';

interface PastesnapProps {
  lang: Language;
  dictionary?: any;
}

const SIZE_PRESETS = [0, 2560, 1920, 1280, 800];

const Pastesnap: React.FC<PastesnapProps> = ({ lang, dictionary }) => {
  const t = dictionary || {};
  const tr = (key: string, fallback: string): string => (typeof t[key] === 'string' ? t[key] : fallback);

  const gallery = useGallery();
  const { items, selected, rejected, busy, progress } = gallery;

  const [format, setFormat] = useState<FormatId>('png');
  const [quality, setQuality] = useState(0.82);
  const [maxDimension, setMaxDimension] = useState(0);
  const [background, setBackground] = useState('#ffffff');
  const [available, setAvailable] = useState<Set<FormatId>>(new Set(['png', 'jpeg', 'webp']));

  const [expanded, setExpanded] = useState<GalleryItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [notice, setNotice] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  const activeFormat = getFormat(format);

  // Solo se ofrece lo que este navegador sabe codificar de verdad. Sin esta
  // comprobación, pedir AVIF devolvería un PNG con la extensión cambiada.
  useEffect(() => {
    let cancelled = false;
    supportedFormats().then(set => {
      if (!cancelled) setAvailable(set);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Un archivo que llega de otra herramienta entra por la misma puerta.
  useHandoffIntake(file => {
    void gallery.addFiles([file]);
  });

  // -------------------------------------------------------------------------
  // Entrada
  // -------------------------------------------------------------------------
  const handlePasteEvent = useCallback(
    (event: ClipboardEvent) => {
      const files = Array.from(event.clipboardData?.items || [])
        .filter(item => item.kind === 'file')
        .map(item => item.getAsFile())
        .filter((file): file is File => !!file);
      if (files.length) void gallery.addFiles(files);
    },
    [gallery]
  );

  useEffect(() => {
    window.addEventListener('paste', handlePasteEvent);
    return () => window.removeEventListener('paste', handlePasteEvent);
  }, [handlePasteEvent]);

  /**
   * Lectura del portapapeles SOLO a petición. La versión anterior lo leía sola
   * al montar y en cada `focus` de la ventana, así que volver a la pestaña
   * metía en la galería lo que hubiera copiado, sin tocar nada.
   */
  const pasteFromClipboard = async () => {
    try {
      if (!navigator.clipboard?.read) {
        setNotice(tr('clipboardUnsupported', 'This browser cannot read the clipboard. Use Ctrl+V instead.'));
        return;
      }
      const contents = await navigator.clipboard.read();
      const files: File[] = [];
      for (const entry of contents) {
        const imageType = entry.types.find(type => type.startsWith('image/'));
        if (!imageType) continue;
        const blob = await entry.getType(imageType);
        files.push(new File([blob], `clipboard-${Date.now()}.${imageType.split('/')[1] || 'png'}`, { type: imageType }));
      }
      if (files.length) {
        void gallery.addFiles(files);
        setNotice('');
      } else {
        setNotice(tr('clipboardEmpty', 'No image found in the clipboard.'));
      }
    } catch {
      setNotice(tr('clipboardDenied', 'Your browser blocked clipboard access. Use Ctrl+V instead.'));
    }
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    if (event.dataTransfer.files?.length) void gallery.addFiles(event.dataTransfer.files);
  };

  // -------------------------------------------------------------------------
  // Salida
  // -------------------------------------------------------------------------
  const download = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // El click es síncrono pero la descarga la arranca el navegador después:
    // revocar en el mismo tick la cancela en Firefox.
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const downloadItem = (item: GalleryItem) => {
    if (item.output) download(item.output.blob, item.output.name);
    else download(item.file, item.name);
  };

  const copyItem = async (item: GalleryItem) => {
    try {
      // Chromium solo acepta image/png en clipboard.write.
      const source = item.output?.blob || item.file;
      let png = source;
      if (source.type !== 'image/png') {
        const bitmap = await createImageBitmap(source);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        canvas.getContext('2d')!.drawImage(bitmap, 0, 0);
        bitmap.close();
        png = (await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png')))!;
      }
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setNotice(tr('copyFail', 'Your browser blocked the clipboard.'));
    }
  };

  const downloadZip = async () => {
    if (zipping || !items.length) return;
    setZipping(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      items.forEach((item, index) => {
        // Se usa el blob que ya tenemos. La versión anterior hacía fetch() del
        // object URL para recuperar un blob que ya estaba en memoria.
        const blob = item.output?.blob || item.file;
        const name = item.output?.name || item.name;
        zip.file(`${String(index + 1).padStart(2, '0')}_${name}`, blob);
      });
      const content = await zip.generateAsync({ type: 'blob' });
      download(content, 'pastesnap-images.zip');
    } finally {
      setZipping(false);
    }
  };

  /** Lo que consume NextStepBar: la primera imagen seleccionada, ya convertida si la hay. */
  const getResultForHandoff = useCallback(async () => {
    const item = items.find(i => selected.has(i.id)) || items[0];
    if (!item) return null;
    return item.output
      ? { blob: item.output.blob, name: item.output.name }
      : { blob: item.file, name: item.name };
  }, [items, selected]);

  // -------------------------------------------------------------------------
  // Totales
  // -------------------------------------------------------------------------
  const totals = useMemo(() => {
    const converted = items.filter(item => item.output);
    if (!converted.length) return null;
    const before = converted.reduce((sum, item) => sum + item.size, 0);
    const after = converted.reduce((sum, item) => sum + item.output!.size, 0);
    return { count: converted.length, before, after, delta: before === 0 ? 0 : (after - before) / before };
  }, [items]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(null);
      const typing =
        (event.target as HTMLElement | null)?.tagName === 'INPUT' ||
        (event.target as HTMLElement | null)?.tagName === 'TEXTAREA';
      if (typing) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a' && items.length) {
        event.preventDefault();
        gallery.selectAll();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gallery, items.length]);

  const faqs = Array.isArray(t.faq) ? t.faq : [];
  const keywords = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];
  const featuresList = Array.isArray(t.features) ? t.features : [];
  const featureIcons = [ClipboardIcon, FormatsIcon, BatchIcon, LocalIcon];

  const steps = [
    { art: StepPasteArt, title: tr('howStep1Title', 'Paste, drop or pick'), text: tr('howStep1Text', '') },
    { art: StepChooseArt, title: tr('howStep2Title', 'Choose format and quality'), text: tr('howStep2Text', '') },
    { art: StepExportArt, title: tr('howStep3Title', 'Download or send it onward'), text: tr('howStep3Text', '') },
  ];

  const labelCls = 'block text-[11px] font-black text-gray-500 uppercase tracking-widest';
  const chipCls = (active: boolean, disabled = false) =>
    `py-2.5 px-3 text-xs font-bold rounded-xl border text-center transition-all outline-none ${
      disabled
        ? 'opacity-30 cursor-not-allowed border-white/5 text-gray-600'
        : active
          ? 'bg-indigo-500/20 border-indigo-400/50 text-indigo-200 cursor-pointer'
          : 'bg-white/[0.03] border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.07] cursor-pointer'
    }`;

  return (
    <div
      onDrop={onDrop}
      onDragOver={event => event.preventDefault()}
      onDragEnter={event => {
        event.preventDefault();
        dragDepth.current += 1;
        if (event.dataTransfer.types?.includes('Files')) setIsDragging(true);
      }}
      onDragLeave={event => {
        event.preventDefault();
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setIsDragging(false);
      }}
      className="min-h-screen flex flex-col bg-[#04050a] text-gray-100 selection:bg-indigo-500/30 overflow-x-hidden"
    >
      {isDragging && items.length > 0 && (
        <div className="fixed inset-0 z-[190] pointer-events-none flex items-center justify-center bg-indigo-950/60 backdrop-blur-sm">
          <div className="px-10 py-8 rounded-3xl border-2 border-dashed border-indigo-400 bg-[#04050a]/80 text-center">
            <ClipboardPaste className="w-10 h-10 text-indigo-300 mx-auto mb-4" strokeWidth={1.5} />
            <p className="text-xl font-black text-white">{tr('dropHere', 'Drop images to add them')}</p>
          </div>
        </div>
      )}

      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-600/10 blur-[150px] rounded-full animate-fast-pulse" />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-pink-600/10 blur-[150px] rounded-full animate-fast-pulse"
          style={{ animationDelay: '4s' }}
        />
      </div>

      <Header
        currentLang={lang || 'en'}
        onLanguageChange={newLang => (window.location.href = `/${newLang.toLowerCase()}/pastesnap`)}
        onReset={gallery.clear}
        t={t}
      />

      {/* pt-36 en móvil: el header apilado mide 133px y con pt-32 la insignia
          quedaba por debajo de la barra fija. */}
      <main className="flex-1 flex flex-col items-center pt-36 md:pt-36 pb-24 px-4 md:px-8 relative z-10 w-full max-w-5xl mx-auto min-[1400px]:max-w-[min(64rem,calc(100vw-440px))]">
        <div className="w-full space-y-14 md:space-y-20">
          {/* ---------------------------------------------------------------- */}
          {/* Héroe                                                            */}
          {/* ---------------------------------------------------------------- */}
          <header className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-10 items-center pt-2">
            <div className="space-y-5 text-center lg:text-left">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-bold tracking-[0.2em] uppercase">
                <ClipboardPaste className="w-3.5 h-3.5" />
                {tr('heroBadge', 'Clipboard to image file')}
              </span>

              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[1.05]">
                {t.title}
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">
                  {t.onlineClipboardUtility}
                </span>
              </h1>

              <p className="text-gray-400 text-base md:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {t.description}
              </p>
            </div>
            <PasteHeroArt className="w-full max-w-[420px] mx-auto h-auto" />
          </header>

          <AdBanner id="adsense-pastesnap-top" />

          {/* ---------------------------------------------------------------- */}
          {/* Espacio de trabajo                                               */}
          {/* ---------------------------------------------------------------- */}
          <section id="workspace" aria-label={t.title} className="space-y-6">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              multiple
              onChange={event => {
                if (event.target.files?.length) void gallery.addFiles(event.target.files);
                event.target.value = '';
              }}
              className="hidden"
            />

            {notice && (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                <p className="text-xs font-bold text-amber-200">{notice}</p>
                <button onClick={() => setNotice('')} className="text-amber-200/70 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {rejected.length > 0 && (
              <div className="flex items-start justify-between gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                <div className="space-y-1 min-w-0">
                  <p className="text-xs font-black text-red-200 uppercase tracking-wider">
                    {tr('rejectedTitle', 'Not added')}
                  </p>
                  {rejected.slice(0, 4).map((entry, index) => (
                    <p key={index} className="text-[11px] text-red-200/80 truncate">
                      <span className="font-bold">{entry.name}</span>{' '}
                      {entry.reason === 'too-big'
                        ? tr('rejectTooBig', 'is over 40 MB')
                        : entry.reason === 'unsupported'
                          ? tr('rejectUnsupported', 'is not an image')
                          : tr('rejectDecode', 'could not be decoded')}
                    </p>
                  ))}
                </div>
                <button onClick={gallery.dismissRejected} className="text-red-200/70 hover:text-white cursor-pointer shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {items.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`group relative rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer px-8 py-16 md:py-24 flex flex-col items-center justify-center text-center ${
                  isDragging
                    ? 'border-indigo-400 bg-indigo-500/10'
                    : 'border-white/10 bg-white/[0.015] hover:border-indigo-500/40 hover:bg-white/[0.03]'
                }`}
              >
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl flex items-center justify-center mb-7 bg-white/5 text-indigo-400 p-5">
                  <ClipboardIcon className="w-full h-full" />
                </div>
                <p className="text-xl md:text-2xl font-black text-white mb-2">
                  {tr('dropPrompt', 'Drag & drop, paste or select an image')}
                </p>
                <p className="text-sm text-gray-500 mb-8">{tr('acceptedHint', 'PNG · JPG · WebP · AVIF · GIF · HEIC · TIFF · SVG')}</p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    onClick={event => {
                      event.stopPropagation();
                      void pasteFromClipboard();
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <ClipboardPaste className="w-4 h-4" />
                    {tr('pasteBtn', 'Paste')}
                  </button>
                  <button
                    onClick={event => {
                      event.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-white/10 hover:bg-white/5 text-gray-200 font-bold text-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    {tr('selectImage', 'Select image')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Barra de selección — envuelve, no se sale */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={selected.size === items.length ? gallery.selectNone : gallery.selectAll}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-xs font-bold text-gray-300 cursor-pointer"
                    >
                      {selected.size === items.length ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                      {tr('selectAll', 'Select all')}
                    </button>
                    <span className="text-xs font-bold text-gray-500">
                      {selected.size} / {items.length} {tr('imagesInCollection', 'images')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-xs font-bold text-gray-300 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {tr('pasteMore', 'Add more')}
                    </button>
                    <button
                      onClick={() => void pasteFromClipboard()}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-xs font-bold text-gray-300 cursor-pointer"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5" />
                      {tr('pasteBtn', 'Paste')}
                    </button>
                    <button
                      onClick={gallery.clear}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-red-500/10 hover:border-red-500/30 text-xs font-bold text-gray-300 hover:text-red-300 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {tr('clearBtn', 'Clear')}
                    </button>
                  </div>
                </div>

                {/* Rejilla */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {items.map(item => {
                    const isSelected = selected.has(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`group relative rounded-2xl overflow-hidden border transition-all ${
                          isSelected ? 'border-indigo-400/60 bg-indigo-500/[0.06]' : 'border-white/10 bg-white/[0.02]'
                        }`}
                      >
                        <button
                          onClick={() => gallery.toggle(item.id)}
                          aria-label={tr('selectImage', 'Select image')}
                          className="absolute top-2 left-2 z-10 w-6 h-6 rounded-md bg-black/60 backdrop-blur flex items-center justify-center cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-300" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </button>

                        <button
                          onClick={() => setExpanded(item)}
                          className="block w-full aspect-[4/3] bg-[#0a0c16] cursor-pointer"
                          aria-label={tr('expand', 'Expand')}
                        >
                          <img
                            src={item.output?.url || item.url}
                            alt={item.name}
                            loading="lazy"
                            className="w-full h-full object-contain"
                          />
                        </button>

                        <div className="p-3 space-y-2">
                          <input
                            value={item.name}
                            onChange={event => gallery.rename(item.id, event.target.value)}
                            className="w-full bg-transparent text-[11px] font-bold text-gray-200 outline-none focus:text-white truncate"
                          />
                          <div className="flex items-center justify-between gap-2 text-[10px] text-gray-500 font-medium">
                            <span>
                              {item.width}×{item.height}
                            </span>
                            <span>
                              {item.output ? (
                                <>
                                  <span className="line-through opacity-50">{formatBytes(item.size)}</span>{' '}
                                  <span className={item.output.size <= item.size ? 'text-emerald-400' : 'text-amber-400'}>
                                    {formatBytes(item.output.size)}
                                  </span>
                                </>
                              ) : (
                                formatBytes(item.size)
                              )}
                            </span>
                          </div>
                          {item.converted && (
                            <p className="text-[9px] font-bold text-indigo-300/80 uppercase tracking-wider">
                              {tr('decodedNote', 'Converted on import')}
                            </p>
                          )}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => downloadItem(item)}
                              title={tr('downloadBtn', 'Download')}
                              aria-label={tr('downloadBtn', 'Download')}
                              className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-indigo-500/20 text-gray-300 hover:text-white flex items-center justify-center cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => void copyItem(item)}
                              title={tr('copyBtn', 'Copy')}
                              aria-label={tr('copyBtn', 'Copy')}
                              className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-indigo-500/20 text-gray-300 hover:text-white flex items-center justify-center cursor-pointer"
                            >
                              {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => gallery.remove(item.id)}
                              title={tr('removeBtn', 'Remove')}
                              aria-label={tr('removeBtn', 'Remove')}
                              className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-300 hover:text-red-300 flex items-center justify-center cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Panel de conversión — la operación cara, siempre tras un botón */}
                <div className="glass-card rounded-3xl p-5 md:p-6 space-y-5">
                  <div className="space-y-2">
                    <label className={labelCls}>{tr('labelFormat', 'Output format')}</label>
                    <div className="grid grid-cols-4 gap-2">
                      {FORMATS.map(entry => {
                        const usable = available.has(entry.id);
                        return (
                          <button
                            key={entry.id}
                            onClick={() => usable && setFormat(entry.id)}
                            disabled={!usable}
                            title={usable ? undefined : tr('formatUnavailable', 'Your browser cannot encode this format')}
                            className={chipCls(format === entry.id, !usable)}
                          >
                            {entry.id.toUpperCase()}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {activeFormat.lossy && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-[11px] font-black text-gray-500 uppercase tracking-widest">
                        <span>{tr('labelQuality', 'Quality')}</span>
                        <span className="text-indigo-300">{Math.round(quality * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0.4}
                        max={1}
                        step={0.02}
                        value={quality}
                        onChange={event => setQuality(Number(event.target.value))}
                        className="w-full h-1 bg-white/10 rounded outline-none accent-indigo-500 cursor-pointer"
                      />
                      <p className="text-[10px] text-gray-500">{tr('qualityHint', 'Below 85% is usually invisible and much smaller.')}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className={labelCls}>{tr('labelMaxSize', 'Longest side')}</label>
                    <div className="grid grid-cols-5 gap-2">
                      {SIZE_PRESETS.map(preset => (
                        <button key={preset} onClick={() => setMaxDimension(preset)} className={chipCls(maxDimension === preset)}>
                          {preset === 0 ? tr('sizeOriginal', 'Original') : `${preset}px`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeFormat.needsFlatten && (
                    <div className="space-y-2">
                      <label className={labelCls}>{tr('labelFlatten', 'Flatten transparency onto')}</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={background}
                          onChange={event => setBackground(event.target.value)}
                          className="w-12 h-10 rounded-lg bg-transparent border border-white/10 cursor-pointer"
                          aria-label={tr('labelFlatten', 'Flatten transparency onto')}
                        />
                        <p className="text-[10px] text-gray-500">{tr('flattenHint', 'JPEG has no alpha channel, so transparent pixels need a colour.')}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 border-t border-white/5 pt-4">
                    <button
                      onClick={() => void gallery.convert({ format, quality, maxDimension, background })}
                      disabled={busy || selected.size === 0}
                      className="flex-1 min-w-[200px] py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm inline-flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                    >
                      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FormatsIcon className="w-4 h-4" />}
                      {busy
                        ? `${progress.done} / ${progress.total}`
                        : `${tr('convertBtn', 'Convert')} ${selected.size} → ${activeFormat.id.toUpperCase()}`}
                    </button>
                    <button
                      onClick={() => void downloadZip()}
                      disabled={zipping}
                      className="py-3.5 px-5 rounded-2xl border border-white/10 hover:bg-white/5 text-gray-200 font-bold text-sm inline-flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      {zipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                      {tr('downloadAllBtn', 'Download all (ZIP)')}
                    </button>
                  </div>

                  {totals && (
                    <p className="text-xs font-bold text-gray-400">
                      {totals.count} {tr('convertedLabel', 'converted')} · {formatBytes(totals.before)} →{' '}
                      <span className={totals.delta <= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                        {formatBytes(totals.after)}
                      </span>{' '}
                      ({totals.delta <= 0 ? '−' : '+'}
                      {Math.abs(Math.round(totals.delta * 100))}%)
                    </p>
                  )}
                </div>

                <NextStepBar lang={lang} t={t} getResult={getResultForHandoff} disabled={!items.length} />
              </div>
            )}
          </section>

          <AdBanner id="adsense-pastesnap-mid" />

          {/* ---------------------------------------------------------------- */}
          {/* Cómo funciona                                                    */}
          {/* ---------------------------------------------------------------- */}
          <section className="space-y-8">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight text-center">
              {tr('howTitle', 'How it works')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {steps.map((step, index) => {
                const Art = step.art;
                return (
                  <div key={index} className="glass-card rounded-3xl p-6 space-y-4">
                    <Art className="w-full max-w-[180px] h-auto" />
                    <div className="flex items-baseline gap-2">
                      <span className="text-indigo-400 font-black text-sm">{index + 1}</span>
                      <h3 className="text-base font-bold text-white tracking-tight">{step.title}</h3>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">{step.text}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* Características                                                   */}
          {/* ---------------------------------------------------------------- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuresList.map((feature: any, index: number) => {
              const Icon = featureIcons[index % featureIcons.length];
              return (
                <div key={index} className="glass-card p-7 rounded-3xl hover:-translate-y-1 transition-all duration-300">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5 p-2.5">
                    <Icon className="w-full h-full" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 tracking-tight">{feature.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.text}</p>
                </div>
              );
            })}
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* SEO                                                              */}
          {/* ---------------------------------------------------------------- */}
          <section className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-white tracking-tight">{t.seoHeroTitle}</h2>
                <p className="text-gray-400 text-sm leading-relaxed">{t.seoHeroText}</p>
                <div className="grid gap-2 pt-1">
                  {Array.isArray(t.seoHeroList) &&
                    t.seoHeroList.map((entry: string, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                        <span className="w-6 h-6 shrink-0 bg-indigo-500/20 text-indigo-300 rounded-lg flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-gray-300 font-semibold text-xs">{entry}</span>
                      </div>
                    ))}
                </div>
              </div>
              <div className="glass-card rounded-3xl p-8 space-y-5">
                <BatchIcon className="w-16 h-16" />
                <h3 className="text-xl font-black text-white tracking-tight">{t.seoBrowserSpeedTitle}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{t.seoBrowserSpeedText}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 rounded-3xl bg-[#0a0c16] border border-white/5">
              <div className="space-y-3">
                <h3 className="text-white text-xs font-black uppercase tracking-[0.3em] opacity-40">{t.seoUseCaseTitle}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{t.seoUseCaseText}</p>
              </div>
              <div className="space-y-3">
                <h3 className="text-white text-xs font-black uppercase tracking-[0.3em] opacity-40">{t.seoPrivacyTitle}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{t.seoPrivacyText}</p>
              </div>
            </div>

            {/* FAQ en <details>: accesible por teclado y presente en el DOM cerrada */}
            {faqs.length > 0 && (
              <div className="max-w-3xl mx-auto w-full space-y-4">
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight text-center">{t.faqTitle}</h2>
                {faqs.map((item: any, index: number) => (
                  <details key={index} className="glass-card rounded-2xl px-6 py-4 group">
                    <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-base font-bold text-white">
                      <span>{item.question}</span>
                      <span className="text-indigo-400 shrink-0 transition-transform group-open:rotate-45 text-xl leading-none">+</span>
                    </summary>
                    <p className="text-gray-400 text-sm leading-relaxed pt-3">{item.answer}</p>
                  </details>
                ))}
              </div>
            )}

            {keywords.length > 0 && (
              <div className="max-w-3xl mx-auto w-full space-y-4 opacity-70">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 text-center">{t.seoKeywordsTitle}</h2>
                <div className="flex flex-wrap justify-center gap-2">
                  {keywords.map((keyword: string, index: number) => (
                    <span key={index} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          <AdBanner id="adsense-pastesnap-bottom" />
        </div>
      </main>

      {/* Visor a pantalla completa */}
      {expanded && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 bg-black/95 backdrop-blur-2xl">
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={expanded.output?.url || expanded.url}
              alt={expanded.name}
              className="max-w-full max-h-full object-contain rounded-2xl ring-1 ring-white/10"
            />
            <button
              onClick={() => setExpanded(null)}
              aria-label={tr('close', 'Close')}
              className="absolute top-4 right-4 md:top-8 md:right-8 p-4 text-white/60 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-8 h-8" />
            </button>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
              <button
                onClick={() => void copyItem(expanded)}
                className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl inline-flex items-center gap-2 backdrop-blur-xl border border-white/20 transition-all active:scale-95 cursor-pointer"
              >
                {copiedId === expanded.id ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                {copiedId === expanded.id ? tr('copiedBtn', 'Copied!') : tr('copyBtn', 'Copy')}
              </button>
              <button
                onClick={() => downloadItem(expanded)}
                className="px-8 py-4 bg-white text-black font-black rounded-2xl hover:bg-indigo-500 hover:text-white inline-flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Download className="w-5 h-5" /> {tr('downloadBtn', 'Download')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={tr('backToTop', 'Back to top')}
          className="fixed bottom-8 right-8 z-[200] w-14 h-14 bg-white text-black rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all cursor-pointer"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default Pastesnap;
