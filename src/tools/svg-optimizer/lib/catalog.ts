// ============================================================================
// The plugin catalogue.
// ----------------------------------------------------------------------------
// svgo ships 54 builtin plugins. A dozen of them take required parameters and
// are meaningless without them (`addAttributesToSVGElement`,
// `removeAttributesBySelector`, `prefixIds` in its parameterised form), and a
// few only make sense in a build pipeline. What is left is the set below: the
// plugins a person optimising one file actually reaches for.
//
// Labels are translated; the `id` is not, on purpose. `convertPathData` is what
// you type into svgo's docs and into an svgo.config.js, so localising it would
// cost the user the ability to look it up.
// ============================================================================

import type { PluginSpec, ProfileId, OptimizerSettings } from './types';

export const PLUGINS: PluginSpec[] = [
  // -- Cleanup: nothing here changes a single rendered pixel ---------------
  { id: 'removeDoctype', group: 'cleanup', risk: 'safe' },
  { id: 'removeXMLProcInst', group: 'cleanup', risk: 'safe' },
  { id: 'removeComments', group: 'cleanup', risk: 'safe' },
  { id: 'removeMetadata', group: 'cleanup', risk: 'safe' },
  { id: 'removeEditorsNSData', group: 'cleanup', risk: 'safe' },
  { id: 'removeEmptyAttrs', group: 'cleanup', risk: 'safe' },
  { id: 'removeEmptyText', group: 'cleanup', risk: 'safe' },
  { id: 'removeDeprecatedAttrs', group: 'cleanup', risk: 'safe' },
  { id: 'cleanupAttrs', group: 'cleanup', risk: 'safe' },
  // Screen readers announce these. Off unless the user opts in.
  { id: 'removeDesc', group: 'cleanup', risk: 'risky' },
  { id: 'removeTitle', group: 'cleanup', risk: 'risky' },

  // -- Styles ---------------------------------------------------------------
  { id: 'mergeStyles', group: 'styles', risk: 'safe' },
  { id: 'inlineStyles', group: 'styles', risk: 'careful' },
  { id: 'minifyStyles', group: 'styles', risk: 'safe' },
  { id: 'convertStyleToAttrs', group: 'styles', risk: 'careful' },
  { id: 'convertColors', group: 'styles', risk: 'safe' },
  { id: 'removeUnknownsAndDefaults', group: 'styles', risk: 'careful' },
  { id: 'removeUselessStrokeAndFill', group: 'styles', risk: 'careful' },
  { id: 'removeNonInheritableGroupAttrs', group: 'styles', risk: 'safe' },

  // -- Geometry: where the bytes are ---------------------------------------
  { id: 'convertPathData', group: 'geometry', risk: 'careful' },
  { id: 'convertTransform', group: 'geometry', risk: 'careful' },
  { id: 'convertShapeToPath', group: 'geometry', risk: 'careful' },
  { id: 'convertEllipseToCircle', group: 'geometry', risk: 'safe' },
  { id: 'mergePaths', group: 'geometry', risk: 'careful' },
  { id: 'cleanupNumericValues', group: 'geometry', risk: 'careful' },
  { id: 'cleanupListOfValues', group: 'geometry', risk: 'careful' },
  { id: 'moveElemsAttrsToGroup', group: 'geometry', risk: 'careful' },
  { id: 'moveGroupAttrsToElems', group: 'geometry', risk: 'careful' },
  // Drops geometry outside the viewBox. Wrong whenever the SVG is animated or
  // scripted into view later, hence risky.
  { id: 'removeOffCanvasPaths', group: 'geometry', risk: 'risky' },

  // -- Structure ------------------------------------------------------------
  { id: 'collapseGroups', group: 'structure', risk: 'careful' },
  { id: 'cleanupIds', group: 'structure', risk: 'careful' },
  { id: 'removeUselessDefs', group: 'structure', risk: 'safe' },
  { id: 'removeEmptyContainers', group: 'structure', risk: 'safe' },
  { id: 'removeHiddenElems', group: 'structure', risk: 'careful' },
  { id: 'removeUnusedNS', group: 'structure', risk: 'safe' },
  { id: 'convertOneStopGradients', group: 'structure', risk: 'safe' },
  { id: 'reusePaths', group: 'structure', risk: 'risky' },
  // On by default and hard to argue with: a script inside an icon is either a
  // mistake or an attack.
  { id: 'removeScripts', group: 'structure', risk: 'safe' },
  { id: 'removeRasterImages', group: 'structure', risk: 'risky' },
  { id: 'removeStyleElement', group: 'structure', risk: 'risky' },

  // -- Output shape ---------------------------------------------------------
  { id: 'sortAttrs', group: 'output', risk: 'safe' },
  { id: 'sortDefsChildren', group: 'output', risk: 'safe' },
  { id: 'removeXlink', group: 'output', risk: 'careful' },
  // Strips width/height so the SVG scales to its container. Wanted often
  // enough to be a headline feature, wrong often enough to stay off.
  { id: 'removeDimensions', group: 'output', risk: 'risky' },
  // Removing viewBox freezes the SVG at one size. Almost always a mistake.
  { id: 'removeViewBox', group: 'output', risk: 'risky' },
];

