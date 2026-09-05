// Klipy — el mismo navegador de clips que Clipy, pero contra Kick.
//
// Comparte con Clipy toda la interfaz (src/components/clips): reproductor
// flotante, barra de filtros, rejilla, colecciones y bloqueo de streamers. Lo
// que cambia es de donde salen los datos y el color de acento.
//
// El color NO se cambia clase por clase: los componentes compartidos usan
// `twitch-base`, que Tailwind compila a var(--color-twitch-base). Basta con
// redefinir esa variable en la raiz de esta herramienta y todo el arbol pasa a
// verde Kick, sin tocar una sola linea de los componentes.
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { SearchState, TimeFilter, SortType, Category, Clip, SavedCollection } from '../../components/clips/types';
import { groupClipsByCategory, clipMatchesCategory, sumClipSeconds } from '../../components/clips/grouping';
import { clipMatchesKeywords, normalizeText } from '../../components/clips/keywords';
import { searchCategories, searchKickClips, searchAllKickClips, getClipById, getClipVideoSource, fetchKickSuggestions } from './services/kickService';
import { toCategory, toClip } from './services/adapt';
import { createTranslator, FLAGS, LANGUAGE_NAMES, type Language } from '../../locales/meta';
import { legalTranslations } from '../../locales/legal';
import SearchBar from '../../components/clips/SearchBar';
import FilterBar from '../../components/clips/FilterBar';
import ClipGrid, { type ClipGridHandle } from '../../components/clips/ClipGrid';
import CategoryGrid from '../../components/clips/CategoryGrid';
import FloatingPlayer from '../../components/clips/FloatingPlayer';
import LegalModal from './components/LegalModal';
import BlocklistManager from '../../components/clips/BlocklistManager';
import { Clapperboard, Archive, ChevronRight, ChevronLeft, ArrowLeft, X, Trash2, Heart, History, AlertTriangle, Undo, ArrowUp, CheckCircle2, Sparkles, PlusCircle, Loader2, Zap, CloudDownload, Layers, Mail, Info, Save, Pencil, FolderOpen, Download, Library, FileDown, ListPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { AdBanner } from '../../components/shared/AdBanner';
import {
  IconBlock, IconCollection, IconFilter, IconHandoff, IconPlayer, IconSearch,
  StepFilter, StepSearch, StepSend, StepWatch,
} from './components/Illustrations';
import { useReducedMotion, fadeInUp } from '../../components/shared/motion';

const STORAGE_KEY = 'klipy_saved_session';
const COLLECTIONS_KEY = 'klipy_saved_collections';
const ANCHOR_TIME_KEY = 'klipy_anchor_time';
const BLOCKED_STREAMERS_KEY = 'klipy_blocked_streamers';
const SORT_TYPE_KEY = 'klipy_sort_type';
const PERF_MODE_KEY = 'klipy_perf_mode';
const EXCLUDE_LANGUAGES_KEY = 'klipy_exclude_languages';
const ONLY_LANGUAGES_KEY = 'klipy_only_languages';
const PLAYBACK_SPEED_KEY = 'klipy_playback_speed';
const MAX_COLLECTIONS = 50;
const RENDER_PAGE_SIZE = 50;
const POPULAR_TAGS = [
  'Just Chatting', 'League of Legends', 'GTA V', 'Valorant', 'Counter-Strike 2',
  'Minecraft', 'Rust', 'Fortnite', 'Roblox', 'Call of Duty', 'Apex Legends',
  'DOTA 2', 'Overwatch 2', 'World of Warcraft', 'Hearthstone', 'Teamfight Tactics',
  'Dead by Daylight', 'Escape from Tarkov', 'Lost Ark', 'Elden Ring', 'Music', 'Art',
  'Retro', 'Talk Shows', 'Chess', 'ASMR', 'Genshin Impact', 'Rocket League',
  'The Sims 4', 'Dead Island 2', 'Street Fighter 6', 'Diablo IV', 'Resident Evil 4',
  'Starfield', "Baldur's Gate 3", 'Cyberpunk 2077', 'Helldivers 2',
];

interface KlipyProps {
  lang: Language;
  dictionary?: any;
}

export const Klipy: React.FC<KlipyProps> = ({ lang = 'en', dictionary }) => {
  // Memoizado a propósito: `t` viaja como prop hasta cada ClipCard, y ClipCard
  // está envuelto en React.memo. Si `t` cambiara de identidad en cada render,
  // la memoización no serviría de nada y se repintarían las 50-500 tarjetas
  // cada vez que cambia cualquier cosa del padre (toast, spinner, el crawl...).
  const t = useMemo(() => createTranslator(dictionary), [dictionary]);

  // La FAQ es un array de objetos: createTranslator convierte a String, asi que
  // t('faq') devolveria "[object Object],...". Se lee del diccionario directamente.
  const faqItems = useMemo(() => {
    const raw = (dictionary as any)?.faq;
    return Array.isArray(raw) ? raw : [];
  }, [dictionary]);
  const prefersReduced = useReducedMotion();

  const [state, setState] = useState<SearchState>({
    mode: 'categories',
    query: '',
    activeCategory: null,
    categories: [],
    clips: [],
    paginationCursor: null,
    categoriesCursor: null,
    timeFilter: TimeFilter.DAY,
    sortType: SortType.VIEWS,
    anchorTime: null,
    isLoading: true,
    error: null
  });

  const [playingClip, setPlayingClip] = useState<Clip | null>(null);
  const [savedClips, setSavedClips] = useState<Clip[]>([]);
  const [blockedStreamers, setBlockedStreamers] = useState<Record<string, { id: string; name: string; image?: string }[]>>({});
  const [isBlocklistOpen, setIsBlocklistOpen] = useState(false);
  const [streamerToBlock, setStreamerToBlock] = useState<{ id: string; name: string; image?: string } | null>(null);
  const [groupByChannel, setGroupByChannel] = useState(false);
  // Modo rendimiento: renderiza los clips en páginas de 50 en vez de todos a
  // la vez, para que las tarjetas (imágenes + animaciones hover) en categorías
  // masivas no dejen la pestaña pesada en PCs modestos. No afecta a cuántos
  // clips se han DESCARGADO/cargado en memoria, solo a cuántos se pintan.
  const [perfMode, setPerfMode] = useState(false);
  // Reflejado en cada render para que el crawl en curso (una función async ya
  // arrancada) pueda comprobar el valor MÁS RECIENTE de perfMode entre
  // peticiones, no el que tenía capturado por closure cuando arrancó.
  const perfModeRef = useRef(perfMode);
  useEffect(() => { perfModeRef.current = perfMode; }, [perfMode]);
  // Velocidad de reproducción del FloatingPlayer; preferencia general del
  // usuario (no por categoría), 2x por defecto.
  const [playbackSpeed, setPlaybackSpeed] = useState(2);
  const [renderPage, setRenderPage] = useState(0);
  // Evita que "Load all" repita el crawl completo (cientos de peticiones) si
  // ya se cargó todo para la categoría/filtro actual: la segunda pulsación
  // solo debe llevarte al final de la lista.
  const [allClipsLoaded, setAllClipsLoaded] = useState(false);
  // Mientras el crawl de "Load all" está en curso, state.clips cambia de
  // referencia muchas veces por segundo según van llegando franjas horarias.
  // Si en cada una de esas veces reordenamos toda la lista por vistas, lo que
  // ya se estaba viendo (p.ej. la página 1) cambia de contenido bajo los pies
  // de quien esté mirando. Con esto congelamos el orden (solo se van
  // añadiendo clips al final) hasta que el crawl termina, y ahí sí se aplica
  // el orden por vistas de una sola vez.
  const [isDeepCrawling, setIsDeepCrawling] = useState(false);
  // Filtros por idioma del clip (Twitch no da país/región, el idioma del
  // stream es lo más parecido disponible). Por categoría, igual que los
  // streamers ocultos: lo que eliges en Rust no debe aplicar en otra categoría.
  const [excludeLanguages, setExcludeLanguages] = useState<Record<string, string[]>>({});
  const [onlyLanguages, setOnlyLanguages] = useState<Record<string, string[]>>({});
  const [sessionActive, setSessionActive] = useState(false);
  const [deletedClipsStack, setDeletedClipsStack] = useState<Clip[]>([]);
  const [collections, setCollections] = useState<SavedCollection[]>([]);
  const [showHistoryMenu, setShowHistoryMenu] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [showSavedList, setShowSavedList] = useState(false);
  /** Clip cuyo selector de listas está abierto, y el nombre en el campo de "lista nueva". */
  const [listPickerClip, setListPickerClip] = useState<Clip | null>(null);
  const [newListName, setNewListName] = useState('');
  /** Panel de listas (distinto del historial) y qué lista está desplegada dentro. */
  const [showListsPanel, setShowListsPanel] = useState(false);
  const [expandedListId, setExpandedListId] = useState<string | null>(null);
  // Alcance por categoria de los paneles de guardados y de listas: dentro de
  // Rust no pintan los clips de Valorant. 'all' vuelve a ensenarlo todo,
  // repartido en secciones desplegables por categoria.
  const [categoryScope, setCategoryScope] = useState<'active' | 'all'>('active');
  const [expandedSavedCats, setExpandedSavedCats] = useState<string[]>([]);
  // Palabras que tiene que llevar el titulo del clip. No se guardan en disco ni
  // sobreviven al cambio de categoria: un "ace" olvidado de la sesion de ayer
  // te deja mirando una rejilla medio vacia sin entender por que.
  const [keywords, setKeywords] = useState<string[]>([]);
  const [creatingList, setCreatingList] = useState(false);
  const [triggerShake, setTriggerShake] = useState(false);
  const savedListRef = useRef<HTMLDivElement>(null);
  // Marca el final de la cuadrícula de clips (justo antes de los controles de
  // paginación), para que "Load all" baje hasta el último clip cargado en vez
  // de hasta el final real de la página (que incluye footer, SEO, etc.).
  const clipsEndRef = useRef<HTMLDivElement>(null);
  const clipGridRef = useRef<ClipGridHandle>(null);
  // Dónde se quedó el crawl por franjas horarias (searchAllTwitchClips) la
  // última vez que se pidió "un paso más" — para que la siguiente llamada
  // retome justo ahí en vez de volver a la franja más antigua cada vez.
  // Kick pagina por cursor hasta agotarlo, sin el tope de profundidad que
  // obligaba a Clipy a trocear la ventana en franjas horarias.
  const deepCrawlResumeRef = useRef<null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Legal State
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  const lastSearchId = useRef(0);
  const playingClipRef = useRef<Clip | null>(null);
  const modeRef = useRef<string>(state.mode);
  const categoriesRef = useRef<any[]>(state.categories);
  const handleSearchRef = useRef<any>(null);
  const prevMode = useRef<string>(state.mode);

  useEffect(() => {
    playingClipRef.current = playingClip;
    modeRef.current = state.mode;
    categoriesRef.current = state.categories;
  }, [playingClip, state.mode, state.categories]);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (sessionActive) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedClips));
    }
  }, [savedClips, sessionActive]);

  // Auto-restaura la lista de trabajo al entrar, para que no parezca que se perdió
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedClips(parsed);
          setSessionActive(true);
        }
      }
      const savedCollections = localStorage.getItem(COLLECTIONS_KEY);
      if (savedCollections) {
        const parsed = JSON.parse(savedCollections);
        if (Array.isArray(parsed)) setCollections(parsed);
      }
      const savedAnchorTime = localStorage.getItem(ANCHOR_TIME_KEY);
      if (savedAnchorTime) {
        let hours = 0;
        let minutes = 0;
        let isValid = false;

        if (/^\d{2}:\d{2}$/.test(savedAnchorTime)) {
          const [h, m] = savedAnchorTime.split(':').map(Number);
          hours = h;
          minutes = m;
          isValid = true;
        } else {
          // Intentar parsear como fecha completa (por si es heredado/antiguo)
          const parsedDate = new Date(savedAnchorTime);
          if (!isNaN(parsedDate.getTime())) {
            hours = parsedDate.getHours();
            minutes = parsedDate.getMinutes();
            isValid = true;
            // Guardar en el nuevo formato limpio HH:MM
            const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            localStorage.setItem(ANCHOR_TIME_KEY, formatted);
          }
        }

        if (isValid) {
          const now = new Date();
          now.setHours(hours, minutes, 0, 0);
          setState(prev => ({ ...prev, anchorTime: now.toISOString() }));
        }
      }
      const savedBlocked = localStorage.getItem(BLOCKED_STREAMERS_KEY);
      if (savedBlocked) {
        setBlockedStreamers(JSON.parse(savedBlocked));
      }
      const savedSort = localStorage.getItem(SORT_TYPE_KEY);
      if (savedSort && (savedSort === SortType.VIEWS || savedSort === SortType.TRENDING)) {
        setState(prev => ({ ...prev, sortType: savedSort as SortType }));
      }
      setPerfMode(localStorage.getItem(PERF_MODE_KEY) === '1');
      const savedSpeed = parseFloat(localStorage.getItem(PLAYBACK_SPEED_KEY) || '');
      if (!isNaN(savedSpeed) && savedSpeed > 0) setPlaybackSpeed(savedSpeed);
      const savedExclude = localStorage.getItem(EXCLUDE_LANGUAGES_KEY);
      if (savedExclude) {
        const parsed = JSON.parse(savedExclude);
        if (Array.isArray(parsed)) {
          // Migración desde el formato antiguo (lista global, no por categoría): se descarta,
          // ya que aplicarla a todas las categorías por igual sería el bug que se acaba de arreglar.
        } else if (parsed && typeof parsed === 'object') {
          setExcludeLanguages(parsed);
        }
      }
      const savedOnly = localStorage.getItem(ONLY_LANGUAGES_KEY);
      if (savedOnly) {
        const parsed = JSON.parse(savedOnly);
        if (Array.isArray(parsed)) {
          // Migración desde el formato antiguo (lista global, no por categoría): se descarta.
        } else if (parsed && typeof parsed === 'object') {
          setOnlyLanguages(parsed);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(BLOCKED_STREAMERS_KEY, JSON.stringify(blockedStreamers));
  }, [blockedStreamers]);

  useEffect(() => {
    localStorage.setItem(EXCLUDE_LANGUAGES_KEY, JSON.stringify(excludeLanguages));
  }, [excludeLanguages]);

  useEffect(() => {
    localStorage.setItem(ONLY_LANGUAGES_KEY, JSON.stringify(onlyLanguages));
  }, [onlyLanguages]);

  useEffect(() => {
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
  }, [collections]);

  // Snapshot automático por día: cada día en que se guarden clips queda como una sesión propia en el historial
  useEffect(() => {
    if (!sessionActive || savedClips.length === 0) return;
    const todayKey = new Date().toDateString();
    setCollections(prev => {
      const idx = prev.findIndex(c => c.auto && new Date(c.createdAt).toDateString() === todayKey);
      if (idx >= 0) {
        if (prev[idx].clips === savedClips) return prev;
        const updated = [...prev];
        updated[idx] = { ...updated[idx], clips: savedClips };
        return updated;
      }
      if (prev.length >= MAX_COLLECTIONS) return prev;
      const newCollection: SavedCollection = {
        id: crypto.randomUUID(),
        name: new Date().toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' }),
        createdAt: new Date().toISOString(),
        clips: savedClips,
        auto: true,
      };
      return [newCollection, ...prev];
    });
  }, [savedClips, sessionActive, lang]);

  const handleSaveCollection = (clips: Clip[], label?: string) => {
    if (clips.length === 0) return;
    if (collections.length >= MAX_COLLECTIONS) {
      showToast(t('collections_limit'), 'info');
      return;
    }
    const stamp = new Date().toLocaleString(lang);
    const newCollection: SavedCollection = {
      id: crypto.randomUUID(),
      // Con el panel acotado a una categoria, la coleccion guarda solo esa
      // parte: que lleve el nombre de la categoria delante evita acabar con
      // cinco entradas de la misma fecha y ninguna pista de que hay dentro.
      name: label ? `${label} - ${stamp}` : stamp,
      createdAt: new Date().toISOString(),
      clips,
    };
    setCollections(prev => [newCollection, ...prev]);
    showToast(t('collection_saved'));
  };

  /**
   * Crea una lista VACÍA con el nombre que escriba el usuario. Distinto de
   * handleSaveCollection, que congela la lista de trabajo actual con la fecha
   * como nombre: esto es un destino al que ir echando clips uno a uno.
   */
  const handleCreateList = useCallback((rawName: string): string | null => {
    const name = rawName.trim();
    if (!name) return null;
    const id = crypto.randomUUID();
    let created = false;
    setCollections(prev => {
      if (prev.length >= MAX_COLLECTIONS) return prev;
      created = true;
      return [{ id, name, createdAt: new Date().toISOString(), clips: [] }, ...prev];
    });
    if (!created) {
      showToast(t('collections_limit'), 'info');
      return null;
    }
    showToast(t('list_created'));
    return id;
  }, [t]);

  /** Mete o saca un clip de una lista con nombre, según ya esté o no. */
  const handleToggleClipInList = useCallback((clip: Clip, collectionId: string) => {
    setCollections(prev => prev.map(c => {
      if (c.id !== collectionId) return c;
      const has = c.clips.some(x => x.id === clip.id);
      return { ...c, clips: has ? c.clips.filter(x => x.id !== clip.id) : [...c.clips, withCategoryRef.current(clip)] };
    }));
  }, []);

  const handleLoadCollection = (collectionId: string) => {
    const collection = collections.find(c => c.id === collectionId);
    if (!collection) return;
    setSavedClips(prev => {
      const currentIds = new Set(prev.map(c => c.id));
      const newUnique = collection.clips.filter(c => !currentIds.has(c.id));
      return [...prev, ...newUnique];
    });
    setSessionActive(true);
    showToast(t('collection_loaded'));
  };

  const handleDeleteCollection = (collectionId: string) => {
    setCollections(prev => prev.filter(c => c.id !== collectionId));
    showToast(t('collection_deleted'), 'info');
  };

  const handleDeleteAllCollections = () => {
    setCollections([]);
    showToast(t('collections_deleted_all'), 'info');
  };

  const handleStartRename = (e: React.MouseEvent, collection: SavedCollection) => {
    e.stopPropagation();
    setRenamingId(collection.id);
    setRenameValue(collection.name);
  };

  const handleCommitRename = (collectionId: string) => {
    setCollections(prev => prev.map(c => c.id === collectionId ? { ...c, name: renameValue.trim() || c.name } : c));
    setRenamingId(null);
  };

  const handleDownloadCollectionTxt = (e: React.MouseEvent, collection: SavedCollection) => {
    e.stopPropagation();
    downloadClipsTxt(collection.clips, collection.name);
  };

  /**
   * La categoria que se esta mirando ahora mismo, en un ref: withCategory viaja
   * como dependencia hasta cada ClipCard memoizada, y si cambiara de identidad
   * al cambiar de categoria invalidaria toda la rejilla.
   */
  const activeCategoryRef = useRef<Category | null>(null);
  useEffect(() => { activeCategoryRef.current = state.activeCategory; }, [state.activeCategory]);

  useEffect(() => { setKeywords([]); }, [state.activeCategory?.id]);

  /**
   * Sella el clip con la categoria desde la que se guarda. Ni Kick ni Twitch la
   * devuelven dentro del clip, asi que la unica forma de saberla es mirar donde
   * estaba el usuario en ese momento. Los que ya la traen (los que vuelven de
   * una lista o de una coleccion) se dejan como estan.
   */
  const withCategory = useCallback((clip: Clip): Clip => {
    if (clip.category_name) return clip;
    const cat = activeCategoryRef.current;
    if (!cat) return clip;
    return { ...clip, category_id: cat.id, category_name: cat.name };
  }, []);
  const withCategoryRef = useRef(withCategory);
  withCategoryRef.current = withCategory;

  const handleToggleSave = useCallback((clip: Clip) => {
    setSavedClips(prev => {
      const exists = prev.find(c => c.id === clip.id);
      let newClips;
      if (exists) {
        newClips = prev.filter(c => c.id !== clip.id);
      } else {
        setTriggerShake(true);
        setTimeout(() => setTriggerShake(false), 500);
        newClips = [...prev, withCategory(clip)];
      }
      return newClips;
    });
    setSessionActive(true);
  }, [t, withCategory]);

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

  // Que se lleva por delante el "borrar todo": con el panel acotado a una
  // categoria, solo esa; con el panel entero, todo. Va en un ref porque la
  // confirmacion ocurre en otro render, ya con el modal abierto.
  const deleteTargetRef = useRef<Clip[] | null>(null);

  const requestDeleteAll = (e: React.MouseEvent, clips: Clip[]) => {
    e.stopPropagation();
    deleteTargetRef.current = clips;
    setShowDeleteModal(true);
  };

  const confirmDeleteAll = () => {
    const target = deleteTargetRef.current;
    if (target && target.length > 0 && target.length < savedClips.length) {
      const ids = new Set(target.map(c => c.id));
      setSavedClips(prev => prev.filter(c => !ids.has(c.id)));
    } else {
      setSavedClips([]);
      setDeletedClipsStack([]);
    }
    deleteTargetRef.current = null;
    setSessionActive(true);
    setShowDeleteModal(false);
    setShowSavedList(false);
    showToast(t('delete_confirm'), 'info');
  };

  /**
   * Un .txt con los enlaces de los clips que se le pasen. Lo usan la descarga
   * del panel entero, la de una categoria suelta y la de cada lista, que solo
   * se diferencian en que subconjunto le dan.
   */
  const downloadClipsTxt = useCallback((clips: Clip[], filename: string) => {
    if (clips.length === 0) return;
    const content = clips.map(c => c.url).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'clips'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revocado con retardo, no en el mismo tick que el click: Safari cancela la
    // descarga en curso cuando la object URL desaparece bajo sus pies.
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, []);

  const openExternalDownload = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (err) {
      console.error("Clipboard copy failed", err);
    }

    // Optimizamos enviando por LocalStorage para evitar límites de URL
    localStorage.setItem('kickbolt_shared_clips', content);

    const targetUrl = new URL(`/${lang.toLowerCase()}/kickbolt`, window.location.origin);
    // Mantenemos una versión corta en URL para compatibilidad y trigger rápido
    if (content.length < 1500) {
      targetUrl.searchParams.set('clips', content);
    }
    window.open(targetUrl.toString(), '_blank');
  }, [lang]);

  const handleExternalZip = async (clips: Clip[]) => {
    if (clips.length === 0) return;
    const content = clips.map(c => c.url).join('\n');
    openExternalDownload(content);
    setShowSavedList(false);
  };

  const handleSendCollectionExternal = (e: React.MouseEvent, collection: SavedCollection) => {
    e.stopPropagation();
    const content = collection.clips.map(c => c.url).join('\n');
    openExternalDownload(content);
  };

  const handleScrollToClip = (clipId: string) => {
    setShowSavedList(false);
    clipGridRef.current?.scrollToClip(clipId);
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

  // Reset scroll to top ONLY when entering clips mode or changing category
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (state.mode === 'clips' && prevMode.current !== 'clips') {
        window.scrollTo(0, 0);
      }
    }
    prevMode.current = state.mode;
  }, [state.mode, state.activeCategory]);

  // Background Avatar Loader: Carga las fotos de perfil en segundo plano sin bloquear la UI.
  // Se salta por completo mientras isDeepCrawling (igual que el orden de
  // visibleClips): los clips que van llegando durante el barrido de "Load
  // all" aún no son visibles (están en páginas por delante de la actual), así
  // que no hace falta pedir su avatar todavía — y si lo hiciéramos, serían
  // Kick devuelve el avatar del canal dentro de cada clip, asi que no hace
  // falta la segunda ronda de peticiones que Clipy necesita para Twitch.

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = useCallback(async (query: string) => {
    // kick.com/<canal>?clip=<id> y kick.com/<canal>/clips/<id>
    const isClipUrl = /[?&]clip=|\/clips\//.test(query);
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
      paginationCursor: null,
      categoriesCursor: null
    }));

    try {
      if (typeof window !== 'undefined') {
        const historyState = { view: isClipUrl ? 'clips' : 'categories', query };
        if (query === 'popular' && !window.history.state) {
          window.history.replaceState(historyState, '');
        } else {
          window.history.pushState(historyState, '');
        }
      }

      if (isClipUrl) {
        const clipIdMatch = query.match(/[?&]clip=([A-Za-z0-9_-]+)/) || query.match(/\/clips\/([A-Za-z0-9_-]+)/);
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

          const clip = await getClipById(clipId);
          if (searchId !== lastSearchId.current) return;
          if (clip) {
            setState(prev => ({ ...prev, clips: [toClip(clip)], isLoading: false }));
            return;
          }
        }
        throw new Error("Invalid Clip Link");
      }

      const categories = (await searchCategories(query)).map(toCategory);
      const cursor = null;
      if (searchId !== lastSearchId.current) return;
      setState(prev => ({ ...prev, categories, categoriesCursor: cursor, isLoading: false }));
    } catch (error: any) {
      if (searchId !== lastSearchId.current) return;
      setState(prev => ({ ...prev, error: isClipUrl ? t('error_clips') : t('error_categories'), isLoading: false }));
    }
  }, [t]);

  const loadMoreCategories = useCallback(async () => {
    if (state.isLoading || !state.categoriesCursor || state.mode !== 'categories') return;
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      // Kick devuelve el catalogo de una vez: no hay segunda pagina que pedir.
      const newCats: Category[] = [];
      const nextCursor = null;
      setState(prev => ({
        ...prev,
        categories: [...prev.categories, ...newCats],
        categoriesCursor: nextCursor,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.isLoading, state.categoriesCursor, state.query, state.mode]);

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
    setRenderPage(0);
    setAllClipsLoaded(false);
    deepCrawlResumeRef.current = null;

    if (typeof window !== 'undefined') {
      window.history.pushState({ view: 'clips' }, '');
    }

    try {
      // category.id es el slug DERIVADO del nombre. Acierta en dos de cada tres
      // categorias; para el resto ("Tibia" es "Tibia", "Grand Theft Auto V (GTA)"
      // es "grand-theft-auto-v") hace falta el nombre para preguntarle a Kick
      // cual es el slug de verdad, asi que se pasa siempre.
      const page = await searchKickClips(category.id, time, null, category.name);
      const clips = page.clips.map(toClip);
      const cursor = page.cursor;
      // Evitar duplicados por id
      const uniqueClips: Clip[] = [];
      const seen = new Set<string>();
      for (const clip of clips) {
        if (!seen.has(clip.id)) {
          seen.add(clip.id);
          uniqueClips.push(clip);
        }
      }
      setState(prev => ({
        ...prev,
        clips: uniqueClips,
        paginationCursor: cursor,
        isLoading: false
      }));
    } catch (error: any) {
      setState(prev => ({ ...prev, error: t('error_clips'), isLoading: false }));
    }
  }, [t, handleSearch, state.anchorTime]);

  const loadMoreClips = useCallback(async () => {
    if (state.isLoading || !state.paginationCursor || !state.activeCategory) return;
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const nextPage = await searchKickClips(
        state.activeCategory.id,
        state.timeFilter,
        state.paginationCursor,
        state.activeCategory.name,
      );
      const newClips = nextPage.clips.map(toClip);
      const nextCursor = nextPage.cursor;
      setState(prev => {
        const mergedClips = [...prev.clips, ...newClips];
        const uniqueClips: Clip[] = [];
        const seen = new Set<string>();
        for (const clip of mergedClips) {
          if (!seen.has(clip.id)) {
            seen.add(clip.id);
            uniqueClips.push(clip);
          }
        }
        return {
          ...prev,
          clips: uniqueClips,
          paginationCursor: nextCursor,
          isLoading: false
        };
      });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.isLoading, state.paginationCursor, state.activeCategory, state.timeFilter, state.anchorTime]);

  // Solo baja la página al final del scroll — NO cambia de página en modo
  // rendimiento. Saltar de página de golpe (a la vez que el contenido de esa
  // página cambiaba) se sentía como un bug: mejor quedarse donde estás y ver
  // el final de lo ya cargado; para ver la cola (vistas más bajas) usan
  // "Siguiente" con normalidad.
  const jumpToLoadedEnd = useCallback(() => {
    // Pequeño delay: el último render (con todas las tarjetas ya añadidas)
    // todavía no ha pintado cuando se llama a esto, así que hacer scroll en
    // el mismo tick apunta a una posición vieja y se queda corto o se
    // cancela a medio camino. Al marcador tras la cuadrícula, no al final de
    // toda la página (que sigue con footer, SEO, etc.).
    setTimeout(() => {
      clipsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  }, []);

  const loadAllClips = useCallback(async (opts?: { silent?: boolean; cancelIfPerfModeOff?: boolean }) => {
    if (state.isLoading || !state.activeCategory) return;
    const silent = opts?.silent === true;
    // Solo la carga automática (en segundo plano, ligada a que el modo
    // rendimiento siga activo) se para a medio camino si se desactiva; un
    // "Load all" pulsado a mano siempre termina, esté o no el modo activado.
    const shouldContinue = opts?.cancelIfPerfModeOff ? () => perfModeRef.current : undefined;

    // Ya se hizo el crawl completo para esta categoría/filtro: no repetirlo
    // (serían cientos de peticiones de nuevo solo para no encontrar nada
    // nuevo), solo llevar a la persona al final de lo que ya está cargado.
    if (allClipsLoaded) {
      if (!silent) jumpToLoadedEnd();
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));
    setIsDeepCrawling(true);

    // Twitch's single-query cursor silently stops around ~1000 clips even
    // when far more exist for the selected window — it looks identical to
    // "that's really all of them," which is what was hiding the long tail of
    // 1-view clips. searchAllTwitchClips works around it by querying narrower
    // time slices independently, so it doesn't rely on state.paginationCursor
    // at all; it always does a full crawl of the whole window.
    const seen = new Set(state.clips.map(c => c.id));
    let allLoadedClips: Clip[] = [...state.clips];

    try {
      const { completed } = await searchAllKickClips(
        state.activeCategory.id,
        state.timeFilter,
        (items) => {
          const newClips = items.map(toClip);
          let changed = false;
          for (const clip of newClips) {
            if (!seen.has(clip.id)) {
              seen.add(clip.id);
              allLoadedClips.push(clip);
              changed = true;
            }
          }
          if (changed) {
            const snapshot = [...allLoadedClips];
            setState(prev => ({ ...prev, clips: snapshot }));
          }
        },
        shouldContinue,
        undefined,
        state.activeCategory.name,
      );
      if (completed) {
        setState(prev => ({ ...prev, isLoading: false, paginationCursor: null }));
        setAllClipsLoaded(true);
        if (!silent) jumpToLoadedEnd();
      } else {
        // Se paró a medio camino (modo rendimiento desactivado durante la
        // carga automática): se queda tal cual, sin marcarlo como completo.
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      // Keep whatever was loaded before the failure; only stop the spinner.
      setState(prev => ({ ...prev, isLoading: false }));
    } finally {
      setIsDeepCrawling(false);
    }
  }, [state.isLoading, state.activeCategory, state.timeFilter, state.anchorTime, state.clips, allClipsLoaded, jumpToLoadedEnd]);

  // Igual que loadAllClips pero se para después de UNA página (~100 clips o
  // menos) del crawl por franjas horarias, en vez de recorrerlo entero de
  // golpe — así el scroll incremental sigue sintiéndose "poco a poco" en vez
  // de disparar una carga masiva la primera vez que el cursor simple se agota.
  // Retoma desde donde se quedó la vez anterior (deepCrawlResumeRef) para no
  // volver a pedir las franjas ya recorridas.
  const loadNextChunk = useCallback(async () => {
    if (state.isLoading || !state.activeCategory || allClipsLoaded) return;
    setState(prev => ({ ...prev, isLoading: true }));

    const seen = new Set(state.clips.map(c => c.id));
    let mergedClips: Clip[] = [...state.clips];

    try {
      const { completed } = await searchAllKickClips(
        state.activeCategory.id,
        state.timeFilter,
        (items) => {
          const newClips = items.map(toClip);
          for (const clip of newClips) {
            if (!seen.has(clip.id)) {
              seen.add(clip.id);
              mergedClips.push(clip);
            }
          }
        },
        undefined,
        1,
        state.activeCategory.name,
      );
      setState(prev => ({ ...prev, clips: [...mergedClips], isLoading: false }));
      if (completed) {
        deepCrawlResumeRef.current = null;
        setAllClipsLoaded(true);
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.isLoading, state.activeCategory, state.timeFilter, state.anchorTime, state.clips, allClipsLoaded]);

  // El cursor simple de Twitch (loadMoreClips) se trunca solo a ~1000 clips
  // aunque existan muchos más — así que cuando se agota, en vez de darlo por
  // terminado, seguimos pidiendo un paso más del crawl por franjas horarias
  // (loadNextChunk) cada vez que el usuario sigue haciendo scroll o pulsa
  // "Cargar más" otra vez, en vez de traerlo todo de golpe.
  const handleScrollLoadMore = useCallback(() => {
    if (state.paginationCursor) {
      loadMoreClips();
    } else if (!allClipsLoaded) {
      loadNextChunk();
    }
  }, [state.paginationCursor, allClipsLoaded, loadMoreClips, loadNextChunk]);

  useEffect(() => {
    handleSearch("popular");
  }, []);

  const handleCategoryClick = (category: Category) => { loadClipsForCategory(category, state.timeFilter); };
  const handleFilterChange = (filter: TimeFilter) => {
    setState(prev => ({ ...prev, timeFilter: filter }));
    if (state.activeCategory) loadClipsForCategory(state.activeCategory, filter);
  };
  const handleAnchorChange = (value: string | null) => {
    setState(prev => ({ ...prev, anchorTime: value }));
    if (value) {
      const date = new Date(value);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      localStorage.setItem(ANCHOR_TIME_KEY, `${hours}:${minutes}`);
    } else {
      localStorage.removeItem(ANCHOR_TIME_KEY);
    }
    if (state.activeCategory) {
      setState(prev => ({ ...prev, isLoading: true, clips: [], paginationCursor: null }));
      setRenderPage(0);
      setAllClipsLoaded(false);
      deepCrawlResumeRef.current = null;
      searchKickClips(state.activeCategory.id, state.timeFilter, null, state.activeCategory.name)
        .then(({ clips, cursor }) => {
          setState(prev => ({ ...prev, clips: clips.map(toClip), paginationCursor: cursor, isLoading: false }));
        })
        .catch(() => {
          setState(prev => ({ ...prev, error: t('error_clips'), isLoading: false }));
        });
    }
  };
  const handleSortChange = (sort: SortType) => {
    setState(prev => ({ ...prev, sortType: sort }));
    localStorage.setItem(SORT_TYPE_KEY, sort);
    if (state.activeCategory) loadClipsForCategory(state.activeCategory, state.timeFilter);
  };

  const handlePerfModeChange = (val: boolean) => {
    setPerfMode(val);
    setRenderPage(0);
    localStorage.setItem(PERF_MODE_KEY, val ? '1' : '0');
  };

  const handlePlaybackSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    localStorage.setItem(PLAYBACK_SPEED_KEY, String(speed));
  };

  const handleExcludeLanguagesChange = (codes: string[]) => {
    const categoryId = state.activeCategory?.id || '';
    if (!categoryId) return;
    setExcludeLanguages(prev => ({ ...prev, [categoryId]: codes }));
  };

  const handleOnlyLanguagesChange = (codes: string[]) => {
    const categoryId = state.activeCategory?.id || '';
    if (!categoryId) return;
    setOnlyLanguages(prev => ({ ...prev, [categoryId]: codes }));
  };

  const confirmBlockStreamer = () => {
    if (!streamerToBlock) return;
    const { id, name, image } = streamerToBlock;
    const categoryId = state.activeCategory?.id || '';
    if (!categoryId) return;

    setBlockedStreamers(prev => {
      const currentList = prev[categoryId] || [];
      if (currentList.some(s => s.id === id)) return prev;
      const updatedList = [...currentList, { id, name, image }];
      return { ...prev, [categoryId]: updatedList };
    });

    if (playingClipRef.current && playingClipRef.current.broadcaster_id === id) {
      setPlayingClip(null);
    }

    showToast(`${t('blocked') || 'Ocultado'}: ${name}`);
  };

  const handleBlockStreamer = useCallback((id: string, name: string, image?: string) => {
    setStreamerToBlock({ id, name, image });
  }, []);

  const handleUnblockStreamer = (id: string) => {
    const categoryId = state.activeCategory?.id || '';
    if (!categoryId) return;

    setBlockedStreamers(prev => {
      const currentList = prev[categoryId] || [];
      const updatedList = currentList.filter(s => s.id !== id);
      return { ...prev, [categoryId]: updatedList };
    });
  };

  const handleClearBlocklist = () => {
    const categoryId = state.activeCategory?.id || '';
    if (!categoryId) return;

    setBlockedStreamers(prev => {
      return { ...prev, [categoryId]: [] };
    });
    
    showToast(t('collections_deleted_all') || 'Lista de streamers vaciada');
  };
  useEffect(() => {
    handleSearchRef.current = handleSearch;
  }, [handleSearch]);

  const goBackToCategories = useCallback(() => {
    handleSearch("popular");
    setPlayingClip(null);
  }, [handleSearch]);

  // Manejo del botón "Atrás" del navegador/ratón
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const newState = event.state;
      
      // Si hay un clip reproduciéndose, lo cerramos
      if (playingClipRef.current) {
        setPlayingClip(null);
        playingClipRef.current = null; // Actualizamos el ref inmediatamente
      }
      
      // Si estamos en modo clips y el usuario pulsa atrás
      if (modeRef.current === 'clips') {
        // Si el estado es nulo o de otro tipo (ej. categories), volvemos a categorías
        const isLandingOnClips = newState && newState.view === 'clips';
        
        if (!isLandingOnClips) {
          if (categoriesRef.current.length > 0) {
            setState(prev => ({ ...prev, mode: 'categories', activeCategory: null }));
          } else if (handleSearchRef.current) {
            handleSearchRef.current("popular");
          }
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLogoClick = () => {
    handleSearch("popular");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isTopPopularMode = state.query === 'popular' || !state.query.trim();

  const formatTotalDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const categoryId = state.activeCategory?.id || '';
  const activeBlockedList = blockedStreamers[categoryId] || [];
  const blockedCount = activeBlockedList.length;
  const activeExcludeLanguages = excludeLanguages[categoryId] || [];
  const activeOnlyLanguages = onlyLanguages[categoryId] || [];

  // Ambos van como prop a ClipGrid y de ahí a cada ClipCard memoizada. Sin
  // memoizar aquí, el Set se reconstruía entero (O(n) sobre los guardados) en
  // cada render del padre y su nueva identidad invalidaba todas las tarjetas.
  const savedClipIds = useMemo(() => new Set(savedClips.map(c => c.id)), [savedClips]);
  const handleClipClick = useCallback((clip: Clip) => setPlayingClip(clip), []);
  const handleOpenListPicker = useCallback((clip: Clip) => {
    setNewListName('');
    setListPickerClip(clip);
  }, []);

  // El historial y las listas son cosas distintas y comparten almacén: las
  // instantáneas diarias llevan `auto: true` y solo salen en el historial; las
  // que crea el usuario a mano son las listas. Así el panel de listas nunca se
  // llena solo de entradas con fecha que nadie ha pedido.
  const userLists = useMemo(() => collections.filter(c => !c.auto), [collections]);
  const autoHistory = useMemo(() => collections.filter(c => c.auto), [collections]);

  // ---- Reparto por categoria de guardados y listas -----------------------
  // Estando dentro de una categoria los paneles se acotan a ella; fuera (o
  // pulsando "todas") se ensena todo repartido en secciones desplegables.
  const categoryScoped = categoryScope === 'active' && !!state.activeCategory;

  const savedInActiveCategory = useMemo(() => {
    const cat = state.activeCategory;
    if (!cat) return [];
    return savedClips.filter(c => clipMatchesCategory(c, cat.id, cat.name));
  }, [savedClips, state.activeCategory]);

  const visibleSavedClips = categoryScoped ? savedInActiveCategory : savedClips;
  const savedGroups = useMemo(() => groupClipsByCategory(savedClips), [savedClips]);
  const visibleSeconds = sumClipSeconds(visibleSavedClips);
  const scopeLabel = categoryScoped && state.activeCategory ? state.activeCategory.name : '';

  // Cada lista con los clips que le tocan segun el alcance. Acotado, las listas
  // que no tienen nada de esta categoria desaparecen en vez de salir vacias.
  const visibleLists = useMemo(() => {
    const cat = state.activeCategory;
    if (!categoryScoped || !cat) return userLists.map(list => ({ list, clips: list.clips }));
    return userLists
      .map(list => ({ list, clips: list.clips.filter(c => clipMatchesCategory(c, cat.id, cat.name)) }))
      .filter(entry => entry.clips.length > 0);
  }, [userLists, categoryScoped, state.activeCategory]);

  // Cuenta de la pestana de la categoria en el panel de listas: siempre la de
  // la categoria abierta, este acotado o no. Sacandola de visibleLists, al
  // pulsar "todas" la pestana de al lado se ponia a contar tambien lo que no
  // era suyo.
  const listedInActiveCategory = useMemo(() => {
    const cat = state.activeCategory;
    if (!cat) return 0;
    return userLists.reduce((acc, list) => acc + list.clips.filter(c => clipMatchesCategory(c, cat.id, cat.name)).length, 0);
  }, [userLists, state.activeCategory]);

  const toggleSavedCat = useCallback((key: string) => {
    setExpandedSavedCats(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }, []);

  const renderSavedClip = (clip: Clip) => (
    <div key={clip.id} onClick={() => handleScrollToClip(clip.id)} className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl p-3 flex gap-4 group transition-all cursor-pointer">
      <div className="w-16 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-black border border-white/10"><img src={clip.thumbnail_url} alt={clip.title} className="w-full h-full object-cover" /></div>
      <div className="flex-grow min-w-0 flex flex-col justify-center">
        <div className="text-xs font-black text-gray-100 truncate tracking-tight">{clip.title}</div>
        <div className="text-[10px] font-bold text-gray-500">{t('duration')}: {clip.duration}</div>
      </div>
      {/* Desde aqui tambien se puede archivar en una lista con nombre: si el
          clip ya no esta en la rejilla (otra categoria, otro filtro), este es
          el unico sitio desde donde se puede rescatar. */}
      <button
        onClick={(e) => { e.stopPropagation(); handleOpenListPicker(clip); }}
        className="p-2 text-gray-500 hover:text-twitch-base rounded-xl hover:bg-twitch-base/10 cursor-pointer"
        title={t('add_to_lists')}
      >
        <ListPlus className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); openExternalDownload(clip.url); }}
        className="p-2 text-gray-500 hover:text-twitch-base rounded-xl hover:bg-twitch-base/10 cursor-pointer"
        title={t('download') || 'Descargar'}
      >
        <Download className="w-4 h-4" />
      </button>
      <button onClick={(e) => handleDeleteClip(e, clip.id)} className="p-2 text-gray-500 hover:text-red-500 rounded-xl hover:bg-red-500/10 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
    </div>
  );

  const renderListClip = (clip: Clip, listId: string) => (
    <div key={clip.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group">
      <button onClick={() => { setPlayingClip(clip); setShowListsPanel(false); }} className="flex items-center gap-3 flex-grow min-w-0 text-left cursor-pointer">
        <img src={clip.thumbnail_url} alt="" loading="lazy" decoding="async" className="w-20 aspect-video object-cover rounded-lg flex-shrink-0 bg-black/40" />
        <span className="flex flex-col min-w-0">
          <span className="text-xs font-black text-gray-200 truncate">{clip.title}</span>
          <span className="text-[10px] font-bold text-gray-500 truncate">{clip.broadcaster_name}</span>
        </span>
      </button>
      <button
        onClick={() => openExternalDownload(clip.url)}
        title={t('download_zip_web')}
        className="flex-shrink-0 p-2 rounded-lg text-gray-600 hover:text-twitch-base hover:bg-twitch-base/10 transition-colors cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => handleToggleClipInList(clip, listId)}
        title={t('delete')}
        className="flex-shrink-0 p-2 rounded-lg text-gray-600 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  /** Los dos paneles llevan el mismo par de pestanas, asi que se pinta una vez. */
  const renderScopeTabs = (activeCount: number, allCount: number) => {
    if (!state.activeCategory) return null;
    const tab = 'flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer border';
    const on = 'bg-twitch-base/15 border-twitch-base/40 text-twitch-base';
    const off = 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10';
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setCategoryScope('active')} className={`${tab} ${categoryScoped ? on : off}`}>
          <span className="truncate max-w-[10rem] normal-case tracking-tight text-[11px]">{state.activeCategory.name}</span>
          <span className="tabular-nums opacity-70">{activeCount}</span>
        </button>
        <button onClick={() => setCategoryScope('all')} className={`${tab} ${categoryScoped ? off : on}`}>
          <span>{t('all_categories')}</span>
          <span className="tabular-nums opacity-70">{allCount}</span>
        </button>
      </div>
    );
  };

  // Normalizadas una vez, no una por clip: el filtro corre sobre miles de
  // titulos cada vez que llega una pagina del barrido.
  const keywordNeedles = useMemo(
    () => keywords.map(normalizeText).map(w => w.trim()).filter(Boolean),
    [keywords],
  );

  const visibleClips = useMemo(() => {
    const blockedIds = new Set(activeBlockedList.map(s => s.id));
    const onlySet = activeOnlyLanguages.length > 0 ? new Set(activeOnlyLanguages) : null;
    const excludeSet = activeExcludeLanguages.length > 0 ? new Set(activeExcludeLanguages) : null;
    let filtered = state.clips.filter(clip => {
      if (blockedIds.has(clip.broadcaster_id)) return false;
      if (onlySet && !onlySet.has(clip.language || '')) return false;
      if (excludeSet && excludeSet.has(clip.language || '')) return false;
      if (!clipMatchesKeywords(clip, keywordNeedles)) return false;
      return true;
    });

    // Twitch's clips endpoint has no server-side sort, and each page/slice we
    // fetch is only sorted within itself — so once results from multiple
    // pages or time slices are merged, "most views" only holds true if we
    // sort the merged list ourselves. But NOT while isDeepCrawling: re-sorting
    // on every one of the dozens of updates a "Load all" crawl produces would
    // reshuffle whatever page you're currently looking at out from under you.
    // Keep arrival order until the crawl settles, then sort once.
    if (state.sortType === SortType.VIEWS && !isDeepCrawling) {
      filtered = [...filtered].sort((a, b) => b.view_count - a.view_count);
    }

    if (!groupByChannel) return filtered;
    
    const groups: Record<string, Clip[]> = {};
    for (const clip of filtered) {
      const channelId = clip.broadcaster_id || clip.broadcaster_name;
      if (!groups[channelId]) {
        groups[channelId] = [];
      }
      groups[channelId].push(clip);
    }
    
    for (const channelId in groups) {
      groups[channelId].sort((a, b) => b.view_count - a.view_count);
    }
    
    const sortedChannelIds = Object.keys(groups).sort((a, b) => {
      const maxViewsA = groups[a][0]?.view_count || 0;
      const maxViewsB = groups[b][0]?.view_count || 0;
      return maxViewsB - maxViewsA;
    });
    
    const grouped: Clip[] = [];
    for (const channelId of sortedChannelIds) {
      grouped.push(...groups[channelId]);
    }
    return grouped;
  }, [state.clips, activeBlockedList, groupByChannel, state.sortType, isDeepCrawling, activeOnlyLanguages, activeExcludeLanguages, keywordNeedles]);

  const totalRenderPages = Math.max(1, Math.ceil(visibleClips.length / RENDER_PAGE_SIZE));

  // Si el filtrado (bloqueados, cambio de categoría...) deja la lista más
  // corta que la página en la que estábamos, volvemos a una página válida.
  useEffect(() => {
    setRenderPage(p => Math.min(p, totalRenderPages - 1));
  }, [totalRenderPages]);

  const pagedClips = useMemo(() => {
    if (!perfMode) return visibleClips;
    const start = renderPage * RENDER_PAGE_SIZE;
    return visibleClips.slice(start, start + RENDER_PAGE_SIZE);
  }, [visibleClips, perfMode, renderPage]);

  const goToRenderPage = useCallback(async (target: number) => {
    const clamped = Math.max(0, target);
    const needed = (clamped + 1) * RENDER_PAGE_SIZE;
    const shortfall = needed - state.clips.length;
    if (shortfall > 0 && !state.isLoading) {
      // Salto grande (p.ej. escribiendo un número de página bastante más
      // adelante de lo ya cargado) o el cursor simple ya se acabó: una sola
      // llamada a loadMoreClips (~100 clips) no llegaría, así que directamente
      // lanzamos el crawl completo en vez de dejar huecos a mitad de camino.
      // El cursor simple de Twitch además se corta antes de tiempo en
      // categorías muy activas aunque queden muchos más clips.
      if (!state.paginationCursor || shortfall > RENDER_PAGE_SIZE * 2) {
        if (!allClipsLoaded) await loadAllClips({ silent: true });
      } else {
        await loadMoreClips();
      }
    }
    setRenderPage(clamped);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state.clips.length, state.paginationCursor, state.isLoading, loadMoreClips, allClipsLoaded, loadAllClips]);

  const isLastRenderPage = renderPage >= totalRenderPages - 1 && !state.paginationCursor && allClipsLoaded;

  // Input para ir directo a una página escribiendo el número. Sin controlar
  // el <input> por estado (key={renderPage} lo remonta cuando la página
  // cambia por otra vía, p.ej. flechas) para no pelearnos con lo que la
  // persona esté escribiendo en cada tecleo.
  const inlinePageInputRef = useRef<HTMLInputElement>(null);
  const floatingPageInputRef = useRef<HTMLInputElement>(null);
  const commitPageInput = useCallback((inputEl: HTMLInputElement | null) => {
    if (!inputEl) return;
    const val = parseInt(inputEl.value, 10);
    if (!isNaN(val) && val >= 1) {
      goToRenderPage(val - 1);
    } else {
      inputEl.value = String(renderPage + 1);
    }
  }, [goToRenderPage, renderPage]);

  // Atajos de teclado (solo con el modo rendimiento activo, que es cuando hay
  // páginas reales que recorrer): flecha derecha/izquierda avanza/retrocede.
  // Se ignoran si el foco está en un campo de texto (buscador, renombrar
  // colección, selector de fecha...) para no interceptar la escritura normal.
  useEffect(() => {
    if (!perfMode || state.mode !== 'clips' || totalRenderPages <= 1) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isTyping) return;

      if (e.key === 'ArrowRight' && !isLastRenderPage) {
        e.preventDefault();
        goToRenderPage(renderPage + 1);
      } else if (e.key === 'ArrowLeft' && renderPage > 0) {
        e.preventDefault();
        goToRenderPage(renderPage - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [perfMode, state.mode, totalRenderPages, renderPage, isLastRenderPage, goToRenderPage]);

  // En modo rendimiento ya no se piden más clips al hacer scroll (con solo 50
  // tarjetas montadas se llega al final casi al instante, así que ese
  // disparador quedaba raro) — en cuanto entra la primera página, lanzamos el
  // barrido completo en segundo plano ("silent": sin saltar el scroll al
  // final). cancelIfPerfModeOff: si se desactiva el modo rendimiento a medio
  // barrido, se para ahí — no tiene sentido seguir cargándolo todo si ya no
  // estás en modo rendimiento (que es justo lo que se quería evitar al
  // activarlo: cargar de más sin necesidad).
  useEffect(() => {
    if (!perfMode || state.mode !== 'clips' || !state.activeCategory) return;
    if (state.clips.length === 0 || state.isLoading || allClipsLoaded) return;
    loadAllClips({ silent: true, cancelIfPerfModeOff: true });
  }, [perfMode, state.mode, state.activeCategory, state.clips.length, state.isLoading, allClipsLoaded, loadAllClips]);

  return (
    /* El verde de Kick entra por aqui y solo por aqui: los componentes
       compartidos pintan con `twitch-base`, que Tailwind compila a
       var(--color-twitch-base). Redefinirla en la raiz tine todo el arbol sin
       tocar una linea de esos componentes. */
    <div
      className="min-h-screen flex flex-col relative"
      style={{
        ['--color-twitch' as any]: '#53fc18',
        ['--color-twitch-base' as any]: '#53fc18',
        ['--color-twitch-dark' as any]: '#3fd40f',
        // Sobre el verde de Kick el texto blanco da 1,37:1 y es ilegible; este
        // casi negro da 13,89:1. Los componentes compartidos pintan el texto
        // que va encima del acento con esta variable, asi que basta con
        // declararla aqui.
        ['--color-accent-ink' as any]: '#0a1206',
        // Los canales del verde, para las sombras y brillos.
        ['--color-accent-rgb' as any]: '83, 252, 24',
      }}
    >


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
              <span className="hidden xl:block font-black text-2xl tracking-tighter text-white">Klipy</span>
            </div>
          </div>

          <div className="w-full px-4 sm:px-4 md:px-0 md:mx-4 xl:ml-14 xl:mr-64 2xl:mx-4 max-w-[800px] order-3 md:order-2 mt-2 md:mt-0">
            <SearchBar fetchSuggestions={fetchKickSuggestions} onSearch={handleSearch} query={state.query} isLoading={state.isLoading && state.mode === 'categories'} t={t} />
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
            {/* Listas y historial son cosas distintas, así que botón aparte. */}
            <div className="relative">
              <button
                onClick={() => setShowListsPanel(true)}
                aria-label={t('my_lists')}
                title={t('my_lists')}
                className="w-10 h-10 md:w-14 md:h-14 rounded-xl flex items-center justify-center bg-[#1c1c24] border border-white/10 text-gray-400 hover:text-white transition-all active:scale-95 cursor-pointer"
              >
                <Library className="w-5 h-5 md:w-6 md:h-6" />
                {/* Cuenta LISTAS, no clips. min-w + px para que un 10 o un 12
                    no salgan apretados dentro de un círculo fijo. */}
                {userLists.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[1.25rem] md:min-w-[1.5rem] h-5 md:h-6 px-1.5 bg-gradient-to-br from-white to-gray-300 text-[#0d0d12] text-[10px] md:text-[11px] font-black flex items-center justify-center rounded-full ring-2 ring-[#0d0d12] shadow-lg tabular-nums">
                    {userLists.length}
                  </span>
                )}
              </button>
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
                          <span>{t('saved_clips')} ({visibleSavedClips.length})</span>
                          {visibleSavedClips.length > 0 && <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{t('total_duration')}: {formatTotalDuration(visibleSeconds)}</span>}
                        </div>
                      </h3>
                      <div className="flex items-center gap-4 md:gap-2">
                        <button onClick={handleUndoDelete} disabled={deletedClipsStack.length === 0} title={t('undo_delete')} className={`p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer ${deletedClipsStack.length > 0 ? 'text-green-400' : 'text-gray-600'}`}><Undo className="w-4 h-4" /></button>
                        <button onClick={() => setShowHistoryMenu(prev => !prev)} title={t('collections_heading')} className={`p-2 rounded-xl hover:bg-white/5 cursor-pointer ${showHistoryMenu ? 'text-twitch-base bg-white/5' : 'text-gray-400 hover:text-white'}`}><History className="w-4 h-4" /></button>
                        <button onClick={() => setShowSavedList(false)} className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/5 cursor-pointer"><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                    {showHistoryMenu && (
                      <div className="border-b border-white/5 bg-[#101014] p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2"><History className="w-3.5 h-3.5" /> {t('history_heading')}</h4>
                          {autoHistory.length > 0 && (
                            <button onClick={handleDeleteAllCollections} className="text-[10px] text-red-500/50 font-black hover:text-red-500 transition-colors uppercase tracking-widest cursor-pointer">{t('delete_all_collections')}</button>
                          )}
                        </div>
                        {autoHistory.length === 0 ? (
                          <div className="text-center py-8 text-gray-500 font-bold text-xs uppercase tracking-widest">{t('collections_empty')}</div>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                            {autoHistory.map(collection => (
                              <div key={collection.id} onClick={() => handleLoadCollection(collection.id)} className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-3 flex items-center gap-3 group transition-all cursor-pointer">
                                <div className="flex-grow min-w-0">
                                  {renamingId === collection.id ? (
                                    <input
                                      autoFocus
                                      value={renameValue}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => setRenameValue(e.target.value)}
                                      onBlur={() => handleCommitRename(collection.id)}
                                      onKeyDown={(e) => { if (e.key === 'Enter') handleCommitRename(collection.id); }}
                                      className="w-full bg-black/40 border border-twitch-base/40 rounded-lg px-2 py-1 text-xs font-bold text-gray-100 outline-none"
                                    />
                                  ) : (
                                    <div className="text-xs font-black text-gray-100 truncate tracking-tight">{collection.name}</div>
                                  )}
                                  <div className="text-[10px] font-bold text-gray-500">{collection.clips.length} clips</div>
                                </div>
                                <button onClick={(e) => handleStartRename(e, collection)} className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"><Pencil className="w-3.5 h-3.5" /></button>
                                <button onClick={(e) => handleDownloadCollectionTxt(e, collection)} className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"><Download className="w-3.5 h-3.5" /></button>
                                <button onClick={(e) => handleSendCollectionExternal(e, collection)} className="p-1.5 text-gray-500 hover:text-twitch-base rounded-lg hover:bg-white/10 cursor-pointer"><CloudDownload className="w-3.5 h-3.5" /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteCollection(collection.id); }} className="p-1.5 text-gray-500 hover:text-red-500 rounded-lg hover:bg-red-500/10 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {savedClips.length > 0 && state.activeCategory && (
                      <div className="px-5 pt-4 pb-1">
                        {renderScopeTabs(savedInActiveCategory.length, savedClips.length)}
                      </div>
                    )}
                    <div className="overflow-y-auto custom-scrollbar p-5 space-y-3 flex-grow">
                      {visibleSavedClips.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-black text-sm uppercase tracking-widest">{t('no_saved_clips')}</div>
                      ) : categoryScoped ? (
                        visibleSavedClips.map(renderSavedClip)
                      ) : (
                        // Fuera de una categoria concreta no tiene sentido una
                        // lista plana de todo mezclado: cada categoria es su
                        // propio desplegable y se abre el que interese.
                        savedGroups.map(group => {
                          const open = savedGroups.length === 1 || expandedSavedCats.includes(group.key);
                          const groupName = group.name || t('uncategorized');
                          return (
                            <div key={group.key} className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                              <div className="flex items-center gap-1 p-2">
                                <button
                                  onClick={() => toggleSavedCat(group.key)}
                                  aria-expanded={open}
                                  className="flex-grow min-w-0 flex items-center gap-2.5 px-2 py-1.5 text-left cursor-pointer"
                                >
                                  <ChevronRight className={`w-4 h-4 flex-shrink-0 text-gray-500 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
                                  <Layers className="w-3.5 h-3.5 flex-shrink-0 text-twitch-base" />
                                  {/* Nombre arriba y "cuantos - cuanto dura"
                                      debajo: en el panel estrecho del movil,
                                      con las dos cosas en la misma linea el
                                      nombre de la categoria se quedaba en dos
                                      letras y unos puntos suspensivos. */}
                                  <span className="flex-grow min-w-0 flex flex-col">
                                    <span className="font-black text-xs text-white truncate">{groupName}</span>
                                    <span className="text-[10px] font-bold text-gray-500 tabular-nums truncate">
                                      {group.clips.length} · {formatTotalDuration(sumClipSeconds(group.clips))}
                                    </span>
                                  </span>
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); downloadClipsTxt(group.clips, groupName); }}
                                  title={t('download_txt')}
                                  className="flex-shrink-0 p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                                >
                                  <FileDown className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); openExternalDownload(group.clips.map(c => c.url).join('\n')); }}
                                  title={t('download_zip_web')}
                                  className="flex-shrink-0 p-2 rounded-xl text-gray-500 hover:text-twitch-base hover:bg-twitch-base/10 transition-colors cursor-pointer"
                                >
                                  <CloudDownload className="w-4 h-4" />
                                </button>
                              </div>
                              {open && (
                                <div className="border-t border-white/5 p-3 space-y-3">
                                  {group.clips.map(renderSavedClip)}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                    {/* Todo lo de aqui abajo trabaja sobre lo que se esta
                        viendo: acotado a Valorant se descarga, se guarda y se
                        borra Valorant, no los guardados enteros. */}
                    {visibleSavedClips.length > 0 && (
                      <div className="p-6 bg-[#15151b] border-t border-white/5 flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-3">
                          <button onClick={() => downloadClipsTxt(visibleSavedClips, scopeLabel || t('download_filename'))} className="bg-white/5 py-4 rounded-2xl text-[11px] font-black border border-white/5 hover:bg-white/10 transition-all uppercase tracking-widest cursor-pointer">{t('download_txt')}</button>
                          <button onClick={() => handleExternalZip(visibleSavedClips)} className="bg-twitch-base/70 py-4 rounded-2xl text-[11px] font-black text-white hover:bg-twitch-base transition-all uppercase tracking-widest cursor-pointer">{t('download_zip_web')}</button>
                        </div>
                        <button onClick={() => handleSaveCollection(visibleSavedClips, scopeLabel || undefined)} className="flex items-center justify-center gap-2 bg-white/5 py-3 rounded-2xl text-[11px] font-black border border-white/5 hover:bg-white/10 transition-all uppercase tracking-widest cursor-pointer text-gray-300"><Save className="w-3.5 h-3.5" /> {t('save_collection')}</button>
                        <button onClick={(e) => requestDeleteAll(e, visibleSavedClips)} className="text-[10px] text-red-500/40 font-black py-2 hover:text-red-500 transition-colors uppercase tracking-[0.2em] cursor-pointer">{t('delete_all')}</button>
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
      {/* AdRail mide el hueco entre este <main> y el borde del viewport y solo
          muestra cada raíl si caben 120-160px + margen. Un ancho fijo no sirve:
          con 1800px no cabían nunca, y con uno fijo más pequeño se malgasta
          pantalla en monitores grandes. Reservando 440px (220 por lado) el
          hueco es suficiente, y el tope de 1800px sigue mandando en monitores
          muy anchos.
          El hueco SOLO se reserva a partir de 1400px, que es donde los raíles
          se llegan a pintar. Restarlo siempre era lo que rompía el móvil:
          calc(100vw-440px) da negativo por debajo de 440px de pantalla, el
          max-width se queda en 0 y todo el contenido se salía de la caja. */}
      <main className="w-full mx-auto px-4 sm:px-6 pt-44 md:pt-40 flex-grow max-w-[1800px] min-[1400px]:max-w-[min(1800px,calc(100vw-440px))] relative z-10">
        <AdBanner id="adsense-clipy-top" className="mb-8" />
        <div className="mb-8 md:mb-14" key={state.mode}>
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
            <div className="flex flex-col gap-6 md:gap-10">
              <button onClick={goBackToCategories} className="flex items-center gap-2 md:gap-3 text-gray-500 hover:text-twitch-base text-sm sm:text-base md:text-lg font-black transition-all group w-fit cursor-pointer"><ArrowLeft className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-x-2 transition-transform" /> {t('back_categories')}</button>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-12">
                <div className="order-2 md:order-1 w-28 h-40 sm:w-32 sm:h-44 md:w-44 md:h-60 flex-shrink-0 bg-twitch-surfaceAlt rounded-3xl md:rounded-[2.5rem] overflow-hidden shadow-2xl border-2 border-white/10 ring-4 md:ring-8 ring-twitch-base/5 animate-float">
                  <img src={state.activeCategory.box_art_url} className="w-full h-full object-cover" alt={state.activeCategory.name} />
                </div>
                <div className="order-1 md:order-2 min-w-0">
                  {/* break-words: nombres de juego largos ("Counter-Strike 2",
                      "PLAYERUNKNOWN'S BATTLEGROUNDS") no caben en una línea a
                      375px y con tracking-tighter se salían de la caja. */}
                  <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-black tracking-tighter text-white mb-4 md:mb-6 leading-none break-words">{state.activeCategory.name}</h1>
                  <div className="flex flex-wrap items-center gap-4 md:gap-8 text-sm md:text-xl text-gray-400 font-bold">
                    <span className="text-twitch-base flex items-center gap-2 md:gap-3"><Sparkles className="w-5 h-5 md:w-6 md:h-6" /> {t('top_clips')}</span>
                    <ChevronRight className="w-4 h-4 md:w-6 md:h-6 opacity-10" />
                    <span className="text-gray-400 bg-white/5 px-4 py-2 md:px-6 md:py-3 rounded-2xl">{t(`time_${state.timeFilter}`)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 md:py-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 relative z-10 w-full">
              {/* Escalón intermedio en md/lg: saltar de 48px a 128px de golpe
                  dejaba un titular de 128px en pantallas de 768px. */}
              <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-[8rem] font-black tracking-tighter text-white mb-5 md:mb-8 leading-[0.95] md:leading-[0.9] break-words">
                {state.query && !state.query.includes('clip') && !isTopPopularMode ? `${t('results_for')} "${state.query}"` : t('explore_popular')}
              </h1>
              <p className="text-gray-500 text-base sm:text-lg md:text-2xl font-medium max-w-2xl leading-relaxed relative z-10">{t('app_subtitle')}</p>
            </div>
          )}
        </div>

        {state.error && (
          <div className="mb-8 md:mb-14 p-6 md:p-10 bg-[#1c0c0c] border border-red-500/10 rounded-3xl md:rounded-[3rem] text-red-200 text-sm md:text-lg flex items-center gap-4 md:gap-8 shadow-2xl">
            <AlertTriangle className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0 text-red-500" />
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
            {state.categoriesCursor && (
              <div className="flex justify-center pb-24 md:pb-32">
                <button onClick={loadMoreCategories} disabled={state.isLoading} className="flex items-center gap-3 md:gap-6 px-8 md:px-16 py-5 md:py-8 bg-[#1a1a24] border border-white/5 hover:border-white/20 rounded-3xl md:rounded-[2rem] text-sm md:text-lg font-black text-gray-400 hover:text-white transition-all shadow-xl active:scale-95 group disabled:opacity-50 cursor-pointer">
                  {state.isLoading ? <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin text-twitch-base" /> : <PlusCircle className="w-6 h-6 md:w-8 md:h-8 text-twitch-base" />}
                  {t('load_more_games')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="pb-32">
            {!state.query.includes('clip') && (
              <>
                <FilterBar
                  currentTime={state.timeFilter}
                  currentSort={state.sortType}
                  onTimeChange={handleFilterChange}
                  onSortChange={handleSortChange}
                  onLoadAll={loadAllClips}
                  isLoading={state.isLoading}
                  disabled={state.isLoading && state.clips.length === 0}
                  t={t}
                  anchorTime={state.anchorTime}
                  onAnchorChange={handleAnchorChange}
                  isBlocklistOpen={isBlocklistOpen}
                  onToggleBlocklist={() => setIsBlocklistOpen(!isBlocklistOpen)}
                  blockedCount={blockedCount}
                  groupByChannel={groupByChannel}
                  onGroupByChannelChange={setGroupByChannel}
                  perfMode={perfMode}
                  onPerfModeChange={handlePerfModeChange}
                  excludeLanguages={activeExcludeLanguages}
                  onExcludeLanguagesChange={handleExcludeLanguagesChange}
                  onlyLanguages={activeOnlyLanguages}
                  onOnlyLanguagesChange={handleOnlyLanguagesChange}
                  playbackSpeed={playbackSpeed}
                  onPlaybackSpeedChange={handlePlaybackSpeedChange}
                  keywords={keywords}
                  onKeywordsChange={setKeywords}
                />
                {isBlocklistOpen && (
                  <BlocklistManager
                    categoryId={categoryId}
                    categoryName={state.activeCategory?.name || ''}
                    blockedStreamers={blockedStreamers}
                    onBlockStreamer={handleBlockStreamer}
                    onUnblockStreamer={handleUnblockStreamer}
                    onClearBlocklist={handleClearBlocklist}
                    onImportBlocklist={(newBlocklist) => setBlockedStreamers(newBlocklist)}
                    showToast={showToast}
                    loadedClips={state.clips}
                    t={t}
                  />
                )}
              </>
            )}
            <ClipGrid
              ref={clipGridRef}
              clips={pagedClips}
              isLoading={state.isLoading}
              hasMore={!!state.paginationCursor || !allClipsLoaded}
              onLoadMore={handleScrollLoadMore}
              onLoadAll={loadAllClips}
              onClipClick={handleClipClick}
              savedClipIds={savedClipIds}
              onToggleSave={handleToggleSave}
              onDownloadExternal={openExternalDownload}
              onBlockStreamer={handleBlockStreamer}
              onAddToLists={handleOpenListPicker}
              t={t}
              autoLoadOnScroll={!perfMode}
            />
            <div ref={clipsEndRef} />
            {perfMode && totalRenderPages > 1 && (
              <div className="flex flex-col items-center justify-center gap-2 mt-10">
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => goToRenderPage(renderPage - 1)}
                    disabled={renderPage === 0}
                    title={`${t('prev_page')} (←)`}
                    className="px-5 py-2.5 rounded-xl bg-[#1a1a24] border border-white/5 hover:border-white/20 text-sm font-bold text-gray-300 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {t('prev_page')}
                  </button>
                  <span className="flex items-center gap-2 text-sm font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                    {t('page_label')}
                    <input
                      key={renderPage}
                      ref={inlinePageInputRef}
                      type="number"
                      min={1}
                      defaultValue={renderPage + 1}
                      onFocus={(e) => e.currentTarget.select()}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                      onBlur={() => commitPageInput(inlinePageInputRef.current)}
                      aria-label={t('page_label')}
                      className="w-14 text-center bg-twitch-black border border-twitch-surfaceAlt rounded-lg px-1 py-1 text-gray-100 normal-case font-bold outline-none focus:border-twitch-base cursor-text [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    / {totalRenderPages}
                  </span>
                  <button
                    onClick={() => goToRenderPage(renderPage + 1)}
                    disabled={isLastRenderPage}
                    title={`${t('next_page')} (→)`}
                    className="px-5 py-2.5 rounded-xl bg-[#1a1a24] border border-white/5 hover:border-white/20 text-sm font-bold text-gray-300 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {t('next_page')}
                  </button>
                </div>
                <span className="text-[10px] font-bold text-gray-600 tracking-widest">← {t('page_label')} →</span>
              </div>
            )}
          </div>
        )}

        <AdBanner id="adsense-clipy-mid" className="mt-24" />

        {/* Como funciona ------------------------------------------------- */}
        <section id="how-it-works" className="mt-24 space-y-8 scroll-mt-32">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white text-center">
            {t('how_title')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {[
              { art: StepSearch, artProps: {}, title: t('step1_title'), text: t('step1_text') },
              { art: StepFilter, artProps: {}, title: t('step2_title'), text: t('step2_text') },
              { art: StepWatch, artProps: { caption: t('artNoLeave') }, title: t('step3_title'), text: t('step3_text') },
              { art: StepSend, artProps: {}, title: t('step4_title'), text: t('step4_text') },
            ].map((step, i) => (
              <div key={i} className="bg-[#16121f] border border-white/5 rounded-2xl p-4 space-y-3">
                <step.art {...step.artProps} />
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-twitch-base/20 text-twitch-base text-[11px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                  {step.title}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Caracteristicas ----------------------------------------------- */}
        <section className="mt-24 space-y-8">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white text-center">
            {t('features_title')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {[
              { icon: IconSearch, title: t('feat1_title'), text: t('feat1_text') },
              { icon: IconFilter, title: t('feat2_title'), text: t('feat2_text') },
              { icon: IconPlayer, title: t('feat3_title'), text: t('feat3_text') },
              { icon: IconCollection, title: t('feat4_title'), text: t('feat4_text') },
              { icon: IconBlock, title: t('feat5_title'), text: t('feat5_text') },
              { icon: IconHandoff, title: t('feat6_title'), text: t('feat6_text') },
            ].map((f, i) => (
              <div key={i} className="bg-[#16121f] border border-white/5 rounded-2xl p-5 space-y-3">
                <div className="w-10 h-10"><f.icon /></div>
                <h3 className="text-sm font-black text-white">{f.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ ------------------------------------------------------------ */}
        {Array.isArray(faqItems) && faqItems.length > 0 && (
          <section className="mt-24 space-y-6">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white text-center">
              {t('faq_title')}
            </h2>
            <div className="space-y-3 max-w-3xl mx-auto w-full">
              {faqItems.map((item: any, i: number) => (
                <details key={i} className="group bg-[#16121f] border border-white/5 rounded-2xl overflow-hidden">
                  <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none text-sm font-bold text-white hover:opacity-80 transition-opacity">
                    <span>{item.question}</span>
                    <span className="text-lg leading-none text-twitch-base shrink-0 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="px-5 pb-5 text-sm text-gray-400 leading-relaxed">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <AdBanner id="adsense-clipy-bottom" className="mt-24" />
      </main>

      {playingClip && <FloatingPlayer getVideoSource={getClipVideoSource} clip={playingClip} onClose={() => {
        setPlayingClip(null);
        playingClipRef.current = null;
      }} isSaved={savedClips.some(c => c.id === playingClip.id)} onToggleSave={handleToggleSave} onDownloadExternal={openExternalDownload} onAddToList={handleOpenListPicker} onBlockStreamer={handleBlockStreamer} t={t} playbackSpeed={playbackSpeed} onPlaybackSpeedChange={handlePlaybackSpeedChange} />}

      {/* Panel de listas. Aquí se ve QUÉ tiene cada lista; el historial de
          instantáneas diarias sigue en su propio menú. */}
      {/* Al <body> y por encima del reproductor: el FloatingPlayer se pinta en
          un portal con z-index 9999, asi que un z-index de dentro del arbol de
          la herramienta se queda debajo y el dialogo salia tapado. */}
      {showListsPanel && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-300"
          style={{ zIndex: 10000 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowListsPanel(false); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="clipy-mylists-title"
            className="bg-[#0c0c10] border border-white/10 rounded-[2.5rem] max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-4 duration-300"
          >
            <div className="bg-[#15151b] px-5 sm:px-8 py-5 sm:py-6 border-b border-white/5">
              <div className="flex items-center justify-between gap-3">
                <h3 id="clipy-mylists-title" className="font-black text-base sm:text-lg flex items-center gap-3 text-white min-w-0">
                  <Library className="w-5 h-5 text-twitch-base flex-shrink-0" />
                  <span className="truncate">{t('my_lists')}</span>
                  {userLists.length > 0 && (
                    <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-white/10 text-[11px] font-black text-gray-300 tabular-nums">{userLists.length}</span>
                  )}
                </h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => { setCreatingList(v => !v); setNewListName(''); }}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer active:scale-95 ${creatingList ? 'bg-white/10 text-gray-300' : 'bg-twitch-base/80 hover:bg-twitch-base text-white shadow-lg shadow-twitch-base/20'}`}
                  >
                    <PlusCircle className={`w-3.5 h-3.5 transition-transform duration-300 ${creatingList ? 'rotate-45' : ''}`} />
                    <span className="hidden sm:inline">{creatingList ? t('cancel') : t('new_list')}</span>
                  </button>
                  <button onClick={() => setShowListsPanel(false)} className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/5 cursor-pointer"><X className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Campo en línea en vez de window.prompt del navegador. */}
              {creatingList && (
                <form
                  className="flex gap-2 mt-4 animate-in slide-in-from-top-4 fade-in duration-300"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (handleCreateList(newListName)) { setNewListName(''); setCreatingList(false); }
                  }}
                >
                  <input
                    autoFocus
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Escape') setCreatingList(false); }}
                    placeholder={t('new_list_placeholder')}
                    aria-label={t('new_list')}
                    maxLength={60}
                    className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-twitch-base transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!newListName.trim()}
                    className="px-5 py-3 rounded-2xl bg-twitch-base/80 hover:bg-twitch-base text-white text-sm font-black transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                  >
                    {t('create')}
                  </button>
                </form>
              )}
            </div>

            <div className="overflow-y-auto custom-scrollbar p-5 space-y-3">
              {/* Sin la lista por defecto: esa vive en su propio panel (el del
                  icono de archivo) y el botón + de las tarjetas ya va ahí. */}
              {userLists.length > 0 && state.activeCategory && (
                <div className="pb-1">
                  {renderScopeTabs(
                    listedInActiveCategory,
                    userLists.reduce((acc, list) => acc + list.clips.length, 0),
                  )}
                </div>
              )}
              {visibleLists.length === 0 && (
                <p className="text-center py-12 text-gray-500 font-bold text-xs uppercase tracking-widest">{t('collections_empty')}</p>
              )}
              {visibleLists.map(({ list, clips: listClips }) => {
                const open = expandedListId === list.id;
                const listGroups = groupClipsByCategory(listClips);
                return (
                  <div key={list.id} className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-3 p-4">
                      <button
                        onClick={() => setExpandedListId(open ? null : list.id)}
                        className="flex-grow min-w-0 flex items-center gap-3 text-left cursor-pointer"
                      >
                        <ChevronRight className={`w-4 h-4 flex-shrink-0 text-gray-500 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
                        <span className="font-black text-sm text-white truncate">{list.name}</span>
                        {/* Solo el número, sin la palabra: "1 clips" quedaba mal
                            y pluralizar bien en 9 idiomas no compensa aquí. */}
                        <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-black text-gray-400 tabular-nums">{listClips.length}</span>
                      </button>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Sobre lo que se ve: con el panel acotado se
                            exporta la parte de esta categoria, no la lista
                            entera. */}
                        <button
                          onClick={(e) => { e.stopPropagation(); downloadClipsTxt(listClips, scopeLabel ? `${list.name} ${scopeLabel}` : list.name); }}
                          disabled={listClips.length === 0}
                          title={t('download_txt')}
                          className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openExternalDownload(listClips.map(c => c.url).join('\n')); }}
                          disabled={listClips.length === 0}
                          title={t('download_zip_web')}
                          className="p-2 rounded-xl text-gray-500 hover:text-twitch-base hover:bg-twitch-base/10 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <CloudDownload className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { handleDeleteCollection(list.id); if (open) setExpandedListId(null); }}
                          title={t('delete_collection')}
                          className="p-2 rounded-xl text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {open && (
                      <div className="border-t border-white/5 p-3 space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                        {listClips.length === 0 ? (
                          <p className="text-center py-6 text-gray-500 font-bold text-[11px] uppercase tracking-widest">{t('collections_empty')}</p>
                        ) : categoryScoped || listGroups.length === 1 ? (
                          listClips.map(clip => renderListClip(clip, list.id))
                        ) : (
                          // Una lista puede mezclar categorias: se separan con
                          // su nombre delante para no tener que adivinar de
                          // donde salio cada clip.
                          listGroups.map(group => (
                            <div key={group.key} className="space-y-2">
                              <div className="flex items-center gap-2 px-2 pt-2">
                                <Layers className="w-3 h-3 flex-shrink-0 text-twitch-base" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 truncate">{group.name || t('uncategorized')}</span>
                                <span className="flex-shrink-0 text-[10px] font-black text-gray-600 tabular-nums">{group.clips.length} · {formatTotalDuration(sumClipSeconds(group.clips))}</span>
                              </div>
                              {group.clips.map(clip => renderListClip(clip, list.id))}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* Selector de listas: el botón + de la tarjeta va directo a la lista por
          defecto sin preguntar; este es el que deja elegir destino. */}
      {listPickerClip && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-300"
          style={{ zIndex: 10001 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setListPickerClip(null); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="clipy-lists-title"
            className="bg-[#0c0c10] border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full shadow-[0_0_120px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-4 duration-300"
          >
            <h3 id="clipy-lists-title" className="text-2xl font-black text-white tracking-tighter mb-1">{t('choose_lists')}</h3>
            <p className="text-xs text-gray-500 font-bold truncate mb-6">{listPickerClip.title}</p>

            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-1 mb-5">
              {/* Clips guardados siempre el primero: es el destino por defecto y
                  desde aquí se llega igual que con el botón + de al lado, sin
                  tener que cerrar el diálogo para guardarlo. */}
              <label className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-twitch-base/10 hover:bg-twitch-base/20 border border-twitch-base/25 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={savedClipIds.has(listPickerClip.id)}
                  onChange={() => handleToggleSave(listPickerClip)}
                  className="w-4 h-4 accent-twitch-base cursor-pointer"
                />
                <Archive className="w-4 h-4 text-twitch-base flex-shrink-0" />
                <span className="flex-1 min-w-0 text-sm font-black text-white truncate">{t('saved_clips')}</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-twitch-base/70 flex-shrink-0">{t('default_list')}</span>
              </label>

              {userLists.length > 0 && <div className="h-px bg-white/5 my-1" />}

              {userLists.length === 0 && (
                <p className="text-center py-6 text-gray-500 font-bold text-[11px] uppercase tracking-widest">{t('collections_empty')}</p>
              )}
              {userLists.map(collection => {
                const has = collection.clips.some(c => c.id === listPickerClip.id);
                return (
                  <label key={collection.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={has}
                      onChange={() => handleToggleClipInList(listPickerClip, collection.id)}
                      className="w-4 h-4 accent-twitch-base cursor-pointer"
                    />
                    <span className="flex-1 text-sm font-black text-gray-200 truncate">{collection.name}</span>
                    <span className="text-[10px] font-black text-gray-500 tabular-nums">{collection.clips.length}</span>
                  </label>
                );
              })}
            </div>

            {/* Crear y añadir en un paso: las dos actualizaciones son
                funcionales y se aplican en orden, así que la segunda ya ve la
                lista recién creada. */}
            <form
              className="flex gap-2 mb-5"
              onSubmit={(e) => {
                e.preventDefault();
                const id = handleCreateList(newListName);
                if (!id) return;
                handleToggleClipInList(listPickerClip, id);
                setNewListName('');
              }}
            >
              <input
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder={t('new_list_placeholder')}
                aria-label={t('new_list')}
                maxLength={60}
                className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-twitch-base transition-colors"
              />
              <button
                type="submit"
                disabled={!newListName.trim()}
                className="px-5 py-3 rounded-2xl bg-twitch-base/80 hover:bg-twitch-base text-white text-sm font-black transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95"
              >
                {t('create')}
              </button>
            </form>

            <button
              onClick={() => setListPickerClip(null)}
              className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-sm font-black text-white transition-all cursor-pointer"
            >
              {t('done')}
            </button>
          </div>
        </div>,
        document.body,
      )}

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

      {streamerToBlock && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-300">
          <div className="bg-[#0c0c10] border border-white/10 rounded-[3.5rem] p-12 max-w-lg w-full text-center shadow-[0_0_120px_rgba(0,0,0,0.8)]">
            <div className="w-20 h-20 rounded-full overflow-hidden border border-white/10 mx-auto mb-6 p-0.5 bg-twitch-surfaceAlt flex items-center justify-center">
              <img 
                src={streamerToBlock.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${streamerToBlock.name}`} 
                alt={streamerToBlock.name}
                loading="lazy"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <h3 className="text-3xl font-black mb-4 text-white tracking-tighter">
              {t('block_confirm_title') === 'block_confirm_title' ? '¿Ocultar este canal?' : t('block_confirm_title')}
            </h3>
            <p className="text-gray-400 text-base mb-10 leading-relaxed font-bold">
              {t('block_confirm_desc') === 'block_confirm_desc'
                ? `¿Seguro que quieres ocultar los clips de ${streamerToBlock.name}? Podrás volver a mostrarlos desde el panel de ocultados.`
                : t('block_confirm_desc').replace('{name}', streamerToBlock.name)}
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setStreamerToBlock(null)} 
                className="flex-1 py-5 bg-white/5 rounded-[2rem] text-base font-black hover:bg-white/10 transition-all text-gray-300 cursor-pointer"
              >
                {t('cancel') || 'Cancelar'}
              </button>
              <button 
                onClick={() => {
                  confirmBlockStreamer();
                  setStreamerToBlock(null);
                }} 
                className="flex-1 py-5 bg-red-600/90 rounded-[2rem] text-base font-black text-white hover:bg-red-600 transition-all shadow-xl shadow-red-600/5 cursor-pointer"
              >
                {t('block') || 'Ocultar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-4 right-4 z-[200]">
        <button
          onClick={scrollToTop}
          className={`bg-[#1a1a24] text-gray-400 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 transition-all hover:text-white hover:bg-twitch-base hover:shadow-[0_20px_40px_rgba(var(--color-accent-rgb),0.3)] hover:-translate-y-3 active:scale-90 cursor-pointer group ${showScrollTop ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-6 h-6 md:w-8 md:h-8 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {perfMode && state.mode === 'clips' && totalRenderPages > 1 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-1.5 bg-[#15151b]/95 backdrop-blur-md border border-white/10 rounded-full p-1.5 shadow-2xl">
          <button
            onClick={() => goToRenderPage(renderPage - 1)}
            disabled={renderPage === 0}
            title={`${t('prev_page')} (←)`}
            aria-label={t('prev_page')}
            className="p-2.5 rounded-full bg-white/5 hover:bg-twitch-base text-gray-300 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-90"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="flex flex-col items-center px-1 gap-0.5">
            <span className="flex items-center gap-1 text-xs font-black text-gray-200 whitespace-nowrap">
              <input
                key={renderPage}
                ref={floatingPageInputRef}
                type="number"
                min={1}
                defaultValue={renderPage + 1}
                onFocus={(e) => e.currentTarget.select()}
                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                onBlur={() => commitPageInput(floatingPageInputRef.current)}
                aria-label={t('page_label')}
                className="w-9 text-center bg-white/5 border border-white/10 rounded-md py-0.5 text-gray-100 outline-none focus:border-twitch-base cursor-text [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              / {totalRenderPages}
            </span>
            <span className="text-[9px] font-bold text-gray-500 tracking-widest">← →</span>
          </span>
          <button
            onClick={() => goToRenderPage(renderPage + 1)}
            disabled={isLastRenderPage}
            title={`${t('next_page')} (→)`}
            aria-label={t('next_page')}
            className="p-2.5 rounded-full bg-white/5 hover:bg-twitch-base text-gray-300 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-90"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <motion.div
        initial={prefersReduced ? false : 'hidden'}
        whileInView={prefersReduced ? undefined : 'visible'}
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeInUp}
      >
      <footer className="mt-32 py-20 bg-transparent border-t border-white/5 relative z-10 px-8">
        <style>{`
          footer b { color: #fff; font-weight: 800; text-shadow: 0 0 10px rgba(var(--color-accent-rgb),0.2); }
          footer .keyword-accent { color: #53fc18; font-weight: 800; }
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
              <a 
                href={`/${lang}/privacy`} 
                className="w-full md:w-auto py-4 md:py-0 text-gray-300 hover:text-twitch-base active:bg-white/5 active:scale-95 transition-all text-[11px] font-black uppercase tracking-[0.3em] whitespace-nowrap cursor-pointer rounded-2xl text-center"
              >
                {legalTranslations[lang]?.nav.privacy || 'Privacy'}
              </a>
              <a 
                href={`/${lang}/terms`} 
                className="w-full md:w-auto py-4 md:py-0 text-gray-300 hover:text-twitch-base active:bg-white/5 active:scale-95 transition-all text-[11px] font-black uppercase tracking-[0.3em] whitespace-nowrap cursor-pointer rounded-2xl text-center"
              >
                {legalTranslations[lang]?.nav.terms || 'Terms'}
              </a>
              <a 
                href={`/${lang}/cookies`} 
                className="w-full md:w-auto py-4 md:py-0 text-gray-300 hover:text-twitch-base active:bg-white/5 active:scale-95 transition-all text-[11px] font-black uppercase tracking-[0.3em] whitespace-nowrap cursor-pointer rounded-2xl text-center"
              >
                {legalTranslations[lang]?.nav.cookies || 'Cookies'}
              </a>
              <a 
                href={`/${lang}/about`} 
                className="w-full md:w-auto py-4 md:py-0 text-gray-300 hover:text-twitch-base active:bg-white/5 active:scale-95 transition-all text-[11px] font-black uppercase tracking-[0.3em] whitespace-nowrap cursor-pointer rounded-2xl text-center"
              >
                {legalTranslations[lang]?.nav.about || 'About'}
              </a>
              <div className="hidden md:block w-px h-3 bg-white/10 mx-2"></div>
              <a
                href="mailto:adrian.contact.me.69@gmail.com"
                onClick={handleContactClick}
                className="w-full md:w-auto py-4 md:py-0 flex items-center justify-center gap-2 text-gray-400 hover:text-twitch-base active:bg-white/5 active:scale-95 transition-all text-[10px] md:text-[11px] font-bold uppercase tracking-widest group whitespace-nowrap cursor-pointer rounded-2xl text-center"
              >
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>{t('contact_link')}</span>
              </a>
            </div>

            <p className="text-[10px] text-gray-800 font-bold tracking-[0.2em] uppercase">
              Klipy | Kick clip browser
            </p>
          </div>
        </div>
      </footer>
      </motion.div>

      {/* Global Legal Components */}
      {legalModal && <LegalModal type={legalModal} onClose={() => setLegalModal(null)} onShowToast={(msg) => showToast(msg)} t={t} />}
    </div>
  );
};


export default Klipy;
