export default {
  "resetHint": "Neu anfangen",
  "title": "Base64Bolt",
  "seo_title": "Base64Bolt | Base64-Encoder, -Decoder und Byte-Inspektor",
  "seo_description": "Kodiere Text oder beliebige Dateien nach Base64, dekodiere eine Nutzlast zurück in die echte Datei, lies die Bytes in Hexadezimal, wechsle zum URL-sicheren Alphabet, lass das Padding weg und brich bei 76 Spalten um. Kostenlos und vollständig im Browser.",
  "seoHeroTitle": "Base64 Encoder, Decoder & Inspector",
  "badge": "Base64-Werkzeugkasten",
  "description": "Kodiere jede Datei – nicht nur Bilder – mit dem Alphabet, dem Padding und der Zeilenbreite, die die Gegenseite wirklich erwartet. Dekodiere eine Nutzlast und sieh, was sie tatsächlich ist: das aus den Magic Bytes gelesene Format, die ersten Bytes in Hexadezimal, die Größe nach gzip und der SHA-256.",
  "heroPoints": [
    "Jeder Dateityp",
    "URL-sicheres Alphabet",
    "Hex-Inspektor"
  ],

  "tab_text": "Text",
  "tab_file": "Datei zu Base64",
  "tab_decode": "Base64 zu Datei",

  "optionsTitle": "Ausgabe",
  "alphabetStandard": "A-Z a-z 0-9 + /",
  "alphabetUrl": "URL-sicher - _",
  "alphabetStandardHint": "Das Standardalphabet aus RFC 4648: + und / für die letzten beiden Werte.",
  "alphabetUrlHint": "Das URL-sichere Alphabet: - und _ statt + und /, damit die Nutzlast einen Query-String, einen Dateinamen oder ein JWT unverändert übersteht.",
  "padding": "Padding =",
  "paddingHint": "Die =-Kette füllt die Ausgabe auf ein Vielfaches von vier Zeichen auf. Sie weglassen ist erlaubt und genau das, was JWTs tun; manche strikten Parser bestehen aber darauf.",
  "wrap": "Umbruch",
  "wrapNone": "aus",
  "crlfHint": "Bricht Zeilen mit CRLF statt LF um – das ist, was MIME und PEM tatsächlich vorschreiben.",
  "charset": "Zeichensatz",
  "engineNative": "Native Engine",
  "engineFallback": "Kompatibilitäts-Engine",
  "engineNativeHint": "Dein Browser wandelt die Bytes selbst um, in einem einzigen Aufruf auf Engine-Ebene.",
  "engineFallbackHint": "Dein Browser hat keine native Base64-Umwandlung, daher wird die Nutzlast in 32-KB-Blöcken verarbeitet. Gleiches Ergebnis, etwas langsamer.",

  "mode_encode": "Kodieren",
  "mode_decode": "Dekodieren",
  "altHint": "Alt halten, um die Gegenrichtung zu sehen",
  "holdCompare": "Halten, um die Eingabe zu sehen",
  "undo": "Rückgängig",
  "redo": "Wiederholen",
  "loadSample": "Beispiel laden",
  "button_clear": "Alles löschen",
  "cancel": "Stopp",
  "runBtn": "Ausführen",
  "encodeBtn": "Nach Base64 kodieren",
  "decodeBtn": "Dekodieren",
  "downloadTxt": "Als .txt herunterladen",
  "openTextFile": "Eine .txt / .b64 öffnen",
  "copied": "Kopiert!",
  "copyFailed": "Dein Browser hat den Zugriff auf die Zwischenablage blockiert",
  "tooltip_copy": "In die Zwischenablage kopieren",
  "chars": "Zeichen",

  "label_input": "Klartext",
  "label_base64_input": "Base64-Zeichenkette",
  "label_base64_output": "Base64",
  "label_decoded_output": "Dekodierter Text",
  "label_showing_input": "Deine Eingabe",
  "label_stage_file": "Datei auswählen",
  "label_snippet": "Zum Einfügen bereit",
  "label_decoded": "Was herauskam",
  "placeholder_encode": "Text eingeben oder einfügen, der kodiert werden soll…",
  "placeholder_decode": "Eine Base64-Zeichenkette oder eine data:-URL einfügen…",
  "placeholder_decode_file": "Eine Base64-Nutzlast oder eine komplette data:-URL einfügen…",
  "placeholder_output": "Das Ergebnis erscheint hier…",
  "placeholder_file_output": "Datei bereitlegen und Kodieren drücken, um das Snippet zu erhalten.",
  "placeholder_decoded": "Eine Nutzlast einfügen, um zu sehen, was sie wirklich ist.",
  "previewTruncated": "Es werden die ersten {0} Zeichen angezeigt. Kopieren und Herunterladen nutzen das vollständige Ergebnis.",
  "bigInputHint": "Diese Eingabe ist groß, sie wird deshalb nicht bei jedem Tastendruck neu kodiert. Drücke Ausführen, wenn du bereit bist.",

  "file_drag": "Beliebige Datei hier ablegen oder zum Auswählen klicken",
  "file_formats": "Jeder Dateityp – Bilder, Schriften, PDFs, WASM. Bis zu {0}.",
  "willProduce": "ergibt etwa {0} Zeichen",
  "nothingAutomatic": "Es wurde noch nichts gelesen. Wähle deine Optionen und drücke dann Kodieren.",
  "optionsChanged": "Die Optionen haben sich seit diesem Lauf geändert. Drücke Kodieren erneut.",

  "statBytes": "Nutzlast",
  "statChars": "Base64",
  "statOverhead": "Größe vs. Quelle",
  "statGzip": "Mit gzip",
  "statFormat": "Erkannt",
  "statAlphabet": "Alphabet",
  "statRoundTrip": "Hin und zurück",
  "statTime": "Dauer",
  "roundTripOk": "Umkehrbar",
  "roundTripFail": "Nicht umkehrbar",

  "sha256Title": "SHA-256 der Originalbytes",
  "sha256TitleDecoded": "SHA-256 der dekodierten Bytes",
  "sha256Hint": "Vergleiche ihn nach dem Dekodieren an anderer Stelle, um zu belegen, dass unterwegs nichts verloren ging.",
  "hexTitle": "Erste Bytes",
  "hexEmpty": "Noch keine Bytes.",
  "hexTruncated": "Es werden die ersten {0} von {1} angezeigt.",
  "mimeOverrideTitle": "Behandeln als",
  "mimeMismatch": "Die data:-URL behauptet {0}, die Bytes sagen {1}.",
  "noPreview": "Für dieses Format gibt es keine Browser-Vorschau. Lade es herunter oder schicke es an ein anderes Werkzeug.",

  "issuesTitle": "Was uns aufgefallen ist",
  "issue_invalid-char": "Das Zeichen {0} an Position {1} gehört nicht zum Base64-Alphabet; es wurde übersprungen.",
  "issue_whitespace-stripped": "{0} Zeilenumbrüche oder Leerzeichen wurden vor dem Dekodieren entfernt.",
  "issue_padding-added": "Der Nutzlast fehlte eine vollständige Vierergruppe, daher wurden {0} Padding-Zeichen angenommen.",
  "issue_non-canonical": "Das letzte Zeichen ({0}) trägt Bits, die verworfen werden. Kein Encoder erzeugt das, die Zeichenkette ist also wahrscheinlich abgeschnitten oder von Hand bearbeitet.",
  "issue_mixed-alphabet": "Die Eingabe mischt beide Alphabete (+ / und - _). Sie wurde als Standard-Base64 dekodiert.",
  "issue_data-url": "Ein data:-URL-Präfix, das {0} angab, wurde vor dem Dekodieren entfernt.",
  "issue_lost_surrogate": "{0} unpaarige Surrogate ließen sich nicht in UTF-8 darstellen und wurden ersetzt.",

  "error_bad-length": "Diese Nutzlast hat ein Zeichen mehr als eine vollständige Vierergruppe. Sechs übrige Bits sind kein Byte, das Ende ist also nicht wiederherstellbar – die Zeichenkette ist abgeschnitten.",
  "error_undecodable": "Diese Zeichen bilden kein gültiges Base64.",
  "error_not-base64-data-url": "Diese data:-URL ist prozentkodiert, nicht Base64 – hier gibt es nichts zu dekodieren.",
  "error_not-utf8": "Das Base64 ist gültig, aber die Bytes dahinter sind kein UTF-8-Text – das sind Binärdaten. Nutze den Tab „Base64 zu Datei“, um zu sehen, was es ist, oder stelle den Zeichensatz auf Latin-1.",
  "error_too-large": "Diese Nutzlast ist zu groß, damit dein Browser sie als eine einzige Zeichenkette halten kann.",
  "error_crashed": "Der Encoder ist bei dieser Datei gescheitert.",
  "error_no-input": "Es liegt nichts zum Kodieren bereit.",
  "errorTooBig": "Diese Datei hat {0}; das Limit liegt bei {1}.",

  "nextStepTitle": "Weitermachen",
  "nextStepHint": "Das Ergebnis reist mit – kein Download, kein erneutes Hochladen",
  "nextCompress": "Komprimieren",
  "nextCrop": "Zuschneiden",
  "nextFavicon": "Favicon daraus machen",
  "nextHash": "Hash bilden",
  "nextJson": "JSON öffnen",
  "nextUrl": "Für URL kodieren",
  "nextDiff": "Zwei Versionen vergleichen",
  "nextCodecard": "In ein Bild verwandeln",

  "howItWorksTitle": "So funktioniert es",
  "step1Title": "Nutzlast hereinholen",
  "step1Text": "Tippe sie, füge sie ein, lege eine Datei beliebigen Typs ab oder lass sie dir von einem anderen Werkzeug der Suite übergeben. Eine abgelegte Datei wird noch nicht gelesen.",
  "step2Title": "Wähle, wie sie herauskommt",
  "step2Text": "Standard- oder URL-sicheres Alphabet, Padding ein oder aus, Umbruch bei 64, 76 oder 100 Spalten mit LF oder CRLF. Genau diese Punkte sind die, bei denen echte Parser sich uneinig sind.",
  "step3Title": "Sieh dir die Bytes an",
  "step3Text": "Das Format wird aus den Magic Numbers gelesen, nicht aus dem Namen erraten. Du bekommst den Hex-Dump, die Größe nach gzip, den SHA-256 und eine Umkehrbarkeitsprüfung.",
  "step4Title": "Nimm es mit",
  "step4Text": "Kopiere die rohe Zeichenkette, eine data:-URL, eine CSS-Regel, ein img-Tag, einen JSON-Body oder einen PEM-Block – oder schicke die dekodierte Datei direkt an ein anderes Werkzeug.",

  "features": [
    {
      "title": "Drei Bytes, vier Zeichen",
      "text": "Base64 kostet immer 33 % mehr als die Bytes, die es trägt, und das Werkzeug zeigt beide Zahlen plus die Größe nach gzip – denn bei textähnlichen Nutzlasten holt gzip fast alles zurück, bei einem PNG so gut wie nichts."
    },
    {
      "title": "URL-sicheres Alphabet",
      "text": "Wechsle zu - und _ und die Nutzlast übersteht Query-String, Dateinamen oder JWT ohne jedes Escaping. Auch das Padding lässt sich weglassen, genau wie es Token-Formate erwarten."
    },
    {
      "title": "Hex-Inspektor",
      "text": "Sieh die echten Bytes, sechzehn pro Zeile, mit dem druckbaren ASCII daneben. Die Magic Number ist hervorgehoben, eine abgeschnittene Datei verrät sich also sofort."
    },
    {
      "title": "Es sagt dir, was kaputt ist",
      "text": "Welches Zeichen nicht im Alphabet ist und an welcher Position, ob Padding fehlte, ob das letzte Zeichen verworfene Bits trägt. Kein nacktes „ungültiges Base64“."
    },
    {
      "title": "Format aus den Bytes gelesen",
      "text": "PNG, JPEG, GIF, WebP, AVIF, HEIC, PDF, ZIP samt der darin liegenden Office-Formate, WOFF2, MP4, WASM, SQLite und mehr, an ihrer Signatur erkannt – damit der Download die richtige Endung bekommt."
    },
    {
      "title": "Große Dateien bleiben flüssig",
      "text": "Dateien werden in 3-MB-Blöcken in einem eigenen Thread verarbeitet, mit echtem Fortschrittsbalken und funktionierendem Stopp-Knopf. Der Tab bleibt bedienbar, während eine 200-MB-Nutzlast umgewandelt wird."
    },
    {
      "title": "Messbar, nicht bloß erzeugt",
      "text": "Jeder Lauf liefert Größe nach gzip und SHA-256, berechnet auf denselben Bytes. So entscheidest du, ob Einbetten günstiger ist als eine zweite Anfrage, und so belegst du, dass der Rundweg verlustfrei war."
    },
    {
      "title": "Umkehrbarkeitsprüfung",
      "text": "Jede Textkodierung wird sofort wieder dekodiert und Byte für Byte verglichen, sodass eine Kombination aus Alphabet und Padding, die deine Gegenseite ablehnen würde, gemeldet wird, bevor du sie einfügst."
    }
  ],

  "seoSecondaryTitle": "Die Nutzlast, nicht bloß die Zeichenkette",
  "seoHeroText": "Die meisten Base64-Werkzeuge geben dir eine Zeichenkette und hören da auf. Dieses behält die Bytes: Es erkennt das Format an der Signatur, gibt das erste Kilobyte in Hexadezimal aus, misst, was die Nutzlast nach gzip wirklich kostet, hasht sie, damit du den Rundweg belegen kannst, und nennt genau das Zeichen an der genauen Position, das eine Nutzlast zerstört hat, statt das Ganze zu verurteilen. Beim Kodieren nimmt es jede Datei – eine Schrift, ein PDF, ein WebAssembly-Modul – denn bei Base64 ging es nie nur um Bilder.",
  "seoHeroList": [
    "Standard- und URL-sicheres Alphabet",
    "Optionales Padding, Umbruch bei 64/76/100 Spalten",
    "Formaterkennung über Magic Bytes",
    "Größe nach gzip und SHA-256"
  ],
  "seoBrowserSpeedTitle": "Nichts verlässt deinen Browser",
  "seoBrowserSpeedText": "Kodieren, Dekodieren, Formaterkennung, Hex-Dump, gzip-Messung und SHA-256 sind alle native Browser-APIs, die in deinem eigenen Tab laufen – bei allem Großen in einem eigenen Thread. Es gibt keinen Upload, keine Anfrage und nichts zu protokollieren. Das ist wichtig, denn was Menschen in ein Base64-Werkzeug einfügen, sind regelmäßig private Schlüssel, Sitzungstoken und interne Dokumente.",
  "seoUseCaseTitle": "Gebaut für Nutzlasten, die ohne Etikett ankommen",
  "seoUseCaseText": "Ein Blob aus einer Datenbankspalte, zu dem nirgends ein MIME-Typ notiert ist. Ein JWT-Segment, das sich nicht dekodieren lässt, weil es das URL-sichere Alphabet nutzt und kein Padding hat. Ein eingebettetes SVG in einem Stylesheet, das als kaputtes Bild erscheint. Eine data:-URL, die image/png behauptet, während die Bytes offensichtlich ein JPEG sind. Ein bei 64 Spalten umgebrochenes Zertifikat, das ein strikter Parser ablehnt. Base64Bolt liest sie alle, sagt, was die Bytes wirklich sind, und lässt dich das Ergebnis als Datei mit der richtigen Endung mitnehmen.",
  "seoPrivacyTitle": "Keine Konten, keine Limits, kein Upload",
  "seoPrivacyText": "Keine Anmeldung, kein Tageslimit und keine Bezahlstufe, die die nützliche Hälfte des Werkzeugs versteckt. Geöffnete Dateien werden lokal gelesen und nie übertragen; der Tab vergisst alles, sobald du ihn schließt.",
  "seoKeywordsTitle": "Verwandte Suchen",
  "seoKeywords": [
    "base64 kodieren",
    "base64 dekodieren",
    "datei zu base64",
    "base64 zu datei",
    "data-url-konverter",
    "base64url dekodieren",
    "bild zu base64",
    "base64 zu bild",
    "base64 online dekodieren",
    "base64 hex-betrachter"
  ],

  "faqTitle": "Häufige Fragen",
  "faq": [
    {
      "question": "Warum scheitert mein JWT oder Token woanders, funktioniert hier aber?",
      "answer": "Weil es das URL-sichere Alphabet nutzt – Bindestrich und Unterstrich statt Plus und Schrägstrich – und ihm meist das Padding entfernt wurde. Ein Decoder, der nur das Standardalphabet kennt, bricht beim ersten Bindestrich ab. Base64Bolt erkennt, welches Alphabet die Eingabe nutzt, stellt das fehlende Padding wieder her und sagt dir beides."
    },
    {
      "question": "Macht Base64 meine Datei größer?",
      "answer": "Immer, um genau ein Drittel: aus drei Bytes werden vier Zeichen, plus bis zu zwei Padding-Zeichen. Ob dich das etwas kostet, hängt von der Kompression ab – deshalb zeigt das Werkzeug die Größe nach gzip neben der rohen. Ein kleines SVG einzubetten gewinnt meist; ein großes JPEG einzubetten verliert meist, weil es schon komprimiert ist und Base64 einen Teil davon zunichtemacht."
    },
    {
      "question": "Kann ich etwas kodieren, das kein Bild ist?",
      "answer": "Ja, jede Datei. Schriften für eine @font-face-Regel, ein PDF für einen Download-Link, ein WebAssembly-Modul, ein ZIP, einen Audioschnipsel. Die alte Beschränkung auf Bilder war willkürlich – Base64 ist es egal, was die Bytes bedeuten."
    },
    {
      "question": "Was heißt „das letzte Zeichen trägt Bits, die verworfen werden“?",
      "answer": "Jedes Base64-Zeichen hält sechs Bits, aber die letzte Gruppe einer Nutzlast braucht oft weniger. QQ== und QR== dekodieren beide zum einzelnen Byte 0x41, weil die letzten vier Bits des R weggeworfen werden. Kein Encoder erzeugt die zweite Form; sie zu sehen bedeutet, dass die Zeichenkette abgeschnitten oder von Hand bearbeitet wurde – gut zu wissen, bevor du dem Ergebnis traust."
    },
    {
      "question": "Warum sagt das Dekodieren, die Bytes seien kein UTF-8?",
      "answer": "Weil sie kein Text sind. Base64 trägt Bytes, und viele Nutzlasten sind Bilder, Archive oder Schlüssel. Das alte Verhalten war, „ungültiges Base64“ zu melden, was einfach falsch war: Am Base64 lag es nicht. Wechsle zum Tab „Base64 zu Datei“, dann erkennt das Werkzeug das Format und lässt dich es herunterladen."
    },
    {
      "question": "Sollte ich die Ausgabe bei 76 Spalten umbrechen?",
      "answer": "Nur wenn etwas weiter unten es erwartet. MIME-Bodies und PEM-Blöcke sind laut Spezifikation umgebrochen – PEM bei 64 Spalten, MIME bei 76 – und manche Mail-Parser lehnen eine einzige riesige Zeile ab. Für eine data:-URL in einem Stylesheet oder einem JSON-Feld lass den Umbruch aus."
    },
    {
      "question": "Wird irgendetwas an einen Server gesendet?",
      "answer": "Nein. Jeder Schritt ist eine native Browser-API in deinem Tab, das Werkzeug funktioniert daher offline weiter, sobald die Seite geladen ist. Nichts wird hochgeladen, entfernt zwischengespeichert oder protokolliert."
    }
  ],

  "footerTagline": "Kodiere jede Datei nach Base64 und dekodiere jede Nutzlast zurück: URL-sicheres Alphabet, optionales Padding, Hex-Inspektor und Formaterkennung über Magic Bytes, vollständig im Browser.",
  "footerCredit": "Teil der oLoveTools-Suite",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "Kopiert!",
  "contactForIdeas": "Kontakt für Ideen und Kommentare:"
};
