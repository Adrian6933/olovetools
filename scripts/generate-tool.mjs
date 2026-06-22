#!/usr/bin/env node
/**
 * oLove-Generator: Tool Factory Script
 * Automatically generates the full boilerplate structure for a new oLoveTools tool.
 *
 * Usage:
 *   node scripts/generate-tool.mjs --slug=base64-bolt --name="Base64-Bolt" --color=emerald --icon=FileCode
 *   node scripts/generate-tool.mjs --slug=base64-bolt --name="Base64-Bolt" --color=emerald --icon=FileCode --batch
 *
 * The --batch flag generates placeholder dictionaries without full translations (to be filled later).
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// ─── Color Palettes ───────────────────────────────────────────────
const COLOR_PALETTES = {
  emerald: {
    hex: '#10b981', bg: '#020a08', bgGradient: '#052e22', text: '#ecfdf5',
    thumb: '#059669', thumbHover: '#10b981', glassBg: 'rgba(4, 19, 14, 0.45)',
    glowClass: 'glow-emerald', glowShadow: 'rgba(16, 185, 129, 0.35)',
    tailwindText: 'text-emerald-400', tailwindBg: 'bg-emerald-600', tailwindBorder: 'border-emerald-500',
  },
  sky: {
    hex: '#0ea5e9', bg: '#020813', bgGradient: '#082f49', text: '#f1f5f9',
    thumb: '#0284c7', thumbHover: '#0ea5e9', glassBg: 'rgba(2, 8, 20, 0.45)',
    glowClass: 'glow-sky', glowShadow: 'rgba(14, 165, 233, 0.35)',
    tailwindText: 'text-sky-400', tailwindBg: 'bg-sky-600', tailwindBorder: 'border-sky-500',
  },
  amber: {
    hex: '#f59e0b', bg: '#0c0802', bgGradient: '#452a03', text: '#fef3c7',
    thumb: '#d97706', thumbHover: '#f59e0b', glassBg: 'rgba(20, 12, 2, 0.45)',
    glowClass: 'glow-amber', glowShadow: 'rgba(245, 158, 11, 0.35)',
    tailwindText: 'text-amber-400', tailwindBg: 'bg-amber-600', tailwindBorder: 'border-amber-500',
  },
  fuchsia: {
    hex: '#d946ef', bg: '#08040a', bgGradient: '#2a0b29', text: '#fdf3fd',
    thumb: '#c084fc', thumbHover: '#d946ef', glassBg: 'rgba(22, 10, 20, 0.45)',
    glowClass: 'glow-fuchsia', glowShadow: 'rgba(217, 70, 239, 0.35)',
    tailwindText: 'text-fuchsia-400', tailwindBg: 'bg-fuchsia-600', tailwindBorder: 'border-fuchsia-500',
  },
  indigo: {
    hex: '#6366f1', bg: '#05050a', bgGradient: '#141029', text: '#f1f0f7',
    thumb: '#818cf8', thumbHover: '#6366f1', glassBg: 'rgba(15, 12, 25, 0.45)',
    glowClass: 'glow-indigo', glowShadow: 'rgba(99, 102, 241, 0.35)',
    tailwindText: 'text-indigo-400', tailwindBg: 'bg-indigo-600', tailwindBorder: 'border-indigo-500',
  },
  cyan: {
    hex: '#06b6d4', bg: '#04080a', bgGradient: '#05222e', text: '#ecf8fd',
    thumb: '#0891b2', thumbHover: '#06b6d4', glassBg: 'rgba(3, 15, 20, 0.45)',
    glowClass: 'glow-cyan', glowShadow: 'rgba(6, 182, 212, 0.35)',
    tailwindText: 'text-cyan-400', tailwindBg: 'bg-cyan-600', tailwindBorder: 'border-cyan-500',
  },
  violet: {
    hex: '#8b5cf6', bg: '#0a0408', bgGradient: '#221033', text: '#f5f0ff',
    thumb: '#7c3aed', thumbHover: '#8b5cf6', glassBg: 'rgba(18, 8, 28, 0.45)',
    glowClass: 'glow-violet', glowShadow: 'rgba(139, 92, 246, 0.35)',
    tailwindText: 'text-violet-400', tailwindBg: 'bg-violet-600', tailwindBorder: 'border-violet-500',
  },
  rose: {
    hex: '#f43f5e', bg: '#0a0204', bgGradient: '#330912', text: '#fff1f3',
    thumb: '#e11d48', thumbHover: '#f43f5e', glassBg: 'rgba(28, 4, 10, 0.45)',
    glowClass: 'glow-rose', glowShadow: 'rgba(244, 63, 94, 0.35)',
    tailwindText: 'text-rose-400', tailwindBg: 'bg-rose-600', tailwindBorder: 'border-rose-500',
  },
  teal: {
    hex: '#14b8a6', bg: '#020a08', bgGradient: '#053030', text: '#f0fdfa',
    thumb: '#0d9488', thumbHover: '#14b8a6', glassBg: 'rgba(4, 19, 19, 0.45)',
    glowClass: 'glow-teal', glowShadow: 'rgba(20, 184, 166, 0.35)',
    tailwindText: 'text-teal-400', tailwindBg: 'bg-teal-600', tailwindBorder: 'border-teal-500',
  },
  orange: {
    hex: '#f97316', bg: '#0a0502', bgGradient: '#331a05', text: '#fff7ed',
    thumb: '#ea580c', thumbHover: '#f97316', glassBg: 'rgba(28, 15, 4, 0.45)',
    glowClass: 'glow-orange', glowShadow: 'rgba(249, 115, 22, 0.35)',
    tailwindText: 'text-orange-400', tailwindBg: 'bg-orange-600', tailwindBorder: 'border-orange-500',
  },
  blue: {
    hex: '#3b82f6', bg: '#020610', bgGradient: '#0a1a3a', text: '#eff6ff',
    thumb: '#2563eb', thumbHover: '#3b82f6', glassBg: 'rgba(4, 10, 30, 0.45)',
    glowClass: 'glow-blue', glowShadow: 'rgba(59, 130, 246, 0.35)',
    tailwindText: 'text-blue-400', tailwindBg: 'bg-blue-600', tailwindBorder: 'border-blue-500',
  },
  lime: {
    hex: '#84cc16', bg: '#080a02', bgGradient: '#1a2e05', text: '#f7fee7',
    thumb: '#65a30d', thumbHover: '#84cc16', glassBg: 'rgba(15, 25, 4, 0.45)',
    glowClass: 'glow-lime', glowShadow: 'rgba(132, 204, 22, 0.35)',
    tailwindText: 'text-lime-400', tailwindBg: 'bg-lime-600', tailwindBorder: 'border-lime-500',
  },
};

// ─── Parse CLI args ───────────────────────────────────────────────
function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    const [key, value] = arg.replace(/^--/, '').split('=');
    args[key] = value !== undefined ? value : true;
  });
  return args;
}

const args = parseArgs();
const slug = args.slug;
const toolName = args.name || slug;
const colorKey = args.color || 'emerald';
const iconName = args.icon || 'Link';
const description = args.description || '';

if (!slug) {
  console.error('Error: --slug is required. Example: --slug=base64-bolt --name="Base64-Bolt" --color=emerald');
  process.exit(1);
}

const palette = COLOR_PALETTES[colorKey] || COLOR_PALETTES.emerald;
const PascalSlug = slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
const dictVarName = slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) + 'Dictionary';
const importVarPrefix = slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const importSlugSimple = slug.replace(/-/g, '');
const LANGS = ['en', 'es', 'fr', 'de', 'pt', 'ru', 'hi', 'ja', 'zh'];

// ─── Template Generators ──────────────────────────────────────────

function headerTemplate() {
  return `import React from 'react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ${iconName} } from 'lucide-react';

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

export const Header: React.FC<HeaderProps> = ({ currentLang, onLanguageChange, onReset, t }) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none">
      <header className="w-full h-auto md:h-24 py-4 md:py-0 border-b border-white/10 bg-[${palette.bg}]/95 backdrop-blur-3xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] pointer-events-auto">
        <div className="max-w-7xl mx-auto h-full px-4 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
          <div className="flex items-center justify-between w-full md:w-auto space-x-4 md:space-x-12">
            <a href={\`/\${currentLang.toLowerCase()}\`} className="flex items-center space-x-2 md:space-x-3 group outline-none shrink-0">
              <div className="w-9 h-9 md:w-11 md:h-11 bg-red-600 rounded-xl md:rounded-2xl flex items-center justify-center group-hover:bg-red-500 transition-all group-hover:rotate-6 group-hover:scale-110 shadow-lg shadow-red-600/40">
                <HeartIcon />
              </div>
              <div className="text-2xl md:text-3xl font-black tracking-tighter transition-all group-hover:scale-105">
                <span className="text-white">oLove</span>
                <span className="text-red-400">Tools</span>
              </div>
            </a>
            <div className="h-8 w-px bg-white/10 hidden sm:block"></div>
            <button onClick={onReset} className="flex items-center space-x-2 md:space-x-3 group border-none bg-transparent outline-none transition-all hover:translate-x-1 cursor-pointer">
              <div className="w-8 h-8 md:w-9 md:h-9 bg-white/5 rounded-lg md:rounded-xl flex items-center justify-center border border-white/10 group-hover:bg-${colorKey}-500/20 group-hover:border-${colorKey}-500/50 transition-all">
                <${iconName} className="w-5 h-5 ${palette.tailwindText}" />
              </div>
              <span className="text-xl md:text-2xl font-black text-white tracking-tight group-hover:${palette.tailwindText} transition-all">{t.title}</span>
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
`;
}

function languageSwitcherTemplate() {
  return `import React, { useState, useRef, useEffect } from 'react';
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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeLang = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  return (
    <div className="relative w-full flex justify-center" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between md:justify-center w-[70%] md:w-12 h-12 md:p-0 px-8 rounded-full border border-gray-700 bg-gray-900/50 hover:bg-gray-800 transition-colors text-xs md:text-sm font-black text-gray-300 uppercase cursor-pointer shadow-lg outline-none">
        <span className="md:hidden">{activeLang.name}</span>
        <span className="hidden md:block">{activeLang.code}</span>
        <ChevronDown className={\`w-4 h-4 ml-2 transition-transform md:hidden \${isOpen ? 'rotate-180' : ''}\`} />
      </button>
      {isOpen && (
        <div className="absolute left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-0 mt-12 w-48 bg-[${palette.bg}] border border-${colorKey}-950 rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="py-1">
            {LANGUAGES.map((lang) => (
              <button key={lang.code} onClick={() => { onLanguageChange(lang.code); setIsOpen(false); }} className={\`w-full flex items-center px-4 py-3 text-sm hover:bg-${colorKey}-950/30 transition-colors cursor-pointer text-left \${currentLang === lang.code ? 'bg-${colorKey}-950/60 text-white' : 'text-gray-300'}\`}>
                <span className={\`font-bold mr-3 w-6 uppercase ${palette.tailwindText}\`}>{lang.code}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
`;
}

function legalModalTemplate() {
  return `import React, { useRef, useEffect } from 'react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
  t: any;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, title, content, t }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) onClose();
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const copyEmail = () => {
    navigator.clipboard.writeText(t.emailAddress || 'adrian.contact.me.69@gmail.com');
    const button = document.getElementById('copy-email-modal-btn');
    if (button) {
      const originalText = button.innerText;
      button.innerText = t.emailCopied || 'Copied!';
      setTimeout(() => { button.innerText = originalText; }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div ref={modalRef} className="bg-[${palette.bg}] border border-white/10 p-8 rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto animate-in zoom-in-95 duration-200 relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-white cursor-pointer border-none bg-transparent outline-none">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <h2 className="text-2xl font-black text-white mb-6">{title}</h2>
        <div className="text-gray-300 mb-8 space-y-4 whitespace-pre-line text-sm leading-relaxed">{content}</div>
        <div className="border-t border-white/10 pt-6">
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">{t.contactForIdeas || 'Contact for ideas and comments:'}</p>
          <button id="copy-email-modal-btn" onClick={copyEmail} className="flex items-center space-x-3 ${palette.tailwindText} hover:opacity-80 border-none bg-transparent outline-none transition-colors font-mono cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" /></svg>
            <span>{t.emailAddress || 'adrian.contact.me.69@gmail.com'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
`;
}

function footerTemplate() {
  return `import React from 'react';
import { legalTranslations } from '../../../locales/legal';

interface FooterProps {
  lang: string;
  t: any;
  onOpenModal: (modal: 'privacy' | 'terms' | 'cookies') => void;
}

export const Footer: React.FC<FooterProps> = ({ lang, t, onOpenModal }) => {
  return (
    <footer className="py-24 md:py-36 border-t border-white/5 flex flex-col items-center space-y-16 relative z-10 bg-[${palette.bg}] w-full">
      <div className="flex flex-col items-center space-y-16 max-w-5xl px-8 text-center">
        <div className="text-gray-600 text-xs font-black tracking-[0.6em] uppercase opacity-40">
          {t.footerCredit || 'Part of the oLoveTools suite'}
        </div>
        <a href={\`/\${lang.toLowerCase()}/\`} className="flex items-center space-x-6 group scale-[1.1] md:scale-[1.5] outline-none shrink-0">
          <div className="w-12 h-12 bg-red-600 rounded-[1.2rem] flex items-center justify-center group-hover:rotate-12 transition-transform shadow-[0_15px_30px_-5px_rgba(239,68,68,0.5)]">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
          </div>
          <div className="flex items-center space-x-1 font-black text-4xl tracking-tighter">
            <span className="text-white transition-all group-hover:text-red-400">oLove</span>
            <span className="text-red-400 group-hover:translate-x-1 group-hover:text-white transition-all">Tools</span>
          </div>
        </a>
        <p className="text-gray-500 text-lg md:text-xl font-medium leading-relaxed max-w-2xl">{t.footerTagline}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-4xl border-t border-white/5 pt-16 mt-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-3">{t.seoBrowserSpeedTitle}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{t.seoBrowserSpeedText}</p>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-3">{t.seoUseCaseTitle}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{t.seoUseCaseText}</p>
          </div>
          <div className="md:col-span-2">
            <h3 className="text-white font-bold text-lg mb-3">{t.seoPrivacyTitle}</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">{t.seoPrivacyText}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              {Array.isArray(t.seoKeywords) && t.seoKeywords.map((kw: string) => (
                <span key={kw} className="text-[10px] text-gray-500 bg-white/5 border border-white/10 px-2 py-1 rounded">{kw}</span>
              ))}
            </div>
          </div>
        </div>
        {Array.isArray(t.faq) && t.faq.length > 0 && (
          <div className="w-full text-left max-w-4xl border-t border-white/5 pt-16">
            <h2 className="text-white font-black text-2xl mb-8 tracking-tight text-center">{t.faqTitle}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {t.faq.map((item: any, i: number) => (
                <div key={i} className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl hover:border-${colorKey}-500/20 transition-colors">
                  <h4 className="text-white font-bold text-base mb-2">{item.question}</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-col md:flex-row flex-wrap items-center justify-center gap-y-2 md:gap-y-6 gap-x-4 md:gap-x-8 text-gray-800 font-black text-[11px] md:text-xs tracking-widest pt-12 border-t border-white/5 w-full uppercase">
          <span className="w-full md:w-auto mb-4 md:mb-0 opacity-40">&copy; {new Date().getFullYear()} oLoveTools</span>
          <button onClick={() => onOpenModal('privacy')} className="w-full md:w-auto py-3 md:py-0 border-none bg-transparent hover:${palette.tailwindText} active:bg-white/5 active:scale-95 transition-all cursor-pointer whitespace-nowrap rounded-xl text-center font-black outline-none">{legalTranslations[lang]?.nav.privacy || 'Privacy Policy'}</button>
          <button onClick={() => onOpenModal('terms')} className="w-full md:w-auto py-3 md:py-0 border-none bg-transparent hover:${palette.tailwindText} active:bg-white/5 active:scale-95 transition-all cursor-pointer whitespace-nowrap rounded-xl text-center font-black outline-none">{legalTranslations[lang]?.nav.terms || 'Terms of Service'}</button>
          <button onClick={() => onOpenModal('cookies')} className="w-full md:w-auto py-3 md:py-0 border-none bg-transparent hover:${palette.tailwindText} active:bg-white/5 active:scale-95 transition-all cursor-pointer whitespace-nowrap rounded-xl text-center font-black outline-none">{legalTranslations[lang]?.nav.cookies || 'Cookie Policy'}</button>
          <a href={\`/\${lang.toLowerCase()}/about\`} className="w-full md:w-auto py-3 md:py-0 hover:${palette.tailwindText} active:bg-white/5 active:scale-95 transition-all cursor-pointer whitespace-nowrap rounded-xl text-center font-black">{legalTranslations[lang]?.nav.about || 'About'}</a>
          <button onClick={() => { navigator.clipboard.writeText(t.emailAddress || 'adrian.contact.me.69@gmail.com'); const button = document.getElementById('copy-email-footer-btn'); if (button) { const originalText = button.innerText; button.innerText = t.emailCopied || 'Copied!'; setTimeout(() => { button.innerText = originalText; }, 2000); } }} id="copy-email-footer-btn" className="w-full md:w-auto py-3 md:py-0 border-none bg-transparent hover:${palette.tailwindText} active:bg-white/5 active:scale-95 transition-all cursor-pointer rounded-xl font-black outline-none">{t.emailAddress || 'adrian.contact.me.69@gmail.com'}</button>
        </div>
      </div>
    </footer>
  );
};
`;
}

function mainComponentTemplate() {
  return `import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { ${iconName}, RotateCcw } from 'lucide-react';
import { legalTranslations } from '../../locales/legal';

interface ${PascalSlug}Props {
  lang: string;
  dictionary: any;
}

export default function ${PascalSlug}({ lang, dictionary }: ${PascalSlug}Props) {
  const t = dictionary || {};
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  const resetWorkspace = useCallback(() => {
    // TODO: Reset tool state
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[${palette.bg}] text-slate-200 font-sans relative overflow-x-hidden pt-24">
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-${colorKey}-600/10 blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-${colorKey}-600/10 blur-[120px] pointer-events-none z-0" />
      <Header currentLang={lang} onLanguageChange={(l) => window.location.href = \`/\${l.toLowerCase()}/${slug}\`} onReset={resetWorkspace} t={t} />
      <main className="flex-grow max-w-5xl w-full mx-auto px-4 md:px-12 py-8 relative z-10 flex flex-col space-y-8">
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center md:justify-start gap-3">
            <${iconName} className="w-8 h-8 ${palette.tailwindText}" />
            <span>{t.seoHeroTitle || '${toolName}'}</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed">{t.seoHeroText}</p>
        </div>
        {/* TODO: Implement tool UI here */}
      </main>
      <Footer lang={lang} t={t} onOpenModal={(modal) => setLegalModal(modal)} />
      <LegalModal isOpen={legalModal === 'privacy'} onClose={() => setLegalModal(null)} title={legalTranslations[lang]?.privacy.title || 'Privacy Policy'} content={legalTranslations[lang]?.privacy.content} t={t} />
      <LegalModal isOpen={legalModal === 'terms'} onClose={() => setLegalModal(null)} title={legalTranslations[lang]?.terms.title || 'Terms of Service'} content={legalTranslations[lang]?.terms.content} t={t} />
      <LegalModal isOpen={legalModal === 'cookies'} onClose={() => setLegalModal(null)} title={legalTranslations[lang]?.cookies.title || 'Cookie Policy'} content={legalTranslations[lang]?.cookies.content} t={t} />
    </div>
  );
}
`;
}

function localeTemplate() {
  return `export default {
  "title": "${toolName}",
  "seo_title": "${toolName} | ${description || 'Free Online Tool'}",
  "seo_description": "${description || 'Free online tool that runs 100% locally in your browser.'}",
  "seoHeroTitle": "${toolName}",
  "seoHeroText": "${description || 'A free online tool that runs entirely in your browser with no server processing.'}",
  "seoBrowserSpeedTitle": "Instant Local Processing",
  "seoBrowserSpeedText": "All processing is executed inside your browser using native JavaScript APIs. No data is ever sent to a server.",
  "seoUseCaseTitle": "100% Client-Side",
  "seoUseCaseText": "Everything runs locally in your browser. Your data never leaves your device.",
  "seoPrivacyTitle": "100% Private & Secure",
  "seoPrivacyText": "No databases, tracking, or network uploads. Your data resides strictly in local memory and disappears when you close the tab.",
  "seoKeywords": ["${slug.replace(/-/g, ' ')}", "online tool", "free", "local", "browser"],
  "faqTitle": "Frequently Asked Questions",
  "faq": [
    { "question": "Is my data sent to any server?", "answer": "No. All operations happen entirely inside your browser. Your data never leaves your device." }
  ],
  "footerTagline": "${description || 'A free online tool running 100% locally in your browser.'}",
  "footerCredit": "Part of the oLoveTools suite",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "Copied!",
  "contactForIdeas": "Contact for ideas and comments:"
};
`;
}

// ─── File Writing ─────────────────────────────────────────────────
function writeFile(filePath, content) {
  const fullPath = join(ROOT, filePath);
  const dir = dirname(fullPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(fullPath, content, 'utf-8');
  console.log(`  ✓ Created: ${filePath}`);
}

console.log(`\n🏗️  oLove-Generator: Creating "${toolName}" (slug: ${slug})`);
console.log(`   Color: ${colorKey} | Icon: ${iconName}\n`);

const toolDir = `src/tools/${slug}`;
writeFile(`${toolDir}/${PascalSlug}.tsx`, mainComponentTemplate());
writeFile(`${toolDir}/components/Header.tsx`, headerTemplate());
writeFile(`${toolDir}/components/LanguageSwitcher.tsx`, languageSwitcherTemplate());
writeFile(`${toolDir}/components/LegalModal.tsx`, legalModalTemplate());
writeFile(`${toolDir}/components/Footer.tsx`, footerTemplate());
LANGS.forEach(lang => writeFile(`src/locales/${lang}/${slug}.ts`, localeTemplate()));

// ─── Update dictionary.ts (ROBUST: uses last-entry detection) ────
const dictPath = join(ROOT, 'src/locales/dictionary.ts');
let dictContent = readFileSync(dictPath, 'utf-8');

// 1. Add imports after the LAST import line (before first export const)
const importBlock = LANGS.map(lang => `import ${lang}_${importVarPrefix} from './${lang}/${slug}';`).join('\n');
const lastImportMatch = dictContent.match(/(import [\w_]+ from '\.\/[\w_-]+\/[\w_-]+';\n)(?!import)/);
if (lastImportMatch) {
  dictContent = dictContent.replace(lastImportMatch[1], lastImportMatch[1] + importBlock + '\n');
}

// 2. Add dictionary export after the LAST dictionary export (before useTranslation)
const dictExport = `export const ${dictVarName}: Record<string, any> = {\n${LANGS.map(l => `  ${l}: ${l}_${importVarPrefix},`).join('\n')}\n};\n`;
const beforeUseTrans = dictContent.indexOf('export const useTranslation');
if (beforeUseTrans > -1) {
  dictContent = dictContent.slice(0, beforeUseTrans) + dictExport + '\n' + dictContent.slice(beforeUseTrans);
}

// 3. Add to useTranslation signature: insert slug before final ")"
dictContent = dictContent.replace(
  /(tool: [^=]+)(\) => \{)/,
  (match, prefix, suffix) => {
    if (prefix.includes(`'${slug}'`)) return match;
    return prefix.replace(/'\) => \{$/, '') + `' | '${slug}') => {`;
  }
);

