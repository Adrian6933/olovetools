import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SearchState, TimeFilter, SortType, Category, Clip } from './types';
import { searchTwitchCategories, searchTwitchClips, getClipById, getTwitchUserAvatars } from './services/geminiService';
import { useTranslation, Language, FLAGS, LANGUAGE_NAMES } from '../../locales/dictionary';
import SearchBar from './components/SearchBar';
import FilterBar from './components/FilterBar';
import ClipGrid from './components/ClipGrid';
import CategoryGrid from './components/CategoryGrid';
import FloatingPlayer from './components/FloatingPlayer';
import CookieBanner from './components/CookieBanner';
import LegalModal from './components/LegalModal';
import { Clapperboard, Archive, ChevronRight, ArrowLeft, X, Trash2, Heart, History, AlertTriangle, Undo, ArrowUp, CheckCircle2, Sparkles, PlusCircle, Loader2, Zap, CloudDownload, Layers, Mail, Info } from 'lucide-react';

const STORAGE_KEY = 'clipy_saved_session';
const POPULAR_TAGS = [
  "Just Chatting", "League of Legends", "GTA V", "Valorant", "Counter-Strike 2",
  "Minecraft", "Rust", "Fortnite", "Roblox", "Call of Duty", "Apex Legends",
  "DOTA 2", "Overwatch 2", "World of Warcraft", "Hearthstone", "Teamfight Tactics",
  "Dead by Daylight", "Escape from Tarkov", "Lost Ark", "Elden Ring", "Music", "Art",
  "Retro", "Talk Shows", "Chess", "ASMR", "Genshin Impact", "Rocket League",
  "The Sims 4", "Dead Island 2", "Street Fighter 6", "Diablo IV", "Resident Evil 4",
  "Starfield", "Baldur's Gate 3", "Cyberpunk 2077", "Helldivers 2"
];

interface ClipyProps {
  lang: Language;
  dictionary?: any;
}

