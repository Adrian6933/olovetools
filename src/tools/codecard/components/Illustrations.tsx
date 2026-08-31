import React from 'react';

// ============================================================================
// Ilustraciones propias de CodeCard, en la paleta índigo/violeta de la tool.
// Sustituyen a los iconos de lucide reciclados (Maximize2 / Lock / FileCode)
// que hacían de "arte" y al <Sparkles> repetido que hacía de héroe.
// ============================================================================

interface ArtProps {
  className?: string;
  /** Las animaciones SMIL se apagan cuando el usuario pide menos movimiento. */
  animated?: boolean;
}

const TOKEN_COLORS = ['#c678dd', '#61afef', '#98c379', '#d19a66', '#56b6c2'];

// ---------------------------------------------------------------------------
// Héroe: texto plano a la izquierda que cruza y se convierte en una tarjeta
// con degradado, cromo de ventana y sintaxis coloreada a la derecha.
// ---------------------------------------------------------------------------
export const CodeCardHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 420 260" className={className} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="ccHeroBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#6a11cb" />
        <stop offset="100%" stopColor="#2575fc" />
      </linearGradient>
      <linearGradient id="ccHeroFade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
        <stop offset="50%" stopColor="#818cf8" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
      </linearGradient>
      <filter id="ccHeroShadow" x="-40%" y="-40%" width="180%" height="200%">
        <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#000000" floodOpacity="0.45" />
      </filter>
    </defs>

    {/* Izquierda: código crudo, monocromo */}
    <g opacity="0.55">
      {[0, 1, 2, 3, 4, 5].map(i => (
        <rect
          key={`raw-${i}`}
          x={16}
          y={62 + i * 20}
          width={[74, 96, 60, 88, 52, 80][i]}
          height="8"
          rx="4"
          fill="#475569"
        />
      ))}
    </g>

    {/* Haz de transformación */}
    {animated && (
      <rect x="112" y="52" width="46" height="140" fill="url(#ccHeroFade)" opacity="0.5">
        <animate attributeName="x" values="106;150;106" dur="4.2s" repeatCount="indefinite" />
      </rect>
    )}
    <path
      d="M116 130 L160 130"
      stroke="#818cf8"
      strokeWidth="2"
      strokeLinecap="round"
      strokeDasharray="4 6"
      opacity="0.7"
    />
    <path d="M154 124 L162 130 L154 136 Z" fill="#818cf8" />

    {/* Derecha: la tarjeta terminada */}
    <g filter="url(#ccHeroShadow)">
      <rect x="176" y="34" width="230" height="192" rx="18" fill="url(#ccHeroBg)" />
      <rect x="200" y="58" width="182" height="144" rx="10" fill="#282c34" />

      {/* Barra de título con los tres puntos */}
      <rect x="200" y="58" width="182" height="20" rx="10" fill="#21252b" />
      <rect x="200" y="70" width="182" height="8" fill="#21252b" />
      <circle cx="212" cy="68" r="3.4" fill="#ff5f56" />
      <circle cx="223" cy="68" r="3.4" fill="#ffbd2e" />
      <circle cx="234" cy="68" r="3.4" fill="#27c93f" />
      <rect x="292" y="65" width="46" height="6" rx="3" fill="#3b4048" />

      {/* Canalón de números */}
      {[0, 1, 2, 3, 4, 5].map(i => (
        <rect key={`ln-${i}`} x={208} y={90 + i * 17} width="6" height="6" rx="2" fill="#4b5263" />
      ))}
      <line x1="222" y1="86" x2="222" y2="196" stroke="#3b4048" strokeWidth="1" />

      {/* Línea resaltada: la función estrella de la herramienta */}
      <rect x="222" y="121" width="160" height="15" fill="#61afef" opacity="0.13" />
      <rect x="222" y="121" width="2.5" height="15" fill="#61afef" />

      {/* Tokens de colores */}
      {[
        [[16, '#c678dd'], [34, '#61afef'], [26, '#abb2bf']],
        [[22, '#56b6c2'], [46, '#98c379']],
        [[30, '#d19a66'], [20, '#abb2bf'], [38, '#98c379']],
        [[18, '#c678dd'], [52, '#61afef']],
        [[26, '#abb2bf'], [30, '#d19a66'], [22, '#56b6c2']],
        [[40, '#5c6370']],
      ].map((row, r) => {
        let x = 232;
        return (
          <g key={`row-${r}`}>
            {row.map(([w, color], c) => {
              const rect = (
                <rect
                  key={`t-${r}-${c}`}
                  x={x}
                  y={90 + r * 17}
                  width={w as number}
                  height="7"
                  rx="3.5"
                  fill={color as string}
                >
                  {animated && (
                    <animate
                      attributeName="opacity"
                      values="0.35;1;1;0.35"
                      dur="4.2s"
                      begin={`${(r * 3 + c) * 0.12}s`}
                      repeatCount="indefinite"
                    />
                  )}
                </rect>
              );
              x += (w as number) + 8;
              return rect;
            })}
          </g>
        );
      })}
    </g>
  </svg>
);

