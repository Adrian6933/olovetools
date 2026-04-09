const fs = require('fs');

const basePath = 'c:/Users/adria/Desktop/olovetools/src/tools/formatflow';

// 1. Types.ts
let typesText = fs.readFileSync(`${basePath}/types.ts`, 'utf8');
typesText = typesText.replace(/export type Language = 'EN' \| 'ES' \| 'HI' \| 'DE' \| 'FR' \| 'PT' \| 'RU' \| 'JA' \| 'ZH';\n*/g, '');
fs.writeFileSync(`${basePath}/types.ts`, typesText);

// 2. FormatFlow.tsx
let ffText = fs.readFileSync(`${basePath}/Formatflow.tsx`, 'utf8');
ffText = ffText.replace(/import \{ translations \} from '\.\/translations';/, "import { useTranslation, Language } from '../../locales/dictionary';");
ffText = ffText.replace(/import \{ ImageFormat, ConversionSettings, BatchImageItem, ConversionResult, Language \} from '\.\/types';/, "import { ImageFormat, ConversionSettings, BatchImageItem, ConversionResult } from './types';");
ffText = ffText.replace(/const language = getLanguageFromParam\(lang\);[\s\S]*?const tSeo = translations\[language\]\.seo;/m, 
`const { dictionary } = useTranslation((lang || 'en') as Language, 'formatflow');
  const language = (lang || 'en') as Language;
  const t = dictionary.app;
  const tFeatures = dictionary.features;
  const tSeo = dictionary.seo;`);
ffText = ffText.replace(/const handleLanguageChange = \(newLang: Language\) => \{[\s\S]*?const param = getParamFromLanguage\(newLang\);[\s\S]*?window.location.href = `\/\$\{param\}\/formatflow`;\n  \};/m,
`const handleLanguageChange = (newLang: Language) => {
    window.location.href = \`/\${newLang.toLowerCase()}/formatflow\`;
  };`);
// Also remove the helpers at the top
ffText = ffText.replace(/const langParamMap[^;]+;\n*/, '');
ffText = ffText.replace(/const getLanguageFromParam[^;]+;\n*};\n*/, '');
ffText = ffText.replace(/const getParamFromLanguage[^;]+;\n*};\n*/, '');
fs.writeFileSync(`${basePath}/Formatflow.tsx`, ffText);

// 3. Components
const components = ['Header.tsx', 'DropZone.tsx', 'ControlPanel.tsx', 'CookieBanner.tsx', 'LegalModal.tsx'];

for (const comp of components) {
  let fileText = fs.readFileSync(`${basePath}/components/${comp}`, 'utf8');
  fileText = fileText.replace(/import \{ (.*?Language.*?) \} from '\.\.\/types';/, "import { $1 } from '../types';\nimport { Language } from '../../../locales/dictionary';")
                     .replace(/import \{ Language(.*?) \} from '\.\.\/types';/, "import { Language$1 } from '../../../locales/dictionary';")
  
  fileText = fileText.replace(/import \{ translations(.*?) \} from '\.\.\/translations';/g, "import { useTranslation } from '../../../locales/dictionary';");
  fileText = fileText.replace(/import \{ Language, translations \} from '\.\.\/translations';/, "import { useTranslation, Language } from '../../../locales/dictionary';");

  if (comp === 'Header.tsx') {
    fileText = fileText.replace(/const languages: \{ code: Language; color: string \}\[\] = \[[\s\S]*?\];/, 
`const languages: { code: Language; color: string }[] = [
  { code: 'en', color: 'text-indigo-400' },
  { code: 'es', color: 'text-orange-400' },
  { code: 'hi', color: 'text-orange-500' },
  { code: 'de', color: 'text-yellow-400' },
  { code: 'fr', color: 'text-blue-400' },
  { code: 'pt', color: 'text-green-400' },
  { code: 'ru', color: 'text-red-400' },
  { code: 'ja', color: 'text-pink-400' },
  { code: 'zh', color: 'text-red-500' },
];`);
    fileText = fileText.replace(/const getParamFromLanguage[^;]+;\n*};\n*/, '');
    fileText = fileText.replace(/const currentLang = languages\.find[^;]+;/, 
    `const currentLang = languages.find(l => l.code === language) || languages[0];
  const { dictionary } = useTranslation(language, 'formatflow');`);
    
    // Links
    fileText = fileText.replace(/getParamFromLanguage\(language\) \? `\/\$\{getParamFromLanguage\(language\)\}` : '\/'/g, '`/${language}`');
    fileText = fileText.replace(/getParamFromLanguage\(language\) \? `\/\$\{getParamFromLanguage\(language\)\}\/formatflow` : '\/formatflow'/g, '`/${language}/formatflow`');
    fileText = fileText.replace(/const param = getParamFromLanguage\(lang\.code\);\n.*const toPath = param \? `\/\$\{param\}\/formatflow` : '\/formatflow';/g, 'const toPath = `/${lang.code}/formatflow`;');
    
    fileText = fileText.replace(/translations\[lang.code\]\.languageName/g, "dictionary.languageName");
    // But `translations[lang.code]` inside a map wouldn't work with just `dictionary`. Actually `dictionary` is the dictionary for the CURRENT language. We need the translated name for each language. So we can just use `useTranslation(lang.code, 'formatflow').dictionary.languageName`.
    // Let's replace the whole map body
  } else if (comp === 'DropZone.tsx') {
    fileText = fileText.replace(/const t = translations\[language\]\.dropzone;/, "const { dictionary } = useTranslation(language, 'formatflow');\n  const t = dictionary.dropzone;");
  } else if (comp === 'ControlPanel.tsx') {
    fileText = fileText.replace(/const t = translations\[language\]\.controls;/, "const { dictionary } = useTranslation(language, 'formatflow');\n  const t = dictionary.controls;");
    fileText = fileText.replace(/const tFormats = translations\[language\]\.formats;/, "const tFormats = dictionary.formats;");
  } else if (comp === 'CookieBanner.tsx') {
    fileText = fileText.replace(/const t = translations\[language\]\.cookies;/, "const { dictionary } = useTranslation(language, 'formatflow');\n  const t = dictionary.cookies;");
  } else if (comp === 'LegalModal.tsx') {
    fileText = fileText.replace(/const t = translations\[language\]\.app;/, "const { dictionary } = useTranslation(language, 'formatflow');\n  const t = dictionary.app;");
  }
  
  fs.writeFileSync(`${basePath}/components/${comp}`, fileText);
}

console.log('Done component replacements');
