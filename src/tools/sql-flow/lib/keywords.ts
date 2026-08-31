// ============================================================================
// Vocabulario SQL para el tokenizador.
// ----------------------------------------------------------------------------
// sql-formatter trae su propio léxico por dialecto, pero lo mantiene privado
// (no lo exporta): sólo devuelve texto ya formateado. Aquí hay una copia
// reducida, suficiente para colorear, clasificar y analizar el token stream —
// que es lo que hace posible el resaltado, el minify seguro y el lint con
// posiciones sin volver a recorrer el texto.
// ============================================================================

/** Palabras que abren o estructuran una sentencia. */
export const KEYWORDS = new Set<string>([
  'ADD', 'ALL', 'ALTER', 'ANALYZE', 'AND', 'ANY', 'AS', 'ASC', 'ATTACH', 'AUTOINCREMENT',
  'BEGIN', 'BETWEEN', 'BY', 'CASCADE', 'CASE', 'CAST', 'CHECK', 'CLUSTER', 'COLLATE',
  'COLUMN', 'COMMENT', 'COMMIT', 'CONFLICT', 'CONSTRAINT', 'CREATE', 'CROSS', 'CUBE',
  'CURRENT', 'DATABASE', 'DECLARE', 'DEFAULT', 'DEFERRABLE', 'DELETE', 'DESC', 'DESCRIBE',
  'DISTINCT', 'DISTRIBUTE', 'DO', 'DROP', 'EACH', 'ELSE', 'ELSEIF', 'END', 'ESCAPE',
  'EXCEPT', 'EXCLUDE', 'EXECUTE', 'EXISTS', 'EXPLAIN', 'EXTERNAL', 'FALSE', 'FETCH',
  'FILTER', 'FIRST', 'FOLLOWING', 'FOR', 'FOREIGN', 'FROM', 'FULL', 'FUNCTION', 'GRANT',
  'GROUP', 'GROUPING', 'HAVING', 'IF', 'ILIKE', 'IMMEDIATE', 'IN', 'INDEX', 'INHERITS',
  'INNER', 'INSERT', 'INTERSECT', 'INTO', 'IS', 'ISNULL', 'JOIN', 'KEY', 'LAST',
  'LATERAL', 'LEFT', 'LIKE', 'LIMIT', 'LOCK', 'MATERIALIZED', 'MERGE', 'NATURAL', 'NEXT',
  'NO', 'NOT', 'NOTHING', 'NOTNULL', 'NULL', 'NULLS', 'OF', 'OFFSET', 'ON', 'ONLY', 'OR',
  'ORDER', 'OUTER', 'OVER', 'OVERWRITE', 'PARTITION', 'PRECEDING', 'PRIMARY', 'PRIVILEGES',
  'PROCEDURE', 'PUBLIC', 'QUALIFY', 'RANGE', 'RECURSIVE', 'REFERENCES', 'REINDEX',
  'RENAME', 'REPLACE', 'RESTRICT', 'RETURNING', 'RETURNS', 'REVOKE', 'RIGHT', 'ROLE',
  'ROLLBACK', 'ROLLUP', 'ROW', 'ROWS', 'SAVEPOINT', 'SCHEMA', 'SELECT', 'SEMI', 'SET',
  'SHOW', 'SOME', 'TABLE', 'TABLESAMPLE', 'TEMP', 'TEMPORARY', 'THEN', 'TIES', 'TO',
  'TRANSACTION', 'TRIGGER', 'TRUE', 'TRUNCATE', 'UNBOUNDED', 'UNION', 'UNIQUE', 'UNLOGGED',
  'UNPIVOT', 'UPDATE', 'USER', 'USING', 'VACUUM', 'VALUES', 'VIEW', 'WHEN', 'WHERE',
  'WHILE', 'WINDOW', 'WITH', 'WITHIN', 'WITHOUT',
]);

