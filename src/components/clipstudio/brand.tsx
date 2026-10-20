// ============================================================================
// La plataforma de la que vienen los clips
// ----------------------------------------------------------------------------
// TwitchBolt y KickBolt son la misma herramienta con distinto origen: la marca
// de agua, el orden, el ZIP y el vídeo unido viven en clipstudio, y lo único
// que cambia entre las dos va aquí. Las piezas lo leen del contexto en vez de
// recibirlo de prop en prop.
// ============================================================================
import React, { createContext, useContext } from 'react';

export type BrandId = 'twitch' | 'kick';

export interface ClipBrand {
  id: BrandId;
  /** Nombre visible: "Twitch", "Kick". */
  name: string;
  /** Dominio para las plantillas del cartel ("twitch.tv/{channel}"). */
  domain: string;
  /** Prefijo de lo que se guarda en el navegador ("twitchbolt_quality"...). */
  storagePrefix: string;
  /** Descarga un vídeo a memoria; siempre devuelve algo que un <video> lea. */
  fetchMovieBlob: (url: string, onProgress: (loaded: number, total: number) => void, signal?: AbortSignal) => Promise<Blob>;
  /** Descarga un vídeo directamente al equipo. */
  downloadBlob: (url: string, filename: string, onProgress: (loaded: number, total: number) => void, signal?: AbortSignal) => Promise<void>;
  /**
   * Engancha una URL de vídeo a un <video> para verla. Twitch da MP4 y basta
   * con src; Kick da listas HLS que solo Safari reproduce de serie.
   */
  attachSource?: (video: HTMLVideoElement, url: string) => (() => void) | void;
  /** Color de acento de la plataforma, en el formato de --color-twitch. */
  accent: string;
  /**
   * Variables CSS que tiñen las piezas compartidas con el color de la
   * plataforma. Van en la raíz de la herramienta y también en lo que se abre
   * en portal (pantalla completa, hoja de móvil), que cuelga del body y no
   * las heredaría.
   */
  cssVars?: React.CSSProperties;
}

export const BrandContext = createContext<ClipBrand | null>(null);

export const useBrand = (): ClipBrand => {
  const b = useContext(BrandContext);
  if (!b) throw new Error('clipstudio: falta <BrandContext.Provider>');
  return b;
};

/** Pone la URL en el <video> como toque según la plataforma. */
export const attachVideo = (brand: ClipBrand, video: HTMLVideoElement, url: string): (() => void) | undefined => {
  if (brand.attachSource) return brand.attachSource(video, url) || undefined;
  video.src = url;
  return undefined;
};

/** El icono de cada plataforma, el mismo trazo que pinta el canvas. */
export const BRAND_ICON_PATHS: Record<BrandId, string> = {
  twitch: 'M4.3 3 3 6.4v13.1h4.6V22h2.6l2.4-2.5h3.7l5-5V3H4.3Zm15.5 10.6-2.9 2.9h-4.6L9.8 19v-2.5H6V4.7h13.8v8.9Zm-2.9-5.9v5h-1.7v-5h1.7Zm-4.6 0v5h-1.7v-5h1.7Z',
  // La K escalonada de Kick.
  kick: 'M3 3h6v6h2V7h2V5h2V3h6v6h-2v2h-2v2h2v2h2v6h-6v-2h-2v-2h-2v-2H9v6H3Z',
};

export const BrandGlyph: React.FC<{ brand: BrandId; className?: string }> = ({ brand, className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d={BRAND_ICON_PATHS[brand]} />
  </svg>
);
