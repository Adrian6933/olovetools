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
    <header className="fixed top-0 left-0 w-full z-50 border-b border-white/5 shadow-2xl overflow-visible">
      <div className="absolute inset-0 bg-[#0d0d10]/98 backdrop-blur-3xl -z-10" />
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-5 md:h-28 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 transition-all duration-300">
        
        <div className="flex items-center gap-5 md:gap-8 justify-center w-full md:w-auto">
            {/* LOGO OLOVETOOLS */}
            <a href={`/${currentLang}`} className="flex items-center gap-3 group shrink-0 transition-all active:scale-95 active:opacity-80">
                <div className="w-11 h-11 md:w-12 md:h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.25)] group-hover:scale-105 transition-all duration-300">
                    <Heart className="w-5 h-5 md:w-6 md:h-6 text-white fill-current" />
                </div>
                <div className="hidden sm:block text-xl md:text-2xl font-black tracking-tighter text-white opacity-50 group-hover:opacity-100 transition-opacity">
                   oLove<span className="text-pink-500">Tools</span>
                </div>
            </a>

            <div className="w-px h-6 bg-white/10 hidden md:block" />

            {/* LOGO CLIPBOLT */}
            <div className="flex items-center gap-3 cursor-pointer group shrink-0 transition-all active:scale-95 active:opacity-80" onClick={onReset}>
                <div className="w-11 h-11 md:w-12 md:h-12 bg-twitch rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(145,70,255,0.25)] group-hover:scale-105 transition-all duration-300">
                    <Zap className="w-5 h-5 md:w-6 md:h-6 text-white fill-current" />
                </div>
                <span className="text-xl md:text-2xl font-black uppercase tracking-tighter text-white">ClipBolt</span>
            </div>
        </div>

        {/* SELECTOR DE IDIOMA - DISEÑO MEJORADO */}
        <div className="flex items-center shrink-0 w-full md:w-auto justify-center">
           <div className="relative" ref={dropdownRef}>
             <button 
               onClick={(e) => {
                 e.stopPropagation();
                 setIsLangOpen(!isLangOpen);
               }}
               className={`
                 group h-12 md:h-14 px-2 pl-4 pr-6 bg-[#16161b] border border-white/10 rounded-full 
                 flex items-center gap-4 transition-all duration-300 cursor-pointer 
                 ${isLangOpen ? 'border-twitch ring-4 ring-twitch/10' : 'hover:border-white/20 hover:bg-[#1c1c24]'}
               `}
             >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[11px] font-black text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                  {currentLang.toUpperCase()}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-gray-400 group-hover:text-white transition-colors uppercase tracking-widest leading-none">
                    {language.name}
                  </span>
                  <div className={`w-px h-4 bg-white/10 group-hover:bg-white/20 transition-colors ${isLangOpen ? 'bg-white/20' : ''}`} />
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-500 ${isLangOpen ? 'rotate-180 text-white' : 'group-hover:text-gray-300'}`} />
                </div>
             </button>

             <AnimatePresence>
               {isLangOpen && (
                 <motion.div 
                   initial={{ opacity: 0, y: 15, scale: 0.95 }}
                   animate={{ opacity: 1, y: 12, scale: 1 }}
                   exit={{ opacity: 0, y: 15, scale: 0.95 }}
                   className="absolute top-[calc(100%+12px)] left-1/2 -translate-x-1/2 md:left-auto md:right-0 md:translate-x-0 w-64 bg-[#0d0d10] border border-white/10 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.9)] z-[100] p-2 ring-1 ring-white/5"
                 >
                   <div className="px-5 py-4 border-b border-white/5 mb-2 text-center">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Seleccionar Idioma</span>
                   </div>
                   <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                     {LANGUAGES.map((l) => (
                       <button
                         key={l.code}
                         onClick={() => {
                           onLangChange(l.code);
                           setIsLangOpen(false);
                         }}
                         className={`
                           w-full flex items-center justify-between px-4 py-3 rounded-2xl mb-1
                           transition-all hover:bg-white/5 cursor-pointer group/item
                           ${currentLang === l.code ? 'bg-twitch/10' : ''}
                         `}
                       >
                         <div className="flex items-center gap-4">
                           <span className={`
                             w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-black uppercase transition-all 
                             ${currentLang === l.code ? 'bg-twitch text-white shadow-lg shadow-twitch/20' : 'bg-white/5 text-gray-500 group-hover/item:bg-white/10 group-hover/item:text-gray-300'}
                           `}>
                             {l.code}
                           </span>
                           <span className={`text-sm font-bold tracking-tight ${currentLang === l.code ? 'text-white' : 'text-gray-400 group-hover/item:text-white'}`}>
                             {l.name}
                           </span>
                         </div>
                         {currentLang === l.code && <div className="w-2 h-2 bg-twitch rounded-full font-bold text-xs" />}
                       </button>
                     ))}
                   </div>
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