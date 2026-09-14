# Resultados de la revisión inicial

Fecha: 2026-09-13. Código de partida: b3557cf.
Alcance: inventario y análisis estático transversal; no certificación funcional de todas las herramientas.

## Comprobaciones ejecutadas

| Comprobación | Resultado | Interpretación |
|---|---|---|
| Directorios src/tools y proyectos de constants.ts | 62 herramientas | El plan tiene una ficha por slug. |
| Astro check | 1536 archivos; 0 errors, 0 warnings, 247 hints | Resultado final del comprobador. Algunos hints se muestran individualmente como warning ts(...), pero la categoría final es hints. |
| Traducciones | 404 incidencias heurísticas; 0 archivos ausentes/no parseables | No equivale a 404 fallos visibles; requiere revisión de falsos positivos. |
| Correspondencia catálogo→IconMap | 28 herramientas caían a Box en la base auditada; corregido en el lote L01 | Se añadieron las 23 claves ausentes y la comprobación posterior da 0 fallbacks para las claves del catálogo. Falta validación visual. |
| Correspondencia catálogo→TOOL_FAVICONS | 27 herramientas sin entrada | Usan favicon genérico. |
| Git antes del trabajo | Limpio | Esta entrega solo añade documentos. |
| Pruebas de operaciones y descarga en las 62 herramientas | No ejecutadas | Todas pendientes en el registro por herramienta. |
| Revisión visual completa, Safari/Firefox, Lighthouse y métricas de campo | No ejecutadas | No declarar aprobadas. |
| Search Console, volumen de keywords, conversión e ingresos | No disponibles en esta revisión | Prioridades de crecimiento son hipótesis. |

Astro check se ejecutó con ASTRO_TELEMETRY_DISABLED=1 mediante node_modules/.bin/astro.cmd check.
El primer intento aislado falló leyendo dependencias por permisos; se descartó como evidencia del producto. La repetición autorizada fuera del aislamiento completó el análisis. No confundir esos fallos de entorno con defectos de la web.

No se ha repetido npm run build en esta entrega documental: no se ha cambiado código del producto. Los builds previos de la conversación no cuentan como validación de operaciones.

## Ejecución: Clipy (14 de septiembre)

- Se verificó en navegador una búsqueda de categoría real (`Valorant`), la carga de clips, filtros, guardado local y panel de clips guardados.
- Se reprodujo una búsqueda sin coincidencias. Antes no había una salida visible; ahora se muestra un mensaje localizado y un botón para volver a explorar categorías populares.
- Se corrigió el origen de un fallo de diagnóstico: `searchTwitchCategories` devolvía una lista vacía ante cualquier error de red/API. Ahora propaga el error a Clipy, que muestra el aviso recuperable ya existente.
- La exportación TXT se ejecuta en cliente mediante `Blob` y URL temporal. El navegador de automatización no notificó el evento de descarga, por lo que queda pendiente abrir el archivo descargado en navegadores de usuario antes de certificar su contenido.
- `npx tsc --noEmit` terminó sin diagnósticos. El build de Astro fue iniciado con la telemetría desactivada, pero el ejecutor no devolvió el cierre completo tras la fase de entrypoints; no se usa como evidencia de éxito final.

## Ejecución: KickBolt (14 de septiembre)

- Se revisó el flujo de entrada, resolución por lotes, relés, descargas individuales y ZIP. La herramienta muestra que Kick requiere un relé y permite desactivar los relés públicos.
- Se evitó una carrera al reiniciar: antes una respuesta de `fetchClipInfo` que llegase tarde podía repoblar resultados ya descartados. Cada tanda tiene ahora una identidad; las respuestas obsoletas se ignoran.
- Pendiente: repetir con un navegador de desarrollo limpio una URL pública de Kick, lote con éxito parcial, cancelación de ZIP y abrir los MP4/ZIP generados. Durante la prueba, una reconstrucción concurrente de Astro dejó la isla sin hidratar; no se toma como fallo certificado de KickBolt ni como prueba funcional válida.

## Ejecución: QR Reader (14 de septiembre)

- Se verificó en navegador el análisis local de un enlace de prueba con HTTP, dirección IP, credenciales incrustadas y un ejecutable. Se mostraron los cuatro avisos correspondientes y no hubo navegación automática.
- También se comprobó un vCard de prueba: se desglosan nombre, teléfono y correo, y se ofrece la descarga de contacto.
- Se corrigió la exportación de MeCard: antes se descargaba el texto `MECARD:` con extensión `.vcf`; ahora se crea un vCard 3.0 válido a partir de sus campos. Los vCard que el QR ya traía se descargan sin modificación.
- El botón de descarga usa `Blob` local. La automatización no recibió su evento de descarga, por lo que queda pendiente abrir el archivo final en un cliente de contactos. También quedan pendientes una foto QR real, la cámara (requiere permiso explícito) y el portapapeles del navegador.
- `npx tsc --noEmit` terminó sin diagnósticos.

