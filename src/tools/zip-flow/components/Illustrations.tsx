import React from 'react';

// ============================================================================
// Bespoke SVG artwork for ZipFlow.
// Inline, self-contained and themed with the tool's amber palette — no raster
// assets, no network requests, and every animation is opt-out via the
// `animated` prop (wired to prefers-reduced-motion by the caller).
// ============================================================================

interface ArtProps {
  className?: string;
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Hero: loose files on the left pass through a zipper seam and come out as one
// dense block on the right. That is literally what the tool does.
// ---------------------------------------------------------------------------
export const ZipHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 400 300" className={`tool-hero-art ${className}`} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="zfBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#271703" />
        <stop offset="100%" stopColor="#0c0802" />
      </linearGradient>
      <linearGradient id="zfSheet" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fef3c7" />
        <stop offset="100%" stopColor="#fcd34d" />
      </linearGradient>
      <linearGradient id="zfPack" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
      <linearGradient id="zfSeam" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fbbf24" stopOpacity="0" />
        <stop offset="30%" stopColor="#fbbf24" stopOpacity="0.9" />
        <stop offset="70%" stopColor="#fbbf24" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
      </linearGradient>
      <filter id="zfGlow" x="-70%" y="-70%" width="240%" height="240%">
        <feGaussianBlur stdDeviation="4" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <clipPath id="zfFrame">
        <rect x="10" y="10" width="380" height="280" rx="26" />
      </clipPath>
    </defs>

    <g clipPath="url(#zfFrame)">
      <rect x="10" y="10" width="380" height="280" fill="url(#zfBg)" />

      {/* Loose files, each a different width: uncompressed and wasteful */}
      <g>
        {[
          { y: 62, w: 128 },
          { y: 100, w: 96 },
          { y: 138, w: 142 },
          { y: 176, w: 84 },
          { y: 214, w: 116 },
        ].map((row, i) => (
          <g key={row.y}>
            <rect x="36" y={row.y} width={row.w} height="24" rx="6" fill="url(#zfSheet)" opacity="0.9">
              {animated && (
                <animate
                  attributeName="opacity"
                  values="0.9;0.45;0.9"
                  dur="4.5s"
                  begin={`${i * 0.35}s`}
                  repeatCount="indefinite"
                />
              )}
            </rect>
            <rect x="44" y={row.y + 8} width={Math.max(20, row.w - 34)} height="3" rx="1.5" fill="#92400e" opacity="0.5" />
            <rect x="44" y={row.y + 15} width={Math.max(14, row.w - 60)} height="3" rx="1.5" fill="#92400e" opacity="0.35" />
          </g>
        ))}
      </g>

      {/* Zipper seam with a slider that travels the frame */}
      <g>
        <rect x="197" y="26" width="6" height="248" rx="3" fill="url(#zfSeam)" filter="url(#zfGlow)" />
        {Array.from({ length: 12 }).map((_, i) => (
          <g key={i}>
            <rect x="186" y={40 + i * 20} width="9" height="7" rx="2" fill="#fbbf24" opacity="0.7" />
            <rect x="205" y={50 + i * 20} width="9" height="7" rx="2" fill="#fbbf24" opacity="0.7" />
          </g>
        ))}
        <g>
          <rect x="188" y="44" width="24" height="20" rx="6" fill="#fde68a" stroke="#b45309" strokeWidth="2" />
          <rect x="196" y="60" width="8" height="14" rx="3" fill="#fde68a" stroke="#b45309" strokeWidth="2" />
          {animated && (
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0 0;0 186;0 0"
              dur="6s"
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes="0;0.5;1"
              keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
            />
          )}
        </g>
      </g>

      {/* The packed result: one block, uniform and much narrower */}
      <g>
        <rect x="246" y="78" width="112" height="144" rx="16" fill="url(#zfPack)" opacity="0.95" />
        <rect x="246" y="78" width="112" height="30" rx="16" fill="#fbbf24" opacity="0.35" />
        <rect x="288" y="70" width="28" height="22" rx="7" fill="#fbbf24" />
        {[0, 1, 2, 3, 4, 5].map(i => (
          <rect key={i} x="262" y={122 + i * 15} width={i % 2 ? 58 : 80} height="7" rx="3.5" fill="#3f2000" opacity="0.45" />
        ))}
        <g opacity="0.9">
          <circle cx="302" cy="238" r="17" fill="#0c0802" stroke="#fbbf24" strokeWidth="2" />
          <path d="M295 238l5 5 10-11" stroke="#fbbf24" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
    </g>

    <rect x="10" y="10" width="380" height="280" rx="26" fill="none" stroke="rgba(245,158,11,0.28)" strokeWidth="1.5" />
  </svg>
);

