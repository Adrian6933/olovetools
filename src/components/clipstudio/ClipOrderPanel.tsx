// ============================================================================
// Panel de orden de los clips
// ----------------------------------------------------------------------------
// En escritorio es una columna pegajosa al lado de las tarjetas: siempre a la
// vista, para reordenar sin tener que bajar hasta el clip. En móvil, un botón
// flotante abre el mismo panel desde abajo.
//
// Cada fila: arrastrar (desde el asa, o con el ratón desde cualquier parte),
// flechas para subir y bajar, y tocarla lleva a su tarjeta. La fila del clip
// que estás viendo se marca sola.
// ============================================================================
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GripVertical, ChevronUp, ChevronDown, ListOrdered, X, Clock } from 'lucide-react';
import type { ClipItem } from './types';
import { useBrand } from './brand';

interface Props {
  clips: ClipItem[];
  onReorder: (next: ClipItem[]) => void;
  /** Lleva la página a la tarjeta de ese clip. */
  onGo: (id: string) => void;
  t: any;
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

/** La lista en sí; se usa igual en la columna y en el panel de móvil. */
const Lista: React.FC<Props & { visible: string | null; onElegido?: () => void }> = ({ clips, onReorder, onGo, t, visible, onElegido }) => {
  const filas = useRef(new Map<string, HTMLLIElement>());
  const antes = useRef(new Map<string, number>());
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const pulsado = useRef<{ id: string; x: number; y: number } | null>(null);
  const clipsRef = useRef(clips);
  clipsRef.current = clips;

  const reordenar = (next: ClipItem[]) => {
    antes.current.clear();
    filas.current.forEach((el, id) => antes.current.set(id, el.getBoundingClientRect().top));
    onReorder(next);
  };

  // Las filas se deslizan a su sitio nuevo en vez de saltar.
  useLayoutEffect(() => {
    if (!antes.current.size) return;
    filas.current.forEach((el, id) => {
      const previo = antes.current.get(id);
      if (previo === undefined || id === arrastrando) return;
      const dy = previo - el.getBoundingClientRect().top;
      if (!dy) return;
      el.style.transition = 'none';
      el.style.transform = `translateY(${dy}px)`;
      void el.offsetHeight;
      el.style.transition = 'transform 240ms cubic-bezier(.2,.8,.2,1)';
      el.style.transform = '';
    });
    antes.current.clear();
  }, [clips, arrastrando]);

  useEffect(() => {
    if (!arrastrando) return;
    const alMover = (e: PointerEvent) => {
      const lista = clipsRef.current;
      const desde = lista.findIndex(c => c.id === arrastrando);
      let hasta = 0;
      for (const c of lista) {
        if (c.id === arrastrando) continue;
        const r = filas.current.get(c.id)?.getBoundingClientRect();
        if (r && e.clientY > r.top + r.height / 2) hasta += 1;
      }
      if (desde >= 0 && hasta !== desde) reordenar(mover(lista, desde, hasta));
    };
    const fin = () => { setArrastrando(null); document.body.style.userSelect = ''; };
    const sinScroll = (e: TouchEvent) => e.preventDefault();
    window.addEventListener('pointermove', alMover);
    window.addEventListener('pointerup', fin);
    window.addEventListener('pointercancel', fin);
    window.addEventListener('touchmove', sinScroll, { passive: false });
    return () => {
      window.removeEventListener('pointermove', alMover);
      window.removeEventListener('pointerup', fin);
      window.removeEventListener('pointercancel', fin);
      window.removeEventListener('touchmove', sinScroll);
    };
  }, [arrastrando]); // eslint-disable-line react-hooks/exhaustive-deps

  const empezar = (id: string) => {
    document.body.style.userSelect = 'none';
    setArrastrando(id);
  };

  return (
    <ol className="space-y-1.5">
      {clips.map((c, i) => {
        const d = c.data;
        const activo = arrastrando === c.id;
        const enVista = visible === c.id;
        return (
          <li
            key={c.id}
            ref={el => { if (el) filas.current.set(c.id, el); else filas.current.delete(c.id); }}
            onPointerDown={e => {
              if (e.pointerType !== 'mouse' || e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
              pulsado.current = { id: c.id, x: e.clientX, y: e.clientY };
            }}
            onPointerMove={e => {
              const p = pulsado.current;
              if (p && !arrastrando && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 5) { pulsado.current = null; empezar(p.id); }
            }}
            onPointerUp={() => {
              // Un clic sin arrastrar: ir a la tarjeta.
              if (pulsado.current?.id === c.id) { onGo(c.id); onElegido?.(); }
              pulsado.current = null;
            }}
            className={`group relative flex items-center gap-2 p-1.5 pr-1 rounded-xl border select-none transition-[background,box-shadow,border-color] ${
              activo
                ? 'bg-twitch/20 border-twitch shadow-lg shadow-twitch/20 z-10 cursor-grabbing'
                : enVista
                  ? 'bg-white/[0.06] border-twitch/40 cursor-pointer'
                  : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/15 cursor-pointer'
            }`}
          >
            <span
              onPointerDown={e => { e.stopPropagation(); e.preventDefault(); empezar(c.id); }}
              className="touch-none p-1 -my-1 rounded-md text-gray-600 group-hover:text-gray-300 cursor-grab active:cursor-grabbing"
              aria-hidden="true"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </span>
            <span className={`w-4 text-center text-[11px] font-black tabular-nums shrink-0 ${enVista || activo ? 'text-twitch' : 'text-gray-500'}`}>{i + 1}</span>
            <span className="relative w-14 aspect-video rounded-md overflow-hidden bg-black shrink-0">
              {d?.thumbnail && <img src={d.thumbnail} alt="" loading="lazy" draggable={false} className="w-full h-full object-cover" />}
              {c.status === 'loading' && <span className="absolute inset-0 bg-white/5 animate-pulse" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-bold text-white leading-tight line-clamp-2">
                {d?.title || (c.status === 'error' ? (t.failedToLoad || 'Failed') : '…')}
              </span>
              {d && <span className="block text-[10px] text-gray-500 truncate">{d.broadcaster} · {mmss(d.duration)}</span>}
            </span>
            <span className="flex flex-col shrink-0">
              <button
                type="button"
                disabled={i === 0}
                onClick={() => reordenar(mover(clips, i, i - 1))}
                aria-label={t.moveUp || 'Move up'}
                className="p-0.5 rounded text-gray-500 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={i === clips.length - 1}
                onClick={() => reordenar(mover(clips, i, i + 1))}
                aria-label={t.moveDown || 'Move down'}
                className="p-0.5 rounded text-gray-500 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </span>
          </li>
        );
      })}
    </ol>
  );
};

const ClipOrderPanel: React.FC<Props> = (props) => {
  const { clips, t } = props;
  const brand = useBrand();
  const [visible, setVisible] = useState<string | null>(null);
  const [hoja, setHoja] = useState(false);
  const total = clips.reduce((s, c) => s + (c.data?.duration || 0), 0);
  const columnaRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // "Sticky" a mano. position: sticky no funciona aquí: el CSS global pone
  // overflow en html y body, y con eso el body pasa a ser el contenedor de
  // scroll aunque nunca se desplace, así que el panel nunca se pegaba. Se
  // desplaza con transform dentro de su columna, sin salirse de ella.
  useEffect(() => {
    const ARRIBA = 112;
    let raf = 0;
    const colocar = () => {
      raf = 0;
      const col = columnaRef.current;
      const panel = panelRef.current;
      if (!col || !panel || col.offsetParent === null) return;
      const r = col.getBoundingClientRect();
      const y = Math.max(0, Math.min(ARRIBA - r.top, r.height - panel.offsetHeight));
      panel.style.transform = `translateY(${y}px)`;
    };
    // Directo en el evento y no con requestAnimationFrame: con la pestaña sin
    // pintar rAF no llega, y el scroll ya viene a ritmo de fotograma.
    const pedir = () => colocar();
    colocar();
    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', pedir);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(pedir) : null;
    if (ro && columnaRef.current) ro.observe(columnaRef.current);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', pedir);
      window.removeEventListener('resize', pedir);
      ro?.disconnect();
    };
  }, []);

  // Qué tarjeta está en el centro de la pantalla.
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-clip-id]'));
    if (!els.length || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(entries => {
      const dentro = entries.filter(e => e.isIntersecting);
      if (dentro.length) setVisible((dentro[0].target as HTMLElement).dataset.clipId || null);
    }, { rootMargin: '-45% 0px -50% 0px' });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [clips]);

  const cabecera = (
    <div className="flex items-center justify-between gap-2 mb-3">
      <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white">
        <ListOrdered className="w-4 h-4 text-twitch" />
        {t.orderPanel || 'Order'}
        <span className="text-gray-500">{clips.length}</span>
      </h3>
      {total > 0 && (
        <span className="flex items-center gap-1 text-[11px] font-bold text-gray-400 tabular-nums">
          <Clock className="w-3 h-3" />{mmss(total)}
        </span>
      )}
    </div>
  );

  return (
    <>
      {/* Escritorio: columna que acompaña al hacer scroll. */}
      <aside ref={columnaRef} className="hidden lg:block self-stretch relative">
        <div ref={panelRef} className="rounded-[1.5rem] border border-white/5 bg-[#111114]/90 backdrop-blur-xl p-3 shadow-2xl max-h-[calc(100vh-8rem)] flex flex-col will-change-transform">
          {cabecera}
          <div className="overflow-y-auto custom-scrollbar -mr-1 pr-1 min-h-0">
            <Lista {...props} visible={visible} />
          </div>
          <p className="mt-3 text-[10px] text-gray-500 leading-snug">{t.orderPanelHint || 'Drag, use the arrows, or click a clip to jump to it.'}</p>
        </div>
      </aside>

      {/* Móvil: botón flotante y panel que sube desde abajo. */}
      {typeof document !== 'undefined' && createPortal(
        <div className="lg:hidden" style={brand.cssVars}>
          <button
            type="button"
            onClick={() => setHoja(true)}
            className="fixed bottom-8 left-4 z-[60] h-14 pl-4 pr-5 rounded-full bg-[#1c1a22] border border-twitch/40 text-white shadow-2xl shadow-black/60 flex items-center gap-2 text-xs font-black uppercase tracking-widest cursor-pointer active:scale-95 transition-transform"
          >
            <ListOrdered className="w-5 h-5 text-twitch" />
            {t.orderPanel || 'Order'}
            <span className="min-w-5 h-5 px-1.5 rounded-full bg-twitch text-[10px] flex items-center justify-center">{clips.length}</span>
          </button>
          {hoja && (
            <div className="fixed inset-0 z-[10000] flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={t.orderPanel || 'Order'}>
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setHoja(false)} />
              <div className="relative max-h-[78vh] flex flex-col rounded-t-[1.75rem] border-t border-white/10 bg-[#111114] p-4 pb-6 shadow-2xl animate-slide-up">
                <span className="mx-auto mb-3 w-10 h-1 rounded-full bg-white/20" />
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">{cabecera}</div>
                  <button type="button" onClick={() => setHoja(false)} aria-label={t.cancel || 'Close'} className="p-1.5 -mt-1 rounded-lg text-gray-400 hover:text-white cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="overflow-y-auto custom-scrollbar min-h-0">
                  <Lista {...props} visible={visible} onElegido={() => setHoja(false)} />
                </div>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
};

export default ClipOrderPanel;
