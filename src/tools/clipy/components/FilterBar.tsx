
import React, { useState, useRef, useEffect } from 'react';
import { TimeFilter, SortType } from '../types';
import { Clock, TrendingUp, ChevronDown, Check, ChevronsDown, Loader2 } from 'lucide-react';

interface FilterBarProps {
  currentTime: TimeFilter;
  currentSort: SortType;
  onTimeChange: (t: TimeFilter) => void;
  onSortChange: (s: SortType) => void;
  onLoadAll: () => void;
  isLoading: boolean;
  disabled: boolean;
  t: (key: string) => string;
}

const FilterBar: React.FC<FilterBarProps> = ({
  currentTime,
  currentSort,
  onTimeChange,
  onSortChange,
  onLoadAll,
  isLoading,
  disabled,
  t
}) => {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
              className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-all font-medium whitespace-nowrap sm:flex-1 lg:flex-none ${
                currentTime === filter
                  ? 'bg-twitch-base text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-twitch-surfaceAlt'
              }`}
            >
              {t(`time_${filter}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px w-full bg-twitch-surfaceAlt opacity-50 lg:hidden"></div>

      <div className="flex flex-col lg:flex-row items-center gap-4 w-full lg:w-auto">
        <div className="w-px h-8 bg-twitch-surfaceAlt mx-2 hidden lg:block opacity-30"></div>
        

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
        
        {!disabled && (
            <button
                onClick={onLoadAll}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 w-full sm:flex-1 lg:flex-none lg:w-auto px-4 py-2.5 bg-gradient-to-r from-twitch-base/10 to-twitch-base/5 hover:from-twitch-base/20 hover:to-twitch-base/10 border border-twitch-base/30 hover:border-twitch-base text-twitch-base hover:text-white rounded-lg transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
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
                className={`w-full flex items-center justify-between bg-twitch-black text-gray-200 text-sm rounded-lg border px-3 py-2.5 transition-all ${
                    isSortOpen ? 'border-twitch-base ring-1 ring-twitch-base' : 'border-twitch-surfaceAlt hover:border-gray-500'
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
                            className="w-full text-left px-3 py-2.5 text-sm hover:bg-twitch-base hover:text-white transition-colors flex items-center justify-between group"
                        >
                            <span>{t(`sort_${sort}`)}</span>
                            {currentSort === sort && <Check className="w-4 h-4 text-twitch-base group-hover:text-white" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  </div>
);
};

export default FilterBar;
