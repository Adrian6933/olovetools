import React, { useState, useEffect, useRef } from 'react';
import { ToolTheme } from '../../lib/themes';
import { ADS_ENABLED, AD_CLIENT, AD_SLOTS, AD_INFEED_LAYOUT_KEY, useTextosAnuncio } from '../../config/ads';

export type AdSlotPosition = 'top' | 'mid' | 'side' | 'late' | 'anchor' | 'content' | 'infeed' | 'railLeft' | 'railRight';
export type AdSlotSize = 'leaderboard' | 'rectangle' | 'mobile-banner' | 'skyscraper';

interface AdSlotProps {
  /** Tema visual del placeholder; si se omite se usa uno neutro (hub / páginas sin tema de tool) */
  theme?: ToolTheme;
  position: AdSlotPosition;
  size?: AdSlotSize;
  lazyLoad?: boolean;
  /** Override the client/slot resolved from src/config/ads.ts */
  adSenseClient?: string;
  adSenseSlot?: string;
}

/**
 * Alturas MÍNIMAS, nunca fijas. Todas las unidades de AdSense de este sitio
 * (salvo la in-feed) son "display responsive": el alto real lo decide Google a
 * partir del ancho disponible (un 728x90 puede servirse como 970x250 en
 * escritorio o como 336x280 en móvil). Con `h-*` fijo + `overflow-hidden` el
 * anuncio se recortaba —además de perder relleno, mostrar un anuncio cortado
 * incumple las políticas de AdSense—, así que aquí solo se reserva el mínimo
 * para que el CLS sea bajo y se deja crecer al contenedor.
 */
const SIZE_CLASSES: Record<AdSlotSize, string> = {
  leaderboard: 'min-h-[90px] max-w-[970px]',
  rectangle: 'min-h-[250px] max-w-[300px]',
  'mobile-banner': 'min-h-[50px] max-w-[728px]',
  skyscraper: 'w-[160px] min-h-[600px]',
};


/** Tema neutro para contextos sin ToolTheme (hub, slot central de index.astro). */
const NEUTRAL_THEME = {
  primaryHex: '#64748b',
  border: 'rgba(255,255,255,0.08)',
  textMuted: '#64748b',
  radius: 'md',
} as unknown as ToolTheme;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const ANCHOR_DISMISS_KEY = 'anchor_ad_dismissed';

export const AdSlot: React.FC<AdSlotProps> = ({
  theme = NEUTRAL_THEME,
  position,
  size = 'leaderboard',
  lazyLoad = true,
  adSenseClient,
  adSenseSlot,
}) => {
  const textosAd = useTextosAnuncio();
  const [inView, setInView] = useState(!lazyLoad);
  const [dismissed, setDismissed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const insRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef(false);

  const client = adSenseClient ?? AD_CLIENT;
  const slot = adSenseSlot ?? (position in AD_SLOTS ? AD_SLOTS[position as keyof typeof AD_SLOTS] : '');

  useEffect(() => {
    if (position === 'anchor' && sessionStorage.getItem(ANCHOR_DISMISS_KEY) === 'true') {
      setDismissed(true);
    }
  }, [position]);

  useEffect(() => {
    if (!lazyLoad || inView) return;
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [lazyLoad, inView]);

  // `!import.meta.env.DEV`: AdSense no sirve anuncios en localhost, así que en
  // desarrollo el <ins> real se queda vacío y el hueco parece no existir. En DEV
  // se pinta siempre el recuadro de prueba; en producción manda la config.
  const isActive = ADS_ENABLED && !!client && !!slot && inView && !import.meta.env.DEV;

  useEffect(() => {
    if (!isActive || !insRef.current || pushedRef.current) return;
    // Evita el doble-push que rompe adsbygoogle en soft-navigations de Astro (ClientRouter).
    if (insRef.current.getAttribute('data-ad-status')) return;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      pushedRef.current = true;
    } catch {
      // adsbygoogle.js aún no cargado o bloqueado por un ad-blocker; no es un error de la app.
    }
  }, [isActive]);

  if (!isActive && !import.meta.env.DEV) return null;
  if (position === 'anchor' && dismissed) return null;

  // Sin `h-full`: el <ins> debe poder crecer hasta el alto que decida AdSense.
  // Todas las unidades del panel son responsive salvo la in-feed (fluid), así
  // que el único caso especial es esa; el resto lleva format=auto igual que el
  // snippet que genera AdSense.
  const adBody = isActive ? (
    <ins
      ref={insRef}
      className="adsbygoogle block w-full"
      style={{ display: 'block', minHeight: size === 'skyscraper' ? 600 : undefined }}
      data-ad-client={client}
      data-ad-slot={slot}
      {...(position === 'infeed'
        ? { 'data-ad-format': 'fluid', 'data-ad-layout-key': AD_INFEED_LAYOUT_KEY }
        : { 'data-ad-format': 'auto', 'data-full-width-responsive': 'true' })}
    />
  ) : (
    <div className="text-center space-y-1">
      <p className="text-[10px] font-black uppercase tracking-[0.25em]" style={{ color: theme.textMuted }}>
        {textosAd.anuncio}
      </p>
    </div>
  );

  // La barra "anchor" es descartable y fija al pie del viewport: no compite
  // por espacio con el contenido (a diferencia de los raíles laterales, que
  // dependen del hueco disponible), así que sirve para compensar impresiones
  // en anchos de viewport donde los raíles no caben.
  if (position === 'anchor') {
    return (
      <div
        ref={ref}
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center gap-3 border-t border-white/10 bg-[#0b0b10]/95 backdrop-blur px-3 py-2"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        role="complementary"
        aria-label={textosAd.anuncio}
      >
        <div
          className={`relative flex items-center justify-center ${SIZE_CLASSES[size]} w-full`}
          style={{
            backgroundColor: `${theme.primaryHex}05`,
            border: `1px dashed ${theme.border}`,
            borderRadius: theme.radius === 'full' ? '1rem' : theme.radius === 'sm' ? '0.375rem' : '0.5rem',
          }}
        >
          {adBody}
        </div>
        <button
          type="button"
          aria-label={textosAd.cerrar}
          onClick={() => {
            sessionStorage.setItem(ANCHOR_DISMISS_KEY, 'true');
            setDismissed(true);
          }}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`flex flex-col items-center justify-center mx-auto ${SIZE_CLASSES[size]} w-full`}
      role="complementary"
      aria-label={textosAd.anuncio}
    >
      <div
        className="relative w-full flex-1 flex items-center justify-center"
        style={{
          backgroundColor: `${theme.primaryHex}05`,
          border: `1px dashed ${theme.border}`,
          borderRadius: theme.radius === 'full' ? '1rem' : theme.radius === 'sm' ? '0.375rem' : '0.5rem',
        }}
      >
        {adBody}
      </div>
    </div>
  );
};
