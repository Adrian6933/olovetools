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
