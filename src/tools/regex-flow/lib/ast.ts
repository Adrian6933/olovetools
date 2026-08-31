// ============================================================================
// A real parser for JavaScript regular expressions.
// ----------------------------------------------------------------------------
// The old implementation walked the pattern one character at a time and emitted
// a flat list with a `depth` counter. That is enough to print a list and
// nothing else, and it got things wrong that matter: `(?<year>\d{4})` came out
// as "capture group" followed by "matches 0 or 1 time (greedy)", because the
// `?` of the group name fell through to the quantifier branch.
//
// This is a recursive-descent parser producing a tree. Every node keeps the
// offsets of the slice it came from, which is what lets the UI light up the
// exact characters of the pattern when you hover an explanation line, colour
// the pattern field, and point a lint finding at a specific quantifier.
//
// It parses, it does not validate: `new RegExp` remains the authority on
// whether a pattern is legal. Anything this parser cannot make sense of is
// recorded as a soft problem and emitted as a literal, so the tree is always
// complete and the UI never has to handle a half-built AST.
// ============================================================================

import type { AstNode, ClassItem, EscapeKind, GroupKind, ParseResult } from '../types';

const SHORTHAND: Record<string, EscapeKind> = {
  d: 'digit',
  D: 'non-digit',
  w: 'word',
  W: 'non-word',
  s: 'space',
  S: 'non-space',
  t: 'tab',
  n: 'newline',
  r: 'return',
  f: 'form-feed',
  v: 'vertical-tab',
  '0': 'null',
};

class Parser {
  private readonly src: string;
  private pos = 0;
  private nextId = 1;
  private captureCount = 0;

  readonly captures: ParseResult['captures'] = [];
  readonly problems: ParseResult['problems'] = [];

  constructor(source: string) {
    this.src = source;
  }

  // -- helpers -------------------------------------------------------------

  private peek(offset = 0): string {
    return this.src[this.pos + offset] ?? '';
  }

  private at(text: string): boolean {
    return this.src.startsWith(text, this.pos);
  }

  private get done(): boolean {
    return this.pos >= this.src.length;
  }

  private slice(start: number): string {
    return this.src.slice(start, this.pos);
  }

  private node<T extends Omit<AstNode, 'id' | 'start' | 'end' | 'raw'>>(start: number, body: T): AstNode {
    return { id: this.nextId++, start, end: this.pos, raw: this.slice(start), ...body } as AstNode;
  }

  private problem(start: number, code: string): void {
    this.problems.push({ start, end: Math.max(this.pos, start + 1), code });
  }

  // -- grammar -------------------------------------------------------------

  /** alternation := sequence ('|' sequence)* */
  parseAlternation(stopAtParen: boolean): AstNode {
    const start = this.pos;
    const alternatives: AstNode[] = [this.parseSequence(stopAtParen)];

    while (this.peek() === '|') {
      this.pos++; // consume '|'
      alternatives.push(this.parseSequence(stopAtParen));
    }

    if (alternatives.length === 1) return alternatives[0];
    return this.node(start, { kind: 'alternation', alternatives });
  }

  /** sequence := quantified* */
  private parseSequence(stopAtParen: boolean): AstNode {
    const start = this.pos;
    const items: AstNode[] = [];

    while (!this.done) {
      const char = this.peek();
      if (char === '|') break;
      if (char === ')' && stopAtParen) break;
      if (char === ')' && !stopAtParen) {
        // A stray `)` at top level. RegExp will reject it; keep it visible.
        this.problem(this.pos, 'unmatched-close');
        this.pos++;
        items.push(this.node(this.pos - 1, { kind: 'literal', value: ')' }));
        continue;
      }
      items.push(this.parseQuantified());
    }

    if (items.length === 1) return items[0];
    return this.node(start, { kind: 'sequence', items });
  }

  /** quantified := atom quantifier? */
  private parseQuantified(): AstNode {
    const start = this.pos;
    const atom = this.parseAtom();
    const quantifier = this.tryParseQuantifier();
    if (!quantifier) return atom;

    // A quantifier can only apply to something quantifiable. `^*` is a syntax
    // error in unicode mode and a literal `*` in sloppy mode; either way the
    // explanation should not claim the anchor repeats.
    if (atom.kind === 'anchor') {
      this.problem(atom.start, 'quantified-anchor');
    }

    return this.node(start, {
      kind: 'quantifier',
      min: quantifier.min,
      max: quantifier.max,
      lazy: quantifier.lazy,
      body: atom,
    });
  }

