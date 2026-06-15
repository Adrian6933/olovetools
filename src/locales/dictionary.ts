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
import en_twitchbolt from './en/twitchbolt';
import en_kickbolt from './en/kickbolt';
import en_pastesnap from './en/pastesnap';
import en_formatflow from './en/formatflow';
import en_compresssnap from './en/compresssnap';
import en_backgroundremover from './en/backgroundremover';
import en_pdfflow from './en/pdf-flow';
import en_recordsnap from './en/recordsnap';
import en_qrbolt from './en/qr-bolt';
import en_codecard from './en/codecard';
import en_cropsnap from './en/cropsnap';
import en_cssdesigner from './en/css-designer';
import en_jsonflow from './en/json-flow';
import en_socialbolt from './en/socialbolt';
import en_ttsbolt from './en/tts-bolt';
import en_gifbolt from './en/gif-bolt';
import es_hub from './es/hub';
import es_clipy from './es/clipy';
import es_twitchbolt from './es/twitchbolt';
import es_kickbolt from './es/kickbolt';
import es_pastesnap from './es/pastesnap';
import es_formatflow from './es/formatflow';
import es_compresssnap from './es/compresssnap';
import es_backgroundremover from './es/backgroundremover';
import es_pdfflow from './es/pdf-flow';
import es_recordsnap from './es/recordsnap';
import es_qrbolt from './es/qr-bolt';
import es_codecard from './es/codecard';
import es_cropsnap from './es/cropsnap';
import es_cssdesigner from './es/css-designer';
import es_jsonflow from './es/json-flow';
import es_socialbolt from './es/socialbolt';
import es_ttsbolt from './es/tts-bolt';
import es_gifbolt from './es/gif-bolt';
import hi_hub from './hi/hub';
import hi_clipy from './hi/clipy';
import hi_twitchbolt from './hi/twitchbolt';
import hi_kickbolt from './hi/kickbolt';
import hi_pastesnap from './hi/pastesnap';
import hi_formatflow from './hi/formatflow';
import hi_compresssnap from './hi/compresssnap';
import hi_backgroundremover from './hi/backgroundremover';
import hi_pdfflow from './hi/pdf-flow';
import hi_recordsnap from './hi/recordsnap';
import hi_qrbolt from './hi/qr-bolt';
import hi_codecard from './hi/codecard';
import hi_cropsnap from './hi/cropsnap';
import hi_cssdesigner from './hi/css-designer';
import hi_jsonflow from './hi/json-flow';
import hi_socialbolt from './hi/socialbolt';
import hi_ttsbolt from './hi/tts-bolt';
import hi_gifbolt from './hi/gif-bolt';
import de_hub from './de/hub';
import de_clipy from './de/clipy';
import de_twitchbolt from './de/twitchbolt';
import de_kickbolt from './de/kickbolt';
import de_pastesnap from './de/pastesnap';
import de_formatflow from './de/formatflow';
import de_compresssnap from './de/compresssnap';
import de_backgroundremover from './de/backgroundremover';
import de_pdfflow from './de/pdf-flow';
import de_recordsnap from './de/recordsnap';
import de_qrbolt from './de/qr-bolt';
import de_codecard from './de/codecard';
import de_cropsnap from './de/cropsnap';
import de_cssdesigner from './de/css-designer';
import de_jsonflow from './de/json-flow';
import de_socialbolt from './de/socialbolt';
import de_ttsbolt from './de/tts-bolt';
import de_gifbolt from './de/gif-bolt';
import fr_hub from './fr/hub';
import fr_clipy from './fr/clipy';
import fr_twitchbolt from './fr/twitchbolt';
import fr_kickbolt from './fr/kickbolt';
import fr_pastesnap from './fr/pastesnap';
import fr_formatflow from './fr/formatflow';
import fr_compresssnap from './fr/compresssnap';
import fr_backgroundremover from './fr/backgroundremover';
import fr_pdfflow from './fr/pdf-flow';
import fr_recordsnap from './fr/recordsnap';
import fr_qrbolt from './fr/qr-bolt';
import fr_codecard from './fr/codecard';
import fr_cropsnap from './fr/cropsnap';
import fr_cssdesigner from './fr/css-designer';
import fr_jsonflow from './fr/json-flow';
import fr_socialbolt from './fr/socialbolt';
import fr_ttsbolt from './fr/tts-bolt';
import fr_gifbolt from './fr/gif-bolt';
import pt_hub from './pt/hub';
import pt_clipy from './pt/clipy';
import pt_twitchbolt from './pt/twitchbolt';
import pt_kickbolt from './pt/kickbolt';
import pt_pastesnap from './pt/pastesnap';
import pt_formatflow from './pt/formatflow';
import pt_compresssnap from './pt/compresssnap';
import pt_backgroundremover from './pt/backgroundremover';
import pt_pdfflow from './pt/pdf-flow';
import pt_recordsnap from './pt/recordsnap';
import pt_qrbolt from './pt/qr-bolt';
import pt_codecard from './pt/codecard';
import pt_cropsnap from './pt/cropsnap';
import pt_cssdesigner from './pt/css-designer';
import pt_jsonflow from './pt/json-flow';
import pt_socialbolt from './pt/socialbolt';
import pt_ttsbolt from './pt/tts-bolt';
import pt_gifbolt from './pt/gif-bolt';
import ru_hub from './ru/hub';
import ru_clipy from './ru/clipy';
import ru_twitchbolt from './ru/twitchbolt';
import ru_kickbolt from './ru/kickbolt';
import ru_pastesnap from './ru/pastesnap';
import ru_formatflow from './ru/formatflow';
import ru_compresssnap from './ru/compresssnap';
import ru_backgroundremover from './ru/backgroundremover';
import ru_pdfflow from './ru/pdf-flow';
import ru_recordsnap from './ru/recordsnap';
import ru_qrbolt from './ru/qr-bolt';
import ru_codecard from './ru/codecard';
import ru_cropsnap from './ru/cropsnap';
import ru_cssdesigner from './ru/css-designer';
import ru_jsonflow from './ru/json-flow';
import ru_socialbolt from './ru/socialbolt';
import ru_ttsbolt from './ru/tts-bolt';
import ru_gifbolt from './ru/gif-bolt';
import ja_hub from './ja/hub';
import ja_clipy from './ja/clipy';
import ja_twitchbolt from './ja/twitchbolt';
import ja_kickbolt from './ja/kickbolt';
import ja_pastesnap from './ja/pastesnap';
import ja_formatflow from './ja/formatflow';
import ja_compresssnap from './ja/compresssnap';
import ja_backgroundremover from './ja/backgroundremover';
import ja_pdfflow from './ja/pdf-flow';
import ja_recordsnap from './ja/recordsnap';
import ja_qrbolt from './ja/qr-bolt';
import ja_codecard from './ja/codecard';
import ja_cropsnap from './ja/cropsnap';
import ja_cssdesigner from './ja/css-designer';
import ja_jsonflow from './ja/json-flow';
import ja_socialbolt from './ja/socialbolt';
import ja_ttsbolt from './ja/tts-bolt';
import ja_gifbolt from './ja/gif-bolt';
import zh_hub from './zh/hub';
import zh_clipy from './zh/clipy';
import zh_twitchbolt from './zh/twitchbolt';
import zh_kickbolt from './zh/kickbolt';
import zh_pastesnap from './zh/pastesnap';
import zh_formatflow from './zh/formatflow';
import zh_compresssnap from './zh/compresssnap';
import zh_backgroundremover from './zh/backgroundremover';
import zh_pdfflow from './zh/pdf-flow';
import zh_recordsnap from './zh/recordsnap';
import zh_qrbolt from './zh/qr-bolt';
import zh_codecard from './zh/codecard';
import zh_cropsnap from './zh/cropsnap';
import zh_cssdesigner from './zh/css-designer';
import zh_jsonflow from './zh/json-flow';
import zh_socialbolt from './zh/socialbolt';
import zh_ttsbolt from './zh/tts-bolt';
import zh_gifbolt from './zh/gif-bolt';

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

