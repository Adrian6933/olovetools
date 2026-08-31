export default {
  "languageName": "Français",
  "header": {
    "subtitle": "CONVERTISSEUR DE FORMATS D'IMAGE"
  },
  "hero": {
    "badge": "Fonctionne dans votre navigateur",
    "title": "Convertissez vos images dans le format qu'il vous faut,",
    "titleHighlight": "et voyez ce que ça a coûté",
    "subtitle": "Déposez jusqu'à 50 photos, choisissez le format, la taille et le poids, puis convertissez quand vous êtes prêt. Rien n'est envoyé et rien ne démarre tant que vous n'appuyez pas sur le bouton.",
    "trust1": "Aucun envoi, aucun compte",
    "trust2": "Qualité mesurée (SSIM)",
    "trust3": "Lots de 50"
  },
  "dropzone": {
    "title": "Déposez vos images ici",
    "subtitle": "Jusqu'à {max} à la fois. Vous pouvez aussi coller depuis le presse-papiers.",
    "waits": "Les fichiers attendent ici : la conversion ne démarre qu'au moment où vous appuyez sur Convertir.",
    "tooMany": "La file accepte 50 images ; les fichiers en trop ont été laissés de côté.",
    "unsupported": "EPS et RAW d'appareil photo ne peuvent pas être décodés dans un navigateur : ils ont été écartés.",
    "decodeFailed": "Ce fichier n'a pas pu être décodé comme une image.",
    "full": "La file est pleine. Retirez une image pour en ajouter une autre."
  },
  "stage": {
    "original": "Original",
    "converted": "Convertie",
    "stale": "Réglages modifiés",
    "zoomIn": "Zoomer",
    "zoomOut": "Dézoomer",
    "fit": "Ajuster",
    "splitLabel": "Séparateur de comparaison",
    "stageHint": "Molette pour zoomer sur le pointeur, glissez pour déplacer. Maintenez Espace, Alt ou le clic droit pour voir l'original."
  },
  "controls": {
    "presetsTitle": "Préréglages",
    "presets": {
      "web": "Web (WEBP, 1920px)",
      "social": "Réseaux (JPG, 1440px)",
      "archive": "Archive (PNG, taille réelle)",
      "email": "E-mail (moins de 500 Ko)"
    },
    "presetsHint": "Un préréglage ne fait que remplir les réglages ci-dessous. Ignorez-le et réglez tout à la main si vous préférez.",
    "outputFormat": "Format de sortie",
    "formatUnavailable": "Votre navigateur ne sait pas écrire ce format",
    "formatUnavailableHint": "Les formats barrés sont ceux pour lesquels ce navigateur n'a pas d'encodeur. Nous le vérifions au lieu de le supposer : vous ne récupérez jamais un PNG avec la mauvaise extension.",
    "qualityTitle": "Qualité et poids",
    "quality": "Qualité",
    "qualityLossless": "Ce format est sans perte : la qualité n'a aucun effet ici.",
    "targetSize": "Viser un poids maximal",
    "targetSizeHint": "La qualité est trouvée par dichotomie : jusqu'à 8 encodages pour se placer juste sous la limite.",
    "resizeTitle": "Taille",
    "resizeModes": {
      "none": "Garder",
      "scale": "Échelle",
      "longEdge": "Côté long",
      "dimensions": "Exacte"
    },
    "scale": "Échelle",
    "longEdgeHint": "côté le plus long",
    "lockAspect": "Conserver les proportions",
    "fits": {
      "contain": "Contenir",
      "cover": "Couvrir",
      "stretch": "Étirer"
    },
    "sharpen": "Accentuer après redimensionnement",
    "sharpenHint": "Masque flou appliqué à la seule luminance, pour des bords nets sans halos de couleur.",
    "transformTitle": "Rotation et fond",
    "flipH": "Retourner horizontalement",
    "flipV": "Retourner verticalement",
    "background": "Fond sous l'image (formats sans transparence)",
    "engineTitle": "Moteur",
    "measureQuality": "Mesurer la qualité",
    "measureQualityHint": "Redécode le résultat et le compare à la source (SSIM). Coûte quelques millisecondes.",
    "livePreview": "Aperçu en direct",
    "livePreviewHint": "Désactivé par défaut : activé, chaque changement reconvertit l'image sélectionnée.",
    "undo": "Annuler",
    "redo": "Rétablir",
    "historyHint": "Historique des réglages"
  },
  "editor": {
    "startOver": "Recommencer",
    "shortcuts": "← → pour naviguer, Entrée pour convertir, Ctrl+Z pour annuler",
    "queue": "File d'attente",
    "addMore": "Ajouter",
    "remove": "Retirer de la file",
    "perImage": "Réglages propres à cette image",
    "perImageOn": "Cette image ignore les réglages globaux.",
    "perImageOff": "Cette image suit les réglages globaux.",
    "convert": "Convertir",
    "convertAll": "Tout convertir",
    "converting": "Conversion",
    "reading": "Lecture",
    "download": "Télécharger",
    "downloadZip": "ZIP",
    "dimensions": "Dimensions",
    "size": "Poids",
    "vsOriginal": "par rapport à l'original",
    "quality": "Qualité",
    "attempts": "passages",
    "ssimBands": {
      "identical": "indiscernable",
      "excellent": "excellente",
      "good": "bonne",
      "fair": "visible de près",
      "poor": "nettement dégradée"
    },
    "icoMultisize": "Le .ico contient des versions de 16, 32, 48, 64, 128 et 256 px ; la taille affichée est celle de la plus grande qu'il renferme.",
    "missedTarget": "Le poids maximal n'a pas pu être atteint, même à la qualité la plus basse. Voici le résultat le plus léger possible.",
    "notConverted": "Pas encore convertie",
    "notConvertedHint": "Votre fichier est chargé et en attente. Réglez ce qu'il vous faut et appuyez sur Convertir.",
    "engineNote": "L'encodage tourne dans {n} workers en arrière-plan : la page ne se fige jamais. Chaque image est décodée une fois et toutes les conversions repartent de là.",
    "dismiss": "Fermer",
    "backToTop": "Remonter"
  },
  "next": {
    "nextStepTitle": "Continuez",
    "nextStepHint": "Le résultat vous suit, sans réenvoi",
    "nextCompress": "La compresser",
    "nextCrop": "La recadrer",
    "nextExif": "Effacer les métadonnées",
    "nextWatermark": "Ajouter un filigrane",
    "nextCutout": "Détourer le fond"
  },
  "how": {
    "title": "Comment ça marche",
    "subtitle": "Trois étapes, et aucune ne démarre toute seule.",
    "steps": [
      {
        "title": "Déposez les fichiers",
        "text": "Ils sont décodés une fois et attendent dans la file. Rien n'est converti et rien ne quitte votre appareil."
      },
      {
        "title": "Choisissez la sortie",
        "text": "Format, qualité, taille, rotation, fond. Ou un préréglage et c'est réglé."
      },
      {
        "title": "Convertissez et comparez",
        "text": "Vous repartez avec le poids, les dimensions et une note SSIM de ce que la conversion a coûté."
      }
    ]
  },
  "features": {
    "title": "Ce qu'il fait et qu'un convertisseur ordinaire ne fait pas",
    "items": [
      {
        "title": "Workers en parallèle",
        "desc": "L'encodage se fait hors du fil principal, réparti sur plusieurs workers : la page reste réactive même avec 50 images en file."
      },
      {
        "title": "Formats vérifiés, pas supposés",
        "desc": "Chaque encodeur est testé au démarrage par un vrai encodage de deux pixels. Un navigateur incapable d'écrire l'AVIF ne vous le propose pas."
      },
      {
        "title": "Une qualité lisible",
        "desc": "Une note SSIM face à la source vous dit ce que la compression a réellement coûté, pas seulement ce que vous avez gagné."
      },
      {
        "title": "Poids cible",
        "desc": "Vous dites « moins de 500 Ko » et la qualité est trouvée par dichotomie, en 8 encodages au plus, pour se placer juste sous la limite."
      },
      {
        "title": "Aucun envoi",
        "desc": "Décodage, redimensionnement et encodage se passent dans votre navigateur. Aucun serveur ne voit vos photos, et ça marche hors ligne."
      },
      {
        "title": "Lots avec réglages par image",
        "desc": "Jusqu'à 50 images à la fois, et chacune peut faire bande à part avec son propre format et sa propre taille."
      }
    ]
  },
  "formats": {
    "title": "Les formats, et ce que chacun apporte vraiment",
    "subtitle": "En entrée : JPG, PNG, WEBP, AVIF, GIF, BMP, SVG, TIFF et HEIC. EPS et RAW d'appareil photo exigent un interpréteur PostScript et une table par modèle de boîtier : ils sont refusés plutôt que renvoyés en douce sous forme de PNG.",
    "rows": [
      {
        "label": "WEBP",
        "desc": "Aujourd'hui le meilleur compromis poids/qualité pour le web, avec transparence. Pris en charge partout où ça compte."
      },
      {
        "label": "AVIF",
        "desc": "Encore plus léger à qualité égale, mais seuls certains navigateurs savent l'écrire. Si le vôtre ne peut pas, le bouton est désactivé."
      },
      {
        "label": "JPG",
        "desc": "Le format photographique universel. Sans transparence : c'est vous qui choisissez la couleur de fond placée dessous."
      },
      {
        "label": "PNG",
        "desc": "Sans perte et avec transparence. Le curseur de qualité n'y change rien, et c'est pour ça qu'il est grisé."
      },
      {
        "label": "ICO",
        "desc": "Une vraie icône multi-tailles : 16, 32, 48, 64, 128 et 256 px dans un seul fichier, recadrée au carré depuis le centre."
      },
      {
        "label": "PDF",
        "desc": "Une page ajustée à l'image, avec un JPEG à l'intérieur à la qualité que vous avez choisie."
      },
      {
        "label": "TIFF",
        "desc": "RGBA non compressé pour l'impression et l'archivage. Également accepté en entrée."
      },
      {
        "label": "SVG",
        "desc": "Une enveloppe : le raster est intégré dans un SVG. Ça ne vectorise pas — aucun outil de navigateur ne le fait — mais ça passe partout où seul le .svg est accepté."
      }
    ]
  },
  "app": {
    "footer": "Tout se passe dans votre navigateur.",
    "contactFeedback": "CONTACT POUR IDÉES ET RETOURS :",
    "copiedEmail": "Copié !"
  },
  "faqTitle": "Questions fréquentes",
  "faq": [
    {
      "question": "Mes images sont-elles envoyées quelque part ?",
      "answer": "Non. Le décodage, le redimensionnement et l'encodage se font dans votre navigateur, avec le canvas et des web workers. Rien n'est envoyé à un serveur et, une fois la page chargée, tout fonctionne sans connexion."
    },
    {
      "question": "Pourquoi certains formats sont-ils barrés ?",
      "answer": "Parce que votre navigateur n'a pas d'encodeur pour eux. Les navigateurs ne le signalent pas : demandez un GIF ou un HEIC et vous récupérez un PNG dont le type a été changé en silence. Au démarrage, nous encodons deux pixels dans chaque format et regardons ce qui sort vraiment, pour ne vous proposer que ce qui marche."
    },
    {
      "question": "Peut-il convertir en HEIC, EPS ou RAW d'appareil photo ?",
      "answer": "Non, et il ne prétend plus le contraire. Aucun navigateur ne sait écrire le HEIC, l'EPS demande un interpréteur PostScript et le RAW est un format capteur différent pour chaque modèle. Le HEIC et le TIFF sont acceptés en entrée ; les fichiers EPS et RAW sont refusés avec un message plutôt que renvoyés en PNG mal étiqueté."
    },
    {
      "question": "Que signifie le nombre SSIM affiché à côté du résultat ?",
      "answer": "C'est une note de similarité entre l'image convertie et la source, de 0 à 1. Au-dessus de 0,98 la différence est très difficile à voir ; en dessous de 0,95 des artefacts apparaissent sur les photographies. Elle existe parce que « 68 % de gagné » ne raconte que la moitié flatteuse de l'histoire."
    },
    {
      "question": "Pourquoi rien ne se passe quand je dépose un fichier ?",
      "answer": "C'est voulu. Déposer un fichier se contente de le décoder et de le mettre en file. La conversion — la partie coûteuse — attend que vous appuyiez sur Convertir, pour que vous prépariez tout au calme au lieu de courir après un aperçu qui redémarre sans cesse."
    },
    {
      "question": "Le redimensionnement fait-il perdre du détail ?",
      "answer": "Toute forte réduction en perd, mais l'ampleur dépend du moteur. Certains navigateurs réduisent en une passe avec un noyau 2x2 et jettent le reste des pixels, ce qui donne des bords crénelés. FormatFlow le mesure au démarrage — il réduit une mire et la compare à une moyenne exacte — et ne se rabat sur la réduction par moitiés successives que si le navigateur en a besoin. Quand le navigateur filtre déjà correctement, ces passes supplémentaires coûteraient du temps sans rien changer : elles sont donc évitées. Vous pouvez aussi ajouter une passe d'accentuation par-dessus."
    },
    {
      "question": "Pourquoi mes photos de téléphone ne sont-elles plus tournées de travers ?",
      "answer": "Parce que l'image est décodée avec createImageBitmap et que l'orientation EXIF y est appliquée, une seule fois. L'ancienne méthode chargeait le fichier dans un élément <img>, où certains navigateurs appliquent la balise d'orientation et d'autres non, et le canvas se retrouvait avec l'image non tournée."
    },
    {
      "question": "Combien d'images puis-je convertir d'un coup ?",
      "answer": "Cinquante. Elles sont encodées en même temps sur plusieurs workers en arrière-plan, et chacune peut porter son propre format et sa propre taille si vous activez les réglages par image."
    }
  ],
  "seoKeywordsTitle": "Mots-clés",
  "seoKeywords": [
    "convertisseur d'images",
    "convertir HEIC en JPG",
    "PNG en WEBP",
    "JPG en AVIF",
    "WEBP en PNG",
    "TIFF en JPG",
    "image en ICO",
    "générateur de favicon",
    "image en PDF",
    "convertisseur d'images par lot",
    "redimensionner des images en ligne",
    "compresser des images à un poids donné",
    "convertisseur d'images hors ligne",
    "convertisseur d'images gratuit sans envoi"
  ],
  "footer_seo_title": "Un convertisseur qui vous dit ce qu'il a fait",
  "footer_seo_paragraph1": "FormatFlow convertit des images entre JPG, PNG, WEBP, AVIF, ICO, PDF, TIFF et SVG entièrement dans votre navigateur. Il lit le HEIC des iPhone et le TIFF en entrée, redimensionne par échelle, par côté long ou à des dimensions exactes, fait pivoter, retourne, choisit la couleur de fond pour les formats sans transparence et sait viser un poids maximal en cherchant la bonne qualité.",
  "footer_seo_paragraph2": "Ce qu'il ne fait pas, c'est vous mentir. Les formats que votre navigateur ne sait pas encoder apparaissent désactivés au lieu de renvoyer un PNG mal nommé, l'EPS et le RAW d'appareil photo sont refusés d'emblée, et chaque résultat arrive avec son poids, ses dimensions et une note SSIM de la qualité qu'il a coûtée. Rien n'est envoyé : toute la chaîne tourne sur votre machine.",
  "seo_title": "FormatFlow | Convertisseur d'images à qualité mesurée",
  "seo_description": "Convertissez vos images en WEBP, AVIF, JPG, PNG, ICO, PDF, TIFF ou SVG dans votre navigateur. Lots de 50, poids cible, vrai ICO multi-tailles, entrée HEIC et TIFF, et note de qualité SSIM. Aucun envoi."
};
