export default {
  "title": "EXIF-Clear",
  "description": "Inspectez et supprimez les métadonnées EXIF, GPS et autres de vos images localement. Protégez votre vie privée.",
  "btn_download_cleaned": "Télécharger les Images Nettoyées",
  "btn_download_zip": "Télécharger Nettoyées (.ZIP)",
  "label_upload_box": "Glissez-déposez des images ici ou cliquez pour parcourir",
  "label_files_loaded": "Fichiers Chargés",
  "btn_clear_all": "Effacer Tout",
  "label_options": "Niveau de Suppression",
  "opt_full_strip": "Nettoyage Complet (Recommandé - EXIF, GPS, XMP, Commentaires)",
  "opt_gps_only": "Uniquement la Localisation GPS",
  "opt_camera_only": "Uniquement Métadonnées de l'Appareil",
  "label_meta_details": "Propriétés des Métadonnées",
  "meta_make": "Fabricant Appareil",
  "meta_model": "Modèle Appareil",
  "meta_datetime": "Date/Heure de Prise",
  "meta_gps": "Coordonnées de Localisation GPS",
  "meta_software": "Logiciel d'Édition",
  "status_clean": "Propre / Sans Métadonnées",
  "status_has_meta": "Métadonnées Trouvées",
  "status_has_gps": "GPS Trouvé",
  "no_files_loaded": "Aucune image chargée",
  "preview_title": "Inspecteur de Métadonnées",
  "progress_clearing": "Suppression des métadonnées de l'image {current} sur {total}...",
  "seo_title": "EXIF-Clear | Supprimer Métadonnées EXIF & GPS de Photos en Ligne",
  "seo_description": "Supprimez les balises EXIF, GPS et autres métadonnées de vos images JPEG/PNG localement. Effacez la position et l'appareil pour votre vie privée.",
  "seoHeroTitle": "Supprimez les Données EXIF et GPS Hors Ligne",
  "seoHeroText": "Sécurisez vos clichés avant de les publier. EXIF-Clear analyse et nettoie les en-têtes de fichiers directement dans la mémoire de votre navigateur.",
  "seoHeroList": [
    "Identifiez les coordonnées géographiques, les boîtiers et les paramètres de prise de vue",
    "Efface tous les segments incluant EXIF, XMP et blocs IPTC Photoshop",
    "100% sécurisé côté client, pas de transfert réseau ni de serveurs"
  ],
  "seoBrowserSpeedTitle": "Filtrage Binaires en Temps Réel",
  "seoBrowserSpeedText": "En manipulant les octets bruts via ArrayBuffer, nous éliminons les métadonnées en une fraction de seconde tout en préservant la qualité d'image d'origine.",
  "seoUseCaseTitle": "Essentiel pour Photographes et Blogueurs",
  "seoUseCaseText": "Les photos mobiles intègrent vos coordonnées GPS précises. Nettoyez les fichiers avant de les charger sur vos boutiques ou galeries.",
  "seoPrivacyTitle": "Confidentialité Locale Garantie",
  "seoPrivacyText": "Vos visuels ne transitent jamais sur internet. Tout le traitement se déroule localement dans votre onglet de navigation.",
  "faqTitle": "Foire Aux Questions",
  "faq": [
    {
      "question": "Pourquoi supprimer les métadonnées de mes photos ?",
      "answer": "Les smartphones intègrent des coordonnées GPS, des dates et des identifiants dans les fichiers, révélant parfois votre domicile lorsque vous partagez l'image."
    },
    {
      "question": "Est-ce que cela dégrade la qualité des images ?",
      "answer": "Non ! Nous modifions uniquement les en-têtes binaires (APP1/ancillary). Le flux de pixels (SOS/IDAT) reste intact, préservant 100% de la qualité d'image d'origine."
    },
    {
      "question": "Quels formats de fichiers sont acceptés ?",
      "answer": "EXIF-Clear supprime les données des formats JPEG/JPG, PNG et WebP de façon entièrement déconnectée."
    },
    {
      "question": "Comment les coordonnées GPS sont-elles lues ?",
      "answer": "Nous analysons le segment APP1 et localisons la structure TIFF. Si un dossier GPS est présent, nous en extrayons la latitude et la longitude."
    }
  ],
  "footerTagline": "Utilitaire gratuit, privé et local pour nettoyer les métadonnées d'images.",
  "footerCredit": "Fait partie de la suite oLoveTools"
};
