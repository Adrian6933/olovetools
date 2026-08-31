// ============================================================================
// AST → a tree of sentences the user can read.
// ----------------------------------------------------------------------------
// Every line keeps the offsets of the pattern slice it describes, so hovering
// an explanation highlights the exact characters in the pattern field and the
// other way round. That link is the whole reason the parser produces a tree
// instead of a list.
//
// The sentences come from the tool dictionary (nine languages), not from a
// table hardcoded in this file — the previous version kept its own copy of the
// translations inside utils/, where nothing could check it.
// ============================================================================

import type { AstNode, ExplainNode, ExplainTone } from '../types';
import { childrenOf } from './ast';

type Translate = (key: string, params?: Record<string, string | number>) => string;

const TONE: Record<AstNode['kind'], ExplainTone> = {
  alternation: 'alternation',
  sequence: 'literal',
  group: 'group',
  quantifier: 'quantifier',
  class: 'class',
  escape: 'escape',
  prop: 'class',
  backref: 'backref',
  anchor: 'anchor',
  dot: 'class',
  literal: 'literal',
};

const ESCAPE_KEY: Record<string, string> = {
  digit: 'ex_digit',
  'non-digit': 'ex_nonDigit',
  word: 'ex_word',
  'non-word': 'ex_nonWord',
  space: 'ex_space',
  'non-space': 'ex_nonSpace',
  tab: 'ex_tab',
  newline: 'ex_newline',
  return: 'ex_return',
  'form-feed': 'ex_formFeed',
  'vertical-tab': 'ex_verticalTab',
  null: 'ex_null',
};

const GROUP_KEY: Record<string, string> = {
  capture: 'ex_groupCapture',
  named: 'ex_groupNamed',
  noncapture: 'ex_groupNonCapture',
  lookahead: 'ex_lookahead',
  'neg-lookahead': 'ex_negLookahead',
  lookbehind: 'ex_lookbehind',
  'neg-lookbehind': 'ex_negLookbehind',
};

const ANCHOR_KEY: Record<string, string> = {
  start: 'ex_anchorStart',
  end: 'ex_anchorEnd',
  'word-boundary': 'ex_wordBoundary',
  'non-word-boundary': 'ex_nonWordBoundary',
};

/** Renders a control character as something printable. */
function showChar(char: string): string {
  const map: Record<string, string> = {
    '\n': '\\n',
    '\r': '\\r',
    '\t': '\\t',
    '\f': '\\f',
    '\v': '\\v',
    '\0': '\\0',
    '\b': '\\b',
  };
  if (map[char]) return map[char];
  const code = char.codePointAt(0) ?? 0;
  if (code < 32 || code === 127) return `\\u{${code.toString(16)}}`;
  return char;
}

function quantifierText(node: Extract<AstNode, { kind: 'quantifier' }>, t: Translate): string {
  const { min, max, lazy } = node;
  let base: string;

  if (min === 0 && max === null) base = t('ex_quantStar');
  else if (min === 1 && max === null) base = t('ex_quantPlus');
  else if (min === 0 && max === 1) base = t('ex_quantOptional');
  else if (max === null) base = t('ex_quantMin', { min });
  else if (min === max) base = t('ex_quantExact', { count: min });
  else base = t('ex_quantRange', { min, max });

  return `${base} — ${lazy ? t('ex_lazy') : t('ex_greedy')}`;
}

function classText(node: Extract<AstNode, { kind: 'class' }>, t: Translate): string {
  const pieces = node.items.map(item => {
    if (item.kind === 'range') return `${showChar(item.from ?? '')}–${showChar(item.to ?? '')}`;
    if (item.kind === 'prop') return `\\${item.negatedProp ? 'P' : 'p'}{${item.propName}}`;
    if (item.kind === 'escape') return item.raw;
    return showChar(item.from ?? item.raw);
  });

  const list = pieces.join(' ');
  if (node.items.length === 0) return t('ex_classEmpty');
  return node.negated ? t('ex_classNegated', { chars: list }) : t('ex_class', { chars: list });
}

function describe(node: AstNode, t: Translate): string | null {
  switch (node.kind) {
    case 'sequence':
      // A sequence is scaffolding, not a statement; its children speak for it.
      return null;

    case 'alternation':
      return t('ex_alternation', { count: node.alternatives.length });

    case 'group': {
      const key = GROUP_KEY[node.groupKind] ?? 'ex_groupCapture';
      if (node.groupKind === 'named') return t(key, { name: node.name ?? '', number: node.number ?? 0 });
      if (node.groupKind === 'capture') return t(key, { number: node.number ?? 0 });
      return t(key);
    }

    case 'quantifier':
      return quantifierText(node, t);

    case 'class':
      return classText(node, t);

    case 'escape': {
      const key = ESCAPE_KEY[node.escKind];
      if (key) return t(key);
      if (node.escKind === 'hex' || node.escKind === 'unicode' || node.escKind === 'control') {
        return t('ex_codepoint', { raw: node.raw, char: showChar(node.value) });
      }
      return t('ex_escaped', { char: node.value });
    }

    case 'prop':
      return node.negated
        ? t('ex_propNegated', { name: node.propName })
        : t('ex_prop', { name: node.propName });

    case 'backref':
      return typeof node.ref === 'number'
        ? t('ex_backref', { number: node.ref })
        : t('ex_backrefNamed', { name: node.ref });

    case 'anchor':
      return t(ANCHOR_KEY[node.anchorKind]);

    case 'dot':
      return t('ex_dot');

    case 'literal':
      return t('ex_literal', { char: showChar(node.value) });
  }
}

/**
 * Consecutive single characters read as noise one line at a time
 * ("literal 'h'", "literal 't'", "literal 't'", "literal 'p'"). They are
 * merged into one line so the explanation stays about structure.
 */
function mergeLiterals(nodes: AstNode[], t: Translate): ExplainNode[] {
  const output: ExplainNode[] = [];
  let run: Extract<AstNode, { kind: 'literal' }>[] = [];

  const flush = () => {
    if (run.length === 0) return;
    if (run.length === 1) {
      const only = run[0];
      output.push({
        id: only.id,
        raw: only.raw,
        start: only.start,
        end: only.end,
        tone: 'literal',
        text: t('ex_literal', { char: showChar(only.value) }),
        children: [],
      });
    } else {
      const text = run.map(item => item.value).join('');
      output.push({
        id: run[0].id,
        raw: text,
        start: run[0].start,
        end: run[run.length - 1].end,
        tone: 'literal',
        text: t('ex_literalRun', { text }),
        children: [],
      });
    }
    run = [];
  };

  for (const node of nodes) {
    if (node.kind === 'literal') {
      run.push(node);
      continue;
    }
    flush();
    const built = build(node, t);
    if (built) output.push(...built);
  }
  flush();

  return output;
}

/** Returns the lines for one node — usually one, none for pure scaffolding. */
function build(node: AstNode, t: Translate): ExplainNode[] {
  const text = describe(node, t);
  const children = childrenOf(node);

  if (text === null) {
    // Sequence: splice its children in at the parent's level.
    return mergeLiterals(children, t);
  }

  return [
    {
      id: node.id,
      raw: node.raw,
      start: node.start,
      end: node.end,
      tone: TONE[node.kind],
      text,
      children: mergeLiterals(children, t),
    },
  ];
}

export function explain(root: AstNode, t: Translate): ExplainNode[] {
  return build(root, t);
}

/** Total lines in a tree — used to decide whether to collapse the panel. */
export function countLines(nodes: ExplainNode[]): number {
  return nodes.reduce((total, node) => total + 1 + countLines(node.children), 0);
}
