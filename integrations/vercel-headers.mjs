import fs from 'node:fs';
import path from 'node:path';

// ============================================================================
// Cabeceras HTTP para el despliegue en Vercel
// ----------------------------------------------------------------------------
// Estas cabeceras vivían en public/.htaccess, que sólo lo entiende Apache: al
// pasar de Hostinger a Vercel dejaron de aplicarse y nada avisó. La web perdió
// sus cabeceras de seguridad y el caché de todo lo que hay en /public.
//
// No se pueden poner en vercel.json: el adaptador de Vercel usa la Build Output
// API y genera .vercel/output/config.json, cuyo array `routes` define el
// enrutado completo. Comprobado empíricamente — con las cabeceras en
// vercel.json, config.json salía sin ellas.
//
// Por eso se inyectan aquí, en el hook astro:build:done, que corre DESPUÉS de
// que el adaptador escriba su config.json.
//
// El orden importa: las reglas van ANTES de {"handle":"filesystem"} y con
// `continue: true`, para que se apliquen también a los 594 HTML estáticos, que
// los sirve el CDN sin pasar por la función serverless.
// ============================================================================

const SECURITY = [
  ['X-Frame-Options', 'SAMEORIGIN'],
  ['X-Content-Type-Options', 'nosniff'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],
  ['Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload'],
  // same-origin a secas rompería los popups que AdSense abre para el consentimiento.
  ['Cross-Origin-Opener-Policy', 'same-origin-allow-popups'],
  ['X-DNS-Prefetch-Control', 'on'],
];

const rutas = () => [
  {
    src: '^/.*$',
    headers: Object.fromEntries(SECURITY),
    continue: true,
  },
  {
    // Imágenes e iconos de /public: NO llevan hash en el nombre, así que no
    // pueden ser immutable — un año de caché dejaría una imagen OG vieja
    // congelada en los navegadores. Un día, revalidando en segundo plano.
    src: '^/[^_].*\\.(png|jpg|jpeg|gif|webp|avif|svg|ico)$',
    headers: { 'cache-control': 'public, max-age=86400, stale-while-revalidate=604800' },
    continue: true,
  },
  {
    // Las fuentes sí son inmutables en la práctica: si cambia la tipografía,
    // cambia el nombre del fichero.
    src: '^/fonts/.*$',
    headers: { 'cache-control': 'public, max-age=31536000, immutable' },
    continue: true,
  },
  {
    // Ficheros que se editan a mano y deben propagarse rápido.
    src: '^/(robots\\.txt|llms\\.txt|ads\\.txt|manifest\\.json|sitemap.*\\.xml)$',
    headers: { 'cache-control': 'public, max-age=3600' },
    continue: true,
  },
];

export default function vercelHeaders() {
  return {
    name: 'olovetools:vercel-headers',
    hooks: {
      'astro:build:done': async ({ logger }) => {
        const file = path.join(process.cwd(), '.vercel', 'output', 'config.json');
        if (!fs.existsSync(file)) {
          // Con otro adaptador (o en `astro build` sin salida de Vercel) no hay
          // nada que parchear: no es un error.
          logger.info('sin .vercel/output/config.json — no hay cabeceras que inyectar');
          return;
        }

        const config = JSON.parse(fs.readFileSync(file, 'utf8'));
        config.routes = Array.isArray(config.routes) ? config.routes : [];

        // Idempotente: si ya están puestas (rebuild incremental), no se duplican.
        const yaEsta = config.routes.some(
          (r) => r && r.headers && 'X-Frame-Options' in r.headers,
        );
        if (yaEsta) {
          logger.info('cabeceras ya presentes');
          return;
        }

        config.routes = [...rutas(), ...config.routes];
        fs.writeFileSync(file, JSON.stringify(config, null, 2), 'utf8');
        logger.info(`${rutas().length} reglas de cabeceras inyectadas en config.json`);
      },
    },
  };
}
