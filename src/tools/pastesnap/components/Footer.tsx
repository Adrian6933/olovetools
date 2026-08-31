import React from 'react';
import { legalTranslations } from '../../../locales/legal';

interface FooterProps {
  lang: string;
  t: any;
}

/**
 * Se monta desde index.astro, no desde la isla. Antes el pie estaba escrito en
 * línea dentro del componente, así que salía a media página: por encima de los
 * CTAs cruzados, las herramientas relacionadas, el bloque SEO SSR y el anuncio
 * lateral. Los enlaces legales son páginas reales en vez de un modal, que es lo
 * que hace el resto de la suite y lo único que puede rastrear un buscador.
 */
export const Footer: React.FC<FooterProps> = ({ lang, t }) => {
  const legal = legalTranslations[lang];
  const linkClass =
    'w-full md:w-auto py-3 md:py-0 hover:text-indigo-400 active:bg-white/5 active:scale-95 transition-all cursor-pointer whitespace-nowrap rounded-xl text-center font-black outline-none';

  return (
    <footer className="py-20 md:py-32 border-t border-white/5 flex flex-col items-center gap-14 relative z-10 bg-[#04050a] w-full">
      <div className="flex flex-col items-center gap-14 max-w-5xl px-8 text-center">
        <div className="text-gray-600 text-xs font-black tracking-[0.5em] uppercase opacity-40">
          {t.footerCredit}
        </div>

        <a
          href={`/${lang.toLowerCase()}/`}
          className="flex items-center gap-5 group scale-[1.1] md:scale-[1.5] outline-none shrink-0"
        >
          <div className="w-12 h-12 bg-red-600 rounded-[1.2rem] flex items-center justify-center group-hover:rotate-12 transition-transform shadow-[0_15px_30px_-5px_rgba(239,68,68,0.5)]">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <div className="flex items-center gap-1 font-black text-4xl tracking-tighter">
            <span className="text-white transition-all group-hover:text-red-400">oLove</span>
            <span className="text-red-400 group-hover:translate-x-1 group-hover:text-white transition-all">Tools</span>
          </div>
        </a>

        <p className="text-gray-500 text-base md:text-lg font-medium leading-relaxed max-w-2xl">
          {t.footerTagline}
        </p>

        <div className="flex flex-col md:flex-row flex-wrap items-center justify-center gap-y-2 md:gap-y-6 gap-x-4 md:gap-x-8 text-gray-700 font-black text-[11px] md:text-xs tracking-widest pt-10 uppercase border-t border-white/5 w-full">
          <span className="w-full md:w-auto mb-4 md:mb-0 opacity-40">
            &copy; {new Date().getFullYear()} oLoveTools
          </span>

          <a href={`/${lang.toLowerCase()}/privacy`} className={linkClass}>
            {legal?.nav.privacy || 'Privacy Policy'}
          </a>
          <a href={`/${lang.toLowerCase()}/terms`} className={linkClass}>
            {legal?.nav.terms || 'Terms of Service'}
          </a>
          <a href={`/${lang.toLowerCase()}/cookies`} className={linkClass}>
            {legal?.nav.cookies || 'Cookie Policy'}
          </a>
          <a href={`/${lang.toLowerCase()}/about`} className={linkClass}>
            {legal?.nav.about || 'About'}
          </a>
          <a href={`mailto:${t.emailAddress}`} className={linkClass}>
            {t.emailAddress}
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
