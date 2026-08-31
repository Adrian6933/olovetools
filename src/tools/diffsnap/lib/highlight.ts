// ============================================================================
// Syntax highlighting for the diff panes.
// ----------------------------------------------------------------------------
// The FAQ used to promise this "in a future update" while prismjs was already
// a dependency of the repo. It is loaded lazily — nobody comparing two shopping
// lists should pay for a tokenizer — and only the grammar the file needs.
//
// Prism returns a nested token tree; the diff needs flat character ranges so
// the word-level change highlight and the syntax colour can be painted on the
// same line without one destroying the other.
// ============================================================================

export type LanguageId =
  | 'auto'
  | 'none'
  | 'javascript'
  | 'typescript'
  | 'jsx'
  | 'tsx'
  | 'json'
  | 'markup'
  | 'css'
  | 'python'
  | 'sql'
  | 'yaml'
  | 'markdown'
  | 'bash'
  | 'go'
  | 'rust'
  | 'java'
  | 'cpp'
  | 'csharp'
  | 'php'
  | 'ruby'
  | 'toml'
  | 'ini'
  | 'diff';

export const LANGUAGES: { id: LanguageId; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'none', label: 'Plain text' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'jsx', label: 'JSX' },
  { id: 'tsx', label: 'TSX' },
  { id: 'json', label: 'JSON' },
  { id: 'markup', label: 'HTML / XML' },
  { id: 'css', label: 'CSS' },
  { id: 'python', label: 'Python' },
  { id: 'sql', label: 'SQL' },
  { id: 'yaml', label: 'YAML' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'bash', label: 'Shell' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C / C++' },
  { id: 'csharp', label: 'C#' },
  { id: 'php', label: 'PHP' },
  { id: 'ruby', label: 'Ruby' },
  { id: 'toml', label: 'TOML' },
  { id: 'ini', label: 'INI' },
  { id: 'diff', label: 'Diff / patch' },
];

const BY_EXTENSION: Record<string, LanguageId> = {
  '.js': 'javascript', '.mjs': 'javascript', '.cjs': 'javascript',
  '.jsx': 'jsx', '.ts': 'typescript', '.tsx': 'tsx',
  '.json': 'json', '.jsonc': 'json', '.json5': 'json', '.jsonl': 'json', '.ndjson': 'json',
  '.html': 'markup', '.htm': 'markup', '.xml': 'markup', '.svg': 'markup',
  '.vue': 'markup', '.svelte': 'markup', '.astro': 'markup',
  '.css': 'css', '.scss': 'css', '.sass': 'css', '.less': 'css',
  '.py': 'python', '.sql': 'sql', '.yml': 'yaml', '.yaml': 'yaml',
  '.md': 'markdown', '.markdown': 'markdown',
  '.sh': 'bash', '.bash': 'bash', '.zsh': 'bash',
  '.go': 'go', '.rs': 'rust', '.java': 'java', '.kt': 'java',
  '.c': 'cpp', '.h': 'cpp', '.cpp': 'cpp', '.hpp': 'cpp',
  '.cs': 'csharp', '.php': 'php', '.rb': 'ruby',
  '.toml': 'toml', '.ini': 'ini', '.conf': 'ini', '.env': 'ini',
  '.diff': 'diff', '.patch': 'diff',
};

export function languageForExtension(extension: string): LanguageId | null {
  return BY_EXTENSION[extension] ?? null;
}

