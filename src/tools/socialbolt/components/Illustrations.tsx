import React from 'react';

// ============================================================================
// Arte propio de SocialBolt, en la paleta índigo de la herramienta.
// Todo SVG inline: ni un archivo raster, ni una petición de red, y escala sin
// perder nitidez. Sustituye a los iconos de lucide reciclados que hacían de
// ilustración (el mismo `Zap` aparecía tres veces en la página).
// ============================================================================

interface ArtProps {
  className?: string;
  /** Desactiva las animaciones SMIL para quien pidió menos movimiento. */
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Héroe: un post vertical del que sale un enlace que se convierte en tres
// descargas (vídeo, audio, imagen). El recorrido del enlace es la animación.
// ---------------------------------------------------------------------------

const CHIPS = [
  { y: 92, label: 'MP4', fill: '#6366f1' },
  { y: 140, label: 'MP3', fill: '#8b5cf6' },
  { y: 188, label: 'JPG', fill: '#0ea5e9' },
];

export const SocialHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 400 300" className={className} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="sbCard" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1e1b4b" />
        <stop offset="100%" stopColor="#0b1020" />
      </linearGradient>
      <linearGradient id="sbShot" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4338ca" />
        <stop offset="60%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#a5b4fc" />
      </linearGradient>
      <linearGradient id="sbWire" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#818cf8" stopOpacity="0.85" />
      </linearGradient>
      <filter id="sbGlow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="6" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* Post vertical de origen */}
    <g>
      <rect x="26" y="46" width="132" height="208" rx="22" fill="url(#sbCard)" stroke="#4f46e5" strokeOpacity="0.35" strokeWidth="1.5" />
      <rect x="38" y="58" width="108" height="150" rx="14" fill="url(#sbShot)" opacity="0.9" />
      {/* Silueta dentro del vídeo */}
      <circle cx="92" cy="108" r="19" fill="#e0e7ff" opacity="0.75" />
      <path d="M58 190 q22-44 34-44 t20 22 q12-18 22-8 v30 z" fill="#c7d2fe" opacity="0.6" />
      {/* Botón de play */}
      <circle cx="92" cy="133" r="21" fill="#050508" opacity="0.55" />
      <path d="M86 124 l16 9 -16 9 z" fill="#fff" opacity="0.95" />
      {/* Barras de "caption" */}
      <rect x="40" y="220" width="76" height="7" rx="3.5" fill="#818cf8" opacity="0.45" />
      <rect x="40" y="234" width="50" height="7" rx="3.5" fill="#818cf8" opacity="0.25" />
    </g>

    {/* Cable: del post a las descargas */}
    <path
      id="sbPath"
      d="M158 150 C 196 150, 200 96, 240 96 M158 150 C 200 150, 206 144, 240 144 M158 150 C 196 150, 200 200, 240 200"
      fill="none"
      stroke="url(#sbWire)"
      strokeWidth="2"
      strokeDasharray="5 6"
      opacity="0.75"
    >
      {animated && <animate attributeName="stroke-dashoffset" values="0;-22" dur="1.4s" repeatCount="indefinite" />}
    </path>

    {/* Paquete que viaja por el cable */}
    {animated && (
      <circle r="4.5" fill="#c7d2fe" filter="url(#sbGlow)">
        <animateMotion dur="2.6s" repeatCount="indefinite" path="M158 150 C 200 150, 206 144, 240 144" />
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.8;1" dur="2.6s" repeatCount="indefinite" />
      </circle>
    )}

