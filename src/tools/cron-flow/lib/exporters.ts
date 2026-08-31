// ============================================================================
// Exporters
// ----------------------------------------------------------------------------
// The expression is almost never the deliverable — the crontab line, the
// GitHub Actions block or the CronJob manifest is. Every generator here is a
// pure string function so the panel can render all of them at once and the
// handoff can ship whichever one the user picked.
// ============================================================================

import type { Cron } from './cron';

export type ExportId = 'crontab' | 'github' | 'k8s' | 'systemd' | 'aws' | 'nodecron' | 'spring';

export const EXPORTS: ExportId[] = ['crontab', 'github', 'k8s', 'systemd', 'aws', 'nodecron', 'spring'];

export const EXPORT_LANGUAGE: Record<ExportId, string> = {
  crontab: 'bash',
  github: 'yaml',
  k8s: 'yaml',
  systemd: 'ini',
  aws: 'text',
  nodecron: 'javascript',
  spring: 'java',
};

export const EXPORT_FILENAME: Record<ExportId, string> = {
  crontab: 'schedule.crontab',
  github: 'schedule.yml',
  k8s: 'cronjob.yaml',
  systemd: 'schedule.timer',
  aws: 'eventbridge.txt',
  nodecron: 'schedule.js',
  spring: 'Schedule.java',
};

export interface ExportContext {
  cron: Cron;
  /** IANA zone the user picked. */
  timezone: string;
  /** What the schedule is supposed to run. Free text from the user. */
  command: string;
  /** Slugified job name for the manifests. */
  name: string;
}

/** The 5-field form, which is what every POSIX-flavoured target wants. */
function fiveField(cron: Cron): string {
  return [
    cron.fields.minute.raw,
    cron.fields.hour.raw,
    cron.fields.day.raw,
    cron.fields.month.raw,
    cron.fields.weekday.raw,
  ].join(' ');
}

function sixField(cron: Cron): string {
  return [cron.fields.second.raw, fiveField(cron)].join(' ');
}

