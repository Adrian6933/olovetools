export default {
  "title": "UUID-Generator",
  "badge": "Eindeutige Bezeichner",
  "description": "Erzeuge UUID v1, v3, v4, v5, v6 und v7 sowie ULID, NanoID und MongoDB-ObjectId — stapelweise, in genau der Form, die dein Code erwartet, und ohne eine einzige Netzwerkanfrage.",
  "seo_title": "UUID-Generator | v4, v7, v5, ULID und NanoID im Stapel",
  "seo_description": "Kostenloser Online-UUID-Generator: v1, v3, v4, v5, v6, v7, nil und max sowie ULID, NanoID und ObjectId. Große Stapel, frei konfigurierbare Ausgabe und ein Inspektor bis auf Byte-Ebene, komplett im Browser.",
  "groupUuid": "UUIDs nach RFC 9562",
  "groupOther": "Andere Bezeichner",
  "kindHelp_v4": "122 Bit Entropie aus der kryptografischen Zufallsquelle des Browsers. Die Standardwahl, wenn etwas einfach nur eindeutig sein muss.",
  "kindHelp_v7": "Ein 48-Bit-Unix-Zeitstempel in Millisekunden, gefolgt von Zufallsbits, mit Zähler — so bleiben Bezeichner aus derselben Millisekunde in der richtigen Reihenfolge. Die moderne Wahl für Datenbankschlüssel.",
  "kindHelp_v1": "Zeitstempel plus Knotenkennung. Dieses Werkzeug nutzt einen Zufallsknoten mit gesetztem Multicast-Bit, deine echte MAC-Adresse wird also nie preisgegeben.",
  "kindHelp_v6": "Die Felder von v1, neu geordnet, sodass der Zeitstempel vorn steht. Sortiert sich chronologisch als reine Bytefolge — anders als v1.",
  "kindHelp_v3": "MD5 aus Namensraum und Name. Dasselbe Paar ergibt immer dieselbe UUID: ein Name pro Zeile ergibt einen Stapel.",
  "kindHelp_v5": "SHA-1 aus Namensraum und Name. Deterministisch wie v3, aber mit der stärkeren Prüfsumme. Ein Name pro Zeile.",
  "kindHelp_nil": "Alle 128 Bit auf null: die kanonische UUID für „kein Wert“.",
  "kindHelp_max": "Alle 128 Bit auf eins: die Obergrenze des UUID-Raums, gern als Wächterwert genutzt.",
  "kindHelp_ulid": "26 Zeichen in Crockford-Base32: 48 Bit Zeit und 80 Bit Zufall, alphabetisch sortierbar und ohne Groß-/Kleinschreibung.",
  "kindHelp_nanoid": "21 URL-sichere Zeichen, rund 126 Bit Entropie. Kürzer als eine UUID und ohne Maskierung in einer URL verwendbar.",
  "kindHelp_objectid": "Der 12-Byte-Bezeichner, den MongoDB an jedes Dokument hängt: 4 Byte Zeit, 5 Byte Zufall, 3 Byte Zähler.",
  "label_count": "Wie viele",
  "hint_big_batch": "Über 10 000 endet der Schieberegler; gib die genaue Zahl ein. Die Vorschau bleibt bei 300 Zeilen — Kopieren und Herunterladen umfassen immer den ganzen Stapel.",
  "label_namespace": "Namensraum",
  "label_names": "Namen — einer pro Zeile",
  "hint_deterministic": "Derselbe Namensraum und derselbe Name ergeben immer denselben Bezeichner — genau dafür gibt es v3 und v5. Für einen Stapel brauchst du einen Stapel Namen.",
  "button_generate": "Erzeugen",
  "button_working": "Arbeitet…",
  "tooltip_undo": "Vorheriger Stapel (Strg+Z)",
  "tooltip_redo": "Nächster Stapel (Strg+Umschalt+Z)",
  "button_clear": "Alles löschen",
  "error_invalid_namespace": "Dieser Namensraum ist keine gültige UUID.",
  "error_clipboard": "Der Browser hat den Zugriff auf die Zwischenablage verweigert. Nutze stattdessen den Download.",
  "error_generic": "Beim Erzeugen ist etwas schiefgegangen. Versuch es mit einem kleineren Stapel.",
  "error_unrecognised": "Das sieht nicht nach einem Bezeichner aus, den dieses Werkzeug kennt.",
  "stat_count": "erzeugt",
  "stat_time": "Millisekunden",
  "stat_rate": "pro Sekunde",
  "stat_duplicates": "Duplikate",
  "empty_state": "Es wurde noch nichts erzeugt. Typ wählen, Menge festlegen, auf Erzeugen drücken.",
  "label_showing": "{shown} von {total} angezeigt",
  "label_uuids_generated": "Bezeichner",
  "tooltip_copy": "In die Zwischenablage kopieren",
  "button_copy_all": "Alle kopieren",
  "button_copied_all": "Kopiert",
  "label_format": "Form der Ausgabe",
  "placeholder_prefix": "Präfix",
  "placeholder_suffix": "Suffix",
  "label_inspect": "Prüfen und bauen",
  "button_load_list": "Liste aus einer Datei laden",
  "button_blank": "Mit 16 leeren Bytes beginnen",
  "placeholder_inspect": "Beliebige UUID, ULID oder ObjectId einfügen",
  "field_timestamp": "Zeitstempel",
  "byte_version": "Byte 6 — Versions-Nibble",
  "byte_variant": "Byte 8 — Variantenbits",
  "button_now": "jetzt",
  "button_reroll": "Die letzten 8 Bytes neu würfeln",
  "button_revert": "zurücksetzen",
  "button_copy": "Kopieren",
  "button_use_crafted": "Als Ausgabe übernehmen",
  "imported_summary": "{count} Bezeichner in der Liste aus {from} gefunden.",
  "imported_unique": "{n} eindeutig",
  "imported_inspect": "Den ersten prüfen",
  "nextStepTitle": "Weitermachen",
  "nextStepHint": "Die Liste kommt mit — kein Download, kein erneutes Hochladen",
  "nextDiff": "Zwei Stapel vergleichen",
  "nextHash": "Prüfsumme bilden",
  "nextJson": "Als JSON öffnen",
  "nextRegex": "Muster testen",
  "nextZip": "Als ZIP packen",
  "howItWorksTitle": "So funktioniert es",
  "step1Title": "Typ wählen",
  "step1Text": "Elf Stück, vom schlichten v4 über das zeitlich sortierte v7 bis zu ULID oder einer Mongo-ObjectId.",
  "step2Title": "Stapel einstellen",
  "step2Text": "Wie viele und in welcher Form: Groß-/Kleinschreibung, Bindestriche, Klammern, Präfix, Exportformat.",
  "step3Title": "Auf Erzeugen drücken",
  "step3Text": "Vorher läuft nichts. Der Stapel entsteht in einem Worker und wird auf die Zehntelmillisekunde genau gemessen.",
  "step4Title": "Mitnehmen",
  "step4Text": "Kopieren, als txt, csv, json oder SQL herunterladen oder die Liste direkt an ein anderes Werkzeug schicken.",
  "features": [
    {
      "title": "Elf Bezeichnertypen",
      "text": "UUID v1, v3, v4, v5, v6, v7, nil und max, dazu ULID, NanoID und MongoDB-ObjectId."
    },
    {
      "title": "Zeitlich sortiert und monoton",
      "text": "v7, v6 und ULID führen einen Zähler, damit Bezeichner aus derselben Millisekunde ihre Reihenfolge behalten."
    },
    {
      "title": "Liest sie auch wieder",
      "text": "Füge einen Bezeichner ein und sieh Version, Variante, Zeitstempel, Knoten und Rohbytes — und ändere ein einzelnes Nibble."
    },
    {
      "title": "Abseits des Hauptthreads",
      "text": "Stapel laufen in einem Web Worker, samt exakter Laufzeit und einer Duplikatsuche über den gesamten Stapel."
    },
    {
      "title": "Ausgabe nach deinem Bedarf",
      "text": "Schreibweise, Bindestriche, geschweifte Klammern, urn:uuid:, Anführungszeichen, Präfix und Suffix — als txt, csv, json oder SQL."
    },
    {
      "title": "Nichts verlässt den Tab",
      "text": "Entropie aus Web Crypto, kein einziger Netzwerkaufruf und nichts, was zwischen Besuchen gespeichert bleibt."
    }
  ],
  "seoHeroTitle": "Jedes Bezeichnerformat, lokal erzeugt",
  "seoHeroText": "Die meisten Generatoren liefern ein v4 und hören da auf. Dieser deckt die komplette Familie aus RFC 9562 ab, dazu die sortierbaren Formate, die sie in der Praxis abgelöst haben, und die Bezeichner anderer Ökosysteme — mit einer Ausgabe, die genau so aussieht, wie deine Migration, deine Seed-Datei oder deine Test-Fixture sie braucht.",
  "seoHeroList": [
    "11 Bezeichnertypen",
    "Stapel bis 100 000",
    "Inspektor auf Byte-Ebene",
    "Keine Netzwerkaufrufe"
  ],
  "seoBrowserSpeedTitle": "Sortierbar von Haus aus",
  "seoBrowserSpeedText": "Zufällige v4-Schlüssel verteilen Schreibzugriffe über den gesamten B-Baum-Index. v7, v6 und ULID stellen die Zeit nach vorn, sodass neue Zeilen am Ende des Index landen statt überall — und dieses Werkzeug führt innerhalb jeder Millisekunde einen Zähler, damit die Reihenfolge auch in einer engen Schleife hält.",
  "seoSecondaryTitle": "Gebaut für die Arbeit nach dem Bezeichner",
  "seoUseCaseTitle": "Seed-Daten, Fixtures und Migrationen",
  "seoUseCaseText": "Erzeuge hunderttausend Schlüssel, exportiere sie direkt als SQL-INSERT oder JSON-Array und reiche die Liste an das Vergleichs-, Prüfsummen- oder Archivwerkzeug weiter, ganz ohne Download-Ordner.",
  "seoPrivacyTitle": "Lokal, und nachprüfbar",
  "seoPrivacyText": "Die Entropie stammt aus der Web-Crypto-API in deinem Tab. Kein API-Aufruf, kein CDN-Abruf, kein nachgeladenes WebAssembly: Das Hashing für v3 und v5 steckt in der Seite selbst, das Werkzeug funktioniert also auch offline.",
  "seoKeywordsTitle": "Schlüsselwörter",
  "seoKeywords": [
    "uuid-generator",
    "zufälliges uuid v4",
    "zeitlich sortiertes uuid v7",
    "benanntes uuid v5",
    "guid-generator",
    "ulid-generator",
    "kurzes nanoid",
    "uuid stapelweise",
    "uuid-decoder"
  ],
  "faqTitle": "Häufige Fragen",
  "faq": [
    {
      "question": "Welche UUID-Version soll ich nehmen?",
      "answer": "v4, wenn nur Eindeutigkeit zählt. v7, wenn der Bezeichner Primärschlüssel wird, weil sein führender Zeitstempel die Index-Schreibzugriffe beieinanderhält. v5, wenn dieselbe Eingabe immer denselben Bezeichner ergeben muss."
    },
    {
      "question": "Warum sind zehn v5-UUIDs alle gleich?",
      "answer": "Weil genau das v5 bedeutet: ein Namensraum plus ein Name ergibt einen Bezeichner. Für zehn verschiedene brauchst du zehn verschiedene Namen, einen pro Zeile."
    },
    {
      "question": "Worin unterscheiden sich v7 und ULID?",
      "answer": "Beide sind ein 48-Bit-Millisekunden-Zeitstempel plus Zufall. v7 ist eine echte UUID und passt in eine UUID-Spalte; ULID besteht aus 26 Base32-Zeichen, ist kürzer zu lesen und ignoriert Groß-/Kleinschreibung, ist aber keine UUID."
    },
    {
      "question": "Sind die Bezeichner kryptografisch sicher?",
      "answer": "Der Zufall kommt aus crypto.getRandomValues, derselben Quelle, aus der der Browser sein eigenes Schlüsselmaterial zieht. Bedenke: v1 und v7 legen ihre Entstehungszeit absichtlich offen, sie sind also kein Geheimnis."
    },
    {
      "question": "Wie viele kann ich auf einmal erzeugen?",
      "answer": "Bis zu 100 000 pro Stapel. Die Liste zeigt die ersten 300 Zeilen, damit die Seite flüssig bleibt; Kopieren, Herunterladen und die Übergabe-Schaltflächen arbeiten immer mit dem vollständigen Stapel."
    },
    {
      "question": "Wird irgendetwas an einen Server geschickt?",
      "answer": "Nein. Erzeugen, Prüfen und Exportieren passieren im Browser, und die Seite stellt währenddessen keine einzige Anfrage."
    }
  ],
  "footerTagline": "UUID v1 bis v7, ULID, NanoID und ObjectId — erzeugt, geprüft und exportiert vollständig in deinem Browser.",
  "footerCredit": "Teil der oLoveTools-Suite",
  "emailCopied": "Kopiert!",
  "contactForIdeas": "Kontakt für Ideen und Anmerkungen:",
  "emailAddress": "adrian.contact.me.69@gmail.com"
};
