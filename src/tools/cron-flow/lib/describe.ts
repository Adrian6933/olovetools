// ============================================================================
// Human-readable description
// ----------------------------------------------------------------------------
// Built from the AST and the dictionary, never from the raw string. The old
// build re-inspected the text ("does the minute field start with a star-slash?")
// and hardcoded the result in English, which meant the single most important
// output of the tool was untranslated in eight of the nine languages.
//
// Month and weekday names come from the dictionary rather than from Intl on
// purpose: the island is server-rendered, and an Intl call whose output depends
// on the host locale is exactly what breaks hydration.
// ============================================================================

import type { Cron, CronError, Field, Term } from './cron';

/** Replaces {name} placeholders. Missing keys are left alone, not blanked. */
function fill(template: string, data: Record<string, string | number>): string {
  if (!template) return '';
  return template.replace(/\{(\w+)\}/g, (whole, key) => (key in data ? String(data[key]) : whole));
}

const FALLBACKS: Record<string, string> = {
  d_and: ' and ',
  d_sep: ', ',
  d_join: ' ',
  d_everySecond: 'Every second',
  d_everyNSeconds: 'Every {n} seconds',
  d_atSecond: 'at second {v}',
  d_atSeconds: 'at seconds {list}',
  d_everyMinute: 'Every minute',
  d_everyNMinutes: 'Every {n} minutes',
  d_atMinute: 'at minute {v}',
  d_atMinutes: 'at minutes {list}',
  d_everyHour: 'Every hour',
  d_everyNHours: 'Every {n} hours',
  d_atTime: 'At {v}',
  d_atTimes: 'At {list}',
  d_pastHour: 'past hour {v}',
  d_pastHours: 'past hours {list}',
  d_betweenHours: 'between {from} and {to}',
  d_onDay: 'on day {v} of the month',
  d_onDays: 'on days {list} of the month',
  d_everyNDays: 'every {n} days',
  d_lastDay: 'on the last day of the month',
  d_lastDayOffset: '{n} days before the end of the month',
  d_lastWeekday: 'on the last weekday of the month',
  d_nearestWeekday: 'on the weekday nearest day {v}',
  d_inMonth: 'in {v}',
  d_inMonths: 'in {list}',
  d_everyNMonths: 'every {n} months',
  d_onWeekday: 'on {v}',
  d_onWeekdays: 'on {list}',
  d_nthWeekday: 'on the {nth} {day} of the month',
  d_lastWeekdayOf: 'on the last {day} of the month',
  d_inYear: 'in {v}',
  d_inYears: 'in {list}',
  d_weekdayGenders: 'm,m,m,m,m,m,m',
  d_onDay1: '',
  d_clauseOrder: 'time,day,month,weekday,year',
  d_clock: '12',
  d_am: 'AM',
  d_pm: 'PM',
};

const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ORDINALS_EN = ['first', 'second', 'third', 'fourth', 'fifth'];

export interface Vocab {
  s: (key: string) => string;
  months: string[];
  weekdays: string[];
  /**
   * Inflected forms used only inside the description. Russian says "в марте",
   * not "в Март", but the calendar header and the builder grid need the
   * nominative — so the two live in separate keys instead of one being wrong.
   * Falls back to the plain names when a language does not need them.
   */
  monthsIn: string[];
  weekdaysOn: string[];
  /** The case a single named weekday takes: "в третью ПЯТНИЦУ месяца". */
  weekdaysNth: string[];
  ordinals: string[];
  /**
   * Grammatical gender of each weekday, as "n,m,m,f,m,f,f". Russian and
   * Portuguese inflect the ordinal and the article to match it, so "the third
   * Friday" and "the third Sunday" are not the same sentence shape. Languages
   * that do not care leave every slot masculine and nothing changes.
   */
  genderOf: (dow: number) => string;
  /** `key_f` / `key_n` when the gender needs it, else `key`. */
  g: (key: string, gender: string) => string;
  /** Ordinals agreeing with a gender. */
  ordinalsFor: (gender: string) => string[];
}

