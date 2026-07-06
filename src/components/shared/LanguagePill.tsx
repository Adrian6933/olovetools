import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToolTheme } from '../../lib/themes';
import { useReducedMotion } from './motion';

interface LanguagePillProps {
  theme: ToolTheme;
  currentLang: string;
  onLanguageChange: (lang: string) => void;
  variant?: 'topnav' | 'standalone';
}

const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'es', label: 'Español', short: 'ES' },
  { code: 'fr', label: 'Français', short: 'FR' },
  { code: 'de', label: 'Deutsch', short: 'DE' },
  { code: 'pt', label: 'Português', short: 'PT' },
  { code: 'ru', label: 'Русский', short: 'RU' },
  { code: 'hi', label: 'हिन्दी', short: 'HI' },
  { code: 'ja', label: '日本語', short: 'JA' },
  { code: 'zh', label: '中文', short: 'ZH' },
];

export const LanguagePill: React.FC<LanguagePillProps> = ({
  theme,
  currentLang,
  onLanguageChange,
  variant = 'standalone',
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  const current = LANGUAGES.find((l) => l.code === currentLang) ?? LANGUAGES[0];

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  useEffect(() => {
    localStorage.setItem('olovetools_lang', currentLang);
  }, [currentLang]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg transition-all hover:scale-105 active:scale-95"
        style={{
          backgroundColor: `${theme.primaryHex}15`,
          color: theme.text,
          border: `1px solid ${theme.border}`,
        }}
        aria-label="Change language"
      >
        <span
          className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black uppercase"
          style={{ backgroundColor: theme.primaryHex, color: '#fff' }}
        >
          {current.short}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          style={{ color: theme.textMuted }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: prefersReduced ? 0 : -6, scale: prefersReduced ? 1 : 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: prefersReduced ? 0 : -6, scale: prefersReduced ? 1 : 0.95 }}
            transition={{ duration: prefersReduced ? 0.05 : 0.15 }}
            className={`absolute right-0 mt-2 w-44 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl z-50 ${
              variant === 'topnav' ? 'mt-1' : ''
            }`}
            style={{
              backgroundColor: `${theme.bg}f5`,
              border: `1px solid ${theme.border}`,
            }}
          >
            <div className="py-1 max-h-80 overflow-y-auto">
              {LANGUAGES.map((lang) => {
                const isActive = lang.code === currentLang;
                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onLanguageChange(lang.code);
                      setOpen(false);
                    }}
                    className="w-full px-3 py-2 flex items-center gap-2.5 text-xs font-medium transition-colors text-left"
                    style={{
                      backgroundColor: isActive ? `${theme.primaryHex}20` : 'transparent',
                      color: isActive ? theme.primaryHex : theme.text,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = `${theme.primaryHex}10`;
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span
                      className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black uppercase shrink-0"
                      style={{
                        backgroundColor: isActive ? theme.primaryHex : `${theme.primaryHex}20`,
                        color: isActive ? '#fff' : theme.textMuted,
                      }}
                    >
                      {lang.short}
                    </span>
                    <span className="flex-1 truncate">{lang.label}</span>
                    {isActive && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: theme.primaryHex }} />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
