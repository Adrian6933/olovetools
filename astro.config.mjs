import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

// `astro dev` carga el .env en import.meta.env, no en process.env, así que el
// contador de visitas quedaba inerte en local y no había forma de probarlo. Se
// copia aquí, en la configuración, que corre en Node y fuera del bundle: nada
// de esto llega a incrustarse en el código compilado. En Cloudflare estas
// variables son secretos del Worker y este bloque no las pisa.
{
  const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');
  for (const clave of ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'COBALT_API_URL', 'COBALT_API_KEY']) {
    if (!process.env[clave] && env[clave]) process.env[clave] = env[clave];
  }
}

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import { NOINDEX_LANGS } from './src/config/search-languages.mjs';

// output: 'server' + the Cloudflare adapter builds one Worker for "/",
// src/pages/proxy.ts and src/pages/api/** (same origin as the site). Every other
// page keeps `export const prerender = true` and ships as a static asset, which
// Cloudflare serves without running the Worker. Config lives in wrangler.jsonc.
export default defineConfig({
  site: 'https://olovetools.com',
  output: 'server',
  // Prerenderiza en Node, como antes: las 578 páginas no tienen por qué
  // compilarse dentro de workerd. Sin sesiones: el adaptador crearía un KV que
  // nada usa.
  adapter: cloudflare({ imageService: 'passthrough', prerenderEnvironment: 'node' }),
  session: { driver: 'memory' },

  integrations: [
    react(),
    sitemap({
      // La raíz "/" es una página noindex de redirección por idioma: fuera del
      // sitemap (además duplicaba hreflang="en" en los clusters de los hubs).
      // Los idiomas de NOINDEX_LANGS tampoco entran, ni como URL ni como
      // alternativa de idioma de las demás.
      filter: (page) =>
        page !== 'https://olovetools.com/' &&
        !NOINDEX_LANGS.some((l) => page.startsWith(`https://olovetools.com/${l}/`)),
      i18n: {
        defaultLocale: 'en',
        locales: Object.fromEntries(
          ['en', 'es', 'hi', 'de', 'fr', 'pt', 'ru', 'ja', 'zh']
            .filter((l) => !NOINDEX_LANGS.includes(l))
            .map((l) => [l, l])
        )
      }
    })
  ],

  vite: {
    plugins: [tailwindcss()]
  }
});
