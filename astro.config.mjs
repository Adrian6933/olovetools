import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://olovetools.com',
  integrations: [
    react(),
    sitemap({
      i18n: {
        defaultLocale: 'es',
        locales: {
          es: 'es',
          fr: 'fr',
          zh: 'zh'
        }
      }
    })
  ],

  vite: {
    plugins: [tailwindcss()]
  }
});