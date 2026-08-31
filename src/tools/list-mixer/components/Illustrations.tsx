import React from 'react';

// ============================================================================
// Bespoke SVG artwork for List Mixer, in the tool's amber/orange palette.
// ----------------------------------------------------------------------------
// It replaces a 32-pixel lucide "ListOrdered" that was standing in for an
// illustration. Every animation is SMIL and every one of them is switched off
// wholesale when the visitor asked for reduced motion — nothing here loops
// unconditionally.
// ============================================================================

interface ArtProps {
  className?: string;
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Hero: a messy list on the left going through a stack of steps and coming out
// sorted, deduplicated and numbered on the right.
// ---------------------------------------------------------------------------
export const ListMixerHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 420 290" className={className} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="lmPanel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2a1405" />
        <stop offset="100%" stopColor="#0d0603" />
      </linearGradient>
      <linearGradient id="lmChip" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#fb923c" />
        <stop offset="100%" stopColor="#ea580c" />
      </linearGradient>
      <clipPath id="lmClipIn">
        <rect x="14" y="40" width="136" height="212" rx="14" />
      </clipPath>
      <clipPath id="lmClipOut">
        <rect x="270" y="40" width="136" height="212" rx="14" />
      </clipPath>
    </defs>

    {/* ---- Input panel: unsorted, with blanks and a repeat ---- */}
    <rect x="14" y="40" width="136" height="212" rx="14" fill="url(#lmPanel)" stroke="rgba(249,115,22,0.22)" strokeWidth="1.5" />
    <text x="28" y="60" fontSize="9" fontWeight="800" fill="#fdba74" opacity="0.7" letterSpacing="1.5">INPUT</text>
    <g clipPath="url(#lmClipIn)">
      {[
        { w: 82, dup: false, blank: false },
        { w: 58, dup: false, blank: false },
        { w: 0, dup: false, blank: true },
        { w: 94, dup: true, blank: false },
        { w: 66, dup: false, blank: false },
        { w: 94, dup: true, blank: false },
        { w: 0, dup: false, blank: true },
        { w: 74, dup: false, blank: false },
        { w: 50, dup: false, blank: false },
      ].map((row, i) => (
        <g key={i} transform={`translate(28,${76 + i * 19})`}>
          {row.blank ? (
            <rect x="0" y="0" width="96" height="8" rx="4" fill="none" stroke="#7c2d12" strokeWidth="1" strokeDasharray="3 4" />
          ) : (
            <rect x="0" y="0" width={row.w} height="8" rx="4" fill={row.dup ? '#f97316' : '#fdba74'} opacity={row.dup ? 0.75 : 0.28} />
          )}
        </g>
      ))}
    </g>

    {/* ---- The pipeline in the middle ---- */}
    <g>
      {[
        { y: 66, label: 'TRIM', w: 92 },
        { y: 106, label: 'CLEAN', w: 92 },
        { y: 146, label: 'DEDUPE', w: 92 },
        { y: 186, label: 'SORT', w: 92 },
      ].map((step, i) => (
        <g key={i} transform={`translate(164,${step.y})`}>
          <rect x="0" y="0" width={step.w} height="28" rx="9" fill="url(#lmChip)" opacity="0.14" />
          <rect x="0" y="0" width={step.w} height="28" rx="9" fill="none" stroke="#f97316" strokeWidth="1.1" opacity="0.5">
            {animated && (
              <animate
                attributeName="opacity"
                values="0.22;0.95;0.22"
                dur="4.8s"
                begin={`${i * 0.5}s`}
                repeatCount="indefinite"
              />
            )}
          </rect>
          <circle cx="14" cy="14" r="4.5" fill="#fb923c" opacity="0.8" />
          <text x="26" y="18" fontSize="8.5" fontWeight="800" fill="#ffedd5" letterSpacing="0.8">
            {step.label}
          </text>
        </g>
      ))}

