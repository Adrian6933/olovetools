// ============================================================================
// XML scanner → AST.
// ----------------------------------------------------------------------------
// Written by hand instead of leaning on DOMParser because everything the tool
// needs downstream is exactly what DOMParser throws away:
//
//   * position — DOMParser gives one <parsererror> whose text is a browser
//     specific sentence with no line and no column, so the editor had nothing
//     to point at.
//   * recovery — DOMParser stops at the first error. A document with three
//     unclosed tags takes three edit/retry cycles. This parser keeps going and
//     reports all of them at once.
//   * fidelity — comments, CDATA boundaries, processing instructions and the
//     interleaving of text and elements all survive here, and each is a thing
//     the previous version silently dropped.
//
// It is deliberately tolerant: an unclosed tag is an error *and* a node, so the
// tree view and the JSON projection still have something to show.
// ============================================================================

import type {
  IssueCode,
  ParseIssue,
  Pos,
  XmlAttr,
  XmlDocument,
  XmlElement,
  XmlNode,
} from '../types';

// XML 1.0 NameStartChar / NameChar, restricted to the BMP ranges that matter.
const NAME_START = /[A-Za-z_:À-˿Ͱ-ͽͿ-῿‌-‍⁰-↏Ⰰ-⿯、-퟿豈-﷏ﷰ-�]/;
const NAME_CHAR = /[A-Za-z0-9_:.·À-˿̀-ͯͰ-ͽͿ-῿‌-‍‿-⁀⁰-↏Ⰰ-⿯、-퟿豈-﷏ﷰ-�-]/;

const PREDEFINED: Record<string, string> = {
  lt: '<',
  gt: '>',
  amp: '&',
  quot: '"',
  apos: "'",
};

/** Splits `xlink:href` into its prefix and local part. */
export function splitName(name: string): { prefix: string; local: string } {
  const at = name.indexOf(':');
  if (at <= 0 || at === name.length - 1) return { prefix: '', local: name };
  return { prefix: name.slice(0, at), local: name.slice(at + 1) };
}

export function isValidName(name: string): boolean {
  if (!name) return false;
  if (!NAME_START.test(name[0])) return false;
  for (let i = 1; i < name.length; i += 1) {
    if (!NAME_CHAR.test(name[i])) return false;
  }
  return true;
}

class Scanner {
  readonly src: string;
  i = 0;
  /** Offsets where each line starts, so line/col is a binary search away. */
  private lineStarts: number[];

  constructor(src: string) {
    this.src = src;
    this.lineStarts = [0];
    for (let k = 0; k < src.length; k += 1) {
      if (src.charCodeAt(k) === 10) this.lineStarts.push(k + 1);
    }
  }

  posAt(offset: number): Pos {
    let lo = 0;
    let hi = this.lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (this.lineStarts[mid] <= offset) lo = mid;
      else hi = mid - 1;
    }
    return { line: lo + 1, col: offset - this.lineStarts[lo] + 1, offset };
  }
}

interface ParseState {
  scan: Scanner;
  issues: ParseIssue[];
  entities: Record<string, string>;
}

function report(
  state: ParseState,
  code: IssueCode,
  offset: number,
  length: number,
  detail?: string,
  level: 'error' | 'warning' = 'error'
) {
  // A runaway document should not build a million-entry array.
  if (state.issues.length >= 200) return;
  state.issues.push({ level, code, pos: state.scan.posAt(offset), length, detail });
}

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

