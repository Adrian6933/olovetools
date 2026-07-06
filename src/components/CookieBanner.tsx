import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

declare global {
  interface Window {
    updateAnalyticsConsent?: (state: 'granted' | 'denied') => void;
  }
}

interface CookieBannerProps {
  lang: string;
}

const translations: Record<string, { text: string, accept: string, decline: string }> = {
  en: {
    text: "We use cookies to personalize content and ads, and to analyze our traffic. By clicking 'Accept', you consent to our use of cookies for AdSense and analytics in accordance with our Privacy Policy.",
    accept: "Accept",
    decline: "Decline"
  },
  es: {
    text: "Utilizamos cookies para personalizar el contenido y los anuncios, y para analizar nuestro tráfico. Al hacer clic en 'Aceptar', consientes nuestro uso de cookies para AdSense y analíticas según nuestra Política de Privacidad.",
    accept: "Aceptar",
    decline: "Rechazar"
  },
  fr: {
    text: "Nous utilisons des cookies pour personnaliser le contenu et les annonces, et pour analyser notre trafic. En cliquant sur 'Accepter', vous consentez à notre utilisation des cookies pour AdSense et les analyses.",
    accept: "Accepter",
    decline: "Refuser"
  },
  de: {
    text: "Wir verwenden Cookies, um Inhalte und Anzeigen zu personalisieren und unseren Datenverkehr zu analysieren. Durch Klicken auf 'Akzeptieren' stimmen Sie unserer Verwendung von Cookies für AdSense und Analysen zu.",
    accept: "Akzeptieren",
    decline: "Ablehnen"
  },
  pt: {
    text: "Usamos cookies para personalizar conteúdo e anúncios, e para analisar nosso tráfego. Ao clicar em 'Aceitar', você concorda com o uso de cookies para AdSense e análises.",
    accept: "Aceitar",
    decline: "Recusar"
  },
  ru: {
    text: "Мы используем файлы cookie для персонализации контента и рекламы, а также для анализа нашего трафика. Нажимая «Принять», вы соглашаетесь на использование файлов cookie для AdSense и аналитики.",
    accept: "Принять",
    decline: "Отклонить"
  },
  hi: {
    text: "हम सामग्री और विज्ञापनों को वैयक्तिकृत करने और अपने ट्रैफ़िक का विश्लेषण करने के लिए कुकीज़ का उपयोग करते हैं। 'स्वीकार करें' पर क्लिक करके, आप AdSense और विश्लेषण के लिए कुकीज़ के हमारे उपयोग पर सहमति देते हैं।",
    accept: "स्वीकार करना",
    decline: "अस्वीकार करना"
  },
  ja: {
    text: "コンテンツや広告をパーソナライズし、トラフィックを分析するためにCookieを使用します。「同意する」をクリックすると、AdSenseと分析のCookie使用に同意したことになります。",
    accept: "同意する",
    decline: "拒否する"
  },
  zh: {
    text: "我们使用 cookie 来个性化内容和广告，并分析我们的流量。点击“接受”，即表示您同意我们为 AdSense 和分析使用 cookie。",
    accept: "接受",
    decline: "拒绝"
  }
};

export const CookieBanner: React.FC<CookieBannerProps> = ({ lang }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setIsVisible(true);
    } else {
      window.updateAnalyticsConsent?.(consent === 'true' ? 'granted' : 'denied');
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'true');
    window.updateAnalyticsConsent?.('granted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'false');
    window.updateAnalyticsConsent?.('denied');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const t = translations[lang] || translations['en'];

  return (
    <div className="fixed bottom-0 left-0 w-full z-[9999] p-4 md:p-6 pointer-events-none flex justify-center">
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
            className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20 cursor-pointer"
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
