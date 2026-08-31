import React from 'react';

// ============================================================================
// Ilustraciones propias de UnitFlow, en la paleta azul de la herramienta.
// ----------------------------------------------------------------------------
// Nada de emojis haciendo de dibujo y nada de reciclar el mismo icono de lucide
// en tres categorías distintas (antes `Ruler` valía para longitud, volumen Y
// superficie). Cada categoría tiene su forma.
//
// Toda animación cuelga de `animated`: con prefers-reduced-motion el resultado
// es una imagen quieta y COMPLETA, no un fotograma a medio dibujar.
// ============================================================================

interface ArtProps {
  className?: string;
  animated?: boolean;
}

interface IconProps {
  className?: string;
}

const BLUE = '#3b82f6';
const BLUE_LIGHT = '#93c5fd';
const BLUE_DARK = '#1d4ed8';
const INK = '#020610';
const LINE = '#1e3a8a';

// ---------------------------------------------------------------------------
// Héroe: una regla con doble graduación (métrica arriba, imperial abajo) y el
// mismo punto marcado en las dos. Debajo, la fracción exacta que el motor usa
// de verdad. Es literalmente lo que hace la herramienta.
// ---------------------------------------------------------------------------
export const UnitHeroArt: React.FC<ArtProps> = ({ className = '', animated = true }) => {
  const metric = Array.from({ length: 21 }, (_, i) => i);
  const imperial = Array.from({ length: 9 }, (_, i) => i);

  return (
    <svg viewBox="0 0 400 280" className={className} role="img" aria-hidden="true">
      <defs>
        <linearGradient id="ufPanel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a1a3a" />
          <stop offset="100%" stopColor={INK} />
        </linearGradient>
        <radialGradient id="ufGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={BLUE} stopOpacity="0.4" />
          <stop offset="100%" stopColor={BLUE} stopOpacity="0" />
        </radialGradient>
        <clipPath id="ufRuler">
          <rect x="24" y="60" width="352" height="110" rx="14" />
        </clipPath>
      </defs>

      <rect x="24" y="14" width="352" height="252" rx="20" fill="url(#ufPanel)" stroke={LINE} />
      <rect x="24" y="60" width="352" height="110" fill="url(#ufGlow)" opacity="0.6" clipPath="url(#ufRuler)" />

      {/* Cabecera: la magnitud de entrada */}
      <text x="44" y="42" fontFamily="ui-monospace, monospace" fontSize="10" fill={BLUE_DARK} letterSpacing="2.5">
        1 METER
      </text>
      <text x="356" y="42" textAnchor="end" fontFamily="ui-monospace, monospace" fontSize="10" fill={BLUE_DARK} letterSpacing="2.5">
        EXACT
      </text>

      {/* Regla */}
      <rect x="24" y="60" width="352" height="110" rx="14" fill="none" stroke={LINE} />
      <line x1="24" y1="115" x2="376" y2="115" stroke={LINE} strokeWidth="1" />

      {/* Graduación métrica (arriba) */}
      <g stroke={BLUE_LIGHT} strokeLinecap="round">
        {metric.map((i) => {
          const x = 40 + i * 16;
          const major = i % 5 === 0;
          return (
            <line
              key={`m${i}`}
              x1={x}
              y1="115"
              x2={x}
              y2={major ? 78 : 95}
              strokeWidth={major ? 2 : 1}
              opacity={major ? 0.95 : 0.45}
            />
          );
        })}
      </g>
      <text x="40" y="72" fontFamily="ui-monospace, monospace" fontSize="9" fill={BLUE_LIGHT} opacity="0.75">
        0
      </text>
      <text x="352" y="72" textAnchor="end" fontFamily="ui-monospace, monospace" fontSize="9" fill={BLUE_LIGHT} opacity="0.75">
        100 cm
      </text>

      {/* Graduación imperial (abajo): otro paso, mismo tramo */}
      <g stroke={BLUE} strokeLinecap="round">
        {imperial.map((i) => {
          const x = 40 + i * 39.37;
          const major = i % 2 === 0;
          return (
            <line
              key={`i${i}`}
              x1={x}
              y1="115"
              x2={x}
              y2={major ? 152 : 135}
              strokeWidth={major ? 2 : 1}
              opacity={major ? 0.95 : 0.5}
            />
          );
        })}
      </g>
      <text x="40" y="166" fontFamily="ui-monospace, monospace" fontSize="9" fill={BLUE} opacity="0.75">
        0
      </text>
      <text x="352" y="166" textAnchor="end" fontFamily="ui-monospace, monospace" fontSize="9" fill={BLUE} opacity="0.75">
        39.37 in
      </text>

      {/* Cursor que recorre la regla y cae en los dos sistemas a la vez */}
      <g>
        <line x1="0" y1="64" x2="0" y2="166" stroke="#ffffff" strokeWidth="1.5" opacity="0.9">
          {animated && (
            <animateTransform
              attributeName="transform"
              type="translate"
              values="40,0;356,0;40,0"
              keyTimes="0;0.5;1"
              dur="7s"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.4 0 0.2 1;0.4 0 0.2 1"
            />
          )}
          {!animated && <animateTransform attributeName="transform" type="translate" values="238,0" dur="0.01s" fill="freeze" />}
        </line>
        <circle cx="0" cy="115" r="5" fill="#ffffff">
          {animated && (
            <animateTransform
              attributeName="transform"
              type="translate"
              values="40,0;356,0;40,0"
              keyTimes="0;0.5;1"
              dur="7s"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.4 0 0.2 1;0.4 0 0.2 1"
            />
          )}
          {!animated && <animateTransform attributeName="transform" type="translate" values="238,0" dur="0.01s" fill="freeze" />}
        </circle>
      </g>

      {/* La fracción exacta: lo que separa este conversor de uno flotante */}
      <rect x="44" y="192" width="312" height="56" rx="12" fill="#050e22" stroke={LINE} />
      <text x="60" y="215" fontFamily="ui-monospace, monospace" fontSize="11" fill={BLUE_DARK} letterSpacing="1.5">
        1 in =
      </text>
      <g fontFamily="ui-monospace, monospace" fontSize="15" fontWeight="700">
        <text x="120" y="211" fill="#ffffff">
          254
        </text>
        <text x="120" y="234" fill="#ffffff">
          10000
        </text>
      </g>
      <line x1="118" y1="217" x2="166" y2="217" stroke={BLUE} strokeWidth="1.5" />
      <text x="182" y="223" fontFamily="ui-monospace, monospace" fontSize="13" fill={BLUE_LIGHT}>
        m
      </text>
      <text x="340" y="223" textAnchor="end" fontFamily="ui-monospace, monospace" fontSize="10" fill={BLUE_DARK}>
        no rounding
        {animated && <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" />}
      </text>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Iconos de categoría. Uno por magnitud, todos sobre la misma caja de 24.
// ---------------------------------------------------------------------------

const ico = (children: React.ReactNode) => ({ className = '' }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

/** Regla con graduación desigual. */
export const IconLength = ico(
  <>
    <rect x="2" y="8" width="20" height="8" rx="2" />
    <path d="M6 8v4M10 8v3M14 8v4M18 8v3" />
  </>
);

/** Balanza de dos platos. */
export const IconMass = ico(
  <>
    <path d="M12 3v16M8 20h8" />
    <path d="M5 7h14" />
    <path d="M2 14a3 3 0 0 0 6 0l-3-7z" />
    <path d="M16 14a3 3 0 0 0 6 0l-3-7z" />
  </>
);

/** Termómetro con bulbo. */
export const IconTemperature = ico(
  <>
    <path d="M10 13.5V5a2 2 0 1 1 4 0v8.5a4 4 0 1 1-4 0z" />
    <path d="M16 7h3M16 10h2" />
  </>
);

/** Aguja de velocímetro. */
export const IconSpeed = ico(
  <>
    <path d="M3.5 18a9 9 0 1 1 17 0" />
    <path d="M12 14l4.5-4" />
    <circle cx="12" cy="14" r="1.5" />
  </>
);

/** Vaso graduado. */
export const IconVolume = ico(
  <>
    <path d="M6 3h12l-1.5 17a2 2 0 0 1-2 1.8h-5A2 2 0 0 1 7.5 20z" />
    <path d="M6.7 11h10.6M7.1 15h9.8" />
  </>
);

/** Rectángulo con esquina acotada. */
export const IconArea = ico(
  <>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 10h6V4" />
    <path d="M13 20v-6h8" />
  </>
);

/** Reloj. */
export const IconTime = ico(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5.5l3.5 2" />
  </>
);

/** Arco entre dos radios. */
export const IconAngle = ico(
  <>
    <path d="M4 19h17" />
    <path d="M4 19L18 6" />
    <path d="M11.5 19a8 8 0 0 0-2-5.3" />
  </>
);

/** Discos apilados. */
export const IconData = ico(
  <>
    <ellipse cx="12" cy="5.5" rx="8" ry="3" />
    <path d="M4 5.5v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    <path d="M4 11.5v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
  </>
);

/** Ondas saliendo de un punto. */
export const IconDataRate = ico(
  <>
    <circle cx="5" cy="18" r="1.6" />
    <path d="M4 12.5a7 7 0 0 1 7 7" />
    <path d="M4 7a12.5 12.5 0 0 1 12.5 12.5" />
    <path d="M4 2.5A17.5 17.5 0 0 1 21.5 20" />
  </>
);

/** Manómetro con flechas de compresión. */
export const IconPressure = ico(
  <>
    <rect x="4" y="9" width="16" height="8" rx="2" />
    <path d="M8 6V3M12 6V3M16 6V3" />
    <path d="M8 20v3M12 20v3M16 20v3" />
  </>
);

/** Rayo. */
export const IconEnergy = ico(<path d="M13 2L5 13.5h6L10.5 22 19 10.5h-6z" />);

/** Enchufe / toma de corriente. */
export const IconPower = ico(
  <>
    <path d="M9 3v6M15 3v6" />
    <path d="M5.5 9h13v3a6.5 6.5 0 0 1-13 0z" />
    <path d="M12 18.5V22" />
  </>
);

/** Flecha empujando un bloque. */
export const IconForce = ico(
  <>
    <rect x="13" y="7" width="8" height="10" rx="1.5" />
    <path d="M2 12h9" />
    <path d="M8 8.5l3.5 3.5L8 15.5" />
  </>
);

/** Onda senoidal. */
export const IconFrequency = ico(<path d="M2 12c2.5-8 5-8 7.5 0s5 8 7.5 0 4-5 5-2" />);

/** Surtidor de combustible. */
export const IconFuel = ico(
  <>
    <path d="M4 21V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v16" />
    <path d="M3 21h11" />
    <path d="M6 9h5" />
    <path d="M16 8h2a2 2 0 0 1 2 2v6.5a1.5 1.5 0 0 1-3 0V13h-4" />
  </>
);

/** Cubo con puntos de densidad. */
export const IconDensity = ico(
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="8" cy="8" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="11" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="16" cy="8" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="9.5" cy="15" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="16" r="1.1" fill="currentColor" stroke="none" />
  </>
);

/** Letra con línea base y altura de x. */
export const IconTypography = ico(
  <>
    <path d="M4 20L10 4l6 16" />
    <path d="M6.5 14h7" />
    <path d="M19 6v12" />
    <path d="M17 6h4M17 18h4" />
  </>
);

export const CATEGORY_ICONS: Record<string, React.FC<IconProps>> = {
  length: IconLength,
  mass: IconMass,
  temperature: IconTemperature,
  speed: IconSpeed,
  volume: IconVolume,
  area: IconArea,
  time: IconTime,
  angle: IconAngle,
  data: IconData,
  datarate: IconDataRate,
  pressure: IconPressure,
  energy: IconEnergy,
  power: IconPower,
  force: IconForce,
  frequency: IconFrequency,
  fuel: IconFuel,
  density: IconDensity,
  typography: IconTypography,
};

// ---------------------------------------------------------------------------
// Iconos de las tarjetas de características
// ---------------------------------------------------------------------------

/** Fracción n/d: la aritmética exacta. */
export const IconExact = ico(
  <>
    <path d="M6 18L18 6" />
    <circle cx="7.5" cy="7.5" r="2.5" />
    <circle cx="16.5" cy="16.5" r="2.5" />
  </>
);

/** Columna de valores: el modo lote. */
export const IconBatch = ico(
  <>
    <rect x="3" y="4" width="7" height="16" rx="1.5" />
    <rect x="14" y="4" width="7" height="16" rx="1.5" />
    <path d="M5 9h3M5 13h3M16 9h3M16 13h3" />
  </>
);

/** Un valor partido en tramos: 5 ft 11 in. */
export const IconCompound = ico(
  <>
    <path d="M3 12h18" />
    <path d="M3 8v8M13 9v6M21 8v8" />
  </>
);

/** Lupa sobre una lista. */
export const IconSearch = ico(
  <>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.5 15.5L21 21" />
    <path d="M8 9h5M8 12h3" />
  </>
);

/** Nube tachada: nada sale del navegador. */
export const IconOffline = ico(
  <>
    <path d="M17.5 18H7a4 4 0 0 1-.6-7.95A5.5 5.5 0 0 1 17 8.5" />
    <path d="M3 3l18 18" />
  </>
);

/** Eslabones: el encadenado con el resto de la suite. */
export const IconChain = ico(
  <>
    <path d="M9.5 14.5l5-5" />
    <path d="M11 6.5l1.8-1.8a3.9 3.9 0 0 1 5.5 5.5L16.5 12" />
    <path d="M13 17.5l-1.8 1.8a3.9 3.9 0 0 1-5.5-5.5L7.5 12" />
  </>
);

/** Teclado: los atajos. */
export const IconKeyboard = ico(
  <>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
  </>
);

/** Regla de precisión con decimales. */
export const IconPrecision = ico(
  <>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" />
  </>
);

// ---------------------------------------------------------------------------
// Arte de los cuatro pasos de "cómo funciona"
// ---------------------------------------------------------------------------

const stepFrame = (children: React.ReactNode) => (
  <>
    <rect x="1" y="1" width="158" height="78" rx="12" fill="#050e22" stroke={LINE} />
    {children}
  </>
);

/** 1 · Elegir magnitud: fichas de categoría, una encendida. */
export const StepPickArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 160 80" className={className} role="img" aria-hidden="true">
    {stepFrame(
      <>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const x = 14 + (i % 3) * 46;
          const y = 16 + Math.floor(i / 3) * 30;
          return (
            <rect key={i} x={x} y={y} width="38" height="20" rx="6" fill={i === 1 ? BLUE : '#0c1c3c'} stroke={i === 1 ? BLUE_LIGHT : LINE} opacity={i === 1 ? 0.9 : 0.7}>
              {animated && i === 1 && (
                <animate attributeName="opacity" values="0.55;1;0.55" dur="2.8s" repeatCount="indefinite" />
              )}
            </rect>
          );
        })}
      </>
    )}
  </svg>
);

