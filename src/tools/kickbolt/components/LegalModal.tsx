import React, { useState } from 'react';
import { ShieldCheck, FileText, Info, X, Copy, Check } from 'lucide-react';
import { useTranslation, Language } from '../../../locales/dictionary';

interface LegalModalProps {
  type: 'privacy' | 'terms' | 'cookies' | null;
  lang: string;
  onClose: () => void;
}

const LegalModal: React.FC<LegalModalProps> = ({ type, lang, onClose }) => {
  const [copied, setCopied] = useState(false);
  if (!type) return null;

  const { dictionary } = useTranslation(lang as Language, 'kickbolt');
  const t = dictionary;
  const tl = t.legal || {};
  
  const contentMap = {
    privacy: { icon: <ShieldCheck className="w-8 h-8 text-kick" />, title: tl.privacy, text: tl.privacyText },
    terms: { icon: <FileText className="w-8 h-8 text-kick" />, title: tl.terms, text: tl.termsText },
    cookies: { icon: <Info className="w-8 h-8 text-kick" />, title: tl.cookies, text: tl.cookiesText },
  };

  const { icon, title, text } = contentMap[type as keyof typeof contentMap];

  const handleCopy = () => {
    navigator.clipboard.writeText("adrian.contact.me.69@gmail.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-[#0e0e10]/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-[0_0_50px_rgba(83,252,24,0.15)] animate-slide-up overflow-hidden max-h-[90vh] flex flex-col">
        {/* Glow corner */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-kick/20 blur-[80px] rounded-full pointer-events-none" />
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors z-50 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col items-center text-center space-y-6 mb-4">
          <div className="p-5 bg-kick/10 rounded-3xl border border-kick/20 shrink-0">
            {icon}
          </div>
          
          <h2 className="text-2xl font-black text-white uppercase tracking-tight shrink-0">{title}</h2>
          
          <div className="space-y-4 text-gray-400 text-sm leading-relaxed font-medium">
            <p>{text}</p>
          </div>
        </div>
        
        {/* Fixed Footer Area - Separated from scroll to avoid hover glitches */}
        <div className="shrink-0 w-full pt-8 border-t border-white/5 flex flex-col items-center space-y-6 bg-transparent">
          <div className="relative inline-block mx-auto group/copy">
              <button 
                onClick={handleCopy}
                className="flex items-center gap-3 px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 cursor-pointer"
              >
                <div className="text-left">
                  <p className="text-[9px] font-black text-kick uppercase tracking-widest">
                    {tl.contactEmail}
                  </p>
                  <p className="text-[11px] font-black text-white tracking-tight">
                    adrian.contact.me.69@gmail.com
                  </p>
                </div>
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-600 group-hover:text-kick transition-colors" />}
              </button>
              
              {copied && (
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 text-[9px] bg-kick text-white px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap animate-fade-in font-black">
                    {t.copied}
                  </span>
              )}
          </div>
          
          <button 
            onClick={onClose}
            className="w-full py-4 bg-kick hover:bg-kick-dark text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-kick/20 cursor-pointer"
          >
            {tl.gotIt}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalModal;