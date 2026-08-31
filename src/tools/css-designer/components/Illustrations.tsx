import React from 'react';

// ============================================================================
// Bespoke SVG artwork for CSS Designer, in the tool's violet palette.
// Inline and self-contained: no raster assets, no network requests, no emoji
// standing in for an illustration.
// ============================================================================

interface ArtProps {
  className?: string;
  /** Disables the SMIL animation for users who asked for reduced motion. */
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Hero: a pane of glass floating over a gradient, with the sliders that made
// it drifting on the left and the resulting rule printed underneath.
// ---------------------------------------------------------------------------
export const CssHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 400 300" className={className} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="cdBack" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#2e1065" />
        <stop offset="55%" stopColor="#7c3aed" />
        <stop offset="100%" stopColor="#db2777" />
      </linearGradient>
      <linearGradient id="cdPane" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.08" />
      </linearGradient>
      <linearGradient id="cdEdge" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
        <stop offset="60%" stopColor="#ffffff" stopOpacity="0.15" />
      </linearGradient>
      <clipPath id="cdCanvas">
        <rect x="10" y="14" width="380" height="230" rx="18" />
      </clipPath>
      <filter id="cdBlur" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="9" />
      </filter>
    </defs>

    <g clipPath="url(#cdCanvas)">
      <rect x="10" y="14" width="380" height="230" fill="#0b0716" />

      {/* The backdrop the glass will blur */}
      <g filter="url(#cdBlur)">
        <rect x="10" y="14" width="380" height="230" fill="url(#cdBack)" opacity="0.9" />
        <circle cx="120" cy="80" r="52" fill="#f0abfc" opacity="0.7">
          {animated && (
            <animate attributeName="cx" values="120;180;120" dur="11s" repeatCount="indefinite" />
          )}
        </circle>
        <circle cx="300" cy="190" r="66" fill="#22d3ee" opacity="0.45">
          {animated && (
            <animate attributeName="cy" values="190;140;190" dur="13s" repeatCount="indefinite" />
          )}
        </circle>
      </g>

      {/* Grid, so the surface reads as a design canvas */}
      <g stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1">
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
          <line key={`v${i}`} x1={10 + i * 48} y1="14" x2={10 + i * 48} y2="244" />
        ))}
        {[0, 1, 2, 3, 4].map(i => (
          <line key={`h${i}`} x1="10" y1={14 + i * 48} x2="390" y2={14 + i * 48} />
        ))}
      </g>

      {/* The glass pane itself */}
      <g>
        {animated && (
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 0 -6; 0 0"
            dur="9s"
            repeatCount="indefinite"
          />
        )}
        <rect x="148" y="66" width="196" height="128" rx="22" fill="url(#cdPane)" />
        <rect
          x="148"
          y="66"
          width="196"
          height="128"
          rx="22"
          fill="none"
          stroke="url(#cdEdge)"
          strokeWidth="1.5"
        />
        {/* Inner highlight — the detail that sells frosted glass */}
        <path d="M162 67 H330" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="170" y="92" width="88" height="9" rx="4.5" fill="#ffffff" fillOpacity="0.75" />
        <rect x="170" y="110" width="146" height="6" rx="3" fill="#ffffff" fillOpacity="0.32" />
        <rect x="170" y="124" width="112" height="6" rx="3" fill="#ffffff" fillOpacity="0.32" />
        <rect x="170" y="150" width="74" height="24" rx="12" fill="#ffffff" fillOpacity="0.9" />
      </g>

      {/* Control rack */}
      <g>
        <rect x="26" y="66" width="98" height="128" rx="14" fill="#0d0820" fillOpacity="0.85" stroke="#ffffff" strokeOpacity="0.08" />
        {[0, 1, 2, 3].map(i => {
          const y = 88 + i * 28;
          const from = [30, 62, 44, 70][i];
          const to = [58, 36, 72, 40][i];
          return (
            <g key={i}>
              <rect x="40" y={y} width="70" height="4" rx="2" fill="#ffffff" fillOpacity="0.12" />
              <rect x="40" y={y} width={from} height="4" rx="2" fill="#8b5cf6">
                {animated && (
                  <animate
                    attributeName="width"
                    values={`${from};${to};${from}`}
                    dur={`${6 + i}s`}
                    repeatCount="indefinite"
                  />
                )}
              </rect>
              <circle cx={40 + from} cy={y + 2} r="5" fill="#c4b5fd" stroke="#0b0716" strokeWidth="1.5">
                {animated && (
                  <animate
                    attributeName="cx"
                    values={`${40 + from};${40 + to};${40 + from}`}
                    dur={`${6 + i}s`}
                    repeatCount="indefinite"
                  />
                )}
              </circle>
            </g>
          );
        })}
      </g>
    </g>

    {/* The generated rule */}
    <g>
      <rect x="10" y="256" width="380" height="32" rx="10" fill="#08060f" stroke="#ffffff" strokeOpacity="0.07" />
      <rect x="24" y="268" width="52" height="7" rx="3.5" fill="#a78bfa" />
      <rect x="84" y="268" width="34" height="7" rx="3.5" fill="#f472b6" />
      <rect x="126" y="268" width="88" height="7" rx="3.5" fill="#67e8f9" />
      <rect x="222" y="268" width="46" height="7" rx="3.5" fill="#a78bfa" opacity="0.6" />
      <rect x="276" y="268" width="62" height="7" rx="3.5" fill="#f472b6" opacity="0.5" />
      <circle cx="366" cy="272" r="9" fill="#8b5cf6" fillOpacity="0.2" stroke="#a78bfa" strokeWidth="1.5" />
      <path d="M362 272 l3 3 l6 -6" stroke="#c4b5fd" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

