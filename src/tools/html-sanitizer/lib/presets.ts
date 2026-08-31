// ============================================================================
// Sanitisation presets
// ----------------------------------------------------------------------------
// Four starting points that cover what people actually paste into an HTML
// cleaner, plus "custom" for the manual route. Picking a preset never runs
// anything: it only fills the policy editor, and the user still presses the
// button.
// ============================================================================

import type { Policy, PresetId } from '../types';

/** Attributes that carry a URL and therefore go through the scheme check. */
export const URI_ATTRS = ['href', 'src', 'srcset', 'action', 'formaction', 'background', 'poster', 'cite', 'longdesc', 'xlink:href', 'data'];

const TEXT_TAGS = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup', 'mark', 'small', 'span'];
const HEADINGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
const LISTS = ['ul', 'ol', 'li', 'dl', 'dt', 'dd'];
const TABLES = ['table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption', 'colgroup', 'col'];
const BLOCKS = ['div', 'section', 'article', 'aside', 'header', 'footer', 'main', 'nav', 'blockquote', 'pre', 'code', 'hr', 'figure', 'figcaption', 'details', 'summary'];

/**
 * Everything below is deleted *with its contents*, never unwrapped: unwrapping
 * a <script> would dump its JavaScript into the page as visible text, which is
 * exactly the surprise the old version shipped.
 */
export const ALWAYS_STRIP = ['script', 'style', 'noscript', 'template', 'base', 'meta', 'link', 'title', 'head'];

export const PRESETS: Record<Exclude<PresetId, 'custom'>, Policy> = {
  // Nothing but structural text. What you want before storing user input.
  strict: {
    allowedTags: [...TEXT_TAGS, ...HEADINGS, ...LISTS, 'a', 'blockquote', 'pre', 'code', 'hr'],
    allowedAttrs: ['href', 'title', 'lang', 'dir'],
    unknownTags: 'unwrap',
    stripWithContents: [...ALWAYS_STRIP, 'iframe', 'object', 'embed', 'form', 'input', 'button', 'select', 'textarea', 'canvas', 'audio', 'video'],
    allowedSchemes: ['http', 'https', 'mailto', 'relative'],
    allowDataAttrs: false,
    allowAriaAttrs: false,
    keepComments: false,
    keepInlineStyle: false,
    keepClasses: false,
    keepIds: false,
    allowSvgMath: false,
    hardenLinks: true,
    stripTargets: true,
  },

  // Email clients strip <style> blocks and most CSS, but live on inline style
  // and table layout — so this preset deliberately keeps both.
  email: {
    allowedTags: [...TEXT_TAGS, ...HEADINGS, ...LISTS, ...TABLES, 'a', 'img', 'div', 'center', 'font', 'hr', 'blockquote'],
    allowedAttrs: ['href', 'src', 'alt', 'title', 'width', 'height', 'align', 'valign', 'bgcolor', 'color', 'face', 'size', 'border', 'cellpadding', 'cellspacing', 'colspan', 'rowspan', 'style', 'lang', 'dir'],
    unknownTags: 'unwrap',
    stripWithContents: [...ALWAYS_STRIP, 'iframe', 'object', 'embed', 'form', 'input', 'button', 'canvas', 'audio', 'video'],
    allowedSchemes: ['http', 'https', 'mailto', 'tel', 'data-image', 'relative'],
    allowDataAttrs: false,
    allowAriaAttrs: false,
    keepComments: false,
    keepInlineStyle: true,
    keepClasses: false,
    keepIds: false,
    allowSvgMath: false,
    hardenLinks: false,
    stripTargets: false,
  },

  // A CMS body: rich markup survives, scripting does not.
  content: {
    allowedTags: [...TEXT_TAGS, ...HEADINGS, ...LISTS, ...TABLES, ...BLOCKS, 'a', 'img', 'picture', 'source', 'video', 'audio', 'track', 'time', 'abbr', 'cite', 'q', 'kbd', 'samp', 'var', 'del', 'ins'],
    allowedAttrs: ['href', 'src', 'srcset', 'sizes', 'alt', 'title', 'width', 'height', 'loading', 'decoding', 'colspan', 'rowspan', 'headers', 'scope', 'datetime', 'lang', 'dir', 'controls', 'poster', 'type', 'media', 'open', 'start', 'reversed', 'value'],
    unknownTags: 'unwrap',
    stripWithContents: [...ALWAYS_STRIP, 'iframe', 'object', 'embed', 'form', 'input', 'button', 'select', 'textarea', 'canvas'],
    allowedSchemes: ['http', 'https', 'mailto', 'tel', 'data-image', 'relative'],
    allowDataAttrs: true,
    allowAriaAttrs: true,
    keepComments: false,
    keepInlineStyle: false,
    keepClasses: true,
    keepIds: true,
    allowSvgMath: true,
    hardenLinks: true,
    stripTargets: false,
  },

  // No markup at all: the text, with block boundaries turned into newlines.
  text: {
    allowedTags: [],
    allowedAttrs: [],
    unknownTags: 'unwrap',
    stripWithContents: ALWAYS_STRIP,
    allowedSchemes: [],
    allowDataAttrs: false,
    allowAriaAttrs: false,
    keepComments: false,
    keepInlineStyle: false,
    keepClasses: false,
    keepIds: false,
    allowSvgMath: false,
    hardenLinks: false,
    stripTargets: true,
  },
};

export const clonePolicy = (policy: Policy): Policy => ({
  ...policy,
  allowedTags: [...policy.allowedTags],
  allowedAttrs: [...policy.allowedAttrs],
  stripWithContents: [...policy.stripWithContents],
  allowedSchemes: [...policy.allowedSchemes],
});

export const presetPolicy = (id: PresetId): Policy =>
  clonePolicy(PRESETS[id === 'custom' ? 'content' : id]);

/** True when two policies would produce the same output, order-insensitively. */
export const samePolicy = (a: Policy, b: Policy): boolean => {
  const list = (xs: string[]) => [...xs].sort().join(',');
  return (
    list(a.allowedTags) === list(b.allowedTags) &&
    list(a.allowedAttrs) === list(b.allowedAttrs) &&
    list(a.stripWithContents) === list(b.stripWithContents) &&
    list(a.allowedSchemes) === list(b.allowedSchemes) &&
    a.unknownTags === b.unknownTags &&
    a.allowDataAttrs === b.allowDataAttrs &&
    a.allowAriaAttrs === b.allowAriaAttrs &&
    a.keepComments === b.keepComments &&
    a.keepInlineStyle === b.keepInlineStyle &&
    a.keepClasses === b.keepClasses &&
    a.keepIds === b.keepIds &&
    a.allowSvgMath === b.allowSvgMath &&
    a.hardenLinks === b.hardenLinks &&
    a.stripTargets === b.stripTargets
  );
};

/** Which preset (if any) a policy currently matches, for the UI badge. */
export const matchPreset = (policy: Policy): PresetId => {
  for (const id of ['strict', 'email', 'content', 'text'] as const) {
    if (samePolicy(policy, PRESETS[id])) return id;
  }
  return 'custom';
};
