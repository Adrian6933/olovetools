// Frases de contraseña estilo diceware. La lista se carga bajo demanda.
import { pick, randomInt } from './random';
import { DIGITS, SYMBOLS } from './charsets';

export type Capitalisation = 'lower' | 'title' | 'upper';

export interface PhraseOptions {
  words: number;
  separator: string;
  capitalisation: Capitalisation;
  /** Añade un dígito al final de una palabra elegida al azar. */
  addNumber: boolean;
  /** Añade un símbolo al final de la frase. */
  addSymbol: boolean;
}

export const DEFAULT_PHRASE: PhraseOptions = {
  words: 6,
  separator: '-',
  capitalisation: 'lower',
  addNumber: false,
  addSymbol: false,
};

export const SEPARATORS = ['-', '.', '_', ' ', ''];
export const MIN_WORDS = 3;
export const MAX_WORDS = 12;

const capitalise = (w: string, how: Capitalisation) =>
  how === 'upper' ? w.toUpperCase() : how === 'title' ? w[0].toUpperCase() + w.slice(1) : w;

export interface PhraseResult {
  phrase: string;
  /** Entropía exacta: palabras × log2(lista) + extras. */
  bits: number;
}

/**
 * Genera la frase y devuelve su entropía exacta.
 *
 * Los "extras" se contabilizan por lo que realmente aportan, no por lo que
 * aparentan: un dígito pegado al final de una de N palabras añade
 * log2(10 × N) bits (cuál es el dígito y a qué palabra se pegó), y un símbolo
 * al final añade log2(tamaño del set de símbolos). Redondear esto al alza es
 * justo el error que hace que un medidor de contraseñas mienta.
 */
export function generatePhrase(words: string[], o: PhraseOptions): PhraseResult {
  if (!words.length) return { phrase: '', bits: 0 };

  const count = Math.max(MIN_WORDS, Math.min(MAX_WORDS, Math.round(o.words)));
  const chosen: string[] = [];
  for (let i = 0; i < count; i++) chosen.push(capitalise(pick(words), o.capitalisation));

  let extras = 0;

  if (o.addNumber) {
    const at = randomInt(chosen.length);
    chosen[at] = chosen[at] + DIGITS[randomInt(DIGITS.length)];
    extras += Math.log2(10 * chosen.length);
  }

  let phrase = chosen.join(o.separator);

  if (o.addSymbol) {
    phrase += SYMBOLS[randomInt(SYMBOLS.length)];
    extras += Math.log2(SYMBOLS.length);
  }

  // La capitalización en título o en mayúsculas es una regla fija aplicada a
  // TODAS las palabras, así que un atacante que la conozca no pierde nada: no
  // suma entropía y no se contabiliza.
  return { phrase, bits: count * Math.log2(words.length) + extras };
}
