// Klipy data layer.
//
// Categorias y directos van por /api/kick (funcion serverless en Vercel), que
// guarda el client_secret de Kick del lado del servidor. Eso es API oficial y
// es fiable.
//
// Los CLIPS van directos desde el navegador, sin pasar por nuestro backend, y
// eso es deliberado: el endpoint v2 de clips es no oficial y esta detras del
// WAF de Kick, que bloquea las IP de centro de datos. Desde Vercel devolvia
// siempre 403 "Request blocked by security policy", asi que la herramienta
// nunca mostraba un solo clip y caia al respaldo de canales en directo.
//
// Desde el navegador del visitante si pasa: comprobado que kick.com responde
// con access-control-allow-origin: https://olovetools.com, o sea que permite
// la peticion cruzada. La IP que pide es la del visitante, no la nuestra.

const API = '/api/kick';

export interface KCategory {
  id: string;
  /**
   * Identificador que usa el endpoint de clips. La API oficial NO lo devuelve
   * (solo id, name y thumbnail), asi que se deriva del nombre. El endpoint v2
   * rechaza el id numerico con un 404 "No query results for model Subcategory",
   * que es exactamente lo que pasaba antes.
   */
  slug: string;
  name: string;
  thumbnail: string;
  /** Espectadores sumados de los directos de esa categoria. 0 = no se sabe. */
  viewers?: number;
  /** Cuantos canales la estan emitiendo ahora mismo. */
  channels?: number;
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

/**
 * Deriva el slug de Kick a partir del nombre visible de la categoria.
 * "Just Chatting" -> just-chatting, "Grand Theft Auto V" -> grand-theft-auto-v.
 * Comprobado contra el endpoint real con nombres de su propio catalogo.
 */
export function categorySlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // quita acentos, no la letra
    .toLowerCase()
    .replace(/['\u2019]/g, '')          // apostrofes fuera, no separan palabra
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Segundo candidato para nombres con "&" o "and": Kick a veces conserva el slug
 * corto de cuando la categoria se llamaba distinto. "Slots & Casino" responde a
 * `slots`, no a `slots-casino`; "Sports & Fitness" a `sports`. No siempre
 * acierta ("Music & Performing Arts" no es `music`), pero recupera casos reales
 * que si no caerian al respaldo de directos.
 */
function shortCategorySlug(name: string): string | null {
  const head = name.split(/\s*&\s*|\s+and\s+/i)[0];
  if (!head || head === name) return null;
  const s = categorySlug(head);
  return s && s !== categorySlug(name) ? s : null;
}

async function api(params: Record<string, string>): Promise<any> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API}?${qs}`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Kick proxy ${res.status}`);
  return res.json();
}

