import React from 'react';

// ============================================================================
// Bespoke SVG artwork for GIFBolt, in the tool's fuchsia palette.
// Inline and self-contained: no raster assets, no network requests.
// ============================================================================

interface ArtProps {
  className?: string;
  /** Disables the SMIL animations for users who asked for reduced motion. */
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Hero: a filmstrip feeding a looping playback window.
// ---------------------------------------------------------------------------

/** The strip advances one cell per beat; every moving part shares this clock. */
const BEAT = { dur: '4s', repeatCount: 'indefinite' } as const;

const CELL_WIDTH = 74;
const CELLS = 5;

/** Where the bouncing subject sits in each cell, so the strip reads as motion. */
const ARC = [0.72, 0.4, 0.22, 0.4, 0.72];

export const GifHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => {
  const stripTop = 196;
  const stripHeight = 74;
  const cellTop = stripTop + 12;
  const cellHeight = stripHeight - 24;

  // The playback window replays the same arc, one cell at a time.
  const windowCy = ARC.map(fraction => 60 + fraction * 92);
  const times = ARC.map((_, i) => (i / CELLS).toFixed(3)).concat('1');

  return (
    <svg viewBox="0 0 400 300" className={className} role="img" aria-hidden="true">
      <defs>
        <linearGradient id="gbScreen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b0764" />
          <stop offset="100%" stopColor="#150322" />
        </linearGradient>
        <linearGradient id="gbSubject" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f0abfc" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>
        <linearGradient id="gbStrip" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2a0a35" />
          <stop offset="50%" stopColor="#3f1049" />
          <stop offset="100%" stopColor="#2a0a35" />
        </linearGradient>
        <clipPath id="gbWindow">
          <rect x="112" y="26" width="176" height="140" rx="14" />
        </clipPath>
        <clipPath id="gbStripClip">
          <rect x="14" y={stripTop} width="372" height={stripHeight} rx="10" />
        </clipPath>
      </defs>

      {/* Playback window */}
      <g clipPath="url(#gbWindow)">
        <rect x="112" y="26" width="176" height="140" fill="url(#gbScreen)" />
        <path d="M112 140h176v26H112z" fill="#a855f7" opacity="0.12" />
        <circle cx="200" cy={windowCy[0]} r="21" fill="url(#gbSubject)">
          {animated && (
            <animate attributeName="cy" values={[...windowCy, windowCy[0]].join(';')} keyTimes={times.join(';')} calcMode="discrete" {...BEAT} />
          )}
        </circle>
        <ellipse cx="200" cy="150" rx="26" ry="6" fill="#000" opacity="0.35" />
      </g>
      <rect x="112" y="26" width="176" height="140" rx="14" fill="none" stroke="#d946ef" strokeWidth="2" opacity="0.55" />

      {/* Loop badge, the one thing that makes a GIF a GIF */}
      <g transform="translate(200 182)">
        <path
          d="M-26 0a26 26 0 1 1 8 19"
          fill="none"
          stroke="#f0abfc"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.8"
        />
        <path d="M-24 -10l-4 12 12 2z" fill="#f0abfc" opacity="0.8" />
      </g>

      {/* Filmstrip */}
      <g clipPath="url(#gbStripClip)">
        <rect x="14" y={stripTop} width="372" height={stripHeight} fill="url(#gbStrip)" />
        {Array.from({ length: 12 }, (_, i) => (
          <React.Fragment key={i}>
            <rect x={20 + i * 32} y={stripTop + 4} width="12" height="6" rx="2" fill="#0b0410" />
            <rect x={20 + i * 32} y={stripTop + stripHeight - 10} width="12" height="6" rx="2" fill="#0b0410" />
          </React.Fragment>
        ))}
        {ARC.map((fraction, i) => {
          const x = 20 + i * CELL_WIDTH;
          return (
            <g key={i}>
              <rect x={x} y={cellTop} width={CELL_WIDTH - 8} height={cellHeight} rx="4" fill="#180525" />
              <circle cx={x + (CELL_WIDTH - 8) / 2} cy={cellTop + cellHeight * fraction} r="8" fill="url(#gbSubject)" />
            </g>
          );
        })}

        {/* The read head sweeping the strip, in step with the window */}
        <rect x="20" y={cellTop - 4} width={CELL_WIDTH - 8} height={cellHeight + 8} rx="6" fill="none" stroke="#f0abfc" strokeWidth="2.5">
          {animated && (
            <animate
              attributeName="x"
              values={ARC.map((_, i) => 20 + i * CELL_WIDTH).concat(20).join(';')}
              keyTimes={times.join(';')}
              calcMode="discrete"
              {...BEAT}
            />
          )}
        </rect>
      </g>
      <rect x="14" y={stripTop} width="372" height={stripHeight} rx="10" fill="none" stroke="rgba(217,70,239,0.25)" strokeWidth="1.5" />
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Empty-state art for the drop zones.
// ---------------------------------------------------------------------------

export const DropVideoArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 140 120" className={className} role="img" aria-hidden="true">
    <rect x="12" y="20" width="88" height="62" rx="9" fill="none" stroke="currentColor" strokeWidth="2.4" opacity="0.5" />
    <path d="M104 36l22-12v54l-22-12z" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" opacity="0.5" />
    <path d="M48 38l24 13-24 13z" fill="currentColor" opacity="0.65" />
    <path d="M70 90v16M62 99l8 8 8-8" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      {animated && <animate attributeName="opacity" values="0.35;1;0.35" dur="2.4s" repeatCount="indefinite" />}
    </path>
  </svg>
);

export const DropImagesArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 140 120" className={className} role="img" aria-hidden="true">
    <rect x="30" y="12" width="80" height="56" rx="8" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.28" />
    <rect x="22" y="20" width="80" height="56" rx="8" fill="none" stroke="currentColor" strokeWidth="2.2" opacity="0.45" />
    <rect x="14" y="28" width="80" height="56" rx="8" fill="none" stroke="currentColor" strokeWidth="2.6" opacity="0.7" />
    <path d="M20 74l18-18 12 11 14-13 24 26" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
    <circle cx="72" cy="46" r="6" fill="currentColor" opacity="0.5" />
    <path d="M112 84v16M104 93l8 8 8-8" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      {animated && <animate attributeName="opacity" values="0.35;1;0.35" dur="2.4s" repeatCount="indefinite" />}
    </path>
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

/** Swatches fanned out of a single well: the global palette. */
export const IconPalette: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke} aria-hidden="true">
    <path d="M12 3a9 9 0 1 0 0 18c1 0 1.7-.8 1.7-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.1 0-1 .8-1.7 1.7-1.7H16a5 5 0 0 0 5-5c0-4-4-7.3-9-7.3Z" />
    <circle cx="7.7" cy="12" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="9.6" cy="7.9" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="14.4" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="17.6" cy="10.6" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

/** Two stacked frames with only the delta shaded: inter-frame differencing. */
export const IconDelta: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke} aria-hidden="true">
    <rect x="2.6" y="4.4" width="12" height="10" rx="1.6" opacity="0.45" />
    <rect x="9.4" y="9.6" width="12" height="10" rx="1.6" />
    <path d="M12.4 12.4h6M12.4 15.2h4.2" opacity="0.7" />
  </svg>
);

