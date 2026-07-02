import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Play, Pause, Square, Download, Trash2, History, Globe, Settings, Info, Check } from 'lucide-react';
import { useTranslation, Language } from '../../locales/dictionary';
import { AdBanner } from '../../components/shared/AdBanner';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { legalTranslations } from '../../locales/legal';

interface TTSBoltProps {
  lang: string;
  dictionary: any;
}

const chunkText = (text: string, maxLen = 180): string[] => {
  if (!text) return [];
  const chunks: string[] = [];
  let currentChunk = '';
  
  // Split by spaces or punctuation to keep words and phrases intact
  const parts = text.split(/([\s.,!?;:()]+)/);
  for (const part of parts) {
    if (!part) continue;
    if (part.length > maxLen) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      let remaining = part;
      while (remaining.length > maxLen) {
        chunks.push(remaining.substring(0, maxLen));
        remaining = remaining.substring(maxLen);
      }
      currentChunk = remaining;
    } else if ((currentChunk + part).length > maxLen) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = part;
    } else {
      currentChunk += part;
    }
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  return chunks;
};

const mergeArrayBuffers = (buffers: ArrayBuffer[]): Blob => {
  let totalLength = 0;
  for (const buffer of buffers) {
    totalLength += buffer.byteLength;
  }
  
  const tmp = new Uint8Array(totalLength);
  let offset = 0;
  for (const buffer of buffers) {
    tmp.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  }
  
  return new Blob([tmp.buffer], { type: 'audio/mpeg' });
};

const getGoogleLangCode = (voiceLang: string, fallbackLang: string): string => {
  if (!voiceLang) return fallbackLang;
  const parts = voiceLang.split(/[-_]/);
  const mainLang = parts[0].toLowerCase();
  
  if (mainLang === 'zh') {
    const region = parts[1]?.toUpperCase();
    if (region === 'TW' || region === 'HK') return 'zh-TW';
    return 'zh-CN';
  }
  if (mainLang === 'pt') {
    const region = parts[1]?.toUpperCase();
    if (region === 'BR') return 'pt-br';
    return 'pt-pt';
  }
  if (mainLang === 'en') {
    const region = parts[1]?.toUpperCase();
    if (region === 'GB' || region === 'UK') return 'en-gb';
    return 'en';
  }
  
  return mainLang;
};

