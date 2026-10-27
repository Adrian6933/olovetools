# oLoveTools — Backend

Klipy, Clipy, ClipFlow, TwitchBolt y KickBolt necesitan un pequeño backend
(proxy CORS de vídeo + tokens de app de Kick/Twitch, para que el
`client_secret` nunca llegue al navegador). El sitio se despliega en
**Cloudflare**: `@astrojs/cloudflare` empaqueta estas rutas en un único
**Worker en el mismo dominio**, y las páginas prerenderizadas se sirven como
archivos estáticos sin ejecutarlo.

## Cómo está montado

- `server/core.mjs` — toda la lógica (fetch a Kick/Twitch, caché de tokens,
  allowlist de hosts del proxy). Usa solo `fetch`/`URL` estándar.
- `src/pages/proxy.ts` → ruta `/proxy?url=<encoded>` (relay CORS para los CDNs
  de vídeo de Twitch y Kick — solo permite esos hosts, no es un proxy abierto).
  Mueve gigas al mes: por eso la web salió de Vercel, que cobra el tráfico que
  pasa por sus funciones (Fast Origin Transfer, 10 GB gratis) y la pausó en
  octubre de 2026. Cloudflare no cobra el ancho de banda de los Workers.
- `src/pages/api/kick.ts` → ruta `/api/kick?action=categories|livestreams|clips|clip`.
- `src/pages/api/twitch/token.ts` → ruta `/api/twitch/token`.
- `server/ttsGenerate.mjs` + `src/pages/api/tts.ts` → ruta `/api/tts` para
  TTSBolt (ver sección propia más abajo). Cliente WebSocket propio, abierto con
  `fetch` + `Upgrade: websocket`, la forma que tienen los Workers.
- `server/whoisLookup.mjs` + `src/pages/api/whois.ts` → ruta `/api/whois` para
  WhoisBolt (ver sección propia más abajo). Abre la conexión TCP al puerto 43
  con `connect()` de `cloudflare:sockets`.
- `server/socialResolve.mjs` + `src/pages/api/social.ts` → ruta `/api/social`
  para SocialBolt (ver sección propia más abajo).
- `server/visitStats.mjs` + `src/pages/api/stats.ts` → contador de visitas
  (Upstash Redis por REST).

Estas rutas tienen `export const prerender = false`; el resto de páginas son
HTML estático (`export const prerender = true`). Ojo con el plan gratuito de
Workers: **10 ms de CPU por petición**. Esperar a la red no cuenta, así que
reenviar vídeo o hablar con APIs cabe de sobra, pero nada que procese datos
pesados (convertir imágenes, por ejemplo) puede vivir aquí: va en el navegador.

## `/api/tts` — voces neuronales reales para TTSBolt

Antes, "Descargar MP3" en TTSBolt llamaba a
`translate.google.com/translate_tts` a través de un proxy CORS de un tercero
(`api.allorigins.win`) — un endpoint no documentado, con voz robótica, y
además **distinta** de la que sonaba al pulsar "Escuchar" (esa usaba
`window.speechSynthesis`, dependiente del sistema operativo). Este endpoint
reemplaza ambas cosas por una sola fuente real:

- Habla con el mismo servicio que usa la función "Leer en voz alta" de
  Microsoft Edge — sin API key, sin coste. El formato de los mensajes se portó
  de `msedge-tts` 2.1.0 (que dependía de `ws` y de los streams de Node); el
  endpoint, las cabeceras y el token salen de la librería de Python `edge-tts`
  7.3.1, porque Microsoft cambió el token el 27-10-2026 y `msedge-tts` dejó de
  funcionar (el handshake devolvía 200 en vez de 101).
- Conexión: `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=…`
  con `Sec-MS-GEC-Version=2-143.0.3650.75`, cookie `muid` aleatoria y las
  cabeceras de Edge (`Pragma`, `Cache-Control`, `Sec-WebSocket-Version`,
  `Accept-Encoding`, `Accept-Language`, `Origin` de la extensión).
- **Token `Sec-MS-GEC` v2**: `"<CS64 hex>-<SHA-256 hex>"` de la ventana de 5
  minutos en ticks de Windows + el client token. Ese SHA-256 no es el estándar:
  arranca de un estado intermedio precalculado (un prefijo secreto de 57
  bytes), así que Web Crypto no sirve y está escrito a mano en JS puro, igual
  que el CS64. Si Microsoft lo vuelve a cambiar, el síntoma es el mismo (200 o
  403 en el handshake): mirar `edge_tts/drm.py` y `constants.py` de la última
  versión de `edge-tts` en PyPI y portar las constantes.
- En el Worker los frames binarios llegan como `Blob`, no como `ArrayBuffer`:
  se guardan en orden como promesas y se leen al llegar `turn.end`.
- `GET /api/tts?action=voices` → lista completa de voces neuronales reales de
  Microsoft (~400, cientos de idiomas/acentos), cacheada 6h en memoria.
- `POST /api/tts` con `{ text, voice, rate, pitch }` → una línea JSON con las
  marcas de palabra/frase y, detrás, el MP3 real
  (`audio-24khz-96kbitrate-mono-mp3`), la **misma** voz para escuchar y para
  descargar. Límite de 3000 caracteres por petición (`MAX_TEXT_LENGTH` en
  `server/ttsGenerate.mjs`; el cliente trocea los guiones largos), para que la
  síntesis sea rápida y no abra la puerta a abuso de un endpoint gratuito sin
  autenticación.
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
igual que en producción. Para probar el build tal cual corre en Cloudflare
(motor `workerd`): `npm run build` y luego
`npx wrangler dev --config dist/server/wrangler.json`.

## Variables de entorno

```
KICK_CLIENT_ID
KICK_CLIENT_SECRET
TWITCH_CLIENT_ID
TWITCH_CLIENT_SECRET
```

**En Cloudflare:** son secretos del Worker. Se suben todos de una vez desde
el `.env` con `npx wrangler secret bulk .env` (o a mano en Workers → olovetools
→ Settings → Variables and Secrets). Llegan al código como `process.env`
gracias a `nodejs_compat`. Sin ellas, `/api/kick` y `/api/twitch/token`
responden con un error claro en vez de arrancar con credenciales antiguas.

**En local:** crea un archivo `.env` en la raíz del proyecto (ya está en
`.gitignore`, nunca se sube) con esas 4 líneas — `server/core.mjs` lo carga
automáticamente al arrancar `npm run dev`.

⚠️ Las credenciales que llevaba el proyecto hasta ahora estuvieron
hardcodeadas en el código (en el bundle del navegador, en el caso de Twitch) y
llevan tiempo en el historial de git. Conviene **rotarlas** en los paneles de
desarrollador de Kick y Twitch antes de subir las nuevas a Cloudflare.

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
