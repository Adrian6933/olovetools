// ============================================================================
// Tolerant JSON parser producing an AST with source offsets.
// ----------------------------------------------------------------------------
// Why not `JSON.parse`:
//   · it reports "Unexpected token } in JSON at position 431" and nothing the
//     UI can point at — no line, no column, no caret;
//   · it silently rounds integers past 2^53, so Discord/Twitter/Stripe ids come
//     back corrupted the moment you press Beautify;
//   · it cannot tell you a key was declared twice (the last one just wins);
//   · and it hands back a plain value, so there is no way to render a large
//     document without materialising every object in memory first.
//
// The parser runs twice in the app: strict, and — only if strict failed —
// tolerant, so a broken paste can be offered a one-click repair instead of an
// error message.
// ============================================================================

import type { IssueCode, JsonKind, JsonNode, ParseIssue, ParseOptions, ParseResult } from '../types';

const DEFAULT_MAX_DEPTH = 400;

/** Line/column lookup over a source string, built once per parse. */
export class LineIndex {
  private starts: number[] = [0];

  constructor(text: string) {
    for (let i = 0; i < text.length; i++) {
      if (text.charCodeAt(i) === 10) this.starts.push(i + 1);
    }
  }

  get lineCount(): number {
    return this.starts.length;
  }

  /** 1-based line and column for a character offset. */
  locate(offset: number): { line: number; column: number } {
    let lo = 0;
    let hi = this.starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (this.starts[mid] <= offset) lo = mid;
      else hi = mid - 1;
    }
    return { line: lo + 1, column: offset - this.starts[lo] + 1 };
  }

  /** Offset where a 1-based line starts. */
  lineStart(line: number): number {
    return this.starts[Math.min(Math.max(line, 1), this.starts.length) - 1];
  }
}

class Bail extends Error {
  code: IssueCode;
  offset: number;

  constructor(code: IssueCode, message: string, offset: number) {
    super(message);
    this.code = code;
    this.offset = offset;
  }
}

const isDigit = (c: number) => c >= 48 && c <= 57;
const isIdentStart = (c: number) =>
  (c >= 97 && c <= 122) || (c >= 65 && c <= 90) || c === 95 || c === 36;
const isIdentPart = (c: number) => isIdentStart(c) || isDigit(c);

class Parser {
  private i = 0;
  private depth = 0;
  readonly issues: ParseIssue[] = [];
  readonly repairs = new Set<IssueCode>();
  private src: string;
  private tolerant: boolean;
  private maxDepth: number;
  private index: LineIndex;

  constructor(src: string, tolerant: boolean, maxDepth: number, index: LineIndex) {
    this.src = src;
    this.tolerant = tolerant;
    this.maxDepth = maxDepth;
    this.index = index;
  }

  private warn(code: IssueCode, message: string, offset: number) {
    // One warning per kind per document: a file with 4 000 trailing commas
    // should not produce 4 000 rows in the issue list.
    if (this.issues.some(issue => issue.code === code && issue.severity === 'warning')) {
      this.repairs.add(code);
      return;
    }
    const { line, column } = this.index.locate(offset);
    this.issues.push({ severity: 'warning', code, message, offset, line, column });
    this.repairs.add(code);
  }

  private fail(code: IssueCode, message: string, offset = this.i): never {
    throw new Bail(code, message, offset);
  }

