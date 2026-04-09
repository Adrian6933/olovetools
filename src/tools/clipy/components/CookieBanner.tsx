import React, { useState, useEffect } from 'react';

interface CookieBannerProps {
  t: (key: string) => string;
}

const CookieBanner: React.FC<CookieBannerProps> = ({ t }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('clipy_standalone_cookies_accepted');
    if (!accepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('clipy_standalone_cookies_accepted', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-8 flex justify-center animate-in slide-in-from-bottom-full duration-700">
      <div className="bg-[#1c1c24] border border-white/10 rounded-[2rem] p-6 md:px-10 md:py-6 max-w-4xl w-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row items-center gap-6">
        <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed flex-grow">
          {t('cookie_banner')}
        </p>
        <button
          onClick={handleAccept}
          className="bg-twitch-base hover:bg-twitch-dark text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-twitch-base/20 whitespace-nowrap"
        >
          {t('accept')}
        </button>
      </div>
    </div>
  );
};

export default CookieBanner;