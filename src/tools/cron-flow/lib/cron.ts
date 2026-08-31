// ============================================================================
// Cron parser
// ----------------------------------------------------------------------------
// Produces an AST, not a flattened `number[]` per field. That distinction is
// the whole point: the description, the per-token error highlighting, the
// visual builder and the platform compatibility matrix all need to know *how*
// a field was written ("*/15" vs "0,15,30,45" schedule the same minutes but do
// not mean the same thing to a reader, and Vixie cron treats them differently
// when deciding the day-of-month / day-of-week OR rule).
//
// Everything here is pure and timezone-free. Turning the AST into instants
// lives in schedule.ts, which walks civil time and only then converts.
// ============================================================================

export type FieldKind = 'second' | 'minute' | 'hour' | 'day' | 'month' | 'weekday' | 'year';

/** Which dialect the expression was read as, decided by the field count. */
export type Flavor = 'unix' | 'seconds' | 'quartz';

export interface FieldRange {
  min: number;
  max: number;
}

export const FIELD_RANGES: Record<FieldKind, FieldRange> = {
  second: { min: 0, max: 59 },
  minute: { min: 0, max: 59 },
  hour: { min: 0, max: 23 },
  day: { min: 1, max: 31 },
  month: { min: 1, max: 12 },
  // 7 is accepted on input and folded onto 0; both mean Sunday.
  weekday: { min: 0, max: 7 },
  year: { min: 1970, max: 2199 },
};

export const MONTH_ALIASES: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
};

export const WEEKDAY_ALIASES: Record<string, number> = {
  SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6,
};

// ----------------------------------------------------------------------------
// Tokens
// ----------------------------------------------------------------------------

export type TermKind =
  | 'all'        // *
  | 'any'        // ? (Quartz: "no specific value")
  | 'single'     // 7
  | 'range'      // 2-6
  | 'step'       // */5, 2-10/2, 5/15
  | 'lastDay'    // L or L-3 (day field)
  | 'lastWeekday'// LW (day field)
  | 'nearestWd'  // 15W (day field)
  | 'nthDow'     // FRI#3 (weekday field)
  | 'lastDow'    // FRI L or 5L (weekday field)
  | 'hash';      // Jenkins H, H/15, H(0-29)

export interface Term {
  kind: TermKind;
  /** Exactly as the user typed it, before alias folding. */
  raw: string;
  /** Offset of `raw` inside the whole expression string. */
  start: number;
  end: number;
  /** Materialised values, for every term that does not need a calendar month. */
  values: number[];
  from?: number;
  to?: number;
  step?: number;
  /** `L-3` → 3 days before the last day of the month. */
  offset?: number;
  /** `FRI#3` → 3. */
  nth?: number;
  /** The weekday for nthDow / lastDow. */
  dow?: number;
}

export interface Field {
  kind: FieldKind;
  raw: string;
  start: number;
  end: number;
  terms: Term[];
  /** Union of every plain value. Empty when the field is only specials. */
  values: number[];
  /**
   * Vixie's rule, and the reason a star-step and an equivalent explicit range
   * behave differently: a field counts as "unrestricted" when it STARTS with a
   * star (or is Quartz's `?`), not when it happens to cover the full range.
   */
  unrestricted: boolean;
  /** Terms that can only be resolved against a concrete month (L, W, #). */
  specials: Term[];
}

export interface CronError {
  /** Stable id so the UI can pick a translated message. */
  code:
    | 'empty'
    | 'fieldCount'
    | 'unknownMacro'
    | 'badInterval'
    | 'badToken'
    | 'outOfRange'
    | 'badRange'
    | 'badStep'
    | 'specialNotAllowed'
    | 'reboot';
  /** Field the error belongs to, when it belongs to one. */
  field?: FieldKind;
  /** The offending text and its offsets inside the expression. */
  token?: string;
  start?: number;
  end?: number;
  /** Extra data for the message template ({min}, {max}, {n}...). */
  data?: Record<string, string | number>;
}

