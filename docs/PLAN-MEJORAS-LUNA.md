# Plan de auditoría y mejora de oLoveTools para Luna

Fecha: 13 de septiembre de 2026. Base de código: b3557cf. Alcance: las 62 herramientas, inicio, navegación, identidad, accesibilidad, rendimiento y SEO.
Este documento es un plan de ejecución; no certifica que las 62 herramientas funcionen correctamente.

## 1. Resultado de esta revisión

Se ha inventariado todo el catálogo y sus módulos, leído las descripciones y capacidades de los 62 diccionarios ingleses, contrastado componentes comunes, rutas, SEO, iconos y algunas implementaciones críticas. Se ha ejecutado el comprobador de traducciones y registrado el diagnóstico de Astro por separado en RESULTADOS-AUDITORIA.md.

No se han ejecutado aquí las 62 operaciones de usuario ni validado sus descargas. Tampoco se han medido Core Web Vitals de producción, demanda de búsquedas, conversiones, navegadores móviles reales ni disponibilidad de proveedores. Las comprobaciones funcionales de las fichas de abajo están PENDIENTES. Un build correcto no demuestra que un archivo exportado sea válido ni sustituye el chequeo de tipos.

Muchas herramientas ya tienen workers, cancelación, historial, lotes, exportadores y configuraciones avanzadas. No reconstruirlas ni añadir controles duplicados. Toda propuesta de producto requiere primero localizar su equivalente actual: si existe y funciona, mejorar su descubrimiento o dejarla como verificada.

Los informes anteriores de la conversación exageraron la cobertura: añadir una clase CSS a 47 héroes no fue una revisión visual individual. El lote posterior solo conectó movimiento reducido en CronFlow y SubtitlesBolt. El cambio de favicon no añadió los dibujos que faltaban. Considerar la revisión visual y funcional completa pendiente.

## 2. Hallazgos transversales y tareas prioritarias

| ID | Evidencia y estado | Acción concreta | Aceptación |
|---|---|---|---|
| BASE-01 | package.json tiene dev/start/build/preview, pero no scripts check/test. | Guardar línea base de Astro, build y pruebas existentes. Añadir comandos repetibles cuando se incorporen comprobaciones útiles. | Errores previos separados de regresiones; nunca informar «sin errores de tipos» solo por compilar. |
| ICON-01 | ProjectCard.tsx resuelve IconMap[project.icon] con fallback Box; faltan claves usadas por constants.ts, por ejemplo BarChart3, Database, Clock y KeyRound. | Completar el mapa con símbolos adecuados; verificar todas las claves del catálogo. Revisar cada cabecera contra su tarjeta. | Ninguna herramienta publicada usa un fallback por una clave omitida. Capturas a 16/24/32 px y en tarjeta móvil. |
| ICON-02 | TOOL_FAVICONS carece de entradas para herramientas publicadas; se conserva /icon.svg como fallback. Los data URI SVG tienen ahora MIME correcto. | Inventariar entradas ausentes, crear iconos reconocibles, servir archivos estáticos cacheables cuando proceda y mantener identidad en header/tarjeta/pestaña. | Todos los slugs tienen un recurso existente; legibilidad en tema claro y oscuro y sin recortes. |
| ICON-03 | El apple-touch-icon global se cambió a SVG/data URI; manifest.json solo declara un SVG para any/maskable. | Generar PNG real de Apple 180×180 y recursos 192/512, probar margen de máscara y manifiesto; no asumir compatibilidad iOS por pasar build. | PNG válidos, URLs 200, MIME correcto y prueba de añadir a inicio. |
| COPY-01 | manifest.json promete toda la suite «100% in your browser / no uploads»; appSchema.browserRequirements repite que todo corre en navegador. Hay TTS, consultas DNS y servicios de vídeo remotos. | Clasificar cada herramienta como procesamiento local, consultas remotas o híbrida y ajustar textos al flujo efectivo. Comprobar Network antes de afirmar privacidad. | Copy y schema describen los datos que realmente salen. No usar README antiguos como prueba de rutas activas. |
| SEO-01 | seo.ts dice que FAQ y HowTo generan rich snippets. Google retiró HowTo y restringió FAQ; los comentarios no prueban elegibilidad. | Corregir expectativas; inspeccionar JSON-LD renderizado y posibles duplicados entre página Astro y componentes React. Mantener FAQs útiles al usuario. | Schema único y coherente con contenido visible; sin ratings inventados ni promesas de resultados enriquecidos. |
| MOTION-01 | .tool-hero-art usa animation-fill-mode: both con transform final; puede prevalecer sobre transform de hover. will-change queda permanente. motion.ts pide no animar la primera pintura del héroe. | Resolver el conflicto con una estrategia única, quitar promoción permanente innecesaria y comprobar la entrada/hover en navegador. | Primer contenido visible, hover observable cuando corresponda, sin salto al finalizar. |
| MOTION-02 | Ocultar elementos animate/animateTransform por CSS no es una validación de que SMIL se detenga. Hay distintos mecanismos entre herramientas. | Probar cada escena en movimiento normal/reducido; para SMIL usar render condicional o control efectivo y una composición estática completa. No ocultar el dibujo que da contexto. | Comparar varios instantes del ciclo; movimiento reducido quieto con resultado legible. Pausa fuera de pantalla si aporta ahorro medido. |
| I18N-01 | El script detecta 404 incidencias, incluidas marcas y tecnicismos válidos. ja/zh omiten visitsGlobalForms.one, categoría que esos idiomas no necesitan habitualmente. | Revisar falsos positivos, pluralización real, términos sin traducir y SEO localizado; usar Intl.PluralRules para evaluar cobertura. | Sin claves visibles ni frases inglesas accidentales; no traducir código ni exigir categorías de plural innecesarias. |
| DATA-01 | /api/stats cuenta visitas por slug. No se ha localizado un embudo de operaciones completadas. | Medir inicio/éxito/error/exportación/siguiente herramienta con eventos mínimos y compatibles con preferencias del usuario; definir retención. | Solo slug, operación, estado, duración agregada y código de error; jamás texto, archivos, tokens, contraseñas o URLs introducidas. |
| UX-01 | Hay herramientas potentes con muchas opciones y héroes grandes. Es una hipótesis de fricción, no un fallo medido. | Comparar tiempo hasta primer resultado; mostrar acción principal, ejemplo y ajustes básicos; agrupar avanzados sin eliminarlos. | Una tarea habitual se completa sin aprender todos los controles. Teclado, zoom 200% y 360 px utilizables. |

