import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Maximize2,
  Pause,
  Play,
  Repeat,
  Rewind,
  Square,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { LottieJson } from '../types';

// ============================================================================
// The player.
//
// This lives in its own component on purpose: `enterFrame` fires up to 60 times
// a second, and every one of those used to re-render the entire 700-line page.
// Keeping the playhead state down here means playback never touches the palette,
// the layer tree or the SEO copy above and below it.
// ============================================================================

export interface StageHandle {
  /** Current playhead position, read straight off the animation instance. */
  getFrame: () => number;
  /** The element the SVG renderer draws into, for the SVG export. */
  getContainer: () => HTMLElement | null;
  getTotalFrames: () => number;
  pause: () => void;
}

interface StageProps {
  lottie: any;
  /** The document to render. A new identity here rebuilds the animation. */
  json: LottieJson | null;
  /** The pristine document, shown while the compare button is held. */
  compareJson: LottieJson | null;
  /** Trim range in frames, or null for the document's own range. */
  trim: [number, number] | null;
  t: any;
  onMeta: (meta: { totalFrames: number; frameRate: number; inPoint: number }) => void;
  onError: (message: string) => void;
}

type BgMode = 'checkered' | 'white' | 'dark' | 'custom';

const SPEED_PRESETS = [0.25, 0.5, 1, 1.5, 2];
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 8;