export async function searchCategories(q: string): Promise<KCategory[]> {
  const termino = q.trim();
  // "popular" es el valor con el que la interfaz compartida pide el catalogo de
  // entrada. Antes se traducia a una busqueda de texto vacia, que el backend
  // convertia en q="a" porque la API lo exige: salian los juegos cuyo NOMBRE
  // lleva una a ("A Short Hike", "A Gracewind Tale") y la rejilla los pintaba
  // como un ranking. Ahora hay un top de verdad, sumando los espectadores de
  // los directos por categoria, que es como ordena la propia pagina de Kick.
  if (!termino || termino.toLowerCase() === 'popular') {
    try {
      const data = await api({ action: 'top-categories' });
      const arr: any[] = Array.isArray(data?.data) ? data.data : [];
      return arr.map((c) => ({
        id: String(c.id),
        slug: categorySlug(c.name || ''),
        name: c.name,
        thumbnail: c.thumbnail || '',
        viewers: Number(c.viewers) || 0,
        channels: Number(c.channels) || 0,
      }));
    } catch {
      return [];
    }
  }

  try {
    const data = await api({ action: 'categories', q: termino });
    const arr: any[] = Array.isArray(data?.data) ? data.data : [];
    return arr.map((c) => ({ id: String(c.id), slug: categorySlug(c.name || ''), name: c.name, thumbnail: c.thumbnail || '' }));
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
const KICK_V2 = 'https://kick.com/api/v2';

/**
 * Todos los clips de una categoria, no solo la primera pagina.
 *
 * Se pide DIRECTO desde el navegador (ver la cabecera del fichero): por nuestro
 * backend Kick responde 403 a las IP de centro de datos.
 *
 * El endpoint pagina de ~20 en ~20 con `nextCursor` (ordenado por vistas), asi
 * que sin seguir el cursor los clips con menos vistas nunca aparecian. Sigue el
 * cursor hasta agotarlo y devuelve lo reunido aunque una pagina posterior falle.
 */
/**
 * El slug REAL de una categoria, preguntandoselo a Kick.
 *
 * No se puede deducir del nombre, y no es un detalle: medido contra la API,
 *   "Tibia"                     -> "Tibia"                  (con mayuscula)
 *   "Grand Theft Auto V (GTA)"  -> "grand-theft-auto-v"      (sin el parentesis)
 *   "Project Zomboid"           -> "Project-Zomboid"         (con mayusculas)
 *   "Garena Free Fire"          -> "Garena-Free-Fire"
 *   "Mobile Legends: Bang Bang" -> "mobile-legends: - bang-bang"
 * Con el slug derivado del nombre, 7 de cada 22 categorias no cargaban NI UN
 * clip: la peticion daba 404 y la lista se quedaba vacia para siempre.
 *
 * Se pide directo desde el navegador, como los clips: por nuestro servidor
 * Cloudflare responde 403 pase lo que pase, no solo desde centros de datos.
 */
const slugsResueltos = new Map<string, string | null>();

export async function resolveCategorySlug(name: string, id?: string): Promise<string | null> {
  const clave = `${id || ''}|${name}`;
  if (slugsResueltos.has(clave)) return slugsResueltos.get(clave)!;

  let encontrado: string | null = null;
  try {
    const res = await fetch(`https://kick.com/api/search?searched_word=${encodeURIComponent(name)}`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      const cats: any[] = Array.isArray(data?.categories) ? data.categories : [];
      // El id es la unica coincidencia exacta: la busqueda devuelve parecidos
      // ("Tibia" trae tambien "TibiaME") y varios juegos comparten palabras.
      const porId = id ? cats.find((c) => String(c.id) === String(id)) : undefined;
      const porNombre = cats.find((c) => (c.name || '').toLowerCase() === name.toLowerCase());
      const elegido = porId || porNombre || cats[0];
      if (elegido?.slug) encontrado = String(elegido.slug);
    }
  } catch { /* sin red o bloqueado: se sigue con el slug derivado */ }

  slugsResueltos.set(clave, encontrado);
  return encontrado;
}

export async function getClips(slugOrName: string, time: string, name?: string, id?: string): Promise<KItem[]> {
  if (!slugOrName) return [];
  // Primero el slug derivado, que acierta en dos de cada tres y ahorra una
  // peticion. Si no da nada, se le pregunta a Kick cual es de verdad.
  const candidatos = [slugOrName];
  const corto = name ? shortCategorySlug(name) : null;
  if (corto) candidatos.push(corto);
  for (const cand of candidatos) {
    const r = await clipsPorSlug(cand, time);
    if (r.length) return r;
  }

  if (name) {
    const real = await resolveCategorySlug(name, id);
    if (real && !candidatos.includes(real)) {
      const r = await clipsPorSlug(real, time);
      if (r.length) return r;
    }
  }
  return [];
}

/** Una pasada completa de paginacion para un slug concreto. */
async function clipsPorSlug(categorySlug: string, time: string): Promise<KItem[]> {
  const all: KItem[] = [];
  const seen = new Set<string>();
  let cursor: string | undefined;
  const MAX_PAGES = 25; // ~500 clips, tope de seguridad contra paginacion sin fin
  for (let page = 0; page < MAX_PAGES; page++) {
    try {
      const qs = new URLSearchParams({ sort: 'view', time });
      if (cursor) qs.set('cursor', cursor);
      const res = await fetch(`${KICK_V2}/categories/${encodeURIComponent(categorySlug)}/clips?${qs}`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) break;
      const data = await res.json();
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

// ============================================================================
// Superficie que esperan los componentes compartidos (src/components/clips)
// ----------------------------------------------------------------------------
// Clipy y Klipy usan la misma interfaz, y esos componentes reciben por props lo
// que cada tool resuelve contra su API. Esto es la mitad de Kick.
// ============================================================================

/**
 * Sugerencias del buscador: nombres de categoria que empiezan por lo tecleado.
 * Kick no tiene endpoint de autocompletado, asi que se reutiliza la busqueda de
 * categorias, que es lo mismo que se va a mostrar despues.
 */
export async function fetchKickSuggestions(query: string): Promise<string[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const cats = await searchCategories(q);
  return cats.slice(0, 8).map((c) => c.name);
}

/**
 * MP4 reproducible de un clip. Kick lo devuelve ya en el propio listado
 * (`clip_url` / `video_url`), asi que en la practica el reproductor no necesita
 * pedir nada: se le pasa el que ya venia. Esta funcion cubre el caso de entrar
 * por enlace directo, cuando no hay listado del que sacarlo.
 */
export async function getClipVideoSource(clipId: string): Promise<string | null> {
  const c = await fetchClipRaw(clipId);
  return c?.clip_url || c?.video_url || null;
}

/**
 * Un clip suelto, pedido DIRECTO desde el navegador.
 *
 * No pasa por /api/kick a proposito: ese endpoint es el mismo v2 no oficial que
 * bloquea las IP de centro de datos, asi que desde la funcion de Vercel devolvia
 * 403 y el reproductor mostraba "clip no disponible" en todos los clips. Desde
 * el navegador del visitante si pasa, igual que el listado.
 */
async function fetchClipRaw(clipId: string): Promise<any | null> {
  try {
    const res = await fetch(`${KICK_V2}/clips/${encodeURIComponent(clipId)}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.clip ?? data ?? null;
  } catch {
    return null;
  }
}

/** Un clip suelto por su id, para entrar directamente por enlace. */
export async function getClipById(clipId: string): Promise<KItem | null> {
  const c = await fetchClipRaw(clipId);
  return c ? mapClip(c) : null;
}

/**
 * Barrido completo de una categoria, entregando los clips segun llegan.
 *
 * Clipy necesita trocear la ventana temporal en franjas porque la API de Twitch
 * corta la paginacion a cierta profundidad. Kick no tiene ese problema: pagina
 * por `nextCursor` hasta agotarlo, asi que aqui basta con seguirlo e ir
 * emitiendo cada pagina.
 */
/**
 * Slug derivado -> slug real, una vez resuelto. Se comparte entre la carga por
 * paginas y el barrido completo: si la primera peticion descubre que el slug
 * bueno de "Grand Theft Auto V (GTA)" es "grand-theft-auto-v", las siguientes
 * (y el cursor de paginacion) ya salen bien sin volver a preguntar.
 */
const slugCorregido = new Map<string, string>();

/** Una peticion de clips. `ok` distingue "slug malo" (404) de "sin clips". */
async function pedirPagina(slug: string, time: string, cursor?: string | null) {
  const qs = new URLSearchParams({ sort: 'view', time });
  if (cursor) qs.set('cursor', cursor);
  try {
    const res = await fetch(`${KICK_V2}/categories/${encodeURIComponent(slug)}/clips?${qs}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return { ok: false, clips: [] as KItem[], cursor: null as string | null };
    const data = await res.json();
    const arr: any[] = Array.isArray(data?.clips) ? data.clips : Array.isArray(data?.data) ? data.data : [];
    return {
      ok: true,
      clips: arr.map(mapClip).filter((c) => c.thumbnail),
      cursor: typeof data?.nextCursor === 'string' ? data.nextCursor : null,
    };
  } catch {
    return { ok: false, clips: [] as KItem[], cursor: null as string | null };
  }
}

/**
 * El slug con el que hay que pedir, corrigiendolo si hace falta. Devuelve null
 * cuando ni el derivado ni el real responden, que es lo unico que deberia
 * acabar en "esta categoria no tiene clips".
 */
async function slugQueResponde(derivado: string, time: string, name?: string): Promise<string | null> {
  const yaSabido = slugCorregido.get(derivado);
  if (yaSabido) return yaSabido;

  const prueba = await pedirPagina(derivado, time);
  if (prueba.ok) return derivado;

  // El derivado da 404: se le pregunta a Kick cual es el de verdad.
  const alternativas: string[] = [];
  const corto = name ? shortCategorySlug(name) : null;
  if (corto && corto !== derivado) alternativas.push(corto);
  if (name) {
    const real = await resolveCategorySlug(name);
    if (real && real !== derivado && !alternativas.includes(real)) alternativas.push(real);
  }
  for (const alt of alternativas) {
    const r = await pedirPagina(alt, time);
    if (r.ok) {
      slugCorregido.set(derivado, alt);
      return alt;
    }
  }
  return null;
}

export async function searchAllKickClips(
  categorySlug: string,
  time: string,
  onClips: (items: KItem[]) => void,
  shouldContinue?: () => boolean,
  maxPages?: number,
  name?: string,
): Promise<{ completed: boolean }> {
  if (!categorySlug) return { completed: true };
  const slug = await slugQueResponde(categorySlug, time, name);
  if (!slug) return { completed: true };

  const seen = new Set<string>();
  let cursor: string | null | undefined;
  const tope = maxPages ?? 25;

  for (let page = 0; page < tope; page++) {
    if (shouldContinue && !shouldContinue()) return { completed: false };
    const r = await pedirPagina(slug, time, cursor);
    if (!r.ok) break;
    const nuevos = r.clips.filter((c) => !seen.has(c.id));
    for (const c of nuevos) seen.add(c.id);
    if (nuevos.length) onClips(nuevos);
    if (!r.cursor || r.cursor === cursor || r.clips.length === 0) return { completed: true };
    cursor = r.cursor;
  }
  return { completed: false };
}

/**
 * Una pagina de clips de una categoria, con su cursor — la forma que espera la
 * orquestacion compartida (cargar mas al hacer scroll).
 */
export async function searchKickClips(
  categorySlug: string,
  time: string,
  cursor?: string | null,
  name?: string,
): Promise<{ clips: KItem[]; cursor: string | null }> {
  if (!categorySlug) return { clips: [], cursor: null };
  const slug = await slugQueResponde(categorySlug, time, name);
  if (!slug) return { clips: [], cursor: null };
  const r = await pedirPagina(slug, time, cursor);
  return { clips: r.clips, cursor: r.cursor };
}
