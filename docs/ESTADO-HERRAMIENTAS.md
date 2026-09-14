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
| aspect-ratio | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| audiosnap | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| backgroundremover | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| base64-bolt | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| binary-flow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| cleansnap | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| clip-flow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| clipy | Pasa (flujo principal) | La búsqueda de categorías ya no oculta los fallos de Twitch como una lista vacía; se muestra un error recuperable. Las consultas sin coincidencias muestran una salida clara para volver a categorías populares. | Navegador local: búsqueda real de «Valorant», carga de clips, filtros y más de una página de resultados; consulta inexistente; guardar un clip y panel de guardados. La descarga TXT dispara un enlace Blob local, pero el navegador de automatización no expuso el evento de descarga para inspeccionar el archivo. Pendiente: probar en Chromium/Firefox/Safari el TXT descargado, reproductor flotante, paginación profunda, token caducado y envío a TwitchBolt. | Pendiente |
| codecard | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| colorsnap | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| compresssnap | pasa (lógica) | Sanitiza dimensiones restauradas y valores no finitos antes de calcular el tamaño; evita `NaN` y reservas inválidas en configuraciones antiguas o automatizadas. | `npx tsc --noEmit`; revisión estática de `targetSize`. Pendiente prueba manual de archivos grandes, transparencia y descarga en Chromium/Firefox/Safari. | L03 |
| cron-flow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| cropsnap | pasa (lógica) | `renderCrop` limita marcos persistidos a los límites del canvas y sustituye valores no finitos; evita rectángulos negativos o fuera de rango al exportar. | `npx tsc --noEmit`; `git diff --check`; revisión estática de render y exportación. Pendiente prueba manual con rotación EXIF, 1080×1080 y ZIP. | L03 |
| css-designer | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| device-test | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| diffsnap | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| drawsnap | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| entropy-bolt | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| epoch-flow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| exif-clear | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| favicon-bolt | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| formatflow | pasa (lógica) | Valida el resultado de HEIC y las dimensiones/píxeles TIFF antes de entregarlos al pipeline; los archivos dañados producen errores accionables de decodificación. | `npx tsc --noEmit`; `git diff --check`; revisión estática de normalización HEIC/TIFF. Pendiente muestra real HEIC, TIFF multipágina y códec no disponible. | L03 |
| framebolt | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| framesnap | Pasa (lógica de exportación) | La URL temporal del fotograma se revocaba en el mismo ciclo del clic, lo que podía cancelar una descarga en Safari. Se conserva 60 s y luego se libera. | Revisión de lectura, avance de fotogramas, lotes, escenas, memoria y descarga; `npx tsc --noEmit` y `git diff --check` sin diagnósticos. Pendiente: subir un vídeo CFR/VFR (requiere seleccionar archivo local), comparar pasos repetidos y abrir PNG/JPEG/WebP descargados. | Pendiente |
| gif-bolt | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| graph-flow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| hash-bolt | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| hex-to-rgb | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| html-sanitizer | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| json-flow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| jwt-bolt | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| key-doctor | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| kickbolt | Pasa (lógica de solicitudes) | Al reiniciar o iniciar una nueva tanda, las respuestas tardías de la tanda anterior ya no pueden repoblar los resultados. | Inspección del flujo de rutas, relés, lote, cancelación de ZIP y errores. `npx tsc --noEmit` sin diagnósticos. La isla no hidrató en el servidor de desarrollo tras una reconstrucción concurrente de Astro, así que sigue pendiente comprobar el flujo completo de una URL pública, el lote parcial y el ZIP en un navegador limpio. | Pendiente |
| klipy | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| list-mixer | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| lorem-flow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| lottie-viewer | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| markdown-live | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| meme-bolt | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| morse-flow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| pastesnap | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| pdf-flow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| qr-bolt | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| qr-reader | Pasa (texto y análisis local) | Al exportar una MeCard se generaba un archivo `.vcf` cuyo contenido seguía siendo MeCard. Ahora se convierte en un vCard 3.0 válido; los vCard originales se conservan sin cambios. | Navegador local: se analizaron un enlace HTTP con IP, credenciales y ejecutable (cuatro avisos visibles y sin navegación automática), y un vCard con campos de contacto. El botón de descarga vCard ejecuta el flujo local; el navegador de automatización no expuso el evento Blob para abrir el archivo. `npx tsc --noEmit` sin diagnósticos. Pendiente: foto QR real, cámara con permiso explícito, MeCard descargada en un lector de contactos y portapapeles. | Pendiente |
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
| uuid-generator | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| watermark-snap | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| whiteboard-flow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| whois-bolt | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| wordflow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| xml-json | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
| zip-flow | Pendiente | Ver ficha del plan | Sin ejecución registrada | — |
