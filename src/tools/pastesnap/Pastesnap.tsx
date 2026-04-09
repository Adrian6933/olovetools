
import React, { useState, useEffect, useCallback, useRef } from 'react';
import JSZip from 'jszip';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './components/Header';
import { CookieConsent } from './components/CookieConsent';
import { LegalModal } from './components/LegalModal';
import { PastedImage } from './types';
import { useTranslation, Language } from '../../locales/dictionary';

interface PastesnapProps {
  lang: Language;
  dictionary?: any;
}

const Pastesnap: React.FC<PastesnapProps> = ({ lang, dictionary }) => {
  const { dictionary: t } = useTranslation((lang || 'en') as Language, 'pastesnap');
  const [images, setImages] = useState<PastedImage[]>([]);
  const [expandedImage, setExpandedImage] = useState<PastedImage | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const lastClipboardId = useRef<string | null>(null);

  const handleLanguageChange = (newLang: string) => {
    window.location.href = `/${newLang.toLowerCase()}/pastesnap`;
  };

  const handlePasteClick = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) return;
      
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageTypes = item.types.filter(type => type.startsWith('image/'));
        if (imageTypes.length > 0) {
          const blob = await item.getType(imageTypes[0]);
          const file = new File([blob], "clipboard-image.png", { type: blob.type });
          processFile(file);
          return; // Paste the first image found
        }
      }
    } catch (err) {
      console.debug("Paste from click failed or no image:", err);
    }
  };

  const processFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const newImg: PastedImage = {
      id: Math.random().toString(36).substr(2, 9),
      url,
      blob: file,
      name: `pastesnap-${Date.now()}.png`,
      timestamp: new Date()
    };
    setImages(prev => [...prev, newImg]);
  }, []);

  const tryAutoPaste = useCallback(async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) return;
      
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageTypes = item.types.filter(type => type.startsWith('image/'));
        if (imageTypes.length > 0) {
          const blob = await item.getType(imageTypes[0]);
          const file = new File([blob], "clipboard-image.png", { type: blob.type });
          
          const clipboardId = `${file.size}-${file.type}`;
          if (lastClipboardId.current === clipboardId) continue;
          
          lastClipboardId.current = clipboardId;
          processFile(file);
        }
      }
    } catch (err) {
      console.debug("Auto-paste suppressed:", err);
    }
  }, [processFile]);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) processFile(blob);
        }
      }
    }
  }, [processFile]);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    
    const onFocus = () => {
      setIsFocused(true);
      tryAutoPaste();
    };
    const onBlur = () => setIsFocused(false);
    
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    window.addEventListener('scroll', handleScroll);
    
    tryAutoPaste();
    
    return () => {
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handlePaste, tryAutoPaste]);

  const downloadImage = (img: PastedImage) => {
    const link = document.createElement('a');
    link.href = img.url;
    link.download = img.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllImages = async () => {
    const zip = new JSZip();
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const response = await fetch(img.url);
      const blob = await response.blob();
      zip.file(`${i + 1}_${img.name}`, blob);
    }
    
    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = 'images.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const target = prev.find(img => img.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter(img => img.id !== id);
    });
  };

  const resetApp = () => {
    images.forEach(img => URL.revokeObjectURL(img.url));
    setImages([]);
    setExpandedImage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#04050a] text-gray-100 selection:bg-indigo-500/30 overflow-x-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-600/10 blur-[150px] rounded-full animate-fast-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-pink-600/10 blur-[150px] rounded-full animate-fast-pulse" style={{ animationDelay: '4s' }}></div>
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full animate-fast-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <Header currentLang={lang || 'en'} onLanguageChange={handleLanguageChange} onReset={resetApp} t={t} />

      <main className="flex-1 flex flex-col items-center pt-40 pb-32 px-4 md:px-12 relative z-10 w-full">
        <div className="max-w-6xl w-full text-center space-y-20 md:space-y-32">
          
          <div className="flex flex-col items-center space-y-6 animate-in fade-in slide-in-from-top duration-1000">
            <div className="flex flex-col items-center gap-4">
              <div className="inline-flex items-center space-x-3 px-6 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] md:text-xs font-black tracking-[0.25em] uppercase animate-in slide-in-from-bottom stagger-1 shadow-[0_0_30px_rgba(79,70,229,0.15)]">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                </span>
                <span>{t.onlineClipboardUtility}</span>
              </div>
              
              <div className="flex items-center space-x-2 text-[9px] font-bold text-gray-500 uppercase tracking-widest opacity-60 animate-in fade-in stagger-2">
                <span className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${isFocused ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></span>
                <span>{isFocused ? t.autoPasteActive : t.windowInactive}</span>
              </div>
            </div>
            
            <div className="space-y-6">
              <h1 
                onClick={resetApp}
                className="text-6xl md:text-[8rem] font-black text-white tracking-tighter leading-[0.9] bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/10 cursor-pointer hover:to-indigo-400 transition-all hover:scale-[1.01] active:scale-95 group inline-block py-2"
              >
                <span className="group-hover:text-glow transition-all duration-700">{t.title}</span>
              </h1>
              <p className="text-gray-400 text-lg md:text-2xl max-w-2xl mx-auto font-medium leading-relaxed break-words px-4 animate-in fade-in stagger-2 opacity-80">
                {t.description}
              </p>
            </div>
          </div>

          <div 
            onClick={handlePasteClick}
            className={`relative group transition-all duration-1000 rounded-[3rem] md:rounded-[4rem] overflow-hidden border border-white/5 mx-auto w-full animate-in zoom-in stagger-2 cursor-pointer hover:shadow-[0_0_50px_rgba(79,70,229,0.15)]
              ${images.length > 0 ? 'bg-white/[0.03] shadow-[0_100px_150px_rgba(0,0,0,0.8)] ring-1 ring-white/10' : 'bg-white/[0.01] hover:bg-white/[0.03] border-dashed border-white/10'}
              ${isFocused && images.length === 0 ? 'ring-2 ring-indigo-500/20' : ''}`}
          >
            {images.length > 0 ? (
              <div className="p-8 md:p-16 space-y-16 animate-in fade-in duration-700">
                <div className="flex flex-col items-center space-y-4">
                  <h2 className="text-3xl font-black text-white">{t.imagesInCollection} ({images.length})</h2>
                  <p className="text-indigo-400 font-bold">{t.pasteMore}</p>
                </div>
                <div className={`grid gap-12 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                   {images.map((img, idx) => (
                     <motion.div 
                        key={img.id} 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        transition={{ duration: 0.4, delay: idx * 0.1 }}
                        className="relative group/card glass-card rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-10 flex flex-col space-y-8"
                      >
                        <div className="relative aspect-video flex items-center justify-center overflow-hidden rounded-3xl bg-black/60 ring-1 ring-white/5">
                          <img 
                            src={img.url} 
                            alt={`${t.title} - ${t.pastedAt} ${img.timestamp.toLocaleTimeString()}`} 
                            className="max-h-full max-w-full object-contain transition-transform duration-1000 group-hover/card:scale-105"
                          />
                          <div className="absolute top-4 left-4 bg-indigo-500/90 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full text-white shadow-lg animate-in fade-in slide-in-from-top-1 duration-1000">
                            Auto-Detected
                          </div>
                          <div className="absolute top-6 right-6 flex space-x-3 opacity-0 group-hover/card:opacity-100 transition-all duration-300 translate-y-2 group-hover/card:translate-y-0">
                             <button 
                              onClick={() => setExpandedImage(img)}
                              className="p-4 bg-white/10 hover:bg-white text-white hover:text-black rounded-2xl shadow-2xl backdrop-blur-3xl border border-white/20 transition-all hover:scale-110 active:scale-90"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" /></svg>
                            </button>
                            <button 
                              onClick={() => removeImage(img.id)}
                              className="p-4 bg-red-500/20 hover:bg-red-500 text-white rounded-2xl shadow-2xl backdrop-blur-3xl border border-red-500/40 transition-all hover:scale-110 active:scale-90"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-2">
                           <div className="text-left w-full sm:w-auto">
                              <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">{t.pastedAt}</p>
                              <p className="text-white font-black text-2xl tracking-tight">{img.timestamp.toLocaleTimeString()}</p>
                           </div>
                           <button 
                             onClick={() => downloadImage(img)}
                             className="w-full sm:w-auto px-6 py-3 bg-white text-black font-black text-lg rounded-xl hover:bg-indigo-500 hover:text-white transition-all flex items-center justify-center space-x-2 shadow-[0_10px_20px_-5px_rgba(255,255,255,0.1)] active:scale-95 shrink-0"
                           >
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                             <span>{t.downloadBtn}</span>
                           </button>
                        </div>
                     </motion.div>
                   ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-12 border-t border-white/5 pt-16">
                   <button 
                      onClick={resetApp}
                      className="w-full sm:w-auto px-14 py-6 bg-red-500/5 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-[2.5rem] font-black text-xl tracking-widest uppercase transition-all shadow-xl hover:scale-105 active:scale-95"
                    >
                      {t.clearBtn}
                    </button>
                    
                    {images.length > 1 && (
                      <button 
                        onClick={downloadAllImages}
                        className="w-full sm:w-auto px-14 py-6 bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-white border border-green-500/20 rounded-[2.5rem] font-black text-xl tracking-widest uppercase transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center space-x-4 group/link"
                      >
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        <span>{t.downloadAllBtn}</span>
                      </button>
                    )}
                    
                    <a 
                      href={`/${lang.toLowerCase()}/formatflow`}
                      className="w-full sm:w-auto px-14 py-6 bg-indigo-600/10 hover:bg-indigo-500 text-indigo-400 hover:text-white border border-indigo-500/20 rounded-[2.5rem] font-black text-xl tracking-widest uppercase transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center space-x-4 group/link"
                    >
                      <svg className="w-7 h-7 group-hover/link:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                      <span>{t.convertBtn}</span>
                    </a>
                </div>
              </div>
            ) : (
              <div className="py-32 md:py-48 px-8 md:px-12 flex flex-col items-center space-y-12 animate-in fade-in duration-1000">
                <div className="relative">
                  <div className={`absolute inset-0 bg-indigo-500/20 blur-[80px] rounded-full transition-all duration-1000 ${isFocused ? 'scale-125 opacity-40' : 'scale-100 opacity-20'}`}></div>
                  <div className={`w-36 md:w-52 h-36 md:h-52 glass-card rounded-[4rem] md:rounded-[5rem] flex items-center justify-center transition-all duration-1000 relative z-10 overflow-hidden ${isFocused ? 'border-indigo-500/40 shadow-[0_0_50px_rgba(99,102,241,0.2)]' : 'border-white/5'}`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <svg className={`w-20 md:w-24 h-20 md:h-24 transition-colors duration-1000 animate-float ${isFocused ? 'text-indigo-400' : 'text-gray-700'}`} fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-8">
                  <p className="text-4xl md:text-7xl font-black text-white tracking-tighter leading-tight px-4 max-w-4xl mx-auto">{t.pastePrompt}</p>
                  <p className="text-indigo-400/60 text-xs font-bold uppercase tracking-[0.4em] animate-pulse">{t.waitingForImage}</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16 pt-16">
            {t.features.map((feature, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.2 }}
                className="p-10 md:p-12 glass-card rounded-[3rem] text-left group hover:-translate-y-4 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300"
              >
                <div className="text-6xl mb-8 group-hover:scale-110 transition-transform duration-700 origin-left inline-block">
                  {['⚡', '🛡️', '✨'][idx]}
                </div>
                <h3 className="text-white text-2xl md:text-3xl font-black mb-5 tracking-tight group-hover:text-indigo-400 transition-colors">{feature.title}</h3>
                <p className="text-gray-500 text-lg md:text-xl leading-relaxed font-medium">{feature.text}</p>
              </motion.div>
            ))}
          </div>

          <div className="pt-24 md:pt-40 space-y-32 md:space-y-40 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 items-center">
              <div className="space-y-12 animate-in slide-in-from-bottom">
                <div className="inline-block px-4 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] border border-indigo-500/20">
                  {t.seoKeywords[0]}
                </div>
                <h2 className="text-4xl md:text-7xl font-black text-white leading-[1.05] tracking-tighter">
                  {t.seoHeroTitle}
                </h2>
                <p className="text-gray-400 text-lg md:text-2xl leading-relaxed font-medium">
                  {t.seoHeroText}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                  {t.seoHeroList.map((item, i) => (
                    <div key={i} className="flex items-center space-x-4 p-5 rounded-3xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
                      <div className="w-10 h-10 shrink-0 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center text-lg group-hover:rotate-12 transition-transform">✓</div>
                      <span className="text-gray-300 font-bold text-lg">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative group animate-in slide-in-from-right stagger-2">
                 <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-pink-500/20 blur-[100px] rounded-full group-hover:opacity-100 opacity-60 transition-opacity"></div>
                 <div className="relative glass-card rounded-[4rem] p-12 md:p-24 pb-24 md:pb-40 min-h-[500px] w-full flex flex-col items-center justify-center space-y-12 text-center overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors"></div>
                    <div className="text-9xl md:text-[10rem] animate-float drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]">🚀</div>
                    <div className="space-y-8 max-w-sm px-4">
                      <h3 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">{t.seoBrowserSpeedTitle}</h3>
                      <p className="text-gray-400 font-medium text-lg md:text-xl leading-relaxed">{t.seoBrowserSpeedText}</p>
                    </div>
                 </div>
              </div>
            </div>

            <div className="p-10 md:p-24 rounded-[3rem] md:rounded-[4rem] bg-[#0c0e1a] border border-white/5 space-y-16 animate-in slide-in-from-bottom">
               <div className="max-w-4xl space-y-6">
                 <h3 className="text-3xl md:text-6xl font-black text-white leading-tight">{t.seoSecondaryTitle}</h3>
                 <div className="h-2 w-24 bg-indigo-500 rounded-full"></div>
               </div>
               
               <div className="space-y-20">
                  <div className="space-y-8">
                    <div className="text-white text-lg md:text-xl font-black uppercase tracking-[0.4em] opacity-30 flex items-center gap-3">
                      <span className="w-8 h-px bg-white/20"></span>
                      {t.seoKeywordsTitle}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {t.seoKeywords.map(k => (
                        <span key={k} className="px-5 py-3 glass-card rounded-2xl text-gray-400 text-sm font-bold hover:text-white transition-colors cursor-default whitespace-nowrap">{k}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
                    <div className="space-y-8">
                      <div className="text-white text-lg md:text-xl font-black uppercase tracking-[0.4em] opacity-30 flex items-center gap-3">
                        <span className="w-8 h-px bg-white/20"></span>
                        {t.seoUseCaseTitle}
                      </div>
                      <p className="text-gray-400 text-lg md:text-xl leading-relaxed font-medium">{t.seoUseCaseText}</p>
                    </div>
                    <div className="space-y-8">
                      <div className="text-white text-lg md:text-xl font-black uppercase tracking-[0.4em] opacity-30 flex items-center gap-3">
                        <span className="w-8 h-px bg-white/20"></span>
                        {t.seoPrivacyTitle}
                      </div>
                      <p className="text-gray-400 text-lg md:text-xl leading-relaxed font-medium">{t.seoPrivacyText}</p>
                    </div>
                  </div>
               </div>
            </div>

            {/* FAQ Section */}
            <section className="max-w-4xl mx-auto w-full space-y-16 py-20">
              <div className="text-center space-y-4">
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">{t.faqTitle}</h2>
                <div className="h-1.5 w-24 bg-indigo-500 mx-auto rounded-full"></div>
              </div>
              <div className="grid gap-6">
                {t.faq.map((item, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="glass-card rounded-3xl p-8 text-left space-y-4 hover:border-indigo-500/30 transition-colors group"
                  >
                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors flex items-center gap-3">
                      <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 text-sm">Q</span>
                      {item.question}
                    </h3>
                    <p className="text-gray-400 leading-relaxed pl-11">
                      {item.answer}
                    </p>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Keywords Section for SEO */}
            <section className="max-w-4xl mx-auto w-full space-y-8 py-10 opacity-60">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-500 text-center">{t.seoKeywordsTitle}</h2>
              <div className="flex flex-wrap justify-center gap-3">
                {t.seoKeywords.map((keyword, idx) => (
                  <span key={idx} className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 hover:bg-indigo-500/10 hover:border-indigo-500/20 hover:text-indigo-400 transition-all cursor-default">
                    {keyword}
                  </span>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      {expandedImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 bg-black/98 backdrop-blur-3xl animate-in fade-in duration-300">
          <div className="relative w-full h-full flex items-center justify-center animate-in zoom-in duration-500">
            <img 
              src={expandedImage.url} 
              alt="Expanded view" 
              className="max-w-full max-h-full object-contain shadow-[0_50px_200px_rgba(0,0,0,1)] rounded-2xl ring-1 ring-white/10"
            />
            <button 
              onClick={() => setExpandedImage(null)}
              className="absolute top-4 right-4 md:top-10 md:right-10 p-6 text-white/50 hover:text-white transition-all scale-125 md:scale-150 group"
            >
              <svg className="w-10 h-10 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full px-8 flex justify-center">
               <button 
                onClick={() => downloadImage(expandedImage)}
                className="w-full max-w-sm px-14 py-6 bg-white text-black font-black text-2xl rounded-3xl hover:bg-indigo-500 hover:text-white hover:scale-105 active:scale-95 transition-all flex items-center justify-center space-x-5 shadow-[0_40px_80px_rgba(0,0,0,0.5)]"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                <span>{t.downloadBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-10 right-10 z-[150] w-16 h-16 bg-white text-black rounded-3xl shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 hover:-translate-y-2 animate-in slide-in-from-bottom stagger-1"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24"><path d="M5 15l7-7 7 7" /></svg>
        </button>
      )}

      <CookieConsent t={t} />

      <LegalModal 
        isOpen={!!activeModal} 
        onClose={() => setActiveModal(null)} 
        title={activeModal === 'privacy' ? t.privacyPolicy : activeModal === 'terms' ? t.termsOfService : t.cookiePolicy}
        content={
          (activeModal === 'privacy' ? t.privacyContent : activeModal === 'terms' ? t.termsContent : t.cookiesContent)
            .split('\n')
            .map((paragraph, index) => <p key={index}>{paragraph}</p>)
        }
        t={t}
      />

      <footer className="py-24 md:py-48 border-t border-white/5 flex flex-col items-center space-y-16 relative z-10 bg-[#020308] w-full">
        <div className="flex flex-col items-center space-y-16 max-w-5xl px-8 text-center">
          <div className="text-gray-600 text-xs font-black tracking-[0.6em] uppercase opacity-40">
            {t.footerCredit}
          </div>
          
          <a 
            href={`/${lang.toLowerCase()}/`}
            className="flex items-center space-x-6 group scale-125 md:scale-[1.8] outline-none shrink-0"
          >
            <div className="w-12 h-12 bg-indigo-600 rounded-[1.2rem] flex items-center justify-center group-hover:rotate-12 transition-transform shadow-[0_15px_30px_-5px_rgba(79,70,229,0.5)]">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
            </div>
            <div className="flex items-center space-x-1 font-black text-4xl tracking-tighter">
              <span className="text-white transition-all group-hover:text-indigo-400">oLove</span>
              <span className="text-pink-500 group-hover:translate-x-1 group-hover:text-white transition-all">Tools</span>
            </div>
          </a>
          
          <p className="text-gray-500 text-lg md:text-xl font-medium leading-relaxed max-w-2xl">
            {t.footerTagline}
          </p>

          <div className="flex items-center space-x-8 text-gray-800 font-black text-xs tracking-widest pt-12 uppercase border-t border-white/5 w-full justify-center">
            <span>&copy; {new Date().getFullYear()} oLoveTools</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/10"></span>
            <button onClick={() => setActiveModal('privacy')} className="hover:text-indigo-400 transition-all hover:scale-105">{t.privacyPolicy}</button>
            <span className="w-1.5 h-1.5 rounded-full bg-white/10"></span>
            <button onClick={() => setActiveModal('terms')} className="hover:text-indigo-400 transition-all hover:scale-105">{t.termsOfService}</button>
            <span className="w-1.5 h-1.5 rounded-full bg-white/10"></span>
            <button onClick={() => setActiveModal('cookies')} className="hover:text-indigo-400 transition-all hover:scale-105">{t.cookiePolicy}</button>
            <span className="w-1.5 h-1.5 rounded-full bg-white/10"></span>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(t.emailAddress);
                const button = document.getElementById('copy-email-btn');
                if (button) {
                  const originalText = button.innerText;
                  button.innerText = t.emailCopied;
                  setTimeout(() => {
                    button.innerText = originalText;
                  }, 2000);
                }
              }}
              id="copy-email-btn"
              className="hover:text-indigo-400 transition-all hover:scale-105"
            >
              {t.emailAddress}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Pastesnap;
