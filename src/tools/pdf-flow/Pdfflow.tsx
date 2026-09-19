import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  Trash2,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Settings,
  Combine,
  Scissors,
  RotateCw,
  Image as ImageIcon,
  Plus,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Lock,
  Zap,
  Sparkles,
  Minimize2,
  LayoutGrid,
  FileImage,
  RotateCcw,
  Undo2,
  Info,
  Eye,
  Droplets,
  Hash,
  Type,
} from 'lucide-react';

import { Header } from './components/Header';
import {
  PdfHeroArt,
  IconCompress,
  IconLocalPdf,
  IconMerge,
  IconOrganize,
  IconSplit,
  IconToImage,
  StepArrange,
  StepDrop,
  StepPick,
  StepSave,
} from './components/Illustrations';
import type { Language } from '../../locales/meta';
import { AdBanner } from '../../components/shared/AdBanner';
import { PdfItem, PdfResult, ToolMode } from './types';
import { renderPdfCoverThumbnail, renderAllPageThumbnails } from './utils/pdfThumbnail';
import {
  addPageNumbers,
  addWatermark,
  compressPdf,
  extractPages,
  extractText,
  getPageCount,
  imagesToPdf,
  mergePdfs,
  organizePages,
  pagesToMarkdown,
  pagesToPlainText,
  pdfToImages,
  sanitiseForStandardFont,
  splitToZip,
  zipFiles,
  type Anchor,
  type PageOp,
} from './lib/pdfEngine';
import { PdfViewer } from './components/PdfViewer';
import { useHandoffIntake } from '../../lib/useHandoff';
import { sendToTool } from '../../lib/handoff';

interface PdfflowProps {
  lang: Language;
  dictionary?: any;
}

/** Modes that operate on exactly one PDF. */
const SINGLE_FILE_MODES: ToolMode[] = ['view', 'split', 'organize', 'compress', 'pdf2img', 'watermark', 'pagenum', 'extract'];
/** Modes whose page grid needs a thumbnail per page. */
const PAGE_GRID_MODES: ToolMode[] = ['split', 'organize'];
/** Modes that show the built-in viewer instead of an editing surface. */
const VIEWER_MODES: ToolMode[] = ['view', 'watermark', 'pagenum'];

const WATERMARK_ANCHORS: Anchor[] = [
  'top-left', 'top-center', 'top-right',
  'middle-left', 'center', 'middle-right',
  'bottom-left', 'bottom-center', 'bottom-right',
];

