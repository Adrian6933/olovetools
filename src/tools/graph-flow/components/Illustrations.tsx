import React from 'react';

// ============================================================================
// Bespoke SVG artwork for GraphFlow, in the tool's amber palette.
// Nothing here is an emoji or a recycled icon-set glyph.
// ============================================================================

interface ArtProps {
  className?: string;
  /** Turns off the SMIL animations for users who asked for reduced motion. */
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Hero: a spreadsheet on the left becoming a chart on the right. The bars grow
// and the trend line sweeps in — the whole promise of the tool in one picture.
// ---------------------------------------------------------------------------
export const ChartHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 400 260" className={className} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="gfBar" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#b45309" />
        <stop offset="100%" stopColor="#fbbf24" />
      </linearGradient>
      <linearGradient id="gfArea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
      </linearGradient>
    </defs>

    {/* Source table */}
    <g transform="translate(14,44)">
      <rect x="0" y="0" width="128" height="164" rx="14" fill="#160d03" stroke="rgba(245,158,11,0.22)" strokeWidth="1.5" />
      <rect x="14" y="16" width="46" height="8" rx="4" fill="#f59e0b" opacity="0.75" />
      <rect x="70" y="16" width="44" height="8" rx="4" fill="#f59e0b" opacity="0.45" />
      <path d="M10 34h108" stroke="rgba(245,158,11,0.2)" strokeWidth="1.4" />
      {[0, 1, 2, 3, 4, 5].map(i => (
        <g key={i}>
          <rect x="14" y={46 + i * 20} width="38" height="7" rx="3.5" fill="#ffffff" opacity="0.16" />
          <rect x="70" y={46 + i * 20} width={30 - (i % 3) * 7} height="7" rx="3.5" fill="#fbbf24" opacity="0.4" />
        </g>
      ))}
    </g>

    {/* Transform arrow */}
    <g transform="translate(150,120)">
      <path d="M0 6h26M20 0l7 6-7 6" stroke="#f59e0b" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {animated && (
        <animateTransform attributeName="transform" type="translate"
          values="150 120;157 120;150 120" dur="2.4s" repeatCount="indefinite" />
      )}
    </g>

    {/* Chart card */}
    <g transform="translate(192,34)">
      <rect x="0" y="0" width="194" height="192" rx="16" fill="#0f172a" stroke="rgba(245,158,11,0.2)" strokeWidth="1.5" />

      {/* Grid */}
      {[0, 1, 2, 3].map(i => (
        <path key={i} d={`M18 ${44 + i * 30}H176`} stroke="#ffffff" strokeOpacity="0.07" strokeWidth="1" />
      ))}
      <path d="M18 164H176" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="1.2" />

      {/* Bars */}
      {[
        { x: 28, h: 52 }, { x: 56, h: 78 }, { x: 84, h: 40 },
        { x: 112, h: 96 }, { x: 140, h: 66 },
      ].map((b, i) => (
        <rect key={i} x={b.x} y={164 - b.h} width="18" height={b.h} rx="5" fill="url(#gfBar)">
          {animated && (
            <>
              <animate attributeName="height" values={`0;${b.h}`} dur="0.9s"
                begin={`${i * 0.09}s`} fill="freeze" calcMode="spline"
                keySplines="0.22 1 0.36 1" keyTimes="0;1" />
              <animate attributeName="y" values={`164;${164 - b.h}`} dur="0.9s"
                begin={`${i * 0.09}s`} fill="freeze" calcMode="spline"
                keySplines="0.22 1 0.36 1" keyTimes="0;1" />
            </>
          )}
        </rect>
      ))}

      {/* Trend line over the bars */}
      <path d="M37 100C55 96 62 74 71 72s20 26 33 22 24-52 39-58" fill="none"
        stroke="#fef3c7" strokeWidth="2.4" strokeLinecap="round" opacity="0.85">
        {animated && (
          <>
            <animate attributeName="stroke-dasharray" values="0 260;260 0" dur="1.4s" begin="0.35s" fill="freeze" />
          </>
        )}
      </path>
      {[[37, 100], [71, 72], [104, 94], [143, 36]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="3.6" fill="#fef3c7" stroke="#0f172a" strokeWidth="1.6" />
      ))}

      {/* Legend */}
      <rect x="18" y="176" width="9" height="9" rx="2.5" fill="#f59e0b" />
      <rect x="32" y="179" width="34" height="5" rx="2.5" fill="#ffffff" opacity="0.22" />
      <rect x="76" y="176" width="9" height="9" rx="2.5" fill="#fef3c7" opacity="0.8" />
      <rect x="90" y="179" width="28" height="5" rx="2.5" fill="#ffffff" opacity="0.18" />
    </g>
  </svg>
);

// ---------------------------------------------------------------------------
// Placeholder shown in the preview panel before a chart is generated.
// ---------------------------------------------------------------------------
export const EmptyChartArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 180 130" className={className} role="img" aria-hidden="true">
    <path d="M22 18v88h136" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"
      strokeLinejoin="round" fill="none" opacity="0.45" />
    {[
      { x: 38, h: 34 }, { x: 66, h: 56 }, { x: 94, h: 28 }, { x: 122, h: 68 },
    ].map((b, i) => (
      <rect key={i} x={b.x} y={106 - b.h} width="20" height={b.h} rx="5"
        fill="currentColor" opacity={0.18 + i * 0.07}>
        {animated && (
          <animate attributeName="opacity"
            values={`${0.14 + i * 0.06};${0.36 + i * 0.06};${0.14 + i * 0.06}`}
            dur="2.8s" begin={`${i * 0.22}s`} repeatCount="indefinite" />
        )}
      </rect>
    ))}
    <path d="M46 62l28-20 26 14 30-30" stroke="currentColor" strokeWidth="2.4"
      strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.4"
      strokeDasharray="5 6" />
  </svg>
);

