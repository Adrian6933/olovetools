import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { Radio, Copy, Check, RotateCcw, Play, Square, Volume2, VolumeX } from 'lucide-react';
import { legalTranslations } from '../../locales/legal';

interface MorseFlowProps {
  lang: string;
  dictionary: any;
}

const MORSE_MAP: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.',
  G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..',
  M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
  S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--',
  '4': '....-', '5': '.....', '6': '-....', '7': '--...',
  '8': '---..', '9': '----.',
};

const REVERSE_MORSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_MAP).map(([k, v]) => [v, k])
);

const REFERENCE_ENTRIES = Object.entries(MORSE_MAP);

const encodeMorse = (text: string): string => {
  const trimmed = text.trim();
  if (!trimmed) return '';
  const words = trimmed.split(/\s+/);
  return words
    .map((word) =>
      Array.from(word.toUpperCase())
        .map((ch) => MORSE_MAP[ch] || '')
        .filter(Boolean)
        .join(' ')
    )
    .filter((w) => w.length > 0)
    .join(' / ');
};

const decodeMorse = (morse: string): string => {
  const cleaned = morse.trim().replace(/_/g, '-').replace(/\s+/g, ' ');
  if (!cleaned) return '';
  const words = cleaned.split(/\s*\/\s*/);
  return words
    .map((word) =>
      word
        .split(' ')
        .map((code) => REVERSE_MORSE_MAP[code] || '')
        .join('')
    )
    .filter(Boolean)
    .join(' ');
};

type MorseEvent = 'dit' | 'dah' | 'letterGap' | 'wordGap';

const morseToEvents = (morse: string): MorseEvent[] => {
  const events: MorseEvent[] = [];
  const words = morse.split(/\s*\/\s*/);
  for (let w = 0; w < words.length; w++) {
    if (w > 0) events.push('wordGap');
    const letters = words[w].split(' ').filter(Boolean);
    for (let l = 0; l < letters.length; l++) {
      if (l > 0) events.push('letterGap');
      for (const ch of letters[l]) {
        if (ch === '.') events.push('dit');
        else if (ch === '-') events.push('dah');
      }
    }
  }
  return events;
};

const DEFAULT_TEXT = 'SOS HELP';
const DEFAULT_WPM = 15;
const TONE_FREQ = 600;

