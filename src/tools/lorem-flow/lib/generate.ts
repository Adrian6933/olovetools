import { CLASSIC_OPENING, metaFor, poolFor } from './corpora';
import { MAX_COUNT, type Options } from '../types';

// ============================================================================
// Generation
// ----------------------------------------------------------------------------
// Every random choice comes from one seeded generator, so the same seed gives
// byte-for-byte the same text. The old version called Math.random() directly,
// which means a screenshot could never be reproduced.
// ============================================================================

/** mulberry32: small, fast, and good enough for placeholder prose. */
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a, so a text seed maps to a stable 32-bit number. */
function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface Rng {
  next: () => number;
  pick: <T>(arr: T[]) => T;
  int: (min: number, max: number) => number;
}

export function makeRng(seed: string): Rng {
  const base = seed.trim() ? hashSeed(seed.trim()) : (Math.random() * 4294967296) >>> 0;
  const next = mulberry32(base);
  return {
    next,
    pick: arr => arr[Math.floor(next() * arr.length)],
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
  };
}

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** One sentence, with commas so it reads like prose rather than a word list. */
function sentence(rng: Rng, script: Options['script'], minWords = 8, maxWords = 18): string {
  const pool = poolFor(script);
  const meta = metaFor(script);
  const length = rng.int(minWords, maxWords);
  const words: string[] = [];
  for (let i = 0; i < length; i++) words.push(rng.pick(pool));

  // A comma or two in the middle, never at either end.
  const commaCount = length > 12 ? rng.int(1, 2) : length > 7 ? rng.int(0, 1) : 0;
  const positions = new Set<number>();
  for (let i = 0; i < commaCount; i++) positions.add(rng.int(2, Math.max(2, length - 3)));

  const joiner = meta.spaced ? ' ' : '';
  let out = '';
  words.forEach((w, i) => {
    out += w;
    if (i === words.length - 1) return;
    if (positions.has(i)) out += meta.comma;
    out += joiner;
  });

  // Capitalisation only means something in cased scripts.
  const cased = meta.spaced && script !== 'japanese' && script !== 'chinese';
  return (cased ? capitalize(out) : out) + meta.sentenceEnd;
}

function paragraph(rng: Rng, script: Options['script']): string {
  const meta = metaFor(script);
  const count = rng.int(3, 6);
  const parts: string[] = [];
  for (let i = 0; i < count; i++) parts.push(sentence(rng, script));
  return parts.join(meta.spaced ? ' ' : '');
}

