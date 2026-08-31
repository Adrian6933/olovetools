import React from 'react';

// ============================================================================
// Bespoke SVG artwork for the SVG Optimizer, in the tool's cyan palette.
// ----------------------------------------------------------------------------
// A vector tool illustrated with emoji would be a poor advertisement for
// itself, so everything here is hand-drawn SVG. Animations are SMIL and are
// switched off wholesale by the `animated` prop, which callers wire to
// prefers-reduced-motion.
// ============================================================================

interface ArtProps {
  className?: string;
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Hero: a path with its editing anchors on the left, the same shape stripped
// to clean geometry on the right, and the discarded weight falling away
// between them. The whole promise in one picture.
// ---------------------------------------------------------------------------
export const OptimizerHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 420 260" className={className} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="svgoShape" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#67e8f9" />
        <stop offset="100%" stopColor="#0e7490" />
      </linearGradient>
      <linearGradient id="svgoFade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
      </linearGradient>
    </defs>

    {/* Left card: the messy source */}
    <rect x="14" y="34" width="168" height="192" rx="16" fill="#041016" stroke="rgba(34,211,238,0.18)" strokeWidth="1.5" />
    <text x="30" y="60" fill="#0e7490" fontSize="11" fontWeight="700" fontFamily="monospace">BEFORE</text>

    {/* The shape, with editor cruft: anchors, handles, bounding box */}
    <g transform="translate(38,74)">
      <rect x="-6" y="-6" width="116" height="116" fill="none" stroke="#0e7490" strokeWidth="1" strokeDasharray="3 4" opacity="0.7" />
      <path
        d="M52 4 66 38l36 3-27 25 8 36-31-19-31 19 8-36L2 41l36-3z"
        fill="url(#svgoShape)"
        opacity="0.75"
        stroke="#67e8f9"
        strokeWidth="1.2"
      />
      {/* Anchor points — the editor metadata that adds bytes, not pixels */}
      {[[52, 4], [66, 38], [102, 41], [75, 66], [83, 102], [52, 83], [21, 102], [29, 66], [2, 41], [38, 38]].map(([x, y], i) => (
        <rect key={i} x={x - 3} y={y - 3} width="6" height="6" fill="#04080a" stroke="#22d3ee" strokeWidth="1.4" />
      ))}
    </g>

    {/* Discarded weight drifting out of the left card */}
    <g opacity="0.9">
      {[
        { y: 96, w: 26, d: '0s' },
        { y: 128, w: 34, d: '0.9s' },
        { y: 160, w: 22, d: '1.8s' },
      ].map((chip, i) => (
        <g key={i}>
          <rect x="196" y={chip.y} width={chip.w} height="9" rx="4.5" fill="url(#svgoFade)">
            {animated && (
              <>
                <animate attributeName="x" values="192;236" dur="2.7s" begin={chip.d} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;0" dur="2.7s" begin={chip.d} repeatCount="indefinite" />
              </>
            )}
          </rect>
        </g>
      ))}
    </g>

    {/* Right card: the clean result */}
    <rect x="238" y="34" width="168" height="192" rx="16" fill="#05171e" stroke="rgba(34,211,238,0.35)" strokeWidth="1.5" />
    <text x="254" y="60" fill="#22d3ee" fontSize="11" fontWeight="700" fontFamily="monospace">AFTER</text>

    <g transform="translate(262,74)">
      <path
        d="M52 4 66 38l36 3-27 25 8 36-31-19-31 19 8-36L2 41l36-3z"
        fill="url(#svgoShape)"
      />
    </g>

    {/* Size readout on the result card */}
    <g transform="translate(254,196)">
      <rect x="0" y="0" width="60" height="16" rx="8" fill="#0891b2" opacity="0.25" />
      <text x="10" y="12" fill="#67e8f9" fontSize="10" fontWeight="700" fontFamily="monospace">−72%</text>
    </g>
  </svg>
);

// ---------------------------------------------------------------------------
// Placeholder shown in the stage before anything has been optimized.
// ---------------------------------------------------------------------------
export const EmptyStageArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 160 160" className={className} role="img" aria-hidden="true">
    <rect x="20" y="20" width="120" height="120" rx="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="7 7" opacity="0.4" />
    <path
      d="M80 52 91 78l28 2-21 19 6 28-24-15-24 15 6-28-21-19 28-2z"
      fill="currentColor"
      opacity="0.22"
    />
    {[[80, 52], [119, 80], [98, 127], [62, 127], [41, 80]].map(([x, y], i) => (
      <rect key={i} x={x - 3.5} y={y - 3.5} width="7" height="7" rx="1" fill="currentColor" opacity="0.55">
        {animated && (
          <animate attributeName="opacity" values="0.25;0.7;0.25" dur="2.4s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
        )}
      </rect>
    ))}
  </svg>
);

