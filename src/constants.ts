import { Project, ProjectCategory, Language, LanguageCode } from './types';

export const TOOL_FAVICONS: Record<string, string> = {
  clipy: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='%239146ff' d='M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V11h20v8z'/><g transform='rotate(-25 4 11)'><path fill='%237c3aed' d='M22 11V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v3h20z'/><path fill='white' opacity='0.6' d='m6.7 6 2.7 5h-1.5l-2.7-5h1.5zm5 0 2.7 5h-1.5l-2.7-5h1.5zm5 0 2.7 5h-1.5l-2.7-5h1.5z'/></g></svg>",
  twitchbolt: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%239146ff'><polygon points='13 2 3 14 12 14 11 22 21 10 12 10 13 2'/></svg>",
  kickbolt: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2353fc18'><polygon points='13 2 3 14 12 14 11 22 21 10 12 10 13 2'/></svg>",
  formatflow: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%2338bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 7 3 3-3 3M7 17l-3-3 3-3"/><path d="M3 14h11a4 4 0 0 0 4-4V7M21 10H10a4 4 0 0 0-4 4v3"/></svg>',
  pastesnap: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%236366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>',
  compresssnap: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%2306b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M12 8v8M9 11l3-3 3 3M9 13l3 3 3-3"/></svg>',
  backgroundremover: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%23ec4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="9.8" y1="8.2" x2="21" y2="19"/><line x1="9.8" y1="15.8" x2="21" y2="5"/></svg>',
  'pdf-flow': 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%23ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M9 15h1a1.5 1.5 0 0 0 0-3H9v6"/><path d="M12 12v6h1a2 2 0 0 0 0-4h-1"/></svg>',
  recordsnap: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%23f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="12" cy="12" r="3" fill="%23f59e0b"/></svg>',
  'qr-bolt': 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%2310b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="8" x="3" y="3" rx="1"/><rect width="8" height="8" x="13" y="3" rx="1"/><rect width="8" height="8" x="3" y="13" rx="1"/><rect width="3" height="3" x="14" y="14"/><rect width="3" height="3" x="18" y="18"/><rect width="3" height="3" x="14" y="18"/><rect width="3" height="3" x="18" y="14"/></svg>',
  codecard: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%236366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="m10 10-2 2 2 2M14 14l2-2-2-2"/></svg>',
  cropsnap: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%23f43f5e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2v14a2 2 0 0 0 2 2h14M18 22V8a2 2 0 0 0-2-2H2"/></svg>',
  'css-designer': "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238b5cf6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'/><circle cx='12' cy='6' r='2' fill='%23ec4899'/><circle cx='6' cy='12' r='2' fill='%233b82f6'/><circle cx='18' cy='12' r='2' fill='%2310b981'/><circle cx='12' cy='18' r='2' fill='%23f59e0b'/></svg>",
  'json-flow': "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><line x1='9' y1='9' x2='15' y2='9'/><line x1='9' y1='13' x2='15' y2='13'/><line x1='9' y1='17' x2='13' y2='17'/></svg>",
  'socialbolt': "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/><polyline points='7 10 12 15 17 10'/><line x1='12' y1='15' x2='12' y2='3'/></svg>",
  'tts-bolt': "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23f59e0b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polygon points='11 5 6 9 2 9 2 15 6 15 11 19 11 5'/><path d='M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07'/></svg>",
  'gif-bolt': "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23d946ef' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/></svg>",
  default: "/icon.svg"
};

