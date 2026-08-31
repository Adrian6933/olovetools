import React from 'react';

// ============================================================================
// Bespoke SVG artwork for Base64Bolt, in the tool's blue palette.
// Every animation is SMIL and gated behind `animated`, which the caller wires
// to prefers-reduced-motion. Nothing here is an emoji or a borrowed icon set.
// ============================================================================

interface ArtProps {
  className?: string;
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Hero: three raw bytes on top, the 24 bits they hold in the middle, and the
// four Base64 characters they become underneath. That 3-to-4 relationship is
// literally the whole algorithm, so it is what the picture shows.
// ---------------------------------------------------------------------------
export const Base64HeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 400 280" className={className} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="b64Panel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0a1a3a" />
        <stop offset="100%" stopColor="#04102a" />
      </linearGradient>
      <linearGradient id="b64Sweep" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#60a5fa" stopOpacity="0" />
        <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
      </linearGradient>
      <clipPath id="b64BitClip">
        <rect x="26" y="112" width="348" height="34" rx="10" />
      </clipPath>
    </defs>

    {/* Three source bytes */}
    {[
      { x: 30, hex: '4D', char: 'M' },
      { x: 146, hex: '61', char: 'a' },
      { x: 262, hex: '6E', char: 'n' },
    ].map((byte, i) => (
      <g key={byte.hex}>
        <rect
          x={byte.x}
          y={26}
          width="108"
          height="52"
          rx="14"
          fill="url(#b64Panel)"
          stroke="#1e3a8a"
          strokeWidth="1.5"
        >
          {animated && (
            <animate
              attributeName="stroke"
              values="#1e3a8a;#3b82f6;#1e3a8a"
              dur="4.5s"
              begin={`${i * 0.5}s`}
              repeatCount="indefinite"
            />
          )}
        </rect>
        <text
          x={byte.x + 32}
          y={58}
          textAnchor="middle"
          fill="#93c5fd"
          fontFamily="ui-monospace, monospace"
          fontSize="18"
          fontWeight="800"
        >
          {byte.hex}
        </text>
        <line x1={byte.x + 58} y1={38} x2={byte.x + 58} y2={66} stroke="#1e3a8a" strokeWidth="1.2" />
        <text
          x={byte.x + 82}
          y={58}
          textAnchor="middle"
          fill="#e2e8f0"
          fontFamily="ui-monospace, monospace"
          fontSize="18"
          fontWeight="800"
        >
          {byte.char}
        </text>
      </g>
    ))}

    {/* 8 bits + 8 bits + 8 bits funnel into one 24-bit run */}
    <g stroke="#1e40af" strokeWidth="1.4" fill="none" strokeDasharray="3 4">
      <path d="M84 78v18h32v16" />
      <path d="M200 78v34" />
      <path d="M316 78v18h-32v16" />
    </g>

    {/* The 24-bit register, re-grouped into 6-bit runs */}
    <rect x="26" y="112" width="348" height="34" rx="10" fill="#020a1e" stroke="#1e40af" strokeWidth="1.4" />
    {Array.from({ length: 24 }, (_, i) => {
      const bit = '010011010110000101101110'[i];
      const group = Math.floor(i / 6);
      const colors = ['#60a5fa', '#38bdf8', '#818cf8', '#a78bfa'];
      return (
        <text
          key={i}
          x={40 + i * 14}
          y={134}
          fill={bit === '1' ? colors[group] : '#334155'}
          fontFamily="ui-monospace, monospace"
          fontSize="12"
          fontWeight="800"
        >
          {bit}
        </text>
      );
    })}
    {/* 6-bit group separators, which is where Base64 differs from hex */}
    {[1, 2, 3].map(n => (
      <line key={n} x1={34 + n * 84} y1={116} x2={34 + n * 84} y2={142} stroke="#1e40af" strokeWidth="1" strokeDasharray="2 3" />
    ))}
    {animated && (
      <g clipPath="url(#b64BitClip)">
        <rect x="-120" y="112" width="120" height="34" fill="url(#b64Sweep)">
          <animate attributeName="x" values="-120;400" dur="4.5s" repeatCount="indefinite" />
        </rect>
      </g>
    )}

