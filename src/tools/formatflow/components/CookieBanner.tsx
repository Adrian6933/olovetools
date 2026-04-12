import React, { useState, useEffect } from 'react';
import { useTranslation, Language } from '../../../locales/dictionary';
import { Cookie } from 'lucide-react';

interface CookieBannerProps {
  language: Language;
}

const CookieBanner: React.FC<CookieBannerProps> = ({ language }) => {
  const [isVisible, setIsVisible] = useState(false);
  const { dictionary } = useTranslation(language, 'formatflow');
  const t = dictionary.cookies;

  useEffect(() => {
    const hasAccepted = localStorage.getItem('cookiesAccepted');
    if (!hasAccepted) {
      // Small delay to allow initial animation
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookiesAccepted', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 pointer-events-none">
      <div className="max-w-4xl mx-auto bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 md:p-6 shadow-2xl pointer-events-auto animate-fade-in-up flex flex-col md:flex-row items-center gap-4 md:gap-8">
        <div className="flex items-center gap-4 flex-1">
          <div className="p-3 bg-primary/10 rounded-full shrink-0">
            <Cookie className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {t.message}{' '}
            <a href="#" className="text-primary hover:text-primary/80 underline underline-offset-2 font-medium transition-colors">
              {t.privacyPolicy}
            </a>.
          </p>
        </div>
        <button
          onClick={handleAccept}
          className="w-full md:w-auto whitespace-nowrap px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20 cursor-pointer"
        >
          {t.accept}
        </button>
      </div>
    </div>
  );
};

export default CookieBanner;
