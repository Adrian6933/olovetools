export default {
  "resetHint": "Neu anfangen",
  "title": "CleanSnap",
  "seo_title": "CleanSnap | Wasserzeichen und Objekte aus Fotos entfernen",
  "seo_description": "Male über ein Wasserzeichen, ein Logo oder ein störendes Objekt, und CleanSnap baut wieder auf, was dahinter war — indem es Stücke aus dem Foto selbst kopiert. Läuft im Browser, mit Fortschrittsbalken und Abbrechen-Knopf. Nichts wird hochgeladen.",
  "seoHeroTitle": "CleanSnap",
  "seoHeroText": "Male über das, was weg soll, und die Lücke wird aus dem Rest des Fotos wiederaufgebaut — samt Textur und Kanten, nicht als Schmierfleck.",
  "seoBrowserSpeedTitle": "Die Arbeit läuft in einem eigenen Thread",
  "seoBrowserSpeedText": "Eine Lücke wiederaufzubauen heißt, das Foto nach passenden Stücken zu durchsuchen, und das ist wirklich aufwendig. Es läuft in einem Web Worker mit echtem Fortschrittsbalken und Abbrechen-Knopf, damit die Seite dabei nie einfriert.",
  "seoUseCaseTitle": "Vier Füllungen, und jede sagt, was sie tut",
  "seoUseCaseText": "Zwei bauen wieder auf: Stücke für Textur und Detail, Diffusion für Himmel und glatte Wände. Zwei verdecken nur: Weichzeichnen und Verpixeln. Sie stehen in getrennten Gruppen, weil etwas zudecken nicht dasselbe ist wie es entfernen.",
  "seoPrivacyTitle": "Das Foto verlässt dein Gerät nicht",
  "seoPrivacyText": "Kein Upload, kein Konto, kein Modell zum Herunterladen. Das Bild wird in deinem Browser dekodiert, bearbeitet und exportiert, und sobald die Seite geladen ist, geht alles ohne Verbindung.",
  "hero": {
    "badge": "Läuft in deinem Browser",
    "title": "Male über das, was stört.",
    "titleHighlight": "Der Rest des Fotos füllt es auf.",
    "subtitle": "CleanSnap baut die Lücke wieder auf, indem es Stücke aus dem Bild selbst kopiert — Textur und Kanten laufen also hindurch weiter. Es wird nichts hochgeladen, und nichts startet, bevor du auf den Knopf drückst.",
    "trust1": "Kein Upload, kein Konto",
    "trust2": "Volle Auflösung",
    "trust3": "Jederzeit abbrechbar"
  },
  "ui": {
    "dropTitle": "Zieh ein Foto hierher",
    "dropHint": "Oder klicke, um eines zu wählen. Du kannst auch aus der Zwischenablage einfügen.",
    "reading": "Bild wird gelesen…",
    "newImage": "Anderes Bild",
    "scaledNote": "Arbeitet in reduzierter Größe — die Datei war {w}×{h}",
    "shortcuts": "B/R/C/E Werkzeuge · [ ] Pinsel · Leertaste zum Spähen · Enter zum Anwenden",
    "brush": "Pinsel",
    "rect": "Rechteck",
    "circle": "Ellipse",
    "eraser": "Wegnehmen",
    "pan": "Verschieben",
    "size": "Größe",
    "invert": "Umkehren",
    "clearSel": "Leeren",
    "apply": "Auswahl füllen",
    "cancel": "Abbrechen",
    "undo": "Rückgängig",
    "redo": "Wiederholen",
    "reset": "Zurücksetzen",
    "download": "Herunterladen",
    "quality": "Qualität",
    "output": "Ausgabe",
    "tookMs": "{ms} ms",
    "stageOriginal": "Original",
    "stageCurrent": "Arbeitskopie",
    "stageHint": "Rad zum Zoomen · mit H ziehen zum Verschieben · Leertaste oder Rechtsklick halten für das Original",
    "zoomIn": "Vergrößern",
    "zoomOut": "Verkleinern",
    "fit": "Einpassen",
    "dismiss": "Schließen",
    "errors": {
      "decode": "Diese Datei ließ sich nicht als Bild öffnen.",
      "nomask": "Male erst etwas an — es gibt keine Auswahl zum Füllen."
    },
    "fill": {
      "rebuildTitle": "Wiederaufbauen, was da war",
      "hideTitle": "Nur verdecken",
      "hideNote": "Diese beiden entfernen nichts: Sie decken zu. Gut für ein Gesicht oder ein Kennzeichen, nutzlos für ein Wasserzeichen, das verschwinden soll.",
      "methods": {
        "patch": "Stücke",
        "smooth": "Weich",
        "blur": "Weichzeichnen",
        "pixelate": "Verpixeln"
      },
      "methodHints": {
        "patch": "Kopiert passende Stücke aus anderen Teilen des Fotos und arbeitet sich von den Kanten nach innen. Das Einzige, das Textur zurückbringt.",
        "smooth": "Zieht die umliegenden Farben in die Lücke. Perfekt für einen Himmel oder eine glatte Wand, ein Schmierfleck auf allem mit Detail.",
        "blur": "Mittelt die Umgebung über die Auswahl. Es verdeckt, es baut nichts auf.",
        "pixelate": "Ersetzt die Auswahl durch Blöcke. Es verdeckt, es baut nichts auf."
      },
      "patchSize": "Stückgröße",
      "patchSizeHint": "Klein folgt feinem Detail, groß kopiert stimmigere Textur. 9 px passt für die meisten Wasserzeichen.",
      "searchRadius": "Suchradius",
      "searchRadiusHint": "Wie weit rund um die Lücke nach passenden Stücken gesucht wird. Weiter ist langsamer und selten besser — das richtige Stück liegt meist gleich daneben.",
      "strength": "Stärke",
      "grow": "Auswahl erweitern",
      "growHint": "Wasserzeichen haben einen weichen Saum, den man beim Malen nicht sieht. Zwei Pixel mehr erwischen ihn meistens.",
      "feather": "Naht weichzeichnen",
      "featherHint": "Verblendet den Rand, damit sich die Reparatur nicht durch eine Stufe von einem Pixel verrät."
    }
  },
  "next": {
    "nextStepTitle": "Weitermachen",
    "nextStepHint": "Das saubere Foto reist mit — ohne erneuten Upload",
    "nextCrop": "Zuschneiden",
    "nextWatermark": "Eigenes Wasserzeichen",
    "nextCompress": "Komprimieren",
    "nextFormat": "Format wechseln",
    "nextExif": "Metadaten entfernen"
  },
  "how": {
    "title": "So funktioniert es",
    "subtitle": "Drei Schritte, und der aufwendige wartet auf dich.",
    "steps": [
      {
        "title": "Foto öffnen",
        "text": "Es wird einmal dekodiert und behält die volle Auflösung. Es wird nichts verändert, und nichts verlässt dein Gerät."
      },
      {
        "title": "Darüber malen",
        "text": "Pinsel, Rechteck oder Ellipse. Zoome so weit hinein, wie du willst — die Auswahl wird in der echten Größe des Fotos gespeichert, nicht in der der Vorschau."
      },
      {
        "title": "Füllen",
        "text": "Wähle ein Verfahren und drück auf den Knopf. Du bekommst einen Fortschrittsbalken, einen Abbrechen-Knopf und die gebrauchte Zeit."
      }
    ]
  },
  "features": {
    "title": "Was sich unter der Haube geändert hat",
    "items": [
      {
        "title": "Stücke statt Schmierfleck",
        "desc": "Die Lücke wird mit Stücken aus anderen Teilen desselben Fotos gefüllt, damit Ziegel Ziegel bleibt und Gras Gras. Reine Diffusion kann immer nur die glatteste Fläche liefern, die zu den Rändern passt."
      },
      {
        "title": "Kanten laufen weiter",
        "desc": "Die Füllreihenfolge richtet sich danach, wie viel Struktur jede Stelle des Randes kreuzt: Eine Linie oder ein Horizont dringt zuerst in die Lücke und läuft gerade weiter, statt abgeschnitten zu werden."
      },
      {
        "title": "Weg vom Hauptthread",
        "desc": "Die Arbeit läuft in einem Web Worker in getakteten Abschnitten: Der Balken bewegt sich, die Seite bleibt bedienbar, und Abbrechen hält sie wirklich mittendrin an."
      },
      {
        "title": "Die Auswahl gehört dir",
        "desc": "Erweitere sie, verkleinere sie, kehre sie um, zeichne ihre Naht weich — und lass sie mit einem anderen Verfahren erneut laufen, ohne irgendetwas neu zu malen."
      },
      {
        "title": "Nichts wird hochgeladen",
        "desc": "Dekodieren, Bearbeiten und Exportieren passieren alle in deinem Browser. Kein Konto, kein Modell zum Laden, und es geht offline."
      },
      {
        "title": "Rückgängig für Kilobytes",
        "desc": "Gespeichert wird nur das geänderte Rechteck, nicht das ganze Bild — vierzig Schritte Verlauf passen in den Platz, den früher einer brauchte."
      }
    ]
  },
  "faqTitle": "Häufige Fragen",
  "faq": [
    {
      "question": "Wird mein Foto irgendwohin hochgeladen?",
      "answer": "Nein. Es wird in deinem Browser dekodiert, bearbeitet und exportiert, mit dem Canvas und einem Web Worker. Es geht nichts an einen Server, es gibt kein Konto, und sobald die Seite geladen ist, funktioniert alles ganz ohne Verbindung."
    },
    {
      "question": "Steckt ein KI-Modell dahinter?",
      "answer": "Nein, und es behauptet das auch nicht mehr. Die frühere Fassung bot einen „KI-Modus“, der exakt dieselbe Diffusion ausführte wie der normale, nur mit mehr Durchläufen. Was jetzt da ist, ist Stück-Propagation: Die Lücke wird mit echten Teilen deines eigenen Fotos gefüllt. Kein neuronales Netz, kein Download, und eine ehrliche Beschreibung."
    },
    {
      "question": "Warum sieht das Ergebnis manchmal trotzdem falsch aus?",
      "answer": "Weil die Füllung nur benutzen kann, was schon im Bild ist. Wenn das Entfernte etwas Einmaliges verdeckt hat — ein Gesicht, Text, ein einzigartiges Objekt —, gibt es nichts zu kopieren, und heraus kommt eine plausible Textur, nicht die Wahrheit. Am besten klappt es auf sich wiederholenden Hintergründen: Himmel, Wände, Laub, Asphalt, Wasser."
    },
    {
      "question": "Wofür ist welche Füllung gut?",
      "answer": "Stücke für alles mit Textur oder Struktur. Weich für Himmel, glatte Wände und Verläufe, wo es zugleich schneller und besser ist. Weichzeichnen und Verpixeln entfernen überhaupt nichts — sie decken zu, was bei einem Gesicht oder Kennzeichen gewollt ist und bei einem Wasserzeichen genau falsch."
    },
    {
      "question": "Die Auswahl sieht richtig aus, aber ein blasser Umriss bleibt. Warum?",
      "answer": "Wasserzeichen sind meist halbtransparent und haben einen weichen Saum von ein paar Pixeln, den man beim Malen leicht übersieht. Erhöhe „Auswahl erweitern“ um zwei oder drei Pixel, damit der Saum in der Lücke liegt und mit aufgebaut wird."
    },
    {
      "question": "Kann ich eine zu lange Füllung abbrechen?",
      "answer": "Ja. Der Wiederaufbau durchsucht das Foto nach passenden Stücken, eine große Auswahl dauert also wirklich. Die Arbeit ist in kurze Abschnitte in einem Hintergrund-Thread geteilt, und genau das lässt den Balken laufen und den Abbrechen-Knopf mittendrin wirken statt erst am Ende."
    },
    {
      "question": "Verkleinert es mein Foto?",
      "answer": "Nur oberhalb von etwa 24 Megapixeln, und dann steht es mit den Originalmaßen auf dem Bildschirm. Die frühere Fassung deckelte stillschweigend jedes Bild auf 1920 Pixel — du hast also kleiner heruntergeladen, als du geöffnet hattest, ohne je davon zu erfahren."
    },
    {
      "question": "Welche Formate kann ich öffnen und speichern?",
      "answer": "Sie öffnet JPG, PNG, WebP, AVIF, GIF und das HEIC der iPhones. Sie speichert als PNG, JPG oder WebP, mit Qualitätsregler für die beiden verlustbehafteten — die alte Fassung schrieb immer PNG, was aus einem kleinen JPEG eine viel größere Datei machte."
    }
  ],
  "seoKeywordsTitle": "Schlüsselwörter",
  "seoKeywords": [
    "Wasserzeichen aus Foto entfernen",
    "Wasserzeichen-Entferner",
    "Objekt aus Foto entfernen",
    "Inpainting online",
    "inhaltsbasierte Füllung online",
    "Objekte aus Bildern löschen",
    "Logo aus Bild entfernen",
    "Text aus Foto entfernen",
    "Fotoretusche im Browser",
    "Wasserzeichen kostenlos entfernen ohne Upload",
    "Personen aus Fotos entfernen",
    "Kopierstempel online"
  ],
  "footer_seo_title": "Ein Retuschewerkzeug, das seine Arbeit offenlegt",
  "footer_seo_paragraph1": "CleanSnap entfernt Wasserzeichen, Logos, Zeitstempel und störende Objekte aus Fotos vollständig in deinem Browser. Du malst mit Pinsel, Rechteck oder Ellipse über das, was weg soll, und zoomst dabei so weit hinein, wie du magst; die Lücke wird dann mit passenden Stücken aus anderen Teilen desselben Bildes wiederaufgebaut — Kanten und Linien zuerst, damit die Struktur durch die Lücke weiterläuft, statt an ihr aufzuhören.",
  "footer_seo_paragraph2": "Und es verkauft sich nicht größer, als es ist. Es gibt kein KI-Modell und keinen „intelligenten Modus“, der heimlich derselbe Code zweimal wäre; Weichzeichnen und Verpixeln stehen in einer eigenen Gruppe, weil sie verdecken statt entfernen; das Bild behält seine Auflösung und sagt es, wenn es das nicht kann; und die Füllung läuft in einem Hintergrund-Thread mit einem Balken, den du abbrechen kannst. Hochgeladen wird zu keinem Zeitpunkt etwas.",
  "footerCredit": "Teil der oLoveTools-Suite",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "Kopiert!",
  "contactForIdeas": "Kontakt für Ideen und Kommentare:",
  "footerTagline": "Entferne Wasserzeichen und störende Objekte aus Fotos, indem du darüber malst. Die Lücke wird aus dem Bild selbst wiederaufgebaut, vollständig in deinem Browser."
};
