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
// `keys` es el nombre físico de una tecla dentro de una lista de atajos
// ("Del", "Ctrl+Z", "A / D"): es lo que está impreso en el teclado del usuario,
// no una etiqueta traducible. La descripción del atajo sí se traduce (`label`).
// `paste_placeholder` es un fragmento de JSON de ejemplo dentro de un textarea:
// código literal, no prosa, así que es idéntico en los nueve idiomas.
// `placeholder_input` (hex-to-rgb) es la misma clase de caso que
// `paste_placeholder`: una muestra literal de sintaxis CSS dentro de un input
// ("#FF6347, rebeccapurple, oklch(70% 0.15 30)"), no prosa traducible.
/** Nombres de unidad del catálogo de UnitFlow: `u_meter`, `u_psi`, `u_mmhg`… */
const UNIT_NAME_KEY = /^u_[a-z0-9_]+$/;
// `d_clauseOrder` (cron-flow) no es prosa: es la lista de cláusulas que arma la
// descripción legible ("time,day,month,weekday,year"). Cada idioma la reordena
// —japonés y chino leen año → mes → día → hora—, pero las lenguas latinas y
// germánicas comparten legítimamente el orden inglés. `d_weekdayGenders` es la
// misma clase de caso: la lista de géneros gramaticales de los siete días
// ("n,m,m,f,m,f,f" en ruso), que en los idiomas sin concordancia queda toda en
// masculino y por tanto idéntica al inglés. `stamp_format` es el patrón de
// fecha de cada ejecución ("{wd} {d} {mo} {y} · {t}"): japonés y chino lo
// reordenan a año-mes-día, pero las lenguas latinas comparten legítimamente el
// patrón inglés.
// `acceptedHint` (pastesnap) es la lista de formatos aceptados
// ("PNG · JPG · WebP · AVIF · GIF · HEIC · TIFF · SVG"): nombres de formato
// separados por puntos, no prosa, asi que es identica en los nueve idiomas.
const SKIP_KEYS = new Set(['title', 'acceptedHint', 'emailAddress', 'languageName', 'seoHeroTitle', 'keys', 'paste_placeholder', 'placeholder_input', 'd_clauseOrder', 'd_weekdayGenders', 'stamp_format', 'batch_placeholder']);
// Valores exactos permitidos aunque coincidan con el inglés (marcas y tecnicismos)
const ALLOW_VALUES = new Set([
  'oLoveTools', 'FAQ', 'OK', 'URL', 'PNG', 'JPG', 'JPEG', 'SVG', 'GIF', 'PDF', 'ZIP',
  'JSON', 'XML', 'SQL', 'CSV', 'HTML', 'CSS', 'RGB', 'HEX', 'HSL', 'CMYK', 'UUID',
  'QR', 'MP3', 'MP4', 'WebP', 'Base64', 'Markdown', 'Lorem Ipsum', 'Twitch', 'Kick',
  // Nombres de familias tipograficas (CodeCard): son marcas, no se traducen
  'JetBrains Mono', 'Fira Code', 'Source Code Pro', 'IBM Plex Mono',
  'TikTok', 'YouTube', 'Instagram', 'EXIF', 'SRT', 'VTT', 'Cron', 'Regex', 'Lottie',
  // Nombres de marca de las propias herramientas (no se traducen, aparecen en seoKeywords/seoTags)
  'Binary-Flow', 'Cron-Flow', 'Epoch-Flow', 'Klipy', 'Entropy-Bolt', 'Lorem-Flow',
  'Morse-Flow', 'SQL-Flow', 'Time-Bolt', 'Whiteboard-Flow', 'Whois-Bolt', 'XML-JSON',
  'UnitFlow', 'Device Test', 'CleanSnap', 'binary flow', 'cron flow', 'epoch flow',
  'lorem flow', 'morse flow', 'sql flow', 'time bolt', 'whiteboard flow', 'whois bolt',
  'device test', 'key doctor', 'subtitles bolt', 'entropy-bolt', 'klipy', 'colorsnap',
  'cleansnap', 'xml json',
  // Nombres de fuentes tipográficas (nunca se traducen, son nombres propios)
  'Fira Code', 'JetBrains Mono', 'Source Code Pro', 'Geist Mono',
  // Especificaciones técnicas/formato internacionalmente estándar
  'MP4 HD', '1080P', 'ISO 8601',
  // Tecnicismos que no se traducen en ningún idioma latino/germánico
  'JSONPath', 'JSON Lines', 'JSON Schema', 'Worker', 'XML ⇄ JSON',
  // SQL-Flow: sintaxis SQL literal (no es prosa) y tecnicismos que se usan
  // en inglés en los nueve idiomas. 'Tables' además coincide en francés.
  'AND / OR', 'SELECT *', 'Joins', 'CTE', 'CTEs', 'Tables',
  // XML-JSON: nombres de tecnologia y de formato (XPath y CDATA se escriben
  // igual en los nueve idiomas), las dos etiquetas de direccion (que son
  // simbolos, no prosa) y las palabras que coinciden con el ingles en frances
  // y en aleman ("Options", "Arrays").
  'XPath', 'CDATA', 'cdata', 'worker', 'XML → JSON', 'JSON → XML', 'Arrays', 'Options',
  // JWTBolt: nomenclatura de la especificacion JWT (RFC 7519) y palabras que
  // coinciden con el ingles en frances, castellano y portugues ("payload",
  // "signature", "secret", "audience" se usan tal cual en los tres).
  'payload', 'signature', 'Secret (base64)', 'Secret (hex)', 'Audience (aud)',
  'json web token', 'jwks', 'hs256 rs256', 'jwt debugger', 'jwt claims',
  // FrameSnap: "Format" se escribe igual en ingles, frances y aleman.
  'Format',
  // MorseFlow: "Morse" y "Prosigns" se escriben igual en los idiomas latinos y
  // germanicos, "Farnsworth" es un apellido y "source" es palabra francesa.
  'Morse', 'Prosigns', 'farnsworth', 'source',
  // Base64Bolt: el alfabeto es un literal (los caracteres impresos, no prosa),
  // y "Padding"/"Payload" son los términos que se usan tal cual en las lenguas
  // latinas y germánicas cuando se habla de codificación.
  // ("Alphabet" se escribe igual en inglés, francés y alemán.)
  'A-Z a-z 0-9 + /', 'Padding =', 'Payload', 'Alphabet',
  // CronFlow: nombres de plataforma y de sintaxis que la gente busca en latín
  // en los nueve idiomas (nadie busca "systemd oncalendar" traducido), más las
  // palabras que coinciden de verdad con el inglés en francés ("Expression",
  // "Minute") y en alemán ("Minute", "April", "August", "September",
  // "November").
  // SubtitlesBolt: nombres de norma de emisión (marcas) y "Timing", que en
  // alemán se escribe igual que en inglés.
  'Netflix', 'BBC', 'Timing',
  // "Contact" se escribe igual en frances que en ingles.
  'Contact',
  'quartz cron', 'github actions cron', 'aws eventbridge cron', 'systemd oncalendar',
  'kubernetes cronjob', 'crontab', 'Expression', 'Minute', 'April', 'August',
  'September', 'November',
  // Nombres de notación y de algoritmos de hash: no se traducen en ningún idioma
  'Base64URL', 'Hash A', 'Hash B', 'BLAKE3 online',
  // Aspect Ratio: nomenclatura de cine y de composicion que no se traduce en
  // ningun idioma (IMAX es una marca; letterbox/pillarbox y "scope" son los
  // terminos que usa la industria tal cual), mas las palabras que son
  // identicas en ingles y en las lenguas latinas/germanicas.
  'IMAX', 'letterbox', 'pillarbox', 'Reels, Stories, Shorts, TikTok',
  'Decimal', 'Orientation', 'Portrait', 'Multiple', 'Cinema', 'Megapixels',
  'transparent', 'Scope', 'Open Graph',
  'Code', 'Type', 'Types',
  // Nombres de tecnologías/formatos que no se traducen en ningún idioma
  // (etiquetas cortas de pestañas en el generador de snippets de Lottie Viewer)
  'React', 'JS', 'Web', 'WebM', 'Bodymovin', 'dotLottie', 'After Effects Bodymovin',
  'Video (WebM)',
  // Cognados exactos en varios idiomas latinos/germánicos
  'Inspector', 'Version', 'Dimensions',
  // UnitFlow: "Angle", "Force" y "Notation" son literalmente la palabra
  // francesa; traducirlas de otra forma seria inventarse un sinonimo peor.
  // `batch_placeholder` va en SKIP_KEYS porque es una muestra literal de lo que
  // se pega en el textarea ("1 / 2.5 / 3/4 / 12 km"): cifras y un simbolo de
  // unidad, no prosa.
  'Angle', 'Force', 'Notation',
  // Convenciones de código y nombres de fórmulas de legibilidad: son nombres
  // propios de sus autores o acrónimos, no se traducen en ningún idioma
  'camelCase', 'SMOG', 'Gunning Fog', 'Coleman–Liau', 'Fernández Huerta',
  // Cognados exactos en es/fr/de/pt (etiquetas de una sola palabra)
  'Auto', 'Formal', 'Document', 'Standard', 'Neutral', 'Text',
  // HtmlSanitizer: "Strict" se escribe igual en francés, y los términos de
  // búsqueda de SEO en alemán son los ingleses (un alemán busca "html
  // sanitizer", no "HTML-Bereiniger"): traducirlos perdería el tráfico.
  // "dompurify" es el nombre de la librería.
  'Strict', 'html sanitizer', 'html cleaner', 'dompurify online', 'DOMPurify',
  // Designaciones de resolución: son nombres de estándar, no se traducen
  'QHD (1440p)', 'Full HD (1080p)', 'HD (720p)',
  // Bitrates y formatos de audio: notación internacional idéntica en todos los idiomas
  'WAV', '96 kbps', '48 kbps',
  // Palabras que coinciden de verdad con el inglés en fr/de/pt (no son un olvido)
  'Volume', 'Script', 'Pause', 'Dithering',
  // Idem: cognados exactos en es/fr/de/pt (modo de fusión "Normal", "Original",
  // "Centre" en francés, "Rotation" en francés, "Export" en fr/de, "Banner" en alemán)
  'Normal', 'Original', 'Centre', 'Rotation', 'Export', 'Banner',
  // Idem con la etiqueta del lado A de un diff, y "Syntax" en alemán
  'Original (A)', 'Syntax',
  // FaviconBolt: "Emoji", "Image" (fr) y "Zoom" son la palabra real en es/fr/de/pt;
  // "Squircle" es el nombre técnico de la superelipse (no se traduce en ningún
  // idioma) y "apple touch icon" es el nombre literal del rel de HTML.
  'Emoji', 'Image', 'Zoom', 'Squircle', 'apple touch icon',
  // EXIF Cleaner: "Manual" es la palabra real en es/pt y "Altitude" en fr/pt;
  // coinciden con el inglés porque son cognados exactos, no por estar sin traducir.
  'Manual', 'Altitude',
  // ZipFlow: "Deflate" es el nombre del algoritmo del formato ZIP (no se traduce
  // en ningún idioma); "Compression" es la palabra francesa real, y "Archive"
  // ("archive" en fr) y "Name" (alemán) son cognados exactos.
  'Deflate', 'Compression', 'Archive', 'Name',
  // MarkdownLive: "Editor" (es/pt/de), "Link" (de) y "code" (fr) son la palabra
  // real en esos idiomas; "Front matter" es el nombre del bloque YAML de cabecera
  // y no se traduce en ninguna comunidad de Markdown; la muestra de bloque de
  // código es código, no prosa. Los términos de búsqueda alemanes para editores
  // de Markdown son literalmente los ingleses.
  'Editor', 'Link', 'code', 'Front matter', 'const answer = 42;',
  'markdown editor', 'online markdown editor', 'readme editor',
  // URLBolt: nombres literales de las funciones de JavaScript y de la RFC (no se
  // traducen en ningún idioma), y cognados exactos de las partes de una URL:
  // "Host" (es/pt/de), "Port" (fr/de), "Fragment" (fr/de), "Query"/"Query string"
  // (de/pt), "Bytes" y "URLs" como unidad y como sigla, "social" y "Reversible"
  // (es), que son la palabra real en esos idiomas.
  'encodeURIComponent (JavaScript)', 'encodeURI (JavaScript)', 'RFC 3986 strict',
  'Host', 'Port', 'Fragment', 'Query', 'Query string', 'Bytes', 'URLs',
  // List Mixer: "union" es literalmente la palabra francesa de la unión de
  // conjuntos y "Filter" la alemana de filtro; coinciden con el inglés por ser
  // cognados exactos del vocabulario matemático, no por estar sin traducir.
  'union', 'Filter',
  '{0} URLs', 'social', 'Social', 'Reversible',
  // Hex to RGB: nombre de la propia norma ("WCAG 2.1") y cognados exactos del
  // vocabulario del color: "Palette" (de/fr), "Chroma" (es/pt/de/fr), "Alpha"
  // (es/pt/de/fr), "Harmonies" y "Monochrome" (fr). Son la palabra real en esos
  // idiomas, no inglés sin traducir.
  'WCAG 2.1', 'Palette', 'Chroma', 'Alpha', 'Harmonies', 'Monochrome',
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
      // Los nombres de unidad (u_*) de UnitFlow coinciden a propósito con el
      // inglés en muchos idiomas: las unidades SI epónimas (Newton, Pascal,
      // Joule, Hertz, Kelvin, Celsius, Bar, Torr, Erg, Dyne…) se escriben igual
      // en alemán, francés, portugués o italiano porque son apellidos, no
      // sustantivos. Marcarlas como "sin traducir" llenaría el informe de ruido
      // permanente y escondería los avisos que sí importan.
      if (UNIT_NAME_KEY.test(leaf(key))) continue;
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
