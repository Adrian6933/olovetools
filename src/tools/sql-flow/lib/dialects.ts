// ============================================================================
// Dialectos: catálogo y detección.
// ----------------------------------------------------------------------------
// sql-formatter trae 20 dialectos con reglas propias (palabras reservadas,
// comillas, tipos de parámetro). El formateador casero anterior tenía UNA lista
// de 100 palabras y aun así el FAQ prometía "PostgreSQL, MySQL, SQLite y SQL
// Server". Ahora la promesa es cierta y además se adivina el dialecto a partir
// de la sintaxis, para que el usuario no tenga que saber cuál elegir.
// ============================================================================

import type { ParamTypes, SqlLanguage } from 'sql-formatter';

export interface DialectInfo {
  id: SqlLanguage;
  label: string;
  /** Tipos de parámetro reconocidos por el motor para ese dialecto. */
  paramTypes?: ParamTypes;
}

/** Los que la gente usa de verdad primero; el resto, en orden alfabético. */
export const DIALECTS: DialectInfo[] = [
  { id: 'sql', label: 'Standard SQL' },
  { id: 'postgresql', label: 'PostgreSQL', paramTypes: { numbered: ['$'], named: [':'] } },
  { id: 'mysql', label: 'MySQL', paramTypes: { positional: true } },
  { id: 'mariadb', label: 'MariaDB', paramTypes: { positional: true } },
  { id: 'sqlite', label: 'SQLite', paramTypes: { positional: true, numbered: ['?'], named: [':', '@', '$'] } },
  { id: 'transactsql', label: 'SQL Server (T-SQL)', paramTypes: { named: ['@'] } },
  { id: 'bigquery', label: 'BigQuery', paramTypes: { positional: true, named: ['@'] } },
  { id: 'snowflake', label: 'Snowflake', paramTypes: { positional: true, numbered: [':'] } },
  { id: 'redshift', label: 'Redshift' },
  { id: 'duckdb', label: 'DuckDB', paramTypes: { numbered: ['$'], named: ['$'] } },
  { id: 'clickhouse', label: 'ClickHouse' },
  { id: 'spark', label: 'Spark SQL' },
  { id: 'hive', label: 'Hive' },
  { id: 'trino', label: 'Trino / Presto' },
  { id: 'db2', label: 'Db2' },
  { id: 'plsql', label: 'Oracle PL/SQL', paramTypes: { numbered: [':'], named: [':'] } },
  { id: 'singlestoredb', label: 'SingleStore' },
  { id: 'tidb', label: 'TiDB' },
  { id: 'n1ql', label: 'N1QL (Couchbase)' },
];

export const DIALECT_IDS = new Set(DIALECTS.map(d => d.id));

interface Signal {
  dialect: SqlLanguage;
  test: RegExp;
  weight: number;
}

// Cada señal es sintaxis que sólo compila en ese motor. Se suman pesos en vez
// de quedarse con la primera coincidencia porque una query real mezcla pistas
// (un `::cast` y un `LIMIT` no deciden lo mismo).
const SIGNALS: Signal[] = [
  { dialect: 'postgresql', test: /::\s*\w/, weight: 3 },
  { dialect: 'postgresql', test: /\$\d+\b/, weight: 3 },
  { dialect: 'postgresql', test: /\$\$|\$[a-z_]\w*\$/i, weight: 4 },
  { dialect: 'postgresql', test: /\b(ILIKE|RETURNING|SERIAL|JSONB|TSVECTOR|GENERATE_SERIES|ON\s+CONFLICT)\b/i, weight: 3 },
  { dialect: 'mysql', test: /`[^`\n]+`/, weight: 4 },
  { dialect: 'mysql', test: /^\s*#/m, weight: 2 },
  { dialect: 'mysql', test: /\b(AUTO_INCREMENT|ENGINE\s*=|UNSIGNED|GROUP_CONCAT|STRAIGHT_JOIN)\b/i, weight: 3 },
  { dialect: 'mysql', test: /\bLIMIT\s+\d+\s*,\s*\d+/i, weight: 3 },
  { dialect: 'transactsql', test: /\bSELECT\s+TOP\s+\d/i, weight: 4 },
  { dialect: 'transactsql', test: /\[[A-Za-z_][^\]\n]*\]/, weight: 3 },
  { dialect: 'transactsql', test: /\b(NVARCHAR|IDENTITY|GETDATE|ISNULL|@@\w+|NOLOCK)\b/i, weight: 3 },
  { dialect: 'transactsql', test: /^\s*GO\s*$/im, weight: 3 },
  { dialect: 'sqlite', test: /\b(AUTOINCREMENT|PRAGMA|sqlite_master)\b/i, weight: 4 },
  { dialect: 'bigquery', test: /`[\w-]+\.[\w-]+\.[\w-]+`/, weight: 5 },
  { dialect: 'bigquery', test: /\b(UNNEST|STRUCT<|ARRAY_AGG\s*\()/i, weight: 2 },
  { dialect: 'snowflake', test: /\b(QUALIFY|VARIANT|LATERAL\s+FLATTEN)\b/i, weight: 4 },
  { dialect: 'plsql', test: /\b(VARCHAR2|NUMBER\s*\(|DBMS_OUTPUT|SYSDATE|NVL)\b/i, weight: 4 },
  { dialect: 'plsql', test: /\bFROM\s+DUAL\b/i, weight: 5 },
];

/**
 * Adivina el motor a partir de la sintaxis. Devuelve `null` cuando no hay
 * ninguna pista: en ese caso se queda el dialecto estándar, que es lo correcto
 * — inventarse uno cambiaría el formateo sin motivo.
 */
export function detectDialect(sql: string): { dialect: SqlLanguage; score: number } | null {
  if (!sql.trim()) return null;
  const scores = new Map<SqlLanguage, number>();
  for (const signal of SIGNALS) {
    if (signal.test.test(sql)) {
      scores.set(signal.dialect, (scores.get(signal.dialect) || 0) + signal.weight);
    }
  }
  let bestDialect: SqlLanguage | null = null;
  let bestScore = 0;
  scores.forEach((score, dialect) => {
    if (score > bestScore) {
      bestScore = score;
      bestDialect = dialect;
    }
  });
  // Con una sola señal débil no merece la pena cambiar lo que el usuario eligió.
  if (!bestDialect || bestScore < 3) return null;
  return { dialect: bestDialect, score: bestScore };
}

export function paramTypesFor(dialect: SqlLanguage): ParamTypes | undefined {
  return DIALECTS.find(d => d.id === dialect)?.paramTypes;
}
