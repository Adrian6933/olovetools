// ============================================================================
// Serialización de resultados para copiar, descargar y encadenar con el resto
// de la suite (src/lib/handoff.ts). Nada de esto toca la red.
// ============================================================================

import { type FormatOptions, format, type Rational } from './rational';
import type { Category, Unit } from './units';

export type ExportFormat = 'csv' | 'tsv' | 'json' | 'txt' | 'md';

export interface ResultRow {
  /** Texto tal cual lo escribió el usuario, cuando viene del modo lote. */
  source?: string;
  unit: Unit;
  value: Rational;
}

export interface ExportContext {
  category: Category;
  /** Nombre visible de una unidad, ya traducido. */
  unitName: (unit: Unit) => string;
  fmt: FormatOptions;
}

const escapeCsv = (s: string): string => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

export function serialize(rows: ResultRow[], kind: ExportFormat, ctx: ExportContext): string {
  const value = (row: ResultRow) => format(row.value, ctx.fmt);

  switch (kind) {
    case 'json':
      return JSON.stringify(
        {
          category: ctx.category.id,
          base: ctx.category.baseSymbol,
          results: rows.map(row => ({
            ...(row.source ? { source: row.source } : {}),
            unit: row.unit.id,
            symbol: row.unit.symbol,
            name: ctx.unitName(row.unit),
            value: value(row),
            ...(row.unit.approx ? { approximate: true } : {}),
          })),
        },
        null,
        2
      );

    case 'tsv':
    case 'csv': {
      const sep = kind === 'csv' ? ',' : '\t';
      const head = [...(rows.some(r => r.source) ? ['input'] : []), 'unit', 'symbol', 'value'];
      const lines = [head.join(sep)];
      for (const row of rows) {
        const cells = [
          ...(rows.some(r => r.source) ? [row.source || ''] : []),
          ctx.unitName(row.unit),
          row.unit.symbol,
          value(row),
        ];
        lines.push(cells.map(c => (kind === 'csv' ? escapeCsv(c) : c.replace(/\t/g, ' '))).join(sep));
      }
      return lines.join('\n');
    }

    case 'md': {
      const withSource = rows.some(r => r.source);
      const head = withSource ? '| Input | Unit | Value |' : '| Unit | Value |';
      const rule = withSource ? '| --- | --- | ---: |' : '| --- | ---: |';
      const body = rows.map(row =>
        withSource
          ? `| ${row.source || ''} | ${ctx.unitName(row.unit)} (${row.unit.symbol}) | ${value(row)} |`
          : `| ${ctx.unitName(row.unit)} (${row.unit.symbol}) | ${value(row)} |`
      );
      return [head, rule, ...body].join('\n');
    }

    default:
      return rows
        .map(row => `${value(row)} ${row.unit.symbol}${row.source ? `  ← ${row.source}` : ''}`)
        .join('\n');
  }
}

export const MIME: Record<ExportFormat, string> = {
  csv: 'text/csv',
  tsv: 'text/tab-separated-values',
  json: 'application/json',
  txt: 'text/plain',
  md: 'text/markdown',
};

export function toBlob(rows: ResultRow[], kind: ExportFormat, ctx: ExportContext): Blob {
  return new Blob([serialize(rows, kind, ctx)], { type: `${MIME[kind]};charset=utf-8` });
}

export const fileName = (category: Category, kind: ExportFormat): string =>
  `unitflow-${category.id}.${kind}`;
