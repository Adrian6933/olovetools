// ============================================================================
// Serialización de la paleta. Todo se genera bajo demanda: nada de esto corre
// mientras el usuario juega con los colores, solo cuando pulsa exportar o
// manda la paleta a otra herramienta.
// ============================================================================

import {
  formatHex,
  formatHsl,
  formatOklch,
  formatRgb,
  nearestTailwind,
  parseColor,
  rgbToOklch,
  type Rgb,
} from './color';

export type ExportFormat = 'css' | 'tailwind' | 'scss' | 'json' | 'svg' | 'png' | 'gpl' | 'txt';

export interface ExportEntry {
  /** Nombre estable del token (`brand-1`, `brand-2`…). */
  name: string;
  rgb: Rgb;
}

/** Nombra los colores por su token de Tailwind más cercano cuando hay uno
 *  claramente parecido; si no, cae a un índice. Un `--color-teal-500` dice más
 *  en una hoja de estilos que un `--color-3`. */
export const nameEntries = (colors: Rgb[]): ExportEntry[] => {
  const used = new Map<string, number>();
  return colors.map((rgb, i) => {
    const near = nearestTailwind(rgb);
    let base = near && near.deltaE < 0.05 ? near.name : `color-${i + 1}`;
    const seen = used.get(base) ?? 0;
    used.set(base, seen + 1);
    if (seen) base = `${base}-${seen + 1}`;
    return { name: base, rgb };
  });
};

const cssBlock = (entries: ExportEntry[]) =>
  entries.map((e) => `  --${e.name}: ${formatHex(e.rgb, true).toLowerCase()};`).join('\n');

export const toCss = (entries: ExportEntry[]): string =>
  `:root {\n${cssBlock(entries)}\n}\n\n/* oklch(), for wide-gamut displays */\n:root {\n${entries
    .map((e) => `  --${e.name}-oklch: ${formatOklch(e.rgb)};`)
    .join('\n')}\n}\n`;

export const toTailwind = (entries: ExportEntry[]): string =>
  `@theme {\n${entries.map((e) => `  --color-${e.name}: ${formatOklch(e.rgb)};`).join('\n')}\n}\n`;

export const toScss = (entries: ExportEntry[]): string =>
  entries.map((e) => `$${e.name}: ${formatHex(e.rgb, true).toLowerCase()};`).join('\n') + '\n';

export const toJson = (entries: ExportEntry[]): string =>
  JSON.stringify(
    entries.map((e) => {
      const { l, c, h } = rgbToOklch(e.rgb);
      return {
        name: e.name,
        hex: formatHex(e.rgb, true),
        rgb: formatRgb(e.rgb),
        hsl: formatHsl(e.rgb),
        oklch: formatOklch(e.rgb),
        channels: {
          r: Math.round(e.rgb.r),
          g: Math.round(e.rgb.g),
          b: Math.round(e.rgb.b),
          a: e.rgb.a,
        },
        oklchChannels: { l: +l.toFixed(4), c: +c.toFixed(4), h: +h.toFixed(2) },
      };
    }),
    null,
    2
  ) + '\n';

export const toTxt = (entries: ExportEntry[]): string =>
  entries.map((e) => formatHex(e.rgb, true)).join('\n') + '\n';

/** Paleta de GIMP/Inkscape/Krita: texto plano, lo entiende medio mundo. */
export const toGpl = (entries: ExportEntry[]): string =>
  `GIMP Palette\nName: oLoveTools palette\nColumns: ${Math.min(entries.length, 8)}\n#\n` +
  entries
    .map((e) => {
      const p = (n: number) => String(Math.round(n)).padStart(3, ' ');
      return `${p(e.rgb.r)} ${p(e.rgb.g)} ${p(e.rgb.b)}\t${e.name}`;
    })
    .join('\n') +
  '\n';

const SWATCH = 240;
const LABEL = 64;

