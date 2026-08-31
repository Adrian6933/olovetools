import React from 'react';

// ============================================================================
// Bespoke SVG artwork for FrameSnap, in the tool's amber palette.
// Inline and self-contained: no raster assets, no network requests, and no
// recycled lucide glyph doing duty as an illustration.
//
// Motion is SMIL behind an `animated` flag wired to prefers-reduced-motion.
// ============================================================================

interface ArtProps {
  className?: string;
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Hero: a strip of film running behind a playhead, with one frame lifted out
// of it and the difference graph the scene detector draws underneath.
// ---------------------------------------------------------------------------
export const FrameHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 400 300" className={className} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="fsGlow" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#431407" />
        <stop offset="55%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#fbbf24" />
      </linearGradient>
      <clipPath id="fsFrame">
        <rect x="8" y="12" width="384" height="234" rx="18" />
      </clipPath>
      <clipPath id="fsStrip">
        <rect x="20" y="74" width="360" height="86" rx="8" />
      </clipPath>
    </defs>

    <g clipPath="url(#fsFrame)">
      <rect x="8" y="12" width="384" height="234" fill="#160b03" />
      <circle cx="336" cy="34" r="94" fill="url(#fsGlow)" opacity="0.16" />

      {/* The lifted frame */}
      <g>
        <rect x="146" y="22" width="108" height="62" rx="7" fill="#1f1105" stroke="#fb923c" strokeOpacity="0.7" strokeWidth="1.6" />
        <path d="M154 74 l22 -22 l16 14 l20 -26 l34 34 z" fill="#fb923c" opacity="0.35" />
        <circle cx="222" cy="40" r="6" fill="#fbbf24" opacity="0.6" />
        {animated && (
          <animateTransform attributeName="transform" type="translate" values="0 4; 0 -4; 0 4" dur="5s" repeatCount="indefinite" />
        )}
      </g>

      {/* Film strip */}
      <rect x="20" y="74" width="360" height="86" rx="8" fill="#0f0803" stroke="#ffffff" strokeOpacity="0.07" />
      <g clipPath="url(#fsStrip)">
        <g>
          {Array.from({ length: 10 }, (_, i) => (
            <g key={i} transform={`translate(${i * 62} 0)`}>
              <rect x="26" y="88" width="52" height="58" rx="4" fill="#241206" stroke="#fb923c" strokeOpacity="0.28" />
              <path
                d={`M30 ${140 - (i % 3) * 8} l12 -${10 + (i % 4) * 4} l10 8 l14 -${12 + (i % 3) * 5} l8 ${18 + (i % 2) * 6} z`}
                fill="#fb923c"
                opacity={0.18 + (i % 3) * 0.08}
              />
            </g>
          ))}
          {animated && (
            <animateTransform attributeName="transform" type="translate" values="0 0; -62 0" dur="3.2s" repeatCount="indefinite" />
          )}
        </g>
        {/* Sprocket holes, top and bottom */}
        {Array.from({ length: 24 }, (_, i) => (
          <g key={i}>
            <rect x={24 + i * 16} y="78" width="8" height="5" rx="1.5" fill="#ffffff" opacity="0.1" />
            <rect x={24 + i * 16} y="151" width="8" height="5" rx="1.5" fill="#ffffff" opacity="0.1" />
          </g>
        ))}
      </g>

      {/* Playhead */}
      <g>
        <path d="M200 66 l7 12 h-14 z" fill="#fbbf24" />
        <rect x="199" y="76" width="2" height="90" fill="#fbbf24" opacity="0.85" />
        {animated && (
          <animateTransform
            attributeName="transform"
            type="translate"
            values="-70 0; 70 0; -70 0"
            dur="6s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
            keyTimes="0; 0.5; 1"
          />
        )}
      </g>

      {/* Scene-difference graph */}
      <text x="22" y="186" fontFamily="ui-monospace, monospace" fontSize="8" fill="#fb923c" opacity="0.65">
        scene diff
      </text>
      <path
        d="M22 232 L52 226 L82 228 L96 196 L112 229 L142 231 L172 227 L188 192 L204 230 L234 229 L264 231 L286 200 L302 230 L332 228 L362 231 L378 229"
        fill="none"
        stroke="#fb923c"
        strokeWidth="1.8"
        strokeLinejoin="round"
        opacity="0.8"
      />
      <line x1="22" y1="212" x2="378" y2="212" stroke="#fbbf24" strokeWidth="1" strokeDasharray="3 4" opacity="0.45" />
      {[96, 188, 286].map((x, i) => (
        <circle key={i} cx={x} cy={i === 0 ? 196 : i === 1 ? 192 : 200} r="3" fill="#fbbf24">
          {animated && <animate attributeName="opacity" values="0.35;1;0.35" dur="2.4s" begin={`${i * 0.4}s`} repeatCount="indefinite" />}
        </circle>
      ))}
    </g>

