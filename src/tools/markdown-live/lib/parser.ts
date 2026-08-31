// ============================================================================
// Markdown → AST
// ----------------------------------------------------------------------------
// A block scanner with a separate inline pass, not a chain of `String.replace`.
// The old parser hid code spans behind `__CODE_BLOCK_0__` placeholders and then
// ran an italics regex over the whole string, which ate the placeholders (and
// `target="_blank"` along with them). Nothing here is order-dependent in that
// way: block structure is decided line by line, inline structure by walking the
// characters of one line at a time, and nothing ever re-reads its own output.
//
// No DOM is touched in this module, on purpose — it has to run inside a worker.
// ============================================================================

import type {
  Align,
  Block,
  DocStats,
  FootnoteDef,
  Inline,
  ListItem,
  ParsedDoc,
  TocEntry,
} from '../types';

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function parse(source: string): ParsedDoc {
  const normalized = source.replace(/\r\n?/g, '\n').replace(/\t/g, '    ');
  const { body, frontMatter } = splitFrontMatter(normalized);

  const ctx: Context = {
    slugs: new Map(),
    footnoteOrder: [],
    footnoteBodies: new Map(),
  };

  // Footnote definitions are pulled out first: they can sit anywhere in the
  // document but always render last, and their bodies must not be mistaken for
  // ordinary paragraphs where they were written.
  const lines = stripFootnoteDefinitions(body.split('\n'), ctx);
  const blocks = parseBlocks(lines, ctx);

  if (ctx.footnoteOrder.length > 0) {
    const items: FootnoteDef[] = ctx.footnoteOrder.map((id, index) => ({
      id,
      index: index + 1,
      children: parseBlocks((ctx.footnoteBodies.get(id) || '').split('\n'), ctx),
    }));
    blocks.push({ type: 'footnotes', items });
  }

  return {
    blocks,
    toc: collectToc(blocks),
    stats: measure(body, blocks),
    frontMatter,
  };
}

interface Context {
  /** Heading slugs already used, so duplicates get `-1`, `-2`… suffixes. */
  slugs: Map<string, number>;
  footnoteOrder: string[];
  footnoteBodies: Map<string, string>;
}

// ---------------------------------------------------------------------------
// Front matter
// ---------------------------------------------------------------------------

function splitFrontMatter(text: string): { body: string; frontMatter: string } {
  if (!text.startsWith('---\n')) return { body: text, frontMatter: '' };
  const end = text.indexOf('\n---', 3);
  if (end === -1) return { body: text, frontMatter: '' };
  const after = text.indexOf('\n', end + 1);
  return {
    frontMatter: text.slice(4, end),
    body: after === -1 ? '' : text.slice(after + 1),
  };
}

// ---------------------------------------------------------------------------
// Footnote definitions:  [^id]: body, continued by indented lines
// ---------------------------------------------------------------------------

function stripFootnoteDefinitions(lines: string[], ctx: Context): string[] {
  const kept: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const match = /^\[\^([^\]\s]+)\]:\s?(.*)$/.exec(lines[i]);
    if (!match) {
      kept.push(lines[i]);
      continue;
    }
    const id = match[1];
    const body: string[] = [match[2]];
    while (i + 1 < lines.length && (/^\s{2,}\S/.test(lines[i + 1]) || lines[i + 1].trim() === '')) {
      // A blank line only continues the note if something indented follows it.
      if (lines[i + 1].trim() === '' && !/^\s{2,}\S/.test(lines[i + 2] || '')) break;
      body.push(lines[i + 1].replace(/^\s{0,4}/, ''));
      i++;
    }
    ctx.footnoteBodies.set(id, body.join('\n').trim());
    if (!ctx.footnoteOrder.includes(id)) ctx.footnoteOrder.push(id);
  }
  return kept;
}

// ---------------------------------------------------------------------------
// Block level
// ---------------------------------------------------------------------------