export const toSvg = (entries: ExportEntry[]): string => {
  const w = SWATCH * entries.length;
  const h = SWATCH + LABEL;
  const cells = entries
    .map((e, i) => {
      const x = i * SWATCH;
      const hex = formatHex(e.rgb);
      // Etiqueta en blanco o negro según lo que se lea mejor sobre la muestra.
      const lum = rgbToOklch(e.rgb).l;
      const ink = lum > 0.62 ? '#000000' : '#ffffff';
      return `  <rect x="${x}" y="0" width="${SWATCH}" height="${SWATCH}" fill="${hex}"${
        e.rgb.a < 1 ? ` fill-opacity="${+e.rgb.a.toFixed(3)}"` : ''
      }/>
  <text x="${x + SWATCH / 2}" y="${SWATCH - 24}" font-family="monospace" font-size="26" fill="${ink}" text-anchor="middle">${hex}</text>
  <text x="${x + SWATCH / 2}" y="${SWATCH + 42}" font-family="sans-serif" font-size="24" fill="#94a3b8" text-anchor="middle">${e.name}</text>`;
    })
    .join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="#0b1220"/>
${cells}
</svg>
`;
};

export const toPngBlob = async (entries: ExportEntry[]): Promise<Blob | null> => {
  const w = SWATCH * entries.length;
  const h = SWATCH + LABEL;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = '#0b1220';
  ctx.fillRect(0, 0, w, h);
  entries.forEach((e, i) => {
    const x = i * SWATCH;
    ctx.fillStyle = formatRgb(e.rgb);
    ctx.fillRect(x, 0, SWATCH, SWATCH);
    ctx.textAlign = 'center';
    ctx.fillStyle = rgbToOklch(e.rgb).l > 0.62 ? '#000000' : '#ffffff';
    ctx.font = '26px monospace';
    ctx.fillText(formatHex(e.rgb), x + SWATCH / 2, SWATCH - 24);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '24px sans-serif';
    ctx.fillText(e.name, x + SWATCH / 2, SWATCH + 42);
  });
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
};

export interface SerializedPalette {
  blob: Blob;
  name: string;
  text?: string;
}

export const serializePalette = async (
  colors: Rgb[],
  format: ExportFormat
): Promise<SerializedPalette | null> => {
  if (!colors.length) return null;
  const entries = nameEntries(colors);

  if (format === 'png') {
    const blob = await toPngBlob(entries);
    return blob ? { blob, name: 'palette.png' } : null;
  }

  const table: Record<Exclude<ExportFormat, 'png'>, { text: string; mime: string; ext: string }> = {
    css: { text: toCss(entries), mime: 'text/css', ext: 'css' },
    tailwind: { text: toTailwind(entries), mime: 'text/css', ext: 'css' },
    scss: { text: toScss(entries), mime: 'text/x-scss', ext: 'scss' },
    json: { text: toJson(entries), mime: 'application/json', ext: 'json' },
    svg: { text: toSvg(entries), mime: 'image/svg+xml', ext: 'svg' },
    gpl: { text: toGpl(entries), mime: 'text/plain', ext: 'gpl' },
    txt: { text: toTxt(entries), mime: 'text/plain', ext: 'txt' },
  };
  const picked = table[format as Exclude<ExportFormat, 'png'>];
  const suffix = format === 'tailwind' ? 'theme' : 'palette';
  return {
    blob: new Blob([picked.text], { type: picked.mime }),
    name: `${suffix}.${picked.ext}`,
    text: picked.text,
  };
};

// ---------------------------------------------------------------------------
// Estado compartible en la URL
// ---------------------------------------------------------------------------

/** `?c=ff6347,0ea5e9&bg=ffffff` — corto, legible y pegable en un chat. */
export const encodeStateToHash = (colors: Rgb[], bg: Rgb): string => {
  const short = (c: Rgb) => formatHex(c, true).slice(1).toLowerCase();
  const params = new URLSearchParams();
  params.set('c', colors.map(short).join(','));
  params.set('bg', short(bg));
  return params.toString();
};

export const decodeStateFromSearch = (
  search: string
): { colors: Rgb[]; bg: Rgb | null } | null => {
  const params = new URLSearchParams(search);
  const raw = params.get('c');
  if (!raw) return null;
  const colors = raw
    .split(',')
    .map((token) => parseColor('#' + token.replace(/^#/, '')).rgb)
    .filter((c): c is Rgb => !!c);
  if (!colors.length) return null;
  const bgRaw = params.get('bg');
  const bg = bgRaw ? parseColor('#' + bgRaw.replace(/^#/, '')).rgb : null;
  return { colors, bg };
};
