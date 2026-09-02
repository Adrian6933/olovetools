import React, { useEffect, useRef } from 'react';
import { ADS_ENABLED, AD_CLIENT, AD_SLOTS, useTextosAnuncio } from '../../config/ads';

interface AdBannerProps {
  /** Unique id, e.g. "adsense-kickbolt-top" — the trailing -top/-mid/-bottom segment picks the slot */
  id: string;
  /** Optional extra classes for spacing tweaks per tool */
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** Maps the trailing segment of the banner id to a slot in src/config/ads.ts */
function resolvePosition(id: string): keyof typeof AD_SLOTS {
  if (id.endsWith('-top')) return 'top';
  if (id.endsWith('-mid')) return 'mid';
  return 'late'; // -bottom and anything else
}

/**
 * Reusable horizontal AdSense slot, shared across every tool.
 *
 * NOTE: tools are hydrated React components, so literal `<!-- Bloque AdSense -->`
 * HTML comments do not survive render. We follow the project convention used in
 * Home.tsx: a labelled `#adsense-*` container that Google AdSense Auto-Ads or a
 * manual `<ins>` tag can target.
 */
export const AdBanner: React.FC<AdBannerProps> = ({ id, className = '' }) => {
  const textosAd = useTextosAnuncio();
  const insRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef(false);

  const slot = AD_SLOTS[resolvePosition(id)];
  // `!import.meta.env.DEV`, igual que AdSlot: AdSense no sirve anuncios en
  // localhost y hacer push desde ahí solo genera peticiones inválidas.
  const isActive = ADS_ENABLED && !!AD_CLIENT && !!slot && !import.meta.env.DEV;

  useEffect(() => {
    if (!isActive || !insRef.current || pushedRef.current) return;
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

  return (
    /* Bloque AdSense Horizontal */
    <div
      id={id}
      role="complementary"
      aria-label={textosAd.anuncio}
      className={`w-full max-w-5xl mx-auto my-6 ${className}`}
    >
      <div className="w-full min-h-[90px] flex flex-col items-center justify-center bg-white/[0.015] border border-dashed border-white/10 rounded-2xl px-4 py-3 text-center">
        {isActive ? (
          <ins
            ref={insRef}
            /* max-w-[970px] y alto libre: la unidad es responsive, el alto lo
               decide AdSense (90px, 250px...). Con h-[90px] fijo se recortaban
               los formatos altos, que son los que mejor pagan. */
            className="adsbygoogle block w-full max-w-[970px] min-h-[90px]"
            style={{ display: 'block' }}
            data-ad-client={AD_CLIENT}
            data-ad-slot={slot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        ) : (
          <>
            <span className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.3em] opacity-50">
              {textosAd.anuncio}
            </span>
            <div className="w-full max-w-[728px] h-[90px] mt-2 flex items-center justify-center" />
          </>
        )}
      </div>
    </div>
  );
};
