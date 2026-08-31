import React from 'react';

// ============================================================================
// Bespoke artwork for MemeBolt.
// Inline SVG only: no raster assets, no network request, no emoji standing in
// for an illustration. Everything is themed with the tool's fuchsia palette and
// scales to any size.
// ============================================================================

interface ArtProps {
  className?: string;
  /** Turns the SMIL animations off for prefers-reduced-motion. */
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Hero — a meme in the middle of being written: caption bar on top, outlined
// Impact-style text landing on the picture, a sticker settling into place.
// ---------------------------------------------------------------------------
export const MemeHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 400 320" className={className} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="mbSky" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#4c1d95" />
        <stop offset="55%" stopColor="#a21caf" />
        <stop offset="100%" stopColor="#f0abfc" />
      </linearGradient>
      <linearGradient id="mbHill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#701a75" />
        <stop offset="100%" stopColor="#3b0764" />
      </linearGradient>
      <linearGradient id="mbShine" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="50%" stopColor="#ffffff" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
      <clipPath id="mbFrame">
        <rect x="14" y="14" width="372" height="292" rx="24" />
      </clipPath>
    </defs>

    <g clipPath="url(#mbFrame)">
      {/* caption bar */}
      <rect x="14" y="14" width="372" height="62" fill="#f8fafc" />
      <g fill="#0f172a">
        <rect x="44" y="36" width="150" height="9" rx="4.5" />
        <rect x="44" y="53" width="96" height="9" rx="4.5" opacity="0.55" />
      </g>
      {/* typing caret */}
      <rect x="146" y="50" width="4" height="15" fill="#c026d3">
        {animated && <animate attributeName="opacity" values="1;1;0;0" dur="1.1s" repeatCount="indefinite" />}
      </rect>

      {/* picture */}
      <rect x="14" y="76" width="372" height="230" fill="url(#mbSky)" />
      <circle cx="318" cy="122" r="24" fill="#fde68a" opacity="0.9" />
      <path d="M14 236 L96 184 L166 228 L230 190 L306 240 L386 206 L386 306 L14 306 Z" fill="url(#mbHill)" />
      <path d="M14 264 L88 230 L164 268 L252 232 L386 274 L386 306 L14 306 Z" fill="#2e1065" opacity="0.9" />

      {/* meme caption, outlined the way the tool draws it */}
      <g
        fontFamily="Impact, 'Arial Black', sans-serif"
        fontSize="38"
        textAnchor="middle"
        stroke="#0b0710"
        strokeWidth="7"
        strokeLinejoin="round"
        paintOrder="stroke"
        fill="#ffffff"
      >
        <text x="200" y="288">
          NO UPLOAD
          {animated && (
            <animate attributeName="y" values="300;288;288" dur="2.4s" repeatCount="indefinite" keyTimes="0;0.35;1" />
          )}
        </text>
      </g>

      {/* sticker landing */}
      <g transform="translate(300 168)">
        <g>
          {animated && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="-18;-6;-18"
              dur="4.5s"
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes="0;0.5;1"
              keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
            />
          )}
          <rect x="-46" y="-14" width="92" height="28" rx="3" fill="#0b0710" />
          <rect x="-42" y="-10" width="30" height="20" fill="#f8fafc" opacity="0.9" />
          <rect x="12" y="-10" width="30" height="20" fill="#f8fafc" opacity="0.9" />
        </g>
      </g>

      {/* selection chrome, so the art shows it is an editor */}
      <g stroke="#f0abfc" strokeWidth="1.5" fill="none" strokeDasharray="6 5">
        <rect x="86" y="258" width="228" height="44" rx="4" />
      </g>
      <g fill="#c026d3" stroke="#ffffff" strokeWidth="2">
        <circle cx="86" cy="258" r="5" />
        <circle cx="314" cy="258" r="5" />
        <circle cx="86" cy="302" r="5" />
        <circle cx="314" cy="302" r="5" />
      </g>

      {animated && (
        <rect x="-140" y="14" width="120" height="292" fill="url(#mbShine)">
          <animate attributeName="x" values="-140;400" dur="6s" repeatCount="indefinite" />
        </rect>
      )}
    </g>

    <rect x="14" y="14" width="372" height="292" rx="24" fill="none" stroke="rgba(232,121,249,0.28)" strokeWidth="1.5" />
  </svg>
);

// ---------------------------------------------------------------------------
// Feature icons
// ---------------------------------------------------------------------------
const iconBase = 'w-6 h-6';
const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** Browser window with a shield: the picture never leaves the tab. */
export const IconLocal: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <rect x="2.5" y="4" width="19" height="15" rx="2.5" />
    <path d="M2.5 8h19" />
    <circle cx="5.6" cy="6" r="0.7" fill="currentColor" stroke="none" />
    <path d="M12 10.2 8.6 11.6v2.6c0 2 1.4 3.7 3.4 4.3 2-.6 3.4-2.3 3.4-4.3v-2.6Z" />
  </svg>
);

