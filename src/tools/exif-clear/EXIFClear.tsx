import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Trash2, 
  Upload, 
  Download, 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  MapPin, 
  Camera, 
  Calendar, 
  Image as ImageIcon,
  Cpu
} from 'lucide-react';
import { createTranslator, type Language } from '../../locales/meta';
import { AdBanner } from '../../components/shared/AdBanner';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { legalTranslations } from '../../locales/legal';
import JSZip from 'jszip';

// Interface declarations
interface ImageMetadata {
  make?: string;
  model?: string;
  dateTime?: string;
  software?: string;
  gps?: {
    latitude: number;
    longitude: number;
    formatted?: string;
  };
  hasMetadata: boolean;
  hasGps: boolean;
}

interface LoadedFile {
  id: string;
  file: File;
  previewUrl: string;
  arrayBuffer: ArrayBuffer;
  metadata: ImageMetadata;
  status: 'pending' | 'cleaning' | 'cleaned' | 'error';
}

interface EXIFClearProps {
  lang: string;
  dictionary: any;
}

// Binary Helper Class for TIFF parsing
class BinaryReader {
  private view: DataView;
  private littleEndian: boolean = true;

  constructor(buffer: ArrayBuffer, byteOffset: number = 0, byteLength?: number) {
    this.view = new DataView(buffer, byteOffset, byteLength);
  }

  getUint8(offset: number): number {
    return this.view.getUint8(offset);
  }

  getUint16(offset: number): number {
    return this.view.getUint16(offset, this.littleEndian);
  }

  getUint32(offset: number): number {
    return this.view.getUint32(offset, this.littleEndian);
  }

  setLittleEndian(le: boolean) {
    this.littleEndian = le;
  }

  getString(offset: number, length: number): string {
    let str = '';
    for (let i = 0; i < length; i++) {
      if (offset + i >= this.view.byteLength) break;
      const char = this.view.getUint8(offset + i);
      if (char === 0) break; // null-terminated
      str += String.fromCharCode(char);
    }
    return str.trim();
  }
}

// Helper to parse directory entries (IFD)
function parseIFD(
  reader: BinaryReader, 
  offset: number, 
  exifOffsetHandler?: (off: number) => void, 
  gpsOffsetHandler?: (off: number) => void
): Record<number, any> {
  const tags: Record<number, any> = {};
  if (offset + 2 > reader.getUint8.length * 256 && offset >= 1000000) return tags; // Safe upper bound check
  
  try {
    const numEntries = reader.getUint16(offset);
    let entryOffset = offset + 2;

    for (let i = 0; i < numEntries; i++) {
      const tagId = reader.getUint16(entryOffset);
      const type = reader.getUint16(entryOffset + 2);
      const count = reader.getUint32(entryOffset + 4);
      const valOffset = reader.getUint32(entryOffset + 8);

      let val: any = undefined;
      
      if (type === 2) { // ASCII
        if (count <= 4) {
          val = reader.getString(entryOffset + 8, count);
        } else {
          val = reader.getString(valOffset, count);
        }
      } else if (type === 3) { // SHORT
        if (count === 1) {
          val = reader.getUint16(entryOffset + 8);
        } else if (count === 2) {
          val = [reader.getUint16(valOffset), reader.getUint16(valOffset + 2)];
        }
      } else if (type === 4) { // LONG
        if (count === 1) {
          val = reader.getUint32(entryOffset + 8);
        }
      } else if (type === 5 || type === 10) { // RATIONAL / SRATIONAL
        if (count === 1) {
          const num = reader.getUint32(valOffset);
          const den = reader.getUint32(valOffset + 4);
          val = den === 0 ? 0 : num / den;
        } else {
          val = [];
          for (let j = 0; j < count; j++) {
            const num = reader.getUint32(valOffset + j * 8);
            const den = reader.getUint32(valOffset + j * 8 + 4);
            val.push(den === 0 ? 0 : num / den);
          }
        }
      }

      if (val !== undefined) {
        tags[tagId] = val;
      }

      if (tagId === 0x8769 && exifOffsetHandler) {
        exifOffsetHandler(valOffset);
      }
      if (tagId === 0x8825 && gpsOffsetHandler) {
        gpsOffsetHandler(valOffset);
      }

      entryOffset += 12;
    }
  } catch (err) {
    console.error("IFD reading bounds error:", err);
  }

  return tags;
}

