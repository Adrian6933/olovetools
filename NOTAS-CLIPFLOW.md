# Notas de la sesión — ClipFlow

Resumen de las dudas que fueron surgiendo mientras se construía y depuraba ClipFlow, y las decisiones que se tomaron en cada una. Sirve como referencia para no repetir la misma discusión más adelante.

## Resumen de lo construido

- **ClipFlow** (`/clip-flow`): pega un enlace de VOD o canal en directo de Twitch, se genera una línea de tiempo completa (sin el límite de 60s de los clips de Twitch), se pueden marcar varios recortes y descargarlos por separado o unidos en un solo MP4, todo en el navegador salvo un proxy mínimo para esquivar CORS.
- Corrección del bug raíz que impedía cargar VODs: la URL de `usher.ttvnw.tv` estaba mal — el dominio real es `usher.ttvnw.net`. Ese dominio en sí manda cabeceras CORS y se puede pedir directo desde el navegador; solo el CDN de segmentos (CloudFront/S3) necesita pasar por un proxy.
- Soporte para `?t=1h50m36s` en la URL: si pegas un enlace con marca de tiempo, el reproductor salta directamente ahí.
- Arreglado el bug de "el vídeo vuelve al inicio al mover el timeline": `hls.js` podía volver a disparar el evento `MANIFEST_PARSED` en directos que siguen creciendo, y eso reseteaba `video.currentTime` a un valor guardado. Se cambió a que ese ajuste inicial se aplique una sola vez.
- Reproductor con controles propios: play/pausa, avanzar/retroceder 1 o 10 fotogramas, velocidad de reproducción, silenciar, y pantalla completa que incluye tanto el vídeo como la línea de tiempo de recortes (para poder seguir cortando sin salir de fullscreen).
- Atajos de teclado: espacio (play/pausa), flechas (±5s, con Shift = 1 fotograma), F (fullscreen), M (mute), C (añadir corte en el playhead).
- Botón de menú de categorías fijo arriba a la izquierda en la home, visible solo en móvil/tablet (en escritorio ya existe el sidebar fijo). Sustituye a la tarjeta grande "Filtrar por Categoría" que antes ocupaba espacio en el contenido y se perdía al hacer scroll.

## Dudas y decisiones

### ¿El proxy en Node.js o en PHP?

**Duda:** si convenía mover el proxy CORS (`clipflow-proxy.php`, en Hostinger) a Node.js.

**Decisión:** mantener PHP en producción por ahora — ya funciona, está probado de punta a punta, y en Hostinger no requiere configuración especial (solo subir el archivo). Se creó una versión en Node (`server/clipflow-proxy.mjs`, sin dependencias nuevas) para poder probar en local (`npm run proxy`), pensando en si más adelante se sube a Vercel o a un Node App de Hostinger.

**Por qué (rendimiento):** Node es técnicamente más rápido para mucha concurrencia (I/O no bloqueante), pero para el tráfico de este proxy la diferencia es imperceptible. No es el factor decisivo.

**Por qué (futuro backend):** si en algún momento se construye más backend de verdad (no solo un proxy), Node.js es mejor apuesta porque comparte lenguaje con el resto del proyecto (TypeScript/Astro) y tiene un ecosistema (npm) mucho más grande que PHP. En ese caso probablemente convenga un hosting pensado para Node (Vercel, Railway, Render, VPS) en vez de forzarlo en el hosting compartido de Hostinger.

**Pendiente:** decidir si se despliega el proxy Node en Vercel o Hostinger cuando haya más funcionalidad de backend que justifique el cambio. Por ahora sigue en PHP en producción.

> **Actualización (julio 2026):** decisión revertida a petición del propietario — todo el backend PHP se migró a Node. Ahora hay un backend unificado en `server/app.mjs` (proxy CORS + API de Kick + token de Twitch) que en dev se monta dentro del propio dev server de Astro y en producción se ejecuta con `npm run server`, o como Cloudflare Worker (`cloudflare-worker/worker.js`). Los archivos `clipflow-proxy.php` y `public/api/kick.php` fueron eliminados del repo; hay que retirarlos también del `public_html` de Hostinger cuando se despliegue. Ver `server/README.md`.

### ¿Se puede evitar por completo el proxy?

**Duda:** si había alguna forma de que la web funcionara sin ningún proxy.

**Respuesta:** no, para una web (no una extensión de navegador) siempre hace falta algún relé del lado servidor cuando el recurso de destino no manda cabeceras CORS. En este caso, la mayoría de la carga (playlist maestra de `usher.ttvnw.net`, reproducción vía `<video>`/hls.js) no necesita proxy, pero la descarga de segmentos para exportar a MP4 (`fetch()` a CloudFront/S3) sí, porque esos dominios no mandan CORS. Se optó por autoalojar el proxy en el propio Hostinger en vez de sumar un servicio nuevo (Cloudflare Workers, Deno Deploy…).

### ¿Carga más rápida / carga progresiva por SEO?

**Duda:** si se podía hacer que el directo cargue más rápido, mostrando antes el reproductor y siguiendo de fondo.

**Respuesta:** la arquitectura actual ya es prácticamente así — solo hacen falta 2 llamadas de red rápidas (token + playlist) antes de mostrar el editor, y el vídeo se reproduce en streaming (HLS) en vez de descargarse entero antes de reproducir. No se encontró un cuello de botella claro sin datos reales de producción; queda pendiente que si notas algo lento en `olovetools.com` se apunte el caso concreto (qué paso tarda) para optimizarlo con datos reales en vez de adivinar.

### Bug de "vuelve al inicio" al mover el timeline (directos que siguen en emisión)

**Duda:** al arrastrar la flecha de recorte a un punto del vídeo, no se movía — volvía al inicio.

**Causa raíz:** en directos que Twitch sigue grabando, la playlist HLS se puede volver a analizar internamente, disparando otra vez el evento `MANIFEST_PARSED` de hls.js. Ese evento forzaba `video.currentTime` a un valor guardado (normalmente 0), deshaciendo cualquier scroll manual del usuario.

**Solución:** que ese ajuste inicial de tiempo se aplique una única vez (`hls.once` + comprobación adicional), sin volver a ejecutarse en eventos posteriores.

**Nota aparte (limitación real de Twitch, no de la app):** mientras un directo sigue en emisión, es posible que solo la ventana reciente de la grabación esté disponible para navegar — el histórico completo aparece cuando el directo termina. Se añadió un aviso en la interfaz quer lo explica cuando `vod.isLive` es `true`.

### Fallo puntual "no se ven las herramientas en el inicio"

**Causa:** no fue un bug de código — fue la caché de dependencias de Vite en el servidor de desarrollo local, que quedó desincronizada tras editar `package.json` (se disparó una reoptimización de dependencias a medio uso). Se solucionó parando el servidor, borrando `node_modules/.vite` y reiniciando. No afecta a nada de lo que se suba a producción (`astro build` no usa esa caché de dev).

## Pendientes abiertos

- Confirmar que `olovetools-dist-v2.zip` (con el fix del dominio `usher.ttvnw.net`) o un build más reciente ya está subido a Hostinger y que `olovetools.com/es/clip-flow/` funciona en producción de extremo a extremo (las pruebas exitosas hasta ahora fueron todas en el servidor de desarrollo local).
- Decidir cuándo volver a hacer `npm run build` y subir el resultado a Hostinger para que las últimas mejoras (fotograma a fotograma, fullscreen, timestamp en URL, botón de menú fijo) lleguen a producción.
- Opcional: borrar `diagnostico.php` del `public_html` en vivo, ya que no está protegido y expone configuración de PHP.
