// ============================================================================
// Ilustraciones propias de EntropyBolt
// ----------------------------------------------------------------------------
// SVG a medida en la paleta esmeralda que ya usa la herramienta (#020a08 de
// fondo, emerald-400 #34d399 como acento). Nada de iconos genéricos reciclados
// haciendo de ilustración.
//
// Toda animación va dentro de un bloque @media (prefers-reduced-motion: no-
// preference), de modo que por defecto en un sistema con movimiento reducido no
// se mueve nada: es la única forma de que el SVG inline respete el ajuste sin
// depender de JavaScript.
// ============================================================================
import React from 'react';

interface ArtProps {
  className?: string;
}

const INK = '#34d399';
const DIM = '#0f766e';

/**
 * Héroe: una llave que se convierte en una tira de caracteres aleatorios.
 * Los caracteres van cambiando de opacidad en cascada, insinuando el sorteo.
 */
export const HeroArt: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 420 260" role="img" aria-hidden="true" className={`tool-hero-art ${className}`}>
    <defs>
      <linearGradient id="pb-hero-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#34d399" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.5" />
      </linearGradient>
      <radialGradient id="pb-hero-glow" cx="50%" cy="50%">
        <stop offset="0%" stopColor="#34d399" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
      </radialGradient>
    </defs>

    <style>{`
      .pb-cell { opacity: 0.28; }
      .pb-scan { opacity: 0; }
      @media (prefers-reduced-motion: no-preference) {
        .pb-cell { animation: pb-flick 4s ease-in-out infinite; }
        .pb-cell:nth-of-type(2n) { animation-delay: .5s; }
        .pb-cell:nth-of-type(3n) { animation-delay: 1.1s; }
        .pb-cell:nth-of-type(5n) { animation-delay: 1.9s; }
        .pb-scan { animation: pb-sweep 6s ease-in-out infinite; }
        @keyframes pb-flick {
          0%, 70%, 100% { opacity: .28; }
          35% { opacity: 1; }
        }
        @keyframes pb-sweep {
          0%, 100% { opacity: 0; transform: translateX(0); }
          40% { opacity: .55; }
          60% { opacity: .55; }
          100% { transform: translateX(150px); }
        }
      }
    `}</style>

    <circle cx="120" cy="130" r="105" fill="url(#pb-hero-glow)" />

    {/* Anilla y paletón de la llave */}
    <circle cx="96" cy="130" r="42" fill="none" stroke="url(#pb-hero-g)" strokeWidth="9" />
    <circle cx="96" cy="130" r="17" fill="none" stroke={DIM} strokeWidth="7" />
    <path d="M138 130 H236" stroke="url(#pb-hero-g)" strokeWidth="9" strokeLinecap="round" />
    <path d="M198 130 V158" stroke="url(#pb-hero-g)" strokeWidth="9" strokeLinecap="round" />
    <path d="M224 130 V166" stroke="url(#pb-hero-g)" strokeWidth="9" strokeLinecap="round" />

    {/* La llave se deshace en celdas de caracteres */}
    {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
      <rect
        key={i}
        className="pb-cell"
        x={252 + (i % 4) * 40}
        y={i < 4 ? 92 : 140}
        width="30"
        height="30"
        rx="7"
        fill={INK}
      />
    ))}
    {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
      <text
        key={`t${i}`}
        x={267 + (i % 4) * 40}
        y={i < 4 ? 113 : 161}
        textAnchor="middle"
        fontSize="15"
        fontFamily="ui-monospace, monospace"
        fontWeight="700"
        fill="#022c22"
      >
        {['k', '7', '@', 'Q', '#', 'z', '4', 'W'][i]}
      </text>
    ))}

    <rect className="pb-scan" x="248" y="86" width="4" height="90" rx="2" fill="#a7f3d0" />
  </svg>
);

// --- iconos de características --------------------------------------------
// Trazo de 1.8 y caja de 24, para que casen entre sí a cualquier tamaño.

const Icon: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
    {children}
  </svg>
);

/** Dado: el sorteo viene de una fuente criptográfica, no de Math.random. */
export const IconDice: React.FC<ArtProps> = ({ className }) => (
  <Icon className={className}>
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <circle cx="8.5" cy="8.5" r="1.3" fill={INK} stroke="none" />
    <circle cx="15.5" cy="8.5" r="1.3" fill={INK} stroke="none" />
    <circle cx="12" cy="12" r="1.3" fill={INK} stroke="none" />
    <circle cx="8.5" cy="15.5" r="1.3" fill={INK} stroke="none" />
    <circle cx="15.5" cy="15.5" r="1.3" fill={INK} stroke="none" />
  </Icon>
);

