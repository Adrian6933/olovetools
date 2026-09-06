import React from 'react';

// ============================================================================
// Bespoke SVG artwork for AudioSnap, in the tool's rose palette.
// Every animation is SMIL and gated behind `animated`, which the caller wires
// to prefers-reduced-motion.
// ============================================================================

interface ArtProps {
  className?: string;
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Hero: a mic feeding a waveform that is being sliced between two edit points —
// record, then cut, which is the whole tool in one picture.
// ---------------------------------------------------------------------------
export const StudioHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => {
  // Deterministic pseudo-random bars: a fixed silhouette beats Math.random(),
  // which would give a different hero on every hydration.
  const bars = [
    18, 34, 52, 28, 66, 84, 46, 72, 96, 58, 38, 74, 92, 62, 44, 80, 54, 30, 68, 88, 50, 26, 42, 76, 60, 34, 22,
  ];

  return (
    <svg viewBox="2 18 394 234" className={className} role="img" aria-hidden="true">
      <defs>
        <linearGradient id="asHeroWave" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fda4af" />
          <stop offset="100%" stopColor="#be123c" />
        </linearGradient>
        <linearGradient id="asHeroMic" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#881337" />
        </linearGradient>
        <clipPath id="asHeroClip">
          <rect x="120" y="46" width="260" height="150" rx="16" />
        </clipPath>
      </defs>

      {/* Microphone */}
      <g transform="translate(24,44)">
        <rect x="20" y="0" width="40" height="72" rx="20" fill="url(#asHeroMic)" />
        <path d="M20 24h40M20 40h40" stroke="#4c0519" strokeWidth="2" opacity="0.45" />
        <path d="M10 58a30 30 0 0 0 60 0" fill="none" stroke="#fb7185" strokeWidth="5" strokeLinecap="round" />
        <path d="M40 88v20" stroke="#fb7185" strokeWidth="5" strokeLinecap="round" />
        <path d="M22 110h36" stroke="#fb7185" strokeWidth="5" strokeLinecap="round" />
        {animated && (
          <circle cx="40" cy="36" r="46" fill="none" stroke="#f43f5e" strokeWidth="1.5" opacity="0.35">
            <animate attributeName="r" values="34;58;34" dur="3.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0;0.4" dur="3.2s" repeatCount="indefinite" />
          </circle>
        )}
      </g>

      {/* Waveform panel */}
      <rect x="120" y="46" width="260" height="150" rx="16" fill="#0b0509" stroke="rgba(244,63,94,0.2)" strokeWidth="1.5" />
      <g clipPath="url(#asHeroClip)">
        {/* Selected region */}
        <rect x="176" y="46" width="150" height="150" fill="#f43f5e" opacity="0.09" />
        <line x1="120" y1="121" x2="380" y2="121" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1" />

        {bars.map((value, i) => {
          const x = 132 + i * 9;
          const selected = x >= 176 && x <= 326;
          const half = value / 2;
          return (
            <rect
              key={i}
              x={x}
              y={121 - half}
              width="4.5"
              height={value}
              rx="2.2"
              fill={selected ? 'url(#asHeroWave)' : '#64748b'}
              opacity={selected ? 1 : 0.3}
            >
              {animated && selected && (
                <animate
                  attributeName="height"
                  values={`${value};${Math.max(10, value * 0.55)};${value}`}
                  dur={`${2 + (i % 5) * 0.35}s`}
                  repeatCount="indefinite"
                />
              )}
              {animated && selected && (
                <animate
                  attributeName="y"
                  values={`${121 - half};${121 - Math.max(5, half * 0.55)};${121 - half}`}
                  dur={`${2 + (i % 5) * 0.35}s`}
                  repeatCount="indefinite"
                />
              )}
            </rect>
          );
        })}

        {/* Playhead sweeping the selection */}
        {animated && (
          <rect x="176" y="46" width="1.6" height="150" fill="#ffffff" opacity="0.85">
            <animate attributeName="x" values="176;326;176" dur="5.4s" repeatCount="indefinite" />
          </rect>
        )}
      </g>

      {/* Edit handles */}
      {[176, 326].map(x => (
        <g key={x}>
          <rect x={x - 1.5} y="46" width="3" height="150" fill="#f43f5e" />
          <rect x={x - 6} y="50" width="12" height="18" rx="3" fill="#f43f5e" />
        </g>
      ))}

      {/* Export chip */}
      <g transform="translate(240,206)">
        <rect x="0" y="0" width="118" height="30" rx="10" fill="#f43f5e" opacity="0.14" stroke="#f43f5e" strokeOpacity="0.4" />
        <path d="M22 9v10M17.5 15l4.5 4.5 4.5-4.5" stroke="#fda4af" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <rect x="38" y="11" width="62" height="7" rx="3.5" fill="#fda4af" opacity="0.55" />
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Idle placeholder for the empty workspace.
// ---------------------------------------------------------------------------
export const WaveIdleArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 160 96" className={className} role="img" aria-hidden="true">
    <line x1="6" y1="48" x2="154" y2="48" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
    {[22, 40, 58, 30, 68, 46, 74, 52, 36, 62, 44, 26].map((value, i) => (
      <rect
        key={i}
        x={12 + i * 12}
        y={48 - value / 2}
        width="6"
        height={value}
        rx="3"
        fill="currentColor"
        opacity={0.25 + (i % 3) * 0.16}
      >
        {animated && (
          <>
            <animate
              attributeName="height"
              values={`${value};${Math.max(6, value * 0.4)};${value}`}
              dur={`${1.8 + (i % 4) * 0.3}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="y"
              values={`${48 - value / 2};${48 - Math.max(3, value * 0.2)};${48 - value / 2}`}
              dur={`${1.8 + (i % 4) * 0.3}s`}
              repeatCount="indefinite"
            />
          </>
        )}
      </rect>
    ))}
  </svg>
);

// ---------------------------------------------------------------------------
// Feature icons
// ---------------------------------------------------------------------------
const iconBase = 'w-6 h-6';
const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** Waveform between two cut markers. */
export const IconTrim: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke} aria-hidden="true">
    <path d="M4 4v16M20 4v16" opacity="0.55" />
    <path d="M8 9v6M11 6.5v11M14 8v8M17 10.5v3" />
  </svg>
);

/** Mic with tuning marks: the capture settings. */
export const IconCapture: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke} aria-hidden="true">
    <rect x="9" y="2.6" width="6" height="11" rx="3" />
    <path d="M5.6 11.4a6.4 6.4 0 0 0 12.8 0M12 17.8v3.6M9 21.4h6" />
    <path d="M2.6 6.4h3M2.6 9.6h3M18.4 6.4h3M18.4 9.6h3" opacity="0.55" />
  </svg>
);

/** Stacked layers with an arrow back: non-destructive editing. */
export const IconNonDestructive: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke} aria-hidden="true">
    <path d="m12 3 8.4 4.4L12 11.8 3.6 7.4Z" />
    <path d="m3.6 12 8.4 4.4 8.4-4.4" opacity="0.6" />
    <path d="M8.4 20.6a5 5 0 1 0-2-4M6.4 13v3.6h3.6" opacity="0.85" />
  </svg>
);

/** A meter face: the measured levels. */
export const IconMeter: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke} aria-hidden="true">
    <path d="M3.4 17.4a9 9 0 1 1 17.2 0" />
    <path d="M12 17.4 16.4 10" />
    <circle cx="12" cy="17.4" r="1.4" fill="currentColor" stroke="none" />
    <path d="M5.4 12.4h1.6M17 12.4h1.6M11.2 6.4h1.6" opacity="0.55" />
  </svg>
);

/** Lock over a wave: nothing leaves the tab. */
export const IconLocalAudio: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke} aria-hidden="true">
    <rect x="4.4" y="10.6" width="15.2" height="10.4" rx="2.6" />
    <path d="M8.4 10.6V7.8a3.6 3.6 0 0 1 7.2 0v2.8" />
    <path d="M9 15.8v1.6M12 14.2v4.8M15 15.8v1.6" opacity="0.9" />
  </svg>
);

/** File with a rate badge: the export choices. */
export const IconExport: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke} aria-hidden="true">
    <path d="M13.4 2.8H7.2a2.2 2.2 0 0 0-2.2 2.2v14a2.2 2.2 0 0 0 2.2 2.2h9.6a2.2 2.2 0 0 0 2.2-2.2V8.4Z" />
    <path d="M13.4 2.8v5.6H19" opacity="0.6" />
    <path d="M12 11.6v5.2M9.6 14.4 12 16.8l2.4-2.4" />
  </svg>
);

// ---------------------------------------------------------------------------
// "How it works" step artwork
// ---------------------------------------------------------------------------
export const StepCapture: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 80" className={className} fill="none" aria-hidden="true">
    <rect x="14" y="12" width="22" height="34" rx="11" stroke="currentColor" strokeWidth="2.4" opacity="0.75" />
    <path d="M8 40a17 17 0 0 0 34 0M25 57v9M17 66h16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.55" />
    <path d="M56 40h8M70 40h8M84 40h8" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity="0.3" />
    <rect x="60" y="16" width="46" height="30" rx="7" stroke="currentColor" strokeWidth="2.2" opacity="0.45" />
    <path d="M68 36v-9M76 39v-15M84 34v-5M92 38v-13M100 36v-9" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity="0.8" />
  </svg>
);

export const StepShape: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 80" className={className} fill="none" aria-hidden="true">
    <rect x="10" y="18" width="100" height="42" rx="8" stroke="currentColor" strokeWidth="2.2" opacity="0.4" />
    <rect x="40" y="18" width="44" height="42" fill="currentColor" opacity="0.12" />
    <path d="M40 18v42M84 18v42" stroke="currentColor" strokeWidth="2.8" />
    <rect x="35" y="21" width="10" height="12" rx="3" fill="currentColor" opacity="0.9" />
    <rect x="79" y="21" width="10" height="12" rx="3" fill="currentColor" opacity="0.9" />
    <path d="M18 39v-6M25 39v-11M32 39v-4M48 39v-14M55 39v-8M62 39v-17M69 39v-9M76 39v-13M92 39v-5M99 39v-9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.65" />
  </svg>
);

export const StepPolish: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 80" className={className} fill="none" aria-hidden="true">
    <path d="M12 62 34 22" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity="0.55" />
    <path d="M108 62 86 22" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity="0.55" />
    <path d="M34 22h52" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity="0.3" strokeDasharray="5 6" />
    <path d="M12 62h96" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.35" />
    <path d="M46 55v-18M54 55v-26M62 55v-12M70 55v-22M78 55v-16" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity="0.8" />
    <circle cx="34" cy="22" r="3.4" fill="currentColor" />
    <circle cx="86" cy="22" r="3.4" fill="currentColor" />
  </svg>
);

export const StepExport: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 80" className={className} fill="none" aria-hidden="true">
    <rect x="16" y="12" width="42" height="52" rx="7" stroke="currentColor" strokeWidth="2.2" opacity="0.5" />
    <path d="M26 28h22M26 36h22M26 44h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.55" />
    <path d="M68 38h24M84 30l8 8-8 8" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="96" y="22" width="12" height="32" rx="4" stroke="currentColor" strokeWidth="2.2" opacity="0.6" />
    <path d="M102 30v16" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity="0.8" />
  </svg>
);