export default function MorseFlow({ lang, dictionary }: MorseFlowProps) {
  const t = dictionary || {};
  const [textInput, setTextInput] = useState<string>(DEFAULT_TEXT);
  const [morseInput, setMorseInput] = useState<string>(() => encodeMorse(DEFAULT_TEXT));
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [wpm, setWpm] = useState<number>(DEFAULT_WPM);
  const [muted, setMuted] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const finishTimerRef = useRef<number | null>(null);

  const stopAudio = useCallback(() => {
    if (finishTimerRef.current !== null) {
      window.clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }
    oscillatorsRef.current.forEach((osc) => {
      try { osc.stop(); } catch {}
    });
    oscillatorsRef.current = [];
    if (ctxRef.current) {
      try { ctxRef.current.close(); } catch {}
      ctxRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      if (finishTimerRef.current !== null) {
        window.clearTimeout(finishTimerRef.current);
      }
      oscillatorsRef.current.forEach((osc) => {
        try { osc.stop(); } catch {}
      });
      if (ctxRef.current) {
        try { ctxRef.current.close(); } catch {}
      }
    };
  }, []);

  const playAudio = useCallback(() => {
    stopAudio();
    const morse = morseInput.trim();
    if (!morse) return;
    const events = morseToEvents(morse);
    if (events.length === 0) return;

    const unit = 1.2 / wpm;
    const AudioCtor: typeof AudioContext | undefined =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtor) return;
    const ctx: AudioContext = new AudioCtor();
    ctxRef.current = ctx;
    setIsPlaying(true);

    let time = ctx.currentTime + 0.05;
    const oscs: OscillatorNode[] = [];
    const peak = muted ? 0 : 0.3;

    for (const ev of events) {
      if (ev === 'dit' || ev === 'dah') {
        const dur = ev === 'dit' ? unit : unit * 3;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = TONE_FREQ;
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(peak, time + 0.005);
        gain.gain.setValueAtTime(peak, time + Math.max(dur - 0.005, 0.005));
        gain.gain.linearRampToValueAtTime(0, time + dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(time);
        osc.stop(time + dur);
        oscs.push(osc);
        time += dur + unit;
      } else if (ev === 'letterGap') {
        time += unit * 2;
      } else if (ev === 'wordGap') {
        time += unit * 6;
      }
    }

    oscillatorsRef.current = oscs;
    const totalMs = (time - ctx.currentTime) * 1000 + 150;
    finishTimerRef.current = window.setTimeout(() => {
      if (ctxRef.current === ctx) {
        try { ctx.close(); } catch {}
        ctxRef.current = null;
        oscillatorsRef.current = [];
        setIsPlaying(false);
      }
    }, totalMs);
  }, [morseInput, wpm, muted, stopAudio]);

  const handleTextChange = useCallback((value: string) => {
    setTextInput(value);
    setMorseInput(encodeMorse(value));
  }, []);

  const handleMorseChange = useCallback((value: string) => {
    setMorseInput(value);
    setTextInput(decodeMorse(value));
  }, []);

  const copyToClipboard = (field: string, value: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const resetWorkspace = useCallback(() => {
    stopAudio();
    setTextInput(DEFAULT_TEXT);
    setMorseInput(encodeMorse(DEFAULT_TEXT));
    setWpm(DEFAULT_WPM);
    setMuted(false);
    setCopiedField(null);
  }, [stopAudio]);

  const toggleMute = () => {
    if (isPlaying) stopAudio();
    setMuted((m) => !m);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0802] text-slate-200 font-sans relative overflow-x-hidden pt-24">
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-amber-600/10 blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-amber-600/10 blur-[120px] pointer-events-none z-0" />

      <Header
        currentLang={lang}
        onLanguageChange={(l) => (window.location.href = `/${l.toLowerCase()}/morse-flow`)}
        onReset={resetWorkspace}
        t={t}
      />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 md:px-12 py-8 relative z-10 flex flex-col space-y-8">
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center md:justify-start gap-3">
            <Radio className="w-8 h-8 text-amber-400" />
            <span>{t.seoHeroTitle || 'Morse-Flow'}</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed">
            {t.seoHeroText}
          </p>
        </div>

        <div className="flex flex-col bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-amber-400 uppercase tracking-widest text-left flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5" />
                  {t.label_text || 'Text'}
                </label>
                <button
                  onClick={() => copyToClipboard('text', textInput)}
                  disabled={!textInput}
                  title={copiedField === 'text' ? (t.emailCopied || 'Copied!') : (t.tooltip_copy || 'Copy')}
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer outline-none ${
                    copiedField === 'text'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                      : 'bg-white/5 border-white/5 hover:bg-amber-500/20 hover:border-amber-500/30 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                >
                  {copiedField === 'text' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <textarea
                value={textInput}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="SOS HELP"
                spellCheck={false}
                rows={6}
                className="w-full px-4 py-4 rounded-2xl bg-slate-950/50 border border-white/5 focus:border-amber-500/50 font-mono text-sm text-white placeholder-slate-600 focus:ring-0 transition-colors outline-none resize-y"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-amber-400 uppercase tracking-widest text-left flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5" />
                  {t.label_morse || 'Morse'}
                </label>
                <button
                  onClick={() => copyToClipboard('morse', morseInput)}
                  disabled={!morseInput}
                  title={copiedField === 'morse' ? (t.emailCopied || 'Copied!') : (t.tooltip_copy || 'Copy')}
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer outline-none ${
                    copiedField === 'morse'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                      : 'bg-white/5 border-white/5 hover:bg-amber-500/20 hover:border-amber-500/30 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                >
                  {copiedField === 'morse' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <textarea
                value={morseInput}
                onChange={(e) => handleMorseChange(e.target.value)}
                placeholder="... --- ... / .... . .-.. .--."
                spellCheck={false}
                rows={6}
                className="w-full px-4 py-4 rounded-2xl bg-slate-950/50 border border-white/5 focus:border-amber-500/50 font-mono text-sm text-amber-200 placeholder-slate-600 focus:ring-0 transition-colors outline-none resize-y tracking-wider"
              />
            </div>
          </div>

          <div className="border-t border-white/5 pt-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={playAudio}
                  disabled={isPlaying || !morseInput.trim()}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer outline-none border ${
                    isPlaying
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-300/60 cursor-not-allowed'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/50 disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                >
                  <Play className="w-4 h-4" />
                  {t.button_play || 'Play'}
                </button>
                <button
                  onClick={stopAudio}
                  disabled={!isPlaying}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-sm font-bold transition-all cursor-pointer outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Square className="w-4 h-4" />
                  {t.button_stop || 'Stop'}
                </button>
                <button
                  onClick={toggleMute}
                  title={muted ? (t.tooltip_unmute || 'Unmute') : (t.tooltip_mute || 'Mute')}
                  className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition-all cursor-pointer outline-none ${
                    muted
                      ? 'bg-red-500/20 border-red-500/40 text-red-400'
                      : 'bg-white/5 border-white/5 hover:bg-amber-500/20 hover:border-amber-500/30 text-slate-300 hover:text-amber-400'
                  }`}
                >
                  {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              </div>

              <div className="flex items-center gap-3 flex-1 sm:max-w-xs">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 whitespace-nowrap">
                  {t.label_speed || 'Speed'}
                </span>
                <input
                  type="range"
                  min={5}
                  max={40}
                  step={1}
                  value={wpm}
                  onChange={(e) => setWpm(Number(e.target.value))}
                  className="flex-1 accent-amber-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-white whitespace-nowrap tabular-nums">
                  {wpm} {t.label_wpm || 'WPM'}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 flex justify-end">
            <button
              onClick={resetWorkspace}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-amber-500/20 hover:border-amber-500/30 text-slate-300 hover:text-amber-400 text-xs font-bold transition-all cursor-pointer outline-none"
            >
              <RotateCcw className="w-4 h-4" />
              {t.button_reset || 'Reset'}
            </button>
          </div>
        </div>

        <div className="flex flex-col bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 md:p-8 space-y-5">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest text-left">
              {t.label_reference || 'Morse Reference'}
            </h3>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-2">
            {REFERENCE_ENTRIES.map(([char, code]) => (
              <div
                key={char}
                className="bg-slate-950/40 border border-white/5 rounded-xl px-3 py-2.5 flex flex-col items-center gap-1 hover:border-amber-500/30 hover:bg-amber-500/5 transition-colors"
              >
                <span className="text-base font-black text-white">{char}</span>
                <span className="font-mono text-xs text-amber-300 tracking-widest">{code}</span>
              </div>
            ))}
          </div>
        </div>
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
