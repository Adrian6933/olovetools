// ============================================================================
// Colour extraction and patching.
//
// The old version walked (and rebuilt) the entire document on every colour
// picker event. This one walks it exactly once per file, records the *path* to
// every colour it finds, and then patches only those paths — so editing a
// colour costs O(occurrences) instead of O(document), regardless of file size.
//
// It also understands three things the old one silently ignored: gradients,
// animated colour properties, and solid layers.
// ============================================================================

import type { ColorKind, ColorRef, ColorSwatch, LayerInfo, LottieJson } from '../types';

// ---------------------------------------------------------------------------
// Colour conversion
// ---------------------------------------------------------------------------

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (val: number) => {
    // Lottie stores channels as 0..1 floats, but a few exporters (and some
    // hand-edited files) write 0..255 instead. Anything above 1 is treated as
    // an 8-bit value, which is what every real player does too.
    const scaled = val > 1 ? val : val * 255;
    const clamped = Math.max(0, Math.min(255, Math.round(scaled)));
    return clamped.toString(16).padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toLowerCase();
}

export function hexToRgb(hex: string): [number, number, number] | null {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result
    ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
      ]
    : null;
}

/** Relative luminance, used to pick a readable label colour over a swatch. */
export function isLightHex(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2] > 0.55;
}

function isColorTriplet(k: any): boolean {
  if (!Array.isArray(k) || k.length < 3 || k.length > 4) return false;
  return k.every(val => typeof val === 'number' && val >= 0 && val <= 255);
}

// ---------------------------------------------------------------------------
// Layer type labels (Lottie `ty` codes)
// ---------------------------------------------------------------------------

const LAYER_TYPES: Record<number, string> = {
  0: 'Precomp',
  1: 'Solid',
  2: 'Image',
  3: 'Null',
  4: 'Shape',
  5: 'Text',
  6: 'Audio',
  13: 'Camera',
};

export function layerTypeLabel(ty: number): string {
  return LAYER_TYPES[ty] || `Type ${ty}`;
}

// ---------------------------------------------------------------------------
// Extraction
// ---------------------------------------------------------------------------

interface WalkContext {
  refs: ColorRef[];
  layerName: string;
}

