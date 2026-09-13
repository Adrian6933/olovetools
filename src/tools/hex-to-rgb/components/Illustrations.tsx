import React from 'react';

// ============================================================================
// Ilustraciones propias del conversor de color, en la paleta teal de la
// herramienta. Todo se anima con SMIL y toda animación cuelga de `animated`:
// con prefers-reduced-motion el resultado es una imagen quieta y COMPLETA, no
// un fotograma a medio dibujar.
// ============================================================================

interface ArtProps {
  className?: string;
  animated?: boolean;
}

const TEAL = '#14b8a6';
const TEAL_LIGHT = '#5eead4';
const TEAL_DARK = '#0d9488';
const INK = '#041313';
const LINE = '#134e4a';

// ---------------------------------------------------------------------------
// Héroe: un código hex que se descompone en sus tres canales y se recompone en
// una rueda de tono perceptual. Es literalmente lo que hace la herramienta.
// ---------------------------------------------------------------------------
export const ColorHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => {
  const digits = ['F', 'F', '6', '3', '4', '7'];
  const channels = [
    { label: 'R', value: 255, color: '#f87171', width: 152 },
    { label: 'G', value: 99, color: '#4ade80', width: 59 },
    { label: 'B', value: 71, color: '#60a5fa', width: 42 },
  ];
  // 24 sectores de la rueda de tono, recorridos en OKLCH: claridad constante,
  // que es justo lo que una rueda en HSL no consigue.
  const wheel = Array.from({ length: 24 }, (_, i) => i);

  return (
    <svg viewBox="5 5 404 226" className={`tool-hero-art ${className}`} role="img" aria-hidden="true">
      <defs>
        <linearGradient id="c2rPanel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#062a26" />
          <stop offset="100%" stopColor={INK} />
        </linearGradient>
        <radialGradient id="c2rGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={TEAL} stopOpacity="0.45" />
          <stop offset="100%" stopColor={TEAL} stopOpacity="0" />
        </radialGradient>
        <clipPath id="c2rClip">
          <rect x="18" y="18" width="196" height="96" rx="14" />
        </clipPath>
      </defs>

      {/* Entrada: el hex tal cual se teclea */}
      <rect x="18" y="18" width="196" height="96" rx="14" fill="url(#c2rPanel)" stroke={LINE} />
      <g clipPath="url(#c2rClip)">
        <rect x="18" y="18" width="196" height="96" fill="url(#c2rGlow)" opacity="0.5" />
      </g>
      <text x="34" y="46" fontFamily="ui-monospace, monospace" fontSize="10" fill={TEAL_DARK} letterSpacing="2">
        INPUT
      </text>
      <g fontFamily="ui-monospace, monospace" fontSize="30" fontWeight="700">
        <text x="34" y="86" fill={TEAL_LIGHT}>
          #
        </text>
        {digits.map((d, i) => (
          <text key={i} x={54 + i * 25} y="86" fill="#ffffff">
            {d}
            {animated && (
              <animate
                attributeName="opacity"
                values="0.35;1;1;0.35"
                keyTimes="0;0.18;0.82;1"
                dur="3.2s"
                begin={`${i * 0.12}s`}
                repeatCount="indefinite"
              />
            )}
          </text>
        ))}
      </g>
      <rect x="34" y="96" width="150" height="2" rx="1" fill={TEAL} opacity="0.35" />

      {/* Descomposición en canales */}
      <g transform="translate(18,132)">
        {channels.map((ch, i) => (
          <g key={ch.label} transform={`translate(0, ${i * 26})`}>
            <text x="0" y="12" fontFamily="ui-monospace, monospace" fontSize="12" fontWeight="700" fill={ch.color}>
              {ch.label}
            </text>
            <rect x="18" y="3" width="152" height="11" rx="5.5" fill="#0a2422" />
            <rect x="18" y="3" width={ch.width} height="11" rx="5.5" fill={ch.color} opacity="0.85">
              {animated && (
                <animate
                  attributeName="width"
                  values={`0;${ch.width};${ch.width}`}
                  keyTimes="0;0.35;1"
                  dur="3.2s"
                  begin={`${i * 0.18}s`}
                  repeatCount="indefinite"
                />
              )}
            </rect>
            <text
              x="178"
              y="13"
              fontFamily="ui-monospace, monospace"
              fontSize="11"
              fill="#94a3b8"
              textAnchor="start"
            >
              {ch.value}
            </text>
          </g>
        ))}
      </g>

      {/* Puente hacia la rueda */}
      <path
        d="M222 66 C 250 66, 250 120, 276 120"
        fill="none"
        stroke={TEAL}
        strokeWidth="1.6"
        strokeDasharray="4 6"
        opacity="0.7"
      >
        {animated && (
          <animate attributeName="stroke-dashoffset" values="0;-20" dur="1.4s" repeatCount="indefinite" />
        )}
      </path>

      {/* Rueda de tono perceptual */}
      <g transform="translate(310,132)">
        <circle r="86" fill="url(#c2rGlow)" opacity="0.5" />
        <g>
          {wheel.map((i) => {
            const a0 = (i / wheel.length) * 360 - 90;
            const a1 = ((i + 1) / wheel.length) * 360 - 90;
            const rad = (deg: number) => (deg * Math.PI) / 180;
            const r1 = 46;
            const r2 = 70;
            // Redondeado a 3 decimales a propósito: Math.cos/Math.sin no dan el
            // mismo último bit en Node y en el navegador, y un dígito de más en
            // el atributo `d` basta para que React aborte la hidratación de la
            // isla entera con "server rendered HTML didn't match".
            const at = (deg: number, r: number) => [
              +(Math.cos(rad(deg)) * r).toFixed(3),
              +(Math.sin(rad(deg)) * r).toFixed(3),
            ];
            const [x1, y1] = at(a0, r1);
            const [x2, y2] = at(a0, r2);
            const [x3, y3] = at(a1, r2);
            const [x4, y4] = at(a1, r1);
            return (
              <path
                key={i}
                d={`M${x1} ${y1} L${x2} ${y2} A${r2} ${r2} 0 0 1 ${x3} ${y3} L${x4} ${y4} A${r1} ${r1} 0 0 0 ${x1} ${y1} Z`}
                fill={`hsl(${(i / wheel.length) * 360} 72% 58%)`}
                opacity="0.92"
              />
            );
          })}
          {animated && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0"
              to="360"
              dur="34s"
              repeatCount="indefinite"
            />
          )}
        </g>
        <circle r="42" fill={INK} stroke={LINE} />
        <circle r="30" fill="#ff6347" />
        <circle r="30" fill="none" stroke="#ffffff" strokeOpacity="0.25" />
        {/* Marcadores de armonía: base + complementario */}
        <g>
          <circle cx="0" cy="-58" r="6" fill="#ffffff" />
          <circle cx="0" cy="58" r="6" fill="#ffffff" opacity="0.55" />
          {animated && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="8;-8;8"
              dur="7s"
              repeatCount="indefinite"
            />
          )}
        </g>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Iconos de las características. viewBox 32×32, trazo de 1.8 para que casen
