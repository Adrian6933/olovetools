// ============================================================================
// Análisis sobre el token stream: sentencias, inventario y lint con posición.
// ----------------------------------------------------------------------------
// La versión anterior validaba con cuatro expresiones regulares sobre el texto
// entero y devolvía frases en inglés fijas ("Unclosed string literal"), sin
// línea ni columna: no se podía traducir ni saltar al error. Aquí cada aviso
// es un objeto con `id` (la clave i18n), `severity` y el offset exacto, así que
// la interfaz puede colocar el cursor encima y los nueve idiomas funcionan.
// ============================================================================

import { STATEMENT_STARTERS } from './keywords';
import { meaningful, tokenize, type Token, type TokenizeResult } from './tokenizer';

export type Severity = 'error' | 'warning' | 'info';

export interface Issue {
  /** Clave del diccionario: `issue_<id>` para el título, `issueText_<id>` para el detalle. */
  id: string;
  severity: Severity;
  line: number;
  col: number;
  /** Offset de carácter, para llevar el cursor del textarea hasta aquí. */
  offset: number;
  /** Relleno de las plantillas `{0}` del diccionario (nombre de tabla, número…). */
  args?: string[];
}

export interface Statement {
  index: number;
  /** Primera palabra clave en mayúsculas: SELECT, INSERT, CREATE… */
  kind: string;
  /** Etiqueta corta para la lista: `SELECT · users`. */
  subject: string;
  start: number;
  end: number;
  line: number;
  tables: string[];
  ctes: string[];
  joins: number;
  columns: number;
  hasWhere: boolean;
}

export interface Analysis {
  tokens: Token[];
  lines: number;
  statements: Statement[];
  issues: Issue[];
  /** Nombres de parámetro únicos en orden de aparición (`$1`, `:id`, `?`…). */
  params: string[];
  tables: string[];
  ctes: string[];
  counts: {
    chars: number;
    lines: number;
    statements: number;
    keywords: number;
    comments: number;
    joins: number;
  };
}

const CLAUSE_BREAK = new Set([
  'FROM', 'WHERE', 'GROUP', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'INTERSECT',
  'EXCEPT', 'RETURNING', 'WINDOW', 'ON', 'USING', 'JOIN', 'SET', 'VALUES', 'INTO',
  'QUALIFY', 'FETCH',
]);

const JOIN_WORDS = new Set(['JOIN']);

