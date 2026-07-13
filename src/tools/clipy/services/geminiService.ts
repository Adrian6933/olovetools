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
    // Balanced HD quality (1280x720) for performance
    return url.replace(/%?{width}/g, '1280').replace(/%?{height}/g, '720');
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
            duration: Math.round(clip.duration) + 's'
        };
    } catch (error) {
        return null;
    }
};

export const searchTwitchClips = async (
  categoryId: string,
  categoryName: string,
  timeFilter: TimeFilter,
  cursor?: string | null,
  anchorISO?: string
): Promise<{ clips: Clip[], cursor: string | null }> => {
    try {
        const headers = await getHeaders();
        const now = anchorISO ? new Date(anchorISO) : new Date();
        let startDateStr = '';
        const endDateStr = now.toISOString();

        switch (timeFilter) {
            case TimeFilter.DAY:
                startDateStr = new Date(now.getTime() - (24 * 60 * 60 * 1000)).toISOString();
                break;
            case TimeFilter.WEEK:
                startDateStr = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)).toISOString();
                break;
            case TimeFilter.MONTH:
                startDateStr = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString();
                break;
        }

        let url = `https://api.twitch.tv/helix/clips?game_id=${categoryId}&first=100`;
        if (startDateStr) url += `&started_at=${startDateStr}&ended_at=${endDateStr}`;
        if (cursor) url += `&after=${cursor}`;

        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error("Twitch Clip API Error");
        
        const data = await response.json();
        let clipsData = data.data || [];
        const nextCursor = data.pagination?.cursor || null;

        clipsData.sort((a: any, b: any) => b.view_count - a.view_count);

        const mappedClips: Clip[] = clipsData.map((clip: any) => ({
            id: clip.id,
            title: clip.title,
            broadcaster_name: clip.broadcaster_name,
            broadcaster_id: clip.broadcaster_id,
            view_count: clip.view_count,
            thumbnail_url: getThumbnailUrl(clip.thumbnail_url),
            url: clip.url,
            created_at: new Date(clip.created_at).toLocaleDateString(),
            created_at_iso: clip.created_at,
            duration: Math.round(clip.duration) + 's'
        }));

        return { clips: mappedClips, cursor: nextCursor };
    } catch (error) {
        return { clips: [], cursor: null };
    }
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