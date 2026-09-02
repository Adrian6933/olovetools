export default {
  "resetHint": "Recommencer",
  "title": "CleanSnap",
  "seo_title": "CleanSnap | Effacez filigranes et objets de vos photos",
  "seo_description": "Peignez sur un filigrane, un logo ou un objet de trop : CleanSnap reconstruit ce qu'il y avait derrière en copiant des morceaux de la photo elle-même. Tout dans votre navigateur, avec barre de progression et bouton d'annulation. Rien n'est envoyé.",
  "seoHeroTitle": "CleanSnap",
  "seoHeroText": "Peignez sur ce que vous voulez faire disparaître : le trou est reconstruit à partir du reste de la photo, texture et contours compris, pas juste une tache floue.",
  "seoBrowserSpeedTitle": "Le travail tourne dans un fil séparé",
  "seoBrowserSpeedText": "Reconstruire un trou oblige à parcourir la photo à la recherche de morceaux qui collent, et c'est réellement lourd. Ça tourne dans un Web Worker avec une vraie barre de progression et un bouton d'annulation : la page ne se fige jamais.",
  "seoUseCaseTitle": "Quatre remplissages, et chacun dit ce qu'il fait",
  "seoUseCaseText": "Deux reconstruisent : les morceaux pour la texture et le détail, la diffusion pour les ciels et les murs lisses. Deux ne font que masquer : le flou et la mosaïque. Ils sont dans des groupes séparés parce que couvrir quelque chose n'est pas la même chose que l'enlever.",
  "seoPrivacyTitle": "La photo ne quitte pas votre appareil",
  "seoPrivacyText": "Aucun envoi, aucun compte, aucun modèle à télécharger. L'image est décodée, retouchée et exportée dans votre navigateur, et une fois la page chargée tout fonctionne sans connexion.",
  "hero": {
    "badge": "Fonctionne dans votre navigateur",
    "title": "Peignez sur ce qui gêne.",
    "titleHighlight": "Le reste de la photo le remplace.",
    "subtitle": "CleanSnap reconstruit le trou en copiant des morceaux de l'image elle-même : la texture et les contours se poursuivent à travers. Rien n'est envoyé, et rien ne démarre avant que vous n'appuyiez.",
    "trust1": "Aucun envoi, aucun compte",
    "trust2": "Pleine résolution",
    "trust3": "Annulable à tout moment"
  },
  "ui": {
    "dropTitle": "Déposez une photo ici",
    "dropHint": "Ou cliquez pour en choisir une. Vous pouvez aussi coller depuis le presse-papiers.",
    "reading": "Lecture de l'image…",
    "newImage": "Autre image",
    "scaledNote": "Travail en taille réduite — le fichier faisait {w}×{h}",
    "shortcuts": "B/R/C/E outils · [ ] brosse · Espace pour jeter un œil · Entrée pour appliquer",
    "brush": "Brosse",
    "rect": "Rectangle",
    "circle": "Ellipse",
    "eraser": "Dépeindre",
    "pan": "Déplacer",
    "size": "Taille",
    "invert": "Inverser",
    "clearSel": "Effacer",
    "apply": "Remplir la sélection",
    "cancel": "Annuler",
    "undo": "Annuler",
    "redo": "Rétablir",
    "reset": "Réinitialiser",
    "download": "Télécharger",
    "quality": "Qualité",
    "output": "Sortie",
    "tookMs": "{ms} ms",
    "stageOriginal": "Original",
    "stageCurrent": "Copie de travail",
    "stageHint": "Molette pour zoomer · glissez avec H pour déplacer · maintenez Espace ou le clic droit pour voir l'original",
    "zoomIn": "Zoomer",
    "zoomOut": "Dézoomer",
    "fit": "Ajuster",
    "dismiss": "Fermer",
    "errors": {
      "decode": "Ce fichier n'a pas pu être ouvert comme image.",
      "nomask": "Peignez d'abord quelque chose : il n'y a aucune sélection à remplir."
    },
    "fill": {
      "rebuildTitle": "Reconstruire ce qu'il y avait",
      "hideTitle": "Simplement masquer",
      "hideNote": "Ces deux-là n'enlèvent rien : ils recouvrent. Parfait pour un visage ou une plaque, inutile pour un filigrane que vous voulez voir disparaître.",
      "methods": {
        "patch": "Morceaux",
        "smooth": "Lissage",
        "blur": "Flou",
        "pixelate": "Mosaïque"
      },
      "methodHints": {
        "patch": "Copie des morceaux qui correspondent ailleurs dans la photo et progresse vers l'intérieur, contours d'abord. Le seul qui redonne de la texture.",
        "smooth": "Étale les couleurs alentour dans le trou. Parfait pour un ciel ou un mur uni, une tache sur tout ce qui a du détail.",
        "blur": "Moyenne les alentours sur la sélection. Ça masque, ça ne reconstruit pas.",
        "pixelate": "Remplace la sélection par des blocs. Ça masque, ça ne reconstruit pas."
      },
      "patchSize": "Taille du morceau",
      "patchSizeHint": "Petit suit le détail fin ; grand copie une texture plus cohérente. 9 px convient à la plupart des filigranes.",
      "searchRadius": "Rayon de recherche",
      "searchRadiusHint": "Jusqu'où chercher des morceaux autour du trou. Plus loin est plus lent et rarement meilleur : le bon morceau est en général juste à côté.",
      "strength": "Intensité",
      "grow": "Élargir la sélection",
      "growHint": "Les filigranes traînent un halo diffus qu'on ne voit pas en peignant. Deux pixels de plus suffisent généralement à l'attraper.",
      "feather": "Adoucir la jointure",
      "featherHint": "Fond le contour pour que la retouche ne se trahisse pas par une marche d'un pixel."
    }
  },
  "next": {
    "nextStepTitle": "Continuez",
    "nextStepHint": "La photo nettoyée vous suit, sans réenvoi",
    "nextCrop": "La recadrer",
    "nextWatermark": "Ajouter votre filigrane",
    "nextCompress": "La compresser",
    "nextFormat": "Changer de format",
    "nextExif": "Effacer les métadonnées"
  },
  "how": {
    "title": "Comment ça marche",
    "subtitle": "Trois étapes, et la plus lourde vous attend.",
    "steps": [
      {
        "title": "Ouvrez la photo",
        "text": "Elle est décodée une fois et garde sa pleine résolution. Rien n'est modifié et rien ne quitte votre appareil."
      },
      {
        "title": "Peignez par-dessus",
        "text": "Brosse, rectangle ou ellipse. Zoomez autant qu'il faut : la sélection est enregistrée à la taille réelle de la photo, pas à celle de l'aperçu."
      },
      {
        "title": "Remplissez",
        "text": "Choisissez une méthode et appuyez. Vous avez une barre de progression, un bouton d'annulation et le temps que ça a pris."
      }
    ]
  },
  "features": {
    "title": "Ce qui a changé sous le capot",
    "items": [
      {
        "title": "Des morceaux, pas une tache",
        "desc": "Le trou est comblé en copiant des morceaux venus d'ailleurs dans la même photo : la brique reste de la brique et l'herbe reste de l'herbe. La diffusion seule ne peut produire que la surface la plus lisse compatible avec les bords."
      },
      {
        "title": "Les contours se poursuivent",
        "desc": "L'ordre de remplissage dépend de la structure qui traverse chaque point du contour : une ligne ou un horizon entre donc en premier dans le trou et continue droit au lieu d'être coupé."
      },
      {
        "title": "Hors du fil principal",
        "desc": "Le travail tourne dans un Web Worker par tranches chronométrées : la barre avance, la page reste utilisable et Annuler arrête vraiment en cours de route."
      },
      {
        "title": "La sélection vous appartient",
        "desc": "Élargissez-la, rétrécissez-la, inversez-la, adoucissez sa jointure — et relancez avec une autre méthode sur la même sélection sans rien repeindre."
      },
      {
        "title": "Rien n'est envoyé",
        "desc": "Décodage, retouche et export se font tous dans votre navigateur. Pas de compte, pas de modèle à télécharger, et ça marche hors ligne."
      },
      {
        "title": "Une annulation qui coûte des kilo-octets",
        "desc": "Seul le rectangle modifié est conservé, pas l'image entière : quarante étapes d'historique tiennent dans la place qu'une seule prenait."
      }
    ]
  },
  "faqTitle": "Questions fréquentes",
  "faq": [
    {
      "question": "Ma photo est-elle envoyée quelque part ?",
      "answer": "Non. Elle est décodée, retouchée et exportée dans votre navigateur, avec le canvas et un Web Worker. Rien ne part vers un serveur, il n'y a pas de compte, et une fois la page chargée tout fonctionne sans aucune connexion."
    },
    {
      "question": "Y a-t-il un modèle d'IA derrière ?",
      "answer": "Non, et il ne prétend plus le contraire. La version précédente proposait un « mode IA » qui exécutait exactement la même diffusion que le mode normal, avec seulement plus d'itérations. Ce qu'il y a maintenant, c'est la propagation de morceaux : le trou est comblé en copiant de vrais bouts de votre propre photo. Pas de réseau de neurones, pas de téléchargement, et une description honnête."
    },
    {
      "question": "Pourquoi le résultat est-il parfois encore bancal ?",
      "answer": "Parce que le remplissage ne peut utiliser que ce qui est déjà dans l'image. Si ce que vous avez retiré cachait quelque chose d'unique — un visage, du texte, un objet sans équivalent — il n'y a rien à copier, et le résultat est une texture plausible, pas la vérité. Ça marche le mieux sur les fonds qui se répètent : ciel, murs, feuillage, bitume, eau."
    },
    {
      "question": "À quoi sert chaque remplissage ?",
      "answer": "Les morceaux pour tout ce qui a de la texture ou de la structure. Le lissage pour les ciels, les murs unis et les dégradés, où il est à la fois plus rapide et meilleur. Le flou et la mosaïque n'enlèvent rien du tout : ils recouvrent, ce qui est parfait pour un visage ou une plaque et exactement ce qu'il ne faut pas pour un filigrane."
    },
    {
      "question": "La sélection semble bonne mais un contour pâle subsiste. Pourquoi ?",
      "answer": "Les filigranes sont souvent semi-transparents et entourés d'un halo diffus de quelques pixels, facile à manquer en peignant. Montez « Élargir la sélection » de deux ou trois pixels pour que le halo se retrouve dans le trou et soit reconstruit lui aussi."
    },
    {
      "question": "Puis-je arrêter un remplissage interminable ?",
      "answer": "Oui. Reconstruire oblige à parcourir la photo à la recherche de morceaux qui collent, donc une grande sélection prend réellement du temps. Le travail est découpé en tranches courtes dans un fil d'arrière-plan, et c'est précisément ce qui permet à la barre d'avancer et au bouton Annuler d'agir en cours de route, pas seulement à la fin."
    },
    {
      "question": "Est-ce que ça réduit ma photo ?",
      "answer": "Seulement au-delà d'environ 24 mégapixels, et dans ce cas c'est affiché à l'écran avec les dimensions d'origine. La version précédente ramenait silencieusement toute image à 1920 pixels : vous téléchargiez donc plus petit que ce que vous aviez ouvert, sans jamais en être informé."
    },
    {
      "question": "Quels formats puis-je ouvrir et enregistrer ?",
      "answer": "Elle ouvre JPG, PNG, WebP, AVIF, GIF et le HEIC des iPhone. Elle enregistre en PNG, JPG ou WebP, avec un curseur de qualité pour les deux formats avec perte — l'ancienne version écrivait toujours du PNG, ce qui transformait un petit JPEG en fichier bien plus lourd."
    }
  ],
  "seoKeywordsTitle": "Mots-clés",
  "seoKeywords": [
    "supprimer filigrane photo",
    "effaceur de filigrane",
    "retirer un objet d'une photo",
    "inpainting en ligne",
    "remplissage selon le contenu en ligne",
    "effacer des objets d'une image",
    "supprimer un logo d'une image",
    "supprimer du texte d'une photo",
    "retouche photo dans le navigateur",
    "supprimer filigrane gratuit sans envoi",
    "enlever des personnes des photos",
    "tampon de duplication en ligne"
  ],
  "footer_seo_title": "Un outil de retouche qui montre son travail",
  "footer_seo_paragraph1": "CleanSnap efface filigranes, logos, horodatages et objets indésirables de vos photos entièrement dans votre navigateur. Vous peignez sur ce que vous voulez faire disparaître, à la brosse, au rectangle ou à l'ellipse, en zoomant autant que nécessaire, et le trou est reconstruit en copiant des morceaux correspondants pris ailleurs dans la même image — les contours et les lignes d'abord, pour que la structure se poursuive à travers le trou au lieu de s'y arrêter.",
  "footer_seo_paragraph2": "Et il refuse d'en rajouter. Pas de modèle d'IA, pas de « mode intelligent » qui serait en réalité le même code deux fois ; le flou et la mosaïque ont leur propre groupe parce qu'ils masquent au lieu d'enlever ; l'image garde sa résolution et le dit quand elle ne peut pas ; et le remplissage tourne dans un fil d'arrière-plan avec une barre que vous pouvez annuler. Rien n'est envoyé, à aucun moment.",
  "footerCredit": "Fait partie de la suite oLoveTools",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "Copié !",
  "contactForIdeas": "Contactez-nous pour vos idées et commentaires :",
  "footerTagline": "Effacez filigranes et objets indésirables de vos photos en peignant par-dessus. Le trou est reconstruit à partir de l'image elle-même, entièrement dans votre navigateur."
};
