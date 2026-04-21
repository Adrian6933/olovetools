
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
  duration: string;
  broadcaster_image?: string;
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
  isLoading: boolean;
  error: string | null;
}