export const TTSBolt: React.FC<TTSBoltProps> = ({ lang, dictionary }) => {
  const { t } = useTranslation(lang as Language, 'tts-bolt');
  
  const [text, setText] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [rate, setRate] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'privacy' | 'terms' | 'cookies'>('privacy');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!synth) return;
    
    const updateVoices = () => {
      const availableVoices = synth.getVoices();
      setVoices(availableVoices);
      
      if (availableVoices.length > 0) {
        const matching = availableVoices.find(v => v.lang.startsWith(lang));
        const fallback = availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];
        setSelectedVoiceName(prev => {
          if (prev && availableVoices.some(v => v.name === prev)) return prev;
          return matching ? matching.name : fallback.name;
        });
      }
    };
    
    updateVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = updateVoices;
    }
  }, [lang, synth]);

  useEffect(() => {
    const stored = localStorage.getItem('tts_bolt_history');
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (synth) {
        synth.cancel();
      }
    };
  }, [synth]);

  const addToHistory = (txt: string, voiceName: string, r: number, p: number) => {
    const cleanText = txt.trim();
    if (!cleanText) return;
    
    const newHistory = [
      {
        id: Date.now().toString(),
        text: cleanText.length > 150 ? cleanText.substring(0, 150) + '...' : cleanText,
        fullText: cleanText,
        voiceName,
        rate: r,
        pitch: p,
        date: new Date().toLocaleDateString()
      },
      ...history.filter(h => h.fullText !== cleanText)
    ].slice(0, 15);
    
    setHistory(newHistory);
    localStorage.setItem('tts_bolt_history', JSON.stringify(newHistory));
  };

  const clearAllHistory = () => {
    setHistory([]);
    localStorage.removeItem('tts_bolt_history');
  };

  const handlePlay = () => {
    if (!synth || !text.trim()) return;
    
    if (isPaused) {
      synth.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }
    
    synth.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find(v => v.name === selectedVoiceName);
    if (voice) {
      utterance.voice = voice;
    }
    utterance.rate = rate;
    utterance.pitch = pitch;
    
    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };
    
    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };
    
    utteranceRef.current = utterance;
    addToHistory(text, voice?.name || 'Default', rate, pitch);
    
    setIsPlaying(true);
    setIsPaused(false);
    synth.speak(utterance);
  };

  const handlePause = () => {
    if (!synth) return;
    if (isPlaying && !isPaused) {
      synth.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (!synth) return;
    synth.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const handleDownload = async () => {
    if (!text.trim()) return;
    setIsDownloading(true);
    setAlertMessage(null);
    
    try {
      const voice = voices.find(v => v.name === selectedVoiceName);
      const langCode = getGoogleLangCode(voice ? voice.lang : lang, lang);
      const chunks = chunkText(text, 180);
      const buffers: ArrayBuffer[] = [];
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${langCode}&client=tw-ob&q=${encodeURIComponent(chunk)}`;
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(googleUrl)}`;
        
        const response = await fetch(proxyUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch audio segment ${i + 1}`);
        }
        
        const buffer = await response.arrayBuffer();
        buffers.push(buffer);
      }
      
      const mp3Blob = mergeArrayBuffers(buffers);
      const blobUrl = URL.createObjectURL(mp3Blob);
      
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `tts-bolt-${Date.now()}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error(error);
      setAlertMessage('Failed to generate MP3. Please check your internet connection and try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#060504] text-slate-200 font-sans flex flex-col">
      <Header
        currentLang={lang}
        onLanguageChange={(newLang) => {
          window.location.href = `/${newLang.toLowerCase()}/tts-bolt`;
        }}
        onReset={() => {
          setText('');
          setRate(1.0);
          setPitch(1.0);
          handleStop();
        }}
        t={t}
      />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-12 pt-36 pb-24 relative z-10 flex flex-col justify-center">
        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-tts-bolt-top" />
        {/* Hero title */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-4xl md:text-6xl font-black font-outfit tracking-tight text-white mb-4">
            {t.seoHeroTitle || 'Convert Text to Speech and Save as MP3'}
          </h1>
          <p className="text-slate-400 text-lg max-w-3xl mx-auto leading-relaxed font-medium">
            {t.seoHeroText || 'Enjoy natural speech synthesis completely in your browser tab.'}
          </p>
        </div>

        {alertMessage && (
          <div className="max-w-4xl mx-auto w-full mb-6 bg-red-950/30 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3 text-red-200">
            <Info className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold">{alertMessage}</span>
          </div>
        )}

        {/* Dashboard Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto w-full">
          {/* Editor and sliders */}
          <div className="lg:col-span-7 bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.textarea_placeholder || 'Type or paste your text here to read aloud...'}
              className="w-full h-80 bg-black/40 border border-white/10 rounded-2xl p-5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors resize-none font-medium text-base leading-relaxed"
            />
            <div className="flex items-center justify-between mt-3 text-xs text-slate-400 font-bold uppercase tracking-wider">
              <div>
                {wordCount} {t.words || 'words'}
              </div>
              <div>
                {text.length} {t.chars || 'characters'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t border-white/5">
              {/* Voice select dropdown */}
              <div className="md:col-span-2 flex flex-col gap-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-amber-500" />
                  {t.label_voice || 'Voice Selection'}
                </label>
                <select
                  value={selectedVoiceName}
                  onChange={(e) => setSelectedVoiceName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-amber-500 transition-colors font-medium text-sm"
                >
                  {voices.map((voice) => (
                    <option key={voice.name} value={voice.name} className="bg-[#050508] text-slate-200">
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>

              {/* Speed Slider */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-amber-500" />
                    {t.label_speed || 'Reading Speed'}
                  </label>
                  <span className="text-xs font-bold text-amber-400 font-mono">{rate}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Pitch Slider */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-amber-500" />
                    {t.label_pitch || 'Voice Pitch'}
                  </label>
                  <span className="text-xs font-bold text-amber-400 font-mono">{pitch}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Right Column: controls & history */}
          <div className="lg:col-span-5 flex flex-col gap-8 w-full">
            {/* Player Control center */}
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md flex flex-col gap-6 relative overflow-hidden">
              <div className="flex flex-col items-center gap-4">
                <div className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-amber-500" />
                  Speech Player
                </div>
                
                {/* Visualizer animation */}
                <div className="flex items-center justify-center space-x-1.5 h-16 w-full bg-black/40 border border-white/10 rounded-2xl relative overflow-hidden px-4">
                  <style>{`
                    @keyframes soundwave-bounce {
                      0%, 100% { height: 8px; }
                      50% { height: 36px; }
                    }
                    .animate-soundwave {
                      animation: soundwave-bounce 1.2s ease-in-out infinite;
                    }
                  `}</style>
                  {[...Array(15)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 bg-amber-500 rounded-full transition-all duration-300 ${
                        isPlaying ? 'animate-soundwave' : 'h-2'
                      }`}
                      style={{
                        animationDelay: `${i * 0.08}s`,
                        height: isPlaying ? undefined : '6px',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={handlePlay}
                  disabled={!text.trim()}
                  className="flex flex-col items-center justify-center gap-2 py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-black text-xs uppercase rounded-2xl transition-all cursor-pointer select-none active:scale-95 duration-200 border-none outline-none shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20"
                >
                  <Play className="w-5 h-5 fill-black" />
                  <span>{isPaused ? 'Resume' : (t.btn_play || 'Listen')}</span>
                </button>

                <button
                  onClick={handlePause}
                  disabled={!isPlaying || isPaused}
                  className="flex flex-col items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white font-black text-xs uppercase rounded-2xl border border-white/10 hover:border-white/20 transition-all cursor-pointer select-none active:scale-95 duration-200 outline-none"
                >
                  <Pause className="w-5 h-5 fill-white" />
                  <span>{t.btn_pause || 'Pause'}</span>
                </button>

                <button
                  onClick={handleStop}
                  disabled={!isPlaying && !isPaused}
                  className="flex flex-col items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white font-black text-xs uppercase rounded-2xl border border-white/10 hover:border-white/20 transition-all cursor-pointer select-none active:scale-95 duration-200 outline-none"
                >
                  <Square className="w-5 h-5 fill-white" />
                  <span>{t.btn_stop || 'Stop'}</span>
                </button>
              </div>

              {/* Downloader */}
              <button
                onClick={handleDownload}
                disabled={isDownloading || !text.trim()}
                className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 text-white font-black text-sm uppercase rounded-2xl transition-all cursor-pointer active:scale-95 duration-200 border-none outline-none shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20"
              >
                <Download className="w-5 h-5" />
                <span>{isDownloading ? (t.btn_downloading || 'Generating MP3...') : (t.btn_download || 'Download MP3')}</span>
              </button>
            </div>

            {/* History stack */}
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-md flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-amber-500" />
                  {t.history_title || 'Recent History'}
                </div>
                {history.length > 0 && (
                  <button
                    onClick={clearAllHistory}
                    className="text-xs font-bold text-red-400 hover:text-red-300 border-none bg-transparent outline-none cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.clear_history || 'Clear'}</span>
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="text-slate-500 text-sm font-medium py-6 text-center">
                  {t.no_history || 'No audio history yet.'}
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setText(item.fullText);
                        const matchingVoice = voices.find(v => v.name === item.voiceName);
                        if (matchingVoice) setSelectedVoiceName(matchingVoice.name);
                        setRate(item.rate);
                        setPitch(item.pitch);
                      }}
                      className="flex flex-col gap-1 p-3 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-amber-500/30 rounded-xl transition-all cursor-pointer group text-left"
                    >
                      <div className="text-slate-300 text-sm font-medium line-clamp-2 leading-relaxed">
                        {item.text}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1.5">
                        <span className="group-hover:text-amber-400 transition-colors">
                          {item.voiceName} ({item.rate}x)
                        </span>
                        <span>{item.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      {/* Bloque AdSense Horizontal */}
      <AdBanner id="adsense-tts-bolt-bottom" />
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

export default TTSBolt;
