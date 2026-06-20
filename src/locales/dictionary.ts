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
import en_audiosnap from './en/audiosnap';
import en_drawsnap from './en/drawsnap';
import en_diffsnap from './en/diffsnap';
import en_watermarksnap from './en/watermark-snap';
import en_faviconbolt from './en/favicon-bolt';
import en_exifclear from './en/exif-clear';
import en_memebolt from './en/meme-bolt';
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
import es_audiosnap from './es/audiosnap';
import es_drawsnap from './es/drawsnap';
import es_diffsnap from './es/diffsnap';
import es_watermarksnap from './es/watermark-snap';
import es_faviconbolt from './es/favicon-bolt';
import es_exifclear from './es/exif-clear';
import es_memebolt from './es/meme-bolt';
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
import hi_audiosnap from './hi/audiosnap';
import hi_drawsnap from './hi/drawsnap';
import hi_diffsnap from './hi/diffsnap';
import hi_watermarksnap from './hi/watermark-snap';
import hi_faviconbolt from './hi/favicon-bolt';
import hi_exifclear from './hi/exif-clear';
import hi_memebolt from './hi/meme-bolt';
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
import de_audiosnap from './de/audiosnap';
import de_drawsnap from './de/drawsnap';
import de_diffsnap from './de/diffsnap';
import de_watermarksnap from './de/watermark-snap';
import de_faviconbolt from './de/favicon-bolt';
import de_exifclear from './de/exif-clear';
import de_memebolt from './de/meme-bolt';
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
import fr_audiosnap from './fr/audiosnap';
import fr_drawsnap from './fr/drawsnap';
import fr_diffsnap from './fr/diffsnap';
import fr_watermarksnap from './fr/watermark-snap';
import fr_faviconbolt from './fr/favicon-bolt';
import fr_exifclear from './fr/exif-clear';
import fr_memebolt from './fr/meme-bolt';
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
import pt_audiosnap from './pt/audiosnap';
import pt_drawsnap from './pt/drawsnap';
import pt_diffsnap from './pt/diffsnap';
import pt_watermarksnap from './pt/watermark-snap';
import pt_faviconbolt from './pt/favicon-bolt';
import pt_exifclear from './pt/exif-clear';
import pt_memebolt from './pt/meme-bolt';
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
import ru_audiosnap from './ru/audiosnap';
import ru_drawsnap from './ru/drawsnap';
import ru_diffsnap from './ru/diffsnap';
import ru_watermarksnap from './ru/watermark-snap';
import ru_faviconbolt from './ru/favicon-bolt';
import ru_exifclear from './ru/exif-clear';
import ru_memebolt from './ru/meme-bolt';
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
import ja_audiosnap from './ja/audiosnap';
import ja_drawsnap from './ja/drawsnap';
import ja_diffsnap from './ja/diffsnap';
import ja_watermarksnap from './ja/watermark-snap';
import ja_faviconbolt from './ja/favicon-bolt';
import ja_exifclear from './ja/exif-clear';
import ja_memebolt from './ja/meme-bolt';
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
import zh_audiosnap from './zh/audiosnap';
import zh_drawsnap from './zh/drawsnap';
import zh_diffsnap from './zh/diffsnap';
import zh_watermarksnap from './zh/watermark-snap';
import zh_faviconbolt from './zh/favicon-bolt';
import zh_exifclear from './zh/exif-clear';
import zh_memebolt from './zh/meme-bolt';

import en_wordflow from './en/wordflow';
import es_wordflow from './es/wordflow';
import hi_wordflow from './hi/wordflow';
import de_wordflow from './de/wordflow';
import fr_wordflow from './fr/wordflow';
import pt_wordflow from './pt/wordflow';
import ru_wordflow from './ru/wordflow';
import ja_wordflow from './ja/wordflow';
import zh_wordflow from './zh/wordflow';

import en_markdownlive from './en/markdown-live';
import es_markdownlive from './es/markdown-live';
import hi_markdownlive from './hi/markdown-live';
import de_markdownlive from './de/markdown-live';
import fr_markdownlive from './fr/markdown-live';
import pt_markdownlive from './pt/markdown-live';
import ru_markdownlive from './ru/markdown-live';
import ja_markdownlive from './ja/markdown-live';
import zh_markdownlive from './zh/markdown-live';

import en_hashbolt from './en/hash-bolt';
import es_hashbolt from './es/hash-bolt';
import hi_hashbolt from './hi/hash-bolt';
import de_hashbolt from './de/hash-bolt';
import fr_hashbolt from './fr/hash-bolt';
import pt_hashbolt from './pt/hash-bolt';
import ru_hashbolt from './ru/hash-bolt';
import ja_hashbolt from './ja/hash-bolt';
import zh_hashbolt from './zh/hash-bolt';

