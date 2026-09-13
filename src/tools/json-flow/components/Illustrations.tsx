import React from 'react';

// ============================================================================
// Bespoke SVG artwork for JSONFlow, in the tool's emerald palette.
// Inline and self-contained: no raster assets, no network requests, and no
// emoji standing in for an illustration.
// ============================================================================

interface ArtProps {
  className?: string;
  /** Turns off the SMIL animation for anyone who asked for reduced motion. */
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Hero: a raw payload on the left resolving into a folded tree on the right,
// with the validation pass sweeping across it.
// ---------------------------------------------------------------------------
export const JsonHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 400 300" className={`tool-hero-art ${className}`} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="jfGlow" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#064e3b" />
        <stop offset="55%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#22d3ee" />
      </linearGradient>
      <linearGradient id="jfScan" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#34d399" stopOpacity="0" />
        <stop offset="50%" stopColor="#34d399" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
      </linearGradient>
      <clipPath id="jfFrame">
        <rect x="8" y="12" width="384" height="230" rx="18" />
      </clipPath>
      <clipPath id="jfRawPane">
        <rect x="20" y="26" width="160" height="202" rx="12" />
      </clipPath>
    </defs>

    <g clipPath="url(#jfFrame)">
      <rect x="8" y="12" width="384" height="230" fill="#05100c" />
      <circle cx="330" cy="40" r="90" fill="url(#jfGlow)" opacity="0.16" />

      {/* Left pane: the raw text, with the scanning validation pass */}
      <rect x="20" y="26" width="160" height="202" rx="12" fill="#03100b" stroke="#ffffff" strokeOpacity="0.07" />
      <g clipPath="url(#jfRawPane)">
        {[
          [34, 26, '#5eead4'],
          [46, 62, '#a7f3d0'],
          [46, 44, '#67e8f9'],
          [46, 70, '#a7f3d0'],
          [58, 52, '#67e8f9'],
          [58, 38, '#a7f3d0'],
          [46, 58, '#5eead4'],
          [34, 30, '#5eead4'],
          [46, 66, '#a7f3d0'],
          [58, 42, '#67e8f9'],
          [46, 48, '#a7f3d0'],
          [34, 22, '#5eead4'],
        ].map(([x, w, fill], i) => (
          <rect
            key={i}
            x={x as number}
            y={40 + i * 15}
            width={w as number}
            height="5"
            rx="2.5"
            fill={fill as string}
            opacity={0.65}
          />
        ))}
        {/* Gutter */}
        <rect x="20" y="26" width="12" height="202" fill="#ffffff" fillOpacity="0.03" />
        {animated && (
          <rect x="20" y="26" width="160" height="26" fill="url(#jfScan)">
            <animate attributeName="y" values="10;218;10" dur="7s" repeatCount="indefinite" />
          </rect>
        )}
      </g>

