import React from 'react';
import { X } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  t: any;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, title, content, t }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
        onClick={onClose}
      />
      <div className="relative glass-card w-full max-w-3xl max-h-[85vh] rounded-3xl overflow-hidden flex flex-col z-10 border border-white/10 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors rounded-xl text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 md:p-8 overflow-y-auto text-slate-300 text-sm leading-relaxed space-y-4">
          <div 
            className="prose prose-invert max-w-none prose-p:my-2 prose-h3:text-white prose-h3:font-bold prose-h3:mt-4"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
        <div className="p-6 md:p-8 border-t border-white/5 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all cursor-pointer"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