import en_zipflow from './en/zip-flow';
import es_zipflow from './es/zip-flow';
import hi_zipflow from './hi/zip-flow';
import de_zipflow from './de/zip-flow';
import fr_zipflow from './fr/zip-flow';
import pt_zipflow from './pt/zip-flow';
import ru_zipflow from './ru/zip-flow';
import ja_zipflow from './ja/zip-flow';
import zh_zipflow from './zh/zip-flow';

import en_regexflow from './en/regex-flow';
import es_regexflow from './es/regex-flow';
import hi_regexflow from './hi/regex-flow';
import de_regexflow from './de/regex-flow';
import fr_regexflow from './fr/regex-flow';
import pt_regexflow from './pt/regex-flow';
import ru_regexflow from './ru/regex-flow';
import ja_regexflow from './ja/regex-flow';
import zh_regexflow from './zh/regex-flow';

import en_lottieviewer from './en/lottie-viewer';
import es_lottieviewer from './es/lottie-viewer';
import hi_lottieviewer from './hi/lottie-viewer';
import de_lottieviewer from './de/lottie-viewer';
import fr_lottieviewer from './fr/lottie-viewer';
import pt_lottieviewer from './pt/lottie-viewer';
import ru_lottieviewer from './ru/lottie-viewer';
import ja_lottieviewer from './ja/lottie-viewer';
import zh_lottieviewer from './zh/lottie-viewer';

import en_svgoptimizer from './en/svg-optimizer';
import es_svgoptimizer from './es/svg-optimizer';
import hi_svgoptimizer from './hi/svg-optimizer';
import de_svgoptimizer from './de/svg-optimizer';
import fr_svgoptimizer from './fr/svg-optimizer';
import pt_svgoptimizer from './pt/svg-optimizer';
import ru_svgoptimizer from './ru/svg-optimizer';
import ja_svgoptimizer from './ja/svg-optimizer';
import zh_svgoptimizer from './zh/svg-optimizer';

import en_graphflow from './en/graph-flow';
import es_graphflow from './es/graph-flow';
import hi_graphflow from './hi/graph-flow';
import de_graphflow from './de/graph-flow';
import fr_graphflow from './fr/graph-flow';
import pt_graphflow from './pt/graph-flow';
import ru_graphflow from './ru/graph-flow';
import ja_graphflow from './ja/graph-flow';
import zh_graphflow from './zh/graph-flow';

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

export const audiosnapDictionary: Record<string, any> = {
  en: en_audiosnap,
  es: es_audiosnap,
  hi: hi_audiosnap,
  de: de_audiosnap,
  fr: fr_audiosnap,
  pt: pt_audiosnap,
  ru: ru_audiosnap,
  ja: ja_audiosnap,
  zh: zh_audiosnap,
};

export const drawsnapDictionary: Record<string, any> = {
  en: en_drawsnap,
  es: es_drawsnap,
  hi: hi_drawsnap,
  de: de_drawsnap,
  fr: fr_drawsnap,
  pt: pt_drawsnap,
  ru: ru_drawsnap,
  ja: ja_drawsnap,
  zh: zh_drawsnap,
};

export const diffsnapDictionary: Record<string, any> = {
  en: en_diffsnap,
  es: es_diffsnap,
  hi: hi_diffsnap,
  de: de_diffsnap,
  fr: fr_diffsnap,
  pt: pt_diffsnap,
  ru: ru_diffsnap,
  ja: ja_diffsnap,
  zh: zh_diffsnap,
};

export const watermarksnapDictionary: Record<string, any> = {
  en: en_watermarksnap,
  es: es_watermarksnap,
  hi: hi_watermarksnap,
  de: de_watermarksnap,
  fr: fr_watermarksnap,
  pt: pt_watermarksnap,
  ru: ru_watermarksnap,
  ja: ja_watermarksnap,
  zh: zh_watermarksnap,
};

export const faviconboltDictionary: Record<string, any> = {
  en: en_faviconbolt,
  es: es_faviconbolt,
  hi: hi_faviconbolt,
  de: de_faviconbolt,
  fr: fr_faviconbolt,
  pt: pt_faviconbolt,
  ru: ru_faviconbolt,
  ja: ja_faviconbolt,
  zh: zh_faviconbolt,
};

export const exifclearDictionary: Record<string, any> = {
  en: en_exifclear,
  es: es_exifclear,
  hi: hi_exifclear,
  de: de_exifclear,
  fr: fr_exifclear,
  pt: pt_exifclear,
  ru: ru_exifclear,
  ja: ja_exifclear,
  zh: zh_exifclear,
};

export const memeboltDictionary: Record<string, any> = {
  en: en_memebolt,
  es: es_memebolt,
  hi: hi_memebolt,
  de: de_memebolt,
  fr: fr_memebolt,
  pt: pt_memebolt,
  ru: ru_memebolt,
  ja: ja_memebolt,
  zh: zh_memebolt,
};

