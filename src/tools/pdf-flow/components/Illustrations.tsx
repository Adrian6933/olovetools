import React from 'react';
import { PdfProcessArt } from '../../../components/shared/MoreToolProcessArt';

// ============================================================================
// Bespoke SVG artwork for PDFFlow. Inline, self-contained, themed on the tool's
// crimson palette. No raster assets and no network requests.
// ============================================================================

interface ArtProps {
  className?: string;
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Hero: loose pages sliding together into a single bound document.
// ---------------------------------------------------------------------------
export const PdfHeroArt: React.FC<ArtProps> = props => (
  <PdfProcessArt {...props} />
);

// ---------------------------------------------------------------------------
// Feature icons
// ---------------------------------------------------------------------------
const base = 'w-6 h-6';

/** Shield over a document: nothing leaves the device. */
export const IconLocalPdf: React.FC<{ className?: string }> = ({ className = base }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2.5 5 5.2v5.4c0 4.3 2.9 8.1 7 9.4 4.1-1.3 7-5.1 7-9.4V5.2Z" />
    <path d="M9.4 9h5.2M9.4 12h5.2M9.4 15h3" />
  </svg>
);

/** Two sheets becoming one. */
export const IconMerge: React.FC<{ className?: string }> = ({ className = base }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2.5" y="4" width="8" height="10.5" rx="1.6" />
    <rect x="13.5" y="4" width="8" height="10.5" rx="1.6" />
    <path d="M6.5 14.5v2.8a1.7 1.7 0 0 0 1.7 1.7h7.6a1.7 1.7 0 0 0 1.7-1.7v-2.8" />
    <path d="M12 17.5V21M10.3 19.3 12 21l1.7-1.7" />
  </svg>
);

/** A page splitting along a dashed line. */
export const IconSplit: React.FC<{ className?: string }> = ({ className = base }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9.5 3.5H5.8A1.8 1.8 0 0 0 4 5.3v13.4a1.8 1.8 0 0 0 1.8 1.8h3.7" />
    <path d="M14.5 3.5h3.7A1.8 1.8 0 0 1 20 5.3v13.4a1.8 1.8 0 0 1-1.8 1.8h-3.7" />
    <path d="M12 3v2.5M12 8v2.5M12 13v2.5M12 18v2.5" />
  </svg>
);

/** Compression arrows squeezing a document. */
export const IconCompress: React.FC<{ className?: string }> = ({ className = base }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="7" y="8" width="10" height="8" rx="1.6" />
    <path d="M12 2.5v3.2M10.4 4.4 12 2.8l1.6 1.6" />
    <path d="M12 21.5v-3.2M10.4 19.6 12 21.2l1.6-1.6" />
    <path d="M4 12h1.8M18.2 12H20" />
  </svg>
);

/** Page turning into a picture. */
export const IconToImage: React.FC<{ className?: string }> = ({ className = base }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.5 3.5H5.8A1.8 1.8 0 0 0 4 5.3v13.4a1.8 1.8 0 0 0 1.8 1.8h4.7" />
    <rect x="13" y="7.5" width="8" height="9" rx="1.6" />
    <path d="m14 15 2-2.4 1.6 1.8 1.4-1.6 1 2.2Z" />
    <circle cx="15.6" cy="10.4" r="1" />
  </svg>
);

/** Grid of pages with a drag handle: reorder, rotate, delete. */
export const IconOrganize: React.FC<{ className?: string }> = ({ className = base }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3.5" width="7" height="8" rx="1.4" />
    <rect x="14" y="3.5" width="7" height="8" rx="1.4" />
    <rect x="3" y="14.5" width="7" height="6" rx="1.4" />
    <path d="M14.4 17.5h6.2M18.2 15.1l2.4 2.4-2.4 2.4" />
  </svg>
);

// ---------------------------------------------------------------------------
// "How it works" step artwork
// ---------------------------------------------------------------------------
export const StepPick: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="10" y="16" width="30" height="20" rx="5" stroke="currentColor" strokeWidth="2.4" opacity="0.45" />
    <rect x="45" y="16" width="30" height="20" rx="5" stroke="currentColor" strokeWidth="2.8" />
    <rect x="80" y="16" width="30" height="20" rx="5" stroke="currentColor" strokeWidth="2.4" opacity="0.45" />
    <path d="M60 42v10" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
    <path d="M32 74h56" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" opacity="0.5" />
    <path d="M52 60h16M60 52v16" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
  </svg>
);

export const StepDrop: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="8" y="12" width="104" height="66" rx="12" stroke="currentColor" strokeWidth="2" strokeDasharray="7 6" opacity="0.55" />
    <path d="M60 58V32" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
    <path d="m50 42 10-10 10 10" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M40 62h40" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" opacity="0.4" />
  </svg>
);

export const StepArrange: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="14" y="18" width="26" height="34" rx="4" stroke="currentColor" strokeWidth="2.4" />
    <rect x="47" y="18" width="26" height="34" rx="4" stroke="currentColor" strokeWidth="2.4" opacity="0.5" />
    <rect x="80" y="18" width="26" height="34" rx="4" stroke="currentColor" strokeWidth="2.4" />
    <path d="M27 66h66" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.35" />
    <path d="M86 60a10 10 0 1 0 10 10" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    <path d="m92 56 5 4-5 4" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 62h14M27 55v14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);

export const StepSave: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="20" y="12" width="80" height="52" rx="9" stroke="currentColor" strokeWidth="2" opacity="0.5" />
    <path d="M60 20v26" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
    <path d="m50 36 10 10 10-10" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M32 76h56" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
  </svg>
);
