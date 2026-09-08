import { useCallback, useEffect, useRef, useState } from 'react';

// ============================================================================
// Reordenar una lista arrastrando, con ratón y con el dedo.
// ----------------------------------------------------------------------------
// Va con eventos de puntero y no con el arrastrar-y-soltar nativo de HTML: ese
// no existe en móvil, y la lista de clips guardados se usa tanto ahí como en el
// escritorio.
//
// El agarre es una zona propia (el asa), no la fila entera, por dos razones: la
// fila ya tiene botones que hay que poder pulsar, y en móvil el `touch-action:
// none` que hace falta para que el navegador no se lleve el gesto como scroll
// se queda encerrado en el asa — el panel se sigue pudiendo deslizar con el
// dedo en cualquier otro sitio.
//
// Mientras se arrastra se ve una copia de la fila pegada al puntero. Sin ella
// el gesto era de fe: la fila se quedaba quieta y translúcida en su sitio y lo
// único que se movía era un borde de color en la fila de destino, así que no
// había manera de saber que llevabas algo cogido ni qué era.
// ============================================================================

/** Píxeles que hay que mover antes de considerarlo un arrastre y no un toque. */
const UMBRAL_PX = 4;

/** Por encima del reproductor flotante (9999) y de los diálogos (10000/10001). */
const Z_FANTASMA = 10050;

/** Franja de los bordes del panel que arrastra el scroll al entrar en ella. */
const BORDE_SCROLL_PX = 56;

export interface ReorderState {
  /** Id de lo que se está arrastrando, o null. */
  dragging: string | null;
  /** Id de la fila sobre la que caería ahora mismo. */
  over: string | null;
}

export interface UseReorder {
  state: ReorderState;
  /** Va en el asa de cada fila. */
  handleProps: (id: string) => {
    onPointerDown: (event: React.PointerEvent) => void;
    style: React.CSSProperties;
  };
  /** Va en el contenedor de cada fila, para localizarla bajo el dedo. */
  rowProps: (id: string) => { 'data-reorder-id': string };
}

/**
 * La fila de un id concreto. Se recorren todas en vez de usar un selector para
 * no tener que escapar ids que vienen de fuera (los slugs de los clips).
 */
function buscarFila(id: string): HTMLElement | null {
  const filas = document.querySelectorAll<HTMLElement>('[data-reorder-id]');
  for (const fila of filas) {
    if (fila.getAttribute('data-reorder-id') === id) return fila;
  }
  return null;
}

/**
 * El antepasado que tiene barra de scroll, si lo hay: es el que hay que mover
 * cuando el arrastre llega al borde del panel.
 */
function contenedorConScroll(desde: HTMLElement | null): HTMLElement | null {
  for (let nodo = desde?.parentElement; nodo; nodo = nodo.parentElement) {
    const overflow = getComputedStyle(nodo).overflowY;
    if ((overflow === 'auto' || overflow === 'scroll') && nodo.scrollHeight > nodo.clientHeight + 4) {
      return nodo;
    }
  }
  return null;
}

/**
 * `ids` es el orden actual; `onReorder` recibe el orden nuevo completo. Se
 * trabaja con ids y no con objetos para que valga igual con una lista plana que
 * con una repartida en secciones: el orden que sale es el de la lista maestra.
 */
