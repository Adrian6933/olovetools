
import React, { useState, useRef, useEffect } from 'react';
import { TimeFilter, SortType } from './types';
import { Clock, TrendingUp, ChevronDown, Check, ChevronsDown, Loader2, CalendarClock, X, ShieldAlert, Users, Gauge, Ban, Languages, FastForward, Type } from 'lucide-react';

// Twitch clips no traen pista de audio de alta calidad ni suelen durar mucho,
// así que velocidades altas (x3/x4) siguen siendo perfectamente reproducibles
// en un <video> normal — el límite real es de gusto/comprensión, no técnico.
const PLAYBACK_SPEEDS = [1, 1.5, 2, 3, 4];

// Twitch no expone país/región por clip — el idioma del stream (que Twitch sí
// reporta en cada clip) es el dato más parecido disponible, así que los
// filtros de "excluir"/"solo estos" van por ahí. Nombres nativos (autónimos)
// para no depender de traducir 30 idiomas a cada locale de la app.
const CLIP_LANGUAGES: { code: string; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'zh', label: '中文' },
  { code: 'ar', label: 'العربية' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'pl', label: 'Polski' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'sv', label: 'Svenska' },
  { code: 'no', label: 'Norsk' },
  { code: 'da', label: 'Dansk' },
  { code: 'fi', label: 'Suomi' },
  { code: 'cs', label: 'Čeština' },
  { code: 'sk', label: 'Slovenčina' },
  { code: 'hu', label: 'Magyar' },
  { code: 'ro', label: 'Română' },
  { code: 'bg', label: 'Български' },
  { code: 'uk', label: 'Українська' },
  { code: 'el', label: 'Ελληνικά' },
  { code: 'th', label: 'ไทย' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'asl', label: 'ASL' },
  { code: 'other', label: 'Other' },
];

interface FilterBarProps {
  currentTime: TimeFilter;
  currentSort: SortType;
  onTimeChange: (t: TimeFilter) => void;
  onSortChange: (s: SortType) => void;
  onLoadAll: () => void;
  isLoading: boolean;
  disabled: boolean;
  t: (key: string) => string;
  anchorTime?: string | null;
  onAnchorChange?: (value: string | null) => void;
  isBlocklistOpen?: boolean;
  onToggleBlocklist?: () => void;
  blockedCount?: number;
  groupByChannel?: boolean;
  onGroupByChannelChange?: (val: boolean) => void;
  perfMode?: boolean;
  onPerfModeChange?: (val: boolean) => void;
  excludeLanguages?: string[];
  onExcludeLanguagesChange?: (codes: string[]) => void;
  onlyLanguages?: string[];
  onOnlyLanguagesChange?: (codes: string[]) => void;
  playbackSpeed?: number;
  onPlaybackSpeedChange?: (speed: number) => void;
  /**
   * Palabras que tiene que llevar el titulo del clip. Se cruzan con O: al
   * anadir la segunda salen los clips de cualquiera de las dos.
   */
  keywords?: string[];
  onKeywordsChange?: (words: string[]) => void;
}

