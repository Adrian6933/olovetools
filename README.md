# oLoveTools

Suite de 60 herramientas web gratuitas, en 9 idiomas, que funcionan en el
navegador. <https://olovetools.com>

Astro 6 con islas de React, Tailwind 4 y despliegue en Vercel.

## Poner en marcha

```bash
npm install
cp .env.example .env    # y rellena las cuatro claves
npm run dev             # http://localhost:4321
```

Las claves de `.env` sólo hacen falta para las cuatro herramientas que hablan
con Twitch y Kick (Clipy, Klipy, TwitchBolt y KickBolt). El resto de la suite
funciona sin ellas.

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Genera las 594 páginas y las funciones serverless |
| `node scripts/check-translations.mjs` | Compara los 9 idiomas contra el inglés |
| `node scripts/generate-tool.mjs` | Andamiaje de una herramienta nueva |

`npm run preview` no funciona: el adaptador de Vercel no lo soporta. Para ver el
resultado de un build, despliega una preview en Vercel.

## Cómo está montado

```
src/
  pages/[lang]/[tool]/    Una ruta que sirve las 60 herramientas en 9 idiomas
  pages/api/              Endpoints serverless (Node, no edge)
  tools/<slug>/           Una carpeta por herramienta, con su propio React
  locales/<lang>/         Un fichero de textos por herramienta e idioma
  components/shared/      Anuncios, movimiento y piezas comunes
  lib/                    Utilidades compartidas (handoff entre tools, OG…)
server/                   Lógica de backend, importada por las rutas de api/
integrations/             Integraciones propias de Astro
scripts/                  Utilidades de mantenimiento
docs/                     Documentación del proyecto
```

**Todo el trabajo pesado ocurre en el navegador.** El backend existe sólo para lo
que un navegador tiene prohibido hacer: guardar los secretos de las APIs de
Twitch y Kick, y retransmitir peticiones a servidores que no envían cabeceras
CORS. No hay cuentas de usuario.

La única cosa que se guarda en servidor es un contador de visitas por
herramienta, para poder ordenar el hub por popularidad: un número por slug, sin
IP, sin cookie y sin identificador de visitante. Es opcional — sin las
credenciales de Upstash el sitio funciona igual y el hub oculta ese orden.

### Añadir una herramienta

1. `node scripts/generate-tool.mjs` crea la carpeta y los 9 ficheros de idioma.
2. Registra el slug en `src/constants.ts`, `src/lib/themes.ts`,
   `src/locales/dictionary.ts` y `src/pages/[lang]/[tool]/index.astro`.
3. Añade `public/og-<slug>.png` a 1200×630. Si falta, la página cae a la imagen
   genérica en vez de quedarse sin previsualización.
4. Comprueba con `node scripts/check-translations.mjs`.

`docs/PROMPT_MEJORA_TOOL.md` tiene la lista completa de lo que se revisa en cada
herramienta: anuncios, raíles, responsive, honestidad de los textos y encadenado
con el resto de la suite.

## Despliegue

Vercel construye desde `main` al hacer push. Las cuatro variables de entorno se
configuran en *Project Settings → Environment Variables*, y **no se aplican a un
despliegue ya existente**: hay que volver a desplegar.

El DNS lo gestiona Cloudflare (el dominio está comprado en Hostinger). Los
registros del sitio deben estar en **DNS only**, con la nube gris: con el proxy
de Cloudflare activo, Vercel no puede verificar el dominio ni emitir el
certificado.

Las cabeceras de seguridad y de caché las inyecta
`integrations/vercel-headers.mjs` en el `config.json` que genera el adaptador.
No se pueden poner en `vercel.json`: con la Build Output API se ignoran.

## Documentación

| Documento | Para qué |
|---|---|
| [docs/CONTEXTO.md](docs/CONTEXTO.md) | Arquitectura y decisiones técnicas |
| [docs/HERRAMIENTAS.md](docs/HERRAMIENTAS.md) | Catálogo de las 60 herramientas |
| [docs/COMANDOS.md](docs/COMANDOS.md) | Comandos de auditoría y depuración |
| [docs/PROMPT_MEJORA_TOOL.md](docs/PROMPT_MEJORA_TOOL.md) | Guion de revisión de una herramienta |
| [docs/RESPUESTA_PASSBOLT.md](docs/RESPUESTA_PASSBOLT.md) | Reclamación de marca de 2026 y qué se hizo |
