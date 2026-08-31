export default {
  "title": "Base64Bolt",
  "seo_title": "Base64Bolt | Codificador y decodificador Base64 con inspector de bytes",
  "seo_description": "Codifica texto o cualquier archivo a Base64, decodifica un payload y recupera el archivo real, lee los bytes en hexadecimal, usa el alfabeto seguro para URL, quita el padding y parte las líneas a 76 columnas. Gratis y todo en tu navegador.",
  "seoHeroTitle": "Base64 Encoder, Decoder & Inspector",
  "badge": "Kit Base64",
  "description": "Codifica cualquier archivo —no solo imágenes— con el alfabeto, el padding y el ancho de línea que espera de verdad quien lo va a leer. Decodifica un payload y descubre qué es en realidad: el formato leído de sus bytes mágicos, los primeros bytes en hexadecimal, su tamaño comprimido con gzip y su SHA-256.",
  "heroPoints": [
    "Cualquier tipo de archivo",
    "Alfabeto seguro para URL",
    "Inspector hexadecimal"
  ],

  "tab_text": "Texto",
  "tab_file": "Archivo a Base64",
  "tab_decode": "Base64 a archivo",

  "optionsTitle": "Salida",
  "alphabetStandard": "A-Z a-z 0-9 + /",
  "alphabetUrl": "Seguro para URL - _",
  "alphabetStandardHint": "El alfabeto estándar del RFC 4648: + y / para los dos últimos valores.",
  "alphabetUrlHint": "El alfabeto seguro para URL: - y _ en lugar de + y /, para que el payload sobreviva intacto a una query string, a un nombre de archivo o a un JWT.",
  "padding": "Padding =",
  "paddingHint": "La cola de = rellena la salida hasta un múltiplo de cuatro caracteres. Quitarlo es legal y es lo que hacen los JWT, pero algunos parsers estrictos siguen exigiéndolo.",
  "wrap": "Cortar",
  "wrapNone": "no",
  "crlfHint": "Corta las líneas con CRLF en vez de LF, que es lo que especifican realmente MIME y PEM.",
  "charset": "Juego de caracteres",
  "engineNative": "Motor nativo",
  "engineFallback": "Motor de compatibilidad",
  "engineNativeHint": "Tu navegador convierte los bytes él mismo, en una sola llamada a nivel de motor.",
  "engineFallbackHint": "Tu navegador no tiene conversión Base64 nativa, así que el payload se procesa en bloques de 32 KB. El resultado es el mismo, algo más lento.",

  "mode_encode": "Codificar",
  "mode_decode": "Decodificar",
  "altHint": "Mantén Alt para ver la operación inversa",
  "holdCompare": "Mantén pulsado para ver tu entrada",
  "undo": "Deshacer",
  "redo": "Rehacer",
  "loadSample": "Cargar un ejemplo",
  "button_clear": "Borrar todo",
  "cancel": "Parar",
  "runBtn": "Ejecutar",
  "encodeBtn": "Codificar a Base64",
  "decodeBtn": "Decodificar",
  "downloadTxt": "Descargar como .txt",
  "openTextFile": "Abrir un .txt / .b64",
  "copied": "¡Copiado!",
  "copyFailed": "Tu navegador ha bloqueado el acceso al portapapeles",
  "tooltip_copy": "Copiar al portapapeles",
  "chars": "car.",

  "label_input": "Texto plano",
  "label_base64_input": "Cadena Base64",
  "label_base64_output": "Base64",
  "label_decoded_output": "Texto decodificado",
  "label_showing_input": "Tu entrada",
  "label_stage_file": "Elige un archivo",
  "label_snippet": "Listo para pegar",
  "label_decoded": "Lo que ha salido",
  "placeholder_encode": "Escribe o pega el texto que quieras codificar…",
  "placeholder_decode": "Pega una cadena Base64 o una URL data:…",
  "placeholder_decode_file": "Pega un payload Base64 o una URL data: completa…",
  "placeholder_output": "El resultado aparece aquí…",
  "placeholder_file_output": "Prepara un archivo y pulsa Codificar para obtener el snippet.",
  "placeholder_decoded": "Pega un payload para ver qué es en realidad.",
  "previewTruncated": "Se muestran los primeros {0} caracteres. Copiar y descargar usan el resultado completo.",
  "bigInputHint": "Esta entrada es grande, así que no se recodifica en cada tecla. Pulsa Ejecutar cuando quieras.",

  "file_drag": "Suelta aquí cualquier archivo, o haz clic para elegirlo",
  "file_formats": "Cualquier tipo de archivo: imágenes, tipografías, PDF, WASM. Hasta {0}.",
  "willProduce": "producirá ~{0} caracteres",
  "nothingAutomatic": "Todavía no se ha leído nada. Elige tus opciones y pulsa Codificar.",
  "optionsChanged": "Las opciones han cambiado desde esta ejecución. Vuelve a pulsar Codificar.",

  "statBytes": "Payload",
  "statChars": "Base64",
  "statOverhead": "Tamaño vs origen",
  "statGzip": "Con gzip",
  "statFormat": "Detectado",
  "statAlphabet": "Alfabeto",
  "statRoundTrip": "Ida y vuelta",
  "statTime": "Tardó",
  "roundTripOk": "Reversible",
  "roundTripFail": "No reversible",

  "sha256Title": "SHA-256 de los bytes originales",
  "sha256TitleDecoded": "SHA-256 de los bytes decodificados",
  "sha256Hint": "Compáralo después de decodificar en otro sitio para demostrar que no se perdió nada en el camino.",
  "hexTitle": "Primeros bytes",
  "hexEmpty": "Todavía no hay bytes.",
  "hexTruncated": "Se muestran los primeros {0} de {1}.",
  "mimeOverrideTitle": "Tratarlo como",
  "mimeMismatch": "La URL data: dice {0}, pero los bytes dicen {1}.",
  "noPreview": "Este formato no tiene vista previa en el navegador. Descárgalo o mándalo a otra herramienta.",

  "issuesTitle": "Lo que hemos detectado",
  "issue_invalid-char": "El carácter {0} en la posición {1} no forma parte del alfabeto Base64; se ha omitido.",
  "issue_whitespace-stripped": "Se han quitado {0} saltos de línea o espacios antes de decodificar.",
  "issue_padding-added": "Al payload le faltaba un grupo completo, así que se ha supuesto {0} carácter(es) de padding.",
  "issue_non-canonical": "El último carácter ({0}) lleva bits que se descartan. Ningún codificador genera eso, así que la cadena probablemente está truncada o editada a mano.",
  "issue_mixed-alphabet": "La entrada mezcla los dos alfabetos (+ / y - _). Se ha decodificado como Base64 estándar.",
  "issue_data-url": "Se ha quitado un prefijo de URL data: que declaraba {0} antes de decodificar.",
  "issue_lost_surrogate": "{0} surrogate(s) sin pareja no se podían representar en UTF-8 y se han sustituido.",

  "error_bad-length": "A este payload le sobra un carácter respecto a un grupo completo de cuatro. Seis bits sueltos no son un byte, así que la cola no se puede recuperar: la cadena está truncada.",
  "error_undecodable": "Estos caracteres no forman un Base64 válido.",
  "error_not-base64-data-url": "Esa URL data: está codificada con porcentajes, no en Base64, así que aquí no hay nada que decodificar.",
  "error_not-utf8": "El Base64 es válido, pero los bytes que hay detrás no son texto UTF-8: son datos binarios. Usa la pestaña Base64 a archivo para ver qué son, o cambia el juego de caracteres a Latin-1.",
  "error_too-large": "Este payload es demasiado grande para que tu navegador lo mantenga como una sola cadena.",
  "error_crashed": "El codificador ha fallado con este archivo.",
  "error_no-input": "No hay nada preparado para codificar.",
  "errorTooBig": "Ese archivo pesa {0}; el límite es {1}.",

  "nextStepTitle": "Sigue trabajando",
  "nextStepHint": "El resultado viaja contigo: sin descargar ni volver a subir",
  "nextCompress": "Comprímelo",
  "nextCrop": "Recórtalo",
  "nextFavicon": "Hazlo favicon",
  "nextHash": "Saca su hash",
  "nextJson": "Abrir el JSON",
  "nextUrl": "Codificar para URL",
  "nextDiff": "Comparar dos versiones",
  "nextCodecard": "Convertirlo en imagen",

  "howItWorksTitle": "Cómo funciona",
  "step1Title": "Trae el payload",
  "step1Text": "Escríbelo, pégalo, suelta un archivo de cualquier tipo o deja que otra herramienta de la suite te lo pase. Soltar un archivo todavía no lee nada.",
  "step2Title": "Elige cómo sale",
  "step2Text": "Alfabeto estándar o seguro para URL, padding sí o no, cortado a 64, 76 o 100 columnas con LF o CRLF. Son justo las opciones en las que los parsers reales no se ponen de acuerdo.",
  "step3Title": "Mira los bytes",
  "step3Text": "El formato se lee de los números mágicos, no se adivina por el nombre. Tienes el volcado hexadecimal, el tamaño con gzip, el SHA-256 y una comprobación de reversibilidad.",
  "step4Title": "Llévatelo",
  "step4Text": "Copia la cadena en bruto, una URL data:, una regla CSS, una etiqueta img, un cuerpo JSON o un bloque PEM, o manda el archivo decodificado directo a otra herramienta.",

  "features": [
    {
      "title": "Tres bytes, cuatro caracteres",
      "text": "Base64 siempre cuesta un 33% más que los bytes que transporta, y la herramienta muestra las dos cifras más el tamaño con gzip, porque en payloads parecidos a texto gzip recupera casi todo y en un PNG no recupera casi nada."
    },
    {
      "title": "Alfabeto seguro para URL",
      "text": "Cambia a - y _ y el payload sobrevive a una query string, a un nombre de archivo o a un JWT sin nada que escapar. También puedes quitar el padding, que es lo que esperan los formatos de token."
    },
    {
      "title": "Inspector hexadecimal",
      "text": "Ve los bytes de verdad, dieciséis por línea, con el ASCII imprimible al lado. El número mágico va resaltado, así que un archivo truncado se delata al instante."
    },
    {
      "title": "Te dice qué se ha roto",
      "text": "Qué carácter no está en el alfabeto y en qué posición, si faltaba padding, si el último carácter lleva bits que se tiran. No un «Base64 inválido» a secas."
    },
    {
      "title": "El formato se lee de los bytes",
      "text": "PNG, JPEG, GIF, WebP, AVIF, HEIC, PDF, ZIP y los formatos de Office que van dentro, WOFF2, MP4, WASM, SQLite y más, identificados por su firma, para que la descarga lleve la extensión correcta."
    },
    {
      "title": "Los archivos grandes no atascan",
      "text": "Los archivos se consumen en bloques de 3 MB en un hilo aparte, con barra de progreso real y un botón de Parar que funciona. La pestaña sigue respondiendo mientras se convierte un payload de 200 MB."
    },
    {
      "title": "Medible, no solo producido",
      "text": "Cada ejecución trae el tamaño con gzip y el SHA-256, calculados sobre los mismos bytes. Así decides si incrustar gana a una segunda petición, y así demuestras que la ida y vuelta no perdió nada."
    },
    {
      "title": "Comprobación de reversibilidad",
      "text": "Cada codificación de texto se vuelve a decodificar al momento y se compara byte a byte, así que una combinación de alfabeto y padding que tu consumidor rechazaría se avisa antes de que la pegues."
    }
  ],

  "seoSecondaryTitle": "El payload, no solo la cadena",
  "seoHeroText": "La mayoría de las herramientas Base64 te dan una cadena y ahí se quedan. Esta conserva los bytes: identifica el formato por su firma, vuelca el primer kilobyte en hexadecimal, mide lo que cuesta de verdad el payload después de gzip, lo hashea para que puedas demostrar la ida y vuelta, y te dice exactamente qué carácter y en qué posición ha roto un payload en vez de culpar al conjunto. Al codificar acepta cualquier archivo —una tipografía, un PDF, un módulo WebAssembly— porque Base64 nunca fue solo cosa de imágenes.",
  "seoHeroList": [
    "Alfabetos estándar y seguro para URL",
    "Padding opcional, corte a 64/76/100 columnas",
    "Detección de formato por bytes mágicos",
    "Tamaño con gzip y SHA-256"
  ],
  "seoBrowserSpeedTitle": "Nada sale de tu navegador",
  "seoBrowserSpeedText": "Codificar, decodificar, detectar el formato, el volcado hexadecimal, la medición con gzip y el SHA-256 son APIs nativas del navegador ejecutándose en tu propia pestaña, en un hilo aparte para todo lo grande. No hay subida, ni petición, ni nada que registrar, y eso importa: los payloads que la gente pega en una herramienta Base64 son rutinariamente claves privadas, tokens de sesión y documentos internos.",
  "seoUseCaseTitle": "Hecha para los payloads que llegan sin etiqueta",
  "seoUseCaseText": "Un blob salido de una columna de base de datos sin ningún MIME apuntado en ninguna parte. Un segmento de JWT que no decodifica porque usa el alfabeto seguro para URL y no lleva padding. Un SVG incrustado en una hoja de estilos que se renderiza como imagen rota. Una URL data: que dice image/png cuando los bytes son claramente un JPEG. Un certificado cortado a 64 columnas que un parser estricto rechaza. Base64Bolt lee todos, dice qué son los bytes en realidad y te deja sacar el resultado como archivo con la extensión correcta.",
  "seoPrivacyTitle": "Sin cuentas, sin límites, sin subidas",
  "seoPrivacyText": "No hay registro, ni cuota diaria, ni un plan de pago que esconda la mitad útil de la herramienta. Los archivos que abres se leen en local y nunca se transmiten; la pestaña lo olvida todo al cerrarla.",
  "seoKeywordsTitle": "Búsquedas relacionadas",
  "seoKeywords": [
    "codificar base64",
    "decodificar base64",
    "archivo a base64",
    "base64 a archivo",
    "convertidor data url",
    "decodificar base64url",
    "imagen a base64",
    "base64 a imagen",
    "decodificar base64 online",
    "visor hexadecimal base64"
  ],

  "faqTitle": "Preguntas frecuentes",
  "faq": [
    {
      "question": "¿Por qué mi JWT o token falla en otros sitios y aquí funciona?",
      "answer": "Porque usa el alfabeto seguro para URL —guion y guion bajo en vez de más y barra— y normalmente le han quitado el padding. Un decodificador que solo conoce el alfabeto estándar revienta con el primer guion. Base64Bolt detecta qué alfabeto usa la entrada, restaura el padding que falta y te avisa de las dos cosas."
    },
    {
      "question": "¿Base64 hace más grande mi archivo?",
      "answer": "Siempre, exactamente un tercio: cada tres bytes se convierten en cuatro caracteres, más hasta dos de padding. Si eso te cuesta algo o no depende de la compresión, y por eso la herramienta muestra el tamaño con gzip junto al bruto. Incrustar un SVG pequeño suele ganar; incrustar un JPEG grande suele perder, porque ya está comprimido y Base64 deshace parte de eso."
    },
    {
      "question": "¿Puedo codificar algo que no sea una imagen?",
      "answer": "Sí, cualquier archivo. Tipografías para una regla @font-face, un PDF para un enlace de descarga, un módulo WebAssembly, un ZIP, un clip de audio. La antigua limitación a imágenes era arbitraria: a Base64 le da igual qué significan los bytes."
    },
    {
      "question": "¿Qué significa «el último carácter lleva bits que se descartan»?",
      "answer": "Cada carácter Base64 guarda seis bits, pero el último grupo de un payload suele necesitar menos. QQ== y QR== decodifican los dos al único byte 0x41, porque los últimos cuatro bits de la R se tiran. Ningún codificador produce la segunda forma, así que verla significa que la cadena está truncada o editada a mano: conviene saberlo antes de fiarte del resultado."
    },
    {
      "question": "¿Por qué al decodificar me dice que los bytes no son UTF-8?",
      "answer": "Porque no son texto. Base64 transporta bytes, y muchísimos payloads son imágenes, archivos comprimidos o claves. El comportamiento antiguo era decir «Base64 inválido», que era simplemente falso: el Base64 estaba perfecto. Cambia a la pestaña Base64 a archivo y la herramienta identificará el formato y te dejará descargarlo."
    },
    {
      "question": "¿Debería cortar la salida a 76 columnas?",
      "answer": "Solo si algo más adelante lo espera. Los cuerpos MIME y los bloques PEM van cortados por especificación —PEM a 64 columnas, MIME a 76— y algunos parsers de correo rechazan una única línea enorme. Para una URL data: en una hoja de estilos o un campo JSON, deja el corte desactivado."
    },
    {
      "question": "¿Se envía algo a un servidor?",
      "answer": "No. Cada paso es una API nativa del navegador ejecutándose en tu pestaña, así que la herramienta sigue funcionando sin conexión una vez cargada la página. Nada se sube, ni se guarda en remoto, ni se registra."
    }
  ],

  "footerTagline": "Codifica cualquier archivo a Base64 y decodifica cualquier payload de vuelta: alfabeto seguro para URL, padding opcional, inspector hexadecimal y detección de formato por bytes mágicos, todo en tu navegador.",
  "footerCredit": "Parte de la suite oLoveTools",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "¡Copiado!",
  "contactForIdeas": "Contacta para ideas y comentarios:"
};
