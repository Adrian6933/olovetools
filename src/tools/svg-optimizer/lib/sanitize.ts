// ============================================================================
// Making an untrusted SVG safe to render in the preview.
// ----------------------------------------------------------------------------
// The preview injects the user's SVG into the page. An SVG is not an image in
// this context, it is a document, and `innerHTML` runs a good deal of what is
// inside one. Verified in this app's own page:
//
//     <animate onbegin="…">                    fires
//     <image href="x" onerror="…">             fires
//     <foreignObject><img src=x onerror="…">   fires
//
// So a `.svg` someone was asked to "just check in this tool" executes script in
// olovetools' origin. On top of that, an `<image href="https://…">` makes a
// network request the moment it renders, which quietly falsifies the tool's
// central claim of running entirely on the user's machine.
//
// The optimizer's `removeScripts` plugin covers part of this, but the preview
// has to be safe regardless of which plugins the user turned off, and it has to
// be safe for the *original* SVG too, which is shown side by side. So the
// preview gets its own pass, independent of the optimizer.
// ============================================================================

import { repairSvgSource } from './repair';

/** Elements with no legitimate role inside a static preview. */
const FORBIDDEN_TAGS = new Set(['script', 'foreignobject', 'iframe', 'embed', 'object', 'audio', 'video', 'handler', 'listener', 'set']);

/** Attribute values that can execute or fetch. */
const URL_ATTRS = ['href', 'xlink:href', 'src', 'from', 'to', 'values', 'by'];

export interface SanitizeResult {
  html: string;
  /** True when something executable or remote was stripped, so the UI can say so. */
  strippedScript: boolean;
  strippedRemote: boolean;
}

/**
 * Returns markup safe to hand to `dangerouslySetInnerHTML`.
 *
 * Parsed as XML rather than HTML: `image/svg+xml` never runs anything during
 * parsing, whereas an HTML parse of the same string can. Nothing from the
 * document is inserted into the live page until after this pass.
 */
export function sanitizeForPreview(svg: string): SanitizeResult {
  let strippedScript = false;
  let strippedRemote = false;

  if (typeof DOMParser === 'undefined') {
    return { html: '', strippedScript: false, strippedRemote: false };
  }

  // The same repair the optimizer applies. Without it the hold-to-compare view
  // is blank for exactly the files this tool exists to rescue: the parser
  // rejects the undeclared `inkscape:` prefix in the *original* just as it
  // rejected it in the optimizer, and there is nothing to show beside the
  // result.
  const doc = new DOMParser().parseFromString(repairSvgSource(svg).source, 'image/svg+xml');
  if (doc.querySelector('parsererror') || !doc.documentElement) {
    // Fail closed. A document we cannot parse is a document we cannot vouch
    // for, and a blank stage is better than rendering it unchecked.
    return { html: '', strippedScript: false, strippedRemote: false };
  }

  const walk = (element: Element) => {
    for (const child of Array.from(element.children)) walk(child);

    if (FORBIDDEN_TAGS.has(element.tagName.toLowerCase())) {
      element.remove();
      strippedScript = true;
      return;
    }

    for (const attr of Array.from(element.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value;

      // Event handlers, in any namespace spelling.
      if (name.startsWith('on')) {
        element.removeAttribute(attr.name);
        strippedScript = true;
        continue;
      }

      if (URL_ATTRS.includes(name)) {
        const trimmed = value.trim();
        // Same-document references (`#gradient`) are the whole point of defs.
        if (trimmed.startsWith('#')) continue;
        // Inline data is local by definition, but `data:` can carry markup.
        if (/^data:image\/(png|jpe?g|gif|webp|avif);/i.test(trimmed)) continue;

        element.removeAttribute(attr.name);
        if (/^(https?:)?\/\//i.test(trimmed)) strippedRemote = true;
        else strippedScript = true;
      }

      // `style` can pull a remote url() in.
      if (name === 'style' && /url\(\s*['"]?(https?:)?\/\//i.test(value)) {
        element.setAttribute('style', value.replace(/url\([^)]*\)/gi, 'none'));
        strippedRemote = true;
      }
    }
  };

  walk(doc.documentElement);

  // A stylesheet can carry @import and url() just as well as a style attribute.
  for (const style of Array.from(doc.querySelectorAll('style'))) {
    const css = style.textContent || '';
    if (/@import|url\(\s*['"]?(https?:)?\/\//i.test(css)) {
      style.textContent = css.replace(/@import[^;]*;/gi, '').replace(/url\([^)]*\)/gi, 'none');
      strippedRemote = true;
    }
  }

  return {
    html: new XMLSerializer().serializeToString(doc),
    strippedScript,
    strippedRemote,
  };
}
