// ============================================================================
// The conversion entry points, shared by the main thread and the worker.
// ----------------------------------------------------------------------------
// Everything here is pure: same input, same options, same output. That is what
// lets the worker and the synchronous fallback be interchangeable.
// ============================================================================

import type {
  ConversionResult,
  DocStats,
  ParseIssue,
  Pos,
  RoundTrip,
  RoundTripLoss,
  ToJsonOptions,
  ToXmlOptions,
  XmlDocument,
  XmlNode,
} from '../types';
import { EMPTY_STATS } from '../types';
import { parseXml } from './xmlParse';
import { serializeXml } from './xmlSerialize';
import { projectDocument, stringify } from './toJson';
import { documentFromJson } from './fromJson';

const encoder = new TextEncoder();

export function byteLength(value: string): number {
  return encoder.encode(value).length;
}

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

// ---------------------------------------------------------------------------
// JSON errors with a real position
// ---------------------------------------------------------------------------

function posFromOffset(source: string, offset: number): Pos {
  const clamped = Math.max(0, Math.min(offset, source.length));
  let line = 1;
  let lineStart = 0;
  for (let i = 0; i < clamped; i += 1) {
    if (source.charCodeAt(i) === 10) {
      line += 1;
      lineStart = i + 1;
    }
  }
  return { line, col: clamped - lineStart + 1, offset: clamped };
}

/**
 * `JSON.parse` throws a string, and the wording changes between engines and
 * between Chrome versions. The offset is the one stable part, so that is what
 * gets pulled out; the message itself is only ever shown as a detail.
 */
