import React from 'react';

// ============================================================================
// Bespoke SVG artwork for TTSBolt.
// Inline, self-contained, themed with the tool's amber palette — no raster
// assets, no network requests, and it scales to any size.
// ============================================================================

interface ArtProps {
  className?: string;
  /** Disables the SMIL animations for users who asked for reduced motion. */
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Hero: a page of written text on the left crossing into a spoken waveform on
// the right, with the caption track riding underneath — the three artefacts
// the tool actually produces.
// ---------------------------------------------------------------------------
const HERO_BARS = [14, 30, 52, 78, 46, 96, 64, 112, 40, 84, 58, 100, 34, 70, 22];

export const VoiceHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 400 300" className={`tool-hero-art ${className}`} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="ttsPaper" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1c1207" />
        <stop offset="100%" stopColor="#0b0805" />
      </linearGradient>
      <linearGradient id="ttsWave" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fcd34d" />
        <stop offset="55%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#c2410c" />
      </linearGradient>
      <linearGradient id="ttsBeam" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fde68a" stopOpacity="0" />
        <stop offset="50%" stopColor="#fde68a" stopOpacity="1" />
        <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
      </linearGradient>
      <filter id="ttsGlow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <clipPath id="ttsFrame">
        <rect x="10" y="10" width="380" height="280" rx="26" />
      </clipPath>
    </defs>

    <g clipPath="url(#ttsFrame)">
      <rect x="10" y="10" width="380" height="280" fill="url(#ttsPaper)" />

      {/* Written script */}
      <g opacity="0.9">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <rect
            key={i}
            x="34"
            y={62 + i * 22}
            width={i === 5 ? 62 : 96 - (i % 3) * 14}
            height="8"
            rx="4"
            fill="#3f2d16"
          />
        ))}
        <rect x="34" y="38" width="58" height="10" rx="5" fill="#a16207" opacity="0.75" />
      </g>

      {/* The crossing point: text becomes signal */}
      <path
        d="M142 96 C168 96 168 150 196 150 C168 150 168 204 142 204"
        fill="none"
        stroke="#78350f"
        strokeWidth="2"
        strokeDasharray="4 5"
        opacity="0.85"
      />

      {/* Spoken waveform */}
      <g>
        {HERO_BARS.map((height, i) => (
          <rect key={i} x={202 + i * 12} y={150 - height / 2} width="6" height={height} rx="3" fill="url(#ttsWave)">
            {animated && (
              <>
                <animate
                  attributeName="height"
                  values={`${height};${Math.max(8, height * 0.28)};${height}`}
                  dur="2.6s"
                  begin={`${(i % 5) * 0.16}s`}
                  repeatCount="indefinite"
                  calcMode="spline"
                  keyTimes="0;0.5;1"
                  keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
                />
                <animate
                  attributeName="y"
                  values={`${150 - height / 2};${150 - Math.max(8, height * 0.28) / 2};${150 - height / 2}`}
                  dur="2.6s"
                  begin={`${(i % 5) * 0.16}s`}
                  repeatCount="indefinite"
                  calcMode="spline"
                  keyTimes="0;0.5;1"
                  keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
                />
              </>
            )}
          </rect>
        ))}
      </g>

      {/* Playhead sweeping the waveform */}
      <rect y="70" width="2.5" height="160" fill="url(#ttsBeam)" filter="url(#ttsGlow)" x={animated ? 202 : 268}>
        {animated && <animate attributeName="x" values="200;376;200" dur="7s" repeatCount="indefinite" />}
      </rect>

      {/* Caption track */}
      <g transform="translate(0,242)">
        <rect x="34" y="0" width="332" height="30" rx="10" fill="#150e07" stroke="#78350f" strokeOpacity="0.5" />
        <rect x="46" y="11" width="86" height="8" rx="4" fill="#f59e0b" opacity="0.95" />
        <rect x="140" y="11" width="58" height="8" rx="4" fill="#7c5312" />
        <rect x="206" y="11" width="104" height="8" rx="4" fill="#7c5312" />
        <rect x="318" y="11" width="34" height="8" rx="4" fill="#7c5312" />
        {animated && (
          <rect x="46" y="11" width="86" height="8" rx="4" fill="#fde68a">
            <animate attributeName="x" values="46;140;206;318;46" dur="7s" repeatCount="indefinite" />
            <animate attributeName="width" values="86;58;104;34;86" dur="7s" repeatCount="indefinite" />
          </rect>
        )}
      </g>
    </g>

    <rect x="10" y="10" width="380" height="280" rx="26" fill="none" stroke="rgba(245,158,11,0.25)" strokeWidth="1.5" />
  </svg>
);

// ---------------------------------------------------------------------------
// Feature icons
// ---------------------------------------------------------------------------
const iconBase = 'w-7 h-7';
const strokeProps = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** A neural node fanning out into a waveform: the neural voice catalogue. */
export const IconNeuralVoice: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <circle cx="5.5" cy="12" r="2.2" />
    <path d="M7.7 12h2.1" />
    <path d="M12 7v10M15 9v6M18 6.5v11M21 10v4" />
    <path d="M7.7 10.4 9.9 8M7.7 13.6l2.2 2.4" />
  </svg>
);

/** Caption frame with a timing arrow: word-accurate subtitles. */
export const IconCaptions: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <rect x="2.5" y="5" width="19" height="14" rx="3" />
    <path d="M6.5 11.5h4M6.5 15h7M14.5 11.5h3" />
    <path d="M2.5 8.6h19" strokeOpacity="0.45" />
  </svg>
);

