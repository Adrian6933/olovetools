
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
  timeFilter: TimeFilter;
  sortType: SortType;
  anchorTime: string | null;
  isLoading: boolean;
  error: string | null;
}
