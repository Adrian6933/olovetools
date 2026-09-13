import React from 'react';

// ============================================================================
// Bespoke SVG artwork for MarkdownLive, in the tool's violet palette.
// ----------------------------------------------------------------------------
// What stood here before was a 24 px lucide "Sparkles" doing the job of a hero
// illustration. Every animation below is SMIL and is switched off wholesale
// when the visitor asked for reduced motion.
// ============================================================================

interface ArtProps {
  className?: string;
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Hero: the two panes of the tool, with the source on the left compiling into
// the rendered document on the right as a beam sweeps across.
// ---------------------------------------------------------------------------
export const MarkdownHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 420 290" className={`tool-hero-art ${className}`} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="mlPane" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1b1035" />
        <stop offset="100%" stopColor="#0a0616" />
      </linearGradient>
      <linearGradient id="mlBeam" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#a78bfa" stopOpacity="0" />
        <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.75" />
        <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
      </linearGradient>
      <clipPath id="mlLeftClip">
        <rect x="14" y="30" width="180" height="232" rx="14" />
      </clipPath>
      <clipPath id="mlRightClip">
        <rect x="226" y="30" width="180" height="232" rx="14" />
      </clipPath>
    </defs>

    {/* ---- left pane: the markdown source ---- */}
    <rect x="14" y="30" width="180" height="232" rx="14" fill="url(#mlPane)" stroke="rgba(167,139,250,0.26)" strokeWidth="1.5" />
    <g clipPath="url(#mlLeftClip)" fontFamily="ui-monospace, monospace" fontSize="10">
      <text x="30" y="60" fill="#c4b5fd" fontWeight="700">## Release notes</text>
      <text x="30" y="82" fill="#64748b">Ships **today**</text>
      <text x="30" y="104" fill="#64748b">with `--fast`.</text>

      <text x="30" y="132" fill="#f472b6">```ts</text>
      <text x="38" y="148" fill="#94a3b8">const ok = 1</text>
      <text x="30" y="164" fill="#f472b6">```</text>

      <text x="30" y="190" fill="#5eead4">- [x] parser</text>
      <text x="30" y="206" fill="#5eead4">- [ ] docs</text>

      <text x="30" y="234" fill="#64748b">| a | b |</text>
      <text x="30" y="250" fill="#64748b">|---|---|</text>

      {/* caret */}
      {animated && (
        <rect x="106" y="97" width="1.6" height="11" fill="#a78bfa">
          <animate attributeName="opacity" values="1;1;0;0" dur="1.1s" repeatCount="indefinite" />
        </rect>
      )}
    </g>

    {/* ---- the beam between the panes ---- */}
    <g>
      <path d="M198 146h22" stroke="rgba(167,139,250,0.4)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="m214 141 6 5-6 5" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </g>

    {/* ---- right pane: the rendered document ---- */}
    <rect x="226" y="30" width="180" height="232" rx="14" fill="url(#mlPane)" stroke="rgba(167,139,250,0.26)" strokeWidth="1.5" />
    <g clipPath="url(#mlRightClip)">
      {/* heading + rule */}
      <rect x="242" y="50" width="104" height="10" rx="5" fill="#ede9fe" opacity="0.92" />
      <rect x="242" y="66" width="148" height="1.4" fill="#a78bfa" opacity="0.28" />

      {/* paragraph, with a bold run and an inline code chip */}
      <rect x="242" y="80" width="120" height="5.5" rx="2.75" fill="#c4b5fd" opacity="0.34" />
      <rect x="242" y="92" width="42" height="5.5" rx="2.75" fill="#f5f3ff" opacity="0.85" />
      <rect x="290" y="90" width="40" height="9" rx="3" fill="#8b5cf6" opacity="0.28" />

      {/* code block */}
      <rect x="242" y="112" width="148" height="40" rx="7" fill="#050310" stroke="rgba(167,139,250,0.3)" strokeWidth="1" />
      <rect x="252" y="124" width="26" height="4.5" rx="2.25" fill="#f472b6" opacity="0.9" />
      <rect x="284" y="124" width="34" height="4.5" rx="2.25" fill="#7dd3fc" opacity="0.8" />
      <rect x="252" y="137" width="52" height="4.5" rx="2.25" fill="#86efac" opacity="0.7" />

