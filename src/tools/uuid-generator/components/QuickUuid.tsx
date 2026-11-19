import React, { useCallback, useEffect, useState } from 'react';
import { Check, Copy, RefreshCw } from 'lucide-react';

type QuickKind = 'v4' | 'v7';

const hex = (bytes: Uint8Array) => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
const dashed = (h: string) => `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;

function uuidV4(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  return dashed(hex(b));
}

/** RFC 9562 v7: 48-bit Unix milliseconds, then random bits; sorts by creation time. */
function uuidV7(): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  let ms = Date.now();
  for (let i = 5; i >= 0; i -= 1) {
    b[i] = ms % 256;
    ms = Math.floor(ms / 256);
  }
  b[6] = (b[6] & 0x0f) | 0x70;
  b[8] = (b[8] & 0x3f) | 0x80;
  return dashed(hex(b));
}

const make = (kind: QuickKind) => (kind === 'v7' ? uuidV7() : uuidV4());

/**
 * What most visitors came for: one fresh UUID, ready to copy, with no options
 * to read first. Generated on mount only, so the server HTML never ships a
 * UUID that everyone would share.
 */
export function QuickUuid({ t }: { t: any }) {
  const [kind, setKind] = useState<QuickKind>('v4');
  const [value, setValue] = useState('');
  const [upper, setUpper] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => setValue(make(kind)), [kind]);

  const shown = upper ? value.toUpperCase() : value;

  const copy = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied(c => (c === key ? null : c)), 1500);
    } catch {
      /* the value is selectable on screen */
    }
  }, []);

  const copyTen = () => {
    const list = Array.from({ length: 10 }, () => make(kind)).map(u => (upper ? u.toUpperCase() : u));
    void copy(list.join('\n'), 'ten');
  };

  const chip = (active: boolean) =>
    `px-3.5 h-10 rounded-xl text-sm font-black border cursor-pointer transition-colors ${
      active ? 'bg-violet-500 text-white border-violet-400' : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
    }`;

  return (
    <div className="glass-card rounded-3xl p-4 md:p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 mr-1">{t.quickLabel || 'Your UUID'}</span>
        <button onClick={() => setKind('v4')} className={chip(kind === 'v4')} aria-pressed={kind === 'v4'}>
          v4 <span className="font-medium opacity-70">· {t.quickRandom || 'random'}</span>
        </button>
        <button onClick={() => setKind('v7')} className={chip(kind === 'v7')} aria-pressed={kind === 'v7'}>
          v7 <span className="font-medium opacity-70">· {t.quickSortable || 'time-ordered'}</span>
        </button>
        <label className="ml-auto flex items-center gap-2 text-xs font-bold text-slate-400 cursor-pointer">
          <input type="checkbox" checked={upper} onChange={e => setUpper(e.target.checked)} className="accent-violet-500 w-4 h-4" />
          {t.quickUpper || 'Uppercase'}
        </label>
      </div>

      <output
        aria-live="polite"
        className="block w-full rounded-2xl bg-black/40 border border-violet-500/25 px-4 py-4 md:py-5 font-mono text-[1.05rem] sm:text-xl md:text-2xl font-bold text-white text-center break-all select-all min-h-[3.5rem]"
      >
        {shown || ' '}
      </output>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <button
          onClick={() => copy(shown, 'one')}
          disabled={!shown}
          className="col-span-2 sm:col-span-1 h-12 rounded-2xl bg-violet-500 hover:bg-violet-400 text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
        >
          {copied === 'one' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied === 'one' ? t.quickCopied || 'Copied' : t.quickCopy || 'Copy'}
        </button>
        <button
          onClick={() => setValue(make(kind))}
          className="h-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          {t.quickNew || 'New one'}
        </button>
        <button
          onClick={copyTen}
          className="h-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          {copied === 'ten' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          {t.quickTen || 'Copy 10'}
        </button>
      </div>
      <p className="text-xs text-slate-500">
        {t.quickHint || 'Generated in your browser with a cryptographic random source. Need thousands, another version or a custom format? Use the full generator below.'}
      </p>
    </div>
  );
}
