// ============================================================================
// The ITU alphabet, all of it.
// ----------------------------------------------------------------------------
// The old map held A–Z and 0–9 and nothing else, and both directions used
// `|| ''`, so a comma or a question mark simply evaporated. Punctuation is not
// exotic in Morse — "?" and "/" are in every beginner's first week — and a
// converter that drops characters without saying so is worse than one that
// refuses them.
//
// Recommendation ITU-R M.1677-1, plus the accented letters that appear in the
// European national variants and the prosigns operators actually send.
// ============================================================================

export interface Prosign {
  /** What the user types to get it, e.g. `<SOS>`. */
  token: string;
  code: string;
  /** Short description key for the reference table. */
  meaning: string;
}

export const LETTERS: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.',
  G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..',
  M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
  S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..',
};

export const DIGITS: Record<string, string> = {
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
};

export const PUNCTUATION: Record<string, string> = {
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--',
  '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...',
  ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-',
  '"': '.-..-.', '$': '...-..-', '@': '.--.-.',
};

/** National variants. Sending them is legal; receiving them is common. */
export const ACCENTED: Record<string, string> = {
  À: '.--.-', Ä: '.-.-', Å: '.--.-', Ç: '-.-..', È: '.-..-', É: '..-..',
  Ñ: '--.--', Ö: '---.', Ü: '..--', ß: '...--..',
};

export const PROSIGNS: Prosign[] = [
  { token: '<AA>', code: '.-.-', meaning: 'newline' },
  { token: '<AR>', code: '.-.-.', meaning: 'end-of-message' },
  { token: '<AS>', code: '.-...', meaning: 'wait' },
  { token: '<BT>', code: '-...-', meaning: 'new-paragraph' },
  { token: '<CT>', code: '-.-.-', meaning: 'start' },
  { token: '<KN>', code: '-.--.', meaning: 'go-ahead-named' },
  { token: '<SK>', code: '...-.-', meaning: 'end-of-contact' },
  { token: '<SOS>', code: '...---...', meaning: 'distress' },
];

export const CHARACTERS: Record<string, string> = { ...LETTERS, ...DIGITS, ...PUNCTUATION, ...ACCENTED };

/**
 * Code → character. Several codes are genuinely ambiguous (`.-.-` is both Ä
 * and the AA prosign, `.-...` both & and AS), so the plain character wins on
 * decode and the prosign is offered in the reference. Silently picking the
 * prosign would turn "&" into "<AS>" in ordinary text.
 */
export const FROM_CODE: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const prosign of PROSIGNS) out[prosign.code] = prosign.token;
  for (const [character, code] of Object.entries(CHARACTERS)) out[code] = character;
  return out;
})();

export const TO_CODE: Record<string, string> = (() => {
  const out: Record<string, string> = { ...CHARACTERS };
  for (const prosign of PROSIGNS) out[prosign.token] = prosign.code;
  return out;
})();

/** Groups for the on-screen reference, so it is not one list of ninety rows. */
export const REFERENCE_GROUPS: { key: string; entries: [string, string][] }[] = [
  { key: 'letters', entries: Object.entries(LETTERS) },
  { key: 'digits', entries: Object.entries(DIGITS) },
  { key: 'punctuation', entries: Object.entries(PUNCTUATION) },
  { key: 'accented', entries: Object.entries(ACCENTED) },
  { key: 'prosigns', entries: PROSIGNS.map(p => [p.token, p.code] as [string, string]) },
];

/** Longest code in the table, used to bound the decoder's lookahead. */
export const MAX_CODE_LENGTH = Object.values(TO_CODE).reduce((max, code) => Math.max(max, code.length), 0);
