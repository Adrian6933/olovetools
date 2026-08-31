import type { ZoneEntry } from '../types';

// ============================================================================
// Zone catalogue
// ----------------------------------------------------------------------------
// The list of zones comes from the browser (`Intl.supportedValuesOf`), which
// knows about 420 of them. The table below only adds *city names* on top, so a
// search for "Bogotá" finds America/Bogota — it is a display aid, never the
// list of what can be added. The previous version hard-coded 85 cities and
// nothing outside them could be reached at all.
// ============================================================================

interface CityHint {
  tz: string;
  city: string;
  country: string;
}

const CITY_HINTS: CityHint[] = [
  { tz: 'America/New_York', city: 'New York', country: 'USA' },
  { tz: 'America/Los_Angeles', city: 'Los Angeles', country: 'USA' },
  { tz: 'America/Chicago', city: 'Chicago', country: 'USA' },
  { tz: 'America/Denver', city: 'Denver', country: 'USA' },
  { tz: 'America/Phoenix', city: 'Phoenix', country: 'USA' },
  { tz: 'America/Anchorage', city: 'Anchorage', country: 'USA' },
  { tz: 'Pacific/Honolulu', city: 'Honolulu', country: 'USA' },
  { tz: 'America/Toronto', city: 'Toronto', country: 'Canada' },
  { tz: 'America/Vancouver', city: 'Vancouver', country: 'Canada' },
  { tz: 'America/Mexico_City', city: 'Ciudad de México', country: 'Mexico' },
  { tz: 'America/Bogota', city: 'Bogotá', country: 'Colombia' },
  { tz: 'America/Lima', city: 'Lima', country: 'Peru' },
  { tz: 'America/Caracas', city: 'Caracas', country: 'Venezuela' },
  { tz: 'America/Santiago', city: 'Santiago', country: 'Chile' },
  { tz: 'America/Argentina/Buenos_Aires', city: 'Buenos Aires', country: 'Argentina' },
  { tz: 'America/Sao_Paulo', city: 'São Paulo', country: 'Brazil' },
  { tz: 'America/Manaus', city: 'Manaus', country: 'Brazil' },
  { tz: 'Atlantic/Reykjavik', city: 'Reykjavík', country: 'Iceland' },
  { tz: 'Africa/Casablanca', city: 'Casablanca', country: 'Morocco' },
  { tz: 'Europe/Lisbon', city: 'Lisboa', country: 'Portugal' },
  // Funchal, not Lisbon: the old list mapped a second "Lisbon" entry to Madeira.
  { tz: 'Atlantic/Madeira', city: 'Funchal', country: 'Portugal' },
  { tz: 'Europe/London', city: 'London', country: 'UK' },
  { tz: 'Europe/Dublin', city: 'Dublin', country: 'Ireland' },
  { tz: 'Europe/Paris', city: 'Paris', country: 'France' },
  { tz: 'Europe/Brussels', city: 'Brussels', country: 'Belgium' },
  { tz: 'Europe/Amsterdam', city: 'Amsterdam', country: 'Netherlands' },
  { tz: 'Europe/Berlin', city: 'Berlin', country: 'Germany' },
  { tz: 'Europe/Zurich', city: 'Zürich', country: 'Switzerland' },
  { tz: 'Europe/Vienna', city: 'Wien', country: 'Austria' },
  { tz: 'Europe/Prague', city: 'Praha', country: 'Czechia' },
  { tz: 'Europe/Warsaw', city: 'Warszawa', country: 'Poland' },
  { tz: 'Europe/Stockholm', city: 'Stockholm', country: 'Sweden' },
  { tz: 'Europe/Oslo', city: 'Oslo', country: 'Norway' },
  { tz: 'Europe/Copenhagen', city: 'København', country: 'Denmark' },
  { tz: 'Europe/Helsinki', city: 'Helsinki', country: 'Finland' },
  { tz: 'Europe/Madrid', city: 'Madrid', country: 'Spain' },
  { tz: 'Atlantic/Canary', city: 'Las Palmas', country: 'Spain' },
  { tz: 'Europe/Rome', city: 'Roma', country: 'Italy' },
  { tz: 'Europe/Athens', city: 'Athína', country: 'Greece' },
  { tz: 'Europe/Kyiv', city: 'Kyiv', country: 'Ukraine' },
  { tz: 'Europe/Bucharest', city: 'București', country: 'Romania' },
  { tz: 'Europe/Istanbul', city: 'İstanbul', country: 'Turkey' },
  { tz: 'Europe/Moscow', city: 'Moskva', country: 'Russia' },
  { tz: 'Africa/Cairo', city: 'Cairo', country: 'Egypt' },
  { tz: 'Africa/Lagos', city: 'Lagos', country: 'Nigeria' },
  { tz: 'Africa/Accra', city: 'Accra', country: 'Ghana' },
  { tz: 'Africa/Nairobi', city: 'Nairobi', country: 'Kenya' },
  { tz: 'Africa/Addis_Ababa', city: 'Addis Ababa', country: 'Ethiopia' },
  { tz: 'Africa/Johannesburg', city: 'Johannesburg', country: 'South Africa' },
  { tz: 'Asia/Dubai', city: 'Dubai', country: 'UAE' },
  { tz: 'Asia/Tehran', city: 'Tehran', country: 'Iran' },
  { tz: 'Asia/Baku', city: 'Baku', country: 'Azerbaijan' },
  { tz: 'Asia/Tbilisi', city: 'Tbilisi', country: 'Georgia' },
  { tz: 'Asia/Karachi', city: 'Karachi', country: 'Pakistan' },
  { tz: 'Asia/Kolkata', city: 'Mumbai · Delhi', country: 'India' },
  { tz: 'Asia/Kathmandu', city: 'Kathmandu', country: 'Nepal' },
  { tz: 'Asia/Colombo', city: 'Colombo', country: 'Sri Lanka' },
  { tz: 'Asia/Dhaka', city: 'Dhaka', country: 'Bangladesh' },
  { tz: 'Asia/Yangon', city: 'Yangon', country: 'Myanmar' },
  { tz: 'Asia/Bangkok', city: 'Bangkok', country: 'Thailand' },
  { tz: 'Asia/Ho_Chi_Minh', city: 'Ho Chi Minh City', country: 'Vietnam' },
  { tz: 'Asia/Jakarta', city: 'Jakarta', country: 'Indonesia' },
  { tz: 'Asia/Singapore', city: 'Singapore', country: 'Singapore' },
  { tz: 'Asia/Kuala_Lumpur', city: 'Kuala Lumpur', country: 'Malaysia' },
  { tz: 'Asia/Manila', city: 'Manila', country: 'Philippines' },
  { tz: 'Asia/Hong_Kong', city: 'Hong Kong', country: 'Hong Kong' },
  { tz: 'Asia/Shanghai', city: 'Shanghai · Beijing', country: 'China' },
  { tz: 'Asia/Taipei', city: 'Taipei', country: 'Taiwan' },
  { tz: 'Asia/Seoul', city: 'Seoul', country: 'South Korea' },
  { tz: 'Asia/Tokyo', city: 'Tokyo', country: 'Japan' },
  { tz: 'Australia/Perth', city: 'Perth', country: 'Australia' },
  { tz: 'Australia/Darwin', city: 'Darwin', country: 'Australia' },
  { tz: 'Australia/Brisbane', city: 'Brisbane', country: 'Australia' },
  { tz: 'Australia/Adelaide', city: 'Adelaide', country: 'Australia' },
  { tz: 'Australia/Sydney', city: 'Sydney', country: 'Australia' },
  { tz: 'Australia/Melbourne', city: 'Melbourne', country: 'Australia' },
  { tz: 'Pacific/Auckland', city: 'Auckland', country: 'New Zealand' },
  { tz: 'Pacific/Fiji', city: 'Suva', country: 'Fiji' },
  { tz: 'UTC', city: 'UTC', country: '' },
];

