// ============================================================================
// CSS → Design. The manual route: paste a rule you already have (from a
// codebase, from DevTools, from a competitor's site) and get editable controls
// back, instead of rebuilding it slider by slider.
// ============================================================================

import type {
  Design,
  FilterState,
  GradientState,
  GradientStop,
  ParseResult,
  RadiusState,
  ShadowLayer,
  TabId,
} from '../types';
import { nextId } from './defaults';
import { parseColor, toHex } from './color';

// ---------------------------------------------------------------------------
// Tokenising helpers — all of them respect nesting, because every interesting
// value in CSS contains `rgba(…)` or a gradient with its own comma list.
// ---------------------------------------------------------------------------

function splitTopLevel(input: string, separators: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of input) {
    if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    if (depth === 0 && separators.includes(ch)) {
      if (current.trim()) out.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

const LENGTH = /^-?[\d.]+(px|rem|em|%|vh|vw|pt)?$/;
const isLength = (token: string) => LENGTH.test(token);
const toPx = (token: string): number => {
  const v = parseFloat(token);
  if (Number.isNaN(v)) return 0;
  if (token.endsWith('rem') || token.endsWith('em')) return v * 16;
  return v;
};

// ---------------------------------------------------------------------------
// box-shadow
// ---------------------------------------------------------------------------

export function parseShadowLayers(value: string): ShadowLayer[] | null {
  if (/^none$/i.test(value.trim())) return [];
  const layers: ShadowLayer[] = [];

  for (const chunk of splitTopLevel(value, ',')) {
    const tokens = splitTopLevel(chunk, ' \t\n');
    let inset = false;
    const lengths: number[] = [];
    let color = '#000000';
    let opacity = 1;
    let sawColor = false;

    for (const token of tokens) {
      if (/^inset$/i.test(token)) {
        inset = true;
        continue;
      }
      if (isLength(token)) {
        lengths.push(toPx(token));
        continue;
      }
      const parsed = parseColor(token);
      if (parsed) {
        color = toHex(parsed);
        opacity = parsed.a;
        sawColor = true;
      }
    }

    if (lengths.length < 2 && !sawColor) continue;
    layers.push({
      id: nextId('s'),
      enabled: true,
      inset,
      x: lengths[0] ?? 0,
      y: lengths[1] ?? 0,
      blur: lengths[2] ?? 0,
      spread: lengths[3] ?? 0,
      color,
      opacity,
    });
  }

  return layers.length ? layers : null;
}

// ---------------------------------------------------------------------------
// gradients
// ---------------------------------------------------------------------------

const SIDE_ANGLE: Record<string, number> = {
  'to top': 0,
  'to right': 90,
  'to bottom': 180,
  'to left': 270,
  'to top right': 45,
  'to right top': 45,
  'to bottom right': 135,
  'to right bottom': 135,
  'to bottom left': 225,
  'to left bottom': 225,
  'to top left': 315,
  'to left top': 315,
};

export function parseGradient(value: string): Partial<GradientState> | null {
  const match = value
    .trim()
    .match(/^(repeating-)?(linear|radial|conic)-gradient\s*\(([\s\S]*)\)\s*$/i);
  if (!match) return null;

  const out: Partial<GradientState> = {
    repeating: !!match[1],
    kind: match[2].toLowerCase() as GradientState['kind'],
  };

  const args = splitTopLevel(match[3], ',');
  if (!args.length) return null;

  // The first argument is configuration only when it cannot be read as a
  // colour stop — otherwise `linear-gradient(red, blue)` would lose its red.
  const first = args[0];
  const looksLikeConfig =
    /(^|\s)(to\s|from\s|circle|ellipse|at\s|closest-|farthest-|in\s+(oklab|oklch|hsl|srgb))/i.test(first) ||
    /-?[\d.]+(deg|rad|turn|grad)/i.test(first);

  if (looksLikeConfig) {
    args.shift();
    const config = first.toLowerCase();

    const interp = config.match(/\bin\s+(oklab|oklch|srgb-linear|srgb|hsl)\b/);
    if (interp) out.interpolation = interp[1] as GradientState['interpolation'];

    const deg = config.match(/(-?[\d.]+)deg/);
    const turn = config.match(/(-?[\d.]+)turn/);
    if (deg) out.angle = ((parseFloat(deg[1]) % 360) + 360) % 360;
    else if (turn) out.angle = ((parseFloat(turn[1]) * 360) % 360 + 360) % 360;
    else {
      // Longest first: `to bottom right` also contains `to right`, and the
      // short key would win and give 90° instead of 135°.
      const side = Object.keys(SIDE_ANGLE)
        .sort((a, b) => b.length - a.length)
        .find(k => config.includes(k));
      if (side) out.angle = SIDE_ANGLE[side];
    }

    if (/\bellipse\b/.test(config)) out.shape = 'ellipse';
    else if (/\bcircle\b/.test(config)) out.shape = 'circle';

    const size = config.match(/\b(closest|farthest)-(side|corner)\b/);
    if (size) out.size = size[0] as GradientState['size'];

    const at = config.match(/\bat\s+([\d.]+)%\s+([\d.]+)%/);
    if (at) {
      out.posX = parseFloat(at[1]);
      out.posY = parseFloat(at[2]);
    } else if (/\bat\s+center\b/.test(config)) {
      out.posX = 50;
      out.posY = 50;
    }
  }

  const stops: GradientStop[] = [];
  args.forEach((arg, index) => {
    // `#fff 20%` / `rgba(0,0,0,.5) 100%` / `oklch(70% .2 30)` / bare colour.
    const tokens = splitTopLevel(arg, ' \t\n');
    const positions: number[] = [];
    const colorTokens: string[] = [];
    for (const token of tokens) {
      if (/^-?[\d.]+%$/.test(token)) positions.push(parseFloat(token));
      else colorTokens.push(token);
    }
    const parsed = parseColor(colorTokens.join(' '));
    if (!parsed) return;
    stops.push({
      id: nextId('g'),
      color: toHex(parsed),
      opacity: parsed.a,
      position: positions[0] ?? (args.length === 1 ? 0 : (index / (args.length - 1)) * 100),
    });
  });

  if (stops.length < 2) return null;
  out.stops = stops;
  return out;
}

// ---------------------------------------------------------------------------
// border-radius
// ---------------------------------------------------------------------------

export function parseRadius(value: string): Partial<RadiusState> | null {
  const raw = value.trim();
  if (!raw) return null;

  // Two-axis syntax (`… / …`) is always an organic shape as far as the UI goes.
  if (raw.includes('/')) return { organic: true, organicValue: raw };

  const tokens = splitTopLevel(raw, ' \t\n');
  if (!tokens.length || !tokens.every(isLength)) return null;
  if (tokens.length > 4) return { organic: true, organicValue: raw };

  const unit: RadiusState['unit'] = tokens[0].endsWith('%') ? '%' : 'px';
  const n = tokens.map(t => parseFloat(t));
  const [tl, tr = n[0], br = n[0], bl = n[1] ?? n[0]] = n;
  return {
    organic: false,
    unit,
    tl,
    tr,
    br,
    bl,
    linked: new Set([tl, tr, br, bl]).size === 1,
  };
}

// ---------------------------------------------------------------------------
// filter / backdrop-filter
// ---------------------------------------------------------------------------

/** Splits `blur(4px) drop-shadow(0 2px 4px rgba(0,0,0,.5))` into its calls. */
function splitFunctions(value: string): { name: string; args: string }[] {
  const out: { name: string; args: string }[] = [];
  const re = /([a-z-]+)\s*\(/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(value))) {
    let depth = 1;
    let i = re.lastIndex;
    while (i < value.length && depth > 0) {
      if (value[i] === '(') depth++;
      else if (value[i] === ')') depth--;
      i++;
    }
    out.push({ name: match[1].toLowerCase(), args: value.slice(re.lastIndex, i - 1).trim() });
    re.lastIndex = i;
  }
  return out;
}

/** `0.8` and `80%` both mean the same thing to a filter function. */
const asPercent = (arg: string, fallback: number): number => {
  const v = parseFloat(arg);
  if (Number.isNaN(v)) return fallback;
  return arg.trim().endsWith('%') ? v : v * 100;
};

export function parseFilter(value: string, backdrop: boolean): Partial<FilterState> | null {
  const calls = splitFunctions(value);
  if (!calls.length) return /^none$/i.test(value.trim()) ? { backdrop } : null;

  const out: Partial<FilterState> = {
    backdrop,
    blur: 0,
    brightness: 100,
    contrast: 100,
    saturate: 100,
    hueRotate: 0,
    grayscale: 0,
    sepia: 0,
    invert: 0,
    opacity: 100,
    dropShadowOn: false,
  };

  for (const call of calls) {
    switch (call.name) {
      case 'blur':
        out.blur = toPx(call.args);
        break;
      case 'brightness':
        out.brightness = asPercent(call.args, 100);
        break;
      case 'contrast':
        out.contrast = asPercent(call.args, 100);
        break;
      case 'saturate':
        out.saturate = asPercent(call.args, 100);
        break;
      case 'hue-rotate':
        out.hueRotate = parseFloat(call.args) || 0;
        break;
      case 'grayscale':
        out.grayscale = asPercent(call.args, 0);
        break;
      case 'sepia':
        out.sepia = asPercent(call.args, 0);
        break;
      case 'invert':
        out.invert = asPercent(call.args, 0);
        break;
      case 'opacity':
        out.opacity = asPercent(call.args, 100);
        break;
      case 'drop-shadow': {
        const tokens = splitTopLevel(call.args, ' \t\n');
        const lengths = tokens.filter(isLength).map(toPx);
        const color = tokens.map(parseColor).find(Boolean);
        out.dropShadowOn = true;
        out.dropShadowX = lengths[0] ?? 0;
        out.dropShadowY = lengths[1] ?? 0;
        out.dropShadowBlur = lengths[2] ?? 0;
        if (color) out.dropShadowColor = toHex(color);
        break;
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/**
 * Takes anything from a bare value (`0 4px 8px #000`) to a full rule block and
 * works out which panel it belongs to. Unknown declarations are ignored rather
 * than treated as an error: pasting a whole class and picking up the two
 * properties we can edit is the useful behaviour.
 */
export function parseCss(input: string): ParseResult {
  const empty: ParseResult = { tab: null, patch: {}, applied: [] };
  let text = input.replace(/\/\*[\s\S]*?\*\//g, '').trim();
  if (!text) return empty;

  // Unwrap `selector { … }`.
  const block = text.match(/\{([\s\S]*)\}/);
  if (block) text = block[1].trim();

  const declarations: { prop: string; value: string }[] = [];
  for (const chunk of splitTopLevel(text, ';')) {
    const colon = chunk.indexOf(':');
    if (colon === -1) {
      // A bare value: infer the property from its shape.
      const v = chunk.trim();
      if (/^(repeating-)?(linear|radial|conic)-gradient\s*\(/i.test(v)) declarations.push({ prop: 'background-image', value: v });
      else if (/^[a-z-]+\s*\(/i.test(v) && /(blur|brightness|contrast|saturate|hue-rotate|grayscale|sepia|invert|drop-shadow)\s*\(/i.test(v))
        declarations.push({ prop: 'filter', value: v });
      else if (v) declarations.push({ prop: 'box-shadow', value: v });
      continue;
    }
    declarations.push({ prop: chunk.slice(0, colon).trim().toLowerCase(), value: chunk.slice(colon + 1).trim() });
  }

  const patch: Partial<Design> = {};
  const applied: string[] = [];
  let tab: TabId | null = null;

  for (const { prop, value } of declarations) {
    if (prop === 'box-shadow' || prop === '-webkit-box-shadow') {
      const layers = parseShadowLayers(value);
      if (layers && layers.length) {
        patch.shadow = { layers, cardBg: '#1e1b4b', radius: 24 };
        applied.push('box-shadow');
        tab = tab ?? 'shadow';
      }
    } else if (prop === 'background' || prop === 'background-image') {
      const gradient = parseGradient(value);
      if (gradient) {
        patch.gradient = { ...(patch.gradient as GradientState), ...gradient } as GradientState;
        applied.push('background-image');
        tab = 'gradient';
      }
    } else if (prop === 'border-radius') {
      const radius = parseRadius(value);
      if (radius) {
        patch.radius = radius as RadiusState;
        applied.push('border-radius');
        tab = tab ?? 'radius';
      }
    } else if (prop === 'filter' || prop === 'backdrop-filter' || prop === '-webkit-backdrop-filter') {
      const filter = parseFilter(value, prop !== 'filter');
      if (filter) {
        patch.filter = filter as FilterState;
        applied.push(prop);
        tab = tab ?? 'filter';
      }
    }
  }

  return { tab, patch, applied };
}
