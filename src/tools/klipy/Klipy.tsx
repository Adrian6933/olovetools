import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import {
  Search, Clapperboard, ArrowLeft, Eye, Play, X, Star, Radio,
  Download, ChevronRight, CloudDownload, Trash2,
} from 'lucide-react';
import { legalTranslations } from '../../locales/legal';
import { AdBanner } from '../../components/shared/AdBanner';
import {
  HeroArt, IconBrowse, IconHandoff, IconLive, IconNetwork, IconRemembered, IconStar,
  StepSearch, StepSend, StepStar, StepWatch,
} from './components/Illustrations';
import { searchCategories, getClips, getLivestreams, KCategory, KItem } from './services/kickService';
import { motion } from 'framer-motion';
import { useReducedMotion, fadeInUp } from '../../components/shared/motion';

interface KlipyProps {
  lang: string;
  dictionary: any;
}

const KICK = '#53fc18';
const SAVED_KEY = 'klipy-saved-v1';
const TIMES = ['day', 'week', 'month'] as const;

const formatViews = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace('.0', '') + 'K';
  return String(n);
};

export default function Klipy({ lang, dictionary }: KlipyProps) {
  const t = dictionary || {};
  const prefersReduced = useReducedMotion();
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<KCategory[]>([]);
  const [items, setItems] = useState<KItem[]>([]);
  const [mode, setMode] = useState<'categories' | 'items'>('categories');
  const [activeCat, setActiveCat] = useState<KCategory | null>(null);
  const [time, setTime] = useState<(typeof TIMES)[number]>('week');
  const [loading, setLoading] = useState(true);
  const [liveFallback, setLiveFallback] = useState(false);
  const [playing, setPlaying] = useState<KItem | null>(null);
  // Starred clips used to live only in component state, so a reload threw the
  // whole list away. They are kept in this browser now.
  const [saved, setSaved] = useState<KItem[]>([]);
  const [savedLoaded, setSavedLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSaved(parsed.filter((x: any) => x && typeof x.id === 'string'));
      }
    } catch {
      // Private mode or a corrupted value; starting empty is fine.
    }
    setSavedLoaded(true);
  }, []);

  useEffect(() => {
    if (!savedLoaded) return;
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
    } catch {
      // Storage refused; the session still works, it just will not come back.
    }
  }, [saved, savedLoaded]);
  const searchTimer = useRef<number | null>(null);

  const L = {
    title: t.seoHeroTitle || 'Discover the best Kick clips',
    subtitle: t.seoHeroText || 'Browse Kick categories, watch the top clips and live channels, save your favorites.',
    searchPh: t.ui_search || 'Search a category or game…',
    popular: t.ui_popular || 'Popular categories',
    backCats: t.ui_back || 'Categories',
    liveNow: t.ui_live || 'Live now',
    topClips: t.ui_clips || 'Top clips',
    noResults: t.ui_empty || 'Nothing found. Try another category.',
    saved: t.ui_saved || 'Saved',
    exportTxt: t.ui_export_txt || 'Export .txt',
    sendKickbolt: t.ui_send_kickbolt || 'Download in Kickbolt',
    watch: t.ui_watch || 'Watch on Kick',
    viewers: t.ui_viewers || 'viewers',
  };

  // initial popular categories
  useEffect(() => {
    (async () => {
      setLoading(true);
      setCategories(await searchCategories(''));
      setLoading(false);
    })();
  }, []);

  const onSearch = (q: string) => {
    setQuery(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(async () => {
      setMode('categories');
      setActiveCat(null);
      setLoading(true);
      setCategories(await searchCategories(q));
      setLoading(false);
    }, 350);
  };

  const openCategory = useCallback(async (cat: KCategory, tf: (typeof TIMES)[number]) => {
    setActiveCat(cat);
    setMode('items');
    setItems([]);
    setLiveFallback(false);
    setLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    let clips = await getClips(cat.id, tf);
    if (clips.length === 0) {
      // Clips blocked/empty → fall back to live channels (official, reliable)
      setLiveFallback(true);
      clips = await getLivestreams(cat.id);
    }
    setItems(clips);
    setLoading(false);
  }, []);

  const changeTime = (tf: (typeof TIMES)[number]) => {
    setTime(tf);
    if (activeCat) openCategory(activeCat, tf);
  };

  const backToCategories = () => {
    setMode('categories');
    setActiveCat(null);
    setPlaying(null);
  };

  const isSaved = (i: KItem) => saved.some((s) => s.id === i.id);
  const toggleSave = (i: KItem) =>
    setSaved((prev) => (prev.some((s) => s.id === i.id) ? prev.filter((s) => s.id !== i.id) : [...prev, i]));

  const exportTxt = () => {
    if (saved.length === 0) return;
    const blob = new Blob([saved.map((s) => s.url).join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'klipy-clips.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoked on a timer: Safari cancels an in-flight download when the URL
    // disappears in the same tick, which is what the old code did.
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const sendToKickbolt = () => {
    const clipUrls = saved.filter((s) => s.kind === 'clip').map((s) => s.url);
    if (clipUrls.length === 0) return;
    localStorage.setItem('kickbolt_shared_clips', clipUrls.join('\n'));
    window.location.href = `/${lang.toLowerCase()}/kickbolt`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070908] text-slate-100 font-sans relative overflow-x-hidden pt-36 md:pt-24">
      <div className="absolute top-[-10%] left-[15%] w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none z-0" style={{ background: 'rgba(83,252,24,0.08)' }} />

      <Header
        currentLang={lang}
        onLanguageChange={(l) => (window.location.href = `/${l.toLowerCase()}/klipy`)}
        t={t}
      />

      {/* The max width lives on <main>: AdRail measures this element to decide
          whether the fixed side rails fit. At max-w-7xl the gap was 60px at
          1400px wide, so the rails were silently suppressed on the most common
          desktop size. */}
      <main className="flex-grow w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))] px-4 md:px-8 py-8 relative z-10 flex flex-col space-y-8">
        <AdBanner id="adsense-klipy-top" />
        {/* Hero + search */}
        <div className="text-center space-y-5">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white flex items-center justify-center gap-3">
            <Clapperboard className="w-9 h-9" style={{ color: KICK }} />
            <span>{L.title}</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">{L.subtitle}</p>
          <HeroArt className="w-full max-w-md mx-auto h-auto" />
          <div className="relative max-w-xl mx-auto">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={L.searchPh}
              className="w-full pl-12 pr-4 py-3.5 bg-white/[0.04] border border-white/10 rounded-2xl text-white placeholder-slate-500 outline-none focus:border-[#53fc18]/50 transition-all"
            />
          </div>
        </div>

        {/* Saved bar */}
        {saved.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3">
            <span className="text-sm font-bold flex items-center gap-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> {L.saved}: {saved.length}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={exportTxt} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all cursor-pointer">
                <Download className="w-4 h-4" /> {L.exportTxt}
              </button>
              <button onClick={sendToKickbolt} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-black text-xs font-black transition-all cursor-pointer hover:opacity-90" style={{ background: KICK }}>
                <CloudDownload className="w-4 h-4" /> {L.sendKickbolt}
              </button>
              <button onClick={() => setSaved([])} aria-label="Clear" className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all cursor-pointer">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* CATEGORIES */}
        {mode === 'categories' && (
          <motion.div
            initial={prefersReduced ? false : 'hidden'}
            whileInView={prefersReduced ? undefined : 'visible'}
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeInUp}
          >
          <section className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">
              {query.trim() ? `${categories.length} results` : L.popular}
            </h2>
            {loading ? (
              <GridSkeleton />
            ) : categories.length === 0 ? (
              <p className="text-slate-500 text-center py-16">{L.noResults}</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => openCategory(c, time)}
                    className="group relative rounded-2xl overflow-hidden bg-white/[0.03] border border-white/5 hover:border-[#53fc18]/40 transition-all text-left cursor-pointer hover:-translate-y-1"
                  >
                    <div className="aspect-[3/4] overflow-hidden bg-black/40">
                      {c.thumbnail ? (
                        <img src={c.thumbnail} alt={c.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700"><Clapperboard className="w-10 h-10" /></div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-bold text-white truncate group-hover:text-[#53fc18] transition-colors">{c.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
          </motion.div>
        )}

        {/* ITEMS (clips or live) */}
        {mode === 'items' && (
          <section className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button onClick={backToCategories} className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white transition-colors cursor-pointer">
                <ArrowLeft className="w-4 h-4" /> {L.backCats}
              </button>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                {liveFallback ? <Radio className="w-5 h-5" style={{ color: KICK }} /> : <Play className="w-5 h-5" style={{ color: KICK }} />}
                {activeCat?.name} · <span className="text-slate-400 font-bold">{liveFallback ? L.liveNow : L.topClips}</span>
              </h2>
              {!liveFallback && (
                <div className="flex items-center gap-1.5">
                  {TIMES.map((tf) => (
                    <button
                      key={tf}
                      onClick={() => changeTime(tf)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${time === tf ? 'text-black' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                      style={time === tf ? { background: KICK } : undefined}
                    >
                      {(t['ui_time_' + tf]) || tf}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {loading ? (
              <GridSkeleton wide />
            ) : items.length === 0 ? (
              <p className="text-slate-500 text-center py-16">{L.noResults}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map((i) => (
                  <div key={i.id} className="group relative rounded-2xl overflow-hidden bg-white/[0.03] border border-white/5 hover:border-[#53fc18]/40 transition-all">
                    <button onClick={() => setPlaying(i)} className="block w-full relative aspect-video bg-black overflow-hidden cursor-pointer">
                      {i.thumbnail && <img src={i.thumbnail} alt={i.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center text-black" style={{ background: KICK }}><Play className="w-6 h-6 fill-current ml-0.5" /></div>
                      </div>
                      <span className="absolute bottom-2 left-2 flex items-center gap-1 text-[11px] font-bold bg-black/70 px-2 py-0.5 rounded-md">
                        {i.kind === 'live' ? <Radio className="w-3 h-3" style={{ color: KICK }} /> : <Eye className="w-3 h-3" />} {formatViews(i.views)}{i.kind === 'live' ? ' ' + L.viewers : ''}
                      </span>
                      {i.duration && <span className="absolute bottom-2 right-2 text-[11px] font-bold bg-black/70 px-2 py-0.5 rounded-md">{i.duration}</span>}
                    </button>
                    <div className="p-3 flex items-start gap-2">
                      {i.avatar && <img src={i.avatar} alt={i.channel} className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/10" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{i.title}</p>
                        <p className="text-xs text-slate-500 truncate">{i.channel}</p>
                      </div>
                      <button onClick={() => toggleSave(i)} aria-label="Save" className="p-1.5 rounded-lg hover:bg-white/10 transition-all cursor-pointer shrink-0">
                        <Star className={`w-4 h-4 ${isSaved(i) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-500'}`} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
        <AdBanner id="adsense-klipy-mid" />

        {/* How it works ---------------------------------------------------- */}
        <section id="how-it-works" className="space-y-8 pt-4 scroll-mt-28">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white text-center">
            {t.howTitle || 'How it works'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { art: StepSearch, title: t.step1Title || 'Find a category', text: t.step1Text || 'Search any Kick category, or browse the ones with the most going on right now.' },
              { art: StepWatch, title: t.step2Title || 'Watch without leaving', text: t.step2Text || 'Clips play inline and live channels open in an embedded player.' },
              { art: StepStar, title: t.step3Title || 'Star what you like', text: t.step3Text || 'Your starred list is kept in this browser, so it is still there tomorrow.' },
              { art: StepSend, title: t.step4Title || 'Send it to Kickbolt', text: t.step4Text || 'Hand the whole list over to the downloader in one click, or export it as a text file.' },
            ].map((step, i) => (
              <div key={i} className="glass-card rounded-2xl p-4 space-y-3">
                <step.art />
                <div className="space-y-1.5">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md text-[11px] font-black flex items-center justify-center shrink-0" style={{ background: 'rgba(83,252,24,0.15)', color: KICK }}>
                      {i + 1}
                    </span>
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features -------------------------------------------------------- */}
        <section className="space-y-8">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white text-center">
            {t.featuresTitle || 'What it actually does'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: IconBrowse, title: t.feat1Title || 'Browse by category', text: t.feat1Text || 'Every Kick category, searchable, with the clips and channels underneath each one.' },
              { icon: IconLive, title: t.feat2Title || 'Clips and live, together', text: t.feat2Text || 'Recorded clips and channels that are streaming right now, in the same grid.' },
              { icon: IconStar, title: t.feat3Title || 'A shortlist you build', text: t.feat3Text || 'Star anything worth keeping and the list follows you around the tool.' },
              { icon: IconRemembered, title: t.feat4Title || 'Remembered on reload', text: t.feat4Text || 'The starred list is stored in your browser instead of vanishing when the page reloads.' },
              { icon: IconHandoff, title: t.feat5Title || 'Straight into Kickbolt', text: t.feat5Text || 'Send every starred clip to the downloader at once, without copying links by hand.' },
              { icon: IconNetwork, title: t.feat6Title || 'Honest about the network', text: t.feat6Text || 'Browsing Kick needs Kick. The queries go through this site to Kick and nothing about you is stored.' },
            ].map((f, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 space-y-3">
                <div className="w-10 h-10"><f.icon /></div>
                <h3 className="text-sm font-black text-white">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ ------------------------------------------------------------- */}
        {Array.isArray(t.faq) && t.faq.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white text-center">
              {t.faqTitle || 'Frequently Asked Questions'}
            </h2>
            <div className="space-y-3 max-w-3xl mx-auto w-full">
              {t.faq.map((item: any, i: number) => (
                <details key={i} className="group glass-card rounded-2xl overflow-hidden">
                  <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none text-sm font-bold text-white transition-colors hover:opacity-80">
                    <span>{item.question}</span>
                    <span className="text-lg leading-none shrink-0 transition-transform group-open:rotate-45" style={{ color: KICK }}>+</span>
                  </summary>
                  <p className="px-5 pb-5 text-sm text-slate-400 leading-relaxed">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <AdBanner id="adsense-klipy-bottom" />
      </main>


      {/* Player modal */}
      {playing && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl" onClick={() => setPlaying(null)}>
          <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="aspect-video bg-black rounded-2xl overflow-hidden ring-1 ring-white/10">
              {playing.kind === 'live' && playing.embedUrl ? (
                <iframe src={playing.embedUrl} className="w-full h-full" allow="autoplay; fullscreen" allowFullScreen title={playing.title} />
              ) : playing.playbackUrl ? (
                <video src={playing.playbackUrl} controls autoPlay className="w-full h-full" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center p-6">
                  <p className="text-slate-400 text-sm">{playing.title}</p>
                  <a href={playing.url} target="_blank" rel="noopener" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-black font-black" style={{ background: KICK }}>
                    <Play className="w-5 h-5" /> {L.watch}
                  </a>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-sm font-bold text-white truncate pr-4">{playing.title} <span className="text-slate-500">· {playing.channel}</span></p>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleSave(playing)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer"><Star className={`w-5 h-5 ${isSaved(playing) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-400'}`} /></button>
                <a href={playing.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-black text-sm font-bold cursor-pointer" style={{ background: KICK }}><ChevronRight className="w-4 h-4" /> Kick</a>
                <button onClick={() => setPlaying(null)} aria-label="Close" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer lang={lang} t={t} onOpenModal={(m) => setLegalModal(m)} />
      <LegalModal isOpen={legalModal === 'privacy'} onClose={() => setLegalModal(null)} title={legalTranslations[lang]?.privacy.title || 'Privacy Policy'} content={legalTranslations[lang]?.privacy.content} t={t} />
      <LegalModal isOpen={legalModal === 'terms'} onClose={() => setLegalModal(null)} title={legalTranslations[lang]?.terms.title || 'Terms of Service'} content={legalTranslations[lang]?.terms.content} t={t} />
      <LegalModal isOpen={legalModal === 'cookies'} onClose={() => setLegalModal(null)} title={legalTranslations[lang]?.cookies.title || 'Cookie Policy'} content={legalTranslations[lang]?.cookies.content} t={t} />
    </div>
  );
}

const GridSkeleton: React.FC<{ wide?: boolean }> = ({ wide }) => (
  <div className={`grid gap-4 ${wide ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'}`}>
    {Array.from({ length: wide ? 6 : 12 }).map((_, i) => (
      <div key={i} className={`rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse ${wide ? 'aspect-video' : 'aspect-[3/4]'}`} />
    ))}
  </div>
);