// ---------------------------------------------------------------------------
// Feature icons. Drawn to a shared 32×32 grid so they sit together evenly.
// ---------------------------------------------------------------------------
const iconProps = {
  viewBox: '0 0 32 32',
  role: 'img' as const,
  'aria-hidden': true,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** A plugin stack: the 45 switches the engine exposes. */
export const IconPlugins: React.FC<ArtProps> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <rect x="4" y="5" width="24" height="6" rx="2.5" />
    <rect x="4" y="13" width="24" height="6" rx="2.5" />
    <rect x="4" y="21" width="24" height="6" rx="2.5" />
    <circle cx="10" cy="8" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="10" cy="16" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="22" cy="24" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

/** Anchor points on a curve: precision control. */
export const IconPrecision: React.FC<ArtProps> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <path d="M4 24c6-16 18-16 24 0" />
    <rect x="1.6" y="21.6" width="5" height="5" rx="1" fill="currentColor" stroke="none" />
    <rect x="25.4" y="21.6" width="5" height="5" rx="1" fill="currentColor" stroke="none" />
    <circle cx="16" cy="13" r="2.6" />
    <path d="M16 5v3M16 18v3" opacity="0.6" />
  </svg>
);

/** Shield with a vector node inside: nothing leaves the machine. */
export const IconLocal: React.FC<ArtProps> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <path d="M16 3.5 27 8v7.5c0 7-4.6 11.7-11 13.5-6.4-1.8-11-6.5-11-13.5V8z" />
    <path d="M11.5 16.5 15 20l6-7.5" />
  </svg>
);

/** Two tools linked: the handoff chain. */
export const IconHandoff: React.FC<ArtProps> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <rect x="3" y="11" width="10" height="10" rx="3" />
    <rect x="19" y="11" width="10" height="10" rx="3" />
    <path d="M13 16h6" />
    <path d="M17 13.5 19.5 16 17 18.5" />
  </svg>
);

/** A gzipped package: the size that actually ships. */
export const IconGzip: React.FC<ArtProps> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <path d="M4 10.5 16 4.5l12 6v11l-12 6-12-6z" />
    <path d="M4 10.5 16 16.5l12-6M16 16.5V27" opacity="0.7" />
    <path d="M10 7.5 22 13.5" opacity="0.45" />
  </svg>
);

/** A wrench over a broken tag: the tolerant repair pass. */
export const IconRepair: React.FC<ArtProps> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <path d="M11 7 6 12l-2-2M21 25l5-5 2 2" opacity="0.5" />
    <path d="M20 4.5a6.5 6.5 0 0 0-8 8.3L4.5 20.3a2.4 2.4 0 0 0 3.4 3.4l7.5-7.5a6.5 6.5 0 0 0 8.3-8l-3.9 3.9-3.2-3.2z" />
  </svg>
);

// ---------------------------------------------------------------------------
// "How it works" step art. Three panels, same 120×90 frame.
// ---------------------------------------------------------------------------
const stepFrame = { viewBox: '0 0 120 90', role: 'img' as const, 'aria-hidden': true };

/** 1 — the file lands and waits. Nothing has run yet. */
export const StepDropArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg {...stepFrame} className={className}>
    <rect x="8" y="20" width="104" height="58" rx="12" fill="none" stroke="#0e7490" strokeWidth="2" strokeDasharray="6 6" />
    <g>
      <rect x="44" y="30" width="32" height="40" rx="5" fill="#05171e" stroke="#22d3ee" strokeWidth="1.8" />
      <path d="M66 30v8h8" fill="none" stroke="#22d3ee" strokeWidth="1.8" />
      <text x="51" y="58" fill="#67e8f9" fontSize="9" fontWeight="700" fontFamily="monospace">SVG</text>
      {animated && (
        <animateTransform attributeName="transform" type="translate" values="0,-9;0,0;0,-9" dur="3s" repeatCount="indefinite" />
      )}
    </g>
  </svg>
);

/** 2 — the switches, turned by hand. */
export const StepTuneArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg {...stepFrame} className={className}>
    {[26, 45, 64].map((y, i) => (
      <g key={y}>
        <rect x="20" y={y} width="80" height="9" rx="4.5" fill="#05171e" stroke="rgba(34,211,238,0.3)" strokeWidth="1.2" />
        <circle cx={i === 1 ? 76 : 40} cy={y + 4.5} r="7" fill="#22d3ee">
          {animated && (
            <animate
              attributeName="cx"
              values={i === 1 ? '76;40;76' : '40;76;40'}
              dur="4s"
              begin={`${i * 0.5}s`}
              repeatCount="indefinite"
            />
          )}
        </circle>
      </g>
    ))}
  </svg>
);

/** 3 — the result leaves, either as a download or into the next tool. */
export const StepShipArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg {...stepFrame} className={className}>
    <rect x="14" y="26" width="40" height="46" rx="8" fill="#05171e" stroke="#22d3ee" strokeWidth="1.8" />
    <path d="M26 44h16M34 37l7 7-7 7" fill="none" stroke="#67e8f9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M58 49h20" stroke="#22d3ee" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round">
      {animated && <animate attributeName="stroke-dashoffset" values="16;0" dur="1.2s" repeatCount="indefinite" />}
    </path>
    <rect x="82" y="30" width="24" height="24" rx="7" fill="none" stroke="#0891b2" strokeWidth="1.8" />
    <rect x="82" y="60" width="24" height="12" rx="5" fill="none" stroke="#0891b2" strokeWidth="1.8" opacity="0.6" />
  </svg>
);