export const twitchboltDictionary: Record<string, any> = {
  en: en_twitchbolt,
  es: es_twitchbolt,
  hi: hi_twitchbolt,
  de: de_twitchbolt,
  fr: fr_twitchbolt,
  pt: pt_twitchbolt,
  ru: ru_twitchbolt,
  ja: ja_twitchbolt,
  zh: zh_twitchbolt,
};

export const kickboltDictionary: Record<string, any> = {
  en: en_kickbolt,
  es: es_kickbolt,
  hi: hi_kickbolt,
  de: de_kickbolt,
  fr: fr_kickbolt,
  pt: pt_kickbolt,
  ru: ru_kickbolt,
  ja: ja_kickbolt,
  zh: zh_kickbolt,
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

export const compresssnapDictionary: Record<string, any> = {
  en: en_compresssnap,
  es: es_compresssnap,
  hi: hi_compresssnap,
  de: de_compresssnap,
  fr: fr_compresssnap,
  pt: pt_compresssnap,
  ru: ru_compresssnap,
  ja: ja_compresssnap,
  zh: zh_compresssnap,
};

export const backgroundremoverDictionary: Record<string, any> = {
  en: en_backgroundremover,
  es: es_backgroundremover,
  hi: hi_backgroundremover,
  de: de_backgroundremover,
  fr: fr_backgroundremover,
  pt: pt_backgroundremover,
  ru: ru_backgroundremover,
  ja: ja_backgroundremover,
  zh: zh_backgroundremover,
};

export const pdfflowDictionary: Record<string, any> = {
  en: en_pdfflow,
  es: es_pdfflow,
  hi: hi_pdfflow,
  de: de_pdfflow,
  fr: fr_pdfflow,
  pt: pt_pdfflow,
  ru: ru_pdfflow,
  ja: ja_pdfflow,
  zh: zh_pdfflow,
};

export const recordsnapDictionary: Record<string, any> = {
  en: en_recordsnap,
  es: es_recordsnap,
  hi: hi_recordsnap,
  de: de_recordsnap,
  fr: fr_recordsnap,
  pt: pt_recordsnap,
  ru: ru_recordsnap,
  ja: ja_recordsnap,
  zh: zh_recordsnap,
};

export const qrboltDictionary: Record<string, any> = {
  en: en_qrbolt,
  es: es_qrbolt,
  hi: hi_qrbolt,
  de: de_qrbolt,
  fr: fr_qrbolt,
  pt: pt_qrbolt,
  ru: ru_qrbolt,
  ja: ja_qrbolt,
  zh: zh_qrbolt,
};

export const codecardDictionary: Record<string, any> = {
  en: en_codecard,
  es: es_codecard,
  hi: hi_codecard,
  de: de_codecard,
  fr: fr_codecard,
  pt: pt_codecard,
  ru: ru_codecard,
  ja: ja_codecard,
  zh: zh_codecard,
};

export const cropsnapDictionary: Record<string, any> = {
  en: en_cropsnap,
  es: es_cropsnap,
  hi: hi_cropsnap,
  de: de_cropsnap,
  fr: fr_cropsnap,
  pt: pt_cropsnap,
  ru: ru_cropsnap,
  ja: ja_cropsnap,
  zh: zh_cropsnap,
};

export const cssdesignerDictionary: Record<string, any> = {
  en: en_cssdesigner,
  es: es_cssdesigner,
  hi: hi_cssdesigner,
  de: de_cssdesigner,
  fr: fr_cssdesigner,
  pt: pt_cssdesigner,
  ru: ru_cssdesigner,
  ja: ja_cssdesigner,
  zh: zh_cssdesigner,
};

export const jsonflowDictionary: Record<string, any> = {
  en: en_jsonflow,
  es: es_jsonflow,
  hi: hi_jsonflow,
  de: de_jsonflow,
  fr: fr_jsonflow,
  pt: pt_jsonflow,
  ru: ru_jsonflow,
  ja: ja_jsonflow,
  zh: zh_jsonflow,
};

export const socialboltDictionary: Record<string, any> = {
  en: en_socialbolt,
  es: es_socialbolt,
  hi: hi_socialbolt,
  de: de_socialbolt,
  fr: fr_socialbolt,
  pt: pt_socialbolt,
  ru: ru_socialbolt,
  ja: ja_socialbolt,
  zh: zh_socialbolt,
};

export const ttsboltDictionary: Record<string, any> = {
  en: en_ttsbolt,
  es: es_ttsbolt,
  hi: hi_ttsbolt,
  de: de_ttsbolt,
  fr: fr_ttsbolt,
  pt: pt_ttsbolt,
  ru: ru_ttsbolt,
  ja: ja_ttsbolt,
  zh: zh_ttsbolt,
};

export const gifboltDictionary: Record<string, any> = {
  en: en_gifbolt,
  es: es_gifbolt,
  hi: hi_gifbolt,
  de: de_gifbolt,
  fr: fr_gifbolt,
  pt: pt_gifbolt,
  ru: ru_gifbolt,
  ja: ja_gifbolt,
  zh: zh_gifbolt,
};

export const useTranslation = (lang: Language, tool: 'clipy' | 'twitchbolt' | 'kickbolt' | 'hub' | 'pastesnap' | 'formatflow' | 'compresssnap' | 'backgroundremover' | 'pdf-flow' | 'recordsnap' | 'qr-bolt' | 'codecard' | 'cropsnap' | 'css-designer' | 'json-flow' | 'socialbolt' | 'tts-bolt' | 'gif-bolt') => {
  const dictionaryObj = 
    tool === 'clipy' ? clipyDictionary : 
    tool === 'twitchbolt' ? twitchboltDictionary : 
    tool === 'kickbolt' ? kickboltDictionary : 
    tool === 'pastesnap' ? pastesnapDictionary : 
    tool === 'formatflow' ? formatflowDictionary : 
    tool === 'compresssnap' ? compresssnapDictionary : 
    tool === 'backgroundremover' ? backgroundremoverDictionary : 
    tool === 'pdf-flow' ? pdfflowDictionary : 
    tool === 'recordsnap' ? recordsnapDictionary : 
    tool === 'qr-bolt' ? qrboltDictionary : 
    tool === 'codecard' ? codecardDictionary : 
    tool === 'cropsnap' ? cropsnapDictionary : 
    tool === 'css-designer' ? cssdesignerDictionary : 
    tool === 'json-flow' ? jsonflowDictionary : 
    tool === 'socialbolt' ? socialboltDictionary : 
    tool === 'tts-bolt' ? ttsboltDictionary : 
    tool === 'gif-bolt' ? gifboltDictionary :  
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
