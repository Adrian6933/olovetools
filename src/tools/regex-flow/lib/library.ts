// ============================================================================
// The pattern library.
// ----------------------------------------------------------------------------
// Five presets with the name of each one hardcoded in nine languages inside
// the component was never going to grow. These live here, carry a dictionary
// key instead of a translation, and each one ships the sample text that makes
// it obvious what it does — a preset that loads a pattern but leaves the old
// test text behind teaches nothing.
// ============================================================================

export type LibraryCategory = 'web' | 'data' | 'text' | 'code';

export interface LibraryEntry {
  id: string;
  category: LibraryCategory;
  pattern: string;
  flags: string;
  sample: string;
  replacement: string;
}

export const LIBRARY: LibraryEntry[] = [
  // -- web ------------------------------------------------------------------
  {
    id: 'email',
    category: 'web',
    pattern: '[\\w.%+-]+@[\\w.-]+\\.[A-Za-z]{2,}',
    flags: 'gi',
    sample:
      'Send the report to mail@domain.com, support@example.co.uk or admin+billing@olovetools.org.\nBounced: not-an-email@, @nope.com',
    replacement: '[EMAIL]',
  },
  {
    id: 'url',
    category: 'web',
    pattern: 'https?:\\/\\/[^\\s<>"\']+',
    flags: 'gi',
    sample:
      'Docs at https://olovetools.com/en/regex-flow, mirror http://example.org/path?q=1#frag.\nNot a link: ftp://files.example.org',
    replacement: '[LINK]',
  },
  {
    id: 'ipv4',
    category: 'web',
    pattern: '\\b(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\b',
    flags: 'g',
    sample: 'Nodes: 192.168.1.1, 10.0.0.254, 8.8.8.8.\nInvalid: 999.1.1.1 and 256.0.0.1',
    replacement: '[IP]',
  },
  {
    id: 'domain',
    category: 'web',
    pattern: '\\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z]{2,}\\b',
    flags: 'gi',
    sample: 'olovetools.com, sub.domain.co.uk and my-site.dev are hosts. localhost is not.',
    replacement: '[HOST]',
  },
  {
    id: 'html-tag',
    category: 'web',
    pattern: '<\\/?([a-z][a-z0-9]*)\\b[^>]*>',
    flags: 'gi',
    sample: '<p class="lead">Hello <strong>world</strong></p>\n<img src="a.png" alt="" />',
    replacement: '',
  },

  // -- data -----------------------------------------------------------------
  {
    id: 'iso-date',
    category: 'data',
    pattern: '\\b(?<year>\\d{4})-(?<month>0[1-9]|1[0-2])-(?<day>0[1-9]|[12]\\d|3[01])\\b',
    flags: 'g',
    sample: 'Shipped 2026-06-15, next 2026-09-01, holiday 2026-12-25.\nBad: 2026-13-01, 2026-02-30 passes this one.',
    replacement: '$<day>/$<month>/$<year>',
  },
  {
    id: 'time',
    category: 'data',
    pattern: '\\b([01]?\\d|2[0-3]):([0-5]\\d)(?::([0-5]\\d))?\\b',
    flags: 'g',
    sample: 'Standup at 9:30, deploy 14:05:12, cutoff 23:59.\nNot a time: 25:00',
    replacement: '[$1h$2]',
  },
  {
    id: 'uuid',
    category: 'data',
    pattern: '\\b[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\b',
    flags: 'gi',
    sample:
      'id=550e8400-e29b-41d4-a716-446655440000\nid=3f2504e0-4f89-41d3-9a0c-0305e82c3301\nnot-a-uuid=1234',
    replacement: '[UUID]',
  },
  {
    id: 'hex-color',
    category: 'data',
    pattern: '#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})\\b',
    flags: 'gi',
    sample: '--brand: #d946ef;\n--bg: #08040a;\n--muted: #fff8;\n--short: #abc;',
    replacement: 'var(--color)',
  },
  {
    id: 'phone',
    category: 'data',
    pattern: '\\+?\\d{1,3}[\\s.-]?\\(?\\d{2,4}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{2,4}',
    flags: 'g',
    sample: 'Call +34 987 654 321 or +1 (555) 123-4567.\nExtension 4521 alone should not match.',
    replacement: '[PHONE]',
  },
  {
    id: 'semver',
    category: 'data',
    pattern: '\\bv?(\\d+)\\.(\\d+)\\.(\\d+)(?:-([\\w.]+))?\\b',
    flags: 'g',
    sample: 'astro@6.0.8, react v19.2.4, tailwind 4.2.2-beta.1',
    replacement: '$1.$2',
  },

  // -- text -----------------------------------------------------------------
  {
    id: 'duplicate-word',
    category: 'text',
    pattern: '\\b(\\w+)\\s+\\1\\b',
    flags: 'gi',
    sample: 'This this is a a common typo that that slips past a spell checker.',
    replacement: '$1',
  },
  {
    id: 'trailing-space',
    category: 'text',
    pattern: '[ \\t]+$',
    flags: 'gm',
    sample: 'Line with trailing spaces   \nClean line\nAnother one\t\t\n',
    replacement: '',
  },
  {
    id: 'blank-lines',
    category: 'text',
    pattern: '\\n{3,}',
    flags: 'g',
    sample: 'Paragraph one.\n\n\n\nParagraph two.\n\nParagraph three.',
    replacement: '\n\n',
  },
  {
    id: 'markdown-link',
    category: 'text',
    pattern: '\\[([^\\]]+)\\]\\(([^)\\s]+)(?:\\s+"([^"]*)")?\\)',
    flags: 'g',
    sample: 'See [the docs](https://olovetools.com "Docs") and [this one](/local/path).',
    replacement: '$1 ($2)',
  },
  {
    id: 'quoted',
    category: 'text',
    pattern: '"([^"\\\\]*(?:\\\\.[^"\\\\]*)*)"',
    flags: 'g',
    sample: 'He said "hello there" and then "a quote with \\"nesting\\" inside".',
    replacement: '«$1»',
  },

  // -- code -----------------------------------------------------------------
  {
    id: 'log-level',
    category: 'code',
    pattern: '^(?<time>[\\d\\-:T.Z]+)\\s+(?<level>ERROR|WARN|INFO|DEBUG)\\s+(?<message>.*)$',
    flags: 'gm',
    sample:
      '2026-08-12T10:15:00Z INFO server started on :4321\n2026-08-12T10:15:03Z ERROR failed to open socket\n2026-08-12T10:15:04Z WARN retrying in 2s',
    replacement: '[$<level>] $<message>',
  },
  {
    id: 'comment',
    category: 'code',
    pattern: '\\/\\/.*$|\\/\\*[\\s\\S]*?\\*\\/',
    flags: 'gm',
    sample: 'const a = 1; // trailing note\n/* a block\n   over two lines */\nconst b = 2;',
    replacement: '',
  },
  {
    id: 'css-var',
    category: 'code',
    pattern: 'var\\(\\s*(--[\\w-]+)\\s*(?:,\\s*([^)]+))?\\)',
    flags: 'g',
    sample: 'color: var(--brand);\nbackground: var(--bg, #08040a);\nborder-color: var( --line , red );',
    replacement: '$1',
  },
  {
    id: 'query-param',
    category: 'code',
    pattern: '[?&](?<key>[^=&#]+)=(?<value>[^&#]*)',
    flags: 'g',
    sample: '/search?q=regex&lang=es&page=2#results',
    replacement: '',
  },
];

