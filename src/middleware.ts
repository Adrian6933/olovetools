// Cabeceras de las respuestas que genera el Worker (/, /proxy, /api/*). Los
// archivos estáticos llevan las suyas desde public/_headers: Cloudflare no
// aplica ese fichero a lo que devuelve el código, así que aquí se repiten.
import { defineMiddleware } from 'astro:middleware';

const SECURITY: [string, string][] = [
  ['X-Frame-Options', 'SAMEORIGIN'],
  ['X-Content-Type-Options', 'nosniff'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],
  ['Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload'],
  // same-origin a secas rompería los popups que AdSense abre para el consentimiento.
  ['Cross-Origin-Opener-Policy', 'same-origin-allow-popups'],
];

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  // Durante el build también pasa por aquí al prerenderizar: esas páginas
  // acaban en dist/ y sus cabeceras las pone _headers.
  if (context.isPrerendered) return response;

  // Algunas respuestas (un fetch reenviado tal cual) traen cabeceras inmutables.
  let res = response;
  try {
    for (const [k, v] of SECURITY) res.headers.set(k, v);
  } catch {
    res = new Response(response.body, response);
    for (const [k, v] of SECURITY) res.headers.set(k, v);
  }
  // El relay de vídeo y la API no son páginas: que Google no las indexe.
  if (/^\/(proxy|api)(\/|$)/.test(context.url.pathname)) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return res;
});
