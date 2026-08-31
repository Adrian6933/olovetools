// ============================================================================
// Turning an optimized SVG into the shapes people paste into code.
// ============================================================================

/**
 * SVG attribute -> JSX prop. Only attributes that differ; everything else
 * passes through unchanged.
 *
 * The reason this is a real conversion rather than a chain of
 * `String.replace()` calls is that a blind replace does not know where it is.
 * Replacing `fill-rule` everywhere also rewrites the word inside an `id`, a
 * class name, a `<style>` body or a `<title>`, and the result is markup that
 * looks right and is quietly wrong.
 */
const JSX_ATTRS: Record<string, string> = {
  'accent-height': 'accentHeight', 'alignment-baseline': 'alignmentBaseline',
  'arabic-form': 'arabicForm', 'baseline-shift': 'baselineShift',
  'cap-height': 'capHeight', 'clip-path': 'clipPath', 'clip-rule': 'clipRule',
  'color-interpolation': 'colorInterpolation',
  'color-interpolation-filters': 'colorInterpolationFilters',
  'color-profile': 'colorProfile', 'color-rendering': 'colorRendering',
  'dominant-baseline': 'dominantBaseline', 'enable-background': 'enableBackground',
  'fill-opacity': 'fillOpacity', 'fill-rule': 'fillRule', 'flood-color': 'floodColor',
  'flood-opacity': 'floodOpacity', 'font-family': 'fontFamily', 'font-size': 'fontSize',
  'font-size-adjust': 'fontSizeAdjust', 'font-stretch': 'fontStretch',
  'font-style': 'fontStyle', 'font-variant': 'fontVariant', 'font-weight': 'fontWeight',
  'glyph-name': 'glyphName', 'glyph-orientation-horizontal': 'glyphOrientationHorizontal',
  'glyph-orientation-vertical': 'glyphOrientationVertical',
  'horiz-adv-x': 'horizAdvX', 'horiz-origin-x': 'horizOriginX',
  'image-rendering': 'imageRendering', 'letter-spacing': 'letterSpacing',
  'lighting-color': 'lightingColor', 'marker-end': 'markerEnd', 'marker-mid': 'markerMid',
  'marker-start': 'markerStart', 'overline-position': 'overlinePosition',
  'overline-thickness': 'overlineThickness', 'paint-order': 'paintOrder',
  'pointer-events': 'pointerEvents', 'rendering-intent': 'renderingIntent',
  'shape-rendering': 'shapeRendering', 'stop-color': 'stopColor',
  'stop-opacity': 'stopOpacity', 'strikethrough-position': 'strikethroughPosition',
  'strikethrough-thickness': 'strikethroughThickness', 'stroke-dasharray': 'strokeDasharray',
  'stroke-dashoffset': 'strokeDashoffset', 'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin', 'stroke-miterlimit': 'strokeMiterlimit',
  'stroke-opacity': 'strokeOpacity', 'stroke-width': 'strokeWidth',
  'text-anchor': 'textAnchor', 'text-decoration': 'textDecoration',
  'text-rendering': 'textRendering', 'underline-position': 'underlinePosition',
  'underline-thickness': 'underlineThickness', 'unicode-bidi': 'unicodeBidi',
  'unicode-range': 'unicodeRange', 'units-per-em': 'unitsPerEm',
  'v-alphabetic': 'vAlphabetic', 'v-hanging': 'vHanging', 'v-ideographic': 'vIdeographic',
  'v-mathematical': 'vMathematical', 'vector-effect': 'vectorEffect',
  'vert-adv-y': 'vertAdvY', 'vert-origin-x': 'vertOriginX', 'vert-origin-y': 'vertOriginY',
  'word-spacing': 'wordSpacing', 'writing-mode': 'writingMode',
  'x-height': 'xHeight', 'xlink:actuate': 'xlinkActuate', 'xlink:arcrole': 'xlinkArcrole',
  'xlink:href': 'xlinkHref', 'xlink:role': 'xlinkRole', 'xlink:show': 'xlinkShow',
  'xlink:title': 'xlinkTitle', 'xlink:type': 'xlinkType', 'xml:base': 'xmlBase',
  'xml:lang': 'xmlLang', 'xml:space': 'xmlSpace', 'xmlns:xlink': 'xmlnsXlink',
  class: 'className', for: 'htmlFor', tabindex: 'tabIndex',
};

/**
 * `style="fill:red;stroke-width:2"` -> `style={{fill:"red",strokeWidth:"2"}}`.
 *
 * JSX rejects a string here at runtime ("The `style` prop expects a mapping
 * from style properties to values, not a string"), so emitting the attribute
 * verbatim produces a component that looks fine and throws on first render.
 */
