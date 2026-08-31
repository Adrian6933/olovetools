import type { LangId, ToneKey } from './lib/lexicon';

export type { LangId, ToneKey };

/** One reversible edit, stored as the changed slice only. */
export interface TextPatch {
  at: number;
  removed: string;
  inserted: string;
}

export interface Token {
  /** As written, so the keyword table can show the real casing back. */
  text: string;
  /** Lowercased and accent-folded, for every lookup. */
  folded: string;
  start: number;
  end: number;
}

export interface SentenceInfo {
  start: number;
  end: number;
  words: number;
  syllables: number;
  /** Flesch–Kincaid grade for this sentence alone. */
  grade: number;
}

export type IssueKind =
  | 'veryLongSentence'
  | 'longSentence'
  | 'passive'
  | 'adverb'
  | 'filler'
  | 'complexWord'
  | 'repeatedWord'
  | 'whitespace';

export interface Issue {
  kind: IssueKind;
  start: number;
  end: number;
  /** For complex words: the shorter suggestion. */
  hint?: string;
}

export interface FormulaResult {
  id: 'flesch' | 'fleschKincaid' | 'ari' | 'gunningFog' | 'colemanLiau' | 'smog' | 'lix' | 'huerta';
  /** Raw score as the formula defines it. */
  score: number;
  /** School years of education implied, when the formula expresses one. */
  grade: number | null;
}

export interface Readability {
  formulas: FormulaResult[];
  /** The formula that suits the detected language. */
  primary: FormulaResult['id'];
  /** 0–100 ease, normalised across formulas so every language gets a band. */
  ease: number;
  /** 0–6 index into the seven readability labels. */
  band: number;
  grade: number | null;
  /** False for scripts where school-grade formulas mean nothing (ja, zh, hi). */
  gradeMeaningful: boolean;
}

export interface KeywordRow {
  phrase: string;
  count: number;
  /** Share of all counted words, as a percentage. */
  density: number;
}

export interface Sentiment {
  positive: number;
  neutral: number;
  negative: number;
  /** −100 … +100. */
  polarity: number;
  matches: number;
  top: { word: string; score: number; count: number }[];
}

export type ToneProfile = Record<ToneKey, number> & { dominant: ToneKey | null };

export interface Counts {
  words: number;
  uniqueWords: number;
  chars: number;
  charsNoSpaces: number;
  letters: number;
  digits: number;
  punctuation: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  syllables: number;
  longestWord: string;
  avgWordChars: number;
  avgSentenceWords: number;
  /** Unique words over total words, 0–100. */
  lexicalDiversity: number;
  /** Words that appear exactly once. */
  hapax: number;
  bytes: number;
}

export interface Analysis {
  /** Length of the text this analysis describes, to detect a stale result. */
  length: number;
  lang: LangId;
  langConfident: boolean;
  counts: Counts;
  readability: Readability;
  sentences: SentenceInfo[];
  issues: Issue[];
  issueCounts: Record<IssueKind, number>;
  keywords: { one: KeywordRow[]; two: KeywordRow[]; three: KeywordRow[] };
  sentiment: Sentiment;
  tone: ToneProfile;
  /** Cut short because the text was past the deep-analysis ceiling. */
  truncated: boolean;
}

export interface WorkerRequest {
  id: number;
  text: string;
  /** null = auto-detect. */
  lang: LangId | null;
}

export interface WorkerResponse {
  id: number;
  analysis: Analysis;
}
