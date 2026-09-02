export default {
  "resetHint": "Recommencer",
  "title": "AudioSnap",
  "badge": "Enregistreur vocal et découpeur audio",
  "description": "Enregistrez au micro ou ouvrez un fichier audio, coupez-le sur la forme d'onde, réglez son niveau et exportez en WAV sans perte ou en clip compressé. Tout se passe dans cet onglet.",
  "btn_record": "Enregistrer",
  "btn_pause_record": "Pause",
  "btn_resume_record": "Reprendre",
  "btn_stop_record": "Arrêter",
  "tabRecord": "Enregistrer",
  "tabFile": "Ouvrir un fichier",
  "recordTitle": "Enregistrez avec votre micro",
  "recordHint": "Le micro ne s'ouvre que pendant l'enregistrement, et l'audio ne quitte jamais cet onglet.",
  "levelLabel": "Niveau d'entrée",
  "clipWarn": "L'entrée a atteint le maximum : éloignez-vous du micro ou baissez son gain.",
  "captureTitle": "Réglages du micro",
  "captureHint": "Coupez les trois traitements pour de la musique ou une ambiance ; laissez-les actifs pour de la voix dans un endroit bruyant.",
  "micLabel": "Périphérique d'entrée",
  "micDefault": "Par défaut du système",
  "micEcho": "Annulation d'écho",
  "micNoise": "Réduction de bruit",
  "micAgc": "Gain automatique",
  "micChannels": "Canaux",
  "micMono": "Mono",
  "micStereo": "Stéréo",
  "micBitrate": "Qualité",
  "dropTitle": "Déposez un fichier audio",
  "dropHint": "MP3, WAV, M4A, OGG, Opus, FLAC, WebM — et la piste audio d'une vidéo.",
  "browseBtn": "Choisir un fichier",
  "pendingHint": "Rien n'a encore été décodé. Appuyez sur le bouton quand vous êtes prêt.",
  "loadBtn": "Le charger dans l'éditeur",
  "discardBtn": "Abandonner",
  "decodingLabel": "Lecture de l'audio…",
  "label_trim": "Éditeur de forme d'onde",
  "label_recording": "Enregistrement",
  "label_paused": "En pause",
  "label_start": "Entrée",
  "label_end": "Sortie",
  "label_duration": "Sélection",
  "outputLabel": "Résultat",
  "newSourceBtn": "Recommencer",
  "undoBtn": "Annuler",
  "redoBtn": "Rétablir",
  "transportPlay": "Lecture / pause (Espace)",
  "transportStop": "Arrêter",
  "transportLoop": "Lire la sélection en boucle",
  "compareBtn": "Maintenir : original",
  "compareHint": "Maintenez pour entendre l'original intact (ou maintenez Alt)",
  "zoomLabel": "Zoom",
  "zoomIn": "Zoomer",
  "zoomOut": "Dézoomer",
  "zoomFit": "Clip entier",
  "zoomSelection": "Ajuster à la sélection",
  "zoomHint": "Molette = zoom · Maj+molette = défiler · glisser = sélectionner",
  "setInBtn": "Point d'entrée (I)",
  "setOutBtn": "Point de sortie (O)",
  "selectAll": "Tout sélectionner (A)",
  "autoTrimBtn": "Couper le silence",
  "autoTrimNone": "Aucune partie audible n'a été détectée : la sélection n'a pas bougé.",
  "autoTrimDone": "Réduit à {d}s de son audible.",
  "processTitle": "Traitement",
  "resetProcessing": "Neutre",
  "gainLabel": "Gain",
  "normalizeLabel": "Normaliser la crête à",
  "dcLabel": "Supprimer la composante continue",
  "fadeInLabel": "Fondu d'entrée",
  "fadeOutLabel": "Fondu de sortie",
  "speedLabel": "Vitesse",
  "channelsLabel": "Canaux",
  "channelSource": "Garder",
  "rateLabel": "Fréquence d'échantillonnage",
  "rateSource": "Garder",
  "statsTitle": "Mesuré",
  "statPeak": "Crête de la source",
  "statRms": "RMS de la source",
  "statOutPeak": "Crête de sortie",
  "statGain": "Gain appliqué",
  "statSize": "Taille estimée",
  "statClipWarn": "La sortie saturerait. Baissez le gain ou activez la normalisation.",
  "infoResampled": "rééchantillonné au décodage",
  "exportTitle": "Exporter",
  "formatLabel": "Format",
  "fmtWav16": "WAV · 16 bits (avec dither)",
  "fmtWav24": "WAV · 24 bits",
  "fmtWav32": "WAV · 32 bits flottant",
  "fmtCompressed": "Compressé · Opus",
  "bitrateLabel": "Débit",
  "realtimeWarn": "Le navigateur n'a pas d'encodeur audio hors ligne : celui-ci tourne en temps réel, environ {s}s.",
  "exportBtn": "Rendre et télécharger",
  "exportingLabel": "Rendu",
  "downloadOriginalBtn": "Télécharger la source intacte",
  "shortcutsTitle": "Clavier",
  "shortcutPlay": "Lecture / pause",
  "shortcutInOut": "Point d'entrée / sortie à la tête de lecture",
  "shortcutAll": "Sélectionner tout le clip",
  "shortcutAlt": "Maintenir pour entendre l'original intact",
  "shortcutZoom": "Zoomer, dézoomer, clip entier, sélection",
  "shortcutUndo": "Annuler / rétablir",
  "history_title": "Cette session",
  "clear_history": "Vider",
  "error_mic": "Accès au micro refusé ou indisponible.",
  "errorDecode": "Ce navigateur n'a pas pu décoder cet audio.",
  "errorEncoder": "Ce navigateur ne sait pas encoder d'audio compressé. Utilisez le WAV.",
  "errorExport": "L'export a échoué. Essayez une sélection plus courte ou le format WAV.",
  "errorTooShort": "La sélection est trop courte pour être exportée.",
  "nextStepTitle": "Et ensuite",
  "nextStepHint": "Le clip vous suit — pas besoin de le renvoyer",
  "nextZip": "L'archiver",
  "nextHash": "Calculer son empreinte",
  "howItWorksTitle": "Comment ça marche",
  "howItWorks": [
    {
      "title": "Enregistrez ou ouvrez un fichier",
      "text": "Choisissez votre micro, décidez si la réduction de bruit du navigateur vous aide ou vous gêne, puis lancez l'enregistrement. Ou déposez un MP3, WAV, M4A, OGG, FLAC ou l'audio d'une vidéo : rien n'est décodé tant que vous ne le demandez pas."
    },
    {
      "title": "Coupez sur la forme d'onde",
      "text": "Faites glisser les marqueurs d'entrée et de sortie, glissez sur l'onde pour sélectionner, tournez la molette pour zoomer sur un seul mot. La tête de lecture, la sélection et le zoom sont indépendants."
    },
    {
      "title": "Réglez le niveau et vérifiez",
      "text": "Normalisez la crête, ajoutez des fondus, changez la vitesse, repliez en mono. Chaque réglage est un nombre, pas une nouvelle copie de l'audio : annuler revient toujours en arrière et la source ne se dégrade jamais."
    },
    {
      "title": "Exportez ce qu'il vous faut",
      "text": "WAV 16 bits avec dither pour un montage ailleurs, 24 bits ou 32 bits flottant pour garder la marge, ou un clip Opus compressé quand le fichier doit être léger. La taille estimée s'affiche avant de valider."
    }
  ],
  "features": [
    {
      "title": "Découpe au point près",
      "text": "Les points de coupe sont des secondes du tampon décodé, pas des positions dans un élément média : l'export commence et finit exactement là où sont les marqueurs, sans déborder d'un quart de seconde."
    },
    {
      "title": "Vrai contrôle du micro",
      "text": "Choisissez le périphérique d'entrée, désactivez une par une l'annulation d'écho, la réduction de bruit et le gain automatique, prenez mono ou stéréo et fixez le débit avant de commencer."
    },
    {
      "title": "Édition non destructive",
      "text": "Gain, normalisation, fondus, vitesse et changements de canaux sont stockés comme une petite description de l'édition, appliquée une seule fois à l'export. Annuler et rétablir ne coûtent rien en mémoire."
    },
    {
      "title": "Mesuré, pas deviné",
      "text": "Crête et RMS de la sélection en dBFS, le gain que le rendu appliquera vraiment, la crête obtenue, et un avertissement avant que la sortie ne sature."
    },
    {
      "title": "Des exports utilisables",
      "text": "Le WAV 16 bits est écrit avec un dither TPDF pour que les fondus discrets restent propres, le 24 bits et le 32 bits flottant gardent la marge, et la fréquence d'échantillonnage est à vous."
    },
    {
      "title": "Rien n'est envoyé",
      "text": "Décodage, tracé, rendu et encodage se font dans cet onglet avec le moteur audio du navigateur. Pas de serveur, pas de compte, aucune bibliothèque tierce chargée depuis un CDN."
    }
  ],
  "seo_title": "AudioSnap | Enregistreur vocal et découpeur audio en ligne gratuit",
  "seo_description": "Enregistrez votre voix ou ouvrez un MP3, WAV, M4A, OGG ou FLAC, découpez-le sur une forme d'onde zoomable, normalisez-le et téléchargez du WAV sans perte ou un clip compressé. 100% dans votre navigateur, gratuit, sans inscription.",
  "seoHeroTitle": "Enregistrez, coupez et exportez sans rien envoyer",
  "seoHeroText": "AudioSnap est un enregistreur de micro et un découpeur de forme d'onde sur la même page. Il décode votre fichier avec le moteur audio du navigateur, dessine une vraie enveloppe min/max dans laquelle vous pouvez zoomer, et calcule la coupe finale en local : l'audio ne part nulle part.",
  "seoHeroList": [
    "Enregistre depuis n'importe quel micro, traitements accessibles",
    "Ouvre MP3, WAV, M4A, OGG, Opus, FLAC et bandes-son de vidéos",
    "Forme d'onde zoomable avec marqueurs d'entrée et de sortie",
    "Normalisation, fondus, vitesse et repli mono, tous annulables",
    "WAV sans perte en 16, 24 ou 32 bits flottant, ou clip compressé",
    "Rien n'est envoyé et rien n'est téléchargé depuis un CDN"
  ],
  "seoBrowserSpeedTitle": "Un tampon décodé, un rendu à la demande",
  "seoBrowserSpeedText": "Votre fichier est décodé une fois en échantillons bruts, puis laissé tel quel. Découpe, gain, fondus, vitesse et changements de canaux restent des nombres, appliqués en un seul rendu hors ligne au moment de l'export : c'est pourquoi annuler est instantané et pourquoi enchaîner les retouches n'accumule aucune perte.",
  "seoSecondaryTitle": "Un enregistreur pour les prises, un éditeur pour la suite",
  "seoUseCaseTitle": "Mémos vocaux, podcasts, voix off et samples",
  "seoUseCaseText": "Enregistrez un mémo vocal et supprimez le blanc aux deux bouts. Tirez vingt secondes propres d'un entretien d'une heure. Réglez le niveau d'une voix off avant qu'elle entre au montage. Repliez un enregistrement stéréo en mono pour un standard téléphonique, ou descendez une prise de 48 kHz à 16 kHz pour un modèle vocal. La forme d'onde zoome jusqu'au mot : la coupe tombe là où vous vouliez.",
  "seoPrivacyTitle": "Confidentiel parce qu'il n'y a nulle part où aller",
  "seoPrivacyText": "L'accès au micro est demandé quand vous appuyez sur enregistrer et relâché quand vous arrêtez. L'enregistrement, les échantillons décodés et chaque export vivent dans la mémoire de cet onglet jusqu'à sa fermeture. Aucun point d'envoi, aucune analyse de votre audio, aucun modèle ni codec récupéré sur un CDN tiers.",
  "faqTitle": "Questions fréquentes",
  "faq": [
    {
      "question": "Puis-je découper un fichier audio que j'ai déjà, ou seulement des enregistrements ?",
      "answer": "Les deux. L'onglet « Ouvrir un fichier » accepte MP3, WAV, M4A/AAC, OGG, Opus, FLAC et WebM, ainsi que la piste audio d'une vidéo. Déposer un fichier ne le décode pas : il attend que vous appuyiez sur le bouton de chargement, donc un long enregistrement ne fige jamais la page dans votre dos."
    },
    {
      "question": "Y a-t-il une durée maximale d'enregistrement ?",
      "answer": "L'outil n'en impose aucune, seule la mémoire de votre appareil compte : l'audio est gardé en échantillons bruts, environ 10 Mo par minute en stéréo à 48 kHz. Sur un ordinateur, les longues sessions passent sans problème ; sur un téléphone ancien, restez sur quelques minutes à la fois."
    },
    {
      "question": "Est-ce que quelque chose est envoyé en ligne ?",
      "answer": "Non. L'enregistrement, le décodage, le tracé, le rendu et l'encodage utilisent des API intégrées à votre navigateur. Rien n'est envoyé à un serveur, et aucune bibliothèque, aucun modèle ni codec n'est téléchargé depuis un CDN pendant que vous travaillez."
    },
    {
      "question": "Quel format d'export choisir ?",
      "answer": "Le WAV 16 bits est le choix sûr, celui qu'attendent les autres éditeurs. Le 24 bits et le 32 bits flottant gardent de la marge si vous comptez retraiter le fichier. L'option Opus compressée donne un fichier bien plus léger, mais les navigateurs n'ont pas d'encodeur audio hors ligne : le réencodage se fait en temps réel, un clip de deux minutes prend environ deux minutes."
    },
    {
      "question": "À quoi sert le bouton « maintenir : original » ?",
      "answer": "Il joue la source intacte tant que vous le maintenez — sans découpe, sans gain, sans fondus — et revient à votre version éditée quand vous relâchez. Maintenir Alt fait la même chose. C'est le seul moyen fiable de savoir si la normalisation a vraiment aidé."
    },
    {
      "question": "Quelle différence entre gain et normalisation ?",
      "answer": "Le gain est une valeur fixe que vous choisissez, en décibels. La normalisation mesure la crête la plus forte de votre sélection et calcule le gain nécessaire pour l'amener au plafond que vous fixez, si bien que deux clips enregistrés à des distances différentes finissent au même niveau. Si vous activez les deux, le gain manuel s'ajoute au niveau normalisé."
    },
    {
      "question": "Pourquoi le navigateur demande-t-il l'autorisation du micro ?",
      "answer": "Capturer de l'audio exige toujours votre consentement explicite, et c'est le navigateur lui-même qui gère cette demande. AudioSnap ne la déclenche qu'au moment où vous appuyez sur enregistrer, et l'indicateur du micro s'éteint dès que vous arrêtez."
    }
  ],
  "seoKeywordsTitle": "Recherches associées",
  "seoKeywords": [
    "enregistreur vocal en ligne",
    "découper de l'audio en ligne",
    "couper un mp3 en ligne",
    "éditeur audio dans le navigateur",
    "enregistrer sa voix en ligne gratuit",
    "rogner un audio sans l'envoyer",
    "convertisseur wav en ligne",
    "normaliser l'audio en ligne",
    "mp3 vers wav dans le navigateur",
    "découpeur audio gratuit sans filigrane"
  ],
  "footerTagline": "Enregistrement et édition audio en local, gratuits et privés.",
  "footerCredit": "Fait partie de la suite oLoveTools",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "Copié !"
};
