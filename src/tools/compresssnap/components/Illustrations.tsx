import React from 'react';
import { CompressionProcessArt } from '../../../components/shared/ToolProcessArt';

// ============================================================================
// Bespoke SVG artwork for CompressSnap, in the tool's cyan palette.
//
// The hero uses CSS motion with a reduced-motion guard and a finished still.
// ============================================================================

interface ArtProps {
  className?: string;
  animated?: boolean;
}


// ---------------------------------------------------------------------------
// Hero: the picture keeps its dimensions while its byte count shrinks.
// ---------------------------------------------------------------------------
export const CompressHeroArt: React.FC<ArtProps> = props => (
  <CompressionProcessArt {...props} />
);

/** Two gears offset from the main track: the encoder running off-thread. */
export const IconWorker: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M4 12h40M4 24h18M4 36h40" strokeLinecap="round" opacity="0.5" />
    <circle cx="33" cy="24" r="7" />
    <path d="M33 13v3m0 16v3m-11-11h3m16 0h3m-19.8-7.8 2.1 2.1m11.4 11.4 2.1 2.1m0-15.6-2.1 2.1M24.2 31.8l2.1-2.1" strokeLinecap="round" />
  </svg>
);

/** A file with a target ring: compress to a byte budget. */
export const IconBudget: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M10 6h16l8 8v9" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 6v30h9" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M26 6v8h8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="31" cy="33" r="10" />
    <circle cx="31" cy="33" r="4.5" />
    <circle cx="31" cy="33" r="1" fill="currentColor" stroke="none" />
  </svg>
);

/** A gauge with a tick: the measured quality, not a guess. */
export const IconMeasure: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M5 33a19 19 0 0 1 38 0" strokeLinecap="round" />
    <path d="M24 33 35 22" strokeLinecap="round" />
    <circle cx="24" cy="33" r="3" fill="currentColor" stroke="none" />
    <path d="m18 40 4 4 9-9" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
  </svg>
);

/** A shrinking palette: PNG colour quantisation. */
export const IconPalette: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="5" y="8" width="16" height="32" rx="3" />
    {[0, 1, 2, 3, 4, 5, 6].map(i => (
      <line key={i} x1="5" y1={12 + i * 4} x2="21" y2={12 + i * 4} strokeWidth="1" opacity="0.45" />
    ))}
    <path d="M26 24h6m0 0-3-3m3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="36" y="14" width="7" height="20" rx="2.5" fill="currentColor" fillOpacity="0.2" />
    <line x1="36" y1="21" x2="43" y2="21" strokeWidth="1.4" />
    <line x1="36" y1="27" x2="43" y2="27" strokeWidth="1.4" />
  </svg>
);

/** A phone with a photo and a conversion arrow: HEIC and the rest. */
export const IconFormats: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="6" y="4" width="20" height="34" rx="4" />
    <path d="M6 30h20" opacity="0.5" />
    <circle cx="13" cy="14" r="2.5" />
    <path d="m8 26 6-7 5 5 3-3 4 5" strokeLinejoin="round" />
    <path d="M30 40h12m0 0-4-4m4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="31" y="10" width="12" height="20" rx="3" opacity="0.6" />
  </svg>
);

/** A shield over a photo: nothing is uploaded. */
export const IconLocal: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M24 5l15 6v12c0 10-6.5 16.5-15 20-8.5-3.5-15-10-15-20V11l15-6Z" strokeLinejoin="round" />
    <rect x="14" y="18" width="20" height="14" rx="3" />
    <circle cx="19" cy="23" r="1.8" />
    <path d="m15 30 5-5 4 4 3-3 6 6" strokeLinejoin="round" />
  </svg>
);

// ---------------------------------------------------------------------------
// How it works
// ---------------------------------------------------------------------------

const frame = (children: React.ReactNode) => (
  <>
    <rect x="1" y="1" width="118" height="70" rx="12" fill="#071219" stroke="#164e63" strokeOpacity="0.6" />
    {children}
  </>
);

/** 1 — drop the photos in. Nothing runs yet. */
export const StepDrop: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 120 72" className={className} fill="none" aria-hidden="true">
    {frame(
      <>
        <rect x="28" y="12" width="64" height="48" rx="8" fill="#0a1a22" stroke="#0891b2" strokeDasharray="5 4" />
        <path d="M60 46V22m0 0-8 8m8-8 8 8" stroke="#22d3ee" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="44" y="50" width="32" height="4" rx="2" fill="#164e63" />
      </>
    )}
  </svg>
);

/** 2 — choose the trade: quality, a size budget, a format. */
export const StepChoose: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 120 72" className={className} fill="none" aria-hidden="true">
    {frame(
      <>
        {[16, 32, 48].map((y, i) => (
          <g key={y}>
            <rect x="14" y={y} width="92" height="5" rx="2.5" fill="#0e2a35" />
            <rect x="14" y={y} width={[68, 40, 84][i]} height="5" rx="2.5" fill="#0891b2" />
            <circle cx={14 + [68, 40, 84][i]} cy={y + 2.5} r="5" fill="#22d3ee" />
          </g>
        ))}
      </>
    )}
  </svg>
);

/** 3 — the worker does the batch while the page stays alive. */
export const StepRun: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 120 72" className={className} fill="none" aria-hidden="true">
    {frame(
      <>
        {[0, 1, 2, 3].map(i => (
          <g key={i}>
            <rect x="12" y={12 + i * 13} width="60" height="8" rx="3" fill="#0e2a35" />
            <rect x="12" y={12 + i * 13} width={[58, 44, 30, 14][i]} height="8" rx="3" fill="#22d3ee" opacity={0.9 - i * 0.15} />
            <circle cx="82" cy={16 + i * 13} r="3.4" fill={i === 0 ? '#5eead4' : '#164e63'} />
          </g>
        ))}
        <circle cx="100" cy="36" r="11" fill="none" stroke="#0891b2" strokeWidth="2" strokeDasharray="40 20" />
      </>
    )}
  </svg>
);

/** 4 — take the files, or send them straight to the next tool. */
export const StepTake: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 120 72" className={className} fill="none" aria-hidden="true">
    {frame(
      <>
        <rect x="14" y="20" width="34" height="32" rx="6" fill="#0a1a22" stroke="#0891b2" />
        <path d="M31 28v14m0 0-5-5m5 5 5-5" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M54 36h10" stroke="#164e63" strokeWidth="1.6" strokeLinecap="round" />
        {[0, 1, 2].map(i => (
          <g key={i}>
            <path d={`M64 36 L72 ${20 + i * 16}`} stroke="#164e63" strokeWidth="1.3" strokeLinecap="round" />
            <rect x="74" y={13 + i * 16} width="32" height="13" rx="4" fill="#0a1a22" stroke="#164e63" strokeOpacity="0.8" />
            <rect x="79" y={18 + i * 16} width={22 - i * 5} height="4" rx="2" fill="#22d3ee" opacity="0.65" />
          </g>
        ))}
      </>
    )}
  </svg>
);
