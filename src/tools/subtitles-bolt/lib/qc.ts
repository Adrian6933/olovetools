// ============================================================================
// Quality control
// ----------------------------------------------------------------------------
// The thing that separates a converter from a subtitling tool. Every broadcast
// spec is written in the same handful of numbers — reading speed, minimum and
// maximum duration, line length, line count, minimum gap — and a file that
// violates them gets rejected on delivery, or just reads badly.
//
// The presets are the published values from the specs people actually deliver
// against. They are starting points, not law: every field is editable.
// ============================================================================

import type { Cue } from './model';
import { charCount, cps, duration, sortCues } from './model';

export interface Spec {
  /** Maximum characters per second. */
  maxCps: number;
  /** Milliseconds a cue must stay up for. */
  minDuration: number;
  maxDuration: number;
  /** Characters per line. */
  maxLineLength: number;
  maxLines: number;
  /** Minimum blank between consecutive cues. */
  minGap: number;
}

export type PresetId = 'netflix' | 'bbc' | 'youtube' | 'relaxed';

/**
 * Netflix: 17 cps for adult Latin-script titles, 42 characters per line, two
 * lines, 5/6 s minimum. BBC: 160–180 wpm ≈ 15 cps at 37 characters. YouTube's
 * automatic captions are far looser. "Relaxed" only catches what is broken.
 */
export const PRESETS: Record<PresetId, Spec> = {
  netflix: { maxCps: 17, minDuration: 833, maxDuration: 7000, maxLineLength: 42, maxLines: 2, minGap: 84 },
  bbc: { maxCps: 15, minDuration: 1000, maxDuration: 8000, maxLineLength: 37, maxLines: 2, minGap: 40 },
  youtube: { maxCps: 21, minDuration: 700, maxDuration: 8000, maxLineLength: 42, maxLines: 2, minGap: 0 },
  relaxed: { maxCps: 30, minDuration: 300, maxDuration: 12000, maxLineLength: 60, maxLines: 3, minGap: 0 },
};

export type IssueCode =
  | 'fastReading'
  | 'tooShort'
  | 'tooLong'
  | 'lineTooLong'
  | 'tooManyLines'
  | 'overlap'
  | 'shortGap'
  | 'reversed'
  | 'empty'
  | 'outOfOrder';

export type Severity = 'error' | 'warning';

export interface QcIssue {
  /** Index into the cue array the check ran on. */
  at: number;
  /** The cue's uid, so the UI can scroll to it after a re-sort. */
  uid: number;
  code: IssueCode;
  severity: Severity;
  /** Numbers for the message template. */
  data: Record<string, string | number>;
}

const SEVERITY: Record<IssueCode, Severity> = {
  fastReading: 'warning',
  tooShort: 'warning',
  tooLong: 'warning',
  lineTooLong: 'warning',
  tooManyLines: 'warning',
  overlap: 'error',
  shortGap: 'warning',
  reversed: 'error',
  empty: 'error',
  outOfOrder: 'error',
};

export interface QcReport {
  issues: QcIssue[];
  /** How many cues have at least one issue. */
  affected: number;
  errors: number;
  warnings: number;
  /** Reading speed across the whole track, characters per second. */
  averageCps: number;
  /** Share of the media the subtitles actually occupy, 0-1. */
  coverage: number;
}

export function runQc(cues: Cue[], spec: Spec): QcReport {
  const issues: QcIssue[] = [];
  const flagged = new Set<number>();

  const add = (at: number, cue: Cue, code: IssueCode, data: Record<string, string | number>) => {
    issues.push({ at, uid: cue.uid, code, severity: SEVERITY[code], data });
    flagged.add(cue.uid);
  };

  // Order is checked against the array as given, before any sorting, because
  // "this file is out of order" is itself the finding.
  const sorted = sortCues(cues);
  const wasSorted = cues.every((cue, i) => cue.uid === sorted[i].uid);

  let totalChars = 0;
  let totalMs = 0;

  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    const span = duration(cue);
    totalChars += charCount(cue);
    totalMs += span;

    if (cue.lines.join('').trim() === '') add(i, cue, 'empty', {});
    if (cue.end <= cue.start) {
      add(i, cue, 'reversed', {});
      // Every duration-derived check below would be nonsense for this cue.
      continue;
    }

    const speed = cps(cue);
    if (speed > spec.maxCps) add(i, cue, 'fastReading', { cps: speed.toFixed(1), max: spec.maxCps });
    if (span < spec.minDuration) add(i, cue, 'tooShort', { ms: span, min: spec.minDuration });
    if (span > spec.maxDuration) add(i, cue, 'tooLong', { ms: span, max: spec.maxDuration });
    if (cue.lines.length > spec.maxLines) add(i, cue, 'tooManyLines', { n: cue.lines.length, max: spec.maxLines });

    for (const line of cue.lines) {
      if (line.length > spec.maxLineLength) {
        add(i, cue, 'lineTooLong', { n: line.length, max: spec.maxLineLength });
        break;
      }
    }

    const next = cues[i + 1];
    if (next) {
      if (next.start < cue.end) add(i, cue, 'overlap', { ms: cue.end - next.start });
      else if (spec.minGap > 0 && next.start - cue.end < spec.minGap) {
        add(i, cue, 'shortGap', { ms: next.start - cue.end, min: spec.minGap });
      }
    }
  }

  if (!wasSorted && cues.length > 0) {
    issues.push({ at: 0, uid: cues[0].uid, code: 'outOfOrder', severity: 'error', data: { n: cues.length } });
  }

  const span = cues.length === 0 ? 0 : Math.max(...cues.map(c => c.end)) - Math.min(...cues.map(c => c.start));
  return {
    issues,
    affected: flagged.size,
    errors: issues.filter(i => i.severity === 'error').length,
    warnings: issues.filter(i => i.severity === 'warning').length,
    averageCps: totalMs > 0 ? totalChars / (totalMs / 1000) : 0,
    coverage: span > 0 ? Math.min(1, totalMs / span) : 0,
  };
}

/** Per-cue lookup, so the editor can colour a row without scanning the list. */
export function issuesByUid(report: QcReport): Map<number, QcIssue[]> {
  const map = new Map<number, QcIssue[]>();
  for (const issue of report.issues) {
    const list = map.get(issue.uid);
    if (list) list.push(issue);
    else map.set(issue.uid, [issue]);
  }
  return map;
}

/**
 * The subset of findings that can be repaired without a human decision:
 * durations, overlaps and gaps are arithmetic. Reading speed and line length
 * need rewriting, so they are deliberately not in here.
 */
export function autoFixableCodes(): IssueCode[] {
  return ['tooShort', 'tooLong', 'overlap', 'shortGap', 'outOfOrder'];
}

export function countAutoFixable(report: QcReport): number {
  const codes = autoFixableCodes();
  return report.issues.filter(i => codes.indexOf(i.code) !== -1).length;
}
