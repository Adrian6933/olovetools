export default {
  "title": "Hex vers RGB",
  "badge": "Conversion de couleur",
  "seo_title": "Convertisseur HEX vers RGB | RGB, HSL, OKLCH, CMJN",
  "seo_description": "Collez n'importe quelle couleur CSS — hex, mot-clé, oklch(), color-mix() — et récupérez RGB, HSL, HWB, OKLCH, OKLab et CMJN. Créez des gammes et des harmonies, vérifiez le contraste WCAG et APCA, simulez le daltonisme et exportez la palette. Tout tourne dans votre navigateur.",
  "seoHeroTitle": "Studio de conversion de couleur",
  "seoHeroText": "Convertissez n'importe quelle couleur CSS en RGB, HSL, HWB, OKLCH, OKLab et CMJN, créez des gammes et des harmonies et vérifiez le contraste, en local.",
  "description": "Saisissez un code hex, un mot-clé CSS ou une fonction oklch() complète et obtenez instantanément toutes les autres notations. Créez ensuite une gamme, vérifiez le contraste, simulez le rendu pour les personnes daltoniennes et emportez la palette avec vous.",
  "palette_title": "Palette",
  "palette_add": "Ajouter une case",
  "palette_remove": "Retirer cette couleur",
  "tooltip_undo": "Annuler (Ctrl+Z)",
  "tooltip_redo": "Rétablir (Ctrl+Maj+Z)",
  "button_reset": "Réinitialiser",
  "preview_hold": "Maintenez pour comparer avec la couleur de départ",
  "preview_baseline": "Couleur de départ",
  "preview_complement": "Complémentaire (Alt)",
  "label_input": "N'importe quelle couleur CSS",
  "placeholder_input": "#FF6347, rebeccapurple, oklch(70% 0.15 30)…",
  "error_invalid": "ce n'est pas une couleur",
  "hint_native": "C'est le navigateur lui-même qui analyse la valeur : les mots-clés, hwb(), lab(), lch(), oklch(), color-mix() et display-p3 fonctionnent donc tous.",
  "hint_fallback": "L'hex à 3, 4, 6 ou 8 chiffres ainsi que rgb() et hsl() sont compris sans l'aide du navigateur.",
  "tooltip_picker": "Sélecteur de couleur du système",
  "tooltip_eyedropper": "Prélever une couleur n'importe où à l'écran (E)",
  "tooltip_paste": "Coller une liste de couleurs",
  "tooltip_image": "Prélever des couleurs dans une image",
  "tooltip_shortcuts": "Raccourcis clavier (?)",
  "copy": "Copier",
  "copied": "Copié",
  "error_clipboard": "Le navigateur a refusé l'accès au presse-papiers : rien n'a été copié. Sélectionnez la valeur et copiez-la à la main.",
  "error_clipboard_read": "Le navigateur a refusé de lire le presse-papiers. Collez plutôt la liste dans le champ de texte.",
  "error_no_colors": "Aucune couleur trouvée dans le presse-papiers.",
  "cmyk_disclaimer": "Le CMJN affiché ici est la simple conversion arithmétique, pas une séparation ICC. Un CMJN prêt pour l'impression dépend du papier, de l'encre et du profil de sortie, et ne peut pas se déduire d'une valeur sRGB seule.",
  "shortcuts": [
    {
      "keys": "1 – 8",
      "label": "Aller à cette case de la palette"
    },
    {
      "keys": "Ctrl+Z / Ctrl+Maj+Z",
      "label": "Annuler et rétablir"
    },
    {
      "keys": "Alt",
      "label": "Maintenez pour voir la complémentaire"
    },
    {
      "keys": "Clic",
      "label": "Maintenez sur l'échantillon pour le comparer à la couleur de départ"
    },
    {
      "keys": "Clic droit",
      "label": "Basculer une case vers sa complémentaire"
    },
    {
      "keys": "C",
      "label": "Copier le code hex"
    },
    {
      "keys": "E",
      "label": "Ouvrir la pipette d'écran"
    },
    {
      "keys": "?",
      "label": "Afficher ou masquer cette liste"
    }
  ],
  "image_title": "Prélever dans une image",
  "image_from": "depuis {tool}",
  "image_close": "Fermer l'image",
  "image_count": "{n} couleurs",
  "image_fewer": "Moins de couleurs",
  "image_more": "Plus de couleurs",
  "image_extract": "Extraire la palette",
  "image_extracting": "Extraction…",
  "image_hint": "Cliquez sur un pixel pour prendre sa couleur exacte. Molette pour zoomer sur le pixel sous le curseur, glissez pour vous déplacer.",
  "image_error": "Ce fichier n'a pas pu être décodé comme une image.",
  "image_error_pixels": "Aucun pixel opaque trouvé dans cette image.",
  "tuner_title": "Réglage fin",
  "tuner_show_rgb": "Curseurs RGB",
  "tuner_show_oklch": "Curseurs OKLCH",
  "tuner_lightness": "Clarté",
  "tuner_chroma": "Chroma",
  "tuner_hue": "Teinte",
  "tuner_alpha": "Alpha",
  "tuner_gamut": "Hors sRGB : le chroma a été réduit pour tenir, ΔE {n}.",
  "ramp_title": "Gamme de teintes et de nuances",
  "ramp_to_palette": "Envoyer vers la palette",
  "ramp_legend": "Onze paliers construits en OKLCH à partir de votre couleur, ancrés sur celui dont la clarté correspond déjà.",
  "ramp_clipped": "{n} paliers ont été ramenés dans sRGB.",
  "harmony_title": "Harmonies",
  "harmony_to_palette": "Envoyer vers la palette",
  "harmony_complementary": "Complémentaire",
  "harmony_analogous": "Analogues",
  "harmony_triadic": "Triade",
  "harmony_split": "Complémentaire divisée",
  "harmony_tetradic": "Tétradique",
  "harmony_monochrome": "Monochrome",
  "mix_title": "Mélange",
  "mix_with": "avec",
  "mix_hint": "Interpolé en OKLCH le long du petit arc de teinte — {n}% du chemin.",
  "contrast_title": "Contraste",
  "contrast_swap": "Inverser",
  "contrast_sample_large": "Grand titre à 24 pixels",
  "contrast_sample_medium": "Sous-titre à 16 pixels, demi-gras",
  "contrast_sample_body": "Texte courant à 13 pixels. C'est cette taille qui décide si une paire de couleurs est réellement utilisable.",
  "contrast_wcag": "WCAG 2.1",
  "contrast_apca": "APCA (brouillon WCAG 3)",
  "contrast_apca_flip": "Inversé, le fond servant de couleur de texte : Lc {n}",
  "contrast_bg": "Arrière-plan",
  "contrast_bg_custom": "Couleur d'arrière-plan personnalisée",
  "wcag_aaa": "AAA · valide à toutes les tailles de texte",
  "wcag_aa": "AA · valide pour le texte courant",
  "wcag_aa_large": "AA · grand texte seulement, à partir de 18pt ou 14pt gras",
  "wcag_fail": "Sous le minimum requis pour du texte",
  "apca_body": "Suffisant pour le texte courant et plus petit",
  "apca_large": "Titres à partir de 24 pixels",
  "apca_ui": "Uniquement grand texte d'interface et icônes",
  "apca_none": "Inutilisable pour du texte",
  "cvd_title": "Vision des couleurs",
  "cvd_hint": "Distance minimale entre deux échantillons, par type de vision",
  "cvd_normal": "Vision typique",
  "cvd_protanopia": "Protanopie · sans cônes rouges",
  "cvd_deuteranopia": "Deutéranopie · sans cônes verts",
  "cvd_tritanopia": "Tritanopie · sans cônes bleus",
  "cvd_legend": "En dessous de ΔE 0,05, deux échantillons sont la même couleur pour cette personne : une palette qui repose sur leur distinction ne tient plus. La simulation suit Viénot, Brettel et Mollon (1999) et s'applique en lumière linéaire.",
  "nearest_title": "Couleurs nommées les plus proches",
  "nearest_css": "Mot-clé CSS",
  "nearest_tw": "Jeton Tailwind",
  "nearest_exact": "identique",
  "nearest_legend": "La distance est le ΔE en OKLab, où environ 0,02 correspond au moment où la plupart des gens voient deux échantillons comme des couleurs différentes. Cliquez sur une ligne pour aller à cette couleur exacte.",
  "export_title": "Exporter la palette",
  "export_count": "{n} couleurs",
  "export_png_hint": "Une planche d'échantillons avec le code hex imprimé sur chaque couleur. Téléchargez-la ou envoyez-la directement à un autre outil.",
  "export_download": "Télécharger",
  "nextStepTitle": "Continuez",
  "nextStepHint": "La palette vous suit : sans téléchargement ni nouvel envoi",
  "nextCss": "Concevoir avec ces couleurs",
  "nextJson": "Ouvrir en JSON",
  "nextSvg": "Optimiser le SVG d'échantillons",
  "nextPng": "Compresser la planche d'échantillons",
  "nextDiff": "Comparer deux palettes",
  "howItWorksTitle": "Comment ça marche",
  "steps": [
    {
      "title": "Apportez une couleur",
      "text": "Tapez n'importe quelle notation CSS, utilisez la pipette d'écran, collez une palette entière ou ouvrez une image et cliquez sur le pixel voulu."
    },
    {
      "title": "Façonnez-la",
      "text": "Des curseurs de clarté, de chroma et de teinte qui se comportent pareil sur un jaune et sur un bleu, plus les gammes, les harmonies et le mélange."
    },
    {
      "title": "Vérifiez-la",
      "text": "WCAG 2.1 et APCA sur n'importe quel fond, et une simulation du daltonisme qui vous prévient quand deux échantillons n'en font plus qu'un."
    },
    {
      "title": "Emportez-la",
      "text": "Copiez une notation, exportez en CSS, Tailwind, SCSS, JSON, SVG ou planche d'échantillons, ou passez la palette à l'outil suivant."
    }
  ],
  "features": [
    {
      "title": "Toutes les syntaxes de couleur CSS",
      "text": "Hex à 3, 4, 6 ou 8 chiffres, mots-clés, rgb(), hsl(), hwb(), lab(), lch(), oklab(), oklch(), color-mix() et display-p3. C'est l'analyseur du navigateur qui lit la valeur, donc rien n'est laissé de côté."
    },
    {
      "title": "Des gammes au pas régulier",
      "text": "Onze paliers générés en OKLCH : chacun reste à une distance visuelle constante du précédent, au lieu des sauts irréguliers d'une gamme en HSL."
    },
    {
      "title": "WCAG 2.1 et APCA",
      "text": "Le ratio classique et la valeur Lc signée du brouillon WCAG 3, mesurés sur le fond de votre choix et pas seulement sur du blanc et du noir."
    },
    {
      "title": "Contrôle du daltonisme",
      "text": "Protanopie, deutéranopie et tritanopie simulées en lumière linéaire, avec la plus petite distance entre deux échantillons pour repérer une palette qui s'effondre."
    },
    {
      "title": "Pipette et images",
      "text": "Prélevez une couleur partout à l'écran là où le navigateur l'autorise, ou ouvrez une image, zoomez sur le pixel sous le curseur et récupérez sa valeur exacte."
    },
    {
      "title": "Harmonies et mélange",
      "text": "Ensembles complémentaire, analogue, triade, divisé, tétradique et monochrome pivotés en OKLCH, plus un mélange perceptuel le long du petit arc de teinte."
    },
    {
      "title": "Exportez partout",
      "text": "Propriétés personnalisées CSS, bloc @theme de Tailwind, variables SCSS, JSON, planche d'échantillons en SVG ou PNG, et fichier de palette GIMP."
    },
    {
      "title": "Rien ne quitte l'onglet",
      "text": "Aucun envoi, aucun appel d'API, aucun compte. Chaque conversion, chaque chiffre de contraste et chaque palette sont calculés par votre propre navigateur."
    }
  ],
  "seoBrowserSpeedTitle": "Traitement local instantané",
  "seoBrowserSpeedText": "Chaque conversion est une opération arithmétique sur trois nombres : il n'y a rien à attendre ni rien à envoyer où que ce soit. La lecture de votre saisie est confiée au moteur CSS du navigateur, ce qui explique que les mots-clés, color-mix() et les notations à large gamut soient compris plutôt que rejetés. Le travail perceptuel — gammes OKLCH, mappage de gamut, distances ΔE, simulation du daltonisme — représente quelques centaines d'opérations en virgule flottante, et même extraire une palette d'une grande photo se réduit à un passage de k-means sur une copie réduite, bouclé en bien moins d'une seconde.",
  "seoUseCaseTitle": "Conçu pour les design systems",
  "seoUseCaseText": "Le plus pénible dans le travail de la couleur est rarement la conversion : c'est obtenir une échelle qui progresse régulièrement, prouver qu'une paire de couleurs est lisible et livrer le résultat dans la forme qu'attend votre code. Cet outil ancre une gamme de onze paliers sur la couleur que vous avez déjà, indique quels paliers ont dû revenir dans sRGB et de combien, nomme le mot-clé CSS et le jeton Tailwind les plus proches avec une distance mesurée, et exporte toute la palette en propriétés personnalisées, bloc de thème Tailwind, SCSS, JSON ou planche d'échantillons.",
  "seoPrivacyTitle": "Privé par construction",
  "seoPrivacyText": "Cet outil n'a pas de partie serveur. Les couleurs que vous tapez, les palettes que vous collez et les images que vous ouvrez restent dans l'onglet : une image est décodée dans un canvas qui ne quitte jamais votre machine, et fermer l'onglet efface tout. La seule chose qui circule est ce que vous choisissez de mettre dans la barre d'adresse : la palette y est encodée pour que vous puissiez partager un lien, et rien d'autre de votre session n'est enregistré.",
  "faqTitle": "Questions fréquentes",
  "faq": [
    {
      "question": "Quels formats de couleur puis-je coller ?",
      "answer": "Hex à 3, 4, 6 ou 8 chiffres, les 148 mots-clés CSS, rgb(), rgba(), hsl(), hsla(), hwb(), lab(), lch(), oklab(), oklch(), color-mix() et color(display-p3 …). La saisie passe par l'analyseur CSS du navigateur : tout ce que votre navigateur accepte dans une feuille de style fonctionne ici. Sans cet analyseur, l'outil lit encore hex, rgb() et hsl()."
    },
    {
      "question": "Pourquoi l'outil préfère-t-il OKLCH à HSL ?",
      "answer": "En HSL, deux couleurs ayant la même valeur de luminosité peuvent paraître très différentes : un jaune à 50% semble bien plus clair qu'un bleu à 50%. OKLCH est construit pour que sa clarté corresponde à ce que l'œil perçoit, et c'est pourquoi les gammes, les harmonies et le mélange pivotent et interpolent dans cet espace."
    },
    {
      "question": "Que signifie le nombre ΔE ?",
      "answer": "C'est la distance entre deux couleurs en OKLab. Autour de 0,02, la plupart des gens commencent à voir deux échantillons comme des couleurs vraiment différentes : cela sert de règle graduée pour savoir de combien un palier a dérivé en revenant dans sRGB, à quel point le jeton Tailwind le plus proche l'est vraiment, et si deux couleurs de la palette survivent à une simulation de daltonisme."
    },
    {
      "question": "Le vérificateur de contraste est-il conforme WCAG ?",
      "answer": "Le ratio WCAG 2.1 est calculé exactement comme la spécification le définit, sur le fond de votre choix, et le badge distingue le texte courant du seuil plus souple réservé au grand texte au lieu d'afficher une simple mention « conforme ». À côté figure APCA, la mesure perceptuelle proposée pour WCAG 3 : utile en pratique, mais encore à l'état de brouillon et non un critère de conformité."
    },
    {
      "question": "Le CMJN produit est-il prêt pour l'impression ?",
      "answer": "Non, et celui d'aucun outil de navigateur ne l'est. Vous obtenez la conversion arithmétique standard, suffisante pour se faire une idée ou pour un logiciel qui attend ces quatre nombres. Une vraie séparation dépend du papier, des encres et d'un profil ICC de sortie : elle se fait dans votre logiciel de mise en page ou d'image."
    },
    {
      "question": "Ce que je colle est-il envoyé quelque part ?",
      "answer": "Non. Il n'y a aucun composant serveur, aucune mesure d'audience sur vos couleurs et aucune requête réseau à un quelconque moment de la conversion. Les images sont décodées localement dans un canvas et abandonnées à la fermeture. La palette est écrite dans l'URL de la page pour que vous puissiez la partager ou la mettre en favori : c'est le seul endroit où vos couleurs sont conservées, et cela reste sur votre machine tant que vous n'envoyez pas le lien vous-même."
    }
  ],
  "seoKeywordsTitle": "Mots-clés",
  "seoKeywords": [
    "hex vers rgb",
    "convertisseur de couleur",
    "hex vers hsl",
    "convertisseur oklch",
    "convertisseur cmjn",
    "vérificateur de contraste wcag",
    "contraste apca",
    "simulateur de daltonisme",
    "couleur tailwind",
    "générateur de palette",
    "outil en ligne",
    "gratuit"
  ],
  "footerTagline": "Convertissez n'importe quelle couleur CSS en RGB, HSL, HWB, OKLCH, OKLab et CMJN, créez des gammes et des harmonies et vérifiez le contraste, en local.",
  "footerCredit": "Fait partie de la suite oLoveTools",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "Copié !",
  "contactForIdeas": "Contact pour idées et commentaires :"
};
