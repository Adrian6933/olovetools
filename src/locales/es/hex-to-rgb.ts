export default {
  "resetHint": "Empezar de nuevo",
  "title": "Hex a RGB",
  "badge": "Conversión de color",
  "seo_title": "Conversor HEX a RGB | RGB, HSL, OKLCH y CMYK",
  "seo_description": "Pega cualquier color CSS —hex, una palabra clave, oklch(), color-mix()— y obtén RGB, HSL, HWB, OKLCH, OKLab y CMYK. Crea rampas y armonías, comprueba el contraste WCAG y APCA, simula el daltonismo y exporta la paleta. Todo se ejecuta en tu navegador.",
  "seoHeroTitle": "Estudio de conversión de color",
  "seoHeroText": "Convierte cualquier color CSS a RGB, HSL, HWB, OKLCH, OKLab y CMYK, crea rampas y armonías y comprueba el contraste, todo en local.",
  "description": "Escribe un código hex, una palabra clave de CSS o una función oklch() entera y obtén al instante todas las demás notaciones. Después crea una rampa, comprueba el contraste, simula cómo se ve para quien tiene daltonismo y llévate la paleta contigo.",
  "palette_title": "Paleta",
  "palette_add": "Añadir una casilla",
  "palette_remove": "Quitar este color",
  "tooltip_undo": "Deshacer (Ctrl+Z)",
  "tooltip_redo": "Rehacer (Ctrl+Mayús+Z)",
  "button_reset": "Reiniciar",
  "preview_hold": "Mantén pulsado para comparar con el color de partida",
  "preview_baseline": "Color de partida",
  "preview_complement": "Complementario (Alt)",
  "label_input": "Cualquier color CSS",
  "placeholder_input": "#FF6347, rebeccapurple, oklch(70% 0.15 30)…",
  "error_invalid": "no es un color",
  "hint_native": "Lo interpreta el propio navegador, así que funcionan las palabras clave, hwb(), lab(), lch(), oklch(), color-mix() y display-p3.",
  "hint_fallback": "El hex de 3, 4, 6 u 8 dígitos y las funciones rgb() y hsl() se entienden sin ayuda del navegador.",
  "tooltip_picker": "Selector de color del sistema",
  "tooltip_eyedropper": "Toma un color de cualquier punto de la pantalla (E)",
  "tooltip_paste": "Pegar una lista de colores",
  "tooltip_image": "Tomar colores de una imagen",
  "tooltip_shortcuts": "Atajos de teclado (?)",
  "copy": "Copiar",
  "copied": "Copiado",
  "error_clipboard": "El navegador ha denegado el acceso al portapapeles, así que no se ha copiado nada. Selecciona el valor y cópialo a mano.",
  "error_clipboard_read": "El navegador ha denegado la lectura del portapapeles. Pega la lista en el campo de texto.",
  "error_no_colors": "No se ha encontrado ningún color en el portapapeles.",
  "cmyk_disclaimer": "El CMYK de aquí es la conversión aritmética simple, no una separación ICC. Un CMYK listo para imprenta depende del papel, la tinta y el perfil de salida, y no se puede deducir de un valor sRGB por sí solo.",
  "shortcuts": [
    {
      "keys": "1 – 8",
      "label": "Ir a esa casilla de la paleta"
    },
    {
      "keys": "Ctrl+Z / Ctrl+Mayús+Z",
      "label": "Deshacer y rehacer"
    },
    {
      "keys": "Alt",
      "label": "Mantén pulsado para ver el complementario"
    },
    {
      "keys": "Clic",
      "label": "Mantén pulsado sobre la muestra para compararla con el color de partida"
    },
    {
      "keys": "Clic derecho",
      "label": "Cambia una casilla por su complementario"
    },
    {
      "keys": "C",
      "label": "Copiar el código hex"
    },
    {
      "keys": "E",
      "label": "Abrir la pipeta de pantalla"
    },
    {
      "keys": "?",
      "label": "Mostrar u ocultar esta lista"
    }
  ],
  "image_title": "Tomar de una imagen",
  "image_from": "desde {tool}",
  "image_close": "Cerrar la imagen",
  "image_count": "{n} colores",
  "image_fewer": "Menos colores",
  "image_more": "Más colores",
  "image_extract": "Extraer paleta",
  "image_extracting": "Extrayendo…",
  "image_hint": "Haz clic en cualquier píxel para tomar su color exacto. Rueda para ampliar sobre el píxel bajo el cursor, arrastra para desplazarte.",
  "image_error": "No se ha podido decodificar este archivo como imagen.",
  "image_error_pixels": "No se ha encontrado ningún píxel opaco en esta imagen.",
  "tuner_title": "Ajuste fino",
  "tuner_show_rgb": "Deslizadores RGB",
  "tuner_show_oklch": "Deslizadores OKLCH",
  "tuner_lightness": "Claridad",
  "tuner_chroma": "Croma",
  "tuner_hue": "Tono",
  "tuner_alpha": "Alfa",
  "tuner_gamut": "Fuera de sRGB: se ha bajado el croma para que quepa, ΔE {n}.",
  "ramp_title": "Rampa de tintes y sombras",
  "ramp_to_palette": "Enviar a la paleta",
  "ramp_legend": "Once escalones creados en OKLCH a partir de tu color, anclados en el escalón cuya claridad ya coincide con él.",
  "ramp_clipped": "{n} escalones se han devuelto al espacio sRGB.",
  "harmony_title": "Armonías",
  "harmony_to_palette": "Enviar a la paleta",
  "harmony_complementary": "Complementario",
  "harmony_analogous": "Análogos",
  "harmony_triadic": "Tríada",
  "harmony_split": "Complementario dividido",
  "harmony_tetradic": "Tetrádico",
  "harmony_monochrome": "Monocromo",
  "mix_title": "Mezcla",
  "mix_with": "con",
  "mix_hint": "Interpolado en OKLCH por el arco corto de tono: {n}% del camino.",
  "contrast_title": "Contraste",
  "contrast_swap": "Intercambiar",
  "contrast_sample_large": "Titular grande a 24 píxeles",
  "contrast_sample_medium": "Subtítulo a 16 píxeles, seminegrita",
  "contrast_sample_body": "Texto de cuerpo a 13 píxeles. Este es el tamaño que decide si una pareja de colores sirve de verdad.",
  "contrast_wcag": "WCAG 2.1",
  "contrast_apca": "APCA (borrador de WCAG 3)",
  "contrast_apca_flip": "A la inversa, usando el fondo como color de texto: Lc {n}",
  "contrast_bg": "Fondo",
  "contrast_bg_custom": "Color de fondo personalizado",
  "wcag_aaa": "AAA · válido en cualquier tamaño de texto",
  "wcag_aa": "AA · válido para texto de cuerpo",
  "wcag_aa_large": "AA · solo texto grande, desde 18pt o 14pt en negrita",
  "wcag_fail": "Por debajo del mínimo para texto",
  "apca_body": "Suficiente para texto de cuerpo y menor",
  "apca_large": "Titulares a partir de 24 píxeles",
  "apca_ui": "Solo texto de interfaz grande e iconos",
  "apca_none": "No sirve para texto",
  "cvd_title": "Visión del color",
  "cvd_hint": "Distancia mínima entre dos muestras cualesquiera, por tipo de visión",
  "cvd_normal": "Visión típica",
  "cvd_protanopia": "Protanopía · sin conos rojos",
  "cvd_deuteranopia": "Deuteranopía · sin conos verdes",
  "cvd_tritanopia": "Tritanopía · sin conos azules",
  "cvd_legend": "Por debajo de ΔE 0,05 dos muestras son el mismo color para esa persona, así que una paleta que dependa de distinguirlas se rompe. La simulación sigue a Viénot, Brettel y Mollon (1999) y se aplica en luz lineal.",
  "nearest_title": "Colores con nombre más cercanos",
  "nearest_css": "Palabra clave de CSS",
  "nearest_tw": "Token de Tailwind",
  "nearest_exact": "exacto",
  "nearest_legend": "La distancia es ΔE en OKLab, donde alrededor de 0,02 es el punto en el que la mayoría empieza a ver dos muestras como colores distintos. Haz clic en una fila para saltar a ese color exacto.",
  "export_title": "Exportar la paleta",
  "export_count": "{n} colores",
  "export_png_hint": "Una hoja de muestras con el código hex impreso en cada color. Descárgala o mándala directamente a otra herramienta.",
  "export_download": "Descargar",
  "nextStepTitle": "Sigue",
  "nextStepHint": "La paleta viaja contigo: sin descargar ni volver a subir",
  "nextCss": "Diseña con estos colores",
  "nextJson": "Abrir como JSON",
  "nextSvg": "Optimizar el SVG de muestras",
  "nextPng": "Comprimir la hoja de muestras",
  "nextDiff": "Comparar dos paletas",
  "howItWorksTitle": "Cómo funciona",
  "steps": [
    {
      "title": "Trae un color",
      "text": "Escribe cualquier notación CSS, usa la pipeta de pantalla, pega una paleta entera o abre una imagen y haz clic en el píxel que quieras."
    },
    {
      "title": "Dale forma",
      "text": "Deslizadores de claridad, croma y tono que se comportan igual en un amarillo que en un azul, además de rampas, armonías y mezcla."
    },
    {
      "title": "Compruébalo",
      "text": "WCAG 2.1 y APCA contra cualquier fondo, y una simulación de daltonismo que te avisa cuando dos muestras se funden en una."
    },
    {
      "title": "Llévatelo",
      "text": "Copia una notación suelta, exporta CSS, Tailwind, SCSS, JSON, SVG o una hoja de muestras, o pasa la paleta a la siguiente herramienta."
    }
  ],
  "features": [
    {
      "title": "Todas las sintaxis de color CSS",
      "text": "Hex de 3, 4, 6 u 8 dígitos, palabras clave, rgb(), hsl(), hwb(), lab(), lch(), oklab(), oklch(), color-mix() y display-p3. Lee el propio analizador del navegador, así que no se queda nada fuera."
    },
    {
      "title": "Rampas que mantienen el paso",
      "text": "Once escalones generados en OKLCH, de modo que cada uno queda a una distancia visual constante del anterior, en vez de los saltos desiguales de una rampa en HSL."
    },
    {
      "title": "WCAG 2.1 y APCA",
      "text": "El ratio clásico más el valor Lc con signo del borrador de WCAG 3, medidos contra el fondo que elijas, no solo contra blanco y negro."
    },
    {
      "title": "Comprobación de daltonismo",
      "text": "Protanopía, deuteranopía y tritanopía simuladas en luz lineal, con la distancia mínima entre dos muestras para saber cuándo una paleta se viene abajo."
    },
    {
      "title": "Pipeta e imágenes",
      "text": "Toma un color de cualquier punto de la pantalla donde el navegador lo permita, o abre una imagen, amplía sobre el píxel bajo el cursor y quédate con su valor exacto."
    },
    {
      "title": "Armonías y mezcla",
      "text": "Conjuntos complementario, análogo, tríada, dividido, tetrádico y monocromo girados en OKLCH, además de mezcla perceptual por el arco corto de tono."
    },
    {
      "title": "Exporta a donde sea",
      "text": "Propiedades personalizadas de CSS, un bloque @theme de Tailwind, variables SCSS, JSON, una hoja de muestras en SVG o PNG y un archivo de paleta de GIMP."
    },
    {
      "title": "Nada sale de la pestaña",
      "text": "Sin subidas, sin llamadas a ninguna API, sin cuenta. Cada conversión, cada cifra de contraste y cada paleta las calcula tu propio navegador."
    }
  ],
  "seoBrowserSpeedTitle": "Procesado local instantáneo",
  "seoBrowserSpeedText": "Cada conversión es aritmética sobre tres números, así que no hay nada que esperar ni nada que enviar a ninguna parte. La lectura de lo que escribes se delega en el motor CSS del propio navegador, y por eso se entienden las palabras clave, color-mix() y las notaciones de gama amplia en vez de rechazarse. El trabajo perceptual —rampas en OKLCH, mapeo de gamut, distancias ΔE, simulación de daltonismo— son unos cientos de operaciones en coma flotante, y hasta extraer la paleta de una foto grande es una pasada de k-means sobre una copia reducida que termina en bastante menos de un segundo.",
  "seoUseCaseTitle": "Pensado para sistemas de diseño",
  "seoUseCaseText": "Lo incómodo del trabajo con color rara vez es la conversión en sí: es conseguir una escala que avance a paso constante, demostrar que dos colores se leen bien juntos y dejar el resultado con la forma que espera tu código. Esta herramienta ancla una rampa de once escalones en el color que ya tienes, te dice qué escalones han tenido que volver a sRGB y cuánto se han movido, nombra la palabra clave de CSS y el token de Tailwind más cercanos con una distancia medida, y exporta la paleta entera como propiedades personalizadas, bloque de tema de Tailwind, SCSS, JSON o una hoja de muestras.",
  "seoPrivacyTitle": "Privada por construcción",
  "seoPrivacyText": "Esta herramienta no tiene parte de servidor. Los colores que escribes, las paletas que pegas y las imágenes que abres se quedan en la pestaña: la imagen se decodifica en un lienzo que nunca sale de tu equipo, y al cerrar la pestaña desaparece todo. Lo único que viaja es lo que tú decides poner en la barra de direcciones: la paleta se codifica ahí para que puedas compartir un enlace, y no se registra nada más de tu sesión.",
  "faqTitle": "Preguntas frecuentes",
  "faq": [
    {
      "question": "¿Qué formatos de color puedo pegar?",
      "answer": "Hex de 3, 4, 6 u 8 dígitos, las 148 palabras clave de CSS, rgb(), rgba(), hsl(), hsla(), hwb(), lab(), lch(), oklab(), oklch(), color-mix() y color(display-p3 …). La entrada pasa por el analizador CSS del propio navegador, así que funciona todo lo que tu navegador acepte en una hoja de estilos. Sin ese analizador, la herramienta sigue leyendo hex, rgb() y hsl()."
    },
    {
      "question": "¿Por qué la herramienta prefiere OKLCH a HSL?",
      "answer": "En HSL, dos colores con el mismo valor de luminosidad pueden verse muy distintos de brillo: un amarillo al 50% parece mucho más claro que un azul al 50%. OKLCH está construido para que su claridad coincida con lo que percibe el ojo, y por eso las rampas, las armonías y la mezcla de aquí giran e interpolan en ese espacio."
    },
    {
      "question": "¿Qué significa el número ΔE?",
      "answer": "Es la distancia entre dos colores en OKLab. Alrededor de 0,02 es donde la mayoría empieza a ver dos muestras como colores realmente distintos, así que sirve de vara de medir: te dice cuánto se ha desviado un escalón de la rampa al tener que volver a sRGB, cómo de cerca está de verdad el token de Tailwind más próximo y si dos colores de la paleta sobreviven a una simulación de daltonismo."
    },
    {
      "question": "¿El comprobador de contraste cumple WCAG?",
      "answer": "El ratio de WCAG 2.1 se calcula exactamente como define la especificación, contra el fondo que elijas, y la etiqueta distingue el texto de cuerpo del umbral más laxo del texto grande en vez de mostrar un aprobado a secas. Junto a él tienes APCA, la medida perceptual propuesta para WCAG 3: útil en la práctica, pero todavía un borrador y no un criterio de conformidad."
    },
    {
      "question": "¿El CMYK que sale vale para imprenta?",
      "answer": "No, y el de ninguna herramienta de navegador lo vale. Lo que obtienes es la conversión aritmética estándar, suficiente para hacerte una idea o para un programa que espere esos cuatro números. Una separación real depende del papel, las tintas y un perfil ICC de salida, así que hay que hacerla en tu programa de maquetación o de imagen."
    },
    {
      "question": "¿Se sube a algún sitio lo que pego?",
      "answer": "No. No hay componente de servidor, no hay analítica sobre tus colores y no se hace ninguna petición de red en ningún momento de la conversión. Las imágenes se decodifican en local en un lienzo y se descartan al cerrarlas. La paleta se escribe en la URL de la página para que puedas compartirla o guardarla en marcadores: ese es el único sitio donde quedan tus colores, y se queda en tu equipo salvo que envíes tú el enlace."
    }
  ],
  "seoKeywordsTitle": "Palabras clave",
  "seoKeywords": [
    "hex a rgb",
    "conversor de color",
    "hex a hsl",
    "conversor oklch",
    "conversor cmyk",
    "comprobador de contraste wcag",
    "contraste apca",
    "simulador de daltonismo",
    "color de tailwind",
    "generador de paletas",
    "herramienta online",
    "gratis"
  ],
  "footerTagline": "Convierte cualquier color CSS a RGB, HSL, HWB, OKLCH, OKLab y CMYK, crea rampas y armonías y comprueba el contraste, todo en local.",
  "footerCredit": "Parte de la suite oLoveTools",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "¡Copiado!",
  "contactForIdeas": "Contacto para ideas y comentarios:"
};