/** Counts words the way a person would, including scripts without spaces. */
export function countWords(text: string, script: Options['script']): number {
  const stripped = text.replace(/<[^>]+>/g, ' ').replace(/[#*_>-]/g, ' ');
  if (metaFor(script).spaced) {
    return stripped.trim().split(/\s+/).filter(Boolean).length;
  }
  // Japanese and Chinese have no spaces, so the ICU segmenter is the only
  // honest way to count "words" rather than characters.
  const Seg = (Intl as any).Segmenter;
  if (typeof Seg === 'function') {
    try {
      const seg = new Seg(script === 'japanese' ? 'ja' : 'zh', { granularity: 'word' });
      let n = 0;
      for (const s of seg.segment(stripped)) if (s.isWordLike) n++;
      return n;
    } catch {
      // Fall through.
    }
  }
  return stripped.replace(/\s/g, '').length;
}

const HEADING_WORDS = 4;

/** Builds the body as a list of blocks, before any formatting is applied. */
interface Block {
  kind: 'p' | 'h2' | 'h3' | 'ul';
  text?: string;
  items?: string[];
}

function buildBlocks(opts: Options, rng: Rng): Block[] {
  const meta = metaFor(opts.script);
  const cap = MAX_COUNT[opts.unit];
  const count = Math.max(1, Math.min(cap, Math.floor(opts.count) || 1));
  const blocks: Block[] = [];

  const classic = opts.startClassic && opts.script === 'latin';

  if (opts.unit === 'words' || opts.unit === 'characters') {
    // Grow sentences until the target is met, then trim precisely so the number
    // the user asked for is the number they get.
    let text = classic ? CLASSIC_OPENING : '';
    const target = count;
    const measure = (s: string) =>
      opts.unit === 'words' ? countWords(s, opts.script) : [...s].length;
    let guard = 0;
    while (measure(text) < target && guard++ < 5000) {
      text = text ? text + (meta.spaced ? ' ' : '') + sentence(rng, opts.script) : sentence(rng, opts.script);
    }
    if (opts.unit === 'words' && meta.spaced) {
      const words = text.trim().split(/\s+/).slice(0, target);
      text = words.join(' ').replace(/[,،、]$/, '');
      if (!/[.。।]$/.test(text)) text += meta.sentenceEnd;
    } else {
      const chars = [...text].slice(0, target);
      text = chars.join('').replace(/[,،、\s]+$/, '');
    }
    return [{ kind: 'p', text }];
  }

  if (opts.unit === 'sentences') {
    const parts: string[] = [];
    for (let i = 0; i < count; i++) {
      parts.push(i === 0 && classic ? CLASSIC_OPENING : sentence(rng, opts.script));
    }
    return [{ kind: 'p', text: parts.join(meta.spaced ? ' ' : '') }];
  }

  for (let i = 0; i < count; i++) {
    // Headings and lists only when asked for, and never as the very first block
    // so the output still opens with prose.
    if (opts.richStructure && i > 0 && i % 3 === 0) {
      const pool = poolFor(opts.script);
      const words: string[] = [];
      for (let w = 0; w < HEADING_WORDS; w++) words.push(rng.pick(pool));
      const heading = meta.spaced ? capitalize(words.join(' ')) : words.join('');
      blocks.push({ kind: i % 6 === 0 ? 'h3' : 'h2', text: heading });
    }
    if (opts.richStructure && i > 0 && i % 4 === 0) {
      const items: string[] = [];
      for (let k = 0; k < rng.int(3, 5); k++) items.push(sentence(rng, opts.script, 4, 9));
      blocks.push({ kind: 'ul', items });
      continue;
    }
    const body = paragraph(rng, opts.script);
    blocks.push({
      kind: 'p',
      text: i === 0 && classic ? CLASSIC_OPENING + ' ' + body : body,
    });
  }
  return blocks;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function render(blocks: Block[], format: Options['format'], rtl: boolean): string {
  if (format === 'html') {
    const dir = rtl ? ' dir="rtl"' : '';
    return blocks
      .map(b => {
        if (b.kind === 'ul') return `<ul${dir}>\n${(b.items || []).map(i => `  <li>${escapeHtml(i)}</li>`).join('\n')}\n</ul>`;
        if (b.kind === 'h2') return `<h2${dir}>${escapeHtml(b.text || '')}</h2>`;
        if (b.kind === 'h3') return `<h3${dir}>${escapeHtml(b.text || '')}</h3>`;
        return `<p${dir}>${escapeHtml(b.text || '')}</p>`;
      })
      .join('\n');
  }
  if (format === 'markdown') {
    return blocks
      .map(b => {
        if (b.kind === 'ul') return (b.items || []).map(i => `- ${i}`).join('\n');
        if (b.kind === 'h2') return `## ${b.text}`;
        if (b.kind === 'h3') return `### ${b.text}`;
        return b.text || '';
      })
      .join('\n\n');
  }
  return blocks
    .map(b => {
      if (b.kind === 'ul') return (b.items || []).map(i => `• ${i}`).join('\n');
      return b.text || '';
    })
    .join('\n\n');
}

export function generate(opts: Options): string {
  const rng = makeRng(opts.seed);
  const blocks = buildBlocks(opts, rng);
  return render(blocks, opts.format, metaFor(opts.script).rtl);
}

/** A short random seed, so "give me a repeatable one" is one click away. */
export function randomSeed(): string {
  return Math.random().toString(36).slice(2, 8);
}
