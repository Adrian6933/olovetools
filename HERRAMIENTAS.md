# oLoveTools 🚀 — Catálogo de Herramientas y Roadmap

¡Bienvenido al mapa de ruta y catálogo de **oLoveTools**! Este documento detalla las herramientas ya implementadas, y plantea una lista de ideas para expandir el sitio, ordenadas de **mejor a peor** según su potencial de tráfico orgánico (SEO), retención de usuarios, rentabilidad de anuncios (CPC) y facilidad de desarrollo 100% local (sin costes de servidor).

---

## 🛠️ Herramientas Actuales (Implementadas)

| Herramienta | Ruta / URL | Descripción Corta | Estado y Tecnologías |
| :--- | :--- | :--- | :--- |
| **Clipy** 🎬 | `/clipy` | Buscador y organizador avanzado de clips y vídeos. | **Listo**. React, APIs de búsqueda. |
| **ClipBolt (Twitch)** ⚡ | `/twitchbolt` | Descargador rápido de clips de Twitch en MP4 de alta calidad. | **Listo**. Twitch API y descarga directa. |
| **ClipBolt (Kick)** 🟢 | `/kickbolt` | Descargador rápido de clips de la plataforma Kick. | **Listo**. Kick API y descarga directa. |
| **FormatFlow** 🔄 | `/formatflow` | Conversor y formateador de archivos seguro. | **Listo**. Conversión local en navegador. |
| **PasteSnap** 📸 | `/pastesnap` | Compartir e intercambiar capturas pegando desde el portapapeles. | **Listo**. Portapapeles API, descarga local. |
| **CompressSnap** 📉 | `/compresssnap` | Compresor y optimizador inteligente de imágenes (JPG, PNG, WebP) local en navegador. | **Listo**. React, compresión local. |
| **Background Remover** 🖼️ | `/backgroundremover` | Eliminación de fondos de imágenes automática usando IA local en navegador. | **Listo**. React, ONNX / Transformers.js. |
| **PDF-Flow** 📄 | `/pdf-flow` | Herramienta todo en uno para unir, dividir, rotar y convertir archivos PDF localmente. | **Listo**. React, pdf-lib local. |
| **RecordSnap** 🎥 | `/recordsnap` | Grabadora de pantalla y webcam online sin registros ni descargas. | **Listo**. React, MediaRecorder API. |
| **QR-Bolt** 📱 | `/qr-bolt` | Generador de códigos QR personalizados y estilizados con logo y colores. | **Listo**. React, canvas local. |
| **CodeCard** 💻 | `/codecard` | Conversor de fragmentos de código a imágenes estéticas listas para compartir. | **Listo**. React, html-to-image. |
| **CropSnap** ✂️ | `/cropsnap` | Recortador y redimensionador rápido de imágenes con proporciones predefinidas. | **Listo**. React, Canvas API. |
| **CSS-Designer** 🎨 | `/css-designer` | Diseñador visual de efectos CSS modernos (Glassmorphism, sombras, degradados). | **Listo**. React, Tailwind y Canvas local. |
| **JSON-Flow** 🗂️ | `/json-flow` | Validador, formateador y conversor de JSON a CSV/Excel/XML. | **Listo**. React, renderizado local de árboles y convertidores. |
| **SocialBolt** ⚡ | `/socialbolt` | Descargador rápido de vídeos de TikTok sin marca de agua, Reels de Instagram y Shorts de YouTube. | **Listo**. React, API de TikWM y Cobalt descentralizado. |
| **TTS-Bolt** 🗣️ | `/tts-bolt` | Convertidor de texto a voz y descarga de archivos MP3. | **Listo**. React, Web Speech API y concatenación de buffers locales. |
| **GIF-Bolt** 👾 | `/gif-bolt` | Creador y optimizador de GIFs animados a partir de vídeos o secuencias de imágenes. | **Listo**. React, gifshot y extracción de fotogramas en local. |
| **AudioSnap** 🎙️ | `/audiosnap` | Graba y recorta audio de micrófono en tu navegador con descargas en WAV o formato nativo. | **Listo**. React, Web Audio API y procesamiento en memoria. |
| **DrawSnap** ✏️ | `/drawsnap` | Pizarra digital interactiva y lienzo de dibujo vectorial y rasterizado 100% local. | **Listo**. React, Canvas API y exportador vectorial. |
| **DiffSnap** 🔍 | `/diffsnap` | Compara dos fragmentos de texto o código y visualiza adiciones/eliminaciones 100% en local. | **Listo**. React, algoritmo LCS Myers y layouts unificado/dividido. |
| **Watermark-Snap** 🏷️ | `/watermark-snap` | Añade marcas de agua personalizadas de texto o logotipos a múltiples imágenes en lote localmente. | **Listo**. React, Canvas drawing engine y exportador ZIP. |
| **Favicon-Bolt** 🎨 | `/favicon-bolt` | Genera un paquete completo de favicons estándar (multi-resolución ICO, Apple, Android) desde imágenes o emojis localmente. | **Listo**. React, compilador binario ICO y exportador ZIP. |
| **EXIF-Clear** 🛡️ | `/exif-clear` | Inspecciona y elimina EXIF, GPS y metadatos de tus fotos de forma local en tu navegador. | **Listo**. React, ArrayBuffer header segment removal. |
| **Meme-Bolt** 🎭 | `/meme-bolt` | Creador de memes interactivo con plantillas vectoriales locales o imágenes personalizadas con dragging y stickers. | **Listo**. React, Canvas drawing engine & local SVG templates. |
| **WordFlow** ✍️ | `/wordflow` | Contador avanzado de palabras, caracteres, análisis de legibilidad y asistente de limpieza de textos. | **Listo**. React, Automated Readability Index & local heuristics. |
| **Markdown-Live** 📝 | `/markdown-live` | Editor Markdown visual en tiempo real y visor HTML con plantillas de estilo y exportadores a PDF/HTML. | **Listo**. React, regex GFM parsing engine. |
| **Hash-Bolt** 🔑 | `/hash-bolt` | Calculadora y verificador de firmas y hashes criptográficos (MD5, SHA-1, SHA-256, SHA-512) 100% en local. | **Listo**. React, Web Crypto API y motor MD5 local. |
| **Zip-Flow** 📦 | `/zip-flow` | Compresor y extractor de archivos ZIP 100% en local con explorador de directorios interactivo. |
| **Regex-Flow** 🔍 | `/regex-flow` | Probador, constructor y visualizador interactivo de expresiones regulares en tiempo real. |
| **Lottie-Viewer** 🎬 | `/lottie-viewer` | Reproductor, personalizador e inspector interactivo de animaciones Lottie. | **Listo**. React, lottie-web local y editor de colores. | **Listo**. React, RegExp parser local y highlights reactivos. | **Listo**. React, JSZip y buffers en memoria. |
| **SVG-Optimizer** 📐 | `/svg-optimizer` | Optimizador y minificador de código SVG vectorial 100% local en navegador. | **Listo**. React, DOMParser y XMLSerializer local. |
| **Graph-Flow** 📊 | `/graph-flow` | Creador de gráficos de barras, líneas, circulares y más a partir de CSV o datos manuales con exportación PNG/SVG. | **Listo**. React, Canvas2D rendering engine local. |

