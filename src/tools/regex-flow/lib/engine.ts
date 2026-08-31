// ============================================================================
// The run itself. No DOM, no React — so the exact same module powers the
// worker and the inline fallback.
// ----------------------------------------------------------------------------
// Three things the previous implementation got wrong, all fixed here:
//
//  1. It reused one RegExp object for the `exec` loop and for `String.replace`.
//     `lastIndex` survives between them, so a sticky pattern replaced in the
//     wrong place: `/a/y` over "aaa" produced "aXa" instead of "Xaa". Every
//     operation below builds its own RegExp.
//  2. It only looped when `g` was set, so `y` alone reported one match.
//  3. It threw away `match.groups` and every group offset. Adding the `d` flag
//     (hasIndices) turns each group into a real span, which is what lets the
//     UI paint capture groups inside a highlighted match.
// ============================================================================

import type { GroupHit, MatchHit, RunRequest, RunResult } from '../types';

/** Beyond this the count stops being useful and starts being a hazard. */
const MAX_SCAN = 250_000;

let indicesSupported: boolean | null = null;

function canUseIndices(): boolean {
  if (indicesSupported !== null) return indicesSupported;
  try {
    new RegExp('a', 'd');
    indicesSupported = true;
  } catch {
    indicesSupported = false;
  }
  return indicesSupported;
}

/**
 * Builds a fresh regex for one operation. `d` is added silently when the
 * engine has it: it costs nothing and turns groups into spans.
 */
function compile(pattern: string, flags: string, forExec: boolean): RegExp {
  let effective = flags;
  if (forExec && canUseIndices() && !effective.includes('d')) effective += 'd';
  return new RegExp(pattern, effective);
}

/** Advances past a zero-width match without splitting a surrogate pair. */
function advance(text: string, index: number, unicode: boolean): number {
  if (!unicode) return index + 1;
  const code = text.codePointAt(index);
  return index + (code !== undefined && code > 0xffff ? 2 : 1);
}

function collectGroups(match: RegExpExecArray): GroupHit[] {
  const indices = (match as RegExpExecArray & { indices?: (readonly [number, number] | undefined)[] }).indices;
  const namedIndices = indices && (indices as unknown as { groups?: Record<string, readonly [number, number] | undefined> }).groups;
  const names = match.groups ? Object.keys(match.groups) : [];

  const hits: GroupHit[] = [];
  for (let number = 1; number < match.length; number++) {
    const span = indices?.[number];
    // Named and numbered groups share numbering; find the name for this slot
    // by matching its span, which is exactly what `indices.groups` gives us.
    let name: string | undefined;
    if (namedIndices) {
      for (const candidate of names) {
        const candidateSpan = namedIndices[candidate];
        if (candidateSpan && span && candidateSpan[0] === span[0] && candidateSpan[1] === span[1]) {
          name = candidate;
          break;
        }
      }
    }
    hits.push({
      number,
      name,
      value: match[number],
      start: span ? span[0] : -1,
      end: span ? span[1] : -1,
    });
  }
  return hits;
}

export function emptyResult(id = 0): RunResult {
  return { id, ok: true, matches: [], truncated: false, total: 0, replaced: '', parts: [], ms: 0 };
}

export function run(request: RunRequest): RunResult {
  const { id, pattern, flags, text, replacement, mode, limit } = request;
  const started = Date.now();

  if (!pattern) {
    return { ...emptyResult(id), replaced: text, parts: [text] };
  }

  let regex: RegExp;
  try {
    regex = compile(pattern, flags, true);
  } catch (error) {
    return {
      ...emptyResult(id),
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      replaced: text,
      parts: [text],
      ms: Date.now() - started,
    };
  }

  const matches: MatchHit[] = [];
  let total = 0;
  let truncated = false;

  try {
    const repeats = flags.includes('g') || flags.includes('y');
    const unicode = flags.includes('u') || flags.includes('v');

    if (repeats) {
      regex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) !== null) {
        total++;
        if (matches.length < limit) {
          matches.push({
            index: matches.length,
            start: match.index,
            end: match.index + match[0].length,
            value: match[0],
            groups: collectGroups(match),
          });
        } else {
          truncated = true;
        }

        if (match[0].length === 0) {
          // Sticky patterns cannot skip ahead — a zero-width sticky match at a
          // position that no longer matches simply ends the scan.
          const next = advance(text, regex.lastIndex, unicode);
          if (next > text.length) break;
          regex.lastIndex = next;
        }

        if (total >= MAX_SCAN) {
          truncated = true;
          break;
        }
      }
    } else {
      const match = regex.exec(text);
      if (match) {
        total = 1;
        matches.push({
          index: 0,
          start: match.index,
          end: match.index + match[0].length,
          value: match[0],
          groups: collectGroups(match),
        });
      }
    }

    let replaced = text;
    let parts: string[] = [];

    if (mode === 'replace') {
      // A brand-new object: `lastIndex` from the loop above must not leak in.
      replaced = text.replace(compile(pattern, flags, false), replacement);
    } else if (mode === 'split') {
      parts = text.split(compile(pattern, flags, false));
    }

    return {
      id,
      ok: true,
      matches,
      truncated,
      total,
      replaced,
      parts,
      ms: Date.now() - started,
    };
  } catch (error) {
    return {
      ...emptyResult(id),
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      replaced: text,
      parts: [text],
      ms: Date.now() - started,
    };
  }
}

/**
 * Expands `$1`, `$<name>`, `$&`, `` $` ``, `$'` and `$$` in a replacement
 * string for display purposes, so the UI can explain what each token will
 * become before the user commits to it.
 */
export function replacementTokens(replacement: string): { raw: string; kind: string; value: string }[] {
  const tokens: { raw: string; kind: string; value: string }[] = [];
  const pattern = /\$(\$|&|`|'|<([^>]*)>|\d{1,2})/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(replacement)) !== null) {
    const body = match[1];
    if (body === '$') tokens.push({ raw: match[0], kind: 'escaped', value: '$' });
    else if (body === '&') tokens.push({ raw: match[0], kind: 'whole', value: '' });
    else if (body === '`') tokens.push({ raw: match[0], kind: 'before', value: '' });
    else if (body === "'") tokens.push({ raw: match[0], kind: 'after', value: '' });
    else if (match[2] !== undefined) tokens.push({ raw: match[0], kind: 'named', value: match[2] });
    else tokens.push({ raw: match[0], kind: 'numbered', value: body });
  }
  return tokens;
}
