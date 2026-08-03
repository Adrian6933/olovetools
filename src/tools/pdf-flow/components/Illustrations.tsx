import React from 'react';

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
export const PdfHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 400 300" className={className} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="pfPaper" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff7f7" />
        <stop offset="100%" stopColor="#e2d5d6" />
      </linearGradient>
      <linearGradient id="pfPaperDim" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#cdb9bb" />
        <stop offset="100%" stopColor="#a58c8f" />
      </linearGradient>
      <linearGradient id="pfSpine" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#991b1b" />
      </linearGradient>
      <filter id="pfShadow" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000" floodOpacity="0.45" />
      </filter>
    </defs>

    {/* Incoming pages, left and right */}
    <g filter="url(#pfShadow)">
      <g transform="rotate(-14 96 150)">
        <rect x="46" y="86" width="100" height="130" rx="8" fill="url(#pfPaperDim)" />
        <g fill="#8d7376">
          <rect x="60" y="106" width="60" height="6" rx="3" />
          <rect x="60" y="122" width="72" height="5" rx="2.5" />
          <rect x="60" y="134" width="48" height="5" rx="2.5" />
        </g>
        {animated && (
          <animateTransform attributeName="transform" type="translate"
            values="-26 8; 0 0; -26 8" dur="5s" repeatCount="indefinite"
            calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" additive="sum" />
        )}
      </g>

      <g transform="rotate(13 306 150)">
        <rect x="256" y="86" width="100" height="130" rx="8" fill="url(#pfPaperDim)" />
        <g fill="#8d7376">
          <rect x="270" y="106" width="58" height="6" rx="3" />
          <rect x="270" y="122" width="70" height="5" rx="2.5" />
          <rect x="270" y="134" width="44" height="5" rx="2.5" />
        </g>
        {animated && (
          <animateTransform attributeName="transform" type="translate"
            values="26 8; 0 0; 26 8" dur="5s" repeatCount="indefinite"
            calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" additive="sum" />
        )}
      </g>
    </g>

    {/* The finished document */}
    <g filter="url(#pfShadow)">
      <rect x="142" y="62" width="116" height="176" rx="10" fill="url(#pfPaper)" />
      <rect x="142" y="62" width="12" height="176" rx="6" fill="url(#pfSpine)" />
      <g fill="#b9a3a5">
        <rect x="168" y="88" width="70" height="7" rx="3.5" />
        <rect x="168" y="106" width="78" height="5" rx="2.5" />
        <rect x="168" y="118" width="62" height="5" rx="2.5" />
        <rect x="168" y="130" width="74" height="5" rx="2.5" />
      </g>
      <rect x="168" y="150" width="78" height="52" rx="6" fill="#efdcdd" />
      <path d="M172 196 L192 172 L206 188 L218 176 L242 196 Z" fill="#c9a6a8" />
      <circle cx="190" cy="163" r="6" fill="#e8b4b6" />
      {/* PDF badge */}
      <rect x="196" y="210" width="50" height="18" rx="5" fill="#dc2626" />
      <text x="221" y="223" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff" fontFamily="system-ui, sans-serif">PDF</text>
    </g>

    <rect x="10" y="10" width="380" height="280" rx="26" fill="none" stroke="rgba(239,68,68,0.22)" strokeWidth="1.5" />
  </svg>
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
