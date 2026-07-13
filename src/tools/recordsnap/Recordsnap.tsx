import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, 
  Monitor, 
  Camera, 
  Mic, 
  Volume2, 
  Settings, 
  Download, 
  RefreshCw, 
  Pause, 
  Play, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Lock, 
  HelpCircle, 
  ArrowUp,
  VolumeX,
  Timer
} from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import type { Language } from '../../locales/meta';
import { AdBanner } from '../../components/shared/AdBanner';
import { RecordMode, AudioSource, ResolutionMode, FpsMode, RecordingStatus } from './types';

interface RecordsnapProps {
  lang: Language;
  dictionary?: any;
}

export const Recordsnap: React.FC<RecordsnapProps> = ({ lang, dictionary }) => {
  const t = dictionary || {};

  // Configuration States
  const [recordMode, setRecordMode] = useState<RecordMode>('screen');
  const [audioSource, setAudioSource] = useState<AudioSource>('mic');
  const [resolution, setResolution] = useState<ResolutionMode>('native');
  const [fps, setFps] = useState<FpsMode>(30);

  // App States
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [countdown, setCountdown] = useState<number>(3);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeFaqIdx, setActiveFaqIdx] = useState<number | null>(null);

  // Real-time audio analysis state
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(10).fill(5));

  // Refs for Media Recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const camStreamRef = useRef<MediaStream | null>(null);
  const combinedStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Canvas-related Refs for Screen + Webcam Overlay
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasVideoScreenRef = useRef<HTMLVideoElement | null>(null);
  const canvasVideoCamRef = useRef<HTMLVideoElement | null>(null);
  const canvasAnimationFrameIdRef = useRef<number | null>(null);
  
  // Audio Analyser Refs
  const analyserRef = useRef<AnalyserNode | null>(null);
  const analyserAnimationIdRef = useRef<number | null>(null);
  const audioDataArrayRef = useRef<Uint8Array | null>(null);

  // Local camera preview ref (for showing webcam feed during webcam or screen+webcam recording)
  const localCamVideoRef = useRef<HTMLVideoElement | null>(null);

  // Scroll to top helpers
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupStreamsAndTimers();
    };
  }, []);

  // Helper to format bytes
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Helper to format time (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const cleanupStreamsAndTimers = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (canvasAnimationFrameIdRef.current) {
      cancelAnimationFrame(canvasAnimationFrameIdRef.current);
      canvasAnimationFrameIdRef.current = null;
    }
    if (analyserAnimationIdRef.current) {
      cancelAnimationFrame(analyserAnimationIdRef.current);
      analyserAnimationIdRef.current = null;
    }
    
    // Stop all media tracks
    stopStreamTracks(screenStreamRef.current);
    stopStreamTracks(camStreamRef.current);
    stopStreamTracks(combinedStreamRef.current);

    screenStreamRef.current = null;
    camStreamRef.current = null;
    combinedStreamRef.current = null;

    if (audioCtxRef.current) {
      if (audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
      audioCtxRef.current = null;
    }

    analyserRef.current = null;
    audioDataArrayRef.current = null;
  };

  const stopStreamTracks = (stream: MediaStream | null) => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        track.onended = null;
      });
    }
  };

  // Detect supported mime types
  const getSupportedMimeType = () => {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm',
      'video/mp4;codecs=h264',
      'video/mp4'
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return '';
  };

  // Audio analyzer update loop
  const startAudioAnalyser = (stream: MediaStream) => {
    try {
      if (audioCtxRef.current && audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = null;
      }
      
      const audioCtx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      
      // Resume if suspended (browser security blocks autoplay audio)
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 32;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      analyserRef.current = analyser;
      audioDataArrayRef.current = dataArray;

      const updateMeter = () => {
        if (!analyserRef.current || !audioDataArrayRef.current) return;
        analyserRef.current.getByteFrequencyData(audioDataArrayRef.current);

        const levels = [];
        const step = Math.floor(audioDataArrayRef.current.length / 10) || 1;
        for (let i = 0; i < 10; i++) {
          const val = audioDataArrayRef.current[i * step] || 0;
          // Normalize (0-255) to height percentage (5% to 100%)
          const pct = Math.max(5, (val / 255) * 100);
          levels.push(pct);
        }
        setAudioLevels(levels);

        analyserAnimationIdRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (e) {
      console.warn('Audio analyzer could not be initialized:', e);
    }
  };

  // Core stream capture logic
  const captureMediaStreams = async () => {
    const needMic = audioSource === 'mic' || audioSource === 'both';
    const needSystemAudio = audioSource === 'system' || audioSource === 'both';
    const needCamera = recordMode === 'camera' || recordMode === 'both';
    const needScreen = recordMode === 'screen' || recordMode === 'both';

    let camStream: MediaStream | null = null;
    let screenStream: MediaStream | null = null;

    // Dimensions constraints
    const widthConstraint = resolution === '1080p' ? 1920 : resolution === '720p' ? 1280 : undefined;
    const heightConstraint = resolution === '1080p' ? 1080 : resolution === '720p' ? 720 : undefined;

    // 1. Capture Camera and/or Mic
    if (needCamera || needMic) {
      const userMediaConstraints: MediaStreamConstraints = {};
      if (needCamera) {
        userMediaConstraints.video = {
          width: widthConstraint ? { ideal: widthConstraint } : undefined,
          height: heightConstraint ? { ideal: heightConstraint } : undefined,
          frameRate: { ideal: fps }
        };
      }
      if (needMic) {
        userMediaConstraints.audio = {
          echoCancellation: true,
          noiseSuppression: true
        };
      }
      camStream = await navigator.mediaDevices.getUserMedia(userMediaConstraints);
      camStreamRef.current = camStream;

      // Play local feed in preview element if camera mode is active
      if (needCamera && localCamVideoRef.current) {
        localCamVideoRef.current.srcObject = camStream;
        localCamVideoRef.current.play().catch(e => console.warn('Local preview video autoplay failed:', e));
      }
    }

    // 2. Capture Screen Share
    if (needScreen) {
      const displayConstraints: DisplayMediaStreamOptions = {
        video: {
          width: widthConstraint ? { ideal: widthConstraint } : undefined,
          height: heightConstraint ? { ideal: heightConstraint } : undefined,
          frameRate: { ideal: fps }
        },
        audio: needSystemAudio
      };
      screenStream = await navigator.mediaDevices.getDisplayMedia(displayConstraints);
      screenStreamRef.current = screenStream;
    }

    // 3. Assemble Audio Track
    let audioTracks: MediaStreamTrack[] = [];
    let systemAudioStream: MediaStream | null = null;

    if (screenStream && screenStream.getAudioTracks().length > 0) {
      systemAudioStream = new MediaStream(screenStream.getAudioTracks());
    }

    if (needMic && needSystemAudio && camStream && systemAudioStream) {
      // Merge system + mic audio using AudioContext destination
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const dest = audioCtx.createMediaStreamDestination();

      const micSource = audioCtx.createMediaStreamSource(camStream);
      micSource.connect(dest);

      const sysSource = audioCtx.createMediaStreamSource(systemAudioStream);
      sysSource.connect(dest);

      audioTracks = dest.stream.getAudioTracks();
      
      // Visualizer listens to mic stream
      startAudioAnalyser(camStream);
    } else if (needMic && camStream && camStream.getAudioTracks().length > 0) {
      audioTracks = camStream.getAudioTracks();
      startAudioAnalyser(camStream);
    } else if (needSystemAudio && systemAudioStream && systemAudioStream.getAudioTracks().length > 0) {
      audioTracks = systemAudioStream.getAudioTracks();
      startAudioAnalyser(systemAudioStream);
    }

    // 4. Assemble Final Recording Stream
    let finalStream: MediaStream;

    if (recordMode === 'screen') {
      if (!screenStream) throw new Error("Screen stream not found");
      const videoTrack = screenStream.getVideoTracks()[0];
      
      finalStream = new MediaStream();
      finalStream.addTrack(videoTrack);
      audioTracks.forEach(t => finalStream.addTrack(t));

    } else if (recordMode === 'camera') {
      if (!camStream) throw new Error("Camera stream not found");
      const videoTrack = camStream.getVideoTracks()[0];

      finalStream = new MediaStream();
      finalStream.addTrack(videoTrack);
      audioTracks.forEach(t => finalStream.addTrack(t));

    } else {
      // Screen + Webcam Overlay mode combined on Canvas
      if (!screenStream || !camStream) {
        throw new Error("Both screen and camera streams must be active.");
      }

      const screenTrack = screenStream.getVideoTracks()[0];
      const settings = screenTrack.getSettings();
      const canvasW = settings.width || 1280;
      const canvasH = settings.height || 720;

      const canvas = document.createElement('canvas');
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not create offscreen canvas context");

      // Setup screen video element
      const screenVid = document.createElement('video');
      screenVid.srcObject = screenStream;
      screenVid.muted = true;
      screenVid.playsInline = true;
      await screenVid.play();
      canvasVideoScreenRef.current = screenVid;

      // Setup camera video element
      const camVid = document.createElement('video');
      camVid.srcObject = camStream;
      camVid.muted = true;
      camVid.playsInline = true;
      await camVid.play();
      canvasVideoCamRef.current = camVid;

      // Play local preview of webcam
      if (localCamVideoRef.current) {
        localCamVideoRef.current.srcObject = camStream;
        localCamVideoRef.current.play().catch(e => console.warn('Local preview video autoplay failed:', e));
      }

      // Draw canvas loop
      const renderOverlay = () => {
        if (!ctx || !screenVid || !camVid) return;

        // Draw background screen share
        ctx.drawImage(screenVid, 0, 0, canvasW, canvasH);

        // Draw camera overlay in bottom right corner (circular webcam)
        const size = Math.min(canvasW, canvasH) * 0.22;
        const margin = 30;
        const rx = canvasW - size - margin;
        const ry = canvasH - size - margin;

        ctx.save();
        
        // Draw elegant glowing border
        ctx.beginPath();
        ctx.arc(rx + size / 2, ry + size / 2, size / 2, 0, Math.PI * 2);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.clip();

        // Crop center of camera
        const cw = camVid.videoWidth || 640;
        const ch = camVid.videoHeight || 480;
        const cSize = Math.min(cw, ch);
        const sx = (cw - cSize) / 2;
        const sy = (ch - cSize) / 2;

        ctx.drawImage(camVid, sx, sy, cSize, cSize, rx, ry, size, size);
        ctx.restore();

        canvasAnimationFrameIdRef.current = requestAnimationFrame(renderOverlay);
      };

      renderOverlay();

      const canvasStream = canvas.captureStream(fps);
      const videoTrack = canvasStream.getVideoTracks()[0];

      finalStream = new MediaStream();
      finalStream.addTrack(videoTrack);
      audioTracks.forEach(t => finalStream.addTrack(t));
    }

    // Set up auto-stop if the user stops sharing via browser bar
    if (screenStream) {
      const screenVideoTrack = screenStream.getVideoTracks()[0];
      if (screenVideoTrack) {
        screenVideoTrack.onended = () => {
          stopRecording();
        };
      }
    }

    combinedStreamRef.current = finalStream;
    return finalStream;
  };

  const startCountdown = () => {
    setRecordedBlobUrl(null);
    setErrorMessage(null);
    setStatus('countdown');
    setCountdown(3);

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          triggerStreamCapture();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const triggerStreamCapture = async () => {
    try {
      setStatus('processing');
      const finalStream = await captureMediaStreams();
      if (!finalStream) throw new Error("Could not initialize recording stream");

      recordedChunksRef.current = [];
      const options = { mimeType: getSupportedMimeType() };
      
      const recorder = new MediaRecorder(finalStream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        setStatus('processing');
        const mimeType = recorder.mimeType || 'video/webm';
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        setRecordedBlobUrl(url);
        setStatus('done');
        cleanupStreamsAndTimers();
      };

      recorder.start(1000); // chunk every 1s
      setStatus('recording');

      setRecordingTime(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error(err);
      cleanupStreamsAndTimers();
      setErrorMessage(err.message || String(err));
      setStatus('error');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setStatus('paused');
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (analyserAnimationIdRef.current) {
        cancelAnimationFrame(analyserAnimationIdRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setStatus('recording');
      
      // Restart timers
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Restart audio meter if stream is active
      const activeAudioStream = camStreamRef.current || screenStreamRef.current || combinedStreamRef.current;
      if (activeAudioStream && (audioSource !== 'none')) {
        startAudioAnalyser(activeAudioStream);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      cleanupStreamsAndTimers();
      setStatus('idle');
    }
  };

  const downloadVideo = () => {
    if (!recordedBlobUrl) return;
    const mimeType = mediaRecorderRef.current?.mimeType || 'video/webm';
    const isMp4 = mimeType.includes('mp4');
    const ext = isMp4 ? 'mp4' : 'webm';
    const dateStr = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

    const a = document.createElement('a');
    a.href = recordedBlobUrl;
    a.download = `RecordSnap-Recording-${dateStr}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const resetApp = () => {
    cleanupStreamsAndTimers();
    setRecordedBlobUrl(null);
    setErrorMessage(null);
    setStatus('idle');
    setRecordingTime(0);
    setAudioLevels(new Array(10).fill(5));
  };

  const handleLanguageChange = (newLang: string) => {
    window.location.href = `/${newLang.toLowerCase()}/recordsnap`;
  };

  const faqs = Array.isArray(t.faq) ? t.faq : [];
  const keywords = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];
  const featuresList = Array.isArray(t.features) ? t.features : [];

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0805] text-slate-100 selection:bg-amber-500/30 overflow-x-hidden font-sans">
      {/* Background Glow Orbs */}
      

      <Header currentLang={lang} onLanguageChange={handleLanguageChange} onReset={resetApp} t={t} />

      <main className="flex-1 flex flex-col items-center pt-36 pb-32 px-4 md:px-12 relative z-10 w-full">
        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-recordsnap-top" />
        <div className="max-w-6xl w-full text-center space-y-16 md:space-y-24">
          
          {/* Hero Header */}
          <div className="flex flex-col items-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center space-x-2 px-5 py-2 rounded-full bg-amber-950/40 border border-amber-800/30 text-amber-400 text-xs font-black tracking-widest uppercase shadow-[0_0_25px_rgba(245,158,11,0.15)]">
              <Sparkles className="w-4 h-4 animate-float" />
              <span>{t.title}</span>
            </div>
            
            <h1 className="text-4xl md:text-[5.5rem] font-black tracking-tight leading-[0.9] text-white bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-400">
              {t.title}
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              {t.description}
            </p>
          </div>

          {/* Core App Body */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Box: Capture Settings or Live Recording Preview */}
            <div className="lg:col-span-8 space-y-6">
              
              <AnimatePresence mode="wait">
                {/* IDLE state: show settings form */}
                {status === 'idle' && (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="glass-card rounded-3xl p-6 md:p-8 space-y-8 text-left relative overflow-hidden"
                  >
                    

                    {/* Record Mode Selector */}
                    <div className="space-y-4">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.title}</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          { id: 'screen', label: t.modeScreen, icon: Monitor, desc: "Record your desktop or application window" },
                          { id: 'camera', label: t.modeCamera, icon: Camera, desc: "Record your webcam feed directly" },
                          { id: 'both', label: t.modeBoth, icon: Video, desc: "Overlay your webcam over your shared screen" }
                        ].map(m => {
                          const Icon = m.icon;
                          const isSel = recordMode === m.id;
                          return (
                            <button
                              key={m.id}
                              onClick={() => setRecordMode(m.id as RecordMode)}
                              className={`p-5 rounded-2xl border text-left transition-all cursor-pointer outline-none flex flex-col justify-between h-36 ${
                                isSel 
                                  ? 'bg-amber-950/20 border-amber-500/40 text-amber-400 shadow-inner' 
                                  : 'bg-[#140f0b]/40 border-white/5 text-slate-400 hover:text-white hover:bg-[#140f0b]/80'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <Icon className={`w-6 h-6 ${isSel ? 'text-amber-400' : 'text-slate-400'}`} />
                                {isSel && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                              </div>
                              <div className="mt-2">
                                <span className="text-sm font-bold block text-white">{m.label}</span>
                                <span className="text-[10px] text-slate-500 font-medium block mt-1 leading-snug">{m.desc}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Audio Source Selector */}
                    <div className="space-y-4">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.labelAudioSource}</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { id: 'none', label: t.audioNone, icon: VolumeX },
                          { id: 'mic', label: t.audioMic, icon: Mic },
                          { id: 'system', label: t.audioSystem, icon: Volume2 },
                          { id: 'both', label: t.audioBoth, icon: Mic }
                        ].map(a => {
                          const Icon = a.icon;
                          const isSel = audioSource === a.id;
                          return (
                            <button
                              key={a.id}
                              onClick={() => setAudioSource(a.id as AudioSource)}
                              className={`p-4 rounded-xl border text-left transition-all cursor-pointer outline-none flex items-center space-x-3 ${
                                isSel 
                                  ? 'bg-amber-950/20 border-amber-500/40 text-amber-400 shadow-inner' 
                                  : 'bg-[#140f0b]/40 border-white/5 text-slate-400 hover:text-white hover:bg-[#140f0b]/80'
                              }`}
                            >
                              <Icon className={`w-4 h-4 shrink-0 ${isSel ? 'text-amber-400' : 'text-slate-400'}`} />
                              <span className="text-xs font-bold truncate">{a.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Resolution & FPS Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                      <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.labelResolution}</label>
                        <select
                          value={resolution}
                          onChange={(e) => setResolution(e.target.value as ResolutionMode)}
                          className="w-full bg-[#100b08] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-amber-500"
                        >
                          <option value="native">{t.resNative}</option>
                          <option value="1080p">{t.res1080p}</option>
                          <option value="720p">{t.res720p}</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.labelFps}</label>
                        <select
                          value={fps}
                          onChange={(e) => setFps(Number(e.target.value) as FpsMode)}
                          className="w-full bg-[#100b08] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-amber-500"
                        >
                          <option value={60}>60 FPS (Ultra Smooth)</option>
                          <option value={30}>30 FPS (Standard)</option>
                          <option value={15}>15 FPS (Eco / Slideshow)</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* COUNTDOWN state: huge number countdown */}
                {status === 'countdown' && (
                  <motion.div
                    key="countdown"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="glass-card rounded-3xl p-16 flex flex-col items-center justify-center min-h-[400px] space-y-6 relative overflow-hidden"
                  >
                    <div className="absolute w-64 h-64 border-4 border-dashed border-amber-500/20 rounded-full animate-spin" style={{ animationDuration: '8s' }} />
                    <div className="absolute w-48 h-48 border-2 border-amber-500/10 rounded-full animate-reverse-spin" style={{ animationDuration: '6s' }} />
                    
                    <span className="text-slate-500 text-xs font-black tracking-widest uppercase relative z-10">
                      {t.statusCountdown}
                    </span>
                    <span className="text-8xl font-black text-amber-400 animate-pulse relative z-10">
                      {countdown}
                    </span>
                  </motion.div>
                )}

                {/* RECORDING / PAUSED state: visual capture room */}
                {(status === 'recording' || status === 'paused') && (
                  <motion.div
                    key="recording-panel"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="glass-card rounded-3xl p-6 md:p-8 space-y-6 text-left relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <div className="flex items-center space-x-3">
                        <span className={`w-3 h-3 rounded-full bg-red-500 ${status === 'recording' ? 'animate-ping' : ''}`} />
                        <span className="text-xs font-black tracking-widest uppercase text-slate-300">
                          {status === 'recording' ? t.statusRecording : t.statusPaused}
                        </span>
                      </div>
                      
                      {/* Timer Display */}
                      <div className="flex items-center space-x-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 font-mono text-sm text-amber-400 font-bold">
                        <Timer className="w-3.5 h-3.5" />
                        <span>{formatTime(recordingTime)}</span>
                      </div>
                    </div>

                    {/* Live Preview box */}
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 flex items-center justify-center">
                      
                      {/* Live camera stream view */}
                      {recordMode === 'camera' ? (
                        <video
                          ref={localCamVideoRef}
                          autoPlay
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        // Screen share dashboard (avoiding infinite mirror loop in browser preview)
                        <div className="flex flex-col items-center justify-center text-center p-8 space-y-6 select-none max-w-md">
                          <div className="relative">
                            <div className="absolute inset-0 bg-amber-500/10 blur-xl rounded-full scale-125"></div>
                            <div className="w-20 h-20 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-center text-amber-400 relative z-10 shadow-lg shadow-black/40">
                              <Monitor className="w-10 h-10 animate-float" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-lg font-bold text-white tracking-tight">Recording Screen Share</h3>
                            <p className="text-slate-500 text-xs leading-relaxed font-medium">
                              Minimize this tab or window to start presenting. Your screen is being captured locally in the background!
                            </p>
                          </div>
                          
                          {/* Floating local webcam window preview inside the dash */}
                          {recordMode === 'both' && (
                            <div className="w-32 h-24 rounded-lg overflow-hidden border border-amber-500/50 shadow-lg bg-slate-950 relative">
                              <video
                                ref={localCamVideoRef}
                                autoPlay
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute bottom-1 right-1 bg-black/70 px-1 py-0.5 rounded text-[8px] font-bold text-amber-400">Webcam</div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Pause overlay watermark */}
                      {status === 'paused' && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                          <div className="bg-[#100b08] border border-amber-500/30 rounded-2xl p-4 flex items-center space-x-3 text-amber-400 font-black uppercase text-sm tracking-wider shadow-2xl">
                            <Pause className="w-5 h-5 shrink-0" />
                            <span>{t.statusPaused}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Voice audio visualizer waves (bouncing real-time) */}
                    {audioSource !== 'none' && (
                      <div className="bg-[#100b08]/80 border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center space-x-2 text-xs font-bold text-slate-400">
                          <Mic className="w-4 h-4 text-amber-400" />
                          <span>Voice input detection:</span>
                        </div>
                        <div className="flex items-end space-x-1 h-6 pr-4">
                          {audioLevels.map((lvl, i) => (
                            <div 
                              key={i} 
                              style={{ height: `${status === 'recording' ? lvl : 5}%` }} 
                              className="w-1 bg-amber-400 rounded-full transition-all duration-75"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Operational controls during recording */}
                    <div className="flex items-center justify-center space-x-4 pt-2">
                      {status === 'recording' ? (
                        <button
                          onClick={pauseRecording}
                          className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-xl flex items-center space-x-2 border border-white/10 transition-all cursor-pointer outline-none"
                        >
                          <Pause className="w-4 h-4" />
                          <span>{t.pauseBtn}</span>
                        </button>
                      ) : (
                        <button
                          onClick={resumeRecording}
                          className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl flex items-center space-x-2 transition-all cursor-pointer outline-none"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>{t.resumeBtn}</span>
                        </button>
                      )}

                      <button
                        onClick={stopRecording}
                        className="px-8 py-3 bg-red-650 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-xl flex items-center space-x-2 transition-all shadow-[0_0_20px_rgba(220,38,38,0.25)] hover:scale-105 active:scale-95 cursor-pointer outline-none"
                      >
                        <span className="w-3.5 h-3.5 bg-white rounded-xs shrink-0" />
                        <span>{t.stopBtn}</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* PROCESSING state: video assembler compilation */}
                {status === 'processing' && (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass-card rounded-3xl p-16 flex flex-col items-center justify-center min-h-[400px] space-y-6"
                  >
                    <svg className="animate-spin h-10 w-10 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm font-bold text-white tracking-wide">{t.statusProcessing}</span>
                  </motion.div>
                )}

                {/* DONE state: show player + download triggers */}
                {status === 'done' && recordedBlobUrl && (
                  <motion.div
                    key="done-panel"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="glass-card rounded-3xl p-6 md:p-8 space-y-6 text-left relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <span className="text-xs font-black tracking-widest uppercase text-green-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t.statusDone}</span>
                      </span>
                      
                      <button
                        onClick={resetApp}
                        className="text-xs text-amber-400 hover:text-amber-300 font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer outline-none"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{t.resetBtn}</span>
                      </button>
                    </div>

                    {/* Review Video Player */}
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-inner">
                      <video
                        src={recordedBlobUrl}
                        controls
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                      <button
                        onClick={downloadVideo}
                        className="w-full sm:flex-1 py-4 bg-amber-500 hover:bg-amber-450 text-black font-black text-sm rounded-2xl flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_0_35px_rgba(245,158,11,0.45)] select-none outline-none"
                      >
                        <Download className="w-5 h-5 stroke-[2.5]" />
                        <span>{t.downloadBtn}</span>
                      </button>

                      <button
                        onClick={resetApp}
                        className="w-full sm:w-auto py-4 px-8 border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-sm rounded-2xl transition-all active:scale-95 cursor-pointer select-none outline-none"
                      >
                        {t.resetBtn}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ERROR state */}
                {status === 'error' && (
                  <motion.div
                    key="error-panel"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass-card rounded-3xl p-8 md:p-12 space-y-6 text-center max-w-lg mx-auto"
                  >
                    <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto">
                      <AlertCircle className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white tracking-tight">{t.statusError}</h3>
                      <p className="text-slate-400 text-xs leading-relaxed font-medium">
                        {errorMessage || t.permissionMessage}
                      </p>
                    </div>

                    <div className="pt-4 flex items-center justify-center space-x-4">
                      <button
                        onClick={resetApp}
                        className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95 cursor-pointer outline-none"
                      >
                        Configure settings
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Start capture buttons for IDLE mode */}
              {status === 'idle' && (
                <div className="pt-4">
                  <button
                    onClick={startCountdown}
                    className="w-full py-5 bg-amber-500 hover:bg-amber-400 text-black font-black text-sm tracking-wide rounded-2xl flex items-center justify-center space-x-2.5 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-[0_0_30px_rgba(245,158,11,0.25)] hover:shadow-[0_0_35px_rgba(245,158,11,0.4)] select-none outline-none"
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-black shrink-0 animate-pulse" />
                    <span>{t.startBtn}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right Box: App Instructions / Features Summary */}
            <div className="lg:col-span-4 space-y-6 text-left">
              <div className="glass-card rounded-3xl p-6 md:p-8 space-y-6">
                <h3 className="text-lg font-black text-white tracking-tight flex items-center space-x-2">
                  <Settings className="w-4 h-4 text-amber-400" />
                  <span>How it works</span>
                </h3>

                <ul className="space-y-4 text-xs font-medium text-slate-400 leading-relaxed list-decimal pl-4">
                  <li>Choose your preferred capture target (screen, webcam, or a combination overlay).</li>
                  <li>Configure sound sharing (microphone input or device audio channels).</li>
                  <li>Click <strong>{t.startBtn}</strong> and choose which screen, tab, or window to record when requested.</li>
                  <li>Perform your tasks. You can pause or resume recording at any time.</li>
                  <li>Click <strong>{t.stopBtn}</strong> to compile the WebM video, review it, and download it instantly.</li>
                </ul>

                <div className="border-t border-white/5 pt-4 flex items-center space-x-2 text-[10px] text-slate-500 font-bold">
                  <Lock className="w-3.5 h-3.5 text-amber-500/70" />
                  <span>{t.seoPrivacyText.slice(0, 50)}...</span>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Features Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16">
            {featuresList.map((feature: any, idx: number) => (
              <div 
                key={idx}
                className="glass-card p-8 rounded-3xl text-left hover:-translate-y-1 transition-all duration-300 glow-amber border border-white/5 relative overflow-hidden"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6">
                  {idx === 0 && <Lock className="w-6 h-6" />}
                  {idx === 1 && <Video className="w-6 h-6" />}
                  {idx === 2 && <Sparkles className="w-6 h-6" />}
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed font-medium">{feature.text}</p>
              </div>
            ))}
          </div>

          {/* FAQ Accordion Section */}
          {faqs.length > 0 && (
            <div className="space-y-12 max-w-4xl mx-auto pt-16 text-left">
              <h2 className="text-3xl font-black text-white tracking-tight border-b border-white/5 pb-4 flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-amber-400 animate-float" />
                <span>{t.faqTitle}</span>
              </h2>
              
              <div className="space-y-6">
                {faqs.map((faqItem: any, idx: number) => {
                  const isAct = activeFaqIdx === idx;
                  return (
                    <div 
                      key={idx} 
                      className="glass-card rounded-2xl p-6 md:p-8 space-y-3 cursor-pointer select-none"
                      onClick={() => setActiveFaqIdx(isAct ? null : idx)}
                    >
                      <h4 className="text-lg font-bold text-white tracking-tight flex items-center justify-between gap-3">
                        <span className="flex items-start gap-3">
                          <span className="text-amber-400 font-black">Q:</span>
                          <span>{faqItem.question}</span>
                        </span>
                        <span className="text-amber-400 font-bold text-sm shrink-0">
                          {isAct ? 'Ã¢Ë†â€™' : '+'}
                        </span>
                      </h4>
                      <AnimatePresence>
                        {isAct && (
                          <motion.p 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="text-slate-400 text-sm leading-relaxed font-medium pl-6 pt-2 overflow-hidden"
                          >
                            {faqItem.answer}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search Engine Optimization block */}
          <div className="border-t border-white/5 pt-16 text-left max-w-4xl mx-auto space-y-12">
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-white tracking-tight uppercase tracking-wider">{t.seoHeroTitle}</h2>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">{t.seoHeroText}</p>
              <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {Array.isArray(t.seoHeroList) && t.seoHeroList.map((liText: string, i: number) => (
                  <li key={i} className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span>{liText}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white tracking-tight">{t.seoBrowserSpeedTitle}</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">{t.seoBrowserSpeedText}</p>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white tracking-tight">{t.seoUseCaseTitle}</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">{t.seoUseCaseText}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white tracking-tight">{t.seoPrivacyTitle}</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">{t.seoPrivacyText}</p>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white tracking-tight">{t.seoSecondaryTitle}</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">{t.description}</p>
              </div>
            </div>

            {keywords.length > 0 && (
              <div className="border-t border-white/5 pt-8 space-y-3">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">{t.seoKeywordsTitle}</h4>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((kw: string, i: number) => (
                    <span 
                      key={i} 
                      className="text-[10px] font-bold bg-[#140f0b] text-amber-400 px-3 py-1.5 rounded-full border border-amber-900/30 uppercase tracking-wider"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      {/* Bloque AdSense Horizontal */}
      <AdBanner id="adsense-recordsnap-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={setActiveModal} />

      <LegalModal 
        isOpen={activeModal !== null} 
        onClose={() => setActiveModal(null)} 
        title={
          activeModal === 'privacy' ? t.privacyPolicy :
          activeModal === 'terms' ? t.termsOfService :
          t.cookiePolicy
        }
        content={
          activeModal === 'privacy' ? t.privacyContent :
          activeModal === 'terms' ? t.termsContent :
          t.cookiesContent
        }
        t={t}
      />

      {/* Floating Scroll to Top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-[200] w-12 h-12 bg-amber-500 hover:bg-amber-400 text-black rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all active:scale-95 cursor-pointer outline-none"
          >
            <ArrowUp className="w-5 h-5 stroke-[2.5]" />
          </motion.button>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Recordsnap;