  private skipTrivia() {
    while (this.i < this.src.length) {
      const c = this.src.charCodeAt(this.i);
      if (c === 32 || c === 9 || c === 10 || c === 13) {
        this.i++;
        continue;
      }
      // A BOM anywhere is whitespace as far as we are concerned; JSON.parse
      // throws on it, which is the single most common "but it's valid!" report.
      if (c === 0xfeff) {
        this.warn('bom', 'Byte order mark removed.', this.i);
        this.i++;
        continue;
      }
      if (c === 47 && this.tolerant) {
        const next = this.src.charCodeAt(this.i + 1);
        if (next === 47) {
          const end = this.src.indexOf('\n', this.i);
          this.warn('comment', 'Line comment (// …) — not valid JSON.', this.i);
          this.i = end === -1 ? this.src.length : end;
          continue;
        }
        if (next === 42) {
          const end = this.src.indexOf('*/', this.i + 2);
          this.warn('comment', 'Block comment (/* … */) — not valid JSON.', this.i);
          this.i = end === -1 ? this.src.length : end + 2;
          continue;
        }
      }
      return;
    }
  }

  private expect(ch: string) {
    if (this.src[this.i] !== ch) {
      this.fail('syntax', `Expected "${ch}" but found ${this.describeHere()}.`);
    }
    this.i++;
  }

  private describeHere(): string {
    if (this.i >= this.src.length) return 'the end of the document';
    const ch = this.src[this.i];
    return ch === '\n' ? 'a line break' : `"${ch}"`;
  }

  parseDocument(): JsonNode {
    this.skipTrivia();
    if (this.i >= this.src.length) this.fail('empty', 'The document is empty.', 0);
    const node = this.parseValue(null);
    this.skipTrivia();
    if (this.i < this.src.length) {
      this.fail(
        'syntax',
        `Unexpected ${this.describeHere()} after the end of the value. A JSON document holds exactly one value — for line-delimited JSON use the JSONL mode.`
      );
    }
    return node;
  }

  private parseValue(key: string | null, keyStart?: number): JsonNode {
    if (this.depth > this.maxDepth) {
      this.fail('depth', `Nesting deeper than ${this.maxDepth} levels.`);
    }
    this.skipTrivia();
    const start = this.i;
    const ch = this.src[this.i];

    switch (ch) {
      case '{':
        return this.parseObject(key, start, keyStart);
      case '[':
        return this.parseArray(key, start, keyStart);
      case '"':
        return this.finish({ kind: 'string', key, value: this.parseString(), start, keyStart });
      case "'": {
        if (!this.tolerant) this.fail('single-quote', 'JSON strings use double quotes.');
        this.warn('single-quote', "Single-quoted string — JSON requires double quotes.", start);
        return this.finish({ kind: 'string', key, value: this.parseString("'"), start, keyStart });
      }
      default:
        break;
    }

    if (ch === '-' || ch === '+' || ch === '.' || isDigit(this.src.charCodeAt(this.i))) {
      return this.parseNumber(key, start, keyStart);
    }
    return this.parseWord(key, start, keyStart);
  }

  private finish(partial: Omit<JsonNode, 'end'>): JsonNode {
    return { ...partial, end: this.i } as JsonNode;
  }

  private parseObject(key: string | null, start: number, keyStart?: number): JsonNode {
    this.i++; // {
    this.depth++;
    const children: JsonNode[] = [];
    const seen = new Set<string>();
    this.skipTrivia();

    if (this.src[this.i] === '}') {
      this.i++;
      this.depth--;
      return this.finish({ kind: 'object', key, children, start, keyStart });
    }

    for (;;) {
      this.skipTrivia();
      if (this.src[this.i] === '}') {
        if (!this.tolerant) this.fail('trailing-comma', 'Trailing comma before "}".');
        this.warn('trailing-comma', 'Trailing comma before "}".', this.i);
        this.i++;
        break;
      }

      const propStart = this.i;
      let name: string;
      if (this.src[this.i] === '"') {
        name = this.parseString();
      } else if (this.src[this.i] === "'" && this.tolerant) {
        this.warn('single-quote', 'Single-quoted key — JSON requires double quotes.', this.i);
        name = this.parseString("'");
      } else if (this.tolerant && isIdentStart(this.src.charCodeAt(this.i))) {
        const from = this.i;
        while (this.i < this.src.length && isIdentPart(this.src.charCodeAt(this.i))) this.i++;
        name = this.src.slice(from, this.i);
        this.warn('unquoted-key', `Unquoted key "${name}" — JSON keys must be quoted.`, from);
      } else {
        this.fail('syntax', `Expected a quoted key but found ${this.describeHere()}.`);
      }

      if (seen.has(name)) {
        const { line, column } = this.index.locate(propStart);
        this.issues.push({
          severity: 'warning',
          code: 'duplicate-key',
          message: `Duplicate key "${name}" — the later value wins and the earlier one is lost.`,
          offset: propStart,
          line,
          column,
        });
      }
      seen.add(name);

      this.skipTrivia();
      this.expect(':');
      children.push(this.parseValue(name, propStart));
      this.skipTrivia();

      const next = this.src[this.i];
      if (next === ',') {
        this.i++;
        continue;
      }
      if (next === '}') {
        this.i++;
        break;
      }
      this.fail('syntax', `Expected "," or "}" but found ${this.describeHere()}.`);
    }

    this.depth--;
    return this.finish({ kind: 'object', key, children, start, keyStart });
  }