// ---------------------------------------------------------------------------
// Iconos de las tarjetas de características
// ---------------------------------------------------------------------------

/** Flujo de tokens: el árbol que devuelve Prism.tokenize(), no HTML plano. */
export const TokenStreamIcon: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 48 48" className={className} role="img" aria-hidden="true">
    <rect x="4" y="6" width="14" height="6" rx="3" fill="#818cf8" />
    <path d="M18 9 H26 A4 4 0 0 1 30 13 V17" stroke="#4f46e5" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M18 9 H26 A4 4 0 0 1 30 13 V17" stroke="none" fill="none" />
    <rect x="30" y="15" width="14" height="6" rx="3" fill={TOKEN_COLORS[1]} />
    <path d="M12 12 V24 A4 4 0 0 0 16 28 H22" stroke="#4f46e5" strokeWidth="2" fill="none" strokeLinecap="round" />
    <rect x="22" y="25" width="12" height="6" rx="3" fill={TOKEN_COLORS[2]} />
    <path d="M12 28 V36 A4 4 0 0 0 16 40 H20" stroke="#4f46e5" strokeWidth="2" fill="none" strokeLinecap="round" />
    <rect x="20" y="37" width="18" height="6" rx="3" fill={TOKEN_COLORS[3]} />
  </svg>
);

/** Malla de píxeles que se densifica: la exportación a 1x/2x/3x/4x. */
export const ResolutionIcon: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 48 48" className={className} role="img" aria-hidden="true">
    <rect x="4" y="8" width="18" height="18" rx="3" fill="none" stroke="#4f46e5" strokeWidth="2" />
    <rect x="9" y="13" width="8" height="8" rx="1.5" fill="#4f46e5" opacity="0.55" />
    <rect x="26" y="8" width="18" height="18" rx="3" fill="none" stroke="#818cf8" strokeWidth="2" />
    {[0, 1, 2, 3].map(i => (
      <rect
        key={i}
        x={30 + (i % 2) * 6}
        y={12 + Math.floor(i / 2) * 6}
        width="5"
        height="5"
        rx="1"
        fill="#818cf8"
      />
    ))}
    <rect x="4" y="30" width="40" height="12" rx="3" fill="none" stroke="#4f46e5" strokeWidth="2" opacity="0.5" />
    {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
      <rect key={`p-${i}`} x={7 + i * 4.7} y={33} width="3.4" height="6" rx="0.8" fill="#a5b4fc" opacity={0.35 + i * 0.08} />
    ))}
  </svg>
);

/** Escudo con el código dentro y la nube tachada fuera: nada sale del equipo. */
export const LocalOnlyIcon: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 48 48" className={className} role="img" aria-hidden="true">
    <path
      d="M24 5 L40 11 V23 C40 33 33 40 24 43 C15 40 8 33 8 23 V11 Z"
      fill="none"
      stroke="#4f46e5"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <path d="M20 20 L15 25 L20 30" stroke="#a5b4fc" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M28 20 L33 25 L28 30" stroke="#a5b4fc" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M26 17 L22 33" stroke="#818cf8" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

