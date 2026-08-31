export default {
  "title": "CompressSnap",
  "badge": "Bildkomprimierung",
  "description": "Komprimiere JPEG, PNG, WebP, AVIF und HEIC im Browser — auf eine Qualität deiner Wahl oder auf eine Größe, die du treffen musst — und sieh genau, was es gekostet hat.",
  "seo_title": "CompressSnap | Bilder auf eine Zielgröße komprimieren",
  "seo_description": "JPEG-, PNG-, WebP-, AVIF-, HEIC- und TIFF-Bilder komprimieren und skalieren. Ein Kilobyte-Budget treffen, die Palette eines PNG reduzieren, zwischen Formaten wandeln und den gemessenen SSIM-Qualitätsverlust je Datei ablesen. Läuft abseits des Hauptthreads und lädt nichts hoch.",
  "dropzonePrompt": "Bilder hier ablegen oder klicken zum Auswählen",
  "dropzoneSubtitle": "JPEG, PNG, WebP, AVIF, GIF, BMP, TIFF und das HEIC vom iPhone. Sehr große Bilder werden auf das begrenzt, was ein Browser-Canvas fassen kann.",
  "rejectedFiles": "{n} Datei(en) waren keine Bilder und blieben außen vor.",
  "compressBtn": "{n} komprimieren",
  "recompressBtn": "Einstellungen geändert — nochmal laufen lassen",
  "downloadBtn": "Herunterladen",
  "downloadAllBtn": "Alle herunterladen (ZIP)",
  "clearBtn": "Alle löschen",
  "removeBtn": "Entfernen",
  "closeBtn": "Schließen",
  "statusQueued": "wartet",
  "statusDecoding": "dekodiert…",
  "statusCompressing": "komprimiert…",
  "statusSkipped": "schon kleiner, als wir sie machen könnten",
  "statusError": "fehlgeschlagen",
  "workerOn": "abseits des Hauptthreads",
  "workerOff": "Hauptthread",
  "workerHint": "Wo kodiert wird. Abseits des Hauptthreads bleibt die Seite während des Stapels bedienbar.",
  "attemptsHint": "Kodierungen, um ins Budget zu passen",
  "originalSize": "Originalgröße",
  "compressedSize": "Komprimierte Größe",
  "savings": "Gespart",
  "avgSsim": "Ø SSIM",
  "presetLight": "Leicht",
  "presetBalanced": "Ausgewogen",
  "presetWeb": "Fürs Web",
  "presetStrong": "Stark",
  "formatLabel": "Ausgabeformat",
  "formatOriginal": "Behalten",
  "avifUnsupported": "Dieser Browser kann kein AVIF schreiben, deshalb wird es nicht angeboten.",
  "qualityLabel": "Qualität",
  "qualityHint": "Weniger Qualität, kleinere Datei. Der gemessene Verlust steht an jedem Ergebnis.",
  "qualityFromBudget": "Die Qualität wird gesucht, damit es ins Größenbudget unten passt.",
  "pngColorsLabel": "PNG-Farben",
  "pngColorsAll": "alle",
  "ditherLabel": "Verläufe dithern",
  "pngNote": "PNG hat keine Qualitätseinstellung — jeder Encoder ignoriert sie. Kleiner wird es durch eine kleinere Palette, und bei Flächen, Screenshots und Logos sieht man das nicht.",
  "budgetLabel": "Größenbudget",
  "budgetToggle": "Jedes Bild unter eine feste Größe bringen",
  "budgetHint": "Die Qualität wird per Bisektion gesucht, bis es passt.",
  "budgetPngNote": "Ein Byte-Budget braucht eine Qualität zum Suchen; PNG hat keine. Nimm stattdessen die Palette.",
  "resizeModeLabel": "Größenänderung",
  "resizeNone": "Keine",
  "resizeLongEdge": "Lange Kante",
  "resizeScale": "Skalieren",
  "resizeCustom": "Benutzerdefiniert",
  "longEdgeLabel": "Längste Seite (px)",
  "longEdgeHint": "Vergrößert nie — ein kleineres Bild bleibt, wie es ist.",
  "scaleLabel": "Skalierung",
  "widthLabel": "Breite (px)",
  "heightLabel": "Höhe (px)",
  "keepAspectLabel": "Seitenverhältnis beibehalten",
  "measureLabel": "Qualitätsverlust messen (SSIM)",
  "measureHint": "Dekodiert das Ergebnis zurück und vergleicht. Kostet etwas Zeit pro Bild.",
  "bandIdentical": "Nicht unterscheidbar",
  "bandExcellent": "Ausgezeichnet",
  "bandGood": "Gut",
  "bandFair": "Brauchbar",
  "bandPoor": "Sichtbarer Verlust",
  "compareBtn": "Vorschau & Vergleich",
  "originalLabel": "Original",
  "compressedLabel": "Komprimiert",
  "nextStepTitle": "Weitermachen",
  "nextStepHint": "Das Bild reist mit — kein Download, kein erneuter Upload",
  "nextCrop": "Zuschneiden",
  "nextWatermark": "Wasserzeichen setzen",
  "nextExif": "Metadaten prüfen",
  "nextZip": "Zippen",
  "howItWorksTitle": "So funktioniert es",
  "step1Title": "Fotos hineinziehen",
  "step1Text": "Einfügen, auswählen oder ziehen. Sie stellen sich an — kodiert wird nichts, bevor du drückst, damit ein Ordner mit vierzig Bildern den Tab nicht blockiert.",
  "step2Title": "Den Handel wählen",
  "step2Text": "Eine Qualität, eine Größe in Kilobyte, die nicht überschritten wird, ein Format, eine maximale lange Kante. PNG bekommt eine Palette statt eines Qualitätsreglers.",
  "step3Title": "Laufen lassen",
  "step3Text": "Kodiert wird abseits des Hauptthreads, deshalb bleibt die Seite bedienbar, während der Stapel abgearbeitet wird.",
  "step4Title": "Die Dateien mitnehmen",
  "step4Text": "Einzeln, alle zusammen als ZIP, oder direkt ins nächste Werkzeug ohne Download.",
  "features": [
    {
      "title": "Kodiert abseits des Hauptthreads",
      "text": "Ein Web Worker mit OffscreenCanvas erledigt die Arbeit und die Bitmaps werden übergeben statt kopiert, sodass ein Stapel Handyfotos den Tab nicht mehr einfriert, in dem er läuft."
    },
    {
      "title": "Auf eine Größe komprimieren, nicht auf Verdacht",
      "text": "Gib ein Kilobyte-Budget vor, und die Qualität wird per Bisektion gesucht, bis die Datei passt — samt Angabe, bei welcher Qualität es blieb und wie viele Versuche nötig waren."
    },
    {
      "title": "Der Verlust ist eine Zahl",
      "text": "Jedes Ergebnis wird zurückdekodiert und per SSIM mit der Quelle verglichen: „Qualität 70\" ist damit kein Gefühl mehr, sondern 0,981 neben der Dateigröße, die es gebracht hat."
    },
    {
      "title": "PNG, das wirklich schrumpft",
      "text": "Median-Cut-Palettenreduktion mit optionalem Dithering. Es ist der einzige Regler, den ein PNG hat — das Qualitätsargument ignoriert jeder Encoder — und er zahlt sich bei Screenshots, Logos und Flächen aus. Einem als PNG gespeicherten Foto hilft eher der Wechsel zu JPEG oder WebP, und das Werkzeug sagt es, statt eine größere Datei zurückzugeben."
    },
    {
      "title": "Die Formate, die du wirklich hast",
      "text": "iPhone-HEIC und TIFF werden beim Einlesen gewandelt, AVIF und WebP beim Schreiben genutzt, wo der Browser es kann, und die EXIF-Drehung wird angewandt, damit nichts auf der Seite liegt."
    },
    {
      "title": "Nichts verlässt den Tab",
      "text": "Dekodieren, Kodieren, Palette und Messung laufen in deinem Browser. Keine API, kein Upload, kein Konto."
    }
  ],
  "seoHeroTitle": "Der Bildkomprimierer, der dir sagt, was die Komprimierung gekostet hat",
  "seoHeroText": "CompressSnap liest JPEG, PNG, WebP, AVIF, GIF, BMP, TIFF und die HEIC-Dateien eines iPhones und schreibt JPEG, PNG, WebP und AVIF zurück. Es trifft ein Byte-Budget, indem es die passende Qualität sucht, verkleinert PNGs über ihre Palette statt so zu tun, als bewirke ein Qualitätsregler dort etwas, und misst jedes Ergebnis gegen seine Quelle, damit der eingegangene Handel sichtbar wird.",
  "seoHeroList": [
    "Keine Registrierung erforderlich",
    "Komprimieren Sie mehrere Bilder gleichzeitig",
    "Konvertieren Sie in WebP, JPG oder PNG"
  ],
  "seoBrowserSpeedTitle": "Gemessen, nicht geraten",
  "seoBrowserSpeedText": "Jede komprimierte Datei wird erneut dekodiert und mit dem verglichen, was hineinging. Die Zahl ist SSIM, das Maß, das dem folgt, was Menschen tatsächlich bemerken, und sie steht direkt neben der Dateigröße, damit beides gegeneinander abgewogen werden kann.",
  "seoSecondaryTitle": "Warum sollten Sie Ihre Bilder komprimieren?",
  "seoUseCaseTitle": "Die unangenehmen Fälle, erledigt",
  "seoUseCaseText": "Ein HEIC frisch aus dem iPhone, ein Hochformat, dessen Drehung in einem EXIF-Tag steckt, ein Screenshot-PNG, das durch JPEG größer wird, ein 48-Megapixel-Bild, das in kein Canvas passt — alles Normalfälle, und jeder wird gewandelt, gedreht, markiert oder begrenzt, statt still zu scheitern.",
  "seoPrivacyTitle": "Vollständig in deinem Browser",
  "seoPrivacyText": "Hinter dieser Seite steckt keine API. Die Dekoder, der Encoder, die Palettenreduktion und die Qualitätsmessung sind JavaScript in deinem Tab — ein noch unveröffentlichtes Kundenfoto verlässt deinen Rechner also nie.",
  "seoKeywordsTitle": "Schlüsselwörter",
  "seoKeywords": [
    "Bilder komprimieren",
    "JPEG komprimieren online",
    "PNG komprimieren",
    "in WebP umwandeln",
    "in AVIF umwandeln",
    "HEIC in JPG",
    "Bild auf 200kb komprimieren",
    "Bildgröße reduzieren",
    "Stapelkomprimierung",
    "Bilder online skalieren",
    "PNG Palette reduzieren",
    "Bildqualität SSIM"
  ],
  "faqTitle": "Häufig gestellte Fragen",
  "faq": [
    {
      "question": "Werden meine Daten an einen Server geschickt?",
      "answer": "Nein. Dekodieren, Kodieren, Palettenreduktion und Qualitätsmessung laufen in deinem Browser. Ein hier geöffnetes Bild verlässt den Tab nie."
    },
    {
      "question": "Warum bewirkt das Komprimieren eines PNG nichts?",
      "answer": "Weil PNG verlustfrei ist und jeder Encoder das Qualitätsargument ignoriert — einen Qualitätsregler für PNG zu zeigen, wie es vorher war, führte in die Irre. Kleiner wird ein PNG durch weniger Farben, deshalb gibt es dafür eine Palettensteuerung. Bei Screenshots, Logos und Flächen ist der Sprung auf 64 oder 128 Farben unsichtbar und halbiert die Datei oft."
    },
    {
      "question": "Kann es auf eine bestimmte Größe komprimieren?",
      "answer": "Ja. Schalte das Größenbudget ein, tippe eine Zahl in Kilobyte, und der Encoder halbiert die Qualität schrittweise, bis die Datei passt — höchstens acht Versuche. Jedes Ergebnis zeigt die gewählte Qualität und die Zahl der Kodierungen."
    },
    {
      "question": "Was ist SSIM und warum sollte es mich kümmern?",
      "answer": "Strukturelle Ähnlichkeit: eine Zahl von 0 bis 1 dafür, wie nah das komprimierte Bild am Original ist, gewichtet wie das menschliche Sehen. Gemessen wird sie, indem das Ergebnis zurückdekodiert und Pixel für Pixel verglichen wird. Über 0,98 sieht es fast niemand; unter 0,95 werden Artefakte sichtbar. Damit wird aus „sieht Qualität 70 in Ordnung aus?\" etwas, das man ablesen kann."
    },
    {
      "question": "Nimmt es Fotos von meinem iPhone an?",
      "answer": "Ja. HEIC und HEIF werden beim Einlesen gewandelt, TIFF ebenso, und die Drehung, die das iPhone im EXIF-Tag speichert, wird angewandt, damit ein Hochformat nicht auf der Seite landet. Die alte Fassung wies HEIC schon im Dateidialog ab."
    },
    {
      "question": "Warum kam eines meiner Bilder unverändert zurück?",
      "answer": "Weil das Komprimieren es größer gemacht hätte. Das passiert vor allem bei Screenshots und flächigen Grafiken, die mit hoher Qualität durch JPEG laufen. Statt dir eine schlechtere Datei zu geben, markiert das Werkzeug es und behält das Original."
    },
    {
      "question": "Werden EXIF-Daten entfernt?",
      "answer": "Ja — das Neukodieren über ein Canvas verwirft jeden Metadatenblock, GPS-Koordinaten und Kameradaten eingeschlossen. Das einzige visuell relevante Stück, das Orientierungs-Tag, wird vorher auf die Pixel angewandt, damit das Bild aufrecht bleibt."
    },
    {
      "question": "Friert ein großer Stapel die Seite ein?",
      "answer": "Nein. Kodiert wird in einem Web Worker mit OffscreenCanvas, und die Bilddaten werden übergeben statt kopiert, sodass die Seite bedienbar bleibt, während die Warteschlange abgearbeitet wird. Zwei Bilder laufen gleichzeitig — schnell, ohne mehrere Bilder in voller Auflösung gleichzeitig im Speicher zu halten."
    }
  ],
  "footerTagline": "Bilder im Browser komprimieren, skalieren und wandeln — mit gemessenem Qualitätsverlust.",
  "footerCredit": "Teil der oLoveTools-Suite",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "E-Mail in die Zwischenablage kopiert!",
  "contactForIdeas": "Kontakt für Ideen und Feedback:",
  "presetsLabel": "Schnellvorgaben",
  "presetExtreme": "Extrem",
  "summaryTitle": "Geschätztes Ergebnis",
  "scaleHint": "Verkleinert Breite und Höhe des Bildes.",
  "followGlobalBtn": "Globale Einstellungen verwenden",
  "statusDone": "Erfolgreich",
  "individualSettings": "Eigene Einstellungen",
  "globalSettings": "Globale Einstellungen",
  "originalFormat": "Originalformat",
  "compareTitle": "Vorher / Nachher visueller Vergleich",
  "privacyPolicy": "Datenschutzerklärung",
  "termsOfService": "Nutzungsbedingungen",
  "cookiePolicy": "Cookie-Richtlinie",
  "privacyContent": "Ihr Datenschutz ist uns wichtig.\n\nWir erfassen nur Informationen, die zur Bereitstellung unseres Dienstes erforderlich sind. Dazu gehören technische Daten über Ihren Browser und Ihr Gerät, um sicherzustellen, dass das Tool ordnungsgemäß funktioniert.\n\nWir speichern, verfolgen oder analysieren Ihre Bilder niemals. Die gesamte Verarbeitung erfolgt lokal in Ihrem Browser, sodass Ihre Daten Ihr Gerät niemals verlassen.",
  "termsContent": "Durch die Nutzung von CompressSnap stimmen Sie diesen Bedingungen zu.\n\n1. Dieses Tool wird \"wie besehen\" und ohne jegliche Garantien bereitgestellt.\n2. Wir haften nicht für Datenverluste oder Probleme, die durch die Nutzung dieses Tools entstehen.\n3. Sie sind für die Inhalte verantwortlich, die Sie mit diesem Tool verarbeiten.\n4. Wir behalten uns das Recht vor, diese Bedingungen jederzeit zu ändern.",
  "cookiesContent": "Wir verwenden Cookies, um Ihre Erfahrung zu verbessern.\n\n1. Essenzielle Cookies: Erforderlich für die grundlegende Funktionalität der Website.\n2. Präferenz-Cookies: Werden verwendet, um Ihre Sprach- und Cookie-Zustimmungseinstellungen zu speichern.\n\nSie können Cookies jederzeit über Ihre Browsereinstellungen verwalten oder deaktivieren.",
  "contact": "Kontakt"
};
