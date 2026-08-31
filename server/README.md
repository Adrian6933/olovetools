# oLoveTools — Backend

Klipy, Clipy, ClipFlow, TwitchBolt y KickBolt necesitan un pequeño backend
(proxy CORS de vídeo + tokens de app de Kick/Twitch, para que el
`client_secret` nunca llegue al navegador). El sitio se despliega en
**Vercel**, así que ese backend corre como **funciones serverless de Astro en
el mismo dominio** — no hace falta un servidor ni un worker aparte.

## Cómo está montado

- `server/core.mjs` — toda la lógica (fetch a Kick/Twitch, caché de tokens,
  allowlist de hosts del proxy). Usa solo `fetch`/`URL` estándar, sin APIs de
  Node, para que funcione igual en local y en el runtime serverless de Vercel.
- `src/pages/proxy.ts` → ruta `/proxy?url=<encoded>` (relay CORS para los CDNs
  de vídeo de Twitch y Kick — solo permite esos hosts, no es un proxy abierto).
- `src/pages/api/kick.ts` → ruta `/api/kick?action=categories|livestreams|clips|clip`.
- `src/pages/api/twitch/token.ts` → ruta `/api/twitch/token`.
- `server/imageConvert.mjs` + `src/pages/api/convert.ts` → ruta `/api/convert`
  para FormatFlow (ver sección propia más abajo). A diferencia de las 3 rutas
  anteriores, esta usa `sharp` (binario nativo), así que **solo funciona en
  Node** (Vercel o self-host), nunca en Cloudflare Workers/edge.
- `server/ttsGenerate.mjs` + `src/pages/api/tts.ts` → ruta `/api/tts` para
  TTSBolt (ver sección propia más abajo). Usa `msedge-tts` (cliente WebSocket
  puro en JS, sin binarios nativos), así que en teoría sí podría adaptarse a un
  Worker — pero de momento vive junto a las demás rutas Node.
- `server/whoisLookup.mjs` + `src/pages/api/whois.ts` → ruta `/api/whois` para
  WhoisBolt (ver sección propia más abajo). Usa el módulo `net` de Node para
  abrir una conexión TCP al puerto 43 (WHOIS real) — **solo funciona en Node**,
  igual que `/api/convert`, nunca en Cloudflare Workers/edge.
- `server/socialResolve.mjs` + `src/pages/api/social.ts` → ruta `/api/social`
  para SocialBolt (ver sección propia más abajo). Solo usa `fetch`/`URL`, como
  `core.mjs`, así que sí podría adaptarse a un Worker.

Estas rutas tienen `export const prerender = false`, así que Astro las deja
fuera del sitio estático y Vercel las sirve como funciones serverless. El
resto de páginas siguen siendo HTML estático de toda la vida
(`export const prerender = true`).

## `/api/convert` — conversión real de imágenes para FormatFlow

`canvas.toBlob()` en el navegador no puede producir AVIF real en la mayoría
de motores, y no da control de calidad/compresión para WebP/TIFF. Este
endpoint usa `sharp` (libvips) para una conversión de verdad:

- **Soportado de verdad:** AVIF (codec AV1, sin patentes), WebP, TIFF (LZW),
  JPEG, PNG, GIF — con resize incluido.
- **NO soportado aquí (y no es un bug, es una limitación real):**
  - **HEIC de salida** — el códec HEVC que usa un `.heic` real está bajo
    patente y no viene incluido en el build open-source de libheif que trae
    sharp (falla con "Unsupported compression"). No hay forma gratuita de
    generar un `.heic` de verdad; el cliente sigue haciendo fallback honesto a
    JPG (ya estaba así, y ahora la extensión del ZIP por lotes también lo
    refleja correctamente).
  - **EPS y RAW de salida** — conceptualmente RAW ni siquiera tiene sentido
    como formato de exportación (es un volcado de sensor de cámara, no algo
    que se "genera" desde un bitmap ya renderizado). EPS real necesitaría
    Ghostscript, que no corre en una función serverless. Ambos siguen cayendo
    a PNG en el cliente, con la extensión del archivo ya corregida para
    coincidir con los bytes reales.