// ---------------------------------------------------------------------------
// Extract-tab artwork: an archive that unfolds into a directory tree.
// ---------------------------------------------------------------------------
export const UnzipArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 260 170" className={className} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="zfBox" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#92400e" />
      </linearGradient>
    </defs>
    <rect x="14" y="52" width="74" height="86" rx="12" fill="url(#zfBox)" opacity="0.95" />
    <rect x="38" y="44" width="26" height="18" rx="6" fill="#fbbf24" />
    <rect x="47" y="70" width="8" height="34" rx="4" fill="#3f2000" opacity="0.5" />

    <g stroke="currentColor" strokeWidth="2" fill="none" opacity="0.55">
      <path d="M96 95h20v-38h18" />
      <path d="M96 95h20v0h18" />
      <path d="M96 95h20v38h18" />
    </g>

    {[
      { y: 44, w: 96 },
      { y: 82, w: 112 },
      { y: 120, w: 84 },
    ].map((row, i) => (
      <g key={row.y}>
        <rect x="136" y={row.y} width={row.w} height="26" rx="8" fill="currentColor" opacity="0.16" />
        <rect x="146" y={row.y + 8} width="10" height="10" rx="2" fill="currentColor" opacity="0.8" />
        <rect x="164" y={row.y + 11} width={row.w - 42} height="4" rx="2" fill="currentColor" opacity="0.55" />
        {animated && (
          <animate
            attributeName="opacity"
            values="0.35;1;0.35"
            dur="3.6s"
            begin={`${i * 0.4}s`}
            repeatCount="indefinite"
          />
        )}
      </g>
    ))}
  </svg>
);

// ---------------------------------------------------------------------------
// Feature icons
// ---------------------------------------------------------------------------
const iconBase = 'w-7 h-7';
const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** A processor die with threads leaving it: the packing runs off the UI thread. */
export const IconWorker: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <rect x="7.5" y="7.5" width="9" height="9" rx="1.8" />
    <path d="M10 7.5V4.6M14 7.5V4.6M10 16.5v2.9M14 16.5v2.9M7.5 10H4.6M7.5 14H4.6M16.5 10h2.9M16.5 14h2.9" />
    <path d="M10.2 12h3.6" opacity="0.6" />
  </svg>
);

/** A wand over a stack: per-file compression decided by content type. */
export const IconSmart: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <path d="M4 17.5 14.5 7l2.5 2.5L6.5 20H4Z" />
    <path d="m17.4 3 .9 2.2 2.2.9-2.2.9-.9 2.2-.9-2.2-2.2-.9 2.2-.9Z" />
    <path d="m6.6 3.4.6 1.4 1.4.6-1.4.6-.6 1.4L6 6l-1.4-.6L6 4.8Z" opacity="0.65" />
  </svg>
);

/** Nested folders: dropped directories keep their structure. */
export const IconFolderTree: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <path d="M3 6.2A1.2 1.2 0 0 1 4.2 5h3l1.4 1.8h4.2A1.2 1.2 0 0 1 14 8v2.4" />
    <path d="M3 6.2v9.6A1.2 1.2 0 0 0 4.2 17H9" />
    <rect x="12" y="12.5" width="9" height="6.5" rx="1.4" />
    <path d="M12 12.5 13.4 10h4.4l1.2 2.5" />
  </svg>
);

/** A monitor inside a shield: nothing is uploaded. */
export const IconLocalOnly: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <path d="M12 2.6 4.8 5.5v5.4c0 4.3 3 8.2 7.2 9.6 4.2-1.4 7.2-5.3 7.2-9.6V5.5Z" />
    <rect x="8" y="8.6" width="8" height="5.6" rx="1.1" />
    <path d="M10.4 16.4h3.2M12 14.2v2.2" />
  </svg>
);

/** A magnifier over a list: the archive is read before anything is extracted. */
export const IconInspect: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <path d="M4 5.5h9M4 9.5h6M4 13.5h5M4 17.5h7" />
    <circle cx="16.4" cy="14.2" r="4.1" />
    <path d="m19.5 17.3 2 2" />
  </svg>
);

/** Two panes with an arrow: hand a file straight to the next tool. */
export const IconHandoff: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <rect x="2.5" y="6" width="7.5" height="12" rx="1.8" />
    <rect x="14" y="6" width="7.5" height="12" rx="1.8" />
    <path d="M10.8 12h2.4M12.2 10.4 13.8 12l-1.6 1.6" />
  </svg>
);

// ---------------------------------------------------------------------------
// "How it works" step artwork
// ---------------------------------------------------------------------------
export const StepAdd: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="8" y="12" width="104" height="66" rx="12" stroke="currentColor" strokeWidth="2" strokeDasharray="7 6" opacity="0.5" />
    <path d="M34 56V34a3 3 0 0 1 3-3h9l3 4h14a3 3 0 0 1 3 3v18Z" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" />
    <path d="M78 34v18M69 43h18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const StepTune: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <path d="M26 30h68M26 46h68M26 62h68" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity="0.45" />
    <circle cx="46" cy="30" r="8" fill="currentColor" />
    <circle cx="76" cy="46" r="8" fill="currentColor" />
    <circle cx="58" cy="62" r="8" fill="currentColor" />
  </svg>
);

export const StepPack: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="20" y="20" width="34" height="52" rx="8" stroke="currentColor" strokeWidth="2.4" opacity="0.45" />
    <rect x="70" y="32" width="30" height="30" rx="8" fill="currentColor" opacity="0.85" />
    <path d="M58 46h8M62 40l6 6-6 6" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M28 30h18M28 40h12M28 50h18M28 60h10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.5" />
  </svg>
);

export const StepShare: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <path d="M60 18v34" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
    <path d="m48 42 12 12 12-12" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M28 66h64" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
    <circle cx="94" cy="26" r="7" stroke="currentColor" strokeWidth="2.6" opacity="0.6" />
    <circle cx="26" cy="26" r="7" stroke="currentColor" strokeWidth="2.6" opacity="0.6" />
  </svg>
);
