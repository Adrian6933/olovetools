import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  Download,
  FileAudio,
  Gauge,
  History,
  Keyboard,
  Loader2,
  Mic,
  Pause,
  Play,
  Redo2,
  Repeat,
  RotateCcw,
  Scissors,
  Settings2,
  Sliders,
  Square,
  Trash2,
  Undo2,
  Upload,
  Wand2,
  X,
} from 'lucide-react';

import { createTranslator } from '../../locales/meta';
import { AdBanner } from '../../components/shared/AdBanner';
import { useReducedMotion, fadeInUp } from '../../components/shared/motion';
import { useHandoffIntake } from '../../lib/useHandoff';
import { createTicker, type Ticker } from '../../lib/ticker';
import { legalTranslations } from '../../locales/legal';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { NextStepBar } from './components/NextStepBar';
import { Waveform } from './components/Waveform';
import {
  IconCapture,
  IconExport,
  IconLocalAudio,
  IconMeter,
  IconNonDestructive,
  IconTrim,
  StepCapture,
  StepExport,
  StepPolish,
  StepShape,
  StudioHeroArt,
  WaveIdleArt,
} from './components/Illustrations';
import {
  buildPeakMip,
  dbToGain,
  decodeAudioFile,
  decodeRecording,
  encodeCompressed,
  encodeWav,
  estimateWavBytes,
  findSpeechBounds,
  formatBytes,
  formatClock,
  formatDb,
  measure,
  pickCompressedType,
  renderEdit,
  renderedDuration,
} from './lib/audio';
import type { CaptureSettings, EditState, ExportItem, PeakMip, SourceInfo } from './types';

interface AudioSnapProps {
  lang: string;
  dictionary: any;
}

type Tab = 'record' | 'file';
type ExportFormat = 'wav16' | 'wav24' | 'wav32' | 'compressed';

const NEUTRAL_EDIT: EditState = {
  inSec: 0,
  outSec: 0,
  gainDb: 0,
  normalize: false,
  normalizeTargetDb: -1,
  fadeInSec: 0,
  fadeOutSec: 0,
  speed: 1,
  channelMode: 'source',
  sampleRate: 0,
  removeDc: false,
};

const DEFAULT_CAPTURE: CaptureSettings = {
  deviceId: '',
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  channelCount: 1,
  bitrate: 128000,
};

const MAX_HISTORY = 100;
/** Anything quieter than this counts as room tone for the auto-trim. */
const SILENCE_DB = -45;

const AudioCtx: typeof AudioContext =
  typeof window !== 'undefined' ? (window.AudioContext || (window as any).webkitAudioContext) : (undefined as any);

