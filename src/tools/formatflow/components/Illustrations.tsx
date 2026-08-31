// ============================================================================
// Ilustraciones propias
// ----------------------------------------------------------------------------
// Todo lo de aquí es SVG escrito a mano con la paleta de la herramienta
// (índigo #6366f1, púrpura #a855f7, rosa #ec4899 sobre #080c14). Antes las
// "ilustraciones" eran iconos de lucide a 64px, que es lo mismo que no tener
// ninguna.
//
// La animación vive en un <style> dentro del propio SVG, con su regla de
// prefers-reduced-motion al lado: así el componente es autónomo y no depende de
// que alguien acuerde meter keyframes en el bloque global de index.astro.
// ============================================================================

import React from 'react';

const MOTION_GUARD = `@media (prefers-reduced-motion: reduce) { .ff-anim { animation: none !important; } }`;

// ----------------------------------------------------------------------------
// Héroe
// ----------------------------------------------------------------------------

/**
 * Una foto que pasa por el embudo y sale en tres formatos. El fotograma de
 * origen late despacio y las etiquetas de salida se encienden por turnos: es
 * literalmente lo que hace la herramienta, y se entiende sin leer nada.
 */
export const HeroArt: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 420 320" className={className} role="img" aria-hidden="true" fill="none">
    <style>{`
      ${MOTION_GUARD}
      @keyframes ff-drift { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
      @keyframes ff-flow { to { stroke-dashoffset: -28; } }
      @keyframes ff-badge { 0%,100% { opacity: .35; } 50% { opacity: 1; } }
      .ff-source { animation: ff-drift 7s ease-in-out infinite; transform-origin: center; }
      .ff-wire { stroke-dasharray: 6 8; animation: ff-flow 1.8s linear infinite; }
      .ff-out-1 { animation: ff-badge 4.5s ease-in-out infinite; }
      .ff-out-2 { animation: ff-badge 4.5s ease-in-out infinite 1.5s; }
      .ff-out-3 { animation: ff-badge 4.5s ease-in-out infinite 3s; }
    `}</style>
    <defs>
      <linearGradient id="ffPhoto" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="55%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
      <linearGradient id="ffGlass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
      </linearGradient>
      <radialGradient id="ffGlow" cx="50%" cy="50%">
        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
      </radialGradient>
      <clipPath id="ffClip"><rect x="24" y="86" width="130" height="98" rx="12" /></clipPath>
    </defs>

    <ellipse cx="210" cy="170" rx="200" ry="140" fill="url(#ffGlow)" />

    {/* Origen: una foto con su horizonte y su sol */}
    <g className="ff-source ff-anim">
      <rect x="24" y="86" width="130" height="98" rx="12" fill="#0f1626" stroke="#334155" strokeWidth="1.5" />
      <g clipPath="url(#ffClip)">
        <rect x="24" y="86" width="130" height="98" fill="url(#ffPhoto)" opacity="0.28" />
        <circle cx="62" cy="118" r="13" fill="#fbbf24" opacity="0.85" />
        <path d="M24 168 L62 132 L92 158 L118 138 L154 170 L154 184 L24 184 Z" fill="#1e293b" />
        <path d="M24 176 L70 148 L110 172 L154 150 L154 184 L24 184 Z" fill="#0f172a" opacity="0.9" />
      </g>
      <rect x="32" y="160" width="34" height="15" rx="4" fill="#020617" opacity="0.75" />
      <text x="49" y="171" textAnchor="middle" fontSize="9" fontWeight="800" fill="#94a3b8" fontFamily="monospace">HEIC</text>
    </g>

    {/* Embudo */}
    <path d="M172 108 L246 108 L214 148 L214 190 L204 196 L204 148 Z" fill="url(#ffGlass)" stroke="#6366f1" strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="209" cy="126" r="3.5" fill="#a855f7" />

    <path className="ff-wire ff-anim" d="M154 135 L176 128" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
    <path className="ff-wire ff-anim" d="M214 196 L214 214" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" />

    {/* Salidas */}
    {[
      { cls: 'ff-out-1', y: 74, label: 'WEBP', color: '#6366f1' },
      { cls: 'ff-out-2', y: 132, label: 'AVIF', color: '#a855f7' },
      { cls: 'ff-out-3', y: 190, label: 'PNG', color: '#ec4899' },
    ].map(out => (
      <g key={out.label} className={`${out.cls} ff-anim`}>
        <rect x="286" y={out.y} width="104" height="46" rx="10" fill="#0f1626" stroke={out.color} strokeWidth="1.5" />
        <rect x="298" y={out.y + 13} width="20" height="20" rx="4" fill={out.color} opacity="0.25" />
        <path d={`M303 ${out.y + 28} l5 -6 4 5 3 -3 3 4 z`} fill={out.color} />
        <text x="330" y={out.y + 28} fontSize="13" fontWeight="800" fill="#e2e8f0" fontFamily="monospace">{out.label}</text>
      </g>
    ))}

    <path d="M246 122 C266 118 268 100 286 97" stroke="#6366f1" strokeWidth="1.5" opacity="0.45" />
    <path d="M246 130 C266 132 268 150 286 155" stroke="#a855f7" strokeWidth="1.5" opacity="0.45" />
    <path d="M246 138 C270 146 270 204 286 213" stroke="#ec4899" strokeWidth="1.5" opacity="0.45" />
  </svg>
);

