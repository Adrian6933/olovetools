import React from 'react';
import { QrProcessArt } from '../../../components/shared/MoreToolProcessArt';

// ============================================================================
// Bespoke SVG artwork for QRBolt, in the tool's emerald palette.
// Inline and self-contained: no raster assets and no network requests.
// ============================================================================

interface ArtProps {
  className?: string;
  /** Shows the completed illustration without motion when false. */
  animated?: boolean;
}


// ---------------------------------------------------------------------------
// Hero: content and styling choices become a QR illustration ready to export.
// ---------------------------------------------------------------------------
export const QrHeroArt: React.FC<ArtProps> = props => (
  <QrProcessArt {...props} />
);

// ---------------------------------------------------------------------------
// Feature icons
// ---------------------------------------------------------------------------
const iconBase = 'w-6 h-6';

/** Palette over a module grid: the design controls. */
export const IconStyling: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2.8" y="2.8" width="7" height="7" rx="1.6" />
    <rect x="14.2" y="2.8" width="7" height="7" rx="3.5" />
    <rect x="2.8" y="14.2" width="7" height="7" rx="3.5" />
    <path d="M14.2 21.2a3.5 3.5 0 0 1 0-7 3.5 3.5 0 0 0 3.5-3.5 3.5 3.5 0 1 1 3.5 3.5h-1.4a1.6 1.6 0 0 0 0 3.2h.6a3.4 3.4 0 0 1-3.4 3.8Z" />
  </svg>
);

/** Shield over a module grid: nothing leaves the browser. */
export const IconLocalQr: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2.4 4.6 5.4v5.5c0 4.5 3 8.6 7.4 10.1 4.4-1.5 7.4-5.6 7.4-10.1V5.4Z" />
    <rect x="8.2" y="7.8" width="3.2" height="3.2" rx="0.8" />
    <rect x="12.6" y="7.8" width="3.2" height="3.2" rx="0.8" />
    <rect x="8.2" y="12.2" width="3.2" height="3.2" rx="0.8" />
    <path d="M12.6 12.2h1.6v1.6h1.6v1.6" />
  </svg>
);

/** Magnifier reading a code: the read-back check. */
export const IconVerify: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2.6" y="2.6" width="6" height="6" rx="1.4" />
    <rect x="15.4" y="2.6" width="6" height="6" rx="1.4" />
    <rect x="2.6" y="15.4" width="6" height="6" rx="1.4" />
    <circle cx="15.6" cy="15.6" r="4.2" />
    <path d="m18.7 18.7 2.7 2.7" />
    <path d="m13.9 15.6 1.2 1.3 2.3-2.5" />
  </svg>
);

/** Frame with corner marks and an arrow: export size. */
export const IconExport: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 8.5V4.6A1.6 1.6 0 0 1 4.6 3H8.5M15.5 3h3.9A1.6 1.6 0 0 1 21 4.6V8.5M21 15.5v3.9a1.6 1.6 0 0 1-1.6 1.6H15.5M8.5 21H4.6A1.6 1.6 0 0 1 3 19.4V15.5" />
    <path d="M12 7.5v7M9 11.5l3 3 3-3" />
  </svg>
);

/** Contact card: vCard and the other structured payloads. */
export const IconPayloads: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2.4" y="4.6" width="19.2" height="14.8" rx="2.4" />
    <circle cx="8.4" cy="10.6" r="2.2" />
    <path d="M4.9 16.2c.4-1.9 1.8-2.9 3.5-2.9s3.1 1 3.5 2.9" />
    <path d="M14.8 9.4h4.2M14.8 12.6h4.2M14.8 15.8h2.6" />
  </svg>
);

/** Two panes with an arrow: hand the code to the next tool. */
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
export const StepPick: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="14" y="16" width="42" height="26" rx="6" stroke="currentColor" strokeWidth="2.2" opacity="0.5" />
    <rect x="64" y="16" width="42" height="26" rx="6" stroke="currentColor" strokeWidth="2.2" opacity="0.5" />
    <rect x="14" y="50" width="42" height="26" rx="6" fill="currentColor" opacity="0.16" />
    <rect x="14" y="50" width="42" height="26" rx="6" stroke="currentColor" strokeWidth="2.6" />
    <rect x="64" y="50" width="42" height="26" rx="6" stroke="currentColor" strokeWidth="2.2" opacity="0.5" />
    <path d="m28 63 5 5 11-11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const StepStyle: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <circle cx="34" cy="34" r="14" fill="currentColor" opacity="0.85" />
    <circle cx="58" cy="34" r="14" fill="currentColor" opacity="0.5" />
    <circle cx="82" cy="34" r="14" fill="currentColor" opacity="0.25" />
    <rect x="24" y="58" width="72" height="10" rx="5" stroke="currentColor" strokeWidth="2.2" opacity="0.5" />
    <circle cx="72" cy="63" r="7" fill="currentColor" />
  </svg>
);

export const StepCheck: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="20" y="14" width="54" height="54" rx="8" stroke="currentColor" strokeWidth="2.2" opacity="0.5" />
    <rect x="30" y="24" width="12" height="12" rx="3" fill="currentColor" opacity="0.8" />
    <rect x="52" y="24" width="12" height="12" rx="3" fill="currentColor" opacity="0.55" />
    <rect x="30" y="46" width="12" height="12" rx="3" fill="currentColor" opacity="0.55" />
    <circle cx="86" cy="58" r="17" fill="currentColor" opacity="0.16" />
    <path d="m78 58 6 6 12-13" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const StepDownload: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="22" y="10" width="76" height="50" rx="8" stroke="currentColor" strokeWidth="2.2" opacity="0.5" />
    <path d="M60 20v24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="m51 35 9 9 9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M32 74h56" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <text x="60" y="88" fontSize="0" fill="currentColor">export</text>
  </svg>
);
