import React from 'react';

// ============================================================================
// Bespoke SVG artwork for the UUID Generator, in the tool's violet palette.
// Everything animates with SMIL and every animation is behind `animated`, so
// prefers-reduced-motion produces a still, complete picture rather than a
// half-drawn one.
// ============================================================================

interface ArtProps {
  className?: string;
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Hero: 128 loose bits falling into the five groups of a canonical UUID — the
// whole idea of the tool (raw entropy → a structured identifier) in one frame.
// ---------------------------------------------------------------------------
export const UuidHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => {
  const groups = [8, 4, 4, 4, 12];
  let cursor = 0;

  return (
    <svg viewBox="0 0 400 270" className={`tool-hero-art ${className}`} role="img" aria-hidden="true">
      <defs>
        <linearGradient id="uuidCell" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
        <linearGradient id="uuidFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.55" />
        </linearGradient>
        <clipPath id="uuidRain">
          <rect x="20" y="18" width="360" height="104" rx="14" />
        </clipPath>
      </defs>

      {/* Entropy field */}
      <rect x="20" y="18" width="360" height="104" rx="14" fill="#150a22" stroke="#3b1d63" />
      <g clipPath="url(#uuidRain)" fontFamily="ui-monospace, monospace" fontSize="9" fill="#7c5cc4">
        {Array.from({ length: 13 }).map((_, column) => (
          <g key={column} transform={`translate(${32 + column * 27}, 0)`}>
            <text y="0">
              {Array.from({ length: 9 }).map((__, row) => (
                <tspan key={row} x="0" dy={row === 0 ? 30 : 12}>
                  {(column * 7 + row * 3) % 2 === 0 ? '01' : '10'}
                </tspan>
              ))}
            </text>
            {animated && (
              <animateTransform
                attributeName="transform"
                type="translate"
                values={`${32 + column * 27},-26; ${32 + column * 27},34`}
                dur={`${2.6 + (column % 5) * 0.45}s`}
                repeatCount="indefinite"
              />
            )}
          </g>
        ))}
      </g>
      <rect x="20" y="70" width="360" height="52" rx="14" fill="url(#uuidFade)" opacity="0.35" />

      {/* Funnel */}
      <path d="M60 122 L200 158 L340 122" fill="none" stroke="#7c3aed" strokeWidth="2" strokeDasharray="5 6" opacity="0.6">
        {animated && <animate attributeName="stroke-dashoffset" values="0;-22" dur="1.6s" repeatCount="indefinite" />}
      </path>

      {/* Canonical form */}
      <g transform="translate(24,176)">
        {groups.map((size, groupIndex) => {
          const start = cursor;
          cursor += size;
          return (
            <g key={groupIndex}>
              {Array.from({ length: size }).map((_, i) => {
                const index = start + i;
                return (
                  <rect
                    key={i}
                    x={index * 10.5 + groupIndex * 8}
                    y="0"
                    width="8.5"
                    height="26"
                    rx="2.5"
                    fill="url(#uuidCell)"
                    opacity={0.55 + ((index * 7) % 5) * 0.09}
                  >
                    {animated && (
                      <animate
                        attributeName="opacity"
                        values="0.35;1;0.35"
                        dur="3.2s"
                        begin={`${index * 0.055}s`}
                        repeatCount="indefinite"
                      />
                    )}
                  </rect>
                );
              })}
              {groupIndex < 4 && (
                <rect x={cursor * 10.5 + groupIndex * 8 + 1.5} y="12" width="5" height="2.5" rx="1.2" fill="#5b21b6" />
              )}
            </g>
          );
        })}
      </g>

      {/* Version + variant callouts: the two nibbles that classify a UUID */}
      <g fontFamily="ui-monospace, monospace" fontSize="9" fill="#a78bfa">
        <rect x="126" y="216" width="52" height="18" rx="6" fill="#2a1247" stroke="#5b21b6" />
        <text x="152" y="229" textAnchor="middle">version</text>
        <path d="M152 216 L152 206" stroke="#5b21b6" strokeWidth="1.5" />
        <rect x="196" y="216" width="52" height="18" rx="6" fill="#2a1247" stroke="#5b21b6" />
        <text x="222" y="229" textAnchor="middle">variant</text>
        <path d="M222 216 L222 206" stroke="#5b21b6" strokeWidth="1.5" />
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Feature icons — drawn for this tool, not borrowed from an icon set.
// ---------------------------------------------------------------------------

const iconProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** Eleven flavours stacked as labelled chips. */
export const IconFlavours: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} {...iconProps} aria-hidden="true">
    <rect x="2.5" y="3.5" width="19" height="5" rx="2" />
    <rect x="2.5" y="10" width="13" height="4" rx="1.6" opacity="0.75" />
    <rect x="2.5" y="15.5" width="16" height="4" rx="1.6" opacity="0.5" />
    <path d="M18 12h3.5M20.5 17.5h1" opacity="0.5" />
    <circle cx="6" cy="6" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

/** A clock whose hand doubles as a sort arrow: time-ordered ids. */
export const IconSortable: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} {...iconProps} aria-hidden="true">
    <circle cx="9" cy="9" r="6.2" />
    <path d="M9 5.6V9l2.4 1.6" />
    <path d="M18 6.5v13M15 16.5l3 3 3-3" />
  </svg>
);

