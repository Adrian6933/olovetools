export default {
  "title": "Device Test",
  "seo_title": "Device Test | Testez caméra, micro, haut-parleurs et écran",
  "seo_description": "Vérifiez que votre webcam, votre micro, vos haut-parleurs, votre écran, votre clavier et votre pointeur fonctionnent vraiment, avec les vrais chiffres : résolution de capture, images par seconde, niveau d'entrée en dBFS et résolutions réellement gérées. Rien n'est envoyé.",
  "seoHeroTitle": "Device Test",
  "seoHeroText": "Testez caméra, micro, haut-parleurs, écran, clavier et pointeur, et voyez les chiffres de chacun au lieu d'une coche verte.",
  "seoBrowserSpeedTitle": "Mesuré, pas supposé",
  "seoBrowserSpeedText": "On demande tour à tour 4K, 1440p, 1080p, 720p et 480p à la caméra et on rapporte ce qu'elle a réellement fourni. Le micro est mesuré en dBFS avec maintien de crête, détection de saturation et de silence. Demander n'est pas obtenir : on regarde le résultat.",
  "seoUseCaseTitle": "Six tests, aucun automatique",
  "seoUseCaseText": "Caméra, micro, haut-parleurs, écran, clavier et pointeur. Chacun a son bouton et ne demande l'autorisation qu'au lancement : ouvrir la page n'allume aucune webcam.",
  "seoPrivacyTitle": "Rien ne quitte votre appareil",
  "seoPrivacyText": "L'aperçu vidéo, le vumètre et l'enregistrement de cinq secondes restent dans l'onglet. Aucun envoi, aucun compte, aucune mesure d'audience là-dessus, et tout disparaît à la fermeture.",
  "hero": {
    "badge": "Fonctionne dans votre navigateur",
    "title": "Testez caméra, micro et écran",
    "titleHighlight": "avec les vrais chiffres",
    "subtitle": "Pas une coche verte qui ne dit rien. La résolution et la cadence réellement fournies par la caméra, le niveau d'entrée en dBFS, les résolutions gérées, plus des tests d'enceintes, d'écran, de clavier et de tactile.",
    "trust1": "Aucun envoi, aucun compte",
    "trust2": "Rien ne démarre seul",
    "trust3": "Six tests distincts"
  },
  "ui": {
    "tabCamera": "Caméra",
    "tabMic": "Micro",
    "tabSpeakers": "Haut-parleurs",
    "tabScreen": "Écran",
    "tabKeyboard": "Clavier",
    "tabPointer": "Pointeur",
    "start": "Démarrer",
    "stop": "Arrêter",
    "refresh": "Rafraîchir la liste des appareils",
    "defaultDevice": "Celui du système",
    "labelsHint": "Les noms des appareils restent masqués tant que vous n'avez pas donné l'autorisation une fois : c'est une règle du navigateur, pas un bug. Lancez un test et les vrais noms apparaissent.",
    "probeResolutions": "Sonder les résolutions",
    "probeResults": "Ce que la caméra a vraiment fourni",
    "probeHint": "Chaque résolution est demandée à son tour et on rapporte ce qui est revenu. Demander n'est pas promettre : les navigateurs donnent ce qui s'en rapproche le plus au lieu d'échouer.",
    "actualResolution": "Capture à",
    "frameRate": "Cadence",
    "facing": "Orientation",
    "maxSupported": "Maximum annoncé",
    "notAvailable": "indisponible",
    "capture": "Prendre une photo",
    "download": "Télécharger",
    "clear": "Effacer",
    "record": "Enregistrer 5 s",
    "peak": "Crête",
    "clipping": "Saturation : baissez le gain d'entrée",
    "silent": "Aucun signal — micro coupé ?",
    "meterHint": "Le RMS est le niveau que vous entendez ; la crête attrape les brefs pics. En parlant normalement, visez −18 dBFS, et la barre ne devrait jamais rester dans le rouge.",
    "speakersIntro": "Un son de 440 Hz sur le canal choisi. Si un seul côté sort, ou s'ils sont inversés, le problème vient du câble ou des réglages système, pas du navigateur.",
    "speakersHint": "Le son monte et descend en fondu à dessein : lancer une sinusoïde brute produit un clic plus fort que le son lui-même au casque.",
    "channelLeft": "Gauche",
    "channelBoth": "Les deux",
    "channelRight": "Droite",
    "screenIntro": "Aplats en plein écran pour traquer les pixels morts ou bloqués, plus un dégradé et une trame fine pour le banding et les fuites de rétroéclairage.",
    "screenStart": "Lancer le test d'écran",
    "screenHint": "Cliquez ou appuyez sur → pour passer, Échap pour sortir.",
    "screenGradient": "Dégradé",
    "screenGrid": "Trame",
    "screenNext": "Écran suivant",
    "close": "Fermer",
    "keyboardStart": "Commencer l'écoute",
    "keyboardStop": "Arrêter l'écoute",
    "keysSeen": "touches enregistrées",
    "keyboardHint": "Pendant l'écoute, les touches sont capturées au lieu d'agir : sinon Tab ou F5 vous feraient quitter la page. Le vert marque celles déjà vues au moins une fois.",
    "reset": "Réinitialiser",
    "pointerHint": "Appuyez et glissez ici. Sur un écran tactile, utilisez plusieurs doigts à la fois.",
    "pointerActive": "Actifs",
    "pointerMax": "Maximum simultané",
    "pointerType": "Type",
    "pointerButtons": "Boutons",
    "sysTitle": "Système",
    "sysNote": "Lu localement via les API standard du navigateur, et relu à chaque redimensionnement de la fenêtre ou rotation de l'appareil.",
    "sysScreen": "Écran",
    "sysViewport": "Fenêtre",
    "sysPixelRatio": "Densité de pixels",
    "sysColorDepth": "Profondeur de couleur",
    "sysColorGamut": "Gamut",
    "sysBrowser": "Navigateur",
    "sysEngine": "Moteur",
    "sysOS": "Système d'exploitation",
    "sysGpu": "GPU",
    "sysCpuCores": "Threads CPU",
    "sysMemory": "Mémoire de l'appareil",
    "sysTouchPoints": "Points tactiles",
    "sysPointer": "Pointeur",
    "sysLanguages": "Langues",
    "sysTimezone": "Fuseau horaire",
    "sysConnection": "Connexion",
    "sysOnline": "En ligne",
    "sysReducedMotion": "Mouvement réduit",
    "unknown": "—",
    "yes": "Oui",
    "no": "Non",
    "errors": {
      "NotAllowedError": "Autorisation refusée. Accordez-la depuis la barre d'adresse du navigateur et réessayez.",
      "NotFoundError": "Aucun appareil de ce type n'a été trouvé.",
      "NotReadableError": "L'appareil est occupé — une autre application l'utilise sans doute.",
      "OverconstrainedError": "Cet appareil ne peut pas faire ce qui lui a été demandé.",
      "AbortError": "L'appareil a cessé de répondre."
    }
  },
  "next": {
    "nextStepTitle": "Continuez",
    "nextStepHint": "La photo vous suit, sans réenvoi",
    "nextCrop": "La recadrer",
    "nextCutout": "Détourer le fond",
    "nextCompress": "La compresser",
    "nextFormat": "Changer de format",
    "nextWatermark": "Ajouter un filigrane"
  },
  "how": {
    "title": "Comment ça marche",
    "subtitle": "Trois étapes, et votre webcam reste éteinte jusqu'à votre feu vert.",
    "steps": [
      {
        "title": "Choisissez un test",
        "text": "Caméra, micro, haut-parleurs, écran, clavier ou pointeur. Rien ne tourne avant votre choix."
      },
      {
        "title": "Donnez l'autorisation",
        "text": "Uniquement pour le test lancé, et uniquement au lancement. Ouvrir la page ne demande rien."
      },
      {
        "title": "Lisez les chiffres",
        "text": "Résolution et cadence de capture, niveau d'entrée en dBFS, résolutions gérées — pas une coche qui ne dit rien."
      }
    ]
  },
  "features": {
    "title": "Ce qu'il mesure et qu'une coche verte ignore",
    "items": [
      {
        "title": "Les résolutions que votre caméra fait vraiment",
        "desc": "4K, 1440p, 1080p, 720p et 480p sont demandées tour à tour et on rapporte ce qui est revenu. Les navigateurs donnent ce qui s'en rapproche le plus au lieu de refuser : le seul moyen de savoir est de demander et de regarder."
      },
      {
        "title": "Niveau d'entrée en dBFS",
        "desc": "RMS et crête avec maintien, plus détection de saturation et de silence — les chiffres qui répondent à « mon micro capte-t-il quelque chose ? ». Une barre de hauteur anonyme, non."
      },
      {
        "title": "Gauche, droite et les deux",
        "desc": "Un son de 440 Hz par canal, pour distinguer une enceinte morte d'un câble inversé. En fondu, parce qu'une sinusoïde brute claque plus fort qu'elle ne sonne."
      },
      {
        "title": "Pixels morts et banding",
        "desc": "Aplats en plein écran, un dégradé et une trame fine. Vrai plein écran, car on ne juge ni le noir ni les fuites de rétroéclairage avec une barre de navigateur dans le champ."
      },
      {
        "title": "Clavier et multitouch",
        "desc": "Quelles touches physiques répondent — capturées pour que Tab et F5 s'enregistrent au lieu de vous faire quitter la page — et combien de doigts l'écran suit à la fois."
      },
      {
        "title": "Rien ne quitte l'onglet",
        "desc": "Aperçu, vumètre et enregistrement restent ici. Aucun envoi, aucun compte, et la liste des appareils se rafraîchit seule quand vous branchez quelque chose."
      }
    ]
  },
  "faqTitle": "Questions fréquentes",
  "faq": [
    {
      "question": "Est-ce que quoi que ce soit est envoyé ?",
      "answer": "Non. L'aperçu de la caméra, le vumètre et l'enregistrement de cinq secondes vivent dans cet onglet et nulle part ailleurs. Pas de compte, pas d'envoi, aucun serveur ; fermez la page et il n'en reste rien."
    },
    {
      "question": "Pourquoi la liste n'affiche-t-elle aucun nom avant de commencer ?",
      "answer": "Parce que les navigateurs masquent les libellés des appareils tant qu'une page n'a pas obtenu l'accès au moins une fois : cela empêche n'importe quel site de recenser votre matériel au simple chargement. Lancez un test et les vrais noms apparaissent. La version précédente énumérait au chargement et affichait donc « Camera 1 » partout."
    },
    {
      "question": "Que fait exactement « Sonder les résolutions » ?",
      "answer": "Il demande à votre caméra 4K, 1440p, 1080p, 720p puis 480p, une à une, et rapporte la taille d'image réellement obtenue. Une contrainte est une demande, pas une promesse : les navigateurs donnent ce qui s'en rapproche le plus plutôt que d'échouer, donc le seul moyen de savoir ce qu'une webcam gère est de le lui demander et de mesurer."
    },
    {
      "question": "Quel est un bon niveau de micro ?",
      "answer": "En parlant normalement, visez environ −18 dBFS en RMS, avec des crêtes sous −6. Si la barre atteint le rouge, l'entrée sature et le son se déformera : baissez le gain dans les réglages système. Si elle ne quitte jamais l'extrême gauche, le micro est coupé ou vous avez choisi le mauvais appareil."
    },
    {
      "question": "La page allume-t-elle ma webcam toute seule ?",
      "answer": "Jamais. Chaque test a son bouton et ne demande l'autorisation qu'au moment où vous appuyez : visiter cette page ne demande rien. Arrêter un test libère l'appareil immédiatement et le voyant de la caméra s'éteint."
    },
    {
      "question": "Pourquoi le test d'écran passe-t-il en plein écran ?",
      "answer": "Parce qu'on ne peut juger ni le niveau de noir, ni les fuites de rétroéclairage, ni les bords de la dalle avec une barre de navigateur et une barre des tâches à l'image. Il utilise le mode plein écran du navigateur ; appuyez sur Échap, ou quittez le plein écran autrement, et il se ferme."
    },
    {
      "question": "Pourquoi les touches ne font-elles pas leur travail habituel pendant le test ?",
      "answer": "Tant que le test écoute, les frappes sont capturées au lieu d'être exécutées. Sinon Tab déplacerait le focus, F5 rechargerait la page et F11 basculerait en plein écran — rien de tout cela ne vous permettrait de vérifier si la touche fonctionne."
    },
    {
      "question": "Le panneau système annonce un GPU générique. Pourquoi ?",
      "answer": "Le vrai modèle provient d'une extension WebGL que certains navigateurs masquent délibérément pour limiter le pistage, Firefox en particulier. Dans ce cas la chaîne générique s'affiche, ce qui reste une réponse exacte : c'est ce que la page a le droit de voir."
    }
  ],
  "seoKeywordsTitle": "Mots-clés",
  "seoKeywords": [
    "tester webcam",
    "tester micro",
    "test caméra en ligne",
    "test micro en ligne",
    "test haut-parleurs gauche droite",
    "test pixels morts",
    "test d'écran en ligne",
    "testeur de clavier",
    "test multitouch",
    "voir la résolution de la webcam",
    "test des périphériques dans le navigateur",
    "infos système en ligne"
  ],
  "footer_seo_title": "Un contrôle de périphériques qui montre les chiffres",
  "footer_seo_paragraph1": "Device Test vérifie votre webcam, votre micro, vos haut-parleurs, votre écran, votre clavier et votre pointeur entièrement dans votre navigateur. Au lieu d'une coche qui ne dit rien, il rapporte la résolution et la cadence que la caméra fournit réellement, sonde les résolutions qu'elle gère vraiment en les demandant une à une et en mesurant le résultat, et mesure votre micro en dBFS avec maintien de crête, détection de saturation et de silence.",
  "footer_seo_paragraph2": "Rien ne tourne tout seul : chaque test a son bouton et ne demande l'autorisation qu'au moment où vous appuyez, si bien qu'ouvrir la page n'allume aucune caméra. L'aperçu, le vumètre et l'enregistrement restent dans l'onglet, la liste des appareils se rafraîchit d'elle-même quand vous branchez quelque chose, et le panneau système se relit au redimensionnement de la fenêtre ou à la rotation de l'appareil au lieu d'afficher ce qui était vrai au chargement.",
  "footerCredit": "Fait partie de la suite oLoveTools",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "Copié !",
  "contactForIdeas": "Contact pour idées et commentaires :",
  "footerTagline": "Testez caméra, micro, haut-parleurs, écran, clavier et pointeur, avec les vrais chiffres de chacun. Tout reste dans votre navigateur."
};
