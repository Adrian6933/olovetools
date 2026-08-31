import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  Check,
  ClipboardCopy,
  Download,
  Ear,
  FileAudio,
  Loader2,
  Mic,
  Play,
  Radio,
  RotateCcw,
  Sparkles,
  Square,
  Upload,
  Volume2,
  VolumeX,
} from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';
import { useHandoffIntake } from '../../lib/useHandoff';

import { NextStepBar } from './components/NextStepBar';
import {
  IconAlphabet,
  IconEar,
  IconExport,
  IconFarnsworth,
  IconHandoff,
  IconLocal,
  IconTimeline,
  IconTone,
  MorseHeroArt,
  STEP_ART,
} from './components/Illustrations';

import { REFERENCE_GROUPS } from './lib/alphabet';
import { decode, encode, toTimeline, UNKNOWN, type TranslateIssue } from './lib/translate';
import { effectiveWpm, schedule, type Timing } from './lib/timing';
import { DEFAULT_TONE, play, renderWav, type PlaybackHandle, type ToneOptions } from './lib/audio';
import { bufferFromFile, listen, type ListenResult } from './lib/listen';
import { ACCEPT_AUDIO, classifyDrop, copyText, downloadBlob, formatSeconds, MAX_AUDIO_BYTES, readTextFile } from './lib/io';

interface MorseFlowProps {
  lang: string;
  dictionary: any;
}

type LegalKey = 'privacy' | 'terms' | 'cookies';
type Pane = 'reference' | 'listen';

const DEFAULT_TEXT = 'SOS HELP';

interface ParkedAudio {
  file: File;
  bytes: number;
}

