// ============================================================================
// Locale-aware comparison, built once per configuration.
// ----------------------------------------------------------------------------
// `a.localeCompare(b)` inside a sort callback builds an ICU collator on every
// single comparison — sorting 100k lines means ~1.7 million collator
// constructions. `Intl.Collator` builds one and reuses its `compare`, which is
// the whole reason this file exists.
//
// The locale comes from the page (`/es/list-mixer` sorts as Spanish), not from
// the browser: otherwise the same list came out in a different order depending
// on whose Chrome opened it.
// ============================================================================

type Compare = (a: string, b: string) => number;

const cache = new Map<string, Compare>();

/**
 * @param locale  BCP-47 tag of the page.
 * @param numeric `item2` before `item10` instead of after it.
 * @param ignoreCase Fold case and accents together (ICU `sensitivity: 'base'`).
 */
export function getCompare(locale: string, numeric: boolean, ignoreCase: boolean): Compare {
  const key = `${locale}|${numeric ? 1 : 0}|${ignoreCase ? 1 : 0}`;
  const hit = cache.get(key);
  if (hit) return hit;

  let compare: Compare;
  try {
    compare = new Intl.Collator(locale || 'en', {
      numeric,
      sensitivity: ignoreCase ? 'base' : 'variant',
      // Without this, ICU sorts "!" and " " before letters in ways that look
      // arbitrary in a list of file names or slugs.
      ignorePunctuation: false,
    }).compare;
  } catch {
    // An unknown tag throws RangeError; fall back rather than lose the sort.
    compare = new Intl.Collator('en', { numeric }).compare;
  }

  cache.set(key, compare);
  return compare;
}

/** Codepoint order: what a programmer means by "sort", and what `sort()` does. */
export const compareBinary: Compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