export const Stage = forwardRef<StageHandle, StageProps>(function Stage(
  { lottie, json, compareJson, trim, t, onMeta, onError },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<any>(null);
  const frameRef = useRef(0);

  // Mirrors of the transport state, so the build effect can read the latest
  // values without depending on them (depending on them would rebuild the whole
  // animation every time the user nudged the speed).
  const isPlayingRef = useRef(false);
  const speedRef = useRef(1);
  const loopRef = useRef(true);
  const reverseRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [frameRate, setFrameRate] = useState(30);
  const [loop, setLoop] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [reverse, setReverse] = useState(false);
  const [comparing, setComparing] = useState(false);

  const [bgMode, setBgMode] = useState<BgMode>('checkered');
  const [customBg, setCustomBg] = useState('#1e1e24');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // The document actually mounted right now: the edited one, or the original
  // while the user holds the compare button.
  const activeJson = comparing && compareJson ? compareJson : json;

  useImperativeHandle(
    ref,
    () => ({
      getFrame: () => Math.round(frameRef.current),
      getContainer: () => containerRef.current,
      getTotalFrames: () => totalFrames,
      pause: () => {
        animRef.current?.pause();
        setIsPlaying(false);
      },
    }),
    [totalFrames]
  );

  // -------------------------------------------------------------------------
  // Build / rebuild the animation
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!lottie || !containerRef.current || !activeJson) return;

    // Resume where we left off: rebuilding after a colour change should not
    // throw the user back to frame 0.
    const resumeFrame = frameRef.current;
    const wasPlaying = isPlayingRef.current;
    let instance: any = null;

    try {
      instance = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: true,
        autoplay: false,
        // lottie mutates the data it is handed (it compiles properties onto it),
        // so it never gets the caller's copy.
        animationData: structuredClone(activeJson),
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid meet',
          // Without this, blurs and drop shadows get clipped by the default
          // filter region — the single most common "it looks wrong here" bug.
          filterSize: {
            width: '300%',
            height: '300%',
            x: '-100%',
            y: '-100%',
          },
          // The SVG carries the animation's own name for screen readers.
          title: activeJson.nm || 'Lottie animation',
        },
      });
    } catch (err: any) {
      onError(err?.message || 'Failed to build the animation');
      return;
    }

    animRef.current = instance;

    // Frame-exact scrubbing: without this lottie interpolates between frames and
    // `enterFrame` reports fractional times that make the slider jitter.
    instance.setSubframe(false);

    const total = Math.round(instance.getDuration(true) || activeJson.op || 100);
    const rate = instance.frameRate || activeJson.fr || 30;
    setTotalFrames(total);
    setFrameRate(rate);
    onMeta({ totalFrames: total, frameRate: rate, inPoint: instance.firstFrame || 0 });

    // A Lottie can fail *after* it parses — a broken expression, an asset that
    // will not decode. The old try/catch only ever saw synchronous throws.
    const onDataFailed = () => onError(t.error_render || 'The animation failed to render');
    instance.addEventListener('data_failed', onDataFailed);
    instance.addEventListener('error', onDataFailed);

    // Throttled playhead: the raw event fires per frame, the React state
    // follows it ten times a second. The ref stays exact for exports.
    let pending: ReturnType<typeof setTimeout> | undefined;
    const onEnterFrame = (event: any) => {
      frameRef.current = event.currentTime;
      if (pending !== undefined) return;
      pending = setTimeout(() => {
        pending = undefined;
        setCurrentFrame(Math.round(frameRef.current));
      }, 100);
    };
    instance.addEventListener('enterFrame', onEnterFrame);

    // Restore the playhead and the transport state.
    instance.setSpeed(speedRef.current);
    instance.setDirection(reverseRef.current ? -1 : 1);
    instance.setLoop(loopRef.current);
    const target = resumeFrame > 0 && resumeFrame < total ? resumeFrame : 0;
    if (wasPlaying) instance.goToAndPlay(target, true);
    else instance.goToAndStop(target, true);

    return () => {
      clearTimeout(pending);
      instance.removeEventListener('enterFrame', onEnterFrame);
      instance.removeEventListener('data_failed', onDataFailed);
      instance.removeEventListener('error', onDataFailed);
      instance.destroy();
      // Nulling this matters: the old code left the ref pointing at a destroyed
      // instance, so the transport buttons kept calling methods on it.
      if (animRef.current === instance) animRef.current = null;
    };
    // `speed`, `loop` and `reverse` are applied imperatively below — listing
    // them here would rebuild the whole animation every time they change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lottie, activeJson]);

  isPlayingRef.current = isPlaying;
  speedRef.current = speed;
  loopRef.current = loop;
  reverseRef.current = reverse;

  // -------------------------------------------------------------------------
  // Transport, applied without rebuilding
  // -------------------------------------------------------------------------
  useEffect(() => {
    animRef.current?.setSpeed(speed);
  }, [speed]);

  useEffect(() => {
    animRef.current?.setDirection(reverse ? -1 : 1);
  }, [reverse]);

  useEffect(() => {
    animRef.current?.setLoop(loop);
  }, [loop]);

  useEffect(() => {
    const anim = animRef.current;
    if (!anim) return;
    if (trim) anim.setSegment(trim[0], trim[1]);
    else anim.resetSegments(true);
  }, [trim, activeJson]);

  // -------------------------------------------------------------------------
  // Controls
  // -------------------------------------------------------------------------
  const play = useCallback(() => {
    const anim = animRef.current;
    if (!anim) return;
    anim.play();
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    const anim = animRef.current;
    if (!anim) return;
    anim.pause();
    setIsPlaying(false);
    setCurrentFrame(Math.round(frameRef.current));
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) pause();
    else play();
  }, [pause, play]);

  const seek = useCallback((frame: number) => {
    const anim = animRef.current;
    if (!anim) return;
    const clamped = Math.max(0, Math.min(frame, Math.max(0, (anim.totalFrames || 1) - 1)));
    anim.goToAndStop(clamped, true);
    frameRef.current = clamped;
    setCurrentFrame(clamped);
    setIsPlaying(false);
  }, []);

  const step = useCallback(
    (delta: number) => {
      seek(Math.round(frameRef.current) + delta);
    },
    [seek]
  );

  const stop = useCallback(() => {
    const anim = animRef.current;
    if (!anim) return;
    anim.stop();
    frameRef.current = 0;
    setCurrentFrame(0);
    setIsPlaying(false);
  }, []);

  // -------------------------------------------------------------------------
  // Zoom & pan
  // -------------------------------------------------------------------------
  const fit = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const zoomBy = useCallback((factor: number, origin?: { x: number; y: number }) => {
    setZoom(prevZoom => {
      const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prevZoom * factor));
      if (origin) {
        // Keep the point under the cursor pinned while the scale changes.
        const ratio = next / prevZoom;
        setPan(prevPan => ({
          x: origin.x - (origin.x - prevPan.x) * ratio,
          y: origin.y - (origin.y - prevPan.y) * ratio,
        }));
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    // Registered natively because React's onWheel is passive, and a passive
    // listener cannot preventDefault the page scroll.
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey && !event.shiftKey && Math.abs(event.deltaY) < 4) return;
      event.preventDefault();
      const rect = viewport.getBoundingClientRect();
      zoomBy(event.deltaY < 0 ? 1.12 : 1 / 1.12, {
        x: event.clientX - rect.left - rect.width / 2,
        y: event.clientY - rect.top - rect.height / 2,
      });
    };
    viewport.addEventListener('wheel', onWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', onWheel);
  }, [zoomBy]);

  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const onPointerDown = (event: React.PointerEvent) => {
    if (event.button !== 0 && event.button !== 1) return;
    dragRef.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
    (event.target as Element).setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    setPan({ x: drag.panX + (event.clientX - drag.x), y: drag.panY + (event.clientY - drag.y) });
  };

  const endDrag = (event: React.PointerEvent) => {
    dragRef.current = null;
    (event.target as Element).releasePointerCapture?.(event.pointerId);
  };

  // -------------------------------------------------------------------------
  // Keyboard shortcuts, scoped to the stage
  // -------------------------------------------------------------------------
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
      // Only act when the pointer is over the player, so the page stays usable.
      if (!viewportRef.current?.matches(':hover') && !hostRef.current?.contains(document.activeElement)) {
        return;
      }

      const jump = event.shiftKey ? 10 : 1;
      switch (event.key) {
        case ' ':
          event.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          step(-jump);
          break;
        case 'ArrowRight':
          event.preventDefault();
          step(jump);
          break;
        case 'Home':
          event.preventDefault();
          seek(0);
          break;
        case 'End':
          event.preventDefault();
          seek(totalFrames - 1);
          break;
        case 'l':
        case 'L':
          setLoop(value => !value);
          break;
        case 'r':
        case 'R':
          setReverse(value => !value);
          break;
        case '+':
        case '=':
          zoomBy(1.2);
          break;
        case '-':
        case '_':
          zoomBy(1 / 1.2);
          break;
        case '0':
          fit();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [fit, seek, step, togglePlay, totalFrames, zoomBy]);

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------
  const backdrop = useMemo((): React.CSSProperties => {
    if (bgMode === 'white') return { backgroundColor: '#ffffff' };
    if (bgMode === 'dark') return { backgroundColor: '#111827' };
    if (bgMode === 'custom') return { backgroundColor: customBg };
    return {
      backgroundImage: `linear-gradient(45deg, rgba(255,255,255,0.04) 25%, transparent 25%),
                        linear-gradient(-45deg, rgba(255,255,255,0.04) 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.04) 75%),
                        linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.04) 75%)`,
      backgroundSize: '20px 20px',
      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
      backgroundColor: '#0a0a0f',
    };
  }, [bgMode, customBg]);

  const duration = frameRate > 0 ? (totalFrames / frameRate).toFixed(2) : '0.00';
  const bgLabels: Record<BgMode, string> = {
    checkered: t.bg_checkered || 'Checkered',
    white: t.bg_white || 'White',
    dark: t.bg_dark || 'Dark',
    custom: t.bg_custom || 'Custom',
  };

  return (
    <div ref={hostRef} className="flex flex-col gap-5" tabIndex={-1}>
      {/* Backdrop selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            {t.label_bg_color || 'Backdrop'}
          </span>
          <div className="flex flex-wrap items-center bg-black/40 border border-white/5 rounded-xl p-1 gap-1">
            {(['checkered', 'white', 'dark', 'custom'] as BgMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setBgMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  bgMode === mode ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {bgLabels[mode]}
              </button>
            ))}
            {bgMode === 'custom' && (
              <input
                type="color"
                value={customBg}
                onChange={event => setCustomBg(event.target.value)}
                aria-label={bgLabels.custom}
                className="w-6 h-6 border-none cursor-pointer rounded bg-transparent p-0 mx-1"
              />
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => zoomBy(1 / 1.25)}
            title={t.zoom_out || 'Zoom out'}
            className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-slate-300 cursor-pointer transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="font-mono text-xs text-slate-400 w-12 text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => zoomBy(1.25)}
            title={t.zoom_in || 'Zoom in'}
            className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-slate-300 cursor-pointer transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={fit}
            title={t.zoom_fit || 'Fit'}
            className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-slate-300 cursor-pointer transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          {compareJson && (
            <button
              onPointerDown={() => setComparing(true)}
              onPointerUp={() => setComparing(false)}
              onPointerLeave={() => setComparing(false)}
              title={t.compare_hint || 'Hold to compare with the original'}
              className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-bold cursor-pointer transition-all select-none ${
                comparing
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Eye className="w-4 h-4" />
              {t.compare_label || 'Compare'}
            </button>
          )}
        </div>
      </div>

      {/* Viewport */}
      <div
        ref={viewportRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="w-full h-80 md:h-[420px] rounded-2xl relative border border-white/10 overflow-hidden touch-none cursor-grab active:cursor-grabbing"
        style={backdrop}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            // A transition here would fight the wheel handler on every notch.
            transformOrigin: 'center center',
          }}
        >
          <div ref={containerRef} className="w-full h-full" />
        </div>

        {comparing && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/30 text-[10px] font-black uppercase tracking-wider text-cyan-200 pointer-events-none">
            {t.compare_badge || 'Original'}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-slate-400 w-12 text-left tabular-nums">
          {currentFrame}
        </span>
        <input
          type="range"
          min={0}
          max={Math.max(1, totalFrames - 1)}
          value={Math.min(currentFrame, Math.max(1, totalFrames - 1))}
          onChange={event => seek(Number(event.target.value))}
          aria-label={t.label_timeline || 'Timeline'}
          className="flex-grow h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
        />
        <span className="font-mono text-xs text-slate-500 w-20 text-right tabular-nums">
          {totalFrames} · {duration}s
        </span>
      </div>

      {/* Transport */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            title={isPlaying ? t.btn_pause || 'Pause' : t.btn_play || 'Play'}
            aria-label={isPlaying ? t.btn_pause || 'Pause' : t.btn_play || 'Play'}
            className="p-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-white rounded-xl cursor-pointer"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
          </button>
          <button
            onClick={stop}
            title={t.btn_stop || 'Stop'}
            aria-label={t.btn_stop || 'Stop'}
            className="p-3 bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all text-slate-300 rounded-xl cursor-pointer"
          >
            <Square className="w-5 h-5 fill-slate-300" />
          </button>
          <button
            onClick={() => seek(0)}
            title={t.btn_rewind || 'Back to start'}
            aria-label={t.btn_rewind || 'Back to start'}
            className="p-3 bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all text-slate-300 rounded-xl cursor-pointer"
          >
            <Rewind className="w-5 h-5" />
          </button>
          <button
            onClick={() => step(-1)}
            title={t.btn_prev_frame || 'Previous frame'}
            aria-label={t.btn_prev_frame || 'Previous frame'}
            className="p-3 bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all text-slate-300 rounded-xl cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => step(1)}
            title={t.btn_next_frame || 'Next frame'}
            aria-label={t.btn_next_frame || 'Next frame'}
            className="p-3 bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all text-slate-300 rounded-xl cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            {t.label_speed || 'Speed'}
          </span>
          <div className="flex flex-wrap bg-black/40 border border-white/10 rounded-xl p-1 gap-1">
            {SPEED_PRESETS.map(value => (
              <button
                key={value}
                onClick={() => setSpeed(value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  speed === value ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {value}x
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setLoop(value => !value)}
          className={`px-3.5 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            loop
              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
              : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
          }`}
        >
          <Repeat className="w-3.5 h-3.5" />
          {t.label_loop || 'Loop'}
        </button>

        <button
          onClick={() => setReverse(value => !value)}
          className={`px-3.5 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            reverse
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
              : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
          }`}
        >
          <Rewind className="w-3.5 h-3.5" />
          {t.label_reverse || 'Reverse'}
        </button>

        <span
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
            isPlaying
              ? 'text-green-400 bg-green-500/10 border-green-500/20'
              : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
          }`}
        >
          {isPlaying ? t.status_playing || 'Playing' : t.status_paused || 'Paused'}
        </span>
      </div>

      <p className="text-[11px] text-slate-600 font-medium">
        {t.shortcuts_hint ||
          'Space play/pause · ← → step a frame (Shift for ten) · L loop · R reverse · +/- zoom · 0 fit · wheel to zoom, drag to pan'}
      </p>
    </div>
  );
});

export default Stage;