// ---------------------------------------------------------------------------
// Feature icons
// ---------------------------------------------------------------------------
const iconBase = 'w-6 h-6';

/** Bezier handles on a curve: the vector export. */
export const IconVector: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 17c5.4 0 6.6-10 12-10" />
    <rect x="2" y="15" width="4" height="4" rx="1.2" />
    <rect x="18" y="5" width="4" height="4" rx="1.2" />
    <path d="M9.4 9.6 12 7l2.6 2.6" opacity="0.55" />
  </svg>
);

/** A grid with a pencil: the editable data table. */
export const IconTableEdit: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 5.6A1.6 1.6 0 0 1 4.6 4h14.8A1.6 1.6 0 0 1 21 5.6V11" />
    <path d="M3 5.6V18.4A1.6 1.6 0 0 0 4.6 20H12" />
    <path d="M3 9.4h18M9 4v16" />
    <path d="m21.2 13.4-6 6-2.8.7.7-2.8 6-6a1.5 1.5 0 0 1 2.1 2.1Z" />
  </svg>
);

/** Bars with a line over them: the combo chart. */
export const IconCombo: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 20h18" opacity="0.5" />
    <rect x="4.4" y="12" width="3.4" height="8" rx="1.1" />
    <rect x="10.3" y="9" width="3.4" height="11" rx="1.1" />
    <rect x="16.2" y="14" width="3.4" height="6" rx="1.1" />
    <path d="m5 8 5.4-3.2L14 7l5-3.4" opacity="0.85" />
  </svg>
);

/** An arrow curving back over a chart: cheap undo history. */
export const IconHistory: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3.6 9.4A9 9 0 1 1 3 13.6" />
    <path d="M3.2 4.6v5h5" />
    <path d="M12 8v4.4l3 1.8" />
  </svg>
);

/** A shield over a bar chart: the data never leaves. */
export const IconLocalChart: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2.4 4.6 5.4v5.5c0 4.5 3 8.6 7.4 10.1 4.4-1.5 7.4-5.6 7.4-10.1V5.4Z" />
    <path d="M8.6 14.6v-2.4M12 14.6V9.2M15.4 14.6v-3.8" />
  </svg>
);

/** Overlapping swatches: the palette picker. */
export const IconPalette: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3a9 9 0 0 0 0 18c1.2 0 2-.8 2-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H16a5 5 0 0 0 5-5c0-3.9-4-7-9-7Z" />
    <circle cx="7.6" cy="11.4" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="10.4" cy="7.4" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="15.2" cy="8.2" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

// ---------------------------------------------------------------------------
// "How it works" step artwork
// ---------------------------------------------------------------------------
export const StepData: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="14" y="14" width="52" height="62" rx="8" stroke="currentColor" strokeWidth="2.2" opacity="0.5" />
    <path d="M14 30h52M32 14v62" stroke="currentColor" strokeWidth="2" opacity="0.35" />
    <rect x="20" y="20" width="8" height="5" rx="2.5" fill="currentColor" opacity="0.7" />
    <rect x="38" y="20" width="20" height="5" rx="2.5" fill="currentColor" opacity="0.45" />
    {[0, 1, 2, 3].map(i => (
      <g key={i}>
        <rect x="19" y={38 + i * 10} width="9" height="4" rx="2" fill="currentColor" opacity="0.25" />
        <rect x="38" y={38 + i * 10} width={22 - i * 4} height="4" rx="2" fill="currentColor" opacity="0.45" />
      </g>
    ))}
    <path d="M76 45h22M92 39l7 6-7 6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.75" />
  </svg>
);

export const StepShape: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="12" y="16" width="30" height="26" rx="6" stroke="currentColor" strokeWidth="2.2" opacity="0.45" />
    <path d="M19 36v-8M26 36v-13M33 36v-5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity="0.8" />
    <rect x="50" y="16" width="30" height="26" rx="6" stroke="currentColor" strokeWidth="2.6" opacity="0.9" />
    <path d="m56 35 7-9 6 5 6-10" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="88" y="16" width="20" height="26" rx="6" stroke="currentColor" strokeWidth="2.2" opacity="0.45" />
    <circle cx="98" cy="29" r="7" stroke="currentColor" strokeWidth="2.2" opacity="0.7" />
    <path d="M98 22v7h7" stroke="currentColor" strokeWidth="2.2" opacity="0.7" />
    <rect x="26" y="56" width="68" height="14" rx="7" stroke="currentColor" strokeWidth="2.2" opacity="0.4" />
    <circle cx="44" cy="63" r="4.5" fill="currentColor" opacity="0.65" />
    <path d="M56 63h30" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.3" />
  </svg>
);

export const StepExport: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="26" y="10" width="68" height="46" rx="8" stroke="currentColor" strokeWidth="2.2" opacity="0.5" />
    <path d="M36 46v-14M48 46v-22M60 46v-9M72 46v-19M84 46v-25" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity="0.6" />
    <path d="M60 60v18M52 71l8 8 8-8" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M28 82h64" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.35" />
  </svg>
);