      {/* Right pane: the folded tree */}
      <rect x="196" y="26" width="180" height="202" rx="12" fill="#03100b" stroke="#ffffff" strokeOpacity="0.07" />
      {[
        { indent: 0, w: 78, caret: true, open: true },
        { indent: 1, w: 62, caret: true, open: true },
        { indent: 2, w: 52, caret: false, open: false },
        { indent: 2, w: 68, caret: false, open: false },
        { indent: 1, w: 58, caret: true, open: false },
        { indent: 1, w: 46, caret: false, open: false },
        { indent: 0, w: 70, caret: true, open: true },
        { indent: 1, w: 54, caret: false, open: false },
      ].map((row, i) => {
        const x = 210 + row.indent * 14;
        const y = 44 + i * 22;
        return (
          <g key={i}>
            {row.indent > 0 && (
              <path
                d={`M${210 + (row.indent - 1) * 14 + 3} ${y - 14} V ${y + 3} H ${x - 2}`}
                stroke="#34d399"
                strokeOpacity="0.22"
                strokeWidth="1"
                fill="none"
              />
            )}
            {row.caret && (
              <path
                d={row.open ? `M${x - 1} ${y + 1} l4 5 l4 -5` : `M${x} ${y} l5 4 l-5 4`}
                stroke="#34d399"
                strokeWidth="1.6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            <rect x={x + 12} y={y} width={row.w} height="6" rx="3" fill="#a7f3d0" opacity={row.caret ? 0.85 : 0.45} />
            <rect x={x + 18 + row.w} y={y} width={row.caret ? 16 : 30} height="6" rx="3" fill="#22d3ee" opacity="0.4" />
          </g>
        );
      })}

      {/* The brace that ties the two panes together */}
      <path
        d="M188 60 c-6 0 -6 30 -12 30 c6 0 6 30 12 30"
        stroke="#10b981"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
        opacity="0.7"
      >
        {animated && <animate attributeName="opacity" values="0.35;0.9;0.35" dur="5s" repeatCount="indefinite" />}
      </path>
    </g>

    {/* Verdict strip */}
    <g>
      <rect x="8" y="254" width="384" height="34" rx="11" fill="#04120d" stroke="#ffffff" strokeOpacity="0.07" />
      <circle cx="30" cy="271" r="8.5" fill="#10b981" fillOpacity="0.18" stroke="#34d399" strokeWidth="1.6" />
      <path d="M26 271 l3 3 l6 -6.5" stroke="#6ee7b7" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="48" y="267.5" width="66" height="7" rx="3.5" fill="#6ee7b7" opacity="0.8" />
      <rect x="122" y="267.5" width="44" height="7" rx="3.5" fill="#ffffff" opacity="0.15" />
      <rect x="174" y="267.5" width="58" height="7" rx="3.5" fill="#ffffff" opacity="0.15" />
      <rect x="300" y="263" width="76" height="16" rx="8" fill="#10b981" fillOpacity="0.16" stroke="#10b981" strokeOpacity="0.4" />
      <rect x="311" y="268" width="54" height="6" rx="3" fill="#34d399" opacity="0.75" />
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

/** Braces with a caret: the parser itself. */
export const IconParser: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <path d="M12 5c-3 0-3 4-3 7s-3 4-3 4 3 1 3 4 0 7 3 7" />
    <path d="M20 5c3 0 3 4 3 7s3 4 3 4-3 1-3 4 0 7-3 7" opacity="0.5" />
    <path d="M14.5 19.5 16 12l1.5 7.5" />
    <path d="M15 17h2" />
  </svg>
);

/** A magnifier over a path expression. */
export const IconQuery: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <circle cx="14" cy="14" r="8" />
    <path d="M20 20l7 7" />
    <path d="M10.5 14h2.5v-3h2.5" />
    <circle cx="17.5" cy="17" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);

/** A digit line with a magnified last digit: the precision guard. */
export const IconPrecision: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <path d="M4 12h16" />
    <path d="M4 17h11" />
    <path d="M4 22h7" />
    <circle cx="23" cy="20" r="5.5" />
    <path d="M27 24l2 2" />
    <path d="M23 17.6v4.8" opacity="0.6" />
  </svg>
);

/** Grid leaving a brace: the table export. */
export const IconTable: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <rect x="3.5" y="7" width="25" height="18" rx="3" />
    <path d="M3.5 13h25" />
    <path d="M12 13v12" />
    <path d="M20.5 13v12" opacity="0.55" />
    <path d="M6.5 10h3" opacity="0.6" />
  </svg>
);

/** A branching schema: inferred types. */
export const IconSchema: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <rect x="3" y="12.5" width="9" height="7" rx="2" />
    <rect x="20" y="4" width="9" height="7" rx="2" />
    <rect x="20" y="21" width="9" height="7" rx="2" />
    <path d="M12 16h4v-8.5h4" />
    <path d="M16 16v8.5h4" />
  </svg>
);

/** Two overlapping documents with a delta. */
export const IconDiff: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <rect x="3" y="5" width="14" height="19" rx="3" opacity="0.5" />
    <rect x="12" y="8" width="17" height="19" rx="3" />
    <path d="M16 15h9" />
    <path d="M16 20h5" opacity="0.6" />
    <path d="M20.5 12.5v5" />
  </svg>
);

/** Browser window with a padlock: everything stays local. */
export const IconLocal: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <rect x="3.5" y="6" width="25" height="20" rx="3.5" />
    <path d="M3.5 11.5h25" />
    <circle cx="7.5" cy="8.7" r="0.9" fill="currentColor" stroke="none" />
    <rect x="12" y="17" width="8" height="6" rx="1.6" />
    <path d="M13.8 17v-1.8a2.2 2.2 0 0 1 4.4 0V17" />
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

