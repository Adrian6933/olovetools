import React from 'react';
import { motion } from 'framer-motion';
import { ToolTheme } from '../../lib/themes';
import { legalTranslations } from '../../locales/legal';
import { fadeInUp, staggerContainer, useReducedMotion } from '../shared/motion';

export interface UnifiedFooterContent {
  footerCredit?: string;
  footerTagline?: string;
  seoBrowserSpeedTitle?: string;
  seoBrowserSpeedText?: string;
  seoUseCaseTitle?: string;
  seoUseCaseText?: string;
  seoPrivacyTitle?: string;
  seoPrivacyText?: string;
  seoKeywords?: string[];
  faq?: Array<{ question: string; answer: string }>;
  faqTitle?: string;
  emailAddress?: string;
  emailCopied?: string;
}

interface UnifiedFooterProps {
  theme: ToolTheme;
  currentLang: string;
  content: UnifiedFooterContent;
  /** Called when user clicks Privacy/Terms/Cookies to open the legal modal */
  onOpenLegal?: (modal: 'privacy' | 'terms' | 'cookies') => void;
}

export const UnifiedFooter: React.FC<UnifiedFooterProps> = ({
  theme,
  currentLang,
  content,
  onOpenLegal,
}) => {
  const year = new Date().getFullYear();
  const legal = legalTranslations[currentLang] || legalTranslations.en;
  const prefersReduced = useReducedMotion();

  const handleEmailCopy = (e: React.MouseEvent<HTMLButtonElement>) => {
    const email = content.emailAddress || 'adrian.contact.me.69@gmail.com';
    navigator.clipboard.writeText(email);
    const button = e.currentTarget;
    const original = button.innerText;
    button.innerText = content.emailCopied || 'Copied!';
    setTimeout(() => {
      button.innerText = original;
    }, 2000);
  };

  return (
    <footer className="py-24 md:py-36 border-t border-white/5 flex flex-col items-center space-y-16 relative z-10 bg-[#05050a] w-full">
      <div className="flex flex-col items-center space-y-16 max-w-5xl px-8 text-center">
        {/* Credit */}
        <div className="text-gray-600 text-xs font-black tracking-[0.6em] uppercase opacity-40">
          {content.footerCredit || 'Part of the oLoveTools suite'}
        </div>

        {/* Big logo */}
        <a
          href={`/${currentLang.toLowerCase()}/`}
          className="flex items-center space-x-6 group scale-[1.1] md:scale-[1.5] outline-none shrink-0"
        >
          <div className="w-12 h-12 bg-red-600 rounded-[1.2rem] flex items-center justify-center group-hover:rotate-12 transition-transform shadow-[0_15px_30px_-5px_rgba(239,68,68,0.5)]">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <div className="flex items-center space-x-1 font-black text-4xl tracking-tighter">
            <span className="text-white transition-all group-hover:text-red-400">oLove</span>
            <span className="text-red-400 group-hover:translate-x-1 group-hover:text-white transition-all">Tools</span>
          </div>
        </a>

        {/* Tagline */}
        {content.footerTagline && (
          <p className="text-gray-500 text-lg md:text-xl font-medium leading-relaxed max-w-2xl">
            {content.footerTagline}
          </p>
        )}

        {/* SEO Grid */}
        {(content.seoBrowserSpeedTitle || content.seoUseCaseTitle || content.seoPrivacyTitle) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-4xl border-t border-white/5 pt-16 mt-8 w-full">
            {content.seoBrowserSpeedTitle && (
              <div>
                <h3 className="text-white font-bold text-lg mb-3">{content.seoBrowserSpeedTitle}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{content.seoBrowserSpeedText}</p>
              </div>
            )}
            {content.seoUseCaseTitle && (
              <div>
                <h3 className="text-white font-bold text-lg mb-3">{content.seoUseCaseTitle}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{content.seoUseCaseText}</p>
              </div>
            )}
            {content.seoPrivacyTitle && (
              <div className="md:col-span-2">
                <h3 className="text-white font-bold text-lg mb-3">{content.seoPrivacyTitle}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">{content.seoPrivacyText}</p>
                {content.seoKeywords && content.seoKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {content.seoKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="text-[10px] text-gray-500 bg-white/5 border border-white/10 px-2 py-1 rounded"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* FAQ */}
        {content.faq && content.faq.length > 0 && (
          <div className="w-full text-left max-w-4xl border-t border-white/5 pt-16">
            {content.faqTitle && (
              <h2 className="text-white font-black text-2xl mb-8 tracking-tight text-center">
                {content.faqTitle}
              </h2>
            )}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
              variants={prefersReduced ? undefined : staggerContainer}
              initial={prefersReduced ? undefined : 'hidden'}
              whileInView={prefersReduced ? undefined : 'visible'}
              viewport={{ once: true, margin: '-80px' }}
            >
              {content.faq.map((item, i) => (
                <motion.div
                  key={i}
                  variants={prefersReduced ? undefined : fadeInUp}
                  className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl hover:border-indigo-500/20 transition-colors"
                >
                  <h4 className="text-white font-bold text-base mb-2">{item.question}</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.answer}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}

        {/* Legal row */}
        <div
          className="flex flex-col md:flex-row flex-wrap items-center justify-center gap-y-2 md:gap-y-6 gap-x-4 md:gap-x-8 text-gray-800 font-black text-[11px] md:text-xs tracking-widest pt-12 border-t border-white/5 w-full uppercase"
        >
          <span className="w-full md:w-auto mb-4 md:mb-0 opacity-40">
            &copy; {year} oLoveTools
          </span>

          {onOpenLegal ? (
            <>
              <button
                onClick={() => onOpenLegal('privacy')}
                className="w-full md:w-auto py-3 md:py-0 border-none bg-transparent hover:text-indigo-400 active:bg-white/5 active:scale-95 transition-all cursor-pointer whitespace-nowrap rounded-xl text-center font-black outline-none"
              >
                {legal.nav?.privacy || 'Privacy Policy'}
              </button>
              <button
                onClick={() => onOpenLegal('terms')}
                className="w-full md:w-auto py-3 md:py-0 border-none bg-transparent hover:text-indigo-400 active:bg-white/5 active:scale-95 transition-all cursor-pointer whitespace-nowrap rounded-xl text-center font-black outline-none"
              >
                {legal.nav?.terms || 'Terms of Service'}
              </button>
              <button
                onClick={() => onOpenLegal('cookies')}
                className="w-full md:w-auto py-3 md:py-0 border-none bg-transparent hover:text-indigo-400 active:bg-white/5 active:scale-95 transition-all cursor-pointer whitespace-nowrap rounded-xl text-center font-black outline-none"
              >
                {legal.nav?.cookies || 'Cookie Policy'}
              </button>
            </>
          ) : (
            <>
              <a
                href={`/${currentLang.toLowerCase()}/privacy`}
                className="w-full md:w-auto py-3 md:py-0 hover:text-indigo-400 active:bg-white/5 active:scale-95 transition-all cursor-pointer whitespace-nowrap rounded-xl text-center font-black"
              >
                {legal.nav?.privacy || 'Privacy Policy'}
              </a>
              <a
                href={`/${currentLang.toLowerCase()}/terms`}
                className="w-full md:w-auto py-3 md:py-0 hover:text-indigo-400 active:bg-white/5 active:scale-95 transition-all cursor-pointer whitespace-nowrap rounded-xl text-center font-black"
              >
                {legal.nav?.terms || 'Terms of Service'}
              </a>
              <a
                href={`/${currentLang.toLowerCase()}/cookies`}
                className="w-full md:w-auto py-3 md:py-0 hover:text-indigo-400 active:bg-white/5 active:scale-95 transition-all cursor-pointer whitespace-nowrap rounded-xl text-center font-black"
              >
                {legal.nav?.cookies || 'Cookie Policy'}
              </a>
            </>
          )}

          <a
            href={`/${currentLang.toLowerCase()}/about`}
            className="w-full md:w-auto py-3 md:py-0 hover:text-indigo-400 active:bg-white/5 active:scale-95 transition-all cursor-pointer whitespace-nowrap rounded-xl text-center font-black"
          >
            {legal.nav?.about || 'About'}
          </a>

          <button
            onClick={handleEmailCopy}
            id="copy-email-footer-btn"
            className="w-full md:w-auto py-3 md:py-0 border-none bg-transparent hover:text-indigo-400 active:bg-white/5 active:scale-95 transition-all cursor-pointer rounded-xl font-black outline-none"
          >
            {content.emailAddress || 'adrian.contact.me.69@gmail.com'}
          </button>
        </div>
      </div>
    </footer>
  );
};
