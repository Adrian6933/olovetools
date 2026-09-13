import React from 'react';

// ============================================================================
// Bespoke SVG artwork for DiffSnap, in the tool's cyan palette.
// ----------------------------------------------------------------------------
// Inline and self-contained: no raster assets, no network requests, and no
// lucide icon or emoji standing in for an illustration. The hero animation is
// SMIL, which pauses with the page instead of burning a rAF loop, and is turned
// off entirely for anyone who asked for reduced motion.
// ============================================================================

interface ArtProps {
  className?: string;
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Hero: two revisions of the same file side by side, with the changed rows
// picked out and a comparison beam sweeping between them.
// ---------------------------------------------------------------------------

/** [x offset, width, state] — state 0 unchanged, 1 removed, 2 added. */
const LEFT_ROWS: [number, number, number][] = [
  [0, 74, 0],
  [10, 58, 0],
  [10, 66, 1],
  [20, 48, 1],
  [10, 62, 0],
  [0, 40, 0],
  [10, 70, 1],
  [10, 52, 0],
  [0, 56, 0],
];

const RIGHT_ROWS: [number, number, number][] = [
  [0, 74, 0],
  [10, 58, 0],
  [10, 78, 2],
  [20, 44, 2],
  [20, 60, 2],
  [10, 62, 0],
  [0, 40, 0],
  [10, 52, 0],
  [0, 56, 0],
];

export const DiffHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 400 300" className={`tool-hero-art ${className}`} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="dsGlow" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#083344" />
        <stop offset="55%" stopColor="#06b6d4" />
        <stop offset="100%" stopColor="#22d3ee" />
      </linearGradient>
      <linearGradient id="dsBeam" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#67e8f9" stopOpacity="0" />
        <stop offset="50%" stopColor="#67e8f9" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#67e8f9" stopOpacity="0" />
      </linearGradient>
      <clipPath id="dsFrame">
        <rect x="8" y="12" width="384" height="230" rx="18" />
      </clipPath>
    </defs>

    <g clipPath="url(#dsFrame)">
      <rect x="8" y="12" width="384" height="230" fill="#040e11" />
      <circle cx="200" cy="34" r="96" fill="url(#dsGlow)" opacity="0.16" />

      {/* Left pane — the original */}
      <rect x="20" y="26" width="168" height="202" rx="12" fill="#02090c" stroke="#ffffff" strokeOpacity="0.07" />
      <rect x="20" y="26" width="14" height="202" fill="#ffffff" fillOpacity="0.03" />
      {LEFT_ROWS.map(([indent, width, state], i) => {
        const y = 42 + i * 21;
        return (
          <g key={i}>
            {state === 1 && <rect x="20" y={y - 5} width="168" height="16" fill="#f43f5e" fillOpacity="0.16" />}
            {state === 1 && <rect x="20" y={y - 5} width="3" height="16" fill="#f43f5e" fillOpacity="0.9" />}
            <rect
              x={40 + indent}
              y={y}
              width={width}
              height="6"
              rx="3"
              fill={state === 1 ? '#fda4af' : '#67e8f9'}
              opacity={state === 1 ? 0.85 : 0.35}
            />
            <rect x={26} y={y} width="6" height="6" rx="2" fill="#ffffff" fillOpacity="0.12" />
          </g>
        );
      })}

      {/* Right pane — the revision */}
      <rect x="212" y="26" width="168" height="202" rx="12" fill="#02090c" stroke="#ffffff" strokeOpacity="0.07" />
      <rect x="212" y="26" width="14" height="202" fill="#ffffff" fillOpacity="0.03" />
      {RIGHT_ROWS.map(([indent, width, state], i) => {
        const y = 42 + i * 21;
        return (
          <g key={i}>
            {state === 2 && <rect x="212" y={y - 5} width="168" height="16" fill="#10b981" fillOpacity="0.16" />}
            {state === 2 && <rect x="212" y={y - 5} width="3" height="16" fill="#10b981" fillOpacity="0.9" />}
            <rect
              x={232 + indent}
              y={y}
              width={width}
              height="6"
              rx="3"
              fill={state === 2 ? '#6ee7b7' : '#67e8f9'}
              opacity={state === 2 ? 0.85 : 0.35}
            />
            <rect x={218} y={y} width="6" height="6" rx="2" fill="#ffffff" fillOpacity="0.12" />
          </g>
        );
      })}

      {/* The comparison beam running down the gutter between the panes */}
      <rect x="188" y="26" width="24" height="202" fill="#020a0d" />
      {animated && (
        <rect x="188" y="26" width="24" height="34" fill="url(#dsBeam)">
          <animate attributeName="y" values="16;208;16" dur="6s" repeatCount="indefinite" />
        </rect>
      )}
      <path
        d="M196 118 h8 M196 136 h8"
        stroke="#22d3ee"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.75"
      >
        {animated && <animate attributeName="opacity" values="0.3;0.95;0.3" dur="4s" repeatCount="indefinite" />}
      </path>
    </g>

