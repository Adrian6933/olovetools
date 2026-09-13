import React from 'react';

// ============================================================================
// Bespoke SVG artwork for CronFlow, in the tool's violet palette.
//
// Every animation is SMIL and every one of them is gated on `animated`, so a
// visitor with prefers-reduced-motion gets a finished, still picture instead of
// a half-drawn one.
//
// All trigonometry is rounded to two decimals before it reaches an attribute.
// The island is server-rendered, and an unrounded sin/cos can differ in its
// last binary digit between Node and the browser — enough for React to throw
// the whole tree away and rehydrate from scratch.
// ============================================================================

interface ArtProps {
  className?: string;
  animated?: boolean;
}

const r2 = (n: number): string => n.toFixed(2);

/** Point on a circle centred at (cx, cy), 0° at 12 o'clock. */
function polar(cx: number, cy: number, radius: number, degrees: number): [string, string] {
  const rad = ((degrees - 90) * Math.PI) / 180;
  return [r2(cx + radius * Math.cos(rad)), r2(cy + radius * Math.sin(rad))];
}

// ---------------------------------------------------------------------------
// Hero: the five cron fields as five concentric rings of ticks, with the lit
// ticks forming the schedule and a beam sweeping past them. The timeline strip
// underneath is what those rings actually produce — the tool's whole job, from
// expression to firing times, in one frame.
// ---------------------------------------------------------------------------
export const CronHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => {
  const cx = 150;
  const cy = 132;
  // radius, tick count, how many ticks are lit (the "schedule")
  const rings: { r: number; count: number; every: number }[] = [
    { r: 104, count: 60, every: 5 },
    { r: 88, count: 24, every: 2 },
    { r: 72, count: 31, every: 1 },
    { r: 56, count: 12, every: 3 },
    { r: 40, count: 7, every: 2 },
  ];

  return (
    <svg viewBox="19 1 392 268" className={`tool-hero-art ${className}`} role="img" aria-hidden="true">
      <defs>
        <radialGradient id="cronGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cronBeam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#e9d5ff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="cronPulse" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#e9d5ff" />
        </linearGradient>
      </defs>

      <circle cx={cx} cy={cy} r="118" fill="url(#cronGlow)" />

      {rings.map((ring, ringIndex) => (
        <g key={ringIndex}>
          <circle cx={cx} cy={cy} r={ring.r} fill="none" stroke="#3b1d63" strokeWidth="1" opacity="0.7" />
          {Array.from({ length: ring.count }).map((_, i) => {
            const angle = (360 / ring.count) * i;
            const lit = i % ring.every === 0;
            const [x1, y1] = polar(cx, cy, ring.r - (lit ? 5 : 2.5), angle);
            const [x2, y2] = polar(cx, cy, ring.r + (lit ? 5 : 2.5), angle);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={lit ? '#c4b5fd' : '#6d28d9'}
                strokeWidth={lit ? 2.4 : 1}
                strokeLinecap="round"
                opacity={lit ? 0.95 : 0.35}
              >
                {animated && lit && (
                  <animate
                    attributeName="opacity"
                    values="0.95;0.35;0.95"
                    dur="3.2s"
                    begin={`${((ringIndex * 7 + i) % 12) * 0.26}s`}
                    repeatCount="indefinite"
                  />
                )}
              </line>
            );
          })}
        </g>
      ))}

      {/* Sweeping beam */}
      <g transform={`translate(${cx},${cy})`}>
        <g>
          <path d="M0 0 L0 -110 A110 110 0 0 1 30 -106 Z" fill="url(#cronBeam)" opacity="0.5" />
          {animated && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0"
              to="360"
              dur="9s"
              repeatCount="indefinite"
            />
          )}
        </g>
      </g>

      <circle cx={cx} cy={cy} r="22" fill="#150a22" stroke="#7c3aed" strokeWidth="1.5" />
      <text
        x={cx}
        y={cy + 5}
        textAnchor="middle"
        fontFamily="ui-monospace, monospace"
        fontSize="15"
        fill="#c4b5fd"
        letterSpacing="1"
      >
        {'* *'}
      </text>

      {/* The firing times the rings produce */}
      <g transform="translate(292,44)">
        <line x1="0" y1="0" x2="0" y2="212" stroke="#3b1d63" strokeWidth="1.5" />
        {[0, 1, 2, 3, 4, 5].map(i => {
          const y = 14 + i * 36;
          return (
            <g key={i}>
              <line x1="0" y1={y} x2="14" y2={y} stroke="#6d28d9" strokeWidth="1.5" />
              <rect x="18" y={y - 8} width="88" height="16" rx="5" fill="#150a22" stroke="#3b1d63" />
              <rect x="18" y={y - 8} width={26 + ((i * 17) % 40)} height="16" rx="5" fill="url(#cronPulse)" opacity="0.55">
                {animated && (
                  <animate
                    attributeName="opacity"
                    values="0.2;0.75;0.2"
                    dur="3.6s"
                    begin={`${i * 0.6}s`}
                    repeatCount="indefinite"
                  />
                )}
              </rect>
              <circle cx="0" cy={y} r="3.5" fill="#c4b5fd">
                {animated && (
                  <animate attributeName="r" values="3.5;6;3.5" dur="3.6s" begin={`${i * 0.6}s`} repeatCount="indefinite" />
                )}
              </circle>
            </g>
          );
        })}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Feature icons
