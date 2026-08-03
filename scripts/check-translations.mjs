#!/usr/bin/env node
/**
 * check-translations.mjs — Valida los archivos de src/locales/{lang}/{tool}.ts contra 'en'.
 *
 * Uso:
 *   node scripts/check-translations.mjs                  → resumen compacto (por defecto)
 *   node scripts/check-translations.mjs --lang es        → detalle de un idioma
 *   node scripts/check-translations.mjs --key footerCredit → corte transversal de una clave
 *   node scripts/check-translations.mjs --json out.json  → volcado máquina para apply-translations.mjs
 *
 * Detecta:
 *   1. Archivos faltantes (cada idioma debe tener los mismos archivos que en/)
 *   2. Claves faltantes o sobrantes vs. en (incluye arrays faq y objetos anidados)
 *   3. Valores "sin traducir": idénticos al inglés en idiomas no-ingleses
 *   4. Sospechosos ASCII: en ru/hi/ja/zh, textos largos 100% ASCII (probablemente inglés reescrito)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCALES = path.join(ROOT, 'src', 'locales');
const LANGS = ['en', 'es', 'fr', 'de', 'pt', 'ru', 'hi', 'ja', 'zh'];
const REF = 'en';
const NON_LATIN = new Set(['ru', 'hi', 'ja', 'zh']);

// Claves (segmento final de la ruta) que legítimamente pueden quedar igual que en inglés
const SKIP_KEYS = new Set(['title', 'emailAddress', 'languageName', 'seoHeroTitle']);
// Valores exactos permitidos aunque coincidan con el inglés (marcas y tecnicismos)
const ALLOW_VALUES = new Set([
  'oLoveTools', 'FAQ', 'OK', 'URL', 'PNG', 'JPG', 'JPEG', 'SVG', 'GIF', 'PDF', 'ZIP',
  'JSON', 'XML', 'SQL', 'CSV', 'HTML', 'CSS', 'RGB', 'HEX', 'HSL', 'CMYK', 'UUID',
  'QR', 'MP3', 'MP4', 'WebP', 'Base64', 'Markdown', 'Lorem Ipsum', 'Twitch', 'Kick',
  'TikTok', 'YouTube', 'Instagram', 'EXIF', 'SRT', 'VTT', 'Cron', 'Regex', 'Lottie',
  // Nombres de marca de las propias herramientas (no se traducen, aparecen en seoKeywords/seoTags)
  'Binary-Flow', 'Cron-Flow', 'Epoch-Flow', 'Klipy', 'PassBolt', 'Lorem-Flow',
  'Morse-Flow', 'SQL-Flow', 'Time-Bolt', 'Whiteboard-Flow', 'Whois-Bolt', 'XML-JSON',
  'UnitFlow', 'Device Test', 'CleanSnap', 'binary flow', 'cron flow', 'epoch flow',
  'lorem flow', 'morse flow', 'sql flow', 'time bolt', 'whiteboard flow', 'whois bolt',
  'device test', 'key doctor', 'subtitles bolt', 'passbolt', 'klipy', 'colorsnap',
  'cleansnap', 'xml json',
  // Nombres de fuentes tipográficas (nunca se traducen, son nombres propios)
  'Fira Code', 'JetBrains Mono', 'Source Code Pro', 'Geist Mono',
  // Especificaciones técnicas/formato internacionalmente estándar
  'MP4 HD', '1080P', 'ISO 8601',
  // Designaciones de resolución: son nombres de estándar, no se traducen
  'QHD (1440p)', 'Full HD (1080p)', 'HD (720p)',
]);
const EMAIL_OR_URL = /(@|https?:\/\/|www\.)/;
// Frases inglesas que no deberían aparecer literalmente en NINGÚN idioma no-inglés
// (detecta texto en inglés "residual" que difiere del valor actual de en/ pero sigue
// sin traducir — el chequeo simple de igualdad no lo detecta). Ver hallazgo de
// es/fr/de/pt/base64-bolt en la sesión de Fase 3.
const ENGLISH_LEFTOVER_PHRASES = [
  'your browser', 'your device', 'is sent to', 'never leaves', 'click to upload',
  'type or paste', 'paste a', 'result will appear',
  'no data is ever', 'runs locally', 'everything runs', 'all processing is',
];

// ---------- Carga ----------
function parseLocaleFile(filePath) {
  let src = fs.readFileSync(filePath, 'utf8');
  src = src.replace(/^﻿/, '').replace(/^\s*export\s+default\s*/, '').trim().replace(/;\s*$/, '');
  try {
    return JSON.parse(src);
  } catch {
    try {
      return new Function('return (' + src + ')')();
    } catch (e) {
      return { __parseError: e.message };
    }
  }
}

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (item && typeof item === 'object') flatten(item, `${key}.${i}`, out);
        else out[`${key}.${i}`] = item;
      });
    } else if (v && typeof v === 'object') {
      flatten(v, key, out);
    } else {
      out[key] = v;
    }
  }
  return out;
}

