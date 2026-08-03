// ============================================================================
// RecordSnap capture engine
// ----------------------------------------------------------------------------
// Everything that touches MediaRecorder, getDisplayMedia/getUserMedia, the
// canvas compositor and the audio graph lives here so the component stays a
// state machine. No dependencies: the whole recorder is browser APIs.
// ============================================================================

import type {
  ContainerMode,
  DeviceOption,
  OverlayState,
  QualityMode,
  ResolutionMode,
  SurfaceKind,
} from '../types';

// ---------------------------------------------------------------------------
// Codecs and containers
// ---------------------------------------------------------------------------

/**
 * Ordered best-first per container. AV1 is deliberately absent: real-time AV1
 * encoding drops frames on most machines, and a screencast that stutters is
 * worse than one that is 20% bigger.
 */
const CODECS: Record<ContainerMode, string[]> = {
  mp4: [
    'video/mp4;codecs=avc1.640028,mp4a.40.2', // H.264 High
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2', // H.264 Baseline
    'video/mp4;codecs=avc3,opus',
    'video/mp4',
  ],
  webm: [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=h264,opus',
    'video/webm',
  ],
};

export function supportedMime(container: ContainerMode): string | null {
  if (typeof MediaRecorder === 'undefined') return null;
  return CODECS[container].find(m => MediaRecorder.isTypeSupported(m)) ?? null;
}

/** Containers this browser can actually write. Empty means no MediaRecorder. */
export function availableContainers(): ContainerMode[] {
  return (['mp4', 'webm'] as ContainerMode[]).filter(c => supportedMime(c) !== null);
}

