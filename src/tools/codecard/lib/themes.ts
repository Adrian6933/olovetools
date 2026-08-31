// ============================================================================
// Temas de sintaxis
// ----------------------------------------------------------------------------
// Antes esto era un Record<CodeTheme, string> con el CSS ya escrito a mano, y
// el marco de la ventana estaba clavado a `bg-[#1e1e1e]` en el JSX. Resultado:
// con GitHub Light la barra de título salía negra sobre un editor blanco. Aquí
// cada tema es DATOS (paleta), el CSS se genera, y el cromo de la ventana, la
// columna de números y la banda de línea resaltada se derivan de la misma
// paleta, así que ningún tema puede volver a desparejarse.
// ============================================================================

export interface ThemePalette {
  id: string;
  label: string;
  dark: boolean;
  /** Fondo del editor. */
  bg: string;
  /** Color de texto por defecto. */
  fg: string;
  /** Fondo de la barra de título. */
  chrome: string;
  /** Borde interno del editor. */
  border: string;
  /** Números de línea. */
  gutter: string;
  /** Banda de fondo de una línea resaltada. */
  highlight: string;
  /** Barra vertical de la línea resaltada. */
  accent: string;
  comment: string;
  punctuation: string;
  property: string;
  number: string;
  string: string;
  operator: string;
  keyword: string;
  function: string;
  className: string;
  regex: string;
}

export const THEMES: ThemePalette[] = [
  {
    id: 'one-dark', label: 'One Dark', dark: true,
    bg: '#282c34', fg: '#abb2bf', chrome: '#21252b', border: 'rgba(255,255,255,0.08)',
    gutter: '#4b5263', highlight: 'rgba(97,175,239,0.10)', accent: '#61afef',
    comment: '#5c6370', punctuation: '#abb2bf', property: '#d19a66', number: '#d19a66',
    string: '#98c379', operator: '#56b6c2', keyword: '#c678dd', function: '#61afef',
    className: '#e5c07b', regex: '#c678dd',
  },
  {
    id: 'dracula', label: 'Dracula', dark: true,
    bg: '#282a36', fg: '#f8f8f2', chrome: '#21222c', border: 'rgba(255,255,255,0.08)',
    gutter: '#6272a4', highlight: 'rgba(189,147,249,0.12)', accent: '#bd93f9',
    comment: '#6272a4', punctuation: '#f8f8f2', property: '#ff79c6', number: '#bd93f9',
    string: '#f1fa8c', operator: '#ff79c6', keyword: '#ff79c6', function: '#50fa7b',
    className: '#8be9fd', regex: '#f1fa8c',
  },
  {
    id: 'vs-code', label: 'VS Code Dark+', dark: true,
    bg: '#1e1e1e', fg: '#d4d4d4', chrome: '#252526', border: 'rgba(255,255,255,0.07)',
    gutter: '#858585', highlight: 'rgba(86,156,214,0.12)', accent: '#569cd6',
    comment: '#6a9955', punctuation: '#d4d4d4', property: '#9cdcfe', number: '#b5cea8',
    string: '#ce9178', operator: '#d4d4d4', keyword: '#569cd6', function: '#dcdcaa',
    className: '#4ec9b0', regex: '#d16969',
  },
  {
    id: 'night-owl', label: 'Night Owl', dark: true,
    bg: '#011627', fg: '#d6deeb', chrome: '#01111d', border: 'rgba(255,255,255,0.07)',
    gutter: '#4b6479', highlight: 'rgba(130,170,255,0.12)', accent: '#82aaff',
    comment: '#637777', punctuation: '#c792ea', property: '#7fdbca', number: '#f78c6c',
    string: '#ecc48d', operator: '#7fdbca', keyword: '#c792ea', function: '#82aaff',
    className: '#addb67', regex: '#ecc48d',
  },
  {
    id: 'tokyo-night', label: 'Tokyo Night', dark: true,
    bg: '#1a1b26', fg: '#a9b1d6', chrome: '#16161e', border: 'rgba(255,255,255,0.06)',
    gutter: '#3b4261', highlight: 'rgba(122,162,247,0.12)', accent: '#7aa2f7',
    comment: '#565f89', punctuation: '#89ddff', property: '#7dcfff', number: '#ff9e64',
    string: '#9ece6a', operator: '#89ddff', keyword: '#bb9af7', function: '#7aa2f7',
    className: '#2ac3de', regex: '#b4f9f8',
  },
  {
    id: 'nord', label: 'Nord', dark: true,
    bg: '#2e3440', fg: '#d8dee9', chrome: '#272c36', border: 'rgba(255,255,255,0.07)',
    gutter: '#4c566a', highlight: 'rgba(136,192,208,0.13)', accent: '#88c0d0',
    comment: '#616e88', punctuation: '#eceff4', property: '#8fbcbb', number: '#b48ead',
    string: '#a3be8c', operator: '#81a1c1', keyword: '#81a1c1', function: '#88c0d0',
    className: '#8fbcbb', regex: '#ebcb8b',
  },
  {
    id: 'catppuccin', label: 'Catppuccin Mocha', dark: true,
    bg: '#1e1e2e', fg: '#cdd6f4', chrome: '#181825', border: 'rgba(255,255,255,0.06)',
    gutter: '#45475a', highlight: 'rgba(203,166,247,0.12)', accent: '#cba6f7',
    comment: '#6c7086', punctuation: '#9399b2', property: '#f38ba8', number: '#fab387',
    string: '#a6e3a1', operator: '#89dceb', keyword: '#cba6f7', function: '#89b4fa',
    className: '#f9e2af', regex: '#f5c2e7',
  },
  {
    id: 'synthwave', label: 'Synthwave 84', dark: true,
    bg: '#2b213a', fg: '#e5e5e5', chrome: '#241b32', border: 'rgba(255,255,255,0.09)',
    gutter: '#5b5178', highlight: 'rgba(249,42,173,0.14)', accent: '#f92aad',
    comment: '#848bb3', punctuation: '#fede5d', property: '#2befef', number: '#f97e72',
    string: '#72f1b8', operator: '#36f9f6', keyword: '#fede5d', function: '#f92aad',
    className: '#2befef', regex: '#fede5d',
  },
  {
    id: 'github-light', label: 'GitHub Light', dark: false,
    bg: '#ffffff', fg: '#24292f', chrome: '#f6f8fa', border: 'rgba(27,31,36,0.15)',
    gutter: '#8c959f', highlight: 'rgba(84,174,255,0.16)', accent: '#0969da',
    comment: '#6e7781', punctuation: '#24292f', property: '#0550ae', number: '#0550ae',
    string: '#0a3069', operator: '#cf222e', keyword: '#cf222e', function: '#8250df',
    className: '#953800', regex: '#0a3069',
  },
  {
    id: 'solarized-light', label: 'Solarized Light', dark: false,
    bg: '#fdf6e3', fg: '#586e75', chrome: '#eee8d5', border: 'rgba(101,123,131,0.25)',
    gutter: '#93a1a1', highlight: 'rgba(38,139,210,0.14)', accent: '#268bd2',
    comment: '#93a1a1', punctuation: '#586e75', property: '#268bd2', number: '#d33682',
    string: '#2aa198', operator: '#859900', keyword: '#859900', function: '#268bd2',
    className: '#b58900', regex: '#dc322f',
  },
];