  private tryParseQuantifier(): { min: number; max: number | null; lazy: boolean } | null {
    const char = this.peek();

    if (char === '*' || char === '+' || char === '?') {
      this.pos++;
      const lazy = this.peek() === '?';
      if (lazy) this.pos++;
      if (char === '*') return { min: 0, max: null, lazy };
      if (char === '+') return { min: 1, max: null, lazy };
      return { min: 0, max: 1, lazy };
    }

    if (char === '{') {
      // Only a well-formed `{n}` / `{n,}` / `{n,m}` is a quantifier. Anything
      // else — `{`, `{foo}`, `{,3}` — is a literal brace in JS, and saying
      // otherwise would be one of the "textos que mienten".
      const match = /^\{(\d+)(,(\d*))?\}/.exec(this.src.slice(this.pos));
      if (!match) return null;
      this.pos += match[0].length;
      const lazy = this.peek() === '?';
      if (lazy) this.pos++;
      const min = Number(match[1]);
      const max = match[2] === undefined ? min : match[3] === '' ? null : Number(match[3]);
      if (max !== null && max < min) this.problem(this.pos - match[0].length, 'range-inverted');
      return { min, max, lazy };
    }

    return null;
  }

  private parseAtom(): AstNode {
    const start = this.pos;
    const char = this.peek();

    if (char === '(') return this.parseGroup();
    if (char === '[') return this.parseClass();
    if (char === '\\') return this.parseEscape();

    if (char === '.') {
      this.pos++;
      return this.node(start, { kind: 'dot' });
    }
    if (char === '^') {
      this.pos++;
      return this.node(start, { kind: 'anchor', anchorKind: 'start' });
    }
    if (char === '$') {
      this.pos++;
      return this.node(start, { kind: 'anchor', anchorKind: 'end' });
    }

    // A bare quantifier with nothing to repeat.
    if (char === '*' || char === '+' || char === '?') {
      this.problem(this.pos, 'nothing-to-repeat');
      this.pos++;
      return this.node(start, { kind: 'literal', value: char });
    }

    this.pos++;
    return this.node(start, { kind: 'literal', value: char });
  }

  private parseGroup(): AstNode {
    const start = this.pos;
    this.pos++; // consume '('

    let groupKind: GroupKind = 'capture';
    let name: string | undefined;
    let number: number | undefined;

    if (this.peek() === '?') {
      if (this.at('?:')) {
        groupKind = 'noncapture';
        this.pos += 2;
      } else if (this.at('?=')) {
        groupKind = 'lookahead';
        this.pos += 2;
      } else if (this.at('?!')) {
        groupKind = 'neg-lookahead';
        this.pos += 2;
      } else if (this.at('?<=')) {
        groupKind = 'lookbehind';
        this.pos += 3;
      } else if (this.at('?<!')) {
        groupKind = 'neg-lookbehind';
        this.pos += 3;
      } else if (this.at('?<')) {
        // `(?<name>` — the case the old tokenizer turned into a phantom quantifier.
        const match = /^\?<([^>]*)>/.exec(this.src.slice(this.pos));
        if (match) {
          groupKind = 'named';
          name = match[1];
          this.pos += match[0].length;
        } else {
          this.problem(this.pos, 'bad-group-name');
          this.pos++;
        }
      } else {
        this.problem(this.pos, 'unknown-group');
        this.pos++;
      }
    }

    if (groupKind === 'capture' || groupKind === 'named') {
      number = ++this.captureCount;
      this.captures.push({ number, name, start, end: start });
    }

    const body = this.parseAlternation(true);

    if (this.peek() === ')') {
      this.pos++;
    } else {
      this.problem(start, 'unclosed-group');
    }

    if (number !== undefined) {
      const entry = this.captures.find(capture => capture.number === number);
      if (entry) entry.end = this.pos;
    }

    return this.node(start, { kind: 'group', groupKind, name, number, body });
  }

  private parseClass(): AstNode {
    const start = this.pos;
    this.pos++; // consume '['

    const negated = this.peek() === '^';
    if (negated) this.pos++;

    const items: ClassItem[] = [];
    let closed = false;

    // A `]` in first position is a literal `]` in JS (non-unicode mode).
    let first = true;

    while (!this.done) {
      if (this.peek() === ']' && !first) {
        this.pos++;
        closed = true;
        break;
      }
      first = false;

      const itemStart = this.pos;
      const atom = this.readClassAtom();

      // A range needs a `-` that is neither last nor followed by `]`, and both
      // sides must be single characters: `[\d-z]` is not a range.
      if (this.peek() === '-' && this.peek(1) !== ']' && this.peek(1) !== '' && atom.kind === 'char') {
        this.pos++; // consume '-'
        const upper = this.readClassAtom();
        if (upper.kind === 'char') {
          if ((upper.from ?? '').codePointAt(0)! < (atom.from ?? '').codePointAt(0)!) {
            this.problem(itemStart, 'class-range-inverted');
          }
          items.push({ kind: 'range', raw: this.slice(itemStart), from: atom.from, to: upper.from });
          continue;
        }
        // Not a range after all — `-` was a literal.
        items.push(atom);
        items.push({ kind: 'char', raw: '-', from: '-' });
        items.push(upper);
        continue;
      }

      items.push(atom);
    }

    if (!closed) this.problem(start, 'unclosed-class');

    return this.node(start, { kind: 'class', negated, items });
  }

