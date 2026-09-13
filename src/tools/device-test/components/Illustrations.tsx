// ============================================================================
// Ilustraciones propias
// ----------------------------------------------------------------------------
// SVG a mano en la paleta cian de la herramienta. Antes no había ninguna: el
// encabezado era un icono `Monitor` de lucide.
//
// La animación va dentro del propio SVG, con su regla de prefers-reduced-motion
// al lado, para que el componente sea autónomo.
// ============================================================================

import React from 'react';

const MOTION_GUARD = '@media (prefers-reduced-motion: reduce) { .dt-anim { animation: none !important; } }';

// ----------------------------------------------------------------------------
// Héroe
// ----------------------------------------------------------------------------

/** Un portátil con la webcam mirando, el medidor moviéndose y la ficha del sistema. */
export const HeroArt: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 420 300" className={`tool-hero-art ${className}`} role="img" aria-hidden="true" fill="none">
    <style>{`
      ${MOTION_GUARD}
      @keyframes dt-bar { 0%,100% { transform: scaleY(.25); } 50% { transform: scaleY(1); } }
      @keyframes dt-ring { 0% { r: 8; opacity: .8; } 100% { r: 26; opacity: 0; } }
      @keyframes dt-blink { 0%, 60%, 100% { opacity: 1; } 80% { opacity: .25; } }
      .dt-b { transform-origin: bottom; animation: dt-bar 1.4s ease-in-out infinite; }
      .dt-ring { animation: dt-ring 2.4s ease-out infinite; }
      .dt-led { animation: dt-blink 2.4s ease-in-out infinite; }
    `}</style>
    <defs>
      <linearGradient id="dtScreen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0e7490" />
        <stop offset="100%" stopColor="#155e75" />
      </linearGradient>
      <radialGradient id="dtGlow" cx="50%" cy="50%">
        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
      </radialGradient>
    </defs>

    <ellipse cx="210" cy="150" rx="200" ry="135" fill="url(#dtGlow)" />

    {/* Portátil */}
    <rect x="66" y="46" width="288" height="182" rx="12" fill="#04222c" stroke="#0e7490" strokeWidth="2" />
    <rect x="80" y="60" width="260" height="154" rx="6" fill="url(#dtScreen)" opacity="0.35" />
    <path d="M40 236 h340 l-14 16 H54 z" fill="#04222c" stroke="#0e7490" strokeWidth="1.8" strokeLinejoin="round" />

    {/* Webcam con su piloto */}
    <circle cx="210" cy="53" r="3.4" fill="#0f172a" stroke="#22d3ee" strokeWidth="1.2" />
    <circle className="dt-led dt-anim" cx="221" cy="53" r="1.8" fill="#22d3ee" />
    <circle className="dt-ring dt-anim" cx="210" cy="53" r="8" fill="none" stroke="#22d3ee" strokeWidth="1.4" />

    {/* Vista de cámara dentro de la pantalla */}
    <rect x="94" y="76" width="112" height="82" rx="6" fill="#062a35" stroke="#0891b2" strokeWidth="1.4" />
    <circle cx="150" cy="106" r="15" fill="#0e7490" opacity="0.8" />
    <path d="M126 152 c6-16 18-24 24-24 s18 8 24 24 z" fill="#0e7490" opacity="0.8" />

    {/* Medidor */}
    <rect x="216" y="76" width="112" height="82" rx="6" fill="#062a35" stroke="#0891b2" strokeWidth="1.4" />
    {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
      <rect
        key={i}
        className="dt-b dt-anim"
        x={226 + i * 12.5}
        y={98}
        width="8"
        height="48"
        rx="2"
        fill={i > 5 ? '#f59e0b' : '#22d3ee'}
        style={{ animationDelay: `${i * 0.11}s` }}
      />
    ))}

    {/* Ficha del sistema */}
    <rect x="94" y="168" width="234" height="34" rx="6" fill="#062a35" stroke="#0891b2" strokeWidth="1.2" />
    {[0, 1, 2, 3].map(i => (
      <g key={i}>
        <rect x={104 + i * 58} y="176" width="26" height="4" rx="2" fill="#0891b2" opacity="0.5" />
        <rect x={104 + i * 58} y="186" width="40" height="6" rx="3" fill="#22d3ee" opacity="0.7" />
      </g>
    ))}
  </svg>
);