    {/* Verdict strip */}
    <g>
      <rect x="8" y="254" width="384" height="34" rx="11" fill="#030f13" stroke="#ffffff" strokeOpacity="0.07" />
      <circle cx="30" cy="271" r="8.5" fill="#06b6d4" fillOpacity="0.18" stroke="#22d3ee" strokeWidth="1.6" />
      <path d="M26 268.5 h8 M26 273.5 h8" stroke="#a5f3fc" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="48" y="267.5" width="30" height="7" rx="3.5" fill="#6ee7b7" opacity="0.85" />
      <rect x="84" y="267.5" width="26" height="7" rx="3.5" fill="#fda4af" opacity="0.85" />
      <rect x="118" y="267.5" width="52" height="7" rx="3.5" fill="#ffffff" opacity="0.14" />
      <rect x="178" y="267.5" width="38" height="7" rx="3.5" fill="#ffffff" opacity="0.14" />
      <rect x="300" y="263" width="76" height="16" rx="8" fill="#06b6d4" fillOpacity="0.16" stroke="#06b6d4" strokeOpacity="0.4" />
      <rect x="311" y="268" width="54" height="6" rx="3" fill="#22d3ee" opacity="0.75" />
    </g>
  </svg>
);

// ---------------------------------------------------------------------------
// Feature icons — drawn for this tool rather than borrowed from an icon set.
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

/** Two paths meeting at a snake: the Myers walk. */
export const IconMyers: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <path d="M4 4 L12 12 L20 12 L28 20" />
    <path d="M4 4 L4 12 L12 12" opacity="0.45" />
    <path d="M28 28 L20 20 L20 12" opacity="0.45" />
    <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
    <circle cx="20" cy="12" r="2.2" fill="currentColor" stroke="none" />
  </svg>
);

/** A line with one word boxed out: the intra-line highlight. */
export const IconWordLevel: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <path d="M4 9h9" />
    <rect x="15" y="6" width="10" height="6.5" rx="2" />
    <path d="M4 16h6" />
    <path d="M13 16h14" opacity="0.5" />
    <rect x="4" y="20" width="9" height="6.5" rx="2" />
    <path d="M16 23h11" opacity="0.5" />
  </svg>
);

/** A ruler ignoring the gaps: the whitespace options. */
export const IconWhitespace: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <path d="M4 8h5M13 8h6M23 8h5" />
    <path d="M4 16h24" opacity="0.35" />
    <path d="M4 24h7M15 24h4M23 24h5" />
    <circle cx="11" cy="16" r="1.7" fill="currentColor" stroke="none" />
    <circle cx="21" cy="16" r="1.7" fill="currentColor" stroke="none" />
  </svg>
);

/** A folded stack: collapsed context. */
export const IconFold: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <path d="M4 6h24" />
    <path d="M4 11h16" opacity="0.55" />
    <path d="M7 16h18" strokeDasharray="3 3" />
    <path d="M4 21h16" opacity="0.55" />
    <path d="M4 26h24" />
    <path d="M25 13.5l3 2.5-3 2.5" opacity="0.7" />
  </svg>
);

/** A pin joining two rows: the manual alignment anchor. */
export const IconAnchor: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <rect x="3" y="6" width="10" height="7" rx="2" />
    <rect x="19" y="19" width="10" height="7" rx="2" />
    <path d="M13 9.5h6a3 3 0 0 1 3 3v6.5" />
    <circle cx="16" cy="16" r="2.4" fill="currentColor" stroke="none" opacity="0.8" />
  </svg>
);

/** A window with a padlock: everything stays on the device. */
export const IconLocal: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <rect x="3.5" y="6" width="25" height="20" rx="3.5" />
    <path d="M3.5 11.5h25" />
    <circle cx="7.5" cy="8.7" r="0.9" fill="currentColor" stroke="none" />
    <rect x="12" y="17" width="8" height="6" rx="1.6" />
    <path d="M13.8 17v-1.8a2.2 2.2 0 0 1 4.4 0V17" />
  </svg>
);

/** Braces with colour bands: syntax highlighting. */
export const IconSyntax: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <path d="M11 5c-3 0-3 4-3 7s-3 4-3 4 3 1 3 4 0 7 3 7" />
    <path d="M21 5c3 0 3 4 3 7s3 4 3 4-3 1-3 4 0 7-3 7" opacity="0.5" />
    <path d="M13 13h6" />
    <path d="M13 19h4" opacity="0.6" />
  </svg>
);

/** A page leaving a frame with a plus/minus: the patch export. */
export const IconPatch: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <path d="M17 4H7a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h11" />
    <path d="M9 11h7M9 16h5" opacity="0.6" />
    <path d="M21 16h8" />
    <path d="M25.5 12.5 29 16l-3.5 3.5" />
    <path d="M9 21h3" opacity="0.6" />
  </svg>
);

