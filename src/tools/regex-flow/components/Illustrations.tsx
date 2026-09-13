import React from 'react';

// ============================================================================
// Bespoke SVG artwork for RegexFlow, in the tool's fuchsia/violet palette.
// ----------------------------------------------------------------------------
// Replaces a pulsing lucide "Sparkles" that was standing in for an
// illustration, and a `Search` icon reused as the tool's identity. Every
// animation is SMIL and every caller passes `animated={!prefersReduced}`, so
// reduced-motion visitors get the same drawing, still.
// ============================================================================

interface ArtProps {
  className?: string;
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Hero: a pattern above, the text below, and the matches lighting up between
// them as a scan line sweeps across.
// ---------------------------------------------------------------------------
export const RegexHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 400 290" className={`tool-hero-art ${className}`} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="rfPanel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2a0b29" />
        <stop offset="100%" stopColor="#0d0510" />
      </linearGradient>
      <linearGradient id="rfBeam" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#d946ef" stopOpacity="0" />
        <stop offset="50%" stopColor="#d946ef" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#d946ef" stopOpacity="0" />
      </linearGradient>
      <clipPath id="rfTextClip">
        <rect x="20" y="104" width="360" height="132" rx="14" />
      </clipPath>
    </defs>

    {/* --- the pattern bar ------------------------------------------------ */}
    <rect x="20" y="18" width="360" height="52" rx="16" fill="url(#rfPanel)" stroke="rgba(217,70,239,0.3)" strokeWidth="1.5" />
    <text x="38" y="50" fontSize="19" fontFamily="ui-monospace, monospace" fill="#6b5570">/</text>
    <text x="362" y="50" fontSize="19" fontFamily="ui-monospace, monospace" textAnchor="end" fill="#6b5570">/</text>

    {/* Coloured token chips standing in for a highlighted pattern */}
    {[
      { x: 52, w: 46, fill: '#c084fc' },
      { x: 102, w: 16, fill: '#f59e0b' },
      { x: 122, w: 26, fill: '#e2c9ea' },
      { x: 152, w: 40, fill: '#c084fc' },
      { x: 196, w: 18, fill: '#22d3ee' },
      { x: 218, w: 34, fill: '#60a5fa' },
      { x: 256, w: 22, fill: '#f59e0b' },
      { x: 282, w: 42, fill: '#c084fc' },
    ].map((chip, index) => (
      <rect key={index} x={chip.x} y="37" width={chip.w} height="10" rx="4" fill={chip.fill} opacity="0.72">
        {animated && (
          <animate
            attributeName="opacity"
            values="0.35;0.9;0.35"
            dur="4.5s"
            begin={`${index * 0.18}s`}
            repeatCount="indefinite"
          />
        )}
      </rect>
    ))}

    {/* --- flag pills ------------------------------------------------------ */}
    {['g', 'i', 'm'].map((flag, index) => (
      <g key={flag} transform={`translate(${20 + index * 30},82)`}>
        <rect width="24" height="16" rx="6" fill="#d946ef" opacity={index === 2 ? 0.12 : 0.3} />
        <text x="12" y="12" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fbe8ff" opacity={index === 2 ? 0.4 : 0.95}>
          {flag}
        </text>
      </g>
    ))}

    {/* --- the test text --------------------------------------------------- */}
    <rect x="20" y="104" width="360" height="132" rx="14" fill="url(#rfPanel)" stroke="rgba(255,255,255,0.07)" strokeWidth="1.4" />

    <g clipPath="url(#rfTextClip)">
      {/* plain lines */}
      {[0, 1, 2, 3, 4].map(row => (
        <rect key={`l${row}`} x="38" y={124 + row * 22} width={row === 4 ? 150 : 300} height="7" rx="3.5" fill="#e9d5ff" opacity="0.14" />
      ))}

      {/* the matches */}
      {[
        { x: 92, y: 124, w: 78 },
        { x: 214, y: 146, w: 96 },
        { x: 60, y: 190, w: 66 },
        { x: 168, y: 212, w: 58 },
      ].map((hit, index) => (
        <g key={`m${index}`}>
          <rect x={hit.x - 4} y={hit.y - 5} width={hit.w + 8} height="17" rx="5" fill="#d946ef" opacity="0.2" />
          <rect x={hit.x - 4} y={hit.y - 5} width={hit.w + 8} height="17" rx="5" fill="none" stroke="#d946ef" strokeWidth="1" opacity="0.55" />
          <rect x={hit.x} y={hit.y} width={hit.w} height="7" rx="3.5" fill="#f0abfc" opacity="0.85" />
          {animated && (
            <animate
              attributeName="opacity"
              values="0.25;1;1;0.25"
              keyTimes="0;0.25;0.8;1"
              dur="5s"
              begin={`${index * 0.35}s`}
              repeatCount="indefinite"
            />
          )}
        </g>
      ))}

