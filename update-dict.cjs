const fs = require('fs');

const pastesnapPath = 'c:/Users/adria/Desktop/olovetools/src/tools/pastesnap/constants.tsx';
const formatflowPath = 'c:/Users/adria/Desktop/olovetools/src/tools/formatflow/translations.ts';
const dictionaryPath = 'c:/Users/adria/Desktop/olovetools/src/locales/dictionary.ts';

let psText = fs.readFileSync(pastesnapPath, 'utf8');
let ffText = fs.readFileSync(formatflowPath, 'utf8');
let dictText = fs.readFileSync(dictionaryPath, 'utf8');

// PASTESNAP
let psMatch = psText.match(/export const TRANSLATIONS: Record<LanguageCode, TranslationSet> = (\{[\s\S]*?\n\});/);
if (psMatch) {
  let psObj = psMatch[1];
  psObj = psObj.replace(/^  GB:/m, '  en:')
               .replace(/^  ES:/m, '  es:')
               .replace(/^  IN:/m, '  hi:')
               .replace(/^  DE:/m, '  de:')
               .replace(/^  FR:/m, '  fr:')
               .replace(/^  BR:/m, '  pt:')
               .replace(/^  RU:/m, '  ru:')
               .replace(/^  JP:/m, '  ja:')
               .replace(/^  CN:/m, '  zh:');
  
  psObj = psObj.replace(/(seoHeroTitle:\s*('[^']+'|"[^"]+"),)/g, "$1\n    seo_title: $2,");
  psObj = psObj.replace(/(seoHeroText:\s*('[^']+'|"[^"]+"),)/g, "$1\n    seo_description: $2,");
  
  let newDictPs = '\n// PASTESNAP DICTIONARY\nexport const pastesnapDictionary: Record<string, any> = ' + psObj + ';\n\n';
  if (!dictText.includes('export const pastesnapDictionary')) {
    dictText = dictText.replace('export const useTranslation =', newDictPs + 'export const useTranslation =');
  }
}

// FORMATFLOW
let enMatch = ffText.match(/const enTranslations = (\{[\s\S]*?\n\});/);
if (enMatch) {
  let ffRelevant = ffText.substring(ffText.indexOf('const enTranslations'), ffText.indexOf('export const translations'));
  let newFf = '\n// FORMATFLOW DICTIONARY\n' + ffRelevant + '\nexport const formatflowDictionary: Record<string, any> = {\n' +
    '  en: { ...enTranslations, seo_title: "oLoveTools | FormatFlow", seo_description: enTranslations.seo.description },\n' +
    '  es: { ...esTranslations, seo_title: "oLoveTools | FormatFlow", seo_description: esTranslations.seo.description },\n' +
    '  hi: { ...hiTranslations, seo_title: "oLoveTools | FormatFlow", seo_description: hiTranslations.seo.description },\n' +
    '  de: { ...deTranslations, seo_title: "oLoveTools | FormatFlow", seo_description: deTranslations.seo.description },\n' +
    '  fr: { ...frTranslations, seo_title: "oLoveTools | FormatFlow", seo_description: frTranslations.seo.description },\n' +
    '  pt: { ...ptTranslations, seo_title: "oLoveTools | FormatFlow", seo_description: ptTranslations.seo.description },\n' +
    '  ru: { ...ruTranslations, seo_title: "oLoveTools | FormatFlow", seo_description: ruTranslations.seo.description },\n' +
    '  ja: { ...jaTranslations, seo_title: "oLoveTools | FormatFlow", seo_description: jaTranslations.seo.description },\n' +
    '  zh: { ...zhTranslations, seo_title: "oLoveTools | FormatFlow", seo_description: zhTranslations.seo.description }\n' +
    '};\n\n';
  
  if (!dictText.includes('export const formatflowDictionary')) {
    dictText = dictText.replace('export const useTranslation =', newFf + 'export const useTranslation =');
  }
}

// UPDATE USETRANSLATION
let useTrUpdate = `export const useTranslation = (lang: Language, tool: 'clipy' | 'clipbolt' | 'hub' | 'pastesnap' | 'formatflow') => {
  const dictionaryObj = 
    tool === 'clipy' ? clipyDictionary : 
    tool === 'clipbolt' ? clipboltDictionary : 
    tool === 'pastesnap' ? pastesnapDictionary : 
    tool === 'formatflow' ? formatflowDictionary : 
    hubDictionary;`;

dictText = dictText.replace(/export const useTranslation = \([^)]*\) => \{[\s\S]*?hubDictionary;/m, useTrUpdate);

// CLIPBOLT SEO
dictText = dictText.replace(/(heroTitle:\s*('[^']+'|"[^"]+"),)/g, "$1\n    seo_title: $2,");
dictText = dictText.replace(/(heroDesc:\s*('[^']+'|"[^"]+"),)/g, "$1\n    seo_description: $2,");

fs.writeFileSync(dictionaryPath, dictText);
console.log('done updating dictionary.ts');