Archivos transversales: src/constants.ts; src/components/ProjectCard.tsx; src/components/Home.tsx; src/components/chrome/UnifiedHeader.tsx; src/styles/global.css; src/components/shared/motion.ts; src/lib/seo.ts; src/pages/[lang]/[tool]/index.astro; src/pages/[lang]/index.astro; src/config/related-tools.ts; src/config/tool-ctas.ts; public/manifest.json.

## 3. Orden de ejecución y alcance por lote

Prioridad orientativa por utilidad y riesgo, no por volumen de búsquedas medido. S = cambio localizado, M = varios componentes, L = multimedia/API/memoria o varias salidas. Son tamaños relativos, no horas ni presupuesto garantizado.

| Lote | Alcance | Tamaño | Dependencia / cierre |
|---|---|---|---|
| L00 | Línea base, catálogo, casos de prueba y registro de fallos. | M | Primero. No mezclar reparaciones masivas de tipos con funcionalidades. |
| L01 | ICON-01/02/03, COPY-01, SEO-01, i18n relevante. | M | L00; separar identidad y copy en commits revisables. |
| L02 | Inicio/buscador, flujo básico/avanzado, revisión de animaciones y accesibilidad. | M | L00; revisar héroes de cinco en cinco, no aplicar un efecto genérico y cerrar el lote. |
| L03 | FormatFlow, CompressSnap, PasteSnap, CropSnap, Aspect Ratio. | M/L | L00; priorizar salida válida, orientación y tamaños. |
| L04 | Background Remover, CleanSnap, EXIFClear, WatermarkSnap. | L | L03 útil; nunca prometer eliminación perfecta ni pérdida cero sin comprobarla. |
| L05 | PDF, ZIP, FaviconBolt, QRBolt, QR Reader. | L | L00; seguridad del resultado y lectura real de archivos/QR. |
| L06 | JSON, XML, Base64, URL, HTML Sanitizer, Regex, DiffSnap. | M/L | L00; casos de parser y bloqueo antes de más opciones. |
| L07 | Hash, JWT, UUID, Entropy, Binary, SQL. | M/L | L00; exactitud e inputs sensibles. |
| L08 | FrameSnap, FrameBolt, GIFBolt, Lottie Viewer. | L | L00; dividir por herramienta, exportaciones costosas. |
| L09 | RecordSnap, AudioSnap, TTSBolt, SubtitlesBolt, MorseFlow. | L | L00; dispositivos/proveedores separados de lógica local. |
| L10 | Clipy, Klipy, TwitchBolt, KickBolt, ClipFlow, SocialBolt. | L | L00; red real + fallos simulados; una plataforma por sublote. |
| L11 | CSS Designer, ColorSnap, Hex to RGB, CodeCard, DrawSnap, MemeBolt, GraphFlow. | M/L | L00; fuente/exportación y accesibilidad cromática. |
| L12 | WordFlow, Markdown Live, ListMixer, LoremFlow, WhiteboardFlow. | M | L00; persistencia, formato y edición. |
| L13 | UnitFlow, EpochFlow, TimeBolt, CronFlow, Device Test, Key Doctor, WhoisBolt. | M/L | L00; zonas horarias, precisión y permisos. |
| L14 | SEO por intención, enlazado contextual, instrumentación mínima y rendimiento medido. | M | Funcionalidad validada; puede iniciar medición antes, contenido después de comprobar promesas. |

No ejecutar cada lote L entero en una sola sesión. Trabajar en una herramienta compleja o dos/tres pequeñas por sesión, con archivos y criterios explícitos. Si aparecen problemas de pérdida de datos/exportación, pasan delante de extras estéticos.

