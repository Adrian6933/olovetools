import React from 'react';

// ============================================================================
// Bespoke SVG artwork for DrawSnap. Inline, self-contained, themed with the
// tool's purple palette — no raster assets and no network requests, so it
// scales to any size and costs nothing to load.
// ============================================================================

interface ArtProps {
  className?: string;
  /** Disables the SMIL animation for users who asked for reduced motion. */
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Hero: a photo on the left half, the same subject redrawn as strokes on the
// right, with a nib travelling along the line that separates them.
// ---------------------------------------------------------------------------
export const DrawHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 400 300" className={`tool-hero-art ${className}`} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="dsSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3b0764" />
        <stop offset="60%" stopColor="#7e22ce" />
        <stop offset="100%" stopColor="#e9d5ff" />
      </linearGradient>
      <linearGradient id="dsHill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#6b21a8" />
        <stop offset="100%" stopColor="#2e1065" />
      </linearGradient>
      <linearGradient id="dsBeam" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#d8b4fe" stopOpacity="0" />
        <stop offset="45%" stopColor="#f5d0fe" stopOpacity="1" />
        <stop offset="100%" stopColor="#d8b4fe" stopOpacity="0" />
      </linearGradient>

      <pattern id="dsDots" width="20" height="20" patternUnits="userSpaceOnUse">
        <rect width="20" height="20" fill="#100a1c" />
        <circle cx="10" cy="10" r="1.3" fill="#a855f7" opacity="0.35" />
      </pattern>

      <clipPath id="dsFrame">
        <rect x="10" y="10" width="380" height="280" rx="26" />
      </clipPath>

      {/* One animated rect drives both the reveal and the travelling nib. */}
      <clipPath id="dsReveal">
        <rect y="0" width="400" height="300" x={animated ? 150 : 200}>
          {animated && (
            <animate
              attributeName="x"
              values="330;80;330"
              dur="8s"
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes="0;0.5;1"
              keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
            />
          )}
        </rect>
      </clipPath>

      <filter id="dsGlow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="5" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <g clipPath="url(#dsFrame)">
      {/* The photograph */}
      <rect x="10" y="10" width="380" height="280" fill="url(#dsSky)" />
      <circle cx="302" cy="72" r="24" fill="#fde68a" opacity="0.8" />
      <path d="M10 212 L100 150 L180 206 L246 164 L332 224 L390 188 L390 290 L10 290 Z" fill="url(#dsHill)" />
      <path d="M10 244 L86 204 L166 248 L260 206 L390 256 L390 290 L10 290 Z" fill="#1e0b3a" opacity="0.9" />

      {/* Everything to the right of the sweep is the traced version */}
      <g clipPath="url(#dsReveal)">
        <rect x="10" y="10" width="380" height="280" fill="url(#dsDots)" />
        <g
          fill="none"
          stroke="#e9d5ff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        >
          <circle cx="302" cy="72" r="24" />
          <path d="M10 212 L100 150 L180 206 L246 164 L332 224 L390 188" />
          <path d="M10 244 L86 204 L166 248 L260 206 L390 256" opacity="0.7" />
          <path d="M120 262 L150 236 L182 262" opacity="0.55" />
          <path d="M250 268 L272 248 L296 268" opacity="0.55" />
        </g>
        {/* Anchor points, the giveaway that these are editable vectors */}
        <g fill="#0c0a12" stroke="#c084fc" strokeWidth="1.8">
          <rect x="96" y="146" width="8" height="8" rx="1.5" />
          <rect x="176" y="202" width="8" height="8" rx="1.5" />
          <rect x="242" y="160" width="8" height="8" rx="1.5" />
          <rect x="328" y="220" width="8" height="8" rx="1.5" />
        </g>
      </g>

      {/* The nib riding the seam */}
      <g clipPath="url(#dsReveal)">
        <rect y="0" width="3" height="300" x="0" fill="url(#dsBeam)" filter="url(#dsGlow)" />
        <g transform="translate(-14, 24)">
          <path d="M14 8 L28 22 L18 44 L8 44 L4 26 Z" fill="#f5d0fe" />
          <path d="M14 8 L28 22 L18 44 L8 44 L4 26 Z" fill="none" stroke="#a855f7" strokeWidth="1.5" />
          <circle cx="13" cy="26" r="3" fill="#7e22ce" />
        </g>
      </g>
    </g>

    <rect x="10" y="10" width="380" height="280" rx="26" fill="none" stroke="rgba(168,85,247,0.28)" strokeWidth="1.5" />
  </svg>
);

// ---------------------------------------------------------------------------
// Feature icons
// ---------------------------------------------------------------------------
const iconBase = 'w-7 h-7';
const strokeProps = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** A nib with a pressure gauge: pressure- and speed-aware strokes. */
export const IconPressure: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <path d="M8.5 2.8 13 7.3l-3.2 7.1-3.2.1-1.4-5.8Z" />
    <path d="m9.6 10.3 1.6 1.6" />
    <path d="M14.5 18.5c2.6 0 4.7-2 4.7-4.5" />
    <path d="M4.8 18.5c0 1.6 1.3 2.8 2.9 2.8h9.6" />
  </svg>
);