// ---------------------------------------------------------------------------

/** Globe with a meridian and a clock face: schedules read in any timezone. */
export const IconTimezone: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="22" cy="22" r="15" strokeLinecap="round" />
    <path d="M7 22h30M22 7c4 4.5 6 9.5 6 15s-2 10.5-6 15c-4-4.5-6-9.5-6-15s2-10.5 6-15Z" strokeLinecap="round" />
    <circle cx="35" cy="35" r="9" fill="currentColor" fillOpacity="0.12" />
    <path d="M35 30v5l3.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Five stacked field bars with selected cells: the visual builder. */
export const IconBuilder: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    {[0, 1, 2, 3].map(row => (
      <g key={row}>
        {[0, 1, 2, 3, 4, 5].map(col => (
          <rect
            key={col}
            x={5 + col * 6.6}
            y={7 + row * 9}
            width="5"
            height="6"
            rx="1.4"
            fill={(row + col) % 3 === 0 ? 'currentColor' : 'none'}
            fillOpacity="0.85"
            strokeWidth="1.2"
          />
        ))}
      </g>
    ))}
  </svg>
);

/** A calendar with a firing marker: the month heatmap. */
export const IconCalendar: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="6" y="10" width="36" height="32" rx="5" />
    <path d="M6 19h36M15 6v8M33 6v8" strokeLinecap="round" />
    <rect x="12" y="24" width="6" height="5" rx="1.5" fill="currentColor" fillOpacity="0.9" stroke="none" />
    <rect x="30" y="24" width="6" height="5" rx="1.5" fill="currentColor" fillOpacity="0.45" stroke="none" />
    <rect x="21" y="33" width="6" height="5" rx="1.5" fill="currentColor" fillOpacity="0.7" stroke="none" />
  </svg>
);

/** Branching arrows into three targets: export to several platforms. */
export const IconExport: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="4" y="19" width="12" height="10" rx="3" fill="currentColor" fillOpacity="0.15" />
    <path d="M16 24h9m0-12v24m0-24h7m-7 12h7m-7 12h7" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="32" y="7" width="12" height="10" rx="3" />
    <rect x="32" y="19" width="12" height="10" rx="3" />
    <rect x="32" y="31" width="12" height="10" rx="3" />
  </svg>
);

/** A shield around a terminal prompt: nothing leaves the browser. */
export const IconLocal: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M24 5l15 6v12c0 10-6.5 16.5-15 20-8.5-3.5-15-10-15-20V11l15-6Z" strokeLinejoin="round" />
    <path d="M18 21l5 5-5 5M27 31h6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** A checklist against platform badges: the compatibility matrix. */
export const IconPlatforms: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="6" y="7" width="36" height="34" rx="5" />
    <path d="M13 16l3 3 5-6M13 26l3 3 5-6M13 36l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M27 17h10M27 27h10M27 37h6" strokeLinecap="round" opacity="0.55" />
  </svg>
);