// entre ellos y con el peso visual del resto de la página.
// ---------------------------------------------------------------------------

type IconProps = { className?: string };

const base = (className: string) => ({
  viewBox: '0 0 32 32',
  className,
  role: 'img' as const,
  'aria-hidden': true,
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

/** Parser universal: llaves de función con una gota de color dentro. */
export const IconSyntax: React.FC<IconProps> = ({ className = '' }) => (
  <svg {...base(className)}>
    <path d="M11 6C8 6 8 10 8 13c0 2-1.5 3-3 3 1.5 0 3 1 3 3 0 3 0 5 3 5" />
    <path d="M21 6c3 0 3 4 3 7 0 2 1.5 3 3 3-1.5 0-3 1-3 3 0 3 0 5-3 5" />
    <circle cx="16" cy="16" r="3.2" fill="currentColor" stroke="none" />
  </svg>
);

/** Rampa perceptual: once escalones de altura creciente. */
export const IconRamp: React.FC<IconProps> = ({ className = '' }) => (
  <svg {...base(className)}>
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <rect key={i} x={4 + i * 4.2} y={24 - i * 3} width="3" height={2 + i * 3} rx="1" fill="currentColor" stroke="none" />
    ))}
    <path d="M4 27h24" opacity="0.4" />
    <path d="M29 6v14" opacity="0.4" />
  </svg>
);

/** Contraste: una "Aa" partida por el eje claro/oscuro. */
export const IconContrast: React.FC<IconProps> = ({ className = '' }) => (
  <svg {...base(className)}>
    <circle cx="16" cy="16" r="11" />
    <path d="M16 5a11 11 0 0 0 0 22z" fill="currentColor" stroke="none" />
    <path d="M12 20l4-9 4 9" />
    <path d="M13.4 17.2h5.2" />
  </svg>
);

