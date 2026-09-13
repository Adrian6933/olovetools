import React from 'react';

// ============================================================================
// Bespoke SVG artwork for HashBolt, in the tool's sky-blue palette.
// Every animation here is SMIL and is switched off with `animated={false}`
// when the visitor asked for reduced motion.
// ============================================================================

interface ArtProps {
  className?: string;
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Hero: a file is streamed through the engine in chunks and comes out the other
// side as one fixed-length fingerprint — the whole idea of the tool in one
// picture, including the part that matters (it is read in pieces, not swallowed
// whole).
// ---------------------------------------------------------------------------
export const HashHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="9 27 390 184" className={`tool-hero-art ${className}`} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="hbSheet" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0c4a6e" />
        <stop offset="100%" stopColor="#082f49" />
      </linearGradient>
      <linearGradient id="hbDigest" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#7dd3fc" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>
      <linearGradient id="hbCore" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0ea5e9" />
        <stop offset="100%" stopColor="#075985" />
      </linearGradient>
    </defs>

    {/* Source document */}
    <g>
      <path
        d="M22 40h64l24 24v122a12 12 0 0 1-12 12H34a12 12 0 0 1-12-12V52a12 12 0 0 1 12-12Z"
        fill="url(#hbSheet)"
        stroke="rgba(125,211,252,0.35)"
        strokeWidth="1.5"
      />
      <path d="M86 40v24h24" fill="none" stroke="rgba(125,211,252,0.45)" strokeWidth="1.5" />
      {[84, 100, 116, 132, 148, 164].map((y, i) => (
        <rect
          key={y}
          x="38"
          y={y}
          width={i % 3 === 2 ? 40 : 58}
          height="6"
          rx="3"
          fill="#7dd3fc"
          opacity={0.18 + (i % 3) * 0.06}
        />
      ))}
    </g>

