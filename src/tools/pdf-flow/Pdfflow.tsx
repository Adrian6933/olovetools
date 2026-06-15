import React, { useState, useEffect, useCallback, useRef } from 'react';
import JSZip from 'jszip';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Combine,
  Scissors,
  RotateCw,
  Image as ImageIcon,
  Settings,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Lock,
  Zap,
  Plus,
  ArrowRight,
  RefreshCw,
  FileText
} from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { useTranslation, Language } from '../../locales/dictionary';
import { PdfItem, ToolMode } from './types';

interface PdfflowProps {
  lang: Language;
  dictionary?: any;
}

export const Pdfflow: React.FC<PdfflowProps> = ({ lang, dictionary }) => {
  const { dictionary: t } = useTranslation((lang || 'en') as Language, 'pdf-flow');

  // App States
  const [activeMode, setActiveMode] = useState<ToolMode>('merge');
  const [files, setFiles] = useState<PdfItem[]>([]);
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Mode settings
  // Split settings
  const [splitType, setSplitType] = useState<'all' | 'specific'>('all');
  const [splitRange, setSplitRange] = useState<string>('');
  
  // Rotate settings
  const [pageCount, setPageCount] = useState<number>(0);
  const [pageRotations, setPageRotations] = useState<Record<number, number>>({}); // page index -> rotation angle (0, 90, 180, 270)

  // JPG to PDF settings
  const [pageSize, setPageSize] = useState<'fit' | 'a4' | 'letter'>('fit');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [margin, setMargin] = useState<number>(0);
  const [quality, setQuality] = useState<number>(85);

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

  // Helper to load file page count
  const loadPdfPageCount = async (file: File): Promise<number> => {
    try {
      const { PDFDocument } = await import('pdf-lib');
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer, { updateMetadata: false });
      return pdf.getPageCount();
    } catch (e) {
      console.error('Error loading PDF page count:', e);
      return 0;
    }
  };

  // Handle uploaded files
  const handleUploadedFiles = async (fileList: FileList) => {
    setStatus('idle');
    setErrorMessage('');

    const newItems: PdfItem[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];

      if (activeMode === 'jpg2pdf') {
        // Only accept images in jpg2pdf mode
        if (!file.type.startsWith('image/')) continue;
        newItems.push({
          id: Math.random().toString(36).substring(2, 9),
          file,
          name: file.name,
          size: file.size,
          status: 'idle'
        });
      } else {
        // Only accept PDFs in other modes
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) continue;
        
        let pCount: number | undefined;
        if (activeMode === 'split' || activeMode === 'rotate') {
          // In split/rotate mode we only allow ONE file at a time.
          // So we empty the file list and load this one.
          setFiles([]);
          pCount = await loadPdfPageCount(file);
          setPageCount(pCount);
          setPageRotations({});
          
          const singleItem: PdfItem = {
            id: Math.random().toString(36).substring(2, 9),
            file,
            name: file.name,
            size: file.size,
            status: 'idle',
            pageCount: pCount
          };
          setFiles([singleItem]);
          return;
        }

        pCount = await loadPdfPageCount(file);
        newItems.push({
          id: Math.random().toString(36).substring(2, 9),
          file,
          name: file.name,
          size: file.size,
          status: 'idle',
          pageCount: pCount
        });
      }
    }

    if (newItems.length > 0) {
      if (activeMode === 'merge' || activeMode === 'jpg2pdf') {
        setFiles(prev => [...prev, ...newItems]);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadedFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUploadedFiles(e.target.files);
    }
  };

  // Switch between toolkit modes
  const handleModeSwitch = (mode: ToolMode) => {
    setActiveMode(mode);
    setFiles([]);
    setStatus('idle');
    setErrorMessage('');
    setPageCount(0);
    setPageRotations({});
    setSplitRange('');
  };

  // Reorder list helper (up/down arrow controls)
  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= files.length) return;

    setFiles(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  // Remove file
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    if (activeMode === 'split' || activeMode === 'rotate') {
      setPageCount(0);
      setPageRotations({});
    }
  };

  // Reset tool
  const resetApp = () => {
    setFiles([]);
    setStatus('idle');
    setErrorMessage('');
    setPageCount(0);
    setPageRotations({});
    setSplitRange('');
  };

  // HTML Image loading inside helper
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = src;
    });
  };

  // Convert non-standard images to Jpeg using HTML Canvas
  const convertImageToJpegDataUrl = (file: File, qFactor: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context could not be created.'));
            return;
          }
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', qFactor));
        };
        img.onerror = () => reject(new Error('Failed to load image element'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file as data url'));
      reader.readAsDataURL(file);
    });
  };

  // Core processing handlers
  const handleProcess = async () => {
    if (files.length === 0) return;
    setStatus('processing');
    setErrorMessage('');

    try {
      const { PDFDocument, degrees } = await import('pdf-lib');
      let resultBlob: Blob;
      let outputFilename = 'processed-document.pdf';

      if (activeMode === 'merge') {
        const mergedPdf = await PDFDocument.create();
        for (const item of files) {
          const arrayBuffer = await item.file.arrayBuffer();
          const pdf = await PDFDocument.load(arrayBuffer);
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
        const pdfBytes = await mergedPdf.save();
        resultBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        outputFilename = 'merged-document.pdf';

      } else if (activeMode === 'split') {
        const singleFile = files[0].file;
        const arrayBuffer = await singleFile.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const totalPages = pdf.getPageCount();

        if (splitType === 'all') {
          // ZIP file containing all pages
          const zip = new JSZip();
          const baseName = singleFile.name.replace(/\.pdf$/i, '');

          for (let i = 0; i < totalPages; i++) {
            const pagePdf = await PDFDocument.create();
            const [copiedPage] = await pagePdf.copyPages(pdf, [i]);
            pagePdf.addPage(copiedPage);
            const pageBytes = await pagePdf.save();
            zip.file(`${baseName}_page_${i + 1}.pdf`, pageBytes);
          }

          resultBlob = await zip.generateAsync({ type: 'blob' });
          outputFilename = `${baseName}_extracted_pages.zip`;

        } else {
          // Specific range output merged
          const targetIndices: number[] = [];
          const ranges = splitRange.split(',');
          
          for (const range of ranges) {
            const trimmed = range.trim();
            if (trimmed.includes('-')) {
              const [startStr, endStr] = trimmed.split('-');
              const start = parseInt(startStr, 10);
              const end = parseInt(endStr, 10);
              if (!isNaN(start) && !isNaN(end)) {
                for (let idx = start; idx <= end; idx++) {
                  if (idx >= 1 && idx <= totalPages) {
                    targetIndices.push(idx - 1);
                  }
                }
              }
            } else {
              const idx = parseInt(trimmed, 10);
              if (!isNaN(idx) && idx >= 1 && idx <= totalPages) {
                targetIndices.push(idx - 1);
              }
            }
          }

          if (targetIndices.length === 0) {
            throw new Error('Please specify a valid page range (e.g. 1-3, 5).');
          }

          const splitPdf = await PDFDocument.create();
          const copiedPages = await splitPdf.copyPages(pdf, targetIndices);
          copiedPages.forEach((page) => splitPdf.addPage(page));

          const pdfBytes = await splitPdf.save();
          resultBlob = new Blob([pdfBytes], { type: 'application/pdf' });
          outputFilename = `${singleFile.name.replace(/\.pdf$/i, '')}_extracted.pdf`;
        }

      } else if (activeMode === 'rotate') {
        const singleFile = files[0].file;
        const arrayBuffer = await singleFile.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const totalPages = pdf.getPageCount();

        for (let i = 0; i < totalPages; i++) {
          const page = pdf.getPage(i);
          const currentRotationAngle = page.getRotation().angle;
          const userRotation = pageRotations[i] || 0;
          page.setRotation(degrees((currentRotationAngle + userRotation) % 360));
        }

        const pdfBytes = await pdf.save();
        resultBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        outputFilename = `${singleFile.name.replace(/\.pdf$/i, '')}_rotated.pdf`;

      } else if (activeMode === 'jpg2pdf') {
        const pdfDoc = await PDFDocument.create();
        const qFactor = quality / 100;

        for (const item of files) {
          let embedImg;
          
          if (item.file.type === 'image/png') {
            const imgBytes = await item.file.arrayBuffer();
            embedImg = await pdfDoc.embedPng(imgBytes);
          } else if (item.file.type === 'image/jpeg' || item.file.type === 'image/jpg') {
            const imgBytes = await item.file.arrayBuffer();
            embedImg = await pdfDoc.embedJpg(imgBytes);
          } else {
            // WebP / HEIC / SVG fallback conversion via HTML Canvas redraw
            const jpegDataUrl = await convertImageToJpegDataUrl(item.file, qFactor);
            const jpegBytes = await fetch(jpegDataUrl).then(res => res.arrayBuffer());
            embedImg = await pdfDoc.embedJpg(jpegBytes);
          }

          const imgWidth = embedImg.width;
          const imgHeight = embedImg.height;

          let pageWidth = imgWidth;
          let pageHeight = imgHeight;

          if (pageSize === 'a4') {
            pageWidth = orientation === 'portrait' ? 595.28 : 841.89;
            pageHeight = orientation === 'portrait' ? 841.89 : 595.28;
          } else if (pageSize === 'letter') {
            pageWidth = orientation === 'portrait' ? 612 : 792;
            pageHeight = orientation === 'portrait' ? 792 : 612;
          } else {
            // Fit to image mode
            pageWidth = imgWidth + margin * 2;
            pageHeight = imgHeight + margin * 2;
          }

          const page = pdfDoc.addPage([pageWidth, pageHeight]);

          const availableWidth = pageWidth - margin * 2;
          const availableHeight = pageHeight - margin * 2;

          const widthScale = availableWidth / imgWidth;
          const heightScale = availableHeight / imgHeight;
          const scale = Math.min(widthScale, heightScale, 1.0);

          const finalScale = pageSize === 'fit' ? 1.0 : scale;
          const drawWidth = imgWidth * finalScale;
          const drawHeight = imgHeight * finalScale;

          const x = margin + (availableWidth - drawWidth) / 2;
          const y = margin + (availableHeight - drawHeight) / 2;

          page.drawImage(embedImg, {
            x,
            y,
            width: drawWidth,
            height: drawHeight
          });
        }

        const pdfBytes = await pdfDoc.save();
        resultBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        outputFilename = 'converted-images.pdf';
      } else {
        throw new Error('Invalid toolkit mode');
      }

      // Download file in browser
      const link = document.createElement('a');
      link.href = URL.createObjectURL(resultBlob);
      link.download = outputFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      setStatus('done');
    } catch (e: any) {
      console.error(e);
      setStatus('error');
      setErrorMessage(e.message || 'Failed to process document');
    }
  };

  // Rotate individual page in rotate grid
  const rotatePage = (pageIndex: number) => {
    setPageRotations(prev => {
      const current = prev[pageIndex] || 0;
      return {
        ...prev,
        [pageIndex]: (current + 90) % 360
      };
    });
  };

  // Rotate all pages globally
  const rotateAllPages = (angle: number) => {
    const nextRotations: Record<number, number> = {};
    for (let i = 0; i < pageCount; i++) {
      nextRotations[i] = angle;
    }
    setPageRotations(nextRotations);
  };

  const handleLanguageChange = (newLang: string) => {
    window.location.href = `/${newLang.toLowerCase()}/pdf-flow`;
  };

  // Map translations safely
  const faqs = Array.isArray(t.faq) ? t.faq : [];
  const keywords = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];
  const featuresList = Array.isArray(t.features) ? t.features : [];

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0506] text-slate-100 selection:bg-red-500/30 overflow-x-hidden font-sans">
      {/* Background Glow Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-25%] left-[-15%] w-[80%] h-[80%] bg-red-950/10 blur-[180px] rounded-full animate-soft-pulse"></div>
        <div className="absolute bottom-[-25%] right-[-15%] w-[70%] h-[70%] bg-rose-950/10 blur-[180px] rounded-full animate-soft-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      <Header currentLang={lang} onLanguageChange={handleLanguageChange} onReset={resetApp} t={t} />

      <main className="flex-1 flex flex-col items-center pt-36 pb-32 px-4 md:px-12 relative z-10 w-full">
        <div className="max-w-6xl w-full text-center space-y-16 md:space-y-24">
          
          {/* Hero Header */}
          <div className="flex flex-col items-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center space-x-2 px-5 py-2 rounded-full bg-red-950/40 border border-red-800/30 text-red-400 text-xs font-black tracking-widest uppercase shadow-[0_0_25px_rgba(239,68,68,0.15)]">
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

          {/* Mode Switcher Tabs */}
          <div className="flex justify-center">
            <div className="flex flex-wrap items-center justify-center p-2 rounded-2xl bg-[#140b0c]/80 border border-white/5 shadow-2xl gap-2 max-w-2xl w-full">
              {[
                { id: 'merge', label: t.modeMerge, icon: Combine },
                { id: 'split', label: t.modeSplit, icon: Scissors },
                { id: 'rotate', label: t.modeRotate, icon: RotateCw },
                { id: 'jpg2pdf', label: t.modeJpg2Pdf, icon: ImageIcon }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleModeSwitch(tab.id as ToolMode)}
                    className={`flex items-center space-x-2 px-6 py-3.5 rounded-xl text-sm font-bold transition-all cursor-pointer select-none outline-none
                      ${isActive 
                        ? 'bg-red-600 text-white shadow-[0_0_25px_rgba(239,68,68,0.45)]' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Core Box */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Box: Upload & Main Interactive */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Contextual Guidance banner */}
              <div className="px-6 py-4 bg-red-950/20 border border-red-900/30 rounded-2xl text-left text-sm text-red-400 flex items-start space-x-3">
                <Zap className="w-5 h-5 shrink-0 mt-0.5" />
                <span>
                  {activeMode === 'merge' && t.mergeHelp}
                  {activeMode === 'split' && t.splitHelp}
                  {activeMode === 'rotate' && t.rotateHelp}
                  {activeMode === 'jpg2pdf' && t.jpg2pdfHelp}
                </span>
              </div>

              {/* Dropzone */}
              {((activeMode === 'split' || activeMode === 'rotate') && files.length > 0) ? null : (
                <div 
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative border-2 border-dashed border-red-950 hover:border-red-500/40 bg-[#140a0b]/30 hover:bg-[#1f0f10]/40 rounded-3xl p-12 md:p-16 flex flex-col items-center justify-center space-y-6 cursor-pointer transition-all shadow-xl shadow-black/20"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileInput} 
                    multiple={activeMode === 'merge' || activeMode === 'jpg2pdf'} 
                    accept={activeMode === 'jpg2pdf' ? 'image/jpeg,image/png,image/webp' : 'application/pdf'} 
                    className="hidden" 
                  />
                  
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full scale-125 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-20 h-20 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-center text-red-400 relative z-10 transition-transform group-hover:scale-105 group-hover:-translate-y-1 shadow-lg shadow-black/40">
                      <Upload className="w-10 h-10 animate-float" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white tracking-tight">{t.dropzonePrompt}</h3>
                    <p className="text-slate-500 text-sm font-medium">{t.dropzoneSubtitle}</p>
                  </div>
                </div>
              )}

              {/* PDF Queue / Interactive visual workspace */}
              {files.length > 0 && (
                <div className="space-y-6">
                  
                  {/* Header info in Workspace */}
                  <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-red-400" />
                      <span>{t.modeJpg2Pdf === activeMode ? t.jpg2pdfHelp.split(',')[1] || 'Files' : 'Files'} ({files.length})</span>
                    </h2>
                    
                    <button 
                      onClick={resetApp}
                      className="text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.resetBtn}</span>
                    </button>
                  </div>

                  {/* MERGE mode view */}
                  {activeMode === 'merge' && (
                    <div className="space-y-3">
                      {files.map((item, index) => (
                        <div key={item.id} className="glass-card rounded-2xl p-4 flex items-center justify-between gap-4">
                          <div className="flex items-center space-x-4 min-w-0">
                            <div className="w-12 h-12 bg-red-950/30 border border-red-900/30 rounded-xl flex items-center justify-center text-red-400 shrink-0">
                              <FileText className="w-6 h-6" />
                            </div>
                            <div className="text-left min-w-0">
                              <h4 className="text-sm font-bold text-white truncate pr-4">{item.name}</h4>
                              <p className="text-xs text-slate-400 font-medium mt-0.5">
                                {t.fileSize}: <strong>{formatBytes(item.size)}</strong> &bull; {t.pageCount}: <strong>{item.pageCount || 0}</strong>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 shrink-0">
                            <button
                              disabled={index === 0}
                              onClick={() => moveItem(index, 'up')}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              disabled={index === files.length - 1}
                              onClick={() => moveItem(index, 'down')}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeFile(item.id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* SPLIT mode view */}
                  {activeMode === 'split' && (
                    <div className="glass-card rounded-3xl p-6 md:p-8 space-y-6 text-left relative overflow-hidden">
                      <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <div className="flex items-center space-x-4 min-w-0">
                          <div className="w-12 h-12 bg-red-950/30 border border-red-900/30 rounded-xl flex items-center justify-center text-red-400 shrink-0">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-white truncate">{files[0].name}</h4>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">
                              {t.fileSize}: <strong>{formatBytes(files[0].size)}</strong> &bull; {t.pageCount}: <strong>{pageCount}</strong>
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(files[0].id)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Split Options */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <button
                            onClick={() => setSplitType('all')}
                            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer outline-none flex flex-col justify-between h-28
                              ${splitType === 'all' 
                                ? 'bg-red-950/20 border-red-500/40 text-red-400 shadow-inner' 
                                : 'bg-[#140b0c]/40 border-white/5 text-slate-400 hover:text-white hover:bg-[#140b0c]/80'}`}
                          >
                            <span className="text-sm font-bold text-white">{t.splitAllPages}</span>
                            <span className="text-xs text-slate-400 font-medium">Extracts each page as an individual PDF wrapped in a ZIP folder.</span>
                          </button>

                          <button
                            onClick={() => setSplitType('specific')}
                            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer outline-none flex flex-col justify-between h-28
                              ${splitType === 'specific' 
                                ? 'bg-red-950/20 border-red-500/40 text-red-400 shadow-inner' 
                                : 'bg-[#140b0c]/40 border-white/5 text-slate-400 hover:text-white hover:bg-[#140b0c]/80'}`}
                          >
                            <span className="text-sm font-bold text-white">{t.splitSpecificPages}</span>
                            <span className="text-xs text-slate-400 font-medium">Extract and merge custom pages or ranges (e.g. 1, 3-5).</span>
                          </button>
                        </div>

                        {splitType === 'specific' && (
                          <div className="space-y-2 pt-2 animate-in slide-in-from-top-4 duration-300">
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.splitRangeLabel}</label>
                            <input
                              type="text"
                              placeholder="e.g. 1-3, 5"
                              value={splitRange}
                              onChange={(e) => setSplitRange(e.target.value)}
                              className="w-full bg-[#100809] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-red-500"
                            />
                            <p className="text-[10px] text-slate-500 font-medium">Use commas to separate page numbers and hyphens to define ranges (e.g., 1-4, 7).</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ROTATE mode view */}
                  {activeMode === 'rotate' && (
                    <div className="space-y-6">
                      <div className="glass-card rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
                        <div className="flex items-center space-x-4 min-w-0">
                          <div className="w-12 h-12 bg-red-950/30 border border-red-900/30 rounded-xl flex items-center justify-center text-red-400 shrink-0">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-white truncate">{files[0].name}</h4>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">
                              {t.fileSize}: <strong>{formatBytes(files[0].size)}</strong> &bull; {t.pageCount}: <strong>{pageCount}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => rotateAllPages(90)}
                            className="text-xs px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-lg border border-white/5 transition-all cursor-pointer"
                          >
                            +90° CW
                          </button>
                          <button
                            onClick={() => rotateAllPages(180)}
                            className="text-xs px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-lg border border-white/5 transition-all cursor-pointer"
                          >
                            180°
                          </button>
                          <button
                            onClick={() => rotateAllPages(270)}
                            className="text-xs px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-lg border border-white/5 transition-all cursor-pointer"
                          >
                            +90° CCW
                          </button>
                          <button
                            onClick={() => setPageRotations({})}
                            className="text-xs px-3 py-2 bg-red-950/30 hover:bg-red-950/50 text-red-400 font-bold rounded-lg border border-red-900/30 transition-all cursor-pointer"
                          >
                            Reset
                          </button>
                        </div>
                      </div>

                      {/* Pages Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {Array.from({ length: pageCount }).map((_, idx) => {
                          const rotation = pageRotations[idx] || 0;
                          return (
                            <div
                              key={idx}
                              onClick={() => rotatePage(idx)}
                              className="group glass-card rounded-2xl p-4 flex flex-col items-center justify-center aspect-[3/4] cursor-pointer hover:border-red-500/40 hover:bg-[#140a0b]/40 transition-premium relative overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/5 transition-colors"></div>
                              
                              {/* Visual Sheet of Paper representation with rotation applied */}
                              <div 
                                style={{ transform: `rotate(${rotation}deg)` }}
                                className="w-20 h-28 bg-[#100809] border border-white/10 rounded-md shadow-lg flex flex-col justify-between p-2 relative z-10 transition-transform duration-300"
                              >
                                <div className="w-5 h-1 bg-red-500/30 rounded-full"></div>
                                <div className="flex flex-col space-y-1">
                                  <div className="w-full h-1 bg-white/5 rounded-full"></div>
                                  <div className="w-4/5 h-1 bg-white/5 rounded-full"></div>
                                  <div className="w-2/3 h-1 bg-white/5 rounded-full"></div>
                                </div>
                                <div className="text-[10px] font-black text-red-500/50 uppercase tracking-widest text-center">PDF</div>
                              </div>

                              <span className="mt-4 text-xs font-black text-slate-400 group-hover:text-white transition-colors">
                                Page {idx + 1}
                              </span>

                              {rotation > 0 && (
                                <span className="absolute top-3 right-3 text-[10px] font-black bg-red-950 text-red-400 px-1.5 py-0.5 rounded-full border border-red-900/30">
                                  {rotation}°
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* JPG to PDF mode view */}
                  {activeMode === 'jpg2pdf' && (
                    <div className="space-y-3">
                      {files.map((item, index) => (
                        <div key={item.id} className="glass-card rounded-2xl p-4 flex items-center justify-between gap-4">
                          <div className="flex items-center space-x-4 min-w-0">
                            {/* Thumbnail preview */}
                            <div className="w-12 h-12 bg-black/40 border border-white/5 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                              <img 
                                src={URL.createObjectURL(item.file)} 
                                alt={item.name} 
                                className="w-full h-full object-cover" 
                                onLoad={(e) => URL.revokeObjectURL((e.target as any).src)}
                              />
                            </div>
                            <div className="text-left min-w-0">
                              <h4 className="text-sm font-bold text-white truncate pr-4">{item.name}</h4>
                              <p className="text-xs text-slate-400 font-medium mt-0.5">
                                {t.fileSize}: <strong>{formatBytes(item.size)}</strong>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 shrink-0">
                            <button
                              disabled={index === 0}
                              onClick={() => moveItem(index, 'up')}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              disabled={index === files.length - 1}
                              onClick={() => moveItem(index, 'down')}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeFile(item.id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add more files bottom helper */}
                  {(activeMode === 'merge' || activeMode === 'jpg2pdf') && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-4 rounded-2xl border border-dashed border-white/10 hover:border-red-500/40 text-slate-400 hover:text-white flex items-center justify-center space-x-2 text-sm font-bold transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{t.addMoreFiles}</span>
                    </button>
                  )}

                </div>
              )}
            </div>

            {/* Right Box: Settings and Execution Panel */}
            <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
              
              <div className="glass-card rounded-3xl p-6 md:p-8 space-y-6 text-left shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-4">
                  <Settings className="w-5 h-5 text-red-400" />
                  <span>{t.jpgOrientation ? 'Settings' : 'Settings'}</span>
                </h3>

                {/* Display current mode options */}

                {/* JPG to PDF options */}
                {activeMode === 'jpg2pdf' && (
                  <div className="space-y-4">
                    {/* Page Size */}
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.jpgPageSize}</label>
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(e.target.value as any)}
                        className="w-full bg-[#100809] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-red-500"
                      >
                        <option value="fit">Fit to Image Size</option>
                        <option value="a4">A4 (595 x 842 pt)</option>
                        <option value="letter">US Letter (612 x 792 pt)</option>
                      </select>
                    </div>

                    {/* Orientation */}
                    {pageSize !== 'fit' && (
                      <div className="space-y-2 animate-in fade-in duration-200">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.jpgOrientation}</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setOrientation('portrait')}
                            className={`px-3 py-2 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer
                              ${orientation === 'portrait'
                                ? 'bg-red-950/20 border-red-500/40 text-red-400'
                                : 'bg-[#100809]/40 border-white/5 text-slate-400 hover:text-white'}`}
                          >
                            {t.portrait}
                          </button>
                          <button
                            onClick={() => setOrientation('landscape')}
                            className={`px-3 py-2 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer
                              ${orientation === 'landscape'
                                ? 'bg-red-950/20 border-red-500/40 text-red-400'
                                : 'bg-[#100809]/40 border-white/5 text-slate-400 hover:text-white'}`}
                          >
                            {t.landscape}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Margins */}
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.jpgMargin}</label>
                      <select
                        value={margin}
                        onChange={(e) => setMargin(Number(e.target.value))}
                        className="w-full bg-[#100809] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-red-500"
                      >
                        <option value={0}>No Margins (0px)</option>
                        <option value={20}>Small (20px)</option>
                        <option value={40}>Large (40px)</option>
                      </select>
                    </div>

                    {/* Image quality factor */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                        <span>{t.jpgQuality}</span>
                        <span className="text-red-400 font-bold">{quality}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={quality}
                        onChange={(e) => setQuality(Number(e.target.value))}
                        className="w-full h-1.5 rounded bg-white/10 outline-none accent-red-500 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {activeMode === 'merge' && (
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    Assemble your PDF files. Drag-and-drop or use the arrow buttons to rearrange files prior to combining them into a single PDF.
                  </p>
                )}

                {activeMode === 'split' && (
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    Split PDF. Choose whether you want to extract every single page to a ZIP file, or combine specified pages into a new PDF.
                  </p>
                )}

                {activeMode === 'rotate' && (
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    Rotate pages of your PDF. Click individual pages to turn them 90 degrees clockwise, or apply global orientation rotations.
                  </p>
                )}

                {/* Primary Action Button */}
                <div className="pt-4 border-t border-white/5">
                  {status === 'processing' ? (
                    <div className="w-full py-4 bg-red-650 rounded-2xl flex items-center justify-center space-x-3 text-black font-black text-sm shadow-[0_0_30px_rgba(239,68,68,0.3)] select-none">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{t.statusProcessing}</span>
                    </div>
                  ) : (
                    <button
                      disabled={files.length === 0}
                      onClick={handleProcess}
                      className="w-full py-4 bg-red-600 hover:bg-red-500 disabled:bg-[#140b0c] disabled:text-slate-600 disabled:border disabled:border-white/5 disabled:shadow-none text-black font-black text-sm rounded-2xl flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:shadow-[0_0_35px_rgba(239,68,68,0.45)] select-none outline-none"
                    >
                      <Download className="w-5 h-5 stroke-[2.5]" />
                      <span>{t.downloadBtn}</span>
                    </button>
                  )}

                  {status === 'done' && (
                    <div className="flex items-center justify-center space-x-2 text-green-400 text-xs font-bold mt-4 animate-in fade-in duration-300">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t.statusDone}</span>
                    </div>
                  )}

                  {status === 'error' && (
                    <div className="flex items-center justify-center space-x-2 text-red-400 text-xs font-bold mt-4 animate-in fade-in duration-300">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage || t.statusError}</span>
                    </div>
                  )}
                </div>

                {/* Privacy disclaimer */}
                <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-bold border-t border-white/5 pt-4">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Processed locally in browser. No file uploads.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Features Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16">
            {featuresList.map((feature: any, idx: number) => (
              <div 
                key={idx}
                className="glass-card p-8 rounded-3xl text-left hover:-translate-y-1 transition-all duration-300 glow-red border border-white/5 relative overflow-hidden"
              >
                <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-6">
                  {idx === 0 && <Lock className="w-6 h-6" />}
                  {idx === 1 && <Combine className="w-6 h-6" />}
                  {idx === 2 && <Zap className="w-6 h-6" />}
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed font-medium">{feature.text}</p>
              </div>
            ))}
          </div>

          {/* FAQ Accordion Section */}
          {faqs.length > 0 && (
            <div className="space-y-12 max-w-4xl mx-auto pt-16 text-left">
              <h2 className="text-3xl font-black text-white tracking-tight border-b border-white/5 pb-4 flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-red-400 animate-float" />
                <span>{t.faqTitle}</span>
              </h2>
              
              <div className="space-y-6">
                {faqs.map((faqItem: any, idx: number) => (
                  <div key={idx} className="glass-card rounded-2xl p-6 md:p-8 space-y-3">
                    <h4 className="text-lg font-bold text-white tracking-tight flex items-start gap-3">
                      <span className="text-red-400 font-black">Q:</span>
                      <span>{faqItem.question}</span>
                    </h4>
                    <p className="text-slate-400 text-sm leading-relaxed font-medium pl-6">
                      {faqItem.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Engine Optimization sitemap / metadata blocks */}
          <div className="border-t border-white/5 pt-16 text-left max-w-4xl mx-auto space-y-12">
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-white tracking-tight uppercase tracking-wider">{t.seoHeroTitle}</h2>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">{t.seoHeroText}</p>
              <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {Array.isArray(t.seoHeroList) && t.seoHeroList.map((liText: string, i: number) => (
                  <li key={i} className="flex items-center space-x-2 text-xs font-bold text-red-400 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    <span>{liText}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white tracking-tight">{t.seoBrowserSpeedTitle}</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">{t.seoBrowserSpeedText}</p>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white tracking-tight">{t.seoUseCaseTitle}</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">{t.seoUseCaseText}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">{t.seoKeywordsTitle}</h4>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((kw: string, i: number) => (
                    <span 
                      key={i} 
                      className="text-[10px] font-bold bg-[#140b0c] text-red-400 px-3 py-1.5 rounded-full border border-red-900/30 uppercase tracking-wider"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer lang={lang} t={t} onOpenModal={setActiveModal} />

      <LegalModal 
        isOpen={activeModal !== null} 
        onClose={() => setActiveModal(null)} 
        title={
          activeModal === 'privacy' ? t.privacyPolicy :
          activeModal === 'terms' ? t.termsOfService :
          t.cookiePolicy
        }
        content={
          activeModal === 'privacy' ? t.privacyContent :
          activeModal === 'terms' ? t.termsContent :
          t.cookiesContent
        }
        t={t}
      />

      {/* Floating Scroll to Top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-[200] w-12 h-12 bg-red-600 hover:bg-red-500 text-black rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all active:scale-95 cursor-pointer outline-none"
          >
            <ArrowUp className="w-5 h-5 stroke-[2.5]" />
          </motion.button>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Pdfflow;
