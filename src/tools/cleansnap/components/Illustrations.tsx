// ============================================================================
// Ilustraciones propias
// ----------------------------------------------------------------------------
// SVG escrito a mano en la paleta de la herramienta (violeta #8b5cf6 sobre
// #0a0408). Antes el "héroe" era un icono `Eraser` de lucide a 32 px.
//
// La animación va en un <style> dentro del propio SVG, con su regla de
// prefers-reduced-motion al lado, para que el componente no dependa de que
// alguien añada keyframes al bloque global de index.astro.
// ============================================================================

import React from 'react';

const MOTION_GUARD = '@media (prefers-reduced-motion: reduce) { .cs-anim { animation: none !important; } }';

// ----------------------------------------------------------------------------
// Héroe
// ----------------------------------------------------------------------------

/**
 * Una foto con una marca de agua encima, la selección pintada por encima de
 * ella y el resultado reconstruido: los parches viajan desde la parte sana
 * hacia el hueco, que es exactamente lo que hace el algoritmo.
 */
export const HeroArt: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 420 300" className={className} role="img" aria-hidden="true" fill="none">
    <style>{`
      ${MOTION_GUARD}
      @keyframes cs-travel { 0% { opacity: 0; transform: translate(0,0); } 15% { opacity: 1; } 85% { opacity: 1; } 100% { opacity: 0; transform: translate(84px, -26px); } }
      @keyframes cs-fade { 0%, 45% { opacity: .85; } 70%, 100% { opacity: 0; } }
      @keyframes cs-pulse { 0%, 100% { opacity: .35; } 50% { opacity: .6; } }
      .cs-p1 { animation: cs-travel 3.6s ease-in-out infinite; }
      .cs-p2 { animation: cs-travel 3.6s ease-in-out infinite 1.2s; }
      .cs-p3 { animation: cs-travel 3.6s ease-in-out infinite 2.4s; }
      .cs-mark { animation: cs-fade 3.6s ease-in-out infinite; }
      .cs-sel { animation: cs-pulse 3.6s ease-in-out infinite; }
    `}</style>
    <defs>
      <linearGradient id="csSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#6d28d9" />
        <stop offset="100%" stopColor="#c026d3" />
      </linearGradient>
      <radialGradient id="csGlow" cx="50%" cy="50%">
        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.32" />
        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
      </radialGradient>
      <clipPath id="csFrame"><rect x="40" y="52" width="340" height="200" rx="14" /></clipPath>
    </defs>

    <ellipse cx="210" cy="150" rx="205" ry="140" fill="url(#csGlow)" />

    <rect x="40" y="52" width="340" height="200" rx="14" fill="#150a1f" stroke="#3b2a52" strokeWidth="1.5" />
    <g clipPath="url(#csFrame)">
      <rect x="40" y="52" width="340" height="200" fill="url(#csSky)" opacity="0.3" />
      {/* Estructura con textura: es lo que la difusión no sabía reconstruir */}
      {Array.from({ length: 15 }).map((_, i) => (
        <rect key={i} x={40 + i * 23} y="52" width="11" height="200" fill="#0f0818" opacity={i % 2 ? 0.5 : 0.22} />
      ))}
      <path d="M40 196 L118 148 L176 182 L238 136 L302 178 L380 140 L380 252 L40 252 Z" fill="#0b0512" opacity="0.92" />
      <circle cx="118" cy="98" r="17" fill="#fbbf24" opacity="0.75" />

      {/* La marca de agua que se va */}
      <g className="cs-mark cs-anim">
        <rect x="228" y="86" width="112" height="38" rx="6" fill="#000" opacity="0.35" />
        <text x="284" y="111" textAnchor="middle" fontSize="19" fontWeight="800" fill="#ffffff" fontFamily="sans-serif" opacity="0.85">STOCK</text>
      </g>
      {/* La selección pintada encima */}
      <rect className="cs-sel cs-anim" x="224" y="82" width="120" height="46" rx="8" fill="#8b5cf6" />

      {/* Parches que viajan desde la zona sana hacia el hueco */}
      <rect className="cs-p1 cs-anim" x="140" y="118" width="20" height="20" rx="3" fill="#a78bfa" opacity="0" />
      <rect className="cs-p2 cs-anim" x="160" y="104" width="20" height="20" rx="3" fill="#c4b5fd" opacity="0" />
      <rect className="cs-p3 cs-anim" x="150" y="132" width="20" height="20" rx="3" fill="#8b5cf6" opacity="0" />
    </g>

    <rect x="40" y="52" width="340" height="200" rx="14" fill="none" stroke="#5b21b6" strokeWidth="1.5" opacity="0.6" />

    {/* Pincel */}
    <g transform="translate(196 232) rotate(-28)">
      <rect x="-6" y="-2" width="12" height="44" rx="3" fill="#3b2a52" stroke="#8b5cf6" strokeWidth="1.5" />
      <path d="M-6 -2 L6 -2 L3 -14 L-3 -14 Z" fill="#8b5cf6" />
    </g>
  </svg>
);

