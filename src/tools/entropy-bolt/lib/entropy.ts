// ============================================================================
// Entropía y tiempo de descifrado
// ----------------------------------------------------------------------------
// Dos preguntas DISTINTAS que la versión anterior mezclaba en una sola función:
//
//   1. "¿Cuánta entropía tiene lo que este generador produce?"  -> generatorBits
//      Depende SOLO de los ajustes (tamaño del alfabeto y longitud). Es una
//      cantidad exacta, no una estimación.
//
//   2. "¿Cuán fuerte es esta contraseña que he escrito yo?"     -> estimateBits
//      Aquí no hay alfabeto conocido: hay que estimar a partir de los patrones
//      que se detecten, y siempre a la baja.
//
// Antes se usaba (2) para ambos casos, inspeccionando la contraseña YA generada
// para adivinar el alfabeto. Eso daba números que cambiaban entre una tirada y
// otra con los mismos ajustes, y que además ignoraban las exclusiones: se
// anunciaban 105,1 bits donde había 100,9.
// ============================================================================

import type { Options } from './charsets';
import { charsetFor } from './charsets';

/** Entropía exacta de lo que produce el generador con estos ajustes. */
export function generatorBits(o: Options): number {
  const size = charsetFor(o).length;
  if (size <= 1) return 0;
  const length = Math.max(0, Math.round(o.length));
  return length * Math.log2(size);
}

/** Entropía exacta de una frase de N palabras sacadas de una lista de M. */
export function passphraseBits(words: number, listSize: number, extras = 0): number {
  if (listSize <= 1 || words <= 0) return 0;
  return words * Math.log2(listSize) + extras;
}

// --- estimación para contraseñas escritas por el usuario --------------------

const SEQUENCES = [
  'abcdefghijklmnopqrstuvwxyz',
  '01234567890',
  'qwertyuiop',
  'asdfghjkl',
  'zxcvbnm',
  'qwertzuiop',
  'azertyuiop',
];

/** Sustituciones leet más habituales, para desenmascarar palabras de diccionario. */
const LEET: Record<string, string> = {
  '4': 'a',
  '@': 'a',
  '8': 'b',
  '(': 'c',
  '3': 'e',
  '6': 'g',
  '1': 'l',
  '!': 'i',
  '0': 'o',
  '5': 's',
  $: 's',
  '7': 't',
  '+': 't',
  '2': 'z',
};

