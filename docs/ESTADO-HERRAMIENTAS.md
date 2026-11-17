# Estado de ejecución

Base: b3557cf. Fecha inicial: 2026-09-13.

Este registro comienza con las 62 herramientas pendientes de prueba funcional. Inventario documental no equivale a aprobado. Al cerrar un sublote, sustituir el estado y añadir evidencia verificable.

## Transversal

| Tarea | Estado | Evidencia / siguiente paso |
|---|---|---|
| Inventario y plan | Hecho | 62 fichas; cobertura cotejada con src/tools. |
| Astro check inicial | Pasa | 1536 archivos, 0 errors, 0 warnings, 247 hints. |
| Traducciones | Revisar | 404 incidencias heurísticas; ver RESULTADOS-AUDITORIA.md. |
| ICON-01 | Hecho | Se añadieron las 23 claves de lucide que faltaban en ProjectCard; comprobación catálogo→IconMap: 0 fallbacks. |
| ICON-02/03 | Pendiente | 27 favicons ausentes y recursos de instalación por validar. |
| Copy/SEO global | Pendiente | Promesas locales vs flujos remotos. |
| Animaciones | Pendiente | Validación visual por escena y modo reducido. |
| Embudo / rendimiento | Pendiente | Sin datos de campo en esta auditoría. |

## L01 — iconos de tarjetas

Comprobación: se compararon todas las claves `icon` de `src/constants.ts` con `IconMap` de `src/components/ProjectCard.tsx`. El mapa ya cubre las 47 claves usadas por el catálogo y conserva `Box` solo como fallback defensivo. Pendiente comprobar visualmente las 62 tarjetas en escritorio, móvil, tema oscuro y contraste.

## Herramientas