/** Nodes on a curve: the templates are vectors, so any export size is sharp. */
export const IconVector: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <path d="M4 18C4 10 12 14 12 7" />
    <rect x="2" y="16.5" width="4" height="4" rx="1" />
    <rect x="10" y="3.5" width="4" height="4" rx="1" />
    <path d="M15 12h6M18 9v6" />
  </svg>
);

/** Stacked cards: every caption and sticker stays its own editable layer. */
export const IconLayers: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <path d="M12 3 3 7.5 12 12l9-4.5Z" />
    <path d="M3 12.5 12 17l9-4.5" />
    <path d="M3 17 12 21.5 21 17" />
  </svg>
);

/** Wrapped lines inside a box: real text metrics, real line breaks. */
export const IconWrap: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <rect x="2.5" y="4.5" width="19" height="15" rx="2" strokeDasharray="3 3" />
    <path d="M6 9h9M6 12.5h12M6 16h6" />
    <path d="M18.5 14.5 20.5 16l-2 1.5" />
  </svg>
);

/** Keycaps: the editor is driven from the keyboard too. */
export const IconKeys: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <rect x="2" y="6" width="20" height="12" rx="2.5" />
    <path d="M6 9.5h.01M9.5 9.5h.01M13 9.5h.01M16.5 9.5h.01M6 12.8h.01M9.5 12.8h.01M13 12.8h.01M16.5 12.8h.01" />
    <path d="M7.5 15.6h9" />
  </svg>
);

/** Two tools linked: the meme travels to the next tool without a download. */
export const IconHandoff: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <rect x="2.5" y="7" width="7" height="10" rx="2" />
    <rect x="14.5" y="7" width="7" height="10" rx="2" />
    <path d="M9.5 12h5" />
    <path d="M12.8 10.2 14.8 12l-2 1.8" />
  </svg>
);

// ---------------------------------------------------------------------------
// How it works — one small scene per step
// ---------------------------------------------------------------------------
const stepFrame = (body: React.ReactNode) => (
  <>
    <rect x="2" y="6" width="92" height="60" rx="8" fill="rgba(217,70,239,0.07)" stroke="rgba(232,121,249,0.28)" />
    {body}
  </>
);

export const StepPick: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 96 72" className={className} aria-hidden="true">
    {stepFrame(
      <g>
        <rect x="10" y="14" width="34" height="21" rx="3" fill="currentColor" opacity="0.25" />
        <rect x="52" y="14" width="34" height="21" rx="3" fill="currentColor" opacity="0.5" />
        <rect x="10" y="40" width="34" height="21" rx="3" fill="currentColor" opacity="0.35" />
        <rect x="52" y="40" width="34" height="21" rx="3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 3" />
        <path d="M64 50.5l4 4 9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    )}
  </svg>
);

export const StepWrite: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 96 72" className={className} aria-hidden="true">
    {stepFrame(
      <g>
        <rect x="12" y="16" width="72" height="14" rx="3" fill="currentColor" opacity="0.18" />
        <rect x="16" y="21" width="40" height="4" rx="2" fill="currentColor" />
        <rect x="58" y="19" width="2.5" height="8" fill="currentColor" />
        <rect x="12" y="38" width="72" height="24" rx="3" fill="currentColor" opacity="0.1" />
        <rect x="20" y="45" width="56" height="5" rx="2.5" fill="currentColor" opacity="0.75" />
        <rect x="30" y="53" width="36" height="5" rx="2.5" fill="currentColor" opacity="0.45" />
      </g>
    )}
  </svg>
);

export const StepTune: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 96 72" className={className} aria-hidden="true">
    {stepFrame(
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M14 22h68M14 36h68M14 50h68" opacity="0.35" />
        <circle cx="34" cy="22" r="6" fill="currentColor" stroke="none" />
        <circle cx="62" cy="36" r="6" fill="currentColor" stroke="none" />
        <circle cx="46" cy="50" r="6" fill="currentColor" stroke="none" />
      </g>
    )}
  </svg>
);

export const StepExport: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 96 72" className={className} aria-hidden="true">
    {stepFrame(
      <g>
        <rect x="24" y="14" width="48" height="30" rx="4" fill="currentColor" opacity="0.2" />
        <path d="M48 24v18" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M41 36l7 7 7-7" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M26 54h44" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      </g>
    )}
  </svg>
);