/** 2 · Escribir la cantidad: un cursor tecleando 5'11". */
export const StepTypeArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 160 80" className={className} role="img" aria-hidden="true">
    {stepFrame(
      <>
        <rect x="14" y="24" width="132" height="32" rx="8" fill="#0c1c3c" stroke={LINE} />
        <text x="26" y="45" fontFamily="ui-monospace, monospace" fontSize="15" fontWeight="700" fill="#ffffff">
          5&#39;11&quot;
        </text>
        <rect x="76" y="32" width="2" height="17" fill={BLUE_LIGHT}>
          {animated && <animate attributeName="opacity" values="1;0;1" dur="1.1s" repeatCount="indefinite" />}
        </rect>
        <text x="132" y="45" textAnchor="end" fontFamily="ui-monospace, monospace" fontSize="9" fill={BLUE_DARK}>
          ft in
        </text>
      </>
    )}
  </svg>
);

/** 3 · Ajustar la salida: un deslizador de precisión. */
export const StepTuneArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 160 80" className={className} role="img" aria-hidden="true">
    {stepFrame(
      <>
        <line x1="20" y1="30" x2="140" y2="30" stroke={LINE} strokeWidth="3" strokeLinecap="round" />
        <line x1="20" y1="52" x2="140" y2="52" stroke={LINE} strokeWidth="3" strokeLinecap="round" />
        <circle cx="0" cy="30" r="7" fill={BLUE}>
          {animated ? (
            <animateTransform attributeName="transform" type="translate" values="46,0;112,0;46,0" dur="5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.5;1" />
          ) : (
            <animateTransform attributeName="transform" type="translate" values="90,0" dur="0.01s" fill="freeze" />
          )}
        </circle>
        <circle cx="66" cy="52" r="7" fill={BLUE_DARK} />
      </>
    )}
  </svg>
);

