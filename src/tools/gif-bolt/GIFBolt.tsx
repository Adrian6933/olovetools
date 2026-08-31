import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Crosshair,
  Download,
  Film,
  Images,
  Loader2,
  Pause,
  Play,
  Redo2,
  RotateCcw,
  Scissors,
  Sparkles,
  SquareStack,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import { createTranslator } from '../../locales/meta';
import { AdBanner } from '../../components/shared/AdBanner';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { Filmstrip } from './components/Filmstrip';
import { NextStepBar } from './components/NextStepBar';
import { Stage } from './components/Stage';
import {
  DropImagesArt,
  DropVideoArt,
  GifHeroArt,
  IconDelta,
  IconDither,
  IconHandoff,
  IconLocal,
  IconPalette,
  IconThreads,
  IconTimeline,
  StepDrop,
  StepExport,
  StepTrim,
  StepTune,
} from './components/Illustrations';
import { legalTranslations } from '../../locales/legal';
import { useHandoffIntake } from '../../lib/useHandoff';
import { encodeGif, type EncodePhase } from './lib/encoder';
import { msToDelayCs } from './lib/gif';
import {
  ACCEPTED_IMAGE,
  ACCEPTED_VIDEO,
  captureCurrentFrame,
  decodeImageFile,
  drawFrame,
  extractVideoFrames,
  formatBytes,
  formatTimecode,
  frameToRgba,
  isImageFile,
  isVideoFile,
  openVideo,
  snapFps,
  type VideoHandle,
} from './lib/frames';
import type { EditSnapshot, FitMode, Frame, HistoryEntry, ResultMeta } from './types';

interface GIFBoltProps {
  lang: string;
  dictionary: any;
}

/** Working resolutions offered before extraction. A GIF past 720 is a video. */
const WORKING_SIZES = [240, 320, 480, 640, 720];

/** Frames beyond this and the tab is fighting for its life, not making a GIF. */
const MAX_FRAMES = 400;

type Preset = 'high' | 'medium' | 'low' | 'custom';

const PRESETS: Record<Exclude<Preset, 'custom'>, { colors: number; dither: boolean }> = {
  high: { colors: 256, dither: true },
  medium: { colors: 128, dither: true },
  low: { colors: 64, dither: false },
};

