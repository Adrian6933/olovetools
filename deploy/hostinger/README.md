# Configuración de Apache (Hostinger)

Este `.htaccess` estuvo en `public/` hasta el 2026-08-31. Se movió aquí porque:

1. **En Vercel no se ejecuta.** Apache lee `.htaccess`; Vercel no. Todo lo que
   hacía (redirección a HTTPS y sin www, tipos MIME, GZIP, caché y cabeceras de
   seguridad) dejó de aplicarse en cuanto se migró, sin que nada avisara.

2. **Estando en `public/` se publicaba.** Vercel copia `public/` tal cual a la
   salida estática, así que el fichero era descargable en
   `https://olovetools.com/.htaccess` y enseñaba la configuración del servidor a
   quien lo pidiera.

## Qué lo sustituye en Vercel

| Lo que hacía el .htaccess | Dónde está ahora |
|---|---|
| Cabeceras de seguridad | `integrations/vercel-headers.mjs` |
| Caché de imágenes, fuentes y ficheros de texto | `integrations/vercel-headers.mjs` |
| Caché de los assets con hash | Lo pone solo el adaptador de Vercel |
| Compresión GZIP | Vercel sirve brotli automáticamente |
| Tipos MIME | Los pone Vercel |
| HTTPS y quitar el www | Ajustes de dominio en el panel de Vercel |
| Página 404 | Ya está en el `config.json` que genera el adaptador |
| Bloquear `.git` y `.env` | En Vercel no se publican; sólo se sube lo construido |

## Si vuelves a Hostinger

Cópialo de vuelta a `public/.htaccess` y quita `vercelHeaders()` de
`astro.config.mjs`, o tendrás las cabeceras duplicadas.
