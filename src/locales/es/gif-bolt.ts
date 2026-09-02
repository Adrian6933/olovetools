export default {
  "resetHint": "Empezar de nuevo",
  "title": "GIFBolt",
  "description": "Extrae fotogramas de un vídeo o encadena imágenes, edita la línea de tiempo y codifica un GIF con paleta global y compresión entre fotogramas, todo en tu navegador.",
  "tab_video": "Vídeo a GIF",
  "tab_images": "Imágenes a GIF",
  "label_upload_video": "Subir Vídeo",
  "label_upload_images": "Subir Imágenes",
  "label_duration": "Retraso de fotograma (ms)",
  "label_fps": "Tasa de fotogramas (FPS)",
  "label_size": "Ancho del GIF",
  "label_quality": "Calidad de compresión",
  "label_trim": "Rango de corte",
  "label_start": "Tiempo de inicio",
  "label_end": "Tiempo de fin",
  "btn_generate": "Generar GIF",
  "btn_generating": "Compilando GIF...",
  "btn_download": "Descargar GIF",
  "text_progress_extract": "Extrayendo fotogramas...",
  "text_progress_compile": "Compilando fotogramas...",
  "history_title": "Historial de GIF Reciente",
  "no_history": "No hay historial de GIF todavía.",
  "clear_history": "Limpiar Historial",
  "quality_high": "Alta calidad",
  "quality_medium": "Calidad media",
  "quality_low": "Baja calidad (Rápido)",
  "drop_zone_video": "MP4, WebM, MOV, MKV, AVI — o imágenes PNG, JPG, WebP, AVIF, GIF, BMP y HEIC.",
  "drop_zone_images": "PNG, JPG, WebP, AVIF, GIF, BMP y HEIC. Suéltalas en el orden en que quieras verlas.",
  "seo_title": "GIFBolt | Conversor Gratis de Vídeo a GIF e Imágenes a GIF Online",
  "seo_description": "Convierte vídeo o secuencias de imágenes en GIFs animados desde el navegador: línea de tiempo editable, paleta global, tramado Floyd–Steinberg y compresión entre fotogramas. No se sube nada.",
  "seoHeroTitle": "Convierte un vídeo o un montón de imágenes en un GIF, en el propio navegador",
  "seoHeroText": "Extrae los fotogramas de un clip, edita la línea de tiempo y codifica con paleta global, tramado y compresión entre fotogramas. No se sube nada.",
  "seoHeroList": [
    "Los fotogramas siguen siendo editables antes de codificar",
    "Una única paleta para todo el bucle",
    "No se sube nada ni se descarga nada"
  ],
  "seoBrowserSpeedTitle": "Un codificador de GIF de verdad, no un volcado de canvas",
  "seoBrowserSpeedText": "Los fotogramas se leen directamente del vídeo ya decodificado con un reescalado de alta calidad, sin pasar nunca por un JPEG intermedio. La paleta se construye por corte mediano sobre toda la animación, los píxeles se mapean con tramado Floyd–Steinberg en serpentina y todo lo que un fotograma comparte con el anterior se escribe como transparente y se hereda. El trabajo se reparte entre varios web workers, así que la página sigue respondiendo y la barra de progreso mide fotogramas reales.",
  "seoUseCaseTitle": "Para informes de errores, demos y bucles de reacción",
  "seoUseCaseText": "Graba un fallo una vez y recórtalo a los cuatro segundos que importan. Convierte el recorrido de un diseño en algo que se reproduzca solo dentro de una pull request. O encadena unas cuantas capturas y ajústales el tiempo a mano. La línea de tiempo sigue siendo editable hasta que pulsas codificar.",
  "seoPrivacyTitle": "No se sube nada, y tampoco se descarga nada",
  "seoPrivacyText": "Todo ocurre en esta pestaña: el decodificador de vídeo es el del propio navegador, el cuantizador y el compresor LZW son JavaScript que llega con la página, y el resultado es un Blob que nunca sale de tu equipo. No hay servidor al que enviar archivos ni modelo o códec que descargar de un CDN. La contrapartida es honesta: todo está limitado por tu memoria RAM, así que un clip en 4K hay que recortarlo y reducirlo antes de que se pueda codificar.",
  "faqTitle": "Preguntas Frecuentes",
  "faq": [
    {
      "question": "¿Hay un límite de tamaño de archivo?",
      "answer": "Fijo no, pero real sí: los fotogramas viven en la memoria de tu pestaña. Un GIF de 480 px y 4 segundos a 12 fps son unos 50 MB de datos de trabajo y se codifica en un par de segundos; un clip en 4K agotará la pestaña mucho antes de terminar. Recorta el tramo y baja el tamaño de trabajo: para eso están esos controles."
    },
    {
      "question": "¿Por qué mi GIF sigue siendo tan grande?",
      "answer": "El GIF es un formato de 1987: 256 colores y sin compensación de movimiento. Reduce primero el ancho, luego la velocidad y luego la paleta. Dejar activada la opción de «reutilizar los píxeles que no cambian» suele valer más que las tres cosas: en una grabación de pantalla se lleva por delante casi todo el archivo."
    },
    {
      "question": "¿Por qué la velocidad no es exactamente la que he elegido?",
      "answer": "El GIF guarda cada espera en centésimas de segundo, así que solo existen velocidades de la forma 100/n. Pedir 12 fps significa en realidad 8 centésimas por fotograma, es decir, 12,5. El panel muestra la velocidad que vas a obtener de verdad, no la que has pedido."
    },
    {
      "question": "¿Qué formatos admite?",
      "answer": "Cualquier vídeo que el navegador sepa reproducir (MP4/H.264, WebM, MOV y a menudo MKV) y, como imágenes, PNG, JPG, WebP, AVIF, GIF, BMP y el HEIC del iPhone. Un GIF animado que entre como imagen aporta solo su primer fotograma."
    },
    {
      "question": "¿Se sube algo a algún sitio?",
      "answer": "No. No hay paso de subida ni ninguna petición externa: el codificador viaja con la página y se ejecuta en web workers dentro de esta pestaña."
    },
    {
      "question": "¿Puedo conservar la transparencia?",
      "answer": "Sí, con el interruptor «conservar la transparencia». El GIF admite exactamente un color totalmente transparente, así que los bordes suaves se vuelven duros. No se puede combinar con la reutilización de píxeles, porque ambas cosas necesitan esa misma ranura transparente."
    }
  ],
  "footerTagline": "Herramientas de creación de GIF gratuitas, privadas y configurables en cliente.",
  "footerCredit": "Parte de la suite oLoveTools",
  "badge": "Vídeo e imágenes → GIF",
  "dropTitle": "Suelta un vídeo o un conjunto de imágenes",
  "dropHintNothing": "Soltar un archivo no lanza nada: tú eliges los ajustes y pulsas el botón.",
  "modeAuto": "Extraer un tramo",
  "modeManual": "Elegir fotogramas a mano",
  "manualHint": "Recorre el vídeo y añade exactamente los fotogramas que quieras. No se ejecuta ningún proceso automático.",
  "btnCapture": "Capturar este fotograma",
  "labelWorkingSize": "Tamaño de trabajo",
  "extractSummary": "{0} fotogramas a {1}×{2}. A partir de aquí el GIF solo se puede reducir.",
  "btnExtract": "Extraer los fotogramas",
  "btnExtractAgain": "Volver a extraerlos",
  "waitingHint": "Ajusta el tramo y pulsa el botón. Hasta entonces no se ejecuta nada.",
  "btnPlay": "Reproducir",
  "btnPause": "Pausar",
  "btnPrevFrame": "Fotograma anterior",
  "btnNextFrame": "Fotograma siguiente",
  "btnUndo": "Deshacer",
  "btnRedo": "Rehacer",
  "frameSummary": "{0} fotogramas · {1} fps reales",
  "btnSelectAll": "Seleccionar todo",
  "btnSelectNone": "Quitar la selección",
  "btnDeleteSelected": "Borrar {0}",
  "btnKeepSelected": "Conservar solo estos",
  "btnReverse": "Invertir",
  "btnPingPong": "Ida y vuelta",
  "btnHalve": "Quitar uno de cada dos",
  "btnAddImages": "Añadir imágenes",
  "btnResetDelays": "Restablecer los tiempos",
  "delayHint": "El GIF guarda las esperas en centésimas de segundo, así que el valor se ajusta a los 10 ms más cercanos y nunca baja de 20.",
  "outputTitle": "Salida",
  "qualityCustom": "Personalizada",
  "labelDiff": "Reutilizar los píxeles que no cambian",
  "diffHint": "Solo escribe lo que se ha movido entre fotogramas. El mayor ahorro en grabaciones de pantalla.",
  "showAdvanced": "Afinar los detalles",
  "hideAdvanced": "Ocultar los detalles",
  "labelColors": "Tamaño de la paleta",
  "labelDither": "Tramado",
  "ditherHint": "Cambia un poco de ruido por el bandeado que una paleta plana deja en los degradados.",
  "labelDitherStrength": "Intensidad del tramado",
  "labelTolerance": "Tolerancia por píxel",
  "labelAlpha": "Conservar la transparencia",
  "alphaHint": "Traslada los píxeles transparentes al alfa de 1 bit del GIF. No se puede combinar con la reutilización de píxeles.",
  "labelBackground": "Fondo",
  "labelFit": "Cuando las formas no coinciden",
  "fitContain": "Encajar con margen",
  "fitCover": "Llenar y recortar",
  "fitStretch": "Estirar",
  "labelLoop": "Repetir siempre",
  "loopHint": "Desactívalo para reproducirlo un número fijo de veces y detenerlo en el último fotograma.",
  "labelLoopCount": "Reproducciones",
  "btnCancel": "Cancelar",
  "phaseRaster": "Preparando los fotogramas…",
  "phasePalette": "Construyendo la paleta…",
  "resultTitle": "Resultado",
  "statSize": "Peso",
  "statFrames": "Fotogramas",
  "statSizePx": "Tamaño",
  "statColors": "Colores",
  "statReuse": "Píxeles reutilizados",
  "statTime": "Codificado en",
  "statFps": "Fotogramas reales",
  "statPerFrame": "Por fotograma",
  "btnCopy": "Copiar",
  "dismissLabel": "Cerrar",
  "errorVideo": "Este navegador no puede decodificar ese vídeo. Prueba con MP4 (H.264) o WebM.",
  "errorImages": "Al menos una de esas imágenes no se ha podido decodificar.",
  "errorExtract": "No se han podido leer los fotogramas. Puede que el vídeo use un códec que este navegador solo soporta a medias.",
  "errorEncode": "La codificación ha fallado. Prueba con menos fotogramas o con menos ancho.",
  "errorClipboard": "Tu navegador ha bloqueado el portapapeles. Descárgalo en su lugar.",
  "errorTooManyFrames": "Parado en {0} fotogramas: a partir de ahí el GIF no es el formato adecuado.",
  "stageSource": "Fotograma original",
  "stageResult": "GIF codificado",
  "stageHint": "La rueda hace zoom hacia el cursor y arrastrando se desplaza.",
  "stageHintCompare": "La rueda hace zoom hacia el cursor y arrastrando se desplaza. Mantén Alt o el botón derecho para ver el original bajo el GIF.",
  "zoomIn": "Acercar",
  "zoomOut": "Alejar",
  "zoomReset": "Restablecer la vista",
  "stripHint": "Arrastra sobre la tira para seleccionar fotogramas. Mantén Alt o usa el botón derecho para quitarlos.",
  "shortcutsTitle": "Atajos",
  "shortcuts": [
    {
      "keys": "Espacio",
      "label": "reproducir / pausar"
    },
    {
      "keys": "← →",
      "label": "avanzar un fotograma"
    },
    {
      "keys": "Supr",
      "label": "borrar la selección"
    },
    {
      "keys": "A / D",
      "label": "seleccionar todo / nada"
    },
    {
      "keys": "Ctrl+Z",
      "label": "deshacer"
    },
    {
      "keys": "Intro",
      "label": "codificar"
    }
  ],
  "nextStepTitle": "Sigue con esto",
  "nextStepHint": "Envía el fotograma en pantalla como PNG, sin volver a subirlo",
  "nextCrop": "Recórtalo",
  "nextCompress": "Comprímelo",
  "nextCutout": "Quítale el fondo",
  "nextWatermark": "Ponle una marca de agua",
  "nextMeme": "Conviértelo en meme",
  "howItWorksTitle": "Cómo funciona",
  "step1Title": "Suéltalo aquí",
  "step1Text": "Un vídeo o un montón de imágenes. No se sube nada y no se pone en marcha nada solo.",
  "step2Title": "Elige el tramo",
  "step2Text": "Marca el principio y el final y la velocidad, y extrae los fotogramas, o cógelos uno a uno a mano.",
  "step3Title": "Edita la línea de tiempo",
  "step3Text": "Borra fotogramas, inviértelos, alarga uno y ajusta los colores y el tramado.",
  "step4Title": "Codifica y comprueba",
  "step4Text": "Mantén Alt sobre la vista previa para comparar el GIF con el original, y luego descárgalo o pásalo a otra herramienta.",
  "features": [
    {
      "title": "Una sola paleta para todo el clip",
      "text": "Los colores se eligen por corte mediano sobre todos los fotogramas a la vez, así nada cambia de tono a mitad del bucle."
    },
    {
      "title": "Solo se escribe lo que se ha movido",
      "text": "Los píxeles que un fotograma comparte con el anterior se heredan en vez de volver a codificarse. En una grabación de pantalla eso es casi todo el archivo."
    },
    {
      "title": "Tramado que elimina el bandeado",
      "text": "Difusión Floyd–Steinberg en serpentina, con la intensidad en un control, para que los degradados sigan limpios incluso con 64 colores."
    },
    {
      "title": "Una línea de tiempo editable",
      "text": "Borra fotogramas, invierte la secuencia, haz un palíndromo o alarga uno solo. Deshacer no cuesta nada: guarda identificadores, no mapas de bits."
    },
    {
      "title": "Codificado en todos tus núcleos",
      "text": "La animación se reparte entre varios web workers, así que la pestaña sigue usable y la barra de progreso mide fotogramas reales."
    },
    {
      "title": "Nada sale de la pestaña",
      "text": "El decodificador, la paleta y el compresor son JavaScript ejecutándose en tu equipo. Sin subidas y sin modelos descargados de un CDN."
    },
    {
      "title": "Encadenado con el resto de la suite",
      "text": "Pasa el fotograma en pantalla directamente a recortar, comprimir o quitar el fondo sin descargarlo antes."
    }
  ],
  "seoKeywordsTitle": "Búsquedas relacionadas",
  "seoKeywords": [
    "vídeo a gif",
    "crear gif",
    "imágenes a gif",
    "mp4 a gif",
    "comprimir gif",
    "gif animado",
    "convertidor de gif gratis",
    "editor de gif"
  ]
};