| Slug | Estado funcional | Hallazgo/cambio | Prueba y evidencia | Commit |
|---|---|---|---|---|
| aspect-ratio | Rediseño completo (16 nov) | Calculadora clásica arriba (W1×H1 → proporción con nombre; nuevo ancho ↔ alto), botones 16:9/9:16/4:3/1:1/4:5/3:2/21:9/2.39:1, vista previa, tamaños con la misma proporción, opciones avanzadas plegadas (denominador, múltiplo, código CSS/Tailwind/FFmpeg). Convertir imagen a otra proporción (lee la imagen al soltarla, recortar o bandas, % recortado, descarga, siguiente herramienta). Tabla de tamaños por red social (botón Usar). SEO nuevo en 9 idiomas (cómo se calcula, ejemplo, 4 secciones, tabla de proporciones, 9 FAQ). | Build de producción servido con workerd: 1920×1080 → 16:9, 3440×1440 → 43:18 monitor ultrapanorámico, 1998×1080 → 1.85:1, 4:3 con alto 1080 → 1440, botón 9:16, fila Instagram 4:5; imagen 1920×1080 a 9:16 → 68,4 % recortado. Móvil y escritorio revisados. | — |
| audiosnap | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| backgroundremover | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| base64-bolt | Validación parcial | El motor trabaja sobre `Uint8Array`, admite Base64 estándar/URL-safe, padding opcional, saltos MIME y prefijos `data:`; la descarga Blob conserva la URL durante 60 s. | Harness determinista: 128 tamaños binarios (0–127 bytes), ambos alfabetos y padding sí/no, round-trip exacto; vectores `Man`, UTF-8, URL-safe y data URL; entradas inválidas (`A`, `abcde`, caracteres extraños) devuelven errores/avisos sin lanzar. Pendiente: cargar archivos reales desde la interfaz, comprobar preview truncada, descarga completa y archivos binarios en Chromium/Firefox/Safari. | Pendiente |
| binary-flow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| cleansnap | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| clip-flow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| clipy | Pasa (flujo principal) | La búsqueda de categorías ya no oculta los fallos de Twitch como una lista vacía; se muestra un error recuperable. Las consultas sin coincidencias muestran una salida clara para volver a categorías populares. Al reintentar, el aviso anterior se limpia. | Navegador local: búsqueda real de «Valorant», carga de clips, filtros y más de una página de resultados; consulta inexistente; guardar un clip y panel de guardados. La descarga TXT dispara un enlace Blob local, pero el navegador de automatización no expuso el evento de descarga para inspeccionar el archivo. Pendiente: probar en Chromium/Firefox/Safari el TXT descargado, reproductor flotante, paginación profunda, token caducado y envío a TwitchBolt. | Pendiente |
| codecard | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| colorsnap | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| compresssnap | Validación parcial | Sanitiza dimensiones restauradas y valores no finitos; los límites se aplican con una sola escala y las descargas Blob insertan el ancla en el documento para compatibilidad entre navegadores. | Pruebas deterministas de `targetSize` a 50 % y 100 %, revisión estática y `tsc --noEmit`/`git diff --check`. Pendiente prueba manual de archivos grandes, transparencia y descargas en Chromium/Firefox/Safari. | Pendiente |
| cron-flow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| cropsnap | pasa (lógica) | `renderCrop` limita marcos persistidos a los límites del canvas y sustituye valores no finitos; incluso un recorte en `x=1` se desplaza al último píxel válido. | Prueba determinista del borde derecho, `npx tsc --noEmit`; `git diff --check`. Pendiente prueba manual con rotación EXIF, 1080×1080 y ZIP. | L03 |
| css-designer | Validación parcial | La exportación PNG interpola los gradientes HSL en HSL real, en lugar de tratarlos como OKLCH; esto alinea el PNG con la vista previa CSS. | Revisión de serialización, gradientes, filtros y exportación; `tsc --noEmit` y `git diff --check` sin diagnósticos. Pendiente probar PNG generado en tamaños 1x/2x/4x, fondos fotográficos y formatos de código desde la interfaz. | Pendiente |
| device-test | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| diffsnap | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| drawsnap | Validación parcial | La elipse se exporta con el centro y radios correctos: el editor guarda la esquina opuesta del rectángulo y Canvas2D necesita semianchos, evitando figuras el doble de grandes. | Revisión de dibujo, selección, imágenes, SVG/PNG y liberación de recursos; `tsc --noEmit` y `git diff --check` sin diagnósticos. Pendiente probar lienzo real con trazos, elipses, imágenes y descargas PNG/SVG. | Pendiente |
| entropy-bolt | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| epoch-flow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| exif-clear | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| favicon-bolt | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| formatflow | Validación parcial | Valida HEIC/TIFF antes del pipeline y las descargas individuales usan un ancla insertada en el documento, compatible con Firefox/Safari cuando el resultado es un Blob. | `tsc --noEmit` y `git diff --check`; revisión estática de normalización HEIC/TIFF, nombres, lotes y ZIP. Pendiente muestra real HEIC, TIFF multipágina, códec no disponible y descargas en navegadores. | Pendiente |
| framebolt | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| framesnap | Pasa (lógica de exportación) | La URL temporal del fotograma se revocaba en el mismo ciclo del clic, lo que podía cancelar una descarga en Safari. Se conserva 60 s y luego se libera. | Revisión de lectura, avance de fotogramas, lotes, escenas, memoria y descarga; `npx tsc --noEmit` y `git diff --check` sin diagnósticos. Pendiente: subir un vídeo CFR/VFR (requiere seleccionar archivo local), comparar pasos repetidos y abrir PNG/JPEG/WebP descargados. | Pendiente |
| gif-bolt | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| graph-flow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| hash-bolt | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| hex-to-rgb | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| html-sanitizer | Mejora (17 nov) | Preset nuevo por defecto «Limpiar HTML» (Word / Google Docs): convierte negrita/cursiva de estilos en strong/em, quita estilos, clases, span/font vacíos, envoltorio de Docs, nbsp, párrafos vacíos y <p> dentro de <li>. Pegar con formato usa el text/html del portapapeles y limpia al momento. Ejemplo «Pegado de Google Docs». H1 y herramienta arriba, cabecera de una fila, fuera la lista de keywords. SEO nuevo en 9 idiomas. | Build de producción con workerd: pegado simulado de Google Docs, ejemplo de Docs y de CMS/Word con salida limpia, ejemplo XSS con Limpiar y Estricto sin restos peligrosos. Sin probar: pegado real desde Word de escritorio. | — |
| json-flow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| jwt-bolt | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| key-doctor | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| kickbolt | Validación parcial | Al reiniciar o iniciar una nueva tanda, las respuestas tardías no repueblan resultados; además, las URI de segmentos HLS se resuelven con `new URL`, admitiendo rutas absolutas, relativas y root-relative. | Inspección de rutas, relés, lote, cancelación de ZIP, errores y playlist HLS; `tsc --noEmit` y `git diff --check` sin diagnósticos. Pendiente comprobar URL pública, lote parcial y ZIP en navegador limpio. | Pendiente |
| klipy | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| list-mixer | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| lorem-flow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| lottie-viewer | Rediseño (17 nov) | H1 y herramienta arriba, cabecera de una fila. Al soltar se reproduce directo (sin paso intermedio); soltar en cualquier parte de la página y botón «Abrir otro». Varios archivos → galería con todas reproduciéndose (fondo claro/oscuro, pausa) y clic para abrir. Abrir desde URL y `?url=` que reproduce al entrar + botón «Compartir enlace». Avisos de reglas de Telegram para .tgs (512×512, 30/60 fps, ≤3 s). SEO nuevo en 9 idiomas (guía, formatos, 4 secciones, 9 FAQ). | Build de producción con workerd: .json único, .tgs que incumple (3 avisos) y que cumple, 4 archivos → galería y clic, URL del mismo origen, URL inválida con mensaje, `?url=`. Móvil y escritorio. Sin probar: una URL real de LottieFiles (depende de su CORS). | — |
| markdown-live | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| meme-bolt | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| morse-flow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| pastesnap | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| pdf-flow | Validación parcial | La rotación global de organizar páginas ahora es acumulativa: conserva las rotaciones individuales y aplica el giro solicitado sobre cada página. | Revisión del flujo de rangos, selección, reordenación, eliminación, exportación y liberación de URLs; `tsc --noEmit` y `git diff --check` sin diagnósticos. Pendiente validar con PDFs reales las operaciones merge/split/organize, miniaturas, compresión, extracción de texto y descargas. | Pendiente |
| qr-bolt | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| qr-reader | Rediseño completo (16 nov) | Motor nuevo ZXing (WebAssembly, servido desde nuestro dominio) + BarcodeDetector nativo: QR, Micro QR, Data Matrix, Aztec, PDF417 y códigos de barras (EAN/UPC/ISBN, Code 128/39/93, ITF, DataBar); varios códigos por imagen con recuadros numerados. Fuentes: cámara a pantalla completa (zoom, linterna, cambiar cámara, vibración, pitido opcional, modo varios códigos), foto/captura, PDF (hasta 20 páginas), pantalla (getDisplayMedia, solo escritorio), Ctrl+V y texto. Móvil: cámara arriba y sin scroll; si ya dio permiso, se abre sola una vez por pestaña. Historial local (localStorage, desactivable, CSV). Acciones por tipo: WiFi (copiar contraseña, QR para compartir), producto/libro (buscar), contacto (.vcf), evento (.ics), mapa, llamar, SMS, correo. SEO nuevo en 9 idiomas (H1, guía, secciones, 9 FAQ, `seo_title_exact`). | Build de producción servido con workerd: 10 archivos de prueba leídos (QR WiFi con acentos, URL, punycode, EAN-13, ISBN, Code 128, Data Matrix vCard, 3 códigos en una imagen, foto girada y desenfocada, invertido, PDF en página 2), cámara simulada con canvas (lectura única y modo varios códigos) y pantalla simulada. Sin probar: cámara física de un móvil real (el panel bloquea la cámara). | Probar en un móvil real |
| recordsnap | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| regex-flow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| socialbolt | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| sql-flow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| subtitles-bolt | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| svg-optimizer | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| time-bolt | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| tts-bolt | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| twitchbolt | Validación parcial | Al reiniciar o iniciar otra lista, las respuestas tardías no restauran clips descartados; la descarga reconoce también el `DOMException` de aborto para no continuar probando relés tras cancelar. | Interfaz y copy de relés cargados en navegador local; revisión de URLs, deduplicación, relés, calidad, ZIP, marca de agua y cancelación; `tsc --noEmit` y `git diff --check` sin diagnósticos. Pendiente: URL pública, mezcla de éxitos/fallos, descarga individual, ZIP y cancelación en navegador limpio. | Pendiente |
| unitflow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| url-bolt | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| uuid-generator | Validación parcial | Corregido el desbordamiento repetido del contador v7/ULID y ampliada a 60 s la vida de la URL Blob de las exportaciones grandes. | Por tipo: lotes de 100.000 y 10.000 tras retrasar el reloj; orden estricto, sin duplicados; revisión de descarga TXT/CSV/JSON/SQL; `tsc --noEmit` y `git diff --check` sin diagnósticos. Pendiente: vectores v3/v5 y exportaciones desde interfaz en navegadores. | Pendiente |
| watermark-snap | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| whiteboard-flow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| whois-bolt | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| wordflow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| xml-json | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| zip-flow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
