import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Play, Pause, Download, History, Sparkles, Trash2, Music, Scissors, Volume2, RefreshCw } from 'lucide-react';
import { useTranslation, Language } from '../../locales/dictionary';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { legalTranslations } from '../../locales/legal';

interface AudioSnapProps {
  lang: string;
  dictionary: any;
}

interface AudioHistoryItem {
  id: string;
  name: string;
  url: string;
  size: string;
  date: string;
  duration: string;
}

export const AudioSnap: React.FC<AudioSnapProps> = ({ lang, dictionary }) => {
  const { t } = useTranslation(lang as Language, 'audiosnap');

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [originalBlob, setOriginalBlob] = useState<Blob | null>(null);
  const [mimeType, setMimeType] = useState<string>('audio/webm');
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [history, setHistory] = useState<AudioHistoryItem[]>([]);
  
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'privacy' | 'terms' | 'cookies'>('privacy');

  // Refs for Web Audio API & MediaRecorder
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const elapsedRef = useRef<number>(0);
  const startTimestampRef = useRef<number>(0);

  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Set up audio URL for the trimmer audio tag
  useEffect(() => {
    if (originalBlob) {
      const url = URL.createObjectURL(originalBlob);
      setAudioUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setAudioUrl(null);
    }
  }, [originalBlob]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopVisualizer();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Determine media support
  const getSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/aac'
    ];
    for (const t of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return '';
  };

  // Live Canvas Visualizer Loop
  const draw = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i] / 1.5;

      // Dynamic rose gradient visualizer
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
      gradient.addColorStop(0, '#f43f5e'); // rose-500
      gradient.addColorStop(1, '#fda4af'); // rose-300

      ctx.fillStyle = gradient;
      ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

      x += barWidth;
    }

    animationFrameRef.current = requestAnimationFrame(draw);
  };

  const startVisualizer = (stream: MediaStream) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;
      
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64; 
      source.connect(analyser);
      analyserRef.current = analyser;
      
      draw();
    } catch (e) {
      console.error('Failed to initialize AudioContext visualizer:', e);
    }
  };

  const stopVisualizer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  // Begin Capturing Audio
  const startRecording = async () => {
    audioChunksRef.current = [];
    setAudioBuffer(null);
    setPeaks([]);
    setOriginalBlob(null);
    setRecordingTime(0);
    elapsedRef.current = 0;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mime = getSupportedMimeType();
      const options = mime ? { mimeType: mime } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const recordedBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        setOriginalBlob(recordedBlob);
        setMimeType(mediaRecorder.mimeType || 'audio/webm');

        setIsProcessing(true);
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const decodeCtx = new AudioContextClass();
          const arrayBuf = await recordedBlob.arrayBuffer();
          const decodedBuffer = await decodeCtx.decodeAudioData(arrayBuf);
          await decodeCtx.close();

          setAudioBuffer(decodedBuffer);
          const duration = decodedBuffer.duration;
          setAudioDuration(duration);
          setStartTime(0);
          setEndTime(duration);
          
          const extractedPeaks = getPeaks(decodedBuffer, 100);
          setPeaks(extractedPeaks);
        } catch (err) {
          console.error("Decoding recording failed:", err);
          alert("Could not decode audio recording client-side.");
        } finally {
          setIsProcessing(false);
        }
      };

      // Start recording
      mediaRecorder.start(100);
      startTimestampRef.current = Date.now();
      setIsRecording(true);
      setIsPaused(false);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(elapsedRef.current + (Date.now() - startTimestampRef.current) / 1000);
      }, 100);

      startVisualizer(stream);
    } catch (err) {
      console.error('Microphone capture error:', err);
      alert(t.error_mic || 'Microphone access denied or not available.');
    }
  };

  // Pause Mic Capture
  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      elapsedRef.current += (Date.now() - startTimestampRef.current) / 1000;
      setIsPaused(true);
      
      // Stop rendering visualizer bars
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  };

  // Resume Mic Capture
  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      startTimestampRef.current = Date.now();
      setIsPaused(false);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(elapsedRef.current + (Date.now() - startTimestampRef.current) / 1000);
      }, 100);

      draw();
    }
  };

  // Terminate Mic Capture
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      stopVisualizer();

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  // Get Normalised Audio peaks
  const getPeaks = (buffer: AudioBuffer, numPeaks = 100) => {
    const channelData = buffer.getChannelData(0);
    const step = Math.floor(channelData.length / numPeaks);
    const result: number[] = [];
    
    for (let i = 0; i < numPeaks; i++) {
      let max = 0;
      const start = i * step;
      const end = Math.min(start + step, channelData.length);
      for (let j = start; j < end; j++) {
        const val = Math.abs(channelData[j]);
        if (val > max) max = val;
      }
      result.push(max);
    }

    // Normalise peaks between 0.1 and 1.0 for better render density
    const maxPeak = Math.max(...result);
    if (maxPeak > 0) {
      return result.map(p => p / maxPeak);
    }
    return result;
  };

  // Trimmer playback handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      setPlaybackProgress(current);
      if (current >= endTime) {
        audioRef.current.pause();
        audioRef.current.currentTime = startTime;
        setIsPlaying(false);
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.currentTime = startTime;
    }
  };

  const playTrimmed = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        if (audioRef.current.currentTime < startTime || audioRef.current.currentTime >= endTime) {
          audioRef.current.currentTime = startTime;
        }
        audioRef.current.play().catch(e => console.error("Trimmer audio play failed:", e));
        setIsPlaying(true);
      }
    }
  };

  const stopTrimmed = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = startTime;
      setIsPlaying(false);
      setPlaybackProgress(startTime);
    }
  };

  // Exporter Functions
  const exportWAV = () => {
    if (!audioBuffer) return;

    setIsProcessing(true);
    setTimeout(() => {
      try {
        const wavBlob = bufferToWav(audioBuffer, startTime, endTime);
        const url = URL.createObjectURL(wavBlob);
        const filename = `audiosnap-${Date.now()}.wav`;

        // Trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Add to history
        const sizeInMB = (wavBlob.size / (1024 * 1024)).toFixed(2);
        const durationStr = `${(endTime - startTime).toFixed(1)}s`;
        const newItem: AudioHistoryItem = {
          id: Date.now().toString(),
          name: filename,
          url: url,
          size: `${sizeInMB} MB`,
          date: new Date().toLocaleDateString(),
          duration: durationStr
        };
        setHistory(prev => [newItem, ...prev]);
      } catch (err) {
        console.error("WAV Export error:", err);
        alert("Failed to export WAV.");
      } finally {
        setIsProcessing(false);
      }
    }, 100);
  };

  const downloadNative = () => {
    if (!originalBlob) return;
    
    const extension = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm';
    const filename = `audiosnap-recording-${Date.now()}.${extension}`;
    const url = URL.createObjectURL(originalBlob);

    // Trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Add to history
    const sizeInMB = (originalBlob.size / (1024 * 1024)).toFixed(2);
    const durationStr = `${audioDuration.toFixed(1)}s`;
    const newItem: AudioHistoryItem = {
      id: Date.now().toString(),
      name: filename,
      url: url,
      size: `${sizeInMB} MB`,
      date: new Date().toLocaleDateString(),
      duration: durationStr
    };
    setHistory(prev => [newItem, ...prev]);
  };

  // Custom 44-byte WAV PCM header writer
  const bufferToWav = (buffer: AudioBuffer, startOffset: number, endOffset: number) => {
    const sampleRate = buffer.sampleRate;
    const numChannels = buffer.numberOfChannels;
    
    const startSample = Math.floor(startOffset * sampleRate);
    const endSample = Math.min(buffer.length, Math.floor(endOffset * sampleRate));
    const numSamples = Math.max(0, endSample - startSample);
    
    const blockAlign = numChannels * 2;
    const byteRate = sampleRate * blockAlign;
    const dataSize = numSamples * blockAlign;
    const bufferLength = 44 + dataSize;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    // RIFF identifier
    writeString(view, 0, 'RIFF');
    // file length
    view.setUint32(4, 36 + dataSize, true);
    // RIFF type
    writeString(view, 8, 'WAVE');
    // format chunk identifier
    writeString(view, 12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (PCM = 1)
    view.setUint16(20, 1, true);
    // channel count
    view.setUint16(22, numChannels, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate
    view.setUint32(28, byteRate, true);
    // block align
    view.setUint16(32, blockAlign, true);
    // bits per sample
    view.setUint16(34, 16, true);
    // data chunk identifier
    writeString(view, 36, 'data');
    // data chunk length
    view.setUint32(40, dataSize, true);

    // Write audio samples
    let offset = 44;
    const channels = [];
    for (let c = 0; c < numChannels; c++) {
      channels.push(buffer.getChannelData(c));
    }

    for (let i = startSample; i < endSample; i++) {
      for (let c = 0; c < numChannels; c++) {
        let sample = channels[c][i];
        if (sample > 1) sample = 1;
        else if (sample < -1) sample = -1;
        
        // Convert to 16-bit PCM sample
        const pcmSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, pcmSample, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const tenths = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${tenths}`;
  };

  const resetAll = () => {
    stopRecording();
    stopTrimmed();
    setAudioBuffer(null);
    setPeaks([]);
    setOriginalBlob(null);
    setRecordingTime(0);
    setAudioDuration(0);
    setStartTime(0);
    setEndTime(0);
  };

  return (
    <div className="min-h-screen bg-[#060405] text-slate-200 font-sans flex flex-col">
      <Header
        currentLang={lang}
        onLanguageChange={(newLang) => {
          window.location.href = `/${newLang.toLowerCase()}/audiosnap`;
        }}
        onReset={resetAll}
        t={t}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-12 pt-36 pb-24 relative z-10 flex flex-col justify-center">
        {/* SEO Header Title */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-4xl md:text-6xl font-black font-outfit tracking-tight text-white mb-4">
            {t.seoHeroTitle || 'Record, Trim and Export Audio 100% Locally'}
          </h1>
          <p className="text-slate-400 text-lg max-w-3xl mx-auto leading-relaxed font-medium">
            {t.seoHeroText || 'High-fidelity mic recording and precise waveform trimming with absolute privacy.'}
          </p>
        </div>

        {/* Core Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto w-full">
          
          {/* Left Column: Recording Visualiser or Trimming Workspace */}
          <div className="lg:col-span-7 bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
            
            {/* 1. Mic Inactive & No Recording Zone */}
            {!isRecording && !audioBuffer && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <button
                  onClick={startRecording}
                  className="w-24 h-24 rounded-full bg-rose-500 hover:bg-rose-600 text-black flex items-center justify-center hover:scale-105 active:scale-95 duration-300 shadow-xl shadow-rose-500/20 group cursor-pointer border-none outline-none mb-6 animate-pulse"
                >
                  <Mic className="w-10 h-10 group-hover:rotate-6 transition-transform" />
                </button>
                <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">
                  {t.btn_record || 'Record Audio'}
                </h3>
                <p className="text-sm text-slate-500 max-w-sm font-medium">
                  {t.description || 'Record voice memos or capture microphone clips. Operations are fully client-side.'}
                </p>
              </div>
            )}

            {/* 2. Recording Active Screen */}
            {isRecording && (
              <div className="flex flex-col gap-6">
                {/* Visualiser Canvas */}
                <div className="relative h-36 bg-black/40 border border-white/10 rounded-2xl overflow-hidden flex items-end">
                  <canvas
                    ref={(el) => {
                      canvasRef.current = el;
                      if (el && isRecording && !isPaused && !animationFrameRef.current) {
                        draw();
                      }
                    }}
                    width={400}
                    height={150}
                    className="w-full h-full"
                  />
                  
                  {/* Glowing Recording States */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/50 border border-white/10 rounded-full">
                    <span className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-rose-500 animate-ping'}`} />
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                      {isPaused ? (t.label_paused || 'Paused') : (t.label_recording || 'Recording')}
                    </span>
                  </div>

                  {/* Stopwatch */}
                  <div className="absolute top-4 right-4 text-rose-400 font-mono font-bold text-lg tracking-widest bg-black/50 border border-white/10 px-3 py-1 rounded-xl">
                    {formatTime(recordingTime)}
                  </div>
                </div>

                {/* Recorder controls */}
                <div className="grid grid-cols-2 gap-4">
                  {isPaused ? (
                    <button
                      onClick={resumeRecording}
                      className="py-4 bg-rose-500 hover:bg-rose-600 text-black font-black text-sm uppercase rounded-2xl transition-all cursor-pointer border-none outline-none"
                    >
                      {t.btn_record || 'Resume'}
                    </button>
                  ) : (
                    <button
                      onClick={pauseRecording}
                      className="py-4 bg-white/10 hover:bg-white/20 text-white font-black text-sm uppercase rounded-2xl transition-all cursor-pointer border-none outline-none"
                    >
                      {t.btn_pause_record || 'Pause'}
                    </button>
                  )}

                  <button
                    onClick={stopRecording}
                    className="py-4 bg-rose-500 hover:bg-rose-600 text-black font-black text-sm uppercase rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 border-none outline-none shadow-lg shadow-rose-500/25"
                  >
                    <Square className="w-4 h-4" />
                    <span>{t.btn_stop_record || 'Stop'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. Waveform Trimming Screen */}
            {audioBuffer && !isRecording && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                    <Scissors className="w-4 h-4 text-rose-500" />
                    {t.label_trim || 'Waveform Trimmer'}
                  </h3>
                  <button
                    onClick={resetAll}
                    className="text-xs font-bold text-rose-400 hover:text-rose-300 border-none bg-transparent cursor-pointer outline-none uppercase tracking-wider"
                  >
                    {t.btn_record ? `← ${t.btn_record} Nueva` : '← Record New'}
                  </button>
                </div>

                {/* Waveform renderer */}
                <div className="relative">
                  {/* Waveform peaks */}
                  <div className="relative w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 flex items-end gap-[3px] overflow-hidden">
                    {peaks.map((peak, index) => {
                      const percentage = (index / peaks.length) * 100;
                      const startPercentage = (startTime / audioDuration) * 100;
                      const endPercentage = (endTime / audioDuration) * 100;
                      const inTrimRange = percentage >= startPercentage && percentage <= endPercentage;

                      // Map normalised peaks heights
                      const heightPercent = Math.max(8, Math.round(peak * 100));

                      return (
                        <div
                          key={index}
                          className={`flex-1 rounded-full transition-all duration-300 ${
                            inTrimRange 
                              ? 'bg-rose-500' 
                              : 'bg-white/10'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      );
                    })}
                    
                    {/* Playhead pointer */}
                    {isPlaying && (
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,1)] pointer-events-none transition-all duration-100"
                        style={{ left: `${(playbackProgress / audioDuration) * 100}%` }}
                      />
                    )}
                  </div>
                </div>

                {/* Slider ranges */}
                <div className="flex flex-col gap-4 border-t border-white/5 pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide flex justify-between">
                        <span>{t.label_start || 'Start Offset'}</span>
                        <span className="text-rose-400 font-mono">{startTime.toFixed(2)}s</span>
                      </span>
                      <input
                        type="range"
                        min="0"
                        max={audioDuration}
                        step="0.01"
                        value={startTime}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setStartTime(Math.min(val, endTime - 0.1));
                          if (audioRef.current) {
                            audioRef.current.currentTime = val;
                          }
                        }}
                        className="w-full accent-rose-500 cursor-pointer"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide flex justify-between">
                        <span>{t.label_end || 'End Offset'}</span>
                        <span className="text-rose-400 font-mono">{endTime.toFixed(2)}s</span>
                      </span>
                      <input
                        type="range"
                        min="0"
                        max={audioDuration}
                        step="0.01"
                        value={endTime}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setEndTime(Math.max(val, startTime + 0.1));
                          if (audioRef.current) {
                            audioRef.current.currentTime = startTime;
                          }
                        }}
                        className="w-full accent-rose-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="text-[10px] text-rose-400 font-bold uppercase tracking-wider flex justify-between items-center">
                    <span>{t.label_duration || 'Duration'}: {(endTime - startTime).toFixed(2)}s</span>
                    <span className="text-slate-500">Total: {audioDuration.toFixed(2)}s</span>
                  </div>
                </div>

                {/* Trimmer player controls */}
                <div className="flex items-center gap-4 bg-black/20 p-4 border border-white/5 rounded-2xl">
                  <button
                    onClick={playTrimmed}
                    className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center cursor-pointer border-none outline-none transition-colors"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 text-rose-400" />}
                  </button>
                  <button
                    onClick={stopTrimmed}
                    className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center cursor-pointer border-none outline-none transition-colors"
                  >
                    <Square className="w-5 h-5" />
                  </button>
                  <div className="flex-1 text-xs font-mono text-slate-400 text-right">
                    {formatTime(playbackProgress)} / {formatTime(audioDuration)}
                  </div>
                </div>

                {/* Trimmer elements hidden audio tag */}
                {audioUrl && (
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleEnded}
                    className="hidden"
                  />
                )}

              </div>
            )}

          </div>

          {/* Right Column: Downloads, processing spinner & local session history */}
          <div className="lg:col-span-5 flex flex-col gap-8 w-full">
            
            {/* 1. Download & Export Card */}
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md flex flex-col gap-6 relative overflow-hidden">
              <div className="flex flex-col items-center gap-4">
                <div className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-rose-500" />
                  Audio Exporter
                </div>

                {!isProcessing && !audioBuffer && (
                  <div className="text-slate-500 text-sm font-medium py-6 text-center">
                    Record voice on the left to activate WAV and compressed download outputs.
                  </div>
                )}

                {/* Processing Spinner */}
                {isProcessing && (
                  <div className="w-full flex flex-col items-center gap-4 py-8">
                    <RefreshCw className="w-8 h-8 text-rose-400 animate-spin" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Processing Audio Buffer...
                    </span>
                  </div>
                )}

                {/* Download Buttons */}
                {audioBuffer && !isProcessing && (
                  <div className="w-full flex flex-col gap-4">
                    {/* Lossless WAV */}
                    <button
                      onClick={exportWAV}
                      className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-black text-sm uppercase rounded-2xl transition-all cursor-pointer active:scale-95 duration-200 border-none outline-none shadow-lg shadow-rose-500/20"
                    >
                      <Download className="w-5 h-5" />
                      <span>{t.btn_download_wav || 'Download WAV (Lossless)'}</span>
                    </button>

                    {/* Compressed Original */}
                    {originalBlob && (
                      <button
                        onClick={downloadNative}
                        className="w-full flex items-center justify-center gap-3 py-3 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white font-black text-xs uppercase rounded-2xl transition-all cursor-pointer border border-white/5 outline-none"
                      >
                        <Volume2 className="w-4 h-4 text-rose-400" />
                        <span>{t.btn_download_native || 'Download Compressed'}</span>
                      </button>
                    )}

                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-center mt-2 leading-relaxed">
                      * WAV encodes the selected trim segment client-side. Compressed saves the original full audio in its native format.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Session History Card */}
            {history.length > 0 && (
              <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-md flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-rose-500" />
                    {t.history_title || 'Recent History'}
                  </div>
                  <button
                    onClick={() => setHistory([])}
                    className="text-xs font-bold text-red-400 hover:text-red-300 border-none bg-transparent cursor-pointer outline-none flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.clear_history || 'Clear'}</span>
                  </button>
                </div>

                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 bg-white/[0.01] border border-white/5 rounded-xl text-left"
                    >
                      <div className="w-10 h-10 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center shrink-0">
                        <Music className="w-5 h-5 text-rose-400" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="text-slate-300 text-sm font-medium truncate">
                          {item.name}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                          <span className="text-rose-400 font-mono">
                            {item.size} ({item.duration})
                          </span>
                          <span>{item.date}</span>
                        </div>
                      </div>

                      <a
                        href={item.url}
                        download={item.name}
                        className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* SEO Text Sections */}
        <div className="max-w-5xl mx-auto w-full mt-24 border-t border-white/5 pt-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-3">
                {t.seoBrowserSpeedTitle || 'Client-Side Sandbox'}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {t.seoBrowserSpeedText || 'PCM sample channel mapping and WAV generation occurs on the fly inside browser RAM.'}
              </p>
            </div>
            
            <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-3">
                {t.seoUseCaseTitle || 'Podcasts, Memos & Voicework'}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {t.seoUseCaseText || 'Cut high fidelity snippets without bulky downloads. Perfect for sound designers, content producers or voice notes.'}
              </p>
            </div>

            <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-3">
                {t.seoPrivacyTitle || '100% Secure & Local'}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {t.seoPrivacyText || 'We do not host or capture any voice signals. Microphone inputs are strictly local and process within memory.'}
              </p>
            </div>
          </div>
        </div>

      </main>

      <Footer
        lang={lang}
        t={t}
        onOpenModal={(type) => {
          setModalType(type);
          setModalOpen(true);
        }}
      />

      <LegalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          modalType === 'privacy' 
            ? (legalTranslations[lang]?.privacy.title || 'Privacy Policy')
            : modalType === 'terms'
            ? (legalTranslations[lang]?.terms.title || 'Terms of Service')
            : (legalTranslations[lang]?.cookies.title || 'Cookie Policy')
        }
        content={
          modalType === 'privacy'
            ? (legalTranslations[lang]?.privacy.content || '')
            : modalType === 'terms'
            ? (legalTranslations[lang]?.terms.content || '')
            : (legalTranslations[lang]?.cookies.content || '')
        }
        t={t}
      />
    </div>
  );
};

export default AudioSnap;