/** Records every colour occurrence inside one shape/effect subtree. */
function walkForColors(node: any, path: (string | number)[], ctx: WalkContext): void {
  if (!node || typeof node !== 'object') return;

  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) walkForColors(node[i], [...path, i], ctx);
    return;
  }

  const ty = node.ty;

  // --- Solid layer: the colour is a plain hex string on the layer itself ----
  if (ty === 1 && typeof node.sc === 'string' && /^#[0-9a-f]{6}$/i.test(node.sc)) {
    ctx.refs.push({
      path: [...path],
      mode: 'solidHex',
      hex: node.sc.toLowerCase(),
      kind: 'solid',
      layerName: ctx.layerName,
      animated: false,
    });
  }

  // --- Gradient fill / stroke ----------------------------------------------
  // `g.p` is the number of colour stops; `g.k.k` is a flat table laid out as
  // [offset,r,g,b, offset,r,g,b, …] followed (optionally) by [offset,alpha] pairs.
  if ((ty === 'gf' || ty === 'gs') && node.g && node.g.k && Array.isArray(node.g.k.k)) {
    const stops = typeof node.g.p === 'number' ? node.g.p : Math.floor(node.g.k.k.length / 4);
    const table: number[] = node.g.k.k;
    for (let s = 0; s < stops; s++) {
      const base = s * 4;
      if (base + 3 >= table.length) break;
      const [r, g, b] = [table[base + 1], table[base + 2], table[base + 3]];
      if (typeof r !== 'number' || typeof g !== 'number' || typeof b !== 'number') continue;
      ctx.refs.push({
        path: [...path, 'g', 'k', 'k'],
        mode: 'gradientStop',
        stopIndex: s,
        hex: rgbToHex(r, g, b),
        kind: 'gradient',
        layerName: ctx.layerName,
        animated: node.g.k.a === 1,
      });
    }
  }

  // --- Fill / stroke colour property ---------------------------------------
  if (node.c && typeof node.c === 'object' && node.c.k !== undefined) {
    const kind: ColorKind = ty === 'st' ? 'stroke' : 'fill';
    const k = node.c.k;

    if (isColorTriplet(k)) {
      // Static colour.
      ctx.refs.push({
        path: [...path, 'c', 'k'],
        mode: 'rgbArray',
        hex: rgbToHex(k[0], k[1], k[2]),
        kind,
        layerName: ctx.layerName,
        animated: false,
      });
    } else if (Array.isArray(k)) {
      // Animated colour: `k` is a keyframe list. Each keyframe carries the
      // colour in `s` (start) and, on older exports, `e` (end). One ref per
      // value so the user can recolour an animated fill too.
      for (let i = 0; i < k.length; i++) {
        const frame = k[i];
        if (!frame || typeof frame !== 'object') continue;
        for (const field of ['s', 'e'] as const) {
          const value = frame[field];
          if (!isColorTriplet(value)) continue;
          ctx.refs.push({
            path: [...path, 'c', 'k', i, field],
            mode: 'rgbArray',
            hex: rgbToHex(value[0], value[1], value[2]),
            kind,
            layerName: ctx.layerName,
            animated: true,
          });
        }
      }
    }
  }

  // Recurse into the parts of the node that can hold more colours. Walking
  // every key would also crawl huge numeric keyframe arrays for nothing.
  for (const key of ['it', 'shapes', 'ef', 'v', 'layers', 'masksProperties']) {
    if (node[key] !== undefined) walkForColors(node[key], [...path, key], ctx);
  }
}

/** Collects every editable colour in the document, with its exact location. */
export function extractColorRefs(json: LottieJson): ColorRef[] {
  const refs: ColorRef[] = [];
  if (!json || typeof json !== 'object') return refs;

  const scanLayers = (layers: any[] | undefined, basePath: (string | number)[]) => {
    if (!Array.isArray(layers)) return;
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      if (!layer || typeof layer !== 'object') continue;
      const ctx: WalkContext = { refs, layerName: layer.nm || `Layer ${i + 1}` };
      walkForColors(layer, [...basePath, i], ctx);
    }
  };

  scanLayers(json.layers, ['layers']);

  // Precomps keep their own layer lists inside `assets`.
  if (Array.isArray(json.assets)) {
    for (let a = 0; a < json.assets.length; a++) {
      const asset = json.assets[a];
      if (asset && Array.isArray(asset.layers)) {
        scanLayers(asset.layers, ['assets', a, 'layers']);
      }
    }
  }

  return refs;
}

/** Groups refs into the palette the user actually sees. */
export function groupSwatches(refs: ColorRef[]): ColorSwatch[] {
  const byHex = new Map<string, ColorSwatch>();
  for (const ref of refs) {
    let swatch = byHex.get(ref.hex);
    if (!swatch) {
      swatch = { hex: ref.hex, refs: [], kinds: [], animated: false };
      byHex.set(ref.hex, swatch);
    }
    swatch.refs.push(ref);
    if (!swatch.kinds.includes(ref.kind)) swatch.kinds.push(ref.kind);
    if (ref.animated) swatch.animated = true;
  }
  // Most-used first: the dominant colours of the animation come first, which is
  // what people want to change.
  return Array.from(byHex.values()).sort(
    (a, b) => b.refs.length - a.refs.length || a.hex.localeCompare(b.hex)
  );
}

// ---------------------------------------------------------------------------
// Patching
// ---------------------------------------------------------------------------

function resolve(root: any, path: (string | number)[]): any {
  let node = root;
  for (const segment of path) {
    if (node == null) return undefined;
    node = node[segment];
  }
  return node;
}