---

## 🔮 Roadmap: Próximas Herramientas (30 Ideas Ordenadas de Mejor a Peor)

A continuación se listan las ideas de herramientas para integrar en el ecosistema, ordenadas según su prioridad recomendada (viabilidad técnica, demanda del público y capacidad de atracción de usuarios).

### 📊 Tabla Resumen Rápida

| # | Nombre | Slug | Client-Side | Demanda | Prioridad |
| :--- | :--- | :--- | :---: | :--- | :---: |
| 1 | ~~SVG-Optimizer~~ | `/svg-optimizer` | ✅ | 🔥 Nicho | ✅ **LISTO** |
| 2 | Graph-Flow | `/graph-flow` | ✅ | 🔥 Media | 🔵 |
| 3 | URL-Bolt | `/url-bolt` | ✅ | 🔥 Media | ⚪ |
| 4 | Base64-Bolt | `/base64-bolt` | ✅ | 🔥 Media | ⚪ |
| 5 | ColorSnap | `/colorsnap` | ✅ | 🔥 Media | ⚪ |
| 6 | SQL-Flow | `/sql-flow` | ✅ | 🔥 Nicho | ⚪ |
| 7 | PassBolt | `/passbolt` | ✅ | 🔥 Baja | ⚪ |
| 8 | Epoch-Flow | `/epoch-flow` | ✅ | 🔥 Nicho | ⚪ |
| 9 | HTML-Sanitizer | `/html-sanitizer` | ✅ | 🔥 Nicho | ⚪ |
| 10 | Cron-Flow | `/cron-flow` | ✅ | 🔥 Nicho | ⚪ |
| 11 | Time-Bolt | `/time-bolt` | ✅ | 🔥 Media | ⚪ |
| 12 | Device-Test | `/device-test` | ✅ | 🔥 Media | ⚪ |
| 13 | Lorem-Flow | `/lorem-flow` | ✅ | 🔥 Baja | ⚪ |
| 14 | Hex-to-RGB | `/hex-to-rgb` | ✅ | 🔥 Media | ⚪ |
| 15 | Whiteboard-Flow | `/whiteboard-flow` | ✅ | 🔥 Media | ⚪ |
| 16 | Key-Doctor | `/key-doctor` | ✅ | 🔥 Nicho | ⚪ |
| 17 | List-Mixer | `/list-mixer` | ✅ | 🔥 Baja | ⚪ |
| 18 | Aspect-Ratio | `/aspect-ratio` | ✅ | 🔥 Media | ⚪ |
| 19 | Subtitles-Bolt | `/subtitles-bolt` | ✅ | 🔥 Baja | ⚪ |
| 20 | XML-JSON | `/xml-json` | ✅ | 🔥 Nicho | ⚪ |
| 21 | Binary-Flow | `/binary-flow` | ✅ | 🔥 Baja | ⚪ |
| 22 | UUID-Generator | `/uuid-generator` | ✅ | 🔥 Nicho | ⚪ |
| 23 | UnitFlow | `/unitflow` | ✅ | 🔥 Alta (copada) | ⚪ |
| 24 | Morse-Flow | `/morse-flow` | ✅ | 🔥 Baja | ⚪ |
| 25 | Whois-Bolt | `/whois-bolt` | ❌ API | 🔥 Baja | ⚪ |

