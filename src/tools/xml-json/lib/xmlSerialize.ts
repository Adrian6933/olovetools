// ============================================================================
// AST → XML text.
// ----------------------------------------------------------------------------
// Used for three things: the XML output of a JSON → XML conversion, the
// pretty/minify buttons on the XML side, and the round-trip check. All three
// go through the same writer so "beautify" and "convert" cannot disagree.
// ============================================================================

import type { XmlDocument, XmlElement, XmlNode } from '../types';

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

export function escapeText(text: string): string {
  return text.replace(/[&<>]/g, ch => ESCAPES[ch]);
}

export function escapeAttr(text: string): string {
  return text.replace(/[&<>"]/g, ch => ESCAPES[ch]);
}

/**
 * Turns any string into a legal XML Name. `{"2024": 1}` used to produce
 * `<2024>`, an invalid document that this very tool then refused to re-open.
 */
export function toXmlName(raw: string): string {
  const cleaned = raw.replace(/[^A-Za-z0-9_.:-]/g, '_');
  if (!cleaned) return '_';
  return /^[A-Za-z_]/.test(cleaned) ? cleaned : `_${cleaned}`;
}

export interface SerializeOptions {
  indent: number;
  minify: boolean;
  /** Emit `<a/>` rather than `<a></a>`. */
  selfClose: boolean;
  /** Keep the `<?xml ... ?>` declaration when the document has one. */
  declaration: boolean;
}

/** An element whose only children are text must not be re-indented. */
function hasTextContent(el: XmlElement): boolean {
  return el.children.some(c => (c.kind === 'text' && !c.blank) || c.kind === 'cdata');
}

function writeNode(node: XmlNode, depth: number, opts: SerializeOptions, out: string[]) {
  const pad = opts.minify ? '' : ' '.repeat(opts.indent * depth);
  const nl = opts.minify ? '' : '\n';

  switch (node.kind) {
    case 'text': {
      if (node.blank && !opts.minify) return;
      out.push(escapeText(opts.minify ? node.value.trim() : node.value));
      return;
    }
    case 'cdata':
      // `]]>` cannot appear inside a CDATA section; split it across two.
      out.push(`<![CDATA[${node.value.split(']]>').join(']]]]><![CDATA[>')}]]>`);
      return;
    case 'comment':
      out.push(`${pad}<!--${node.value}-->${nl}`);
      return;
    case 'pi':
      out.push(`${pad}<?${node.target}${node.value ? ` ${node.value}` : ''}?>${nl}`);
      return;
    case 'doctype':
      out.push(`${pad}${node.value}${nl}`);
      return;
    case 'element':
      break;
  }

  const el = node;
  const attrs = el.attrs.map(a => ` ${a.name}="${escapeAttr(a.value)}"`).join('');
  const kids = opts.minify ? el.children.filter(c => !(c.kind === 'text' && c.blank)) : el.children;

  if (kids.length === 0) {
    out.push(opts.selfClose ? `${pad}<${el.name}${attrs}/>${nl}` : `${pad}<${el.name}${attrs}></${el.name}>${nl}`);
    return;
  }

  // Mixed or text-only content stays on one line: re-indenting it would change
  // the text, which is data, not formatting.
  if (hasTextContent(el)) {
    out.push(`${pad}<${el.name}${attrs}>`);
    for (const child of kids) {
      if (child.kind === 'text') out.push(escapeText(child.value));
      else if (child.kind === 'cdata') writeNode(child, 0, opts, out);
      else writeNode(child, 0, { ...opts, minify: true }, out);
    }
    out.push(`</${el.name}>${nl}`);
    return;
  }

  out.push(`${pad}<${el.name}${attrs}>${nl}`);
  for (const child of kids) writeNode(child, depth + 1, opts, out);
  out.push(`${pad}</${el.name}>${nl}`);
}

export function serializeXml(doc: XmlDocument, opts: SerializeOptions): string {
  const out: string[] = [];
  const nl = opts.minify ? '' : '\n';

  if (opts.declaration && doc.declaration) {
    const d = doc.declaration;
    const enc = d.encoding ? ` encoding="${escapeAttr(d.encoding)}"` : ' encoding="UTF-8"';
    const alone = d.standalone ? ` standalone="${escapeAttr(d.standalone)}"` : '';
    out.push(`<?xml version="${escapeAttr(d.version || '1.0')}"${enc}${alone}?>${nl}`);
  }

  for (const node of doc.top) writeNode(node, 0, opts, out);

  return out.join('').replace(/\n+$/, '');
}