const RE_FENCE = /^(\s{0,3})(`{3,}|~{3,})\s*([^`\s]*)\s*$/;
const RE_ATX = /^(\s{0,3})(#{1,6})(\s+(.*?))?\s*#*\s*$/;
const RE_HR = /^\s{0,3}((\*\s*){3,}|(-\s*){3,}|(_\s*){3,})$/;
const RE_BULLET = /^(\s*)([*\-+])(\s+)(.*)$/;
const RE_ORDERED = /^(\s*)(\d{1,9})([.)])(\s+)(.*)$/;
const RE_QUOTE = /^\s{0,3}>\s?(.*)$/;
const RE_SETEXT = /^\s{0,3}(=+|-{2,})\s*$/;
const RE_TASK = /^\[([ xX])\]\s+(.*)$/;

function parseBlocks(lines: string[], ctx: Context): Block[] {
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // --- blank ------------------------------------------------------------
    if (line.trim() === '') {
      i++;
      continue;
    }

    // --- fenced code ------------------------------------------------------
    const fence = RE_FENCE.exec(line);
    if (fence) {
      const marker = fence[2][0];
      const width = fence[2].length;
      const indent = fence[1].length;
      const value: string[] = [];
      i++;
      while (i < lines.length) {
        const close = new RegExp(`^\\s{0,3}${marker === '`' ? '`' : '~'}{${width},}\\s*$`);
        if (close.test(lines[i])) {
          i++;
          break;
        }
        value.push(lines[i].slice(0, indent).trim() === '' ? lines[i].slice(indent) : lines[i]);
        i++;
      }
      blocks.push({ type: 'code', lang: fence[3].toLowerCase(), value: value.join('\n') });
      continue;
    }

    // --- indented code (4 spaces, only outside lists) ---------------------
    if (/^ {4}\S/.test(line) && !blocks.some(b => b.type === 'list' && b === blocks[blocks.length - 1])) {
      const value: string[] = [];
      while (i < lines.length && (/^ {4}/.test(lines[i]) || lines[i].trim() === '')) {
        if (lines[i].trim() === '' && !/^ {4}\S/.test(lines[i + 1] || '')) break;
        value.push(lines[i].slice(4));
        i++;
      }
      blocks.push({ type: 'code', lang: '', value: value.join('\n').replace(/\n+$/, '') });
      continue;
    }

    // --- thematic break ---------------------------------------------------
    // Checked before lists so that `---` and `***` are never read as bullets.
    if (RE_HR.test(line)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // --- ATX heading ------------------------------------------------------
    const atx = RE_ATX.exec(line);
    if (atx) {
      const text = (atx[4] || '').trim();
      blocks.push({
        type: 'heading',
        depth: atx[2].length,
        slug: uniqueSlug(text, ctx),
        children: parseInline(text, ctx),
      });
      i++;
      continue;
    }

    // --- blockquote (recursive) -------------------------------------------
    if (RE_QUOTE.test(line)) {
      const inner: string[] = [];
      while (i < lines.length && (RE_QUOTE.test(lines[i]) || (inner.length > 0 && lines[i].trim() !== ''))) {
        const quoted = RE_QUOTE.exec(lines[i]);
        inner.push(quoted ? quoted[1] : lines[i]);
        i++;
      }
      blocks.push({ type: 'blockquote', children: parseBlocks(inner, ctx) });
      continue;
    }

    // --- table ------------------------------------------------------------
    // A separator row is mandatory: one stray `|` in a sentence must not turn
    // the paragraph into a table, which is exactly what used to happen.
    if (line.includes('|') && isTableSeparator(lines[i + 1] || '')) {
      const align = parseAlignments(lines[i + 1]);
      const header = splitRow(line).map(cell => parseInline(cell, ctx));
      const rows: Inline[][][] = [];
      i += 2;
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
        const cells = splitRow(lines[i]).map(cell => parseInline(cell, ctx));
        while (cells.length < header.length) cells.push([]);
        rows.push(cells.slice(0, header.length));
        i++;
      }
      blocks.push({ type: 'table', align, header, rows });
      continue;
    }

    // --- lists (recursive, indentation-aware) ------------------------------
    if (RE_BULLET.test(line) || RE_ORDERED.test(line)) {
      const consumed = parseList(lines, i, ctx);
      blocks.push(consumed.block);
      i = consumed.next;
      continue;
    }

    // --- paragraph, possibly closed by a setext underline ------------------
    const paragraph: string[] = [];
    while (i < lines.length && lines[i].trim() !== '') {
      const next = lines[i];
      if (
        paragraph.length > 0 &&
        (RE_FENCE.test(next) || RE_ATX.test(next) || RE_QUOTE.test(next) || RE_HR.test(next) ||
          RE_BULLET.test(next) || RE_ORDERED.test(next))
      ) {
        break;
      }
      if (paragraph.length > 0 && RE_SETEXT.test(next) && !RE_HR.test(next)) {
        const text = paragraph.join('\n').trim();
        blocks.push({
          type: 'heading',
          depth: next.trim().startsWith('=') ? 1 : 2,
          slug: uniqueSlug(text, ctx),
          children: parseInline(text, ctx),
        });
        paragraph.length = 0;
        i++;
        break;
      }
      paragraph.push(next);
      i++;
    }
    if (paragraph.length > 0) {
      blocks.push({ type: 'paragraph', children: parseInline(paragraph.join('\n').trim(), ctx) });
    }
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Lists
// ---------------------------------------------------------------------------

interface ListMarker {
  indent: number;
  ordered: boolean;
  start: number;
  content: string;
  contentColumn: number;
}

function readMarker(line: string): ListMarker | null {
  const bullet = RE_BULLET.exec(line);
  if (bullet) {
    return {
      indent: bullet[1].length,
      ordered: false,
      start: 1,
      content: bullet[4],
      contentColumn: bullet[1].length + 1 + bullet[3].length,
    };
  }
  const ordered = RE_ORDERED.exec(line);
  if (ordered) {
    return {
      indent: ordered[1].length,
      ordered: true,
      start: parseInt(ordered[2], 10),
      content: ordered[5],
      contentColumn: ordered[1].length + ordered[2].length + 1 + ordered[4].length,
    };
  }
  return null;
}

function parseList(lines: string[], from: number, ctx: Context): { block: Block; next: number } {
  const first = readMarker(lines[from]) as ListMarker;
  const items: ListItem[] = [];
  let tight = true;
  let i = from;

  while (i < lines.length) {
    const marker = readMarker(lines[i]);
    // A sibling item, or the end of this list: anything less indented, or a
    // different kind of marker, belongs to whoever called us.
    if (!marker || marker.indent < first.indent || marker.ordered !== first.ordered) break;
    if (marker.indent > first.indent + 1) break;

    // Everything indented past the marker is this item's body, including
    // nested lists, paragraphs and code — hence the recursive parseBlocks.
    const body: string[] = [marker.content];
    i++;
    while (i < lines.length) {
      const next = lines[i];
      if (next.trim() === '') {
        // A blank line ends the item unless the list continues underneath it.
        const following = lines[i + 1];
        if (following === undefined) break;
        const followingMarker = readMarker(following);
        const continues =
          /^\s{2,}\S/.test(following) || (followingMarker && followingMarker.indent >= first.indent);
        if (!continues) break;
        tight = false;
        body.push('');
        i++;
        continue;
      }
      const nextMarker = readMarker(next);
      if (nextMarker && nextMarker.indent <= first.indent) break;
      if (!nextMarker && next.search(/\S/) <= first.indent) break;
      body.push(next.slice(Math.min(marker.contentColumn, next.search(/\S/))));
      i++;
    }

    // `- [x] done` — the checkbox is part of the item, not of its text.
    let checked: boolean | null = null;
    const task = RE_TASK.exec(body[0] || '');
    if (task) {
      checked = task[1].toLowerCase() === 'x';
      body[0] = task[2];
    }

    items.push({ checked, children: parseBlocks(body, ctx) });
  }

  return {
    block: { type: 'list', ordered: first.ordered, start: first.start, tight, items },
    next: i,
  };
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

function splitRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  const cells: string[] = [];
  let current = '';
  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];
    if (char === '\\' && trimmed[i + 1] === '|') {
      current += '|';
      i++;
      continue;
    }
    if (char === '|') {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

function isTableSeparator(line: string): boolean {
  if (!line.includes('-')) return false;
  const cells = splitRow(line);
  return cells.length > 0 && cells.every(cell => /^:?-{1,}:?$/.test(cell));
}

function parseAlignments(line: string): Align[] {
  return splitRow(line).map(cell => {
    const left = cell.startsWith(':');
    const right = cell.endsWith(':');
    if (left && right) return 'center';
    if (right) return 'right';
    return 'left';
  });
}

// ---------------------------------------------------------------------------
// Inline level
// ---------------------------------------------------------------------------

const PUNCTUATION = /[!-\/:-@[-`{-~\u00a1-\u00bf\u2010-\u2027]/;

/**
 * Walks the characters once. Delimiters only open or close when their
 * *flanking* allows it, which is what stops `snake_case_name` from turning into
 * `snake<em>case</em>name` — the old parser's most visible inline bug.
 */
export function parseInline(source: string, ctx: Context): Inline[] {
  const out: Inline[] = [];
  let buffer = '';
  let i = 0;

  const flush = () => {
    if (buffer) {
      out.push({ type: 'text', value: buffer });
      buffer = '';
    }
  };

  while (i < source.length) {
    const char = source[i];

    // --- backslash escape --------------------------------------------------
    if (char === '\\' && i + 1 < source.length && PUNCTUATION.test(source[i + 1])) {
      buffer += source[i + 1];
      i += 2;
      continue;
    }

    // --- hard break --------------------------------------------------------
    if (char === '\n') {
      const twoSpaces = source.endsWith('  ', i) && buffer.endsWith('  ');
      const backslash = buffer.endsWith('\\');
      if (twoSpaces || backslash) {
        buffer = buffer.replace(/(\s\s|\\)$/, '');
        flush();
        out.push({ type: 'break' });
      } else {
        buffer += '\n';
      }
      i++;
      continue;
    }

    // --- code span (matching backtick run) ---------------------------------
    if (char === '`') {
      let run = 0;
      while (source[i + run] === '`') run++;
      const closer = source.indexOf('`'.repeat(run), i + run);
      const valid = closer !== -1 && source[closer + run] !== '`';
      if (valid) {
        flush();
        let value = source.slice(i + run, closer);
        // One space of padding on both sides is a delimiter, not content.
        if (value.startsWith(' ') && value.endsWith(' ') && value.trim() !== '') value = value.slice(1, -1);
        out.push({ type: 'code', value });
        i = closer + run;
        continue;
      }
      buffer += '`'.repeat(run);
      i += run;
      continue;
    }

    // --- autolink <https://…> / <mail@host> --------------------------------
    if (char === '<') {
      const close = source.indexOf('>', i);
      const inner = close === -1 ? '' : source.slice(i + 1, close);
      if (inner && /^(https?:\/\/|mailto:)\S+$/i.test(inner)) {
        flush();
        out.push({ type: 'link', href: inner, title: '', children: [{ type: 'text', value: inner }] });
        i = close + 1;
        continue;
      }
      if (inner && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inner)) {
        flush();
        out.push({ type: 'link', href: `mailto:${inner}`, title: '', children: [{ type: 'text', value: inner }] });
        i = close + 1;
        continue;
      }
      buffer += '<';
      i++;
      continue;
    }

    // --- image -------------------------------------------------------------
    if (char === '!' && source[i + 1] === '[') {
      const link = readLink(source, i + 1);
      if (link) {
        flush();
        out.push({ type: 'image', src: link.href, alt: link.label, title: link.title });
        i = link.end;
        continue;
      }
    }

    // --- footnote reference -------------------------------------------------
    if (char === '[' && source[i + 1] === '^') {
      const close = source.indexOf(']', i);
      const id = close === -1 ? '' : source.slice(i + 2, close);
      if (id && ctx.footnoteBodies.has(id)) {
        flush();
        out.push({ type: 'footnoteRef', id, index: ctx.footnoteOrder.indexOf(id) + 1 });
        i = close + 1;
        continue;
      }
    }

    // --- link ---------------------------------------------------------------
    if (char === '[') {
      const link = readLink(source, i);
      if (link) {
        flush();
        out.push({
          type: 'link',
          href: link.href,
          title: link.title,
          children: parseInline(link.label, ctx),
        });
        i = link.end;
        continue;
      }
    }

    // --- emphasis, strikethrough, highlight ---------------------------------
    if (char === '*' || char === '_' || char === '~' || char === '=') {
      let run = 0;
      while (source[i + run] === char) run++;

      const before = i > 0 ? source[i - 1] : '';
      const after = source[i + run] || '';
      const canOpen = after !== '' && !/\s/.test(after) &&
        // `_` inside a word never opens: snake_case, __init__, a_b_c.
        (char !== '_' || before === '' || /\s/.test(before) || PUNCTUATION.test(before));

      if (canOpen) {
        const found = findCloser(source, i + run, char, run);
        if (found !== -1) {
          const inner = source.slice(i + run, found);
          flush();
          const children = parseInline(inner, ctx);
          if (char === '~' && run >= 2) out.push({ type: 'del', children });
          else if (char === '=' && run >= 2) out.push({ type: 'mark', children });
          else if (char === '~' || char === '=') {
            // A single `~` or `=` is literal text, not a delimiter.
            buffer += char;
            i++;
            continue;
          } else if (run >= 3) {
            out.push({ type: 'strong', children: [{ type: 'em', children }] });
          } else if (run === 2) {
            out.push({ type: 'strong', children });
          } else {
            out.push({ type: 'em', children });
          }
          i = found + run;
          continue;
        }
      }

      buffer += char.repeat(run);
      i += run;
      continue;
    }

    // --- bare URL -----------------------------------------------------------
    if ((char === 'h' || char === 'w') && /^(https?:\/\/|www\.)/i.test(source.slice(i))) {
      const match = /^(https?:\/\/|www\.)[^\s<]+/i.exec(source.slice(i)) as RegExpExecArray;
      // Trailing punctuation belongs to the sentence, not to the URL.
      const url = match[0].replace(/[.,;:!?)\]]+$/, '');
      flush();
      out.push({
        type: 'link',
        href: url.toLowerCase().startsWith('www.') ? `https://${url}` : url,
        title: '',
        children: [{ type: 'text', value: url }],
      });
      i += url.length;
      continue;
    }

    buffer += char;
    i++;
  }

  flush();
  return out;
}

