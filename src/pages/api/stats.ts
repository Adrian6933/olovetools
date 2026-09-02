// Contador de visitas por herramienta (ver server/visitStats.mjs para qué se
// guarda y qué no). GET devuelve todos los contadores; POST suma uno.
//
// Sin credenciales de almacén configuradas, GET devuelve enabled:false y el hub
// oculta la ordenación global en vez de enseñar ceros que parecerían datos.
import type { APIRoute } from 'astro';
import { leerVisitas, registrarVisita, statsEnabled } from '../../../server/visitStats.mjs';

export const prerender = false;

const CABECERAS = { 'Content-Type': 'application/json; charset=utf-8' };

function json(status: number, data: unknown, cacheSegundos = 0) {
  return new Response(JSON.stringify(data), {
    status,
    headers: cacheSegundos
      ? {
          ...CABECERAS,
          // Se sirve desde caché durante unos minutos y se revalida por detrás:
          // un ranking de popularidad no necesita estar al segundo, y así el
          // hub no pega al almacén en cada visita.
          'Cache-Control': `public, max-age=0, s-maxage=${cacheSegundos}, stale-while-revalidate=600`,
        }
      : { ...CABECERAS, 'Cache-Control': 'no-store' },
  });
}

export const GET: APIRoute = async () => {
  if (!statsEnabled()) return json(200, { enabled: false, visits: {} }, 300);
  return json(200, { enabled: true, visits: await leerVisitas() }, 300);
};

export const POST: APIRoute = async ({ request }) => {
  if (!statsEnabled()) return json(200, { enabled: false });

  let slug = '';
  try {
    const body = await request.json();
    slug = String(body?.slug || '');
  } catch {
    return json(400, { error: 'cuerpo no válido' });
  }

  const total = await registrarVisita(slug);
  // Se responde 200 aunque no se haya contado: para quien visita la página, que
  // el contador falle no es un error que deba ver ni reintentar.
  return json(200, { ok: total !== null, total });
};