export interface Cron {
  /** The expression the AST was built from, after macro expansion. */
  expression: string;
  /** What the user actually typed, macro included. */
  source: string;
  flavor: Flavor;
  /** Set when `source` was a macro like `@daily`. */
  macro?: string;
  fields: Record<FieldKind, Field>;
  /** In render order for this flavor. */
  order: FieldKind[];
  /** Non-fatal notes: `7` folded to Sunday, Jenkins `H` used, etc. */
  notes: string[];
  /** Whether the expression uses anything outside plain POSIX cron. */
  usesQuartz: boolean;
  usesJenkins: boolean;
}

export interface ParseResult {
  /** null when `error` is set. */
  cron: Cron;
  error: CronError;
}

// ----------------------------------------------------------------------------
// Macros
// ----------------------------------------------------------------------------

export const MACROS: Record<string, string> = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
};

const DURATION_RE = /^(\d+)(s|m|h|d)$/;

/**
 * go-cron's `@every 90m`. Only intervals that land on a real cron field are
 * convertible; `@every 90m` genuinely cannot be written as a cron expression,
 * so we say so instead of quietly rounding it.
 */
function expandEvery(rest: string): { expr: string; error: CronError } {
  const parts = rest.trim().toLowerCase().match(/\d+[smhd]/g);
  if (!parts || parts.length === 0) {
    return { expr: null, error: { code: 'badInterval', token: rest } };
  }
  let seconds = 0;
  for (const part of parts) {
    const m = DURATION_RE.exec(part);
    if (!m) return { expr: null, error: { code: 'badInterval', token: part } };
    const n = parseInt(m[1], 10);
    seconds += n * (m[2] === 's' ? 1 : m[2] === 'm' ? 60 : m[2] === 'h' ? 3600 : 86400);
  }
  if (seconds <= 0) return { expr: null, error: { code: 'badInterval', token: rest } };

  if (seconds % 86400 === 0) {
    const days = seconds / 86400;
    if (days === 1) return { expr: '0 0 * * *', error: null };
    return { expr: `0 0 */${days} * *`, error: null };
  }
  if (seconds % 3600 === 0) {
    const hours = seconds / 3600;
    if (hours <= 23 && 24 % hours === 0) return { expr: `0 */${hours} * * *`, error: null };
    return { expr: null, error: { code: 'badInterval', token: rest, data: { n: hours } } };
  }
  if (seconds % 60 === 0) {
    const minutes = seconds / 60;
    if (minutes <= 59 && 60 % minutes === 0) return { expr: `*/${minutes} * * * *`, error: null };
    return { expr: null, error: { code: 'badInterval', token: rest, data: { n: minutes } } };
  }
  if (seconds <= 59 && 60 % seconds === 0) return { expr: `*/${seconds} * * * * *`, error: null };
  return { expr: null, error: { code: 'badInterval', token: rest, data: { n: seconds } } };
}

// ----------------------------------------------------------------------------
// Jenkins H
// ----------------------------------------------------------------------------

/** FNV-1a. Stable across reloads so the preview never jumps around. */
function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

// ----------------------------------------------------------------------------
// Field parsing
// ----------------------------------------------------------------------------

function foldAliases(text: string, kind: FieldKind): string {
  const table = kind === 'month' ? MONTH_ALIASES : kind === 'weekday' ? WEEKDAY_ALIASES : null;
  if (!table) return text.toUpperCase();
  // Anchored on word boundaries so `SUNDAY` does not silently become `0DAY`.
  return text.toUpperCase().replace(/[A-Z]+/g, word => {
    const hit = table[word];
    return hit === undefined ? word : String(hit);
  });
}

function readInt(text: string): number {
  if (!/^\d+$/.test(text)) return NaN;
  return parseInt(text, 10);
}

interface TermContext {
  kind: FieldKind;
  range: FieldRange;
  /** Offset of the field inside the full expression. */
  fieldStart: number;
  /** Seed for Jenkins `H`, so two jobs with different expressions differ. */
  seed: string;
}

