import React from 'react';

// ============================================================================
// Bespoke SVG artwork for SubtitlesBolt, in the tool's blue palette.
//
// Every animation is SMIL and gated on `animated`, so prefers-reduced-motion
// gets a finished still frame rather than a half-drawn one.
//
// Any trigonometry is rounded to two decimals before it reaches an attribute:
// the island is server-rendered, and an unrounded sin/cos can differ in its
// last binary digit between Node and the browser, which throws the whole tree
// away on hydration.
// ============================================================================

interface ArtProps {
  className?: string;
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Hero: a timeline of cues above the frame they belong to. The bars are the
// track, the caption box is what the viewer sees, and the meter on the right
// is reading speed — the three things the tool actually works on.
// ---------------------------------------------------------------------------
export const SubtitleHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => {
  // width, gap — an irregular rhythm reads as real dialogue, an even one reads
  // as a placeholder.
  const bars = [34, 18, 52, 26, 40, 22, 60, 30, 44, 20];
  let cursor = 0;
  const laid = bars.map((width, i) => {
    const x = cursor;
    cursor += width + (i % 3 === 2 ? 14 : 7);
    return { x, width, i };
  });
  const span = cursor;

  return (
    <svg viewBox="0 0 420 300" className={`tool-hero-art ${className}`} role="img" aria-hidden="true">
      <defs>
        <linearGradient id="subBar" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="subFrame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a1a3a" />
          <stop offset="100%" stopColor="#020610" />
        </linearGradient>
        <radialGradient id="subGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </radialGradient>
        <clipPath id="subTrackClip">
          <rect x="20" y="26" width="380" height="46" rx="10" />
        </clipPath>
      </defs>

      <ellipse cx="210" cy="170" rx="190" ry="120" fill="url(#subGlow)" />

      {/* Track */}
      <rect x="20" y="26" width="380" height="46" rx="10" fill="#08122a" stroke="#1e3a8a" strokeOpacity="0.5" />
      <g clipPath="url(#subTrackClip)">
        <g transform={`translate(${(380 - span) / 2 + 20}, 0)`}>
          {laid.map(({ x, width, i }) => (
            <rect key={i} x={x} y={i % 2 === 0 ? 34 : 50} width={width} height="14" rx="4" fill="url(#subBar)" opacity={0.55 + (i % 4) * 0.12}>
              {animated && (
                <animate
                  attributeName="opacity"
                  values="0.35;0.95;0.35"
                  dur="4s"
                  begin={`${i * 0.34}s`}
                  repeatCount="indefinite"
                />
              )}
            </rect>
          ))}
        </g>
        {/* Playhead */}
        {animated && (
          <rect x="0" y="26" width="2" height="46" fill="#bfdbfe">
            <animate attributeName="x" values="24;396;24" dur="8s" repeatCount="indefinite" />
          </rect>
        )}
      </g>

      {/* Frame with the caption */}
      <rect x="52" y="94" width="240" height="150" rx="14" fill="url(#subFrame)" stroke="#1e3a8a" strokeOpacity="0.6" />
      <g opacity="0.35">
        {[0, 1, 2, 3, 4].map(i => (
          <rect key={i} x="60" y={104 + i * 6} width="4" height="4" rx="1" fill="#3b82f6" />
        ))}
        {[0, 1, 2, 3, 4].map(i => (
          <rect key={`r${i}`} x="280" y={104 + i * 6} width="4" height="4" rx="1" fill="#3b82f6" />
        ))}
      </g>
      <rect x="74" y="196" width="196" height="34" rx="8" fill="#020610" fillOpacity="0.85" stroke="#1e3a8a" strokeOpacity="0.5" />
      <rect x="86" y="205" width="120" height="6" rx="3" fill="#bfdbfe" opacity="0.9">
        {animated && <animate attributeName="width" values="30;120;120;30" dur="4s" repeatCount="indefinite" />}
      </rect>
      <rect x="86" y="216" width="88" height="6" rx="3" fill="#60a5fa" opacity="0.6">
        {animated && <animate attributeName="width" values="0;88;88;0" dur="4s" begin="0.35s" repeatCount="indefinite" />}
      </rect>

      {/* Reading-speed meter */}
      <g transform="translate(316,94)">
        <rect x="0" y="0" width="70" height="150" rx="12" fill="#08122a" stroke="#1e3a8a" strokeOpacity="0.5" />
        <text x="35" y="22" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="9" fill="#60a5fa">
          CPS
        </text>
        {[0, 1, 2, 3, 4, 5, 6].map(i => {
          const y = 128 - i * 15;
          const lit = i < 4;
          return (
            <rect key={i} x="16" y={y} width="38" height="9" rx="2.5" fill={lit ? '#3b82f6' : '#12244a'}>
              {animated && lit && (
                <animate
                  attributeName="fill"
                  values="#1d4ed8;#93c5fd;#1d4ed8"
                  dur="2.4s"
                  begin={`${i * 0.18}s`}
                  repeatCount="indefinite"
                />
              )}
            </rect>
          );
        })}
      </g>

      {/* Format chips */}
      <g transform="translate(52,262)" fontFamily="ui-monospace, monospace" fontSize="9" fill="#93c5fd">
        {['SRT', 'VTT', 'ASS', 'TTML'].map((label, i) => (
          <g key={label} transform={`translate(${i * 62}, 0)`}>
            <rect x="0" y="0" width="54" height="20" rx="6" fill="#0a1a3a" stroke="#1e3a8a" strokeOpacity="0.7" />
            <text x="27" y="14" textAnchor="middle">
              {label}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Feature icons
// ---------------------------------------------------------------------------

/** Two stacked document corners with an arrow between: format conversion. */
export const IconFormats: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M8 6h13l7 7v10" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 6v26h10" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 6v7h7" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="22" y="24" width="20" height="18" rx="3" />
    <path d="M14 38h6m0 0-3-3m3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M27 31h10M27 36h6" strokeLinecap="round" opacity="0.6" />
  </svg>
);

/** A clock with a shift arrow: timing and frame rate. */
export const IconTiming: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="20" cy="22" r="14" />
    <path d="M20 14v8l5 4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M30 40h12m0 0-4-4m4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M36 14a10 10 0 0 1 0 16" strokeLinecap="round" opacity="0.55" />
  </svg>
);

/** A gauge: reading speed and the quality checks. */
export const IconQuality: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M6 34a18 18 0 0 1 36 0" strokeLinecap="round" />
    <path d="M24 34 34 20" strokeLinecap="round" />
    <circle cx="24" cy="34" r="3" fill="currentColor" stroke="none" />
    <path d="M9 27l3 1M39 27l-3 1M24 16v3" strokeLinecap="round" opacity="0.6" />
  </svg>
);

/** A pencil over a cue row: the editable list. */
export const IconEditor: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="5" y="10" width="26" height="9" rx="2.5" />
    <rect x="5" y="23" width="26" height="9" rx="2.5" opacity="0.55" />
    <rect x="5" y="36" width="16" height="7" rx="2.5" opacity="0.35" />
    <path d="M42 12 36 6 26 16v6h6l10-10Z" strokeLinejoin="round" />
  </svg>
);

/** Overlapping bars pulled apart: the automatic repairs. */
export const IconRepair: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="4" y="12" width="22" height="9" rx="3" fill="currentColor" fillOpacity="0.18" />
    <rect x="19" y="27" width="22" height="9" rx="3" fill="currentColor" fillOpacity="0.18" />
    <path d="M30 16h12m0 0-4-4m4 4-4 4" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    <path d="M15 32H3m0 0 4-4m-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
  </svg>
);

/** A shield around a caption box: nothing leaves the browser. */
export const IconLocal: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M24 5l15 6v12c0 10-6.5 16.5-15 20-8.5-3.5-15-10-15-20V11l15-6Z" strokeLinejoin="round" />
    <rect x="13" y="19" width="22" height="11" rx="3" />
    <path d="M18 25h12" strokeLinecap="round" opacity="0.7" />
  </svg>
);