    <rect x="8" y="12" width="384" height="234" rx="18" fill="none" stroke="#ffffff" strokeOpacity="0.08" />
    <text x="200" y="272" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="11" fill="#fb923c" opacity="0.75">
      00:04:11 · frame 6 271
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

export const IconExact: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} {...iconProps} aria-hidden="true">
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <path d="M12 3v3M12 18v3" />
    <path d="M9.5 12h5M12 9.5v5" />
  </svg>
);

export const IconMeasure: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} {...iconProps} aria-hidden="true">
    <rect x="2.5" y="8" width="19" height="8" rx="2" />
    <path d="M6 8v3M9.5 8v5M13 8v3M16.5 8v5M20 8v3" />
  </svg>
);

export const IconBatch: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} {...iconProps} aria-hidden="true">
    <rect x="3" y="3.5" width="11" height="8" rx="2" />
    <rect x="6.5" y="8" width="11" height="8" rx="2" opacity="0.7" />
    <rect x="10" y="12.5" width="11" height="8" rx="2" opacity="0.45" />
  </svg>
);

export const IconScene: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} {...iconProps} aria-hidden="true">
    <path d="M2.5 18l4-1 3.5-7 3 9 3.5-11 2.5 10h3" />
    <path d="M2.5 21h19" opacity="0.4" />
  </svg>
);

export const IconZoom: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} {...iconProps} aria-hidden="true">
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M8 10.5h5M10.5 8v5" />
    <path d="M15.5 15.5L21 21" />
  </svg>
);

export const IconMemory: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} {...iconProps} aria-hidden="true">
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <rect x="8.5" y="8.5" width="7" height="7" rx="1.5" />
    <path d="M8 1.5v2.5M12 1.5v2.5M16 1.5v2.5M8 20v2.5M12 20v2.5M16 20v2.5" opacity="0.6" />
  </svg>
);

export const IconLocal: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} {...iconProps} aria-hidden="true">
    <path d="M12 3l7 3v5.5c0 4.3-2.9 8.2-7 9.5-4.1-1.3-7-5.2-7-9.5V6l7-3z" />
    <path d="M9.5 12l1.8 1.8L15 10" />
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
    <rect x="1" y="1" width="118" height="78" rx="12" fill="#1a0d03" stroke="currentColor" strokeOpacity="0.16" />
    {children}
  </svg>
);

export const StepLoad: React.FC<{ className?: string }> = ({ className = '' }) => (
  <StepFrame className={className}>
    <rect x="20" y="24" width="80" height="34" rx="6" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.35" strokeDasharray="5 4" />
    <path d="M60 48V32M53 38l7-7 7 7" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M42 52h36" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.5" />
  </StepFrame>
);

export const StepStep: React.FC<{ className?: string }> = ({ className = '' }) => (
  <StepFrame className={className}>
    {[18, 44, 70].map((x, i) => (
      <rect key={i} x={x} y="26" width="22" height="28" rx="3" fill="currentColor" fillOpacity={i === 1 ? 0.22 : 0.07} stroke="currentColor" strokeOpacity={i === 1 ? 0.6 : 0.25} />
    ))}
    <path d="M55 20v40" stroke="currentColor" strokeWidth="2" opacity="0.8" />
    <path d="M51 16h8l-4 5z" fill="currentColor" />
    <path d="M100 40h-6M96 36l-4 4 4 4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
  </StepFrame>
);

export const StepBatch: React.FC<{ className?: string }> = ({ className = '' }) => (
  <StepFrame className={className}>
    <rect x="16" y="20" width="34" height="24" rx="4" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeOpacity="0.4" />
    <rect x="24" y="30" width="34" height="24" rx="4" fill="currentColor" fillOpacity="0.09" stroke="currentColor" strokeOpacity="0.3" />
    <rect x="32" y="40" width="34" height="24" rx="4" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.22" />
    <path d="M78 30h24M78 40h18M78 50h22" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity="0.45" />
  </StepFrame>
);

export const StepExport: React.FC<{ className?: string }> = ({ className = '' }) => (
  <StepFrame className={className}>
    <rect x="16" y="22" width="38" height="36" rx="6" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.35" />
    <path d="M24 46l8-9 6 6 6-8" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M62 40h18M74 34l6 6-6 6" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.65" />
    <rect x="86" y="26" width="18" height="28" rx="5" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="2" />
    <path d="M95 33v12M91 41l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
  </StepFrame>
);

export const STEP_ART = [StepLoad, StepStep, StepBatch, StepExport];
