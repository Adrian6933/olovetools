import React from 'react';

// ============================================================================
// Bespoke SVG artwork for the Lottie Viewer.
//
// All inline, self-contained, themed with the tool's indigo/cyan palette. The
// hero animates with SMIL, which every target browser supports and which stops
// dead when `animated` is false — the caller passes `!prefersReducedMotion`.
// ============================================================================

interface ArtProps {
  className?: string;
  /** Disables the SMIL animations for users who asked for reduced motion. */
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Hero: a vector shape sitting on a timeline, with a playhead sweeping across
// it and the shape's colour swatches lit up underneath. That is the tool.
// ---------------------------------------------------------------------------
export const PlayerHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 400 300" className={className} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="lvStage" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1e1b4b" />
        <stop offset="100%" stopColor="#0b0a1f" />
      </linearGradient>
      <linearGradient id="lvShape" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#818cf8" />
        <stop offset="55%" stopColor="#d946ef" />
        <stop offset="100%" stopColor="#22d3ee" />
      </linearGradient>
      <linearGradient id="lvHead" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
        <stop offset="35%" stopColor="#22d3ee" stopOpacity="1" />
        <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
      </linearGradient>

      <pattern id="lvChecker" width="16" height="16" patternUnits="userSpaceOnUse">
        <rect width="16" height="16" fill="#0d0b1c" />
        <rect width="8" height="8" fill="#161233" />
        <rect x="8" y="8" width="8" height="8" fill="#161233" />
      </pattern>

      <clipPath id="lvStageClip">
        <rect x="18" y="18" width="364" height="192" rx="22" />
      </clipPath>

      <filter id="lvGlow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="6" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* Stage */}
    <g clipPath="url(#lvStageClip)">
      <rect x="18" y="18" width="364" height="192" fill="url(#lvChecker)" />
      <rect x="18" y="18" width="364" height="192" fill="url(#lvStage)" opacity="0.72" />

      {/* The animated vector: three bars scaling on their own offsets, i.e. an
          actual Lottie loader drawn by hand. */}
      <g transform="translate(200 114)">
        {[-46, 0, 46].map((x, i) => (
          <rect key={x} x={x - 13} y={-34} width="26" height="68" rx="9" fill="url(#lvShape)">
            {animated && (
              <animate
                attributeName="height"
                values="26;68;26"
                dur="1.8s"
                begin={`${i * 0.22}s`}
                repeatCount="indefinite"
                calcMode="spline"
                keyTimes="0;0.5;1"
                keySplines="0.4 0 0.2 1;0.4 0 0.2 1"
              />
            )}
            {animated && (
              <animate
                attributeName="y"
                values="-13;-34;-13"
                dur="1.8s"
                begin={`${i * 0.22}s`}
                repeatCount="indefinite"
                calcMode="spline"
                keyTimes="0;0.5;1"
                keySplines="0.4 0 0.2 1;0.4 0 0.2 1"
              />
            )}
          </rect>
        ))}
      </g>

      {/* Playhead sweeping the stage */}
      <rect y="18" width="3" height="192" fill="url(#lvHead)" filter="url(#lvGlow)" x={animated ? 40 : 220}>
        {animated && (
          <animate
            attributeName="x"
            values="40;356;40"
            dur="4.5s"
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes="0;0.5;1"
            keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
          />
        )}
      </rect>
    </g>
    <rect x="18" y="18" width="364" height="192" rx="22" fill="none" stroke="#ffffff" strokeOpacity="0.1" />

    {/* Timeline track */}
    <rect x="18" y="232" width="364" height="8" rx="4" fill="#ffffff" fillOpacity="0.08" />
    <rect x="18" y="232" height="8" rx="4" fill="#6366f1" width={animated ? 90 : 190}>
      {animated && (
        <animate attributeName="width" values="30;364;30" dur="4.5s" repeatCount="indefinite" />
      )}
    </rect>

