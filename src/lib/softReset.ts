/**
 * Reinicio suave de una herramienta.
 *
 * Al pulsar el nombre de la herramienta en la cabecera, la tool vuelve a su
 * estado inicial y la página sube arriba del todo — como recargar, pero sin
 * recargar: no hay parpadeo, no se vuelve a descargar nada y lo que el usuario
 * tenga guardado en su navegador (colecciones, ajustes, idioma) se conserva,
 * igual que sobreviviría a una recarga de verdad.
 *
 * El scroll vive aquí y no dentro del reset de cada herramienta por dos motivos:
 * las 60 lo hacían distinto o no lo hacían, y así subir arriba está garantizado
 * incluso en las tools cuyo reset es un no-op porque no tienen nada que limpiar.
 */

/** Sube al principio de la página respetando a quien pidió menos movimiento. */
export function scrollToTop(): void {
  if (typeof window === 'undefined') return;
  // matchMedia con ?. porque en algún navegador viejo y en los tests no existe.
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
}

/**
 * Envuelve el reset de una herramienta para la cabecera: limpia su estado y
 * sube arriba. Si la tool no pasa nada, sigue subiendo arriba.
 */
export function withScrollToTop(reset?: () => void): () => void {
  return () => {
    try {
      reset?.();
    } finally {
      // En finally para que un fallo del reset de la tool no deje al usuario
      // a medio scroll sin saber si pasó algo.
      scrollToTop();
    }
  };
}
