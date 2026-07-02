// Klipy data layer — talks to the server-side PHP proxy (public/api/kick.php).
// The PHP proxy keeps the Kick client_secret server-side and bypasses Cloudflare
// for the unofficial clips endpoint. Official categories/livestreams are reliable;
// clips are best-effort (fall back to live channels when blocked).

const API = '/api/kick.php';

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

/** Try to fetch clips for a category. Returns [] if blocked/empty. */
export async function getClips(categoryId: string, time: string): Promise<KItem[]> {
  try {
    const data = await api({ action: 'clips', category_id: categoryId, time, sort: 'view' });
    const arr: any[] = Array.isArray(data?.clips) ? data.clips : Array.isArray(data?.data) ? data.data : [];
    return arr.map(mapClip).filter((c) => c.thumbnail);
  } catch {
    return [];
  }
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
