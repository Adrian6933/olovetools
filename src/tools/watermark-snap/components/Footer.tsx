import React from 'react';
import { legalTranslations } from '../../../locales/legal';

interface FooterProps {
  lang: string;
  t: any;
}

/**
 * Se monta desde index.astro, no desde la isla: así queda al final real de la
 * página, después de los CTAs, las herramientas relacionadas y el contenido SEO
 * del servidor. Dentro de la isla aparecía a media página, con media web debajo.
 * Por lo mismo, los avisos legales son enlaces a sus páginas y no modales.
 */
export const Footer: React.FC<FooterProps> = ({ lang, t }) => {
  const linkClass =
    'w-full md:w-auto py-3 md:py-0 hover:text-amber-400 active:bg-white/5 active:scale-95 transition-all cursor-pointer whitespace-nowrap rounded-xl text-center font-black';

  return (
    <footer className="py-24 md:py-40 border-t border-white/5 flex flex-col items-center space-y-16 relative z-10 bg-[#080604] w-full">
      <div className="flex flex-col items-center space-y-14 max-w-5xl px-6 sm:px-8 text-center w-full">
        <div className="text-gray-600 text-[10px] sm:text-xs font-black tracking-[0.5em] uppercase opacity-40">
          {t.footerCredit || 'Part of the oLoveTools suite'}
        </div>

        <a
          href={`/${lang.toLowerCase()}/`}
          className="flex items-center space-x-4 md:space-x-6 group scale-100 md:scale-[1.4] outline-none shrink-0"
        >
          <div className="w-12 h-12 bg-red-600 rounded-[1.2rem] flex items-center justify-center group-hover:rotate-12 transition-transform shadow-[0_15px_30px_-5px_rgba(239,68,68,0.5)]">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <div className="flex items-center space-x-1 font-black text-3xl md:text-4xl tracking-tighter">
            <span className="text-white transition-all group-hover:text-red-400">oLove</span>
            <span className="text-red-400 group-hover:translate-x-1 group-hover:text-white transition-all">Tools</span>
          </div>
        </a>

        <p className="text-gray-500 text-base md:text-xl font-medium leading-relaxed max-w-2xl">
          {t.footerTagline}
        </p>

        <div className="flex flex-col md:flex-row flex-wrap items-center justify-center gap-y-2 md:gap-y-6 gap-x-4 md:gap-x-8 text-gray-800 font-black text-[11px] md:text-xs tracking-widest pt-12 uppercase border-t border-white/5 w-full">
          <span className="w-full md:w-auto mb-4 md:mb-0 opacity-40">&copy; {new Date().getFullYear()} oLoveTools</span>

          <a href={`/${lang.toLowerCase()}/privacy`} className={linkClass}>
            {legalTranslations[lang]?.nav.privacy || 'Privacy Policy'}
          </a>
          <a href={`/${lang.toLowerCase()}/terms`} className={linkClass}>
            {legalTranslations[lang]?.nav.terms || 'Terms of Service'}
          </a>
          <a href={`/${lang.toLowerCase()}/cookies`} className={linkClass}>
            {legalTranslations[lang]?.nav.cookies || 'Cookie Policy'}
          </a>
          <a href={`/${lang.toLowerCase()}/about`} className={linkClass}>
            {legalTranslations[lang]?.nav.about || 'About'}
          </a>

          <button
            onClick={() => {
              const email = t.emailAddress || 'adrian.contact.me.69@gmail.com';
              navigator.clipboard?.writeText(email);
              const button = document.getElementById('copy-email-footer-btn');
              if (button) {
                const original = button.innerText;
                button.innerText = t.emailCopied || 'Copied!';
                setTimeout(() => {
                  button.innerText = original;
                }, 2000);
              }
            }}
            id="copy-email-footer-btn"
            className="w-full md:w-auto py-3 md:py-0 border-none bg-transparent hover:text-amber-400 active:bg-white/5 active:scale-95 transition-all cursor-pointer rounded-xl font-black outline-none break-all"
          >
            {t.emailAddress || 'adrian.contact.me.69@gmail.com'}
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
