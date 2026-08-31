// ============================================================================
// The optimizer itself: svgo, driven from the browser.
// ----------------------------------------------------------------------------
// Two things here are worth knowing.
//
// 1. We do not use `preset-default`. We pass an explicit, ordered plugin list,
//    because the user picks plugins individually and svgo only applies a
//    top-level `floatPrecision` to plugins *inside a preset* — a flat list
//    silently ignores it. Every precision-taking plugin gets its params wired
//    by hand below.
//
// 2. Statistics come from svgo's own AST, not from re-parsing the output. Two
//    tiny custom plugins bookend the chain and walk the tree svgo already
//    built. That is the intermediate data the UI reports on, and it is how the
//    tool can warn about an external reference or a script *before* deciding
//    what to do about it.
// ============================================================================

import { optimize } from 'svgo/browser';
import { repairSvgSource } from './repair';
import type {
  OptimizeRequest,
  OptimizeResult,
  OptimizerSettings,
  SvgStats,
} from './types';

/**
 * Execution order. svgo's plugins are order-sensitive — `inlineStyles` before
 * `minifyStyles`, `convertPathData` before `mergePaths` — so this follows
 * preset-default's sequence for the plugins it contains, with the extras
 * slotted next to their nearest relative rather than appended.
 */
const RUN_ORDER = [
  'removeScripts',
  'removeDoctype',
  'removeXMLProcInst',
  'removeComments',
  'removeDeprecatedAttrs',
  'removeMetadata',
  'removeEditorsNSData',
  'removeRasterImages',
  'cleanupAttrs',
  'mergeStyles',
  'inlineStyles',
  'minifyStyles',
  'removeStyleElement',
  'convertStyleToAttrs',
  'convertOneStopGradients',
  'cleanupIds',
  'removeUselessDefs',
  'cleanupNumericValues',
  'cleanupListOfValues',
  'convertColors',
  'removeUnknownsAndDefaults',
  'removeNonInheritableGroupAttrs',
  'removeUselessStrokeAndFill',
  'removeHiddenElems',
  'removeEmptyText',
  'convertShapeToPath',
  'convertEllipseToCircle',
  'moveElemsAttrsToGroup',
  'moveGroupAttrsToElems',
  'collapseGroups',
  'convertPathData',
  'removeOffCanvasPaths',
  'convertTransform',
  'removeEmptyAttrs',
  'removeEmptyContainers',
  'mergePaths',
  'reusePaths',
  'removeUnusedNS',
  'removeXlink',
  'sortAttrs',
  'sortDefsChildren',
  'removeDesc',
  'removeTitle',
  'removeDimensions',
  'removeViewBox',
];

/**
 * Params that depend on the user's precision sliders.
 *
 * `cleanupNumericValues` gets a floor of 1 decimal, and that is not a
 * cosmetic choice. It rounds *every* numeric attribute with one setting,
 * opacity included, so at precision 0 an `opacity="0.4"` becomes `opacity="0"`
 * — and `removeHiddenElems`, further down the chain, then deletes the element
 * for being invisible. Asking for integer coordinates is a reasonable request;
 * silently deleting half the drawing is not the answer to it. Path geometry
 * still honours precision 0 through `convertPathData`, which is the plugin
 * that actually owns coordinates.
 */
function paramsFor(id: string, s: OptimizerSettings): Record<string, unknown> | undefined {
  switch (id) {
    case 'cleanupNumericValues':
    case 'cleanupListOfValues':
      return { floatPrecision: Math.max(1, s.floatPrecision) };
    case 'convertPathData':
      return {
        floatPrecision: s.floatPrecision,
        transformPrecision: s.transformPrecision,
      };
    case 'convertTransform':
      return {
        floatPrecision: s.floatPrecision,
        transformPrecision: s.transformPrecision,
      };
    default:
      return undefined;
  }
}

const emptyStats = (): SvgStats => ({
  elements: 0,
  paths: 0,
  groups: 0,
  ids: 0,
  colors: 0,
  pathChars: 0,
  hasScript: false,
  hasEventHandlers: false,
  hasRaster: false,
  hasExternalRef: false,
  hasText: false,
  hasViewBox: false,
  hasDimensions: false,
});

