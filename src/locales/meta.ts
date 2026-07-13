// Client-safe locale helpers. This module deliberately imports NO translation
// files: tool islands import from here (instead of dictionary.ts) so the
// browser bundle doesn't drag in every locale of every tool (~2.3 MB).
// dictionary.ts re-exports everything here for server-side/Astro use.

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

/**
 * Builds the same `t` the useTranslation hook returns, but from a dictionary
 * object that the Astro page already passes as a prop: callable with a
 * dot-path key (`t('categories.All')`) and readable as an object (`t.title`).
 */
export const createTranslator = (dict: Record<string, any> | undefined | null): any => {
  const currentDict = dict || {};

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

  return new Proxy(tFunction, {
    get: (target, prop) => {
      if (typeof prop === 'symbol') return undefined;
      if (['call', 'apply', 'bind', 'name', 'length'].includes(prop)) {
        return (target as any)[prop];
      }
      return currentDict[prop as string];
    }
  }) as any;
};
