import { useState, useEffect } from 'react';
/**
 * Configuración central de AdSense. Este es el ÚNICO archivo a editar cuando
 * se creen las unidades de anuncio en el panel de AdSense: pega los slot IDs
 * abajo y cambia ADS_ENABLED a true. Con slots vacíos, todos los componentes
 * de anuncios (AdSlot, AdBanner, AdRail) renderizan null en producción.
 */

export const ADS_ENABLED = true;

export const AD_CLIENT = 'ca-pub-4601581729676999';

/**
 * Un único slot ID por posición, reutilizado en las 60 herramientas (patrón
 * estándar de AdSense: no hace falta una unidad de anuncio distinta por
 * página, solo por posición/formato).
 */
export const AD_SLOTS = {
  /** Banner horizontal encima del contenido principal de la herramienta */
  top: '7309881476',
  /**
   * Banner horizontal en medio del flujo (6 herramientas largas: audiosnap,
   * clip-flow, favicon-bolt, graph-flow, lottie-viewer, svg-optimizer).
   * No tiene unidad propia en AdSense: reutiliza olove-content, que es el
   * mismo formato (display responsive in-content). Si algún día quieres
   * separar métricas, crea "olove-mid" (Display / responsive) y pega el id.
   */
  mid: '1164522366',
  /** Banner horizontal al final, tras el contenido/FAQ */
  late: '6336957990',
  /** Rectángulo 300x250 sticky junto a la sección SEO/FAQ, en las 60 herramientas */
  side: '6352023022',
  /** Unidad responsive in-content central bajo la herramienta (todas las tools, index.astro) */
  content: '1164522366',
  /** Tarjeta in-feed dentro del grid de herramientas del hub */
  infeed: '8576907287',
  /** Skyscraper en el raíl fijo izquierdo (120x600 desde 1560px, 160x600 desde 1650px) */
  railLeft: '7730729470',
  /** Skyscraper en el raíl fijo derecho (120x600 desde 1560px, 160x600 desde 1650px) */
  railRight: '7730729470',
  /**
   * Barra fija al pie del viewport (descartable), en las 60 herramientas.
   * Compensa el hueco de impresiones que dejan los raíles laterales cuando
   * el contenido de la tool no deja hueco lateral (Clipy, Formatflow...) o
   * en viewports por debajo de 1560px, donde los raíles nunca se muestran.
   */
  anchor: '8276725627',
} as const;

/** Layout key del bloque in-feed (formato "fluid"), tal como lo generó AdSense para este bloque concreto. */
export const AD_INFEED_LAYOUT_KEY = '-6t+ed+2i-1n-4w';

export type AdSlotName = keyof typeof AD_SLOTS;

/**
 * Herramientas donde los raíles laterales fijos deben ocultarse siempre,
 * sin importar el hueco disponible. AdRail.tsx ya mide en runtime el hueco
 * real entre el contenido (#root) y el borde del viewport antes de mostrar
 * cada raíl (las herramientas NO comparten un mismo ancho de contenido:
 * algunas usan max-w-7xl/1280px, Clipy llega a max-w-[1800px]...), así que
 * esta lista queda para excepciones manuales puntuales, no para compensar
 * el ancho de contenido — eso ya lo resuelve la medición en runtime (p.ej.
 * Clipy no necesita estar aquí: con su main a 1800px de ancho, el hueco solo
 * pasa el umbral en monitores ultra anchos, y ahí sí tiene sentido mostrarlos).
 */
export const RAIL_BLOCKLIST: string[] = [];

/**
 * Los dos únicos textos de anuncios que llega a leer un visitante: el rótulo
 * "Anuncio" y el botón de cerrar el anuncio ancla. Los componentes de anuncio
 * no reciben diccionario de herramienta —los monta la página, no la isla— así
 * que el idioma sale del que el layout ya declara en <html lang>.
 */
const TEXTOS_ANUNCIO: Record<string, { anuncio: string; cerrar: string }> = {
  en: { anuncio: 'Advertisement', cerrar: 'Close ad' },
  es: { anuncio: 'Anuncio', cerrar: 'Cerrar el anuncio' },
  fr: { anuncio: 'Publicité', cerrar: "Fermer l'annonce" },
  de: { anuncio: 'Anzeige', cerrar: 'Anzeige schließen' },
  pt: { anuncio: 'Publicidade', cerrar: 'Fechar o anúncio' },
  ru: { anuncio: 'Реклама', cerrar: 'Закрыть объявление' },
  hi: { anuncio: 'विज्ञापन', cerrar: 'विज्ञापन बंद करें' },
  ja: { anuncio: '広告', cerrar: '広告を閉じる' },
  zh: { anuncio: '广告', cerrar: '关闭广告' },
};

/**
 * El idioma sale de <html lang>, que en el servidor no existe. Leerlo durante el
 * render hacía que el servidor pintara "Advertisement" y el navegador "Anuncio",
 * y React abortaba la hidratación de la isla entera — la herramienta se quedaba
 * muerta. Por eso el primer render es siempre el inglés, igual en los dos lados,
 * y el idioma real entra tras montar.
 */
export const useTextosAnuncio = () => {
  const [txt, setTxt] = useState(TEXTOS_ANUNCIO.en);
  useEffect(() => {
    const l = document.documentElement.lang.slice(0, 2);
    if (TEXTOS_ANUNCIO[l]) setTxt(TEXTOS_ANUNCIO[l]);
  }, []);
  return txt;
};
