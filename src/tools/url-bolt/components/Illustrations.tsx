import React from 'react';

// ============================================================================
// Bespoke SVG artwork for URLBolt, in the tool's emerald palette.
// Every animation is SMIL and gated behind `animated`, which the caller wires
// to prefers-reduced-motion.
// ============================================================================

interface ArtProps {
  className?: string;
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Hero: an address bar coming apart into the pieces the tool works with, with
// the encoded form streaming underneath.
// ---------------------------------------------------------------------------
export const UrlHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 400 270" className={className} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="ubBar" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#064e3b" />
        <stop offset="100%" stopColor="#022c22" />
      </linearGradient>
      <linearGradient id="ubSweep" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#34d399" stopOpacity="0" />
        <stop offset="50%" stopColor="#34d399" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
      </linearGradient>
      <clipPath id="ubBarClip">
        <rect x="26" y="26" width="348" height="46" rx="14" />
      </clipPath>
    </defs>

    {/* Address bar */}
    <rect x="26" y="26" width="348" height="46" rx="14" fill="url(#ubBar)" stroke="#065f46" strokeWidth="1.5" />
    <circle cx="52" cy="49" r="8" fill="#022c22" stroke="#10b981" strokeWidth="1.5" />
    <path d="M49 49a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3" fill="none" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" />

    {/* The URL, split into its coloured runs */}
    <g fontFamily="ui-monospace, monospace" fontSize="11" fontWeight="700">
      <text x="70" y="53" fill="#fbbf24">https://</text>
      <text x="118" y="53" fill="#34d399">shop.example</text>
      <text x="192" y="53" fill="#a78bfa">/item/42</text>
      <text x="240" y="53" fill="#38bdf8">?q=caf%C3%A9</text>
      <text x="316" y="53" fill="#f472b6">#top</text>
    </g>

    {animated && (
      <g clipPath="url(#ubBarClip)">
        <rect x="-120" y="26" width="120" height="46" fill="url(#ubSweep)">
          <animate attributeName="x" values="-120;400" dur="4s" repeatCount="indefinite" />
        </rect>
      </g>
    )}

    {/* Connectors down to the parts */}
    <g stroke="#065f46" strokeWidth="1.5" fill="none" strokeDasharray="3 4">
      <path d="M88 72v22h-14v18" />
      <path d="M150 72v40" />
      <path d="M214 72v22h14v18" />
      <path d="M272 72v22h44v18" />
    </g>

    {/* Part chips */}
    {[
      { x: 40, label: 'scheme', color: '#fbbf24', bg: 'rgba(251,191,36,0.10)' },
      { x: 118, label: 'host', color: '#34d399', bg: 'rgba(52,211,153,0.10)' },
      { x: 196, label: 'path', color: '#a78bfa', bg: 'rgba(167,139,250,0.10)' },
      { x: 284, label: 'query', color: '#38bdf8', bg: 'rgba(56,189,248,0.10)' },
    ].map((chip, i) => (
      <g key={chip.label}>
        <rect x={chip.x} y={112} width="68" height="30" rx="9" fill={chip.bg} stroke={chip.color} strokeOpacity="0.4" strokeWidth="1.2">
          {animated && (
            <animate
              attributeName="stroke-opacity"
              values="0.4;0.95;0.4"
              dur="4s"
              begin={`${i * 1}s`}
              repeatCount="indefinite"
            />
          )}
        </rect>
        <text
          x={chip.x + 34}
          y={131}
          textAnchor="middle"
          fill={chip.color}
          fontFamily="ui-monospace, monospace"
          fontSize="10"
          fontWeight="800"
        >
          {chip.label}
        </text>
      </g>
    ))}

    {/* Parameter rows */}
    <rect x="26" y="162" width="348" height="82" rx="16" fill="#04130e" stroke="#065f46" strokeOpacity="0.6" strokeWidth="1.2" />
    {[
      { y: 182, key: 'q', value: 'café', ok: true },
      { y: 205, key: 'utm_source', value: 'newsletter', ok: false },
      { y: 228, key: 'fbclid', value: 'IwAR2x…', ok: false },
    ].map((row, i) => (
      <g key={row.key}>
        <rect x={40} y={row.y - 11} width="82" height="18" rx="5" fill="rgba(56,189,248,0.12)" />
        <text x={46} y={row.y + 2} fill="#7dd3fc" fontFamily="ui-monospace, monospace" fontSize="9.5" fontWeight="700">
          {row.key}
        </text>
        <text x={134} y={row.y + 2} fill="#94a3b8" fontFamily="ui-monospace, monospace" fontSize="9.5">
          {row.value}
        </text>
        {row.ok ? (
          <path
            d={`M336 ${row.y - 1}l4 4 7-8`}
            fill="none"
            stroke="#34d399"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <g stroke="#f87171" strokeWidth="2.2" strokeLinecap="round" opacity="0.9">
            <path d={`M336 ${row.y - 5}l10 10`} />
            <path d={`M346 ${row.y - 5}l-10 10`} />
            {animated && (
              <animate attributeName="opacity" values="0.9;0.25;0.9" dur="3s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
            )}
          </g>
        )}
      </g>
    ))}
  </svg>
);

// ---------------------------------------------------------------------------
// Feature icons — drawn for this tool, not borrowed from a generic set.
// ---------------------------------------------------------------------------

const iconProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** A percent sign made of bytes: the encoding profiles. */
export const IconPercent: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 32 32" className={className} {...iconProps} role="img" aria-hidden="true">
    <circle cx="10" cy="10" r="4" />
    <circle cx="22" cy="22" r="4" />
    <path d="M25 7 7 25" />
    <path d="M28 5h2M2 27h2" opacity="0.5" />
  </svg>
);

/** Nested chevrons: layered / double encoding. */
export const IconLayers: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 32 32" className={className} {...iconProps} role="img" aria-hidden="true">
    <path d="M16 4 4 10l12 6 12-6-12-6Z" />
    <path d="M4 16l12 6 12-6" />
    <path d="M4 22l12 6 12-6" opacity="0.55" />
  </svg>
);

/** A key/value grid with a cursor: the editable parameter table. */
export const IconTable: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 32 32" className={className} {...iconProps} role="img" aria-hidden="true">
    <rect x="3" y="6" width="26" height="20" rx="3" />
    <path d="M3 13h26M13 13v13" />
    <path d="M17 19h8" />
    <path d="M6 9.5h4" opacity="0.6" />
  </svg>
);

/** A broom over a link: tracker cleanup. */
export const IconBroom: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 32 32" className={className} {...iconProps} role="img" aria-hidden="true">
    <path d="M20 4 12 12" />
    <path d="M9 15l8-8 5 5-8 8Z" />
    <path d="M14 20 8 26" />
    <path d="M10 22l-4 4M18 24l-4 4" opacity="0.55" />
  </svg>
);

/** A shield holding a magnifier: the risk findings. */
export const IconShieldScan: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 32 32" className={className} {...iconProps} role="img" aria-hidden="true">
    <path d="M16 3 5 7v9c0 6.5 4.6 11.4 11 13 6.4-1.6 11-6.5 11-13V7L16 3Z" />
    <circle cx="16" cy="15" r="4" />
    <path d="M19 18l3 3" />
  </svg>
);

/** Stacked lines flowing into one: the batch list. */
export const IconBatch: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 32 32" className={className} {...iconProps} role="img" aria-hidden="true">
    <path d="M4 8h14M4 14h14M4 20h9" />
    <path d="M20 11l6 5-6 5" />
    <path d="M26 16h-8" opacity="0.6" />
  </svg>
);

/** A browser window with a padlock: everything stays local. */
export const IconLocalOnly: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 32 32" className={className} {...iconProps} role="img" aria-hidden="true">
    <rect x="3" y="5" width="26" height="22" rx="3" />
    <path d="M3 11h26" />
    <rect x="12" y="16" width="8" height="7" rx="1.6" />
    <path d="M14 16v-2a2 2 0 0 1 4 0v2" />
  </svg>
);

/** Two arrows completing a circle: the round-trip check. */
export const IconRoundTrip: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 32 32" className={className} {...iconProps} role="img" aria-hidden="true">
    <path d="M6 13a10 10 0 0 1 17-4" />
    <path d="M26 19a10 10 0 0 1-17 4" />
    <path d="M23 4v5h-5M9 28v-5h5" />
  </svg>
);

// ---------------------------------------------------------------------------
// "How it works" step art
// ---------------------------------------------------------------------------

const stepProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** 1 — the URL arrives: pasted, dropped or handed over by another tool. */
export const StepPaste: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 96 64" className={className} {...stepProps} role="img" aria-hidden="true">
    <rect x="8" y="14" width="58" height="20" rx="7" />
    <path d="M17 24h34" opacity="0.45" />
    <path d="M74 24h14" opacity="0.7" />
    <path d="M82 18l6 6-6 6" opacity="0.7" />
    <rect x="20" y="42" width="34" height="12" rx="4" opacity="0.35" />
  </svg>
);

/** 2 — it is taken apart. */
export const StepSplit: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 96 64" className={className} {...stepProps} role="img" aria-hidden="true">
    <rect x="6" y="24" width="26" height="16" rx="5" />
    <path d="M36 32h10" opacity="0.5" />
    <rect x="50" y="10" width="40" height="13" rx="5" opacity="0.85" />
    <rect x="50" y="26" width="30" height="13" rx="5" opacity="0.6" />
    <rect x="50" y="42" width="36" height="13" rx="5" opacity="0.4" />
  </svg>
);

/** 3 — you edit it by hand. */
export const StepEdit: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 96 64" className={className} {...stepProps} role="img" aria-hidden="true">
    <rect x="8" y="12" width="58" height="40" rx="6" />
    <path d="M8 24h58" opacity="0.5" />
    <path d="M18 34h20M18 42h14" opacity="0.4" />
    <path d="M62 46l20-20 6 6-20 20-8 2 2-8Z" />
  </svg>
);

/** 4 — the clean result leaves, straight into the next tool. */
export const StepShip: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 96 64" className={className} {...stepProps} role="img" aria-hidden="true">
    <rect x="8" y="20" width="46" height="18" rx="7" />
    <path d="M17 29h26" opacity="0.45" />
    <path d="M60 29h22" />
    <path d="M74 22l8 7-8 7" />
    <path d="M26 48l6 6 12-14" opacity="0.75" />
  </svg>
);
