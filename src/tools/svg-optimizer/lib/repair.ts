// ============================================================================
// Tolerant pre-parse.
// ----------------------------------------------------------------------------
// svgo parses XML strictly, and so does the browser's DOMParser in
// `image/svg+xml` mode. Real files exported by real editors are frequently not
// well-formed XML, and the single most common defect is a namespace prefix
// that is used but never declared:
//
//     <g inkscape:groupmode="layer">          <!-- no xmlns:inkscape anywhere -->
//
// A strict parser refuses the whole document over it. Every other SVG tool on
// the web does the same and tells the user their file is broken — which is
// useless, because the file opens fine in a browser as `image/svg+xml`... no,
// it does not: Chrome reports "Namespace prefix inkscape for groupmode on g is
// not defined" too. So the file really is invalid, and the only helpful thing
// to do is repair it and say so.
//
// Everything here is done on the raw string, because by definition we cannot
// parse it yet.
// ============================================================================

import type { RepairNote } from './types';

/** Well-known prefixes, so a repaired file keeps meaningful namespace URIs. */
const KNOWN_NS: Record<string, string> = {
  xlink: 'http://www.w3.org/1999/xlink',
  svg: 'http://www.w3.org/2000/svg',
  inkscape: 'http://www.inkscape.org/namespaces/inkscape',
  sodipodi: 'http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  dc: 'http://purl.org/dc/elements/1.1/',
  cc: 'http://creativecommons.org/ns#',
  sketch: 'http://www.bohemiancoding.com/sketch/ns',
  figma: 'http://www.figma.com/figma/ns',
  serif: 'http://www.serif.com/',
  krita: 'http://krita.org/namespaces/svg/krita',
  vectornator: 'http://vectornator.io',
  i: 'http://ns.adobe.com/AdobeIllustrator/10.0/',
  x: 'http://ns.adobe.com/Extensibility/1.0/',
  graph: 'http://ns.adobe.com/Graphs/1.0/',
  a: 'http://ns.adobe.com/AdobeSVGViewerExtensions/3.0/',
  illustrator: 'http://ns.adobe.com/AdobeIllustrator/10.0/',
  xmp: 'http://ns.adobe.com/xap/1.0/',
  pdf: 'http://ns.adobe.com/pdf/1.3/',
  tiff: 'http://ns.adobe.com/tiff/1.0/',
  exif: 'http://ns.adobe.com/exif/1.0/',
  photoshop: 'http://ns.adobe.com/photoshop/1.0/',
  stRef: 'http://ns.adobe.com/xap/1.0/sType/ResourceRef#',
  xmpMM: 'http://ns.adobe.com/xap/1.0/mm/',
};

/** Prefixes XML defines itself; declaring them is an error, not a fix. */
const RESERVED = new Set(['xml', 'xmlns']);

/** Placeholder for a prefix nobody recognises. It gets stripped anyway. */
const syntheticNs = (prefix: string) => `https://olovetools.com/ns/${prefix}`;

export interface RepairOutcome {
  source: string;
  notes: RepairNote[];
}

/**
 * Makes a best effort to turn `source` into well-formed XML without changing
 * what it draws. Returns the repaired string plus a note per fix, so the UI can
 * be honest about having touched the input.
 */