// ----------------------------------------------------------------------------
// Iconos de las features
// ----------------------------------------------------------------------------

const iconBase = 'w-7 h-7';

/** Núcleos trabajando en paralelo. */
export const IconCores: React.FC = () => (
  <svg viewBox="0 0 32 32" className={iconBase} fill="none" aria-hidden="true">
    {[0, 1, 2, 3].map(i => (
      <rect key={i} x={4 + (i % 2) * 13} y={4 + Math.floor(i / 2) * 13} width="11" height="11" rx="3"
        fill="currentColor" opacity={0.2 + i * 0.2} />
    ))}
    <path d="M9.5 9.5h1M22.5 9.5h1M9.5 22.5h1M22.5 22.5h1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

/** Sondeo: dos ticks y una cruz, que es lo que devuelve la prueba. */
export const IconProbe: React.FC = () => (
  <svg viewBox="0 0 32 32" className={iconBase} fill="none" aria-hidden="true">
    <rect x="3" y="5" width="26" height="22" rx="4" stroke="currentColor" strokeWidth="1.8" opacity="0.5" />
    <path d="M7 11.5l2.2 2.2L13 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 20.5l2.2 2.2L13 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 10l6 6M23 10l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.45" />
    <path d="M17 20.5h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.45" />
  </svg>
);

/** Medida de calidad: una aguja sobre un arco. */
export const IconQuality: React.FC = () => (
  <svg viewBox="0 0 32 32" className={iconBase} fill="none" aria-hidden="true">
    <path d="M4 23a12 12 0 0 1 24 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
    <path d="M4 23a12 12 0 0 1 8.4-11.45" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M16 23l7-7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="16" cy="23" r="2.6" fill="currentColor" />
  </svg>
);

/** Peso objetivo: una balanza con la pesa puesta. */
export const IconBudget: React.FC = () => (
  <svg viewBox="0 0 32 32" className={iconBase} fill="none" aria-hidden="true">
    <path d="M16 6v20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M7 11h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M11 26h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M7 11l-4 8a4 4 0 0 0 8 0z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" opacity="0.55" />
    <path d="M25 11l4 8a4 4 0 0 1-8 0z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" opacity="0.55" />
    <circle cx="16" cy="8" r="2.4" fill="currentColor" />
  </svg>
);

/** Privacidad: el archivo dentro del escudo, sin flecha de subida. */
export const IconLocal: React.FC = () => (
  <svg viewBox="0 0 32 32" className={iconBase} fill="none" aria-hidden="true">
    <path d="M16 3l11 4v9c0 7-4.8 11.2-11 13-6.2-1.8-11-6-11-13V7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <rect x="11" y="12" width="10" height="9" rx="2" fill="currentColor" opacity="0.28" />
    <path d="M13 12v-2a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/** Lote: hojas apiladas con la de arriba ya convertida. */
export const IconBatch: React.FC = () => (
  <svg viewBox="0 0 32 32" className={iconBase} fill="none" aria-hidden="true">
    <rect x="4" y="9" width="17" height="19" rx="3" stroke="currentColor" strokeWidth="1.7" opacity="0.3" />
    <rect x="8" y="6" width="17" height="19" rx="3" stroke="currentColor" strokeWidth="1.7" opacity="0.55" />
    <rect x="12" y="3" width="17" height="19" rx="3" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.8" />
    <path d="M16.5 12.5l2.5 2.5 5.5-5.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ----------------------------------------------------------------------------
// Arte de los pasos
// ----------------------------------------------------------------------------

const stepFrame = 'w-full h-auto';

/** Paso 1: los archivos entran y esperan. El reloj es el mensaje. */
export const StepDrop: React.FC = () => (
  <svg viewBox="0 0 200 120" className={stepFrame} fill="none" aria-hidden="true">
    <rect x="14" y="18" width="172" height="84" rx="14" stroke="#6366f1" strokeWidth="2" strokeDasharray="8 7" opacity="0.6" />
    <rect x="46" y="42" width="38" height="46" rx="6" fill="#0f1626" stroke="#475569" strokeWidth="1.5" />
    <rect x="80" y="36" width="38" height="52" rx="6" fill="#0f1626" stroke="#6366f1" strokeWidth="1.7" />
    <rect x="114" y="42" width="38" height="46" rx="6" fill="#0f1626" stroke="#475569" strokeWidth="1.5" />
    <path d="M99 20v12M94 27l5 5 5-5" stroke="#a855f7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="99" cy="62" r="11" stroke="#a855f7" strokeWidth="2" />
    <path d="M99 56v6.5l4 2.5" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Paso 2: los mandos. Deslizadores y una caja de dimensiones. */
export const StepTune: React.FC = () => (
  <svg viewBox="0 0 200 120" className={stepFrame} fill="none" aria-hidden="true">
    <rect x="20" y="16" width="160" height="88" rx="12" fill="#0f1626" stroke="#334155" strokeWidth="1.5" />
    {[36, 56, 76].map((y, i) => (
      <g key={y}>
        <rect x="36" y={y} width="128" height="5" rx="2.5" fill="#1e293b" />
        <rect x="36" y={y} width={[92, 48, 116][i]} height="5" rx="2.5" fill={['#6366f1', '#a855f7', '#ec4899'][i]} />
        <circle cx={36 + [92, 48, 116][i]} cy={y + 2.5} r="6.5" fill="#e2e8f0" />
      </g>
    ))}
    <rect x="36" y="90" width="52" height="6" rx="3" fill="#1e293b" />
    <rect x="112" y="90" width="52" height="6" rx="3" fill="#1e293b" />
  </svg>
);

/** Paso 3: el botón, y la comparación de peso a su lado. */
export const StepConvert: React.FC = () => (
  <svg viewBox="0 0 200 120" className={stepFrame} fill="none" aria-hidden="true">
    <rect x="22" y="30" width="66" height="60" rx="9" fill="#0f1626" stroke="#475569" strokeWidth="1.5" />
    <text x="55" y="66" textAnchor="middle" fontSize="15" fontWeight="800" fill="#64748b" fontFamily="monospace">4.2MB</text>
    <path d="M96 60h16M106 54l6 6-6 6" stroke="#a855f7" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="120" y="30" width="58" height="60" rx="9" fill="#0f1626" stroke="#22c55e" strokeWidth="1.8" />
    <text x="149" y="62" textAnchor="middle" fontSize="15" fontWeight="800" fill="#4ade80" fontFamily="monospace">380KB</text>
    <text x="149" y="78" textAnchor="middle" fontSize="9" fontWeight="700" fill="#22c55e" fontFamily="monospace">SSIM .991</text>
  </svg>
);

export const STEP_ART = [StepDrop, StepTune, StepConvert];
