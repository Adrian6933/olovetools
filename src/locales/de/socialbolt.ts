export default {
  "resetHint": "Neu anfangen",
  "title": "SocialBolt",
  "description": "Füge einen TikTok- oder X-Link ein und wähle genau, was du mitnimmst: Video ohne Wasserzeichen, HD-Spur, MP3-Audio, Titelbild oder alle Fotos des Karussells.",
  "heroKicker": "Downloader für soziale Netzwerke",
  "noAutoNote": "Einen Link einzufügen lädt nichts herunter. Du wählst die Dateien und drückst dann den Knopf.",
  "inputLabel": "Links (einer pro Zeile)",
  "placeholder": "https://www.tiktok.com/@nutzer/video/…\nhttps://x.com/nutzer/status/…",
  "unsupportedTag": "Nicht unterstützt",
  "shortcutHint": "Enter zum Analysieren · Umschalt+Enter für neue Zeile · Esc leert",
  "btn_analyze": "Links analysieren",
  "btn_fetching": "Wird analysiert…",
  "btn_paste": "Einfügen",
  "btn_cancel": "Abbrechen",
  "btn_clear": "Warteschlange leeren",
  "btn_retry": "Erneut versuchen",
  "btn_remove": "Aus der Warteschlange nehmen",
  "btn_download": "Herunterladen",
  "btn_download_selected": "Auswahl herunterladen",
  "btn_download_zip": "Als ZIP herunterladen",
  "queueTitle": "Warteschlange",
  "assetsTitle": "Verfügbare Dateien",
  "selectAll": "Alles auswählen",
  "selectNone": "Auswahl aufheben",
  "status_queued": "Wartet",
  "status_resolving": "Beitrag wird gelesen…",
  "status_ready": "Fertig",
  "status_error": "Fehlgeschlagen",
  "manualTitle": "Manueller Modus: direkten Dateilink einfügen",
  "manualHint": "Überspringt den Resolver",
  "manualText": "Wenn du die direkte CDN-Adresse der Datei schon hast, wirf sie hier hinein: SocialBolt geht sofort zum Download über, ohne den Beitrag zu lesen und ohne Metadaten anzufragen.",
  "manualPlaceholder": "https://v19.tiktokcdn-us.com/….mp4",
  "manualAdd": "Hinzufügen",
  "assetVideo": "Videodatei",
  "assetVideoHd": "Videodatei in HD",
  "assetVideoNoWatermark": "Video ohne Wasserzeichen",
  "assetVideoWatermark": "Video mit Wasserzeichen",
  "assetAudio": "Tonspur (MP3)",
  "assetCover": "Titelbild",
  "assetAvatar": "Avatar des Autors",
  "assetSlide": "Folie",
  "assetPhoto": "Foto",
  "assetPoster": "Vorschaubild des Videos",
  "assetThumbnail": "Vorschaubild, höchste Auflösung",
  "assetThumbnailAlt": "Vorschaubild, Standardauflösung",
  "assetGif": "Animiertes GIF (MP4)",
  "assetDirect": "Direkte Datei",
  "views": "Aufrufe",
  "likes": "Likes",
  "comments": "Kommentare",
  "shares": "Geteilt",
  "error_invalid_url": "Das ist kein Link, den SocialBolt lesen kann. Nimm eine Adresse von TikTok, X, YouTube oder Instagram.",
  "error_failed": "Mit diesem Link ist etwas schiefgelaufen.",
  "err_network": "Der Server war nicht erreichbar. Prüfe die Verbindung und versuche es erneut.",
  "err_rate_limited": "Der TikTok-Resolver drosselt uns gerade. Warte ein paar Sekunden und versuche es noch einmal.",
  "err_not_found": "Diesen Beitrag gibt es nicht mehr, oder er ist privat.",
  "err_bad_url": "In der Adresse fehlt die Kennung des Beitrags.",
  "err_unsupported_platform": "Diese Plattform wird nicht unterstützt.",
  "err_no_media": "Der Beitrag enthält keine herunterladbaren Medien.",
  "err_instagram_blocked": "Instagram hat die Anfrage abgelehnt. Es sperrt Serveradressen bei fast allen Beiträgen, deshalb kommen nur wenige öffentliche durch.",
  "err_resolver_unavailable": "Der Resolver antwortet gerade nicht. Versuch es in einer Minute noch einmal.",
  "err_resolve_failed": "Dieser Beitrag ließ sich nicht lesen.",
  "err_download_failed": "Die Datei konnte nicht geladen werden. Ihr Link ist womöglich abgelaufen — analysiere den Beitrag erneut.",
  "err_cancelled": "Abgebrochen.",
  "err_missing_url": "Es wurde kein Link gesendet.",
  "warn_youtube_video": "Von YouTube gibt es hier nur die Metadaten und die Vorschaubilder: die Videospur zu laden verlangt das Entschlüsseln einer Signatur, was kein Browser kostenlos schafft.",
  "warn_no_media": "In diesem Beitrag wurden keine Medien gefunden.",
  "supportTitle": "Was wirklich funktioniert, ehrlich gesagt",
  "supportTiktok": "Vollständig: Video in HD, Video ohne Wasserzeichen, das Original mit Wasserzeichen, MP3-Audio, Titelbild, Avatar des Autors und alle Fotos einer Bildfolge.",
  "supportTwitter": "Vollständig: alle Bitraten des Videos, animierte GIFs, Fotos in Originalauflösung und das Vorschaubild.",
  "supportYoutube": "Teilweise: Titel, Kanal und Vorschaubilder in allen Auflösungen. Die Videospur selbst ist nicht verfügbar; die Karte erklärt warum.",
  "supportInstagram": "Nach bestem Bemühen: Instagram sperrt Anfragen von Servern, deshalb lassen sich nur manche öffentlichen Beiträge auflösen.",
  "howTitle": "So funktioniert es",
  "howSteps": [
    {
      "title": "Links einfügen",
      "text": "Einen oder mehrere, einen pro Zeile. SocialBolt markiert die Plattform jedes Links und hört da auf: es wird nichts abgerufen, bevor du es sagst."
    },
    {
      "title": "Aussuchen, was du mitnimmst",
      "text": "Alle Fassungen des Beitrags stehen mit ihrer Größe in der Liste. Hake an, was du willst — der Rest wird nie geladen."
    },
    {
      "title": "Herunterladen oder weiterarbeiten",
      "text": "Eine Datei kommt einzeln, mehrere kommen als ZIP. Oder schick das Ergebnis direkt an ein anderes oLoveTools-Werkzeug, ohne es vorher zu speichern."
    }
  ],
  "features": [
    {
      "title": "Ohne Wasserzeichen, ohne neu zu kodieren",
      "text": "TikTok-Videos kommen aus der Originalspur, es wird also nichts ein zweites Mal komprimiert. Das Original mit Wasserzeichen bleibt verfügbar, falls du es brauchst."
    },
    {
      "title": "Die Qualität wählst du",
      "text": "HD oder Standard bei TikTok, und alle Bitraten, die X für seine Videos ausliefert, mit der Auflösung in jeder Zeile."
    },
    {
      "title": "Mehrere Links auf einmal",
      "text": "Füg eine ganze Liste ein. Jeder Link wird der Reihe nach aufgelöst, im Tempo, das der Resolver zulässt, und ein fehlgeschlagener lässt sich einzeln wiederholen."
    },
    {
      "title": "Ton, Titelbilder und Avatare",
      "text": "Das MP3 des Sounds, das Titelbild in voller Auflösung und der Avatar des Autors sind eigene Dateien, nichts, was du selbst zurechtschneiden musst."
    },
    {
      "title": "Dein Link bleibt hier",
      "text": "Die Adresse geht an unsere eigene Funktion und sonst nirgendwohin: keine fremden CORS-Proxys, kein Tracking, nichts bleibt nach der Antwort übrig."
    },
    {
      "title": "Verkettet mit den anderen Werkzeugen",
      "text": "Schick das Video zu FrameSnap oder GIFBolt, oder das Bild zu CropSnap oder MemeBolt, ohne es herunterzuladen und wieder hochzuladen."
    }
  ],
  "nextStepTitle": "Weitermachen",
  "nextStepHint": "Die Datei reist mit, kein erneutes Hochladen",
  "nextFrames": "Einzelbilder holen",
  "nextGif": "In ein GIF verwandeln",
  "nextCrop": "Zuschneiden",
  "nextCompress": "Komprimieren",
  "nextCutout": "Hintergrund entfernen",
  "nextWatermark": "Wasserzeichen setzen",
  "nextMeme": "Meme daraus machen",
  "scrollTopLabel": "Nach oben",
  "seo_title": "SocialBolt | TikTok-Videos ohne Wasserzeichen und X-Videos herunterladen",
  "seo_description": "Füge einen TikTok- oder X-Link ein und lade das Video ohne Wasserzeichen, in HD, sein MP3-Audio, das Titelbild oder alle Fotos des Karussells. Ohne Konto und ohne Installation.",
  "seoHeroTitle": "Ein Downloader, der sagt, was er kann und was nicht",
  "seoHeroText": "Die meisten Downloader versprechen jede Plattform und liefern dann eine kaputte Datei oder eine Kette von Weiterleitungen. SocialBolt löst den Link in einer eigenen Serverfunktion auf, listet jede Datei, die der Beitrag wirklich enthält, und sagt offen, wo das kostenlose Netz endet.",
  "seoHeroList": [
    "TikTok ohne Wasserzeichen, in HD",
    "Alle Bitraten eines X-Videos",
    "Ton, Titelbilder und Avatare separat",
    "Stapel-Warteschlange mit ZIP-Ausgabe"
  ],
  "seoBrowserSpeedTitle": "Keine fremden Proxys",
  "seoBrowserSpeedText": "Die frühere Fassung schickte deinen Link durch öffentliche CORS-Proxys von Unbekannten. Jetzt geht die Anfrage an die eigene Funktion von oLoveTools, und die Datei holt dein Browser direkt vom CDN der Plattform, wann immer das CDN es zulässt.",
  "seoSecondaryTitle": "Gemacht für alle, die danach mit den Clips arbeiten",
  "seoUseCaseTitle": "Für Kreative und Cutter",
  "seoUseCaseText": "Sichere deine eigenen Beiträge vor einem Kontowechsel, sammle Referenzclips für einen Schnitt, hol dir den Sound eines Trends oder ein Titelbild in voller Auflösung für ein Thumbnail.",
  "seoPrivacyTitle": "Was gespeichert wird: nichts",
  "seoPrivacyText": "Der Link dient nur dazu, deine Anfrage zu beantworten, und landet in keiner Datenbank. Die geladene Datei entsteht im Speicher deines Browsers und wird von dir gesichert — sie liegt nie auf einem Server.",
  "seoKeywordsTitle": "Verwandte Suchanfragen",
  "seoKeywords": [
    "tiktok herunterladen",
    "tiktok ohne wasserzeichen",
    "tiktok als mp3",
    "X-Video herunterladen",
    "twitter video herunterladen",
    "tiktok bildfolge herunterladen",
    "youtube vorschaubild herunterladen",
    "downloader für soziale netzwerke"
  ],
  "faqTitle": "Häufige Fragen",
  "faq": [
    {
      "question": "Wird das TikTok-Wasserzeichen wirklich entfernt?",
      "answer": "Ja. TikTok selbst liefert eine saubere Kopie der Spur aus, und genau die bekommst du; die Fassung mit Wasserzeichen steht als eigene Zeile bereit, falls du sie brauchst."
    },
    {
      "question": "Warum kann ich keine YouTube-Videos laden?",
      "answer": "Weil es kostenlos weder im Browser noch auf einem kleinen Server geht: die Streams von YouTube sind mit einer Signatur geschützt, die sich ständig ändert und nur mit dem eigenen Player entschlüsselt werden kann. Statt so zu tun als ob, gibt SocialBolt dir die Metadaten und die Vorschaubilder."
    },
    {
      "question": "Und Instagram?",
      "answer": "Instagram hat seine öffentlichen Endpunkte geschlossen und weist Anfragen von Serveradressen ab, deshalb lässt sich nur ein Teil der öffentlichen Beiträge auflösen. Wenn es fehlschlägt, sagt das Werkzeug es, statt endlos zu drehen."
    },
    {
      "question": "Kann ich mehrere Links auf einmal laden?",
      "answer": "Ja. Füge einen pro Zeile ein, dann kommen sie in die Warteschlange. Wählst du mehr als eine Datei, kommen sie gemeinsam als ZIP."
    },
    {
      "question": "Ist es legal, diese Videos herunterzuladen?",
      "answer": "Der Download für den eigenen Gebrauch — eine Sicherung deiner eigenen Beiträge, eine Referenz für einen Schnitt — gilt allgemein als in Ordnung. Fremde Inhalte erneut zu veröffentlichen oder ohne Erlaubnis kommerziell zu nutzen, nicht. Dieser Teil liegt bei dir."
    }
  ],
  "footerTagline": "Saubere, ehrliche und schnelle Werkzeuge für Creator.",
  "footerCredit": "Teil der oLoveTools-Suite"
};
