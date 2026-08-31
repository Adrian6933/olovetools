// ============================================================================
// Compatibility report.
//
// Lottie is a superset of what any given player supports. A file can parse
// perfectly and still render wrong (or blank) on iOS, Android or older web
// players. Every finding below is something that actually breaks somewhere, so
// the user sees it *before* shipping the animation, not after.
// ============================================================================

import type { Diagnostics, Finding, LottieJson } from '../types';

interface Counters {
  expressions: number;
  externalAssets: number;
  imageAssets: number;
  textLayers: number;
  effects: number;
  mattes: number;
  mergePaths: number;
  threeD: number;
  precomps: number;
  layers: number;
}

/**
 * One pass over the document. Bounded depth because a malformed file can carry
 * cycles once it has been through a round of hand editing.
 */
function scan(node: any, counters: Counters, depth: number): void {
  if (!node || typeof node !== 'object' || depth > 24) return;

  if (Array.isArray(node)) {
    for (const child of node) scan(child, counters, depth + 1);
    return;
  }

  // Expressions: `x` on a property object, alongside its `k` value.
  if (typeof node.x === 'string' && node.x.length > 0 && node.k !== undefined) {
    counters.expressions++;
  }
  if (node.tt !== undefined) counters.mattes++;
  if (node.ty === 'mm') counters.mergePaths++;
  if (node.ddd === 1) counters.threeD++;
  if (Array.isArray(node.ef) && node.ef.length > 0) counters.effects += node.ef.length;

  for (const key in node) {
    if (!Object.prototype.hasOwnProperty.call(node, key)) continue;
    const value = node[key];
    // Numeric arrays are keyframe data — nothing to find in there, and they are
    // where the bulk of a Lottie's bytes live.
    if (Array.isArray(value) && value.length && typeof value[0] === 'number') continue;
    if (value && typeof value === 'object') scan(value, counters, depth + 1);
  }
}

function push(findings: Finding[], finding: Finding): void {
  findings.push(finding);
}

export function buildDiagnostics(json: LottieJson): Diagnostics {
  const counters: Counters = {
    expressions: 0,
    externalAssets: 0,
    imageAssets: 0,
    textLayers: 0,
    effects: 0,
    mattes: 0,
    mergePaths: 0,
    threeD: 0,
    precomps: 0,
    layers: 0,
  };

  const bytes = new Blob([JSON.stringify(json)]).size;

  const countLayerList = (layers: any[] | undefined) => {
    if (!Array.isArray(layers)) return;
    counters.layers += layers.length;
    for (const layer of layers) {
      if (layer?.ty === 5) counters.textLayers++;
      if (layer?.ty === 0) counters.precomps++;
    }
  };

  countLayerList(json.layers);

  if (Array.isArray(json.assets)) {
    for (const asset of json.assets) {
      if (!asset) continue;
      if (Array.isArray(asset.layers)) {
        countLayerList(asset.layers);
        continue;
      }
      if (typeof asset.p === 'string') {
        counters.imageAssets++;
        // Anything not embedded as a data URI has to be fetched at render time —
        // which is exactly the thing this tool promises never to do.
        if (!asset.p.startsWith('data:')) counters.externalAssets++;
      }
    }
  }

  scan(json.layers, counters, 0);
  scan(json.assets, counters, 0);

  const findings: Finding[] = [];

  if (counters.externalAssets > 0) {
    push(findings, {
      level: 'error',
      key: 'finding_external_assets',
      fallback:
        '{n} image asset(s) are referenced by URL instead of embedded. They will not render here, and the animation is not self-contained.',
      count: counters.externalAssets,
    });
  }
  if (counters.expressions > 0) {
    push(findings, {
      level: 'warn',
      key: 'finding_expressions',
      fallback:
        '{n} expression(s) found. The web player evaluates them, but the iOS and Android players ignore them.',
      count: counters.expressions,
    });
  }
  if (counters.textLayers > 0) {
    push(findings, {
      level: 'warn',
      key: 'finding_text',
      fallback:
        '{n} text layer(s). Unless the fonts are outlined or bundled, they fall back to a system font on other devices.',
      count: counters.textLayers,
    });
  }
  if (counters.mattes > 0) {
    push(findings, {
      level: 'info',
      key: 'finding_mattes',
      fallback: '{n} track matte(s). Widely supported, but they are the most expensive thing to render.',
      count: counters.mattes,
    });
  }
  if (counters.mergePaths > 0) {
    push(findings, {
      level: 'warn',
      key: 'finding_merge_paths',
      fallback: '{n} merge path(s). Not supported by the Android player and only partially on iOS.',
      count: counters.mergePaths,
    });
  }
  if (counters.effects > 0) {
    push(findings, {
      level: 'warn',
      key: 'finding_effects',
      fallback: '{n} layer effect(s). Only a small subset of After Effects effects survives export.',
      count: counters.effects,
    });
  }
  if (counters.threeD > 0) {
    push(findings, {
      level: 'warn',
      key: 'finding_3d',
      fallback: '{n} layer(s) marked as 3D. Lottie renderers flatten these to 2D.',
      count: counters.threeD,
    });
  }
  if (bytes > 500 * 1024) {
    push(findings, {
      level: 'warn',
      key: 'finding_heavy',
      fallback:
        'This file is heavy for the web. Try the optimizer below — trimming decimal precision usually removes a large chunk of it.',
    });
  }
  if (counters.layers > 60) {
    push(findings, {
      level: 'info',
      key: 'finding_many_layers',
      fallback: '{n} layers. Anything above ~60 starts to cost real frame time on mid-range phones.',
      count: counters.layers,
    });
  }
  if (findings.length === 0) {
    push(findings, {
      level: 'info',
      key: 'finding_clean',
      fallback: 'No compatibility problems found. This animation should render the same everywhere.',
    });
  }

  return {
    bytes,
    layerCount: counters.layers,
    precompCount: counters.precomps,
    assetImageCount: counters.imageAssets,
    externalAssetCount: counters.externalAssets,
    expressionCount: counters.expressions,
    textLayerCount: counters.textLayers,
    effectCount: counters.effects,
    matteCount: counters.mattes,
    mergePathCount: counters.mergePaths,
    threeDLayerCount: counters.threeD,
    findings,
  };
}