/** Finds the matching closing run, skipping code spans and escapes. */
function findCloser(source: string, from: number, char: string, run: number): number {
  let i = from;
  while (i < source.length) {
    if (source[i] === '\\') {
      i += 2;
      continue;
    }
    if (source[i] === '`') {
      let ticks = 0;
      while (source[i + ticks] === '`') ticks++;
      const end = source.indexOf('`'.repeat(ticks), i + ticks);
      i = end === -1 ? i + ticks : end + ticks;
      continue;
    }
    if (source[i] === char) {
      let length = 0;
      while (source[i + length] === char) length++;
      const before = source[i - 1];
      const canClose = before !== undefined && !/\s/.test(before) &&
        (char !== '_' || !source[i + length] || /\s/.test(source[i + length]) || PUNCTUATION.test(source[i + length]));
      if (length >= run && canClose && i > from) return i;
      i += length;
      continue;
    }
    i++;
  }
  return -1;
}

/**
 * Reads `[label](href "title")` from `start`, with balanced brackets and
 * parentheses so that `[a [b] c](x(y).png)` survives.
 */
function readLink(source: string, start: number): { label: string; href: string; title: string; end: number } | null {
  if (source[start] !== '[') return null;

  let depth = 0;
  let i = start;
  let labelEnd = -1;
  for (; i < source.length; i++) {
    if (source[i] === '\\') {
      i++;
      continue;
    }
    if (source[i] === '[') depth++;
    else if (source[i] === ']') {
      depth--;
      if (depth === 0) {
        labelEnd = i;
        break;
      }
    }
  }
  if (labelEnd === -1 || source[labelEnd + 1] !== '(') return null;

  let parens = 0;
  let targetEnd = -1;
  for (i = labelEnd + 1; i < source.length; i++) {
    if (source[i] === '\\') {
      i++;
      continue;
    }
    if (source[i] === '(') parens++;
    else if (source[i] === ')') {
      parens--;
      if (parens === 0) {
        targetEnd = i;
        break;
      }
    }
  }
  if (targetEnd === -1) return null;

  const target = source.slice(labelEnd + 2, targetEnd).trim();
  const titled = /^(\S*)\s+["'(](.*)["')]$/.exec(target);

  return {
    label: source.slice(start + 1, labelEnd),
    href: titled ? titled[1] : target,
    title: titled ? titled[2] : '',
    end: targetEnd + 1,
  };
}

// ---------------------------------------------------------------------------
// Derived data
// ---------------------------------------------------------------------------

function uniqueSlug(text: string, ctx: Context): string {
  const base =
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60) || 'section';
  const seen = ctx.slugs.get(base) || 0;
  ctx.slugs.set(base, seen + 1);
  return seen === 0 ? base : `${base}-${seen}`;
}