export default function MorseFlow({ lang, dictionary }: MorseFlowProps) {
  const t = dictionary || {};

  // ---------------------------------------------------------------- state --
  const [text, setText] = useState(DEFAULT_TEXT);
  const [morse, setMorse] = useState(() => encode(DEFAULT_TEXT).output);
  /** Which box the user is driving. The other one is derived from it. */
  const [source, setSource] = useState<'text' | 'morse'>('text');

  const [timing, setTiming] = useState<Timing>({ wpm: 20, farnsworthWpm: 20 });
  const [tone, setTone] = useState<ToneOptions>(DEFAULT_TONE);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const [pane, setPane] = useState<Pane>('reference');
  const [parked, setParked] = useState<ParkedAudio | null>(null);
  const [heard, setHeard] = useState<ListenResult | null>(null);
  const [listening, setListening] = useState(false);
  const [recording, setRecording] = useState(false);

  const [copied, setCopied] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [legalModal, setLegalModal] = useState<LegalKey | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  const playbackRef = useRef<PlaybackHandle | null>(null);
  const rafRef = useRef<number | undefined>(undefined);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(query.matches);
    const listener = (event: MediaQueryListEvent) => setReduceMotion(event.matches);
    query.addEventListener('change', listener);
    return () => query.removeEventListener('change', listener);
  }, []);

  useEffect(
    () => () => {
      clearTimeout(copyTimer.current);
      clearTimeout(toastTimer.current);
      if (rafRef.current !== undefined) clearInterval(rafRef.current);
      playbackRef.current?.stop();
      recorderRef.current?.stream.getTracks().forEach(track => track.stop());
    },
    []
  );

  const flash = useCallback((message: string) => {
    clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  // ------------------------------------------------------------ translation --
  // One direction is authoritative and the other is derived. The old version
  // had both boxes overwrite each other on every keystroke, so editing Morse
  // mid-symbol rewrote the text you were comparing it against.
  const translation = useMemo(
    () => (source === 'text' ? encode(text) : decode(morse)),
    [source, text, morse]
  );

  const onText = useCallback((value: string) => {
    setSource('text');
    setText(value);
    setMorse(encode(value).output);
  }, []);

  const onMorse = useCallback((value: string) => {
    setSource('morse');
    setMorse(value);
    setText(decode(value).output);
  }, []);

  const issues: TranslateIssue[] = translation.issues;

  // ---------------------------------------------------------------- audio --
  const plan = useMemo(() => schedule(toTimeline(morse), timing), [morse, timing]);
  const characters = useMemo(() => text.replace(/\s+/g, '').length, [text]);

  const stop = useCallback(() => {
    playbackRef.current?.stop();
    playbackRef.current = null;
    if (rafRef.current !== undefined) clearInterval(rafRef.current);
    rafRef.current = undefined;
    setPlaying(false);
    setProgress(0);
  }, []);

  const start = useCallback(async () => {
    stop();
    if (plan.events.length === 0) return;
    const handle = await play(plan, { ...tone, volume: muted ? 0 : tone.volume }, () => {
      if (rafRef.current !== undefined) clearInterval(rafRef.current);
      rafRef.current = undefined;
      playbackRef.current = null;
      setPlaying(false);
      setProgress(0);
    });
    if (!handle) {
      flash(t.errorAudio || 'This browser would not give the page an audio context.');
      return;
    }
    playbackRef.current = handle;
    setPlaying(true);

    // setInterval rather than rAF: requestAnimationFrame is paused in a
    // background tab, which would freeze the playhead while the tone kept
    // going and leave it stuck when you came back.
    const startedAt = performance.now();
    rafRef.current = window.setInterval(() => {
      const elapsed = (performance.now() - startedAt) / 1000;
      setProgress(Math.min(1, handle.duration > 0 ? elapsed / handle.duration : 1));
    }, 60);
  }, [plan, tone, muted, stop, flash, t.errorAudio]);

  const exportWav = useCallback(async () => {
    if (plan.events.length === 0) return;
    const blob = await renderWav(plan, tone);
    if (!blob) {
      flash(t.errorRender || 'This browser cannot render audio offline.');
      return;
    }
    downloadBlob(blob, 'morse.wav');
  }, [plan, tone, flash, t.errorRender]);

  // --------------------------------------------------------------- listen --
  const takeAudio = useCallback(
    (file: File) => {
      if (file.size > MAX_AUDIO_BYTES) {
        flash(t.errorTooLarge || 'That recording is too big.');
        return;
      }
      // Parked, not decoded: analysing a five-minute file is the expensive
      // part and it waits for the button.
      setParked({ file, bytes: file.size });
      setHeard(null);
      setPane('listen');
    },
    [flash, t.errorTooLarge]
  );

  const runListen = useCallback(async () => {
    if (!parked || listening) return;
    setListening(true);
    const buffer = await bufferFromFile(parked.file);
    if (!buffer) {
      setListening(false);
      flash(t.errorDecodeAudio || 'That file could not be decoded as audio.');
      return;
    }
    const result = await listen(buffer);
    setListening(false);
    setHeard(result);
    if (result.ok) {
      setSource('morse');
      setMorse(result.morse);
      setText(result.text);
    }
  }, [parked, listening, flash, t.errorDecodeAudio]);

  const toggleRecording = useCallback(async () => {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = event => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        recorderRef.current = null;
        setRecording(false);
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        takeAudio(new File([blob], 'recording.webm', { type: blob.type }));
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      flash(t.errorMic || 'The microphone was not available.');
    }
  }, [recording, takeAudio, flash, t.errorMic]);

  // --------------------------------------------------------------- intake --
  const openFile = useCallback(
    (file: File) => {
      const kind = classifyDrop(file);
      if (kind === 'audio') {
        takeAudio(file);
        return;
      }
      if (kind === 'text') {
        readTextFile(file)
          .then(content => onText(content.slice(0, 20000)))
          .catch(() => flash(t.errorRead || 'That file could not be read.'));
        return;
      }
      flash(t.errorFormat || 'Drop a text file or a recording.');
    },
    [takeAudio, onText, flash, t.errorRead, t.errorFormat]
  );

  useHandoffIntake((file, from) => {
    openFile(file);
    flash((t.handoffReceived || 'Received from {tool}.').replace('{tool}', from));
  });

  const doCopy = useCallback(
    async (value: string, id: string) => {
      if (!value) return;
      const ok = await copyText(value);
      if (!ok) {
        flash(t.errorClipboard || 'The clipboard is not available on this page.');
        return;
      }
      clearTimeout(copyTimer.current);
      setCopied(id);
      copyTimer.current = setTimeout(() => setCopied(null), 1800);
    },
    [flash, t.errorClipboard]
  );

  const reset = useCallback(() => {
    stop();
    setSource('text');
    setText(DEFAULT_TEXT);
    setMorse(encode(DEFAULT_TEXT).output);
    setTiming({ wpm: 20, farnsworthWpm: 20 });
    setTone(DEFAULT_TONE);
    setMuted(false);
    setParked(null);
    setHeard(null);
  }, [stop]);

  const getResultFile = useCallback(async () => {
    if (!morse.trim()) return null;
    return { blob: new Blob([`${text}\n\n${morse}\n`], { type: 'text/plain' }), name: 'morse.txt' };
  }, [text, morse]);

  // -------------------------------------------------------------- derived --
  const steps = [
    { title: t.step1Title || 'Type it', text: t.step1Text || '' },
    { title: t.step2Title || 'Shape the sending', text: t.step2Text || '' },
    { title: t.step3Title || 'Or let it listen', text: t.step3Text || '' },
    { title: t.step4Title || 'Take it with you', text: t.step4Text || '' },
  ];
  const featureIcons = [IconAlphabet, IconTone, IconEar, IconFarnsworth, IconTimeline, IconExport, IconLocal, IconHandoff];
  const features: { title: string; text: string }[] = Array.isArray(t.features) ? t.features : [];
  const faqs: { question: string; answer: string }[] = Array.isArray(t.faq) ? t.faq : [];
  const keywords: string[] = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];

  const iconButton =
    'flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/5 bg-white/5 text-slate-300 outline-none transition-all hover:border-amber-500/30 hover:bg-amber-500/15 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-30';
  const field =
    'w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs font-semibold text-slate-200 outline-none transition-colors focus:border-amber-500/50';
  const microLabel = 'text-[10px] font-black uppercase tracking-[0.14em] text-slate-500';

  return (
    <div className="flex min-h-screen flex-col bg-[#0c0802] font-sans text-slate-200 selection:bg-amber-500/25 selection:text-amber-50">
      <Header currentLang={lang} onLanguageChange={l => (window.location.href = `/${l.toLowerCase()}/morse-flow`)} t={t} />

      {/* The max width lives on <main> on purpose: AdRail measures this element
          against the viewport edge to decide whether the fixed side rails fit.
          The previous max-w-5xl left the gap short of the 168px a rail needs. */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-28 min-[1400px]:max-w-[min(72rem,calc(100vw-440px))] md:px-8 md:pt-36">
        <AdBanner id="adsense-morse-flow-top" />

        {/* ================================================================ */}
        {/* Hero                                                             */}
        {/* ================================================================ */}
        <section className="mb-12 grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          <div className="min-w-0 space-y-5">
            <span className="inline-block rounded-full border border-amber-500/20 bg-amber-500/10 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-amber-300">
              {t.heroBadge || 'Keyer + reader'}
            </span>
            <h1 className="text-3xl font-black leading-[1.08] tracking-tight text-white sm:text-4xl md:text-5xl">{t.seoHeroTitle}</h1>
            <p className="text-base font-medium leading-relaxed text-slate-400 md:text-lg">{t.heroText || t.seoHeroText}</p>
            <div className="flex flex-wrap gap-2">
              {(Array.isArray(t.seoHeroList) ? t.seoHeroList : []).map((point: string, i: number) => (
                <span key={i} className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-3 py-1.5 text-[12px] font-bold text-slate-300">
                  <Check className="h-3.5 w-3.5 stroke-[3] text-amber-400" />
                  {point}
                </span>
              ))}
            </div>
          </div>
          <MorseHeroArt className="mx-auto h-auto w-full max-w-lg" animated={!reduceMotion} />
        </section>

        {/* ================================================================ */}
        {/* Workspace                                                        */}
        {/* ================================================================ */}
        <section
          className="glass-card overflow-hidden rounded-3xl border border-white/5"
          onDragOver={event => event.preventDefault()}
          onDrop={event => {
            event.preventDefault();
            const file = event.dataTransfer.files?.[0];
            if (file) openFile(file);
          }}
        >
          {/* --- the two boxes --- */}
          <div className="grid grid-cols-1 gap-px bg-white/5 lg:grid-cols-2">
            <div className="flex flex-col gap-2 bg-[#0c0802] p-3 md:p-4">
              <div className="flex items-center gap-2">
                <span className={microLabel}>{t.label_text || 'Text'}</span>
                {source === 'text' && <span className="rounded bg-amber-500/15 px-1.5 text-[9px] font-black text-amber-300">{t.badgeSource || 'source'}</span>}
                <button type="button" onClick={() => void doCopy(text, 'text')} className={`${iconButton} ml-auto h-7 w-7`} title={t.tooltip_copy || 'Copy'}>
                  {copied === 'text' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <textarea
                value={text}
                onChange={event => onText(event.target.value)}
                spellCheck={false}
                aria-label={t.label_text || 'Text'}
                className="min-h-[140px] w-full resize-y rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 font-mono text-sm text-slate-100 outline-none transition placeholder:text-slate-700 focus:border-amber-500/40"
                placeholder={t.placeholderText || 'SOS HELP'}
              />
            </div>

            <div className="flex flex-col gap-2 bg-[#0c0802] p-3 md:p-4">
              <div className="flex items-center gap-2">
                <span className={microLabel}>{t.label_morse || 'Morse'}</span>
                {source === 'morse' && <span className="rounded bg-amber-500/15 px-1.5 text-[9px] font-black text-amber-300">{t.badgeSource || 'source'}</span>}
                <button type="button" onClick={() => void doCopy(morse, 'morse')} className={`${iconButton} ml-auto h-7 w-7`} title={t.tooltip_copy || 'Copy'}>
                  {copied === 'morse' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <textarea
                value={morse}
                onChange={event => onMorse(event.target.value)}
                spellCheck={false}
                aria-label={t.label_morse || 'Morse'}
                className="min-h-[140px] w-full resize-y rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 font-mono text-sm tracking-widest text-amber-100 outline-none transition placeholder:text-slate-700 focus:border-amber-500/40"
                placeholder="... --- ..."
              />
            </div>
          </div>

          {/* --- what could not be translated --- */}
          {issues.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-t border-white/5 bg-amber-500/[0.06] px-3 py-2.5 md:px-4">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
              <span className="text-[11px] font-bold text-amber-200">
                {(t.issuesTitle || '{n} characters have no Morse equivalent, shown as {mark}:')
                  .replace('{n}', String(issues.length))
                  .replace('{mark}', UNKNOWN)}
              </span>
              <span className="font-mono text-[11px] text-amber-100/80">
                {Array.from(new Set(issues.map(i => i.value))).slice(0, 16).join(' ')}
              </span>
            </div>
          )}

          {/* --- the timeline --- */}
          <div className="border-t border-white/5 px-3 py-3 md:px-4">
            <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className={microLabel}>{t.labelTimeline || 'Timeline'}</span>
              <span className="font-mono text-[11px] text-slate-500">
                {formatSeconds(plan.total)} · {effectiveWpm(plan.total, characters)} {t.wpmShort || 'wpm'}
              </span>
              {plan.farnsworth && (
                <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase text-amber-300">
                  {t.badgeFarnsworth || 'farnsworth'}
                </span>
              )}
            </div>
            <div className="relative flex h-8 items-center gap-px overflow-hidden rounded-lg bg-black/40 px-1">
              {plan.events.slice(0, 400).map((event, i) => {
                const on = event.symbol.kind === 'dit' || event.symbol.kind === 'dah';
                const played = playing && event.start / Math.max(plan.total, 0.001) <= progress;
                return (
                  <span
                    key={i}
                    title={`${event.symbol.kind} · ${Math.round(event.duration * 1000)}ms`}
                    className={`h-4 shrink-0 rounded-sm transition-colors ${
                      on ? (played ? 'bg-amber-300' : 'bg-amber-500/70') : 'bg-transparent'
                    }`}
                    style={{ width: `${Math.max(2, event.duration * 40)}px` }}
                  />
                );
              })}
              {playing && (
                <span className="pointer-events-none absolute inset-y-0 w-px bg-amber-200" style={{ left: `${progress * 100}%` }} />
              )}
            </div>
          </div>

          {/* --- transport and tone --- */}
          <div className="flex flex-wrap items-center gap-2 border-t border-white/5 px-3 py-3 md:px-4">
            <button
              type="button"
              onClick={() => (playing ? stop() : void start())}
              disabled={plan.events.length === 0}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/20 px-4 py-2.5 text-sm font-black text-amber-100 outline-none transition-all hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {playing ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {playing ? t.button_stop || 'Stop' : t.button_play || 'Play'}
            </button>
            <button type="button" onClick={() => setMuted(m => !m)} className={iconButton} title={muted ? t.tooltip_unmute || 'Unmute' : t.tooltip_mute || 'Mute'}>
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button type="button" onClick={() => void exportWav()} disabled={plan.events.length === 0} className={iconButton} title={t.buttonWav || 'Download as WAV'}>
              <Download className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => void doCopy(`${text}\n\n${morse}`, 'both')} className={iconButton} title={t.buttonCopyBoth || 'Copy both'}>
              {copied === 'both' ? <Check className="h-4 w-4 text-emerald-400" /> : <ArrowLeftRight className="h-4 w-4" />}
            </button>
            <button type="button" onClick={reset} className={iconButton} title={t.button_reset || 'Reset'}>
              <RotateCcw className="h-4 w-4" />
            </button>

            <div className="ml-auto grid grid-cols-2 gap-2 sm:grid-cols-4">
              <label className="flex flex-col gap-1">
                <span className={microLabel}>{t.labelCharSpeed || 'Character wpm'}</span>
                <input
                  type="number"
                  min={5}
                  max={60}
                  className={field}
                  value={timing.wpm}
                  onChange={event => {
                    const wpm = Math.max(5, Math.min(60, Number(event.target.value) || 20));
                    setTiming(current => ({ wpm, farnsworthWpm: Math.min(current.farnsworthWpm, wpm) }));
                  }}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className={microLabel}>{t.labelOverall || 'Overall wpm'}</span>
                <input
                  type="number"
                  min={5}
                  max={60}
                  className={field}
                  value={timing.farnsworthWpm}
                  onChange={event =>
                    setTiming(current => ({
                      ...current,
                      farnsworthWpm: Math.max(5, Math.min(current.wpm, Number(event.target.value) || current.wpm)),
                    }))
                  }
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className={microLabel}>{t.labelTone || 'Tone (Hz)'}</span>
                <input
                  type="number"
                  min={200}
                  max={1500}
                  step={10}
                  className={field}
                  value={tone.frequency}
                  onChange={event => setTone(current => ({ ...current, frequency: Math.max(200, Math.min(1500, Number(event.target.value) || 600)) }))}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className={microLabel}>{t.labelWave || 'Waveform'}</span>
                <select
                  className={`${field} cursor-pointer`}
                  value={tone.waveform}
                  onChange={event => setTone(current => ({ ...current, waveform: event.target.value as OscillatorType }))}
                >
                  <option value="sine">{t.waveSine || 'Sine'}</option>
                  <option value="square">{t.waveSquare || 'Square'}</option>
                  <option value="triangle">{t.waveTriangle || 'Triangle'}</option>
                  <option value="sawtooth">{t.waveSaw || 'Sawtooth'}</option>
                </select>
              </label>
            </div>
          </div>

          {/* --- reference / listen --- */}
          <div className="border-t border-white/5">
            <div className="flex flex-wrap gap-1 px-3 pt-3 md:px-4">
              {([['reference', Radio, t.label_reference || 'Reference'], ['listen', Ear, t.tabListen || 'Listen']] as const).map(([key, Icon, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPane(key as Pane)}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-wider outline-none transition-all ${
                    pane === key ? 'bg-amber-500/15 text-amber-200' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <div className="p-3 md:p-4">
              {pane === 'reference' ? (
                <div className="space-y-4">
                  {REFERENCE_GROUPS.map(group => (
                    <div key={group.key} className="space-y-2">
                      <span className={microLabel}>{t[`ref_${group.key}`] || group.key}</span>
                      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-6">
                        {group.entries.map(([character, code]) => (
                          <button
                            key={character}
                            type="button"
                            onClick={() => onText(text + character)}
                            className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/5 bg-black/30 px-2 py-1.5 text-left outline-none transition-colors hover:border-amber-500/30 hover:bg-amber-500/10"
                          >
                            <span className="shrink-0 font-mono text-xs font-black text-white">{character}</span>
                            <span className="truncate font-mono text-[11px] tracking-wider text-amber-300/80">{code}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[12px] leading-relaxed text-slate-400">{t.listenIntro || ''}</p>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => audioInputRef.current?.click()}
                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-bold text-slate-300 outline-none transition-all hover:border-amber-500/30 hover:text-amber-200"
                    >
                      <Upload className="h-4 w-4" />
                      {t.buttonOpenAudio || 'Open a recording'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleRecording()}
                      className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold outline-none transition-all ${
                        recording ? 'border-rose-500/40 bg-rose-500/15 text-rose-200' : 'border-white/10 bg-white/5 text-slate-300 hover:border-amber-500/30 hover:text-amber-200'
                      }`}
                    >
                      <Mic className="h-4 w-4" />
                      {recording ? t.buttonStopRecording || 'Stop recording' : t.buttonRecord || 'Record from the mic'}
                    </button>
                  </div>

                  <input
                    ref={audioInputRef}
                    type="file"
                    accept={ACCEPT_AUDIO}
                    className="hidden"
                    onChange={event => {
                      const file = event.target.files?.[0];
                      if (file) takeAudio(file);
                      event.target.value = '';
                    }}
                  />

                  {parked && (
                    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2.5">
                      <FileAudio className="h-5 w-5 shrink-0 text-amber-300" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-white">{parked.file.name}</div>
                        <div className="text-[11px] text-slate-400">{t.parkedHint || 'waiting — nothing has been analysed yet'}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void runListen()}
                        disabled={listening}
                        className="flex cursor-pointer items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/20 px-3 py-2 text-[11px] font-black text-amber-100 outline-none transition-all hover:bg-amber-500/30 disabled:opacity-50"
                      >
                        {listening ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ear className="h-3.5 w-3.5" />}
                        {t.buttonAnalyse || 'Decode it'}
                      </button>
                    </div>
                  )}

                  {heard && (
                    <div className="space-y-2 rounded-xl border border-white/5 bg-black/25 p-3">
                      {heard.envelope.length > 0 && (
                        <div className="relative flex h-14 items-end gap-px">
                          {heard.envelope.map((value, i) => {
                            const peak = Math.max(...heard.envelope, 1e-9);
                            const height = Math.max(2, (value / peak) * 100);
                            return (
                              <span
                                key={i}
                                className={`min-w-[1px] flex-1 rounded-t-sm ${value > heard.threshold ? 'bg-amber-400' : 'bg-white/15'}`}
                                style={{ height: `${height}%` }}
                              />
                            );
                          })}
                          <span
                            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-amber-200/70"
                            style={{ bottom: `${(heard.threshold / Math.max(...heard.envelope, 1e-9)) * 100}%` }}
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {[
                          { label: t.heardTone || 'Tone', value: heard.frequency ? `${heard.frequency} Hz` : '—' },
                          { label: t.heardUnit || 'Unit', value: heard.unitMs ? `${heard.unitMs} ms` : '—' },
                          { label: t.heardWpm || 'Speed', value: heard.wpm ? `${heard.wpm} wpm` : '—' },
                          { label: t.heardConfidence || 'Separation', value: `${Math.round(heard.confidence * 100)}%` },
                        ].map(stat => (
                          <div key={stat.label} className="rounded-lg border border-white/5 bg-black/30 px-2.5 py-1.5">
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">{stat.label}</div>
                            <div className="font-mono text-sm font-bold text-amber-300">{stat.value}</div>
                          </div>
                        ))}
                      </div>

                      {!heard.ok && (
                        <p className="text-[11px] text-rose-300">
                          {t[`listenFail_${heard.reason}`] || t.listenFailGeneric || 'Nothing readable came out of that recording.'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-white/5 p-3 md:p-4">
            <NextStepBar lang={lang} t={t} getResult={getResultFile} disabled={!morse.trim()} />
          </div>
        </section>

        {toast && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-200">
            <Sparkles className="h-4 w-4 shrink-0" />
            {toast}
          </div>
        )}

        <div className="mt-10">
          <AdBanner id="adsense-morse-flow-mid" />
        </div>

        {/* ================================================================ */}
        {/* How it works                                                     */}
        {/* ================================================================ */}
        <section className="mt-20 space-y-10">
          <div className="space-y-3 text-center">
            <h2 className="text-2xl font-black tracking-tight text-white md:text-4xl">{t.howItWorksTitle || 'How it works'}</h2>
            <div className="mx-auto h-1 w-16 rounded-full bg-amber-500" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => {
              const Art = STEP_ART[i];
              return (
                <div key={i} className="glass-card group relative space-y-4 rounded-3xl border border-white/5 p-6 transition-all hover:border-amber-500/20">
                  <span className="absolute right-6 top-5 text-5xl font-black text-white/5 transition-colors group-hover:text-amber-500/10">{i + 1}</span>
                  <Art className="h-auto w-24 text-amber-400" />
                  <h3 className="text-base font-bold leading-snug text-white">{step.title}</h3>
                  <p className="text-[13px] font-medium leading-relaxed text-slate-500">{step.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================================================================ */}
        {/* Features                                                         */}
        {/* ================================================================ */}
        {features.length > 0 && (
          <section className="mt-20 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature, i) => {
              const Icon = featureIcons[i % featureIcons.length];
              return (
                <div key={i} className="glass-card group rounded-3xl border border-white/5 p-6 transition-all duration-300 hover:-translate-y-1">
                  <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-300 transition-all group-hover:border-amber-500/40">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mb-2 text-base font-bold text-white transition-colors group-hover:text-amber-300">{feature.title}</h3>
                  <p className="text-[13px] font-medium leading-relaxed text-slate-500">{feature.text}</p>
                </div>
              );
            })}
          </section>
        )}

        {/* ================================================================ */}
        {/* SEO content                                                      */}
        {/* ================================================================ */}
        <section className="mt-24 space-y-20">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="min-w-0 space-y-6">
              {keywords[0] && (
                <span className="inline-block rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-amber-300">
                  {keywords[0]}
                </span>
              )}
              <h2 className="text-2xl font-black leading-[1.1] tracking-tight text-white md:text-4xl">{t.seoSecondaryTitle || t.seoUseCaseTitle}</h2>
              <p className="text-base font-medium leading-relaxed text-slate-400 md:text-lg">{t.seoHeroText}</p>
            </div>
            <div className="glass-card relative flex min-h-[320px] flex-col items-center justify-center gap-6 overflow-hidden rounded-[2.5rem] border border-white/5 p-8 text-center md:p-10">
              <span className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />
              <IconLocal className="relative h-16 w-16 text-amber-300" />
              <div className="relative max-w-sm space-y-3">
                <h3 className="text-xl font-black leading-tight tracking-tight text-white md:text-2xl">{t.seoBrowserSpeedTitle}</h3>
                <p className="text-sm font-medium leading-relaxed text-slate-400">{t.seoBrowserSpeedText}</p>
              </div>
            </div>
          </div>

          <div className="space-y-8 rounded-3xl border border-white/5 bg-[#1c1206] p-7 md:p-12">
            <div className="max-w-4xl space-y-4">
              <h2 className="text-xl font-black leading-tight text-white md:text-3xl">{t.seoUseCaseTitle}</h2>
              <div className="h-1.5 w-20 rounded-full bg-amber-500" />
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-white opacity-40">
                  <span className="h-px w-6 bg-white/20" />
                  {t.seoUseCaseTitle}
                </div>
                <p className="text-[15px] font-medium leading-relaxed text-slate-400">{t.seoUseCaseText}</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-white opacity-40">
                  <span className="h-px w-6 bg-white/20" />
                  {t.seoPrivacyTitle}
                </div>
                <p className="text-[15px] font-medium leading-relaxed text-slate-400">{t.seoPrivacyText}</p>
              </div>
            </div>
          </div>

          {faqs.length > 0 && (
            <div className="mx-auto w-full max-w-4xl space-y-8">
              <div className="space-y-3 text-center">
                <h2 className="text-2xl font-black tracking-tight text-white md:text-4xl">{t.faqTitle || 'FAQ'}</h2>
                <div className="mx-auto h-1 w-16 rounded-full bg-amber-500" />
              </div>
              <div className="grid gap-3">
                {faqs.map((faq, i) => (
                  <details
                    key={i}
                    className="glass-card group rounded-2xl border border-white/5 px-5 py-5 text-left transition-colors hover:border-amber-500/20 sm:px-6 [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex cursor-pointer list-none items-start gap-3 text-[15px] font-bold text-white transition-colors group-hover:text-amber-300">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-[11px] font-black text-amber-300">Q</span>
                      <span className="min-w-0 flex-1">{faq.question}</span>
                      <span className="shrink-0 text-xl leading-none text-amber-300 transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="pl-9 pt-3 text-sm leading-relaxed text-slate-400">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          )}

          {keywords.length > 0 && (
            <div className="mx-auto w-full max-w-4xl space-y-5 text-center opacity-55">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">{t.seoKeywordsTitle || 'Related searches'}</h2>
              <div className="flex flex-wrap justify-center gap-2">
                {keywords.map((keyword, i) => (
                  <span key={i} className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-slate-400">{keyword}</span>
                ))}
              </div>
            </div>
          )}
        </section>

        <div className="mt-16">
          <AdBanner id="adsense-morse-flow-bottom" />
        </div>
      </main>

      <Footer lang={lang} t={t} onOpenModal={setLegalModal} />

      {(['privacy', 'terms', 'cookies'] as LegalKey[]).map(key => (
        <LegalModal
          key={key}
          isOpen={legalModal === key}
          onClose={() => setLegalModal(null)}
          title={legalTranslations[lang]?.[key].title || key}
          content={legalTranslations[lang]?.[key].content}
          t={t}
        />
      ))}
    </div>
  );
}
