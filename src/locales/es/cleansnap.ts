export default {
  "title": "CleanSnap",
  "seo_title": "CleanSnap | Quita marcas de agua y objetos de tus fotos",
  "seo_description": "Pinta encima de una marca de agua, un logo o un objeto que sobra y CleanSnap reconstruye lo que había detrás copiando trozos de la propia foto. Funciona en tu navegador, con barra de progreso y botón de cancelar. No se sube nada.",
  "seoHeroTitle": "CleanSnap",
  "seoHeroText": "Pinta encima de lo que quieras quitar y el hueco se reconstruye con el resto de la foto: con su textura y sus bordes, no con un borrón.",
  "seoBrowserSpeedTitle": "El trabajo va en un hilo aparte",
  "seoBrowserSpeedText": "Reconstruir un hueco obliga a rastrear la foto buscando parches que encajen, y eso pesa de verdad. Corre en un Web Worker con barra de progreso real y botón de cancelar, así que la página nunca se congela mientras trabaja.",
  "seoUseCaseTitle": "Cuatro rellenos, y cada uno dice lo que hace",
  "seoUseCaseText": "Dos reconstruyen: parches para textura y detalle, difusión para cielos y paredes lisas. Dos sólo tapan: desenfoque y mosaico. Están en grupos separados porque tapar algo no es lo mismo que quitarlo.",
  "seoPrivacyTitle": "La foto no sale de tu dispositivo",
  "seoPrivacyText": "Sin subidas, sin cuenta y sin descargar ningún modelo. La imagen se descodifica, se edita y se exporta dentro de tu navegador, y una vez cargada la página funciona sin conexión.",
  "hero": {
    "badge": "Funciona en tu navegador",
    "title": "Pinta encima de lo que sobra.",
    "titleHighlight": "El resto de la foto lo rellena.",
    "subtitle": "CleanSnap reconstruye el hueco copiando trozos de la propia imagen, así que la textura y los bordes continúan por dentro. No se sube nada, y no empieza nada hasta que pulsas el botón.",
    "trust1": "Sin subidas ni cuenta",
    "trust2": "Resolución completa",
    "trust3": "Se puede cancelar"
  },
  "ui": {
    "dropTitle": "Suelta aquí una foto",
    "dropHint": "O haz clic para elegirla. También puedes pegar desde el portapapeles.",
    "reading": "Leyendo la imagen…",
    "newImage": "Otra imagen",
    "scaledNote": "Trabajando a tamaño reducido — el archivo era de {w}×{h}",
    "shortcuts": "B/R/C/E herramientas · [ ] pincel · Espacio para ojear · Intro para aplicar",
    "brush": "Pincel",
    "rect": "Rectángulo",
    "circle": "Elipse",
    "eraser": "Despintar",
    "pan": "Desplazar",
    "size": "Tamaño",
    "invert": "Invertir",
    "clearSel": "Limpiar",
    "apply": "Rellenar la selección",
    "cancel": "Cancelar",
    "undo": "Deshacer",
    "redo": "Rehacer",
    "reset": "Reiniciar",
    "download": "Descargar",
    "quality": "Calidad",
    "output": "Salida",
    "tookMs": "{ms} ms",
    "stageOriginal": "Original",
    "stageCurrent": "Copia de trabajo",
    "stageHint": "Rueda para el zoom · arrastra con H para desplazar · mantén Espacio o el clic derecho para ver el original",
    "zoomIn": "Acercar",
    "zoomOut": "Alejar",
    "fit": "Ajustar",
    "dismiss": "Descartar",
    "errors": {
      "decode": "Ese archivo no se ha podido abrir como imagen.",
      "nomask": "Pinta algo primero: no hay ninguna selección que rellenar."
    },
    "fill": {
      "rebuildTitle": "Reconstruir lo que había",
      "hideTitle": "Sólo taparlo",
      "hideNote": "Estos dos no quitan nada: lo cubren. Van bien para una cara o una matrícula, y no sirven para una marca de agua que quieres que desaparezca.",
      "methods": {
        "patch": "Parches",
        "smooth": "Suave",
        "blur": "Desenfoque",
        "pixelate": "Mosaico"
      },
      "methodHints": {
        "patch": "Copia trozos que encajan de otras partes de la foto y avanza hacia dentro, empezando por los bordes. El único que devuelve textura.",
        "smooth": "Extiende hacia el hueco los colores de alrededor. Perfecto para un cielo o una pared lisa; un borrón sobre cualquier cosa con detalle.",
        "blur": "Promedia el entorno sobre la selección. Tapa, no reconstruye.",
        "pixelate": "Sustituye la selección por bloques. Tapa, no reconstruye."
      },
      "patchSize": "Tamaño del parche",
      "patchSizeHint": "Pequeño sigue mejor el detalle fino; grande copia textura más coherente. 9 px vale para casi cualquier marca de agua.",
      "searchRadius": "Radio de búsqueda",
      "searchRadiusHint": "Hasta dónde buscar trozos que encajen alrededor del hueco. Más lejos es más lento y rara vez mejor: el parche bueno suele estar al lado.",
      "strength": "Intensidad",
      "grow": "Ensanchar selección",
      "growHint": "Las marcas de agua llevan un halo suave que no se ve al pintar. Con dos píxeles de más suele bastar para cogerlo.",
      "feather": "Suavizar la costura",
      "featherHint": "Funde el contorno para que el arreglo no se delate por un escalón de un píxel."
    }
  },
  "next": {
    "nextStepTitle": "Sigue trabajando",
    "nextStepHint": "La foto limpia viaja contigo, sin volver a subirla",
    "nextCrop": "Recortarla",
    "nextWatermark": "Poner tu marca",
    "nextCompress": "Comprimirla",
    "nextFormat": "Cambiar de formato",
    "nextExif": "Quitar metadatos"
  },
  "how": {
    "title": "Cómo funciona",
    "subtitle": "Tres pasos, y el pesado te espera a ti.",
    "steps": [
      {
        "title": "Abre la foto",
        "text": "Se descodifica una vez y se queda a resolución completa. No se cambia nada y nada sale de tu dispositivo."
      },
      {
        "title": "Pinta encima",
        "text": "Pincel, rectángulo o elipse. Acércate todo lo que haga falta: la selección se guarda al tamaño real de la foto, no al de la vista previa."
      },
      {
        "title": "Rellénalo",
        "text": "Elige un método y pulsa el botón. Tienes barra de progreso, botón de cancelar y el tiempo que ha costado."
      }
    ]
  },
  "features": {
    "title": "Qué ha cambiado por dentro",
    "items": [
      {
        "title": "Parches, no un borrón",
        "desc": "El hueco se rellena copiando trozos de otras partes de la misma foto, así que el ladrillo sigue siendo ladrillo y la hierba, hierba. La difusión sola sólo puede dar la superficie más lisa que encaje con el borde."
      },
      {
        "title": "Los bordes continúan",
        "desc": "El orden de relleno lo decide cuánta estructura cruza cada punto del contorno, así que una línea o un horizonte entran antes en el hueco y siguen rectos en vez de cortarse."
      },
      {
        "title": "Fuera del hilo principal",
        "desc": "El trabajo va en un Web Worker por tramos cronometrados: la barra avanza, la página se sigue usando y Cancelar detiene de verdad a mitad de camino."
      },
      {
        "title": "La selección es tuya",
        "desc": "Ensánchala, estréchala, inviértela, suaviza su costura, y vuelve a ejecutar con otro método sobre la misma selección sin repintar nada."
      },
      {
        "title": "No se sube nada",
        "desc": "Descodificar, editar y exportar ocurre todo en tu navegador. Sin cuenta, sin modelo que descargar, y funciona sin conexión."
      },
      {
        "title": "Deshacer que cuesta kilobytes",
        "desc": "Sólo se guarda el rectángulo que cambió, no el fotograma entero: cuarenta pasos de historial caben en lo que antes ocupaba uno."
      }
    ]
  },
  "faqTitle": "Preguntas frecuentes",
  "faq": [
    {
      "question": "¿Se sube mi foto a algún sitio?",
      "answer": "No. Se descodifica, se edita y se exporta dentro de tu navegador con el canvas y un Web Worker. No se manda nada a ningún servidor, no hay cuenta, y una vez cargada la página funciona sin ninguna conexión."
    },
    {
      "question": "¿Hay un modelo de IA detrás?",
      "answer": "No, y ya no dice que lo haya. La versión anterior ofrecía un \"modo IA\" que ejecutaba exactamente la misma difusión que el normal, sólo que con más iteraciones. Lo que hay ahora es propagación de parches: el hueco se rellena copiando trozos reales de tu propia foto. Sin red neuronal, sin descargas, y contando lo que hace de verdad."
    },
    {
      "question": "¿Por qué a veces el resultado sigue quedando raro?",
      "answer": "Porque el relleno sólo puede usar lo que ya está en la imagen. Si lo que has quitado tapaba algo único —una cara, un texto, un objeto irrepetible— no hay de dónde copiarlo, y lo que sale es una textura verosímil, no la verdad. Funciona mejor sobre fondos que se repiten: cielo, paredes, vegetación, asfalto, agua."
    },
    {
      "question": "¿Para qué sirve cada relleno?",
      "answer": "Parches para cualquier cosa con textura o estructura. Suave para cielos, paredes lisas y degradados, donde además es más rápido y mejor. Desenfoque y mosaico no quitan nada en absoluto: lo cubren, que es lo que quieres para una cara o una matrícula y justo lo que no quieres para una marca de agua."
    },
    {
      "question": "La selección parece correcta pero queda un contorno tenue. ¿Por qué?",
      "answer": "Las marcas de agua suelen ser semitransparentes y llevan un halo suave de unos pocos píxeles que es fácil no ver mientras pintas. Sube \"Ensanchar selección\" dos o tres píxeles para que el halo quede dentro del hueco y se reconstruya también."
    },
    {
      "question": "¿Puedo parar un relleno que se está eternizando?",
      "answer": "Sí. Reconstruir obliga a rastrear la foto buscando parches que encajen, así que una selección grande tarda de verdad. El trabajo se parte en tramos cortos dentro de un hilo en segundo plano, y eso es justo lo que permite que la barra avance y que Cancelar surta efecto a mitad, no sólo al final."
    },
    {
      "question": "¿Me reduce la foto?",
      "answer": "Sólo a partir de unos 24 megapíxeles, y cuando lo hace lo dice en pantalla junto a las dimensiones originales. La versión anterior recortaba en silencio toda imagen a 1920 píxeles, así que descargabas algo más pequeño de lo que habías subido sin enterarte."
    },
    {
      "question": "¿Qué formatos puedo abrir y guardar?",
      "answer": "Abre JPG, PNG, WebP, AVIF, GIF y el HEIC que hacen los iPhone. Guarda en PNG, JPG o WebP, con deslizador de calidad para los dos con pérdida: la versión anterior escribía siempre PNG, lo que convertía un JPEG pequeño en un archivo mucho más grande."
    }
  ],
  "seoKeywordsTitle": "Palabras clave",
  "seoKeywords": [
    "quitar marca de agua de una foto",
    "eliminar marca de agua",
    "quitar objetos de una foto",
    "inpainting online",
    "relleno según el contenido online",
    "borrar objetos de imágenes",
    "quitar logo de una imagen",
    "quitar texto de una foto",
    "retoque de fotos en el navegador",
    "quitar marcas de agua gratis sin subir nada",
    "quitar personas de las fotos",
    "tampón de clonar online"
  ],
  "footer_seo_title": "Una herramienta de retoque que enseña lo que hace",
  "footer_seo_paragraph1": "CleanSnap quita marcas de agua, logos, fechas y objetos que sobran de tus fotos enteramente dentro de tu navegador. Pintas encima de lo que quieres que desaparezca con pincel, rectángulo o elipse, acercándote todo lo que necesites, y el hueco se reconstruye copiando trozos que encajan de otras partes de la misma imagen, rellenando antes los bordes y las líneas para que la estructura continúe por dentro en vez de cortarse.",
  "footer_seo_paragraph2": "Y se niega a venderse de más. No hay modelo de IA ni un \"modo inteligente\" que en realidad sea el mismo código dos veces; el desenfoque y el mosaico van en su propio grupo porque tapan en lugar de quitar; la imagen conserva su resolución y avisa cuando no puede; y el relleno corre en un hilo en segundo plano con una barra que puedes cancelar. No se sube nada en ningún momento.",
  "footerCredit": "Parte de la suite oLoveTools",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "¡Copiado!",
  "contactForIdeas": "Contacta para ideas y comentarios:",
  "footerTagline": "Quita marcas de agua y objetos que sobran de tus fotos pintando encima. El hueco se reconstruye con la propia imagen, enteramente en tu navegador."
};
