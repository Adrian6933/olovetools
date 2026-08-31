export default {
  "title": "Base64Bolt",
  "seo_title": "Base64Bolt | Encodeur et décodeur Base64 avec inspecteur d'octets",
  "seo_description": "Encodez du texte ou n'importe quel fichier en Base64, décodez une charge utile pour récupérer le vrai fichier, lisez les octets en hexadécimal, passez à l'alphabet compatible URL, retirez le remplissage et coupez à 76 colonnes. Gratuit et entièrement dans votre navigateur.",
  "seoHeroTitle": "Base64 Encoder, Decoder & Inspector",
  "badge": "Boîte à outils Base64",
  "description": "Encodez n'importe quel fichier — pas seulement des images — avec l'alphabet, le remplissage et la largeur de ligne que le destinataire attend vraiment. Décodez une charge utile et découvrez ce qu'elle est réellement : le format lu dans ses octets magiques, les premiers octets en hexadécimal, sa taille après gzip et son SHA-256.",
  "heroPoints": [
    "N'importe quel type de fichier",
    "Alphabet compatible URL",
    "Inspecteur hexadécimal"
  ],

  "tab_text": "Texte",
  "tab_file": "Fichier vers Base64",
  "tab_decode": "Base64 vers fichier",

  "optionsTitle": "Sortie",
  "alphabetStandard": "A-Z a-z 0-9 + /",
  "alphabetUrl": "Compatible URL - _",
  "alphabetStandardHint": "L'alphabet standard de la RFC 4648 : + et / pour les deux dernières valeurs.",
  "alphabetUrlHint": "L'alphabet compatible URL : - et _ à la place de + et /, pour que la charge utile traverse intacte une chaîne de requête, un nom de fichier ou un JWT.",
  "padding": "Remplissage =",
  "paddingHint": "La série de = complète la sortie jusqu'à un multiple de quatre caractères. La retirer est légal et c'est ce que font les JWT, mais certains analyseurs stricts l'exigent encore.",
  "wrap": "Couper",
  "wrapNone": "non",
  "crlfHint": "Coupe les lignes avec CRLF au lieu de LF, ce que MIME et PEM spécifient réellement.",
  "charset": "Jeu de caractères",
  "engineNative": "Moteur natif",
  "engineFallback": "Moteur de compatibilité",
  "engineNativeHint": "Votre navigateur convertit les octets lui-même, en un seul appel au niveau du moteur.",
  "engineFallbackHint": "Votre navigateur n'a pas de conversion Base64 native, la charge utile est donc traitée par blocs de 32 Ko. Même résultat, un peu plus lent.",

  "mode_encode": "Encoder",
  "mode_decode": "Décoder",
  "altHint": "Maintenez Alt pour voir l'opération inverse",
  "holdCompare": "Maintenez pour voir votre entrée",
  "undo": "Annuler",
  "redo": "Rétablir",
  "loadSample": "Charger un exemple",
  "button_clear": "Tout effacer",
  "cancel": "Arrêter",
  "runBtn": "Exécuter",
  "encodeBtn": "Encoder en Base64",
  "decodeBtn": "Décoder",
  "downloadTxt": "Télécharger en .txt",
  "openTextFile": "Ouvrir un .txt / .b64",
  "copied": "Copié !",
  "copyFailed": "Votre navigateur a bloqué l'accès au presse-papiers",
  "tooltip_copy": "Copier dans le presse-papiers",
  "chars": "car.",

  "label_input": "Texte brut",
  "label_base64_input": "Chaîne Base64",
  "label_base64_output": "Base64",
  "label_decoded_output": "Texte décodé",
  "label_showing_input": "Votre entrée",
  "label_stage_file": "Choisissez un fichier",
  "label_snippet": "Prêt à coller",
  "label_decoded": "Ce qui est sorti",
  "placeholder_encode": "Tapez ou collez le texte à encoder…",
  "placeholder_decode": "Collez une chaîne Base64 ou une URL data:…",
  "placeholder_decode_file": "Collez une charge utile Base64 ou une URL data: complète…",
  "placeholder_output": "Le résultat apparaît ici…",
  "placeholder_file_output": "Préparez un fichier et appuyez sur Encoder pour obtenir l'extrait.",
  "placeholder_decoded": "Collez une charge utile pour voir ce qu'elle est vraiment.",
  "previewTruncated": "Les {0} premiers caractères sont affichés. Copier et télécharger utilisent le résultat complet.",
  "bigInputHint": "Cette entrée est volumineuse, elle n'est donc pas réencodée à chaque frappe. Appuyez sur Exécuter quand vous voulez.",

  "file_drag": "Déposez ici n'importe quel fichier, ou cliquez pour le choisir",
  "file_formats": "Tout type de fichier : images, polices, PDF, WASM. Jusqu'à {0}.",
  "willProduce": "produira environ {0} caractères",
  "nothingAutomatic": "Rien n'a encore été lu. Choisissez vos options, puis appuyez sur Encoder.",
  "optionsChanged": "Les options ont changé depuis cette exécution. Appuyez de nouveau sur Encoder.",

  "statBytes": "Charge utile",
  "statChars": "Base64",
  "statOverhead": "Taille vs source",
  "statGzip": "Avec gzip",
  "statFormat": "Détecté",
  "statAlphabet": "Alphabet",
  "statRoundTrip": "Aller-retour",
  "statTime": "Durée",
  "roundTripOk": "Réversible",
  "roundTripFail": "Non réversible",

  "sha256Title": "SHA-256 des octets d'origine",
  "sha256TitleDecoded": "SHA-256 des octets décodés",
  "sha256Hint": "Comparez-le après un décodage ailleurs pour prouver que rien n'a été perdu en route.",
  "hexTitle": "Premiers octets",
  "hexEmpty": "Pas encore d'octets.",
  "hexTruncated": "Affichage des {0} premiers sur {1}.",
  "mimeOverrideTitle": "Traiter comme",
  "mimeMismatch": "L'URL data: annonce {0}, les octets disent {1}.",
  "noPreview": "Ce format n'a pas d'aperçu dans le navigateur. Téléchargez-le ou envoyez-le vers un autre outil.",

  "issuesTitle": "Ce que nous avons remarqué",
  "issue_invalid-char": "Le caractère {0} à la position {1} ne fait pas partie de l'alphabet Base64 ; il a été ignoré.",
  "issue_whitespace-stripped": "{0} sauts de ligne ou espaces ont été retirés avant le décodage.",
  "issue_padding-added": "Il manquait un groupe complet à la charge utile, donc {0} caractère(s) de remplissage ont été supposés.",
  "issue_non-canonical": "Le dernier caractère ({0}) porte des bits qui sont jetés. Aucun encodeur ne produit cela : la chaîne est probablement tronquée ou modifiée à la main.",
  "issue_mixed-alphabet": "L'entrée mélange les deux alphabets (+ / et - _). Elle a été décodée comme du Base64 standard.",
  "issue_data-url": "Un préfixe d'URL data: déclarant {0} a été retiré avant le décodage.",
  "issue_lost_surrogate": "{0} demi-codet(s) isolé(s) ne pouvaient pas être représentés en UTF-8 et ont été remplacés.",

  "error_bad-length": "Cette charge utile dépasse d'un caractère un groupe complet de quatre. Six bits isolés ne font pas un octet, la fin est donc irrécupérable : la chaîne est tronquée.",
  "error_undecodable": "Ces caractères ne forment pas un Base64 valide.",
  "error_not-base64-data-url": "Cette URL data: est encodée en pourcentages, pas en Base64 : il n'y a rien à décoder ici.",
  "error_not-utf8": "Le Base64 est valide, mais les octets derrière ne sont pas du texte UTF-8 — ce sont des données binaires. Utilisez l'onglet Base64 vers fichier pour voir ce que c'est, ou passez le jeu de caractères à Latin-1.",
  "error_too-large": "Cette charge utile est trop grande pour que votre navigateur la garde en une seule chaîne.",
  "error_crashed": "L'encodeur a échoué sur ce fichier.",
  "error_no-input": "Il n'y a rien de préparé à encoder.",
  "errorTooBig": "Ce fichier pèse {0} ; la limite est de {1}.",

  "nextStepTitle": "Continuez",
  "nextStepHint": "Le résultat voyage avec vous — aucun téléchargement, aucun renvoi",
  "nextCompress": "Le compresser",
  "nextCrop": "Le recadrer",
  "nextFavicon": "En faire un favicon",
  "nextHash": "Le hacher",
  "nextJson": "Ouvrir le JSON",
  "nextUrl": "L'encoder pour une URL",
  "nextDiff": "Comparer deux versions",
  "nextCodecard": "En faire une image",

  "howItWorksTitle": "Comment ça marche",
  "step1Title": "Amenez la charge utile",
  "step1Text": "Tapez-la, collez-la, déposez un fichier de n'importe quel type, ou laissez un autre outil de la suite vous la transmettre. Déposer un fichier ne lit encore rien.",
  "step2Title": "Choisissez la sortie",
  "step2Text": "Alphabet standard ou compatible URL, remplissage oui ou non, coupé à 64, 76 ou 100 colonnes en LF ou CRLF. Ce sont exactement les points sur lesquels les analyseurs réels ne s'accordent pas.",
  "step3Title": "Regardez les octets",
  "step3Text": "Le format est lu dans les nombres magiques, pas deviné d'après le nom. Vous obtenez le vidage hexadécimal, la taille après gzip, le SHA-256 et une vérification de réversibilité.",
  "step4Title": "Emportez-le",
  "step4Text": "Copiez la chaîne brute, une URL data:, une règle CSS, une balise img, un corps JSON ou un bloc PEM — ou envoyez le fichier décodé directement vers un autre outil.",

  "features": [
    {
      "title": "Trois octets, quatre caractères",
      "text": "Base64 coûte toujours 33 % de plus que les octets qu'il transporte, et l'outil affiche les deux chiffres plus la taille après gzip, car sur les charges proches du texte gzip récupère presque tout, et sur un PNG presque rien."
    },
    {
      "title": "Alphabet compatible URL",
      "text": "Passez à - et _ et la charge utile survit à une chaîne de requête, un nom de fichier ou un JWT sans rien à échapper. Le remplissage peut aussi être retiré, ce qu'attendent les formats de jeton."
    },
    {
      "title": "Inspecteur hexadécimal",
      "text": "Voyez les vrais octets, seize par ligne, avec l'ASCII imprimable à côté. Le nombre magique est mis en évidence, donc un fichier tronqué se trahit immédiatement."
    },
    {
      "title": "Il vous dit ce qui a cassé",
      "text": "Quel caractère n'est pas dans l'alphabet et à quelle position, si le remplissage manquait, si le dernier caractère porte des bits jetés. Pas un simple « Base64 invalide »."
    },
    {
      "title": "Format lu dans les octets",
      "text": "PNG, JPEG, GIF, WebP, AVIF, HEIC, PDF, ZIP et les formats Office qu'il contient, WOFF2, MP4, WASM, SQLite et d'autres, identifiés par leur signature — pour que le téléchargement porte la bonne extension."
    },
    {
      "title": "Les gros fichiers restent fluides",
      "text": "Les fichiers sont consommés par blocs de 3 Mo sur un fil séparé, avec une vraie barre de progression et un bouton Arrêter qui fonctionne. L'onglet continue de répondre pendant la conversion d'une charge de 200 Mo."
    },
    {
      "title": "Mesurable, pas seulement produit",
      "text": "Chaque exécution fournit la taille après gzip et le SHA-256, calculés sur les mêmes octets. C'est ainsi que vous décidez si l'intégration bat une seconde requête, et que vous prouvez que l'aller-retour n'a rien perdu."
    },
    {
      "title": "Vérification de réversibilité",
      "text": "Chaque encodage de texte est immédiatement redécodé et comparé octet par octet, donc une combinaison d'alphabet et de remplissage que votre destinataire refuserait est signalée avant que vous ne la collez."
    }
  ],

  "seoSecondaryTitle": "La charge utile, pas seulement la chaîne",
  "seoHeroText": "La plupart des outils Base64 vous donnent une chaîne et s'arrêtent là. Celui-ci garde les octets : il identifie le format par sa signature, vide le premier kilo-octet en hexadécimal, mesure ce que la charge utile coûte réellement après gzip, la hache pour que vous puissiez prouver l'aller-retour, et vous dit précisément quel caractère à quelle position a cassé une charge au lieu d'accuser l'ensemble. À l'encodage il accepte n'importe quel fichier — une police, un PDF, un module WebAssembly — parce que Base64 n'a jamais concerné seulement les images.",
  "seoHeroList": [
    "Alphabets standard et compatible URL",
    "Remplissage optionnel, coupe à 64/76/100 colonnes",
    "Détection de format par octets magiques",
    "Taille après gzip et SHA-256"
  ],
  "seoBrowserSpeedTitle": "Rien ne quitte votre navigateur",
  "seoBrowserSpeedText": "L'encodage, le décodage, la détection de format, le vidage hexadécimal, la mesure gzip et le SHA-256 sont tous des API natives du navigateur exécutées dans votre propre onglet, sur un fil séparé pour tout ce qui est volumineux. Il n'y a ni envoi, ni requête, ni rien à journaliser — et cela compte, car les charges que l'on colle dans un outil Base64 sont couramment des clés privées, des jetons de session et des documents internes.",
  "seoUseCaseTitle": "Conçu pour les charges utiles qui arrivent sans étiquette",
  "seoUseCaseText": "Un blob sorti d'une colonne de base de données sans aucun type MIME noté nulle part. Un segment de JWT qui refuse de se décoder parce qu'il utilise l'alphabet compatible URL et n'a pas de remplissage. Un SVG intégré dans une feuille de style qui s'affiche comme une image cassée. Une URL data: qui annonce image/png alors que les octets sont clairement un JPEG. Un certificat coupé à 64 colonnes qu'un analyseur strict refuse. Base64Bolt les lit tous, dit ce que sont vraiment les octets, et vous laisse sortir le résultat en fichier avec la bonne extension.",
  "seoPrivacyTitle": "Sans compte, sans limite, sans envoi",
  "seoPrivacyText": "Pas d'inscription, pas de quota journalier, pas d'offre payante qui cache la moitié utile de l'outil. Les fichiers que vous ouvrez sont lus localement et ne sont jamais transmis ; l'onglet oublie tout à la fermeture.",
  "seoKeywordsTitle": "Recherches associées",
  "seoKeywords": [
    "encodeur base64",
    "décodeur base64",
    "fichier vers base64",
    "base64 vers fichier",
    "convertisseur data url",
    "décodeur base64url",
    "image vers base64",
    "base64 vers image",
    "décoder base64 en ligne",
    "visionneuse hexadécimale base64"
  ],

  "faqTitle": "Questions fréquentes",
  "faq": [
    {
      "question": "Pourquoi mon JWT ou mon jeton échoue-t-il ailleurs mais fonctionne ici ?",
      "answer": "Parce qu'il utilise l'alphabet compatible URL — tiret et tiret bas au lieu de plus et barre oblique — et que son remplissage a généralement été retiré. Un décodeur qui ne connaît que l'alphabet standard échoue dès le premier tiret. Base64Bolt détecte quel alphabet l'entrée utilise, restaure le remplissage manquant, et vous signale les deux."
    },
    {
      "question": "Base64 agrandit-il mon fichier ?",
      "answer": "Toujours, d'exactement un tiers : trois octets deviennent quatre caractères, plus jusqu'à deux caractères de remplissage. Que cela vous coûte quelque chose dépend de la compression, et c'est pourquoi l'outil affiche la taille après gzip à côté de la taille brute. Intégrer un petit SVG gagne généralement ; intégrer un gros JPEG perd généralement, car il est déjà compressé et Base64 défait une partie de ce travail."
    },
    {
      "question": "Puis-je encoder autre chose qu'une image ?",
      "answer": "Oui, n'importe quel fichier. Des polices pour une règle @font-face, un PDF pour un lien de téléchargement, un module WebAssembly, un ZIP, un extrait audio. L'ancienne limitation aux images était arbitraire : Base64 ne se soucie pas de ce que signifient les octets."
    },
    {
      "question": "Que veut dire « le dernier caractère porte des bits qui sont jetés » ?",
      "answer": "Chaque caractère Base64 contient six bits, mais le dernier groupe d'une charge utile en a souvent besoin de moins. QQ== et QR== décodent tous deux en l'unique octet 0x41, car les quatre derniers bits du R sont jetés. Aucun encodeur ne produit la seconde forme : la voir signifie que la chaîne a été tronquée ou modifiée à la main — bon à savoir avant de faire confiance au résultat."
    },
    {
      "question": "Pourquoi le décodage dit-il que les octets ne sont pas de l'UTF-8 ?",
      "answer": "Parce que ce n'est pas du texte. Base64 transporte des octets, et beaucoup de charges utiles sont des images, des archives ou des clés. L'ancien comportement était d'annoncer « Base64 invalide », ce qui était simplement faux : le Base64 allait très bien. Passez à l'onglet Base64 vers fichier et l'outil identifiera le format et vous laissera le télécharger."
    },
    {
      "question": "Faut-il couper la sortie à 76 colonnes ?",
      "answer": "Seulement si quelque chose en aval l'attend. Les corps MIME et les blocs PEM sont coupés par spécification — PEM à 64 colonnes, MIME à 76 — et certains analyseurs de courrier refusent une seule ligne énorme. Pour une URL data: dans une feuille de style ou un champ JSON, laissez la coupe désactivée."
    },
    {
      "question": "Quelque chose est-il envoyé à un serveur ?",
      "answer": "Non. Chaque étape est une API native du navigateur exécutée dans votre onglet, donc l'outil continue de fonctionner hors ligne une fois la page chargée. Rien n'est envoyé, mis en cache à distance ou journalisé."
    }
  ],

  "footerTagline": "Encodez n'importe quel fichier en Base64 et décodez n'importe quelle charge utile : alphabet compatible URL, remplissage optionnel, inspecteur hexadécimal et détection de format par octets magiques, entièrement dans votre navigateur.",
  "footerCredit": "Fait partie de la suite oLoveTools",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "Copié !",
  "contactForIdeas": "Contactez pour des idées et des commentaires :"
};