**Leyenda de Prioridad:** 🟢 Alta (hacer primero) · 🟡 Media (segundo bloque) · 🔵 Normal (tercer bloque) · ⚪ Baja (cuando haya tiempo)
### 1. ~~Optimizador y Minificador de Código SVG (Svg-Optimizer)~~ 📐 ✅ IMPLEMENTADO
* **Ruta:** `/svg-optimizer`
* **Descripción:** Limpia código SVG redundante generado por Adobe Illustrator o Figma para reducir el peso y mejorar el rendimiento web.
* **Público/Demanda:** Desarrolladores front-end e ilustradores digitales.
* **Implementación:** DOMParser + XMLSerializer local. 9 opciones de optimización, previsualización visual, exportación a React/Data URI.

### 2. Creador Rápido de Gráficos (Graph-Flow) 📊 ✅ IMPLEMENTADO
* **Ruta planeada:** `/graph-flow`
* **Descripción:** Sube un archivo CSV de datos y genera automáticamente hermosos gráficos de barras, líneas o circulares listos para exportar en PDF/PNG.
* **Público/Demanda:** Estudiantes, analistas de datos y creadores de presentaciones ejecutivas.
* **Estrategia/Viabilidad:** Motor Canvas2D propio sin dependencias externas, soporta 7 tipos de gráficos.

