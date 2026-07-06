export default {
  "title": "EXIF Cleaner",
  "description": "Prüfen und entfernen Sie EXIF-, GPS- und Metadaten aus Bildern lokal in Ihrem Browser. Schützen Sie Ihre Privatsphäre.",
  "btn_download_cleaned": "Bereinigte Bilder herunterladen",
  "btn_download_zip": "Bereinigt herunterladen (.ZIP)",
  "label_upload_box": "Bilder hierher ziehen oder klicken zum Auswählen",
  "label_files_loaded": "Geladene Dateien",
  "btn_clear_all": "Alle leeren",
  "label_options": "Entfernungsstufe",
  "opt_full_strip": "Vollständig bereinigen (Empfohlen - EXIF, GPS, XMP, Kommentare)",
  "opt_gps_only": "Nur GPS-Standort",
  "opt_camera_only": "Nur Kamera- & Gerätedaten",
  "label_meta_details": "Metadaten-Eigenschaften",
  "meta_make": "Kamerahersteller",
  "meta_model": "Kameramodell",
  "meta_datetime": "Aufnahmedatum/-zeit",
  "meta_gps": "GPS-Koordinaten",
  "meta_software": "Bearbeitungssoftware",
  "status_clean": "Bereinigt / Keine Metadaten",
  "status_has_meta": "Metadaten gefunden",
  "status_has_gps": "GPS gefunden",
  "no_files_loaded": "Bisher keine Bilder geladen",
  "preview_title": "Metadaten-Inspektor",
  "progress_clearing": "Entferne Metadaten aus Bild {current} von {total}...",
  "seo_title": "EXIF Cleaner | Kostenloses Tool zum Entfernen von Bild-Metadaten & GPS online",
  "seo_description": "Entfernen Sie EXIF-, GPS- und Metadaten-Tags aus JPEG/PNG-Bildern lokal und online. Bereinigen Sie Kamera- und Positionsdaten.",
  "seoHeroTitle": "GPS- und Kamera-EXIF-Daten offline löschen",
  "seoHeroText": "Schützen Sie Ihre Privatsphäre vor dem Teilen von Fotos. EXIF Cleaner filtert und entfernt Metadaten-Header direkt im RAM Ihres Browsers.",
  "seoHeroList": [
    "GPS-Koordinaten, Kameramodelle und Belichtungsdaten auslesen",
    "Entfernt EXIF-, XMP- und Photoshop-IPTC-Metadatenblöcke",
    "100 % clientseitige Sicherheit - keine Server-Uploads nötig"
  ],
  "seoBrowserSpeedTitle": "Echtzeit-Byte-Filterung im Browser",
  "seoBrowserSpeedText": "Indem wir die Rohdaten der Datei in ArrayBuffers verarbeiten, entfernen wir Metadatenblöcke sofort, ohne die Bildqualität durch erneute Komprimierung zu beeinträchtigen.",
  "seoUseCaseTitle": "Wichtig für Fotografen, Blogger und Smartphone-Nutzer",
  "seoUseCaseText": "Aufgenommenen Fotos auf Handys enthalten oft exakte GPS-Koordinaten. Löschen Sie diese, bevor Sie Bilder online stellen.",
  "seoPrivacyTitle": "Garantiert lokale Verarbeitung",
  "seoPrivacyText": "Ihre Quellbilder werden niemals ins Internet übertragen. Die Verarbeitung findet rein lokal in Ihrem aktuellen Browser-Tab statt.",
  "faqTitle": "Häufig gestellte Fragen (FAQ)",
  "faq": [
    {
      "question": "Warum sollte ich Metadaten aus meinen Fotos löschen?",
      "answer": "Smartphones speichern GPS-Koordinaten und Kameradaten in den Bilddateien, die beim Teilen den genauen Standort Ihres Zuhauses verraten können."
    },
    {
      "question": "Wird die Bildqualität durch das Tool verringert?",
      "answer": "Nein! Wir verändern nur die binären Metadaten-Header (APP1/Ancillary-Chunks). Der komprimierte Pixeldatenstrom (SOS/IDAT) bleibt unberührt, die Qualität bleibt 100% erhalten."
    },
    {
      "question": "Welche Bildformate werden unterstützt?",
      "answer": "EXIF Cleaner bereinigt Metadaten aus Standard-JPEG/JPG-, PNG- und WebP-Dateien komplett offline."
    },
    {
      "question": "Wie werden die GPS-Daten ausgelesen?",
      "answer": "Wir scannen das APP1-Segment nach der TIFF-Struktur. Falls ein GPS-Verzeichnis existiert, lesen wir die Latitude- und Longitude-Werte aus."
    }
  ],
  "footerTagline": "Kostenloses, privates und offline nutzbares Tool zur Reinigung von Bild-Metadaten.",
  "footerCredit": "Teil der oLoveTools-Suite"
};
