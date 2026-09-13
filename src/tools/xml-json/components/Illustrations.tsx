import React from 'react';

// ============================================================================
// Bespoke SVG artwork for the XML ⇄ JSON converter, in the tool's teal palette.
// Inline and self-contained: no raster assets, no network requests, and no
// emoji or recycled lucide glyph standing in for an illustration.
//
// Every animation is SMIL wrapped in an `animated` flag the caller ties to
// prefers-reduced-motion, so the reduced-motion render is a still drawing
// rather than a drawing with the motion merely slowed down.
// ============================================================================

interface ArtProps {
  className?: string;
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Hero: an angle-bracketed tree on the left folding into braces on the right,
// with a shuttle travelling the bridge between them in both directions.
// ---------------------------------------------------------------------------
export const XmlHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 400 300" className={`tool-hero-art ${className}`} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="xjGlow" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#042f2e" />
        <stop offset="55%" stopColor="#14b8a6" />
        <stop offset="100%" stopColor="#22d3ee" />
      </linearGradient>
      <linearGradient id="xjBridge" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.15" />
        <stop offset="50%" stopColor="#2dd4bf" stopOpacity="0.75" />
        <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.15" />
      </linearGradient>
      <clipPath id="xjFrame">
        <rect x="8" y="12" width="384" height="234" rx="18" />
      </clipPath>
    </defs>

    <g clipPath="url(#xjFrame)">
      <rect x="8" y="12" width="384" height="234" fill="#03100e" />
      <circle cx="340" cy="34" r="96" fill="url(#xjGlow)" opacity="0.16" />
      <circle cx="60" cy="240" r="70" fill="#14b8a6" opacity="0.08" />

      {/* Left pane: the tag tree */}
      <rect x="22" y="28" width="146" height="200" rx="12" fill="#02100d" stroke="#ffffff" strokeOpacity="0.07" />
      <text x="34" y="50" fontFamily="ui-monospace, monospace" fontSize="11" fill="#5eead4" fontWeight="700">
        &lt;/&gt;
      </text>
      {[
        [62, 26, 54, '#5eead4'],
        [78, 38, 62, '#99f6e4'],
        [94, 50, 44, '#67e8f9'],
        [110, 50, 58, '#99f6e4'],
        [126, 38, 40, '#5eead4'],
        [142, 50, 66, '#99f6e4'],
        [158, 50, 36, '#67e8f9'],
        [174, 38, 54, '#99f6e4'],
        [190, 26, 46, '#5eead4'],
        [206, 38, 60, '#99f6e4'],
      ].map(([y, x, w, fill], i) => (
        <g key={i}>
          <rect x={34 + (x as number) - 26} y={y as number} width="7" height="7" rx="1.6" fill={fill as string} opacity="0.8" />
          <rect
            x={34 + (x as number) - 14}
            y={(y as number) + 1}
            width={w as number}
            height="5"
            rx="2.5"
            fill={fill as string}
            opacity="0.32"
          />
        </g>
      ))}

      {/* Right pane: the brace tree */}
      <rect x="232" y="28" width="146" height="200" rx="12" fill="#02100d" stroke="#ffffff" strokeOpacity="0.07" />
      <text x="244" y="50" fontFamily="ui-monospace, monospace" fontSize="11" fill="#67e8f9" fontWeight="700">
        {'{ }'}
      </text>
      {[
        [62, 12, 62],
        [78, 24, 50],
        [94, 36, 58],
        [110, 36, 40],
        [126, 24, 66],
        [142, 36, 46],
        [158, 36, 60],
        [174, 24, 38],
        [190, 12, 54],
        [206, 24, 48],
      ].map(([y, x, w], i) => (
        <g key={i}>
          <circle cx={248 + (x as number)} cy={(y as number) + 4} r="2.4" fill="#22d3ee" opacity="0.7" />
          <rect
            x={256 + (x as number)}
            y={y as number}
            width={w as number}
            height="5"
            rx="2.5"
            fill="#67e8f9"
            opacity="0.3"
          />
        </g>
      ))}

      {/* The bridge and the shuttle that walks it both ways */}
      <path d="M170 128 H230" stroke="url(#xjBridge)" strokeWidth="3" strokeLinecap="round" />
      <path d="M170 128 H230" stroke="#2dd4bf" strokeWidth="1" strokeDasharray="3 5" opacity="0.5" />
      <g>
        <circle cx="200" cy="128" r="13" fill="#03100e" stroke="#2dd4bf" strokeWidth="1.6" />
        <path
          d="M195 124 l-4 4 4 4 M205 124 l4 4 -4 4"
          stroke="#5eead4"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {animated && (
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 22 0; 0 0; -22 0; 0 0"
            dur="6s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1"
            keyTimes="0; 0.25; 0.5; 0.75; 1"
          />
        )}
      </g>

      {/* Fidelity meter along the bottom */}
      <rect x="22" y="238" width="356" height="6" rx="3" fill="#ffffff" fillOpacity="0.06" />
      <rect x="22" y="238" width="356" height="6" rx="3" fill="#2dd4bf" opacity="0.55">
        {animated && (
          <animate attributeName="width" values="60; 356; 60" dur="7s" repeatCount="indefinite" />
        )}
      </rect>
    </g>

    <rect x="8" y="12" width="384" height="234" rx="18" fill="none" stroke="#ffffff" strokeOpacity="0.08" />
    <text x="200" y="272" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="11" fill="#2dd4bf" opacity="0.7">
      XML ⇄ JSON
    </text>
  </svg>
);

