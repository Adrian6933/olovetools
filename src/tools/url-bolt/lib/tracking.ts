// ============================================================================
// Tracking-parameter catalogue
// ----------------------------------------------------------------------------
// The single most useful thing a URL tool can do to a real-world link is make
// it short and anonymous again. Grouped by origin so the UI can explain what it
// is about to delete instead of just eating parameters.
// ============================================================================

export type TrackerGroup = 'campaign' | 'ads' | 'social' | 'email' | 'analytics' | 'misc';

interface TrackerRule {
  group: TrackerGroup;
  /** Exact key match (case-insensitive). */
  keys?: string[];
  /** Prefix match, for the open-ended families. */
  prefixes?: string[];
}

const RULES: TrackerRule[] = [
  {
    group: 'campaign',
    // UTM is an open family: utm_source, utm_id, utm_content, utm_term,
    // utm_source_platform, utm_creative_format… a prefix is the only sane rule.
    prefixes: ['utm_'],
  },
  {
    group: 'ads',
    keys: [
      'gclid', 'gclsrc', 'gbraid', 'wbraid', 'dclid', 'gad_source', 'gadid',
      'msclkid', 'ttclid', 'twclid', 'rdt_cid', 'li_fat_id', 'epik', 'sccid',
      'yclid', 'ysclid', 'fb_action_ids', 'fb_action_types', 'fb_source',
      'ad_id', 'adset_id', 'campaign_id', 'creative_id', 'placement',
    ],
  },
  {
    group: 'social',
    keys: [
      'fbclid', 'igshid', 'igsh', 'mibextid', 'share_id', 'si',
      'ref_src', 'ref_url', 's', 'cxt', 'sfnsn', 'story_fbid',
    ],
  },
  {
    group: 'email',
    keys: [
      'mc_cid', 'mc_eid', 'mkt_tok', 'trk', 'trkCampaign', 'vero_id', 'vero_conv',
      '_hsenc', '_hsmi', 'hsCtaTracking', 'oly_anon_id', 'oly_enc_id', 'elqTrackId',
    ],
    prefixes: ['pk_', 'piwik_'],
  },
  {
    group: 'analytics',
    keys: [
      '_ga', '_gl', '_gac', 'ga_source', 'ga_medium', 'ga_campaign',
      'wickedid', 'otc', 'ceneo_spo', 'srsltid',
    ],
    prefixes: ['matomo_', 'hsa_'],
  },
  {
    group: 'misc',
    keys: ['ref', 'referrer', 'source', 'spm', 'scm', 'from', 'share_source'],
  },
];

/**
 * `s` and `ref` are legitimate application parameters as often as they are
 * trackers, so they are opt-in: the aggressive pass removes them, the default
 * pass does not.
 */
const AGGRESSIVE_ONLY = new Set(['s', 'ref', 'referrer', 'source', 'from', 'si', 'placement']);

export interface TrackerMatch {
  group: TrackerGroup;
  /** True when the key is only removed by the aggressive pass. */
  aggressive: boolean;
}

/** Identifies a query key as a tracker, or returns null when it looks genuine. */
export function classify(key: string): TrackerMatch | null {
  const lower = key.toLowerCase();
  for (const rule of RULES) {
    const exact = rule.keys?.some(k => k.toLowerCase() === lower);
    const prefixed = rule.prefixes?.some(p => lower.startsWith(p));
    if (exact || prefixed) {
      return { group: rule.group, aggressive: AGGRESSIVE_ONLY.has(lower) };
    }
  }
  return null;
}

/** How many distinct keys the catalogue knows about, for the UI copy. */
export const TRACKER_COUNT = RULES.reduce(
  (total, rule) => total + (rule.keys?.length ?? 0) + (rule.prefixes?.length ?? 0),
  0
);
