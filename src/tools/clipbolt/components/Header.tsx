import React, { useState, useRef, useEffect } from 'react';
import { Zap, Heart, ChevronDown, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LANGUAGES } from '../../../constants';

interface HeaderProps {
    onReset: () => void;
    currentLang: string;
    onLangChange: (code: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onReset, currentLang, onLangChange }) => {
  const [isLangOpen, setIsLangOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    
    // Always attach the listener to be safer, like in Layout.tsx
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const language = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  return (
    <header className="fixed top-0 left-0 w-full z-50 border-b border-white/5 shadow-2xl">
      <div className="absolute inset-0 bg-[#0d0d10]/98 backdrop-blur-3xl -z-10" />
      <div className="max-w-7xl mx-auto px-4 md:px-12 h-20 md:h-24 flex items-center justify-between gap-4">
        
        <div className="flex items-center gap-4 md:gap-8 overflow-hidden">
            {/* LOGO OLOVETOOLS */}
            <a href={`/${currentLang}`} className="flex items-center gap-3 md:gap-4 group shrink-0 px-4 py-2 hover:bg-white/5 rounded-2xl transition-all">
                <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-white transition-all -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 hidden sm:block" />
                <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_50px_rgba(79,70,229,0.3)] group-hover:scale-105 transition-all">
                    <Heart className="w-5 h-5 md:w-6 md:h-6 text-white fill-current" />
                </div>
                <div className="text-xl md:text-2xl font-black tracking-tighter text-white hidden lg:block opacity-40 group-hover:opacity-100 transition-opacity">
                   oLove<span className="text-pink-500">Tools</span>
                </div>
            </a>

            <div className="w-px h-8 bg-white/10 hidden md:block" />

            {/* LOGO CLIPBOLT */}
            <div className="flex items-center gap-3 md:gap-4 cursor-pointer group shrink-0" onClick={onReset}>
                <div className="w-9 h-9 md:w-11 md:h-11 bg-twitch rounded-2xl flex items-center justify-center shadow-[0_0_50px_rgba(145,70,255,0.3)] group-hover:scale-110 group-hover:rotate-3 transition-all">
                    <Zap className="w-5 h-5 md:w-6 md:h-6 text-white fill-current" />
                </div>
                <span className="text-lg md:text-xl font-black uppercase tracking-tight text-white inline-block skew-x-[-12deg] pr-2">ClipBolt</span>
            </div>
        </div>

        <div className="flex items-center gap-2 md:gap-6 shrink-0 h-full py-4">
           <div className="relative h-full flex items-center" ref={dropdownRef}>
             <button 
               onClick={(e) => {
                 e.stopPropagation();
                 setIsLangOpen(!isLangOpen);
               }}
               className="relative z-50 h-full px-4 md:px-6 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all cursor-pointer group"
             >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-[10px] md:text-xs font-black ring-1 ring-indigo-600/20 group-hover:ring-indigo-600/40 transition-all">
                    {currentLang.toUpperCase()}
                  </span>
                  <span className="hidden md:inline text-xs font-bold text-gray-400 group-hover:text-white transition-colors">{language.name}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-500 ${isLangOpen ? 'rotate-180' : ''}`} />
             </button>

             <AnimatePresence>
               {isLangOpen && (
                 <motion.div 
                   initial={{ opacity: 0, y: 15, scale: 0.95 }}
                   animate={{ opacity: 1, y: 10, scale: 1 }}
                   exit={{ opacity: 0, y: 15, scale: 0.95 }}
                   className="absolute top-[calc(100%+8px)] right-0 w-60 max-h-[75vh] overflow-y-auto custom-scrollbar bg-[#0d0d10] border border-white/10 rounded-[2rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] z-[100] py-3 overflow-hidden ring-1 ring-white/5"
                 >
                   <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                   {LANGUAGES.map((l) => (
                     <button
                       key={l.code}
                       onClick={() => {
                         onLangChange(l.code);
                         setIsLangOpen(false);
                       }}
                       className={`w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/5 transition-all border-b border-white/[0.03] last:border-0 cursor-pointer group ${currentLang === l.code ? 'bg-indigo-600/5 text-indigo-400' : 'text-gray-400 hover:text-white'}`}
                     >
                       <div className="flex items-center gap-4">
                         <span className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-black uppercase transition-all ${currentLang === l.code ? 'bg-indigo-600/20 text-indigo-400 ring-1 ring-indigo-600/30' : 'bg-white/5 text-gray-500 group-hover:bg-white/10'}`}>
                           {l.code}
                         </span>
                         <span className="text-sm font-bold tracking-tight">{l.name}</span>
                       </div>
                       {currentLang === l.code && <div className="w-2 h-2 bg-indigo-600 rounded-full shadow-[0_0_12px_rgba(79,70,229,0.8)]" />}
                     </button>
                   ))}
                 </motion.div>
               )}
             </AnimatePresence>
           </div>
        </div>
      </div>
    </header>
  );
};

export default Header;