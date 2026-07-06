import React, { useEffect, useRef } from 'react';
import { ADS_ENABLED, AD_CLIENT, AD_SLOTS, RAIL_BLOCKLIST } from '../../config/ads';

interface AdRailProps {
  /** Tool slug of the current page, used to respect RAIL_BLOCKLIST */
  slug: string;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const Rail: React.FC<{ side: 'left' | 'right'; slot: string; active: boolean }> = ({ side, slot, active }) => {
  const insRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    if (!active || !insRef.current || pushedRef.current) return;
    if (insRef.current.getAttribute('data-ad-status')) return;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      pushedRef.current = true;
    } catch {
      // adsbygoogle.js aún no cargado o bloqueado por un ad-blocker; no es un error de la app.
    }
  }, [active]);

  // Hueco real: contenido max-w-7xl (1280px) + rail + margen.
  // 1560-1649px: skyscraper 120x600 · >=1650px: skyscraper ancho 160x600.
  return (
    <div
      aria-hidden="true"
      className={`hidden min-[1560px]:flex items-center justify-center fixed top-1/2 -translate-y-1/2 z-30 w-[120px] min-[1650px]:w-[160px] h-[600px] ${
        side === 'left' ? 'left-2' : 'right-2'
      }`}
      style={!active ? { border: '2px dashed #a855f7', borderRadius: '0.5rem', background: 'rgba(168,85,247,0.25)' } : undefined}
    >
      {active ? (
        <ins
          ref={insRef}
          className="adsbygoogle block w-full h-full"
          data-ad-client={AD_CLIENT}
          data-ad-slot={slot}
        />
      ) : (
        <span className="text-sm font-black uppercase tracking-widest text-white [writing-mode:vertical-rl] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          Ad · {side === 'left' ? 'Left Rail' : 'Right Rail'}
        </span>
      )}
    </div>
  );
};

/**
 * Fixed skyscraper rails (left + right), visible only when the viewport has
 * real room for them (120x600 desde 1560px, 160x600 desde 1650px; contenido
 * max-w-7xl = 1280px + rail + margen).
 * Renders nothing server-side impact-wise: CLS is 0 because the rails are
 * position:fixed and never affect document flow.
 */
export const AdRail: React.FC<AdRailProps> = ({ slug }) => {
  if (RAIL_BLOCKLIST.includes(slug)) return null;

  const activeLeft = ADS_ENABLED && !!AD_SLOTS.railLeft;
  const activeRight = ADS_ENABLED && !!AD_SLOTS.railRight;

  // En producción sin slots configurados no renderizamos nada; en dev se ve
  // el placeholder para verificar el diseño antes de activar AdSense.
  if (!import.meta.env.DEV && !activeLeft && !activeRight) return null;

  return (
    <>
      <Rail side="left" slot={AD_SLOTS.railLeft} active={activeLeft} />
      <Rail side="right" slot={AD_SLOTS.railRight} active={activeRight} />
    </>
  );
};
