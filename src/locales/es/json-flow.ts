export default {
  "title": "JSONFlow",
  "description": "Valida, explora y convierte JSON en el navegador: posición exacta del error, un árbol plegable que aguanta archivos enormes, consultas JSONPath y exportación a CSV, XML, YAML, JSON Schema o TypeScript.",

  // Acciones
  "beautify": "Formatear",
  "minify": "Minificar",
  "sort_keys": "Ordenar claves",
  "sort_none": "Orden original",
  "sort_asc": "Claves A → Z",
  "sort_desc": "Claves Z → A",
  "clear": "Limpiar",
  "load_mock": "Cargar un ejemplo",
  "copy": "Copiar",
  "copied": "¡Copiado!",
  "undo": "Deshacer",
  "redo": "Rehacer",
  "close": "Cerrar",
  "shortcuts": "Atajos de teclado",
  "open_file": "Abrir un archivo",
  "copy_source": "Copiar el origen",
  "download_json": "Descargar .json",
  "reset_view": "Reiniciar la vista",
  "parse_btn": "Analizar",
  "repair_btn": "Reparar",
  "unescape_btn": "Desescapar",
  "jsonl_btn": "Unir JSON Lines",

  // Sangría
  "indentation": "Sangría",
  "indent_2_spaces": "2 espacios",
  "indent_4_spaces": "4 espacios",
  "indent_tabs": "Tabulaciones",

  // Validación
  "status_valid": "JSON válido",
  "status_invalid": "JSON no válido: ",
  "status_empty": "Todavía no hay nada cargado.",
  "status_checking": "Validando fuera del hilo principal…",
  "error_at": "línea {0}, columna {1}",
  "jump_to_error": "Ir ahí",
  "warnings_title": "{0} cosas que conviene saber",
  "empty_placeholder": "Pega aquí tu JSON, suelta un archivo o carga un ejemplo…",
  "drop_file_prompt": "Suelta un archivo .json, .jsonl, .csv o .tsv",
  "editor_title": "Origen",
  "fix_first": "Corrige el error de la izquierda y los paneles se rellenarán.",
  "press_parse": "Pulsa Analizar para construir el árbol de este documento.",

  // Hallazgos del analizador
  "issueSyntax": "Error de sintaxis",
  "issueDuplicateKey": "Clave duplicada",
  "issuePrecision": "Número demasiado grande para JavaScript",
  "issueDepth": "Anidamiento excesivo",
  "issueTrailingComma": "Coma sobrante",
  "issueComment": "Comentario",
  "issueSingleQuote": "Cadena con comillas simples",
  "issueUnquotedKey": "Clave sin comillas",
  "issuePythonLiteral": "Literal de Python",
  "issueNonFinite": "No es un número JSON",
  "issueBom": "Marca de orden de bytes",
  "issueEmpty": "Documento vacío",

  // Pestañas y vistas
  "tab_tree_viewer": "Árbol",
  "tab_formatted_json": "Código",
  "tab_table": "Tabla",
  "tab_convert": "Convertir",
  "tab_schema": "Tipos",
  "tab_diff": "Comparar",

  // Controles del árbol
  "search_placeholder": "Filtrar por clave o valor…",
  "scope_both": "Todo",
  "scope_keys": "Claves",
  "scope_values": "Valores",
  "expand_all": "Desplegar todo",
  "collapse_all": "Plegar todo",
  "depth_label": "Abrir hasta el nivel",
  "depth_option": "Nivel {0}",
  "depth_all": "Todos los niveles",
  "no_nodes": "Pega o suelta JSON a la izquierda para empezar.",
  "no_matches": "Nada coincide con esa búsqueda.",
  "tree_rows": "{0} filas",
  "tree_hits": "{0} coincidencias",
  "tree_mounted": "{0} en el DOM",
  "tree_capped": "techo alcanzado: pliega un nivel para ver el resto",
  "copy_path": "Copiar la ruta",
  "copy_value": "Copiar el valor",
  "locate": "Verlo en el editor",
  "stale_notice": "El editor ha cambiado desde que se construyó esto. Pulsa Analizar para actualizarlo.",

  // Salida
  "output_size": "{0} caracteres",
  "preview_clipped": "La vista previa se corta en {0} caracteres. Copiar y descargar siguen dándote el contenido completo.",
  "copy_failed": "El navegador ha denegado el acceso al portapapeles.",

  // Tabla / CSV
  "flatten_title": "Aplanado",
  "array_json": "Array como JSON",
  "array_expand": "Una columna por elemento",
  "array_join": "Unido",
  "separator_label": "Separador de rutas",
  "table_summary": "{0} filas × {1} columnas. La vista previa muestra las {2} primeras.",
  "table_wrapped": "El documento no es un array, así que ha quedado en una sola fila.",
  "export_csv": "Descargar",
  "export_xml": "Descargar XML",
  "import_csv": "CSV o TSV a JSON",
  "csv_placeholder": "Pega aquí CSV o TSV para convertirlo en JSON…",
  "convert_csv_btn": "Convertir a JSON",
  "csv_nest": "Reconstruir el anidamiento con cabeceras a.b",
  "csv_nest_hint": "Desactivado a propósito: una columna first_name debe seguir siendo first_name, no convertirse en { first: { name } }.",

  // Convertir / tipos
  "xml_root": "Elemento raíz",
  "type_name": "Nombre",
  "schema_hint": "Se deduce de todos los registros, no solo del primero: un campo que falta en algunos sale como opcional.",

  // Consultas
  "query_placeholder": "$.usuarios[?(@.edad > 30)].nombre",
  "query_matches": "{0} coincidencias",
  "query_use": "Usar como documento",

  // Comparación
  "diff_hint": "Se compara por ruta, no por línea: reordenar claves no cuenta como cambio.",
  "diff_placeholder": "Pega aquí el otro documento JSON…",
  "diff_run": "Comparar",
  "diff_identical": "Los dos documentos son idénticos en estructura.",
  "diff_added": "Añadido",
  "diff_removed": "Eliminado",
  "diff_changed": "Cambiado",
  "diff_type": "Tipo",

  // Barra de ejecución / archivos
  "manual_mode": "Modo manual",
  "manual_on": "No se construye nada hasta que pulses Analizar.",
  "manual_off": "Los documentos de menos de {0} se construyen mientras escribes; los mayores esperan a Analizar.",
  "parked_hint": "Se ha retenido a propósito: cargar un archivo de este tamaño en el editor es justo la parte cara.",
  "parked_load": "Cargarlo",
  "file_too_large": "Ese archivo es demasiado grande para abrirlo en una pestaña del navegador.",
  "file_failed": "No se ha podido leer ese archivo.",

  // Estadísticas
  "stat_bytes": "Tamaño",
  "stat_lines": "Líneas",
  "stat_nodes": "Nodos",
  "stat_depth": "Profundidad",
  "stat_keys": "Claves únicas",
  "stat_time": "Análisis",
  "stat_offthread": "Worker",

  // Avisos
  "toast_csv_loaded": "Importadas {0} filas de {1}.",
  "toast_jsonl_loaded": "JSON Lines unido en un único array.",
  "toast_needs_valid": "Corrige antes el error: todavía no hay nada que construir.",
  "toast_repaired": "Reparado como JSON estricto.",
  "toast_unrepairable": "Este documento está demasiado roto para repararlo automáticamente.",
  "toast_unescaped": "Desenvuelto el JSON que se escondía dentro de la cadena.",
  "toast_unescape_failed": "Eso no es una cadena JSON entrecomillada.",

  // Atajos
  "sc_undo": "Deshacer",
  "sc_redo": "Rehacer",
  "sc_parse": "Analizar el documento",
  "sc_beautify": "Formatear",
  "sc_minify": "Minificar",
  "sc_copy": "Copiar la salida formateada",
  "sc_help": "Este panel",

  // Encadenado
  "nextStepTitle": "Sigue trabajando",
  "nextStepHint": "El documento viaja contigo: sin descargar ni volver a subir",
  "nextDiff": "Compararlo",
  "nextCodecard": "Hacer una imagen de código",
  "nextXml": "XML ⇄ JSON",
  "nextHash": "Calcular su hash",
  "nextMarkdown": "Documentarlo",

  // Ejemplos
  "mock_user_profile": "Perfil de usuario",
  "mock_product_catalog": "Catálogo de productos",
  "mock_weather_data": "Previsión meteorológica",
  "sample_broken": "Configuración rota (reparable)",
  "sample_bigint": "Identificadores de 64 bits",

  // Cómo funciona
  "hero_badge": "Banco de trabajo",
  "howItWorksTitle": "Cómo funciona",
  "step1Title": "Trae el JSON",
  "step1Text": "Pégalo, suelta un archivo o deja que otra herramienta te lo pase. No se sube nada y nada pesado se ejecuta hasta que lo pidas.",
  "step2Title": "Lee el veredicto",
  "step2Text": "Válido, o la línea y la columna exactas que fallan, más las claves duplicadas y los números que JavaScript no puede representar.",
  "step3Title": "Explóralo",
  "step3Text": "Pliega el árbol, filtra por clave o por valor, o lanza una expresión JSONPath sobre todo el documento.",
  "step4Title": "Llévatelo",
  "step4Text": "CSV, XML, YAML, JSON Lines, un JSON Schema, tipos de TypeScript o Go, o mándalo directamente a otra herramienta.",

  "features": [
    {
      "title": "Un analizador de verdad, no JSON.parse",
      "text": "Los errores llegan con línea, columna y la fila resaltada en el margen, en vez de un desplazamiento de caracteres que tienes que contar a mano."
    },
    {
      "title": "Los identificadores de 64 bits sobreviven",
      "text": "Los identificadores numéricos largos se vuelven a escribir dígito a dígito. Cualquier formateador basado en JSON.parse los redondea en silencio al doble más cercano."
    },
    {
      "title": "Reparación en un clic",
      "text": "Comentarios, comas sobrantes, comillas simples, claves sin comillas, True/False/None de Python y una marca BOM perdida se convierten en JSON estricto."
    },
    {
      "title": "Consultas JSONPath",
      "text": "Comodines, descenso recursivo, cortes y filtros como [?(@.precio > 10)], evaluados a mano: nada de lo que escribas se ejecuta nunca."
    },
    {
      "title": "Tipos a partir de datos reales",
      "text": "JSON Schema, interfaces de TypeScript o structs de Go, deducidos de todos los registros, así los campos que a veces faltan salen como opcionales."
    },
    {
      "title": "Aplanado honesto",
      "text": "Eliges el separador de rutas y qué pasa con los arrays anidados. Los objetos vacíos conservan su columna en vez de desaparecer de la exportación."
    },
    {
      "title": "Comparación estructural",
      "text": "Dos documentos comparados ruta por ruta, así que un orden de claves distinto no se traduce en mil cambios."
    },
    {
      "title": "Los archivos grandes siguen siendo usables",
      "text": "La validación se va a un web worker, el árbol solo monta las filas visibles y el historial guarda los caracteres que cambian, no una copia del documento."
    }
  ],

  // SEO y textos
  "seo_title": "JSONFlow | Formateador, validador, visor y conversor de JSON",
  "seo_description": "Formatea, valida y explora JSON con la posición exacta del error y un árbol que aguanta archivos grandes. Convierte a CSV, XML, YAML o JSON Lines, genera JSON Schema y tipos de TypeScript, y lanza consultas JSONPath, todo en tu navegador.",
  "seoHeroTitle": "Formatea, explora y convierte JSON con seguridad.",
  "seoHeroText": "Las respuestas de una API llevan tokens, datos de clientes e identificadores internos. JSONFlow no envía nada a ninguna parte: el analizador, el árbol, las consultas y las exportaciones se ejecutan dentro de esta pestaña, así que pegar aquí una respuesta de producción es tan privado como abrirla en tu editor.",
  "seoHeroList": [
    "100 % local: no se sube nada",
    "Línea y columna exactas de cada error",
    "CSV, XML, YAML, Schema y TypeScript"
  ],
  "seoBrowserSpeedTitle": "Todo se ejecuta en esta pestaña",
  "seoBrowserSpeedText": "El analizador, el árbol plegable, el motor de JSONPath y todas las exportaciones son JavaScript corriente ejecutándose en tu dispositivo. No hay paso de subida, no hay servidor y no hay ninguna petición que lleve tus datos: corta la conexión después de cargar la página y la herramienta sigue funcionando.",
  "seoSecondaryTitle": "El banco de trabajo completo de JSON para desarrolladores.",
  "seoKeywordsTitle": "Palabras clave",
  "seoKeywords": [
    "formateador JSON",
    "validador JSON",
    "visor JSON",
    "JSON a CSV",
    "JSON a XML",
    "JSON a YAML",
    "CSV a JSON",
    "embellecedor JSON",
    "JSONPath",
    "generador de JSON Schema",
    "JSON a TypeScript",
    "comparar JSON",
    "reparar JSON",
    "JSON Lines"
  ],
  "seoUseCaseTitle": "Para qué se usa",
  "seoUseCaseText": "Encontrar la coma que rompe un archivo de configuración, convertir una respuesta de API en una hoja de cálculo, generar la interfaz de TypeScript de un endpoint que nadie documentó, comprobar si dos versiones de un mismo payload difieren de verdad y abrir registros donde el JSON llegó envuelto en una cadena entrecomillada.",
  "seoPrivacyTitle": "Por qué aquí importa que sea local",
  "seoPrivacyText": "Un payload JSON casi nunca es anónimo: lleva tokens de acceso, direcciones de correo, identificadores de pedidos y rutas internas. Pegarlo en un formateador alojado se lo entrega entero al servidor de otra persona. Aquí no sale de la pestaña, así que no hay nada que registrar, cachear ni filtrar.",

  "faqTitle": "Preguntas frecuentes",
  "faq": [
    {
      "question": "¿Se envía mi JSON a algún servidor?",
      "answer": "No. El análisis, la validación, el árbol, las consultas y todas las exportaciones se ejecutan dentro de esta pestaña del navegador. Puedes desconectarte de la red una vez cargada la página y todo sigue funcionando."
    },
    {
      "question": "¿Hasta qué tamaño de archivo aguanta de verdad?",
      "answer": "En un portátil normal, un documento de 1,5 MB con 180 000 nodos se analiza en bastante menos de una décima de segundo, y archivos de varias decenas de megabytes se siguen abriendo: la validación se va a un web worker y el árbol solo dibuja las filas visibles. Lo que te limita es la memoria, no la herramienta: a partir de unos 100 MB una pestaña de navegador sufre con cualquier programa. Todo lo que pase de 2 MB se retiene detrás de un botón en vez de cargarse solo, así que un archivo grande nunca congela la página al llegar."
    },
    {
      "question": "¿Por qué mis identificadores largos cambian en otros formateadores?",
      "answer": "JSON.parse convierte cada número en un flotante de 64 bits, que no representa con exactitud los enteros por encima de 2^53: un identificador de Twitter, Discord o Snowflake pierde sus últimos dígitos. JSONFlow conserva los dígitos originales del texto de origen y te avisa cuando un número entra en ese rango."
    },
    {
      "question": "Mi archivo tiene comentarios y comas sobrantes. ¿Es un problema?",
      "answer": "No. Cuando el análisis estricto falla, se lanza automáticamente una pasada tolerante y, si funciona, aparece un botón Reparar. Admite comentarios, comas sobrantes, comillas simples, claves sin comillas, True/False/None de Python, NaN e Infinity, y reescribe el documento como JSON estricto."
    },
    {
      "question": "¿Cómo funciona el aplanado de JSON a CSV?",
      "answer": "Cada elemento del array de primer nivel se convierte en una fila, y las claves anidadas en columnas con puntos, como user.address.city. Tú eliges el separador y si los arrays anidados ocupan una columna cada uno, se quedan como JSON o se unen. En sentido contrario, las cabeceras se toman al pie de la letra: una columna first_name sigue siendo first_name salvo que pidas explícitamente el anidamiento."
    },
    {
      "question": "¿Qué puedo escribir en la barra de consultas?",
      "answer": "Un subconjunto de JSONPath: $.users[0].name, comodines con [*], descenso recursivo con .., cortes como [0:5], índices negativos y filtros del tipo [?(@.price > 10)] o [?(@.name =~ ^a)]. Las expresiones se interpretan a mano, nunca se evalúan como código."
    }
  ],
  "footerTagline": "Utilidades rápidas, cuidadas y privadas para diseñadores y desarrolladores.",
  "footerCredit": "Parte de la suite oLoveTools"
};