    {/* Colour swatches */}
    <g>
      {['#818cf8', '#d946ef', '#22d3ee', '#34d399'].map((color, i) => (
        <g key={color} transform={`translate(${18 + i * 46} 260)`}>
          <rect width="34" height="26" rx="8" fill={color} />
          <rect width="34" height="26" rx="8" fill="none" stroke="#ffffff" strokeOpacity="0.18" />
          {animated && (
            <animate
              attributeName="opacity"
              values="0.5;1;0.5"
              dur="3s"
              begin={`${i * 0.3}s`}
              repeatCount="indefinite"
            />
          )}
        </g>
      ))}
      <rect x="212" y="260" width="170" height="26" rx="8" fill="#ffffff" fillOpacity="0.05" />
      <rect x="222" y="270" width="86" height="6" rx="3" fill="#ffffff" fillOpacity="0.18" />
      <rect x="316" y="268" width="56" height="10" rx="5" fill="#22d3ee" fillOpacity="0.35" />
    </g>
  </svg>
);

// ---------------------------------------------------------------------------
// How-it-works step art
// ---------------------------------------------------------------------------

const stepStroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** 1 — a file dropping into a tray, with the three accepted containers named. */
export const StepDropArt: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} role="img" aria-hidden="true">
    <rect x="8" y="52" width="104" height="30" rx="10" {...stepStroke} strokeOpacity="0.35" />
    <path d="M60 12v30m0 0l-11-11m11 11l11-11" {...stepStroke} />
    <rect x="34" y="46" width="52" height="4" rx="2" fill="currentColor" opacity="0.25" />
    <g opacity="0.55">
      <rect x="16" y="62" width="26" height="10" rx="5" {...stepStroke} strokeWidth={1.6} />
      <rect x="47" y="62" width="26" height="10" rx="5" {...stepStroke} strokeWidth={1.6} />
      <rect x="78" y="62" width="26" height="10" rx="5" {...stepStroke} strokeWidth={1.6} />
    </g>
  </svg>
);

/** 2 — a checklist: the compatibility report you get before anything renders. */
export const StepInspectArt: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} role="img" aria-hidden="true">
    <rect x="18" y="10" width="84" height="70" rx="12" {...stepStroke} strokeOpacity="0.45" />
    {[26, 42, 58].map((y, i) => (
      <g key={y}>
        <circle cx="36" cy={y + 4} r="6" {...stepStroke} strokeWidth={1.8} />
        {i === 2 ? (
          <path d={`M33 ${y + 1}l6 6m0-6l-6 6`} {...stepStroke} strokeWidth={1.8} />
        ) : (
          <path d={`M33 ${y + 4}l2.5 2.5L39 ${y + 1}`} {...stepStroke} strokeWidth={1.8} />
        )}
        <rect x="50" y={y} width={i === 1 ? 34 : 42} height="7" rx="3.5" fill="currentColor" opacity="0.22" />
      </g>
    ))}
  </svg>
);

/** 3 — colour swatches feeding a shape: the palette editor. */
export const StepRecolorArt: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} role="img" aria-hidden="true">
    <rect x="12" y="18" width="20" height="20" rx="6" fill="currentColor" opacity="0.85" />
    <rect x="12" y="44" width="20" height="20" rx="6" fill="currentColor" opacity="0.45" />
    <path d="M38 28h16a8 8 0 018 8v4M38 54h16a8 8 0 008-8v-2" {...stepStroke} strokeOpacity="0.5" />
    <circle cx="84" cy="44" r="22" {...stepStroke} />
    <path d="M84 22a22 22 0 010 44z" fill="currentColor" opacity="0.3" />
  </svg>
);

/** 4 — one source fanning out into the export formats. */
export const StepExportArt: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} role="img" aria-hidden="true">
    <rect x="10" y="32" width="30" height="26" rx="8" {...stepStroke} />
    <path d="M40 45h16M56 45V22h20M56 45v23h20M56 45h20" {...stepStroke} strokeOpacity="0.5" />
    <rect x="78" y="14" width="30" height="16" rx="6" {...stepStroke} strokeWidth={1.8} />
    <rect x="78" y="37" width="30" height="16" rx="6" {...stepStroke} strokeWidth={1.8} />
    <rect x="78" y="60" width="30" height="16" rx="6" {...stepStroke} strokeWidth={1.8} />
  </svg>
);