function decodeEntities(state: ParseState, raw: string, base: number): string {
  if (raw.indexOf('&') === -1) return raw;

  let out = '';
  let i = 0;
  while (i < raw.length) {
    const amp = raw.indexOf('&', i);
    if (amp === -1) {
      out += raw.slice(i);
      break;
    }
    out += raw.slice(i, amp);
    const semi = raw.indexOf(';', amp);
    // An entity reference is short; a `&` with no `;` nearby is literal text.
    if (semi === -1 || semi - amp > 40) {
      out += '&';
      i = amp + 1;
      continue;
    }
    const body = raw.slice(amp + 1, semi);

    if (body[0] === '#') {
      const hex = body[1] === 'x' || body[1] === 'X';
      const digits = hex ? body.slice(2) : body.slice(1);
      const wellFormed = hex ? /^[0-9a-fA-F]+$/.test(digits) : /^[0-9]+$/.test(digits);
      const code = wellFormed ? parseInt(digits, hex ? 16 : 10) : NaN;
      const valid = wellFormed && Number.isFinite(code) && code > 0 && code <= 0x10ffff;
      if (!valid) {
        report(state, 'bad-char-ref', base + amp, semi - amp + 1, `&${body};`);
        out += raw.slice(amp, semi + 1);
      } else {
        out += String.fromCodePoint(code);
      }
      i = semi + 1;
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(PREDEFINED, body)) {
      out += PREDEFINED[body];
      i = semi + 1;
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(state.entities, body)) {
      out += state.entities[body];
      i = semi + 1;
      continue;
    }

    // Unknown entity: keep it verbatim so nothing is lost, and say so.
    report(state, 'unknown-entity', base + amp, semi - amp + 1, `&${body};`, 'warning');
    out += raw.slice(amp, semi + 1);
    i = semi + 1;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function readName(scan: Scanner): string {
  const start = scan.i;
  const { src } = scan;
  if (start >= src.length || !NAME_START.test(src[start])) return '';
  scan.i += 1;
  while (scan.i < src.length && NAME_CHAR.test(src[scan.i])) scan.i += 1;
  return src.slice(start, scan.i);
}

function skipSpace(scan: Scanner) {
  const { src } = scan;
  while (scan.i < src.length) {
    const c = src.charCodeAt(scan.i);
    if (c === 32 || c === 9 || c === 10 || c === 13) scan.i += 1;
    else break;
  }
}

function readAttributes(state: ParseState, stopAt: string): XmlAttr[] {
  const { scan } = state;
  const attrs: XmlAttr[] = [];
  const seen = new Set<string>();

  for (;;) {
    skipSpace(scan);
    if (scan.i >= scan.src.length) break;
    const c = scan.src[scan.i];
    if (c === '>' || (c === '/' && scan.src[scan.i + 1] === '>') || stopAt.includes(c)) break;

    const nameStart = scan.i;
    const name = readName(scan);
    if (!name) {
      // Junk inside the tag. Skip one character so we cannot spin here.
      report(state, 'bad-name', scan.i, 1, scan.src[scan.i]);
      scan.i += 1;
      continue;
    }

    skipSpace(scan);
    let value = '';
    if (scan.src[scan.i] === '=') {
      scan.i += 1;
      skipSpace(scan);
      const quote = scan.src[scan.i];
      if (quote === '"' || quote === "'") {
        scan.i += 1;
        const from = scan.i;
        const close = scan.src.indexOf(quote, from);
        const end = close === -1 ? scan.src.length : close;
        value = decodeEntities(state, scan.src.slice(from, end), from);
        scan.i = close === -1 ? scan.src.length : close + 1;
        if (close === -1) report(state, 'unterminated-tag', nameStart, name.length, name);
      } else {
        // `<a href=foo>` — HTML habit, illegal XML, but recoverable.
        const from = scan.i;
        while (scan.i < scan.src.length && !/[\s>/]/.test(scan.src[scan.i])) scan.i += 1;
        value = decodeEntities(state, scan.src.slice(from, scan.i), from);
        report(state, 'unquoted-attr', from, scan.i - from, name);
      }
    }

    if (seen.has(name)) report(state, 'duplicate-attr', nameStart, name.length, name);
    seen.add(name);

    const { prefix, local } = splitName(name);
    attrs.push({ name, prefix, local, value, pos: scan.posAt(nameStart) });
  }

  return attrs;
}

/** `<?xml ... ?>`, only legal as the very first thing in the document. */
function readDeclaration(state: ParseState): XmlDocument['declaration'] {
  const { scan } = state;
  scan.i += 5; // `<?xml`
  const attrs = readAttributes(state, '?');
  if (scan.src.startsWith('?>', scan.i)) scan.i += 2;
  else {
    report(state, 'bad-declaration', 0, 5);
    const close = scan.src.indexOf('?>', scan.i);
    scan.i = close === -1 ? scan.src.length : close + 2;
  }
  const get = (n: string) => attrs.find(a => a.name === n)?.value ?? '';
  return { version: get('version') || '1.0', encoding: get('encoding'), standalone: get('standalone') };
}

/** Pulls `<!ENTITY name "value">` out of an internal DTD subset. */
function collectEntities(state: ParseState, subset: string) {
  const re = /<!ENTITY\s+([A-Za-z_:][\w.:-]*)\s+(["'])([\s\S]*?)\2\s*>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(subset))) {
    if (Object.keys(state.entities).length >= 200) break;
    state.entities[m[1]] = m[3];
  }
}

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------

export function parseXml(source: string): XmlDocument {
  const scan = new Scanner(source);
  const state: ParseState = { scan, issues: [], entities: {} };

  const doc: XmlDocument = {
    declaration: null,
    top: [],
    root: null,
    issues: state.issues,
    entities: state.entities,
  };

  if (source.startsWith('<?xml', 0) || /^﻿?\s*<\?xml/.test(source)) {
    const at = source.indexOf('<?xml');
    scan.i = at;
    doc.declaration = readDeclaration(state);
  }

  // The stack holds open elements; `children` is where the next node lands.
  const stack: XmlElement[] = [];
  let sawRoot = false;

  const push = (node: XmlNode) => {
    if (stack.length > 0) stack[stack.length - 1].children.push(node);
    else doc.top.push(node);
  };

  const { src } = scan;

  while (scan.i < src.length) {
    const lt = src.indexOf('<', scan.i);

    // ---- text run -------------------------------------------------------
    if (lt !== scan.i) {
      const end = lt === -1 ? src.length : lt;
      const raw = src.slice(scan.i, end);
      const blank = !/\S/.test(raw);
      if (!blank && stack.length === 0) {
        report(state, 'text-before-root', scan.i, Math.min(raw.length, 40));
      }
      if (stack.length > 0 || !blank) {
        push({ kind: 'text', value: decodeEntities(state, raw, scan.i), blank, pos: scan.posAt(scan.i) });
      }
      scan.i = end;
      if (lt === -1) break;
    }

    const start = scan.i;

    // ---- comment --------------------------------------------------------
    if (src.startsWith('<!--', start)) {
      const close = src.indexOf('-->', start + 4);
      if (close === -1) {
        report(state, 'unterminated-comment', start, 4);
        push({ kind: 'comment', value: src.slice(start + 4), pos: scan.posAt(start) });
        scan.i = src.length;
        continue;
      }
      const body = src.slice(start + 4, close);
      if (body.includes('--')) report(state, 'double-hyphen-comment', start, close + 3 - start, undefined, 'warning');
      push({ kind: 'comment', value: body, pos: scan.posAt(start) });
      scan.i = close + 3;
      continue;
    }

    // ---- CDATA ----------------------------------------------------------
    if (src.startsWith('<![CDATA[', start)) {
      const close = src.indexOf(']]>', start + 9);
      if (close === -1) {
        report(state, 'unterminated-cdata', start, 9);
        push({ kind: 'cdata', value: src.slice(start + 9), pos: scan.posAt(start) });
        scan.i = src.length;
        continue;
      }
      push({ kind: 'cdata', value: src.slice(start + 9, close), pos: scan.posAt(start) });
      scan.i = close + 3;
      continue;
    }

    // ---- doctype --------------------------------------------------------
    if (/^<!DOCTYPE/i.test(src.slice(start, start + 9))) {
      let j = start + 9;
      let depth = 1;
      let inSubset = false;
      while (j < src.length && depth > 0) {
        const ch = src[j];
        if (ch === '[') inSubset = true;
        else if (ch === ']') inSubset = false;
        else if (ch === '>' && !inSubset) depth -= 1;
        j += 1;
      }
      const value = src.slice(start, j);
      collectEntities(state, value);
      push({ kind: 'doctype', value, pos: scan.posAt(start) });
      scan.i = j;
      continue;
    }

    // ---- processing instruction -----------------------------------------
    if (src.startsWith('<?', start)) {
      const close = src.indexOf('?>', start + 2);
      if (close === -1) {
        report(state, 'unterminated-pi', start, 2);
        scan.i = src.length;
        continue;
      }
      const body = src.slice(start + 2, close);
      const space = body.search(/\s/);
      push({
        kind: 'pi',
        target: space === -1 ? body : body.slice(0, space),
        value: space === -1 ? '' : body.slice(space + 1),
        pos: scan.posAt(start),
      });
      scan.i = close + 2;
      continue;
    }

    // ---- closing tag ----------------------------------------------------
    if (src.startsWith('</', start)) {
      scan.i = start + 2;
      const name = readName(scan);
      skipSpace(scan);
      if (src[scan.i] === '>') scan.i += 1;
      else {
        const close = src.indexOf('>', scan.i);
        scan.i = close === -1 ? src.length : close + 1;
      }

      const openIndex = findOpen(stack, name);
      if (openIndex === -1) {
        report(state, 'stray-close', start, scan.i - start, name);
        continue;
      }
      // Everything above the match was never closed. Report and unwind.
      for (let k = stack.length - 1; k > openIndex; k -= 1) {
        report(state, 'unclosed-tag', stack[k].pos.offset, stack[k].name.length + 1, stack[k].name);
      }
      if (openIndex < stack.length - 1) {
        report(state, 'mismatched-tag', start, scan.i - start, name);
      }
      stack.length = openIndex;
      continue;
    }

    // ---- opening tag ----------------------------------------------------
    if (NAME_START.test(src[start + 1] || '')) {
      scan.i = start + 1;
      const name = readName(scan);
      const attrs = readAttributes(state, '');
      skipSpace(scan);

      let selfClosing = false;
      if (src.startsWith('/>', scan.i)) {
        selfClosing = true;
        scan.i += 2;
      } else if (src[scan.i] === '>') {
        scan.i += 1;
      } else {
        report(state, 'unterminated-tag', start, Math.min(scan.i - start, 40), name);
        const close = src.indexOf('>', scan.i);
        scan.i = close === -1 ? src.length : close + 1;
      }

      const { prefix, local } = splitName(name);
      const element: XmlElement = {
        kind: 'element',
        name,
        prefix,
        local,
        attrs,
        children: [],
        selfClosing,
        pos: scan.posAt(start),
      };

      if (stack.length === 0) {
        if (sawRoot) report(state, 'multiple-roots', start, name.length + 1, name);
        else {
          doc.root = element;
          sawRoot = true;
        }
      }
      push(element);
      if (!selfClosing) stack.push(element);
      continue;
    }

    // ---- a bare `<` that starts nothing ---------------------------------
    report(state, 'bad-name', start, 1, '<');
    push({ kind: 'text', value: '<', blank: false, pos: scan.posAt(start) });
    scan.i = start + 1;
  }

  for (const open of stack) {
    report(state, 'unclosed-tag', open.pos.offset, open.name.length + 1, open.name);
  }

  if (!doc.root && source.trim()) report(state, 'no-root', 0, 0);
  if (!source.trim()) report(state, 'no-root', 0, 0);

  return doc;
}

/** Innermost open element with this name, or -1. */
function findOpen(stack: XmlElement[], name: string): number {
  for (let k = stack.length - 1; k >= 0; k -= 1) {
    if (stack[k].name === name) return k;
  }
  return -1;
}

// ---------------------------------------------------------------------------
// Namespaces
// ---------------------------------------------------------------------------

/**
 * Resolves prefixes to URIs by walking the tree with the declarations in
 * scope. Returned as a map keyed by element so callers do not have to thread
 * a scope stack through their own recursion.
 */
export function resolveNamespaces(root: XmlElement | null): Map<XmlElement, Record<string, string>> {
  const out = new Map<XmlElement, Record<string, string>>();
  if (!root) return out;

  const walk = (el: XmlElement, inherited: Record<string, string>) => {
    let scope = inherited;
    for (const attr of el.attrs) {
      if (attr.name === 'xmlns') {
        if (scope === inherited) scope = { ...inherited };
        scope[''] = attr.value;
      } else if (attr.prefix === 'xmlns') {
        if (scope === inherited) scope = { ...inherited };
        scope[attr.local] = attr.value;
      }
    }
    out.set(el, scope);
    for (const child of el.children) {
      if (child.kind === 'element') walk(child, scope);
    }
  };

  walk(root, {});
  return out;
}
