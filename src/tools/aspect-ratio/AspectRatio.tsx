import React, { useCallback, useRef, useState } from 'react';
import { Crop, Ratio, Share2 } from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { Calculator, DEFAULT_CALC, type CalcState } from './components/Calculator';
import { ImageFramer } from './components/ImageFramer';
import { PlatformTable } from './components/PlatformTable';
import { SeoSections } from './components/SeoSections';

import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';

interface AspectRatioProps {
  lang: string;
  dictionary: any;
}

/**
 * Aspect ratio calculator. The calculator people search for sits at the top,
 * visible without scrolling on a phone; converting an image to another ratio
 * and the per-platform sizes come right after, then the guide.
 */
export default function AspectRatio({ lang, dictionary }: AspectRatioProps) {
  const t = dictionary || {};
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [calc, setCalc] = useState<CalcState>(DEFAULT_CALC);
  const [framerKey, setFramerKey] = useState(0);
  const calcRef = useRef<HTMLDivElement | null>(null);

  const reset = useCallback(() => {
    setCalc(DEFAULT_CALC);
    setFramerKey(k => k + 1);
  }, []);

  const useSize = useCallback((w: number, h: number) => {
    setCalc(c => ({ ...c, w1: String(w), h1: String(h) }));
    calcRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const card = 'rounded-3xl bg-lime-950/20 border border-lime-500/10 backdrop-blur-xl p-4 md:p-6';
  const h2 = 'flex items-center gap-2.5 text-xl md:text-2xl font-black text-white tracking-tight';

  return (
    <div className="min-h-screen flex flex-col bg-[#080a02] text-slate-200 font-sans relative overflow-x-hidden">
      <Header
        currentLang={lang}
        onLanguageChange={l => (window.location.href = `/${l.toLowerCase()}/aspect-ratio/`)}
        onReset={reset}
        t={t}
      />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 pt-20 md:pt-28 pb-24 relative z-10">
        <div className="space-y-2 mb-4 md:mb-6">
          <h1 className="text-[1.7rem] leading-tight md:text-5xl font-black tracking-tight text-white">
            {t.h1 || 'Aspect ratio calculator'}
          </h1>
          <p className="text-sm md:text-lg text-slate-400 leading-relaxed max-w-3xl">
            {t.subtitle || 'Get the ratio of any size, resize without distorting, and convert an image to 16:9, 9:16 or 1:1. Free and in your browser.'}
          </p>
        </div>

        <section ref={calcRef} aria-label={t.h1 || 'Aspect ratio calculator'} className={`${card} scroll-mt-24`}>
          <Calculator t={t} state={calc} onChange={setCalc} />
        </section>

        <section aria-labelledby="ar-framer" className={`${card} mt-6`}>
          <h2 id="ar-framer" className={h2}>
            <Crop className="w-5 h-5 text-lime-400" />
            {t.framerTitle || 'Convert an image to another ratio'}
          </h2>
          <p className="text-sm text-slate-400 mt-1 mb-4">
            {t.framerIntro || 'Turn a horizontal photo into 9:16 for Reels and TikTok, or any picture into a square. Crop it or add bars, then download.'}
          </p>
          <ImageFramer key={framerKey} t={t} lang={lang} />
        </section>

        <AdBanner id="adsense-aspect-ratio-top" className="mt-8" />

        <section aria-labelledby="ar-platforms" className={`${card} mt-6`}>
          <h2 id="ar-platforms" className={h2}>
            <Share2 className="w-5 h-5 text-lime-400" />
            {t.platformsTitle || 'Sizes for social media and screens'}
          </h2>
          <p className="text-sm text-slate-400 mt-1 mb-3">
            {t.platformsIntro || 'Recommended sizes for each platform. Press “Use” to load one into the calculator.'}
          </p>
          <PlatformTable t={t} onUse={useSize} />
        </section>

        <SeoSections t={t} />

        <p className="mt-16 flex items-center justify-center gap-2 text-xs text-slate-600">
          <Ratio className="w-3.5 h-3.5" />
          {t.privacyLine || 'Everything is calculated in your browser. No image is uploaded.'}
        </p>
      </main>

      <Footer lang={lang} t={t} onOpenModal={modal => setLegalModal(modal)} />
      <LegalModal
        isOpen={legalModal === 'privacy'}
        onClose={() => setLegalModal(null)}
        title={legalTranslations[lang]?.privacy.title || 'Privacy Policy'}
        content={legalTranslations[lang]?.privacy.content}
        t={t}
      />
      <LegalModal
        isOpen={legalModal === 'terms'}
        onClose={() => setLegalModal(null)}
        title={legalTranslations[lang]?.terms.title || 'Terms of Service'}
        content={legalTranslations[lang]?.terms.content}
        t={t}
      />
      <LegalModal
        isOpen={legalModal === 'cookies'}
        onClose={() => setLegalModal(null)}
        title={legalTranslations[lang]?.cookies.title || 'Cookie Policy'}
        content={legalTranslations[lang]?.cookies.content}
        t={t}
      />
    </div>
  );
}
