export default {
  "resetHint": "Empezar de nuevo",
  "title": "HashBolt",
  "badge": "Checksums e integridad de archivos",
  "description": "Calcula MD5, SHA-1, SHA-256, SHA-512, SHA-3, BLAKE3 o CRC-32 de archivos de cualquier tamaño o de texto plano, y compáralo con el checksum que publicó el fabricante. El archivo se procesa por partes dentro de tu navegador y nunca se sube.",
  "seo_title": "HashBolt | Generador y verificador online de MD5, SHA-256, SHA-512 y BLAKE3",
  "seo_description": "Genera y verifica checksums de archivos en tu navegador: MD5, SHA-1, SHA-256, SHA-384, SHA-512, SHA-3, BLAKE2b, BLAKE3, RIPEMD-160, CRC-32, xxHash y HMAC. Archivos de varios gigabytes, lotes y verificación de SHA256SUMS. Nada se sube a ningún servidor.",
  "modeFile": "Archivos",
  "modeText": "Texto",
  "modeCompare": "Comparar",
  "dropTitle": "Suelta aquí tus archivos",
  "dropHint": "De cualquier tipo y tamaño, los que quieras. No se lee nada hasta que pulses Calcular.",
  "browseBtn": "Elegir archivos",
  "folderBtn": "Carpeta entera",
  "pasteHint": "o pega con Ctrl+V",
  "queueTitle": "Cola ({count})",
  "clearBtn": "Vaciar",
  "removeBtn": "Quitar",
  "statusQueued": "en espera",
  "statusCancelled": "detenido",
  "staleNotice": "ajustes cambiados",
  "pendingCount": "quedan {count} por calcular",
  "computeBtn": "Calcular hashes",
  "computeAgainBtn": "Volver a calcular",
  "cancelBtn": "Detener",
  "algoTitle": "Algoritmos",
  "algoNone": "Ninguno seleccionado",
  "algoHint": "Marca los que necesites: el archivo se lee una sola vez y todos los resúmenes se calculan en esa misma pasada.",
  "groupChecksum": "Checksums y heredados",
  "groupSha2": "Familia SHA-2",
  "groupModern": "Modernos",
  "brokenTag": "Las colisiones son viables: sirve contra la corrupción, no contra la manipulación",
  "outputTitle": "Salida",
  "formatHex": "Hex",
  "formatBase64": "Base64",
  "formatBase64Url": "Base64URL",
  "uppercaseLabel": "MAYÚSCULAS",
  "groupedLabel": "Agrupado",
  "hmacTitle": "HMAC (hash con clave)",
  "hmacHint": "Firma el contenido con un secreto compartido: el resumen no le sirve de nada a quien no tenga la clave.",
  "hmacPlaceholder": "Clave secreta",
  "hmacSkipped": "{algos} no tienen modo HMAC y se omiten.",
  "textLabel": "Texto a hashear",
  "textPlaceholder": "Escribe o pega lo que sea: el resumen se actualiza mientras escribes.",
  "textHint": "Hashear texto no es lo mismo que hashear un archivo que lo contiene: un salto de línea final o un CRLF de Windows cambian el resultado.",
  "normalizeEolLabel": "Normalizar saltos de línea de Windows (CRLF → LF)",
  "compareHint": "Dos hashes, sin archivo. Pega el que publicó el fabricante y el que a ti te dieron: hex o Base64, en mayúsculas o minúsculas.",
  "compareA": "Hash A",
  "compareB": "Hash B",
  "compareEqual": "Idénticos. El mismo resumen, sin importar la notación de cada lado.",
  "compareDifferent": "Distintos. Describen contenidos diferentes.",
  "compareInvalid": "Uno de los dos no es un hash en hex ni en Base64.",
  "resultsTitle": "Resúmenes",
  "resultsEmpty": "Pon un archivo en la cola, marca los algoritmos que necesites y pulsa Calcular.",
  "resultsEmptyText": "Empieza a escribir y los resúmenes aparecerán aquí.",
  "resultsEmptyCompare": "El modo comparar no calcula nada: solo te dice si dos resúmenes son el mismo valor.",
  "copyBtn": "Copiar",
  "copyAllBtn": "Copiar todo",
  "downloadSumsBtn": "Descargar archivo SUMS",
  "verifyTitle": "Verificar contra un checksum",
  "verifyPlaceholder": "Pega un hash, o un archivo SHA256SUMS entero: las líneas se emparejan por nombre de archivo.",
  "verifyHint": "Funcionan tanto hex como Base64, en cualquier caja. Si la longitud del resumen no la produce ningún algoritmo marcado se te avisa, en vez de darlo por no coincidente.",
  "verifySummary": "{count} checksum(s) leídos · {ok} verificados · {bad} sin coincidir",
  "verifyMatch": "Coincide: el mismo resumen {algo}.",
  "verifyMismatch": "No coincide. Este archivo no es el que describe ese checksum.",
  "verifyUnknownLength": "Esa longitud de checksum no la produce ninguno de los algoritmos marcados. Marca el correcto y vuelve a calcular.",
  "nextStepTitle": "Sigue con esto",
  "nextStepHint": "El mismo archivo viaja contigo, sin volver a subirlo",
  "nextZip": "Comprimir en ZIP",
  "nextCompress": "Comprimirlo",
  "nextFormat": "Cambiar de formato",
  "nextExif": "Borrar metadatos",
  "nextCrop": "Recortarlo",
  "nextPdf": "Dividir o unir",
  "nextFrames": "Sacar un fotograma",
  "nextAudio": "Recortar o convertir",
  "howItWorksTitle": "Cómo funciona",
  "step1Title": "Pon en cola lo que quieras comprobar",
  "step1Text": "Suelta archivos, elige una carpeta entera, pega uno o cambia a la pestaña de texto. Todavía no se lee nada.",
  "step2Title": "Elige los algoritmos",
  "step2Text": "Uno o una docena. Comparten una única pasada por el archivo, así que tres resúmenes cuestan apenas más que uno.",
  "step3Title": "Pulsa Calcular",
  "step3Text": "El archivo se procesa por trozos dentro de un worker: la barra de progreso es real y una imagen de 20 GB nunca acaba en RAM.",
  "step4Title": "Compáralo con el publicado",
  "step4Text": "Pega un hash o un archivo SUMS completo. La comparación es por valor, no por cómo estaba escrito.",
  "features": [
    {
      "title": "Procesa por partes, no de un bocado",
      "text": "Los archivos se leen por trozos dentro de un worker, así que la memoria se mantiene plana y la barra mide bytes realmente hasheados. Aquí una ISO de varios gigas es trabajo rutinario."
    },
    {
      "title": "Doce resúmenes, una sola lectura",
      "text": "MD5, SHA-1, SHA-256/384/512, SHA3-256/512, BLAKE2b, BLAKE3, RIPEMD-160, CRC-32 y xxHash64, todos alimentados por la misma pasada sobre el archivo."
    },
    {
      "title": "Una verificación que se explica",
      "text": "Pega un hash o un listado SHA256SUMS entero. Compara por valor entre hex y Base64, y si una longitud no pertenece a ningún algoritmo marcado te lo dice en vez de cantarlo como fallo."
    },
    {
      "title": "Carpetas y lotes",
      "text": "Encola cien archivos, háshealos uno tras otro y exporta un archivo SUMS compatible con coreutils para publicarlo junto a tu descarga."
    },
    {
      "title": "HMAC y todas las notaciones",
      "text": "Resúmenes HMAC con clave, salida en hex, Base64 y Base64URL, mayúsculas y vista agrupada. Cambiar cualquiera de esas opciones repinta al instante en lugar de releer el archivo."
    },
    {
      "title": "No se sube nada",
      "text": "El motor es WebAssembly incrustado en la propia página. Ni CDN, ni API, ni subidas: desconecta la red después de cargar y sigue funcionando."
    }
  ],
  "seoHeroTitle": "Comprueba una descarga antes de fiarte de ella",
  "seoHeroText": "Un checksum es la única forma barata de saber que el instalador que acabas de bajar es byte a byte el que se publicó, y no una transferencia truncada o un espejo cambiado. HashBolt calcula esa huella en local: los archivos pasan por trozos a través de un motor WebAssembly, así que el tamaño deja de ser un límite, y cada algoritmo que marques se alimenta de la misma lectura. Después pegas el valor publicado —un hash suelto, un listado SHA256SUMS, una línea al estilo BSD— y obtienes un veredicto que además dice qué algoritmo ha coincidido.",
  "seoHeroList": [
    "Archivos de cualquier tamaño",
    "Doce algoritmos en una pasada",
    "Verificación de SHA256SUMS",
    "Funciona sin conexión una vez cargado"
  ],
  "seoBrowserSpeedTitle": "Un motor WebAssembly dentro de un worker",
  "seoBrowserSpeedText": "El cálculo corre fuera del hilo principal sobre WebAssembly compilado, un orden de magnitud más rápido que el JavaScript escrito a mano que la mayoría de herramientas online sigue usando para MD5. Como consume el archivo como flujo, el pico de memoria es un trozo y no el archivo entero, y la interfaz sigue respondiendo mientras se lee un contenedor de 4 GB.",
  "seoSecondaryTitle": "Qué demuestra un checksum y qué no",
  "seoUseCaseTitle": "Descargas, copias de seguridad y duplicados",
  "seoUseCaseText": "Verifica una ISO de Linux o un instalador contra el hash de la página oficial. Confirma que un archivo copiado a un disco externo llegó intacto. Detecta dos archivos idénticos con nombres distintos comparando resúmenes en vez de abrirlos. Y genera un archivo SUMS para acompañar a tu propia publicación y que otros puedan hacer lo mismo.",
  "seoPrivacyTitle": "No puede filtrar lo que nunca envía",
  "seoPrivacyText": "Esta herramienta no tiene ningún punto de subida, y el cálculo no implica ninguna petición de red: el módulo WebAssembly va incrustado en la página, así que funciona con la conexión apagada. Tus archivos, tu texto y cualquier clave HMAC que escribas se quedan en la pestaña y desaparecen al cerrarla.",
  "seoKeywordsTitle": "Palabras clave",
  "seoKeywords": [
    "Generador MD5 online",
    "Checksum SHA-256",
    "Verificar hash de archivo",
    "Comprobador SHA256SUMS",
    "BLAKE3 online",
    "Calculadora CRC-32",
    "Generador HMAC",
    "Comprobar integridad de archivos"
  ],
  "faqTitle": "Preguntas frecuentes",
  "faq": [
    {
      "question": "¿Se sube mi archivo a algún sitio?",
      "answer": "No. El motor de hashing es WebAssembly incrustado en la página y se ejecuta en un worker dentro de tu navegador. No hay punto de subida, ni llamadas a una API, ni descargas de un CDN, así que la herramienta sigue funcionando con la red desconectada."
    },
    {
      "question": "¿Hasta qué tamaño de archivo aguanta?",
      "answer": "No hay un techo fijo: el archivo se consume como flujo en trozos pequeños, así que solo hay un trozo en memoria a la vez y las imágenes de disco de varios gigabytes son rutina. Lo que te limita en la práctica es la velocidad de lectura de tu disco, que es justo lo que muestra el indicador de velocidad."
    },
    {
      "question": "¿Cómo verifico una ISO o un instalador descargado?",
      "answer": "Pon el archivo en la cola, marca el algoritmo que usó el fabricante (SHA-256 en casi todos los casos), pulsa Calcular y pega su valor publicado en la caja de verificación. También puedes pegar el archivo SHA256SUMS entero: las líneas se emparejan con tus archivos por nombre."
    },
    {
      "question": "¿Por qué MD5 lleva un aviso?",
      "answer": "Porque hoy es barato construir dos archivos distintos con el mismo resumen MD5, y con SHA-1 pasa lo mismo. Siguen siendo perfectamente válidos para detectar una transferencia corrupta, que es para lo que suele estar el checksum de una página de descargas, pero no demuestran nada frente a alguien que haya manipulado el archivo a propósito."
    },
    {
      "question": "Mi hash no coincide con el de la web. ¿Y ahora qué?",
      "answer": "Comprueba primero que has comparado el mismo algoritmo: un hash de 64 caracteres puede ser SHA-256, SHA3-256, BLAKE2b o BLAKE3, y la herramienta te dice cuál ha coincidido. Después vuelve a descargar el archivo: una discrepancia real suele ser una transferencia interrumpida o un espejo defectuoso. Si persiste con una descarga nueva, no ejecutes el archivo."
    },
    {
      "question": "¿Por qué hashear texto da un resultado distinto al del archivo con ese mismo texto?",
      "answer": "Porque un archivo suele llevar algo que el cuadro de texto no tiene: un salto de línea final, finales de línea CRLF de Windows o una marca BOM de UTF-8. La herramienta hashea exactamente los bytes que le das, y hay un interruptor para normalizar CRLF a LF cuando necesites cuadrar con un valor generado en Linux."
    },
    {
      "question": "¿Para qué sirve HMAC?",
      "answer": "Un hash normal demuestra que el contenido no cambió por accidente, pero cualquiera puede recalcularlo. Un HMAC mezcla una clave secreta en el resumen, así que solo quien tenga esa clave puede generar o comprobar el valor. Es lo que usan las firmas de API y la verificación de webhooks."
    }
  ],
  "footerTagline": "Generador y verificador de checksums gratuito para archivos y texto, funcionando entero en tu navegador.",
  "footerCredit": "Parte de la suite oLoveTools"
};