// Helper to parse GPS coordinates
function parseGPS(gpsTags: Record<number, any>): { latitude: number, longitude: number, formatted: string } | undefined {
  const latRef = gpsTags[1] as string; // 'N' or 'S'
  const latVal = gpsTags[2] as number[]; // [deg, min, sec]
  const lngRef = gpsTags[3] as string; // 'E' or 'W'
  const lngVal = gpsTags[4] as number[]; // [deg, min, sec]

  if (!latVal || !lngVal || !latRef || !lngRef) return undefined;

  const getDecimal = (vals: number[]): number => {
    if (!vals || vals.length < 3) return 0;
    return vals[0] + vals[1]/60 + vals[2]/3600;
  };

  let lat = getDecimal(latVal);
  if (latRef === 'S') lat = -lat;

  let lng = getDecimal(lngVal);
  if (lngRef === 'W') lng = -lng;

  const latDeg = Math.floor(latVal[0]);
  const latMin = Math.floor(latVal[1]);
  const latSec = (latVal[2] || 0).toFixed(2);
  
  const lngDeg = Math.floor(lngVal[0]);
  const lngMin = Math.floor(lngVal[1]);
  const lngSec = (lngVal[2] || 0).toFixed(2);

  const formatted = `${latDeg}°${latMin}'${latSec}"${latRef}, ${lngDeg}°${lngMin}'${lngSec}"${lngRef}`;

  return { latitude: lat, longitude: lng, formatted };
}

// Parse JPEG Metadata
function parseJpegMetadata(arrayBuffer: ArrayBuffer): ImageMetadata {
  const view = new DataView(arrayBuffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xFFD8) {
    return { hasMetadata: false, hasGps: false };
  }

  let offset = 2;
  const length = view.byteLength;
  
  let make = '';
  let model = '';
  let dateTime = '';
  let software = '';
  let gps: any = undefined;
  let hasMetadata = false;
  let hasGps = false;

  while (offset < length - 2) {
    const marker = view.getUint16(offset);
    if (marker === 0xFFDA) { // SOS segment
      break;
    }
    
    if (offset + 4 > length) break;
    const blockLength = view.getUint16(offset + 2);
    
    if (marker === 0xFFE1 && offset + 10 <= length) { // APP1 EXIF segment
      const sig = String.fromCharCode(
        view.getUint8(offset + 4),
        view.getUint8(offset + 5),
        view.getUint8(offset + 6),
        view.getUint8(offset + 7),
        view.getUint8(offset + 8),
        view.getUint8(offset + 9)
      );

      if (sig === 'Exif\0\0') {
        hasMetadata = true;
        const tiffOffset = offset + 10;
        try {
          const reader = new BinaryReader(arrayBuffer, tiffOffset);
          const endianSig = reader.getUint16(0);
          const le = endianSig === 0x4949; // 'II'
          reader.setLittleEndian(le);
          
          if (reader.getUint16(2) === 0x002A) {
            const ifd0Offset = reader.getUint32(4);
            
            let exifIFDOffset = 0;
            let gpsIFDOffset = 0;

            const ifd0Tags = parseIFD(
              reader, 
              ifd0Offset, 
              (exifOff) => { exifIFDOffset = exifOff; }, 
              (gpsOff) => { gpsIFDOffset = gpsOff; }
            );

            make = ifd0Tags[0x010F] || '';
            model = ifd0Tags[0x0110] || '';
            dateTime = ifd0Tags[0x0132] || '';
            software = ifd0Tags[0x0131] || '';

            if (exifIFDOffset > 0) {
              const exifTags = parseIFD(reader, exifIFDOffset);
              if (!dateTime && exifTags[0x9003]) {
                dateTime = exifTags[0x9003];
              }
            }

            if (gpsIFDOffset > 0) {
              const gpsTags = parseIFD(reader, gpsIFDOffset);
              const parsedGps = parseGPS(gpsTags);
              if (parsedGps) {
                gps = parsedGps;
                hasGps = true;
              }
            }
          }
        } catch (e) {
          console.error("EXIF TIFF parse error:", e);
        }
      }
    }
    
    offset += blockLength + 2;
  }

  return { make, model, dateTime, software, gps, hasMetadata, hasGps };
}

