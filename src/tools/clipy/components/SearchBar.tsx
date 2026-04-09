import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, Trash2 } from 'lucide-react';
import { fetchTwitchSuggestions } from '../services/geminiService';

interface SearchBarProps {
  onSearch: (query: string) => void;
  query?: string;
  isLoading: boolean;
  t: (key: string) => string;
}

const STORAGE_KEY_HISTORY = 'clipy_search_history';

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, query, isLoading, t }) => {
  const [term, setTerm] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        setHistory([]);
      }
    }
  }, []);

  // Sync internal term with external query
  useEffect(() => {
    if (query === 'popular' || !query) {
      setTerm('');
    } else {
      setTerm(query);
    }
  }, [query]);

  // Handle suggestions and dropdown state
  useEffect(() => {
    if (term.trim().length > 0) {
      // Debounce Twitch fetch
      const timer = setTimeout(async () => {
        const twitchResults = await fetchTwitchSuggestions(term);
        setSuggestions(twitchResults);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
    }
  }, [term]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveToHistory = (newTerm: string) => {
    if (!newTerm.trim() || newTerm === 'popular' || newTerm.includes('twitch.tv')) return;
    
    setHistory(prev => {
      const filtered = prev.filter(h => h.toLowerCase() !== newTerm.toLowerCase());
      const updated = [newTerm, ...filtered].slice(0, 5); // Keep last 5
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromHistory = (e: React.MouseEvent, hTerm: string) => {
    e.stopPropagation();
    setHistory(prev => {
      const updated = prev.filter(h => h !== hTerm);
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (term.trim()) {
      saveToHistory(term);
      onSearch(term);
      setShowDropdown(false);
    }
  };

  const handleItemClick = (selectedTerm: string) => {
    saveToHistory(selectedTerm);
    setTerm(selectedTerm);
    onSearch(selectedTerm);
    setShowDropdown(false);
  };

  const hasContent = term.length > 0 ? (suggestions.length > 0) : (history.length > 0);

  return (
    <div ref={wrapperRef} className="w-full relative group h-12 md:h-14 m-0 p-0 flex items-center">
      <form onSubmit={handleSubmit} className="relative w-full h-full m-0 p-0 z-50">
        <div className="absolute inset-y-0 left-0 pl-5 md:pl-7 flex items-center pointer-events-none z-10 opacity-70">
          <Search className={`h-6 w-6 md:h-7 md:w-7 transition-all duration-500 text-twitch-base`} />
        </div>
        <input
          type="text"
          className={`block w-full h-full m-0 pl-14 md:pl-20 pr-14 bg-[#15151b] text-white text-base md:text-xl placeholder-gray-500/50 focus:outline-none focus:ring-4 focus:ring-twitch-base/10 border-2 border-white/5 focus:border-twitch-base/30 transition-all duration-500 ${
            showDropdown && hasContent ? 'rounded-t-[1.5rem] md:rounded-t-[2rem]' : 'rounded-[1.5rem] md:rounded-[2rem]'
          }`}
          placeholder={t('search_placeholder')}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onFocus={() => setShowDropdown(true)}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 md:pr-7">
           {isLoading ? (
             <div className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-twitch-base border-t-transparent animate-spin"></div>
           ) : term ? (
             <button type="button" onClick={() => { setTerm(''); onSearch('popular'); }} className="p-1.5 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-all transform active:scale-75">
               <X className="h-5 w-5 md:h-6 md:w-6" />
             </button>
           ) : null}
        </div>
      </form>
      
      {showDropdown && hasContent && (
        <div className="absolute top-full left-0 w-full bg-[#0c0c0f] border-2 border-white/5 border-t-0 rounded-b-[1.5rem] md:rounded-b-[2rem] shadow-[0_40px_80px_-10px_rgba(0,0,0,0.9)] overflow-hidden z-[40] animate-in fade-in slide-in-from-top-2 duration-300">
          <ul className="flex flex-col py-2">
            {/* History Section */}
            {term.length === 0 && history.length > 0 && (
              <>
                <div className="px-6 pt-2 pb-1 text-[10px] font-black text-gray-600 uppercase tracking-widest">{t('recent_searches')}</div>
                {history.map((h, index) => (
                  <li key={`hist-${index}`} className="px-2">
                    <button
                      className="w-full text-left px-5 py-3 hover:bg-white/5 text-gray-400 hover:text-white transition-all flex items-center justify-between gap-4 text-base font-bold rounded-xl group"
                      onClick={() => handleItemClick(h)}
                    >
                      <div className="flex items-center gap-4 truncate">
                        <Clock className="w-4 h-4 opacity-30 group-hover:opacity-100 transition-all flex-shrink-0" />
                        <span className="truncate">{h}</span>
                      </div>
                      <button 
                        onClick={(e) => removeFromHistory(e, h)} 
                        className="p-2 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-500 transition-all rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </button>
                  </li>
                ))}
              </>
            )}

            {/* Suggestions Section */}
            {term.length > 0 && suggestions.map((s, index) => (
              <li key={`sugg-${index}`} className="px-2">
                <button
                  className="w-full text-left px-5 py-4 md:py-3.5 hover:bg-twitch-base/5 text-gray-300 hover:text-white transition-all flex items-center gap-4 text-base md:text-lg font-bold rounded-xl group border-l-4 border-transparent hover:border-twitch-base active:bg-twitch-base/10"
                  onClick={() => handleItemClick(s)}
                >
                  <Search className="w-5 h-5 opacity-30 group-hover:opacity-100 group-hover:text-twitch-base transition-all flex-shrink-0" />
                  <span className="truncate">{s}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchBar;