

import React, { useState, useRef, useEffect } from 'react';
import { Heart, ChevronDown } from 'lucide-react';
import type { Language } from '../../../locales/meta';
import { withScrollToTop } from '../../../lib/softReset';

interface HeaderProps {
  language: Language;
  dictionary?: any;
  onLanguageChange: (lang: Language) => void;
  onHomeClick: () => void;
}

const languages: { code: Language; name: string; color: string }[] = [
  { code: 'en', name: 'English', color: 'text-indigo-400' },
  { code: 'es', name: 'Español', color: 'text-orange-400' },
  { code: 'hi', name: 'हिन्दी', color: 'text-orange-500' },
  { code: 'de', name: 'Deutsch', color: 'text-yellow-400' },
  { code: 'fr', name: 'Français', color: 'text-blue-400' },
  { code: 'pt', name: 'Português', color: 'text-green-400' },
  { code: 'ru', name: 'Русский', color: 'text-red-400' },
  { code: 'ja', name: '日本語', color: 'text-pink-400' },
  { code: 'zh', name: '中文', color: 'text-red-500' },
];

const getParamFromLanguage = (lang: Language): string => {
  if (lang === 'en') return '';
  return lang.toLowerCase();
};

const Header: React.FC<HeaderProps> = ({ language, dictionary: propDictionary, onLanguageChange, onHomeClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const currentLang = languages.find(l => l.code === language) || languages[0];
  const dictionary = propDictionary || {};

  return (
    <header className="w-full h-auto sm:h-24 py-4 sm:py-0 border-b border-slate-800 bg-[#0B0F17] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
        
        {/* Left Side: Logos & Branding */}
        <div className="flex items-center justify-center sm:justify-between w-full sm:w-auto space-x-2 sm:space-x-6">
          <div className="flex items-center gap-1.5 sm:gap-4">
            {/* oLoveTools Link */}
            <a 
              href={`/${language}`} 
              className="flex items-center gap-1.5 sm:gap-3 group flex-shrink-0"
            >
              <div className="bg-primary rounded-md sm:rounded-lg p-1 sm:p-2 shadow-[0_0_15px_-3px_rgba(99,102,241,0.6)] group-hover:shadow-[0_0_20px_-3px_rgba(99,102,241,0.8)] transition-all">
                 <Heart className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white fill-white" />
              </div>
              <span className="text-xl sm:text-2xl font-display font-extrabold tracking-tight">
                <span className="text-white">oLove</span>
                <span className="text-love">Tools</span>
              </span>
            </a>

            {/* Separator */}
            <div className="h-6 sm:h-10 w-px bg-slate-800 mx-1 sm:mx-4 flex-shrink-0"></div>

            {/* FormatFlow Branding */}
            <button
              type="button"
              onClick={withScrollToTop(onHomeClick)}
              title="Start over"
              aria-label="Start over"
              className="flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity focus:outline-none min-w-0 bg-transparent border-none outline-none cursor-pointer transition-opacity hover:opacity-75 focus-visible:opacity-75"
            >
              <div className="bg-secondary/20 p-1 sm:p-1.5 rounded-lg border border-secondary/30 flex-shrink-0">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="w-4 h-4 sm:w-5 sm:h-5 text-secondary"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="9" cy="9" r="2"/>
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                </svg>
              </div>
              <span className="text-base sm:text-lg font-display font-bold text-slate-200 truncate leading-tight">
                FormatFlow
              </span>
            </button>
          </div>
        </div>
        
        {/* Right Side - Language Selector */}
        <div className="relative w-full sm:w-auto flex justify-center" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-[70%] sm:w-12 h-10 sm:h-12 sm:p-0 px-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-between sm:justify-center text-xs sm:text-base font-black text-slate-300 hover:text-white hover:border-slate-500 hover:bg-slate-700 transition-all focus:outline-none cursor-pointer shadow-lg outline-none"
          >
            <span className="sm:hidden uppercase">{currentLang.name}</span>
            <span className="hidden sm:block uppercase">{language}</span>
            <ChevronDown className={`w-4 h-4 ml-2 transition-transform sm:hidden ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isMenuOpen && (
            <div className="absolute left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-0 mt-12 w-64 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl py-2 animate-fade-in flex flex-col z-50 overflow-hidden">
               {languages.map((lang) => {
                 const toPath = `/${lang.code}/formatflow`;
                 return (
                   <a
                     key={lang.code}
                     href={toPath}
                     onClick={() => {
                       onLanguageChange(lang.code);
                       setIsMenuOpen(false);
                     }}
                     className={`w-full text-left px-5 py-3.5 text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-4 cursor-pointer
                       ${language === lang.code ? 'bg-slate-800/50' : ''}
                     `}
                   >
                     <span className={`font-bold w-6 text-base ${lang.color}`}>{lang.code}</span>
                     <span className="text-slate-200 text-base">{lang.name}</span>
                   </a>
                 );
               })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
