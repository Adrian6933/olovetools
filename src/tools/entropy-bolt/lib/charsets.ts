// ============================================================================
// Alfabetos y generación
// ----------------------------------------------------------------------------
// El alfabeto se construye una sola vez a partir de los ajustes, y ESE mismo
// alfabeto es el que alimenta tanto al generador como al cálculo de entropía.
// Antes eran dos caminos distintos (generar con un set, medir inspeccionando el
// resultado), y por eso la cifra de bits no cuadraba nunca.
// ============================================================================

import { pick, randomInt, shuffle } from './random';

export const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const LOWER = 'abcdefghijklmnopqrstuvwxyz';
export const DIGITS = '0123456789';
export const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?/~';

/** Caracteres que se confunden entre sí en pantalla o al dictarlos. */
export const SIMILAR = 'il1LoO0IB8|';

/** Los que rompen al pegarlos en una shell, un CSV o una URL sin escapar. */
// Se compone por trozos para no pelearse con el escapado: contiene a la vez
// comilla simple, comilla doble, acento grave y barra invertida.
export const AMBIGUOUS = '{}[]()/~,;:.<>|' + '\\' + "'" + '"' + '`';

export const MIN_LENGTH = 6;
export const MAX_LENGTH = 128;

export type ClassId = 'upper' | 'lower' | 'digits' | 'symbols';

export interface Options {
  length: number;
  upper: boolean;
  lower: boolean;
  digits: boolean;
  symbols: boolean;
  excludeSimilar: boolean;
  excludeAmbiguous: boolean;
  /** Caracteres concretos que el usuario no quiere (campo libre). */
  exclude: string;
  /**
   * Exigir al menos un carácter de cada clase activa. Muchos formularios lo
   * piden, y sin esto una contraseña de 16 con símbolos activados sale sin
   * ningún símbolo aproximadamente 1 de cada 1.000 veces.
   */
  requireEach: boolean;
}

export const DEFAULT_OPTIONS: Options = {
  length: 20,
  upper: true,
  lower: true,
  digits: true,
  symbols: true,
  excludeSimilar: false,
  excludeAmbiguous: false,
  exclude: '',
  requireEach: true,
};

export const CLASS_SOURCE: Record<ClassId, string> = {
  upper: UPPER,
  lower: LOWER,
  digits: DIGITS,
  symbols: SYMBOLS,
};

const CLASS_ORDER: ClassId[] = ['upper', 'lower', 'digits', 'symbols'];

/** Clases marcadas en los ajustes, en orden estable. */
export const activeClasses = (o: Options): ClassId[] => CLASS_ORDER.filter(c => o[c === 'digits' ? 'digits' : c]);

/** Filtra un alfabeto quitando lo que los ajustes excluyan. */
function filterSet(source: string, o: Options): string {
  const banned = new Set<string>();
  if (o.excludeSimilar) for (const c of SIMILAR) banned.add(c);
  if (o.excludeAmbiguous) for (const c of AMBIGUOUS) banned.add(c);
  for (const c of o.exclude) banned.add(c);
  if (!banned.size) return source;
  let out = '';
  for (const c of source) if (!banned.has(c)) out += c;
  return out;
}

/**
 * Alfabeto por clase YA filtrado. Se devuelven por separado (y no concatenados)
 * porque `requireEach` necesita sacar un carácter de cada clase concreta, y la
 * entropía necesita el tamaño total exacto.
 */
export function poolsFor(o: Options): Record<ClassId, string> {
  const out = {} as Record<ClassId, string>;
  for (const id of CLASS_ORDER) out[id] = o[id] ? filterSet(CLASS_SOURCE[id], o) : '';
  return out;
}

/** Alfabeto completo del que se sortea cada carácter. */
export function charsetFor(o: Options): string {
  const pools = poolsFor(o);
  return CLASS_ORDER.map(id => pools[id]).join('');
}

export interface GenerateResult {
  password: string;
  /** Tamaño real del alfabeto usado: el único número válido para la entropía. */
  charsetSize: number;
  /** Clases que quedaron vacías tras aplicar las exclusiones. */
  emptied: ClassId[];
}

/**
 * Genera una contraseña. Si `requireEach` está activo coloca primero un
 * carácter obligatorio por clase y rellena el resto del alfabeto completo,
 * barajando al final para que las posiciones no queden fijas.
 */
export function generate(o: Options): GenerateResult {
  const pools = poolsFor(o);
  const charset = CLASS_ORDER.map(id => pools[id]).join('');
  const emptied = CLASS_ORDER.filter(id => o[id] && pools[id].length === 0);

  if (!charset) return { password: '', charsetSize: 0, emptied };

  const length = Math.max(MIN_LENGTH, Math.min(MAX_LENGTH, Math.round(o.length)));
  const chars: string[] = [];

  if (o.requireEach) {
    for (const id of CLASS_ORDER) {
      if (pools[id].length && chars.length < length) chars.push(pick(pools[id]));
    }
  }
  while (chars.length < length) chars.push(charset[randomInt(charset.length)]);

  return { password: shuffle(chars).join(''), charsetSize: charset.length, emptied };
}

/** Varias de una vez, cada una con su propio sorteo. */
export function generateMany(o: Options, count: number): GenerateResult[] {
  const out: GenerateResult[] = [];
  for (let i = 0; i < count; i++) out.push(generate(o));
  return out;
}
