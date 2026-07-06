import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  QrCode, 
  Link as LinkIcon, 
  FileText, 
  Wifi, 
  Mail, 
  MessageSquare, 
  Palette, 
  Image as ImageIcon, 
  Sparkles, 
  Download, 
  RefreshCw, 
  Settings, 
  Lock, 
  HelpCircle, 
  ArrowUp, 
  ChevronDown
} from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { useTranslation, Language } from '../../locales/dictionary';
import { AdBanner } from '../../components/shared/AdBanner';
import { QrMode, DotType, CornerType, CornerDotType, ColorType, GradientType, WiFiConfig, EmailConfig, SmsConfig } from './types';

// Preset Brand SVGs (encoded with %23 for '#' to render safely in browser Image objects)
const PRESET_LOGOS: Record<string, string> = {
  whatsapp: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2325D366'><path d='M12.004 0C5.372 0 0 5.372 0 12c0 2.112.552 4.164 1.596 5.976L.048 24l6.192-1.62C8.016 23.364 9.972 24 12.004 24c6.628 0 12.004-5.376 12.004-12S18.632 0 12.004 0zm0 21.996c-1.896 0-3.756-.504-5.388-1.464l-.384-.228-3.66 1.056.972-3.564-.252-.396C2.268 15.684 1.74 13.884 1.74 12c0-5.652 4.608-10.26 10.264-10.26 5.652 0 10.26 4.608 10.26 10.26s-4.608 10.26-10.26 10.26zm5.28-7.392c-.288-.144-1.716-.852-1.98-1.02-.264-.096-.456-.144-.648.144-.192.288-.744.948-.912 1.14-.168.192-.336.216-.624.072-.288-.144-1.224-.456-2.328-1.44-.864-.768-1.44-1.728-1.608-2.016-.168-.288-.024-.444.12-.588.132-.132.288-.336.432-.504.144-.168.192-.288.288-.48.096-.192.048-.36-.024-.504-.072-.144-.648-1.56-.888-2.136-.24-.564-.48-.492-.648-.504-.168-.006-.36-.006-.552-.006-.192 0-.504.072-.768.36-.264.288-1.008.984-1.008 2.4s1.032 2.784 1.176 2.976c.144.192 2.028 3.108 4.92 4.356.684.288 1.224.468 1.644.6.696.216 1.332.186 1.836.108.564-.084 1.716-.708 1.956-1.392.24-.684.24-1.272.168-1.392-.072-.12-.264-.192-.552-.336z'/></svg>",
  instagram: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23E1306C'><path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z'/></svg>",
  youtube: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23FF0000'><path d='M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.528 3.545 12 3.545 12 3.545s-7.528 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.023 0 12 0 12s0 3.977.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.86.508 9.388.508 9.388.508s7.528 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.977 24 12 24 12s0-3.977-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'/></svg>",
  facebook: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%231877F2'><path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'/></svg>",
  twitter: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23000000'><path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'/></svg>",
  github: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23181717'><path d='M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12'/></svg>",
  linkedin: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230A66C2'><path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'/></svg>"
};

interface QrboltProps {
  lang: Language;
  dictionary?: any;
}