## Iconos: omisiones comprobadas

Estado tras L01: las omisiones de `IconMap` están corregidas en `src/components/ProjectCard.tsx`. La lista siguiente conserva la evidencia histórica de la base `b3557cf`; no la uses como estado actual.

Sin favicon propio (27):
drawsnap, diffsnap, base64-bolt, uuid-generator, list-mixer, html-sanitizer, colorsnap, hex-to-rgb, aspect-ratio, unitflow, sql-flow, cron-flow, xml-json, binary-flow, morse-flow, epoch-flow, time-bolt, device-test, lorem-flow, key-doctor, whiteboard-flow, subtitles-bolt, entropy-bolt, whois-bolt, framesnap, cleansnap, klipy.

Tarjeta con fallback Box por clave ausente (28):
hash-bolt, regex-flow, lottie-viewer, svg-optimizer, graph-flow, url-bolt, base64-bolt, uuid-generator, list-mixer, html-sanitizer, aspect-ratio, unitflow, sql-flow, cron-flow, xml-json, binary-flow, morse-flow, epoch-flow, time-bolt, device-test, lorem-flow, key-doctor, whiteboard-flow, subtitles-bolt, entropy-bolt, whois-bolt, jwt-bolt, qr-reader.

Comprobación: contrastar el icon de cada entrada de MOCK_PROJECTS con IconMap de ProjectCard.tsx; contrastar sus slugs con TOOL_FAVICONS. No se ha inferido cobertura por existencia de icon.svg.

## Traducciones

Comando: node scripts/check-translations.mjs

| Idioma | Archivos faltantes | Claves faltantes | Sobrantes | Iguales al inglés |
|---|---:|---:|---:|---:|
| es | 0 | 0 | 0 | 59 |
| fr | 0 | 0 | 0 | 107 |
| de | 0 | 0 | 0 | 104 |
| pt | 0 | 0 | 0 | 71 |
| ru | 0 | 0 | 2 | 17 |
| hi | 0 | 0 | 0 | 13 |
| ja | 0 | 1 | 0 | 16 |
| zh | 0 | 1 | 0 | 15 |

Los dos casos de claves faltantes son hub.visitsGlobalForms.one en ja y zh. La UI usa Intl.PluralRules con fallback other; comprobar categorías reales antes de declararlo defecto. WEBP, Tailwind, nombres de marca y formatos de impresión pueden ser coincidencias válidas.

## Hallazgos que requieren validación en ejecución

- La regla de transform de la animación raíz puede anular el hover: el análisis de cascada lo indica, falta observar la interacción.
- display:none sobre elementos SMIL no se acepta como prueba de movimiento reducido efectivo.
- apple-touch-icon SVG/data URI requiere corregir recursos/validar compatibilidad; el cambio anterior no demostró instalación en iOS.
- El schema universal y el manifiesto prometen ejecución totalmente local pese a servicios remotos. Auditar cada flujo en Network para corregir copy con precisión.
- El endpoint /api/convert y README de FormatFlow no demuestran que la UI actual lo invoque: la búsqueda actual no halló /api/convert ni tryServerConversion en src/tools/formatflow. No etiquetar esa herramienta como subida remota sin trazar su implementación actual.
- WhoisBolt usa actualmente DNS-over-HTTPS desde su UI; no asumir WHOIS real por el nombre ni por existir un endpoint de servidor.
- Canonical/hreflang/sitemap y schemas ya están implementados; no reconstruirlos sin detectar un fallo en HTML o despliegue.

## Archivos consultados principales

src/constants.ts; src/components/ProjectCard.tsx; src/components/Home.tsx; src/styles/global.css; src/components/shared/motion.ts; src/lib/seo.ts; src/pages/[lang]/[tool]/index.astro; src/pages/[lang]/index.astro; astro.config.mjs; public/robots.txt; public/manifest.json; package.json; scripts/check-translations.mjs.

Catálogo completo: src/tools/* y src/locales/en/*.ts. Inspecciones adicionales de parsers, workers, recorder, DNS, servicios y APIs en los archivos referidos en el plan. Revisar módulos de una herramienta no acredita haber ejecutado todas sus opciones.
