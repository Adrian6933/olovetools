// NOTE: this module statically imports EVERY translation file (59 tools × 9
// languages, ~2.3 MB once bundled), so it must only be imported from Astro
// pages (server-side/SSG). Client components (React islands) must import
// Language / FLAGS / LANGUAGE_NAMES / createTranslator from './meta' and use
// the `dictionary` prop that every Astro page already passes down.
import { createTranslator, type Language } from './meta';

export { FLAGS, LANGUAGE_NAMES, createTranslator } from './meta';
export type { Language } from './meta';

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

import en_urlbolt from './en/url-bolt';
import es_urlbolt from './es/url-bolt';
import hi_urlbolt from './hi/url-bolt';
import de_urlbolt from './de/url-bolt';
import fr_urlbolt from './fr/url-bolt';
import pt_urlbolt from './pt/url-bolt';
import ru_urlbolt from './ru/url-bolt';
import ja_urlbolt from './ja/url-bolt';
import zh_urlbolt from './zh/url-bolt';

import en_base64bolt from './en/base64-bolt';
import es_base64bolt from './es/base64-bolt';
import hi_base64bolt from './hi/base64-bolt';
import de_base64bolt from './de/base64-bolt';
import fr_base64bolt from './fr/base64-bolt';
import pt_base64bolt from './pt/base64-bolt';
import ru_base64bolt from './ru/base64-bolt';
import ja_base64bolt from './ja/base64-bolt';
import zh_base64bolt from './zh/base64-bolt';

import en_uuidgenerator from './en/uuid-generator';
import es_uuidgenerator from './es/uuid-generator';
import hi_uuidgenerator from './hi/uuid-generator';
import de_uuidgenerator from './de/uuid-generator';
import fr_uuidgenerator from './fr/uuid-generator';
import pt_uuidgenerator from './pt/uuid-generator';
import ru_uuidgenerator from './ru/uuid-generator';
import ja_uuidgenerator from './ja/uuid-generator';
import zh_uuidgenerator from './zh/uuid-generator';

import en_listmixer from './en/list-mixer';
import es_listmixer from './es/list-mixer';
import hi_listmixer from './hi/list-mixer';
import de_listmixer from './de/list-mixer';
import fr_listmixer from './fr/list-mixer';
import pt_listmixer from './pt/list-mixer';
import ru_listmixer from './ru/list-mixer';
import ja_listmixer from './ja/list-mixer';
import zh_listmixer from './zh/list-mixer';

import en_htmlsanitizer from './en/html-sanitizer';
import es_htmlsanitizer from './es/html-sanitizer';
import hi_htmlsanitizer from './hi/html-sanitizer';
import de_htmlsanitizer from './de/html-sanitizer';
import fr_htmlsanitizer from './fr/html-sanitizer';
import pt_htmlsanitizer from './pt/html-sanitizer';
import ru_htmlsanitizer from './ru/html-sanitizer';
import ja_htmlsanitizer from './ja/html-sanitizer';
import zh_htmlsanitizer from './zh/html-sanitizer';

import en_colorsnap from './en/colorsnap';
import es_colorsnap from './es/colorsnap';
import hi_colorsnap from './hi/colorsnap';
import de_colorsnap from './de/colorsnap';
import fr_colorsnap from './fr/colorsnap';
import pt_colorsnap from './pt/colorsnap';
import ru_colorsnap from './ru/colorsnap';
import ja_colorsnap from './ja/colorsnap';
import zh_colorsnap from './zh/colorsnap';

import en_hextorgb from './en/hex-to-rgb';
import es_hextorgb from './es/hex-to-rgb';
import hi_hextorgb from './hi/hex-to-rgb';
import de_hextorgb from './de/hex-to-rgb';
import fr_hextorgb from './fr/hex-to-rgb';
import pt_hextorgb from './pt/hex-to-rgb';
import ru_hextorgb from './ru/hex-to-rgb';
import ja_hextorgb from './ja/hex-to-rgb';
import zh_hextorgb from './zh/hex-to-rgb';

