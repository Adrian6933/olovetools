// ============================================================================
// Prueba de pantalla
// ----------------------------------------------------------------------------
// Pantalla completa con fondos planos para buscar píxeles muertos o atascados,
// y bandas para ver escalonado y sangrado de retroiluminación. Es una prueba
// clásica que la herramienta no tenía y que no cuesta nada.
// ============================================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface ScreenTestProps {
  onClose: () => void;
  t: any;
}

const SOLIDS = ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff'];

export const ScreenTest: React.FC<ScreenTestProps> = ({ onClose, t }) => {
  const [index, setIndex] = useState(0);
  const host = useRef<HTMLDivElement | null>(null);
  const total = SOLIDS.length + 2; // + degradado + rejilla

  const next = useCallback(() => setIndex(i => (i + 1) % total), [total]);
  const prev = useCallback(() => setIndex(i => (i - 1 + total) % total), [total]);

  const leave = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    onClose();
  }, [onClose]);

  useEffect(() => {
    const node = host.current;
    // Pantalla completa de verdad: con la barra del navegador delante no se
    // puede juzgar ni el negro ni el sangrado de los bordes.
    if (node && node.requestFullscreen) node.requestFullscreen().catch(() => {});
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') leave();
      else if (event.key === 'ArrowRight' || event.key === ' ') { event.preventDefault(); next(); }
      else if (event.key === 'ArrowLeft') { event.preventDefault(); prev(); }
    };
    window.addEventListener('keydown', onKey);
    // Salir con F11 o con el gesto del sistema también tiene que cerrar aquí.
    const onFsChange = () => { if (!document.fullscreenElement) onClose(); };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFsChange);
    };
  }, [leave, next, prev, onClose]);

  const isGradient = index === SOLIDS.length;
  const isGrid = index === SOLIDS.length + 1;
  const background = isGradient
    ? 'linear-gradient(90deg, #000 0%, #fff 100%)'
    : isGrid
      ? 'repeating-conic-gradient(#000 0% 25%, #fff 0% 50%) 0 0 / 4px 4px'
      : SOLIDS[index];

  const label = isGradient ? t.screenGradient : isGrid ? t.screenGrid : SOLIDS[index].toUpperCase();
  const light = !isGrid && !isGradient && ['#ffffff', '#ffff00', '#00ffff', '#00ff00'].indexOf(SOLIDS[index]) !== -1;

  return (
    <div
      ref={host}
      onClick={next}
      role="button"
      tabIndex={0}
      aria-label={t.screenNext}
      className="fixed inset-0 z-[999] cursor-pointer"
      style={{ background }}
    >
      <div className={`absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-bold ${light ? 'bg-black/70 text-white' : 'bg-white/15 text-white'}`}>
        <span className="font-mono">{index + 1}/{total} · {label}</span>
        <span className="opacity-70">{t.screenHint}</span>
        <button
          type="button"
          onClick={event => { event.stopPropagation(); leave(); }}
          aria-label={t.close}
          className="p-1 rounded-lg hover:bg-white/20 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ScreenTest;