const toDatetimeLocalValue = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const FilterBar: React.FC<FilterBarProps> = ({
  currentTime,
  currentSort,
  onTimeChange,
  onSortChange,
  onLoadAll,
  isLoading,
  disabled,
  t,
  anchorTime,
  onAnchorChange,
  isBlocklistOpen = false,
  onToggleBlocklist,
  blockedCount = 0,
  groupByChannel = false,
  onGroupByChannelChange,
  perfMode = false,
  onPerfModeChange,
  excludeLanguages = [],
  onExcludeLanguagesChange,
  onlyLanguages = [],
  onOnlyLanguagesChange,
  playbackSpeed = 2,
  onPlaybackSpeedChange,
  keywords = [],
  onKeywordsChange
}) => {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isAnchorOpen, setIsAnchorOpen] = useState(false);
  const [isExcludeLangOpen, setIsExcludeLangOpen] = useState(false);
  const [isOnlyLangOpen, setIsOnlyLangOpen] = useState(false);
  const [isSpeedOpen, setIsSpeedOpen] = useState(false);
  const [keywordDraft, setKeywordDraft] = useState('');
  const sortRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const anchorInputRef = useRef<HTMLInputElement>(null);
  const excludeLangRef = useRef<HTMLDivElement>(null);
  const onlyLangRef = useRef<HTMLDivElement>(null);
  const speedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
      if (anchorRef.current && !anchorRef.current.contains(event.target as Node)) {
        setIsAnchorOpen(false);
      }
      if (excludeLangRef.current && !excludeLangRef.current.contains(event.target as Node)) {
        setIsExcludeLangOpen(false);
      }
      if (onlyLangRef.current && !onlyLangRef.current.contains(event.target as Node)) {
        setIsOnlyLangOpen(false);
      }
      if (speedRef.current && !speedRef.current.contains(event.target as Node)) {
        setIsSpeedOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleLanguageIn = (list: string[], code: string) =>
    list.includes(code) ? list.filter(c => c !== code) : [...list, code];

  /**
   * Acepta varias de golpe separadas por coma para poder pegar una lista, y se
   * come los duplicados comparando en minusculas (que "ACE" y "ace" acaben
   * siendo dos fichas distintas no ayuda a nadie).
   */
  const commitKeywordDraft = () => {
    if (!onKeywordsChange) return;
    const nuevas = keywordDraft
      .split(',')
      .map(w => w.trim())
      .filter(Boolean);
    if (nuevas.length === 0) return;
    const vistas = new Set(keywords.map(w => w.toLowerCase()));
    const salida = [...keywords];
    for (const palabra of nuevas) {
      if (vistas.has(palabra.toLowerCase())) continue;
      vistas.add(palabra.toLowerCase());
      salida.push(palabra);
    }
    onKeywordsChange(salida);
    setKeywordDraft('');
  };

  useEffect(() => {
    if (!isAnchorOpen) return;
    // Esperamos a que termine la animación de entrada (duration-100) para que el navegador
    // calcule bien la posición del input antes de anclar el calendario nativo a él;
    // si se llama antes, algunos navegadores lo dibujan en la esquina superior izquierda.
    const timeoutId = setTimeout(() => {
      try {
        (anchorInputRef.current as any)?.showPicker?.();
      } catch {
        // showPicker requiere gesto directo del usuario en algunos navegadores; el input sigue siendo clicable
      }
    }, 150);
    return () => clearTimeout(timeoutId);
  }, [isAnchorOpen]);

  return (
    <div className="bg-twitch-surface rounded-xl border border-twitch-surfaceAlt mb-8 shadow-sm">

      {/* Primary row: time range + sort/actions.
          flex-wrap y min-w-0 en los dos grupos: sin ellos, en anchos intermedios
          (y más ahora que los raíles de anuncios se llevan 440px) los hijos no
          encogen ni saltan de línea, y el último botón se salía del recuadro. */}
      <div className="flex flex-col lg:flex-row lg:flex-wrap lg:items-center justify-between gap-3 lg:gap-4 p-4">

        <div className="flex items-center gap-3 w-full lg:w-auto min-w-0">
          <div className="p-2 bg-twitch-surfaceAlt rounded-lg hidden sm:block">
              <Clock className="w-5 h-5 text-twitch-base" />
          </div>
          <div className="grid grid-cols-2 lg:flex lg:flex-row gap-1 bg-twitch-black p-1 rounded-lg flex-grow lg:flex-none">
            {Object.values(TimeFilter).map((filter) => (
              <button
                key={filter}
                onClick={() => onTimeChange(filter)}
                disabled={disabled}
                className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-all font-medium whitespace-nowrap sm:flex-1 lg:flex-none cursor-pointer hover:scale-105 active:scale-95 ${
                  currentTime === filter
                    ? 'bg-twitch-base text-[var(--color-accent-ink)] shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-twitch-surfaceAlt'
                }`}
              >
                {t(`time_${filter}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 w-full lg:w-auto min-w-0">

          {!disabled && (
              <button
                  onClick={onLoadAll}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 w-full sm:flex-1 lg:flex-none lg:w-auto px-4 py-2.5 bg-gradient-to-r from-twitch-base/10 to-twitch-base/5 hover:from-twitch-base/20 hover:to-twitch-base/10 border border-twitch-base/30 hover:border-twitch-base text-twitch-base hover:text-white rounded-lg transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:scale-105 active:scale-95 shadow-lg hover:shadow-twitch-base/20"
                  title={t('load_all')}
              >
                  {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                      <div className="relative h-4 w-4">
                          <ChevronsDown className="w-4 h-4 absolute inset-0 group-hover:animate-bounce" style={{ animationDuration: '1.5s' }} />
                      </div>
                  )}
                  <span className="text-sm font-bold whitespace-nowrap lg:inline">{t('load_all')}</span>
              </button>
          )}

          <div className="w-px h-8 bg-twitch-surfaceAlt mx-1 hidden lg:block"></div>

          <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] hidden lg:inline-block">{t('sort_by')}</span>

          <div className="relative w-full sm:flex-1 lg:flex-none lg:w-40 xl:w-48" ref={sortRef}>
              <button
                  onClick={() => !disabled && setIsSortOpen(!isSortOpen)}
                  disabled={disabled}
                  className={`w-full flex items-center justify-between bg-twitch-black text-gray-200 text-sm rounded-lg border px-3 py-2.5 transition-all cursor-pointer hover:border-twitch-base group/sort ${
                      isSortOpen ? 'border-twitch-base ring-1 ring-twitch-base' : 'border-twitch-surfaceAlt hover:bg-twitch-surfaceAlt/50'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                  <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-twitch-base" />
                      <span>{t(`sort_${currentSort}`)}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSortOpen && (
                  <div className="absolute top-full right-0 mt-2 w-full bg-twitch-surfaceAlt border border-twitch-surfaceAlt rounded-lg shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                      {Object.values(SortType).map((sort) => (
                          <button
                              key={sort}
                              onClick={() => {
                                  onSortChange(sort);
                                  setIsSortOpen(false);
                              }}
                              className="w-full text-left px-3 py-2.5 text-sm hover:bg-twitch-base hover:text-[var(--color-accent-ink)] transition-colors flex items-center justify-between group cursor-pointer"
                          >
                              <span>{t(`sort_${sort}`)}</span>
                              {currentSort === sort && <Check className="w-4 h-4 text-twitch-base group-hover:text-white" />}
                          </button>
                      ))}
                  </div>
              )}
          </div>

          {onToggleBlocklist && (
            <button
              onClick={onToggleBlocklist}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-3.5 py-2 text-sm rounded-lg border transition-all cursor-pointer hover:scale-105 active:scale-95 whitespace-nowrap ${
                isBlocklistOpen
                  ? 'bg-red-600/20 border-red-500 text-red-400 hover:bg-red-600/30'
                  : 'bg-twitch-black border-twitch-surfaceAlt hover:border-red-500/40 text-gray-200 hover:text-red-400'
              }`}
            >
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              {/* El rótulo se cae entre lg y xl, que es donde menos sitio hay:
                  el icono y el contador ya dicen lo que hace. */}
              <span className="lg:hidden xl:inline">{t('blocklist')}</span>
              {blockedCount > 0 && <span className="tabular-nums">({blockedCount})</span>}
            </button>
          )}
        </div>
      </div>

      {/* Secondary row: refinement filters */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-t border-twitch-surfaceAlt/60 bg-twitch-black/20 rounded-b-xl">
        <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mr-1 hidden sm:inline-block">
          {t('filters_label') || 'Filters'}
        </span>

        {onAnchorChange && currentTime !== TimeFilter.ALL && (
          <div className="relative" ref={anchorRef}>
            <button
              onClick={() => !disabled && setIsAnchorOpen(!isAnchorOpen)}
              disabled={disabled}
              title={t('anchor_until')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md transition-all font-medium whitespace-nowrap cursor-pointer hover:scale-105 active:scale-95 border ${
                anchorTime
                  ? 'bg-twitch-base/10 border-twitch-base/40 text-twitch-base'
                  : 'border-transparent text-gray-500 hover:text-white hover:bg-twitch-surfaceAlt'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <CalendarClock className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">{anchorTime ? new Date(anchorTime).toLocaleString() : t('anchor_until')}</span>
              {anchorTime && (
                <X
                  className="w-3.5 h-3.5 hover:text-white flex-shrink-0"
                  onClick={(e) => { e.stopPropagation(); onAnchorChange(null); setIsAnchorOpen(false); }}
                />
              )}
            </button>

            {isAnchorOpen && (
              <div className="absolute top-full right-0 sm:left-0 sm:right-auto mt-2 w-64 max-w-[calc(100vw-2rem)] bg-twitch-surfaceAlt border border-twitch-surfaceAlt rounded-lg shadow-xl z-20 p-3 animate-in fade-in zoom-in-95 duration-100">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('anchor_until')}</label>
                <input
                  ref={anchorInputRef}
                  type="datetime-local"
                  defaultValue={toDatetimeLocalValue(anchorTime ? new Date(anchorTime) : new Date())}
                  max={toDatetimeLocalValue(new Date())}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    onAnchorChange(new Date(e.target.value).toISOString());
                  }}
                  style={{ colorScheme: 'dark' }}
                  className="w-full bg-twitch-black text-gray-200 text-sm rounded-lg border border-twitch-surfaceAlt px-2 py-2 focus:border-twitch-base focus:ring-1 focus:ring-twitch-base outline-none cursor-pointer"
                />
                {anchorTime && (
                  <button
                    onClick={() => { onAnchorChange(null); setIsAnchorOpen(false); }}
                    className="mt-2 w-full text-xs text-gray-400 hover:text-white text-center py-1 cursor-pointer"
                  >
                    {t('anchor_clear')}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {onGroupByChannelChange && (
          <button
            onClick={() => onGroupByChannelChange(!groupByChannel)}
            disabled={disabled}
            title={t('group_by_channel_desc') || 'Agrupar clips por canal'}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm rounded-md transition-all font-medium whitespace-nowrap cursor-pointer hover:scale-105 active:scale-95 border ${
              groupByChannel
                ? 'bg-twitch-base border-twitch-base text-[var(--color-accent-ink)] shadow-md'
                : 'border-twitch-surfaceAlt bg-twitch-black text-gray-400 hover:text-white hover:bg-twitch-surfaceAlt'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Users className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">{t('group_by_channel') || 'Agrupar canales'}</span>
          </button>
        )}

        {onPerfModeChange && (
          <button
            onClick={() => onPerfModeChange(!perfMode)}
            disabled={disabled}
            title={t('perf_mode_desc')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm rounded-md transition-all font-medium whitespace-nowrap cursor-pointer hover:scale-105 active:scale-95 border ${
              perfMode
                ? 'bg-twitch-base border-twitch-base text-[var(--color-accent-ink)] shadow-md'
                : 'border-twitch-surfaceAlt bg-twitch-black text-gray-400 hover:text-white hover:bg-twitch-surfaceAlt'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Gauge className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">{t('perf_mode')}</span>
          </button>
        )}

        {onPlaybackSpeedChange && (
          <div className="relative" ref={speedRef}>
            <button
              onClick={() => !disabled && setIsSpeedOpen(!isSpeedOpen)}
              disabled={disabled}
              title={t('playback_speed_desc')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm rounded-md transition-all font-medium whitespace-nowrap cursor-pointer hover:scale-105 active:scale-95 border ${
                playbackSpeed !== 1
                  ? 'bg-twitch-base border-twitch-base text-[var(--color-accent-ink)] shadow-md'
                  : 'border-twitch-surfaceAlt bg-twitch-black text-gray-400 hover:text-white hover:bg-twitch-surfaceAlt'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <FastForward className="w-4 h-4 flex-shrink-0" />
              <span>{playbackSpeed}x</span>
              <span className="hidden sm:inline">{t('playback_speed')}</span>
            </button>

            {isSpeedOpen && (
              <div className="absolute top-full left-0 mt-2 w-40 max-w-[calc(100vw-2rem)] bg-twitch-surfaceAlt border border-twitch-surfaceAlt rounded-lg shadow-xl z-30 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                {PLAYBACK_SPEEDS.map((speed) => {
                  const active = playbackSpeed === speed;
                  return (
                    <button
                      key={speed}
                      onClick={() => { onPlaybackSpeedChange(speed); setIsSpeedOpen(false); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-twitch-base hover:text-[var(--color-accent-ink)] transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <span>{speed}x{speed === 1 ? ` (${t('playback_speed_normal')})` : ''}</span>
                      {active && <Check className="w-4 h-4 text-twitch-base group-hover:text-white flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {onOnlyLanguagesChange && (
          <div className="relative" ref={onlyLangRef}>
            <button
              onClick={() => !disabled && setIsOnlyLangOpen(!isOnlyLangOpen)}
              disabled={disabled}
              title={t('only_languages_desc')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm rounded-md transition-all font-medium whitespace-nowrap cursor-pointer hover:scale-105 active:scale-95 border ${
                onlyLanguages.length > 0
                  ? 'bg-twitch-base border-twitch-base text-[var(--color-accent-ink)] shadow-md'
                  : 'border-twitch-surfaceAlt bg-twitch-black text-gray-400 hover:text-white hover:bg-twitch-surfaceAlt'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Languages className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">{t('only_languages')}{onlyLanguages.length > 0 ? ` (${onlyLanguages.length})` : ''}</span>
            </button>

            {isOnlyLangOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 max-w-[calc(100vw-2rem)] bg-twitch-surfaceAlt border border-twitch-surfaceAlt rounded-lg shadow-xl z-30 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                  {CLIP_LANGUAGES.map(({ code, label }) => {
                    const active = onlyLanguages.includes(code);
                    return (
                      <button
                        key={code}
                        onClick={() => onOnlyLanguagesChange(toggleLanguageIn(onlyLanguages, code))}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-twitch-base hover:text-[var(--color-accent-ink)] transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <span>{label}</span>
                        {active && <Check className="w-4 h-4 text-twitch-base group-hover:text-white flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                {onlyLanguages.length > 0 && (
                  <button
                    onClick={() => onOnlyLanguagesChange([])}
                    className="w-full text-center px-3 py-2 text-xs font-bold text-gray-400 hover:text-white hover:bg-twitch-black transition-colors cursor-pointer border-t border-twitch-black"
                  >
                    {t('clear_selection')}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {onExcludeLanguagesChange && (
          <div className="relative" ref={excludeLangRef}>
            <button
              onClick={() => !disabled && setIsExcludeLangOpen(!isExcludeLangOpen)}
              disabled={disabled}
              title={t('exclude_languages_desc')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm rounded-md transition-all font-medium whitespace-nowrap cursor-pointer hover:scale-105 active:scale-95 border ${
                excludeLanguages.length > 0
                  ? 'bg-red-600 border-red-600 text-white shadow-md'
                  : 'border-twitch-surfaceAlt bg-twitch-black text-gray-400 hover:text-white hover:bg-twitch-surfaceAlt'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Ban className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">{t('exclude_languages')}{excludeLanguages.length > 0 ? ` (${excludeLanguages.length})` : ''}</span>
            </button>

            {isExcludeLangOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 max-w-[calc(100vw-2rem)] bg-twitch-surfaceAlt border border-twitch-surfaceAlt rounded-lg shadow-xl z-30 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                  {CLIP_LANGUAGES.map(({ code, label }) => {
                    const active = excludeLanguages.includes(code);
                    return (
                      <button
                        key={code}
                        onClick={() => onExcludeLanguagesChange(toggleLanguageIn(excludeLanguages, code))}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-red-600 hover:text-white transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <span>{label}</span>
                        {active && <Check className="w-4 h-4 text-red-500 group-hover:text-white flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                {excludeLanguages.length > 0 && (
                  <button
                    onClick={() => onExcludeLanguagesChange([])}
                    className="w-full text-center px-3 py-2 text-xs font-bold text-gray-400 hover:text-white hover:bg-twitch-black transition-colors cursor-pointer border-t border-twitch-black"
                  >
                    {t('clear_selection')}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filtro por palabras del titulo, en su propia fila: las fichas crecen
          con cada palabra y en la fila de arriba empujarian todo lo demas. */}
      {onKeywordsChange && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 pb-4 -mt-1">
          <div className="flex items-center gap-2 flex-shrink-0" title={t('keywords_hint')}>
            <div className="p-2 bg-twitch-surfaceAlt rounded-lg hidden sm:block">
              <Type className="w-5 h-5 text-twitch-base" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{t('keywords')}</span>
          </div>

          <form
            className="flex-grow min-w-0 flex flex-wrap items-center gap-1.5 bg-twitch-black border border-twitch-surfaceAlt rounded-lg px-2 py-1.5 focus-within:border-twitch-base transition-colors"
            onSubmit={(e) => { e.preventDefault(); commitKeywordDraft(); }}
          >
            {keywords.map(word => (
              <span key={word} className="flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-md bg-twitch-base/15 border border-twitch-base/30 text-twitch-base text-xs font-bold max-w-full">
                <span className="truncate">{word}</span>
                <button
                  type="button"
                  onClick={() => onKeywordsChange(keywords.filter(w => w !== word))}
                  title={t('delete')}
                  className="p-0.5 rounded hover:bg-twitch-base/25 transition-colors cursor-pointer flex-shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              value={keywordDraft}
              onChange={(e) => setKeywordDraft(e.target.value)}
              // Retroceso con el campo vacio quita la ultima ficha, que es lo
              // que hace cualquier campo de etiquetas y evita tener que apuntar
              // a una equis de 12px.
              onKeyDown={(e) => {
                if (e.key === 'Backspace' && keywordDraft === '' && keywords.length > 0) {
                  onKeywordsChange(keywords.slice(0, -1));
                }
              }}
              onBlur={commitKeywordDraft}
              placeholder={keywords.length > 0 ? t('keywords_add') : t('keywords_placeholder')}
              aria-label={t('keywords')}
              maxLength={40}
              className="flex-grow min-w-[8rem] bg-transparent text-sm text-white placeholder:text-gray-600 outline-none py-0.5"
            />
            {keywords.length > 0 && (
              <button
                type="button"
                onClick={() => { onKeywordsChange([]); setKeywordDraft(''); }}
                className="flex-shrink-0 px-2 py-1 text-[11px] font-bold text-gray-500 hover:text-white transition-colors cursor-pointer"
              >
                {t('clear_selection')}
              </button>
            )}
          </form>
        </div>
      )}
    </div>
);
};

export default FilterBar;