function parseTerm(raw: string, offset: number, ctx: TermContext): { term: Term; error: CronError } {
  const start = ctx.fieldStart + offset;
  const end = start + raw.length;
  const base: Term = { kind: 'single', raw, start, end, values: [] };
  const { min, max } = ctx.range;
  const fail = (code: CronError['code'], data?: Record<string, string | number>): { term: Term; error: CronError } => ({
    term: null,
    error: { code, field: ctx.kind, token: raw, start, end, data },
  });

  const text = foldAliases(raw, ctx.kind);

  if (text === '*') {
    const values: number[] = [];
    for (let i = min; i <= max; i++) values.push(i);
    return { term: { ...base, kind: 'all', values }, error: null };
  }

  if (text === '?') {
    if (ctx.kind !== 'day' && ctx.kind !== 'weekday') return fail('specialNotAllowed');
    const values: number[] = [];
    for (let i = min; i <= max; i++) values.push(i);
    return { term: { ...base, kind: 'any', values }, error: null };
  }

  // ---- day-of-month specials -------------------------------------------
  if (ctx.kind === 'day') {
    if (text === 'L') return { term: { ...base, kind: 'lastDay', offset: 0 }, error: null };
    if (text === 'LW') return { term: { ...base, kind: 'lastWeekday' }, error: null };
    const lastOffset = /^L-(\d+)$/.exec(text);
    if (lastOffset) {
      const n = parseInt(lastOffset[1], 10);
      if (n > 30) return fail('outOfRange', { min: 0, max: 30 });
      return { term: { ...base, kind: 'lastDay', offset: n }, error: null };
    }
    const nearest = /^(\d+)W$/.exec(text);
    if (nearest) {
      const n = parseInt(nearest[1], 10);
      if (n < 1 || n > 31) return fail('outOfRange', { min: 1, max: 31 });
      return { term: { ...base, kind: 'nearestWd', values: [n] }, error: null };
    }
  }

  // ---- day-of-week specials --------------------------------------------
  if (ctx.kind === 'weekday') {
    const nth = /^(\d+)#(\d+)$/.exec(text);
    if (nth) {
      const dow = parseInt(nth[1], 10);
      const n = parseInt(nth[2], 10);
      if (dow > 7) return fail('outOfRange', { min: 0, max: 7 });
      if (n < 1 || n > 5) return fail('outOfRange', { min: 1, max: 5 });
      return { term: { ...base, kind: 'nthDow', dow: dow === 7 ? 0 : dow, nth: n }, error: null };
    }
    if (text === 'L') return { term: { ...base, kind: 'lastDow', dow: 6 }, error: null };
    const lastDow = /^(\d+)L$/.exec(text);
    if (lastDow) {
      const dow = parseInt(lastDow[1], 10);
      if (dow > 7) return fail('outOfRange', { min: 0, max: 7 });
      return { term: { ...base, kind: 'lastDow', dow: dow === 7 ? 0 : dow }, error: null };
    }
  }

  // ---- Jenkins H --------------------------------------------------------
  if (text.startsWith('H')) {
    const rest = text.slice(1);
    let lo = min;
    let hi = max;
    let step = 0;
    const scoped = /^\((\d+)-(\d+)\)(?:\/(\d+))?$/.exec(rest);
    if (scoped) {
      lo = parseInt(scoped[1], 10);
      hi = parseInt(scoped[2], 10);
      if (scoped[3]) step = parseInt(scoped[3], 10);
    } else if (rest.startsWith('/')) {
      step = readInt(rest.slice(1));
    } else if (rest !== '') {
      return fail('badToken');
    }
    if (lo < min || hi > max || lo > hi) return fail('badRange', { min, max });
    if (rest.startsWith('/') || (scoped && scoped[3])) {
      if (!Number.isFinite(step) || step <= 0) return fail('badStep');
    }
    const span = hi - lo + 1;
    const seedValue = hashString(`${ctx.seed}|${ctx.kind}`) % span;
    const values: number[] = [];
    if (step > 0) {
      for (let v = lo + (seedValue % step); v <= hi; v += step) values.push(v);
    } else {
      values.push(lo + seedValue);
    }
    return { term: { ...base, kind: 'hash', from: lo, to: hi, step: step || undefined, values }, error: null };
  }

  // ---- step -------------------------------------------------------------
  if (text.includes('/')) {
    const bits = text.split('/');
    if (bits.length !== 2) return fail('badStep');
    const [rangePart, stepPart] = bits;
    const step = readInt(stepPart);
    if (!Number.isFinite(step) || step <= 0) return fail('badStep');
    let lo: number;
    let hi: number;
    if (rangePart === '*' || rangePart === '') {
      lo = min;
      hi = max;
    } else if (rangePart.includes('-')) {
      const rb = rangePart.split('-');
      if (rb.length !== 2) return fail('badRange', { min, max });
      lo = readInt(rb[0]);
      hi = readInt(rb[1]);
    } else {
      // Quartz's "start/step": 5/15 means 5, 20, 35, 50 — not "every 15th from 5 to 5".
      lo = readInt(rangePart);
      hi = max;
    }
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) return fail('badToken');
    if (lo < min || hi > max) return fail('outOfRange', { min, max });
    if (lo > hi) return fail('badRange', { min, max });
    if (step > max - min + 1) return fail('badStep', { min: 1, max: max - min + 1 });
    const values: number[] = [];
    for (let v = lo; v <= hi; v += step) values.push(v);
    return { term: { ...base, kind: 'step', from: lo, to: hi, step, values }, error: null };
  }

  // ---- range ------------------------------------------------------------
  if (text.includes('-')) {
    const rb = text.split('-');
    if (rb.length !== 2) return fail('badRange', { min, max });
    const lo = readInt(rb[0]);
    const hi = readInt(rb[1]);
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) return fail('badToken');
    if (lo < min || hi > max) return fail('outOfRange', { min, max });
    const values: number[] = [];
    if (lo > hi) {
      // Wrapping ranges (FRI-MON, 22-2) are what people mean, and Vixie
      // rejects them; we accept and flag rather than silently disagree.
      for (let v = lo; v <= max; v++) values.push(v);
      for (let v = min; v <= hi; v++) values.push(v);
      return { term: { ...base, kind: 'range', from: lo, to: hi, values }, error: null };
    }
    for (let v = lo; v <= hi; v++) values.push(v);
    return { term: { ...base, kind: 'range', from: lo, to: hi, values }, error: null };
  }

  // ---- single -----------------------------------------------------------
  const n = readInt(text);
  if (!Number.isFinite(n)) return fail('badToken');
  if (n < min || n > max) return fail('outOfRange', { min, max });
  return { term: { ...base, kind: 'single', values: [n] }, error: null };
}

