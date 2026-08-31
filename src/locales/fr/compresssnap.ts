export default {
  "title": "CompressSnap",
  "badge": "Compression d'images",
  "description": "Compressez JPEG, PNG, WebP, AVIF et HEIC dans votre navigateur — à la qualité de votre choix ou à la taille que vous devez respecter — et voyez exactement ce que ça a coûté.",
  "seo_title": "CompressSnap | Compressez vos images à une taille cible",
  "seo_description": "Compressez et redimensionnez des images JPEG, PNG, WebP, AVIF, HEIC et TIFF. Visez un budget en kilo-octets, réduisez la palette d'un PNG, convertissez entre formats et lisez la perte de qualité SSIM mesurée sur chaque fichier. Tourne hors du fil principal et n'envoie rien.",
  "dropzonePrompt": "Déposez des images ici, ou cliquez pour les choisir",
  "dropzoneSubtitle": "JPEG, PNG, WebP, AVIF, GIF, BMP, TIFF et le HEIC de l'iPhone. Les images très grandes sont plafonnées à ce qu'un canvas de navigateur peut contenir.",
  "rejectedFiles": "{n} fichier(s) n'étaient pas des images et ont été écartés.",
  "compressBtn": "Compresser {n}",
  "recompressBtn": "Réglages modifiés — relancez",
  "downloadBtn": "Télécharger",
  "downloadAllBtn": "Tout télécharger (ZIP)",
  "clearBtn": "Tout effacer",
  "removeBtn": "Retirer",
  "closeBtn": "Fermer",
  "statusQueued": "en attente",
  "statusDecoding": "décodage…",
  "statusCompressing": "compression…",
  "statusSkipped": "déjà plus légère que ce qu'on pouvait en faire",
  "statusError": "échec",
  "workerOn": "hors du fil principal",
  "workerOff": "fil principal",
  "workerHint": "Où se fait l'encodage. Hors du fil principal, la page reste réactive pendant le lot.",
  "attemptsHint": "Encodages nécessaires pour tenir dans le budget",
  "originalSize": "Taille d'origine",
  "compressedSize": "Taille compressée",
  "savings": "Économisé",
  "avgSsim": "SSIM moyen",
  "presetLight": "Légère",
  "presetBalanced": "Équilibrée",
  "presetWeb": "Pour le web",
  "presetStrong": "Forte",
  "formatLabel": "Format de sortie",
  "formatOriginal": "Garder",
  "avifUnsupported": "Ce navigateur ne sait pas écrire l'AVIF, il n'est donc pas proposé.",
  "qualityLabel": "Qualité",
  "qualityHint": "Moins de qualité, fichier plus léger. La perte mesurée s'affiche sur chaque résultat.",
  "qualityFromBudget": "La qualité est recherchée pour tenir dans le budget de taille ci-dessous.",
  "pngColorsLabel": "Couleurs du PNG",
  "pngColorsAll": "toutes",
  "ditherLabel": "Tramer les dégradés",
  "pngNote": "Le PNG n'a pas de réglage de qualité — tous les encodeurs l'ignorent. Ce qui l'allège, c'est de réduire la palette, et sur les aplats, captures d'écran et logos cela ne se voit pas.",
  "budgetLabel": "Budget de taille",
  "budgetToggle": "Faire tenir chaque image sous une taille donnée",
  "budgetHint": "La qualité est cherchée par dichotomie jusqu'à ce que ça rentre.",
  "budgetPngNote": "Un budget en octets a besoin d'une qualité à chercher ; le PNG n'en a pas. Utilisez la palette.",
  "resizeModeLabel": "Redimensionnement",
  "resizeNone": "Aucun",
  "resizeLongEdge": "Grand côté",
  "resizeScale": "Échelle",
  "resizeCustom": "Personnalisé",
  "longEdgeLabel": "Plus grand côté (px)",
  "longEdgeHint": "N'agrandit jamais — une image plus petite est laissée telle quelle.",
  "scaleLabel": "Échelle",
  "widthLabel": "Largeur (px)",
  "heightLabel": "Hauteur (px)",
  "keepAspectLabel": "Conserver les proportions",
  "measureLabel": "Mesurer la perte de qualité (SSIM)",
  "measureHint": "Décode le résultat et le compare. Ajoute un peu de temps par image.",
  "bandIdentical": "Indiscernable",
  "bandExcellent": "Excellente",
  "bandGood": "Bonne",
  "bandFair": "Correcte",
  "bandPoor": "Perte visible",
  "compareBtn": "Aperçu & Comparer",
  "originalLabel": "Original",
  "compressedLabel": "Compressé",
  "nextStepTitle": "Continuer",
  "nextStepHint": "L'image vous suit — sans téléchargement ni renvoi",
  "nextCrop": "La recadrer",
  "nextWatermark": "Y mettre un filigrane",
  "nextExif": "Vérifier ses métadonnées",
  "nextZip": "La compresser en ZIP",
  "howItWorksTitle": "Comment ça marche",
  "step1Title": "Déposez les photos",
  "step1Text": "Collez-les, choisissez-les ou faites-les glisser. Elles se mettent en file : rien n'est encodé avant que vous n'appuyiez, donc un dossier de quarante ne bloque pas l'onglet.",
  "step2Title": "Choisissez le compromis",
  "step2Text": "Une qualité, une taille en kilo-octets à ne pas dépasser, un format, un grand côté maximum. Le PNG reçoit une palette au lieu d'un curseur de qualité.",
  "step3Title": "Laissez tourner",
  "step3Text": "L'encodage se fait hors du fil principal, si bien que la page reste réactive pendant que le lot avance.",
  "step4Title": "Récupérez les fichiers",
  "step4Text": "Un par un, tous dans un ZIP, ou directement dans l'outil suivant sans télécharger.",
  "features": [
    {
      "title": "Encode hors du fil principal",
      "text": "Un Web Worker avec OffscreenCanvas fait le travail et les bitmaps sont transférés plutôt que copiés : un lot de photos de téléphone ne gèle plus l'onglet où il tourne."
    },
    {
      "title": "Compresser à une taille, pas au jugé",
      "text": "Donnez-lui un budget en kilo-octets et il cherche la qualité par dichotomie jusqu'à ce que le fichier rentre, puis indique la qualité retenue et le nombre d'essais."
    },
    {
      "title": "La perte est un chiffre",
      "text": "Chaque résultat est redécodé et comparé à sa source en SSIM : « qualité 70 » cesse d'être une impression et devient 0,981 à côté du poids que cela a coûté."
    },
    {
      "title": "Un PNG qui maigrit vraiment",
      "text": "Réduction de palette par median-cut avec tramage optionnel. C'est le seul réglage qu'ait un PNG — l'argument de qualité est ignoré par tous les encodeurs — et il paie sur les captures, les logos et les aplats. Une photo enregistrée en PNG gagne plutôt à passer en JPEG ou WebP, et l'outil le dit au lieu de vous rendre un fichier plus lourd."
    },
    {
      "title": "Les formats que vous avez vraiment",
      "text": "Le HEIC de l'iPhone et le TIFF sont convertis en entrée, l'AVIF et le WebP écrits en sortie quand le navigateur le peut, et la rotation EXIF est appliquée pour que rien n'arrive couché."
    },
    {
      "title": "Rien ne quitte l'onglet",
      "text": "Décodage, encodage, palette et mesure tournent dans votre navigateur. Pas d'API, pas d'envoi, pas de compte."
    }
  ],
  "seoHeroTitle": "Le compresseur d'images qui vous dit ce que la compression a coûté",
  "seoHeroText": "CompressSnap lit le JPEG, le PNG, le WebP, l'AVIF, le GIF, le BMP, le TIFF et les HEIC que produit un iPhone, et réécrit en JPEG, PNG, WebP et AVIF. Il atteint un budget en octets en cherchant la qualité qui convient, allège les PNG en réduisant leur palette au lieu de faire semblant qu'un curseur de qualité y change quelque chose, et mesure chaque résultat face à sa source pour rendre visible le compromis choisi.",
  "seoHeroList": [
    "Aucune inscription requise",
    "Compressez plusieurs images à la fois",
    "Convertissez en WebP, JPG ou PNG"
  ],
  "seoBrowserSpeedTitle": "Mesuré, pas supposé",
  "seoBrowserSpeedText": "Chaque fichier compressé est redécodé et comparé à ce qui est entré. Le chiffre est le SSIM, la mesure qui suit ce que les gens remarquent vraiment, et il se lit juste à côté du poids du fichier pour pouvoir peser l'un contre l'autre.",
  "seoSecondaryTitle": "Pourquoi compresser vos images ?",
  "seoUseCaseTitle": "Les cas pénibles, traités",
  "seoUseCaseText": "Un HEIC sorti d'un iPhone, une photo verticale dont la rotation vit dans une balise EXIF, une capture PNG qui grossit en passant par le JPEG, une image de 48 mégapixels qui ne tient pas dans un canvas : ce sont les cas normaux, et chacun est converti, pivoté, signalé ou plafonné au lieu d'échouer en silence.",
  "seoPrivacyTitle": "Entièrement dans votre navigateur",
  "seoPrivacyText": "Il n'y a aucune API derrière cette page. Les décodeurs, l'encodeur, la réduction de palette et la mesure de qualité sont du JavaScript exécuté dans votre onglet : la photo d'un client non encore publiée ne quitte jamais votre machine.",
  "seoKeywordsTitle": "Mots-clés",
  "seoKeywords": [
    "compresseur d'images",
    "compresser jpeg en ligne",
    "compresser png",
    "convertir en webp",
    "convertir en avif",
    "heic en jpg",
    "compresser image à 200ko",
    "réduire la taille d'une image",
    "compression par lots",
    "redimensionner des images en ligne",
    "réduction de palette png",
    "qualité d'image ssim"
  ],
  "faqTitle": "Foire aux questions",
  "faq": [
    {
      "question": "Mes données sont-elles envoyées à un serveur ?",
      "answer": "Non. Le décodage, l'encodage, la réduction de palette et la mesure de qualité fonctionnent dans votre navigateur. Une image ouverte ici ne quitte pas l'onglet."
    },
    {
      "question": "Pourquoi compresser un PNG ne fait-il rien ?",
      "answer": "Parce que le PNG est sans perte et que tous les encodeurs ignorent l'argument de qualité — afficher un curseur de qualité pour un PNG, comme avant, était trompeur. Ce qui l'allège, c'est d'utiliser moins de couleurs, donc pour le PNG vous avez un contrôle de palette. Sur les captures, logos et aplats, descendre à 64 ou 128 couleurs est invisible et divise souvent le fichier par deux."
    },
    {
      "question": "Peut-il compresser à une taille précise ?",
      "answer": "Oui. Activez le budget de taille, saisissez un nombre en kilo-octets, et l'encodeur cherche la qualité par dichotomie jusqu'à ce que le fichier rentre, en huit essais au maximum. Chaque résultat indique la qualité retenue et le nombre d'encodages nécessaires."
    },
    {
      "question": "Qu'est-ce que le SSIM et pourquoi s'en soucier ?",
      "answer": "La similarité structurelle : un nombre de 0 à 1 disant à quel point l'image compressée ressemble à l'originale, pondéré comme l'est la vision humaine. Il est mesuré en redécodant le résultat et en le comparant pixel par pixel. Au-dessus de 0,98 presque personne ne voit la différence ; en dessous de 0,95 les artefacts commencent à apparaître. Cela transforme « est-ce que la qualité 70 rend bien ? » en quelque chose de lisible à l'écran."
    },
    {
      "question": "Accepte-t-il les photos de mon iPhone ?",
      "answer": "Oui. Les HEIC et HEIF sont convertis en entrée, tout comme les TIFF, et la rotation que l'iPhone stocke dans la balise EXIF est appliquée pour qu'une photo verticale n'arrive pas couchée. L'ancienne version refusait le HEIC dès le sélecteur de fichiers."
    },
    {
      "question": "Pourquoi une de mes images est-elle revenue inchangée ?",
      "answer": "Parce que la compresser l'aurait alourdie. Cela arrive surtout avec les captures et les graphiques à aplats passés en JPEG haute qualité. Plutôt que de vous rendre un fichier moins bon, l'outil le signale et garde l'original."
    },
    {
      "question": "Les données EXIF sont-elles supprimées ?",
      "answer": "Oui — réencoder via un canvas supprime tous les blocs de métadonnées, coordonnées GPS et informations d'appareil comprises. Le seul élément qui compte visuellement, la balise d'orientation, est appliqué aux pixels au préalable pour que l'image reste droite."
    },
    {
      "question": "Un gros lot fige-t-il la page ?",
      "answer": "Non. L'encodage tourne dans un Web Worker avec OffscreenCanvas et les données d'image sont transférées plutôt que copiées, donc la page reste réactive pendant que la file avance. Deux images sont encodées à la fois, ce qui est rapide sans garder plusieurs images pleine résolution en mémoire en même temps."
    }
  ],
  "footerTagline": "Compressez, redimensionnez et convertissez des images dans votre navigateur, avec la perte de qualité mesurée.",
  "footerCredit": "Fait partie de la suite oLoveTools",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "E-mail copié dans le presse-papiers !",
  "contactForIdeas": "Contact pour idées et retours :",
  "presetsLabel": "Préréglages rapides",
  "presetExtreme": "Extrême",
  "summaryTitle": "Résultat estimé",
  "scaleHint": "Réduit la largeur et la hauteur de l'image.",
  "followGlobalBtn": "Utiliser les réglages globaux",
  "statusDone": "Succès",
  "individualSettings": "Paramètres personnalisés",
  "globalSettings": "Paramètres globaux",
  "originalFormat": "Format d'origine",
  "compareTitle": "Comparaison visuelle avant / après",
  "privacyPolicy": "Politique de Confidentialité",
  "termsOfService": "Conditions d'Utilisation",
  "cookiePolicy": "Politique de Cookies",
  "privacyContent": "Votre vie privée est importante pour nous.\n\nNous ne collectons que les informations nécessaires à la fourniture de notre service. Cela inclut des données techniques sur votre navigateur et votre appareil pour garantir le bon fonctionnement de l'outil.\n\nNous ne stockons, ne suivons et n'analysons jamais vos images. Tout le traitement se fait localement dans votre navigateur, garantissant que vos données ne quittent jamais votre appareil.",
  "termsContent": "En utilisant CompressSnap, vous acceptez ces conditions.\n\n1. Cet outil est fourni \"en l'état\", sans aucune garantie.\n2. Nous ne sommes pas responsables des pertes de données ou des problèmes découlant de l'utilisation de cet outil.\n3. Vous êtes responsable du contenu que vous traitez avec cet outil.\n4. Nous nous réservons le droit de modifier ces conditions à tout moment.",
  "cookiesContent": "Nous utilisons des cookies pour améliorer votre expérience.\n\n1. Cookies essentiels : Requis pour le fonctionnement de base du site.\n2. Cookies de préférences : Utilisés pour mémoriser votre langue et vos paramètres de consentement.\n\nVous pouvez gérer ou désactiver les cookies à tout moment via les paramètres de votre navigateur.",
  "contact": "Contact"
};