      {/* task list */}
      {[0, 1].map(i => (
        <g key={i} transform={`translate(242,${166 + i * 18})`}>
          <rect x="0" y="0" width="10" height="10" rx="3" fill="none" stroke="#a78bfa" strokeWidth="1.4" opacity="0.8" />
          {i === 0 && <path d="m2.4 5.2 2.2 2.4 4-5" fill="none" stroke="#5eead4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}
          <rect x="17" y="2.6" width={i === 0 ? 64 : 46} height="5" rx="2.5" fill="#c4b5fd" opacity="0.35" />
        </g>
      ))}

      {/* table */}
      <g transform="translate(242,206)">
        <rect x="0" y="0" width="148" height="16" rx="4" fill="#8b5cf6" opacity="0.16" />
        <rect x="0" y="18" width="148" height="14" rx="4" fill="#ffffff" opacity="0.04" />
        <rect x="0" y="34" width="148" height="14" rx="4" fill="#ffffff" opacity="0.04" />
        <rect x="74" y="0" width="1" height="48" fill="#a78bfa" opacity="0.2" />
      </g>

      {/* the compiling sweep */}
      {animated && (
        <rect x="226" y="30" width="60" height="232" fill="url(#mlBeam)" opacity="0.5">
          <animate attributeName="x" values="200;406;200" dur="7s" repeatCount="indefinite" />
        </rect>
      )}
    </g>

    {/* ---- floating theme chips ---- */}
    {[
      { x: 150, y: 274, fill: '#0b1020', stroke: '#a78bfa' },
      { x: 186, y: 274, fill: '#fcfbf9', stroke: '#8b5cf6' },
      { x: 222, y: 274, fill: '#f5f2eb', stroke: '#b91c1c' },
      { x: 258, y: 274, fill: '#05050d', stroke: '#ff0055' },
    ].map((chip, i) => (
      <g key={i}>
        <rect x={chip.x} y={chip.y - 8} width="26" height="16" rx="5" fill={chip.fill} stroke={chip.stroke} strokeWidth="1.2" opacity="0.9">
          {animated && (
            <animate attributeName="opacity" values="0.45;1;0.45" dur="4.5s" begin={`${i * 0.55}s`} repeatCount="indefinite" />
          )}
        </rect>
      </g>
    ))}
  </svg>
);

// ---------------------------------------------------------------------------
// Empty state for the preview pane.
// ---------------------------------------------------------------------------
export const EmptyPreviewArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 160 130" className={className} role="img" aria-hidden="true">
    <rect x="26" y="14" width="108" height="102" rx="12" fill="none" stroke="currentColor" strokeWidth="2.2" opacity="0.3" />
    <rect x="42" y="34" width="52" height="7" rx="3.5" fill="currentColor" opacity="0.32" />
    <rect x="42" y="50" width="76" height="5" rx="2.5" fill="currentColor" opacity="0.18" />
    <rect x="42" y="62" width="64" height="5" rx="2.5" fill="currentColor" opacity="0.18" />
    <rect x="42" y="80" width="76" height="22" rx="6" fill="none" stroke="currentColor" strokeWidth="1.6" opacity="0.28" />
    {animated && (
      <rect x="42" y="34" width="52" height="7" rx="3.5" fill="currentColor" opacity="0.5">
        <animate attributeName="width" values="0;52;52" keyTimes="0;0.5;1" dur="3.6s" repeatCount="indefinite" />
      </rect>
    )}
  </svg>
);

// ---------------------------------------------------------------------------
// Feature icons
// ---------------------------------------------------------------------------
const iconBase = 'w-6 h-6';
const strokeProps = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** A syntax tree growing out of a line of text: the AST parser. */
export const IconParser: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <rect x="9.6" y="2.6" width="4.8" height="3.6" rx="1.2" />
    <rect x="3" y="14.6" width="4.8" height="3.6" rx="1.2" />
    <rect x="9.6" y="14.6" width="4.8" height="3.6" rx="1.2" />
    <rect x="16.2" y="14.6" width="4.8" height="3.6" rx="1.2" />
    <path d="M12 6.2v3.4M5.4 14.6v-2.2h13.2v2.2M12 12.4v2.2" />
  </svg>
);

/** Two panes with a live pulse between them: the split preview. */
export const IconLive: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <rect x="2.4" y="4.2" width="19.2" height="15.6" rx="2.4" />
    <path d="M12 4.2v15.6" />
    <path d="M5 8.6h4M5 12h4M5 15.4h2.6" opacity="0.75" />
    <path d="M15 8.6h4.2M15 12.4h4.2M15 15.8h2.4" opacity="0.5" />
  </svg>
);

/** A fenced block with coloured runs: the syntax highlighter. */
export const IconSyntax: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <rect x="2.4" y="4.6" width="19.2" height="14.8" rx="2.4" />
    <path d="M7.4 9.4 5 12l2.4 2.6M16.6 9.4 19 12l-2.4 2.6" />
    <path d="m13.4 8.6-2.8 6.8" />
  </svg>
);