// ---------------------------------------------------------------------------
// How it works
// ---------------------------------------------------------------------------

const stepFrame = (children: React.ReactNode) => (
  <>
    <rect x="1" y="1" width="118" height="70" rx="12" fill="#150a22" stroke="#3b1d63" />
    {children}
  </>
);

/** 1 — write it, or click it together. */
export const StepWrite: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 120 72" className={className} fill="none" aria-hidden="true">
    {stepFrame(
      <>
        <rect x="12" y="18" width="96" height="20" rx="6" fill="#1e0f33" stroke="#6d28d9" />
        {['*/5', '*', '*', '*', '1-5'].map((token, i) => (
          <text
            key={i}
            x={20 + i * 19}
            y="32"
            fontFamily="ui-monospace, monospace"
            fontSize="9"
            fill={i === 0 || i === 4 ? '#c4b5fd' : '#7c5cc4'}
          >
            {token}
          </text>
        ))}
        {[0, 1, 2, 3, 4].map(i => (
          <rect key={i} x={16 + i * 19} y="46" width="14" height="9" rx="2.5" fill="#6d28d9" opacity={i % 2 ? 0.3 : 0.75} />
        ))}
      </>
    )}
  </svg>
);

/** 2 — pick the timezone the server actually runs in. */
export const StepZone: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 120 72" className={className} fill="none" aria-hidden="true">
    {stepFrame(
      <>
        <circle cx="38" cy="36" r="19" fill="none" stroke="#6d28d9" strokeWidth="1.6" />
        <path
          d="M19 36h38M38 17c5 5.5 7.5 12 7.5 19S43 49.5 38 55c-5-5.5-7.5-12-7.5-19S33 22.5 38 17Z"
          stroke="#7c5cc4"
          strokeWidth="1.3"
        />
        <circle cx="38" cy="27" r="3" fill="#c4b5fd" />
        <rect x="66" y="26" width="42" height="20" rx="6" fill="#1e0f33" stroke="#6d28d9" />
        <text x="87" y="39" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="8" fill="#c4b5fd">
          UTC+2
        </text>
      </>
    )}
  </svg>
);

/** 3 — read it back in your own language and see the next runs. */
export const StepPreview: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 120 72" className={className} fill="none" aria-hidden="true">
    {stepFrame(
      <>
        <rect x="12" y="14" width="96" height="13" rx="4" fill="#6d28d9" opacity="0.28" />
        <rect x="16" y="18" width="52" height="5" rx="2.5" fill="#c4b5fd" opacity="0.8" />
        {[0, 1, 2].map(i => (
          <g key={i}>
            <circle cx="19" cy={38 + i * 11} r="3" fill="#a78bfa" opacity={0.85 - i * 0.2} />
            <rect x="27" y={35 + i * 11} width={70 - i * 12} height="6" rx="3" fill="#3b1d63" />
          </g>
        ))}
      </>
    )}
  </svg>
);

/** 4 — take the crontab line, the workflow or the manifest. */
export const StepExport: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 120 72" className={className} fill="none" aria-hidden="true">
    {stepFrame(
      <>
        <rect x="10" y="26" width="30" height="20" rx="6" fill="#1e0f33" stroke="#6d28d9" />
        <text x="25" y="39" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="8" fill="#c4b5fd">
          cron
        </text>
        <path d="M42 36h12" stroke="#7c5cc4" strokeWidth="1.6" strokeLinecap="round" />
        {[0, 1, 2].map(i => (
          <g key={i}>
            <path d={`M54 36 L62 ${20 + i * 16}`} stroke="#6d28d9" strokeWidth="1.3" strokeLinecap="round" />
            <rect x="64" y={13 + i * 16} width="44" height="13" rx="4" fill="#1e0f33" stroke="#3b1d63" />
            <rect x="69" y={18 + i * 16} width={30 - i * 7} height="4" rx="2" fill="#a78bfa" opacity="0.6" />
          </g>
        ))}
      </>
    )}
  </svg>
);