// Parse PNG Metadata
function parsePngMetadata(arrayBuffer: ArrayBuffer): ImageMetadata {
  const view = new DataView(arrayBuffer);
  if (
    view.byteLength < 8 ||
    view.getUint32(0) !== 0x89504E47 ||
    view.getUint32(4) !== 0x0D0A1A0A
  ) {
    return { hasMetadata: false, hasGps: false };
  }

  let offset = 8;
  const length = view.byteLength;

  let make = '';
  let model = '';
  let dateTime = '';
  let software = '';
  let gps: any = undefined;
  let hasMetadata = false;
  let hasGps = false;

  while (offset < length - 8) {
    const chunkLength = view.getUint32(offset);
    const chunkType = String.fromCharCode(
      view.getUint8(offset + 4),
      view.getUint8(offset + 5),
      view.getUint8(offset + 6),
      view.getUint8(offset + 7)
    );

    if (chunkType === 'IEND') break;

    if (chunkType === 'eXIf') {
      hasMetadata = true;
      const tiffOffset = offset + 8;
      try {
        const reader = new BinaryReader(arrayBuffer, tiffOffset, chunkLength);
        const endianSig = reader.getUint16(0);
        const le = endianSig === 0x4949; // 'II'
        reader.setLittleEndian(le);
        
        if (reader.getUint16(2) === 0x002A) {
          const ifd0Offset = reader.getUint32(4);
          
          let exifIFDOffset = 0;
          let gpsIFDOffset = 0;

          const ifd0Tags = parseIFD(
            reader, 
            ifd0Offset, 
            (exifOff) => { exifIFDOffset = exifOff; }, 
            (gpsOff) => { gpsIFDOffset = gpsOff; }
          );

          make = ifd0Tags[0x010F] || '';
          model = ifd0Tags[0x0110] || '';
          dateTime = ifd0Tags[0x0132] || '';
          software = ifd0Tags[0x0131] || '';

          if (exifIFDOffset > 0) {
            const exifTags = parseIFD(reader, exifIFDOffset);
            if (!dateTime && exifTags[0x9003]) {
              dateTime = exifTags[0x9003];
            }
          }

          if (gpsIFDOffset > 0) {
            const gpsTags = parseIFD(reader, gpsIFDOffset);
            const parsedGps = parseGPS(gpsTags);
            if (parsedGps) {
              gps = parsedGps;
              hasGps = true;
            }
          }
        }
      } catch (e) {
        console.error("PNG eXIf parsing error:", e);
      }
    } else if (['tEXt', 'zTXt', 'iTXt'].includes(chunkType)) {
      if (chunkType === 'tEXt') {
        let key = '';
        let idx = offset + 8;
        const limit = offset + 8 + chunkLength;
        while (idx < limit) {
          const char = view.getUint8(idx++);
          if (char === 0) break;
          key += String.fromCharCode(char);
        }
        let val = '';
        while (idx < limit) {
          val += String.fromCharCode(view.getUint8(idx++));
        }
        if (key.toLowerCase() === 'software') {
          software = val.trim();
          hasMetadata = true;
        } else if (key.toLowerCase() === 'creation time') {
          dateTime = val.trim();
          hasMetadata = true;
        }
      }
    }

    offset += 12 + chunkLength;
  }

  return { make, model, dateTime, software, gps, hasMetadata, hasGps };
}