/** Two speech tails on one page: a different voice per paragraph. */
export const IconMultiVoice: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <path d="M3 6.5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H7l-3 2.4V12.5a2 2 0 0 1-1-1.7Z" />
    <path d="M17 9.5h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-1l-2.6 2v-2H14" strokeOpacity="0.75" />
    <path d="M6.5 7.6h5M6.5 10h3" />
  </svg>
);

/** Slider over a waveform: prosody you actually control. */
export const IconProsody: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <path d="M3 16.5h18" strokeOpacity="0.4" />
    <path d="M4.5 12.5v3M8 9.5v6M11.5 6v9.5M15 10.5v5M18.5 8v7.5" />
    <circle cx="11.5" cy="19.5" r="2" />
    <path d="M3 19.5h6.5M13.5 19.5H21" strokeOpacity="0.6" />
  </svg>
);

/** A block re-rendered on its own: only what changed is synthesised again. */
export const IconBlockRender: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <rect x="3" y="3.5" width="18" height="4.5" rx="1.6" strokeOpacity="0.45" />
    <rect x="3" y="9.75" width="18" height="4.5" rx="1.6" />
    <rect x="3" y="16" width="18" height="4.5" rx="1.6" strokeOpacity="0.45" />
    <path d="M15.5 12h3M17 10.5 18.5 12 17 13.5" />
  </svg>
);

/** Plug and a chip: the device engine, running with no connection at all. */
export const IconOffline: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <rect x="7.5" y="7.5" width="9" height="9" rx="2" />
    <path d="M10.5 7.5V5M13.5 7.5V5M10.5 19v-2.5M13.5 19v-2.5M7.5 10.5H5M7.5 13.5H5M19 10.5h-2.5M19 13.5h-2.5" />
    <path d="M10.8 12.6v-1.4M13.2 12.6v-1.4" strokeOpacity="0.7" />
  </svg>
);

// ---------------------------------------------------------------------------
// "How it works" step art
// ---------------------------------------------------------------------------
const stepFrame = (children: React.ReactNode) => (
  <>
    <rect x="1" y="1" width="118" height="70" rx="14" fill="rgba(245,158,11,0.05)" stroke="currentColor" strokeOpacity="0.18" />
    {children}
  </>
);

/** 1 — the script arrives: typed, pasted or dropped in. */
export const StepWriteArt: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 72" className={className} aria-hidden="true">
    {stepFrame(
      <g>
        <rect x="18" y="16" width="52" height="6" rx="3" fill="currentColor" opacity="0.9" />
        <rect x="18" y="28" width="70" height="5" rx="2.5" fill="currentColor" opacity="0.35" />
        <rect x="18" y="38" width="62" height="5" rx="2.5" fill="currentColor" opacity="0.35" />
        <rect x="18" y="48" width="40" height="5" rx="2.5" fill="currentColor" opacity="0.35" />
        <rect x="90" y="26" width="2" height="20" rx="1" fill="currentColor" />
        <path d="M96 52 l10 -10 M96 52 l-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      </g>
    )}
  </svg>
);

/** 2 — a voice is picked out of the catalogue. */
export const StepVoiceArt: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 72" className={className} aria-hidden="true">
    {stepFrame(
      <g>
        {[0, 1, 2].map(i => (
          <g key={i}>
            <rect
              x="16"
              y={13 + i * 17}
              width="88"
              height="14"
              rx="7"
              fill="currentColor"
              opacity={i === 1 ? 0.22 : 0.07}
              stroke="currentColor"
              strokeOpacity={i === 1 ? 0.85 : 0.15}
            />
            <circle cx="26" cy={20 + i * 17} r="4" fill="currentColor" opacity={i === 1 ? 1 : 0.35} />
            <rect x="36" y={17 + i * 17} width={i === 1 ? 40 : 30} height="5" rx="2.5" fill="currentColor" opacity={i === 1 ? 0.8 : 0.28} />
          </g>
        ))}
        <path d="M92 30 l3.5 3.5 L102 27" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    )}
  </svg>
);

/** 3 — the render: blocks turn into audio, one at a time. */
export const StepRenderArt: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 72" className={className} aria-hidden="true">
    {stepFrame(
      <g>
        <rect x="14" y="18" width="26" height="36" rx="6" fill="currentColor" opacity="0.12" stroke="currentColor" strokeOpacity="0.3" />
        <rect x="20" y="25" width="14" height="4" rx="2" fill="currentColor" opacity="0.5" />
        <rect x="20" y="33" width="14" height="4" rx="2" fill="currentColor" opacity="0.5" />
        <rect x="20" y="41" width="9" height="4" rx="2" fill="currentColor" opacity="0.5" />
        <path d="M46 36 h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
        <path d="M54 32 l5 4 -5 4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
        {[10, 22, 34, 26, 16, 30, 20].map((h, i) => (
          <rect key={i} x={66 + i * 6} y={36 - h / 2} width="3.5" height={h} rx="1.75" fill="currentColor" opacity="0.85" />
        ))}
      </g>
    )}
  </svg>
);

/** 4 — what leaves: an MP3, a WAV and a caption file. */
export const StepExportArt: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 72" className={className} aria-hidden="true">
    {stepFrame(
      <g>
        {[0, 1, 2].map(i => (
          <rect
            key={i}
            x={16 + i * 30}
            y="16"
            width="24"
            height="30"
            rx="4"
            fill="currentColor"
            opacity={0.1 + i * 0.05}
            stroke="currentColor"
            strokeOpacity="0.35"
          />
        ))}
        <path d="M24 24h8M24 30h8M24 36h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
        <path d="M54 30v6M58 27v12M62 31v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
        <path d="M84 24h8M84 30h8M84 36h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
        <path d="M60 52v8M56.5 56.5 60 60l3.5-3.5" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    )}
  </svg>
);