### 3. Codificador y Decodificador de URL (Url-Bolt) 🌐
* **Ruta planeada:** `/url-bolt`
* **Descripción:** Convierte caracteres especiales de una URL a formato codificado o decodificado para corregir errores de enlace, y desglosa los parámetros URL de consulta.
* **Público/Demanda:** SEOs, mercadólogos de enlaces de afiliados y programadores.
* **Estrategia/Viabilidad:** Funciones nativas de JavaScript (`encodeURIComponent`).

### 4. Codificador/Decodificador Base64 e Imágenes (Base64-Bolt) 🔠
* **Ruta planeada:** `/base64-bolt`
* **Descripción:** Codifica texto a formato Base64 o convierte imágenes directamente a cadenas de texto DataURL Base64 para embeber en código CSS/HTML.
* **Público/Demanda:** Desarrolladores web y administradores de correos HTML.
* **Estrategia/Viabilidad:** Métodos nativos de JS para codificación binaria en cliente.

### 5. Extractor de Paleta de Colores desde Imágenes (ColorSnap) 🎨
* **Ruta planeada:** `/colorsnap`
* **Descripción:** Sube cualquier fotografía y extrae automáticamente los colores dominantes y paletas armoniosas asociadas con sus códigos HEX y RGB.
* **Público/Demanda:** Diseñadores gráficos, ilustradores y creadores de marcas corporativas.
* **Estrategia/Viabilidad:** Lógica en cliente analizando los píxeles de un Canvas.

### 6. Formateador y Validador SQL (SQL-Flow) 🛢️
* **Ruta planeada:** `/sql-flow`
* **Descripción:** Embellece y formatea consultas SQL complejas para mejorar su lectura, con soporte para múltiples dialectos de base de datos.
* **Público/Demanda:** Administradores de bases de datos (DBAs) y programadores back-end.
* **Estrategia/Viabilidad:** Minificadores y formateadores de texto locales.

### 7. Generador de Contraseñas Seguras y Test de Fuerza (PassBolt) 🔑
* **Ruta planeada:** `/passbolt`
* **Descripción:** Generador instantáneo de contraseñas robustas y análisis de entropía para medir el tiempo estimado que tardaría una IA en descifrarla.
* **Público/Demanda:** Usuarios promedio preocupados por su ciberseguridad.
* **Estrategia/Viabilidad:** API Crypto local. Competencia alta pero útil para el tráfico diario.

### 8. Conversor de Marcador de Tiempo Unix Epoch (Epoch-Flow) ⏰
* **Ruta planeada:** `/epoch-flow`
* **Descripción:** Conversor bidireccional entre marcas de tiempo Unix Epoch (números de 10 dígitos) y fechas legibles por seres humanos en múltiples zonas horarias.
* **Público/Demanda:** Desarrolladores que depuran bases de datos y registros de servidores.
* **Estrategia/Viabilidad:** Lógica de fechas simple de JS.

### 9. Limpiador y Desinfectador de Código HTML (Html-Sanitizer) 🧹
* **Ruta planeada:** `/html-sanitizer`
* **Descripción:** Limpia código HTML mal formateado o con estilos excesivos eliminando etiquetas no deseadas, scripts maliciosos y dejando solo estructura básica limpia.
* **Público/Demanda:** Desarrolladores web e integradores de gestores de contenido (CMS).
* **Estrategia/Viabilidad:** Parseo local del árbol DOM.

### 10. Generador y Traductor Visual de Expresiones Cron (Cron-Flow) 📅
* **Ruta planeada:** `/cron-flow`
* **Descripción:** Diseñador interactivo que traduce expresiones enigmáticas de Cron (ej. `*/5 * * * *`) a lenguaje natural explicativo e indica las próximas ejecuciones.
* **Público/Demanda:** Programadores de sistemas y DevOps.
* **Estrategia/Viabilidad:** Librerías JS de traducción a texto natural (cronstrue).

