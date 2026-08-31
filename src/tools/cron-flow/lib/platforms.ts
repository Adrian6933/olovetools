// ============================================================================
// Platform compatibility
// ----------------------------------------------------------------------------
// "Valid cron" is not a thing. An expression that Quartz accepts will be
// rejected by Vixie, GitHub Actions silently ignores the timezone you thought
// you set, and AWS numbers the weekdays differently from everyone else. The
// matrix below is the part of the tool that stops someone shipping a schedule
// that parses here and never fires there.
// ============================================================================

import type { Cron } from './cron';

export type PlatformId =
  | 'vixie'
  | 'k8s'
  | 'github'
  | 'quartz'
  | 'spring'
  | 'aws'
  | 'nodecron'
  | 'jenkins';

export type Level = 'ok' | 'warn' | 'error';

export interface Note {
  level: Level;
  /** Dictionary key, so the message is translated like everything else. */
  key: string;
  data?: Record<string, string | number>;
}

export interface PlatformReport {
  id: PlatformId;
  level: Level;
  notes: Note[];
}

export const PLATFORMS: PlatformId[] = [
  'vixie', 'k8s', 'github', 'quartz', 'spring', 'aws', 'nodecron', 'jenkins',
];

interface Rules {
  /** Field counts the platform parses. */
  counts: number[];
  quartzSpecials: boolean;
  questionMark: boolean;
  /** `?` is not merely allowed but required in one of the two day fields. */
  requiresQuestionMark?: boolean;
  macros: boolean;
  jenkinsHash: boolean;
  /** Runs in a fixed zone the user cannot change. */
  fixedZone?: string;
  /** Shortest interval the platform actually honours, in minutes. */
  minIntervalMinutes?: number;
}

const RULES: Record<PlatformId, Rules> = {
  vixie: { counts: [5], quartzSpecials: false, questionMark: false, macros: true, jenkinsHash: false },
  k8s: { counts: [5], quartzSpecials: false, questionMark: false, macros: true, jenkinsHash: false },
  github: {
    counts: [5], quartzSpecials: false, questionMark: false, macros: false, jenkinsHash: false,
    fixedZone: 'UTC', minIntervalMinutes: 5,
  },
  quartz: {
    counts: [6, 7], quartzSpecials: true, questionMark: true, requiresQuestionMark: true,
    macros: false, jenkinsHash: false,
  },
  spring: { counts: [6], quartzSpecials: true, questionMark: true, macros: true, jenkinsHash: false },
  aws: {
    counts: [6], quartzSpecials: true, questionMark: true, requiresQuestionMark: true,
    macros: false, jenkinsHash: false, minIntervalMinutes: 1,
  },
  nodecron: { counts: [5, 6], quartzSpecials: false, questionMark: false, macros: false, jenkinsHash: false },
  jenkins: { counts: [5], quartzSpecials: false, questionMark: false, macros: false, jenkinsHash: true },
};

const worst = (a: Level, b: Level): Level =>
  a === 'error' || b === 'error' ? 'error' : a === 'warn' || b === 'warn' ? 'warn' : 'ok';

/**
 * `evenIntervalMs` comes from frequency(); it is passed in rather than
 * recomputed so the report stays a pure function of things already on screen.
 */
export function checkPlatform(cron: Cron, id: PlatformId, evenIntervalMs: number): PlatformReport {
  const rules = RULES[id];
  const notes: Note[] = [];
  const fieldCount = cron.order.length;

  if (rules.counts.indexOf(fieldCount) === -1) {
    notes.push({
      level: 'error',
      key: 'plat_fieldCount',
      data: { got: fieldCount, want: rules.counts.join('/') },
    });
  }

  const specials = cron.order
    .map(k => cron.fields[k])
    .reduce<string[]>(
      (acc, f) => acc.concat(f.specials.map(t => t.raw)),
      []
    );
  if (specials.length > 0 && !rules.quartzSpecials) {
    notes.push({ level: 'error', key: 'plat_noSpecials', data: { tokens: specials.join(', ') } });
  }

  const usesQuestion = cron.fields.day.raw === '?' || cron.fields.weekday.raw === '?';
  if (usesQuestion && !rules.questionMark) {
    notes.push({ level: 'error', key: 'plat_noQuestionMark' });
  }
  if (rules.requiresQuestionMark && !usesQuestion && rules.counts.indexOf(fieldCount) !== -1) {
    notes.push({ level: 'error', key: 'plat_needsQuestionMark' });
  }

  if (cron.macro && !rules.macros) {
    notes.push({ level: 'error', key: 'plat_noMacros', data: { macro: cron.macro } });
  }
  if (cron.usesJenkins && !rules.jenkinsHash) {
    notes.push({ level: 'error', key: 'plat_noHash' });
  }

  if (rules.fixedZone) {
    notes.push({ level: 'warn', key: 'plat_fixedZone', data: { zone: rules.fixedZone } });
  }
  if (rules.minIntervalMinutes && evenIntervalMs > 0 && evenIntervalMs < rules.minIntervalMinutes * 60000) {
    notes.push({ level: 'warn', key: 'plat_minInterval', data: { n: rules.minIntervalMinutes } });
  }
  if (id === 'github') {
    notes.push({ level: 'warn', key: 'plat_githubDelay' });
  }
  if (id === 'aws') {
    // EventBridge numbers Sunday as 1, so every weekday value shifts by one.
    if (!cron.fields.weekday.unrestricted) notes.push({ level: 'warn', key: 'plat_awsWeekday' });
  }
  if (!cron.fields.day.unrestricted && !cron.fields.weekday.unrestricted && (id === 'vixie' || id === 'k8s' || id === 'nodecron')) {
    notes.push({ level: 'warn', key: 'plat_orRule' });
  }
  if (cron.order.indexOf('second') !== -1 && cron.fields.second.values.length > 1 && id === 'aws') {
    notes.push({ level: 'error', key: 'plat_noSeconds' });
  }

  let level: Level = 'ok';
  for (const n of notes) level = worst(level, n.level);
  return { id, level, notes };
}

export function checkAll(cron: Cron, evenIntervalMs: number): PlatformReport[] {
  return PLATFORMS.map(id => checkPlatform(cron, id, evenIntervalMs));
}
