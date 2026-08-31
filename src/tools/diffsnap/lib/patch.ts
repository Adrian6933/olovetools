// ============================================================================
// Exports built from the edit script: a real unified patch, an HTML report and
// a plain-text summary. All three read the same ops the screen does, so what
// you download is exactly what you were looking at.
// ============================================================================

import type { DiffStats, Segment, UnifiedRow } from '../types';

export interface PatchOptions {
  nameA: string;
  nameB: string;
  /** Unchanged lines kept around each change. */
  context: number;
}

interface Chunk {
  aStart: number;
  aCount: number;
  bStart: number;
  bCount: number;
  lines: string[];
}

/**
 * A unified diff that `git apply` and `patch` actually accept: correct
 * `@@ -a,b +c,d @@` headers, a leading space on context lines, and the
 * "\ No newline at end of file" marker when it applies.
 */
export function toUnifiedPatch(
  rows: UnifiedRow[],
  options: PatchOptions,
  endsWithNewlineA = true,
  endsWithNewlineB = true
): string {
  const chunks: Chunk[] = [];
  let current: Chunk | null = null;
  let pendingContext: { text: string; aNum: number | null; bNum: number | null }[] = [];
  let trailing = 0;

  const flush = () => {
    if (current) chunks.push(current);
    current = null;
    pendingContext = [];
    trailing = 0;
  };

  for (const row of rows) {
    if (row.type === 'equal') {
      if (current) {
        if (trailing < options.context) {
          current.lines.push(` ${row.text}`);
          current.aCount++;
          current.bCount++;
          trailing++;
        } else {
          flush();
          pendingContext = [{ text: row.text, aNum: row.aNum, bNum: row.bNum }];
        }
      } else {
        pendingContext.push({ text: row.text, aNum: row.aNum, bNum: row.bNum });
        if (pendingContext.length > options.context) pendingContext.shift();
      }
      continue;
    }

    if (!current) {
      const first = pendingContext[0];
      const startA = first?.aNum ?? row.aNum ?? 1;
      const startB = first?.bNum ?? row.bNum ?? 1;
      current = { aStart: startA, aCount: 0, bStart: startB, bCount: 0, lines: [] };
      for (const line of pendingContext) {
        current.lines.push(` ${line.text}`);
        current.aCount++;
        current.bCount++;
      }
      pendingContext = [];
    }

    trailing = 0;
    if (row.type === 'delete') {
      current.lines.push(`-${row.text}`);
      current.aCount++;
    } else {
      current.lines.push(`+${row.text}`);
      current.bCount++;
    }
  }
  flush();

  if (chunks.length === 0) return '';

  const header = [`--- ${options.nameA}`, `+++ ${options.nameB}`];
  const body = chunks.map(chunk => {
    const lines = [...chunk.lines];
    return [
      `@@ -${chunk.aCount === 0 ? chunk.aStart - 1 : chunk.aStart},${chunk.aCount} ` +
        `+${chunk.bCount === 0 ? chunk.bStart - 1 : chunk.bStart},${chunk.bCount} @@`,
      ...lines,
    ].join('\n');
  });

  let text = [...header, ...body].join('\n');
  if (!endsWithNewlineA || !endsWithNewlineB) text += '\n\\ No newline at end of file';
  return `${text}\n`;
}

const escapeHtml = (text: string) =>
  text.replace(/[&<>"]/g, char =>
    char === '&' ? '&amp;' : char === '<' ? '&lt;' : char === '>' ? '&gt;' : '&quot;'
  );

function segmentsToHtml(text: string, segments: Segment[] | null): string {
  if (!segments || segments.length === 0) return escapeHtml(text) || '&nbsp;';
  return segments
    .map(segment =>
      segment.kind === 'equal'
        ? escapeHtml(segment.text)
        : `<mark class="${segment.kind}">${escapeHtml(segment.text)}</mark>`
    )
    .join('');
}

/** A single self-contained HTML file: no CSS host, no fonts, no scripts. */
export function toHtmlReport(
  rows: UnifiedRow[],
  stats: DiffStats,
  options: PatchOptions,
  title: string
): string {
  const body = rows
    .map(row => {
      const sign = row.type === 'delete' ? '-' : row.type === 'insert' ? '+' : ' ';
      return (
        `<tr class="${row.type}">` +
        `<td class="n">${row.aNum ?? ''}</td>` +
        `<td class="n">${row.bNum ?? ''}</td>` +
        `<td class="s">${sign}</td>` +
        `<td class="c">${segmentsToHtml(row.text, row.segs)}</td>` +
        `</tr>`
      );
    })
    .join('\n');

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
:root{color-scheme:dark}
body{margin:0;background:#050809;color:#e2e8f0;font:14px/1.5 system-ui,sans-serif}
main{max-width:1100px;margin:0 auto;padding:32px 16px}
h1{font-size:20px;margin:0 0 4px}
p.meta{color:#94a3b8;font-size:12px;margin:0 0 20px}
table{width:100%;border-collapse:collapse;font:12px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;
  background:#080f12;border:1px solid rgba(255,255,255,.08);border-radius:12px;overflow:hidden}
td{padding:0 8px;white-space:pre-wrap;word-break:break-word;vertical-align:top}
td.n{width:52px;text-align:right;color:#475569;user-select:none;background:rgba(0,0,0,.35)}
td.s{width:14px;text-align:center;user-select:none;color:#64748b}
tr.delete{background:rgba(136,19,55,.28);color:#fecdd3}
tr.insert{background:rgba(6,78,59,.28);color:#bbf7d0}
mark.delete{background:rgba(244,63,94,.35);color:#ffe4e6;border-radius:2px}
mark.insert{background:rgba(16,185,129,.35);color:#d1fae5;border-radius:2px}
</style></head><body><main>
<h1>${escapeHtml(title)}</h1>
<p class="meta">${escapeHtml(options.nameA)} → ${escapeHtml(options.nameB)} ·
+${stats.added + stats.modified} / −${stats.removed + stats.modified} ·
${(stats.similarity * 100).toFixed(1)}% identical</p>
<table><tbody>
${body}
</tbody></table></main></body></html>
`;
}

/** The one-paragraph version, for a commit message or a ticket. */
export function toSummary(stats: DiffStats, options: PatchOptions): string {
  return [
    `${options.nameA} → ${options.nameB}`,
    `lines: ${stats.linesA} → ${stats.linesB}`,
    `added: ${stats.added}`,
    `removed: ${stats.removed}`,
    `modified: ${stats.modified}`,
    `unchanged: ${stats.unchanged}`,
    `blocks: ${stats.hunks}`,
    `identical: ${(stats.similarity * 100).toFixed(1)}%`,
  ].join('\n');
}