    {/* Chips de descarga */}
    {CHIPS.map((chip, i) => (
      <g key={chip.label}>
        <rect x="240" y={chip.y - 18} width="128" height="36" rx="12" fill="#0b0b16" stroke={chip.fill} strokeOpacity="0.4" strokeWidth="1.5">
          {animated && (
            <animate
              attributeName="stroke-opacity"
              values="0.25;0.95;0.25"
              dur="2.6s"
              begin={`${i * 0.35}s`}
              repeatCount="indefinite"
            />
          )}
        </rect>
        <rect x="252" y={chip.y - 9} width="18" height="18" rx="5" fill={chip.fill} opacity="0.85" />
        <path d={`M261 ${chip.y - 5} v7 m-3.5-3.5 l3.5 3.5 l3.5-3.5`} stroke="#0b0b16" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <text x="280" y={chip.y + 4} fontSize="12" fontWeight="800" fill="#c7d2fe" letterSpacing="1">
          {chip.label}
        </text>
        {/* Barra de progreso llena */}
        <rect x="316" y={chip.y - 2} width="40" height="4" rx="2" fill="#1e1b4b" />
        <rect x="316" y={chip.y - 2} width="40" height="4" rx="2" fill={chip.fill} opacity="0.9">
          {animated && (
            <animate attributeName="width" values="0;40;40" keyTimes="0;0.6;1" dur="2.6s" begin={`${i * 0.35}s`} repeatCount="indefinite" />
          )}
        </rect>
      </g>
    ))}
  </svg>
);

// ---------------------------------------------------------------------------
// Iconos de características, dibujados a medida (no son de lucide).
// ---------------------------------------------------------------------------

type IconProps = { className?: string };
const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** Fotograma con la marca de agua tachada. */
export const IconNoWatermark: React.FC<IconProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps}>
    <rect x="2.5" y="4.5" width="19" height="15" rx="3" />
    <path d="M6 16.5l3.4-4 2.3 2.6 2-2.2 2.8 3.6" />
    <circle cx="8.4" cy="8.6" r="1.4" />
    <path d="M14.6 7.2h4.6M14.6 9.8h3" opacity="0.55" />
    <path d="M13.4 10.9l6.8-4.6" strokeWidth="2.1" />
  </svg>
);

/** Pila de calidades: HD encima. */
export const IconQuality: React.FC<IconProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps}>
    <rect x="3" y="3.5" width="18" height="7" rx="2.2" />
    <path d="M6.4 5.8v2.4M9.4 5.8v2.4M6.4 7h3M12 5.8h1.6a1.2 1.2 0 0 1 1.2 1.2v0a1.2 1.2 0 0 1-1.2 1.2H12z" />
    <rect x="5" y="13" width="14" height="3.4" rx="1.6" opacity="0.7" />
    <rect x="7" y="18.4" width="10" height="2.6" rx="1.3" opacity="0.4" />
  </svg>
);

/** Cola por lotes: tres tarjetas y una flecha de proceso. */
export const IconBatch: React.FC<IconProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps}>
    <rect x="2.5" y="5" width="9.5" height="6" rx="2" />
    <rect x="2.5" y="13" width="9.5" height="6" rx="2" opacity="0.6" />
    <path d="M14.5 8h4.2m0 0-2-2m2 2-2 2" />
    <path d="M14.5 16h4.2m0 0-2-2m2 2-2 2" opacity="0.6" />
  </svg>
);

/** Onda de audio saliendo de un fotograma. */
export const IconAudioTrack: React.FC<IconProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps}>
    <rect x="2.5" y="6" width="9" height="12" rx="2.4" />
    <path d="M13.6 12h.1M15.6 9.2v5.6M18 7.2v9.6M20.4 10v4" />
  </svg>
);

/** Escudo con un enlace: nada se guarda del lado del servidor. */
export const IconLinkShield: React.FC<IconProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps}>
    <path d="M12 2.8l7 2.6v5.3c0 4.4-2.9 7.9-7 9.5-4.1-1.6-7-5.1-7-9.5V5.4z" />
    <path d="M10.4 13.6a2.3 2.3 0 0 0 3.3 0l1.4-1.4a2.3 2.3 0 0 0-3.3-3.3l-.5.5" />
    <path d="M13 10.4a2.3 2.3 0 0 0-3.3 0l-1.4 1.4a2.3 2.3 0 0 0 3.3 3.3l.5-.5" opacity="0.6" />
  </svg>
);

