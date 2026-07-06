import React, { useState } from 'react';
import { Heart, Mail, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToolTheme } from '../../lib/themes';
import { legalTranslations } from '../../locales/legal';
import { useReducedMotion } from './motion';

export interface RichFooterContent {
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

interface BottomFooterProps {
  theme: ToolTheme;
  currentLang: string;
  variant?: 'minimal' | 'rich';
  content?: RichFooterContent;
}

export const BottomFooter: React.FC<BottomFooterProps> = ({
  theme,
  currentLang,
  variant = 'minimal',
  content,
}) => {
  const year = new Date().getFullYear();
  const legal = legalTranslations[currentLang] || legalTranslations.en;
  const [emailCopied, setEmailCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const prefersReduced = useReducedMotion();

  const handleEmailCopy = () => {
    if (!content?.emailAddress) return;
    navigator.clipboard.writeText(content.emailAddress);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  const basicLinks = [
    { label: 'Tools', href: `/${currentLang}` },
    { label: 'About', href: `/${currentLang}/about` },
    { label: 'Privacy', href: `/${currentLang}/privacy` },
    { label: 'Terms', href: `/${currentLang}/terms` },
    { label: 'Cookies', href: `/${currentLang}/cookies` },
  ];

  if (variant === 'minimal' || !content) {
    return (
      <footer
        role="contentinfo"
        className="border-t mt-16"
        style={{ borderColor: theme.border, backgroundColor: `${theme.bg}80` }}
      >
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2 shrink-0">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: theme.primaryHex }}
              >
                <Heart className="w-4 h-4 text-white fill-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-tight text-white">
                  oLove<span style={{ color: theme.primaryHex }}>Tools</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>
                  © {year} oLoveTools
                </span>
              </div>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2" aria-label="Footer">
              {basicLinks.map((link) => (
                <a key={link.label} href={link.href}
                  className="text-[10px] font-black uppercase tracking-widest transition-colors"
                  style={{ color: theme.textMuted }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = theme.primaryHex)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = theme.textMuted)}
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <p className="text-[10px] font-bold uppercase tracking-widest text-center md:text-right" style={{ color: theme.textMuted, opacity: 0.6 }}>
              Made with ♥ · 100% browser-based
            </p>
          </div>
        </div>
      </footer>
    );
  }

  // Rich variant — matches other tools' footer style exactly
  return (
    <footer
      role="contentinfo"
      className="border-t mt-16 relative overflow-hidden"
      style={{
        borderColor: theme.border,
        backgroundColor: theme.bg,
      }}
    >
      <div className="relative max-w-5xl mx-auto px-6 md:px-8 py-24 md:py-36 flex flex-col items-center space-y-16 text-center">
        {/* Credit */}
        {content.footerCredit && (
          <div
            className="text-xs font-black tracking-[0.6em] uppercase opacity-40"
            style={{ color: theme.textMuted }}
          >
            {content.footerCredit}
          </div>
        )}

        {/* Big logo */}
        <a
          href={`/${currentLang.toLowerCase()}`}
          className="flex items-center space-x-6 group scale-[1.1] md:scale-[1.5] outline-none shrink-0"
        >
          <div
            className="w-12 h-12 bg-red-600 rounded-[1.2rem] flex items-center justify-center group-hover:rotate-12 transition-transform"
            style={{ boxShadow: '0 15px 30px -5px rgba(239,68,68,0.5)' }}
          >
            <Heart className="w-7 h-7 text-white fill-white" />
          </div>
          <div className="flex items-center space-x-1 font-black text-4xl tracking-tighter">
            <span className="text-white transition-all group-hover:text-red-400">oLove</span>
            <span className="text-red-400 group-hover:translate-x-1 group-hover:text-white transition-all">Tools</span>
          </div>
        </a>

        {/* Tagline */}
        {content.footerTagline && (
          <p
            className="text-lg md:text-xl font-medium leading-relaxed max-w-2xl"
            style={{ color: theme.textMuted }}
          >
            {content.footerTagline}
          </p>
        )}

        {/* SEO Grid */}
        {(content.seoBrowserSpeedTitle || content.seoUseCaseTitle || content.seoPrivacyTitle) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-4xl border-t pt-16 mt-8 w-full" style={{ borderColor: theme.border }}>
            {content.seoBrowserSpeedTitle && (
              <div>
                <h3 className="text-white font-bold text-lg mb-3">{content.seoBrowserSpeedTitle}</h3>
                <p className="text-sm leading-relaxed" style={{ color: theme.textMuted }}>
                  {content.seoBrowserSpeedText}
                </p>
              </div>
            )}
            {content.seoUseCaseTitle && (
              <div>
                <h3 className="text-white font-bold text-lg mb-3">{content.seoUseCaseTitle}</h3>
                <p className="text-sm leading-relaxed" style={{ color: theme.textMuted }}>
                  {content.seoUseCaseText}
                </p>
              </div>
            )}
            {content.seoPrivacyTitle && (
              <div className="md:col-span-2">
                <h3 className="text-white font-bold text-lg mb-3">{content.seoPrivacyTitle}</h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: theme.textMuted }}>
                  {content.seoPrivacyText}
                </p>
                {content.seoKeywords && content.seoKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {content.seoKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="text-[10px] bg-white/5 border px-2 py-1 rounded"
                        style={{ color: theme.textMuted, borderColor: theme.border }}
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
          <div className="w-full text-left max-w-4xl border-t pt-16" style={{ borderColor: theme.border }}>
            {content.faqTitle && (
              <h2 className="text-white font-black text-2xl mb-8 tracking-tight text-center">
                {content.faqTitle}
              </h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {content.faq.map((item, i) => {
                const isOpen = openFaq === i;
                return (
                  <div
                    key={i}
                    className="p-6 rounded-2xl transition-colors"
                    style={{
                      backgroundColor: `${theme.primaryHex}05`,
                      border: `1px solid ${isOpen ? theme.primaryHex : theme.border}`,
                    }}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="w-full flex items-center justify-between gap-2 text-left"
                    >
                      <h4 className="text-white font-bold text-base">{item.question}</h4>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        style={{ color: theme.textMuted }}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: prefersReduced ? 0 : 0.2 }}
                          className="overflow-hidden"
                        >
                          <p className="text-sm leading-relaxed pt-3" style={{ color: theme.textMuted }}>
                            {item.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Legal links row */}
        <div
          className="flex flex-col md:flex-row flex-wrap items-center justify-center gap-y-2 md:gap-y-6 gap-x-4 md:gap-x-8 font-black text-[11px] md:text-xs tracking-widest pt-12 border-t w-full uppercase"
          style={{ borderColor: theme.border, color: theme.textMuted }}
        >
          <span className="w-full md:w-auto mb-4 md:mb-0 opacity-40">© {year} oLoveTools</span>

          <a
            href={`/${currentLang.toLowerCase()}/privacy`}
            className="w-full md:w-auto py-3 md:py-0 hover:opacity-100 transition-all cursor-pointer whitespace-nowrap rounded-xl text-center"
            onMouseEnter={(e) => (e.currentTarget.style.color = theme.primaryHex)}
            onMouseLeave={(e) => (e.currentTarget.style.color = theme.textMuted)}
          >
            {legal.nav?.privacy || 'Privacy'}
          </a>
          <a
            href={`/${currentLang.toLowerCase()}/terms`}
            className="w-full md:w-auto py-3 md:py-0 hover:opacity-100 transition-all cursor-pointer whitespace-nowrap rounded-xl text-center"
            onMouseEnter={(e) => (e.currentTarget.style.color = theme.primaryHex)}
            onMouseLeave={(e) => (e.currentTarget.style.color = theme.textMuted)}
          >
            {legal.nav?.terms || 'Terms'}
          </a>
          <a
            href={`/${currentLang.toLowerCase()}/cookies`}
            className="w-full md:w-auto py-3 md:py-0 hover:opacity-100 transition-all cursor-pointer whitespace-nowrap rounded-xl text-center"
            onMouseEnter={(e) => (e.currentTarget.style.color = theme.primaryHex)}
            onMouseLeave={(e) => (e.currentTarget.style.color = theme.textMuted)}
          >
            {legal.nav?.cookies || 'Cookies'}
          </a>
          <a
            href={`/${currentLang.toLowerCase()}/about`}
            className="w-full md:w-auto py-3 md:py-0 hover:opacity-100 transition-all cursor-pointer whitespace-nowrap rounded-xl text-center"
            onMouseEnter={(e) => (e.currentTarget.style.color = theme.primaryHex)}
            onMouseLeave={(e) => (e.currentTarget.style.color = theme.textMuted)}
          >
            {legal.nav?.about || 'About'}
          </a>

          <button
            onClick={handleEmailCopy}
            className="w-full md:w-auto py-3 md:py-0 hover:opacity-100 transition-all cursor-pointer whitespace-nowrap rounded-xl text-center inline-flex items-center gap-1.5 justify-center"
            onMouseEnter={(e) => (e.currentTarget.style.color = theme.primaryHex)}
            onMouseLeave={(e) => (e.currentTarget.style.color = theme.textMuted)}
          >
            {emailCopied ? (
              <><Check className="w-3.5 h-3.5" style={{ color: theme.primaryHex }} />{content.emailCopied || 'Copied!'}</>
            ) : (
              <><Mail className="w-3.5 h-3.5" />{content.emailAddress || 'adrian.contact.me.69@gmail.com'}</>
            )}
          </button>
        </div>
      </div>
    </footer>
  );
};
