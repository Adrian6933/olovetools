import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

// ============================================================================
// Datos de la imagen Open Graph, resueltos en tiempo de compilación.
// ----------------------------------------------------------------------------
// Dos problemas que esto arregla:
//
// 1. Las páginas de herramienta referenciaban `og-${slug}.png` sin comprobar que
//    existiera. Al renombrar passbolt y al añadir qr-reader, esas páginas
//    apuntaban a un PNG inexistente: al compartirlas no salía miniatura y nada
//    avisaba. Ahora se comprueba y se cae a la imagen genérica.
//
// 2. Sin `og:image:width` / `height`, la red social tiene que descargar la
//    imagen para saber su tamaño antes de dibujar la tarjeta, y la primera vez
//    que se comparte un enlace suele salir sin miniatura. Las dimensiones se
//    leen de la cabecera IHDR del PNG en vez de codificarse a mano, porque no
//    todas las imágenes están a 1200x630 (algunas son cuadradas).
//
// Se usa `process.cwd()` y no `new URL(..., import.meta.url)`: Vite reescribe
// `import.meta.url` a la ubicación del fichero YA EMPAQUETADO en dist/, así que
// la ruta relativa al fuente no resuelve y la lectura fallaba en silencio.
// `astro build` siempre corre desde la raíz del proyecto.
// ============================================================================

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const FALLBACK = 'og-image.png';

export interface OgImage {
  /** Nombre del fichero dentro de /public, ya comprobado que existe. */
  file: string;
  width: number | null;
  height: number | null;
}

/** Lee ancho y alto de la cabecera IHDR de un PNG (dos enteros de 32 bits big-endian en el byte 16). */
function pngSize(absPath: string): { width: number; height: number } | null {
  try {
    const buf = readFileSync(absPath);
    if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null;
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  } catch {
    return null;
  }
}

/**
 * Devuelve la imagen OG que debe usar una página.
 * @param preferred nombre de fichero deseado (p. ej. `og-hash-bolt.png`); si no
 *                  existe se usa la genérica.
 */
export function resolveOgImage(preferred?: string): OgImage {
  const file = preferred && existsSync(path.join(PUBLIC_DIR, preferred)) ? preferred : FALLBACK;
  const size = pngSize(path.join(PUBLIC_DIR, file));
  return { file, width: size?.width ?? null, height: size?.height ?? null };
}
