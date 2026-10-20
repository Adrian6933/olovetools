// La línea de tiempo del editor: cada pieza es un bloque tan ancho como lo que
// dura en el vídeo final. Se elige pulsando, se reordena arrastrando (los
// demás bloques se apartan) y pulsar en la regla lleva a ese momento.
import React, { useLayoutEffect, useRef, useState } from 'react';
import { Film, ImageIcon, VolumeX, Gauge } from 'lucide-react';
import { durFinal, mmss, type Pieza } from './model';

interface Props {
  piezas: Pieza[];
  seleccionada: string | null;
  onSelect: (id: string) => void;
  onReorder: (next: Pieza[]) => void;
  /** Segundo del vídeo final por donde va la reproducción. */
  posicion: number;
  onSeek: (t: number) => void;
}

const PX_SEG = 14;
const ANCHO_MIN = 84;

const anchoDe = (p: Pieza) => Math.max(ANCHO_MIN, durFinal(p) * PX_SEG);

const mover = <T,>(arr: T[], de: number, a: number) => {
  const c = arr.slice();
  const [x] = c.splice(de, 1);
  c.splice(a, 0, x);
  return c;
};

const Timeline: React.FC<Props> = ({ piezas, seleccionada, onSelect, onReorder, posicion, onSeek }) => {
  const bloques = useRef(new Map<string, HTMLDivElement>());
  const antes = useRef(new Map<string, number>());
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const pulsado = useRef<{ id: string; x: number } | null>(null);
  const piezasRef = useRef(piezas);
  piezasRef.current = piezas;

  // Los bloques se deslizan a su sitio nuevo en vez de saltar.
  useLayoutEffect(() => {
    if (!antes.current.size) return;
    bloques.current.forEach((el, id) => {
      const prev = antes.current.get(id);
      if (prev === undefined || id === arrastrando) return;
      const dx = prev - el.getBoundingClientRect().left;
      if (!dx) return;
      el.style.transition = 'none';
      el.style.transform = `translateX(${dx}px)`;
      void el.offsetWidth;
      el.style.transition = 'transform 220ms cubic-bezier(.2,.8,.2,1)';
      el.style.transform = '';
    });
    antes.current.clear();
  }, [piezas, arrastrando]);

  const alMover = (e: React.PointerEvent) => {
    const p = pulsado.current;
    if (p && !arrastrando && Math.abs(e.clientX - p.x) > 6) {
      setArrastrando(p.id);
      return;
    }
    if (!arrastrando) return;
    const lista = piezasRef.current;
    const desde = lista.findIndex(x => x.id === arrastrando);
    let hasta = 0;
    for (const x of lista) {
      if (x.id === arrastrando) continue;
      const r = bloques.current.get(x.id)?.getBoundingClientRect();
      if (r && e.clientX > r.left + r.width / 2) hasta += 1;
    }
    if (desde >= 0 && hasta !== desde) {
      antes.current.clear();
      bloques.current.forEach((el, id) => antes.current.set(id, el.getBoundingClientRect().left));
      onReorder(mover(lista, desde, hasta));
    }
  };

  const soltar = () => {
    if (!arrastrando && pulsado.current) onSelect(pulsado.current.id);
    pulsado.current = null;
    setArrastrando(null);
  };

  // Regla y cursor: el cursor se coloca por posición acumulada de bloques.
  let acumulado = 0;
  let cursorX = 0;
  for (const p of piezas) {
    const d = durFinal(p);
    const w = anchoDe(p);
    if (posicion >= acumulado && posicion <= acumulado + d + 1e-6) {
      cursorX += d > 0 ? ((posicion - acumulado) / d) * w : 0;
      break;
    }
    acumulado += d;
    cursorX += w + 6;
  }

  const alPulsarRegla = (e: React.MouseEvent<HTMLDivElement>) => {
    const x = e.clientX - e.currentTarget.getBoundingClientRect().left;
    let izq = 0;
    let t = 0;
    for (const p of piezas) {
      const w = anchoDe(p);
      if (x <= izq + w) { t += (Math.max(0, x - izq) / w) * durFinal(p); break; }
      izq += w + 6;
      t += durFinal(p);
    }
    onSeek(t);
  };

  return (
    <div className="overflow-x-auto custom-scrollbar pb-2">
      <div className="relative inline-flex flex-col gap-2 min-w-full px-1">
        {/* Regla: pulsar lleva a ese momento del vídeo final */}
        <div className="relative h-5 cursor-pointer" onClick={alPulsarRegla}>
          <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
          <div className="absolute top-0 bottom-0 w-0.5 bg-white rounded-full pointer-events-none" style={{ left: cursorX }}>
            <span className="absolute -top-1 -left-[5px] w-3 h-3 rounded-full bg-white" />
          </div>
        </div>
        <div
          className="flex gap-1.5 select-none"
          onPointerMove={alMover}
          onPointerUp={soltar}
          onPointerCancel={soltar}
          onPointerLeave={() => { if (!arrastrando) pulsado.current = null; }}
        >
          {piezas.map((p, i) => {
            const sel = p.id === seleccionada;
            const drag = p.id === arrastrando;
            return (
              <div
                key={p.id}
                ref={el => { if (el) bloques.current.set(p.id, el); else bloques.current.delete(p.id); }}
                onPointerDown={e => {
                  if (e.button !== 0) return;
                  pulsado.current = { id: p.id, x: e.clientX };
                  try { (e.currentTarget.parentElement as HTMLElement).setPointerCapture(e.pointerId); } catch { /* puntero ya suelto */ }
                }}
                className={`relative h-16 shrink-0 rounded-xl overflow-hidden border-2 cursor-grab active:cursor-grabbing transition-[box-shadow,opacity] ${
                  sel ? 'border-twitch shadow-[0_0_0_3px_rgba(var(--color-accent-rgb),0.25)]' : 'border-white/10 hover:border-white/30'
                } ${drag ? 'opacity-80 z-10 shadow-2xl scale-[1.03]' : ''}`}
                style={{ width: anchoDe(p), backgroundImage: `url(${p.thumb})`, backgroundSize: 'auto 100%', backgroundRepeat: 'repeat-x' }}
                title={p.nombre}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40" />
                <span className="absolute top-1 left-1.5 text-[10px] font-black text-white/90 tabular-nums">{i + 1}</span>
                <span className="absolute top-1 right-1.5 flex gap-1 text-white/90">
                  {p.tipo === 'imagen' ? <ImageIcon className="w-3 h-3" /> : p.tipo === 'video' ? <Film className="w-3 h-3" /> : null}
                  {p.silencio && <VolumeX className="w-3 h-3 text-red-300" />}
                  {p.velocidad !== 1 && <span className="flex items-center gap-0.5 text-[9px] font-black"><Gauge className="w-3 h-3" />{p.velocidad}x</span>}
                </span>
                <span className="absolute bottom-1 left-1.5 right-1.5 flex items-end justify-between gap-1">
                  <span className="text-[10px] font-bold text-white truncate">{p.nombre}</span>
                  <span className="text-[9px] font-mono font-bold text-white/80 shrink-0">{mmss(durFinal(p))}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Timeline;
