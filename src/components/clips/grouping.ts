import type { Clip } from './types';

/**
 * Clave del grupo que recoge todo lo que no tiene categoría: clips guardados
 * antes de que el campo existiera y los que llegan de una búsqueda por URL de
 * clip suelto, donde no hay ninguna categoría abierta de la que copiarla.
 */
export const UNCATEGORIZED = '__uncategorized__';

export interface ClipCategoryGroup {
  key: string;
  /** null en el grupo sin categoría; el texto lo pone quien pinta, traducido. */
  name: string | null;
  clips: Clip[];
}

/**
 * Reparte los clips en un grupo por categoría, del más lleno al más vacío y
 * con el grupo sin categoría siempre al final. El orden dentro de cada grupo
 * es el de entrada, así que el panel de guardados sigue enseñándolos en el
 * orden en que se marcaron.
 */
export function groupClipsByCategory(clips: Clip[]): ClipCategoryGroup[] {
  const map = new Map<string, ClipCategoryGroup>();
  for (const clip of clips) {
    const key = clip.category_id || clip.category_name || UNCATEGORIZED;
    let group = map.get(key);
    if (!group) {
      group = { key, name: clip.category_name ?? null, clips: [] };
      map.set(key, group);
    }
    group.clips.push(clip);
  }
  return [...map.values()].sort((a, b) => {
    if (a.key === UNCATEGORIZED) return 1;
    if (b.key === UNCATEGORIZED) return -1;
    return b.clips.length - a.clips.length || (a.name || '').localeCompare(b.name || '');
  });
}

/**
 * Segundos que suman unos clips. `duration` llega como texto ("30", "30s"),
 * asi que parseInt y a correr; lo que no se pueda leer cuenta como cero en vez
 * de convertir el total entero en NaN.
 */
export function sumClipSeconds(clips: Clip[]): number {
  return clips.reduce((acc, clip) => acc + (parseInt(clip.duration) || 0), 0);
}

/**
 * Un clip cuenta como de esta categoría si coincide el id o, para los que se
 * guardaron cuando el id se derivaba del nombre y no del slug real de Kick,
 * si coincide el nombre.
 */
export function clipMatchesCategory(clip: Clip, categoryId: string, categoryName: string): boolean {
  if (clip.category_id && clip.category_id === categoryId) return true;
  return !!clip.category_name && clip.category_name === categoryName;
}