export const wordflowDictionary: Record<string, any> = {
  en: en_wordflow,
  es: es_wordflow,
  hi: hi_wordflow,
  de: de_wordflow,
  fr: fr_wordflow,
  pt: pt_wordflow,
  ru: ru_wordflow,
  ja: ja_wordflow,
  zh: zh_wordflow,
};

export const markdownliveDictionary: Record<string, any> = {
  en: en_markdownlive,
  es: es_markdownlive,
  hi: hi_markdownlive,
  de: de_markdownlive,
  fr: fr_markdownlive,
  pt: pt_markdownlive,
  ru: ru_markdownlive,
  ja: ja_markdownlive,
  zh: zh_markdownlive,
};

export const hashboltDictionary: Record<string, any> = {
  en: en_hashbolt,
  es: es_hashbolt,
  hi: hi_hashbolt,
  de: de_hashbolt,
  fr: fr_hashbolt,
  pt: pt_hashbolt,
  ru: ru_hashbolt,
  ja: ja_hashbolt,
  zh: zh_hashbolt,
};

export const zipflowDictionary: Record<string, any> = {
  en: en_zipflow,
  es: es_zipflow,
  hi: hi_zipflow,
  de: de_zipflow,
  fr: fr_zipflow,
  pt: pt_zipflow,
  ru: ru_zipflow,
  ja: ja_zipflow,
  zh: zh_zipflow,
};

export const regexflowDictionary: Record<string, any> = {
  en: en_regexflow,
  es: es_regexflow,
  hi: hi_regexflow,
  de: de_regexflow,
  fr: fr_regexflow,
  pt: pt_regexflow,
  ru: ru_regexflow,
  ja: ja_regexflow,
  zh: zh_regexflow,
};

export const lottieviewerDictionary: Record<string, any> = {
  en: en_lottieviewer,
  es: es_lottieviewer,
  hi: hi_lottieviewer,
  de: de_lottieviewer,
  fr: fr_lottieviewer,
  pt: pt_lottieviewer,
  ru: ru_lottieviewer,
  ja: ja_lottieviewer,
  zh: zh_lottieviewer,
};

export const svgoptimizerDictionary: Record<string, any> = {
  en: en_svgoptimizer,
  es: es_svgoptimizer,
  hi: hi_svgoptimizer,
  de: de_svgoptimizer,
  fr: fr_svgoptimizer,
  pt: pt_svgoptimizer,
  ru: ru_svgoptimizer,
  ja: ja_svgoptimizer,
  zh: zh_svgoptimizer,
};

export const graphflowDictionary: Record<string, any> = {
  en: en_graphflow,
  es: es_graphflow,
  hi: hi_graphflow,
  de: de_graphflow,
  fr: fr_graphflow,
  pt: pt_graphflow,
  ru: ru_graphflow,
  ja: ja_graphflow,
  zh: zh_graphflow,
};

export const useTranslation = (lang: Language, tool: 'clipy' | 'twitchbolt' | 'kickbolt' | 'hub' | 'pastesnap' | 'formatflow' | 'compresssnap' | 'backgroundremover' | 'pdf-flow' | 'recordsnap' | 'qr-bolt' | 'codecard' | 'cropsnap' | 'css-designer' | 'json-flow' | 'socialbolt' | 'tts-bolt' | 'gif-bolt' | 'audiosnap' | 'drawsnap' | 'diffsnap' | 'watermark-snap' | 'favicon-bolt' | 'exif-clear' | 'meme-bolt' | 'wordflow' | 'markdown-live' | 'hash-bolt' | 'zip-flow' | 'regex-flow' | 'lottie-viewer' | 'svg-optimizer' | 'graph-flow') => {
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
    tool === 'audiosnap' ? audiosnapDictionary : 
    tool === 'drawsnap' ? drawsnapDictionary : 
    tool === 'diffsnap' ? diffsnapDictionary : 
    tool === 'watermark-snap' ? watermarksnapDictionary : 
    tool === 'favicon-bolt' ? faviconboltDictionary : 
    tool === 'exif-clear' ? exifclearDictionary :        
    tool === 'meme-bolt' ? memeboltDictionary :
    tool === 'wordflow' ? wordflowDictionary :
    tool === 'markdown-live' ? markdownliveDictionary :
    tool === 'hash-bolt' ? hashboltDictionary :
    tool === 'zip-flow' ? zipflowDictionary :
    tool === 'regex-flow' ? regexflowDictionary :
    tool === 'lottie-viewer' ? lottieviewerDictionary :
    tool === 'svg-optimizer' ? svgoptimizerDictionary :
    tool === 'graph-flow' ? graphflowDictionary :
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