/** 4 · Llevarlo a otra herramienta: dos nodos y una flecha. */
export const StepShipArt: React.FC<ArtProps> = ({ className = '', animated = true }) => (
  <svg viewBox="0 0 160 80" className={className} role="img" aria-hidden="true">
    {stepFrame(
      <>
        <rect x="14" y="26" width="42" height="28" rx="8" fill="#0c1c3c" stroke={BLUE} />
        <rect x="104" y="26" width="42" height="28" rx="8" fill="#0c1c3c" stroke={LINE} />
        <path d="M60 40h36" stroke={BLUE} strokeWidth="2" strokeLinecap="round" />
        <path d="M92 35l5 5-5 5" fill="none" stroke={BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="0" cy="40" r="3.5" fill={BLUE_LIGHT}>
          {animated ? (
            <animateTransform attributeName="transform" type="translate" values="62,0;94,0" dur="1.9s" repeatCount="indefinite" />
          ) : (
            <animateTransform attributeName="transform" type="translate" values="78,0" dur="0.01s" fill="freeze" />
          )}
        </circle>
      </>
    )}
  </svg>
);

export const STEP_ART = [StepPickArt, StepTypeArt, StepTuneArt, StepShipArt];

export const FEATURE_ICONS: React.FC<IconProps>[] = [
  IconExact,
  IconCompound,
  IconBatch,
  IconSearch,
  IconPrecision,
  IconKeyboard,
  IconChain,
  IconOffline,
];