/**
 * Applies a colour map to `json` **in place**. The caller owns the copy, so this
 * never allocates a second document.
 *
 * Returns the number of occurrences actually rewritten, which the UI uses to
 * tell the user how much of the animation a swatch controls.
 */
export function applyColorMap(
  json: LottieJson,
  refs: ColorRef[],
  colorMap: Record<string, string>
): number {
  let patched = 0;

  for (const ref of refs) {
    const target = colorMap[ref.hex];
    if (!target || target.toLowerCase() === ref.hex) continue;
    const rgb = hexToRgb(target);
    if (!rgb) continue;

    if (ref.mode === 'solidHex') {
      const layer = resolve(json, ref.path);
      if (layer) {
        layer.sc = target.toLowerCase();
        patched++;
      }
      continue;
    }

    if (ref.mode === 'gradientStop') {
      const table = resolve(json, ref.path);
      const base = (ref.stopIndex ?? 0) * 4;
      if (Array.isArray(table) && base + 3 < table.length) {
        table[base + 1] = rgb[0];
        table[base + 2] = rgb[1];
        table[base + 3] = rgb[2];
        patched++;
      }
      continue;
    }

    // rgbArray
    const arr = resolve(json, ref.path);
    if (Array.isArray(arr) && arr.length >= 3) {
      arr[0] = rgb[0];
      arr[1] = rgb[1];
      arr[2] = rgb[2];
      patched++;
    }
  }

  return patched;
}

/** Hides or shows top-level layers in place, used by the layer tree. */
export function applyHiddenLayers(json: LottieJson, hidden: number[]): void {
  if (!Array.isArray(json.layers)) return;
  const hiddenSet = new Set(hidden);
  for (let i = 0; i < json.layers.length; i++) {
    const layer = json.layers[i];
    if (!layer || typeof layer !== 'object') continue;
    if (hiddenSet.has(i)) layer.hd = true;
    else if (layer.hd) delete layer.hd;
  }
}

// ---------------------------------------------------------------------------
// Layer tree
// ---------------------------------------------------------------------------

function subtreeHas(node: any, predicate: (n: any) => boolean, depth = 0): boolean {
  if (!node || typeof node !== 'object' || depth > 12) return false;
  if (Array.isArray(node)) return node.some(child => subtreeHas(child, predicate, depth + 1));
  if (predicate(node)) return true;
  for (const key of ['it', 'shapes', 'ef', 'v', 'ks', 'o', 'p', 's', 'r', 'a']) {
    if (node[key] !== undefined && subtreeHas(node[key], predicate, depth + 1)) return true;
  }
  return false;
}

export function describeLayers(json: LottieJson): LayerInfo[] {
  if (!json || !Array.isArray(json.layers)) return [];
  return json.layers.map((layer: any, index: number) => ({
    index,
    name: layer?.nm || `Layer ${index + 1}`,
    type: typeof layer?.ty === 'number' ? layer.ty : -1,
    typeLabel: layerTypeLabel(layer?.ty),
    hidden: layer?.hd === true,
    ip: typeof layer?.ip === 'number' ? layer.ip : 0,
    op: typeof layer?.op === 'number' ? layer.op : 0,
    hasMatte: layer?.tt !== undefined,
    hasEffects: Array.isArray(layer?.ef) && layer.ef.length > 0,
    hasExpressions: subtreeHas(layer, n => typeof n.x === 'string' && n.x.length > 0),
  }));
}

/** Total layer count including precomp contents. */
export function countLayers(json: LottieJson): number {
  if (!json || typeof json !== 'object') return 0;
  let count = Array.isArray(json.layers) ? json.layers.length : 0;
  if (Array.isArray(json.assets)) {
    for (const asset of json.assets) {
      if (Array.isArray(asset?.layers)) count += asset.layers.length;
    }
  }
  return count;
}
