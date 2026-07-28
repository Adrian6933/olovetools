import { Category, Clip, TimeFilter, SortType } from "../types";

// The Twitch app token is issued by /api/twitch/token (src/pages/api/twitch/
// token.ts, same origin — Vercel serverless function) so the client_secret
// never ships in the browser bundle.
let cachedAuth: { token: string; clientId: string; expiresAt: number } | null = null;

const getAuth = async (): Promise<{ token: string; clientId: string }> => {
  if (cachedAuth && cachedAuth.expiresAt > Date.now() + 60_000) return cachedAuth;

  try {
    const response = await fetch('/api/twitch/token');
    if (!response.ok) {
      throw new Error(`Auth Failed: ${response.statusText}`);
    }
    const data = await response.json();
    if (!data.access_token) throw new Error('Auth Failed: empty token');
    cachedAuth = {
      token: data.access_token,
      clientId: data.client_id,
      expiresAt: data.expires_at || Date.now() + 3_000_000
    };
    return cachedAuth;
  } catch (error) {
    console.error("Authentication Error:", error);
    throw error;
  }
};

const getHeaders = async () => {
    const { token, clientId } = await getAuth();
    return {
        'Client-Id': clientId,
        'Authorization': `Bearer ${token}`
    };
};

// Mapeo de alias comunes para mejorar la precisión de búsqueda
const ALIASES: Record<string, string> = {
    'gta 5': 'grand theft auto v',
    'gta v': 'grand theft auto v',
    'gta5': 'grand theft auto v',
    'cs2': 'counter-strike 2',
    'cs 2': 'counter-strike 2',
    'lol': 'league of legends',
    'cod': 'call of duty',
    'valorant': 'valorant',
    'rust': 'rust'
};

const getBoxArtUrl = (url: string) => {
    if (!url) return 'https://placehold.co/600x800/202020/white?text=No+Image';
    // Balanced high quality (600x800) for performance
    let newUrl = url.replace(/-{width}x{height}/g, '-600x800');
    if (newUrl === url) {
        newUrl = url.replace(/-\d+x\d+/g, '-600x800');
    }
    newUrl = newUrl.replace('{width}', '600').replace('{height}', '800');
    return newUrl;
};

const getThumbnailUrl = (url: string) => {
    if (!url) return 'https://placehold.co/1280x720/202020/white?text=No+Preview';
    // Las tarjetas del grid renderizan a ~276-380px de ancho real, así que pedir
    // 1280x720 a Twitch por cada clip es 4-5x más píxeles (y bytes) de los que
    // se llegan a pintar. 640x360 sigue viéndose nítido incluso en pantallas
    // retina a ese tamaño de tarjeta.
    return url.replace(/%?{width}/g, '640').replace(/%?{height}/g, '360');
};

export const searchTwitchCategories = async (query: string, cursor?: string | null): Promise<{ categories: Category[], cursor: string | null }> => {
    try {
        const headers = await getHeaders();
        let endpoint = '';
        const isPopular = query === 'popular' || !query.trim();
        
        if (isPopular) {
            endpoint = `https://api.twitch.tv/helix/games/top?first=24${cursor ? `&after=${cursor}` : ''}`;
        } else {
            endpoint = `https://api.twitch.tv/helix/search/categories?query=${encodeURIComponent(query)}&first=24${cursor ? `&after=${cursor}` : ''}`;
        }

        const response = await fetch(endpoint, { headers });
        if (!response.ok) throw new Error("Twitch API Error: " + response.statusText);
        
        const data = await response.json();
        const nextCursor = data.pagination?.cursor || null;

        let results = data.data.map((item: any) => ({
            id: item.id,
            name: item.name,
            box_art_url: getBoxArtUrl(item.box_art_url),
            viewer_count: 0
        }));

        // Lógica de Relevancia Inteligente para Búsquedas
        if (!isPopular && query.trim().length > 0) {
            const cleanQuery = query.toLowerCase().trim();
            const aliasMatch = ALIASES[cleanQuery];

            results.sort((a: Category, b: Category) => {
                const nameA = a.name.toLowerCase().trim();
                const nameB = b.name.toLowerCase().trim();

                // 1. Prioridad Máxima: Coincidencia Exacta o con Alias
                const isExactA = nameA === cleanQuery || (aliasMatch && nameA === aliasMatch);
                const isExactB = nameB === cleanQuery || (aliasMatch && nameB === aliasMatch);

                if (isExactA && !isExactB) return -1;
                if (isExactB && !isExactA) return 1;

                // 2. Prioridad Media: Empieza por el término (Ej: "GTA V..." antes que "...GTA V")
                const startsA = nameA.startsWith(cleanQuery);
                const startsB = nameB.startsWith(cleanQuery);
                if (startsA && !startsB) return -1;
                if (startsB && !startsA) return 1;

                return 0;
            });
        }

        return { categories: results, cursor: nextCursor };
    } catch (error) {
        return { categories: [], cursor: null };
    }
};

