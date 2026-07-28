// Klipy data layer — talks to the backend at /api/kick (src/pages/api/kick.ts,
// same origin — runs as a Vercel serverless function). The backend keeps the
// Kick client_secret server-side and bypasses Cloudflare for the unofficial
// clips endpoint. Official categories/livestreams are reliable; clips are
// best-effort (fall back to live channels when blocked).

const API = '/api/kick';

export interface KCategory {
  id: string;
  name: string;
  thumbnail: string;
}

export interface KItem {
  kind: 'clip' | 'live';
  id: string;
  title: string;
  channel: string;
  views: number;
  thumbnail: string;
  avatar?: string;
  url: string;          // external kick url (clip url, usable by Kickbolt) or channel url
  playbackUrl?: string; // direct mp4 for a clip (if provided)
  embedUrl?: string;    // player.kick.com embed for a live channel
  duration?: string;
  created?: string;
}

async function api(params: Record<string, string>): Promise<any> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API}?${qs}`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Kick proxy ${res.status}`);
  return res.json();
}

export async function searchCategories(q: string): Promise<KCategory[]> {
  try {
    const data = await api({ action: 'categories', q: q.trim() });
    const arr: any[] = Array.isArray(data?.data) ? data.data : [];
    return arr.map((c) => ({ id: String(c.id), name: c.name, thumbnail: c.thumbnail || '' }));
  } catch {
    return [];
  }
}

function mapClip(c: any): KItem {
  const slug = c.channel?.slug || c.channel?.username || c.creator?.username || c.creator?.slug || '';
  const id = String(c.id ?? Math.random().toString(36).slice(2));
  return {
    kind: 'clip',
    id,
    title: c.title || 'Clip',
    channel: c.channel?.username || c.channel?.slug || c.creator?.username || slug,
    views: c.view_count ?? c.views ?? 0,
    thumbnail: c.thumbnail_url || c.thumbnail || '',
    // URL shaped so Kickbolt can parse & download it (?clip=ID)
    url: slug ? `https://kick.com/${slug}?clip=${id}` : (c.clip_url || '#'),
    playbackUrl: c.clip_url || c.video_url || undefined,
    duration: c.duration ? Math.round(Number(c.duration)) + 's' : '',
    created: c.created_at ? new Date(c.created_at).toLocaleDateString() : '',
  };
}

/**
 * Fetch ALL clips for a category/time window, not just the first page.
 * Kick's unofficial clips endpoint paginates ~20 at a time via `nextCursor`
 * (sorted by view count descending), so without following the cursor,
 * low-view clips near the end of the ranking never show up. Follows
 * nextCursor until it runs out (or a safety cap is hit) and returns
 * everything collected so far even if a later page fails.
 */
export async function getClips(categoryId: string, time: string): Promise<KItem[]> {
  const all: KItem[] = [];
  const seen = new Set<string>();
  let cursor: string | undefined;
  const MAX_PAGES = 25; // ~500 clips safety cap against runaway pagination
  for (let page = 0; page < MAX_PAGES; page++) {
    try {
      const params: Record<string, string> = { action: 'clips', category_id: categoryId, time, sort: 'view' };
      if (cursor) params.cursor = cursor;
      const data = await api(params);
      const arr: any[] = Array.isArray(data?.clips) ? data.clips : Array.isArray(data?.data) ? data.data : [];
      for (const c of arr.map(mapClip)) {
        if (c.thumbnail && !seen.has(c.id)) {
          seen.add(c.id);
          all.push(c);
        }
      }
      const next = typeof data?.nextCursor === 'string' ? data.nextCursor : undefined;
      if (!next || next === cursor || arr.length === 0) break;
      cursor = next;
    } catch {
      break;
    }
  }
  return all;
}

/** Live channels currently streaming in a category (official API, reliable). */
export async function getLivestreams(categoryId: string): Promise<KItem[]> {
  try {
    const data = await api({ action: 'livestreams', category_id: categoryId });
    const arr: any[] = Array.isArray(data?.data) ? data.data : [];
    return arr.map((s) => ({
      kind: 'live' as const,
      id: String(s.slug || s.channel_id),
      title: s.stream_title || s.slug,
      channel: s.slug,
      views: s.viewer_count ?? 0,
      thumbnail: s.thumbnail || '',
      avatar: s.profile_picture || '',
      url: `https://kick.com/${s.slug}`,
      embedUrl: `https://player.kick.com/${s.slug}`,
    }));
  } catch {
    return [];
  }
}