const LEET_CHARS = /[4@8(36105$7+2!]/g;

const deLeet = (s: string) => s.toLowerCase().replace(LEET_CHARS, c => LEET[c] || c);

/** Longitud del tramo más largo que sigue una secuencia conocida (o su inversa). */
function longestSequenceRun(pw: string): number {
  const lower = pw.toLowerCase();
  let best = 0;
  for (const seq of SEQUENCES) {
    const both = [seq, [...seq].reverse().join('')];
    for (const s of both) {
      for (let i = 0; i < lower.length; i++) {
        let run = 0;
        while (i + run < lower.length) {
          const idx = s.indexOf(lower[i + run]);
          if (idx === -1) break;
          if (run > 0 && s.indexOf(lower[i + run - 1]) + 1 !== idx) break;
          run++;
        }
        if (run > best) best = run;
      }
    }
  }
  return best;
}

/** Longitud del tramo más largo de un mismo carácter repetido. */
function longestRepeatRun(pw: string): number {
  let best = 0;
  let run = 1;
  for (let i = 1; i <= pw.length; i++) {
    if (i < pw.length && pw[i] === pw[i - 1]) run++;
    else {
      if (run > best) best = run;
      run = 1;
    }
  }
  return best;
}

/** Alfabeto que hace falta para escribir esta cadena, contando lo que hay de verdad. */
function observedCharsetSize(pw: string): number {
  let size = 0;
  if (/[a-z]/.test(pw)) size += 26;
  if (/[A-Z]/.test(pw)) size += 26;
  if (/[0-9]/.test(pw)) size += 10;
  // Los símbolos se cuentan uno a uno en lugar de sumar una constante fija:
  // usar sólo "-" no compra lo mismo que repartir entre 28 símbolos distintos.
  const symbols = new Set<string>();
  for (const c of pw) if (!/[a-zA-Z0-9]/.test(c)) symbols.add(c);
  size += Math.min(symbols.size * 4, 33);
  return size || 1;
}

export interface Weakness {
  /** Clave de locale del motivo. */
  key: string;
  /** Bits descontados por este motivo. */
  cost: number;
}

export interface Estimate {
  bits: number;
  /** Bits antes de aplicar penalizaciones, para poder explicar la diferencia. */
  rawBits: number;
  weaknesses: Weakness[];
}

/**
 * Estimación conservadora para una contraseña escrita a mano.
 *
 * Las penalizaciones se restan en bits y se acumulan, en vez de aplicar topes
 * duros que se pisaban entre sí: la versión anterior hacía `Math.min(entropy,
 * 20)` y después `entropy - 12`, de modo que el ORDEN de las comprobaciones
 * cambiaba el resultado final.
 */
export function estimateBits(pw: string, commonSet?: Set<string>): Estimate {
  if (!pw) return { bits: 0, rawBits: 0, weaknesses: [] };

  const perChar = Math.log2(observedCharsetSize(pw));
  const rawBits = pw.length * perChar;
  const weaknesses: Weakness[] = [];
  let bits = rawBits;

  /** Añade una penalización sin que la suma pueda pasarse de los bits que hay. */
  const penalise = (key: string, cost: number) => {
    const real = Math.min(Math.max(0, cost), bits);
    if (real < 1) return;
    weaknesses.push({ key, cost: Math.round(real) });
    bits -= real;
  };

  // Tres formas de la misma contraseña, porque cada una destapa un disfraz
  // distinto:
  //   - tal cual                    -> "password"
  //   - deshaciendo el leet         -> "p4ssw0rd"  se vuelve "password"
  //   - quedándose sólo con letras  -> "Password2024" se vuelve "password"
  // La forma sin leet hace falta aparte: aplicar el mapa leet a "Password2024"
  // convierte el año en letras ("passwordzoza") y la palabra deja de coincidir.
  const deLeeted = deLeet(pw).replace(/[^a-z]/g, '');
  const lettersOnly = pw.toLowerCase().replace(/[^a-z]/g, '');

  // Una contraseña de una lista pública no vale su longitud: vale el logaritmo
  // de la posición que ocupa en la lista. Con listas de miles de entradas eso
  // son ~12 bits como mucho.
  const isKnown =
    !!commonSet &&
    (commonSet.has(pw.toLowerCase()) ||
      (deLeeted.length > 3 && commonSet.has(deLeeted)) ||
      (lettersOnly.length > 3 && commonSet.has(lettersOnly)));

  if (isKnown) {
    const capped = 12;
    if (bits > capped) {
      weaknesses.push({ key: 'weakCommon', cost: Math.round(bits - capped) });
      bits = capped;
    }
  }

  const seqRun = longestSequenceRun(pw);
  if (seqRun >= 3) {
    // Un tramo en secuencia aporta ~2 bits en total (cuál es y hacia dónde va),
    // no los log2(alfabeto) por carácter que se le habían contado.
    penalise('weakSequence', (seqRun - 1) * perChar - 2);
  }

  const repRun = longestRepeatRun(pw);
  if (repRun >= 3) {
    penalise('weakRepeat', (repRun - 1) * perChar - 1);
  }

  // Un año de 4 cifras al final es de los patrones más frecuentes que existen.
  if (/(19|20)\d{2}$/.test(pw)) {
    penalise('weakYear', 4 * Math.log2(10) - Math.log2(150));
  }

  // Mayúscula sólo en la primera letra: no añade el bit que aparenta.
  if (/^[A-Z][^A-Z]*$/.test(pw)) {
    penalise('weakCapitalised', 1);
  }

  return { bits: Math.max(0, bits), rawBits, weaknesses };
}

// --- tiempo de descifrado ---------------------------------------------------

/**
 * Escenarios de ataque. Dar una sola cifra ("10.000 millones por segundo") es
 * engañoso: ese ritmo sólo aplica si el atacante se ha llevado la base de datos
 * y el hash es rápido. Contra un formulario de login real son ~100 intentos por
 * segundo, y contra un hash lento bien configurado, del orden de 10.000.
 */
export const SCENARIOS = [
  { id: 'online', key: 'scenarioOnline', guessesPerSecond: 100 },
  { id: 'throttledOff', key: 'scenarioThrottled', guessesPerSecond: 1e4 },
  { id: 'offlineSlow', key: 'scenarioSlowHash', guessesPerSecond: 1e6 },
  { id: 'offlineFast', key: 'scenarioFastHash', guessesPerSecond: 1e10 },
] as const;

export type ScenarioId = (typeof SCENARIOS)[number]['id'];

/**
 * Segundos hasta acertar, de media (la mitad del espacio de búsqueda).
 *
 * Se corta en 1000 bits porque Math.pow(2, n) desborda a Infinity poco después;
 * el formateador ya trata ese caso como "más que la edad del universo".
 */
export function secondsToCrack(bits: number, guessesPerSecond: number): number {
  if (bits <= 0) return 0;
  if (bits > 1000) return Infinity;
  return Math.pow(2, bits - 1) / guessesPerSecond;
}

export type DurationUnit =
  | 'instant'
  | 'seconds'
  | 'minutes'
  | 'hours'
  | 'days'
  | 'months'
  | 'years'
  | 'forever';

export interface Duration {
  unit: DurationUnit;
  /** Cantidad ya redondeada. Ausente en 'instant' y 'forever'. */
  value?: number;
}

const YEAR = 31557600;

/**
 * Reduce los segundos a unidad + cantidad, SIN formatear el número: quien lo
 * pinta decide el idioma. Antes se devolvía la cadena ya montada en inglés
 * ("3 years"), imposible de traducir, y con toLocaleString sin locale fijo, que
 * además arriesga un desajuste de hidratación entre servidor y navegador.
 */
export function describeDuration(seconds: number): Duration {
  if (!isFinite(seconds)) return { unit: 'forever' };
  if (seconds < 1) return { unit: 'instant' };
  if (seconds < 60) return { unit: 'seconds', value: Math.round(seconds) };
  if (seconds < 3600) return { unit: 'minutes', value: Math.round(seconds / 60) };
  if (seconds < 86400) return { unit: 'hours', value: Math.round(seconds / 3600) };
  if (seconds < YEAR / 12) return { unit: 'days', value: Math.round(seconds / 86400) };
  if (seconds < YEAR) return { unit: 'months', value: Math.round(seconds / (YEAR / 12)) };
  const years = seconds / YEAR;
  if (years > 1e15) return { unit: 'forever' };
  return { unit: 'years', value: Math.round(years) };
}

// --- niveles ---------------------------------------------------------------

export type StrengthId = 'veryWeak' | 'weak' | 'fair' | 'strong' | 'veryStrong';

export interface Strength {
  id: StrengthId;
  /** 0-4, para la barra. */
  level: number;
  bar: string;
  text: string;
  ring: string;
}

const LEVELS: Strength[] = [
  { id: 'veryWeak', level: 0, bar: 'bg-red-500', text: 'text-red-400', ring: 'ring-red-500/30' },
  { id: 'weak', level: 1, bar: 'bg-orange-500', text: 'text-orange-400', ring: 'ring-orange-500/30' },
  { id: 'fair', level: 2, bar: 'bg-amber-400', text: 'text-amber-300', ring: 'ring-amber-400/30' },
  { id: 'strong', level: 3, bar: 'bg-emerald-500', text: 'text-emerald-300', ring: 'ring-emerald-500/30' },
  { id: 'veryStrong', level: 4, bar: 'bg-emerald-400', text: 'text-emerald-300', ring: 'ring-emerald-400/40' },
];

export function strengthOf(bits: number): Strength {
  if (bits < 28) return LEVELS[0];
  if (bits < 36) return LEVELS[1];
  if (bits < 60) return LEVELS[2];
  if (bits < 90) return LEVELS[3];
  return LEVELS[4];
}
