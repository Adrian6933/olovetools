import React, { useState, useEffect } from 'react';
import { useTranslation, Language } from '../../locales/dictionary';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { 
  Zap, 
  Download, 
  Music, 
  Image as ImageIcon, 
  ExternalLink, 
  Play, 
  Heart, 
  MessageCircle, 
  Eye, 
  AlertCircle,
  RefreshCw,
  Video,
  Grid,
  Check
} from 'lucide-react';
import { legalTranslations } from '../../locales/legal';

interface SocialBoltProps {
  lang: Language;
  dictionary: any;
}

type Platform = 'tiktok' | 'instagram' | 'youtube' | 'twitter' | 'unknown';

interface DownloadItem {
  url: string;
  type: 'video' | 'photo' | 'audio';
  thumb?: string;
}

interface MediaResult {
  id: string;
  title: string;
  platform: Platform;
  authorName: string;
  authorHandle?: string;
  authorAvatar?: string;
  thumbnail: string;
  videoUrl?: string;
  musicUrl?: string;
  musicTitle?: string;
  musicAuthor?: string;
  views?: number;
  likes?: number;
  comments?: number;
  duration?: number;
  pickerItems?: DownloadItem[]; // For slideshows/multiple images
}

const COBALT_INSTANCES = [
  "https://api.cobalt.tools",
  "https://cobalt.sh",
  "https://api.smooth.co.za",
  "https://cobalt.qnet-c.net",
  "https://cobalt.revolt.chat"
];