/** Encadenado con el resto de la suite. */
export const IconHandoff: React.FC<IconProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps}>
    <rect x="2.5" y="8.5" width="7" height="7" rx="2.2" />
    <rect x="14.5" y="8.5" width="7" height="7" rx="2.2" opacity="0.65" />
    <path d="M9.5 12h5m0 0-2-2m2 2-2 2" />
    <path d="M6 5.4V4M18 20v-1.4" opacity="0.45" />
  </svg>
);

// ---------------------------------------------------------------------------
// Arte de los pasos de "cómo funciona".
// ---------------------------------------------------------------------------

/** 1 — Pegar el enlace. */
export const StepPasteArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 200 120" className={className} role="img" aria-hidden="true">
    <rect x="18" y="42" width="164" height="36" rx="12" fill="#0b0b16" stroke="#4f46e5" strokeOpacity="0.45" strokeWidth="1.6" />
    <path d="M34 60h6M46 60h44M96 60h30" stroke="#818cf8" strokeWidth="4" strokeLinecap="round" opacity="0.55" />
    <rect x="130" y="52" width="2.5" height="16" rx="1.2" fill="#c7d2fe">
      {animated && <animate attributeName="opacity" values="1;0;1" dur="1.1s" repeatCount="indefinite" />}
    </rect>
    <g opacity="0.9">
      <rect x="150" y="24" width="30" height="34" rx="8" fill="#1e1b4b" stroke="#6366f1" strokeOpacity="0.5" />
      <rect x="158" y="20" width="14" height="8" rx="3" fill="#6366f1" />
      {animated && (
        <animateTransform attributeName="transform" type="translate" values="0 -6;0 0;0 0" keyTimes="0;0.3;1" dur="2.4s" repeatCount="indefinite" additive="sum" />
      )}
    </g>
  </svg>
);

/** 2 — Elegir qué te llevas. */
export const StepChooseArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 200 120" className={className} role="img" aria-hidden="true">
    {[0, 1, 2].map(i => (
      <g key={i}>
        <rect x="26" y={20 + i * 30} width="148" height="24" rx="9" fill="#0b0b16" stroke="#4f46e5" strokeOpacity={i === 0 ? 0.7 : 0.28} strokeWidth="1.6" />
        <rect x="38" y={27 + i * 30} width="10" height="10" rx="3" fill={i === 0 ? '#6366f1' : 'none'} stroke="#6366f1" strokeWidth="1.5">
          {animated && i === 1 && <animate attributeName="fill" values="none;#6366f1;#6366f1" keyTimes="0;0.45;1" dur="3s" repeatCount="indefinite" />}
        </rect>
        <rect x="58" y={30 + i * 30} width={i === 0 ? 62 : i === 1 ? 48 : 74} height="5" rx="2.5" fill="#818cf8" opacity="0.5" />
        <rect x="140" y={28 + i * 30} width="24" height="9" rx="4.5" fill="#312e81" />
      </g>
    ))}
  </svg>
);

/** 3 — Descargar o mandarlo a otra herramienta. */
export const StepDownloadArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 200 120" className={className} role="img" aria-hidden="true">
    <path d="M100 22v40" stroke="#818cf8" strokeWidth="5" strokeLinecap="round">
      {animated && <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />}
    </path>
    <path d="M86 50l14 14 14-14" fill="none" stroke="#818cf8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
      {animated && <animateTransform attributeName="transform" type="translate" values="0 -4;0 2;0 -4" dur="2s" repeatCount="indefinite" additive="sum" />}
    </path>
    <path d="M52 76v14a6 6 0 0 0 6 6h84a6 6 0 0 0 6-6V76" fill="none" stroke="#4f46e5" strokeWidth="4" strokeLinecap="round" />
    <rect x="36" y="70" width="18" height="10" rx="4" fill="#312e81" />
    <rect x="146" y="70" width="18" height="10" rx="4" fill="#312e81" />
  </svg>
);

export default SocialHeroArt;