const leaf = (keyPath) => {
  const parts = keyPath.split('.');
  while (parts.length && /^\d+$/.test(parts[parts.length - 1])) parts.pop();
  return parts.pop() ?? keyPath;
};

// ---------- Análisis ----------
const refDir = path.join(LOCALES, REF);
const refFiles = fs.readdirSync(refDir).filter((f) => f.endsWith('.ts')).sort();

const refData = {}; // tool → flat map
for (const f of refFiles) {
  const parsed = parseLocaleFile(path.join(refDir, f));
  refData[f.replace(/\.ts$/, '')] = parsed.__parseError ? null : flatten(parsed);
}

// Unidades a comprobar: los 60 archivos por idioma + las traducciones legales
// (src/locales/legal/{lang}.ts) como pseudo-herramienta "(legal)"
const units = refFiles.map((f) => ({
  tool: f.replace(/\.ts$/, ''),
  pathFor: (lang) => path.join(LOCALES, lang, f),
}));
const LEGAL_DIR = path.join(LOCALES, 'legal');
if (fs.existsSync(path.join(LEGAL_DIR, `${REF}.ts`))) {
  const legalRef = parseLocaleFile(path.join(LEGAL_DIR, `${REF}.ts`));
  refData['(legal)'] = legalRef.__parseError ? null : flatten(legalRef);
  units.push({ tool: '(legal)', pathFor: (lang) => path.join(LEGAL_DIR, `${lang}.ts`) });
}

const report = {}; // lang → { missingFiles, parseErrors, missingKeys, extraKeys, untranslated, asciiSuspect }
for (const lang of LANGS) {
  if (lang === REF) continue;
  const r = (report[lang] = {
    missingFiles: [], parseErrors: [],
    missingKeys: {}, extraKeys: {},
    untranslated: {}, asciiSuspect: {},
  });
  for (const { tool, pathFor } of units) {
    const filePath = pathFor(lang);
    if (!fs.existsSync(filePath)) { r.missingFiles.push(tool); continue; }
    const parsed = parseLocaleFile(filePath);
    if (parsed.__parseError) { r.parseErrors.push(`${tool}: ${parsed.__parseError.slice(0, 80)}`); continue; }
    const flat = flatten(parsed);
    const ref = refData[tool];
    if (!ref) continue;

    for (const key of Object.keys(ref)) {
      if (!(key in flat)) (r.missingKeys[tool] ??= []).push(key);
    }
    for (const key of Object.keys(flat)) {
      if (!(key in ref)) (r.extraKeys[tool] ??= []).push(key);
    }
    for (const [key, val] of Object.entries(flat)) {
      if (typeof val !== 'string' || !(key in ref)) continue;
      const enVal = ref[key];
      if (SKIP_KEYS.has(leaf(key)) || ALLOW_VALUES.has(val) || EMAIL_OR_URL.test(val)) continue;
      if (val === enVal && val.length > 3 && /[a-zA-Z]/.test(val)) {
        (r.untranslated[tool] ??= {})[key] = enVal;
      } else if (NON_LATIN.has(lang) && /^[\x20-\x7E\s]+$/.test(val) && val.length > 15 && val.includes(' ')) {
        (r.asciiSuspect[tool] ??= {})[key] = val;
      } else {
        // Inglés "residual": el valor difiere del en/ actual (no es un simple "sin traducir")
        // pero sigue siendo texto en inglés de una versión anterior. Aplica a TODOS los
        // idiomas, incluidos los latinos (es/fr/de/pt), donde asciiSuspect no puede detectarlo.
        const lower = val.toLowerCase();
        if (ENGLISH_LEFTOVER_PHRASES.some((p) => lower.includes(p))) {
          (r.asciiSuspect[tool] ??= {})[key] = val;
        }
      }
    }
  }
}

// ---------- Salida ----------
const args = process.argv.slice(2);
const getArg = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const langFilter = getArg('--lang');
const keyFilter = getArg('--key');
const jsonOut = getArg('--json');

const countKeys = (byTool) => Object.values(byTool).reduce((n, v) => n + (Array.isArray(v) ? v.length : Object.keys(v).length), 0);

