import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Captions,
  Check,
  Cpu,
  Download,
  FileAudio,
  FileText,
  History,
  Loader2,
  Mic2,
  Redo2,
  Server,
  Sparkles,
  Trash2,
  Undo2,
  Upload,
  Volume2,
  Wand2,
  X,
} from 'lucide-react';
import { createTranslator } from '../../locales/meta';
import { AdBanner } from '../../components/shared/AdBanner';
import { useHandoffIntake } from '../../lib/useHandoff';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { NextStepBar } from './components/NextStepBar';
import { Player } from './components/Player';
import { ScriptEditor } from './components/ScriptEditor';
import { VoicePicker } from './components/VoicePicker';
import {
  IconBlockRender,
  IconCaptions,
  IconMultiVoice,
  IconNeuralVoice,
  IconOffline,
  IconProsody,
  StepExportArt,
  StepRenderArt,
  StepVoiceArt,
  StepWriteArt,
  VoiceHeroArt,
} from './components/Illustrations';
import { legalTranslations } from '../../locales/legal';
import { MAX_BLOCK_CHARS, TTSError, fetchVoices, synthesize } from './lib/api';
import { computePeaks, concatBuffers, concatMp3, decodeAudio, encodeWav, formatClock } from './lib/audio';
import { activeWordIndex, buildCues, toSrt, toVtt } from './lib/captions';
import { deviceSupported, speak, stopSpeaking, subscribeDeviceVoices, type DeviceVoice } from './lib/device';
import {
  blocksToText,
  charCount,
  emptyBlock,
  emptyUndo,
  newId,
  pushUndo,
  redo as redoStack,
  resolve,
  signatureOf,
  stripSubtitleMarkup,
  textToBlocks,
  undo as undoStack,
  wordCount,
  type UndoStack,
} from './lib/script';
import type { Block, BlockStatus, Engine, HistoryEntry, NeuralVoice, RenderedBlock, Timeline, TimelineMark } from './types';

interface TTSBoltProps {
  lang: string;
  dictionary: any;
}

const HISTORY_KEY = 'tts_bolt_history_v2';
const HISTORY_LIMIT = 12;
/** Past this the render is dozens of requests; worth saying so out loud. */
const LONG_SCRIPT_CHARS = 20000;
const ACCEPTED_INPUT = '.txt,.md,.markdown,.srt,.vtt,.text,text/plain,text/markdown';

/** Sample line used by the voice previewer, per UI language. */
const PREVIEW_LINE: Record<string, string> = {
  en: 'This is how I sound. Paste your script and press Generate.',
  es: 'Así es como sueno. Pega tu texto y pulsa Generar.',
  fr: 'Voici ma voix. Collez votre texte puis lancez la génération.',
  de: 'So klinge ich. Fügen Sie Ihren Text ein und starten Sie.',
  pt: 'É assim que eu soo. Cole o seu texto e clique em Gerar.',
  ru: 'Вот так я звучу. Вставьте текст и нажмите «Создать».',
  hi: 'मेरी आवाज़ ऐसी है। अपना पाठ चिपकाएँ और जनरेट दबाएँ।',
  ja: 'これが私の声です。原稿を貼り付けて生成を押してください。',
  zh: '这就是我的声音。粘贴你的文本并点击生成。',
};

/** Best default voice for a UI language, in preference order. */
const DEFAULT_LOCALE: Record<string, string> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  pt: 'pt-BR',
  ru: 'ru-RU',
  hi: 'hi-IN',
  ja: 'ja-JP',
  zh: 'zh-CN',
};

const download = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

/**
 * Drives the playhead. requestAnimationFrame is suspended in background tabs
 * (and reports `document.hidden` permanently in some embedded browsers), which
 * would freeze the clock at zero, so a timer takes over whenever the page is
 * not visible.
 */
function useTicker(active: boolean, onTick: () => void) {
  const handler = useRef(onTick);
  handler.current = onTick;

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    let timer: ReturnType<typeof setInterval> | undefined;

    const loop = () => {
      handler.current();
      frame = requestAnimationFrame(loop);
    };

    if (document.hidden) {
      timer = setInterval(() => handler.current(), 100);
    } else {
      frame = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(frame);
      if (timer) clearInterval(timer);
    };
  }, [active]);
}

