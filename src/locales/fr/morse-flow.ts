export default {
  "title": "MorseFlow",
  "label_text": "Texte",
  "label_morse": "Morse",
  "label_reference": "Référence Morse",
  "button_play": "Lire",
  "button_stop": "Arrêter",
  "button_reset": "Réinitialiser",
  "tooltip_copy": "Copier",
  "tooltip_mute": "Couper le son",
  "tooltip_unmute": "Activer le son",
  "seoPrivacyTitle": "100% Privé et Sécurisé",
  "seoPrivacyText": "Aucune base de données, suivi ou envoi réseau. Vos données résident strictement en mémoire locale et disparaissent à la fermeture de l'onglet.",
  "faqTitle": "Questions Fréquentes",
  "footerCredit": "Fait partie de la suite oLoveTools",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "Copié !",
  "contactForIdeas": "Contact pour idées et commentaires :",
  "heroBadge": "Manipulateur et lecteur",
  "badgeSource": "source",
  "placeholderText": "SOS AIDE",
  "issuesTitle": "{n} caractères n’ont pas d’équivalent en morse, affichés {mark} :",
  "labelTimeline": "Chronologie",
  "wpmShort": "mots/min",
  "badgeFarnsworth": "farnsworth",
  "labelCharSpeed": "Vitesse des caractères",
  "labelOverall": "Vitesse globale",
  "labelTone": "Tonalité (Hz)",
  "labelWave": "Forme d’onde",
  "waveSine": "Sinusoïdale",
  "waveSquare": "Carrée",
  "waveTriangle": "Triangulaire",
  "waveSaw": "Dents de scie",
  "buttonWav": "Télécharger en WAV",
  "buttonCopyBoth": "Copier les deux",
  "tabListen": "Écouter",
  "listenIntro": "Ouvrez un enregistrement ou utilisez le micro. La tonalité est trouvée par balayage de la bande, le seuil vient de l’enregistrement lui-même et la durée de l’unité est mesurée sur les longueurs de traits : rien ici ne suppose 600 Hz ni 20 mots/min.",
  "buttonOpenAudio": "Ouvrir un enregistrement",
  "buttonRecord": "Enregistrer au micro",
  "buttonStopRecording": "Arrêter l’enregistrement",
  "buttonAnalyse": "La décoder",
  "parkedHint": "en attente — rien n’a encore été analysé",
  "heardTone": "Tonalité",
  "heardUnit": "Unité",
  "heardWpm": "Vitesse",
  "heardConfidence": "Séparation",
  "listenFail_no-audio": "Cet enregistrement est trop court pour être lu.",
  "listenFail_no-tone": "Aucune tonalité stable trouvée entre 250 et 1600 Hz.",
  "listenFail_no-elements": "La tonalité a été trouvée mais les traits et les silences ne se séparent pas nettement.",
  "listenFailGeneric": "Rien de lisible n’est sorti de cet enregistrement.",
  "ref_letters": "Lettres",
  "ref_digits": "Chiffres",
  "ref_punctuation": "Ponctuation",
  "ref_accented": "Accentuées",
  "ref_prosigns": "Prosignes",
  "errorAudio": "Ce navigateur n’a pas accordé de contexte audio à la page.",
  "errorRender": "Ce navigateur ne peut pas rendre l’audio hors ligne.",
  "errorTooLarge": "Cet enregistrement est trop volumineux.",
  "errorDecodeAudio": "Ce fichier n’a pas pu être décodé comme audio.",
  "errorMic": "Le microphone n’était pas disponible.",
  "errorRead": "Ce fichier n’a pas pu être lu.",
  "errorFormat": "Déposez un fichier texte ou un enregistrement.",
  "errorClipboard": "Le presse-papiers n’est pas disponible sur cette page.",
  "handoffReceived": "Reçu depuis {tool}.",
  "nextStepTitle": "Continuez",
  "nextStepHint": "Le message vous suit — sans téléchargement ni renvoi",
  "nextAudio": "Modifier l’audio",
  "nextBinary": "Convertir en binaire",
  "nextQr": "Créer un QR",
  "nextWordflow": "Compter le texte",
  "nextBase64": "L’encoder",
  "seo_description": "Traduisez du texte en morse et inversement, écoutez-le à toute vitesse avec l’espacement Farnsworth, exportez-le en WAV et décodez un enregistrement en texte — le tout dans votre navigateur, sans rien envoyer.",
  "seoHeroText": "Un manipulateur et un récepteur sur une page : l’alphabet ITU complet avec ponctuation et prosignes, la temporisation PARIS standard avec espacement Farnsworth, et un décodeur qui relit le morse d’un enregistrement.",
  "heroText": "Tapez d’un côté ou de l’autre, le second suit. Rien ne disparaît sans le dire, la temporisation est celle du standard, et un enregistrement peut faire le chemin inverse : tonalité, vitesse et seuil mesurés, non supposés.",
  "seoHeroList": [
    "Ponctuation et prosignes",
    "Temporisation PARIS",
    "Espacement Farnsworth",
    "Décode un enregistrement"
  ],
  "seoSecondaryTitle": "Dans les deux sens, et sans deviner",
  "howItWorksTitle": "Comment ça marche",
  "step1Title": "Tapez-le",
  "step1Text": "L’une ou l’autre boîte pilote la seconde. Ponctuation, lettres accentuées et prosignes comme <SK> sont dans la table, et ce qui n’a vraiment pas de code est marqué plutôt que supprimé.",
  "step2Title": "Réglez l’émission",
  "step2Text": "Vitesse des caractères et vitesse globale sont deux réglages distincts : c’est cela, Farnsworth. La tonalité et la forme d’onde vous appartiennent aussi, et la chronologie montre chaque point, trait et silence à sa vraie durée avant la lecture.",
  "step3Title": "Ou laissez-le écouter",
  "step3Text": "Ouvrez un enregistrement ou utilisez le micro. Il balaie pour trouver la porteuse, seuille l’enveloppe avec Otsu, regroupe les longueurs pour trouver l’unité, et rapporte la tonalité, la vitesse et la netteté de la séparation.",
  "step4Title": "Emportez-le",
  "step4Text": "Copiez l’un ou l’autre, téléchargez la tonalité en WAV rendu hors ligne en pleine qualité, ou passez le message directement à un autre outil de la suite.",
  "features": [
    {
      "title": "L’alphabet entier",
      "text": "Lettres, chiffres, les dix-huit signes de ponctuation, les lettres accentuées nationales et les prosignes réellement utilisés. Ce qui n’a pas de code est signalé plutôt que supprimé en silence."
    },
    {
      "title": "Un oscillateur, une enveloppe",
      "text": "Le message entier est une seule tonalité pilotée par une courbe de gain programmée avec des rampes de 5 ms, au lieu d’un oscillateur par point. Moins de nœuds, pas de clics, et un contexte audio réutilisé."
    },
    {
      "title": "Il sait écouter",
      "text": "Pointez-le vers un enregistrement ou le micro. Un balayage de Goertzel trouve la porteuse, Otsu seuille l’enveloppe, et le regroupement des longueurs donne l’unité : tonalité et vitesse mesurées, non supposées."
    },
    {
      "title": "Farnsworth, correctement",
      "text": "Vitesse des caractères et vitesse globale séparées, le temps supplémentaire réparti sur les silences dans le rapport 3:4 défini par l’ARRL. C’est ainsi qu’on apprend à entendre des lettres."
    },
    {
      "title": "Une chronologie lisible",
      "text": "Chaque point, trait et silence dessiné à sa vraie durée, avec la tête de lecture qui la parcourt. Survolez un bloc pour connaître sa durée en millisecondes."
    },
    {
      "title": "Exportez la tonalité",
      "text": "Rendue hors ligne en WAV 16 bits à 44,1 kHz, prête pour une vidéo, un cours ou une sonnerie, sans la réenregistrer depuis les haut-parleurs."
    },
    {
      "title": "Rien n’est envoyé",
      "text": "Traduction, synthèse et décodage se font dans cet onglet. Le flux du micro ne quitte pas la page et aucun enregistrement n’est conservé."
    },
    {
      "title": "Passe la main au reste de la suite",
      "text": "Envoyez le message directement à AudioSnap, Binary-Flow, QR Bolt ou WordFlow, sans téléchargement ni renvoi."
    }
  ],
  "seoBrowserSpeedTitle": "Le navigateur est l’émetteur",
  "seoBrowserSpeedText": "Web Audio synthétise la tonalité, un contexte hors ligne rend le WAV, et decodeAudioData plus un filtre de Goertzel relisent un enregistrement. Rien de tout cela n’exige de serveur, de compte ni de requête réseau, et fermer l’onglet suffit à faire disparaître message et enregistrement.",
  "seoUseCaseTitle": "Pour l’apprendre et pour le lire",
  "seoUseCaseText": "Apprendre le morse, c’est entendre les caractères à pleine vitesse avec de l’air entre eux : c’est exactement le rôle de l’espacement Farnsworth, d’où deux réglages distincts ici. Le lire, c’est l’autre sens : un extrait de film, une balise enregistrée sur un récepteur, une énigme envoyée en note vocale. Les deux tiennent sur la même page, et le second annonce ce qu’il a mesuré — la tonalité en hertz, l’unité en millisecondes, les mots par minute obtenus et la netteté de la séparation — de sorte qu’une mauvaise réponse peut être discutée au lieu d’être simplement fausse.",
  "seoKeywords": [
    "traducteur morse",
    "décodeur morse",
    "texte en morse",
    "audio morse",
    "temporisation farnsworth",
    "morse depuis un audio",
    "entraînement cw",
    "alphabet morse"
  ],
  "faq": [
    {
      "question": "Mon texte ou mon enregistrement sont-ils envoyés quelque part ?",
      "answer": "Non. Traduction, synthèse de la tonalité, rendu du WAV et décodage audio s’exécutent dans votre navigateur. Le flux du micro ne quitte pas la page et rien n’est conservé d’une visite à l’autre."
    },
    {
      "question": "Quels caractères sont pris en charge ?",
      "answer": "L’ensemble ITU complet : A–Z, 0–9, dix-huit signes de ponctuation, les lettres accentuées nationales (À, Ä, Ç, É, Ñ, Ö, Ü, ß et consorts) et les prosignes courants, saisis entre chevrons comme <SK>. Un caractère sans équivalent est marqué # et listé, plutôt que supprimé."
    },
    {
      "question": "Quelle différence entre vitesse des caractères et vitesse globale ?",
      "answer": "C’est l’espacement Farnsworth. Les points et traits sont émis à la vitesse des caractères choisie, tandis que les silences entre lettres et mots sont étirés jusqu’à ce que l’ensemble sorte à la vitesse globale. C’est ainsi qu’on apprend à reconnaître une lettre à son rythme plutôt qu’en comptant les éléments."
    },
    {
      "question": "Comment décode-t-il un enregistrement ?",
      "answer": "Il balaie 250–1600 Hz avec un filtre de Goertzel pour trouver la porteuse, mesure la magnitude à cette seule fréquence par fenêtres de 5 ms pour obtenir une enveloppe, choisit le seuil avec la méthode d’Otsu, puis regroupe les longueurs obtenues pour trouver l’unité. Tonalité, durée de l’unité, vitesse et séparation des deux groupes sont tous affichés."
    },
    {
      "question": "Le décodeur s’est trompé. Pourquoi ?",
      "answer": "Regardez le chiffre de séparation et le graphe de l’enveloppe. Un enregistrement bruité, un signal qui s’évanouit ou une manipulation à la main irrégulière font se chevaucher traits et silences, et dans ce cas aucun seuil ne les sépare correctement. Recadrer sur la partie la plus propre suffit en général."
    },
    {
      "question": "Puis-je réutiliser l’audio ailleurs ?",
      "answer": "Oui. Le WAV est rendu hors ligne en 44,1 kHz, 16 bits, mono, avec la tonalité, la forme d’onde et la vitesse que vous avez choisies : il s’insère directement dans une vidéo ou un cours."
    }
  ],
  "seoKeywordsTitle": "Recherches associées",
  "footerTagline": "Le morse dans les deux sens : émis, entendu, mesuré.",
  "footer_seo_title": "Le morse, c’est la temporisation",
  "footer_seo_paragraph1": "Un point et un trait sont moins deux symboles qu’un symbole à deux longueurs, et tout le reste du morse est du silence de trois durées prescrites. Le mot standard PARIS fait cinquante unités en comptant l’espace qui le suit, d’où le chiffre familier : à vingt mots par minute, l’unité vaut soixante millisecondes, un point une unité, un trait trois, le silence dans une lettre un, entre lettres trois, entre mots sept. Ratez l’une d’elles et le rythme cesse d’être lisible bien avant les éléments eux-mêmes ; c’est pourquoi un lecteur qui consacre deux unités au silence entre lettres au lieu de trois sonne subtilement précipité sans être franchement faux. Ici, chaque durée vient de cette table et non d’une constante qui sonnait bien.",
  "footer_seo_paragraph2": "Lire du morse dans un enregistrement, c’est la même table à l’envers, et la difficulté est qu’aucun des nombres n’est connu d’avance. La tonalité peut être là où le récepteur l’a mise ; la vitesse est celle que l’opérateur a choisie ; la frontière entre « assez fort pour être un trait » et « fond sonore » dépend de l’enregistrement, pas d’une constante. Chacun est donc déduit : la porteuse par un balayage de Goertzel, le seuil par la méthode d’Otsu sur l’histogramme de l’enveloppe, et l’unité par les deux groupes dans lesquels les longueurs tombent naturellement, puisqu’un trait vaut trois points et qu’aucune main n’est irrégulière au point d’effacer ce rapport. Quand l’enregistrement est trop dégradé pour que ces groupes se séparent, cela se voit à un faible chiffre de séparation, et la réponse honnête est de le dire plutôt que d’imprimer une bêtise avec assurance.",
  "seo_title": "MorseFlow | Traducteur morse, lecteur et décodeur audio",
  "seoHeroTitle": "Traducteur morse et décodeur audio"
};
