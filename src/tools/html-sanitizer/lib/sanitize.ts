// ============================================================================
// The sanitiser
// ----------------------------------------------------------------------------
// Wraps DOMPurify instead of hand-rolling querySelectorAll passes. The point is
// not only that DOMPurify handles mXSS, namespace confusion and the dozen URL
// tricks a hand-written pass misses — it is that its hooks hand us the
// *decision* for every element and attribute before it is thrown away.
//
// That decision log is the product: the user sees what was removed and why, and
// can put any single item back without re-pasting anything (`overrides`).
//
// We ask for RETURN_DOM_FRAGMENT, not a string. Serialising is our job, so the
// same sanitised tree can come out pretty-printed, minified or as plain text
// without sanitising three times.
// ============================================================================

import DOMPurify from 'dompurify';
import type { Config } from 'dompurify';
import type { OutputFormat, Policy, Removal, RemovalReason, SanitizeResult } from '../types';
import { URI_ATTRS } from './presets';

/** Groups identical findings, so 300 stripped `onclick` are one row, not 300. */
export const removalId = (kind: string, reason: string, tag: string, attr?: string) =>
  `${kind}|${reason}|${tag}|${attr ?? ''}`;

/** Reasons that mean "this could have executed code", used for the red badge. */
const DANGEROUS: RemovalReason[] = ['event-handler', 'bad-scheme', 'tag-stripped'];

/**
 * Builds the regexp DOMPurify tests every URL-bearing attribute against.
 * Note what is deliberately absent from `data-image`: `svg+xml`. An inline SVG
 * data URL executes its own <script> the moment it is navigated to, so letting
 * it through under a checkbox labelled "images" would be a lie.
 */
const uriRegexp = (policy: Policy): RegExp => {
  const schemes: string[] = [];
  if (policy.allowedSchemes.includes('http')) schemes.push('http');
  if (policy.allowedSchemes.includes('https')) schemes.push('https');
  if (policy.allowedSchemes.includes('mailto')) schemes.push('mailto');
  if (policy.allowedSchemes.includes('tel')) schemes.push('tel', 'callto', 'sms');
  if (policy.allowedSchemes.includes('ftp')) schemes.push('ftp', 'ftps');

  const branches: string[] = [];
  if (schemes.length) branches.push('(?:' + schemes.join('|') + '):');
  if (policy.allowedSchemes.includes('data-image')) {
    branches.push('data:image\\/(?:png|jpeg|jpg|gif|webp|avif|bmp|x-icon|vnd\\.microsoft\\.icon);');
  }
  // The "no scheme at all" branch — `/path`, `#anchor`, `?q=1`, `page.html`.
  if (policy.allowedSchemes.includes('relative')) {
    branches.push('[^a-z]', '[a-z+.\\-]+(?:[^a-z+.\\-:]|$)');
  }
  // An empty policy must reject everything, and `^(?:)` matches every string.
  if (!branches.length) return /^\b$/;
  return new RegExp('^(?:' + branches.join('|') + ')', 'i');
};

const isEventHandler = (name: string) => name.startsWith('on') && name.length > 2;

const isUriAttr = (name: string) => URI_ATTRS.includes(name);

/** Characters a browser ignores inside a URL, and attackers hide schemes behind. */
const ATTR_WHITESPACE = /[\u0000-\u0020\u00a0\u1680\u180e\u2000-\u2029\u205f\u3000]/g;