export const PLUGIN_IDS = PLUGINS.map(p => p.id);

const byId = new Map(PLUGINS.map(p => [p.id, p]));
export const getPlugin = (id: string) => byId.get(id);

/**
 * svgo's own preset-default, verbatim. Used as the "balanced" profile so the
 * tool's default output matches what `npx svgo` gives you — a result people can
 * reproduce in their build.
 */
const PRESET_DEFAULT = new Set([
  'removeDoctype', 'removeXMLProcInst', 'removeComments', 'removeDeprecatedAttrs',
  'removeMetadata', 'removeEditorsNSData', 'cleanupAttrs', 'mergeStyles',
  'inlineStyles', 'minifyStyles', 'cleanupIds', 'removeUselessDefs',
  'cleanupNumericValues', 'convertColors', 'removeUnknownsAndDefaults',
  'removeNonInheritableGroupAttrs', 'removeUselessStrokeAndFill',
  'removeHiddenElems', 'removeEmptyText', 'convertShapeToPath',
  'convertEllipseToCircle', 'moveElemsAttrsToGroup', 'moveGroupAttrsToElems',
  'collapseGroups', 'convertPathData', 'convertTransform', 'removeEmptyAttrs',
  'removeEmptyContainers', 'mergePaths', 'removeUnusedNS', 'sortAttrs',
  'sortDefsChildren', 'removeDesc',
]);

/** Everything that cannot change a rendered pixel. */
const SAFE_ONLY = new Set(
  PLUGINS.filter(p => p.risk === 'safe' && p.id !== 'removeRasterImages').map(p => p.id)
);

function profileSet(profile: Exclude<ProfileId, 'manual'>): Set<string> {
  if (profile === 'safe') return new Set([...SAFE_ONLY, 'removeScripts']);
  if (profile === 'balanced') return new Set([...PRESET_DEFAULT, 'removeScripts']);
  // max: everything except the four that change behaviour rather than bytes.
  return new Set(
    PLUGINS.map(p => p.id).filter(
      id => !['removeViewBox', 'removeDimensions', 'removeRasterImages', 'removeStyleElement', 'removeTitle'].includes(id)
    )
  );
}

export function settingsForProfile(profile: Exclude<ProfileId, 'manual'>): OptimizerSettings {
  const on = profileSet(profile);
  const enabled: Record<string, boolean> = {};
  for (const p of PLUGINS) enabled[p.id] = on.has(p.id);

  return {
    enabled,
    floatPrecision: profile === 'max' ? 2 : 3,
    transformPrecision: profile === 'max' ? 3 : 5,
    multipass: profile !== 'safe',
    prettify: false,
  };
}

export const DEFAULT_SETTINGS = settingsForProfile('balanced');

/** Which named profile a settings object corresponds to, or 'manual'. */
export function detectProfile(settings: OptimizerSettings): ProfileId {
  for (const profile of ['safe', 'balanced', 'max'] as const) {
    const reference = settingsForProfile(profile);
    if (
      reference.floatPrecision === settings.floatPrecision &&
      reference.transformPrecision === settings.transformPrecision &&
      reference.multipass === settings.multipass &&
      PLUGIN_IDS.every(id => !!reference.enabled[id] === !!settings.enabled[id])
    ) {
      return profile;
    }
  }
  return 'manual';
}

export const GROUP_ORDER = ['cleanup', 'styles', 'geometry', 'structure', 'output'] as const;