export const CATEGORIES: LibraryCategory[] = ['web', 'data', 'text', 'code'];

export function byCategory(category: LibraryCategory): LibraryEntry[] {
  return LIBRARY.filter(entry => entry.category === category);
}

// ---------------------------------------------------------------------------
// The cheat sheet. Same idea: syntax on the left, a dictionary key on the
// right, so all nine languages get a real translation instead of the English
// strings that used to sit in the component.
// ---------------------------------------------------------------------------

export interface CheatGroup {
  id: string;
  items: { token: string; key: string }[];
}

export const CHEAT_SHEET: CheatGroup[] = [
  {
    id: 'characters',
    items: [
      { token: '.', key: 'cheat_dot' },
      { token: '\\d', key: 'cheat_digit' },
      { token: '\\D', key: 'cheat_nonDigit' },
      { token: '\\w', key: 'cheat_word' },
      { token: '\\W', key: 'cheat_nonWord' },
      { token: '\\s', key: 'cheat_space' },
      { token: '\\S', key: 'cheat_nonSpace' },
      { token: '\\p{L}', key: 'cheat_prop' },
    ],
  },
  {
    id: 'sets',
    items: [
      { token: '[abc]', key: 'cheat_set' },
      { token: '[^abc]', key: 'cheat_setNegated' },
      { token: '[a-z]', key: 'cheat_range' },
      { token: 'a|b', key: 'cheat_alternation' },
    ],
  },
  {
    id: 'anchors',
    items: [
      { token: '^', key: 'cheat_start' },
      { token: '$', key: 'cheat_end' },
      { token: '\\b', key: 'cheat_boundary' },
      { token: '\\B', key: 'cheat_nonBoundary' },
    ],
  },
  {
    id: 'quantifiers',
    items: [
      { token: '*', key: 'cheat_star' },
      { token: '+', key: 'cheat_plus' },
      { token: '?', key: 'cheat_optional' },
      { token: '{3}', key: 'cheat_exact' },
      { token: '{3,}', key: 'cheat_min' },
      { token: '{3,6}', key: 'cheat_range2' },
      { token: '+?', key: 'cheat_lazy' },
    ],
  },
  {
    id: 'groups',
    items: [
      { token: '(abc)', key: 'cheat_group' },
      { token: '(?:abc)', key: 'cheat_nonCapture' },
      { token: '(?<n>abc)', key: 'cheat_named' },
      { token: '\\1', key: 'cheat_backref' },
      { token: '(?=abc)', key: 'cheat_lookahead' },
      { token: '(?!abc)', key: 'cheat_negLookahead' },
      { token: '(?<=abc)', key: 'cheat_lookbehind' },
      { token: '(?<!abc)', key: 'cheat_negLookbehind' },
    ],
  },
  {
    id: 'replacement',
    items: [
      { token: '$1', key: 'cheat_dollarNumber' },
      { token: '$<n>', key: 'cheat_dollarNamed' },
      { token: '$&', key: 'cheat_dollarWhole' },
      { token: '$$', key: 'cheat_dollarEscape' },
    ],
  },
];