## 4. Matriz de las 62 herramientas

Estado inicial de todas las fichas: inventario revisado, operación real pendiente. «Actual» se basa en código/módulos y capacidades declaradas, no garantiza implementación sin defectos.
Para cada slug, empezar en src/tools/<slug>/, su archivo raíz .tsx, lib/ o services/, components/ y src/locales/en/<slug>.ts + es. Consultar otros idiomas solo para cambios de copy. Aplicar también las pruebas comunes de la sección 5.

Las mejoras de la columna final son propuestas: confirmar antes si ya están presentes. La consulta SEO es una intención candidata para la página existente, sin volumen validado y sin crear páginas duplicadas automáticamente.

### Imágenes, documentos y archivos

| # / slug | Actual a conservar | Prueba funcional específica | Mejora evaluable / intención SEO |
|---|---|---|---|
| 01 formatflow | Lotes, formatos, presupuesto de tamaño, calidad SSIM, workers. | HEIC girado, PNG con alfa, TIFF multipágina y salida cuyo MIME/extensión/bytes coincidan; probar códec no disponible y cancelación. | Resumen visible de formatos de entrada/salida reales, receta reutilizable para un lote y explicación de raster→SVG. Intención: convertir HEIC a JPG / imagen a WebP. |
| 02 compresssnap | Compresión por calidad o presupuesto, resize, paleta PNG, SSIM. | Objetivo 100 KB posible/imposible, imagen ya pequeña, transparencia, lote mixto con error aislado. | Explicar por qué no cabe el objetivo y ofrecer reducir dimensiones con consentimiento; presets de destino reutilizables. Intención: comprimir imagen a 100 KB. |
| 03 pastesnap | Portapapeles, galería y formatos de exportación. | Ctrl+V con varias imágenes/texto, permiso rechazado, SVG, descarga individual y ZIP. | Alternativa pegar/arrastrar clara y nombrado de capturas por plantilla. Intención: guardar imagen del portapapeles. |
| 04 cropsnap | Crop, rotación, proporciones, exportación a resolución original. | Rotación EXIF y manual, bordes, relación bloqueada y resultado exacto 1080×1080. | Guardar encuadres habituales y guías de zona segura sobre vista previa. Intención: recortar imagen a tamaño exacto. |
| 05 aspect-ratio | Cálculo proporcional, múltiplos de códec, preview y exportación. | 1920×1080→16:9, dimensiones cero/fraccionarias, cover/contain y redondeo a múltiplos. | Comparador entre formatos con área conservada y envío a CropSnap. Intención: calcular relación de aspecto 9:16. |
| 06 backgroundremover | IA local, carga de modelo, retoque y exportación. | Primera descarga del modelo/offline, pelo, alfa, imagen grande, cancelar y volver a iniciar. | Perfiles producto/retrato con parámetros reales del motor; antes/después y fondos de comprobación. Intención: quitar fondo a foto de producto. |
| 07 cleansnap | Máscara, inpainting local, progreso cancelable. | Máscara vacía, selección al borde, zona mayor que textura disponible, undo y export sin alterar zonas intactas. | Ayuda sobre tamaño del pincel y selección contextual, intensidad/pases solo si motor lo admite; comparación con original. Intención: borrar objeto de una foto. |
| 08 exif-clear | Inspección y borrado selectivo de metadatos sin reencode. | GPS/EXIF/XMP/IPTC en cada contenedor; reabrir salida y verificar píxeles y tags; conservar orientación al quitar EXIF. | Presets privacidad total/conservar autoría y reporte descargable de eliminación. Intención: quitar GPS de fotos sin perder calidad. |
| 09 watermark-snap | Capas, texto/logo, lote, mosaico, nueve anclajes y formatos. | Imágenes retrato/paisaje mezcladas, márgenes relativos, transparencia y correspondencia de preview/export. | Receta exportable de marca y preview sobre dos tamaños antes del lote. Intención: poner marca de agua a varias fotos. |
| 10 pdf-flow | Unir, dividir, organizar, comprimir, imagen/PDF, vista, marcas/números y extracción de texto. | PDF protegido/corrupto, selección fuera de rango, orden/páginas giradas, fuentes no latinas y salida reabierta; compresión de PDF con texto seleccionable. | Exponer modos ya existentes que el SEO no menciona, preview del resultado y avisar pérdidas concretas por modo. Intención: ordenar páginas PDF / PDF a JPG. |
| 11 zip-flow | Crear/abrir ZIP, carpetas, preview, compresión por archivo y worker. | Unicode, rutas repetidas, CRC erróneo, ZIP protegido, cancelación y archivos con alto tamaño descomprimido; respetar presupuesto de memoria. | Resumen de espacio antes de extraer y política visible para nombres duplicados. Intención: abrir ZIP online sin subir archivos. |
| 12 favicon-bolt | Logo/texto/emoji, ICO multiresolución, SVG, Apple, Android y manifest. | Leer dimensiones y contenido de cada entrada ICO; ZIP completo; máscara y emoji en distintos SO. | Vista a 16/32 px y fondos claro/oscuro; export de etiquetas head con rutas coherentes. Intención: generar favicon ICO y Apple Touch Icon. |