// ----------------------------------------------------------------------------
// Iconos de features
// ----------------------------------------------------------------------------

const iconBase = 'w-7 h-7';

/** Sondeo de resoluciones: se pide grande, sale lo que sale. */
export const IconProbe: React.FC = () => (
  <svg viewBox="0 0 32 32" className={iconBase} fill="none" aria-hidden="true">
    <rect x="2" y="5" width="28" height="18" rx="3" stroke="currentColor" strokeWidth="1.7" strokeDasharray="3.5 2.5" opacity="0.55" />
    <rect x="7" y="10" width="18" height="11" rx="2" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="1.8" />
    <path d="M11 27h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M25.5 8.5l3-3M28.5 5.5h-3M28.5 5.5v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

/** Medidor en dBFS con su marca de pico. */
export const IconMeter: React.FC = () => (
  <svg viewBox="0 0 32 32" className={iconBase} fill="none" aria-hidden="true">
    <rect x="2" y="12" width="28" height="8" rx="3" stroke="currentColor" strokeWidth="1.7" />
    <rect x="4" y="14" width="15" height="4" rx="2" fill="currentColor" />
    <rect x="23" y="11" width="2" height="10" rx="1" fill="currentColor" />
    <path d="M4 25h4M12 25h4M20 25h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
    <path d="M4 7h2M11 7h2M18 7h2M25 7h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
  </svg>
);

/** Altavoces izquierdo y derecho. */
export const IconSpeakers: React.FC = () => (
  <svg viewBox="0 0 32 32" className={iconBase} fill="none" aria-hidden="true">
    <path d="M4 12v8h4l5 4V8l-5 4z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="M18 12c1.6 1.2 1.6 6.8 0 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M22 8.5c3.5 2.6 3.5 12.4 0 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
    <path d="M26 5.5c5 4 5 17 0 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.35" />
  </svg>
);

/** Pantalla: rejilla de píxeles con uno muerto. */
export const IconScreen: React.FC = () => (
  <svg viewBox="0 0 32 32" className={iconBase} fill="none" aria-hidden="true">
    <rect x="3" y="5" width="26" height="19" rx="3" stroke="currentColor" strokeWidth="1.7" />
    <path d="M12 28h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {[0, 1, 2, 3].map(row => [0, 1, 2, 3, 4].map(col => (
      <rect key={`${row}-${col}`} x={7 + col * 4} y={9 + row * 3.6} width="2.4" height="2.4" rx="0.5"
        fill="currentColor" opacity={row === 1 && col === 3 ? 0 : 0.35} />
    )))}
    <rect x="19" y="12.6" width="2.4" height="2.4" rx="0.5" stroke="currentColor" strokeWidth="1" />
  </svg>
);

/** Teclado con una tecla encendida. */
export const IconKeyboard: React.FC = () => (
  <svg viewBox="0 0 32 32" className={iconBase} fill="none" aria-hidden="true">
    <rect x="2" y="8" width="28" height="16" rx="3" stroke="currentColor" strokeWidth="1.7" />
    {[0, 1, 2, 3, 4, 5].map(i => <rect key={i} x={5 + i * 4} y="11" width="2.6" height="2.6" rx="0.6" fill="currentColor" opacity="0.4" />)}
    {[0, 1, 2, 3, 4].map(i => <rect key={i} x={7 + i * 4} y="15" width="2.6" height="2.6" rx="0.6" fill="currentColor" opacity={i === 2 ? 1 : 0.4} />)}
    <rect x="10" y="19" width="12" height="2.6" rx="1.3" fill="currentColor" opacity="0.4" />
  </svg>
);

