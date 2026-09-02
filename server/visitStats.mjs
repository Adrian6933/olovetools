// ============================================================================
// Contador de visitas por herramienta
// ----------------------------------------------------------------------------
// Cuenta cuántas veces se abre cada herramienta, para poder ordenar el hub por
// popularidad real. Guarda UN número por slug y nada más: ni IP, ni cookie, ni
// identificador de visitante, ni de dónde viene. No se puede reconstruir quién
// hizo qué porque esa información nunca llega a entrar.
//
// Se habla con Upstash Redis por su API REST y con `fetch` a secas: sin SDK, o
// sea sin una dependencia más en package.json ni binarios que empaquetar.
//
// Si no hay credenciales configuradas, TODO esto queda inerte: las lecturas
// devuelven vacío y las escrituras no hacen nada. El sitio funciona igual y el
// hub simplemente no ofrece el orden global. Es a propósito — así se puede
// desplegar sin haber creado la cuenta todavía.
// ============================================================================

const URL_BASE = process.env.UPSTASH_REDIS_REST_URL || '';
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';

/** El contador global sólo existe si hay dónde guardarlo. */
export const statsEnabled = () => Boolean(URL_BASE && TOKEN);

/** Clave del hash donde viven todos los contadores. */
const CLAVE = 'tool_visits';

/** Un slug válido: minúsculas, dígitos y guiones. Corta cualquier intento de inyectar comandos. */
const slugValido = (s) => typeof s === 'string' && /^[a-z0-9-]{1,40}$/.test(s);

async function redis(comando) {
  const res = await fetch(URL_BASE, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(comando),
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}`);
  const data = await res.json();
  return data?.result;
}

/**
 * Suma una visita. Devuelve el total nuevo, o null si no hay almacén.
 * Un fallo aquí no debe romper la página: contar visitas es accesorio.
 */
export async function registrarVisita(slug) {
  if (!statsEnabled() || !slugValido(slug)) return null;
  try {
    return await redis(['HINCRBY', CLAVE, slug, '1']);
  } catch {
    return null;
  }
}

/**
 * Todos los contadores, como { slug: número }.
 * Devuelve {} si no hay almacén o si falla, nunca lanza.
 */
export async function leerVisitas() {
  if (!statsEnabled()) return {};
  try {
    // HGETALL devuelve un array plano [clave, valor, clave, valor…]
    const plano = await redis(['HGETALL', CLAVE]);
    if (!Array.isArray(plano)) return {};
    const salida = {};
    for (let i = 0; i < plano.length - 1; i += 2) {
      const n = parseInt(plano[i + 1], 10);
      if (slugValido(plano[i]) && Number.isFinite(n)) salida[plano[i]] = n;
    }
    return salida;
  } catch {
    return {};
  }
}