      {/* The token travelling down the pipeline */}
      {animated && (
        <circle r="3.5" fill="#fed7aa">
          <animateMotion dur="4.8s" repeatCount="indefinite" path="M160 80 L160 240" />
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="4.8s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Connectors */}
      <path d="M150 146 H164" stroke="#f97316" strokeWidth="1.5" opacity="0.45" />
      <path d="M256 146 H270" stroke="#f97316" strokeWidth="1.5" opacity="0.45" />
      <path d="M264 146 l-6 -4 v8 z" fill="#f97316" opacity="0.7" />
    </g>

    {/* ---- Output panel: sorted, numbered, no gaps ---- */}
    <rect x="270" y="40" width="136" height="212" rx="14" fill="url(#lmPanel)" stroke="rgba(249,115,22,0.35)" strokeWidth="1.5" />
    <text x="284" y="60" fontSize="9" fontWeight="800" fill="#fdba74" opacity="0.7" letterSpacing="1.5">OUTPUT</text>
    <g clipPath="url(#lmClipOut)">
      {[46, 58, 66, 74, 82, 90].map((w, i) => (
        <g key={i} transform={`translate(284,${76 + i * 19})`}>
          <text x="0" y="8" fontSize="8" fontWeight="800" fill="#fb923c" opacity="0.85">
            {i + 1}
          </text>
          <rect x="12" y="0" width={w} height="8" rx="4" fill="#fdba74" opacity="0.45">
            {animated && (
              <animate
                attributeName="width"
                values={`0;${w}`}
                dur="0.5s"
                begin={`${1.6 + i * 0.16}s`}
                fill="freeze"
              />
            )}
          </rect>
        </g>
      ))}
    </g>

    {/* Counter badge: the measurable part of the result */}
    <g transform="translate(286,224)">
      <rect x="0" y="0" width="106" height="20" rx="7" fill="#f97316" opacity="0.14" />
      <rect x="0" y="0" width="106" height="20" rx="7" fill="none" stroke="#f97316" strokeWidth="1" opacity="0.4" />
      <text x="53" y="14" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#ffedd5" letterSpacing="0.6">
        9 → 6 · −3
      </text>
    </g>

    {/* Second list feeding the mixer, which is what "mixer" means here */}
    <g transform="translate(164,232)" opacity="0.85">
      <rect x="0" y="0" width="92" height="20" rx="7" fill="none" stroke="#a16207" strokeWidth="1" strokeDasharray="4 3" />
      <text x="46" y="14" textAnchor="middle" fontSize="8" fontWeight="800" fill="#fbbf24" opacity="0.8">
        LIST B
      </text>
    </g>
  </svg>
);

// ---------------------------------------------------------------------------
// Feature icons — one shape per idea, none of them recycled from another slot.
// ---------------------------------------------------------------------------
const iconProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** Non-destructive recipe: rows feeding a stack of toggles. */
export const IconRecipe: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} role="img" aria-hidden="true" {...iconProps}>
    <rect x="2.5" y="4" width="7" height="16" rx="2" />
    <path d="M12.5 7h9M12.5 12h9M12.5 17h9" />
    <circle cx="15" cy="7" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="18.5" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="21" cy="17" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);

/** ICU collation: two alphabets meeting at a bracket. */
export const IconCollator: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} role="img" aria-hidden="true" {...iconProps}>
    <path d="M4 20V7a3 3 0 0 1 6 0v13M4 14h6" />
    <path d="M14 5h6l-6 8h6" />
    <path d="M17 16v4M15 18.5l2 1.5 2-1.5" />
  </svg>
);

/** Set operations: two overlapping fields with the shared slice marked. */
export const IconSets: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} role="img" aria-hidden="true" {...iconProps}>
    <circle cx="9" cy="12" r="6.5" />
    <circle cx="15" cy="12" r="6.5" />
    <path d="M12 6.2a6.5 6.5 0 0 0 0 11.6 6.5 6.5 0 0 0 0-11.6z" fill="currentColor" opacity="0.35" stroke="none" />
  </svg>
);

/** Fair draw: a die over a sealed seed. */
export const IconDraw: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} role="img" aria-hidden="true" {...iconProps}>
    <rect x="3" y="3" width="12" height="12" rx="3" />
    <circle cx="7" cy="7" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="11" cy="11" r="1.1" fill="currentColor" stroke="none" />
    <path d="M14 18.5h7M17.5 15v7" />
    <path d="M9 19.5H4.5A1.5 1.5 0 0 1 3 18v-2" />
  </svg>
);

/** Worker: a second lane running beside the first. */
export const IconWorker: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} role="img" aria-hidden="true" {...iconProps}>
    <rect x="2.5" y="4.5" width="19" height="6" rx="2" />
    <rect x="2.5" y="13.5" width="19" height="6" rx="2" />
    <path d="M6 7.5h4M6 16.5h9" />
    <circle cx="18" cy="7.5" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="18" cy="16.5" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

