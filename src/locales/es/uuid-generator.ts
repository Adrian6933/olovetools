export default {
  "title": "Generador de UUID",
  "badge": "Identificadores únicos",
  "description": "Genera UUID v1, v3, v4, v5, v6 y v7, además de ULID, NanoID y ObjectId de MongoDB — por lotes, con el formato exacto que espera tu código y sin una sola petición de red.",
  "seo_title": "Generador de UUID | v4, v7, v5, ULID y NanoID por lotes",
  "seo_description": "Generador de UUID online y gratuito: v1, v3, v4, v5, v6, v7, nil y max, más ULID, NanoID y ObjectId. Lotes masivos, formato de salida configurable e inspector byte a byte, todo dentro de tu navegador.",
  "groupUuid": "UUID de la RFC 9562",
  "groupOther": "Otros identificadores",
  "kindHelp_v4": "122 bits de entropía de la fuente aleatoria criptográfica del navegador. La opción por defecto cuando solo necesitas algo único.",
  "kindHelp_v7": "Una marca de tiempo Unix de 48 bits en milisegundos seguida de bits aleatorios, con un contador para que los identificadores creados en el mismo milisegundo sigan ordenándose bien. La elección moderna para claves de base de datos.",
  "kindHelp_v1": "Marca de tiempo más un identificador de nodo. Esta herramienta usa un nodo aleatorio con el bit multicast activado, así que tu MAC real nunca queda expuesta.",
  "kindHelp_v6": "Los campos de v1 reordenados para que el tiempo vaya primero. Se ordena cronológicamente como bytes en bruto, cosa que v1 no hace.",
  "kindHelp_v3": "MD5 de un espacio de nombres y un nombre. El mismo par siempre da el mismo UUID: pon un nombre por línea para obtener un lote.",
  "kindHelp_v5": "SHA-1 de un espacio de nombres y un nombre. Determinista como v3, pero con el resumen más fuerte. Un nombre por línea.",
  "kindHelp_nil": "Los 128 bits a cero: el UUID canónico de \"sin valor\".",
  "kindHelp_max": "Los 128 bits a uno: el límite superior del espacio de UUID, usado como centinela.",
  "kindHelp_ulid": "26 caracteres en base32 de Crockford: 48 bits de tiempo y 80 de azar, ordenable alfabéticamente y sin distinguir mayúsculas.",
  "kindHelp_nanoid": "21 caracteres seguros en URL, unos 126 bits de entropía. Más corto que un UUID y válido en una URL sin escapar nada.",
  "kindHelp_objectid": "El identificador de 12 bytes que MongoDB pone en cada documento: 4 bytes de tiempo, 5 aleatorios y 3 de contador.",
  "label_count": "Cuántos",
  "hint_big_batch": "Por encima de 10 000 el deslizador se detiene; escribe la cifra exacta. La vista previa se queda en 300 filas: copiar y descargar siempre abarcan el lote completo.",
  "label_namespace": "Espacio de nombres",
  "label_names": "Nombres — uno por línea",
  "hint_deterministic": "El mismo espacio de nombres y el mismo nombre producen siempre el mismo identificador: para eso existen v3 y v5. Si quieres un lote, dale un lote de nombres.",
  "button_generate": "Generar",
  "button_working": "Trabajando…",
  "tooltip_undo": "Lote anterior (Ctrl+Z)",
  "tooltip_redo": "Lote siguiente (Ctrl+Mayús+Z)",
  "button_clear": "Borrarlo todo",
  "error_invalid_namespace": "Ese espacio de nombres no es un UUID válido.",
  "error_clipboard": "El navegador ha denegado el acceso al portapapeles. Usa el botón de descarga.",
  "error_generic": "Algo ha fallado al generar. Prueba con un lote más pequeño.",
  "error_unrecognised": "Eso no parece un identificador de los que esta herramienta reconoce.",
  "stat_count": "generados",
  "stat_time": "milisegundos",
  "stat_rate": "por segundo",
  "stat_duplicates": "duplicados",
  "empty_state": "Todavía no se ha generado nada. Elige un tipo, indica la cantidad y pulsa Generar.",
  "label_showing": "Mostrando {shown} de {total}",
  "label_uuids_generated": "identificadores",
  "tooltip_copy": "Copiar al portapapeles",
  "button_copy_all": "Copiar todo",
  "button_copied_all": "Copiado",
  "label_format": "Forma de la salida",
  "placeholder_prefix": "prefijo",
  "placeholder_suffix": "sufijo",
  "label_inspect": "Inspeccionar y componer",
  "button_load_list": "Cargar una lista desde un archivo",
  "button_blank": "Empezar con 16 bytes vacíos",
  "placeholder_inspect": "Pega cualquier UUID, ULID u ObjectId",
  "field_timestamp": "marca de tiempo",
  "byte_version": "byte 6 — nibble de versión",
  "byte_variant": "byte 8 — bits de variante",
  "button_now": "ahora",
  "button_reroll": "Volver a sortear los 8 bytes finales",
  "button_revert": "revertir",
  "button_copy": "Copiar",
  "button_use_crafted": "Usar como salida",
  "imported_summary": "Se han encontrado {count} identificadores en la lista que llega de {from}.",
  "imported_unique": "{n} únicos",
  "imported_inspect": "Inspeccionar el primero",
  "nextStepTitle": "Sigue trabajando",
  "nextStepHint": "La lista viaja contigo: sin descargar ni volver a subir",
  "nextDiff": "Comparar dos lotes",
  "nextHash": "Calcular su hash",
  "nextJson": "Abrir como JSON",
  "nextRegex": "Probar un patrón",
  "nextZip": "Comprimir en ZIP",
  "howItWorksTitle": "Cómo funciona",
  "step1Title": "Elige el tipo",
  "step1Text": "Once en total, desde el v4 de siempre hasta el v7 ordenado por tiempo, ULID o un ObjectId de Mongo.",
  "step2Title": "Define el lote",
  "step2Text": "Cuántos y con qué forma: mayúsculas, guiones, envoltura, prefijo y formato de exportación.",
  "step3Title": "Pulsa generar",
  "step3Text": "No se ejecuta nada hasta que lo pulsas. El lote se construye en un worker y se cronometra a la décima de milisegundo.",
  "step4Title": "Llévatelo",
  "step4Text": "Copia, descarga en txt, csv, json o SQL, o manda la lista directamente a otra herramienta.",
  "features": [
    {
      "title": "Once tipos de identificador",
      "text": "UUID v1, v3, v4, v5, v6, v7, nil y max, además de ULID, NanoID y ObjectId de MongoDB."
    },
    {
      "title": "Ordenados por tiempo y monótonos",
      "text": "v7, v6 y ULID mantienen un contador, así que los identificadores creados en el mismo milisegundo conservan su orden de creación."
    },
    {
      "title": "También los lee",
      "text": "Pega cualquier identificador para ver su versión, variante, marca de tiempo, nodo y bytes en bruto, y edita un solo nibble."
    },
    {
      "title": "Fuera del hilo principal",
      "text": "Los lotes se generan en un Web Worker, con el tiempo exacto de generación y un barrido de duplicados sobre todo el lote."
    },
    {
      "title": "La salida que necesitas",
      "text": "Mayúsculas, guiones, llaves, urn:uuid:, comillas, prefijo y sufijo, exportado en txt, csv, json o SQL."
    },
    {
      "title": "Nada sale de la pestaña",
      "text": "Entropía de Web Crypto, ni una sola llamada de red y nada guardado entre visitas."
    }
  ],
  "seoHeroTitle": "Todos los formatos de identificador, generados en local",
  "seoHeroText": "La mayoría de generadores te dan un v4 y ahí se acaban. Este cubre toda la familia de la RFC 9562, los formatos ordenables que la han sustituido en la práctica y los identificadores que usan otros ecosistemas, con la salida moldeada tal y como la necesita tu migración, tu fichero de semillas o tu fixture de pruebas.",
  "seoHeroList": [
    "11 tipos de identificador",
    "Lotes de hasta 100 000",
    "Inspector byte a byte",
    "Cero llamadas de red"
  ],
  "seoBrowserSpeedTitle": "Ordenables por construcción",
  "seoBrowserSpeedText": "Las claves v4 aleatorias dispersan las escrituras por todo el índice B-tree. v7, v6 y ULID ponen el tiempo delante, así que las filas nuevas caen al final del índice en vez de por todas partes, y esta herramienta mantiene un contador dentro de cada milisegundo para que el orden aguante incluso en un bucle cerrado.",
  "seoSecondaryTitle": "Pensado para el trabajo que viene después del identificador",
  "seoUseCaseTitle": "Semillas, fixtures y migraciones",
  "seoUseCaseText": "Genera cien mil claves, expórtalas directamente como INSERT de SQL o como array JSON y pasa la lista a la herramienta de diferencias, de hash o de archivo sin pasar por la carpeta de descargas.",
  "seoPrivacyTitle": "Local, y comprobable",
  "seoPrivacyText": "La entropía sale de la Web Crypto API dentro de tu pestaña. No hay llamada a ninguna API, ni descarga de CDN, ni WebAssembly bajado aparte: el hash que usan v3 y v5 va incrustado en la propia página, así que la herramienta funciona con la red apagada.",
  "seoKeywordsTitle": "Palabras clave",
  "seoKeywords": [
    "generador de uuid",
    "uuid v4 aleatorio",
    "uuid v7 ordenado por tiempo",
    "uuid v5 con nombre",
    "generador de guid",
    "generador de ulid",
    "nanoid corto",
    "uuid masivo",
    "decodificador de uuid"
  ],
  "faqTitle": "Preguntas frecuentes",
  "faq": [
    {
      "question": "¿Qué versión de UUID debería usar?",
      "answer": "v4 cuando solo necesitas unicidad y nada más. v7 cuando el identificador va a ser clave primaria, porque su marca de tiempo inicial mantiene las escrituras del índice agrupadas. v5 cuando la misma entrada debe dar siempre el mismo identificador."
    },
    {
      "question": "¿Por qué al pedir diez UUID v5 me salen diez iguales?",
      "answer": "Porque eso es lo que significa v5: un espacio de nombres más un nombre siempre dan un identificador. Si quieres diez distintos, dale diez nombres distintos, uno por línea."
    },
    {
      "question": "¿En qué se diferencian v7 y ULID?",
      "answer": "Los dos son una marca de tiempo de 48 bits en milisegundos seguida de azar. v7 es un UUID de verdad y encaja en una columna UUID; ULID son 26 caracteres en base32, más cortos de leer y sin distinguir mayúsculas, pero no es un UUID."
    },
    {
      "question": "¿Son criptográficamente seguros?",
      "answer": "El azar viene de crypto.getRandomValues, la misma fuente que usa el navegador para su propio material de claves. Ten en cuenta que un v1 o un v7 expone a propósito su hora de creación, así que no es un secreto."
    },
    {
      "question": "¿Cuántos puedo generar de una vez?",
      "answer": "Hasta 100 000 por lote. La lista en pantalla enseña las primeras 300 filas para que la página siga respondiendo; copiar, descargar y los botones de traspaso trabajan siempre sobre el lote completo."
    },
    {
      "question": "¿Se envía algo a un servidor?",
      "answer": "No. La generación, la inspección y la exportación ocurren en tu navegador, y la página no hace ninguna petición mientras la usas."
    }
  ],
  "footerTagline": "UUID de v1 a v7, ULID, NanoID y ObjectId: generados, inspeccionados y exportados enteramente dentro de tu navegador.",
  "footerCredit": "Parte de la suite oLoveTools",
  "emailCopied": "¡Copiado!",
  "contactForIdeas": "Contacto para ideas y comentarios:",
  "emailAddress": "adrian.contact.me.69@gmail.com"
};
