import React, { useState, useEffect, useRef } from 'react';
import { ClipData, Resolution } from '../types';
import { Download, Clock, Calendar, Eye, Play, X, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { downloadBlob, fetchMovieBlob } from '../services/twitchService';
import WatermarkPreview from './WatermarkPreview';
import { WatermarkConfig, PositionPreset } from '../types';
import {
  loadStoredWatermarkConfig,
  saveStoredWatermarkConfig,
  loadStoredPresets,
  saveCustomPresets,
  processVideoWithWatermark,
  nombreDeArchivo,
} from '../services/watermarkService';

interface ClipResultProps {
  data: ClipData;
  index: number;
  onReset: () => void;
  lang: string;
  dictionary?: any;
}

const STORAGE_KEY = 'twitchbolt_volume_prefs';

const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const ClipResult: React.FC<ClipResultProps> = ({ data, index, onReset, lang, dictionary }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [downloadingRes, setDownloadingRes] = useState<Record<string, { progress: number, completed: boolean, preparing: boolean, loaded: number, total: number, speed: number }>>({});
  const t = dictionary || {};

  // ---- Editor de marca de agua -------------------------------------------
  // La configuración se carga al abrir, no al montar: así dos clips abiertos a
  // la vez no arrastran cada uno una copia distinta de lo que hay guardado.
  const [wmAbierto, setWmAbierto] = useState(false);
  const [wmConfig, setWmConfig] = useState<WatermarkConfig | null>(null);
  const [wmPresets, setWmPresets] = useState<PositionPreset[]>([]);

  const abrirWatermark = () => {
    setWmConfig(loadStoredWatermarkConfig());
    setWmPresets(loadStoredPresets());
    setWmAbierto(true);
  };

  const cambiarWmConfig = (siguiente: WatermarkConfig) => {
    setWmConfig(siguiente);
    saveStoredWatermarkConfig(siguiente);
  };

  const guardarWmPreset = (nuevo: PositionPreset) => {
    setWmPresets((prev) => {
      const siguiente = [...prev, nuevo];
      saveCustomPresets(siguiente.filter((x) => !x.isDefault));
      return siguiente;
    });
  };

  const borrarWmPreset = (id: string) => {
    setWmPresets((prev) => {
      const siguiente = prev.filter((x) => x.id !== id);
      saveCustomPresets(siguiente.filter((x) => !x.isDefault));
      return siguiente;
    });
  };

  // Descarga el clip y le incrusta el cartel. Las dos fases informan por
  // separado porque duran cosas muy distintas: la descarga va a la velocidad de
  // la red y el render tarda lo que dura el clip, ni más ni menos.
  const exportarConMarca = async (
    quality: string,
    config: WatermarkConfig,
    signal: AbortSignal,
    onProgress: (fase: 'descarga' | 'render', pct: number, restante: number) => void
  ) => {
    const res = data.resolutions.find((r) => r.quality === quality) || data.resolutions[0];
    if (!res) throw new Error('No resolution available');

    const original = await fetchMovieBlob(res.url, (loaded, total) => {
      onProgress('descarga', total > 0 ? Math.round((loaded / total) * 100) : 0, 0);
    }, signal);

    const conMarca = await processVideoWithWatermark(
      original,
      data.broadcaster || 'Streamer',
      config,
      ({ pct, elapsed, total }) => onProgress('render', pct, Math.max(0, total - elapsed)),
      signal
    );

    const safeTitle = nombreDeArchivo(data.title, data.broadcaster, data.id);
    const ext = conMarca.type.includes('webm') ? 'webm' : 'mp4';
    const url = URL.createObjectURL(conMarca);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeTitle}_${res.quality}_watermark.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Igual que en downloadBlob: Safari cancela la descarga si el object URL
    // desaparece en el mismo tick, y estos archivos son grandes.
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };
  
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
        const safeTitle = nombreDeArchivo(data.title, data.broadcaster, data.id);
        
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

             <button
               onClick={wmAbierto ? () => setWmAbierto(false) : abrirWatermark}
               aria-expanded={wmAbierto}
               className={`w-full rounded-2xl p-4 flex items-center justify-center gap-2.5 border text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-[0.98] ${
                 wmAbierto
                   ? 'bg-twitch text-white border-twitch shadow-lg shadow-twitch/20'
                   : 'bg-dark-700 text-gray-300 border-white/5 hover:bg-dark-600 hover:text-white hover:border-white/10'
               }`}
             >
               <Sparkles className="w-4 h-4" />
               {t.watermarkOpen || 'Add a watermark'}
             </button>
          </div>
        </div>

        {wmAbierto && wmConfig && (
          <div className="border-t border-white/5 p-6 md:p-8">
            <WatermarkPreview
              clip={data}
              config={wmConfig}
              onChangeConfig={cambiarWmConfig}
              presets={wmPresets}
              onSavePreset={guardarWmPreset}
              onDeletePreset={borrarWmPreset}
              lang={lang}
              dictionary={dictionary}
              onExport={exportarConMarca}
              onClose={() => setWmAbierto(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ClipResult;
