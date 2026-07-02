import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AdBanner } from '../../components/shared/AdBanner';
import { LegalModal } from './components/LegalModal';
import { Camera, Mic, Monitor, Play, Square, RotateCcw, Check, AlertCircle, Volume2 } from 'lucide-react';
import { legalTranslations } from '../../locales/legal';

interface DeviceTestProps {
  lang: string;
  dictionary: any;
}

const NUM_BARS = 24;

export default function DeviceTest({ lang, dictionary }: DeviceTestProps) {
  const t = dictionary || {};
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  const [camStream, setCamStream] = useState<MediaStream | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [camStatus, setCamStatus] = useState<'idle' | 'active' | 'error'>('idle');
  const [camError, setCamError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const camStreamRef = useRef<MediaStream | null>(null);

  const [micStatus, setMicStatus] = useState<'idle' | 'active' | 'recording' | 'error'>('idle');
  const [micError, setMicError] = useState<string>('');
  const [recordProgress, setRecordProgress] = useState<number>(0);
  const [recordingBlobUrl, setRecordingBlobUrl] = useState<string | null>(null);
  const [isPlayingBack, setIsPlayingBack] = useState<boolean>(false);

  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);
  const recordBlobRef = useRef<string | null>(null);
  const barsRef = useRef<HTMLDivElement | null>(null);
  const playbackRef = useRef<HTMLAudioElement | null>(null);

  const [screenInfo, setScreenInfo] = useState<any>({});

  const enumerateCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setCameras(videoInputs);
      if (videoInputs.length > 0) {
        setSelectedCamera((prev) => prev || videoInputs[0].deviceId);
      }
    } catch {}
  }, []);

  const startCamera = useCallback(async (deviceId?: string) => {
    try {
      if (camStreamRef.current) {
        camStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      camStreamRef.current = stream;
      setCamStream(stream);
      setCamStatus('active');
      setCamError('');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      enumerateCameras();
    } catch (err: any) {
      setCamStatus('error');
      setCamError(err?.message || 'Camera access denied');
    }
  }, [enumerateCameras]);

  const stopCamera = useCallback(() => {
    if (camStreamRef.current) {
      camStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    camStreamRef.current = null;
    setCamStream(null);
    setCamStatus('idle');
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = e.target.value;
    setSelectedCamera(deviceId);
    if (camStatus === 'active') {
      startCamera(deviceId);
    }
  };

  const drawAudio = useCallback(() => {
    if (!analyserRef.current || !barsRef.current) return;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);
    const bars = barsRef.current.children;
    const numBars = bars.length;
    if (numBars === 0) return;
    const step = Math.max(1, Math.floor(bufferLength / numBars));
    for (let i = 0; i < numBars; i++) {
      let sum = 0;
      for (let j = 0; j < step; j++) {
        sum += dataArray[i * step + j] || 0;
      }
      const level = sum / step / 255;
      (bars[i] as HTMLElement).style.height = `${Math.max(4, level * 100)}%`;
    }
    animFrameRef.current = requestAnimationFrame(drawAudio);
  }, []);

  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      setMicStatus('active');
      setMicError('');
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;
      drawAudio();
    } catch (err: any) {
      setMicStatus('error');
      setMicError(err?.message || 'Microphone access denied');
    }
  }, [drawAudio]);

  const stopMic = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    micStreamRef.current = null;
    setMicStatus('idle');
    setRecordProgress(0);
    if (barsRef.current) {
      Array.from(barsRef.current.children).forEach((bar) => {
        (bar as HTMLElement).style.height = '4%';
      });
    }
  }, []);

  const record5Sec = useCallback(() => {
    if (!micStreamRef.current) return;
    audioChunksRef.current = [];
    if (recordBlobRef.current) {
      URL.revokeObjectURL(recordBlobRef.current);
      recordBlobRef.current = null;
    }
    setRecordingBlobUrl(null);
    setRecordProgress(0);
    setIsPlayingBack(false);
    setMicStatus('recording');

    let mime = '';
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
    for (const c of candidates) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) {
        mime = c;
        break;
      }
    }
    const recorder = new MediaRecorder(
      micStreamRef.current,
      mime ? { mimeType: mime } : undefined
    );
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: mime || 'audio/webm' });
      const url = URL.createObjectURL(blob);
      recordBlobRef.current = url;
      setRecordingBlobUrl(url);
      setMicStatus('active');
      setRecordProgress(1);
    };

    recorder.start();
    let elapsed = 0;
    recordTimerRef.current = setInterval(() => {
      elapsed += 0.1;
      setRecordProgress(Math.min(elapsed / 5, 1));
      if (elapsed >= 5) {
        if (recordTimerRef.current) {
          clearInterval(recordTimerRef.current);
          recordTimerRef.current = null;
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      }
    }, 100);
  }, []);

  const playRecording = useCallback(() => {
    if (recordBlobRef.current && playbackRef.current) {
      playbackRef.current.currentTime = 0;
      playbackRef.current.play().catch(() => {});
      setIsPlayingBack(true);
    }
  }, []);

  const resetRecording = useCallback(() => {
    if (recordBlobRef.current) {
      URL.revokeObjectURL(recordBlobRef.current);
      recordBlobRef.current = null;
    }
    setRecordingBlobUrl(null);
    setRecordProgress(0);
    setIsPlayingBack(false);
    if (playbackRef.current) {
      playbackRef.current.pause();
      playbackRef.current.currentTime = 0;
    }
  }, []);

  useEffect(() => {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    if (ua.includes('Edg/')) browser = 'Microsoft Edge';
    else if (ua.includes('OPR/') || ua.includes('Opera/')) browser = 'Opera';
    else if (ua.includes('Chrome/')) browser = 'Google Chrome';
    else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
    else if (ua.includes('Safari/')) browser = 'Safari';

    let os = 'Unknown';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iOS')) os = 'iOS';
    else if (ua.includes('Linux')) os = 'Linux';

    const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    setScreenInfo({
      resolution: `${window.screen.width} Ã— ${window.screen.height}`,
      pixelRatio: window.devicePixelRatio || 1,
      colorDepth: `${window.screen.colorDepth}-bit`,
      browser,
      os,
      cpuCores: navigator.hardwareConcurrency || 'N/A',
      ram: (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : 'N/A',
      touch: touch ? 'Yes' : 'No',
    });
  }, []);

  useEffect(() => {
    enumerateCameras();
  }, [enumerateCameras]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
      if (camStreamRef.current) camStreamRef.current.getTracks().forEach((track) => track.stop());
      if (micStreamRef.current) micStreamRef.current.getTracks().forEach((track) => track.stop());
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (recordBlobRef.current) URL.revokeObjectURL(recordBlobRef.current);
    };
  }, []);

  const resetWorkspace = useCallback(() => {
    stopCamera();
    stopMic();
    resetRecording();
  }, [stopCamera, stopMic, resetRecording]);

  const sysInfoRows = [
    { label: t.sysResolution || 'Screen Resolution', value: screenInfo.resolution },
    { label: t.sysPixelRatio || 'Pixel Ratio', value: screenInfo.pixelRatio },
    { label: t.sysColorDepth || 'Color Depth', value: screenInfo.colorDepth },
    { label: t.sysBrowser || 'Browser', value: screenInfo.browser },
    { label: t.sysOS || 'Operating System', value: screenInfo.os },
    { label: t.sysCpuCores || 'CPU Cores', value: screenInfo.cpuCores },
    { label: t.sysRam || 'Device Memory', value: screenInfo.ram },
    { label: t.sysTouch || 'Touch Support', value: screenInfo.touch },
  ];

  const StatusBadge = ({
    state,
  }: {
    state: 'idle' | 'active' | 'recording' | 'error';
  }) => {
    const isActive = state === 'active' || state === 'recording';
    const isError = state === 'error';
    const label =
      state === 'recording'
        ? t.statusRecording || 'Recording'
        : state === 'active'
        ? t.statusActive || 'Active'
        : state === 'error'
        ? t.statusError || 'Error'
        : t.statusIdle || 'Idle';
    return (
      <span
        className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
          isActive
            ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
            : isError
            ? 'text-rose-400 border-rose-500/30 bg-rose-500/10'
            : 'text-slate-500 border-white/10 bg-white/5'
        }`}
      >
        {isActive && <Check className="w-3 h-3" />}
        {isError && <AlertCircle className="w-3 h-3" />}
        {label}
      </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0204] text-slate-200 font-sans relative overflow-x-hidden pt-24">
      
      

      <Header
        currentLang={lang}
        onLanguageChange={(l) => (window.location.href = `/${l}/device-test`)}
        onReset={resetWorkspace}
        t={t}
      />

      <main className="flex-grow max-w-6xl w-full mx-auto px-4 md:px-12 py-8 relative z-10 flex flex-col space-y-10">
        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-device-test-top" />
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white flex items-center justify-center gap-3">
            <Camera className="w-8 h-8 md:w-10 md:h-10 text-rose-400" />
            <span>{t.seoHeroTitle || 'Device Test'}</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            {t.seoHeroText ||
              'Test your webcam, microphone and inspect system info, all locally in your browser.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-md flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-rose-400" />
                {t.camTitle || 'Webcam'}
              </h3>
              <StatusBadge state={camStatus} />
            </div>

            <div className="relative aspect-video bg-black/60 border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${camStatus === 'active' ? 'scale-x-[-1]' : 'hidden'}`}
              />
              {camStatus !== 'active' && (
                <div className="flex flex-col items-center gap-3 text-slate-600">
                  <Camera className="w-12 h-12" />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    {camStatus === 'error'
                      ? t.camDenied || 'Camera access denied'
                      : t.camPlaceholder || 'Camera preview'}
                  </span>
                </div>
              )}
            </div>

            {camStatus === 'error' && camError && (
              <p className="text-xs text-rose-400 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{camError}</span>
              </p>
            )}

            <select
              value={selectedCamera}
              onChange={handleCameraChange}
              disabled={cameras.length === 0}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-rose-500/50 cursor-pointer disabled:opacity-50"
            >
              {cameras.length === 0 && <option>{t.camNone || 'No cameras detected'}</option>}
              {cameras.map((cam, i) => (
                <option key={cam.deviceId || i} value={cam.deviceId}>
                  {cam.label || `${t.camLabel || 'Camera'} ${i + 1}`}
                </option>
              ))}
            </select>

            <div className="flex gap-3 mt-auto">
              {camStatus !== 'active' ? (
                <button
                  onClick={() => startCamera(selectedCamera || undefined)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-500 hover:bg-rose-600 text-white font-black text-sm uppercase rounded-xl transition-all cursor-pointer border-none outline-none"
                >
                  <Camera className="w-4 h-4" />
                  <span>{t.camStart || 'Start Camera'}</span>
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 text-white font-black text-sm uppercase rounded-xl transition-all cursor-pointer border-none outline-none"
                >
                  <Square className="w-4 h-4" />
                  <span>{t.camStop || 'Stop Camera'}</span>
                </button>
              )}
            </div>
          </section>

          <section className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-md flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Mic className="w-5 h-5 text-rose-400" />
                {t.micTitle || 'Microphone'}
              </h3>
              <StatusBadge state={micStatus} />
            </div>

            <div className="relative h-32 bg-black/60 border border-white/10 rounded-2xl overflow-hidden flex items-end p-3">
              <div ref={barsRef} className="flex items-end justify-center gap-1.5 w-full h-full">
                {Array.from({ length: NUM_BARS }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm bg-gradient-to-t from-rose-600 to-rose-300"
                    style={{ height: '4%' }}
                  />
                ))}
              </div>
              {micStatus === 'idle' && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                  <Volume2 className="w-8 h-8" />
                </div>
              )}
            </div>

            {micStatus === 'recording' && (
              <div className="flex flex-col gap-2">
                <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-red-600 transition-all duration-100"
                    style={{ width: `${recordProgress * 100}%` }}
                  />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 text-center">
                  {t.micRecording || 'Recording'}... {(recordProgress * 5).toFixed(1)}s / 5s
                </p>
              </div>
            )}

            {micStatus === 'error' && micError && (
              <p className="text-xs text-rose-400 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{micError}</span>
              </p>
            )}

            <div className="flex flex-wrap gap-2 mt-auto">
              {micStatus === 'idle' || micStatus === 'error' ? (
                <button
                  onClick={startMic}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-500 hover:bg-rose-600 text-white font-black text-sm uppercase rounded-xl transition-all cursor-pointer border-none outline-none"
                >
                  <Mic className="w-4 h-4" />
                  <span>{t.micStart || 'Start Mic'}</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={record5Sec}
                    disabled={micStatus === 'recording'}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs uppercase rounded-xl transition-all cursor-pointer border-none outline-none"
                  >
                    <Mic className="w-4 h-4" />
                    <span>{t.micRecord || 'Record 5s'}</span>
                  </button>
                  <button
                    onClick={stopMic}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase rounded-xl transition-all cursor-pointer border-none outline-none"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                </>
              )}
              {recordingBlobUrl && micStatus !== 'recording' && (
                <>
                  <button
                    onClick={playRecording}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase rounded-xl transition-all cursor-pointer border border-white/10 outline-none"
                  >
                    <Play className="w-4 h-4 text-rose-400" />
                    <span>{isPlayingBack ? t.micPlaying || 'Playing' : t.micPlay || 'Play'}</span>
                  </button>
                  <button
                    onClick={resetRecording}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase rounded-xl transition-all cursor-pointer border border-white/10 outline-none"
                  >
                    <RotateCcw className="w-4 h-4 text-rose-400" />
                  </button>
                </>
              )}
            </div>

            <audio ref={playbackRef} onEnded={() => setIsPlayingBack(false)} className="hidden" />
          </section>

          <section className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-md flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Monitor className="w-5 h-5 text-rose-400" />
                {t.sysTitle || 'System Info'}
              </h3>
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                <Check className="w-3 h-3" />
                {t.statusReady || 'Ready'}
              </span>
            </div>

            <div className="flex flex-col divide-y divide-white/5">
              {sysInfoRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {row.label}
                  </span>
                  <span className="text-sm font-mono text-rose-400 text-right">
                    {row.value || 'â€”'}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-2">
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest text-center leading-relaxed">
                {t.sysNote || 'Detected locally via navigator APIs'}
              </p>
            </div>
          </section>
        </div>
      {/* Bloque AdSense Horizontal */}
      <AdBanner id="adsense-device-test-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={(modal) => setLegalModal(modal)} />

      <LegalModal
        isOpen={legalModal === 'privacy'}
        onClose={() => setLegalModal(null)}
        title={legalTranslations[lang]?.privacy.title || 'Privacy Policy'}
        content={legalTranslations[lang]?.privacy.content}
        t={t}
      />
      <LegalModal
        isOpen={legalModal === 'terms'}
        onClose={() => setLegalModal(null)}
        title={legalTranslations[lang]?.terms.title || 'Terms of Service'}
        content={legalTranslations[lang]?.terms.content}
        t={t}
      />
      <LegalModal
        isOpen={legalModal === 'cookies'}
        onClose={() => setLegalModal(null)}
        title={legalTranslations[lang]?.cookies.title || 'Cookie Policy'}
        content={legalTranslations[lang]?.cookies.content}
        t={t}
      />
    </div>
  );
}
