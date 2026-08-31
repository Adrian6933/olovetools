// ============================================================================
// XPath 1.0 over the pasted document.
// ----------------------------------------------------------------------------
// `document.evaluate` is a full XPath 1.0 engine that ships with every browser
// and costs nothing — no dependency, no download, no server. The previous
// version ignored it entirely, which is why "find every <price> over 10" meant
// converting to JSON and reaching for another tool.
//
// It needs a real DOM, so this is the one place DOMParser is still used: on a
// document the AST parser has already declared well-formed, its weak error
// reporting does not matter.
// ============================================================================

export interface XPathMatch {
  /** `/bookstore/book[2]/title` — rebuilt, not read off the node. */
  path: string;
  /** Element name, attribute name, or the node type for the rest. */
  label: string;
  /** Text content, clipped. */
  value: string;
}

export interface XPathOutcome {
  ok: boolean;
  /** Present when the expression itself is invalid. */
  error: string | null;
  /** For count()/string() style expressions that return a single value. */
  scalar: string | null;
  matches: XPathMatch[];
  total: number;
}

const MAX_MATCHES = 200;
const MAX_VALUE = 160;

function pathOf(node: Node): string {
  const parts: string[] = [];
  let current: Node | null = node;

  while (current && current.nodeType !== Node.DOCUMENT_NODE) {
    if (current.nodeType === Node.ATTRIBUTE_NODE) {
      const owner = (current as Attr).ownerElement;
      parts.unshift(`@${(current as Attr).name}`);
      current = owner;
      continue;
    }
    if (current.nodeType === Node.ELEMENT_NODE) {
      const el = current as Element;
      const parent = el.parentElement;
      if (parent) {
        const twins = Array.from(parent.children).filter(c => c.nodeName === el.nodeName);
        const at = twins.indexOf(el) + 1;
        parts.unshift(twins.length > 1 ? `${el.nodeName}[${at}]` : el.nodeName);
      } else {
        parts.unshift(el.nodeName);
      }
      current = parent;
      continue;
    }
    parts.unshift(current.nodeName);
    current = current.parentNode;
  }

  return `/${parts.join('/')}`;
}

function clip(text: string): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > MAX_VALUE ? `${flat.slice(0, MAX_VALUE)}…` : flat;
}

export function runXPath(source: string, expression: string): XPathOutcome {
  const empty: XPathOutcome = { ok: false, error: null, scalar: null, matches: [], total: 0 };
  if (!expression.trim()) return { ...empty, ok: true };

  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(source, 'application/xml');
  } catch {
    return { ...empty, error: 'parse' };
  }
  if (doc.querySelector('parsererror')) return { ...empty, error: 'parse' };

  try {
    const result = doc.evaluate(expression, doc, null, XPathResult.ANY_TYPE, null);

    switch (result.resultType) {
      case XPathResult.NUMBER_TYPE:
        return { ok: true, error: null, scalar: String(result.numberValue), matches: [], total: 1 };
      case XPathResult.STRING_TYPE:
        return { ok: true, error: null, scalar: result.stringValue, matches: [], total: 1 };
      case XPathResult.BOOLEAN_TYPE:
        return { ok: true, error: null, scalar: String(result.booleanValue), matches: [], total: 1 };
      default:
        break;
    }

    const matches: XPathMatch[] = [];
    let total = 0;
    let node = result.iterateNext();
    while (node) {
      total += 1;
      if (matches.length < MAX_MATCHES) {
        matches.push({
          path: pathOf(node),
          label: node.nodeName,
          value: clip(node.textContent ?? ''),
        });
      }
      node = result.iterateNext();
    }
    return { ok: true, error: null, scalar: null, matches, total };
  } catch (error) {
    return { ...empty, error: error instanceof Error ? error.message : 'invalid' };
  }
}
