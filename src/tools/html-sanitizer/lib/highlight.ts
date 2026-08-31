// ============================================================================
// Markup highlighting for the output pane
// ----------------------------------------------------------------------------
// prismjs is already a dependency of the repo and the `markup` grammar ships
// inside its core bundle, so no extra grammar import is needed here — unlike
// diffsnap, which has to order php/cpp imports after their base grammars.
//
// Loaded lazily: nobody cleaning three lines of HTML should pay for a
// tokenizer, and the pane falls back to plain monospace if it never arrives.
// ============================================================================

type PrismLike = {
  languages: Record<string, unknown>;
  tokenize: (text: string, grammar: unknown) => unknown[];
};

let prism: PrismLike | null = null;
let loading: Promise<void> | null = null;

/** Above this the tokenizer costs more than the colour is worth. */
export const HIGHLIGHT_LIMIT = 200_000;

export async function ensurePrism(): Promise<boolean> {
  if (prism) return true;
  if (!loading) {
    loading = (async () => {
      try {
        prism = (await import('prismjs')).default as unknown as PrismLike;
      } catch {
        prism = null;
      }
    })();
  }
  await loading;
  loading = null;
  return !!prism;
}

export interface Span {
  text: string;
  type: string;
}

interface PrismToken {
  type: string;
  content: unknown;
}

const isToken = (value: unknown): value is PrismToken =>
  typeof value === 'object' && value !== null && 'type' in value && 'content' in value;

/** Flattens Prism's nested token tree into plain coloured spans. */
export function tokenize(code: string): Span[] {
  if (!prism || code.length > HIGHLIGHT_LIMIT) return [{ text: code, type: '' }];
  const grammar = prism.languages.markup;
  if (!grammar) return [{ text: code, type: '' }];

  let tokens: unknown[];
  try {
    tokens = prism.tokenize(code, grammar);
  } catch {
    return [{ text: code, type: '' }];
  }

  const spans: Span[] = [];
  const push = (text: string, type: string) => {
    if (!text) return;
    const last = spans[spans.length - 1];
    if (last && last.type === type) last.text += text;
    else spans.push({ text, type });
  };

  const walk = (nodes: unknown[], inherited: string) => {
    for (const node of nodes) {
      if (typeof node === 'string') push(node, inherited);
      else if (isToken(node)) {
        const type = node.type || inherited;
        if (Array.isArray(node.content)) walk(node.content, type);
        else if (typeof node.content === 'string') push(node.content, type);
        else if (isToken(node.content)) walk([node.content], type);
      }
    }
  };

  walk(tokens, '');
  return spans;
}

/** Tailwind colour per Prism token type, matched to the tool's cyan palette. */
export const TOKEN_CLASS: Record<string, string> = {
  comment: 'text-slate-500 italic',
  prolog: 'text-slate-500',
  doctype: 'text-slate-500',
  cdata: 'text-slate-500',
  punctuation: 'text-slate-500',
  tag: 'text-rose-300',
  'attr-name': 'text-cyan-300',
  'attr-value': 'text-teal-200',
  string: 'text-teal-200',
  entity: 'text-amber-300',
  namespace: 'text-slate-400',
  script: 'text-yellow-200',
  style: 'text-violet-300',
};
