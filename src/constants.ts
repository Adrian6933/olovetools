import { Project, ProjectCategory, Language, LanguageCode } from './types';

export const TOOL_FAVICONS: Record<string, string> = {
  clipy: "/favicon-clipy.png",
  clipbolt: "/favicon-clipbolt.png",
  formatflow: "/favicon-formatflow.png",
  pastesnap: "/favicon-pastesnap.png",
  default: "/icon.svg"
};

export const TOOL_THEME_COLORS: Record<string, string> = {
  clipy: "#9146ff",
  clipbolt: "#7c3aed",
  formatflow: "#38bdf8",
  pastesnap: "#6366f1",
  default: "#060609"
};

export const LANGUAGES: Language[] = [
  { code: 'en', label: 'English', name: 'English' },
  { code: 'es', label: 'Español', name: 'Español' },
  { code: 'hi', label: 'Hindi', name: 'Hindi' },
  { code: 'de', label: 'Deutsch', name: 'Deutsch' },
  { code: 'fr', label: 'Français', name: 'Français' },
  { code: 'pt', label: 'Português', name: 'Português' },
  { code: 'ru', label: 'Русский', name: 'Русский' },
  { code: 'ja', label: '日本語', name: '日本語' },
  { code: 'zh', label: '中文', name: '中文' },
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Clipy',
    slug: 'clipy',
    description: 'A powerful tool to hunt, discover, and organize your favorite clips and videos.',
    category: ProjectCategory.UTILITY,
    tags: ['Video', 'Search', 'Clips', 'Tools'],
    icon: 'Film',
    color: 'bg-gradient-to-br from-indigo-500 to-purple-600'
  },
  {
    id: '2',
    name: 'Clipbolt',
    slug: 'clipbolt',
    description: 'Fast and easy Twitch clip downloader. Save your favorite moments instantly.',
    category: ProjectCategory.UTILITY,
    tags: ['Twitch', 'Download', 'Video', 'Clips'],
    icon: 'Download',
    color: 'bg-gradient-to-br from-violet-600 to-fuchsia-600'
  },
  {
    id: '3',
    name: 'FormatFlow',
    slug: 'formatflow',
    description: 'A powerful online tool to convert images, audio, and documents instantly.',
    category: ProjectCategory.UTILITY,
    tags: ['Converter', 'Images', 'Audio', 'Tools'],
    icon: 'Repeat',
    color: 'bg-gradient-to-br from-emerald-500 to-teal-500'
  },
  {
    id: '4',
    name: 'PasteSnap',
    slug: 'pastesnap',
    description: 'Instantly paste your screenshots and images to download them in high quality. No login required.',
    category: ProjectCategory.UTILITY,
    tags: ['Image', 'Download', 'Utility', 'Quick'],
    icon: 'Image',
    color: 'bg-gradient-to-br from-orange-500 to-red-600'
  }
];
