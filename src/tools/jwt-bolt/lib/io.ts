// ============================================================================
// Clipboard, downloads and file intake.
// ----------------------------------------------------------------------------
// The tool had none of it: no file input, no drag and drop, no download, and a
// clipboard call whose rejection was swallowed by `.catch(() => {})` while the
// button still flashed "Copied".
// ============================================================================

/** A token or a key file is text; anything this size is not one. */
export const MAX_BYTES = 2 * 1024 * 1024;

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

export function downloadText(text: string, filename: string, mime = 'text/plain') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_BYTES) {
      reject(new Error('too-large'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error('read-failed'));
    reader.onload = () => resolve(String(reader.result ?? '').replace(/^﻿/, ''));
    reader.readAsText(file);
  });
}

export const ACCEPT_ATTRIBUTE = '.txt,.jwt,.json,.jwks,.pem,.key,.pub,text/plain,application/json';

/** A dropped file is either the token to inspect or the key to check it with. */
export function classifyDrop(name: string, text: string): 'token' | 'key' {
  const trimmed = text.trim();
  if (/-----BEGIN /.test(trimmed)) return 'key';
  if (/\.(pem|key|pub)$/i.test(name)) return 'key';
  if (/^\{[\s\S]*"(keys|kty)"/.test(trimmed)) return 'key';
  // Three base64url runs separated by dots is a token and nothing else is.
  if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(trimmed)) return 'token';
  return /\.(jwks|json)$/i.test(name) ? 'key' : 'token';
}

/** Pulls the first thing that looks like a JWT out of a log line or a header. */
export function extractToken(text: string): string {
  const match = /[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]*/.exec(text);
  return match ? match[0] : text.trim();
}
