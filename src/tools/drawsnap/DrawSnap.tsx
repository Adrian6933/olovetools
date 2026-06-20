import React, { useState, useEffect, useRef } from 'react';
import { Pen, Paintbrush, Eraser, Minus, Square, Circle, Undo2, Redo2, Trash2, Download, ToggleLeft, ToggleRight, Sparkles, HelpCircle, Grid } from 'lucide-react';
import { useTranslation, Language } from '../../locales/dictionary';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { legalTranslations } from '../../locales/legal';

interface DrawSnapProps {
  lang: string;
  dictionary: any;
}

interface DrawingPath {
  id: string;
  type: 'pencil' | 'marker' | 'eraser' | 'line' | 'rect' | 'circle';
  points: { x: number; y: number }[];
  color: string;
  width: number;
  opacity: number;
  fill: boolean;
}

export const DrawSnap: React.FC<DrawSnapProps> = ({ lang, dictionary }) => {
  const { t } = useTranslation(lang as Language, 'drawsnap');

  // Drawing States
  const [activeTool, setActiveTool] = useState<'pencil' | 'marker' | 'eraser' | 'line' | 'rect' | 'circle'>('pencil');
  const [strokeColor, setStrokeColor] = useState<string>('#ffffff');
  const [strokeWidth, setStrokeWidth] = useState<number>(5);
  const [brushOpacity, setBrushOpacity] = useState<number>(1.0);
  const [fillShapes, setFillShapes] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Undo/Redo Path States
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [redoStack, setRedoStack] = useState<DrawingPath[]>([]);

  // Canvas interaction refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const currentPathRef = useRef<DrawingPath | null>(null);

  // Modal States
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'privacy' | 'terms' | 'cookies'>('privacy');

  // Colors Presets
  const colorPresets = [
    '#ffffff', // White
    '#f43f5e', // Rose
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#a855f7', // Purple
  ];

  // Redraw the canvas content
  const redraw = (pathsList: DrawingPath[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid Background
    if (showGrid) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      const spacing = 24;
      for (let x = spacing; x < canvas.width; x += spacing) {
        for (let y = spacing; y < canvas.height; y += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // Paths Redraw
    pathsList.forEach((path) => {
      ctx.save();
      ctx.globalAlpha = path.opacity;

      if (path.type === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = path.color;
        ctx.fillStyle = path.color;
      }

      ctx.lineWidth = path.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (path.type === 'pencil' || path.type === 'marker' || path.type === 'eraser') {
        if (path.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(path.points[0].x, path.points[0].y);
          for (let i = 1; i < path.points.length; i++) {
            ctx.lineTo(path.points[i].x, path.points[i].y);
          }
          ctx.stroke();
        }
      } else if (path.type === 'line') {
        if (path.points.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(path.points[0].x, path.points[0].y);
          ctx.lineTo(path.points[1].x, path.points[1].y);
          ctx.stroke();
        }
      } else if (path.type === 'rect') {
        if (path.points.length >= 2) {
          const p1 = path.points[0];
          const p2 = path.points[1];
          const w = p2.x - p1.x;
          const h = p2.y - p1.y;
          ctx.beginPath();
          if (path.fill) {
            ctx.fillRect(p1.x, p1.y, w, h);
          } else {
            ctx.rect(p1.x, p1.y, w, h);
            ctx.stroke();
          }
        }
      } else if (path.type === 'circle') {
        if (path.points.length >= 2) {
          const p1 = path.points[0];
          const p2 = path.points[1];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const radius = Math.sqrt(dx * dx + dy * dy);
          ctx.beginPath();
          ctx.arc(p1.x, p1.y, radius, 0, Math.PI * 2);
          if (path.fill) {
            ctx.fill();
          } else {
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    });
  };

  const handleResize = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    redraw(paths);
  };

  // Re-trigger canvas size adjustments
  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [paths, showGrid]);

  // Handle Undo / Redo
  const handleUndo = () => {
    if (paths.length === 0) return;
    const newPaths = [...paths];
    const undone = newPaths.pop();
    if (undone) {
      setRedoStack((prev) => [undone, ...prev]);
    }
    setPaths(newPaths);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const newRedo = [...redoStack];
    const redone = newRedo.shift();
    if (redone) {
      setPaths((prev) => [...prev, redone]);
    }
    setRedoStack(newRedo);
  };

  const handleClear = () => {
    if (window.confirm(t.btn_clear ? `${t.btn_clear}?` : 'Clear Canvas?')) {
      setPaths([]);
      setRedoStack([]);
    }
  };

  // Draw operations
  const handleStart = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    isDrawingRef.current = true;
    startPointRef.current = { x, y };

    const newPath: DrawingPath = {
      id: Math.random().toString(36).substring(7),
      type: activeTool,
      points: [{ x, y }],
      color: strokeColor,
      width: strokeWidth,
      opacity: brushOpacity,
      fill: fillShapes,
    };

    currentPathRef.current = newPath;
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDrawingRef.current || !currentPathRef.current || !startPointRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const path = currentPathRef.current;

    if (path.type === 'pencil' || path.type === 'marker' || path.type === 'eraser') {
      path.points.push({ x, y });

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.globalAlpha = path.opacity;
        if (path.type === 'eraser') {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.strokeStyle = 'rgba(0,0,0,1)';
        } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = path.color;
        }
        ctx.lineWidth = path.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        const prevPt = path.points[path.points.length - 2];
        ctx.moveTo(prevPt.x, prevPt.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.restore();
      }
    } else {
      // For lines or rectangles/circles, show shapes preview
      const tempPaths = [
        ...paths,
        {
          ...path,
          points: [startPointRef.current, { x, y }],
        },
      ];
      redraw(tempPaths);
    }
  };

  const handleEnd = (clientX: number, clientY: number) => {
    if (!isDrawingRef.current || !currentPathRef.current || !startPointRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const path = currentPathRef.current;
    isDrawingRef.current = false;

    let finalPoints = path.points;
    if (path.type !== 'pencil' && path.type !== 'marker' && path.type !== 'eraser') {
      finalPoints = [startPointRef.current, { x, y }];
    } else {
      finalPoints.push({ x, y });
    }

    const completedPath = {
      ...path,
      points: finalPoints,
    };

    setPaths((prev) => [...prev, completedPath]);
    setRedoStack([]); // reset redo

    startPointRef.current = null;
    currentPathRef.current = null;
  };

  // Exporters
  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create temp canvas to inject dark background (transparent paths are invisible otherwise)
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Fill dark background
    tempCtx.fillStyle = '#0c0a12';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw active board content
    tempCtx.drawImage(canvas, 0, 0);

    const dataUrl = tempCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `drawsnap-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const exportSVG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas.width} ${canvas.height}" width="${canvas.width}" height="${canvas.height}">`;
    // Add dark workspace background rect
    svgContent += `<rect width="100%" height="100%" fill="#0c0a12"/>`;

    paths.forEach((path) => {
      const alpha = path.opacity;
      if (path.type === 'eraser') {
        const color = '#0c0a12'; // Draw eraser paths as background color matching
        if (path.points.length > 0) {
          let d = `M ${path.points[0].x} ${path.points[0].y}`;
          for (let i = 1; i < path.points.length; i++) {
            d += ` L ${path.points[i].x} ${path.points[i].y}`;
          }
          svgContent += `<path d="${d}" fill="none" stroke="${color}" stroke-width="${path.width}" stroke-linecap="round" stroke-linejoin="round" opacity="${alpha}"/>`;
        }
      } else if (path.type === 'pencil' || path.type === 'marker') {
        if (path.points.length > 0) {
          let d = `M ${path.points[0].x} ${path.points[0].y}`;
          for (let i = 1; i < path.points.length; i++) {
            d += ` L ${path.points[i].x} ${path.points[i].y}`;
          }
          svgContent += `<path d="${d}" fill="none" stroke="${path.color}" stroke-width="${path.width}" stroke-linecap="round" stroke-linejoin="round" opacity="${alpha}"/>`;
        }
      } else if (path.type === 'line') {
        if (path.points.length >= 2) {
          svgContent += `<line x1="${path.points[0].x}" y1="${path.points[0].y}" x2="${path.points[1].x}" y2="${path.points[1].y}" stroke="${path.color}" stroke-width="${path.width}" stroke-linecap="round" opacity="${alpha}"/>`;
        }
      } else if (path.type === 'rect') {
        if (path.points.length >= 2) {
          const p1 = path.points[0];
          const p2 = path.points[1];
          const x = Math.min(p1.x, p2.x);
          const y = Math.min(p1.y, p2.y);
          const w = Math.abs(p2.x - p1.x);
          const h = Math.abs(p2.y - p1.y);
          if (path.fill) {
            svgContent += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${path.color}" opacity="${alpha}"/>`;
          } else {
            svgContent += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${path.color}" stroke-width="${path.width}" opacity="${alpha}"/>`;
          }
        }
      } else if (path.type === 'circle') {
        if (path.points.length >= 2) {
          const p1 = path.points[0];
          const p2 = path.points[1];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const radius = Math.sqrt(dx * dx + dy * dy);
          if (path.fill) {
            svgContent += `<circle cx="${p1.x}" cy="${p1.y}" r="${radius}" fill="${path.color}" opacity="${alpha}"/>`;
          } else {
            svgContent += `<circle cx="${p1.x}" cy="${p1.y}" r="${radius}" fill="none" stroke="${path.color}" stroke-width="${path.width}" opacity="${alpha}"/>`;
          }
        }
      }
    });

    svgContent += `</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drawsnap-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetAll = () => {
    setPaths([]);
    setRedoStack([]);
  };

  return (
    <div className="min-h-screen bg-[#08060a] text-slate-200 font-sans flex flex-col">
      <Header
        currentLang={lang}
        onLanguageChange={(newLang) => {
          window.location.href = `/${newLang.toLowerCase()}/drawsnap`;
        }}
        onReset={resetAll}
        t={t}
      />

      <main className="flex-1 w-full mx-auto pt-36 pb-24 relative z-10 flex flex-col justify-start items-center">
        {/* Full-width Title Container */}
        <div className="text-center mb-8 px-4 animate-in fade-in slide-in-from-top-4 duration-500 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-black font-outfit tracking-tight text-white mb-3 flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
            {t.seoHeroTitle || 'Immersive Digital Whiteboard'}
          </h1>
          <p className="text-slate-400 text-base max-w-2xl mx-auto font-medium">
            {t.seoHeroText || 'Sketch drafts, draw geometrical shapes, and export vectors locally in your browser.'}
          </p>
        </div>

        {/* 
          NEW STRUCTURAL CANVAS DESIGN:
          An app-like workspace panel that fills the viewport nicely with floating docks.
        */}
        <div className="max-w-6xl w-full px-4 mb-16 relative">
          
          <div 
            ref={containerRef}
            className="h-[65vh] md:h-[75vh] w-full rounded-3xl overflow-hidden border border-white/10 relative shadow-2xl bg-[#0c0a12] glow-purple flex flex-col cursor-crosshair"
          >
            {/* Draw Canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
              onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
              onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
              onMouseUp={(e) => handleEnd(e.clientX, e.clientY)}
              onMouseLeave={(e) => {
                if (isDrawingRef.current) handleEnd(e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                if (e.touches.length > 0) {
                  handleStart(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              onTouchMove={(e) => {
                if (e.touches.length > 0) {
                  handleMove(e.touches[0].clientX, e.touches[0].clientY);
                }
                if (e.cancelable) e.preventDefault();
              }}
              onTouchEnd={(e) => {
                if (e.changedTouches.length > 0) {
                  handleEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
                }
              }}
            />

            {/* FLOATING PROPERTIES PANEL (Top Left) */}
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-4 p-4 bg-[#120d20]/90 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl w-60 text-left">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                  {t.label_color || 'Stroke Color'}
                </span>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setStrokeColor(preset)}
                      className={`w-8 h-8 rounded-full border transition-transform hover:scale-110 cursor-pointer ${
                        strokeColor === preset ? 'border-purple-400 scale-105 shadow-md shadow-purple-500/20' : 'border-white/10'
                      }`}
                      style={{ backgroundColor: preset }}
                    />
                  ))}
                </div>
                {/* Custom HEX code picker input */}
                <input
                  type="text"
                  value={strokeColor}
                  onChange={(e) => setStrokeColor(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono uppercase focus:outline-none focus:border-purple-500"
                  placeholder="#FFFFFF"
                />
              </div>

              <div className="border-t border-white/5 pt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {t.label_brush_size || 'Size'}
                  </span>
                  <span className="text-xs font-mono text-purple-400">{strokeWidth}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              <div className="border-t border-white/5 pt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {t.label_opacity || 'Opacity'}
                  </span>
                  <span className="text-xs font-mono text-purple-400">{Math.round(brushOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={brushOpacity}
                  onChange={(e) => setBrushOpacity(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              <div className="border-t border-white/5 pt-3 flex flex-col gap-2">
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className="flex items-center justify-between w-full py-1.5 px-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-xs font-bold border border-white/5 text-slate-300 hover:text-white cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <Grid className="w-3.5 h-3.5 text-purple-400" />
                    <span>{t.label_grid || 'Grid'}</span>
                  </div>
                  {showGrid ? <ToggleRight className="w-6 h-6 text-purple-400" /> : <ToggleLeft className="w-6 h-6 text-slate-500" />}
                </button>

                {/* Fill geometry shapes toggle */}
                {(activeTool === 'rect' || activeTool === 'circle') && (
                  <button
                    onClick={() => setFillShapes(!fillShapes)}
                    className="flex items-center justify-between w-full py-1.5 px-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-xs font-bold border border-white/5 text-slate-300 hover:text-white cursor-pointer"
                  >
                    <span>{t.label_fill || 'Fill Shapes'}</span>
                    {fillShapes ? <ToggleRight className="w-6 h-6 text-purple-400" /> : <ToggleLeft className="w-6 h-6 text-slate-500" />}
                  </button>
                )}
              </div>
            </div>

            {/* FLOATING ACTION DOWNLOAD BAR (Top Right) */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 p-1.5 bg-[#120d20]/90 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl">
              <button
                onClick={exportPNG}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-black text-[11px] uppercase rounded-xl transition-all cursor-pointer border-none outline-none shadow-lg shadow-purple-500/15"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PNG</span>
              </button>

              <button
                onClick={exportSVG}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white font-black text-[11px] uppercase rounded-xl border border-white/5 transition-all cursor-pointer outline-none"
              >
                <Download className="w-3.5 h-3.5 text-purple-400" />
                <span>{t.btn_download_svg || 'SVG'}</span>
              </button>
            </div>

            {/* FLOATING WHITEBOARD DOCK (Bottom Center) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 p-2 bg-[#120d20]/90 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl max-w-[90vw] overflow-x-auto">
              
              {/* Pencil Freestyle */}
              <button
                onClick={() => setActiveTool('pencil')}
                className={`p-2.5 rounded-xl transition-all cursor-pointer border-none outline-none flex items-center justify-center ${
                  activeTool === 'pencil' ? 'bg-purple-500 text-black shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title={t.tool_pencil || 'Pencil'}
              >
                <Pen className="w-4 h-4" />
              </button>

              {/* Marker/Brush freestyle */}
              <button
                onClick={() => {
                  setActiveTool('marker');
                  setBrushOpacity(0.4); // marker opacity default
                  setStrokeWidth(12); // marker stroke default
                }}
                className={`p-2.5 rounded-xl transition-all cursor-pointer border-none outline-none flex items-center justify-center ${
                  activeTool === 'marker' ? 'bg-purple-500 text-black shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title={t.tool_marker || 'Marker'}
              >
                <Paintbrush className="w-4 h-4" />
              </button>

              {/* Eraser */}
              <button
                onClick={() => setActiveTool('eraser')}
                className={`p-2.5 rounded-xl transition-all cursor-pointer border-none outline-none flex items-center justify-center ${
                  activeTool === 'eraser' ? 'bg-purple-500 text-black shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title={t.tool_eraser || 'Eraser'}
              >
                <Eraser className="w-4 h-4" />
              </button>

              <div className="h-6 w-px bg-white/10 mx-1.5" />

              {/* Line shape */}
              <button
                onClick={() => setActiveTool('line')}
                className={`p-2.5 rounded-xl transition-all cursor-pointer border-none outline-none flex items-center justify-center ${
                  activeTool === 'line' ? 'bg-purple-500 text-black shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title={t.tool_line || 'Line'}
              >
                <Minus className="w-4 h-4" />
              </button>

              {/* Rect shape */}
              <button
                onClick={() => setActiveTool('rect')}
                className={`p-2.5 rounded-xl transition-all cursor-pointer border-none outline-none flex items-center justify-center ${
                  activeTool === 'rect' ? 'bg-purple-500 text-black shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title={t.tool_rect || 'Rectangle'}
              >
                <Square className="w-4 h-4" />
              </button>

              {/* Circle shape */}
              <button
                onClick={() => setActiveTool('circle')}
                className={`p-2.5 rounded-xl transition-all cursor-pointer border-none outline-none flex items-center justify-center ${
                  activeTool === 'circle' ? 'bg-purple-500 text-black shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title={t.tool_circle || 'Circle'}
              >
                <Circle className="w-4 h-4" />
              </button>

              <div className="h-6 w-px bg-white/10 mx-1.5" />

              {/* Undo */}
              <button
                onClick={handleUndo}
                disabled={paths.length === 0}
                className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-20 transition-all cursor-pointer border-none outline-none flex items-center justify-center"
                title={t.btn_undo || 'Undo'}
              >
                <Undo2 className="w-4 h-4" />
              </button>

              {/* Redo */}
              <button
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-20 transition-all cursor-pointer border-none outline-none flex items-center justify-center"
                title={t.btn_redo || 'Redo'}
              >
                <Redo2 className="w-4 h-4" />
              </button>

              <div className="h-6 w-px bg-white/10 mx-1.5" />

              {/* Clear */}
              <button
                onClick={handleClear}
                disabled={paths.length === 0}
                className="p-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-white/5 disabled:opacity-20 transition-all cursor-pointer border-none outline-none flex items-center justify-center"
                title={t.btn_clear || 'Clear Canvas'}
              >
                <Trash2 className="w-4 h-4" />
              </button>

            </div>

          </div>

        </div>

        {/* SEO Text Grid (Below canvas, visible via scrolling) */}
        <div className="max-w-5xl mx-auto w-full mt-12 border-t border-white/5 pt-16 px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 hover:border-purple-500/15 transition-colors">
              <h3 className="text-white font-bold text-lg mb-3">
                {t.seoBrowserSpeedTitle || 'HTML5 Canvas Rendering'}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {t.seoBrowserSpeedText || 'Real-time gesture mapping drawn directly in browser memory. Extremely fluid curves with no server delay.'}
              </p>
            </div>
            
            <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 hover:border-purple-500/15 transition-colors">
              <h3 className="text-white font-bold text-lg mb-3">
                {t.seoUseCaseTitle || 'Frictionless Brainstorms'}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {t.seoUseCaseText || 'Design wireframes, explain formulas, or jot down ideas instantly. All sketches remain in local RAM.'}
              </p>
            </div>

            <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 hover:border-purple-500/15 transition-colors">
              <h3 className="text-white font-bold text-lg mb-3">
                {t.seoPrivacyTitle || '100% Private Art Board'}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {t.seoPrivacyText || 'No accounts, no logs, and no analytics. Your whiteboard strokes are strictly confined to your local sandbox.'}
              </p>
            </div>
          </div>
        </div>

      </main>

      <Footer
        lang={lang}
        t={t}
        onOpenModal={(type) => {
          setModalType(type);
          setModalOpen(true);
        }}
      />

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

export default DrawSnap;