export const getClipById = async (clipId: string): Promise<Clip | null> => {
    try {
        const headers = await getHeaders();
        const response = await fetch(`https://api.twitch.tv/helix/clips?id=${clipId}`, { headers });
        if (!response.ok) return null;
        const data = await response.json();
        if (!data.data || data.data.length === 0) return null;
        
        const clip = data.data[0];
        return {
            id: clip.id,
            title: clip.title,
            broadcaster_name: clip.broadcaster_name,
            broadcaster_id: clip.broadcaster_id,
            view_count: clip.view_count,
            thumbnail_url: getThumbnailUrl(clip.thumbnail_url),
            url: clip.url,
            created_at: new Date(clip.created_at).toLocaleDateString(),
            created_at_iso: clip.created_at,
            duration: Math.round(clip.duration) + 's',
            language: clip.language || ''
        };
    } catch (error) {
        return null;
    }
};

// Unauthenticated public GQL endpoint (same one TwitchBolt uses to resolve a
// clip's real MP4 for download) — needed because the Helix API used above
// never exposes a playable video URL, only a thumbnail template. This is the
// only way to get a direct <video> source instead of Twitch's iframe embed,
// which is what lets us force 2x playback: the embed iframe is cross-origin,
// so there's no way to reach its internal <video> element or set its
// playbackRate from the parent page.
const CLIP_SOURCE_CLIENT_IDS = [
    "ue6666qo983sx6so1c0vnaz41db287",
    "kd1unb4r3yd4g17k2488dbw3v89usf",
    "kimne78kx3ncx6brgo4mv6wki5h1ko",
];
const GQL_ENDPOINT = "https://gql.twitch.tv/gql";

export const getClipVideoSource = async (slug: string): Promise<string | null> => {
    const query = `query GetClip($slug: ID!) { clip(slug: $slug) { playbackAccessToken(params: { platform: "web", playerBackend: "mediaplayer", playerType: "site" }) { signature value } videoQualities { quality sourceURL } } }`;

    for (const clientId of CLIP_SOURCE_CLIENT_IDS) {
        try {
            const res = await fetch(GQL_ENDPOINT, {
                method: 'POST',
                headers: { 'Client-ID': clientId, 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, variables: { slug } }),
            });
            if (!res.ok) continue;
            const json = await res.json();
            const clip = json?.data?.clip;
            const qualities = clip?.videoQualities;
            if (!clip || !Array.isArray(qualities) || qualities.length === 0) continue;

            const best = [...qualities].sort((a: any, b: any) => (parseInt(b.quality, 10) || 0) - (parseInt(a.quality, 10) || 0))[0];
            if (!best?.sourceURL) continue;

            const sig = clip.playbackAccessToken?.signature;
            const token = clip.playbackAccessToken?.value;
            if (!sig || !token) return best.sourceURL;
            const sep = best.sourceURL.includes('?') ? '&' : '?';
            return `${best.sourceURL}${sep}sig=${sig}&token=${encodeURIComponent(token)}`;
        } catch {
            // Try the next Client-ID
        }
    }
    return null;
};

