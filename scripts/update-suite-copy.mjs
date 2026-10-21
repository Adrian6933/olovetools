// Idempotent copy migration for the October tool review. No automatic translation.
import fs from 'node:fs';
import ts from 'typescript';

const keys = ['youtubeMode', 'modeVideo', 'modeAudio', 'modeMetadata', 'qualityLabel', 'qualityMax', 'youtubeAvailable', 'youtubeLimited', 'invalidLines', 'duplicatesRemoved', 'queueLimit', 'downloadQueue', 'retryFailed', 'batchDone', 'batchFailed', 'saveMetadata', 'openOriginal'];
const copy = {
  en: ['YouTube output', 'Video + audio', 'Audio (MP3)', 'Thumbnails only', 'Maximum video quality', 'Best available', 'Video and audio extraction is enabled. Availability depends on the source.', 'YouTube: thumbnails and details are available. Video and audio downloads are not enabled on this server.', 'Review these unsupported entries', 'Duplicate links removed', 'The queue holds up to 30 links. Clear it before adding more.', 'Download queue selection', 'Retry failed links', 'Download ready', 'The batch failed. No incomplete ZIP was saved. Retry the marked file.', 'Save details (.json)', 'Open original'],
  es: ['Salida de YouTube', 'Vídeo + audio', 'Audio (MP3)', 'Solo miniaturas', 'Calidad máxima del vídeo', 'La mejor disponible', 'La extracción de vídeo y audio está activada. La disponibilidad depende de la fuente.', 'YouTube: puedes obtener miniaturas y datos. Este servidor aún no tiene activada la descarga de vídeo ni audio.', 'Revisa estas entradas no admitidas', 'Enlaces duplicados eliminados', 'La cola admite hasta 30 enlaces. Vacíala antes de añadir más.', 'Descargar selección de la cola', 'Reintentar los fallidos', 'Descarga preparada', 'El lote ha fallado. No se ha guardado un ZIP incompleto. Reintenta el archivo marcado.', 'Guardar datos (.json)', 'Abrir original'],
  fr: ['Sortie YouTube', 'Vidéo + audio', 'Audio (MP3)', 'Miniatures uniquement', 'Qualité vidéo maximale', 'La meilleure disponible', 'L’extraction vidéo et audio est activée. La disponibilité dépend de la source.', 'YouTube : miniatures et informations disponibles. Le téléchargement vidéo et audio n’est pas activé sur ce serveur.', 'Vérifiez ces entrées non prises en charge', 'Liens en double supprimés', 'La file accepte 30 liens au maximum. Videz-la avant d’en ajouter.', 'Télécharger la sélection de la file', 'Réessayer les liens en échec', 'Téléchargement prêt', 'Le lot a échoué. Aucun ZIP incomplet n’a été enregistré. Réessayez le fichier signalé.', 'Enregistrer les données (.json)', 'Ouvrir l’original'],
  de: ['YouTube-Ausgabe', 'Video + Audio', 'Audio (MP3)', 'Nur Vorschaubilder', 'Maximale Videoqualität', 'Beste verfügbare', 'Video- und Audioextraktion ist aktiviert. Die Verfügbarkeit hängt von der Quelle ab.', 'YouTube: Vorschaubilder und Angaben sind verfügbar. Video- und Audiodownloads sind auf diesem Server nicht aktiviert.', 'Diese nicht unterstützten Einträge prüfen', 'Doppelte Links entfernt', 'Die Warteschlange fasst höchstens 30 Links. Vor weiteren Links bitte leeren.', 'Auswahl der Warteschlange herunterladen', 'Fehlgeschlagene Links wiederholen', 'Download bereit', 'Der Stapel ist fehlgeschlagen. Es wurde kein unvollständiges ZIP gespeichert. Die markierte Datei erneut versuchen.', 'Angaben speichern (.json)', 'Original öffnen'],
  pt: ['Saída do YouTube', 'Vídeo + áudio', 'Áudio (MP3)', 'Apenas miniaturas', 'Qualidade máxima do vídeo', 'A melhor disponível', 'A extração de vídeo e áudio está ativada. A disponibilidade depende da fonte.', 'YouTube: miniaturas e dados disponíveis. Este servidor ainda não tem a transferência de vídeo e áudio ativada.', 'Reveja estas entradas não suportadas', 'Ligações duplicadas removidas', 'A fila aceita até 30 ligações. Esvazie-a antes de adicionar mais.', 'Transferir seleção da fila', 'Tentar novamente as falhadas', 'Transferência pronta', 'O lote falhou. Não foi guardado um ZIP incompleto. Tente novamente o ficheiro assinalado.', 'Guardar dados (.json)', 'Abrir original'],
  ru: ['Результат YouTube', 'Видео + аудио', 'Аудио (MP3)', 'Только обложки', 'Максимальное качество видео', 'Лучшее доступное', 'Извлечение видео и аудио включено. Доступность зависит от источника.', 'YouTube: доступны обложки и сведения. Скачивание видео и аудио на этом сервере не включено.', 'Проверьте неподдерживаемые записи', 'Повторяющиеся ссылки удалены', 'В очереди может быть не более 30 ссылок. Очистите её перед добавлением новых.', 'Скачать выбранное из очереди', 'Повторить неудачные ссылки', 'Загрузка готова', 'Не удалось обработать пакет. Неполный ZIP не сохранён. Повторите отмеченный файл.', 'Сохранить сведения (.json)', 'Открыть оригинал'],
  hi: ['YouTube आउटपुट', 'वीडियो + ऑडियो', 'ऑडियो (MP3)', 'केवल थंबनेल', 'अधिकतम वीडियो गुणवत्ता', 'सर्वोत्तम उपलब्ध', 'वीडियो और ऑडियो निकालना चालू है। उपलब्धता स्रोत पर निर्भर है।', 'YouTube: थंबनेल और जानकारी उपलब्ध हैं। इस सर्वर पर वीडियो और ऑडियो डाउनलोड चालू नहीं हैं।', 'इन असमर्थित प्रविष्टियों की जाँच करें', 'डुप्लिकेट लिंक हटाए गए', 'कतार में अधिकतम 30 लिंक हो सकते हैं। और जोड़ने से पहले इसे खाली करें।', 'कतार का चयन डाउनलोड करें', 'असफल लिंक फिर से आज़माएँ', 'डाउनलोड तैयार है', 'बैच असफल रहा। अधूरी ZIP सहेजी नहीं गई। चिह्नित फ़ाइल फिर से आज़माएँ।', 'जानकारी सहेजें (.json)', 'मूल खोलें'],
  ja: ['YouTubeの出力', '動画＋音声', '音声（MP3）', 'サムネイルのみ', '動画の最高画質', '利用可能な最高画質', '動画と音声の抽出が有効です。取得できるかどうかは配信元によります。', 'YouTube：サムネイルと情報を取得できます。このサーバーでは動画・音声のダウンロードは有効になっていません。', '未対応の入力を確認してください', '重複リンクを削除しました', 'キューには最大30件まで追加できます。追加する前にキューを空にしてください。', 'キューの選択項目をダウンロード', '失敗したリンクを再試行', 'ダウンロードの準備ができました', '一括処理に失敗しました。不完全なZIPは保存されていません。印の付いたファイルを再試行してください。', '情報を保存（.json）', '元のページを開く'],
  zh: ['YouTube 输出', '视频＋音频', '音频（MP3）', '仅缩略图', '视频最高画质', '最佳可用画质', '已启用视频和音频提取。能否获取取决于来源。', 'YouTube：可获取缩略图和信息。此服务器尚未启用视频和音频下载。', '请检查这些不支持的输入', '已移除重复链接', '队列最多容纳30个链接。添加更多链接前请清空队列。', '下载队列中的所选项目', '重试失败的链接', '下载已就绪', '批量处理失败，未保存不完整的ZIP。请重试标记的文件。', '保存信息（.json）', '打开原始页面'],
};
const privacy = {
  en: 'The link goes to our server and the platform or resolver needed to retrieve the media. No public CORS proxies are used.',
  es: 'El enlace se envía a nuestro servidor y a la plataforma o resolutor necesario para obtener los archivos. No se usan proxies CORS públicos.',
  fr: 'Le lien est envoyé à notre serveur et à la plateforme ou au résolveur nécessaire pour récupérer les fichiers. Aucun proxy CORS public n’est utilisé.',
  de: 'Der Link wird an unseren Server und die zum Abruf nötige Plattform oder den Resolver gesendet. Öffentliche CORS-Proxys werden nicht verwendet.',
  pt: 'A ligação é enviada ao nosso servidor e à plataforma ou serviço necessário para obter os ficheiros. Não são usados proxies CORS públicos.',
  ru: 'Ссылка передаётся нашему серверу и платформе или сервису, необходимому для получения файлов. Публичные CORS-прокси не используются.',
  hi: 'लिंक हमारे सर्वर और मीडिया प्राप्त करने के लिए आवश्यक प्लेटफ़ॉर्म या रिज़ॉल्वर को भेजा जाता है। सार्वजनिक CORS प्रॉक्सी का उपयोग नहीं होता।',
  ja: 'リンクは当社サーバーと、ファイル取得に必要な配信元または解決サービスに送信されます。公開CORSプロキシは使用しません。',
  zh: '链接会发送至我们的服务器，以及获取文件所需的平台或解析服务。不使用公共CORS代理。',
};
for (const [lang, values] of Object.entries(copy)) {
  const path = `src/locales/${lang}/socialbolt.ts`;
  const exports = {};
  new Function('exports', ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(exports);
  const dictionary = exports.default;
  keys.forEach((key, i) => { dictionary[key] = values[i]; });
  dictionary.warn_youtube_video = values[7];
  dictionary.supportYoutube = values[7];
  if (dictionary.features?.[4]) dictionary.features[4].text = privacy[lang];
  if (dictionary.faq?.[1]) dictionary.faq[1].answer = values[7];
  fs.writeFileSync(path, `export default ${JSON.stringify(dictionary, null, 2)};\n`);
}

function migrate(tool, keys, translations) {
  for (const [lang, values] of Object.entries(translations)) {
    const path = `src/locales/${lang}/${tool}.ts`, exports = {};
    new Function('exports', ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(exports);
    keys.forEach((key, i) => { exports.default[key] = values[i]; });
    if (tool === 'whois-bolt') {
      const signed = { en: 'Delegation signed', es: 'Delegación firmada', fr: 'Délégation signée', de: 'Delegation signiert', pt: 'Delegação assinada', ru: 'Делегирование подписано', hi: 'डेलिगेशन हस्ताक्षरित है', ja: '委任は署名済み', zh: '委派已签名' };
      exports.default.registrationSigned = signed[lang];
      const faq = exports.default.faq?.[0];
      if (faq && !faq.answer.includes(exports.default.registrationHint)) faq.answer += ' ' + exports.default.registrationHint;
    }
    fs.writeFileSync(path, `export default ${JSON.stringify(exports.default, null, 2)};\n`);
  }
}
migrate('pdf-flow', ['rangeInvalid', 'rangeOrderHint'], {
  en: ['Use page numbers from 1 to {n}, separated by commas or ranges. Every page must exist.', 'The order is preserved: 3, 1 exports page 3 first. Use 5-2 to reverse a range.'],
  es: ['Usa páginas de la 1 a la {n}, separadas por comas o rangos. Todas deben existir.', 'Se conserva el orden: 3, 1 exporta primero la página 3. Usa 5-2 para invertir un rango.'],
  fr: ['Utilisez des pages de 1 à {n}, séparées par des virgules ou des plages. Toutes doivent exister.', 'L’ordre est conservé : 3, 1 exporte la page 3 en premier. Utilisez 5-2 pour inverser une plage.'],
  de: ['Seiten von 1 bis {n} mit Kommas oder Bereichen eingeben. Jede Seite muss existieren.', 'Die Reihenfolge bleibt erhalten: 3, 1 exportiert zuerst Seite 3. Mit 5-2 einen Bereich umkehren.'],
  pt: ['Use páginas de 1 a {n}, separadas por vírgulas ou intervalos. Todas devem existir.', 'A ordem é mantida: 3, 1 exporta primeiro a página 3. Use 5-2 para inverter um intervalo.'],
  ru: ['Укажите страницы от 1 до {n} через запятую или диапазоном. Все страницы должны существовать.', 'Порядок сохраняется: 3, 1 сначала экспортирует страницу 3. Диапазон 5-2 меняет порядок на обратный.'],
  hi: ['1 से {n} तक पृष्ठ संख्याएँ कॉमा या रेंज से लिखें। हर पृष्ठ मौजूद होना चाहिए।', 'क्रम बना रहता है: 3, 1 में पहले पृष्ठ 3 निर्यात होगा। उलटे क्रम के लिए 5-2 लिखें।'],
  ja: ['1〜{n}のページ番号をカンマまたは範囲で指定してください。存在するページのみ指定できます。', '入力順を保持します。3, 1なら3ページ目が先になります。5-2で範囲を逆順にできます。'],
  zh: ['请输入1至{n}的页码，用逗号或范围分隔。所有页面都必须存在。', '保留输入顺序：3, 1将先导出第3页。用5-2可反向排列范围。'],
});
migrate('binary-flow', ['operationLimit'], {
  en: ['Unlimited left shifts are limited to 65,536 bits to keep the page responsive. Choose a fixed width for larger shifts.'],
  es: ['Los desplazamientos a la izquierda sin ancho fijo se limitan a 65.536 bits para que la página siga respondiendo. Elige un ancho fijo para desplazamientos mayores.'],
  fr: ['Les décalages à gauche sans largeur fixe sont limités à 65 536 bits pour garder la page réactive. Choisissez une largeur fixe pour les décalages plus grands.'],
  de: ['Linksverschiebungen ohne feste Breite sind auf 65.536 Bit begrenzt, damit die Seite reagiert. Für größere Verschiebungen eine feste Breite wählen.'],
  pt: ['Os deslocamentos à esquerda sem largura fixa estão limitados a 65.536 bits para manter a página responsiva. Escolha uma largura fixa para deslocamentos maiores.'],
  ru: ['Сдвиги влево без фиксированной разрядности ограничены 65 536 битами, чтобы страница не зависала. Для больших сдвигов выберите фиксированную разрядность.'],
  hi: ['पेज को सुचारु रखने के लिए बिना निश्चित बिट चौड़ाई वाले बाएँ शिफ्ट 65,536 बिट तक सीमित हैं। बड़े शिफ्ट के लिए निश्चित चौड़ाई चुनें।'],
  ja: ['ページの応答を保つため、幅を指定しない左シフトは65,536ビットまでです。それ以上のシフトには固定幅を選んでください。'],
  zh: ['为保持页面响应，无固定宽度的左移最多为65,536位。更大的移位请选择固定宽度。'],
});
migrate('pdf-flow', ['fileReadError'], {
  en: ['This PDF could not be read. It may be empty, damaged or require a password.'],
  es: ['No se ha podido leer este PDF. Puede estar vacío, dañado o necesitar una contraseña.'],
  fr: ['Ce PDF n’a pas pu être lu. Il peut être vide, endommagé ou protégé par un mot de passe.'],
  de: ['Dieses PDF konnte nicht gelesen werden. Es ist möglicherweise leer, beschädigt oder benötigt ein Passwort.'],
  pt: ['Não foi possível ler este PDF. Pode estar vazio, danificado ou precisar de uma palavra-passe.'],
  ru: ['Не удалось прочитать PDF. Возможно, он пуст, повреждён или требует пароль.'],
  hi: ['यह PDF पढ़ा नहीं जा सका। यह खाली, क्षतिग्रस्त या पासवर्ड से सुरक्षित हो सकता है।'],
  ja: ['このPDFを読み取れませんでした。空、破損、またはパスワードが必要な可能性があります。'],
  zh: ['无法读取此PDF。文件可能为空、损坏或需要密码。'],
});
migrate('whois-bolt', ['registrationTitle','registrationLookup','registrationHint','registrationInvalid','registrationMissing','registrationFailed','registrarLabel','createdLabel','expiresLabel','updatedLabel','registrationUnsigned','registrationSave','registrationSource'], {
  en: ['Domain registration · RDAP','Look up registration','Enter the registered domain (example.com). This optional query goes through our server to IANA and the authoritative registry. Contact details are omitted.','Enter a registered domain first.','No registration was returned. Check that you entered the registered domain, without a subdomain.','The registry is unavailable or this domain extension does not publish RDAP. Try again later.','Registrar','Registered','Expires','Last changed','Delegation not signed','Save registration (.json)','Authoritative source'],
  es: ['Registro del dominio · RDAP','Consultar registro','Escribe el dominio registrado (example.com). Esta consulta opcional pasa por nuestro servidor hacia IANA y el registro oficial. Se omiten los datos de contacto.','Introduce primero un dominio registrado.','No se ha devuelto un registro. Comprueba que has escrito el dominio registrado, sin subdominios.','El registro no responde o esta extensión no publica RDAP. Inténtalo más tarde.','Registrador','Fecha de registro','Caducidad','Último cambio','Delegación sin firmar','Guardar registro (.json)','Fuente oficial'],
  fr: ['Enregistrement du domaine · RDAP','Consulter le registre','Saisissez le domaine enregistré (example.com). Cette requête facultative passe par notre serveur vers IANA et le registre officiel. Les coordonnées sont omises.','Saisissez d’abord un domaine enregistré.','Aucun enregistrement reçu. Vérifiez le domaine enregistré, sans sous-domaine.','Le registre ne répond pas ou cette extension ne publie pas de RDAP. Réessayez plus tard.','Bureau d’enregistrement','Date d’enregistrement','Expiration','Dernière modification','Délégation non signée','Enregistrer le registre (.json)','Source officielle'],
  de: ['Domainregistrierung · RDAP','Registrierung abfragen','Die registrierte Domain eingeben (example.com). Diese optionale Abfrage geht über unseren Server an IANA und die zuständige Registry. Kontaktdaten werden ausgelassen.','Zuerst eine registrierte Domain eingeben.','Kein Eintrag zurückgegeben. Die registrierte Domain ohne Subdomain prüfen.','Die Registry ist nicht erreichbar oder diese Endung bietet kein RDAP. Später erneut versuchen.','Registrar','Registriert am','Läuft ab','Zuletzt geändert','Delegation nicht signiert','Registrierung speichern (.json)','Offizielle Quelle'],
  pt: ['Registo do domínio · RDAP','Consultar registo','Introduza o domínio registado (example.com). Esta consulta opcional passa pelo nosso servidor para a IANA e o registo oficial. Os contactos são omitidos.','Introduza primeiro um domínio registado.','Não foi devolvido um registo. Verifique o domínio registado, sem subdomínios.','O registo não responde ou esta extensão não publica RDAP. Tente mais tarde.','Entidade registadora','Data de registo','Validade','Última alteração','Delegação não assinada','Guardar registo (.json)','Fonte oficial'],
  ru: ['Регистрация домена · RDAP','Проверить регистрацию','Введите зарегистрированный домен (example.com). Этот необязательный запрос идёт через наш сервер к IANA и официальному реестру. Контактные данные исключены.','Сначала введите зарегистрированный домен.','Запись не получена. Проверьте зарегистрированный домен без поддоменов.','Реестр недоступен или эта доменная зона не публикует RDAP. Повторите позже.','Регистратор','Зарегистрирован','Истекает','Последнее изменение','Делегирование не подписано','Сохранить регистрацию (.json)','Официальный источник'],
  hi: ['डोमेन पंजीकरण · RDAP','पंजीकरण देखें','पंजीकृत डोमेन लिखें (example.com)। यह वैकल्पिक अनुरोध हमारे सर्वर से IANA और आधिकारिक रजिस्ट्री को जाता है। संपर्क जानकारी शामिल नहीं होती।','पहले पंजीकृत डोमेन लिखें।','पंजीकरण नहीं मिला। उपडोमेन के बिना पंजीकृत डोमेन की जाँच करें।','रजिस्ट्री उपलब्ध नहीं है या यह एक्सटेंशन RDAP प्रकाशित नहीं करता। बाद में फिर कोशिश करें।','रजिस्ट्रार','पंजीकरण तिथि','समाप्ति तिथि','अंतिम बदलाव','डेलिगेशन हस्ताक्षरित नहीं','पंजीकरण सहेजें (.json)','आधिकारिक स्रोत'],
  ja: ['ドメイン登録 · RDAP','登録情報を取得','登録済みドメイン（example.com）を入力してください。この任意の照会は当社サーバーからIANAと公式レジストリに送信されます。連絡先情報は表示しません。','登録済みドメインを入力してください。','登録情報が返されませんでした。サブドメインを除いた登録済みドメインを確認してください。','レジストリが利用できないか、この拡張子はRDAPに対応していません。後で再試行してください。','レジストラ','登録日','有効期限','最終変更','委任は未署名','登録情報を保存（.json）','公式の情報源'],
  zh: ['域名注册 · RDAP','查询注册信息','请输入注册域名（example.com）。此可选查询通过我们的服务器发送至IANA和官方注册局。不返回联系信息。','请先输入注册域名。','未返回注册信息。请检查是否输入了不含子域名的注册域名。','注册局暂不可用，或此后缀不提供RDAP。请稍后重试。','注册商','注册日期','到期日期','最后变更','委派未签名','保存注册信息（.json）','官方来源'],
});
