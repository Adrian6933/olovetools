import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, Globe, Sparkles, Github, Twitter, ArrowUp, Menu, X,
  Video, Image as ImageIcon, FileText, Code, Type, Database, Shield, LayoutGrid, CloudDownload,
  PanelLeftClose, PanelLeft, ChevronDown, Activity, Heart, Star,
  TrendingUp, History, ArrowDownAZ, Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectCard } from './ProjectCard';
import { ADS_ENABLED } from '../config/ads';
import { AdSlot } from './shared/AdSlot';
import { useReducedMotion } from './shared/motion';
import { Layout } from './Layout';
import { ProjectCategory } from '../types';
import { MOCK_PROJECTS, LANGUAGES } from '../constants';
import { leerVisitasPropias } from '../lib/toolVisits';
import { createTranslator } from '../locales/meta';

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

/**
 * Minúsculas y sin tildes, para que el buscador no dependa de si alguien
 * escribe "codigo" o "código" (ni de dónde tenga la tecla de la tilde).
 */
const normaliza = (texto: string) =>
  texto.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();

/** Hueco mínimo y máximo de herramientas entre dos anuncios de la rejilla. */
const AD_GAP_MIN = 7;
const AD_GAP_MAX = 15;

/**
 * Dónde van los anuncios dentro de la rejilla de herramientas. El primero
 * sigue detrás de las tres primeras, y a partir de ahí se reparten a saltos
 * irregulares en vez de cada N exactas: un patrón fijo se nota enseguida al
 * bajar y "cansa". Es el mismo reparto que hace la rejilla de clips.
 *
 * El azar es determinista a propósito: con un Math.random() suelto los
 * anuncios cambiarían de sitio en cada repintado, y aquí hay repintados de
 * sobra (buscar, filtrar por categoría, reordenar). Dependiendo solo del
 * índice, cada anuncio se queda donde estaba.
 */
const adPositions = (total: number): Set<number> => {
  const out = new Set<number>();
  let seed = 0x9e3779b9;
  let i = 2;
  // `total - 1` deja fuera la última celda: un anuncio cerrando la rejilla
  // parece el final de la lista y esconde la herramienta que va antes.
  while (i < total - 1) {
    out.add(i);
    // xorshift32: barato, sin dependencias y siempre da la misma secuencia.
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0;
    i += AD_GAP_MIN + (seed % (AD_GAP_MAX - AD_GAP_MIN + 1));
  }
  return out;
};

