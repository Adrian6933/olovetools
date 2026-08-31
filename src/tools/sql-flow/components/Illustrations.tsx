import React from 'react';

// ============================================================================
// SVG propios de SQLFlow, en la paleta ámbar de la herramienta.
// ----------------------------------------------------------------------------
// Todo va en línea: ni imágenes, ni peticiones de red, ni un emoji haciendo de
// ilustración. Cada pieza acepta `animated={false}` para respetar
// `prefers-reduced-motion` sin cambiar el dibujo.
// ============================================================================

interface ArtProps {
  className?: string;
  animated?: boolean;
}

const AMBER = '#f59e0b';
const AMBER_SOFT = '#fbbf24';
const AMBER_DEEP = '#b45309';

// ---------------------------------------------------------------------------
// Héroe: una consulta apelmazada en una sola línea que, al pasar el haz, cae
// ordenada en cláusulas indentadas al otro lado.
// ---------------------------------------------------------------------------
export const SqlHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 400 300" className={className} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="sfGlow" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#451a03" />
        <stop offset="55%" stopColor={AMBER} />
        <stop offset="100%" stopColor="#fde68a" />
      </linearGradient>
      <linearGradient id="sfBeam" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={AMBER_SOFT} stopOpacity="0" />
        <stop offset="50%" stopColor={AMBER_SOFT} stopOpacity="0.6" />
        <stop offset="100%" stopColor={AMBER_SOFT} stopOpacity="0" />
      </linearGradient>
      <clipPath id="sfFrame">
        <rect x="8" y="12" width="384" height="232" rx="18" />
      </clipPath>
      <clipPath id="sfLeft">
        <rect x="20" y="26" width="150" height="204" rx="12" />
      </clipPath>
      <clipPath id="sfRight">
        <rect x="230" y="26" width="150" height="204" rx="12" />
      </clipPath>
    </defs>

    <g clipPath="url(#sfFrame)">
      <rect x="8" y="12" width="384" height="232" fill="#0f0a02" />
      <circle cx="325" cy="44" r="92" fill="url(#sfGlow)" opacity="0.15" />

      {/* Izquierda: el volcado plano, todo del mismo color y sin sangría */}
      <rect x="20" y="26" width="150" height="204" rx="12" fill="#0a0701" stroke="#ffffff" strokeOpacity="0.07" />
      <g clipPath="url(#sfLeft)" opacity="0.7">
        {[128, 132, 126, 130, 124, 129].map((w, i) => (
          <rect key={i} x="32" y={44 + i * 13} width={w} height="5" rx="2.5" fill="#78716c" />
        ))}
        <rect x="32" y="126" width="96" height="5" rx="2.5" fill="#78716c" />
      </g>

      {/* Cilindro de datos, el motivo que ata la escena */}
      <g transform="translate(200 150)">
        <ellipse cx="0" cy="-26" rx="22" ry="8" fill={AMBER} opacity="0.9" />
        <path d="M-22 -26 v26 a22 8 0 0 0 44 0 v-26" fill={AMBER_DEEP} opacity="0.75" />
        <ellipse cx="0" cy="0" rx="22" ry="8" fill={AMBER} opacity="0.55" />
        {animated && (
          <animateTransform
            attributeName="transform"
            type="translate"
            values="200 150; 200 145; 200 150"
            dur="4s"
            repeatCount="indefinite"
          />
        )}
      </g>

      {/* Derecha: las mismas líneas, ya con jerarquía y color por token */}
      <rect x="230" y="26" width="150" height="204" rx="12" fill="#0a0701" stroke={AMBER} strokeOpacity="0.22" />
      <g clipPath="url(#sfRight)">
        {[
          [242, 40, AMBER],
          [254, 54, '#fef3c7'],
          [254, 46, '#6ee7b7'],
          [242, 32, AMBER],
          [254, 62, '#fef3c7'],
          [242, 38, AMBER],
          [254, 58, '#7dd3fc'],
          [254, 44, '#fef3c7'],
          [242, 30, AMBER],
          [254, 50, '#fef3c7'],
        ].map(([x, w, fill], i) => (
          <rect
            key={i}
            x={x as number}
            y={44 + i * 17}
            width={w as number}
            height="5.5"
            rx="2.75"
            fill={fill as string}
            opacity="0.92"
          >
            {animated && (
              <animate
                attributeName="opacity"
                values="0.25;0.95;0.92"
                dur="3.2s"
                begin={`${i * 0.12}s`}
                repeatCount="indefinite"
              />
            )}
          </rect>
        ))}
      </g>

      {/* El haz que cruza de un panel al otro */}
      {animated && (
        <rect x="20" y="26" width="26" height="204" fill="url(#sfBeam)">
          <animate attributeName="x" values="20;354;20" dur="6s" repeatCount="indefinite" />
        </rect>
      )}

      <rect
        x="8"
        y="12"
        width="384"
        height="232"
        rx="18"
        fill="none"
        stroke={AMBER}
        strokeOpacity="0.18"
      />
    </g>

    {/* Pie: las tres etiquetas de dialecto que el motor reconoce */}
    <g transform="translate(0 262)">
      {['postgres', 'mysql', 't-sql'].map((label, i) => (
        <g key={label} transform={`translate(${34 + i * 116} 0)`}>
          <rect x="0" y="0" width="104" height="24" rx="12" fill={AMBER} opacity="0.1" />
          <rect x="0" y="0" width="104" height="24" rx="12" fill="none" stroke={AMBER} strokeOpacity="0.3" />
          <text x="52" y="16" textAnchor="middle" fontSize="11" fontFamily="ui-monospace, monospace" fill={AMBER_SOFT}>
            {label}
          </text>
        </g>
      ))}
    </g>
  </svg>
);

