import React, { useState, useRef, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import LegalModal from './components/LegalModal';
import ClipResult from './components/ClipResult';
import ClipSkeleton from './components/ClipSkeleton';
import { 
  ArrowRight, Loader2, FileText, Zap, Sparkles, ArrowUp, Lightbulb, CheckCircle2, FolderDown, X, ChevronDown, Diamond, Film, Gauge
} from 'lucide-react';
import { fetchClipInfo, fetchMovieBlob } from './services/kickService';
import { ClipData, ClipItem, LoadingState } from './types';
import { createTranslator, type Language } from '../../locales/meta';
import { AdBanner } from '../../components/shared/AdBanner';
import JSZip from 'jszip';
import { motion } from 'framer-motion';
import { useReducedMotion, fadeInUp } from '../../components/shared/motion';

const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

interface KickboltProps {
  lang: Language;
  dictionary?: any;
}

const Kickbolt: React.FC<KickboltProps> = ({ lang = 'en', dictionary }) => {
  const prefersReduced = useReducedMotion();
  const [inputText, setInputText] = useState('');
  const [status, setStatus] = useState<LoadingState>('idle');
  const [clips, setClips] = useState<ClipItem[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [zipProgress, setZipProgress] = useState<{current: number, total: number, percentage: number, loadedBytes: number, totalBytes: number, speed: number, preparingZip?: boolean} | null>(null);
  const [activeLegal, setActiveLegal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [selectedQuality, setSelectedQuality] = useState('max');
  const [isQualityOpen, setIsQualityOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qualityRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const t = createTranslator(dictionary);

  const qualityOptions = [
    { id: 'max', label: 'Max Quality', sub: 'Original Source', icon: <Diamond className="w-4 h-4 text-blue-400" /> },
    { id: '720', label: '720p HD', sub: 'Balanced', icon: <Film className="w-4 h-4 text-kick" /> },
    { id: '360', label: '360p Fast', sub: 'Low Data', icon: <Gauge className="w-4 h-4 text-green-400" /> }
  ];

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    const handleClickOutside = (event: MouseEvent) => {
      if (qualityRef.current && !qualityRef.current.contains(event.target as Node)) {
        setIsQualityOpen(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    if (isQualityOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isQualityOpen]);

  const handleReset = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus('idle');
    setClips([]);
    setInputText('');
    setZipProgress(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let val = e.target.value;
    val = val.replace(/([^\s\n])(https?:\/\/)/g, '$1\n$2');
    setInputText(val);
  };

  const processClips = useCallback(async (urls: string[]) => {
    const unique = [...new Set(urls.filter(u => u.trim()))];
    if (unique.length === 0) { setStatus('idle'); return; }

    setStatus('success'); // Go to results page immediately

    const initialClips: ClipItem[] = unique.map(url => ({
      id: url,
      url,
      status: 'loading'
    }));
    setClips(initialClips);

    if (typeof window !== 'undefined') {
      window.history.pushState({ view: 'results' }, '');
    }

    const CONCURRENCY_LIMIT = 3;
    
    for (let i = 0; i < unique.length; i += CONCURRENCY_LIMIT) {
        const batch = unique.slice(i, i + CONCURRENCY_LIMIT);
        await Promise.allSettled(batch.map(async (url) => {
            try {
                const data = await fetchClipInfo(url);
                setClips(prev => prev.map(c => c.url === url ? { ...c, status: 'success', data } : c));
            } catch (error) {
                setClips(prev => prev.map(c => c.url === url ? { ...c, status: 'error' } : c));
            }
        }));
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlClips = params.get('clips');
    const storageClips = localStorage.getItem('kickbolt_shared_clips');
    const sharedClips = urlClips || storageClips;
    
    if (sharedClips) {
      setInputText(sharedClips);
      const urls = sharedClips.split('\n').filter(u => u.trim());
      if (urls.length > 0) {
        processClips(urls);
      }
      
      // Cleanup
      if (urlClips) window.history.replaceState({ view: 'results' }, '', window.location.pathname);
      if (storageClips) localStorage.removeItem('kickbolt_shared_clips');
    }
  }, [processClips]);

  // Manejo del botón atrás del navegador/ratón
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Si estamos en la vista de resultados y el usuario pulsa atrás, volvemos al buscador
      if (status === 'success') {
        handleReset();
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [status, handleReset]);

  // Reset scroll to top when entering results
  useEffect(() => {
    if (status === 'success') {
      window.scrollTo(0, 0);
    }
  }, [status]);

  const downloadAllAsZip = async () => {
    const validClips = clips.filter(c => c.status === 'success' && c.data).map(c => c.data!);
    if (validClips.length === 0 || zipProgress) return;
    
    // Crear nuevo controlador para permitir abortar
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setZipProgress({ current: 0, total: validClips.length, percentage: 0, loadedBytes: 0, totalBytes: 0, speed: 0 });
    const zip = new JSZip();
    
    const CONCURRENCY_LIMIT = 5; // Increased concurrency for faster downloads
    let completedCount = 0;
    let globalLoaded = 0;
    let globalTotal = 0;
    let lastTime = Date.now();
    let lastLoaded = 0;
    let currentSpeed = 0;

    const updateProgress = () => {
        const now = Date.now();
        const timeDiff = (now - lastTime) / 1000;
        if (timeDiff > 0.5) {
            const bytesDiff = globalLoaded - lastLoaded;
            currentSpeed = bytesDiff / timeDiff;
            lastTime = now;
            lastLoaded = globalLoaded;
        }

        setZipProgress({
            current: completedCount,
            total: validClips.length,
            percentage: Math.round((completedCount / validClips.length) * 100),
            loadedBytes: globalLoaded,
            totalBytes: globalTotal,
            speed: currentSpeed
        });
    };

    try {
      const downloadTask = async (clip: ClipData, index: number) => {
        if (signal.aborted) return;

        let chosenRes = clip.resolutions[0];
        if (selectedQuality !== 'max') {
          const target = selectedQuality + 'p';
          const found = clip.resolutions.find(r => r.quality === target) || clip.resolutions.find(r => r.quality.startsWith(selectedQuality));
          if (found) chosenRes = found;
        }

        let clipLoaded = 0;
        let clipTotal = 0;

        try {
          const blob = await fetchMovieBlob(chosenRes.url, (loaded, total) => {
              globalLoaded += (loaded - clipLoaded);
              clipLoaded = loaded;
              if (total > clipTotal) {
                  globalTotal += (total - clipTotal);
                  clipTotal = total;
              }
              updateProgress();
          }, signal);
          const fileName = `${index + 1}_${clip.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${chosenRes.quality}.mp4`;
          zip.file(fileName, blob);
        } catch (err: any) {
          if (err.message !== "AbortError") {
            console.error(`Error downloading clip ${clip.id}`, err);
          }
        } finally {
          if (!signal.aborted) {
            completedCount++;
            updateProgress();
          }
        }
      };

      for (let i = 0; i < validClips.length; i += CONCURRENCY_LIMIT) {
        if (signal.aborted) break;
        const batch = validClips.slice(i, i + CONCURRENCY_LIMIT);
        await Promise.all(batch.map((clip, idx) => downloadTask(clip, i + idx)));
      }

      if (signal.aborted) throw new Error("AbortError");

      setZipProgress(prev => prev ? { ...prev, preparingZip: true } : null);

      const content = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
      const zipName = `kickbolt_${selectedQuality}_pack_${new Date().getTime()}.zip`;
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = zipName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      if (error.message !== "AbortError") {
        alert("Error generating ZIP");
      }
    } finally {
      if (!signal.aborted) {
        setTimeout(() => setZipProgress(null), 2000);
      }
      abortControllerRef.current = null;
    }
  };

  const activeOption = qualityOptions.find(o => o.id === selectedQuality) || qualityOptions[0];

  const handleLangChange = (code: string) => {
    if (code === lang) return;
    localStorage.setItem('olovetools_lang', code);
    window.location.href = `/${code}/kickbolt`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050407] selection:bg-kick/30 relative overflow-hidden" style={{ backgroundImage: 'linear-gradient(to bottom, #15121e 0%, #0f0d14 25%, #0a080f 50%, #07060a 75%, #050407 100%)' }}>
      {/* Long Linear Atmospheric Glow */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-kick/[0.05] via-transparent to-transparent pointer-events-none" />
      
      <Header onReset={handleReset} currentLang={lang} onLangChange={handleLangChange} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 pt-52 pb-40">
        {/* Bloque AdSense Horizontal — debajo del header */}
        <AdBanner id="adsense-kickbolt-top" className="mb-12" />

        {status !== 'success' && (
          <div className="flex flex-col items-center">
            <div className="text-center mb-16 space-y-6 animate-slide-up">
              <h1 className="text-5xl sm:text-7xl md:text-[115px] font-[900] uppercase leading-[0.82] tracking-tight text-white pr-6 inline-block skew-x-[-15deg] drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                <span className="block mb-2">{t.heroTitle?.split(' ')[0]}</span>
                <span className="text-kick">{t.heroTitle?.split(' ').slice(1,2)}</span> <span className="text-white">{t.heroTitle?.split(' ').slice(2).join(' ')}</span>
              </h1>
              <h2 className="text-gray-400 text-lg md:text-xl max-w-xl mx-auto font-medium leading-relaxed opacity-60">
                {t.heroDesc}
              </h2>
            </div>

            <div className="w-full max-w-4xl animate-slide-up [animation-delay:150ms]">
              <div 
                style={{ willChange: 'transform' }}
                className="bg-[#111114]/50 backdrop-blur-3xl border border-white/5 p-4 rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]"
              >
                <div className="bg-[#0e0e10] rounded-[3rem] p-10 flex flex-col md:flex-row gap-12 items-stretch">
                  <div className="md:w-[38%] shrink-0 order-2 md:order-1">
                    <input type="file" ref={fileInputRef} accept=".txt" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const r = new FileReader();
                        r.onload = (ev) => setInputText(ev.target?.result as string);
                        r.readAsText(file);
                      }
                    }} className="hidden" />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-full min-h-[140px] md:min-h-[280px] border-2 border-dashed border-white/5 rounded-[2rem] md:rounded-[2.5rem] flex flex-col items-center justify-center gap-4 md:gap-6 hover:border-kick/40 hover:bg-kick/5 transition-all group overflow-hidden p-6 md:p-0 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <div className="p-4 md:p-7 bg-dark-800 rounded-xl md:rounded-[2rem] group-hover:scale-110 transition-transform shadow-inner shrink-0">
                        <FileText className="w-6 h-6 md:w-12 md:h-12 text-gray-500 group-hover:text-kick" />
                      </div>
                      <span className="text-[9px] md:text-[11px] font-[900] uppercase tracking-[0.15em] md:tracking-[0.25em] text-white/40 group-hover:text-white/80 text-center">
                        {t.uploadTxt}
                      </span>
                    </button>
                  </div>

                  <div className="flex-1 flex flex-col justify-between gap-6 py-2 order-1 md:order-2">
                    <div className="flex flex-col gap-5 h-full">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0 px-2">
                        <div className="order-2 md:order-1 flex items-center gap-2.5">
                          <div className="w-1.5 h-1.5 bg-kick rounded-full animate-pulse" />
                          <span className="text-[10px] font-black text-gray-400 md:text-gray-500 uppercase tracking-[0.2em]">{t.linkInputLabel}</span>
                        </div>
                        <div className="order-1 md:order-2 px-3 py-1 bg-kick/10 rounded-md border border-kick/20">
                          <span className="text-[9px] font-black text-kick uppercase tracking-[0.2em]">{t.twitchClipsLabel}</span>
                        </div>
                      </div>
                      
                      <div 
                        style={{ willChange: 'transform, opacity, border-color' }}
                        className={`
                        relative flex-1 bg-white/[0.02] rounded-[2rem] p-6 border-2 transition-all duration-1000
                        ${!inputText ? 'border-kick/30 animate-soft-pulse shadow-[0_0_30px_rgba(83,252,24,0.05)]' : 'border-white/5'}
                        focus-within:border-kick/50 focus-within:bg-white/[0.04] focus-within:animate-none focus-within:scale-[1.01] focus-within:shadow-[0_0_50px_rgba(83,252,24,0.1)]
                      `}>
                        <textarea 
                          value={inputText}
                          onChange={handleTextChange}
                          placeholder={t.pastePlaceholder}
                          className="w-full h-44 md:h-64 bg-transparent border-none text-base md:text-xl font-medium placeholder:text-gray-700 resize-none outline-none text-white p-0 custom-scrollbar relative z-10"
                        />
                        {!inputText && (
                          <div className="absolute top-6 left-5 pointer-events-none flex items-center gap-1">
                            <div className="w-[3px] h-6 md:h-8 bg-kick rounded-full animate-caret shadow-[0_0_15px_rgba(83,252,24,0.8)]" />
                          </div>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        const cleanText = inputText.replace(/\s+/g, '');
                        const urls = cleanText.split(/(?=https?:\/\/)/).filter(u => u.trim());
                        processClips(urls);
                      }}
                      disabled={status === 'loading' || !inputText.trim()}
                      className="w-full h-16 bg-kick hover:bg-kick-dark text-white rounded-2xl font-[900] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(83,252,24,0.3)] transition-all hover:translate-y-[-2px] hover:scale-[1.01] active:translate-y-[1px] active:scale-[0.99] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {status === 'loading' ? <Loader2 className="w-6 h-6 animate-spin" /> : <> {t.processButton} <ArrowRight className="w-5 h-5" /> </>}
                    </button>
                    {status === 'error' && (
                      <div className="text-red-400 text-sm font-bold text-center mt-2">
                        No valid clips found. Please check your links.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 w-full max-w-4xl animate-slide-up [animation-delay:200ms]">
               <a 
                 href={`/${lang}/twitchbolt`}
                 className="flex flex-col md:flex-row items-center justify-center gap-3 p-4 bg-[#7c3aed]/10 border border-[#7c3aed]/20 rounded-2xl hover:bg-[#7c3aed]/20 transition-all group cursor-pointer"
               >
                  <Sparkles className="w-5 h-5 text-[#7c3aed] group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-gray-300">
                    {lang === 'es' ? '¿Quieres descargar clips de Twitch?' : 'Looking to download Twitch clips?'} <span className="text-[#7c3aed] font-bold">Try TwitchBolt →</span>
                  </span>
               </a>
            </div>

            <div className="mt-48 w-full max-w-4xl animate-slide-up [animation-delay:300ms]">
               <div className="flex flex-col md:flex-row items-center gap-8 p-6 bg-[#18181b]/30 backdrop-blur-md border border-white/5 rounded-[2.5rem] hover:bg-[#18181b]/50 transition-all group">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Sparkles className="w-8 h-8 text-kick fill-kick/10" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-black text-white">{t.ctaTitle}</h3>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">{t.ctaDesc}</p>
                  </div>
                  <a 
                    href={`/${lang}/clipy`} 
                    className="bg-kick text-white px-10 py-4 rounded-xl font-[900] uppercase text-xs tracking-widest hover:bg-kick-dark transition-all shadow-xl shadow-kick/10 hover:scale-105 whitespace-nowrap"
                  >
                    {t.ctaButton}
                  </a>
               </div>
            </div>

            <motion.div
              initial={prefersReduced ? false : 'hidden'}
              whileInView={prefersReduced ? undefined : 'visible'}
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeInUp}
            >
            <section className="mt-48 w-full max-w-6xl animate-slide-up [animation-delay:450ms]">
                <div className="flex flex-col items-center text-center space-y-4 mb-16">
                    <div className="bg-yellow-500/10 p-4 rounded-[1.5rem] border border-yellow-500/20">
                        <Lightbulb className="w-8 h-8 text-yellow-500" />
                    </div>
                    <h2 className="text-4xl font-[900] uppercase italic tracking-tighter text-white">{t.proTipsTitle}</h2>
                    <div className="w-24 h-1 bg-yellow-500 rounded-full"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                      { title: t.tip1Title, desc: t.tips1, color: 'border-blue-500/20' },
                      { title: t.tip2Title, desc: t.tips2, color: 'border-pink-500/20' },
                      { title: t.tip3Title, desc: t.tips3, color: 'border-green-500/20' }
                    ].map((tip, i) => (
                      <div key={i} className={`p-10 bg-[#111114] border ${tip.color} rounded-[2.5rem] space-y-4 hover:bg-[#18181b] transition-all`}>
                          <h4 className="font-black text-white uppercase tracking-widest text-xs flex items-center gap-3">
                              <CheckCircle2 className="w-4 h-4 text-green-500" /> {tip.title}
                          </h4>
                          <p className="text-gray-400 text-sm leading-relaxed">{tip.desc}</p>
                      </div>
                    ))}
                </div>
            </section>
            </motion.div>
          </div>
        )}

        {/* RESULTS AREA */}
        {status === 'success' && (
          <div id="results-area" className="w-full space-y-12 animate-fade-in max-w-5xl mx-auto">
             <div className="w-full bg-[#111114] border border-white/5 rounded-[2.5rem] p-4 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative z-40">
                
                {/* Barra al 88%, margen superior de 4px, centrada horizontalmente */}
                {zipProgress && (
                  <div className="absolute top-[4px] left-1/2 -translate-x-1/2 w-[88%] h-1 overflow-hidden pointer-events-none rounded-full bg-white/5">
                    <div className="h-full bg-kick transition-all duration-300 z-50" style={{ width: `${zipProgress.percentage}%` }}></div>
                  </div>
                )}
                
                <div className="flex items-center gap-4 px-6">
                    <h2 className="text-sm font-black uppercase text-white tracking-widest">{clips.length} {t.clipsFound}</h2>
                </div>

                {/* CUSTOM SELECT QUALITY */}
                <div className="relative flex-1 max-w-xs" ref={qualityRef}>
                    <button 
                      onClick={() => setIsQualityOpen(!isQualityOpen)}
                      className="relative z-50 w-full bg-dark-950 text-white rounded-2xl p-4 border border-white/5 flex items-center justify-between group hover:border-kick/30 transition-all cursor-pointer hover:bg-white/[0.03] active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/5 rounded-lg group-hover:bg-kick/10 transition-colors">
                              {activeOption.icon}
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-black uppercase tracking-tight">{activeOption.label}</p>
                              <p className="text-[9px] font-bold text-gray-500 uppercase">{activeOption.sub}</p>
                            </div>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isQualityOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isQualityOpen && (
                        <div 
                          className="absolute top-full left-0 w-full mt-2 bg-[#111114] border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-fade-in z-50"
                        >
                            {qualityOptions.map((opt) => (
                              <button 
                                key={opt.id}
                                onClick={() => { setSelectedQuality(opt.id); setIsQualityOpen(false); }}
                                className={`w-full flex items-center gap-4 p-4 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 cursor-pointer ${selectedQuality === opt.id ? 'bg-kick/5' : ''}`}
                              >
                                  <div className={`p-2 rounded-lg ${selectedQuality === opt.id ? 'bg-kick/20' : 'bg-white/5'}`}>
                                    {opt.icon}
                                  </div>
                                  <div>
                                      <p className={`text-xs font-black uppercase tracking-tight ${selectedQuality === opt.id ? 'text-kick' : 'text-white'}`}>
                                        {opt.label}
                                      </p>
                                      <p className="text-[9px] font-bold text-gray-500 uppercase">{opt.sub}</p>
                                  </div>
                                  {selectedQuality === opt.id && <div className="ml-auto w-1.5 h-1.5 bg-kick rounded-full" />}
                              </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 px-2">
                    {(() => {
                      const isAnyLoading = clips.some(c => c.status === 'loading');
                      return (
                        <button 
                          onClick={downloadAllAsZip} 
                          disabled={!!zipProgress || isAnyLoading} 
                          className="bg-white text-black font-[900] text-xs px-10 py-4 rounded-xl flex items-center gap-3 hover:bg-gray-100 uppercase tracking-widest transition-all disabled:opacity-50 cursor-pointer hover:scale-[1.03] active:scale-[0.97] shadow-xl"
                        >
                          {isAnyLoading ? (
                            <> <Loader2 className="w-4 h-4 animate-spin" /> {t.loadingClips || 'LOADING CLIPS...'} </>
                          ) : zipProgress ? (
                            zipProgress.preparingZip ? (
                              <> <Loader2 className="w-4 h-4 animate-spin" /> {t.preparingZip || 'PREPARING ZIP...'} </>
                            ) : (
                              <div className="flex flex-col items-center">
                                <div className="flex items-center gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin" /> 
                                  <span>{zipProgress.current}/{zipProgress.total} ({zipProgress.percentage}%)</span>
                                </div>
                                {zipProgress.speed > 0 && (
                                  <span className="text-[9px] text-gray-500 font-bold mt-0.5">
                                    {formatBytes(zipProgress.speed)}/s • {formatBytes(zipProgress.loadedBytes)}
                                  </span>
                                )}
                              </div>
                            )
                          ) : (
                            <> <FolderDown className="w-4 h-4" /> {t.downloadZip || 'Download ZIP'} </>
                          )}
                        </button>
                      );
                    })()}
                    <button onClick={handleReset} className="w-12 h-12 bg-dark-950 border border-white/5 rounded-xl flex items-center justify-center text-gray-500 hover:text-white transition-all cursor-pointer hover:bg-red-500/10 hover:border-red-500/20 active:scale-90">
                        <X className="w-5 h-5" />
                    </button>
                </div>
             </div>
             
             <div className="grid grid-cols-1 gap-12 relative z-10">
                {clips.map((c, i) => {
                  if (c.status === 'loading') {
                    return <ClipSkeleton key={c.id} />;
                  }
                  if (c.status === 'error') {
                    return (
                      <div key={c.id} className="bg-[#111114]/50 backdrop-blur-3xl border border-red-500/20 rounded-[3rem] p-6 md:p-10 flex items-center justify-between">
                        <div className="text-red-400 font-medium">Failed to load clip: <span className="text-gray-500 text-sm ml-2">{c.url}</span></div>
                        <button onClick={() => setClips(prev => prev.filter(x => x.id !== c.id))} className="w-10 h-10 bg-red-500/10 hover:bg-red-500/20 rounded-full flex items-center justify-center text-red-400 transition-colors cursor-pointer">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  }
                  if (c.data) {
                    return <ClipResult key={c.id} data={c.data} index={i+1} onReset={() => setClips(prev => prev.filter(x => x.id !== c.id))} lang={lang} dictionary={dictionary} />;
                  }
                  return null;
                })}
             </div>
          </div>
        )}
      </main>

      {/* Bloque AdSense Horizontal — al final, antes del footer */}
      <AdBanner id="adsense-kickbolt-bottom" className="mb-12" />

      <Footer lang={lang} dictionary={dictionary} onOpenLegal={setActiveLegal} />

      <LegalModal type={activeLegal} lang={lang} dictionary={dictionary} onClose={() => setActiveLegal(null)} />

      <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className={`fixed bottom-8 right-8 p-4 bg-kick text-white rounded-full shadow-2xl transition-all ${showScrollTop ? 'scale-100 opacity-100' : 'scale-0 opacity-0'} hover:scale-110 hover:-translate-y-2 active:scale-95 z-50 cursor-pointer group`}><ArrowUp className="w-6 h-6 group-hover:scale-110 transition-transform" /></button>
    </div>
  );
};

export default Kickbolt;