### Vídeo, audio y plataformas

| # / slug | Actual a conservar | Prueba funcional específica | Mejora evaluable / intención SEO |
|---|---|---|---|
| 13 framesnap | Captura exacta, FPS medido, lotes y detección de escenas. | Vídeo CFR/VFR, seek al final, pasos repetidos y fotograma solicitado vs exportado. | Panel de confianza de FPS y galería de escenas con selección para lote. Intención: sacar un fotograma de un vídeo. |
| 14 framebolt | Extracción de rango, paso, filtro de repetidos/negros y ZIP en streaming. | Rango y paso extremos, vídeo largo, cancelar ZIP a mitad y verificar archivo terminado con lector externo. | Estimar número de imágenes/espacio antes de iniciar y explicar límites del navegador. Intención: extraer todos los fotogramas a ZIP. |
| 15 gif-bolt | Frames editables, paleta global, dithering, compresión entre frames. | Transparencia, tiempos variables, loop, orden y lectura del GIF exportado con otro reproductor. | Preview de tamaño/calidad y preset ligero para web; presupuesto orientativo con resultado real. Intención: convertir vídeo a GIF pequeño. |
| 16 lottie-viewer | .lottie/.tgs/.json, recolor, compatibilidad y exportaciones. | Fuentes/imágenes externas ausentes, JSON inválido, rangos de export, alfa y duraciones. | Resumen de recursos faltantes y perfil de export con comparación de primer/último frame. Intención: previsualizar y convertir Lottie a WebM. |
| 17 recordsnap | Pantalla/cámara/ambos, bitrate, cámara superpuesta. | Permiso denegado, compartir sin audio, fin desde UI del navegador, pausa/reanudar y parada de tracks al salir. | Comprobación previa audio/cámara y estimación de tamaño; temporizador si falta. Intención: grabar pantalla con cámara y audio. |
| 18 audiosnap | Micrófono/archivo, waveform, trim, normalización y WAV/comprimido. | Mono/estéreo, sample rate, trim de pocos ms, nivel tras normalizar y decodificación del archivo final. | Medidor de clipping y presets de voz; fundidos de entrada/salida si no están. Intención: cortar y normalizar audio. |
| 19 tts-bolt | Voces por párrafo, MP3/WAV, subtítulos alineados; proveedor remoto. | Voz retirada, texto largo por bloques, cancelación, 429/timeout, orden de audio y tiempos SRT. | Estimar duración, preview corto y reintentar solo bloque fallido; mostrar envío de texto al servicio. Intención: texto a voz con subtítulos. |
| 20 subtitles-bolt | Nueve formatos, corrección, edición, sincronización y QC. | SRT/VTT/ASS con estilos, codificación, tiempos negativos, solapes y drift 23.976↔25; comprobar ida/vuelta y pérdidas. | Vista de cambios antes de aplicar y perfiles QC personalizables/importables. Intención: sincronizar subtítulos / SRT a VTT. |
| 21 morse-flow | Texto/audio, Farnsworth, WAV y decodificación de grabación. | SOS, espaciado de letra/palabra, símbolos no soportados y ruido; tolerancia y confianza del decodificador. | Modo práctica con feedback usando motor actual y presets principiante/rápido. Intención: traductor Morse con audio. |
| 22 clipy | Búsqueda Twitch, filtros, colecciones y reproducción. | Paginación sin repetidos, resultados vacíos, token caducado, selección tras filtrar y persistencia. | Consultas guardadas y acceso visible a colecciones actuales; medir envío a descarga. Intención: buscar clips de Twitch por streamer. |
| 23 klipy | Exploración Kick con componentes compartidos de Clipy. | Normalización de resultados de Kick, categorías vacías, embeds bloqueados y regresión de filtros compartidos. | Explicar disponibilidad de búsqueda por proveedor y recuperar consulta al volver. Intención: buscar clips de Kick. |
| 24 twitchbolt | Descarga de listas de clips Twitch. | URL corta/no válida, clip borrado, mezcla de éxitos/fallos, códec/calidad y ZIP resultante. | Reintentar solo fallidos y plantilla de nombres sin colisiones; resumen por clip. Intención: descargar varios clips de Twitch. |
| 25 kickbolt | Descarga de listas de clips Kick. | CDN/token vencido, URL de otra plataforma, lote parcial y formato real descargado. | Paridad de recuperación de lotes con TwitchBolt, sin duplicar motor compartible. Intención: descargar clips de Kick en lote. |
| 26 clip-flow | Cortes Twitch VOD/directo, timeline, MP4 y unión con FFmpeg. | Segmentos discontinuos, corte fuera de keyframe, audio/vídeo sincronizados, token expirado y memoria al concatenar. | Aclarar corte rápido vs preciso y consumo estimado; guardar solo marcas/proyecto. Intención: recortar VOD Twitch a MP4. |
| 27 socialbolt | Resolver TikTok/X, vídeo/audio/carrusel y relay de servidor. | URL por plataforma soportada, contenido privado/eliminado, CORS/CDN y bytes MP3/MP4 reales. | Matriz visible de capacidades vigentes, error accionable y reintento de elemento; no anunciar Instagram/YouTube solo porque el detector reconoce dominios. Intención: guardar carrusel TikTok / vídeo X. |