const COLOR_ATTRS = ['fill', 'stroke', 'stop-color', 'flood-color', 'lighting-color'];
const HREF_ATTRS = ['href', 'xlink:href'];
const COLOR_LITERAL = /#[0-9a-f]{3,8}\b|\brgba?\([^)]*\)|\bhsla?\([^)]*\)/gi;

/**
 * A custom svgo plugin that only reads. `sink` is filled in as the tree is
 * walked; nothing is mutated, so it is safe at any position in the chain.
 */
function inspector(sink: { stats: SvgStats }, once: { done: boolean } | null) {
  return {
    name: 'olove-inspect',
    fn: () => {
      if (once?.done) return {};
      if (once) once.done = true;

      const stats = emptyStats();
      const colors = new Set<string>();
      sink.stats = stats;

      return {
        element: {
          enter(node: { name: string; attributes: Record<string, string> }) {
            stats.elements++;
            const name = node.name;
            const attrs = node.attributes || {};

            if (name === 'path') {
              stats.paths++;
              if (attrs.d) stats.pathChars += attrs.d.length;
            } else if (name === 'g') {
              stats.groups++;
            } else if (name === 'script') {
              stats.hasScript = true;
            } else if (name === 'image') {
              stats.hasRaster = true;
            } else if (name === 'text' || name === 'tspan') {
              stats.hasText = true;
            } else if (name === 'svg' && stats.elements === 1) {
              stats.hasViewBox = 'viewBox' in attrs;
              stats.hasDimensions = 'width' in attrs || 'height' in attrs;
            }

            if (attrs.id !== undefined) stats.ids++;

            for (const [key, value] of Object.entries(attrs)) {
              if (key.startsWith('on')) stats.hasEventHandlers = true;

              if (COLOR_ATTRS.includes(key) && value && value !== 'none') {
                colors.add(value.trim().toLowerCase());
              }
              if (key === 'style' && value) {
                for (const m of value.matchAll(COLOR_LITERAL)) colors.add(m[0].toLowerCase());
              }
              if (HREF_ATTRS.includes(key) && /^(https?:)?\/\//i.test(value || '')) {
                stats.hasExternalRef = true;
              }
            }
            stats.colors = colors.size;
          },
        },
      };
    },
  };
}

/** Bytes after gzip — the number that decides what the network actually moves. */
async function gzipSize(text: string): Promise<number> {
  if (typeof CompressionStream === 'undefined') return 0;
  try {
    const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
    const buffer = await new Response(stream).arrayBuffer();
    return buffer.byteLength;
  } catch {
    return 0;
  }
}

const byteLength = (text: string) => new TextEncoder().encode(text).length;

export async function runOptimize(request: OptimizeRequest): Promise<OptimizeResult> {
  const started = Date.now();
  const { id, settings } = request;

  if (!request.source.trim()) {
    return { ok: false, id, reason: 'empty', detail: '', repairs: [] };
  }

  const { source, notes } = repairSvgSource(request.source);

  if (!/<svg[\s>]/i.test(source)) {
    return { ok: false, id, reason: 'not-svg', detail: '', repairs: notes };
  }

  const beforeSink = { stats: emptyStats() };
  const afterSink = { stats: emptyStats() };

  const plugins: unknown[] = [inspector(beforeSink, { done: false })];
  for (const pluginId of RUN_ORDER) {
    if (!settings.enabled[pluginId]) continue;
    const params = paramsFor(pluginId, settings);
    plugins.push(params ? { name: pluginId, params } : pluginId);
  }
  plugins.push(inspector(afterSink, null));

  let output: string;
  try {
    const result = optimize(source, {
      multipass: settings.multipass,
      js2svg: { pretty: settings.prettify, indent: 2 },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      plugins: plugins as any,
    });
    output = result.data;
  } catch (error: unknown) {
    const err = error as { message?: string; reason?: string; line?: number; column?: number };
    return {
      ok: false,
      id,
      reason: 'parse',
      detail: err.reason || err.message || 'unknown',
      line: err.line,
      column: err.column,
      repairs: notes,
    };
  }

  const [inputGzip, outputGzip] = await Promise.all([
    gzipSize(request.source),
    gzipSize(output),
  ]);

  return {
    ok: true,
    id,
    output,
    inputBytes: byteLength(request.source),
    outputBytes: byteLength(output),
    inputGzip,
    outputGzip,
    before: beforeSink.stats,
    after: afterSink.stats,
    repairs: notes,
    ms: Date.now() - started,
  };
}