// ---------------------------------------------------------------------------
// Feature icons — drawn for this tool, not borrowed from a generic icon set.
// ---------------------------------------------------------------------------

const iconProps = {
  viewBox: '0 0 32 32',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  role: 'img' as const,
  'aria-hidden': true,
};

/** Stacked shadow layers. */
export const IconLayers: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <rect x="9" y="5" width="18" height="12" rx="3" opacity="0.35" />
    <rect x="6.5" y="9" width="18" height="12" rx="3" opacity="0.65" />
    <rect x="4" y="13" width="18" height="12" rx="3" />
    <path d="M26 24.5h2M26 27.5h4" opacity="0.5" />
  </svg>
);

/** A colour wheel split by interpolation space. */
export const IconColorSpace: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <circle cx="16" cy="16" r="10.5" />
    <path d="M16 5.5v21" />
    <path d="M5.5 16c4-3.6 7.2 6 10.5 0s6.5-3.6 10.5 0" />
    <circle cx="10.5" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="21.5" cy="20" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);

/** Clipboard with a curly brace: paste an existing rule back in. */
export const IconParse: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <path d="M11 5.5H8.5A2.5 2.5 0 0 0 6 8v17a2.5 2.5 0 0 0 2.5 2.5h15A2.5 2.5 0 0 0 26 25V8a2.5 2.5 0 0 0-2.5-2.5H21" />
    <rect x="11" y="3" width="10" height="5" rx="1.8" />
    <path d="M14.5 13.5c-1.6 0-1.6 1.6-1.6 3s-1.4 1.5-1.4 1.5 1.4 0 1.4 1.5.1 3 1.6 3" />
    <path d="M17.5 13.5c1.6 0 1.6 1.6 1.6 3s1.4 1.5 1.4 1.5-1.4 0-1.4 1.5-.1 3-1.6 3" opacity="0.55" />
  </svg>
);

/** Rounded corner with a drag handle. */
export const IconCorner: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <path d="M5 27V14C5 9 9 5 14 5h13" />
    <path d="M5 27h4M27 5v4" opacity="0.45" />
    <circle cx="14" cy="14" r="2.4" fill="currentColor" stroke="none" />
    <path d="M14 14 5 5" opacity="0.35" strokeDasharray="2.5 2.5" />
    <circle cx="24" cy="24" r="3" />
  </svg>
);

/** Undo arc over a stack of states. */
export const IconHistory: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <path d="M6.5 13.5A10.5 10.5 0 1 1 5.6 20" />
    <path d="M4 6v7.5h7.5" />
    <path d="M16 11v5.5l3.8 2.2" />
  </svg>
);

/** Card leaving the frame: the export / handoff icon. */
export const IconHandoff: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <rect x="3.5" y="8" width="14" height="16" rx="3" />
    <path d="M8 14h5M8 18h3" opacity="0.55" />
    <path d="M20 16h8" />
    <path d="M24.5 12.5 28 16l-3.5 3.5" />
    <path d="M22 5.5h4.5A2 2 0 0 1 28.5 7.5V11" opacity="0.4" />
  </svg>
);