/** Líneas atenuadas con una destacada: el resaltado por líneas. */
export const FocusLinesIcon: React.FC<ArtProps> = ({ className = '' }) => (
  <svg viewBox="0 0 48 48" className={className} role="img" aria-hidden="true">
    <rect x="5" y="7" width="38" height="34" rx="4" fill="none" stroke="#4f46e5" strokeWidth="2" />
    {[0, 1, 3, 4].map(i => (
      <rect key={i} x={11} y={13 + i * 6} width={[24, 18, 22, 15][i]} height="3" rx="1.5" fill="#475569" />
    ))}
    <rect x="6" y="24" width="36" height="8" fill="#818cf8" opacity="0.16" />
    <rect x="6" y="24" width="2.5" height="8" fill="#818cf8" />
    <rect x="11" y="26.5" width="26" height="3" rx="1.5" fill="#a5b4fc" />
  </svg>
);

// ---------------------------------------------------------------------------
// Arte de los pasos de "cómo funciona"
// ---------------------------------------------------------------------------

/** Paso 1: pegar o soltar un archivo. */
export const StepPasteArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 120 90" className={className} role="img" aria-hidden="true">
    <rect x="14" y="20" width="92" height="58" rx="8" fill="none" stroke="#4f46e5" strokeWidth="2" strokeDasharray="7 5" />
    {[0, 1, 2].map(i => (
      <rect key={i} x={28} y={40 + i * 11} width={[52, 40, 60][i]} height="5" rx="2.5" fill="#475569" />
    ))}
    <g>
      <rect x="44" y="4" width="32" height="26" rx="5" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1.8" />
      <rect x="50" y="12" width="20" height="3.5" rx="1.75" fill="#a5b4fc" />
      <rect x="50" y="19" width="13" height="3.5" rx="1.75" fill="#6366f1" />
      {animated && <animateTransform attributeName="transform" type="translate" values="0,-6;0,4;0,-6" dur="3s" repeatCount="indefinite" />}
    </g>
  </svg>
);

/** Paso 2: elegir tema, fondo y líneas destacadas. */
export const StepStyleArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 120 90" className={className} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="ccStepBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#6a11cb" />
        <stop offset="100%" stopColor="#2575fc" />
      </linearGradient>
    </defs>
    <rect x="10" y="14" width="70" height="62" rx="9" fill="url(#ccStepBg)" />
    <rect x="20" y="24" width="50" height="42" rx="5" fill="#282c34" />
    <rect x="24" y="38" width="42" height="7" fill="#61afef" opacity="0.18" />
    <rect x="24" y="38" width="2" height="7" fill="#61afef" />
    {[0, 2, 3].map(i => (
      <rect key={i} x={27} y={30 + i * 8} width={[30, 26, 22][i % 3]} height="3.5" rx="1.75" fill="#4b5263" />
    ))}
    <rect x="27" y="39.5" width="34" height="3.5" rx="1.75" fill="#98c379" />
    {['#ff7e5f', '#6a11cb', '#11998e', '#232526'].map((c, i) => (
      <circle key={c} cx="96" cy={24 + i * 15} r="7" fill={c} stroke={i === 1 ? '#ffffff' : 'transparent'} strokeWidth="2">
        {animated && i === 1 && <animate attributeName="r" values="7;8.5;7" dur="2.4s" repeatCount="indefinite" />}
      </circle>
    ))}
  </svg>
);

/** Paso 3: exportar o mandar la imagen a otra herramienta. */
export const StepExportArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 120 90" className={className} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="ccStepOut" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#6a11cb" />
        <stop offset="100%" stopColor="#2575fc" />
      </linearGradient>
    </defs>
    <rect x="12" y="16" width="58" height="46" rx="8" fill="url(#ccStepOut)" />
    <rect x="20" y="24" width="42" height="30" rx="4" fill="#282c34" />
    <rect x="25" y="30" width="24" height="3.5" rx="1.75" fill="#c678dd" />
    <rect x="25" y="38" width="30" height="3.5" rx="1.75" fill="#98c379" />
    <rect x="25" y="46" width="18" height="3.5" rx="1.75" fill="#61afef" />

    <path d="M74 39 H98" stroke="#818cf8" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="4 5">
      {animated && <animate attributeName="stroke-dashoffset" values="18;0" dur="1.6s" repeatCount="indefinite" />}
    </path>
    <path d="M93 33 L101 39 L93 45 Z" fill="#818cf8" />
    <rect x="86" y="58" width="26" height="20" rx="5" fill="none" stroke="#4f46e5" strokeWidth="2" />
    <path d="M99 62 V72 M95 68 L99 72 L103 68" stroke="#a5b4fc" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
