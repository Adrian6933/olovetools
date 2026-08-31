import type { KeyBlock, KeyRow, LayoutKind, PhysicalKey } from '../types';

// ============================================================================
// Physical keyboard layouts
// ----------------------------------------------------------------------------
// Positions and widths only. The *labels* are deliberately weak here: the real
// ones come from navigator.keyboard.getLayoutMap() at runtime, so a Spanish
// board shows Ñ where a US one shows the semicolon. The fallbacks below are
// only for browsers without the Keyboard Map API (Firefox, Safari).
// ============================================================================

const k = (code: string, fallback: string, w = 1, fallbackShift?: string): PhysicalKey => ({
  code,
  w,
  fallback,
  fallbackShift,
});
const gap = (w: number) => ({ spacer: w });

const FN_ROW: KeyRow = [
  k('Escape', 'Esc'),
  gap(1),
  k('F1', 'F1'),
  k('F2', 'F2'),
  k('F3', 'F3'),
  k('F4', 'F4'),
  gap(0.5),
  k('F5', 'F5'),
  k('F6', 'F6'),
  k('F7', 'F7'),
  k('F8', 'F8'),
  gap(0.5),
  k('F9', 'F9'),
  k('F10', 'F10'),
  k('F11', 'F11'),
  k('F12', 'F12'),
];

const DIGIT_ROW = (last: PhysicalKey): KeyRow => [
  k('Backquote', '`', 1, '~'),
  k('Digit1', '1', 1, '!'),
  k('Digit2', '2', 1, '@'),
  k('Digit3', '3', 1, '#'),
  k('Digit4', '4', 1, '$'),
  k('Digit5', '5', 1, '%'),
  k('Digit6', '6', 1, '^'),
  k('Digit7', '7', 1, '&'),
  k('Digit8', '8', 1, '*'),
  k('Digit9', '9', 1, '('),
  k('Digit0', '0', 1, ')'),
  k('Minus', '-', 1, '_'),
  k('Equal', '=', 1, '+'),
  last,
];

const LETTERS_TOP = ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP'];
const LETTERS_HOME = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL'];
const LETTERS_BOTTOM = ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM'];

const letter = (code: string) => k(code, code.replace('Key', ''));

const NAV_BLOCK: KeyBlock = {
  id: 'nav',
  rows: [
    [k('PrintScreen', 'PrtSc'), k('ScrollLock', 'Scroll'), k('Pause', 'Pause')],
    [k('Insert', 'Ins'), k('Home', 'Home'), k('PageUp', 'PgUp')],
    [k('Delete', 'Del'), k('End', 'End'), k('PageDown', 'PgDn')],
    [gap(1), k('ArrowUp', '↑'), gap(1)],
    [k('ArrowLeft', '←'), k('ArrowDown', '↓'), k('ArrowRight', '→')],
  ],
};

const NUMPAD_BLOCK: KeyBlock = {
  id: 'numpad',
  rows: [
    [k('NumLock', 'Num'), k('NumpadDivide', '/'), k('NumpadMultiply', '*'), k('NumpadSubtract', '-')],
    [k('Numpad7', '7'), k('Numpad8', '8'), k('Numpad9', '9'), k('NumpadAdd', '+', 1)],
    [k('Numpad4', '4'), k('Numpad5', '5'), k('Numpad6', '6'), gap(1)],
    [k('Numpad1', '1'), k('Numpad2', '2'), k('Numpad3', '3'), k('NumpadEnter', '⏎', 1)],
    [k('Numpad0', '0', 2), k('NumpadDecimal', '.'), gap(1)],
  ],
};

/** ANSI 104: one-row Enter, Backslash above it, no key beside the left Shift. */
const ANSI_MAIN: KeyBlock = {
  id: 'main',
  rows: [
    FN_ROW,
    DIGIT_ROW(k('Backspace', '⌫', 2)),
    [k('Tab', 'Tab', 1.5), ...LETTERS_TOP.map(letter), k('BracketLeft', '[', 1, '{'), k('BracketRight', ']', 1, '}'), k('Backslash', '\\', 1.5, '|')],
    [k('CapsLock', 'Caps', 1.75), ...LETTERS_HOME.map(letter), k('Semicolon', ';', 1, ':'), k('Quote', "'", 1, '"'), k('Enter', 'Enter', 2.25)],
    [k('ShiftLeft', 'Shift', 2.25), ...LETTERS_BOTTOM.map(letter), k('Comma', ',', 1, '<'), k('Period', '.', 1, '>'), k('Slash', '/', 1, '?'), k('ShiftRight', 'Shift', 2.75)],
    [
      k('ControlLeft', 'Ctrl', 1.25),
      k('MetaLeft', 'Meta', 1.25),
      k('AltLeft', 'Alt', 1.25),
      k('Space', '', 6.25),
      k('AltRight', 'Alt', 1.25),
      k('MetaRight', 'Meta', 1.25),
      k('ContextMenu', 'Menu', 1.25),
      k('ControlRight', 'Ctrl', 1.25),
    ],
  ],
};

