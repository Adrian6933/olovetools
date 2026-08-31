export default {
  "title": "GIFBolt",
  "description": "Extrayez les images d’une vidéo ou enchaînez des photos, modifiez la timeline et encodez un GIF avec palette globale et compression inter-images, le tout dans votre navigateur.",
  "tab_video": "Vidéo en GIF",
  "tab_images": "Images en GIF",
  "label_upload_video": "Télécharger Vidéo",
  "label_upload_images": "Télécharger Images",
  "label_duration": "Délai de trame (ms)",
  "label_fps": "Taux de trames (FPS)",
  "label_size": "Largeur du GIF",
  "label_quality": "Qualité de compression",
  "label_trim": "Plage de découpe",
  "label_start": "Temps de début",
  "label_end": "Temps de fin",
  "btn_generate": "Générer GIF",
  "btn_generating": "Compilation du GIF...",
  "btn_download": "Télécharger GIF",
  "text_progress_extract": "Extraction des trames...",
  "text_progress_compile": "Compilation des trames...",
  "history_title": "Historique de GIF Récent",
  "no_history": "Pas encore d'historique de GIF.",
  "clear_history": "Effacer l'Historique",
  "quality_high": "Haute qualité",
  "quality_medium": "Qualité moyenne",
  "quality_low": "Basse qualité (Rapide)",
  "drop_zone_video": "MP4, WebM, MOV, MKV, AVI — ou des images PNG, JPG, WebP, AVIF, GIF, BMP et HEIC.",
  "drop_zone_images": "PNG, JPG, WebP, AVIF, GIF, BMP et HEIC. Déposez-les dans l’ordre de lecture souhaité.",
  "seo_title": "GIFBolt | Convertisseur Gratuit de Vidéo en GIF et Images en GIF en Ligne",
  "seo_description": "Convertissez vidéos et séquences d’images en GIF animés dans le navigateur : timeline modifiable, palette globale, tramage Floyd–Steinberg et compression inter-images. Rien n’est téléversé.",
  "seoHeroTitle": "Transformez une vidéo ou une série d’images en GIF, directement dans le navigateur",
  "seoHeroText": "Extrayez les images d’un extrait, modifiez la timeline, puis encodez avec palette globale, tramage et compression inter-images. Rien n’est téléversé.",
  "seoHeroList": [
    "Les images restent modifiables avant l’encodage",
    "Une seule palette pour toute la boucle",
    "Rien n’est téléversé, rien n’est téléchargé"
  ],
  "seoBrowserSpeedTitle": "Un vrai encodeur GIF, pas un simple export de canvas",
  "seoBrowserSpeedText": "Les images sont lues directement dans la vidéo décodée avec un rééchantillonnage de haute qualité, sans jamais passer par un JPEG intermédiaire. La palette est construite par coupe médiane sur toute l’animation, les pixels sont mappés avec un tramage Floyd–Steinberg en serpentin, et tout ce qu’une image partage avec la précédente est écrit en transparent puis hérité. Le travail est réparti sur un pool de web workers : la page reste réactive et la barre de progression suit de vraies images.",
  "seoUseCaseTitle": "Pour les rapports de bug, les démos et les boucles de réaction",
  "seoUseCaseText": "Filmez un bug une fois et réduisez-le aux quatre secondes qui comptent. Transformez la visite d’une maquette en quelque chose qui se lit tout seul dans une pull request. Ou alignez quelques captures et réglez leur rythme à la main. La timeline reste modifiable jusqu’à l’encodage.",
  "seoPrivacyTitle": "Rien n’est téléversé, et rien n’est téléchargé non plus",
  "seoPrivacyText": "Tout se passe dans cet onglet : le décodeur vidéo est celui du navigateur, le quantificateur et le compresseur LZW sont du JavaScript livré avec la page, et le résultat est un Blob qui ne quitte jamais votre machine. Aucun serveur où envoyer des fichiers, aucun modèle ni codec récupéré sur un CDN. La contrepartie est honnête : tout est limité par votre mémoire vive, donc un clip 4K doit être raccourci et réduit avant de pouvoir être encodé.",
  "faqTitle": "Foire Aux Questions",
  "faq": [
    {
      "question": "Y a-t-il une limite de taille de fichier ?",
      "answer": "Pas de limite fixe, mais une limite réelle : les images vivent dans la mémoire de votre onglet. Un GIF de 480 px et 4 secondes à 12 ips représente environ 50 Mo de données de travail et s’encode en quelques secondes ; un clip 4K épuisera l’onglet bien avant la fin. Raccourcissez l’extrait et baissez la taille de travail : c’est à cela que servent ces réglages."
    },
    {
      "question": "Pourquoi mon GIF reste-t-il si lourd ?",
      "answer": "Le GIF est un format de 1987 : 256 couleurs et aucune compensation de mouvement. Réduisez d’abord la largeur, puis la cadence, puis la palette. Laisser « réutiliser les pixels inchangés » activé vaut souvent plus que les trois réunis : sur une capture d’écran, cela retire l’essentiel du fichier."
    },
    {
      "question": "Pourquoi la cadence n’est-elle pas exactement celle demandée ?",
      "answer": "Le GIF stocke chaque délai en centièmes de seconde : seules les cadences de la forme 100/n existent. Demander 12 ips revient à 8 centièmes par image, soit 12,5. Le panneau affiche la cadence que vous obtiendrez vraiment, pas celle demandée."
    },
    {
      "question": "Quels formats puis-je utiliser ?",
      "answer": "Toute vidéo que le navigateur sait lire — MP4/H.264, WebM, MOV et souvent MKV — plus PNG, JPG, WebP, AVIF, GIF, BMP et le HEIC de l’iPhone pour les images. Un GIF animé déposé comme image n’apporte que sa première image."
    },
    {
      "question": "Est-ce que quelque chose est téléversé ?",
      "answer": "Non. Il n’y a aucune étape de téléversement ni aucune requête externe : l’encodeur est livré avec la page et s’exécute dans des web workers, dans cet onglet."
    },
    {
      "question": "Puis-je conserver la transparence ?",
      "answer": "Oui, avec l’interrupteur « conserver la transparence ». Le GIF n’admet qu’une seule couleur entièrement transparente : les bords doux deviennent donc nets. C’est incompatible avec la réutilisation des pixels, les deux ayant besoin de la même case transparente."
    }
  ],
  "footerTagline": "Outils de création de GIF gratuits, privés et personnalisables côté client.",
  "footerCredit": "Fait partie de la suite oLoveTools",
  "badge": "Vidéo et images → GIF",
  "dropTitle": "Déposez une vidéo ou une série d’images",
  "dropHintNothing": "Déposer un fichier ne lance rien : vous choisissez les réglages et vous appuyez sur le bouton.",
  "modeAuto": "Extraire un extrait",
  "modeManual": "Choisir les images à la main",
  "manualHint": "Parcourez la vidéo et ajoutez exactement les images voulues. Aucun traitement automatique ne s’exécute.",
  "btnCapture": "Capturer cette image",
  "labelWorkingSize": "Taille de travail",
  "extractSummary": "{0} images en {1}×{2}. À partir d’ici, le GIF ne peut que rétrécir.",
  "btnExtract": "Extraire les images",
  "btnExtractAgain": "Extraire à nouveau",
  "waitingHint": "Réglez l’extrait et appuyez sur le bouton. Rien ne démarre avant.",
  "btnPlay": "Lecture",
  "btnPause": "Pause",
  "btnPrevFrame": "Image précédente",
  "btnNextFrame": "Image suivante",
  "btnUndo": "Annuler",
  "btnRedo": "Rétablir",
  "frameSummary": "{0} images · {1} ips réelles",
  "btnSelectAll": "Tout sélectionner",
  "btnSelectNone": "Désélectionner",
  "btnDeleteSelected": "Supprimer {0}",
  "btnKeepSelected": "Ne garder que celles-ci",
  "btnReverse": "Inverser",
  "btnPingPong": "Aller-retour",
  "btnHalve": "Retirer une image sur deux",
  "btnAddImages": "Ajouter des images",
  "btnResetDelays": "Réinitialiser le rythme",
  "delayHint": "Le GIF stocke les délais en centièmes de seconde : la valeur s’aligne sur les 10 ms les plus proches et ne descend jamais sous 20.",
  "outputTitle": "Sortie",
  "qualityCustom": "Personnalisée",
  "labelDiff": "Réutiliser les pixels inchangés",
  "diffHint": "N’écrit que ce qui a bougé entre deux images. Le plus gros gain sur une capture d’écran.",
  "showAdvanced": "Affiner les réglages",
  "hideAdvanced": "Masquer les réglages",
  "labelColors": "Taille de la palette",
  "labelDither": "Tramage",
  "ditherHint": "Échange un peu de bruit contre les bandes qu’une palette plate laisse dans les dégradés.",
  "labelDitherStrength": "Force du tramage",
  "labelTolerance": "Tolérance par pixel",
  "labelAlpha": "Conserver la transparence",
  "alphaHint": "Reporte les pixels transparents sur l’alpha 1 bit du GIF. Incompatible avec la réutilisation des pixels.",
  "labelBackground": "Arrière-plan",
  "labelFit": "Quand les formats diffèrent",
  "fitContain": "Ajuster avec des marges",
  "fitCover": "Remplir et rogner",
  "fitStretch": "Étirer",
  "labelLoop": "Boucler indéfiniment",
  "loopHint": "Désactivez-le pour jouer un nombre fixe de fois et s’arrêter sur la dernière image.",
  "labelLoopCount": "Lectures",
  "btnCancel": "Annuler",
  "phaseRaster": "Préparation des images…",
  "phasePalette": "Construction de la palette…",
  "resultTitle": "Résultat",
  "statSize": "Poids",
  "statFrames": "Images",
  "statSizePx": "Dimensions",
  "statColors": "Couleurs",
  "statReuse": "Pixels réutilisés",
  "statTime": "Encodé en",
  "statFps": "Cadence réelle",
  "statPerFrame": "Par image",
  "btnCopy": "Copier",
  "dismissLabel": "Fermer",
  "errorVideo": "Ce navigateur ne sait pas décoder cette vidéo. Essayez du MP4 (H.264) ou du WebM.",
  "errorImages": "Au moins une de ces images n’a pas pu être décodée.",
  "errorExtract": "Les images n’ont pas pu être lues. La vidéo utilise peut-être un codec que ce navigateur ne gère qu’à moitié.",
  "errorEncode": "L’encodage a échoué. Essayez avec moins d’images ou une largeur plus faible.",
  "errorClipboard": "Votre navigateur a bloqué le presse-papiers. Téléchargez-le à la place.",
  "errorTooManyFrames": "Arrêté à {0} images : au-delà, le GIF n’est pas le bon format.",
  "stageSource": "Image source",
  "stageResult": "GIF encodé",
  "stageHint": "La molette zoome vers le curseur, le glisser déplace.",
  "stageHintCompare": "La molette zoome vers le curseur, le glisser déplace. Maintenez Alt ou le bouton droit pour voir la source sous le GIF.",
  "zoomIn": "Zoom avant",
  "zoomOut": "Zoom arrière",
  "zoomReset": "Réinitialiser la vue",
  "stripHint": "Glissez sur la bande pour sélectionner des images. Maintenez Alt ou utilisez le bouton droit pour désélectionner.",
  "shortcutsTitle": "Raccourcis",
  "shortcuts": [
    {
      "keys": "Espace",
      "label": "lecture / pause"
    },
    {
      "keys": "← →",
      "label": "avancer d’une image"
    },
    {
      "keys": "Suppr",
      "label": "supprimer la sélection"
    },
    {
      "keys": "A / D",
      "label": "tout / rien sélectionner"
    },
    {
      "keys": "Ctrl+Z",
      "label": "annuler"
    },
    {
      "keys": "Entrée",
      "label": "encoder"
    }
  ],
  "nextStepTitle": "Et ensuite",
  "nextStepHint": "Envoie l’image affichée en PNG, sans la retéléverser",
  "nextCrop": "La rogner",
  "nextCompress": "La compresser",
  "nextCutout": "Détourer le fond",
  "nextWatermark": "Ajouter un filigrane",
  "nextMeme": "En faire un mème",
  "howItWorksTitle": "Comment ça marche",
  "step1Title": "Déposez le fichier",
  "step1Text": "Une vidéo ou une série d’images. Rien n’est téléversé et rien ne démarre tout seul.",
  "step2Title": "Choisissez l’extrait",
  "step2Text": "Placez les points d’entrée et de sortie et la cadence, puis extrayez les images — ou prenez-les une par une.",
  "step3Title": "Modifiez la timeline",
  "step3Text": "Supprimez des images, inversez-les, allongez-en une, et réglez couleurs et tramage.",
  "step4Title": "Encodez et vérifiez",
  "step4Text": "Maintenez Alt sur l’aperçu pour comparer le GIF à la source, puis téléchargez-le ou envoyez-le ailleurs.",
  "features": [
    {
      "title": "Une palette pour tout le clip",
      "text": "Les couleurs sont choisies par coupe médiane sur toutes les images à la fois : aucune teinte ne dérive au milieu de la boucle."
    },
    {
      "title": "Seul ce qui bouge est écrit",
      "text": "Les pixels qu’une image partage avec la précédente sont hérités au lieu d’être réencodés. Sur une capture d’écran, c’est l’essentiel du fichier."
    },
    {
      "title": "Un tramage qui supprime les bandes",
      "text": "Diffusion Floyd–Steinberg en serpentin, avec la force réglable, pour que les dégradés restent propres même à 64 couleurs."
    },
    {
      "title": "Une timeline modifiable",
      "text": "Supprimez des images, inversez la séquence, faites un palindrome, allongez une seule image. Annuler ne coûte rien : on stocke des identifiants, pas des bitmaps."
    },
    {
      "title": "Encodé sur tous vos cœurs",
      "text": "L’animation est répartie sur un pool de web workers : l’onglet reste utilisable et la barre de progression compte de vraies images."
    },
    {
      "title": "Rien ne quitte l’onglet",
      "text": "Le décodeur, la palette et le compresseur sont du JavaScript exécuté sur votre machine. Aucun téléversement, aucun modèle chargé depuis un CDN."
    },
    {
      "title": "Relié au reste de la suite",
      "text": "Envoyez l’image affichée directement vers le rognage, la compression ou le détourage sans la télécharger d’abord."
    }
  ],
  "seoKeywordsTitle": "Recherches associées",
  "seoKeywords": [
    "vidéo en gif",
    "créer un gif",
    "images en gif",
    "mp4 en gif",
    "compresser un gif",
    "gif animé",
    "convertisseur gif gratuit",
    "éditeur de gif"
  ]
};
