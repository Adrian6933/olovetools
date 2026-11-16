// ============================================================================
// Scan history and preferences, kept in this browser only
// ----------------------------------------------------------------------------
// Nothing here is sent anywhere. History can be switched off, and switching it
// off erases what was kept. Every storage access is wrapped: private windows
// and blocked storage must not break scanning.
// ============================================================================

export interface HistoryItem {
  id: string;
  text: string;
  format: string;
  /** Where it came from: camera, image, pdf, screen, text. */
  source: string;
  at: number;
}

const KEY = 'olovetools_qr_history';
const PREFS = 'olovetools_qr_prefs';
const LIMIT = 100;

export interface Prefs {
  keepHistory: boolean;
  sound: boolean;
  vibrate: boolean;
  /** Keep the camera running and collect every code (stock taking, tickets). */
  continuous: boolean;
}

export const DEFAULT_PREFS: Prefs = { keepHistory: true, sound: false, vibrate: true, continuous: false };

export function readPrefs(): Prefs {
  try {
    const raw = JSON.parse(localStorage.getItem(PREFS) || '{}');
    return { ...DEFAULT_PREFS, ...(raw && typeof raw === 'object' ? raw : {}) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function writePrefs(prefs: Prefs): void {
  try {
    localStorage.setItem(PREFS, JSON.stringify(prefs));
  } catch {
    /* not remembered, nothing else breaks */
  }
}

export function readHistory(): HistoryItem[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (!Array.isArray(list)) return [];
    return list.filter(i => i && typeof i.text === 'string' && typeof i.at === 'number').slice(0, LIMIT);
  } catch {
    return [];
  }
}

export function writeHistory(list: HistoryItem[]): void {
  try {
    if (list.length) localStorage.setItem(KEY, JSON.stringify(list.slice(0, LIMIT)));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage full or denied */
  }
}

/** Newest first; scanning the same thing again moves it to the top. */
export function addToHistory(list: HistoryItem[], item: Omit<HistoryItem, 'id' | 'at'>): HistoryItem[] {
  const rest = list.filter(i => !(i.text === item.text && i.format === item.format));
  const entry: HistoryItem = { ...item, id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, at: Date.now() };
  return [entry, ...rest].slice(0, LIMIT);
}

/** CSV with a BOM so Excel opens accents correctly. */
export function historyToCsv(list: HistoryItem[]): string {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = list.map(i => [new Date(i.at).toISOString(), i.format, i.source, i.text].map(esc).join(','));
  return '﻿' + ['"date","format","source","content"', ...rows].join('\r\n');
}

// ---------------------------------------------------------------------------
// Feedback on a successful read
// ---------------------------------------------------------------------------

let audio: AudioContext | null = null;

export function beep(): void {
  try {
    audio = audio || new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'sine';
    osc.frequency.value = 1320;
    gain.gain.setValueAtTime(0.0001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, audio.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.12);
    osc.connect(gain).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + 0.13);
  } catch {
    /* no audio, no problem */
  }
}

export function buzz(): void {
  try {
    navigator.vibrate?.(60);
  } catch {
    /* iOS has no vibration API */
  }
}
