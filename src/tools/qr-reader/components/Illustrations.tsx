import React from 'react';

// ============================================================================
// Bespoke SVG artwork for the QR Reader, in the tool's cyan palette.
// ============================================================================

interface ArtProps {
  className?: string;
  /** Disables the SMIL animations for users who asked for reduced motion. */
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Hero: a code inside a viewfinder, with the decoded content unfolding beside
// it — the whole promise of the tool in one picture.
// ---------------------------------------------------------------------------
export const ReaderHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="8 -16 384 232" className={className} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="qrdCode" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#67e8f9" />
        <stop offset="100%" stopColor="#0e7490" />
      </linearGradient>
      <linearGradient id="qrdBeam" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
        <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.75" />
        <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
      </linearGradient>
      <clipPath id="qrdView">
        <rect x="24" y="30" width="170" height="170" rx="18" />
      </clipPath>
    </defs>

    {/* Viewfinder */}
    <rect x="24" y="30" width="170" height="170" rx="18" fill="#041016" />
    <g clipPath="url(#qrdView)">
      {/* Code */}
      <g transform="translate(52,58)">
        {[
          [0, 0], [0, 1], [0, 2], [1, 0], [1, 2], [2, 0], [2, 1], [2, 2],
        ].map(([r, c], i) => (
          <rect key={`f1-${i}`} x={c * 12} y={r * 12} width="11" height="11" rx="2.5" fill="url(#qrdCode)" />
        ))}
        {[
          [0, 0], [0, 1], [0, 2], [1, 0], [1, 2], [2, 0], [2, 1], [2, 2],
        ].map(([r, c], i) => (
          <rect key={`f2-${i}`} x={78 + c * 12} y={r * 12} width="11" height="11" rx="2.5" fill="url(#qrdCode)" />
        ))}
        {[
          [0, 0], [0, 1], [0, 2], [1, 0], [1, 2], [2, 0], [2, 1], [2, 2],
        ].map(([r, c], i) => (
          <rect key={`f3-${i}`} x={c * 12} y={78 + r * 12} width="11" height="11" rx="2.5" fill="url(#qrdCode)" />
        ))}
        {[
          [4, 1], [4, 3], [4, 5], [4, 7], [5, 0], [5, 2], [5, 6], [6, 1], [6, 4], [6, 7],
          [7, 0], [7, 3], [7, 5], [8, 4], [8, 6], [8, 7], [1, 4], [2, 5], [3, 4], [0, 5],
        ].map(([r, c], i) => (
          <rect key={`d-${i}`} x={c * 12} y={r * 12} width="11" height="11" rx="2.5" fill="url(#qrdCode)" opacity="0.8" />
        ))}
      </g>

      {animated && (
        <rect x="24" y="0" width="170" height="34" fill="url(#qrdBeam)">
          <animate attributeName="y" values="34;166;34" dur="3.6s" repeatCount="indefinite" />
        </rect>
      )}
    </g>

    {/* Viewfinder corner brackets */}
    {[
      'M32 62V44a12 12 0 0 1 12-12h18',
      'M156 32h18a12 12 0 0 1 12 12v18',
      'M186 168v18a12 12 0 0 1-12 12h-18',
      'M62 198H44a12 12 0 0 1-12-12v-18',
    ].map((d, i) => (
      <path key={i} d={d} fill="none" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round" />
    ))}

    {/* Decoded output card */}
    <g transform="translate(216,44)">
      <rect x="0" y="0" width="160" height="142" rx="14" fill="#05171e" stroke="rgba(34,211,238,0.25)" strokeWidth="1.5" />
      <rect x="16" y="20" width="46" height="8" rx="4" fill="#0e7490" />
      <rect x="16" y="40" width="112" height="7" rx="3.5" fill="#22d3ee" opacity="0.85" />
      <rect x="16" y="56" width="88" height="6" rx="3" fill="#ffffff" opacity="0.16" />
      <rect x="16" y="70" width="104" height="6" rx="3" fill="#ffffff" opacity="0.13" />
      <rect x="16" y="96" width="128" height="30" rx="9" fill="#0891b2" opacity="0.2" stroke="#22d3ee" strokeWidth="1.2" />
      <path d="M32 111h22M48 105l6 6-6 6" stroke="#67e8f9" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="66" y="107" width="60" height="7" rx="3.5" fill="#67e8f9" opacity="0.6" />
    </g>

    {/* Link from viewfinder to card */}
    <path d="M196 115h14" stroke="#22d3ee" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="4 5" opacity="0.6" />
  </svg>
);

// ---------------------------------------------------------------------------
// Empty viewfinder placeholder shown before anything is scanned.
// ---------------------------------------------------------------------------
export const ViewfinderArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 160 160" className={className} role="img" aria-hidden="true">
    {[
      'M14 46V26a12 12 0 0 1 12-12h20',
      'M114 14h20a12 12 0 0 1 12 12v20',
      'M146 114v20a12 12 0 0 1-12 12h-20',
      'M46 146H26a12 12 0 0 1-12-12v-20',
    ].map((d, i) => (
      <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.55" />
    ))}
    <rect x="46" y="46" width="26" height="26" rx="5" fill="currentColor" opacity="0.28" />
    <rect x="88" y="46" width="26" height="26" rx="5" fill="currentColor" opacity="0.22" />
    <rect x="46" y="88" width="26" height="26" rx="5" fill="currentColor" opacity="0.22" />
    <rect x="90" y="92" width="10" height="10" rx="2.5" fill="currentColor" opacity="0.4" />
    <rect x="106" y="106" width="10" height="10" rx="2.5" fill="currentColor" opacity="0.3" />
    {animated && (
      <line x1="24" y1="80" x2="136" y2="80" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.7">
        <animate attributeName="y1" values="34;126;34" dur="3.2s" repeatCount="indefinite" />
        <animate attributeName="y2" values="34;126;34" dur="3.2s" repeatCount="indefinite" />
      </line>
    )}
  </svg>
);

