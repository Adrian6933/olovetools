import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, Globe, Sparkles, Github, Twitter, ArrowUp, Menu, X,
  Video, Image as ImageIcon, FileText, Code, Type, Database, Shield, LayoutGrid, CloudDownload,
  PanelLeftClose, PanelLeft, ChevronDown, Activity, Heart, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectCard } from './ProjectCard';
import { Layout } from './Layout';
import { ProjectCategory } from '../types';
import { MOCK_PROJECTS, LANGUAGES } from '../constants';
import { useTranslation, Language } from '../locales/dictionary';

const categoryIconMap: Record<string, React.ComponentType<any>> = {
  All: Sparkles,
  video_audio: Video,
  image_design: ImageIcon,
  document_pdf: FileText,
  developer_tools: Code,
  text_utilities: Type,
  data_conversion: Database,
  security_crypto: Shield,
  network_system: Globe,
  productivity: LayoutGrid,
  social_downloads: CloudDownload
};

export const Home: React.FC<{ lang: string, dictionary?: any }> = ({ lang = 'en', dictionary }) => {
  const { t } = useTranslation(lang as Language, 'hub');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | 'All' | 'Favorites'>('All');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [showMobileAnchor, setShowMobileAnchor] = useState(true);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Reset scroll to top when category changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedCategory]);

  // Click outside language selector to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (newLang: string) => {
    setIsLangMenuOpen(false);
    localStorage.setItem('olovetools_lang', newLang);
    window.location.href = `/${newLang}`;
  };

  // --- Recent activity + persisted preferences (localStorage) ---
  const [recent, setRecent] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('olovetools_recent');
      if (raw) setRecent(JSON.parse(raw));
    } catch { /* ignore */ }
    try {
      const fav = localStorage.getItem('olovetools_favorites');
      if (fav) setFavorites(JSON.parse(fav));
    } catch { /* ignore */ }
    try {
      if (localStorage.getItem('olovetools_sidebar_collapsed') === '1') setIsSidebarCollapsed(true);
    } catch { /* ignore */ }
  }, []);

  const toggleFavorite = (slug: string) => {
    setFavorites((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      try { localStorage.setItem('olovetools_favorites', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const recordVisit = (slug: string) => {
    try {
      const raw = localStorage.getItem('olovetools_recent');
      const arr: string[] = raw ? JSON.parse(raw) : [];
      const next = [slug, ...arr.filter((s) => s !== slug)].slice(0, 6);
      localStorage.setItem('olovetools_recent', JSON.stringify(next));
    } catch { /* ignore */ }
  };

  const toggleCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem('olovetools_sidebar_collapsed', next ? '1' : '0'); } catch { /* ignore */ }
      return next;
    });
  };

  const recentProjects = useMemo(
    () => recent.map((slug) => MOCK_PROJECTS.find((p) => p.slug === slug)).filter(Boolean) as typeof MOCK_PROJECTS,
    [recent]
  );

  const filteredProjects = useMemo(() => {
    return MOCK_PROJECTS.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory =
        selectedCategory === 'All'
          ? true
          : selectedCategory === 'Favorites'
          ? favorites.includes(project.slug)
          : project.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, favorites]);

  // Compute counts dynamically
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: MOCK_PROJECTS.length };
    Object.values(ProjectCategory).forEach(cat => {
      counts[cat] = 0;
    });
    MOCK_PROJECTS.forEach(project => {
      if (counts[project.category] !== undefined) {
        counts[project.category]++;
      }
    });
    return counts;
  }, []);

  const categories = ['All', ...Object.values(ProjectCategory)];
  const mobileCategories = ['All', 'Favorites', ...Object.values(ProjectCategory)];

  const catLabel = (c: string) =>
    c === 'Favorites' ? 'Favoritos' : t(`categories.${c}`);
  const catIcon = (c: string): React.ComponentType<any> =>
    c === 'Favorites' ? Star : (categoryIconMap[c] || Sparkles);
  const catCount = (c: string) =>
    c === 'Favorites' ? favorites.length : (categoryCounts[c] || 0);

  return (
    <Layout lang={lang} hideHeader={true}>
      {/* SVG Gradient Definition for Logo Heart Icon */}
      <svg className="absolute w-0 h-0" width="0" height="0" aria-hidden="true">
        <defs>
          <linearGradient id="heart-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="50%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
        </defs>
      </svg>

      <div className="relative min-h-screen bg-[#131314] text-slate-200">
        
        {/* Gemini-Style desktop left sidebar */}
        <aside className={`hidden lg:flex flex-col fixed top-0 bottom-0 left-0 h-screen z-50 bg-[#1e1f20] py-5 px-3 transition-all duration-300 select-none ${
          isSidebarCollapsed ? 'w-[76px]' : 'w-68'
        }`}>
          {/* Logo / Header + Toggle collapse button */}
          <div className="flex items-center justify-between px-2.5 mb-6 h-8">
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-3">
                <Heart 
                  className="w-5 h-5 animate-pulse shrink-0" 
                  style={{ 
                    fill: 'url(#heart-gradient)', 
                    stroke: 'url(#heart-gradient)' 
                  }} 
                />
                <span className="font-outfit text-[18px] font-bold text-white tracking-wide">
                  oLoveTools
                </span>
              </div>
            )}
            
            <button 
              onClick={toggleCollapse}
              className={`p-2 hover:bg-[#282a2c] rounded-full text-slate-300 hover:text-white transition-colors cursor-pointer ${
                isSidebarCollapsed ? 'mx-auto' : ''
              }`}
              title={isSidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
            >
              {isSidebarCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
          </div>

          {/* Menu contents list */}
          <div className="flex-1 overflow-y-auto scrollbar-none space-y-5">
            {/* Top Core Action */}
            <div className="px-1">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-full transition-colors font-medium text-sm ${
                  selectedCategory === 'All'
                    ? 'bg-[#2f3032] text-white'
                    : 'text-slate-300 hover:bg-[#282a2c] hover:text-white'
                }`}
                title={t('categories.All')}
              >
                <Sparkles className="w-4.5 h-4.5 text-blue-400 shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">{t('categories.All')}</span>}
              </button>
            </div>

            {/* Favorites */}
            <div className="px-1">
              <button
                onClick={() => setSelectedCategory('Favorites')}
                className={`w-full flex items-center px-3 py-2.5 rounded-full transition-colors font-medium text-sm ${
                  isSidebarCollapsed ? 'justify-center' : 'justify-between'
                } ${
                  selectedCategory === 'Favorites'
                    ? 'bg-[#2f3032] text-white'
                    : 'text-slate-300 hover:bg-[#282a2c] hover:text-white'
                }`}
                title="Favoritos"
              >
                <div className="flex items-center gap-3.5">
                  <Star className={`w-4.5 h-4.5 shrink-0 transition-colors ${selectedCategory === 'Favorites' ? 'fill-yellow-400 text-yellow-400' : 'text-yellow-400'}`} />
                  {!isSidebarCollapsed && <span className="truncate">Favoritos</span>}
                </div>
                {!isSidebarCollapsed && <span className="text-[10px] text-slate-500 font-mono">{favorites.length}</span>}
              </button>
            </div>

            {/* Categories segment mimicking recents */}
            <div className="px-1 space-y-1">
              {!isSidebarCollapsed && (
                <div className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  Categorías
                </div>
              )}
              <div className="flex flex-col gap-0.5">
                {categories.filter(c => c !== 'All').map((category) => {
                  const IconComponent = categoryIconMap[category] || Sparkles;
                  const isActive = selectedCategory === category;
                  const count = categoryCounts[category] || 0;
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category as any)}
                      className={`w-full flex items-center transition-all duration-200 rounded-full font-medium text-xs ${
                        isSidebarCollapsed 
                          ? 'justify-center p-3' 
                          : 'justify-between px-3 py-2.5'
                      } ${
                        isActive
                          ? 'bg-[#2f3032] text-white'
                          : 'text-slate-300 hover:bg-[#282a2c] hover:text-white'
                      }`}
                      title={t(`categories.${category}`)}
                    >
                      <div className="flex items-center gap-3.5">
                        <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                        {!isSidebarCollapsed && <span className="truncate max-w-[180px]">{t(`categories.${category}`)}</span>}
                      </div>
                      {!isSidebarCollapsed && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar Footer: recent activity + language + hub label */}
          <div className="pt-4 border-t border-white/[0.04] space-y-4 px-1">
            {/* Recent activity */}
            {!isSidebarCollapsed ? (
              <div className="space-y-1">
                <div className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 shrink-0" />
                  <span>Actividad</span>
                </div>
                {recentProjects.length > 0 ? (
                  <div className="flex flex-col gap-0.5">
                    {recentProjects.slice(0, 4).map((p) => {
                      const Icon = categoryIconMap[p.category] || Sparkles;
                      return (
                        <a
                          key={p.id}
                          href={`/${lang}/${p.slug}`}
                          onClick={() => recordVisit(p.slug)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-full text-slate-300 hover:bg-[#282a2c] hover:text-white text-xs font-medium transition-colors group/recent"
                          title={p.name}
                        >
                          <Icon className="w-4 h-4 text-slate-400 group-hover/recent:text-blue-400 shrink-0 transition-colors" />
                          <span className="truncate">{p.name}</span>
                        </a>
                      );
                    })}
                  </div>
                ) : (
                  <p className="px-3 py-1 text-[11px] text-slate-600 leading-relaxed">
                    Tus herramientas usadas aparecerán aquí.
                  </p>
                )}
              </div>
            ) : (
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="w-full flex items-center justify-center p-3 rounded-full text-slate-400 hover:bg-[#282a2c] hover:text-white transition-colors"
                title="Actividad"
              >
                <Activity className="w-4 h-4" />
              </button>
            )}

            {/* Sidebar Ad Slot (Visible when expanded) */}
            {!isSidebarCollapsed && (
              <div className="px-2.5 py-2.5 bg-white/[0.01] border border-white/[0.04] rounded-2xl text-center" id="adsense-sidebar-ad">
                <span className="text-[8px] text-slate-500 font-mono tracking-wider mb-1.5 uppercase opacity-40 block">Publicidad</span>
                <div className="h-20 flex flex-col items-center justify-center border border-white/[0.03] rounded-lg bg-black/10 text-[9px] text-slate-600 font-bold p-1">
                  <span>Ad Slot</span>
                  <span className="text-[8px] font-normal text-slate-600 opacity-75 mt-0.5">Adaptable</span>
                </div>
              </div>
            )}

            {/* Language selector */}
            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className={`w-full flex items-center gap-2.5 rounded-full text-slate-300 hover:bg-[#282a2c] hover:text-white transition-colors cursor-pointer ${
                  isSidebarCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'
                }`}
                title="Idioma"
              >
                <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                {!isSidebarCollapsed && (
                  <>
                    <span className="text-xs font-medium flex-1 text-left truncate">
                      {LANGUAGES.find((l) => l.code === lang)?.name || 'Language'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>

              {/* Language selection popup */}
              {isLangMenuOpen && !isSidebarCollapsed && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#1e1f20] border border-white/5 rounded-xl shadow-2xl overflow-hidden py-1 z-[60] max-h-72 overflow-y-auto scrollbar-none">
                  <div className="px-3 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-white/[0.04] mb-1">
                    Idioma
                  </div>
                  {LANGUAGES.map((language) => (
                    <button
                      key={language.code}
                      onClick={() => handleLanguageChange(language.code)}
                      className={`w-full px-3 py-2.5 text-left text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                        lang === language.code 
                          ? 'bg-[#2f3032] text-white' 
                          : 'text-slate-300 hover:bg-[#282a2c] hover:text-white'
                      }`}
                    >
                       <span className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[9px] uppercase ${
                         lang === language.code ? 'bg-blue-600/20 text-blue-400' : 'bg-white/5 text-slate-500'
                       }`}>
                         {language.code}
                       </span>
                       <span className="font-semibold">{language.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Centered hub label */}
            {!isSidebarCollapsed && (
              <div className="text-center text-[10px] text-slate-500 font-semibold tracking-wide pt-1">
                oLoveTools Hub
              </div>
            )}
          </div>
        </aside>

        {/* Fixed Skyscraper Side Banners - positioned relative to the centered 7xl content column, scrolling-free (fixed) */}
        <div className={`fixed inset-y-0 right-0 pointer-events-none z-30 hidden transition-all duration-300 justify-center ${
          isSidebarCollapsed 
            ? '[@media(min-width:1800px)]:flex left-[76px]' 
            : '[@media(min-width:2000px)]:flex left-[272px]'
        }`}>
          <div className="relative w-full max-w-7xl h-full flex items-center">
            {/* Left Skyscraper (Wider, taller, and more separated) */}
            <div className="absolute left-[-280px] pointer-events-auto w-[200px] h-[680px] bg-[#1e1f20]/30 backdrop-blur-md border border-white/[0.05] rounded-3xl flex flex-col items-center justify-center p-4 text-center shadow-2xl transition-all duration-300" id="adsense-left-skyscraper">
              <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase opacity-60 mb-3 block">Publicidad</span>
              <div className="w-full flex-grow flex flex-col items-center justify-center border border-white/[0.03] rounded-2xl bg-black/20 p-3 text-[11px] text-slate-400 font-bold">
                <span className="text-white font-outfit text-xs mb-1">Rascacielos</span>
                <span className="text-[10px] font-normal text-slate-500">Lateral Izquierdo</span>
                <span className="text-[9px] font-mono text-blue-400/80 bg-blue-500/5 px-2 py-0.5 rounded-full border border-blue-500/10 mt-3">160 x 600</span>
              </div>
            </div>

            {/* Right Skyscraper (Wider, taller, and more separated) */}
            <div className="absolute right-[-280px] pointer-events-auto w-[200px] h-[680px] bg-[#1e1f20]/30 backdrop-blur-md border border-white/[0.05] rounded-3xl flex flex-col items-center justify-center p-4 text-center shadow-2xl transition-all duration-300" id="adsense-right-skyscraper">
              <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase opacity-60 mb-3 block">Publicidad</span>
              <div className="w-full flex-grow flex flex-col items-center justify-center border border-white/[0.03] rounded-2xl bg-black/20 p-3 text-[11px] text-slate-400 font-bold">
                <span className="text-white font-outfit text-xs mb-1">Rascacielos</span>
                <span className="text-[10px] font-normal text-slate-500">Lateral Derecho</span>
                <span className="text-[9px] font-mono text-blue-400/80 bg-blue-500/5 px-2 py-0.5 rounded-full border border-blue-500/10 mt-3">160 x 600</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content area which adjusts spacing next to the left-fixed sidebar */}
        <div className={`relative isolate transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:pl-[76px]' : 'lg:pl-68'
        } min-h-screen flex flex-col`}>
          

          {/* Dotted grid background */}
          <div className="absolute inset-0 pointer-events-none -z-10" 
            style={{ 
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1.2px, transparent 1.2px)', 
              backgroundSize: '24px 24px',
              maskImage: 'radial-gradient(circle at 50% 25%, black, transparent 90%)',
              WebkitMaskImage: 'radial-gradient(circle at 50% 25%, black, transparent 90%)',
            }} 
          />
              
          {/* Hero Header Area */}
          <div className="relative pt-20 pb-12 selection:bg-indigo-500/30 selection:text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
              <motion.h1 
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, delay: 0.05, ease: "easeOut" }}
                className="text-5xl md:text-7xl font-black text-white mb-6 tracking-[-0.04em] leading-[1.15] font-outfit"
              >
                {t('heroTitle')}{' '}
                <span className="font-outfit" style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundImage: 'linear-gradient(to right, #60a5fa, #c084fc, #f472b6)', display: 'inline-block', paddingBottom: '0.12em', marginBottom: '-0.12em' }}>
                  {t('heroHighlight')}
                </span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
                className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light font-sans"
              >
                {t('heroSubtitle')}
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
                className="relative group max-w-2xl mx-auto z-10"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full pl-14 pr-6 py-4 bg-[#1e1f20]/90 border border-white/[0.06] rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-2xl transition-all font-sans"
                />
                <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none z-25">
                  <Search className="w-5 h-5 text-slate-400 group-hover:text-blue-400 group-focus-within:text-blue-400 transition-colors" />
                </div>
              </motion.div>
            </div>
          </div>

          {/* Main Grid Area */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-40 relative z-10 w-full flex-grow font-sans">
            {/* Top Leaderboard Ad Slot (Facilitates Google AdSense Auto/Manual ads) */}
            <div className="w-full mb-8" id="adsense-top-banner">
              <div className="w-full min-h-[90px] md:min-h-[100px] flex flex-col items-center justify-center bg-white/[0.01] border border-white/[0.04] rounded-2xl p-4 text-[10px] text-slate-500 font-mono tracking-widest text-center">
                <span className="opacity-40 uppercase">Publicidad / Advertisement</span>
                {/* Insert the AdSense ins tag here or leave empty for Auto-Ads wrapper */}
                <div className="w-full max-w-[728px] h-[90px] mt-2 flex items-center justify-center bg-black/10 border border-white/[0.02] rounded-lg">
                  <span className="text-[10px] text-slate-600 font-sans">Bloque de anuncio adaptable (Leaderboard)</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-10">
              
              {/* Mobile categories header trigger (visible below lg viewport) */}
              <div className="lg:hidden flex flex-col gap-4 w-full">
                <div className="flex items-center justify-between bg-[#1e1f20] border border-white/5 rounded-2xl p-4 backdrop-blur-md relative">
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest font-sans">
                      Filtrar por Categoría
                    </span>
                    <span className="text-white text-base font-bold flex items-center gap-2 mt-0.5">
                      {React.createElement(catIcon(selectedCategory), { className: "w-4 h-4 text-blue-400" })}
                      {catLabel(selectedCategory)}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold active:scale-95 transition-transform"
                  >
                    <Menu className="w-4 h-4" />
                    <span>Categorías</span>
                  </button>
                </div>

                {/* Horizontal scroll list for quick mobile tap */}
                <div className="flex overflow-x-auto gap-2 pb-2 px-1 scrollbar-none">
                  {mobileCategories.map((category) => {
                    const isActive = selectedCategory === category;
                    return (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category as any)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 border inline-flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-[#1e1f20] text-slate-400 border-white/5'
                        }`}
                      >
                        {category === 'Favorites' && <Star className={`w-3 h-3 ${isActive ? 'fill-white' : 'fill-yellow-400 text-yellow-400'}`} />}
                        {catLabel(category)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Projects Grid Container */}
              <div className="flex-grow w-full">
                <div className="flex items-center justify-between mb-6 text-slate-400 text-xs font-semibold uppercase tracking-widest px-1">
                  <span>{t('showing')} {filteredProjects.length} {t('projectsText')}</span>
                  <span className="hidden sm:inline bg-blue-500/10 text-blue-300 px-3 py-1 rounded-full border border-blue-500/20 text-[10px] font-bold">
                    {selectedCategory === 'All' ? 'All Categories' : catLabel(selectedCategory)}
                  </span>
                </div>

                {filteredProjects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                      {filteredProjects.map((project, index) => (
                        <React.Fragment key={project.id}>
                          <motion.div
                            key={project.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                          >
                            <ProjectCard 
                              project={{
                                ...project,
                                description: t(`projects.${project.id}.description`) !== `projects.${project.id}.description` 
                                  ? t(`projects.${project.id}.description`) 
                                  : project.description
                              }} 
                              categoryLabel={t(`categories.${project.category}`)}
                              buttonLabel={t('openTool')}
                              lang={lang}
                              onOpen={() => recordVisit(project.slug)}
                              isFavorite={favorites.includes(project.slug)}
                              onToggleFavorite={() => toggleFavorite(project.slug)}
                            />
                          </motion.div>

                          {/* In-feed Ad Slot card inside the tools grid flow */}
                          {index === 2 && (
                            <motion.div
                              layout
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-white/[0.01] border border-white/[0.04] border-dashed rounded-3xl p-8 flex flex-col justify-center items-center text-center min-h-[350px]"
                              id="adsense-infeed-card"
                            >
                              <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase opacity-40 mb-3">Publicidad / Advertisement</span>
                              <div className="w-full flex-grow flex flex-col items-center justify-center border border-white/[0.03] rounded-2xl bg-black/15 p-4 min-h-[220px]">
                                <span className="text-[10px] text-slate-600 font-mono tracking-wider uppercase opacity-35 mb-2">Google AdSense Card</span>
                                <span className="text-slate-500 text-xs font-semibold">Anuncio Adaptable / In-feed Slot</span>
                              </div>
                            </motion.div>
                          )}
                        </React.Fragment>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : selectedCategory === 'Favorites' && favorites.length === 0 ? (
                  <div className="text-center py-24 bg-white/[0.02] backdrop-blur-sm rounded-3xl border border-white/10 border-dashed">
                    <Star className="w-16 h-16 text-yellow-400/50 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
                      {lang === 'es' ? 'Aún no tienes favoritos' : 'No favorites yet'}
                    </h2>
                    <p className="text-slate-400 text-sm">
                      {lang === 'es' ? 'Pulsa la estrella ★ en cualquier herramienta para guardarla aquí.' : 'Tap the ★ star on any tool to save it here.'}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-24 bg-white/[0.02] backdrop-blur-sm rounded-3xl border border-white/10 border-dashed">
                    <Globe className="w-16 h-16 text-slate-500 mx-auto mb-4 opacity-50" />
                    <h2 className="text-xl font-bold text-white mb-2 tracking-tight">{t('noProjects')}</h2>
                    <p className="text-slate-400 text-sm">{t('tryAdjusting')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Leaderboard Ad Slot (Facilitates Google AdSense Auto/Manual ads) */}
            <div className="w-full mt-16" id="adsense-bottom-banner">
              <div className="w-full min-h-[90px] md:min-h-[100px] flex flex-col items-center justify-center bg-white/[0.01] border border-white/[0.04] rounded-2xl p-4 text-[10px] text-slate-500 font-mono tracking-widest text-center">
                <span className="opacity-40 uppercase">Publicidad / Advertisement</span>
                <div className="w-full max-w-[728px] h-[90px] mt-2 flex items-center justify-center bg-black/10 border border-white/[0.02] rounded-lg">
                  <span className="text-[10px] text-slate-600 font-sans">Bloque de anuncio adaptable (Leaderboard)</span>
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Scroll Top Button */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="fixed bottom-24 lg:bottom-10 right-5 lg:right-10 z-[200] w-14 h-14 bg-white text-black rounded-full shadow-2xl flex items-center justify-center hover:scale-110 hover:-translate-y-1 active:scale-90 transition-all cursor-pointer group"
              aria-label="Scroll to top"
            >
              <ArrowUp className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 rounded-full bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Mobile Drawer Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/80 z-[100]"
              />
              {/* Drawer */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 bottom-0 left-0 w-80 bg-[#1e1f20] border-r border-white/5 z-[101] p-6 shadow-2xl flex flex-col font-sans"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex flex-col">
                    <span className="font-bold text-white font-outfit text-lg tracking-wide uppercase">oLoveTools</span>
                    <span className="text-slate-400 text-[10px] font-medium tracking-wide">
                      {lang === 'es' ? 'Navegación de Categorías' : 'Category Navigation'}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5 border border-transparent"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 scrollbar-thin">
                  {mobileCategories.map((category) => {
                    const IconComponent = catIcon(category);
                    const isActive = selectedCategory === category;
                    const count = catCount(category);
                    const isFav = category === 'Favorites';
                    return (
                      <button
                        key={category}
                        onClick={() => {
                          setSelectedCategory(category as any);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`flex items-center justify-between px-4 py-3 rounded-full text-xs font-bold transition-all duration-200 w-full border ${
                          isActive
                            ? 'bg-[#2f3032] text-white border-transparent'
                            : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <IconComponent className={`w-4 h-4 ${isFav ? 'fill-yellow-400 text-yellow-400' : isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                          <span>{catLabel(category)}</span>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-slate-400">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mobile sticky bottom anchor ad (responsive — phones/tablets) */}
        {showMobileAnchor && (
          <div
            className="lg:hidden fixed bottom-0 left-0 right-0 z-[95] bg-[#1e1f20]/95 backdrop-blur-md border-t border-white/10 px-2 pt-1.5 pb-2"
            id="adsense-mobile-anchor"
          >
            <button
              onClick={() => setShowMobileAnchor(false)}
              aria-label="Cerrar anuncio"
              className="absolute -top-7 right-2 w-7 h-7 rounded-full bg-[#1e1f20] border border-white/10 text-slate-400 hover:text-white flex items-center justify-center shadow-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="w-full flex flex-col items-center justify-center text-center">
              <span className="text-[8px] text-slate-500 font-mono uppercase tracking-widest opacity-50 mb-0.5">Publicidad</span>
              <div className="w-full max-w-[320px] h-[50px] flex items-center justify-center bg-black/10 border border-white/[0.03] rounded">
                <span className="text-[9px] text-slate-600 font-sans">Anuncio adaptable móvil (320×50)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
