export default {
  "title": "HashBolt",
  "badge": "Sommes de contrôle et intégrité",
  "description": "Calculez MD5, SHA-1, SHA-256, SHA-512, SHA-3, BLAKE3 ou CRC-32 pour des fichiers de n'importe quelle taille ou pour du texte, puis comparez au condensé publié par l'éditeur. Le fichier est traité par morceaux dans votre navigateur et n'est jamais envoyé.",
  "seo_title": "HashBolt | Générateur et vérificateur en ligne de MD5, SHA-256, SHA-512 et BLAKE3",
  "seo_description": "Générez et vérifiez des sommes de contrôle dans votre navigateur : MD5, SHA-1, SHA-256, SHA-384, SHA-512, SHA-3, BLAKE2b, BLAKE3, RIPEMD-160, CRC-32, xxHash et HMAC. Fichiers de plusieurs gigaoctets, traitement par lots et vérification SHA256SUMS. Rien n'est envoyé.",
  "modeFile": "Fichiers",
  "modeText": "Texte",
  "modeCompare": "Comparer",
  "dropTitle": "Déposez vos fichiers ici",
  "dropHint": "N'importe quel type, n'importe quelle taille, autant que vous voulez. Rien n'est lu avant que vous n'appuyiez sur Calculer.",
  "browseBtn": "Choisir des fichiers",
  "folderBtn": "Dossier entier",
  "pasteHint": "ou collez avec Ctrl+V",
  "queueTitle": "File d'attente ({count})",
  "clearBtn": "Vider",
  "removeBtn": "Retirer",
  "statusQueued": "en attente",
  "statusCancelled": "arrêté",
  "staleNotice": "réglages modifiés",
  "pendingCount": "{count} restant(s) à calculer",
  "computeBtn": "Calculer les empreintes",
  "computeAgainBtn": "Recalculer",
  "cancelBtn": "Arrêter",
  "algoTitle": "Algorithmes",
  "algoNone": "Aucun sélectionné",
  "algoHint": "Cochez-en autant que nécessaire : le fichier n'est lu qu'une fois et tous les condensés sont calculés sur ce même passage.",
  "groupChecksum": "Sommes de contrôle et héritage",
  "groupSha2": "Famille SHA-2",
  "groupModern": "Modernes",
  "brokenTag": "Les collisions sont réalisables : utile contre la corruption, inutile contre la falsification",
  "outputTitle": "Sortie",
  "formatHex": "Hex",
  "formatBase64": "Base64",
  "formatBase64Url": "Base64URL",
  "uppercaseLabel": "MAJUSCULES",
  "groupedLabel": "Groupé",
  "hmacTitle": "HMAC (empreinte à clé)",
  "hmacHint": "Signe le contenu avec un secret partagé : le condensé ne sert à rien à qui n'a pas la clé.",
  "hmacPlaceholder": "Clé secrète",
  "hmacSkipped": "{algos} n'ont pas de mode HMAC et sont ignorés.",
  "textLabel": "Texte à hacher",
  "textPlaceholder": "Tapez ou collez n'importe quoi — le condensé se met à jour au fil de la frappe.",
  "textHint": "Hacher du texte n'est pas hacher un fichier qui le contient : un saut de ligne final ou un CRLF Windows change le résultat.",
  "normalizeEolLabel": "Normaliser les fins de ligne Windows (CRLF → LF)",
  "compareHint": "Deux empreintes, aucun fichier. Collez celle publiée par l'éditeur et celle qu'on vous a donnée — hex ou Base64, majuscules ou minuscules.",
  "compareA": "Empreinte A",
  "compareB": "Empreinte B",
  "compareEqual": "Identiques. Le même condensé, quelle que soit la notation de chaque côté.",
  "compareDifferent": "Différentes. Elles décrivent des contenus distincts.",
  "compareInvalid": "L'une des deux n'est ni du hex ni du Base64 valide.",
  "resultsTitle": "Condensés",
  "resultsEmpty": "Mettez un fichier en file, cochez les algorithmes voulus et appuyez sur Calculer.",
  "resultsEmptyText": "Commencez à écrire, les condensés apparaîtront ici.",
  "resultsEmptyCompare": "Le mode comparaison ne calcule rien : il vous dit seulement si deux condensés sont la même valeur.",
  "copyBtn": "Copier",
  "copyAllBtn": "Tout copier",
  "downloadSumsBtn": "Télécharger le fichier SUMS",
  "verifyTitle": "Vérifier contre une somme de contrôle",
  "verifyPlaceholder": "Collez une empreinte, ou un fichier SHA256SUMS entier — les lignes sont appariées par nom de fichier.",
  "verifyHint": "Hex et Base64 fonctionnent, dans n'importe quelle casse. Une longueur qu'aucun algorithme coché ne produit vous est signalée au lieu d'être annoncée comme une non-concordance.",
  "verifySummary": "{count} somme(s) lue(s) · {ok} vérifiée(s) · {bad} en écart",
  "verifyMatch": "Concordance — le même condensé {algo}.",
  "verifyMismatch": "Aucune concordance. Ce fichier n'est pas celui que décrit cette somme de contrôle.",
  "verifyUnknownLength": "Cette longueur ne correspond à aucun des algorithmes cochés. Cochez le bon puis relancez le calcul.",
  "nextStepTitle": "Continuez",
  "nextStepHint": "Le même fichier vous suit — sans le renvoyer",
  "nextZip": "Le zipper",
  "nextCompress": "Le compresser",
  "nextFormat": "Changer de format",
  "nextExif": "Effacer les métadonnées",
  "nextCrop": "Le recadrer",
  "nextPdf": "Le découper ou le fusionner",
  "nextFrames": "Extraire une image",
  "nextAudio": "Le couper ou le convertir",
  "howItWorksTitle": "Comment ça marche",
  "step1Title": "Mettez en file ce que vous voulez vérifier",
  "step1Text": "Déposez des fichiers, prenez un dossier entier, collez-en un, ou passez à l'onglet texte. Rien n'est encore lu.",
  "step2Title": "Choisissez les algorithmes",
  "step2Text": "Un seul ou une douzaine. Ils partagent un unique passage sur le fichier : trois condensés coûtent à peine plus qu'un.",
  "step3Title": "Appuyez sur Calculer",
  "step3Text": "Le fichier est lu par morceaux dans un worker : la barre de progression est réelle et une image disque de 20 Go n'atterrit jamais en mémoire.",
  "step4Title": "Comparez avec la valeur publiée",
  "step4Text": "Collez une empreinte ou un fichier SUMS complet. La comparaison porte sur la valeur, pas sur la façon dont elle était écrite.",
  "features": [
    {
      "title": "Il lit en flux, il n'avale pas",
      "text": "Les fichiers sont lus par morceaux dans un worker : la mémoire reste plate et la barre suit les octets réellement hachés. Une ISO de plusieurs gigaoctets est ici un cas ordinaire."
    },
    {
      "title": "Douze condensés, une seule lecture",
      "text": "MD5, SHA-1, SHA-256/384/512, SHA3-256/512, BLAKE2b, BLAKE3, RIPEMD-160, CRC-32 et xxHash64, tous alimentés par le même passage sur le fichier."
    },
    {
      "title": "Une vérification qui s'explique",
      "text": "Collez une empreinte ou une liste SHA256SUMS entière. La comparaison se fait par valeur entre hex et Base64, et une longueur qui n'appartient à aucun algorithme coché est signalée comme telle plutôt qu'annoncée comme un écart."
    },
    {
      "title": "Dossiers et lots",
      "text": "Mettez cent fichiers en file, hachez-les l'un après l'autre, puis exportez un fichier SUMS compatible coreutils à publier à côté de votre téléchargement."
    },
    {
      "title": "HMAC et toutes les notations",
      "text": "Condensés HMAC à clé, sortie hex, Base64 et Base64URL, majuscules et affichage groupé. Changer l'une de ces options réaffiche instantanément au lieu de relire le fichier."
    },
    {
      "title": "Rien n'est envoyé",
      "text": "Le moteur est du WebAssembly embarqué dans la page elle-même. Aucun CDN, aucune API, aucun envoi : débranchez le réseau après le chargement, ça marche toujours."
    }
  ],
  "seoHeroTitle": "Vérifiez un téléchargement avant de lui faire confiance",
  "seoHeroText": "Une somme de contrôle est le seul moyen économique de savoir que l'installeur que vous venez de télécharger est bien, octet pour octet, celui qui a été publié, et non un transfert tronqué ou un miroir substitué. HashBolt calcule cette empreinte localement : les fichiers traversent un moteur WebAssembly par morceaux, la taille cesse donc d'être une limite, et chaque algorithme coché est alimenté par la même lecture. Vous collez ensuite la valeur publiée — une empreinte seule, une liste SHA256SUMS, une ligne au format BSD — et vous obtenez un verdict qui précise quel algorithme a concordé.",
  "seoHeroList": [
    "Des fichiers de toute taille",
    "Douze algorithmes en un passage",
    "Vérification SHA256SUMS",
    "Fonctionne hors ligne une fois chargé"
  ],
  "seoBrowserSpeedTitle": "Un moteur WebAssembly dans un worker",
  "seoBrowserSpeedText": "Le calcul tourne hors du fil principal sur du WebAssembly compilé, un ordre de grandeur plus rapide que le JavaScript écrit à la main que la plupart des outils en ligne utilisent encore pour MD5. Comme le fichier est consommé en flux, le pic mémoire vaut un morceau et non le fichier entier, et l'interface reste réactive pendant la lecture d'une archive de 4 Go.",
  "seoSecondaryTitle": "Ce qu'une somme de contrôle prouve, et ce qu'elle ne prouve pas",
  "seoUseCaseTitle": "Téléchargements, sauvegardes et doublons",
  "seoUseCaseText": "Vérifiez une ISO Linux ou un installeur contre l'empreinte de la page officielle. Confirmez qu'un fichier copié sur un disque externe est arrivé intact. Repérez deux fichiers identiques sous des noms différents en comparant les condensés plutôt qu'en les ouvrant. Et produisez un fichier SUMS à joindre à votre propre publication pour que d'autres en fassent autant.",
  "seoPrivacyTitle": "Il ne peut pas divulguer ce qu'il n'envoie jamais",
  "seoPrivacyText": "Cet outil n'a aucun point d'envoi, et le calcul n'implique aucune requête réseau : le module WebAssembly est embarqué dans la page, il fonctionne donc connexion coupée. Vos fichiers, votre texte et toute clé HMAC saisie restent dans l'onglet et disparaissent à sa fermeture.",
  "seoKeywordsTitle": "Mots-clés",
  "seoKeywords": [
    "Générateur MD5 en ligne",
    "Somme de contrôle SHA-256",
    "Vérifier l'empreinte d'un fichier",
    "Vérificateur SHA256SUMS",
    "BLAKE3 en ligne",
    "Calculateur CRC-32",
    "Générateur HMAC",
    "Contrôle d'intégrité de fichier"
  ],
  "faqTitle": "Questions fréquentes",
  "faq": [
    {
      "question": "Mon fichier est-il envoyé quelque part ?",
      "answer": "Non. Le moteur de hachage est du WebAssembly embarqué dans la page et il s'exécute dans un worker de votre navigateur. Il n'y a ni point d'envoi, ni appel d'API, ni requête vers un CDN : l'outil continue de fonctionner réseau débranché."
    },
    {
      "question": "Quelle taille de fichier peut-il traiter ?",
      "answer": "Il n'y a pas de plafond fixe : le fichier est consommé en flux par petits morceaux, un seul morceau est donc en mémoire à la fois et les images disque de plusieurs gigaoctets sont banales. Ce qui vous limite en pratique, c'est la vitesse de lecture de votre disque — précisément ce qu'affiche l'indicateur de débit."
    },
    {
      "question": "Comment vérifier une ISO ou un installeur téléchargé ?",
      "answer": "Mettez le fichier en file, cochez l'algorithme utilisé par l'éditeur (SHA-256 dans la quasi-totalité des cas), appuyez sur Calculer et collez la valeur publiée dans la zone de vérification. Vous pouvez aussi coller le fichier SHA256SUMS entier : les lignes sont appariées à vos fichiers par nom."
    },
    {
      "question": "Pourquoi MD5 porte-t-il un avertissement ?",
      "answer": "Parce qu'il est aujourd'hui bon marché de fabriquer deux fichiers différents ayant le même condensé MD5, et c'est aussi vrai de SHA-1. Ils restent parfaitement adaptés à la détection d'un transfert corrompu — l'usage habituel d'une somme sur une page de téléchargement — mais ne prouvent rien face à quelqu'un qui a modifié le fichier volontairement."
    },
    {
      "question": "Mon empreinte ne correspond pas à celle du site. Que faire ?",
      "answer": "Vérifiez d'abord que vous comparez le même algorithme : une empreinte de 64 caractères peut être du SHA-256, du SHA3-256, du BLAKE2b ou du BLAKE3, et l'outil vous indique lequel a concordé. Retéléchargez ensuite le fichier : un vrai écart vient le plus souvent d'un transfert interrompu ou d'un miroir défectueux. Si cela persiste avec un téléchargement neuf, n'exécutez pas le fichier."
    },
    {
      "question": "Pourquoi hacher du texte ne donne pas le même résultat que le fichier correspondant ?",
      "answer": "Parce qu'un fichier porte souvent ce que la zone de texte n'a pas : un saut de ligne final, des fins de ligne CRLF Windows ou une marque BOM UTF-8. L'outil hache exactement les octets fournis, et un interrupteur permet de normaliser CRLF en LF quand il faut retrouver une valeur produite sous Linux."
    },
    {
      "question": "À quoi sert HMAC ?",
      "answer": "Une empreinte simple prouve que le contenu n'a pas changé par accident, mais n'importe qui peut la recalculer. Un HMAC mêle une clé secrète au condensé : seul le détenteur de la clé peut produire ou vérifier la valeur. C'est ce qu'utilisent les signatures d'API et la vérification des webhooks."
    }
  ],
  "footerTagline": "Générateur et vérificateur de sommes de contrôle gratuit pour fichiers et texte, entièrement dans votre navigateur.",
  "footerCredit": "Fait partie de la suite oLoveTools"
};
