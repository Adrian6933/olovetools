// ============================================================================
// Exports
// ----------------------------------------------------------------------------
// The old tool offered one .txt and one CSS block, and both had the tool name
// hardcoded in English with a mojibake em dash baked into the source file.
// ============================================================================

import { nameColor, rgbToHex, rgbToHsl, rgbToOklch, readableInk, type RGB } from './color';
import type { Swatch } from './quantize';

export type ExportFormat = 'css' | 'scss' | 'tailwind' | 'json' | 'gpl' | 'svg' | 'text';

export const EXPORT_EXTENSION: Record<ExportFormat, string> = {
  css: 'css',
  scss: 'scss',
  tailwind: 'css',
  json: 'json',
  gpl: 'gpl',
  svg: 'svg',
  text: 'txt',
};

export const EXPORT_MIME: Record<ExportFormat, string> = {
  css: 'text/css',
  scss: 'text/plain',
  tailwind: 'text/css',
  json: 'application/json',
  gpl: 'text/plain',
  svg: 'image/svg+xml',
  text: 'text/plain',
};

/** `deep-teal`, `vivid-orange`… Used as the variable name so the export reads
 *  as something a human wrote, not `--color-4`. Collisions get a numeric tail. */
export function slugFor(c: RGB, taken: Set<string>): string {
  const { hue, tone } = nameColor(c);
  const base = tone ? `${tone}-${hue}` : hue;
  if (!taken.has(base)) {
    taken.add(base);
    return base;
  }
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  const name = `${base}-${n}`;
  taken.add(name);
  return name;
}

function slugs(colors: RGB[]): string[] {
  const taken = new Set<string>();
  return colors.map(c => slugFor(c, taken));
}

export function buildExport(
  format: ExportFormat,
  swatches: Swatch[],
  sourceName: string
): string {
  const names = slugs(swatches);
  const hexes = swatches.map(c => rgbToHex(c.r, c.g, c.b));

  switch (format) {
    case 'css':
      return [
        `/* Palette from ${sourceName} — oLoveTools ColorSnap */`,
        ':root {',
        ...swatches.map((c, i) => `  --${names[i]}: ${hexes[i]};`),
        '}',
      ].join('\n');

    case 'scss':
      return [
        `// Palette from ${sourceName} — oLoveTools ColorSnap`,
        ...swatches.map((c, i) => `$${names[i]}: ${hexes[i]};`),
        '',
        '$palette: (',
        ...swatches.map((c, i) => `  "${names[i]}": $${names[i]},`),
        ');',
      ].join('\n');

    case 'tailwind':
      // Tailwind v4 reads its theme from CSS, not from a JS config file.
      return [
        `/* Palette from ${sourceName} — oLoveTools ColorSnap */`,
        '@theme {',
        ...swatches.map((c, i) => `  --color-${names[i]}: ${hexes[i]};`),
        '}',
      ].join('\n');

    case 'json':
      return JSON.stringify(
        {
          source: sourceName,
          generator: 'oLoveTools ColorSnap',
          colors: swatches.map((c, i) => {
            const hsl = rgbToHsl(c.r, c.g, c.b);
            const lch = rgbToOklch(c.r, c.g, c.b);
            return {
              name: names[i],
              hex: hexes[i],
              rgb: [c.r, c.g, c.b],
              hsl: [hsl.h, hsl.s, hsl.l],
              oklch: [Number(lch.l.toFixed(4)), Number(lch.c.toFixed(4)), Number(lch.h.toFixed(1))],
              share: Number((c.share * 100).toFixed(2)),
            };
          }),
        },
        null,
        2
      );

    case 'gpl':
      // GIMP / Inkscape / Krita palette. Fixed-width columns are part of the
      // format; the parsers in those apps are not tolerant about it.
      return [
        'GIMP Palette',
        `Name: ${sourceName}`,
        'Columns: 0',
        '#',
        ...swatches.map(
          (c, i) =>
            `${String(c.r).padStart(3)} ${String(c.g).padStart(3)} ${String(c.b).padStart(3)}\t${names[i]}`
        ),
      ].join('\n');

    case 'svg': {
      const w = 160;
      const h = 220;
      const cells = swatches
        .map((c, i) => {
          const ink = readableInk(c);
          const inkHex = rgbToHex(ink.r, ink.g, ink.b);
          return [
            `  <g transform="translate(${i * w},0)">`,
            `    <rect width="${w}" height="${h}" fill="${hexes[i]}"/>`,
            `    <text x="16" y="${h - 44}" font-family="monospace" font-size="18" font-weight="bold" fill="${inkHex}">${hexes[i]}</text>`,
            `    <text x="16" y="${h - 22}" font-family="sans-serif" font-size="12" fill="${inkHex}" opacity="0.72">${names[i]}</text>`,
            '  </g>',
          ].join('\n');
        })
        .join('\n');
      return [
        `<svg xmlns="http://www.w3.org/2000/svg" width="${w * swatches.length}" height="${h}" viewBox="0 0 ${w * swatches.length} ${h}">`,
        cells,
        '</svg>',
      ].join('\n');
    }

    case 'text':
    default:
      return [
        `Palette from ${sourceName}`,
        'Generated with oLoveTools ColorSnap',
        '',
        ...swatches.map(
          (c, i) =>
            `${String(i + 1).padStart(2)}. ${hexes[i]}  rgb(${c.r}, ${c.g}, ${c.b})  ${names[i]}  ${(c.share * 100).toFixed(1)}%`
        ),
      ].join('\n');
  }
}

/**
 * Renders the palette as a PNG sheet. This is what travels to the next tool in
 * the suite, and what people drop into a moodboard.
 */
export async function paletteSheet(swatches: Swatch[], sourceName: string): Promise<Blob | null> {
  if (swatches.length === 0) return null;

  const cell = 260;
  const height = 360;
  const footer = 56;
  const canvas = document.createElement('canvas');
  canvas.width = cell * swatches.length;
  canvas.height = height + footer;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#0a0204';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const names = slugs(swatches);

  swatches.forEach((c, i) => {
    const hex = rgbToHex(c.r, c.g, c.b);
    const ink = readableInk(c);
    const inkHex = rgbToHex(ink.r, ink.g, ink.b);

    ctx.fillStyle = hex;
    ctx.fillRect(i * cell, 0, cell, height);

    ctx.fillStyle = inkHex;
    ctx.globalAlpha = 1;
    ctx.font = 'bold 30px ui-monospace, "SFMono-Regular", Menlo, monospace';
    ctx.fillText(hex, i * cell + 24, height - 76);

    ctx.globalAlpha = 0.72;
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText(names[i], i * cell + 24, height - 46);
    ctx.fillText(`${(c.share * 100).toFixed(1)}%`, i * cell + 24, height - 24);
    ctx.globalAlpha = 1;
  });

  ctx.fillStyle = '#f43f5e';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('ColorSnap', 24, height + 36);
  ctx.fillStyle = '#64748b';
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText(sourceName, 150, height + 36);

  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

export function download(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** `sunset.heic` → `sunset-palette` */
export function paletteBaseName(sourceName: string): string {
  const dot = sourceName.lastIndexOf('.');
  const stem = dot > 0 ? sourceName.slice(0, dot) : sourceName || 'palette';
  return `${stem.replace(/[^\w.-]+/g, '-').slice(0, 48)}-palette`;
}
