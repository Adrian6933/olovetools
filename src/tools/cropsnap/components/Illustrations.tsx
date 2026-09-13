import React from 'react';
import { useReducedMotion } from '../../../components/shared/motion';

// ============================================================================
// Bespoke SVG artwork for CropSnap, in the tool's rose palette.
// Inline and self-contained: no raster assets, no network requests.
// ============================================================================

interface ArtProps {
  className?: string;
  /** Disables the SMIL animations for users who asked for reduced motion. */
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Hero: a photo with a crop frame closing in on it, corner handles and all.
// ---------------------------------------------------------------------------

/**
 * The two poses the crop frame moves between: wide open, then settled. Every
 * moving part below is derived from these numbers instead of carrying its own
 * hand-written keyframes — that is what let the right-hand handles sit 26 units
 * outside the frame they are supposed to be gripping.
 */
const FRAME = {
  open: { left: 70, width: 260 },
  set: { left: 96, width: 208 },
  top: 66,
  height: 146,
};

const LOOP = { keyTimes: '0;0.15;0.55;0.9;1', dur: '8s', repeatCount: 'indefinite', calcMode: 'spline', keySplines: '0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1' } as const;

/** Hold the source, settle the crop, hold the result, then reset together. */
const FrameLoop: React.FC<{ attr: string; open: number; set: number }> = ({ attr, open, set }) => (
  <animate attributeName={attr} values={`${open};${open};${set};${set};${open}`} {...LOOP} />
);

/** A geometric feature of the frame, measured in both poses. */
const at = (fraction: number) => ({
  open: FRAME.open.left + FRAME.open.width * fraction,
  set: FRAME.set.left + FRAME.set.width * fraction,
});

const round = (n: number) => Math.round(n * 10) / 10;

export const CropHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => {
  const reduced = useReducedMotion();
  animated = animated && !reduced;
  const { top, height } = FRAME;
  const bottom = top + height;
  const edges = { left: at(0), third1: at(1 / 3), third2: at(2 / 3), right: at(1) };
  // The handles are 10 wide, so their box starts half a handle before the edge.
  const handleX = (edge: { open: number; set: number }) => ({ open: edge.open - 5, set: edge.set - 5 });

  return (
    <svg viewBox="0 0 400 300" className={`crop-process ${className}`} data-static={animated ? undefined : ''} role="img" aria-hidden="true">
      <style>{`
        .crop-process .crop-finish { animation: crop-finish 8s ease-in-out infinite both; }
        @keyframes crop-finish { 0%,55% { opacity: 0; } 65%,90% { opacity: 1; } 100% { opacity: 0; } }
        .crop-process[data-static] .crop-finish { animation: none; }
        @media (prefers-reduced-motion: reduce) { .crop-process .crop-finish { animation: none; } }
      `}</style>
      <defs>
        <linearGradient id="csSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4c0519" />
          <stop offset="55%" stopColor="#be123c" />
          <stop offset="100%" stopColor="#fda4af" />
        </linearGradient>
        <linearGradient id="csHill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#881337" />
          <stop offset="100%" stopColor="#4c0519" />
        </linearGradient>
        <clipPath id="csFrame">
          <rect x="14" y="18" width="372" height="238" rx="20" />
        </clipPath>
        {/* The area kept by the crop. Everything outside is dimmed. */}
        <mask id="csKeep">
          <rect x="0" y="0" width="400" height="300" fill="#fff" />
          <rect x={FRAME.set.left} y={top} width={FRAME.set.width} height={height} rx="4" fill="#000">
            {animated && (
              <>
                <FrameLoop attr="x" open={FRAME.open.left} set={FRAME.set.left} />
                <FrameLoop attr="width" open={FRAME.open.width} set={FRAME.set.width} />
              </>
            )}
          </rect>
        </mask>
      </defs>

      <g clipPath="url(#csFrame)">
        {/* Photo */}
        <rect x="14" y="18" width="372" height="238" fill="url(#csSky)" />
        <circle cx="308" cy="72" r="24" fill="#fecdd3" opacity="0.85" />
        <path d="M14 186 L104 128 L178 182 L244 140 L326 198 L386 166 L386 256 L14 256 Z" fill="url(#csHill)" />
        <path d="M14 216 L92 180 L172 222 L262 182 L386 228 L386 256 L14 256 Z" fill="#3f0716" opacity="0.9" />

        {/* Everything outside the crop gets dimmed */}
        <rect x="14" y="18" width="372" height="238" fill="#050308" opacity="0.62" mask="url(#csKeep)" />
      </g>

      {/* Crop frame */}
      <g>
        <rect
          x={FRAME.set.left}
          y={top}
          width={FRAME.set.width}
          height={height}
          rx="4"
          fill="none"
          stroke="#fb7185"
          strokeWidth="2.5"
        >
          {animated && (
            <>
              <FrameLoop attr="x" open={FRAME.open.left} set={FRAME.set.left} />
              <FrameLoop attr="width" open={FRAME.open.width} set={FRAME.set.width} />
            </>
          )}
        </rect>

        {/* Rule-of-thirds guides */}
        <g stroke="#fb7185" strokeWidth="1" opacity="0.4">
          {[edges.third1, edges.third2].map((edge, i) => (
            <line key={i} x1={round(edge.set)} y1={top} x2={round(edge.set)} y2={bottom}>
              {animated && <FrameLoop attr="x1" open={round(edge.open)} set={round(edge.set)} />}
              {animated && <FrameLoop attr="x2" open={round(edge.open)} set={round(edge.set)} />}
            </line>
          ))}
          {[1 / 3, 2 / 3].map((fraction, i) => (
            <line
              key={i}
              x1={edges.left.set}
              y1={round(top + height * fraction)}
              x2={edges.right.set}
              y2={round(top + height * fraction)}
            >
              {animated && <FrameLoop attr="x1" open={edges.left.open} set={edges.left.set} />}
              {animated && <FrameLoop attr="x2" open={edges.right.open} set={edges.right.set} />}
            </line>
          ))}
        </g>

        {/* Corner handles, each pinned to the frame edge it belongs to */}
        {[
          [edges.left, top],
          [edges.right, top],
          [edges.left, bottom],
          [edges.right, bottom],
        ].map(([edge, cy], i) => {
          const x = handleX(edge as { open: number; set: number });
          return (
            <rect
              key={i}
              x={x.set}
              y={(cy as number) - 5}
              width="10"
              height="10"
              rx="2"
              fill="#fff"
              stroke="#e11d48"
              strokeWidth="1.5"
            >
              {animated && <FrameLoop attr="x" open={x.open} set={x.set} />}
            </rect>
          );
        })}
      </g>

      <rect x="14" y="18" width="372" height="238" rx="20" fill="none" stroke="rgba(251,113,133,0.25)" strokeWidth="1.5" />
      <g className="crop-finish">
        <rect x="121" y="265" width="158" height="26" rx="8" fill="#341522" stroke="#bc6679" />
        <text x="134" y="283" fontFamily="ui-monospace, monospace" fontSize="12" fill="#ffe4e6">cropped.png</text>
        <circle cx="261" cy="278" r="7" fill="#bbf7d0" />
        <path d="m258 278 2 2 4-4" fill="none" stroke="#166534" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Empty-state art for the drop zone.
// ---------------------------------------------------------------------------
export const DropArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 140 120" className={className} role="img" aria-hidden="true">
    <rect x="14" y="16" width="112" height="80" rx="10" fill="none" stroke="currentColor" strokeWidth="2.4" opacity="0.45" />
    <path d="M24 82 L52 56 L70 72 L88 58 L116 84" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
    <circle cx="94" cy="40" r="7" fill="currentColor" opacity="0.55" />
    <g>
      <path d="M70 96v14M64 104l6 6 6-6" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
        {animated && <animate attributeName="opacity" values="0.35;1;0.35" dur="2.4s" repeatCount="indefinite" />}
      </path>
    </g>
  </svg>
);

// ---------------------------------------------------------------------------
// Feature icons
// ---------------------------------------------------------------------------
const iconBase = 'w-6 h-6';

/** Frame with corner marks over a bigger frame: crops at source resolution. */
export const IconFullRes: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 7.5V4.6A1.6 1.6 0 0 1 4.6 3H7.5M16.5 3h2.9A1.6 1.6 0 0 1 21 4.6v2.9M21 16.5v2.9a1.6 1.6 0 0 1-1.6 1.6h-2.9M7.5 21H4.6A1.6 1.6 0 0 1 3 19.4v-2.9" />
    <rect x="8.6" y="8.6" width="6.8" height="6.8" rx="1" />
    <path d="M12 6.4V3M12 21v-3.4M6.4 12H3M21 12h-3.4" opacity="0.45" />
  </svg>
);

/** Shield with a picture: nothing is uploaded. */
export const IconLocalCrop: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2.4 4.6 5.4v5.5c0 4.5 3 8.6 7.4 10.1 4.4-1.5 7.4-5.6 7.4-10.1V5.4Z" />
    <path d="m8 14.6 2.4-2.8 1.8 2 1.6-1.8 2.2 2.6Z" />
    <circle cx="9.6" cy="9.2" r="1.1" />
  </svg>
);

