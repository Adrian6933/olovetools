export default {
  "title": "CompressSnap",
  "badge": "Compresión de imagen",
  "description": "Comprime JPEG, PNG, WebP, AVIF y HEIC en tu navegador —a la calidad que elijas o al tamaño que tengas que cumplir— y mira exactamente cuánto ha costado.",
  "seo_title": "CompressSnap | Comprime imágenes a un tamaño exacto",
  "seo_description": "Comprime y redimensiona imágenes JPEG, PNG, WebP, AVIF, HEIC y TIFF. Ajusta a un límite en kilobytes, reduce la paleta de un PNG, convierte entre formatos y mira la pérdida de calidad SSIM medida en cada archivo. Trabaja fuera del hilo principal y no sube nada.",
  "dropzonePrompt": "Suelta imágenes aquí, o haz clic para elegirlas",
  "dropzoneSubtitle": "JPEG, PNG, WebP, AVIF, GIF, BMP, TIFF y el HEIC del iPhone. Las imágenes enormes se limitan a lo que aguanta un canvas del navegador.",
  "rejectedFiles": "{n} archivo(s) no eran imágenes y se han quedado fuera.",
  "compressBtn": "Comprimir {n}",
  "recompressBtn": "Han cambiado los ajustes: vuelve a lanzarlo",
  "downloadBtn": "Descargar",
  "downloadAllBtn": "Descargar Todo (ZIP)",
  "clearBtn": "Limpiar Todo",
  "removeBtn": "Quitar",
  "closeBtn": "Cerrar",
  "statusQueued": "en espera",
  "statusDecoding": "decodificando…",
  "statusCompressing": "comprimiendo…",
  "statusSkipped": "ya pesa menos de lo que podríamos dejarla",
  "statusError": "ha fallado",
  "workerOn": "fuera del hilo principal",
  "workerOff": "hilo principal",
  "workerHint": "Dónde se codifica. Fuera del hilo principal la página sigue respondiendo durante el lote.",
  "attemptsHint": "Codificaciones necesarias para entrar en el límite",
  "originalSize": "Tamaño original",
  "compressedSize": "Tamaño comprimido",
  "savings": "Ahorrado",
  "avgSsim": "SSIM medio",
  "presetLight": "Ligera",
  "presetBalanced": "Equilibrada",
  "presetWeb": "Para la web",
  "presetStrong": "Fuerte",
  "formatLabel": "Formato de Salida",
  "formatOriginal": "Mantener",
  "avifUnsupported": "Este navegador no sabe escribir AVIF, así que no se ofrece.",
  "qualityLabel": "Calidad",
  "qualityHint": "Menos calidad, archivo más pequeño. La pérdida medida aparece en cada resultado.",
  "qualityFromBudget": "La calidad se está buscando para entrar en el límite de tamaño de abajo.",
  "pngColorsLabel": "Colores del PNG",
  "pngColorsAll": "todos",
  "ditherLabel": "Difuminar los degradados",
  "pngNote": "El PNG no tiene ajuste de calidad: todos los codificadores lo ignoran. Lo que lo hace más pequeño es reducir la paleta, y en dibujo plano, capturas y logotipos no se nota.",
  "budgetLabel": "Límite de tamaño",
  "budgetToggle": "Dejar cada imagen por debajo de un tamaño",
  "budgetHint": "La calidad se busca por bisección hasta que entra.",
  "budgetPngNote": "Un límite en bytes necesita una calidad que buscar, y el PNG no la tiene. Usa la paleta.",
  "resizeModeLabel": "Modo de redimensión",
  "resizeNone": "Ninguno",
  "resizeLongEdge": "Lado largo",
  "resizeScale": "Escala",
  "resizeCustom": "Personalizado",
  "longEdgeLabel": "Lado más largo (px)",
  "longEdgeHint": "Nunca amplía: una imagen más pequeña se deja como está.",
  "scaleLabel": "Escala",
  "widthLabel": "Ancho (px)",
  "heightLabel": "Alto (px)",
  "keepAspectLabel": "Mantener proporción",
  "measureLabel": "Medir la pérdida de calidad (SSIM)",
  "measureHint": "Decodifica el resultado y lo compara. Añade un poco de tiempo por imagen.",
  "bandIdentical": "Indistinguible",
  "bandExcellent": "Excelente",
  "bandGood": "Buena",
  "bandFair": "Aceptable",
  "bandPoor": "Pérdida visible",
  "compareBtn": "Previsualizar y Comparar",
  "originalLabel": "Original",
  "compressedLabel": "Comprimido",
  "nextStepTitle": "Sigue",
  "nextStepHint": "La imagen viaja contigo: sin descargar ni volver a subir",
  "nextCrop": "Recortarla",
  "nextWatermark": "Ponerle marca de agua",
  "nextExif": "Revisar sus metadatos",
  "nextZip": "Comprimirla en ZIP",
  "howItWorksTitle": "Cómo funciona",
  "step1Title": "Suelta las fotos",
  "step1Text": "Pégalas, elígelas o arrástralas. Se quedan en cola: no se codifica nada hasta que pulsas el botón, así que una carpeta de cuarenta no bloquea la pestaña.",
  "step2Title": "Elige el trato",
  "step2Text": "Una calidad, un tamaño en kilobytes que no superar, un formato, un lado largo máximo. El PNG recibe una paleta en vez de un control de calidad.",
  "step3Title": "Déjalo correr",
  "step3Text": "La codificación va fuera del hilo principal, así que la página sigue respondiendo mientras avanza el lote.",
  "step4Title": "Llévate los archivos",
  "step4Text": "Uno a uno, todos en un ZIP, o directamente a la siguiente herramienta sin descargar nada.",
  "features": [
    {
      "title": "Codifica fuera del hilo principal",
      "text": "Un Web Worker con OffscreenCanvas hace el trabajo y los bitmaps se transfieren en vez de copiarse, así que un lote de fotos de móvil ya no congela la pestaña en la que corre."
    },
    {
      "title": "Comprimir a un tamaño, no a ojo",
      "text": "Dale un límite en kilobytes y busca la calidad por bisección hasta que el archivo entra; luego te dice en qué calidad se quedó y cuántos intentos hizo falta."
    },
    {
      "title": "La pérdida es un número",
      "text": "Cada resultado se vuelve a decodificar y se compara con su origen mediante SSIM, así que «calidad 70» deja de ser una sensación y pasa a ser 0,981 junto al tamaño que te ha costado."
    },
    {
      "title": "PNG que de verdad adelgaza",
      "text": "Reducción de paleta por median-cut con difuminado opcional. Es el único mando que tiene un PNG —el argumento de calidad lo ignora cualquier codificador— y rinde en capturas, logotipos y dibujo plano. Una foto guardada como PNG se arregla mejor pasándola a JPEG o WebP, y la herramienta lo dice en vez de devolverte un archivo más grande."
    },
    {
      "title": "Los formatos que tienes de verdad",
      "text": "El HEIC del iPhone y el TIFF se convierten a la entrada, el AVIF y el WebP se escriben a la salida cuando el navegador puede, y la rotación del EXIF se aplica para que nada acabe tumbado."
    },
    {
      "title": "Nada sale de la pestaña",
      "text": "La decodificación, la codificación, la paleta y la medición corren en tu navegador. Sin API, sin subidas, sin cuenta."
    }
  ],
  "seoHeroTitle": "El compresor de imágenes que te dice cuánto ha costado la compresión",
  "seoHeroText": "CompressSnap lee JPEG, PNG, WebP, AVIF, GIF, BMP, TIFF y los HEIC que produce un iPhone, y escribe de vuelta JPEG, PNG, WebP y AVIF. Cumple un límite en bytes buscando la calidad que encaja, adelgaza los PNG reduciendo su paleta en vez de fingir que un control de calidad hace algo, y mide cada resultado contra su origen para que el trato que has hecho se vea.",
  "seoHeroList": [
    "Sin registros ni cuentas",
    "Comprime varias imágenes a la vez",
    "Convierte a WebP, JPG o PNG"
  ],
  "seoBrowserSpeedTitle": "Medido, no supuesto",
  "seoBrowserSpeedText": "Cada archivo comprimido se vuelve a decodificar y se compara con lo que entró. El número es SSIM, la medida que sigue lo que la gente nota de verdad, y va justo al lado del tamaño para poder pesar uno contra otro.",
  "seoSecondaryTitle": "¿Por qué comprimir tus imágenes?",
  "seoUseCaseTitle": "Los casos incómodos, resueltos",
  "seoUseCaseText": "Un HEIC recién salido de un iPhone, una foto vertical cuya rotación vive en una etiqueta EXIF, una captura PNG que engorda al pasarla por JPEG, un fotograma de 48 megapíxeles que no cabe en un canvas: todos son el caso normal, y cada uno se convierte, se rota, se marca o se limita en vez de fallar en silencio.",
  "seoPrivacyTitle": "Todo dentro de tu navegador",
  "seoPrivacyText": "Detrás de esta página no hay ninguna API. Los decodificadores, el codificador, la reducción de paleta y la medición de calidad son JavaScript corriendo en tu pestaña, así que la foto de un cliente sin publicar no sale de tu máquina.",
  "seoKeywordsTitle": "Palabras clave",
  "seoKeywords": [
    "comprimir imágenes",
    "comprimir jpeg online",
    "comprimir png",
    "convertir a webp",
    "convertir a avif",
    "heic a jpg",
    "comprimir imagen a 200kb",
    "reducir tamaño de imagen",
    "compresión por lotes",
    "redimensionar imágenes online",
    "reducir paleta png",
    "calidad de imagen ssim"
  ],
  "faqTitle": "Preguntas Frecuentes",
  "faq": [
    {
      "question": "¿Se envían mis datos a algún servidor?",
      "answer": "No. La decodificación, la codificación, la reducción de paleta y la medición de calidad funcionan dentro de tu navegador. Una imagen que abras aquí no sale de la pestaña."
    },
    {
      "question": "¿Por qué comprimir un PNG no hace nada?",
      "answer": "Porque el PNG no tiene pérdida y todos los codificadores ignoran el argumento de calidad: enseñar un control de calidad para PNG, como se hacía antes, era engañoso. Lo que sí lo hace más pequeño es usar menos colores, así que para PNG tienes un control de paleta. En capturas, logotipos y dibujo plano, bajar a 64 o 128 colores no se nota y muchas veces reduce el archivo a la mitad."
    },
    {
      "question": "¿Puede comprimir a un tamaño concreto?",
      "answer": "Sí. Activa el límite de tamaño, escribe un número en kilobytes y el codificador busca la calidad por bisección hasta que el archivo entra, con un máximo de ocho intentos. Cada resultado muestra en qué calidad se quedó y cuántas codificaciones hicieron falta."
    },
    {
      "question": "¿Qué es el SSIM y por qué me importa?",
      "answer": "Similitud estructural: un número de 0 a 1 sobre lo parecida que es la imagen comprimida a la original, ponderado como pondera la vista humana. Se mide decodificando el resultado y comparándolo píxel a píxel. Por encima de 0,98 casi nadie nota nada; por debajo de 0,95 empiezan a verse los artefactos. Convierte «¿se ve bien con calidad 70?» en algo que puedes leer en pantalla."
    },
    {
      "question": "¿Acepta fotos de mi iPhone?",
      "answer": "Sí. Los HEIC y HEIF se convierten a la entrada, igual que los TIFF, y la rotación que el iPhone guarda en la etiqueta EXIF se aplica para que una foto vertical no salga tumbada. La versión anterior rechazaba el HEIC directamente en el selector de archivos."
    },
    {
      "question": "¿Por qué una de mis imágenes ha vuelto sin cambios?",
      "answer": "Porque comprimirla la habría hecho más grande. Pasa sobre todo con capturas y gráficos planos pasados por JPEG a calidad alta. En vez de darte un archivo peor, la herramienta lo marca y se queda con el original."
    },
    {
      "question": "¿Se quitan los datos EXIF?",
      "answer": "Sí: recodificar a través de un canvas elimina todos los bloques de metadatos, incluidas las coordenadas GPS y los datos de la cámara. La única pieza que importa visualmente, la etiqueta de orientación, se aplica antes a los píxeles para que la imagen quede derecha."
    },
    {
      "question": "¿Un lote grande congela la página?",
      "answer": "No. La codificación va en un Web Worker con OffscreenCanvas y los datos de imagen se transfieren en vez de copiarse, así que la página sigue respondiendo mientras avanza la cola. Se codifican dos imágenes a la vez, que es rápido sin tener varios fotogramas a resolución completa en memoria al mismo tiempo."
    }
  ],
  "footerTagline": "Comprime, redimensiona y convierte imágenes en tu navegador, con la pérdida de calidad medida.",
  "footerCredit": "Parte de la suite de oLoveTools",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "¡Correo copiado al portapapeles!",
  "contactForIdeas": "Contacto para ideas y comentarios:",
  "presetsLabel": "Ajustes rápidos",
  "presetExtreme": "Extrema",
  "summaryTitle": "Resultado estimado",
  "scaleHint": "Reduce el ancho y alto de la imagen.",
  "followGlobalBtn": "Usar ajustes globales",
  "statusDone": "Completado",
  "individualSettings": "Ajustes Personalizados",
  "globalSettings": "Ajustes Globales",
  "originalFormat": "Formato Original",
  "compareTitle": "Comparación Visual Antes y Después",
  "privacyPolicy": "Política de Privacidad",
  "termsOfService": "Términos de Servicio",
  "cookiePolicy": "Política de Cookies",
  "privacyContent": "Tu privacidad es importante para nosotros.\n\nSolo recopilamos la información necesaria para proporcionar nuestro servicio. Esto incluye datos técnicos de tu navegador y dispositivo para asegurar el correcto funcionamiento de la herramienta.\n\nNunca almacenamos, rastreamos ni analizamos tus imágenes. Todo el procesamiento ocurre de forma local en tu navegador, asegurando que tus datos nunca abandonen tu dispositivo.",
  "termsContent": "Al utilizar CompressSnap, aceptas estos términos.\n\n1. Esta herramienta se proporciona \"tal cual\", sin garantías de ningún tipo.\n2. No nos hacemos responsables de pérdidas de datos ni de problemas derivados del uso de la herramienta.\n3. Eres responsable de los contenidos que proceses con esta herramienta.\n4. Nos reservamos el derecho de modificar estos términos en cualquier momento.",
  "cookiesContent": "Utilizamos cookies para mejorar tu experiencia.\n\n1. Cookies esenciales: Requeridas para el funcionamiento básico del sitio.\n2. Cookies de preferencias: Usadas para recordar tu idioma y consentimiento de cookies.\n\nPuedes gestionar o desactivar las cookies en los ajustes de tu navegador en cualquier momento.",
  "contact": "Contacto"
};