const CORS_PROXIES = [
  (api: string) => api, // Direct first
  (api: string) => `https://corsproxy.io/?${encodeURIComponent(api)}`,
  (api: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(api)}`
];

export const SocialBolt: React.FC<SocialBoltProps> = ({ lang, dictionary }) => {
  const { t } = useTranslation(lang, 'socialbolt');

  const [inputUrl, setInputUrl] = useState<string>('');
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [loading, setLoading] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<MediaResult | null>(null);
  
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  // Dynamic Platform Detection & Theme Styling
  useEffect(() => {
    const cleanUrl = inputUrl.trim().toLowerCase();
    if (!cleanUrl) {
      setPlatform('unknown');
      return;
    }
    if (cleanUrl.includes('tiktok.com')) {
      setPlatform('tiktok');
    } else if (cleanUrl.includes('instagram.com')) {
      setPlatform('instagram');
    } else if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
      setPlatform('youtube');
    } else if (cleanUrl.includes('twitter.com') || cleanUrl.includes('x.com')) {
      setPlatform('twitter');
    } else {
      setPlatform('unknown');
    }
  }, [inputUrl]);

  // Determine dynamic classes based on detected platform
  const getThemeClasses = () => {
    switch (platform) {
      case 'tiktok':
        return {
          glow: 'shadow-[0_0_30px_-5px_rgba(6,182,212,0.25)] border-cyan-500/30 focus-within:border-cyan-400 focus-within:shadow-[0_0_40px_-5px_rgba(244,63,94,0.3)]',
          btn: 'bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600 shadow-lg shadow-cyan-500/20 text-white',
          accent: 'text-cyan-400',
          bgGlow: 'from-cyan-950/20 via-pink-950/10 to-transparent'
        };
      case 'instagram':
        return {
          glow: 'shadow-[0_0_30px_-5px_rgba(236,72,153,0.25)] border-pink-500/30 focus-within:border-pink-400 focus-within:shadow-[0_0_40px_-5px_rgba(249,115,22,0.3)]',
          btn: 'bg-gradient-to-r from-fuchsia-600 via-pink-600 to-orange-500 hover:opacity-95 shadow-lg shadow-pink-500/20 text-white',
          accent: 'text-pink-400',
          bgGlow: 'from-fuchsia-950/20 via-pink-950/10 to-transparent'
        };
      case 'youtube':
        return {
          glow: 'shadow-[0_0_30px_-5px_rgba(239,68,68,0.25)] border-red-500/30 focus-within:border-red-400 focus-within:shadow-[0_0_40px_-5px_rgba(220,38,38,0.3)]',
          btn: 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/20 text-white',
          accent: 'text-red-500',
          bgGlow: 'from-red-950/20 via-slate-950/10 to-transparent'
        };
      case 'twitter':
        return {
          glow: 'shadow-[0_0_30px_-5px_rgba(255,255,255,0.15)] border-slate-700 focus-within:border-slate-400 focus-within:shadow-[0_0_40px_-5px_rgba(255,255,255,0.2)]',
          btn: 'bg-slate-100 hover:bg-white text-black shadow-lg shadow-white/5',
          accent: 'text-slate-300',
          bgGlow: 'from-slate-900/40 to-transparent'
        };
      default:
        return {
          glow: 'shadow-[0_0_30px_-5px_rgba(99,102,241,0.2)] border-white/10 focus-within:border-indigo-500/40 focus-within:shadow-[0_0_40px_-5px_rgba(99,102,241,0.3)]',
          btn: 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 text-white',
          accent: 'text-indigo-400',
          bgGlow: 'from-indigo-950/20 via-slate-950/10 to-transparent'
        };
    }
  };

  const theme = getThemeClasses();

  // Clean and trigger download logic
  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    
    setLoading(true);
    setError('');
    setResult(null);
    setProgressMsg('Parsing URL...');

    const detected = getPlatform(inputUrl);

    try {
      if (detected === 'tiktok') {
        await processTikTok(inputUrl);
      } else if (detected === 'instagram' || detected === 'youtube' || detected === 'twitter') {
        await processCobalt(inputUrl, detected);
      } else {
        throw new Error(t.error_invalid_url || 'Unsupported platform URL.');
      }
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  // TikTok specific processing via TikWM (very fast, no watermark)
  const processTikTok = async (url: string) => {
    setProgressMsg('Connecting to TikWM API...');
    
    const targetEndpoint = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
    
    for (const makeProxy of CORS_PROXIES) {
      try {
        const finalUrl = makeProxy(targetEndpoint);
        const res = await fetch(finalUrl);
        if (res.ok) {
          const json = await res.json();
          if (json && json.code === 0 && json.data) {
            const data = json.data;
            
            // Handle image slideshows in TikTok
            let pickerItems: DownloadItem[] = [];
            if (data.images && Array.isArray(data.images)) {
              pickerItems = data.images.map((img: string) => ({
                url: img,
                type: 'photo'
              }));
            }

            setResult({
              id: data.id || 'tiktok_video',
              title: data.title || 'TikTok Media',
              platform: 'tiktok',
              authorName: data.author?.nickname || 'TikTok Creator',
              authorHandle: `@${data.author?.unique_id || 'creator'}`,
              authorAvatar: data.author?.avatar || '',
              thumbnail: data.cover || '',
              videoUrl: data.play || '',
              musicUrl: data.music || '',
              musicTitle: data.music_info?.title || 'Original Sound',
              musicAuthor: data.music_info?.author || '',
              views: data.play_count || 0,
              likes: data.digg_count || 0,
              comments: data.comment_count || 0,
              duration: data.duration || 0,
              pickerItems: pickerItems.length > 0 ? pickerItems : undefined
            });
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn("TikWM proxy fetch failed, trying next...", e);
      }
    }
    
    // Fallback to Cobalt if TikWM fails completely
    setProgressMsg('TikWM failed. Redirecting request to Cobalt network...');
    await processCobalt(url, 'tiktok');
  };

  // General downloader via Cobalt with dynamic CORS proxies & serverless failover
  const processCobalt = async (url: string, platformType: Platform) => {
    const body = {
      url,
      vQuality: "720",
      filenamePattern: "pretty",
      isAudioOnly: false,
      isNoTTWatermark: true
    };

    for (const instance of COBALT_INSTANCES) {
      setProgressMsg(`Testing node ${instance.replace('https://', '')}...`);
      for (const makeProxy of CORS_PROXIES) {
        try {
          // Check standard API endpoint `/api/json` first
          const apiEndpoint = makeProxy(`${instance}/api/json`);
          const res = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(body)
          });
          
          if (res.ok) {
            const json = await res.json();
            if (json && (json.url || json.picker)) {
              handleCobaltResult(json, platformType);
              return;
            }
          }
        } catch (e) {
          // Keep loop going
        }

        try {
          // Fallback check root endpoint `/`
          const rootEndpoint = makeProxy(instance);
          const res = await fetch(rootEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(body)
          });
          
          if (res.ok) {
            const json = await res.json();
            if (json && (json.url || json.picker)) {
              handleCobaltResult(json, platformType);
              return;
            }
          }
        } catch (e) {
          // Keep loop going
        }
      }
    }
    
    throw new Error(t.error_failed || "Downloader pipeline is temporarily busy. Try again soon.");
  };

  const handleCobaltResult = (data: any, platformType: Platform) => {
    let pickerItems: DownloadItem[] = [];
    if (data.picker && Array.isArray(data.picker)) {
      pickerItems = data.picker.map((item: any) => ({
        url: item.url,
        type: item.type === 'photo' ? 'photo' : 'video',
        thumb: item.thumb
      }));
    }

    setResult({
      id: String(Date.now()),
      title: data.filename || `${platformType.toUpperCase()} Media`,
      platform: platformType,
      authorName: platformType.toUpperCase() + ' Video',
      thumbnail: pickerItems.length > 0 ? (pickerItems[0].thumb || pickerItems[0].url) : '',
      videoUrl: data.url || undefined,
      pickerItems: pickerItems.length > 0 ? pickerItems : undefined
    });
    setLoading(false);
  };

  // Direct trigger download helper
  const triggerDownload = (url: string, filename = 'socialbolt-download.mp4') => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Modal handlers
  const openModal = (modal: 'privacy' | 'terms' | 'cookies') => {
    setActiveModal(modal);
  };

  const getModalContent = () => {
    if (!activeModal) return { title: '', content: '' };
    const navKey = activeModal === 'privacy' ? 'privacy' : activeModal === 'terms' ? 'terms' : 'cookies';
    const title = legalTranslations[lang]?.nav[navKey] || '';
    const content = legalTranslations[lang]?.sections[activeModal]?.join('\n\n') || '';
    return { title, content };
  };

  const { title: modalTitle, content: modalText } = getModalContent();

  return (
    <div className="min-h-screen bg-[#050508] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/20 selection:text-indigo-200 relative">
      <Header 
        currentLang={lang} 
        onLanguageChange={(newLang) => window.location.href = `/${newLang}/socialbolt`}
        onReset={() => setInputUrl('')}
        t={t}
      />

      {/* Dynamic Background Glow */}
      <div className={`absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b ${theme.bgGlow} blur-[120px] transition-all duration-700 pointer-events-none z-0`} />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 md:px-12 pt-32 pb-24 flex flex-col space-y-12 relative z-10">
        
        {/* Hero Area */}
        <section className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400 mb-2">
            <Zap className="w-8 h-8 fill-indigo-400/10 animate-bounce" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white font-outfit">
            {t.seoHeroTitle}
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-xl mx-auto font-medium">
            {t.seoHeroText}
          </p>
        </section>

        {/* Input paste Form */}
        <section className="w-full">
          <form onSubmit={handleFetch} className={`flex flex-col md:flex-row items-stretch p-2 bg-white/[0.02] border rounded-3xl backdrop-blur-2xl transition-all duration-500 ${theme.glow}`}>
            <input 
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder={t.placeholder}
              className="flex-1 px-6 py-4 bg-transparent border-none text-slate-200 outline-none placeholder:text-slate-500 font-mono text-sm leading-relaxed"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputUrl.trim()}
              className={`px-8 py-4 rounded-2xl font-black text-sm tracking-wider uppercase transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shrink-0 ${theme.btn}`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t.btn_fetching}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{t.btn_fetch}</span>
                </>
              )}
            </button>
          </form>

          {/* Loading Indicator */}
          {loading && (
            <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-slate-400 font-semibold italic">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
              <span>{progressMsg}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-950/20 border border-red-900/50 rounded-2xl text-red-400 text-xs flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
              <p className="font-semibold">{error}</p>
            </div>
          )}
        </section>

        {/* Fetch Result Card */}
        {result && (
          <section className="w-full bg-[#0b0c10] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 opacity-20 blur-2xl rounded-full" />
            
            <div className="flex flex-col md:flex-row gap-8 items-start">
              
              {/* Media Preview Column */}
              <div className="w-full md:w-72 shrink-0 space-y-4">
                {result.videoUrl ? (
                  <div className="relative aspect-video md:aspect-[9/16] max-h-[400px] w-full bg-black rounded-2xl overflow-hidden shadow-lg border border-white/5 flex items-center justify-center group">
                    <video 
                      src={result.videoUrl} 
                      poster={result.thumbnail}
                      controls
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : result.thumbnail ? (
                  <div className="relative aspect-square w-full bg-black rounded-2xl overflow-hidden shadow-lg border border-white/5">
                    <img src={result.thumbnail} className="w-full h-full object-cover" alt="media thumbnail" />
                  </div>
                ) : (
                  <div className="aspect-video w-full bg-slate-900 rounded-2xl flex items-center justify-center text-slate-600 border border-white/5">
                    <Video className="w-12 h-12" />
                  </div>
                )}
              </div>

              {/* Media Info and Actions */}
              <div className="flex-1 space-y-6">
                
                {/* Header (Author) */}
                <div className="flex items-center space-x-4 border-b border-white/5 pb-4">
                  {result.authorAvatar ? (
                    <img src={result.authorAvatar} className="w-12 h-12 rounded-full border border-white/10" alt="avatar" />
                  ) : (
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-slate-400">
                      <Zap className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-white font-bold text-base leading-snug">{result.authorName}</h3>
                    {result.authorHandle && <p className="text-slate-500 text-xs font-mono font-medium">{result.authorHandle}</p>}
                  </div>
                </div>

                {/* Title Description */}
                <div className="space-y-2">
                  <p className="text-slate-300 text-sm leading-relaxed font-medium">
                    {result.title}
                  </p>
                </div>

                {/* Engagement Stats (If available) */}
                {result.views !== undefined && (
                  <div className="flex items-center space-x-6 text-xs text-slate-400 font-bold bg-white/[0.02] border border-white/5 px-4 py-2 rounded-xl w-max">
                    <div className="flex items-center space-x-1.5">
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>{result.views.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Heart className="w-3.5 h-3.5 text-pink-500" />
                      <span>{result.likes?.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{result.comments?.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* Download Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  {result.videoUrl && (
                    <button
                      onClick={() => triggerDownload(result.videoUrl!, `${result.platform}-${result.id}.mp4`)}
                      className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl font-extrabold text-sm tracking-wide transition-all duration-300 ${theme.btn}`}
                    >
                      <Download className="w-4 h-4" />
                      <span>{t.btn_download}</span>
                    </button>
                  )}
                  {result.musicUrl && (
                    <button
                      onClick={() => triggerDownload(result.musicUrl!, `${result.platform}-audio-${result.id}.mp3`)}
                      className="flex-1 flex items-center justify-center space-x-2 px-6 py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-xl font-extrabold text-sm tracking-wide transition-colors cursor-pointer"
                    >
                      <Music className="w-4 h-4 text-indigo-400" />
                      <span>{t.btn_download_music}</span>
                    </button>
                  )}
                  {result.thumbnail && (
                    <button
                      onClick={() => triggerDownload(result.thumbnail, `${result.platform}-thumb-${result.id}.jpg`)}
                      className="flex-1 flex items-center justify-center space-x-2 px-6 py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-xl font-extrabold text-sm tracking-wide transition-colors cursor-pointer"
                    >
                      <ImageIcon className="w-4 h-4 text-pink-400" />
                      <span>{t.btn_download_cover}</span>
                    </button>
                  )}
                </div>

                {/* Slideshow Picker Items Grid (Instagram Slideshows or TikTok photo collections) */}
                {result.pickerItems && (
                  <div className="border-t border-white/5 pt-6 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                      <Grid className="w-4 h-4 text-indigo-400" />
                      <span>Collection Contents ({result.pickerItems.length} items)</span>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {result.pickerItems.map((item, idx) => (
                        <div key={idx} className="group relative bg-[#050508] border border-white/5 rounded-2xl overflow-hidden aspect-square shadow-inner">
                          <img src={item.url} className="w-full h-full object-cover" alt="item preview" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-3">
                            <button
                              onClick={() => triggerDownload(item.url, `socialbolt-item-${idx}.jpg`)}
                              className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-transform active:scale-95 shadow-lg border border-indigo-400/20"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </section>
        )}

        {/* Feature SEO Grid */}
        <section className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <div className="space-y-2">
            <h3 className="text-white font-bold text-base">{t.seoBrowserSpeedTitle}</h3>
            <p className="text-slate-400 text-xs leading-relaxed font-medium">{t.seoBrowserSpeedText}</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-white font-bold text-base">{t.seoUseCaseTitle}</h3>
            <p className="text-slate-400 text-xs leading-relaxed font-medium">{t.seoUseCaseText}</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-white font-bold text-base">{t.seoPrivacyTitle}</h3>
            <p className="text-slate-400 text-xs leading-relaxed font-medium">{t.seoPrivacyText}</p>
          </div>
        </section>

      </main>

      {/* Footer Accordion */}
      <Footer lang={lang} t={t} onOpenModal={openModal} />

      {/* Modal Layout */}
      <LegalModal 
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        title={modalTitle}
        content={modalText}
        t={t}
      />
    </div>
  );
};