/** A wrench over a broken bracket: the repair pass. */
export const IconRepair: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <path d="M11 5H7a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h4" />
    <path d="M21 5h4a2 2 0 0 1 2 2v6" opacity="0.45" />
    <path d="M27 27l-7.5-7.5" />
    <path d="M17 14.5a4.2 4.2 0 0 0 5.6 5.6l-5.6-5.6z" />
    <path d="M22.6 20.1 17 14.5" opacity="0" />
  </svg>
);

/** Threads splitting: the worker. */
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

// ---------------------------------------------------------------------------
// "How it works" step art — four small scenes.
// ---------------------------------------------------------------------------

/** 1. Paste, drop or hand a file over. */
export const StepLoad: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 80" className={className} role="img" aria-hidden="true">
    <rect x="4" y="10" width="112" height="60" rx="10" fill="currentColor" fillOpacity="0.06" />
    <rect x="20" y="20" width="46" height="40" rx="6" fill="currentColor" fillOpacity="0.16" />
    <rect x="27" y="28" width="26" height="4" rx="2" fill="currentColor" />
    <rect x="27" y="36" width="32" height="4" rx="2" fill="currentColor" fillOpacity="0.55" />
    <rect x="27" y="44" width="20" height="4" rx="2" fill="currentColor" fillOpacity="0.4" />
    <path d="M86 24v22" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M80 40l6 6 6-6" stroke="currentColor" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="74" y="52" width="24" height="5" rx="2.5" fill="currentColor" fillOpacity="0.45" />
  </svg>
);

/** 2. The verdict: valid, or an exact position. */
export const StepValidate: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 80" className={className} role="img" aria-hidden="true">
    <rect x="4" y="10" width="112" height="60" rx="10" fill="currentColor" fillOpacity="0.06" />
    <rect x="14" y="20" width="50" height="5" rx="2.5" fill="currentColor" fillOpacity="0.5" />
    <rect x="14" y="32" width="66" height="5" rx="2.5" fill="currentColor" fillOpacity="0.9" />
    <rect x="14" y="44" width="40" height="5" rx="2.5" fill="currentColor" fillOpacity="0.5" />
    <rect x="14" y="56" width="56" height="5" rx="2.5" fill="currentColor" fillOpacity="0.3" />
    <path d="M84 30l6 6 12-13" stroke="currentColor" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M82 34.5h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0" />
    <path d="M80 37 L86 43" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0" />
    <path d="M10 32h5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/** 3. Explore: fold, search, query. */
export const StepExplore: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 80" className={className} role="img" aria-hidden="true">
    <rect x="4" y="10" width="112" height="60" rx="10" fill="currentColor" fillOpacity="0.06" />
    {[0, 1, 2, 3].map(i => (
      <g key={i}>
        <path
          d={`M${18 + (i % 2) * 12} ${22 + i * 12} l4 4 l4 -4`}
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={i === 2 ? 1 : 0.4}
        />
        <rect
          x={32 + (i % 2) * 12}
          y={22 + i * 12}
          width={i === 2 ? 40 : 28}
          height="5"
          rx="2.5"
          fill="currentColor"
          fillOpacity={i === 2 ? 0.9 : 0.35}
        />
      </g>
    ))}
    <circle cx="94" cy="34" r="10" stroke="currentColor" strokeWidth="2.6" fill="none" />
    <path d="M101 41l7 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);

/** 4. Take it away: convert, download, hand off. */
export const StepShip: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 80" className={className} role="img" aria-hidden="true">
    <rect x="4" y="10" width="112" height="60" rx="10" fill="currentColor" fillOpacity="0.06" />
    <rect x="14" y="22" width="42" height="36" rx="6" fill="currentColor" fillOpacity="0.18" />
    <rect x="21" y="31" width="26" height="4" rx="2" fill="currentColor" />
    <rect x="21" y="39" width="18" height="4" rx="2" fill="currentColor" fillOpacity="0.6" />
    <rect x="21" y="47" width="28" height="4" rx="2" fill="currentColor" fillOpacity="0.4" />
    <path d="M64 40h26" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M84 34l6 6-6 6" stroke="currentColor" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="94" y="18" width="14" height="10" rx="3" fill="currentColor" fillOpacity="0.35" />
    <rect x="94" y="35" width="14" height="10" rx="3" fill="currentColor" fillOpacity="0.55" />
    <rect x="94" y="52" width="14" height="10" rx="3" fill="currentColor" fillOpacity="0.35" />
  </svg>
);

export const STEP_ART = [StepLoad, StepValidate, StepExplore, StepShip];