/** Cheap shape sniffing for pasted text, used when the language is on "Auto". */
export function guessLanguage(text: string): LanguageId {
  const head = text.slice(0, 4000);
  if (!head.trim()) return 'none';
  if (/^\s*[[{]/.test(head) && /["}\]]\s*$/.test(text.trimEnd())) return 'json';
  if (/^\s*(---|\+\+\+|@@ )/m.test(head)) return 'diff';
  if (/^\s*<(\?xml|!doctype|html|svg|div|template)/i.test(head)) return 'markup';
  if (/^#!.*\b(bash|sh|zsh)\b/.test(head)) return 'bash';
  if (/\b(interface|type)\s+\w+\s*[={]|:\s*(string|number|boolean)\b/.test(head)) return 'typescript';
  if (/\b(function|const|let|=>|import .* from)\b/.test(head)) return 'javascript';
  if (/^\s*(def|class)\s+\w+.*:\s*$/m.test(head) || /^\s*import \w+$/m.test(head)) return 'python';
  if (/\b(SELECT|INSERT INTO|CREATE TABLE|UPDATE)\b/i.test(head)) return 'sql';
  if (/^[\w-]+:\s*(\S|$)/m.test(head) && !/[;{]/.test(head)) return 'yaml';
  if (/^\s*#{1,6}\s+\S|^\s*[-*]\s+\S/m.test(head)) return 'markdown';
  if (/^[.#@][\w-]+\s*\{/m.test(head)) return 'css';
  return 'none';
}

/** A flat, non-overlapping slice of a line with a Prism token type. */
export interface TokenRange {
  start: number;
  end: number;
  type: string;
}

type PrismLike = {
  languages: Record<string, unknown>;
  tokenize: (text: string, grammar: unknown) => unknown[];
};

let prism: PrismLike | null = null;
const loaded = new Set<string>();
let loading: Promise<void> | null = null;

/**
 * Ordered grammar imports per language. Order matters: prism-tsx extends jsx
 * and typescript, and loading it first throws. markup, css, clike and
 * javascript already ship inside the core bundle, so they have no entry here.
 */
const GRAMMAR_IMPORTS: Partial<Record<LanguageId, (() => Promise<unknown>)[]>> = {
  typescript: [() => import('prismjs/components/prism-typescript')],
  jsx: [() => import('prismjs/components/prism-jsx')],
  tsx: [
    () => import('prismjs/components/prism-jsx'),
    () => import('prismjs/components/prism-typescript'),
    () => import('prismjs/components/prism-tsx'),
  ],
  json: [() => import('prismjs/components/prism-json')],
  python: [() => import('prismjs/components/prism-python')],
  sql: [() => import('prismjs/components/prism-sql')],
  yaml: [() => import('prismjs/components/prism-yaml')],
  markdown: [() => import('prismjs/components/prism-markdown')],
  bash: [() => import('prismjs/components/prism-bash')],
  go: [() => import('prismjs/components/prism-go')],
  rust: [() => import('prismjs/components/prism-rust')],
  java: [() => import('prismjs/components/prism-java')],
  cpp: [() => import('prismjs/components/prism-c'), () => import('prismjs/components/prism-cpp')],
  csharp: [() => import('prismjs/components/prism-csharp')],
  php: [
    () => import('prismjs/components/prism-markup-templating'),
    () => import('prismjs/components/prism-php'),
  ],
  ruby: [() => import('prismjs/components/prism-ruby')],
  toml: [() => import('prismjs/components/prism-toml')],
  ini: [() => import('prismjs/components/prism-ini')],
  diff: [() => import('prismjs/components/prism-diff')],
};

/** Loads Prism and one grammar. Resolves to false when the language is off. */
export async function ensureGrammar(language: LanguageId): Promise<boolean> {
  if (language === 'none' || language === 'auto') return false;
  if (loaded.has(language)) return !!prism?.languages[language];

  // Two panes asking for the same grammar at once must not race the loader.
  while (loading) await loading;
  if (loaded.has(language)) return !!prism?.languages[language];

  loading = (async () => {
    if (!prism) {
      prism = (await import('prismjs')).default as unknown as PrismLike;
    }
    for (const load of GRAMMAR_IMPORTS[language] ?? []) {
      try {
        await load();
      } catch {
        // A grammar that fails to load is not worth breaking the diff over:
        // the pane falls back to plain monospace text.
      }
    }
    loaded.add(language);
  })();

  try {
    await loading;
  } finally {
    loading = null;
  }

  return !!prism && !!prism.languages[language];
}

interface PrismToken {
  type: string;
  content: unknown;
  length: number;
}

const isToken = (value: unknown): value is PrismToken =>
  typeof value === 'object' && value !== null && 'type' in value && 'content' in value;

/**
 * Flattens Prism's nested tokens into ranges. Nested tokens win over their
 * parent, so `string` inside `template-string` still reads as a string.
 */
export function tokenizeLine(line: string, language: LanguageId): TokenRange[] {
  if (!prism || language === 'none' || language === 'auto') return [];
  const grammar = prism.languages[language];
  if (!grammar) return [];

  let tokens: unknown[];
  try {
    tokens = prism.tokenize(line, grammar);
  } catch {
    return [];
  }

  const ranges: TokenRange[] = [];
  let at = 0;

  const walk = (nodes: unknown[], inherited: string) => {
    for (const node of nodes) {
      if (typeof node === 'string') {
        if (node.length > 0 && inherited) ranges.push({ start: at, end: at + node.length, type: inherited });
        at += node.length;
      } else if (isToken(node)) {
        const type = node.type || inherited;
        if (Array.isArray(node.content)) walk(node.content, type);
        else if (typeof node.content === 'string') {
          if (node.content.length > 0) ranges.push({ start: at, end: at + node.content.length, type });
          at += node.content.length;
        } else if (isToken(node.content)) {
          walk([node.content], type);
        }
      }
    }
  };

  walk(tokens, '');
  return ranges;
}

/** Tailwind colour per Prism token type, matched to the tool's cyan palette. */
export const TOKEN_CLASS: Record<string, string> = {
  comment: 'text-slate-500 italic',
  prolog: 'text-slate-500',
  doctype: 'text-slate-500',
  cdata: 'text-slate-500',
  punctuation: 'text-slate-500',
  property: 'text-cyan-300',
  tag: 'text-rose-300',
  boolean: 'text-orange-300',
  number: 'text-orange-300',
  constant: 'text-orange-300',
  symbol: 'text-orange-300',
  deleted: 'text-rose-300',
  selector: 'text-teal-300',
  'attr-name': 'text-teal-300',
  string: 'text-teal-300',
  char: 'text-teal-300',
  builtin: 'text-teal-300',
  inserted: 'text-emerald-300',
  operator: 'text-sky-300',
  entity: 'text-sky-300',
  url: 'text-sky-300',
  variable: 'text-sky-300',
  atrule: 'text-violet-300',
  'attr-value': 'text-teal-300',
  keyword: 'text-violet-300',
  function: 'text-yellow-200',
  'class-name': 'text-yellow-200',
  regex: 'text-amber-300',
  important: 'text-amber-300',
  namespace: 'text-slate-400',
};