### Desarrollo, datos y utilidades técnicas

| # / slug | Actual a conservar | Prueba funcional específica | Mejora evaluable / intención SEO |
|---|---|---|---|
| 28 json-flow | Parser, árbol, JSONPath, conversiones, schema/types, historial y worker. | Números grandes, claves duplicadas, arrays heterogéneos, BOM, JSONL y fidelidad al convertir CSV/XML. | Panel de pérdidas de conversión y presets de consulta; no prometer soporte completo de dialectos sin pruebas. Intención: validar JSON y convertir a CSV. |
| 29 xml-json | Conversión bidireccional, XPath, atributos y medidor de fidelidad. | Namespaces, contenido mixto, CDATA, entidades, array único/vacío e ida/vuelta. | Presets de convenciones por consumidor y export de configuración. Intención: XML a JSON conservando atributos. |
| 30 base64-bolt | Archivos/texto, URL-safe, padding, wraps, detección por firma, hashes. | Unicode/emoji, binario NUL, padding inválido, data URI y decodificación exacta. | Mensajes de error por posición y perfil de consumidor visible; no añadir funciones ya cubiertas. Intención: decodificar Base64 a archivo. |
| 31 url-bolt | Perfiles de encoding, query editor, tracking y lotes. | + vs %20, % inválido, IDN, claves repetidas, fragmentos y doble encode. | Preview de cambios y lista editable de parámetros a conservar para no romper firmas. Intención: limpiar parámetros de seguimiento de URL. |
| 32 html-sanitizer | DOMPurify/allow-list, presets y reporte con excepciones. | javascript:, handlers, SVG/MathML, atributos URL y reactivación de elementos bloqueados; preview aislado. | Diferenciar excepciones de seguridad de ajustes cosméticos y mostrar política final. Intención: limpiar HTML y quitar scripts. |
| 33 regex-flow | Worker, watchdog, AST, grupos, lint y export a otros lenguajes. | Patrón catastrófico, matches vacíos, Unicode, flags y worker recuperable tras timeout; codegen por dialecto. | Casos de prueba guardables y comparación esperado/obtenido; avisos de dialecto en exports. Intención: probar expresiones regulares con grupos. |
| 34 sql-flow | 19 dialectos, formatter, lint, outline y worker. | Comentarios, strings con ;, CTE, dollar quoting, parámetros y dialecto erróneo. | Perfiles de estilo reutilizables y diff antes/después; aclarar que no ejecuta contra DB. Intención: formatear SQL PostgreSQL/MySQL. |
| 35 hash-bolt | Hashes/HMAC, streaming, lotes y SHA256SUMS. | Vectores conocidos, archivo vacío/grande, BOM, checksum inválido y cancelación. | Verificación visible por archivo y manifiesto reproducible; diferenciar checksum de autenticidad. Intención: verificar SHA256 de archivo. |
| 36 jwt-bolt | Decodificar, verificar, firmar, claims y claves HS/RS/PS/ES. | Firma inválida/algoritmo incorrecto, exp/nbf, aud múltiple, PEM/JWK y token mal formado. | Separar claramente decodificado/verificado y resultado por claim; no persistir secretos. Intención: verificar firma JWT localmente. |
| 37 uuid-generator | UUID varias versiones, ULID, NanoID, ObjectId, inspector y lotes. | Vectores deterministas v3/v5, bits versión/variante, UUIDv7 mismo ms, tamaños de lote y formatos. | Comparador de elección por caso y garantía real de ordenabilidad; perfiles de salida. Intención: generar UUID v7 en lote. |
| 38 entropy-bolt | Password/passphrase y entropía local con análisis de patrones. | crypto.getRandomValues, sesgo de selección, exclusiones, longitud y fórmulas; nada sensible en logs/storage. | Presets por restricciones de sitios y mostrar supuestos del cálculo, sin presentar estimación de fuerza como certeza. Intención: generador de contraseñas y frases seguras. |
| 39 binary-flow | Bases 2–36, BigInt, complemento a dos, IEEE754, bitwise y encodings. | Límites de 8/64 bits, negativos, NaN/Infinity, fracciones y UTF-8 multibyte. | Pasos didácticos de agrupación de bits y representación firmada/sin signo. Intención: convertir binario hexadecimal y complemento a dos. |
| 40 cron-flow | Expresiones, zonas, calendario, plataformas y export. | DST primavera/otoño, combinación día/semana, expresión imposible y dialectos 5/6/7 campos. | Comparación de dos expresiones y alertas de frecuencia inesperada antes de exportar. Intención: comprobar cron con zona horaria. |
| 41 epoch-flow | s/ms/µs/ns, BigInt, zonas y épocas alternativas. | Antes de 1970, precisión nanosegundos, detección ambigua de unidad, DST y serial Excel 1900. | Distinguir unidad inferida de elegida y formato copiable con precisión declarada. Intención: convertir timestamp milisegundos a fecha. |
| 42 time-bolt | Zonas, horario laboral, cambios de hora y calendario ICS. | Reunión cruzando medianoche, DST y apertura ICS en otro calendario. | Enlace compartible solo de zonas/fecha y búsqueda de franja común si falta. Intención: organizar reunión entre zonas horarias. |
| 43 unitflow | Aritmética racional, familias, entrada libre, lotes y resultados compuestos. | °C/°F, temperaturas absolutas vs diferencias, MiB/MB, consumo inverso y coma decimal. | Favoritos de pares y explicación de precisión/redondeo; unidades incompatibles con error claro. Intención: convertir unidades exactas y MiB a MB. |
| 44 whois-bolt | UI actual de DNS-over-HTTPS, tipos de registro y comparación de resolvers; endpoint WHOIS aparte no demuestra uso actual. | NXDOMAIN vs respuesta vacía, CAA/SVCB, IDN, timeout y PTR IPv4. | Alinear nombre/SEO a DNS Lookup; valorar RDAP/WHOIS solo como extensión separada con proveedor y alcance verificados. Intención: consultar DNS y propagación. |
| 45 device-test | Cámara, micrófono, altavoz, pantalla, teclado y puntero. | Permisos denegados, hotplug, capacidades no disponibles y liberación de tracks; no emitir audio inesperado. | Asistente de diagnóstico previo a reunión y export de informe sin identificadores sensibles. Intención: probar cámara y micrófono online. |
| 46 key-doctor | ANSI/ISO/JIS, eventos de tecla, rollover/repetición y reportes. | Atajos reservados, key/code según layout, foco perdido y teclas aparentemente atascadas. | Recorrido guiado con cobertura de teclas y explicación de limitaciones del navegador. Intención: test de teclado y teclas atascadas. |

