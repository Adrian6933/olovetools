export default {
  "title": "HTML Sanitizer",
  "seo_title": "HTML Sanitizer | Sanitizador y limpiador de HTML online con informe de eliminaciones",
  "seo_description": "Limpia HTML con una política de lista blanca real: elimina scripts, manejadores de eventos, URLs javascript: y etiquetas no deseadas, y consulta exactamente qué se quitó para devolver lo que quieras. Todo en tu navegador.",
  "seoHeroTitle": "Limpiador y sanitizador de HTML",
  "badge": "Sanitizador con lista blanca",
  "description": "Pega HTML, elige una política y pulsa el botón. Obtienes el marcado limpio más un informe detallado de cada etiqueta y atributo descartado, y puedes revocar cualquier decisión sin volver a pegar nada.",
  "heroPoints": [
    "No se ejecuta nada hasta que pulsas",
    "Cada eliminación va detallada",
    "Nunca sale de tu navegador"
  ],
  "label_input": "HTML de entrada",
  "label_policy": "Política de limpieza",
  "placeholder_input": "Pega aquí tu HTML, suelta un archivo .html o carga uno de los ejemplos. No se ejecuta nada hasta que pulses Sanear.",
  "button_open_file": "Abrir archivo",
  "button_clear": "Limpiar todo",
  "button_run": "Sanear",
  "button_working": "Limpiando…",
  "button_manual": "Manual",
  "button_undo": "Deshacer",
  "button_redo": "Rehacer",
  "button_copy": "Copiar",
  "button_copied": "¡Copiado!",
  "button_download": "Descargar",
  "button_reset": "Reiniciar",
  "samples_title": "Pruébalo",
  "sample_messy": "Pegado sucio de CMS",
  "sample_attack": "Payloads XSS conocidos",
  "preset_strict": "Estricto",
  "preset_strict_hint": "Solo texto y enlaces. Para todo lo que vayas a almacenar.",
  "preset_email": "Apto para email",
  "preset_email_hint": "Sobreviven las tablas y el estilo en línea; el scripting no.",
  "preset_content": "Contenido enriquecido",
  "preset_content_hint": "Cuerpo de un CMS: medios, tablas, data-* y aria-*.",
  "preset_text": "Texto plano",
  "preset_text_hint": "Quita todo el marcado y conserva el orden de lectura.",
  "preset_custom_active": "Política personalizada, editada a mano.",
  "stale_hint": "La política ha cambiado: vuelve a ejecutar",
  "shortcut_hint": "Ctrl+Intro para ejecutar · Ctrl+Z para deshacer un cambio de política",
  "tab_source": "Código limpio",
  "tab_preview": "Vista previa",
  "tab_report": "Eliminado",
  "format_pretty": "Formateado",
  "format_min": "Minificado",
  "format_raw": "Tal cual",
  "compare_hold": "Mantén para comparar",
  "compare_showing": "Original",
  "output_empty": "Se eliminó todo: nada ha sobrevivido a esta política.",
  "copy_failed": "Tu navegador ha bloqueado el acceso al portapapeles.",
  "stat_size": "tamaño",
  "stat_elements": "elementos",
  "stat_removed": "eliminados",
  "stat_dangerous": "ejecutables",
  "stat_time": "tiempo",
  "policy_allowed_tags": "Etiquetas permitidas",
  "policy_allowed_attrs": "Atributos permitidos",
  "policy_add_tag": "añadir etiqueta…",
  "policy_add_attr": "añadir atributo…",
  "policy_no_tags": "Ninguna etiqueta permitida: la salida será texto plano",
  "policy_no_attrs": "No se conserva ningún atributo",
  "policy_strip_tags": "Borrar con su contenido",
  "policy_strip_hint": "nunca se desenvuelven: lo de dentro también se va",
  "policy_no_strip": "No se borra nada con su contenido",
  "policy_unknown": "Etiquetas no permitidas",
  "policy_unwrap": "Desenvolver: conservar el texto interior",
  "policy_drop": "Descartar: eliminar todo el subárbol",
  "policy_schemes": "Esquemas de URL aceptados",
  "policy_schemes_hint": "cualquier otro en href/src se descarta",
  "policy_data_note": "data:image solo acepta formatos ráster. Las URL de datos SVG nunca se permiten: un SVG en línea ejecuta su propio <script> al abrirlo directamente.",
  "policy_other": "Atributos y extras",
  "policy_keep_style": "Conservar style=\"…\"",
  "policy_keep_class": "Conservar class=\"…\"",
  "policy_keep_id": "Conservar id / name",
  "policy_keep_comments": "Conservar comentarios",
  "policy_data_attrs": "Conservar atributos data-*",
  "policy_aria_attrs": "Conservar aria-* y role",
  "policy_svg_math": "Permitir <svg> y <math>",
  "policy_harden_links": "Añadir rel=\"noopener noreferrer\"",
  "policy_strip_target": "Quitar target=\"_blank\"",
  "scheme_https_hint": "Enlaces e imágenes cifrados.",
  "scheme_http_hint": "HTTP sin cifrar: vale para páginas internas, se filtra por la red.",
  "scheme_relative_hint": "Rutas y anclas sin esquema: /pagina, #seccion, ?q=1.",
  "scheme_mailto_hint": "Enlaces de correo.",
  "scheme_tel_hint": "Enlaces de teléfono, SMS y llamada directa.",
  "scheme_ftp_hint": "Enlaces heredados de transferencia de archivos.",
  "scheme_data_hint": "Imágenes incrustadas como URL de datos. Solo formatos ráster.",
  "report_empty": "No se eliminó nada: la entrada ya cumplía la política.",
  "report_dangerous": "{0} eliminaciones podrían haber ejecutado código.",
  "report_on": "en",
  "report_keep": "Conservar",
  "report_kept": "Conservado",
  "report_keep_it": "Conservar esto en la salida",
  "report_remove_again": "Volver a eliminarlo",
  "reason_tag-not-allowed": "Etiqueta fuera de la lista blanca",
  "reason_tag-stripped": "Etiqueta borrada con su contenido",
  "reason_event-handler": "Manejador de eventos en línea",
  "reason_attr-not-allowed": "Atributo fuera de la lista blanca",
  "reason_bad-scheme": "Esquema de URL no permitido",
  "reason_comment": "Comentario HTML",
  "reason_inline-style": "Atributo style en línea",
  "reason_class-attr": "Atributo class",
  "reason_id-attr": "Atributo id / name",
  "nextStepTitle": "Sigue",
  "nextStepHint": "El HTML limpio viaja contigo: sin volver a subirlo",
  "nextDiff": "Comparar con el original",
  "nextCodecard": "Crear imagen del código",
  "nextWordflow": "Analizar el texto",
  "nextBase64": "Codificar a Base64",
  "nextZip": "Comprimir en ZIP",
  "howItWorksTitle": "Cómo funciona",
  "step1Title": "Trae el HTML",
  "step1Text": "Pégalo, suelta un archivo .html o llega desde otra herramienta. Se queda ahí: abrir un archivo nunca inicia la limpieza.",
  "step2Title": "Elige la política",
  "step2Text": "Cuatro preajustes cubren los casos habituales. Abre el panel manual para editar tú la lista de etiquetas, la de atributos y los esquemas de URL aceptados.",
  "step3Title": "Ejecútalo",
  "step3Text": "Una sola pasada construye el árbol limpio y registra por el camino cada decisión. Un megabyte de marcado tarda unos milisegundos.",
  "step4Title": "Revisa y revoca",
  "step4Text": "El informe enumera qué se fue y por qué. Si no estás de acuerdo con una fila, pulsa Conservar: la pasada se repite con esa única excepción.",
  "featuresTitle": "Qué hace",
  "features": [
    {
      "title": "Política de lista blanca real",
      "text": "Etiquetas, atributos y esquemas de URL son listas independientes que tú controlas. Bloquear una etiqueta y dejar sus atributos intactos no es sanear."
    },
    {
      "title": "Informe detallado de eliminaciones",
      "text": "Cada elemento y atributo descartado se agrupa con su recuento, una muestra de lo que contenía y el motivo por el que se fue."
    },
    {
      "title": "Revoca cualquier decisión",
      "text": "Pulsa Conservar en una fila y el saneado se repite permitiendo exactamente esa cosa. Tu texto original nunca se edita."
    },
    {
      "title": "Se comprueban los esquemas de URL",
      "text": "javascript:, data:text/html y vbscript: en href, src, formaction, srcset o xlink:href se detectan, incluidos los trucos con espacios y entidades."
    },
    {
      "title": "Vista previa aislada",
      "text": "El resultado se pinta en un iframe con sandbox vacío y sin referente, así que nada de lo que hay dentro puede ejecutarse, enviarse ni navegar."
    },
    {
      "title": "Formateado, minificado o tal cual",
      "text": "Vuelve a serializar el mismo árbol limpio de tres formas. El espaciado dentro de <pre> se conserva aunque el resto se reindente."
    },
    {
      "title": "Enlaza con la siguiente herramienta",
      "text": "Envía el resultado directo a DiffSnap, CodeCard, WordFlow, Base64Bolt o ZipFlow sin descargar y volver a subir."
    },
    {
      "title": "Nada sale de la pestaña",
      "text": "El saneador es una librería JavaScript empaquetada con la página. No hay subida, ni llamada a una API, ni petición a un CDN en ningún momento."
    }
  ],
  "seoSecondaryTitle": "Un saneador que enseña su trabajo",
  "seoHeroText": "La mayoría de limpiadores de HTML online te entregan una cadena y esperan que te fíes. Este conserva el registro de decisiones: qué etiqueta se descartó, qué atributo se quitó, qué URL no pasó la comprobación de esquema, y te deja revocar cualquiera de ellas en un clic, porque la salida limpia se regenera a partir de tu política en vez de parchearse después.",
  "seoHeroList": [
    "Lista blanca, no lista negra",
    "Se comprueban los atributos, no solo las etiquetas",
    "Recuentos y motivos de cada eliminación",
    "Deshacer y rehacer sobre la política"
  ],
  "seoUseCaseTitle": "Cuándo lo necesitas",
  "seoUseCaseText": "Limpiar lo que produjo un editor de texto enriquecido antes de guardarlo. Quitar la basura de Word y Google Docs de un pegado en el CMS. Hacer seguro el marcado de terceros antes de pintarlo. Sacar texto legible de una página guardada. Comprobar si el marcado en el que vas a confiar contiene algo ejecutable: el ejemplo de payloads conocidos está ahí para que veas la respuesta en vez de suponerla.",
  "seoBrowserSpeedTitle": "Construido sobre DOMPurify",
  "seoBrowserSpeedText": "El análisis y las decisiones de seguridad vienen de DOMPurify, la librería que citan los propios equipos de seguridad de los navegadores, y no de una pasada escrita a mano sobre querySelectorAll. Se usa a través de su API de hooks y se le pide el DOM intermedio en lugar de una cadena terminada, que es lo que hace posibles el informe de eliminaciones y las excepciones por elemento. Gestiona el XSS por mutación, la confusión de espacios de nombres y los trucos de URL que un limpiador ingenuo pasa por alto.",
  "seoPrivacyTitle": "100% privado y seguro",
  "seoPrivacyText": "Sin subidas, sin claves de API y sin rastrear lo que pegas. La librería va empaquetada con la página, así que tampoco se descarga nada de un CDN. Tu HTML se queda en la memoria de la pestaña y desaparece al cerrarla.",
  "seoKeywordsTitle": "También conocido como",
  "seoKeywords": [
    "sanitizador html",
    "limpiador html",
    "eliminar scripts de html",
    "limpiar html online",
    "sanear html",
    "quitar etiquetas",
    "dompurify online",
    "filtro xss",
    "lista blanca html"
  ],
  "faqTitle": "Preguntas frecuentes",
  "faq": [
    {
      "question": "¿Por qué no pasa nada al pegar?",
      "answer": "Es a propósito. Pegar o abrir un archivo solo carga el HTML; el saneado se ejecuta cuando pulsas Sanear. Así eliges tú la política primero en vez de ver cómo la herramienta adivina, y un documento grande no se analiza en cada pulsación de tecla."
    },
    {
      "question": "¿Qué me permite hacer realmente el informe de eliminaciones?",
      "answer": "Cada fila es una decisión reversible. Pulsar Conservar añade esa única excepción y repite la pasada entera, así que permitir de nuevo un <iframe> no deja pasar también su atributo onload. Tu texto de entrada nunca se reescribe, y por eso deshacer y rehacer siguen siendo baratos."
    },
    {
      "question": "¿Basta con poner las etiquetas en lista blanca para que la salida sea segura?",
      "answer": "No, y ese es el error que comete la mayoría de limpiadores que solo miran etiquetas. Una etiqueta <a> de cualquier lista blanca puede seguir llevando href=\"javascript:…\", así que aquí los atributos y los esquemas de URL se comprueban por separado. Bloquear una etiqueta dejando sus atributos intactos no es sanear."
    },
    {
      "question": "¿Qué esquemas de URL pasan?",
      "answer": "Solo los que marques. El resto se descarta de href, src, srcset, action, formaction, poster, cite y xlink:href, incluidos los valores escondidos tras tabuladores, saltos de línea o entidades HTML. data: se limita a imágenes ráster: una URL de datos SVG ejecuta su propio script al abrirla directamente, así que nunca se permite."
    },
    {
      "question": "¿Es segura la vista previa?",
      "answer": "Sí. Se pinta en un iframe con sandbox puesto a la cadena vacía, lo que bloquea scripts, formularios, ventanas emergentes y navegación, más una política sin referente para que ninguna imagen superviviente pueda filtrar de qué página vienes."
    },
    {
      "question": "¿Se envía mi HTML a algún sitio?",
      "answer": "No. El saneador es JavaScript empaquetado con esta página y se ejecuta en tu pestaña. No hay subida, ni llamada a una API, ni petición a un CDN: puedes comprobarlo con la pestaña de red abierta."
    },
    {
      "question": "¿Con qué tamaño de documento puede?",
      "answer": "El análisis es aproximadamente lineal, así que unos pocos megabytes de marcado terminan bastante por debajo del segundo en un portátil normal; el tiempo medido se muestra tras cada ejecución. El resaltado de sintaxis del panel de salida se apaga por encima de 200 KB, porque a ese tamaño colorear cuesta más de lo que aporta."
    }
  ],
  "footerTagline": "Un sanitizador HTML con política de lista blanca real y un informe de eliminaciones que puedes rebatir: 100% local en tu navegador.",
  "footerCredit": "Parte de la suite oLoveTools",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "¡Copiado!",
  "contactForIdeas": "Contacto para ideas y comentarios:"
};
