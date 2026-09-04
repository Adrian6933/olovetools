import type { Clip } from './types';

/**
 * Minúsculas y sin tildes (el rango U+0300-U+036F son las marcas
 * diacríticas que suelta NFD). Los títulos de los clips los escriben los propios
 * streamers, con acentos o sin ellos y en mayúsculas a medias, así que buscar
 * "ace" tiene que encontrar "ACE" y buscar "epico" tiene que encontrar "épico".
 */
export const normalizeText = (text: string): string =>
  text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/**
 * Un clip pasa el filtro si su título contiene ALGUNA de las palabras. Se
 * cruzan con O y no con Y a propósito: al añadir "clutch" a "ace" lo que se
 * quiere es ver los dos tipos de clip, no los que llevan las dos palabras a la
 * vez, que serían casi ninguno.
 *
 * `needles` tiene que venir ya normalizado con normalizeText.
 */
export const clipMatchesKeywords = (clip: Clip, needles: string[]): boolean => {
  if (needles.length === 0) return true;
  const title = normalizeText(clip.title || '');
  return needles.some(needle => title.includes(needle));
};