  private parseArray(key: string | null, start: number, keyStart?: number): JsonNode {
    this.i++; // [
    this.depth++;
    const children: JsonNode[] = [];
    this.skipTrivia();

    if (this.src[this.i] === ']') {
      this.i++;
      this.depth--;
      return this.finish({ kind: 'array', key, children, start, keyStart });
    }

    for (;;) {
      this.skipTrivia();
      if (this.src[this.i] === ']') {
        if (!this.tolerant) this.fail('trailing-comma', 'Trailing comma before "]".');
        this.warn('trailing-comma', 'Trailing comma before "]".', this.i);
        this.i++;
        break;
      }

      children.push(this.parseValue(String(children.length)));
      this.skipTrivia();

      const next = this.src[this.i];
      if (next === ',') {
        this.i++;
        continue;
      }
      if (next === ']') {
        this.i++;
        break;
      }
      this.fail('syntax', `Expected "," or "]" but found ${this.describeHere()}.`);
    }

    this.depth--;
    return this.finish({ kind: 'array', key, children, start, keyStart });
  }

  private parseString(quote = '"'): string {
    this.i++; // opening quote
    let out = '';
    let chunk = this.i;

    for (;;) {
      if (this.i >= this.src.length) this.fail('syntax', 'Unterminated string.');
      const c = this.src[this.i];

      if (c === quote) {
        out += this.src.slice(chunk, this.i);
        this.i++;
        return out;
      }

      if (c === '\\') {
        out += this.src.slice(chunk, this.i);
        this.i++;
        const esc = this.src[this.i];
        switch (esc) {
          case '"':
          case "'":
          case '\\':
          case '/':
            out += esc;
            this.i++;
            break;
          case 'b':
            out += '\b';
            this.i++;
            break;
          case 'f':
            out += '\f';
            this.i++;
            break;
          case 'n':
            out += '\n';
            this.i++;
            break;
          case 'r':
            out += '\r';
            this.i++;
            break;
          case 't':
            out += '\t';
            this.i++;
            break;
          case 'u': {
            const hex = this.src.slice(this.i + 1, this.i + 5);
            if (!/^[0-9a-fA-F]{4}$/.test(hex)) this.fail('syntax', `Bad \\u escape "\\u${hex}".`);
            out += String.fromCharCode(parseInt(hex, 16));
            this.i += 5;
            break;
          }
          case '\n':
            // JSON5 line continuation. Harmless to accept, impossible to keep.
            if (!this.tolerant) this.fail('syntax', 'Line break inside a string.');
            this.i++;
            break;
          default:
            if (!this.tolerant) this.fail('syntax', `Unknown escape "\\${esc}".`);
            out += esc;
            this.i++;
        }
        chunk = this.i;
        continue;
      }

      if (c === '\n' && !this.tolerant) {
        this.fail('syntax', 'Line break inside a string — escape it as \\n.');
      }
      this.i++;
    }
  }

