// ============================================================================
// Tokenizador SQL — el dato intermedio de la herramienta.
// ----------------------------------------------------------------------------
// Todo lo que la tool sabe del texto sale de aquí una sola vez: el resaltado,
// el minificado, el lint con línea/columna, el desglose en sentencias y el
// inventario de tablas/CTEs/parámetros. El formateador (sql-formatter) devuelve
// texto ya aplanado, así que no sirve para nada de esto.
//
// El formateador anterior hacía `sql.replace(/\s+/g, ' ')` sobre el texto
// entero, con las cadenas apenas "enmascaradas": eso se comía los espacios
// DENTRO de los literales ('a   b' → 'a b'). Aquí las cadenas son un token con
// su texto exacto y no se tocan jamás.
// ============================================================================

import { DATA_TYPES, FUNCTIONS, KEYWORDS } from './keywords';

export type TokenKind =
  | 'keyword'
  | 'type'
  | 'function'
  | 'identifier'
  | 'quoted-identifier'
  | 'string'
  | 'number'
  | 'comment'
  | 'param'
  | 'variable'
  | 'operator'
  | 'punctuation'
  | 'whitespace';

export interface Token {
  kind: TokenKind;
  /** Texto tal cual aparece en la entrada. */
  text: string;
  /** Índice de carácter donde empieza (para saltar el cursor ahí). */
  start: number;
  end: number;
  /** 1-based, como las muestran los editores y los errores de los motores. */
  line: number;
  col: number;
  /** Sólo en `comment`, `string` y `quoted-identifier`: se quedó sin cerrar. */
  unterminated?: boolean;
}

export interface TokenizeResult {
  tokens: Token[];
  /** Número de líneas del documento (siempre >= 1). */
  lines: number;
}

const PUNCTUATION = new Set(['(', ')', ',', ';', '[', ']', '{', '}']);

// Los de tres y dos caracteres van antes que los sueltos: si no, `<=` se
// tokeniza como `<` y `=`, y el minificador podría separarlos.
const OPERATORS3 = ['<=>', '||/', '!~*', '#>>', '->>'];
const OPERATORS2 = [
  '<>', '!=', '<=', '>=', '||', '::', '->', '=>', ':=', '+=', '-=', '*=', '/=', '%=',
  '<<', '>>', '@>', '<@', '&&', '#>', '!~', '~*', '^@',
];

const IDENT_START = /[A-Za-z_-￿]/;
const IDENT_PART = /[A-Za-z0-9_$-￿]/;

function isDigit(c: string): boolean {
  return c >= '0' && c <= '9';
}

function isIdentStart(c: string): boolean {
  return IDENT_START.test(c);
}

function isIdentPart(c: string): boolean {
  return IDENT_PART.test(c);
}

/**
 * Recorre el texto una vez. Nunca lanza: un literal sin cerrar produce un token
 * marcado `unterminated` que llega hasta el final, y el lint lo reporta con su
 * posición en vez de dejar la interfaz muerta.
 */
