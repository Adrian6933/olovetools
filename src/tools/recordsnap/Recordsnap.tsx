import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Camera,
  Check,
  CheckCircle2,
  Circle,
  Download,
  Gauge,
  Keyboard,
  Mic,
  MicOff,
  Monitor,
  Pause,
  Play,
  RefreshCw,
  Settings2,
  Sliders,
  Square,
  Timer,
  Video,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { NextStepBar } from './components/NextStepBar';
import { LevelMeter } from './components/LevelMeter';
import {
  IconAudioMix,
  IconBitrate,
  IconHandoff,
  IconLocalCapture,
  IconNoLimit,
  IconOverlay,
  RecorderHeroArt,
  SharingArt,
  StepArm,
  StepChoose,
  StepRecord,
  StepSave,
} from './components/Illustrations';
import type { Language } from '../../locales/meta';
import { AdBanner } from '../../components/shared/AdBanner';
import { useReducedMotion, fadeInUp } from '../../components/shared/motion';
import type {
  AudioSource,
  ContainerMode,
  DeviceOption,
  FpsMode,
  OverlayState,
  QualityMode,
  RecordMode,
  RecordingResult,
  RecordingStatus,
  ResolutionMode,
  SurfaceKind,
} from './types';
import {
  audioBitrate,
  availableContainers,
  buildAudioGraph,
  capSize,
  captureDisplay,
  captureUser,
  codecLabel,
  createCompositor,
  createHiddenVideo,
  createTicker,
  destroyHiddenVideo,
  extFor,
  formatBitrate,
  formatBytes,
  formatClock,
  listDevices,
  RES_CAP,
  supportedMime,
  videoBitrate,
  type AudioGraph,
  type Compositor,
  type Ticker,
} from './lib/recorder';

interface RecordsnapProps {
  lang: Language;
  dictionary?: any;
}

const DEFAULT_OVERLAY: OverlayState = {
  x: 1,
  y: 1,
  size: 0.22,
  shape: 'circle',
  mirror: true,
  ring: true,
};

const QUALITIES: QualityMode[] = ['eco', 'balanced', 'high', 'max'];