export function parseJsonWithPosition(source: string): { value: unknown; issue: ParseIssue | null } {
  try {
    return { value: JSON.parse(source), issue: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const match = /at position (\d+)/.exec(message);
    const lineCol = /line (\d+) column (\d+)/.exec(message);
    let pos: Pos;
    if (match) pos = posFromOffset(source, Number(match[1]));
    else if (lineCol) pos = { line: Number(lineCol[1]), col: Number(lineCol[2]), offset: 0 };
    else pos = { line: 1, col: 1, offset: 0 };
    return {
      value: undefined,
      issue: {
        level: 'error',
        code: 'json-syntax',
        pos,
        length: 1,
        detail: message.replace(/\s*in JSON at position.*$/, '').trim(),
      },
    };
  }
}

// ---------------------------------------------------------------------------
// Counting
// ---------------------------------------------------------------------------

export interface NodeCounts {
  elements: number;
  attributes: number;
  text: number;
  comments: number;
  cdata: number;
  pi: number;
  depth: number;
}

export function countNodes(doc: XmlDocument): NodeCounts {
  const counts: NodeCounts = { elements: 0, attributes: 0, text: 0, comments: 0, cdata: 0, pi: 0, depth: 0 };

  const walk = (nodes: XmlNode[], depth: number) => {
    if (depth > counts.depth) counts.depth = depth;
    for (const node of nodes) {
      switch (node.kind) {
        case 'element':
          counts.elements += 1;
          counts.attributes += node.attrs.length;
          walk(node.children, depth + 1);
          break;
        case 'text':
          if (!node.blank) counts.text += 1;
          break;
        case 'cdata':
          counts.cdata += 1;
          break;
        case 'comment':
          counts.comments += 1;
          break;
        case 'pi':
          counts.pi += 1;
          break;
        default:
          break;
      }
    }
  };

  walk(doc.top, 1);
  return counts;
}

// ---------------------------------------------------------------------------
// Round trip
// ---------------------------------------------------------------------------

function compare(
  before: NodeCounts,
  after: NodeCounts,
  declBefore: boolean,
  declAfter: boolean,
  /**
   * Categories the options deliberately discard. They are excluded from the
   * score rather than counted against it: the meter is meant to answer "did
   * the conversion lose something you did not ask it to lose?", and a document
   * whose comments you switched off would otherwise never read 100%.
   */
  ignore: RoundTripLoss['code'][] = []
): RoundTrip {
  const pairs: [RoundTripLoss['code'], number, number][] = [
    ['elements', before.elements, after.elements],
    ['attributes', before.attributes, after.attributes],
    ['text', before.text, after.text],
    ['comments', before.comments, after.comments],
    ['cdata', before.cdata, after.cdata],
    ['pi', before.pi, after.pi],
    ['declaration', declBefore ? 1 : 0, declAfter ? 1 : 0],
  ];

  const losses: RoundTripLoss[] = [];
  let kept = 0;
  let total = 0;

  for (const [code, a, b] of pairs) {
    if (a === 0 && b === 0) continue;
    if (ignore.includes(code)) continue;
    total += a;
    kept += Math.min(a, b);
    if (a !== b) losses.push({ code, before: a, after: b });
  }

  return { score: total === 0 ? 100 : Math.round((kept / total) * 100), losses, ms: 0 };
}

// ---------------------------------------------------------------------------
// XML → JSON
// ---------------------------------------------------------------------------

export function xmlToJson(source: string, opts: ToJsonOptions, withRoundTrip: boolean): ConversionResult {
  const started = now();

  if (!source.trim()) {
    return { ok: true, output: '', issues: [], stats: { ...EMPTY_STATS }, roundTrip: null };
  }

  const doc = parseXml(source);
  const projection = projectDocument(doc, opts);
  const output = stringify(projection.value, opts);
  const fatal = doc.issues.some(i => i.level === 'error');

  const stats: DocStats = {
    elements: projection.stats.elements,
    attributes: projection.stats.attributes,
    textNodes: projection.stats.textNodes,
    depth: projection.stats.depth,
    inputBytes: byteLength(source),
    outputBytes: byteLength(output),
    ms: 0,
    offThread: false,
  };

  let roundTrip: RoundTrip | null = null;
  if (withRoundTrip && !fatal) {
    const rtStart = now();
    const back = documentFromJson(projection.value, {
      attrPrefix: opts.attrPrefix,
      textKey: opts.textKey,
      rootName: 'root',
      itemName: 'item',
      declaration: opts.keepDeclaration,
      selfClose: true,
      indent: opts.indent,
      minify: false,
      nilAttribute: false,
    });
    const ignore: RoundTrip['losses'][number]['code'][] = [];
    if (!opts.keepDeclaration) ignore.push('declaration');
    if (!opts.keepComments) ignore.push('comments', 'pi');
    if (!opts.keepCdata) ignore.push('cdata');

    roundTrip = compare(
      countNodes(doc),
      countNodes(back.doc),
      Boolean(doc.declaration),
      Boolean(back.doc.declaration),
      ignore
    );
    roundTrip.ms = Math.round((now() - rtStart) * 10) / 10;
  }

  stats.ms = Math.round((now() - started) * 10) / 10;
  return { ok: !fatal, output, issues: doc.issues, stats, roundTrip };
}

// ---------------------------------------------------------------------------
// JSON → XML
// ---------------------------------------------------------------------------

export function jsonToXml(source: string, opts: ToXmlOptions, withRoundTrip: boolean): ConversionResult {
  const started = now();

  if (!source.trim()) {
    return { ok: true, output: '', issues: [], stats: { ...EMPTY_STATS }, roundTrip: null };
  }

  const { value, issue } = parseJsonWithPosition(source);
  if (issue) {
    return {
      ok: false,
      output: '',
      issues: [issue],
      stats: { ...EMPTY_STATS, inputBytes: byteLength(source), ms: Math.round((now() - started) * 10) / 10 },
      roundTrip: null,
    };
  }

  const built = documentFromJson(value, opts);
  const output = serializeXml(built.doc, {
    indent: opts.indent,
    minify: opts.minify,
    selfClose: opts.selfClose,
    declaration: opts.declaration,
  });
  const counts = countNodes(built.doc);

  const stats: DocStats = {
    elements: counts.elements,
    attributes: counts.attributes,
    textNodes: counts.text,
    depth: counts.depth,
    inputBytes: byteLength(source),
    outputBytes: byteLength(output),
    ms: 0,
    offThread: false,
  };

  let roundTrip: RoundTrip | null = null;
  if (withRoundTrip) {
    const rtStart = now();
    // The honest check here is that the XML we just wrote parses back into the
    // same tree. If it does not, we produced a document nobody can read.
    const reparsed = parseXml(output);
    roundTrip = compare(counts, countNodes(reparsed), Boolean(built.doc.declaration), Boolean(reparsed.declaration));
    if (reparsed.issues.some(i => i.level === 'error')) roundTrip.score = 0;
    roundTrip.ms = Math.round((now() - rtStart) * 10) / 10;
  }

  stats.ms = Math.round((now() - started) * 10) / 10;
  return { ok: true, output, issues: built.issues, stats, roundTrip };
}

// ---------------------------------------------------------------------------
// Formatting the input in place (pretty / minify), without changing direction
// ---------------------------------------------------------------------------

export function formatXml(source: string, indent: number, minify: boolean): { text: string; ok: boolean } {
  const doc = parseXml(source);
  if (doc.issues.some(i => i.level === 'error')) return { text: source, ok: false };
  return {
    text: serializeXml(doc, { indent, minify, selfClose: true, declaration: true }),
    ok: true,
  };
}

export function formatJson(source: string, indent: number, minify: boolean): { text: string; ok: boolean } {
  const { value, issue } = parseJsonWithPosition(source);
  if (issue) return { text: source, ok: false };
  return { text: JSON.stringify(value, null, minify ? undefined : indent) ?? source, ok: true };
}
