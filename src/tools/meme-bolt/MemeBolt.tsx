import React, { useState, useEffect, useRef } from 'react';
import { 
  Smile, 
  Download, 
  Upload, 
  Trash2, 
  Plus, 
  RefreshCw, 
  Type, 
  Image as ImageIcon,
  Grid,
  Move,
  Settings,
  X
} from 'lucide-react';
import { createTranslator, type Language } from '../../locales/meta';
import { AdBanner } from '../../components/shared/AdBanner';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { legalTranslations } from '../../locales/legal';

// Type declarations
interface TextLayer {
  id: string;
  text: string;
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  fontSize: number; // percentage of image height, e.g. 8%
  color: string;
  strokeColor: string;
  strokeWidth: number; // 0-10
  fontFamily: string;
  isUppercase: boolean;
}

interface StickerLayer {
  id: string;
  type: string; // 'glasses' | 'hat' | 'tears' | 'bubble' | 'troll'
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  scale: number; // 20-300 scale percentage
  rotation: number; // -180 to 180 degrees
}

interface MemeTemplate {
  id: string;
  name: string;
  svgData: string;
  aspectRatio: number;
  defaultTextLayers: { text: string; x: number; y: number; fontSize: number }[];
}

interface MemeBoltProps {
  lang: string;
  dictionary: any;
}

// Vector memes template data
const TEMPLATES: MemeTemplate[] = [
  {
    id: 'drake',
    name: 'Drake Hotline Bling',
    svgData: `<svg width="500" height="500" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="250" height="250" fill="#f97316"/>
      <circle cx="125" cy="100" r="40" fill="#0f172a"/>
      <path d="M85,150 Q125,120 165,150 L175,250 L75,250 Z" fill="#0f172a"/>
      <path d="M95,190 Q65,150 55,180 Q65,210 95,200" stroke="#f97316" stroke-width="6" fill="none"/>
      <rect x="250" y="0" width="250" height="250" fill="#1e293b"/>
      <rect x="255" y="5" width="240" height="240" rx="10" fill="#0f172a"/>
      <rect x="0" y="250" width="250" height="250" fill="#eab308"/>
      <circle cx="125" cy="350" r="40" fill="#0f172a"/>
      <path d="M85,400 Q125,370 165,400 L175,500 L75,500 Z" fill="#0f172a"/>
      <path d="M145,440 Q175,420 185,450 Q165,480 145,460" stroke="#eab308" stroke-width="6" fill="none"/>
      <rect x="250" y="250" width="250" height="250" fill="#1e293b"/>
      <rect x="255" y="255" width="240" height="240" rx="10" fill="#0f172a"/>
      <line x1="250" y1="0" x2="250" y2="500" stroke="#0f172a" stroke-width="4"/>
      <line x1="0" y1="250" x2="500" y2="250" stroke="#0f172a" stroke-width="4"/>
    </svg>`,
    aspectRatio: 1.0,
    defaultTextLayers: [
      { text: 'NO METADATA STRIPPING', x: 75, y: 25, fontSize: 5 },
      { text: 'FULLY LOCAL METADATA STRIPPING', x: 75, y: 75, fontSize: 5 }
    ]
  },
  {
    id: 'buttons',
    name: 'Two Buttons',
    svgData: `<svg width="500" height="375" viewBox="0 0 500 375" xmlns="http://www.w3.org/2000/svg">
      <rect width="500" height="375" fill="#0f172a"/>
      <rect x="20" y="20" width="460" height="335" rx="15" fill="#1e293b" stroke="#334155" stroke-width="4"/>
      <ellipse cx="160" cy="180" rx="60" ry="30" fill="#dc2626" stroke="#991b1b" stroke-width="4"/>
      <ellipse cx="160" cy="172" rx="50" ry="22" fill="#ef4444"/>
      <ellipse cx="340" cy="180" rx="60" ry="30" fill="#dc2626" stroke="#991b1b" stroke-width="4"/>
      <ellipse cx="340" cy="172" rx="50" ry="22" fill="#ef4444"/>
      <path d="M250,230 L220,350 L280,350 Z" fill="#64748b"/>
      <circle cx="250" cy="220" r="15" fill="#f8fafc"/>
    </svg>`,
    aspectRatio: 1.33,
    defaultTextLayers: [
      { text: 'Option A', x: 32, y: 16, fontSize: 5 },
      { text: 'Option B', x: 68, y: 16, fontSize: 5 },
      { text: 'Making a decision', x: 50, y: 88, fontSize: 6 }
    ]
  },
  {
    id: 'mind',
    name: 'Change My Mind',
    svgData: `<svg width="500" height="375" viewBox="0 0 500 375" xmlns="http://www.w3.org/2000/svg">
      <rect width="500" height="375" fill="#334155"/>
      <rect x="40" y="220" width="420" height="155" fill="#1e293b" stroke="#0f172a" stroke-width="4"/>
      <rect x="100" y="250" width="300" height="90" rx="5" fill="#ffffff" stroke="#0f172a" stroke-width="4"/>
      <circle cx="250" cy="120" r="40" fill="#0f172a"/>
      <path d="M180,220 Q250,150 320,220 Z" fill="#0f172a"/>
      <text x="250" y="325" font-family="sans-serif" font-size="20" font-weight="bold" fill="#000000" text-anchor="middle">CHANGE MY MIND</text>
    </svg>`,
    aspectRatio: 1.33,
    defaultTextLayers: [
      { text: 'oLoveTools is the best', x: 50, y: 76, fontSize: 5 }
    ]
  },
  {
    id: 'success',
    name: 'Success Kid',
    svgData: `<svg width="500" height="500" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_success" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#0284c7"/>
        </radialGradient>
      </defs>
      <rect width="500" height="500" fill="url(#bg_success)"/>
      <circle cx="250" cy="270" r="100" fill="#fef08a"/>
      <path d="M210,340 Q250,290 290,340 Z" fill="#1e293b"/>
      <circle cx="250" cy="240" r="45" fill="#fef08a" stroke="#ca8a04" stroke-width="4"/>
      <rect x="230" y="310" width="40" height="40" rx="10" fill="#fef08a" stroke="#ca8a04" stroke-width="4"/>
    </svg>`,
    aspectRatio: 1.0,
    defaultTextLayers: [
      { text: 'LOVES OFFLINE TOOLS', x: 50, y: 12, fontSize: 8 },
      { text: 'NO PRIVACY LEAKS AT ALL', x: 50, y: 88, fontSize: 8 }
    ]
  }
];