const BY_ID = new Map(THEMES.map(t => [t.id, t]));
export const getTheme = (id: string): ThemePalette => BY_ID.get(id) || THEMES[0];

/**
 * CSS de los tokens del tema. Se inyecta con un selector de ámbito
 * (`.codecard-code`) para que no se filtre a otros bloques de código de la
 * página, y las reglas cubren los tipos de token que emiten las ~48 gramáticas,
 * no solo las 12 de antes.
 */
export function themeCss(theme: ThemePalette): string {
  const t = theme;
  return `
.codecard-code { color: ${t.fg}; }
.codecard-code .token.comment,
.codecard-code .token.prolog,
.codecard-code .token.doctype,
.codecard-code .token.cdata { color: ${t.comment}; font-style: italic; }
.codecard-code .token.punctuation { color: ${t.punctuation}; }
.codecard-code .token.namespace { opacity: 0.75; }
.codecard-code .token.property,
.codecard-code .token.tag,
.codecard-code .token.constant,
.codecard-code .token.symbol,
.codecard-code .token.attr-name,
.codecard-code .token.key { color: ${t.property}; }
.codecard-code .token.boolean,
.codecard-code .token.number,
.codecard-code .token.unit { color: ${t.number}; }
.codecard-code .token.selector,
.codecard-code .token.string,
.codecard-code .token.char,
.codecard-code .token.attr-value,
.codecard-code .token.builtin,
.codecard-code .token.inserted,
.codecard-code .token.interpolation-punctuation { color: ${t.string}; }
.codecard-code .token.operator,
.codecard-code .token.entity,
.codecard-code .token.url,
.codecard-code .token.variable { color: ${t.operator}; }
.codecard-code .token.atrule,
.codecard-code .token.keyword,
.codecard-code .token.rule,
.codecard-code .token.directive,
.codecard-code .token.important { color: ${t.keyword}; }
.codecard-code .token.function,
.codecard-code .token.macro,
.codecard-code .token.method { color: ${t.function}; }
.codecard-code .token.class-name,
.codecard-code .token.maybe-class-name,
.codecard-code .token.type,
.codecard-code .token.annotation { color: ${t.className}; }
.codecard-code .token.regex,
.codecard-code .token.regex-delimiter { color: ${t.regex}; }
.codecard-code .token.deleted { color: ${t.regex}; }
.codecard-code .token.bold { font-weight: 700; }
.codecard-code .token.italic { font-style: italic; }
`.trim();
}
