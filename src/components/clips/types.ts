
export enum TimeFilter {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  ALL = 'all'
}

export enum SortType {
  VIEWS = 'views',
  TRENDING = 'trending'
}

/**
 * Dias elegidos a mano en el calendario, ambos incluidos. En fecha LOCAL
 * (YYYY-MM-DD) y no en ISO: "el dia 3" es el dia 3 de quien lo elige, y un
 * instante UTC lo movia al 2 o al 4 segun la zona horaria.
 */
export interface DayRange {
  from: string;
  to: string;
}

export interface Category {
  id: string;
  name: string;
  box_art_url: string;
  viewer_count: number; // Total viewers watching this category
  tag_ids?: string[];
}

export interface Clip {
  id: string;
  title: string;
  broadcaster_name: string;
  broadcaster_id: string;
  view_count: number;
  thumbnail_url: string;
  url: string;
  created_at: string;
  created_at_iso?: string;
  duration: string;
  broadcaster_image?: string;
  // Idioma del stream en el momento del clip, tal como lo reporta Twitch
  // (p.ej. "en", "es", "ja"). Twitch no expone país/región por clip — este es
  // el campo más cercano disponible, y es lo que usan los filtros de
  // exclusión/inclusión por idioma.
  language?: string;
  /**
   * MP4 reproducible, cuando la API ya lo devuelve en el propio listado (Kick
   * lo hace; Twitch no). Si viene, el reproductor lo usa tal cual y se ahorra
   * una peticion — y en el caso de Kick es ademas la unica via que funciona,
   * porque su endpoint de clip suelto bloquea las IP de centro de datos.
   */
  playback_url?: string;
  /**
   * Categoria desde la que se guardo el clip. Ni Kick ni Twitch la devuelven
   * dentro del clip, asi que se sella al guardarlo mirando en que categoria
   * estaba navegando el usuario. Los clips guardados antes de que esto
   * existiera no la tienen, y caen en el grupo "sin categoria".
   */
  category_id?: string;
  category_name?: string;
}

export interface SavedCollection {
  id: string;
  name: string;
  createdAt: string;
  clips: Clip[];
  auto?: boolean;
}

export interface SearchState {
  mode: 'categories' | 'clips';
  query: string;
  activeCategory: Category | null;
  categories: Category[];
  clips: Clip[];
  paginationCursor: string | null; // Token for the next page of results
  /**
   * Cursor de la rejilla de CATEGORIAS, aparte del de los clips. Compartir uno
   * solo rompia el "cargar mas categorias": al entrar en una categoria el
   * cursor pasaba a ser el de los clips, y si volvias atras (con el boton del
   * raton, por ejemplo) el boton seguia ahi pero pedia mas categorias con un
   * cursor de clips, asi que no llegaba nada.
   */
  categoriesCursor: string | null;
  timeFilter: TimeFilter;
  sortType: SortType;
  anchorTime: string | null;
  isLoading: boolean;
  error: string | null;
}