    <g stroke="#1e40af" strokeWidth="1.4" fill="none" strokeDasharray="3 4">
      <path d="M60 146v26" />
      <path d="M144 146v26" />
      <path d="M228 146v26" />
      <path d="M312 146v26" />
    </g>

    {/* Four Base64 characters */}
    {[
      { x: 30, char: 'T', color: '#60a5fa' },
      { x: 114, char: 'W', color: '#38bdf8' },
      { x: 198, char: 'F', color: '#818cf8' },
      { x: 282, char: 'u', color: '#a78bfa' },
    ].map((cell, i) => (
      <g key={cell.char}>
        <rect
          x={cell.x}
          y={172}
          width="60"
          height="46"
          rx="12"
          fill={`${cell.color}1a`}
          stroke={cell.color}
          strokeOpacity="0.45"
          strokeWidth="1.4"
        >
          {animated && (
            <animate
              attributeName="stroke-opacity"
              values="0.45;1;0.45"
              dur="4.5s"
              begin={`${i * 0.9}s`}
              repeatCount="indefinite"
            />
          )}
        </rect>
        <text
          x={cell.x + 30}
          y={203}
          textAnchor="middle"
          fill={cell.color}
          fontFamily="ui-monospace, monospace"
          fontSize="22"
          fontWeight="800"
        >
          {cell.char}
        </text>
      </g>
    ))}

    {/* The 4:3 ratio, spelled out */}
    <rect x="26" y="234" width="348" height="30" rx="10" fill="#04102a" stroke="#1e3a8a" strokeOpacity="0.7" strokeWidth="1.2" />
    <text x="42" y="253" fill="#64748b" fontFamily="ui-monospace, monospace" fontSize="11" fontWeight="700">
      3 bytes
    </text>
    <path d="M104 248h24" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M122 243l6 5-6 5" stroke="#3b82f6" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <text x="138" y="253" fill="#93c5fd" fontFamily="ui-monospace, monospace" fontSize="11" fontWeight="700">
      4 chars
    </text>
    <text x="216" y="253" fill="#475569" fontFamily="ui-monospace, monospace" fontSize="11" fontWeight="700">
      +33% size
    </text>
    <circle cx="344" cy="249" r="7" fill="none" stroke="#3b82f6" strokeWidth="1.4" />
    <path d="M341 249l2.5 2.5 4.5-5" stroke="#60a5fa" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
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

/** Three cells becoming four: the 3:4 expansion. */
export const IconRatio: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 32 32" className={className} {...iconProps} role="img" aria-hidden="true">
    <rect x="3" y="7" width="7" height="7" rx="1.6" />
    <rect x="3" y="18" width="7" height="7" rx="1.6" opacity="0.55" />
    <path d="M13 16h5" />
    <path d="M15.5 13.5 18 16l-2.5 2.5" />
    <rect x="21" y="4" width="7" height="5.5" rx="1.4" />
    <rect x="21" y="11" width="7" height="5.5" rx="1.4" opacity="0.8" />
    <rect x="21" y="18" width="7" height="5.5" rx="1.4" opacity="0.6" />
    <rect x="21" y="25" width="7" height="4" rx="1.4" opacity="0.4" />
  </svg>
);

/** A link with a slash through the plus: the URL-safe alphabet. */
export const IconUrlSafe: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 32 32" className={className} {...iconProps} role="img" aria-hidden="true">
    <path d="M13 19a5 5 0 0 1 0-7l3-3a5 5 0 0 1 7 7l-1.5 1.5" />
    <path d="M19 13a5 5 0 0 1 0 7l-3 3a5 5 0 0 1-7-7l1.5-1.5" />
    <path d="M25 25l4 4" opacity="0.55" />
    <path d="M27 4l-3 3M24 4l3 3" opacity="0.7" />
  </svg>
);

