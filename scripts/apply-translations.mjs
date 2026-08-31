#!/usr/bin/env node
/**
 * apply-translations.mjs — Aplica traducciones en masa a src/locales/{lang}/{tool}.ts
 * sin necesidad de abrir los archivos a mano.
 *
 * Uso:
 *   node scripts/apply-translations.mjs <traducciones.json> [--dry]
 *
 * Formato del JSON de entrada:
 * {
 *   "es": {
 *     "entropy-bolt":  { "footerCredit": "Parte de la suite oLoveTools" },
 *     "*":         { "footerCredit": "Parte de la suite oLoveTools" }
 *   },
 *   "fr": { ... }
 * }
 *
 * - Clave de herramienta "*": aplica esa traducción a TODOS los archivos del idioma
 *   donde la clave exista Y su valor actual sea idéntico al inglés (siga sin traducir).
 *   Ideal para claves globales repetidas (footerCredit, etc.).
 * - Las rutas de clave anidadas usan puntos: "faq.0.question".
 * - Con --dry solo informa, no escribe nada.
 *
 * Escritura: se re-serializa el objeto completo como JSON con 2 espacios
 * (`export default {...};`) en utf8. Los archivos de locales de este repo son
 * JSON-like puros (verificado sobre los 540), así que no se pierde nada.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCALES = path.join(ROOT, 'src', 'locales');
const REF = 'en';

const [inputPath, ...flags] = process.argv.slice(2);
const dry = flags.includes('--dry');
if (!inputPath) {
  console.error('Uso: node scripts/apply-translations.mjs <traducciones.json> [--dry]');
  process.exit(1);
}

function parseLocaleFile(filePath) {
  let src = fs.readFileSync(filePath, 'utf8');
  src = src.replace(/^﻿/, '').replace(/^\s*export\s+default\s*/, '').trim().replace(/;\s*$/, '');
  try { return JSON.parse(src); }
  catch { return new Function('return (' + src + ')')(); }
}

function getByPath(obj, keyPath) {
  return keyPath.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
function setByPath(obj, keyPath, value) {
  // Crea contenedores intermedios si faltan (array si el siguiente segmento es
  // numérico, objeto si no). Los errores de tipeo generan "claves sobrantes"
  // que el checker reporta después — esa es la red de seguridad.
  const parts = keyPath.split('.');
  let o = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (o[p] == null) o[p] = /^\d+$/.test(parts[i + 1]) ? [] : {};
    o = o[p];
    if (typeof o !== 'object') return false;
  }
  o[parts[parts.length - 1]] = value;
  return true;
}

function writeLocaleFile(filePath, obj) {
  fs.writeFileSync(filePath, 'export default ' + JSON.stringify(obj, null, 2) + ';\n', 'utf8');
}

// La pseudo-herramienta "(legal)" apunta a src/locales/legal/{lang}.ts
function localePathFor(lang, tool) {
  return tool === '(legal)'
    ? path.join(LOCALES, 'legal', `${lang}.ts`)
    : path.join(LOCALES, lang, `${tool}.ts`);
}

const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
let filesChanged = 0, keysApplied = 0, keysSkipped = [];

for (const [lang, tools] of Object.entries(input)) {
  const langDir = path.join(LOCALES, lang);
  if (!fs.existsSync(langDir)) { console.error(`Idioma inexistente: ${lang} — omitido`); continue; }

  // Expandir el comodín "*" a la lista real de archivos afectados (incluye "(legal)")
  const jobs = new Map(); // tool → { keyPath: value }
  for (const [tool, entries] of Object.entries(tools)) {
    if (tool !== '*') {
      jobs.set(tool, { ...(jobs.get(tool) ?? {}), ...entries });
      continue;
    }
    const wildcardTools = fs.readdirSync(langDir).filter((x) => x.endsWith('.ts')).map((f) => f.replace(/\.ts$/, ''));
    if (fs.existsSync(localePathFor(lang, '(legal)'))) wildcardTools.push('(legal)');
    for (const t of wildcardTools) {
      const refPath = localePathFor(REF, t);
      if (!fs.existsSync(refPath)) continue;
      const cur = parseLocaleFile(localePathFor(lang, t));
      const ref = parseLocaleFile(refPath);
      const applicable = {};
      for (const [keyPath, value] of Object.entries(entries)) {
        const curVal = getByPath(cur, keyPath);
        const refVal = getByPath(ref, keyPath);
        // Solo si la clave existe y sigue sin traducir (idéntica al inglés)
        if (typeof curVal === 'string' && curVal === refVal) applicable[keyPath] = value;
      }
      if (Object.keys(applicable).length) jobs.set(t, { ...(jobs.get(t) ?? {}), ...applicable });
    }
  }

  for (const [tool, entries] of jobs.entries()) {
    const filePath = localePathFor(lang, tool);
    if (!fs.existsSync(filePath)) { keysSkipped.push(`${lang}/${tool}: archivo no existe`); continue; }
    const obj = parseLocaleFile(filePath);
    let changed = false;
    for (const [keyPath, value] of Object.entries(entries)) {
      if (setByPath(obj, keyPath, value)) { keysApplied++; changed = true; }
      else keysSkipped.push(`${lang}/${tool}: clave "${keyPath}" no encontrada`);
    }
    if (changed) {
      filesChanged++;
      if (!dry) writeLocaleFile(filePath, obj);
    }
  }
}

console.log(`${dry ? '[DRY RUN] ' : ''}Archivos modificados: ${filesChanged} | Claves aplicadas: ${keysApplied} | Omitidas: ${keysSkipped.length}`);
if (keysSkipped.length) keysSkipped.slice(0, 20).forEach((s) => console.log('  - ' + s));
if (!dry && filesChanged) console.log('Verifica con: node scripts/check-translations.mjs && npx astro check');
