export default {
  "title": "HTML Sanitizer",
  "seo_title": "HTML Sanitizer | Nettoyeur et assainisseur HTML en ligne avec rapport de suppressions",
  "seo_description": "Nettoyez le HTML avec une véritable politique de liste blanche : supprimez scripts, gestionnaires d’événements, URL javascript: et balises indésirables, puis voyez exactement ce qui a été retiré et remettez ce que vous voulez. Tout dans votre navigateur.",
  "seoHeroTitle": "Nettoyeur et assainisseur HTML",
  "badge": "Assainisseur à liste blanche",
  "description": "Collez du HTML, choisissez une politique et appuyez sur le bouton. Vous obtenez le balisage nettoyé plus un rapport détaillé de chaque balise et attribut écarté — et vous pouvez annuler n’importe quelle décision sans rien recoller.",
  "heroPoints": [
    "Rien ne s’exécute avant votre clic",
    "Chaque suppression est détaillée",
    "Ne quitte jamais votre navigateur"
  ],
  "label_input": "HTML source",
  "label_policy": "Politique de nettoyage",
  "placeholder_input": "Collez votre HTML ici, déposez un fichier .html ou chargez un des exemples. Rien ne s’exécute avant que vous appuyiez sur Assainir.",
  "button_open_file": "Ouvrir un fichier",
  "button_clear": "Tout effacer",
  "button_run": "Assainir",
  "button_working": "Nettoyage…",
  "button_manual": "Manuel",
  "button_undo": "Annuler",
  "button_redo": "Rétablir",
  "button_copy": "Copier",
  "button_copied": "Copié !",
  "button_download": "Télécharger",
  "button_reset": "Réinitialiser",
  "samples_title": "Essayez",
  "sample_messy": "Collage CMS bordélique",
  "sample_attack": "Charges XSS connues",
  "preset_strict": "Strict",
  "preset_strict_hint": "Texte et liens uniquement. Pour tout ce que vous allez stocker.",
  "preset_email": "Compatible e-mail",
  "preset_email_hint": "Les tableaux et le style en ligne survivent ; le scripting non.",
  "preset_content": "Contenu riche",
  "preset_content_hint": "Un corps de CMS : médias, tableaux, data-* et aria-*.",
  "preset_text": "Texte brut",
  "preset_text_hint": "Retire tout le balisage, garde l’ordre de lecture.",
  "preset_custom_active": "Politique personnalisée, modifiée à la main.",
  "stale_hint": "Politique modifiée — relancez",
  "shortcut_hint": "Ctrl+Entrée pour lancer · Ctrl+Z pour annuler un changement de politique",
  "tab_source": "Source nettoyée",
  "tab_preview": "Aperçu",
  "tab_report": "Supprimé",
  "format_pretty": "Formaté",
  "format_min": "Minifié",
  "format_raw": "Tel quel",
  "compare_hold": "Maintenir pour comparer",
  "compare_showing": "Original",
  "output_empty": "Tout a été supprimé — rien n’a survécu à cette politique.",
  "copy_failed": "Votre navigateur a bloqué l’accès au presse-papiers.",
  "stat_size": "taille",
  "stat_elements": "éléments",
  "stat_removed": "supprimés",
  "stat_dangerous": "exécutables",
  "stat_time": "durée",
  "policy_allowed_tags": "Balises autorisées",
  "policy_allowed_attrs": "Attributs autorisés",
  "policy_add_tag": "ajouter une balise…",
  "policy_add_attr": "ajouter un attribut…",
  "policy_no_tags": "Aucune balise autorisée — la sortie sera du texte brut",
  "policy_no_attrs": "Aucun attribut conservé",
  "policy_strip_tags": "Supprimer avec le contenu",
  "policy_strip_hint": "jamais déballées : l’intérieur part aussi",
  "policy_no_strip": "Rien n’est supprimé avec son contenu",
  "policy_unknown": "Balises non autorisées",
  "policy_unwrap": "Déballer — garder le texte intérieur",
  "policy_drop": "Écarter — supprimer tout le sous-arbre",
  "policy_schemes": "Schémas d’URL acceptés",
  "policy_schemes_hint": "tout le reste dans href/src est écarté",
  "policy_data_note": "data:image n’accepte que les formats matriciels. Les URL de données SVG ne sont jamais autorisées : un SVG en ligne exécute son propre <script> à l’ouverture directe.",
  "policy_other": "Attributs et extras",
  "policy_keep_style": "Garder style=\"…\"",
  "policy_keep_class": "Garder class=\"…\"",
  "policy_keep_id": "Garder id / name",
  "policy_keep_comments": "Garder les commentaires",
  "policy_data_attrs": "Garder les attributs data-*",
  "policy_aria_attrs": "Garder aria-* et role",
  "policy_svg_math": "Autoriser <svg> et <math>",
  "policy_harden_links": "Ajouter rel=\"noopener noreferrer\"",
  "policy_strip_target": "Retirer target=\"_blank\"",
  "scheme_https_hint": "Liens et images chiffrés.",
  "scheme_http_hint": "HTTP en clair — acceptable en interne, transite en clair sur le réseau.",
  "scheme_relative_hint": "Chemins et ancres sans schéma : /page, #section, ?q=1.",
  "scheme_mailto_hint": "Liens de courriel.",
  "scheme_tel_hint": "Liens téléphone, SMS et appel direct.",
  "scheme_ftp_hint": "Anciens liens de transfert de fichiers.",
  "scheme_data_hint": "Images intégrées en URL de données. Formats matriciels uniquement.",
  "report_empty": "Rien n’a été supprimé — l’entrée respectait déjà la politique.",
  "report_dangerous": "{0} suppressions auraient pu exécuter du code.",
  "report_on": "sur",
  "report_keep": "Garder",
  "report_kept": "Gardé",
  "report_keep_it": "Garder ceci dans la sortie",
  "report_remove_again": "Le supprimer à nouveau",
  "reason_tag-not-allowed": "Balise absente de la liste blanche",
  "reason_tag-stripped": "Balise supprimée avec son contenu",
  "reason_event-handler": "Gestionnaire d’événement en ligne",
  "reason_attr-not-allowed": "Attribut absent de la liste blanche",
  "reason_bad-scheme": "Schéma d’URL non autorisé",
  "reason_comment": "Commentaire HTML",
  "reason_inline-style": "Attribut style en ligne",
  "reason_class-attr": "Attribut class",
  "reason_id-attr": "Attribut id / name",
  "nextStepTitle": "Continuez",
  "nextStepHint": "Le HTML nettoyé vous suit — pas de nouvel envoi",
  "nextDiff": "Comparer à l’original",
  "nextCodecard": "Créer une image du code",
  "nextWordflow": "Analyser le texte",
  "nextBase64": "Encoder en Base64",
  "nextZip": "Compresser en ZIP",
  "howItWorksTitle": "Comment ça marche",
  "step1Title": "Amenez le HTML",
  "step1Text": "Collez-le, déposez un fichier .html ou arrivez depuis un autre outil. Il attend : ouvrir un fichier ne lance jamais le nettoyage.",
  "step2Title": "Choisissez la politique",
  "step2Text": "Quatre préréglages couvrent les cas courants. Ouvrez le panneau manuel pour modifier vous-même la liste des balises, celle des attributs et les schémas d’URL acceptés.",
  "step3Title": "Lancez",
  "step3Text": "Une seule passe construit l’arbre nettoyé et enregistre chaque décision au passage. Un mégaoctet de balisage prend quelques millisecondes.",
  "step4Title": "Relisez et annulez",
  "step4Text": "Le rapport liste ce qui est parti et pourquoi. Si une ligne vous déplaît, appuyez sur Garder : la passe recommence avec cette seule exception.",
  "featuresTitle": "Ce qu’il fait",
  "features": [
    {
      "title": "Vraie politique de liste blanche",
      "text": "Balises, attributs et schémas d’URL sont des listes distinctes que vous contrôlez. Bloquer une balise en laissant ses attributs intacts n’est pas assainir."
    },
    {
      "title": "Rapport de suppressions détaillé",
      "text": "Chaque élément et attribut écarté est regroupé avec son compte, un échantillon de ce qu’il contenait et la raison de son départ."
    },
    {
      "title": "Annulez n’importe quelle décision",
      "text": "Appuyez sur Garder sur une ligne et l’assainissement recommence en autorisant exactement cette chose. Votre texte d’origine n’est jamais modifié."
    },
    {
      "title": "Les schémas d’URL sont vérifiés",
      "text": "javascript:, data:text/html et vbscript: dans href, src, formaction, srcset ou xlink:href sont attrapés, y compris les ruses par espaces et entités."
    },
    {
      "title": "Aperçu en bac à sable",
      "text": "Le résultat s’affiche dans une iframe au sandbox vide et sans référent, donc rien à l’intérieur ne peut s’exécuter, se soumettre ou naviguer."
    },
    {
      "title": "Formaté, minifié ou tel quel",
      "text": "Re-sérialisez le même arbre nettoyé de trois façons. Les espaces à l’intérieur de <pre> sont préservés même quand le reste est réindenté."
    },
    {
      "title": "Passe la main à l’outil suivant",
      "text": "Envoyez le résultat directement à DiffSnap, CodeCard, WordFlow, Base64Bolt ou ZipFlow sans aller-retour par les téléchargements."
    },
    {
      "title": "Rien ne sort de l’onglet",
      "text": "L’assainisseur est une bibliothèque JavaScript empaquetée avec la page. Aucun envoi, aucun appel d’API, aucune requête CDN à aucun moment."
    }
  ],
  "seoSecondaryTitle": "Un assainisseur qui montre son travail",
  "seoHeroText": "La plupart des nettoyeurs HTML en ligne vous rendent une chaîne et attendent que vous leur fassiez confiance. Celui-ci conserve le journal des décisions : quelle balise a été écartée, quel attribut retiré, quelle URL a échoué au contrôle de schéma — et vous laisse annuler n’importe laquelle en un clic, parce que la sortie nettoyée est régénérée à partir de votre politique au lieu d’être rafistolée après coup.",
  "seoHeroList": [
    "Liste blanche, pas liste noire",
    "Attributs vérifiés, pas seulement les balises",
    "Comptes et raisons pour chaque suppression",
    "Annuler et rétablir sur la politique"
  ],
  "seoUseCaseTitle": "Quand vous en avez besoin",
  "seoUseCaseText": "Nettoyer ce qu’a produit un éditeur de texte riche avant de le stocker. Retirer les scories de Word et Google Docs d’un collage dans le CMS. Rendre sûr un balisage tiers avant de l’afficher. Extraire du texte lisible d’une page enregistrée. Vérifier si le balisage auquel vous allez faire confiance contient quoi que ce soit d’exécutable — l’exemple de charges connues est là pour que vous voyiez la réponse au lieu de la supposer.",
  "seoBrowserSpeedTitle": "Construit sur DOMPurify",
  "seoBrowserSpeedText": "L’analyse et les décisions de sécurité viennent de DOMPurify, la bibliothèque que citent les équipes de sécurité des navigateurs elles-mêmes, plutôt que d’une passe écrite à la main sur querySelectorAll. Elle est utilisée via son API de hooks et on lui demande le DOM intermédiaire plutôt qu’une chaîne finie, ce qui rend possibles le rapport de suppressions et les exceptions au cas par cas. Elle gère le XSS par mutation, la confusion d’espaces de noms et les ruses d’URL qu’un nettoyeur naïf laisse passer.",
  "seoPrivacyTitle": "100% privé et sécurisé",
  "seoPrivacyText": "Aucun envoi, aucune clé d’API, aucun suivi de ce que vous collez. La bibliothèque est empaquetée avec la page, donc rien n’est non plus récupéré depuis un CDN. Votre HTML reste dans la mémoire de l’onglet et disparaît à sa fermeture.",
  "seoKeywordsTitle": "Aussi appelé",
  "seoKeywords": [
    "assainisseur html",
    "nettoyeur html",
    "supprimer les scripts html",
    "nettoyer html en ligne",
    "assainir html",
    "retirer les balises",
    "dompurify en ligne",
    "filtre xss",
    "liste blanche html"
  ],
  "faqTitle": "Questions fréquentes",
  "faq": [
    {
      "question": "Pourquoi rien ne se passe quand je colle ?",
      "answer": "C’est voulu. Coller ou ouvrir un fichier ne fait que charger le HTML ; l’assainissement démarre quand vous appuyez sur Assainir. Vous choisissez ainsi la politique d’abord au lieu de regarder l’outil deviner, et un gros document n’est jamais analysé à chaque frappe."
    },
    {
      "question": "Que permet vraiment le rapport de suppressions ?",
      "answer": "Chaque ligne est une décision réversible. Appuyer sur Garder ajoute cette seule exception et relance toute la passe — autoriser à nouveau une <iframe> ne laisse donc pas aussi passer son attribut onload. Votre texte d’entrée n’est jamais réécrit, et c’est pourquoi annuler et rétablir restent bon marché."
    },
    {
      "question": "Mettre les balises en liste blanche suffit-il à rendre la sortie sûre ?",
      "answer": "Non, et c’est l’erreur de la plupart des nettoyeurs qui ne regardent que les balises. Une balise <a> de n’importe quelle liste blanche peut toujours porter href=\"javascript:…\", donc ici les attributs et les schémas d’URL sont vérifiés séparément. Bloquer une balise en laissant ses attributs intacts n’est pas assainir."
    },
    {
      "question": "Quels schémas d’URL passent ?",
      "answer": "Uniquement ceux que vous cochez. Tout le reste est écarté de href, src, srcset, action, formaction, poster, cite et xlink:href, y compris les valeurs cachées derrière des tabulations, des sauts de ligne ou des entités HTML. data: est limité aux images matricielles : une URL de données SVG exécute son propre script à l’ouverture directe, elle n’est donc jamais autorisée."
    },
    {
      "question": "L’aperçu est-il sûr ?",
      "answer": "Oui. Il s’affiche dans une iframe dont l’attribut sandbox vaut la chaîne vide, ce qui bloque scripts, formulaires, fenêtres surgissantes et navigation, avec en plus une politique sans référent pour qu’aucune image survivante ne puisse révéler d’où vous venez."
    },
    {
      "question": "Mon HTML est-il envoyé quelque part ?",
      "answer": "Non. L’assainisseur est du JavaScript empaqueté avec cette page et s’exécute dans votre onglet. Aucun envoi, aucun appel d’API, aucune requête CDN — vérifiable avec l’onglet réseau ouvert."
    },
    {
      "question": "Quelle taille de document supporte-t-il ?",
      "answer": "L’analyse est à peu près linéaire, donc quelques mégaoctets de balisage finissent bien en dessous de la seconde sur un portable ordinaire ; la durée mesurée s’affiche après chaque exécution. La coloration syntaxique du panneau de sortie se coupe au-delà de 200 Ko, car à cette taille elle coûte plus qu’elle n’apporte."
    }
  ],
  "footerTagline": "Un assainisseur HTML avec une vraie politique de liste blanche et un rapport de suppressions discutable — 100% local dans votre navigateur.",
  "footerCredit": "Fait partie de la suite oLoveTools",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "Copié !",
  "contactForIdeas": "Contact pour idées et commentaires :"
};