const SPECIAL_KINDS: TermKind[] = ['lastDay', 'lastWeekday', 'nearestWd', 'nthDow', 'lastDow'];

function parseFieldText(
  raw: string,
  kind: FieldKind,
  fieldStart: number,
  seed: string
): { field: Field; error: CronError } {
  const range = FIELD_RANGES[kind];
  const field: Field = {
    kind,
    raw,
    start: fieldStart,
    end: fieldStart + raw.length,
    terms: [],
    values: [],
    unrestricted: raw.startsWith('*') || raw === '?',
    specials: [],
  };

  if (raw === '') {
    return { field: null, error: { code: 'badToken', field: kind, token: raw, start: fieldStart, end: fieldStart } };
  }

  const ctx: TermContext = { kind, range, fieldStart, seed };
  const seen = new Set<number>();
  let cursor = 0;
  for (const chunk of raw.split(',')) {
    const offset = cursor;
    cursor += chunk.length + 1;
    if (chunk === '') {
      return { field: null, error: { code: 'badToken', field: kind, token: ',', start: fieldStart + offset, end: fieldStart + offset + 1 } };
    }
    const { term, error } = parseTerm(chunk, offset, ctx);
    if (error) return { field: null, error };
    field.terms.push(term);
    if (SPECIAL_KINDS.indexOf(term.kind) !== -1) {
      // `15W` carries 15 so the description can name the day, but it must not
      // leak into the plain value set: the schedule fires on the *nearest*
      // weekday, and merging it would make the 15th itself match too.
      field.specials.push(term);
      continue;
    }
    for (const v of term.values) seen.add(kind === 'weekday' && v === 7 ? 0 : v);
  }

  field.values = Array.from(seen).sort((a, b) => a - b);
  return { field, error: null };
}