  private parseNumber(key: string | null, start: number, keyStart?: number): JsonNode {
    const from = this.i;
    if (this.src[this.i] === '+' || this.src[this.i] === '-') this.i++;

    if (this.tolerant && this.src.startsWith('Infinity', this.i)) {
      this.i += 8;
      this.warn('non-finite', 'Infinity is not valid JSON.', from);
      return this.finish({
        kind: 'number',
        key,
        value: this.src[from] === '-' ? -Infinity : Infinity,
        raw: this.src.slice(from, this.i),
        start,
        keyStart,
      });
    }

    if (this.tolerant && (this.src.startsWith('0x', this.i) || this.src.startsWith('0X', this.i))) {
      this.i += 2;
      while (this.i < this.src.length && /[0-9a-fA-F]/.test(this.src[this.i])) this.i++;
      const raw = this.src.slice(from, this.i);
      this.warn('non-finite', 'Hexadecimal literal — JSON numbers are decimal.', from);
      return this.finish({ kind: 'number', key, value: Number(raw), raw, start, keyStart });
    }

    let sawDigit = false;
    while (isDigit(this.src.charCodeAt(this.i))) {
      this.i++;
      sawDigit = true;
    }
    if (this.src[this.i] === '.') {
      this.i++;
      while (isDigit(this.src.charCodeAt(this.i))) {
        this.i++;
        sawDigit = true;
      }
    }
    if (!sawDigit) this.fail('syntax', `"${this.src.slice(from, this.i + 1)}" is not a number.`, from);

    const e = this.src[this.i];
    if (e === 'e' || e === 'E') {
      this.i++;
      if (this.src[this.i] === '+' || this.src[this.i] === '-') this.i++;
      if (!isDigit(this.src.charCodeAt(this.i))) this.fail('syntax', 'Exponent has no digits.', from);
      while (isDigit(this.src.charCodeAt(this.i))) this.i++;
    }

    const raw = this.src.slice(from, this.i);
    if (!this.tolerant) {
      if (raw[0] === '+') this.fail('syntax', 'JSON numbers cannot start with "+".', from);
      if (raw[0] === '.' || raw.endsWith('.')) {
        this.fail('syntax', 'JSON numbers need a digit on both sides of the point.', from);
      }
      if (/^-?0\d/.test(raw)) this.fail('syntax', 'JSON numbers cannot have a leading zero.', from);
    } else if (raw[0] === '+' || raw[0] === '.' || raw.endsWith('.') || /^-?0\d/.test(raw)) {
      this.warn('non-finite', `"${raw}" is not a valid JSON number literal.`, from);
    }

    const value = Number(raw);
    // Precision check: only meaningful for integers, and only when the source
    // literal and the round-tripped double actually differ.
    if (!raw.includes('.') && !/[eE]/.test(raw) && String(value) !== raw.replace(/^\+/, '')) {
      const { line, column } = this.index.locate(from);
      if (!this.issues.some(issue => issue.code === 'precision')) {
        this.issues.push({
          severity: 'warning',
          code: 'precision',
          message: `${raw} is larger than JavaScript can represent exactly (it becomes ${value}). JSONFlow keeps the original digits when it re-prints the document.`,
          offset: from,
          line,
          column,
        });
      }
    }

    return this.finish({ kind: 'number', key, value, raw, start, keyStart });
  }

