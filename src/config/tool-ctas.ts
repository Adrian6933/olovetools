/**
 * CTAs cruzados entre herramientas: botones de "siguiente paso" que conectan
 * flujos reales de trabajo (estilo Clipy → TwitchBolt), renderizados como SSR
 * en index.astro justo debajo de cada herramienta. Los targets son SLUGS de
 * URL (no cambiar). Las etiquetas están traducidas a los 9 idiomas.
 */

export interface ToolCta {
  /** Slug de la herramienta destino */
  target: string;
  /** Etiqueta de acción por idioma */
  labels: Record<string, string>;
}

export const CTA_HEADING: Record<string, string> = {
  en: 'Next step',
  es: 'Siguiente paso',
  fr: 'Étape suivante',
  de: 'Nächster Schritt',
  pt: 'Próximo passo',
  ru: 'Следующий шаг',
  hi: 'अगला कदम',
  ja: '次のステップ',
  zh: '下一步',
};

export const TOOL_CTAS: Record<string, ToolCta[]> = {
  clipy: [
    { target: 'twitchbolt', labels: { en: 'Download Twitch clips', es: 'Descarga clips de Twitch', fr: 'Téléchargez des clips Twitch', de: 'Twitch-Clips herunterladen', pt: 'Baixe clipes da Twitch', ru: 'Скачайте клипы Twitch', hi: 'Twitch क्लिप डाउनलोड करें', ja: 'Twitchクリップをダウンロード', zh: '下载 Twitch 片段' } },
    { target: 'clip-flow', labels: { en: 'Cut a Twitch clip', es: 'Corta un clip de Twitch', fr: 'Découpez un clip Twitch', de: 'Twitch-Clip zuschneiden', pt: 'Corte um clipe da Twitch', ru: 'Обрежьте клип Twitch', hi: 'Twitch क्लिप काटें', ja: 'Twitchクリップをカット', zh: '剪辑 Twitch 片段' } },
  ],
  twitchbolt: [
    { target: 'clip-flow', labels: { en: 'Cut fragments from the clip', es: 'Corta fragmentos del clip', fr: 'Découpez des fragments du clip', de: 'Fragmente aus dem Clip schneiden', pt: 'Corte trechos do clipe', ru: 'Вырежьте фрагменты клипа', hi: 'क्लिप से हिस्से काटें', ja: 'クリップの一部を切り出す', zh: '从片段中剪出片断' } },
    { target: 'clipy', labels: { en: 'Find popular clips', es: 'Encuentra clips populares', fr: 'Trouvez des clips populaires', de: 'Beliebte Clips finden', pt: 'Encontre clipes populares', ru: 'Найдите популярные клипы', hi: 'लोकप्रिय क्लिप खोजें', ja: '人気クリップを探す', zh: '查找热门片段' } },
  ],
  klipy: [
    { target: 'kickbolt', labels: { en: 'Download Kick clips', es: 'Descarga clips de Kick', fr: 'Téléchargez des clips Kick', de: 'Kick-Clips herunterladen', pt: 'Baixe clipes do Kick', ru: 'Скачайте клипы Kick', hi: 'Kick क्लिप डाउनलोड करें', ja: 'Kickクリップをダウンロード', zh: '下载 Kick 片段' } },
  ],
  kickbolt: [
    { target: 'klipy', labels: { en: 'Explore Kick clips', es: 'Explora clips de Kick', fr: 'Explorez les clips Kick', de: 'Kick-Clips entdecken', pt: 'Explore clipes do Kick', ru: 'Смотрите клипы Kick', hi: 'Kick क्लिप देखें', ja: 'Kickクリップを探す', zh: '浏览 Kick 片段' } },
  ],
  'clip-flow': [
    { target: 'twitchbolt', labels: { en: 'Download the full clip', es: 'Descarga el clip completo', fr: 'Téléchargez le clip complet', de: 'Kompletten Clip herunterladen', pt: 'Baixe o clipe completo', ru: 'Скачайте клип целиком', hi: 'पूरी क्लिप डाउनलोड करें', ja: 'クリップ全体をダウンロード', zh: '下载完整片段' } },
    { target: 'clipy', labels: { en: 'Find popular clips', es: 'Encuentra clips populares', fr: 'Trouvez des clips populaires', de: 'Beliebte Clips finden', pt: 'Encontre clipes populares', ru: 'Найдите популярные клипы', hi: 'लोकप्रिय क्लिप खोजें', ja: '人気クリップを探す', zh: '查找热门片段' } },
  ],
  framesnap: [
    { target: 'compresssnap', labels: { en: 'Compress the frame', es: 'Comprime el fotograma', fr: "Compressez l'image", de: 'Frame komprimieren', pt: 'Comprima o quadro', ru: 'Сожмите кадр', hi: 'फ़्रेम संपीड़ित करें', ja: 'フレームを圧縮', zh: '压缩帧图像' } },
    { target: 'backgroundremover', labels: { en: 'Remove the background', es: 'Quita el fondo', fr: "Supprimez l'arrière-plan", de: 'Hintergrund entfernen', pt: 'Remova o fundo', ru: 'Удалите фон', hi: 'बैकग्राउंड हटाएं', ja: '背景を削除', zh: '去除背景' } },
  ],
  recordsnap: [
    { target: 'framesnap', labels: { en: 'Extract video frames', es: 'Extrae fotogramas del vídeo', fr: 'Extrayez des images de la vidéo', de: 'Videoframes extrahieren', pt: 'Extraia quadros do vídeo', ru: 'Извлеките кадры из видео', hi: 'वीडियो फ़्रेम निकालें', ja: '動画からフレームを抽出', zh: '提取视频帧' } },
  ],
  backgroundremover: [
    { target: 'compresssnap', labels: { en: 'Compress the result', es: 'Comprime el resultado', fr: 'Compressez le résultat', de: 'Ergebnis komprimieren', pt: 'Comprima o resultado', ru: 'Сожмите результат', hi: 'परिणाम संपीड़ित करें', ja: '結果を圧縮', zh: '压缩结果' } },
    { target: 'cropsnap', labels: { en: 'Crop the image', es: 'Recorta la imagen', fr: "Recadrez l'image", de: 'Bild zuschneiden', pt: 'Recorte a imagem', ru: 'Обрежьте изображение', hi: 'छवि क्रॉप करें', ja: '画像をトリミング', zh: '裁剪图像' } },
  ],
  compresssnap: [
    { target: 'formatflow', labels: { en: 'Convert to another format', es: 'Convierte a otro formato', fr: 'Convertissez vers un autre format', de: 'In anderes Format umwandeln', pt: 'Converta para outro formato', ru: 'Конвертируйте в другой формат', hi: 'दूसरे फ़ॉर्मैट में बदलें', ja: '別の形式に変換', zh: '转换为其他格式' } },
  ],
  cropsnap: [
    { target: 'compresssnap', labels: { en: 'Compress the crop', es: 'Comprime el recorte', fr: 'Compressez le recadrage', de: 'Zuschnitt komprimieren', pt: 'Comprima o recorte', ru: 'Сожмите обрезку', hi: 'क्रॉप संपीड़ित करें', ja: '切り抜きを圧縮', zh: '压缩裁剪结果' } },
  ],
  pastesnap: [
    { target: 'cleansnap', labels: { en: 'Erase objects from the screenshot', es: 'Borra objetos de la captura', fr: 'Effacez des objets de la capture', de: 'Objekte aus dem Screenshot entfernen', pt: 'Apague objetos da captura', ru: 'Удалите объекты со скриншота', hi: 'स्क्रीनशॉट से ऑब्जेक्ट हटाएं', ja: 'スクリーンショットから対象物を消す', zh: '从截图中擦除对象' } },
    { target: 'compresssnap', labels: { en: 'Compress the screenshot', es: 'Comprime la captura', fr: 'Compressez la capture', de: 'Screenshot komprimieren', pt: 'Comprima a captura', ru: 'Сожмите скриншот', hi: 'स्क्रीनशॉट संपीड़ित करें', ja: 'スクリーンショットを圧縮', zh: '压缩截图' } },
  ],
  cleansnap: [
    { target: 'backgroundremover', labels: { en: 'Remove the whole background', es: 'Elimina el fondo entero', fr: "Supprimez tout l'arrière-plan", de: 'Ganzen Hintergrund entfernen', pt: 'Remova o fundo inteiro', ru: 'Удалите весь фон', hi: 'पूरा बैकग्राउंड हटाएं', ja: '背景全体を削除', zh: '移除整个背景' } },
  ],
  colorsnap: [
    { target: 'hex-to-rgb', labels: { en: 'Convert the color to RGB/HSL', es: 'Convierte el color a RGB/HSL', fr: 'Convertissez la couleur en RGB/HSL', de: 'Farbe in RGB/HSL umwandeln', pt: 'Converta a cor para RGB/HSL', ru: 'Преобразуйте цвет в RGB/HSL', hi: 'रंग को RGB/HSL में बदलें', ja: '色をRGB/HSLに変換', zh: '将颜色转换为 RGB/HSL' } },
  ],
  'hex-to-rgb': [
    { target: 'colorsnap', labels: { en: 'Extract colors from an image', es: 'Extrae colores de una imagen', fr: "Extrayez les couleurs d'une image", de: 'Farben aus einem Bild extrahieren', pt: 'Extraia cores de uma imagem', ru: 'Извлеките цвета из изображения', hi: 'छवि से रंग निकालें', ja: '画像から色を抽出', zh: '从图像中提取颜色' } },
  ],
  'epoch-flow': [
    { target: 'time-bolt', labels: { en: 'Convert between time zones', es: 'Convierte entre zonas horarias', fr: 'Convertissez entre fuseaux horaires', de: 'Zwischen Zeitzonen umrechnen', pt: 'Converta entre fusos horários', ru: 'Конвертируйте часовые пояса', hi: 'समय क्षेत्रों में बदलें', ja: 'タイムゾーンを変換', zh: '在时区之间转换' } },
  ],
  'time-bolt': [
    { target: 'epoch-flow', labels: { en: 'Convert Unix timestamps', es: 'Convierte timestamps Unix', fr: 'Convertissez des timestamps Unix', de: 'Unix-Timestamps umwandeln', pt: 'Converta timestamps Unix', ru: 'Конвертируйте Unix-время', hi: 'Unix टाइमस्टैम्प बदलें', ja: 'Unixタイムスタンプを変換', zh: '转换 Unix 时间戳' } },
  ],
  'cron-flow': [
    { target: 'epoch-flow', labels: { en: 'Convert timestamps', es: 'Convierte timestamps', fr: 'Convertissez des timestamps', de: 'Timestamps umwandeln', pt: 'Converta timestamps', ru: 'Конвертируйте временные метки', hi: 'टाइमस्टैम्प बदलें', ja: 'タイムスタンプを変換', zh: '转换时间戳' } },
  ],
  'json-flow': [
    { target: 'xml-json', labels: { en: 'Convert JSON to XML', es: 'Convierte JSON a XML', fr: 'Convertissez JSON en XML', de: 'JSON in XML umwandeln', pt: 'Converta JSON para XML', ru: 'Конвертируйте JSON в XML', hi: 'JSON को XML में बदलें', ja: 'JSONをXMLに変換', zh: '将 JSON 转换为 XML' } },
  ],
  'xml-json': [
    { target: 'json-flow', labels: { en: 'Format and validate the JSON', es: 'Formatea y valida el JSON', fr: 'Formatez et validez le JSON', de: 'JSON formatieren und validieren', pt: 'Formate e valide o JSON', ru: 'Отформатируйте и проверьте JSON', hi: 'JSON फ़ॉर्मैट और जांचें', ja: 'JSONを整形・検証', zh: '格式化并校验 JSON' } },
  ],
  'base64-bolt': [
    { target: 'url-bolt', labels: { en: 'Encode and decode URLs', es: 'Codifica y decodifica URLs', fr: 'Encodez et décodez des URL', de: 'URLs kodieren und dekodieren', pt: 'Codifique e decodifique URLs', ru: 'Кодируйте и декодируйте URL', hi: 'URL एनकोड और डिकोड करें', ja: 'URLをエンコード/デコード', zh: '编码和解码 URL' } },
  ],
  'url-bolt': [
    { target: 'base64-bolt', labels: { en: 'Encode in Base64', es: 'Codifica en Base64', fr: 'Encodez en Base64', de: 'In Base64 kodieren', pt: 'Codifique em Base64', ru: 'Кодируйте в Base64', hi: 'Base64 में एनकोड करें', ja: 'Base64でエンコード', zh: '用 Base64 编码' } },
  ],
  'svg-optimizer': [
    { target: 'favicon-bolt', labels: { en: 'Create a favicon from the SVG', es: 'Crea un favicon del SVG', fr: 'Créez un favicon à partir du SVG', de: 'Favicon aus dem SVG erstellen', pt: 'Crie um favicon do SVG', ru: 'Создайте favicon из SVG', hi: 'SVG से फ़ेविकॉन बनाएं', ja: 'SVGからファビコンを作成', zh: '从 SVG 创建网站图标' } },
  ],
  'favicon-bolt': [
    { target: 'svg-optimizer', labels: { en: 'Optimize your SVG', es: 'Optimiza tu SVG', fr: 'Optimisez votre SVG', de: 'SVG optimieren', pt: 'Otimize seu SVG', ru: 'Оптимизируйте SVG', hi: 'अपना SVG ऑप्टिमाइज़ करें', ja: 'SVGを最適化', zh: '优化你的 SVG' } },
  ],
  'meme-bolt': [
    { target: 'compresssnap', labels: { en: 'Compress the meme', es: 'Comprime el meme', fr: 'Compressez le mème', de: 'Meme komprimieren', pt: 'Comprima o meme', ru: 'Сожмите мем', hi: 'मीम संपीड़ित करें', ja: 'ミームを圧縮', zh: '压缩表情包' } },
  ],
  'tts-bolt': [
    { target: 'audiosnap', labels: { en: 'Convert the audio', es: 'Convierte el audio', fr: "Convertissez l'audio", de: 'Audio konvertieren', pt: 'Converta o áudio', ru: 'Конвертируйте аудио', hi: 'ऑडियो बदलें', ja: '音声を変換', zh: '转换音频' } },
  ],
  'device-test': [
    { target: 'recordsnap', labels: { en: 'Record screen or webcam', es: 'Graba pantalla o cámara', fr: 'Enregistrez écran ou webcam', de: 'Bildschirm oder Webcam aufnehmen', pt: 'Grave tela ou webcam', ru: 'Запишите экран или веб-камеру', hi: 'स्क्रीन या वेबकैम रिकॉर्ड करें', ja: '画面やカメラを録画', zh: '录制屏幕或摄像头' } },
  ],
  'key-doctor': [
    { target: 'device-test', labels: { en: 'Test camera and mic', es: 'Prueba cámara y micro', fr: 'Testez caméra et micro', de: 'Kamera und Mikro testen', pt: 'Teste câmera e microfone', ru: 'Проверьте камеру и микрофон', hi: 'कैमरा और माइक जांचें', ja: 'カメラとマイクをテスト', zh: '测试摄像头和麦克风' } },
  ],
  'uuid-generator': [
    { target: 'passbolt', labels: { en: 'Generate secure passwords', es: 'Genera contraseñas seguras', fr: 'Générez des mots de passe sûrs', de: 'Sichere Passwörter erzeugen', pt: 'Gere senhas seguras', ru: 'Создайте надёжные пароли', hi: 'सुरक्षित पासवर्ड बनाएं', ja: '安全なパスワードを生成', zh: '生成安全密码' } },
  ],
  'lorem-flow': [
    { target: 'wordflow', labels: { en: 'Count words and characters', es: 'Cuenta palabras y caracteres', fr: 'Comptez mots et caractères', de: 'Wörter und Zeichen zählen', pt: 'Conte palavras e caracteres', ru: 'Подсчитайте слова и символы', hi: 'शब्द और अक्षर गिनें', ja: '単語と文字数をカウント', zh: '统计字数和字符' } },
  ],
  wordflow: [
    { target: 'lorem-flow', labels: { en: 'Generate placeholder text', es: 'Genera texto de relleno', fr: 'Générez du texte de remplissage', de: 'Platzhaltertext erzeugen', pt: 'Gere texto de exemplo', ru: 'Создайте текст-заполнитель', hi: 'प्लेसहोल्डर टेक्स्ट बनाएं', ja: 'ダミーテキストを生成', zh: '生成占位文本' } },
  ],
  'exif-clear': [
    { target: 'compresssnap', labels: { en: 'Compress the clean image', es: 'Comprime la imagen limpia', fr: "Compressez l'image nettoyée", de: 'Bereinigtes Bild komprimieren', pt: 'Comprima a imagem limpa', ru: 'Сожмите очищенное изображение', hi: 'साफ़ छवि संपीड़ित करें', ja: '処理済み画像を圧縮', zh: '压缩清理后的图像' } },
  ],
  'watermark-snap': [
    { target: 'compresssnap', labels: { en: 'Compress the image', es: 'Comprime la imagen', fr: "Compressez l'image", de: 'Bild komprimieren', pt: 'Comprima a imagem', ru: 'Сожмите изображение', hi: 'छवि संपीड़ित करें', ja: '画像を圧縮', zh: '压缩图像' } },
  ],
  'pdf-flow': [
    { target: 'zip-flow', labels: { en: 'Zip your files', es: 'Comprime archivos en ZIP', fr: 'Compressez vos fichiers en ZIP', de: 'Dateien als ZIP packen', pt: 'Compacte arquivos em ZIP', ru: 'Упакуйте файлы в ZIP', hi: 'फ़ाइलें ZIP करें', ja: 'ファイルをZIP圧縮', zh: '将文件打包为 ZIP' } },
  ],
  'zip-flow': [
    { target: 'pdf-flow', labels: { en: 'Merge images into a PDF', es: 'Une imágenes en un PDF', fr: 'Fusionnez des images en PDF', de: 'Bilder zu PDF zusammenfügen', pt: 'Junte imagens em um PDF', ru: 'Объедините изображения в PDF', hi: 'छवियों को PDF में जोड़ें', ja: '画像をPDFに結合', zh: '将图像合并为 PDF' } },
  ],
  'aspect-ratio': [
    { target: 'cropsnap', labels: { en: 'Crop to that ratio', es: 'Recorta a esa proporción', fr: 'Recadrez à ce ratio', de: 'Auf dieses Verhältnis zuschneiden', pt: 'Recorte nessa proporção', ru: 'Обрежьте под эту пропорцию', hi: 'उस अनुपात में क्रॉप करें', ja: 'その比率でトリミング', zh: '按该比例裁剪' } },
  ],
};