/** Shapes out: brackets around a list. */
export const IconShapes: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} role="img" aria-hidden="true" {...iconProps}>
    <path d="M7 3.5C4.5 3.5 5 8 3 12c2 4 1.5 8.5 4 8.5" />
    <path d="M17 3.5c2.5 0 2 4.5 4 8.5-2 4-1.5 8.5-4 8.5" />
    <path d="M9.5 9h5M9.5 12h5M9.5 15h3" />
  </svg>
);

/** Local only: a padlock made out of list rows. */
export const IconLocalOnly: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} role="img" aria-hidden="true" {...iconProps}>
    <rect x="4" y="10.5" width="16" height="10" rx="2.5" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    <path d="M8 14.5h5M8 17h8" />
  </svg>
);

// ---------------------------------------------------------------------------
// "How it works" step art
// ---------------------------------------------------------------------------
const StepFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg viewBox="0 0 120 84" role="img" aria-hidden="true" className="w-24 h-auto">
    <rect x="1" y="1" width="118" height="82" rx="12" fill="rgba(249,115,22,0.05)" stroke="rgba(249,115,22,0.18)" />
    {children}
  </svg>
);

export const StepPaste: React.FC<ArtProps> = () => (
  <StepFrame>
    <rect x="16" y="14" width="58" height="56" rx="8" fill="rgba(253,186,116,0.08)" stroke="#f97316" strokeOpacity="0.5" />
    {[0, 1, 2, 3].map(i => (
      <rect key={i} x="24" y={24 + i * 11} width={i === 3 ? 26 : 42} height="5" rx="2.5" fill="#fdba74" opacity="0.35" />
    ))}
    <g stroke="#fb923c" strokeWidth="1.6" fill="none" strokeLinecap="round">
      <path d="M88 26v26" />
      <path d="M81 45l7 7 7-7" />
      <path d="M79 62h18" />
    </g>
  </StepFrame>
);

export const StepStack: React.FC<ArtProps> = () => (
  <StepFrame>
    {[0, 1, 2].map(i => (
      <g key={i} transform={`translate(20,${18 + i * 18})`}>
        <rect x="0" y="0" width="80" height="14" rx="5" fill="rgba(249,115,22,0.12)" stroke="#f97316" strokeOpacity={i === 1 ? 0.7 : 0.32} />
        <circle cx="10" cy="7" r="3" fill="#fb923c" opacity={i === 2 ? 0.25 : 0.85} />
        <rect x="20" y="4.5" width={44 - i * 8} height="5" rx="2.5" fill="#fdba74" opacity="0.4" />
      </g>
    ))}
    <path d="M104 25v34" stroke="#f97316" strokeOpacity="0.35" strokeWidth="1.4" strokeDasharray="3 3" />
  </StepFrame>
);

export const StepTune: React.FC<ArtProps> = () => (
  <StepFrame>
    {[24, 42, 60].map((y, i) => (
      <g key={i}>
        <path d={`M18 ${y}h84`} stroke="#f97316" strokeOpacity="0.25" strokeWidth="2" strokeLinecap="round" />
        <circle cx={30 + i * 28} cy={y} r="6" fill="#0d0603" stroke="#fb923c" strokeWidth="2" />
      </g>
    ))}
  </StepFrame>
);

export const StepShip: React.FC<ArtProps> = () => (
  <StepFrame>
    <rect x="14" y="18" width="52" height="48" rx="8" fill="rgba(253,186,116,0.08)" stroke="#f97316" strokeOpacity="0.45" />
    {[0, 1, 2, 3].map(i => (
      <g key={i}>
        <text x="22" y={31 + i * 11} fontSize="7" fontWeight="800" fill="#fb923c" opacity="0.8">
          {i + 1}
        </text>
        <rect x="31" y={26 + i * 11} width={28 - i * 3} height="5" rx="2.5" fill="#fdba74" opacity="0.4" />
      </g>
    ))}
    <g stroke="#fb923c" strokeWidth="1.6" fill="none" strokeLinecap="round">
      <path d="M76 42h22" />
      <path d="M91 35l7 7-7 7" />
    </g>
    <rect x="74" y="54" width="30" height="12" rx="5" fill="rgba(249,115,22,0.16)" stroke="#f97316" strokeOpacity="0.4" />
  </StepFrame>
);
