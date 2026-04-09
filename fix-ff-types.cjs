const fs = require('fs');
const path = require('path');

const basePath = 'c:/Users/adria/Desktop/olovetools/src/tools/formatflow';

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(filePath));
    } else {
      if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        results.push(filePath);
      }
    }
  }
  return results;
}

const files = walkDir(basePath);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Regex exact import { Language } from './types' or '../types'
  content = content.replace(/import\s*\{\s*Language\s*\}\s*from\s*'(\.\.\/|\.\/)types';/g, (match, p1) => {
    return `import { Language } from '${p1 === '../' ? '../../../locales/dictionary' : '../../locales/dictionary'}';`;
  });

  // Regex mixed imports { ImageFormat, Language, ... } from './types'
  content = content.replace(/import\s*\{([^}]*)Language([^}]*)\}\s*from\s*'(\.\.\/|\.\/)types';/g, (match, p1, p2, p3) => {
    const exports = (p1 + p2).split(',').map(s => s.trim()).filter(Boolean);
    if (exports.length === 0) return `import { Language } from '${p3 === '../' ? '../../../locales/dictionary' : '../../locales/dictionary'}';`;
    return `import { ${exports.join(', ')} } from '${p3}types';\nimport { Language } from '${p3 === '../' ? '../../../locales/dictionary' : '../../locales/dictionary'}';`;
  });

  content = content.replace(/language === 'EN'/g, "language === 'en'");
  content = content.replace(/return 'EN'/g, "return 'en'");

  // Fix ES to es etc
  content = content.replace(/\bEN\b/g, 'en');
  content = content.replace(/\bES\b/g, 'es');
  content = content.replace(/\bHI\b/g, 'hi');
  content = content.replace(/\bDE\b/g, 'de');
  content = content.replace(/\bFR\b/g, 'fr');
  content = content.replace(/\bPT\b/g, 'pt');
  content = content.replace(/\bRU\b/g, 'ru');
  content = content.replace(/\bJA\b/g, 'ja');
  content = content.replace(/\bZH\b/g, 'zh');
  
  if (file.replace(/\\/g, '/').endsWith('Formatflow.tsx')) {
    content = content.replace(/translations\[lang\.code\]/g, "useTranslation(lang.code, 'formatflow').dictionary");
    content = content.replace(/translations\[language\]/g, "useTranslation(language, 'formatflow').dictionary");
  } else if (file.replace(/\\/g, '/').endsWith('Header.tsx')) {
    content = content.replace(/translations\[lang\.code\]/g, "useTranslation(lang.code, 'formatflow').dictionary");
  }

  content = content.replace(/import \{ translations \} from '(\.\.\/|\.\/)translations';/g, '');

  fs.writeFileSync(file, content);
}

fs.unlinkSync('c:/Users/adria/Desktop/olovetools/src/tools/formatflow/translations.ts');

console.log('Fixed TS references');
