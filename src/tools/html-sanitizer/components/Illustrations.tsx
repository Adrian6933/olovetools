// ============================================================================
// Hand-drawn SVG art for the HTML Sanitizer
// ----------------------------------------------------------------------------
// Everything here is inline SVG on the tool's cyan palette — no emoji standing
// in for an illustration, no recycled lucide glyph doing hero duty.
//
// Every animation is gated on `animated`, which the page derives from
// prefers-reduced-motion, and each <animate> lives inside the element it moves
// so a static render is still a complete drawing.
// ============================================================================

import React from 'react';

interface ArtProps {
  className?: string;
  animated?: boolean;
}

const C = {
  ink: '#04080a',
  panel: '#08202b',
  panelSoft: '#0b2a38',
  line: '#164e63',
  cyan: '#22d3ee',
  cyanDim: '#0891b2',
  teal: '#5eead4',
  danger: '#fb7185',
  amber: '#fbbf24',
  text: '#94a3b8',
};

// ---------------------------------------------------------------------------
// Hero: raw markup on the left, a shield in the middle, clean markup on the
// right. The dangerous tokens travel into the shield and come out as nothing.
// ---------------------------------------------------------------------------

export const SanitizerHeroArt: React.FC<ArtProps> = ({ className, animated = true }) => (
  <svg viewBox="0 0 460 320" className={`tool-hero-art ${className}`} xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
    <defs>
      <linearGradient id="hs-panel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={C.panelSoft} />
        <stop offset="100%" stopColor={C.panel} />
      </linearGradient>
      <linearGradient id="hs-shield" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={C.cyan} stopOpacity="0.9" />
        <stop offset="100%" stopColor={C.cyanDim} stopOpacity="0.5" />
      </linearGradient>
      <radialGradient id="hs-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={C.cyan} stopOpacity="0.35" />
        <stop offset="100%" stopColor={C.cyan} stopOpacity="0" />
      </radialGradient>
      <clipPath id="hs-clip-left">
        <rect x="18" y="52" width="150" height="216" rx="12" />
      </clipPath>
      <clipPath id="hs-clip-right">
        <rect x="292" y="52" width="150" height="216" rx="12" />
      </clipPath>
    </defs>

    <ellipse cx="230" cy="160" rx="150" ry="130" fill="url(#hs-glow)" />

    {/* ---- left panel: the mess going in ---- */}
    <rect x="18" y="52" width="150" height="216" rx="12" fill="url(#hs-panel)" stroke={C.line} />
    <g clipPath="url(#hs-clip-left)">
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
        const bad = i === 2 || i === 5;
        return (
          <g key={i} transform={`translate(32 ${72 + i * 24})`}>
            <rect width="10" height="6" rx="2" fill={bad ? C.danger : C.cyanDim} opacity={bad ? 0.9 : 0.55} />
            <rect
              x="16"
              width={[64, 88, 74, 52, 80, 68, 92, 58][i]}
              height="6"
              rx="3"
              fill={bad ? C.danger : C.text}
              opacity={bad ? 0.75 : 0.32}
            />
            {bad && (
              <circle cx="-8" cy="3" r="3" fill={C.danger}>
                {animated && (
                  <animate attributeName="opacity" values="1;0.25;1" dur="1.8s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
                )}
              </circle>
            )}
          </g>
        );
      })}
    </g>
    <text x="28" y="44" fill={C.text} fontSize="10" fontFamily="monospace" opacity="0.6">
      raw
    </text>

    {/* ---- centre: the shield ---- */}
    <g transform="translate(230 160)">
      <path
        d="M0 -62 L46 -44 V4 C46 34 24 54 0 62 C-24 54 -46 34 -46 4 V-44 Z"
        fill="url(#hs-shield)"
        stroke={C.cyan}
        strokeWidth="1.5"
        opacity="0.28"
      />
      <path
        d="M0 -62 L46 -44 V4 C46 34 24 54 0 62 C-24 54 -46 34 -46 4 V-44 Z"
        fill="none"
        stroke={C.cyan}
        strokeWidth="2"
      >
        {animated && (
          <animate attributeName="stroke-opacity" values="0.55;1;0.55" dur="3s" repeatCount="indefinite" />
        )}
      </path>
      <path d="M-18 2 L-5 16 L20 -14" fill="none" stroke={C.teal} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        {animated && (
          <>
            <animate attributeName="stroke-dasharray" values="0 60;60 60" dur="1.2s" fill="freeze" />
            <animate attributeName="stroke-opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite" />
          </>
        )}
      </path>
    </g>

    {/* ---- the two dangerous tokens flying into the shield ---- */}
    {animated && (
      <>
        <g>
          <rect x="150" y="118" width="26" height="9" rx="3" fill={C.danger} opacity="0.85" />
          <animateTransform attributeName="transform" type="translate" values="0 0; 62 40; 62 40" dur="2.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.62;1" dur="2.6s" repeatCount="indefinite" />
        </g>
        <g>
          <rect x="150" y="190" width="20" height="9" rx="3" fill={C.amber} opacity="0.85" />
          <animateTransform attributeName="transform" type="translate" values="0 0; 66 -22; 66 -22" dur="2.6s" begin="1.1s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.62;1" dur="2.6s" begin="1.1s" repeatCount="indefinite" />
        </g>
      </>
    )}

    {/* ---- right panel: what comes out ---- */}
    <rect x="292" y="52" width="150" height="216" rx="12" fill="url(#hs-panel)" stroke={C.line} />
    <g clipPath="url(#hs-clip-right)">
      {[0, 1, 2, 3, 4, 5].map(i => (
        <g key={i} transform={`translate(306 ${76 + i * 30})`}>
          <rect width="10" height="6" rx="2" fill={C.cyan} opacity="0.6" />
          <rect x="16" width={[70, 92, 58, 84, 66, 96][i]} height="6" rx="3" fill={C.teal} opacity="0.35" />
          {animated && (
            <animate attributeName="opacity" values="0;1" dur="0.5s" begin={`${0.6 + i * 0.12}s`} fill="freeze" />
          )}
        </g>
      ))}
    </g>
    <text x="302" y="44" fill={C.teal} fontSize="10" fontFamily="monospace" opacity="0.75">
      clean
    </text>
  </svg>
);

