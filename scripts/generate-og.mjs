#!/usr/bin/env node
/**
 * generate-og.mjs — Genera las imágenes og-{tool}.png (1200×630) que falten en public/.
 *
 * Uso: node scripts/generate-og.mjs [--force]
 *   --force  regenera también las que ya existen.
 *
 * Compone una plantilla con el color de marca de cada herramienta
 * (src/constants.ts → TOOL_THEME_COLORS) y su nombre (src/pages/[lang]/[tool]/index.astro
 * → toolNames), renderizada como SVG y convertida a PNG con sharp.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const LOCALES_EN = path.join(ROOT, 'src', 'locales', 'en');
const ASTRO_FILE = path.join(ROOT, 'src', 'pages', '[lang]', '[tool]', 'index.astro');
const CONSTANTS_FILE = path.join(ROOT, 'src', 'constants.ts');

const force = process.argv.includes('--force');

// ---------- Extraer TOOL_THEME_COLORS de constants.ts (TS -> objeto JS) ----------
function extractObjectLiteral(src, marker) {
  const start = src.indexOf(marker);
  if (start === -1) return {};
  const braceStart = src.indexOf('{', start);
  let depth = 0, i = braceStart;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) break; }
  }
  const objSrc = src.slice(braceStart, i + 1);
  return new Function('return (' + objSrc + ')')();
}

const constantsSrc = fs.readFileSync(CONSTANTS_FILE, 'utf8');
const TOOL_THEME_COLORS = extractObjectLiteral(constantsSrc, 'export const TOOL_THEME_COLORS');

const astroSrc = fs.readFileSync(ASTRO_FILE, 'utf8');
const toolNames = extractObjectLiteral(astroSrc, 'const toolNames');

// ---------- Lista de las 60 herramientas (excluye hub) ----------
const tools = fs
  .readdirSync(LOCALES_EN)
  .filter((f) => f.endsWith('.ts') && f !== 'hub.ts')
  .map((f) => f.replace(/\.ts$/, ''));

function escapeXml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
}

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : { r: 6, g: 6, b: 9 };
}

function darken({ r, g, b }, factor) {
  return `rgb(${Math.round(r * factor)},${Math.round(g * factor)},${Math.round(b * factor)})`;
}

function buildSvg(name, colorHex) {
  const rgb = hexToRgb(colorHex);
  const bright = `rgb(${rgb.r},${rgb.g},${rgb.b})`;
  const dark = darken(rgb, 0.25);
  const label = escapeXml(name);
  // Auto-shrink font size for long names so it never overflows the 1200px canvas.
  const fontSize = label.length > 22 ? 64 : label.length > 15 ? 78 : 96;

  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#060609"/>
        <stop offset="100%" stop-color="${dark}"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#bg)"/>
    <circle cx="1080" cy="80" r="260" fill="${bright}" opacity="0.12"/>
    <circle cx="60" cy="600" r="220" fill="${bright}" opacity="0.10"/>
    <rect x="80" y="80" width="88" height="88" rx="24" fill="${bright}"/>
    <path d="M124 122.35l-1.45-1.32C117.4 115.36 114 112.28 114 108.5c0-3.08 2.42-5.5 5.5-5.5 1.74 0 3.41.81 4.5 2.09 1.09-1.28 2.76-2.09 4.5-2.09 3.08 0 5.5 2.42 5.5 5.5 0 3.78-3.4 6.86-8.55 11.54L124 122.35z" fill="#fff" transform="translate(0 -10)"/>
    <text x="80" y="260" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="700" letter-spacing="6" fill="${bright}">OLOVETOOLS</text>
    <text x="78" y="${label.length > 22 ? 380 : 360}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="900" fill="#ffffff">${label}</text>
    <text x="80" y="440" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="500" fill="#94a3b8">Free · 100% Local · No Signup</text>
  </svg>`;
}

let generated = 0, skipped = 0;
for (const tool of tools) {
  const outPath = path.join(PUBLIC_DIR, `og-${tool}.png`);
  if (fs.existsSync(outPath) && !force) { skipped++; continue; }
  const name = toolNames[tool] || tool;
  const color = TOOL_THEME_COLORS[tool] || TOOL_THEME_COLORS.default || '#6366f1';
  const svg = buildSvg(name, color);
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  generated++;
}

console.log(`OG images: ${generated} generadas, ${skipped} ya existían (usa --force para regenerarlas todas). Total herramientas: ${tools.length}.`);
