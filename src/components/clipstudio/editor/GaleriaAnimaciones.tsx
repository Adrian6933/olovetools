// ============================================================================
// Galería de animaciones (suscríbete, me gusta, campana, pantalla final...)
// ----------------------------------------------------------------------------
// Cada tarjeta enseña la plantilla moviéndose en bucle, sobre un fondo que
// hace de vídeo, ya en el idioma elegido arriba. Pulsar una la añade en el
// cursor de la línea de tiempo.
// ============================================================================
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Languages } from 'lucide-react';
import { IDIOMAS_ANIM, PLANTILLAS, dibujarCapa, type Capa, type IdiomaAnim, type PlantillaId } from './animaciones';

interface Props {
  idioma: IdiomaAnim;
  onIdioma: (i: IdiomaAnim) => void;
  canal: string;
  nombre: (id: PlantillaId) => string;
  onElegir: (id: PlantillaId) => void;
  onCerrar: () => void;
  tx: (k: string, fb: string) => string;
  estilo?: React.CSSProperties;
}

/** Una tarjeta: la plantilla en bucle sobre un fondo que hace de vídeo. */
const Muestra: React.FC<{ id: PlantillaId; idioma: IdiomaAnim; canal: string }> = ({ id, idioma, canal }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const W = 480;
    const H = 270;
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext('2d')!;
    const pl = PLANTILLAS.find(p => p.id === id)!;
    const capa: Capa = { id, plantilla: id, idioma, inicio: 0, dur: pl.dur, x: pl.x, y: pl.y, escala: 1, canal };
    const t0 = performance.now();
    // setInterval y no rAF: con la pestaña de fondo rAF se para del todo.
    const pinta = () => {
      const t = ((performance.now() - t0) / 1000) % (pl.dur + 0.6);
      const fondo = ctx.createLinearGradient(0, 0, W, H);
      fondo.addColorStop(0, '#2b2540');
      fondo.addColorStop(1, '#14121c');
      ctx.fillStyle = fondo;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      for (let i = 0; i < 6; i += 1) ctx.fillRect(0, (i * H) / 6, W, 1);
      dibujarCapa(ctx, capa, t, W, H);
    };
    pinta();
    const reloj = setInterval(pinta, 33);
    return () => clearInterval(reloj);
  }, [id, idioma, canal]);
  return <canvas ref={ref} className="w-full aspect-video rounded-xl bg-black" />;
};

const GaleriaAnimaciones: React.FC<Props> = ({ idioma, onIdioma, canal, nombre, onElegir, onCerrar, tx, estilo }) => {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onCerrar(); } };
    window.addEventListener('keydown', esc, true);
    return () => window.removeEventListener('keydown', esc, true);
  }, [onCerrar]);

  return createPortal(
    <div className="fixed inset-0 z-[100001] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 md:p-8" style={estilo} onPointerDown={onCerrar}>
      <div className="w-full max-w-5xl max-h-full flex flex-col rounded-3xl border border-white/10 bg-[#131218] shadow-2xl overflow-hidden" onPointerDown={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={tx('ed_anims_title', 'Ready-made animations')}>
        <div className="shrink-0 flex items-start justify-between gap-3 px-5 pt-5 pb-3">
          <div className="min-w-0">
            <h3 className="text-base font-black text-white">{tx('ed_anims_title', 'Ready-made animations')}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{tx('ed_anims_hint', 'Click one to add it at the playhead. It goes on top of the video, and you can move it, stretch it and change its language.')}</p>
          </div>
          <button type="button" onClick={onCerrar} aria-label={tx('wm_close', 'Close')} className="w-9 h-9 shrink-0 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.06] flex items-center justify-center cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <div className="shrink-0 flex items-center gap-2 px-5 pb-3 overflow-x-auto custom-scrollbar">
          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-500 shrink-0"><Languages className="w-3.5 h-3.5 text-twitch" />{tx('ed_anim_lang', 'Text language')}</span>
          {IDIOMAS_ANIM.map(i => (
            <button
              key={i.id}
              type="button"
              onClick={() => onIdioma(i.id)}
              aria-pressed={idioma === i.id}
              className={`shrink-0 h-8 px-3 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${idioma === i.id ? 'bg-twitch text-[var(--color-accent-ink)]' : 'bg-white/[0.04] text-gray-400 hover:text-white'}`}
            >
              {i.nombre}
            </button>
          ))}
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PLANTILLAS.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => onElegir(p.id)}
              className="group text-left rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:border-twitch/60 hover:bg-twitch/[0.06] p-2 space-y-2 cursor-pointer transition-colors"
            >
              <Muestra id={p.id} idioma={idioma} canal={canal} />
              <span className="flex items-center justify-between gap-2 px-1">
                <span className="text-xs font-bold text-white truncate">{nombre(p.id)}</span>
                <span className="text-[10px] font-mono font-bold text-gray-500 shrink-0">{p.dur}s</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default GaleriaAnimaciones;