export function inlineText(nodes: Inline[]): string {
  return nodes
    .map(node => {
      switch (node.type) {
        case 'text':
        case 'code':
          return node.value;
        case 'image':
          return node.alt;
        case 'break':
          return ' ';
        case 'footnoteRef':
          return '';
        default:
          return inlineText(node.children);
      }
    })
    .join('');
}

function collectToc(blocks: Block[]): TocEntry[] {
  const entries: TocEntry[] = [];
  const walk = (list: Block[]) => {
    for (const block of list) {
      if (block.type === 'heading') {
        entries.push({ depth: block.depth, text: inlineText(block.children), slug: block.slug });
      } else if (block.type === 'blockquote') {
        walk(block.children);
      } else if (block.type === 'list') {
        block.items.forEach(item => walk(item.children));
      }
    }
  };
  walk(blocks);
  return entries;
}

/** Words the way a reader counts them, via ICU segmentation when available. */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const Segmenter = (Intl as any).Segmenter;
  if (typeof Segmenter === 'function') {
    try {
      const segmenter = new Segmenter(undefined, { granularity: 'word' });
      let count = 0;
      for (const segment of segmenter.segment(trimmed)) {
        if (segment.isWordLike) count++;
      }
      return count;
    } catch {
      // Fall through to the split below.
    }
  }
  return trimmed.split(/\s+/).length;
}

