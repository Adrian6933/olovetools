// ============================================================================
// Catálogo de lenguajes de CodeCard
// ----------------------------------------------------------------------------
// Un lenguaje = un id de gramática de Prism + su etiqueta + las extensiones de
// fichero que lo delatan. `requires` replica el campo `require` de
// node_modules/prismjs/components.json: NO es decorativo. Cargar
// `prism-cpp` sin `prism-c` delante lanza un TypeError dentro del componente
// (`Prism.languages.extend('c', …)` sobre un `undefined`) que aborta la carga
// entera. Eso es exactamente lo que le pasaba a esta herramienta: el resaltado
// no funcionaba en NINGÚN lenguaje porque cpp reventaba la cadena de imports.
// ============================================================================

export interface LanguageDef {
  /** Id de gramática de Prism (`Prism.languages[id]`). */
  id: string;
  label: string;
  /** Gramáticas que deben estar cargadas ANTES que esta. */
  requires?: string[];
  /** Extensiones de fichero, sin punto, para autodetección. */
  ext: string[];
  /** Nombre de archivo por defecto que se propone al elegir el lenguaje. */
  sample: string;
}

export const LANGUAGES: LanguageDef[] = [
  { id: 'javascript', label: 'JavaScript', requires: ['clike'], ext: ['js', 'mjs', 'cjs'], sample: 'index.js' },
  { id: 'typescript', label: 'TypeScript', requires: ['clike', 'javascript'], ext: ['ts', 'mts', 'cts'], sample: 'index.ts' },
  { id: 'jsx', label: 'JSX', requires: ['markup', 'clike', 'javascript'], ext: ['jsx'], sample: 'App.jsx' },
  { id: 'tsx', label: 'TSX', requires: ['markup', 'clike', 'javascript', 'typescript', 'jsx'], ext: ['tsx'], sample: 'App.tsx' },
  { id: 'python', label: 'Python', ext: ['py', 'pyi', 'pyw'], sample: 'main.py' },
  { id: 'java', label: 'Java', requires: ['clike'], ext: ['java'], sample: 'Main.java' },
  { id: 'kotlin', label: 'Kotlin', requires: ['clike'], ext: ['kt', 'kts'], sample: 'Main.kt' },
  { id: 'scala', label: 'Scala', requires: ['clike', 'java'], ext: ['scala', 'sc'], sample: 'Main.scala' },
  { id: 'csharp', label: 'C#', requires: ['clike'], ext: ['cs'], sample: 'Program.cs' },
  { id: 'c', label: 'C', requires: ['clike'], ext: ['c', 'h'], sample: 'main.c' },
  { id: 'cpp', label: 'C++', requires: ['clike', 'c'], ext: ['cpp', 'cc', 'cxx', 'hpp', 'hh'], sample: 'main.cpp' },
  { id: 'objectivec', label: 'Objective-C', requires: ['clike', 'c'], ext: ['m', 'mm'], sample: 'main.m' },
  { id: 'go', label: 'Go', requires: ['clike'], ext: ['go'], sample: 'main.go' },
  { id: 'rust', label: 'Rust', ext: ['rs'], sample: 'main.rs' },
  { id: 'zig', label: 'Zig', ext: ['zig'], sample: 'main.zig' },
  { id: 'swift', label: 'Swift', ext: ['swift'], sample: 'main.swift' },
  { id: 'dart', label: 'Dart', requires: ['clike'], ext: ['dart'], sample: 'main.dart' },
  { id: 'ruby', label: 'Ruby', requires: ['clike'], ext: ['rb', 'rake', 'gemspec'], sample: 'app.rb' },
  { id: 'php', label: 'PHP', requires: ['markup', 'markup-templating'], ext: ['php', 'phtml'], sample: 'index.php' },
  { id: 'perl', label: 'Perl', ext: ['pl', 'pm'], sample: 'script.pl' },
  { id: 'lua', label: 'Lua', ext: ['lua'], sample: 'init.lua' },
  { id: 'elixir', label: 'Elixir', ext: ['ex', 'exs'], sample: 'app.ex' },
  { id: 'haskell', label: 'Haskell', ext: ['hs', 'lhs'], sample: 'Main.hs' },
  { id: 'julia', label: 'Julia', ext: ['jl'], sample: 'main.jl' },
  { id: 'r', label: 'R', ext: ['r'], sample: 'analysis.R' },
  { id: 'matlab', label: 'MATLAB', ext: ['mat'], sample: 'script.m' },
  { id: 'solidity', label: 'Solidity', requires: ['clike'], ext: ['sol'], sample: 'Token.sol' },
  { id: 'markup', label: 'HTML / XML / SVG', ext: ['html', 'htm', 'xml', 'svg', 'xhtml', 'vue', 'rss', 'atom'], sample: 'index.html' },
  { id: 'css', label: 'CSS', ext: ['css'], sample: 'styles.css' },
  { id: 'graphql', label: 'GraphQL', ext: ['graphql', 'gql'], sample: 'schema.graphql' },
  { id: 'sql', label: 'SQL', ext: ['sql'], sample: 'query.sql' },
  { id: 'json', label: 'JSON', ext: ['json', 'jsonc', 'webmanifest'], sample: 'package.json' },
  { id: 'yaml', label: 'YAML', ext: ['yml', 'yaml'], sample: 'config.yml' },
  { id: 'toml', label: 'TOML', ext: ['toml'], sample: 'Cargo.toml' },
  { id: 'ini', label: 'INI', ext: ['ini', 'cfg', 'conf', 'env', 'properties'], sample: 'settings.ini' },
  { id: 'hcl', label: 'HCL / Terraform', ext: ['tf', 'hcl', 'tfvars'], sample: 'main.tf' },
  { id: 'protobuf', label: 'Protocol Buffers', requires: ['clike'], ext: ['proto'], sample: 'service.proto' },
  { id: 'bash', label: 'Bash / Shell', ext: ['sh', 'bash', 'zsh', 'ksh'], sample: 'deploy.sh' },
  { id: 'powershell', label: 'PowerShell', ext: ['ps1', 'psm1'], sample: 'deploy.ps1' },
  { id: 'docker', label: 'Dockerfile', ext: ['dockerfile'], sample: 'Dockerfile' },
  { id: 'nginx', label: 'nginx', ext: ['nginx'], sample: 'nginx.conf' },
  { id: 'makefile', label: 'Makefile', ext: ['mk', 'make'], sample: 'Makefile' },
  { id: 'markdown', label: 'Markdown', requires: ['markup'], ext: ['md', 'mdx', 'markdown'], sample: 'README.md' },
  { id: 'diff', label: 'Diff / Patch', ext: ['diff', 'patch'], sample: 'change.diff' },
  { id: 'git', label: 'Git', ext: ['gitignore', 'gitattributes'], sample: '.gitignore' },
  { id: 'http', label: 'HTTP', ext: ['http'], sample: 'request.http' },
  { id: 'regex', label: 'Regex', ext: ['regex'], sample: 'pattern.regex' },
  { id: 'vim', label: 'Vim script', ext: ['vim'], sample: '.vimrc' },
];

