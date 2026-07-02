import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Radio, Settings2, Play, Pause, Volume2, VolumeX, Maximize, Minimize, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { VodInfo, VodQuality } from '../types';
import { formatHMS } from './TimeInput';

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

const SPEEDS = [0.25, 0.5, 1, 1.5, 2];

interface PlayerSectionProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  vod: VodInfo;
  qualities: VodQuality[];
  selectedQuality: VodQuality;
  onQualityChange: (q: VodQuality) => void;
  onTimeUpdate: (time: number) => void;
  onDuration: (duration: number) => void;
  initialSeekTime?: number;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  t: any;
}

export const PlayerSection: React.FC<PlayerSectionProps> = ({ videoRef, vod, qualities, selectedQuality, onQualityChange, onTimeUpdate, onDuration, initialSeekTime, isFullscreen, onToggleFullscreen, t }) => {
  const hlsRef = useRef<any>(null);
  const appliedInitialSeek = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [displayTime, setDisplayTime] = useState(0);
  const [displayDuration, setDisplayDuration] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selectedQuality) return;

    const resumeAt = !appliedInitialSeek.current && initialSeekTime ? initialSeekTime : (video.currentTime || 0);
    const wasPlaying = !video.paused;

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    const attachAndResume = () => {
      if (appliedInitialSeek.current) return; // guards against any late/duplicate manifest events
      if (resumeAt > 0) video.currentTime = resumeAt;
      appliedInitialSeek.current = true;
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
        // .once (not .on): the live/growing playlist can re-fire MANIFEST_PARSED on
        // internal refresh, and re-running this would snap playback back to resumeAt.
        hls.once(HlsClass.Events.MANIFEST_PARSED, attachAndResume);
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

  // ---- Custom transport controls (mirror native <video> state) ----
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onVolume = () => setIsMuted(video.muted);
    const onRate = () => setSpeed(video.playbackRate);
    const onTime = () => setDisplayTime(video.currentTime);
    const onDur = () => { if (isFinite(video.duration)) setDisplayDuration(video.duration); };
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('volumechange', onVolume);
    video.addEventListener('ratechange', onRate);
    video.addEventListener('timeupdate', onTime);
    video.addEventListener('durationchange', onDur);
    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('volumechange', onVolume);
      video.removeEventListener('ratechange', onRate);
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('durationchange', onDur);
    };
  }, [videoRef]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {}); else video.pause();
  }, [videoRef]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  }, [videoRef]);

  const stepFrames = useCallback((frames: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    const fps = selectedQuality?.fps || 30;
    const target = Math.min(video.duration || Infinity, Math.max(0, video.currentTime + frames / fps));
    video.currentTime = target;
  }, [videoRef, selectedQuality]);

  const handleMiniSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !displayDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    video.currentTime = pct * displayDuration;
  };

  const progressPct = displayDuration > 0 ? (displayTime / displayDuration) * 100 : 0;

  return (
    <div className={`glass-card rounded-3xl overflow-hidden flex flex-col ${isFullscreen ? 'h-full' : ''}`}>
      <div className={`relative bg-black ${isFullscreen ? 'flex-1 min-h-0' : 'aspect-video'}`}>
        <video
          ref={videoRef}
          className="w-full h-full"
          onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
          onDurationChange={(e) => { if (isFinite(e.currentTarget.duration)) onDuration(e.currentTarget.duration); }}
          onClick={togglePlay}
        />
        {vod.isLive && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
            <Radio className="w-3 h-3 animate-pulse" />
            {t.liveBadge || 'LIVE — recording still growing'}
          </div>
        )}
      </div>

      {/* Custom transport bar: frame-accurate stepping + fullscreen, which native controls don't offer */}
      <div className="px-3 md:px-4 py-2.5 flex items-center gap-2 md:gap-3 bg-black/40 border-t border-white/5">
        <button onClick={togglePlay} title={isPlaying ? (t.pause || 'Pause') : (t.play || 'Play')} className="p-1.5 rounded-lg text-white hover:bg-white/10 transition-colors cursor-pointer">
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <div className="flex items-center gap-0.5">
          <button onClick={() => stepFrames(-10)} title={t.stepBack10 || 'Back 10 frames'} className="p-1.5 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer">
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button onClick={() => stepFrames(-1)} title={t.stepBack1 || 'Back 1 frame'} className="p-1.5 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => stepFrames(1)} title={t.stepFwd1 || 'Forward 1 frame'} className="p-1.5 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => stepFrames(10)} title={t.stepFwd10 || 'Forward 10 frames'} className="p-1.5 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer">
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>

        <div onClick={handleMiniSeek} className="hidden sm:block flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 bg-violet-500 rounded-full" style={{ width: `${progressPct}%` }} />
        </div>

        <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap hidden sm:inline">{formatHMS(displayTime)} / {formatHMS(displayDuration)}</span>

        <select
          value={speed}
          onChange={(e) => { const video = videoRef.current; if (video) video.playbackRate = parseFloat(e.target.value); }}
          title={t.playbackSpeed || 'Playback speed'}
          className="bg-white/5 border border-white/10 rounded-lg px-1.5 py-1 text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer"
        >
          {SPEEDS.map(s => <option key={s} value={s} className="bg-[#0a0408]">{s}x</option>)}
        </select>

        <button onClick={toggleMute} title={isMuted ? (t.unmute || 'Unmute') : (t.mute || 'Mute')} className="p-1.5 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer">
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {onToggleFullscreen && (
          <button onClick={onToggleFullscreen} title={isFullscreen ? (t.exitFullscreen || 'Exit fullscreen') : (t.fullscreen || 'Fullscreen')} className="p-1.5 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer">
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
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
      {vod.isLive && (
        <p className="px-4 md:px-5 pb-4 -mt-2 text-[11px] text-slate-500">
          {t.liveDvrNote || 'This broadcast is still live: only the recent recording window is seekable until it ends.'}
        </p>
      )}
    </div>
  );
};
