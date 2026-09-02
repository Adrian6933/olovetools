export default {
  "copyPath": "Pfad kopieren",
  "copyValue": "Wert kopieren",
  "copyBranch": "Ganzen Zweig kopieren",
  "resetHint": "Neu anfangen",
  "title": "JSONFlow",
  "description": "JSON im Browser prüfen, durchsuchen und umwandeln: exakte Fehlerposition, ein Baum, der auch bei riesigen Dateien flüssig bleibt, JSONPath-Abfragen und Export nach CSV, XML, YAML, JSON Schema oder TypeScript.",

  // Aktionen
  "beautify": "Formatieren",
  "minify": "Verkleinern",
  "sort_keys": "Schlüssel sortieren",
  "sort_none": "Ursprüngliche Reihenfolge",
  "sort_asc": "Schlüssel A → Z",
  "sort_desc": "Schlüssel Z → A",
  "clear": "Leeren",
  "load_mock": "Beispiel laden",
  "copy": "Kopieren",
  "copied": "Kopiert!",
  "undo": "Rückgängig",
  "redo": "Wiederholen",
  "close": "Schließen",
  "shortcuts": "Tastenkürzel",
  "open_file": "Datei öffnen",
  "copy_source": "Quelltext kopieren",
  "download_json": ".json herunterladen",
  "reset_view": "Ansicht zurücksetzen",
  "parse_btn": "Auswerten",
  "repair_btn": "Reparieren",
  "unescape_btn": "Entpacken",
  "jsonl_btn": "JSON Lines zusammenführen",

  // Einrückung
  "indentation": "Einrückung",
  "indent_2_spaces": "2 Leerzeichen",
  "indent_4_spaces": "4 Leerzeichen",
  "indent_tabs": "Tabulatoren",

  // Prüfung
  "status_valid": "Gültiges JSON",
  "status_invalid": "Ungültiges JSON: ",
  "status_empty": "Noch nichts geladen.",
  "status_checking": "Prüfung läuft außerhalb des Hauptthreads…",
  "error_at": "Zeile {0}, Spalte {1}",
  "jump_to_error": "Dorthin springen",
  "warnings_title": "{0} Hinweise, die du kennen solltest",
  "empty_placeholder": "JSON hier einfügen, Datei ablegen oder Beispiel laden…",
  "drop_file_prompt": "Lege eine .json-, .jsonl-, .csv- oder .tsv-Datei ab",
  "editor_title": "Quelle",
  "fix_first": "Behebe den Fehler links, dann füllen sich die Bereiche.",
  "press_parse": "Drücke Auswerten, um den Baum für dieses Dokument aufzubauen.",

  // Befunde des Parsers
  "issueSyntax": "Syntaxfehler",
  "issueDuplicateKey": "Doppelter Schlüssel",
  "issuePrecision": "Zahl zu groß für JavaScript",
  "issueDepth": "Zu tief verschachtelt",
  "issueTrailingComma": "Überzähliges Komma",
  "issueComment": "Kommentar",
  "issueSingleQuote": "Zeichenkette in einfachen Anführungszeichen",
  "issueUnquotedKey": "Schlüssel ohne Anführungszeichen",
  "issuePythonLiteral": "Python-Literal",
  "issueNonFinite": "Keine JSON-Zahl",
  "issueBom": "Bytereihenfolge-Markierung",
  "issueEmpty": "Leeres Dokument",

  // Reiter und Ansichten
  "tab_tree_viewer": "Baum",
  "tab_formatted_json": "Code",
  "tab_table": "Tabelle",
  "tab_convert": "Umwandeln",
  "tab_schema": "Typen",
  "tab_diff": "Vergleich",

  // Baumsteuerung
  "search_placeholder": "Nach Schlüssel oder Wert filtern…",
  "scope_both": "Alles",
  "scope_keys": "Schlüssel",
  "scope_values": "Werte",
  "expand_all": "Alles ausklappen",
  "collapse_all": "Alles einklappen",
  "depth_label": "Bis Ebene öffnen",
  "depth_option": "Ebene {0}",
  "depth_all": "Alle Ebenen",
  "no_nodes": "Füge links JSON ein oder lege eine Datei ab, um zu beginnen.",
  "no_matches": "Nichts passt zu dieser Suche.",
  "tree_rows": "{0} Zeilen",
  "tree_hits": "{0} Treffer",
  "tree_mounted": "{0} im DOM",
  "tree_capped": "Obergrenze erreicht – klappe eine Ebene ein, um den Rest zu sehen",
  "copy_path": "Pfad kopieren",
  "copy_value": "Wert kopieren",
  "locate": "Im Editor zeigen",
  "stale_notice": "Der Editor hat sich seit diesem Aufbau geändert. Drücke Auswerten, um ihn zu aktualisieren.",

  // Ausgabe
  "output_size": "{0} Zeichen",
  "preview_clipped": "Die Vorschau endet bei {0} Zeichen. Kopieren und Herunterladen liefern trotzdem das Ganze.",
  "copy_failed": "Der Browser hat den Zugriff auf die Zwischenablage verweigert.",

  // Tabelle / CSV
  "flatten_title": "Flachklopfen",
  "array_json": "Array als JSON",
  "array_expand": "Je eine Spalte",
  "array_join": "Zusammengefügt",
  "separator_label": "Pfadtrenner",
  "table_summary": "{0} Zeilen × {1} Spalten. Die Vorschau zeigt die ersten {2}.",
  "table_wrapped": "Das Dokument ist kein Array, deshalb wurde daraus eine einzige Zeile.",
  "export_csv": "Herunterladen",
  "export_xml": "XML herunterladen",
  "import_csv": "CSV oder TSV zu JSON",
  "csv_placeholder": "CSV oder TSV hier einfügen, um daraus JSON zu machen…",
  "convert_csv_btn": "In JSON umwandeln",
  "csv_nest": "Verschachtelung aus a.b-Kopfzeilen wiederherstellen",
  "csv_nest_hint": "Bewusst standardmäßig aus: Eine Spalte first_name muss first_name bleiben und darf nicht zu { first: { name } } werden.",

  // Umwandeln / Typen
  "xml_root": "Wurzelelement",
  "type_name": "Bezeichnung",
  "schema_hint": "Aus allen Datensätzen abgeleitet, nicht nur aus dem ersten: Ein Feld, das manchen fehlt, wird optional.",

  // Abfragen
  "query_placeholder": "$.nutzer[?(@.alter > 30)].name",
  "query_matches": "{0} Treffer",
  "query_use": "Als Dokument verwenden",

  // Vergleich
  "diff_hint": "Verglichen wird nach Pfad, nicht nach Zeile: Eine andere Schlüsselreihenfolge gilt nicht als Änderung.",
  "diff_placeholder": "Füge hier das andere JSON-Dokument ein…",
  "diff_run": "Vergleichen",
  "diff_identical": "Die beiden Dokumente sind strukturell identisch.",
  "diff_added": "Hinzugefügt",
  "diff_removed": "Entfernt",
  "diff_changed": "Geändert",
  "diff_type": "Typ",

  // Ausführungsleiste / Dateien
  "manual_mode": "Manueller Modus",
  "manual_on": "Es wird nichts aufgebaut, bis du Auswerten drückst.",
  "manual_off": "Dokumente unter {0} werden beim Tippen aufgebaut; größere warten auf Auswerten.",
  "parked_hint": "Absichtlich zurückgehalten: Eine Datei dieser Größe in den Editor zu laden ist genau der teure Teil.",
  "parked_load": "Trotzdem laden",
  "file_too_large": "Diese Datei ist zu groß, um sie in einem Browser-Tab zu öffnen.",
  "file_failed": "Diese Datei konnte nicht gelesen werden.",

  // Kennzahlen
  "stat_bytes": "Größe",
  "stat_lines": "Zeilen",
  "stat_nodes": "Knoten",
  "stat_depth": "Tiefe",
  "stat_keys": "Eindeutige Schlüssel",
  "stat_time": "Auswertung",
  "stat_offthread": "Worker",

  // Meldungen
  "toast_csv_loaded": "{0} Zeilen aus {1} importiert.",
  "toast_jsonl_loaded": "JSON Lines zu einem einzigen Array zusammengeführt.",
  "toast_needs_valid": "Behebe zuerst den Fehler – es gibt noch nichts aufzubauen.",
  "toast_repaired": "Zu striktem JSON repariert.",
  "toast_unrepairable": "Dieses Dokument ist zu beschädigt für eine automatische Reparatur.",
  "toast_unescaped": "Das in der Zeichenkette versteckte JSON wurde ausgepackt.",
  "toast_unescape_failed": "Das ist keine JSON-Zeichenkette in Anführungszeichen.",

  // Kürzel
  "sc_undo": "Rückgängig",
  "sc_redo": "Wiederholen",
  "sc_parse": "Dokument auswerten",
  "sc_beautify": "Formatieren",
  "sc_minify": "Verkleinern",
  "sc_copy": "Formatierte Ausgabe kopieren",
  "sc_help": "Dieses Fenster",

  // Weitergabe
  "nextStepTitle": "Weitermachen",
  "nextStepHint": "Das Dokument kommt mit – kein Herunterladen, kein erneutes Hochladen",
  "nextDiff": "Vergleichen",
  "nextCodecard": "Code-Bild erzeugen",
  "nextXml": "XML ⇄ JSON",
  "nextHash": "Prüfsumme bilden",
  "nextMarkdown": "Dokumentieren",

  // Beispiele
  "mock_user_profile": "Benutzerprofil",
  "mock_product_catalog": "Produktkatalog",
  "mock_weather_data": "Wettervorhersage",
  "sample_broken": "Kaputte Konfiguration (reparierbar)",
  "sample_bigint": "64-Bit-Kennungen",

  // So funktioniert es
  "hero_badge": "Werkbank",
  "howItWorksTitle": "So funktioniert es",
  "step1Title": "Bring das JSON herein",
  "step1Text": "Einfügen, Datei ablegen oder von einem anderen Werkzeug übergeben lassen. Nichts wird hochgeladen, und nichts Aufwendiges startet, bevor du es verlangst.",
  "step2Title": "Lies das Urteil",
  "step2Text": "Gültig – oder genau die Zeile und Spalte, an der es bricht, dazu doppelte Schlüssel und Zahlen, die JavaScript nicht halten kann.",
  "step3Title": "Sieh es dir an",
  "step3Text": "Klappe den Baum, filtere nach Schlüssel oder Wert, oder lass einen JSONPath-Ausdruck über das ganze Dokument laufen.",
  "step4Title": "Nimm es mit",
  "step4Text": "CSV, XML, YAML, JSON Lines, ein JSON Schema, TypeScript- oder Go-Typen – oder schick es direkt an ein anderes Werkzeug.",

  "features": [
    {
      "title": "Ein echter Parser, kein JSON.parse",
      "text": "Fehler kommen mit Zeile, Spalte und markierter Zeile am Rand, statt mit einem Zeichenversatz, den du selbst abzählen müsstest."
    },
    {
      "title": "64-Bit-Kennungen überleben",
      "text": "Lange numerische Kennungen werden Ziffer für Ziffer neu geschrieben. Jeder auf JSON.parse gebaute Formatierer rundet sie still auf den nächsten Gleitkommawert."
    },
    {
      "title": "Reparatur mit einem Klick",
      "text": "Kommentare, überzählige Kommas, einfache Anführungszeichen, Schlüssel ohne Anführungszeichen, Pythons True/False/None und ein verirrtes BOM werden zu striktem JSON."
    },
    {
      "title": "JSONPath-Abfragen",
      "text": "Platzhalter, rekursiver Abstieg, Bereiche und Filter wie [?(@.preis > 10)], von Hand ausgewertet: Nichts von dem, was du tippst, wird jemals ausgeführt."
    },
    {
      "title": "Typen aus echten Daten",
      "text": "JSON Schema, TypeScript-Schnittstellen oder Go-Strukturen, abgeleitet über alle Datensätze, sodass manchmal fehlende Felder als optional herauskommen."
    },
    {
      "title": "Ehrliches Flachklopfen",
      "text": "Du wählst den Pfadtrenner und was mit verschachtelten Arrays passiert. Leere Objekte behalten ihre Spalte, statt aus dem Export zu verschwinden."
    },
    {
      "title": "Struktureller Vergleich",
      "text": "Zwei Dokumente Pfad für Pfad verglichen, damit eine andere Schlüsselreihenfolge nicht zu tausend Änderungen wird."
    },
    {
      "title": "Große Dateien bleiben bedienbar",
      "text": "Die Prüfung wandert in einen Web Worker, der Baum hängt nur die sichtbaren Zeilen ein, und der Verlauf speichert die geänderten Zeichen statt einer Kopie des Dokuments."
    }
  ],

  // SEO und Texte
  "seo_title": "JSONFlow | JSON-Formatierer, -Prüfer, -Betrachter und -Konverter",
  "seo_description": "JSON formatieren, prüfen und durchsuchen – mit exakter Fehlerposition und einem Baum, der auch bei großen Dateien flüssig bleibt. Nach CSV, XML, YAML oder JSON Lines umwandeln, JSON Schema und TypeScript-Typen erzeugen und JSONPath-Abfragen ausführen, alles im Browser.",
  "seoHeroTitle": "Format, explore and convert JSON safely.",
  "seoHeroText": "API-Antworten tragen Tokens, Kundendaten und interne Kennungen. JSONFlow schickt nichts davon irgendwohin: Parser, Baum, Abfragen und Exporte laufen in diesem Tab – eine Produktionsantwort hier einzufügen ist so privat, wie sie im eigenen Editor zu öffnen.",
  "seoHeroList": [
    "100 % lokal – nichts wird hochgeladen",
    "Exakte Zeile und Spalte für jeden Fehler",
    "CSV, XML, YAML, Schema und TypeScript"
  ],
  "seoBrowserSpeedTitle": "Alles läuft in diesem Tab",
  "seoBrowserSpeedText": "Der Parser, der klappbare Baum, die JSONPath-Auswertung und jeder Export sind gewöhnliches JavaScript, das auf deinem Gerät läuft. Kein Upload-Schritt, kein Server, keine Anfrage, die deine Daten mitnimmt: Trenne die Verbindung nach dem Laden der Seite, und das Werkzeug arbeitet weiter.",
  "seoSecondaryTitle": "Die vollständige JSON-Werkbank für Entwickler.",
  "seoKeywordsTitle": "Schlüsselwörter",
  "seoKeywords": [
    "JSON-Formatierer",
    "JSON-Prüfer",
    "JSON-Betrachter",
    "JSON zu CSV",
    "JSON zu XML",
    "JSON zu YAML",
    "CSV zu JSON",
    "JSON verschönern",
    "JSONPath",
    "JSON-Schema-Generator",
    "JSON zu TypeScript",
    "JSON vergleichen",
    "JSON reparieren",
    "JSON Lines"
  ],
  "seoUseCaseTitle": "Wofür man es benutzt",
  "seoUseCaseText": "Das eine Komma finden, das eine Konfigurationsdatei zerlegt, eine API-Antwort in eine Tabelle verwandeln, die TypeScript-Schnittstelle für einen nie dokumentierten Endpunkt erzeugen, prüfen ob zwei Fassungen derselben Nutzlast sich wirklich unterscheiden, und Protokolle öffnen, in denen das JSON in einer Zeichenkette verpackt ankam.",
  "seoPrivacyTitle": "Warum lokal hier zählt",
  "seoPrivacyText": "Eine JSON-Nutzlast ist selten anonym: Sie enthält Zugriffstokens, E-Mail-Adressen, Bestellnummern und interne Endpunkte. Wer das in einen gehosteten Formatierer einfügt, übergibt alles dem Server eines Fremden. Hier verlässt es den Tab nicht – es gibt nichts zu protokollieren, zwischenzuspeichern oder zu verlieren.",

  "faqTitle": "Häufige Fragen",
  "faq": [
    {
      "question": "Wird mein JSON an einen Server geschickt?",
      "answer": "Nein. Auswertung, Prüfung, Baum, Abfragen und sämtliche Exporte laufen in diesem Browser-Tab. Du kannst die Netzwerkverbindung nach dem Laden der Seite trennen, und alles funktioniert weiter."
    },
    {
      "question": "Wie große Dateien schafft es wirklich?",
      "answer": "Auf einem gewöhnlichen Laptop wird ein 1,5-MB-Dokument mit 180 000 Knoten in deutlich unter einer Zehntelsekunde ausgewertet, und Dateien von mehreren zehn Megabyte öffnen sich weiterhin: Die Prüfung wandert in einen Web Worker, und der Baum zeichnet nur die sichtbaren Zeilen. Begrenzt wird das durch den Arbeitsspeicher, nicht durch das Werkzeug: Ab etwa 100 MB kommt ein Browser-Tab mit jedem Programm ins Straucheln. Alles über 2 MB wird hinter einer Schaltfläche zurückgehalten statt automatisch geladen, damit eine große Datei die Seite beim Ankommen nie einfriert."
    },
    {
      "question": "Warum ändern sich meine langen Kennungen in anderen Formatierern?",
      "answer": "JSON.parse macht aus jeder Zahl eine 64-Bit-Gleitkommazahl, die ganze Zahlen über 2^53 nicht exakt darstellen kann – einer Twitter-, Discord- oder Snowflake-Kennung fehlen dann die letzten Ziffern. JSONFlow behält die ursprünglichen Ziffern aus dem Quelltext und warnt, sobald eine Zahl in diesen Bereich fällt."
    },
    {
      "question": "Meine Datei hat Kommentare und überzählige Kommas. Ist das ein Problem?",
      "answer": "Nein. Scheitert die strikte Auswertung, läuft automatisch ein toleranter Durchgang, und wenn der gelingt, erscheint eine Schaltfläche Reparieren. Sie kommt mit Kommentaren, überzähligen Kommas, einfachen Anführungszeichen, Schlüsseln ohne Anführungszeichen, Pythons True/False/None, NaN und Infinity zurecht und schreibt das Dokument als striktes JSON neu."
    },
    {
      "question": "Wie funktioniert das Flachklopfen von JSON zu CSV?",
      "answer": "Jedes Element des äußeren Arrays wird zu einer Zeile, verschachtelte Schlüssel werden zu Punktspalten wie user.address.city. Du wählst den Trenner und ob verschachtelte Arrays je eine Spalte bekommen, als JSON stehen bleiben oder zusammengefügt werden. Zurück werden Kopfzeilen wörtlich genommen: Eine Spalte first_name bleibt first_name, sofern du nicht ausdrücklich die Verschachtelung verlangst."
    },
    {
      "question": "Was kann ich in die Abfragezeile schreiben?",
      "answer": "Eine JSONPath-Teilmenge: $.users[0].name, Platzhalter mit [*], rekursiver Abstieg mit .., Bereiche wie [0:5], negative Indizes und Filter wie [?(@.price > 10)] oder [?(@.name =~ ^a)]. Ausdrücke werden von Hand ausgewertet, nie als Code ausgeführt."
    }
  ],
  "footerTagline": "Schnelle, hochwertige und private Werkzeuge für Designer und Entwickler.",
  "footerCredit": "Teil der oLoveTools-Suite"
};