### Diseño, contenido y productividad

| # / slug | Actual a conservar | Prueba funcional específica | Mejora evaluable / intención SEO |
|---|---|---|---|
| 47 css-designer | Sombras, gradientes, glass, radios/filtros, import y varios exports. | CSS pegado no soportado, alpha/color moderno, múltiples sombras y equivalencia preview/código. | Presets con explicación y aviso de compatibilidad basado en capacidades; guardar recetas si falta. Intención: generador box-shadow / gradientes CSS. |
| 48 colorsnap | OKLab, clustering, eyedropper, contraste y exportadores. | Imagen monocroma/alfa, tamaño del muestreo, consistencia de paleta y export CSS/Tailwind. | Bloquear colores durante extracción y mostrar porcentaje real de cada color. Intención: extraer paleta de colores de imagen. |
| 49 hex-to-rgb | CSS moderno, espacios de color, armonías, rampas, contraste y simulación. | Colores fuera de gamut, alpha, ida/vuelta HEX/RGB y límites de contraste calculado. | Aviso de gamut y comparación perceptual de conversión; diferenciar estimaciones CMYK sin perfil de impresión. Intención: HEX a RGB/OKLCH. |
| 50 codecard | Temas, fondos, resaltado, líneas, settings y export. | Fuente sin cargar, código largo/Unicode, overflow, selección de líneas y PNG de alta densidad. | Presets de publicación y preview de ancho móvil; verificar texto antes de export. Intención: crear imagen de código. |
| 51 drawsnap | Dibujo con presión, trazado, persistencia, PNG/SVG. | Lápiz/touch/mouse, zoom, undo, abrir proyecto y SVG verdaderamente vectorial. | Guías/ajuste a formas o estabilizador solo si faltan; reducir complejidad del trazado con preview. Intención: dibujar online y vectorizar imagen. |
| 52 meme-bolt | Plantillas, texto ajustable, stickers, undo y export 4×. | Emoji, fuente tardía, texto largo, imágenes grandes y contorno/export sin cortes. | Presets sociales y plantilla personal reutilizable; no importar catálogos externos sin necesidad. Intención: crear meme con imagen propia. |
| 53 graph-flow | CSV, edición, varios gráficos y PNG/SVG. | Delimitadores/decimales, null vs cero, negativos, etiquetas largas y gráfico vacío; verificar PDF si algún texto lo anuncia. | Import asistido con selección de columnas y tabla accesible; ajuste de escalas/rango si falta. Intención: crear gráfico desde CSV. |
| 54 wordflow | Conteo, legibilidad, transformaciones, DOCX e historial. | CJK, apóstrofes, emojis, texto vacío, fórmulas por idioma y extracción DOCX. | Mostrar qué métricas son válidas en cada idioma y objetivos de longitud por publicación. Intención: contador de palabras y caracteres. |
| 55 markdown-live | Preview, tablas/listas/notas/código y MD/HTML/PDF. | HTML incrustado, enlaces peligrosos, tablas grandes, scroll y PDF con saltos/fuentes. | Plantillas de README/documento y estilos de impresión con preview real. Intención: editor Markdown con export PDF. |
| 56 list-mixer | Pipeline de 19 operaciones, conjuntos, CSV/JSON/SQL y worker. | Duplicados con acentos/mayúsculas, vacíos, locale, orden de pasos y shuffle con semilla. | Recetas importables y vista de cambios por paso; recordar configuración sin guardar datos sensibles por defecto. Intención: eliminar duplicados y ordenar listas. |
| 57 lorem-flow | Varios idiomas/corpus, unidades y longitud exacta, semilla y exports. | Conteo exacto vs unidades Unicode, repetibilidad y etiquetas HTML equilibradas. | Presets de UI (tarjeta/formulario/artículo) y selector claro de cómo se cuentan caracteres. Intención: generar texto de relleno en español. |
| 58 whiteboard-flow | Notas, conectores, lanes, undo, persistencia y exports. | Gestos touch, conectores al mover, recarga, import JSON mal formado y encuadre de export. | Plantillas de flujo/retrospectiva y copias locales de proyecto; no colaboración multiusuario como primera inversión. Intención: pizarra online sin registro. |
| 59 qr-bolt | QR personalizados, logos, estilos y comprobación de lectura. | Payload largo/Unicode, quiet zone, logo grande, bajo contraste; leer PNG/SVG rasterizado con lector independiente. | Indicador de legibilidad antes de descargar y preset impresión/tamaño físico si falta. Intención: QR con logo que se pueda escanear. |
| 60 qr-reader | Cámara/imagen/clipboard, parser e inspección segura del destino. | QR rotado/pequeño, cámara denegada, Wi-Fi/vCard/texto y URL confusable; no abrir automáticamente. | Galería de resultados de lote o varios QR si motor lo permite y copia por campo. Intención: leer QR desde captura de pantalla. |
| 61 svg-optimizer | Optimización, limpieza, reparación y worker. | IDs referenciados, masks/gradients, viewBox, texto/fuentes, SVG externo y preview aislado. | Diff visual y perfiles conservador/agresivo con desglose de ahorro; advertir cambios visibles. Intención: reducir tamaño SVG sin perder calidad. |
| 62 diffsnap | Comparación alineada, palabras, opciones de espacios, contexto, patch e historial. | CRLF/LF, Unicode, inserción al inicio/final, archivo vacío y aplicar el patch exportado para reconstruir exactamente la revisión. | Presets de comparación y navegación por cambios; distinguir diferencias ignoradas de igualdad literal. Intención: comparar dos textos y exportar diff. |

