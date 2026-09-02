import React, { useState } from 'react';
import { X, Shield, FileText, Info, Copy, Check } from 'lucide-react';

interface LegalModalProps {
  type: 'privacy' | 'terms' | 'cookies';
  onClose: () => void;
  onShowToast: (message: string) => void;
  t: (key: string) => string;
}

const LegalModal: React.FC<LegalModalProps> = ({ type, onClose, onShowToast, t }) => {
  const [isCopied, setIsCopied] = useState(false);
  const supportEmail = 'adrian.contact.me.69@gmail.com';

  const contentMap = {
    privacy: { title: 'privacy_policy', icon: Shield, text: 'legal_privacy_text' },
    terms: { title: 'terms_of_service', icon: FileText, text: 'legal_terms_text' },
    cookies: { title: 'cookie_policy', icon: Info, text: 'legal_cookies_text' }
  };

  const { title, icon: Icon, text } = contentMap[type];

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(supportEmail);
    setIsCopied(true);
    onShowToast(t('email_copied'));
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="bg-[#0c0c10] border border-white/20 ring-1 ring-twitch-base/20 rounded-3xl md:rounded-[3rem] p-6 md:p-12 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative animate-in zoom-in-95 duration-500 overflow-hidden">
        
        <button 
          onClick={onClose} 
          className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-5 mb-10">
            <div className="p-4 bg-twitch-base/10 rounded-3xl shadow-[0_0_20px_rgba(145,70,255,0.2)]">
                <Icon className="w-8 h-8 text-twitch-base drop-shadow-[0_0_8px_rgba(145,70,255,0.8)]" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter">
                {t(title)}
            </h2>
        </div>

        <div className="space-y-8 overflow-y-auto custom-scrollbar pr-2 flex-grow">
            <div 
              className="text-gray-300 text-base md:text-lg leading-relaxed font-medium" 
              dangerouslySetInnerHTML={{ __html: t(text) }} 
            />
            
            <div className="pt-6 border-t border-white/5">
                <p className="text-gray-500 text-sm mb-4 font-bold uppercase tracking-widest">{t('contact_us_at')}</p>
                <button 
                  onClick={handleCopyEmail}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-4 group p-1 transition-all w-full overflow-hidden cursor-pointer"
                >
                    <span className="text-twitch-base font-black text-xs sm:text-lg md:text-xl group-hover:text-white group-hover:underline underline-offset-8 transition-all break-all text-left">
                        {supportEmail}
                    </span>
                    <div className={`p-2 rounded-xl border transition-all flex-shrink-0 ${isCopied ? 'bg-green-500 border-green-500 text-white' : 'bg-white/5 border-white/10 text-twitch-base group-hover:bg-twitch-base group-hover:text-white'}`}>
                        {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </div>
                </button>
            </div>
        </div>
        
        <div className="mt-14 flex justify-end">
            <button 
                onClick={onClose}
                className="px-10 py-4 bg-twitch-base text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all hover:bg-twitch-dark hover:shadow-[0_0_30px_rgba(145,70,255,0.4)] active:scale-95 cursor-pointer"
            >
                {t('got_it')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default LegalModal;