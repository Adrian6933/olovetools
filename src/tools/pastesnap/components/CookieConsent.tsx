import React, { useState, useEffect } from 'react';
import { TranslationSet } from '../types';

interface CookieConsentProps {
  t: TranslationSet;
}

export const CookieConsent: React.FC<CookieConsentProps> = ({ t }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('cookie_accepted');
    if (!accepted) {
      setShow(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookie_accepted', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-8 left-0 right-0 flex justify-center z-[200] px-4">
      <div className="bg-[#0c0e1a]/90 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl w-full max-w-md text-center animate-in slide-in-from-bottom-10">
        <p className="text-gray-200 mb-6 font-medium">{t.cookieConsentMessage}</p>
        <button 
          onClick={accept}
          className="w-full px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        >
          {t.acceptCookies}
        </button>
      </div>
    </div>
  );
};
