const fs = require('fs');
const dictionaryPath = 'c:/Users/adria/Desktop/olovetools/src/locales/dictionary.ts';
let text = fs.readFileSync(dictionaryPath, 'utf8');

// I want to clean up ONLY `hubDictionary`.
// `hubDictionary` starts around line 1020.
let start = text.indexOf('export const hubDictionary: Record<string, any> = {');
let end = text.indexOf('export const pastesnapDictionary', start);

let hubText = text.substring(start, end);
hubText = hubText.replace(/heroTitle:\s*('[^']+'|"[^"]+"),\s*seo_title:\s*('[^']+'|"[^"]+"),/g, "heroTitle: $1,");
hubText = hubText.replace(/heroSubtitle:\s*('[^']+'|"[^"]+"),\s*seo_description:\s*('[^']+'|"[^"]+"),/g, "heroSubtitle: $1,");
hubText = hubText.replace(/heroDesc:\s*('[^']+'|"[^"]+"),\s*seo_description:\s*('[^']+'|"[^"]+"),/g, "heroDesc: $1,"); // just in case

text = text.substring(0, start) + hubText + text.substring(end);

fs.writeFileSync(dictionaryPath, text);
console.log('Fixed duplicate keys inside hubDictionary');
