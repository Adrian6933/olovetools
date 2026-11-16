import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Layers, Loader2, RefreshCcw, Volume2, VolumeX, X, Zap, ZapOff, ZoomIn } from 'lucide-react';

import { createTicker, type Ticker } from '../../../lib/ticker';
import { decodeFrame, type Detection } from '../lib/decode';
import { prettyFormat } from '../lib/parse';
import { beep, buzz, type Prefs } from '../lib/history';

interface Props {
  t: any;
  prefs: Prefs;
  onPrefs: (p: Prefs) => void;
  /** Single mode: called once with the first read, then the scanner closes. */
  onResult: (found: Detection[]) => void;
  /** Continuous mode: called with everything collected when the person finishes. */
  onBatch: (found: Detection[]) => void;
  onClose: (error?: 'denied' | 'missing' | 'insecure') => void;
}

interface ZoomRange {
  min: number;
  max: number;
  step: number;
}

/**
 * Full-screen camera. On a phone it takes the whole screen, like the system
 * camera app; on a computer it is a large panel over the page. The stream is
 * stopped as soon as the component closes, so the camera light goes off.
 */
export function CameraScanner({ t, prefs, onPrefs, onResult, onBatch, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const tickerRef = useRef<Ticker | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const busyRef = useRef(false);
  const doneRef = useRef(false);
  const collectedRef = useRef<Detection[]>([]);
  const prefsRef = useRef(prefs);
  const devicesRef = useRef<MediaDeviceInfo[]>([]);
  prefsRef.current = prefs;

  const [ready, setReady] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceIndex, setDeviceIndex] = useState(-1);
  const [torch, setTorch] = useState<boolean | null>(null);
  const [zoom, setZoom] = useState<ZoomRange | null>(null);
  const [zoomValue, setZoomValue] = useState(1);
  const [flash, setFlash] = useState(false);
  const [collected, setCollected] = useState<Detection[]>([]);
  const [lastCode, setLastCode] = useState<string | null>(null);

  const stop = useCallback(() => {
    tickerRef.current?.stop();
    tickerRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  }, []);

  const feedback = useCallback(() => {
    if (prefsRef.current.vibrate) buzz();
    if (prefsRef.current.sound) beep();
    setFlash(true);
    window.setTimeout(() => setFlash(false), 260);
  }, []);

  const scan = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || busyRef.current || doneRef.current) return;
    busyRef.current = true;
    try {
      const canvas = (canvasRef.current ||= document.createElement('canvas'));
      // Sharp enough for a QR across the room, small enough to run ~6 times a second.
      const scale = Math.min(1, 1100 / Math.max(video.videoWidth, video.videoHeight));
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const found = await decodeFrame(ctx.getImageData(0, 0, canvas.width, canvas.height));
      if (!found.length || doneRef.current) return;

      if (prefsRef.current.continuous) {
        const fresh = found.filter(
          d => !collectedRef.current.some(c => c.text === d.text && c.format === d.format)
        );
        if (!fresh.length) return;
        collectedRef.current = [...fresh, ...collectedRef.current];
        setCollected(collectedRef.current);
        setLastCode(fresh[0].text);
        feedback();
        return;
      }

      doneRef.current = true;
      feedback();
      stop();
      // Let the green flash register before the result replaces the camera.
      window.setTimeout(() => onResult(found), 180);
    } finally {
      busyRef.current = false;
    }
  }, [feedback, onResult, stop]);

  const start = useCallback(
    async (index: number) => {
      stop();
      setReady(false);
      setTorch(null);
      setZoom(null);
      if (!window.isSecureContext) {
        onClose('insecure');
        return;
      }
      try {
        const chosen = index >= 0 ? devicesRef.current[index] : undefined;
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: chosen
            ? { deviceId: { exact: chosen.deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
            : { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
        // Closed while the permission prompt was open: release the camera at
        // once, or its light would stay on with nothing showing it.
        if (doneRef.current) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          // Not awaited: play() can stay pending (background tab, power
          // saving) and the controls must not wait on it. The scan loop
          // simply skips frames until the video has a size.
          video.play().catch(() => undefined);
        }

        const track = stream.getVideoTracks()[0];
        const caps: any = track.getCapabilities?.() || {};
        if (caps.torch) setTorch(false);
        if (caps.zoom && caps.zoom.max > caps.zoom.min) {
          setZoom({ min: caps.zoom.min, max: Math.min(caps.zoom.max, 8), step: caps.zoom.step || 0.1 });
          setZoomValue((track.getSettings() as any).zoom || caps.zoom.min);
        }
        // Continuous autofocus where the camera offers it: phones sometimes
        // start in fixed focus and never sharpen a close code.
        if (Array.isArray(caps.focusMode) && caps.focusMode.includes('continuous')) {
          track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] } as any).catch(() => undefined);
        }

        // Device labels only exist after permission has been granted.
        const all = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput');
        devicesRef.current = all;
        setDevices(all);
        if (index < 0) {
          const id = track.getSettings().deviceId;
          setDeviceIndex(Math.max(0, all.findIndex(d => d.deviceId === id)));
        }

        setReady(true);
        tickerRef.current = createTicker(150, () => void scan());
      } catch (err: any) {
        stop();
        onClose(err?.name === 'NotAllowedError' || err?.name === 'SecurityError' ? 'denied' : 'missing');
      }
    },
    [scan, stop, onClose]
  );

  useEffect(() => {
    void start(-1);
    // Lock page scroll under the full-screen camera.
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => {
      doneRef.current = true;
      stop();
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    doneRef.current = true;
    stop();
    if (collectedRef.current.length) onBatch(collectedRef.current);
    else onClose();
  };

  const switchCamera = () => {
    if (devices.length < 2) return;
    const next = (deviceIndex + 1) % devices.length;
    setDeviceIndex(next);
    void start(next);
  };

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track || torch === null) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torch }] } as any);
      setTorch(!torch);
    } catch {
      setTorch(null);
    }
  };

  const applyZoom = (value: number) => {
    setZoomValue(value);
    streamRef.current
      ?.getVideoTracks()[0]
      ?.applyConstraints({ advanced: [{ zoom: value }] } as any)
      .catch(() => undefined);
  };

  const roundBtn =
    'w-12 h-12 rounded-full flex items-center justify-center bg-black/45 backdrop-blur-md border border-white/15 text-white active:scale-95 transition-transform cursor-pointer';

  // Portalled to <body>: inside the tool, #root is its own stacking context
  // and the site's floating buttons would sit on top of the camera.
  return createPortal(
    <div
      className="fixed inset-0 z-[10000] bg-black flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={t.cameraTitle || 'Camera scanner'}
    >
      <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover" />

      {/* Viewfinder */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div
          className={`relative w-[72vw] max-w-[340px] aspect-square rounded-[2rem] transition-colors duration-200 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] ${
            flash ? 'border-4 border-emerald-400' : 'border-2 border-white/80'
          }`}
        >
          {ready && !flash && <div className="qr-scanline absolute left-4 right-4 h-0.5 bg-cyan-400 shadow-[0_0_12px_2px_rgba(34,211,238,0.8)] rounded-full" />}
        </div>
      </div>

      {!ready && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/80">
          <Loader2 className="w-9 h-9 animate-spin" />
          <p className="text-sm font-bold">{t.cameraStarting || 'Starting the camera…'}</p>
        </div>
      )}

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button onClick={close} className={roundBtn} aria-label={t.closeBtn || 'Close'}>
          <X className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onPrefs({ ...prefs, sound: !prefs.sound })}
            className={roundBtn}
            aria-label={t.soundBtn || 'Sound'}
            aria-pressed={prefs.sound}
          >
            {prefs.sound ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 opacity-70" />}
          </button>
          {torch !== null && (
            <button
              onClick={toggleTorch}
              className={`${roundBtn} ${torch ? '!bg-amber-300 !text-black' : ''}`}
              aria-label={t.torchBtn || 'Torch'}
              aria-pressed={torch}
            >
              {torch ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
            </button>
          )}
          {devices.length > 1 && (
            <button onClick={switchCamera} className={roundBtn} aria-label={t.switchCameraBtn || 'Switch camera'}>
              <RefreshCcw className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <p className="relative z-10 mt-auto mb-6 mx-auto px-4 py-2 rounded-full bg-black/50 backdrop-blur text-white text-sm font-bold text-center max-w-[90vw]">
        {prefs.continuous
          ? (t.cameraHintContinuous || 'Point at each code. They are collected as you go.')
          : (t.cameraHint || 'Point at a QR code or barcode')}
      </p>

      {/* Bottom controls */}
      <div className="relative z-10 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-4">
        {zoom && (
          <label className="flex items-center gap-3 max-w-sm mx-auto px-4 py-2.5 rounded-full bg-black/50 backdrop-blur border border-white/10 text-white">
            <ZoomIn className="w-4 h-4 shrink-0" />
            <span className="sr-only">{t.zoomLabel || 'Zoom'}</span>
            <input
              type="range"
              min={zoom.min}
              max={zoom.max}
              step={zoom.step}
              value={zoomValue}
              onChange={e => applyZoom(Number(e.target.value))}
              className="flex-1 accent-cyan-400"
            />
            <span className="text-xs font-bold tabular-nums w-9 text-right">{zoomValue.toFixed(1)}×</span>
          </label>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => onPrefs({ ...prefs, continuous: !prefs.continuous })}
            aria-pressed={prefs.continuous}
            className={`flex items-center gap-2 px-4 h-12 rounded-full border text-sm font-bold backdrop-blur-md transition-colors cursor-pointer ${
              prefs.continuous ? 'bg-cyan-400 text-black border-cyan-300' : 'bg-black/45 text-white border-white/15'
            }`}
          >
            <Layers className="w-4 h-4" />
            {t.continuousBtn || 'Multiple codes'}
          </button>
          {prefs.continuous && collected.length > 0 && (
            <button
              onClick={close}
              className="flex items-center gap-2 px-5 h-12 rounded-full bg-emerald-400 text-black text-sm font-black cursor-pointer active:scale-95 transition-transform"
            >
              <Check className="w-4 h-4" />
              {(t.finishBtn || 'Done ({n})').replace('{n}', String(collected.length))}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {lastCode && prefs.continuous && (
          <motion.div
            key={lastCode}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute z-20 top-24 left-1/2 -translate-x-1/2 max-w-[86vw] px-4 py-2.5 rounded-2xl bg-emerald-400 text-black text-sm font-bold shadow-xl truncate"
          >
            {prettyFormat(collected[0]?.format || '')} · {lastCode}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .qr-scanline { animation: qrScan 2.2s ease-in-out infinite; }
        @keyframes qrScan { 0% { top: 8%; } 50% { top: 90%; } 100% { top: 8%; } }
        @media (prefers-reduced-motion: reduce) { .qr-scanline { animation: none; top: 50%; } }
      `}</style>
    </div>,
    document.body
  );
}