  private readClassAtom(): ClassItem {
    const start = this.pos;

    if (this.peek() === '\\') {
      this.pos++;
      const next = this.peek();

      if (next === 'p' || next === 'P') {
        const match = /^[pP]\{([^}]*)\}/.exec(this.src.slice(this.pos));
        if (match) {
          this.pos += match[0].length;
          return {
            kind: 'prop',
            raw: this.slice(start),
            propName: match[1],
            negatedProp: next === 'P',
          };
        }
      }

      if (next === 'b') {
        // Inside a class `\b` is a backspace, not a word boundary.
        this.pos++;
        return { kind: 'escape', raw: this.slice(start), escKind: 'control', from: '\b' };
      }

      const shorthand = SHORTHAND[next];
      if (shorthand) {
        this.pos++;
        return { kind: 'escape', raw: this.slice(start), escKind: shorthand };
      }

      const literal = this.readNumericEscape();
      if (literal) return { kind: 'char', raw: this.slice(start), from: literal };

      this.pos++;
      return { kind: 'char', raw: this.slice(start), from: next };
    }

    const char = this.peek();
    this.pos++;
    return { kind: 'char', raw: char, from: char };
  }

  /** `\xNN`, `\uNNNN`, `\u{...}`, `\cX` — returns the character they stand for. */
  private readNumericEscape(): string | null {
    const rest = this.src.slice(this.pos);

    const hex = /^x([0-9a-fA-F]{2})/.exec(rest);
    if (hex) {
      this.pos += hex[0].length;
      return String.fromCharCode(parseInt(hex[1], 16));
    }

    const uni = /^u\{([0-9a-fA-F]+)\}/.exec(rest);
    if (uni) {
      this.pos += uni[0].length;
      return String.fromCodePoint(parseInt(uni[1], 16));
    }

    const bmp = /^u([0-9a-fA-F]{4})/.exec(rest);
    if (bmp) {
      this.pos += bmp[0].length;
      return String.fromCharCode(parseInt(bmp[1], 16));
    }

    const control = /^c([a-zA-Z])/.exec(rest);
    if (control) {
      this.pos += control[0].length;
      return String.fromCharCode(control[1].toUpperCase().charCodeAt(0) - 64);
    }

    return null;
  }

  private parseEscape(): AstNode {
    const start = this.pos;
    this.pos++; // consume '\'

    if (this.done) {
      this.problem(start, 'trailing-backslash');
      return this.node(start, { kind: 'literal', value: '\\' });
    }

    const next = this.peek();

    if (next === 'b' || next === 'B') {
      this.pos++;
      return this.node(start, {
        kind: 'anchor',
        anchorKind: next === 'b' ? 'word-boundary' : 'non-word-boundary',
      });
    }

    if (next === 'p' || next === 'P') {
      const match = /^[pP]\{([^}]*)\}/.exec(this.src.slice(this.pos));
      if (match) {
        this.pos += match[0].length;
        return this.node(start, { kind: 'prop', negated: next === 'P', propName: match[1] });
      }
    }

    if (next === 'k') {
      const match = /^k<([^>]*)>/.exec(this.src.slice(this.pos));
      if (match) {
        this.pos += match[0].length;
        return this.node(start, { kind: 'backref', ref: match[1] });
      }
    }

    // `\1`..`\99` is a backreference; `\0` is NUL and is handled as shorthand.
    const numbered = /^([1-9]\d?)/.exec(this.src.slice(this.pos));
    if (numbered) {
      this.pos += numbered[0].length;
      return this.node(start, { kind: 'backref', ref: Number(numbered[1]) });
    }

    const shorthand = SHORTHAND[next];
    if (shorthand) {
      this.pos++;
      return this.node(start, { kind: 'escape', escKind: shorthand, value: next });
    }

    const numeric = this.readNumericEscape();
    if (numeric !== null) {
      const raw = this.slice(start);
      const escKind: EscapeKind = raw[1] === 'c' ? 'control' : raw[1] === 'x' ? 'hex' : 'unicode';
      return this.node(start, { kind: 'escape', escKind, value: numeric });
    }

    this.pos++;
    return this.node(start, { kind: 'escape', escKind: 'literal', value: next });
  }
}

/** Parses a pattern into a tree. Never throws: bad input becomes soft problems. */
export function parsePattern(pattern: string): ParseResult {
  const parser = new Parser(pattern);
  const root = parser.parseAlternation(false);
  return { root, captures: parser.captures, problems: parser.problems };
}

/** Depth-first walk, parents before children. */
export function walk(node: AstNode, visit: (node: AstNode, depth: number) => void, depth = 0): void {
  visit(node, depth);
  for (const child of childrenOf(node)) walk(child, visit, depth + 1);
}

export function childrenOf(node: AstNode): AstNode[] {
  switch (node.kind) {
    case 'alternation':
      return node.alternatives;
    case 'sequence':
      return node.items;
    case 'group':
      return [node.body];
    case 'quantifier':
      return [node.body];
    default:
      return [];
  }
}