/** Ids en el orden en que se muestran, agrupados para el <optgroup>. */
export const LANGUAGE_GROUPS: { key: string; ids: string[] }[] = [
  { key: 'groupWeb', ids: ['javascript', 'typescript', 'jsx', 'tsx', 'markup', 'css', 'graphql', 'php'] },
  { key: 'groupSystems', ids: ['c', 'cpp', 'rust', 'go', 'zig', 'objectivec', 'swift'] },
  { key: 'groupApps', ids: ['python', 'java', 'kotlin', 'scala', 'csharp', 'dart', 'ruby', 'elixir', 'haskell', 'perl', 'lua', 'julia', 'r', 'matlab', 'solidity'] },
  { key: 'groupData', ids: ['sql', 'json', 'yaml', 'toml', 'ini', 'hcl', 'protobuf'] },
  { key: 'groupOps', ids: ['bash', 'powershell', 'docker', 'nginx', 'makefile', 'http', 'vim'] },
  { key: 'groupText', ids: ['markdown', 'diff', 'git', 'regex'] },
];

const BY_ID = new Map(LANGUAGES.map(l => [l.id, l]));
export const getLanguage = (id: string): LanguageDef | undefined => BY_ID.get(id);

/** Extensión → id de gramática. La primera declaración gana. */
const BY_EXT = new Map<string, string>();
for (const l of LANGUAGES) for (const e of l.ext) if (!BY_EXT.has(e)) BY_EXT.set(e, l.id);

/** Nombres de archivo completos que no tienen extensión útil. */
const BY_FILENAME: Record<string, string> = {
  dockerfile: 'docker',
  makefile: 'makefile',
  gnumakefile: 'makefile',
  '.gitignore': 'git',
  '.gitattributes': 'git',
  '.vimrc': 'vim',
  '.env': 'ini',
  'nginx.conf': 'nginx',
  'cargo.toml': 'toml',
  'gemfile': 'ruby',
  'rakefile': 'ruby',
};

/**
 * Adivina el lenguaje de un fichero. Primero por nombre completo (Dockerfile,
 * Makefile…), luego por extensión, y como último recurso por el shebang, que es
 * lo único que identifica a un script sin extensión.
 */
export function detectLanguage(fileName: string, contents?: string): string | null {
  const clean = fileName.trim().toLowerCase();
  if (BY_FILENAME[clean]) return BY_FILENAME[clean];

  const dot = clean.lastIndexOf('.');
  if (dot > -1) {
    const ext = clean.slice(dot + 1);
    if (BY_EXT.has(ext)) return BY_EXT.get(ext)!;
  }

  const firstLine = (contents || '').slice(0, 200).split('\n')[0];
  if (firstLine.startsWith('#!')) {
    const shebang = firstLine.toLowerCase();
    if (/\b(bash|sh|zsh|ksh|dash)\b/.test(shebang)) return 'bash';
    if (/\bpython[0-9.]*\b/.test(shebang)) return 'python';
    if (/\bnode\b/.test(shebang)) return 'javascript';
    if (/\bruby\b/.test(shebang)) return 'ruby';
    if (/\bperl\b/.test(shebang)) return 'perl';
    if (/\bpwsh\b/.test(shebang)) return 'powershell';
  }
  return null;
}
