import React, { useEffect, useRef, useState } from 'react';
import type { ToolTheme } from '../../lib/themes';
import { ADS_ENABLED, AD_CLIENT, AD_SLOTS, AD_INFEED_LAYOUT_KEY, useTextosAnuncio } from '../../config/ads';

export type AdSlotPosition = keyof typeof AD_SLOTS;
export type AdSlotSize = 'leaderboard' | 'rectangle' | 'mobile-banner' | 'skyscraper';

interface AdSlotProps {
  theme?: ToolTheme;
  position: AdSlotPosition;
  size?: AdSlotSize;
  lazyLoad?: boolean;
  adSenseClient?: string;
  adSenseSlot?: string;
}

declare global {
  interface Window { adsbygoogle?: unknown[]; }
}

const SIZE_CLASSES: Record<AdSlotSize, string> = {
  leaderboard: 'max-w-[970px] min-h-[100px] sm:min-h-[90px]',
  rectangle: 'max-w-[300px] min-h-[250px]',
  'mobile-banner': 'max-w-[728px] min-h-[50px]',
  skyscraper: 'max-w-[160px] min-h-[600px]',
};

export const AdSlot: React.FC<AdSlotProps> = ({
  position, size = 'leaderboard', lazyLoad = true, adSenseClient, adSenseSlot,
}) => {
  const texts = useTextosAnuncio();
  const containerRef = useRef<HTMLDivElement>(null);
  const insRef = useRef<HTMLModElement>(null);
  const requestedRef = useRef(false);
  const [nearViewport, setNearViewport] = useState(!lazyLoad);
  const [unfilled, setUnfilled] = useState(false);
  const client = adSenseClient ?? AD_CLIENT;
  const slot = adSenseSlot ?? AD_SLOTS[position];
  const configured = ADS_ENABLED && !!client && !!slot;
  const active = configured && !import.meta.env.DEV;

  useEffect(() => {
    if (!configured || nearViewport || !containerRef.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setNearViewport(true);
        observer.disconnect();
      }
    }, { rootMargin: '200px' });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [configured, nearViewport]);

  useEffect(() => {
    const element = insRef.current;
    if (!active || !nearViewport || !element) return;
    const request = () => {
      // A hidden parent or pending layout must not consume the request.
      if (requestedRef.current || element.getBoundingClientRect().width <= 0) return;
      if (element.hasAttribute('data-adsbygoogle-status') || element.hasAttribute('data-ad-status')) return;
      requestedRef.current = true;
      try {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
      } catch (error) {
        // Do not retry a possibly processed request or refresh ads.
        console.warn('[AdSense] Unable to request manual ad', position, error);
      }
    };
    const resizeObserver = new ResizeObserver(request);
    resizeObserver.observe(element);
    request();
    return () => resizeObserver.disconnect();
  }, [active, nearViewport, position]);

  useEffect(() => {
    const element = insRef.current;
    if (!active || !element) return;
    const updateStatus = () => setUnfilled(element.getAttribute('data-ad-status') === 'unfilled');
    const observer = new MutationObserver(updateStatus);
    observer.observe(element, { attributes: true, attributeFilter: ['data-ad-status'] });
    updateStatus();
    return () => observer.disconnect();
  }, [active, nearViewport]);

  if (!configured && !import.meta.env.DEV) return null;

  // Keep the observed container mounted BEFORE requesting the ad. Returning
  // null while waiting for intersection would prevent it from ever loading.
  return (
    <div ref={containerRef} hidden={unfilled} data-ad-placement={position}
      className="w-full mx-auto" role="complementary" aria-label={texts.anuncio}>
      <p className="mb-2 text-center text-[10px] uppercase tracking-widest text-slate-500">{texts.anuncio}</p>
      <div className={`w-full mx-auto ${SIZE_CLASSES[size]}`}>
        {active && nearViewport ? (
          <ins ref={insRef} className="adsbygoogle" style={{ display: 'block', width: '100%' }}
            data-ad-client={client} data-ad-slot={slot}
            {...(position === 'infeed'
              ? { 'data-ad-format': 'fluid', 'data-ad-layout-key': AD_INFEED_LAYOUT_KEY }
              : { 'data-ad-format': size === 'skyscraper' ? 'vertical' : size === 'rectangle' ? 'rectangle' : 'horizontal', 'data-full-width-responsive': 'true' })} />
        ) : import.meta.env.DEV ? (
          <div className={`w-full border border-dashed border-white/10 rounded-lg bg-white/[0.015] ${SIZE_CLASSES[size]}`} />
        ) : null}
      </div>
    </div>
  );
};
