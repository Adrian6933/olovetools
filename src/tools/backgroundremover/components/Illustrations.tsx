import React from 'react';
import { BackgroundProcessArt } from '../../../components/shared/ToolProcessArt';

// ============================================================================
// Bespoke SVG artwork for the Background Remover.
// Everything is inline, self-contained and themed with the tool's fuchsia
// palette — no raster assets, no network requests, and it scales to any size.
// ============================================================================

interface ArtProps {
  className?: string;
  /** Shows the finished cutout without motion when false. */
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Hero: a photo whose background dissolves into transparency behind a sweeping
// cut line. The subject stays put — which is exactly what the tool does.
// ---------------------------------------------------------------------------
export const CutoutHeroArt: React.FC<ArtProps> = props => (
  <BackgroundProcessArt {...props} />
);

// ---------------------------------------------------------------------------
// Feature icons
// ---------------------------------------------------------------------------
const iconBase = 'w-7 h-7';

/** Shield with a processor die: the model runs on your machine. */
export const IconLocalAI: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2.5 4.5 5.6v5.6c0 4.5 3.1 8.5 7.5 10 4.4-1.5 7.5-5.5 7.5-10V5.6Z" />
    <rect x="9" y="9" width="6" height="6" rx="1.2" />
    <path d="M10.5 9V7.4M13.5 9V7.4M10.5 16.6V15M13.5 16.6V15M9 10.5H7.4M9 13.5H7.4M16.6 10.5H15M16.6 13.5H15" />
  </svg>
);

/** Frame with corner marks: full original resolution, no downscaling. */
export const IconFullRes: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 8V4.5A1.5 1.5 0 0 1 4.5 3H8M16 3h3.5A1.5 1.5 0 0 1 21 4.5V8M21 16v3.5a1.5 1.5 0 0 1-1.5 1.5H16M8 21H4.5A1.5 1.5 0 0 1 3 19.5V16" />
    <path d="M7.5 15.5 10 12.2l2.2 2.6 2-2.3 2.3 3Z" />
    <circle cx="9.2" cy="9" r="1.3" />
  </svg>
);

/** Cloud with a slash: works with the network off once cached. */
export const IconOffline: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.6 17.5H7a4 4 0 0 1-.6-7.95A5.5 5.5 0 0 1 16.4 8.2a3.9 3.9 0 0 1 3.2 5.9" />
    <path d="m3.5 3.5 17 17" />
  </svg>
);

/** Brush over a mask: the manual refinement tools. */
export const IconBrushTools: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14.6 4.4 19.6 9.4 10.2 18.8a3 3 0 0 1-1.5.8l-4 .8.8-4a3 3 0 0 1 .8-1.5Z" />
    <path d="m13 6 5 5" />
    <path d="M4.5 20.5c1.6.6 3-.2 3-1.8" />
  </svg>
);

/** Two panes with an arrow: hand the result to the next tool. */
export const IconHandoff: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2.5" y="6" width="7.5" height="12" rx="1.8" />
    <rect x="14" y="6" width="7.5" height="12" rx="1.8" />
    <path d="M10.8 12h2.4M12.2 10.4 13.8 12l-1.6 1.6" />
  </svg>
);

/** Layered stack: batch queue. */
export const IconBatch: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="7" y="3.5" width="13.5" height="13.5" rx="2" />
    <path d="M16.5 20.5H5.5a2 2 0 0 1-2-2v-11" />
    <path d="m10.5 13 2.6-3.2 2 2.4 1.7-2 2.7 3.6Z" />
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

export const StepAI: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="24" y="16" width="72" height="58" rx="10" stroke="currentColor" strokeWidth="2" opacity="0.55" />
    <ellipse cx="60" cy="40" rx="12" ry="13" fill="currentColor" opacity="0.85" />
    <path d="M40 74c0-13 9-20 20-20s20 7 20 20Z" fill="currentColor" opacity="0.85" />
    <path d="m92 20 2.6 6.4 6.4 2.6-6.4 2.6L92 38l-2.6-6.4L83 29l6.4-2.6Z" fill="currentColor" />
    <path d="m28 56 1.8 4.4 4.4 1.8-4.4 1.8L28 68.4l-1.8-4.4L21.8 62l4.4-1.8Z" fill="currentColor" opacity="0.7" />
  </svg>
);

export const StepRefine: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="16" y="14" width="88" height="62" rx="10" stroke="currentColor" strokeWidth="2" opacity="0.4" />
    <path d="M74 26 90 42 62 70a5 5 0 0 1-2.5 1.3l-7.5 1.5 1.5-7.5A5 5 0 0 1 54.8 62Z" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" />
    <path d="m70 30 16 16" stroke="currentColor" strokeWidth="2.6" />
    <circle cx="36" cy="34" r="7" stroke="currentColor" strokeWidth="2.6" strokeDasharray="3 3" />
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

// ---------------------------------------------------------------------------
// Small decorative checkerboard tile used behind result previews.
// ---------------------------------------------------------------------------
export const CheckerTile: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={className} aria-hidden="true">
    <defs>
      <pattern id="brTile" width="16" height="16" patternUnits="userSpaceOnUse">
        <rect width="16" height="16" fill="#140d1e" />
        <rect width="8" height="8" fill="#1e1430" />
        <rect x="8" y="8" width="8" height="8" fill="#1e1430" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#brTile)" />
  </svg>
);