// ----------------------------------------------------------------------------
// Expression parsing
// ----------------------------------------------------------------------------

const ORDER_UNIX: FieldKind[] = ['minute', 'hour', 'day', 'month', 'weekday'];
const ORDER_SECONDS: FieldKind[] = ['second', 'minute', 'hour', 'day', 'month', 'weekday'];
const ORDER_QUARTZ: FieldKind[] = ['second', 'minute', 'hour', 'day', 'month', 'weekday', 'year'];

/** The `*` field every flavor gets for the parts it does not carry. */
function fullField(kind: FieldKind): Field {
  const { min, max } = FIELD_RANGES[kind];
  const values: number[] = [];
  for (let i = min; i <= max; i++) values.push(i);
  return {
    kind,
    raw: '*',
    start: -1,
    end: -1,
    terms: [{ kind: 'all', raw: '*', start: -1, end: -1, values }],
    values: kind === 'weekday' ? values.filter(v => v !== 7) : values,
    unrestricted: true,
    specials: [],
  };
}

/**
 * A single occurrence field: seconds default to 0, not to "every second".
 * `* * * * *` means once a minute, not sixty times.
 */
function zeroField(kind: FieldKind): Field {
  return {
    kind,
    raw: '0',
    start: -1,
    end: -1,
    terms: [{ kind: 'single', raw: '0', start: -1, end: -1, values: [0] }],
    values: [0],
    unrestricted: false,
    specials: [],
  };
}

