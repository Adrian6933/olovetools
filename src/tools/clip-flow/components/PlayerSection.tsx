import React, { useEffect, useRef } from 'react';
import { Radio, Settings2 } from 'lucide-react';
import { VodInfo, VodQuality } from '../types';

const loadHls = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).Hls) { resolve((window as any).Hls); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.8/dist/hls.min.js';
    script.onload = () => (window as any).Hls ? resolve((window as any).Hls) : reject(new Error('Hls not found on window'));
    script.onerror = () => reject(new Error('Failed to load Hls.js'));
    document.head.appendChild(script);
  });
};

interface PlayerSectionProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  vod: VodInfo;
  qualities: VodQuality[];
  selectedQuality: VodQuality;
  onQualityChange: (q: VodQuality) => void;
  onTimeUpdate: (time: number) => void;
  onDuration: (duration: number) => void;
  t: any;
}

export const PlayerSection: React.FC<PlayerSectionProps> = ({ videoRef, vod, qualities, selectedQuality, onQualityChange, onTimeUpdate, onDuration, t }) => {
  const hlsRef = useRef<any>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selectedQuality) return;

    const resumeAt = video.currentTime || 0;
    const wasPlaying = !video.paused;

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    const attachAndResume = () => {
      if (resumeAt > 0) video.currentTime = resumeAt;
      if (wasPlaying) video.play().catch(() => {});
    };

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = selectedQuality.url;
      video.addEventListener('loadedmetadata', attachAndResume, { once: true });
    } else {
      loadHls().then((HlsClass) => {
        if (!HlsClass.isSupported()) { video.src = selectedQuality.url; return; }
        const hls = new HlsClass({ maxMaxBufferLength: 30 });
        hlsRef.current = hls;
        hls.loadSource(selectedQuality.url);
        hls.attachMedia(video);
        hls.on(HlsClass.Events.MANIFEST_PARSED, attachAndResume);
        hls.on(HlsClass.Events.ERROR, (_event: any, data: any) => {
          if (data.fatal) console.error('HLS fatal error', data);
        });
      }).catch(() => { video.src = selectedQuality.url; });
    }

    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedQuality?.url]);

  return (
    <div className="glass-card rounded-3xl overflow-hidden">
      <div className="relative bg-black aspect-video">
        <video
          ref={videoRef}
          controls
          className="w-full h-full"
          onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
          onDurationChange={(e) => { if (isFinite(e.currentTarget.duration)) onDuration(e.currentTarget.duration); }}
        />
        {vod.isLive && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
            <Radio className="w-3 h-3 animate-pulse" />
            {t.liveBadge || 'LIVE — recording still growing'}
          </div>
        )}
      </div>
      <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {vod.broadcasterImg && <img src={vod.broadcasterImg} alt={vod.broadcaster} className="w-9 h-9 rounded-full shrink-0" />}
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate">{vod.title}</p>
            <p className="text-slate-400 text-xs truncate">{vod.broadcaster}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Settings2 className="w-4 h-4 text-slate-500" />
          <label className="sr-only" htmlFor="clipflow-quality">{t.qualityLabel || 'Quality'}</label>
          <select
            id="clipflow-quality"
            value={selectedQuality?.url || ''}
            onChange={(e) => {
              const q = qualities.find(q => q.url === e.target.value);
              if (q) onQualityChange(q);
            }}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer"
          >
            {qualities.map(q => (
              <option key={q.url} value={q.url} className="bg-[#0a0408]">{q.quality}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
