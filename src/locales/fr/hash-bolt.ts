export default {
  "title": "HashBolt",
  "description": "Calculez des empreintes cryptographiques (MD5, SHA-1, SHA-256, SHA-512) pour du texte et des fichiers 100% localement dans votre navigateur.",
  "input_text_tab": "Saisie de Texte",
  "input_file_tab": "Hachage de Fichier",
  "placeholder_text": "Tapez ou collez votre texte ici pour calculer son empreinte en temps réel...",
  "label_algorithm": "Fonction de Hachage",
  "label_expected_hash": "Comparer avec l'empreinte attendue (Optionnel)",
  "match_success": "Vérifié : Les empreintes correspondent parfaitement !",
  "match_fail": "Erreur : Les empreintes ne correspondent pas !",
  "match_placeholder": "Collez l'empreinte attendue pour vérifier l'intégrité...",
  "file_drag_active": "Déposez le fichier ici...",
  "file_drag_inactive": "Glissez-déposez un fichier ici, ou cliquez pour le sélectionner",
  "file_size_warning": "Les gros fichiers sont hachés par morceaux pour éviter de saturer le navigateur.",
  "file_processing": "Lecture et calcul de l'empreinte...",
  "file_processing_speed": "Vitesse",
  "file_processing_time": "Temps écoulé",
  "format_uppercase": "Sortie en majuscules",
  "format_base64": "Format Base64",
  "copied": "Copié !",
  "tooltip_copy": "Copier dans le presse-papiers",
  "seoHeroTitle": "Générateur rapide de checksums cryptographiques hors ligne",
  "seoHeroText": "Vérifiez l'intégrité des fichiers et générez des empreintes sécurisées (MD5, SHA-1, SHA-256, SHA-384, SHA-512) dans votre navigateur. 100% privé et sécurisé.",
  "seoBrowserSpeedTitle": "Moteur de Hachage Local",
  "seoBrowserSpeedText": "Toutes les opérations s'effectuent localement via l'API native Web Crypto de votre navigateur, à la vitesse du matériel et sans aucun serveur.",
  "seoUseCaseTitle": "Prise en charge des fichiers volumineux",
  "seoUseCaseText": "Glissez-déposez de grandes archives ou des fichiers multimédias. Le lecteur par blocs calcule le checksum en mémoire de façon optimale.",
  "seoPrivacyTitle": "Confidentialité 100% Garantie",
  "seoPrivacyText": "Aucune base de données ni aucun transfert réseau. Vos données restent dans la RAM locale et sont effacées dès la fermeture de l'onglet.",
  "faqTitle": "Foire Aux Questions",
  "faq": [
    {
      "question": "Mes données sont-elles envoyées sur un serveur pour vérification ?",
      "answer": "Non. Le hachage s'effectue intégralement hors ligne dans votre navigateur. Aucun fichier ni texte n'est transféré."
    },
    {
      "question": "Comment vérifier l'intégrité d'un programme téléchargé ?",
      "answer": "Importez le programme dans le volet Fichier, collez le checksum officiel fourni par l'éditeur et vérifiez si l'indicateur s'affiche en vert."
    },
    {
      "question": "Pourquoi MD5 utilise-t-il un moteur personnalisé ?",
      "answer": "Les navigateurs récents excluent le MD5 de l'API Web Crypto native. Nous fournissons un moteur MD5 JS pur pour valider les archives existantes."
    }
  ],
  "footerTagline": "Générateur sécurisé et local de checksums et d'empreintes cryptographiques.",
  "footerCredit": "Fait partie de la suite oLoveTools",
  "seo_title": "HashBolt | Générateur de Hash MD5, SHA-1, SHA-256 Gratuit en Ligne",
  "seo_description": "Calculez des empreintes cryptographiques (MD5, SHA-1, SHA-256, SHA-512) pour du texte et des fichiers 100% localement dans votre navigateur."
};
