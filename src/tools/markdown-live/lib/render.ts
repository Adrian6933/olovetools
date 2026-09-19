// ============================================================================
// AST → HTML
// ----------------------------------------------------------------------------
// Two things this module refuses to do, because the old renderer did both:
//
//  * Emit Tailwind classes. The markup that comes out is semantic HTML with a
//    handful of `md-` hooks, so "Copy HTML" produces something you can paste
//    into a CMS and the exported file can carry the theme you actually picked.
//  * Trust a URL or a piece of text. Everything that reaches an attribute goes
//    through `escapeAttribute`, and every href through `safeUrl`, which is what
//    closes the `[x](" onmouseover="alert(1))` hole.
// ============================================================================

import type { Block, Inline, RenderOptions } from '../types';

// ---------------------------------------------------------------------------
// Escaping
// ---------------------------------------------------------------------------

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Text destined for an attribute value: quotes matter here, not just angles. */
export function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Only schemes that cannot execute anything. Everything else — `javascript:`,
 * `vbscript:`, `file:`, and any scheme invented tomorrow — becomes an inert
 * anchor rather than silently disappearing, so the writer sees their typo.
 */
const SAFE_SCHEME = /^(https?:|mailto:|tel:|ftp:|#|\/|\.\/|\.\.\/|[^:]*$)/i;
const SAFE_IMAGE = /^(https?:|data:image\/(png|jpe?g|gif|webp|avif|svg\+xml);|#|\/|\.\/|\.\.\/|[^:]*$)/i;

export function safeUrl(raw: string, kind: 'link' | 'image' = 'link'): string {
  // Control characters are stripped before the scheme is tested: a literal tab
  // inside 'java<TAB>script:' is a real bypass against sanitisers that only trim.
  const value = raw.trim().replace(/[\u0000-\u001f\u007f]/g, '');
  // A quote or an angle bracket inside a URL is never a real address; it is
  // somebody probing for an attribute break. Escaping already makes it inert,
  // and refusing it as well means the writer is shown the problem instead of
  // shipping a live link to nowhere.
  if (/["'<>`]/.test(value)) return '';
  const pattern = kind === 'image' ? SAFE_IMAGE : SAFE_SCHEME;
  return pattern.test(value) ? value : '';
}

// ---------------------------------------------------------------------------
// Inline
// ---------------------------------------------------------------------------

function renderInline(nodes: Inline[], options: RenderOptions): string {
  return nodes
    .map(node => {
      switch (node.type) {
        case 'text':
          return escapeHtml(node.value);
        case 'strong':
          return `<strong>${renderInline(node.children, options)}</strong>`;
        case 'em':
          return `<em>${renderInline(node.children, options)}</em>`;
        case 'del':
          return `<del>${renderInline(node.children, options)}</del>`;
        case 'mark':
          return `<mark>${renderInline(node.children, options)}</mark>`;
        case 'code':
          return `<code>${escapeHtml(node.value)}</code>`;
        case 'break':
          return '<br />';
        case 'link': {
          const href = safeUrl(node.href, 'link');
          const title = node.title ? ` title="${escapeAttribute(node.title)}"` : '';
          const external = /^https?:/i.test(href);
          const target = external ? ' target="_blank" rel="noopener noreferrer"' : '';
          const label = renderInline(node.children, options);
          if (!href) return `<span class="md-broken-link">${label}</span>`;
          return `<a href="${escapeAttribute(href)}"${title}${target}>${label}</a>`;
        }
        case 'image': {
          const src = safeUrl(node.src, 'image');
          const title = node.title ? ` title="${escapeAttribute(node.title)}"` : '';
          if (!src) return `<span class="md-broken-link">${escapeHtml(node.alt)}</span>`;
          return `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(node.alt)}"${title} loading="lazy" />`;
        }
        case 'footnoteRef':
          return `<sup class="md-fnref" id="fnref-${escapeAttribute(node.id)}"><a href="#fn-${escapeAttribute(
            node.id
          )}">${node.index}</a></sup>`;
        default:
          return '';
      }
    })
    .join('');
}

// ---------------------------------------------------------------------------
// Blocks
// ---------------------------------------------------------------------------

function renderBlocks(blocks: Block[], options: RenderOptions): string {
  return blocks.map(block => renderBlock(block, options)).join('\n');
}

function renderBlock(block: Block, options: RenderOptions): string {
  switch (block.type) {
    case 'heading': {
      const id = escapeAttribute(block.slug);
      const anchor = options.anchors
        ? `<a class="md-anchor" href="#${id}" aria-label="${escapeAttribute(options.anchorLabel || 'Link to this section')}">#</a>`
        : '';
      return `<h${block.depth} id="${id}">${renderInline(block.children, options)}${anchor}</h${block.depth}>`;
    }

    case 'paragraph':
      return `<p>${renderInline(block.children, options)}</p>`;

    case 'code': {
      const lang = block.lang.replace(/[^a-z0-9+#-]/gi, '');
      const highlighted = options.highlight ? options.highlight(block.value, lang) : null;
      const body = highlighted === null ? escapeHtml(block.value) : highlighted;
      const cls = lang ? ` class="language-${escapeAttribute(lang)}"` : '';
      const label = lang ? ` data-lang="${escapeAttribute(lang)}"` : '';
      return `<pre${label}><code${cls}>${body}</code></pre>`;
    }

    case 'blockquote':
      return `<blockquote>\n${renderBlocks(block.children, options)}\n</blockquote>`;

    case 'hr':
      return '<hr />';

    case 'list': {
      const tag = block.ordered ? 'ol' : 'ul';
      const start = block.ordered && block.start !== 1 ? ` start="${block.start}"` : '';
      const isTaskList = block.items.some(item => item.checked !== null);
      const cls = isTaskList ? ' class="md-tasklist"' : '';
      const items = block.items
        .map(item => {
          // A tight list renders its single paragraph unwrapped, which is what
          // keeps bullets from being spaced out like separate blocks.
          const inner =
            block.tight && item.children.length === 1 && item.children[0].type === 'paragraph'
              ? renderInline(item.children[0].children, options)
              : renderBlocks(item.children, options);
          if (item.checked === null) return `<li>${inner}</li>`;
          const checked = item.checked ? ' checked' : '';
          return `<li class="md-task"><input type="checkbox" disabled${checked} />${inner}</li>`;
        })
        .join('\n');
      return `<${tag}${start}${cls}>\n${items}\n</${tag}>`;
    }

    case 'table': {
      const head = block.header
        .map((cell, index) => `<th${alignAttr(block.align[index])}>${renderInline(cell, options)}</th>`)
        .join('');
      const body = block.rows
        .map(
          row =>
            `<tr>${row
              .map((cell, index) => `<td${alignAttr(block.align[index])}>${renderInline(cell, options)}</td>`)
              .join('')}</tr>`
        )
        .join('\n');
      return `<div class="md-table-scroll"><table>\n<thead><tr>${head}</tr></thead>\n<tbody>\n${body}\n</tbody>\n</table></div>`;
    }

    case 'footnotes': {
      const items = block.items
        .map(
          item =>
            `<li id="fn-${escapeAttribute(item.id)}">${renderBlocks(item.children, options)}` +
            `<a class="md-fnback" href="#fnref-${escapeAttribute(item.id)}">&#8617;</a></li>`
        )
        .join('\n');
      return `<section class="md-footnotes"><hr /><ol>\n${items}\n</ol></section>`;
    }

    default:
      return '';
  }
}

function alignAttr(align: string | undefined): string {
  return align && align !== 'left' ? ` style="text-align:${align}"` : '';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function render(blocks: Block[], options: RenderOptions = {}): string {
  const html = renderBlocks(blocks, options);
  return options.bare ? stripClasses(html) : html;
}

/** For "copy clean HTML": semantic tags and nothing else. */
function stripClasses(html: string): string {
  return html
    .replace(/ (?:class|id|data-lang|loading)="[^"]*"/g, '')
    .replace(/<div class="md-table-scroll">|<\/div>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
