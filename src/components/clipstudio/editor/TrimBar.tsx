// La barra de recorte: el vídeo entero en fotogramas, dos tiradores para el
// tramo que se queda, lo descartado en sombra y una línea donde va el vídeo.
// Pulsar en la barra lleva el vídeo a ese punto.
import React, { useRef, useState } from 'react';
import { mmss } from './model';

interface Props {
  total: number;
  inicio: number;
  fin: number;
  /** Dónde va el vídeo, en segundos del original. */
  actual: number;
  frames: string[];
  onChange: (inicio: number, fin: number) => void;
  onSeek: (t: number) => void;
  etiquetaInicio: string;
  etiquetaFin: string;
}

const MIN = 0.3;

const TrimBar: React.FC<Props> = ({ total, inicio, fin, actual, frames, onChange, onSeek, etiquetaInicio, etiquetaFin }) => {
  const barra = useRef<HTMLDivElement>(null);
  const [cogido, setCogido] = useState<'inicio' | 'fin' | 'cursor' | null>(null);

  const tiempoEn = (clientX: number) => {
    const r = barra.current?.getBoundingClientRect();
    if (!r || total <= 0) return 0;
    return Math.max(0, Math.min(total, ((clientX - r.left) / r.width) * total));
  };

  const mover = (clientX: number, que: 'inicio' | 'fin' | 'cursor') => {
    const t = tiempoEn(clientX);
    if (que === 'inicio') {
      const nuevo = Math.min(t, fin - MIN);
      onChange(Math.max(0, nuevo), fin);
      onSeek(Math.max(0, nuevo));
    } else if (que === 'fin') {
      const nuevo = Math.max(t, inicio + MIN);
      onChange(inicio, Math.min(total, nuevo));
      onSeek(Math.max(inicio, Math.min(total, nuevo) - 0.05));
    } else {
      onSeek(t);
    }
  };

  const empezar = (e: React.PointerEvent, que: 'inicio' | 'fin' | 'cursor') => {
    e.preventDefault();
    e.stopPropagation();
    setCogido(que);
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* puntero ya suelto */ }
    mover(e.clientX, que);
  };

  const pct = (t: number) => `${total > 0 ? (t / total) * 100 : 0}%`;

  return (
    <div className="space-y-2 select-none">
      <div
        ref={barra}
        onPointerDown={e => empezar(e, 'cursor')}
        onPointerMove={e => { if (cogido) mover(e.clientX, cogido); }}
        onPointerUp={() => setCogido(null)}
        onPointerCancel={() => setCogido(null)}
        className="relative h-14 rounded-xl overflow-hidden bg-black border border-white/10 cursor-pointer touch-none"
      >
        {/* Fotogramas */}
        <div className="absolute inset-0 flex">
          {frames.length > 0
            ? frames.map((f, i) => <img key={i} src={f} alt="" draggable={false} className="h-full flex-1 min-w-0 object-cover" />)
            : <div className="flex-1 bg-white/5 animate-pulse" />}
        </div>
        {/* Lo que se descarta, en sombra */}
        <div className="absolute inset-y-0 left-0 bg-black/70" style={{ width: pct(inicio) }} />
        <div className="absolute inset-y-0 right-0 bg-black/70" style={{ width: `calc(100% - ${pct(fin)})` }} />
        {/* El tramo que se queda */}
        <div className="absolute inset-y-0 border-y-[3px] border-twitch pointer-events-none" style={{ left: pct(inicio), width: `calc(${pct(fin)} - ${pct(inicio)})` }} />
        {/* Tiradores */}
        {(['inicio', 'fin'] as const).map(lado => (
          <div
            key={lado}
            role="slider"
            aria-label={lado === 'inicio' ? etiquetaInicio : etiquetaFin}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={lado === 'inicio' ? inicio : fin}
            tabIndex={0}
            onKeyDown={e => {
              const paso = e.shiftKey ? 1 : 0.1;
              const d = e.key === 'ArrowLeft' ? -paso : e.key === 'ArrowRight' ? paso : 0;
              if (!d) return;
              e.preventDefault();
              if (lado === 'inicio') onChange(Math.max(0, Math.min(fin - MIN, inicio + d)), fin);
              else onChange(inicio, Math.min(total, Math.max(inicio + MIN, fin + d)));
            }}
            onPointerDown={e => empezar(e, lado)}
            onPointerMove={e => { if (cogido === lado) mover(e.clientX, lado); }}
            onPointerUp={() => setCogido(null)}
            className={`absolute inset-y-0 w-4 -ml-2 z-10 flex items-center justify-center cursor-ew-resize touch-none outline-none group`}
            style={{ left: pct(lado === 'inicio' ? inicio : fin) }}
          >
            <span className={`h-full w-3 rounded-md bg-twitch flex items-center justify-center shadow-lg group-focus-visible:ring-2 ring-white ${cogido === lado ? 'scale-x-125' : ''}`}>
              <span className="w-0.5 h-5 rounded-full bg-[var(--color-accent-ink)] opacity-70" />
            </span>
          </div>
        ))}
        {/* Dónde va el vídeo */}
        <div className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_6px_rgba(0,0,0,0.9)] pointer-events-none z-20" style={{ left: pct(actual) }} />
      </div>
      <div className="flex justify-between text-[11px] font-mono font-bold">
        <span className="text-twitch">{mmss(inicio, true)}</span>
        <span className="text-gray-500">{mmss(fin - inicio, true)}</span>
        <span className="text-twitch">{mmss(fin, true)}</span>
      </div>
    </div>
  );
};

export default TrimBar;
