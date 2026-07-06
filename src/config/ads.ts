/**
 * Configuración central de AdSense. Este es el ÚNICO archivo a editar cuando
 * se creen las unidades de anuncio en el panel de AdSense: pega los slot IDs
 * abajo y cambia ADS_ENABLED a true. Con slots vacíos, todos los componentes
 * de anuncios (AdSlot, AdBanner, AdRail) renderizan null en producción.
 */

export const ADS_ENABLED = false;

export const AD_CLIENT = 'ca-pub-4601581729676999';

/**
 * Un único slot ID por posición, reutilizado en las 60 herramientas (patrón
 * estándar de AdSense: no hace falta una unidad de anuncio distinta por
 * página, solo por posición/formato).
 */
export const AD_SLOTS = {
  /** Banner horizontal encima del contenido principal de la herramienta */
  top: '',
  /** Banner horizontal en medio del flujo (poco usado, solo herramientas largas) */
  mid: '',
  /** Banner horizontal al final, tras el contenido/FAQ */
  late: '',
  /** Rectángulo 300x250 en la barra lateral de la sección "Casos de uso" */
  side: '',
  /** Unidad responsive in-content central bajo la herramienta (todas las tools, index.astro) */
  content: '',
  /** Tarjeta in-feed dentro del grid de herramientas del hub */
  infeed: '',
  /** Skyscraper en el raíl fijo izquierdo (120x600 desde 1560px, 160x600 desde 1650px) */
  railLeft: '',
  /** Skyscraper en el raíl fijo derecho (120x600 desde 1560px, 160x600 desde 1650px) */
  railRight: '',
} as const;

export type AdSlotName = keyof typeof AD_SLOTS;

/**
 * Herramientas donde los raíles laterales fijos deben ocultarse. Todas las
 * herramientas usan un contenedor centrado max-w-6xl/7xl (nunca ancho completo
 * de viewport), así que los raíles (fixed, fuera del flujo, sin CLS) no
 * interfieren con ninguna: la lista está vacía a propósito.
 */
export const RAIL_BLOCKLIST: string[] = [];