export function codecLabel(mime: string): string {
  const found = /codecs=([^;"]+)/.exec(mime);
  const c = (found?.[1] || '').toLowerCase();
  if (c.startsWith('avc') || c.startsWith('h264')) return 'H.264';
  if (c.startsWith('av01')) return 'AV1';
  if (c.startsWith('vp9')) return 'VP9';
  if (c.startsWith('vp8')) return 'VP8';
  return mime.includes('mp4') ? 'H.264' : 'VP8';
}

export function extFor(mime: string): string {
  return mime.includes('mp4') ? 'mp4' : 'webm';
}

// ---------------------------------------------------------------------------
// Bitrate
// ---------------------------------------------------------------------------

/**
 * Bits per pixel per frame. MediaRecorder's default is roughly 2.5 Mbit/s no
 * matter the resolution, which is why untuned browser recorders look like mush
 * at 1080p. These are screen-content targets (flat colours, sharp text).
 */
const BPP: Record<QualityMode, number> = { eco: 0.045, balanced: 0.1, high: 0.18, max: 0.28 };
const AUDIO_BPS: Record<QualityMode, number> = { eco: 96e3, balanced: 128e3, high: 192e3, max: 256e3 };

export function videoBitrate(width: number, height: number, fps: number, quality: QualityMode): number {
  const raw = width * height * fps * BPP[quality];
  return Math.round(Math.min(60e6, Math.max(600e3, raw)));
}

export function audioBitrate(quality: QualityMode): number {
  return AUDIO_BPS[quality];
}

/** Long edge cap for each resolution preset; `native` keeps whatever the source gives. */
export const RES_CAP: Record<ResolutionMode, { w: number; h: number } | null> = {
  native: null,
  '1440p': { w: 2560, h: 1440 },
  '1080p': { w: 1920, h: 1080 },
  '720p': { w: 1280, h: 720 },
};

/** Fits `w×h` inside the preset while keeping the aspect ratio, rounded to even. */
export function capSize(w: number, h: number, mode: ResolutionMode): { w: number; h: number } {
  const cap = RES_CAP[mode];
  if (!cap || (w <= cap.w && h <= cap.h)) return { w: even(w), h: even(h) };
  const scale = Math.min(cap.w / w, cap.h / h);
  return { w: even(w * scale), h: even(h * scale) };
}

const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);

// ---------------------------------------------------------------------------
// Background-safe ticker
// ---------------------------------------------------------------------------

export interface Ticker {
  stop(): void;
  setRate(ms: number): void;
}

/**
 * Both `requestAnimationFrame` and `setInterval` are throttled to ~1 Hz in a
 * hidden tab — which is the normal state of this page while you record your
 * screen. Worker timers are not throttled, so the compositor keeps running at
 * full frame rate while you present somewhere else.
 */
export function createTicker(ms: number, onTick: () => void): Ticker {
  try {
    const src = `let id=0;onmessage=e=>{clearInterval(id);if(e.data>0)id=setInterval(()=>postMessage(0),e.data)}`;
    const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
    const worker = new Worker(url);
    URL.revokeObjectURL(url);
    worker.onmessage = () => onTick();
    worker.postMessage(ms);
    return {
      stop() {
        worker.postMessage(0);
        worker.terminate();
      },
      setRate(next) {
        worker.postMessage(next);
      },
    };
  } catch {
    let id = window.setInterval(onTick, ms);
    return {
      stop() {
        window.clearInterval(id);
      },
      setRate(next) {
        window.clearInterval(id);
        id = window.setInterval(onTick, next);
      },
    };
  }
}

// ---------------------------------------------------------------------------
// Capture
// ---------------------------------------------------------------------------

export interface DisplayCaptureOptions {
  fps: number;
  resolution: ResolutionMode;
  systemAudio: boolean;
  /** Nudges the browser picker towards a surface type; the user still decides. */
  prefer?: SurfaceKind;
}

export interface DisplayCapture {
  stream: MediaStream;
  surface: SurfaceKind;
}

export async function captureDisplay(opts: DisplayCaptureOptions): Promise<DisplayCapture> {
  const cap = RES_CAP[opts.resolution];

  // `selfBrowserSurface: 'exclude'` removes this very tab from the picker, so
  // the infinite-mirror screenshot is impossible. `surfaceSwitching` lets the
  // user change the shared window mid-recording without restarting.
  const constraints: any = {
    video: {
      frameRate: { ideal: opts.fps, max: opts.fps },
      ...(cap ? { width: { max: cap.w }, height: { max: cap.h } } : {}),
      ...(opts.prefer && opts.prefer !== 'unknown' ? { displaySurface: opts.prefer } : {}),
    },
    audio: opts.systemAudio
      ? { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      : false,
    selfBrowserSurface: 'exclude',
    surfaceSwitching: 'include',
    systemAudio: opts.systemAudio ? 'include' : 'exclude',
  };

  // Without this the browser jumps to the shared tab the moment sharing starts,
  // yanking the user away from the recorder.
  const Controller = (window as any).CaptureController;
  if (typeof Controller === 'function') {
    try {
      const controller = new Controller();
      controller.setFocusBehavior('no-focus-change');
      constraints.controller = controller;
    } catch {
      /* Firefox has no CaptureController; the capture works fine without it. */
    }
  }

  const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
  const settings: any = stream.getVideoTracks()[0]?.getSettings() || {};
  const surface: SurfaceKind =
    settings.displaySurface === 'monitor' ||
    settings.displaySurface === 'window' ||
    settings.displaySurface === 'browser'
      ? settings.displaySurface
      : 'unknown';

  return { stream, surface };
}

export interface UserCaptureOptions {
  video: boolean;
  audio: boolean;
  cameraId?: string;
  micId?: string;
  fps: number;
  resolution: ResolutionMode;
  /** Off when you are capturing music or a game, on when you are talking. */
  voiceProcessing: boolean;
}

export async function captureUser(opts: UserCaptureOptions): Promise<MediaStream> {
  const cap = RES_CAP[opts.resolution];
  const constraints: MediaStreamConstraints = {};

  if (opts.video) {
    constraints.video = {
      ...(opts.cameraId ? { deviceId: { exact: opts.cameraId } } : {}),
      width: { ideal: cap?.w ?? 1920 },
      height: { ideal: cap?.h ?? 1080 },
      frameRate: { ideal: opts.fps },
    };
  }
  if (opts.audio) {
    constraints.audio = {
      ...(opts.micId ? { deviceId: { exact: opts.micId } } : {}),
      echoCancellation: opts.voiceProcessing,
      noiseSuppression: opts.voiceProcessing,
      autoGainControl: opts.voiceProcessing,
    };
  }

  return navigator.mediaDevices.getUserMedia(constraints);
}

/**
 * Device labels are blank until the user has granted permission at least once,
 * so this is worth calling again after arming.
 */
export async function listDevices(): Promise<{ cameras: DeviceOption[]; mics: DeviceOption[] }> {
  try {
    const all = await navigator.mediaDevices.enumerateDevices();
    const map = (kind: MediaDeviceKind, fallback: string) =>
      all
        .filter(d => d.kind === kind)
        .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `${fallback} ${i + 1}` }));
    return { cameras: map('videoinput', 'Camera'), mics: map('audioinput', 'Microphone') };
  } catch {
    return { cameras: [], mics: [] };
  }
}

