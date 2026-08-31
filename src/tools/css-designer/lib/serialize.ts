// ============================================================================
// Design → CSS text. One set of builders feeds the live preview, the code
// panel (CSS / Tailwind / SCSS / custom properties) and the PNG exporter, so
// what you copy is provably what you saw.
// ============================================================================

import type {
  ColorSpace,
  CodeFormat,
  Design,
  FilterState,
  GlassState,
  GradientState,
  RadiusState,
  ShadowState,
  TabId,
} from '../types';
import { withAlpha } from './color';

export interface Declaration {
  prop: string;
  value: string;
}

const num = (v: number) => (Number.isInteger(v) ? String(v) : String(Math.round(v * 1000) / 1000));

// ---------------------------------------------------------------------------
// Individual values
// ---------------------------------------------------------------------------

export function shadowValue(shadow: ShadowState, space: ColorSpace, compact = false): string {
  const active = shadow.layers.filter(l => l.enabled);
  if (active.length === 0) return 'none';
  return active
    .map(l => {
      const color = withAlpha(l.color, l.opacity, space, compact);
      const body = `${num(l.x)}px ${num(l.y)}px ${num(l.blur)}px ${num(l.spread)}px ${color}`;
      return l.inset ? `inset ${body}` : body;
    })
    .join(', ');
}

export function gradientValue(g: GradientState, space: ColorSpace, compact = false): string {
  const sorted = [...g.stops].sort((a, b) => a.position - b.position);
  // In compact mode every separator is comma-tight, so the Tailwind arbitrary
  // value comes out as `…,#8b5cf6_0%,…` instead of a string of `,_` pairs.
  const sep = compact ? ',' : ', ';
  const stopList = sorted
    .map(s => `${withAlpha(s.color, s.opacity, space, compact)} ${num(s.position)}%`)
    .join(sep);

  // `in <space>` is omitted for sRGB: it is the default, and printing it only
  // makes the copied rule longer.
  const interp = g.interpolation === 'srgb' ? '' : ` in ${g.interpolation}`;
  const prefix = g.repeating ? 'repeating-' : '';
  const at = `at ${num(g.posX)}% ${num(g.posY)}%`;

  if (g.kind === 'linear') {
    return `${prefix}linear-gradient(${num(g.angle)}deg${interp}${sep}${stopList})`;
  }
  if (g.kind === 'radial') {
    return `${prefix}radial-gradient(${g.shape} ${g.size} ${at}${interp}${sep}${stopList})`;
  }
  return `${prefix}conic-gradient(from ${num(g.angle)}deg ${at}${interp}${sep}${stopList})`;
}

export function radiusValue(r: RadiusState): string {
  if (r.organic) return r.organicValue.trim() || '0';
  const u = r.unit;
  if (r.linked) return `${num(r.tl)}${u}`;
  return `${num(r.tl)}${u} ${num(r.tr)}${u} ${num(r.br)}${u} ${num(r.bl)}${u}`;
}

export function filterValue(f: FilterState, space: ColorSpace, compact = false): string {
  const parts: string[] = [];
  if (f.blur > 0) parts.push(`blur(${num(f.blur)}px)`);
  if (f.brightness !== 100) parts.push(`brightness(${num(f.brightness / 100)})`);
  if (f.contrast !== 100) parts.push(`contrast(${num(f.contrast / 100)})`);
  if (f.saturate !== 100) parts.push(`saturate(${num(f.saturate / 100)})`);
  if (f.hueRotate !== 0) parts.push(`hue-rotate(${num(f.hueRotate)}deg)`);
  if (f.grayscale > 0) parts.push(`grayscale(${num(f.grayscale / 100)})`);
  if (f.sepia > 0) parts.push(`sepia(${num(f.sepia / 100)})`);
  if (f.invert > 0) parts.push(`invert(${num(f.invert / 100)})`);
  if (f.opacity !== 100) parts.push(`opacity(${num(f.opacity / 100)})`);
  if (f.dropShadowOn) {
    const c = withAlpha(f.dropShadowColor, 1, space, compact);
    parts.push(`drop-shadow(${num(f.dropShadowX)}px ${num(f.dropShadowY)}px ${num(f.dropShadowBlur)}px ${c})`);
  }
  return parts.length ? parts.join(' ') : 'none';
}

