// ============================================================================
// Cargador de gramáticas de Prism
// ----------------------------------------------------------------------------
// Dos diferencias con el `useEffect` que había antes:
//
// 1. ORDEN. Los componentes de Prism no resuelven sus propias dependencias
//    cuando se cargan desde un bundler: `prism-cpp` empieza con
//    `Prism.languages.extend('c', …)`, y si `prism-c` no está cargado eso es
//    `clone(undefined)` seguido de una asignación sobre `undefined` → TypeError
//    que aborta toda la cadena de `await import()`. La tool cargaba cpp sin c,
//    así que `setPrismLoaded(true)` no llegaba a ejecutarse nunca y NINGÚN
//    lenguaje se resaltaba. Aquí las dependencias se resuelven en topológico
//    antes de tocar nada.
//
// 2. BAJO DEMANDA. Antes se descargaban 11 gramáticas de golpe al montar,
//    usara el usuario la que usara. Aquí se carga solo la seleccionada (y su
//    cadena de dependencias), lo que permite ofrecer ~48 lenguajes en vez de 12
//    sin engordar la carga inicial. Vite genera un chunk por componente porque
//    los import() son literales estáticos, no plantillas.
// ============================================================================

import type { Grammar, Token } from 'prismjs';
import { getLanguage } from './languages';

type Loader = () => Promise<unknown>;

/** Un import() literal por componente: es lo que Vite necesita para trocearlos. */
const LOADERS: Record<string, Loader> = {
  clike: () => import('prismjs/components/prism-clike'),
  markup: () => import('prismjs/components/prism-markup'),
  'markup-templating': () => import('prismjs/components/prism-markup-templating'),
  css: () => import('prismjs/components/prism-css'),
  javascript: () => import('prismjs/components/prism-javascript'),
  typescript: () => import('prismjs/components/prism-typescript'),
  jsx: () => import('prismjs/components/prism-jsx'),
  tsx: () => import('prismjs/components/prism-tsx'),
  python: () => import('prismjs/components/prism-python'),
  java: () => import('prismjs/components/prism-java'),
  kotlin: () => import('prismjs/components/prism-kotlin'),
  scala: () => import('prismjs/components/prism-scala'),
  csharp: () => import('prismjs/components/prism-csharp'),
  c: () => import('prismjs/components/prism-c'),
  cpp: () => import('prismjs/components/prism-cpp'),
  objectivec: () => import('prismjs/components/prism-objectivec'),
  go: () => import('prismjs/components/prism-go'),
  rust: () => import('prismjs/components/prism-rust'),
  zig: () => import('prismjs/components/prism-zig'),
  swift: () => import('prismjs/components/prism-swift'),
  dart: () => import('prismjs/components/prism-dart'),
  ruby: () => import('prismjs/components/prism-ruby'),
  php: () => import('prismjs/components/prism-php'),
  perl: () => import('prismjs/components/prism-perl'),
  lua: () => import('prismjs/components/prism-lua'),
  elixir: () => import('prismjs/components/prism-elixir'),
  haskell: () => import('prismjs/components/prism-haskell'),
  julia: () => import('prismjs/components/prism-julia'),
  r: () => import('prismjs/components/prism-r'),
  matlab: () => import('prismjs/components/prism-matlab'),
  solidity: () => import('prismjs/components/prism-solidity'),
  graphql: () => import('prismjs/components/prism-graphql'),
  sql: () => import('prismjs/components/prism-sql'),
  json: () => import('prismjs/components/prism-json'),
  yaml: () => import('prismjs/components/prism-yaml'),
  toml: () => import('prismjs/components/prism-toml'),
  ini: () => import('prismjs/components/prism-ini'),
  hcl: () => import('prismjs/components/prism-hcl'),
  protobuf: () => import('prismjs/components/prism-protobuf'),
  bash: () => import('prismjs/components/prism-bash'),
  powershell: () => import('prismjs/components/prism-powershell'),
  docker: () => import('prismjs/components/prism-docker'),
  nginx: () => import('prismjs/components/prism-nginx'),
  makefile: () => import('prismjs/components/prism-makefile'),
  markdown: () => import('prismjs/components/prism-markdown'),
  diff: () => import('prismjs/components/prism-diff'),
  git: () => import('prismjs/components/prism-git'),
  http: () => import('prismjs/components/prism-http'),
  regex: () => import('prismjs/components/prism-regex'),
  vim: () => import('prismjs/components/prism-vim'),
};

type PrismCore = typeof import('prismjs');

let corePromise: Promise<PrismCore> | null = null;
/** Una promesa por componente: la segunda petición reutiliza la primera. */
const componentPromises = new Map<string, Promise<void>>();

function loadCore(): Promise<PrismCore> {
  if (!corePromise) {
    corePromise = import('prismjs').then(mod => {
      const prism = (mod.default || mod) as PrismCore;
      // Los componentes de Prism escriben sobre el global. Sin esto, cada
      // import() de un componente crea su propia instancia y las gramáticas
      // acaban en un objeto distinto del que consultamos luego.
      (window as unknown as { Prism: PrismCore }).Prism = prism;
      // Prism intenta resaltar el documento entero al cargarse. Nosotros
      // renderizamos desde el token stream, así que ese barrido solo gasta CPU.
      (prism as unknown as { manual: boolean }).manual = true;
      return prism;
    });
  }
  return corePromise;
}

function loadComponent(id: string): Promise<void> {
  let pending = componentPromises.get(id);
  if (!pending) {
    const loader = LOADERS[id];
    pending = loader ? loader().then(() => undefined) : Promise.resolve();
    componentPromises.set(id, pending);
  }
  return pending;
}

/**
 * Deja lista la gramática `id` y devuelve el core de Prism. Las dependencias se
 * cargan EN SERIE y antes que el propio componente; el resto ya cacheado no
 * vuelve a pedirse.
 */
export async function ensureGrammar(id: string): Promise<PrismCore> {
  const prism = await loadCore();
  const def = getLanguage(id);
  for (const dep of def?.requires || []) await loadComponent(dep);
  await loadComponent(id);
  return prism;
}

/**
 * Acceso al global de Prism seguro en SSR. La isla se renderiza también en el
 * servidor, donde `window` no existe: sin esta guarda el primer useMemo del
 * componente lanzaba "window is not defined" y el HTML de la herramienta
 * llegaba vacío al navegador.
 */
function globalPrism(): PrismCore | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as { Prism?: PrismCore }).Prism;
}

/** True si la gramática ya está en memoria (para pintar sin esperar). */
export function grammarReady(id: string): boolean {
  const prism = globalPrism();
  return !!prism?.languages?.[id];
}

export type PrismToken = string | Token;

/**
 * Devuelve el token stream de Prism, no HTML. `Prism.highlight()` aplana el
 * árbol a una cadena de `<span>` de la que ya no se puede sacar nada; con
 * `tokenize()` conservamos el dato intermedio, y sobre él se construyen el
 * troceado por líneas, el resaltado de líneas concretas y el ajuste de línea
 * sin volver a analizar el código.
 */
export function tokenize(code: string, languageId: string): PrismToken[] | null {
  const prism = globalPrism();
  const grammar = prism?.languages?.[languageId] as Grammar | undefined;
  if (!prism || !grammar) return null;
  try {
    return prism.tokenize(code, grammar) as PrismToken[];
  } catch {
    // Una gramática puede reventar con entradas patológicas. Texto plano antes
    // que una pantalla en blanco.
    return null;
  }
}