## 5. Protocolo para comprobar si cada herramienta funciona

Cada ficha tendrá un registro con: commit, navegador, entrada reproducible, configuración, resultado esperado, resultado obtenido, descarga verificada y estado. Estados permitidos: pendiente / pasa / falla / bloqueada por entorno. «No vi errores» y «compila» no equivalen a pasa.

1. Carga inicial con consola limpia de errores nuevos, idioma ES/EN, input vacío y ejemplo.
2. Operación habitual con entrada conocida y resultado comprobable por un segundo lector o vector de referencia.
3. Entrada inválida, límites y archivo corrupto; error accionable, sin spinner infinito.
4. Cancelar, reiniciar, repetir, deshacer/rehacer cuando aplique; no reutilizar resultados viejos tras cambiar configuración.
5. En lotes: elemento válido + inválido, nombres repetidos, orden, progreso y resultado parcial.
6. Descargar y reabrir. Verificar dimensiones, MIME, firma de archivo, duración/páginas/contenido según herramienta.
7. Escritorio 1440 px y móvil 360/390 px, zoom 200%, teclado y foco. Diálogos, overlays, controles y botón export accesibles.
8. Chromium para barrido automatizado; Firefox y Safari reales para APIs críticas y muestras de cada familia. Sin dispositivo disponible: marcar pendiente.
9. Inspeccionar Network: procesamiento local sin envío de contenido; herramientas remotas con timeout, error y explicación.
10. Comparar memoria antes/después de varios ciclos de archivos grandes y salida de la herramienta. Liberar tracks, object URLs, workers y buffers cuando corresponda.
11. Revisar animación a inicio, mitad, final y reinicio del ciclo; después en movimiento reducido. No sacar conclusiones de una sola captura.
12. Render SEO: title, description, canonical, hreflang recíproco, H1 visible, enlaces y schema. Comprobar el HTML inicial, no solo DOM hidratado.

Fixtures sintéticos y pequeños versionables: PNG alfa/EXIF JPEG; CSV con comillas/acentos; JSON con entero grande; XML con namespace; PDF de tres páginas; ZIP con nombres Unicode; clip corto CFR y VFR; WAV estéreo conocido; SRT con solape; QR Unicode. Añadir archivos grandes solo localmente y documentar cómo reproducirlos; no subirlos al repositorio.

Automatizar cálculos/parsers/exportaciones deterministas y un flujo crítico por herramienta. Pruebas visuales dirigidas para CSS; evitar tests que solo comprueben que existe una clase. No instalar cinco frameworks: elegir un runner pequeño compatible con la base real.

## 6. SEO y crecimiento: hacer visible la utilidad real

### SEO técnico (primero)

