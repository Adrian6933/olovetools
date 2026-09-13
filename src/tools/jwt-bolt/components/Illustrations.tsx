import React from 'react';

// ============================================================================
// Bespoke SVG artwork for JWTBolt, in the tool's violet palette.
// Inline and self-contained: no raster assets, no network requests, and no
// recycled lucide glyph doing duty as an illustration.
//
// Motion is SMIL behind an `animated` flag the caller wires to
// prefers-reduced-motion, so the reduced render is a still drawing.
// ============================================================================

interface ArtProps {
  className?: string;
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Hero: the three segments of a token, a key turning against the third one,
// and the verdict lamp that lights when the signature checks out.
// ---------------------------------------------------------------------------
export const JwtHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 400 300" className={`tool-hero-art ${className}`} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="jbGlow" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#2e1065" />
        <stop offset="55%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#e879f9" />
      </linearGradient>
      <linearGradient id="jbSweep" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#a78bfa" stopOpacity="0" />
        <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
      </linearGradient>
      <clipPath id="jbFrame">
        <rect x="8" y="12" width="384" height="234" rx="18" />
      </clipPath>
    </defs>

    <g clipPath="url(#jbFrame)">
      <rect x="8" y="12" width="384" height="234" fill="#120820" />
      <circle cx="340" cy="30" r="96" fill="url(#jbGlow)" opacity="0.18" />
      <circle cx="52" cy="238" r="72" fill="#8b5cf6" opacity="0.08" />

      {/* The three segments, colour-coded like the UI */}
      {[
        { y: 46, w: 118, label: 'header', stroke: '#fb7185', fill: 'rgba(251,113,133,0.12)' },
        { y: 104, w: 236, label: 'payload', stroke: '#a78bfa', fill: 'rgba(167,139,250,0.12)' },
        { y: 162, w: 168, label: 'signature', stroke: '#94a3b8', fill: 'rgba(148,163,184,0.12)' },
      ].map((seg, i) => (
        <g key={i}>
          <rect x="28" y={seg.y} width={seg.w} height="38" rx="9" fill={seg.fill} stroke={seg.stroke} strokeOpacity="0.5" />
          {Array.from({ length: Math.floor(seg.w / 22) }, (_, j) => (
            <rect
              key={j}
              x={40 + j * 22}
              y={seg.y + 16}
              width={j % 3 === 2 ? 8 : 14}
              height="6"
              rx="3"
              fill={seg.stroke}
              opacity="0.45"
            />
          ))}
          <text x="34" y={seg.y + 12} fontFamily="ui-monospace, monospace" fontSize="8" fill={seg.stroke} opacity="0.9">
            {seg.label}
          </text>
          {i < 2 && (
            <text x={36 + seg.w} y={seg.y + 26} fontFamily="ui-monospace, monospace" fontSize="16" fill="#c4b5fd" opacity="0.6">
              .
            </text>
          )}
        </g>
      ))}

      {/* The key, turning against the signature row */}
      <g transform="translate(292 168)">
        <g>
          <circle cx="0" cy="12" r="13" fill="none" stroke="#c4b5fd" strokeWidth="2.4" />
          <circle cx="0" cy="12" r="4" fill="#120820" stroke="#c4b5fd" strokeWidth="1.6" />
          <path d="M0 25 V52 M0 40 h9 M0 47 h7" stroke="#c4b5fd" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          {animated && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="0 0 12; 90 0 12; 90 0 12; 0 0 12"
              keyTimes="0; 0.3; 0.75; 1"
              dur="5s"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.5 0 0.2 1; 0 0 1 1; 0.5 0 0.2 1"
            />
          )}
        </g>
      </g>

      {/* Verdict lamp */}
      <g transform="translate(300 60)">
        <rect x="-42" y="-16" width="84" height="34" rx="17" fill="rgba(16,185,129,0.12)" stroke="#34d399" strokeOpacity="0.5" />
        <circle cx="-24" cy="1" r="5" fill="#34d399">
          {animated && <animate attributeName="opacity" values="0.3;1;0.3" dur="2.6s" repeatCount="indefinite" />}
        </circle>
        <path d="M-6 1 l5 5 l10 -11" stroke="#34d399" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Verification sweep across the signing input */}
      <rect x="28" y="46" width="236" height="96" fill="url(#jbSweep)" opacity="0.35">
        {animated && <animate attributeName="x" values="-200; 300; -200" dur="6s" repeatCount="indefinite" />}
      </rect>

      {/* Lifetime bar */}
      <rect x="28" y="214" width="336" height="6" rx="3" fill="#ffffff" fillOpacity="0.07" />
      <rect x="28" y="214" width="212" height="6" rx="3" fill="#a78bfa" opacity="0.6">
        {animated && <animate attributeName="width" values="40; 336; 40" dur="8s" repeatCount="indefinite" />}
      </rect>
    </g>

    <rect x="8" y="12" width="384" height="234" rx="18" fill="none" stroke="#ffffff" strokeOpacity="0.08" />
    <text x="200" y="272" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="11" fill="#a78bfa" opacity="0.75">
      header . payload . signature
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

