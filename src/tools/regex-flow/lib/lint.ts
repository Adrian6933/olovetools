// ============================================================================
// Static analysis of the pattern, before it is ever run.
// ----------------------------------------------------------------------------
// The finding that matters most is catastrophic backtracking. Measured on this
// machine with Node: `(a+)+$` against 31 characters of "aaa…b" takes
// 245,932 ms — four minutes of solid CPU for a 31-character input, and it is
// the same engine the browser uses. The worker (engine.worker.ts) is the seat
// belt; this file is the sign that says the bridge is out.
//
// The rule for nested quantifiers is the classic one: a quantifier whose body
// contains another quantifier over a character set that can match the same
// characters gives the engine an exponential number of ways to split the
// input. Detecting it exactly is undecidable in general, so this flags the
// shapes that are wrong in practice and says so as a warning, not a verdict.
// ============================================================================

import type { AstNode, LintFinding } from '../types';
import { childrenOf, walk } from './ast';

/** True when the node can match without consuming anything. */
function isNullable(node: AstNode): boolean {
  switch (node.kind) {
    case 'quantifier':
      return node.min === 0 || isNullable(node.body);
    case 'sequence':
      return node.items.every(isNullable);
    case 'alternation':
      return node.alternatives.some(isNullable);
    case 'group':
      // Lookarounds consume nothing by definition.
      return node.groupKind.includes('look') || isNullable(node.body);
    case 'anchor':
      return true;
    default:
      return false;
  }
}

/** True when the node can match more than one character in one go. */
function isUnbounded(node: Extract<AstNode, { kind: 'quantifier' }>): boolean {
  return node.max === null || node.max > 1;
}

/** The set of characters a node can start with, as a coarse fingerprint. */
function fingerprint(node: AstNode): string | null {
  switch (node.kind) {
    case 'dot':
      return 'any';
    case 'literal':
      return `c:${node.value}`;
    case 'escape':
      return `e:${node.escKind}`;
    case 'class':
      return `k:${node.negated ? '^' : ''}${node.items.map(item => item.raw).join('')}`;
    case 'quantifier':
      return fingerprint(node.body);
    case 'group':
      return fingerprint(node.body);
    case 'sequence':
      return node.items.length > 0 ? fingerprint(node.items[0]) : null;
    default:
      return null;
  }
}

/** Two nodes plausibly match the same characters. Deliberately coarse. */
function overlaps(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a === 'any' || b === 'any') return true;
  // `\w` swallows digits, `\d` is a subset of `\w`, and so on.
  const family = (value: string) => value.replace(/^e:non-/, 'e:');
  return family(a) === family(b);
}

