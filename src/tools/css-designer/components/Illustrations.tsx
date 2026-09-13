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
// Hero: a compact, readable story of the tool — controls become a preview,
// then become a copy-ready CSS rule. Each stage has its own space.
// ---------------------------------------------------------------------------
export const CssHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 420 250" className={className} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="cdBack" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#170c30" /><stop offset="1" stopColor="#31105a" /></linearGradient>
      <linearGradient id="cdPreview" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#c084fc" /><stop offset="1" stopColor="#22d3ee" /></linearGradient>
      <filter id="cdGlow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="7" /></filter>
    </defs>
    <rect x="8" y="8" width="404" height="234" rx="22" fill="url(#cdBack)" stroke="#ffffff" strokeOpacity=".1" />
    <path d="M140 36v178M280 36v178" stroke="#ffffff" strokeOpacity=".08" strokeDasharray="3 5" />
    <g fill="#c4b5fd" fontFamily="system-ui, sans-serif" fontSize="10" fontWeight="700" letterSpacing="1.2">
      <text x="28" y="31">INPUT</text><text x="168" y="31">PREVIEW</text><text x="308" y="31">CSS READY</text>
    </g>
    <g>
      <rect x="24" y="49" width="100" height="126" rx="13" fill="#090611" stroke="#a78bfa" strokeOpacity=".28" />
      <path d="M38 69h70M38 99h70M38 129h70" stroke="#ffffff" strokeOpacity=".14" strokeWidth="5" strokeLinecap="round" />
      {[{ y:69, x:78 }, { y:99, x:58 }, { y:129, x:92 }].map((item, i) => <g key={i}>
        <path d={`M38 ${item.y}h${item.x - 38}`} stroke="#a78bfa" strokeWidth="5" strokeLinecap="round">
          {animated && <animate attributeName="d" values={`M38 ${item.y}h${item.x - 38};M38 ${item.y}h${[92, 74, 68][i] - 38};M38 ${item.y}h${item.x - 38}`} dur="6s" repeatCount="indefinite" />}
        </path>
        <circle cx={item.x} cy={item.y} r="5" fill="#f0abfc" />
      </g>)}
      <rect x="38" y="151" width="50" height="10" rx="5" fill="#7c3aed" fillOpacity=".8" />
    </g>
    <g>
      {animated && <animate attributeName="opacity" values=".55;1;.55" dur="6s" repeatCount="indefinite" />}
      <circle cx="155" cy="112" r="23" fill="#a855f7" fillOpacity=".28" filter="url(#cdGlow)" />
      <path d="M146 112h18m-7-7 7 7-7 7" stroke="#e9d5ff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <g>
      <rect x="171" y="49" width="90" height="126" rx="13" fill="#ffffff" fillOpacity=".08" stroke="#ffffff" strokeOpacity=".24" />
      <rect x="185" y="65" width="62" height="55" rx="10" fill="url(#cdPreview)" fillOpacity=".8" />
      <rect x="185" y="132" width="40" height="8" rx="4" fill="#ffffff" fillOpacity=".55" />
      <rect x="185" y="148" width="57" height="6" rx="3" fill="#ffffff" fillOpacity=".2" />
      <rect x="185" y="160" width="46" height="6" rx="3" fill="#ffffff" fillOpacity=".2" />
    </g>
    <g>
      {animated && <animateTransform attributeName="transform" type="translate" values="0 0;4 0;0 0" dur="6s" repeatCount="indefinite" />}
      <circle cx="276" cy="112" r="23" fill="#22d3ee" fillOpacity=".2" filter="url(#cdGlow)" />
      <path d="M267 112h18m-7-7 7 7-7 7" stroke="#a5f3fc" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <g>
      <rect x="292" y="49" width="104" height="126" rx="13" fill="#090611" stroke="#22d3ee" strokeOpacity=".28" />
      <text x="305" y="69" fill="#67e8f9" fontFamily="monospace" fontSize="9">.card {'{'}</text>
      <rect x="305" y="82" width="66" height="6" rx="3" fill="#c084fc" />
      <rect x="305" y="96" width="52" height="6" rx="3" fill="#f472b6" />
      <rect x="305" y="110" width="73" height="6" rx="3" fill="#67e8f9" />
      <text x="305" y="139" fill="#67e8f9" fontFamily="monospace" fontSize="9">{'}'}</text>
      <circle cx="371" cy="153" r="10" fill="#22c55e" fillOpacity=".22" stroke="#86efac" strokeOpacity=".7" />
      <path d="m366 153 3 3 6-7" stroke="#bbf7d0" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <g fontFamily="system-ui, sans-serif" fontSize="9" fontWeight="600" fill="#ffffff" fillOpacity=".55">
      <text x="43" y="202">Tune values</text><text x="190" y="202">See it live</text><text x="316" y="202">Copy rule</text>
    </g>
    <rect x="24" y="218" width="372" height="8" rx="4" fill="#ffffff" fillOpacity=".06" />
    {animated && <rect x="24" y="218" width="0" height="8" rx="4" fill="#a78bfa"><animate attributeName="width" values="0;372;0" dur="6s" repeatCount="indefinite" /></rect>}
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