// ---------------------------------------------------------------------------
// Feature icons — 32×32 viewBox, stroke-driven so they sit next to lucide
// without looking like a different family.
// ---------------------------------------------------------------------------

const iconProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const IconPolicy: React.FC<ArtProps> = ({ className }) => (
  <svg viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g {...iconProps}>
      <path d="M6 5h20v22H6z" />
      <path d="M10 11h8M10 16h12M10 21h6" />
      <circle cx="24" cy="21" r="3.5" />
      <path d="M22.6 21l1 1 2-2.2" />
    </g>
  </svg>
);

export const IconReport: React.FC<ArtProps> = ({ className }) => (
  <svg viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g {...iconProps}>
      <path d="M5 26V13M12 26V7M19 26v-9M26 26V4" />
      <path d="M3 29h26" />
    </g>
  </svg>
);

export const IconUndo: React.FC<ArtProps> = ({ className }) => (
  <svg viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g {...iconProps}>
      <path d="M7 12h13a7 7 0 0 1 0 14h-9" />
      <path d="M11 7l-5 5 5 5" />
    </g>
  </svg>
);

export const IconScheme: React.FC<ArtProps> = ({ className }) => (
  <svg viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g {...iconProps}>
      <path d="M13 19a5 5 0 0 0 7 0l4-4a5 5 0 0 0-7-7l-1.5 1.5" />
      <path d="M19 13a5 5 0 0 0-7 0l-4 4a5 5 0 0 0 7 7l1.5-1.5" />
      <path d="M4 4l24 24" stroke="currentColor" opacity="0.45" />
    </g>
  </svg>
);

export const IconPreview: React.FC<ArtProps> = ({ className }) => (
  <svg viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g {...iconProps}>
      <rect x="3" y="6" width="26" height="20" rx="3" />
      <path d="M3 12h26" />
      <circle cx="7" cy="9" r="1" />
      <path d="M11 18h10M11 22h6" />
    </g>
  </svg>
);

export const IconLocalOnly: React.FC<ArtProps> = ({ className }) => (
  <svg viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g {...iconProps}>
      <path d="M16 3l11 4.5v9c0 7-4.7 11.5-11 13.5C9.7 28 5 23.5 5 16.5v-9z" />
      <path d="M16 12v6" />
      <circle cx="16" cy="21.5" r="1" />
    </g>
  </svg>
);

export const IconFormat: React.FC<ArtProps> = ({ className }) => (
  <svg viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g {...iconProps}>
      <path d="M11 8l-6 8 6 8M21 8l6 8-6 8" />
      <path d="M18 6l-4 20" />
    </g>
  </svg>
);

export const IconHandoff: React.FC<ArtProps> = ({ className }) => (
  <svg viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g {...iconProps}>
      <rect x="3" y="10" width="11" height="12" rx="2.5" />
      <rect x="18" y="10" width="11" height="12" rx="2.5" />
      <path d="M14 16h4" />
      <path d="M16.5 14l2 2-2 2" />
    </g>
  </svg>
);

// ---------------------------------------------------------------------------
// "How it works" step art — 120×90, one idea each.
// ---------------------------------------------------------------------------

const StepFrame: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <svg viewBox="0 0 120 90" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="1" y="1" width="118" height="88" rx="12" fill={C.panel} stroke={C.line} strokeOpacity="0.7" />
    {children}
  </svg>
);

