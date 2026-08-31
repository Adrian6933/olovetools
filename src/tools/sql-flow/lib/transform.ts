// ============================================================================
// Transformaciones que trabajan sobre tokens, no sobre el texto plano.
// ----------------------------------------------------------------------------
// Minificar y comentar/descomentar con expresiones regulares es justo lo que
// rompía la versión anterior: cualquier `--`, coma o palabra clave dentro de
// una cadena o de un comentario se trataba como sintaxis. Partiendo del token
// stream, un literal es intocable por construcción.
// ============================================================================

import { tokenize, type Token } from './tokenizer';

const WORDLIKE = new Set(['keyword', 'type', 'function', 'identifier', 'number', 'param', 'variable']);
/** Caracteres que, pegados, formarían otro operador (`-` + `-` = comentario). */
const STICKY = /[-+*/<>=!|&~^%:@#]/;

export interface MinifyOptions {
  /** Fuera por defecto: en una query minificada un comentario de línea se come el resto. */
  stripComments: boolean;
}

/**
 * Deja la consulta en una sola línea sin espacios superfluos, conservando
 * intactos literales e identificadores citados.
 */
export function minify(sql: string, options: MinifyOptions = { stripComments: true }): string {
  const { tokens } = tokenize(sql);
  let out = '';
  let prev: Token | null = null;

  for (const token of tokens) {
    if (token.kind === 'whitespace') continue;
    if (token.kind === 'comment') {
      if (options.stripComments) continue;
      // Un comentario de línea sin salto detrás anularía todo lo que venga
      // después, así que al conservarlo se convierte en comentario de bloque.
      const body = token.text.replace(/^(--|#)\s?/, '').replace(/\*\//g, '* /');
      const text = token.text.startsWith('/*') ? token.text : `/* ${body} */`;
      out += (out && !out.endsWith(' ') ? ' ' : '') + text + ' ';
      prev = null;
      continue;
    }

    if (prev && needsSpace(prev, token)) out += ' ';
    out += token.text;
    prev = token;
  }

  return out.replace(/\s+;/g, ';').trim();
}

function needsSpace(prev: Token, next: Token): boolean {
  const a = prev.text[prev.text.length - 1];
  const b = next.text[0];
  if (WORDLIKE.has(prev.kind) && WORDLIKE.has(next.kind)) return true;
  // `SELECT'x'` es válido en algún dialecto pero ilegible y frágil.
  if (WORDLIKE.has(prev.kind) && (next.kind === 'string' || next.kind === 'quoted-identifier')) return true;
  if ((prev.kind === 'string' || prev.kind === 'quoted-identifier') && WORDLIKE.has(next.kind)) return true;
  if (STICKY.test(a) && STICKY.test(b)) return true;
  return false;
}

/** Comenta o descomenta las líneas que toca la selección (Ctrl+/). */
export function toggleComment(text: string, from: number, to: number): { text: string; from: number; to: number } {
  const startOfFirst = text.lastIndexOf('\n', Math.max(0, from - 1)) + 1;
  const endOfLast = text.indexOf('\n', to) === -1 ? text.length : text.indexOf('\n', to);
  const block = text.slice(startOfFirst, endOfLast);
  const lines = block.split('\n');
  const allCommented = lines.every(line => !line.trim() || /^\s*--/.test(line));

  const next = lines
    .map(line => {
      if (!line.trim()) return line;
      return allCommented ? line.replace(/^(\s*)--\s?/, '$1') : line.replace(/^(\s*)/, '$1-- ');
    })
    .join('\n');

  const delta = next.length - block.length;
  return {
    text: text.slice(0, startOfFirst) + next + text.slice(endOfLast),
    from: startOfFirst,
    to: endOfLast + delta,
  };
}

/**
 * Sustituye los parámetros por los valores que haya escrito el usuario.
 * Sólo toca tokens `param`/`variable`, así que un `:algo` dentro de una cadena
 * se queda como está.
 */
export function fillParams(sql: string, values: Record<string, string>): string {
  const { tokens } = tokenize(sql);
  let out = '';
  let positional = 0;
  for (const token of tokens) {
    let value: string | undefined;
    if (token.kind === 'param' || token.kind === 'variable') {
      // Los `?` se numeran igual que en analyze(), para que cada uno tenga su
      // propio valor en vez de compartir todos la misma casilla.
      const key = token.text === '?' ? `?${++positional}` : token.text;
      value = values[key];
    }
    out += value === undefined || value === '' ? token.text : value;
  }
  return out;
}