const mapClip = (clip: any): Clip => ({
    id: clip.id,
    title: clip.title,
    broadcaster_name: clip.broadcaster_name,
    broadcaster_id: clip.broadcaster_id,
    view_count: clip.view_count,
    thumbnail_url: getThumbnailUrl(clip.thumbnail_url),
    url: clip.url,
    created_at: new Date(clip.created_at).toLocaleDateString(),
    created_at_iso: clip.created_at,
    duration: Math.round(clip.duration) + 's',
    language: clip.language || ''
});

const getDateRangeMs = (timeFilter: TimeFilter): number => {
    switch (timeFilter) {
        case TimeFilter.WEEK: return 7 * 24 * 60 * 60 * 1000;
        case TimeFilter.MONTH: return 30 * 24 * 60 * 60 * 1000;
        case TimeFilter.DAY:
        default: return 24 * 60 * 60 * 1000;
    }
};

// NOTE: does NOT swallow errors into { clips: [], cursor: null } — a transient
// failure (network blip, rate limit, expired token) must not look identical
// to "Twitch says there are no more clips," or infinite-scroll/"Load All"
// permanently stop short of the full list (cutting off the low-view tail)
// with no visible error. Callers are responsible for catching and, on
// failure, leaving the previous cursor in place so pagination can resume.
export const searchTwitchClips = async (
  categoryId: string,
  categoryName: string,
  timeFilter: TimeFilter,
  cursor?: string | null,
  anchorISO?: string
): Promise<{ clips: Clip[], cursor: string | null }> => {
    const headers = await getHeaders();
    const now = anchorISO ? new Date(anchorISO) : new Date();
    const endDateStr = now.toISOString();
    const startDateStr = new Date(now.getTime() - getDateRangeMs(timeFilter)).toISOString();

    let url = `https://api.twitch.tv/helix/clips?game_id=${categoryId}&first=100`;
    if (startDateStr) url += `&started_at=${startDateStr}&ended_at=${endDateStr}`;
    if (cursor) url += `&after=${cursor}`;

    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`Twitch Clip API Error: ${response.status}`);

    const data = await response.json();
    let clipsData = data.data || [];
    const nextCursor = data.pagination?.cursor || null;

    clipsData.sort((a: any, b: any) => b.view_count - a.view_count);

    return { clips: clipsData.map(mapClip), cursor: nextCursor };
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Twitch's Clips API appears to cap how deep a single (game_id, time-range)
// query can be paginated: a broad 24h window on a hot category (Just Chatting)
// stopped dead at ~1080 clips with a "no more results" cursor, while a single
// 1-HOUR slice of that same category/window alone returned 869 clips on its
// own — including hundreds sitting at exactly 1 view. The low-view long tail
// isn't missing from Twitch's data, it's just unreachable through one big
// query. Slicing the requested window into narrower chunks and paginating
// each one independently is what actually reaches it.
export interface TwitchCrawlPosition {
  sliceIndex: number;
  cursor: string | null;
}