// ---------------------------------------------------------------------------
// How it works
// ---------------------------------------------------------------------------

const frame = (children: React.ReactNode) => (
  <>
    <rect x="1" y="1" width="118" height="70" rx="12" fill="#08122a" stroke="#1e3a8a" strokeOpacity="0.5" />
    {children}
  </>
);

/** 1 — drop the file in. Nothing runs yet. */
export const StepLoad: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 120 72" className={className} fill="none" aria-hidden="true">
    {frame(
      <>
        <rect x="30" y="14" width="60" height="44" rx="8" fill="#0a1a3a" stroke="#2563eb" strokeDasharray="5 4" />
        <path d="M60 44V24m0 0-8 8m8-8 8 8" stroke="#60a5fa" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="44" y="48" width="32" height="4" rx="2" fill="#1e3a8a" />
      </>
    )}
  </svg>
);

/** 2 — the checks light up what is wrong. */
export const StepCheck: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 120 72" className={className} fill="none" aria-hidden="true">
    {frame(
      <>
        {[
          { y: 14, w: 84, c: '#1d4ed8' },
          { y: 28, w: 64, c: '#f59e0b' },
          { y: 42, w: 92, c: '#1d4ed8' },
          { y: 56, w: 48, c: '#ef4444' },
        ].map((row, i) => (
          <g key={i}>
            <rect x="14" y={row.y - 4} width={row.w} height="9" rx="3" fill={row.c} opacity={0.75} />
            <circle cx="104" cy={row.y} r="3.5" fill={row.c} />
          </g>
        ))}
      </>
    )}
  </svg>
);

