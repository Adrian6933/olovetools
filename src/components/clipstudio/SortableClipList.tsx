// ============================================================================
// Tarjetas de clip que se ordenan arrastrándolas
// ----------------------------------------------------------------------------
// Se mantiene pulsada la tarjeta (o se coge del asa de arriba) y se levanta:
// sigue al puntero, en su sitio queda un hueco y las demás se apartan con una
// animación. Al soltar, cae en el hueco.
//
// Detalles que no son evidentes:
//   - La tarjeta levantada NO cambia de sitio en el árbol de React: si se
//     montara en otro nodo perdería su estado (descargas en curso, el editor
//     de marca abierto...). Se queda en su envoltorio, posicionada encima del
//     hueco, y se mueve con transform.
//   - Las demás se animan con FLIP: se mide dónde estaban antes de reordenar,
//     se las pinta ahí con un transform y se suelta el transform con
//     transición.
//   - En táctil, una pulsación larga y luego preventDefault en touchmove: así
//     el dedo puede seguir haciendo scroll normal mientras no se mantenga.
// ============================================================================
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { GripHorizontal, ChevronUp, ChevronDown } from 'lucide-react';
import type { ClipItem } from './types';

interface Props {
  items: ClipItem[];
  onReorder: (next: ClipItem[]) => void;
  renderItem: (item: ClipItem, index: number) => React.ReactNode;
  t: any;
  disabled?: boolean;
}

interface Arrastre {
  id: string;
  /** Dónde se cogió la tarjeta, relativo a su esquina. */
  offX: number;
  offY: number;
  /** Último punto del puntero, en coordenadas de ventana. */
  x: number;
  y: number;
  alto: number;
}

/** Lo que el resto de la página puede pedirle a la lista. */
export interface SortableClipListHandle {
  /** Llamar justo antes de cambiar el orden desde fuera, para que se anime. */
  snapshot: () => void;
  /** Lleva la vista a una tarjeta y la ilumina un momento. */
  irA: (id: string) => void;
}

const PULSACION_MS = 320;
const INTERACTIVOS = 'button, a, input, select, textarea, video, label, [role="switch"], [data-no-drag]';

const mover = <T,>(arr: T[], de: number, a: number): T[] => {
  const copia = arr.slice();
  const [x] = copia.splice(de, 1);
  copia.splice(a, 0, x);
  return copia;
};