    {/* Chunks travelling into the engine */}
    <g>
      {[0, 1, 2].map(i => (
        <rect key={i} x="128" y="112" width="16" height="16" rx="4" fill="#38bdf8" opacity="0.85">
          {animated && (
            <>
              <animate
                attributeName="x"
                values="126;186"
                dur="1.8s"
                begin={`${i * 0.6}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0;0.9;0"
                dur="1.8s"
                begin={`${i * 0.6}s`}
                repeatCount="indefinite"
              />
            </>
          )}
        </rect>
      ))}
      {!animated && <rect x="152" y="112" width="16" height="16" rx="4" fill="#38bdf8" opacity="0.6" />}
    </g>

    {/* Engine core */}
    <g transform="translate(196,78)">
      <rect x="0" y="0" width="92" height="104" rx="20" fill="#041524" stroke="rgba(14,165,233,0.4)" strokeWidth="2" />
      <rect x="16" y="16" width="60" height="72" rx="14" fill="url(#hbCore)" opacity="0.22" />
      <path
        d="M32 34v52M60 34v52M22 50h48M22 70h48"
        stroke="#7dd3fc"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.9"
      />
      {animated && (
        <circle cx="46" cy="52" r="40" fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity="0.35">
          <animate attributeName="r" values="26;46;26" dur="3.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.45;0;0.45" dur="3.4s" repeatCount="indefinite" />
        </circle>
      )}
    </g>

    {/* Digest card */}
    <g transform="translate(300,86)">
      <rect x="0" y="0" width="86" height="88" rx="16" fill="#05151f" stroke="rgba(56,189,248,0.3)" strokeWidth="1.5" />
      <rect x="14" y="18" width="40" height="7" rx="3.5" fill="#0369a1" />
      {[36, 48, 60].map((y, i) => (
        <rect key={y} x="14" y={y} width={i === 2 ? 34 : 58} height="6" rx="3" fill="url(#hbDigest)" opacity="0.9" />
      ))}
      <circle cx="66" cy="70" r="12" fill="#022c22" stroke="#34d399" strokeWidth="1.6" />
      <path d="m61 70 3.6 3.8L72 66" fill="none" stroke="#34d399" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </g>

    <path d="M290 130h8" stroke="#38bdf8" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="4 5" opacity="0.6" />
  </svg>
);

// ---------------------------------------------------------------------------
// Idle placeholder for the drop zone: a fingerprint made of hex nibbles.
// ---------------------------------------------------------------------------
export const FingerprintArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 160 160" className={className} role="img" aria-hidden="true">
    {[
      'M80 22c-24 0-42 18-42 42v18',
      'M80 40c-14 0-24 11-24 24v22c0 8-2 14-5 20',
      'M80 58c-5 0-7 4-7 8v26c0 12-3 22-8 30',
      'M80 40c14 0 24 11 24 24v22c0 10 3 18 8 24',
      'M80 58c5 0 7 4 7 8v26c0 8 1 14 3 20',
      'M122 82V64c0-24-18-42-42-42',
    ].map((d, i) => (
      <path
        key={i}
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        opacity={0.28 + i * 0.08}
      >
        {animated && (
          <animate
            attributeName="opacity"
            values={`${0.2 + i * 0.06};${0.75};${0.2 + i * 0.06}`}
            dur="4.5s"
            begin={`${i * 0.25}s`}
            repeatCount="indefinite"
          />
        )}
      </path>
    ))}
    <rect x="30" y="122" width="100" height="8" rx="4" fill="currentColor" opacity="0.2" />
    <rect x="46" y="138" width="68" height="6" rx="3" fill="currentColor" opacity="0.14" />
  </svg>
);

// ---------------------------------------------------------------------------
// Feature icons
// ---------------------------------------------------------------------------
const iconBase = 'w-6 h-6';
const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** Chunks flowing into a funnel: streaming instead of loading the whole file. */
export const IconStream: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke} aria-hidden="true">
    <rect x="2.4" y="4" width="4" height="4" rx="1" />
    <rect x="2.4" y="10" width="4" height="4" rx="1" />
    <rect x="2.4" y="16" width="4" height="4" rx="1" />
    <path d="M8 6h3.4M8 12h3.4M8 18h3.4" />
    <path d="M12.6 5.2h8.2l-4 6.6v6l-3.6-2v-4Z" />
  </svg>
);

/** One input, several digest lines: the single-pass multi-hash. */
export const IconMultiHash: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke} aria-hidden="true">
    <rect x="2.4" y="8.6" width="6" height="6.8" rx="1.8" />
    <path d="M8.8 12h3.2" />
    <path d="M12 12V6.4h9M12 12h9M12 12v5.6h9" />
    <circle cx="21.2" cy="6.4" r="1.2" />
    <circle cx="21.2" cy="12" r="1.2" />
    <circle cx="21.2" cy="17.6" r="1.2" />
  </svg>
);

/** Shield with a tick over a checksum line: the verification pass. */
export const IconVerify: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke} aria-hidden="true">
    <path d="M12 2.6 4.8 5.4v5.4c0 4.4 2.9 8.4 7.2 9.9 4.3-1.5 7.2-5.5 7.2-9.9V5.4Z" />
    <path d="m8.8 11.6 2.4 2.5 4-4.6" />
  </svg>
);

/** A browser window with a padlock: nothing leaves the tab. */
export const IconLocalOnly: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke} aria-hidden="true">
    <rect x="2.4" y="4" width="19.2" height="16" rx="2.6" />
    <path d="M2.4 8.4h19.2" />
    <rect x="9.4" y="12.6" width="5.2" height="4.4" rx="1.2" />
    <path d="M10.6 12.6v-1.4a1.4 1.4 0 0 1 2.8 0v1.4" />
  </svg>
);

/** A stack of files with a tick: the batch queue. */
export const IconBatch: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke} aria-hidden="true">
    <path d="M7.6 3.4h6l4 4v9.2a1.8 1.8 0 0 1-1.8 1.8H7.6a1.8 1.8 0 0 1-1.8-1.8V5.2a1.8 1.8 0 0 1 1.8-1.8Z" />
    <path d="M13.6 3.4v4h4" />
    <path d="M3 7.6v11.2a1.8 1.8 0 0 0 1.8 1.8h9.4" />
  </svg>
);

/** A key threaded through a digest: HMAC. */
export const IconKeyed: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke} aria-hidden="true">
    <circle cx="7" cy="12" r="3.6" />
    <path d="M10.6 12h10.2M17.6 12v3.2M20.2 12v2.4" />
  </svg>
);

// ---------------------------------------------------------------------------
// "How it works" step artwork
// ---------------------------------------------------------------------------
export const StepBring: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="12" y="18" width="34" height="46" rx="6" stroke="currentColor" strokeWidth="2.2" opacity="0.55" />
    <path d="M20 30h18M20 40h18M20 50h11" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity="0.5" />
    <rect x="58" y="24" width="30" height="34" rx="5" stroke="currentColor" strokeWidth="2.2" opacity="0.45" />
    <path d="M73 32v18M65 41h16" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity="0.65" />
    <path d="M96 26v28" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.3" />
    <path d="M18 76h84" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.25" />
  </svg>
);

export const StepChoose: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    {[20, 40, 60].map((y, i) => (
      <g key={y}>
        <rect
          x="18"
          y={y}
          width="16"
          height="16"
          rx="5"
          stroke="currentColor"
          strokeWidth="2.2"
          opacity={i === 2 ? 0.35 : 0.75}
        />
        {i !== 2 && (
          <path
            d={`m22 ${y + 8} 3.4 3.6 6.6-7.4`}
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        <rect x="44" y={y + 4} width={i === 1 ? 52 : 40} height="8" rx="4" fill="currentColor" opacity={0.22 + i * 0.05} />
      </g>
    ))}
  </svg>
);

export const StepCompute: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="34" y="20" width="52" height="50" rx="14" stroke="currentColor" strokeWidth="2.4" opacity="0.55" />
    <path d="M50 30v30M70 30v30M42 40h36M42 52h36" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.75" />
    <path d="M16 45h14M90 45h14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="4 5" opacity="0.45" />
  </svg>
);

export const StepCompare: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="14" y="24" width="42" height="16" rx="8" fill="currentColor" opacity="0.2" />
    <rect x="14" y="50" width="42" height="16" rx="8" fill="currentColor" opacity="0.2" />
    <path d="M62 32h14M62 58h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.4" />
    <circle cx="92" cy="45" r="14" stroke="currentColor" strokeWidth="2.6" opacity="0.7" />
    <path d="m86 45 4.4 4.6L99 40" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