export const Home: React.FC<{ lang: string, dictionary?: any }> = ({ lang = 'en', dictionary }) => {
  const t = createTranslator(dictionary);
  const prefersReduced = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | 'All' | 'Favorites'>('All');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
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

  // ---- Ordenación por visitas ------------------------------------------
  // Dos fuentes distintas y separadas a propósito: las propias salen del
  // navegador de quien mira y sirven desde la primera visita; las globales
  // vienen del servidor y necesitan tráfico para significar algo.
  // Cuánto pesa cada señal en la nota de "Recomendado".
  const PESO_PROPIAS = 0.7;
  const PESO_GLOBALES = 0.3;

  type Orden = 'default' | 'global' | 'mine' | 'az';
  const ORDEN_GUARDADO = 'olovetools_sort';
  const ORDENES_VALIDOS: Orden[] = ['default', 'global', 'mine', 'az'];

  // Arranca siempre en 'default' y el orden guardado se aplica tras montar. Si
  // se leyera localStorage aquí, el servidor y el navegador pintarían listas
  // distintas y React se quejaría de la hidratación.
  const [orden, setOrden] = useState<Orden>('default');

  useEffect(() => {
    try {
      const guardado = localStorage.getItem(ORDEN_GUARDADO) as Orden | null;
      if (guardado && ORDENES_VALIDOS.includes(guardado)) setOrden(guardado);
    } catch { /* modo privado: se queda en el orden por defecto */ }
  }, []);

  const elegirOrden = (nuevo: Orden) => {
    setOrden(nuevo);
    try { localStorage.setItem(ORDEN_GUARDADO, nuevo); } catch { /* ignore */ }
  };
  const [visitasPropias, setVisitasPropias] = useState<Record<string, number>>({});
  const [visitasGlobales, setVisitasGlobales] = useState<Record<string, number>>({});
  const [hayContadorGlobal, setHayContadorGlobal] = useState(false);
  // Hasta que /api/stats conteste no se sabe si hay contador global. Sin este
  // testigo, la guardia de más abajo tumbaba el orden recién restaurado del
  // navegador porque en ese instante todavía creía que no había contador.
  const [statsListo, setStatsListo] = useState(false);

  useEffect(() => {
    setVisitasPropias(leerVisitasPropias());
  }, []);

  useEffect(() => {
    let vivo = true;
    fetch('/api/stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!vivo || !d) return;
        // Sin almacén configurado el endpoint responde enabled:false, y el
        // selector no ofrece el orden global en vez de enseñar ceros que
        // parecerían datos reales.
        setHayContadorGlobal(Boolean(d.enabled));
        setVisitasGlobales(d.visits || {});
      })
      .catch(() => {})
      .finally(() => { if (vivo) setStatsListo(true); });
    return () => { vivo = false; };
  }, []);

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

  const orderedProjects = useMemo(() => {
    const lista = [...filteredProjects];
    // Sin visitas registradas, el desempate es el orden del catálogo: así una
    // herramienta con 0 visitas no salta a un sitio aleatorio.
    const porVisitas = (fuente: Record<string, number>) =>
      lista.sort((a, b) => (fuente[b.slug] || 0) - (fuente[a.slug] || 0));

    if (orden === 'global') return porVisitas(visitasGlobales);
    if (orden === 'mine') return porVisitas(visitasPropias);
    if (orden === 'az') return lista.sort((a, b) => a.name.localeCompare(b.name));

    // ---- Recomendado -----------------------------------------------------
    // Una nota por herramienta: 70% lo que usas tú, 30% lo que usa todo el
    // mundo. Los dos números NO son comparables en crudo (el global va en
    // cientos y el tuyo en unidades), así que cada fuente se lleva a 0..1
    // dividiendo por su propio máximo antes de mezclarlas; si no, el global
    // aplastaría siempre al personal por pura escala.
    //
    // Quien entra por primera vez no tiene visitas propias: la nota queda en
    // el 30% global, o sea "lo más usado", que es la mejor primera impresión
    // posible. Y con todo a cero manda el orden del catálogo.
    const maximo = (fuente: Record<string, number>) =>
      lista.reduce((mayor, p) => Math.max(mayor, fuente[p.slug] || 0), 0);
    const maxPropias = maximo(visitasPropias);
    const maxGlobales = maximo(visitasGlobales);

    if (maxPropias === 0 && maxGlobales === 0) return lista;

    const nota = (slug: string) => {
      const propia = maxPropias ? (visitasPropias[slug] || 0) / maxPropias : 0;
      const global = maxGlobales ? (visitasGlobales[slug] || 0) / maxGlobales : 0;
      return PESO_PROPIAS * propia + PESO_GLOBALES * global;
    };

    // El orden del catálogo desempata: dos herramientas con la misma nota no
    // deben bailar de sitio entre recargas.
    const posicion = new Map(lista.map((p, i) => [p.slug, i]));
    return lista.sort((a, b) => {
      const diferencia = nota(b.slug) - nota(a.slug);
      if (Math.abs(diferencia) > 1e-9) return diferencia;
      return (posicion.get(a.slug) ?? 0) - (posicion.get(b.slug) ?? 0);
    });
  }, [filteredProjects, orden, visitasGlobales, visitasPropias]);

  const adSlots = useMemo(() => adPositions(orderedProjects.length), [orderedProjects.length]);

  // ---- Autocompletado del buscador --------------------------------------
  // La rejilla ya filtra según escribes, pero con sesenta herramientas eso
  // deja el resultado a dos pantallas de scroll. Esto pone las que mejor
  // encajan justo debajo del campo, para ir directo con Enter.
  const sugerencias = useMemo(() => {
    const q = normaliza(searchQuery);
    if (!q) return [];
    const palabras = q.split(/\s+/).filter(Boolean);
    const traducir = (p: typeof MOCK_PROJECTS[number]) => {
      const clave = `projects.${p.id}.description`;
      const texto = t(clave);
      return normaliza(texto === clave ? p.description : texto);
    };
    // Cuanto más bajo, más arriba sale. Lo que empieza por lo escrito va
    // primero: quien teclea "qr" quiere el lector de QR, no una herramienta
    // cuya descripción menciona los códigos QR de pasada.
    const nota = (p: typeof MOCK_PROJECTS[number]) => {
      const nombre = normaliza(p.name);
      const etiquetas = p.tags.map(normaliza);
      if (nombre === q) return 0;
      if (nombre.startsWith(q)) return 1;
      if (nombre.includes(q)) return 2;
      if (etiquetas.some(tag => tag.startsWith(q))) return 3;
      if (etiquetas.some(tag => tag.includes(q))) return 4;
      if (traducir(p).includes(q)) return 5;
      // Lo último: varias palabras sueltas que aparecen todas, aunque sea en
      // sitios distintos. "convertir color" no es el nombre de nada, pero
      // describe bastante bien lo que se está buscando.
      if (palabras.length > 1) {
        const todo = `${nombre} ${etiquetas.join(' ')} ${traducir(p)}`;
        if (palabras.every(w => todo.includes(w))) return 6;
      }
      return 99;
    };
    return MOCK_PROJECTS
      .map(p => ({ p, n: nota(p) }))
      .filter(x => x.n < 99)
      .sort((a, b) => a.n - b.n || a.p.name.localeCompare(b.p.name))
      .slice(0, 6)
      .map(x => x.p);
  }, [searchQuery, dictionary]);

  const [sugerenciasAbiertas, setSugerenciasAbiertas] = useState(false);
  const [sugerenciaActiva, setSugerenciaActiva] = useState(-1);
  const buscadorRef = useRef<HTMLDivElement>(null);
  const listaVisible = sugerenciasAbiertas && sugerencias.length > 0;

  useEffect(() => {
    if (!listaVisible || sugerenciaActiva < 0) return;
    document.getElementById(`sugerencia-${sugerenciaActiva}`)?.scrollIntoView({ block: 'nearest' });
  }, [listaVisible, sugerenciaActiva]);

  const irAHerramienta = (slug: string) => {
    recordVisit(slug);
    window.location.href = `/${lang}/${slug}/`;
  };

  const teclaBuscador = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { setSugerenciasAbiertas(false); return; }
    if (!listaVisible) {
      // Con la lista cerrada, la flecha abajo la vuelve a abrir en vez de
      // mover el cursor por el texto, que es lo que se espera de un buscador.
      if (e.key === 'ArrowDown' && sugerencias.length > 0) { setSugerenciasAbiertas(true); e.preventDefault(); }
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const paso = e.key === 'ArrowDown' ? 1 : -1;
      const total = sugerencias.length;
      setSugerenciaActiva(actual => {
        const siguiente = actual + paso;
        if (siguiente < 0) return total - 1;
        if (siguiente >= total) return 0;
        return siguiente;
      });
      return;
    }
    if (e.key === 'Enter') {
      // Sin nada marcado, Enter abre la primera: es la que se está mirando.
      const elegida = sugerencias[sugerenciaActiva] ?? sugerencias[0];
      if (elegida) { e.preventDefault(); irAHerramienta(elegida.slug); }
    }
  };

  // Cerrar al pulsar fuera. Con onBlur no valdría: el clic sobre una sugerencia
  // desenfoca el campo antes de que llegue a contarse como clic.
  useEffect(() => {
    if (!listaVisible) return;
    const fuera = (e: MouseEvent) => {
      if (buscadorRef.current && !buscadorRef.current.contains(e.target as Node)) {
        setSugerenciasAbiertas(false);
      }
    };
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
  }, [listaVisible]);

  const tieneVisitasPropias = Object.keys(visitasPropias).length > 0;

  // Alguien pudo dejar elegido "las que más usas" y luego limpiar los datos del
  // navegador, o el contador global pudo apagarse. Sin esto quedaría un orden
  // activo cuyo botón ya no existe, y la lista parecería desordenada sin motivo.
  useEffect(() => {
    if (orden === 'mine' && !tieneVisitasPropias) setOrden('default');
    if (statsListo && orden === 'global' && !hayContadorGlobal) setOrden('default');
  }, [orden, tieneVisitasPropias, hayContadorGlobal, statsListo]);

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
    c === 'Favorites' ? t('favorites') : t(`categories.${c}`);
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
        
        {/* Fixed top-left menu trigger (mobile/tablet only — desktop already has the sidebar's own toggle) */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-[110] w-11 h-11 rounded-full bg-[#1e1f20]/90 backdrop-blur-md border border-white/10 text-white flex items-center justify-center shadow-2xl hover:bg-[#282a2c] active:scale-95 transition-all cursor-pointer"
          aria-label={t('openCategories')}
          title={t('categoriesTitle')}
        >
          <Menu className="w-5 h-5" />
        </button>

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
              title={isSidebarCollapsed ? t('expandMenu') : t('collapseMenu')}
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
                title={t('favorites')}
              >
                <div className="flex items-center gap-3.5">
                  <Star className={`w-4.5 h-4.5 shrink-0 transition-colors ${selectedCategory === 'Favorites' ? 'fill-yellow-400 text-yellow-400' : 'text-yellow-400'}`} />
                  {!isSidebarCollapsed && <span className="truncate">{t('favorites')}</span>}
                </div>
                {!isSidebarCollapsed && <span className="text-[10px] text-slate-500 font-mono">{favorites.length}</span>}
              </button>
            </div>

            {/* Categories segment mimicking recents */}
            <div className="px-1 space-y-1">
              {!isSidebarCollapsed && (
                <div className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  {t('categoriesTitle')}
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
                  <span>{t('activity')}</span>
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
                    {t('activityEmpty')}
                  </p>
                )}
              </div>
            ) : (
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="w-full flex items-center justify-center p-3 rounded-full text-slate-400 hover:bg-[#282a2c] hover:text-white transition-colors"
                title={t('activity')}
              >
                <Activity className="w-4 h-4" />
              </button>
            )}

            {/* Sidebar Ad Slot (Visible when expanded) */}
            {!isSidebarCollapsed && (ADS_ENABLED || import.meta.env.DEV) && (
              <div className="px-2.5 py-2.5 text-center" id="adsense-sidebar-ad">
                <AdSlot position="side" size="rectangle" />
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
        {(ADS_ENABLED || import.meta.env.DEV) && (
          <div className={`fixed inset-y-0 right-0 pointer-events-none z-30 hidden transition-all duration-300 justify-center ${
            isSidebarCollapsed 
              ? '[@media(min-width:1800px)]:flex left-[76px]' 
              : '[@media(min-width:2000px)]:flex left-[272px]'
          }`}>
            <div className="relative w-full max-w-7xl h-full flex items-center">
              {/* Left Skyscraper */}
              <div className="absolute left-[-280px] pointer-events-auto w-[160px] h-[600px] flex items-center justify-center" id="adsense-left-skyscraper">
                <AdSlot position="railLeft" size="skyscraper" />
              </div>

              {/* Right Skyscraper */}
              <div className="absolute right-[-280px] pointer-events-auto w-[160px] h-[600px] flex items-center justify-center" id="adsense-right-skyscraper">
                <AdSlot position="railRight" size="skyscraper" />
              </div>
            </div>
          </div>
        )}

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
          {/* The entire hero must sit above the grid's stacking context. */}
          <div className="relative z-20 pt-20 pb-12 selection:bg-indigo-500/30 selection:text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
              <motion.h1
                initial={{ y: prefersReduced ? 0 : 20 }}
                animate={{ y: 0 }}
                transition={{ duration: prefersReduced ? 0 : 0.5, delay: prefersReduced ? 0 : 0.05, ease: "easeOut" }}
                className="text-5xl md:text-7xl font-black text-white mb-6 tracking-[-0.04em] leading-[1.15] font-outfit"
              >
                {t('heroTitle')}{' '}
                <span className="font-outfit" style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundImage: 'linear-gradient(to right, #60a5fa, #c084fc, #f472b6)', display: 'inline-block', paddingBottom: '0.12em', marginBottom: '-0.12em' }}>
                  {t('heroHighlight')}
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: prefersReduced ? 0 : 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: prefersReduced ? 0 : 0.5, delay: prefersReduced ? 0 : 0.15, ease: "easeOut" }}
                className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light font-sans"
              >
                {t('heroSubtitle')}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: prefersReduced ? 0 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: prefersReduced ? 0 : 0.7, delay: prefersReduced ? 0 : 0.25, ease: "easeOut" }}
                className="relative group max-w-2xl mx-auto z-30"
                ref={buscadorRef}
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setSugerenciasAbiertas(true); setSugerenciaActiva(-1); }}
                  onFocus={() => setSugerenciasAbiertas(true)}
                  onKeyDown={teclaBuscador}
                  placeholder={t('searchPlaceholder')}
                  /* El autocompletado del navegador taparía el nuestro con su
                     propia lista de cosas escritas antes. */
                  autoComplete="off"
                  spellCheck={false}
                  aria-label={t('searchPlaceholder')}
                  aria-autocomplete="list"
                  role="combobox"
                  aria-expanded={listaVisible}
                  aria-controls="buscador-sugerencias"
                  aria-activedescendant={listaVisible && sugerenciaActiva >= 0 ? `sugerencia-${sugerenciaActiva}` : undefined}
                  className="w-full pl-14 pr-6 py-4 bg-[#1e1f20]/90 border border-white/[0.06] rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-2xl transition-all font-sans"
                />
                <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none z-25">
                  <Search className="w-5 h-5 text-slate-400 group-hover:text-blue-400 group-focus-within:text-blue-400 transition-colors" />
                </div>

                {listaVisible && (
                  <ul
                    id="buscador-sugerencias"
                    role="listbox"
                    className="absolute left-0 right-0 top-full mt-2 z-50 max-h-[min(20rem,50dvh)] overflow-y-auto overscroll-contain rounded-2xl border border-white/[0.12] bg-[#1e1f20] shadow-2xl text-left"
                  >
                    {sugerencias.map((p, i) => {
                      const Icono = categoryIconMap[p.category] || Sparkles;
                      const activa = i === sugerenciaActiva;
                      return (
                        <li key={p.id} id={`sugerencia-${i}`} role="option" aria-selected={activa}>
                          <a
                            href={`/${lang}/${p.slug}/`}
                            onClick={() => recordVisit(p.slug)}
                            onMouseEnter={() => setSugerenciaActiva(i)}
                            className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                              activa ? 'bg-blue-500/15 text-white' : 'text-slate-300 hover:bg-white/[0.04]'
                            }`}
                          >
                            <Icono className={`w-4 h-4 shrink-0 ${activa ? 'text-blue-400' : 'text-slate-500'}`} />
                            <span className="flex-grow min-w-0 truncate text-sm font-semibold">{p.name}</span>
                            <span className="hidden sm:block max-w-[45%] truncate shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              {t(`categories.${p.category}`)}
                            </span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </motion.div>
            </div>
          </div>

          {/* Main Grid Area */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-40 relative z-10 w-full flex-grow font-sans">
            {/* Top Leaderboard Ad Slot — hidden in production until ads.ts is configured */}
            {(ADS_ENABLED || import.meta.env.DEV) && (
              <div className="w-full mb-8" id="adsense-top-banner">
                <AdSlot position="top" size="leaderboard" lazyLoad={false} />
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-10">
              
              {/* Mobile quick category pills (visible below lg viewport); the fixed top-left button opens the full drawer */}
              <div className="lg:hidden flex flex-col gap-4 w-full">
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
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Control segmentado. Sólo se ofrecen los órdenes que tienen
                        dato detrás: el global si hay contador configurado, el
                        propio si esta persona ya ha abierto algo. Un botón que
                        ordena por un criterio vacío no ordena nada y confunde. */}
                    <div
                      role="group"
                      aria-label={t('sortBy')}
                      className="flex items-center gap-0.5 bg-black/30 border border-white/[0.07] rounded-2xl p-1 shadow-lg shadow-black/30 overflow-x-auto scrollbar-none max-w-full"
                    >
                      {([
                        ['default', t('sortDefault'), Wand2],
                        ...(hayContadorGlobal ? [['global', t('sortGlobal'), TrendingUp] as const] : []),
                        ...(tieneVisitasPropias ? [['mine', t('sortMine'), History] as const] : []),
                        ['az', t('sortAz'), ArrowDownAZ],
                      ] as [Orden, string, React.ElementType][]).map(([clave, etiqueta, Icono]) => {
                        const activo = orden === clave;
                        return (
                          <button
                            key={clave}
                            type="button"
                            onClick={() => elegirOrden(clave)}
                            aria-pressed={activo}
                            title={etiqueta}
                            className={`group/sort relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 ${
                              activo
                                ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-950/50'
                                : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                            }`}
                          >
                            <Icono className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${activo ? '' : 'group-hover/sort:scale-110'}`} />
                            {/* El texto se oculta en pantallas estrechas: cuatro
                                etiquetas completas no caben en un móvil y
                                empujarían la fila fuera de la pantalla. El icono
                                y el title siguen identificando cada opción. */}
                            <span className={activo ? 'inline' : 'hidden lg:inline'}>{etiqueta}</span>
                          </button>
                        );
                      })}
                    </div>
                    <span className="hidden xl:inline bg-blue-500/10 text-blue-300 px-3 py-1 rounded-full border border-blue-500/20 text-[10px] font-bold whitespace-nowrap">
                      {selectedCategory === 'All' ? t('allCategories') : catLabel(selectedCategory)}
                    </span>
                  </div>
                </div>

                {orderedProjects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                      {orderedProjects.map((project, index) => (
                        <div key={project.id} className="contents">
                          <motion.div
                            key={project.id}
                            layout
                            initial={{ opacity: 0, scale: prefersReduced ? 1 : 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: prefersReduced ? 1 : 0.95 }}
                            transition={{ duration: prefersReduced ? 0 : 0.3 }}
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
                              t={t}
                              lang={lang}
                              onOpen={() => recordVisit(project.slug)}
                              isFavorite={favorites.includes(project.slug)}
                              onToggleFavorite={() => toggleFavorite(project.slug)}
                              visitasGlobales={hayContadorGlobal ? visitasGlobales[project.slug] : undefined}
                              visitasPropias={visitasPropias[project.slug]}
                            />
                          </motion.div>

                          {/* In-feed Ad Slot card inside the tools grid flow — hidden in production until ads.ts is configured */}
                          {adSlots.has(index) && (ADS_ENABLED || import.meta.env.DEV) && (
                            <motion.div
                              layout
                              initial={{ opacity: 0, scale: prefersReduced ? 1 : 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-white/[0.01] border border-white/[0.04] border-dashed rounded-3xl p-4 flex flex-col justify-center items-center text-center min-h-[350px]"
                              /* Con varios anuncios en la rejilla el id tiene que
                                 llevar el índice: repetido dejaba de identificar
                                 nada y un id duplicado es HTML inválido. */
                              id={`adsense-infeed-card-${index}`}
                            >
                              <AdSlot position="infeed" size="rectangle" />
                            </motion.div>
                          )}
                        </div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : selectedCategory === 'Favorites' && favorites.length === 0 ? (
                  <div className="text-center py-24 bg-white/[0.02] backdrop-blur-sm rounded-3xl border border-white/10 border-dashed">
                    <Star className="w-16 h-16 text-yellow-400/50 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
                      {t('noFavorites')}
                    </h2>
                    <p className="text-slate-400 text-sm">
                      {t('noFavoritesHint')}
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

            {/* Bottom Leaderboard Ad Slot — hidden in production until ads.ts is configured */}
            {(ADS_ENABLED || import.meta.env.DEV) && (
              <div className="w-full mt-16" id="adsense-bottom-banner">
                <AdSlot position="late" size="leaderboard" />
              </div>
            )}
          </main>
        </div>

        {/* Scroll Top Button */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, scale: prefersReduced ? 1 : 0.8, y: prefersReduced ? 0 : 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: prefersReduced ? 1 : 0.8, y: prefersReduced ? 0 : 20 }}
              onClick={() => window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' })}
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
                initial={{ x: prefersReduced ? 0 : '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: prefersReduced ? 0 : '-100%' }}
                transition={prefersReduced ? { duration: 0.1 } : { type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 bottom-0 left-0 w-80 bg-[#1e1f20] border-r border-white/5 z-[101] p-6 shadow-2xl flex flex-col font-sans"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex flex-col">
                    <span className="font-bold text-white font-outfit text-lg tracking-wide uppercase">oLoveTools</span>
                    <span className="text-slate-400 text-[10px] font-medium tracking-wide">
                      {t('categoryNav')}
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

        {/* Barra fija descartable al pie, misma que en todas las herramientas (AdSlot 'anchor') */}
        <AdSlot position="anchor" size="mobile-banner" />
      </div>
    </Layout>
  );
};