- Auditar las 62×9 rutas de herramienta generadas (558) más hubs y legales. Catálogo y generación de rutas deben coincidir.
- Mantener canonical por idioma, barra final consistente, x-default y hreflang recíproco. Ya hay implementación: comprobar HTML/sitemap antes de tocarla.
- Verificar títulos/descripciones propios, una jerarquía H1/H2 coherente, etiquetas traducidas y OG real por herramienta. Medir duplicados, no imponer longitud como regla rígida de ranking.
- Revisar diferencias entre descripción antigua de tarjeta y funcionalidad actual; ejemplo PDF tiene más modos que su descripción inicial.
- Favicon de marca para Google: Google lo define por hostname, no uno por ruta de herramienta. Los iconos individuales sí ayudan en pestañas; no prometer 62 favicons distintos en resultados de Google.
- FAQ/HowTo: contenido útil y veraz; no invertir en schema esperando snippets que Google no ofrece para este caso.
- Priorizar render inicial del contenido e interacción; medir efecto de fuentes, publicidad y carga de herramientas pesadas. No cambiar todos los client:load a client:visible sin comprobar que el editor sigue listo cuando se necesita.

### Intenciones y contenido (después de validar capacidades)

- Usar las intenciones candidatas de la matriz en H1, subtítulos, ejemplos y enlaces existentes de forma natural.
- Separar claramente productos próximos: FrameSnap = captura precisa; FrameBolt = extracción masiva; FormatFlow = conversión; CompressSnap = tamaño/peso; CropSnap = edición; Aspect Ratio = cálculo/encuadre.
- No crear centenares de URLs «keyword + formato» con la misma interfaz. Añadir guías o landings solo si resuelven un flujo diferente con contenido y ejemplo propios.
- Revisar enlaces contextuales de tool-ctas y related-tools: existe mucho enlace a herramientas de desarrollo genéricas. Elegir 2–4 siguientes pasos útiles, no más enlaces por sistema.
- Proponer recorridos: foto→recortar→comprimir→marca; vídeo→fotogramas→GIF; JSON→CSV→gráfico; texto→TTS→subtítulos; imagen→paleta→CSS.
- Transferir resultados mediante el handoff ya existente; no obligar a descargar y volver a subir si el flujo local ya puede continuar.
- Añadir sección breve de límites reales y ejemplo utilizable. Configuración básica por defecto y avanzada bajo demanda.
- Priorizar ES/EN al experimentar, pero cualquier cambio de interfaz publicado debe mantener coherencia y fallback en los nueve idiomas.

### Medición y decisiones

Sin Search Console ni embudo real, no hay base para prometer más tráfico o priorizar por demanda exacta. Primera medición: consulta/landing, dispositivo, inicio de operación, éxito, exportación, siguiente herramienta y retorno agregado.

Indicadores: tasa resultado correcto/inicios; tiempo hasta resultado; errores por operación; exportaciones por visita; clic al siguiente paso; impresiones/CTR/posición por consulta y país. No optimizar solo visitas ni tiempo en página (más tiempo puede significar dificultad).

Objetivos técnicos de referencia de campo p75: LCP ≤2,5 s, INP ≤200 ms, CLS ≤0,1. Una ejecución de Lighthouse no acredita los datos de campo. Registrar baseline, cambio y tendencia; revisar crecimiento tras una ventana con tráfico suficiente, por ejemplo 28 días, sin programar automáticamente tareas.

## 7. Entrega obligatoria de Luna por sublote

- Máximo una herramienta compleja o dos/tres pequeñas; cerrar todos sus pasos antes de ampliar.
- Resumen de 5–10 líneas: problema real, cambio, pruebas, límites pendientes, commit.
- Registro por herramienta actualizado. Sin evidencia, estado pendiente.
- Diff limitado a componentes/engine afectados y traducciones necesarias.
- Un commit por cambio coherente. No incluir fixtures grandes, logs, credenciales ni archivos del usuario.
- Build de producción antes de subir; comprobación de tipos comparada contra baseline; si hay fallos previos, identificar que siguen presentes, no ocultarlos.
- Push según autorización de la conversación. No forzar push ni sobrescribir trabajo ajeno.
- Parar la implementación de una propuesta si ya existe y pasa; registrar «ya disponible». Si depende de API paga o nuevo servicio, preparar alternativa y coste antes de comprometerlo.
- Las ideas L y nuevas plataformas no se añaden incidentalmente durante una corrección visual.

## 8. Fuentes consultadas para este plan

- Google, favicon por sitio y requisitos de rastreo: https://developers.google.com/search/docs/appearance/favicon-in-search
- Google, cambios en resultados FAQ y HowTo: https://developers.google.com/search/blog/2023/08/howto-faq-changes
- web.dev, métricas y medición de Web Vitals: https://web.dev/articles/vitals
- web.dev, umbrales y percentiles: https://web.dev/articles/defining-core-web-vitals-thresholds

Las fuentes orientan SEO/rendimiento; no demuestran demanda de palabras clave ni funcionamiento de oLoveTools. Los hallazgos de código se refieren a los archivos citados y la base indicada.

