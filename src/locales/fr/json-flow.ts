export default {
  "tree_rows_one": "{0} ligne",
  "tree_hits_one": "{0} correspondance",
  "query_matches_one": "{0} correspondance",
  "emailCopied": "Copié !",
  "contactForIdeas": "Contact pour idées et commentaires :",
  "copyPath": "Copier le chemin",
  "copyValue": "Copier la valeur",
  "copyBranch": "Copier toute la branche",
  "resetHint": "Recommencer",
  "title": "JSONFlow",
  "description": "Validez, explorez et convertissez du JSON dans le navigateur : position exacte de l'erreur, arborescence pliable qui tient sur de gros fichiers, requêtes JSONPath et export vers CSV, XML, YAML, JSON Schema ou TypeScript.",

  // Actions
  "beautify": "Mettre en forme",
  "minify": "Minifier",
  "sort_keys": "Trier les clés",
  "sort_none": "Ordre d'origine",
  "sort_asc": "Clés A → Z",
  "sort_desc": "Clés Z → A",
  "clear": "Effacer",
  "load_mock": "Charger un exemple",
  "copy": "Copier",
  "copied": "Copié !",
  "undo": "Annuler",
  "redo": "Rétablir",
  "close": "Fermer",
  "shortcuts": "Raccourcis clavier",
  "open_file": "Ouvrir un fichier",
  "copy_source": "Copier la source",
  "download_json": "Télécharger .json",
  "reset_view": "Réinitialiser la vue",
  "parse_btn": "Analyser",
  "repair_btn": "Réparer",
  "unescape_btn": "Déséchapper",
  "jsonl_btn": "Fusionner les JSON Lines",

  // Indentation
  "indentation": "Retrait",
  "indent_2_spaces": "2 espaces",
  "indent_4_spaces": "4 espaces",
  "indent_tabs": "Tabulations",

  // Validation
  "status_valid": "JSON valide",
  "status_invalid": "JSON non valide : ",
  "status_empty": "Rien n'est encore chargé.",
  "status_checking": "Validation hors du fil principal…",
  "error_at": "ligne {0}, colonne {1}",
  "jump_to_error": "Y aller",
  "warnings_title": "{0} points à connaître",
  "empty_placeholder": "Collez du JSON ici, déposez un fichier ou chargez un exemple…",
  "drop_file_prompt": "Déposez un fichier .json, .jsonl, .csv ou .tsv",
  "editor_title": "Texte source",
  "fix_first": "Corrigez l'erreur à gauche et les panneaux se rempliront.",
  "press_parse": "Appuyez sur Analyser pour construire l'arborescence de ce document.",

  // Constats de l'analyseur
  "issueSyntax": "Erreur de syntaxe",
  "issueDuplicateKey": "Clé en double",
  "issuePrecision": "Nombre trop grand pour JavaScript",
  "issueDepth": "Imbrication trop profonde",
  "issueTrailingComma": "Virgule superflue",
  "issueComment": "Commentaire",
  "issueSingleQuote": "Chaîne entre apostrophes",
  "issueUnquotedKey": "Clé sans guillemets",
  "issuePythonLiteral": "Littéral Python",
  "issueNonFinite": "Pas un nombre JSON",
  "issueBom": "Marque d'ordre des octets",
  "issueEmpty": "Document vide",

  // Onglets et vues
  "tab_tree_viewer": "Arborescence",
  "tab_formatted_json": "Code",
  "tab_table": "Tableau",
  "tab_convert": "Convertir",
  "tab_schema": "Types",
  "tab_diff": "Comparer",

  // Contrôles de l'arborescence
  "search_placeholder": "Filtrer par clé ou par valeur…",
  "scope_both": "Tout",
  "scope_keys": "Clés",
  "scope_values": "Valeurs",
  "expand_all": "Tout déplier",
  "collapse_all": "Tout replier",
  "depth_label": "Ouvrir jusqu'au niveau",
  "depth_option": "Niveau {0}",
  "depth_all": "Tous les niveaux",
  "no_nodes": "Collez ou déposez du JSON à gauche pour commencer.",
  "no_matches": "Rien ne correspond à cette recherche.",
  "tree_rows": "{0} lignes",
  "tree_hits": "{0} correspondances",
  "tree_mounted": "{0} dans le DOM",
  "tree_capped": "plafond atteint : repliez un niveau pour voir le reste",
  "copy_path": "Copier le chemin",
  "copy_value": "Copier la valeur",
  "locate": "Le montrer dans l'éditeur",
  "stale_notice": "L'éditeur a changé depuis cette construction. Appuyez sur Analyser pour la rafraîchir.",

  // Sortie
  "output_size": "{0} caractères",
  "preview_clipped": "L'aperçu s'arrête à {0} caractères. La copie et le téléchargement vous donnent toujours l'intégralité.",
  "copy_failed": "Le navigateur a refusé l'accès au presse-papiers.",

  // Tableau / CSV
  "flatten_title": "Aplatissement",
  "array_json": "Tableau en JSON",
  "array_expand": "Une colonne par élément",
  "array_join": "Regroupé",
  "separator_label": "Séparateur de chemin",
  "table_summary": "{0} lignes × {1} colonnes. L'aperçu affiche les {2} premières.",
  "table_wrapped": "Le document n'est pas un tableau : il tient donc sur une seule ligne.",
  "export_csv": "Télécharger",
  "export_xml": "Télécharger le XML",
  "import_csv": "CSV ou TSV vers JSON",
  "csv_placeholder": "Collez ici du CSV ou du TSV à convertir en JSON…",
  "convert_csv_btn": "Convertir en JSON",
  "csv_nest": "Reconstruire l'imbrication depuis les en-têtes a.b",
  "csv_nest_hint": "Désactivé volontairement : une colonne first_name doit rester first_name, pas devenir { first: { name } }.",

  // Conversion / types
  "xml_root": "Élément racine",
  "type_name": "Nom",
  "schema_hint": "Déduit de tous les enregistrements, pas seulement du premier : un champ absent de certains ressort en optionnel.",

  // Requêtes
  "query_placeholder": "$.utilisateurs[?(@.age > 30)].nom",
  "query_matches": "{0} correspondances",
  "query_use": "Utiliser comme document",

  // Comparaison
  "diff_hint": "Comparaison par chemin, pas par ligne : réordonner les clés n'apparaît pas comme un changement.",
  "diff_placeholder": "Collez ici l'autre document JSON…",
  "diff_run": "Comparer",
  "diff_identical": "Les deux documents sont structurellement identiques.",
  "diff_added": "Ajouté",
  "diff_removed": "Supprimé",
  "diff_changed": "Modifié",
  "diff_type": "Type",

  // Barre d'exécution / fichiers
  "manual_mode": "Mode manuel",
  "manual_on": "Rien n'est construit tant que vous n'appuyez pas sur Analyser.",
  "manual_off": "Les documents de moins de {0} se construisent pendant la frappe ; les plus gros attendent Analyser.",
  "parked_hint": "Retenu volontairement : charger un fichier de cette taille dans l'éditeur, c'est justement la partie coûteuse.",
  "parked_load": "Le charger",
  "file_too_large": "Ce fichier est trop volumineux pour être ouvert dans un onglet de navigateur.",
  "file_failed": "Ce fichier n'a pas pu être lu.",

  // Statistiques
  "stat_bytes": "Taille",
  "stat_lines": "Lignes",
  "stat_nodes": "Nœuds",
  "stat_depth": "Profondeur",
  "stat_keys": "Clés uniques",
  "stat_time": "Analyse",
  "stat_offthread": "Worker",

  // Notifications
  "toast_csv_loaded": "{0} lignes importées depuis {1}.",
  "toast_jsonl_loaded": "JSON Lines fusionné en un seul tableau.",
  "toast_needs_valid": "Corrigez d'abord l'erreur : il n'y a encore rien à construire.",
  "toast_repaired": "Réparé en JSON strict.",
  "toast_unrepairable": "Ce document est trop abîmé pour être réparé automatiquement.",
  "toast_unescaped": "Le JSON caché dans la chaîne a été déballé.",
  "toast_unescape_failed": "Ce n'est pas une chaîne JSON entre guillemets.",

  // Raccourcis
  "sc_undo": "Annuler",
  "sc_redo": "Rétablir",
  "sc_parse": "Analyser le document",
  "sc_beautify": "Mettre en forme",
  "sc_minify": "Minifier",
  "sc_copy": "Copier la sortie mise en forme",
  "sc_help": "Ce panneau",

  // Enchaînement
  "nextStepTitle": "Continuez",
  "nextStepHint": "Le document vous suit : ni téléchargement ni nouvel envoi",
  "nextDiff": "Le comparer",
  "nextCodecard": "En faire une image de code",
  "nextXml": "XML ⇄ JSON",
  "nextHash": "Calculer son empreinte",
  "nextMarkdown": "Le documenter",

  // Exemples
  "mock_user_profile": "Profil utilisateur",
  "mock_product_catalog": "Catalogue de produits",
  "mock_weather_data": "Prévisions météo",
  "sample_broken": "Configuration cassée (réparable)",
  "sample_bigint": "Identifiants 64 bits",

  // Fonctionnement
  "hero_badge": "Établi",
  "howItWorksTitle": "Comment ça marche",
  "step1Title": "Apportez le JSON",
  "step1Text": "Collez-le, déposez un fichier ou laissez un autre outil vous le transmettre. Rien n'est envoyé, et rien de lourd ne démarre avant votre demande.",
  "step2Title": "Lisez le verdict",
  "step2Text": "Valide, ou la ligne et la colonne exactes qui coincent, plus les clés en double et les nombres que JavaScript ne peut pas représenter.",
  "step3Title": "Explorez-le",
  "step3Text": "Repliez l'arborescence, filtrez par clé ou par valeur, ou lancez une expression JSONPath sur tout le document.",
  "step4Title": "Emportez-le",
  "step4Text": "CSV, XML, YAML, JSON Lines, un JSON Schema, des types TypeScript ou Go, ou envoyez-le directement à un autre outil.",

  "features": [
    {
      "title": "Un vrai analyseur, pas JSON.parse",
      "text": "Les erreurs arrivent avec une ligne, une colonne et la rangée surlignée dans la marge, au lieu d'un décalage de caractères qu'il faut compter à la main."
    },
    {
      "title": "Les identifiants 64 bits survivent",
      "text": "Les longs identifiants numériques sont réécrits chiffre par chiffre. Tout formateur bâti sur JSON.parse les arrondit en silence au double le plus proche."
    },
    {
      "title": "Réparation en un clic",
      "text": "Commentaires, virgules superflues, apostrophes, clés sans guillemets, True/False/None de Python et une marque BOM égarée deviennent du JSON strict."
    },
    {
      "title": "Requêtes JSONPath",
      "text": "Jokers, descente récursive, tranches et filtres comme [?(@.prix > 10)], évalués à la main : rien de ce que vous tapez n'est jamais exécuté."
    },
    {
      "title": "Des types issus de vraies données",
      "text": "JSON Schema, interfaces TypeScript ou structures Go, déduits de tous les enregistrements, si bien qu'un champ parfois absent ressort en optionnel."
    },
    {
      "title": "Un aplatissement honnête",
      "text": "Vous choisissez le séparateur de chemin et le sort des tableaux imbriqués. Les objets vides gardent leur colonne au lieu de disparaître de l'export."
    },
    {
      "title": "Comparaison structurelle",
      "text": "Deux documents comparés chemin par chemin : un ordre de clés différent ne se transforme pas en mille changements."
    },
    {
      "title": "Les gros fichiers restent utilisables",
      "text": "La validation part dans un web worker, l'arborescence ne monte que les lignes visibles et l'historique garde les caractères modifiés, pas une copie du document."
    }
  ],

  // SEO et textes
  "seo_title": "JSONFlow | Formateur, validateur, visualiseur et convertisseur JSON",
  "seo_description": "Mettez en forme, validez et explorez du JSON avec la position exacte de l'erreur et une arborescence qui tient sur les gros fichiers. Convertissez en CSV, XML, YAML ou JSON Lines, générez un JSON Schema et des types TypeScript, et lancez des requêtes JSONPath, le tout dans votre navigateur.",
  "seoHeroTitle": "Format, explore and convert JSON safely.",
  "seoHeroText": "Une réponse d'API transporte des jetons, des données clients et des identifiants internes. JSONFlow n'envoie rien nulle part : l'analyseur, l'arborescence, les requêtes et les exports tournent dans cet onglet, si bien que coller ici une réponse de production reste aussi privé que l'ouvrir dans votre éditeur.",
  "seoHeroList": [
    "100 % local : rien n'est envoyé",
    "Ligne et colonne exactes pour chaque erreur",
    "CSV, XML, YAML, Schema et TypeScript"
  ],
  "seoBrowserSpeedTitle": "Tout tourne dans cet onglet",
  "seoBrowserSpeedText": "L'analyseur, l'arborescence pliable, le moteur JSONPath et chaque export sont du JavaScript ordinaire exécuté sur votre appareil. Aucune étape d'envoi, aucun serveur, aucune requête transportant vos données : coupez la connexion une fois la page chargée et l'outil continue de fonctionner.",
  "seoSecondaryTitle": "L'établi JSON complet pour les développeurs.",
  "seoKeywordsTitle": "Mots-clés",
  "seoKeywords": [
    "formateur JSON",
    "validateur JSON",
    "visualiseur JSON",
    "JSON vers CSV",
    "JSON vers XML",
    "JSON vers YAML",
    "CSV vers JSON",
    "embellisseur JSON",
    "JSONPath",
    "générateur de JSON Schema",
    "JSON vers TypeScript",
    "comparaison JSON",
    "réparation JSON",
    "JSON Lines"
  ],
  "seoUseCaseTitle": "À quoi ça sert",
  "seoUseCaseText": "Trouver la virgule qui casse un fichier de configuration, transformer une réponse d'API en tableur, générer l'interface TypeScript d'un point d'accès que personne n'a documenté, vérifier si deux versions d'une même charge utile diffèrent vraiment, et ouvrir des journaux où le JSON est arrivé emballé dans une chaîne entre guillemets.",
  "seoPrivacyTitle": "Pourquoi le local compte ici",
  "seoPrivacyText": "Une charge utile JSON est rarement anonyme : elle contient des jetons d'accès, des adresses e-mail, des numéros de commande et des points d'accès internes. La coller dans un formateur hébergé, c'est tout remettre au serveur de quelqu'un d'autre. Ici, elle ne quitte pas l'onglet : il n'y a rien à journaliser, à mettre en cache ou à fuiter.",

  "faqTitle": "Questions fréquentes",
  "faq": [
    {
      "question": "Mon JSON est-il envoyé à un serveur ?",
      "answer": "Non. L'analyse, la validation, l'arborescence, les requêtes et tous les exports s'exécutent dans cet onglet du navigateur. Vous pouvez couper le réseau une fois la page chargée : tout continue de fonctionner."
    },
    {
      "question": "Jusqu'à quelle taille de fichier ça tient vraiment ?",
      "answer": "Sur un portable ordinaire, un document de 1,5 Mo comptant 180 000 nœuds s'analyse en bien moins d'un dixième de seconde, et des fichiers de plusieurs dizaines de mégaoctets s'ouvrent encore : la validation part dans un web worker et l'arborescence ne dessine que les lignes visibles. Ce qui vous limite, c'est la mémoire, pas l'outil : au-delà d'environ 100 Mo, un onglet de navigateur peine quel que soit le programme. Tout ce qui dépasse 2 Mo est retenu derrière un bouton au lieu d'être chargé automatiquement, si bien qu'un gros fichier ne fige jamais la page à son arrivée."
    },
    {
      "question": "Pourquoi mes longs identifiants changent-ils dans les autres formateurs ?",
      "answer": "JSON.parse convertit chaque nombre en flottant 64 bits, incapable de représenter exactement les entiers au-delà de 2^53 : un identifiant Twitter, Discord ou Snowflake perd ses derniers chiffres. JSONFlow conserve les chiffres d'origine du texte source et vous avertit dès qu'un nombre entre dans cette plage."
    },
    {
      "question": "Mon fichier contient des commentaires et des virgules superflues. Est-ce un problème ?",
      "answer": "Non. Quand l'analyse stricte échoue, une passe tolérante démarre automatiquement et, si elle réussit, un bouton Réparer apparaît. Il gère les commentaires, les virgules superflues, les apostrophes, les clés sans guillemets, True/False/None de Python, NaN et Infinity, et réécrit le document en JSON strict."
    },
    {
      "question": "Comment fonctionne l'aplatissement de JSON vers CSV ?",
      "answer": "Chaque élément du tableau de premier niveau devient une ligne, et les clés imbriquées deviennent des colonnes pointées du type user.address.city. Vous choisissez le séparateur et le sort des tableaux imbriqués : une colonne chacun, du JSON tel quel, ou un regroupement. Dans l'autre sens, les en-têtes sont pris au pied de la lettre : une colonne first_name reste first_name, sauf si vous demandez explicitement l'imbrication."
    },
    {
      "question": "Qu'est-ce que je peux écrire dans la barre de requête ?",
      "answer": "Un sous-ensemble de JSONPath : $.users[0].name, des jokers avec [*], la descente récursive avec .., des tranches comme [0:5], des index négatifs et des filtres du type [?(@.price > 10)] ou [?(@.name =~ ^a)]. Les expressions sont interprétées à la main, jamais évaluées comme du code."
    }
  ],
  "footerTagline": "Des utilitaires rapides, soignés et privés pour les designers et les développeurs.",
  "footerCredit": "Fait partie de la suite oLoveTools"
};
