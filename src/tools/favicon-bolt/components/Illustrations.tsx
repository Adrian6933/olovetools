import React from 'react';

// ============================================================================
// Bespoke SVG artwork for FaviconBolt.
// Inline, self-contained, themed with the tool's blue/indigo palette. No
// raster assets and no network requests, so the "everything stays local"
// claim on the page stays true down to the illustrations.
// ============================================================================

interface ArtProps {
  className?: string;
  /** Turns off the SMIL animation for prefers-reduced-motion. */
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Hero: a browser window whose tab icon is being minted, with the size ladder
// (16 / 32 / 180 / 512) fanning out of it.
// ---------------------------------------------------------------------------
export const FaviconHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 400 300" className={`tool-hero-art ${className}`} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="fbGlass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#111a33" />
        <stop offset="100%" stopColor="#070c1c" />
      </linearGradient>
      <linearGradient id="fbMark" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="#4338ca" />
      </linearGradient>
      <linearGradient id="fbBeam" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
        <stop offset="50%" stopColor="#93c5fd" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
      </linearGradient>
      <filter id="fbSoft" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
    </defs>

    {/* Browser chrome */}
    <rect x="14" y="24" width="372" height="200" rx="18" fill="url(#fbGlass)" stroke="rgba(147,197,253,0.18)" strokeWidth="1.5" />
    <path d="M14 62h372" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" />
    <circle cx="38" cy="43" r="4.5" fill="#334155" />
    <circle cx="54" cy="43" r="4.5" fill="#334155" />
    <circle cx="70" cy="43" r="4.5" fill="#334155" />

    {/* Active tab with the generated mark */}
    <rect x="92" y="30" width="150" height="26" rx="8" fill="rgba(59,130,246,0.14)" stroke="rgba(96,165,250,0.35)" strokeWidth="1" />
    <path d="M104 36.4h9.6a3 3 0 0 1 3 3V49a3 3 0 0 1-3 3H104a3 3 0 0 1-3-3v-9.6a3 3 0 0 1 3-3Z" fill="url(#fbMark)" />
    <path d="m108.8 40.2 1.5 3.2 3.4.5-2.5 2.4.6 3.4-3-1.6-3 1.6.6-3.4-2.5-2.4 3.4-.5Z" fill="#eff6ff" />
    <rect x="124" y="39" width="86" height="5" rx="2.5" fill="rgba(226,232,240,0.5)" />
    <rect x="124" y="47" width="52" height="4" rx="2" fill="rgba(148,163,184,0.28)" />

    {/* Page body */}
    <rect x="38" y="86" width="120" height="9" rx="4.5" fill="rgba(148,163,184,0.25)" />
    <rect x="38" y="104" width="196" height="7" rx="3.5" fill="rgba(148,163,184,0.14)" />
    <rect x="38" y="118" width="160" height="7" rx="3.5" fill="rgba(148,163,184,0.14)" />

    {/* Scan beam across the artboard */}
    <g opacity="0.85">
      <rect x="240" y="82" width="120" height="120" rx="26" fill="url(#fbMark)" opacity="0.16" />
      <path
        d="M300 96c34.2 0 44 9.8 44 44s-9.8 44-44 44-44-9.8-44-44 9.8-44 44-44Z"
        fill="url(#fbMark)"
      />
      <path d="m300 112 7.6 16.4 17.4 2.6-12.8 12.2 3.2 17.6L300 152.6 284.6 161l3.2-17.6-12.8-12.2 17.4-2.6Z" fill="#eff6ff" />
      {animated && (
        <rect x="256" y="82" width="88" height="3" fill="url(#fbBeam)" filter="url(#fbSoft)">
          <animate attributeName="y" values="86;196;86" dur="6s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" />
        </rect>
      )}
    </g>

    {/* Size ladder */}
    <g>
      {[
        { x: 36, s: 16, label: '16' },
        { x: 84, s: 22, label: '32' },
        { x: 142, s: 30, label: '180' },
        { x: 210, s: 40, label: '512' },
      ].map((item, i) => (
        <g key={item.label}>
          <rect
            x={item.x}
            y={264 - item.s}
            width={item.s}
            height={item.s}
            rx={item.s * 0.24}
            fill="url(#fbMark)"
            opacity={0.55 + i * 0.12}
          >
            {animated && (
              <animate
                attributeName="opacity"
                values={`${0.4 + i * 0.1};1;${0.4 + i * 0.1}`}
                dur="3.4s"
                begin={`${i * 0.35}s`}
                repeatCount="indefinite"
              />
            )}
          </rect>
          <text
            x={item.x + item.s / 2}
            y="280"
            textAnchor="middle"
            fontSize="9"
            fontWeight="700"
            fill="rgba(148,163,184,0.75)"
          >
            {item.label}
          </text>
        </g>
      ))}
      <path d="M266 258h96" stroke="rgba(96,165,250,0.25)" strokeWidth="1.5" strokeDasharray="4 5" />
      <text x="314" y="280" textAnchor="middle" fontSize="9" fontWeight="700" fill="rgba(96,165,250,0.7)">
        .ico · .svg · .png
      </text>
    </g>
  </svg>
);

