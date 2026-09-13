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
import { ConversionProcessArt } from '../../../components/shared/ToolProcessArt';


// ----------------------------------------------------------------------------
// Héroe
// ----------------------------------------------------------------------------

/**
 * Una foto se convierte al formato seleccionado, con progreso y resultado.
 */
export const HeroArt: React.FC<{ className?: string }> = props => (
  <ConversionProcessArt {...props} />
);

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