/** A dot grid fading into a gradient: dithering. */
export const IconDither: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <rect x="2.8" y="3.4" width="18.4" height="17.2" rx="2.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
    {[0, 1, 2, 3, 4].map(row =>
      [0, 1, 2, 3, 4].map(col => (
        <circle
          key={`${row}-${col}`}
          cx={5.6 + col * 3.2}
          cy={6.2 + row * 3.2}
          r={1.05}
          fill="currentColor"
          opacity={Math.max(0.08, 1 - (row * 5 + col) / 26)}
        />
      ))
    )}
  </svg>
);

/** A filmstrip with a playhead: the editable timeline. */
export const IconTimeline: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke} aria-hidden="true">
    <rect x="2.4" y="6.6" width="19.2" height="10.8" rx="1.8" />
    <path d="M8 6.6v10.8M16 6.6v10.8" opacity="0.5" />
    <path d="M12 3.4v17.2" strokeWidth="2" />
    <path d="M12 3.4l-2 2.2h4z" fill="currentColor" stroke="none" />
  </svg>
);

/** A shield around a frame: nothing leaves the tab. */
export const IconLocal: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke} aria-hidden="true">
    <path d="M12 2.4 4.6 5.4v5.5c0 4.5 3 8.6 7.4 10.1 4.4-1.5 7.4-5.6 7.4-10.1V5.4Z" />
    <path d="M9.4 11.4l2.4 2.4 3.6-4" />
  </svg>
);

/** Parallel lanes filling at once: the worker pool. */
export const IconThreads: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke} aria-hidden="true">
    <rect x="2.6" y="4.2" width="18.8" height="3.6" rx="1.8" opacity="0.45" />
    <rect x="2.6" y="10.2" width="18.8" height="3.6" rx="1.8" opacity="0.45" />
    <rect x="2.6" y="16.2" width="18.8" height="3.6" rx="1.8" opacity="0.45" />
    <path d="M4.4 6h9M4.4 12h5.6M4.4 18h12.6" strokeWidth="3" />
  </svg>
);

/** Two panes and an arrow: hand the GIF to the next tool. */
export const IconHandoff: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke} aria-hidden="true">
    <rect x="2.5" y="6" width="7.5" height="12" rx="1.8" />
    <rect x="14" y="6" width="7.5" height="12" rx="1.8" />
    <path d="M10.8 12h2.4M12.2 10.4 13.8 12l-1.6 1.6" />
  </svg>
);

// ---------------------------------------------------------------------------
// "How it works" step artwork
// ---------------------------------------------------------------------------

export const StepDrop: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="8" y="12" width="104" height="66" rx="12" stroke="currentColor" strokeWidth="2" strokeDasharray="7 6" opacity="0.55" />
    <path d="M60 58V32" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
    <path d="m50 42 10-10 10 10" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M40 62h40" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" opacity="0.4" />
  </svg>
);

export const StepTrim: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="10" y="30" width="100" height="30" rx="5" fill="currentColor" opacity="0.12" />
    <rect x="34" y="26" width="52" height="38" rx="5" stroke="currentColor" strokeWidth="2.6" />
    <path d="M34 20v50M86 20v50" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
    <path d="M18 45h12M90 45h12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.45" />
  </svg>
);

export const StepTune: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <path d="M22 28h76M22 45h76M22 62h76" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.35" />
    <circle cx="44" cy="28" r="8" fill="currentColor" />
    <circle cx="74" cy="45" r="8" fill="currentColor" opacity="0.8" />
    <circle cx="38" cy="62" r="8" fill="currentColor" opacity="0.6" />
  </svg>
);

export const StepExport: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="20" y="12" width="80" height="52" rx="9" stroke="currentColor" strokeWidth="2" opacity="0.5" />
    <path d="M60 20v26" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
    <path d="m50 36 10 10 10-10" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M32 76h56" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
    <path d="M92 68h12M98 62v12" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity="0.6" />
  </svg>
);
