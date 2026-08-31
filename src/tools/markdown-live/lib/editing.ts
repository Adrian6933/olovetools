// ============================================================================
// Text edits, as pure functions
// ----------------------------------------------------------------------------
// Every toolbar button and every keyboard shortcut is a `(text, selection) =>
// (text, selection)` transform. Keeping them out of the component is what makes
// them toggles rather than one-way inserts: pressing Bold twice takes the
// asterisks back off, and pressing "quote" over five selected lines quotes the
// five, not just the first.
// ============================================================================

export interface Selection {
  start: number;
  end: number;
}

export interface EditResult extends Selection {
  text: string;
}

const lineStart = (text: string, index: number) => text.lastIndexOf('\n', index - 1) + 1;
const lineEnd = (text: string, index: number) => {
  const next = text.indexOf('\n', index);
  return next === -1 ? text.length : next;
};

// ---------------------------------------------------------------------------
// Inline wrapping (bold, italic, code, strikethrough, highlight)
// ---------------------------------------------------------------------------

export function wrap(
  text: string,
  sel: Selection,
  marker: string,
  placeholder: string,
  closing = marker
): EditResult {
  const selected = text.slice(sel.start, sel.end);

  // Already wrapped, either inside the selection or just outside it: unwrap.
  if (selected.startsWith(marker) && selected.endsWith(closing) && selected.length > marker.length + closing.length) {
    const inner = selected.slice(marker.length, selected.length - closing.length);
    return {
      text: text.slice(0, sel.start) + inner + text.slice(sel.end),
      start: sel.start,
      end: sel.start + inner.length,
    };
  }
  const before = text.slice(Math.max(0, sel.start - marker.length), sel.start);
  const after = text.slice(sel.end, sel.end + closing.length);
  if (before === marker && after === closing) {
    return {
      text: text.slice(0, sel.start - marker.length) + selected + text.slice(sel.end + closing.length),
      start: sel.start - marker.length,
      end: sel.end - marker.length,
    };
  }

  const body = selected || placeholder;
  return {
    text: text.slice(0, sel.start) + marker + body + closing + text.slice(sel.end),
    start: sel.start + marker.length,
    end: sel.start + marker.length + body.length,
  };
}

// ---------------------------------------------------------------------------
// Line prefixes (headings, quotes, lists, tasks)
// ---------------------------------------------------------------------------

/** Matches an existing marker of the same family so the button can toggle it. */
const FAMILY: Record<string, RegExp> = {
  heading: /^#{1,6}\s+/,
  quote: /^>\s?/,
  ul: /^[*\-+]\s+(\[[ xX]\]\s+)?/,
  ol: /^\d+[.)]\s+/,
  task: /^[*\-+]\s+\[[ xX]\]\s+/,
};

export function linePrefix(
  text: string,
  sel: Selection,
  family: keyof typeof FAMILY,
  build: (index: number) => string
): EditResult {
  const from = lineStart(text, sel.start);
  const to = lineEnd(text, sel.end);
  const lines = text.slice(from, to).split('\n');
  const pattern = FAMILY[family];

  // If every non-empty line already carries the marker, the button removes it.
  const meaningful = lines.filter(line => line.trim() !== '');
  const allMarked = meaningful.length > 0 && meaningful.every(line => pattern.test(line));

  const next = lines.map((line, index) => {
    if (line.trim() === '' && lines.length > 1) return line;
    // Any marker of a competing family goes first, so the line never ends up
    // with `> - ## text` after three clicks.
    const bare = line
      .replace(FAMILY.heading, '')
      .replace(FAMILY.task, '')
      .replace(FAMILY.ul, '')
      .replace(FAMILY.ol, '')
      .replace(FAMILY.quote, '');
    return allMarked ? bare : build(index) + bare;
  });

  const replaced = next.join('\n');
  return {
    text: text.slice(0, from) + replaced + text.slice(to),
    start: from,
    end: from + replaced.length,
  };
}

// ---------------------------------------------------------------------------
// Block inserts
// ---------------------------------------------------------------------------

export function insertBlock(text: string, sel: Selection, block: string): EditResult {
  const from = lineStart(text, sel.start);
  const atLineStart = from === sel.start;
  const before = text.slice(0, sel.start);
  const needsLeading = before === '' || before.endsWith('\n\n') ? '' : atLineStart ? '\n' : '\n\n';
  const after = text.slice(sel.end);
  const needsTrailing = after.startsWith('\n') ? '' : '\n';
  const payload = needsLeading + block + needsTrailing;
  return {
    text: before + payload + after,
    start: sel.start + needsLeading.length,
    end: sel.start + needsLeading.length + block.length,
  };
}