/** Grid of named boxes: the size presets. */
export const IconPresets: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2.6" y="3.4" width="8" height="8" rx="1.4" />
    <rect x="13.4" y="3.4" width="8" height="5" rx="1.4" />
    <rect x="2.6" y="14.2" width="5" height="6.4" rx="1.4" />
    <rect x="10.4" y="11.4" width="11" height="9.2" rx="1.4" />
  </svg>
);

/** Rotating arrow around a frame: the transform controls. */
export const IconStraighten: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="6.6" y="6.6" width="10.8" height="10.8" rx="1.6" transform="rotate(-12 12 12)" />
    <path d="M4.2 8.4A8.4 8.4 0 0 1 19 6.6" />
    <path d="M3.4 4.6v3.9h3.9" />
  </svg>
);

/** Stacked layers with an arrow: the undo history. */
export const IconHistory: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3.6 8.4A8.6 8.6 0 1 1 3.4 13" />
    <path d="M3 4.2v4.4h4.4" />
    <path d="M12 8v4.4l3 1.8" />
  </svg>
);

/** Two panes with an arrow: hand the crop to the next tool. */
export const IconHandoff: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

export const StepFrame: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="12" y="12" width="96" height="66" rx="8" fill="currentColor" opacity="0.12" />
    <rect x="34" y="26" width="54" height="40" rx="3" stroke="currentColor" strokeWidth="2.6" />
    <path d="M52 26v40M70 26v40M34 39.3h54M34 52.6h54" stroke="currentColor" strokeWidth="1.2" opacity="0.45" />
    {[
      [34, 26],
      [88, 26],
      [34, 66],
      [88, 66],
    ].map(([x, y], i) => (
      <rect key={i} x={x - 4} y={y - 4} width="8" height="8" rx="1.6" fill="currentColor" />
    ))}
  </svg>
);

export const StepTune: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <path d="M22 30h76M22 50h76M22 70h76" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.35" />
    <circle cx="46" cy="30" r="8" fill="currentColor" />
    <circle cx="76" cy="50" r="8" fill="currentColor" opacity="0.8" />
    <circle cx="38" cy="70" r="8" fill="currentColor" opacity="0.6" />
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
