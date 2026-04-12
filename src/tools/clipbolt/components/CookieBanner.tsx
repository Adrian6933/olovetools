import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface CookieBannerProps {
  lang: string;
}

const translations: Record<string, { text: string, accept: string, decline: string }> = {
  en: {
    text: "We use technical cookies to save your preferences and ensure the best experience on our website. We do not use tracking or advertising cookies.",
    accept: "Accept",
    decline: "Decline"
  },
  es: {
    text: "Utilizamos cookies técnicas para guardar tus preferencias y garantizar la mejor experiencia en nuestro sitio web. No utilizamos cookies de seguimiento ni publicidad.",
    accept: "Aceptar",
    decline: "Rechazar"
  },
  fr: {
    text: "Nous utilisons des cookies techniques pour enregistrer vos préférences et garantir la meilleure expérience sur notre site Web. Nous n'utilisons pas de cookies de suivi ou publicitaires.",
    accept: "Accepter",
    decline: "Refuser"
  },
  de: {
    text: "Wir verwenden technische Cookies, um Ihre Einstellungen zu speichern und die beste Erfahrung auf unserer Website zu gewährleisten. Wir verwenden keine Tracking- oder Werbe-Cookies.",
    accept: "Akzeptieren",
    decline: "Ablehnen"
  },
  pt: {
    text: "Usamos cookies técnicos para salvar suas preferências e garantir a melhor experiência em nosso site. Não usamos cookies de rastreamento ou publicidade.",
    accept: "Aceitar",
    decline: "Recusar"
  },
  ru: {
    text: "Мы используем технические файлы cookie для сохранения ваших настроек и обеспечения наилучшего опыта на нашем сайте. Мы не используем файлы cookie для отслеживания или рекламы.",
    accept: "Принять",
    decline: "Отклонить"
  },
  hi: {
    text: "हम आपकी प्राथमिकताओं को सहेजने और हमारी वेबसाइट पर सर्वोत्तम अनुभव सुनिश्चित करने के लिए तकनीकी कुकीज़ का उपयोग करते हैं। हम ट्रैकिंग या विज्ञापन कुकीज़ का उपयोग नहीं करते हैं।",
    accept: "स्वीकार करना",
    decline: "अस्वीकार करना"
  },
  ja: {
    text: "当社のウェブサイトで最高のエクスペリエンスを保証し、設定を保存するために技術的なCookieを使用しています。追跡や広告のCookieは使用していません。",
    accept: "同意する",
    decline: "拒否する"
  },
  zh: {
    text: "我们使用技术cookie来保存您的偏好并确保在我们的网站上获得最佳体验。我们不使用跟踪或广告cookie。",
    accept: "接受",
    decline: "拒绝"
  }
};

const CookieBanner: React.FC<CookieBannerProps> = ({ lang }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'true');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'false');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const t = translations[lang] || translations['en'];

  return (
    <div className="fixed bottom-0 left-0 w-full z-[100] p-4 md:p-6 pointer-events-none flex justify-center">
      <div className="bg-[#111114]/95 backdrop-blur-xl border border-white/10 p-5 md:p-6 rounded-3xl shadow-2xl max-w-4xl w-full flex flex-col md:flex-row items-center gap-6 pointer-events-auto animate-slide-up">
        <div className="flex-1 text-sm md:text-base text-gray-300 font-medium leading-relaxed">
          {t.text}
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
          <button 
            onClick={handleDecline}
            className="flex-1 md:flex-none px-6 py-3 rounded-xl border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-colors cursor-pointer"
          >
            {t.decline}
          </button>
          <button 
            onClick={handleAccept}
            className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-twitch text-white font-bold text-xs uppercase tracking-widest hover:bg-twitch-dark transition-colors shadow-lg shadow-twitch/20 cursor-pointer"
          >
            {t.accept}
          </button>
          <button 
            onClick={handleDecline}
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-colors md:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