// ---------------------------------------------------------------------------
// Iconos de features. Comparten caja de 48×48 y grosor de trazo.
// ---------------------------------------------------------------------------
const iconProps = {
  viewBox: '0 0 48 48',
  role: 'img' as const,
  'aria-hidden': true,
};

/** Varios motores: tres cilindros con una etiqueta seleccionada. */
export const DialectIcon: React.FC<ArtProps> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    {[0, 1, 2].map(i => (
      <g key={i} transform={`translate(${8 + i * 12} ${10 + i * 2})`} opacity={i === 1 ? 1 : 0.45}>
        <ellipse cx="8" cy="8" rx="7" ry="3" fill={AMBER} />
        <path d="M1 8 v12 a7 3 0 0 0 14 0 V8" fill="none" stroke={AMBER} strokeWidth="1.8" />
        <ellipse cx="8" cy="14" rx="7" ry="3" fill="none" stroke={AMBER} strokeWidth="1.4" opacity="0.6" />
      </g>
    ))}
    <path d="M18 40 h12" stroke={AMBER_SOFT} strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

/** Lint: una lupa sobre una línea con el aviso marcado. */
export const LintIcon: React.FC<ArtProps> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <rect x="5" y="8" width="26" height="3" rx="1.5" fill={AMBER} opacity="0.5" />
    <rect x="5" y="16" width="18" height="3" rx="1.5" fill={AMBER} opacity="0.5" />
    <rect x="5" y="24" width="22" height="3" rx="1.5" fill="#f87171" />
    <circle cx="30" cy="30" r="9" fill="none" stroke={AMBER_SOFT} strokeWidth="2.4" />
    <path d="M37 37 L43 43" stroke={AMBER_SOFT} strokeWidth="3" strokeLinecap="round" />
    <path d="M30 26 v5" stroke={AMBER_SOFT} strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="30" cy="34.5" r="1.3" fill={AMBER_SOFT} />
  </svg>
);

/** Local: la ventana del navegador con el candado y sin nube. */
export const LocalIcon: React.FC<ArtProps> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <rect x="5" y="9" width="38" height="30" rx="5" fill="none" stroke={AMBER} strokeWidth="2.2" />
    <path d="M5 17 h38" stroke={AMBER} strokeWidth="2.2" />
    <circle cx="10.5" cy="13" r="1.4" fill={AMBER_SOFT} />
    <circle cx="15.5" cy="13" r="1.4" fill={AMBER_SOFT} />
    <rect x="18" y="25" width="12" height="9" rx="2" fill="none" stroke={AMBER_SOFT} strokeWidth="2" />
    <path d="M20.5 25 v-3 a3.5 3.5 0 0 1 7 0 v3" fill="none" stroke={AMBER_SOFT} strokeWidth="2" />
  </svg>
);