`FormatFlow` intenta primero este endpoint (`src/tools/formatflow/services/imageService.ts`,
función `tryServerConversion`) y si falla por cualquier motivo (self-host sin
esta ruta desplegada, offline, imagen > 4.5MB, etc.) cae automáticamente al
`canvas`/`utif` de siempre — nunca rompe, solo pierde la mejora de calidad.

**Despliegue:** no necesita nada especial — `sharp` se instala como cualquier
dependencia de npm y Vercel descarga el binario nativo correcto (Linux x64)
durante su propio build, igual que hace Next.js con `next/image`. En local
(`npm run dev`) usa el binario de tu SO tal cual.

## `/api/tts` — voces neuronales reales para TTSBolt

Antes, "Descargar MP3" en TTSBolt llamaba a
`translate.google.com/translate_tts` a través de un proxy CORS de un tercero
(`api.allorigins.win`) — un endpoint no documentado, con voz robótica, y
además **distinta** de la que sonaba al pulsar "Escuchar" (esa usaba
`window.speechSynthesis`, dependiente del sistema operativo). Este endpoint
reemplaza ambas cosas por una sola fuente real:

- Usa `msedge-tts`, un cliente WebSocket en JS puro del mismo servicio que usa
  la función "Léelo en voz alta" de Microsoft Edge — sin API key, sin coste.
- `GET /api/tts?action=voices` → lista completa de voces neuronales reales de
  Microsoft (~400, cientos de idiomas/acentos), cacheada 6h en memoria.
- `POST /api/tts` con `{ text, voice, rate, pitch }` → MP3 real
  (`audio-24khz-96kbitrate-mono-mp3`), la **misma** voz para escuchar y para
  descargar. Límite de 5000 caracteres por petición (`MAX_TEXT_LENGTH` en
  `server/ttsGenerate.mjs`), para que la síntesis sea rápida y no abra la
  puerta a abuso de un endpoint gratuito sin autenticación.
- **Limitación real, no un bug:** no se puede generar HEIC en `/api/convert`
  por patentes de códec; aquí no hay equivalente — la síntesis de voz no tiene
  esa restricción, así que esta ruta sí cubre el 100% de lo que promete
  TTSBolt (a diferencia de FormatFlow con EPS/RAW).

## `/api/whois` — WHOIS real para WhoisBolt

WhoisBolt ya hacía DNS-over-HTTPS (A/AAAA/MX/TXT/NS/CNAME/SOA) directo desde
el navegador a Google DNS — eso es genuinamente 100% cliente y sigue igual.
Pero WHOIS (registrador, fechas de creación/expiración, estado del dominio) es
un protocolo distinto que **solo** existe como conexión TCP directa al puerto
43 — ningún navegador permite abrir sockets así, así que antes simplemente no
existía en la herramienta pese al nombre "WhoisBolt".

- `GET /api/whois?domain=example.com` → hace la cadena de referencia real:
  pregunta a `whois.iana.org` qué registro gestiona el TLD, pregunta a ese
  registro, y si el registro es "thin" (la mayoría de gTLDs como .com/.net)
  sigue la línea `Registrar WHOIS Server:` para traer el registro completo
  (registrador, fechas, estado) desde el servidor del registrador.
  Verificado con dominios reales (github.com, google.com, wikipedia.org):
  registrador, fechas y estados correctos.
- Devuelve el texto WHOIS crudo + un parseo best-effort (el formato WHOIS no
  está estandarizado — cada registro usa etiquetas ligeramente distintas, así
  que el crudo siempre está disponible como respaldo).
- Dominios sin servidor WHOIS público registrado en IANA (algunos ccTLDs) dan
  un error claro (`tld_not_supported`) en vez de colgarse.

## Desarrollo

`npm run dev` ya sirve estas rutas de verdad (no hace falta nada aparte):
`http://localhost:4321/api/kick`, `/proxy`, `/api/twitch/token` funcionan
igual que en producción.

## Variables de entorno

