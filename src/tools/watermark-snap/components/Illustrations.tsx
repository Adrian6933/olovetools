import React from 'react';

// ============================================================================
// Ilustraciones propias de WatermarkSnap.
// Todo es SVG inline con la paleta ámbar de la herramienta: sin imágenes
// rasterizadas, sin peticiones de red y escalable a cualquier tamaño.
// ============================================================================

interface ArtProps {
  className?: string;
  /** Desactiva las animaciones SMIL para quien pidió movimiento reducido. */
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Héroe: una foto sobre la que barre una rejilla diagonal de marcas de agua.
// La mitad ya protegida avanza y retrocede: es literalmente lo que hace la
// herramienta.
// ---------------------------------------------------------------------------
export const WatermarkHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 400 300" className={`tool-hero-art ${className}`} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="wmSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#451a03" />
        <stop offset="55%" stopColor="#b45309" />
        <stop offset="100%" stopColor="#fcd34d" />
      </linearGradient>
      <linearGradient id="wmRidge" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7c2d12" />
        <stop offset="100%" stopColor="#1c0a02" />
      </linearGradient>
      <linearGradient id="wmBeam" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fbbf24" stopOpacity="0" />
        <stop offset="45%" stopColor="#fde68a" stopOpacity="1" />
        <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
      </linearGradient>

      {/* La celda del mosaico, girada -30°, igual que el patrón real */}
      <pattern id="wmMark" width="92" height="58" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
        <text x="4" y="20" fontSize="15" fontWeight="800" fill="#fffbeb" opacity="0.62" fontFamily="'Outfit', sans-serif">
          © BRAND
        </text>
        <text x="50" y="49" fontSize="15" fontWeight="800" fill="#fffbeb" opacity="0.62" fontFamily="'Outfit', sans-serif">
          © BRAND
        </text>
      </pattern>

      <clipPath id="wmFrame">
        <rect x="10" y="10" width="380" height="280" rx="26" />
      </clipPath>

      {/* Un único rect animado gobierna a la vez la zona protegida y el haz */}
      <clipPath id="wmSweep">
        <rect y="0" width="400" height="300" x={animated ? 150 : 196}>
          {animated && (
            <animate
              attributeName="x"
              values="330;60;330"
              dur="8s"
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes="0;0.5;1"
              keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
            />
          )}
        </rect>
      </clipPath>

      <filter id="wmGlow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="5" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <g clipPath="url(#wmFrame)">
      {/* La foto */}
      <rect x="10" y="10" width="380" height="280" fill="url(#wmSky)" />
      <circle cx="300" cy="70" r="24" fill="#fef3c7" opacity="0.9" />
      <path d="M10 208 L96 146 L176 204 L242 160 L326 222 L390 184 L390 290 L10 290 Z" fill="url(#wmRidge)" />
      <path d="M10 244 L86 204 L166 248 L260 206 L390 256 L390 290 L10 290 Z" fill="#160702" opacity="0.92" />
      <path d="M52 262 L74 224 L96 262 Z" fill="#f59e0b" opacity="0.35" />

      {/* Zona ya protegida */}
      <g clipPath="url(#wmSweep)">
        <rect x="10" y="10" width="380" height="280" fill="url(#wmMark)" />
      </g>

      {/* Haz de aplicación */}
      <g clipPath="url(#wmSweep)">
        <rect y="0" width="3" height="300" x="0" fill="url(#wmBeam)" filter="url(#wmGlow)" />
      </g>
    </g>

    <rect x="10" y="10" width="380" height="280" rx="26" fill="none" stroke="rgba(245,158,11,0.28)" strokeWidth="1.5" />
  </svg>
);

// ---------------------------------------------------------------------------
// Iconos de features
// ---------------------------------------------------------------------------
const iconBase = 'w-7 h-7';
const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** Pila de capas con una marcada: el modelo de capas no destructivo. */
export const IconLayers: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <path d="M12 2.8 21 7.4l-9 4.6-9-4.6Z" />
    <path d="m3.4 12 8.6 4.4L20.6 12" />
    <path d="m3.4 16.6 8.6 4.4 8.6-4.4" />
  </svg>
);

/** Rejilla girada: el mosaico diagonal en una sola pasada. */
export const IconTile: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <g transform="rotate(-28 12 12)">
      <path d="M1 6.5h22M1 12h22M1 17.5h22" opacity="0.8" />
      <path d="M6.5 1v22M12 1v22M17.5 1v22" opacity="0.35" />
    </g>
  </svg>
);

/** Candado sobre una foto: nada sale del navegador. */
export const IconLocal: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <rect x="2.5" y="4.5" width="19" height="15" rx="2.6" />
    <path d="m4 16 4.4-4.6 3.2 3.3 2.6-2.6L20 17.6" />
    <rect x="13.5" y="3" width="7.5" height="6" rx="1.6" fill="currentColor" stroke="none" opacity="0.15" />
    <path d="M15.6 6.2V4.8a1.7 1.7 0 0 1 3.4 0v1.4" />
    <rect x="14.6" y="6.2" width="5.4" height="4.2" rx="1.1" />
  </svg>
);

