import React from 'react';
import { RecordingProcessArt } from '../../../components/shared/MoreToolProcessArt';

// ============================================================================
// Bespoke SVG artwork for RecordSnap.
// Inline, self-contained and tuned to the tool's amber palette — no raster
// assets, no network requests, and it scales to any size.
// ============================================================================

interface ArtProps {
  className?: string;
  /** Disables the SMIL animations for users who asked for reduced motion. */
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Hero: screen and webcam capture, centered audio levels and a finished file.
// ---------------------------------------------------------------------------
export const RecorderHeroArt: React.FC<ArtProps> = props => (
  <RecordingProcessArt {...props} />
);

// ---------------------------------------------------------------------------
// Placeholder shown in the preview box when the shared surface cannot be
// mirrored back safely (whole-monitor capture).
// ---------------------------------------------------------------------------
export const SharingArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 200 130" className={className} role="img" aria-hidden="true">
    <rect x="12" y="10" width="176" height="94" rx="12" fill="none" stroke="currentColor" strokeWidth="2.4" opacity="0.45" />
    <rect x="28" y="26" width="86" height="62" rx="7" fill="currentColor" opacity="0.1" />
    <rect x="38" y="38" width="52" height="5" rx="2.5" fill="currentColor" opacity="0.5" />
    <rect x="38" y="50" width="66" height="4" rx="2" fill="currentColor" opacity="0.28" />
    <rect x="38" y="60" width="58" height="4" rx="2" fill="currentColor" opacity="0.22" />
    <circle cx="150" cy="57" r="22" fill="none" stroke="currentColor" strokeWidth="2.4" opacity="0.5" />
    <circle cx="150" cy="50" r="7" fill="currentColor" opacity="0.65" />
    <path d="M137 74c0-8 6-12 13-12s13 4 13 12Z" fill="currentColor" opacity="0.65" />
    <path d="M76 118h48" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
    <circle cx="100" cy="118" r="0" fill="currentColor" opacity="0.9">
      {animated && <animate attributeName="r" values="0;5;0" dur="2.2s" repeatCount="indefinite" />}
    </circle>
  </svg>
);

// ---------------------------------------------------------------------------
// Feature icons
// ---------------------------------------------------------------------------
const iconBase = 'w-6 h-6';

/** Shield around a monitor: the capture never leaves the machine. */
export const IconLocalCapture: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2.5 4.5 5.6v5.4c0 4.5 3.1 8.6 7.5 10.1 4.4-1.5 7.5-5.6 7.5-10.1V5.6Z" />
    <rect x="8" y="8.5" width="8" height="5.6" rx="1.1" />
    <path d="M10.5 17h3M12 14.1V17" />
  </svg>
);

/** Screen with a bubble in the corner: the webcam overlay. */
export const IconOverlay: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2.5" y="4" width="19" height="13" rx="2" />
    <path d="M8.5 20.5h7M12 17v3.5" />
    <circle cx="17" cy="12.5" r="3.2" fill="currentColor" fillOpacity="0.18" />
    <circle cx="17" cy="11.4" r="1.1" />
    <path d="M14.9 14.9c.4-1.2 1.2-1.8 2.1-1.8s1.7.6 2.1 1.8" />
  </svg>
);

/** Sliders over a signal bar: the bitrate you actually chose. */
export const IconBitrate: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 20V13M9.3 20V8.5M14.7 20v-8M20 20V4.5" />
    <circle cx="9.3" cy="8.5" r="1.9" fill="currentColor" fillOpacity="0.2" />
    <circle cx="20" cy="4.5" r="1.9" fill="currentColor" fillOpacity="0.2" />
  </svg>
);

/** Infinity inside a clock: no time limit. */
export const IconNoLimit: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9.2" />
    <path d="M8.4 13.6c-1 0-1.8-.8-1.8-1.6s.8-1.6 1.8-1.6c1.6 0 2.2 3.2 3.6 3.2s1.8-.8 1.8-1.6-.8-1.6-1.8-1.6" />
    <path d="M15.6 10.4c1 0 1.8.8 1.8 1.6s-.8 1.6-1.8 1.6" />
  </svg>
);

/** Two panes with an arrow: hand the file to the next tool. */
export const IconHandoff: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2.5" y="6" width="7.5" height="12" rx="1.8" />
    <rect x="14" y="6" width="7.5" height="12" rx="1.8" />
    <path d="M10.8 12h2.4M12.2 10.4 13.8 12l-1.6 1.6" />
  </svg>
);

/** Mic with a sliding fader: pick the device, mute it live. */
export const IconAudioMix: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="8.6" y="2.6" width="5.4" height="10.4" rx="2.7" />
    <path d="M5.4 11.2a5.9 5.9 0 0 0 11.8 0M11.3 17.1v3.6M8.4 20.7h5.8" />
    <path d="M18.6 4.5v6M21.4 7.5h-5.6" />
  </svg>
);

// ---------------------------------------------------------------------------
// "How it works" step artwork
// ---------------------------------------------------------------------------
export const StepChoose: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="10" y="16" width="46" height="34" rx="6" stroke="currentColor" strokeWidth="2.4" opacity="0.5" />
    <path d="M26 56h14M33 50v6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.5" />
    <circle cx="88" cy="30" r="15" stroke="currentColor" strokeWidth="2.4" opacity="0.5" />
    <circle cx="88" cy="26" r="4.6" fill="currentColor" opacity="0.8" />
    <path d="M79 40c0-5.4 4-8.4 9-8.4s9 3 9 8.4Z" fill="currentColor" opacity="0.8" />
    <path d="M22 70h76" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.28" />
    <circle cx="40" cy="70" r="4.4" fill="currentColor" />
  </svg>
);

export const StepArm: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="16" y="14" width="88" height="52" rx="8" stroke="currentColor" strokeWidth="2.4" opacity="0.5" />
    <path d="M46 30v20l20-10Z" fill="currentColor" opacity="0.75" />
    <path d="M46 76h28" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity="0.35" />
    <circle cx="96" cy="24" r="6" fill="currentColor" opacity="0.35" />
    <circle cx="96" cy="24" r="2.6" fill="currentColor" />
  </svg>
);

export const StepRecord: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <circle cx="60" cy="45" r="30" stroke="currentColor" strokeWidth="2.4" opacity="0.35" />
    <circle cx="60" cy="45" r="21" stroke="currentColor" strokeWidth="2.4" opacity="0.55" strokeDasharray="5 6" />
    <circle cx="60" cy="45" r="12" fill="currentColor" />
    <path d="M96 20v10M101 25h-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.6" />
  </svg>
);

export const StepSave: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="20" y="10" width="80" height="50" rx="8" stroke="currentColor" strokeWidth="2.4" opacity="0.5" />
    <path d="M60 20v22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="m51 33 9 9 9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M32 74h56" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M92 66h12M98 60v12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.6" />
  </svg>
);