```
KICK_CLIENT_ID
KICK_CLIENT_SECRET
TWITCH_CLIENT_ID
TWITCH_CLIENT_SECRET
```

**En Vercel:** Project Settings → Environment Variables → añadir las 4, en
"Production" (y "Preview"/"Development" si quieres probarlas en esos entornos
también). Sin ellas, `/api/kick` y `/api/twitch/token` responden con un error
claro en vez de arrancar con credenciales antiguas.

**En local:** crea un archivo `.env` en la raíz del proyecto (ya está en
`.gitignore`, nunca se sube) con esas 4 líneas — `server/core.mjs` lo carga
automáticamente al arrancar `npm run dev`.

⚠️ Las credenciales que llevaba el proyecto hasta ahora estuvieron
hardcodeadas en el código (en el bundle del navegador, en el caso de Twitch) y
llevan tiempo en el historial de git. Conviene **rotarlas** en los paneles de
desarrollador de Kick y Twitch antes de poner las nuevas en Vercel.

## Cómo obtener las credenciales

- **Kick:** https://kick.com/settings/developer → crear una app → `client_id` / `client_secret`.
- **Twitch:** https://dev.twitch.tv/console/apps → registrar una app → `client_id` / `client_secret`.

## `/api/social` — resolución de enlaces sociales para SocialBolt

Antes, SocialBolt resolvía los enlaces **desde el navegador** a través de
proxies CORS públicos de terceros (`corsproxy.io`, `api.codetabs.com`), a los
que había que entregarles la URL del usuario, y contra instancias de Cobalt que
o no existen o exigen JWT (`api.cobalt.tools` responde
`error.api.auth.jwt.missing`). Resultado: de las cuatro plataformas anunciadas
solo funcionaba TikTok.

Ahora todo se resuelve en esta ruta, con dos acciones:

- `GET /api/social?action=resolve&url=<encoded>` → JSON con autor, estadísticas
  y la lista de **assets** descargables (cada uno con su tipo, extensión,
  tamaño y etiqueta de calidad).
- `GET /api/social?action=media&url=<encoded>&name=<archivo>` → relay del medio
  con `Content-Disposition: attachment`. Solo se usa como **fallback**: los CDN
  de TikTok mandan `Access-Control-Allow-Origin: *`, así que el navegador
  descarga directo y no gasta ancho de banda de la función. `video.twimg.com`
  no manda CORS, y ahí sí entra el relay.

Igual que `/proxy`, el relay tiene **allowlist de hosts** (CDNs de TikTok, X,
YouTube e Instagram) y exige `https`, para que no se convierta en un proxy
abierto.

### Qué se puede servir gratis y qué no

| Plataforma | Estado | Cómo |
| --- | --- | --- |
| TikTok | Completo | TikWM con `hd=1`: HD, sin marca de agua, con marca, MP3, portada, avatar y carruseles. Limita a ~1 petición/segundo por IP, por eso la cola del cliente espera 1,1 s entre enlaces. |
| X / Twitter | Completo | `cdn.syndication.twimg.com/tweet-result` (la API que alimenta los tweets embebidos): todas las variantes de bitrate, GIF, fotos en `?name=orig`. |
| YouTube | Parcial | oEmbed (título/canal) + miniaturas. La pista de vídeo exige descifrar la firma del `player.js`, que cambia cada pocos días: **no hay forma gratuita** desde una función serverless. |
| Instagram | Mejor esfuerzo | Scrape del HTML del embed público. Instagram rechaza las IP de datacenter en su API interna, así que falla en la mayoría de posts y se devuelve `instagram_blocked`. |

### Variables de entorno opcionales

```
COBALT_API_URL=https://tu-instancia-cobalt.example
COBALT_API_KEY=...            # solo si tu instancia exige Api-Key
```

Sin `COBALT_API_URL` **no se hace ni una petición** a Cobalt (no tiene sentido
machacar instancias públicas que hoy piden JWT). Con ella, YouTube e Instagram
intentan además el túnel de Cobalt con el formato de petición de la API v10
(la v7 que usaba el código anterior lleva años retirada).