export function glassBackdropValue(g: GlassState): string {
  const parts = [`blur(${num(g.blur)}px)`, `saturate(${num(g.saturation)}%)`];
  if (g.brightness !== 100) parts.push(`brightness(${num(g.brightness)}%)`);
  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Declaration blocks per tab
// ---------------------------------------------------------------------------

export function declarationsFor(
  tab: TabId,
  design: Design,
  space: ColorSpace,
  compact = false
): Declaration[] {
  switch (tab) {
    case 'glass': {
      const g = design.glass;
      const decls: Declaration[] = [
        { prop: 'background', value: withAlpha(g.bgColor, g.opacity, space, compact) },
        { prop: 'backdrop-filter', value: glassBackdropValue(g) },
        { prop: '-webkit-backdrop-filter', value: glassBackdropValue(g) },
        { prop: 'border-radius', value: `${num(g.radius)}px` },
      ];
      if (g.borderWidth > 0) {
        decls.splice(3, 0, {
          prop: 'border',
          value: `${num(g.borderWidth)}px solid ${withAlpha(g.borderColor, g.borderOpacity, space, compact)}`,
        });
      }
      const shadows: string[] = [];
      if (g.shadowStrength > 0) {
        shadows.push(`0 8px 32px 0 ${withAlpha('#000000', g.shadowStrength * 0.6, space, compact)}`);
      }
      if (g.innerHighlight) {
        shadows.push(`inset 0 1px 0 0 ${withAlpha('#ffffff', 0.22, space, compact)}`);
      }
      if (shadows.length) decls.push({ prop: 'box-shadow', value: shadows.join(', ') });
      return decls;
    }
    case 'shadow':
      return [{ prop: 'box-shadow', value: shadowValue(design.shadow, space, compact) }];
    case 'gradient':
      return [{ prop: 'background-image', value: gradientValue(design.gradient, space, compact) }];
    case 'radius':
      return [{ prop: 'border-radius', value: radiusValue(design.radius) }];
    case 'filter': {
      const value = filterValue(design.filter, space, compact);
      return design.filter.backdrop
        ? [
            { prop: 'backdrop-filter', value },
            { prop: '-webkit-backdrop-filter', value },
          ]
        : [{ prop: 'filter', value }];
    }
  }
}

const CLASS_NAME: Record<TabId, string> = {
  glass: 'glass-card',
  shadow: 'elevated-card',
  gradient: 'gradient-surface',
  radius: 'rounded-shape',
  filter: 'filtered-media',
};

const VAR_NAME: Record<string, string> = {
  background: '--surface-bg',
  'background-image': '--surface-gradient',
  'backdrop-filter': '--surface-backdrop',
  '-webkit-backdrop-filter': '--surface-backdrop',
  border: '--surface-border',
  'border-radius': '--surface-radius',
  'box-shadow': '--surface-shadow',
  filter: '--surface-filter',
};

// ---------------------------------------------------------------------------
// Tailwind
// ---------------------------------------------------------------------------

/**
 * Tailwind arbitrary values cannot contain spaces — the class name would break
 * at the first one. Underscores are the documented escape, so structural
 * spaces become `_` while colours are already printed comma-tight.
 */
export const twEscape = (value: string): string => value.trim().replace(/\s+/g, '_');

function tailwindClasses(tab: TabId, design: Design, space: ColorSpace): string[] {
  const c = (v: string) => twEscape(v);
  switch (tab) {
    case 'glass': {
      const g = design.glass;
      const out = [
        `bg-[${c(withAlpha(g.bgColor, g.opacity, space, true))}]`,
        `backdrop-blur-[${num(g.blur)}px]`,
        `backdrop-saturate-[${num(g.saturation / 100)}]`,
      ];
      if (g.brightness !== 100) out.push(`backdrop-brightness-[${num(g.brightness / 100)}]`);
      if (g.borderWidth > 0) {
        out.push(`border-[${num(g.borderWidth)}px]`, `border-[${c(withAlpha(g.borderColor, g.borderOpacity, space, true))}]`);
      }
      out.push(`rounded-[${num(g.radius)}px]`);
      const shadows: string[] = [];
      if (g.shadowStrength > 0) shadows.push(`0_8px_32px_0_${c(withAlpha('#000000', g.shadowStrength * 0.6, space, true))}`);
      if (g.innerHighlight) shadows.push(`inset_0_1px_0_0_${c(withAlpha('#ffffff', 0.22, space, true))}`);
      if (shadows.length) out.push(`shadow-[${shadows.join(',')}]`);
      return out;
    }
    case 'shadow': {
      const v = shadowValue(design.shadow, space, true);
      if (v === 'none') return ['shadow-none'];
      // Each comma-separated layer is escaped on its own so the join stays a
      // plain comma, exactly like a hand-written arbitrary shadow.
      return [`shadow-[${v.split(/,\s*(?![^(]*\))/).map(c).join(',')}]`];
    }
    case 'gradient':
      return [`bg-[${c(gradientValue(design.gradient, space, true))}]`];
    case 'radius': {
      const r = design.radius;
      if (!r.organic && r.linked) return [`rounded-[${num(r.tl)}${r.unit}]`];
      return [`rounded-[${c(radiusValue(r))}]`];
    }
    case 'filter': {
      const f = design.filter;
      const p = f.backdrop ? 'backdrop-' : '';
      const out: string[] = [];
      if (f.blur > 0) out.push(`${p}blur-[${num(f.blur)}px]`);
      if (f.brightness !== 100) out.push(`${p}brightness-[${num(f.brightness / 100)}]`);
      if (f.contrast !== 100) out.push(`${p}contrast-[${num(f.contrast / 100)}]`);
      if (f.saturate !== 100) out.push(`${p}saturate-[${num(f.saturate / 100)}]`);
      if (f.hueRotate !== 0) out.push(`${p}hue-rotate-[${num(f.hueRotate)}deg]`);
      if (f.grayscale > 0) out.push(`${p}grayscale-[${num(f.grayscale / 100)}]`);
      if (f.sepia > 0) out.push(`${p}sepia-[${num(f.sepia / 100)}]`);
      if (f.invert > 0) out.push(`${p}invert-[${num(f.invert / 100)}]`);
      if (f.opacity !== 100) out.push(`${p}opacity-[${num(f.opacity / 100)}]`);
      if (f.dropShadowOn) {
        const shadow = `${num(f.dropShadowX)}px_${num(f.dropShadowY)}px_${num(f.dropShadowBlur)}px_${withAlpha(f.dropShadowColor, 1, space, true)}`;
        out.push(`drop-shadow-[${shadow}]`);
      }
      return out.length ? out : [`${p}filter-none`];
    }
  }
}

// ---------------------------------------------------------------------------
// Full code output
// ---------------------------------------------------------------------------

export function formatCode(
  format: CodeFormat,
  tab: TabId,
  design: Design,
  space: ColorSpace
): string {
  if (format === 'tailwind') return tailwindClasses(tab, design, space).join(' ');

  const decls = declarationsFor(tab, design, space, false);

  if (format === 'variables') {
    const seen = new Set<string>();
    const lines = decls
      .filter(d => {
        const name = VAR_NAME[d.prop];
        if (!name || seen.has(name)) return false;
        seen.add(name);
        return true;
      })
      .map(d => `  ${VAR_NAME[d.prop]}: ${d.value};`);
    const usage = decls
      .filter(d => VAR_NAME[d.prop])
      .map(d => `  ${d.prop}: var(${VAR_NAME[d.prop]});`);
    return `:root {\n${lines.join('\n')}\n}\n\n.${CLASS_NAME[tab]} {\n${usage.join('\n')}\n}`;
  }

  if (format === 'scss') {
    const vars = decls
      .filter((d, i, arr) => VAR_NAME[d.prop] && arr.findIndex(o => VAR_NAME[o.prop] === VAR_NAME[d.prop]) === i)
      .map(d => `$${VAR_NAME[d.prop].replace(/^--/, '')}: ${d.value};`);
    const body = decls.map(d => `  ${d.prop}: ${VAR_NAME[d.prop] ? `$${VAR_NAME[d.prop].replace(/^--/, '')}` : d.value};`);
    return `${vars.join('\n')}\n\n.${CLASS_NAME[tab]} {\n${body.join('\n')}\n}`;
  }

  return `.${CLASS_NAME[tab]} {\n${decls.map(d => `  ${d.prop}: ${d.value};`).join('\n')}\n}`;
}

// ---------------------------------------------------------------------------
// Inline styles for the live preview
// ---------------------------------------------------------------------------

export function previewStyle(tab: TabId, design: Design): React.CSSProperties {
  const decls = declarationsFor(tab, design, 'hex', false);
  const style: Record<string, string> = {};
  for (const d of decls) {
    // React wants camelCase, and the vendor prefix has to be `Webkit` with a
    // capital W — lowercase `webkit…` is rejected with a console warning.
    const key = d.prop
      .replace(/^-webkit-/, 'Webkit-')
      .replace(/-([a-z])/g, (_, ch: string) => ch.toUpperCase());
    style[key] = d.value;
  }
  return style as React.CSSProperties;
}

/**
 * Which CSS features the current design leans on, so the UI can warn about the
 * ones a given browser has not shipped. Checked with CSS.supports at runtime.
 */
export function requiredFeatures(tab: TabId, design: Design): { property: string; value: string }[] {
  const out: { property: string; value: string }[] = [];
  if (tab === 'glass' || (tab === 'filter' && design.filter.backdrop)) {
    out.push({ property: 'backdrop-filter', value: 'blur(4px)' });
  }
  if (tab === 'gradient') {
    if (design.gradient.kind === 'conic') {
      out.push({ property: 'background-image', value: 'conic-gradient(red, blue)' });
    }
    if (design.gradient.interpolation !== 'srgb') {
      out.push({
        property: 'background-image',
        value: `linear-gradient(in ${design.gradient.interpolation}, red, blue)`,
      });
    }
  }
  return out;
}
