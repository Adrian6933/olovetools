// ============================================================================
// The analyser.
// ----------------------------------------------------------------------------
// What changed against the old build, in order of how much it mattered:
//
//  * Words and sentences come from `Intl.Segmenter`, the ICU segmenter every
//    browser already ships and nobody uses. `split(/\s+/)` cannot tell that
//    "don't" is one word, and `split(/[.!?]+/)` turns "$3.50" into two
//    sentences; for Japanese and Chinese the old code counted one word per
//    glyph, which is not what a word is in either language.
//  * Every lookup is done on whole, accent-folded tokens (see lexicon.ts).
//  * Seven readability formulas instead of one, and the one that is reported
//    first depends on the language — US school grades are meaningless for
//    Japanese, so those get LIX.
//  * Sentence-level grading and a prose-issue pass (passive voice, adverbs,
//    hedges, long-winded words, repetition) so the result can be pointed at
//    instead of being one number in a box.
//
// Everything here is pure: same string in, same object out, no DOM. That is
// what lets it run in a worker without a second code path.
// ============================================================================

import {
  DETECTOR_MARKERS,
  FALLBACK_STOPWORDS,
  TONE_KEYS,
  fold,
  packFor,
  type LangId,
  type ToneKey,
} from './lexicon';
import type {
  Analysis,
  Counts,
  FormulaResult,
  Issue,
  IssueKind,
  KeywordRow,
  Readability,
  SentenceInfo,
  Sentiment,
  Token,
  ToneProfile,
} from '../types';

/** Past this the deep pass is skipped and only the counters are reported. */
export const DEEP_LIMIT = 400_000;
/** Above this the tool stops analysing as you type and waits for the button. */
export const AUTO_LIMIT = 60_000;
/** Highlighting mirrors the whole document in a second DOM tree; cap it. */
export const HIGHLIGHT_LIMIT = 120_000;

const MAX_ISSUES = 4000;
const MAX_SENTENCES = 20_000;

// ---------------------------------------------------------------------------
// Folding that keeps offsets
// ---------------------------------------------------------------------------
const CHAR_FOLD = new Map<string, string>();
const COMBINING = new RegExp(`[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`, 'g');

/**
 * Lowercases and strips accents **without changing the length**, so a regex hit
 * on the folded copy still points at the right characters of the original.
 * NFD normalisation on its own cannot do this: "é" becomes two code units.
 */