export const Clipy: React.FC<ClipyProps> = ({ lang = 'en' }) => {
  const { t } = useTranslation(lang, 'clipy');

  const [state, setState] = useState<SearchState>({
    mode: 'categories',
    query: '',
    activeCategory: null,
    categories: [],
    clips: [],
    paginationCursor: null,
    timeFilter: TimeFilter.DAY,
    sortType: SortType.TRENDING,
    isLoading: true,
    error: null
  });

  const [playingClip, setPlayingClip] = useState<Clip | null>(null);
  const [savedClips, setSavedClips] = useState<Clip[]>([]);
  const [sessionActive, setSessionActive] = useState(false);
  const [deletedClipsStack, setDeletedClipsStack] = useState<Clip[]>([]);
  const [showSavedList, setShowSavedList] = useState(false);
  const [triggerShake, setTriggerShake] = useState(false);
  const savedListRef = useRef<HTMLDivElement>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Legal State
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  const lastSearchId = useRef(0);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (sessionActive) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedClips));
    }
  }, [savedClips, sessionActive]);

  const handleRestoreHistory = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedClips(prev => {
            const currentIds = new Set(prev.map(c => c.id));
            const newUnique = parsed.filter(c => !currentIds.has(c.id));
            return [...prev, ...newUnique];
          });
          setSessionActive(true);
          showToast(t('history_restored'));
        } else {
          showToast(t('no_history'), 'info');
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      showToast(t('no_history'), 'info');
    }
  };

  const handleToggleSave = useCallback((clip: Clip) => {
    setSavedClips(prev => {
      const exists = prev.find(c => c.id === clip.id);
      let newClips;
      if (exists) {
        newClips = prev.filter(c => c.id !== clip.id);
      } else {
        setTriggerShake(true);
        setTimeout(() => setTriggerShake(false), 500);
        newClips = [...prev, clip];
      }
      return newClips;
    });
    setSessionActive(true);
  }, [t]);

  const handleDeleteClip = (e: React.MouseEvent, clipId: string) => {
    e.stopPropagation();
    const clipToDelete = savedClips.find(c => c.id === clipId);
    if (clipToDelete) {
      setDeletedClipsStack(prev => [...prev, clipToDelete]);
    }
    setSavedClips(prev => prev.filter(c => c.id !== clipId));
    setSessionActive(true);
  };

  const handleUndoDelete = () => {
    if (deletedClipsStack.length > 0) {
      const clipToRestore = deletedClipsStack[deletedClipsStack.length - 1];
      setSavedClips(prev => {
        if (prev.some(c => c.id === clipToRestore.id)) return prev;
        return [clipToRestore, ...prev];
      });
      setDeletedClipsStack(prev => prev.slice(0, -1));
      setSessionActive(true);
    }
  };

  const requestDeleteAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const confirmDeleteAll = () => {
    setSavedClips([]);
    setDeletedClipsStack([]);
    setSessionActive(true);
    setShowDeleteModal(false);
    setShowSavedList(false);
    showToast(t('delete_confirm'), 'info');
  };

  const handleDownloadTxt = () => {
    if (savedClips.length === 0) return;
    const content = savedClips.map(c => c.url).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${t('download_filename')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openExternalDownload = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (err) {
      console.error("Clipboard copy failed", err);
    }

    // Optimizamos enviando por LocalStorage para evitar límites de URL
    localStorage.setItem('clipbolt_shared_clips', content);

    const targetUrl = new URL(`/${lang}/clipbolt`, window.location.origin);
    // Mantenemos una versión corta en URL para compatibilidad y trigger rápido
    if (content.length < 1500) {
      targetUrl.searchParams.set('clips', content);
    }
    window.open(targetUrl.toString(), '_blank');
  };

  const handleExternalZip = async () => {
    if (savedClips.length === 0) return;
    const content = savedClips.map(c => c.url).join('\n');
    openExternalDownload(content);
    setShowSavedList(false);
  };

  const handleScrollToClip = (clipId: string) => {
    const element = document.getElementById(`clip-card-${clipId}`);
    if (element) {
      setShowSavedList(false);
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-4', 'ring-twitch-base/20', 'scale-105', 'z-50', 'transition-all', 'duration-500');
      setTimeout(() => {
        element.classList.remove('ring-4', 'ring-twitch-base/20', 'scale-105', 'z-50');
      }, 1500);
    }
  };

  const handleContactClick = (e: React.MouseEvent) => {
    const email = 'adrian.contact.me.69@gmail.com';
    navigator.clipboard.writeText(email);
    showToast(t('email_copied'));
    // No cancelamos el comportamiento por defecto (mailto) para que intente abrir el cliente de correo también
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (savedListRef.current && !savedListRef.current.contains(event.target as Node)) {
        setShowSavedList(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
    };
    if (showSavedList || showLangMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSavedList, showLangMenu]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Reset scroll to top when mode or category changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, [state.mode, state.activeCategory]);

  // Background Avatar Loader: Carga las fotos de perfil en segundo plano sin bloquear la UI
  useEffect(() => {
    if (state.mode !== 'clips' || state.clips.length === 0) return;

    const clipsToEnrich = state.clips.filter(c => !c.broadcaster_image && !c.id.startsWith('mock-'));
    if (clipsToEnrich.length > 0) {
      const ids = Array.from(new Set(clipsToEnrich.map(c => c.broadcaster_id)));
      getTwitchUserAvatars(ids).then(avatars => {
        if (Object.keys(avatars).length === 0) return;
        
        setState(prev => {
          // Solo actualizamos si seguimos en el mismo set de clips
          const updatedClips = prev.clips.map(clip => {
            if (avatars[clip.broadcaster_id]) {
              return { ...clip, broadcaster_image: avatars[clip.broadcaster_id] };
            }
            return clip;
          });
          return { ...prev, clips: updatedClips };
        });
      }).catch(e => console.error("Avatar enrichment failed", e));
    }
  }, [state.clips, state.mode]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = useCallback(async (query: string) => {
    const isClipUrl = query.includes('clips.twitch.tv') || query.includes('/clip/');
    const searchId = ++lastSearchId.current;

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      query,
      mode: isClipUrl ? 'clips' : 'categories',
      activeCategory: null,
      categories: [],
      clips: [],
      paginationCursor: null
    }));

    try {
      if (isClipUrl) {
        const clipIdMatch = query.match(/clips\.twitch\.tv\/([A-Za-z0-9_-]+)/) || query.match(/\/clip\/([A-Za-z0-9_-]+)/);
        const clipId = clipIdMatch ? clipIdMatch[1] : null;

        if (clipId) {
          // Cambiamos a modo clips inmediatamente para mostrar skeletons
          setState(prev => ({
            ...prev,
            isLoading: true,
            error: null,
            mode: 'clips',
            clips: [],
            paginationCursor: null
          }));
          
          if (typeof window !== 'undefined') {
            window.history.pushState({ view: 'clips' }, '');
          }

          const clip = await getClipById(clipId);
          if (searchId !== lastSearchId.current) return;
          if (clip) {
            setState(prev => ({ ...prev, clips: [clip], isLoading: false }));
            return;
          }
        }
        throw new Error("Invalid Clip Link");
      }

      const { categories, cursor } = await searchTwitchCategories(query);
      if (searchId !== lastSearchId.current) return;
      setState(prev => ({ ...prev, categories, paginationCursor: cursor, isLoading: false }));
    } catch (error: any) {
      if (searchId !== lastSearchId.current) return;
      setState(prev => ({ ...prev, error: isClipUrl ? t('error_clips') : t('error_categories'), isLoading: false }));
    }
  }, [t]);

  const loadMoreCategories = useCallback(async () => {
    if (state.isLoading || !state.paginationCursor || state.mode !== 'categories') return;
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const { categories: newCats, cursor: nextCursor } = await searchTwitchCategories(state.query, state.paginationCursor);
      setState(prev => ({
        ...prev,
        categories: [...prev.categories, ...newCats],
        paginationCursor: nextCursor,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.isLoading, state.paginationCursor, state.query, state.mode]);

  const loadClipsForCategory = useCallback(async (category: Category, time: TimeFilter) => {
    // Cambiamos el modo inmediatamente para que el usuario entre a la sección y vea los skeletons
    setState(prev => ({ 
      ...prev, 
      mode: 'clips',
      isLoading: true, 
      error: null, 
      clips: [], 
      paginationCursor: null,
      activeCategory: category 
    }));

    if (typeof window !== 'undefined') {
      window.history.pushState({ view: 'clips' }, '');
    }

    try {
      const { clips, cursor } = await searchTwitchClips(category.id, category.name, time, null);
      setState(prev => ({
        ...prev,
        clips,
        paginationCursor: cursor,
        isLoading: false
      }));
    } catch (error: any) {
      setState(prev => ({ ...prev, error: t('error_clips'), isLoading: false }));
    }
  }, [t, handleSearch]);

  const loadMoreClips = useCallback(async () => {
    if (state.isLoading || !state.paginationCursor || !state.activeCategory) return;
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const { clips: newClips, cursor: nextCursor } = await searchTwitchClips(
        state.activeCategory.id,
        state.activeCategory.name,
        state.timeFilter,
        state.paginationCursor
      );
      setState(prev => ({
        ...prev,
        clips: [...prev.clips, ...newClips],
        paginationCursor: nextCursor,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.isLoading, state.paginationCursor, state.activeCategory, state.timeFilter]);

  const loadAllClips = useCallback(async () => {
    if (state.isLoading || !state.paginationCursor || !state.activeCategory) return;
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      let currentCursor = state.paginationCursor;
      let pageCount = 0;
      const MAX_PAGES = 8;
      let allLoadedClips: Clip[] = [...state.clips];

      while (currentCursor && pageCount < MAX_PAGES) {
        const { clips: newClips, cursor: nextCursor } = await searchTwitchClips(
          state.activeCategory!.id,
          state.activeCategory!.name,
          state.timeFilter,
          currentCursor
        );
        allLoadedClips = [...allLoadedClips, ...newClips];
        setState(prev => ({ ...prev, clips: allLoadedClips, paginationCursor: nextCursor }));
        currentCursor = nextCursor;
        pageCount++;
        await new Promise(r => setTimeout(r, 200));
      }
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.isLoading, state.paginationCursor, state.activeCategory, state.timeFilter, state.clips]);

  useEffect(() => { handleSearch("popular"); }, []);

  const handleCategoryClick = (category: Category) => { loadClipsForCategory(category, state.timeFilter); };
  const handleFilterChange = (filter: TimeFilter) => {
    setState(prev => ({ ...prev, timeFilter: filter }));
    if (state.activeCategory) loadClipsForCategory(state.activeCategory, filter);
  };
  const handleSortChange = (sort: SortType) => {
    setState(prev => ({ ...prev, sortType: sort }));
    if (state.activeCategory) loadClipsForCategory(state.activeCategory, state.timeFilter);
  };
  const goBackToCategories = useCallback(() => {
    handleSearch("popular");
    setPlayingClip(null);
  }, [handleSearch]);

  // Manejo del botón "Atrás" del navegador/ratón
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Si hay un clip reproduciéndose, lo cerramos primero
      if (playingClip) {
        setPlayingClip(null);
        return;
      }
      // Si estamos en modo clips y el usuario pulsa atrás, volvemos a categorías
      if (state.mode === 'clips') {
        handleSearch("popular");
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [state.mode, handleSearch, playingClip]);

  const handleLogoClick = () => {
    handleSearch("popular");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isTopPopularMode = state.query === 'popular' || !state.query.trim();

  const totalSeconds = savedClips.reduce((acc, clip) => acc + (parseInt(clip.duration) || 0), 0);
  const formatTotalDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <div className="min-h-screen flex flex-col relative">


      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[150] animate-in slide-in-from-top-4 fade-in duration-500">
          <div className={`px-8 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10 bg-[#1c1c24] ${toast.type === 'success' ? 'text-green-400' : 'text-twitch-base'}`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Info className="w-5 h-5" />}
            <span className="font-black text-sm tracking-tight uppercase">{toast.message}</span>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 h-40 md:h-28 flex items-center bg-[#0d0d12] border-b border-white/5 shadow-none transition-all duration-300">
        <div className="w-full flex flex-wrap md:flex-nowrap items-center justify-between px-4 md:px-4 lg:px-12 max-w-[2200px] mx-auto gap-y-4 gap-x-2 md:gap-8">

          <div className="flex items-center gap-1 sm:gap-2 md:flex-1 order-1">
            <a href={`/${lang}`} className="flex items-center gap-1 sm:gap-3 group px-1 sm:px-4 py-2 hover:bg-white/5 rounded-2xl transition-all">
              <div className="flex items-center gap-1 sm:gap-3">
                <ArrowLeft className="hidden sm:block w-5 h-5 text-gray-500 group-hover:text-white transition-all -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100" />
                <div className="bg-[#1c1c24] p-2.5 rounded-xl transition-all group-hover:bg-[#2c2c36] border border-white/5 group-hover:scale-105 shadow-[0_0_25px_rgba(255,255,255,0.05)]">
                  <Heart className="w-5 h-5 text-white fill-current" />
                </div>
                <div className="hidden xl:block font-black text-lg tracking-tighter opacity-90 group-hover:opacity-100 transition-opacity">
                  <span className="text-white">oLove</span><span className="text-pink-500">Tools</span>
                </div>
              </div>
            </a>

            <div className="flex items-center gap-1 sm:gap-3 cursor-pointer group" onClick={handleLogoClick}>
              <div className="bg-[#1c1c24] p-2.5 rounded-xl border border-white/5 group-hover:rotate-6 transition-transform group-hover:bg-[#2c2c36]">
                <Clapperboard className="w-5 h-5 text-white" />
              </div>
              <span className="hidden xl:block font-black text-2xl tracking-tighter text-white">Clipy</span>
            </div>
          </div>

          <div className="w-full px-4 sm:px-4 md:px-0 md:mx-4 xl:ml-14 xl:mr-64 2xl:mx-4 max-w-[800px] order-3 md:order-2 mt-2 md:mt-0">
            <SearchBar onSearch={handleSearch} query={state.query} isLoading={state.isLoading && state.mode === 'categories'} t={t} />
          </div>

          <div className="flex items-center gap-2 md:gap-4 md:flex-1 justify-end order-2 md:order-3">
            <div className="relative" ref={langMenuRef}>
              <button onClick={() => setShowLangMenu(!showLangMenu)} aria-label="Change language" className="w-10 h-10 md:w-14 md:h-14 rounded-xl flex items-center justify-center bg-[#1c1c24] border border-white/20 hover:border-white/30 transition-all active:scale-95 group cursor-pointer">
                <span className="text-[10px] md:text-xs font-black uppercase text-gray-200 group-hover:text-white transition-colors tracking-widest">{lang}</span>
              </button>
              {showLangMenu && (
                <div className="absolute right-0 top-16 w-52 bg-[#0c0c0f] border border-white/20 rounded-2xl shadow-2xl z-[60] overflow-hidden animate-in slide-in-from-top-4 duration-300">
                  {Object.keys(FLAGS).map((key) => {
                    const l = key as Language;
                    return (
                      <button key={l} onClick={() => { localStorage.setItem('olovetools_lang', l); window.location.href = '/' + l + '/clipy'; }} className={`w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/5 transition-all cursor-pointer ${lang === l ? 'text-twitch-base font-black bg-white/5' : 'text-gray-400'}`}>
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] uppercase ${lang === l ? 'bg-twitch-base/20 text-twitch-base' : 'bg-white/5 text-gray-500'}`}>
                          {l}
                        </span>
                        <span className="text-sm font-bold tracking-tight">{LANGUAGE_NAMES[l]}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="relative" ref={savedListRef}>
              <button onClick={() => setShowSavedList(!showSavedList)} aria-label="Saved clips" className={`w-10 h-10 md:w-14 md:h-14 rounded-xl flex items-center justify-center bg-[#1c1c24] border border-white/10 transition-all active:scale-95 cursor-pointer ${showSavedList ? 'bg-[#2c2c36] text-twitch-base' : 'text-gray-400 hover:text-white'} ${triggerShake ? 'animate-shake' : ''}`}>
                <Archive className="w-5 h-5 md:w-6 md:h-6" />
                {savedClips.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-twitch-base text-white text-[9px] md:text-[10px] font-black flex items-center justify-center rounded-lg md:rounded-xl border border-[#050507] shadow-lg">{savedClips.length}</span>}
              </button>
              {showSavedList && (
                <>
                  {/* Backdrop for mobile */}
                  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 md:hidden" onClick={() => setShowSavedList(false)} />
                  <div className="fixed inset-x-4 top-24 md:absolute md:inset-auto md:right-0 md:top-16 w-auto md:w-[420px] bg-[#0c0c10] border border-white/10 rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.8)] overflow-hidden z-[60] flex flex-col max-h-[80vh] md:max-h-[85vh] animate-in slide-in-from-top-4 duration-500">
                    <div className="bg-[#15151b] p-6 border-b border-white/5 flex flex-col md:flex-row items-center md:justify-between gap-4">
                      <h3 className="font-black text-base flex items-center gap-3">
                        <Archive className="w-5 h-5 text-twitch-base" />
                        <div className="flex flex-col">
                          <span>{t('saved_clips')} ({savedClips.length})</span>
                          {savedClips.length > 0 && <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{t('total_duration')}: {formatTotalDuration(totalSeconds)}</span>}
                        </div>
                      </h3>
                      <div className="flex items-center gap-4 md:gap-2">
                        <button onClick={handleUndoDelete} disabled={deletedClipsStack.length === 0} title={t('undo_delete')} className={`p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer ${deletedClipsStack.length > 0 ? 'text-green-400' : 'text-gray-600'}`}><Undo className="w-4 h-4" /></button>
                        <button onClick={handleRestoreHistory} title={t('restore_history')} className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/5 cursor-pointer"><History className="w-4 h-4" /></button>
                        <button onClick={() => setShowSavedList(false)} className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/5 cursor-pointer"><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="overflow-y-auto custom-scrollbar p-5 space-y-3 flex-grow">
                      {savedClips.length === 0 ? <div className="text-center py-20 text-gray-400 font-black text-sm uppercase tracking-widest">{t('no_saved_clips')}</div> : savedClips.map(clip => (
                        <div key={clip.id} onClick={() => handleScrollToClip(clip.id)} className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl p-3 flex gap-4 group transition-all cursor-pointer">
                          <div className="w-16 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-black border border-white/10"><img src={clip.thumbnail_url} alt={clip.title} className="w-full h-full object-cover" /></div>
                          <div className="flex-grow min-w-0 flex flex-col justify-center">
                            <div className="text-xs font-black text-gray-100 truncate tracking-tight">{clip.title}</div>
                            <div className="text-[10px] font-bold text-gray-500">{t('duration')}: {clip.duration}</div>
                          </div>
                          <button onClick={(e) => handleDeleteClip(e, clip.id)} className="p-2 text-gray-500 hover:text-red-500 rounded-xl hover:bg-red-500/10 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                    {savedClips.length > 0 && (
                      <div className="p-6 bg-[#15151b] border-t border-white/5 flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-3">
                          <button onClick={handleDownloadTxt} className="bg-white/5 py-4 rounded-2xl text-[11px] font-black border border-white/5 hover:bg-white/10 transition-all uppercase tracking-widest cursor-pointer">{t('download_txt')}</button>
                          <button onClick={handleExternalZip} className="bg-twitch-base/70 py-4 rounded-2xl text-[11px] font-black text-white hover:bg-twitch-base transition-all uppercase tracking-widest cursor-pointer">{t('download_zip_web')}</button>
                        </div>
                        <button onClick={requestDeleteAll} className="text-[10px] text-red-500/40 font-black py-2 hover:text-red-500 transition-colors uppercase tracking-[0.2em] cursor-pointer">{t('delete_all')}</button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="container mx-auto px-6 pt-52 md:pt-48 flex-grow max-w-[1800px] relative z-10" key={state.mode}>
        <div className="mb-14">
          {state.mode === 'categories' && (
            <div className="relative mb-10">
              <div
                className="flex overflow-x-auto whitespace-nowrap gap-3 py-4 custom-scrollbar animate-in fade-in duration-700 relative z-10 px-0"
                style={{
                  maskImage: 'linear-gradient(to right, transparent, black 32px, black calc(100% - 32px), transparent)',
                  WebkitMaskImage: 'linear-gradient(to right, transparent, black 32px, black calc(100% - 32px), transparent)'
                }}
              >
                {POPULAR_TAGS.map(tag => (
                  <button key={tag} onClick={() => handleSearch(tag)} className="px-6 py-2.5 bg-[#1a1a24] border border-white/5 rounded-full text-xs font-black text-gray-400 hover:text-twitch-base hover:border-twitch-base/30 transition-all uppercase tracking-widest flex-shrink-0 cursor-pointer">#{tag}</button>
                ))}
              </div>
            </div>
          )}

          {state.mode === 'clips' && state.activeCategory ? (
            <div className="flex flex-col gap-10">
              <button onClick={goBackToCategories} className="flex items-center gap-3 text-gray-500 hover:text-twitch-base text-lg font-black transition-all group w-fit cursor-pointer"><ArrowLeft className="w-6 h-6 group-hover:-translate-x-2 transition-transform" /> {t('back_categories')}</button>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-12">
                <div className="order-2 md:order-1 w-32 h-44 md:w-44 md:h-60 bg-twitch-surfaceAlt rounded-[2.5rem] overflow-hidden shadow-2xl border-2 border-white/10 ring-8 ring-twitch-base/5 animate-float">
                  <img src={state.activeCategory.box_art_url} className="w-full h-full object-cover" alt={state.activeCategory.name} />
                </div>
                <div className="order-1 md:order-2">
                  <h1 className="text-4xl md:text-8xl font-black tracking-tighter text-white mb-6 leading-none">{state.activeCategory.name}</h1>
                  <div className="flex flex-wrap items-center gap-4 md:gap-8 text-sm md:text-xl text-gray-400 font-bold">
                    <span className="text-twitch-base flex items-center gap-2 md:gap-3"><Sparkles className="w-5 h-5 md:w-6 md:h-6" /> {t('top_clips')}</span>
                    <ChevronRight className="w-4 h-4 md:w-6 md:h-6 opacity-10" />
                    <span className="text-gray-400 bg-white/5 px-4 py-2 md:px-6 md:py-3 rounded-2xl">{t(`time_${state.timeFilter}`)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 relative z-10 w-full">
              <h1 className="text-5xl md:text-[8rem] font-black tracking-tighter text-white mb-8 leading-[0.9]">
                {state.query && !state.query.includes('clip') && !isTopPopularMode ? `${t('results_for')} "${state.query}"` : t('explore_popular')}
              </h1>
              <p className="text-gray-500 text-lg md:text-2xl font-medium max-w-2xl leading-relaxed relative z-10">{t('app_subtitle')}</p>
            </div>
          )}
        </div>

        {state.error && (
          <div className="mb-14 p-10 bg-[#1c0c0c] border border-red-500/10 rounded-[3rem] text-red-200 text-lg flex items-center gap-8 shadow-2xl">
            <AlertTriangle className="w-10 h-10 text-red-500" />
            <span className="font-black uppercase tracking-widest">{t('error_prefix')}</span> {state.error}
          </div>
        )}

        {state.mode === 'categories' ? (
          <div className="flex flex-col gap-20">
            <CategoryGrid
              categories={state.categories}
              onCategoryClick={handleCategoryClick}
              isLoading={state.isLoading && state.categories.length === 0}
              t={t}
              showRank={isTopPopularMode}
            />
            {state.paginationCursor && (
              <div className="flex justify-center pb-32">
                <button onClick={loadMoreCategories} disabled={state.isLoading} className="flex items-center gap-6 px-16 py-8 bg-[#1a1a24] border border-white/5 hover:border-white/20 rounded-[2rem] text-lg font-black text-gray-400 hover:text-white transition-all shadow-xl active:scale-95 group disabled:opacity-50 cursor-pointer">
                  {state.isLoading ? <Loader2 className="w-8 h-8 animate-spin text-twitch-base" /> : <PlusCircle className="w-8 h-8 text-twitch-base" />}
                  {t('load_more_games')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="pb-32">
            {!state.query.includes('clip') && (
              <FilterBar currentTime={state.timeFilter} currentSort={state.sortType} onTimeChange={handleFilterChange} onSortChange={handleSortChange} onLoadAll={loadAllClips} isLoading={state.isLoading} disabled={state.isLoading && state.clips.length === 0} t={t} />
            )}
            <ClipGrid clips={state.clips} isLoading={state.isLoading} hasMore={!!state.paginationCursor} onLoadMore={loadMoreClips} onLoadAll={loadAllClips} onClipClick={(clip) => {
              setPlayingClip(clip);
              if (typeof window !== 'undefined') {
                window.history.pushState({ view: 'player' }, '');
              }
            }} savedClipIds={new Set(savedClips.map(c => c.id))} onToggleSave={handleToggleSave} onDownloadExternal={openExternalDownload} t={t} />
          </div>
        )}
      </main>

      {playingClip && <FloatingPlayer clip={playingClip} onClose={() => {
        setPlayingClip(null);
        // Si el usuario cierra el player manualmente, deberíamos ir atrás en el historial 
        // para "limpiar" la entrada que pusimos al abrirlo
        if (window.history.state?.view === 'player') {
          window.history.back();
        }
      }} isSaved={savedClips.some(c => c.id === playingClip.id)} onToggleSave={handleToggleSave} onDownloadExternal={openExternalDownload} t={t} />}

      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-300">
          <div className="bg-[#0c0c10] border border-white/10 rounded-[3.5rem] p-12 max-w-lg w-full text-center shadow-[0_0_120px_rgba(0,0,0,0.8)]">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-10" />
            <h3 className="text-4xl font-black mb-6 text-white tracking-tighter">{t('delete_title')}</h3>
            <p className="text-gray-400 text-lg mb-14 leading-relaxed font-bold">{t('delete_desc_modal')}</p>
            <div className="flex gap-4">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-7 bg-white/5 rounded-[2rem] text-base font-black hover:bg-white/10 transition-all">{t('cancel')}</button>
              <button onClick={confirmDeleteAll} className="flex-1 py-7 bg-red-600/90 rounded-[2rem] text-base font-black text-white hover:bg-red-600 transition-all shadow-xl shadow-red-600/5">{t('confirm_delete')}</button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-4 right-4 z-[200]">
        <button
          onClick={scrollToTop}
          className={`bg-[#1a1a24] text-gray-400 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 transition-all hover:text-white hover:bg-twitch-base hover:shadow-[0_20px_40px_rgba(145,70,255,0.3)] hover:-translate-y-3 active:scale-90 cursor-pointer group ${showScrollTop ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-6 h-6 md:w-8 md:h-8 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      <footer className="mt-32 py-20 bg-transparent border-t border-white/5 relative z-10 px-8">
        <style>{`
          footer b { color: #fff; font-weight: 800; text-shadow: 0 0 10px rgba(145, 70, 255, 0.2); }
          footer .keyword-accent { color: #9146ff; font-weight: 800; }
        `}</style>
        <div className="max-w-7xl mx-auto flex flex-col items-center">

          <h2 className="text-twitch-base font-bold tracking-[0.4em] uppercase text-[10px] md:text-[11px] text-center mb-24 opacity-60">
            {t('footer_seo_title')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-24 w-full mb-24">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4 text-white font-black uppercase text-xs tracking-widest">
                <Zap className="w-6 h-6 text-twitch-base" />
                <span>{t('footer_feature1_title')}</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: t('footer_feature1_desc') }} />
            </div>
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4 text-white font-black uppercase text-xs tracking-widest">
                <Layers className="w-6 h-6 text-twitch-base" />
                <span>{t('footer_feature2_title')}</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: t('footer_feature2_desc') }} />
            </div>
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4 text-white font-black uppercase text-xs tracking-widest">
                <CloudDownload className="w-6 h-6 text-twitch-base" />
                <span>{t('footer_feature3_title')}</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: t('footer_feature3_desc') }} />
            </div>
          </div>

          <div className="w-full h-px bg-white/5 mb-24"></div>

          <div className="max-w-5xl text-left w-full">
            <p className="text-gray-300 text-base md:text-xl font-medium leading-[1.6] mb-12" dangerouslySetInnerHTML={{ __html: t('footer_seo_paragraph1') }} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 opacity-40">
              <p className="text-gray-500 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: t('footer_seo_paragraph2') }} />
              <p className="text-gray-500 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: t('footer_seo_desc_large') }} />
            </div>
          </div>

          <div className="flex items-center justify-center w-full gap-8 my-20">
            <div className="h-px bg-white/5 flex-grow max-xs"></div>
            <div className="opacity-20 hover:opacity-40 transition-opacity cursor-default animate-rotate-slow">
              <Clapperboard className="w-12 h-12 text-twitch-base" />
            </div>
            <div className="h-px bg-white/5 flex-grow max-xs"></div>
          </div>

          <div className="text-center flex flex-col items-center gap-8 w-full">
            <p className="tracking-[0.5em] uppercase text-gray-600 text-[11px] font-black">
              {t('footer_text')}
            </p>

            {/* Minimalist Legal Footer */}
            <div className="flex flex-col md:flex-row flex-wrap justify-center gap-y-1 md:gap-12 items-center px-4 w-full">
              <button 
                onClick={() => setLegalModal('privacy')} 
                className="w-full md:w-auto py-4 md:py-0 text-gray-300 hover:text-twitch-base active:bg-white/5 active:scale-95 transition-all text-[11px] font-black uppercase tracking-[0.3em] whitespace-nowrap cursor-pointer rounded-2xl"
              >
                {t('privacy_policy')}
              </button>
              <button 
                onClick={() => setLegalModal('terms')} 
                className="w-full md:w-auto py-4 md:py-0 text-gray-300 hover:text-twitch-base active:bg-white/5 active:scale-95 transition-all text-[11px] font-black uppercase tracking-[0.3em] whitespace-nowrap cursor-pointer rounded-2xl"
              >
                {t('terms_of_service')}
              </button>
              <button 
                onClick={() => setLegalModal('cookies')} 
                className="w-full md:w-auto py-4 md:py-0 text-gray-300 hover:text-twitch-base active:bg-white/5 active:scale-95 transition-all text-[11px] font-black uppercase tracking-[0.3em] whitespace-nowrap cursor-pointer rounded-2xl"
              >
                {t('cookie_policy')}
              </button>
              <div className="hidden md:block w-px h-3 bg-white/10 mx-2"></div>
              <a
                href="mailto:adrian.contact.me.69@gmail.com"
                onClick={handleContactClick}
                className="w-full md:w-auto py-4 md:py-0 flex items-center justify-center gap-2 text-gray-400 hover:text-twitch-base active:bg-white/5 active:scale-95 transition-all text-[10px] md:text-[11px] font-bold uppercase tracking-widest group whitespace-nowrap cursor-pointer rounded-2xl"
              >
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>{t('contact_link')}</span>
              </a>
            </div>

            <p className="text-[10px] text-gray-800 font-bold tracking-[0.2em] uppercase">
              Clipy | Professional Video Aggregator
            </p>
          </div>
        </div>
      </footer>

      {/* Global Legal Components */}
      <CookieBanner t={t} />
      {legalModal && <LegalModal type={legalModal} onClose={() => setLegalModal(null)} onShowToast={(msg) => showToast(msg)} t={t} />}
    </div>
  );
};

