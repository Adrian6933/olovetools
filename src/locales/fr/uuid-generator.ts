export default {
  "title": "UUID Generator",
  "seo_title": "UUID Generator | Générateur gratuit en ligne de UUID v4 et v5",
  "seo_description": "Générez des UUID aléatoires (v4) et des UUID nommés (v5) en lot jusqu'à 500 à la fois 100% localement dans votre navigateur via la Web Crypto API. Générateur UUID gratuit en ligne.",
  "seoHeroTitle": "Générateur en lot de UUID v4 et v5",
  "seoHeroText": "Générez instantanément jusqu'à 500 UUID aléatoires (version 4) ou UUID nommés (version 5 avec namespace) via la Web Crypto API native du navigateur. Toute la génération se fait localement — aucun appel serveur, aucun suivi.",
  "label_version": "Version d'UUID",
  "option_v4": "v4 (Aléatoire)",
  "option_v5": "v5 (Nommé + SHA-1)",
  "label_count": "Quantité",
  "label_namespace": "UUID de Namespace",
  "label_name": "Nom",
  "label_uuids_generated": "UUID générés",
  "label_no_uuids": "Aucun UUID généré pour le moment. Ajustez les options ci-dessus.",
  "error_invalid_namespace": "Format d'UUID de namespace invalide. Utilisez le format UUID standard : xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "error_fix_namespace": "Veuillez corriger l'UUID de namespace pour générer des UUID v5.",
  "button_regenerate": "Régénérer",
  "button_copied_all": "Tout copié !",
  "button_download": "Télécharger .txt",
  "button_reset": "Réinitialiser",
  "tooltip_copy": "Copier dans le presse-papiers",
  "seoBrowserSpeedTitle": "Propulsé par la Web Crypto API",
  "seoBrowserSpeedText": "Les UUID sont générés via le crypto.randomUUID() natif du navigateur pour v4 et crypto.subtle.digest('SHA-1') pour v5, garantissant une qualité cryptographique à la vitesse du matériel sans aucun traitement serveur.",
  "seoUseCaseTitle": "Génération par lot",
  "seoUseCaseText": "Générez jusqu'à 500 UUID en un seul clic. Parfait pour l'initialisation de bases de données, la génération de données de test, des IDs de session uniques ou tout scénario nécessitant plusieurs identifiants uniques à la fois.",
  "seoPrivacyTitle": "100% privé et sécurisé",
  "seoPrivacyText": "Aucune base de données, aucun suivi ni téléversement réseau. Toute la génération d'UUID se fait entièrement dans le sous-système cryptographique de votre navigateur. Vos données ne quittent jamais votre appareil.",
  "seoKeywords": [
    "générateur uuid",
    "uuid v4",
    "uuid v5",
    "générateur guid",
    "uuid aléatoire",
    "uuid en lot",
    "identifiant unique"
  ],
  "faqTitle": "Questions fréquentes",
  "faq": [
    {
      "question": "Quelle est la différence entre UUID v4 et v5 ?",
      "answer": "L'UUID v4 est généré à partir de nombres aléatoires, ce qui rend chaque UUID unique et imprévisible. L'UUID v5 est généré en hachant un UUID de namespace et une chaîne de nom avec SHA-1, ce qui signifie que le même namespace+nom produit toujours le même UUID."
    },
    {
      "question": "Puis-je générer plusieurs UUID à la fois ?",
      "answer": "Oui. Utilisez le curseur de quantité pour générer de 1 à 500 UUID en un seul lot. Tous les UUID sont générés instantanément et peuvent être copiés individuellement ou tous à la fois."
    },
    {
      "question": "Ces UUID sont-ils cryptographiquement sécurisés ?",
      "answer": "Oui. Les UUID version 4 utilisent la fonction crypto.randomUUID() native du navigateur qui fournit une sécurité cryptographique. Les UUID version 5 utilisent la fonction de condensat SHA-1 de la Web Crypto API."
    }
  ],
  "footerTagline": "Générateur en lot d'UUID v4 et v5 rapide et sécurisé propulsé par la Web Crypto API — 100% local dans votre navigateur.",
  "footerCredit": "Fait partie de la suite oLoveTools",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "Copié !",
  "contactForIdeas": "Contact pour idées et commentaires :",
  "button_copy_all": "Tout Copier"
};
