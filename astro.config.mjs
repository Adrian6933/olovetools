import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

// `astro dev` carga el .env en import.meta.env, no en process.env, así que el
// contador de visitas quedaba inerte en local y no había forma de probarlo. Se
// copia aquí, en la configuración, que corre en Node y fuera del bundle: nada
// de esto llega a incrustarse en el código compilado. En Vercel estas variables
// ya vienen puestas y este bloque no las pisa.
{
  const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');
  for (const clave of ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN']) {
    if (!process.env[clave] && env[clave]) process.env[clave] = env[clave];
  }
}

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import vercelHeaders from './integrations/vercel-headers.mjs';

// output: 'server' + the Vercel adapter turns src/pages/proxy.ts and
// src/pages/api/** into real serverless functions (same origin as the site —
// no separate worker or PUBLIC_API_BASE needed). Every other page keeps
// `export const prerender = true` so it's still built as a static HTML file
// exactly like before (578 pages), only those 3 API routes are dynamic.
export default defineConfig({
  site: 'https://olovetools.com',
  output: 'server',
  adapter: vercel(),

  integrations: [
    react(),
    vercelHeaders(),
    sitemap({
      // La raíz "/" es una página noindex de redirección por idioma: fuera del
      // sitemap (además duplicaba hreflang="en" en los clusters de los hubs).
      filter: (page) => page !== 'https://olovetools.com/',
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en',
          es: 'es',
          hi: 'hi',
          de: 'de',
          fr: 'fr',
          pt: 'pt',
          ru: 'ru',
          ja: 'ja',
          zh: 'zh'
        }
      }
    })
  ],

  vite: {
    plugins: [tailwindcss()]
  }
});