// 4. Add to dictionary switch: find the hubDictionary line, insert before it
const switchLine = `\n    tool === '${slug}' ? ${dictVarName} :`;
if (!dictContent.includes(`tool === '${slug}'`)) {
  dictContent = dictContent.replace(
    /(\s*hubDictionary;)/,
    `${switchLine}$1`
  );
}

writeFileSync(dictPath, dictContent, 'utf-8');
console.log(`  ✓ Updated: src/locales/dictionary.ts`);

// ─── Update index.astro (ROBUST) ──────────────────────────────────
const astroPath = join(ROOT, 'src/pages/[lang]/[tool]/index.astro');
let astroContent = readFileSync(astroPath, 'utf-8');

// 1. Add import after the LAST tool import
const newImport = `import ${PascalSlug} from '../../../tools/${slug}/${PascalSlug}';\n`;
const lastToolImportMatch = astroContent.match(/(import \w+ from '\.\.\/\.\.\/\.\.\/tools\/[^']+';\n)/g);
if (lastToolImportMatch) {
  const lastImport = lastToolImportMatch[lastToolImportMatch.length - 1];
  if (!astroContent.includes(newImport.trim())) {
    astroContent = astroContent.replace(lastImport, lastImport + newImport);
  }
}

// 2. Add to tools array (find closing bracket)
if (!astroContent.includes(`'${slug}'`)) {
  astroContent = astroContent.replace(
    /(const tools = \[[^\]]+)(\];)/,
    `$1, '${slug}'$2`
  );
}