/** A path with anchor points: everything stays vector. */
export const IconVector: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <path d="M4.5 17.5c4-8.5 11-8.5 15 0" />
    <rect x="2.6" y="15.6" width="3.8" height="3.8" rx="1" />
    <rect x="17.6" y="15.6" width="3.8" height="3.8" rx="1" />
    <rect x="10.1" y="6.6" width="3.8" height="3.8" rx="1" />
  </svg>
);

/** A photo turning into a contour: the tracer. */
export const IconTrace: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <rect x="2.6" y="4.5" width="9" height="9" rx="1.8" />
    <path d="m4.4 12 2.2-2.7 1.8 2.1 1.3-1.5" />
    <path d="M14.2 8.5c4 0 6.5 2.4 6.5 5.6 0 2.6-1.9 4.9-4.6 4.9-2 0-3.4-1.3-3.4-3 0-1.4 1-2.5 2.4-2.5 1.1 0 1.9.7 1.9 1.7" />
    <circle cx="17.1" cy="15.2" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

/** Stacked cards with a cursor: object-level editing and selection. */
export const IconObjects: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <rect x="3" y="3.2" width="11" height="9" rx="2" />
    <path d="M6.2 15.4h8.4a2 2 0 0 0 2-2V6.6" />
    <path d="m13.6 14.4 7 2.9-3 1.1-1.1 3Z" />
  </svg>
);

/** Two panes with an arrow: hand the board to the next tool. */
export const IconHandoff: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <rect x="2.5" y="6" width="7.5" height="12" rx="1.8" />
    <rect x="14" y="6" width="7.5" height="12" rx="1.8" />
    <path d="M10.8 12h2.4M12.2 10.4 13.8 12l-1.6 1.6" />
  </svg>
);

/** Cloud with a slash: nothing leaves the browser. */
export const IconOffline: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <path d="M17.6 17.5H7a4 4 0 0 1-.6-7.95A5.5 5.5 0 0 1 16.4 8.2a3.9 3.9 0 0 1 3.2 5.9" />
    <path d="m3.5 3.5 17 17" />
  </svg>
);

// ---------------------------------------------------------------------------
// "How it works" step artwork
// ---------------------------------------------------------------------------
export const StepBoard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="12" y="12" width="96" height="66" rx="10" stroke="currentColor" strokeWidth="2" opacity="0.5" />
    <g opacity="0.35" fill="currentColor">
      {[26, 46, 66, 86].map(x =>
        [28, 46, 64].map(y => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" />)
      )}
    </g>
    <path
      d="M28 60c8-22 20-24 28-10s16 12 24-8"
      stroke="currentColor"
      strokeWidth="3.4"
      strokeLinecap="round"
    />
  </svg>
);

export const StepDrop: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="10" y="12" width="100" height="66" rx="12" stroke="currentColor" strokeWidth="2" strokeDasharray="7 6" opacity="0.55" />
    <rect x="30" y="28" width="40" height="30" rx="4" stroke="currentColor" strokeWidth="2.4" opacity="0.8" />
    <path d="m34 54 9-11 7 8 5-6 9 9Z" fill="currentColor" opacity="0.8" />
    <path d="M84 34v20M76 46l8 8 8-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const StepTrace: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="14" y="14" width="92" height="62" rx="10" stroke="currentColor" strokeWidth="2" opacity="0.4" />
    <path d="M26 62c6-20 16-26 24-14s14 10 20-6 12-8 16 4" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
    <g fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="22" y="58" width="8" height="8" rx="1.5" />
      <rect x="46" y="42" width="8" height="8" rx="1.5" />
      <rect x="70" y="36" width="8" height="8" rx="1.5" />
      <rect x="82" y="42" width="8" height="8" rx="1.5" />
    </g>
    <path d="m96 18 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="currentColor" />
  </svg>
);

export const StepRefine: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="16" y="14" width="88" height="62" rx="10" stroke="currentColor" strokeWidth="2" opacity="0.4" />
    <path d="M72 26 88 42 60 70a5 5 0 0 1-2.5 1.3l-7.5 1.5 1.5-7.5A5 5 0 0 1 52.8 62Z" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" />
    <path d="m68 30 16 16" stroke="currentColor" strokeWidth="2.6" />
    <circle cx="34" cy="34" r="8" stroke="currentColor" strokeWidth="2.6" strokeDasharray="3 3" />
  </svg>
);

export const StepExport: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="20" y="12" width="80" height="52" rx="9" stroke="currentColor" strokeWidth="2" opacity="0.5" />
    <path d="M60 20v26" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
    <path d="m50 36 10 10 10-10" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M32 76h56" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
    <text x="86" y="80" fontSize="13" fontWeight="700" fill="currentColor" opacity="0.7">
      4×
    </text>
  </svg>
);
