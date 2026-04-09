

import React, { useState, useRef, useEffect } from 'react';
import { Heart, ChevronDown } from 'lucide-react';
import { useTranslation, Language } from '../../../locales/dictionary';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onHomeClick: () => void;
}

const languages: { code: Language; color: string }[] = [
  { code: 'en', color: 'text-indigo-400' },
  { code: 'es', color: 'text-orange-400' },
  { code: 'hi', color: 'text-orange-500' },
  { code: 'de', color: 'text-yellow-400' },
  { code: 'fr', color: 'text-blue-400' },
  { code: 'pt', color: 'text-green-400' },
  { code: 'ru', color: 'text-red-400' },
  { code: 'ja', color: 'text-pink-400' },
  { code: 'zh', color: 'text-red-500' },
];

const getParamFromLanguage = (lang: Language): string => {
  if (lang === 'en') return '';
  return lang.toLowerCase();
};

const Header: React.FC<HeaderProps> = ({ language, onLanguageChange, onHomeClick }) => {
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
  const { dictionary } = useTranslation(language, 'formatflow');

  return (
    <header className="w-full h-16 sm:h-24 border-b border-slate-800 bg-[#0B0F17] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto h-full px-3 sm:px-6 flex items-center justify-between">
        
        {/* Left Side: Logos & Branding */}
        <div className="flex items-center flex-1 min-w-0">
          
          {/* oLoveTools Link */}
          <a 
            href={`/${language}`} 
            className="flex items-center gap-1.5 sm:gap-4 group flex-shrink-0"
          >
            <div className="bg-primary rounded-md sm:rounded-lg p-1 sm:p-2.5 shadow-[0_0_15px_-3px_rgba(99,102,241,0.6)] group-hover:shadow-[0_0_20px_-3px_rgba(99,102,241,0.8)] transition-all">
               <Heart className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-white fill-white" />
            </div>
            <span className="text-lg sm:text-3xl font-display font-extrabold tracking-tight">
              <span className="text-white">oLove</span>
              <span className="text-love">Tools</span>
            </span>
          </a>

          {/* Separator - Visible always */}
          <div className="h-6 sm:h-10 w-px bg-slate-800 mx-2 sm:mx-6 flex-shrink-0"></div>

          {/* FormatFlow Branding */}
          <a 
            href={`/${language}/formatflow`}
            onClick={onHomeClick}
            className="flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity focus:outline-none min-w-0"
          >
            {/* App Icon (The 'Emoji') */}
            <div className="bg-secondary/20 p-1 sm:p-2 rounded-lg border border-secondary/30 flex-shrink-0">
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
            <span className="text-sm sm:text-lg font-display font-bold text-slate-200 truncate leading-tight">
              FormatFlow
            </span>
          </a>
        </div>
        
        {/* Right Side - Language Selector */}
        <div className="relative flex-shrink-0 ml-2" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs sm:text-base font-bold text-slate-300 hover:text-white hover:border-slate-500 hover:bg-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {language}
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-3 w-64 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl py-2 animate-fade-in flex flex-col z-50 overflow-hidden">
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
                     className={`w-full text-left px-5 py-3.5 text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-4
                       ${language === lang.code ? 'bg-slate-800/50' : ''}
                     `}
                   >
                     <span className={`font-bold w-6 text-base ${lang.color}`}>{lang.code}</span>
                     <span className="text-slate-200 text-base">{dictionary.languageName}</span>
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