const HINT_BY_TZ = new Map(CITY_HINTS.map(h => [h.tz, h]));

/** Extra search words so "Beijing" or "Delhi" find their zone. */
const ALIASES: Record<string, string[]> = {
  'Asia/Shanghai': ['beijing', 'pekin', 'china'],
  'Asia/Kolkata': ['delhi', 'new delhi', 'bengaluru', 'bangalore', 'calcutta', 'india'],
  'America/Sao_Paulo': ['rio de janeiro', 'brasilia', 'brasília'],
  'Europe/Kyiv': ['kiev'],
  'Asia/Ho_Chi_Minh': ['hanoi', 'saigon'],
  'Europe/Lisbon': ['lisbon', 'lisboa'],
  'America/Mexico_City': ['mexico city'],
};

const FALLBACK_ZONES = CITY_HINTS.map(h => h.tz);

/** Every zone the browser knows, with a display name attached. */
export function allZones(): ZoneEntry[] {
  let ids: string[] = FALLBACK_ZONES;
  try {
    const supported = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf;
    if (typeof supported === 'function') {
      const list = supported('timeZone');
      if (Array.isArray(list) && list.length > 0) ids = ['UTC', ...list.filter(z => z !== 'UTC')];
    }
  } catch {
    // Older engines throw instead of returning nothing.
  }
  return ids.map(tz => {
    const hint = HINT_BY_TZ.get(tz);
    if (hint) return { tz, city: hint.city, country: hint.country };
    const tail = (tz.split('/').pop() || tz).replace(/_/g, ' ');
    const region = tz.split('/')[0].replace(/_/g, ' ');
    return { tz, city: tail, country: region === tail ? '' : region };
  });
}

/** Accent-insensitive so "bogota" finds "Bogotá". */
const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[_\s]+/g, ' ')
    .trim();

export function searchZones(zones: ZoneEntry[], query: string, limit = 60): ZoneEntry[] {
  const q = fold(query);
  if (!q) {
    // With no query, lead with the cities people actually look for rather than
    // with Africa/Abidjan, which is what alphabetical order gives.
    const hinted = zones.filter(z => HINT_BY_TZ.has(z.tz));
    return hinted.slice(0, limit);
  }
  const scored: { z: ZoneEntry; score: number }[] = [];
  zones.forEach(z => {
    const city = fold(z.city);
    const tz = fold(z.tz);
    const country = fold(z.country);
    const aliases = (ALIASES[z.tz] || []).map(fold);
    let score = -1;
    if (city.startsWith(q)) score = 0;
    else if (aliases.some(a => a.startsWith(q))) score = 1;
    else if (city.includes(q)) score = 2;
    else if (country.startsWith(q)) score = 3;
    else if (tz.includes(q)) score = 4;
    else if (aliases.some(a => a.includes(q))) score = 5;
    if (score >= 0) scored.push({ z, score });
  });
  scored.sort((a, b) => a.score - b.score || a.z.city.localeCompare(b.z.city));
  return scored.slice(0, limit).map(s => s.z);
}

export function entryFor(tz: string, zones: ZoneEntry[]): ZoneEntry {
  return zones.find(z => z.tz === tz) || { tz, city: (tz.split('/').pop() || tz).replace(/_/g, ' '), country: '' };
}

export function localZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}