import en_aspectratio from './en/aspect-ratio';
import es_aspectratio from './es/aspect-ratio';
import hi_aspectratio from './hi/aspect-ratio';
import de_aspectratio from './de/aspect-ratio';
import fr_aspectratio from './fr/aspect-ratio';
import pt_aspectratio from './pt/aspect-ratio';
import ru_aspectratio from './ru/aspect-ratio';
import ja_aspectratio from './ja/aspect-ratio';
import zh_aspectratio from './zh/aspect-ratio';

import en_unitflow from './en/unitflow';
import es_unitflow from './es/unitflow';
import hi_unitflow from './hi/unitflow';
import de_unitflow from './de/unitflow';
import fr_unitflow from './fr/unitflow';
import pt_unitflow from './pt/unitflow';
import ru_unitflow from './ru/unitflow';
import ja_unitflow from './ja/unitflow';
import zh_unitflow from './zh/unitflow';

import en_sqlflow from './en/sql-flow';
import es_sqlflow from './es/sql-flow';
import hi_sqlflow from './hi/sql-flow';
import de_sqlflow from './de/sql-flow';
import fr_sqlflow from './fr/sql-flow';
import pt_sqlflow from './pt/sql-flow';
import ru_sqlflow from './ru/sql-flow';
import ja_sqlflow from './ja/sql-flow';
import zh_sqlflow from './zh/sql-flow';

import en_cronflow from './en/cron-flow';
import es_cronflow from './es/cron-flow';
import hi_cronflow from './hi/cron-flow';
import de_cronflow from './de/cron-flow';
import fr_cronflow from './fr/cron-flow';
import pt_cronflow from './pt/cron-flow';
import ru_cronflow from './ru/cron-flow';
import ja_cronflow from './ja/cron-flow';
import zh_cronflow from './zh/cron-flow';

import en_xmljson from './en/xml-json';
import es_xmljson from './es/xml-json';
import hi_xmljson from './hi/xml-json';
import de_xmljson from './de/xml-json';
import fr_xmljson from './fr/xml-json';
import pt_xmljson from './pt/xml-json';
import ru_xmljson from './ru/xml-json';
import ja_xmljson from './ja/xml-json';
import zh_xmljson from './zh/xml-json';

import en_binaryflow from './en/binary-flow';
import es_binaryflow from './es/binary-flow';
import hi_binaryflow from './hi/binary-flow';
import de_binaryflow from './de/binary-flow';
import fr_binaryflow from './fr/binary-flow';
import pt_binaryflow from './pt/binary-flow';
import ru_binaryflow from './ru/binary-flow';
import ja_binaryflow from './ja/binary-flow';
import zh_binaryflow from './zh/binary-flow';

import en_morseflow from './en/morse-flow';
import es_morseflow from './es/morse-flow';
import hi_morseflow from './hi/morse-flow';
import de_morseflow from './de/morse-flow';
import fr_morseflow from './fr/morse-flow';
import pt_morseflow from './pt/morse-flow';
import ru_morseflow from './ru/morse-flow';
import ja_morseflow from './ja/morse-flow';
import zh_morseflow from './zh/morse-flow';

import en_epochflow from './en/epoch-flow';
import es_epochflow from './es/epoch-flow';
import hi_epochflow from './hi/epoch-flow';
import de_epochflow from './de/epoch-flow';
import fr_epochflow from './fr/epoch-flow';
import pt_epochflow from './pt/epoch-flow';
import ru_epochflow from './ru/epoch-flow';
import ja_epochflow from './ja/epoch-flow';
import zh_epochflow from './zh/epoch-flow';

import en_timebolt from './en/time-bolt';
import es_timebolt from './es/time-bolt';
import hi_timebolt from './hi/time-bolt';
import de_timebolt from './de/time-bolt';
import fr_timebolt from './fr/time-bolt';
import pt_timebolt from './pt/time-bolt';
import ru_timebolt from './ru/time-bolt';
import ja_timebolt from './ja/time-bolt';
import zh_timebolt from './zh/time-bolt';

import en_devicetest from './en/device-test';
import es_devicetest from './es/device-test';
import hi_devicetest from './hi/device-test';
import de_devicetest from './de/device-test';
import fr_devicetest from './fr/device-test';
import pt_devicetest from './pt/device-test';
import ru_devicetest from './ru/device-test';
import ja_devicetest from './ja/device-test';
import zh_devicetest from './zh/device-test';