const SortableClipList = forwardRef<SortableClipListHandle, Props>(({ items, onReorder, renderItem, t, disabled }, ref) => {
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  const arrastreRef = useRef<Arrastre | null>(null);
  arrastreRef.current = arrastre;
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const envoltorios = useRef(new Map<string, HTMLDivElement>());
  const tarjetas = useRef(new Map<string, HTMLDivElement>());
  const antes = useRef(new Map<string, number>());
  const espera = useRef<{ timer: ReturnType<typeof setTimeout>; x: number; y: number } | null>(null);
  const scrollRaf = useRef(0);
  const [destello, setDestello] = useState<string | null>(null);
  const destelloTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const snapshot = useCallback(() => {
    antes.current.clear();
    envoltorios.current.forEach((el, id) => antes.current.set(id, el.getBoundingClientRect().top));
  }, []);

  const irA = useCallback((id: string) => {
    const el = envoltorios.current.get(id);
    if (!el) return;
    // Queda bajo la cabecera fija de la página, no tapado por ella.
    const y = el.getBoundingClientRect().top + window.scrollY - 140;
    window.scrollTo({ top: y, behavior: 'smooth' });
    clearTimeout(destelloTimer.current);
    setDestello(id);
    destelloTimer.current = setTimeout(() => setDestello(null), 1400);
  }, []);

  useImperativeHandle(ref, () => ({ snapshot, irA }), [snapshot, irA]);

  /** Las flechas: un puesto arriba o abajo, animado, y la vista la sigue. */
  const desplazar = (id: string, paso: -1 | 1) => {
    const lista = itemsRef.current;
    const i = lista.findIndex(c => c.id === id);
    const j = i + paso;
    if (i < 0 || j < 0 || j >= lista.length) return;
    snapshot();
    onReorder(mover(lista, i, j));
    requestAnimationFrame(() => requestAnimationFrame(() => irA(id)));
  };

  /** Coloca la tarjeta levantada bajo el puntero, esté donde esté su hueco. */
  const colocar = useCallback(() => {
    const a = arrastreRef.current;
    if (!a) return;
    const env = envoltorios.current.get(a.id);
    const tar = tarjetas.current.get(a.id);
    if (!env || !tar) return;
    const r = env.getBoundingClientRect();
    tar.style.transform = `translate3d(${a.x - a.offX - r.left}px, ${a.y - a.offY - r.top}px, 0) scale(0.96) rotate(-0.6deg)`;
  }, []);

  /** Mueve el hueco a donde esté el puntero. */
  const recolocarHueco = useCallback(() => {
    const a = arrastreRef.current;
    if (!a) return;
    const lista = itemsRef.current;
    const desde = lista.findIndex(c => c.id === a.id);
    let hasta = 0;
    for (const c of lista) {
      if (c.id === a.id) continue;
      const r = envoltorios.current.get(c.id)?.getBoundingClientRect();
      if (r && a.y > r.top + r.height / 2) hasta += 1;
    }
    if (desde >= 0 && hasta !== desde) {
      // FLIP, primera parte: dónde está cada una antes del cambio.
      snapshot();
      onReorder(mover(lista, desde, hasta));
    }
  }, [onReorder, snapshot]);

  // FLIP, segunda parte: tras el cambio, cada una vuelve animada a su sitio.
  useLayoutEffect(() => {
    if (antes.current.size === 0) return;
    envoltorios.current.forEach((el, id) => {
      const previo = antes.current.get(id);
      if (previo === undefined || id === arrastreRef.current?.id) return;
      const dy = previo - el.getBoundingClientRect().top;
      if (!dy) return;
      el.style.transition = 'none';
      el.style.transform = `translateY(${dy}px)`;
      void el.offsetHeight;
      el.style.transition = 'transform 320ms cubic-bezier(.2,.8,.2,1)';
      el.style.transform = '';
    });
    antes.current.clear();
    colocar();
  }, [items, colocar]);

  const soltar = useCallback(() => {
    const a = arrastreRef.current;
    if (!a) return;
    cancelAnimationFrame(scrollRaf.current);
    const env = envoltorios.current.get(a.id);
    const tar = tarjetas.current.get(a.id);
    // La tarjeta cae en el hueco con una transición en vez de saltar.
    if (tar && env) {
      tar.style.transition = 'transform 260ms cubic-bezier(.2,.8,.2,1), box-shadow 260ms';
      tar.style.transform = 'translate3d(0,0,0) scale(1) rotate(0deg)';
      setTimeout(() => { tar.style.transition = ''; tar.style.transform = ''; }, 280);
    }
    document.body.style.userSelect = '';
    setArrastre(null);
  }, []);

  // Mientras hay arrastre: seguir al puntero, desplazar la página cerca de
  // los bordes e impedir que el dedo haga scroll.
  useEffect(() => {
    if (!arrastre) return;
    const alMover = (e: PointerEvent) => {
      const a = arrastreRef.current;
      if (!a) return;
      a.x = e.clientX;
      a.y = e.clientY;
      colocar();
      recolocarHueco();
    };
    const bloquearScroll = (e: TouchEvent) => e.preventDefault();
    const autoScroll = () => {
      const a = arrastreRef.current;
      if (!a) return;
      const borde = 110;
      let v = 0;
      if (a.y < borde) v = -Math.ceil(((borde - a.y) / borde) * 22);
      else if (a.y > window.innerHeight - borde) v = Math.ceil(((a.y - (window.innerHeight - borde)) / borde) * 22);
      if (v) { window.scrollBy(0, v); colocar(); recolocarHueco(); }
      scrollRaf.current = requestAnimationFrame(autoScroll);
    };
    scrollRaf.current = requestAnimationFrame(autoScroll);
    window.addEventListener('pointermove', alMover);
    window.addEventListener('pointerup', soltar);
    window.addEventListener('pointercancel', soltar);
    window.addEventListener('touchmove', bloquearScroll, { passive: false });
    const alTeclear = (e: KeyboardEvent) => { if (e.key === 'Escape') soltar(); };
    window.addEventListener('keydown', alTeclear);
    return () => {
      cancelAnimationFrame(scrollRaf.current);
      window.removeEventListener('pointermove', alMover);
      window.removeEventListener('pointerup', soltar);
      window.removeEventListener('pointercancel', soltar);
      window.removeEventListener('touchmove', bloquearScroll);
      window.removeEventListener('keydown', alTeclear);
    };
  }, [arrastre?.id, colocar, recolocarHueco, soltar]); // eslint-disable-line react-hooks/exhaustive-deps

  const levantar = (id: string, x: number, y: number) => {
    const tar = tarjetas.current.get(id);
    if (!tar) return;
    const r = tar.getBoundingClientRect();
    if (navigator.vibrate) navigator.vibrate(12);
    document.body.style.userSelect = 'none';
    const nuevo = { id, offX: x - r.left, offY: y - r.top, x, y, alto: r.height };
    arrastreRef.current = nuevo;
    setArrastre(nuevo);
  };

  const cancelarEspera = () => {
    if (espera.current) { clearTimeout(espera.current.timer); espera.current = null; }
  };

  const alPulsar = (e: React.PointerEvent, id: string) => {
    if (disabled || arrastre || e.button !== 0 || items.length < 2) return;
    if ((e.target as HTMLElement).closest(INTERACTIVOS)) return;
    const { clientX: x, clientY: y } = e;
    cancelarEspera();
    espera.current = { x, y, timer: setTimeout(() => { espera.current = null; levantar(id, x, y); }, PULSACION_MS) };
  };

  const alMoverAntes = (e: React.PointerEvent) => {
    // Si el dedo o el ratón se mueve antes de tiempo era un scroll o una
    // selección, no una pulsación larga.
    const w = espera.current;
    if (w && Math.hypot(e.clientX - w.x, e.clientY - w.y) > 8) cancelarEspera();
  };

  return (
    <div className="grid grid-cols-1 gap-12 relative z-10">
      {items.map((c, i) => {
        const levantada = arrastre?.id === c.id;
        return (
          <div
            key={c.id}
            ref={el => { if (el) envoltorios.current.set(c.id, el); else envoltorios.current.delete(c.id); }}
            data-clip-id={c.id}
            className="relative"
            style={levantada ? { height: arrastre!.alto } : undefined}
          >
            {levantada && (
              <div
                key="hueco"
                className="absolute inset-0 rounded-[2.5rem] border-2 border-dashed border-twitch/60 bg-twitch/[0.06] flex items-center justify-center animate-pulse"
              >
                <span className="text-xs font-black uppercase tracking-widest text-twitch/80">{t.dropHere || 'Drop here'}</span>
              </div>
            )}
            <div
              key="tarjeta"
              ref={el => { if (el) tarjetas.current.set(c.id, el); else tarjetas.current.delete(c.id); }}
              onPointerDown={e => alPulsar(e, c.id)}
              onPointerMove={alMoverAntes}
              onPointerUp={cancelarEspera}
              onPointerCancel={cancelarEspera}
              onContextMenu={e => { if (espera.current || arrastre) e.preventDefault(); }}
              className={levantada
                ? 'absolute inset-x-0 top-0 z-50 pointer-events-none rounded-[2.5rem] bg-[#111114] shadow-[0_40px_120px_-20px_rgba(var(--color-accent-rgb),0.55)] ring-2 ring-twitch/70 opacity-95 will-change-transform'
                : 'relative'}
            >
              {/* Arriba, en el centro: flechas para subir y bajar un puesto y,
                  entre ellas, el asa, con la que el arrastre empieza al momento. */}
              {items.length > 1 && !disabled && (
                <div data-no-drag className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-40 h-8 flex items-center rounded-full bg-[#1c1a22] border border-white/10 shadow-xl ring-4 ring-[#070708] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => desplazar(c.id, -1)}
                    disabled={i === 0}
                    aria-label={t.moveUp || 'Move up'}
                    title={t.moveUp || 'Move up'}
                    className="h-full px-2.5 text-gray-400 hover:text-white hover:bg-twitch/30 disabled:opacity-25 disabled:hover:bg-transparent disabled:cursor-default cursor-pointer transition-colors"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onPointerDown={e => {
                      if (e.button !== 0) return;
                      e.preventDefault();
                      levantar(c.id, e.clientX, e.clientY);
                    }}
                    aria-label={t.dragToMove || 'Drag to move'}
                    title={t.dragToMove || 'Drag to move'}
                    className="h-full px-2.5 border-x border-white/10 text-gray-400 hover:text-white flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest touch-none cursor-grab active:cursor-grabbing"
                  >
                    <GripHorizontal className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t.dragToMove || 'Drag to move'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => desplazar(c.id, 1)}
                    disabled={i === items.length - 1}
                    aria-label={t.moveDown || 'Move down'}
                    title={t.moveDown || 'Move down'}
                    className="h-full px-2.5 text-gray-400 hover:text-white hover:bg-twitch/30 disabled:opacity-25 disabled:hover:bg-transparent disabled:cursor-default cursor-pointer transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              )}
              {/* Destello al llegar desde las flechas o desde el panel de orden. */}
              {destello === c.id && !levantada && (
                <div className="pointer-events-none absolute -inset-1 z-30 rounded-[2.75rem] ring-2 ring-twitch shadow-[0_0_60px_rgba(var(--color-accent-rgb),0.45)] animate-pulse" />
              )}
              {renderItem(c, i)}
            </div>
          </div>
        );
      })}
    </div>
  );
});
SortableClipList.displayName = 'SortableClipList';

export default SortableClipList;