/** Privacidad: nada sale del aparato. */
export const IconLocal: React.FC = () => (
  <svg viewBox="0 0 32 32" className={iconBase} fill="none" aria-hidden="true">
    <path d="M16 3l11 4v9c0 7-4.8 11.2-11 13-6.2-1.8-11-6-11-13V7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <rect x="11" y="13" width="10" height="8" rx="2" fill="currentColor" fillOpacity="0.28" />
    <path d="M13 13v-2a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// ----------------------------------------------------------------------------
// Arte de los pasos
// ----------------------------------------------------------------------------

const stepFrame = 'w-full h-auto';

/** Paso 1: elegir la prueba. Nada arranca solo. */
export const StepPick: React.FC = () => (
  <svg viewBox="0 0 200 120" className={stepFrame} fill="none" aria-hidden="true">
    {[0, 1, 2].map(i => (
      <rect key={i} x={20 + i * 56} y="34" width="44" height="52" rx="8"
        fill="#062a35" stroke={i === 1 ? '#22d3ee' : '#0e7490'} strokeWidth={i === 1 ? 2 : 1.4} />
    ))}
    <circle cx="42" cy="52" r="8" stroke="#0e7490" strokeWidth="1.6" />
    <rect x="70" y="60" width="4" height="14" rx="2" fill="#22d3ee" />
    <rect x="78" y="54" width="4" height="20" rx="2" fill="#22d3ee" />
    <rect x="86" y="58" width="4" height="16" rx="2" fill="#22d3ee" />
    <rect x="140" y="46" width="24" height="18" rx="3" stroke="#0e7490" strokeWidth="1.6" />
    <path d="M100 96l6 6 10-12" stroke="#22d3ee" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Paso 2: conceder permiso, sólo para la prueba elegida. */
export const StepPermission: React.FC = () => (
  <svg viewBox="0 0 200 120" className={stepFrame} fill="none" aria-hidden="true">
    <rect x="34" y="22" width="132" height="62" rx="10" fill="#062a35" stroke="#0891b2" strokeWidth="1.6" />
    <circle cx="56" cy="44" r="7" stroke="#22d3ee" strokeWidth="1.8" />
    <path d="M53 44l2.5 2.5L59 42" stroke="#22d3ee" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="70" y="40" width="80" height="5" rx="2.5" fill="#0e7490" opacity="0.7" />
    <rect x="70" y="50" width="54" height="5" rx="2.5" fill="#0e7490" opacity="0.4" />
    <rect x="106" y="64" width="46" height="14" rx="7" fill="#22d3ee" />
    <rect x="52" y="64" width="46" height="14" rx="7" stroke="#0e7490" strokeWidth="1.4" />
    <path d="M100 92v10" stroke="#0e7490" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" />
  </svg>
);

/** Paso 3: los números medidos. */
export const StepRead: React.FC = () => (
  <svg viewBox="0 0 200 120" className={stepFrame} fill="none" aria-hidden="true">
    <rect x="24" y="24" width="152" height="72" rx="9" fill="#062a35" stroke="#0891b2" strokeWidth="1.6" />
    <rect x="38" y="38" width="124" height="9" rx="4.5" fill="#0f172a" />
    <rect x="38" y="38" width="76" height="9" rx="4.5" fill="#22d3ee" />
    <rect x="122" y="36" width="2.5" height="13" rx="1.2" fill="#ffffff" />
    <text x="38" y="66" fontSize="10" fontWeight="800" fill="#67e8f9" fontFamily="monospace">-12.4 dBFS</text>
    <text x="38" y="82" fontSize="9" fontWeight="700" fill="#0e7490" fontFamily="monospace">1920×1080 · 30 fps</text>
    <path d="M150 74l4 4 8-9" stroke="#4ade80" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const STEP_ART = [StepPick, StepPermission, StepRead];