export const Qrbolt: React.FC<QrboltProps> = ({ lang, dictionary }) => {
  const { dictionary: t } = useTranslation((lang || 'en') as Language, 'qr-bolt');

  // Interactive Tabs
  const [activeTab, setActiveTab] = useState<'content' | 'design' | 'logo'>('content');

  // Input Data States
  const [mode, setMode] = useState<QrMode>('url');
  const [url, setUrl] = useState<string>('https://example.com');
  const [text, setText] = useState<string>('');
  
  // WiFi states
  const [wifiSsid, setWifiSsid] = useState<string>('');
  const [wifiPassword, setWifiPassword] = useState<string>('');
  const [wifiSecurity, setWifiSecurity] = useState<'WEP' | 'WPA' | 'nopass'>('WPA');

  // Email states
  const [emailAddress, setEmailAddress] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailBody, setEmailBody] = useState<string>('');

  // SMS states
  const [smsNumber, setSmsNumber] = useState<string>('');
  const [smsMessage, setSmsMessage] = useState<string>('');

  // Customization States
  const [dotType, setDotType] = useState<DotType>('square');
  const [cornerType, setCornerType] = useState<CornerType>('square');
  const [cornerDotType, setCornerDotType] = useState<CornerDotType>('square');
  
  // Colors configuration
  const [colorType, setColorType] = useState<ColorType>('solid');
  const [dotsColor, setDotsColor] = useState<string>('#10b981');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  
  // Gradient states
  const [gradientType, setGradientType] = useState<GradientType>('linear');
  const [gradientColor1, setGradientColor1] = useState<string>('#10b981');
  const [gradientColor2, setGradientColor2] = useState<string>('#065f46');
  const [gradientRotation, setGradientRotation] = useState<number>(0);

  // Independent corner styling
  const [customCornerColor, setCustomCornerColor] = useState<boolean>(false);
  const [cornerColor, setCornerColor] = useState<string>('#10b981');

  // Logo Overlays
  const [logoPreset, setLogoPreset] = useState<string>('none');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState<number>(0.15);
  const [logoMargin, setLogoMargin] = useState<number>(10);
  const [clearDots, setClearDots] = useState<boolean>(true);

  // App / Render Status
  const [status, setStatus] = useState<'idle' | 'ready' | 'error'>('idle');
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const [activeFaqIdx, setActiveFaqIdx] = useState<number | null>(null);

  // Refs
  const qrContainerRef = useRef<HTMLDivElement | null>(null);
  const qrCodeStylingRef = useRef<any>(null);

  // 1. Client-only dynamic load of qr-code-styling library
  useEffect(() => {
    import('qr-code-styling').then((module) => {
      const QRCodeStyling = module.default;
      const qrCode = new QRCodeStyling({
        width: 300,
        height: 300,
        dotsOptions: { type: 'square', color: '#10b981' },
        backgroundOptions: { color: '#ffffff' },
        imageOptions: { crossOrigin: 'anonymous', margin: 10 }
      });
      qrCodeStylingRef.current = qrCode;
      setStatus('ready');
    }).catch(err => {
      console.error('Failed to import qr-code-styling:', err);
      setStatus('error');
    });
  }, []);

  // 2. React to container mount
  useEffect(() => {
    if (qrCodeStylingRef.current && qrContainerRef.current) {
      qrContainerRef.current.innerHTML = "";
      qrCodeStylingRef.current.append(qrContainerRef.current);
    }
  }, [status]);

  // 3. Update QR code parameters reactively on state changes
  useEffect(() => {
    if (!qrCodeStylingRef.current) return;

    // A. Formulate data payload based on selected type
    let finalData = "";
    if (mode === 'url') {
      finalData = url || "https://example.com";
    } else if (mode === 'text') {
      finalData = text || "Plain Text Message";
    } else if (mode === 'wifi') {
      const escapeWifi = (val: string) => val.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/:/g, '\\:').replace(/,/g, '\\,');
      const ssid = escapeWifi(wifiSsid || "WiFi Network");
      const pass = escapeWifi(wifiPassword || "");
      finalData = `WIFI:S:${ssid};T:${wifiSecurity};P:${pass};;`;
    } else if (mode === 'email') {
      const esc = (val: string) => encodeURIComponent(val);
      finalData = `mailto:${emailAddress}?subject=${esc(emailSubject)}&body=${esc(emailBody)}`;
    } else if (mode === 'sms') {
      finalData = `SMSTO:${smsNumber}:${smsMessage}`;
    }

    // B. Determine target image logo (uploaded file URL or brand preset)
    let currentLogoUrl: string | null = null;
    if (logoPreset !== 'none') {
      currentLogoUrl = PRESET_LOGOS[logoPreset];
    } else if (logoUrl) {
      currentLogoUrl = logoUrl;
    }

    // C. Perform updates
    qrCodeStylingRef.current.update({
      data: finalData,
      dotsOptions: {
        type: dotType,
        color: colorType === 'solid' ? dotsColor : undefined,
        gradient: colorType === 'gradient' ? {
          type: gradientType,
          colorStops: [
            { offset: 0, color: gradientColor1 },
            { offset: 1, color: gradientColor2 }
          ],
          rotation: (gradientRotation * Math.PI) / 180
        } : undefined
      },
      backgroundOptions: {
        color: bgColor
      },
      cornersSquareOptions: {
        type: cornerType,
        color: customCornerColor ? cornerColor : (colorType === 'solid' ? dotsColor : gradientColor1)
      },
      cornersDotOptions: {
        type: cornerDotType,
        color: customCornerColor ? cornerColor : (colorType === 'solid' ? dotsColor : gradientColor1)
      },
      image: currentLogoUrl || undefined,
      imageOptions: {
        crossOrigin: 'anonymous',
        hideBackgroundDots: clearDots,
        imageSize: logoSize,
        margin: logoMargin
      }
    });
  }, [
    mode, url, text, 
    wifiSsid, wifiPassword, wifiSecurity, 
    emailAddress, emailSubject, emailBody, 
    smsNumber, smsMessage,
    dotType, cornerType, cornerDotType,
    colorType, dotsColor, bgColor,
    gradientType, gradientColor1, gradientColor2, gradientRotation,
    customCornerColor, cornerColor,
    logoPreset, logoUrl, logoSize, logoMargin, clearDots,
    status
  ]);

  // Handle local logo file uploads
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoPreset('none');
          setLogoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Download Trigger
  const handleDownload = (ext: 'png' | 'svg' | 'jpeg') => {
    if (qrCodeStylingRef.current) {
      qrCodeStylingRef.current.download({
        name: `QRBolt-Code-${mode}`,
        extension: ext
      });
    }
  };

  // Reset app settings to factory defaults
  const handleReset = () => {
    setUrl('https://example.com');
    setText('');
    setWifiSsid('');
    setWifiPassword('');
    setWifiSecurity('WPA');
    setEmailAddress('');
    setEmailSubject('');
    setEmailBody('');
    setSmsNumber('');
    setSmsMessage('');
    setDotType('square');
    setCornerType('square');
    setCornerDotType('square');
    setColorType('solid');
    setDotsColor('#10b981');
    setBgColor('#ffffff');
    setGradientColor1('#10b981');
    setGradientColor2('#065f46');
    setGradientRotation(0);
    setGradientType('linear');
    setCustomCornerColor(false);
    setCornerColor('#10b981');
    setLogoPreset('none');
    setLogoUrl(null);
    setLogoSize(0.15);
    setLogoMargin(10);
    setClearDots(true);
    setActiveTab('content');
  };

  // Scroll to top helper
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLanguageChange = (newLang: string) => {
    window.location.href = `/${newLang.toLowerCase()}/qr-bolt`;
  };


  // Map translations safely
  const faqs = Array.isArray(t.faq) ? t.faq : [];
  const keywords = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];
  const featuresList = Array.isArray(t.features) ? t.features : [];

  return (
    <div className="min-h-screen flex flex-col bg-[#050907] text-slate-100 selection:bg-emerald-500/30 overflow-x-hidden font-sans">
      {/* Background Glow Orbs */}
      

      <Header currentLang={lang} onLanguageChange={handleLanguageChange} onReset={handleReset} t={t} />

      <main className="flex-1 flex flex-col items-center pt-36 pb-32 px-4 md:px-12 relative z-10 w-full">
        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-qr-bolt-top" />
        <div className="max-w-6xl w-full text-center space-y-16 md:space-y-24">
          
          {/* Hero Header */}
          <div className="flex flex-col items-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center space-x-2 px-5 py-2 rounded-full bg-emerald-950/40 border border-emerald-800/30 text-emerald-400 text-xs font-black tracking-widest uppercase shadow-[0_0_25px_rgba(16,185,129,0.15)]">
              <Sparkles className="w-4 h-4 animate-float" />
              <span>{t.title}</span>
            </div>
            
            <h1 className="text-4xl md:text-[5.5rem] font-black tracking-tight leading-[0.9] text-white bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-400">
              {t.title}
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              {t.description}
            </p>
          </div>

          {/* Interactive Core Box */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Box: Configuration Dashboard (Tabs) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Tabs Switcher */}
              <div className="flex p-1 rounded-2xl bg-[#0a140f]/80 border border-white/5 shadow-2xl gap-1 w-full">
                {[
                  { id: 'content', label: t.tabContent, icon: FileText },
                  { id: 'design', label: t.tabDesign, icon: Palette },
                  { id: 'logo', label: t.tabLogo, icon: ImageIcon }
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 flex items-center justify-center space-x-2 py-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none outline-none
                        ${isActive 
                          ? 'bg-emerald-600 text-white shadow-[0_0_25px_rgba(16,185,129,0.4)]' 
                          : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Contents Card */}
              <div className="glass-card rounded-3xl p-6 md:p-8 text-left space-y-6 relative overflow-hidden min-h-[420px]">
                

                {/* TAB 1: CONTENT */}
                {activeTab === 'content' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    
                    {/* QR Type selection buttons */}
                    <div className="space-y-3">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.labelMode}</label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                        {[
                          { id: 'url', label: t.modeUrl, icon: LinkIcon },
                          { id: 'text', label: t.modeText, icon: FileText },
                          { id: 'wifi', label: t.modeWifi, icon: Wifi },
                          { id: 'email', label: t.modeEmail, icon: Mail },
                          { id: 'sms', label: t.modeSms, icon: MessageSquare }
                        ].map(type => {
                          const Icon = type.icon;
                          const isSel = mode === type.id;
                          return (
                            <button
                              key={type.id}
                              onClick={() => setMode(type.id as QrMode)}
                              className={`p-3 rounded-xl border text-center transition-all cursor-pointer outline-none flex flex-col items-center justify-center gap-1.5 h-16 ${
                                isSel 
                                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400 shadow-inner' 
                                  : 'bg-[#0b120e]/40 border-white/5 text-slate-400 hover:text-white hover:bg-[#0b120e]/80'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              <span className="text-[10px] font-bold tracking-tight">{type.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Mode Forms */}
                    {mode === 'url' && (
                      <div className="space-y-2 animate-in slide-in-from-top-4 duration-300">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.modeUrl}</label>
                        <input
                          type="text"
                          placeholder={t.placeholderUrl}
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          className="w-full bg-[#080d0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-emerald-500 font-medium"
                        />
                      </div>
                    )}

                    {mode === 'text' && (
                      <div className="space-y-2 animate-in slide-in-from-top-4 duration-300">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.modeText}</label>
                        <textarea
                          placeholder={t.placeholderText}
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          rows={4}
                          className="w-full bg-[#080d0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-emerald-500 font-medium resize-none"
                        />
                      </div>
                    )}

                    {mode === 'wifi' && (
                      <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                        <div className="space-y-2">
                          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.labelWifiSsid}</label>
                          <input
                            type="text"
                            placeholder="e.g. My Home Network"
                            value={wifiSsid}
                            onChange={(e) => setWifiSsid(e.target.value)}
                            className="w-full bg-[#080d0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-emerald-500 font-medium"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.labelWifiPassword}</label>
                            <input
                              type="password"
                              placeholder="Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢"
                              value={wifiPassword}
                              onChange={(e) => setWifiPassword(e.target.value)}
                              className="w-full bg-[#080d0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-emerald-500 font-mono"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.labelWifiSecurity}</label>
                            <select
                              value={wifiSecurity}
                              onChange={(e) => setWifiSecurity(e.target.value as any)}
                              className="w-full h-[46px] bg-[#080d0a] border border-white/10 rounded-xl px-4 text-sm text-slate-200 outline-none focus:border-emerald-500"
                            >
                              <option value="WPA">WPA/WPA2</option>
                              <option value="WEP">WEP</option>
                              <option value="nopass">Unsecured (Open)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {mode === 'email' && (
                      <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                        <div className="space-y-2">
                          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.labelEmailAddress}</label>
                          <input
                            type="email"
                            placeholder="e.g. contact@example.com"
                            value={emailAddress}
                            onChange={(e) => setEmailAddress(e.target.value)}
                            className="w-full bg-[#080d0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-emerald-500 font-medium"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.labelEmailSubject}</label>
                          <input
                            type="text"
                            placeholder="e.g. Hello from QR Code"
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            className="w-full bg-[#080d0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-emerald-500 font-medium"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.labelEmailBody}</label>
                          <textarea
                            placeholder="Type the email message body here..."
                            value={emailBody}
                            onChange={(e) => setEmailBody(e.target.value)}
                            rows={3}
                            className="w-full bg-[#080d0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-emerald-500 font-medium resize-none"
                          />
                        </div>
                      </div>
                    )}

                    {mode === 'sms' && (
                      <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                        <div className="space-y-2">
                          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.labelSmsNumber}</label>
                          <input
                            type="text"
                            placeholder="e.g. +1234567890"
                            value={smsNumber}
                            onChange={(e) => setSmsNumber(e.target.value)}
                            className="w-full bg-[#080d0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-emerald-500 font-mono"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.labelSmsMessage}</label>
                          <textarea
                            placeholder="Type SMS text message here..."
                            value={smsMessage}
                            onChange={(e) => setSmsMessage(e.target.value)}
                            rows={3}
                            className="w-full bg-[#080d0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-emerald-500 font-medium resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: DESIGN CUSTOMIZER */}
                {activeTab === 'design' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    
                    {/* Pattern/Shape Selectors */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      
                      <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.labelDotType}</label>
                        <select
                          value={dotType}
                          onChange={(e) => setDotType(e.target.value as DotType)}
                          className="w-full bg-[#080d0a] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
                        >
                          <option value="square">Square</option>
                          <option value="rounded">Rounded</option>
                          <option value="dots">Dots</option>
                          <option value="classy">Classy</option>
                          <option value="classy-rounded">Classy Rounded</option>
                          <option value="extra-rounded">Extra Rounded</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.labelCornerType}</label>
                        <select
                          value={cornerType}
                          onChange={(e) => setCornerType(e.target.value as CornerType)}
                          className="w-full bg-[#080d0a] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
                        >
                          <option value="square">Square</option>
                          <option value="rounded">Rounded</option>
                          <option value="dot">Dot</option>
                          <option value="extra-rounded">Extra Rounded</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.labelCornerDotType}</label>
                        <select
                          value={cornerDotType}
                          onChange={(e) => setCornerDotType(e.target.value as CornerDotType)}
                          className="w-full bg-[#080d0a] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
                        >
                          <option value="square">Square</option>
                          <option value="rounded">Rounded</option>
                          <option value="dot">Dot</option>
                        </select>
                      </div>
                    </div>

                    {/* Color selection layout */}
                    <div className="border-t border-white/5 pt-4 space-y-4">
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">{t.labelColorType}</label>
                        <div className="flex bg-[#080d0a] p-1 border border-white/5 rounded-xl gap-1 shrink-0">
                          {[
                            { id: 'solid', label: t.colorSolid },
                            { id: 'gradient', label: t.colorGradient }
                          ].map(opt => (
                            <button
                              key={opt.id}
                              onClick={() => setColorType(opt.id as ColorType)}
                              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer outline-none ${
                                colorType === opt.id ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        
                        {/* Background Color Picker */}
                        <div className="p-4 bg-[#080d0a]/60 border border-white/5 rounded-2xl flex items-center justify-between gap-4">
                          <div>
                            <span className="text-xs font-bold text-white block">{t.labelBgColor}</span>
                            <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{bgColor.toUpperCase()}</span>
                          </div>
                          <input
                            type="color"
                            value={bgColor}
                            onChange={(e) => setBgColor(e.target.value)}
                            className="w-10 h-10 border-0 outline-none cursor-pointer rounded-lg bg-transparent shrink-0"
                          />
                        </div>

                        {/* Solid Dots Color Picker */}
                        {colorType === 'solid' && (
                          <div className="p-4 bg-[#080d0a]/60 border border-white/5 rounded-2xl flex items-center justify-between gap-4">
                            <div>
                              <span className="text-xs font-bold text-white block">{t.labelMainColor}</span>
                              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{dotsColor.toUpperCase()}</span>
                            </div>
                            <input
                              type="color"
                              value={dotsColor}
                              onChange={(e) => setDotsColor(e.target.value)}
                              className="w-10 h-10 border-0 outline-none cursor-pointer rounded-lg bg-transparent shrink-0"
                            />
                          </div>
                        )}
                      </div>

                      {/* Gradient configuration */}
                      {colorType === 'gradient' && (
                        <div className="p-5 bg-[#080d0a]/40 border border-white/5 rounded-2xl space-y-4 animate-in slide-in-from-top-4 duration-300">
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.labelGradientColor1}</label>
                              <div className="flex items-center space-x-2 bg-[#080d0a] border border-white/10 rounded-xl px-3 py-1.5">
                                <input
                                  type="color"
                                  value={gradientColor1}
                                  onChange={(e) => setGradientColor1(e.target.value)}
                                  className="w-8 h-8 border-0 cursor-pointer rounded"
                                />
                                <span className="font-mono text-xs font-medium text-slate-300 uppercase">{gradientColor1}</span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.labelGradientColor2}</label>
                              <div className="flex items-center space-x-2 bg-[#080d0a] border border-white/10 rounded-xl px-3 py-1.5">
                                <input
                                  type="color"
                                  value={gradientColor2}
                                  onChange={(e) => setGradientColor2(e.target.value)}
                                  className="w-8 h-8 border-0 cursor-pointer rounded"
                                />
                                <span className="font-mono text-xs font-medium text-slate-300 uppercase">{gradientColor2}</span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                            <div className="space-y-2">
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.labelGradientType}</label>
                              <select
                                value={gradientType}
                                onChange={(e) => setGradientType(e.target.value as GradientType)}
                                className="w-full bg-[#080d0a] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
                              >
                                <option value="linear">{t.gradLinear}</option>
                                <option value="radial">{t.gradRadial}</option>
                              </select>
                            </div>

                            {gradientType === 'linear' && (
                              <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                  <span>{t.labelGradientRotation}</span>
                                  <span className="text-emerald-400 font-bold">{gradientRotation}Ã‚Â°</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="360"
                                  value={gradientRotation}
                                  onChange={(e) => setGradientRotation(Number(e.target.value))}
                                  className="w-full h-1 bg-white/10 rounded outline-none accent-emerald-500 cursor-pointer"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Independent eye/corner color style */}
                      <div className="border-t border-white/5 pt-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Custom Eye Corners</span>
                            <p className="text-[10px] text-slate-500 font-medium">Style corner frame blocks with independent colors</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={customCornerColor} 
                              onChange={(e) => setCustomCornerColor(e.target.checked)}
                              className="sr-only peer outline-none" 
                            />
                            <div className="w-9 h-5 bg-[#080d0a] rounded-full border border-white/10 peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-400 after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:bg-emerald-400 peer-checked:border-emerald-500/50" />
                          </label>
                        </div>

                        {customCornerColor && (
                          <div className="p-4 bg-[#080d0a]/60 border border-white/5 rounded-2xl flex items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300">
                            <div>
                              <span className="text-xs font-bold text-white block">Eye Corner Color</span>
                              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{cornerColor.toUpperCase()}</span>
                            </div>
                            <input
                              type="color"
                              value={cornerColor}
                              onChange={(e) => setCornerColor(e.target.value)}
                              className="w-10 h-10 border-0 outline-none cursor-pointer rounded-lg bg-transparent shrink-0"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: LOGO OVERLAYS */}
                {activeTab === 'logo' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    
                    {/* Brand Presets */}
                    <div className="space-y-3">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.labelPresetLogo}</label>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                        {[
                          { id: 'none', label: t.logoPresetNone },
                          { id: 'whatsapp', label: 'WA' },
                          { id: 'instagram', label: 'IG' },
                          { id: 'youtube', label: 'YT' },
                          { id: 'facebook', label: 'FB' },
                          { id: 'twitter', label: 'X' },
                          { id: 'github', label: 'GH' },
                          { id: 'linkedin', label: 'IN' }
                        ].map(brand => {
                          const isSel = logoPreset === brand.id;
                          return (
                            <button
                              key={brand.id}
                              onClick={() => {
                                setLogoPreset(brand.id);
                                setLogoUrl(null);
                              }}
                              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer outline-none flex items-center justify-center font-black text-xs h-12 ${
                                isSel 
                                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400 shadow-inner' 
                                  : 'bg-[#0b120e]/40 border-white/5 text-slate-500 hover:text-white hover:bg-[#0b120e]/80'
                              }`}
                            >
                              {brand.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom Logo upload block */}
                    <div className="space-y-3 border-t border-white/5 pt-4">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.labelUploadLogo}</label>
                      
                      <div className="flex items-center space-x-4">
                        <label className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all active:scale-95 shadow-md shadow-emerald-500/20 outline-none">
                          Browse File...
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </label>
                        {logoUrl && (
                          <div className="flex items-center space-x-2">
                            <img src={logoUrl} className="w-10 h-10 object-contain rounded border border-white/10 bg-white/5 p-0.5" />
                            <button 
                              onClick={() => setLogoUrl(null)}
                              className="text-xs text-red-400 hover:text-red-300 font-bold uppercase transition-colors outline-none cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Logo sizing sliders */}
                    {(logoPreset !== 'none' || logoUrl) && (
                      <div className="space-y-4 border-t border-white/5 pt-4 animate-in slide-in-from-top-4 duration-300">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              <span>{t.labelLogoSize}</span>
                              <span className="text-emerald-400 font-bold">{Math.round(logoSize * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0.05"
                              max="0.35"
                              step="0.01"
                              value={logoSize}
                              onChange={(e) => setLogoSize(Number(e.target.value))}
                              className="w-full h-1 bg-white/10 rounded outline-none accent-emerald-500 cursor-pointer"
                            />
                            <p className="text-[9px] text-slate-500 font-medium">Keeping logo scale under 20% ensures error correction keeps QR readable.</p>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              <span>{t.labelLogoMargin}</span>
                              <span className="text-emerald-400 font-bold">{logoMargin}px</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="30"
                              value={logoMargin}
                              onChange={(e) => setLogoMargin(Number(e.target.value))}
                              className="w-full h-1 bg-white/10 rounded outline-none accent-emerald-500 cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Background dots clear toggle */}
                        <div className="flex items-center justify-between pt-2">
                          <label className="text-xs font-bold text-slate-300">{t.labelClearDots}</label>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={clearDots} 
                              onChange={(e) => setClearDots(e.target.checked)}
                              className="sr-only peer outline-none" 
                            />
                            <div className="w-9 h-5 bg-[#080d0a] rounded-full border border-white/10 peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-400 after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:bg-emerald-400 peer-checked:border-emerald-500/50" />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Box: Live QR Code Preview Card */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="glass-card rounded-3xl p-6 md:p-8 space-y-8 flex flex-col items-center">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest self-start">Live QR Code</h3>
                
                {/* QR output container element */}
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/5 blur-xl rounded-full scale-125 pointer-events-none"></div>
                  
                  {/* Outer glowing frame */}
                  <div className="p-3 bg-[#080d0a] border border-white/10 rounded-2xl relative z-10 shadow-2xl flex items-center justify-center">
                    <div 
                      ref={qrContainerRef} 
                      className="w-[280px] h-[280px] sm:w-[300px] sm:h-[300px] flex items-center justify-center overflow-hidden bg-white rounded-lg border border-white/5"
                    />
                  </div>
                </div>

                <div className="space-y-4 w-full">
                  
                  {/* Download Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => handleDownload('png')}
                      className="py-4 bg-emerald-600 hover:bg-emerald-500 text-black font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                    >
                      <Download className="w-4 h-4 stroke-[2.5]" />
                      <span>{t.downloadBtnPng}</span>
                    </button>

                    <button
                      onClick={() => handleDownload('svg')}
                      className="py-4 border border-white/10 hover:border-emerald-500/40 hover:bg-white/5 text-white font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer"
                    >
                      <Download className="w-4 h-4 stroke-[2]" />
                      <span>{t.downloadBtnSvg}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleDownload('jpeg')}
                    className="w-full py-3 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors cursor-pointer outline-none"
                  >
                    {t.downloadBtnJpg}
                  </button>

                  <div className="border-t border-white/5 pt-4 flex items-center justify-center space-x-2 text-[10px] text-slate-500 font-bold">
                    <Lock className="w-3.5 h-3.5 text-emerald-500/70" />
                    <span>Processed entirely in browser. No tracking or scan collection.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Features Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16">
            {featuresList.map((feature: any, idx: number) => (
              <div 
                key={idx}
                className="glass-card p-8 rounded-3xl text-left hover:-translate-y-1 transition-all duration-300 glow-emerald border border-white/5 relative overflow-hidden"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
                  {idx === 0 && <Palette className="w-6 h-6" />}
                  {idx === 1 && <Lock className="w-6 h-6" />}
                  {idx === 2 && <Download className="w-6 h-6" />}
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed font-medium">{feature.text}</p>
              </div>
            ))}
          </div>

          {/* FAQ Accordion Section */}
          {faqs.length > 0 && (
            <div className="space-y-12 max-w-4xl mx-auto pt-16 text-left">
              <h2 className="text-3xl font-black text-white tracking-tight border-b border-white/5 pb-4 flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-emerald-400 animate-float" />
                <span>{t.faqTitle}</span>
              </h2>
              
              <div className="space-y-6">
                {faqs.map((faqItem: any, idx: number) => {
                  const isAct = activeFaqIdx === idx;
                  return (
                    <div 
                      key={idx} 
                      className="glass-card rounded-2xl p-6 md:p-8 space-y-3 cursor-pointer select-none"
                      onClick={() => setActiveFaqIdx(isAct ? null : idx)}
                    >
                      <h4 className="text-lg font-bold text-white tracking-tight flex items-center justify-between gap-3">
                        <span className="flex items-start gap-3">
                          <span className="text-emerald-400 font-black">Q:</span>
                          <span>{faqItem.question}</span>
                        </span>
                        <span className="text-emerald-400 font-bold text-sm shrink-0">
                          {isAct ? 'Ã¢Ë†â€™' : '+'}
                        </span>
                      </h4>
                      <AnimatePresence>
                        {isAct && (
                          <motion.p 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="text-slate-400 text-sm leading-relaxed font-medium pl-6 pt-2 overflow-hidden"
                          >
                            {faqItem.answer}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search Engine Optimization sitemap / metadata blocks */}
          <div className="border-t border-white/5 pt-16 text-left max-w-4xl mx-auto space-y-12">
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-white tracking-tight uppercase tracking-wider">{t.seoHeroTitle}</h2>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">{t.seoHeroText}</p>
              <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {Array.isArray(t.seoHeroList) && t.seoHeroList.map((liText: string, i: number) => (
                  <li key={i} className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>{liText}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white tracking-tight">{t.seoBrowserSpeedTitle}</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">{t.seoBrowserSpeedText}</p>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white tracking-tight">{t.seoUseCaseTitle}</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">{t.seoUseCaseText}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white tracking-tight">{t.seoPrivacyTitle}</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">{t.seoPrivacyText}</p>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white tracking-tight">{t.seoSecondaryTitle}</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">{t.description}</p>
              </div>
            </div>

            {keywords.length > 0 && (
              <div className="border-t border-white/5 pt-8 space-y-3">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">{t.seoKeywordsTitle}</h4>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((kw: string, i: number) => (
                    <span 
                      key={i} 
                      className="text-[10px] font-bold bg-[#0a120e] text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-900/30 uppercase tracking-wider"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      {/* Bloque AdSense Horizontal */}
      <AdBanner id="adsense-qr-bolt-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={setActiveModal} />

      <LegalModal 
        isOpen={activeModal !== null} 
        onClose={() => setActiveModal(null)} 
        title={
          activeModal === 'privacy' ? t.privacyPolicy :
          activeModal === 'terms' ? t.termsOfService :
          t.cookiePolicy
        }
        content={
          activeModal === 'privacy' ? t.privacyContent :
          activeModal === 'terms' ? t.termsContent :
          t.cookiesContent
        }
        t={t}
      />

      {/* Floating Scroll to Top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-[200] w-12 h-12 bg-emerald-500 hover:bg-emerald-400 text-black rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all active:scale-95 cursor-pointer outline-none"
          >
            <ArrowUp className="w-5 h-5 stroke-[2.5]" />
          </motion.button>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Qrbolt;