// 3. Add to toolNames
if (!astroContent.includes(`'${slug}': '${toolName}'`)) {
  astroContent = astroContent.replace(
    /(\s+const toolNames[\s\S]*?)(\s+};)/,
    (match, body, closing) => {
      return body + `  , '${slug}': '${toolName}'\n` + closing;
    }
  );
}

// 4. Add inline style before </head>
const styleBlock = `    {tool === '${slug}' && (
      <style is:inline>
        body {
          background-color: ${palette.bg} !important;
          background-image: radial-gradient(circle at 50% -25%, ${palette.bgGradient} 0%, ${palette.bg} 60%) !important;
          background-attachment: fixed !important;
          color: ${palette.text} !important;
          min-height: 100vh !important;
          overflow-x: hidden !important;
          width: 100% !important;
        }
        #root { min-height: 100vh; position: relative; z-index: 10; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${palette.bg}; }
        ::-webkit-scrollbar-thumb { background: ${palette.thumb}; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: ${palette.thumbHover}; }
        .glass-card { background: ${palette.glassBg}; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.06); box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1); }
        .${palette.glowClass} { box-shadow: 0 0 25px -5px ${palette.glowShadow}; }
      </style>
    )}
`;
if (!astroContent.includes(`tool === '${slug}'`)) {
  astroContent = astroContent.replace(/(\s*<\/head>)/, `\n${styleBlock}  </head>`);
}