export function vocabFrom(t: any): Vocab {
  const dict = t || {};
  const months =
    Array.isArray(dict.d_monthNames) && dict.d_monthNames.length === 12 ? dict.d_monthNames : MONTHS_EN;
  const weekdays =
    Array.isArray(dict.d_weekdayNames) && dict.d_weekdayNames.length === 7 ? dict.d_weekdayNames : WEEKDAYS_EN;
  const ordinals =
    Array.isArray(dict.d_ordinals) && dict.d_ordinals.length >= 5 ? dict.d_ordinals : ORDINALS_EN;
  const text = (key: string) => (typeof dict[key] === 'string' ? dict[key] : FALLBACKS[key] || '');
  const genders = text('d_weekdayGenders').split(',');

  return {
    s: text,
    months,
    weekdays,
    monthsIn:
      Array.isArray(dict.d_monthNamesIn) && dict.d_monthNamesIn.length === 12 ? dict.d_monthNamesIn : months,
    weekdaysOn:
      Array.isArray(dict.d_weekdayNamesOn) && dict.d_weekdayNamesOn.length === 7
        ? dict.d_weekdayNamesOn
        : weekdays,
    weekdaysNth:
      Array.isArray(dict.d_weekdayNamesNth) && dict.d_weekdayNamesNth.length === 7
        ? dict.d_weekdayNamesNth
        : weekdays,
    ordinals,
    genderOf: dow => (genders[dow] || '').trim(),
    g: (key, gender) => {
      if (gender && gender !== 'm') {
        const specific = text(`${key}_${gender}`);
        if (specific) return specific;
      }
      return text(key);
    },
    ordinalsFor: gender => {
      if (gender && gender !== 'm') {
        const specific = dict[`d_ordinals_${gender}`];
        if (Array.isArray(specific) && specific.length >= 5) return specific;
      }
      return ordinals;
    },
  };
}

function list(items: string[], v: Vocab): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  const sep = v.s('d_sep');
  const and = v.s('d_and');
  return items.slice(0, -1).join(sep) + and + items[items.length - 1];
}

