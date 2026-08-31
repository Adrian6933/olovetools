// ============================================================================
// JSON value → AST.
// ----------------------------------------------------------------------------
// Goes through the AST rather than printing strings directly, so the XML it
// produces is written by the same serializer as everything else and is, by
// construction, a document this tool can read back. The previous version built
// strings by hand and happily emitted `<2024>` and `<my key>`.
//
// It understands both shapes the projection can produce: the plain object form
// and the `ordered` (preserveOrder) form.
// ============================================================================

import type { ParseIssue, ToXmlOptions, XmlAttr, XmlDocument, XmlElement, XmlNode } from '../types';
import { ORDERED_ATTRS } from './toJson';
import { toXmlName } from './xmlSerialize';

const NOWHERE = { line: 1, col: 1, offset: 0 };

function attr(name: string, value: string): XmlAttr {
  const at = name.indexOf(':');
  return {
    name,
    prefix: at > 0 ? name.slice(0, at) : '',
    local: at > 0 ? name.slice(at + 1) : name,
    value,
    pos: NOWHERE,
  };
}

function text(value: string): XmlNode {
  return { kind: 'text', value, blank: !/\S/.test(value), pos: NOWHERE };
}

function scalarText(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

interface BuildState {
  opts: ToXmlOptions;
  issues: ParseIssue[];
  /** Set when a null had to be written as xsi:nil, so the root can declare it. */
  usedNil: boolean;
}

function warnKey(state: BuildState, raw: string, safe: string) {
  if (raw === safe || state.issues.length >= 50) return;
  state.issues.push({
    level: 'warning',
    code: 'bad-key',
    pos: NOWHERE,
    length: 0,
    detail: `${raw} → ${safe}`,
  });
}

/** True for the `[{ tag: [...] }, { "#text": "..." }]` shape. */
function looksOrdered(value: unknown): boolean {
  if (!Array.isArray(value) || value.length === 0) return false;
  return value.every(entry => {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) return false;
    const keys = Object.keys(entry).filter(k => k !== ORDERED_ATTRS);
    return keys.length === 1;
  });
}

// ---------------------------------------------------------------------------
// ordered form
// ---------------------------------------------------------------------------

function buildOrdered(entries: unknown[], state: BuildState): XmlNode[] {
  const out: XmlNode[] = [];
  const { opts } = state;

  for (const entry of entries) {
    if (typeof entry !== 'object' || entry === null) {
      out.push(text(scalarText(entry)));
      continue;
    }
    const record = entry as Record<string, unknown>;
    const key = Object.keys(record).find(k => k !== ORDERED_ATTRS);
    if (key === undefined) continue;
    const value = record[key];

    if (key === opts.textKey || key === '#text') {
      out.push(text(scalarText(value)));
      continue;
    }
    if (key === '#cdata') {
      out.push({ kind: 'cdata', value: scalarText(value), pos: NOWHERE });
      continue;
    }
    if (key === '#comment') {
      out.push({ kind: 'comment', value: scalarText(value), pos: NOWHERE });
      continue;
    }
    if (key === '#doctype') {
      out.push({ kind: 'doctype', value: scalarText(value), pos: NOWHERE });
      continue;
    }
    if (key.startsWith('?')) {
      // `?xml` is the declaration, not a processing instruction.
      if (key !== '?xml') out.push({ kind: 'pi', target: key.slice(1), value: scalarText(value), pos: NOWHERE });
      continue;
    }

    const safe = toXmlName(key);
    warnKey(state, key, safe);
    const attrs: XmlAttr[] = [];
    const rawAttrs = record[ORDERED_ATTRS];
    if (rawAttrs && typeof rawAttrs === 'object' && !Array.isArray(rawAttrs)) {
      for (const [an, av] of Object.entries(rawAttrs as Record<string, unknown>)) {
        const bare = an.startsWith(opts.attrPrefix) && opts.attrPrefix ? an.slice(opts.attrPrefix.length) : an;
        const safeAttr = toXmlName(bare);
        warnKey(state, bare, safeAttr);
        attrs.push(attr(safeAttr, scalarText(av)));
      }
    }

    const children = Array.isArray(value) ? buildOrdered(value, state) : [text(scalarText(value))];
    out.push({
      kind: 'element',
      name: safe,
      prefix: safe.includes(':') ? safe.split(':')[0] : '',
      local: safe.includes(':') ? safe.split(':')[1] : safe,
      attrs,
      children: children.filter(c => !(c.kind === 'text' && c.value === '')),
      selfClosing: false,
      pos: NOWHERE,
    });
  }

  return out;
}

// ---------------------------------------------------------------------------
// plain object form
// ---------------------------------------------------------------------------