import en_loremflow from './en/lorem-flow';
import es_loremflow from './es/lorem-flow';
import hi_loremflow from './hi/lorem-flow';
import de_loremflow from './de/lorem-flow';
import fr_loremflow from './fr/lorem-flow';
import pt_loremflow from './pt/lorem-flow';
import ru_loremflow from './ru/lorem-flow';
import ja_loremflow from './ja/lorem-flow';
import zh_loremflow from './zh/lorem-flow';

import en_keydoctor from './en/key-doctor';
import es_keydoctor from './es/key-doctor';
import hi_keydoctor from './hi/key-doctor';
import de_keydoctor from './de/key-doctor';
import fr_keydoctor from './fr/key-doctor';
import pt_keydoctor from './pt/key-doctor';
import ru_keydoctor from './ru/key-doctor';
import ja_keydoctor from './ja/key-doctor';
import zh_keydoctor from './zh/key-doctor';

import en_whiteboardflow from './en/whiteboard-flow';
import es_whiteboardflow from './es/whiteboard-flow';
import hi_whiteboardflow from './hi/whiteboard-flow';
import de_whiteboardflow from './de/whiteboard-flow';
import fr_whiteboardflow from './fr/whiteboard-flow';
import pt_whiteboardflow from './pt/whiteboard-flow';
import ru_whiteboardflow from './ru/whiteboard-flow';
import ja_whiteboardflow from './ja/whiteboard-flow';
import zh_whiteboardflow from './zh/whiteboard-flow';

import en_subtitlesbolt from './en/subtitles-bolt';
import es_subtitlesbolt from './es/subtitles-bolt';
import hi_subtitlesbolt from './hi/subtitles-bolt';
import de_subtitlesbolt from './de/subtitles-bolt';
import fr_subtitlesbolt from './fr/subtitles-bolt';
import pt_subtitlesbolt from './pt/subtitles-bolt';
import ru_subtitlesbolt from './ru/subtitles-bolt';
import ja_subtitlesbolt from './ja/subtitles-bolt';
import zh_subtitlesbolt from './zh/subtitles-bolt';

import en_entropybolt from './en/entropy-bolt';
import es_entropybolt from './es/entropy-bolt';
import hi_entropybolt from './hi/entropy-bolt';
import de_entropybolt from './de/entropy-bolt';
import fr_entropybolt from './fr/entropy-bolt';
import pt_entropybolt from './pt/entropy-bolt';
import ru_entropybolt from './ru/entropy-bolt';
import ja_entropybolt from './ja/entropy-bolt';
import zh_entropybolt from './zh/entropy-bolt';