export const searchAllTwitchClips = async (
  categoryId: string,
  timeFilter: TimeFilter,
  anchorISO: string | undefined,
  onClips: (clips: Clip[]) => void,
  // Comprobado antes de cada petición (no aborta una ya en marcha): así el
  // llamador puede parar el barrido en cuanto quiera — p.ej. la carga
  // automática en segundo plano del modo rendimiento, que debe detenerse en
  // el sitio si se desactiva el modo a media carga en vez de terminar igual.
  shouldContinue?: () => boolean,
  // Punto por el que se quedó la última vez (para retomar el barrido justo
  // ahí en vez de volver a empezar desde la franja horaria más antigua).
  resumeFrom?: TwitchCrawlPosition,
  // Límite de páginas de Twitch (no de franjas) para ESTA llamada concreta —
  // el scroll incremental pasa 1 para traer solo un puñado de clips por vez;
  // "Load all" no lo pasa y usa el límite de seguridad completo.
  maxPagesThisCall?: number,
): Promise<{ completed: boolean; resumeFrom?: TwitchCrawlPosition }> => {
    const now = anchorISO ? new Date(anchorISO) : new Date();
    const endMs = now.getTime();
    const rangeMs = getDateRangeMs(timeFilter);
    // 1h slices for a 24h window, 1-day slices for week/month (finer slicing
    // for week/month would mean hundreds of requests — impractical for a
    // single button click).
    const sliceMs = timeFilter === TimeFilter.DAY ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const startMs = endMs - rangeMs;

    const slices: [number, number][] = [];
    for (let sliceStart = startMs; sliceStart < endMs; sliceStart += sliceMs) {
        slices.push([sliceStart, Math.min(sliceStart + sliceMs, endMs)]);
    }

    const MAX_TOTAL_PAGES = 400; // safety ceiling across every slice combined
    const pageLimit = Math.min(maxPagesThisCall ?? MAX_TOTAL_PAGES, MAX_TOTAL_PAGES);
    let totalPages = 0;
    const startSliceIndex = resumeFrom?.sliceIndex ?? 0;

    for (let sliceIndex = startSliceIndex; sliceIndex < slices.length; sliceIndex++) {
        if (shouldContinue && !shouldContinue()) return { completed: false, resumeFrom: { sliceIndex, cursor: null } };
        if (totalPages >= pageLimit) return { completed: false, resumeFrom: { sliceIndex, cursor: null } };
        const [sliceStartMs, sliceEndMs] = slices[sliceIndex];
        const startISO = new Date(sliceStartMs).toISOString();
        const endISO = new Date(sliceEndMs).toISOString();
        let cursor: string | null = sliceIndex === startSliceIndex ? (resumeFrom?.cursor ?? null) : null;

        do {
            if (shouldContinue && !shouldContinue()) return { completed: false, resumeFrom: { sliceIndex, cursor } };
            if (totalPages >= pageLimit) return { completed: false, resumeFrom: { sliceIndex, cursor } };
            const headers = await getHeaders();
            let url = `https://api.twitch.tv/helix/clips?game_id=${categoryId}&first=100&started_at=${startISO}&ended_at=${endISO}`;
            if (cursor) url += `&after=${cursor}`;

            const response = await fetch(url, { headers });
            if (!response.ok) throw new Error(`Twitch Clip API Error: ${response.status}`);

            const data = await response.json();
            const clipsData = data.data || [];
            cursor = data.pagination?.cursor || null;
            totalPages++;
            if (clipsData.length > 0) onClips(clipsData.map(mapClip));
            if (cursor && totalPages < pageLimit) await sleep(150);
        } while (cursor && totalPages < pageLimit);

        if (cursor) return { completed: false, resumeFrom: { sliceIndex, cursor } };
    }
    return { completed: true };
};

export const getTwitchUserAvatars = async (userIds: string[]): Promise<Record<string, string>> => {
    if (userIds.length === 0) return {};
    try {
        const headers = await getHeaders();
        const batchSize = 100;
        const avatars: Record<string, string> = {};

        for (let i = 0; i < userIds.length; i += batchSize) {
            const batch = userIds.slice(i, i + batchSize);
            const idQuery = batch.map(id => `id=${id}`).join('&');
            const response = await fetch(`https://api.twitch.tv/helix/users?${idQuery}`, { headers });
            if (response.ok) {
                const data = await response.json();
                data.data.forEach((user: any) => {
                    avatars[user.id] = user.profile_image_url;
                });
            }
        }
        return avatars;
    } catch (error) {
        return {};
    }
};

export const fetchTwitchSuggestions = async (query: string): Promise<string[]> => {
    if (!query || query.length < 1) return [];
    try {
        const { categories } = await searchTwitchCategories(query);
        const uniqueNames = Array.from(new Set(categories.map(c => c.name)));
        return uniqueNames.slice(0, 8);
    } catch (e) {
        return [];
    }
};