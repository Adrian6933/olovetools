import React from 'react';

// ============================================================================
// Bespoke SVG artwork for ColorSnap, in the tool's rose palette.
// Nothing here is an emoji or a recycled lucide glyph.
// ============================================================================

interface ArtProps {
  className?: string;
  /** Turns off the SMIL animations for anyone who asked for reduced motion. */
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Hero — a photograph being read column by column, with the colours it is made
// of settling into a row of swatches underneath.
// ---------------------------------------------------------------------------
export const ColorHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 400 280" className={className} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="csSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4c1d3d" />
        <stop offset="55%" stopColor="#9f1239" />
        <stop offset="100%" stopColor="#f97316" />
      </linearGradient>
      <linearGradient id="csBeam" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#fda4af" stopOpacity="0" />
        <stop offset="50%" stopColor="#fda4af" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#fda4af" stopOpacity="0" />
      </linearGradient>
      <clipPath id="csFrame">
        <rect x="26" y="26" width="230" height="156" rx="16" />
      </clipPath>
    </defs>

    {/* Photograph */}
    <rect x="26" y="26" width="230" height="156" rx="16" fill="#1a0509" />
    <g clipPath="url(#csFrame)">
      <rect x="26" y="26" width="230" height="156" fill="url(#csSky)" />
      {/* Sun */}
      <circle cx="188" cy="92" r="20" fill="#fbbf24" opacity="0.9" />
      {/* Hills */}
      <path d="M26 150 Q80 106 132 142 Q176 168 210 138 Q240 114 256 132 L256 182 L26 182 Z" fill="#4a044e" opacity="0.92" />
      <path d="M26 166 Q74 138 122 162 Q170 186 220 158 L256 168 L256 182 L26 182 Z" fill="#1e1b4b" opacity="0.85" />
      {/* Reading beam */}
      <rect x="26" y="26" width="26" height="156" fill="url(#csBeam)">
        {animated && (
          <animate attributeName="x" values="20;236;20" dur="6s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.5;1" />
        )}
      </rect>
    </g>
    <rect x="26" y="26" width="230" height="156" rx="16" fill="none" stroke="#4c0519" strokeWidth="1.5" />

    {/* Swatch column being emitted */}
    <g transform="translate(288,26)">
      {[
        { c: '#f97316', d: '0s' },
        { c: '#e11d48', d: '0.35s' },
        { c: '#9f1239', d: '0.7s' },
        { c: '#4a044e', d: '1.05s' },
        { c: '#fbbf24', d: '1.4s' },
      ].map((s, i) => (
        <g key={i} transform={`translate(0,${i * 32})`}>
          <rect width="86" height="24" rx="7" fill={s.c}>
            {animated && (
              <animate attributeName="opacity" values="0.35;1;0.35" dur="6s" begin={s.d} repeatCount="indefinite" />
            )}
          </rect>
          <rect width="86" height="24" rx="7" fill="none" stroke="#000" strokeOpacity="0.25" />
        </g>
      ))}
    </g>

    {/* Result strip */}
    <g transform="translate(26,200)">
      {['#f97316', '#e11d48', '#9f1239', '#4a044e', '#fbbf24', '#fecdd3'].map((c, i) => (
        <rect key={i} x={i * 39} width="35" height="46" rx="10" fill={c}>
          {animated && (
            <animate
              attributeName="height"
              values="46;54;46"
              dur="4s"
              begin={`${i * 0.18}s`}
              repeatCount="indefinite"
            />
          )}
        </rect>
      ))}
    </g>

    {/* Cursor with a loupe, sitting on the photograph */}
    <g transform="translate(150,120)">
      <circle r="17" fill="#0a0204" stroke="#fda4af" strokeWidth="2" />
      <circle r="10" fill="#e11d48" />
      <path d="M0 -24 L0 -19 M0 19 L0 24 M-24 0 L-19 0 M19 0 L24 0" stroke="#fda4af" strokeWidth="2" strokeLinecap="round" />
      {animated && (
        <animateTransform
          attributeName="transform"
          type="translate"
          values="150,120; 96,86; 206,142; 150,120"
          dur="9s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.45 0 0.2 1;0.45 0 0.2 1;0.45 0 0.2 1"
          keyTimes="0;0.33;0.66;1"
        />
      )}
    </g>
  </svg>
);

// ---------------------------------------------------------------------------
// How it works — four small pieces of art, one per step
// ---------------------------------------------------------------------------

