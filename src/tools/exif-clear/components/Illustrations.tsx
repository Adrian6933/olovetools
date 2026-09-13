import React from 'react';

// ============================================================================
// Bespoke SVG artwork for EXIF Cleaner, in the tool's emerald palette.
// Every animation is SMIL and is switched off wholesale when the visitor asked
// for reduced motion.
// ============================================================================

interface ArtProps {
  className?: string;
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Hero: a photograph with its metadata peeling off it, one label at a time,
// and a shield standing where the labels used to be.
// ---------------------------------------------------------------------------
export const CleanerHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 400 270" className={`tool-hero-art ${className}`} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="exSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0f766e" />
        <stop offset="100%" stopColor="#042f2e" />
      </linearGradient>
      <linearGradient id="exChip" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#0d9488" />
      </linearGradient>
      <clipPath id="exFrame">
        <rect x="20" y="42" width="186" height="150" rx="14" />
      </clipPath>
    </defs>

    {/* The photograph */}
    <rect x="20" y="42" width="186" height="150" rx="14" fill="#04140f" stroke="rgba(16,185,129,0.28)" strokeWidth="1.5" />
    <g clipPath="url(#exFrame)">
      <rect x="20" y="42" width="186" height="150" fill="url(#exSky)" opacity="0.55" />
      <circle cx="66" cy="82" r="14" fill="#6ee7b7" opacity="0.55" />
      <path d="M20 168 76 116l38 32 30-24 42 44v24H20Z" fill="#022c22" />
      <path d="M20 192 96 132l52 46 58-34v48H20Z" fill="#010f0c" opacity="0.9" />
    </g>
    <rect x="20" y="42" width="186" height="150" rx="14" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

    {/* Metadata labels lifting off towards the right */}
    {[
      { y: 54, w: 120, delay: '0s', text: 'GPS 40.4168, -3.7038' },
      { y: 88, w: 104, delay: '0.7s', text: 'iPhone 15 Pro' },
      { y: 122, w: 112, delay: '1.4s', text: '2024:07:14 18:22' },
      { y: 156, w: 96, delay: '2.1s', text: 'SN-778812394' },
    ].map((chip, i) => (
      <g key={i} transform={`translate(228,${chip.y})`}>
        <g>
          {animated && (
            <>
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 26 -8; 26 -8"
                dur="4.2s"
                begin={chip.delay}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.95;0.95;0"
                keyTimes="0;0.45;1"
                dur="4.2s"
                begin={chip.delay}
                repeatCount="indefinite"
              />
            </>
          )}
          <rect x="0" y="0" width={chip.w} height="22" rx="11" fill="url(#exChip)" opacity="0.22" />
          <rect x="0" y="0" width={chip.w} height="22" rx="11" fill="none" stroke="#34d399" strokeWidth="1.2" opacity="0.5" />
          <circle cx="12" cy="11" r="3.4" fill="#34d399" />
          <rect x="22" y="7.5" width={chip.w - 34} height="7" rx="3.5" fill="#a7f3d0" opacity="0.35" />
        </g>
      </g>
    ))}

    {/* Shield: what stays behind */}
    <g transform="translate(96,196)">
      <path
        d="M18 0 0 7v12c0 10.5 7 19.5 18 22.5C29 38.5 36 29.5 36 19V7Z"
        fill="rgba(16,185,129,0.14)"
        stroke="#34d399"
        strokeWidth="2"
      />
      <path d="m11 20 5 5 10-11" fill="none" stroke="#6ee7b7" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </g>

    {/* Dashed cut line between the picture and its labels */}
    <path d="M214 60v150" stroke="#34d399" strokeWidth="1.6" strokeDasharray="5 6" opacity="0.45" />
  </svg>
);

// ---------------------------------------------------------------------------
// Placeholder for the empty inspector: a file card with unread labels.
// ---------------------------------------------------------------------------
export const EmptyInspectorArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 160 150" className={className} role="img" aria-hidden="true">
    <rect x="26" y="14" width="108" height="122" rx="12" fill="none" stroke="currentColor" strokeWidth="2.4" opacity="0.35" />
    <path d="M26 96 58 66l22 20 18-15 36 32" fill="none" stroke="currentColor" strokeWidth="2.4" opacity="0.4" strokeLinejoin="round" />
    <circle cx="58" cy="44" r="9" fill="none" stroke="currentColor" strokeWidth="2.4" opacity="0.4" />
    {[0, 1, 2].map(i => (
      <rect
        key={i}
        x="40"
        y={106 + i * 10}
        width={i === 2 ? 40 : 68 - i * 8}
        height="5"
        rx="2.5"
        fill="currentColor"
        opacity={0.22 - i * 0.04}
      />
    ))}
    {animated && (
      <line x1="20" y1="30" x2="140" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.55">
        <animate attributeName="y1" values="24;126;24" dur="3.8s" repeatCount="indefinite" />
        <animate attributeName="y2" values="24;126;24" dur="3.8s" repeatCount="indefinite" />
      </line>
    )}
  </svg>
);

