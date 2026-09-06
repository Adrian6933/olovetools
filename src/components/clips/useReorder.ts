import { useCallback, useRef, useState } from 'react';

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
// ============================================================================

/** Píxeles que hay que mover antes de considerarlo un arrastre y no un toque. */
const UMBRAL_PX = 4;

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

  const terminar = useCallback(
    (destino: string | null) => {
      const origen = inicio.current?.id ?? null;
      inicio.current = null;
      activo.current = false;
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
          if (!activo.current) {
            const dx = Math.abs(e.clientX - desde.x);
            const dy = Math.abs(e.clientY - desde.y);
            if (dx < UMBRAL_PX && dy < UMBRAL_PX) return;
            activo.current = true;
            setState({ dragging: desde.id, over: desde.id });
          }
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