export const StepDrop: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} role="img" aria-hidden="true">
    <rect x="8" y="14" width="104" height="62" rx="12" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="7 6" opacity="0.5" />
    <rect x="30" y="30" width="46" height="34" rx="6" fill="currentColor" opacity="0.16" />
    <path d="M34 60 L48 44 L58 54 L68 42 L74 60 Z" fill="currentColor" opacity="0.55" />
    <circle cx="64" cy="38" r="4.5" fill="currentColor" opacity="0.75" />
    <path d="M88 32 L88 52 M80 44 L88 52 L96 44" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const StepTune: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} role="img" aria-hidden="true">
    {[0, 1, 2].map(i => (
      <g key={i} transform={`translate(0,${20 + i * 22})`}>
        <rect x="14" y="4" width="92" height="5" rx="2.5" fill="currentColor" opacity="0.2" />
        <rect x="14" y="4" width={[62, 34, 80][i]} height="5" rx="2.5" fill="currentColor" opacity="0.65" />
        <circle cx={14 + [62, 34, 80][i]} cy="6.5" r="8" fill="#0a0204" stroke="currentColor" strokeWidth="2.5" />
      </g>
    ))}
  </svg>
);

export const StepExtract: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} role="img" aria-hidden="true">
    <circle cx="42" cy="45" r="26" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.35" />
    <circle cx="42" cy="45" r="16" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.55" />
    <circle cx="42" cy="45" r="6" fill="currentColor" />
    <path d="M74 45 L96 45 M88 37 L96 45 L88 53" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    <g transform="translate(78,22)">
      {[0, 1, 2, 3].map(i => (
        <rect key={i} y={i * 12} width="30" height="8" rx="3" fill="currentColor" opacity={0.85 - i * 0.16} />
      ))}
    </g>
  </svg>
);

export const StepRefine: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} role="img" aria-hidden="true">
    <rect x="12" y="20" width="42" height="50" rx="9" fill="currentColor" opacity="0.2" />
    <rect x="66" y="20" width="42" height="50" rx="9" fill="currentColor" opacity="0.5" />
    <path d="M60 26 L60 64" stroke="currentColor" strokeWidth="2" strokeDasharray="4 5" opacity="0.45" />
    <path d="M22 56 L32 44 L40 50 L46 40" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    <circle cx="87" cy="38" r="7" fill="#0a0204" stroke="currentColor" strokeWidth="2.5" />
    <path d="M76 56 L98 56" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
  </svg>
);

// ---------------------------------------------------------------------------
// Feature icons — drawn for this tool, not borrowed
// ---------------------------------------------------------------------------

type IconProps = { className?: string };

export const IconPerceptual: React.FC<IconProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3a9 9 0 0 0 0 18" fill="currentColor" fillOpacity="0.18" stroke="none" />
    <path d="M7.5 9.5 12 12l4.5-2.5M12 12v5" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);

export const IconLoupe: React.FC<IconProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.5 15.5 21 21" />
    <path d="M8 10.5h5M10.5 8v5" opacity="0.7" />
  </svg>
);

export const IconLock: React.FC<IconProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="10.5" width="7" height="9" rx="2" fill="currentColor" fillOpacity="0.2" />
    <path d="M5.8 10.5V8.2a1.7 1.7 0 0 1 3.4 0v2.3" />
    <rect x="14" y="5" width="6" height="6" rx="1.6" opacity="0.55" />
    <rect x="14" y="13.5" width="6" height="6" rx="1.6" opacity="0.35" />
  </svg>
);

export const IconContrast: React.FC<IconProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" stroke="none" />
    <path d="M17.5 6.5 6.5 17.5" opacity="0.4" />
  </svg>
);

export const IconLocal: React.FC<IconProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3 4.5 6v5.4c0 4.4 3.1 8.2 7.5 9.6 4.4-1.4 7.5-5.2 7.5-9.6V6z" fill="currentColor" fillOpacity="0.15" />
    <path d="M9 12.2h6M12 9.2v6" opacity="0.8" />
  </svg>
);

export const IconExport: React.FC<IconProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3.5" y="4.5" width="11" height="15" rx="2" fill="currentColor" fillOpacity="0.15" />
    <path d="M6.5 8.5h5M6.5 12h5M6.5 15.5h3" opacity="0.75" />
    <path d="M17 9v7M13.8 12.8 17 16l3.2-3.2" />
  </svg>
);
