export default {
  "emailCopied": "Kopiert!",
  "contactForIdeas": "Kontakt für Ideen und Anmerkungen:",
  "resetHint": "Neu anfangen",
  "title": "HashBolt",
  "badge": "Prüfsummen und Dateiintegrität",
  "description": "Berechne MD5, SHA-1, SHA-256, SHA-512, SHA-3, BLAKE3 oder CRC-32 für Dateien beliebiger Größe oder für reinen Text und vergleiche das Ergebnis mit der veröffentlichten Prüfsumme. Die Datei wird stückweise im Browser verarbeitet und niemals hochgeladen.",
  "seo_title": "HashBolt | Kostenloser Online-Generator für MD5-, SHA-256-, SHA-512- und BLAKE3-Prüfsummen",
  "seo_description": "Prüfsummen im Browser erzeugen und verifizieren: MD5, SHA-1, SHA-256, SHA-384, SHA-512, SHA-3, BLAKE2b, BLAKE3, RIPEMD-160, CRC-32, xxHash und HMAC. Dateien mit mehreren Gigabyte, Stapelverarbeitung und SHA256SUMS-Prüfung. Nichts wird hochgeladen.",
  "modeFile": "Dateien",
  "modeText": "Text",
  "modeCompare": "Vergleichen",
  "dropTitle": "Dateien hier ablegen",
  "dropHint": "Beliebiger Typ, beliebige Größe, beliebig viele. Gelesen wird erst, wenn du auf Berechnen drückst.",
  "browseBtn": "Dateien wählen",
  "folderBtn": "Ganzer Ordner",
  "pasteHint": "oder mit Strg+V einfügen",
  "queueTitle": "Warteschlange ({count})",
  "clearBtn": "Leeren",
  "removeBtn": "Entfernen",
  "statusQueued": "wartet",
  "statusCancelled": "gestoppt",
  "staleNotice": "Einstellungen geändert",
  "pendingCount": "noch {count} zu berechnen",
  "computeBtn": "Hashes berechnen",
  "computeAgainBtn": "Neu berechnen",
  "cancelBtn": "Stoppen",
  "algoTitle": "Algorithmen",
  "algoNone": "Nichts ausgewählt",
  "algoHint": "Wähle so viele aus, wie du brauchst: Die Datei wird einmal gelesen und alle Prüfwerte entstehen in diesem einen Durchlauf.",
  "groupChecksum": "Prüfsummen und Altlasten",
  "groupSha2": "SHA-2-Familie",
  "groupModern": "Moderne",
  "brokenTag": "Kollisionen sind praktisch machbar: gut gegen Übertragungsfehler, nutzlos gegen Manipulation",
  "outputTitle": "Ausgabe",
  "formatHex": "Hex",
  "formatBase64": "Base64",
  "formatBase64Url": "Base64URL",
  "uppercaseLabel": "GROSSBUCHSTABEN",
  "groupedLabel": "Gruppiert",
  "hmacTitle": "HMAC (Hash mit Schlüssel)",
  "hmacHint": "Signiert den Inhalt mit einem gemeinsamen Geheimnis: Ohne den Schlüssel ist der Prüfwert wertlos.",
  "hmacPlaceholder": "Geheimer Schlüssel",
  "hmacSkipped": "{algos} haben keinen HMAC-Modus und werden übersprungen.",
  "textLabel": "Zu hashender Text",
  "textPlaceholder": "Tippe oder füge etwas ein — der Prüfwert aktualisiert sich beim Schreiben.",
  "textHint": "Text zu hashen ist nicht dasselbe wie eine Datei mit diesem Text zu hashen: Ein abschließender Zeilenumbruch oder Windows-CRLF verändert das Ergebnis.",
  "normalizeEolLabel": "Windows-Zeilenenden normalisieren (CRLF → LF)",
  "compareHint": "Zwei Hashes, keine Datei. Füge den veröffentlichten und den erhaltenen Wert ein — hex oder Base64, groß oder klein geschrieben.",
  "compareA": "Hash A",
  "compareB": "Hash B",
  "compareEqual": "Identisch. Derselbe Prüfwert, unabhängig von der Schreibweise.",
  "compareDifferent": "Unterschiedlich. Die beiden beschreiben verschiedene Inhalte.",
  "compareInvalid": "Einer davon ist weder gültiges Hex noch Base64.",
  "resultsTitle": "Prüfwerte",
  "resultsEmpty": "Datei in die Warteschlange legen, Algorithmen auswählen und Berechnen drücken.",
  "resultsEmptyText": "Fang an zu tippen, dann erscheinen die Prüfwerte hier.",
  "resultsEmptyCompare": "Der Vergleichsmodus hasht nichts: Er sagt dir nur, ob zwei Prüfwerte derselbe Wert sind.",
  "copyBtn": "Kopieren",
  "copyAllBtn": "Alles kopieren",
  "downloadSumsBtn": "SUMS-Datei herunterladen",
  "verifyTitle": "Gegen eine Prüfsumme verifizieren",
  "verifyPlaceholder": "Einen Hash einfügen oder eine ganze SHA256SUMS-Datei — die Zeilen werden über den Dateinamen zugeordnet.",
  "verifyHint": "Hex und Base64 funktionieren beide, in jeder Schreibweise. Eine Länge, die kein ausgewählter Algorithmus erzeugt, wird benannt statt als Abweichung gemeldet.",
  "verifySummary": "Prüfsummen gelesen: {count} · bestätigt: {ok} · abweichend: {bad}",
  "verifyMatch": "Treffer — derselbe {algo}-Prüfwert.",
  "verifyMismatch": "Kein Treffer. Diese Datei ist nicht die, die diese Prüfsumme beschreibt.",
  "verifyUnknownLength": "Diese Prüfsummenlänge passt zu keinem der ausgewählten Algorithmen. Wähle den richtigen und berechne erneut.",
  "nextStepTitle": "Weiter geht’s",
  "nextStepHint": "Dieselbe Datei kommt mit — kein erneutes Hochladen",
  "nextZip": "In ZIP packen",
  "nextCompress": "Komprimieren",
  "nextFormat": "Format ändern",
  "nextExif": "Metadaten entfernen",
  "nextCrop": "Zuschneiden",
  "nextPdf": "Teilen oder zusammenführen",
  "nextFrames": "Einzelbild holen",
  "nextAudio": "Kürzen oder umwandeln",
  "howItWorksTitle": "So funktioniert es",
  "step1Title": "Lege an, was du prüfen willst",
  "step1Text": "Dateien ablegen, einen ganzen Ordner wählen, eine einfügen oder auf den Text-Tab wechseln. Gelesen wird noch nichts.",
  "step2Title": "Algorithmen auswählen",
  "step2Text": "Einer oder ein Dutzend. Sie teilen sich einen einzigen Durchlauf, drei Prüfwerte kosten also kaum mehr als einer.",
  "step3Title": "Auf Berechnen drücken",
  "step3Text": "Die Datei läuft stückweise durch einen Worker: Der Fortschritt ist echt und ein 20-GB-Abbild landet nie im RAM.",
  "step4Title": "Mit dem veröffentlichten Wert vergleichen",
  "step4Text": "Füge einen Hash oder eine komplette SUMS-Datei ein. Verglichen wird der Wert, nicht die Schreibweise.",
  "features": [
    {
      "title": "Es streamt, statt zu schlucken",
      "text": "Dateien werden stückweise in einem Worker gelesen: Der Speicherbedarf bleibt flach und der Balken zeigt tatsächlich gehashte Bytes. Eine ISO mit mehreren Gigabyte ist hier Alltag."
    },
    {
      "title": "Zwölf Prüfwerte, ein Lesevorgang",
      "text": "MD5, SHA-1, SHA-256/384/512, SHA3-256/512, BLAKE2b, BLAKE3, RIPEMD-160, CRC-32 und xxHash64 werden alle aus demselben Durchlauf gespeist."
    },
    {
      "title": "Eine Prüfung, die sich erklärt",
      "text": "Füge einen Hash oder eine ganze SHA256SUMS-Liste ein. Verglichen wird der Wert über Hex und Base64 hinweg, und eine Länge, die zu keinem gewählten Algorithmus gehört, wird als solche benannt statt als Abweichung."
    },
    {
      "title": "Ordner und Stapel",
      "text": "Hundert Dateien anstellen, nacheinander hashen und dann eine coreutils-kompatible SUMS-Datei exportieren, die du neben deinen Download stellen kannst."
    },
    {
      "title": "HMAC und jede Schreibweise",
      "text": "HMAC mit Schlüssel sowie Ausgabe in Hex, Base64 und Base64URL, Großschreibung und gruppierte Anzeige. Ein Wechsel zeichnet sofort neu, statt die Datei erneut zu lesen."
    },
    {
      "title": "Nichts wird hochgeladen",
      "text": "Die Engine ist WebAssembly, eingebettet in die Seite selbst. Kein CDN, keine API, kein Upload: Nach dem Laden das Netzwerk trennen — es läuft weiter."
    }
  ],
  "seoHeroTitle": "Prüfe einen Download, bevor du ihm vertraust",
  "seoHeroText": "Eine Prüfsumme ist der einzige günstige Weg, um zu wissen, dass das eben geladene Installationsprogramm Byte für Byte das veröffentlichte ist und nicht ein abgebrochener Transfer oder ein ausgetauschter Spiegelserver. HashBolt berechnet diesen Fingerabdruck lokal: Dateien laufen stückweise durch eine WebAssembly-Engine, Größe ist damit keine Grenze mehr, und jeder ausgewählte Algorithmus wird aus demselben Lesevorgang gespeist. Danach fügst du den veröffentlichten Wert ein — einen einzelnen Hash, eine SHA256SUMS-Liste, eine Zeile im BSD-Format — und bekommst ein Urteil, das auch nennt, welcher Algorithmus gepasst hat.",
  "seoHeroList": [
    "Dateien jeder Größe",
    "Zwölf Algorithmen in einem Durchlauf",
    "SHA256SUMS-Prüfung",
    "Funktioniert nach dem Laden offline"
  ],
  "seoBrowserSpeedTitle": "Eine WebAssembly-Engine im Worker",
  "seoBrowserSpeedText": "Das Hashen läuft außerhalb des Hauptthreads auf kompiliertem WebAssembly — eine Größenordnung schneller als das handgeschriebene JavaScript, das die meisten Online-Werkzeuge für MD5 immer noch verwenden. Weil die Datei als Strom verarbeitet wird, entspricht die Speicherspitze einem Stück statt der ganzen Datei, und die Oberfläche bleibt bedienbar, während ein 4-GB-Archiv gelesen wird.",
  "seoSecondaryTitle": "Was eine Prüfsumme beweist — und was nicht",
  "seoUseCaseTitle": "Downloads, Backups und Duplikate",
  "seoUseCaseText": "Prüfe eine Linux-ISO oder ein Installationsprogramm gegen den Hash auf der Herstellerseite. Bestätige, dass eine auf eine externe Platte kopierte Datei unversehrt angekommen ist. Erkenne zwei identische Dateien unter verschiedenen Namen über ihre Prüfwerte, statt sie zu öffnen. Und erzeuge eine SUMS-Datei für deine eigene Veröffentlichung, damit andere dasselbe tun können.",
  "seoPrivacyTitle": "Es kann nicht verraten, was es nie sendet",
  "seoPrivacyText": "Dieses Werkzeug hat keinen Upload-Endpunkt, und am Hashen ist keine einzige Netzwerkanfrage beteiligt: Das WebAssembly-Modul steckt in der Seite und funktioniert bei getrennter Verbindung. Deine Dateien, dein Text und jeder eingegebene HMAC-Schlüssel bleiben im Tab und verschwinden beim Schließen.",
  "seoKeywordsTitle": "Schlüsselwörter",
  "seoKeywords": [
    "MD5-Generator online",
    "SHA-256-Prüfsumme",
    "Datei-Hash prüfen",
    "SHA256SUMS-Prüfer",
    "BLAKE3 online",
    "CRC-32-Rechner",
    "HMAC-Generator",
    "Dateiintegrität prüfen"
  ],
  "faqTitle": "Häufige Fragen",
  "faq": [
    {
      "question": "Wird meine Datei irgendwohin hochgeladen?",
      "answer": "Nein. Die Hash-Engine ist WebAssembly, das in der Seite eingebettet ist und in einem Worker deines Browsers läuft. Es gibt keinen Upload-Endpunkt, keinen API-Aufruf und keine CDN-Anfrage, deshalb arbeitet das Werkzeug auch ohne Netzwerkverbindung weiter."
    },
    {
      "question": "Wie große Dateien schafft es?",
      "answer": "Es gibt keine feste Obergrenze: Die Datei wird als Strom in kleinen Stücken verarbeitet, es liegt also immer nur ein Stück im Speicher, und Abbilder mit mehreren Gigabyte sind Routine. Begrenzt wirst du in der Praxis von der Lesegeschwindigkeit deines Datenträgers — genau das zeigt die Durchsatzanzeige."
    },
    {
      "question": "Wie verifiziere ich eine heruntergeladene ISO oder ein Installationsprogramm?",
      "answer": "Datei anstellen, den vom Hersteller verwendeten Algorithmus auswählen (fast immer SHA-256), auf Berechnen drücken und den veröffentlichten Wert in das Prüffeld einfügen. Du kannst auch die komplette SHA256SUMS-Datei einfügen: Die Zeilen werden über den Dateinamen zugeordnet."
    },
    {
      "question": "Warum trägt MD5 eine Warnung?",
      "answer": "Weil es heute billig ist, zwei verschiedene Dateien mit demselben MD5-Prüfwert zu bauen; für SHA-1 gilt dasselbe. Zum Erkennen eines beschädigten Transfers taugen sie weiterhin bestens — dafür steht die Prüfsumme auf einer Downloadseite meist da —, gegen jemanden, der die Datei absichtlich verändert hat, beweisen sie nichts."
    },
    {
      "question": "Mein Hash passt nicht zu dem auf der Website. Was jetzt?",
      "answer": "Prüfe zuerst, ob du denselben Algorithmus verglichen hast: Ein 64-stelliger Hash kann SHA-256, SHA3-256, BLAKE2b oder BLAKE3 sein, und das Werkzeug nennt dir den passenden. Lade die Datei anschließend erneut: Eine echte Abweichung stammt meist aus einem abgebrochenen Transfer oder einem fehlerhaften Spiegel. Bleibt sie bei einem frischen Download bestehen, führe die Datei nicht aus."
    },
    {
      "question": "Warum ergibt Text einen anderen Wert als eine Datei mit demselben Text?",
      "answer": "Weil eine Datei meist etwas mitbringt, das im Textfeld fehlt: einen abschließenden Zeilenumbruch, Windows-CRLF-Zeilenenden oder eine UTF-8-BOM. Das Werkzeug hasht exakt die Bytes, die du übergibst, und es gibt einen Schalter, der CRLF zu LF normalisiert, wenn du einen unter Linux erzeugten Wert treffen musst."
    },
    {
      "question": "Wofür ist HMAC gut?",
      "answer": "Ein einfacher Hash belegt, dass sich der Inhalt nicht versehentlich geändert hat — nachrechnen kann ihn aber jeder. Ein HMAC mischt einen geheimen Schlüssel in den Prüfwert, sodass nur der Schlüsselinhaber ihn erzeugen oder prüfen kann. Genau das nutzen API-Signaturen und die Verifikation von Webhooks."
    }
  ],
  "footerTagline": "Kostenloser Prüfsummen-Generator und -Prüfer für Dateien und Text, vollständig im Browser.",
  "footerCredit": "Teil der oLoveTools-Suite"
};
