// ============================================================================
// Clipboard, downloads, file intake.
// ----------------------------------------------------------------------------
// `navigator.clipboard.writeText()` was called bare, so on an insecure origin
// the promise rejected into nothing and the button still flashed "Copied".
// ============================================================================

/** An audio recording of Morse is small; anything this big is not one. */
export const MAX_AUDIO_BYTES = 40 * 1024 * 1024;

export const ACCEPT_AUDIO = 'audio/*,.wav,.mp3,.m4a,.ogg,.oga,.flac,.webm';
export const ACCEPT_TEXT = '.txt,text/plain';

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function downloadText(text: string, filename: string) {
  downloadBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), filename);
}

export type DropKind = 'audio' | 'text' | 'unknown';

export function classifyDrop(file: File): DropKind {
  if (file.type.startsWith('audio/') || /\.(wav|mp3|m4a|ogg|oga|flac|webm)$/i.test(file.name)) return 'audio';
  if (file.type.startsWith('text/') || /\.(txt|md)$/i.test(file.name)) return 'text';
  return 'unknown';
}

export function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error('read-failed'));
    reader.onload = () => resolve(String(reader.result ?? '').replace(/^﻿/, ''));
    reader.readAsText(file);
  });
}

export function formatSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0.0s';
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${Math.round(seconds % 60)}s`;
}