/** Regla graduada: la entropía es una medida exacta, no una etiqueta. */
export const IconGauge: React.FC<ArtProps> = ({ className }) => (
  <Icon className={className}>
    <path d="M3 17h18" />
    <path d="M6 17v-4" />
    <path d="M10 17v-7" />
    <path d="M14 17v-10" />
    <path d="M18 17v-6" />
    <circle cx="14" cy="7" r="1.6" fill={INK} stroke="none" />
  </Icon>
);

/** Palabras encadenadas: el modo frase. */
export const IconPhrase: React.FC<ArtProps> = ({ className }) => (
  <Icon className={className}>
    <rect x="2" y="9" width="6" height="6" rx="2" />
    <rect x="16" y="9" width="6" height="6" rx="2" />
    <path d="M8 12h3" />
    <path d="M13 12h3" />
    <circle cx="12" cy="12" r="1.1" fill={INK} stroke="none" />
  </Icon>
);

/** Lupa sobre un patrón: el analizador de contraseñas escritas a mano. */
export const IconInspect: React.FC<ArtProps> = ({ className }) => (
  <Icon className={className}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.5 15.5L21 21" />
    <path d="M7.5 11.5l2 2 3.5-4" />
  </Icon>
);

/** Pila de contraseñas: la generación en lote. */
export const IconStack: React.FC<ArtProps> = ({ className }) => (
  <Icon className={className}>
    <rect x="3" y="4" width="18" height="4" rx="1.6" />
    <rect x="3" y="10" width="18" height="4" rx="1.6" />
    <rect x="3" y="16" width="18" height="4" rx="1.6" />
  </Icon>
);

/** Navegador con candado y sin cable: nada sale del dispositivo. */
export const IconOffline: React.FC<ArtProps> = ({ className }) => (
  <Icon className={className}>
    <rect x="2.5" y="4" width="19" height="14" rx="2.5" />
    <path d="M2.5 8h19" />
    <path d="M10 15v-2.2a2 2 0 014 0V15" />
    <rect x="9" y="15" width="6" height="4" rx="1.2" fill={INK} stroke="none" opacity="0.85" />
  </Icon>
);

// --- arte de los pasos -----------------------------------------------------
// Cuadros de 64×64 para la sección "cómo funciona".

const Step: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className="w-12 h-12">
    {children}
  </svg>
);

/** 1 · Elegir el tipo: caracteres o palabras. */
export const StepChoose: React.FC = () => (
  <Step>
    <rect x="6" y="16" width="22" height="32" rx="6" fill={INK} opacity="0.18" />
    <rect x="6" y="16" width="22" height="32" rx="6" stroke={INK} strokeWidth="2" />
    <text x="17" y="38" textAnchor="middle" fontSize="14" fontFamily="ui-monospace, monospace" fontWeight="700" fill={INK}>
      #
    </text>
    <rect x="36" y="16" width="22" height="32" rx="6" stroke={DIM} strokeWidth="2" />
    <path d="M42 30h10M42 36h6" stroke={DIM} strokeWidth="2.4" strokeLinecap="round" />
  </Step>
);

/** 2 · Ajustar longitud y alfabeto. */
export const StepTune: React.FC = () => (
  <Step>
    <path d="M10 24h44M10 40h44" stroke={DIM} strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="24" cy="24" r="7" fill="#020a08" stroke={INK} strokeWidth="2.6" />
    <circle cx="42" cy="40" r="7" fill="#020a08" stroke={INK} strokeWidth="2.6" />
  </Step>
);

/** 3 · Leer los bits reales. */
export const StepMeasure: React.FC = () => (
  <Step>
    <rect x="8" y="36" width="9" height="16" rx="2.5" fill={INK} opacity="0.35" />
    <rect x="21" y="28" width="9" height="24" rx="2.5" fill={INK} opacity="0.55" />
    <rect x="34" y="19" width="9" height="33" rx="2.5" fill={INK} opacity="0.78" />
    <rect x="47" y="12" width="9" height="40" rx="2.5" fill={INK} />
  </Step>
);

/** 4 · Copiar y guardarla en un gestor. */
export const StepStore: React.FC = () => (
  <Step>
    <rect x="12" y="20" width="26" height="32" rx="5" stroke={DIM} strokeWidth="2.4" />
    <rect x="24" y="12" width="26" height="32" rx="5" fill="#020a08" stroke={INK} strokeWidth="2.6" />
    <path d="M31 28l4.5 4.5L44 24" stroke={INK} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </Step>
);