export function lint(root: AstNode, flags: string, pattern: string): LintFinding[] {
  const findings: LintFinding[] = [];
  const captures: number[] = [];
  let anchoredStart = false;
  let anchoredEnd = false;
  let hasLookbehind = false;

  walk(root, node => {
    // -- catastrophic backtracking ------------------------------------------
    if (node.kind === 'quantifier' && isUnbounded(node)) {
      const inner = node.body;

      // `(x+)+`, `(x*)*`, `(x+)*` … the classic exponential shape.
      const innerQuantifiers: Extract<AstNode, { kind: 'quantifier' }>[] = [];
      walk(inner, child => {
        if (child.kind === 'quantifier' && isUnbounded(child)) innerQuantifiers.push(child);
      });

      for (const child of innerQuantifiers) {
        if (child === node) continue;
        if (overlaps(fingerprint(child), fingerprint(node))) {
          findings.push({
            code: 'catastrophic',
            severity: 'danger',
            start: node.start,
            end: node.end,
            params: { raw: node.raw },
          });
          break;
        }
      }

      // A quantifier over something that can match nothing spins in place.
      if (isNullable(inner) && inner.kind !== 'anchor') {
        findings.push({
          code: 'nullable-quantifier',
          severity: 'warning',
          start: node.start,
          end: node.end,
          params: { raw: node.raw },
        });
      }
    }

    // -- adjacent unbounded quantifiers over the same characters ------------
    if (node.kind === 'sequence') {
      for (let index = 0; index < node.items.length - 1; index++) {
        const left = node.items[index];
        const right = node.items[index + 1];
        if (
          left.kind === 'quantifier' &&
          right.kind === 'quantifier' &&
          isUnbounded(left) &&
          isUnbounded(right) &&
          overlaps(fingerprint(left), fingerprint(right))
        ) {
          findings.push({
            code: 'adjacent-quantifiers',
            severity: 'warning',
            start: left.start,
            end: right.end,
            params: { raw: `${left.raw}${right.raw}` },
          });
        }
      }
    }

    // -- an unescaped dot inside what looks like a domain or a date ---------
    if (node.kind === 'dot') {
      findings.push({ code: 'bare-dot', severity: 'info', start: node.start, end: node.end });
    }

    // -- ranges that are almost certainly a typo ----------------------------
    if (node.kind === 'class') {
      for (const item of node.items) {
        if (item.kind === 'char' && item.from === '.') {
          findings.push({
            code: 'escaped-dot-in-class',
            severity: 'info',
            start: node.start,
            end: node.end,
          });
          break;
        }
      }
    }

    if (node.kind === 'group' && (node.groupKind === 'capture' || node.groupKind === 'named')) {
      if (node.number) captures.push(node.number);
    }

    if (node.kind === 'group' && node.groupKind.includes('lookbehind')) hasLookbehind = true;

    if (node.kind === 'anchor' && node.anchorKind === 'start') anchoredStart = true;
    if (node.kind === 'anchor' && node.anchorKind === 'end') anchoredEnd = true;

    // -- a backreference to a group that does not exist ---------------------
    if (node.kind === 'backref' && typeof node.ref === 'number') {
      // Checked after the walk, when the capture count is final.
      findings.push({
        code: 'pending-backref',
        severity: 'info',
        start: node.start,
        end: node.end,
        params: { number: node.ref },
      });
    }
  });

  // Resolve the deferred backreference checks now that all captures are known.
  const total = captures.length;
  for (let index = findings.length - 1; index >= 0; index--) {
    const finding = findings[index];
    if (finding.code !== 'pending-backref') continue;
    const reference = Number(finding.params?.number ?? 0);
    if (reference > total) {
      findings[index] = { ...finding, code: 'unknown-backref', severity: 'warning' };
    } else {
      findings.splice(index, 1);
    }
  }

  // -- flag-level advice ----------------------------------------------------
  if (!flags.includes('g') && !flags.includes('y')) {
    findings.push({ code: 'no-global', severity: 'info', start: 0, end: 0 });
  }

  if (flags.includes('m') && !anchoredStart && !anchoredEnd) {
    findings.push({ code: 'pointless-multiline', severity: 'info', start: 0, end: 0 });
  }

  if (flags.includes('y') && flags.includes('g')) {
    findings.push({ code: 'sticky-and-global', severity: 'info', start: 0, end: 0 });
  }

  if (hasLookbehind && !supportsLookbehind()) {
    findings.push({ code: 'no-lookbehind', severity: 'danger', start: 0, end: 0 });
  }

  if (/\\[pP]\{/.test(pattern) && !flags.includes('u') && !flags.includes('v')) {
    findings.push({ code: 'prop-needs-u', severity: 'warning', start: 0, end: 0 });
  }

  // Only the first "bare dot" and the first informational duplicate are useful.
  return dedupe(findings);
}

function dedupe(findings: LintFinding[]): LintFinding[] {
  const seen = new Set<string>();
  const output: LintFinding[] = [];
  for (const finding of findings) {
    if (seen.has(finding.code)) continue;
    seen.add(finding.code);
    output.push(finding);
  }
  const rank = { danger: 0, warning: 1, info: 2 };
  return output.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

/** Safari only shipped lookbehind in 16.4; the FAQ claims support without checking. */
let lookbehindCache: boolean | null = null;
export function supportsLookbehind(): boolean {
  if (lookbehindCache !== null) return lookbehindCache;
  try {
    // eslint-disable-next-line prefer-regex-literals -- must not be parsed at load time
    new RegExp('(?<=a)b');
    lookbehindCache = true;
  } catch {
    lookbehindCache = false;
  }
  return lookbehindCache;
}

/** `v` (unicodeSets) is ES2024 and still missing on older browsers. */
export function supportsUnicodeSets(): boolean {
  try {
    new RegExp('a', 'v');
    return true;
  } catch {
    return false;
  }
}

/** `d` (hasIndices) is what gives every capture group its offsets. */
export function supportsIndices(): boolean {
  try {
    new RegExp('a', 'd');
    return true;
  } catch {
    return false;
  }
}