export function useReorder(ids: string[], onReorder: (nextIds: string[]) => void): UseReorder {
  const [state, setState] = useState<ReorderState>({ dragging: null, over: null });
  const inicio = useRef<{ x: number; y: number; id: string } | null>(null);
  const activo = useRef(false);
  const idsRef = useRef(ids);
  idsRef.current = ids;

  /** La copia que sigue al puntero mientras dura el gesto. */
  const fantasma = useRef<HTMLElement | null>(null);
  /** Panel que hay que desplazar al arrastrar contra sus bordes. */
  const panel = useRef<HTMLElement | null>(null);
  /** Última posición del puntero, para el desplazamiento automático. */
  const puntero = useRef<{ x: number; y: number } | null>(null);
  const bucle = useRef<number | null>(null);

  /**
   * Qué fila cae bajo el puntero. Se mide contra los rectángulos de las filas y
   * no con elementFromPoint: ahí manda quién esté por encima, y con el clip
   * arrastrado siguiendo al cursor o cualquier capa por medio devuelve la
   * respuesta equivocada. Comparando posiciones no hay nada que se interponga.
   */
  const filaBajo = (x: number, y: number): string | null => {
    const filas = document.querySelectorAll<HTMLElement>('[data-reorder-id]');
    let mejor: string | null = null;
    let distancia = Infinity;
    for (const fila of filas) {
      const r = fila.getBoundingClientRect();
      if (r.height === 0) continue;
      if (y >= r.top && y <= r.bottom && x >= r.left && x <= r.right) {
        return fila.getAttribute('data-reorder-id');
      }
      // Fuera de toda fila (entre dos, o pasado el final de la lista) vale la
      // más cercana en vertical: soltar un pelo por debajo de la última tiene
      // que dejarlo al final, no cancelar el gesto.
      const centro = r.top + r.height / 2;
      const d = Math.abs(y - centro);
      if (d < distancia) {
        distancia = d;
        mejor = fila.getAttribute('data-reorder-id');
      }
    }
    return distancia < 160 ? mejor : null;
  };

  /** Levanta la copia de la fila y la deja flotando donde estaba el original. */
  const crearFantasma = (id: string) => {
    const fila = buscarFila(id);
    if (!fila) return;
    const r = fila.getBoundingClientRect();
    const copia = fila.cloneNode(true) as HTMLElement;
    // Sin esto la copia contaría como una fila más al buscar el destino, y el
    // clip acabaría cayendo siempre sobre sí mismo.
    copia.removeAttribute('data-reorder-id');
    copia.setAttribute('aria-hidden', 'true');
    copia.style.position = 'fixed';
    copia.style.left = `${r.left}px`;
    copia.style.top = `${r.top}px`;
    copia.style.width = `${r.width}px`;
    copia.style.height = `${r.height}px`;
    copia.style.margin = '0';
    copia.style.pointerEvents = 'none';
    copia.style.zIndex = String(Z_FANTASMA);
    copia.style.opacity = '0.95';
    copia.style.boxShadow = '0 18px 40px -12px rgba(0, 0, 0, 0.75)';
    copia.style.transform = 'scale(1.03) rotate(-1deg)';
    copia.style.transition = 'none';
    copia.style.willChange = 'transform';
    document.body.appendChild(copia);
    fantasma.current = copia;

    panel.current = contenedorConScroll(fila);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
  };

  const moverFantasma = (x: number, y: number) => {
    const desde = inicio.current;
    if (!fantasma.current || !desde) return;
    fantasma.current.style.transform =
      `translate(${x - desde.x}px, ${y - desde.y}px) scale(1.03) rotate(-1deg)`;
  };

  const limpiar = () => {
    fantasma.current?.remove();
    fantasma.current = null;
    panel.current = null;
    puntero.current = null;
    if (bucle.current !== null) {
      cancelAnimationFrame(bucle.current);
      bucle.current = null;
    }
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  };

  /**
   * Arrastrar contra el borde del panel lo desplaza. Con veinte clips guardados
   * el sitio al que quieres llevarlo suele estar fuera de la vista, y sin esto
   * no hay forma de llegar: soltar para hacer scroll deja el clip a medias.
   */
  const arrancarAutoScroll = () => {
    if (bucle.current !== null || !panel.current) return;
    const paso = () => {
      bucle.current = requestAnimationFrame(paso);
      const caja = panel.current;
      const p = puntero.current;
      if (!caja || !p) return;
      const r = caja.getBoundingClientRect();
      let salto = 0;
      if (p.y < r.top + BORDE_SCROLL_PX) salto = -Math.ceil((r.top + BORDE_SCROLL_PX - p.y) / 3);
      else if (p.y > r.bottom - BORDE_SCROLL_PX) salto = Math.ceil((p.y - (r.bottom - BORDE_SCROLL_PX)) / 3);
      if (!salto) return;
      const antes = caja.scrollTop;
      caja.scrollTop = antes + salto;
      if (caja.scrollTop === antes) return; // ya estaba arriba del todo, o abajo
      const destino = filaBajo(p.x, p.y);
      if (destino) setState(s => (s.over === destino ? s : { ...s, over: destino }));
    };
    bucle.current = requestAnimationFrame(paso);
  };

  const terminar = useCallback(
    (destino: string | null) => {
      const origen = inicio.current?.id ?? null;
      inicio.current = null;
      activo.current = false;
      limpiar();
      setState({ dragging: null, over: null });
      if (!origen || !destino || origen === destino) return;

      const orden = [...idsRef.current];
      const desde = orden.indexOf(origen);
      const hasta = orden.indexOf(destino);
      if (desde < 0 || hasta < 0) return;
      orden.splice(desde, 1);
      orden.splice(hasta, 0, origen);
      onReorder(orden);
    },
    [onReorder]
  );

  // Si el panel se cierra a media faena, la copia se queda pegada a la pantalla
  // para siempre. Y el cursor de agarrar, con ella.
  useEffect(() => limpiar, []);

  const handleProps = useCallback(
    (id: string) => ({
      onPointerDown: (event: React.PointerEvent) => {
        // Sólo el botón principal: con el derecho se abre el menú del navegador
        // y el arrastre se quedaría enganchado.
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        inicio.current = { x: event.clientX, y: event.clientY, id };
        activo.current = false;

        const objetivo = event.currentTarget as HTMLElement;
        // Capturar el puntero puede fallar (NotFoundError) si ya se ha soltado
        // entre el evento y esta linea. Es un extra para que el arrastre siga
        // aunque el dedo se salga del asa, no un requisito: si no se puede, se
        // sigue igual con los escuchas de document.
        try {
          objetivo.setPointerCapture?.(event.pointerId);
        } catch {
          /* sin captura: el arrastre funciona igual */
        }

        const mover = (e: PointerEvent) => {
          const desde = inicio.current;
          if (!desde) return;
          puntero.current = { x: e.clientX, y: e.clientY };
          if (!activo.current) {
            const dx = Math.abs(e.clientX - desde.x);
            const dy = Math.abs(e.clientY - desde.y);
            if (dx < UMBRAL_PX && dy < UMBRAL_PX) return;
            activo.current = true;
            // La copia se saca ANTES de pintar el nuevo estado: en cuanto se
            // pinta, la fila original se queda a media opacidad y la copia
            // heredaría ese aspecto de fantasma a medio borrar.
            crearFantasma(desde.id);
            arrancarAutoScroll();
            setState({ dragging: desde.id, over: desde.id });
          }
          moverFantasma(e.clientX, e.clientY);
          setState({ dragging: desde.id, over: filaBajo(e.clientX, e.clientY) ?? desde.id });
        };

        const soltar = (e: PointerEvent) => {
          document.removeEventListener('pointermove', mover);
          document.removeEventListener('pointerup', soltar);
          document.removeEventListener('pointercancel', cancelar);
          try {
            objetivo.releasePointerCapture?.(event.pointerId);
          } catch {
            /* no se llego a capturar */
          }
          terminar(activo.current ? filaBajo(e.clientX, e.clientY) : null);
        };

        const cancelar = () => {
          document.removeEventListener('pointermove', mover);
          document.removeEventListener('pointerup', soltar);
          document.removeEventListener('pointercancel', cancelar);
          terminar(null);
        };

        document.addEventListener('pointermove', mover);
        document.addEventListener('pointerup', soltar);
        document.addEventListener('pointercancel', cancelar);
      },
      // Encerrado en el asa: el resto del panel se sigue deslizando con el dedo.
      style: { touchAction: 'none' as const },
    }),
    [terminar]
  );

  const rowProps = useCallback((id: string) => ({ 'data-reorder-id': id }), []);

  return { state, handleProps, rowProps };
}