// ---------------------------------------------------------------------------
// Feature icons
// ---------------------------------------------------------------------------
const iconBase = 'w-6 h-6';
const strokeProps = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** A map pin struck through: the coordinates go. */
export const IconNoLocation: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <path d="M18.4 10.2c0 4.6-6.4 11-6.4 11s-1.9-1.9-3.7-4.4" />
    <path d="M6.2 13.2A8.6 8.6 0 0 1 5.6 10.2a6.4 6.4 0 0 1 10.3-5.1" />
    <circle cx="12" cy="10.2" r="2.4" />
    <path d="M3.6 3.2 20.4 20.8" />
  </svg>
);

/** A list of tags with a scalpel cut through one of them: per-tag removal. */
export const IconTagPicker: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <rect x="2.6" y="4.4" width="18.8" height="15.2" rx="2.6" />
    <path d="M6.4 8.6h5M6.4 12h7.4M6.4 15.4h4.2" />
    <path d="M16.2 9.6 20 13.4M20 9.6l-3.8 3.8" />
  </svg>
);

/** An equals sign between two identical pixel grids: the picture is untouched. */
export const IconLossless: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <rect x="2.4" y="6.4" width="7.6" height="11.2" rx="1.6" />
    <rect x="14" y="6.4" width="7.6" height="11.2" rx="1.6" />
    <path d="M11.4 10.4h1.2M11.4 13.6h1.2" />
    <path d="M4.6 14.6 6.6 12l1.6 1.8" />
    <path d="M16.2 14.6 18.2 12l1.6 1.8" />
  </svg>
);

/** Shield over a browser window: it never leaves the tab. */
export const IconLocalOnly: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <rect x="2.4" y="4" width="19.2" height="16" rx="2.6" />
    <path d="M2.4 8.2h19.2M5.4 6.1h.01M7.9 6.1h.01" />
    <path d="M12 10.4 8.4 11.9v2.7c0 2.2 1.5 4.2 3.6 4.9 2.1-.7 3.6-2.7 3.6-4.9v-2.7Z" />
  </svg>
);

/** Three stacked file cards: the formats it reads. */
export const IconFormats: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <path d="M7.4 5.4h6.2l4 4v9.2a1.8 1.8 0 0 1-1.8 1.8H7.4a1.8 1.8 0 0 1-1.8-1.8V7.2a1.8 1.8 0 0 1 1.8-1.8Z" />
    <path d="M13.4 5.4v4.2h4" />
    <path d="M9.4 3.4h5.4M3.6 8.4v8.4" />
  </svg>
);

/** A checklist under a magnifier: the result is re-read, not assumed. */
export const IconVerified: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <path d="M20 11.4V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5.2" />
    <path d="M7.6 8.6h8.8M7.6 12h5.6M7.6 15.4h3.4" />
    <circle cx="17.2" cy="16.6" r="3.4" />
    <path d="m19.8 19.2 1.8 1.8" />
  </svg>
);

// ---------------------------------------------------------------------------
// "How it works" step artwork
// ---------------------------------------------------------------------------
export const StepDrop: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="14" y="34" width="92" height="44" rx="10" stroke="currentColor" strokeWidth="2.2" strokeDasharray="7 6" opacity="0.5" />
    <rect x="30" y="46" width="24" height="20" rx="4" stroke="currentColor" strokeWidth="2.2" opacity="0.65" />
    <rect x="60" y="46" width="24" height="20" rx="4" stroke="currentColor" strokeWidth="2.2" opacity="0.45" />
    <path d="M60 8v18M53 20l7 7 7-7" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const StepInspect: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="14" y="14" width="66" height="62" rx="8" stroke="currentColor" strokeWidth="2.2" opacity="0.5" />
    <path d="M26 30h40M26 42h32M26 54h24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
    <circle cx="84" cy="52" r="16" stroke="currentColor" strokeWidth="2.6" />
    <path d="m96 64 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M78 52h12M84 46v12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />
  </svg>
);

export const StepChoose: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    {[0, 1, 2].map(i => (
      <g key={i} transform={`translate(0,${i * 22})`}>
        <rect x="20" y="16" width="14" height="14" rx="4" stroke="currentColor" strokeWidth="2.2" opacity={i === 1 ? 0.35 : 0.75} />
        {i !== 1 && (
          <path d="m23.5 23 3 3 5-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        )}
        <rect x="42" y="20" width={i === 2 ? 34 : 56} height="6" rx="3" fill="currentColor" opacity={i === 1 ? 0.2 : 0.45} />
      </g>
    ))}
  </svg>
);

export const StepSave: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="26" y="12" width="52" height="50" rx="8" stroke="currentColor" strokeWidth="2.2" opacity="0.55" />
    <path d="M38 38 50 26l9 9 8-7 11 12" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" opacity="0.6" />
    <circle cx="44" cy="24" r="5" stroke="currentColor" strokeWidth="2.2" opacity="0.6" />
    <path d="M88 30 76 34v9c0 7 4.8 13.4 12 15.6 7.2-2.2 12-8.6 12-15.6v-9Z" stroke="currentColor" strokeWidth="2.4" fill="none" />
    <path d="m83 43 4 4 8-9" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M52 70v10M45 74l7 7 7-7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.65" />
  </svg>
);
