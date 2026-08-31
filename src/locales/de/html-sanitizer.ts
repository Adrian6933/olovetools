export default {
  "title": "HTML Sanitizer",
  "seo_title": "HTML Sanitizer | Kostenloser HTML-Cleaner mit Entfernungsbericht",
  "seo_description": "HTML mit einer echten Whitelist-Richtlinie säubern: Skripte, Event-Handler, javascript:-URLs und unerwünschte Tags entfernen, genau sehen was wegfiel und Einzelnes zurückholen. Läuft vollständig im Browser.",
  "seoHeroTitle": "HTML-Cleaner & Sanitizer",
  "badge": "Whitelist-Sanitizer",
  "description": "HTML einfügen, Richtlinie wählen, Knopf drücken. Sie bekommen das gesäuberte Markup plus einen aufgeschlüsselten Bericht über jedes verworfene Tag und Attribut — und können jede einzelne Entscheidung widerrufen, ohne irgendetwas erneut einzufügen.",
  "heroPoints": [
    "Nichts läuft, bevor Sie drücken",
    "Jede Entfernung einzeln aufgeführt",
    "Verlässt niemals Ihren Browser"
  ],
  "label_input": "HTML-Eingabe",
  "label_policy": "Säuberungsrichtlinie",
  "placeholder_input": "HTML hier einfügen, eine .html-Datei ablegen oder eines der Beispiele laden. Nichts läuft, bis Sie auf Säubern drücken.",
  "button_open_file": "Datei öffnen",
  "button_clear": "Alles löschen",
  "button_run": "Säubern",
  "button_working": "Säubere…",
  "button_manual": "Manuell",
  "button_undo": "Rückgängig",
  "button_redo": "Wiederholen",
  "button_copy": "Kopieren",
  "button_copied": "Kopiert!",
  "button_download": "Herunterladen",
  "button_reset": "Zurücksetzen",
  "samples_title": "Ausprobieren",
  "sample_messy": "Unsauberer CMS-Einfügetext",
  "sample_attack": "Bekannte XSS-Payloads",
  "preset_strict": "Streng",
  "preset_strict_hint": "Nur Text und Links. Für alles, was Sie speichern werden.",
  "preset_email": "E-Mail-tauglich",
  "preset_email_hint": "Tabellen und Inline-Stil überleben, Skripting nicht.",
  "preset_content": "Rich Content",
  "preset_content_hint": "Ein CMS-Textkörper: Medien, Tabellen, data-* und aria-*.",
  "preset_text": "Reiner Text",
  "preset_text_hint": "Alles Markup verwerfen, Lesereihenfolge behalten.",
  "preset_custom_active": "Eigene Richtlinie — von Hand bearbeitet.",
  "stale_hint": "Richtlinie geändert — erneut ausführen",
  "shortcut_hint": "Strg+Enter zum Ausführen · Strg+Z macht eine Richtlinienänderung rückgängig",
  "tab_source": "Gesäuberter Quelltext",
  "tab_preview": "Vorschau",
  "tab_report": "Entfernt",
  "format_pretty": "Formatiert",
  "format_min": "Minifiziert",
  "format_raw": "Wie geparst",
  "compare_hold": "Halten zum Vergleichen",
  "compare_showing": "Original",
  "output_empty": "Alles wurde entfernt — nichts hat diese Richtlinie überlebt.",
  "copy_failed": "Ihr Browser hat den Zugriff auf die Zwischenablage blockiert.",
  "stat_size": "Größe",
  "stat_elements": "Elemente",
  "stat_removed": "entfernt",
  "stat_dangerous": "ausführbar",
  "stat_time": "Zeit",
  "policy_allowed_tags": "Erlaubte Tags",
  "policy_allowed_attrs": "Erlaubte Attribute",
  "policy_add_tag": "Tag hinzufügen…",
  "policy_add_attr": "Attribut hinzufügen…",
  "policy_no_tags": "Keine Tags erlaubt — die Ausgabe wird reiner Text",
  "policy_no_attrs": "Keine Attribute behalten",
  "policy_strip_tags": "Mitsamt Inhalt löschen",
  "policy_strip_hint": "wird nie ausgepackt — das Innere geht mit",
  "policy_no_strip": "Nichts wird mitsamt Inhalt gelöscht",
  "policy_unknown": "Nicht erlaubte Tags",
  "policy_unwrap": "Auspacken — den Text darin behalten",
  "policy_drop": "Verwerfen — den ganzen Teilbaum entfernen",
  "policy_schemes": "Akzeptierte URL-Schemata",
  "policy_schemes_hint": "alles andere in href/src wird verworfen",
  "policy_data_note": "data:image akzeptiert nur Rasterformate. SVG-Daten-URLs sind nie erlaubt: ein Inline-SVG führt beim direkten Öffnen sein eigenes <script> aus.",
  "policy_other": "Attribute und Extras",
  "policy_keep_style": "style=\"…\" behalten",
  "policy_keep_class": "class=\"…\" behalten",
  "policy_keep_id": "id / name behalten",
  "policy_keep_comments": "Kommentare behalten",
  "policy_data_attrs": "data-*-Attribute behalten",
  "policy_aria_attrs": "aria-* und role behalten",
  "policy_svg_math": "<svg> und <math> zulassen",
  "policy_harden_links": "rel=\"noopener noreferrer\" ergänzen",
  "policy_strip_target": "target=\"_blank\" entfernen",
  "scheme_https_hint": "Verschlüsselte Links und Bilder.",
  "scheme_http_hint": "Unverschlüsseltes HTTP — intern in Ordnung, im Netz mitlesbar.",
  "scheme_relative_hint": "Pfade und Anker ohne Schema: /seite, #abschnitt, ?q=1.",
  "scheme_mailto_hint": "E-Mail-Links.",
  "scheme_tel_hint": "Telefon-, SMS- und Direktwahl-Links.",
  "scheme_ftp_hint": "Alte Dateiübertragungs-Links.",
  "scheme_data_hint": "Als Daten-URL eingebettete Bilder. Nur Rasterformate.",
  "report_empty": "Nichts wurde entfernt — die Eingabe entsprach der Richtlinie bereits.",
  "report_dangerous": "{0} Entfernungen hätten Code ausführen können.",
  "report_on": "an",
  "report_keep": "Behalten",
  "report_kept": "Behalten",
  "report_keep_it": "Das in der Ausgabe behalten",
  "report_remove_again": "Wieder entfernen",
  "reason_tag-not-allowed": "Tag steht nicht auf der Whitelist",
  "reason_tag-stripped": "Tag mitsamt Inhalt gelöscht",
  "reason_event-handler": "Inline-Event-Handler",
  "reason_attr-not-allowed": "Attribut steht nicht auf der Whitelist",
  "reason_bad-scheme": "URL-Schema nicht erlaubt",
  "reason_comment": "HTML-Kommentar",
  "reason_inline-style": "Inline-style-Attribut",
  "reason_class-attr": "class-Attribut",
  "reason_id-attr": "id- / name-Attribut",
  "nextStepTitle": "Weiter geht’s",
  "nextStepHint": "Das gesäuberte HTML reist mit — kein erneutes Hochladen",
  "nextDiff": "Mit dem Original vergleichen",
  "nextCodecard": "Code-Bild erstellen",
  "nextWordflow": "Den Text analysieren",
  "nextBase64": "In Base64 kodieren",
  "nextZip": "Als ZIP packen",
  "howItWorksTitle": "So funktioniert es",
  "step1Title": "HTML hereinholen",
  "step1Text": "Einfügen, eine .html-Datei ablegen oder aus einem anderen Werkzeug ankommen. Es wartet einfach: eine Datei zu öffnen startet die Säuberung nie.",
  "step2Title": "Richtlinie wählen",
  "step2Text": "Vier Voreinstellungen decken die üblichen Fälle ab. Öffnen Sie das manuelle Feld, um Tag-Liste, Attributliste und akzeptierte URL-Schemata selbst zu bearbeiten.",
  "step3Title": "Ausführen",
  "step3Text": "Ein Durchlauf baut den gesäuberten Baum und protokolliert unterwegs jede Entscheidung. Ein Megabyte Markup dauert wenige Millisekunden.",
  "step4Title": "Prüfen und widerrufen",
  "step4Text": "Der Bericht listet auf, was wegfiel und warum. Sind Sie mit einer Zeile nicht einverstanden, drücken Sie Behalten: der Durchlauf wiederholt sich mit genau dieser Ausnahme.",
  "featuresTitle": "Was es leistet",
  "features": [
    {
      "title": "Echte Whitelist-Richtlinie",
      "text": "Tags, Attribute und URL-Schemata sind getrennte Listen, die Sie steuern. Ein Tag zu blockieren und seine Attribute unangetastet zu lassen ist kein Sanitizing."
    },
    {
      "title": "Aufgeschlüsselter Entfernungsbericht",
      "text": "Jedes verworfene Element und Attribut erscheint gruppiert mit Anzahl, einer Probe des Inhalts und dem Grund für die Entfernung."
    },
    {
      "title": "Jede Entscheidung widerrufen",
      "text": "Behalten in einer Zeile drücken, und der Sanitizer läuft erneut und erlaubt genau diese eine Sache. Ihr Ausgangstext wird nie bearbeitet."
    },
    {
      "title": "URL-Schemata werden geprüft",
      "text": "javascript:, data:text/html und vbscript: in href, src, formaction, srcset oder xlink:href werden erkannt, samt Tricks mit Leerraum und Entities."
    },
    {
      "title": "Vorschau in der Sandbox",
      "text": "Das Ergebnis erscheint in einem iframe mit leerer Sandbox und ohne Referrer, sodass darin nichts ausgeführt, abgeschickt oder navigiert werden kann."
    },
    {
      "title": "Formatiert, minifiziert oder roh",
      "text": "Denselben gesäuberten Baum auf drei Arten neu ausgeben. Der Leerraum in <pre> bleibt erhalten, auch wenn der Rest neu eingerückt wird."
    },
    {
      "title": "Übergibt an das nächste Werkzeug",
      "text": "Schicken Sie das Ergebnis direkt an DiffSnap, CodeCard, WordFlow, Base64Bolt oder ZipFlow, ohne Umweg über den Download-Ordner."
    },
    {
      "title": "Nichts verlässt den Tab",
      "text": "Der Sanitizer ist eine mit der Seite gebündelte JavaScript-Bibliothek. Kein Upload, kein API-Aufruf und zu keinem Zeitpunkt ein CDN-Abruf."
    }
  ],
  "seoSecondaryTitle": "Ein Sanitizer, der seine Arbeit offenlegt",
  "seoHeroText": "Die meisten Online-HTML-Cleaner geben Ihnen eine Zeichenkette und erwarten Vertrauen. Dieser behält das Entscheidungsprotokoll: welches Tag verworfen wurde, welches Attribut entfernt, welche URL an der Schemaprüfung scheiterte — und lässt Sie jede Entscheidung mit einem Klick widerrufen, weil die gesäuberte Ausgabe aus Ihrer Richtlinie neu erzeugt und nicht nachträglich geflickt wird.",
  "seoHeroList": [
    "Whitelist statt Blacklist",
    "Attribute geprüft, nicht nur Tags",
    "Anzahl und Grund für jede Entfernung",
    "Rückgängig und Wiederholen auf der Richtlinie"
  ],
  "seoUseCaseTitle": "Wann Sie es brauchen",
  "seoUseCaseText": "Säubern, was ein Rich-Text-Editor erzeugt hat, bevor es gespeichert wird. Word- und Google-Docs-Ballast aus einem CMS-Einfügetext entfernen. Fremdes Markup vor der Darstellung sicher machen. Lesbaren Text aus einer gespeicherten Seite ziehen. Prüfen, ob das Markup, dem Sie gleich vertrauen, etwas Ausführbares enthält — das Beispiel mit bekannten Payloads gibt es, damit Sie die Antwort sehen statt sie anzunehmen.",
  "seoBrowserSpeedTitle": "Auf DOMPurify gebaut",
  "seoBrowserSpeedText": "Parsing und Sicherheitsentscheidungen stammen von DOMPurify, der Bibliothek, die die Sicherheitsteams der Browser selbst zitieren, statt von einem handgeschriebenen Durchlauf über querySelectorAll. Sie wird über ihre Hook-API genutzt und um das Zwischen-DOM statt um eine fertige Zeichenkette gebeten — genau das ermöglicht den Entfernungsbericht und die Ausnahmen pro Eintrag. Sie beherrscht Mutations-XSS, Namensraum-Verwechslung und die URL-Tricks, die ein naiver Cleaner übersieht.",
  "seoPrivacyTitle": "100% privat & sicher",
  "seoPrivacyText": "Keine Uploads, keine API-Schlüssel, keine Auswertung dessen, was Sie einfügen. Die Bibliothek ist mit der Seite gebündelt, es wird also auch nichts von einem CDN geladen. Ihr HTML bleibt im Speicher des Tabs und verschwindet beim Schließen.",
  "seoKeywordsTitle": "Auch bekannt als",
  "seoKeywords": [
    "html sanitizer",
    "html cleaner",
    "skripte aus html entfernen",
    "html online säubern",
    "html bereinigen",
    "tags entfernen",
    "dompurify online",
    "xss-filter",
    "html-whitelist"
  ],
  "faqTitle": "Häufig gestellte Fragen",
  "faq": [
    {
      "question": "Warum passiert beim Einfügen nichts?",
      "answer": "Das ist Absicht. Einfügen oder eine Datei öffnen lädt nur das HTML; der Sanitizer läuft, wenn Sie auf Säubern drücken. So wählen Sie erst die Richtlinie, statt dem Werkzeug beim Raten zuzusehen, und ein großes Dokument wird nie bei jedem Tastendruck geparst."
    },
    {
      "question": "Was bringt mir der Entfernungsbericht wirklich?",
      "answer": "Jede Zeile ist eine umkehrbare Entscheidung. Behalten fügt genau diese Ausnahme hinzu und wiederholt den ganzen Durchlauf — ein wieder erlaubtes <iframe> lässt also nicht auch sein onload-Attribut durch. Ihr Eingabetext wird nie umgeschrieben, deshalb bleiben Rückgängig und Wiederholen günstig."
    },
    {
      "question": "Macht eine Tag-Whitelist die Ausgabe für sich genommen sicher?",
      "answer": "Nein, und das ist der Fehler der meisten Cleaner, die nur auf Tags schauen. Ein <a>-Tag auf jeder Whitelist kann weiterhin href=\"javascript:…\" tragen, deshalb werden hier Attribute und URL-Schemata getrennt geprüft. Ein Tag zu blockieren und seine Attribute unangetastet zu lassen ist kein Sanitizing."
    },
    {
      "question": "Welche URL-Schemata kommen durch?",
      "answer": "Nur die, die Sie ankreuzen. Alles andere wird aus href, src, srcset, action, formaction, poster, cite und xlink:href entfernt, auch Werte, die sich hinter Tabulatoren, Zeilenumbrüchen oder HTML-Entities verstecken. data: ist auf Rasterbilder beschränkt: eine SVG-Daten-URL führt beim direkten Öffnen ihr eigenes Skript aus und ist deshalb nie erlaubt."
    },
    {
      "question": "Ist die Live-Vorschau sicher?",
      "answer": "Ja. Sie läuft in einem iframe, dessen sandbox-Attribut die leere Zeichenkette ist, was Skripte, Formulare, Popups und Navigation blockiert, dazu eine No-Referrer-Richtlinie, damit kein überlebendes Bild verraten kann, von welcher Seite Sie kommen."
    },
    {
      "question": "Wird mein HTML irgendwohin geschickt?",
      "answer": "Nein. Der Sanitizer ist mit dieser Seite gebündeltes JavaScript und läuft in Ihrem Tab. Kein Upload, kein API-Aufruf und keine CDN-Anfrage — mit offenem Netzwerk-Tab nachprüfbar."
    },
    {
      "question": "Wie große Dokumente schafft es?",
      "answer": "Das Parsen ist ungefähr linear, ein paar Megabyte Markup sind auf einem normalen Laptop also deutlich unter einer Sekunde fertig; die gemessene Zeit steht nach jedem Lauf da. Die Syntaxhervorhebung im Ausgabefeld schaltet sich oberhalb von 200 KB ab, weil das Einfärben in dieser Größe mehr kostet als es bringt."
    }
  ],
  "footerTagline": "Ein HTML-Sanitizer mit echter Whitelist-Richtlinie und einem Entfernungsbericht, dem Sie widersprechen können — 100% lokal im Browser.",
  "footerCredit": "Teil der oLoveTools-Suite",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "Kopiert!",
  "contactForIdeas": "Kontakt für Ideen und Kommentare:"
};
