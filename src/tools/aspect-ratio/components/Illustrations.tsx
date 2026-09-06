import React from 'react';

// ============================================================================
// Bespoke SVG artwork for the Aspect Ratio tool, in its lime palette.
// No emoji, no recycled lucide glyph doing three jobs at once.
//
// Every animated piece takes `animated`, which the caller wires to
// `prefers-reduced-motion` so the whole page goes still for anyone who asked.
// ============================================================================

interface ArtProps {
  className?: string;
  /** Disables the SMIL animations for users who asked for reduced motion. */
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Hero: one photograph, three frames. The outer frame breathes between 16:9,
// 1:1 and 9:16 while the picture inside stays put — which is exactly what the
// tool is for: choosing the frame, not redrawing the picture.
// ---------------------------------------------------------------------------
export const RatioHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="22 34 374 212" className={className} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="arPhoto" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#365314" />
        <stop offset="55%" stopColor="#4d7c0f" />
        <stop offset="100%" stopColor="#0b1502" />
      </linearGradient>
      <linearGradient id="arFrame" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#a3e635" />
        <stop offset="100%" stopColor="#65a30d" />
      </linearGradient>
      <clipPath id="arClip">
        <rect x="34" y="46" width="236" height="188" rx="14" />
      </clipPath>
    </defs>

    {/* The picture: hills, sun, foreground — enough to read as a photo */}
    <rect x="34" y="46" width="236" height="188" rx="14" fill="url(#arPhoto)" />
    <g clipPath="url(#arClip)">
      <circle cx="216" cy="96" r="22" fill="#d9f99d" opacity="0.75" />
      <path d="M34 190l58-52 42 36 40-44 96 74v30H34Z" fill="#0f1a04" opacity="0.85" />
      <path d="M34 214l70-38 62 24 104-30v64H34Z" fill="#060c01" opacity="0.9" />
      <path d="M34 46h236v188H34Z" fill="none" />
    </g>

    {/* Grid thirds, faint: the composition guide */}
    <g stroke="#d9f99d" strokeWidth="1" opacity="0.18">
      <path d="M112 46v188M191 46v188M34 109h236M34 171h236" />
    </g>

    {/* The breathing frame */}
    <rect
      x="72"
      y="60"
      width="160"
      height="90"
      rx="8"
      fill="none"
      stroke="url(#arFrame)"
      strokeWidth="3.5"
    >
      {animated && (
        <>
          <animate attributeName="width" values="196;120;62;196" dur="9s" repeatCount="indefinite" />
          <animate attributeName="height" values="110;120;110;110" dur="9s" repeatCount="indefinite" />
          <animate attributeName="x" values="54;92;121;54" dur="9s" repeatCount="indefinite" />
          <animate attributeName="y" values="85;80;85;85" dur="9s" repeatCount="indefinite" />
        </>
      )}
    </rect>

    {/* Corner handles on the frame */}
    {animated ? (
      <g fill="#a3e635">
        <circle cx="54" cy="85" r="4.5">
          <animate attributeName="cx" values="54;92;121;54" dur="9s" repeatCount="indefinite" />
          <animate attributeName="cy" values="85;80;85;85" dur="9s" repeatCount="indefinite" />
        </circle>
        <circle cx="250" cy="195" r="4.5">
          <animate attributeName="cx" values="250;212;183;250" dur="9s" repeatCount="indefinite" />
          <animate attributeName="cy" values="195;200;195;195" dur="9s" repeatCount="indefinite" />
        </circle>
      </g>
    ) : (
      <g fill="#a3e635">
        <circle cx="72" cy="60" r="4.5" />
        <circle cx="232" cy="150" r="4.5" />
      </g>
    )}

    {/* Read-out card: the numbers the tool gives back */}
    <g transform="translate(288,64)">
      <rect x="0" y="0" width="96" height="152" rx="13" fill="#0d1703" stroke="rgba(163,230,53,0.28)" strokeWidth="1.5" />
      <rect x="14" y="18" width="40" height="7" rx="3.5" fill="#4d7c0f" />
      <text x="14" y="52" fill="#a3e635" fontSize="21" fontWeight="800" fontFamily="ui-monospace, monospace">
        16:9
        {animated && (
          <animate attributeName="opacity" values="1;1;0;1;1;0;1" dur="9s" repeatCount="indefinite" />
        )}
      </text>
      <rect x="14" y="66" width="68" height="6" rx="3" fill="#ffffff" opacity="0.14" />
      <rect x="14" y="80" width="52" height="6" rx="3" fill="#ffffff" opacity="0.11" />
      <rect x="14" y="102" width="68" height="26" rx="8" fill="#65a30d" opacity="0.18" stroke="#a3e635" strokeWidth="1.1" />
      <path d="M28 115h30M52 109l6 6-6 6" stroke="#d9f99d" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>

    {/* Tie between the frame and the read-out */}
    <path d="M272 140h12" stroke="#a3e635" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="4 5" opacity="0.55" />
  </svg>
);