function slug(name: string): string {
  const cleaned = (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return cleaned || 'scheduled-job';
}

// ----------------------------------------------------------------------------
// systemd OnCalendar
// ----------------------------------------------------------------------------

const SYSTEMD_DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * systemd has no cron parser: OnCalendar is its own grammar. Values are
 * rendered as an explicit list unless they form a uniform step starting at the
 * field minimum, which systemd writes as `start/step`.
 */
function calendarComponent(values: number[], size: number, min: number, pad: number): string {
  if (values.length === size) return '*';
  if (values.length > 2) {
    const gap = values[1] - values[0];
    let uniform = true;
    for (let i = 2; i < values.length; i++) {
      if (values[i] - values[i - 1] !== gap) {
        uniform = false;
        break;
      }
    }
    if (uniform && gap > 1 && values[0] === min) {
      return `${String(values[0]).padStart(pad, '0')}/${gap}`;
    }
  }
  return values.map(n => String(n).padStart(pad, '0')).join(',');
}

export function toOnCalendar(cron: Cron): string {
  const dowPart = cron.fields.weekday.values.length === 7
    ? ''
    : `${cron.fields.weekday.values.map(n => SYSTEMD_DOW[n]).join(',')} `;
  const month = calendarComponent(cron.fields.month.values, 12, 1, 2);
  const day = cron.fields.day.values.length === 31
    ? '*'
    : calendarComponent(cron.fields.day.values, 31, 1, 2);
  const hour = calendarComponent(cron.fields.hour.values, 24, 0, 2);
  const minute = calendarComponent(cron.fields.minute.values, 60, 0, 2);
  const second = calendarComponent(cron.fields.second.values, 60, 0, 2);
  return `${dowPart}*-${month}-${day} ${hour}:${minute}:${second}`;
}

// ----------------------------------------------------------------------------
// AWS EventBridge
// ----------------------------------------------------------------------------

/**
 * EventBridge takes six fields with a mandatory year, forbids seconds, and —
 * the part that bites everyone — numbers Sunday as 1 instead of 0.
 */
export function toEventBridge(cron: Cron): string {
  const shiftDow = (raw: string, values: number[]): string => {
    if (raw === '*' || raw === '?') return raw;
    return values.map(n => n + 1).join(',');
  };
  const domPinned = !cron.fields.day.unrestricted;
  const dowPinned = !cron.fields.weekday.unrestricted;
  // Exactly one of the two must be `?`; when both are open we blank the weekday.
  const dom = domPinned || !dowPinned ? cron.fields.day.raw : '?';
  const dow = dowPinned ? shiftDow(cron.fields.weekday.raw, cron.fields.weekday.values) : '?';
  const year = cron.fields.year.values.length > 100 ? '*' : cron.fields.year.raw;
  return `cron(${cron.fields.minute.raw} ${cron.fields.hour.raw} ${dom} ${cron.fields.month.raw} ${dow} ${year})`;
}

// ----------------------------------------------------------------------------
// Generators
// ----------------------------------------------------------------------------

export function generate(id: ExportId, ctx: ExportContext): string {
  const { cron, timezone, command } = ctx;
  const name = slug(ctx.name);
  const cmd = (command || '').trim() || '/usr/local/bin/my-job.sh';
  const five = fiveField(cron);

  switch (id) {
    case 'crontab': {
      const tzLine = timezone && timezone !== 'UTC' ? `CRON_TZ=${timezone}\n` : '';
      return (
        `# ┌───────────── minute (0-59)\n` +
        `# │ ┌─────────── hour (0-23)\n` +
        `# │ │ ┌───────── day of month (1-31)\n` +
        `# │ │ │ ┌─────── month (1-12)\n` +
        `# │ │ │ │ ┌───── day of week (0-6, Sunday = 0)\n` +
        `# │ │ │ │ │\n` +
        tzLine +
        `${five} ${cmd}\n`
      );
    }

    case 'github':
      // Actions has no timezone knob at all; saying so beside the block is the
      // only honest way to hand it over.
      return (
        `name: ${name}\n\n` +
        `on:\n` +
        `  schedule:\n` +
        `    # Runs in UTC — GitHub Actions ignores repository timezones.\n` +
        `    - cron: '${five}'\n` +
        `  workflow_dispatch:\n\n` +
        `jobs:\n` +
        `  run:\n` +
        `    runs-on: ubuntu-latest\n` +
        `    steps:\n` +
        `      - uses: actions/checkout@v4\n` +
        `      - run: ${cmd}\n`
      );

    case 'k8s':
      return (
        `apiVersion: batch/v1\n` +
        `kind: CronJob\n` +
        `metadata:\n` +
        `  name: ${name}\n` +
        `spec:\n` +
        `  schedule: "${five}"\n` +
        `  timeZone: "${timezone || 'Etc/UTC'}"\n` +
        `  concurrencyPolicy: Forbid\n` +
        `  successfulJobsHistoryLimit: 3\n` +
        `  failedJobsHistoryLimit: 1\n` +
        `  jobTemplate:\n` +
        `    spec:\n` +
        `      template:\n` +
        `        spec:\n` +
        `          restartPolicy: OnFailure\n` +
        `          containers:\n` +
        `            - name: ${name}\n` +
        `              image: alpine:3\n` +
        `              command: ["/bin/sh", "-c", "${cmd.replace(/"/g, '\\"')}"]\n`
      );

    case 'systemd':
      return (
        `# ${name}.timer\n` +
        `[Unit]\n` +
        `Description=${name}\n\n` +
        `[Timer]\n` +
        `OnCalendar=${toOnCalendar(cron)}\n` +
        `Persistent=true\n` +
        (timezone ? `# systemd 240+ only:\n` : '') +
        (timezone ? `Timezone=${timezone}\n` : '') +
        `\n[Install]\n` +
        `WantedBy=timers.target\n\n` +
        `# ${name}.service\n` +
        `[Unit]\n` +
        `Description=${name}\n\n` +
        `[Service]\n` +
        `Type=oneshot\n` +
        `ExecStart=${cmd}\n`
      );

    case 'aws':
      return (
        `# EventBridge schedule expression\n` +
        `${toEventBridge(cron)}\n\n` +
        `# AWS CLI\n` +
        `aws events put-rule \\\n` +
        `  --name ${name} \\\n` +
        `  --schedule-expression "${toEventBridge(cron)}"\n\n` +
        `# EventBridge always evaluates in UTC.\n`
      );

    case 'nodecron': {
      const expr = cron.order.indexOf('second') !== -1 ? sixField(cron) : five;
      return (
        `import cron from 'node-cron';\n\n` +
        `cron.schedule(\n` +
        `  '${expr}',\n` +
        `  () => {\n` +
        `    // ${cmd}\n` +
        `  },\n` +
        `  { timezone: '${timezone || 'UTC'}' }\n` +
        `);\n`
      );
    }

    case 'spring': {
      const expr = cron.order.indexOf('second') !== -1 ? sixField(cron) : `0 ${five}`;
      return (
        `@Scheduled(cron = "${expr}", zone = "${timezone || 'UTC'}")\n` +
        `public void ${name.replace(/-(\w)/g, (_, c) => c.toUpperCase())}() {\n` +
        `    // ${cmd}\n` +
        `}\n`
      );
    }

    default:
      return '';
  }
}

/** Every snippet at once, for the "download all" handoff. */
export function generateAll(ctx: ExportContext): string {
  return EXPORTS.map(id => `===== ${id} =====\n${generate(id, ctx)}`).join('\n');
}