/** Strips `url(...)` targets an inline style value should not be reaching. */
const scrubStyle = (value: string, allowed: RegExp): { value: string; changed: boolean } => {
  let changed = false;
  const cleaned = value.replace(/url\(\s*(['"]?)([^)'"]*)\1\s*\)/gi, (whole, _quote: string, url: string) => {
    if (allowed.test(url.trim().replace(ATTR_WHITESPACE, ''))) return whole;
    changed = true;
    return '';
  });
  // `expression()` and `-moz-binding` are the two CSS constructs that ever ran code.
  const noExpr = cleaned.replace(/expression\s*\(|-moz-binding\s*:/gi, () => {
    changed = true;
    return '';
  });
  return { value: noExpr, changed };
};

export interface SanitizeInput {
  html: string;
  policy: Policy;
  format: OutputFormat;
  /** Removal ids the user chose to allow back through. */
  overrides?: Set<string>;
  /** Extract text instead of markup (the "plain text" preset). */
  textOnly?: boolean;
}

const countElements = (html: string): number => {
  try {
    return new DOMParser().parseFromString(html, 'text/html').body.querySelectorAll('*').length;
  } catch {
    return 0;
  }
};

const utf8Bytes = (text: string): number => new TextEncoder().encode(text).length;

export function sanitize({ html, policy, format, overrides, textOnly }: SanitizeInput): SanitizeResult {
  const started = performance.now();
  const allow = overrides ?? new Set<string>();

  if (!html.trim()) {
    return { html: '', removals: [], bytesIn: 0, bytesOut: 0, elementsIn: 0, elementsOut: 0, durationMs: 0 };
  }

  const found = new Map<string, Removal>();
  const record = (
    kind: Removal['kind'],
    reason: RemovalReason,
    tag: string,
    sample: string,
    attr?: string
  ) => {
    const id = removalId(kind, reason, tag, attr);
    const existing = found.get(id);
    if (existing) {
      existing.count += 1;
      return;
    }
    found.set(id, {
      id,
      kind,
      reason,
      tag,
      attr,
      sample: sample.length > 120 ? sample.slice(0, 117) + '…' : sample,
      count: 1,
      dangerous: DANGEROUS.includes(reason),
    });
  };

  const allowedUri = uriRegexp(policy);
  const attrSet = new Set(policy.allowedAttrs.map(a => a.toLowerCase()));
  if (policy.keepInlineStyle) attrSet.add('style');
  if (policy.keepClasses) attrSet.add('class');
  if (policy.keepIds) {
    attrSet.add('id');
    attrSet.add('name');
  }

  const tagSet = new Set(policy.allowedTags.map(t => t.toLowerCase()));
  if (policy.allowSvgMath) {
    for (const t of ['svg', 'g', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse', 'text', 'tspan', 'defs', 'use', 'symbol', 'desc', 'math', 'mrow', 'mi', 'mn', 'mo', 'msup', 'msub', 'mfrac', 'msqrt', 'mtext']) {
      tagSet.add(t);
    }
    for (const a of ['viewbox', 'd', 'fill', 'stroke', 'stroke-width', 'cx', 'cy', 'r', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'points', 'transform', 'xmlns', 'preserveaspectratio', 'fill-rule', 'clip-rule', 'stroke-linecap', 'stroke-linejoin']) {
      attrSet.add(a);
    }
  }

  const stripSet = new Set(policy.stripWithContents.map(t => t.toLowerCase()));

  // An element override has to be resolved into the config, not inside the
  // hook: FORBID_TAGS/FORBID_CONTENTS are checked independently of the
  // allowedTags map the hook can reach, so flipping that map leaves a
  // <style> the user asked to keep still being deleted.
  const keptBack = new Set<string>();
  for (const id of allow) {
    const [kind, , tag] = id.split('|');
    if (kind !== 'element' || !tag) continue;
    keptBack.add(tag);
    tagSet.add(tag);
    stripSet.delete(tag);
  }

  // Parsing a fragment still builds html/head/body around it, and DOMPurify
  // walks that wrapper. Reporting "<body> removed" for a pasted <p> is noise
  // about the parser, not about the user's markup — so those three are only
  // worth a row when the source actually contained them.
  const STRUCTURAL = ['html', 'head', 'body'];
  const lowerSource = html.toLowerCase();
  const inSource = new Set(
    STRUCTURAL.filter(tag => lowerSource.includes('<' + tag))
  );

  const keepComments =
    policy.keepComments || allow.has(removalId('comment', 'comment', '#comment'));

  const config: Config = {
    // '#comment' is how DOMPurify names comment nodes in ALLOWED_TAGS.
    // Setting it here instead of mutating the hook's map avoids leaking the
    // decision into the next call, which shares that object.
    ALLOWED_TAGS: textOnly
      ? [...BLOCK, 'br', 'span', 'b', 'strong', 'em', 'i', 'a']
      : [...tagSet, ...(keepComments ? ['#comment'] : [])],
    ALLOWED_ATTR: textOnly ? [] : [...attrSet],
    FORBID_TAGS: [...stripSet],
    // KEEP_CONTENT decides drop-vs-unwrap for tags that are merely not allowed;
    // FORBID_CONTENTS is what makes `stripWithContents` take the subtree too.
    FORBID_CONTENTS: [...stripSet],
    KEEP_CONTENT: policy.unknownTags === 'unwrap',
    ALLOW_DATA_ATTR: !textOnly && policy.allowDataAttrs,
    ALLOW_ARIA_ATTR: !textOnly && policy.allowAriaAttrs,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    ALLOWED_URI_REGEXP: allowedUri,
    ALLOW_SELF_CLOSE_IN_ATTR: false,
    SAFE_FOR_XML: true,
    WHOLE_DOCUMENT: false,
    RETURN_DOM_FRAGMENT: true,
    SANITIZE_DOM: true,
  };

  const onElement = (node: Node, data: { tagName: string; allowedTags: Record<string, boolean> }) => {
    const tag = (data.tagName || '').toLowerCase();

    if (node.nodeType === 8) {
      if (!keepComments) record('comment', 'comment', '#comment', (node.nodeValue || '').trim());
      return;
    }
    if (!tag || node.nodeType !== 1) return;

    // Whatever the user kept back is already in the config; it survives and is
    // not a removal to report.
    if (keptBack.has(tag)) return;

    const stripped = stripSet.has(tag);
    if (data.allowedTags[tag] && !stripped) return;

    if (STRUCTURAL.includes(tag) && !inSource.has(tag)) return;

    const reason: RemovalReason = stripped ? 'tag-stripped' : 'tag-not-allowed';
    const el = node as Element;
    const sample = stripped ? (el.textContent || '').trim() : (el.outerHTML || '').slice(0, 120);
    record('element', reason, tag, sample);
  };

  const onAttribute = (
    node: Element,
    data: { attrName: string; attrValue: string; keepAttr: boolean; forceKeepAttr: boolean | undefined }
  ) => {
    const name = data.attrName.toLowerCase();
    const value = data.attrValue ?? '';
    const tag = node.nodeName.toLowerCase();

    const reject = (reason: RemovalReason) => {
      if (allow.has(removalId('attribute', reason, tag, name))) {
        data.forceKeepAttr = true;
        return;
      }
      record('attribute', reason, tag, value || name, name);
      data.keepAttr = false;
    };

    if (isEventHandler(name)) return reject('event-handler');

    if (name === 'style') {
      if (!policy.keepInlineStyle) return reject('inline-style');
      const scrubbed = scrubStyle(value, allowedUri);
      if (scrubbed.changed) {
        record('attribute', 'bad-scheme', tag, value, 'style');
        data.attrValue = scrubbed.value;
      }
      return;
    }
    if (name === 'class' && !policy.keepClasses) return reject('class-attr');
    if ((name === 'id' || name === 'name') && !policy.keepIds) return reject('id-attr');

    if (isUriAttr(name) && value) {
      // srcset carries a comma-separated list; one bad candidate poisons it.
      const urls = name === 'srcset' ? value.split(',').map(p => p.trim().split(/\s+/)[0]) : [value];
      const bad = urls.some(u => u && !allowedUri.test(u.replace(ATTR_WHITESPACE, '')));
      if (bad) return reject('bad-scheme');
    }

    const known =
      attrSet.has(name) ||
      (policy.allowDataAttrs && name.startsWith('data-')) ||
      (policy.allowAriaAttrs && (name.startsWith('aria-') || name === 'role'));
    if (!known) return reject('attr-not-allowed');
  };

  const onAfterAttributes = (node: Element) => {
    if (node.nodeName.toLowerCase() !== 'a') return;
    if (policy.stripTargets && node.hasAttribute('target')) node.removeAttribute('target');
    if (policy.hardenLinks && node.hasAttribute('href')) {
      node.setAttribute('rel', 'noopener noreferrer');
    }
  };

  DOMPurify.addHook('uponSanitizeElement', onElement as never);
  DOMPurify.addHook('uponSanitizeAttribute', onAttribute as never);
  DOMPurify.addHook('afterSanitizeAttributes', onAfterAttributes as never);

  let fragment: DocumentFragment | null = null;
  let failure: string | undefined;
  try {
    fragment = DOMPurify.sanitize(html, config) as unknown as DocumentFragment;
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error);
  } finally {
    DOMPurify.removeHook('uponSanitizeElement', onElement as never);
    DOMPurify.removeHook('uponSanitizeAttribute', onAttribute as never);
    DOMPurify.removeHook('afterSanitizeAttributes', onAfterAttributes as never);
  }

  if (!fragment) {
    return {
      html: '',
      removals: [],
      bytesIn: utf8Bytes(html),
      bytesOut: 0,
      elementsIn: countElements(html),
      elementsOut: 0,
      durationMs: performance.now() - started,
      error: failure || 'parse-failed',
    };
  }

  const output = textOnly ? extractText(fragment) : serialize(fragment, format);

  const removals = [...found.values()].sort((a, b) => {
    if (a.dangerous !== b.dangerous) return a.dangerous ? -1 : 1;
    return b.count - a.count;
  });

  return {
    html: output,
    removals,
    bytesIn: utf8Bytes(html),
    bytesOut: utf8Bytes(output),
    elementsIn: countElements(html),
    elementsOut: fragment.querySelectorAll('*').length,
    durationMs: performance.now() - started,
  };
}

// ---------------------------------------------------------------------------
// Serialisation
// ---------------------------------------------------------------------------

/** Elements that never have a closing tag. */
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
/** Elements whose whitespace is meaningful and must never be re-indented. */
const PRESERVE = new Set(['pre', 'textarea']);
/** Elements that sit on their own line in pretty mode. */
const BLOCK = new Set(['html', 'head', 'body', 'div', 'p', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'section', 'article', 'aside', 'header', 'footer', 'main', 'nav', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'figure', 'figcaption', 'form', 'fieldset', 'hr', 'dl', 'dt', 'dd', 'details', 'summary', 'pre']);

const escapeText = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const escapeAttr = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const openTag = (el: Element): string => {
  const name = el.tagName.toLowerCase();
  const attrs = [...el.attributes]
    .map(a => (a.value === '' ? ' ' + a.name : ' ' + a.name + '="' + escapeAttr(a.value) + '"'))
    .join('');
  return '<' + name + attrs + '>';
};

/**
 * Walks the sanitised fragment. Written by hand rather than reading
 * `innerHTML` because pretty-printing needs to know where the block
 * boundaries are, and because re-parsing a serialised string is exactly the
 * mutation-XSS window we just closed.
 */
function serialize(fragment: DocumentFragment, format: OutputFormat): string {
  if (format === 'raw') {
    const host = document.createElement('div');
    host.appendChild(fragment.cloneNode(true));
    return host.innerHTML;
  }

  const pretty = format === 'pretty';
  const out: string[] = [];

  const walk = (node: Node, depth: number, insidePre: boolean) => {
    const pad = pretty && !insidePre ? '  '.repeat(depth) : '';

    if (node.nodeType === 3) {
      const raw = node.nodeValue || '';
      if (insidePre) {
        out.push(escapeText(raw));
        return;
      }
      const text = raw.replace(/\s+/g, ' ');
      if (!text.trim()) return;
      out.push(pretty ? pad + escapeText(text.trim()) + '\n' : escapeText(text));
      return;
    }

    if (node.nodeType === 8) {
      const body = '<!--' + (node.nodeValue || '') + '-->';
      out.push(pretty ? pad + body + '\n' : body);
      return;
    }

    if (node.nodeType !== 1) return;

    const el = node as Element;
    const name = el.tagName.toLowerCase();
    const preserve = insidePre || PRESERVE.has(name);

    if (VOID.has(name)) {
      out.push(pretty && !insidePre ? pad + openTag(el) + '\n' : openTag(el));
      return;
    }

    const children = [...el.childNodes];
    const onlyText =
      children.length === 0 ||
      (children.length === 1 && children[0].nodeType === 3 && (children[0].nodeValue || '').length < 80);

    if (pretty && !preserve && !insidePre && onlyText) {
      const inner = escapeText((el.textContent || '').replace(/\s+/g, ' ').trim());
      out.push(pad + openTag(el) + inner + '</' + name + '>\n');
      return;
    }

    out.push(pretty && !insidePre ? pad + openTag(el) + '\n' : openTag(el));
    for (const child of children) walk(child, pretty && !preserve ? depth + 1 : depth, preserve);
    out.push(pretty && !preserve ? pad + '</' + name + '>\n' : '</' + name + '>');
  };

  for (const child of [...fragment.childNodes]) walk(child, 0, false);
  return out.join('').replace(/\n{3,}/g, '\n\n').trimEnd();
}

/**
 * Plain-text extraction that respects block boundaries — `textContent` alone
 * glues headings onto the paragraph below them.
 */
function extractText(fragment: DocumentFragment): string {
  const host = document.createElement('div');
  host.appendChild(fragment.cloneNode(true));
  const parts: string[] = [];

  const walk = (node: Node) => {
    if (node.nodeType === 3) {
      parts.push((node.nodeValue || '').replace(/\s+/g, ' '));
      return;
    }
    if (node.nodeType !== 1) return;
    const name = (node as Element).tagName.toLowerCase();
    if (name === 'br') {
      parts.push('\n');
      return;
    }
    // A cell is not a block — it needs a separator, not a line of its own,
    // or every two-column table turns into one word per line.
    if (name === 'td' || name === 'th') {
      for (const child of [...node.childNodes]) walk(child);
      parts.push('\t');
      return;
    }
    const block = BLOCK.has(name);
    if (block) parts.push('\n');
    for (const child of [...node.childNodes]) walk(child);
    if (block) parts.push('\n');
  };

  for (const child of [...host.childNodes]) walk(child);

  return parts
    .join('')
    .replace(/ +/g, ' ')
    .replace(/[ \t]*\t[ \t]*/g, '\t')
    .replace(/\t*\n\t*/g, '\n')
    .replace(/ *\n */g, '\n')
    .replace(/\t$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