/** Stacked sheets in different tints: the preview themes. */
export const IconThemes: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <rect x="7.4" y="2.6" width="13.8" height="13.8" rx="2.6" />
    <path d="M16.6 19.6a2.6 2.6 0 0 1-2.6 2.6H5.4a2.6 2.6 0 0 1-2.6-2.6v-8.6a2.6 2.6 0 0 1 2.6-2.6" />
    <path d="M11.4 6.6h5.8M11.4 10.2h3.4" opacity="0.7" />
  </svg>
);

/** A page leaving through an arrow: MD, HTML and PDF exports. */
export const IconExport: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <path d="M14 2.8H7a2.2 2.2 0 0 0-2.2 2.2v14a2.2 2.2 0 0 0 2.2 2.2h10a2.2 2.2 0 0 0 2.2-2.2V8Z" />
    <path d="M14 2.8V8h5.2" />
    <path d="M12 11.6v6M9.4 15l2.6 2.6L14.6 15" />
  </svg>
);

/** An indented outline: the table of contents built from the headings. */
export const IconOutline: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <path d="M3.4 5.4h17.2M6.6 9.8h14M6.6 14.2h14M9.8 18.6h10.8" />
    <circle cx="4.2" cy="14.2" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="7.4" cy="18.6" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

/** A shield inside a browser frame: nothing leaves the tab. */
export const IconLocalOnly: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <rect x="2.4" y="4" width="19.2" height="16" rx="2.6" />
    <path d="M2.4 8.2h19.2M5.4 6.1h.01M7.9 6.1h.01" />
    <path d="M12 10.4 8.4 11.9v2.7c0 2.2 1.5 4.2 3.6 4.9 2.1-.7 3.6-2.7 3.6-4.9v-2.7Z" />
  </svg>
);

/** Two panels with an arrow between them: the handoff to the next tool. */
export const IconHandoff: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <rect x="2.4" y="6" width="7.4" height="12" rx="2" />
    <rect x="14.2" y="6" width="7.4" height="12" rx="2" />
    <path d="M10.4 12h3.2M12.4 10.2 14.2 12l-1.8 1.8" />
    <path d="M4.8 9.4h2.6M4.8 12h2.6" opacity="0.7" />
  </svg>
);

/** A clock over stacked layers: the patch-based undo history. */
export const IconHistory: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <path d="M3.4 12a8.6 8.6 0 1 0 2.6-6.1" />
    <path d="M3 3.4V9h5.6" />
    <path d="M12 7.8V12l3 1.8" />
  </svg>
);

// ---------------------------------------------------------------------------
// "How it works" step artwork
// ---------------------------------------------------------------------------
export const StepWrite: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="14" y="12" width="92" height="66" rx="10" stroke="currentColor" strokeWidth="2.2" opacity="0.45" />
    <path d="M28 30h20M54 30h34M28 44h48M28 58h26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.45" />
    <path d="M24 26v8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
    <rect x="60" y="52" width="3" height="14" rx="1.5" fill="currentColor" opacity="0.85" />
  </svg>
);

export const StepPreview: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="10" y="14" width="44" height="62" rx="8" stroke="currentColor" strokeWidth="2.2" opacity="0.45" />
    <rect x="66" y="14" width="44" height="62" rx="8" stroke="currentColor" strokeWidth="2.2" opacity="0.7" />
    <path d="M20 30h18M20 40h24M20 50h14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity="0.35" />
    <rect x="76" y="26" width="24" height="7" rx="3.5" fill="currentColor" opacity="0.6" />
    <path d="M76 42h24M76 51h16" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity="0.3" />
    <rect x="76" y="58" width="24" height="10" rx="3" stroke="currentColor" strokeWidth="1.8" opacity="0.45" />
    <path d="M56 45h8" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity="0.8" />
  </svg>
);

export const StepStyle: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="34" y="10" width="58" height="54" rx="8" stroke="currentColor" strokeWidth="2.2" opacity="0.35" />
    <rect x="26" y="18" width="58" height="54" rx="8" stroke="currentColor" strokeWidth="2.2" opacity="0.6" />
    <rect x="18" y="26" width="58" height="54" rx="8" stroke="currentColor" strokeWidth="2.4" opacity="0.9" fill="none" />
    <path d="M30 42h30M30 52h22M30 62h16" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" opacity="0.45" />
    <circle cx="94" cy="66" r="8" stroke="currentColor" strokeWidth="2.4" opacity="0.8" />
  </svg>
);

export const StepShip: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="14" y="18" width="40" height="54" rx="7" stroke="currentColor" strokeWidth="2.2" opacity="0.55" />
    <rect x="70" y="18" width="36" height="54" rx="7" stroke="currentColor" strokeWidth="2.2" opacity="0.32" strokeDasharray="6 5" />
    <path d="M56 45h12M63 39l6 6-6 6" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M24 32h20M24 42h16M24 52h12" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity="0.45" />
  </svg>
);