// Strip JPEG Metadata APP markers
function stripJpegMetadata(arrayBuffer: ArrayBuffer, options: { gpsOnly: boolean; cameraOnly: boolean; fullStrip: boolean }): ArrayBuffer {
  const view = new DataView(arrayBuffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xFFD8) {
    return arrayBuffer;
  }

  const length = view.byteLength;
  const segments: { offset: number; size: number; keep: boolean }[] = [];
  
  segments.push({ offset: 0, size: 2, keep: true }); // SOI

  let offset = 2;
  let stopLoop = false;

  while (offset < length - 2 && !stopLoop) {
    const marker = view.getUint16(offset);
    
    if (marker === 0xFFDA) { // SOS marker
      segments.push({ offset, size: length - offset, keep: true });
      stopLoop = true;
      break;
    }

    if (offset + 4 > length) break;
    const blockLength = view.getUint16(offset + 2);
    const size = blockLength + 2;

    let keep = true;
    if (options.fullStrip) {
      if (marker === 0xFFE1 || marker === 0xFFED || marker === 0xFFFE) {
        keep = false;
      }
    } else if (options.gpsOnly) {
      if (marker === 0xFFE1) {
        keep = false;
      }
    } else if (options.cameraOnly) {
      if (marker === 0xFFE1 || marker === 0xFFED) {
        keep = false;
      }
    }

    segments.push({ offset, size, keep });
    offset += size;
  }

  let newSize = 0;
  segments.forEach(s => {
    if (s.keep) newSize += s.size;
  });

  const outBuffer = new Uint8Array(newSize);
  let writeOffset = 0;
  segments.forEach(s => {
    if (s.keep) {
      outBuffer.set(new Uint8Array(arrayBuffer, s.offset, s.size), writeOffset);
      writeOffset += s.size;
    }
  });

  return outBuffer.buffer;
}

// Strip PNG Metadata chunks
function stripPngMetadata(arrayBuffer: ArrayBuffer, options: { gpsOnly: boolean; cameraOnly: boolean; fullStrip: boolean }): ArrayBuffer {
  const view = new DataView(arrayBuffer);
  if (
    view.byteLength < 8 ||
    view.getUint32(0) !== 0x89504E47 ||
    view.getUint32(4) !== 0x0D0A1A0A
  ) {
    return arrayBuffer;
  }

  const length = view.byteLength;
  const segments: { offset: number; size: number; keep: boolean }[] = [];
  
  segments.push({ offset: 0, size: 8, keep: true }); // PNG Signature

  let offset = 8;
  while (offset < length - 8) {
    const chunkLength = view.getUint32(offset);
    const chunkType = String.fromCharCode(
      view.getUint8(offset + 4),
      view.getUint8(offset + 5),
      view.getUint8(offset + 6),
      view.getUint8(offset + 7)
    );

    const size = 12 + chunkLength;
    let keep = true;

    if (options.fullStrip) {
      if (['eXIf', 'tEXt', 'zTXt', 'iTXt'].includes(chunkType)) {
        keep = false;
      }
    } else if (options.gpsOnly) {
      if (chunkType === 'eXIf') {
        keep = false;
      }
    } else if (options.cameraOnly) {
      if (['eXIf', 'tEXt', 'zTXt', 'iTXt'].includes(chunkType)) {
        keep = false;
      }
    }

    segments.push({ offset, size, keep });
    offset += size;

    if (chunkType === 'IEND') {
      if (offset < length) {
        segments.push({ offset, size: length - offset, keep: true });
      }
      break;
    }
  }

  let newSize = 0;
  segments.forEach(s => {
    if (s.keep) newSize += s.size;
  });

  const outBuffer = new Uint8Array(newSize);
  let writeOffset = 0;
  segments.forEach(s => {
    if (s.keep) {
      outBuffer.set(new Uint8Array(arrayBuffer, s.offset, s.size), writeOffset);
      writeOffset += s.size;
    }
  });

  return outBuffer.buffer;
}

