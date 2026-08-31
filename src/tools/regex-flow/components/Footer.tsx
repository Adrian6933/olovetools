import React from 'react';
import { legalTranslations } from '../../../locales/legal';

// ============================================================================
// The footer, after the deduplication.
// ----------------------------------------------------------------------------
// It used to carry its own copy of the SEO grid, the keyword chips and the
// whole FAQ — the same text that index.astro already renders server-side and
// that the tool now shows as a proper <details> accordion in <main>. Three
// copies of the same paragraphs on one page is not an SEO strategy, so this is
// back to being a footer: identity, tagline, legal.
// ============================================================================

interface FooterProps {
  lang: string;
  t: any;
  onOpenModal: (modal: 'privacy' | 'terms' | 'cookies') => void;
}

const linkClass =
  'w-full md:w-auto py-3 md:py-0 border-none bg-transparent hover:text-fuchsia-400 active:bg-white/5 active:scale-95 transition-all cursor-pointer whitespace-nowrap rounded-xl text-center font-black outline-none';

export const Footer: React.FC<FooterProps> = ({ lang, t, onOpenModal }) => {
  const copyEmail = () => {
    const address = t?.emailAddress || 'adrian.contact.me.69@gmail.com';
    navigator.clipboard.writeText(address).catch(() => {
      // Non-secure contexts refuse the clipboard; the address is on screen anyway.
    });
    const button = document.getElementById('copy-email-footer-btn');
    if (!button) return;
    const original = button.innerText;
    button.innerText = t?.emailCopied || 'Copied!';
    setTimeout(() => {
      button.innerText = original;
    }, 2000);
  };

  return (
    <footer className="py-20 md:py-28 border-t border-white/5 flex flex-col items-center relative z-10 bg-[#08040a] w-full">
      <div className="flex flex-col items-center gap-12 w-full max-w-4xl px-4 sm:px-8 text-center">
        <div className="text-gray-600 text-[10px] sm:text-xs font-black tracking-[0.4em] sm:tracking-[0.6em] uppercase opacity-40">
          {t?.footerCredit || 'Part of the oLoveTools suite'}
        </div>

        <a
          href={`/${lang.toLowerCase()}/`}
          className="flex items-center gap-4 md:gap-6 group scale-100 md:scale-125 outline-none shrink-0"
        >
          <div className="w-12 h-12 bg-red-600 rounded-[1.2rem] flex items-center justify-center group-hover:rotate-12 transition-transform shadow-[0_15px_30px_-5px_rgba(239,68,68,0.5)]">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <div className="flex items-center gap-1 font-black text-3xl sm:text-4xl tracking-tighter">
            <span className="text-white transition-all group-hover:text-red-400">oLove</span>
            <span className="text-red-400 group-hover:translate-x-1 group-hover:text-white transition-all">Tools</span>
          </div>
        </a>

        <p className="text-gray-400 text-base md:text-xl font-medium leading-relaxed max-w-2xl">{t?.footerTagline}</p>

        <div className="flex flex-col md:flex-row flex-wrap items-center justify-center gap-y-2 md:gap-y-6 gap-x-4 md:gap-x-8 text-fuchsia-900/60 font-black text-[11px] md:text-xs tracking-widest pt-10 border-t border-white/5 w-full uppercase">
          <span className="w-full md:w-auto mb-4 md:mb-0 opacity-40">&copy; {new Date().getFullYear()} oLoveTools</span>

          <button onClick={() => onOpenModal('privacy')} className={linkClass}>
            {legalTranslations[lang]?.nav.privacy || 'Privacy Policy'}
          </button>

          <button onClick={() => onOpenModal('terms')} className={linkClass}>
            {legalTranslations[lang]?.nav.terms || 'Terms of Service'}
          </button>

          <button onClick={() => onOpenModal('cookies')} className={linkClass}>
            {legalTranslations[lang]?.nav.cookies || 'Cookie Policy'}
          </button>

          <a href={`/${lang.toLowerCase()}/about`} className={linkClass}>
            {legalTranslations[lang]?.nav.about || 'About'}
          </a>

          <button onClick={copyEmail} id="copy-email-footer-btn" className={`${linkClass} normal-case`}>
            {t?.emailAddress || 'adrian.contact.me.69@gmail.com'}
          </button>
        </div>
      </div>
    </footer>
  );
};
