// KickBolt: la herramienta común de clips (clipstudio) con lo de Kick. Antes
// era una copia vieja de TwitchBolt y se quedaba sin cada mejora; ahora tiene
// las mismas (marca de agua, orden, ZIP con marca, vídeo unido...).
import React from 'react';
import ClipToolApp, { type ClipToolConfig } from '../../components/clipstudio/ClipToolApp';
import type { ClipBrand } from '../../components/clipstudio/brand';
import Header from './components/Header';
import Footer from './components/Footer';
import LegalModal from './components/LegalModal';
import * as art from './components/Illustrations';
import { downloadBlob, fetchClipInfo, fetchMovieBlob } from './services/kickService';
import { getLastRoute, setAllowThirdParty } from './services/route';
import { extraerEnlacesKick } from './links';
import { attachKickSource } from './hls';
import type { Language } from '../../locales/meta';

const brand: ClipBrand = {
  id: 'kick',
  name: 'Kick',
  domain: 'kick.com',
  storagePrefix: 'kickbolt',
  accent: '#53FC18',
  fetchMovieBlob,
  downloadBlob,
  // Kick da listas HLS: para verlas en Chrome o Firefox hace falta hls.js.
  attachSource: attachKickSource,
  // El verde entra por aquí: las piezas comunes pintan con var(--color-twitch)
  // y con la tinta del acento, que sobre este verde tiene que ser casi negra
  // (el blanco da 1,37:1 y no se lee). Mismo truco que Klipy.
  cssVars: {
    ['--color-twitch' as any]: '#53fc18',
    ['--color-twitch-base' as any]: '#53fc18',
    ['--color-twitch-dark' as any]: '#3fd40f',
    ['--color-accent-ink' as any]: '#0a1206',
    ['--color-accent-rgb' as any]: '83, 252, 24',
  },
};

const tool = (dictionary: any): ClipToolConfig => ({
  brand,
  slug: 'kickbolt',
  fetchClipInfo,
  extractLinks: extraerEnlacesKick,
  route: { getLastRoute, setAllowThirdParty },
  Header,
  Footer,
  LegalModal,
  art,
  crossSell: {
    slug: 'twitchbolt',
    label: dictionary?.twitchCrossSell || 'Looking to download Twitch clips?',
    cta: dictionary?.twitchCrossSellCta || 'Try TwitchBolt',
    color: '#a970ff',
  },
  fallbacks: {
    routeNotice: 'Kick blocks direct browser requests, so clips are relayed. Our own relay is tried first; public relays are the fallback.',
    noLinks: 'No Kick clip links found',
  },
});

const Kickbolt: React.FC<{ lang: Language; dictionary?: any }> = ({ lang = 'en', dictionary }) => (
  <ClipToolApp lang={lang} dictionary={dictionary} tool={tool(dictionary)} />
);

export default Kickbolt;
