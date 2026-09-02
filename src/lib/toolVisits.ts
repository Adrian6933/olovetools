// ============================================================================
// Cuántas veces ha abierto ESTE visitante cada herramienta
// ----------------------------------------------------------------------------
// Vive sólo en su navegador. No se envía a ninguna parte, no se cruza con el
// contador global y se borra al limpiar los datos del sitio. Sirve para que el
// hub pueda ofrecer "las que más usas tú", que es útil desde la primera visita
// — al contrario que el ranking global, que necesita tráfico para significar
// algo.
// ============================================================================

const CLAVE = 'olovetools_tool_visits';

/** { slug: veces abierta } */
export type VisitasPropias = Record<string, number>;

export function leerVisitasPropias(): VisitasPropias {
  if (typeof window === 'undefined') return {};
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return {};
    const datos = JSON.parse(crudo);
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) return {};
    const salida: VisitasPropias = {};
    for (const [slug, n] of Object.entries(datos)) {
      // Se filtra en la lectura, no sólo en la escritura: el contenido puede
      // venir de una versión anterior o de alguien que lo editó a mano.
      if (typeof n === 'number' && Number.isFinite(n) && n > 0) salida[slug] = n;
    }
    return salida;
  } catch {
    // Modo privado o valor corrupto: se empieza de cero sin romper nada.
    return {};
  }
}

/** Suma una visita a esta herramienta y devuelve el total del visitante. */
export function registrarVisitaPropia(slug: string): number {
  if (typeof window === 'undefined' || !slug) return 0;
  const actual = leerVisitasPropias();
  const total = (actual[slug] || 0) + 1;
  actual[slug] = total;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(actual));
  } catch {
    // Almacenamiento lleno o denegado: la visita no se recuerda y ya está.
  }
  return total;
}

export function olvidarVisitasPropias(): void {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    /* nada que hacer */
  }
}
