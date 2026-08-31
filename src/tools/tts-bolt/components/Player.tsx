import React, { useCallback, useEffect, useRef } from 'react';
import { Pause, Play, Rewind, Square, FastForward } from 'lucide-react';
import { formatClock } from '../lib/audio';
import type { Timeline } from '../types';

interface PlayerProps {
  timeline: Timeline;
  playing: boolean;
  /** Playhead position in seconds. */
  time: number;
  speed: number;
  onSpeedChange: (speed: number) => void;
  onSeek: (seconds: number) => void;
  onTogglePlay: () => void;
  onStop: () => void;
  t: any;
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

/**
 * Transport for the rendered timeline.
 *
 * The waveform is painted straight from the pre-computed peaks on every state
 * change, not inside a requestAnimationFrame callback: rAF is suspended
 * entirely while the tab is in the background, which used to leave the canvas
 * blank at its default 300×150 for anyone who switched tabs during a render.
 */
export const Player: React.FC<PlayerProps> = ({
  timeline,
  playing,
  time,
  speed,
  onSpeedChange,
  onSeek,
  onTogglePlay,
  onStop,
  t,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;

    // Re-derive the backing size from the live rect each paint, so a resize
    // that arrived while the tab was hidden cannot leave the canvas stretched.
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.round(rect.width * dpr);
    const height = Math.round(rect.height * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    const peaks = timeline.peaks;
    const mid = height / 2;
    const progress = timeline.durationSec > 0 ? Math.min(1, time / timeline.durationSec) : 0;
    const barWidth = width / peaks.length;

    for (let i = 0; i < peaks.length; i++) {
      const played = i / peaks.length < progress;
      // A floor of 1.5 device pixels keeps silence visible as a hairline
      // instead of a gap, so the length of a pause reads at a glance.
      const barHeight = Math.max(1.5 * dpr, peaks[i] * (height * 0.92));
      ctx.fillStyle = played ? '#f59e0b' : 'rgba(148,163,184,0.28)';
      ctx.fillRect(i * barWidth, mid - barHeight / 2, Math.max(1, barWidth - 0.6 * dpr), barHeight);
    }

    // Block boundaries: where one paragraph's render ends and the next begins.
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    for (const start of Object.values(timeline.blockStarts)) {
      if (start <= 0) continue;
      const x = (start / timeline.durationSec) * width;
      ctx.fillRect(x, 0, Math.max(1, dpr), height);
    }

    const playheadX = progress * width;
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(playheadX - dpr, 0, 2 * dpr, height);
  }, [timeline, time]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const onResize = () => draw();
    window.addEventListener('resize', onResize);
    const observer = new ResizeObserver(onResize);
    if (canvasRef.current) observer.observe(canvasRef.current);
    return () => {
      window.removeEventListener('resize', onResize);
      observer.disconnect();
    };
  }, [draw]);

  const seekFromEvent = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onSeek(ratio * timeline.durationSec);
  };

  return (
    <div className="space-y-3">
      <canvas
        ref={canvasRef}
        role="slider"
        tabIndex={0}
        aria-label={t.seekLabel || 'Seek'}
        aria-valuemin={0}
        aria-valuemax={Math.round(timeline.durationSec)}
        aria-valuenow={Math.round(time)}
        onPointerDown={e => {
          dragging.current = true;
          (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
          seekFromEvent(e.clientX);
        }}
        onPointerMove={e => {
          if (dragging.current) seekFromEvent(e.clientX);
        }}
        onPointerUp={e => {
          dragging.current = false;
          (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
        }}
        onKeyDown={e => {
          if (e.key === 'ArrowLeft') onSeek(Math.max(0, time - 5));
          if (e.key === 'ArrowRight') onSeek(Math.min(timeline.durationSec, time + 5));
        }}
        className="w-full h-24 md:h-28 rounded-2xl bg-black/40 border border-white/10 cursor-pointer touch-none block"
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onTogglePlay}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition-colors cursor-pointer border-none"
        >
          {playing ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black" />}
          <span>{playing ? t.btn_pause || 'Pause' : t.btn_play || 'Listen'}</span>
        </button>

        <button
          onClick={onStop}
          aria-label={t.btn_stop || 'Stop'}
          className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors cursor-pointer"
        >
          <Square className="w-4 h-4 fill-current" />
        </button>

        <button
          onClick={() => onSeek(Math.max(0, time - 5))}
          aria-label={t.rewindLabel || 'Back 5 seconds'}
          className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors cursor-pointer"
        >
          <Rewind className="w-4 h-4" />
        </button>

        <button
          onClick={() => onSeek(Math.min(timeline.durationSec, time + 5))}
          aria-label={t.forwardLabel || 'Forward 5 seconds'}
          className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors cursor-pointer"
        >
          <FastForward className="w-4 h-4" />
        </button>

        <div className="font-mono text-xs font-bold text-slate-400 tabular-nums px-2">
          {formatClock(time)} / {formatClock(timeline.durationSec)}
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/10 ml-auto">
          {SPEEDS.map(option => (
            <button
              key={option}
              onClick={() => onSpeedChange(option)}
              className={`px-2 py-1 rounded-lg text-[10px] font-black tabular-nums transition-colors cursor-pointer border-none ${
                speed === option ? 'bg-amber-500/20 text-amber-300' : 'bg-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {option}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Player;
