import React from 'react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { propsAbrirEnOtraPestana, withScrollToTop } from '../../../lib/softReset';

interface HeaderProps {
  currentLang: string;
  onLanguageChange: (lang: string) => void;
  /** Deja la herramienta como recien abierta. */
  onReset?: () => void;
  t: any;
}

const HeartIcon = () => (
  <svg className="w-5 h-5 md:w-7 md:h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

/** The tool's own mark: a playhead over a timeline. */
const PlayheadIcon = () => (
  <svg className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M4 18h16" strokeWidth="2" strokeLinecap="round" opacity="0.45" />
    <path d="M9 5.5l8 5-8 5v-10z" fill="currentColor" stroke="none" />
    <path d="M12 15v5" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const Header: React.FC<HeaderProps> = ({ currentLang, onLanguageChange, onReset, t }) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none">
      <header className="w-full h-auto md:h-24 py-3 md:py-0 border-b border-white/10 bg-[#05050a]/95 backdrop-blur-3xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] pointer-events-auto">
        <div className="max-w-7xl mx-auto h-full px-3 md:px-12 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0">
          {/* The brand and the tool name have to share ~343px of usable width on
              a 375px phone, so both shrink and the tool name is allowed to
              truncate rather than push the row wider than the viewport. */}
          <div className="flex items-center justify-between w-full md:w-auto gap-2 md:gap-8 min-w-0">
            <a
              href={`/${currentLang.toLowerCase()}`}
              className="flex items-center gap-1.5 md:gap-3 group outline-none shrink-0"
            >
              <div className="w-8 h-8 md:w-11 md:h-11 bg-red-600 rounded-lg md:rounded-2xl flex items-center justify-center group-hover:bg-red-500 transition-all shadow-lg shadow-red-600/40">
                <HeartIcon />
              </div>
              <div className="text-lg md:text-3xl font-black tracking-tighter">
                <span className="text-white">oLove</span>
                <span className="text-red-400">Tools</span>
              </div>
            </a>

            <div className="h-8 w-px bg-white/10 hidden md:block" />

            <button
              type="button"
              onClick={withScrollToTop(onReset)} {...propsAbrirEnOtraPestana}
              title={t?.resetHint || "Start over"}
              aria-label={t?.resetHint || "Start over"}
              className="flex items-center gap-1.5 md:gap-3 group outline-none min-w-0 bg-transparent border-none outline-none cursor-pointer transition-opacity hover:opacity-75 focus-visible:opacity-75"
            >
              <div className="w-7 h-7 md:w-9 md:h-9 shrink-0 bg-white/5 rounded-lg md:rounded-xl flex items-center justify-center border border-white/10 group-hover:border-indigo-500/50 transition-all">
                <PlayheadIcon />
              </div>
              <span className="text-base md:text-2xl font-black text-white tracking-tight group-hover:text-indigo-400 transition-all truncate">
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