function styleToJsx(css: string): string {
  const entries: string[] = [];

  for (const declaration of css.split(';')) {
    const colon = declaration.indexOf(':');
    if (colon === -1) continue;
    const property = declaration.slice(0, colon).trim();
    const value = declaration.slice(colon + 1).trim();
    if (!property || !value) continue;

    // Custom properties keep their exact spelling and need quoting as a key.
    const key = property.startsWith('--')
      ? JSON.stringify(property)
      : property.replace(/-([a-z])/g, (_m, letter: string) => letter.toUpperCase());

    entries.push(`${key}: ${JSON.stringify(value)}`);
  }

  return entries.length > 0 ? `{{ ${entries.join(', ')} }}` : '{{}}';
}

/** A valid JS identifier, in PascalCase, derived from a filename. */
export function componentNameFrom(fileName: string): string {
  const base = fileName.replace(/\.svgz?$/i, '');
  const parts = base.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  const name = parts
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  // A leading digit is legal in a filename and illegal in an identifier.
  return /^[A-Za-z]/.test(name) ? name : `Svg${name || 'Icon'}`;
}

/**
 * A React component source string. Parsed as XML and re-emitted, so attribute
 * renaming only ever touches actual attribute names.
 */
export function toReactComponent(svg: string, fileName: string): string {
  const name = componentNameFrom(fileName);

  if (typeof DOMParser === 'undefined') return svg;
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  if (doc.querySelector('parsererror') || !doc.documentElement) return svg;

  const emitAttrs = (element: Element): string =>
    Array.from(element.attributes)
      .map(attr => {
        const jsxName = JSX_ATTRS[attr.name] || (attr.name.includes(':') ? null : attr.name);
        // An attribute with a colon and no known mapping cannot be written as a
        // JSX prop at all; dropping it beats emitting code that will not parse.
        if (!jsxName) return null;
        if (jsxName === 'style') return `style=${styleToJsx(attr.value)}`;
        return `${jsxName}="${attr.value.replace(/"/g, '&quot;')}"`;
      })
      .filter(Boolean)
      .join(' ');

  const emit = (element: Element, depth: number): string => {
    const pad = '  '.repeat(depth + 1);
    const tag = element.tagName;
    const attrs = emitAttrs(element);
    const open = attrs ? `${tag} ${attrs}` : tag;
    const children = Array.from(element.children);
    const text = element.children.length === 0 ? (element.textContent || '').trim() : '';

    // Any empty element can self-close in JSX, so there is no tag list to keep.
    if (children.length === 0 && !text) return `${pad}<${open} />`;
    if (children.length === 0) {
      // `<style>` bodies contain braces, which JSX reads as expressions.
      const body = tag === 'style' ? `{\`${text.replace(/`/g, '\\`')}\`}` : text;
      return `${pad}<${open}>${body}</${tag}>`;
    }
    const inner = children.map(child => emit(child, depth + 1)).join('\n');
    return `${pad}<${open}>\n${inner}\n${pad}</${tag}>`;
  };

  const root = doc.documentElement;
  const rootAttrs = emitAttrs(root);

  const children = Array.from(root.children)
    .map(child => emit(child, 1))
    .join('\n');

  return `const ${name} = (props) => (
  <svg ${rootAttrs} {...props}>
${children}
  </svg>
);

export default ${name};
`;
}

/**
 * A CSS-ready `url("data:…")`.
 *
 * URL-encoded rather than base64 by default: for SVG it is both smaller and
 * readable, and it survives gzip far better than base64 does.
 */
export function toDataUri(svg: string, mode: 'url' | 'base64' = 'url'): string {
  const collapsed = svg.replace(/\s+/g, ' ').trim();

  if (mode === 'base64') {
    // btoa() is Latin-1 only; SVGs routinely carry non-ASCII in <title>.
    const bytes = new TextEncoder().encode(collapsed);
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return `url("data:image/svg+xml;base64,${btoa(binary)}")`;
  }

  // Single quotes inside, double quotes outside: keeps the value usable in CSS
  // without escaping every attribute delimiter.
  const singleQuoted = collapsed.replace(/"/g, "'");
  const encoded = encodeURIComponent(singleQuoted)
    // These are legal unencoded in a data URI and cost 2 bytes each encoded.
    .replace(/%20/g, ' ')
    .replace(/%3D/g, '=')
    .replace(/%3A/g, ':')
    .replace(/%2F/g, '/');

  return `url("data:image/svg+xml,${encoded}")`;
}

/**
 * Saves a string as a file.
 *
 * The object URL is revoked on a later tick, not immediately after `click()`:
 * Firefox has not started reading it yet at that point and revoking cancels the
 * download outright.
 */
export function downloadText(text: string, fileName: string, mime = 'image/svg+xml'): void {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