function buildElement(rawName: string, value: unknown, state: BuildState): XmlElement[] {
  const { opts } = state;
  const safe = toXmlName(rawName);
  warnKey(state, rawName, safe);

  const make = (attrs: XmlAttr[], children: XmlNode[]): XmlElement => ({
    kind: 'element',
    name: safe,
    prefix: safe.includes(':') ? safe.split(':')[0] : '',
    local: safe.includes(':') ? safe.split(':')[1] : safe,
    attrs,
    children,
    selfClosing: children.length === 0 && opts.selfClose,
    pos: NOWHERE,
  });

  // An array under a key means the key repeats, not that the element contains
  // a list. This is the case the old writer got right and the reason the two
  // directions have to agree.
  if (Array.isArray(value)) {
    const out: XmlElement[] = [];
    for (const item of value) out.push(...buildElement(rawName, item, state));
    return out;
  }

  if (value === null || value === undefined) {
    if (opts.nilAttribute) {
      state.usedNil = true;
      return [make([attr('xsi:nil', 'true')], [])];
    }
    return [make([], [])];
  }

  if (typeof value !== 'object') {
    return [make([], [text(String(value))])];
  }

  const attrs: XmlAttr[] = [];
  const children: XmlNode[] = [];
  const record = value as Record<string, unknown>;

  for (const [key, child] of Object.entries(record)) {
    if (opts.attrPrefix && key.startsWith(opts.attrPrefix) && key !== opts.textKey) {
      const bare = key.slice(opts.attrPrefix.length);
      const safeAttr = toXmlName(bare);
      warnKey(state, bare, safeAttr);
      attrs.push(attr(safeAttr, scalarText(child)));
      continue;
    }
    if (key === opts.textKey || key === '#text') {
      children.push(text(scalarText(child)));
      continue;
    }
    if (key === '#cdata') {
      const items = Array.isArray(child) ? child : [child];
      for (const item of items) children.push({ kind: 'cdata', value: scalarText(item), pos: NOWHERE });
      continue;
    }
    if (key === '#comment') {
      const items = Array.isArray(child) ? child : [child];
      for (const item of items) children.push({ kind: 'comment', value: scalarText(item), pos: NOWHERE });
      continue;
    }
    if (key === '?xml') continue;
    children.push(...buildElement(key, child, state));
  }

  return [make(attrs, children)];
}

export interface FromJsonResult {
  doc: XmlDocument;
  issues: ParseIssue[];
}

export function documentFromJson(value: unknown, opts: ToXmlOptions): FromJsonResult {
  const state: BuildState = { opts, issues: [], usedNil: false };
  const top: XmlNode[] = [];
  let declaration: XmlDocument['declaration'] = opts.declaration
    ? { version: '1.0', encoding: 'UTF-8', standalone: '' }
    : null;

  if (looksOrdered(value)) {
    const decl = (value as Record<string, unknown>[]).find(e => '?xml' in e);
    if (decl && opts.declaration) {
      const a = (decl[ORDERED_ATTRS] || {}) as Record<string, unknown>;
      const pick = (n: string) => scalarText(a[`${opts.attrPrefix}${n}`] ?? a[n] ?? '');
      declaration = { version: pick('version') || '1.0', encoding: pick('encoding') || 'UTF-8', standalone: '' };
    }
    top.push(...buildOrdered(value as unknown[], state));
  } else if (Array.isArray(value)) {
    // A bare array has no root element name of its own: wrap it, otherwise the
    // output is several sibling roots, which is not a document.
    const wrapper: XmlElement = {
      kind: 'element',
      name: toXmlName(opts.rootName),
      prefix: '',
      local: toXmlName(opts.rootName),
      attrs: [],
      children: value.flatMap(item => buildElement(opts.itemName, item, state) as XmlNode[]),
      selfClosing: false,
      pos: NOWHERE,
    };
    top.push(wrapper);
  } else if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).filter(k => k !== '?xml');
    const declRaw = record['?xml'];
    if (declRaw && typeof declRaw === 'object' && opts.declaration) {
      const a = declRaw as Record<string, unknown>;
      const pick = (n: string) => scalarText(a[`${opts.attrPrefix}${n}`] ?? a[n] ?? '');
      declaration = { version: pick('version') || '1.0', encoding: pick('encoding') || 'UTF-8', standalone: '' };
    }

    if (keys.length === 1) {
      top.push(...buildElement(keys[0], record[keys[0]], state));
    } else {
      // More than one top-level key. The old version kept the first and threw
      // the rest away without a word; wrapping keeps the data.
      const children: XmlNode[] = [];
      for (const key of keys) children.push(...buildElement(key, record[key], state));
      top.push({
        kind: 'element',
        name: toXmlName(opts.rootName),
        prefix: '',
        local: toXmlName(opts.rootName),
        attrs: [],
        children,
        selfClosing: false,
        pos: NOWHERE,
      });
      if (keys.length > 1) {
        state.issues.push({ level: 'warning', code: 'json-root', pos: NOWHERE, length: 0, detail: opts.rootName });
      }
    }
  } else {
    top.push(...buildElement(opts.rootName, value, state));
  }

  const root = top.find(n => n.kind === 'element') as XmlElement | undefined;
  if (root && state.usedNil && !root.attrs.some(a => a.name === 'xmlns:xsi')) {
    // `xsi:nil` without the namespace declared is what the old writer emitted;
    // no schema-aware parser accepts it.
    root.attrs.push(attr('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance'));
  }

  return {
    doc: { declaration, top, root: root ?? null, issues: state.issues, entities: {} },
    issues: state.issues,
  };
}