/** 3 — shift, stretch, resync. */
export const StepSync: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 120 72" className={className} fill="none" aria-hidden="true">
    {frame(
      <>
        <rect x="12" y="20" width="40" height="9" rx="3" fill="#1e3a8a" />
        <rect x="12" y="43" width="40" height="9" rx="3" fill="#1e3a8a" opacity="0.5" />
        <rect x="62" y="20" width="46" height="9" rx="3" fill="#3b82f6" />
        <rect x="70" y="43" width="38" height="9" rx="3" fill="#3b82f6" opacity="0.8" />
        <path d="M54 24.5h5m-5 23h13" stroke="#93c5fd" strokeWidth="1.8" strokeLinecap="round" />
        <text x="60" y="14" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="8" fill="#60a5fa">
          25 → 23.976
        </text>
      </>
    )}
  </svg>
);

/** 4 — take it out in whichever format you need. */
export const StepExport: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 120 72" className={className} fill="none" aria-hidden="true">
    {frame(
      <>
        <rect x="10" y="26" width="30" height="20" rx="6" fill="#0a1a3a" stroke="#2563eb" />
        <text x="25" y="39" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="8" fill="#93c5fd">
          cues
        </text>
        <path d="M42 36h12" stroke="#1e3a8a" strokeWidth="1.6" strokeLinecap="round" />
        {['SRT', 'VTT', 'ASS'].map((label, i) => (
          <g key={label}>
            <path d={`M54 36 L62 ${20 + i * 16}`} stroke="#1e3a8a" strokeWidth="1.3" strokeLinecap="round" />
            <rect x="64" y={13 + i * 16} width="44" height="13" rx="4" fill="#0a1a3a" stroke="#1e3a8a" strokeOpacity="0.7" />
            <text x="86" y={22 + i * 16} textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="7.5" fill="#93c5fd">
              {label}
            </text>
          </g>
        ))}
      </>
    )}
  </svg>
);
