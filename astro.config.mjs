import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

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
