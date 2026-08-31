import type { ZoneEntry } from '../types';
import { offsetLabel, offsetMinutes, zoneParts } from './time';

// ============================================================================
// Calendar export
// ----------------------------------------------------------------------------
// A meeting planner that cannot put the meeting in a calendar stops one step
// short. The file is built here, in the page, so it stays a local tool.
// ============================================================================

const pad = (n: number) => String(n).padStart(2, '0');

/** iCalendar UTC stamp: 20231114T221320Z. */
function stamp(ms: number): string {
  const d = new Date(ms);
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

/** RFC 5545 wants CRLF, escaped separators, and lines folded at 75 octets. */
function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 75) {
    out.push(rest.slice(0, 75));
    rest = ' ' + rest.slice(75);
  }
  out.push(rest);
  return out.join('\r\n');
}

const escapeText = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

export interface MeetingIcs {
  startMs: number;
  durationMinutes: number;
  title: string;
  zones: ZoneEntry[];
  /** Line describing each zone's local time, for the description. */
  lines: string[];
}

export function buildIcs(meeting: MeetingIcs): string {
  const uid = `${meeting.startMs}-${Math.random().toString(36).slice(2, 10)}@olovetools`;
  const body = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//oLoveTools//TimeBolt//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp(Date.now())}`,
    `DTSTART:${stamp(meeting.startMs)}`,
    `DTEND:${stamp(meeting.startMs + meeting.durationMinutes * 60000)}`,
    fold(`SUMMARY:${escapeText(meeting.title)}`),
    fold(`DESCRIPTION:${escapeText(meeting.lines.join('\n'))}`),
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return body.join('\r\n') + '\r\n';
}

/** Plain-text summary of the same meeting, for pasting into a chat. */
export function buildSummary(startMs: number, zones: ZoneEntry[], locale: string): string {
  const at = new Date(startMs);
  return zones
    .map(z => {
      const p = zoneParts(z.tz, at);
      const off = offsetMinutes(z.tz, at);
      let day = '';
      try {
        day = new Intl.DateTimeFormat(locale, {
          timeZone: z.tz,
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }).format(at);
      } catch {
        day = `${p.year}-${pad(p.month)}-${pad(p.day)}`;
      }
      return `${z.city}: ${pad(p.hour)}:${pad(p.minute)} ${day} (${offsetLabel(off)})`;
    })
    .join('\n');
}
