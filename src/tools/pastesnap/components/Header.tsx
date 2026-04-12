
import React from 'react';
import { LanguageSwitcher } from './LanguageSwitcher';

interface HeaderProps {
  currentLang: string;
  onLanguageChange: (lang: string) => void;
  onReset: () => void;
  t: any;
}

const HeartIcon = () => (
  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const ImageIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

export const Header: React.FC<HeaderProps> = ({ currentLang, onLanguageChange, onReset, t }) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none">
      <header className="w-full h-24 border-b border-white/10 bg-[#0c0e1a]/95 backdrop-blur-3xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] pointer-events-auto">
        <div className="max-w-7xl mx-auto h-full px-6 md:px-12 flex items-center justify-between">
          <div className="flex items-center space-x-6 md:space-x-12">
            {/* Branding oLoveTools */}
            <a 
              href={`/${currentLang.toLowerCase()}`}
              className="flex items-center space-x-3 group outline-none shrink-0"
            >
              <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500 transition-all group-hover:rotate-6 group-hover:scale-110 shadow-lg shadow-indigo-600/40">
                <HeartIcon />
              </div>
              <div className="text-2xl md:text-3xl font-black tracking-tighter transition-all group-hover:scale-105">
                <span className="text-white">oLove</span>
                <span className="text-[#f472b6]">Tools</span>
              </div>
            </a>

            <div className="h-10 w-px bg-white/10 hidden sm:block"></div>

            {/* Current App Link */}
            <button 
              onClick={onReset}
              className="flex items-center space-x-3 group outline-none transition-all hover:translate-x-1 cursor-pointer"
            >
              <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/50 transition-all">
                <ImageIcon />
              </div>
              <span className="text-xl md:text-2xl font-black text-white tracking-tight hidden lg:inline group-hover:text-indigo-400 transition-all">
                {t.title}
              </span>
            </button>
          </div>

          <div className="flex items-center">
            <LanguageSwitcher currentLang={currentLang} onLanguageChange={onLanguageChange} />
          </div>
        </div>
      </header>
    </div>
  );
};
