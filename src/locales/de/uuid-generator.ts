export default {
  "title": "UUID Generator",
  "seo_title": "UUID Generator | Kostenloser Online-UUID v4 & v5 Generator",
  "seo_description": "Generiere zufällige UUIDs (v4) und benannte UUIDs (v5) als Massengenerierung bis zu 500 gleichzeitig 100% lokal in deinem Browser mit der Web Crypto API. Kostenloser Online-UUID-Generator.",
  "seoHeroTitle": "UUID v4 & v5 Massengenerator",
  "seoHeroText": "Generiere sofort bis zu 500 zufällige UUIDs (Version 4) oder benannte UUIDs (Version 5 mit Namespace) mit der nativen Web Crypto API des Browsers. Die gesamte Generierung erfolgt lokal — keine Serveraufrufe, kein Tracking.",
  "label_version": "UUID-Version",
  "option_v4": "v4 (Zufällig)",
  "option_v5": "v5 (Benannt + SHA-1)",
  "label_count": "Anzahl",
  "label_namespace": "Namespace-UUID",
  "label_name": "Name",
  "label_uuids_generated": "Generierte UUIDs",
  "label_no_uuids": "Noch keine UUIDs generiert. Passe die Optionen oben an.",
  "error_invalid_namespace": "Ungültiges Namespace-UUID-Format. Verwende das Standard-UUID-Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "error_fix_namespace": "Bitte korrigiere die Namespace-UUID, um v5-UUIDs zu generieren.",
  "button_regenerate": "Neu generieren",
  "button_copied_all": "Alle kopiert!",
  "button_download": ".txt herunterladen",
  "button_reset": "Zurücksetzen",
  "tooltip_copy": "In die Zwischenablage kopieren",
  "seoBrowserSpeedTitle": "Unterstützt durch die Web Crypto API",
  "seoBrowserSpeedText": "UUIDs werden mit der nativen crypto.randomUUID()-Funktion des Browsers für v4 und crypto.subtle.digest('SHA-1') für v5 generiert, was kryptographische Qualität in Hardware-Geschwindigkeit ohne Serververarbeitung gewährleistet.",
  "seoUseCaseTitle": "Massengenerierung",
  "seoUseCaseText": "Generiere bis zu 500 UUIDs mit einem einzigen Klick. Perfekt für Datenbank-Seeding, Testdatengenerierung, eindeutige Session-IDs oder jedes Szenario, das mehrere eindeutige Identifikatoren gleichzeitig erfordert.",
  "seoPrivacyTitle": "100% privat & sicher",
  "seoPrivacyText": "Keine Datenbanken, Tracking oder Netzwerk-Uploads. Die gesamte UUID-Generierung erfolgt im Krypto-Subsystem deines Browsers. Deine Daten verlassen niemals dein Gerät.",
  "seoKeywords": [
    "uuid generator",
    "uuid v4",
    "uuid v5",
    "guid generator",
    "zufällige uuid",
    "massen-uuid",
    "eindeutiger identifikator"
  ],
  "faqTitle": "Häufig gestellte Fragen",
  "faq": [
    {
      "question": "Was ist der Unterschied zwischen UUID v4 und v5?",
      "answer": "UUID v4 wird mit Zufallszahlen generiert, was jede UUID eindeutig und unvorhersehbar macht. UUID v5 wird durch Hashing einer Namespace-UUID und einer Namenszeichenkette mit SHA-1 generiert, was bedeutet, dass derselbe Namespace+Name immer dieselbe UUID erzeugt."
    },
    {
      "question": "Kann ich mehrere UUIDs gleichzeitig generieren?",
      "answer": "Ja. Verwende den Anzahl-Schieberegler, um anywhere von 1 bis 500 UUIDs in einem einzigen Batch zu generieren. Alle UUIDs werden sofort generiert und können einzeln oder alle gleichzeitig kopiert werden."
    },
    {
      "question": "Sind diese UUIDs kryptographisch sicher?",
      "answer": "Ja. UUIDs der Version 4 verwenden die native crypto.randomUUID()-Funktion des Browsers, die kryptographische Zufälligkeit bietet. UUIDs der Version 5 verwenden die SHA-1-Digest-Funktion der Web Crypto API."
    }
  ],
  "footerTagline": "Schneller, sicherer UUID v4 und v5 Massengenerator, unterstützt durch die Web Crypto API — 100% lokal in deinem Browser.",
  "footerCredit": "Teil der oLoveTools-Suite",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "Kopiert!",
  "contactForIdeas": "Kontakt für Ideen und Kommentare:",
  "button_copy_all": "Alles kopieren"
};