export function foldPreserving(text: string): string {
  let out = '';
  for (const ch of text) {
    let mapped = CHAR_FOLD.get(ch);
    if (mapped === undefined) {
      const stripped = ch.normalize('NFD').replace(COMBINING, '');
      const lowered = (stripped.length === 1 ? stripped : ch).toLowerCase();
      mapped = lowered.length === ch.length ? lowered : ch;
      CHAR_FOLD.set(ch, mapped);
    }
    out += mapped;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Segmentation
// ---------------------------------------------------------------------------
type SegmenterCtor = typeof Intl.Segmenter;
const hasSegmenter = typeof Intl !== 'undefined' && typeof (Intl as { Segmenter?: SegmenterCtor }).Segmenter === 'function';
const segmenterCache = new Map<string, Intl.Segmenter>();

function segmenter(locale: string, granularity: 'word' | 'sentence'): Intl.Segmenter | null {
  if (!hasSegmenter) return null;
  const key = `${locale}:${granularity}`;
  let found = segmenterCache.get(key);
  if (!found) {
    try {
      found = new Intl.Segmenter(locale, { granularity });
    } catch {
      return null;
    }
    segmenterCache.set(key, found);
  }
  return found;
}

const LOCALE: Record<LangId, string> = {
  en: 'en', es: 'es', fr: 'fr', de: 'de', pt: 'pt', ru: 'ru', hi: 'hi', ja: 'ja', zh: 'zh', other: 'en',
};

/** Letters, digits and the marks that live inside words, for the fallback path. */
const WORDLIKE = new RegExp("[\\p{L}\\p{N}][\\p{L}\\p{N}'’‐‑­-]*", 'gu');

export function tokenize(text: string, lang: LangId): Token[] {
  const tokens: Token[] = [];
  const seg = segmenter(LOCALE[lang], 'word');

  if (seg) {
    for (const part of seg.segment(text)) {
      if (!part.isWordLike) continue;
      const raw = part.segment;
      // ICU emits punctuation-only runs as non-word already; this drops the
      // leftovers (a lone apostrophe inside a quote) that still slip through.
      if (!/[\p{L}\p{N}]/u.test(raw)) continue;
      tokens.push({ text: raw, folded: fold(raw), start: part.index, end: part.index + raw.length });
    }
    return tokens;
  }

  WORDLIKE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = WORDLIKE.exec(text))) {
    tokens.push({
      text: match[0],
      folded: fold(match[0]),
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return tokens;
}

interface RawSentence {
  start: number;
  end: number;
}

export function splitSentences(text: string, lang: LangId): RawSentence[] {
  const out: RawSentence[] = [];
  const seg = segmenter(LOCALE[lang], 'sentence');

  if (seg) {
    for (const part of seg.segment(text)) {
      const trimmedStart = part.segment.length - part.segment.trimStart().length;
      const trimmedEnd = part.segment.length - part.segment.trimEnd().length;
      const start = part.index + trimmedStart;
      const end = part.index + part.segment.length - trimmedEnd;
      if (end > start) out.push({ start, end });
      if (out.length >= MAX_SENTENCES) break;
    }
    return out;
  }

  // Fallback: terminator followed by whitespace, so "3.14" survives.
  const re = /[^.!?。！？…\n]+(?:[.!?。！？…]+|\n|$)/gu;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    const chunk = match[0];
    const lead = chunk.length - chunk.trimStart().length;
    const tail = chunk.length - chunk.trimEnd().length;
    const start = match.index + lead;
    const end = match.index + chunk.length - tail;
    if (end > start) out.push({ start, end });
    if (out.length >= MAX_SENTENCES) break;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Language detection
// ---------------------------------------------------------------------------
const SCRIPTS: [LangId, RegExp][] = [
  ['ru', /\p{Script=Cyrillic}/u],
  ['hi', /\p{Script=Devanagari}/u],
  ['ja', /[\p{Script=Hiragana}\p{Script=Katakana}]/u],
  ['zh', /\p{Script=Han}/u],
];

export function detectLanguage(text: string, tokens: Token[]): { lang: LangId; confident: boolean } {
  const sample = text.length > 20_000 ? text.slice(0, 20_000) : text;
  const counts: Record<string, number> = { latin: 0, ru: 0, hi: 0, ja: 0, zh: 0 };

  for (const ch of sample) {
    if (/\p{Script=Latin}/u.test(ch)) counts.latin++;
    else {
      for (const [id, re] of SCRIPTS) {
        if (re.test(ch)) {
          counts[id]++;
          break;
        }
      }
    }
  }

  // Japanese is Han plus kana; any meaningful kana share settles it.
  if (counts.ja > 0 && counts.ja + counts.zh > counts.latin) return { lang: 'ja', confident: counts.ja > 4 };
  if (counts.zh > counts.latin && counts.zh > 0) return { lang: 'zh', confident: counts.zh > 8 };
  if (counts.ru > counts.latin && counts.ru > 0) return { lang: 'ru', confident: counts.ru > 8 };
  if (counts.hi > counts.latin && counts.hi > 0) return { lang: 'hi', confident: counts.hi > 8 };

  if (tokens.length === 0) return { lang: 'other', confident: false };

  const votes: Record<string, number> = { en: 0, es: 0, fr: 0, de: 0, pt: 0 };
  const limit = Math.min(tokens.length, 3000);
  for (let i = 0; i < limit; i++) {
    const word = tokens[i].folded;
    for (const key of Object.keys(votes)) {
      if (DETECTOR_MARKERS[key].includes(word)) votes[key]++;
    }
  }

  let best: LangId = 'other';
  let bestScore = 0;
  let runnerUp = 0;
  for (const key of Object.keys(votes)) {
    if (votes[key] > bestScore) {
      runnerUp = bestScore;
      bestScore = votes[key];
      best = key as LangId;
    } else if (votes[key] > runnerUp) {
      runnerUp = votes[key];
    }
  }

  if (bestScore === 0) return { lang: 'other', confident: false };
  return { lang: best, confident: bestScore >= 4 && bestScore > runnerUp * 1.3 };
}

// ---------------------------------------------------------------------------
// Syllables
// ---------------------------------------------------------------------------
const VOWELS: Record<string, RegExp> = {
  en: /[aeiouy]+/g,
  es: /[aeiouáéíóúü]+/g,
  fr: /[aeiouyàâéèêëîïôöùûü]+/g,
  de: /[aeiouyäöü]+/g,
  pt: /[aeiouáéíóúâêôãõ]+/g,
  ru: /[аеёиоуыэюя]+/g,
};

/**
 * Vowel-group counting with the usual English corrections. It is a heuristic,
 * not a dictionary — the FAQ says so rather than pretending otherwise.
 */
export function syllablesOf(word: string, lang: LangId): number {
  if (lang === 'ja') {
    // Kana are roughly one mora each; small kana attach to the one before.
    const small = (word.match(/[ぁぃぅぇぉゃゅょゎァィゥェォャュョヮ]/gu) || []).length;
    const kana = (word.match(/[\p{Script=Hiragana}\p{Script=Katakana}]/gu) || []).length;
    const han = (word.match(/\p{Script=Han}/gu) || []).length;
    return Math.max(1, kana - small + han * 2);
  }
  if (lang === 'zh') return Math.max(1, (word.match(/\p{Script=Han}/gu) || []).length);
  if (lang === 'hi') {
    const independent = (word.match(/[अआइईउऊऋएऐओऔ]/gu) || []).length;
    const matras = (word.match(/[ािीुूृेैोौ]/gu) || []).length;
    return Math.max(1, independent + matras);
  }

  const lower = lang === 'ru' ? word.toLowerCase() : fold(word);
  const pattern = VOWELS[lang] || VOWELS.en;
  pattern.lastIndex = 0;
  const groups = lower.match(pattern);
  let count = groups ? groups.length : 0;

  if (lang === 'en' || lang === 'other' || !VOWELS[lang]) {
    if (/[^aeiou]e$/.test(lower) && count > 1) count--; // silent final e
    if (/[aeiouy]{2}/.test(lower) === false && count === 0) count = 1;
  }

  return Math.max(1, count);
}

// ---------------------------------------------------------------------------
// Readability
// ---------------------------------------------------------------------------
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round1 = (value: number) => Math.round(value * 10) / 10;

/** Formulas built on English syllable/letter ratios say nothing about these. */
const NON_GRADE: LangId[] = ['ja', 'zh', 'hi', 'ru'];

function readabilityOf(
  lang: LangId,
  words: number,
  sentences: number,
  syllables: number,
  letters: number,
  polysyllabic: number,
  longWords: number
): Readability {
  const empty: Readability = {
    formulas: [],
    primary: 'flesch',
    ease: 0,
    band: 3,
    grade: null,
    gradeMeaningful: false,
  };
  if (words === 0 || sentences === 0) return empty;

  const wps = words / sentences;
  const spw = syllables / words;
  const lettersPer100 = (letters / words) * 100;
  const sentencesPer100 = (sentences / words) * 100;

  const flesch = 206.835 - 1.015 * wps - 84.6 * spw;
  const fleschKincaid = 0.39 * wps + 11.8 * spw - 15.59;
  const ari = 4.71 * (letters / words) + 0.5 * wps - 21.43;
  const gunningFog = 0.4 * (wps + 100 * (polysyllabic / words));
  const colemanLiau = 0.0588 * lettersPer100 - 0.296 * sentencesPer100 - 15.8;
  const smog = 1.043 * Math.sqrt(polysyllabic * (30 / sentences)) + 3.1291;
  const lix = wps + 100 * (longWords / words);
  const huerta = 206.84 - 60 * spw - 1.02 * wps;

  const formulas: FormulaResult[] = [
    { id: 'flesch', score: round1(flesch), grade: null },
    { id: 'fleschKincaid', score: round1(fleschKincaid), grade: round1(fleschKincaid) },
    { id: 'ari', score: round1(ari), grade: round1(ari) },
    { id: 'gunningFog', score: round1(gunningFog), grade: round1(gunningFog) },
    { id: 'colemanLiau', score: round1(colemanLiau), grade: round1(colemanLiau) },
    { id: 'smog', score: round1(smog), grade: round1(smog) },
    { id: 'lix', score: round1(lix), grade: null },
  ];
  if (lang === 'es' || lang === 'pt') formulas.push({ id: 'huerta', score: round1(huerta), grade: null });

  const gradeMeaningful = !NON_GRADE.includes(lang);
  let primary: FormulaResult['id'] = 'flesch';
  if (lang === 'es' || lang === 'pt') primary = 'huerta';
  else if (!gradeMeaningful) primary = 'lix';

  // One 0–100 ease number whatever the language, so the band label always works.
  let ease: number;
  if (primary === 'lix') ease = clamp(100 - (lix - 20) * 2, 0, 100);
  else if (primary === 'huerta') ease = clamp(huerta, 0, 100);
  else ease = clamp(flesch, 0, 100);

  // 0 = very easy … 6 = very hard.
  const band = ease >= 90 ? 0 : ease >= 80 ? 1 : ease >= 70 ? 2 : ease >= 60 ? 3 : ease >= 50 ? 4 : ease >= 30 ? 5 : 6;

  const gradeCandidates = [fleschKincaid, ari, gunningFog, colemanLiau].filter(n => Number.isFinite(n));
  const grade = gradeCandidates.length
    ? round1(clamp(gradeCandidates.reduce((a, b) => a + b, 0) / gradeCandidates.length, 1, 18))
    : null;

  return { formulas, primary, ease: Math.round(ease), band, grade: gradeMeaningful ? grade : null, gradeMeaningful };
}

// ---------------------------------------------------------------------------
// Keyword density
// ---------------------------------------------------------------------------
function keywordRows(tokens: Token[], stopwords: Set<string>, size: 1 | 2 | 3, total: number): KeywordRow[] {
  if (tokens.length < size || total === 0) return [];
  const counts = new Map<string, { count: number; display: string }>();

  for (let i = 0; i + size <= tokens.length; i++) {
    const first = tokens[i];
    const last = tokens[i + size - 1];
    // A phrase may contain a stop word, but starting or ending on one produces
    // "of the" and "the best of" instead of anything anyone searches for.
    if (stopwords.has(first.folded) || stopwords.has(last.folded)) continue;
    if (size === 1 && first.folded.length < 2 && !/\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}/u.test(first.text)) continue;
    // A phrase that straddles a sentence break is not a phrase.
    if (size > 1 && last.start - first.end > 40) continue;

    const parts: string[] = [];
    for (let k = 0; k < size; k++) parts.push(tokens[i + k].folded);
    const key = parts.join(' ');

    const found = counts.get(key);
    if (found) found.count++;
    else {
      const display: string[] = [];
      for (let k = 0; k < size; k++) display.push(tokens[i + k].text);
      counts.set(key, { count: 1, display: display.join(' ') });
    }
  }

  const rows: KeywordRow[] = [];
  for (const [, value] of counts) {
    if (size > 1 && value.count < 2) continue;
    rows.push({ phrase: value.display, count: value.count, density: round1((value.count / total) * 100) });
  }
  rows.sort((a, b) => b.count - a.count || a.phrase.localeCompare(b.phrase));
  return rows.slice(0, 25);
}

// ---------------------------------------------------------------------------
// Sentiment
// ---------------------------------------------------------------------------
function sentimentOf(tokens: Token[], foldedText: string, lang: LangId): Sentiment {
  const pack = packFor(lang);
  const idle: Sentiment = { positive: 0, neutral: 100, negative: 0, polarity: 0, matches: 0, top: [] };
  if (tokens.length === 0) return idle;

  const hits = new Map<string, { score: number; count: number }>();
  let positive = 0;
  let negative = 0;
  let total = 0;

  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i].folded;
    let base = pack.polarity[word];
    if (base === undefined && word.length > 4) {
      // One cheap inflection step: "improved" → "improve", "buenos" → "bueno".
      const stem = word.replace(/(?:s|es|ed|ing|os|as|en|er|e)$/u, '');
      if (stem.length > 3) base = pack.polarity[stem];
    }
    if (base === undefined) continue;

    let score = base;
    // Look back two tokens for a negation or an intensifier. "not great" must
    // not read as praise, which is exactly what the old substring pass did.
    for (let back = 1; back <= 2 && i - back >= 0; back++) {
      const previous = tokens[i - back].folded;
      if (pack.negators.has(previous)) {
        score = -score * 0.85;
        break;
      }
      const boost = pack.intensifiers[previous];
      if (boost !== undefined) score *= boost;
    }

    if (score > 0) positive += score;
    else if (score < 0) negative += -score;
    total++;

    const key = tokens[i].text.toLowerCase();
    const found = hits.get(key);
    if (found) {
      found.count++;
      found.score += score;
    } else {
      hits.set(key, { score, count: 1 });
    }
  }

  for (const [phrase, weight] of pack.phrases) {
    let from = 0;
    for (;;) {
      const at = foldedText.indexOf(phrase, from);
      if (at === -1) break;
      if (weight > 0) positive += weight;
      else if (weight < 0) negative += -weight;
      if (weight !== 0) total++;
      from = at + phrase.length;
    }
  }

  if (total === 0) return idle;

  // The old version divided positive and negative by their own sum, so the two
  // always added up to 100 and the "neutral" bar could never leave zero. Here
  // the denominator is the text, which is what a neutral share means.
  const charged = Math.min(tokens.length, positive + negative);
  const positiveShare = Math.round((positive / tokens.length) * 100);
  const negativeShare = Math.round((negative / tokens.length) * 100);
  const neutral = Math.max(0, 100 - positiveShare - negativeShare);

  const top = [...hits.entries()]
    .map(([word, value]) => ({ word, score: round1(value.score), count: value.count }))
    .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
    .slice(0, 8);

  return {
    positive: positiveShare,
    negative: negativeShare,
    neutral,
    polarity: Math.round(((positive - negative) / Math.max(1, charged)) * 100),
    matches: total,
    top,
  };
}

// ---------------------------------------------------------------------------
// Tone
// ---------------------------------------------------------------------------
function toneOf(
  tokens: Token[],
  lang: LangId,
  sentences: SentenceInfo[],
  text: string,
  passiveCount: number,
  adverbCount: number
): ToneProfile {
  const pack = packFor(lang);
  const scores: Record<ToneKey, number> = { formal: 0, casual: 0, academic: 0, confident: 0, creative: 0 };
  const empty = { ...scores, dominant: null } as ToneProfile;
  if (tokens.length === 0) return empty;

  const markers: Record<ToneKey, Set<string>> = {
    formal: new Set(pack.tone.formal),
    casual: new Set(pack.tone.casual),
    academic: new Set(pack.tone.academic),
    confident: new Set(pack.tone.confident),
    creative: new Set(pack.tone.creative),
  };

  let secondPerson = 0;
  let firstPerson = 0;
  const second = new Set(pack.secondPerson);
  const first = new Set(pack.firstPerson);

  for (const token of tokens) {
    for (const key of TONE_KEYS) if (markers[key].has(token.folded)) scores[key] += 1;
    if (second.has(token.folded)) secondPerson++;
    if (first.has(token.folded)) firstPerson++;
  }

  // Structure carries as much tone as vocabulary, and unlike a word list it
  // works in every language: long sentences and the passive read formal, short
  // ones with exclamation marks read casual.
  const exclamations = (text.match(/[!！]/gu) || []).length;
  const questions = (text.match(/[?？]/gu) || []).length;
  const quotes = (text.match(/["“”«»『』]/gu) || []).length;
  const ellipses = (text.match(/\.\.\.|…/gu) || []).length;
  const digits = (text.match(/\p{Nd}/gu) || []).length;
  const avgWords = sentences.length ? tokens.length / sentences.length : 0;
  const per100 = 100 / Math.max(1, tokens.length);

  scores.casual += (exclamations + ellipses) * 2 + secondPerson * 0.5;
  scores.formal += passiveCount * 1.5 + (avgWords > 22 ? 6 : 0);
  scores.academic += questions * 0.5 + digits * 0.15 + (avgWords > 18 ? 4 : 0);
  scores.creative += quotes * 0.75 + adverbCount * 0.5;
  scores.confident += Math.max(0, 8 - Math.abs(avgWords - 14)) * 0.4 + firstPerson * 0.2;

  const totals = TONE_KEYS.map(key => scores[key] * per100);
  const sum = totals.reduce((a, b) => a + b, 0);
  if (sum <= 0) return empty;

  const profile = { ...empty };
  let dominant: ToneKey = 'formal';
  let best = -1;
  TONE_KEYS.forEach((key, index) => {
    const value = Math.round((totals[index] / sum) * 100);
    profile[key] = value;
    if (value > best) {
      best = value;
      dominant = key;
    }
  });
  profile.dominant = dominant;
  return profile;
}

// ---------------------------------------------------------------------------
// Prose issues
// ---------------------------------------------------------------------------
const HARD_SENTENCE = 25;
const VERY_HARD_SENTENCE = 40;

/**
 * The "there is a plainer word" table is keyed on dictionary forms, so a
 * document saying "utilising" or "commences" would sail past a plain lookup.
 * These are the inflections that actually appear in prose, tried in order.
 */
function lookupSimpler(word: string, table: Record<string, string>): string | undefined {
  const direct = table[word];
  if (direct) return direct;
  if (word.length < 5) return undefined;

  const candidates: string[] = [];
  if (word.endsWith('ing')) {
    candidates.push(word.slice(0, -3), `${word.slice(0, -3)}e`);
  } else if (word.endsWith('ed')) {
    candidates.push(word.slice(0, -2), `${word.slice(0, -1)}`);
  } else if (word.endsWith('es')) {
    candidates.push(word.slice(0, -2), word.slice(0, -1));
  } else if (word.endsWith('s')) {
    candidates.push(word.slice(0, -1));
  }
  // Spanish, French and Portuguese infinitives inflect past the stem too.
  if (/(?:mos|ron|ndo|ait|ent)$/u.test(word)) candidates.push(word.slice(0, -3));

  for (const candidate of candidates) {
    const found = table[candidate];
    if (found) return found;
  }
  return undefined;
}

function collectIssues(
  text: string,
  foldedText: string,
  tokens: Token[],
  sentences: SentenceInfo[],
  lang: LangId
): { issues: Issue[]; passiveCount: number; adverbCount: number } {
  const pack = packFor(lang);
  const issues: Issue[] = [];
  const fillers = new Set(pack.fillers);
  let passiveCount = 0;
  let adverbCount = 0;

  // CJK sentences are counted in characters, not words, so the word ceiling
  // would flag every second line. Scale it instead of disabling the check.
  const cjk = lang === 'ja' || lang === 'zh';
  const hard = cjk ? HARD_SENTENCE * 2 : HARD_SENTENCE;
  const veryHard = cjk ? VERY_HARD_SENTENCE * 2 : VERY_HARD_SENTENCE;

  for (const sentence of sentences) {
    if (sentence.words >= veryHard) issues.push({ kind: 'veryLongSentence', start: sentence.start, end: sentence.end });
    else if (sentence.words >= hard) issues.push({ kind: 'longSentence', start: sentence.start, end: sentence.end });

    if (pack.passive) {
      const slice = foldedText.slice(sentence.start, sentence.end);
      pack.passive.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pack.passive.exec(slice))) {
        passiveCount++;
        if (issues.length < MAX_ISSUES) {
          issues.push({
            kind: 'passive',
            start: sentence.start + match.index,
            end: sentence.start + match.index + match[0].length,
          });
        }
        if (match[0].length === 0) pack.passive.lastIndex++;
      }
    }
    if (issues.length >= MAX_ISSUES) break;
  }

  const recent = new Map<string, number>();
  for (let i = 0; i < tokens.length && issues.length < MAX_ISSUES; i++) {
    const token = tokens[i];
    const word = token.folded;

    if (
      pack.adverb &&
      word.length > 5 &&
      pack.adverb.test(word) &&
      !pack.adverbExceptions?.has(word)
    ) {
      adverbCount++;
      issues.push({ kind: 'adverb', start: token.start, end: token.end });
      continue;
    }
    if (fillers.has(word)) {
      issues.push({ kind: 'filler', start: token.start, end: token.end });
      continue;
    }
    const simpler = lookupSimpler(word, pack.simpler);
    if (simpler) {
      issues.push({ kind: 'complexWord', start: token.start, end: token.end, hint: simpler });
      continue;
    }
    // The same content word twice inside a short window reads as a stutter.
    if (word.length > 4 && !pack.stopwords.has(word)) {
      const previous = recent.get(word);
      if (previous !== undefined && i - previous <= 12) {
        issues.push({ kind: 'repeatedWord', start: token.start, end: token.end });
      }
      recent.set(word, i);
    }
  }

  // Typographic noise: double spaces mid-line and trailing spaces.
  const noise = /[ \t]{2,}(?=\S)|[ \t]+$/gmu;
  let match: RegExpExecArray | null;
  while ((match = noise.exec(text)) && issues.length < MAX_ISSUES) {
    issues.push({ kind: 'whitespace', start: match.index, end: match.index + match[0].length });
  }

  issues.sort((a, b) => a.start - b.start || b.end - a.end);
  return { issues, passiveCount, adverbCount };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
const EMPTY_ISSUE_COUNTS = (): Record<IssueKind, number> => ({
  veryLongSentence: 0,
  longSentence: 0,
  passive: 0,
  adverb: 0,
  filler: 0,
  complexWord: 0,
  repeatedWord: 0,
  whitespace: 0,
});

export function emptyAnalysis(): Analysis {
  return {
    length: 0,
    lang: 'other',
    langConfident: false,
    counts: {
      words: 0, uniqueWords: 0, chars: 0, charsNoSpaces: 0, letters: 0, digits: 0, punctuation: 0,
      sentences: 0, paragraphs: 0, lines: 0, syllables: 0, longestWord: '', avgWordChars: 0,
      avgSentenceWords: 0, lexicalDiversity: 0, hapax: 0, bytes: 0,
    },
    readability: { formulas: [], primary: 'flesch', ease: 0, band: 3, grade: null, gradeMeaningful: false },
    sentences: [],
    issues: [],
    issueCounts: EMPTY_ISSUE_COUNTS(),
    keywords: { one: [], two: [], three: [] },
    sentiment: { positive: 0, neutral: 100, negative: 0, polarity: 0, matches: 0, top: [] },
    tone: { formal: 0, casual: 0, academic: 0, confident: 0, creative: 0, dominant: null },
    truncated: false,
  };
}

export function analyze(text: string, forcedLang: LangId | null = null): Analysis {
  const result = emptyAnalysis();
  result.length = text.length;
  if (!text) return result;

  const deep = text.length <= DEEP_LIMIT;
  result.truncated = !deep;

  const tokens = tokenize(text, forcedLang ?? 'en');
  const detected = forcedLang ? { lang: forcedLang, confident: true } : detectLanguage(text, tokens);
  result.lang = detected.lang;
  result.langConfident = detected.confident;

  // The first pass used an English segmenter; for CJK that is the wrong answer,
  // so it is redone once the language is known.
  const finalTokens =
    !forcedLang && (detected.lang === 'ja' || detected.lang === 'zh' || detected.lang === 'hi')
      ? tokenize(text, detected.lang)
      : tokens;

  const pack = packFor(detected.lang);
  const stopwords = detected.confident ? pack.stopwords : FALLBACK_STOPWORDS;

  // -- counters ------------------------------------------------------------
  const counts: Counts = result.counts;
  counts.words = finalTokens.length;
  counts.chars = text.length;
  counts.charsNoSpaces = text.replace(/\s/gu, '').length;
  counts.letters = (text.match(/\p{L}/gu) || []).length;
  counts.digits = (text.match(/\p{Nd}/gu) || []).length;
  counts.punctuation = (text.match(/[\p{P}\p{S}]/gu) || []).length;
  counts.lines = text.split('\n').length;
  counts.paragraphs = text.split(/\n\s*\n/u).filter(block => block.trim().length > 0).length;
  counts.bytes = new TextEncoder().encode(text).length;

  const frequency = new Map<string, number>();
  let syllables = 0;
  let polysyllabic = 0;
  let longWords = 0;
  let wordChars = 0;
  let longest = '';

  for (const token of finalTokens) {
    const syl = syllablesOf(token.text, detected.lang);
    syllables += syl;
    if (syl >= 3) polysyllabic++;
    if (token.text.length > 6) longWords++;
    wordChars += token.text.length;
    if (token.text.length > longest.length) longest = token.text;
    frequency.set(token.folded, (frequency.get(token.folded) || 0) + 1);
  }

  counts.syllables = syllables;
  counts.uniqueWords = frequency.size;
  counts.longestWord = longest;
  counts.avgWordChars = counts.words ? round1(wordChars / counts.words) : 0;
  counts.lexicalDiversity = counts.words ? Math.round((frequency.size / counts.words) * 100) : 0;
  let hapax = 0;
  for (const value of frequency.values()) if (value === 1) hapax++;
  counts.hapax = hapax;

  const rawSentences = splitSentences(text, detected.lang);
  counts.sentences = rawSentences.length;
  counts.avgSentenceWords = rawSentences.length ? round1(counts.words / rawSentences.length) : 0;

  if (!deep) return result;

  // -- sentence table ------------------------------------------------------
  const sentences: SentenceInfo[] = [];
  let cursor = 0;
  for (const raw of rawSentences) {
    while (cursor < finalTokens.length && finalTokens[cursor].start < raw.start) cursor++;
    let words = 0;
    let syl = 0;
    let scan = cursor;
    while (scan < finalTokens.length && finalTokens[scan].start < raw.end) {
      words++;
      syl += syllablesOf(finalTokens[scan].text, detected.lang);
      scan++;
    }
    const grade = words > 0 ? round1(0.39 * words + 11.8 * (syl / words) - 15.59) : 0;
    sentences.push({ start: raw.start, end: raw.end, words, syllables: syl, grade });
  }
  result.sentences = sentences;

  // -- issues, tone, sentiment, keywords -----------------------------------
  const foldedText = foldPreserving(text);
  const { issues, passiveCount, adverbCount } = collectIssues(text, foldedText, finalTokens, sentences, detected.lang);
  result.issues = issues;
  const issueCounts = EMPTY_ISSUE_COUNTS();
  for (const issue of issues) issueCounts[issue.kind]++;
  result.issueCounts = issueCounts;

  result.readability = readabilityOf(
    detected.lang,
    counts.words,
    counts.sentences,
    syllables,
    counts.letters,
    polysyllabic,
    longWords
  );

  result.keywords = {
    one: keywordRows(finalTokens, stopwords, 1, counts.words),
    two: keywordRows(finalTokens, stopwords, 2, counts.words),
    three: keywordRows(finalTokens, stopwords, 3, counts.words),
  };

  result.sentiment = sentimentOf(finalTokens, foldedText, detected.lang);
  result.tone = toneOf(finalTokens, detected.lang, sentences, text, passiveCount, adverbCount);

  return result;
}

// ---------------------------------------------------------------------------
// Reading and speaking time
// ---------------------------------------------------------------------------
/**
 * Silent reading speeds in words per minute, from Brysbaert's 2019 meta-analysis
 * of 190 studies. The old build used a flat 200 wpm for all nine languages,
 * which is 25 % out for English alone.
 */
export const READING_WPM: Record<LangId, number> = {
  en: 238, es: 278, fr: 214, de: 260, pt: 181, ru: 184, hi: 188, ja: 193, zh: 260, other: 220,
};

/** Speech is far slower than reading, and much more even across languages. */
export const SPEAKING_WPM: Record<LangId, number> = {
  en: 150, es: 165, fr: 145, de: 150, pt: 150, ru: 140, hi: 140, ja: 150, zh: 160, other: 150,
};

export function secondsFor(words: number, wpm: number): number {
  if (words <= 0 || wpm <= 0) return 0;
  return (words / wpm) * 60;
}