/** `[label](url)`, using the selection as label and the clipboard as URL. */
export function insertLink(text: string, sel: Selection, url: string, placeholder: string): EditResult {
  const label = text.slice(sel.start, sel.end) || placeholder;
  const body = `[${label}](${url})`;
  return {
    text: text.slice(0, sel.start) + body + text.slice(sel.end),
    // Land the caret on the URL: it is the part that still needs typing.
    start: sel.start + label.length + 3,
    end: sel.start + label.length + 3 + url.length,
  };
}

// ---------------------------------------------------------------------------
// Indentation
// ---------------------------------------------------------------------------

export function indent(text: string, sel: Selection, outdent: boolean): EditResult {
  const from = lineStart(text, sel.start);
  const to = lineEnd(text, sel.end);
  const lines = text.slice(from, to).split('\n');
  let delta = 0;

  const next = lines.map(line => {
    if (outdent) {
      const removed = /^ {1,2}/.exec(line);
      if (!removed) return line;
      delta -= removed[0].length;
      return line.slice(removed[0].length);
    }
    delta += 2;
    return `  ${line}`;
  });

  const replaced = next.join('\n');
  const firstDelta = outdent ? -Math.min(2, /^ {1,2}/.exec(lines[0])?.[0].length || 0) : 2;
  return {
    text: text.slice(0, from) + replaced + text.slice(to),
    start: Math.max(from, sel.start + firstDelta),
    end: Math.max(from, sel.end + delta),
  };
}

// ---------------------------------------------------------------------------
// Enter inside a list
// ---------------------------------------------------------------------------

const CONTINUABLE = /^(\s*)(?:([*\-+])|(\d+)([.)]))(\s+)(\[[ xX]\]\s+)?(.*)$/;

/**
 * Continues a list on Enter and, on an empty item, ends it instead of laying
 * down another dead bullet — the behaviour every markdown editor has and the
 * one thing that makes writing a nested list bearable.
 */
export function newline(text: string, sel: Selection): EditResult | null {
  if (sel.start !== sel.end) return null;
  const from = lineStart(text, sel.start);
  const current = text.slice(from, sel.start);
  const match = CONTINUABLE.exec(current);

  if (!match) {
    const quote = /^(\s*)>\s?(.*)$/.exec(current);
    if (!quote) return null;
    if (quote[2].trim() === '') {
      return { text: text.slice(0, from) + text.slice(sel.start), start: from, end: from };
    }
    const insert = `\n${quote[1]}> `;
    return {
      text: text.slice(0, sel.start) + insert + text.slice(sel.end),
      start: sel.start + insert.length,
      end: sel.start + insert.length,
    };
  }

  const [, indentation, bullet, number, delimiter, space, task, body] = match;

  // Empty item: clear the marker and stop the list.
  if (body.trim() === '') {
    return { text: text.slice(0, from) + text.slice(sel.start), start: from, end: from };
  }

  const marker = bullet ? bullet : `${parseInt(number, 10) + 1}${delimiter}`;
  const checkbox = task ? '[ ] ' : '';
  const insert = `\n${indentation}${marker}${space}${checkbox}`;
  return {
    text: text.slice(0, sel.start) + insert + text.slice(sel.end),
    start: sel.start + insert.length,
    end: sel.start + insert.length,
  };
}

// ---------------------------------------------------------------------------
// Paste
// ---------------------------------------------------------------------------

/** A URL pasted over a selection becomes a link around it, like every editor. */
export function pasteOverSelection(text: string, sel: Selection, pasted: string): EditResult | null {
  if (sel.start === sel.end) return null;
  if (!/^https?:\/\/\S+$/i.test(pasted.trim())) return null;
  return insertLink(text, sel, pasted.trim(), '');
}

/** Renumbers `1. 1. 1.` runs into `1. 2. 3.`, top-level and nested alike. */
export function renumberLists(text: string): string {
  const lines = text.split('\n');
  const counters = new Map<number, number>();
  let previousIndent = -1;

  return lines
    .map(line => {
      const match = /^(\s*)(\d+)([.)])(\s+)(.*)$/.exec(line);
      if (!match) {
        if (line.trim() !== '') counters.clear();
        previousIndent = -1;
        return line;
      }
      const width = match[1].length;
      if (width < previousIndent) {
        for (const key of [...counters.keys()]) if (key > width) counters.delete(key);
      }
      const next = (counters.get(width) || 0) + 1;
      counters.set(width, next);
      previousIndent = width;
      return `${match[1]}${next}${match[3]}${match[4]}${match[5]}`;
    })
    .join('\n');
}