/** Sixteen cells with one highlighted: byte-level inspection. */
export const IconInspect: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} {...iconProps} aria-hidden="true">
    {Array.from({ length: 8 }).map((_, i) => (
      <rect key={i} x={2.5 + (i % 4) * 4.4} y={4 + Math.floor(i / 4) * 5} width="3.6" height="4" rx="1" opacity={i === 2 ? 1 : 0.4} />
    ))}
    <circle cx="16" cy="15" r="5" />
    <path d="M19.6 18.6L22 21" />
    <path d="M14 15h4" opacity="0.6" />
  </svg>
);

/** A CPU with threads leaving it: the worker. */
export const IconWorker: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} {...iconProps} aria-hidden="true">
    <rect x="7" y="7" width="10" height="10" rx="2.5" />
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M18 6l-2 2M6 18l2-2M18 18l-2-2" opacity="0.7" />
    <path d="M10.2 10.5h3.6v3H10.2z" opacity="0.55" />
  </svg>
);

/** A padlock made of a bracket pair: local-only. */
export const IconLocal: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} {...iconProps} aria-hidden="true">
    <path d="M8.5 3.5H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h2.5M15.5 3.5H18a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-2.5" />
    <rect x="9" y="11" width="6" height="5" rx="1.4" />
    <path d="M10.5 11V9.4a1.5 1.5 0 0 1 3 0V11" />
  </svg>
);

/** Braces, hyphens and quotes: output formatting. */
export const IconFormat: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} {...iconProps} aria-hidden="true">
    <path d="M9 4.5C6.5 4.5 7.5 11 4.5 11c3 0 2 6.5 4.5 6.5M15 4.5c2.5 0 1.5 6.5 4.5 6.5-3 0-2 6.5-4.5 6.5" />
    <path d="M10 20.5h4" opacity="0.6" />
    <circle cx="12" cy="11" r="1.2" fill="currentColor" stroke="none" opacity="0.7" />
  </svg>
);

// ---------------------------------------------------------------------------
// "How it works" artwork, one per step.
// ---------------------------------------------------------------------------

/** 1 — pick a flavour. */
export const StepChoose: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 96 64" className={className} role="img" aria-hidden="true">
    <rect x="4" y="10" width="40" height="14" rx="7" fill="#6d28d9" opacity="0.9" />
    <text x="24" y="20" textAnchor="middle" fontSize="8" fontFamily="ui-monospace, monospace" fill="#f5f3ff">v4</text>
    <rect x="50" y="10" width="40" height="14" rx="7" fill="none" stroke="#5b21b6" />
    <text x="70" y="20" textAnchor="middle" fontSize="8" fontFamily="ui-monospace, monospace" fill="#a78bfa">v7</text>
    <rect x="4" y="30" width="40" height="14" rx="7" fill="none" stroke="#5b21b6" />
    <text x="24" y="40" textAnchor="middle" fontSize="8" fontFamily="ui-monospace, monospace" fill="#a78bfa">ulid</text>
    <rect x="50" y="30" width="40" height="14" rx="7" fill="none" stroke="#5b21b6" />
    <text x="70" y="40" textAnchor="middle" fontSize="8" fontFamily="ui-monospace, monospace" fill="#a78bfa">v5</text>
    <path d="M14 52h68" stroke="#3b1d63" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/** 2 — set the amount and the shape of the output. */
export const StepTune: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 96 64" className={className} role="img" aria-hidden="true">
    <path d="M8 18h80M8 34h80M8 50h80" stroke="#3b1d63" strokeWidth="3" strokeLinecap="round" />
    <path d="M8 18h44M8 34h22M8 50h62" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" />
    <circle cx="52" cy="18" r="6" fill="#150a22" stroke="#a78bfa" strokeWidth="2" />
    <circle cx="30" cy="34" r="6" fill="#150a22" stroke="#a78bfa" strokeWidth="2" />
    <circle cx="70" cy="50" r="6" fill="#150a22" stroke="#a78bfa" strokeWidth="2" />
  </svg>
);

/** 3 — press the button; the worker does the run. */
export const StepGenerate: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 96 64" className={className} role="img" aria-hidden="true">
    <rect x="18" y="12" width="60" height="20" rx="10" fill="#6d28d9" />
    <path d="M42 22h12M48 17l6 5-6 5" stroke="#f5f3ff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <text x="34" y="26" textAnchor="middle" fontSize="9" fontFamily="ui-monospace, monospace" fill="#f5f3ff">run</text>
    {[0, 1, 2, 3, 4].map(i => (
      <rect key={i} x={12 + i * 15} y={42} width="11" height="11" rx="3" fill="#a78bfa" opacity={0.85 - i * 0.13} />
    ))}
  </svg>
);

/** 4 — take it away: copy, download, or hand it to the next tool. */
export const StepTake: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 96 64" className={className} role="img" aria-hidden="true">
    <rect x="10" y="10" width="34" height="42" rx="6" fill="none" stroke="#5b21b6" strokeWidth="2" />
    <path d="M18 22h18M18 30h18M18 38h11" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M52 31h24M68 23l8 8-8 8" stroke="#a78bfa" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="78" y="20" width="12" height="22" rx="4" fill="#6d28d9" opacity="0.8" />
  </svg>
);