export const GIFBolt: React.FC<GIFBoltProps> = ({ lang, dictionary }) => {
  const t = createTranslator(dictionary);

  // --- Source ---------------------------------------------------------------
  const [videoHandle, setVideoHandle] = useState<VideoHandle | null>(null);
  const [sourceName, setSourceName] = useState('');
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(3);
  const [fps, setFps] = useState(12.5);
  const [workingSize, setWorkingSize] = useState(480);
  const [manualMode, setManualMode] = useState(false);

  // --- Frames (the editable intermediate) -----------------------------------
  const [frames, setFrames] = useState<Frame[]>([]);
  const [frameIndex, setFrameIndex] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [playing, setPlaying] = useState(true);
  const [past, setPast] = useState<EditSnapshot[]>([]);
  const [future, setFuture] = useState<EditSnapshot[]>([]);

  // --- Output ---------------------------------------------------------------
  const [outWidth, setOutWidth] = useState(480);
  const [preset, setPreset] = useState<Preset>('medium');
  const [colors, setColors] = useState(128);
  const [dither, setDither] = useState(true);
  const [ditherStrength, setDitherStrength] = useState(0.85);
  const [diff, setDiff] = useState(true);
  const [tolerance, setTolerance] = useState(6);
  const [keepAlpha, setKeepAlpha] = useState(false);
  const [loopForever, setLoopForever] = useState(true);
  const [loopCount, setLoopCount] = useState(1);
  const [fit, setFit] = useState<FitMode>('contain');
  const [background, setBackground] = useState('#000000');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // --- Run ------------------------------------------------------------------
  const [busy, setBusy] = useState<{ phase: EncodePhase | 'raster' | 'extract'; ratio: number } | null>(null);
  const [result, setResult] = useState<ResultMeta | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [dragging, setDragging] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addImagesRef = useRef<HTMLInputElement>(null);
  const videoNodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setPrefersReduced(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  // ==========================================================================
  // Lifetime
  // ==========================================================================
  // Everything that has to be released lives behind a ref that is refreshed on
  // every render. An unmount cleanup with an empty dependency array closes over
  // the state as it was at mount — which is how the previous version managed to
  // never revoke a single object URL.
  /** Every bitmap ever decoded, keyed by frame id, so undo can bring one back. */
  const poolRef = useRef<Map<string, Frame>>(new Map());

  const releaseRef = useRef<() => void>(() => {});
  releaseRef.current = () => {
    // The pool, not `frames`: a deleted frame is still reachable through the
    // undo stack, so it is the pool that owns every bitmap's lifetime.
    for (const frame of poolRef.current.values()) frame.bitmap.close();
    if (result) URL.revokeObjectURL(result.url);
    for (const entry of history) URL.revokeObjectURL(entry.url);
    videoHandle?.release();
    abortRef.current?.abort();
  };
  useEffect(() => () => releaseRef.current(), []);

  const clearResult = useCallback(() => {
    setResult(previous => {
      if (previous) URL.revokeObjectURL(previous.url);
      return null;
    });
  }, []);

  // ==========================================================================
  // Intake
  // ==========================================================================
  const loadVideo = useCallback(
    async (file: File) => {
      setError(null);
      try {
        const handle = await openVideo(file);
        setVideoHandle(previous => {
          previous?.release();
          return handle;
        });
        setSourceName(file.name);
        setStart(0);
        setEnd(Math.min(3, handle.duration));
        setManualMode(false);
        // Uploading a file must not start the expensive part. The video is
        // parked with its preview and waits for a button.
        for (const frame of poolRef.current.values()) frame.bitmap.close();
        poolRef.current.clear();
        setFrames([]);
        setSelected(new Set());
        setPast([]);
        setFuture([]);
        clearResult();
      } catch {
        setError(t.errorVideo || 'This browser cannot decode that video. Try MP4 (H.264) or WebM.');
      }
    },
    [clearResult, t]
  );

  const addImages = useCallback(
    async (files: File[]) => {
      const usable = files.filter(isImageFile);
      if (!usable.length) return;
      setError(null);
      setBusy({ phase: 'extract', ratio: 0 });
      try {
        const decoded: Frame[] = [];
        for (let i = 0; i < usable.length; i++) {
          const bitmap = await decodeImageFile(usable[i]);
          decoded.push({
            id: `i${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
            bitmap,
            time: 0,
            delayMs: null,
            label: usable[i].name,
          });
          setBusy({ phase: 'extract', ratio: (i + 1) / usable.length });
        }

        // Trimmed out here rather than inside a state updater: React runs those
        // twice under StrictMode, and closing a bitmap twice would take out a
        // frame that survived the cut.
        let next = [...frames, ...decoded];
        if (next.length > MAX_FRAMES) {
          for (const frame of next.slice(MAX_FRAMES)) frame.bitmap.close();
          next = next.slice(0, MAX_FRAMES);
          setError(
            (t.errorTooManyFrames || 'Stopped at {0} frames — past that a GIF is not the right format.').replace(
              '{0}',
              String(MAX_FRAMES)
            )
          );
        }
        for (const frame of next) poolRef.current.set(frame.id, frame);
        setFrames(next);

        if (!frames.length && decoded[0]) {
          setOutWidth(Math.min(decoded[0].bitmap.width, workingSize));
          setSourceName(usable[0].name);
        }
        clearResult();
      } catch {
        setError(t.errorImages || 'At least one of those images could not be decoded.');
      } finally {
        setBusy(null);
      }
    },
    [clearResult, frames.length, t, workingSize]
  );

  const intake = useCallback(
    (files: File[]) => {
      const video = files.find(isVideoFile);
      if (video) {
        void loadVideo(video);
        return;
      }
      void addImages(files);
    },
    [addImages, loadVideo]
  );

  /** Picks up a recording handed over by RecordSnap or ClipFlow, routed by type. */
  useHandoffIntake(
    useCallback(
      (file: File) => {
        intake([file]);
      },
      [intake]
    )
  );

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragging(false);
    intake(Array.from(event.dataTransfer.files));
  };

  // ==========================================================================
  // Frame editing — snapshots hold ids and delays, never pixels
  // ==========================================================================
  const snapshot = useCallback(
    (label: string): EditSnapshot => ({
      order: frames.map(frame => frame.id),
      delays: Object.fromEntries(frames.map(frame => [frame.id, frame.delayMs])),
      label,
    }),
    [frames]
  );

  /** The last edit's kind and time, so a dragged slider is one undo, not sixty. */
  const lastCommitRef = useRef<{ label: string; at: number }>({ label: '', at: 0 });

  /**
   * All edits go through here. A snapshot is a list of ids and delays — no
   * pixels — so keeping fifty of them costs a few kilobytes, and the bitmaps
   * themselves stay alive in the pool.
   */
  const commit = useCallback(
    (label: string, produce: (current: Frame[]) => Frame[], coalesce = false) => {
      const before = snapshot(label);
      const next = produce(frames);
      if (next === frames) return;

      const now = Date.now();
      const continues = coalesce && lastCommitRef.current.label === label && now - lastCommitRef.current.at < 700;
      lastCommitRef.current = { label, at: now };
      if (!continues) setPast(previous => [...previous.slice(-49), before]);

      setFuture([]);
      for (const frame of next) poolRef.current.set(frame.id, frame);
      setFrames(next);
      setFrameIndex(index => Math.min(index, Math.max(0, next.length - 1)));
      clearResult();
    },
    [clearResult, frames, snapshot]
  );

  const restore = useCallback((snap: EditSnapshot): Frame[] => {
    const rebuilt: Frame[] = [];
    for (const id of snap.order) {
      const frame = poolRef.current.get(id);
      if (frame) rebuilt.push({ ...frame, delayMs: snap.delays[id] ?? null });
    }
    return rebuilt;
  }, []);

  const undo = useCallback(() => {
    setPast(previous => {
      if (!previous.length) return previous;
      const last = previous[previous.length - 1];
      setFuture(next => [snapshot(last.label), ...next].slice(0, 50));
      setFrames(restore(last));
      clearResult();
      return previous.slice(0, -1);
    });
  }, [clearResult, restore, snapshot]);

  const redo = useCallback(() => {
    setFuture(previous => {
      if (!previous.length) return previous;
      const first = previous[0];
      setPast(next => [...next, snapshot(first.label)]);
      setFrames(restore(first));
      clearResult();
      return previous.slice(1);
    });
  }, [clearResult, restore, snapshot]);

  const deleteSelected = () => {
    const ids = selected.size ? selected : new Set(frames[frameIndex] ? [frames[frameIndex].id] : []);
    if (!ids.size || ids.size === frames.length) return;
    commit('delete', current => current.filter(frame => !ids.has(frame.id)));
    setSelected(new Set());
  };

  const keepSelected = () => {
    if (!selected.size) return;
    commit('keep', current => current.filter(frame => selected.has(frame.id)));
    setSelected(new Set());
  };

  const reverse = () => commit('reverse', current => [...current].reverse());

  /** Palindrome loop: append the middle of the run backwards. */
  const pingPong = () =>
    commit('pingpong', current => {
      if (current.length < 2 || current.length * 2 > MAX_FRAMES) return current;
      const tail = current.slice(1, -1).reverse().map(frame => ({ ...frame, id: `${frame.id}-r` }));
      for (const frame of tail) poolRef.current.set(frame.id, frame);
      return [...current, ...tail];
    });

  const dropEveryOther = () => commit('halve', current => current.filter((_, i) => i % 2 === 0));

  const applyDelay = (ms: number) => {
    const ids = selected.size ? selected : new Set(frames[frameIndex] ? [frames[frameIndex].id] : []);
    // Coalesced: dragging the slider is one intent, not one undo step per pixel.
    commit('delay', current => current.map(frame => (ids.has(frame.id) ? { ...frame, delayMs: ms } : frame)), true);
  };

  const clearDelays = () => commit('delay-reset', current => current.map(frame => ({ ...frame, delayMs: null })));

  // ==========================================================================
  // Extraction
  // ==========================================================================
  const workingBox = useMemo(() => {
    if (!videoHandle) return { width: workingSize, height: workingSize };
    const scale = Math.min(1, workingSize / Math.max(videoHandle.width, videoHandle.height));
    return {
      width: Math.max(2, Math.round((videoHandle.width * scale) / 2) * 2),
      height: Math.max(2, Math.round((videoHandle.height * scale) / 2) * 2),
    };
  }, [videoHandle, workingSize]);

  const plannedFrames = Math.max(1, Math.round(Math.max(0, end - start) * fps));

  const extract = async () => {
    if (!videoHandle) return;
    if (plannedFrames > MAX_FRAMES) {
      setError((t.errorTooManyFrames || 'Stopped at {0} frames — past that a GIF is not the right format.').replace('{0}', String(MAX_FRAMES)));
      return;
    }
    setError(null);
    setPlaying(false);
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy({ phase: 'extract', ratio: 0 });

    try {
      const extracted = await extractVideoFrames(videoHandle.video, {
        start,
        end,
        fps,
        width: workingBox.width,
        height: workingBox.height,
        crop: null,
        signal: controller.signal,
        onProgress: (done, total) => setBusy({ phase: 'extract', ratio: done / total }),
      });

      for (const frame of poolRef.current.values()) frame.bitmap.close();
      poolRef.current.clear();
      for (const frame of extracted) poolRef.current.set(frame.id, frame);
      setFrames(extracted);
      setFrameIndex(0);
      setSelected(new Set());
      setPast([]);
      setFuture([]);
      setOutWidth(workingBox.width);
      setPlaying(true);
      clearResult();
    } catch (thrown) {
      if ((thrown as Error)?.name !== 'AbortError') {
        setError(t.errorExtract || 'The frames could not be read. The video may use a codec this browser only half-supports.');
      }
    } finally {
      abortRef.current = null;
      setBusy(null);
    }
  };

  const captureFrame = async () => {
    if (!videoHandle) return;
    if (frames.length >= MAX_FRAMES) return;
    const frame = await captureCurrentFrame(videoHandle.video, workingBox.width, workingBox.height, null);
    commit('capture', current => [...current, frame]);
    if (!frames.length) setOutWidth(workingBox.width);
    setFrameIndex(frames.length);
  };

  // Attach the parked <video> only where the layout wants it, without React
  // re-creating the element (which would drop the decoded data on every render).
  useEffect(() => {
    const holder = videoNodeRef.current;
    if (!holder || !videoHandle) return;
    const video = videoHandle.video;
    video.controls = true;
    video.className = 'w-full max-h-[300px] object-contain bg-black rounded-xl';
    holder.appendChild(video);
    return () => {
      if (video.parentNode === holder) holder.removeChild(video);
    };
  }, [videoHandle]);

  // ==========================================================================
  // Encoding
  // ==========================================================================
  const aspect = frames[0] ? frames[0].bitmap.width / frames[0].bitmap.height : 16 / 9;
  const outHeight = Math.max(2, Math.round(outWidth / aspect / 2) * 2);
  const maxOutWidth = frames[0] ? frames[0].bitmap.width : 720;

  const delayFor = useCallback((frame: Frame) => frame.delayMs ?? Math.round(1000 / fps), [fps]);

  /** What GIF's centisecond clock actually delivers, as opposed to what was asked. */
  const effectiveFps = useMemo(() => {
    if (!frames.length) return 0;
    const total = frames.reduce((sum, frame) => sum + msToDelayCs(delayFor(frame)), 0);
    return Math.round((frames.length / (total / 100)) * 10) / 10;
  }, [frames, delayFor]);

  const applyPreset = (next: Preset) => {
    setPreset(next);
    if (next === 'custom') return;
    setColors(PRESETS[next].colors);
    setDither(PRESETS[next].dither);
  };

  const encode = async () => {
    if (!frames.length || busy) return;
    setError(null);
    setPlaying(false);
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy({ phase: 'raster', ratio: 0 });

    try {
      // Rasterising in slices keeps the tab responsive — and lets the cancel
      // button be reachable during the part that allocates the most memory.
      const raster: { rgba: Uint8Array; delayCs: number }[] = [];
      for (let i = 0; i < frames.length; i++) {
        raster.push({
          rgba: frameToRgba(frames[i].bitmap, {
            width: outWidth,
            height: outHeight,
            fit,
            background: keepAlpha ? null : background,
          }),
          delayCs: msToDelayCs(delayFor(frames[i])),
        });
        if (i % 8 === 7) {
          setBusy({ phase: 'raster', ratio: (i + 1) / frames.length });
          await new Promise(resolve => setTimeout(resolve, 0));
          if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError');
        }
      }

      const { blob, stats } = await encodeGif(
        raster,
        {
          width: outWidth,
          height: outHeight,
          colors,
          dither,
          ditherStrength,
          diff,
          tolerance,
          keepAlpha,
          loop: loopForever ? 0 : Math.max(1, loopCount),
        },
        {
          signal: controller.signal,
          onProgress: (ratio, phase) => setBusy({ phase, ratio }),
        }
      );

      const url = URL.createObjectURL(blob);
      const meta: ResultMeta = {
        url,
        blob,
        bytes: stats.bytes,
        width: stats.width,
        height: stats.height,
        frames: stats.frames,
        colors: stats.colors,
        reuse: stats.reuse,
        ms: stats.ms,
        fps: stats.fps,
      };
      setResult(previous => {
        if (previous) URL.revokeObjectURL(previous.url);
        return meta;
      });

      const name = `${(sourceName || 'gif-bolt').replace(/\.[^.]+$/, '')}.gif`;
      setHistory(previous => {
        const entry: HistoryEntry = {
          id: `${Date.now()}`,
          url: URL.createObjectURL(blob),
          blob,
          name,
          bytes: stats.bytes,
          frames: stats.frames,
          createdAt: Date.now(),
        };
        const next = [entry, ...previous];
        for (const dropped of next.slice(6)) URL.revokeObjectURL(dropped.url);
        return next.slice(0, 6);
      });
    } catch (thrown) {
      if ((thrown as Error)?.name !== 'AbortError') {
        setError(t.errorEncode || 'The encode failed. Try fewer frames or a smaller width.');
      }
    } finally {
      abortRef.current = null;
      setBusy(null);
    }
  };

  const cancel = () => abortRef.current?.abort();

  const download = () => {
    if (!result) return;
    const anchor = document.createElement('a');
    anchor.href = result.url;
    anchor.download = `${(sourceName || 'gif-bolt').replace(/\.[^.]+$/, '')}.gif`;
    anchor.click();
  };

  const copyToClipboard = async () => {
    if (!result) return;
    try {
      // Clipboard image support is PNG-only in every browser, so an animated
      // GIF has to go across as a file rather than as an image.
      await navigator.clipboard.write([new ClipboardItem({ 'image/gif': result.blob })]);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError(t.errorClipboard || 'Your browser blocked the clipboard. Download it instead.');
    }
  };

  /** The frame on screen, as a PNG, for the handoff to the image tools. */
  const currentFrameAsPng = useCallback(async (): Promise<{ blob: Blob; name: string } | null> => {
    const frame = frames[frameIndex];
    if (!frame) return null;
    const canvas = document.createElement('canvas');
    canvas.width = outWidth;
    canvas.height = outHeight;
    const context = canvas.getContext('2d');
    if (!context) return null;
    drawFrame(context, frame.bitmap, {
      width: outWidth,
      height: outHeight,
      fit,
      background: keepAlpha ? null : background,
    });
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return null;
    const base = (sourceName || 'gif-bolt').replace(/\.[^.]+$/, '');
    return { blob, name: `${base}-frame-${frameIndex + 1}.png` };
  }, [background, fit, frameIndex, frames, keepAlpha, outHeight, outWidth, sourceName]);

  // ==========================================================================
  // Keyboard
  // ==========================================================================
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (!frames.length) return;

      const meta = event.ctrlKey || event.metaKey;
      if (meta && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if (meta && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
        return;
      }
      if (meta) return;

      switch (event.key) {
        case ' ':
          event.preventDefault();
          setPlaying(value => !value);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          setPlaying(false);
          setFrameIndex(i => (i - 1 + frames.length) % frames.length);
          break;
        case 'ArrowRight':
          event.preventDefault();
          setPlaying(false);
          setFrameIndex(i => (i + 1) % frames.length);
          break;
        case 'Delete':
        case 'Backspace':
          event.preventDefault();
          deleteSelected();
          break;
        case 'a':
        case 'A':
          setSelected(new Set(frames.map(frame => frame.id)));
          break;
        case 'd':
        case 'D':
          setSelected(new Set());
          break;
        case 'Enter':
          event.preventDefault();
          void encode();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ==========================================================================
  // Copy
  // ==========================================================================
  const steps = [
    { art: StepDrop, title: t.step1Title || 'Drop it in', text: t.step1Text || 'A video or a pile of stills. Nothing is uploaded and nothing starts running on its own.' },
    { art: StepTrim, title: t.step2Title || 'Choose the range', text: t.step2Text || 'Set the in and out points and the frame rate, then pull the frames — or grab them one at a time by hand.' },
    { art: StepTune, title: t.step3Title || 'Edit the timeline', text: t.step3Text || 'Delete frames, reverse them, hold one longer, and dial in colours and dithering.' },
    { art: StepExport, title: t.step4Title || 'Encode and check', text: t.step4Text || 'Hold Alt over the preview to compare the GIF against the source, then download or send it on.' },
  ];

  const featureIcons = [IconPalette, IconDelta, IconDither, IconTimeline, IconThreads, IconLocal, IconHandoff];
  const features: { title: string; text: string }[] = Array.isArray(t.features) ? t.features : [];
  const faqs = Array.isArray(t.faq) ? t.faq : [];
  const keywords = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];
  const shortcuts: { keys: string; label: string }[] = Array.isArray(t.shortcuts) ? t.shortcuts : [];

  const hasFrames = frames.length > 0;
  const phaseLabel = busy
    ? busy.phase === 'extract'
      ? t.text_progress_extract || 'Extracting frames…'
      : busy.phase === 'raster'
      ? t.phaseRaster || 'Preparing frames…'
      : busy.phase === 'palette'
      ? t.phasePalette || 'Building the palette…'
      : t.text_progress_compile || 'Compiling frames…'
    : '';

  return (
    <div className="min-h-screen flex flex-col bg-[#060406] text-slate-100 selection:bg-fuchsia-500/30 overflow-x-hidden font-sans">
      <Header
        currentLang={lang}
        onLanguageChange={newLang => (window.location.href = `/${newLang.toLowerCase()}/gif-bolt`)}
        onReset={() => {
          for (const frame of poolRef.current.values()) frame.bitmap.close();
          poolRef.current.clear();
          setFrames([]);
          setSelected(new Set());
          setPast([]);
          setFuture([]);
          videoHandle?.release();
          setVideoHandle(null);
          setSourceName('');
          setManualMode(false);
          clearResult();
          setError(null);
        }}
        t={t}
      />

      {/* The max width lives on <main> on purpose: AdRail measures this element
          to decide whether the fixed side rails fit. */}
      <main className="flex-1 flex flex-col items-center pt-40 md:pt-36 pb-32 px-4 md:px-12 relative z-10 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))]">
        <AdBanner id="adsense-gif-bolt-top" />

        <div className="w-full space-y-20 md:space-y-28">
          {/* ================================================================ */}
          {/* Hero                                                             */}
          {/* ================================================================ */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center pt-2">
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex max-w-full items-center gap-2 px-4 py-2 rounded-full bg-fuchsia-950/40 border border-fuchsia-800/30 text-fuchsia-400 text-[11px] font-black tracking-[0.2em] uppercase shadow-[0_0_25px_rgba(217,70,239,0.15)]">
                <Film className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.badge || t.title}</span>
              </div>

              <h1 className="text-4xl md:text-6xl xl:text-7xl font-black tracking-tight leading-[0.95] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-400">
                {t.seoHeroTitle}
              </h1>

              <p className="text-slate-400 text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">{t.description}</p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                {(t.seoHeroList || []).slice(0, 3).map((point: string, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-300"
                  >
                    <Check className="w-3.5 h-3.5 text-fuchsia-400 stroke-[3]" />
                    {point}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-fuchsia-500/10 blur-[80px] rounded-full" />
              <GifHeroArt
                className="relative w-full max-w-lg mx-auto drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
                animated={!prefersReduced}
              />
            </div>
          </section>

          {/* ================================================================ */}
          {/* Workspace                                                        */}
          {/* ================================================================ */}
          <section className="space-y-5">
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-200 text-sm font-medium">
                <span className="flex-1">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="shrink-0 text-red-300 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
                  aria-label={t.dismissLabel || 'Dismiss'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {!videoHandle && !hasFrames ? (
              /* ---------------- Empty state ---------------- */
              <div
                onDrop={onDrop}
                onDragOver={event => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`rounded-3xl border-2 border-dashed p-10 md:p-16 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all ${
                  dragging ? 'border-fuchsia-500/60 bg-fuchsia-500/5' : 'border-white/10 hover:border-fuchsia-500/40 bg-black/20 hover:bg-black/40'
                }`}
              >
                <div className="flex items-end gap-6 md:gap-10 text-fuchsia-400">
                  <DropVideoArt className="w-24 md:w-32 h-auto" animated={!prefersReduced} />
                  <DropImagesArt className="w-24 md:w-32 h-auto" animated={!prefersReduced} />
                </div>
                <div className="space-y-1.5 text-center">
                  <p className="text-base font-black text-white uppercase tracking-wider">
                    {t.dropTitle || 'Drop a video or a set of images'}
                  </p>
                  <p className="text-xs text-slate-500 font-medium max-w-md">
                    {t.drop_zone_video || 'MP4, WebM, MOV, MKV — or PNG, JPG, WebP, AVIF, GIF and HEIC stills.'}
                  </p>
                  <p className="text-[11px] text-slate-600 font-medium">
                    {t.dropHintNothing || 'Dropping a file does not start anything: you pick the settings and press the button.'}
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={`${ACCEPTED_VIDEO},${ACCEPTED_IMAGE}`}
                  className="hidden"
                  onChange={event => {
                    intake(Array.from(event.target.files || []));
                    event.target.value = '';
                  }}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* ------------- Left: source + stage + strip ------------- */}
                <div className="lg:col-span-8 flex flex-col gap-5 min-w-0">
                  {videoHandle && (
                    <div className="glass-card rounded-3xl p-4 md:p-6 space-y-4 border border-white/5">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <span className="text-[10px] font-black text-fuchsia-400 uppercase tracking-wider block">
                            {t.tab_video || 'Video to GIF'}
                          </span>
                          <h2 className="text-sm font-bold text-white truncate max-w-[240px] sm:max-w-none">{sourceName}</h2>
                        </div>
                        <div className="text-[10px] font-mono font-bold text-slate-500">
                          {videoHandle.width}×{videoHandle.height} · {formatTimecode(videoHandle.duration)}
                        </div>
                      </div>

                      <div ref={videoNodeRef} className="rounded-xl overflow-hidden" />

                      <div className="flex flex-wrap gap-2">
                        <Segmented
                          options={[
                            { value: 'auto', label: t.modeAuto || 'Pull a range' },
                            { value: 'manual', label: t.modeManual || 'Pick frames by hand' },
                          ]}
                          value={manualMode ? 'manual' : 'auto'}
                          onChange={value => setManualMode(value === 'manual')}
                        />
                      </div>

                      {manualMode ? (
                        <div className="space-y-3">
                          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                            {t.manualHint || 'Scrub the video and add exactly the frames you want. No automatic pass runs at all.'}
                          </p>
                          <button
                            onClick={() => void captureFrame()}
                            disabled={frames.length >= MAX_FRAMES}
                            className="w-full py-3 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-none"
                          >
                            <Crosshair className="w-4 h-4" />
                            {t.btnCapture || 'Capture this frame'}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Slider
                              label={t.label_start || 'Start Time'}
                              value={`${start.toFixed(1)}s`}
                              min={0}
                              max={videoHandle.duration}
                              step={0.1}
                              current={start}
                              onChange={value => {
                                const next = Math.min(value, end - 0.1);
                                setStart(Math.max(0, next));
                                videoHandle.video.currentTime = Math.max(0, next);
                              }}
                            />
                            <Slider
                              label={t.label_end || 'End Time'}
                              value={`${end.toFixed(1)}s`}
                              min={0}
                              max={videoHandle.duration}
                              step={0.1}
                              current={end}
                              onChange={value => {
                                const next = Math.max(value, start + 0.1);
                                setEnd(Math.min(videoHandle.duration, next));
                                videoHandle.video.currentTime = Math.min(videoHandle.duration, next);
                              }}
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Slider
                              label={t.label_fps || 'Frame Rate (FPS)'}
                              value={`${fps} fps`}
                              min={2}
                              max={50}
                              step={0.01}
                              current={fps}
                              onChange={value => setFps(snapFps(value))}
                            />
                            <Field label={t.labelWorkingSize || 'Working size'}>
                              <select
                                value={workingSize}
                                onChange={event => setWorkingSize(Number(event.target.value))}
                                className="w-full h-11 bg-[#0a060c] border border-white/10 rounded-xl px-3 text-xs font-bold text-slate-200 outline-none focus:border-fuchsia-500 cursor-pointer"
                              >
                                {WORKING_SIZES.map(size => (
                                  <option key={size} value={size} className="bg-[#0a060c]">
                                    {size} px
                                  </option>
                                ))}
                              </select>
                            </Field>
                          </div>

                          <p className="text-[11px] text-slate-500 font-medium">
                            {(t.extractSummary || '{0} frames at {1}×{2}. The GIF can only be scaled down from here.')
                              .replace('{0}', String(plannedFrames))
                              .replace('{1}', String(workingBox.width))
                              .replace('{2}', String(workingBox.height))}
                          </p>

                          <button
                            onClick={() => void extract()}
                            disabled={!!busy}
                            className="w-full py-3.5 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 disabled:cursor-wait flex items-center justify-center gap-2 border-none shadow-lg shadow-fuchsia-500/20"
                          >
                            <Scissors className="w-4 h-4" />
                            {hasFrames ? t.btnExtractAgain || 'Pull these frames again' : t.btnExtract || 'Pull the frames'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {hasFrames && (
                    <div className="glass-card rounded-3xl p-4 md:p-6 space-y-4 border border-white/5">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <IconButton onClick={() => setPlaying(value => !value)} label={playing ? t.btnPause || 'Pause' : t.btnPlay || 'Play'}>
                            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </IconButton>
                          <IconButton
                            onClick={() => {
                              setPlaying(false);
                              setFrameIndex(i => (i - 1 + frames.length) % frames.length);
                            }}
                            label={t.btnPrevFrame || 'Previous frame'}
                          >
                            <ChevronsLeft className="w-3.5 h-3.5" />
                          </IconButton>
                          <IconButton
                            onClick={() => {
                              setPlaying(false);
                              setFrameIndex(i => (i + 1) % frames.length);
                            }}
                            label={t.btnNextFrame || 'Next frame'}
                          >
                            <ChevronsRight className="w-3.5 h-3.5" />
                          </IconButton>
                          <span className="w-px h-5 bg-white/10 mx-1" />
                          <IconButton onClick={undo} disabled={!past.length} label={t.btnUndo || 'Undo'}>
                            <Undo2 className="w-3.5 h-3.5" />
                          </IconButton>
                          <IconButton onClick={redo} disabled={!future.length} label={t.btnRedo || 'Redo'}>
                            <Redo2 className="w-3.5 h-3.5" />
                          </IconButton>
                        </div>
                        <div className="text-[10px] font-mono font-bold text-slate-500 tabular-nums">
                          {(t.frameSummary || '{0} frames · {1} fps real')
                            .replace('{0}', String(frames.length))
                            .replace('{1}', String(effectiveFps))}
                        </div>
                      </div>

                      <Stage
                        frames={frames}
                        index={frameIndex}
                        playing={playing && !busy}
                        width={outWidth}
                        height={outHeight}
                        fit={fit}
                        background={keepAlpha ? null : background}
                        resultUrl={result?.url ?? null}
                        onIndexChange={setFrameIndex}
                        delayFor={delayFor}
                        t={t}
                      />

                      <Filmstrip
                        frames={frames}
                        index={frameIndex}
                        selected={selected}
                        onIndexChange={index => {
                          setPlaying(false);
                          setFrameIndex(index);
                        }}
                        onSelectionChange={setSelected}
                        delayFor={delayFor}
                        t={t}
                      />

                      <div className="flex flex-wrap gap-2">
                        <SmallButton onClick={() => setSelected(new Set(frames.map(frame => frame.id)))} icon={<SquareStack className="w-3.5 h-3.5" />}>
                          {t.btnSelectAll || 'Select all'}
                        </SmallButton>
                        <SmallButton onClick={() => setSelected(new Set())} disabled={!selected.size} icon={<X className="w-3.5 h-3.5" />}>
                          {t.btnSelectNone || 'Deselect'}
                        </SmallButton>
                        <SmallButton onClick={deleteSelected} disabled={frames.length < 2} icon={<Trash2 className="w-3.5 h-3.5" />}>
                          {(t.btnDeleteSelected || 'Delete {0}').replace('{0}', String(selected.size || 1))}
                        </SmallButton>
                        <SmallButton onClick={keepSelected} disabled={!selected.size} icon={<Scissors className="w-3.5 h-3.5" />}>
                          {t.btnKeepSelected || 'Keep only these'}
                        </SmallButton>
                        <SmallButton onClick={reverse} icon={<RotateCcw className="w-3.5 h-3.5" />}>
                          {t.btnReverse || 'Reverse'}
                        </SmallButton>
                        <SmallButton onClick={pingPong} disabled={frames.length * 2 > MAX_FRAMES} icon={<RotateCcw className="w-3.5 h-3.5" />}>
                          {t.btnPingPong || 'Ping-pong'}
                        </SmallButton>
                        <SmallButton onClick={dropEveryOther} disabled={frames.length < 4} icon={<Scissors className="w-3.5 h-3.5" />}>
                          {t.btnHalve || 'Drop every other'}
                        </SmallButton>
                        <SmallButton onClick={() => addImagesRef.current?.click()} icon={<Images className="w-3.5 h-3.5" />}>
                          {t.btnAddImages || 'Add stills'}
                        </SmallButton>
                        <input
                          ref={addImagesRef}
                          type="file"
                          multiple
                          accept={ACCEPTED_IMAGE}
                          className="hidden"
                          onChange={event => {
                            void addImages(Array.from(event.target.files || []));
                            event.target.value = '';
                          }}
                        />
                      </div>

                      <div className="flex flex-wrap items-end gap-3 border-t border-white/5 pt-4">
                        <div className="flex-1 min-w-[180px]">
                          <Slider
                            label={t.label_duration || 'Frame Delay (ms)'}
                            value={`${msToDelayCs(delayFor(frames[frameIndex] ?? frames[0])) * 10} ms`}
                            min={20}
                            max={2000}
                            step={10}
                            current={delayFor(frames[frameIndex] ?? frames[0])}
                            onChange={applyDelay}
                          />
                        </div>
                        <SmallButton onClick={clearDelays} icon={<RotateCcw className="w-3.5 h-3.5" />}>
                          {t.btnResetDelays || 'Reset the timing'}
                        </SmallButton>
                      </div>
                      <p className="text-[10px] text-slate-600 font-medium">
                        {t.delayHint || 'GIF stores delays in hundredths of a second, so the value snaps to the nearest 10 ms and never goes under 20.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* ------------- Right: settings, encode, result ------------- */}
                <div className="lg:col-span-4 flex flex-col gap-5 min-w-0">
                  {hasFrames && (
                    <div className="glass-card rounded-3xl p-5 md:p-6 space-y-5 border border-white/5">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-fuchsia-500" />
                        {t.outputTitle || 'Output'}
                      </div>

                      <Slider
                        label={t.label_size || 'GIF Width'}
                        value={`${outWidth}×${outHeight}`}
                        min={64}
                        max={maxOutWidth}
                        step={2}
                        current={outWidth}
                        onChange={value => {
                          setOutWidth(Math.min(maxOutWidth, Math.max(64, Math.round(value / 2) * 2)));
                          clearResult();
                        }}
                      />

                      <Field label={t.label_quality || 'Compression Quality'}>
                        <select
                          value={preset}
                          onChange={event => applyPreset(event.target.value as Preset)}
                          className="w-full h-11 bg-[#0a060c] border border-white/10 rounded-xl px-3 text-xs font-bold text-slate-200 outline-none focus:border-fuchsia-500 cursor-pointer"
                        >
                          <option value="high" className="bg-[#0a060c]">{t.quality_high || 'High Quality'}</option>
                          <option value="medium" className="bg-[#0a060c]">{t.quality_medium || 'Medium Quality'}</option>
                          <option value="low" className="bg-[#0a060c]">{t.quality_low || 'Low Quality (Fast)'}</option>
                          <option value="custom" className="bg-[#0a060c]">{t.qualityCustom || 'Custom'}</option>
                        </select>
                      </Field>

                      <Toggle
                        label={t.labelDiff || 'Reuse unchanged pixels'}
                        hint={t.diffHint || 'Writes only what moved between frames. The single biggest saving on screen recordings.'}
                        checked={diff && !keepAlpha}
                        disabled={keepAlpha}
                        onChange={value => {
                          setDiff(value);
                          clearResult();
                        }}
                      />

                      <button
                        onClick={() => setShowAdvanced(value => !value)}
                        className="text-[10px] font-black uppercase tracking-widest text-fuchsia-400 hover:text-fuchsia-300 transition-colors cursor-pointer bg-transparent border-none p-0"
                      >
                        {showAdvanced ? t.hideAdvanced || 'Hide the fine print' : t.showAdvanced || 'Fine-tune it'}
                      </button>

                      {showAdvanced && (
                        <div className="space-y-4 pt-1">
                          <Slider
                            label={t.labelColors || 'Palette size'}
                            value={`${colors}`}
                            min={2}
                            max={256}
                            step={1}
                            current={colors}
                            onChange={value => {
                              setColors(value);
                              setPreset('custom');
                              clearResult();
                            }}
                          />
                          <Toggle
                            label={t.labelDither || 'Dithering'}
                            hint={t.ditherHint || 'Trades a little noise for the banding a flat palette leaves on gradients.'}
                            checked={dither}
                            onChange={value => {
                              setDither(value);
                              setPreset('custom');
                              clearResult();
                            }}
                          />
                          {dither && (
                            <Slider
                              label={t.labelDitherStrength || 'Dither strength'}
                              value={`${Math.round(ditherStrength * 100)}%`}
                              min={0.1}
                              max={1}
                              step={0.05}
                              current={ditherStrength}
                              onChange={value => {
                                setDitherStrength(value);
                                clearResult();
                              }}
                            />
                          )}
                          {diff && !keepAlpha && (
                            <Slider
                              label={t.labelTolerance || 'Pixel tolerance'}
                              value={`±${tolerance}`}
                              min={0}
                              max={32}
                              step={1}
                              current={tolerance}
                              onChange={value => {
                                setTolerance(value);
                                clearResult();
                              }}
                            />
                          )}
                          <Toggle
                            label={t.labelAlpha || 'Keep transparency'}
                            hint={t.alphaHint || 'Carries transparent pixels over as GIF’s 1-bit alpha. Cannot be combined with pixel reuse.'}
                            checked={keepAlpha}
                            onChange={value => {
                              setKeepAlpha(value);
                              clearResult();
                            }}
                          />
                          {!keepAlpha && (
                            <Field label={t.labelBackground || 'Background'}>
                              <input
                                type="color"
                                value={background}
                                onChange={event => {
                                  setBackground(event.target.value);
                                  clearResult();
                                }}
                                className="w-full h-11 bg-[#0a060c] border border-white/10 rounded-xl px-1.5 cursor-pointer"
                              />
                            </Field>
                          )}
                          <Field label={t.labelFit || 'When the shapes disagree'}>
                            <select
                              value={fit}
                              onChange={event => {
                                setFit(event.target.value as FitMode);
                                clearResult();
                              }}
                              className="w-full h-11 bg-[#0a060c] border border-white/10 rounded-xl px-3 text-xs font-bold text-slate-200 outline-none focus:border-fuchsia-500 cursor-pointer"
                            >
                              <option value="contain" className="bg-[#0a060c]">{t.fitContain || 'Fit with margins'}</option>
                              <option value="cover" className="bg-[#0a060c]">{t.fitCover || 'Fill and crop'}</option>
                              <option value="stretch" className="bg-[#0a060c]">{t.fitStretch || 'Stretch'}</option>
                            </select>
                          </Field>
                          <Toggle
                            label={t.labelLoop || 'Loop forever'}
                            hint={t.loopHint || 'Off plays it a fixed number of times and stops on the last frame.'}
                            checked={loopForever}
                            onChange={value => {
                              setLoopForever(value);
                              clearResult();
                            }}
                          />
                          {!loopForever && (
                            <Slider
                              label={t.labelLoopCount || 'Plays'}
                              value={`${loopCount}`}
                              min={1}
                              max={20}
                              step={1}
                              current={loopCount}
                              onChange={value => {
                                setLoopCount(value);
                                clearResult();
                              }}
                            />
                          )}
                        </div>
                      )}

                      {busy ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                            <span>{phaseLabel}</span>
                            <span className="text-fuchsia-400 font-mono tabular-nums">{Math.round(busy.ratio * 100)}%</span>
                          </div>
                          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-600 rounded-full transition-[width] duration-200"
                              style={{ width: `${Math.round(busy.ratio * 100)}%` }}
                            />
                          </div>
                          <button
                            onClick={cancel}
                            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer"
                          >
                            {t.btnCancel || 'Cancel'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => void encode()}
                          className="w-full py-4 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-400 hover:to-purple-500 text-black font-black text-sm uppercase tracking-wider transition-all cursor-pointer active:scale-[0.98] border-none shadow-lg shadow-fuchsia-500/20"
                        >
                          {t.btn_generate || 'Generate GIF'}
                        </button>
                      )}
                    </div>
                  )}

                  {result && (
                    <div className="glass-card rounded-3xl p-5 md:p-6 space-y-4 border border-white/5">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {t.resultTitle || 'Result'}
                      </div>

                      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                        <Stat label={t.statSize || 'Weight'} value={formatBytes(result.bytes)} highlight />
                        <Stat label={t.statFrames || 'Frames'} value={String(result.frames)} />
                        <Stat label={t.statSizePx || 'Size'} value={`${result.width}×${result.height}`} />
                        <Stat label={t.statColors || 'Colours'} value={String(result.colors)} />
                        <Stat label={t.statReuse || 'Pixels reused'} value={`${Math.round(result.reuse * 100)}%`} />
                        <Stat label={t.statTime || 'Encoded in'} value={`${(result.ms / 1000).toFixed(1)}s`} />
                        <Stat label={t.statFps || 'Real frame rate'} value={`${result.fps} fps`} />
                        <Stat label={t.statPerFrame || 'Per frame'} value={formatBytes(Math.round(result.bytes / Math.max(1, result.frames)))} />
                      </dl>

                      <div className="flex gap-2">
                        <button
                          onClick={download}
                          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-fuchsia-500 hover:bg-fuchsia-400 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer border-none"
                        >
                          <Download className="w-4 h-4" />
                          {t.btn_download || 'Download GIF'}
                        </button>
                        <button
                          onClick={() => void copyToClipboard()}
                          title={t.btnCopy || 'Copy'}
                          aria-label={t.btnCopy || 'Copy'}
                          className="px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                        >
                          {copied ? <Check className="w-4 h-4 text-fuchsia-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>

                      <NextStepBar lang={lang} t={t} getResult={currentFrameAsPng} />
                    </div>
                  )}

                  {history.length > 0 && (
                    <div className="glass-card rounded-3xl p-5 space-y-3 border border-white/5">
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {t.history_title || 'Recent GIF History'}
                        </span>
                        <button
                          onClick={() => {
                            for (const entry of history) URL.revokeObjectURL(entry.url);
                            setHistory([]);
                          }}
                          className="text-[10px] font-bold text-red-400 hover:text-red-300 bg-transparent border-none cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          {t.clear_history || 'Clear History'}
                        </button>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {history.map(entry => (
                          <a
                            key={entry.id}
                            href={entry.url}
                            download={entry.name}
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-fuchsia-500/30 transition-all group no-underline"
                          >
                            <Film className="w-4 h-4 text-fuchsia-400 shrink-0" />
                            <span className="flex-1 min-w-0 text-xs font-bold text-slate-300 truncate">{entry.name}</span>
                            <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0 tabular-nums">
                              {formatBytes(entry.bytes)}
                            </span>
                            <Download className="w-3.5 h-3.5 text-slate-600 group-hover:text-fuchsia-400 transition-colors shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {!hasFrames && videoHandle && (
                    <div className="glass-card rounded-3xl p-6 border border-white/5 text-center space-y-3">
                      <Loader2 className={`w-8 h-8 mx-auto text-fuchsia-400 ${busy ? 'animate-spin' : 'opacity-30'}`} />
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        {busy ? phaseLabel : t.waitingHint || 'Set the range and press the button. Nothing runs until you do.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {hasFrames && shortcuts.length > 0 && (
              <div className="rounded-2xl border border-white/5 bg-black/20 p-4 flex flex-wrap gap-x-5 gap-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  {t.shortcutsTitle || 'Shortcuts'}
                </span>
                {shortcuts.map((shortcut, i) => (
                  <span key={i} className="text-[11px] text-slate-500 font-medium">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 font-mono text-[10px]">
                      {shortcut.keys}
                    </kbd>{' '}
                    {shortcut.label}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* ================================================================ */}
          {/* How it works                                                     */}
          {/* ================================================================ */}
          <section className="space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                {t.howItWorksTitle || 'How it works'}
              </h2>
              <div className="h-1 w-16 bg-fuchsia-500 mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {steps.map((step, i) => {
                const Art = step.art;
                return (
                  <div
                    key={i}
                    className="relative glass-card rounded-3xl p-6 space-y-4 border border-white/5 hover:border-fuchsia-500/20 transition-all group"
                  >
                    <span className="absolute top-5 right-6 text-5xl font-black text-white/5 group-hover:text-fuchsia-500/10 transition-colors">
                      {i + 1}
                    </span>
                    <Art className="w-24 h-auto text-fuchsia-400" />
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
          {features.length > 0 && (
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((feature, idx) => {
                const Icon = featureIcons[idx] || IconPalette;
                return (
                  <div
                    key={idx}
                    className="p-7 glass-card rounded-3xl text-left hover:-translate-y-1.5 transition-all duration-300 group border border-white/5"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 mb-5 group-hover:scale-110 group-hover:border-fuchsia-500/40 transition-all">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-white text-lg font-bold mb-2.5 group-hover:text-fuchsia-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">{feature.text}</p>
                  </div>
                );
              })}
            </section>
          )}

          {/* ================================================================ */}
          {/* SEO content                                                      */}
          {/* ================================================================ */}
          <section className="space-y-24 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-24 items-center">
              <div className="space-y-7">
                {keywords[0] && (
                  <div className="inline-block px-4 py-1.5 rounded-lg bg-fuchsia-500/10 text-fuchsia-400 text-[11px] font-black uppercase tracking-[0.2em] border border-fuchsia-500/20">
                    {keywords[0]}
                  </div>
                )}
                <h2 className="text-3xl md:text-5xl font-black text-white leading-[1.05] tracking-tighter">
                  {t.seoBrowserSpeedTitle}
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed font-medium">{t.seoBrowserSpeedText}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(t.seoHeroList || []).map((point: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all"
                    >
                      <span className="w-7 h-7 shrink-0 bg-fuchsia-500/20 text-fuchsia-400 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                      <span className="text-slate-300 font-bold text-sm">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative glass-card rounded-[3rem] p-10 py-16 min-h-[400px] flex flex-col items-center justify-center gap-7 text-center overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-fuchsia-500/10 rounded-full blur-3xl" />
                <IconDelta className="w-20 h-20 text-fuchsia-400 relative" />
                <div className="space-y-3 max-w-sm relative">
                  <h3 className="text-2xl font-black text-white tracking-tight leading-tight">{t.seoUseCaseTitle}</h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">{t.seoUseCaseText}</p>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-14 rounded-3xl md:rounded-[2.5rem] bg-[#120a16] border border-white/5 space-y-10">
              <div className="max-w-4xl space-y-4">
                <h2 className="text-2xl md:text-4xl font-black text-white leading-tight">{t.seoPrivacyTitle}</h2>
                <div className="h-1.5 w-20 bg-fuchsia-500 rounded-full" />
              </div>
              <p className="text-slate-400 text-base leading-relaxed font-medium max-w-4xl">{t.seoPrivacyText}</p>
            </div>

            {faqs.length > 0 && (
              <div className="max-w-4xl mx-auto w-full space-y-10">
                <div className="text-center space-y-3">
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{t.faqTitle}</h2>
                  <div className="h-1 w-16 bg-fuchsia-500 mx-auto rounded-full" />
                </div>
                <div className="grid gap-3">
                  {faqs.map((faq: any, idx: number) => (
                    <details
                      key={idx}
                      className="glass-card rounded-2xl px-6 py-5 text-left border border-white/5 hover:border-fuchsia-500/20 transition-colors group [&_summary::-webkit-details-marker]:hidden"
                    >
                      <summary className="flex items-start gap-3 cursor-pointer list-none text-base font-bold text-white group-hover:text-fuchsia-400 transition-colors">
                        <span className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400 text-[11px] font-black">
                          Q
                        </span>
                        <span className="flex-1">{faq.question}</span>
                        <span className="shrink-0 text-fuchsia-400 transition-transform group-open:rotate-45 text-xl leading-none">
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
                  {t.seoKeywordsTitle || 'Related searches'}
                </h2>
                <div className="flex flex-wrap justify-center gap-2">
                  {keywords.map((keyword: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 hover:bg-fuchsia-500/10 hover:border-fuchsia-500/20 hover:text-fuchsia-400 transition-all cursor-default"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <AdBanner id="adsense-gif-bolt-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={modal => setActiveModal(modal)} />

      <LegalModal
        isOpen={!!activeModal}
        onClose={() => setActiveModal(null)}
        title={
          activeModal === 'privacy'
            ? legalTranslations[lang]?.privacy.title || 'Privacy Policy'
            : activeModal === 'terms'
            ? legalTranslations[lang]?.terms.title || 'Terms of Service'
            : legalTranslations[lang]?.cookies.title || 'Cookie Policy'
        }
        content={
          activeModal === 'privacy'
            ? legalTranslations[lang]?.privacy.content || ''
            : activeModal === 'terms'
            ? legalTranslations[lang]?.terms.content || ''
            : legalTranslations[lang]?.cookies.content || ''
        }
        t={t}
      />
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

const Slider: React.FC<{
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  current: number;
  onChange: (value: number) => void;
}> = ({ label, value, min, max, step, current, onChange }) => (
  <div className="space-y-2">
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">{label}</span>
      <span className="text-[11px] font-mono font-bold text-fuchsia-400 shrink-0 tabular-nums">{value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={current}
      onChange={event => onChange(parseFloat(event.target.value))}
      className="w-full accent-fuchsia-500 cursor-pointer"
    />
  </div>
);

const Toggle: React.FC<{
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}> = ({ label, hint, checked, disabled, onChange }) => (
  <label className={`flex items-start gap-3 ${disabled ? 'opacity-40' : 'cursor-pointer'}`}>
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={event => onChange(event.target.checked)}
      className="mt-0.5 w-4 h-4 accent-fuchsia-500 shrink-0 cursor-pointer disabled:cursor-not-allowed"
    />
    <span className="min-w-0">
      <span className="block text-[11px] font-bold text-slate-300 leading-tight">{label}</span>
      {hint && <span className="block text-[10px] text-slate-600 font-medium leading-snug mt-1">{hint}</span>}
    </span>
  </label>
);

const Segmented: React.FC<{
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}> = ({ options, value, onChange }) => (
  <div className="inline-flex flex-wrap gap-1 p-1 rounded-xl bg-black/40 border border-white/10">
    {options.map(option => (
      <button
        key={option.value}
        onClick={() => onChange(option.value)}
        className={`px-3.5 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer border-none ${
          value === option.value ? 'bg-fuchsia-500 text-black' : 'bg-transparent text-slate-400 hover:text-white'
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
);

const IconButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}> = ({ onClick, disabled, label, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={label}
    aria-label={label}
    className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
  >
    {children}
  </button>
);

const SmallButton: React.FC<{
  onClick: () => void;
  icon: React.ReactNode;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ onClick, icon, disabled, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-bold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed min-w-0"
  >
    <span className="text-fuchsia-400 shrink-0">{icon}</span>
    <span className="truncate">{children}</span>
  </button>
);

const Stat: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div className="flex items-baseline justify-between gap-2 min-w-0">
    <dt className="text-slate-500 font-bold uppercase tracking-wider text-[9px] truncate">{label}</dt>
    <dd className={`font-mono font-bold shrink-0 tabular-nums ${highlight ? 'text-fuchsia-400' : 'text-slate-300'}`}>
      {value}
    </dd>
  </div>
);

export default GIFBolt;