export const TOOL_THEME_COLORS: Record<string, string> = {
  clipy: "#9146ff",
  twitchbolt: "#7c3aed",
  kickbolt: "#53fc18",
  formatflow: "#38bdf8",
  pastesnap: "#6366f1",
  compresssnap: "#06b6d4",
  backgroundremover: "#ec4899",
  'pdf-flow': "#ef4444",
  recordsnap: "#f59e0b",
  'qr-bolt': "#10b981",
  codecard: "#6366f1",
  cropsnap: "#f43f5e",
  'css-designer': "#8b5cf6",
  'json-flow': "#10b981",
  'socialbolt': "#6366f1",
  'tts-bolt': "#f59e0b",
  'gif-bolt': "#d946ef",
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
    name: 'Twitchbolt',
    slug: 'twitchbolt',
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
  },
  {
    id: '5',
    name: 'Kickbolt',
    slug: 'kickbolt',
    description: 'Fast and easy Kick clip downloader. Save your favorite moments instantly.',
    category: ProjectCategory.UTILITY,
    tags: ['Kick', 'Download', 'Video', 'Clips'],
    icon: 'Download',
    color: 'bg-gradient-to-br from-green-500 to-emerald-600'
  },
  {
    id: '6',
    name: 'CompressSnap',
    slug: 'compresssnap',
    description: 'Compress and optimize your images (JPG, PNG, WebP) locally and instantly in your browser.',
    category: ProjectCategory.UTILITY,
    tags: ['Image', 'Compress', 'WebP', 'Optimize'],
    icon: 'Image',
    color: 'bg-gradient-to-br from-cyan-500 to-blue-600'
  },
  {
    id: '7',
    name: 'Background Remover',
    slug: 'backgroundremover',
    description: 'Remove backgrounds from images locally and automatically with AI.',
    category: ProjectCategory.CREATIVE,
    tags: ['AI', 'Image', 'Background', 'Remove'],
    icon: 'Image',
    color: 'bg-gradient-to-br from-fuchsia-500 to-pink-600'
  },
  {
    id: '8',
    name: 'PDF-Flow',
    slug: 'pdf-flow',
    description: 'Merge, split, rotate, and convert documents or images to PDF locally in your browser.',
    category: ProjectCategory.UTILITY,
    tags: ['PDF', 'Merge', 'Split', 'Convert'],
    icon: 'FileText',
    color: 'bg-gradient-to-br from-red-500 to-rose-600'
  },
  {
    id: '9',
    name: 'RecordSnap',
    slug: 'recordsnap',
    description: 'Record your screen, webcam, or both simultaneously entirely in your browser.',
    category: ProjectCategory.UTILITY,
    tags: ['Screen', 'Webcam', 'Record', 'Video'],
    icon: 'Video',
    color: 'bg-gradient-to-br from-amber-500 to-orange-600'
  },
  {
    id: '10',
    name: 'QR-Bolt',
    slug: 'qr-bolt',
    description: 'Generate styled, high-quality QR codes with gradients, custom shapes, and center logos 100% locally.',
    category: ProjectCategory.UTILITY,
    tags: ['QR', 'Creator', 'Design', 'WiFi'],
    icon: 'QrCode',
    color: 'bg-gradient-to-br from-emerald-500 to-teal-600'
  },
  {
    id: '11',
    name: 'CodeCard',
    slug: 'codecard',
    description: 'Convert your code snippets into beautiful, sharing-ready screenshot cards with custom styles 100% locally.',
    category: ProjectCategory.UTILITY,
    tags: ['Code', 'Share', 'Developer', 'Screenshot'],
    icon: 'Code',
    color: 'bg-gradient-to-br from-indigo-500 to-violet-600'
  },
  {
    id: '12',
    name: 'CropSnap',
    slug: 'cropsnap',
    description: 'Crop, resize, rotate, and flip images with customizable presets and quality control 100% locally.',
    category: ProjectCategory.UTILITY,
    tags: ['Crop', 'Resize', 'Rotate', 'Image'],
    icon: 'Crop',
    color: 'bg-gradient-to-br from-rose-500 to-red-600'
  },
  {
    id: '13',
    name: 'CSS-Designer',
    slug: 'css-designer',
    description: 'Create and generate custom modern CSS styles like glassmorphism, shadows, gradients and fancy borders 100% locally.',
    category: ProjectCategory.UTILITY,
    tags: ['CSS', 'Design', 'Tailwind', 'Utility'],
    icon: 'Palette',
    color: 'bg-gradient-to-br from-violet-600 to-indigo-700'
  },
  {
    id: '14',
    name: 'JSON-Flow',
    slug: 'json-flow',
    description: 'Format, validate, explore and convert JSON data in the browser 100% locally.',
    category: ProjectCategory.DEV,
    tags: ['JSON', 'Formatter', 'Converter', 'Developer'],
    icon: 'Code',
    color: 'bg-gradient-to-br from-emerald-600 to-teal-700'
  },
  {
    id: '15',
    name: 'SocialBolt',
    slug: 'socialbolt',
    description: 'Download TikTok videos without watermark, Instagram Reels, and YouTube Shorts 100% locally.',
    category: ProjectCategory.UTILITY,
    tags: ['Video', 'Download', 'TikTok', 'Instagram'],
    icon: 'Zap',
    color: 'bg-gradient-to-br from-indigo-500 to-pink-600'
  },
  {
    id: '16',
    name: 'TTS-Bolt',
    slug: 'tts-bolt',
    description: 'Convert text to natural speech and download it as an MP3 file 100% locally.',
    category: ProjectCategory.UTILITY,
    tags: ['Audio', 'Speech', 'TTS', 'Converter'],
    icon: 'Volume2',
    color: 'bg-gradient-to-br from-amber-500 to-orange-600'
  },
  {
    id: '17',
    name: 'GIF-Bolt',
    slug: 'gif-bolt',
    description: 'Convert videos and image sequences into optimized animated GIFs 100% locally.',
    category: ProjectCategory.UTILITY,
    tags: ['Video', 'Images', 'GIF', 'Optimize'],
    icon: 'Images',
    color: 'bg-gradient-to-br from-fuchsia-500 to-purple-600'
  }
];