export function parseCron(input: string): ParseResult {
  const source = (input || '').trim();
  if (source === '') {
    return { cron: null, error: { code: 'empty' } };
  }

  let expression = source;
  let macro: string = null;

  if (source.startsWith('@')) {
    const lower = source.toLowerCase();
    if (lower === '@reboot') {
      return { cron: null, error: { code: 'reboot', token: source, start: 0, end: source.length } };
    }
    const everyMatch = /^@every\s+(.+)$/.exec(lower);
    if (everyMatch) {
      const { expr, error } = expandEvery(everyMatch[1]);
      if (error) return { cron: null, error: { ...error, start: 0, end: source.length } };
      expression = expr;
      macro = lower;
    } else {
      const hit = MACROS[lower];
      if (!hit) {
        return { cron: null, error: { code: 'unknownMacro', token: source, start: 0, end: source.length } };
      }
      expression = hit;
      macro = lower;
    }
  }

  const rawParts = expression.split(/\s+/).filter(p => p !== '');
  let order: FieldKind[];
  let flavor: Flavor;
  if (rawParts.length === 5) {
    order = ORDER_UNIX;
    flavor = 'unix';
  } else if (rawParts.length === 6) {
    order = ORDER_SECONDS;
    flavor = 'seconds';
  } else if (rawParts.length === 7) {
    order = ORDER_QUARTZ;
    flavor = 'quartz';
  } else {
    return {
      cron: null,
      error: { code: 'fieldCount', token: expression, start: 0, end: expression.length, data: { n: rawParts.length } },
    };
  }

  // Offsets are computed against `expression`, which equals `source` unless a
  // macro was expanded; in that case the UI highlights the macro as a whole.
  const offsets: number[] = [];
  let cursor = 0;
  for (const part of rawParts) {
    const at = expression.indexOf(part, cursor);
    offsets.push(at);
    cursor = at + part.length;
  }

  const fields: Record<string, Field> = {};
  const notes: string[] = [];

  for (let i = 0; i < order.length; i++) {
    const kind = order[i];
    const { field, error } = parseFieldText(rawParts[i], kind, offsets[i], expression);
    if (error) return { cron: null, error };
    fields[kind] = field;
  }

  if (!fields.second) fields.second = zeroField('second');
  if (!fields.year) fields.year = fullField('year');

  // Quartz forbids pinning both day-of-month and day-of-week; `?` is how you
  // say "this one does not apply". Worth a note, never an error.
  const day = fields.day as Field;
  const weekday = fields.weekday as Field;
  if (!day.unrestricted && !weekday.unrestricted) notes.push('bothDayFields');
  if (weekday.terms.some(t => t.raw.toUpperCase().indexOf('7') !== -1 && t.kind === 'single')) {
    notes.push('sundayIsSeven');
  }

  const allTerms = order.map(k => fields[k] as Field).reduce<Term[]>((acc, f) => acc.concat(f.terms), []);
  const usesQuartz =
    allTerms.some(t => SPECIAL_KINDS.indexOf(t.kind) !== -1 || t.kind === 'any') || flavor !== 'unix';
  const usesJenkins = allTerms.some(t => t.kind === 'hash');
  if (usesJenkins) notes.push('jenkinsHash');
  if (allTerms.some(t => t.kind === 'range' && t.from > t.to)) notes.push('wrappingRange');

  return {
    cron: {
      expression,
      source,
      flavor,
      macro,
      fields: fields as Record<FieldKind, Field>,
      order,
      notes,
      usesQuartz,
      usesJenkins,
    },
    error: null,
  };
}

// ----------------------------------------------------------------------------
// Serialisation helpers, used by the builder and the exporters
// ----------------------------------------------------------------------------

/** Rebuilds the expression string from its field list, in flavor order. */
export function joinFields(cron: Cron): string {
  return cron.order.map(k => cron.fields[k].raw).join(' ');
}

/** Replaces one field and returns the new expression string. */
export function withField(cron: Cron, kind: FieldKind, raw: string): string {
  return cron.order.map(k => (k === kind ? raw : cron.fields[k].raw)).join(' ');
}

/**
 * Collapses a value set back into the shortest readable field text.
 * `[0,15,30,45]` on minutes comes back as a star-step of 15, not as the four
 * numbers spelled out — this is what
 * the visual builder writes back into the input, so it has to read like
 * something a person would have typed.
 */
export function valuesToField(values: number[], kind: FieldKind): string {
  const { min, max } = FIELD_RANGES[kind];
  const span = kind === 'weekday' ? 6 : max;
  const sorted = Array.from(new Set(values.filter(v => v >= min && v <= span))).sort((a, b) => a - b);
  if (sorted.length === 0) return '*';
  if (sorted.length === span - min + 1) return '*';

  // A uniform gap that starts at the field minimum is a step.
  if (sorted.length > 2) {
    const gap = sorted[1] - sorted[0];
    let uniform = true;
    for (let i = 2; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] !== gap) {
        uniform = false;
        break;
      }
    }
    if (uniform && gap > 1 && sorted[0] === min && sorted[sorted.length - 1] + gap > span) {
      return `*/${gap}`;
    }
  }

  // Otherwise compress consecutive runs into ranges.
  const out: string[] = [];
  let runStart = sorted[0];
  let prev = sorted[0];
  const flush = () => {
    if (runStart === prev) out.push(String(runStart));
    else if (prev - runStart === 1) out.push(`${runStart},${prev}`);
    else out.push(`${runStart}-${prev}`);
  };
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === prev + 1) {
      prev = sorted[i];
      continue;
    }
    flush();
    runStart = sorted[i];
    prev = sorted[i];
  }
  flush();
  return out.join(',');
}