import en_whoisbolt from './en/whois-bolt';
import es_whoisbolt from './es/whois-bolt';
import hi_whoisbolt from './hi/whois-bolt';
import de_whoisbolt from './de/whois-bolt';
import fr_whoisbolt from './fr/whois-bolt';
import pt_whoisbolt from './pt/whois-bolt';
import ru_whoisbolt from './ru/whois-bolt';
import ja_whoisbolt from './ja/whois-bolt';
import zh_whoisbolt from './zh/whois-bolt';
import en_framesnap from './en/framesnap';
import es_framesnap from './es/framesnap';
import fr_framesnap from './fr/framesnap';
import de_framesnap from './de/framesnap';
import pt_framesnap from './pt/framesnap';
import ru_framesnap from './ru/framesnap';
import hi_framesnap from './hi/framesnap';
import ja_framesnap from './ja/framesnap';
import zh_framesnap from './zh/framesnap';
import en_cleansnap from './en/cleansnap';
import es_cleansnap from './es/cleansnap';
import fr_cleansnap from './fr/cleansnap';
import de_cleansnap from './de/cleansnap';
import pt_cleansnap from './pt/cleansnap';
import ru_cleansnap from './ru/cleansnap';
import hi_cleansnap from './hi/cleansnap';
import ja_cleansnap from './ja/cleansnap';
import zh_cleansnap from './zh/cleansnap';
import en_klipy from './en/klipy';
import es_klipy from './es/klipy';
import fr_klipy from './fr/klipy';
import de_klipy from './de/klipy';
import pt_klipy from './pt/klipy';
import ru_klipy from './ru/klipy';
import hi_klipy from './hi/klipy';
import ja_klipy from './ja/klipy';
import zh_klipy from './zh/klipy';
import en_clipFlow from './en/clip-flow';
import es_clipFlow from './es/clip-flow';
import fr_clipFlow from './fr/clip-flow';
import de_clipFlow from './de/clip-flow';
import pt_clipFlow from './pt/clip-flow';
import ru_clipFlow from './ru/clip-flow';
import hi_clipFlow from './hi/clip-flow';
import ja_clipFlow from './ja/clip-flow';
import zh_clipFlow from './zh/clip-flow';
import en_jwtBolt from './en/jwt-bolt';
import es_jwtBolt from './es/jwt-bolt';
import fr_jwtBolt from './fr/jwt-bolt';
import de_jwtBolt from './de/jwt-bolt';
import pt_jwtBolt from './pt/jwt-bolt';
import ru_jwtBolt from './ru/jwt-bolt';
import hi_jwtBolt from './hi/jwt-bolt';
import ja_jwtBolt from './ja/jwt-bolt';
import zh_jwtBolt from './zh/jwt-bolt';
import en_qrReader from './en/qr-reader';
import es_qrReader from './es/qr-reader';
import fr_qrReader from './fr/qr-reader';
import de_qrReader from './de/qr-reader';
import pt_qrReader from './pt/qr-reader';
import ru_qrReader from './ru/qr-reader';
import hi_qrReader from './hi/qr-reader';
import ja_qrReader from './ja/qr-reader';
import zh_qrReader from './zh/qr-reader';
import en_framebolt from './en/framebolt';
import es_framebolt from './es/framebolt';
import fr_framebolt from './fr/framebolt';
import de_framebolt from './de/framebolt';
import pt_framebolt from './pt/framebolt';
import ru_framebolt from './ru/framebolt';
import hi_framebolt from './hi/framebolt';
import ja_framebolt from './ja/framebolt';
import zh_framebolt from './zh/framebolt';

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

export const urlboltDictionary: Record<string, any> = {
  en: en_urlbolt,
  es: es_urlbolt,
  hi: hi_urlbolt,
  de: de_urlbolt,
  fr: fr_urlbolt,
  pt: pt_urlbolt,
  ru: ru_urlbolt,
  ja: ja_urlbolt,
  zh: zh_urlbolt,
};

export const base64boltDictionary: Record<string, any> = {
  en: en_base64bolt,
  es: es_base64bolt,
  hi: hi_base64bolt,
  de: de_base64bolt,
  fr: fr_base64bolt,
  pt: pt_base64bolt,
  ru: ru_base64bolt,
  ja: ja_base64bolt,
  zh: zh_base64bolt,
};

export const uuidGeneratorDictionary: Record<string, any> = {
  en: en_uuidgenerator,
  es: es_uuidgenerator,
  fr: fr_uuidgenerator,
  de: de_uuidgenerator,
  pt: pt_uuidgenerator,
  ru: ru_uuidgenerator,
  hi: hi_uuidgenerator,
  ja: ja_uuidgenerator,
  zh: zh_uuidgenerator,
};

export const listMixerDictionary: Record<string, any> = {
  en: en_listmixer,
  es: es_listmixer,
  fr: fr_listmixer,
  de: de_listmixer,
  pt: pt_listmixer,
  ru: ru_listmixer,
  hi: hi_listmixer,
  ja: ja_listmixer,
  zh: zh_listmixer,
};

export const htmlSanitizerDictionary: Record<string, any> = {
  en: en_htmlsanitizer,
  es: es_htmlsanitizer,
  fr: fr_htmlsanitizer,
  de: de_htmlsanitizer,
  pt: pt_htmlsanitizer,
  ru: ru_htmlsanitizer,
  hi: hi_htmlsanitizer,
  ja: ja_htmlsanitizer,
  zh: zh_htmlsanitizer,
};