      {/* scan beam */}
      {animated && (
        <rect x="-120" y="104" width="120" height="132" fill="url(#rfBeam)">
          <animate attributeName="x" values="-120;400" dur="5s" repeatCount="indefinite" />
        </rect>
      )}
    </g>

    {/* --- the counter ----------------------------------------------------- */}
    <g transform="translate(20,250)">
      <rect width="112" height="26" rx="9" fill="#d946ef" opacity="0.14" />
      <rect width="112" height="26" rx="9" fill="none" stroke="#d946ef" strokeWidth="1.1" opacity="0.4" />
      <circle cx="16" cy="13" r="5" fill="#22c55e" opacity="0.85">
        {animated && <animate attributeName="opacity" values="0.4;1;0.4" dur="2.4s" repeatCount="indefinite" />}
      </circle>
      <rect x="30" y="9" width="66" height="8" rx="4" fill="#f0abfc" opacity="0.5" />
    </g>

    {/* --- the explanation tree, folded off to the right ------------------- */}
    <g transform="translate(150,244)" opacity="0.9">
      {[0, 1, 2].map(row => (
        <g key={row} transform={`translate(${row * 14},${row * 12})`}>
          <path d={`M0 ${8} h8`} stroke="#8b5cf6" strokeWidth="1.4" opacity="0.5" />
          <rect x="10" y="2" width="22" height="12" rx="4" fill="#8b5cf6" opacity="0.25" />
          <rect x="38" y="6" width={110 - row * 16} height="5" rx="2.5" fill="#e9d5ff" opacity="0.22" />
        </g>
      ))}
    </g>
  </svg>
);

// ---------------------------------------------------------------------------
// Empty state for the match panel.
// ---------------------------------------------------------------------------
export const EmptyMatchArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 160 120" className={className} role="img" aria-hidden="true">
    <rect x="16" y="14" width="128" height="92" rx="12" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.28" />
    {[0, 1, 2, 3].map(row => (
      <rect key={row} x="32" y={32 + row * 17} width={row === 3 ? 46 : 96 - row * 8} height="6" rx="3" fill="currentColor" opacity={0.2 - row * 0.03} />
    ))}
    <circle cx="112" cy="80" r="17" fill="none" stroke="currentColor" strokeWidth="2.4" opacity="0.6" />
    <path d="m124 92 11 11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    {animated && (
      <circle cx="112" cy="80" r="17" fill="none" stroke="currentColor" strokeWidth="2.2" opacity="0.35">
        <animate attributeName="r" values="17;24;17" dur="3.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.35;0;0.35" dur="3.2s" repeatCount="indefinite" />
      </circle>
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

/** A branching tree of nodes: the pattern parsed, not tokenized. */
export const IconTree: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <rect x="9" y="2.6" width="6" height="4.4" rx="1.4" />
    <rect x="2.6" y="16.4" width="6" height="4.4" rx="1.4" />
    <rect x="15.4" y="16.4" width="6" height="4.4" rx="1.4" />
    <path d="M12 7v3.6M12 10.6H5.6v5.8M12 10.6h6.4v5.8" />
  </svg>
);

/** A shield around a spinning core: the run happens where it can be killed. */
export const IconSandbox: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <path d="M12 2.6 4.4 5.4v6.2c0 4.5 3.1 8.6 7.6 9.8 4.5-1.2 7.6-5.3 7.6-9.8V5.4Z" />
    <path d="M12 8.6v3.6l2.4 1.6" />
    <path d="M8.4 9.4a4.4 4.4 0 1 0 1.6-1.6" opacity="0.6" />
  </svg>
);

/** A stopwatch with a slash: the watchdog that ends a runaway pattern. */
export const IconWatchdog: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <circle cx="12" cy="13.4" r="7.6" />
    <path d="M12 9.4v4h3M9.6 2.8h4.8M19.2 6.6l1.6-1.6" />
    <path d="m5.4 20.6 13.2-13.2" opacity="0.75" />
  </svg>
);

