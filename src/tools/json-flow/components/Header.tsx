import React from 'react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Braces } from 'lucide-react';

interface HeaderProps {
  currentLang: string;
  onLanguageChange: (lang: string) => void;
  t: any;
}

const HeartIcon = () => (
  <svg className="w-5 h-5 md:w-7 md:h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

export const Header: React.FC<HeaderProps> = ({ currentLang, onLanguageChange, t }) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none">
      <header className="w-full border-b border-white/10 bg-[#050807]/95 backdrop-blur-3xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] pointer-events-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-12 py-3 md:py-0 md:h-24 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
          {/* `min-w-0` at every level is what lets the tool name truncate at
              375px instead of pushing the row past the viewport edge. */}
          <div className="flex items-center gap-2 sm:gap-4 md:gap-8 w-full md:w-auto min-w-0">
            <a
              href={`/${currentLang.toLowerCase()}`}
              className="flex items-center gap-1.5 md:gap-3 group outline-none shrink-0"
            >
              <span className="w-8 h-8 md:w-11 md:h-11 bg-red-600 rounded-lg md:rounded-2xl flex items-center justify-center group-hover:bg-red-500 transition-all shadow-lg shadow-red-600/40">
                <HeartIcon />
              </span>
              <span className="text-lg sm:text-xl md:text-3xl font-black tracking-tighter">
                <span className="text-white">oLove</span>
                <span className="text-red-400">Tools</span>
              </span>
            </a>

            <span className="h-8 w-px bg-white/10 shrink-0" />

            {/* Deliberately not a button: the old one wiped the editor with no
                confirmation the moment you clicked the tool name. */}
            <span className="flex items-center gap-1.5 md:gap-3 min-w-0">
              <span className="w-7 h-7 md:w-9 md:h-9 shrink-0 bg-white/5 rounded-lg md:rounded-xl flex items-center justify-center border border-white/10">
                <Braces className="w-4 h-4 md:w-5 md:h-5 text-emerald-300" />
              </span>
              <span className="text-base sm:text-lg md:text-2xl font-black text-white tracking-tight truncate">
                {t.title}
              </span>
            </span>
          </div>

          <div className="flex items-center justify-center w-full md:w-auto shrink-0">
            <LanguageSwitcher currentLang={currentLang} onLanguageChange={onLanguageChange} />
          </div>
        </div>
      </header>
    </div>
  );
};
