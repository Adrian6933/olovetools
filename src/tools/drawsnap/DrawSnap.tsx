import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, Check, PenTool } from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { Board } from './components/Board';
import {
  DrawHeroArt,
  IconHandoff,
  IconObjects,
  IconOffline,
  IconPressure,
  IconTrace,
  IconVector,
  StepBoard,
  StepDrop,
  StepExport,
  StepRefine,
  StepTrace,
} from './components/Illustrations';
import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';
import { useReducedMotion, fadeInUp } from '../../components/shared/motion';

interface DrawSnapProps {
  lang: string;
  dictionary: any;
}

export const DrawSnap: React.FC<DrawSnapProps> = ({ lang, dictionary }) => {
  const t = dictionary || {};
  const prefersReduced = useReducedMotion();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'privacy' | 'terms' | 'cookies'>('privacy');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const steps = [
    {
      art: StepBoard,
      title: t.step1Title || 'Start on the paper you want',
      text: t.step1Text || 'Dot grid, squares, lines or plain, on a dark, light or transparent board.',
    },
    {
      art: StepDrop,
      title: t.step2Title || 'Drop a picture — or skip this',
      text: t.step2Text || 'Drag, paste or receive an image from another tool. Nothing runs until you say so.',
    },
    {
      art: StepTrace,
      title: t.step3Title || 'Trace it into strokes',
      text: t.step3Text || 'Contours become ordinary pencil strokes you can move, recolour and undo one by one.',
    },
    {
      art: StepRefine,
      title: t.step4Title || 'Draw and correct by hand',
      text: t.step4Text || 'Pressure-aware brush, Alt to erase, Shift to constrain, zoom at the cursor.',
    },
    {
      art: StepExport,
      title: t.step5Title || 'Export or keep going',
      text: t.step5Text || 'PNG up to 4×, real vector SVG, or straight into the next tool.',
    },
  ];

  const featureIcons = [IconPressure, IconVector, IconTrace, IconObjects, IconHandoff, IconOffline];
  const features =
    t.features || [
      { title: 'Ink that reacts to your hand', text: 'Pen pressure, or stroke speed on a mouse, drives the width of every line.' },
      { title: 'Vector all the way to the file', text: 'The SVG you download is the same geometry you drew, erasers included as real masks.' },
      { title: 'Turn a photo into strokes', text: 'A local tracer pulls contours out of any picture and hands them over as editable lines.' },
      { title: 'Edit objects, not pixels', text: 'Select, move, resize, duplicate, restack and recolour anything already on the board.' },
      { title: 'Chained with the rest of the suite', text: 'Send the board to compress, crop, convert or watermark it without downloading anything.' },
      { title: 'Nothing leaves the tab', text: 'No account, no upload, no server. Your board is autosaved in your own browser.' },
    ];

  return (
    <div className="min-h-screen flex flex-col bg-[#08060a] text-slate-100 selection:bg-purple-500/30 overflow-x-hidden font-sans">
      <Header
        currentLang={lang}
        onLanguageChange={newLang => {
          window.location.href = `/${newLang.toLowerCase()}/drawsnap`;
        }}
        onReset={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        t={t}
      />

      {/* Keep the workspace centered within its own maximum width. */}
      <main className="flex-1 flex flex-col items-center pt-20 md:pt-28 pb-24 px-3 sm:px-4 md:px-10 relative z-10 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))]">
        <div className="w-full space-y-10 md:space-y-16">
          <div className="space-y-2">
            <h1 className="text-[1.7rem] leading-tight md:text-5xl font-black font-outfit tracking-tight text-white">
              {t.h1 || 'Draw online: free drawing board'}
            </h1>
            <p className="text-sm md:text-lg text-slate-400 leading-relaxed max-w-3xl">
              {t.subtitle || 'Draw with your mouse, finger or stylus, trace a photo and download it as PNG or SVG. Free, no sign-up.'}
            </p>
          </div>

          {/* ================================================================ */}
          {/* Workspace                                                        */}
          {/* ================================================================ */}
          <section id="board">
            <Board lang={lang} t={t} />
          </section>

          <AdBanner id="adsense-drawsnap-top" />

          {/* ================================================================ */}
          {/* How it works                                                     */}
          {/* ================================================================ */}
          <section className="space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                {t.howItWorksTitle || 'How it works'}
              </h2>
              <div className="h-1 w-16 bg-purple-500 mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {steps.map((step, i) => {
                const Art = step.art;
                return (
                  <div
                    key={i}
                    className="relative glass-card rounded-3xl p-5 space-y-3 border border-white/5 hover:border-purple-500/20 transition-all group"
                  >
                    <span className="absolute top-4 right-5 text-4xl font-black text-white/5 group-hover:text-purple-500/10 transition-colors">
                      {i + 1}
                    </span>
                    <Art className="w-20 h-auto text-purple-400" />
                    <h3 className="text-sm font-bold text-white leading-snug">{step.title}</h3>
                    <p className="text-slate-500 text-[12px] leading-relaxed font-medium">{step.text}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ================================================================ */}
          {/* Features                                                         */}
          {/* ================================================================ */}
          <motion.section
            initial={prefersReduced ? false : 'hidden'}
            whileInView={prefersReduced ? undefined : 'visible'}
            viewport={{ once: true, amount: 0.15 }}
            variants={fadeInUp}
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
          >
            {features.map((feature: any, idx: number) => {
              const Icon = featureIcons[idx] || IconVector;
              return (
                <div
                  key={idx}
                  className="p-6 glass-card rounded-3xl text-left hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-purple-500/5 transition-all duration-300 group border border-white/5"
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 group-hover:border-purple-500/40 transition-all">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-white text-lg font-bold mb-2 group-hover:text-purple-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">{feature.text}</p>
                </div>
              );
            })}
          </motion.section>

          {/* ================================================================ */}
          {/* SEO content                                                      */}
          {/* ================================================================ */}
          <section className="space-y-16 md:space-y-20 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div className="space-y-6">
                <div className="inline-block px-4 py-1.5 rounded-lg bg-purple-500/10 text-purple-300 text-[11px] font-black uppercase tracking-[0.2em] border border-purple-500/20">
                  {t.badge}
                </div>
                <h2 className="text-2xl md:text-4xl font-black text-white leading-tight tracking-tight">
                  {t.seoBrowserSpeedTitle}
                </h2>
                <p className="text-slate-400 text-base md:text-lg leading-relaxed font-medium">
                  {t.seoBrowserSpeedText}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(t.seoHeroList || []).map((point: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all"
                    >
                      <span className="w-7 h-7 shrink-0 bg-purple-500/20 text-purple-300 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                      <span className="text-slate-300 font-bold text-sm">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative glass-card rounded-[2.5rem] p-8 py-12 min-h-[340px] flex flex-col items-center justify-center gap-6 text-center overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-purple-500/10 rounded-full blur-3xl" />
                <IconTrace className="w-20 h-20 text-purple-400 relative" />
                <div className="space-y-3 max-w-sm relative">
                  <h3 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight">
                    {t.seoSecondaryTitle || t.seoUseCaseTitle}
                  </h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">{t.seoUseCaseText}</p>
                </div>
              </div>
            </div>

            <div className="p-7 md:p-12 rounded-3xl md:rounded-[2.5rem] bg-[#0d0816] border border-white/5 space-y-8">
              <div className="max-w-4xl space-y-4">
                <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">{t.seoPrivacyTitle}</h2>
                <div className="h-1.5 w-20 bg-purple-500 rounded-full" />
              </div>
              <p className="text-slate-400 text-base leading-relaxed font-medium max-w-4xl">{t.seoPrivacyText}</p>
            </div>

            {/* FAQ */}
            <div className="max-w-4xl mx-auto w-full space-y-8">
              <div className="text-center space-y-3">
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{t.faqTitle}</h2>
                <div className="h-1 w-16 bg-purple-500 mx-auto rounded-full" />
              </div>
              <div className="grid gap-3">
                {(t.faq || []).map((faq: any, idx: number) => (
                  <details
                    key={idx}
                    className="glass-card rounded-2xl px-5 sm:px-6 py-5 text-left border border-white/5 hover:border-purple-500/20 transition-colors group [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex items-start gap-3 cursor-pointer list-none text-base font-bold text-white group-hover:text-purple-400 transition-colors">
                      <span className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 text-[11px] font-black">
                        Q
                      </span>
                      <span className="flex-1">{faq.question}</span>
                      <span className="shrink-0 text-purple-400 transition-transform group-open:rotate-45 text-xl leading-none">
                        +
                      </span>
                    </summary>
                    <p className="text-slate-400 leading-relaxed pl-9 pt-3 text-sm">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        </div>

      </main>

      <Footer
        lang={lang}
        t={t}
        onOpenModal={type => {
          setModalType(type);
          setModalOpen(true);
        }}
      />

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={t.scrollTopLabel || 'Back to top'}
          className="fixed bottom-10 right-10 z-[200] w-12 h-12 bg-white text-black rounded-2xl shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 hover:-translate-y-1 cursor-pointer"
        >
          <ArrowUp className="w-5 h-5 stroke-[3]" />
        </button>
      )}

      <LegalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          modalType === 'privacy'
            ? legalTranslations[lang]?.privacy.title || 'Privacy Policy'
            : modalType === 'terms'
            ? legalTranslations[lang]?.terms.title || 'Terms of Service'
            : legalTranslations[lang]?.cookies.title || 'Cookie Policy'
        }
        content={
          modalType === 'privacy'
            ? legalTranslations[lang]?.privacy.content || ''
            : modalType === 'terms'
            ? legalTranslations[lang]?.terms.content || ''
            : legalTranslations[lang]?.cookies.content || ''
        }
        t={t}
      />
    </div>
  );
};

export default DrawSnap;
