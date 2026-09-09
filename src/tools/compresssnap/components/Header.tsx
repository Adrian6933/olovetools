import React from 'react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { propsAbrirEnOtraPestana, withScrollToTop } from '../../../lib/softReset';

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

const CompressIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M7 3.5l5 4.5 5-4.5" />
    <path d="M5 12h14" />
    <path d="M7 20.5l5-4.5 5 4.5" />
  </svg>
);

export const Header: React.FC<HeaderProps> = ({ currentLang, onLanguageChange, onReset, t }) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none">
      <header className="w-full h-auto md:h-24 py-4 md:py-0 border-b border-white/10 bg-[#060b11]/95 backdrop-blur-3xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] pointer-events-auto">
        <div className="max-w-7xl mx-auto h-full px-3 sm:px-4 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
          <div className="flex items-center justify-between w-full md:w-auto gap-3 sm:gap-4 md:gap-12 min-w-0">
            {/* Branding oLoveTools */}
            <a 
              href={`/${currentLang.toLowerCase()}`}
              className="flex items-center gap-2 md:gap-3 group outline-none shrink-0"
            >
              <div className="w-9 h-9 md:w-11 md:h-11 bg-cyan-600 rounded-xl md:rounded-2xl flex items-center justify-center group-hover:bg-cyan-500 transition-all group-hover:rotate-6 group-hover:scale-110 shadow-lg shadow-cyan-600/40">
                <HeartIcon />
              </div>
              <div className="hidden sm:block text-2xl md:text-3xl font-black tracking-tighter transition-all group-hover:scale-105">
                <span className="text-white">oLove</span>
                <span className="text-cyan-400">Tools</span>
              </div>
            </a>

            <div className="h-8 w-px bg-white/10 hidden sm:block"></div>

            {/* Current App Link */}
            <button 
              onClick={withScrollToTop(onReset)} {...propsAbrirEnOtraPestana}
              className="flex items-center gap-2 md:gap-3 group outline-none transition-all hover:translate-x-1 cursor-pointer min-w-0"
            
              title={t.resetHint || 'Start over'}
              aria-label={t.resetHint || 'Start over'}
            >
              <div className="w-8 h-8 md:w-9 md:h-9 bg-white/5 rounded-lg md:rounded-xl flex items-center justify-center border border-white/10 group-hover:bg-cyan-500/20 group-hover:border-cyan-500/50 transition-all">
                <CompressIcon />
              </div>
              <span className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight group-hover:text-cyan-400 transition-all truncate">
                {t.title}
              </span>
            </button>
          </div>

          <div className="flex items-center justify-center w-full md:w-auto">
            <LanguageSwitcher currentLang={currentLang} onLanguageChange={onLanguageChange} />
          </div>
        </div>
      </header>
    </div>
  );
};