// ---------------------------------------------------------------------------
// Feature icons — drawn for this tool, not borrowed from a generic icon set.
// ---------------------------------------------------------------------------

/** A shape whose two halves carry different colours: the palette editor. */
export const IconPalette: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} role="img" aria-hidden="true">
    <path
      d="M12 3a9 9 0 000 18c1.1 0 1.7-.8 1.7-1.6 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.7-1.6 1.6-1.6h1.5A5.2 5.2 0 0021 10.2C21 6.2 16.9 3 12 3z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    />
    <circle cx="8" cy="9.5" r="1.4" fill="currentColor" />
    <circle cx="12.5" cy="7" r="1.4" fill="currentColor" />
    <circle cx="16.5" cy="9.8" r="1.4" fill="currentColor" />
    <circle cx="7.6" cy="14.4" r="1.4" fill="currentColor" />
  </svg>
);

/** A stack of layers with an eye: the layer tree. */
export const IconLayers: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} role="img" aria-hidden="true">
    <path d="M12 3l8.5 4.5L12 12 3.5 7.5 12 3z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="M4.6 11.6L12 15.5l7.4-3.9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" opacity="0.65" />
    <path d="M4.6 15.9L12 19.8l7.4-3.9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" opacity="0.35" />
  </svg>
);

/** A file shrinking: the optimizer. */
export const IconShrink: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} role="img" aria-hidden="true">
    <rect x="3" y="3.5" width="18" height="17" rx="4" fill="none" stroke="currentColor" strokeWidth="1.7" opacity="0.4" />
    <rect x="7.5" y="8" width="9" height="8" rx="2.5" fill="currentColor" opacity="0.85" />
    <path d="M6 6.5l2.4 2.4M18 6.5l-2.4 2.4M6 17.5l2.4-2.4M18 17.5l-2.4-2.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

/** A shield around a play triangle: everything stays local. */
export const IconLocal: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} role="img" aria-hidden="true">
    <path d="M12 2.6l7.5 2.8v6c0 4.6-3.1 8.6-7.5 10-4.4-1.4-7.5-5.4-7.5-10v-6L12 2.6z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="M10.2 9.3l4.6 2.7-4.6 2.7V9.3z" fill="currentColor" />
  </svg>
);

/** A film strip: the raster exports. */
export const IconFrames: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} role="img" aria-hidden="true">
    <rect x="2.5" y="5.5" width="19" height="13" rx="3" fill="none" stroke="currentColor" strokeWidth="1.7" />
    <path d="M6.5 5.5v13M17.5 5.5v13" stroke="currentColor" strokeWidth="1.5" opacity="0.55" />
    <circle cx="4.5" cy="9" r="0.9" fill="currentColor" />
    <circle cx="4.5" cy="15" r="0.9" fill="currentColor" />
    <circle cx="19.5" cy="9" r="0.9" fill="currentColor" />
    <circle cx="19.5" cy="15" r="0.9" fill="currentColor" />
  </svg>
);

/** A magnifier over a waveform of layers: the compatibility report. */
export const IconReport: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} role="img" aria-hidden="true">
    <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
    <path d="M15.4 15.4L21 21" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    <path d="M7.5 11.5l2-2.5 2 3 2-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Two arrows leaving a box: the handoff to other tools. */
export const IconHandoff: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} role="img" aria-hidden="true">
    <rect x="2.5" y="7" width="10" height="10" rx="3" fill="none" stroke="currentColor" strokeWidth="1.7" />
    <path d="M14.5 9.5h6m0 0l-2.4-2.4M20.5 9.5l-2.4 2.4M14.5 16h4m0 0l-2-2m2 2l-2 2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