/** Un identificador de tabla puede venir citado o con esquema: `"public"."users"`. */
function readQualifiedName(tokens: Token[], from: number): { name: string; next: number } {
  let i = from;
  const parts: string[] = [];
  while (i < tokens.length) {
    const t = tokens[i];
    if (t.kind === 'identifier' || t.kind === 'quoted-identifier' || t.kind === 'function') {
      parts.push(t.text.replace(/^["`[]|["`\]]$/g, ''));
      i++;
      if (tokens[i] && tokens[i].kind === 'operator' && tokens[i].text === '.') {
        i++;
        continue;
      }
    }
    break;
  }
  return { name: parts.join('.'), next: i };
}

/** Salta el alias que sigue a una tabla (`orders o`, `orders AS o`). */
function skipAlias(tokens: Token[], from: number): number {
  const t = tokens[from];
  if (!t) return from;
  if (t.text.toUpperCase() === 'AS') return from + 2;
  if (t.kind === 'identifier' || t.kind === 'quoted-identifier') return from + 1;
  return from;
}

/** Devuelve el índice siguiente al paréntesis que cierra el de `from`. */
function skipParens(tokens: Token[], from: number): number {
  let depth = 0;
  for (let i = from; i < tokens.length; i++) {
    if (tokens[i].text === '(') depth++;
    else if (tokens[i].text === ')') {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return tokens.length;
}

/** Ruido que se cuela entre la palabra clave y el nombre real de la tabla. */
const NAME_NOISE = new Set(['IF', 'NOT', 'EXISTS', 'ONLY', 'TEMP', 'TEMPORARY', 'UNLOGGED', 'MATERIALIZED']);

/**
 * Lee los nombres de los CTE de una cláusula WITH: `WITH a AS (...), b AS (...)`.
 * Hay que saltarse el cuerpo de cada uno, porque dentro hay más `,` y más
 * nombres que no son CTE.
 */
function readCtes(group: Token[]): string[] {
  const names: string[] = [];
  let at = 1;
  if (group[at] && group[at].text.toUpperCase() === 'RECURSIVE') at++;
  while (at < group.length) {
    const read = readQualifiedName(group, at);
    if (!read.name) break;
    let j = read.next;
    if (group[j] && group[j].text === '(') j = skipParens(group, j); // lista de columnas
    if (!group[j] || group[j].text.toUpperCase() !== 'AS') break;
    j++;
    while (group[j] && NAME_NOISE.has(group[j].text.toUpperCase())) j++;
    if (!group[j] || group[j].text !== '(') break;
    names.push(read.name);
    j = skipParens(group, j);
    if (group[j] && group[j].text === ',') {
      at = j + 1;
      continue;
    }
    break;
  }
  return names;
}

/**
 * Recorre el documento una vez y devuelve todo lo que la interfaz necesita.
 * Es puro y sin dependencias del DOM: corre igual en el worker y en el hilo
 * principal.
 */
export function analyze(sql: string, pre?: TokenizeResult): Analysis {
  const { tokens, lines } = pre ?? tokenize(sql);
  const real = meaningful(tokens);
  const issues: Issue[] = [];
  const params: string[] = [];
  const allTables: string[] = [];
  const allCtes: string[] = [];
  const statements: Statement[] = [];

  let comments = 0;
  let keywords = 0;
  let positional = 0;
  for (const t of tokens) {
    if (t.kind === 'comment') comments++;
    if (t.kind === 'keyword') keywords++;
    if (t.unterminated) {
      issues.push({
        id:
          t.kind === 'string'
            ? 'unterminatedString'
            : t.kind === 'comment'
              ? 'unterminatedComment'
              : 'unterminatedIdentifier',
        severity: 'error',
        line: t.line,
        col: t.col,
        offset: t.start,
      });
    }
    // Los `?` no tienen nombre: se numeran por orden para poder darles un valor
    // distinto a cada uno (si se dedujeran por texto, todos compartirían uno).
    if (t.kind === 'param' || t.kind === 'variable') {
      const name = t.text === '?' ? `?${++positional}` : t.text;
      if (!params.includes(name)) params.push(name);
    }
  }

  // --- paréntesis: se reporta el que sobra, no un contador anónimo ---------
  const openStack: Token[] = [];
  for (const t of real) {
    if (t.text === '(') openStack.push(t);
    else if (t.text === ')') {
      if (openStack.length === 0) {
        issues.push({
          id: 'extraClosingParen',
          severity: 'error',
          line: t.line,
          col: t.col,
          offset: t.start,
        });
      } else {
        openStack.pop();
      }
    }
  }
  for (const t of openStack) {
    issues.push({ id: 'unclosedParen', severity: 'error', line: t.line, col: t.col, offset: t.start });
  }

  // --- corte en sentencias por el `;` de nivel superior --------------------
  const groups: Token[][] = [];
  let current: Token[] = [];
  let depth = 0;
  for (const t of real) {
    if (t.text === '(') depth++;
    if (t.text === ')') depth = Math.max(0, depth - 1);
    if (t.text === ';' && depth === 0) {
      if (current.length) groups.push(current);
      current = [];
      continue;
    }
    current.push(t);
  }
  if (current.length) groups.push(current);

  groups.forEach((group, index) => {
    const first = group[0];
    const kind = first.text.toUpperCase();
    const tables: string[] = [];
    const ctes: string[] = kind === 'WITH' ? readCtes(group) : [];
    let joins = 0;
    let columns = 0;
    let hasWhere = false;
    let hasOrderBy = false;
    let hasLimit = false;
    let selectStar: Token | null = null;
    let commaJoin = false;

    for (let i = 0; i < group.length; i++) {
      const t = group[i];
      const up = t.text.toUpperCase();

      if (up === 'WHERE') hasWhere = true;
      if (up === 'ORDER') hasOrderBy = true;
      if (up === 'LIMIT') hasLimit = true;
      if (JOIN_WORDS.has(up)) joins++;

      if (up === 'SELECT') {
        // Cuenta las columnas de la proyección: comas a profundidad 0 hasta FROM.
        let d = 0;
        let count = 1;
        for (let j = i + 1; j < group.length; j++) {
          const g = group[j];
          if (g.text === '(') d++;
          else if (g.text === ')') d--;
          else if (d === 0 && g.text === ',') count++;
          else if (d === 0 && CLAUSE_BREAK.has(g.text.toUpperCase())) break;
          if (d === 0 && g.text === '*' && !selectStar) selectStar = g;
        }
        columns = Math.max(columns, count);
      }

      const namesATable =
        up === 'FROM' ||
        up === 'JOIN' ||
        up === 'INTO' ||
        up === 'TABLE' ||
        (up === 'UPDATE' && i === 0) ||
        // `CREATE INDEX … ON tabla`: aquí ON no es la condición de un JOIN.
        (up === 'ON' && kind === 'CREATE');
      if (namesATable) {
        let at = i + 1;
        while (group[at] && NAME_NOISE.has(group[at].text.toUpperCase())) at++;
        const read = readQualifiedName(group, at);
        if (read.name && !tables.includes(read.name)) tables.push(read.name);
        // `FROM a alias, b` sin condición de unión es un producto cartesiano.
        if (up === 'FROM' && group[skipAlias(group, read.next)]?.text === ',') commaJoin = true;
      }
    }

    // Un CTE no es una tabla real: se lista aparte para no ensuciar el
    // inventario de tablas tocadas por la consulta.
    const realTables = tables.filter(name => !ctes.includes(name));
    const subject = realTables[0] || ctes[0] || '';
    statements.push({
      index,
      kind,
      subject,
      start: first.start,
      end: group[group.length - 1].end,
      line: first.line,
      tables: realTables,
      ctes,
      joins,
      columns,
      hasWhere,
    });

    for (const name of tables) if (!allTables.includes(name) && !ctes.includes(name)) allTables.push(name);
    for (const name of ctes) if (!allCtes.includes(name)) allCtes.push(name);

    // --- reglas por sentencia ---------------------------------------------
    if (!STATEMENT_STARTERS.has(kind)) {
      issues.push({
        id: 'noStatementKeyword',
        severity: 'error',
        line: first.line,
        col: first.col,
        offset: first.start,
        args: [first.text],
      });
    }
    if ((kind === 'DELETE' || kind === 'UPDATE') && !hasWhere) {
      issues.push({
        id: kind === 'DELETE' ? 'deleteWithoutWhere' : 'updateWithoutWhere',
        severity: 'warning',
        line: first.line,
        col: first.col,
        offset: first.start,
        args: [subject || '?'],
      });
    }
    if (kind === 'DROP' || kind === 'TRUNCATE') {
      issues.push({
        id: 'destructiveStatement',
        severity: 'warning',
        line: first.line,
        col: first.col,
        offset: first.start,
        args: [kind],
      });
    }
    if (selectStar) {
      issues.push({
        id: 'selectStar',
        severity: 'info',
        line: selectStar.line,
        col: selectStar.col,
        offset: selectStar.start,
      });
    }
    if (commaJoin && !hasWhere) {
      issues.push({
        id: 'cartesianJoin',
        severity: 'warning',
        line: first.line,
        col: first.col,
        offset: first.start,
      });
    }
    if (hasLimit && !hasOrderBy) {
      issues.push({
        id: 'limitWithoutOrder',
        severity: 'info',
        line: first.line,
        col: first.col,
        offset: first.start,
      });
    }
    if (kind === 'INSERT') {
      const intoAt = group.findIndex(t => t.text.toUpperCase() === 'INTO');
      const read = intoAt >= 0 ? readQualifiedName(group, intoAt + 1) : null;
      if (read && read.name && group[read.next]?.text.toUpperCase() === 'VALUES') {
        issues.push({
          id: 'insertWithoutColumns',
          severity: 'info',
          line: first.line,
          col: first.col,
          offset: first.start,
          args: [read.name],
        });
      }
    }
  });

  // El punto y coma final sólo se echa en falta si hay algo escrito.
  const lastReal = real[real.length - 1];
  if (lastReal && lastReal.text !== ';') {
    issues.push({
      id: 'missingSemicolon',
      severity: 'info',
      line: lastReal.line,
      col: lastReal.col + lastReal.text.length,
      offset: lastReal.end,
    });
  }

  const order: Record<Severity, number> = { error: 0, warning: 1, info: 2 };
  issues.sort((a, b) => order[a.severity] - order[b.severity] || a.offset - b.offset);

  return {
    tokens,
    lines,
    statements,
    issues,
    params,
    tables: allTables,
    ctes: allCtes,
    counts: {
      chars: sql.length,
      lines,
      statements: statements.length,
      keywords,
      comments,
      joins: statements.reduce((sum, s) => sum + s.joins, 0),
    },
  };
}
