import React from 'react';

// ============================================================================
// Bespoke SVG artwork for WordFlow, in the tool's teal palette.
// ----------------------------------------------------------------------------
// This replaces a single pulsing lucide "Sparkles" that was standing in for an
// illustration. Every animation is SMIL and is switched off wholesale when the
// visitor asked for reduced motion.
// ============================================================================

interface ArtProps {
  className?: string;
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Hero: a page being read by the analyser — a sentence lights up, its grade
// pops out, and the counters tick along the side.
// ---------------------------------------------------------------------------
export const WordFlowHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 400 280" className={`tool-hero-art ${className}`} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="wfPage" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#082f2c" />
        <stop offset="100%" stopColor="#04140f" />
      </linearGradient>
      <linearGradient id="wfChip" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#2dd4bf" />
        <stop offset="100%" stopColor="#0d9488" />
      </linearGradient>
      <clipPath id="wfClip">
        <rect x="18" y="26" width="212" height="228" rx="16" />
      </clipPath>
    </defs>

    {/* The page */}
    <rect x="18" y="26" width="212" height="228" rx="16" fill="url(#wfPage)" stroke="rgba(45,212,191,0.28)" strokeWidth="1.5" />

    <g clipPath="url(#wfClip)">
      {/* Paragraph one: ordinary prose */}
      {[0, 1, 2].map(i => (
        <rect key={`a${i}`} x="38" y={50 + i * 14} width={i === 2 ? 118 : 172} height="6" rx="3" fill="#5eead4" opacity="0.22" />
      ))}

      {/* The flagged sentence */}
      <g>
        <rect x="34" y="98" width="180" height="40" rx="8" fill="#f59e0b" opacity="0.12" />
        <rect x="34" y="98" width="180" height="40" rx="8" fill="none" stroke="#f59e0b" strokeWidth="1" opacity="0.4" />
        {animated && <animate attributeName="opacity" values="0.35;1;1;0.35" keyTimes="0;0.2;0.75;1" dur="6s" repeatCount="indefinite" />}
        {[0, 1].map(i => (
          <rect key={`b${i}`} x="42" y={106 + i * 14} width={i === 1 ? 132 : 164} height="6" rx="3" fill="#fbbf24" opacity="0.5" />
        ))}
      </g>

      {/* Paragraph three, with two adverbs marked */}
      {[0, 1, 2, 3].map(i => (
        <rect key={`c${i}`} x="38" y={152 + i * 14} width={i === 3 ? 96 : 172} height="6" rx="3" fill="#5eead4" opacity="0.22" />
      ))}
      <rect x="96" y="152" width="34" height="6" rx="3" fill="#a78bfa" opacity="0.75" />
      <rect x="60" y="180" width="28" height="6" rx="3" fill="#a78bfa" opacity="0.75" />

      {/* Reading cursor sweeping down the page */}
      {animated && (
        <rect x="18" y="40" width="212" height="16" fill="#2dd4bf" opacity="0.07">
          <animate attributeName="y" values="40;208;40" dur="7s" repeatCount="indefinite" />
        </rect>
      )}
    </g>

    {/* Metric chips floating off the right edge */}
    {[
      { y: 42, label: 'W', width: 118, delay: '0s' },
      { y: 92, label: 'R', width: 132, delay: '0.5s' },
      { y: 142, label: 'K', width: 108, delay: '1s' },
      { y: 192, label: 'T', width: 124, delay: '1.5s' },
    ].map((chip, i) => (
      <g key={i} transform={`translate(248,${chip.y})`}>
        {animated && (
          <animateTransform
            attributeName="transform"
            type="translate"
            values={`248 ${chip.y}; 254 ${chip.y - 4}; 248 ${chip.y}`}
            dur="5s"
            begin={chip.delay}
            repeatCount="indefinite"
            additive="replace"
          />
        )}
        <rect x="0" y="0" width={chip.width} height="30" rx="10" fill="url(#wfChip)" opacity="0.16" />
        <rect x="0" y="0" width={chip.width} height="30" rx="10" fill="none" stroke="#2dd4bf" strokeWidth="1.1" opacity="0.45" />
        <circle cx="17" cy="15" r="7" fill="#0d9488" opacity="0.5" />
        <text x="17" y="19" textAnchor="middle" fontSize="9" fontWeight="700" fill="#ccfbf1">{chip.label}</text>
        <rect x="32" y="8" width={chip.width - 48} height="5" rx="2.5" fill="#5eead4" opacity="0.4" />
        <rect x="32" y="18" width={(chip.width - 48) * 0.6} height="5" rx="2.5" fill="#5eead4" opacity="0.2" />
      </g>
    ))}

    {/* Readability dial */}
    <g transform="translate(280,232)">
      <path d="M0 22a34 34 0 0 1 68 0" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" strokeLinecap="round" />
      <path d="M0 22a34 34 0 0 1 68 0" fill="none" stroke="#2dd4bf" strokeWidth="7" strokeLinecap="round" strokeDasharray="107" strokeDashoffset="42">
        {animated && <animate attributeName="stroke-dashoffset" values="86;30;86" dur="6s" repeatCount="indefinite" />}
      </path>
      <circle cx="34" cy="22" r="3" fill="#ccfbf1" />
    </g>
  </svg>
);