/** A grid of hex pairs: the byte inspector. */
export const IconHex: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 32 32" className={className} {...iconProps} role="img" aria-hidden="true">
    <rect x="3" y="5" width="26" height="22" rx="3" />
    <path d="M3 11h26M11 11v16" />
    <path d="M14 16h4M21 16h4M14 21h4M21 21h3" opacity="0.65" />
    <path d="M6 8h3" opacity="0.5" />
  </svg>
);

/** A magnifier over a broken quartet: the diagnostics. */
export const IconDiagnose: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 32 32" className={className} {...iconProps} role="img" aria-hidden="true">
    <path d="M4 10h6M12 10h6M20 10h3" />
    <path d="M4 16h4" opacity="0.6" />
    <circle cx="18" cy="19" r="6" />
    <path d="M22.5 23.5 28 29" />
    <path d="M18 16.5v3M18 21.5v.5" strokeWidth="2" />
  </svg>
);

/** A file with a fingerprint: the sniffed format. */
export const IconSniff: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 32 32" className={className} {...iconProps} role="img" aria-hidden="true">
    <path d="M7 4h11l7 7v17a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
    <path d="M18 4v7h7" opacity="0.6" />
    <path d="M12 24a5 5 0 0 1 8 0" />
    <path d="M13.5 20.5a4 4 0 0 1 5 0" opacity="0.7" />
    <path d="M15 17.5a2.5 2.5 0 0 1 2 0" opacity="0.5" />
  </svg>
);

/** A thread spool beside a clock: the worker. */
export const IconWorker: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 32 32" className={className} {...iconProps} role="img" aria-hidden="true">
    <rect x="3" y="6" width="12" height="20" rx="3" />
    <path d="M3 12h12M3 20h12" opacity="0.55" />
    <circle cx="23" cy="16" r="6" />
    <path d="M23 12.5V16l2.5 1.5" />
  </svg>
);

/** A gauge with a compressed bar: the measured gzip size. */
export const IconMeasure: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 32 32" className={className} {...iconProps} role="img" aria-hidden="true">
    <path d="M4 22a12 12 0 0 1 24 0" />
    <path d="M16 22l7-7" />
    <circle cx="16" cy="22" r="1.8" fill="currentColor" stroke="none" />
    <path d="M6 27h20" opacity="0.45" />
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

/** 1 — the payload arrives: typed, dropped, or handed over by another tool. */
export const StepArrive: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 96 64" className={className} {...stepProps} role="img" aria-hidden="true">
    <rect x="7" y="12" width="40" height="40" rx="6" />
    <path d="M15 24h24M15 32h18M15 40h12" opacity="0.45" />
    <path d="M56 32h26" opacity="0.75" />
    <path d="M75 25l7 7-7 7" opacity="0.75" />
    <path d="M60 14v6M57 17h6" opacity="0.5" />
  </svg>
);

/** 2 — you choose the alphabet, the padding, the wrapping. Nothing runs yet. */
export const StepChoose: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 96 64" className={className} {...stepProps} role="img" aria-hidden="true">
    <path d="M10 18h76M10 32h76M10 46h76" opacity="0.35" />
    <circle cx="30" cy="18" r="6" />
    <circle cx="62" cy="32" r="6" />
    <circle cx="42" cy="46" r="6" />
  </svg>
);

/** 3 — the bytes are inspected: format, hex, size, checksum. */
export const StepInspect: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 96 64" className={className} {...stepProps} role="img" aria-hidden="true">
    <rect x="8" y="10" width="52" height="44" rx="6" />
    <path d="M8 22h52" opacity="0.5" />
    <path d="M17 31h10M33 31h10M17 41h10M33 41h6" opacity="0.45" />
    <circle cx="70" cy="36" r="11" />
    <path d="M78 44l8 8" />
  </svg>
);

/** 4 — it leaves as a snippet, a file, or straight into the next tool. */
export const StepShip: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 96 64" className={className} {...stepProps} role="img" aria-hidden="true">
    <rect x="8" y="16" width="44" height="30" rx="6" />
    <path d="M17 26h26M17 34h18" opacity="0.45" />
    <path d="M60 31h22" />
    <path d="M74 24l8 7-8 7" />
    <path d="M22 52l6 6 12-14" opacity="0.7" />
  </svg>
);