// ---------------------------------------------------------------------------
// Audio graph
// ---------------------------------------------------------------------------

export interface AudioGraph {
  tracks: MediaStreamTrack[];
  /** Reads live levels without forcing a React render per frame. */
  level(): number;
  setMicMuted(muted: boolean): void;
  setSystemMuted(muted: boolean): void;
  close(): void;
}

/**
 * Routes every source through gain nodes instead of handing the raw tracks to
 * MediaRecorder. Costs one AudioContext and buys live mute plus a real level
 * meter, and it is the only way to record mic *and* system audio together.
 */
export function buildAudioGraph(mic: MediaStream | null, system: MediaStream | null): AudioGraph | null {
  const hasMic = !!mic && mic.getAudioTracks().length > 0;
  const hasSystem = !!system && system.getAudioTracks().length > 0;
  if (!hasMic && !hasSystem) return null;

  const Ctx = window.AudioContext || (window as any).webkitAudioContext;
  const ctx: AudioContext = new Ctx();
  if (ctx.state === 'suspended') void ctx.resume();

  const dest = ctx.createMediaStreamDestination();
  const mix = ctx.createGain();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.6;
  mix.connect(dest);
  mix.connect(analyser);

  const micGain = ctx.createGain();
  const sysGain = ctx.createGain();

  if (hasMic) {
    ctx.createMediaStreamSource(new MediaStream(mic!.getAudioTracks())).connect(micGain);
    micGain.connect(mix);
  }
  if (hasSystem) {
    ctx.createMediaStreamSource(new MediaStream(system!.getAudioTracks())).connect(sysGain);
    sysGain.connect(mix);
  }

  const buffer = new Uint8Array(analyser.frequencyBinCount);

  return {
    tracks: dest.stream.getAudioTracks(),
    level() {
      analyser.getByteTimeDomainData(buffer as any);
      let peak = 0;
      for (let i = 0; i < buffer.length; i++) {
        const v = Math.abs(buffer[i] - 128) / 128;
        if (v > peak) peak = v;
      }
      return Math.min(1, peak * 1.6);
    },
    setMicMuted(muted) {
      micGain.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.01);
    },
    setSystemMuted(muted) {
      sysGain.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.01);
    },
    close() {
      try {
        dest.stream.getTracks().forEach(t => t.stop());
        if (ctx.state !== 'closed') void ctx.close();
      } catch {
        /* already torn down */
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Canvas compositor (screen + webcam)
// ---------------------------------------------------------------------------

export interface Compositor {
  canvas: HTMLCanvasElement;
  stream: MediaStream;
  stop(): void;
}

export interface CompositorOptions {
  screen: HTMLVideoElement;
  cam: HTMLVideoElement | null;
  width: number;
  height: number;
  fps: number;
  /** Read on every frame, so overlay edits apply live — even mid-recording. */
  overlay: () => OverlayState;
  ringColor?: string;
}

export function createCompositor(opts: CompositorOptions): Compositor {
  const canvas = document.createElement('canvas');
  canvas.width = opts.width;
  canvas.height = opts.height;
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true })!;
  ctx.imageSmoothingQuality = 'high';

  const ring = opts.ringColor || '#f59e0b';

  const draw = () => {
    const { screen, cam } = opts;
    const w = canvas.width;
    const h = canvas.height;

    if (screen.videoWidth > 0) {
      // The source can change aspect ratio mid-recording when the user switches
      // the shared window, so fit instead of stretching.
      const scale = Math.min(w / screen.videoWidth, h / screen.videoHeight);
      const dw = screen.videoWidth * scale;
      const dh = screen.videoHeight * scale;
      if (dw < w || dh < h) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);
      }
      ctx.drawImage(screen, (w - dw) / 2, (h - dh) / 2, dw, dh);
    } else {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
    }

    if (cam && cam.videoWidth > 0) {
      const o = opts.overlay();
      const box = Math.round(Math.min(w, h) * o.size);
      const margin = Math.round(Math.min(w, h) * 0.03);
      const x = Math.round(margin + o.x * (w - box - margin * 2));
      const y = Math.round(margin + o.y * (h - box - margin * 2));

      ctx.save();
      ctx.beginPath();
      if (o.shape === 'circle') {
        ctx.arc(x + box / 2, y + box / 2, box / 2, 0, Math.PI * 2);
      } else if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(x, y, box, box, box * 0.16);
      } else {
        ctx.rect(x, y, box, box);
      }
      ctx.clip();

      const cw = cam.videoWidth;
      const ch = cam.videoHeight;
      const side = Math.min(cw, ch);
      const sx = (cw - side) / 2;
      const sy = (ch - side) / 2;

      if (o.mirror) {
        ctx.translate(x * 2 + box, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(cam, sx, sy, side, side, x, y, box, box);
      ctx.restore();

      if (o.ring) {
        ctx.save();
        ctx.strokeStyle = ring;
        ctx.lineWidth = Math.max(2, box * 0.035);
        ctx.beginPath();
        if (o.shape === 'circle') {
          ctx.arc(x + box / 2, y + box / 2, box / 2 - ctx.lineWidth / 2, 0, Math.PI * 2);
        } else if (typeof (ctx as any).roundRect === 'function') {
          (ctx as any).roundRect(
            x + ctx.lineWidth / 2,
            y + ctx.lineWidth / 2,
            box - ctx.lineWidth,
            box - ctx.lineWidth,
            box * 0.16
          );
        } else {
          ctx.rect(x, y, box, box);
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    request?.();
  };

  // `captureStream(0)` + `requestFrame()` puts frame timing under our control
  // instead of the page compositor's, which is what keeps the recording alive
  // while the tab is in the background.
  const stream = canvas.captureStream(0);
  const track: any = stream.getVideoTracks()[0];
  const request: (() => void) | undefined =
    typeof track?.requestFrame === 'function' ? () => track.requestFrame() : undefined;

  const ticker = createTicker(Math.max(8, Math.round(1000 / opts.fps)), draw);
  draw();

  return {
    canvas,
    stream,
    stop() {
      ticker.stop();
      stream.getTracks().forEach(t => t.stop());
    },
  };
}

// ---------------------------------------------------------------------------
// Offscreen video elements
// ---------------------------------------------------------------------------

/**
 * A detached `<video>` can be garbage-collected or skipped by Chrome, and a
 * `display:none` one stops producing frames. A 1×1 transparent element pinned
 * in the layout keeps decoding reliably.
 */
export function createHiddenVideo(stream: MediaStream): HTMLVideoElement {
  const video = document.createElement('video');
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  video.autoplay = true;
  video.setAttribute('aria-hidden', 'true');
  video.style.cssText =
    'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0.01;pointer-events:none;z-index:-1';
  document.body.appendChild(video);
  return video;
}

export function destroyHiddenVideo(video: HTMLVideoElement | null): void {
  if (!video) return;
  try {
    video.pause();
    video.srcObject = null;
    video.remove();
  } catch {
    /* already gone */
  }
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 MB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(i >= 2 ? 1 : 0)} ${units[i]}`;
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatBitrate(bps: number): string {
  return bps >= 1e6 ? `${(bps / 1e6).toFixed(1)} Mbps` : `${Math.round(bps / 1e3)} kbps`;
}
