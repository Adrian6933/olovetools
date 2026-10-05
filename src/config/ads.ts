import { useState, useEffect } from 'react';

/** Manual ads only. Auto ads are controlled separately in the AdSense panel. */
export const ADS_ENABLED = true;
export const AD_CLIENT = 'ca-pub-4601581729676999';

/** Existing olove units. Only top, content and late are currently placed.
 * Tools: top + content. Hub: top + late. IDs are shared across languages.
 * Keep unused units recorded here; they need not be deleted in AdSense.
 */
export const AD_SLOTS = {
  top: '7309881476',
  content: '1164522366',
  late: '6336957990',
  // Inactive legacy placements:
  mid: '1164522366',
  side: '6352023022',
  infeed: '8576907287',
  railLeft: '7730729470',
  railRight: '7730729470',
  anchor: '8276725627',
} as const;

export const AD_INFEED_LAYOUT_KEY = '-6t+ed+2i-1n-4w';
export type AdSlotName = keyof typeof AD_SLOTS;
// Legacy rail component is no longer mounted on any page.
export const RAIL_BLOCKLIST: string[] = [];

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
