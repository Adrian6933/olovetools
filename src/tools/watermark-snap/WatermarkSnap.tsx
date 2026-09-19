import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createUniqueNamer } from '../../lib/uniqueName';
import { motion } from 'framer-motion';
import {
  AlertCircle, ArrowUp, Check, Copy, Download, Eye, Image as ImageIcon, Layers as LayersIcon,
  Loader2, Package, Plus, Redo2, Stamp, Trash2, Type, Undo2, Upload, X, Zap,
} from 'lucide-react';

import { createTranslator } from '../../locales/meta';
import { AdBanner } from '../../components/shared/AdBanner';
import { fadeInUp } from '../../components/shared/motion';
import { useHandoffIntake } from '../../lib/useHandoff';

import { Header } from './components/Header';
import { LayerPanel } from './components/LayerPanel';
import { NextStepBar } from './components/NextStepBar';
import { Stage } from './components/Stage';
import { Toggle } from './components/Fields';
import {
  IconBatch, IconHandoff, IconLayers, IconLocal, IconPlace, IconTile,
  StepDesign, StepDrop, StepExport, StepPlace, WatermarkHeroArt,
} from './components/Illustrations';

import type {
  EditorSnapshot, ExportSettings, ImageItem, Layer, LogoAsset, OutputFormat, TextLayer,
} from './types';
import { applyPreset, createLogoLayer, createTextLayer, duplicateLayer, newId, type PresetId } from './lib/layers';
import { ensureFonts } from './lib/render';
import {
  ACCEPT_ATTRIBUTE, Encoder, PREVIEW_MAX_EDGE, decodeImage, downloadBlob, formatBytes,
  looksLikeImage, normaliseFile, outputName,
} from './lib/pipeline';

interface WatermarkSnapProps {
  lang: string;
  dictionary: any;
}

const MAX_HISTORY = 80;
const OUTPUT_FORMATS: OutputFormat[] = ['png', 'jpeg', 'webp'];
const SIZE_LIMITS = [0, 4096, 2560, 1920, 1280];

