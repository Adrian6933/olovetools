// ============================================================================
// LoremFlow - placeholder text model
// ============================================================================

/** What the count refers to. */
export type Unit = 'paragraphs' | 'sentences' | 'words' | 'characters';

export const UNITS: Unit[] = ['paragraphs', 'sentences', 'words', 'characters'];

/**
 * Which script the filler is written in.
 *
 * Latin filler tells you nothing about how a layout behaves in Japanese, where
 * lines break between characters, or in Arabic, which runs right to left. On a
 * site shipped in nine languages that is the whole point of the tool.
 */
export type Script =
  | 'latin'
  | 'spanish'
  | 'japanese'
  | 'chinese'
  | 'russian'
  | 'hindi'
  | 'greek'
  | 'arabic'
  | 'emojiless';

export const SCRIPTS: Script[] = [
  'latin',
  'spanish',
  'japanese',
  'chinese',
  'russian',
  'hindi',
  'greek',
  'arabic',
];

export type Format = 'text' | 'html' | 'markdown';

export const FORMATS: Format[] = ['text', 'html', 'markdown'];

export interface Options {
  unit: Unit;
  count: number;
  script: Script;
  format: Format;
  /** Open with the canonical "Lorem ipsum dolor sit amet…" (Latin only). */
  startClassic: boolean;
  /** Sprinkle headings and lists through the output, for structural mock-ups. */
  richStructure: boolean;
  /** Empty means "new every time"; anything else makes the output repeatable. */
  seed: string;
}

export const DEFAULTS: Options = {
  unit: 'paragraphs',
  count: 5,
  script: 'latin',
  format: 'text',
  startClassic: true,
  richStructure: false,
  seed: '',
};

/** Upper bounds, so a stray keystroke cannot ask for a million paragraphs. */
export const MAX_COUNT: Record<Unit, number> = {
  paragraphs: 200,
  sentences: 500,
  words: 5000,
  characters: 20000,
};

export interface ScriptMeta {
  id: Script;
  /** Endonym: the language's own name, which is what a typographer looks for. */
  label: string;
  /** Right-to-left, so the output box has to be flipped. */
  rtl: boolean;
  /** Scripts that do not put spaces between words break lines differently. */
  spaced: boolean;
  sentenceEnd: string;
  comma: string;
}
