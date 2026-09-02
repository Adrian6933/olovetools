import type { Category, Clip } from '../../../components/clips/types';
import type { KCategory, KItem } from './kickService';

// ============================================================================
// Kick -> la forma que esperan los componentes compartidos
// ----------------------------------------------------------------------------
// Klipy y Clipy comparten interfaz (src/components/clips), y esos componentes
// hablan el vocabulario de Twitch porque nacieron ahi. En vez de duplicar los
// componentes con otros nombres de campo, se traduce el dato de Kick a esa
// forma en un solo sitio: aqui.
// ============================================================================

/**
 * El id de canal que Kick devuelve no es estable entre endpoints (a veces viene
 * el slug, a veces un numero), y el bloqueo de streamers necesita una clave
 * fija. El slug del canal SI es estable y es lo que ve el usuario, asi que hace
 * de identificador.
 */
export function toClip(item: KItem): Clip {
  return {
    id: item.id,
    title: item.title,
    broadcaster_name: item.channel,
    broadcaster_id: item.channel,
    view_count: item.views,
    thumbnail_url: item.thumbnail,
    url: item.url,
    created_at: item.created || '',
    created_at_iso: item.created || undefined,
    duration: item.duration || '',
    broadcaster_image: item.avatar,
    // Kick no expone el idioma del directo por clip. Se deja sin definir a
    // proposito: los filtros de idioma leen este campo y, sin dato, no filtran
    // nada en vez de inventarse un idioma y esconder clips buenos.
    language: undefined,
    // Kick manda el mp4 en el propio listado. Guardarlo evita que el
    // reproductor tenga que pedirlo a un endpoint que nos bloquea.
    playback_url: item.playbackUrl,
  };
}

export function toCategory(c: KCategory): Category {
  return {
    id: c.slug || c.id,
    name: c.name,
    box_art_url: c.thumbnail,
    // La API oficial de categorias no devuelve espectadores por categoria. Cero
    // significa "no se sabe", y la rejilla ya oculta el contador cuando es 0.
    viewer_count: 0,
  };
}
