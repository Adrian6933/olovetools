
import React, { useState, useRef, useEffect } from 'react';
import { TimeFilter, SortType } from '../types';
import { Clock, TrendingUp, ChevronDown, Check, ChevronsDown, Loader2, CalendarClock, X, ShieldAlert, Users } from 'lucide-react';

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
  onGroupByChannelChange
}) => {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isAnchorOpen, setIsAnchorOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const anchorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
      if (anchorRef.current && !anchorRef.current.contains(event.target as Node)) {
        setIsAnchorOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between bg-twitch-surface p-4 rounded-xl border border-twitch-surfaceAlt mb-8 shadow-sm">
      
      <div className="flex items-center gap-3 w-full lg:w-auto">
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
                  ? 'bg-twitch-base text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-twitch-surfaceAlt'
              }`}
            >
              {t(`time_${filter}`)}
            </button>
          ))}
        </div>

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
                ? 'bg-twitch-base border-twitch-base text-white shadow-md'
                : 'border-twitch-surfaceAlt bg-twitch-black text-gray-400 hover:text-white hover:bg-twitch-surfaceAlt'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Users className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">{t('group_by_channel') || 'Agrupar canales'}</span>
          </button>
        )}
      </div>

      <div className="h-px w-full bg-twitch-surfaceAlt opacity-50 lg:hidden"></div>

      <div className="flex flex-col lg:flex-row items-center gap-4 w-full lg:w-auto">
        <div className="w-px h-8 bg-twitch-surfaceAlt mx-2 hidden lg:block opacity-30"></div>
        

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
        
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
        
        <div className="relative w-full sm:flex-1 lg:flex-none lg:w-48" ref={sortRef}>
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
                            className="w-full text-left px-3 py-2.5 text-sm hover:bg-twitch-base hover:text-white transition-colors flex items-center justify-between group cursor-pointer"
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
            <ShieldAlert className="w-4 h-4" />
            <span>{t('blocklist') || 'Ocultados'} {blockedCount > 0 ? `(${blockedCount})` : ''}</span>
          </button>
        )}
      </div>
    </div>
  </div>
);
};

export default FilterBar;
