// ============================================================================
// Del token stream de Prism a un modelo de líneas
// ----------------------------------------------------------------------------
// `Prism.highlight()` devuelve una única cadena de HTML en la que las líneas ya
// no existen como entidad. Partiendo de `Prism.tokenize()` sí podemos cortar
// por saltos de línea SIN romper los tokens, y eso es lo que habilita:
//   · números de línea que casan exactamente con el código (una fila = una fila)
//   · resaltar / atenuar líneas concretas
//   · ajuste de línea con sangrado colgante
//   · renderizar con elementos de React en vez de dangerouslySetInnerHTML
// ============================================================================

import type { PrismToken } from './prism';

export interface Span {
  /** Texto literal del fragmento. */
  t: string;
  /** Clases CSS de Prism ("token keyword"), o cadena vacía si es texto plano. */
  c: string;
}

export type Line = Span[];

/**
 * Clases del token más interno, que es el criterio que aplica el navegador:
 * en la salida anidada de Prism el `<span>` hijo gana el color al padre.
 */
function classesOf(type: string, alias?: string | string[]): string {
  const parts = ['token', type];
  if (typeof alias === 'string') parts.push(alias);
  else if (Array.isArray(alias)) parts.push(...alias);
  return parts.join(' ');
}

/**
 * Aplana el árbol de tokens en líneas. Un token que contiene saltos de línea
 * (un comentario de bloque, una plantilla multilínea) se reparte entre varias
 * líneas conservando su clase en cada trozo.
 */
export function toLines(tokens: PrismToken[]): Line[] {
  const lines: Line[] = [];
  let current: Line = [];

  const pushText = (text: string, cls: string) => {
    // split('\n') sobre "a\nb" da ["a","b"]: el primer trozo continúa la línea
    // en curso y cada trozo siguiente abre una nueva.
    const parts = text.split('\n');
    for (let i = 0; i < parts.length; i++) {
      if (i > 0) {
        lines.push(current);
        current = [];
      }
      if (parts[i] !== '') current.push({ t: parts[i], c: cls });
    }
  };

  const walk = (node: PrismToken | PrismToken[], cls: string) => {
    if (typeof node === 'string') {
      pushText(node, cls);
      return;
    }
    if (Array.isArray(node)) {
      for (const child of node) walk(child, cls);
      return;
    }
    const own = classesOf(node.type, node.alias);
    const content = node.content as unknown as PrismToken | PrismToken[];
    if (typeof content === 'string') pushText(content, own);
    else walk(content, own);
  };

  walk(tokens, '');
  lines.push(current);
  return lines;
}

/** Modelo de líneas sin resaltar, para cuando la gramática aún no ha cargado. */
export function plainLines(code: string): Line[] {
  return code.split('\n').map(text => (text === '' ? [] : [{ t: text, c: '' }]));
}

/**
 * Une números de línea sueltos en rangos legibles ("3, 7-9, 12") y al revés.
 * Es el formato con el que el usuario puede teclear el resaltado a mano en vez
 * de ir clicando línea por línea.
 */
export function rangesToText(lines: Set<number>): string {
  const sorted = [...lines].sort((a, b) => a - b);
  const out: string[] = [];
  let i = 0;
  while (i < sorted.length) {
    const start = sorted[i];
    let end = start;
    while (i + 1 < sorted.length && sorted[i + 1] === end + 1) {
      end = sorted[++i];
    }
    out.push(start === end ? String(start) : `${start}-${end}`);
    i++;
  }
  return out.join(', ');
}

/** "3, 7-9, 12" → Set{3,7,8,9,12}. Ignora en silencio lo que no sea un rango. */
export function textToRanges(text: string, max: number): Set<number> {
  const set = new Set<number>();
  for (const chunk of text.split(/[,\s]+/)) {
    if (!chunk) continue;
    const match = /^(\d+)(?:-(\d+))?$/.exec(chunk);
    if (!match) continue;
    const from = Number(match[1]);
    const to = match[2] ? Number(match[2]) : from;
    if (from < 1 || to < from || to - from > 5000) continue;
    for (let n = from; n <= Math.min(to, max); n++) set.add(n);
  }
  return set;
}
