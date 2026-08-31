export type Platform = 'tiktok' | 'instagram' | 'youtube' | 'twitter' | 'direct' | 'unknown';

export type AssetKind = 'video' | 'audio' | 'image';

/** Una descarga concreta ofrecida por un enlace ya resuelto. */
export interface Asset {
  id: string;
  kind: AssetKind;
  /** Clave del diccionario con el nombre humano ("Vídeo sin marca de agua"). */
  labelKey: string;
  /** Número que se añade al nombre cuando hay varios del mismo tipo. */
  labelIndex?: number;
  url: string;
  ext: string;
  mime: string;
  /** Tamaño declarado por el resolutor, cuando lo da (TikTok sí). */
  bytes?: number;
  /** Etiqueta corta: HD, 720p, MAX… */
  badge?: string;
  note?: string;
  width?: number;
  height?: number;
  primary?: boolean;
  thumb?: string;
  /** Servido por un túnel de Cobalt, no por el CDN original. */
  external?: boolean;
}

export interface ResolvedMedia {
  platform: Platform;
  id: string;
  title: string;
  /** Base ya saneada para los nombres de archivo. */
  baseName: string;
  author: { name: string; handle: string; avatar: string };
  thumbnail: string;
  duration: number;
  stats: {
    views: number | null;
    likes: number | null;
    comments: number | null;
    shares: number | null;
  };
  assets: Asset[];
  warnings: string[];
}

export type JobStatus = 'queued' | 'resolving' | 'ready' | 'error';

/** Un enlace en la cola, con su resultado o su error. */
export interface Job {
  /** Identificador estable del trabajo; no cambia al reintentar. */
  key: string;
  url: string;
  platform: Platform;
  status: JobStatus;
  result?: ResolvedMedia;
  /** Clave de error del diccionario (no texto ya renderizado). */
  errorKey?: string;
  errorDetail?: string;
  /** Ids de los assets marcados para descargar. */
  selected: string[];
}

export interface Transfer {
  /** `${job.key}:${asset.id}` */
  id: string;
  name: string;
  received: number;
  total: number;
  status: 'active' | 'done' | 'error' | 'cancelled';
}