// ---------------------------------------------------------------------------
// Feature icons
// ---------------------------------------------------------------------------
const iconBase = 'w-6 h-6';

/** An eye over a link: you see the destination before you go. */
export const IconInspect: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12.4s3.6-6.4 10-6.4 10 6.4 10 6.4-3.6 6.4-10 6.4-10-6.4-10-6.4Z" />
    <circle cx="12" cy="12.4" r="3.1" />
    <path d="M9.4 12.4h5.2M13 10.8l1.6 1.6L13 14" />
  </svg>
);

/** A camera inside a viewfinder. */
export const IconCamera: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 8V5.6A2.6 2.6 0 0 1 5.6 3H8M16 3h2.4A2.6 2.6 0 0 1 21 5.6V8M21 16v2.4a2.6 2.6 0 0 1-2.6 2.6H16M8 21H5.6A2.6 2.6 0 0 1 3 18.4V16" />
    <circle cx="12" cy="12" r="3.4" />
  </svg>
);

/** Shield with a warning mark: the safety review. */
export const IconSafety: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2.4 4.6 5.4v5.5c0 4.5 3 8.6 7.4 10.1 4.4-1.5 7.4-5.6 7.4-10.1V5.4Z" />
    <path d="M12 8.4v4M12 15.4h.01" />
  </svg>
);

/** Clipboard with an arrow: paste from anywhere. */
export const IconPaste: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 4.4H7A2 2 0 0 0 5 6.4v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-13a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="2.4" width="6" height="4" rx="1.4" />
    <path d="M12 11v6M9.4 14.4 12 17l2.6-2.6" />
  </svg>
);

/** Contact card with lines: the structured payload breakdown. */
export const IconStructured: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2.4" y="4.6" width="19.2" height="14.8" rx="2.4" />
    <path d="M6.4 9h4M6.4 12.4h4M6.4 15.8h2.4" />
    <path d="M14 9h3.6M14 12.4h3.6M14 15.8h1.8" />
  </svg>
);

/** Shield around a module grid: nothing is uploaded. */
export const IconLocalRead: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2.4 4.6 5.4v5.5c0 4.5 3 8.6 7.4 10.1 4.4-1.5 7.4-5.6 7.4-10.1V5.4Z" />
    <rect x="8.2" y="7.8" width="3.2" height="3.2" rx="0.8" />
    <rect x="12.6" y="7.8" width="3.2" height="3.2" rx="0.8" />
    <rect x="8.2" y="12.2" width="3.2" height="3.2" rx="0.8" />
    <path d="M12.6 12.2h1.6v1.6h1.6v1.6" />
  </svg>
);

// ---------------------------------------------------------------------------
// "How it works" step artwork
// ---------------------------------------------------------------------------
export const StepSource: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="10" y="20" width="30" height="42" rx="6" stroke="currentColor" strokeWidth="2.2" opacity="0.55" />
    <circle cx="25" cy="41" r="7" stroke="currentColor" strokeWidth="2.2" opacity="0.7" />
    <rect x="48" y="24" width="30" height="34" rx="5" stroke="currentColor" strokeWidth="2.2" opacity="0.55" />
    <path d="m53 52 8-10 6 7 4-4 6 8Z" fill="currentColor" opacity="0.6" />
    <rect x="86" y="20" width="24" height="30" rx="4" stroke="currentColor" strokeWidth="2.2" opacity="0.55" />
    <rect x="93" y="16" width="10" height="7" rx="2" stroke="currentColor" strokeWidth="2.2" opacity="0.55" />
    <path d="M22 74h76" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.3" />
  </svg>
);

export const StepDecode: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="16" y="16" width="46" height="46" rx="8" stroke="currentColor" strokeWidth="2.2" opacity="0.5" />
    <rect x="26" y="26" width="11" height="11" rx="3" fill="currentColor" opacity="0.8" />
    <rect x="42" y="26" width="11" height="11" rx="3" fill="currentColor" opacity="0.55" />
    <rect x="26" y="42" width="11" height="11" rx="3" fill="currentColor" opacity="0.55" />
    <path d="M70 30h34M70 40h28M70 50h32M70 60h20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
    <path d="M62 39h6M65 35l4 4-4 4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const StepReview: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <path d="M60 10 26 22v20c0 16 13 30 34 36 21-6 34-20 34-36V22Z" stroke="currentColor" strokeWidth="2.4" opacity="0.5" />
    <path d="M60 32v18" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <circle cx="60" cy="60" r="2.8" fill="currentColor" />
  </svg>
);

export const StepAct: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="18" y="20" width="60" height="26" rx="13" stroke="currentColor" strokeWidth="2.4" opacity="0.5" />
    <path d="M34 33h26M54 27l6 6-6 6" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M62 58c0-4 4-7 9-7s9 3 9 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity="0.6" />
    <path d="M50 76c8-9 20-13 33-13" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity="0.4" />
    <circle cx="90" cy="62" r="8" fill="currentColor" opacity="0.2" />
    <path d="m86 62 3 3 6-6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
