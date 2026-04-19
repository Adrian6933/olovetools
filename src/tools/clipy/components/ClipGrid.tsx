import React, { useState, useEffect, useRef } from 'react';
import { Clip } from '../types';
import { Play, ImageOff, Loader2, Plus, Check, ArrowDownCircle, FastForward, Link as LinkIcon, Download } from 'lucide-react';

interface ClipGridProps {
  clips: Clip[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onLoadAll: () => void;
  onClipClick: (clip: Clip) => void;
  savedClipIds: Set<string>;
  onToggleSave: (clip: Clip) => void;
  onDownloadExternal: (url: string) => void;
  t: (key: string) => string;
}

const ClipCard: React.FC<{
  clip: Clip;
  onClick: (clip: Clip) => void;
  isSaved: boolean;
  onToggleSave: (clip: Clip) => void;
  onDownloadExternal: (url: string) => void;
  t: (key: string) => string;
}> = ({ clip, onClick, isSaved, onToggleSave, onDownloadExternal, t }) => {
  const [imgError, setImgError] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const formattedViews = new Intl.NumberFormat('en-US', {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(clip.view_count);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(clip.url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div
      id={`clip-card-${clip.id}`}
      className="group flex flex-col gap-4 cursor-pointer"
      onClick={() => onClick(clip)}
    >
      <div
        style={{ isolation: 'isolate', transform: 'translateZ(0)' }}
        className="relative aspect-video bg-[#0a0a0f] overflow-hidden rounded-[2rem] border border-white/5 transition-premium group-hover:border-twitch-base/20 group-hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] group-hover:-translate-y-2"
      >

        {!imgError ? (
          <img
            src={clip.thumbnail_url}
            alt={`Miniatura del clip de Twitch de ${clip.broadcaster_name} titulado ${clip.title || 'Clip'}`}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-[#15151b]">
            <ImageOff className="w-10 h-10 mb-2 opacity-50" />
            <span className="text-xs uppercase font-black tracking-widest">{t('no_preview')}</span>
          </div>
        )}

        {/* Overlay negro muy transparente y suave */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10"></div>

        <div className="absolute top-4 right-4 z-30 flex items-center gap-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300">
          <button
            onClick={(e) => { e.stopPropagation(); onDownloadExternal(clip.url); }}
            className="flex items-center justify-center w-10 h-10 rounded-2xl bg-black/80 text-white border border-white/10 hover:bg-white hover:text-black transition-all shadow-xl cursor-pointer"
            title={t('download_zip_web')}
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopyLink}
            className={`flex items-center justify-center w-10 h-10 rounded-2xl border transition-all shadow-xl cursor-pointer ${isCopied ? 'bg-green-600 border-green-600 text-white' : 'bg-black/80 border-white/10 text-white hover:bg-white hover:text-black'}`}
          >
            {isCopied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSave(clip); }}
            className={`flex items-center justify-center w-10 h-10 rounded-2xl border transition-all shadow-xl cursor-pointer ${isSaved ? 'bg-twitch-base border-twitch-base text-white' : 'bg-black/80 border-white/10 text-white hover:bg-twitch-base hover:border-twitch-base'}`}
          >
            {isSaved ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>

        <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black text-white opacity-80 z-20">
          {clip.duration}
        </div>

        <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black text-white flex items-center gap-2 opacity-80 z-20">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          {formattedViews}
        </div>

        <div className="absolute inset-0 flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-500 bg-black/10 z-20">
          <div className="bg-twitch-base/80 p-6 rounded-full shadow-[0_0_40px_rgba(145,70,255,0.3)] transform scale-50 group-hover:scale-100 transition-transform duration-500">
            <Play className="w-6 h-6 text-white fill-current ml-1" />
          </div>
        </div>
      </div>

      <div className="flex gap-4 px-2">
        <div className="flex-shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-[#1c1c24] p-0.5 overflow-hidden border border-white/5 opacity-60 group-hover:opacity-100 transition-opacity">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${clip.broadcaster_name}`} alt={`Avatar de ${clip.broadcaster_name}`} loading="lazy" decoding="async" className="w-full h-full rounded-2xl" />
          </div>
        </div>
        <div className="flex flex-col min-w-0 justify-center">
          <h3 className="font-black text-base text-gray-100 truncate group-hover:text-twitch-base transition-colors leading-tight mb-1">
            {clip.title}
          </h3>
          <p className="text-xs text-gray-500 font-bold truncate opacity-50 group-hover:opacity-80">
            {clip.broadcaster_name}
          </p>
        </div>
      </div>
    </div>
  );
};

const ClipGrid: React.FC<ClipGridProps> = ({
  clips, isLoading, hasMore, onLoadMore, onLoadAll, onClipClick, savedClipIds, onToggleSave, onDownloadExternal, t
}) => {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => { if (observerTarget.current) observer.unobserve(observerTarget.current); };
  }, [hasMore, isLoading, onLoadMore]);

  if (isLoading && clips.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex flex-col gap-4">
            <div className="aspect-video bg-[#1a1a24] animate-pulse rounded-[2rem]"></div>
            <div className="flex gap-4 px-2">
              <div className="w-11 h-11 rounded-2xl bg-[#1c1c24] animate-pulse"></div>
              <div className="flex-1 space-y-3 py-1"><div className="h-4 bg-[#1c1c24] rounded-xl w-3/4 animate-pulse"></div></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
        {clips.map((clip) => (
          <ClipCard
            key={clip.id} clip={clip} onClick={onClipClick} isSaved={savedClipIds.has(clip.id)}
            onToggleSave={onToggleSave} onDownloadExternal={onDownloadExternal} t={t}
          />
        ))}
      </div>
      <div ref={observerTarget} className="h-10 w-full opacity-0 pointer-events-none"></div>
      <div className="w-full flex justify-center mt-24 mb-24">
        {!isLoading && hasMore && (
          <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl px-6">
            <button onClick={onLoadMore} className="flex-1 bg-[#1a1a24] hover:bg-[#2c2c36] text-white font-black py-6 px-10 rounded-[2rem] border border-white/5 transition-premium active:scale-95 flex items-center justify-center gap-3 shadow-2xl cursor-pointer">
              <ArrowDownCircle className="w-6 h-6 text-twitch-base/30" /> {t('load_more')}
            </button>
            <button onClick={onLoadAll} className="flex-1 bg-twitch-base/60 hover:bg-twitch-base/80 text-white font-black py-6 px-10 rounded-[2rem] transition-premium shadow-xl shadow-twitch-base/5 active:scale-95 flex items-center justify-center gap-3 cursor-pointer">
              <FastForward className="w-6 h-6" /> {t('load_all')}
            </button>
          </div>
        )}
        {isLoading && clips.length > 0 && <div className="flex items-center gap-4 text-twitch-base font-black bg-[#1a1a24] px-12 py-6 rounded-[2rem] shadow-2xl"><Loader2 className="w-6 h-6 animate-spin" /> {t('loading_results')}</div>}
      </div>
    </>
  );
};

export default ClipGrid;