// ============================================================================
// Syntax highlighting
// ----------------------------------------------------------------------------
// Prism is already a dependency of the suite (codecard uses it) and was sitting
// unused here while code blocks rendered as flat grey text. It is loaded lazily
// and only once: nobody pays for a grammar bundle before they have written a
// fenced block, and a document with no code never loads it at all.
//
// The renderer takes a `highlight` callback, so the same tokens end up in the
// preview, in the exported HTML file and on the printed page.
// ============================================================================

let prism: any = null;
let loading: Promise<any> | null = null;

/** Aliases people actually type in a fence, mapped to Prism's grammar names. */
const ALIASES: Record<string, string> = {
  js: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  tsx: 'tsx',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  console: 'bash',
  py: 'python',
  rb: 'ruby',
  yml: 'yaml',
  html: 'markup',
  xml: 'markup',
  svg: 'markup',
  vue: 'markup',
  md: 'markdown',
  'c++': 'cpp',
  cs: 'csharp',
  golang: 'go',
  dockerfile: 'docker',
  text: '',
  plain: '',
  txt: '',
};

export function normalizeLang(lang: string): string {
  const key = lang.toLowerCase();
  return ALIASES[key] !== undefined ? ALIASES[key] : key;
}

export function loadPrism(): Promise<any> {
  if (prism) return Promise.resolve(prism);
  if (loading) return loading;

  loading = (async () => {
    const module = (await import('prismjs')) as any;
    const core = module.default || module;

    // `manual` stops Prism from scanning the whole document on load, which
    // would fight React over the preview's DOM.
    core.manual = true;
    // The grammar files are side-effect modules that register themselves on the
    // *global* `Prism`. Publishing it before they are imported is not optional:
    // load them first and every language silently fails to register.
    (window as any).Prism = core;

    // Order is load-bearing. Prism's grammar files are side-effect modules that
    // reach into the grammars they extend, and two of them bite if loaded on
    // their own: `prism-cpp` writes into `prism-c`'s object, and `prism-php`
    // registers a *global* hook that runs on every highlight call and reaches
    // into `markup-templating`. Import either without its base and Prism throws
    // for every language, not just for that one.
    await import('prismjs/components/prism-markup');
    await import('prismjs/components/prism-css');
    await import('prismjs/components/prism-clike');
    await import('prismjs/components/prism-javascript');
    await import('prismjs/components/prism-markup-templating');
    await import('prismjs/components/prism-c');
    await import('prismjs/components/prism-jsx');
    await import('prismjs/components/prism-typescript');

    // Everything from here only depends on what is already in.
    await Promise.all([
      import('prismjs/components/prism-tsx'),
      import('prismjs/components/prism-json'),
      import('prismjs/components/prism-bash'),
      import('prismjs/components/prism-python'),
      import('prismjs/components/prism-java'),
      import('prismjs/components/prism-go'),
      import('prismjs/components/prism-rust'),
      import('prismjs/components/prism-sql'),
      import('prismjs/components/prism-yaml'),
      import('prismjs/components/prism-markdown'),
      import('prismjs/components/prism-cpp'),
      import('prismjs/components/prism-csharp'),
      import('prismjs/components/prism-php'),
      import('prismjs/components/prism-ruby'),
      import('prismjs/components/prism-docker'),
      import('prismjs/components/prism-diff'),
      import('prismjs/components/prism-ini'),
      import('prismjs/components/prism-toml'),
    ]);
    prism = core;
    return core;
  })().catch(error => {
    // A blocked chunk must not take the preview down with it: without Prism the
    // renderer simply escapes the code, which is what it did before anyway.
    if (import.meta.env.DEV) console.warn('[markdown-live] syntax highlighting unavailable:', error);
    loading = null;
    return null;
  });

  return loading;
}

/** Synchronous highlighter for the renderer. Returns null until Prism is in. */
export function highlight(code: string, lang: string): string | null {
  if (!prism || !lang) return null;
  const grammar = prism.languages[normalizeLang(lang)];
  if (!grammar) return null;
  try {
    return prism.highlight(code, grammar, normalizeLang(lang));
  } catch {
    return null;
  }
}

/** True once the grammars are in memory, so a re-render can be scheduled. */
export const prismReady = (): boolean => prism !== null;