/** Threads splitting around a core: the worker. */
export const IconWorker: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <path d="M4 8h9" />
    <path d="M4 16h5" />
    <path d="M4 24h9" />
    <path d="M13 8c8 0 6 8 10 8" />
    <path d="M13 24c8 0 6-8 10-8" />
    <circle cx="25" cy="16" r="3.2" />
  </svg>
);

/** Card leaving a frame: the handoff to another tool. */
export const IconHandoff: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <rect x="3.5" y="8" width="14" height="16" rx="3" />
    <path d="M8 14h5M8 18h3" opacity="0.55" />
    <path d="M20 16h8" />
    <path d="M24.5 12.5 28 16l-3.5 3.5" />
    <path d="M22 5.5h4.5A2 2 0 0 1 28.5 7.5V11" opacity="0.4" />
  </svg>
);

// ---------------------------------------------------------------------------
// "How it works" step art — four small scenes.
// ---------------------------------------------------------------------------

/** 1. Two texts arrive: paste, drop, or handed over by another tool. */
export const StepLoad: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 80" className={className} role="img" aria-hidden="true">
    <rect x="4" y="10" width="112" height="60" rx="10" fill="currentColor" fillOpacity="0.06" />
    <rect x="14" y="20" width="40" height="40" rx="6" fill="currentColor" fillOpacity="0.16" />
    <rect x="21" y="28" width="24" height="4" rx="2" fill="currentColor" />
    <rect x="21" y="36" width="18" height="4" rx="2" fill="currentColor" fillOpacity="0.55" />
    <rect x="21" y="44" width="26" height="4" rx="2" fill="currentColor" fillOpacity="0.4" />
    <rect x="66" y="20" width="40" height="40" rx="6" fill="currentColor" fillOpacity="0.16" />
    <rect x="73" y="28" width="24" height="4" rx="2" fill="currentColor" />
    <rect x="73" y="36" width="22" height="4" rx="2" fill="currentColor" fillOpacity="0.55" />
    <rect x="73" y="44" width="14" height="4" rx="2" fill="currentColor" fillOpacity="0.4" />
    <path d="M60 26v28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 4" opacity="0.5" />
  </svg>
);

/** 2. Choose how strict the comparison is, then press the button. */
export const StepTune: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 80" className={className} role="img" aria-hidden="true">
    <rect x="4" y="10" width="112" height="60" rx="10" fill="currentColor" fillOpacity="0.06" />
    <path d="M18 24h84" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
    <circle cx="42" cy="24" r="6" fill="currentColor" fillOpacity="0.85" />
    <path d="M18 38h84" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
    <circle cx="78" cy="38" r="6" fill="currentColor" fillOpacity="0.6" />
    <rect x="36" y="50" width="48" height="14" rx="7" fill="currentColor" fillOpacity="0.3" />
    <path d="M54 57h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M64 53.5l4 3.5-4 3.5" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** 3. Read the result: aligned rows with the changed words picked out. */
export const StepRead: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 80" className={className} role="img" aria-hidden="true">
    <rect x="4" y="10" width="112" height="60" rx="10" fill="currentColor" fillOpacity="0.06" />
    <path d="M60 12v56" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
    {[0, 1, 2, 3].map(i => (
      <g key={i}>
        <rect x="12" y={20 + i * 12} width={i === 1 ? 30 : 40} height="5" rx="2.5" fill="currentColor" fillOpacity={i === 1 ? 0.9 : 0.3} />
        {i === 1 && <rect x="45" y={20 + i * 12} width="10" height="5" rx="2.5" fill="currentColor" fillOpacity="0.5" />}
        <rect x="66" y={20 + i * 12} width={i === 1 ? 36 : 40} height="5" rx="2.5" fill="currentColor" fillOpacity={i === 1 ? 0.9 : 0.3} />
      </g>
    ))}
    <rect x="8" y="30" width="3" height="7" rx="1.5" fill="currentColor" />
    <rect x="62" y="30" width="3" height="7" rx="1.5" fill="currentColor" />
  </svg>
);

/** 4. Take it away: patch, report, or straight into the next tool. */
export const StepShip: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 80" className={className} role="img" aria-hidden="true">
    <rect x="4" y="10" width="112" height="60" rx="10" fill="currentColor" fillOpacity="0.06" />
    <rect x="14" y="22" width="42" height="36" rx="6" fill="currentColor" fillOpacity="0.18" />
    <path d="M22 32h10M22 40h16M22 48h8" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity="0.7" />
    <path d="M64 40h26" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M84 34l6 6-6 6" stroke="currentColor" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="94" y="18" width="14" height="10" rx="3" fill="currentColor" fillOpacity="0.35" />
    <rect x="94" y="35" width="14" height="10" rx="3" fill="currentColor" fillOpacity="0.55" />
    <rect x="94" y="52" width="14" height="10" rx="3" fill="currentColor" fillOpacity="0.35" />
  </svg>
);

export const STEP_ART = [StepLoad, StepTune, StepRead, StepShip];
