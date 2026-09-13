import React from 'react';
import { ConversionProcessArt } from '../../../components/shared/ToolProcessArt';

// ============================================================================
// Ilustraciones propias de PasteSnap, en el índigo/rosa de la herramienta.
// Sustituyen a los iconos de lucide que hacían de arte en las tarjetas.
// ============================================================================

interface ArtProps {
  className?: string;
  /** Permite mostrar el estado final sin movimiento. */
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Héroe: del portapapeles a una imagen lista para descargar.
// ---------------------------------------------------------------------------
export const PasteHeroArt: React.FC<ArtProps> = props => (
  <ConversionProcessArt {...props} clipboard />
);

/** Portapapeles con el cursor: pegar con Ctrl+V. */
export const ClipboardIcon: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 48 48" className={className} role="img" aria-hidden="true">
    <rect x="10" y="8" width="28" height="34" rx="5" fill="none" stroke="#6366f1" strokeWidth="2.2" />
    <rect x="18" y="4" width="12" height="8" rx="3" fill="#818cf8" />
    <rect x="16" y="20" width="16" height="4" rx="2" fill="#4f46e5" />
    <rect x="16" y="28" width="11" height="4" rx="2" fill="#4f46e5" opacity="0.6" />
    <path d="M30 30 L38 38 M38 33 V39 H32" stroke="#f472b6" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Un archivo que se abre en cuatro extensiones. */
export const FormatsIcon: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 48 48" className={className} role="img" aria-hidden="true">
    <path d="M12 6 H28 L36 14 V30" stroke="#6366f1" strokeWidth="2.2" fill="none" strokeLinejoin="round" />
    <path d="M12 6 V34" stroke="#6366f1" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    <path d="M28 6 V14 H36" stroke="#6366f1" strokeWidth="2.2" fill="none" strokeLinejoin="round" />
    {[0, 1, 2].map(i => (
      <rect key={i} x={8 + i * 12} y="34" width="11" height="9" rx="2.5" fill={['#4f46e5', '#a855f7', '#f472b6'][i]} />
    ))}
    <path d="M18 30 L14 34 M24 30 L24 34 M30 30 L34 34" stroke="#312e81" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/** Pila de imágenes con una marca: conversión en lote. */
export const BatchIcon: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 48 48" className={className} role="img" aria-hidden="true">
    <rect x="6" y="12" width="24" height="18" rx="3" fill="none" stroke="#4f46e5" strokeWidth="2" opacity="0.45" />
    <rect x="11" y="17" width="24" height="18" rx="3" fill="none" stroke="#6366f1" strokeWidth="2" opacity="0.7" />
    <rect x="16" y="22" width="24" height="18" rx="3" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2" />
    <circle cx="23" cy="28" r="2.6" fill="#f472b6" />
    <path d="M18 37 L25 30 L30 34 L34 31 L38 37 Z" fill="#818cf8" opacity="0.85" />
  </svg>
);

/** Escudo con un candado: nada sale del equipo. */
export const LocalIcon: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 48 48" className={className} role="img" aria-hidden="true">
    <path
      d="M24 5 L40 11 V23 C40 33 33 40 24 43 C15 40 8 33 8 23 V11 Z"
      fill="none"
      stroke="#6366f1"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <rect x="17" y="23" width="14" height="11" rx="2.5" fill="#818cf8" />
    <path d="M20 23 V19 A4 4 0 0 1 28 19 V23" stroke="#f472b6" strokeWidth="2.2" fill="none" strokeLinecap="round" />
  </svg>
);

// ---------------------------------------------------------------------------
// Arte de los pasos
// ---------------------------------------------------------------------------

/** Paso 1: pegar, soltar o elegir. */
export const StepPasteArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 120 90" className={className} role="img" aria-hidden="true">
    <rect x="12" y="20" width="96" height="58" rx="10" fill="none" stroke="#4f46e5" strokeWidth="2" strokeDasharray="7 5" />
    <g>
      <rect x="42" y="6" width="36" height="28" rx="6" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1.8" />
      <circle cx="53" cy="16" r="3.4" fill="#f472b6" />
      <path d="M46 28 L56 19 L63 25 L70 20 L74 28 Z" fill="#818cf8" />
      {animated && <animateTransform attributeName="transform" type="translate" values="0,-5;0,5;0,-5" dur="3.2s" repeatCount="indefinite" />}
    </g>
    <rect x="34" y="52" width="52" height="6" rx="3" fill="#312e81" />
    <rect x="44" y="64" width="32" height="6" rx="3" fill="#312e81" opacity="0.6" />
  </svg>
);

/** Paso 2: elegir formato y calidad. */
export const StepChooseArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 120 90" className={className} role="img" aria-hidden="true">
    {['PNG', 'JPG', 'WEBP'].map((label, i) => (
      <g key={label}>
        <rect
          x="10"
          y={10 + i * 26}
          width="58"
          height="20"
          rx="6"
          fill={i === 2 ? '#4f46e5' : 'none'}
          fillOpacity={i === 2 ? 0.25 : 0}
          stroke={i === 2 ? '#818cf8' : '#312e81'}
          strokeWidth="1.8"
        />
        <text x="22" y={i * 26 + 24} fill={i === 2 ? '#e5e7eb' : '#6b7280'} fontSize="10" fontWeight="700" fontFamily="system-ui, sans-serif">
          {label}
        </text>
      </g>
    ))}
    {/* Deslizador de calidad */}
    <line x1="80" y1="18" x2="80" y2="72" stroke="#312e81" strokeWidth="3" strokeLinecap="round" />
    <line x1="80" y1="40" x2="80" y2="72" stroke="#818cf8" strokeWidth="3" strokeLinecap="round" />
    <circle cx="80" cy="40" r="6.5" fill="#f472b6">
      {animated && <animate attributeName="cy" values="40;28;40" dur="3.6s" repeatCount="indefinite" />}
    </circle>
    <rect x="94" y="30" width="18" height="24" rx="4" fill="none" stroke="#4f46e5" strokeWidth="1.8" />
    <rect x="98" y="36" width="10" height="3" rx="1.5" fill="#818cf8" />
    <rect x="98" y="42" width="7" height="3" rx="1.5" fill="#818cf8" opacity="0.6" />
  </svg>
);

/** Paso 3: descargar o mandar a otra herramienta. */
export const StepExportArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 120 90" className={className} role="img" aria-hidden="true">
    <rect x="10" y="18" width="46" height="36" rx="7" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1.8" />
    <circle cx="23" cy="30" r="3.4" fill="#f472b6" />
    <path d="M15 48 L26 36 L34 43 L42 35 L51 48 Z" fill="#818cf8" opacity="0.85" />

    <path d="M62 36 H88" stroke="#818cf8" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="4 5">
      {animated && <animate attributeName="stroke-dashoffset" values="18;0" dur="1.6s" repeatCount="indefinite" />}
    </path>
    <path d="M83 30 L91 36 L83 42 Z" fill="#818cf8" />

    <rect x="20" y="62" width="26" height="20" rx="5" fill="none" stroke="#4f46e5" strokeWidth="2" />
    <path d="M33 66 V76 M29 72 L33 76 L37 72" stroke="#a5b4fc" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />

    <rect x="94" y="24" width="18" height="24" rx="4" fill="#4f46e5" fillOpacity="0.2" stroke="#f472b6" strokeWidth="1.8" />
    <rect x="98" y="30" width="10" height="3" rx="1.5" fill="#f472b6" />
    <rect x="98" y="36" width="10" height="3" rx="1.5" fill="#f472b6" opacity="0.6" />
  </svg>
);
