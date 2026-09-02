export default {
  "resetHint": "Empezar de nuevo",
  "languageName": "Español",
  "header": {
    "subtitle": "CONVERSOR DE FORMATOS DE IMAGEN"
  },
  "hero": {
    "badge": "Funciona en tu navegador",
    "title": "Convierte imágenes al formato que necesitas,",
    "titleHighlight": "y mira lo que ha costado",
    "subtitle": "Suelta hasta 50 fotos, elige formato, tamaño y peso, y convierte cuando lo tengas claro. No se sube nada y no empieza nada hasta que pulsas el botón.",
    "trust1": "Sin subidas ni cuenta",
    "trust2": "Calidad medida (SSIM)",
    "trust3": "Lotes de 50"
  },
  "dropzone": {
    "title": "Suelta aquí tus imágenes",
    "subtitle": "Hasta {max} a la vez. También puedes pegar desde el portapapeles.",
    "waits": "Los archivos esperan aquí: la conversión solo arranca cuando pulsas Convertir.",
    "tooMany": "La cola admite 50 imágenes; los archivos de más se han quedado fuera.",
    "unsupported": "EPS y RAW de cámara no se pueden descodificar en un navegador, así que se han descartado.",
    "decodeFailed": "Ese archivo no se ha podido descodificar como imagen.",
    "full": "La cola está llena. Quita una imagen para añadir otra."
  },
  "stage": {
    "original": "Original",
    "converted": "Convertida",
    "stale": "Ajustes cambiados",
    "zoomIn": "Acercar",
    "zoomOut": "Alejar",
    "fit": "Ajustar",
    "splitLabel": "Divisor de comparación",
    "stageHint": "Rueda para hacer zoom sobre el puntero, arrastra para desplazar. Mantén Espacio, Alt o el clic derecho para ver el original."
  },
  "controls": {
    "presetsTitle": "Ajustes rápidos",
    "presets": {
      "web": "Web (WEBP, 1920px)",
      "social": "Redes (JPG, 1440px)",
      "archive": "Archivo (PNG, tamaño real)",
      "email": "Correo (menos de 500 KB)"
    },
    "presetsHint": "Un ajuste rápido solo rellena los mandos de abajo. Ignóralo y ponlo todo a mano si lo prefieres.",
    "outputFormat": "Formato de salida",
    "formatUnavailable": "Tu navegador no sabe escribir este formato",
    "formatUnavailableHint": "Los formatos tachados son aquellos para los que este navegador no tiene codificador. Lo comprobamos en vez de suponerlo, así que nunca te llevas un PNG con la extensión cambiada.",
    "qualityTitle": "Calidad y peso",
    "quality": "Calidad",
    "qualityLossless": "Este formato es sin pérdida, así que la calidad no hace nada aquí.",
    "targetSize": "Apuntar a un peso máximo",
    "targetSizeHint": "La calidad se busca por bisección: hasta 8 codificaciones para quedarse justo por debajo del límite.",
    "resizeTitle": "Tamaño",
    "resizeModes": {
      "none": "Mantener",
      "scale": "Escala",
      "longEdge": "Lado largo",
      "dimensions": "Exacto"
    },
    "scale": "Escala",
    "longEdgeHint": "lado más largo",
    "lockAspect": "Mantener la proporción",
    "fits": {
      "contain": "Contener",
      "cover": "Cubrir",
      "stretch": "Estirar"
    },
    "sharpen": "Enfocar tras redimensionar",
    "sharpenHint": "Máscara de enfoque solo sobre la luminancia, para que los bordes queden nítidos sin halos de color.",
    "transformTitle": "Giro y fondo",
    "flipH": "Voltear en horizontal",
    "flipV": "Voltear en vertical",
    "background": "Fondo bajo la imagen (formatos sin transparencia)",
    "engineTitle": "Motor",
    "measureQuality": "Medir la calidad",
    "measureQualityHint": "Vuelve a descodificar el resultado y lo compara con el original (SSIM). Cuesta unos milisegundos.",
    "livePreview": "Vista previa en vivo",
    "livePreviewHint": "Desactivada por defecto: con ella, cada cambio vuelve a convertir la imagen seleccionada.",
    "undo": "Deshacer",
    "redo": "Rehacer",
    "historyHint": "Historial de ajustes"
  },
  "editor": {
    "startOver": "Empezar de nuevo",
    "shortcuts": "← → para moverte, Intro para convertir, Ctrl+Z para deshacer",
    "queue": "Cola",
    "addMore": "Añadir más",
    "remove": "Quitar de la cola",
    "perImage": "Ajustes solo para esta imagen",
    "perImageOn": "Esta imagen ignora los ajustes globales.",
    "perImageOff": "Esta imagen sigue los ajustes globales.",
    "convert": "Convertir",
    "convertAll": "Convertir todas",
    "converting": "Convirtiendo",
    "reading": "Leyendo",
    "download": "Descargar",
    "downloadZip": "ZIP",
    "dimensions": "Dimensiones",
    "size": "Peso",
    "vsOriginal": "frente al original",
    "quality": "Calidad",
    "attempts": "pasadas",
    "ssimBands": {
      "identical": "indistinguible",
      "excellent": "excelente",
      "good": "buena",
      "fair": "se nota de cerca",
      "poor": "claramente degradada"
    },
    "icoMultisize": "El .ico lleva versiones de 16, 32, 48, 64, 128 y 256 px; el tamaño que se muestra es el de la mayor que hay dentro.",
    "missedTarget": "No se ha podido cumplir el peso máximo ni con la calidad más baja. Este es el resultado más pequeño posible.",
    "notConverted": "Todavía sin convertir",
    "notConvertedHint": "Tu archivo está cargado y esperando. Ajusta lo que necesites y pulsa Convertir.",
    "engineNote": "La codificación va en {n} workers en segundo plano, así que la página nunca se congela. Cada imagen se descodifica una vez y todas las conversiones parten de ahí.",
    "dismiss": "Descartar",
    "backToTop": "Volver arriba"
  },
  "next": {
    "nextStepTitle": "Sigue trabajando",
    "nextStepHint": "El resultado viaja contigo, sin volver a subirlo",
    "nextCompress": "Comprimirla",
    "nextCrop": "Recortarla",
    "nextExif": "Quitar metadatos",
    "nextWatermark": "Poner marca de agua",
    "nextCutout": "Quitar el fondo"
  },
  "how": {
    "title": "Cómo funciona",
    "subtitle": "Tres pasos, y ninguno arranca por su cuenta.",
    "steps": [
      {
        "title": "Suelta los archivos",
        "text": "Se descodifican una vez y esperan en la cola. No se convierte nada y nada sale de tu dispositivo."
      },
      {
        "title": "Elige la salida",
        "text": "Formato, calidad, tamaño, giro, fondo. O un ajuste rápido y listo."
      },
      {
        "title": "Convierte y compara",
        "text": "Te llevas el peso, las dimensiones y una nota SSIM de lo que ha costado la conversión."
      }
    ]
  },
  "features": {
    "title": "Lo que hace y un conversor cualquiera no",
    "items": [
      {
        "title": "Workers en paralelo",
        "desc": "La codificación va fuera del hilo principal y repartida en varios workers, así que la página responde igual con 50 imágenes en la cola."
      },
      {
        "title": "Formatos comprobados, no supuestos",
        "desc": "Cada codificador se prueba al arrancar codificando dos píxeles de verdad. Un navegador que no sabe escribir AVIF no te lo ofrece."
      },
      {
        "title": "Calidad que se puede leer",
        "desc": "Una nota SSIM contra el original te dice lo que ha costado de verdad la compresión, no solo cuánto has ahorrado."
      },
      {
        "title": "Peso objetivo",
        "desc": "Dices \"menos de 500 KB\" y la calidad se busca por bisección, hasta 8 codificaciones, para quedarse justo por debajo."
      },
      {
        "title": "No se sube nada",
        "desc": "Descodificar, redimensionar y codificar ocurre todo en tu navegador. Ningún servidor ve tus fotos, y funciona sin conexión."
      },
      {
        "title": "Lotes con ajustes por imagen",
        "desc": "Hasta 50 imágenes a la vez, y cualquiera de ellas puede irse por su cuenta con su formato y su tamaño."
      }
    ]
  },
  "formats": {
    "title": "Formatos, y lo que te da cada uno de verdad",
    "subtitle": "Entrada: JPG, PNG, WEBP, AVIF, GIF, BMP, SVG, TIFF y HEIC. EPS y RAW de cámara necesitan un intérprete PostScript y una tabla por modelo de cámara, así que no se aceptan en vez de devolverse como un PNG sin avisar.",
    "rows": [
      {
        "label": "WEBP",
        "desc": "Hoy por hoy el mejor equilibrio entre peso y calidad para la web, con transparencia. Compatible con todo lo que importa."
      },
      {
        "label": "AVIF",
        "desc": "Aún más pequeño a igual calidad, pero solo algunos navegadores saben escribirlo. Si el tuyo no puede, el botón sale desactivado."
      },
      {
        "label": "JPG",
        "desc": "El formato fotográfico universal. Sin transparencia, así que eliges tú el color de fondo que va debajo."
      },
      {
        "label": "PNG",
        "desc": "Sin pérdida y con transparencia. El deslizador de calidad no hace nada aquí, y por eso sale apagado."
      },
      {
        "label": "ICO",
        "desc": "Un icono multitamaño de verdad: 16, 32, 48, 64, 128 y 256 px en un solo archivo, recortado al cuadrado por el centro."
      },
      {
        "label": "PDF",
        "desc": "Una página ajustada a la imagen, con un JPEG dentro a la calidad que hayas elegido."
      },
      {
        "label": "TIFF",
        "desc": "RGBA sin comprimir para imprenta y archivo. También se acepta como entrada."
      },
      {
        "label": "SVG",
        "desc": "Un envoltorio: el ráster va incrustado dentro de un SVG. No vectoriza —ninguna herramienta de navegador lo hace— pero sirve donde solo aceptan .svg."
      }
    ]
  },
  "app": {
    "footer": "Todo se ejecuta en tu navegador.",
    "contactFeedback": "CONTACTO PARA IDEAS Y FEEDBACK:",
    "copiedEmail": "¡Copiado!"
  },
  "faqTitle": "Preguntas frecuentes",
  "faq": [
    {
      "question": "¿Se suben mis imágenes a algún sitio?",
      "answer": "No. Descodificar, redimensionar y codificar ocurre dentro de tu navegador, con el canvas y web workers. No se manda nada a ningún servidor y, una vez cargada la página, funciona sin conexión."
    },
    {
      "question": "¿Por qué hay formatos tachados?",
      "answer": "Porque tu navegador no tiene codificador para ellos. Los navegadores no lo avisan: si les pides un GIF o un HEIC te devuelven un PNG con el tipo cambiado sin decir nada. Al arrancar codificamos dos píxeles en cada formato y miramos qué sale de verdad, así solo se te ofrece lo que funciona."
    },
    {
      "question": "¿Puede convertir a HEIC, EPS o RAW de cámara?",
      "answer": "No, y ya no finge que sí. Ningún navegador sabe escribir HEIC, EPS necesita un intérprete PostScript y RAW es un formato de sensor distinto por cada modelo de cámara. HEIC y TIFF sí se aceptan como entrada; los archivos EPS y RAW se rechazan con un mensaje en lugar de volver como un PNG mal etiquetado."
    },
    {
      "question": "¿Qué es el número SSIM que sale junto al resultado?",
      "answer": "Es una nota de parecido entre la imagen convertida y el original, de 0 a 1. Por encima de 0,98 la diferencia cuesta mucho verla; por debajo de 0,95 empiezan a notarse artefactos en fotografías. Está ahí porque \"has ahorrado un 68%\" solo cuenta la mitad amable de la historia."
    },
    {
      "question": "¿Por qué no pasa nada al soltar un archivo?",
      "answer": "Es a propósito. Soltar un archivo solo lo descodifica y lo pone en la cola. La conversión —la parte cara— espera a que pulses Convertir, para que lo dejes todo preparado en vez de perseguir una vista previa que se reinicia sola."
    },
    {
      "question": "¿Se pierde detalle al redimensionar?",
      "answer": "Cualquier reducción grande lo pierde, pero cuánto depende del motor. Algunos navegadores reducen de una pasada con un núcleo de 2x2 y tiran el resto de los píxeles, lo que se ve como bordes dentados. FormatFlow lo mide al arrancar —reduce un patrón de prueba y lo compara con una media exacta— y solo recurre a reducir la imagen a mitades sucesivas cuando el navegador lo necesita. Si el navegador ya filtra bien, esas pasadas de más costarían tiempo sin cambiar nada, así que se saltan. Encima puedes añadir una pasada de enfoque."
    },
    {
      "question": "¿Por qué ya no salen giradas las fotos del móvil?",
      "answer": "Porque la imagen se descodifica con createImageBitmap y la orientación EXIF se aplica ahí, una sola vez. El método anterior cargaba el archivo en un elemento <img>, donde unos navegadores aplican la etiqueta de orientación y otros no, y el canvas se quedaba con el fotograma sin girar."
    },
    {
      "question": "¿Cuántas imágenes puedo convertir a la vez?",
      "answer": "Cincuenta. Se codifican a la vez repartidas en varios workers en segundo plano, y cada una puede llevar su propio formato y tamaño si activas los ajustes por imagen."
    }
  ],
  "seoKeywordsTitle": "Palabras clave",
  "seoKeywords": [
    "conversor de imágenes",
    "convertir HEIC a JPG",
    "PNG a WEBP",
    "JPG a AVIF",
    "WEBP a PNG",
    "TIFF a JPG",
    "imagen a ICO",
    "generador de favicon",
    "imagen a PDF",
    "conversor de imágenes por lotes",
    "redimensionar imágenes online",
    "comprimir imágenes a un peso concreto",
    "conversor de imágenes sin conexión",
    "conversor de imágenes gratis sin subir nada"
  ],
  "footer_seo_title": "Un conversor que te cuenta lo que ha hecho",
  "footer_seo_paragraph1": "FormatFlow convierte imágenes entre JPG, PNG, WEBP, AVIF, ICO, PDF, TIFF y SVG enteramente dentro de tu navegador. Lee HEIC de iPhone y TIFF como entrada, redimensiona por escala, por lado largo o a dimensiones exactas, gira, voltea, elige el color de fondo para los formatos sin transparencia y puede ajustarse a un peso máximo buscando la calidad adecuada.",
  "footer_seo_paragraph2": "Lo que no hace es mentirte. Los formatos que tu navegador no sabe codificar salen desactivados en vez de devolver un PNG con la extensión cambiada, EPS y RAW de cámara se rechazan de plano, y cada resultado viene con su peso, sus dimensiones y una nota SSIM de la calidad que ha costado. No se sube nada: todo el proceso ocurre en tu máquina.",
  "seo_title": "FormatFlow | Conversor de imágenes con calidad medida",
  "seo_description": "Convierte imágenes a WEBP, AVIF, JPG, PNG, ICO, PDF, TIFF o SVG en tu navegador. Lotes de 50, peso objetivo, ICO multitamaño real, entrada HEIC y TIFF, y nota de calidad SSIM. No se sube nada."
};