export const IconVerify: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} {...iconProps} aria-hidden="true">
    <path d="M12 3l7 3v5.5c0 4.3-2.9 8.2-7 9.5-4.1-1.3-7-5.2-7-9.5V6l7-3z" />
    <path d="M9 12l2.2 2.2L15.5 10" />
  </svg>
);

export const IconClock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} {...iconProps} aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7v5.4l3.4 2" />
    <path d="M3 4.5l2.5-1.5M21 4.5l-2.5-1.5" />
  </svg>
);

export const IconClaims: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} {...iconProps} aria-hidden="true">
    <rect x="3.5" y="4" width="17" height="16" rx="2.5" />
    <path d="M7 9h4M7 13h4M7 17h3" />
    <path d="M14.5 10.5l1.6 1.6 3-3.2" />
    <path d="M14.5 16h4" opacity="0.5" />
  </svg>
);

export const IconSign: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} {...iconProps} aria-hidden="true">
    <path d="M3 18c3.5 0 4-11 7-11s2.5 8 5 8c1.6 0 2.4-1.4 3-2.6" />
    <path d="M14 20h7" />
    <circle cx="19.5" cy="6" r="2.2" />
  </svg>
);

export const IconKeys: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} {...iconProps} aria-hidden="true">
    <circle cx="7.5" cy="9" r="3.5" />
    <path d="M10 11.5L19 20.5M16.5 18l2-2M19 15.5l1.6-1.6" />
    <path d="M4 16.5h3.5" opacity="0.5" />
  </svg>
);

export const IconAttack: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} {...iconProps} aria-hidden="true">
    <path d="M12 3.5l8.5 15H3.5l8.5-15z" />
    <path d="M12 9.5v4.2M12 16.6h.01" />
  </svg>
);

export const IconLocal: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} {...iconProps} aria-hidden="true">
    <rect x="2.5" y="5" width="19" height="12" rx="2.5" />
    <path d="M8 20h8M12 17v3" />
    <path d="M9.5 11l1.8 1.8L15 9" />
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
    <rect x="1" y="1" width="118" height="78" rx="12" fill="#150a24" stroke="currentColor" strokeOpacity="0.16" />
    {children}
  </svg>
);

export const StepPaste: React.FC<{ className?: string }> = ({ className = '' }) => (
  <StepFrame className={className}>
    <rect x="16" y="26" width="88" height="28" rx="7" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.35" />
    {[24, 52, 80].map((x, i) => (
      <rect key={i} x={x} y="36" width={i === 1 ? 20 : 14} height="7" rx="3.5" fill="currentColor" opacity="0.45" />
    ))}
    <circle cx="45" cy="39.5" r="1.6" fill="currentColor" />
    <circle cx="74" cy="39.5" r="1.6" fill="currentColor" />
    <path d="M60 14v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    <path d="M56 18l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
  </StepFrame>
);

export const StepKey: React.FC<{ className?: string }> = ({ className = '' }) => (
  <StepFrame className={className}>
    <circle cx="40" cy="40" r="11" fill="none" stroke="currentColor" strokeWidth="2.4" />
    <circle cx="40" cy="40" r="3.4" fill="currentColor" opacity="0.7" />
    <path d="M51 40h34M76 40v7M83 40v5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none" />
  </StepFrame>
);

export const StepCheck: React.FC<{ className?: string }> = ({ className = '' }) => (
  <StepFrame className={className}>
    <path d="M60 16l20 7v13c0 10-8 18.5-20 22-12-3.5-20-12-20-22V23l20-7z" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.4" strokeWidth="2" />
    <path d="M51 39l6 6 13-14" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </StepFrame>
);

export const StepShip: React.FC<{ className?: string }> = ({ className = '' }) => (
  <StepFrame className={className}>
    <rect x="14" y="24" width="40" height="32" rx="7" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.35" />
    <path d="M22 34h24M22 40h18M22 46h20" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.5" />
    <path d="M62 40h20M76 34l6 6-6 6" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    <rect x="88" y="26" width="18" height="28" rx="5" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="2" />
    <path d="M97 33v12M93 41l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
  </StepFrame>
);

export const STEP_ART = [StepPaste, StepKey, StepCheck, StepShip];