export function repairSvgSource(input: string): RepairOutcome {
  const notes: RepairNote[] = [];
  let source = input;

  // -- 1. Byte order mark ---------------------------------------------------
  // A BOM before `<?xml` makes the declaration unparseable.
  if (source.charCodeAt(0) === 0xfeff) {
    source = source.slice(1);
    notes.push({ kind: 'bom', detail: 'U+FEFF' });
  }
  source = source.trim();

  // -- 2. Anything after the closing tag ------------------------------------
  // Editors and CMS exports sometimes append a newline-plus-garbage tail.
  const lastClose = source.lastIndexOf('</svg>');
  if (lastClose !== -1 && lastClose + 6 < source.length) {
    const tail = source.slice(lastClose + 6).trim();
    if (tail) {
      source = source.slice(0, lastClose + 6);
      notes.push({ kind: 'trailing-junk', detail: tail.slice(0, 40) });
    }
  }

  // -- 3. DOCTYPE internal subset -------------------------------------------
  // `<!DOCTYPE svg [ <!ENTITY ...> ]>` trips svgo's SAX parser. The doctype is
  // removed by the optimizer anyway, so dropping it early costs nothing.
  const doctypeSubset = /<!DOCTYPE[^>[]*\[[\s\S]*?\]\s*>/i;
  if (doctypeSubset.test(source)) {
    source = source.replace(doctypeSubset, '');
    notes.push({ kind: 'doctype-subset', detail: '<!DOCTYPE […]>' });
  }

  // -- 4. Undeclared namespace prefixes -------------------------------------
  const used = collectUsedPrefixes(source);
  const declared = collectDeclaredPrefixes(source);
  const missing = [...used].filter(p => !declared.has(p) && !RESERVED.has(p));

  if (missing.length > 0) {
    source = declareOnRoot(source, missing);
    for (const prefix of missing) notes.push({ kind: 'namespace', detail: prefix });
  }

  // -- 5. Bare ampersands ---------------------------------------------------
  // `&` that does not open a valid entity is a hard XML error. Common in
  // `<title>Fish & Chips</title>` and in query strings inside href values.
  const bareAmp = /&(?!#\d+;|#x[0-9a-f]+;|[a-z][a-z0-9]*;)/gi;
  const ampCount = (source.match(bareAmp) || []).length;
  if (ampCount > 0) {
    source = source.replace(bareAmp, '&amp;');
    notes.push({ kind: 'ampersand', detail: String(ampCount) });
  }

  return { source, notes };
}

/**
 * Prefixes appearing as `<ns:tag`, `</ns:tag` or ` ns:attr=`.
 *
 * Comments, CDATA and `<style>`/`<script>` bodies are blanked first: CSS
 * selectors and JS both contain colons that are not namespace prefixes, and a
 * `<!-- ... -->` block routinely holds the editor banner that mentions them.
 */
function collectUsedPrefixes(source: string): Set<string> {
  const scrubbed = source
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ');

  const found = new Set<string>();

  // Element names.
  for (const m of scrubbed.matchAll(/<\/?([a-z_][\w.-]*):[a-z_][\w.-]*/gi)) {
    found.add(m[1]);
  }
  // Attribute names: must be preceded by whitespace and followed by `=`.
  for (const m of scrubbed.matchAll(/\s([a-z_][\w.-]*):([a-z_][\w.-]*)\s*=/gi)) {
    found.add(m[1]);
  }
  return found;
}

/** Prefixes bound by an `xmlns:prefix="…"` declaration anywhere in the file. */
function collectDeclaredPrefixes(source: string): Set<string> {
  const found = new Set<string>();
  for (const m of source.matchAll(/\sxmlns:([a-z_][\w.-]*)\s*=/gi)) found.add(m[1]);
  return found;
}

/**
 * Injects `xmlns:*` declarations into the root `<svg>` start tag.
 *
 * Declaring on the root rather than at each use site is what a correct export
 * would have done, and it keeps the repair to a single edit.
 */
function declareOnRoot(source: string, prefixes: string[]): string {
  const rootMatch = source.match(/<svg\b/i);
  if (!rootMatch || rootMatch.index === undefined) return source;

  const start = rootMatch.index;
  // Walk to the end of the start tag, skipping `>` inside quoted values.
  let quote: string | null = null;
  let end = -1;
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === '>') {
      end = i;
      break;
    }
  }
  if (end === -1) return source;

  const decls = prefixes
    .map(p => ` xmlns:${p}="${KNOWN_NS[p] || syntheticNs(p)}"`)
    .join('');

  // Insert before the `/` of a self-closing root, otherwise before `>`.
  const insertAt = source[end - 1] === '/' ? end - 1 : end;
  return source.slice(0, insertAt) + decls + source.slice(insertAt);
}

/**
 * Reads a dropped file as text, transparently un-gzipping `.svgz`.
 *
 * `.svgz` is plain gzipped SVG and is the default "compressed" save format in
 * Inkscape and the usual shape of vector map tiles, so refusing it means
 * refusing a large slice of the files people actually want optimized.
 */
export async function readSvgFile(file: File): Promise<string> {
  const looksGzipped = await isGzip(file);
  if (!looksGzipped) return file.text();

  if (typeof DecompressionStream === 'undefined') {
    throw new Error('svgz-unsupported');
  }
  const stream = file.stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).text();
}

/** Gzip magic number, rather than trusting the extension. */
async function isGzip(file: File): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 2).arrayBuffer());
  return head[0] === 0x1f && head[1] === 0x8b;
}
