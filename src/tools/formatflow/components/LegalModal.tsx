import React, { useState } from 'react';
import { X, Mail } from 'lucide-react';
import { useTranslation, Language } from '../../../locales/dictionary';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
  language: Language;
}

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, title, content, language }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('adrian.contact.me.69@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const { dictionary } = useTranslation(language, 'formatflow');
  const t = dictionary.app;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-[#0a0a0a] border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-2xl font-display font-black text-white">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar text-slate-300 space-y-6 text-sm leading-relaxed">
          {content}
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/30">
          <p className="text-sm text-slate-400 mb-4">
            {t.contactFeedback || 'CONTACT FOR IDEAS AND FEEDBACK:'}
          </p>
          <button 
            onClick={handleCopyEmail}
            className="flex items-center gap-3 px-4 py-3 bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl transition-all group w-fit cursor-pointer"
          >
            <Mail className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
            <span className="font-mono text-sm text-slate-300 group-hover:text-white transition-colors">
              {copied ? (t.copiedEmail || 'Copied!') : 'adrian.contact.me.69@gmail.com'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default LegalModal;
