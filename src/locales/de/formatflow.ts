export default {
  "languageName": "Deutsch",
  "header": {
    "subtitle": "BILDFORMAT-KONVERTER"
  },
  "hero": {
    "badge": "Läuft in deinem Browser",
    "title": "Wandle Bilder in das Format um, das du wirklich brauchst,",
    "titleHighlight": "und sieh, was es gekostet hat",
    "subtitle": "Zieh bis zu 50 Fotos herein, wähle Format, Größe und Gewicht, und wandle um, wenn du so weit bist. Es wird nichts hochgeladen, und nichts startet, bevor du auf den Knopf drückst.",
    "trust1": "Kein Upload, kein Konto",
    "trust2": "Gemessene Qualität (SSIM)",
    "trust3": "Stapel von 50"
  },
  "dropzone": {
    "title": "Bilder hier ablegen",
    "subtitle": "Bis zu {max} auf einmal. Du kannst auch aus der Zwischenablage einfügen.",
    "waits": "Die Dateien warten hier: Die Umwandlung startet erst, wenn du auf Umwandeln drückst.",
    "tooMany": "Die Warteschlange fasst 50 Bilder; die überzähligen Dateien blieben draußen.",
    "unsupported": "EPS und Kamera-RAW lassen sich im Browser nicht dekodieren und wurden übersprungen.",
    "decodeFailed": "Diese Datei ließ sich nicht als Bild dekodieren.",
    "full": "Die Warteschlange ist voll. Entferne ein Bild, um ein weiteres hinzuzufügen."
  },
  "stage": {
    "original": "Original",
    "converted": "Umgewandelt",
    "stale": "Einstellungen geändert",
    "zoomIn": "Vergrößern",
    "zoomOut": "Verkleinern",
    "fit": "Einpassen",
    "splitLabel": "Vergleichstrenner",
    "stageHint": "Mit dem Rad auf den Zeiger zoomen, zum Verschieben ziehen. Leertaste, Alt oder Rechtsklick halten, um das Original zu sehen."
  },
  "controls": {
    "presetsTitle": "Voreinstellungen",
    "presets": {
      "web": "Web (WEBP, 1920px)",
      "social": "Soziale Netze (JPG, 1440px)",
      "archive": "Archiv (PNG, volle Größe)",
      "email": "E-Mail (unter 500 KB)"
    },
    "presetsHint": "Eine Voreinstellung füllt nur die Regler unten aus. Ignoriere sie und stell alles von Hand ein, wenn dir das lieber ist.",
    "outputFormat": "Ausgabeformat",
    "formatUnavailable": "Dein Browser kann dieses Format nicht schreiben",
    "formatUnavailableHint": "Durchgestrichene Formate sind die, für die dieser Browser keinen Encoder hat. Wir prüfen es, statt zu raten — so bekommst du nie ein PNG mit falscher Endung.",
    "qualityTitle": "Qualität und Gewicht",
    "quality": "Qualität",
    "qualityLossless": "Dieses Format ist verlustfrei, die Qualität bewirkt hier also nichts.",
    "targetSize": "Auf eine maximale Dateigröße zielen",
    "targetSizeHint": "Die Qualität wird per Bisektion gesucht: bis zu 8 Kodierungen, um knapp unter dem Limit zu landen.",
    "resizeTitle": "Größe",
    "resizeModes": {
      "none": "Behalten",
      "scale": "Skalieren",
      "longEdge": "Lange Kante",
      "dimensions": "Exakt"
    },
    "scale": "Skalierung",
    "longEdgeHint": "längste Seite",
    "lockAspect": "Seitenverhältnis beibehalten",
    "fits": {
      "contain": "Einpassen",
      "cover": "Füllen",
      "stretch": "Dehnen"
    },
    "sharpen": "Nach dem Skalieren schärfen",
    "sharpenHint": "Unscharfmaskierung nur auf der Luminanz, damit Kanten knackig bleiben, ohne Farbsäume.",
    "transformTitle": "Drehung und Hintergrund",
    "flipH": "Waagerecht spiegeln",
    "flipV": "Senkrecht spiegeln",
    "background": "Hintergrund unter dem Bild (Formate ohne Transparenz)",
    "engineTitle": "Maschine",
    "measureQuality": "Qualität messen",
    "measureQualityHint": "Dekodiert das Ergebnis zurück und vergleicht es mit der Quelle (SSIM). Kostet ein paar Millisekunden.",
    "livePreview": "Live-Vorschau",
    "livePreviewHint": "Standardmäßig aus: Ist sie an, wandelt jede Änderung das gewählte Bild neu um.",
    "undo": "Rückgängig",
    "redo": "Wiederholen",
    "historyHint": "Verlauf der Einstellungen"
  },
  "editor": {
    "startOver": "Neu anfangen",
    "shortcuts": "← → zum Wechseln, Enter zum Umwandeln, Strg+Z für rückgängig",
    "queue": "Warteschlange",
    "addMore": "Mehr hinzufügen",
    "remove": "Aus der Warteschlange nehmen",
    "perImage": "Einstellungen nur für dieses Bild",
    "perImageOn": "Dieses Bild ignoriert die globalen Einstellungen.",
    "perImageOff": "Dieses Bild folgt den globalen Einstellungen.",
    "convert": "Umwandeln",
    "convertAll": "Alle umwandeln",
    "converting": "Wandelt um",
    "reading": "Liest",
    "download": "Herunterladen",
    "downloadZip": "ZIP",
    "dimensions": "Abmessungen",
    "size": "Gewicht",
    "vsOriginal": "gegenüber dem Original",
    "quality": "Qualität",
    "attempts": "Durchgänge",
    "ssimBands": {
      "identical": "nicht unterscheidbar",
      "excellent": "ausgezeichnet",
      "good": "gut",
      "fair": "aus der Nähe sichtbar",
      "poor": "deutlich verschlechtert"
    },
    "icoMultisize": "Die .ico enthält Fassungen mit 16, 32, 48, 64, 128 und 256 px; angezeigt wird die größte darin.",
    "missedTarget": "Die Größenvorgabe war selbst bei niedrigster Qualität nicht zu erreichen. Das hier ist das kleinstmögliche Ergebnis.",
    "notConverted": "Noch nicht umgewandelt",
    "notConvertedHint": "Deine Datei ist geladen und wartet. Stell ein, was du brauchst, und drück auf Umwandeln.",
    "engineNote": "Die Kodierung läuft in {n} Hintergrund-Workern, deshalb friert die Seite nie ein. Jedes Bild wird einmal dekodiert, und jede Umwandlung greift darauf zurück.",
    "dismiss": "Schließen",
    "backToTop": "Nach oben"
  },
  "next": {
    "nextStepTitle": "Weitermachen",
    "nextStepHint": "Das Ergebnis reist mit — ohne erneuten Upload",
    "nextCompress": "Komprimieren",
    "nextCrop": "Zuschneiden",
    "nextExif": "Metadaten entfernen",
    "nextWatermark": "Wasserzeichen setzen",
    "nextCutout": "Hintergrund entfernen"
  },
  "how": {
    "title": "So funktioniert es",
    "subtitle": "Drei Schritte, und keiner startet von allein.",
    "steps": [
      {
        "title": "Dateien ablegen",
        "text": "Sie werden einmal dekodiert und warten in der Warteschlange. Es wird nichts umgewandelt, und nichts verlässt dein Gerät."
      },
      {
        "title": "Ausgabe festlegen",
        "text": "Format, Qualität, Größe, Drehung, Hintergrund. Oder eine Voreinstellung, fertig."
      },
      {
        "title": "Umwandeln und vergleichen",
        "text": "Du bekommst Gewicht, Abmessungen und einen SSIM-Wert dafür, was die Umwandlung gekostet hat."
      }
    ]
  },
  "features": {
    "title": "Was er kann und ein gewöhnlicher Konverter nicht",
    "items": [
      {
        "title": "Parallele Hintergrund-Worker",
        "desc": "Die Kodierung läuft außerhalb des Hauptthreads über mehrere Worker verteilt, sodass die Seite auch mit 50 Bildern in der Schlange bedienbar bleibt."
      },
      {
        "title": "Formate geprüft, nicht geraten",
        "desc": "Jeder Encoder wird beim Start mit einer echten Zwei-Pixel-Kodierung getestet. Ein Browser, der kein AVIF schreiben kann, bietet es gar nicht erst an."
      },
      {
        "title": "Qualität zum Nachlesen",
        "desc": "Ein SSIM-Wert gegen die Quelle sagt dir, was die Kompression wirklich gekostet hat — nicht nur, wie viel du gespart hast."
      },
      {
        "title": "Zielgröße",
        "desc": "Du sagst „unter 500 KB“, und die Qualität wird per Bisektion in höchstens 8 Kodierungen gesucht, bis sie knapp darunter liegt."
      },
      {
        "title": "Nichts wird hochgeladen",
        "desc": "Dekodieren, Skalieren und Kodieren passieren alle in deinem Browser. Kein Server sieht deine Fotos, und es funktioniert offline."
      },
      {
        "title": "Stapel mit Ausnahmen je Bild",
        "desc": "Bis zu 50 Bilder auf einmal, und jedes davon darf mit eigenem Format und eigener Größe ausscheren."
      }
    ]
  },
  "formats": {
    "title": "Die Formate und was jedes wirklich bringt",
    "subtitle": "Eingang: JPG, PNG, WEBP, AVIF, GIF, BMP, SVG, TIFF und HEIC. EPS und Kamera-RAW brauchen einen PostScript-Interpreter beziehungsweise Tabellen je Kameramodell — sie werden abgelehnt, statt stillschweigend als PNG zurückzukommen.",
    "rows": [
      {
        "label": "WEBP",
        "desc": "Heute das beste Verhältnis von Gewicht zu Qualität fürs Web, mit Transparenz. Überall unterstützt, wo es zählt."
      },
      {
        "label": "AVIF",
        "desc": "Bei gleicher Qualität noch kleiner, aber nur manche Browser können es schreiben. Kann deiner es nicht, ist der Knopf deaktiviert."
      },
      {
        "label": "JPG",
        "desc": "Das universelle Fotoformat. Ohne Transparenz — deshalb wählst du die Hintergrundfarbe, die darunter liegt."
      },
      {
        "label": "PNG",
        "desc": "Verlustfrei und mit Transparenz. Der Qualitätsregler bewirkt hier nichts, und darum ist er ausgegraut."
      },
      {
        "label": "ICO",
        "desc": "Ein echtes Mehrgrößen-Icon: 16, 32, 48, 64, 128 und 256 px in einer Datei, mittig quadratisch beschnitten."
      },
      {
        "label": "PDF",
        "desc": "Eine Seite, auf das Bild zugeschnitten, mit einem JPEG darin in der Qualität, die du gewählt hast."
      },
      {
        "label": "TIFF",
        "desc": "Unkomprimiertes RGBA für Druck und Archiv. Wird auch als Eingang akzeptiert."
      },
      {
        "label": "SVG",
        "desc": "Eine Hülle: Das Rasterbild steckt in einem SVG. Es vektorisiert nicht — kein Browser-Werkzeug tut das —, aber es passt überall dorthin, wo nur .svg erlaubt ist."
      }
    ]
  },
  "app": {
    "footer": "Alles läuft in deinem Browser.",
    "contactFeedback": "KONTAKT FÜR IDEEN UND FEEDBACK:",
    "copiedEmail": "Kopiert!"
  },
  "faqTitle": "Häufige Fragen",
  "faq": [
    {
      "question": "Werden meine Bilder irgendwohin hochgeladen?",
      "answer": "Nein. Dekodieren, Skalieren und Kodieren passieren in deinem Browser, mit dem Canvas und Web-Workern. Es geht nichts an einen Server, und sobald die Seite geladen ist, funktioniert alles ganz ohne Verbindung."
    },
    {
      "question": "Warum sind manche Formate durchgestrichen?",
      "answer": "Weil dein Browser keinen Encoder dafür hat. Browser sagen das nicht: Wer ein GIF oder ein HEIC verlangt, bekommt ein PNG zurück, dessen Typ stillschweigend geändert wurde. Beim Start kodieren wir zwei Pixel in jedes Format und schauen, was tatsächlich herauskommt — angeboten wird nur, was funktioniert."
    },
    {
      "question": "Kann er nach HEIC, EPS oder Kamera-RAW umwandeln?",
      "answer": "Nein, und er tut auch nicht mehr so. Kein Browser kann HEIC schreiben, EPS braucht einen PostScript-Interpreter, und RAW ist bei jedem Kameramodell ein anderes Sensorformat. HEIC und TIFF werden als Eingang akzeptiert; EPS- und RAW-Dateien werden mit einer Meldung abgelehnt, statt als falsch benanntes PNG zurückzukommen."
    },
    {
      "question": "Was ist die SSIM-Zahl neben dem Ergebnis?",
      "answer": "Ein Ähnlichkeitswert zwischen dem umgewandelten Bild und der Quelle, von 0 bis 1. Über 0,98 ist der Unterschied sehr schwer zu sehen; unter 0,95 zeigen sich bei Fotos Artefakte. Es gibt ihn, weil „68 % gespart“ nur die schmeichelhafte Hälfte der Geschichte erzählt."
    },
    {
      "question": "Warum passiert nichts, wenn ich eine Datei ablege?",
      "answer": "Das ist Absicht. Eine abgelegte Datei wird nur dekodiert und in die Warteschlange gestellt. Die Umwandlung — der teure Teil — wartet darauf, dass du auf Umwandeln drückst, damit du in Ruhe alles einstellst, statt einer Vorschau hinterherzulaufen, die ständig neu startet."
    },
    {
      "question": "Geht beim Skalieren Detail verloren?",
      "answer": "Jede starke Verkleinerung verliert etwas, aber wie viel, hängt von der Engine ab. Manche Browser verkleinern in einem Durchgang mit einem 2x2-Kern und werfen die übrigen Pixel weg, was sich als ausgefranste Kanten zeigt. FormatFlow misst das beim Start — es verkleinert ein Testmuster und vergleicht es mit einem exakten Mittelwert — und greift nur dann auf schrittweises Halbieren zurück, wenn der Browser es braucht. Filtert der Browser ohnehin sauber, würden die zusätzlichen Durchgänge nur Zeit kosten und nichts ändern, also entfallen sie. Obendrauf kannst du noch schärfen."
    },
    {
      "question": "Warum sind meine Handyfotos nicht mehr falsch gedreht?",
      "answer": "Weil das Bild mit createImageBitmap dekodiert und die EXIF-Ausrichtung dort einmalig angewandt wird. Der alte Weg lud die Datei in ein <img>-Element, wo manche Browser das Ausrichtungs-Tag anwenden und andere nicht — und im Canvas landete das ungedrehte Bild."
    },
    {
      "question": "Wie viele Bilder kann ich auf einmal umwandeln?",
      "answer": "Fünfzig. Sie werden gleichzeitig über mehrere Hintergrund-Worker kodiert, und jedes kann sein eigenes Format und seine eigene Größe tragen, wenn du die Einstellungen je Bild einschaltest."
    }
  ],
  "seoKeywordsTitle": "Schlüsselwörter",
  "seoKeywords": [
    "Bildkonverter",
    "HEIC in JPG umwandeln",
    "PNG in WEBP",
    "JPG in AVIF",
    "WEBP in PNG",
    "TIFF in JPG",
    "Bild in ICO",
    "Favicon-Generator",
    "Bild in PDF",
    "Stapel-Bildkonverter",
    "Bilder online skalieren",
    "Bilder auf eine Zielgröße komprimieren",
    "Offline-Bildkonverter",
    "kostenloser Bildkonverter ohne Upload"
  ],
  "footer_seo_title": "Ein Konverter, der dir sagt, was er getan hat",
  "footer_seo_paragraph1": "FormatFlow wandelt Bilder zwischen JPG, PNG, WEBP, AVIF, ICO, PDF, TIFF und SVG um — vollständig in deinem Browser. Er liest HEIC vom iPhone und TIFF als Eingang, skaliert nach Faktor, langer Kante oder exakten Abmessungen, dreht, spiegelt, setzt die Hintergrundfarbe für Formate ohne Transparenz und kann eine maximale Dateigröße treffen, indem er die passende Qualität sucht.",
  "footer_seo_paragraph2": "Was er nicht tut, ist dich anlügen. Formate, die dein Browser nicht kodieren kann, erscheinen deaktiviert, statt ein PNG mit falscher Endung zurückzugeben, EPS und Kamera-RAW werden rundheraus abgelehnt, und jedes Ergebnis kommt mit Gewicht, Abmessungen und einem SSIM-Wert für die Qualität, die es gekostet hat. Es wird nichts hochgeladen: Die ganze Kette läuft auf deinem Rechner.",
  "seo_title": "FormatFlow | Bildkonverter mit gemessener Qualität",
  "seo_description": "Wandle Bilder in deinem Browser nach WEBP, AVIF, JPG, PNG, ICO, PDF, TIFF oder SVG um. Stapel von 50, Zielgröße, echtes Mehrgrößen-ICO, HEIC- und TIFF-Eingang und ein SSIM-Qualitätswert. Es wird nichts hochgeladen."
};