// ----------------------------------------------------------------------------
// Iconos de features
// ----------------------------------------------------------------------------

const iconBase = 'w-7 h-7';

/** Parches copiándose hacia el hueco. */
export const IconPatch: React.FC = () => (
  <svg viewBox="0 0 32 32" className={iconBase} fill="none" aria-hidden="true">
    <rect x="3" y="4" width="26" height="24" rx="3" stroke="currentColor" strokeWidth="1.7" opacity="0.45" />
    <rect x="17" y="9" width="9" height="9" rx="2" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.6" strokeDasharray="3 2" />
    <rect x="6" y="15" width="8" height="8" rx="2" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.6" />
    <path d="M14.5 17.5 L17.5 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M16.4 13.4 L18 13 L17.6 14.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Una línea que sigue recta al cruzar el hueco. */
export const IconStructure: React.FC = () => (
  <svg viewBox="0 0 32 32" className={iconBase} fill="none" aria-hidden="true">
    <path d="M2 22 L11 11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M21 11 L30 22" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M11 11 L21 11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="3 3" opacity="0.75" />
    <rect x="10" y="4" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.5 2.5" opacity="0.5" />
  </svg>
);

/** Un worker con su barra de avance. */
export const IconWorker: React.FC = () => (
  <svg viewBox="0 0 32 32" className={iconBase} fill="none" aria-hidden="true">
    <rect x="3" y="5" width="26" height="15" rx="3" stroke="currentColor" strokeWidth="1.7" />
    <rect x="6" y="9" width="9" height="3" rx="1.5" fill="currentColor" opacity="0.7" />
    <rect x="6" y="14" width="16" height="3" rx="1.5" fill="currentColor" opacity="0.35" />
    <rect x="3" y="24" width="26" height="4" rx="2" fill="currentColor" opacity="0.2" />
    <rect x="3" y="24" width="15" height="4" rx="2" fill="currentColor" />
  </svg>
);

/** Máscara editable: un contorno con tiradores. */
export const IconMask: React.FC = () => (
  <svg viewBox="0 0 32 32" className={iconBase} fill="none" aria-hidden="true">
    <path d="M8 20c-3-5 0-12 6-13s11 3 11 8-4 10-9 10-6-2-8-5z" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3.5 3" />
    <circle cx="14" cy="7" r="2.2" fill="currentColor" />
    <circle cx="25" cy="15" r="2.2" fill="currentColor" />
    <circle cx="16" cy="25" r="2.2" fill="currentColor" />
    <circle cx="8" cy="20" r="2.2" fill="currentColor" />
  </svg>
);

/** Nada sale del dispositivo. */
export const IconLocal: React.FC = () => (
  <svg viewBox="0 0 32 32" className={iconBase} fill="none" aria-hidden="true">
    <path d="M16 3l11 4v9c0 7-4.8 11.2-11 13-6.2-1.8-11-6-11-13V7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <rect x="11" y="13" width="10" height="8" rx="2" fill="currentColor" fillOpacity="0.28" />
    <path d="M13 13v-2a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/** Deshacer con historial ligero. */
export const IconHistory: React.FC = () => (
  <svg viewBox="0 0 32 32" className={iconBase} fill="none" aria-hidden="true">
    <path d="M6 16a10 10 0 1 0 3-7.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M5 4v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="13" y="13" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.6" />
  </svg>
);

// ----------------------------------------------------------------------------
// Arte de los pasos
// ----------------------------------------------------------------------------

const stepFrame = 'w-full h-auto';

/** Paso 1: la imagen entra y espera. */
export const StepDrop: React.FC = () => (
  <svg viewBox="0 0 200 120" className={stepFrame} fill="none" aria-hidden="true">
    <rect x="14" y="16" width="172" height="88" rx="12" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="8 7" opacity="0.55" />
    <rect x="52" y="38" width="96" height="60" rx="6" fill="#150a1f" stroke="#5b21b6" strokeWidth="1.6" />
    <path d="M52 84 L78 62 L98 76 L120 58 L148 80 L148 98 L52 98 Z" fill="#0b0512" />
    <circle cx="76" cy="54" r="7" fill="#fbbf24" opacity="0.8" />
    <rect x="104" y="44" width="36" height="13" rx="3" fill="#000" opacity="0.45" />
    <text x="122" y="54" textAnchor="middle" fontSize="8" fontWeight="800" fill="#fff" opacity="0.8" fontFamily="sans-serif">MARCA</text>
    <path d="M100 20v10M95 26l5 5 5-5" stroke="#a78bfa" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Paso 2: se pinta encima. */
export const StepPaint: React.FC = () => (
  <svg viewBox="0 0 200 120" className={stepFrame} fill="none" aria-hidden="true">
    <rect x="30" y="20" width="140" height="80" rx="8" fill="#150a1f" stroke="#3b2a52" strokeWidth="1.6" />
    <path d="M30 82 L62 56 L86 72 L114 50 L146 76 L170 60 L170 100 L30 100 Z" fill="#0b0512" />
    <rect x="96" y="34" width="52" height="20" rx="5" fill="#8b5cf6" opacity="0.5" />
    <rect x="96" y="34" width="52" height="20" rx="5" stroke="#c4b5fd" strokeWidth="1.5" strokeDasharray="3 2" />
    <g transform="translate(92 62) rotate(-30)">
      <rect x="-4" y="-2" width="8" height="30" rx="2.5" fill="#3b2a52" stroke="#8b5cf6" strokeWidth="1.4" />
      <path d="M-4 -2 L4 -2 L2 -10 L-2 -10 Z" fill="#8b5cf6" />
    </g>
  </svg>
);

/** Paso 3: reconstruido, con el tiempo que costó. */
export const StepFill: React.FC = () => (
  <svg viewBox="0 0 200 120" className={stepFrame} fill="none" aria-hidden="true">
    <rect x="30" y="20" width="140" height="80" rx="8" fill="#150a1f" stroke="#22c55e" strokeWidth="1.8" />
    <path d="M30 82 L62 56 L86 72 L114 50 L146 76 L170 60 L170 100 L30 100 Z" fill="#0b0512" />
    {Array.from({ length: 6 }).map((_, i) => (
      <rect key={i} x={96 + i * 9} y="34" width="4" height="20" fill="#6d28d9" opacity={0.28 + (i % 3) * 0.16} />
    ))}
    <path d="M138 40 l4 4 8-8" stroke="#4ade80" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <text x="100" y="114" textAnchor="middle" fontSize="9" fontWeight="800" fill="#4ade80" fontFamily="monospace">640 ms</text>
  </svg>
);

export const STEP_ART = [StepDrop, StepPaint, StepFill];
