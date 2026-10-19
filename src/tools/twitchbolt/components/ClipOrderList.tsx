// ============================================================================
// Orden de los clips
// ----------------------------------------------------------------------------
// Una lista compacta para ordenar arrastrando: el orden de aquí es el de los
// nombres del ZIP (1_, 2_...) y el del vídeo unido. Las tarjetas grandes de
// cada clip son demasiado altas para arrastrarlas, por eso va aparte.
//
// El arrastre es a mano con eventos de puntero y no con el drag-and-drop de
// HTML5, que en el móvil no existe. Con ratón se arrastra la fila entera; en
// pantalla táctil se arrastra desde el asa (o tras mantener pulsada la fila),
// porque si no el dedo no podría hacer scroll por la lista.
// ============================================================================
import React, { useRef, useState } from 'react';
import { GripVertical, ChevronUp, ChevronDown, ArrowDownUp, Clock, Eye, CalendarDays, Copy, Check } from 'lucide-react';
import type { ClipItem } from '../types';

interface Props {
  clips: ClipItem[];
  onReorder: (next: ClipItem[]) => void;
  t: any;
  lang: string;
}

const mmss = (seg: number) => {
  const s = Math.max(0, Math.round(seg));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${r}` : `${m}:${r}`;
};

const mover = <T,>(arr: T[], de: number, a: number): T[] => {
  const copia = arr.slice();
  const [x] = copia.splice(de, 1);
  copia.splice(a, 0, x);
  return copia;
};

const ClipOrderList: React.FC<Props> = ({ clips, onReorder, t, lang }) => {
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const filas = useRef(new Map<string, HTMLLIElement>());
  const pulsacion = useRef<{ id: string; x: number; y: number; timer?: ReturnType<typeof setTimeout>; tactil: boolean } | null>(null);
  const clipsRef = useRef(clips);
  clipsRef.current = clips;

  const total = clips.reduce((s, c) => s + (c.data?.duration || 0), 0);

  const empezar = (id: string, el: HTMLElement, pointerId: number) => {
    setArrastrando(id);
    try { el.setPointerCapture(pointerId); } catch { /* */ }
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const alPulsar = (e: React.PointerEvent<HTMLLIElement>, id: string, desdeAsa: boolean) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button') && !desdeAsa) return;
    const tactil = e.pointerType !== 'mouse';
    const el = e.currentTarget;
    const pid = e.pointerId;
    if (desdeAsa) { empezar(id, el, pid); return; }
    pulsacion.current = { id, x: e.clientX, y: e.clientY, tactil };
    if (tactil) {
      // Mantener pulsado medio segundo: así un toque o un scroll normal no
      // mueven nada por accidente.
      pulsacion.current.timer = setTimeout(() => {
        if (pulsacion.current?.id === id) empezar(id, el, pid);
      }, 450);
    }
  };

  const alMover = (e: React.PointerEvent<HTMLLIElement>) => {
    const p = pulsacion.current;
    if (!arrastrando && p) {
      const lejos = Math.hypot(e.clientX - p.x, e.clientY - p.y) > 6;
      if (lejos && !p.tactil) empezar(p.id, e.currentTarget, e.pointerId);
      else if (lejos && p.tactil) { clearTimeout(p.timer); pulsacion.current = null; }
      return;
    }
    if (!arrastrando) return;
    e.preventDefault();
    const lista = clipsRef.current;
    const desde = lista.findIndex(c => c.id === arrastrando);
    // El hueco nuevo es cuántas otras filas tienen el centro por encima del dedo.
    let hasta = 0;
    for (const c of lista) {
      if (c.id === arrastrando) continue;
      const r = filas.current.get(c.id)?.getBoundingClientRect();
      if (r && e.clientY > r.top + r.height / 2) hasta += 1;
    }
    if (hasta !== desde) onReorder(mover(lista, desde, hasta));
    // Cerca de los bordes de la ventana, la página se desplaza sola.
    if (e.clientY < 140) window.scrollBy(0, -12);
    else if (e.clientY > window.innerHeight - 70) window.scrollBy(0, 12);
  };

  const alSoltar = (e: React.PointerEvent<HTMLLIElement>) => {
    if (pulsacion.current) { clearTimeout(pulsacion.current.timer); pulsacion.current = null; }
    if (!arrastrando) return;
    setArrastrando(null);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* */ }
  };

  const ordenarPor = (clave: 'views' | 'date' | 'duration' | 'reverse') => {
    if (clave === 'reverse') { onReorder(clips.slice().reverse()); return; }
    const valor = (c: ClipItem) => {
      const d = c.data;
      if (!d) return -Infinity;
      if (clave === 'views') return d.views;
      if (clave === 'duration') return d.duration;
      const ms = Date.parse(d.createdAt || '');
      return isNaN(ms) ? 0 : ms;
    };
    onReorder(clips.slice().sort((a, b) => valor(b) - valor(a)));
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(clips.map(c => c.url).join('\n'));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch { /* sin permiso de portapapeles */ }
  };

  const botonOrden = 'h-8 px-2.5 rounded-lg border border-white/10 text-[11px] font-bold text-gray-300 hover:text-white hover:border-white/25 flex items-center gap-1.5 cursor-pointer transition-colors';

  return (
    <div className="w-full bg-[#111114] border border-white/5 rounded-[2rem] p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-white">{t.orderTitle || 'Clip order'}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {t.orderHint || 'Drag to reorder. ZIP names and the merged video follow this order.'}
            {total > 0 && <span className="text-gray-400 font-bold"> · {mmss(total)}</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => ordenarPor('views')} className={botonOrden}><Eye className="w-3.5 h-3.5" />{t.sortViews || 'Most viewed'}</button>
          <button type="button" onClick={() => ordenarPor('date')} className={botonOrden}><CalendarDays className="w-3.5 h-3.5" />{t.sortDate || 'Newest'}</button>
          <button type="button" onClick={() => ordenarPor('duration')} className={botonOrden}><Clock className="w-3.5 h-3.5" />{t.sortDuration || 'Longest'}</button>
          <button type="button" onClick={() => ordenarPor('reverse')} className={botonOrden}><ArrowDownUp className="w-3.5 h-3.5" />{t.sortReverse || 'Reverse'}</button>
          <button type="button" onClick={copiar} className={botonOrden}>
            {copiado ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiado ? (t.copied || 'Copied') : (t.copyLinks || 'Copy links')}
          </button>
        </div>
      </div>

      <ol className="space-y-2">
        {clips.map((c, i) => {
          const d = c.data;
          const activo = arrastrando === c.id;
          return (
            <li
              key={c.id}
              ref={el => { if (el) filas.current.set(c.id, el); else filas.current.delete(c.id); }}
              onPointerDown={e => alPulsar(e, c.id, false)}
              onPointerMove={alMover}
              onPointerUp={alSoltar}
              onPointerCancel={alSoltar}
              onContextMenu={e => { if (pulsacion.current?.tactil || arrastrando) e.preventDefault(); }}
              className={`flex items-center gap-3 p-2 pr-3 rounded-2xl border select-none transition-[background,box-shadow,transform] duration-150 ${
                activo
                  ? 'bg-twitch/15 border-twitch shadow-2xl shadow-twitch/20 scale-[1.02] relative z-10 cursor-grabbing'
                  : 'bg-white/[0.03] border-white/5 hover:border-white/15 md:cursor-grab'
              }`}
            >
              <span
                onPointerDown={e => { e.stopPropagation(); alPulsar(e as unknown as React.PointerEvent<HTMLLIElement>, c.id, true); }}
                className="touch-none p-1.5 -m-1 rounded-lg text-gray-500 hover:text-white cursor-grab active:cursor-grabbing"
                aria-hidden="true"
              >
                <GripVertical className="w-4 h-4" />
              </span>
              <span className="w-6 text-center text-xs font-black text-twitch tabular-nums shrink-0">{i + 1}</span>
              <span className="relative w-20 sm:w-24 aspect-video rounded-lg overflow-hidden bg-black shrink-0">
                {d?.thumbnail && <img src={d.thumbnail} alt="" loading="lazy" draggable={false} className="w-full h-full object-cover" />}
                {d && (
                  <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/80 text-[9px] font-bold text-white tabular-nums">{mmss(d.duration)}</span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-white truncate">{d?.title || c.url}</span>
                <span className="block text-[11px] text-gray-500 truncate">
                  {c.status === 'loading' ? (t.loadingClips || 'Loading…') : c.status === 'error' ? (t.failedToLoad || 'Failed') : `${d?.broadcaster} · ${d?.views.toLocaleString(lang)} ${t.views || 'views'}`}
                </span>
              </span>
              {/* Flechas: para teclado y para quien no quiera arrastrar. */}
              <span className="flex flex-col shrink-0">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => onReorder(mover(clips, i, i - 1))}
                  aria-label={t.moveUp || 'Move up'}
                  className="p-1 rounded text-gray-500 hover:text-white disabled:opacity-20 disabled:cursor-default cursor-pointer"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={i === clips.length - 1}
                  onClick={() => onReorder(mover(clips, i, i + 1))}
                  aria-label={t.moveDown || 'Move down'}
                  className="p-1 rounded text-gray-500 hover:text-white disabled:opacity-20 disabled:cursor-default cursor-pointer"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default ClipOrderList;