/** Fuera del hilo principal: dos carriles, uno de ellos con la carga pesada. */
export const ThreadIcon: React.FC<ArtProps> = ({ className = '' }) => (
  <svg {...iconProps} className={className}>
    <path d="M6 16 h36" stroke={AMBER} strokeWidth="2.2" strokeLinecap="round" opacity="0.45" />
    <path d="M6 32 h36" stroke={AMBER} strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="16" cy="16" r="4" fill={AMBER_SOFT} opacity="0.5" />
    <circle cx="30" cy="32" r="5" fill={AMBER_SOFT} />
    <path d="M24 8 v6 M24 34 v6" stroke={AMBER_DEEP} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
  </svg>
);

// ---------------------------------------------------------------------------
// Arte de los cuatro pasos de "cómo funciona". Caja de 120×80.
// ---------------------------------------------------------------------------
const stepProps = { viewBox: '0 0 120 80', role: 'img' as const, 'aria-hidden': true };

export const StepPaste: React.FC<ArtProps> = ({ className = '' }) => (
  <svg {...stepProps} className={className}>
    <rect x="12" y="12" width="60" height="56" rx="8" fill="none" stroke={AMBER} strokeWidth="2" strokeDasharray="5 4" />
    {[0, 1, 2].map(i => (
      <rect key={i} x="22" y={26 + i * 11} width={40 - i * 8} height="4" rx="2" fill={AMBER} opacity="0.55" />
    ))}
    <path d="M82 40 h22 M96 32 l8 8 -8 8" fill="none" stroke={AMBER_SOFT} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const StepOptions: React.FC<ArtProps> = ({ className = '' }) => (
  <svg {...stepProps} className={className}>
    {[22, 40, 58].map((y, i) => (
      <g key={y}>
        <rect x="16" y={y - 2} width="88" height="4" rx="2" fill={AMBER} opacity="0.25" />
        <circle cx={i === 0 ? 40 : i === 1 ? 74 : 56} cy={y} r="7" fill="#0f0a02" stroke={AMBER_SOFT} strokeWidth="2.4" />
      </g>
    ))}
  </svg>
);

export const StepFormat: React.FC<ArtProps> = ({ className = '' }) => (
  <svg {...stepProps} className={className}>
    <rect x="14" y="14" width="92" height="52" rx="8" fill="none" stroke={AMBER} strokeWidth="2" opacity="0.5" />
    {[
      [24, 46, AMBER],
      [34, 34, '#fef3c7'],
      [34, 40, '#6ee7b7'],
      [24, 38, AMBER],
      [34, 30, '#7dd3fc'],
    ].map(([x, w, fill], i) => (
      <rect key={i} x={x as number} y={24 + i * 9} width={w as number} height="4" rx="2" fill={fill as string} opacity="0.9" />
    ))}
  </svg>
);

export const StepShare: React.FC<ArtProps> = ({ className = '' }) => (
  <svg {...stepProps} className={className}>
    <rect x="14" y="20" width="44" height="40" rx="7" fill="none" stroke={AMBER} strokeWidth="2" />
    <path d="M62 40 h20 M74 33 l8 7 -8 7" fill="none" stroke={AMBER_SOFT} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="98" cy="26" r="8" fill="none" stroke={AMBER} strokeWidth="2" opacity="0.7" />
    <circle cx="98" cy="54" r="8" fill="none" stroke={AMBER} strokeWidth="2" opacity="0.7" />
    <path d="M36 32 v16 M28 40 h16" stroke={AMBER_SOFT} strokeWidth="2.2" strokeLinecap="round" opacity="0.6" />
  </svg>
);

/** Marca de la herramienta para la cabecera: un cilindro con el cursor de una consulta. */
export const SqlMark: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} role="img" aria-hidden="true">
    <ellipse cx="9" cy="6" rx="6" ry="2.6" fill={AMBER} />
    <path d="M3 6 v9 a6 2.6 0 0 0 8 2.4" fill="none" stroke={AMBER} strokeWidth="1.8" strokeLinecap="round" />
    <ellipse cx="9" cy="10.6" rx="6" ry="2.6" fill="none" stroke={AMBER} strokeWidth="1.4" opacity="0.55" />
    <path d="M14 20 l3.5 -3.5 L14 13" fill="none" stroke={AMBER_SOFT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19 20 h4" stroke={AMBER_SOFT} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const STEP_ART = [StepPaste, StepOptions, StepFormat, StepShare];
export const FEATURE_ART = [DialectIcon, LintIcon, ThreadIcon, LocalIcon];
