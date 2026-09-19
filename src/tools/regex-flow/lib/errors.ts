/**
 * El motor de expresiones regulares del navegador da el error en ingles y con
 * la regex delante ("Invalid regular expression: /(abc/dgi: Unterminated
 * group"), incluidas banderas que el usuario no ha puesto (`d` la añade la
 * herramienta para sacar las posiciones de los grupos). Esto lo reconoce por
 * la causa y devuelve la clave del diccionario; si no la reconoce, null y se
 * enseña el mensaje original, que al menos dice algo.
 *
 * Cubre las redacciones de V8 (Chrome, Edge), SpiderMonkey (Firefox) y
 * JavaScriptCore (Safari), que no se parecen entre si.
 */
const PATTERNS: [RegExp, string][] = [
  [/unterminated group|unterminated parenthetical|missing \)/i, 'regexErrGroup'],
  [/unmatched '?\)'?|unmatched \) in regular/i, 'regexErrUnmatched'],
  [/nothing to repeat/i, 'regexErrRepeat'],
  [/unterminated character class|missing terminating \]|missing \]/i, 'regexErrClass'],
  [/invalid named (capture )?reference|invalid named capture referenced/i, 'regexErrNamedRef'],
  [/duplicate capture group name|duplicate capture group/i, 'regexErrDupName'],
  [/invalid capture group name|invalid capture group/i, 'regexErrGroupName'],
  [/out of order/i, 'regexErrOrder'],
  [/invalid property name|invalid unicode property/i, 'regexErrProperty'],
  [/invalid (regular expression )?flags?|flag.*invalid|invalid regular expression flag/i, 'regexErrFlags'],
  [/lone quantifier|incomplete quantifier|numbers too large in \{\} quantifier/i, 'regexErrQuantifier'],
  [/\\ at end of pattern|invalid escape|invalid (unicode|identity|decimal) escape|invalid class escape/i, 'regexErrEscape'],
  [/invalid group/i, 'regexErrInvalidGroup'],
];

export function regexErrorKey(raw: string | undefined): string | null {
  if (!raw) return null;
  // La causa va despues de los ultimos dos puntos en V8 ("…/dgi: Unterminated group").
  const cause = raw.includes(': ') ? raw.slice(raw.lastIndexOf(': ') + 2) : raw;
  for (const [re, key] of PATTERNS) if (re.test(cause) || re.test(raw)) return key;
  return null;
}

/** `\p{…}` solo significa "propiedad Unicode" con la bandera u o v; sin ella es una p literal. */
export function needsUnicodeFlag(pattern: string, flags: string): boolean {
  return /\\[pP]\{/.test(pattern) && !/[uv]/.test(flags);
}
