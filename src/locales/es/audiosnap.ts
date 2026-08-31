export default {
  "title": "AudioSnap",
  "badge": "Grabadora de voz y recortador de audio",
  "description": "Graba con tu micrófono o abre un archivo de audio, córtalo sobre la onda, nivélalo y exporta WAV sin pérdida o un clip comprimido. Todo ocurre dentro de esta pestaña.",
  "btn_record": "Grabar",
  "btn_pause_record": "Pausar",
  "btn_resume_record": "Reanudar",
  "btn_stop_record": "Detener",
  "tabRecord": "Grabar",
  "tabFile": "Abrir un archivo",
  "recordTitle": "Graba con tu micrófono",
  "recordHint": "El micrófono solo se abre mientras grabas, y el audio no sale de esta pestaña.",
  "levelLabel": "Nivel de entrada",
  "clipWarn": "La entrada ha llegado al máximo: aléjate del micrófono o baja su ganancia.",
  "captureTitle": "Ajustes del micrófono",
  "captureHint": "Desactiva los tres procesadores para música o ambiente; déjalos activos para voz en un sitio ruidoso.",
  "micLabel": "Dispositivo de entrada",
  "micDefault": "Predeterminado del sistema",
  "micEcho": "Cancelación de eco",
  "micNoise": "Supresión de ruido",
  "micAgc": "Ganancia automática",
  "micChannels": "Canales",
  "micMono": "Mono",
  "micStereo": "Estéreo",
  "micBitrate": "Calidad",
  "dropTitle": "Suelta un archivo de audio",
  "dropHint": "MP3, WAV, M4A, OGG, Opus, FLAC, WebM — y la pista de audio de un vídeo.",
  "browseBtn": "Elegir un archivo",
  "pendingHint": "Todavía no se ha descodificado nada. Pulsa el botón cuando quieras.",
  "loadBtn": "Cargarlo en el editor",
  "discardBtn": "Descartar",
  "decodingLabel": "Leyendo el audio…",
  "label_trim": "Editor de onda",
  "label_recording": "Grabando",
  "label_paused": "En pausa",
  "label_start": "Entrada",
  "label_end": "Salida",
  "label_duration": "Selección",
  "outputLabel": "Resultado",
  "newSourceBtn": "Empezar de cero",
  "undoBtn": "Deshacer",
  "redoBtn": "Rehacer",
  "transportPlay": "Reproducir / pausar (Espacio)",
  "transportStop": "Detener",
  "transportLoop": "Repetir la selección",
  "compareBtn": "Mantén: original",
  "compareHint": "Mantén pulsado para oír el original intacto (o mantén Alt)",
  "zoomLabel": "Zoom",
  "zoomIn": "Acercar",
  "zoomOut": "Alejar",
  "zoomFit": "Clip completo",
  "zoomSelection": "Ajustar a la selección",
  "zoomHint": "Rueda = zoom · Mayús+rueda = desplazar · arrastrar = seleccionar",
  "setInBtn": "Marcar entrada (I)",
  "setOutBtn": "Marcar salida (O)",
  "selectAll": "Seleccionar todo (A)",
  "autoTrimBtn": "Recortar el silencio",
  "autoTrimNone": "No se ha detectado ninguna parte audible: la selección se ha dejado igual.",
  "autoTrimDone": "Recortado a {d}s de sonido audible.",
  "processTitle": "Procesado",
  "resetProcessing": "Neutro",
  "gainLabel": "Ganancia",
  "normalizeLabel": "Normalizar el pico a",
  "dcLabel": "Quitar el desplazamiento de continua",
  "fadeInLabel": "Fundido de entrada",
  "fadeOutLabel": "Fundido de salida",
  "speedLabel": "Velocidad",
  "channelsLabel": "Canales",
  "channelSource": "Mantener",
  "rateLabel": "Frecuencia de muestreo",
  "rateSource": "Mantener",
  "statsTitle": "Medido",
  "statPeak": "Pico del origen",
  "statRms": "RMS del origen",
  "statOutPeak": "Pico de salida",
  "statGain": "Ganancia aplicada",
  "statSize": "Tamaño estimado",
  "statClipWarn": "La salida saturaría. Baja la ganancia o activa el normalizador.",
  "infoResampled": "remuestreado al descodificar",
  "exportTitle": "Exportar",
  "formatLabel": "Formato",
  "fmtWav16": "WAV · 16 bits (con dither)",
  "fmtWav24": "WAV · 24 bits",
  "fmtWav32": "WAV · 32 bits en coma flotante",
  "fmtCompressed": "Comprimido · Opus",
  "bitrateLabel": "Tasa de bits",
  "realtimeWarn": "El navegador no tiene codificador de audio offline, así que este va en tiempo real: unos {s}s.",
  "exportBtn": "Renderizar y descargar",
  "exportingLabel": "Renderizando",
  "downloadOriginalBtn": "Descargar el origen intacto",
  "shortcutsTitle": "Teclado",
  "shortcutPlay": "Reproducir / pausar",
  "shortcutInOut": "Marcar entrada / salida en el cursor",
  "shortcutAll": "Seleccionar el clip entero",
  "shortcutAlt": "Mantén para oír el original intacto",
  "shortcutZoom": "Acercar, alejar, clip completo, selección",
  "shortcutUndo": "Deshacer / rehacer",
  "history_title": "Esta sesión",
  "clear_history": "Vaciar",
  "error_mic": "Acceso al micrófono denegado o no disponible.",
  "errorDecode": "Este navegador no ha podido descodificar ese audio.",
  "errorEncoder": "Este navegador no puede codificar audio comprimido. Usa WAV.",
  "errorExport": "La exportación ha fallado. Prueba con una selección más corta o con el formato WAV.",
  "errorTooShort": "La selección es demasiado corta para exportarla.",
  "nextStepTitle": "Sigue con esto",
  "nextStepHint": "El clip viaja contigo, sin volver a subirlo",
  "nextZip": "Empaquetarlo",
  "nextHash": "Sacarle el hash",
  "howItWorksTitle": "Cómo funciona",
  "howItWorks": [
    {
      "title": "Graba o abre un archivo",
      "text": "Elige tu micrófono y decide si la supresión de ruido del navegador te ayuda o te estorba, y dale a grabar. O suelta un MP3, WAV, M4A, OGG, FLAC o el audio de un vídeo: nada se descodifica hasta que tú lo pides."
    },
    {
      "title": "Corta sobre la onda",
      "text": "Arrastra los marcadores de entrada y salida, arrastra sobre la onda para seleccionar, gira la rueda para acercarte a una sola palabra. El cursor, la selección y el zoom son independientes."
    },
    {
      "title": "Nivélalo y compruébalo",
      "text": "Normaliza el pico, añade fundidos, cambia la velocidad, pásalo a mono. Cada ajuste es un número, no una copia nueva del audio, así que deshacer siempre te devuelve y el origen nunca se degrada."
    },
    {
      "title": "Exporta lo que necesites",
      "text": "WAV de 16 bits con dither para editarlo en otro sitio, 24 bits o coma flotante de 32 para conservar el margen, o un clip Opus comprimido cuando el archivo tiene que pesar poco. El tamaño estimado se ve antes de decidir."
    }
  ],
  "features": [
    {
      "title": "Recorte exacto",
      "text": "Los puntos de corte son segundos del búfer descodificado, no posiciones de un elemento multimedia, así que la exportación empieza y acaba justo donde están los marcadores, sin pasarse un cuarto de segundo."
    },
    {
      "title": "Control real del micrófono",
      "text": "Elige el dispositivo de entrada, apaga una a una la cancelación de eco, la supresión de ruido y la ganancia automática, escoge mono o estéreo y fija la tasa de bits antes de empezar."
    },
    {
      "title": "Edición no destructiva",
      "text": "Ganancia, normalización, fundidos, velocidad y cambios de canal se guardan como una pequeña descripción de la edición y se aplican una sola vez al exportar. Deshacer y rehacer no cuestan memoria."
    },
    {
      "title": "Medido, no adivinado",
      "text": "Pico y RMS de la selección en dBFS, la ganancia que aplicará de verdad el renderizado, el pico resultante y un aviso antes de que la salida sature."
    },
    {
      "title": "Exportaciones que valen",
      "text": "El WAV de 16 bits se escribe con dither TPDF para que los fundidos suaves queden limpios, los de 24 y 32 bits conservan el margen, y la frecuencia de muestreo la eliges tú."
    },
    {
      "title": "No se sube nada",
      "text": "Descodificar, dibujar, renderizar y codificar ocurre todo en esta pestaña con el motor de audio del propio navegador. Sin servidor, sin cuenta y sin librerías traídas de un CDN."
    }
  ],
  "seo_title": "AudioSnap | Grabadora de voz y recortador de audio online gratis",
  "seo_description": "Graba tu voz o abre un MP3, WAV, M4A, OGG o FLAC, recórtalo sobre una onda con zoom, normalízalo y descarga WAV sin pérdida o un clip comprimido. 100% en tu navegador, gratis y sin registro.",
  "seoHeroTitle": "Graba, corta y exporta audio sin subir nada",
  "seoHeroText": "AudioSnap es una grabadora de micrófono y un recortador de onda en la misma página. Descodifica tu archivo con el motor de audio del navegador, dibuja una envolvente real de mínimos y máximos a la que puedes acercarte, y renderiza el corte final en local, así que el audio no viaja a ninguna parte.",
  "seoHeroList": [
    "Graba desde cualquier micrófono, con los procesadores a la vista",
    "Abre MP3, WAV, M4A, OGG, Opus, FLAC y bandas sonoras de vídeo",
    "Onda con zoom y marcadores de entrada y salida arrastrables",
    "Normalización, fundidos, velocidad y mezcla a mono, todo reversible",
    "WAV sin pérdida a 16, 24 o 32 bits en coma flotante, o clip comprimido",
    "No se sube nada ni se descarga nada de un CDN"
  ],
  "seoBrowserSpeedTitle": "Un búfer descodificado, renderizado a demanda",
  "seoBrowserSpeedText": "Tu archivo se descodifica una vez a muestras crudas y ahí se queda. El recorte, la ganancia, los fundidos, la velocidad y los cambios de canal se guardan como números y se aplican en un único renderizado local al exportar, y por eso deshacer es instantáneo y editar muchas veces no acumula pérdida de calidad.",
  "seoSecondaryTitle": "Una grabadora para las tomas y un editor para lo que viene después",
  "seoUseCaseTitle": "Notas de voz, pódcast, locuciones y samples",
  "seoUseCaseText": "Graba una nota de voz y quita el silencio de los dos extremos. Saca veinte segundos limpios de una entrevista de una hora. Nivela una locución antes de que entre en el montaje de vídeo. Pasa una grabación estéreo a mono para una centralita, o baja una toma de 48 kHz a 16 kHz para un modelo de voz. La onda se acerca hasta el nivel de palabra, así que el corte cae donde tú querías.",
  "seoPrivacyTitle": "Privado porque no hay adónde enviarlo",
  "seoPrivacyText": "El acceso al micrófono se pide cuando pulsas grabar y se suelta cuando pulsas detener. La grabación, las muestras descodificadas y todas las exportaciones viven en la memoria de esta pestaña hasta que la cierras. No hay endpoint de subida, ni analítica sobre tu audio, ni modelos o códecs traídos de un CDN ajeno.",
  "faqTitle": "Preguntas frecuentes",
  "faq": [
    {
      "question": "¿Puedo recortar un archivo de audio que ya tengo o solo grabaciones?",
      "answer": "Las dos cosas. La pestaña «Abrir un archivo» acepta MP3, WAV, M4A/AAC, OGG, Opus, FLAC y WebM, además de la pista de audio de un vídeo. Soltar un archivo no lo descodifica: espera a que pulses el botón de cargar, así que una grabación larga nunca bloquea la página a tus espaldas."
    },
    {
      "question": "¿Hay un límite de duración de grabación?",
      "answer": "La herramienta no impone ninguno, solo la memoria de tu dispositivo: el audio se guarda como muestras crudas, unos 10 MB por minuto en estéreo a 48 kHz. En un ordenador las sesiones largas van bien; en un móvil antiguo, mejor de pocos minutos cada vez."
    },
    {
      "question": "¿Se sube algo de esto?",
      "answer": "No. Grabar, descodificar, dibujar, renderizar y codificar usan APIs que ya trae tu navegador. No se envía nada a ningún servidor y no se descarga ninguna librería, modelo o códec de un CDN mientras trabajas."
    },
    {
      "question": "¿Qué formato de exportación elijo?",
      "answer": "El WAV de 16 bits es la opción segura y la que esperan los demás editores. Los de 24 bits y coma flotante de 32 conservan margen extra si vas a volver a procesar el archivo. La opción Opus comprimida da un archivo mucho más pequeño, pero los navegadores no tienen codificador de audio offline, así que recodifica en tiempo real: un clip de dos minutos tarda unos dos minutos."
    },
    {
      "question": "¿Qué hace el botón «mantén: original»?",
      "answer": "Reproduce el origen intacto mientras lo mantienes pulsado (sin recorte, sin ganancia y sin fundidos) y vuelve a tu versión editada al soltarlo. Mantener Alt hace lo mismo. Es la única forma fiable de saber si la normalización ha mejorado algo de verdad."
    },
    {
      "question": "¿Qué diferencia hay entre ganancia y normalizar?",
      "answer": "La ganancia es una cantidad fija que eliges tú, en decibelios. Normalizar mide el pico más alto de tu selección y calcula la ganancia necesaria para llevarlo al techo que fijes, de modo que dos clips grabados a distinta distancia acaben al mismo nivel. Si activas las dos, la ganancia manual se aplica encima del nivel ya normalizado."
    },
    {
      "question": "¿Por qué pide el navegador permiso de micrófono?",
      "answer": "Capturar audio siempre necesita tu consentimiento explícito, y de ese aviso se encarga el propio navegador. AudioSnap solo lo pide cuando pulsas grabar, y el indicador del micrófono se apaga en cuanto paras."
    }
  ],
  "seoKeywordsTitle": "Búsquedas relacionadas",
  "seoKeywords": [
    "grabadora de voz online",
    "recortar audio online",
    "cortar mp3 online",
    "editor de audio en el navegador",
    "grabar voz online gratis",
    "recortar audio sin subirlo",
    "conversor a wav online",
    "normalizar audio online",
    "mp3 a wav en el navegador",
    "cortador de audio gratis sin marca de agua"
  ],
  "footerTagline": "Grabación y edición de audio en local, gratis y privada.",
  "footerCredit": "Parte de la suite oLoveTools",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "¡Copiado!"
};