export const TTSBolt: React.FC<TTSBoltProps> = ({ lang, dictionary }) => {
  const t = createTranslator(dictionary);
  const uiLang = (lang || 'en').toLowerCase();

  // --- script ---------------------------------------------------------------
  const [blocks, setBlocks] = useState<Block[]>(() => [emptyBlock()]);
  const [undoState, setUndoState] = useState<UndoStack>(emptyUndo);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // --- engine + voices ------------------------------------------------------
  const [engine, setEngine] = useState<Engine>('neural');
  const [voices, setVoices] = useState<NeuralVoice[]>([]);
  const [neuralAvailable, setNeuralAvailable] = useState<boolean | null>(null);
  const [deviceVoices, setDeviceVoices] = useState<DeviceVoice[]>([]);
  const [deviceVoiceName, setDeviceVoiceName] = useState<string>('');
  const [defaultVoice, setDefaultVoice] = useState<string>('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(100);
  const [quality, setQuality] = useState<'mp3-96' | 'mp3-48'>('mp3-96');

  // --- render ---------------------------------------------------------------
  const rendersRef = useRef<Map<string, RenderedBlock>>(new Map());
  const [status, setStatus] = useState<Record<string, BlockStatus>>({});
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const abortRef = useRef<AbortController | null>(null);

  // --- playback -------------------------------------------------------------
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const anchorRef = useRef({ ctxTime: 0, offset: 0 });
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [devicePreviewing, setDevicePreviewing] = useState(false);

  // --- ui -------------------------------------------------------------------
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [picker, setPicker] = useState<null | { target: 'default' | string }>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'privacy' | 'terms' | 'cookies'>('privacy');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prefersReduced = useRef(false);

  const defaults = useMemo(
    () => ({ voice: defaultVoice, rate, pitch, volume }),
    [defaultVoice, rate, pitch, volume]
  );

  // ==========================================================================
  // Bootstrapping
  // ==========================================================================
  useEffect(() => {
    prefersReduced.current =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchVoices(controller.signal)
      .then(list => {
        setVoices(list);
        setNeuralAvailable(true);
        setDefaultVoice(prev => {
          if (prev && list.some(v => v.shortName === prev)) return prev;
          const locale = DEFAULT_LOCALE[uiLang] || 'en-US';
          const sameLocale = list.filter(v => v.locale === locale);
          const sameLanguage = list.filter(v => v.language === uiLang);
          const pick = sameLocale[0] || sameLanguage[0] || list.find(v => v.locale === 'en-US') || list[0];
          return pick ? pick.shortName : '';
        });
      })
      .catch(e => {
        if (e?.name === 'AbortError') return;
        // No Node runtime behind this deploy: the device engine still works.
        setNeuralAvailable(false);
        setEngine('device');
      });
    return () => controller.abort();
  }, [uiLang]);

  useEffect(() => subscribeDeviceVoices(setDeviceVoices), []);

  useEffect(() => {
    if (!deviceVoices.length) return;
    setDeviceVoiceName(prev => {
      if (prev && deviceVoices.some(v => v.name === prev)) return prev;
      const match = deviceVoices.find(v => v.lang.toLowerCase().startsWith(uiLang));
      return (match || deviceVoices.find(v => v.default) || deviceVoices[0]).name;
    });
  }, [deviceVoices, uiLang]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch {
      /* corrupted or unavailable storage is not worth surfacing */
    }
  }, []);

  // Anything still speaking or playing when the island unmounts must stop.
  useEffect(
    () => () => {
      stopSpeaking();
      abortRef.current?.abort();
      try {
        sourceRef.current?.stop();
      } catch {
        /* already stopped */
      }
      audioCtxRef.current?.close();
    },
    []
  );

  // ==========================================================================
  // Script editing
  // ==========================================================================
  // Mirrors `blocks` so `commit` can read the current script without nesting a
  // setState inside another setState's updater — React may run an updater twice,
  // which pushed the same snapshot onto the undo stack two times.
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  const commit = useCallback((next: Block[] | ((prev: Block[]) => Block[])) => {
    const prev = blocksRef.current;
    const value = typeof next === 'function' ? (next as (p: Block[]) => Block[])(prev) : next;
    setUndoState(stack => pushUndo(stack, prev));
    setBlocks(value);
  }, []);

  /**
   * Typing invalidates the block's audio but must not push an undo step per
   * keystroke, so text edits bypass `commit` and only structural changes
   * (split, delete, import, restore) become undo points.
   */
  const patchBlock = useCallback((id: string, patch: Partial<Block>) => {
    setBlocks(prev => prev.map(b => (b.id === id ? { ...b, ...patch } : b)));
    setStatus(prev => (prev[id] === 'stale' ? prev : { ...prev, [id]: 'stale' }));
  }, []);

  const splitBlock = useCallback(
    (id: string, caret: number) => {
      commit(prev => {
        const index = prev.findIndex(b => b.id === id);
        if (index < 0) return prev;
        const block = prev[index];
        const head = block.text.slice(0, caret).trim();
        const tail = block.text.slice(caret).trim();
        const next = [...prev];
        next[index] = { ...block, text: head };
        next.splice(index + 1, 0, { ...block, id: newId(), text: tail });
        return next;
      });
      setStatus(prev => ({ ...prev, [id]: 'stale' }));
    },
    [commit]
  );

  const removeBlock = useCallback(
    (id: string) => {
      commit(prev => (prev.length <= 1 ? prev : prev.filter(b => b.id !== id)));
      rendersRef.current.delete(id);
    },
    [commit]
  );

  const addBlock = useCallback(
    (afterId: string) => {
      commit(prev => {
        const index = prev.findIndex(b => b.id === afterId);
        const next = [...prev];
        next.splice(index + 1, 0, emptyBlock());
        return next;
      });
    },
    [commit]
  );

  const loadText = useCallback(
    (raw: string) => {
      const clean = stripSubtitleMarkup(raw);
      commit(textToBlocks(clean));
      setStatus({});
      rendersRef.current.clear();
      setTimeline(null);
      setError(null);
    },
    [commit]
  );

  /** Nothing is synthesised on import: the script lands, you press Generate. */
  const ingestFile = useCallback(
    (file: File) => {
      file
        .text()
        .then(text => {
          loadText(text);
          setNotice(
            (t.importedNotice || 'Imported {name}. Nothing has been synthesised yet — press Generate.').replace(
              '{name}',
              file.name
            )
          );
        })
        .catch(() => setError(t.errorRead || 'That file could not be read as text.'));
    },
    [loadText, t]
  );

  useHandoffIntake(file => ingestFile(file));

  const doUndo = useCallback(() => {
    const result = undoStack(undoState, blocksRef.current);
    if (!result) return;
    setUndoState(result.stack);
    setBlocks(result.blocks);
  }, [undoState]);

  const doRedo = useCallback(() => {
    const result = redoStack(undoState, blocksRef.current);
    if (!result) return;
    setUndoState(result.stack);
    setBlocks(result.blocks);
  }, [undoState]);

  // ==========================================================================
  // Playback (Web Audio, over the stitched timeline)
  // ==========================================================================
  const getAudioContext = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    return audioCtxRef.current;
  };

  const stopSource = useCallback(() => {
    const source = sourceRef.current;
    sourceRef.current = null;
    if (!source) return;
    source.onended = null;
    try {
      source.stop();
    } catch {
      /* already finished */
    }
  }, []);

  const startAt = useCallback(
    (offset: number) => {
      if (!timeline) return;
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') void ctx.resume();
      stopSource();

      const source = ctx.createBufferSource();
      source.buffer = timeline.buffer;
      source.playbackRate.value = speed;
      source.connect(ctx.destination);
      source.onended = () => {
        if (sourceRef.current !== source) return;
        sourceRef.current = null;
        setPlaying(false);
        setTime(timeline.durationSec);
      };
      const clamped = Math.max(0, Math.min(offset, Math.max(0, timeline.durationSec - 0.02)));
      source.start(0, clamped);
      sourceRef.current = source;
      anchorRef.current = { ctxTime: ctx.currentTime, offset: clamped };
      setPlaying(true);
      setTime(clamped);
    },
    [timeline, speed, stopSource]
  );

  const pause = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (ctx && sourceRef.current) {
      const elapsed = (ctx.currentTime - anchorRef.current.ctxTime) * speed;
      setTime(anchorRef.current.offset + elapsed);
    }
    stopSource();
    setPlaying(false);
  }, [speed, stopSource]);

  const togglePlay = useCallback(() => {
    if (playing) pause();
    else startAt(timeline && time >= timeline.durationSec - 0.05 ? 0 : time);
  }, [playing, pause, startAt, time, timeline]);

  const stopAll = useCallback(() => {
    stopSource();
    setPlaying(false);
    setTime(0);
  }, [stopSource]);

  const seek = useCallback(
    (seconds: number) => {
      if (playing) startAt(seconds);
      else setTime(Math.max(0, Math.min(seconds, timeline?.durationSec ?? 0)));
    },
    [playing, startAt, timeline]
  );

  const changeSpeed = useCallback(
    (next: number) => {
      setSpeed(next);
      const source = sourceRef.current;
      const ctx = audioCtxRef.current;
      if (source && ctx) {
        // Rebase the anchor first: everything played so far ran at the old rate.
        const elapsed = (ctx.currentTime - anchorRef.current.ctxTime) * speed;
        anchorRef.current = { ctxTime: ctx.currentTime, offset: anchorRef.current.offset + elapsed };
        source.playbackRate.value = next;
      }
    },
    [speed]
  );

  useTicker(playing, () => {
    const ctx = audioCtxRef.current;
    if (!ctx || !sourceRef.current) return;
    const elapsed = (ctx.currentTime - anchorRef.current.ctxTime) * speed;
    setTime(anchorRef.current.offset + elapsed);
  });

  // ==========================================================================
  // Rendering
  // ==========================================================================
  const rebuildTimeline = useCallback((ordered: Block[]) => {
    const parts: AudioBuffer[] = [];
    const marks: TimelineMark[] = [];
    const blockStarts: Record<string, number> = {};
    let cursorMs = 0;
    let totalBytes = 0;

    for (const block of ordered) {
      const rendered = rendersRef.current.get(block.id);
      if (!rendered) continue;
      blockStarts[block.id] = cursorMs / 1000;
      for (const mark of rendered.marks) marks.push({ ...mark, t: mark.t + cursorMs, blockId: block.id });
      parts.push(rendered.buffer);
      totalBytes += rendered.mp3.length;
      cursorMs += rendered.durationMs;
    }

    if (!parts.length) {
      setTimeline(null);
      return;
    }

    const buffer = concatBuffers(parts);
    setTimeline({
      buffer,
      marks,
      blockStarts,
      durationSec: buffer.duration,
      peaks: computePeaks(buffer),
      totalBytes,
    });
  }, []);

  const generate = useCallback(async () => {
    if (rendering) {
      abortRef.current?.abort();
      return;
    }
    const usable = blocks.filter(b => b.text.trim().length > 0);
    if (!usable.length) {
      setError(t.errorEmpty || 'Write or paste something first.');
      return;
    }
    if (!neuralAvailable || !defaultVoice) {
      setError(t.errorNoEngine || 'The neural engine is unavailable right now. The device engine still previews your script.');
      return;
    }
    const tooLong = usable.find(b => b.text.length > MAX_BLOCK_CHARS);
    if (tooLong) {
      setError(
        (t.errorBlockTooLong || 'One paragraph is over {n} characters. Split it with Enter.').replace(
          '{n}',
          String(MAX_BLOCK_CHARS)
        )
      );
      setExpandedId(tooLong.id);
      return;
    }

    stopAll();
    setError(null);
    setNotice(null);
    setRendering(true);

    const controller = new AbortController();
    abortRef.current = controller;

    // Cached blocks are the whole point of the block model: after a typo fix
    // only the edited paragraph is missing a matching signature.
    const pending = usable.filter(block => {
      const cached = rendersRef.current.get(block.id);
      return !cached || cached.signature !== signatureOf(block, defaults);
    });

    setProgress({ done: 0, total: pending.length });
    setStatus(prev => {
      const next = { ...prev };
      for (const block of usable) next[block.id] = pending.includes(block) ? 'queued' : 'done';
      return next;
    });

    let failed = 0;
    for (let i = 0; i < pending.length; i++) {
      if (controller.signal.aborted) break;
      const block = pending[i];
      setStatus(prev => ({ ...prev, [block.id]: 'rendering' }));
      try {
        const { mp3, marks } = await synthesize({
          text: block.text,
          voice: resolve(block, 'voice', defaults.voice),
          rate: resolve(block, 'rate', defaults.rate),
          pitch: resolve(block, 'pitch', defaults.pitch),
          volume: resolve(block, 'volume', defaults.volume),
          format: quality,
          signal: controller.signal,
        });
        const buffer = await decodeAudio(mp3);
        rendersRef.current.set(block.id, {
          signature: signatureOf(block, defaults),
          mp3,
          buffer,
          marks,
          durationMs: buffer.duration * 1000,
        });
        setStatus(prev => ({ ...prev, [block.id]: 'done' }));
      } catch (e: any) {
        if (e?.name === 'AbortError') break;
        failed++;
        setStatus(prev => ({ ...prev, [block.id]: 'error' }));
        if (e instanceof TTSError && e.code === 'offline') {
          setError(t.errorOffline || 'No connection to the render service. Check your network and try again.');
          break;
        }
        setError(
          (t.errorBlockFailed || 'Paragraph {n} could not be rendered. Try again, or switch its voice.').replace(
            '{n}',
            String(blocks.findIndex(b => b.id === block.id) + 1)
          )
        );
      } finally {
        setProgress(p => ({ ...p, done: p.done + 1 }));
      }
    }

    // Drop audio for blocks that no longer exist, so an edited-down script does
    // not keep megabytes of orphaned renders alive.
    const live = new Set(blocks.map(b => b.id));
    for (const id of [...rendersRef.current.keys()]) if (!live.has(id)) rendersRef.current.delete(id);

    rebuildTimeline(usable);
    setRendering(false);
    abortRef.current = null;

    if (!controller.signal.aborted && failed === 0) {
      const entry: HistoryEntry = {
        id: newId(),
        preview: blocksToText(usable).slice(0, 160),
        blocks: usable.map(b => ({ ...b })),
        voice: defaults.voice,
        engine: 'neural',
        at: Date.now(),
      };
      setHistory(prev => {
        const next = [entry, ...prev.filter(h => h.preview !== entry.preview)].slice(0, HISTORY_LIMIT);
        try {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        } catch {
          /* quota: keep the in-memory list and move on */
        }
        return next;
      });
    }
  }, [blocks, defaults, neuralAvailable, defaultVoice, quality, rendering, rebuildTimeline, stopAll, t]);

  // ==========================================================================
  // Device engine preview
  // ==========================================================================
  const previewDevice = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      stopAll();
      setDevicePreviewing(true);
      speak({
        text,
        voiceName: deviceVoiceName || null,
        rate,
        pitch,
        volume: volume / 100,
        onEnd: () => setDevicePreviewing(false),
        onError: () => {
          setDevicePreviewing(false);
          setError(t.errorDevice || 'Your browser refused to speak that. Try another device voice.');
        },
      });
    },
    [deviceVoiceName, rate, pitch, volume, stopAll, t]
  );

  const previewNeuralVoice = useCallback(
    async (shortName: string) => {
      const line = PREVIEW_LINE[uiLang] || PREVIEW_LINE.en;
      try {
        const { mp3 } = await synthesize({ text: line, voice: shortName, rate, pitch, volume, format: 'mp3-48' });
        const buffer = await decodeAudio(mp3);
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') await ctx.resume();
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start();
        await new Promise<void>(done => {
          source.onended = () => done();
        });
      } catch {
        setError(t.errorPreview || 'That voice could not be previewed.');
      }
    },
    [uiLang, rate, pitch, volume, t]
  );

  const previewBlock = useCallback(
    (id: string) => {
      const block = blocks.find(b => b.id === id);
      if (!block?.text.trim()) return;

      if (engine === 'device') {
        previewDevice(block.text);
        return;
      }
      const start = timeline?.blockStarts[id];
      if (start !== undefined) {
        startAt(start);
        return;
      }
      void previewNeuralVoice(resolve(block, 'voice', defaults.voice));
    },
    [blocks, engine, previewDevice, timeline, startAt, previewNeuralVoice, defaults.voice]
  );

  // ==========================================================================
  // Derived values
  // ==========================================================================
  const words = useMemo(() => (timeline ? timeline.marks.filter(m => m.k === 'w') : []), [timeline]);
  const activeWord = useMemo(() => {
    if (!playing && time === 0) return null;
    const index = activeWordIndex(words, time * 1000);
    return index >= 0 ? words[index] : null;
  }, [words, time, playing]);

  const cues = useMemo(() => (timeline ? buildCues(timeline.marks) : []), [timeline]);
  const totalChars = useMemo(() => charCount(blocks), [blocks]);
  const totalWords = useMemo(() => wordCount(blocks), [blocks]);
  const staleCount = useMemo(
    () =>
      blocks.filter(b => {
        if (!b.text.trim()) return false;
        const cached = rendersRef.current.get(b.id);
        return !cached || cached.signature !== signatureOf(b, defaults);
      }).length,
    // `status` is what changes when a render lands, so it belongs in the deps.
    [blocks, defaults, status]
  );

  const voiceLabel = useCallback(
    (shortName: string) => {
      const voice = voices.find(v => v.shortName === shortName);
      return voice ? `${voice.displayName} · ${voice.locale}` : shortName || '—';
    },
    [voices]
  );

  const baseName = useMemo(() => {
    const first = blocks.find(b => b.text.trim())?.text.trim() || 'tts-bolt';
    return (
      first
        .slice(0, 40)
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase() || 'tts-bolt'
    );
  }, [blocks]);

  // ==========================================================================
  // Exports
  // ==========================================================================
  const mp3Blob = useCallback(() => {
    const parts = blocks.map(b => rendersRef.current.get(b.id)?.mp3).filter(Boolean) as Uint8Array[];
    return parts.length ? concatMp3(parts) : null;
  }, [blocks]);

  const exportMp3 = () => {
    const blob = mp3Blob();
    if (blob) download(blob, `${baseName}.mp3`);
  };
  const exportWav = () => {
    if (timeline) download(encodeWav(timeline.buffer), `${baseName}.wav`);
  };
  const exportCaptions = (kind: 'srt' | 'vtt') => {
    if (!cues.length) return;
    const text = kind === 'srt' ? toSrt(cues) : toVtt(cues);
    download(new Blob([text], { type: kind === 'srt' ? 'application/x-subrip' : 'text/vtt' }), `${baseName}.${kind}`);
  };
  const exportScript = () => download(new Blob([blocksToText(blocks)], { type: 'text/plain' }), `${baseName}.txt`);

  const handoffResult = useCallback(
    async (slug: string) => {
      if (slug === 'subtitles-bolt') {
        if (!cues.length) return null;
        return { blob: new Blob([toSrt(cues)], { type: 'application/x-subrip' }), name: `${baseName}.srt` };
      }
      const blob = mp3Blob();
      return blob ? { blob, name: `${baseName}.mp3` } : null;
    },
    [cues, baseName, mp3Blob]
  );

  // ==========================================================================
  // Keyboard
  // ==========================================================================
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = !!target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);

      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        void generate();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) doRedo();
        else doUndo();
        return;
      }
      if (typing) return;

      if (e.code === 'Space' && timeline) {
        e.preventDefault();
        togglePlay();
      }
      if (e.key === 'ArrowLeft' && timeline) seek(Math.max(0, time - 5));
      if (e.key === 'ArrowRight' && timeline) seek(Math.min(timeline.durationSec, time + 5));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [generate, doUndo, doRedo, togglePlay, seek, time, timeline]);

  // ==========================================================================
  // Static copy
  // ==========================================================================
  const steps = [
    { art: StepWriteArt, title: t.step1Title, text: t.step1Text },
    { art: StepVoiceArt, title: t.step2Title, text: t.step2Text },
    { art: StepRenderArt, title: t.step3Title, text: t.step3Text },
    { art: StepExportArt, title: t.step4Title, text: t.step4Text },
  ];
  const featureIcons = [IconNeuralVoice, IconCaptions, IconMultiVoice, IconProsody, IconBlockRender, IconOffline];

  const resetAll = () => {
    stopAll();
    stopSpeaking();
    abortRef.current?.abort();
    rendersRef.current.clear();
    commit([emptyBlock()]);
    setStatus({});
    setTimeline(null);
    setError(null);
    setNotice(null);
  };

  const ready = !!timeline;

  return (
    <div className="min-h-screen flex flex-col bg-[#060504] text-slate-200 font-sans overflow-x-hidden selection:bg-amber-500/30">
      <Header
        currentLang={lang}
        onLanguageChange={newLang => {
          window.location.href = `/${newLang.toLowerCase()}/tts-bolt`;
        }}
        onReset={resetAll}
        t={t}
      />

      {/* The max width lives on <main> on purpose: AdRail measures this element
          to decide whether the fixed side rails fit, and reserving 440px from
          1400px up is what keeps them visible instead of silently suppressed. */}
      <main className="flex-1 flex flex-col items-center pt-36 pb-32 px-4 md:px-12 relative z-10 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))]">
        <AdBanner id="adsense-tts-bolt-top" />

        <div className="w-full space-y-20 md:space-y-28">
          {/* ============================================================== */}
          {/* Hero                                                           */}
          {/* ============================================================== */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center pt-2">
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex max-w-full items-center gap-2 px-4 py-2 rounded-full bg-amber-950/40 border border-amber-800/30 text-amber-400 text-[11px] font-black tracking-[0.2em] uppercase shadow-[0_0_25px_rgba(245,158,11,0.15)]">
                <Volume2 className="w-3.5 h-3.5 shrink-0" />
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
                    <Check className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />
                    {point}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/10 blur-[80px] rounded-full" />
              <VoiceHeroArt
                className="relative w-full max-w-lg mx-auto drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
                animated={!prefersReduced.current}
              />
            </div>
          </section>

          {/* ============================================================== */}
          {/* Workspace                                                      */}
          {/* ============================================================== */}
          <section className="space-y-4">
            {/* Engine bar */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 rounded-2xl border border-white/5 bg-black/30 px-4 py-3">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/5 shrink-0">
                {(['neural', 'device'] as const).map(option => (
                  <button
                    key={option}
                    onClick={() => {
                      setEngine(option);
                      stopSpeaking();
                      setDevicePreviewing(false);
                    }}
                    disabled={option === 'neural' && neuralAvailable === false}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer border-none disabled:opacity-40 disabled:cursor-not-allowed ${
                      engine === option ? 'bg-amber-500/20 text-amber-300' : 'bg-transparent text-slate-500 hover:text-white'
                    }`}
                  >
                    {option === 'neural' ? <Server className="w-3 h-3" /> : <Cpu className="w-3 h-3" />}
                    {option === 'neural' ? t.engineNeural || 'Neural studio' : t.engineDevice || 'Device (offline)'}
                  </button>
                ))}
              </div>

              <p className="text-[11px] font-medium text-slate-500 leading-snug flex-1 min-w-0">
                {engine === 'neural'
                  ? t.engineNeuralHint ||
                    'Your text is sent to our own render endpoint to be synthesised, then comes back as an MP3 with word-level timings. Nothing is stored.'
                  : t.engineDeviceHint ||
                    "Uses the voices installed on this device. Nothing leaves the browser — and nothing can be downloaded either, because the browser gives no way to record it."}
              </p>

              {engine === 'neural' ? (
                <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/5 shrink-0">
                  {(['mp3-96', 'mp3-48'] as const).map(option => (
                    <button
                      key={option}
                      onClick={() => setQuality(option)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer border-none ${
                        quality === option ? 'bg-amber-500/20 text-amber-300' : 'bg-transparent text-slate-500 hover:text-white'
                      }`}
                    >
                      {option === 'mp3-96' ? t.qualityHigh || '96 kbps' : t.qualitySmall || '48 kbps'}
                    </button>
                  ))}
                </div>
              ) : (
                <select
                  value={deviceVoiceName}
                  onChange={e => setDeviceVoiceName(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-amber-500/60 cursor-pointer max-w-full lg:max-w-[16rem] shrink-0"
                >
                  {deviceVoices.length === 0 && (
                    <option value="" className="bg-[#100a05]">
                      {t.noDeviceVoices || 'No device voices found'}
                    </option>
                  )}
                  {deviceVoices.map(voice => (
                    <option key={voice.name} value={voice.name} className="bg-[#100a05]">
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {neuralAvailable === false && (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-950/20 p-4 text-amber-200/90">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-xs font-medium leading-relaxed">
                  {t.neuralUnavailable ||
                    'The neural render service is not reachable from this deploy, so downloads and captions are off. Device voices still work for listening.'}
                </p>
              </div>
            )}

            {/* Voice + prosody defaults */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5 rounded-2xl border border-white/5 bg-white/[0.015] p-4 space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <Mic2 className="w-3.5 h-3.5 text-amber-500" />
                  {t.label_voice || 'Voice'}
                </div>

                {engine === 'neural' ? (
                  <button
                    onClick={() => setPicker({ target: 'default' })}
                    disabled={!voices.length}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-black/40 border border-white/10 hover:border-amber-500/40 text-left transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                  >
                    {voices.length ? (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-bold text-slate-100 truncate">{voiceLabel(defaultVoice)}</span>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                            {(t.voiceCount || '{n} neural voices').replace('{n}', String(voices.length))}
                          </span>
                        </span>
                      </>
                    ) : (
                      <>
                        <Loader2 className="w-4 h-4 text-amber-500 animate-spin shrink-0" />
                        <span className="text-sm font-bold text-slate-400">{t.loadingVoices || 'Loading voices…'}</span>
                      </>
                    )}
                  </button>
                ) : (
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {t.deviceVoiceHint ||
                      'Device voices are chosen in the bar above. The list comes from your operating system, so it differs on every machine.'}
                  </p>
                )}

                <div className="space-y-3 pt-1">
                  {(
                    [
                      { key: 'rate', label: t.label_speed || 'Reading speed', value: rate, set: setRate, min: 0.5, max: 2, step: 0.05, suffix: '×' },
                      { key: 'pitch', label: t.label_pitch || 'Voice pitch', value: pitch, set: setPitch, min: 0.5, max: 1.5, step: 0.05, suffix: '×' },
                      { key: 'volume', label: t.label_volume || 'Volume', value: volume, set: setVolume, min: 10, max: 100, step: 5, suffix: '%' },
                    ] as const
                  ).map(control => (
                    <div key={control.key} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{control.label}</span>
                        <span className="text-[11px] font-bold text-amber-400 tabular-nums">
                          {control.step < 1 ? control.value.toFixed(2) : control.value}
                          {control.suffix}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={control.min}
                        max={control.max}
                        step={control.step}
                        value={control.value}
                        onChange={e => control.set(parseFloat(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Script */}
              <div className="lg:col-span-7 rounded-2xl border border-white/5 bg-white/[0.015] p-4 space-y-3">
                <div className="flex items-center flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 mr-auto">
                    <FileText className="w-3.5 h-3.5 text-amber-500" />
                    {t.scriptTitle || 'Script'}
                    <span className="text-slate-600 normal-case tracking-normal font-bold">
                      {totalWords} {t.words || 'words'} · {totalChars} {t.chars || 'characters'}
                    </span>
                  </div>

                  <button
                    onClick={doUndo}
                    disabled={!undoState.past.length}
                    title={`${t.undoBtn || 'Undo'} (Ctrl+Z)`}
                    aria-label={t.undoBtn || 'Undo'}
                    className="p-2 rounded-lg border border-white/10 bg-black/30 text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={doRedo}
                    disabled={!undoState.future.length}
                    title={`${t.redoBtn || 'Redo'} (Ctrl+Shift+Z)`}
                    aria-label={t.redoBtn || 'Redo'}
                    className="p-2 rounded-lg border border-white/10 bg-black/30 text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Redo2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 bg-black/30 text-slate-300 hover:border-amber-500/40 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {t.importBtn || 'Import'}
                  </button>
                </div>

                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) ingestFile(file);
                  }}
                >
                  <ScriptEditor
                    blocks={blocks}
                    status={status}
                    defaults={defaults}
                    voices={voices}
                    voiceLabel={voiceLabel}
                    activeBlockId={activeWord?.blockId ?? null}
                    activeWord={activeWord}
                    expandedId={expandedId}
                    onToggleExpanded={setExpandedId}
                    onChange={patchBlock}
                    onSplit={splitBlock}
                    onRemove={removeBlock}
                    onAdd={addBlock}
                    onPickVoice={id => setPicker({ target: id })}
                    onPreviewBlock={previewBlock}
                    onSeekBlock={id => {
                      const start = timeline?.blockStarts[id];
                      if (start !== undefined) seek(start);
                    }}
                    t={t}
                  />
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_INPUT}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) ingestFile(file);
                    e.target.value = '';
                  }}
                  className="hidden"
                />

                <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
                  {t.scriptHint ||
                    'Enter splits a paragraph, Shift+Enter keeps a line break. Each paragraph can take its own voice — that is how you narrate a dialogue.'}
                </p>
              </div>
            </div>

            {/* Action bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {engine === 'neural' ? (
                <button
                  onClick={() => void generate()}
                  disabled={!totalChars || neuralAvailable === false}
                  className="flex-1 flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black text-sm uppercase tracking-wider transition-all cursor-pointer border-none shadow-lg shadow-amber-500/10"
                >
                  {rendering ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>
                        {(t.btn_rendering || 'Rendering {done}/{total} — click to stop')
                          .replace('{done}', String(progress.done))
                          .replace('{total}', String(progress.total))}
                      </span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      <span>
                        {ready && staleCount > 0
                          ? (t.btn_rerender || 'Re-render {n} changed').replace('{n}', String(staleCount))
                          : t.btn_generate || 'Generate audio'}
                      </span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => (devicePreviewing ? (stopSpeaking(), setDevicePreviewing(false)) : previewDevice(blocksToText(blocks)))}
                  disabled={!totalChars}
                  className="flex-1 flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black text-sm uppercase tracking-wider transition-all cursor-pointer border-none"
                >
                  <Volume2 className="w-5 h-5" />
                  <span>{devicePreviewing ? t.btn_stop || 'Stop' : t.btn_speak || 'Speak it now'}</span>
                </button>
              )}

              <button
                onClick={resetAll}
                className="px-5 py-4 rounded-2xl bg-red-500/5 hover:bg-red-500/15 border border-red-500/20 text-red-400 text-[11px] font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                {t.resetBtn || 'Reset'}
              </button>
            </div>

            {totalChars > LONG_SCRIPT_CHARS && engine === 'neural' && (
              <p className="text-[11px] text-slate-500 font-medium">
                {(t.longScriptHint || 'That is {n} characters — expect roughly {r} render requests, one per paragraph.')
                  .replace('{n}', String(totalChars))
                  .replace('{r}', String(blocks.filter(b => b.text.trim()).length))}
              </p>
            )}

            {(error || notice) && (
              <div
                className={`flex items-start gap-3 rounded-2xl p-4 border ${
                  error ? 'border-red-500/30 bg-red-950/30 text-red-200' : 'border-white/10 bg-white/5 text-slate-300'
                }`}
              >
                {error ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <Check className="w-4 h-4 shrink-0 mt-0.5" />}
                <span className="text-xs font-semibold flex-1 leading-relaxed">{error || notice}</span>
                <button
                  onClick={() => {
                    setError(null);
                    setNotice(null);
                  }}
                  aria-label={t.closeLabel || 'Close'}
                  className="p-0.5 rounded text-current opacity-60 hover:opacity-100 transition-opacity cursor-pointer border-none bg-transparent"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Result */}
            {timeline && (
              <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-4 md:p-6 space-y-5 backdrop-blur-md">
                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <FileAudio className="w-3.5 h-3.5" />
                    {t.resultTitle || 'Rendered narration'}
                  </span>
                  <span>{formatClock(timeline.durationSec)}</span>
                  <span>{(timeline.totalBytes / 1024 / 1024).toFixed(2)} MB</span>
                  <span>
                    {cues.length} {t.cuesLabel || 'caption cues'}
                  </span>
                  {staleCount > 0 && (
                    <span className="text-amber-500 normal-case tracking-normal font-bold">
                      {(t.staleWarning || '{n} paragraph(s) changed since this render').replace('{n}', String(staleCount))}
                    </span>
                  )}
                </div>

                <Player
                  timeline={timeline}
                  playing={playing}
                  time={time}
                  speed={speed}
                  onSpeedChange={changeSpeed}
                  onSeek={seek}
                  onTogglePlay={togglePlay}
                  onStop={stopAll}
                  t={t}
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={exportMp3}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {t.downloadMp3 || 'MP3'}
                  </button>
                  <button
                    onClick={exportWav}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {t.downloadWav || 'WAV'}
                  </button>
                  <button
                    onClick={() => exportCaptions('srt')}
                    disabled={!cues.length}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <Captions className="w-3.5 h-3.5" />
                    SRT
                  </button>
                  <button
                    onClick={() => exportCaptions('vtt')}
                    disabled={!cues.length}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <Captions className="w-3.5 h-3.5" />
                    VTT
                  </button>
                  <button
                    onClick={exportScript}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {t.downloadScript || 'Script'}
                  </button>
                </div>

                <NextStepBar lang={lang} t={t} getResult={handoffResult} disabled={!ready} />
              </div>
            )}

            {/* History */}
            {history.length > 0 && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.015] p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <History className="w-3.5 h-3.5 text-amber-500" />
                    {t.history_title || 'Recent scripts'}
                  </div>
                  <button
                    onClick={() => {
                      setHistory([]);
                      localStorage.removeItem(HISTORY_KEY);
                    }}
                    className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-red-400/80 hover:text-red-300 transition-colors cursor-pointer border-none bg-transparent"
                  >
                    <Trash2 className="w-3 h-3" />
                    {t.clear_history || 'Clear'}
                  </button>
                </div>

                <div className="grid gap-2 max-h-60 overflow-y-auto pr-1">
                  {history.map(entry => (
                    <button
                      key={entry.id}
                      onClick={() => {
                        rendersRef.current.clear();
                        setTimeline(null);
                        setStatus({});
                        commit(entry.blocks.map(b => ({ ...b, id: newId() })));
                        if (entry.voice) setDefaultVoice(entry.voice);
                      }}
                      className="text-left p-3 rounded-xl bg-white/[0.01] hover:bg-white/[0.04] border border-white/5 hover:border-amber-500/30 transition-all cursor-pointer group"
                    >
                      <div className="text-slate-300 text-sm font-medium line-clamp-2 leading-relaxed">{entry.preview}</div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1.5 gap-2">
                        <span className="group-hover:text-amber-400 transition-colors truncate">{voiceLabel(entry.voice)}</span>
                        <span className="shrink-0">{new Date(entry.at).toLocaleDateString()}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ============================================================== */}
          {/* How it works                                                   */}
          {/* ============================================================== */}
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

          {/* ============================================================== */}
          {/* Features                                                       */}
          {/* ============================================================== */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(t.features || []).map((feature: any, idx: number) => {
              const Icon = featureIcons[idx] || IconNeuralVoice;
              return (
                <div
                  key={idx}
                  className="p-7 glass-card rounded-3xl text-left hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-amber-500/5 transition-all duration-300 group border border-white/5"
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
          </section>

          {/* ============================================================== */}
          {/* SEO content                                                    */}
          {/* ============================================================== */}
          <section className="space-y-24 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-24 items-center">
              <div className="space-y-7">
                <div className="inline-block px-4 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-[11px] font-black uppercase tracking-[0.2em] border border-amber-500/20">
                  {t.seoKeywords?.[0]}
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white leading-[1.05] tracking-tighter">
                  {t.seoSecondaryTitle}
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
                <IconCaptions className="w-20 h-20 text-amber-400 relative" />
                <div className="space-y-3 max-w-sm relative">
                  <h3 className="text-2xl font-black text-white tracking-tight leading-tight">{t.seoBrowserSpeedTitle}</h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">{t.seoBrowserSpeedText}</p>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-14 rounded-3xl md:rounded-[2.5rem] bg-[#120c06] border border-white/5 space-y-10">
              <div className="max-w-4xl space-y-4">
                <h2 className="text-2xl md:text-4xl font-black text-white leading-tight">{t.seoUseCaseTitle}</h2>
                <div className="h-1.5 w-20 bg-amber-500 rounded-full" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <p className="text-slate-400 text-base leading-relaxed font-medium">{t.seoUseCaseText}</p>
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
            <div className="max-w-4xl mx-auto w-full space-y-10">
              <div className="text-center space-y-3">
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{t.faqTitle}</h2>
                <div className="h-1 w-16 bg-amber-500 mx-auto rounded-full" />
              </div>
              <div className="grid gap-3">
                {(t.faq || []).map((faq: any, idx: number) => (
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

            {/* Keywords */}
            <div className="max-w-4xl mx-auto w-full space-y-5 opacity-55 text-center">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">{t.seoKeywordsTitle}</h2>
              <div className="flex flex-wrap justify-center gap-2">
                {(t.seoKeywords || []).map((keyword: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 hover:bg-amber-500/10 hover:border-amber-500/20 hover:text-amber-400 transition-all cursor-default"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>

        <AdBanner id="adsense-tts-bolt-bottom" />
      </main>

      {picker && (
        <VoicePicker
          voices={voices}
          value={picker.target === 'default' ? defaultVoice : blocks.find(b => b.id === picker.target)?.voice || defaultVoice}
          onChange={shortName => {
            if (picker.target === 'default') setDefaultVoice(shortName);
            else patchBlock(picker.target, { voice: shortName });
          }}
          onPreview={previewNeuralVoice}
          onClose={() => setPicker(null)}
          uiLang={uiLang}
          t={t}
        />
      )}

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

export default TTSBolt;