/** Daltonismo: ojo con el espectro partido. */
export const IconCvd: React.FC<IconProps> = ({ className = '' }) => (
  <svg {...base(className)}>
    <path d="M3 16s5-7 13-7 13 7 13 7-5 7-13 7S3 16 3 16z" />
    <circle cx="16" cy="16" r="4" />
    <path d="M16 12v8" opacity="0.6" />
    <path d="M8 24l16-16" opacity="0.35" />
  </svg>
);

/** Pipeta sobre una rejilla de píxeles. */
export const IconDropper: React.FC<IconProps> = ({ className = '' }) => (
  <svg {...base(className)}>
    <path d="M5 27l2-5 11-11 3 3-11 11z" />
    <path d="M18 8l3-3a2.8 2.8 0 0 1 4 4l-3 3z" />
    <path d="M22 22h6M25 19v6" opacity="0.5" />
    <circle cx="8.5" cy="23.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

/** Armonías: la rueda con tres marcas equidistantes. */
export const IconHarmony: React.FC<IconProps> = ({ className = '' }) => (
  <svg {...base(className)}>
    <circle cx="16" cy="16" r="11" />
    <circle cx="16" cy="5.5" r="2.6" fill="currentColor" stroke="none" />
    <circle cx="25.1" cy="21.2" r="2.6" fill="currentColor" stroke="none" opacity="0.75" />
    <circle cx="6.9" cy="21.2" r="2.6" fill="currentColor" stroke="none" opacity="0.5" />
    <path d="M16 8.1L23.4 20H8.6z" opacity="0.35" />
  </svg>
);

/** Exportar: hoja de muestras que sale volando. */
export const IconExport: React.FC<IconProps> = ({ className = '' }) => (
  <svg {...base(className)}>
    <rect x="4" y="7" width="16" height="16" rx="2.5" />
    <rect x="7" y="10" width="4" height="4" rx="1" fill="currentColor" stroke="none" />
    <rect x="13" y="10" width="4" height="4" rx="1" fill="currentColor" stroke="none" opacity="0.6" />
    <rect x="7" y="16" width="4" height="4" rx="1" fill="currentColor" stroke="none" opacity="0.35" />
    <path d="M22 18v7a2 2 0 0 1-2 2H9" opacity="0.5" />
    <path d="M23 5v9M19.5 8.5L23 5l3.5 3.5" />
  </svg>
);

/** Todo local: enchufe desconectado dentro de un escudo. */
export const IconLocal: React.FC<IconProps> = ({ className = '' }) => (
  <svg {...base(className)}>
    <path d="M16 3l10 4v8c0 7-4.6 11.6-10 14C10.6 26.6 6 22 6 15V7z" />
    <path d="M12.5 12v3a3.5 3.5 0 0 0 7 0v-3" />
    <path d="M13.5 9v3M18.5 9v3" />
    <path d="M16 18.5V22" />
    <path d="M8 8l16 16" opacity="0.4" />
  </svg>
);

// ---------------------------------------------------------------------------
// Arte de los cuatro pasos de "cómo funciona". viewBox 120×84.
// ---------------------------------------------------------------------------

const stepBase = (className: string) => ({
  viewBox: '0 0 120 84',
  className,
  role: 'img' as const,
  'aria-hidden': true,
});

/** 1 · Trae un color: por teclado, por pipeta o desde una imagen. */
export const StepInputArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg {...stepBase(className)}>
    <rect x="6" y="14" width="72" height="26" rx="8" fill={INK} stroke={LINE} />
    <text x="18" y="31" fontFamily="ui-monospace, monospace" fontSize="12" fill={TEAL_LIGHT}>
      oklch(
    </text>
    <rect x="60" y="21" width="1.6" height="12" fill={TEAL}>
      {animated && <animate attributeName="opacity" values="1;0;1" dur="1.1s" repeatCount="indefinite" />}
    </rect>
    <path d="M84 27h20" stroke={TEAL} strokeWidth="1.5" strokeDasharray="3 4" opacity="0.6" />
    <g transform="translate(92,50)">
      <path d="M0 16l1.4-3.6L10 3.8l2.2 2.2-8.6 8.6z" fill="none" stroke={TEAL_LIGHT} strokeWidth="1.6" />
      <path d="M11 3l2-2a2 2 0 0 1 3 3l-2 2z" fill={TEAL} stroke="none" />
    </g>
    <rect x="6" y="50" width="26" height="26" rx="6" fill="#ff6347" />
    <rect x="38" y="50" width="26" height="26" rx="6" fill="#0ea5e9" opacity="0.85" />
    {animated && (
      <rect x="6" y="50" width="26" height="26" rx="6" fill="#ffffff" opacity="0">
        <animate attributeName="opacity" values="0;0.35;0" dur="2.6s" repeatCount="indefinite" />
      </rect>
    )}
  </svg>
);

/** 2 · Ajusta: deslizadores en OKLCH, rampas, armonías. */
export const StepTuneArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg {...stepBase(className)}>
    {[
      { y: 16, w: 78, c: TEAL_LIGHT, x: 62 },
      { y: 38, w: 78, c: TEAL, x: 34 },
      { y: 60, w: 78, c: TEAL_DARK, x: 50 },
    ].map((row, i) => (
      <g key={i}>
        <rect x="10" y={row.y} width={row.w} height="6" rx="3" fill="#0a2422" />
        <rect x="10" y={row.y} width={row.x} height="6" rx="3" fill={row.c} opacity="0.8" />
        <circle cx={10 + row.x} cy={row.y + 3} r="7" fill={INK} stroke={row.c} strokeWidth="2">
          {animated && (
            <animate
              attributeName="cx"
              values={`${10 + row.x};${10 + row.x + 12};${10 + row.x}`}
              dur={`${3.4 + i * 0.6}s`}
              repeatCount="indefinite"
            />
          )}
        </circle>
      </g>
    ))}
    <rect x="98" y="16" width="14" height="50" rx="5" fill={INK} stroke={LINE} />
    {[0, 1, 2, 3, 4].map((i) => (
      <rect key={i} x="101" y={19 + i * 9.5} width="8" height="7" rx="2" fill={`hsl(9 100% ${78 - i * 13}%)`} />
    ))}
  </svg>
);

