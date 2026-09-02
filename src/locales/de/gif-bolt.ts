export default {
  "resetHint": "Neu anfangen",
  "title": "GIFBolt",
  "description": "Hol dir Einzelbilder aus einem Video oder reihe Fotos aneinander, bearbeite die Zeitleiste und kodiere ein GIF mit globaler Palette und Zwischenbildkompression – alles im Browser.",
  "tab_video": "Video zu GIF",
  "tab_images": "Bilder zu GIF",
  "label_upload_video": "Video hochladen",
  "label_upload_images": "Bilder hochladen",
  "label_duration": "Bildverzögerung (ms)",
  "label_fps": "Bildrate (FPS)",
  "label_size": "GIF-Breite",
  "label_quality": "Kompressionsqualität",
  "label_trim": "Zuschneidebereich",
  "label_start": "Startzeit",
  "label_end": "Endzeit",
  "btn_generate": "GIF generieren",
  "btn_generating": "GIF wird kompiliert...",
  "btn_download": "GIF herunterladen",
  "text_progress_extract": "Bilder werden extrahiert...",
  "text_progress_compile": "GIF wird kompiliert...",
  "history_title": "Verlauf der letzten GIFs",
  "no_history": "Noch kein GIF-Verlauf vorhanden.",
  "clear_history": "Verlauf löschen",
  "quality_high": "Hohe Qualität",
  "quality_medium": "Mittlere Qualität",
  "quality_low": "Niedrige Qualität (Schnell)",
  "drop_zone_video": "MP4, WebM, MOV, MKV, AVI – oder Bilder als PNG, JPG, WebP, AVIF, GIF, BMP und HEIC.",
  "drop_zone_images": "PNG, JPG, WebP, AVIF, GIF, BMP und HEIC. Zieh sie in der Reihenfolge hinein, in der sie laufen sollen.",
  "seo_title": "GIFBolt | Kostenloser Online-Konverter für Video zu GIF und Bilder zu GIF",
  "seo_description": "Wandle Video oder Bildfolgen im Browser in animierte GIFs um: bearbeitbare Zeitleiste, globale Palette, Floyd–Steinberg-Dithering und Zwischenbildkompression. Nichts wird hochgeladen.",
  "seoHeroTitle": "Mach aus einem Video oder einem Stapel Bilder ein GIF – direkt im Browser",
  "seoHeroText": "Hol die Einzelbilder aus einem Clip, bearbeite die Zeitleiste und kodiere mit globaler Palette, Dithering und Zwischenbildkompression. Nichts wird hochgeladen.",
  "seoHeroList": [
    "Die Bilder bleiben bis zum Kodieren bearbeitbar",
    "Eine Palette für die gesamte Schleife",
    "Nichts wird hochgeladen, nichts heruntergeladen"
  ],
  "seoBrowserSpeedTitle": "Ein echter GIF-Kodierer, kein Canvas-Abzug",
  "seoBrowserSpeedText": "Die Einzelbilder werden direkt aus dem dekodierten Video mit hochwertiger Skalierung gelesen und nie durch ein JPEG geschleust. Die Palette entsteht per Median-Cut über die ganze Animation, die Pixel werden mit Floyd–Steinberg-Dithering im Serpentinenverfahren zugeordnet, und alles, was ein Bild mit dem vorherigen teilt, wird transparent geschrieben und geerbt. Die Arbeit verteilt sich auf mehrere Web Worker, damit die Seite bedienbar bleibt und der Fortschrittsbalken echte Bilder zählt.",
  "seoUseCaseTitle": "Für Fehlerberichte, Demos und Reaktionsschleifen",
  "seoUseCaseText": "Nimm einen Fehler einmal auf und kürz ihn auf die vier Sekunden, auf die es ankommt. Mach aus einem Design-Rundgang etwas, das in einem Pull Request von allein läuft. Oder reihe ein paar Screenshots aneinander und stell ihr Timing von Hand ein. Die Zeitleiste bleibt bearbeitbar, bis du auf Kodieren drückst.",
  "seoPrivacyTitle": "Nichts wird hochgeladen, und heruntergeladen wird auch nichts",
  "seoPrivacyText": "Jeder Schritt läuft in diesem Tab: Der Videodekoder ist der des Browsers, Quantisierer und LZW-Kompressor sind JavaScript, das mit der Seite kommt, und das Ergebnis ist ein Blob, der deinen Rechner nie verlässt. Es gibt keinen Server, an den Dateien gingen, und kein Modell und keinen Codec aus einem CDN. Der Haken ist ehrlich: Alles hängt an deinem Arbeitsspeicher, ein 4K-Clip muss also gekürzt und verkleinert werden, bevor er sich kodieren lässt.",
  "faqTitle": "Häufig gestellte Fragen (FAQ)",
  "faq": [
    {
      "question": "Gibt es eine Größenbeschränkung?",
      "answer": "Keine feste, aber eine echte: Die Einzelbilder liegen im Speicher deines Tabs. Ein GIF mit 480 px und 4 Sekunden bei 12 fps sind rund 50 MB Arbeitsdaten und in ein paar Sekunden kodiert; ein 4K-Clip erschöpft den Tab lange vorher. Kürze den Abschnitt und senk die Arbeitsgröße – dafür sind diese Regler da."
    },
    {
      "question": "Warum ist mein GIF immer noch so groß?",
      "answer": "GIF ist ein Format von 1987: 256 Farben und keine Bewegungskompensation. Reduziere zuerst die Breite, dann die Bildrate, dann die Palette. „Unveränderte Pixel wiederverwenden“ eingeschaltet zu lassen bringt meist mehr als alle drei zusammen – bei einer Bildschirmaufnahme fällt damit der Großteil der Datei weg."
    },
    {
      "question": "Warum ist die Bildrate nicht genau die gewählte?",
      "answer": "GIF speichert jede Wartezeit in Hundertstelsekunden, es gibt also nur Raten der Form 100/n. 12 fps bedeuten in Wirklichkeit 8 Hundertstel pro Bild, also 12,5. Das Panel zeigt die Rate, die du tatsächlich bekommst, nicht die gewünschte."
    },
    {
      "question": "Welche Formate kann ich einwerfen?",
      "answer": "Jedes Video, das der Browser abspielen kann – MP4/H.264, WebM, MOV und oft MKV – dazu PNG, JPG, WebP, AVIF, GIF, BMP und iPhone-HEIC als Einzelbilder. Ein animiertes GIF, das als Bild hineinkommt, steuert nur sein erstes Bild bei."
    },
    {
      "question": "Wird irgendetwas hochgeladen?",
      "answer": "Nein. Es gibt keinen Upload-Schritt und keine externe Anfrage: Der Kodierer kommt mit der Seite und läuft in Web Workern in diesem Tab."
    },
    {
      "question": "Kann ich Transparenz behalten?",
      "answer": "Ja, mit dem Schalter „Transparenz behalten“. GIF kennt genau eine vollständig transparente Farbe, weiche Kanten werden also hart. Mit der Pixel-Wiederverwendung geht es nicht zusammen, weil beide denselben transparenten Platz brauchen."
    }
  ],
  "footerTagline": "Kostenlose, private und anpassbare clientseitige GIF-Erstellungswerkzeuge.",
  "footerCredit": "Teil der oLoveTools-Suite",
  "badge": "Video und Bilder → GIF",
  "dropTitle": "Zieh ein Video oder mehrere Bilder hierher",
  "dropHintNothing": "Eine Datei abzulegen startet nichts: Du wählst die Einstellungen und drückst den Knopf.",
  "modeAuto": "Einen Abschnitt holen",
  "modeManual": "Bilder von Hand auswählen",
  "manualHint": "Spul durch das Video und füge genau die Bilder hinzu, die du willst. Es läuft überhaupt kein automatischer Durchgang.",
  "btnCapture": "Dieses Bild aufnehmen",
  "labelWorkingSize": "Arbeitsgröße",
  "extractSummary": "{0} Bilder mit {1}×{2}. Ab hier lässt sich das GIF nur noch verkleinern.",
  "btnExtract": "Bilder herausholen",
  "btnExtractAgain": "Bilder erneut herausholen",
  "waitingHint": "Stell den Abschnitt ein und drück den Knopf. Vorher läuft nichts.",
  "btnPlay": "Abspielen",
  "btnPause": "Anhalten",
  "btnPrevFrame": "Vorheriges Bild",
  "btnNextFrame": "Nächstes Bild",
  "btnUndo": "Rückgängig",
  "btnRedo": "Wiederholen",
  "frameSummary": "{0} Bilder · {1} fps echt",
  "btnSelectAll": "Alles auswählen",
  "btnSelectNone": "Auswahl aufheben",
  "btnDeleteSelected": "{0} löschen",
  "btnKeepSelected": "Nur diese behalten",
  "btnReverse": "Umkehren",
  "btnPingPong": "Hin und zurück",
  "btnHalve": "Jedes zweite verwerfen",
  "btnAddImages": "Bilder hinzufügen",
  "btnResetDelays": "Timing zurücksetzen",
  "delayHint": "GIF speichert Wartezeiten in Hundertstelsekunden, deshalb rastet der Wert auf die nächsten 10 ms ein und geht nie unter 20.",
  "outputTitle": "Ausgabe",
  "qualityCustom": "Eigene",
  "labelDiff": "Unveränderte Pixel wiederverwenden",
  "diffHint": "Schreibt nur, was sich zwischen zwei Bildern bewegt hat. Die größte Ersparnis bei Bildschirmaufnahmen.",
  "showAdvanced": "Feinheiten einstellen",
  "hideAdvanced": "Feinheiten ausblenden",
  "labelColors": "Palettengröße",
  "labelDither": "Dithering",
  "ditherHint": "Tauscht ein wenig Rauschen gegen die Streifen ein, die eine flache Palette in Verläufen hinterlässt.",
  "labelDitherStrength": "Dithering-Stärke",
  "labelTolerance": "Pixeltoleranz",
  "labelAlpha": "Transparenz behalten",
  "alphaHint": "Überträgt transparente Pixel in das 1-Bit-Alpha des GIF. Lässt sich nicht mit der Pixel-Wiederverwendung kombinieren.",
  "labelBackground": "Hintergrund",
  "labelFit": "Wenn die Formate nicht passen",
  "fitContain": "Mit Rand einpassen",
  "fitCover": "Füllen und beschneiden",
  "fitStretch": "Verzerren",
  "labelLoop": "Endlos wiederholen",
  "loopHint": "Ausschalten, um es eine feste Anzahl Male abzuspielen und beim letzten Bild stehen zu bleiben.",
  "labelLoopCount": "Durchläufe",
  "btnCancel": "Abbrechen",
  "phaseRaster": "Bilder werden vorbereitet…",
  "phasePalette": "Palette wird gebaut…",
  "resultTitle": "Ergebnis",
  "statSize": "Größe",
  "statFrames": "Bilder",
  "statSizePx": "Maße",
  "statColors": "Farben",
  "statReuse": "Wiederverwendete Pixel",
  "statTime": "Kodiert in",
  "statFps": "Echte Bildrate",
  "statPerFrame": "Pro Bild",
  "btnCopy": "Kopieren",
  "dismissLabel": "Schließen",
  "errorVideo": "Dieser Browser kann das Video nicht dekodieren. Versuch es mit MP4 (H.264) oder WebM.",
  "errorImages": "Mindestens eines dieser Bilder ließ sich nicht dekodieren.",
  "errorExtract": "Die Einzelbilder ließen sich nicht lesen. Vielleicht benutzt das Video einen Codec, den dieser Browser nur halb unterstützt.",
  "errorEncode": "Das Kodieren ist fehlgeschlagen. Versuch es mit weniger Bildern oder geringerer Breite.",
  "errorClipboard": "Dein Browser hat die Zwischenablage blockiert. Lade es stattdessen herunter.",
  "errorTooManyFrames": "Bei {0} Bildern gestoppt – darüber ist GIF nicht das richtige Format.",
  "stageSource": "Originalbild",
  "stageResult": "Kodiertes GIF",
  "stageHint": "Das Mausrad zoomt auf den Zeiger, Ziehen verschiebt.",
  "stageHintCompare": "Das Mausrad zoomt auf den Zeiger, Ziehen verschiebt. Halte Alt oder die rechte Taste, um das Original unter dem GIF zu sehen.",
  "zoomIn": "Heranzoomen",
  "zoomOut": "Herauszoomen",
  "zoomReset": "Ansicht zurücksetzen",
  "stripHint": "Zieh über den Streifen, um Bilder auszuwählen. Halte Alt oder nimm die rechte Taste zum Abwählen.",
  "shortcutsTitle": "Tastenkürzel",
  "shortcuts": [
    {
      "keys": "Leertaste",
      "label": "abspielen / anhalten"
    },
    {
      "keys": "← →",
      "label": "ein Bild weiter"
    },
    {
      "keys": "Entf",
      "label": "Auswahl löschen"
    },
    {
      "keys": "A / D",
      "label": "alles / nichts auswählen"
    },
    {
      "keys": "Strg+Z",
      "label": "rückgängig"
    },
    {
      "keys": "Enter",
      "label": "kodieren"
    }
  ],
  "nextStepTitle": "Weiter geht’s",
  "nextStepHint": "Schickt das gezeigte Bild als PNG weiter – ohne erneuten Upload",
  "nextCrop": "Zuschneiden",
  "nextCompress": "Komprimieren",
  "nextCutout": "Hintergrund entfernen",
  "nextWatermark": "Wasserzeichen setzen",
  "nextMeme": "Meme daraus machen",
  "howItWorksTitle": "So funktioniert es",
  "step1Title": "Datei ablegen",
  "step1Text": "Ein Video oder ein Stapel Bilder. Nichts wird hochgeladen und nichts startet von allein.",
  "step2Title": "Abschnitt wählen",
  "step2Text": "Setz Anfang, Ende und Bildrate und hol die Bilder heraus – oder greif sie einzeln von Hand ab.",
  "step3Title": "Zeitleiste bearbeiten",
  "step3Text": "Bilder löschen, umkehren, eines länger stehen lassen und Farben und Dithering einstellen.",
  "step4Title": "Kodieren und prüfen",
  "step4Text": "Halte Alt über der Vorschau, um das GIF mit dem Original zu vergleichen, und lad es dann herunter oder schick es weiter.",
  "features": [
    {
      "title": "Eine Palette für den ganzen Clip",
      "text": "Die Farben werden per Median-Cut über alle Bilder gleichzeitig gewählt, damit mitten in der Schleife nichts den Farbton wechselt."
    },
    {
      "title": "Geschrieben wird nur, was sich bewegt",
      "text": "Pixel, die ein Bild mit dem vorherigen teilt, werden geerbt statt neu kodiert. Bei einer Bildschirmaufnahme ist das der Großteil der Datei."
    },
    {
      "title": "Dithering gegen Streifenbildung",
      "text": "Floyd–Steinberg-Fehlerdiffusion im Serpentinenverfahren, mit einstellbarer Stärke, damit Verläufe selbst bei 64 Farben sauber bleiben."
    },
    {
      "title": "Eine bearbeitbare Zeitleiste",
      "text": "Bilder löschen, die Reihenfolge umkehren, ein Palindrom bauen, ein einzelnes Bild länger halten. Rückgängig kostet nichts: gespeichert werden Kennungen, keine Bitmaps."
    },
    {
      "title": "Auf allen Kernen kodiert",
      "text": "Die Animation wird auf mehrere Web Worker verteilt, deshalb bleibt der Tab bedienbar und der Fortschrittsbalken zählt echte Bilder."
    },
    {
      "title": "Nichts verlässt den Tab",
      "text": "Dekoder, Palette und Kompressor sind JavaScript, das auf deinem Rechner läuft. Kein Upload, kein Modell aus einem CDN."
    },
    {
      "title": "Mit der Suite verkettet",
      "text": "Gib das gezeigte Bild direkt an Zuschneiden, Komprimieren oder den Hintergrundentferner weiter, ohne es vorher herunterzuladen."
    }
  ],
  "seoKeywordsTitle": "Verwandte Suchanfragen",
  "seoKeywords": [
    "video zu gif",
    "gif erstellen",
    "bilder zu gif",
    "mp4 zu gif",
    "gif verkleinern",
    "animiertes gif",
    "kostenloser gif-konverter",
    "gif-editor"
  ]
};
