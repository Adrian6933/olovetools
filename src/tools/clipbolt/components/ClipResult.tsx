import React, { useState, useEffect, useRef } from 'react';
import { ClipData, Resolution } from '../types';
import { Download, Clock, Calendar, Eye, Play, X, Loader2, CheckCircle2 } from 'lucide-react';
import { downloadBlob } from '../services/twitchService';
import { useTranslation, Language } from '../../../locales/dictionary';

interface ClipResultProps {
  data: ClipData;
  index: number;
  onReset: () => void;
  lang: string;
}

const STORAGE_KEY = 'clipbolt_volume_prefs';

const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const ClipResult: React.FC<ClipResultProps> = ({ data, index, onReset, lang }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [downloadingRes, setDownloadingRes] = useState<Record<string, { progress: number, completed: boolean, preparing: boolean, loaded: number, total: number, speed: number }>>({});
  const { dictionary } = useTranslation(lang as Language, 'clipbolt');
  const t = dictionary;
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const abortControllers = useRef<Record<string, AbortController>>({});
  const speedTrackers = useRef<Record<string, { lastLoaded: number, lastTime: number }>>({});

  // Limpiar descargas al desmontar (cuando se borra todo)
  useEffect(() => {
    return () => {
      (Object.values(abortControllers.current) as AbortController[]).forEach(ctrl => ctrl.abort());
    };
  }, []);

  useEffect(() => {
    if (isPlaying && videoRef.current) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const { volume, muted } = JSON.parse(saved);
          videoRef.current.volume = volume;
          videoRef.current.muted = muted;
        } catch (e) {
          console.warn("Could not load volume preferences", e);
        }
      }
    }
  }, [isPlaying]);

  const handleVolumeChange = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    const prefs = { volume: video.volume, muted: video.muted };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  };

  const handleCancelDownload = (quality: string) => {
    if (abortControllers.current[quality]) {
      abortControllers.current[quality].abort();
      delete abortControllers.current[quality];
    }
    delete speedTrackers.current[quality];
    setDownloadingRes(prev => {
      const next = { ...prev };
      delete next[quality];
      return next;
    });
  };

  const handleDownload = async (res: Resolution) => {
    if (downloadingRes[res.quality]) return;

    const quality = res.quality;
    const controller = new AbortController();
    abortControllers.current[quality] = controller;
    speedTrackers.current[quality] = { lastLoaded: 0, lastTime: Date.now() };
    
    setDownloadingRes(prev => ({ 
      ...prev, 
      [quality]: { progress: 0, completed: false, preparing: true, loaded: 0, total: 0, speed: 0 } 
    }));

    try {
        const safeTitle = data.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        
        await downloadBlob(res.url, `${safeTitle}_${res.quality}.mp4`, (loaded, total) => {
            const percentage = total > 0 ? Math.round((loaded / total) * 100) : 0;
            const now = Date.now();
            const tracker = speedTrackers.current[quality];
            let speed = 0;

            if (tracker) {
                const timeDiff = (now - tracker.lastTime) / 1000; // in seconds
                if (timeDiff > 0.5) { // Update speed every 0.5 seconds
                    const bytesDiff = loaded - tracker.lastLoaded;
                    speed = bytesDiff / timeDiff;
                    tracker.lastLoaded = loaded;
                    tracker.lastTime = now;
                }
            }
            
            setDownloadingRes(prev => {
              if (!prev[quality]) return prev;
              const currentSpeed = speed > 0 ? speed : prev[quality].speed;
              return {
                ...prev,
                [quality]: { 
                  ...prev[quality], 
                  progress: percentage, 
                  preparing: loaded === 0,
                  loaded,
                  total,
                  speed: currentSpeed
                }
              };
            });
        }, controller.signal);

        setDownloadingRes(prev => ({
          ...prev,
          [quality]: { ...prev[quality], progress: 100, completed: true, preparing: false, speed: 0 }
        }));
        
    } catch (error: any) {
        if (error.message !== 'AbortError') {
          console.error("Download failed", error);
        }
        setDownloadingRes(prev => {
          const next = { ...prev };
          delete next[quality];
          return next;
        });
    } finally {
        delete abortControllers.current[quality];
        delete speedTrackers.current[quality];
        if (downloadingRes[quality]?.completed) {
          setTimeout(() => {
              setDownloadingRes(prev => {
                  const next = { ...prev };
                  delete next[quality];
                  return next;
              });
          }, 3000);
        }
    }
  };

  const handleComponentReset = () => {
    (Object.values(abortControllers.current) as AbortController[]).forEach(ctrl => ctrl.abort());
    onReset();
  };

  return (
    <div className="w-full relative group animate-fade-in">
      <div className="absolute -top-3 -left-3 z-40 bg-twitch text-white font-black text-xs px-4 py-2 rounded-xl shadow-xl ring-4 ring-[#070708]">
          #{index}
      </div>

      <button 
        onClick={handleComponentReset} 
        className="absolute -top-3 -right-3 z-40 bg-dark-700 hover:bg-red-500 text-gray-500 hover:text-white rounded-full p-2 shadow-xl transition-all ring-4 ring-[#070708] cursor-pointer hover:scale-110 active:scale-90"
      >
          <X className="w-4 h-4" />
      </button>

      <div className="bg-[#111114]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* PREVIEW LEFT */}
          <div className="lg:col-span-7 p-8 md:p-10 border-b lg:border-b-0 lg:border-r border-white/5">
             <div className="relative rounded-2xl overflow-hidden aspect-video bg-black mb-6 group/video">
                {isPlaying ? (
                    <video 
                      ref={videoRef}
                      src={data.resolutions[0].url} 
                      controls 
                      autoPlay 
                      className="w-full h-full" 
                      onEnded={() => setIsPlaying(false)} 
                      onVolumeChange={handleVolumeChange}
                    />
                ) : (
                    <>
                        <img src={data.thumbnail} alt={`Miniatura del clip ${data.title} de ${data.broadcaster}`} loading="lazy" decoding="async" className="w-full h-full object-cover opacity-60" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer" onClick={() => setIsPlaying(true)}>
                            <div className="w-14 h-14 bg-twitch rounded-full flex items-center justify-center shadow-2xl group-hover/video:scale-110 transition-transform">
                                <Play className="w-6 h-6 text-white fill-current ml-1" />
                            </div>
                        </div>
                        <div className="absolute bottom-4 right-4 bg-black/80 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-twitch" /> {Math.round(data.duration)}s
                        </div>
                    </>
                )}
             </div>
             <h2 className="text-2xl font-black text-white mb-6 leading-tight">{data.title}</h2>
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <img src={data.broadcasterImg} alt={`Avatar en Twitch de ${data.broadcaster}`} loading="lazy" decoding="async" className="w-12 h-12 rounded-full border-2 border-twitch/50" />
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-0.5">{t.streamer}</p>
                        <p className="text-lg font-bold text-white leading-none">{data.broadcaster}</p>
                    </div>
                </div>
                <div className="text-right space-y-1">
                    <p className="text-xs font-bold text-gray-500 flex items-center gap-2 justify-end"><Eye className="w-3.5 h-3.5" /> {data.views.toLocaleString()} Views</p>
                    <p className="text-xs font-bold text-gray-500 flex items-center gap-2 justify-end"><Calendar className="w-3.5 h-3.5" /> {data.date}</p>
                </div>
             </div>
          </div>

          {/* DOWNLOADS RIGHT */}
          <div className="lg:col-span-5 p-8 md:p-10 bg-[#0c0c0e]/50 flex flex-col justify-center gap-4">
             {data.resolutions.map((res, i) => {
                const state = downloadingRes[res.quality];
                const isDownloading = state !== undefined;
                const progress = state?.progress || 0;
                const isCompleted = state?.completed || false;
                const isPreparing = state?.preparing || false;
                const loaded = state?.loaded || 0;
                const total = state?.total || 0;
                const speed = state?.speed || 0;

                return (
                    <button
                        key={res.quality}
                        onClick={() => isDownloading ? handleCancelDownload(res.quality) : handleDownload(res)}
                        className={`w-full group/btn relative rounded-2xl p-5 text-left flex items-center justify-between border border-white/5 transition-all overflow-hidden cursor-pointer active:scale-[0.98] ${i === 0 ? 'bg-twitch/5 border-twitch/20 shadow-lg shadow-twitch/5 hover:bg-twitch/10' : 'bg-dark-700 hover:bg-dark-600 hover:border-white/10'}`}
                    >
                        {isDownloading && (
                            <div 
                                className={`absolute inset-0 bg-twitch/20 transition-all duration-300 pointer-events-none ${isCompleted ? 'bg-green-500/10' : ''}`} 
                                style={{ width: `${progress > 0 ? progress : 100}%`, opacity: progress > 0 || total === 0 ? 1 : 0.2 }} 
                            />
                        )}

                        <div className="relative z-10 w-full pr-4">
                            <div className="flex justify-between items-end mb-1">
                                <p className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isCompleted ? 'text-green-500' : (i === 0 ? 'text-twitch' : 'text-gray-500')}`}>
                                    {isCompleted ? 'READY' : (isDownloading ? (isPreparing ? 'PREPARING...' : `${t.downloading} ${total > 0 ? progress + '%' : ''}`) : (i === 0 ? t.bestQuality : t.availableQualities))}
                                </p>
                                {isDownloading && !isCompleted && !isPreparing && (
                                    <p className="text-[10px] font-bold text-gray-400">
                                        {formatBytes(speed)}/s
                                    </p>
                                )}
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-xl font-black text-white">{res.quality} <span className="text-sm font-medium opacity-40">({res.fps}fps)</span></p>
                                {isDownloading && !isCompleted && !isPreparing && (
                                    <p className="text-xs font-medium text-gray-400">
                                        {formatBytes(loaded)} {total > 0 ? `/ ${formatBytes(total)}` : ''}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className={`relative z-10 p-3 bg-white/5 rounded-xl transition-all duration-300 shrink-0 ${isDownloading ? (isCompleted ? 'bg-green-500' : 'bg-twitch shadow-[0_0_15px_rgba(145,70,255,0.4)]') : 'group-hover/btn:bg-twitch'}`}>
                            {isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 text-white animate-in zoom-in duration-300" />
                            ) : (
                                isDownloading ? (
                                    <X className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                                ) : (
                                    <Download className="w-5 h-5 text-white" />
                                )
                            )}
                        </div>
                    </button>
                );
             })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClipResult;
