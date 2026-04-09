import { Project, ProjectCategory, Language, LanguageCode } from './types';

export const TOOL_FAVICONS: Record<string, string> = {
  clipy: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='%239146ff' d='M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V11h20v8z'/><g transform='rotate(-25 4 11)'><path fill='%237c3aed' d='M22 11V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v3h20z'/><path fill='white' opacity='0.6' d='m6.7 6 2.7 5h-1.5l-2.7-5h1.5zm5 0 2.7 5h-1.5l-2.7-5h1.5zm5 0 2.7 5h-1.5l-2.7-5h1.5z'/></g></svg>",
  clipbolt: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%239146ff'><polygon points='13 2 3 14 12 14 11 22 21 10 12 10 13 2'/></svg>",
  formatflow: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2338bdf8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><circle cx='9' cy='9' r='2'/><path d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/></svg>",
  pastesnap: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/></svg>",
  default: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236366f1'><path d='M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z'/></svg>"
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
