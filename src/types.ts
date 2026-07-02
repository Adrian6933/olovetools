export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: ProjectCategory;
  tags: string[];
  icon: string;
  color: string;
}

export enum ProjectCategory {
  VIDEO_AUDIO = 'video_audio',
  IMAGE_DESIGN = 'image_design',
  DOCUMENT_PDF = 'document_pdf',
  DEVELOPER_TOOLS = 'developer_tools',
  TEXT_UTILITIES = 'text_utilities',
  DATA_CONVERSION = 'data_conversion',
  SECURITY_CRYPTO = 'security_crypto',
  NETWORK_SYSTEM = 'network_system',
  PRODUCTIVITY = 'productivity',
  SOCIAL_DOWNLOADS = 'social_downloads'
}

export type LanguageCode = 'en' | 'es' | 'hi' | 'de' | 'fr' | 'pt' | 'ru' | 'ja' | 'zh';

export interface Language {
  code: LanguageCode;
  label: string;
  name: string;
}
