import React, { useRef, useEffect } from 'react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
  t: any;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, title, content, t }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const copyEmail = () => {
    navigator.clipboard.writeText(t.emailAddress || 'adrian.contact.me.69@gmail.com');
    const button = document.getElementById('copy-email-modal-btn');
    if (button) {
      const originalText = button.innerText;
      button.innerText = t.emailCopied || 'Copied!';
      setTimeout(() => {
        button.innerText = originalText;
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div ref={modalRef} className="bg-[#080a02] border border-white/10 p-8 rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto animate-in zoom-in-95 duration-200 relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-white cursor-pointer border-none bg-transparent outline-none">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <h2 className="text-2xl font-black text-white mb-6">{title}</h2>
        <div className="text-gray-300 mb-8 space-y-4 whitespace-pre-line text-sm leading-relaxed">
          {content}
        </div>
        <div className="border-t border-white/10 pt-6">
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">{t.contactForIdeas || 'Contact for ideas and comments:'}</p>
          <button
            id="copy-email-modal-btn"
            onClick={copyEmail}
            className="flex items-center space-x-3 text-lime-400 hover:opacity-80 border-none bg-transparent outline-none transition-colors font-mono cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" /></svg>
            <span>{t.emailAddress || 'adrian.contact.me.69@gmail.com'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
