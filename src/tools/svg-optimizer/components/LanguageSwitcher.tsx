import React from 'react';
import { FLAGS, LANGUAGE_NAMES, type Language } from '../../../locales/meta';

interface LanguageSwitcherProps {
  currentLang: string;
  onLanguageChange: (lang: string) => void;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ currentLang, onLanguageChange }) => {
  const languages: Language[] = ['en', 'es', 'fr', 'de', 'pt', 'ru', 'hi', 'ja', 'zh'];

  return (
    <div className="relative inline-block">
      <select
        value={currentLang}
        onChange={(e) => onLanguageChange(e.target.value)}
        className="appearance-none bg-white/5 border border-white/10 hover:border-cyan-500/30 text-slate-200 hover:text-white px-4 py-2.5 pr-8 rounded-xl text-xs font-bold font-sans tracking-wide cursor-pointer transition-all outline-none"
      >
        {languages.map((lang) => (
          <option key={lang} value={lang} className="bg-[#0b0f19] text-slate-200">
            {FLAGS[lang]} &nbsp; {LANGUAGE_NAMES[lang]}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  );
};
