// TwitchBolt: la herramienta común de clips (clipstudio) con lo de Twitch.
import React from 'react';
import ClipToolApp, { type ClipToolConfig } from '../../components/clipstudio/ClipToolApp';
import type { ClipBrand } from '../../components/clipstudio/brand';
import Header from './components/Header';
import Footer from './components/Footer';
import LegalModal from './components/LegalModal';
import * as art from './components/Illustrations';
import { downloadBlob, fetchClipInfo, fetchMovieBlob } from './services/twitchService';
import { getLastRoute, setAllowThirdParty } from './services/route';
import { extraerEnlacesTwitch } from './links';
import type { Language } from '../../locales/meta';

// Twitch da MP4 y el acento morado es el de serie, así que no hace falta
// enganchar el vídeo a mano ni redefinir colores.
const brand: ClipBrand = {
  id: 'twitch',
  name: 'Twitch',
  domain: 'twitch.tv',
  storagePrefix: 'twitchbolt',
  accent: '#9146FF',
  fetchMovieBlob,
  downloadBlob,
};

const tool = (dictionary: any): ClipToolConfig => ({
  brand,
  slug: 'twitchbolt',
  fetchClipInfo,
  extractLinks: extraerEnlacesTwitch,
  route: { getLastRoute, setAllowThirdParty },
  Header,
  Footer,
  LegalModal,
  art,
  crossSell: {
    slug: 'kickbolt',
    label: dictionary?.kickCrossSell || 'Looking to download Kick clips?',
    cta: dictionary?.kickCrossSellCta || 'Try KickBolt',
    color: '#53FC18',
  },
  fallbacks: {
    routeNotice: 'Twitch blocks direct browser requests, so clips are relayed. Our own relay is tried first; public relays are the fallback.',
    noLinks: 'No Twitch clip links found',
  },
});

const Twitchbolt: React.FC<{ lang: Language; dictionary?: any }> = ({ lang = 'en', dictionary }) => (
  <ClipToolApp lang={lang} dictionary={dictionary} tool={tool(dictionary)} />
);

export default Twitchbolt;