/** Tipos de dato. Se colorean aparte porque `dataTypeCase` los trata aparte. */
export const DATA_TYPES = new Set<string>([
  'ARRAY', 'BIGINT', 'BIGSERIAL', 'BINARY', 'BIT', 'BLOB', 'BOOL', 'BOOLEAN', 'BYTEA',
  'CHAR', 'CHARACTER', 'CIDR', 'CLOB', 'DATE', 'DATETIME', 'DATETIME2', 'DECIMAL',
  'DOUBLE', 'ENUM', 'FLOAT', 'GEOGRAPHY', 'GEOMETRY', 'INET', 'INT', 'INT2', 'INT4',
  'INT8', 'INTEGER', 'INTERVAL', 'JSON', 'JSONB', 'LONGBLOB', 'LONGTEXT', 'MACADDR',
  'MEDIUMINT', 'MEDIUMTEXT', 'MONEY', 'NCHAR', 'NUMERIC', 'NVARCHAR', 'PRECISION',
  'REAL', 'SERIAL', 'SET', 'SMALLINT', 'SMALLSERIAL', 'STRUCT', 'TEXT', 'TIME',
  'TIMESTAMP', 'TIMESTAMPTZ', 'TINYINT', 'TINYTEXT', 'UUID', 'VARBINARY', 'VARCHAR',
  'VARIANT', 'XML', 'YEAR',
]);

/** Funciones habituales; la detección real es "palabra seguida de (". */
export const FUNCTIONS = new Set<string>([
  'ABS', 'ARRAY_AGG', 'AVG', 'CEIL', 'CEILING', 'COALESCE', 'CONCAT', 'CONCAT_WS',
  'COUNT', 'CUME_DIST', 'CURRENT_DATE', 'CURRENT_TIMESTAMP', 'DATE_ADD', 'DATE_DIFF',
  'DATE_PART', 'DATE_TRUNC', 'DENSE_RANK', 'EXTRACT', 'FIRST_VALUE', 'FLOOR',
  'GENERATE_SERIES', 'GREATEST', 'GROUP_CONCAT', 'IFNULL', 'JSON_AGG', 'JSON_BUILD_OBJECT',
  'JSON_EXTRACT', 'LAG', 'LAST_VALUE', 'LEAD', 'LEAST', 'LENGTH', 'LOWER', 'LPAD',
  'LTRIM', 'MAX', 'MD5', 'MIN', 'NOW', 'NTH_VALUE', 'NTILE', 'NULLIF', 'PERCENTILE_CONT',
  'POSITION', 'POWER', 'RANDOM', 'RANK', 'REGEXP_REPLACE', 'REPLACE', 'ROUND',
  'ROW_NUMBER', 'RPAD', 'RTRIM', 'SPLIT_PART', 'SQRT', 'STDDEV', 'STRING_AGG',
  'STRPOS', 'SUBSTR', 'SUBSTRING', 'SUM', 'TO_CHAR', 'TO_DATE', 'TO_JSON', 'TO_NUMBER',
  'TO_TIMESTAMP', 'TRIM', 'UPPER', 'VARIANCE',
]);

/** Palabra con la que puede empezar una sentencia válida. */
export const STATEMENT_STARTERS = new Set<string>([
  'ALTER', 'ANALYZE', 'ATTACH', 'BEGIN', 'CALL', 'COMMENT', 'COMMIT', 'COPY', 'CREATE',
  'DEALLOCATE', 'DECLARE', 'DELETE', 'DESCRIBE', 'DETACH', 'DO', 'DROP', 'END',
  'EXECUTE', 'EXPLAIN', 'GRANT', 'INSERT', 'LOCK', 'MERGE', 'PRAGMA', 'PREPARE',
  'REFRESH', 'REINDEX', 'RELEASE', 'RENAME', 'REPLACE', 'RESET', 'REVOKE', 'ROLLBACK',
  'SAVEPOINT', 'SELECT', 'SET', 'SHOW', 'START', 'TRUNCATE', 'UPDATE', 'USE', 'VACUUM',
  'VALUES', 'WITH',
]);