### 11. Conversor de Zonas Horarias Interactivo (Time-Bolt) 🗺️
* **Ruta planeada:** `/time-bolt`
* **Descripción:** Agenda reuniones visualizando la superposición de horarios laborales entre diferentes países y ciudades del mundo sin equivocaciones.
* **Público/Demanda:** Trabajadores remotos de equipos globales y agencias de marketing digital.
* **Estrategia/Viabilidad:** Uso de las API de internacionalización nativas del navegador (Intl).

### 12. Prueba de Dispositivos de Comunicación (Device-Test) 🎙️
* **Ruta planeada:** `/device-test`
* **Descripción:** Comprueba que tu webcam, micrófono, auriculares o la sensibilidad del ratón funcionan de manera óptima sin instalar software externo.
* **Público/Demanda:** Teletrabajadores, participantes frecuentes de videoconferencias.
* **Estrategia/Viabilidad:** APIs multimedia básicas del navegador.

### 13. Generador de Marcadores de Posición Lorem Ipsum (Lorem-Flow) ✍️
* **Ruta planeada:** `/lorem-flow`
* **Descripción:** Generador de texto de relleno Lorem Ipsum personalizado por cantidad de párrafos, palabras u oraciones, con posibilidad de insertar marcadores de imagen temporales.
* **Público/Demanda:** Diseñadores editoriales y maquetadores web.
* **Estrategia/Viabilidad:** Generación algorítmica sencilla de textos.

### 14. Conversor Interactivo de Formato de Colores (Hex-to-RGB) 🌈
* **Ruta planeada:** `/hex-to-rgb`
* **Descripción:** Conversor inmediato entre códigos de color HEX, RGB, HSL, CMYK y CSS, con ajuste de opacidad y contraste.
* **Público/Demanda:** Diseñadores y desarrolladores web.
* **Estrategia/Viabilidad:** Fórmulas matemáticas sencillas de color en JS.

### 15. Pizarra Virtual de Notas Estilo Kanban Simple (Whiteboard-Flow) 📌
* **Ruta planeada:** `/whiteboard-flow`
* **Descripción:** Un panel organizador de notas adhesivas virtuales para arrastrar y soltar tareas cotidianas al estilo Kanban de forma rápida.
* **Público/Demanda:** Personas buscando métodos sencillos de organización personal.
* **Estrategia/Viabilidad:** React Drag and Drop y almacenamiento local de datos persistentes (`localStorage`).

### 16. Lector de Eventos de Teclado JavaScript (Key-Doctor) ⌨️
* **Ruta planeada:** `/key-doctor`
* **Descripción:** Presiona cualquier tecla para detectar y mostrar los códigos de eventos exactos de Javascript (`event.key`, `event.code` y `event.keyCode`).
* **Público/Demanda:** Desarrolladores front-end depurando interacciones web.
* **Estrategia/Viabilidad:** 100% local a través de listeners de teclado.

### 17. Ordenador y Mezclador de Listas de Texto (List-Mixer) 🔀
* **Ruta planeada:** `/list-mixer`
* **Descripción:** Ordena listas de texto alfabéticamente, inviértelas, elimina líneas vacías o duplicados, y aleatoriza la lista con un clic.
* **Público/Demanda:** Gestores de bases de datos, escritores de contenido y organizadores de sorteos.
* **Estrategia/Viabilidad:** Manipulación básica de arrays en JavaScript.

### 18. Calculadora de Relación de Aspecto (Aspect-Ratio) 📐
* **Ruta planeada:** `/aspect-ratio`
* **Descripción:** Calcula proporciones y resoluciones proporcionales correspondientes a relaciones populares (16:9, 4:3, 21:9) de forma bidireccional.
* **Público/Demanda:** Editores de vídeo, diseñadores gráficos y desarrolladores maquetadores.
* **Estrategia/Viabilidad:** Operaciones aritméticas simples en JS.