export function tokenize(sql: string): TokenizeResult {
  const tokens: Token[] = [];
  const len = sql.length;
  let i = 0;
  let line = 1;
  let col = 1;

  const push = (
    kind: TokenKind,
    start: number,
    end: number,
    startLine: number,
    startCol: number,
    unterminated?: boolean
  ) => {
    const token: Token = {
      kind,
      text: sql.slice(start, end),
      start,
      end,
      line: startLine,
      col: startCol,
    };
    if (unterminated) token.unterminated = true;
    tokens.push(token);
  };

  /** Avanza `i` hasta `to` manteniendo línea y columna al día. */
  const advanceTo = (to: number) => {
    for (let k = i; k < to; k++) {
      if (sql[k] === '\n') {
        line++;
        col = 1;
      } else {
        col++;
      }
    }
    i = to;
  };

  while (i < len) {
    const startLine = line;
    const startCol = col;
    const start = i;
    const c = sql[i];
    const next = sql[i + 1];

    // --- espacio en blanco -------------------------------------------------
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f') {
      let j = i + 1;
      while (j < len && /[ \t\n\r\f]/.test(sql[j])) j++;
      advanceTo(j);
      push('whitespace', start, j, startLine, startCol);
      continue;
    }

    // --- comentario de línea (`--` estándar, `#` en MySQL) -----------------
    if ((c === '-' && next === '-') || c === '#') {
      let j = i;
      while (j < len && sql[j] !== '\n') j++;
      advanceTo(j);
      push('comment', start, j, startLine, startCol);
      continue;
    }

    // --- comentario de bloque ---------------------------------------------
    if (c === '/' && next === '*') {
      let j = i + 2;
      let closed = false;
      while (j < len) {
        if (sql[j] === '*' && sql[j + 1] === '/') {
          j += 2;
          closed = true;
          break;
        }
        j++;
      }
      advanceTo(j);
      push('comment', start, j, startLine, startCol, !closed);
      continue;
    }

    // --- cadena entre comillas simples ------------------------------------
    // `''` es un apóstrofo escapado (estándar) y `\'` lo es en MySQL: los dos
    // se saltan, porque tratarlos como cierre partía el literal en dos.
    if (c === "'") {
      const scan = scanQuoted(sql, i, "'");
      advanceTo(scan.end);
      push('string', start, scan.end, startLine, startCol, !scan.closed);
      continue;
    }

    // --- literal con prefijo (E'', N'', X'', B'') --------------------------
    if (next === "'" && /^[eEnNxXbBrR]$/.test(c)) {
      const scan = scanQuoted(sql, i + 1, "'");
      advanceTo(scan.end);
      push('string', start, scan.end, startLine, startCol, !scan.closed);
      continue;
    }

    // --- dollar quoting de PostgreSQL: $$...$$ o $tag$...$tag$ -------------
    if (c === '$') {
      const tagMatch = /^(\$[A-Za-z_]\w*\$|\$\$)/.exec(sql.slice(i));
      if (tagMatch) {
        const tag = tagMatch[0];
        const closeAt = sql.indexOf(tag, i + tag.length);
        const end = closeAt === -1 ? len : closeAt + tag.length;
        advanceTo(end);
        push('string', start, end, startLine, startCol, closeAt === -1);
        continue;
      }
      // $1, $2… son parámetros numerados de PostgreSQL.
      if (isDigit(next || '')) {
        let j = i + 1;
        while (j < len && isDigit(sql[j])) j++;
        advanceTo(j);
        push('param', start, j, startLine, startCol);
        continue;
      }
    }

    // --- identificadores citados ------------------------------------------
    if (c === '"' || c === '`') {
      const scan = scanQuoted(sql, i, c);
      advanceTo(scan.end);
      push('quoted-identifier', start, scan.end, startLine, startCol, !scan.closed);
      continue;
    }
    // [corchetes] de T-SQL, pero sólo cuando abren un identificador: un `[`
    // suelto detrás de un valor es indexación de array en Postgres.
    if (c === '[' && /^\[[^\]\n]*\]/.test(sql.slice(i))) {
      const end = sql.indexOf(']', i) + 1;
      advanceTo(end);
      push('quoted-identifier', start, end, startLine, startCol);
      continue;
    }

    // --- parámetros con nombre --------------------------------------------
    if ((c === ':' || c === '@') && isIdentStart(next || '')) {
      let j = i + 1;
      while (j < len && isIdentPart(sql[j])) j++;
      advanceTo(j);
      push(c === '@' ? 'variable' : 'param', start, j, startLine, startCol);
      continue;
    }
    if (c === '?') {
      advanceTo(i + 1);
      push('param', start, start + 1, startLine, startCol);
      continue;
    }

    // --- números -----------------------------------------------------------
    if (isDigit(c) || (c === '.' && isDigit(next || ''))) {
      const match = /^(0[xX][0-9a-fA-F]+|\d+(\.\d*)?([eE][+-]?\d+)?|\.\d+([eE][+-]?\d+)?)/.exec(
        sql.slice(i)
      );
      const end = i + (match ? match[0].length : 1);
      advanceTo(end);
      push('number', start, end, startLine, startCol);
      continue;
    }

    // --- palabras ----------------------------------------------------------
    if (isIdentStart(c)) {
      let j = i;
      while (j < len && isIdentPart(sql[j])) j++;
      const word = sql.slice(i, j);
      const upper = word.toUpperCase();
      // Una palabra pegada a `(` es una llamada a función aunque no esté en la
      // lista: así se colorean bien las funciones propias del usuario.
      let after = j;
      while (after < len && (sql[after] === ' ' || sql[after] === '\t')) after++;
      const callsOut = sql[after] === '(';
      let kind: TokenKind = 'identifier';
      if (KEYWORDS.has(upper)) kind = 'keyword';
      else if (callsOut) kind = 'function';
      else if (DATA_TYPES.has(upper)) kind = 'type';
      else if (FUNCTIONS.has(upper)) kind = 'function';
      advanceTo(j);
      push(kind, start, j, startLine, startCol);
      continue;
    }

    // --- operadores y puntuación -------------------------------------------
    if (OPERATORS3.includes(sql.slice(i, i + 3))) {
      advanceTo(i + 3);
      push('operator', start, start + 3, startLine, startCol);
      continue;
    }
    if (OPERATORS2.includes(sql.slice(i, i + 2))) {
      advanceTo(i + 2);
      push('operator', start, start + 2, startLine, startCol);
      continue;
    }
    advanceTo(i + 1);
    push(PUNCTUATION.has(c) ? 'punctuation' : 'operator', start, start + 1, startLine, startCol);
  }

  return { tokens, lines: line };
}

/**
 * Lee un literal delimitado permitiendo el escape por duplicación (`''`, `""`)
 * y por barra invertida. Devuelve el final (exclusivo) y si llegó a cerrarse.
 */
function scanQuoted(sql: string, from: number, quote: string): { end: number; closed: boolean } {
  const len = sql.length;
  let j = from + 1;
  while (j < len) {
    const c = sql[j];
    if (c === '\\' && quote !== '"') {
      j += 2;
      continue;
    }
    if (c === quote) {
      if (sql[j + 1] === quote) {
        j += 2;
        continue;
      }
      return { end: j + 1, closed: true };
    }
    j++;
  }
  return { end: len, closed: false };
}

/** Tokens que aportan significado (todo menos espacios y comentarios). */
export function meaningful(tokens: Token[]): Token[] {
  return tokens.filter(t => t.kind !== 'whitespace' && t.kind !== 'comment');
}
