import React, { useState, useRef, useEffect } from 'react';
import { LANGUAGES } from '../../../constants';
import { ChevronDown } from 'lucide-react';

interface LanguageSwitcherProps {
  currentLang: string;
  onLanguageChange: (lang: string) => void;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ currentLang, onLanguageChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeLang = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  return (
    <div className="relative w-full flex justify-center" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between md:justify-center w-[70%] md:w-12 h-12 md:p-0 px-8 rounded-full border border-amber-900/50 bg-amber-950/20 hover:bg-amber-950/40 transition-colors text-xs md:text-sm font-black text-amber-300 uppercase cursor-pointer shadow-lg outline-none"
      >
        <span className="md:hidden">{activeLang.name}</span>
        <span className="hidden md:block">{activeLang.code}</span>
        <ChevronDown className={`w-4 h-4 ml-2 transition-transform md:hidden ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-0 mt-12 w-48 bg-[#0c0802] border border-amber-950 rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="py-1">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  onLanguageChange(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center px-4 py-3 text-sm hover:bg-amber-950/30 transition-colors cursor-pointer text-left ${
                  currentLang === lang.code ? 'bg-amber-950/60 text-white' : 'text-gray-300'
                }`}
              >
                <span className={`font-bold mr-3 w-6 uppercase text-amber-400`}>{lang.code}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
