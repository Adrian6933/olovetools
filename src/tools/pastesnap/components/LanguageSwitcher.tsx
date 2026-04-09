import React, { useState, useRef, useEffect } from 'react';
import { LANGUAGES } from '../../../constants';

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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-700 bg-gray-900/50 hover:bg-gray-800 transition-colors text-sm font-bold text-gray-300 uppercase"
      >
        {activeLang.code}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#141724] border border-gray-800 rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="py-1">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  onLanguageChange(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center px-4 py-3 text-sm hover:bg-gray-800/50 transition-colors ${
                  currentLang === lang.code ? 'bg-gray-800/80' : ''
                }`}
              >
                <span className={`font-bold mr-3 w-6 uppercase text-indigo-400`}>{lang.code}</span>
                <span className="text-gray-300">{lang.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