/** 1 — the HTML arrives and simply waits. Nothing runs. */
export const StepPaste: React.FC<ArtProps> = ({ className, animated = true }) => (
  <StepFrame className={className}>
    <rect x="18" y="18" width="84" height="54" rx="8" fill={C.panelSoft} stroke={C.line} />
    {[0, 1, 2, 3].map(i => (
      <rect key={i} x="28" y={28 + i * 11} width={[52, 64, 40, 58][i]} height="5" rx="2.5" fill={C.text} opacity="0.28">
        {animated && <animate attributeName="opacity" values="0;0.28" dur="0.4s" begin={`${i * 0.12}s`} fill="freeze" />}
      </rect>
    ))}
    <circle cx="96" cy="66" r="9" fill={C.ink} stroke={C.cyanDim} />
    <path d="M96 61v5l3 2" stroke={C.cyan} strokeWidth="1.6" fill="none" strokeLinecap="round">
      {animated && (
        <animateTransform attributeName="transform" type="rotate" from="0 96 66" to="360 96 66" dur="6s" repeatCount="indefinite" />
      )}
    </path>
  </StepFrame>
);

/** 2 — pick a policy. Four cards, one selected. */
export const StepPolicy: React.FC<ArtProps> = ({ className, animated = true }) => (
  <StepFrame className={className}>
    {[0, 1, 2, 3].map(i => (
      <g key={i}>
        <rect
          x={14 + i * 24}
          y="26"
          width="19"
          height="38"
          rx="5"
          fill={i === 1 ? C.cyanDim : C.panelSoft}
          fillOpacity={i === 1 ? 0.35 : 1}
          stroke={i === 1 ? C.cyan : C.line}
        />
        <rect x={18 + i * 24} y="34" width="11" height="4" rx="2" fill={i === 1 ? C.cyan : C.text} opacity={i === 1 ? 0.85 : 0.3} />
        <rect x={18 + i * 24} y="42" width="8" height="3" rx="1.5" fill={C.text} opacity="0.25" />
        <rect x={18 + i * 24} y="49" width="10" height="3" rx="1.5" fill={C.text} opacity="0.25" />
      </g>
    ))}
    <circle cx="42.5" cy="20" r="4" fill={C.cyan} opacity="0.9">
      {animated && <animate attributeName="r" values="3;4.5;3" dur="2.4s" repeatCount="indefinite" />}
    </circle>
  </StepFrame>
);

/** 3 — the run: dangerous nodes drop out of the stream. */
export const StepClean: React.FC<ArtProps> = ({ className, animated = true }) => (
  <StepFrame className={className}>
    <path d="M16 45h88" stroke={C.line} strokeWidth="2" strokeDasharray="4 4" />
    {[0, 1, 2, 3, 4].map(i => {
      const bad = i === 1 || i === 3;
      return (
        <rect
          key={i}
          x={20 + i * 17}
          y="39"
          width="12"
          height="12"
          rx="3"
          fill={bad ? C.danger : C.teal}
          opacity={bad ? 0.85 : 0.55}
        >
          {animated && bad && (
            <animate attributeName="y" values="39;39;72" keyTimes="0;0.45;1" dur="2.8s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
          )}
          {animated && bad && (
            <animate attributeName="opacity" values="0.85;0.85;0" keyTimes="0;0.45;1" dur="2.8s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
          )}
        </rect>
      );
    })}
    <path d="M60 18v14" stroke={C.cyan} strokeWidth="2" strokeLinecap="round" />
    <path d="M55 27l5 5 5-5" stroke={C.cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </StepFrame>
);

/** 4 — the report, with one row being put back. */
export const StepReview: React.FC<ArtProps> = ({ className, animated = true }) => (
  <StepFrame className={className}>
    {[0, 1, 2].map(i => (
      <g key={i}>
        <rect x="16" y={22 + i * 18} width="88" height="14" rx="5" fill={C.panelSoft} stroke={i === 1 ? C.cyan : C.line} strokeOpacity={i === 1 ? 0.9 : 0.5} />
        <circle cx="25" cy={29 + i * 18} r="3" fill={i === 0 ? C.danger : i === 1 ? C.amber : C.cyanDim} opacity="0.9" />
        <rect x="33" y={26.5 + i * 18} width={[42, 34, 50][i]} height="5" rx="2.5" fill={C.text} opacity="0.3" />
        <rect x="88" y={26 + i * 18} width="10" height="6" rx="3" fill={i === 1 ? C.cyan : C.line} opacity={i === 1 ? 0.8 : 0.6}>
          {animated && i === 1 && <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2s" repeatCount="indefinite" />}
        </rect>
      </g>
    ))}
  </StepFrame>
);