export const colorsnapDictionary: Record<string, any> = {
  en: en_colorsnap,
  es: es_colorsnap,
  fr: fr_colorsnap,
  de: de_colorsnap,
  pt: pt_colorsnap,
  ru: ru_colorsnap,
  hi: hi_colorsnap,
  ja: ja_colorsnap,
  zh: zh_colorsnap,
};

export const hexToRgbDictionary: Record<string, any> = {
  en: en_hextorgb,
  es: es_hextorgb,
  fr: fr_hextorgb,
  de: de_hextorgb,
  pt: pt_hextorgb,
  ru: ru_hextorgb,
  hi: hi_hextorgb,
  ja: ja_hextorgb,
  zh: zh_hextorgb,
};

export const aspectRatioDictionary: Record<string, any> = {
  en: en_aspectratio,
  es: es_aspectratio,
  fr: fr_aspectratio,
  de: de_aspectratio,
  pt: pt_aspectratio,
  ru: ru_aspectratio,
  hi: hi_aspectratio,
  ja: ja_aspectratio,
  zh: zh_aspectratio,
};

export const unitflowDictionary: Record<string, any> = {
  en: en_unitflow,
  es: es_unitflow,
  fr: fr_unitflow,
  de: de_unitflow,
  pt: pt_unitflow,
  ru: ru_unitflow,
  hi: hi_unitflow,
  ja: ja_unitflow,
  zh: zh_unitflow,
};

export const sqlFlowDictionary: Record<string, any> = {
  en: en_sqlflow,
  es: es_sqlflow,
  fr: fr_sqlflow,
  de: de_sqlflow,
  pt: pt_sqlflow,
  ru: ru_sqlflow,
  hi: hi_sqlflow,
  ja: ja_sqlflow,
  zh: zh_sqlflow,
};

export const cronFlowDictionary: Record<string, any> = {
  en: en_cronflow,
  es: es_cronflow,
  fr: fr_cronflow,
  de: de_cronflow,
  pt: pt_cronflow,
  ru: ru_cronflow,
  hi: hi_cronflow,
  ja: ja_cronflow,
  zh: zh_cronflow,
};

export const xmlJsonDictionary: Record<string, any> = {
  en: en_xmljson,
  es: es_xmljson,
  fr: fr_xmljson,
  de: de_xmljson,
  pt: pt_xmljson,
  ru: ru_xmljson,
  hi: hi_xmljson,
  ja: ja_xmljson,
  zh: zh_xmljson,
};

export const binaryFlowDictionary: Record<string, any> = {
  en: en_binaryflow,
  es: es_binaryflow,
  fr: fr_binaryflow,
  de: de_binaryflow,
  pt: pt_binaryflow,
  ru: ru_binaryflow,
  hi: hi_binaryflow,
  ja: ja_binaryflow,
  zh: zh_binaryflow,
};

export const morseFlowDictionary: Record<string, any> = {
  en: en_morseflow,
  es: es_morseflow,
  fr: fr_morseflow,
  de: de_morseflow,
  pt: pt_morseflow,
  ru: ru_morseflow,
  hi: hi_morseflow,
  ja: ja_morseflow,
  zh: zh_morseflow,
};

export const epochFlowDictionary: Record<string, any> = {
  en: en_epochflow,
  es: es_epochflow,
  fr: fr_epochflow,
  de: de_epochflow,
  pt: pt_epochflow,
  ru: ru_epochflow,
  hi: hi_epochflow,
  ja: ja_epochflow,
  zh: zh_epochflow,
};

export const timeBoltDictionary: Record<string, any> = {
  en: en_timebolt,
  es: es_timebolt,
  fr: fr_timebolt,
  de: de_timebolt,
  pt: pt_timebolt,
  ru: ru_timebolt,
  hi: hi_timebolt,
  ja: ja_timebolt,
  zh: zh_timebolt,
};

export const deviceTestDictionary: Record<string, any> = {
  en: en_devicetest,
  es: es_devicetest,
  fr: fr_devicetest,
  de: de_devicetest,
  pt: pt_devicetest,
  ru: ru_devicetest,
  hi: hi_devicetest,
  ja: ja_devicetest,
  zh: zh_devicetest,
};