// Vector sticker definitions
const STICKERS: Record<string, { name: string; svg: string; width: number; height: number }> = {
  glasses: {
    name: 'Thug Glasses',
    width: 120,
    height: 30,
    svg: `<svg viewBox="0 0 100 25" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="4" width="35" height="17" fill="#000" />
      <rect x="60" y="4" width="35" height="17" fill="#000" />
      <rect x="40" y="8" width="20" height="5" fill="#000" />
      <rect x="0" y="4" width="5" height="5" fill="#000" />
      <rect x="95" y="4" width="5" height="5" fill="#000" />
      <rect x="12" y="8" width="6" height="6" fill="#fff" />
      <rect x="22" y="14" width="6" height="6" fill="#fff" />
      <rect x="67" y="8" width="6" height="6" fill="#fff" />
      <rect x="77" y="14" width="6" height="6" fill="#fff" />
    </svg>`
  },
  hat: {
    name: 'Thug Hat',
    width: 120,
    height: 70,
    svg: `<svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="25" width="80" height="30" fill="#000" rx="3" />
      <rect x="25" y="5" width="50" height="25" fill="#000" rx="5" />
      <rect x="20" y="25" width="60" height="6" fill="#dc2626" />
    </svg>`
  },
  tears: {
    name: 'Crying Tears',
    width: 80,
    height: 80,
    svg: `<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
      <path d="M15,10 C15,20 5,25 5,35 C5,43 12,50 20,50 C28,50 35,43 35,35 C35,25 25,20 25,10 Z" fill="#38bdf8" opacity="0.8"/>
      <path d="M40,20 C40,28 32,32 32,40 C32,45 36,49 41,49 C46,49 50,45 50,40 C50,32 44,28 40,20 Z" fill="#0284c7" opacity="0.6"/>
    </svg>`
  },
  bubble: {
    name: 'Speech Bubble',
    width: 100,
    height: 80,
    svg: `<svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="96" height="60" rx="15" fill="#fff" stroke="#000" stroke-width="4" />
      <path d="M30,62 L20,76 L45,62 Z" fill="#fff" stroke="#000" stroke-width="4" />
      <path d="M29,61 L22,72 L42,61 Z" fill="#fff" />
    </svg>`
  },
  troll: {
    name: 'Troll Face',
    width: 100,
    height: 100,
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="46" fill="#f8fafc" stroke="#000" stroke-width="5" />
      <path d="M18,50 Q50,90 82,50" fill="none" stroke="#000" stroke-width="5" stroke-linecap="round" />
      <path d="M15,48 C25,48 20,60 15,62" fill="none" stroke="#000" stroke-width="4" />
      <path d="M85,48 C75,48 80,60 85,62" fill="none" stroke="#000" stroke-width="4" />
      <ellipse cx="35" cy="40" rx="8" ry="6" fill="none" stroke="#000" stroke-width="4" />
      <circle cx="35" cy="40" r="3" fill="#000" />
      <ellipse cx="65" cy="40" rx="8" ry="6" fill="none" stroke="#000" stroke-width="4" />
      <circle cx="65" cy="40" r="3" fill="#000" />
      <path d="M25,32 Q35,28 45,35" fill="none" stroke="#000" stroke-width="3" />
      <path d="M75,32 Q65,28 55,35" fill="none" stroke="#000" stroke-width="3" />
    </svg>`
  }
};

export const MemeBolt: React.FC<MemeBoltProps> = ({ lang, dictionary }) => {
  const t = createTranslator(dictionary);

  // Studio tabs: 'templates' | 'text' | 'stickers'
  const [activeTab, setActiveTab] = useState<'templates' | 'text' | 'stickers'>('templates');

  // Base Image State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('drake');
  const [customImageFile, setCustomImageFile] = useState<File | null>(null);
  const [baseImageEl, setBaseImageEl] = useState<HTMLImageElement | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 500, height: 500 });

  // Layers states
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [stickerLayers, setStickerLayers] = useState<StickerLayer[]>([]);
  
  // Selected overlay element: { type: 'text'|'sticker'; id: string }
  const [selectedElement, setSelectedElement] = useState<{ type: 'text' | 'sticker'; id: string } | null>(null);

  // Exporter compilation states
  const [isCompiling, setIsCompiling] = useState<boolean>(false);

  // Modals
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'privacy' | 'terms' | 'cookies'>('privacy');

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stickerImagesRef = useRef<Record<string, HTMLImageElement>>({});

  // Pointer dragging states
  const dragInfoRef = useRef<{
    layerId: string;
    layerType: 'text' | 'sticker';
    startX: number;
    startY: number;
    startLayerX: number;
    startLayerY: number;
  } | null>(null);

  // Pre-load all vector sticker files once
  useEffect(() => {
    Object.entries(STICKERS).forEach(([key, sticker]) => {
      const img = new Image();
      img.src = `data:image/svg+xml;utf8,${encodeURIComponent(sticker.svg)}`;
      stickerImagesRef.current[key] = img;
    });
  }, []);

  // Load selected base template SVG or custom file
  useEffect(() => {
    let src = '';
    
    if (customImageFile) {
      src = URL.createObjectURL(customImageFile);
    } else {
      const template = TEMPLATES.find(t => t.id === selectedTemplateId) || TEMPLATES[0];
      src = `data:image/svg+xml;utf8,${encodeURIComponent(template.svgData)}`;
    }

    const img = new Image();
    img.onload = () => {
      setBaseImageEl(img);
      setImageSize({ width: img.naturalWidth || 500, height: img.naturalHeight || 500 });
    };
    img.src = src;

    return () => {
      if (customImageFile) {
        URL.revokeObjectURL(src);
      }
    };
  }, [selectedTemplateId, customImageFile]);

  // Load default text layers when template changes
  useEffect(() => {
    if (!customImageFile) {
      const template = TEMPLATES.find(t => t.id === selectedTemplateId) || TEMPLATES[0];
      const layers: TextLayer[] = template.defaultTextLayers.map((dt, idx) => ({
        id: `text_${idx}`,
        text: dt.text,
        x: dt.x,
        y: dt.y,
        fontSize: dt.fontSize,
        color: '#ffffff',
        strokeColor: '#000000',
        strokeWidth: 4,
        fontFamily: 'Impact',
        isUppercase: true
      }));
      setTextLayers(layers);
      setStickerLayers([]);
      setSelectedElement({ type: 'text', id: 'text_0' });
    }
  }, [selectedTemplateId, customImageFile]);

  // Canvas drawing routine
  const drawMeme = (canvas: HTMLCanvasElement, exportMode: boolean = false) => {
    const ctx = canvas.getContext('2d');
    if (!ctx || !baseImageEl) return;

    // Set canvas dimensions
    const width = exportMode ? imageSize.width : 500;
    const height = exportMode ? imageSize.height : 500 / (imageSize.width / imageSize.height);
    
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);
    
    // Draw background base
    ctx.drawImage(baseImageEl, 0, 0, width, height);

    // Draw stickers first
    stickerLayers.forEach(sticker => {
      const img = stickerImagesRef.current[sticker.type];
      if (!img) return;

      const stickerDef = STICKERS[sticker.type];
      ctx.save();

      // Translate coordinates to canvas size
      const drawX = (sticker.x / 100) * width;
      const drawY = (sticker.y / 100) * height;

      ctx.translate(drawX, drawY);
      ctx.rotate((sticker.rotation * Math.PI) / 180);

      // Scale calculations
      const baseW = width * 0.20;
      const w = baseW * (sticker.scale / 100);
      const h = w * (stickerDef.height / stickerDef.width);

      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();
    });

    // Draw text overlays
    textLayers.forEach(layer => {
      ctx.save();

      const drawX = (layer.x / 100) * width;
      const drawY = (layer.y / 100) * height;

      const fontSizePx = (layer.fontSize / 100) * height;
      ctx.font = `bold ${fontSizePx}px ${layer.fontFamily}, Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const textToDraw = layer.isUppercase ? layer.text.toUpperCase() : layer.text;

      // Draw stroke outline
      if (layer.strokeWidth > 0) {
        ctx.strokeStyle = layer.strokeColor;
        ctx.lineWidth = layer.strokeWidth * (fontSizePx / 15);
        ctx.lineJoin = 'round';
        ctx.strokeText(textToDraw, drawX, drawY);
      }

      // Draw fill text
      ctx.fillStyle = layer.color;
      ctx.fillText(textToDraw, drawX, drawY);

      ctx.restore();
    });
  };

  // Re-draw canvas whenever dependencies modify
  useEffect(() => {
    if (canvasRef.current && baseImageEl) {
      drawMeme(canvasRef.current);
    }
  }, [baseImageEl, textLayers, stickerLayers, imageSize]);

  // Pointer dragging handlers
  const handlePointerDown = (e: React.PointerEvent, layerId: string, layerType: 'text' | 'sticker') => {
    e.stopPropagation();
    setSelectedElement({ type: layerType, id: layerId });
    if (activeTab === 'templates') {
      setActiveTab(layerType === 'text' ? 'text' : 'stickers');
    }

    dragInfoRef.current = {
      layerId,
      layerType,
      startX: e.clientX,
      startY: e.clientY,
      startLayerX: 0,
      startLayerY: 0
    };

    if (layerType === 'text') {
      const layer = textLayers.find(l => l.id === layerId);
      if (layer && dragInfoRef.current) {
        dragInfoRef.current.startLayerX = layer.x;
        dragInfoRef.current.startLayerY = layer.y;
      }
    } else {
      const layer = stickerLayers.find(l => l.id === layerId);
      if (layer && dragInfoRef.current) {
        dragInfoRef.current.startLayerX = layer.x;
        dragInfoRef.current.startLayerY = layer.y;
      }
    }

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragInfoRef.current || !containerRef.current) return;

    const drag = dragInfoRef.current;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Compute pointer movements relative to the container width/height
    const deltaX = ((e.clientX - drag.startX) / rect.width) * 100;
    const deltaY = ((e.clientY - drag.startY) / rect.height) * 100;

    const newX = Math.max(0, Math.min(100, drag.startLayerX + deltaX));
    const newY = Math.max(0, Math.min(100, drag.startLayerY + deltaY));

    if (drag.layerType === 'text') {
      setTextLayers(prev => prev.map(l => l.id === drag.layerId ? { ...l, x: newX, y: newY } : l));
    } else {
      setStickerLayers(prev => prev.map(l => l.id === drag.layerId ? { ...l, x: newX, y: newY } : l));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragInfoRef.current) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      dragInfoRef.current = null;
    }
  };

  // Add layer actions
  const addTextLayer = () => {
    const id = `text_${Date.now()}`;
    const newLayer: TextLayer = {
      id,
      text: t.label_text_placeholder || 'ENTER TEXT HERE',
      x: 50,
      y: textLayers.length === 0 ? 15 : textLayers.length === 1 ? 85 : 50,
      fontSize: 8,
      color: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 4,
      fontFamily: 'Impact',
      isUppercase: true
    };
    setTextLayers(prev => [...prev, newLayer]);
    setSelectedElement({ type: 'text', id });
    setActiveTab('text');
  };

  const addStickerLayer = (type: string) => {
    const id = `sticker_${Date.now()}`;
    const newLayer: StickerLayer = {
      id,
      type,
      x: 50,
      y: 50,
      scale: 100,
      rotation: 0
    };
    setStickerLayers(prev => [...prev, newLayer]);
    setSelectedElement({ type: 'sticker', id });
    setActiveTab('stickers');
  };

  const deleteElement = (type: 'text' | 'sticker', id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (type === 'text') {
      setTextLayers(prev => prev.filter(l => l.id !== id));
    } else {
      setStickerLayers(prev => prev.filter(l => l.id !== id));
    }
    if (selectedElement?.id === id) {
      setSelectedElement(null);
    }
  };

  // File Upload Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCustomImageFile(e.target.files[0]);
      setSelectedTemplateId('');
      setTextLayers([]);
      setStickerLayers([]);
      setSelectedElement(null);
      addTextLayer(); // add a starting text layer for custom image
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleDownloadMeme = () => {
    if (!baseImageEl) return;
    setIsCompiling(true);

    setTimeout(() => {
      try {
        const exportCanvas = document.createElement('canvas');
        drawMeme(exportCanvas, true);

        exportCanvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `meme_${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 5000);
          }
          setIsCompiling(false);
        }, 'image/png');
      } catch (err) {
        console.error('Meme generation failure:', err);
        alert('Could not render high-res meme output.');
        setIsCompiling(false);
      }
    }, 300);
  };

  const resetAll = () => {
    setCustomImageFile(null);
    setSelectedTemplateId('drake');
    setTextLayers([]);
    setStickerLayers([]);
    setSelectedElement(null);
    setActiveTab('templates');
  };

  const handleOpenLegal = (type: 'privacy' | 'terms' | 'cookies') => {
    setModalType(type);
    setModalOpen(true);
  };

  // Retrieve active selected layers
  const activeText = selectedElement?.type === 'text' 
    ? textLayers.find(l => l.id === selectedElement.id) 
    : null;

  const activeSticker = selectedElement?.type === 'sticker' 
    ? stickerLayers.find(l => l.id === selectedElement.id) 
    : null;

  return (
    <div className="min-h-screen bg-[#020205] text-slate-200 font-sans flex flex-col">
      <Header
        currentLang={lang}
        onLanguageChange={(newLang) => {
          window.location.href = `/${newLang.toLowerCase()}/meme-bolt`;
        }}
        onReset={resetAll}
        t={t}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-12 pt-36 pb-24 relative z-10 flex flex-col justify-center">
        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-meme-bolt-top" />
        {/* Title SEO Hero Section */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-4xl md:text-6xl font-black font-outfit tracking-tight text-white mb-4">
            {t.seoHeroTitle || 'Offline Interactive Meme Generator Studio'}
          </h1>
          <p className="text-slate-400 text-lg max-w-3xl mx-auto leading-relaxed font-medium">
            {t.seoHeroText || 'Create viral memes instantly with 100% privacy. Move, scale, and customize overlays directly on canvas.'}
          </p>
        </div>

        {/* Studio Workspace Layout */}
        <div className="w-full bg-[#3b0764]/10 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 md:p-8 shadow-2xl relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch glow-fuchsia">
          
          {/* LEFT COLUMN: Visual Studio Canvas (Col-span 7) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-black/40 border border-white/5 p-6 rounded-2xl relative overflow-hidden select-none">
            <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-950/5 to-purple-950/10 opacity-30 pointer-events-none" />
            
            <div 
              ref={containerRef}
              className="relative max-w-full bg-black/60 shadow-2xl rounded-xl border border-white/10"
              style={{
                width: '500px',
                aspectRatio: `${imageSize.width} / ${imageSize.height}`
              }}
            >
              {/* Core Canvas element */}
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain rounded-xl pointer-events-none"
              />

              {/* Dynamic Interactive Drag Overlay elements */}
              {stickerLayers.map(sticker => {
                const isSelected = selectedElement?.type === 'sticker' && selectedElement.id === sticker.id;
                const stickerDef = STICKERS[sticker.type];
                
                // Overlay scale calculations
                const wPercent = 20 * (sticker.scale / 100);
                const hPercent = wPercent * (stickerDef.height / stickerDef.width) * (imageSize.width / imageSize.height);

                return (
                  <div
                    key={sticker.id}
                    onPointerDown={(e) => handlePointerDown(e, sticker.id, 'sticker')}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    className={`absolute cursor-move flex items-center justify-center p-0.5 group touch-none select-none ${
                      isSelected ? 'border border-fuchsia-400' : 'hover:border border-white/20'
                    }`}
                    style={{
                      left: `${sticker.x}%`,
                      top: `${sticker.y}%`,
                      width: `${wPercent}%`,
                      height: `${hPercent}%`,
                      transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
                      zIndex: isSelected ? 50 : 20
                    }}
                  >
                    <div 
                      className="w-full h-full"
                      dangerouslySetInnerHTML={{ __html: stickerDef.svg }}
                    />
                    {isSelected && (
                      <button
                        onClick={(e) => deleteElement('sticker', sticker.id, e)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer border-none outline-none z-50 font-bold text-[10px]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}

              {textLayers.map(layer => {
                const isSelected = selectedElement?.type === 'text' && selectedElement.id === layer.id;
                
                // Overlay size approximation for text wrapper
                const wPercent = 80; 
                const hPercent = layer.fontSize * 1.5; 

                return (
                  <div
                    key={layer.id}
                    onPointerDown={(e) => handlePointerDown(e, layer.id, 'text')}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    className={`absolute cursor-move flex items-center justify-center text-center touch-none select-none font-bold group leading-none break-words px-2 py-1 ${
                      isSelected ? 'border border-dashed border-fuchsia-400' : 'hover:border border-dashed border-white/25'
                    }`}
                    style={{
                      left: `${layer.x}%`,
                      top: `${layer.y}%`,
                      width: `${wPercent}%`,
                      height: `${hPercent}%`,
                      transform: 'translate(-50%, -50%)',
                      fontFamily: layer.fontFamily === 'Impact' ? 'Impact, sans-serif' : layer.fontFamily,
                      fontSize: `${layer.fontSize * 4.5}px`, // Display scaling
                      color: layer.color,
                      textShadow: layer.strokeWidth > 0 
                        ? `0 0 0.1em ${layer.strokeColor}, 0 0 0.1em ${layer.strokeColor}` 
                        : 'none',
                      zIndex: isSelected ? 55 : 25
                    }}
                  >
                    <span className="truncate max-w-full">
                      {layer.isUppercase ? layer.text.toUpperCase() : layer.text}
                    </span>
                    {isSelected && (
                      <button
                        onClick={(e) => deleteElement('text', layer.id, e)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer border-none outline-none z-50 font-bold text-[10px]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}

            </div>

            <div className="mt-4 flex gap-3 text-slate-500 text-[10px] font-bold uppercase tracking-wider items-center">
              <Move className="w-3.5 h-3.5 text-fuchsia-500" />
              <span>Drag layers directly on the image to position</span>
            </div>
          </div>

          {/* RIGHT COLUMN: Studio Control Rack (Col-span 5) */}
          <div className="lg:col-span-5 flex flex-col gap-6 bg-black/20 p-6 rounded-2xl border border-white/5 justify-between">
            <div className="flex flex-col gap-6">
              
              {/* Studio Tabs Selectors */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5">
                {[
                  { key: 'templates', label: t.label_templates || 'Templates', icon: Grid },
                  { key: 'text', label: 'Text', icon: Type },
                  { key: 'stickers', label: 'Stickers', icon: Smile }
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`py-2 px-1 text-[11px] font-black uppercase rounded-lg transition-all cursor-pointer border-none outline-none flex items-center justify-center gap-1.5 ${
                        isActive
                          ? 'bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB CONTENT: Templates */}
              {activeTab === 'templates' && (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Popular Presets
                    </label>
                    <div className="grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-1">
                      {TEMPLATES.map(tpl => (
                        <div
                          key={tpl.id}
                          onClick={() => {
                            setCustomImageFile(null);
                            setSelectedTemplateId(tpl.id);
                          }}
                          className={`p-2 rounded-xl border transition-all cursor-pointer bg-black/30 hover:border-fuchsia-500/30 flex flex-col gap-1.5 ${
                            selectedTemplateId === tpl.id && !customImageFile
                              ? 'border-fuchsia-500 bg-fuchsia-500/5'
                              : 'border-white/5'
                          }`}
                        >
                          <div 
                            className="w-full h-20 overflow-hidden bg-black/60 rounded-lg flex items-center justify-center p-1"
                            dangerouslySetInnerHTML={{ __html: tpl.svgData }}
                          />
                          <span className="text-[10px] font-bold text-white truncate text-center">
                            {tpl.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 border-t border-white/5 pt-4">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Or Upload Custom Background
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
                      className="border-2 border-dashed border-white/15 hover:border-fuchsia-500/50 bg-black/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-black/40 group text-center"
                    >
                      {customImageFile ? (
                        <div className="flex flex-col items-center gap-1">
                          <ImageIcon className="w-6 h-6 text-fuchsia-400" />
                          <span className="text-xs font-bold text-white truncate max-w-[200px]">
                            {customImageFile.name}
                          </span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-slate-500 group-hover:text-fuchsia-400 transition-colors" />
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            {t.label_upload_box || 'Upload Background Image'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: Text Layers */}
              {activeTab === 'text' && (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Text Overlays
                    </span>
                    <button
                      onClick={addTextLayer}
                      className="py-1 px-2.5 bg-fuchsia-500/10 border border-fuchsia-500/30 hover:bg-fuchsia-500 text-fuchsia-400 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add Layer
                    </button>
                  </div>

                  {/* Layers List Rack */}
                  <div className="flex flex-col gap-2 max-h-[120px] overflow-y-auto pr-1">
                    {textLayers.map(l => {
                      const isSelected = selectedElement?.type === 'text' && selectedElement.id === l.id;
                      return (
                        <div
                          key={l.id}
                          onClick={() => setSelectedElement({ type: 'text', id: l.id })}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-fuchsia-500/5 border-fuchsia-500/50 text-white'
                              : 'bg-black/30 border-white/5 text-slate-400 hover:border-white/10'
                          }`}
                        >
                          <span className="text-[11px] font-bold truncate max-w-[200px]">
                            {l.text}
                          </span>
                          <button
                            onClick={(e) => deleteElement('text', l.id, e)}
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Active Text Customizer Settings */}
                  {activeText ? (
                    <div className="flex flex-col gap-4 border-t border-white/5 pt-4 text-left">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          Meme Wording
                        </label>
                        <input
                          type="text"
                          value={activeText.text}
                          onChange={(e) => {
                            setTextLayers(prev => prev.map(l => l.id === activeText.id ? { ...l, text: e.target.value } : l));
                          }}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-fuchsia-500 outline-none transition-colors"
                          placeholder={t.label_text_placeholder || 'ENTER TEXT HERE'}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            {t.label_font_family || 'Font Family'}
                          </label>
                          <select
                            value={activeText.fontFamily}
                            onChange={(e) => {
                              setTextLayers(prev => prev.map(l => l.id === activeText.id ? { ...l, fontFamily: e.target.value } : l));
                            }}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-fuchsia-500 outline-none cursor-pointer"
                          >
                            <option value="Impact">Impact (Meme)</option>
                            <option value="sans-serif">Sans-Serif</option>
                            <option value="serif">Serif</option>
                            <option value="monospace">Monospace</option>
                          </select>
                        </div>

                        <div className="flex flex-col justify-end">
                          <label className="flex items-center gap-2 cursor-pointer select-none text-[10px] font-black text-slate-400 uppercase tracking-wider py-2">
                            <input
                              type="checkbox"
                              checked={activeText.isUppercase}
                              onChange={(e) => {
                                setTextLayers(prev => prev.map(l => l.id === activeText.id ? { ...l, isUppercase: e.target.checked } : l));
                              }}
                              className="accent-fuchsia-500 w-3.5 h-3.5"
                            />
                            {t.label_uppercase || 'All Uppercase'}
                          </label>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          <span>{t.label_font_size || 'Font Size'}</span>
                          <span className="text-fuchsia-400 font-mono">{activeText.fontSize}%</span>
                        </div>
                        <input
                          type="range"
                          min="2"
                          max="20"
                          step="0.5"
                          value={activeText.fontSize}
                          onChange={(e) => {
                            setTextLayers(prev => prev.map(l => l.id === activeText.id ? { ...l, fontSize: parseFloat(e.target.value) } : l));
                          }}
                          className="w-full accent-fuchsia-500 cursor-pointer"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            {t.label_font_color || 'Color'}
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={activeText.color}
                              onChange={(e) => {
                                setTextLayers(prev => prev.map(l => l.id === activeText.id ? { ...l, color: e.target.value } : l));
                              }}
                              className="w-8 h-8 rounded-lg border border-white/10 bg-transparent cursor-pointer p-0"
                            />
                            <input
                              type="text"
                              value={activeText.color}
                              onChange={(e) => {
                                setTextLayers(prev => prev.map(l => l.id === activeText.id ? { ...l, color: e.target.value } : l));
                              }}
                              className="w-20 bg-black/40 border border-white/10 rounded-xl px-2 py-1 text-center text-xs text-white uppercase outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            {t.label_stroke_color || 'Stroke Color'}
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={activeText.strokeColor}
                              onChange={(e) => {
                                setTextLayers(prev => prev.map(l => l.id === activeText.id ? { ...l, strokeColor: e.target.value } : l));
                              }}
                              className="w-8 h-8 rounded-lg border border-white/10 bg-transparent cursor-pointer p-0"
                            />
                            <input
                              type="text"
                              value={activeText.strokeColor}
                              onChange={(e) => {
                                setTextLayers(prev => prev.map(l => l.id === activeText.id ? { ...l, strokeColor: e.target.value } : l));
                              }}
                              className="w-20 bg-black/40 border border-white/10 rounded-xl px-2 py-1 text-center text-xs text-white uppercase outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          <span>{t.label_stroke_width || 'Stroke Width'}</span>
                          <span className="text-fuchsia-400 font-mono">{activeText.strokeWidth}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="12"
                          value={activeText.strokeWidth}
                          onChange={(e) => {
                            setTextLayers(prev => prev.map(l => l.id === activeText.id ? { ...l, strokeWidth: parseInt(e.target.value) } : l));
                          }}
                          className="w-full accent-fuchsia-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="border border-white/5 border-dashed rounded-xl py-6 text-center text-xs text-slate-600 font-medium bg-black/10">
                      Select a layer to customize typography
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: Stickers */}
              {activeTab === 'stickers' && (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider text-left">
                      Click a sticker to add
                    </span>
                    <div className="grid grid-cols-5 gap-2.5">
                      {Object.entries(STICKERS).map(([key, item]) => (
                        <div
                          key={key}
                          onClick={() => addStickerLayer(key)}
                          className="w-12 h-12 bg-black/40 hover:bg-fuchsia-500/10 border border-white/5 hover:border-fuchsia-500/40 rounded-xl flex items-center justify-center p-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-md"
                          title={item.name}
                        >
                          <div 
                            className="w-full h-full text-slate-300"
                            dangerouslySetInnerHTML={{ __html: item.svg }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Active Sticker Layer properties */}
                  <div className="border-t border-white/5 pt-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3 text-left">
                      Active Overlays List
                    </span>

                    {stickerLayers.length > 0 ? (
                      <div className="flex flex-col gap-2 max-h-[100px] overflow-y-auto pr-1 mb-4">
                        {stickerLayers.map(l => {
                          const isSelected = selectedElement?.type === 'sticker' && selectedElement.id === l.id;
                          return (
                            <div
                              key={l.id}
                              onClick={() => setSelectedElement({ type: 'sticker', id: l.id })}
                              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                                isSelected 
                                  ? 'bg-fuchsia-500/5 border-fuchsia-500/50 text-white'
                                  : 'bg-black/30 border-white/5 text-slate-400 hover:border-white/10'
                              }`}
                            >
                              <span className="text-[11px] font-bold capitalize">
                                {STICKERS[l.type].name} ({l.scale}%)
                              </span>
                              <button
                                onClick={(e) => deleteElement('sticker', l.id, e)}
                                className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-600 italic py-3 text-center mb-2">
                        No sticker overlays placed yet
                      </div>
                    )}

                    {activeSticker ? (
                      <div className="flex flex-col gap-4 text-left border-t border-white/5 pt-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            <span>Sticker Scale</span>
                            <span className="text-fuchsia-400 font-mono">{activeSticker.scale}%</span>
                          </div>
                          <input
                            type="range"
                            min="20"
                            max="300"
                            value={activeSticker.scale}
                            onChange={(e) => {
                              setStickerLayers(prev => prev.map(l => l.id === activeSticker.id ? { ...l, scale: parseInt(e.target.value) } : l));
                            }}
                            className="w-full accent-fuchsia-500 cursor-pointer"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            <span>Rotation Angle</span>
                            <span className="text-fuchsia-400 font-mono">{activeSticker.rotation}°</span>
                          </div>
                          <input
                            type="range"
                            min="-180"
                            max="180"
                            value={activeSticker.rotation}
                            onChange={(e) => {
                              setStickerLayers(prev => prev.map(l => l.id === activeSticker.id ? { ...l, rotation: parseInt(e.target.value) } : l));
                            }}
                            className="w-full accent-fuchsia-500 cursor-pointer"
                          />
                        </div>
                      </div>
                    ) : (
                      stickerLayers.length > 0 && (
                        <div className="border border-white/5 border-dashed rounded-xl py-4 text-center text-xs text-slate-600 font-medium bg-black/10">
                          Select a sticker overlay from above list to tune scale and rotation
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* DOWNLOAD ACTION BUTTON */}
            <div className="border-t border-white/5 pt-4 flex flex-col gap-4">
              <button
                onClick={handleDownloadMeme}
                disabled={!baseImageEl || isCompiling}
                className="w-full py-4 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white font-black text-sm uppercase rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-3 active:scale-95 duration-200 outline-none shadow-lg shadow-fuchsia-500/20 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600"
              >
                <Download className="w-4 h-4" />
                <span>{t.btn_download || 'Download Meme'}</span>
              </button>
            </div>

          </div>

        </div>

        {/* Informative Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: t.seoBrowserSpeedTitle || 'On-Canvas Real-Time Rendering',
              desc: t.seoBrowserSpeedText || 'We process all canvas renders directly in your browser using standard HTML5 Canvas 2D API. Instantly exports at high resolution.'
            },
            {
              title: t.seoUseCaseTitle || 'Instant Sharing Ready',
              desc: t.seoUseCaseText || 'Export your creations immediately as high-quality PNGs, pre-formatted and ready to drop into chats, forums, or social feeds.'
            },
            {
              title: t.seoPrivacyTitle || '100% Offline Sandboxing',
              desc: t.seoPrivacyText || 'No backend servers or image uploads. Your custom templates and creations remain strictly local, private, and secure in your browser memory.'
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-fuchsia-500/20 transition-all duration-300">
              <h4 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-fuchsia-400 group-hover:scale-125 transition-transform" />
                {item.title}
              </h4>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

      {/* Bloque AdSense Horizontal */}
      <AdBanner id="adsense-meme-bolt-bottom" />
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

export default MemeBolt;