export const AudioSnap: React.FC<AudioSnapProps> = ({ lang, dictionary }) => {
  // Memoised because the translator is a fresh Proxy on every call, and a new
  // identity would re-create every callback that reads a label — including the
  // one behind the `devicechange` listener, which would then be torn down and
  // re-attached on each render.
  const t = useMemo(() => createTranslator(dictionary), [dictionary]);
  const prefersReduced = useReducedMotion();

  // --------------------------------------------------------------- chrome
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'privacy' | 'terms' | 'cookies'>('privacy');

  // --------------------------------------------------------------- source
  const [tab, setTab] = useState<Tab>('record');
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
  const [mip, setMip] = useState<PeakMip | null>(null);
  const [info, setInfo] = useState<SourceInfo | null>(null);
  const [originalBlob, setOriginalBlob] = useState<Blob | null>(null);
  const [originalName, setOriginalName] = useState('audiosnap');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // -------------------------------------------------------------- capture
  const [capture, setCapture] = useState<CaptureSettings>(DEFAULT_CAPTURE);
  const [devices, setDevices] = useState<{ deviceId: string; label: string }[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [inputLevel, setInputLevel] = useState(0);
  const [inputClipped, setInputClipped] = useState(false);

  // ----------------------------------------------------------------- edit
  const [edit, setEdit] = useState<EditState>(NEUTRAL_EDIT);
  /** Entries plus cursor in one object: two separate states would need one to be
   *  updated from inside the other's updater, which React runs twice in dev. */
  const [history, setHistory] = useState<{ entries: EditState[]; index: number }>({
    entries: [NEUTRAL_EDIT],
    index: 0,
  });
  const [view, setView] = useState({ from: 0, to: 0 });

  // ------------------------------------------------------------- playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(0);
  const [loop, setLoop] = useState(false);
  const [compare, setCompare] = useState(false);

  // --------------------------------------------------------------- export
  const [format, setFormat] = useState<ExportFormat>('wav16');
  const [bitrate, setBitrate] = useState(128000);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exports, setExports] = useState<ExportItem[]>([]);

  // ------------------------------------------------------------------ refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const meterCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const meterTickerRef = useRef<Ticker | null>(null);
  const timerTickerRef = useRef<Ticker | null>(null);
  const elapsedRef = useRef(0);
  const startedAtRef = useRef(0);

  const playCtxRef = useRef<AudioContext | null>(null);
  const playRef = useRef<{ source: AudioBufferSourceNode; gain: GainNode; startedAt: number; offset: number; speed: number } | null>(null);
  const playTickerRef = useRef<Ticker | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const exportsRef = useRef<ExportItem[]>([]);
  exportsRef.current = exports;

  const hasSource = !!buffer && !!mip;
  const selectionLength = Math.max(0, edit.outSec - edit.inSec);
  const outputLength = renderedDuration(edit);

  // =========================================================================
  // Measurements — recomputed only when the selection actually moves.
  // =========================================================================
  const sourceStats = useMemo(() => {
    if (!buffer || selectionLength <= 0) return null;
    return measure(buffer, edit.inSec, edit.outSec);
  }, [buffer, edit.inSec, edit.outSec, selectionLength]);

  /** Gain the render will apply, in dB, once the normaliser has had its say. */
  const appliedGainDb = useMemo(() => {
    let db = edit.gainDb;
    if (edit.normalize && sourceStats && Number.isFinite(sourceStats.peakDb)) {
      db += edit.normalizeTargetDb - sourceStats.peakDb;
    }
    return db;
  }, [edit.gainDb, edit.normalize, edit.normalizeTargetDb, sourceStats]);

  const outputPeakDb = sourceStats && Number.isFinite(sourceStats.peakDb) ? sourceStats.peakDb + appliedGainDb : -Infinity;

  const estimatedBytes = useMemo(() => {
    if (!buffer) return 0;
    if (format === 'compressed') return Math.round((outputLength * bitrate) / 8);
    const depth = format === 'wav16' ? 16 : format === 'wav24' ? 24 : 32;
    return estimateWavBytes(edit, buffer.numberOfChannels, buffer.sampleRate, depth);
  }, [buffer, edit, format, bitrate, outputLength]);

  // =========================================================================
  // Edit history — only the EditState object is stored, never the samples.
  // =========================================================================
  // These mirror the state, and every setter below writes them *eagerly* rather
  // than waiting for the next render. Two edits inside one tick (a shortcut that
  // moves the selection and flips a toggle, a redo followed by a click) would
  // otherwise both read the pre-render value and the first one would be lost.
  const editRef = useRef(edit);
  const historyRef = useRef(history);

  const setEditNow = useCallback((next: EditState) => {
    editRef.current = next;
    setEdit(next);
  }, []);

  const setHistoryNow = useCallback((next: { entries: EditState[]; index: number }) => {
    historyRef.current = next;
    setHistory(next);
  }, []);

  const commit = useCallback(
    (next: EditState) => {
      const prev = historyRef.current;
      const base = prev.entries.slice(0, prev.index + 1);
      const last = base[base.length - 1];
      if (last && JSON.stringify(last) === JSON.stringify(next)) return;
      const grown = [...base, next];
      const entries = grown.length > MAX_HISTORY ? grown.slice(grown.length - MAX_HISTORY) : grown;
      setHistoryNow({ entries, index: entries.length - 1 });
    },
    [setHistoryNow]
  );

  /** Applies a change and records it as one undo step. */
  const applyEdit = useCallback(
    (patch: Partial<EditState>) => {
      const next = { ...editRef.current, ...patch };
      setEditNow(next);
      commit(next);
    },
    [commit, setEditNow]
  );

  /** Live change with no history entry — paired with `commitLive` on release,
   *  so dragging a slider leaves one undo step and not two hundred. */
  const previewEdit = useCallback(
    (patch: Partial<EditState>) => {
      setEditNow({ ...editRef.current, ...patch });
    },
    [setEditNow]
  );

  const commitLive = useCallback(() => {
    commit(editRef.current);
  }, [commit]);

  const undo = useCallback(() => {
    const { entries, index } = historyRef.current;
    if (index <= 0) return;
    setHistoryNow({ entries, index: index - 1 });
    setEditNow(entries[index - 1]);
  }, [setEditNow, setHistoryNow]);

  const redo = useCallback(() => {
    const { entries, index } = historyRef.current;
    if (index >= entries.length - 1) return;
    setHistoryNow({ entries, index: index + 1 });
    setEditNow(entries[index + 1]);
  }, [setEditNow, setHistoryNow]);

  // =========================================================================
  // Playback
  // =========================================================================
  const stopPlayback = useCallback((resetHead = false) => {
    playTickerRef.current?.stop();
    playTickerRef.current = null;
    const current = playRef.current;
    if (current) {
      current.source.onended = null;
      try {
        current.source.stop();
      } catch {
        /* already stopped */
      }
      current.source.disconnect();
      current.gain.disconnect();
      playRef.current = null;
    }
    setIsPlaying(false);
    if (resetHead) setPlayhead(edit.inSec);
  }, [edit.inSec]);

  const startPlayback = useCallback(
    (fromSec: number, bypass: boolean) => {
      if (!buffer) return;
      stopPlayback();

      if (!playCtxRef.current || playCtxRef.current.state === 'closed') {
        playCtxRef.current = new AudioCtx();
      }
      const ctx = playCtxRef.current;
      ctx.resume().catch(() => {});

      const end = edit.outSec;
      const from = Math.min(Math.max(fromSec, edit.inSec), Math.max(edit.inSec, end - 0.02));
      if (end - from <= 0.01) return;

      const speed = bypass ? 1 : edit.speed;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = speed;

      const gain = ctx.createGain();
      const now = ctx.currentTime;

      if (bypass) {
        // The comparison has to be the untouched file, so no trim, no
        // normaliser, no fades — only then does A/B mean anything.
        gain.gain.setValueAtTime(1, now);
      } else {
        const linear = dbToGain(appliedGainDb);
        const total = (end - edit.inSec) / speed;
        const elapsed = (from - edit.inSec) / speed;
        const fadeIn = Math.min(edit.fadeInSec, total / 2);
        const fadeOut = Math.min(edit.fadeOutSec, total / 2);

        if (fadeIn > 0 && elapsed < fadeIn) {
          gain.gain.setValueAtTime(Math.max(0.0001, linear * (elapsed / fadeIn)), now);
          gain.gain.linearRampToValueAtTime(linear, now + (fadeIn - elapsed));
        } else {
          gain.gain.setValueAtTime(linear, now);
        }
        if (fadeOut > 0) {
          const fadeStart = Math.max(0, total - fadeOut - elapsed);
          gain.gain.setValueAtTime(linear, now + fadeStart);
          gain.gain.linearRampToValueAtTime(0.0001, now + Math.max(fadeStart + 0.01, total - elapsed));
        }
      }

      source.connect(gain);
      gain.connect(ctx.destination);
      source.start(0, from, end - from);

      playRef.current = { source, gain, startedAt: ctx.currentTime, offset: from, speed };
      setIsPlaying(true);

      source.onended = () => {
        if (playRef.current?.source !== source) return;
        playTickerRef.current?.stop();
        playTickerRef.current = null;
        playRef.current = null;
        setIsPlaying(false);
        setPlayhead(edit.inSec);
        if (loop) {
          // Re-entering through the same path keeps the fades correct on every pass.
          setTimeout(() => startPlayback(edit.inSec, bypass), 0);
        }
      };

      // A worker ticker, not rAF: the playhead has to keep moving when the tab
      // is in the background, which is exactly when people leave audio playing.
      playTickerRef.current = createTicker(40, () => {
        const active = playRef.current;
        if (!active) return;
        const position = active.offset + (ctx.currentTime - active.startedAt) * active.speed;
        setPlayhead(Math.min(end, position));
      });
    },
    [buffer, edit.inSec, edit.outSec, edit.speed, edit.fadeInSec, edit.fadeOutSec, appliedGainDb, loop, stopPlayback]
  );

  const togglePlay = useCallback(() => {
    if (isPlaying) stopPlayback();
    else startPlayback(playhead >= edit.outSec - 0.02 ? edit.inSec : playhead, compare);
  }, [isPlaying, stopPlayback, startPlayback, playhead, edit.inSec, edit.outSec, compare]);

  // Holding the compare key/button swaps the monitoring chain in place, without
  // losing the position you were listening to.
  useEffect(() => {
    if (!isPlaying) return;
    startPlayback(playhead, compare);
    // Deliberately keyed on `compare` alone: re-running on every playhead tick
    // would restart playback forty times a second.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compare]);

  // =========================================================================
  // Recording
  // =========================================================================
  const stopMeter = useCallback(() => {
    meterTickerRef.current?.stop();
    meterTickerRef.current = null;
    analyserRef.current = null;
    if (meterCtxRef.current) {
      meterCtxRef.current.close().catch(() => {});
      meterCtxRef.current = null;
    }
    setInputLevel(0);
  }, []);

  const startMeter = useCallback((stream: MediaStream) => {
    try {
      const ctx = new AudioCtx();
      meterCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      analyserRef.current = analyser;

      const samples = new Float32Array(analyser.fftSize);
      meterTickerRef.current = createTicker(60, () => {
        const node = analyserRef.current;
        if (!node) return;
        node.getFloatTimeDomainData(samples);
        let peak = 0;
        for (let i = 0; i < samples.length; i++) {
          const value = Math.abs(samples[i]);
          if (value > peak) peak = value;
        }
        setInputLevel(peak);
        if (peak >= 0.99) setInputClipped(true);
      });
    } catch {
      /* metering is a nicety; recording still works without it */
    }
  }, []);

  const refreshDevices = useCallback(async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      setDevices(
        list
          .filter(device => device.kind === 'audioinput')
          .map((device, index) => ({
            deviceId: device.deviceId,
            label: device.label || `${t.micDefault || 'Microphone'} ${index + 1}`,
          }))
      );
    } catch {
      /* enumeration needs permission on some browsers; the default mic still works */
    }
  }, [t]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) return;
    refreshDevices();
    navigator.mediaDevices.addEventListener?.('devicechange', refreshDevices);
    return () => navigator.mediaDevices.removeEventListener?.('devicechange', refreshDevices);
  }, [refreshDevices]);

  const loadDecoded = useCallback(
    (decoded: AudioBuffer, sourceInfo: SourceInfo, blob: Blob | null, name: string) => {
      const nextMip = buildPeakMip(decoded);
      setBuffer(decoded);
      setMip(nextMip);
      setInfo(sourceInfo);
      setOriginalBlob(blob);
      setOriginalName(name);

      // Nothing clever happens here on purpose: the clip loads untouched, the
      // whole thing selected, and every automatic helper stays behind a button.
      const fresh: EditState = { ...NEUTRAL_EDIT, inSec: 0, outSec: decoded.duration };
      setEditNow(fresh);
      setHistoryNow({ entries: [fresh], index: 0 });
      setView({ from: 0, to: decoded.duration });
      setPlayhead(0);
      setError(null);
    },
    [setEditNow, setHistoryNow]
  );

  const startRecording = useCallback(async () => {
    setError(null);
    setNotice(null);
    chunksRef.current = [];
    elapsedRef.current = 0;
    setRecordingTime(0);
    setInputClipped(false);

    try {
      const constraints: MediaTrackConstraints = {
        echoCancellation: capture.echoCancellation,
        noiseSuppression: capture.noiseSuppression,
        autoGainControl: capture.autoGainControl,
        channelCount: capture.channelCount,
      };
      if (capture.deviceId) constraints.deviceId = { exact: capture.deviceId };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: constraints });
      streamRef.current = stream;
      refreshDevices();

      const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
      const mime = types.find(type => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, {
        ...(mime ? { mimeType: mime } : {}),
        audioBitsPerSecond: capture.bitrate,
      });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = event => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        setLoading(true);
        try {
          const name = `audiosnap-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}`;
          const { buffer: decoded, info: decodedInfo } = await decodeRecording(blob, `${name}.webm`);
          loadDecoded(decoded, { ...decodedInfo, sizeBytes: blob.size }, blob, name);
        } catch {
          setError(t.errorDecode || 'That audio could not be decoded in this browser.');
        } finally {
          setLoading(false);
        }
      };

      recorder.start(200);
      startedAtRef.current = Date.now();
      setIsRecording(true);
      setIsPaused(false);
      startMeter(stream);

      timerTickerRef.current = createTicker(100, () => {
        setRecordingTime(elapsedRef.current + (Date.now() - startedAtRef.current) / 1000);
      });
    } catch {
      setError(t.error_mic || 'Microphone access denied or not available.');
    }
  }, [capture, loadDecoded, refreshDevices, startMeter, t]);

  const pauseRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || !isRecording || isPaused) return;
    recorder.pause();
    timerTickerRef.current?.stop();
    timerTickerRef.current = null;
    elapsedRef.current += (Date.now() - startedAtRef.current) / 1000;
    setIsPaused(true);
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || !isRecording || !isPaused) return;
    recorder.resume();
    startedAtRef.current = Date.now();
    setIsPaused(false);
    timerTickerRef.current = createTicker(100, () => {
      setRecordingTime(elapsedRef.current + (Date.now() - startedAtRef.current) / 1000);
    });
  }, [isRecording, isPaused]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || !isRecording) return;
    recorder.stop();
    setIsRecording(false);
    setIsPaused(false);
    timerTickerRef.current?.stop();
    timerTickerRef.current = null;
    stopMeter();
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  }, [isRecording, stopMeter]);

  // =========================================================================
  // File intake — the file waits, the decode happens on a click.
  // =========================================================================
  const acceptFile = useCallback((file: File) => {
    setError(null);
    setNotice(null);
    setPendingFile(file);
    setTab('file');
  }, []);

  // A clip handed over by another tool lands in the same queue as a dropped
  // file: parked, never decoded behind the user's back.
  useHandoffIntake(file => acceptFile(file));

  const loadPendingFile = useCallback(async () => {
    if (!pendingFile) return;
    setLoading(true);
    setError(null);
    try {
      const { buffer: decoded, info: decodedInfo } = await decodeAudioFile(pendingFile);
      if (decoded.duration < 0.05) throw new Error('too-short');
      const name = pendingFile.name.replace(/\.[^.]+$/, '') || 'audiosnap';
      loadDecoded(decoded, decodedInfo, pendingFile, name);
      setPendingFile(null);
    } catch {
      setError(t.errorDecode || 'That audio could not be decoded in this browser.');
    } finally {
      setLoading(false);
    }
  }, [pendingFile, loadDecoded, t]);

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) acceptFile(file);
  };

  // =========================================================================
  // Selection helpers
  // =========================================================================
  const setSelection = useCallback(
    (inSec: number, outSec: number) => {
      previewEdit({ inSec, outSec });
    },
    [previewEdit]
  );

  const zoomTo = useCallback(
    (from: number, to: number) => {
      if (!buffer) return;
      const minSpan = Math.max(0.01, buffer.duration / 5000);
      const span = Math.min(buffer.duration, Math.max(minSpan, to - from));
      const start = Math.min(Math.max(0, from), buffer.duration - span);
      setView({ from: start, to: start + span });
    },
    [buffer]
  );

  const zoomBy = useCallback(
    (factor: number) => {
      const centre = (view.from + view.to) / 2;
      const span = (view.to - view.from) * factor;
      zoomTo(centre - span / 2, centre + span / 2);
    },
    [view, zoomTo]
  );

  const autoTrim = useCallback(() => {
    if (!mip) return;
    const bounds = findSpeechBounds(mip, SILENCE_DB, 0.12);
    if (!bounds) {
      setNotice(t.autoTrimNone || 'No audible section stood out — the selection was left alone.');
      return;
    }
    applyEdit({ inSec: bounds.inSec, outSec: bounds.outSec });
    setNotice(
      (t.autoTrimDone || 'Trimmed to {d}s of audible sound.').replace('{d}', (bounds.outSec - bounds.inSec).toFixed(2))
    );
  }, [mip, applyEdit, t]);

  const resetProcessing = useCallback(() => {
    applyEdit({
      gainDb: 0,
      normalize: false,
      normalizeTargetDb: -1,
      fadeInSec: 0,
      fadeOutSec: 0,
      speed: 1,
      channelMode: 'source',
      sampleRate: 0,
      removeDc: false,
    });
  }, [applyEdit]);

  // =========================================================================
  // Export
  // =========================================================================
  const buildResult = useCallback(async (): Promise<{ blob: Blob; name: string; format: string } | null> => {
    if (!buffer || outputLength <= 0) return null;
    const rendered = await renderEdit(buffer, edit, setExportProgress);

    if (format === 'compressed') {
      const encoded = await encodeCompressed(rendered, bitrate, setExportProgress);
      return { blob: encoded.blob, name: `${originalName}-cut.${encoded.ext}`, format: encoded.mime };
    }

    const depth = format === 'wav16' ? 16 : format === 'wav24' ? 24 : 32;
    return {
      blob: encodeWav(rendered, depth),
      name: `${originalName}-cut.wav`,
      format: `WAV ${depth}${depth === 32 ? ' float' : '-bit'}`,
    };
  }, [buffer, edit, format, bitrate, originalName, outputLength]);

  const runExport = useCallback(async () => {
    if (!buffer || exporting) return;
    if (outputLength < 0.02) {
      setError(t.errorTooShort || 'The selection is too short to export.');
      return;
    }
    setExporting(true);
    setExportProgress(0);
    setError(null);
    try {
      const result = await buildResult();
      if (!result) return;

      const url = URL.createObjectURL(result.blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = result.name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      setExports(prev => [
        {
          id: `${Date.now()}`,
          name: result.name,
          url,
          blob: result.blob,
          sizeBytes: result.blob.size,
          durationSec: outputLength,
          format: result.format,
          at: Date.now(),
        },
        ...prev,
      ]);
    } catch (err) {
      setError(
        (err as Error)?.message === 'no-encoder'
          ? t.errorEncoder || 'This browser cannot encode compressed audio. Use WAV instead.'
          : t.errorExport || 'The export failed. Try a shorter selection or the WAV format.'
      );
    } finally {
      setExporting(false);
      setExportProgress(0);
    }
  }, [buffer, exporting, outputLength, buildResult, t]);

  const downloadOriginal = useCallback(() => {
    if (!originalBlob) return;
    const url = URL.createObjectURL(originalBlob);
    const anchor = document.createElement('a');
    anchor.href = url;
    const extension = originalBlob.type.includes('mp4')
      ? 'm4a'
      : originalBlob.type.includes('ogg')
        ? 'ogg'
        : originalBlob.type.includes('wav')
          ? 'wav'
          : 'webm';
    anchor.download = originalName.includes('.') ? originalName : `${originalName}.${extension}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    // Nothing keeps a reference to this URL, so it can go right away — unlike
    // the session list below, whose entries stay downloadable.
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }, [originalBlob, originalName]);

  const removeExport = useCallback((id: string) => {
    setExports(prev => {
      const target = prev.find(item => item.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter(item => item.id !== id);
    });
  }, []);

  const clearExports = useCallback(() => {
    setExports(prev => {
      prev.forEach(item => URL.revokeObjectURL(item.url));
      return [];
    });
  }, []);

  // =========================================================================
  // Reset & teardown
  // =========================================================================
  const resetAll = useCallback(() => {
    stopRecording();
    stopPlayback(true);
    setBuffer(null);
    setMip(null);
    setInfo(null);
    setOriginalBlob(null);
    setPendingFile(null);
    setEditNow(NEUTRAL_EDIT);
    setHistoryNow({ entries: [NEUTRAL_EDIT], index: 0 });
    setView({ from: 0, to: 0 });
    setPlayhead(0);
    setRecordingTime(0);
    setError(null);
    setNotice(null);
    setInputClipped(false);
  }, [stopRecording, stopPlayback, setEditNow, setHistoryNow]);

  useEffect(() => {
    return () => {
      meterTickerRef.current?.stop();
      timerTickerRef.current?.stop();
      playTickerRef.current?.stop();
      streamRef.current?.getTracks().forEach(track => track.stop());
      meterCtxRef.current?.close().catch(() => {});
      playCtxRef.current?.close().catch(() => {});
      // Blob URLs outlive the component otherwise, and a session of exports is
      // easily hundreds of megabytes of WAV held by the browser.
      exportsRef.current.forEach(item => URL.revokeObjectURL(item.url));
    };
  }, []);

  // =========================================================================
  // Keyboard
  // =========================================================================
  useEffect(() => {
    if (!hasSource) return;

    const isTyping = (target: EventTarget | null) => {
      const element = target as HTMLElement | null;
      if (!element) return false;
      const tag = element.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || element.isContentEditable;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTyping(event.target)) return;

      if (event.key === 'Alt' && !compare) {
        setCompare(true);
        return;
      }

      const meta = event.ctrlKey || event.metaKey;
      if (meta && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        event.shiftKey ? redo() : undo();
        return;
      }
      if (meta && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
        return;
      }
      if (meta) return;

      switch (event.key.toLowerCase()) {
        case ' ':
          event.preventDefault();
          togglePlay();
          break;
        case 'i':
          applyEdit({ inSec: Math.min(playhead, edit.outSec - 0.02) });
          break;
        case 'o':
          applyEdit({ outSec: Math.max(playhead, edit.inSec + 0.02) });
          break;
        case 'a':
          if (buffer) applyEdit({ inSec: 0, outSec: buffer.duration });
          break;
        case '+':
        case '=':
          zoomBy(1 / 1.5);
          break;
        case '-':
          zoomBy(1.5);
          break;
        case 'f':
          if (buffer) zoomTo(0, buffer.duration);
          break;
        case 's':
          zoomTo(edit.inSec, edit.outSec);
          break;
        case 'home':
          setPlayhead(edit.inSec);
          break;
        case 'end':
          setPlayhead(edit.outSec);
          break;
        default:
          break;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Alt') setCompare(false);
    };
    // Losing focus mid-hold would otherwise leave the monitor stuck on bypass.
    const onBlur = () => setCompare(false);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [hasSource, compare, redo, undo, togglePlay, applyEdit, playhead, edit.inSec, edit.outSec, buffer, zoomBy, zoomTo]);

  // Keep the playhead honest when the selection moves under it.
  useEffect(() => {
    setPlayhead(current => Math.min(Math.max(current, edit.inSec), edit.outSec || 0));
  }, [edit.inSec, edit.outSec]);

  // =========================================================================
  // Content
  // =========================================================================
  const faqs = Array.isArray(t.faq) ? t.faq : [];
  const keywords = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];
  const steps = Array.isArray(t.howItWorks) ? t.howItWorks : [];
  const features = Array.isArray(t.features) ? t.features : [];
  const stepArt = [StepCapture, StepShape, StepPolish, StepExport];
  const featureIcons = [IconTrim, IconCapture, IconNonDestructive, IconMeter, IconExport, IconLocalAudio];
  const compressedAvailable = useMemo(() => typeof window !== 'undefined' && !!pickCompressedType(), []);

  const canUndo = history.index > 0;
  const canRedo = history.index < history.entries.length - 1;

  const levelPercent = Math.min(100, Math.round(inputLevel * 100));

  // =========================================================================
  // Render
  // =========================================================================
  return (
    <div className="min-h-screen flex flex-col bg-[#060405] text-slate-200 font-sans relative overflow-x-hidden">
      <Header
        currentLang={lang}
        onLanguageChange={newLang => {
          window.location.href = `/${newLang.toLowerCase()}/audiosnap`;
        }}
        onReset={resetAll}
        t={t}
      />

      {/* The max width lives on <main> because AdRail measures this element to
          decide whether the fixed side rails fit; a full-bleed <main> silently
          kills both rails at every viewport width. */}
      <main className="flex-1 flex flex-col items-center pt-36 pb-28 px-4 md:px-12 relative z-10 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))]">
        <AdBanner id="adsense-audiosnap-top" />

        <div className="w-full space-y-20 md:space-y-28">
          {/* ================================================================ */}
          {/* Hero                                                             */}
          {/* ================================================================ */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center pt-2">
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex max-w-full items-center gap-2 px-4 py-2 rounded-full bg-rose-950/40 border border-rose-800/30 text-rose-400 text-[11px] font-black tracking-[0.2em] uppercase shadow-[0_0_25px_rgba(244,63,94,0.15)]">
                <Mic className="w-3.5 h-3.5 shrink-0" />
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
                    <Check className="w-3.5 h-3.5 text-rose-400 stroke-[3]" />
                    {point}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-rose-500/10 blur-[80px] rounded-full" />
              <StudioHeroArt
                className="relative w-full max-w-lg mx-auto drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
                animated={!prefersReduced}
              />
            </div>
          </section>

          {/* ================================================================ */}
          {/* Workspace                                                        */}
          {/* ================================================================ */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* -------------------------------------------------- main panel */}
            <div className="lg:col-span-8 space-y-5 min-w-0">
              {!hasSource && (
                <div className="flex p-1 rounded-2xl bg-[#130a0f]/80 border border-white/5 gap-1 w-full">
                  {[
                    { id: 'record' as Tab, label: t.tabRecord || 'Record', icon: Mic },
                    { id: 'file' as Tab, label: t.tabFile || 'Open a file', icon: FileAudio },
                  ].map(item => {
                    const Icon = item.icon;
                    const active = tab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setTab(item.id)}
                        disabled={isRecording}
                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                          active
                            ? 'bg-rose-600 text-white shadow-[0_0_25px_rgba(244,63,94,0.35)]'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="glass-card rounded-3xl p-5 md:p-7 space-y-5 min-h-[380px]">
                {/* ------------------------------------------------ recorder */}
                {!hasSource && tab === 'record' && (
                  <div className="space-y-6">
                    {!isRecording && !loading && (
                      <div className="flex flex-col items-center justify-center py-8 text-center gap-5">
                        <WaveIdleArt className="w-40 h-24 text-rose-400/70" animated={!prefersReduced} />
                        <button
                          onClick={startRecording}
                          aria-label={t.btn_record || 'Record'}
                          className="w-24 h-24 rounded-full bg-rose-500 hover:bg-rose-400 text-black flex items-center justify-center hover:scale-105 active:scale-95 duration-300 shadow-xl shadow-rose-500/20 cursor-pointer border-none outline-none"
                        >
                          <Mic className="w-10 h-10" />
                        </button>
                        <div className="space-y-1.5">
                          <h2 className="text-lg font-black text-white uppercase tracking-wider">
                            {t.recordTitle || 'Record from your microphone'}
                          </h2>
                          <p className="text-sm text-slate-500 max-w-sm font-medium mx-auto">
                            {t.recordHint || 'The mic only opens while you record, and the audio never leaves this tab.'}
                          </p>
                        </div>
                      </div>
                    )}

                    {isRecording && (
                      <div className="space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/50 border border-white/10 rounded-full">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-rose-500 animate-pulse'}`}
                            />
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                              {isPaused ? t.label_paused || 'Paused' : t.label_recording || 'Recording'}
                            </span>
                          </div>
                          <div className="text-rose-400 font-mono font-bold text-2xl tracking-widest tabular-nums">
                            {formatClock(recordingTime)}
                          </div>
                        </div>

                        {/* Live level meter, driven by a worker ticker so it
                            keeps updating in a background tab. */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
                            <span>{t.levelLabel || 'Input level'}</span>
                            <span className={inputClipped ? 'text-amber-400' : 'text-slate-500'}>
                              {formatDb(inputLevel > 0 ? 20 * Math.log10(inputLevel) : -Infinity)}
                            </span>
                          </div>
                          <div className="h-3 rounded-full bg-black/50 border border-white/10 overflow-hidden">
                            <div
                              className={`h-full transition-[width] duration-75 ${
                                levelPercent > 92 ? 'bg-amber-400' : 'bg-gradient-to-r from-rose-600 to-rose-300'
                              }`}
                              style={{ width: `${levelPercent}%` }}
                            />
                          </div>
                          {inputClipped && (
                            <p className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              {t.clipWarn || 'The input hit full scale — move back from the mic or lower its gain.'}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={isPaused ? resumeRecording : pauseRecording}
                            className="flex-1 min-w-[130px] py-4 bg-white/10 hover:bg-white/20 text-white font-black text-sm uppercase rounded-2xl transition-all cursor-pointer border-none outline-none"
                          >
                            {isPaused ? t.btn_resume_record || 'Resume' : t.btn_pause_record || 'Pause'}
                          </button>
                          <button
                            onClick={stopRecording}
                            className="flex-1 min-w-[130px] py-4 bg-rose-500 hover:bg-rose-400 text-black font-black text-sm uppercase rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 border-none outline-none shadow-lg shadow-rose-500/25"
                          >
                            <Square className="w-4 h-4" />
                            <span>{t.btn_stop_record || 'Stop'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {loading && (
                      <div className="flex flex-col items-center gap-4 py-16">
                        <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
                        <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                          {t.decodingLabel || 'Reading the audio…'}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* ---------------------------------------------------- file */}
                {!hasSource && tab === 'file' && (
                  <div className="space-y-4">
                    {!pendingFile && !loading && (
                      <div
                        onDragOver={event => {
                          event.preventDefault();
                          setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`rounded-2xl border-2 border-dashed p-10 text-center flex flex-col items-center gap-4 cursor-pointer transition-all ${
                          dragging
                            ? 'border-rose-500/60 bg-rose-500/5'
                            : 'border-white/10 hover:border-rose-500/40 bg-black/20 hover:bg-black/40'
                        }`}
                      >
                        <WaveIdleArt className="w-32 h-20 text-rose-400/70" animated={!prefersReduced} />
                        <div className="space-y-1.5">
                          <h2 className="text-base font-black text-white">{t.dropTitle || 'Drop an audio file'}</h2>
                          <p className="text-xs text-slate-500 font-medium max-w-sm leading-relaxed">
                            {t.dropHint || 'MP3, WAV, M4A, OGG, Opus, FLAC, WebM — and the audio track of a video.'}
                          </p>
                        </div>
                        <span className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider transition-colors">
                          {t.browseBtn || 'Choose a file'}
                        </span>
                      </div>
                    )}

                    {/* Parked file. Decoding a long recording is the expensive
                        step, so it waits for an explicit click. */}
                    {pendingFile && !loading && (
                      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 space-y-4">
                        <div className="flex items-start gap-3">
                          <span className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                            <FileAudio className="w-5 h-5" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{pendingFile.name}</p>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                              {formatBytes(pendingFile.size)} · {pendingFile.type || 'audio'}
                            </p>
                          </div>
                          <button
                            onClick={() => setPendingFile(null)}
                            className="text-slate-500 hover:text-white transition-colors bg-transparent border-none cursor-pointer p-1"
                            aria-label={t.discardBtn || 'Discard'}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {t.pendingHint || 'Nothing has been decoded yet. Press the button when you are ready.'}
                        </p>
                        <button
                          onClick={loadPendingFile}
                          className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer border-none"
                        >
                          {t.loadBtn || 'Load it into the editor'}
                        </button>
                      </div>
                    )}

                    {loading && (
                      <div className="flex flex-col items-center gap-4 py-16">
                        <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
                        <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                          {t.decodingLabel || 'Reading the audio…'}
                        </span>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*,video/*,.mp3,.wav,.m4a,.aac,.ogg,.opus,.flac,.webm"
                      className="hidden"
                      onChange={event => {
                        const file = event.target.files?.[0];
                        if (file) acceptFile(file);
                        event.target.value = '';
                      }}
                    />
                  </div>
                )}

                {/* -------------------------------------------------- editor */}
                {hasSource && buffer && mip && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                        <Scissors className="w-4 h-4 text-rose-500" />
                        {t.label_trim || 'Waveform editor'}
                      </h2>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={undo}
                          disabled={!canUndo}
                          title={t.undoBtn || 'Undo'}
                          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        >
                          <Undo2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={redo}
                          disabled={!canRedo}
                          title={t.redoBtn || 'Redo'}
                          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        >
                          <Redo2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={resetAll}
                          title={t.newSourceBtn || 'Start over'}
                          className="h-9 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-300 cursor-pointer transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{t.newSourceBtn || 'Start over'}</span>
                        </button>
                      </div>
                    </div>

                    <Waveform
                      mip={mip}
                      duration={buffer.duration}
                      inSec={edit.inSec}
                      outSec={edit.outSec}
                      playhead={playhead}
                      view={view.to > view.from ? view : { from: 0, to: buffer.duration }}
                      bypassed={compare}
                      onViewChange={setView}
                      onSelectionChange={setSelection}
                      onCommit={commitLive}
                      onSeek={sec => {
                        setPlayhead(sec);
                        if (isPlaying) startPlayback(sec, compare);
                      }}
                    />

                    {/* Transport */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={togglePlay}
                        className="w-12 h-12 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center cursor-pointer border-none outline-none transition-colors shrink-0"
                        title={t.transportPlay || 'Play / pause (Space)'}
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => stopPlayback(true)}
                        className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center cursor-pointer outline-none transition-colors shrink-0"
                        title={t.transportStop || 'Stop'}
                      >
                        <Square className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setLoop(value => !value)}
                        className={`w-12 h-12 rounded-2xl border flex items-center justify-center cursor-pointer outline-none transition-colors shrink-0 ${
                          loop
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                        title={t.transportLoop || 'Loop the selection'}
                      >
                        <Repeat className="w-4 h-4" />
                      </button>

                      <button
                        onPointerDown={() => setCompare(true)}
                        onPointerUp={() => setCompare(false)}
                        onPointerLeave={() => setCompare(false)}
                        className={`h-12 px-4 rounded-2xl border text-[11px] font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer outline-none transition-colors select-none ${
                          compare
                            ? 'bg-slate-200 border-slate-200 text-black'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                        title={t.compareHint || 'Hold to hear the untouched original (or hold Alt)'}
                      >
                        <Gauge className="w-4 h-4" />
                        <span className="hidden sm:inline">{t.compareBtn || 'Hold: original'}</span>
                      </button>

                      <div className="flex-1 min-w-[120px] text-right font-mono text-xs text-slate-400 tabular-nums">
                        {formatClock(playhead)} / {formatClock(edit.outSec)}
                      </div>
                    </div>

                    {/* Zoom row */}
                    <div className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-4">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 mr-1">
                        {t.zoomLabel || 'Zoom'}
                      </span>
                      {[
                        { label: '−', title: t.zoomOut || 'Zoom out', action: () => zoomBy(1.5) },
                        { label: '+', title: t.zoomIn || 'Zoom in', action: () => zoomBy(1 / 1.5) },
                      ].map(item => (
                        <button
                          key={item.label}
                          onClick={item.action}
                          title={item.title}
                          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-black cursor-pointer transition-colors"
                        >
                          {item.label}
                        </button>
                      ))}
                      <button
                        onClick={() => zoomTo(edit.inSec, edit.outSec)}
                        className="h-9 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-slate-300 cursor-pointer transition-colors"
                      >
                        {t.zoomSelection || 'Fit selection'}
                      </button>
                      <button
                        onClick={() => zoomTo(0, buffer.duration)}
                        className="h-9 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-slate-300 cursor-pointer transition-colors"
                      >
                        {t.zoomFit || 'Whole clip'}
                      </button>
                      <span className="text-[10px] font-mono text-slate-600 ml-auto">
                        {t.zoomHint || 'Wheel = zoom · Shift+wheel = pan · drag = select'}
                      </span>
                    </div>

                    {/* Selection numbers */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { label: t.label_start || 'In', value: formatClock(edit.inSec) },
                        { label: t.label_end || 'Out', value: formatClock(edit.outSec) },
                        { label: t.label_duration || 'Selection', value: `${selectionLength.toFixed(2)}s` },
                        { label: t.outputLabel || 'Output', value: `${outputLength.toFixed(2)}s` },
                      ].map(item => (
                        <div key={item.label} className="rounded-xl bg-black/30 border border-white/5 px-3 py-2">
                          <div className="text-[9px] font-black uppercase tracking-wider text-slate-600">{item.label}</div>
                          <div className="text-sm font-mono font-bold text-rose-300 tabular-nums">{item.value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => applyEdit({ inSec: Math.min(playhead, edit.outSec - 0.02) })}
                        className="h-9 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-slate-300 cursor-pointer transition-colors"
                      >
                        {t.setInBtn || 'Set in (I)'}
                      </button>
                      <button
                        onClick={() => applyEdit({ outSec: Math.max(playhead, edit.inSec + 0.02) })}
                        className="h-9 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-slate-300 cursor-pointer transition-colors"
                      >
                        {t.setOutBtn || 'Set out (O)'}
                      </button>
                      <button
                        onClick={() => applyEdit({ inSec: 0, outSec: buffer.duration })}
                        className="h-9 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-slate-300 cursor-pointer transition-colors"
                      >
                        {t.selectAll || 'Select all (A)'}
                      </button>
                      <button
                        onClick={autoTrim}
                        className="h-9 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-[11px] font-bold text-rose-300 cursor-pointer transition-colors flex items-center gap-1.5"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        {t.autoTrimBtn || 'Trim the silence'}
                      </button>
                    </div>
                  </div>
                )}

                {(error || notice) && (
                  <div
                    className={`flex items-start gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium ${
                      error
                        ? 'bg-red-500/10 border border-red-500/25 text-red-300'
                        : 'bg-rose-500/10 border border-rose-500/25 text-rose-200'
                    }`}
                  >
                    {error ? (
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    ) : (
                      <Check className="w-4 h-4 mt-0.5 shrink-0" />
                    )}
                    <span className="flex-1">{error || notice}</span>
                    <button
                      onClick={() => (error ? setError(null) : setNotice(null))}
                      className="text-current opacity-60 hover:opacity-100 bg-transparent border-none cursor-pointer"
                      aria-label="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {hasSource && (
                <div className="glass-card rounded-3xl p-5 md:p-6 space-y-3">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Keyboard className="w-4 h-4 text-rose-500" />
                    {t.shortcutsTitle || 'Keyboard'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[11px] text-slate-500 font-medium">
                    {[
                      ['Space', t.shortcutPlay || 'Play / pause'],
                      ['I / O', t.shortcutInOut || 'Set in / out at the playhead'],
                      ['A', t.shortcutAll || 'Select the whole clip'],
                      ['Alt', t.shortcutAlt || 'Hold to hear the untouched original'],
                      ['+ / − / F / S', t.shortcutZoom || 'Zoom in, out, whole clip, selection'],
                      ['Ctrl+Z / Ctrl+Shift+Z', t.shortcutUndo || 'Undo / redo'],
                    ].map(([key, description]) => (
                      <div key={key} className="flex items-center gap-2">
                        <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[10px] text-slate-300 shrink-0">
                          {key}
                        </kbd>
                        <span className="truncate">{description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ------------------------------------------------- side panels */}
            <div className="lg:col-span-4 space-y-5 min-w-0">
              {/* Capture settings */}
              {!hasSource && tab === 'record' && (
                <div className="glass-card rounded-3xl p-5 md:p-6 space-y-4">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Settings2 className="w-4 h-4 text-rose-500" />
                    {t.captureTitle || 'Microphone settings'}
                  </h3>

                  <label className="block space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      {t.micLabel || 'Input device'}
                    </span>
                    <select
                      value={capture.deviceId}
                      onChange={event => setCapture(prev => ({ ...prev, deviceId: event.target.value }))}
                      disabled={isRecording}
                      className="w-full bg-[#130a0f] border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-200 outline-none focus:border-rose-500 cursor-pointer disabled:opacity-40"
                    >
                      <option value="">{t.micDefault || 'System default'}</option>
                      {devices.map(device => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="space-y-2">
                    {[
                      { key: 'echoCancellation' as const, label: t.micEcho || 'Echo cancellation' },
                      { key: 'noiseSuppression' as const, label: t.micNoise || 'Noise suppression' },
                      { key: 'autoGainControl' as const, label: t.micAgc || 'Automatic gain' },
                    ].map(item => (
                      <label
                        key={item.key}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-black/25 border border-white/5 cursor-pointer"
                      >
                        <span className="text-xs font-bold text-slate-300">{item.label}</span>
                        <input
                          type="checkbox"
                          checked={capture[item.key]}
                          disabled={isRecording}
                          onChange={event => setCapture(prev => ({ ...prev, [item.key]: event.target.checked }))}
                          className="w-4 h-4 accent-rose-500 cursor-pointer"
                        />
                      </label>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="block space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        {t.micChannels || 'Channels'}
                      </span>
                      <select
                        value={capture.channelCount}
                        onChange={event => setCapture(prev => ({ ...prev, channelCount: Number(event.target.value) }))}
                        disabled={isRecording}
                        className="w-full bg-[#130a0f] border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-200 outline-none focus:border-rose-500 cursor-pointer disabled:opacity-40"
                      >
                        <option value={1}>{t.micMono || 'Mono'}</option>
                        <option value={2}>{t.micStereo || 'Stereo'}</option>
                      </select>
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        {t.micBitrate || 'Quality'}
                      </span>
                      <select
                        value={capture.bitrate}
                        onChange={event => setCapture(prev => ({ ...prev, bitrate: Number(event.target.value) }))}
                        disabled={isRecording}
                        className="w-full bg-[#130a0f] border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-200 outline-none focus:border-rose-500 cursor-pointer disabled:opacity-40"
                      >
                        <option value={64000}>64 kbps</option>
                        <option value={128000}>128 kbps</option>
                        <option value={192000}>192 kbps</option>
                        <option value={256000}>256 kbps</option>
                      </select>
                    </label>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {t.captureHint ||
                      'Turn the three processors off for music or room tone; leave them on for speech in a noisy place.'}
                  </p>
                </div>
              )}

              {/* Processing */}
              {hasSource && buffer && (
                <div className="glass-card rounded-3xl p-5 md:p-6 space-y-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-rose-500" />
                      {t.processTitle || 'Processing'}
                    </h3>
                    <button
                      onClick={resetProcessing}
                      className="text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-rose-400 bg-transparent border-none cursor-pointer transition-colors"
                    >
                      {t.resetProcessing || 'Neutral'}
                    </button>
                  </div>

                  {/* Gain */}
                  <label className="block space-y-2">
                    <span className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
                      <span>{t.gainLabel || 'Gain'}</span>
                      <span className="text-rose-400 font-mono">{formatDb(edit.gainDb)}</span>
                    </span>
                    <input
                      type="range"
                      min={-24}
                      max={24}
                      step={0.5}
                      value={edit.gainDb}
                      onChange={event => previewEdit({ gainDb: Number(event.target.value) })}
                      onPointerUp={commitLive}
                      onKeyUp={commitLive}
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-black/25 border border-white/5 cursor-pointer">
                    <span className="text-xs font-bold text-slate-300">
                      {t.normalizeLabel || 'Normalise peak to'} {edit.normalizeTargetDb} dB
                    </span>
                    <input
                      type="checkbox"
                      checked={edit.normalize}
                      onChange={event => applyEdit({ normalize: event.target.checked })}
                      className="w-4 h-4 accent-rose-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-black/25 border border-white/5 cursor-pointer">
                    <span className="text-xs font-bold text-slate-300">{t.dcLabel || 'Remove DC offset'}</span>
                    <input
                      type="checkbox"
                      checked={edit.removeDc}
                      onChange={event => applyEdit({ removeDc: event.target.checked })}
                      className="w-4 h-4 accent-rose-500 cursor-pointer"
                    />
                  </label>

                  {/* Fades */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'fadeInSec' as const, label: t.fadeInLabel || 'Fade in' },
                      { key: 'fadeOutSec' as const, label: t.fadeOutLabel || 'Fade out' },
                    ].map(item => (
                      <label key={item.key} className="block space-y-2">
                        <span className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
                          <span className="truncate">{item.label}</span>
                          <span className="text-rose-400 font-mono shrink-0">{edit[item.key].toFixed(1)}s</span>
                        </span>
                        <input
                          type="range"
                          min={0}
                          max={Math.max(0.5, Math.min(10, selectionLength / 2))}
                          step={0.1}
                          value={edit[item.key]}
                          onChange={event => previewEdit({ [item.key]: Number(event.target.value) } as Partial<EditState>)}
                          onPointerUp={commitLive}
                          onKeyUp={commitLive}
                          className="w-full accent-rose-500 cursor-pointer"
                        />
                      </label>
                    ))}
                  </div>

                  {/* Speed */}
                  <label className="block space-y-2">
                    <span className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
                      <span>{t.speedLabel || 'Speed'}</span>
                      <span className="text-rose-400 font-mono">{edit.speed.toFixed(2)}×</span>
                    </span>
                    <input
                      type="range"
                      min={0.5}
                      max={2}
                      step={0.05}
                      value={edit.speed}
                      onChange={event => previewEdit({ speed: Number(event.target.value) })}
                      onPointerUp={commitLive}
                      onKeyUp={commitLive}
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="block space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        {t.channelsLabel || 'Channels'}
                      </span>
                      <select
                        value={edit.channelMode}
                        onChange={event => applyEdit({ channelMode: event.target.value as EditState['channelMode'] })}
                        className="w-full bg-[#130a0f] border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-200 outline-none focus:border-rose-500 cursor-pointer"
                      >
                        <option value="source">
                          {t.channelSource || 'Keep'} ({buffer.numberOfChannels})
                        </option>
                        <option value="mono">{t.micMono || 'Mono'}</option>
                        <option value="stereo">{t.micStereo || 'Stereo'}</option>
                      </select>
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        {t.rateLabel || 'Sample rate'}
                      </span>
                      <select
                        value={edit.sampleRate}
                        onChange={event => applyEdit({ sampleRate: Number(event.target.value) })}
                        className="w-full bg-[#130a0f] border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-200 outline-none focus:border-rose-500 cursor-pointer"
                      >
                        <option value={0}>
                          {t.rateSource || 'Keep'} ({(buffer.sampleRate / 1000).toFixed(1)}k)
                        </option>
                        {[8000, 16000, 22050, 32000, 44100, 48000].map(rate => (
                          <option key={rate} value={rate}>
                            {rate / 1000} kHz
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              )}

              {/* Measurements */}
              {hasSource && sourceStats && (
                <div className="glass-card rounded-3xl p-5 md:p-6 space-y-3">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-rose-500" />
                    {t.statsTitle || 'Measured'}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: t.statPeak || 'Source peak', value: formatDb(sourceStats.peakDb) },
                      { label: t.statRms || 'Source RMS', value: formatDb(sourceStats.rmsDb) },
                      { label: t.statOutPeak || 'Output peak', value: formatDb(outputPeakDb) },
                      { label: t.statGain || 'Applied gain', value: formatDb(appliedGainDb) },
                    ].map(item => (
                      <div key={item.label} className="rounded-xl bg-black/30 border border-white/5 px-3 py-2">
                        <div className="text-[9px] font-black uppercase tracking-wider text-slate-600 truncate">
                          {item.label}
                        </div>
                        <div className="text-sm font-mono font-bold text-rose-300 tabular-nums">{item.value}</div>
                      </div>
                    ))}
                  </div>
                  {outputPeakDb > 0 && (
                    <p className="flex items-start gap-1.5 text-[11px] font-bold text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      {t.statClipWarn || 'The output would clip. Lower the gain or turn the normaliser on.'}
                    </p>
                  )}
                  {info && (
                    <p className="text-[11px] text-slate-600 leading-relaxed border-t border-white/5 pt-3">
                      {info.channels === 1 ? t.micMono || 'Mono' : `${info.channels}ch`} ·{' '}
                      {(info.sampleRate / 1000).toFixed(1)} kHz · {formatBytes(info.sizeBytes)}
                      {info.resampled ? ` · ${t.infoResampled || 'resampled on decode'}` : ''}
                    </p>
                  )}
                </div>
              )}

              {/* Export */}
              {hasSource && (
                <div className="glass-card rounded-3xl p-5 md:p-6 space-y-4">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-rose-500" />
                    {t.exportTitle || 'Export'}
                  </h3>

                  <label className="block space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      {t.formatLabel || 'Format'}
                    </span>
                    <select
                      value={format}
                      onChange={event => setFormat(event.target.value as ExportFormat)}
                      className="w-full bg-[#130a0f] border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-200 outline-none focus:border-rose-500 cursor-pointer"
                    >
                      <option value="wav16">{t.fmtWav16 || 'WAV · 16-bit (dithered)'}</option>
                      <option value="wav24">{t.fmtWav24 || 'WAV · 24-bit'}</option>
                      <option value="wav32">{t.fmtWav32 || 'WAV · 32-bit float'}</option>
                      {compressedAvailable && <option value="compressed">{t.fmtCompressed || 'Compressed · Opus'}</option>}
                    </select>
                  </label>

                  {format === 'compressed' && (
                    <>
                      <label className="block space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                          {t.bitrateLabel || 'Bitrate'}
                        </span>
                        <select
                          value={bitrate}
                          onChange={event => setBitrate(Number(event.target.value))}
                          className="w-full bg-[#130a0f] border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-200 outline-none focus:border-rose-500 cursor-pointer"
                        >
                          {[48000, 64000, 96000, 128000, 192000, 256000].map(rate => (
                            <option key={rate} value={rate}>
                              {rate / 1000} kbps
                            </option>
                          ))}
                        </select>
                      </label>
                      <p className="flex items-start gap-1.5 text-[11px] text-amber-400/90 font-medium leading-relaxed">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        {(t.realtimeWarn ||
                          'The browser has no offline audio encoder, so this one runs in real time: about {s}s.').replace(
                          '{s}',
                          Math.ceil(outputLength).toString()
                        )}
                      </p>
                    </>
                  )}

                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-1">
                    <span>{t.statSize || 'Estimated size'}</span>
                    <span className="font-mono text-slate-300">{formatBytes(estimatedBytes)}</span>
                  </div>

                  <button
                    onClick={runExport}
                    disabled={exporting || outputLength < 0.02}
                    className="w-full flex items-center justify-center gap-2.5 py-4 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-black text-sm uppercase rounded-2xl transition-all cursor-pointer active:scale-[0.98] duration-200 border-none outline-none shadow-lg shadow-rose-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                    <span>
                      {exporting
                        ? `${t.exportingLabel || 'Rendering'} ${Math.round(exportProgress * 100)}%`
                        : t.exportBtn || 'Render & download'}
                    </span>
                  </button>

                  {exporting && (
                    <div className="h-1.5 rounded-full bg-black/50 overflow-hidden">
                      <div
                        className="h-full bg-rose-500 transition-[width] duration-200"
                        style={{ width: `${Math.round(exportProgress * 100)}%` }}
                      />
                    </div>
                  )}

                  {originalBlob && (
                    <button
                      onClick={downloadOriginal}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-black text-[11px] uppercase tracking-wider rounded-2xl transition-all cursor-pointer border border-white/10 outline-none"
                    >
                      <Upload className="w-3.5 h-3.5 rotate-180" />
                      <span className="truncate">{t.downloadOriginalBtn || 'Download the untouched source'}</span>
                    </button>
                  )}
                </div>
              )}

              {hasSource && (
                <NextStepBar
                  lang={lang}
                  t={t}
                  disabled={exporting || outputLength < 0.02}
                  getResult={async () => {
                    const result = await buildResult();
                    return result ? { blob: result.blob, name: result.name } : null;
                  }}
                />
              )}

              {/* Session exports */}
              {exports.length > 0 && (
                <div className="glass-card rounded-3xl p-5 md:p-6 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <History className="w-4 h-4 text-rose-500" />
                      {t.history_title || 'This session'}
                    </h3>
                    <button
                      onClick={clearExports}
                      className="text-[11px] font-bold text-red-400 hover:text-red-300 border-none bg-transparent cursor-pointer outline-none flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.clear_history || 'Clear'}</span>
                    </button>
                  </div>
                  <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                    {exports.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl"
                      >
                        <span className="w-9 h-9 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center shrink-0 text-rose-400">
                          <FileAudio className="w-4 h-4" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-slate-300 text-xs font-bold truncate">{item.name}</div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5 truncate">
                            {formatBytes(item.sizeBytes)} · {item.durationSec.toFixed(1)}s · {item.format}
                          </div>
                        </div>
                        <a
                          href={item.url}
                          download={item.name}
                          className="text-slate-400 hover:text-white transition-colors shrink-0"
                          aria-label={t.exportBtn || 'Download'}
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => removeExport(item.id)}
                          className="text-slate-600 hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer shrink-0 p-0"
                          aria-label={t.discardBtn || 'Remove'}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          <AdBanner id="adsense-audiosnap-mid" />

          {/* ================================================================ */}
          {/* How it works                                                     */}
          {/* ================================================================ */}
          {steps.length > 0 && (
            <section className="space-y-10">
              <div className="text-center space-y-3">
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                  {t.howItWorksTitle || 'How it works'}
                </h2>
                <div className="h-1 w-16 bg-rose-500 mx-auto rounded-full" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {steps.map((step: any, i: number) => {
                  const Art = stepArt[i] || StepCapture;
                  return (
                    <div
                      key={i}
                      className="relative glass-card rounded-3xl p-6 space-y-4 border border-white/5 hover:border-rose-500/20 transition-all group"
                    >
                      <span className="absolute top-5 right-6 text-5xl font-black text-white/5 group-hover:text-rose-500/10 transition-colors">
                        {i + 1}
                      </span>
                      <Art className="w-24 h-auto text-rose-400" />
                      <h3 className="text-base font-bold text-white leading-snug">{step.title}</h3>
                      <p className="text-slate-500 text-[13px] leading-relaxed font-medium">{step.text}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ================================================================ */}
          {/* Features                                                         */}
          {/* ================================================================ */}
          {features.length > 0 && (
            <motion.section
              initial={prefersReduced ? false : 'hidden'}
              whileInView={prefersReduced ? undefined : 'visible'}
              viewport={{ once: true, amount: 0.15 }}
              variants={fadeInUp}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {features.map((feature: any, idx: number) => {
                const Icon = featureIcons[idx] || IconTrim;
                return (
                  <div
                    key={idx}
                    className="p-7 glass-card rounded-3xl text-left hover:-translate-y-1.5 transition-all duration-300 group border border-white/5"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-5 group-hover:scale-110 group-hover:border-rose-500/40 transition-all">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-white text-lg font-bold mb-2.5 group-hover:text-rose-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">{feature.text}</p>
                  </div>
                );
              })}
            </motion.section>
          )}

          {/* ================================================================ */}
          {/* SEO content                                                      */}
          {/* ================================================================ */}
          <section className="space-y-24 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-24 items-center">
              <div className="space-y-7">
                {keywords[0] && (
                  <div className="inline-block px-4 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 text-[11px] font-black uppercase tracking-[0.2em] border border-rose-500/20">
                    {keywords[0]}
                  </div>
                )}
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
                      <span className="w-7 h-7 shrink-0 bg-rose-500/20 text-rose-400 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                      <span className="text-slate-300 font-bold text-sm">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative glass-card rounded-[3rem] p-10 py-16 min-h-[400px] flex flex-col items-center justify-center gap-7 text-center overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-rose-500/10 rounded-full blur-3xl" />
                <IconLocalAudio className="w-20 h-20 text-rose-400 relative" />
                <div className="space-y-3 max-w-sm relative">
                  <h3 className="text-2xl font-black text-white tracking-tight leading-tight">
                    {t.seoBrowserSpeedTitle}
                  </h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">{t.seoBrowserSpeedText}</p>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-14 rounded-3xl md:rounded-[2.5rem] bg-[#12080c] border border-white/5 space-y-10">
              <div className="max-w-4xl space-y-4">
                <h2 className="text-2xl md:text-4xl font-black text-white leading-tight">
                  {t.seoSecondaryTitle || t.seoUseCaseTitle}
                </h2>
                <div className="h-1.5 w-20 bg-rose-500 rounded-full" />
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

            {faqs.length > 0 && (
              <div className="max-w-4xl mx-auto w-full space-y-10">
                <div className="text-center space-y-3">
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{t.faqTitle}</h2>
                  <div className="h-1 w-16 bg-rose-500 mx-auto rounded-full" />
                </div>
                <div className="grid gap-3">
                  {faqs.map((faq: any, idx: number) => (
                    <details
                      key={idx}
                      className="glass-card rounded-2xl px-6 py-5 text-left border border-white/5 hover:border-rose-500/20 transition-colors group [&_summary::-webkit-details-marker]:hidden"
                    >
                      <summary className="flex items-start gap-3 cursor-pointer list-none text-base font-bold text-white group-hover:text-rose-400 transition-colors">
                        <span className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 text-[11px] font-black">
                          Q
                        </span>
                        <span className="flex-1">{faq.question}</span>
                        <span className="shrink-0 text-rose-400 transition-transform group-open:rotate-45 text-xl leading-none">
                          +
                        </span>
                      </summary>
                      <p className="text-slate-400 leading-relaxed pl-9 pt-3 text-sm">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {keywords.length > 0 && (
              <div className="max-w-4xl mx-auto w-full space-y-5 opacity-55 text-center">
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                  {t.seoKeywordsTitle}
                </h2>
                <div className="flex flex-wrap justify-center gap-2">
                  {keywords.map((keyword: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 transition-all cursor-default"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <AdBanner id="adsense-audiosnap-bottom" />
      </main>

      <Footer
        lang={lang}
        t={t}
        onOpenModal={type => {
          setModalType(type);
          setModalOpen(true);
        }}
      />

      <LegalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          modalType === 'privacy'
            ? legalTranslations[lang]?.privacy.title || 'Privacy Policy'
            : modalType === 'terms'
              ? legalTranslations[lang]?.terms.title || 'Terms of Service'
              : legalTranslations[lang]?.cookies.title || 'Cookie Policy'
        }
        content={
          modalType === 'privacy'
            ? legalTranslations[lang]?.privacy.content || ''
            : modalType === 'terms'
              ? legalTranslations[lang]?.terms.content || ''
              : legalTranslations[lang]?.cookies.content || ''
        }
        t={t}
      />
    </div>
  );
};

export default AudioSnap;