export const EXIFClear: React.FC<EXIFClearProps> = ({ lang, dictionary }) => {
  const t = createTranslator(dictionary);

  // App States
  const [loadedFiles, setLoadedFiles] = useState<LoadedFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  
  // Options
  const [stripLevel, setStripLevel] = useState<'full' | 'gps' | 'camera'>('full');
  
  // Exporter progress
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>('');

  // Modals
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'privacy' | 'terms' | 'cookies'>('privacy');

  // Refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragCounterRef = useRef<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Auto-select first loaded file
  useEffect(() => {
    if (loadedFiles.length > 0 && !selectedFileId) {
      setSelectedFileId(loadedFiles[0].id);
    }
  }, [loadedFiles, selectedFileId]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = async (files: File[]) => {
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const imageFiles = files.filter(f => {
      const extension = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
      return validImageTypes.includes(f.type) || ['.jpg', '.jpeg', '.png'].includes(extension);
    });

    if (imageFiles.length === 0) return;

    const newLoadedFiles: LoadedFile[] = [];

    for (const file of imageFiles) {
      const id = Math.random().toString(36).substring(2, 9);
      const previewUrl = URL.createObjectURL(file);
      
      const fileData = await new Promise<LoadedFile>((resolve) => {
        const fileReader = new FileReader();
        fileReader.onload = (event) => {
          const ab = event.target?.result as ArrayBuffer;
          let meta: ImageMetadata = { hasMetadata: false, hasGps: false };
          
          try {
            const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
            if (isPng) {
              meta = parsePngMetadata(ab);
            } else {
              meta = parseJpegMetadata(ab);
            }
          } catch (err) {
            console.error('Metadata parsing crash:', err);
          }

          resolve({
            id,
            file,
            previewUrl,
            arrayBuffer: ab,
            metadata: meta,
            status: 'pending'
          });
        };
        fileReader.onerror = () => {
          resolve({
            id,
            file,
            previewUrl,
            arrayBuffer: new ArrayBuffer(0),
            metadata: { hasMetadata: false, hasGps: false },
            status: 'error'
          });
        };
        fileReader.readAsArrayBuffer(file);
      });

      newLoadedFiles.push(fileData);
    }

    setLoadedFiles(prev => [...prev, ...newLoadedFiles]);
  };

  const deleteFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetFile = loadedFiles.find(lf => lf.id === id);
    if (targetFile) {
      URL.revokeObjectURL(targetFile.previewUrl);
    }
    setLoadedFiles(prev => prev.filter(lf => lf.id !== id));
    if (selectedFileId === id) {
      setSelectedFileId(null);
    }
  };

  const clearAll = () => {
    loadedFiles.forEach(lf => URL.revokeObjectURL(lf.previewUrl));
    setLoadedFiles([]);
    setSelectedFileId(null);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleDownload = async () => {
    if (loadedFiles.length === 0) return;
    setIsCompiling(true);

    const opts = {
      gpsOnly: stripLevel === 'gps',
      cameraOnly: stripLevel === 'camera',
      fullStrip: stripLevel === 'full'
    };

    try {
      const processedFilesList = loadedFiles.map((lf, idx) => {
        setProgressText(
          (t.progress_clearing || 'Stripping metadata from image {current} of {total}...')
            .replace('{current}', String(idx + 1))
            .replace('{total}', String(loadedFiles.length))
        );

        let cleanBuffer: ArrayBuffer;
        const isPng = lf.file.type === 'image/png' || lf.file.name.toLowerCase().endsWith('.png');
        
        if (isPng) {
          cleanBuffer = stripPngMetadata(lf.arrayBuffer, opts);
        } else {
          cleanBuffer = stripJpegMetadata(lf.arrayBuffer, opts);
        }

        return {
          filename: lf.file.name,
          mime: lf.file.type,
          buffer: cleanBuffer
        };
      });

      if (processedFilesList.length === 1) {
        // Direct single file download
        const single = processedFilesList[0];
        const blob = new Blob([single.buffer], { type: single.mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Clean name prefix
        const nameParts = single.filename.split('.');
        const ext = nameParts.pop();
        a.download = `${nameParts.join('.')}_clean.${ext}`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      } else {
        // Zip pack download
        const zip = new JSZip();
        processedFilesList.forEach(item => {
          const blob = new Blob([item.buffer], { type: item.mime });
          zip.file(item.filename, blob);
        });

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cleaned_images.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }

      // Mark all as cleaned in UI
      setLoadedFiles(prev => prev.map(lf => ({ ...lf, status: 'cleaned' })));
    } catch (err) {
      console.error('Stripping operations failed:', err);
      alert('An error occurred while cleaning metadata headers.');
    } finally {
      setIsCompiling(false);
      setProgressText('');
    }
  };

  const handleOpenLegal = (type: 'privacy' | 'terms' | 'cookies') => {
    setModalType(type);
    setModalOpen(true);
  };

  const resetAll = () => {
    clearAll();
    setStripLevel('full');
  };

  const selectedFile = loadedFiles.find(lf => lf.id === selectedFileId);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans flex flex-col">
      <Header
        currentLang={lang}
        onLanguageChange={(newLang) => {
          window.location.href = `/${newLang.toLowerCase()}/exif-clear`;
        }}
        onReset={resetAll}
        t={t}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-12 pt-36 pb-24 relative z-10 flex flex-col justify-center">
        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-exif-clear-top" />
        {/* Title SEO Hero Section */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-4xl md:text-6xl font-black font-outfit tracking-tight text-white mb-4">
            {t.seoHeroTitle || 'Strip GPS and Camera EXIF Metadata Offline'}
          </h1>
          <p className="text-slate-400 text-lg max-w-3xl mx-auto leading-relaxed font-medium">
            {t.seoHeroText || 'Protect your privacy before sharing photographs. EXIF Cleaner parses and removes metadata headers locally.'}
          </p>
        </div>

        {/* 3-Column Secure whiteboard Dashboard */}
        <div className="w-full bg-[#022c22]/10 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 md:p-8 shadow-2xl relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch glow-emerald">
          
          {/* COLUMN 1: Drag-and-drop & File rack (Col-span 4) */}
          <div className="lg:col-span-4 flex flex-col gap-6 bg-black/20 p-6 rounded-2xl border border-white/5 justify-between">
            <div className="flex flex-col gap-6 h-full">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  {t.label_files_loaded || 'Loaded Files'}
                </h3>
                {loadedFiles.length > 0 && (
                  <button 
                    onClick={clearAll}
                    className="text-xs font-black uppercase text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1 cursor-pointer border-none bg-transparent outline-none"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t.btn_clear_all || 'Clear All'}
                  </button>
                )}
              </div>

              {/* Upload Input & Area */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept="image/jpeg,image/jpg,image/png"
                multiple
                className="hidden"
              />

              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:bg-black/40 group text-center relative ${
                  isDragging 
                    ? 'border-emerald-400 bg-emerald-500/10' 
                    : 'border-white/15 hover:border-emerald-500/50 bg-black/20'
                }`}
              >
                <Upload className="w-6 h-6 text-slate-500 group-hover:text-emerald-400 transition-colors animate-bounce" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-slate-200 transition-colors max-w-[200px]">
                  {t.label_upload_box || 'Drag & drop images here or click to browse'}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  JPEG / PNG only
                </span>
              </div>

              {/* Scrollable File List */}
              <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 max-h-[300px] lg:max-h-[350px]">
                {loadedFiles.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
                    <ImageIcon className="w-8 h-8 opacity-20 mb-2" />
                    <span className="text-xs uppercase font-bold tracking-wider opacity-60">
                      {t.no_files_loaded || 'No images loaded yet'}
                    </span>
                  </div>
                ) : (
                  loadedFiles.map(lf => {
                    const isSelected = lf.id === selectedFileId;
                    let badgeClass = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
                    let badgeText = t.status_clean || 'Clean';

                    if (lf.metadata.hasGps) {
                      badgeClass = 'bg-red-500/10 text-red-400 border-red-500/20';
                      badgeText = t.status_has_gps || 'GPS Found';
                    } else if (lf.metadata.hasMetadata) {
                      badgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                      badgeText = t.status_has_meta || 'EXIF Found';
                    }

                    return (
                      <div
                        key={lf.id}
                        onClick={() => setSelectedFileId(lf.id)}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer text-left select-none relative group ${
                          isSelected 
                            ? 'bg-emerald-500/5 border-emerald-500/50' 
                            : 'border-white/5 bg-black/30 hover:border-white/10'
                        }`}
                      >
                        <img
                          src={lf.previewUrl}
                          alt="Thumbnail"
                          className="w-10 h-10 object-cover rounded-lg bg-black/40 border border-white/10"
                        />
                        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-white truncate max-w-[130px] md:max-w-none">
                            {lf.file.name}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide leading-none ${badgeClass}`}>
                              {badgeText}
                            </span>
                            {lf.status === 'cleaned' && (
                              <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-0.5 uppercase tracking-wide">
                                <CheckCircle className="w-3 h-3" />
                                Done
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={(e) => deleteFile(lf.id, e)}
                          className="w-7 h-7 bg-white/5 border border-white/10 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover:opacity-100 outline-none"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          </div>

          {/* COLUMN 2: Metadata Property Inspector (Col-span 5) */}
          <div className="lg:col-span-5 flex flex-col gap-6 bg-black/40 border border-white/5 p-6 rounded-2xl justify-between overflow-hidden">
            <div className="flex flex-col gap-6 h-full">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b border-white/5 pb-2">
                {t.preview_title || 'Metadata Inspector'}
              </h3>

              {/* Selected image preview frame */}
              <div className="flex-1 min-h-[180px] lg:min-h-[220px] max-h-[300px] flex items-center justify-center p-4 bg-black/60 rounded-2xl border border-white/5 relative overflow-hidden group">
                {selectedFile ? (
                  <>
                    <img
                      src={selectedFile.previewUrl}
                      alt="Selected preview"
                      className="w-full h-full object-contain rounded-lg max-h-[260px] relative z-10 transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-500 py-12">
                    <ImageIcon className="w-12 h-12 opacity-15" />
                    <span className="text-xs uppercase font-bold tracking-wider opacity-60">
                      Select a file to inspect metadata
                    </span>
                  </div>
                )}
              </div>

              {/* Attributes Table */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {t.label_meta_details || 'Metadata Properties'}
                </span>
                
                {selectedFile ? (
                  <div className="border border-white/5 rounded-xl overflow-hidden bg-black/25">
                    <table className="w-full text-xs text-left border-collapse">
                      <tbody>
                        <tr className="border-b border-white/5">
                          <td className="p-3 text-slate-400 font-bold uppercase tracking-wider w-[40%] flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            {t.meta_make || 'Manufacturer'}
                          </td>
                          <td className="p-3 text-white font-medium break-all">
                            {selectedFile.metadata.make || <span className="text-slate-600">—</span>}
                          </td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="p-3 text-slate-400 font-bold uppercase tracking-wider w-[40%] flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            {t.meta_model || 'Camera Model'}
                          </td>
                          <td className="p-3 text-white font-medium break-all">
                            {selectedFile.metadata.model || <span className="text-slate-600">—</span>}
                          </td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="p-3 text-slate-400 font-bold uppercase tracking-wider w-[40%] flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            {t.meta_datetime || 'Date Taken'}
                          </td>
                          <td className="p-3 text-white font-medium break-all">
                            {selectedFile.metadata.dateTime || <span className="text-slate-600">—</span>}
                          </td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="p-3 text-slate-400 font-bold uppercase tracking-wider w-[40%] flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            {t.meta_software || 'Software'}
                          </td>
                          <td className="p-3 text-white font-medium break-all">
                            {selectedFile.metadata.software || <span className="text-slate-600">—</span>}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 text-slate-400 font-bold uppercase tracking-wider w-[40%] flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            {t.meta_gps || 'GPS Coordinates'}
                          </td>
                          <td className="p-3 text-white font-medium break-all">
                            {selectedFile.metadata.gps?.formatted ? (
                              <span className="text-red-400 font-semibold">{selectedFile.metadata.gps.formatted}</span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="border border-white/5 border-dashed rounded-xl py-6 text-center text-xs text-slate-600 font-medium bg-black/10">
                    Inspector idle
                  </div>
                )}

                {selectedFile && !selectedFile.metadata.hasMetadata && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold">
                    <Shield className="w-4 h-4 shrink-0" />
                    <span>{t.status_clean || 'Clean / No Metadata'}</span>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* COLUMN 3: Stripping Controls & Downloads (Col-span 3) */}
          <div className="lg:col-span-3 flex flex-col gap-6 bg-black/20 p-6 rounded-2xl border border-white/5 justify-between">
            <div className="flex flex-col gap-6">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b border-white/5 pb-2">
                {t.label_options || 'Removal Level'}
              </h3>

              {/* Mode switch radio checkable card list */}
              <div className="flex flex-col gap-3">
                {[
                  { 
                    key: 'full', 
                    title: t.opt_full_strip || 'Full Clean (Recommended)', 
                    desc: 'EXIF, GPS, XMP, Comments' 
                  },
                  { 
                    key: 'gps', 
                    title: t.opt_gps_only || 'GPS Location Only', 
                    desc: 'Preserves aperture / camera info' 
                  },
                  { 
                    key: 'camera', 
                    title: t.opt_camera_only || 'Camera details only', 
                    desc: 'Keeps XMP software annotations' 
                  }
                ].map(opt => (
                  <div
                    key={opt.key}
                    onClick={() => setStripLevel(opt.key as any)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer select-none text-left flex flex-col gap-1 ${
                      stripLevel === opt.key 
                        ? 'bg-emerald-500/10 border-emerald-500 text-white' 
                        : 'border-white/5 bg-black/40 hover:border-white/10 text-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold leading-tight">
                      {opt.title}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {opt.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Compile progress & Download Trigger */}
            <div className="flex flex-col gap-3">
              {isCompiling && (
                <div className="text-xs font-bold text-emerald-400 animate-pulse text-center leading-relaxed">
                  {progressText}
                </div>
              )}

              <button
                onClick={handleDownload}
                disabled={loadedFiles.length === 0 || isCompiling}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-white font-black text-sm uppercase rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-3 active:scale-95 duration-200 outline-none shadow-lg shadow-emerald-500/20"
              >
                <Download className="w-4 h-4" />
                <span>
                  {loadedFiles.length > 1 
                    ? (t.btn_download_zip || 'Download Cleaned (.ZIP)')
                    : (t.btn_download_cleaned || 'Download Cleaned Images')
                  }
                </span>
              </button>
            </div>
          </div>

        </div>

        {/* Informative Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: t.seoBrowserSpeedTitle || 'Real-Time Binary Header Filtering',
              desc: t.seoBrowserSpeedText || 'By parsing raw file bytes on high-performance ArrayBuffers, we strip segments instantly.'
            },
            {
              title: t.seoUseCaseTitle || 'Crucial for Photographers & Mobile Users',
              desc: t.seoUseCaseText || 'Photos taken on smartphones pack exact geographic coordinates. Strip EXIF data prior to publishing.'
            },
            {
              title: t.seoPrivacyTitle || 'Guaranteed Local Sandboxing',
              desc: t.seoPrivacyText || 'None of your source photos or graphics touch external networks. Operations occur strictly inside your sandboxed browser tab.'
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-300">
              <h4 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 group-hover:scale-125 transition-transform" />
                {item.title}
              </h4>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

      {/* Bloque AdSense Horizontal */}
      <AdBanner id="adsense-exif-clear-bottom" />
      </main>

      <Footer
        lang={lang}
        t={t}
        onOpenModal={handleOpenLegal}
      />

      <LegalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          modalType === 'privacy' 
            ? (legalTranslations[lang]?.nav.privacy || 'Privacy Policy') 
            : modalType === 'terms' 
              ? (legalTranslations[lang]?.nav.terms || 'Terms of Service') 
              : (legalTranslations[lang]?.nav.cookies || 'Cookie Policy')
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

export default EXIFClear;
