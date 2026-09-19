export default {
  "emailCopied": "¡Copiado!",
  "contactForIdeas": "Contacto para ideas y comentarios:",
  "resetHint": "Empezar de nuevo",
  "title": "SocialBolt",
  "description": "Pega un enlace de TikTok o de X y elige exactamente qué te llevas: vídeo sin marca de agua, pista en HD, audio en MP3, portada o todas las fotos del carrusel.",
  "heroKicker": "Descargador de redes sociales",
  "noAutoNote": "Pegar un enlace no descarga nada. Tú eliges los archivos y después pulsas el botón.",
  "inputLabel": "Enlaces (uno por línea)",
  "placeholder": "https://www.tiktok.com/@usuario/video/…\nhttps://x.com/usuario/status/…",
  "unsupportedTag": "No admitido",
  "shortcutHint": "Intro para analizar · Mayús+Intro para salto de línea · Esc borra",
  "btn_analyze": "Analizar enlaces",
  "btn_fetching": "Analizando…",
  "btn_paste": "Pegar",
  "btn_cancel": "Cancelar",
  "btn_clear": "Vaciar la cola",
  "btn_retry": "Reintentar",
  "btn_remove": "Quitar de la cola",
  "btn_download": "Descargar",
  "btn_download_selected": "Descargar la selección",
  "btn_download_zip": "Descargar en ZIP",
  "queueTitle": "Cola",
  "assetsTitle": "Archivos disponibles",
  "selectAll": "Seleccionar todo",
  "selectNone": "Quitar la selección",
  "status_queued": "En espera",
  "status_resolving": "Leyendo la publicación…",
  "status_ready": "Listo",
  "status_error": "Ha fallado",
  "manualTitle": "Modo manual: pega un enlace directo al archivo",
  "manualHint": "Se salta el resolutor",
  "manualText": "Si ya tienes la dirección directa del CDN, suéltala aquí y SocialBolt pasa directamente a descargarla: ni lee la publicación ni pide metadatos.",
  "manualPlaceholder": "https://v19.tiktokcdn-us.com/….mp4",
  "manualAdd": "Añadir",
  "assetVideo": "Vídeo",
  "assetVideoHd": "Vídeo en HD",
  "assetVideoNoWatermark": "Vídeo sin marca de agua",
  "assetVideoWatermark": "Vídeo con marca de agua",
  "assetAudio": "Pista de audio (MP3)",
  "assetCover": "Imagen de portada",
  "assetAvatar": "Avatar del autor",
  "assetSlide": "Diapositiva",
  "assetPhoto": "Foto",
  "assetPoster": "Fotograma de portada",
  "assetThumbnail": "Miniatura, máxima resolución",
  "assetThumbnailAlt": "Miniatura, resolución estándar",
  "assetGif": "GIF animado (MP4)",
  "assetDirect": "Archivo directo",
  "views": "reproducciones",
  "likes": "me gusta",
  "comments": "comentarios",
  "shares": "compartidos",
  "error_invalid_url": "Eso no es un enlace que SocialBolt sepa leer. Usa una dirección de TikTok, X, YouTube o Instagram.",
  "error_failed": "Algo ha salido mal con ese enlace.",
  "err_network": "No se ha podido contactar con el servidor. Revisa la conexión y vuelve a intentarlo.",
  "err_rate_limited": "El resolutor de TikTok nos está limitando. Espera unos segundos y reintenta.",
  "err_not_found": "Esa publicación ya no existe, o es privada.",
  "err_bad_url": "A la dirección le falta el identificador de la publicación.",
  "err_unsupported_platform": "Esa plataforma no está admitida.",
  "err_no_media": "La publicación no lleva ningún medio descargable.",
  "err_instagram_blocked": "Instagram ha rechazado la petición. Bloquea las direcciones de servidor en casi todas las publicaciones, así que solo pasan unas pocas públicas.",
  "err_resolver_unavailable": "El resolutor no responde ahora mismo. Prueba dentro de un minuto.",
  "err_resolve_failed": "No se ha podido leer esa publicación.",
  "err_download_failed": "No se ha podido descargar el archivo. Puede que su enlace haya caducado: vuelve a analizar la publicación.",
  "err_cancelled": "Cancelado.",
  "err_missing_url": "No se ha enviado ningún enlace.",
  "warn_youtube_video": "De YouTube solo hay aquí los metadatos y las miniaturas: descargar la pista de vídeo exige descifrar una firma que ningún navegador puede resolver gratis.",
  "warn_no_media": "No se ha encontrado ningún medio en esta publicación.",
  "supportTitle": "Qué funciona de verdad, sin adornos",
  "supportTiktok": "Completo: vídeo en HD, vídeo sin marca de agua, el original con marca, audio en MP3, portada, avatar del autor y todas las fotos de un carrusel.",
  "supportTwitter": "Completo: todos los bitrates del vídeo, GIF animados, fotos a resolución original y el fotograma de portada.",
  "supportYoutube": "Parcial: título, canal y miniaturas en todas las resoluciones. La pista de vídeo no está disponible; la tarjeta explica el motivo.",
  "supportInstagram": "Mejor esfuerzo: Instagram bloquea las peticiones que llegan desde servidores, así que solo se resuelven algunas publicaciones públicas.",
  "howTitle": "Cómo funciona",
  "howSteps": [
    {
      "title": "Pega los enlaces",
      "text": "Uno o varios, uno por línea. SocialBolt marca la plataforma de cada uno y se para ahí: no pide nada hasta que tú lo digas."
    },
    {
      "title": "Elige qué te llevas",
      "text": "Se listan todas las versiones de la publicación con su tamaño. Marca las que quieras: el resto no se descarga nunca."
    },
    {
      "title": "Descarga o sigue trabajando",
      "text": "Un archivo se baja solo; varios llegan en un ZIP. O manda el resultado a otra herramienta de oLoveTools sin guardarlo antes."
    }
  ],
  "features": [
    {
      "title": "Sin marca de agua y sin recomprimir",
      "text": "Los vídeos de TikTok salen de la pista original, así que nada se comprime dos veces. El original con marca sigue disponible por si lo necesitas."
    },
    {
      "title": "La calidad la eliges tú",
      "text": "HD o estándar en TikTok, y todos los bitrates que X publica de sus vídeos, con la resolución escrita en cada fila."
    },
    {
      "title": "Varios enlaces a la vez",
      "text": "Pega una lista entera. Cada enlace se resuelve por turnos, al ritmo que admite el resolutor, y el que falle se reintenta por separado."
    },
    {
      "title": "Audio, portadas y avatares",
      "text": "El MP3 del sonido, la portada a resolución completa y el avatar del autor son archivos aparte, no algo que tengas que recortar tú."
    },
    {
      "title": "Tu enlace se queda aquí",
      "text": "La dirección viaja a nuestra propia función y a ningún sitio más: sin proxies CORS de terceros, sin rastreo y sin guardar nada tras responder."
    },
    {
      "title": "Encadenado con las demás herramientas",
      "text": "Manda el vídeo a FrameSnap o a GIFBolt, o la imagen a CropSnap o MemeBolt, sin descargarla y volver a subirla."
    }
  ],
  "nextStepTitle": "Sigue trabajando",
  "nextStepHint": "El archivo viaja contigo, sin volver a subirlo",
  "nextFrames": "Sacar fotogramas",
  "nextGif": "Convertir en GIF",
  "nextCrop": "Recortarla",
  "nextCompress": "Comprimirla",
  "nextCutout": "Quitar el fondo",
  "nextWatermark": "Ponerle marca de agua",
  "nextMeme": "Hacer un meme",
  "scrollTopLabel": "Volver arriba",
  "seo_title": "SocialBolt | Descargar vídeos de TikTok sin marca de agua y vídeos de X",
  "seo_description": "Pega un enlace de TikTok o de X y descarga el vídeo sin marca de agua, en HD, su audio en MP3, la portada o todas las fotos del carrusel. Sin cuenta y sin instalar nada.",
  "seoHeroTitle": "Un descargador que te dice lo que puede y lo que no",
  "seoHeroText": "Casi todos los descargadores prometen todas las plataformas y luego te dan un archivo roto o una cadena de redirecciones. SocialBolt resuelve el enlace en su propia función de servidor, lista todos los archivos que la publicación contiene de verdad y dice sin rodeos dónde se acaba la web gratuita.",
  "seoHeroList": [
    "TikTok sin marca de agua y en HD",
    "Todos los bitrates de un vídeo de X",
    "Audio, portadas y avatares aparte",
    "Cola por lotes con salida en ZIP"
  ],
  "seoBrowserSpeedTitle": "Sin proxies de terceros",
  "seoBrowserSpeedText": "La versión anterior mandaba tu enlace a proxies CORS públicos de desconocidos. Ahora la petición va a la función propia de oLoveTools, y el archivo lo descarga tu navegador directamente del CDN de la plataforma siempre que el CDN lo permite.",
  "seoSecondaryTitle": "Pensado para quien luego trabaja con los clips",
  "seoUseCaseTitle": "Para creadores y editores",
  "seoUseCaseText": "Haz copia de tus propias publicaciones antes de cambiar de cuenta, reúne clips de referencia para un montaje, saca el sonido de una tendencia o coge una portada a resolución completa para una miniatura.",
  "seoPrivacyTitle": "Qué se guarda: nada",
  "seoPrivacyText": "El enlace se usa para responder a tu petición y no se escribe en ninguna base de datos. El archivo descargado se monta en la memoria de tu navegador y lo guardas tú: nunca se queda en un servidor.",
  "seoKeywordsTitle": "Búsquedas relacionadas",
  "seoKeywords": [
    "descargar tiktok",
    "descargar tiktok sin marca de agua",
    "tiktok a mp3",
    "descargar vídeo de X",
    "descargar vídeos de twitter",
    "descargar carrusel de tiktok",
    "descargar miniatura de youtube",
    "descargador de redes sociales"
  ],
  "faqTitle": "Preguntas frecuentes",
  "faq": [
    {
      "question": "¿De verdad quita la marca de agua de TikTok?",
      "answer": "Sí. El propio TikTok sirve una copia limpia de la pista y es la que recibes; la versión con marca se ofrece en una fila aparte por si la necesitas."
    },
    {
      "question": "¿Por qué no puedo descargar vídeos de YouTube?",
      "answer": "Porque no se puede hacer gratis desde un navegador ni desde un servidor pequeño: las pistas de YouTube van protegidas con una firma que cambia constantemente y hace falta su propio reproductor para descifrarla. En vez de fingir, SocialBolt te da los metadatos y las miniaturas."
    },
    {
      "question": "¿Y de Instagram?",
      "answer": "Instagram cerró sus puntos de acceso públicos y rechaza las peticiones que llegan desde direcciones de servidor, así que solo se resuelve parte de las publicaciones públicas. Cuando falla, la herramienta lo dice en vez de girar sin fin."
    },
    {
      "question": "¿Puedo descargar varios enlaces de golpe?",
      "answer": "Sí. Pega uno por línea y se ponen en cola. Si eliges más de un archivo, bajan juntos en un ZIP."
    },
    {
      "question": "¿Es legal descargar estos vídeos?",
      "answer": "Descargar para uso personal —una copia de tus propias publicaciones, una referencia para un montaje— se acepta en general. Republicar el contenido de otra persona o usarlo comercialmente sin permiso, no. Esa parte es cosa tuya."
    }
  ],
  "footerTagline": "Herramientas limpias, honestas y rápidas para creadores sociales.",
  "footerCredit": "Parte de la suite oLoveTools"
};