export const loremFlowDictionary: Record<string, any> = {
  en: en_loremflow,
  es: es_loremflow,
  fr: fr_loremflow,
  de: de_loremflow,
  pt: pt_loremflow,
  ru: ru_loremflow,
  hi: hi_loremflow,
  ja: ja_loremflow,
  zh: zh_loremflow,
};

export const keyDoctorDictionary: Record<string, any> = {
  en: en_keydoctor,
  es: es_keydoctor,
  fr: fr_keydoctor,
  de: de_keydoctor,
  pt: pt_keydoctor,
  ru: ru_keydoctor,
  hi: hi_keydoctor,
  ja: ja_keydoctor,
  zh: zh_keydoctor,
};

export const whiteboardFlowDictionary: Record<string, any> = {
  en: en_whiteboardflow,
  es: es_whiteboardflow,
  fr: fr_whiteboardflow,
  de: de_whiteboardflow,
  pt: pt_whiteboardflow,
  ru: ru_whiteboardflow,
  hi: hi_whiteboardflow,
  ja: ja_whiteboardflow,
  zh: zh_whiteboardflow,
};

export const subtitlesBoltDictionary: Record<string, any> = {
  en: en_subtitlesbolt,
  es: es_subtitlesbolt,
  fr: fr_subtitlesbolt,
  de: de_subtitlesbolt,
  pt: pt_subtitlesbolt,
  ru: ru_subtitlesbolt,
  hi: hi_subtitlesbolt,
  ja: ja_subtitlesbolt,
  zh: zh_subtitlesbolt,
};

export const entropyBoltDictionary: Record<string, any> = {
  en: en_entropybolt,
  es: es_entropybolt,
  fr: fr_entropybolt,
  de: de_entropybolt,
  pt: pt_entropybolt,
  ru: ru_entropybolt,
  hi: hi_entropybolt,
  ja: ja_entropybolt,
  zh: zh_entropybolt,
};

export const whoisBoltDictionary: Record<string, any> = {
  en: en_whoisbolt,
  es: es_whoisbolt,
  fr: fr_whoisbolt,
  de: de_whoisbolt,
  pt: pt_whoisbolt,
  ru: ru_whoisbolt,
  hi: hi_whoisbolt,
  ja: ja_whoisbolt,
  zh: zh_whoisbolt,
};

export const framesnapDictionary: Record<string, any> = {
  en: en_framesnap,
  es: es_framesnap,
  fr: fr_framesnap,
  de: de_framesnap,
  pt: pt_framesnap,
  ru: ru_framesnap,
  hi: hi_framesnap,
  ja: ja_framesnap,
  zh: zh_framesnap,
};

export const cleansnapDictionary: Record<string, any> = {
  en: en_cleansnap,
  es: es_cleansnap,
  fr: fr_cleansnap,
  de: de_cleansnap,
  pt: pt_cleansnap,
  ru: ru_cleansnap,
  hi: hi_cleansnap,
  ja: ja_cleansnap,
  zh: zh_cleansnap,
};

export const klipyDictionary: Record<string, any> = {
  en: en_klipy,
  es: es_klipy,
  fr: fr_klipy,
  de: de_klipy,
  pt: pt_klipy,
  ru: ru_klipy,
  hi: hi_klipy,
  ja: ja_klipy,
  zh: zh_klipy,
};

export const clipFlowDictionary: Record<string, any> = {
  en: en_clipFlow,
  es: es_clipFlow,
  fr: fr_clipFlow,
  de: de_clipFlow,
  pt: pt_clipFlow,
  ru: ru_clipFlow,
  hi: hi_clipFlow,
  ja: ja_clipFlow,
  zh: zh_clipFlow,
};

export const jwtBoltDictionary: Record<string, any> = {
  en: en_jwtBolt,
  es: es_jwtBolt,
  fr: fr_jwtBolt,
  de: de_jwtBolt,
  pt: pt_jwtBolt,
  ru: ru_jwtBolt,
  hi: hi_jwtBolt,
  ja: ja_jwtBolt,
  zh: zh_jwtBolt,
};

export const qrReaderDictionary: Record<string, any> = {
  en: en_qrReader,
  es: es_qrReader,
  fr: fr_qrReader,
  de: de_qrReader,
  pt: pt_qrReader,
  ru: ru_qrReader,
  hi: hi_qrReader,
  ja: ja_qrReader,
  zh: zh_qrReader,
};

