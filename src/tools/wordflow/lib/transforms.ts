// ============================================================================
// The text tools.
// ----------------------------------------------------------------------------
// Three things they all do that the old eight buttons did not:
//
//  * They respect a selection. Uppercasing one paragraph of a draft used to
//    mean uppercasing the whole draft.
//  * Every one of them is undoable, because they go through the patch history
//    rather than calling setText with a brand new string.
//  * Each carries a second reading, reached by holding Alt (or right-clicking
//    for "apply to the whole document anyway"). Sort ascending and descending
//    are the same button; so are smart quotes and straight quotes.
// ============================================================================

export interface Range {
  start: number;
  end: number;
}

export interface TransformResult {
  text: string;
  selection: Range;
}

export type TransformGroup = 'case' | 'clean' | 'lines';

export interface TransformVariant {
  key: string;
  fallback: string;
  run: (chunk: string) => string;
}

export interface Transform extends TransformVariant {
  id: string;
  group: TransformGroup;
  /** Expands a partial selection out to whole lines before running. */
  lineBased?: boolean;
  alt?: TransformVariant;
}

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------
const WORD = /\p{L}[\p{L}\p{M}\p{Nd}'’]*/gu;
const COMBINING = new RegExp(`[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`, 'g');

const titleCase = (chunk: string) =>
  chunk.replace(WORD, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

const sentenceCase = (chunk: string) =>
  chunk
    .toLocaleLowerCase()
    .replace(/(^|[.!?。！？]\s*|\n\s*)(\p{L})/gu, (_, lead: string, letter: string) => lead + letter.toLocaleUpperCase());

const toggleCase = (chunk: string) =>
  [...chunk]
    .map(ch => (ch === ch.toLowerCase() ? ch.toUpperCase() : ch.toLowerCase()))
    .join('');

const deaccent = (chunk: string) => chunk.normalize('NFD').replace(COMBINING, '').normalize('NFC');

const words = (chunk: string): string[] => (deaccent(chunk).toLowerCase().match(/[\p{L}\p{Nd}]+/gu) || []);

const slugify = (chunk: string) => words(chunk).join('-');

const camelCase = (chunk: string) =>
  words(chunk)
    .map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join('');

const collapseSpaces = (chunk: string) =>
  chunk
    .replace(/[^\S\n]+/gu, ' ')
    .replace(/ +\n/g, '\n')
    .replace(/\n +/g, '\n')
    .trim();

const stripWhitespace = (chunk: string) => chunk.replace(/\s+/gu, '');

const tidyLines = (chunk: string) =>
  chunk
    .split('\n')
    .map(line => line.replace(/[^\S\n]+$/u, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const dropBlankLines = (chunk: string) =>
  chunk
    .split('\n')
    .filter(line => line.trim().length > 0)
    .join('\n');

const unwrap = (chunk: string) =>
  chunk
    .split(/\n\s*\n/u)
    .map(block => block.replace(/\s*\n\s*/gu, ' ').trim())
    .join('\n\n');

const WRAP_AT = 80;
const wrapLines = (chunk: string) =>
  chunk
    .split('\n')
    .map(line => {
      if (line.length <= WRAP_AT) return line;
      const out: string[] = [];
      let current = '';
      for (const word of line.split(/ +/)) {
        if (current === '') current = word;
        else if (current.length + 1 + word.length <= WRAP_AT) current += ` ${word}`;
        else {
          out.push(current);
          current = word;
        }
      }
      if (current) out.push(current);
      return out.join('\n');
    })
    .join('\n');

const stripHtml = (chunk: string) => {
  const withoutBlocks = chunk
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  // Entities are decoded through the DOM so &nbsp; and &#8217; both land.
  const holder = document.createElement('textarea');
  holder.innerHTML = withoutBlocks;
  return (holder.value || withoutBlocks).replace(/\n{3,}/g, '\n\n').trim();
};

const escapeHtml = (chunk: string) =>
  chunk.replace(/[&<>"']/g, ch =>
    ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch === '"' ? '&quot;' : '&#39;'
  );

const stripMarkdown = (chunk: string) =>
  chunk
    .replace(/^```[\s\S]*?^```$/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s{0,3}[-*+]\s+/gm, '')
    .replace(/^\s{0,3}\d+[.)]\s+/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/^\s*[-*_]{3,}\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const stripPunctuation = (chunk: string) => chunk.replace(/[\p{P}\p{S}]/gu, '');

const stripDigits = (chunk: string) => chunk.replace(/\p{Nd}/gu, '');

const EMOJI = /[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{FE0F}\u{200D}\u{20E3}]/gu;
const stripEmoji = (chunk: string) => chunk.replace(EMOJI, '').replace(/ {2,}/g, ' ');

const straightQuotes = (chunk: string) =>
  chunk
    .replace(/[‘’‚‛′]/g, "'")
    .replace(/[“”„‟″«»]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...');

const smartQuotes = (chunk: string) =>
  chunk
    .replace(/(^|[\s([{])"/g, '$1“')
    .replace(/"/g, '”')
    .replace(/(^|[\s([{])'/g, '$1‘')
    .replace(/'/g, '’')
    .replace(/\.\.\./g, '…')
    .replace(/(\w)\s?--\s?(\w)/g, '$1—$2');

const lineList = (chunk: string) => chunk.split('\n');

const dedupeLines = (chunk: string) => {
  const seen = new Set<string>();
  return lineList(chunk)
    .filter(line => {
      const key = line.trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join('\n');
};

const onlyDuplicates = (chunk: string) => {
  const counts = new Map<string, number>();
  const lines = lineList(chunk);
  for (const line of lines) counts.set(line.trim(), (counts.get(line.trim()) || 0) + 1);
  const seen = new Set<string>();
  return lines
    .filter(line => {
      const key = line.trim();
      if ((counts.get(key) || 0) < 2 || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join('\n');
};

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
const sortAsc = (chunk: string) => lineList(chunk).sort((a, b) => collator.compare(a, b)).join('\n');
const sortDesc = (chunk: string) => lineList(chunk).sort((a, b) => collator.compare(b, a)).join('\n');
const reverseLines = (chunk: string) => lineList(chunk).reverse().join('\n');

/** getRandomValues refuses more than 65 536 bytes in one call. */
const RANDOM_CHUNK = 16384;

const shuffleLines = (chunk: string) => {
  const lines = lineList(chunk);
  // Fisher–Yates over crypto values, filled in 16k blocks: asking for one
  // Uint32Array per line throws QuotaExceededError on any list longer than
  // 16 384 entries, which a pasted export hits immediately.
  const random = new Uint32Array(lines.length);
  for (let offset = 0; offset < random.length; offset += RANDOM_CHUNK) {
    crypto.getRandomValues(random.subarray(offset, Math.min(offset + RANDOM_CHUNK, random.length)));
  }
  for (let i = lines.length - 1; i > 0; i--) {
    const j = random[i] % (i + 1);
    [lines[i], lines[j]] = [lines[j], lines[i]];
  }
  return lines.join('\n');
};

const numberLines = (chunk: string) => {
  const lines = lineList(chunk);
  const width = String(lines.length).length;
  return lines.map((line, index) => `${String(index + 1).padStart(width, ' ')}. ${line}`).join('\n');
};

const unnumberLines = (chunk: string) =>
  lineList(chunk)
    .map(line => line.replace(/^\s*\d+\s*[.)\]:-]\s*/u, ''))
    .join('\n');

// ---------------------------------------------------------------------------
// The catalogue
// ---------------------------------------------------------------------------
export const TRANSFORMS: Transform[] = [
  {
    id: 'upper', group: 'case', key: 'trUpper', fallback: 'UPPERCASE', run: chunk => chunk.toLocaleUpperCase(),
    alt: { key: 'trLower', fallback: 'lowercase', run: chunk => chunk.toLocaleLowerCase() },
  },
  {
    id: 'title', group: 'case', key: 'trTitle', fallback: 'Title Case', run: titleCase,
    alt: { key: 'trSentence', fallback: 'Sentence case', run: sentenceCase },
  },
  {
    id: 'toggle', group: 'case', key: 'trToggle', fallback: 'tOGGLE cASE', run: toggleCase,
    alt: { key: 'trDeaccent', fallback: 'Remove accents', run: deaccent },
  },
  {
    id: 'slug', group: 'case', key: 'trSlug', fallback: 'slug-case', run: slugify,
    alt: { key: 'trCamel', fallback: 'camelCase', run: camelCase },
  },
  {
    id: 'spaces', group: 'clean', key: 'trSpaces', fallback: 'Collapse spaces', run: collapseSpaces,
    alt: { key: 'trNoSpaces', fallback: 'Remove all spaces', run: stripWhitespace },
  },
  {
    id: 'tidy', group: 'clean', key: 'trTidy', fallback: 'Tidy line breaks', run: tidyLines,
    alt: { key: 'trNoBlank', fallback: 'Drop blank lines', run: dropBlankLines },
  },
  {
    id: 'unwrap', group: 'clean', key: 'trUnwrap', fallback: 'Join into paragraphs', run: unwrap,
    alt: { key: 'trWrap', fallback: 'Wrap at 80 columns', run: wrapLines },
  },
  {
    id: 'html', group: 'clean', key: 'trStripHtml', fallback: 'Strip HTML', run: stripHtml,
    alt: { key: 'trEscapeHtml', fallback: 'Escape HTML', run: escapeHtml },
  },
  {
    id: 'markdown', group: 'clean', key: 'trStripMd', fallback: 'Strip Markdown', run: stripMarkdown,
    alt: { key: 'trStripPunct', fallback: 'Remove punctuation', run: stripPunctuation },
  },
  {
    id: 'quotes', group: 'clean', key: 'trStraight', fallback: 'Straight quotes', run: straightQuotes,
    alt: { key: 'trSmart', fallback: 'Smart quotes', run: smartQuotes },
  },
  {
    id: 'emoji', group: 'clean', key: 'trStripEmoji', fallback: 'Remove emoji', run: stripEmoji,
    alt: { key: 'trStripDigits', fallback: 'Remove numbers', run: stripDigits },
  },
  {
    id: 'dedupe', group: 'lines', key: 'trDedupe', fallback: 'Remove duplicate lines', lineBased: true, run: dedupeLines,
    alt: { key: 'trOnlyDupes', fallback: 'Keep only duplicates', run: onlyDuplicates },
  },
  {
    id: 'sort', group: 'lines', key: 'trSortAsc', fallback: 'Sort A → Z', lineBased: true, run: sortAsc,
    alt: { key: 'trSortDesc', fallback: 'Sort Z → A', run: sortDesc },
  },
  {
    id: 'reverse', group: 'lines', key: 'trReverse', fallback: 'Reverse lines', lineBased: true, run: reverseLines,
    alt: { key: 'trShuffle', fallback: 'Shuffle lines', run: shuffleLines },
  },
  {
    id: 'number', group: 'lines', key: 'trNumber', fallback: 'Number lines', lineBased: true, run: numberLines,
    alt: { key: 'trUnnumber', fallback: 'Remove numbering', run: unnumberLines },
  },
];

export function applyTransform(
  text: string,
  selection: Range,
  transform: Transform,
  useAlt: boolean,
  ignoreSelection = false
): TransformResult {
  const variant = useAlt && transform.alt ? transform.alt : transform;
  const hasSelection = !ignoreSelection && selection.end > selection.start;

  let start = hasSelection ? selection.start : 0;
  let end = hasSelection ? selection.end : text.length;

  if (transform.lineBased && hasSelection) {
    start = text.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
    const nextBreak = text.indexOf('\n', end);
    end = nextBreak === -1 ? text.length : nextBreak;
  }

  const replaced = variant.run(text.slice(start, end));
  return {
    text: text.slice(0, start) + replaced + text.slice(end),
    selection: { start, end: start + replaced.length },
  };
}

// ---------------------------------------------------------------------------
// Find and replace
// ---------------------------------------------------------------------------
export interface FindOptions {
  regex: boolean;
  caseSensitive: boolean;
  wholeWord: boolean;
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function buildFinder(query: string, options: FindOptions): RegExp | null {
  if (!query) return null;
  let source = options.regex ? query : escapeRegExp(query);
  if (options.wholeWord) source = `(?<![\\p{L}\\p{N}])(?:${source})(?![\\p{L}\\p{N}])`;
  try {
    return new RegExp(source, options.caseSensitive ? 'gu' : 'giu');
  } catch {
    return null;
  }
}

/** Match ranges, capped so a `.*` over a novel cannot lock the tab up. */
export function findMatches(text: string, finder: RegExp | null, limit = 2000): Range[] {
  if (!finder || !text) return [];
  const out: Range[] = [];
  finder.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = finder.exec(text))) {
    if (match[0].length === 0) {
      finder.lastIndex++;
      continue;
    }
    out.push({ start: match.index, end: match.index + match[0].length });
    if (out.length >= limit) break;
  }
  return out;
}

export function replaceAll(text: string, finder: RegExp | null, replacement: string, useRegex: boolean): string {
  if (!finder) return text;
  finder.lastIndex = 0;
  // Without regex mode a literal "$1" in the replacement must stay "$1".
  // Split in two calls on purpose: a ternary yields `string | (() => string)`,
  // which matches neither String.replace overload and fails the typecheck.
  return useRegex ? text.replace(finder, replacement) : text.replace(finder, () => replacement);
}