// 5. Add render line after the LAST tool render
const renderLine = `        {tool === '${slug}' && <${PascalSlug} lang={castLang} dictionary={dictionary} client:load transition:persist />}`;
if (!astroContent.includes(renderLine.trim())) {
  const lastRenderMatch = astroContent.match(/\{tool === '[^']+' && <\w+ lang=\{castLang\} dictionary=\{dictionary\} client:load transition:persist \/>\}/g);
  if (lastRenderMatch) {
    const lastRender = lastRenderMatch[lastRenderMatch.length - 1];
    astroContent = astroContent.replace(lastRender, lastRender + '\n' + renderLine);
  }
}

// 6. Update fallback condition
if (!astroContent.includes(`tool !== '${slug}'`)) {
  astroContent = astroContent.replace(
    /(\s+tool !== 'url-bolt' && )(\(tool !== )/,
    `$1tool !== '${slug}' && $2`
  );
}

writeFileSync(astroPath, astroContent, 'utf-8');
console.log(`  ✓ Updated: src/pages/[lang]/[tool]/index.astro`);

// ─── Update constants.ts (ROBUST) ────────────────────────────────
const constantsPath = join(ROOT, 'src/constants.ts');
let constantsContent = readFileSync(constantsPath, 'utf-8');

if (!constantsContent.includes(`'${slug}':`)) {
  const faviconEntry = `  '${slug}': "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(palette.hex)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'/></svg>",\n`;
  constantsContent = constantsContent.replace(/(\n  default: "\/icon\.svg"\n};)/, `\n${faviconEntry}$1`);

  const themeColorEntry = `  '${slug}': "${palette.hex}",\n`;
  constantsContent = constantsContent.replace(/(\n  default: "#060609"\n};)/, `\n${themeColorEntry}$1`);

  writeFileSync(constantsPath, constantsContent, 'utf-8');
  console.log(`  ✓ Updated: src/constants.ts`);
}

console.log(`\n✅ "${toolName}" boilerplate generated successfully!`);
console.log(`   Next: Implement the tool logic in src/tools/${slug}/${PascalSlug}.tsx`);
console.log(`   Then: Fill in translations in src/locales/{lang}/${slug}.ts\n`);