/** 3 · Comprueba: contraste y visión del color, con números. */
export const StepCheckArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg {...stepBase(className)}>
    <rect x="6" y="12" width="50" height="60" rx="8" fill="#ff6347" />
    <text x="31" y="42" fontFamily="system-ui, sans-serif" fontSize="20" fontWeight="800" fill="#ffffff" textAnchor="middle">
      Aa
    </text>
    <text x="31" y="58" fontFamily="ui-monospace, monospace" fontSize="9" fill="#ffffff" textAnchor="middle" opacity="0.85">
      3.14:1
    </text>
    <rect x="64" y="12" width="50" height="60" rx="8" fill={INK} stroke={LINE} />
    <text x="89" y="42" fontFamily="system-ui, sans-serif" fontSize="20" fontWeight="800" fill="#ff6347" textAnchor="middle">
      Aa
    </text>
    <text x="89" y="58" fontFamily="ui-monospace, monospace" fontSize="9" fill={TEAL_LIGHT} textAnchor="middle">
      Lc 62
    </text>
    <g>
      <circle cx="60" cy="42" r="9" fill={INK} stroke={TEAL} strokeWidth="1.6" />
      <path d="M56 42l3 3 5-6" stroke={TEAL_LIGHT} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {animated && <animate attributeName="opacity" values="0.3;1;0.3" dur="2.4s" repeatCount="indefinite" />}
      </path>
    </g>
  </svg>
);

/** 4 · Llévatelo: tokens, archivo, o directo a otra herramienta. */
export const StepShipArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg {...stepBase(className)}>
    <rect x="6" y="14" width="60" height="56" rx="8" fill={INK} stroke={LINE} />
    {['--brand-400', '--brand-500', '--brand-600'].map((label, i) => (
      <g key={label} transform={`translate(14, ${26 + i * 15})`}>
        <rect x="0" y="-7" width="9" height="9" rx="2.5" fill={`hsl(9 100% ${68 - i * 12}%)`} />
        <text x="14" y="1" fontFamily="ui-monospace, monospace" fontSize="8" fill="#94a3b8">
          {label}
        </text>
      </g>
    ))}
    <path d="M70 42h30" stroke={TEAL} strokeWidth="1.6" strokeDasharray="4 5">
      {animated && <animate attributeName="stroke-dashoffset" values="0;-18" dur="1.5s" repeatCount="indefinite" />}
    </path>
    <path d="M95 36l6 6-6 6" fill="none" stroke={TEAL_LIGHT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="86" y="14" width="26" height="14" rx="5" fill="#0a2422" stroke={LINE} />
    <rect x="86" y="56" width="26" height="14" rx="5" fill="#0a2422" stroke={LINE} />
  </svg>
);