/** A browser window with a padlock: everything stays local. */
export const IconLocal: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <rect x="3.5" y="6" width="25" height="20" rx="3.5" />
    <path d="M3.5 11.5h25" />
    <circle cx="7.5" cy="8.7" r="0.9" fill="currentColor" stroke="none" />
    <rect x="12" y="17" width="8" height="6" rx="1.6" />
    <path d="M13.8 17v-1.8a2.2 2.2 0 0 1 4.4 0V17" />
  </svg>
);

/** Keyboard key: the shortcuts feature. */
export const IconKeys: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <rect x="2.5" y="8" width="27" height="16" rx="3" />
    <path d="M7 13h1.5M11.5 13H13M16 13h1.5M20.5 13H22M25 13h1.5" />
    <path d="M9.5 18.5h13" />
  </svg>
);

// ---------------------------------------------------------------------------
// "How it works" step art — four small scenes, one per step.
// ---------------------------------------------------------------------------

/** 1. Pick an effect: five panels, one lit. */
export const StepPick: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 80" className={className} role="img" aria-hidden="true">
    <rect x="4" y="10" width="112" height="60" rx="10" fill="currentColor" fillOpacity="0.06" />
    {[0, 1, 2, 3].map(i => (
      <rect
        key={i}
        x={12 + i * 25}
        y={20}
        width="20"
        height="40"
        rx="6"
        fill="currentColor"
        fillOpacity={i === 1 ? 0.9 : 0.16}
      />
    ))}
    <path d="M37 34 l4 4 l7 -8" stroke="#0b0716" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** 2. Tune: sliders and a numeric field. */
export const StepTune: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 80" className={className} role="img" aria-hidden="true">
    <rect x="4" y="10" width="112" height="60" rx="10" fill="currentColor" fillOpacity="0.06" />
    {[0, 1, 2].map(i => {
      const y = 24 + i * 16;
      const w = [56, 34, 72][i];
      return (
        <g key={i}>
          <rect x="14" y={y} width="80" height="4" rx="2" fill="currentColor" fillOpacity="0.2" />
          <rect x="14" y={y} width={w} height="4" rx="2" fill="currentColor" />
          <circle cx={14 + w} cy={y + 2} r="5" fill="currentColor" />
        </g>
      );
    })}
    <rect x="98" y="20" width="12" height="12" rx="3" fill="currentColor" fillOpacity="0.25" />
  </svg>
);

/** 3. Compare: split card, before and after. */
export const StepCompare: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 80" className={className} role="img" aria-hidden="true">
    <defs>
      <clipPath id="cdStepHalf">
        <rect x="60" y="14" width="46" height="52" />
      </clipPath>
    </defs>
    <rect x="4" y="10" width="112" height="60" rx="10" fill="currentColor" fillOpacity="0.06" />
    <rect x="14" y="14" width="92" height="52" rx="4" fill="currentColor" fillOpacity="0.14" />
    <g clipPath="url(#cdStepHalf)">
      <rect x="14" y="14" width="92" height="52" rx="14" fill="currentColor" fillOpacity="0.85" />
    </g>
    <path d="M60 8v64" stroke="currentColor" strokeWidth="2.2" strokeDasharray="4 4" />
    <circle cx="60" cy="40" r="7" fill="currentColor" />
    <path d="M57.5 40h5M60.5 37.5 63 40l-2.5 2.5M59.5 37.5 57 40l2.5 2.5" stroke="#0b0716" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  </svg>
);

/** 4. Copy or hand off. */
export const StepShip: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 80" className={className} role="img" aria-hidden="true">
    <rect x="4" y="10" width="112" height="60" rx="10" fill="currentColor" fillOpacity="0.06" />
    <rect x="14" y="20" width="52" height="40" rx="6" fill="currentColor" fillOpacity="0.18" />
    <rect x="22" y="30" width="30" height="4" rx="2" fill="currentColor" />
    <rect x="22" y="39" width="22" height="4" rx="2" fill="currentColor" fillOpacity="0.6" />
    <rect x="22" y="48" width="34" height="4" rx="2" fill="currentColor" fillOpacity="0.4" />
    <path d="M74 40h26" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M94 34l6 6-6 6" stroke="currentColor" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="72" y="18" width="14" height="10" rx="3" fill="currentColor" fillOpacity="0.3" />
    <rect x="72" y="52" width="14" height="10" rx="3" fill="currentColor" fillOpacity="0.3" />
  </svg>
);

export const STEP_ART = [StepPick, StepTune, StepCompare, StepShip];