function measure(source: string, blocks: Block[]): DocStats {
  const words = countWords(source);
  let headings = 0;
  let links = 0;
  let images = 0;
  let codeBlocks = 0;
  let tables = 0;
  let done = 0;
  let total = 0;

  const walkInline = (nodes: Inline[]) => {
    for (const node of nodes) {
      if (node.type === 'link') {
        links++;
        walkInline(node.children);
      } else if (node.type === 'image') images++;
      else if (node.type === 'strong' || node.type === 'em' || node.type === 'del' || node.type === 'mark') {
        walkInline(node.children);
      }
    }
  };

  const walk = (list: Block[]) => {
    for (const block of list) {
      switch (block.type) {
        case 'heading':
          headings++;
          walkInline(block.children);
          break;
        case 'paragraph':
          walkInline(block.children);
          break;
        case 'code':
          codeBlocks++;
          break;
        case 'blockquote':
          walk(block.children);
          break;
        case 'list':
          for (const item of block.items) {
            if (item.checked !== null) {
              total++;
              if (item.checked) done++;
            }
            walk(item.children);
          }
          break;
        case 'table':
          tables++;
          block.header.forEach(walkInline);
          block.rows.forEach(row => row.forEach(walkInline));
          break;
        case 'footnotes':
          block.items.forEach(item => walk(item.children));
          break;
        default:
          break;
      }
    }
  };
  walk(blocks);

  return {
    words,
    chars: source.length,
    charsNoSpaces: source.replace(/\s/g, '').length,
    lines: source === '' ? 0 : source.split('\n').length,
    readingMinutes: Math.max(1, Math.ceil(words / 220)),
    headings,
    links,
    images,
    codeBlocks,
    tables,
    tasks: { done, total },
  };
}
