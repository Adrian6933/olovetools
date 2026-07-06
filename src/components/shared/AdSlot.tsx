import React, { useState, useEffect, useRef } from 'react';
import { ToolTheme } from '../../lib/themes';
import { ADS_ENABLED, AD_CLIENT, AD_SLOTS } from '../../config/ads';

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

const SIZE_CLASSES: Record<AdSlotSize, string> = {
  leaderboard: 'h-24 md:h-20 max-w-[728px]',
  rectangle: 'h-[250px] max-w-[300px]',
  'mobile-banner': 'h-16 max-w-[320px]',
  skyscraper: 'w-[160px] h-[600px]',
};

const POSITION_LABELS: Record<AdSlotPosition, string> = {
  top: 'Top Banner',
  mid: 'In-content',
  side: 'Sidebar',
  late: 'Bottom',
  anchor: 'Sticky',
  content: 'In-content',
  infeed: 'In-feed',
  railLeft: 'Left Rail',
  railRight: 'Right Rail',
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

export const AdSlot: React.FC<AdSlotProps> = ({
  theme = NEUTRAL_THEME,
  position,
  size = 'leaderboard',
  lazyLoad = true,
  adSenseClient,
  adSenseSlot,
}) => {
  const [inView, setInView] = useState(!lazyLoad);
  const ref = useRef<HTMLDivElement>(null);
  const insRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef(false);

  const client = adSenseClient ?? AD_CLIENT;
  const slot = adSenseSlot ?? (position in AD_SLOTS ? AD_SLOTS[position as keyof typeof AD_SLOTS] : '');

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

  const isActive = ADS_ENABLED && !!client && !!slot && inView;

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

  return (
    <div
      ref={ref}
      className={`flex flex-col items-center justify-center mx-auto ${SIZE_CLASSES[size]} w-full`}
      role="complementary"
      aria-label={`Advertisement slot: ${POSITION_LABELS[position]}`}
    >
      <div
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
        style={{
          backgroundColor: `${theme.primaryHex}05`,
          border: `1px dashed ${theme.border}`,
          borderRadius: theme.radius === 'full' ? '1rem' : theme.radius === 'sm' ? '0.375rem' : '0.5rem',
        }}
      >
        {isActive ? (
          <ins
            ref={insRef}
            className="adsbygoogle block w-full h-full"
            data-ad-client={client}
            data-ad-slot={slot}
            {...(size === 'skyscraper' || size === 'rectangle'
              ? {}
              : { 'data-ad-format': 'auto', 'data-full-width-responsive': 'true' })}
          />
        ) : (
          <div className="text-center space-y-1">
            <p
              className="text-[10px] font-black uppercase tracking-[0.25em]"
              style={{ color: theme.textMuted }}
            >
              Advertisement
            </p>
            <p
              className="text-[9px] font-bold uppercase tracking-widest opacity-60"
              style={{ color: theme.textMuted }}
            >
              {POSITION_LABELS[position]} · {size}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