if (jsonOut) {
  const dump = {};
  for (const [lang, r] of Object.entries(report)) {
    if (langFilter && lang !== langFilter) continue;
    // missingKeys se vuelca como {clave: valorEnInglés} para poder traducir directamente
    const missingWithSource = {};
    for (const [tool, keys] of Object.entries(r.missingKeys)) {
      missingWithSource[tool] = Object.fromEntries(keys.map((k) => [k, refData[tool]?.[k] ?? null]));
    }
    dump[lang] = { untranslated: r.untranslated, asciiSuspect: r.asciiSuspect, missingKeys: missingWithSource, missingFiles: r.missingFiles };
  }
  fs.writeFileSync(jsonOut, JSON.stringify(dump, null, 2), 'utf8');
  console.log(`Volcado escrito en ${jsonOut}`);
  process.exit(0);
}

if (keyFilter) {
  console.log(`== Corte transversal de la clave "${keyFilter}" ==`);
  for (const [lang, r] of Object.entries(report)) {
    const tools = Object.entries(r.untranslated).filter(([, keys]) => Object.keys(keys).some((k) => k === keyFilter || leaf(k) === keyFilter)).map(([t]) => t);
    if (tools.length) console.log(`${lang}: ${tools.length} archivos → ${tools.slice(0, 15).join(', ')}${tools.length > 15 ? '…' : ''}`);
  }
  process.exit(0);
}

if (langFilter) {
  const r = report[langFilter];
  if (!r) { console.error(`Idioma desconocido: ${langFilter}`); process.exit(1); }
  console.log(`== Detalle ${langFilter} ==`);
  if (r.missingFiles.length) console.log(`Archivos faltantes: ${r.missingFiles.join(', ')}`);
  if (r.parseErrors.length) console.log(`No parseables:\n  ${r.parseErrors.join('\n  ')}`);
  for (const [section, data] of [['CLAVES FALTANTES', r.missingKeys], ['CLAVES SOBRANTES', r.extraKeys], ['SIN TRADUCIR', r.untranslated], ['ASCII SOSPECHOSO', r.asciiSuspect]]) {
    const tools = Object.keys(data);
    if (!tools.length) continue;
    console.log(`\n-- ${section} (${countKeys(data)} claves en ${tools.length} archivos) --`);
    for (const tool of tools.sort()) {
      const keys = Array.isArray(data[tool]) ? data[tool] : Object.keys(data[tool]);
      console.log(`  ${tool}: ${keys.join(', ')}`);
    }
  }
  process.exit(0);
}

// Resumen por defecto
console.log(`== RESUMEN i18n (referencia: ${REF}, ${units.length} archivos por idioma, incluye "(legal)") ==\n`);
console.log('Idioma | Falt.arch | No parse | Falt.claves | Sobrantes | Sin traducir | ASCII sosp. | Archivos afect.');
let totalIssues = 0;
for (const [lang, r] of Object.entries(report)) {
  const affected = new Set([...Object.keys(r.untranslated), ...Object.keys(r.missingKeys), ...Object.keys(r.asciiSuspect), ...r.missingFiles]);
  const unt = countKeys(r.untranslated), miss = countKeys(r.missingKeys), extra = countKeys(r.extraKeys), ascii = countKeys(r.asciiSuspect);
  totalIssues += unt + miss + r.missingFiles.length;
  console.log(`${lang.padEnd(6)} | ${String(r.missingFiles.length).padEnd(9)} | ${String(r.parseErrors.length).padEnd(8)} | ${String(miss).padEnd(11)} | ${String(extra).padEnd(9)} | ${String(unt).padEnd(12)} | ${String(ascii).padEnd(11)} | ${affected.size}`);
}

// Top de claves sin traducir repetidas entre idiomas/archivos
const keyCounts = new Map(); // leafKey → { count, sample }
for (const r of Object.values(report)) {
  for (const keys of Object.values(r.untranslated)) {
    for (const [key, enVal] of Object.entries(keys)) {
      const l = leaf(key);
      const cur = keyCounts.get(l) ?? { count: 0, sample: enVal };
      cur.count++;
      keyCounts.set(l, cur);
    }
  }
}
const top = [...keyCounts.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 10);
if (top.length) {
  console.log('\nTOP claves sin traducir (suma de todos los idiomas):');
  for (const [key, { count, sample }] of top) {
    console.log(`  ${key} ×${count}  "${String(sample).slice(0, 70)}${String(sample).length > 70 ? '…' : ''}"`);
  }
}
console.log(`\nTotal incidencias: ${totalIssues}. Usa --lang <xx> para detalle, --json <archivo> para volcado, --key <clave> para corte.`);
