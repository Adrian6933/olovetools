export default {
  "resetHint": "Recommencer",
  "title": "Générateur d’UUID",
  "badge": "Identifiants uniques",
  "description": "Générez des UUID v1, v3, v4, v5, v6 et v7, ainsi que des ULID, NanoID et ObjectId MongoDB — par lots, exactement dans la forme attendue par votre code, sans la moindre requête réseau.",
  "seo_title": "Générateur d’UUID | v4, v7, v5, ULID et NanoID en masse",
  "seo_description": "Générateur d’UUID en ligne et gratuit : v1, v3, v4, v5, v6, v7, nil et max, plus ULID, NanoID et ObjectId. Lots massifs, mise en forme configurable et inspecteur octet par octet, le tout dans votre navigateur.",
  "groupUuid": "UUID de la RFC 9562",
  "groupOther": "Autres identifiants",
  "kindHelp_v4": "122 bits d’entropie issus de la source aléatoire cryptographique du navigateur. Le choix par défaut quand il suffit que ce soit unique.",
  "kindHelp_v7": "Un horodatage Unix de 48 bits en millisecondes suivi de bits aléatoires, avec un compteur pour que les identifiants créés dans la même milliseconde restent triés. Le choix moderne pour les clés de base de données.",
  "kindHelp_v1": "Horodatage plus identifiant de nœud. Cet outil utilise un nœud aléatoire avec le bit multicast activé : votre vraie adresse MAC n’est jamais exposée.",
  "kindHelp_v6": "Les champs de v1 réordonnés pour que l’horodatage vienne en premier. Se trie chronologiquement sur les octets bruts, ce que v1 ne fait pas.",
  "kindHelp_v3": "MD5 d’un espace de noms et d’un nom. La même paire donne toujours le même UUID : saisissez un nom par ligne pour obtenir un lot.",
  "kindHelp_v5": "SHA-1 d’un espace de noms et d’un nom. Déterministe comme v3, avec l’empreinte plus solide. Un nom par ligne.",
  "kindHelp_nil": "Les 128 bits à zéro : l’UUID canonique « aucune valeur ».",
  "kindHelp_max": "Les 128 bits à un : la borne supérieure de l’espace UUID, utilisée comme sentinelle.",
  "kindHelp_ulid": "26 caractères en base32 de Crockford : 48 bits de temps et 80 d’aléa, triable alphabétiquement et insensible à la casse.",
  "kindHelp_nanoid": "21 caractères compatibles URL, environ 126 bits d’entropie. Plus court qu’un UUID et utilisable dans une URL sans échappement.",
  "kindHelp_objectid": "L’identifiant de 12 octets que MongoDB place sur chaque document : 4 octets de temps, 5 aléatoires, 3 de compteur.",
  "label_count": "Combien",
  "hint_big_batch": "Au-delà de 10 000 le curseur s’arrête ; saisissez le nombre exact. L’aperçu reste à 300 lignes — la copie et le téléchargement portent toujours sur le lot entier.",
  "label_namespace": "Espace de noms",
  "label_names": "Noms — un par ligne",
  "hint_deterministic": "Le même espace de noms et le même nom produisent toujours le même identifiant : c’est tout l’intérêt de v3 et v5. Pour un lot, donnez-lui un lot de noms.",
  "button_generate": "Générer",
  "button_working": "En cours…",
  "tooltip_undo": "Lot précédent (Ctrl+Z)",
  "tooltip_redo": "Lot suivant (Ctrl+Maj+Z)",
  "button_clear": "Tout effacer",
  "error_invalid_namespace": "Cet espace de noms n’est pas un UUID valide.",
  "error_clipboard": "Le navigateur a refusé l’accès au presse-papiers. Utilisez le bouton de téléchargement.",
  "error_generic": "Un problème est survenu pendant la génération. Essayez un lot plus petit.",
  "error_unrecognised": "Cela ne ressemble pas à un identifiant que cet outil reconnaît.",
  "stat_count": "générés",
  "stat_time": "millisecondes",
  "stat_rate": "par seconde",
  "stat_duplicates": "doublons",
  "empty_state": "Rien n’a encore été généré. Choisissez un type, indiquez la quantité et appuyez sur Générer.",
  "label_showing": "Affichage de {shown} sur {total}",
  "label_uuids_generated": "identifiants",
  "tooltip_copy": "Copier dans le presse-papiers",
  "button_copy_all": "Tout copier",
  "button_copied_all": "Copié",
  "label_format": "Forme de la sortie",
  "placeholder_prefix": "préfixe",
  "placeholder_suffix": "suffixe",
  "label_inspect": "Inspecter et composer",
  "button_load_list": "Charger une liste depuis un fichier",
  "button_blank": "Partir de 16 octets vides",
  "placeholder_inspect": "Collez un UUID, un ULID ou un ObjectId",
  "field_timestamp": "horodatage",
  "byte_version": "octet 6 — quartet de version",
  "byte_variant": "octet 8 — bits de variante",
  "button_now": "maintenant",
  "button_reroll": "Retirer au sort les 8 derniers octets",
  "button_revert": "annuler",
  "button_copy": "Copier",
  "button_use_crafted": "Utiliser comme sortie",
  "imported_summary": "{count} identifiants trouvés dans la liste venue de {from}.",
  "imported_unique": "{n} uniques",
  "imported_inspect": "Inspecter le premier",
  "nextStepTitle": "Continuez",
  "nextStepHint": "La liste vous suit — sans téléchargement ni nouvel envoi",
  "nextDiff": "Comparer deux lots",
  "nextHash": "Calculer son empreinte",
  "nextJson": "Ouvrir en JSON",
  "nextRegex": "Tester un motif",
  "nextZip": "Compresser en ZIP",
  "howItWorksTitle": "Comment ça marche",
  "step1Title": "Choisissez le type",
  "step1Text": "Onze au total, du v4 classique au v7 trié par le temps, en passant par ULID ou un ObjectId Mongo.",
  "step2Title": "Réglez le lot",
  "step2Text": "Combien, et sous quelle forme : casse, tirets, encadrement, préfixe, format d’export.",
  "step3Title": "Appuyez sur générer",
  "step3Text": "Rien ne démarre avant votre clic. Le lot est construit dans un worker et chronométré au dixième de milliseconde.",
  "step4Title": "Emportez-le",
  "step4Text": "Copiez, téléchargez en txt, csv, json ou SQL, ou envoyez la liste directement vers un autre outil.",
  "features": [
    {
      "title": "Onze types d’identifiants",
      "text": "UUID v1, v3, v4, v5, v6, v7, nil et max, plus ULID, NanoID et ObjectId MongoDB."
    },
    {
      "title": "Triés par le temps, monotones",
      "text": "v7, v6 et ULID tiennent un compteur : les identifiants créés dans la même milliseconde gardent leur ordre de création."
    },
    {
      "title": "Il sait aussi les relire",
      "text": "Collez un identifiant pour voir sa version, sa variante, son horodatage, son nœud et ses octets bruts — puis modifiez un seul quartet."
    },
    {
      "title": "Hors du fil principal",
      "text": "Les lots tournent dans un Web Worker, avec le temps de génération exact et un balayage des doublons sur tout le lot."
    },
    {
      "title": "La sortie que vous voulez",
      "text": "Casse, tirets, accolades, urn:uuid:, guillemets, préfixe et suffixe, exportés en txt, csv, json ou SQL."
    },
    {
      "title": "Rien ne quitte l’onglet",
      "text": "Entropie Web Crypto, aucune requête réseau et rien de conservé entre deux visites."
    }
  ],
  "seoHeroTitle": "Tous les formats d’identifiant, générés en local",
  "seoHeroText": "La plupart des générateurs vous donnent un v4 et s’arrêtent là. Celui-ci couvre toute la famille de la RFC 9562, les formats triables qui l’ont remplacée en pratique et les identifiants d’autres écosystèmes, avec une sortie mise en forme exactement comme l’exigent votre migration, votre fichier de données initiales ou votre fixture de test.",
  "seoHeroList": [
    "11 types d’identifiants",
    "Lots jusqu’à 100 000",
    "Inspecteur octet par octet",
    "Zéro requête réseau"
  ],
  "seoBrowserSpeedTitle": "Triables par construction",
  "seoBrowserSpeedText": "Des clés v4 aléatoires éparpillent les écritures dans tout l’index B-tree. v7, v6 et ULID placent le temps en tête : les nouvelles lignes se posent à la fin de l’index au lieu de partout, et cet outil tient un compteur à l’intérieur de chaque milliseconde pour que l’ordre tienne même dans une boucle serrée.",
  "seoSecondaryTitle": "Conçu pour ce qui vient après l’identifiant",
  "seoUseCaseTitle": "Jeux de données, fixtures et migrations",
  "seoUseCaseText": "Générez cent mille clés, exportez-les directement en INSERT SQL ou en tableau JSON, et passez la liste à l’outil de comparaison, d’empreinte ou d’archivage sans passer par le dossier de téléchargements.",
  "seoPrivacyTitle": "Local, et vérifiable",
  "seoPrivacyText": "L’entropie vient de l’API Web Crypto, dans votre onglet. Aucun appel d’API, aucun téléchargement depuis un CDN, aucun WebAssembly récupéré à part : le hachage utilisé par v3 et v5 est intégré à la page, si bien que l’outil fonctionne réseau coupé.",
  "seoKeywordsTitle": "Mots-clés",
  "seoKeywords": [
    "générateur d’uuid",
    "uuid v4 aléatoire",
    "uuid v7 trié par le temps",
    "uuid v5 nommé",
    "générateur de guid",
    "générateur d’ulid",
    "nanoid court",
    "uuid en masse",
    "décodeur d’uuid"
  ],
  "faqTitle": "Questions fréquentes",
  "faq": [
    {
      "question": "Quelle version d’UUID choisir ?",
      "answer": "v4 quand seule l’unicité compte. v7 quand l’identifiant devient une clé primaire, car son horodatage de tête garde les écritures d’index groupées. v5 quand une même entrée doit toujours donner le même identifiant."
    },
    {
      "question": "Pourquoi dix UUID v5 sont-ils identiques ?",
      "answer": "Parce que c’est la définition de v5 : un espace de noms plus un nom donnent un identifiant. Pour en obtenir dix différents, donnez dix noms différents, un par ligne."
    },
    {
      "question": "Quelle différence entre v7 et ULID ?",
      "answer": "Les deux sont un horodatage de 48 bits suivi d’aléa. v7 est un vrai UUID et entre dans une colonne UUID ; ULID fait 26 caractères base32, plus court à lire et insensible à la casse, mais ce n’est pas un UUID."
    },
    {
      "question": "Sont-ils cryptographiquement sûrs ?",
      "answer": "L’aléa provient de crypto.getRandomValues, la source que le navigateur utilise pour son propre matériel de clés. Notez qu’un v1 ou un v7 expose volontairement son heure de création : ce n’est pas un secret."
    },
    {
      "question": "Combien puis-je en générer d’un coup ?",
      "answer": "Jusqu’à 100 000 par lot. La liste affiche les 300 premières lignes pour garder la page réactive ; la copie, le téléchargement et les boutons de transfert portent toujours sur le lot complet."
    },
    {
      "question": "Quelque chose part-il vers un serveur ?",
      "answer": "Non. Génération, inspection et export se font dans votre navigateur, et la page n’émet aucune requête pendant que vous l’utilisez."
    }
  ],
  "footerTagline": "UUID v1 à v7, ULID, NanoID et ObjectId : générés, inspectés et exportés entièrement dans votre navigateur.",
  "footerCredit": "Fait partie de la suite oLoveTools",
  "emailCopied": "Copié !",
  "contactForIdeas": "Contact pour idées et commentaires :",
  "emailAddress": "adrian.contact.me.69@gmail.com"
};
