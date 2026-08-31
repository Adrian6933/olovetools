// Genera src/tools/hex-to-rgb/lib/tailwind-palette.ts a partir del theme.css real
// de tailwindcss instalado. Cero valores inventados: la fuente es node_modules.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const css = fs.readFileSync(path.join(ROOT, 'node_modules/tailwindcss/theme.css'), 'utf8');

// --- oklch -> sRGB (misma matemática que lib/color.ts) ---
const OK_M2_INV = [
  [1.0, 0.3963377773761749, 0.2158037573099136],
  [1.0, -0.1055613458156586, -0.0638541728258133],
  [1.0, -0.0894841775298119, -1.2914855480194092],
];
const LMS_TO_LRGB = [
  [4.0767416621, -3.3077115913, 0.2309699292],
  [-1.2684380046, 2.6097574011, -0.3413193965],
  [-0.0041960863, -0.7034186147, 1.707614701],
];
const linearToSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

function oklchToRgb(L, C, H) {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);
  const lab = [L, a, b];
  const lms = OK_M2_INV.map((row) => row[0] * lab[0] + row[1] * lab[1] + row[2] * lab[2]);
  const lms3 = lms.map((v) => v * v * v);
  const lrgb = LMS_TO_LRGB.map((row) => row[0] * lms3[0] + row[1] * lms3[1] + row[2] * lms3[2]);
  return lrgb.map((v) => Math.round(Math.min(1, Math.max(0, linearToSrgb(v))) * 255));
}

const toHex = ([r, g, b]) =>
  '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();

const entries = [];
const re = /^\s*--color-([a-z]+)-(\d+):\s*oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)\)/gm;
let m;
while ((m = re.exec(css))) {
  const [, family, shade, l, c, h] = m;
  const rgb = oklchToRgb(parseFloat(l) / 100, parseFloat(c), parseFloat(h));
  entries.push({ name: `${family}-${shade}`, hex: toHex(rgb) });
}
entries.push({ name: 'black', hex: '#000000' });
entries.push({ name: 'white', hex: '#FFFFFF' });

const body = entries.map((e) => `  ['${e.name}', 0x${e.hex.slice(1).toLowerCase()}],`).join('\n');

const out = `// AUTOGENERADO desde node_modules/tailwindcss/theme.css — no editar a mano.
// Regenerar: node scripts/gen-tw-palette.mjs (los valores oklch() del tema oficial
// convertidos a sRGB de 8 bits, que es lo que el navegador acaba pintando).
// ${entries.length} tokens.

/** [token, 0xRRGGBB] */
export const TAILWIND_PALETTE: ReadonlyArray<readonly [string, number]> = [
${body}
];
`;

const dest = path.join(ROOT, 'src/tools/hex-to-rgb/lib/tailwind-palette.ts');
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, out, 'utf8');
console.log(`OK ${entries.length} tokens ->`, dest);
console.log('muestras:', entries.slice(0, 3), entries.find((e) => e.name === 'teal-500'), entries.find((e) => e.name === 'red-500'));