// ---------------------------------------------------------------------------
// Canvas placeholder, shown while no source has been loaded.
// ---------------------------------------------------------------------------
export const DropFrameArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 170 130" className={className} role="img" aria-hidden="true">
    <rect x="8" y="10" width="154" height="110" rx="12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeDasharray="8 7" opacity="0.4" />
    <rect x="40" y="34" width="90" height="52" rx="7" fill="none" stroke="currentColor" strokeWidth="2.6" opacity="0.75">
      {animated && (
        <>
          <animate attributeName="width" values="90;54;90" dur="6s" repeatCount="indefinite" />
          <animate attributeName="x" values="40;58;40" dur="6s" repeatCount="indefinite" />
          <animate attributeName="height" values="52;62;52" dur="6s" repeatCount="indefinite" />
          <animate attributeName="y" values="34;29;34" dur="6s" repeatCount="indefinite" />
        </>
      )}
    </rect>
    <path d="M55 76l14-14 11 10 10-12 20 20Z" fill="currentColor" opacity="0.45" />
    <circle cx="103" cy="48" r="6" fill="currentColor" opacity="0.4" />
    <path d="M85 100v14M78 108l7 7 7-7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" fill="none" />
  </svg>
);

// ---------------------------------------------------------------------------
// Feature icons — one drawing per idea, none reused.
// ---------------------------------------------------------------------------
const iconBase = 'w-6 h-6';

/** Two nested frames with a fraction bar: the exact/approximate ratio. */
export const IconExactRatio: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2.2" y="5.4" width="19.6" height="13.2" rx="2.2" />
    <path d="M8.6 15.6 15.4 8.4" />
    <circle cx="8.4" cy="9.2" r="1.5" />
    <circle cx="15.6" cy="14.8" r="1.5" />
  </svg>
);

/** A frame with the discarded margins hatched away: cover vs contain. */
export const IconFit: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="6.6" y="2.8" width="10.8" height="18.4" rx="2" />
    <path d="M2.6 8.2h18.8M2.6 15.8h18.8" opacity="0.5" strokeDasharray="2.4 2.4" />
    <path d="M9.4 11.4h5.2M12.6 9.4l2 2-2 2" />
  </svg>
);

/** A ruler with a step notch: the codec multiple. */
export const IconMultiple: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2.2" y="8.4" width="19.6" height="7.2" rx="1.8" />
    <path d="M6.4 8.4v3.2M10.2 8.4v4.6M14 8.4v3.2M17.8 8.4v4.6" />
  </svg>
);

/** A file entering a frame, with the button that starts it. */
export const IconOnDemand: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M13.4 2.6H6.6a2 2 0 0 0-2 2v9.2" />
    <path d="M13.4 2.6 18.4 7.6v3" />
    <rect x="8.4" y="15.4" width="12.6" height="6.2" rx="3.1" />
    <path d="M12 18.5h4.6M15 16.9l1.6 1.6-1.6 1.6" />
  </svg>
);

/** A magnifier over a frame corner: the manual editor. */
export const IconHandEdit: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 8.4V4.6a1.6 1.6 0 0 1 1.6-1.6h3.8M15.6 3h3.8A1.6 1.6 0 0 1 21 4.6v3.8" />
    <path d="M21 15.6v3.8a1.6 1.6 0 0 1-1.6 1.6h-3.8" />
    <circle cx="9.4" cy="13.4" r="4.2" />
    <path d="m12.6 16.6 3 3" />
  </svg>
);

/** A chain link between two frames: the handoff to another tool. */
export const IconHandoff: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="1.8" y="6.6" width="7.6" height="10.8" rx="1.8" />
    <rect x="14.6" y="8.6" width="7.6" height="6.8" rx="1.8" />
    <path d="M10.4 12h3.2M12.4 10.2 14.2 12l-1.8 1.8" />
  </svg>
);

// ---------------------------------------------------------------------------
// "How it works" step artwork.
// ---------------------------------------------------------------------------
export const StepChoose: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="10" y="26" width="44" height="26" rx="4" stroke="currentColor" strokeWidth="2.2" opacity="0.6" />
    <rect x="62" y="20" width="24" height="38" rx="4" stroke="currentColor" strokeWidth="2.2" opacity="0.45" />
    <rect x="94" y="28" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="2.2" opacity="0.45" />
    <path d="M18 68h38" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
    <circle cx="32" cy="39" r="4" fill="currentColor" opacity="0.7" />
  </svg>
);

export const StepSource: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="14" y="18" width="52" height="40" rx="5" stroke="currentColor" strokeWidth="2.2" opacity="0.55" />
    <path d="m22 52 13-14 10 10 9-11 12 15Z" fill="currentColor" opacity="0.55" />
    <path d="M74 38h22M88 30l8 8-8 8" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    <rect x="24" y="66" width="52" height="14" rx="7" stroke="currentColor" strokeWidth="2.2" opacity="0.4" />
    <path d="M38 73h20" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity="0.6" />
  </svg>
);

export const StepAdjust: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="16" y="14" width="88" height="62" rx="6" stroke="currentColor" strokeWidth="2.2" opacity="0.35" />
    <rect x="38" y="22" width="44" height="46" rx="5" stroke="currentColor" strokeWidth="2.6" opacity="0.85" />
    <circle cx="38" cy="22" r="4" fill="currentColor" />
    <circle cx="82" cy="68" r="4" fill="currentColor" />
    <path d="M52 45h16M62 39l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
  </svg>
);

export const StepExport: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="18" y="16" width="42" height="34" rx="5" stroke="currentColor" strokeWidth="2.2" opacity="0.6" />
    <path d="M39 54v16M31 63l8 8 8-8" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="70" y="20" width="34" height="12" rx="6" stroke="currentColor" strokeWidth="2.2" opacity="0.45" />
    <rect x="70" y="38" width="34" height="12" rx="6" stroke="currentColor" strokeWidth="2.2" opacity="0.35" />
    <rect x="70" y="56" width="34" height="12" rx="6" stroke="currentColor" strokeWidth="2.2" opacity="0.25" />
  </svg>
);