/** Cursor sobre una caja con tiradores: el arrastre a mano. */
export const IconPlace: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <rect x="3" y="4.5" width="13" height="9" rx="1.6" strokeDasharray="3 2.5" />
    <circle cx="3" cy="4.5" r="1.2" />
    <circle cx="16" cy="4.5" r="1.2" />
    <circle cx="3" cy="13.5" r="1.2" />
    <path d="m12.6 12.4 8.2 3.2-3.4 1.3-1.3 3.4Z" fill="currentColor" stroke="none" />
    <path d="m12.6 12.4 8.2 3.2-3.4 1.3-1.3 3.4Z" />
  </svg>
);

/** Cola de imágenes con una flecha de salida: el lote. */
export const IconBatch: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <rect x="6.5" y="3.2" width="14" height="11" rx="2" />
    <path d="M15.5 18.5H4.8a2 2 0 0 1-2-2V7.2" />
    <path d="m10 11 2.5-3 2 2.4 1.6-1.9 2.6 3.4Z" />
    <path d="M17.5 17.5h4M20 15.4l2.1 2.1-2.1 2.1" />
  </svg>
);

/** Dos paneles con flecha: el resultado pasa a otra herramienta. */
export const IconHandoff: React.FC<{ className?: string }> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" className={className} {...strokeProps} aria-hidden="true">
    <rect x="2.5" y="6" width="7.5" height="12" rx="1.8" />
    <rect x="14" y="6" width="7.5" height="12" rx="1.8" />
    <path d="M10.8 12h2.4M12.2 10.4 13.8 12l-1.6 1.6" />
  </svg>
);

// ---------------------------------------------------------------------------
// Arte de los pasos de "cómo funciona"
// ---------------------------------------------------------------------------
export const StepDrop: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="8" y="12" width="104" height="66" rx="12" stroke="currentColor" strokeWidth="2" strokeDasharray="7 6" opacity="0.55" />
    <path d="M60 58V32" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
    <path d="m50 42 10-10 10 10" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M40 64h40" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" opacity="0.4" />
  </svg>
);

export const StepDesign: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="14" y="14" width="52" height="62" rx="9" stroke="currentColor" strokeWidth="2" opacity="0.45" />
    <path d="M24 28h32M24 38h24M24 48h32M24 58h18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.75" />
    <rect x="74" y="22" width="34" height="46" rx="8" stroke="currentColor" strokeWidth="2" opacity="0.45" />
    <text x="91" y="52" textAnchor="middle" fontSize="20" fontWeight="800" fill="currentColor" fontFamily="'Outfit', sans-serif">A</text>
  </svg>
);

export const StepPlace: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="12" y="14" width="96" height="62" rx="10" stroke="currentColor" strokeWidth="2" opacity="0.45" />
    <rect x="54" y="42" width="42" height="20" rx="4" stroke="currentColor" strokeWidth="2.4" strokeDasharray="4 3" />
    <circle cx="54" cy="42" r="2.6" fill="currentColor" />
    <circle cx="96" cy="42" r="2.6" fill="currentColor" />
    <circle cx="54" cy="62" r="2.6" fill="currentColor" />
    <path d="m84 58 18 7-7.5 2.8L91.7 75Z" fill="currentColor" />
    <path d="M24 26h18M24 34h12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
  </svg>
);

export const StepExport: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
    <rect x="20" y="12" width="80" height="50" rx="9" stroke="currentColor" strokeWidth="2" opacity="0.5" />
    <path d="M60 20v24" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
    <path d="m50 34 10 10 10-10" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M30 74h60" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
    <path d="M84 66h14M91 59v14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity="0.55" />
  </svg>
);

/** Miniaturas de los cuatro presets, dibujadas a escala. */
export const PresetThumb: React.FC<{ preset: 'corner' | 'tiled' | 'banner' | 'stamp'; className?: string }> = ({
  preset,
  className = '',
}) => (
  <svg viewBox="0 0 60 40" className={className} aria-hidden="true">
    <rect x="0.75" y="0.75" width="58.5" height="38.5" rx="4" fill="currentColor" opacity="0.08" />
    <rect x="0.75" y="0.75" width="58.5" height="38.5" rx="4" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
    {preset === 'corner' && <rect x="34" y="29" width="20" height="4" rx="2" fill="currentColor" opacity="0.9" />}
    {preset === 'tiled' && (
      <g opacity="0.7" transform="rotate(-28 30 20)">
        {[6, 16, 26, 36].map(y =>
          [-6, 12, 30, 48].map(x => <rect key={`${x}-${y}`} x={x} y={y} width="13" height="2.6" rx="1.3" fill="currentColor" />)
        )}
      </g>
    )}
    {preset === 'banner' && (
      <>
        <rect x="9" y="27" width="42" height="8" rx="4" fill="currentColor" opacity="0.35" />
        <rect x="17" y="30" width="26" height="2.6" rx="1.3" fill="currentColor" opacity="0.95" />
      </>
    )}
    {preset === 'stamp' && (
      <g transform="rotate(-22 30 20)">
        <rect x="14" y="18" width="32" height="5" rx="2.5" fill="currentColor" opacity="0.85" />
      </g>
    )}
  </svg>
);