export const WatermarkSnap: React.FC<WatermarkSnapProps> = ({ lang, dictionary }) => {
  const t = createTranslator(dictionary);

  // ---------------------------------------------------------------------------
  // Estado
  // ---------------------------------------------------------------------------
  const [items, setItems] = useState<ImageItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ id: string; bitmap: ImageBitmap; width: number; height: number } | null>(null);

  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [assetTick, setAssetTick] = useState(0);
  const assetsRef = useRef<Map<string, LogoAsset>>(new Map());

  // El historial vive en refs y no en el estado: un `commit` disparado desde el
  // mismo manejador que acaba de llamar a `patchLayer` leería el `layers` viejo
  // si dependiera del closure de React.
  const historyRef = useRef<EditorSnapshot[]>([{ layers: [], selectedLayerId: null }]);
  const historyIndexRef = useRef(0);
  const [, bumpHistory] = useState(0);

  const [settings, setSettings] = useState<ExportSettings>({
    format: 'png',
    quality: 0.92,
    maxSize: 0,
    suffix: '-watermarked',
  });

  const [compare, setCompare] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [notice, setNotice] = useState<{ kind: 'error' | 'info'; text: string } | null>(null);
  const [stats, setStats] = useState<{ drawCalls: number; ms: number } | null>(null);
  const [redrawKey, setRedrawKey] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const encoderRef = useRef<Encoder | null>(null);
  const previewRef = useRef(preview);
  previewRef.current = preview;

  const activeItem = useMemo(() => items.find(i => i.id === activeId) || null, [items, activeId]);
  // Copia nueva en cada `assetTick`: el Map de refs conserva su identidad, así
  // que sin esto el visor no se enteraría de que hay un logo nuevo que dibujar.
  const assets = useMemo(() => new Map(assetsRef.current), [assetTick]);

  const layersRef = useRef(layers);
  layersRef.current = layers;
  const selectedLayerRef = useRef(selectedLayerId);
  selectedLayerRef.current = selectedLayerId;

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setPrefersReduced(query.matches);
    sync();
    query.addEventListener('change', sync);
    const onScroll = () => setShowScrollTop(window.scrollY > 900);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      query.removeEventListener('change', sync);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(id);
  }, [notice]);

  // ---------------------------------------------------------------------------
  // Historial (guarda descripciones de capa, no bitmaps: ~400 bytes por paso)
  // ---------------------------------------------------------------------------
  const pushSnapshot = useCallback((snapshot: EditorSnapshot) => {
    const stack = historyRef.current.slice(0, historyIndexRef.current + 1);
    const last = stack[stack.length - 1];
    // Un slider emite decenas de eventos; sólo entra en el historial lo que
    // realmente cambió el resultado.
    if (last && JSON.stringify(last.layers) === JSON.stringify(snapshot.layers)) return;
    stack.push(snapshot);
    while (stack.length > MAX_HISTORY) stack.shift();
    historyRef.current = stack;
    historyIndexRef.current = stack.length - 1;
    bumpHistory(n => n + 1);
  }, []);

  /** Cierra el cambio en curso. Se aplaza un tick para leer el estado ya aplicado. */
  const commit = useCallback(() => {
    window.setTimeout(
      () => pushSnapshot({ layers: layersRef.current, selectedLayerId: selectedLayerRef.current }),
      0
    );
  }, [pushSnapshot]);

  const jumpHistory = useCallback((direction: -1 | 1) => {
    const target = historyIndexRef.current + direction;
    if (target < 0 || target >= historyRef.current.length) return;
    historyIndexRef.current = target;
    const snapshot = historyRef.current[target];
    setLayers(snapshot.layers);
    setSelectedLayerId(snapshot.selectedLayerId);
    bumpHistory(n => n + 1);
  }, []);

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  // ---------------------------------------------------------------------------
  // Entrada de ficheros
  // ---------------------------------------------------------------------------
  const addFiles = useCallback(async (list: FileList | File[]) => {
    const incoming = Array.from(list);
    if (incoming.length === 0) return;

    const accepted: ImageItem[] = [];
    let rejected = 0;

    for (const raw of incoming) {
      if (!looksLikeImage(raw)) {
        rejected++;
        continue;
      }
      try {
        // El HEIC se convierte aquí, en la entrada, para que el resto del
        // programa trabaje siempre con algo que el canvas sepa dibujar.
        const file = await normaliseFile(raw);
        const probe = await decodeImage(file, 64);
        accepted.push({
          id: newId('i'),
          file,
          name: file.name,
          size: file.size,
          width: probe.width,
          height: probe.height,
          url: URL.createObjectURL(file),
          status: 'ready',
        });
        probe.bitmap.close();
      } catch {
        rejected++;
      }
    }

    if (rejected > 0) {
      setNotice({
        kind: 'error',
        text: (t.errorUnsupported || '{n} file(s) could not be read. Supported: JPG, PNG, WebP, AVIF, GIF, SVG and HEIC.')
          .replace('{n}', String(rejected)),
      });
    }
    if (accepted.length === 0) return;

    setItems(prev => [...prev, ...accepted]);
    setActiveId(current => current ?? accepted[0].id);
  }, [t]);

  // Recibe un fichero de otra herramienta (p. ej. un recorte de Background Remover).
  useHandoffIntake(file => { void addFiles([file]); });

  // Pegar una imagen del portapapeles.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files || []);
      if (files.length > 0) {
        e.preventDefault();
        void addFiles(files);
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [addFiles]);

  // ---------------------------------------------------------------------------
  // Decodificación perezosa: sólo la imagen activa mantiene un bitmap abierto.
  // Con 40 fotos de 12 MP, tenerlas todas decodificadas serían ~1,9 GB.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!activeItem) {
      previewRef.current?.bitmap.close();
      setPreview(null);
      return;
    }
    if (previewRef.current?.id === activeItem.id) return;

    let cancelled = false;
    decodeImage(activeItem.file, PREVIEW_MAX_EDGE)
      .then(decoded => {
        if (cancelled) {
          decoded.bitmap.close();
          return;
        }
        previewRef.current?.bitmap.close();
        setPreview({ id: activeItem.id, bitmap: decoded.bitmap, width: decoded.width, height: decoded.height });
      })
      .catch(() => {
        if (!cancelled) setNotice({ kind: 'error', text: t.errorDecode || 'That image could not be decoded.' });
      });

    return () => { cancelled = true; };
  }, [activeItem, t]);

  // Libera todo al desmontar. La versión anterior tenía este mismo efecto con
  // deps [] y cerraba sobre el array vacío del primer render, así que no
  // revocaba absolutamente nada.
  const itemsRef = useRef(items);
  itemsRef.current = items;
  useEffect(() => {
    return () => {
      itemsRef.current.forEach(item => URL.revokeObjectURL(item.url));
      previewRef.current?.bitmap.close();
      assetsRef.current.forEach(asset => asset.bitmap.close());
      encoderRef.current?.dispose();
    };
  }, []);

  const removeItem = (id: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setItems(prev => {
      const target = prev.find(i => i.id === id);
      if (target) URL.revokeObjectURL(target.url);
      const next = prev.filter(i => i.id !== id);
      setActiveId(current => (current === id ? next[0]?.id ?? null : current));
      return next;
    });
  };

  const clearAll = () => {
    items.forEach(item => URL.revokeObjectURL(item.url));
    setItems([]);
    setActiveId(null);
    setProgress(null);
    setNotice(null);
  };

  const resetAll = () => {
    clearAll();
    assetsRef.current.forEach(asset => asset.bitmap.close());
    assetsRef.current = new Map();
    setLayers([]);
    setSelectedLayerId(null);
    historyRef.current = [{ layers: [], selectedLayerId: null }];
    historyIndexRef.current = 0;
    bumpHistory(n => n + 1);
  };

  // ---------------------------------------------------------------------------
  // Capas
  // ---------------------------------------------------------------------------
  const pushLayers = useCallback((next: Layer[], selected: string | null) => {
    setLayers(next);
    setSelectedLayerId(selected);
    pushSnapshot({ layers: next, selectedLayerId: selected });
  }, [pushSnapshot]);

  const addTextLayer = (placement: 'anchor' | 'free' = 'anchor') => {
    const layer = createTextLayer(t.defaultWatermarkText || '© Your Brand', {
      placement,
      ...(placement === 'free' ? { pos: { x: 0.5, y: 0.5 }, opacity: 0.6 } : {}),
    });
    pushLayers([...layers, layer], layer.id);
  };

  const handleLogoFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const normalised = await normaliseFile(file);
      const decoded = await decodeImage(normalised, 1600);
      const asset: LogoAsset = {
        id: newId('a'),
        name: normalised.name,
        bitmap: decoded.bitmap,
        width: decoded.bitmap.width,
        height: decoded.bitmap.height,
      };
      assetsRef.current.set(asset.id, asset);
      setAssetTick(n => n + 1);
      const layer = createLogoLayer(asset.id);
      pushLayers([...layers, layer], layer.id);
    } catch {
      setNotice({ kind: 'error', text: t.errorLogo || 'That logo could not be read. Try a PNG with transparency.' });
    }
  };

  const patchLayer = (id: string, patch: Partial<Layer>) => {
    setLayers(prev => prev.map(l => (l.id === id ? ({ ...l, ...patch } as Layer) : l)));
  };

  const removeLayer = (id: string) => {
    const next = layers.filter(l => l.id !== id);
    pushLayers(next, next[next.length - 1]?.id ?? null);
  };

  const duplicate = (id: string) => {
    const source = layers.find(l => l.id === id);
    if (!source) return;
    const copy = duplicateLayer(source);
    pushLayers([...layers, copy], copy.id);
  };

  const reorder = (id: string, direction: -1 | 1) => {
    const index = layers.findIndex(l => l.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= layers.length) return;
    const next = [...layers];
    [next[index], next[target]] = [next[target], next[index]];
    pushLayers(next, id);
  };

  const usePreset = (id: string, preset: PresetId) => {
    const source = layers.find(l => l.id === id);
    if (!source || source.kind !== 'text') return;
    const next = layers.map(l => (l.id === id ? applyPreset(l as TextLayer, preset) : l));
    pushLayers(next, id);
  };

  const moveLayer = (id: string, pos: { x: number; y: number }, shouldCommit: boolean) => {
    setLayers(prev => prev.map(l => (l.id === id ? ({ ...l, placement: 'free', pos } as Layer) : l)));
    if (shouldCommit) commit();
  };

  // Las fuentes de Google llegan con `display=swap`: si dibujamos antes de que
  // estén rasterizadas, el canvas usa Arial en silencio. Esto redibuja cuando
  // la familia real ya está lista.
  const fontSignature = layers.map(l => (l.kind === 'text' ? `${l.fontFamily}|${l.fontWeight}|${l.italic}` : '')).join(',');
  useEffect(() => {
    let cancelled = false;
    void ensureFonts(layers).then(() => { if (!cancelled) setRedrawKey(n => n + 1); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontSignature]);

  // ---------------------------------------------------------------------------
  // Atajos de teclado
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = !!target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable);

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        jumpHistory(e.shiftKey ? 1 : -1);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        jumpHistory(1);
        return;
      }
      if (typing) return;

      if (!e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'c' && !e.altKey) {
        setCompare(c => !c);
        return;
      }

      if (!selectedLayerId) return;
      const layer = layers.find(l => l.id === selectedLayerId);
      if (!layer || layer.placement !== 'free') return;

      const step = (e.shiftKey ? 0.02 : 0.002);
      const delta: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
      };
      const move = delta[e.key];
      if (!move) return;
      e.preventDefault();
      patchLayer(selectedLayerId, {
        pos: {
          x: Math.min(1, Math.max(0, layer.pos.x + move[0])),
          y: Math.min(1, Math.max(0, layer.pos.y + move[1])),
        },
      } as Partial<Layer>);
      commit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [jumpHistory, layers, selectedLayerId, commit]);

  // ---------------------------------------------------------------------------
  // Exportación
  // ---------------------------------------------------------------------------
  const getEncoder = () => {
    if (!encoderRef.current) encoderRef.current = new Encoder();
    return encoderRef.current;
  };

  const renderItem = async (item: ImageItem, options: { archive: boolean; wantBlob: boolean; name?: string }) => {
    const decoded = await decodeImage(item.file, 0);
    try {
      return await getEncoder().add({
        id: item.id,
        name: options.name || outputName(item.name, settings),
        source: decoded.bitmap,
        width: decoded.width,
        height: decoded.height,
        layers,
        assets: assetsRef.current,
        settings,
        archive: options.archive,
        wantBlob: options.wantBlob,
      });
    } finally {
      decoded.bitmap.close();
    }
  };

  const runExport = async (mode: 'single' | 'all') => {
    const targets = mode === 'single' ? (activeItem ? [activeItem] : []) : items;
    if (targets.length === 0 || progress) return;

    setNotice(null);
    setProgress({ current: 0, total: targets.length });
    await ensureFonts(layers);
    getEncoder().reset();
    // Nombres repetidos dentro del ZIP se pisaban y se perdia una imagen.
    const uniqueName = createUniqueNamer();

    try {
      for (let i = 0; i < targets.length; i++) {
        const item = targets[i];
        setProgress({ current: i + 1, total: targets.length });
        setItems(prev => prev.map(it => (it.id === item.id ? { ...it, status: 'exporting' } : it)));

        try {
          const result = await renderItem(item, {
            archive: mode === 'all',
            wantBlob: mode === 'single',
            name: mode === 'all' ? uniqueName(outputName(item.name, settings)) : undefined,
          });
          setItems(prev => prev.map(it => (it.id === item.id ? { ...it, status: 'done', outputSize: result.size } : it)));
          if (mode === 'single' && result.blob) downloadBlob(result.blob, outputName(item.name, settings));
        } catch (err) {
          setItems(prev => prev.map(it => (it.id === item.id ? { ...it, status: 'error', error: String(err) } : it)));
        }

        // Cede el hilo entre imágenes: sin esto la barra de progreso se queda
        // congelada en 0 hasta que termina todo el lote.
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      if (mode === 'all') {
        const blob = await getEncoder().zip();
        downloadBlob(blob, `watermark-snap-${Date.now()}.zip`);
      }
    } catch (err) {
      setNotice({ kind: 'error', text: (t.errorExport || 'Export failed: {msg}').replace('{msg}', String(err)) });
    } finally {
      setProgress(null);
    }
  };

  /** Para el handoff: la imagen activa, ya compuesta, sin pasar por Descargas. */
  const getResult = useCallback(async () => {
    if (!activeItem) return null;
    await ensureFonts(layers);
    const result = await renderItem(activeItem, { archive: false, wantBlob: true });
    if (!result.blob) return null;
    return { blob: result.blob, name: outputName(activeItem.name, settings) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeItem, layers, settings]);

  const copyToClipboard = async () => {
    if (!activeItem) return;
    try {
      await ensureFonts(layers);
      // Sólo PNG: es el único tipo de imagen que la Clipboard API acepta.
      const png = { ...settings, format: 'png' as OutputFormat };
      const decoded = await decodeImage(activeItem.file, 0);
      const result = await getEncoder().add({
        id: `clip-${activeItem.id}`,
        name: outputName(activeItem.name, png),
        source: decoded.bitmap,
        width: decoded.width,
        height: decoded.height,
        layers,
        assets: assetsRef.current,
        settings: png,
        archive: false,
        wantBlob: true,
      });
      decoded.bitmap.close();
      if (!result.blob) throw new Error('blob');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': result.blob })]);
      setNotice({ kind: 'info', text: t.copiedNotice || 'Watermarked image copied to the clipboard.' });
    } catch {
      setNotice({ kind: 'error', text: t.errorClipboard || 'Your browser refused the clipboard write. Download it instead.' });
    }
  };

  // ---------------------------------------------------------------------------
  // Arrastrar y soltar sobre la página
  // ---------------------------------------------------------------------------
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) void addFiles(e.dataTransfer.files);
  };

  // ---------------------------------------------------------------------------
  // Contenido editorial
  // ---------------------------------------------------------------------------
  const steps = [
    { art: StepDrop, title: t.step1Title || 'Drop your images', text: t.step1Text || 'JPG, PNG, WebP, AVIF, GIF, SVG or HEIC from an iPhone. They queue up; nothing is processed yet.' },
    { art: StepDesign, title: t.step2Title || 'Design the watermark', text: t.step2Text || 'Text or logo, outline, shadow, plate and blend modes. Stack as many layers as you need.' },
    { art: StepPlace, title: t.step3Title || 'Place it exactly', text: t.step3Text || 'Nine anchors, free dragging with the mouse, or a diagonal tiled grid across the whole photo.' },
    { art: StepExport, title: t.step4Title || 'Export when you say so', text: t.step4Text || 'PNG, WebP or JPEG at full resolution, one file or the whole batch as a ZIP.' },
  ];

  const featureIcons = [IconLocal, IconLayers, IconTile, IconPlace, IconBatch, IconHandoff];
  const fallbackFeatures = [
    { title: 'Nothing leaves your device', text: 'Every pixel is composited by your own browser. No upload, no server, no queue.' },
    { title: 'Non-destructive layers', text: 'The watermark stays a description, never baked in. Undo costs bytes, not megabytes.' },
    { title: 'Real diagonal tiling', text: 'The whole grid rotates in a single pass, so the pattern is even edge to edge.' },
    { title: 'Place it by hand', text: 'Drag it on the canvas, nudge with arrows, zoom to the cursor, hold Alt to see the original.' },
    { title: 'Batch that scales', text: 'Only the image you are looking at stays decoded, so a folder of 12 MP photos does not eat your RAM.' },
    { title: 'Chained with the suite', text: 'Send the result to compress, crop, convert or resize for social without downloading it.' },
  ];
  const features = Array.isArray(t.features) && t.features.length >= 6 ? t.features : fallbackFeatures;

  const outputInfo = activeItem?.outputSize ? formatBytes(activeItem.outputSize) : null;
  const doneCount = items.filter(i => i.status === 'done').length;

  return (
    <div
      className="min-h-screen flex flex-col bg-[#080604] text-slate-200 selection:bg-amber-500/30 overflow-x-hidden font-sans"
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={e => { if (e.currentTarget === e.target) setDragging(false); }}
      onDrop={onDrop}
    >
      <Header
        currentLang={lang}
        onLanguageChange={newLang => { window.location.href = `/${newLang.toLowerCase()}/watermark-snap`; }}
        onReset={resetAll}
        t={t}
      />

      {/* El max-width vive en <main> a propósito: AdRail mide este elemento para
          decidir si caben los raíles laterales, y reservar 440px a partir de
          1400px es lo que los mantiene visibles en vez de suprimidos en
          silencio. Con el max-w-7xl anterior el hueco a 1400px era de 57px. */}
      <main className="flex-1 flex flex-col items-center pt-32 md:pt-36 pb-28 px-4 md:px-10 relative z-10 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))]">
        <AdBanner id="adsense-watermark-snap-top" />

        <div className="w-full space-y-20 md:space-y-28">
          {/* ================================================================ */}
          {/* Héroe                                                            */}
          {/* ================================================================ */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center pt-2">
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex max-w-full items-center gap-2 px-4 py-2 rounded-full bg-amber-950/40 border border-amber-800/30 text-amber-400 text-[11px] font-black tracking-[0.2em] uppercase shadow-[0_0_25px_rgba(245,158,11,0.15)]">
                <Stamp className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.badge || t.title}</span>
              </div>

              <h1 className="text-4xl md:text-6xl xl:text-7xl font-black tracking-tight leading-[0.95] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-400">
                {t.seoHeroTitle}
              </h1>

              <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
                {t.description}
              </p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                {(t.seoHeroList || []).slice(0, 3).map((point: string, i: number) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-300">
                    <Check className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />
                    {point}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/10 blur-[80px] rounded-full" />
              <WatermarkHeroArt className="relative w-full max-w-lg mx-auto drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]" animated={!prefersReduced} />
            </div>
          </section>

          {/* ================================================================ */}
          {/* Espacio de trabajo                                               */}
          {/* ================================================================ */}
          <section className="space-y-4">
            {notice && (
              <div
                role="status"
                className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${
                  notice.kind === 'error'
                    ? 'border-red-500/25 bg-red-500/10 text-red-300'
                    : 'border-amber-500/25 bg-amber-500/10 text-amber-200'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="flex-1 break-words">{notice.text}</span>
                <button onClick={() => setNotice(null)} className="p-0.5 bg-transparent border-none text-current opacity-60 hover:opacity-100 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {items.length === 0 ? (
              /* ---------------- Zona de carga ---------------- */
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`group relative border-2 border-dashed rounded-3xl p-10 md:p-20 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all shadow-xl shadow-black/20 ${
                  dragging ? 'border-amber-400 bg-amber-500/10 scale-[1.01]' : 'border-amber-950 hover:border-amber-500/40 bg-[#150e07]/40 hover:bg-[#1b1209]/50'
                }`}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-500/10 blur-xl rounded-full scale-125 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-20 h-20 bg-[#1a1108] border border-white/5 rounded-2xl flex items-center justify-center text-amber-400 relative z-10 transition-transform group-hover:scale-105 group-hover:-translate-y-1 shadow-lg shadow-black/40">
                    <Upload className="w-10 h-10" />
                  </div>
                </div>
                <div className="space-y-2 text-center">
                  <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
                    {t.dropzonePrompt || 'Drop your images here'}
                  </h2>
                  <p className="text-slate-500 text-sm font-medium max-w-md">
                    {t.dropzoneSubtitle || 'JPG, PNG, WebP, AVIF, GIF, SVG and HEIC. You can also paste from the clipboard.'}
                  </p>
                </div>
              </div>
            ) : (
              /* ---------------- Editor ---------------- */
              <div className="glass-card rounded-3xl p-3 sm:p-4 md:p-6 space-y-4 shadow-2xl border border-white/5">
                {/* Tira de miniaturas */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {items.map(item => {
                    const active = item.id === activeId;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveId(item.id)}
                        title={item.name}
                        className={`group relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                          active ? 'border-amber-500 shadow-[0_0_14px_rgba(245,158,11,0.35)]' : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0.5 right-0.5">
                          {item.status === 'exporting' && <Loader2 className="w-3.5 h-3.5 text-amber-300 animate-spin drop-shadow" />}
                          {item.status === 'done' && <Check className="w-3.5 h-3.5 text-amber-400 drop-shadow stroke-[3]" />}
                          {item.status === 'error' && <AlertCircle className="w-3.5 h-3.5 text-red-400 drop-shadow" />}
                        </span>
                        <span
                          onClick={e => removeItem(item.id, e)}
                          className="absolute top-0.5 left-0.5 p-0.5 rounded-md bg-black/80 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </span>
                      </button>
                    );
                  })}

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title={t.btn_add_files || 'Add images'}
                    className="shrink-0 w-16 h-16 rounded-xl border-2 border-dashed border-white/15 hover:border-amber-500/50 text-slate-500 hover:text-amber-400 flex items-center justify-center transition-all cursor-pointer bg-transparent"
                  >
                    <Plus className="w-5 h-5" />
                  </button>

                  <div className="ml-auto shrink-0 pl-3 flex items-center gap-2">
                    <button
                      onClick={clearAll}
                      className="px-3 py-2 rounded-xl bg-red-500/5 hover:bg-red-500/15 border border-red-500/20 text-red-400 text-[10px] font-black tracking-widest uppercase transition-all cursor-pointer"
                    >
                      {t.btn_clear || 'Clear all'}
                    </button>
                  </div>
                </div>

                {/* Lienzo + panel. flex-col en móvil, dos columnas a partir de lg:
                    ojo, `lg:flex-1` y no `flex-1` a secas — en flex-col, flex-1
                    pone flex-basis:0 sobre el eje vertical y colapsa el panel. */}
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="lg:flex-1 min-w-0 flex flex-col gap-3">
                    <div className="relative h-[320px] sm:h-[420px] lg:h-[560px] rounded-2xl border border-white/5 bg-[#0b0704] overflow-hidden">
                      {preview && activeItem ? (
                        <Stage
                          bitmap={preview.bitmap}
                          redrawKey={redrawKey}
                          width={preview.width}
                          height={preview.height}
                          layers={layers}
                          assets={assets}
                          selectedLayerId={selectedLayerId}
                          onSelectLayer={setSelectedLayerId}
                          onMoveLayer={moveLayer}
                          compare={compare}
                          onStats={setStats}
                          t={t}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                        </div>
                      )}

                      {/* Nada arranca solo al subir: el usuario decide qué marca
                          poner y cuándo. */}
                      {layers.length === 0 && preview && (
                        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 bg-gradient-to-t from-black via-black/85 to-transparent flex flex-col items-center gap-3">
                          <div className="flex flex-wrap items-center justify-center gap-2.5">
                            <button
                              onClick={() => addTextLayer('anchor')}
                              className="px-5 sm:px-7 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs sm:text-sm uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl shadow-amber-600/30 hover:scale-[1.03] active:scale-95 cursor-pointer"
                            >
                              <Type className="w-4 h-4 stroke-[3]" />
                              {t.addTextWatermark || 'Add text watermark'}
                            </button>
                            <button
                              onClick={() => logoInputRef.current?.click()}
                              className="px-5 py-3 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-black text-[11px] sm:text-xs uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer"
                            >
                              <ImageIcon className="w-4 h-4" />
                              {t.addLogoWatermark || 'Use a logo'}
                            </button>
                            <button
                              onClick={() => addTextLayer('free')}
                              title={t.manualHint || 'Skip the presets: drop the watermark in the middle and place it yourself.'}
                              className="px-5 py-3 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-black text-[11px] sm:text-xs uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer"
                            >
                              <Zap className="w-4 h-4" />
                              {t.manualBtn || 'Place by hand'}
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium text-center max-w-md">
                            {t.readyHint || 'Nothing has been processed yet. Your images are just queued up.'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Barra de estado del lienzo */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 justify-between rounded-2xl border border-white/5 bg-black/30 px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => jumpHistory(-1)}
                          disabled={!canUndo}
                          title={`${t.undoBtn || 'Undo'} (Ctrl+Z)`}
                          className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-amber-400 disabled:opacity-25 transition-colors cursor-pointer disabled:cursor-default"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => jumpHistory(1)}
                          disabled={!canRedo}
                          title={`${t.redoBtn || 'Redo'} (Ctrl+Shift+Z)`}
                          className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-amber-400 disabled:opacity-25 transition-colors cursor-pointer disabled:cursor-default"
                        >
                          <Redo2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onMouseDown={() => setCompare(true)}
                          onMouseUp={() => setCompare(false)}
                          onMouseLeave={() => setCompare(false)}
                          onTouchStart={() => setCompare(true)}
                          onTouchEnd={() => setCompare(false)}
                          title={t.compareHint || 'Hold to see the original (or hold Alt anywhere)'}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer ${
                            compare ? 'bg-amber-500 border-amber-500 text-black' : 'bg-white/5 border-white/10 text-slate-300 hover:text-amber-400'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{t.compareBtn || 'Compare'}</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold text-slate-500 tabular-nums">
                        <span className="truncate max-w-[180px] text-slate-300">{activeItem?.name}</span>
                        <span>{activeItem?.width}×{activeItem?.height}</span>
                        <span>{formatBytes(activeItem?.size || 0)}</span>
                        {outputInfo && <span className="text-amber-400">→ {outputInfo}</span>}
                        {stats && (
                          <span title={t.statsHint || 'Draw calls and milliseconds of the last composite. Tiling uses one single fill.'}>
                            {stats.drawCalls} {t.statsDraws || 'draws'} · {stats.ms.toFixed(1)} ms
                          </span>
                        )}
                      </div>
                    </div>

                    {doneCount > 0 && <NextStepBar lang={lang} t={t} getResult={getResult} />}
                  </div>

                  {/* Panel de control */}
                  <div className="w-full lg:w-[340px] xl:w-[380px] shrink-0 flex flex-col gap-4 bg-black/25 border border-white/5 rounded-2xl p-4 lg:max-h-[680px] lg:overflow-y-auto">
                    <LayerPanel
                      layers={layers}
                      assets={assets}
                      selectedId={selectedLayerId}
                      t={t}
                      onSelect={setSelectedLayerId}
                      onAddText={() => addTextLayer('anchor')}
                      onAddLogo={() => logoInputRef.current?.click()}
                      onRemove={removeLayer}
                      onDuplicate={duplicate}
                      onReorder={reorder}
                      onPatch={patchLayer}
                      onCommit={commit}
                      onPreset={usePreset}
                    />

                    {/* ------------------ Exportación ------------------ */}
                    <div className="flex flex-col gap-3 border-t border-white/5 pt-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        {t.sectionExport || 'Export'}
                      </span>

                      <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-white/5 border border-white/5">
                        {OUTPUT_FORMATS.map(format => (
                          <button
                            key={format}
                            onClick={() => setSettings(s => ({ ...s, format }))}
                            className={`py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border-none ${
                              settings.format === format ? 'bg-amber-500 text-black' : 'bg-transparent text-slate-400 hover:text-white'
                            }`}
                          >
                            {format}
                          </button>
                        ))}
                      </div>

                      {settings.format !== 'png' && (
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-baseline">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                              {t.labelQuality || 'Quality'}
                            </span>
                            <span className="text-[11px] text-amber-400 font-black tabular-nums">
                              {Math.round(settings.quality * 100)}%
                            </span>
                          </div>
                          <input
                            type="range" min={0.4} max={1} step={0.01}
                            value={settings.quality}
                            onChange={e => setSettings(s => ({ ...s, quality: parseFloat(e.target.value) }))}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                        </div>
                      )}
                      {settings.format === 'jpeg' && layers.length > 0 && (
                        <p className="text-[10px] text-amber-500/80 leading-relaxed">
                          {t.jpegWarning || 'JPEG has no transparency: a PNG with a transparent background will come out on black.'}
                        </p>
                      )}

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                          {t.labelMaxSize || 'Max size'}
                        </span>
                        <select
                          value={settings.maxSize}
                          onChange={e => setSettings(s => ({ ...s, maxSize: parseInt(e.target.value, 10) }))}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-xs text-white outline-none focus:border-amber-500/60 cursor-pointer"
                        >
                          {SIZE_LIMITS.map(limit => (
                            <option key={limit} value={limit}>
                              {limit === 0 ? (t.sizeOriginal || 'Original resolution') : `${limit} px`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                          {t.labelSuffix || 'Filename suffix'}
                        </span>
                        <input
                          type="text"
                          value={settings.suffix}
                          onChange={e => setSettings(s => ({ ...s, suffix: e.target.value.replace(/[\\/:*?"<>|]/g, '') }))}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-amber-500/60 transition-colors"
                        />
                      </div>

                      <div className="flex flex-col gap-2 pt-1">
                        <button
                          onClick={() => runExport('single')}
                          disabled={!activeItem || !!progress}
                          className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:from-white/10 disabled:to-white/10 disabled:text-slate-500 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer disabled:cursor-default flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-amber-500/20 disabled:shadow-none"
                        >
                          <Download className="w-4 h-4" />
                          {t.btnDownloadOne || 'Download this image'}
                        </button>

                        <button
                          onClick={() => runExport('all')}
                          disabled={items.length === 0 || !!progress}
                          className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-[11px] uppercase tracking-widest rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-default flex items-center justify-center gap-2"
                        >
                          <Package className="w-3.5 h-3.5" />
                          {(t.btnDownloadZip || 'All {n} as ZIP').replace('{n}', String(items.length))}
                        </button>

                        <button
                          onClick={copyToClipboard}
                          disabled={!activeItem || !!progress}
                          className="w-full py-2.5 bg-transparent hover:bg-white/5 border border-white/10 text-slate-300 font-black text-[11px] uppercase tracking-widest rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-default flex items-center justify-center gap-2"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          {t.copyBtn || 'Copy to clipboard'}
                        </button>
                      </div>

                      <div className="pt-1">
                        <Toggle
                          label={t.labelCompareToggle || 'Keep showing the original'}
                          checked={compare}
                          onChange={setCompare}
                          hint={t.compareHint || 'Hold to see the original (or hold Alt anywhere)'}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={e => { void addFiles(e.target.files || []); e.target.value = ''; }}
              accept={ACCEPT_ATTRIBUTE}
              multiple
              className="hidden"
            />
            <input
              type="file"
              ref={logoInputRef}
              onChange={e => { void handleLogoFile(e.target.files?.[0]); e.target.value = ''; }}
              accept={ACCEPT_ATTRIBUTE}
              className="hidden"
            />
          </section>

          {/* ================================================================ */}
          {/* Cómo funciona                                                    */}
          {/* ================================================================ */}
          <section className="space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                {t.howItWorksTitle || 'How it works'}
              </h2>
              <div className="h-1 w-16 bg-amber-500 mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {steps.map((step, i) => {
                const Art = step.art;
                return (
                  <div key={i} className="relative glass-card rounded-3xl p-6 space-y-4 border border-white/5 hover:border-amber-500/20 transition-all group">
                    <span className="absolute top-5 right-6 text-5xl font-black text-white/5 group-hover:text-amber-500/10 transition-colors">
                      {i + 1}
                    </span>
                    <Art className="w-24 h-auto text-amber-400" />
                    <h3 className="text-base font-bold text-white leading-snug">{step.title}</h3>
                    <p className="text-slate-500 text-[13px] leading-relaxed font-medium">{step.text}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ================================================================ */}
          {/* Features                                                         */}
          {/* ================================================================ */}
          <motion.section
            initial={prefersReduced ? false : 'hidden'}
            whileInView={prefersReduced ? undefined : 'visible'}
            viewport={{ once: true, amount: 0.15 }}
            variants={fadeInUp}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {features.map((feature: any, idx: number) => {
              const Icon = featureIcons[idx] || IconLayers;
              return (
                <div key={idx} className="p-7 glass-card rounded-3xl text-left hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-amber-500/5 transition-all duration-300 group border border-white/5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 group-hover:border-amber-500/40 transition-all">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-white text-lg font-bold mb-2.5 group-hover:text-amber-400 transition-colors">{feature.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">{feature.text}</p>
                </div>
              );
            })}
          </motion.section>

          {/* ================================================================ */}
          {/* Contenido SEO                                                    */}
          {/* ================================================================ */}
          <section className="space-y-20 md:space-y-24 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="space-y-7">
                <div className="inline-block px-4 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-[11px] font-black uppercase tracking-[0.2em] border border-amber-500/20">
                  {t.seoKeywords?.[0]}
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white leading-[1.05] tracking-tighter">
                  {t.seoBrowserSpeedTitle}
                </h2>
                <p className="text-slate-400 text-base md:text-lg leading-relaxed font-medium">{t.seoBrowserSpeedText}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(t.seoHeroList || []).map((point: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
                      <span className="w-7 h-7 shrink-0 bg-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                      <span className="text-slate-300 font-bold text-sm">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative glass-card rounded-[3rem] p-8 md:p-10 py-14 min-h-[360px] flex flex-col items-center justify-center gap-7 text-center overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl" />
                <IconLocal className="w-20 h-20 text-amber-400 relative" />
                <div className="space-y-3 max-w-sm relative">
                  <h3 className="text-2xl font-black text-white tracking-tight leading-tight">{t.seoPrivacyTitle}</h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">{t.seoPrivacyText}</p>
                </div>
              </div>
            </div>

            <div className="p-7 md:p-14 rounded-3xl md:rounded-[2.5rem] bg-[#150e07] border border-white/5 space-y-10">
              <div className="max-w-4xl space-y-4">
                <h2 className="text-2xl md:text-4xl font-black text-white leading-tight">{t.seoSecondaryTitle}</h2>
                <div className="h-1.5 w-20 bg-amber-500 rounded-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <div className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-3">
                    <span className="w-6 h-px bg-white/20" />
                    {t.seoUseCaseTitle}
                  </div>
                  <p className="text-slate-400 text-base leading-relaxed font-medium">{t.seoUseCaseText}</p>
                </div>
                <div className="space-y-3">
                  <div className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-3">
                    <span className="w-6 h-px bg-white/20" />
                    {t.seoEngineTitle}
                  </div>
                  <p className="text-slate-400 text-base leading-relaxed font-medium">{t.seoEngineText}</p>
                </div>
              </div>
            </div>

            {/* FAQ en acordeón */}
            <div className="max-w-4xl mx-auto w-full space-y-10">
              <div className="text-center space-y-3">
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{t.faqTitle}</h2>
                <div className="h-1 w-16 bg-amber-500 mx-auto rounded-full" />
              </div>
              <div className="grid gap-3">
                {(t.faq || []).map((faq: any, idx: number) => (
                  <details
                    key={idx}
                    className="glass-card rounded-2xl px-5 sm:px-6 py-5 text-left border border-white/5 hover:border-amber-500/20 transition-colors group [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex items-start gap-3 cursor-pointer list-none text-[15px] sm:text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                      <span className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 text-[11px] font-black">Q</span>
                      <span className="flex-1 min-w-0">{faq.question}</span>
                      <span className="shrink-0 text-amber-400 transition-transform group-open:rotate-45 text-xl leading-none">+</span>
                    </summary>
                    <p className="text-slate-400 leading-relaxed pl-9 pt-3 text-sm">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>

            {/* Palabras clave */}
            <div className="max-w-4xl mx-auto w-full space-y-5 opacity-55 text-center">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">{t.seoKeywordsTitle}</h2>
              <div className="flex flex-wrap justify-center gap-2">
                {(t.seoKeywords || []).map((keyword: string, idx: number) => (
                  <span key={idx} className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>

        <AdBanner id="adsense-watermark-snap-bottom" />
      </main>

      {/* Progreso del lote */}
      {progress && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#150e07] border border-amber-500/20 p-8 rounded-3xl shadow-2xl w-full max-w-md flex flex-col items-center text-center gap-6">
            <div className="p-4 rounded-full bg-amber-500/10 text-amber-500">
              <LayersIcon className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-white uppercase tracking-wider">
                {t.exportingTitle || 'Applying watermarks'}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {(t.progress_generating || 'Processing image {current} of {total}...')
                  .replace('{current}', String(progress.current))
                  .replace('{total}', String(progress.total))}
              </p>
            </div>
            <div className="w-full flex flex-col gap-2">
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-amber-500 font-mono font-bold tracking-wider">
                {Math.round((progress.current / progress.total) * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={t.scrollTopLabel || 'Back to top'}
          className="fixed bottom-24 right-5 md:bottom-10 md:right-10 z-[200] w-12 h-12 bg-white text-black rounded-2xl shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 cursor-pointer"
        >
          <ArrowUp className="w-5 h-5 stroke-[3]" />
        </button>
      )}
    </div>
  );
};

export default WatermarkSnap;