// ---------------------------------------------------------------------------
// Feature icons
// ---------------------------------------------------------------------------

const iconProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const IconAst: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} {...iconProps} aria-hidden="true">
    <circle cx="12" cy="4" r="2" />
    <circle cx="5" cy="19" r="2" />
    <circle cx="12" cy="19" r="2" />
    <circle cx="19" cy="19" r="2" />
    <path d="M12 6v4M12 10H5v7M12 10h7v7M12 10v7" />
  </svg>
);

export const IconPointer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} {...iconProps} aria-hidden="true">
    <path d="M4 5h9M4 9h6M4 13h11M4 17h5" />
    <circle cx="17.5" cy="8.5" r="3.5" />
    <path d="M20 11l2.5 2.5" />
  </svg>
);

export const IconRoundTrip: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} {...iconProps} aria-hidden="true">
    <path d="M4 9a8 8 0 0 1 13.7-5.6L20 6" />
    <path d="M20 15a8 8 0 0 1-13.7 5.6L4 18" />
    <path d="M20 3v3h-3M4 21v-3h3" />
    <circle cx="12" cy="12" r="2.2" />
  </svg>
);

export const IconXPath: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} {...iconProps} aria-hidden="true">
    <path d="M3 6h4l3 12h4" />
    <path d="M14 6h7M14 6l-3 5" />
    <circle cx="18.5" cy="16.5" r="3" />
    <path d="M20.8 18.8L23 21" />
  </svg>
);

export const IconWorker: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} {...iconProps} aria-hidden="true">
    <rect x="3" y="4" width="18" height="7" rx="2" />
    <rect x="3" y="13" width="18" height="7" rx="2" />
    <path d="M7 7.5h.01M7 16.5h.01" />
    <path d="M11 7.5h6M11 16.5h6" />
  </svg>
);

export const IconLocal: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} {...iconProps} aria-hidden="true">
    <path d="M12 3l7 3v5.5c0 4.3-2.9 8.2-7 9.5-4.1-1.3-7-5.2-7-9.5V6l7-3z" />
    <path d="M9.5 12l1.8 1.8L15 10" />
  </svg>
);

export const IconOptions: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} {...iconProps} aria-hidden="true">
    <path d="M4 7h9M17 7h3M4 17h4M12 17h8" />
    <circle cx="15" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
    <path d="M4 12h16" opacity="0.4" />
  </svg>
);

export const IconHandoff: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} {...iconProps} aria-hidden="true">
    <rect x="2.5" y="6" width="8" height="12" rx="2" />
    <rect x="13.5" y="6" width="8" height="12" rx="2" />
    <path d="M10.5 12h3" />
    <path d="M12.2 10.3L14 12l-1.8 1.7" />
  </svg>
);

// ---------------------------------------------------------------------------
// How it works
// ---------------------------------------------------------------------------

const StepFrame: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <svg viewBox="0 0 120 80" className={className} role="img" aria-hidden="true">
    <rect x="1" y="1" width="118" height="78" rx="12" fill="#03100e" stroke="currentColor" strokeOpacity="0.16" />
    {children}
  </svg>
);

export const StepLoad: React.FC<{ className?: string }> = ({ className = '' }) => (
  <StepFrame className={className}>
    <rect x="16" y="16" width="46" height="48" rx="6" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.35" />
    {[24, 32, 40, 48, 56].map((y, i) => (
      <rect key={i} x={22} y={y} width={i % 2 ? 24 : 34} height="3.5" rx="1.7" fill="currentColor" opacity="0.4" />
    ))}
    <path d="M74 40h26M92 33l8 7-8 7" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    <circle cx="74" cy="20" r="7" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.5" />
    <path d="M74 17v6M71 20h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
  </StepFrame>
);

export const StepTune: React.FC<{ className?: string }> = ({ className = '' }) => (
  <StepFrame className={className}>
    {[24, 40, 56].map((y, i) => (
      <g key={i}>
        <rect x="18" y={y - 2} width="84" height="4" rx="2" fill="currentColor" opacity="0.18" />
        <circle cx={[42, 74, 58][i]} cy={y} r="6.5" fill="#03100e" stroke="currentColor" strokeWidth="2" />
        <circle cx={[42, 74, 58][i]} cy={y} r="2.2" fill="currentColor" />
      </g>
    ))}
  </StepFrame>
);

export const StepConvert: React.FC<{ className?: string }> = ({ className = '' }) => (
  <StepFrame className={className}>
    <path d="M22 28h34M22 40h26M22 52h30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
    <path d="M62 40h12" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" opacity="0.6" />
    <rect x="78" y="22" width="24" height="36" rx="6" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeOpacity="0.4" />
    <path d="M86 30c-3 0-3 4-3 5s0 5-3 5c3 0 3 4 3 5s0 5 3 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
    <circle cx="96" cy="40" r="2" fill="currentColor" />
  </StepFrame>
);

export const StepShip: React.FC<{ className?: string }> = ({ className = '' }) => (
  <StepFrame className={className}>
    <rect x="16" y="22" width="36" height="36" rx="8" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.35" />
    <path d="M28 40l5 5 11-12" stroke="currentColor" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M60 40h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    <path d="M74 34l6 6-6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    <rect x="86" y="26" width="18" height="28" rx="5" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="2" />
    <path d="M95 33v12M91 41l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
  </StepFrame>
);

export const STEP_ART = [StepLoad, StepTune, StepConvert, StepShip];
