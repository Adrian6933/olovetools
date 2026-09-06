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

/**
 * Convierte un pegote de texto en una lista de palabras.
 *
 * La idea es poder pedirle a una IA "dame 50 palabras clave para clips de
 * Valorant" y pegar lo que devuelva sin tener que limpiarlo a mano, y eso llega
 * en formatos muy distintos: separado por comas, uno por línea, numerado
 * ("1. ace"), con guiones o viñetas, entre comillas, o como un array de JSON.
 * Todos acaban aquí en lo mismo.
 */
export function parseKeywordList(text: string): string[] {
  if (!text) return [];
  return text
    // Los corchetes de un array de JSON pegado tal cual.
    .replace(/^[\s[{(]+|[\s\]})]+$/g, '')
    // Cualquier separador de lista razonable pasa a ser uno solo.
    .split(/[\n\r,;|\t]+/)
    .map(trozo =>
      trozo
        .trim()
        // Numeración y viñetas del principio: "1.", "1)", "-", "*", "•", "–".
        .replace(/^\s*(?:\d+\s*[.)\-:]|[-*•·–—>]+)\s*/, '')
        // Comillas de todo tipo alrededor, incluidas las tipográficas.
        .replace(/^["'“”‘’`]+|["'“”‘’`]+$/g, '')
        .trim()
    )
    .filter(Boolean);
}

/**
 * Añade palabras a una lista sin repetir. La comparación va en minúsculas y sin
 * tildes: que "ACE", "ace" y "Ace" acaben siendo tres fichas distintas no le
 * sirve a nadie, y filtran exactamente lo mismo.
 */
export function mergeKeywords(actuales: string[], nuevas: string[], tope = 200): string[] {
  const vistas = new Set(actuales.map(w => normalizeText(w)));
  const salida = [...actuales];
  for (const palabra of nuevas) {
    if (salida.length >= tope) break;
    const clave = normalizeText(palabra);
    if (!clave || vistas.has(clave)) continue;
    vistas.add(clave);
    salida.push(palabra);
  }
  return salida;
}