export const frameboltDictionary: Record<string, any> = {
  en: en_framebolt,
  es: es_framebolt,
  fr: fr_framebolt,
  de: de_framebolt,
  pt: pt_framebolt,
  ru: ru_framebolt,
  hi: hi_framebolt,
  ja: ja_framebolt,
  zh: zh_framebolt,
};

export const useTranslation = (lang: Language, tool: 'clipy' | 'twitchbolt' | 'kickbolt' | 'hub' | 'pastesnap' | 'formatflow' | 'compresssnap' | 'backgroundremover' | 'pdf-flow' | 'recordsnap' | 'qr-bolt' | 'codecard' | 'cropsnap' | 'css-designer' | 'json-flow' | 'socialbolt' | 'tts-bolt' | 'gif-bolt' | 'audiosnap' | 'drawsnap' | 'diffsnap' | 'watermark-snap' | 'favicon-bolt' | 'exif-clear' | 'meme-bolt' | 'wordflow' | 'markdown-live' | 'hash-bolt' | 'zip-flow' | 'regex-flow' | 'lottie-viewer' | 'svg-optimizer' | 'graph-flow' | 'url-bolt' | 'base64-bolt' | 'uuid-generator' | 'list-mixer' | 'html-sanitizer' | 'colorsnap' | 'hex-to-rgb' | 'aspect-ratio' | 'unitflow' | 'sql-flow' | 'cron-flow' | 'xml-json' | 'binary-flow' | 'morse-flow' | 'epoch-flow' | 'time-bolt' | 'device-test' | 'lorem-flow' | 'key-doctor' | 'whiteboard-flow' | 'subtitles-bolt' | 'entropy-bolt' | 'whois-bolt' | 'framesnap' | 'cleansnap' | 'klipy' | 'clip-flow' | 'jwt-bolt' | 'qr-reader' | 'framebolt') => {
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
    tool === 'url-bolt' ? urlboltDictionary :
    tool === 'uuid-generator' ? uuidGeneratorDictionary :
    tool === 'list-mixer' ? listMixerDictionary :
    tool === 'html-sanitizer' ? htmlSanitizerDictionary :
    tool === 'colorsnap' ? colorsnapDictionary :
    tool === 'hex-to-rgb' ? hexToRgbDictionary :
    tool === 'aspect-ratio' ? aspectRatioDictionary :
    tool === 'unitflow' ? unitflowDictionary :
    tool === 'sql-flow' ? sqlFlowDictionary :
    tool === 'cron-flow' ? cronFlowDictionary :
    tool === 'xml-json' ? xmlJsonDictionary :
    tool === 'binary-flow' ? binaryFlowDictionary :
    tool === 'morse-flow' ? morseFlowDictionary :
    tool === 'epoch-flow' ? epochFlowDictionary :
    tool === 'time-bolt' ? timeBoltDictionary :
    tool === 'device-test' ? deviceTestDictionary :
    tool === 'lorem-flow' ? loremFlowDictionary :
    tool === 'key-doctor' ? keyDoctorDictionary :
    tool === 'whiteboard-flow' ? whiteboardFlowDictionary :
    tool === 'subtitles-bolt' ? subtitlesBoltDictionary :
    tool === 'entropy-bolt' ? entropyBoltDictionary :
    tool === 'whois-bolt' ? whoisBoltDictionary :
    tool === 'base64-bolt' ? base64boltDictionary :
    tool === 'framesnap' ? framesnapDictionary :
    tool === 'cleansnap' ? cleansnapDictionary :
    tool === 'klipy' ? klipyDictionary :
    tool === 'clip-flow' ? clipFlowDictionary :
    tool === 'jwt-bolt' ? jwtBoltDictionary :
    tool === 'qr-reader' ? qrReaderDictionary :
    tool === 'framebolt' ? frameboltDictionary :
    hubDictionary;
    
  const currentDict = dictionaryObj[lang] || dictionaryObj['en'];

  return { t: createTranslator(currentDict), lang, dictionary: currentDict };
};
