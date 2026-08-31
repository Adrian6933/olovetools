// ============================================================================
// Crontab file reading
// ----------------------------------------------------------------------------
// Pasting a real crontab and getting every line explained is the thing people
// actually want when they inherit a server. Splitting the schedule from the
// command is the only fiddly part: the schedule is the first N whitespace-
// separated tokens, and N depends on whether the line is a macro, a plain user
// crontab, or an /etc/crontab line that carries a user column.
// ============================================================================

import { parseCron } from './cron';
import type { Cron, CronError } from './cron';

export interface CrontabLine {
  /** 1-based line number in the pasted text. */
  number: number;
  raw: string;
  kind: 'job' | 'comment' | 'env' | 'blank' | 'invalid';
  /** For jobs. */
  expression?: string;
  command?: string;
  /** `/etc/crontab` style lines name the user to run as. */
  user?: string;
  cron?: Cron;
  error?: CronError;
  /** For env lines: CRON_TZ / TZ get surfaced, everything else is just noted. */
  envKey?: string;
  envValue?: string;
}

export interface CrontabDoc {
  lines: CrontabLine[];
  jobs: CrontabLine[];
  /** CRON_TZ or TZ, when the file sets one. */
  timezone: string;
}

const ENV_RE = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/;
/** A user column is a bare name, never a path or a shell word. */
const USER_RE = /^[a-z_][a-z0-9_-]{0,31}$/;

function looksLikeCommand(token: string): boolean {
  return token.indexOf('/') !== -1 || token.indexOf('=') !== -1 || !USER_RE.test(token);
}

export function parseCrontab(text: string): CrontabDoc {
  const lines: CrontabLine[] = [];
  let timezone = '';

  const rows = (text || '').split(/\r?\n/);
  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const trimmed = raw.trim();
    const number = i + 1;

    if (trimmed === '') {
      lines.push({ number, raw, kind: 'blank' });
      continue;
    }
    if (trimmed.startsWith('#')) {
      lines.push({ number, raw, kind: 'comment' });
      continue;
    }

    const env = ENV_RE.exec(trimmed);
    if (env && !trimmed.startsWith('@')) {
      const key = env[1].toUpperCase();
      const value = env[2].replace(/^["']|["']$/g, '');
      if (key === 'CRON_TZ' || key === 'TZ') timezone = value;
      lines.push({ number, raw, kind: 'env', envKey: env[1], envValue: value });
      continue;
    }

    const tokens = trimmed.split(/\s+/);
    let scheduleTokens: number;
    if (tokens[0].startsWith('@')) {
      // Every macro is a single token except `@every`, which carries its
      // interval in the next one.
      scheduleTokens = tokens[0].toLowerCase() === '@every' ? 2 : 1;
    } else {
      scheduleTokens = 5;
    }
    if (tokens.length <= scheduleTokens) {
      lines.push({ number, raw, kind: 'invalid' });
      continue;
    }

    const expression = tokens.slice(0, scheduleTokens).join(' ');
    let rest = tokens.slice(scheduleTokens);
    let user: string = undefined;
    if (rest.length > 1 && !looksLikeCommand(rest[0])) {
      user = rest[0];
      rest = rest.slice(1);
    }

    const { cron, error } = parseCron(expression);
    lines.push({
      number,
      raw,
      kind: 'job',
      expression,
      command: rest.join(' '),
      user,
      cron,
      error,
    });
  }

  return { lines, jobs: lines.filter(l => l.kind === 'job'), timezone };
}