// ---------------------------------------------------------------------------
// Empty-state art for the insight panel.
// ---------------------------------------------------------------------------
export const EmptyInsightArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 160 130" className={className} role="img" aria-hidden="true">
    <rect x="24" y="12" width="112" height="106" rx="12" fill="none" stroke="currentColor" strokeWidth="2.2" opacity="0.3" />
    {[0, 1, 2, 3].map(i => (
      <rect key={i} x="40" y={32 + i * 18} width={i === 3 ? 40 : 80 - i * 6} height="6" rx="3" fill="currentColor" opacity={0.24 - i * 0.04} />
    ))}
    <circle cx="112" cy="92" r="18" fill="none" stroke="currentColor" strokeWidth="2.4" opacity="0.55" />
    <path d="m125 105 12 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
    {animated && (
      <circle cx="112" cy="92" r="18" fill="none" stroke="currentColor" strokeWidth="2.4" opacity="0.35">
        <animate attributeName="r" values="18;24;18" dur="3.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.35;0;0.35" dur="3.4s" repeatCount="indefinite" />
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

/** Brackets closing around glyphs: real word boundaries, not spaces. */
export const IconSegmenter: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <path d="M6.6 4.4H4.2v15.2h2.4M17.4 4.4h2.4v15.2h-2.4" />
    <path d="M9.4 9.2h1.4v5.6H9.4M13.2 9.2h1.4v5.6h-1.4" />
    <path d="M12 6.6v.01M12 17.4v.01" />
  </svg>
);

/** A dial with a needle: the readability score. */
export const IconGauge: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <path d="M3.4 17.6a9 9 0 1 1 17.2 0" />
    <path d="m12 16 4.6-5.4" />
    <circle cx="12" cy="16.6" r="1.6" />
    <path d="M4.6 12.4h1.6M17.8 12.4h1.6M11.2 6.2h1.6" />
  </svg>
);

/** Lines with two of them underlined: the prose issues. */
export const IconProse: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <path d="M3.6 5.6h16.8M3.6 9.8h11.4M3.6 14h16.8M3.6 18.2h8.2" />
    <path d="M4.4 11.2c.7-.9 1.5-.9 2.2 0s1.5.9 2.2 0 1.5-.9 2.2 0" opacity="0.85" />
    <path d="M13.4 19.6c.7-.9 1.5-.9 2.2 0s1.5.9 2.2 0" opacity="0.85" />
  </svg>
);

/** Tags of different sizes: the keyword table. */
export const IconKeywords: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <path d="M3.2 6.6a1.8 1.8 0 0 1 1.8-1.8h5l7.4 7.4a1.8 1.8 0 0 1 0 2.6l-4.6 4.6a1.8 1.8 0 0 1-2.6 0L3 12.2Z" />
    <circle cx="7.6" cy="9.2" r="1.3" />
    <path d="M17.4 4.8h2.2a1.4 1.4 0 0 1 1.4 1.4v2.2" />
  </svg>
);

/** A shield in a browser frame: nothing leaves the tab. */
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

/** A pencil over a stack of undo arrows: the editor itself. */
export const IconEditor: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <path d="M4 20.2h4.2L19.4 9a2.2 2.2 0 0 0-3.1-3.1L5.1 17.1Z" />
    <path d="M14.8 7.4 17.9 10.5" />
    <path d="M3.6 6.4a4 4 0 0 1 6.4-.8M3.4 4v2.6H6" />
  </svg>
);

/** Text and a headphone/hourglass: the reading-time estimate. */
export const IconTiming: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <circle cx="12" cy="12.6" r="7.6" />
    <path d="M12 8.4v4.4l2.8 1.8" />
    <path d="M9 2.8h6" />
  </svg>
);

// ---------------------------------------------------------------------------
// "How it works" step artwork
// ---------------------------------------------------------------------------
export const StepWrite: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="16" y="12" width="88" height="66" rx="10" stroke="currentColor" strokeWidth="2.2" opacity="0.45" />
    <path d="M30 30h48M30 42h58M30 54h34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
    <path d="M66 56v10M60 60l6 6 6-6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.75" />
    <rect x="28" y="52" width="3" height="14" rx="1.5" fill="currentColor" opacity="0.8" />
  </svg>
);

export const StepTune: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    {[0, 1, 2].map(i => (
      <g key={i} transform={`translate(0,${i * 22})`}>
        <path d="M22 20h76" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.35" />
        <circle cx={i === 0 ? 44 : i === 1 ? 74 : 58} cy="20" r="7" stroke="currentColor" strokeWidth="2.6" fill="none" opacity="0.85" />
      </g>
    ))}
  </svg>
);

export const StepAnalyse: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="14" y="14" width="62" height="62" rx="8" stroke="currentColor" strokeWidth="2.2" opacity="0.45" />
    <path d="M26 30h38M26 42h30M26 54h22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.45" />
    <circle cx="84" cy="50" r="17" stroke="currentColor" strokeWidth="2.6" />
    <path d="m97 63 9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M77 52.5 82 57l9.5-11" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const StepShip: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="14" y="20" width="40" height="50" rx="7" stroke="currentColor" strokeWidth="2.2" opacity="0.5" />
    <rect x="70" y="20" width="36" height="50" rx="7" stroke="currentColor" strokeWidth="2.2" opacity="0.35" strokeDasharray="6 5" />
    <path d="M56 45h12M63 39l6 6-6 6" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M24 34h20M24 44h16M24 54h12" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity="0.45" />
  </svg>
);