/** 09:30 or 9:30 AM, decided per language by `d_clock`. */
export function formatClock(h: number, m: number, v: Vocab): string {
  const mm = String(m).padStart(2, '0');
  if (v.s('d_clock') === '24') return `${String(h).padStart(2, '0')}:${mm}`;
  const suffix = h < 12 ? v.s('d_am') : v.s('d_pm');
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${mm} ${suffix}`;
}

// ----------------------------------------------------------------------------
// Field shape helpers
// ----------------------------------------------------------------------------

/** The single step term that covers the whole field, if that is all there is. */
function fullStep(field: Field): Term {
  if (field.terms.length !== 1) return null;
  const term = field.terms[0];
  if (term.kind !== 'step') return null;
  return term;
}

function isEvery(field: Field, size: number): boolean {
  return field.values.length === size;
}

/** A single contiguous run, used to say "between 9 and 17" instead of a list. */
function contiguous(values: number[]): { from: number; to: number } {
  if (values.length < 3) return null;
  for (let i = 1; i < values.length; i++) {
    if (values[i] !== values[i - 1] + 1) return null;
  }
  return { from: values[0], to: values[values.length - 1] };
}

// ----------------------------------------------------------------------------
// Clauses
// ----------------------------------------------------------------------------

function hourClause(field: Field, v: Vocab): string {
  if (isEvery(field, 24)) return '';
  const run = contiguous(field.values);
  if (run) {
    return fill(v.s('d_betweenHours'), { from: formatClock(run.from, 0, v), to: formatClock(run.to, 0, v) });
  }
  if (field.values.length === 1) return fill(v.s('d_pastHour'), { v: field.values[0] });
  return fill(v.s('d_pastHours'), { list: list(field.values.map(String), v) });
}

function secondClause(field: Field, v: Vocab): string {
  if (field.values.length === 1 && field.values[0] === 0) return '';
  if (field.values.length === 1) return fill(v.s('d_atSecond'), { v: field.values[0] });
  return fill(v.s('d_atSeconds'), { list: list(field.values.map(String), v) });
}

/**
 * The leading clause: how often, and at what time of day. Ordered from the
 * shapes people actually write down to the general fallback, because "every 5
 * minutes" and "at 09:30" is what 90% of real crontabs say.
 */
function timeClause(cron: Cron, v: Vocab): string {
  const second = cron.fields.second;
  const minute = cron.fields.minute;
  const hour = cron.fields.hour;

  const secondsEvery = isEvery(second, 60);
  const secondsStep = fullStep(second);
  const minutesEvery = isEvery(minute, 60);
  const hoursEvery = isEvery(hour, 24);

  const parts: string[] = [];
  const push = (s: string) => {
    if (s) parts.push(s);
  };

  // --- sub-minute schedules -------------------------------------------------
  if (secondsEvery && minutesEvery && hoursEvery) return v.s('d_everySecond');
  if (secondsStep && secondsStep.step > 1 && secondsStep.from === 0 && secondsStep.to === 59 && minutesEvery && hoursEvery) {
    return fill(v.s('d_everyNSeconds'), { n: secondsStep.step });
  }

  // --- minute-driven --------------------------------------------------------
  const minuteStep = fullStep(minute);
  // `*/1` es "cada minuto", no "cada 1 minutos": el paso 1 cae a la rama de abajo.
  if (minuteStep && minuteStep.step > 1 && minuteStep.from === 0 && minuteStep.to === 59) {
    push(fill(v.s('d_everyNMinutes'), { n: minuteStep.step }));
    push(hourClause(hour, v));
    push(secondClause(second, v));
    return parts.join(v.s('d_join'));
  }
  if (minutesEvery) {
    push(v.s('d_everyMinute'));
    push(hourClause(hour, v));
    push(secondClause(second, v));
    return parts.join(v.s('d_join'));
  }

  // --- hour-driven ----------------------------------------------------------
  const hourStep = fullStep(hour);
  if (hourStep && hourStep.step > 1 && hourStep.from === 0 && hourStep.to === 23 && minute.values.length === 1) {
    push(fill(v.s('d_everyNHours'), { n: hourStep.step }));
    if (minute.values[0] !== 0) push(fill(v.s('d_atMinute'), { v: minute.values[0] }));
    push(secondClause(second, v));
    return parts.join(v.s('d_join'));
  }

  // --- hourly ---------------------------------------------------------------
  // `0 * * * *` is the second most common line in any crontab, and reading it
  // out as "at minute 0" tells the user nothing they did not already see.
  if (hoursEvery) {
    push(v.s('d_everyHour'));
    if (!(minute.values.length === 1 && minute.values[0] === 0)) {
      push(
        minute.values.length === 1
          ? fill(v.s('d_atMinute'), { v: minute.values[0] })
          : fill(v.s('d_atMinutes'), { list: list(minute.values.map(String), v) })
      );
    }
    push(secondClause(second, v));
    return parts.join(v.s('d_join'));
  }

  // --- explicit clock times -------------------------------------------------
  const times = hour.values.length * minute.values.length;
  if (!hoursEvery && times > 0 && times <= 8) {
    const stamps: string[] = [];
    for (const h of hour.values) for (const m of minute.values) stamps.push(formatClock(h, m, v));
    stamps.sort();
    push(stamps.length === 1 ? fill(v.s('d_atTime'), { v: stamps[0] }) : fill(v.s('d_atTimes'), { list: list(stamps, v) }));
    push(secondClause(second, v));
    return parts.join(v.s('d_join'));
  }

  // --- fallback -------------------------------------------------------------
  push(
    minute.values.length === 1
      ? fill(v.s('d_atMinute'), { v: minute.values[0] })
      : fill(v.s('d_atMinutes'), { list: list(minute.values.map(String), v) })
  );
  push(hourClause(hour, v));
  push(secondClause(second, v));
  return parts.join(v.s('d_join'));
}

function dayClause(field: Field, v: Vocab): string {
  const parts: string[] = [];
  for (const term of field.specials) {
    if (term.kind === 'lastDay') {
      parts.push(term.offset ? fill(v.s('d_lastDayOffset'), { n: term.offset }) : v.s('d_lastDay'));
    } else if (term.kind === 'lastWeekday') {
      parts.push(v.s('d_lastWeekday'));
    } else if (term.kind === 'nearestWd') {
      parts.push(fill(v.s('d_nearestWeekday'), { v: term.values[0] }));
    }
  }
  if (!isEvery(field, 31) && field.values.length > 0) {
    const step = fullStep(field);
    if (step && step.from === 1 && step.to === 31) {
      parts.push(fill(v.s('d_everyNDays'), { n: step.step }));
    } else if (field.values.length === 1) {
      // French (and Portuguese ordinals elsewhere) mark the first of the month
      // differently from every other day.
      const key = field.values[0] === 1 && v.s('d_onDay1') ? 'd_onDay1' : 'd_onDay';
      parts.push(fill(v.s(key), { v: field.values[0] }));
    } else {
      parts.push(fill(v.s('d_onDays'), { list: list(field.values.map(String), v) }));
    }
  }
  return parts.join(v.s('d_join'));
}

function monthClause(field: Field, v: Vocab): string {
  if (isEvery(field, 12)) return '';
  const step = fullStep(field);
  if (step && step.from === 1 && step.to === 12) return fill(v.s('d_everyNMonths'), { n: step.step });
  const names = field.values.map(n => v.monthsIn[n - 1] || String(n));
  if (names.length === 1) return fill(v.s('d_inMonth'), { v: names[0] });
  return fill(v.s('d_inMonths'), { list: list(names, v) });
}

function weekdayClause(field: Field, v: Vocab): string {
  const parts: string[] = [];
  for (const term of field.specials) {
    const gender = v.genderOf(term.dow);
    const name = v.weekdaysNth[term.dow] || String(term.dow);
    if (term.kind === 'nthDow') {
      const ordinals = v.ordinalsFor(gender);
      parts.push(
        fill(v.g('d_nthWeekday', gender), { nth: ordinals[term.nth - 1] || String(term.nth), day: name })
      );
    } else if (term.kind === 'lastDow') {
      parts.push(fill(v.g('d_lastWeekdayOf', gender), { day: name }));
    }
  }
  if (field.values.length > 0 && field.values.length < 7) {
    const names = field.values.map(n => v.weekdaysOn[n] || String(n));
    if (names.length === 1) {
      parts.push(fill(v.g('d_onWeekday', v.genderOf(field.values[0])), { v: names[0] }));
    } else {
      // A mixed-gender list has no single correct article, so the plural
      // template is deliberately the gender-neutral one in every language.
      parts.push(fill(v.s('d_onWeekdays'), { list: list(names, v) }));
    }
  }
  return parts.join(v.s('d_join'));
}

function yearClause(field: Field, v: Vocab): string {
  if (field.values.length > 100) return '';
  if (field.values.length === 1) return fill(v.s('d_inYear'), { v: field.values[0] });
  return fill(v.s('d_inYears'), { list: list(field.values.map(String), v) });
}

// ----------------------------------------------------------------------------
// Assembly
// ----------------------------------------------------------------------------

/**
 * Clause order is a dictionary key rather than a constant: Japanese and Chinese
 * read year → month → day → weekday → time, the reverse of the Latin languages,
 * and appending clauses in English order would produce something no native
 * reader would write.
 */
export function describe(cron: Cron, t: any): string {
  const v = vocabFrom(t);
  const clauses: Record<string, string> = {
    time: timeClause(cron, v),
    day: dayClause(cron.fields.day, v),
    month: monthClause(cron.fields.month, v),
    weekday: weekdayClause(cron.fields.weekday, v),
    year: yearClause(cron.fields.year, v),
  };

  const order = (v.s('d_clauseOrder') || 'time,day,month,weekday,year').split(',');
  const out: string[] = [];
  for (const key of order) {
    const clause = clauses[key.trim()];
    if (clause) out.push(clause);
  }
  return out.join(v.s('d_join')).replace(/\s+/g, ' ').trim();
}

/** Turns a parse failure into a sentence, with the offending token quoted. */
export function describeError(error: CronError, t: any): string {
  const dict = t || {};
  const key = `err_${error.code}`;
  const template =
    typeof dict[key] === 'string'
      ? dict[key]
      : {
          empty: 'Type a cron expression to get started.',
          fieldCount: 'A cron expression needs 5, 6 or 7 fields separated by spaces — this one has {n}.',
          unknownMacro: '"{token}" is not a known shorthand.',
          badInterval: '"{token}" is not an interval that maps onto a cron field.',
          badToken: '"{token}" is not valid in the {field} field.',
          outOfRange: '"{token}" is outside the {field} range ({min}-{max}).',
          badRange: '"{token}" is not a valid range for the {field} field.',
          badStep: '"{token}" is not a valid step for the {field} field.',
          specialNotAllowed: '"{token}" is only allowed in the day and weekday fields.',
          reboot: '@reboot runs once when the machine starts, so it has no schedule to preview.',
        }[error.code] || 'Invalid cron expression.';

  const fieldName = error.field ? dict[`field_${error.field}`] || error.field : '';
  return fill(template, {
    token: error.token || '',
    field: fieldName,
    ...(error.data || {}),
  });
}