/** ISO 105: tall Enter, Backslash moved next to it, IntlBackslash by left Shift. */
const ISO_MAIN: KeyBlock = {
  id: 'main',
  rows: [
    FN_ROW,
    DIGIT_ROW(k('Backspace', '⌫', 2)),
    [k('Tab', 'Tab', 1.5), ...LETTERS_TOP.map(letter), k('BracketLeft', '[', 1, '{'), k('BracketRight', ']', 1, '}'), k('Enter', 'Enter', 1.5, undefined)],
    [k('CapsLock', 'Caps', 1.75), ...LETTERS_HOME.map(letter), k('Semicolon', ';', 1, ':'), k('Quote', "'", 1, '"'), k('Backslash', '\\', 1, '|')],
    [k('ShiftLeft', 'Shift', 1.25), k('IntlBackslash', '<', 1, '>'), ...LETTERS_BOTTOM.map(letter), k('Comma', ',', 1, ';'), k('Period', '.', 1, ':'), k('Slash', '/', 1, '?'), k('ShiftRight', 'Shift', 2.75)],
    [
      k('ControlLeft', 'Ctrl', 1.25),
      k('MetaLeft', 'Meta', 1.25),
      k('AltLeft', 'Alt', 1.25),
      k('Space', '', 6.25),
      k('AltRight', 'AltGr', 1.25),
      k('MetaRight', 'Meta', 1.25),
      k('ContextMenu', 'Menu', 1.25),
      k('ControlRight', 'Ctrl', 1.25),
    ],
  ],
};

/** JIS 109: extra Yen / Ro keys and the three kana keys around a short space. */
const JIS_MAIN: KeyBlock = {
  id: 'main',
  rows: [
    FN_ROW,
    [...DIGIT_ROW(k('IntlYen', '¥')), k('Backspace', '⌫', 1)],
    [k('Tab', 'Tab', 1.5), ...LETTERS_TOP.map(letter), k('BracketLeft', '[', 1, '{'), k('BracketRight', ']', 1, '}'), k('Enter', 'Enter', 1.5)],
    [k('CapsLock', 'Caps', 1.75), ...LETTERS_HOME.map(letter), k('Semicolon', ';', 1, '+'), k('Quote', ':', 1, '*'), k('Backslash', ']', 1)],
    [k('ShiftLeft', 'Shift', 2.25), ...LETTERS_BOTTOM.map(letter), k('Comma', ',', 1, '<'), k('Period', '.', 1, '>'), k('Slash', '/', 1, '?'), k('IntlRo', '＼'), k('ShiftRight', 'Shift', 1.75)],
    [
      k('ControlLeft', 'Ctrl', 1.25),
      k('MetaLeft', 'Meta'),
      k('AltLeft', 'Alt'),
      k('NonConvert', '無変換'),
      k('Space', '', 3),
      k('Convert', '変換'),
      k('KanaMode', 'かな'),
      k('AltRight', 'Alt'),
      k('MetaRight', 'Meta'),
      k('ContextMenu', 'Menu'),
      k('ControlRight', 'Ctrl', 1.25),
    ],
  ],
};

export const LAYOUTS: Record<LayoutKind, KeyBlock[]> = {
  ansi: [ANSI_MAIN, NAV_BLOCK, NUMPAD_BLOCK],
  iso: [ISO_MAIN, NAV_BLOCK, NUMPAD_BLOCK],
  jis: [JIS_MAIN, NAV_BLOCK, NUMPAD_BLOCK],
};

export const isKey = (item: KeyRow[number]): item is PhysicalKey => 'code' in item;

/** Every code a layout can produce, used for the coverage percentage. */
export function codesOf(layout: LayoutKind): string[] {
  const out: string[] = [];
  LAYOUTS[layout].forEach(block =>
    block.rows.forEach(row => row.forEach(item => isKey(item) && out.push(item.code)))
  );
  return out;
}

/**
 * Best guess at the physical layout, refined later by what the browser reports.
 * Language alone is a hint, not proof: plenty of Spanish speakers type on ANSI.
 * The picker stays visible so the guess is never the last word.
 */
export function guessLayout(lang: string): LayoutKind {
  if (lang === 'ja') return 'jis';
  // en-US and most of Asia ship ANSI; continental Europe ships ISO.
  if (['es', 'fr', 'de', 'pt', 'ru'].includes(lang)) return 'iso';
  return 'ansi';
}

/**
 * A board that reports IntlBackslash or IntlYen has told us what it physically
 * is, which beats guessing from the interface language.
 */
export function layoutFromCode(code: string): LayoutKind | null {
  if (code === 'IntlYen' || code === 'IntlRo' || code === 'KanaMode' || code === 'Convert') return 'jis';
  if (code === 'IntlBackslash') return 'iso';
  return null;
}
