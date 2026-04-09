export type Language = 'en' | 'es' | 'hi' | 'de' | 'fr' | 'pt' | 'ru' | 'ja' | 'zh';

export const FLAGS: Record<Language, string> = {
  en: "🇺🇸",
  es: "🇪🇸",
  hi: "🇮🇳",
  de: "🇩🇪",
  fr: "🇫🇷",
  pt: "🇧🇷",
  ru: "🇷🇺",
  ja: "🇯🇵",
  zh: "🇨🇳"
};

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  es: "Español",
  hi: "हिन्दी",
  de: "Deutsch",
  fr: "Français",
  pt: "Português",
  ru: "Русский",
  ja: "日本語",
  zh: "中文"
};

import en_hub from './en/hub';
import en_clipy from './en/clipy';
import en_clipbolt from './en/clipbolt';
import en_pastesnap from './en/pastesnap';
import en_formatflow from './en/formatflow';
import es_hub from './es/hub';
import es_clipy from './es/clipy';
import es_clipbolt from './es/clipbolt';
import es_pastesnap from './es/pastesnap';
import es_formatflow from './es/formatflow';
import hi_hub from './hi/hub';
import hi_clipy from './hi/clipy';
import hi_clipbolt from './hi/clipbolt';
import hi_pastesnap from './hi/pastesnap';
import hi_formatflow from './hi/formatflow';
import de_hub from './de/hub';
import de_clipy from './de/clipy';
import de_clipbolt from './de/clipbolt';
import de_pastesnap from './de/pastesnap';
import de_formatflow from './de/formatflow';
import fr_hub from './fr/hub';
import fr_clipy from './fr/clipy';
import fr_clipbolt from './fr/clipbolt';
import fr_pastesnap from './fr/pastesnap';
import fr_formatflow from './fr/formatflow';
import pt_hub from './pt/hub';
import pt_clipy from './pt/clipy';
import pt_clipbolt from './pt/clipbolt';
import pt_pastesnap from './pt/pastesnap';
import pt_formatflow from './pt/formatflow';
import ru_hub from './ru/hub';
import ru_clipy from './ru/clipy';
import ru_clipbolt from './ru/clipbolt';
import ru_pastesnap from './ru/pastesnap';
import ru_formatflow from './ru/formatflow';
import ja_hub from './ja/hub';
import ja_clipy from './ja/clipy';
import ja_clipbolt from './ja/clipbolt';
import ja_pastesnap from './ja/pastesnap';
import ja_formatflow from './ja/formatflow';
import zh_hub from './zh/hub';
import zh_clipy from './zh/clipy';
import zh_clipbolt from './zh/clipbolt';
import zh_pastesnap from './zh/pastesnap';
import zh_formatflow from './zh/formatflow';

export const hubDictionary: Record<string, any> = {
  en: en_hub,
  es: es_hub,
  hi: hi_hub,
  de: de_hub,
  fr: fr_hub,
  pt: pt_hub,
  ru: ru_hub,
  ja: ja_hub,
  zh: zh_hub,
};

export const clipyDictionary: Record<string, any> = {
  en: en_clipy,
  es: es_clipy,
  hi: hi_clipy,
  de: de_clipy,
  fr: fr_clipy,
  pt: pt_clipy,
  ru: ru_clipy,
  ja: ja_clipy,
  zh: zh_clipy,
};

export const clipboltDictionary: Record<string, any> = {
  en: en_clipbolt,
  es: es_clipbolt,
  hi: hi_clipbolt,
  de: de_clipbolt,
  fr: fr_clipbolt,
  pt: pt_clipbolt,
  ru: ru_clipbolt,
  ja: ja_clipbolt,
  zh: zh_clipbolt,
};

export const pastesnapDictionary: Record<string, any> = {
  en: en_pastesnap,
  es: es_pastesnap,
  hi: hi_pastesnap,
  de: de_pastesnap,
  fr: fr_pastesnap,
  pt: pt_pastesnap,
  ru: ru_pastesnap,
  ja: ja_pastesnap,
  zh: zh_pastesnap,
};

export const formatflowDictionary: Record<string, any> = {
  en: en_formatflow,
  es: es_formatflow,
  hi: hi_formatflow,
  de: de_formatflow,
  fr: fr_formatflow,
  pt: pt_formatflow,
  ru: ru_formatflow,
  ja: ja_formatflow,
  zh: zh_formatflow,
};

export const useTranslation = (lang: Language, tool: 'clipy' | 'clipbolt' | 'hub' | 'pastesnap' | 'formatflow') => {
  const dictionaryObj = 
    tool === 'clipy' ? clipyDictionary : 
    tool === 'clipbolt' ? clipboltDictionary : 
    tool === 'pastesnap' ? pastesnapDictionary : 
    tool === 'formatflow' ? formatflowDictionary : 
    hubDictionary;
    
  const currentDict = dictionaryObj[lang] || dictionaryObj['en'];
  
  const tFunction = (key: string): string => {
    const keys = key.split('.');
    let value: any = currentDict;
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }
    return value !== undefined ? String(value) : key;
  };

  const t = new Proxy(tFunction, {
    get: (target, prop) => {
      if (typeof prop === 'symbol') return undefined;
      if (['call', 'apply', 'bind', 'name', 'length'].includes(prop)) {
        return (target as any)[prop];
      }
      return currentDict[prop as string];
    }
  }) as any;

  return { t, lang, dictionary: currentDict };
};
