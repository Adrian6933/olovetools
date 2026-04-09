
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, GripHorizontal, AlertCircle, MonitorPlay, ExternalLink, Plus, Check, Link as LinkIcon, CheckCircle2, Download, RotateCcw } from 'lucide-react';
import { Clip } from '../types';

interface FloatingPlayerProps {
  clip: Clip;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (clip: Clip) => void;
  onDownloadExternal: (url: string) => void;
  t: (key: string) => string;
}

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null;

const STORAGE_KEY = 'clipy_player_dims';

const FloatingPlayer: React.FC<FloatingPlayerProps> = ({ clip, onClose, isSaved, onToggleSave, onDownloadExternal, t }) => {
  const defaultSize = { width: 480, height: 270 };
  const getDefaultPosition = () => ({
    x: typeof window !== 'undefined' ? Math.max(20, window.innerWidth - 520) : 100,
    y: typeof window !== 'undefined' ? Math.max(80, window.innerHeight - 380) : 100
  });

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState(defaultSize);
  const [isDragging, setIsDragging] = useState(false);
  const [resizeDir, setResizeDir] = useState<ResizeDirection>(null);
  const [isCopied, setIsCopied] = useState(false);
  
  const isMockClip = clip.id.startsWith('mock-');
  const isFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:';

  const startPos = useRef({ x: 0, y: 0 }); 
  const startDims = useRef({ x: 0, y: 0, w: 0, h: 0 }); 
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const { x, y, width, height } = JSON.parse(saved);
          const validX = Math.min(Math.max(0, x), window.innerWidth - 100);
          const validY = Math.min(Math.max(0, y), window.innerHeight - 100);
          setPosition({ x: validX, y: validY });
          setSize({ width: width || defaultSize.width, height: height || defaultSize.height });
        } catch (e) {
          setPosition(getDefaultPosition());
        }
      } else {
        setPosition(getDefaultPosition());
      }
    }
  }, []);

  const saveDimensions = (newPos: {x: number, y: number}, newSize: {width: number, height: number}) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      x: newPos.x,
      y: newPos.y,
      width: newSize.width,
      height: newSize.height
    }));
  };

  const resetToDefault = (e: React.MouseEvent) => {
    e.stopPropagation();
    const defPos = getDefaultPosition();
    setPosition(defPos);
    setSize(defaultSize);
    localStorage.removeItem(STORAGE_KEY);
  };

  const { embedUrl, parentDomains, currentHostname } = useMemo(() => {
    if (typeof window === 'undefined') {
        return { embedUrl: '', parentDomains: [], currentHostname: '' };
    }
    const currentHost = window.location.hostname;
    const parents = new Set<string>();
    parents.add('localhost');
    parents.add('127.0.0.1');
    if (currentHost) {
        const parts = currentHost.split('.');
        for (let i = 0; i < parts.length; i++) {
            const domainSlice = parts.slice(i).join('.');
            if (domainSlice.includes('.') || parts.length === 1) {
                parents.add(domainSlice);
            }
        }
    }
    if (document.location.ancestorOrigins) {
        for (let i = 0; i < document.location.ancestorOrigins.length; i++) {
            const origin = document.location.ancestorOrigins[i];
            try {
                const url = new URL(origin);
                if (url.hostname) parents.add(url.hostname);
            } catch (e) {
                if (origin && !origin.includes('://')) parents.add(origin);
            }
        }
    }
    if (document.referrer) {
        try {
            const refUrl = new URL(document.referrer);
            if (refUrl.hostname) parents.add(refUrl.hostname);
        } catch (e) { }
    }
    const finalParents = Array.from(parents);
    let urlString = '';
    if (!isMockClip) {
        const url = new URL(`https://clips.twitch.tv/embed`);
        url.searchParams.set('clip', clip.id);
        url.searchParams.set('autoplay', 'true');
        url.searchParams.set('muted', 'false'); 
        url.searchParams.set('time', '0s');
        finalParents.forEach(p => url.searchParams.append('parent', p));
        urlString = url.toString();
    }
    return { 
        embedUrl: urlString, 
        parentDomains: finalParents,
        currentHostname: currentHost
    };
  }, [clip.id, isMockClip]);

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startPos.current = { x: e.clientX, y: e.clientY };
    startDims.current = { x: position.x, y: position.y, w: size.width, h: size.height };
  };

  const handleResizeStart = (direction: ResizeDirection) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizeDir(direction);
    startPos.current = { x: e.clientX, y: e.clientY };
    startDims.current = { x: position.x, y: position.y, w: size.width, h: size.height };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - startPos.current.x;
        const dy = e.clientY - startPos.current.y;
        setPosition({
          x: startDims.current.x + dx,
          y: startDims.current.y + dy
        });
        return;
      }
      if (resizeDir) {
        const dx = e.clientX - startPos.current.x;
        const dy = e.clientY - startPos.current.y;
        const MIN_W = 320;
        const MIN_H = 180;
        let newW = startDims.current.w;
        let newH = startDims.current.h;
        let newX = startDims.current.x;
        let newY = startDims.current.y;
        if (resizeDir.includes('e')) {
            newW = Math.max(MIN_W, startDims.current.w + dx);
        } else if (resizeDir.includes('w')) {
            const proposedWidth = startDims.current.w - dx;
            if (proposedWidth > MIN_W) {
                newW = proposedWidth;
                newX = startDims.current.x + dx;
            }
        }
        if (resizeDir.includes('s')) {
            newH = Math.max(MIN_H, startDims.current.h + dy);
        } else if (resizeDir.includes('n')) {
            const proposedHeight = startDims.current.h - dy;
            if (proposedHeight > MIN_H) {
                newH = proposedHeight;
                newY = startDims.current.y + dy;
            }
        }
        setSize({ width: newW, height: newH });
        setPosition({ x: newX, y: newY });
      }
    };
    const handleMouseUp = () => {
      if (isDragging || resizeDir) {
        saveDimensions(position, size);
      }
      setIsDragging(false);
      setResizeDir(null);
    };
    if (isDragging || resizeDir) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = resizeDir ? `${resizeDir}-resize` : 'move';
    } else {
        document.body.style.cursor = '';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, [isDragging, resizeDir, position, size]);

  const handleCopyLink = (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(clip.url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div
      ref={playerRef}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: size.width,
        height: size.height,
        zIndex: 9999
      }}
      className="fixed top-0 left-0 flex flex-col bg-[#0e0e10] border border-[#2b2b2b] shadow-2xl rounded-lg overflow-visible"
    >
      <div onMouseDown={handleResizeStart('n')} className="absolute -top-1.5 left-4 right-4 h-4 cursor-n-resize z-[100] bg-transparent"></div>
      <div onMouseDown={handleResizeStart('s')} className="absolute -bottom-1.5 left-4 right-4 h-4 cursor-s-resize z-[100] bg-transparent"></div>
      <div onMouseDown={handleResizeStart('w')} className="absolute top-4 bottom-4 -left-1.5 w-4 cursor-w-resize z-[100] bg-transparent"></div>
      <div onMouseDown={handleResizeStart('e')} className="absolute top-4 bottom-4 -right-1.5 w-4 cursor-e-resize z-[100] bg-transparent"></div>
      <div onMouseDown={handleResizeStart('nw')} className="absolute -top-1.5 -left-1.5 w-6 h-6 cursor-nw-resize z-[101] bg-transparent"></div>
      <div onMouseDown={handleResizeStart('ne')} className="absolute -top-1.5 -right-1.5 w-6 h-6 cursor-ne-resize z-[101] bg-transparent"></div>
      <div onMouseDown={handleResizeStart('sw')} className="absolute -bottom-1.5 -left-1.5 w-6 h-6 cursor-sw-resize z-[101] bg-transparent"></div>
      <div onMouseDown={handleResizeStart('se')} className="absolute -bottom-1.5 -right-1.5 w-6 h-6 cursor-se-resize z-[101] bg-transparent"></div>

      <div
        onMouseDown={handleDragStart}
        className="h-12 bg-[#18181b] flex-shrink-0 flex items-center justify-between px-3 cursor-move select-none border-b border-[#2b2b2b]"
      >
        <div className="flex items-center gap-2 text-gray-300 flex-1 min-w-0 mr-4">
            <GripHorizontal className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="text-sm font-bold truncate">
                {isMockClip ? `[DEMO] ${clip.title}` : clip.title}
            </span>
        </div>
        
        <div className="flex items-center gap-2">
            
            {/* Restaurar Button Localized */}
            <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={resetToDefault}
                className="group/reset flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 border border-blue-500/20 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] shadow-md"
                title={t('restore_desc')}
            >
                <RotateCcw className="w-3.5 h-3.5 group-hover/reset:rotate-[-180deg] transition-transform duration-500" />
                <span className="hidden sm:inline">{t('restore')}</span>
            </button>

            <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => onDownloadExternal(clip.url)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border bg-white/10 text-white border-white/10 hover:bg-white/20 hover:border-white/20"
                title={t('download_zip_web')}
            >
                <Download className="w-3.5 h-3.5" />
            </button>
            <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={handleCopyLink}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border ${
                    isCopied 
                    ? 'bg-green-600 text-white border-green-600' 
                    : 'bg-white/10 text-white border-white/10 hover:bg-white/20 hover:border-white/20'
                }`}
                title={t('copy_link')}
            >
                {isCopied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <LinkIcon className="w-3.5 h-3.5" />}
                <span>{isCopied ? t('copied') : t('link')}</span>
            </button>
            <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => onToggleSave(clip)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border ${
                    isSaved 
                    ? 'bg-[#9146FF] text-white border-[#9146FF] hover:bg-red-600 hover:border-red-600' 
                    : 'bg-white/10 text-white border-white/10 hover:bg-[#9146FF] hover:border-[#9146FF]'
                }`}
            >
                {isSaved ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{isSaved ? t('saved') : t('save')}</span>
            </button>
            <div className="w-px h-6 bg-white/10 mx-1"></div>
            <div className="flex items-center gap-1">
                <button
                    onMouseDown={(e) => e.stopPropagation()} 
                    onClick={() => window.open(clip.url, '_blank')}
                    title={t('open_twitch')}
                    className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                >
                    <ExternalLink className="w-4 h-4" />
                </button>
                <button
                    onMouseDown={(e) => e.stopPropagation()} 
                    onClick={onClose}
                    className="p-2 hover:bg-red-500/20 hover:text-red-500 rounded-full text-gray-400 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
      </div>

      <div className="relative flex-grow bg-black w-full h-full overflow-hidden rounded-b-lg">
        {(isDragging || resizeDir) && (
            <div className="absolute inset-0 z-50 bg-transparent"></div>
        )}
        {isFileProtocol ? (
             <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-[#1f1f23]">
                <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
                <h3 className="text-white font-bold text-lg">{t('protocol_error')}</h3>
                <p className="text-sm text-gray-400 mt-2">{t('protocol_desc')}</p>
                <div className="mt-4 flex flex-col gap-2">
                    <button 
                        onClick={() => window.open(clip.url, '_blank')}
                        className="text-xs bg-[#9146FF] hover:bg-[#772ce8] text-white py-2 px-4 rounded font-bold transition-colors"
                    >
                        {t('open_twitch')}
                    </button>
                </div>
             </div>
        ) : isMockClip ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 bg-[#1f1f23]/50">
                <MonitorPlay className="w-12 h-12 text-[#9146FF] mb-2 opacity-80" />
                <h3 className="text-white font-bold">{t('demo_mode')}</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-[250px]">{t('demo_desc')}</p>
            </div>
        ) : (
            <iframe
            key={embedUrl} 
            src={embedUrl}
            title={clip.title}
            width="100%"
            height="100%"
            scrolling="no"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; fullscreen; clipboard-write; encrypted-media; picture-in-picture; web-share"
            referrerPolicy="origin-when-cross-origin"
            sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation allow-storage-access-by-user-activation"
            className="w-full h-full border-none bg-black"
            ></iframe>
        )}
      </div>
    </div>
  );
};

export default FloatingPlayer;
