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
| aspect-ratio | Validación parcial | Encuadre y exportación conservan la proporción exacta y múltiplos; las combinaciones imposibles se bloquean con aviso. | Regresión 100×60, 16:9, múltiplo 16: sin solución; múltiplo 1: 96×54. Casos horizontales, verticales y decimales. Navegador: PNG/JPEG/WebP generados con paintFrame y decodificados a 96×54. Pendiente: flujo completo del editor, vídeo y gestos. | Pendiente |
| audiosnap | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| backgroundremover | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| base64-bolt | Validación parcial | El motor trabaja sobre `Uint8Array`, admite Base64 estándar/URL-safe, padding opcional, saltos MIME y prefijos `data:`; la descarga Blob conserva la URL durante 60 s. | Harness determinista: 128 tamaños binarios (0–127 bytes), ambos alfabetos y padding sí/no, round-trip exacto; vectores `Man`, UTF-8, URL-safe y data URL; entradas inválidas (`A`, `abcde`, caracteres extraños) devuelven errores/avisos sin lanzar. Pendiente: cargar archivos reales desde la interfaz, comprobar preview truncada, descarga completa y archivos binarios en Chromium/Firefox/Safari. | Pendiente |
| binary-flow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| cleansnap | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| clip-flow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| clipy | Pasa (flujo principal) | La búsqueda de categorías ya no oculta los fallos de Twitch como una lista vacía; se muestra un error recuperable. Las consultas sin coincidencias muestran una salida clara para volver a categorías populares. Al reintentar, el aviso anterior se limpia. | Navegador local: búsqueda real de «Valorant», carga de clips, filtros y más de una página de resultados; consulta inexistente; guardar un clip y panel de guardados. La descarga TXT dispara un enlace Blob local, pero el navegador de automatización no expuso el evento de descarga para inspeccionar el archivo. Pendiente: probar en Chromium/Firefox/Safari el TXT descargado, reproductor flotante, paginación profunda, token caducado y envío a TwitchBolt. | Pendiente |
| codecard | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| colorsnap | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| compresssnap | pasa (lógica) | Sanitiza dimensiones restauradas y valores no finitos; los límites de lado y píxeles se aplican con una sola escala para no deformar panorámicas. | Pruebas deterministas de `targetSize` a 50 % y 100 %, `npx tsc --noEmit` y revisión estática. Pendiente prueba manual de archivos grandes, transparencia y descarga en Chromium/Firefox/Safari. | L03 |
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
| html-sanitizer | Validación parcial | La descarga HTML/TXT inserta temporalmente el ancla Blob en el documento para evitar que Firefox o Safari ignoren el clic programático. | Revisión de DOMPurify, políticas de esquemas, estilos, `srcset` y reporte de eliminaciones; `tsc --noEmit` y `git diff --check` sin diagnósticos. Pendiente ejecutar muestras XSS reales en navegador, probar overrides y abrir los archivos descargados. | Pendiente |
| json-flow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| jwt-bolt | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| key-doctor | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| kickbolt | Pasa (lógica de solicitudes) | Al reiniciar o iniciar una nueva tanda, las respuestas tardías de la tanda anterior ya no pueden repoblar los resultados. | Inspección del flujo de rutas, relés, lote, cancelación de ZIP y errores. `npx tsc --noEmit` sin diagnósticos. La isla no hidrató en el servidor de desarrollo tras una reconstrucción concurrente de Astro, así que sigue pendiente comprobar el flujo completo de una URL pública, el lote parcial y el ZIP en un navegador limpio. | Pendiente |
| klipy | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| list-mixer | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| lorem-flow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| lottie-viewer | Validación parcial | Optimización conserva bm e índices. Exportación espera la carga, utiliza el lienzo correcto y redibuja fotogramas estáticos. Libera pistas WebM. | Navegador con lottie-web real: PNG opaco e idéntico antes/después de optimizar una mezcla de capas; ZIP abierto y dos PNG decodificados sin quedar vacíos. Pendiente: interfaz completa, assets externos, TGS, WebM y dotLottie. | Pendiente |
| markdown-live | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| meme-bolt | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| morse-flow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| pastesnap | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| pdf-flow | Validación parcial | La rotación global de organizar páginas ahora es acumulativa: conserva las rotaciones individuales y aplica el giro solicitado sobre cada página. | Revisión del flujo de rangos, selección, reordenación, eliminación, exportación y liberación de URLs; `tsc --noEmit` y `git diff --check` sin diagnósticos. Pendiente validar con PDFs reales las operaciones merge/split/organize, miniaturas, compresión, extracción de texto y descargas. | Pendiente |
| qr-bolt | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| qr-reader | Pasa (texto y análisis local) | Al exportar una MeCard se generaba un archivo `.vcf` cuyo contenido seguía siendo MeCard. Ahora se convierte en vCard 3.0 con `VERSION`, `N`, `FN` y `ADR` estructurado, conservando comas escapadas en el nombre; los vCard originales se conservan sin cambios. | Navegador local: se analizaron un enlace HTTP con IP, credenciales y ejecutable (cuatro avisos visibles y sin navegación automática), y un vCard con campos de contacto. Pruebas deterministas de conversión MeCard. El navegador de automatización no expuso el evento Blob para abrir el archivo. `npx tsc --noEmit` sin diagnósticos. Pendiente: foto QR real, cámara con permiso explícito, MeCard descargada en un lector de contactos y portapapeles. | Pendiente |
| recordsnap | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| regex-flow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| socialbolt | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| sql-flow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| subtitles-bolt | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| svg-optimizer | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| time-bolt | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| tts-bolt | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| twitchbolt | Pasa (lógica de solicitudes) | Al reiniciar o iniciar otra lista, las respuestas tardías de la anterior ya no restauran clips descartados. La identidad de lote ignora resultados obsoletos del relé. | Interfaz y copy de relés cargados en navegador local; se verificó que la isla no pudo hidratar tras reconstrucciones concurrentes de Astro, aunque su módulo Vite responde. Revisión de URLs, deduplicación, relés, calidad, ZIP y marca de agua; `npx tsc --noEmit` sin diagnósticos. Pendiente: resolver una URL pública, mezcla de éxitos/fallos, descarga individual, ZIP y cancelación en un navegador limpio. | Pendiente |
| unitflow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| url-bolt | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| uuid-generator | Validación parcial | Corregido el desbordamiento repetido del contador v7/ULID incluso con reloj retrasado. | Por tipo: lote de 100.000 y otro de 10.000 tras retrasar el reloj; orden estricto, sin duplicados; versión/variante v7. Pendiente: vectores v3/v5 y exportaciones desde interfaz. | Pendiente |
| watermark-snap | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| whiteboard-flow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| whois-bolt | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| wordflow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| xml-json | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| zip-flow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