### 19. Convertidor de Subtítulos de Vídeo (Subtitles-Bolt) 💬
* **Ruta planeada:** `/subtitles-bolt`
* **Descripción:** Convierte archivos de subtítulos entre formatos populares de texto sincronizado (como SRT, VTT, SBV o ASS).
* **Público/Demanda:** Editores de vídeo y creadores de contenido audiovisual educativo.
* **Estrategia/Viabilidad:** Parsing y reformateo de cadenas de texto de subtítulos en local.

### 20. Conversor Rápido de XML a JSON (Xml-Json) 🔄
* **Ruta planeada:** `/xml-json`
* **Descripción:** Convierte estructuras de datos XML heredadas a JSON moderno estructurado y viceversa de forma instantánea.
* **Público/Demanda:** Programadores de sistemas antiguos y desarrolladores web.
* **Estrategia/Viabilidad:** Parseo y mapeo DOM XML local.

### 21. Conversor de Sistemas de Numeración (Binary-Flow) 🔢
* **Ruta planeada:** `/binary-flow`
* **Descripción:** Traduce números y cadenas de texto plano de manera bidireccional a sistemas binario, hexadecimal, decimal u octal.
* **Público/Demanda:** Estudiantes de informática y entusiastas del hardware.
* **Estrategia/Viabilidad:** Funciones de parsing numérico de JS.

### 22. Generador de UUIDs Aleatorios por Lotes (Uuid-Generator) 🆔
* **Ruta planeada:** `/uuid-generator`
* **Descripción:** Genera de una sola vez hasta miles de identificadores únicos UUID versión 4 o versión 5 listos para copiar.
* **Público/Demanda:** Programadores y arquitectos de bases de datos.
* **Estrategia/Viabilidad:** API criptográfica nativa del navegador.

### 23. Convertidor de Unidades Generales (UnitFlow) 📏
* **Ruta planeada:** `/unitflow`
* **Descripción:** Calculadora rápida para convertir unidades de medida (peso, longitud, velocidad, temperatura y volumen).
* **Público/Demanda:** Estudiantes y cocineros.
* **Estrategia/Viabilidad:** Lógica básica matemática. La competencia es muy alta porque Google integra convertidores en su buscador.

### 24. Codificador y Decodificador de Código Morse (Morse-Flow) 📻
* **Ruta planeada:** `/morse-flow`
* **Descripción:** Escribe texto plano y tradúcelo instantáneamente a código morse y viceversa, con soporte para reproducir el audio de los puntos y rayas.
* **Público/Demanda:** Radioaficionados, aficionados de la electrónica o curiosos.
* **Estrategia/Viabilidad:** Sintetizador de tonos de audio simple en navegador mediante `AudioContext`.

### 25. Consulta Rápida WHOIS y DNS de Dominios (Whois-Bolt) 🔍
* **Ruta planeada:** `/whois-bolt`
* **Descripción:** Herramienta para consultar de forma rápida los servidores DNS activos y el estado WHOIS de registro de cualquier dominio web.
* **Público/Demanda:** Compradores de dominios y profesionales de redes.
* **Estrategia/Viabilidad:** Requiere llamadas a APIs de consulta DNS externas, no se puede hacer 100% en el cliente puro.
* **Por qué está en el último puesto:** Aunque útil, los proveedores de dominios y servicios web ya ofrecen interfaces Whois sofisticadas, lo que hace que captar usuarios interesados en esta web sea difícil.


---

## 🚀 Estrategia para Captar Tráfico y Ganar Dinero