// ---------------------------------------------------------------------------
// Feature icons — drawn for this tool, not borrowed from a generic set.
// ---------------------------------------------------------------------------
const iconBase = 'w-7 h-7';

/** Stacked frames of decreasing size: the multi-resolution ICO. */
export const IconMultiRes: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2.5" y="2.5" width="13" height="13" rx="2.6" />
    <rect x="8" y="8" width="10" height="10" rx="2.2" opacity="0.75" />
    <rect x="13.5" y="13.5" width="8" height="8" rx="1.8" opacity="0.5" />
  </svg>
);

/** A glyph inside a superellipse: the shape engine. */
export const IconSquircle: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2.6c7.1 0 9.4 2.3 9.4 9.4s-2.3 9.4-9.4 9.4S2.6 19.1 2.6 12 4.9 2.6 12 2.6Z" />
    <path d="m12 7.6 1.5 3.2 3.4.5-2.5 2.4.6 3.5-3-1.7-3 1.7.6-3.5-2.5-2.4 3.4-.5Z" fill="currentColor" stroke="none" opacity="0.85" />
  </svg>
);

/** A phone with a home-screen tile: the Apple / Android exports. */
export const IconTouchIcon: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="5.5" y="2.2" width="13" height="19.6" rx="3" />
    <rect x="8.6" y="7" width="6.8" height="6.8" rx="2" fill="currentColor" stroke="none" opacity="0.8" />
    <path d="M10.4 17.6h3.2" />
  </svg>
);

/** Angle brackets over a link: the copy-paste head snippet. */
export const IconSnippet: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m7.6 8.4-4 3.6 4 3.6M16.4 8.4l4 3.6-4 3.6" />
    <path d="m13.6 5.4-3.2 13.2" />
  </svg>
);

/** A padlock built out of a browser tab: nothing is uploaded. */
export const IconLocalOnly: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3.5" y="10.5" width="17" height="10.5" rx="2.6" />
    <path d="M7.8 10.5V7.6a4.2 4.2 0 0 1 8.4 0v2.9" />
    <path d="M12 14.4v2.8" />
  </svg>
);

/** Two panels and an arrow: the cross-tool handoff. */
export const IconHandoff: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2.5" y="6" width="7.5" height="12" rx="1.8" />
    <rect x="14" y="6" width="7.5" height="12" rx="1.8" />
    <path d="M10.8 12h2.4M12.2 10.4 13.8 12l-1.6 1.6" />
  </svg>
);

// ---------------------------------------------------------------------------
// "How it works" step artwork
// ---------------------------------------------------------------------------
export const StepSource: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="8" y="12" width="46" height="66" rx="10" stroke="currentColor" strokeWidth="2" strokeDasharray="7 6" opacity="0.5" />
    <path d="M31 58V32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="m23 40 8-8 8 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="66" y="12" width="46" height="66" rx="10" stroke="currentColor" strokeWidth="2" opacity="0.5" />
    <text x="89" y="56" textAnchor="middle" fontSize="30" fill="currentColor" opacity="0.9">A</text>
  </svg>
);

export const StepStyle: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <path d="M60 14c22.6 0 31 8.4 31 31s-8.4 31-31 31-31-8.4-31-31 8.4-31 31-31Z" stroke="currentColor" strokeWidth="2.4" />
    <path d="m60 30 4.8 10.2 11 1.6-8 7.7 1.9 11.1L60 55.3 50.3 60.6l1.9-11.1-8-7.7 11-1.6Z" fill="currentColor" opacity="0.85" />
    <path d="M14 45h9M97 45h9M60 8v-6M60 82v6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.45" />
  </svg>
);

export const StepPreview: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="10" y="14" width="100" height="62" rx="9" stroke="currentColor" strokeWidth="2" opacity="0.5" />
    <path d="M10 30h100" stroke="currentColor" strokeWidth="2" opacity="0.35" />
    <rect x="18" y="19" width="34" height="7" rx="3.5" fill="currentColor" opacity="0.5" />
    <rect x="18" y="40" width="20" height="20" rx="5" fill="currentColor" opacity="0.85" />
    <rect x="46" y="44" width="12" height="12" rx="3" fill="currentColor" opacity="0.6" />
    <rect x="66" y="47" width="7" height="7" rx="2" fill="currentColor" opacity="0.45" />
    <rect x="80" y="48" width="5" height="5" rx="1.5" fill="currentColor" opacity="0.35" />
  </svg>
);

export const StepShip: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="16" y="10" width="88" height="44" rx="8" stroke="currentColor" strokeWidth="2" opacity="0.5" />
    <path d="M28 24h30M28 34h44M28 44h22" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity="0.7" />
    <path d="M60 60v18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="m50 70 10 10 10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ---------------------------------------------------------------------------
// Checkerboard used behind transparent previews.
// ---------------------------------------------------------------------------
export const CheckerTile: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={className} aria-hidden="true">
    <defs>
      <pattern id="fbTile" width="16" height="16" patternUnits="userSpaceOnUse">
        <rect width="16" height="16" fill="#0b1120" />
        <rect width="8" height="8" fill="#141d33" />
        <rect x="8" y="8" width="8" height="8" fill="#141d33" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#fbTile)" />
  </svg>
);
