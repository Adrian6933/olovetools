// ============================================================================
// Exporting the pattern to the language the user is actually writing in.
// ----------------------------------------------------------------------------
// This is the single feature people leave a free regex tester for. Getting it
// right is mostly about the boring parts: which flags exist where, how each
// language quotes a string full of backslashes, and which engines quietly do
// not support what the pattern uses. The `notes` on each target carry that
// last part, because a Go snippet containing a lookbehind is worse than no
// snippet at all — RE2 rejects it at runtime.
// ============================================================================

export interface CodeTarget {
  id: string;
  label: string;
  language: string;
  build: (pattern: string, flags: string, replacement: string) => string;
  /** Codes of caveats that apply to this target, resolved against the dictionary. */
  caveats: (pattern: string, flags: string) => string[];
}

// --- quoting helpers --------------------------------------------------------

/** A double-quoted string with backslashes and quotes escaped. */
function quoteDouble(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/** A Python/Rust raw string, falling back when the pattern contains the quote. */
function quoteRaw(value: string): string {
  if (!value.includes('"') && !value.endsWith('\\')) return `r"${value}"`;
  if (!value.includes("'") && !value.endsWith('\\')) return `r'${value}'`;
  return quoteDouble(value);
}

/** A C# verbatim string: only `"` needs doubling, backslashes stay as typed. */
function quoteVerbatim(value: string): string {
  return `@"${value.replace(/"/g, '""')}"`;
}

/** A Go backquoted string; patterns containing a backtick fall back to interpreted. */
function quoteBacktick(value: string): string {
  if (!value.includes('`')) return `\`${value}\``;
  return quoteDouble(value);
}

/** A PHP single-quoted string. */
function quoteSingle(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/** Escapes the delimiter of a `/.../` literal. */
function forSlashLiteral(pattern: string): string {
  return pattern.replace(/(^|[^\\])\//g, '$1\\/');
}

// --- capability probes ------------------------------------------------------

const usesLookbehind = (pattern: string) => /\(\?<[=!]/.test(pattern);
const usesLookahead = (pattern: string) => /\(\?[=!]/.test(pattern);
const usesBackref = (pattern: string) => /\\[1-9]|\\k</.test(pattern);
const usesNamed = (pattern: string) => /\(\?<[A-Za-z_]/.test(pattern);
const usesUnicodeProp = (pattern: string) => /\\[pP]\{/.test(pattern);

/** RE2-family engines: linear time, no backtracking, so no lookaround at all. */
function re2Caveats(pattern: string): string[] {
  const notes: string[] = [];
  if (usesLookbehind(pattern) || usesLookahead(pattern)) notes.push('noLookaround');
  if (usesBackref(pattern)) notes.push('noBackref');
  return notes;
}

// --- pattern rewriting ------------------------------------------------------

/**
 * JavaScript spells a named group `(?<name>…)`; Python's `re` and Go's RE2
 * only accept the Python spelling `(?P<name>…)` and raise on the other one.
 * Emitting the JS form for those two produced a snippet that looked right and
 * failed at compile time, which is exactly the kind of quiet wrongness this
 * tool exists to avoid.
 *
 * The lookbehind/lookahead forms `(?<=`, `(?<!` must not be touched, hence the
 * `[A-Za-z_]` first character.
 */
function toPythonNamedGroups(pattern: string): string {
  return pattern
    .replace(/\(\?<([A-Za-z_][A-Za-z0-9_]*)>/g, '(?P<$1>')
    .replace(/\\k<([A-Za-z_][A-Za-z0-9_]*)>/g, '(?P=$1)');
}

// --- flag mapping -----------------------------------------------------------

const INLINE_FLAGS: Record<string, string> = { i: 'i', m: 'm', s: 's' };

/** `(?ims)` prefix for engines configured through inline flags. */
function inlinePrefix(flags: string): string {
  const mapped = [...flags].filter(flag => INLINE_FLAGS[flag]).join('');
  return mapped ? `(?${mapped})` : '';
}

// --- targets ----------------------------------------------------------------

export const CODE_TARGETS: CodeTarget[] = [
  {
    id: 'javascript',
    label: 'JavaScript',
    language: 'javascript',
    build: (pattern, flags, replacement) => {
      const literal = `/${forSlashLiteral(pattern) || '(?:)'}/${flags}`;
      return [
        `const re = ${literal};`,
        '',
        `const matches = [...text.matchAll(${flags.includes('g') ? 're' : `new RegExp(re, re.flags + 'g')`})];`,
        `const output = text.replace(re, ${quoteDouble(replacement)});`,
      ].join('\n');
    },
    caveats: () => [],
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    language: 'typescript',
    build: (pattern, flags, replacement) => {
      const literal = `/${forSlashLiteral(pattern) || '(?:)'}/${flags}`;
      return [
        `const re: RegExp = ${literal};`,
        '',
        `const matches: RegExpMatchArray[] = [...text.matchAll(${flags.includes('g') ? 're' : `new RegExp(re.source, re.flags + 'g')`})];`,
        `const output: string = text.replace(re, ${quoteDouble(replacement)});`,
      ].join('\n');
    },
    caveats: () => [],
  },
  {
    id: 'python',
    label: 'Python',
    language: 'python',
    build: (pattern, flags, replacement) => {
      const options: string[] = [];
      if (flags.includes('i')) options.push('re.IGNORECASE');
      if (flags.includes('m')) options.push('re.MULTILINE');
      if (flags.includes('s')) options.push('re.DOTALL');
      if (flags.includes('u') || flags.includes('v')) options.push('re.UNICODE');
      const args = options.length ? `, ${options.join(' | ')}` : '';
      // Python spells group references \1 and \g<name>, not $1 and $<name>.
      const pythonReplacement = replacement
        .replace(/\$<([^>]+)>/g, '\\g<$1>')
        .replace(/\$(\d{1,2})/g, '\\$1')
        .replace(/\$&/g, '\\g<0>');
      return [
        'import re',
        '',
        `pattern = re.compile(${quoteRaw(toPythonNamedGroups(pattern))}${args})`,
        '',
        `matches = pattern.${flags.includes('g') ? 'findall' : 'search'}(text)`,
        `output = pattern.sub(${quoteRaw(pythonReplacement)}, text${flags.includes('g') ? '' : ', count=1'})`,
      ].join('\n');
    },
    caveats: pattern => (usesUnicodeProp(pattern) ? ['noUnicodeProp'] : []),
  },
  {
    id: 'java',
    label: 'Java',
    language: 'java',
    build: (pattern, flags, replacement) => {
      const options: string[] = [];
      if (flags.includes('i')) options.push('Pattern.CASE_INSENSITIVE');
      if (flags.includes('m')) options.push('Pattern.MULTILINE');
      if (flags.includes('s')) options.push('Pattern.DOTALL');
      if (flags.includes('u') || flags.includes('v')) options.push('Pattern.UNICODE_CASE');
      const args = options.length ? `, ${options.join(' | ')}` : '';
      const javaReplacement = replacement.replace(/\$<([^>]+)>/g, '${$1}');
      return [
        'import java.util.regex.*;',
        '',
        `Pattern pattern = Pattern.compile(${quoteDouble(pattern)}${args});`,
        'Matcher matcher = pattern.matcher(text);',
        'while (matcher.find()) {',
        '    System.out.println(matcher.group());',
        '}',
        '',
        `String output = matcher.replaceAll(${quoteDouble(javaReplacement)});`,
      ].join('\n');
    },
    caveats: () => [],
  },
  {
    id: 'csharp',
    label: 'C#',
    language: 'csharp',
    build: (pattern, flags, replacement) => {
      const options: string[] = [];
      if (flags.includes('i')) options.push('RegexOptions.IgnoreCase');
      if (flags.includes('m')) options.push('RegexOptions.Multiline');
      if (flags.includes('s')) options.push('RegexOptions.Singleline');
      const args = options.length ? `, ${options.join(' | ')}` : '';
      const netReplacement = replacement.replace(/\$<([^>]+)>/g, '${$1}');
      return [
        'using System.Text.RegularExpressions;',
        '',
        `var regex = new Regex(${quoteVerbatim(pattern)}${args});`,
        '',
        'foreach (Match match in regex.Matches(text))',
        '    Console.WriteLine(match.Value);',
        '',
        `var output = regex.Replace(text, ${quoteVerbatim(netReplacement)});`,
      ].join('\n');
    },
    caveats: () => [],
  },
  {
    id: 'php',
    label: 'PHP',
    language: 'php',
    build: (pattern, flags, replacement) => {
      const modifiers = [...flags].filter(flag => 'imsu'.includes(flag)).join('');
      const literal = `/${forSlashLiteral(pattern)}/${modifiers}`;
      const phpReplacement = replacement
        .replace(/\$<([^>]+)>/g, '${$1}')
        .replace(/\$&/g, '$0');
      return [
        '<?php',
        `$pattern = ${quoteSingle(literal)};`,
        '',
        'preg_match_all($pattern, $text, $matches, PREG_OFFSET_CAPTURE);',
        `$output = preg_replace($pattern, ${quoteSingle(phpReplacement)}, $text);`,
      ].join('\n');
    },
    caveats: () => [],
  },
  {
    id: 'go',
    label: 'Go',
    language: 'go',
    build: (pattern, flags, replacement) => {
      // RE2 uses the Python spelling for named groups, in Go as in Python.
      const source = `${inlinePrefix(flags)}${toPythonNamedGroups(pattern)}`;
      const goReplacement = replacement
        .replace(/\$<([^>]+)>/g, '${$1}')
        .replace(/\$(\d{1,2})/g, '${$1}');
      return [
        'import "regexp"',
        '',
        `re := regexp.MustCompile(${quoteBacktick(source)})`,
        '',
        'matches := re.FindAllString(text, -1)',
        `output := re.ReplaceAllString(text, ${quoteBacktick(goReplacement)})`,
      ].join('\n');
    },
    caveats: pattern => re2Caveats(pattern),
  },
  {
    id: 'rust',
    label: 'Rust',
    language: 'rust',
    build: (pattern, flags, replacement) => {
      // The regex crate only learned `(?<name>…)` in 1.9; `(?P<name>…)` has
      // worked since the beginning, so it is the safer thing to hand over.
      const source = `${inlinePrefix(flags)}${toPythonNamedGroups(pattern)}`;
      const rustReplacement = replacement
        .replace(/\$<([^>]+)>/g, '${$1}')
        .replace(/\$(\d{1,2})/g, '${$1}');
      return [
        'use regex::Regex;',
        '',
        `let re = Regex::new(${quoteRaw(source)}).unwrap();`,
        '',
        'for m in re.find_iter(text) {',
        '    println!("{}", m.as_str());',
        '}',
        '',
        `let output = re.replace_all(text, ${quoteRaw(rustReplacement)});`,
      ].join('\n');
    },
    caveats: pattern => re2Caveats(pattern),
  },
  {
    id: 'ruby',
    label: 'Ruby',
    language: 'ruby',
    build: (pattern, flags, replacement) => {
      const modifiers = [...flags].filter(flag => 'im'.includes(flag)).join('') + (flags.includes('s') ? 'm' : '');
      const rubyReplacement = replacement
        .replace(/\$<([^>]+)>/g, '\\k<$1>')
        .replace(/\$(\d{1,2})/g, '\\$1');
      return [
        `pattern = /${forSlashLiteral(pattern)}/${[...new Set(modifiers)].join('')}`,
        '',
        'matches = text.scan(pattern)',
        `output = text.gsub(pattern, ${quoteSingle(rubyReplacement)})`,
      ].join('\n');
    },
    caveats: () => [],
  },
  {
    id: 'shell',
    label: 'grep / sed',
    language: 'bash',
    build: (pattern, flags, replacement) => {
      const grepFlags = flags.includes('i') ? '-Pi' : '-P';
      const sedReplacement = replacement.replace(/\$(\d{1,2})/g, '\\$1').replace(/\$&/g, '&');
      return [
        `grep ${grepFlags}o ${quoteSingle(pattern)} file.txt`,
        '',
        `sed -E ${flags.includes('i') ? "'s/…/…/gi'" : ''}`.trim(),
        `sed -E ${quoteSingle(`s/${forSlashLiteral(pattern)}/${sedReplacement}/${flags.includes('g') ? 'g' : ''}`)} file.txt`,
      ]
        .filter(line => line !== 'sed -E')
        .join('\n');
    },
    caveats: pattern => (usesNamed(pattern) ? ['noNamedGroups'] : []),
  },
];

export function targetById(id: string): CodeTarget {
  return CODE_TARGETS.find(target => target.id === id) ?? CODE_TARGETS[0];
}
