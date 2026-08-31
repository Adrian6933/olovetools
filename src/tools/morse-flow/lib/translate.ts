// ============================================================================
// Text ⇄ Morse, with the losses reported.
// ----------------------------------------------------------------------------
// The rule here is that nothing disappears quietly. The old encoder mapped an
// unknown character to '' and then filtered the empties out, so "Hello, world!"
// became "HELLO WORLD" and the tool never mentioned it. Every unsupported
// character now comes back as an issue with its position, and the output keeps
// a visible placeholder so the two panes still line up.
// ============================================================================

import { FROM_CODE, MAX_CODE_LENGTH, PROSIGNS, TO_CODE } from './alphabet';

/** Between symbols of a letter: nothing. Between letters: a space. Words: /. */
export const LETTER_SEPARATOR = ' ';
export const WORD_SEPARATOR = '/';
/** Stands in for a character with no Morse equivalent. */
export const UNKNOWN = '#';

export interface TranslateIssue {
  kind: 'unsupported-char' | 'unknown-code' | 'stray-separator';
  /** The offending character or code. */
  value: string;
  /** Index into the source string. */
  at: number;
}

export interface TranslateResult {
  output: string;
  issues: TranslateIssue[];
  /** Characters (or codes) that made it through. */
  translated: number;
}

const PROSIGN_TOKEN = /^<[A-Z]{2,3}>/;

/**
 * Text → Morse. Prosigns are written `<SK>` and are matched before single
 * characters so the angle brackets do not become punctuation.
 */
export function encode(text: string): TranslateResult {
  const issues: TranslateIssue[] = [];
  const words: string[] = [];
  let current: string[] = [];
  let translated = 0;

  const source = text.trim();
  let i = 0;

  while (i < source.length) {
    const rest = source.slice(i);

    if (/^\s+/.test(rest)) {
      const run = /^\s+/.exec(rest)![0];
      if (current.length > 0) {
        words.push(current.join(LETTER_SEPARATOR));
        current = [];
      }
      i += run.length;
      continue;
    }

    const prosign = PROSIGN_TOKEN.exec(rest.toUpperCase());
    if (prosign && TO_CODE[prosign[0]]) {
      current.push(TO_CODE[prosign[0]]);
      translated += 1;
      i += prosign[0].length;
      continue;
    }

    // By code point, not by code unit: indexing a string splits an emoji into
    // two lone surrogates and reports the same character as two failures.
    const raw = String.fromCodePoint(source.codePointAt(i)!);
    const code = TO_CODE[raw.toUpperCase()];
    if (code) {
      current.push(code);
      translated += 1;
    } else {
      issues.push({ kind: 'unsupported-char', value: raw, at: i });
      current.push(UNKNOWN);
    }
    i += raw.length;
  }

  if (current.length > 0) words.push(current.join(LETTER_SEPARATOR));

  return {
    output: words.join(` ${WORD_SEPARATOR} `),
    issues,
    translated,
  };
}

/**
 * Morse → text. Accepts `_` for a dash and any run of whitespace as a letter
 * gap, because that is how Morse arrives when it is pasted from somewhere else.
 */
export function decode(morse: string): TranslateResult {
  const issues: TranslateIssue[] = [];
  const cleaned = morse.replace(/_/g, '-').replace(/[·•]/g, '.');
  const out: string[] = [];
  let translated = 0;

  // Word boundaries are `/` or two-plus spaces; both appear in the wild.
  const words = cleaned.split(/\s*\/\s*|\s{3,}/);
  let cursor = 0;

  words.forEach((word, index) => {
    if (index > 0) out.push(' ');
    for (const token of word.trim().split(/\s+/)) {
      if (!token) continue;
      const at = cleaned.indexOf(token, cursor);
      cursor = at + token.length;

      if (!/^[.\-#]+$/.test(token)) {
        issues.push({ kind: 'stray-separator', value: token, at });
        continue;
      }
      if (token === UNKNOWN) {
        out.push(UNKNOWN);
        continue;
      }
      if (token.length > MAX_CODE_LENGTH) {
        issues.push({ kind: 'unknown-code', value: token, at });
        out.push(UNKNOWN);
        continue;
      }

      const character = FROM_CODE[token];
      if (character) {
        out.push(character);
        translated += 1;
      } else {
        issues.push({ kind: 'unknown-code', value: token, at });
        out.push(UNKNOWN);
      }
    }
  });

  return { output: out.join('').trim(), issues, translated };
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export type SymbolKind = 'dit' | 'dah' | 'symbol-gap' | 'letter-gap' | 'word-gap';

export interface MorseSymbol {
  kind: SymbolKind;
  /** Units of the standard PARIS timing. */
  units: number;
  /** Index of the character this belongs to, for highlighting. */
  charIndex: number;
}

/**
 * Expands Morse text into the on/off timeline the player and the exporter both
 * work from. Gaps are explicit symbols rather than arithmetic sprinkled through
 * the scheduler, which is what let the old version use 2 and 6 units for the
 * letter and word gaps instead of the 3 and 7 the standard specifies (it was
 * adding them to the 1-unit gap it had already emitted).
 */
export function toTimeline(morse: string): MorseSymbol[] {
  const symbols: MorseSymbol[] = [];
  const words = morse.trim().split(/\s*\/\s*/);
  let charIndex = 0;

  words.forEach((word, wordIndex) => {
    if (wordIndex > 0) {
      symbols.push({ kind: 'word-gap', units: 7, charIndex });
      charIndex += 1;
    }
    const letters = word.trim().split(/\s+/).filter(Boolean);
    letters.forEach((letter, letterIndex) => {
      if (letterIndex > 0) symbols.push({ kind: 'letter-gap', units: 3, charIndex });
      for (let s = 0; s < letter.length; s += 1) {
        if (s > 0) symbols.push({ kind: 'symbol-gap', units: 1, charIndex });
        if (letter[s] === '.') symbols.push({ kind: 'dit', units: 1, charIndex });
        else if (letter[s] === '-') symbols.push({ kind: 'dah', units: 3, charIndex });
      }
      charIndex += 1;
    });
  });

  return symbols;
}

export function prosignFor(code: string): string | null {
  return PROSIGNS.find(p => p.code === code)?.token ?? null;
}
