// Idiomas que la web sigue sirviendo pero que no se ofrecen a Google.
//
// En Search Console (jul-oct 2026) las páginas en chino sumaron 44 impresiones
// y las de hindi 17, sin un solo clic, frente a cientos en el resto de idiomas:
// 134 páginas que solo hacían el sitio más grande. Siguen abiertas para quien
// elija ese idioma, pero llevan noindex, no salen en el sitemap y ninguna otra
// página las anuncia con hreflang (un hreflang hacia una página noindex es un
// error para Google). Es un .mjs y no un .ts porque también lo lee
// astro.config.mjs para filtrar el sitemap.
export const NOINDEX_LANGS = ['zh', 'hi'];

export const isIndexedLang = (lang) => !NOINDEX_LANGS.includes(lang);
