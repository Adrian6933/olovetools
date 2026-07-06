import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToolTheme } from '../../lib/themes';
import { useReducedMotion } from './motion';

interface ScrollToTopProps {
  theme: ToolTheme;
  threshold?: number;
}

export const ScrollToTop: React.FC<ScrollToTopProps> = ({ theme, threshold = 400 }) => {
  const [visible, setVisible] = useState(false);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  const scrollUp = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: prefersReduced ? 1 : 0.8, y: prefersReduced ? 0 : 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: prefersReduced ? 1 : 0.8, y: prefersReduced ? 0 : 12 }}
          transition={{ duration: prefersReduced ? 0.1 : 0.2 }}
          onClick={scrollUp}
          className="fixed bottom-6 right-6 z-30 w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl transition-all hover:scale-110 hover:-translate-y-1 active:scale-90 group"
          style={{ backgroundColor: theme.primaryHex, color: '#fff' }}
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5 transition-transform group-hover:scale-110" strokeWidth={3} />
        </motion.button>
      )}
    </AnimatePresence>
  );
};