export const Pdfflow: React.FC<PdfflowProps> = ({ lang, dictionary }) => {
  const t = dictionary || {};

  // ---- Core state ---------------------------------------------------------
  const [activeMode, setActiveMode] = useState<ToolMode>('merge');
  const [files, setFiles] = useState<PdfItem[]>([]);
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<PdfResult | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // ---- Per-mode settings --------------------------------------------------
  const [splitType, setSplitType] = useState<'all' | 'specific'>('all');
  const [splitRange, setSplitRange] = useState('');
  const [selectedPages, setSelectedPages] = useState<number[]>([]);

  const [pageCount, setPageCount] = useState(0);
  /** Organise: the output document, as an ordered list of surviving pages. */
  const [pageOps, setPageOps] = useState<PageOp[]>([]);

  const [pageSize, setPageSize] = useState<'fit' | 'a4' | 'letter'>('fit');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [margin, setMargin] = useState(0);
  const [quality, setQuality] = useState(85);

  const [imgFormat, setImgFormat] = useState<'png' | 'jpeg'>('jpeg');
  const [imgDpi, setImgDpi] = useState(150);

  const [compressDpi, setCompressDpi] = useState(120);
  const [compressQuality, setCompressQuality] = useState(65);
  const [compressGray, setCompressGray] = useState(false);

  const [wmText, setWmText] = useState('CONFIDENCIAL');
  const [wmSize, setWmSize] = useState(48);
  const [wmOpacity, setWmOpacity] = useState(25);
  const [wmRotation, setWmRotation] = useState(45);
  const [wmColor, setWmColor] = useState('#ef4444');
  const [wmAnchor, setWmAnchor] = useState<Anchor>('center');
  const [wmBold, setWmBold] = useState(true);

  const [pnPosition, setPnPosition] = useState<'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left'>('bottom-center');
  const [pnFormat, setPnFormat] = useState<'n' | 'n_of_N' | 'page_n'>('n');
  const [pnSize, setPnSize] = useState(11);
  const [pnStartAt, setPnStartAt] = useState(1);
  const [pnFromPage, setPnFromPage] = useState(1);

  const [extractFormat, setExtractFormat] = useState<'txt' | 'md'>('txt');
  const [extractPreview, setExtractPreview] = useState('');

  // ---- Thumbnails ---------------------------------------------------------
  const [coverThumbnails, setCoverThumbnails] = useState<Record<string, string>>({});
  const [pageThumbnails, setPageThumbnails] = useState<string[]>([]);
  const [thumbProgress, setThumbProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbRunRef = useRef(0);

  // -------------------------------------------------------------------------
  // Chrome
  // -------------------------------------------------------------------------
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const formatBytes = (bytes: number, decimals = 1) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  };

  // -------------------------------------------------------------------------
  // Thumbnails
  // -------------------------------------------------------------------------

  // Cover per queued PDF, so files are identifiable at a glance.
  useEffect(() => {
    if (activeMode !== 'merge') return;
    let cancelled = false;
    files.forEach(item => {
      // Reading the map inside the updater keeps this effect free of a
      // `coverThumbnails` dependency, which would otherwise loop.
      setCoverThumbnails(prev => {
        if (prev[item.id] !== undefined) return prev;
        renderPdfCoverThumbnail(item.file, 160)
          .then(url => !cancelled && setCoverThumbnails(p => ({ ...p, [item.id]: url })))
          .catch(() => !cancelled && setCoverThumbnails(p => ({ ...p, [item.id]: '' })));
        return { ...prev, [item.id]: '' };
      });
    });
    return () => { cancelled = true; };
  }, [files, activeMode]);

  // Full page grid for split/organise, filled in progressively.
  useEffect(() => {
    if (!PAGE_GRID_MODES.includes(activeMode) || files.length === 0) {
      setPageThumbnails([]);
      setThumbProgress(null);
      return;
    }
    const run = ++thumbRunRef.current;
    setPageThumbnails([]);
    setThumbProgress({ done: 0, total: pageCount || 0 });

    renderAllPageThumbnails(
      files[0].file,
      150,
      (index, dataUrl, total) => {
        if (thumbRunRef.current !== run) return;
        setPageThumbnails(prev => {
          const next = prev.slice();
          next[index] = dataUrl;
          return next;
        });
        setThumbProgress({ done: index + 1, total });
      },
      () => thumbRunRef.current !== run
    )
      .catch(() => {})
      .finally(() => {
        if (thumbRunRef.current === run) setThumbProgress(null);
      });

    return () => { thumbRunRef.current++; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMode, files[0]?.id]);

  // -------------------------------------------------------------------------
  // Page range helpers
  // -------------------------------------------------------------------------
  const formatRangeFromPages = (pages: number[]): string => {
    if (pages.length === 0) return '';
    const sorted = [...pages].sort((a, b) => a - b);
    const parts: string[] = [];
    let start = sorted[0];
    let prev = sorted[0];
    for (let i = 1; i <= sorted.length; i++) {
      const cur = sorted[i];
      if (cur === prev + 1) { prev = cur; continue; }
      parts.push(start === prev ? `${start + 1}` : `${start + 1}-${prev + 1}`);
      if (i < sorted.length) { start = cur; prev = cur; }
    }
    return parts.join(', ');
  };

  const parseRangeToPages = (range: string, total: number): number[] => {
    const pages = new Set<number>();
    range.split(',').forEach(part => {
      const trimmed = part.trim();
      if (!trimmed) return;
      if (trimmed.includes('-')) {
        const [a, b] = trimmed.split('-');
        const start = parseInt(a, 10);
        const end = parseInt(b, 10);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) if (i >= 1 && i <= total) pages.add(i - 1);
        }
      } else {
        const n = parseInt(trimmed, 10);
        if (!isNaN(n) && n >= 1 && n <= total) pages.add(n - 1);
      }
    });
    return Array.from(pages);
  };

  const togglePageSelection = (pageIndex: number) => {
    setSelectedPages(prev => {
      const next = prev.includes(pageIndex) ? prev.filter(p => p !== pageIndex) : [...prev, pageIndex];
      setSplitRange(formatRangeFromPages(next));
      return next;
    });
  };

  const handleSplitRangeInput = (value: string) => {
    setSplitRange(value);
    setSelectedPages(parseRangeToPages(value, pageCount));
    // El resultado de antes ya no es lo que se pide: dejarlo con su boton de
    // descarga hacia que se bajara el PDF del rango anterior sin darse cuenta.
    clearResult();
  };

  // -------------------------------------------------------------------------
  // Intake
  // -------------------------------------------------------------------------
  const clearResult = () => {
    setResult(prev => {
      if (prev) {
        URL.revokeObjectURL(prev.url);
        if (prev.previewUrl && prev.previewUrl !== prev.url) URL.revokeObjectURL(prev.previewUrl);
      }
      return null;
    });
  };

  const addFiles = useCallback(
    async (incoming: File[], modeOverride?: ToolMode) => {
      const mode = modeOverride ?? activeMode;
      setStatus('idle');
      setErrorMessage('');
      setNotice('');
      clearResult();

      const wantsImages = mode === 'jpg2pdf';
      const isValid = (f: File) =>
        wantsImages
          ? f.type.startsWith('image/')
          : f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');

      const valid = incoming.filter(isValid);
      if (valid.length < incoming.length) {
        setStatus('error');
        setErrorMessage(t.invalidFormatError);
      }
      if (valid.length === 0) return;

      if (SINGLE_FILE_MODES.includes(mode)) {
        // Only one document at a time here. Say so instead of dropping the rest
        // on the floor, which is what the previous version did.
        if (valid.length > 1) {
          setNotice((t.singleFileNotice || 'This mode works on one PDF at a time — using {name}.').replace('{name}', valid[0].name));
        }
        const count = await getPageCount(valid[0]);
        setPageCount(count);
        setSelectedPages([]);
        setSplitRange('');
        setPageOps(Array.from({ length: count }, (_, i) => ({ index: i, rotation: 0 })));
        setFiles([{
          id: Math.random().toString(36).substring(2, 9),
          file: valid[0],
          name: valid[0].name,
          size: valid[0].size,
          status: 'idle',
          pageCount: count,
        }]);
        return;
      }

      const items: PdfItem[] = [];
      for (const file of valid) {
        items.push({
          id: Math.random().toString(36).substring(2, 9),
          file,
          name: file.name,
          size: file.size,
          status: 'idle',
          pageCount: wantsImages ? undefined : await getPageCount(file),
        });
      }
      setFiles(prev => [...prev, ...items]);
    },
    [activeMode, t.invalidFormatError, t.singleFileNotice]
  );

  // An image arriving from another tool is only useful for images → PDF, so
  // switch to that mode rather than rejecting it as "not a PDF".
  useHandoffIntake(file => {
    if (file.type.startsWith('image/')) {
      setActiveMode('jpg2pdf');
      addFiles([file], 'jpg2pdf');
    } else {
      addFiles([file], 'merge');
    }
  });

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) addFiles(Array.from(e.dataTransfer.files));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  // -------------------------------------------------------------------------
  // File list management
  // -------------------------------------------------------------------------
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    clearResult();
    setStatus('idle');
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= files.length) return;
    setFiles(prev => {
      const copy = [...prev];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  };

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOverItem = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
  const handleDropOnItem = (index: number) => {
    if (dragIndex === null || dragIndex === index) return setDragIndex(null);
    setFiles(prev => {
      const copy = [...prev];
      const [moved] = copy.splice(dragIndex, 1);
      copy.splice(index, 0, moved);
      return copy;
    });
    setDragIndex(null);
  };

  /**
   * Switching mode keeps the files whenever the new mode can use them, so
   * "merge these, now compress the result" doesn't mean uploading twice.
   */
  const handleModeSwitch = async (mode: ToolMode) => {
    if (mode === activeMode) return;
    setStatus('idle');
    setErrorMessage('');
    setNotice('');
    clearResult();

    const hadImages = activeMode === 'jpg2pdf';
    const wantsImages = mode === 'jpg2pdf';
    if (hadImages !== wantsImages) {
      setFiles([]);
      setPageCount(0);
      setPageOps([]);
      setSelectedPages([]);
      setSplitRange('');
      setActiveMode(mode);
      return;
    }

    if (SINGLE_FILE_MODES.includes(mode) && files.length > 0) {
      const keep = files[0];
      if (files.length > 1) {
        setNotice((t.singleFileNotice || 'This mode works on one PDF at a time — using {name}.').replace('{name}', keep.name));
      }
      const count = keep.pageCount ?? (await getPageCount(keep.file));
      setFiles([{ ...keep, pageCount: count }]);
      setPageCount(count);
      setPageOps(Array.from({ length: count }, (_, i) => ({ index: i, rotation: 0 })));
      setSelectedPages([]);
      setSplitRange('');
    }
    setActiveMode(mode);
  };

  const resetApp = () => {
    setFiles([]);
    setPageCount(0);
    setPageOps([]);
    setSelectedPages([]);
    setSplitRange('');
    setCoverThumbnails({});
    setPageThumbnails([]);
    setStatus('idle');
    setErrorMessage('');
    setNotice('');
    clearResult();
  };

  useEffect(() => () => clearResult(), []);

  // -------------------------------------------------------------------------
  // Organise actions
  // -------------------------------------------------------------------------
  const rotateOp = (position: number, delta = 90) =>
    setPageOps(prev => prev.map((op, i) => (i === position ? { ...op, rotation: (op.rotation + delta + 360) % 360 } : op)));

  const deleteOp = (position: number) => setPageOps(prev => prev.filter((_, i) => i !== position));

  const moveOp = (position: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? position - 1 : position + 1;
    setPageOps(prev => {
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      [copy[position], copy[target]] = [copy[target], copy[position]];
      return copy;
    });
  };

  // Rotate every surviving page relative to its current orientation. Setting
  // an absolute value here used to erase per-page rotations when the user
  // applied a second "rotate right/left" pass after editing individual pages.
  const rotateAllOps = (angle: number) =>
    setPageOps(prev => prev.map(op => ({ ...op, rotation: (op.rotation + angle + 360) % 360 })));

  const resetOps = () =>
    setPageOps(Array.from({ length: pageCount }, (_, i) => ({ index: i, rotation: 0 })));

  // -------------------------------------------------------------------------
  // Processing
  // -------------------------------------------------------------------------
  const canProcess = useMemo(() => {
    if (files.length === 0) return false;
    if (activeMode === 'view') return false;
    if (activeMode === 'organize') return pageOps.length > 0;
    if (activeMode === 'split' && splitType === 'specific') return selectedPages.length > 0;
    if (activeMode === 'watermark') return wmText.trim().length > 0;
    return true;
  }, [files.length, activeMode, pageOps.length, splitType, selectedPages.length, wmText]);

  /** Characters the PDF standard fonts cannot draw, dropped silently otherwise. */
  const wmDropped = useMemo(() => sanitiseForStandardFont(wmText).dropped, [wmText]);

  const publishResult = (blob: Blob, filename: string, kind: PdfResult['kind'], originalSize?: number) => {
    const url = URL.createObjectURL(blob);
    setResult({
      blob,
      url,
      filename,
      size: blob.size,
      originalSize,
      previewUrl: kind === 'pdf' ? url : undefined,
      kind,
    });
    setStatus('done');
  };

  const handleProcess = async () => {
    if (!canProcess) return;
    setStatus('processing');
    setErrorMessage('');
    clearResult();
    setProgress(null);

    const onProgress = (done: number, total: number) => setProgress({ done, total });

    try {
      if (activeMode === 'merge') {
        const blob = await mergePdfs(files.map(f => f.file), onProgress);
        publishResult(blob, 'merged-document.pdf', 'pdf');

      } else if (activeMode === 'split') {
        const source = files[0].file;
        const base = source.name.replace(/\.pdf$/i, '');
        if (splitType === 'all') {
          const blob = await splitToZip(source, onProgress);
          publishResult(blob, `${base}_pages.zip`, 'zip');
        } else {
          const indices = parseRangeToPages(splitRange, pageCount).sort((a, b) => a - b);
          if (indices.length === 0) throw new Error(t.invalidRangeError || 'Select at least one page.');
          const blob = await extractPages(source, indices);
          publishResult(blob, `${base}_extracted.pdf`, 'pdf');
        }

      } else if (activeMode === 'organize') {
        const source = files[0].file;
        const blob = await organizePages(source, pageOps);
        publishResult(blob, `${source.name.replace(/\.pdf$/i, '')}_organized.pdf`, 'pdf');

      } else if (activeMode === 'compress') {
        const source = files[0].file;
        const blob = await compressPdf(
          source,
          { quality: compressQuality, dpi: compressDpi, grayscale: compressGray },
          onProgress
        );
        publishResult(blob, `${source.name.replace(/\.pdf$/i, '')}_compressed.pdf`, 'pdf', source.size);

      } else if (activeMode === 'pdf2img') {
        const source = files[0].file;
        const pages = await pdfToImages(
          source,
          { format: imgFormat, dpi: imgDpi, quality },
          onProgress
        );
        if (pages.length === 0) throw new Error(t.statusError);
        if (pages.length === 1) {
          publishResult(pages[0].blob, pages[0].name, 'image');
        } else {
          const zip = await zipFiles(pages.map(p => ({ name: p.name, blob: p.blob })));
          publishResult(zip, `${source.name.replace(/\.pdf$/i, '')}_images.zip`, 'zip');
        }

      } else if (activeMode === 'jpg2pdf') {
        const blob = await imagesToPdf(
          files.map(f => f.file),
          { pageSize, orientation, margin, quality },
          onProgress
        );
        publishResult(blob, 'converted-images.pdf', 'pdf');

      } else if (activeMode === 'watermark') {
        const source = files[0].file;
        const hex = wmColor.replace('#', '');
        const blob = await addWatermark(
          source,
          {
            text: wmText,
            fontSize: wmSize,
            opacity: wmOpacity / 100,
            rotation: wmRotation,
            color: {
              r: parseInt(hex.slice(0, 2), 16),
              g: parseInt(hex.slice(2, 4), 16),
              b: parseInt(hex.slice(4, 6), 16),
            },
            position: wmAnchor,
            bold: wmBold,
          },
          onProgress
        );
        publishResult(blob, `${source.name.replace(/\.pdf$/i, '')}_watermarked.pdf`, 'pdf');

      } else if (activeMode === 'pagenum') {
        const source = files[0].file;
        const blob = await addPageNumbers(
          source,
          {
            position: pnPosition,
            format: pnFormat,
            fontSize: pnSize,
            startAt: pnStartAt,
            fromPage: pnFromPage,
            margin: 28,
            pageWord: t.pageLabel || 'Page',
          },
          onProgress
        );
        publishResult(blob, `${source.name.replace(/\.pdf$/i, '')}_numbered.pdf`, 'pdf');

      } else if (activeMode === 'extract') {
        const source = files[0].file;
        const pages = await extractText(source, onProgress);
        const text =
          extractFormat === 'md' ? pagesToMarkdown(pages, t.pageLabel || 'Page') : pagesToPlainText(pages);
        if (!text.trim()) throw new Error(t.noTextError || 'This PDF has no text layer — it is a scan. Text extraction needs OCR, which this tool does not do.');
        setExtractPreview(text.slice(0, 4000));
        const blob = new Blob([text], { type: extractFormat === 'md' ? 'text/markdown' : 'text/plain' });
        publishResult(blob, `${source.name.replace(/\.pdf$/i, '')}.${extractFormat}`, 'text');
      }
    } catch (e: any) {
      console.error(e);
      setStatus('error');
      setErrorMessage(e?.message || t.statusError);
    } finally {
      setProgress(null);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result.url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /** Only single-image results can travel to the image tools. */
  const sendResultTo = async (slug: string) => {
    if (!result || result.kind !== 'image') return;
    await sendToTool(slug, lang, result.blob, result.filename, 'pdf-flow');
  };

  const handleLanguageChange = (newLang: string) => {
    window.location.href = `/${newLang.toLowerCase()}/pdf-flow`;
  };

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------
  const faqs = Array.isArray(t.faq) ? t.faq : [];
  const keywords = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];
  const featuresList = Array.isArray(t.features) ? t.features : [];
  const featureIcons = [IconLocalPdf, IconMerge, IconCompress];

  const MODES: { id: ToolMode; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'view', label: t.modeView || 'View', icon: Eye as any },
    { id: 'merge', label: t.modeMerge || 'Merge', icon: Combine as any },
    { id: 'split', label: t.modeSplit || 'Split', icon: Scissors as any },
    { id: 'organize', label: t.modeOrganize || 'Organise', icon: LayoutGrid as any },
    { id: 'compress', label: t.modeCompress || 'Compress', icon: Minimize2 as any },
    { id: 'pdf2img', label: t.modePdf2Img || 'PDF to JPG', icon: FileImage as any },
    { id: 'jpg2pdf', label: t.modeJpg2Pdf || 'JPG to PDF', icon: ImageIcon as any },
    { id: 'watermark', label: t.modeWatermark || 'Watermark', icon: Droplets as any },
    { id: 'pagenum', label: t.modePageNum || 'Page numbers', icon: Hash as any },
    { id: 'extract', label: t.modeExtract || 'Extract text', icon: Type as any },
  ];

  const modeHelp: Record<ToolMode, string> = {
    view: t.viewHelp || '',
    merge: t.mergeHelp,
    split: t.splitHelp,
    organize: t.organizeHelp || t.rotateHelp,
    compress: t.compressHelp || '',
    pdf2img: t.pdf2imgHelp || '',
    jpg2pdf: t.jpg2pdfHelp,
    watermark: t.watermarkHelp || '',
    pagenum: t.pagenumHelp || '',
    extract: t.extractHelp || '',
  };

  const steps = [
    { art: StepPick, title: t.step1Title || 'Pick a tool', text: t.step1Text || 'Merge, split, organise, compress or convert. Switching keeps your files loaded.' },
    { art: StepDrop, title: t.step2Title || 'Drop your files', text: t.step2Text || 'They are read in your browser. Nothing is uploaded to any server.' },
    { art: StepArrange, title: t.step3Title || 'Arrange and adjust', text: t.step3Text || 'Reorder, rotate or delete pages on the visual grid and tune the settings.' },
    { art: StepSave, title: t.step4Title || 'Check and save', text: t.step4Text || 'The result stays on screen so you can preview it before downloading.' },
  ];

  const savings =
    result?.originalSize && result.originalSize > 0
      ? Math.round(((result.originalSize - result.size) / result.originalSize) * 100)
      : null;

  const sliderRow = (label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void, suffix = '') => (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-500">
        <span>{label}</span>
        <span className="text-red-400 tabular-nums">{value}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded bg-white/10 outline-none accent-red-500 cursor-pointer"
      />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#1c1012] text-slate-100 selection:bg-red-500/30 overflow-x-hidden font-sans">
      <Header currentLang={lang} onLanguageChange={handleLanguageChange} onReset={resetApp} t={t} />

      {/* The width cap lives on <main> so AdRail can measure a real side gap. */}
      <main className="flex-1 flex flex-col items-center pt-36 pb-32 px-4 md:px-12 relative z-10 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))]">
        <AdBanner id="adsense-pdf-flow-top" />

        <div className="w-full space-y-16 md:space-y-24">
          {/* ================================================================ */}
          {/* Hero                                                             */}
          {/* ================================================================ */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex max-w-full items-center gap-2 px-4 py-2 rounded-full bg-red-950/40 border border-red-800/30 text-red-400 text-[11px] font-black tracking-[0.2em] uppercase shadow-[0_0_25px_rgba(239,68,68,0.15)]">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.badge || t.title}</span>
              </div>

              <h1 className="text-4xl md:text-6xl xl:text-7xl font-black tracking-tight leading-[0.95] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-400">
                {t.title}
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">{t.description}</p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                {(t.seoHeroList || []).slice(0, 3).map((point: string, i: number) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-red-400" />
                    {point}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-red-500/10 blur-[80px] rounded-full" />
              <PdfHeroArt className="relative w-full max-w-lg mx-auto drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]" />
            </div>
          </section>

          {/* ================================================================ */}
          {/* Mode switcher                                                    */}
          {/* ================================================================ */}
          <section className="space-y-6">
            {/* A grid, not a tab row: ten tools no longer fit on one line, and
                a wrapping row makes the active one hard to find. */}
            <div className="p-2.5 rounded-3xl bg-[#241a1c]/80 border border-white/5 shadow-2xl">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
                {MODES.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeMode === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleModeSwitch(tab.id)}
                      aria-pressed={isActive}
                      className={`flex items-center gap-2 px-3 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer select-none outline-none min-w-0
                        ${isActive
                          ? 'bg-red-600 text-white shadow-[0_0_25px_rgba(239,68,68,0.45)]'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ============================================================== */}
            {/* Workspace                                                      */}
            {/* ============================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 space-y-5">
                {/* Contextual help */}
                <div className="px-5 py-4 bg-red-950/20 border border-red-900/30 rounded-2xl text-left text-sm text-red-300 flex items-start gap-3">
                  <Zap className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
                  <span>{modeHelp[activeMode]}</span>
                </div>

                {notice && (
                  <div className="px-5 py-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-left text-xs text-amber-300 flex items-start gap-2.5">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{notice}</span>
                  </div>
                )}

                {/* Dropzone */}
                {(SINGLE_FILE_MODES.includes(activeMode) && files.length > 0) ? null : (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative border-2 border-dashed border-red-950 hover:border-red-500/40 bg-[#241719]/30 hover:bg-[#35191c]/40 rounded-3xl p-10 md:p-16 flex flex-col items-center justify-center gap-5 cursor-pointer transition-all shadow-xl shadow-black/20"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full scale-125 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="w-20 h-20 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-center text-red-400 relative z-10 transition-transform group-hover:scale-105 group-hover:-translate-y-1 shadow-lg shadow-black/40">
                        <Upload className="w-10 h-10" />
                      </div>
                    </div>
                    <div className="space-y-2 text-center">
                      <h2 className="text-xl font-bold text-white tracking-tight">{t.dropzonePrompt}</h2>
                      <p className="text-slate-500 text-sm font-medium">
                        {activeMode === 'jpg2pdf' ? t.dropzoneSubtitleImages || t.dropzoneSubtitle : t.dropzoneSubtitle}
                      </p>
                    </div>
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInput}
                  multiple={!SINGLE_FILE_MODES.includes(activeMode)}
                  accept={activeMode === 'jpg2pdf' ? 'image/*' : 'application/pdf,.pdf'}
                  className="hidden"
                />

                {files.length > 0 && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between px-1">
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-red-400" />
                        <span>{t.filesLabel} ({files.length})</span>
                      </h2>
                      <button
                        onClick={resetApp}
                        className="text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t.resetBtn}</span>
                      </button>
                    </div>

                    {/* ---- Multi-file list (merge / jpg2pdf) ---- */}
                    {(activeMode === 'merge' || activeMode === 'jpg2pdf') && (
                      <div className="space-y-3">
                        <p className="px-1 text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                          <GripVertical className="w-3 h-3" />
                          <span>{t.dragToReorder}</span>
                        </p>
                        {files.map((item, index) => (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={handleDragOverItem}
                            onDrop={() => handleDropOnItem(index)}
                            className={`glass-card rounded-2xl p-3.5 flex items-center justify-between gap-3 transition-opacity ${dragIndex === index ? 'opacity-40' : 'opacity-100'}`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <GripVertical className="w-4 h-4 text-slate-600 cursor-grab active:cursor-grabbing shrink-0" />
                              <div className="w-11 h-13 min-h-[3.25rem] bg-red-950/30 border border-red-900/30 rounded-xl flex items-center justify-center text-red-400 shrink-0 overflow-hidden">
                                {activeMode === 'jpg2pdf' ? (
                                  <ImagePreview file={item.file} alt={item.name} />
                                ) : coverThumbnails[item.id] ? (
                                  <img src={coverThumbnails[item.id]} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                  <FileText className="w-5 h-5" />
                                )}
                              </div>
                              <div className="text-left min-w-0">
                                <h4 className="text-sm font-bold text-white truncate pr-2">{item.name}</h4>
                                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                  {formatBytes(item.size)}
                                  {item.pageCount !== undefined && ` · ${item.pageCount} ${String(t.pageCount || 'pages').toLowerCase()}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button disabled={index === 0} onClick={() => moveItem(index, 'up')} aria-label="Up"
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer">
                                <ArrowUp className="w-4 h-4" />
                              </button>
                              <button disabled={index === files.length - 1} onClick={() => moveItem(index, 'down')} aria-label="Down"
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer">
                                <ArrowDown className="w-4 h-4" />
                              </button>
                              <button onClick={() => removeFile(item.id)} aria-label={t.removeFile || 'Remove file'}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all cursor-pointer">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {files.length > 1 && activeMode === 'merge' && (
                          <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-red-950/10 border border-red-900/20 text-xs font-bold text-slate-400">
                            <span>{t.mergeSummaryLabel}</span>
                            <span className="text-red-400">
                              {files.reduce((s, f) => s + (f.pageCount || 0), 0)} {String(t.pageCount || 'pages').toLowerCase()} · {formatBytes(files.reduce((s, f) => s + f.size, 0))}
                            </span>
                          </div>
                        )}

                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full py-3.5 rounded-2xl border border-dashed border-white/10 hover:border-red-500/40 text-slate-400 hover:text-white flex items-center justify-center gap-2 text-sm font-bold transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{t.addMoreFiles}</span>
                        </button>
                      </div>
                    )}

                    {/* ---- Single-document header ---- */}
                    {SINGLE_FILE_MODES.includes(activeMode) && (
                      <div className="glass-card rounded-2xl p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 bg-red-950/30 border border-red-900/30 rounded-xl flex items-center justify-center text-red-400 shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 text-left">
                            <h4 className="text-sm font-bold text-white truncate">{files[0].name}</h4>
                            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                              {formatBytes(files[0].size)} · {pageCount} {String(t.pageCount || 'pages').toLowerCase()}
                            </p>
                          </div>
                        </div>
                        <button onClick={() => removeFile(files[0].id)} aria-label={t.resetBtn}
                          className="p-2 rounded-xl bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all cursor-pointer shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* ---- SPLIT ---- */}
                    {activeMode === 'split' && (
                      <div className="glass-card rounded-3xl p-5 md:p-6 space-y-5 text-left">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(['all', 'specific'] as const).map(type => (
                            <button
                              key={type}
                              onClick={() => setSplitType(type)}
                              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 min-h-[6rem]
                                ${splitType === type
                                  ? 'bg-red-950/20 border-red-500/40 shadow-inner'
                                  : 'bg-[#241a1c]/40 border-white/5 hover:bg-[#241a1c]/80'}`}
                            >
                              <span className="text-sm font-bold text-white">{type === 'all' ? t.splitAllPages : t.splitSpecificPages}</span>
                              <span className="text-xs text-slate-400 font-medium">{type === 'all' ? t.splitAllPagesDesc : t.splitSpecificPagesDesc}</span>
                            </button>
                          ))}
                        </div>

                        {splitType === 'specific' && (
                          <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                            <PageGridHeader t={t} thumbProgress={thumbProgress} />
                            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
                              {Array.from({ length: pageCount }).map((_, idx) => {
                                const isSelected = selectedPages.includes(idx);
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => togglePageSelection(idx)}
                                    className={`relative aspect-[3/4] rounded-lg border overflow-hidden transition-all cursor-pointer
                                      ${isSelected ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'border-white/10 hover:border-red-500/40'}`}
                                  >
                                    <PageThumb src={pageThumbnails[idx]} loading={!!thumbProgress} />
                                    <span className={`absolute inset-0 transition-colors ${isSelected ? 'bg-red-600/40' : 'bg-black/10'}`} />
                                    <span className="absolute bottom-1 right-1 text-[10px] font-black bg-black/70 text-white px-1.5 py-0.5 rounded-md">{idx + 1}</span>
                                  </button>
                                );
                              })}
                            </div>

                            <div className="space-y-2">
                              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">{t.splitRangeLabel}</label>
                              <input
                                type="text"
                                placeholder="1-3, 5"
                                value={splitRange}
                                onChange={e => handleSplitRangeInput(e.target.value)}
                                aria-invalid={splitRange.trim() !== '' && selectedPages.length === 0}
                                className="w-full bg-[#201316] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-red-500"
                              />
                              {splitRange.trim() !== '' && selectedPages.length === 0 && (
                                <p className="text-[11px] font-bold text-amber-300">
                                  {(t.rangeNoPages || 'None of those pages exist: this document has {n}.').replace('{n}', String(pageCount))}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ---- ORGANISE ---- */}
                    {activeMode === 'organize' && (
                      <div className="space-y-4">
                        <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.rotateAllLabel}</span>
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => rotateAllOps(90)} className="text-xs px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-lg border border-white/5 transition-all cursor-pointer">{t.rotateRight}</button>
                            <button onClick={() => rotateAllOps(180)} className="text-xs px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-lg border border-white/5 transition-all cursor-pointer">{t.rotate180}</button>
                            <button onClick={() => rotateAllOps(270)} className="text-xs px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-lg border border-white/5 transition-all cursor-pointer">{t.rotateLeft}</button>
                            <button onClick={resetOps} className="text-xs px-3 py-2 bg-red-950/30 hover:bg-red-950/50 text-red-400 font-bold rounded-lg border border-red-900/30 transition-all cursor-pointer flex items-center gap-1.5">
                              <Undo2 className="w-3.5 h-3.5" />
                              {t.clearRotationsBtn}
                            </button>
                          </div>
                        </div>

                        <PageGridHeader t={t} thumbProgress={thumbProgress} />

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {pageOps.map((op, position) => (
                            <div key={`${op.index}-${position}`} className="group glass-card rounded-2xl p-3 flex flex-col items-center gap-2 relative overflow-hidden">
                              <div
                                style={{ transform: `rotate(${op.rotation}deg)` }}
                                className="w-full aspect-[3/4] bg-[#201316] border border-white/10 rounded-md shadow-lg overflow-hidden flex items-center justify-center transition-transform duration-300"
                              >
                                <PageThumb src={pageThumbnails[op.index]} loading={!!thumbProgress} />
                              </div>

                              <div className="flex items-center justify-between w-full gap-1">
                                <span className="text-[10px] font-black text-slate-500">{t.pageLabel} {op.index + 1}</span>
                                {op.rotation > 0 && (
                                  <span className="text-[9px] font-black bg-red-950 text-red-400 px-1.5 py-0.5 rounded-full border border-red-900/30">{op.rotation}°</span>
                                )}
                              </div>

                              <div className="flex items-center gap-1 w-full">
                                <button onClick={() => moveOp(position, 'up')} disabled={position === 0} aria-label="Left"
                                  className="flex-1 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all disabled:opacity-25 disabled:pointer-events-none cursor-pointer flex items-center justify-center">
                                  <ArrowUp className="w-3.5 h-3.5 -rotate-90" />
                                </button>
                                <button onClick={() => rotateOp(position)} aria-label={t.rotateRight}
                                  className="flex-1 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center">
                                  <RotateCw className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => rotateOp(position, -90)} aria-label={t.rotateLeft}
                                  className="flex-1 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center">
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => moveOp(position, 'down')} disabled={position === pageOps.length - 1} aria-label="Right"
                                  className="flex-1 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all disabled:opacity-25 disabled:pointer-events-none cursor-pointer flex items-center justify-center">
                                  <ArrowDown className="w-3.5 h-3.5 -rotate-90" />
                                </button>
                                <button onClick={() => deleteOp(position)} aria-label={t.deletePage || 'Delete page'}
                                  className="flex-1 p-1.5 rounded-lg bg-white/5 hover:bg-red-500/15 text-slate-500 hover:text-red-400 transition-all cursor-pointer flex items-center justify-center">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {pageOps.length < pageCount && (
                          <p className="text-xs text-amber-400/80 font-medium px-1">
                            {(t.deletedPagesNotice || '{n} page(s) will be removed from the output.').replace('{n}', String(pageCount - pageOps.length))}
                          </p>
                        )}
                      </div>
                    )}

                    {/* ---- Viewer: see the document you are working on ---- */}
                    {VIEWER_MODES.includes(activeMode) && (
                      <PdfViewer file={files[0].file} t={t} className="h-[440px] md:h-[560px]" />
                    )}

                    {/* ---- EXTRACT: show what came out ---- */}
                    {activeMode === 'extract' && extractPreview && (
                      <div className="space-y-2">
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{t.textPreviewLabel || 'Preview'}</p>
                        <pre className="max-h-72 overflow-auto custom-scrollbar rounded-2xl border border-white/10 bg-[#160d0f] p-4 text-[11px] leading-relaxed text-slate-300 whitespace-pre-wrap break-words">
                          {extractPreview}
                        </pre>
                      </div>
                    )}

                    {/* ---- COMPRESS: preview of the first page ---- */}
                    {activeMode === 'compress' && (
                      <div className="px-5 py-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-left text-xs text-amber-300 flex items-start gap-2.5">
                        <Info className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{t.compressWarning || 'Compression rasterises each page: the file gets much smaller, but the text stops being selectable and searchable.'}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ============================================================ */}
              {/* Settings + action                                            */}
              {/* ============================================================ */}
              <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-5">
                <div className="glass-card rounded-3xl p-5 md:p-6 space-y-5 text-left shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

                  <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
                    <Settings className="w-4.5 h-4.5 w-[18px] h-[18px] text-red-400" />
                    <span>{t.settingsTitle}</span>
                  </h3>

                  {/* jpg2pdf */}
                  {activeMode === 'jpg2pdf' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">{t.jpgPageSize}</label>
                        <select value={pageSize} onChange={e => setPageSize(e.target.value as any)}
                          className="w-full bg-[#201316] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-red-500">
                          <option value="fit">{t.jpgFitOption}</option>
                          <option value="a4">{t.jpgA4Option}</option>
                          <option value="letter">{t.jpgLetterOption}</option>
                        </select>
                      </div>

                      {pageSize !== 'fit' && (
                        <div className="space-y-2">
                          <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">{t.jpgOrientation}</label>
                          <div className="grid grid-cols-2 gap-2">
                            {(['portrait', 'landscape'] as const).map(o => (
                              <button key={o} onClick={() => setOrientation(o)}
                                className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${orientation === o ? 'bg-red-950/20 border-red-500/40 text-red-400' : 'bg-[#201316]/40 border-white/5 text-slate-400 hover:text-white'}`}>
                                {o === 'portrait' ? t.portrait : t.landscape}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">{t.jpgMargin}</label>
                        <select value={margin} onChange={e => setMargin(Number(e.target.value))}
                          className="w-full bg-[#201316] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-red-500">
                          <option value={0}>{t.marginNoneOption}</option>
                          <option value={20}>{t.marginSmallOption}</option>
                          <option value={40}>{t.marginLargeOption}</option>
                        </select>
                      </div>

                      {sliderRow(t.jpgQuality, quality, 10, 100, 5, setQuality, '%')}
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        {quality >= 100
                          ? t.qualityLosslessHint || 'At 100% the original image bytes are embedded untouched.'
                          : t.qualityReencodeHint || 'Below 100% every image is re-encoded as JPEG at this quality.'}
                      </p>
                    </div>
                  )}

                  {/* pdf2img */}
                  {activeMode === 'pdf2img' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">{t.imageFormatLabel || 'Format'}</label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['jpeg', 'png'] as const).map(f => (
                            <button key={f} onClick={() => setImgFormat(f)}
                              className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${imgFormat === f ? 'bg-red-950/20 border-red-500/40 text-red-400' : 'bg-[#201316]/40 border-white/5 text-slate-400 hover:text-white'}`}>
                              {f === 'jpeg' ? 'JPG' : 'PNG'}
                            </button>
                          ))}
                        </div>
                      </div>
                      {sliderRow(t.resolutionLabel || 'Resolution', imgDpi, 72, 300, 6, setImgDpi, ' dpi')}
                      {imgFormat === 'jpeg' && sliderRow(t.jpgQuality, quality, 10, 100, 5, setQuality, '%')}
                    </div>
                  )}

                  {/* compress */}
                  {activeMode === 'compress' && (
                    <div className="space-y-4">
                      {sliderRow(t.jpgQuality, compressQuality, 20, 95, 5, setCompressQuality, '%')}
                      {sliderRow(t.resolutionLabel || 'Resolution', compressDpi, 72, 200, 6, setCompressDpi, ' dpi')}
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-400 cursor-pointer">
                        <input type="checkbox" checked={compressGray} onChange={e => setCompressGray(e.target.checked)} className="accent-red-500 w-3.5 h-3.5 cursor-pointer" />
                        {t.grayscaleLabel || 'Convert to grayscale'}
                      </label>
                    </div>
                  )}

                  {/* watermark */}
                  {activeMode === 'watermark' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">{t.watermarkTextLabel || 'Text'}</label>
                        <input
                          type="text"
                          value={wmText}
                          onChange={e => setWmText(e.target.value)}
                          maxLength={60}
                          className="w-full bg-[#201316] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-red-500"
                        />
                        {wmDropped > 0 && (
                          <p className="text-[10px] text-amber-400/90 leading-relaxed">
                            {(t.unsupportedCharsNotice || '{n} character(s) cannot be drawn with the built-in fonts and will be dropped.').replace('{n}', String(wmDropped))}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">{t.positionLabel || 'Position'}</label>
                        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-black/40">
                          {WATERMARK_ANCHORS.map(a => (
                            <button
                              key={a}
                              onClick={() => setWmAnchor(a)}
                              aria-label={a}
                              className={`aspect-[3/2] rounded-lg transition-all cursor-pointer flex items-center justify-center ${wmAnchor === a ? 'bg-red-500/25' : 'hover:bg-white/5'}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${wmAnchor === a ? 'bg-red-400' : 'bg-slate-600'}`} />
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setWmAnchor('tile')}
                          className={`w-full py-2 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${wmAnchor === 'tile' ? 'bg-red-950/20 border-red-500/40 text-red-400' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
                        >
                          {t.tileLabel || 'Tile across the page'}
                        </button>
                      </div>

                      {sliderRow(t.fontSizeLabel || 'Size', wmSize, 8, 120, 2, setWmSize, 'pt')}
                      {sliderRow(t.opacityLabel || 'Opacity', wmOpacity, 5, 100, 5, setWmOpacity, '%')}
                      {sliderRow(t.rotationLabel || 'Rotation', wmRotation, 0, 90, 5, setWmRotation, '°')}

                      <div className="flex items-center justify-between gap-3">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-400 cursor-pointer">
                          <input type="checkbox" checked={wmBold} onChange={e => setWmBold(e.target.checked)} className="accent-red-500 w-3.5 h-3.5 cursor-pointer" />
                          {t.boldLabel || 'Bold'}
                        </label>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-400 cursor-pointer">
                          {t.colorLabel || 'Colour'}
                          <input type="color" value={wmColor} onChange={e => setWmColor(e.target.value)} className="w-8 h-8 rounded-lg border border-white/20 bg-transparent cursor-pointer p-0" />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* page numbers */}
                  {activeMode === 'pagenum' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">{t.formatLabel || 'Format'}</label>
                        <select value={pnFormat} onChange={e => setPnFormat(e.target.value as any)}
                          className="w-full bg-[#201316] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-red-500">
                          <option value="n">7</option>
                          <option value="n_of_N">7 / 20</option>
                          <option value="page_n">{t.pageLabel || 'Page'} 7</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">{t.positionLabel || 'Position'}</label>
                        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-black/40">
                          {(['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'] as const).map(p => (
                            <button
                              key={p}
                              onClick={() => setPnPosition(p)}
                              aria-label={p}
                              className={`aspect-[3/2] rounded-lg transition-all cursor-pointer flex items-center justify-center ${pnPosition === p ? 'bg-red-500/25' : 'hover:bg-white/5'}`}
                            >
                              <span className={`text-[9px] font-black ${pnPosition === p ? 'text-red-400' : 'text-slate-600'}`}>7</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {sliderRow(t.fontSizeLabel || 'Size', pnSize, 7, 24, 1, setPnSize, 'pt')}

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.startAtLabel || 'Start at'}</label>
                          <input type="number" min={0} value={pnStartAt} onChange={e => setPnStartAt(Math.max(0, Number(e.target.value)))}
                            className="w-full bg-[#201316] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-red-500" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.fromPageLabel || 'From page'}</label>
                          <input type="number" min={1} max={Math.max(1, pageCount)} value={pnFromPage}
                            onChange={e => setPnFromPage(Math.min(Math.max(1, Number(e.target.value)), Math.max(1, pageCount)))}
                            className="w-full bg-[#201316] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-red-500" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* extract text */}
                  {activeMode === 'extract' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">{t.formatLabel || 'Format'}</label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['txt', 'md'] as const).map(f => (
                            <button key={f} onClick={() => setExtractFormat(f)}
                              className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${extractFormat === f ? 'bg-red-950/20 border-red-500/40 text-red-400' : 'bg-[#201316]/40 border-white/5 text-slate-400 hover:text-white'}`}>
                              {f === 'txt' ? 'TXT' : 'Markdown'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        {t.extractScanNotice || 'Only works on PDFs that carry a text layer. Scans are images and would need OCR, which this tool does not do.'}
                      </p>
                    </div>
                  )}

                  {/* Action */}
                  <div className="pt-3 border-t border-white/5 space-y-3">
                    {status === 'processing' ? (
                      <div className="w-full py-4 bg-red-600/80 rounded-2xl flex flex-col items-center justify-center gap-2 text-white font-black text-sm select-none">
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          {t.statusProcessing}
                        </span>
                        {progress && progress.total > 0 && (
                          <>
                            <span className="w-40 h-1.5 bg-black/30 rounded-full overflow-hidden">
                              <span className="block h-full bg-white transition-all duration-200" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
                            </span>
                            <span className="text-[11px] font-bold tabular-nums opacity-80">{progress.done} / {progress.total}</span>
                          </>
                        )}
                      </div>
                    ) : (
                      <button
                        disabled={!canProcess}
                        onClick={handleProcess}
                        className="w-full py-4 bg-red-600 hover:bg-red-500 disabled:bg-[#241a1c] disabled:text-slate-600 disabled:border disabled:border-white/5 disabled:shadow-none text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-[0_0_30px_rgba(239,68,68,0.3)] select-none"
                      >
                        <Zap className="w-5 h-5 stroke-[2.5]" />
                        <span>{t.processBtn || t.downloadBtn}</span>
                      </button>
                    )}

                    {status === 'error' && (
                      <div className="flex items-start gap-2 text-red-400 text-xs font-bold">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{errorMessage || t.statusError}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold border-t border-white/5 pt-3">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>{t.localDisclaimer}</span>
                  </div>
                </div>

                {/* ---- Result panel ---- */}
                {result && (
                  <div className="glass-card rounded-3xl p-5 space-y-4 text-left border border-red-500/20">
                    <div className="flex items-center gap-2 text-green-400 text-xs font-black uppercase tracking-widest">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t.statusDone}</span>
                    </div>

                    <div>
                      <p className="text-sm font-bold text-white truncate">{result.filename}</p>
                      <p className="text-[11px] text-slate-400 font-semibold mt-0.5 tabular-nums">
                        {formatBytes(result.size)}
                        {savings !== null && (
                          <span className={savings > 0 ? 'text-green-400 ml-2' : 'text-amber-400 ml-2'}>
                            {savings > 0 ? `−${savings}%` : `+${Math.abs(savings)}%`}
                          </span>
                        )}
                      </p>
                    </div>

                    {savings !== null && savings <= 0 && (
                      <p className="text-[11px] leading-relaxed text-amber-300/90 font-medium flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        {t.compressGrewNotice || 'This PDF got bigger, not smaller — that happens with text-only documents, where the original vector text already beats a rasterised page. Keep the original.'}
                      </p>
                    )}

                    {result.kind === 'pdf' && (
                      <PdfViewer file={result.blob} t={t} className="h-64" compact />
                    )}

                    <button
                      onClick={downloadResult}
                      className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                    >
                      <Download className="w-4 h-4 stroke-[3]" />
                      {t.downloadBtn}
                    </button>

                    {result.kind === 'image' && (
                      <div className="space-y-2 pt-1 border-t border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t.nextStepTitle || 'Keep going'}</p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { slug: 'compresssnap', label: t.nextCompress || 'Compress it' },
                            { slug: 'backgroundremover', label: t.nextRemoveBg || 'Remove background' },
                            { slug: 'cropsnap', label: t.nextCrop || 'Crop it' },
                          ].map(step => (
                            <button
                              key={step.slug}
                              onClick={() => sendResultTo(step.slug)}
                              className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-red-500/10 hover:border-red-500/30 text-slate-300 hover:text-white text-[11px] font-bold transition-all cursor-pointer"
                            >
                              {step.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* How it works                                                     */}
          {/* ================================================================ */}
          <section className="space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{t.howItWorksTitle || 'How it works'}</h2>
              <div className="h-1 w-16 bg-red-500 mx-auto rounded-full" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {steps.map((step, i) => {
                const Art = step.art;
                return (
                  <div key={i} className="relative glass-card rounded-3xl p-6 space-y-4 border border-white/5 hover:border-red-500/20 transition-all group">
                    <span className="absolute top-5 right-6 text-5xl font-black text-white/5 group-hover:text-red-500/10 transition-colors">{i + 1}</span>
                    <Art className="w-24 h-auto text-red-400" />
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
          {featuresList.length > 0 && (
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuresList.map((feature: any, idx: number) => {
                const Icon = featureIcons[idx] || IconLocalPdf;
                return (
                  <div key={idx} className="glass-card p-7 rounded-3xl text-left hover:-translate-y-1.5 transition-all duration-300 border border-white/5 group">
                    <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-5 group-hover:scale-110 transition-all">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2.5 tracking-tight group-hover:text-red-400 transition-colors">{feature.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">{feature.text}</p>
                  </div>
                );
              })}
            </section>
          )}

          {/* ================================================================ */}
          {/* Tool grid (internal linking + discoverability)                   */}
          {/* ================================================================ */}
          <section className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {MODES.map(mode => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  onClick={() => {
                    handleModeSwitch(mode.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="glass-card rounded-2xl p-4 flex items-center gap-3 text-left border border-white/5 hover:border-red-500/30 transition-all cursor-pointer group"
                >
                  <span className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0 group-hover:scale-110 transition-transform">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="text-sm font-bold text-white truncate">{mode.label}</span>
                </button>
              );
            })}
          </section>

          {/* ================================================================ */}
          {/* FAQ                                                              */}
          {/* ================================================================ */}
          {faqs.length > 0 && (
            <section className="max-w-4xl mx-auto w-full space-y-10">
              <div className="text-center space-y-3">
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{t.faqTitle}</h2>
                <div className="h-1 w-16 bg-red-500 mx-auto rounded-full" />
              </div>
              <div className="grid gap-3">
                {faqs.map((faq: any, idx: number) => (
                  <details key={idx} className="glass-card rounded-2xl px-6 py-5 text-left border border-white/5 hover:border-red-500/20 transition-colors group [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex items-start gap-3 cursor-pointer list-none text-base font-bold text-white group-hover:text-red-400 transition-colors">
                      <span className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 text-[11px] font-black">Q</span>
                      <span className="flex-1">{faq.question}</span>
                      <span className="shrink-0 text-red-400 transition-transform group-open:rotate-45 text-xl leading-none">+</span>
                    </summary>
                    <p className="text-slate-400 leading-relaxed pl-9 pt-3 text-sm">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* ================================================================ */}
          {/* SEO content                                                      */}
          {/* ================================================================ */}
          <section className="border-t border-white/5 pt-14 text-left max-w-4xl mx-auto space-y-12">
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">{t.seoHeroTitle}</h2>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">{t.seoHeroText}</p>
              <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {(t.seoHeroList || []).map((li: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    <span>{li}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white tracking-tight">{t.seoBrowserSpeedTitle}</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">{t.seoBrowserSpeedText}</p>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white tracking-tight">{t.seoUseCaseTitle}</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">{t.seoUseCaseText}</p>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white tracking-tight">{t.seoPrivacyTitle}</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">{t.seoPrivacyText}</p>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white tracking-tight">{t.seoSecondaryTitle}</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">{t.description}</p>
              </div>
            </div>

            {keywords.length > 0 && (
              <div className="border-t border-white/5 pt-8 space-y-3">
                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{t.seoKeywordsTitle}</h4>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((kw: string, i: number) => (
                    <span key={i} className="text-[10px] font-bold bg-[#241a1c] text-red-400 px-3 py-1.5 rounded-full border border-red-900/30 uppercase tracking-wider">{kw}</span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <AdBanner id="adsense-pdf-flow-bottom" />
      </main>

      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label={t.scrollTopLabel || 'Back to top'}
            className="fixed bottom-8 right-8 z-[200] w-12 h-12 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all active:scale-95 cursor-pointer"
          >
            <ArrowUp className="w-5 h-5 stroke-[2.5]" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

const PageThumb: React.FC<{ src?: string; loading: boolean }> = ({ src, loading }) =>
  src ? (
    <img src={src} alt="" className="w-full h-full object-cover" />
  ) : (
    <span className="w-full h-full bg-[#241618] flex items-center justify-center">
      {loading ? <Loader2 className="w-4 h-4 text-slate-600 animate-spin" /> : <FileText className="w-4 h-4 text-slate-700" />}
    </span>
  );

const PageGridHeader: React.FC<{ t: any; thumbProgress: { done: number; total: number } | null }> = ({ t, thumbProgress }) => (
  <div className="flex items-center justify-between gap-3 px-1">
    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">{t.selectPagesHint}</label>
    {thumbProgress && thumbProgress.total > 0 && (
      <span className="text-[10px] font-bold text-slate-500 tabular-nums flex items-center gap-1.5">
        <Loader2 className="w-3 h-3 animate-spin" />
        {thumbProgress.done}/{thumbProgress.total}
      </span>
    )}
  </div>
);

/** Object URLs for image previews must outlive the paint, so tie them to mount. */
const ImagePreview: React.FC<{ file: File; alt: string }> = ({ file, alt }) => {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return url ? <img src={url} alt={alt} className="w-full h-full object-cover" /> : null;
};

export default Pdfflow;
