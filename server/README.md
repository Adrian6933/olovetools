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

Estas 3 rutas tienen `export const prerender = false`, así que Astro las deja
fuera del sitio estático y Vercel las sirve como funciones serverless. El
resto de páginas (578) siguen siendo HTML estático de toda la vida
(`export const prerender = true`).

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
