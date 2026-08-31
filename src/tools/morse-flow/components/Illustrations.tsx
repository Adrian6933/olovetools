import React from 'react';

// ============================================================================
// Bespoke SVG artwork for MorseFlow, in the tool's amber palette.
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
// Hero: a straight key closing, the keyed envelope it produces, and the same
// pattern coming back the other way as a decoded waveform.
// ---------------------------------------------------------------------------
export const MorseHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 400 300" className={className} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="mfGlow" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#451a03" />
        <stop offset="55%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#fcd34d" />
      </linearGradient>
      <clipPath id="mfFrame">
        <rect x="8" y="12" width="384" height="234" rx="18" />
      </clipPath>
    </defs>

    <g clipPath="url(#mfFrame)">
      <rect x="8" y="12" width="384" height="234" fill="#150d02" />
      <circle cx="332" cy="30" r="92" fill="url(#mfGlow)" opacity="0.16" />

      {/* The key: base, pivot, lever, knob */}
      <g transform="translate(34 118)">
        <rect x="-6" y="52" width="118" height="12" rx="4" fill="#3b2408" stroke="#f59e0b" strokeOpacity="0.35" />
        <circle cx="88" cy="52" r="4" fill="#fbbf24" opacity="0.7" />
        <rect x="20" y="30" width="8" height="24" rx="2" fill="#78350f" />
        <g>
          <rect x="18" y="24" width="86" height="7" rx="3.5" fill="#92400e" stroke="#fbbf24" strokeOpacity="0.45" />
          <circle cx="104" cy="27" r="9" fill="#1c1206" stroke="#fbbf24" strokeWidth="2" />
          {animated && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="0 24 27; 7 24 27; 0 24 27; 7 24 27; 0 24 27"
              keyTimes="0; 0.12; 0.24; 0.36; 1"
              dur="2.4s"
              repeatCount="indefinite"
            />
          )}
        </g>
        {/* Contact spark */}
        <circle cx="88" cy="46" r="3" fill="#fde68a">
          {animated && <animate attributeName="opacity" values="0;1;0;1;0;0" keyTimes="0;0.13;0.2;0.37;0.44;1" dur="2.4s" repeatCount="indefinite" />}
        </circle>
      </g>

      {/* Keyed envelope: SOS, with the real 1/3/1/3/7 proportions */}
      <g transform="translate(152 40)">
        <text x="0" y="0" fontFamily="ui-monospace, monospace" fontSize="8" fill="#fbbf24" opacity="0.7">
          sent
        </text>
        <line x1="0" y1="34" x2="222" y2="34" stroke="#ffffff" strokeOpacity="0.1" />
        {[
          [0, 6], [12, 6], [24, 6],
          [42, 18], [66, 18], [90, 18],
          [120, 6], [132, 6], [144, 6],
        ].map(([x, w], i) => (
          <rect key={i} x={x} y="14" width={w} height="20" rx="2.5" fill="#fbbf24" opacity="0.85">
            {animated && (
              <animate attributeName="opacity" values="0.2;0.2;0.95;0.95;0.2" keyTimes={`0;${0.05 + i * 0.09};${0.1 + i * 0.09};0.9;1`} dur="4.5s" repeatCount="indefinite" />
            )}
          </rect>
        ))}
        <text x="0" y="50" fontFamily="ui-monospace, monospace" fontSize="9" fill="#fde68a" opacity="0.75">
          ... --- ...
        </text>
      </g>

      {/* Received: a noisy envelope with the detection threshold across it */}
      <g transform="translate(152 150)">
        <text x="0" y="0" fontFamily="ui-monospace, monospace" fontSize="8" fill="#fbbf24" opacity="0.7">
          heard
        </text>
        <line x1="0" y1="44" x2="222" y2="44" stroke="#ffffff" strokeOpacity="0.1" />
        {Array.from({ length: 74 }, (_, i) => {
          const marks = [[0, 4], [8, 4], [16, 4], [28, 12], [44, 12], [60, 12], [78, 4]];
          const on = marks.some(([start, len]) => i >= start && i < start + len);
          const height = on ? 22 + ((i * 7) % 5) : 2 + ((i * 3) % 3);
          return <rect key={i} x={i * 3} y={44 - height} width="2" height={height} rx="1" fill={on ? '#f59e0b' : '#78716c'} opacity={on ? 0.9 : 0.5} />;
        })}
        <line x1="0" y1="30" x2="222" y2="30" stroke="#fde68a" strokeDasharray="3 4" strokeWidth="1" opacity="0.65" />
        <text x="226" y="33" fontFamily="ui-monospace, monospace" fontSize="7" fill="#fde68a" opacity="0.7" textAnchor="end">
          threshold
        </text>
      </g>

      {/* Tone marker */}
      <text x="34" y="228" fontFamily="ui-monospace, monospace" fontSize="9" fill="#fbbf24" opacity="0.6">
        600 Hz · 20 wpm
      </text>
    </g>

    <rect x="8" y="12" width="384" height="234" rx="18" fill="none" stroke="#ffffff" strokeOpacity="0.08" />
    <text x="200" y="272" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="11" fill="#f59e0b" opacity="0.75">
      · · · — — — · · ·
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

