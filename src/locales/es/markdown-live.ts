export default {
  "resetHint": "Empezar de nuevo",
  "title": "MarkdownLive",
  "description": "Escribe Markdown a la izquierda y mira cómo se construye el documento a la derecha: listas anidadas, listas de tareas, tablas, notas al pie y código resaltado, todo interpretado dentro de tu propia pestaña.",
  "badge": "Markdown, renderizado en tu pestaña",
  "placeholder": "# Bienvenido a MarkdownLive\n\nEscribe a la izquierda y el documento se construye solo a la derecha. No se sube nada a ningún sitio.\n\n## Todo lo que entiende\n\nEl texto puede ir en **negrita**, *cursiva*, ~~tachado~~, ==resaltado== o como `código en línea`, y un enlace como [oLoveTools](https://olovetools.com) se abre en una pestaña nueva. Una dirección suelta como https://olovetools.com se convierte en enlace por su cuenta.\n\n### Código, con colores de sintaxis de verdad\n\n```js\nfunction saludar(nombre) {\n  return `¡Hola, ${nombre}!`;\n}\n\nsaludar('Mundo');\n```\n\n### Listas que se anidan\n\n- Un punto\n  - y uno anidado\n    - y un nivel más\n- [x] Una tarea terminada\n- [ ] Una que sigue pendiente\n\n1. Los elementos numerados\n2. se cuentan solos\n\n### Citas y tablas\n\n> Una cita puede contener **cualquier cosa**, incluido `código`.\n>\n> > Incluso otra cita.\n\n| Función | Dónde se ejecuta | Estado |\n| :--- | :---: | ---: |\n| Analizador | Tu navegador | Listo |\n| Temas | Tu navegador | 5 |\n| Exportar | Tu navegador | MD · HTML · PDF |\n\nY una nota al pie para los detalles.[^1]\n\n[^1]: Las notas al pie se recogen al final del documento, con un enlace de vuelta al punto donde las escribiste.\n",
  "editorPlaceholder": "Escribe Markdown aquí…",
  "editorLabel": "Código Markdown",
  "previewEmpty": "Aquí aparecerá tu documento renderizado.",
  "tocEmpty": "Todavía no hay títulos. Añade una línea que empiece por # y aparecerá aquí.",
  "htmlHint": "HTML semántico sin clases de ningún framework: pégalo directamente en un CMS.",
  "resetTitle": "Empezar un documento nuevo",
  "openFile": "Abrir archivo",
  "pasteText": "Pegar",
  "startFrom": "Empezar con",
  "tplBlank": "Documento en blanco",
  "tplSample": "Repaso de sintaxis",
  "clear": "Vaciar",
  "pastedName": "Texto pegado",
  "fromTool": "enviado desde {tool}",
  "stagedHint": "Todavía no se ha cargado nada: decide qué hacer con el texto que ya tienes.",
  "stagedReplace": "Sustituir el editor",
  "stagedAppend": "Añadir al final",
  "stagedDiscard": "Descartar",
  "dismiss": "Cerrar",
  "style_label": "Tema",
  "style_default": "Pizarra por defecto",
  "style_github": "GitHub claro",
  "style_clean": "Diario limpio",
  "style_retro": "Máquina de escribir",
  "style_cyberpunk": "Neón cyberpunk",
  "pane_editor": "Editor",
  "pane_split": "Dividido",
  "pane_preview": "Vista previa",
  "preview_mode": "Vista previa",
  "html_mode": "HTML",
  "toc_mode": "Índice",
  "syncScroll": "Scroll sincronizado",
  "rendering": "Renderizando…",
  "frontMatter": "Front matter",
  "tooltip_h1": "Título 1",
  "tooltip_h2": "Título 2",
  "tooltip_bold": "Negrita",
  "tooltip_italic": "Cursiva",
  "tooltip_strike": "Tachado",
  "tooltip_mark": "Resaltado",
  "tooltip_link": "Enlace",
  "tooltip_image": "Imagen",
  "tooltip_code": "Código en línea",
  "tooltip_codeblock": "Bloque de código",
  "tooltip_ul": "Lista con viñetas",
  "tooltip_ol": "Lista numerada",
  "tooltip_task": "Lista de tareas",
  "tooltip_quote": "Cita",
  "tooltip_table": "Tabla",
  "tooltip_hr": "Separador",
  "tooltip_undo": "Deshacer",
  "tooltip_redo": "Rehacer",
  "tooltip_indent": "Indentar",
  "sample_bold": "texto en negrita",
  "sample_italic": "texto en cursiva",
  "sample_strike": "texto tachado",
  "sample_mark": "texto resaltado",
  "sample_link": "texto del enlace",
  "sample_image": "descripción de la imagen",
  "sample_code": "código",
  "sample_codeblock": "const respuesta = 42;",
  "sample_col1": "Columna",
  "sample_col2": "Valor",
  "sample_cell": "Fila",
  "words": "palabras",
  "characters": "caracteres",
  "minRead": "min de lectura",
  "headings": "títulos",
  "tasksDone": "tareas",
  "historySize": "{steps} pasos deshacibles · {bytes}",
  "btn_copy_md": "Copiar MD",
  "btn_copy_rich": "Copiar con formato",
  "btn_copy_rich_hint": "Pégalo en un documento o un correo conservando el formato",
  "btn_copy_html": "Copiar HTML",
  "btn_download_md": "Descargar MD",
  "btn_download_html": "Descargar HTML",
  "btn_download_pdf": "Exportar a PDF",
  "copied": "¡Copiado!",
  "noticeCleared": "Editor vaciado. Con Ctrl+Z recuperas tu texto.",
  "errorTooBig": "Ese archivo pesa más de {size} y no cabe en una pestaña del navegador.",
  "errorRead": "No se ha podido leer ese archivo.",
  "errorClipboard": "El navegador no ha permitido leer el portapapeles. Pega directamente en el editor.",
  "errorClipboardWrite": "El portapapeles no está disponible en este navegador.",
  "errorExport": "No se ha podido generar esa exportación.",
  "nextStepTitle": "Sigue adelante",
  "nextStepHint": "Tu documento te acompaña, sin volver a subirlo",
  "nextWordflow": "Revisar la redacción",
  "nextDiff": "Comparar dos versiones",
  "nextTts": "Escucharlo en voz alta",
  "nextCodecard": "Convertirlo en imagen",
  "nextHash": "Calcular su hash",
  "templates": [
    {
      "name": "README de proyecto",
      "body": "# Nombre del proyecto\n\nUna frase sobre qué hace esto y para quién es.\n\n## Instalación\n\n```bash\nnpm install nombre-del-proyecto\n```\n\n## Uso\n\n```js\nimport { cosa } from 'nombre-del-proyecto';\n\ncosa({ rapido: true });\n```\n\n## Opciones\n\n| Opción | Tipo | Por defecto | Qué hace |\n| :--- | :--- | :--- | :--- |\n| `rapido` | booleano | `false` | Se salta el camino lento |\n\n## Contribuir\n\n- [ ] Haz un fork del repositorio\n- [ ] Abre una pull request\n\n## Licencia\n\nMIT\n"
    },
    {
      "name": "Acta de reunión",
      "body": "# Reunión — tema\n\n**Fecha:** \n**Asistentes:** \n\n## Orden del día\n\n1. Primer punto\n2. Segundo punto\n\n## Decisiones\n\n> Anota lo que se decidió de verdad, no lo que se debatió.\n\n## Tareas\n\n- [ ] Quién hace qué y para cuándo\n- [ ] Segunda tarea\n\n## Aparcado\n\nLo que se deja a propósito para otro día.\n"
    },
    {
      "name": "Registro de cambios",
      "body": "# Registro de cambios\n\nTodos los cambios relevantes del proyecto, del más reciente al más antiguo.\n\n## [1.1.0]\n\n### Añadido\n\n- Lo nuevo\n\n### Corregido\n\n- Lo viejo que estaba roto\n\n### Eliminado\n\n- ~~Lo que no usaba nadie~~\n\n## [1.0.0]\n\nPrimera versión pública.\n"
    },
    {
      "name": "Entrada de blog",
      "body": "---\ntitle: El título\ndate: 2026-01-01\ntags: [markdown, escritura]\n---\n\n# El título\n\nUn primer párrafo que diga qué se lleva el lector de aquí.\n\n## La primera idea\n\nTexto, con un enlace a [algo relevante](https://example.com) y una cita:\n\n> Una frase que merece la pena citar.\n\n## La segunda idea\n\n![Descripción de la imagen](https://example.com/imagen.png)\n\n## Qué quedarse\n\n- El primer punto\n- El segundo punto\n"
    }
  ],
  "heroPoints": [
    "Markdown al estilo GitHub, interpretado en serio",
    "Listas anidadas, tareas, notas al pie y tablas",
    "Colores de sintaxis en los bloques de código",
    "Exporta a MD, HTML autónomo o PDF"
  ],
  "step1Title": "Escribe, pega o abre un archivo",
  "step1Text": "Escribe directamente en el editor, pega desde el portapapeles, suelta un archivo .md sobre el espacio de trabajo o arranca desde una de las plantillas. Un archivo que llega se queda en espera hasta que digas si sustituye tu texto o se añade al final.",
  "step2Title": "Míralo renderizarse mientras escribes",
  "step2Text": "El documento se analiza fuera del hilo principal y la vista previa sigue el ritmo del cursor. Al desplazar un panel se mueve el otro, así que lo que estás editando siempre es lo que estás mirando.",
  "step3Title": "Elige qué aspecto tendrá",
  "step3Text": "Cinco temas de vista previa, desde una página sobria estilo GitHub hasta un folio de máquina de escribir. El tema no es solo decoración de pantalla: viaja al archivo HTML exportado y a la página impresa.",
  "step4Title": "Llévatelo contigo",
  "step4Text": "Descarga el Markdown, un archivo HTML autónomo o un PDF sin nada del mobiliario de esta página. O manda el documento directamente a otra herramienta de oLoveTools sin pasar por la carpeta de descargas.",
  "features": [
    {
      "title": "Un analizador de verdad, no un montón de expresiones regulares",
      "text": "El documento se convierte en un árbol sintáctico y solo después en HTML, así que las listas anidadas conservan su anidamiento, una barra vertical suelta en una frase no se lee como una tabla y los nombres_con_guion_bajo se quedan intactos en vez de llenarse de cursivas."
    },
    {
      "title": "Bloques de código con colores de sintaxis",
      "text": "Los bloques delimitados se resaltan en más de veinte lenguajes, de JavaScript y Python a SQL, YAML o Dockerfiles. Las gramáticas solo se descargan cuando el documento contiene código de verdad."
    },
    {
      "title": "Una vista previa que no se queda atrás",
      "text": "El análisis corre en un Web Worker, así que el cursor no se atasca en un README largo. Si los workers están bloqueados, el mismo código se ejecuta en línea y la vista previa se renderiza igual."
    },
    {
      "title": "Temas que sobreviven a la exportación",
      "text": "Pizarra, GitHub claro, Diario limpio, Máquina de escribir y Neón cyberpunk. La hoja de estilos que ves en pantalla es la que se escribe en el archivo exportado, así que lo que descargas se parece a lo que viste."
    },
    {
      "title": "Exportaciones que sirven de verdad",
      "text": "Copia HTML semántico sin clases de framework, copia texto con formato para un correo, descarga una página autónoma o imprime un PDF que contiene el documento y nada más: sin cabecera, sin barra de herramientas, sin anuncios."
    },
    {
      "title": "Un índice construido con tus títulos",
      "text": "Cada título recibe un ancla estable y aparece en un índice en el que se puede pinchar, así que una especificación larga se puede recorrer mientras la sigues escribiendo."
    },
    {
      "title": "Deshacer que guarda ediciones, no copias",
      "text": "El historial guarda solo los caracteres que cambiaron, así que cientos de pasos sobre un documento largo cuestan kilobytes en vez de megabytes. Tu borrador también se guarda en local entre visitas."
    },
    {
      "title": "Encadenado con el resto de la suite",
      "text": "Manda el documento terminado a WordFlow para revisar la redacción, a DiffSnap para comparar dos versiones o a TTS-Bolt para escucharlo, sin descargar ni volver a subir nada."
    }
  ],
  "seoHeroTitle": "Editor de Markdown online gratis con vista previa en vivo",
  "seoHeroText": "MarkdownLive es un editor de Markdown a dos columnas que renderiza mientras escribes. Admite la sintaxis estilo GitHub que la gente escribe de verdad: listas anidadas y de tareas, tablas con alineación, notas al pie, tachado, resaltado, enlaces automáticos, títulos subrayados, front matter y bloques de código con colores de sintaxis. El editor ayuda sobre la marcha: continúa las listas al pulsar Intro, indenta con el tabulador, envuelve la selección en negrita o cursiva desde el teclado y convierte una URL pegada en un enlace alrededor de lo que tuvieras seleccionado.",
  "seoBrowserSpeedTitle": "Todo ocurre dentro de tu pestaña",
  "seoBrowserSpeedText": "No hay paso de subida ni cuenta de usuario. El analizador, el resaltador de sintaxis, los temas y todas las exportaciones se ejecutan como JavaScript en tu navegador, y por eso la herramienta funciona con la red desconectada. Tu borrador se guarda en el almacenamiento local de este navegador para que una recarga no lo pierda, y basta con borrar los datos del navegador para eliminarlo: nunca se envió a ninguna parte que haya que limpiar.",
  "seoHeroList": [
    "Sin subidas, sin cuenta, sin servidor",
    "Funciona sin conexión una vez cargada la página",
    "Borrador guardado en local entre visitas",
    "No hay nada que borrar de nuestro lado"
  ],
  "seoSecondaryTitle": "Pensado para documentos que tienen que salir del editor",
  "seoUseCaseTitle": "READMEs, documentación, notas y artículos",
  "seoUseCaseText": "Redacta el README de un proyecto con su tabla de opciones y sus ejemplos de código, guarda actas de reunión con listas de tareas que enseñan qué sigue abierto, escribe un registro de cambios o prepara una entrada de blog con front matter antes de meterla en un generador de sitios estáticos. El panel de índice convierte un documento largo en algo por lo que se puede saltar, y el recuento de palabras y la estimación de lectura te dicen cuándo un artículo ya es lo bastante largo.",
  "seoPrivacyTitle": "Privado por construcción",
  "seoPrivacyText": "Los borradores sin publicar, la documentación interna y las notas de un cliente son justo el tipo de texto que no debería pegarse en el servidor de otro. Aquí no tiene adónde ir: el documento nunca sale de la página en la que se escribe.",
  "faqTitle": "Preguntas frecuentes",
  "faq": [
    {
      "question": "¿Qué sintaxis de Markdown admite?",
      "answer": "El conjunto estilo GitHub: títulos en formato ATX (#) y subrayado, negrita, cursiva, tachado, resaltado, código en línea, bloques de código delimitados e indentados, citas anidables, listas ordenadas y sin ordenar que se anidan, listas de tareas, tablas con alineación por columna, imágenes, enlaces, URLs sueltas, notas al pie, separadores, saltos de línea forzados, escapes con barra invertida y front matter en YAML, que se mantiene fuera del resultado renderizado."
    },
    {
      "question": "¿Mi documento se sube o se guarda en un servidor?",
      "answer": "No. El análisis, el renderizado, el resaltado y todas las exportaciones se ejecutan en tu navegador, y ninguna parte del documento se transmite. La única copia que sobrevive a la pestaña es el borrador guardado en el almacenamiento local de este navegador para que una recarga no pierda tu trabajo; borrar los datos del navegador lo elimina."
    },
    {
      "question": "¿Cómo funciona «Exportar a PDF»?",
      "answer": "Construye una copia limpia del documento con el tema que hayas elegido y le entrega solo eso al diálogo de impresión del navegador, donde eliges «Guardar como PDF». La cabecera, la barra de herramientas, los bloques de anuncios y el pie de la página no forman parte de lo que se imprime: obtienes el documento sobre papel blanco, con los saltos de página fuera de los bloques de código y de las tablas."
    },
    {
      "question": "¿Qué diferencia hay entre «Copiar HTML» y «Copiar con formato»?",
      "answer": "«Copiar HTML» pone el marcado en el portapapeles como texto: etiquetas semánticas sin clases de framework, listas para pegar en un CMS, una plantilla o un creador de correos. «Copiar con formato» pone el documento en el portapapeles como texto enriquecido, así que al pegarlo en un procesador de textos, un documento o un cliente de correo se conservan los títulos, la negrita y las listas en vez de aparecer un montón de etiquetas."
    },
    {
      "question": "¿Puedo abrir un archivo Markdown que ya tengo?",
      "answer": "Sí: usa «Abrir archivo» o suéltalo sobre el espacio de trabajo. No se carga nada a tus espaldas: el archivo queda en espera y tú decides si sustituye al editor o se añade a lo que ya hay. Lo mismo vale para los documentos que llegan desde otra herramienta de oLoveTools."
    },
    {
      "question": "¿Qué atajos de teclado hay?",
      "answer": "Ctrl+B para negrita, Ctrl+I para cursiva, Ctrl+E para código en línea, Ctrl+K para poner un enlace alrededor de la selección, y Ctrl+Z y Ctrl+Y para deshacer y rehacer. El tabulador y Mayús+Tab indentan y desindentan las líneas seleccionadas, e Intro continúa una lista, una numeración o una cita; pulsarlo sobre un elemento vacío cierra la lista en vez de añadir otra viñeta muerta."
    },
    {
      "question": "¿Cómo de grande puede ser el documento?",
      "answer": "Se aceptan archivos de hasta 8 MB, mucho más de lo que ocupa cualquier documento escrito a mano. El análisis ocurre en un Web Worker para que el editor siga respondiendo con archivos largos, y el historial de deshacer guarda solo los caracteres que cambiaron en lugar de una copia del documento por paso."
    }
  ],
  "seoKeywordsTitle": "Búsquedas relacionadas",
  "seoKeywords": [
    "editor markdown",
    "vista previa markdown",
    "markdown a html",
    "markdown a pdf",
    "editor markdown online",
    "markdown estilo github",
    "editor de readme",
    "generador de tablas markdown",
    "markdown en vivo",
    "editor markdown gratis"
  ],
  "footerTagline": "Un editor de Markdown gratuito, privado y local con vista previa en vivo.",
  "footerCredit": "Parte de la suite oLoveTools",
  "seo_title": "MarkdownLive | Editor de Markdown online gratis con vista previa",
  "seo_description": "Escribe Markdown y velo renderizado mientras escribes. Listas anidadas, tablas, notas al pie, tareas y código con colores. Exporta a MD, HTML o PDF. Gratis y totalmente local."
};