1. **SEO Localizado (Multiidioma):** Al lanzar cada herramienta traducida a los 9 idiomas del sitio (ES, EN, FR, DE, PT, RU, HI, JA, ZH) atacamos mercados de baja competencia donde es sumamente fácil posicionar en el primer puesto de Google (por ejemplo, buscar "compresor de fotos gratis" en portugués o hindi).
2. **Cero Servidor (Serverless):** Al procesar todo en el navegador, tus servidores no sufren cargas y el coste de hosting es **$0 al mes**, garantizando un margen de beneficio del 100% con los anuncios.
3. **Monetización con AdSense / Afiliados:** La variedad de nichos (oficinas, creadores, programadores) permite colocar anuncios muy segmentados y con altas pujas de CPC.
4. **Efecto Ecosistema:** Cuantas más herramientas haya en el hub, más páginas indexa Google, más tráfico orgánico se atrae, y más probabilidades hay de que un usuario descubra otras herramientas y se convierta en recurrente. Cada nueva tool retroalimenta el crecimiento de las demás.
5. **Link Interno Cruzado:** Incluir en el footer o barra lateral de cada herramienta enlaces directos a las demás ("Puede que te interese también...") multiplica el tiempo de sesión del usuario y las páginas vistas por visita (métricas clave para AdSense).
6. **Redes Sociales y Viralidad:** Herramientas como el generador de memes, capturas de código y compresión de imágenes tienen un potencial viral altísimo en Twitter/X, Reddit y TikTok. Incluir botones de "Compartir resultado" directamente en la herramienta.

---

## 📅 Hitos de Desarrollo Sugeridos (Milestones)

### Fase 1 — Impacto Inmediato (Próximas 1-3 herramientas)
- [x] **CompressSnap** (`/compresssnap`) — Compresor de imágenes
- [x] **Background Remover** (`/backgroundremover`) — Eliminar fondos con IA local
- [x] **PDF-Flow** (`/pdf-flow`) — Kit de herramientas PDF

> **Objetivo:** Lanzar las 3 herramientas con mayor volumen de búsquedas y menor coste de servidor. Todas son 100% client-side.

### Fase 2 — Consolidación del Hub (Siguientes 3-5 herramientas)
- [x] **RecordSnap** (`/recordsnap`) — Grabadora de pantalla
- [x] **QR-Bolt** (`/qr-bolt`) — Generador de QR personalizados
- [x] **GIF-Bolt** (`/gif-bolt`) — Creador de GIFs
- [x] **CodeCard** (`/codecard`) — Capturas de código elegantes
- [x] **CropSnap** (`/cropsnap`) — Redimensionador de imágenes

> **Objetivo:** Diversificar los nichos de usuario (desarrolladores, diseñadores, creadores de contenido) para que el hub atraiga tráfico de múltiples orígenes.

### Fase 3 — Herramientas de Nicho (Alto CPC)
- [x] **CSS-Designer** (`/css-designer`) — Generador de efectos CSS
- [x] **JSON-Flow** (`/json-flow`) — Visor/validador de JSON
- [ ] **Regex-Flow** (`/regex-flow`) — Tester de expresiones regulares
- [x] **DiffSnap** (`/diffsnap`) — Comparador de textos

> **Objetivo:** Captar tráfico técnico de desarrolladores que genera CPC muy alto en AdSense (>$1 por clic en mercados anglófonos).

### Fase 4 — Crecimiento Viral
- [x] **SocialBolt** (`/socialbolt`) — Descargador de TikTok/Reels
- [x] **TTS-Bolt** (`/tts-bolt`) — Texto a voz con IA
- [x] **Meme-Bolt** (`/meme-bolt`) — Generador de memes

> **Objetivo:** Herramientas virales que atraen picos masivos de tráfico desde redes sociales.

---

## 💡 Ideas de Marketing y Crecimiento

- **Crear un blog/changelog** en el hub que documente cada nueva herramienta lanzada. Mejora el SEO y da contenido fresco a Google para rastrear.
- **Publicar en Product Hunt** cuando se lance un pack de 3+ herramientas nuevas.
- **Crear hilos en Reddit** (r/webdev, r/design, r/InternetIsBeautiful) mostrando las herramientas.
- **Vídeos cortos en TikTok/YouTube Shorts** demostrando cómo funcionan las herramientas (30 segundos de tutorial visual).
- **Añadir PWA completa** para que los usuarios instalen oLoveTools como app nativa en el escritorio o móvil.