export const Recordsnap: React.FC<RecordsnapProps> = ({ lang, dictionary }) => {
  const t = dictionary || {};
  const prefersReduced = useReducedMotion();

  // --- Capture settings (locked once sources are armed) --------------------
  const [mode, setMode] = useState<RecordMode>('screen');
  const [audioSource, setAudioSource] = useState<AudioSource>('mic');
  const [resolution, setResolution] = useState<ResolutionMode>('native');
  const [fps, setFps] = useState<FpsMode>(30);
  const [cameraId, setCameraId] = useState('');
  const [micId, setMicId] = useState('');
  const [voiceProcessing, setVoiceProcessing] = useState(true);

  // --- Encoder settings (free to change right up to the first frame) -------
  const containers = useMemo(() => availableContainers(), []);
  const [container, setContainer] = useState<ContainerMode>('mp4');
  const [quality, setQuality] = useState<QualityMode>('balanced');
  const [countdownSeconds, setCountdownSeconds] = useState(3);

  // --- Live, editable during the recording ---------------------------------
  const [overlay, setOverlay] = useState<OverlayState>(DEFAULT_OVERLAY);
  const [micMuted, setMicMuted] = useState(false);
  const [sysMuted, setSysMuted] = useState(false);

  // --- Machine state -------------------------------------------------------
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [countdown, setCountdown] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [bytes, setBytes] = useState(0);
  const [result, setResult] = useState<RecordingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<{ cameras: DeviceOption[]; mics: DeviceOption[] }>({
    cameras: [],
    mics: [],
  });
  const [surface, setSurface] = useState<SurfaceKind>('unknown');
  const [showScreenPreview, setShowScreenPreview] = useState(true);
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [supported, setSupported] = useState(true);

  // --- Refs ----------------------------------------------------------------
  const screenStreamRef = useRef<MediaStream | null>(null);
  const camStreamRef = useRef<MediaStream | null>(null);
  const audioGraphRef = useRef<AudioGraph | null>(null);
  const compositorRef = useRef<Compositor | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const bytesRef = useRef(0);
  const hiddenScreenRef = useRef<HTMLVideoElement | null>(null);
  const hiddenCamRef = useRef<HTMLVideoElement | null>(null);
  const statsTickerRef = useRef<Ticker | null>(null);
  const resultUrlRef = useRef<string | null>(null);
  const targetRef = useRef({ w: 1280, h: 720 });
  const startedAtRef = useRef(0);
  const pausedTotalRef = useRef(0);
  const pauseStartedRef = useRef(0);
  const elapsedRef = useRef(0);
  const autoStartRef = useRef(false);
  const launchingRef = useRef(false);
  const overlayRef = useRef(overlay);
  overlayRef.current = overlay;

  const camPreviewRef = useRef<HTMLVideoElement | null>(null);
  const screenPreviewRef = useRef<HTMLVideoElement | null>(null);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const isLive = status === 'recording' || status === 'paused';
  const isBusy = status !== 'idle' && status !== 'error' && status !== 'done';
  const needsCam = mode === 'camera' || mode === 'both';
  const needsScreen = mode === 'screen' || mode === 'both';
  const needsMic = audioSource === 'mic' || audioSource === 'both';
  const needsSystem = audioSource === 'system' || audioSource === 'both';

  const activeMime = useMemo(
    () => supportedMime(container) || supportedMime(container === 'mp4' ? 'webm' : 'mp4') || '',
    [container]
  );
  // Before arming there is no real frame size yet, so the panel previews the
  // bitrate against the selected cap (or 1080p for "native").
  const plannedBitrate = useMemo(() => {
    const armedDims = status === 'armed' || status === 'recording' || status === 'paused';
    const dims = armedDims ? targetRef.current : RES_CAP[resolution] || { w: 1920, h: 1080 };
    return videoBitrate(dims.w, dims.h, fps, quality);
  }, [fps, quality, status, resolution]);

  // ==========================================================================
  // Capability check
  // ==========================================================================
  useEffect(() => {
    const ok =
      typeof MediaRecorder !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function';
    setSupported(ok);
    if (ok && containers.length && !containers.includes(container)) setContainer(containers[0]);
    void listDevices().then(setDevices);
  }, []);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ==========================================================================
  // Teardown
  // ==========================================================================
  const teardown = useCallback(() => {
    statsTickerRef.current?.stop();
    statsTickerRef.current = null;

    compositorRef.current?.stop();
    compositorRef.current = null;

    destroyHiddenVideo(hiddenScreenRef.current);
    destroyHiddenVideo(hiddenCamRef.current);
    hiddenScreenRef.current = null;
    hiddenCamRef.current = null;

    audioGraphRef.current?.close();
    audioGraphRef.current = null;

    [screenStreamRef, camStreamRef].forEach(ref => {
      ref.current?.getTracks().forEach(track => {
        track.onended = null;
        track.stop();
      });
      ref.current = null;
    });

    if (camPreviewRef.current) camPreviewRef.current.srcObject = null;
    if (screenPreviewRef.current) screenPreviewRef.current.srcObject = null;
  }, []);

  useEffect(
    () => () => {
      teardown();
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    },
    [teardown]
  );

  // Leaving mid-recording loses the file — the browser gets to warn about that.
  useEffect(() => {
    if (!isLive && status !== 'armed') return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isLive, status]);

  // ==========================================================================
  // Arming: grab the sources and show them. Nothing is recorded yet.
  // ==========================================================================
  const failWith = useCallback(
    (err: any) => {
      teardown();
      const name = err?.name || '';
      const message =
        name === 'NotAllowedError'
          ? t.errorDenied || 'You dismissed the share dialog, or permission was denied.'
          : name === 'NotFoundError' || name === 'OverconstrainedError'
            ? t.errorNoDevice || 'No camera or microphone matched the selected device.'
            : err?.message || String(err);
      setError(message);
      setStatus('error');
      autoStartRef.current = false;
    },
    [teardown, t]
  );

  const arm = useCallback(
    async (autoStart = false) => {
      if (!supported) return;
      autoStartRef.current = autoStart;
      setError(null);
      if (resultUrlRef.current) {
        URL.revokeObjectURL(resultUrlRef.current);
        resultUrlRef.current = null;
      }
      setResult(null);
      setStatus('arming');

      try {
        let micStream: MediaStream | null = null;

        if (needsCam || needsMic) {
          const stream = await captureUser({
            video: needsCam,
            audio: needsMic,
            cameraId: cameraId || undefined,
            micId: micId || undefined,
            fps,
            resolution,
            voiceProcessing,
          });
          camStreamRef.current = stream;
          micStream = needsMic ? stream : null;
        }

        if (needsScreen) {
          const display = await captureDisplay({ fps, resolution, systemAudio: needsSystem });
          screenStreamRef.current = display.stream;
          setSurface(display.surface);
          // Mirroring a whole-monitor capture back into the page films itself.
          setShowScreenPreview(display.surface !== 'monitor');
          display.stream.getVideoTracks().forEach(track => {
            track.onended = () => handleSurfaceEnded();
          });
        }

        const systemAudioStream =
          needsSystem && screenStreamRef.current && screenStreamRef.current.getAudioTracks().length
            ? new MediaStream(screenStreamRef.current.getAudioTracks())
            : null;
        audioGraphRef.current = buildAudioGraph(micStream, systemAudioStream);
        audioGraphRef.current?.setMicMuted(micMuted);
        audioGraphRef.current?.setSystemMuted(sysMuted);

        // Work out the frame the encoder will actually see.
        const source =
          mode === 'camera'
            ? camStreamRef.current?.getVideoTracks()[0]
            : screenStreamRef.current?.getVideoTracks()[0];
        if (!source) throw new Error(t.errorNoTrack || 'No video source came back from the browser.');
        const s = source.getSettings();
        targetRef.current = capSize(s.width || 1280, s.height || 720, resolution);

        if (mode === 'both') {
          const screenVideo = createHiddenVideo(new MediaStream(screenStreamRef.current!.getVideoTracks()));
          const camVideo = createHiddenVideo(new MediaStream(camStreamRef.current!.getVideoTracks()));
          hiddenScreenRef.current = screenVideo;
          hiddenCamRef.current = camVideo;
          await Promise.all([
            screenVideo.play().catch(() => undefined),
            camVideo.play().catch(() => undefined),
          ]);
          compositorRef.current = createCompositor({
            screen: screenVideo,
            cam: camVideo,
            width: targetRef.current.w,
            height: targetRef.current.h,
            fps,
            overlay: () => overlayRef.current,
          });
        }

        // Labels only exist after the first grant, so this is the useful moment.
        void listDevices().then(setDevices);
        setStatus('armed');
      } catch (err) {
        failWith(err);
      }
    },
    [
      supported,
      needsCam,
      needsMic,
      needsScreen,
      needsSystem,
      cameraId,
      micId,
      fps,
      resolution,
      voiceProcessing,
      mode,
      micMuted,
      sysMuted,
      failWith,
      t,
    ]
  );

  const disarm = useCallback(() => {
    teardown();
    autoStartRef.current = false;
    setStatus('idle');
    setElapsed(0);
    setBytes(0);
    setCountdown(0);
  }, [teardown]);

  // ==========================================================================
  // Recording
  // ==========================================================================
  const finalize = useCallback(
    (mime: string) => {
      const blob = new Blob(chunksRef.current, { type: mime });
      chunksRef.current = [];

      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;

      setResult({
        url,
        blob,
        mime,
        ext: extFor(mime),
        bytes: blob.size,
        duration: elapsedRef.current,
        width: targetRef.current.w,
        height: targetRef.current.h,
      });
      setStatus('done');
      teardown();
    },
    [teardown]
  );

  const launchRecorder = useCallback(() => {
    if (launchingRef.current) return;
    launchingRef.current = true;

    try {
      const stream = new MediaStream();
      const videoTrack =
        mode === 'both'
          ? compositorRef.current?.stream.getVideoTracks()[0]
          : mode === 'camera'
            ? camStreamRef.current?.getVideoTracks()[0]
            : screenStreamRef.current?.getVideoTracks()[0];
      if (!videoTrack) throw new Error(t.errorNoTrack || 'No video source came back from the browser.');
      stream.addTrack(videoTrack);
      audioGraphRef.current?.tracks.forEach(track => stream.addTrack(track));

      const mime = activeMime;
      const options: MediaRecorderOptions = {
        ...(mime ? { mimeType: mime } : {}),
        // Without this MediaRecorder settles for ~2.5 Mbit/s at any resolution.
        videoBitsPerSecond: videoBitrate(targetRef.current.w, targetRef.current.h, fps, quality),
        ...(audioGraphRef.current ? { audioBitsPerSecond: audioBitrate(quality) } : {}),
      };

      chunksRef.current = [];
      bytesRef.current = 0;
      const recorder = new MediaRecorder(stream, options);
      recorderRef.current = recorder;

      recorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
          bytesRef.current += e.data.size;
        }
      };
      recorder.onstop = () => finalize(recorder.mimeType || mime || 'video/webm');
      recorder.onerror = (e: any) => failWith(e?.error || new Error('MediaRecorder failed'));

      recorder.start(1000);

      startedAtRef.current = performance.now();
      pausedTotalRef.current = 0;
      pauseStartedRef.current = 0;
      elapsedRef.current = 0;
      setElapsed(0);
      setBytes(0);
      setStatus('recording');

      statsTickerRef.current?.stop();
      statsTickerRef.current = createTicker(250, () => {
        const paused = pauseStartedRef.current ? performance.now() - pauseStartedRef.current : 0;
        elapsedRef.current =
          (performance.now() - startedAtRef.current - pausedTotalRef.current - paused) / 1000;
        setElapsed(elapsedRef.current);
        setBytes(bytesRef.current);
      });
    } catch (err) {
      failWith(err);
    } finally {
      launchingRef.current = false;
    }
  }, [mode, activeMime, fps, quality, finalize, failWith, t]);

  const beginRecording = useCallback(
    (skipCountdown = false) => {
      if (status !== 'armed') return;
      if (skipCountdown || countdownSeconds <= 0) {
        launchRecorder();
        return;
      }
      setCountdown(countdownSeconds);
      setStatus('countdown');
    },
    [status, countdownSeconds, launchRecorder]
  );

  // The countdown lives in an effect, not inside a setState updater — that is
  // what used to fire the capture twice under StrictMode.
  useEffect(() => {
    if (status !== 'countdown') return;
    if (countdown <= 0) {
      launchRecorder();
      return;
    }
    const id = window.setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [status, countdown, launchRecorder]);

  // Auto-start path: "record immediately" skips the armed preview entirely.
  useEffect(() => {
    if (status === 'armed' && autoStartRef.current) {
      autoStartRef.current = false;
      launchRecorder();
    }
  }, [status, launchRecorder]);

  const pauseRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder?.state !== 'recording') return;
    recorder.pause();
    pauseStartedRef.current = performance.now();
    setStatus('paused');
  }, []);

  const resumeRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder?.state !== 'paused') return;
    recorder.resume();
    if (pauseStartedRef.current) {
      pausedTotalRef.current += performance.now() - pauseStartedRef.current;
      pauseStartedRef.current = 0;
    }
    setStatus('recording');
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    // Settle the final duration here: the stats ticker only samples every 250ms
    // and it is about to be stopped.
    if (startedAtRef.current) {
      const paused = pauseStartedRef.current ? performance.now() - pauseStartedRef.current : 0;
      elapsedRef.current =
        (performance.now() - startedAtRef.current - pausedTotalRef.current - paused) / 1000;
    }
    statsTickerRef.current?.stop();
    statsTickerRef.current = null;
    if (recorder && recorder.state !== 'inactive') {
      setStatus('processing');
      recorder.stop();
    } else {
      disarm();
    }
  }, [disarm]);

  /** The user hit "Stop sharing" in the browser bar. */
  const handleSurfaceEnded = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') stopRecording();
    else disarm();
  }, [stopRecording, disarm]);

  const toggleMic = useCallback(() => {
    setMicMuted(prev => {
      audioGraphRef.current?.setMicMuted(!prev);
      return !prev;
    });
  }, []);

  const toggleSystem = useCallback(() => {
    setSysMuted(prev => {
      audioGraphRef.current?.setSystemMuted(!prev);
      return !prev;
    });
  }, []);

  // ==========================================================================
  // Keyboard shortcuts
  // ==========================================================================
  useEffect(() => {
    if (!isLive && status !== 'armed') return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (status === 'recording') pauseRecording();
        else if (status === 'paused') resumeRecording();
        else if (status === 'armed') beginRecording();
      } else if (e.key === 'Escape' && isLive) {
        e.preventDefault();
        stopRecording();
      } else if ((e.key === 'm' || e.key === 'M') && needsMic) {
        e.preventDefault();
        toggleMic();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isLive, status, needsMic, pauseRecording, resumeRecording, beginRecording, stopRecording, toggleMic]);

  // ==========================================================================
  // Preview wiring — bound in an effect so the element is guaranteed to exist.
  // The old code assigned srcObject before the <video> was mounted, which is
  // why the webcam preview was always black.
  // ==========================================================================
  useEffect(() => {
    const cam = camPreviewRef.current;
    if (cam && camStreamRef.current && mode === 'camera') {
      cam.srcObject = camStreamRef.current;
      cam.play().catch(() => undefined);
    }
    const screen = screenPreviewRef.current;
    if (screen && screenStreamRef.current && mode === 'screen' && showScreenPreview) {
      screen.srcObject = new MediaStream(screenStreamRef.current.getVideoTracks());
      screen.play().catch(() => undefined);
    }
  }, [status, mode, showScreenPreview]);

  // The composited canvas is the preview in "screen + webcam" mode, so what you
  // see is byte-for-byte what is being encoded.
  useEffect(() => {
    const host = canvasHostRef.current;
    const canvas = compositorRef.current?.canvas;
    if (!host || !canvas) return;
    canvas.className = 'max-w-full max-h-full rounded-lg touch-none';
    host.appendChild(canvas);
    return () => {
      if (canvas.parentNode === host) host.removeChild(canvas);
    };
  }, [status, mode]);

  // ==========================================================================
  // Overlay dragging
  // ==========================================================================
  const moveOverlayTo = useCallback((clientX: number, clientY: number) => {
    const canvas = compositorRef.current?.canvas;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const px = ((clientX - rect.left) / rect.width) * canvas.width;
    const py = ((clientY - rect.top) / rect.height) * canvas.height;
    const short = Math.min(canvas.width, canvas.height);
    const box = short * overlayRef.current.size;
    const margin = short * 0.03;
    const spanX = canvas.width - box - margin * 2;
    const spanY = canvas.height - box - margin * 2;

    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    setOverlay(prev => ({
      ...prev,
      x: spanX > 0 ? clamp((px - margin - box / 2) / spanX) : 0,
      y: spanY > 0 ? clamp((py - margin - box / 2) / spanY) : 0,
    }));
  }, []);

  const onOverlayPointerDown = (e: React.PointerEvent) => {
    if (mode !== 'both' || !compositorRef.current) return;
    draggingRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    moveOverlayTo(e.clientX, e.clientY);
  };
  const onOverlayPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    moveOverlayTo(e.clientX, e.clientY);
  };
  const onOverlayPointerUp = (e: React.PointerEvent) => {
    draggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
  };

  // ==========================================================================
  // Output
  // ==========================================================================
  const fileName = useCallback(
    (ext: string) => {
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      return `RecordSnap-${stamp}.${ext}`;
    },
    []
  );

  const download = useCallback(() => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = fileName(result.ext);
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [result, fileName]);

  const getHandoffResult = useCallback(() => {
    if (!result) return null;
    return { blob: result.blob, name: fileName(result.ext) };
  }, [result, fileName]);

  const startOver = useCallback(() => {
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }
    setResult(null);
    setError(null);
    setElapsed(0);
    setBytes(0);
    setStatus('idle');
  }, []);

  const handleLanguageChange = (newLang: string) => {
    window.location.href = `/${newLang.toLowerCase()}/recordsnap`;
  };

  // ==========================================================================
  // Copy
  // ==========================================================================
  const modeCards = [
    { id: 'screen' as RecordMode, label: t.modeScreen || 'Screen only', desc: t.modeScreenDesc || 'A monitor, a window or a browser tab.', icon: Monitor },
    { id: 'camera' as RecordMode, label: t.modeCamera || 'Webcam only', desc: t.modeCameraDesc || 'Straight from your camera.', icon: Camera },
    { id: 'both' as RecordMode, label: t.modeBoth || 'Screen + webcam', desc: t.modeBothDesc || 'Your camera as a bubble over the screen.', icon: Video },
  ];

  const audioCards = [
    { id: 'none' as AudioSource, label: t.audioNone || 'No audio', icon: VolumeX },
    { id: 'mic' as AudioSource, label: t.audioMic || 'Microphone', icon: Mic },
    { id: 'system' as AudioSource, label: t.audioSystem || 'System audio', icon: Volume2 },
    { id: 'both' as AudioSource, label: t.audioBoth || 'Mic + system', icon: Sliders },
  ];

  const qualityLabels: Record<QualityMode, string> = {
    eco: t.qualityEco || 'Eco',
    balanced: t.qualityBalanced || 'Balanced',
    high: t.qualityHigh || 'High',
    max: t.qualityMax || 'Max',
  };

  const surfaceLabel =
    surface === 'monitor'
      ? t.surfaceMonitor || 'Entire screen'
      : surface === 'window'
        ? t.surfaceWindow || 'Application window'
        : surface === 'browser'
          ? t.surfaceBrowser || 'Browser tab'
          : '';

  const steps = [
    { art: StepChoose, title: t.step1Title || 'Pick what to capture', text: t.step1Text || 'Screen, webcam or both, plus the microphone and system audio you want in the mix.' },
    { art: StepArm, title: t.step2Title || 'Preview the sources', text: t.step2Text || 'The browser asks for permission and you see the exact frame. Nothing is recorded yet.' },
    { art: StepRecord, title: t.step3Title || 'Press record', text: t.step3Text || 'Pause, resume, mute yourself and move the webcam bubble while it runs.' },
    { art: StepSave, title: t.step4Title || 'Save or keep going', text: t.step4Text || 'Download the MP4 or WebM, or send it straight to another tool.' },
  ];

  const featureIcons = [IconLocalCapture, IconOverlay, IconNoLimit, IconBitrate, IconAudioMix, IconHandoff];
  const extraFeatures = t.extraFeatures || [
    { title: 'Bitrate you control', text: 'Four quality presets that set a real encoder bitrate instead of the browser default.' },
    { title: 'Live audio desk', text: 'Choose the microphone, mix in system audio and mute yourself mid-take without stopping.' },
    { title: 'Chained with the suite', text: 'Send the recording to the GIF maker or the frame grabber without downloading it first.' },
  ];

  const faqs = Array.isArray(t.faq) ? t.faq : [];
  const keywords = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];

  // ==========================================================================
  // Render helpers
  // ==========================================================================
  const settingsLocked = status !== 'idle' && status !== 'error';

  const renderStage = () => {
    if (status === 'error') {
      return (
        <div className="glass-card rounded-3xl p-8 md:p-12 space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white tracking-tight">{t.errorTitle || t.statusError}</h3>
            <p className="text-slate-400 text-sm leading-relaxed font-medium max-w-md mx-auto">
              {error || t.permissionMessage}
            </p>
          </div>
          <button
            onClick={() => {
              setError(null);
              setStatus('idle');
            }}
            className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            {t.retryBtn || 'Try again'}
          </button>
        </div>
      );
    }

    if (status === 'done' && result) {
      return (
        <div className="glass-card rounded-3xl p-5 md:p-7 space-y-5">
          <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-4">
            <span className="text-xs font-black tracking-widest uppercase text-green-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {t.doneTitle || t.statusDone}
            </span>
            <button
              onClick={startOver}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t.recordAgainBtn || t.resetBtn}
            </button>
          </div>

          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/10">
            <video src={result.url} controls playsInline className="w-full h-full object-contain" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Stat label={t.statLength || 'Length'} value={formatClock(result.duration)} />
            <Stat label={t.statSize || 'Size'} value={formatBytes(result.bytes)} />
            <Stat label={t.statResolution || 'Resolution'} value={`${result.width}×${result.height}`} />
            <Stat label={t.labelCodec || 'Codec'} value={`${codecLabel(result.mime)} · ${result.ext.toUpperCase()}`} />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={download}
              className="w-full sm:flex-1 py-4 bg-amber-500 hover:bg-amber-400 text-black font-black text-sm rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-[0_0_30px_rgba(245,158,11,0.3)]"
            >
              <Download className="w-5 h-5 stroke-[2.5]" />
              {t.downloadBtn}
            </button>
            <button
              onClick={startOver}
              className="w-full sm:w-auto py-4 px-8 border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-sm rounded-2xl transition-all active:scale-95 cursor-pointer"
            >
              {t.discardBtn || 'Discard'}
            </button>
          </div>

          <NextStepBar lang={lang} t={t} getResult={getHandoffResult} />
        </div>
      );
    }

    if (status === 'processing') {
      return (
        <div className="glass-card rounded-3xl p-16 flex flex-col items-center justify-center min-h-[420px] gap-5">
          <svg className="animate-spin h-10 w-10 text-amber-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm font-bold text-white tracking-wide">{t.statusProcessing}</span>
        </div>
      );
    }

    if (status === 'idle') {
      return (
        <div className="glass-card rounded-3xl p-7 md:p-10 space-y-7 text-center">
          <RecorderHeroArt className="w-full max-w-md mx-auto" animated={!prefersReduced} />
          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              {t.idleTitle || 'Nothing is being recorded'}
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
              {t.idleText ||
                'Pick your sources on the right, then grant access. You get a live preview first — the recording only starts when you say so.'}
            </p>
          </div>

          {!supported && (
            <p className="text-amber-300 text-xs font-bold bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 max-w-md mx-auto">
              {t.unsupportedText ||
                'Your browser cannot record media. Screen capture needs a desktop browser such as Chrome, Edge, Firefox or Opera.'}
            </p>
          )}

          <div className="space-y-3">
            <button
              onClick={() => arm(false)}
              disabled={!supported}
              className="w-full py-5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black text-sm tracking-wide rounded-2xl flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-[0_0_30px_rgba(245,158,11,0.25)]"
            >
              <Monitor className="w-4 h-4 stroke-[2.5]" />
              {t.armBtn || 'Choose what to capture'}
            </button>
            <button
              onClick={() => arm(true)}
              disabled={!supported}
              className="w-full py-3 text-slate-400 hover:text-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Zap className="w-3.5 h-3.5" />
              {t.recordNowBtn || 'Skip the preview and record straight away'}
            </button>
          </div>
        </div>
      );
    }

    if (status === 'arming') {
      return (
        <div className="glass-card rounded-3xl p-16 flex flex-col items-center justify-center min-h-[420px] gap-5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Monitor className="w-8 h-8" />
          </div>
          <span className="text-sm font-bold text-white tracking-wide">
            {t.armingBtn || 'Waiting for the browser permission dialog…'}
          </span>
          <button
            onClick={disarm}
            className="text-xs text-slate-500 hover:text-white font-bold uppercase tracking-wider cursor-pointer"
          >
            {t.cancelBtn || 'Cancel'}
          </button>
        </div>
      );
    }

    // armed / countdown / recording / paused all share the stage.
    return (
      <div className="glass-card rounded-3xl p-5 md:p-7 space-y-5">
        <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                status === 'recording' ? 'bg-red-500 animate-pulse' : status === 'paused' ? 'bg-amber-400' : 'bg-green-400'
              }`}
            />
            <span className="text-[11px] font-black tracking-widest uppercase text-slate-300 truncate">
              {status === 'recording'
                ? t.labelRecording || 'Recording'
                : status === 'paused'
                  ? t.labelPaused || 'Paused'
                  : status === 'countdown'
                    ? t.statusCountdown
                    : t.statusArmed || 'Ready — nothing is being recorded yet'}
            </span>
            {surfaceLabel && needsScreen && (
              <span className="hidden sm:inline text-[10px] font-bold text-slate-600 border border-white/10 rounded-full px-2 py-0.5 shrink-0">
                {surfaceLabel}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 font-mono text-sm text-amber-400 font-bold shrink-0">
            <Timer className="w-3.5 h-3.5" />
            {formatClock(elapsed)}
          </div>
        </div>

        {/* Stage */}
        <div
          ref={canvasHostRef}
          onPointerDown={onOverlayPointerDown}
          onPointerMove={onOverlayPointerMove}
          onPointerUp={onOverlayPointerUp}
          onPointerCancel={onOverlayPointerUp}
          className={`relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 flex items-center justify-center ${
            mode === 'both' ? 'cursor-grab active:cursor-grabbing' : ''
          }`}
        >
          {mode === 'camera' && (
            <video
              ref={camPreviewRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          )}

          {mode === 'screen' &&
            (showScreenPreview ? (
              <video ref={screenPreviewRef} autoPlay muted playsInline className="w-full h-full object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-4 text-center px-8 text-amber-400/70 select-none">
                <SharingArt className="w-40 h-auto" animated={!prefersReduced} />
                <p className="text-slate-500 text-xs font-medium leading-relaxed max-w-xs">
                  {t.monitorWarning ||
                    'You are sharing the whole screen, so the preview stays off — it would film itself.'}
                </p>
              </div>
            ))}

          {status === 'countdown' && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
              <span className="text-slate-400 text-[10px] font-black tracking-widest uppercase">
                {t.statusCountdown}
              </span>
              <span className="text-7xl font-black text-amber-400 tabular-nums">{countdown}</span>
            </div>
          )}

          {status === 'paused' && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-[#100b08] border border-amber-500/30 rounded-2xl px-4 py-3 flex items-center gap-2.5 text-amber-400 font-black uppercase text-xs tracking-wider">
                <Pause className="w-4 h-4" />
                {t.labelPaused || 'Paused'}
              </div>
            </div>
          )}
        </div>

        {mode === 'screen' && surface === 'monitor' && (
          <button
            onClick={() => setShowScreenPreview(v => !v)}
            className="text-[11px] font-bold text-slate-500 hover:text-amber-400 transition-colors cursor-pointer"
          >
            {showScreenPreview ? t.previewHide || 'Hide preview' : t.previewToggle || 'Show preview anyway'}
          </button>
        )}

        {mode === 'both' && (
          <p className="text-[11px] text-slate-600 font-medium text-center">
            {t.overlayDragHint || 'Drag the webcam bubble on the preview to move it — even while recording.'}
          </p>
        )}

        {/* Audio desk */}
        {audioSource !== 'none' && (
          <div className="rounded-2xl border border-white/5 bg-black/30 p-3.5 flex flex-wrap items-center gap-3">
            <LevelMeter
              read={() => audioGraphRef.current?.level() ?? 0}
              active={status === 'armed' || status === 'recording' || status === 'countdown'}
            />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex-1 min-w-0">
              {t.levelLabel || 'Input level'}
            </span>
            {needsMic && (
              <button
                onClick={toggleMic}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                  micMuted
                    ? 'bg-red-500/15 border-red-500/30 text-red-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {micMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                {micMuted ? t.micUnmuteBtn || 'Mic off' : t.micMuteBtn || 'Mic on'}
              </button>
            )}
            {needsSystem && (
              <button
                onClick={toggleSystem}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                  sysMuted
                    ? 'bg-red-500/15 border-red-500/30 text-red-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {sysMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                {sysMuted ? t.sysUnmuteBtn || 'System off' : t.sysMuteBtn || 'System on'}
              </button>
            )}
          </div>
        )}

        {/* Live stats */}
        {isLive && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Stat label={t.statLength || 'Length'} value={formatClock(elapsed)} />
            {/* Real bytes received, not an estimate — so it stays blank until
                MediaRecorder flushes its first timeslice. */}
            <Stat label={t.statSize || 'Size'} value={bytes ? formatBytes(bytes) : '—'} />
            <Stat
              label={t.statBitrate || 'Bitrate'}
              value={bytes && elapsed > 1 ? formatBitrate((bytes * 8) / elapsed) : '—'}
            />
            <Stat label={t.statResolution || 'Resolution'} value={`${targetRef.current.w}×${targetRef.current.h}`} />
          </div>
        )}

        {/* Transport */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          {status === 'armed' && (
            <>
              <button
                onClick={() => beginRecording()}
                className="px-8 py-3.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-xl flex items-center gap-2.5 transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Circle className="w-3.5 h-3.5 fill-current" />
                {t.startBtn}
              </button>
              {countdownSeconds > 0 && (
                <button
                  onClick={() => beginRecording(true)}
                  className="px-5 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  {t.skipCountdownBtn || 'Record now'}
                </button>
              )}
              <button
                onClick={disarm}
                className="px-5 py-3.5 text-slate-500 hover:text-white font-bold text-xs transition-colors cursor-pointer"
              >
                {t.changeSourcesBtn || 'Change sources'}
              </button>
            </>
          )}

          {status === 'countdown' && (
            <button
              onClick={() => {
                setCountdown(0);
                setStatus('armed');
              }}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              {t.cancelBtn || 'Cancel'}
            </button>
          )}

          {isLive && (
            <>
              {status === 'recording' ? (
                <button
                  onClick={pauseRecording}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-xl flex items-center gap-2 border border-white/10 transition-all cursor-pointer"
                >
                  <Pause className="w-4 h-4" />
                  {t.pauseBtn}
                </button>
              ) : (
                <button
                  onClick={resumeRecording}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {t.resumeBtn}
                </button>
              )}
              <button
                onClick={stopRecording}
                className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-xl flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                {t.stopBtn}
              </button>
            </>
          )}
        </div>

        {(status === 'armed' || isLive) && (
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] font-bold text-slate-600 pt-1">
            <span className="flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5" />
              {t.shortcutsTitle || 'Shortcuts'}
            </span>
            <span>{t.shortcutPause || 'Space — pause / resume'}</span>
            <span>{t.shortcutStop || 'Esc — stop'}</span>
            {needsMic && <span>{t.shortcutMute || 'M — mute mic'}</span>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0805] text-slate-100 selection:bg-amber-500/30 overflow-x-hidden font-sans">
      <Header
        currentLang={lang}
        onLanguageChange={handleLanguageChange}
        onReset={() => {
          if (isBusy) disarm();
          startOver();
        }}
        t={t}
      />

      {/* The max width lives on <main> on purpose: AdRail measures this element
          to decide whether the fixed side rails fit, and reserving 440px from
          1400px up is what keeps them visible instead of silently suppressed. */}
      <main className="flex-1 flex flex-col items-center pt-36 pb-32 px-4 md:px-12 relative z-10 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))]">
        <AdBanner id="adsense-recordsnap-top" />

        <div className="w-full space-y-20 md:space-y-28">
          {/* ================================================================ */}
          {/* Hero                                                             */}
          {/* ================================================================ */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center pt-2">
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex max-w-full items-center gap-2 px-4 py-2 rounded-full bg-amber-950/40 border border-amber-800/30 text-amber-400 text-[11px] font-black tracking-[0.2em] uppercase shadow-[0_0_25px_rgba(245,158,11,0.15)]">
                <Video className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.badge || t.title}</span>
              </div>

              <h1 className="text-4xl md:text-6xl xl:text-7xl font-black tracking-tight leading-[0.95] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-400">
                {t.title}
              </h1>

              <p className="text-slate-400 text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">{t.description}</p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                {(t.seoHeroList || []).slice(0, 3).map((point: string, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-300"
                  >
                    <Check className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />
                    {point}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/10 blur-[80px] rounded-full" />
              <RecorderHeroArt
                className="relative w-full max-w-lg mx-auto drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
                animated={!prefersReduced}
              />
            </div>
          </section>

          {/* ================================================================ */}
          {/* Workspace                                                        */}
          {/* ================================================================ */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 xl:col-span-8">{renderStage()}</div>

            <div className="lg:col-span-5 xl:col-span-4 space-y-5">
              <div className="glass-card rounded-3xl p-5 md:p-6 space-y-6 text-left">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <Settings2 className="w-3.5 h-3.5 text-amber-400" />
                  {t.settingsTitle || 'Capture settings'}
                </div>

                {/* Mode */}
                <Field label={t.modeLabel || 'Capture mode'}>
                  <div className="grid grid-cols-1 gap-2">
                    {modeCards.map(card => {
                      const Icon = card.icon;
                      const selected = mode === card.id;
                      return (
                        <button
                          key={card.id}
                          onClick={() => setMode(card.id)}
                          disabled={settingsLocked}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 disabled:opacity-40 disabled:cursor-not-allowed ${
                            selected
                              ? 'bg-amber-950/30 border-amber-500/40'
                              : 'bg-[#140f0b]/40 border-white/5 hover:bg-[#140f0b]/80'
                          }`}
                        >
                          <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${selected ? 'text-amber-400' : 'text-slate-500'}`} />
                          <span className="min-w-0">
                            <span className="text-[13px] font-bold block text-white">{card.label}</span>
                            <span className="text-[11px] text-slate-500 font-medium block leading-snug">{card.desc}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </Field>

                {/* Audio */}
                <Field label={t.labelAudioSource}>
                  <div className="grid grid-cols-2 gap-2">
                    {audioCards.map(card => {
                      const Icon = card.icon;
                      const selected = audioSource === card.id;
                      return (
                        <button
                          key={card.id}
                          onClick={() => setAudioSource(card.id)}
                          disabled={settingsLocked}
                          className={`px-3 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                            selected
                              ? 'bg-amber-950/30 border-amber-500/40 text-amber-400'
                              : 'bg-[#140f0b]/40 border-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[11px] font-bold truncate">{card.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </Field>

                {/* Devices */}
                {needsCam && devices.cameras.length > 0 && (
                  <Field label={t.labelCamera || 'Camera'}>
                    <Select value={cameraId} onChange={setCameraId} disabled={settingsLocked}>
                      <option value="">{t.optionDefault || 'System default'}</option>
                      {devices.cameras.map(d => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}

                {needsMic && devices.mics.length > 0 && (
                  <Field label={t.labelMic || 'Microphone'}>
                    <Select value={micId} onChange={setMicId} disabled={settingsLocked}>
                      <option value="">{t.optionDefault || 'System default'}</option>
                      {devices.mics.map(d => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}

                {needsMic && (
                  <label
                    title={t.voiceProcessingHint || 'Great for talking heads, terrible for music and game audio.'}
                    className={`flex items-center gap-2.5 text-[11px] font-bold text-slate-400 transition-colors ${
                      settingsLocked ? 'opacity-40' : 'hover:text-slate-200 cursor-pointer'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={voiceProcessing}
                      disabled={settingsLocked}
                      onChange={e => setVoiceProcessing(e.target.checked)}
                      className="accent-amber-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    {t.voiceProcessingLabel || 'Voice cleanup (echo + noise)'}
                  </label>
                )}

                {/* Resolution + fps */}
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t.labelResolution}>
                    <Select value={resolution} onChange={v => setResolution(v as ResolutionMode)} disabled={settingsLocked}>
                      <option value="native">{t.resNative}</option>
                      <option value="1440p">{t.res1440p || 'QHD (1440p)'}</option>
                      <option value="1080p">{t.res1080p}</option>
                      <option value="720p">{t.res720p}</option>
                    </Select>
                  </Field>
                  <Field label={t.labelFps}>
                    <Select value={String(fps)} onChange={v => setFps(Number(v) as FpsMode)} disabled={settingsLocked}>
                      <option value="60">{t.fps60 || '60 fps · ultra smooth'}</option>
                      <option value="30">{t.fps30 || '30 fps · standard'}</option>
                      <option value="24">{t.fps24 || '24 fps · cinematic'}</option>
                      <option value="15">{t.fps15 || '15 fps · light'}</option>
                    </Select>
                  </Field>
                </div>
              </div>

              {/* Encoder — editable right up to the first frame */}
              <div className="glass-card rounded-3xl p-5 md:p-6 space-y-5 text-left">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                  {t.labelQuality || 'Quality'}
                </div>

                <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-black/40 border border-white/5">
                  {QUALITIES.map(q => (
                    <button
                      key={q}
                      onClick={() => setQuality(q)}
                      disabled={isLive || status === 'countdown'}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                        quality === q ? 'bg-amber-500/20 text-amber-300' : 'text-slate-500 hover:text-white'
                      }`}
                    >
                      {qualityLabels[q]}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-500">{t.statBitrate || 'Bitrate'}</span>
                  <span className="text-amber-400 font-mono">{formatBitrate(plannedBitrate)}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label={t.labelFormat || 'File format'}>
                    <Select
                      value={container}
                      onChange={v => setContainer(v as ContainerMode)}
                      disabled={isLive || status === 'countdown' || containers.length < 2}
                    >
                      {(containers.length ? containers : (['webm'] as ContainerMode[])).map(c => (
                        <option key={c} value={c}>
                          {c.toUpperCase()}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label={t.labelCountdown || 'Countdown'}>
                    <Select
                      value={String(countdownSeconds)}
                      onChange={v => setCountdownSeconds(Number(v))}
                      disabled={isLive || status === 'countdown'}
                    >
                      <option value="0">{t.countdownOff || 'None'}</option>
                      <option value="3">3 s</option>
                      <option value="5">5 s</option>
                      <option value="10">10 s</option>
                    </Select>
                  </Field>
                </div>

                {activeMime && (
                  <div className="flex items-center justify-between text-[11px] font-bold border-t border-white/5 pt-3">
                    <span className="text-slate-500">{t.labelCodec || 'Codec'}</span>
                    <span className="text-slate-300 font-mono">{codecLabel(activeMime)}</span>
                  </div>
                )}
              </div>

              {/* Webcam bubble — live while recording */}
              {mode === 'both' && (
                <div className="glass-card rounded-3xl p-5 md:p-6 space-y-4 text-left">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <IconOverlay className="w-3.5 h-3.5 text-amber-400" />
                    {t.overlayTitle || 'Webcam bubble'}
                  </div>

                  <label className="block space-y-2">
                    <span className="text-[11px] font-bold text-slate-500">{t.overlaySize || 'Size'}</span>
                    <input
                      type="range"
                      min={0.1}
                      max={0.45}
                      step={0.01}
                      value={overlay.size}
                      onChange={e => setOverlay(o => ({ ...o, size: Number(e.target.value) }))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setOverlay(o => ({ ...o, shape: 'circle' }))}
                      className={`px-3 py-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                        overlay.shape === 'circle'
                          ? 'bg-amber-950/30 border-amber-500/40 text-amber-400'
                          : 'bg-[#140f0b]/40 border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.overlayCircle || 'Circle'}
                    </button>
                    <button
                      onClick={() => setOverlay(o => ({ ...o, shape: 'rounded' }))}
                      className={`px-3 py-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                        overlay.shape === 'rounded'
                          ? 'bg-amber-950/30 border-amber-500/40 text-amber-400'
                          : 'bg-[#140f0b]/40 border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.overlayRounded || 'Rounded'}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 hover:text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={overlay.mirror}
                        onChange={e => setOverlay(o => ({ ...o, mirror: e.target.checked }))}
                        className="accent-amber-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      {t.overlayMirror || 'Mirror'}
                    </label>
                    <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 hover:text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={overlay.ring}
                        onChange={e => setOverlay(o => ({ ...o, ring: e.target.checked }))}
                        className="accent-amber-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      {t.overlayRing || 'Ring'}
                    </label>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ================================================================ */}
          {/* How it works                                                     */}
          {/* ================================================================ */}
          <section className="space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                {t.howItWorksTitle || 'How it works'}
              </h2>
              <div className="h-1 w-16 bg-amber-500 mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {steps.map((step, i) => {
                const Art = step.art;
                return (
                  <div
                    key={i}
                    className="relative glass-card rounded-3xl p-6 space-y-4 border border-white/5 hover:border-amber-500/20 transition-all group"
                  >
                    <span className="absolute top-5 right-6 text-5xl font-black text-white/5 group-hover:text-amber-500/10 transition-colors">
                      {i + 1}
                    </span>
                    <Art className="w-24 h-auto text-amber-400" />
                    <h3 className="text-base font-bold text-white leading-snug">{step.title}</h3>
                    <p className="text-slate-500 text-[13px] leading-relaxed font-medium">{step.text}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ================================================================ */}
          {/* Features                                                         */}
          {/* ================================================================ */}
          <motion.section
            initial={prefersReduced ? false : 'hidden'}
            whileInView={prefersReduced ? undefined : 'visible'}
            viewport={{ once: true, amount: 0.15 }}
            variants={fadeInUp}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[...(t.features || []), ...extraFeatures].map((feature: any, idx: number) => {
              const Icon = featureIcons[idx] || IconLocalCapture;
              return (
                <div
                  key={idx}
                  className="p-7 glass-card rounded-3xl text-left hover:-translate-y-1.5 transition-all duration-300 group border border-white/5"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 group-hover:border-amber-500/40 transition-all">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-white text-lg font-bold mb-2.5 group-hover:text-amber-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">{feature.text}</p>
                </div>
              );
            })}
          </motion.section>

          {/* ================================================================ */}
          {/* SEO content                                                      */}
          {/* ================================================================ */}
          <section className="space-y-24 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-24 items-center">
              <div className="space-y-7">
                <div className="inline-block px-4 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-[11px] font-black uppercase tracking-[0.2em] border border-amber-500/20">
                  {keywords[0]}
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white leading-[1.05] tracking-tighter">
                  {t.seoHeroTitle}
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed font-medium">{t.seoHeroText}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(t.seoHeroList || []).map((point: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all"
                    >
                      <span className="w-7 h-7 shrink-0 bg-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                      <span className="text-slate-300 font-bold text-sm">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative glass-card rounded-[3rem] p-10 py-16 min-h-[400px] flex flex-col items-center justify-center gap-7 text-center overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl" />
                <IconBitrate className="w-20 h-20 text-amber-400 relative" />
                <div className="space-y-3 max-w-sm relative">
                  <h3 className="text-2xl font-black text-white tracking-tight leading-tight">
                    {t.seoBrowserSpeedTitle}
                  </h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">{t.seoBrowserSpeedText}</p>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-14 rounded-3xl md:rounded-[2.5rem] bg-[#120c06] border border-white/5 space-y-10">
              <div className="max-w-4xl space-y-4">
                <h2 className="text-2xl md:text-4xl font-black text-white leading-tight">{t.seoSecondaryTitle}</h2>
                <div className="h-1.5 w-20 bg-amber-500 rounded-full" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <div className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-3">
                    <span className="w-6 h-px bg-white/20" />
                    {t.seoUseCaseTitle}
                  </div>
                  <p className="text-slate-400 text-base leading-relaxed font-medium">{t.seoUseCaseText}</p>
                </div>
                <div className="space-y-3">
                  <div className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-3">
                    <span className="w-6 h-px bg-white/20" />
                    {t.seoPrivacyTitle}
                  </div>
                  <p className="text-slate-400 text-base leading-relaxed font-medium">{t.seoPrivacyText}</p>
                </div>
              </div>
            </div>

            {/* FAQ */}
            {faqs.length > 0 && (
              <div className="max-w-4xl mx-auto w-full space-y-10">
                <div className="text-center space-y-3">
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{t.faqTitle}</h2>
                  <div className="h-1 w-16 bg-amber-500 mx-auto rounded-full" />
                </div>
                <div className="grid gap-3">
                  {faqs.map((faq: any, idx: number) => (
                    <details
                      key={idx}
                      className="glass-card rounded-2xl px-6 py-5 text-left border border-white/5 hover:border-amber-500/20 transition-colors group [&_summary::-webkit-details-marker]:hidden"
                    >
                      <summary className="flex items-start gap-3 cursor-pointer list-none text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                        <span className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 text-[11px] font-black">
                          Q
                        </span>
                        <span className="flex-1">{faq.question}</span>
                        <span className="shrink-0 text-amber-400 transition-transform group-open:rotate-45 text-xl leading-none">
                          +
                        </span>
                      </summary>
                      <p className="text-slate-400 leading-relaxed pl-9 pt-3 text-sm">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {/* Keywords */}
            {keywords.length > 0 && (
              <div className="max-w-4xl mx-auto w-full space-y-5 opacity-55 text-center">
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                  {t.seoKeywordsTitle}
                </h2>
                <div className="flex flex-wrap justify-center gap-2">
                  {keywords.map((keyword: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 hover:bg-amber-500/10 hover:border-amber-500/20 hover:text-amber-400 transition-all cursor-default"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <AdBanner id="adsense-recordsnap-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={setActiveModal} />

      <LegalModal
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        title={activeModal === 'privacy' ? t.privacyPolicy : activeModal === 'terms' ? t.termsOfService : t.cookiePolicy}
        content={
          activeModal === 'privacy' ? t.privacyContent : activeModal === 'terms' ? t.termsContent : t.cookiesContent
        }
        t={t}
      />

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={t.scrollTopLabel || 'Back to top'}
          className="fixed bottom-8 right-8 z-[200] w-12 h-12 bg-amber-500 hover:bg-amber-400 text-black rounded-2xl shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-2">
    <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
    {children}
  </div>
);

const Select: React.FC<{
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ value, onChange, disabled, children }) => (
  <select
    value={value}
    disabled={disabled}
    onChange={e => onChange(e.target.value)}
    className="w-full bg-[#100b08] border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-200 outline-none focus:border-amber-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
  >
    {children}
  </select>
);

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border border-white/5 bg-black/30 px-3 py-2.5">
    <div className="text-[9px] font-black uppercase tracking-widest text-slate-600">{label}</div>
    <div className="text-sm font-bold text-white font-mono truncate">{value}</div>
  </div>
);

export default Recordsnap;