export const IconAlphabet: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} {...iconProps} aria-hidden="true">
    <path d="M3 17L6.5 7l3.5 10M4.2 14h4.6" />
    <path d="M14 17h3.5a2.5 2.5 0 0 0 0-5H14v10-15h3a2.5 2.5 0 0 1 0 5" opacity="0.9" />
  </svg>
);

export const IconTone: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} {...iconProps} aria-hidden="true">
    <path d="M2 12c1.6-6 3.2-6 4.8 0s3.2 6 4.8 0 3.2-6 4.8 0 3.2 6 4.8 0" />
  </svg>
);

export const IconEar: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} {...iconProps} aria-hidden="true">
    <path d="M7 9a5 5 0 0 1 10 0c0 3-2.5 3.8-3.4 5.4-.6 1-.3 2.4-1.6 3.1-1.2.6-2.5.1-3-1" />
    <path d="M10.5 9.2a1.7 1.7 0 0 1 3 1" />
    <path d="M4 5.5L2.5 4M4 12H2M4.6 18.4L3 20" opacity="0.5" />
  </svg>
);

export const IconFarnsworth: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} {...iconProps} aria-hidden="true">
    <path d="M3 12h3M9 12h1.5M14 12h6" />
    <path d="M3 7v10M20 7v10" opacity="0.5" />
    <path d="M6.5 9.5l1.5 2.5-1.5 2.5" opacity="0.7" />
  </svg>
);

export const IconTimeline: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} {...iconProps} aria-hidden="true">
    <rect x="2.5" y="9" width="3" height="6" rx="1" />
    <rect x="7.5" y="9" width="7" height="6" rx="1" />
    <rect x="16.5" y="9" width="3" height="6" rx="1" />
    <path d="M2.5 19h19" opacity="0.4" />
  </svg>
);

export const IconExport: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} {...iconProps} aria-hidden="true">
    <path d="M12 3v11M8 10.5l4 4 4-4" />
    <path d="M4 17v2.5a1.5 1.5 0 0 0 1.5 1.5h13a1.5 1.5 0 0 0 1.5-1.5V17" />
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
    <rect x="1" y="1" width="118" height="78" rx="12" fill="#1c1206" stroke="currentColor" strokeOpacity="0.16" />
    {children}
  </svg>
);

export const StepType: React.FC<{ className?: string }> = ({ className = '' }) => (
  <StepFrame className={className}>
    <rect x="18" y="24" width="84" height="32" rx="6" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.35" />
    <path d="M26 40h10M40 40h6M50 40h14M68 40h8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
    <rect x="82" y="34" width="2" height="12" fill="currentColor" opacity="0.9" />
  </StepFrame>
);

export const StepShape: React.FC<{ className?: string }> = ({ className = '' }) => (
  <StepFrame className={className}>
    <line x1="14" y1="52" x2="106" y2="52" stroke="currentColor" strokeOpacity="0.25" />
    {[[16, 6], [26, 6], [36, 6], [50, 18], [74, 18]].map(([x, w], i) => (
      <rect key={i} x={x} y="26" width={w} height="26" rx="3" fill="currentColor" opacity="0.75" />
    ))}
    <path d="M16 26q3 -8 6 0" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
  </StepFrame>
);

export const StepListen: React.FC<{ className?: string }> = ({ className = '' }) => (
  <StepFrame className={className}>
    {Array.from({ length: 30 }, (_, i) => {
      const on = (i > 4 && i < 9) || (i > 13 && i < 22);
      const h = on ? 26 + ((i * 5) % 8) : 4 + ((i * 3) % 4);
      return <rect key={i} x={12 + i * 3.2} y={52 - h} width="2" height={h} rx="1" fill="currentColor" opacity={on ? 0.85 : 0.35} />;
    })}
    <line x1="10" y1="34" x2="110" y2="34" stroke="currentColor" strokeDasharray="3 3" strokeWidth="1.4" opacity="0.8" />
    <text x="60" y="68" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="9" fill="currentColor" opacity="0.7">
      .- .-. ..
    </text>
  </StepFrame>
);

export const StepShare: React.FC<{ className?: string }> = ({ className = '' }) => (
  <StepFrame className={className}>
    <rect x="16" y="22" width="36" height="36" rx="6" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.35" />
    <path d="M24 34h20M24 40h14M24 46h18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.5" />
    <path d="M60 40h20M74 34l6 6-6 6" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.65" />
    <rect x="86" y="26" width="18" height="28" rx="5" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="2" />
    <path d="M95 33v12M91 41l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
  </StepFrame>
);

export const STEP_ART = [StepType, StepShape, StepListen, StepShare];
