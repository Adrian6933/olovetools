import React, { useState, useEffect, useRef } from 'react';
import { ToolTheme } from '../../lib/themes';

export type AdSlotPosition = 'top' | 'mid' | 'side' | 'late' | 'anchor';
export type AdSlotSize = 'leaderboard' | 'rectangle' | 'mobile-banner';

interface AdSlotProps {
  theme: ToolTheme;
  position: AdSlotPosition;
  size?: AdSlotSize;
  lazyLoad?: boolean;
  /** When provided, renders the AdSense ins tag. Otherwise renders a labeled placeholder. */
  adSenseClient?: string;
  adSenseSlot?: string;
}

const SIZE_CLASSES: Record<AdSlotSize, string> = {
  leaderboard: 'h-24 md:h-20 max-w-[728px]',
  rectangle: 'h-[250px] max-w-[300px]',
  'mobile-banner': 'h-16 max-w-[320px]',
};

const POSITION_LABELS: Record<AdSlotPosition, string> = {
  top: 'Top Banner',
  mid: 'In-content',
  side: 'Sidebar',
  late: 'Bottom',
  anchor: 'Sticky',
};

export const AdSlot: React.FC<AdSlotProps> = ({
  theme,
  position,
  size = 'leaderboard',
  lazyLoad = true,
  adSenseClient,
  adSenseSlot,
}) => {
  const [inView, setInView] = useState(!lazyLoad);
  const ref = useRef<HTMLDivElement>(null);

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

  const isActive = adSenseClient && adSenseSlot && inView;

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
            className="adsbygoogle block w-full h-full"
            data-ad-client={adSenseClient}
            data-ad-slot={adSenseSlot}
            data-ad-format="auto"
            data-full-width-responsive="true"
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
