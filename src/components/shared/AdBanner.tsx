import React from 'react';

interface AdBannerProps {
  /** Unique id so AdSense Auto-Ads / manual slots can target it (e.g. "adsense-kickbolt-top") */
  id: string;
  /** Optional extra classes for spacing tweaks per tool */
  className?: string;
}

/**
 * Reusable horizontal AdSense slot, shared across every tool.
 *
 * NOTE: tools are hydrated React components, so literal `<!-- Bloque AdSense -->`
 * HTML comments do not survive render. We follow the project convention used in
 * Home.tsx: a labelled `#adsense-*` container that Google AdSense Auto-Ads or a
 * manual `<ins>` tag can target. The JSX comment below documents intent.
 */
export const AdBanner: React.FC<AdBannerProps> = ({ id, className = '' }) => (
  /* Bloque AdSense Horizontal */
  <div
    id={id}
    role="complementary"
    aria-label="Advertisement"
    className={`w-full max-w-5xl mx-auto my-6 ${className}`}
  >
    <div className="w-full min-h-[90px] flex flex-col items-center justify-center bg-white/[0.015] border border-dashed border-white/10 rounded-2xl px-4 py-3 text-center">
      <span className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.3em] opacity-50">
        Advertisement
      </span>
      <div className="w-full max-w-[728px] h-[90px] mt-2 flex items-center justify-center">
        {/* AdSense ins tag / Auto-Ads inject here */}
      </div>
    </div>
  </div>
);
