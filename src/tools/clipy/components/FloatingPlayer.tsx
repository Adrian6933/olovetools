
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, GripHorizontal, AlertCircle, MonitorPlay, ExternalLink, Plus, Check, Link as LinkIcon, CheckCircle2, Download, RotateCcw, MoreVertical, Menu } from 'lucide-react';
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
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const isCompact = size.width < 500;
  
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

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const isTouch = 'touches' in e;
    if (!isTouch) e.preventDefault();
    
    setIsDragging(true);
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    
    startPos.current = { x: clientX, y: clientY };
    startDims.current = { x: position.x, y: position.y, w: size.width, h: size.height };
  };

  const handleResizeStart = (direction: ResizeDirection) => (e: React.MouseEvent | React.TouchEvent) => {
    const isTouch = 'touches' in e;
    if (!isTouch) e.preventDefault();
    e.stopPropagation();
    
    setResizeDir(direction);
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    
    startPos.current = { x: clientX, y: clientY };
    startDims.current = { x: position.x, y: position.y, w: size.width, h: size.height };
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const isTouch = 'touches' in e;
      
      if (isTouch && (isDragging || resizeDir)) {
        if (e.cancelable) e.preventDefault();
      }

      const clientX = isTouch ? e.touches[0].clientX : e.clientX;
      const clientY = isTouch ? e.touches[0].clientY : e.clientY;

      if (isDragging) {
        const dx = clientX - startPos.current.x;
        const dy = clientY - startPos.current.y;
        
        let newX = startDims.current.x + dx;
        let newY = startDims.current.y + dy;

        // Enforce boundaries
        newX = Math.max(-size.width + 100, Math.min(newX, window.innerWidth - 100));
        newY = Math.max(0, Math.min(newY, window.innerHeight - 40));

        setPosition({ x: newX, y: newY });
        return;
      }
      if (resizeDir) {
        const dx = clientX - startPos.current.x;
        const dy = clientY - startPos.current.y;
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
    const handleEnd = () => {
      if (isDragging || resizeDir) {
        saveDimensions(position, size);
      }
      setIsDragging(false);
      setResizeDir(null);
    };

    // Ensure player stays in bounds on resize
    const handleWindowResize = () => {
      setPosition(prev => ({
        x: Math.max(0, Math.min(prev.x, window.innerWidth - 100)),
        y: Math.max(0, Math.min(prev.y, window.innerHeight - 40))
      }));
      setSize(prev => ({
        width: Math.min(prev.width, window.innerWidth - 20),
        height: Math.min(prev.height, window.innerHeight - 60)
      }));
    };

    if (isDragging || resizeDir) {
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
      document.body.style.cursor = resizeDir ? `${resizeDir}-resize` : 'move';
    } else {
        document.body.style.cursor = '';
    }
    
    window.addEventListener('resize', handleWindowResize);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
      window.removeEventListener('resize', handleWindowResize);
      document.body.style.cursor = '';
    };
  }, [isDragging, resizeDir, position, size]);

  const handleCopyLink = (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(clip.url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  return (
    <div
      ref={playerRef}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: size.width,
        height: size.height,
        maxWidth: 'calc(100vw - 20px)',
        maxHeight: 'calc(100vh - 20px)',
        zIndex: 9999,
        position: 'fixed'
      }}
      className="bg-[#0e0e10] border-[#2b2b2b] shadow-2xl overflow-visible flex flex-col border rounded-lg"
    >
      <div onMouseDown={handleResizeStart('n')} onTouchStart={handleResizeStart('n')} className="absolute -top-1.5 left-4 right-4 h-4 cursor-n-resize z-[100] bg-transparent"></div>
      <div onMouseDown={handleResizeStart('s')} onTouchStart={handleResizeStart('s')} className="absolute -bottom-1.5 left-4 right-4 h-4 cursor-s-resize z-[100] bg-transparent"></div>
      <div onMouseDown={handleResizeStart('w')} onTouchStart={handleResizeStart('w')} className="absolute top-4 bottom-4 -left-1.5 w-4 cursor-w-resize z-[100] bg-transparent"></div>
      <div onMouseDown={handleResizeStart('e')} onTouchStart={handleResizeStart('e')} className="absolute top-4 bottom-4 -right-1.5 w-4 cursor-e-resize z-[100] bg-transparent"></div>
      <div onMouseDown={handleResizeStart('nw')} onTouchStart={handleResizeStart('nw')} className="absolute -top-1.5 -left-1.5 w-6 h-6 cursor-nw-resize z-[101] bg-transparent"></div>
      <div onMouseDown={handleResizeStart('ne')} onTouchStart={handleResizeStart('ne')} className="absolute -top-1.5 -right-1.5 w-6 h-6 cursor-ne-resize z-[101] bg-transparent"></div>
      <div onMouseDown={handleResizeStart('sw')} onTouchStart={handleResizeStart('sw')} className="absolute -bottom-1.5 -left-1.5 w-6 h-6 cursor-sw-resize z-[101] bg-transparent"></div>
      <div onMouseDown={handleResizeStart('se')} onTouchStart={handleResizeStart('se')} className="absolute -bottom-1.5 -right-1.5 w-6 h-6 cursor-se-resize z-[101] bg-transparent"></div>

      <div
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        style={{ touchAction: 'none' }}
        className="h-12 bg-[#18181b] flex-shrink-0 flex items-center justify-between px-3 select-none border-b border-[#2b2b2b] cursor-move"
      >
        <div className="flex items-center gap-2 text-gray-300 flex-1 min-w-0 mr-4">
            <GripHorizontal className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="text-sm font-bold truncate">
                {isMockClip ? `[DEMO] ${clip.title}` : clip.title}
            </span>
        </div>
        
        <div className="flex items-center gap-1.5 h-full">
            {isCompact ? (
              <div className="relative h-full flex items-center" ref={menuRef}>
                  <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => setShowMenu(!showMenu)}
                  className={`p-2 rounded-lg transition-all cursor-pointer ${showMenu ? 'bg-white/10 text-twitch-base' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  <Menu className="w-5 h-5" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-10 w-48 bg-[#18181b] border border-[#2b2b2b] rounded-xl shadow-2xl py-2 z-[110] animate-in fade-in slide-in-from-top-2 duration-200">
                    <button
                      onClick={(e) => { e.stopPropagation(); resetToDefault(e); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{t('restore')}</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDownloadExternal(clip.url); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>{t('download_zip_web')}</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCopyLink(e); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${isCopied ? 'text-green-400 bg-green-500/10' : 'text-gray-300 hover:bg-white/10'}`}
                    >
                      {isCopied ? <CheckCircle2 className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                      <span>{isCopied ? t('copied') : t('link')}</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleSave(clip); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${isSaved ? 'text-twitch-base bg-twitch-base/10' : 'text-gray-300 hover:bg-white/10'}`}
                    >
                      {isSaved ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      <span>{isSaved ? t('saved') : t('save')}</span>
                    </button>
                    <div className="h-px bg-white/5 my-1"></div>
                    <button
                      onClick={(e) => { e.stopPropagation(); window.open(clip.url, '_blank'); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-gray-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Twitch</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={resetToDefault}
                    className="group/reset flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 border border-blue-500/20 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] shadow-md cursor-pointer"
                    title={t('restore_desc')}
                >
                    <RotateCcw className="w-3.5 h-3.5 group-hover/reset:rotate-[-180deg] transition-transform duration-500" />
                    <span>{t('restore')}</span>
                </button>

                <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => onDownloadExternal(clip.url)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border bg-white/10 text-white border-white/10 hover:bg-white/20 hover:border-white/20 cursor-pointer"
                    title={t('download_zip_web')}
                >
                    <Download className="w-3.5 h-3.5" />
                </button>
                <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={handleCopyLink}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border cursor-pointer ${
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border cursor-pointer ${
                        isSaved 
                        ? 'bg-[#9146FF] text-white border-[#9146FF] hover:bg-red-600 hover:border-red-600' 
                        : 'bg-white/10 text-white border-white/10 hover:bg-[#9146FF] hover:border-[#9146FF]'
                    }`}
                >
                    {isSaved ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>{isSaved ? t('saved') : t('save')}</span>
                </button>
                <div className="w-px h-6 bg-white/10 mx-1"></div>
                <button
                    onMouseDown={(e) => e.stopPropagation()} 
                    onClick={() => window.open(clip.url, '_blank')}
                    title={t('open_twitch')}
                    className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                    <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <button
                onMouseDown={(e) => e.stopPropagation()} 
                onClick={onClose}
                className="p-2 hover:bg-red-500/20 hover:text-red-500 rounded-full text-gray-400 transition-colors cursor-pointer"
                title={t('close')}
            >
                <X className="w-5 h-5" />
            </button>
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
