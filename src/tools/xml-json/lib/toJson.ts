// ============================================================================
// AST → JSON value.
// ----------------------------------------------------------------------------
// A projection, not a parse: the tree is built once and every option here just
// changes how it is read out. Changing the attribute prefix or the array policy
// therefore costs a walk, not a re-parse.
// ============================================================================

import type { DocStats, ToJsonOptions, XmlDocument, XmlElement, XmlNode } from '../types';
import { resolveNamespaces } from './xmlParse';

/** Key holding the attributes of an element in `ordered` mode. */
export const ORDERED_ATTRS = ':@';

export interface Projection {
  value: unknown;
  stats: Pick<DocStats, 'elements' | 'attributes' | 'textNodes' | 'depth'>;
}

function coerceScalar(text: string, on: boolean): unknown {
  if (!on) return text;
  const t = text.trim();
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (t === 'null') return null;
  // Only plain JSON numbers, and only when the text round-trips exactly:
  // "007" and "1e999" must stay strings or the value silently changes.
  if (/^-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?$/.test(t)) {
    const n = Number(t);
    if (Number.isFinite(n) && String(n) === t) return n;
  }
  return text;
}

export function projectDocument(doc: XmlDocument, opts: ToJsonOptions): Projection {
  const counts = { elements: 0, attributes: 0, textNodes: 0, depth: 0 };
  const scopes = opts.namespaces === 'expand' ? resolveNamespaces(doc.root) : null;

  const keyFor = (el: XmlElement): string => {
    if (opts.namespaces === 'strip') return el.local;
    if (opts.namespaces === 'expand') {
      const uri = scopes?.get(el)?.[el.prefix];
      return uri ? `{${uri}}${el.local}` : el.name;
    }
    return el.name;
  };

  const attrKey = (name: string, local: string): string =>
    opts.attrPrefix + (opts.namespaces === 'strip' ? local : name);

  // -------------------------------------------------------------------------
  // ordered / preserveOrder form
  // -------------------------------------------------------------------------
  const ordered = (nodes: XmlNode[], depth: number): unknown[] => {
    if (depth > counts.depth) counts.depth = depth;
    const out: unknown[] = [];
    for (const node of nodes) {
      switch (node.kind) {
        case 'text':
          if (node.blank && opts.trim) break;
          counts.textNodes += 1;
          out.push({ [opts.textKey]: coerceScalar(node.value, opts.coerce) });
          break;
        case 'cdata':
          counts.textNodes += 1;
          out.push(opts.keepCdata ? { '#cdata': node.value } : { [opts.textKey]: node.value });
          break;
        case 'comment':
          if (opts.keepComments) out.push({ '#comment': node.value });
          break;
        case 'pi':
          if (opts.keepComments) out.push({ [`?${node.target}`]: node.value });
          break;
        case 'doctype':
          if (opts.keepComments) out.push({ '#doctype': node.value });
          break;
        case 'element': {
          counts.elements += 1;
          counts.attributes += node.attrs.length;
          const entry: Record<string, unknown> = { [keyFor(node)]: ordered(node.children, depth + 1) };
          if (node.attrs.length > 0) {
            const attrs: Record<string, unknown> = {};
            for (const a of node.attrs) attrs[attrKey(a.name, a.local)] = coerceScalar(a.value, opts.coerce);
            entry[ORDERED_ATTRS] = attrs;
          }
          out.push(entry);
          break;
        }
      }
    }
    return out;
  };

  // -------------------------------------------------------------------------
  // smart / always form
  // -------------------------------------------------------------------------
  const forced = new Set(opts.forceArray.map(s => s.trim()).filter(Boolean));

  const element = (el: XmlElement, depth: number): unknown => {
    counts.elements += 1;
    counts.attributes += el.attrs.length;
    if (depth > counts.depth) counts.depth = depth;

    const obj: Record<string, unknown> = {};
    let hasAttrs = false;
    for (const a of el.attrs) {
      obj[attrKey(a.name, a.local)] = coerceScalar(a.value, opts.coerce);
      hasAttrs = true;
    }

    // Counted once. Asking `children.filter(...)` per child turns a node with
    // 10k rows into 100M comparisons, which is exactly the shape of document
    // people paste into this tool.
    const tally = new Map<string, number>();
    for (const child of el.children) {
      if (child.kind !== 'element') continue;
      const key = keyFor(child);
      tally.set(key, (tally.get(key) ?? 0) + 1);
    }

    const comments: string[] = [];
    const cdata: string[] = [];
    let text = '';
    let hasText = false;
    let childCount = 0;

    for (const child of el.children) {
      switch (child.kind) {
        case 'text': {
          if (child.blank && opts.trim) break;
          counts.textNodes += 1;
          // In mixed content the runs around an element must keep one space:
          // trimming each side glues the words together ("keeps" + "and" →
          // "keepsand"). A text-only element still gets a clean trim.
          text += opts.trim
            ? tally.size > 0
              ? child.value.replace(/\s+/g, ' ')
              : child.value.trim()
            : child.value;
          hasText = true;
          break;
        }
        case 'cdata':
          counts.textNodes += 1;
          if (opts.keepCdata) cdata.push(child.value);
          else {
            text += child.value;
            hasText = true;
          }
          break;
        case 'comment':
          if (opts.keepComments) comments.push(child.value);
          break;
        case 'element': {
          childCount += 1;
          const key = keyFor(child);
          const value = element(child, depth + 1);
          const repeats =
            opts.arrays === 'always' ||
            forced.has(key) ||
            forced.has(child.local) ||
            (tally.get(key) ?? 0) > 1;

          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const current = obj[key];
            if (Array.isArray(current)) current.push(value);
            else obj[key] = [current, value];
          } else {
            obj[key] = repeats ? [value] : value;
          }
          break;
        }
        default:
          break;
      }
    }

    if (comments.length > 0) obj['#comment'] = comments.length === 1 ? comments[0] : comments;
    if (cdata.length > 0) obj['#cdata'] = cdata.length === 1 ? cdata[0] : cdata;

    // A text-only element collapses to its scalar; anything else keeps the
    // text under `textKey` so the attributes and children stay reachable.
    const bare = !hasAttrs && childCount === 0 && comments.length === 0 && cdata.length === 0;
    if (hasText) {
      const value = coerceScalar(opts.trim ? text.trim() : text, opts.coerce);
      if (bare) return value;
      obj[opts.textKey] = value;
      return obj;
    }
    if (bare) {
      if (opts.empty === 'null') return null;
      if (opts.empty === 'object') return {};
      return '';
    }
    return obj;
  };

  // -------------------------------------------------------------------------

  if (opts.arrays === 'ordered') {
    const value = ordered(doc.top, 1);
    if (opts.keepDeclaration && doc.declaration) {
      value.unshift({
        '?xml': [],
        [ORDERED_ATTRS]: {
          [`${opts.attrPrefix}version`]: doc.declaration.version,
          ...(doc.declaration.encoding ? { [`${opts.attrPrefix}encoding`]: doc.declaration.encoding } : {}),
        },
      });
    }
    return { value, stats: counts };
  }

  const root: Record<string, unknown> = {};
  if (opts.keepDeclaration && doc.declaration) {
    root['?xml'] = {
      [`${opts.attrPrefix}version`]: doc.declaration.version,
      ...(doc.declaration.encoding ? { [`${opts.attrPrefix}encoding`]: doc.declaration.encoding } : {}),
    };
  }
  if (opts.keepComments) {
    const pre = doc.top.filter(n => n.kind === 'comment') as { value: string }[];
    if (pre.length > 0) root['#comment'] = pre.length === 1 ? pre[0].value : pre.map(c => c.value);
  }
  if (doc.root) root[keyFor(doc.root)] = element(doc.root, 1);

  return { value: root, stats: counts };
}

export function stringify(value: unknown, opts: ToJsonOptions): string {
  return JSON.stringify(value, null, opts.minify ? undefined : opts.indent) ?? '';
}
