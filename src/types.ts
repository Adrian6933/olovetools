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
  UTILITY = 'Utility',
  CREATIVE = 'Creative',
  DEV = 'Development',
  SOCIAL = 'Social'
}

export type LanguageCode = 'en' | 'es' | 'hi' | 'de' | 'fr' | 'pt' | 'ru' | 'ja' | 'zh';

export interface Language {
  code: LanguageCode;
  label: string;
  name: string;
}