  private parseWord(key: string | null, start: number, keyStart?: number): JsonNode {
    const from = this.i;
    while (this.i < this.src.length && isIdentPart(this.src.charCodeAt(this.i))) this.i++;
    const word = this.src.slice(from, this.i);

    const literal = (kind: JsonKind, value: string | number | boolean | null): JsonNode =>
      this.finish({ kind, key, value, start, keyStart });

    switch (word) {
      case 'true':
        return literal('boolean', true);
      case 'false':
        return literal('boolean', false);
      case 'null':
        return literal('null', null);
      case 'NaN':
        if (!this.tolerant) this.fail('non-finite', 'NaN is not valid JSON.', from);
        this.warn('non-finite', 'NaN is not valid JSON.', from);
        return this.finish({ kind: 'number', key, value: NaN, raw: 'NaN', start, keyStart });
      case 'True':
      case 'False':
      case 'None':
        if (!this.tolerant) {
          this.fail('python-literal', `"${word}" is Python, not JSON. Use ${word === 'None' ? 'null' : word.toLowerCase()}.`, from);
        }
        this.warn('python-literal', `Python literal "${word}" — JSON uses ${word === 'None' ? 'null' : word.toLowerCase()}.`, from);
        return word === 'None' ? literal('null', null) : literal('boolean', word === 'True');
      case 'undefined':
        if (!this.tolerant) this.fail('syntax', 'undefined is not valid JSON.', from);
        this.warn('python-literal', 'undefined is not valid JSON; treated as null.', from);
        return literal('null', null);
      default:
        this.fail(
          'syntax',
          word
            ? `"${word}" is not a valid JSON value. Strings must be wrapped in double quotes.`
            : `Unexpected ${this.describeHere()}.`,
          from
        );
    }
  }
}

/**
 * Parses `text`. Never throws: failures come back as `ok: false` with a located
 * error, so the caller can render it instead of guarding every call.
 */
export function parseJson(text: string, options: ParseOptions = {}): ParseResult {
  const started = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const index = new LineIndex(text);
  const parser = new Parser(text, options.tolerant ?? false, options.maxDepth ?? DEFAULT_MAX_DEPTH, index);

  try {
    const root = parser.parseDocument();
    return {
      ok: true,
      root,
      issues: parser.issues,
      repairs: [...parser.repairs],
      ms: (typeof performance !== 'undefined' ? performance.now() : Date.now()) - started,
    };
  } catch (error) {
    const bail = error instanceof Bail ? error : new Bail('syntax', (error as Error).message, 0);
    const { line, column } = index.locate(bail.offset);
    return {
      ok: false,
      root: null,
      issues: [
        ...parser.issues,
        { severity: 'error', code: bail.code, message: bail.message, offset: bail.offset, line, column },
      ],
      repairs: [...parser.repairs],
      ms: (typeof performance !== 'undefined' ? performance.now() : Date.now()) - started,
    };
  }
}

/** Materialises a plain JavaScript value from an AST node. */
export function toValue(node: JsonNode): unknown {
  switch (node.kind) {
    case 'object': {
      const out: Record<string, unknown> = {};
      for (const child of node.children!) out[child.key as string] = toValue(child);
      return out;
    }
    case 'array':
      return node.children!.map(toValue);
    default:
      return node.value as unknown;
  }
}

/** Dotted path of a node, e.g. `users[2].address.city`. */
export function nodePath(trail: JsonNode[]): string {
  let path = '';
  for (let i = 1; i < trail.length; i++) {
    const node = trail[i];
    const parent = trail[i - 1];
    if (parent.kind === 'array') path += `[${node.key}]`;
    else if (/^[A-Za-z_$][\w$]*$/.test(node.key || '')) path += path ? `.${node.key}` : String(node.key);
    else path += `[${JSON.stringify(node.key)}]`;
  }
  return path || '$';
}

/**
 * A string that itself contains JSON ("{\"a\":1}") is the single most common
 * shape in log exports. Detecting it lets the UI offer one-click unwrapping.
 */
export function looksLikeEscapedJson(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 4) return false;
  if (trimmed[0] !== '"' || trimmed[trimmed.length - 1] !== '"') return false;
  return trimmed.includes('\\"') && /\\"\s*[:{[]|[{[]\\"/.test(trimmed);
}