/** Brackets with a highlighted span inside: matches with real offsets. */
export const IconHighlight: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <path d="M6.4 4.4H3.6v15.2h2.8M17.6 4.4h2.8v15.2h-2.8" />
    <rect x="8.4" y="9.4" width="7.2" height="5.2" rx="1.6" />
    <path d="M10.4 7.2v.01M13.6 16.8v.01" />
  </svg>
);

/** Two brackets and a chevron: the same pattern in another language. */
export const IconExport: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <path d="m7.6 8.4-4 3.6 4 3.6M16.4 8.4l4 3.6-4 3.6" />
    <path d="M13.8 5.2 10.2 18.8" />
  </svg>
);

/** A browser frame with a shield: nothing leaves the tab. */
export const IconLocalOnly: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <rect x="2.4" y="4" width="19.2" height="16" rx="2.6" />
    <path d="M2.4 8.2h19.2M5.4 6.1h.01M7.9 6.1h.01" />
    <path d="M12 10.4 8.4 11.9v2.7c0 2.2 1.5 4.2 3.6 4.9 2.1-.7 3.6-2.7 3.6-4.9v-2.7Z" />
  </svg>
);

/** Two panels with an arrow between them: the handoff to the next tool. */
export const IconHandoff: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <rect x="2.4" y="6" width="7.4" height="12" rx="2" />
    <rect x="14.2" y="6" width="7.4" height="12" rx="2" />
    <path d="M10.4 12h3.2M12.4 10.2 14.2 12l-1.8 1.8" />
    <path d="M4.8 9.4h2.6M4.8 12h2.6" opacity="0.7" />
  </svg>
);

/** A warning triangle over a runaway curve: the backtracking check. */
export const IconLint: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <path d="M3 18.6c2.6 0 4-9.4 6.6-9.4s4 9.4 6.6 9.4" opacity="0.55" />
    <path d="M18.2 4.6 22 12.2h-7.6Z" />
    <path d="M18.2 7.8v2M18.2 11.2v.01" />
  </svg>
);

// ---------------------------------------------------------------------------
// "How it works" step artwork
// ---------------------------------------------------------------------------
export const StepWrite: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="12" y="26" width="96" height="30" rx="10" stroke="currentColor" strokeWidth="2.2" opacity="0.45" />
    <path d="M22 41h6M92 41h6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.5" />
    <rect x="34" y="37" width="18" height="8" rx="3" fill="currentColor" opacity="0.6" />
    <rect x="56" y="37" width="10" height="8" rx="3" fill="currentColor" opacity="0.35" />
    <rect x="70" y="37" width="16" height="8" rx="3" fill="currentColor" opacity="0.6" />
    <rect x="34" y="62" width="3" height="12" rx="1.5" fill="currentColor" opacity="0.8" />
    <path d="M44 68h32" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.3" />
  </svg>
);

export const StepTune: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    {[0, 1, 2].map(row => (
      <g key={row} transform={`translate(0,${row * 22})`}>
        <path d="M20 22h80" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.32" />
        <rect
          x={row === 0 ? 38 : row === 1 ? 68 : 52}
          y="15"
          width="14"
          height="14"
          rx="5"
          stroke="currentColor"
          strokeWidth="2.6"
          opacity="0.9"
        />
      </g>
    ))}
  </svg>
);

export const StepRun: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="12" y="16" width="66" height="58" rx="9" stroke="currentColor" strokeWidth="2.2" opacity="0.45" />
    <path d="M24 32h42M24 44h30M24 56h36" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
    <rect x="22" y="27" width="26" height="11" rx="4" fill="currentColor" opacity="0.35" />
    <rect x="22" y="51" width="20" height="11" rx="4" fill="currentColor" opacity="0.35" />
    <circle cx="90" cy="42" r="16" stroke="currentColor" strokeWidth="2.6" />
    <path d="m101 53 8 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M84 42h12M90 36v12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />
  </svg>
);

export const StepShip: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="12" y="20" width="40" height="50" rx="7" stroke="currentColor" strokeWidth="2.2" opacity="0.5" />
    <rect x="70" y="20" width="38" height="50" rx="7" stroke="currentColor" strokeWidth="2.2" opacity="0.35" strokeDasharray="6 5" />
    <path d="M55 45h11M61 39l6 6-6 6" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 34h20M22 44h16M22 54h12" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity="0.45" />
    <path d="m80 40 5 5 12-12" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
  </svg>
);
