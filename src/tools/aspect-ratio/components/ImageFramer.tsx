import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, Loader2, Redo2, Trash2, Undo2, Upload } from 'lucide-react';

import { RatioCanvas, paintFrame, type BarFill } from './RatioCanvas';
import { NextStepBar } from './NextStepBar';
import { useHandoffIntake } from '../../../lib/useHandoff';
import { fitInto, frameForRatio, parseDimension, simplifyRatio } from '../lib/ratio';
import type { EditState, FitMode, Size } from '../types';

const DEFAULT_EDIT: EditState = { ratioW: 9, ratioH: 16, mode: 'cover', offsetX: 0, offsetY: 0, zoom: 1 };

/** Target ratios offered for converting an image. */
const TARGETS: { label: string; w: number; h: number }[] = [
  { label: '9:16', w: 9, h: 16 },
  { label: '16:9', w: 16, h: 9 },
  { label: '1:1', w: 1, h: 1 },
  { label: '4:5', w: 4, h: 5 },
  { label: '4:3', w: 4, h: 3 },
  { label: '3:2', w: 3, h: 2 },
  { label: '2:3', w: 2, h: 3 },
  { label: '21:9', w: 64, h: 27 },
  { label: '1.91:1', w: 191, h: 100 },
];

interface Loaded {
  file: File;
  url: string;
  natural: Size;
  bitmap: CanvasImageSource;
}

const pct = (f: number) => `${(f * 100).toFixed(f < 0.01 ? 2 : 1)}%`;

/**
 * "Convert an image to another ratio": drop a picture, pick 9:16 or any other
 * frame, move it, and download. The file is decoded in this tab and never
 * leaves it.
 */
export function ImageFramer({ t, lang }: { t: any; lang: string }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [edit, setEdit] = useState<EditState>(DEFAULT_EDIT);
  const [history, setHistory] = useState<EditState[]>([DEFAULT_EDIT]);
  const [histIndex, setHistIndex] = useState(0);
  const [barFill, setBarFill] = useState<BarFill>('blur');
  const [outWidth, setOutWidth] = useState('1080');
  const [format, setFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/jpeg');
  const [exporting, setExporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  const readFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) return;
      setError(null);
      setReading(true);
      const url = URL.createObjectURL(file);
      try {
        let natural: Size;
        let bitmap: CanvasImageSource;
        if (file.type.startsWith('video/')) {
          // A still from the first frame is enough to decide the framing.
          const video = document.createElement('video');
          video.muted = true;
          video.preload = 'auto';
          video.src = url;
          await new Promise<void>((resolve, reject) => {
            video.onloadeddata = () => resolve();
            video.onerror = () => reject(new Error('decode'));
          });
          natural = { w: video.videoWidth, h: video.videoHeight };
          const still = document.createElement('canvas');
          still.width = natural.w;
          still.height = natural.h;
          still.getContext('2d')?.drawImage(video, 0, 0);
          bitmap = still;
        } else {
          const img = new Image();
          img.decoding = 'async';
          img.src = url;
          await img.decode();
          natural = { w: img.naturalWidth, h: img.naturalHeight };
          bitmap = img;
        }
        if (!(natural.w > 0)) throw new Error('decode');
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = url;
        setLoaded({ file, url, natural, bitmap });
        // Native resolution for the chosen frame: never upscale by default.
        setOutWidth(String(frameForRatio(natural, edit.ratioW, edit.ratioH, 2).w));
      } catch {
        URL.revokeObjectURL(url);
        const ext = (file.name.split('.').pop() || '').toUpperCase();
        setError((t.errorDecode || 'Your browser could not decode this file ({format}).').replace('{format}', ext || file.type || '?'));
      } finally {
        setReading(false);
      }
    },
    [edit.ratioW, edit.ratioH, t]
  );

  useHandoffIntake(file => void readFile(file));

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
      const file = Array.from(e.clipboardData?.items || []).find(i => i.type.startsWith('image/'))?.getAsFile();
      if (file) void readFile(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [readFile]);

  const pushEdit = useCallback(
    (next: EditState, commit: boolean) => {
      setEdit(next);
      if (!commit) return;
      setHistory(prev => {
        const trimmed = prev.slice(0, histIndex + 1);
        const last = trimmed[trimmed.length - 1];
        if (last && JSON.stringify(last) === JSON.stringify(next)) return prev;
        const grown = [...trimmed, next].slice(-200);
        setHistIndex(grown.length - 1);
        return grown;
      });
    },
    [histIndex]
  );

  const undo = useCallback(() => {
    setHistIndex(i => {
      if (i <= 0) return i;
      setEdit(history[i - 1]);
      return i - 1;
    });
  }, [history]);

  const redo = useCallback(() => {
    setHistIndex(i => {
      if (i >= history.length - 1) return i;
      setEdit(history[i + 1]);
      return i + 1;
    });
  }, [history]);

  const setRatio = (w: number, h: number) => {
    pushEdit({ ...edit, ratioW: w, ratioH: h, offsetX: 0, offsetY: 0 }, true);
    if (loaded) setOutWidth(String(frameForRatio(loaded.natural, w, h, 2).w));
  };
  const setMode = (mode: FitMode) => pushEdit({ ...edit, mode }, true);

  useEffect(() => {
    if (!loaded) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [loaded, undo, redo]);

  const report = useMemo(() => {
    if (!loaded) return null;
    const frame = frameForRatio(loaded.natural, edit.ratioW, edit.ratioH, 1);
    if (!(frame.w > 0)) return null;
    return { cover: fitInto(loaded.natural, frame, 'cover'), contain: fitInto(loaded.natural, frame, 'contain') };
  }, [loaded, edit.ratioW, edit.ratioH]);

  const outputSize = useMemo<Size>(() => {
    const w = parseDimension(outWidth);
    if (!(w > 0)) return { w: 0, h: 0 };
    return frameForRatio({ w, h: (w * edit.ratioH) / edit.ratioW }, edit.ratioW, edit.ratioH, 2);
  }, [outWidth, edit.ratioW, edit.ratioH]);

  const renderResult = useCallback(async (): Promise<{ blob: Blob; name: string } | null> => {
    if (!loaded || !(outputSize.w > 0)) return null;
    const canvas = document.createElement('canvas');
    canvas.width = outputSize.w;
    canvas.height = outputSize.h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    paintFrame(ctx, loaded.bitmap, loaded.natural, outputSize, edit, barFill);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, format, format === 'image/png' ? undefined : 0.92));
    if (!blob) return null;
    const ext = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';
    const r = simplifyRatio(edit.ratioW, edit.ratioH, 200);
    const stem = loaded.file.name.replace(/\.[^.]+$/, '') || 'image';
    return { blob, name: `${stem}-${r.w}x${r.h}.${ext}` };
  }, [loaded, outputSize, edit, barFill, format]);

  const download = async () => {
    setExporting(true);
    try {
      const result = await renderResult();
      if (!result) return;
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } finally {
      setExporting(false);
    }
  };

  const clear = () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setLoaded(null);
    setEdit(DEFAULT_EDIT);
    setHistory([DEFAULT_EDIT]);
    setHistIndex(0);
  };

  const chip = (active: boolean) =>
    `px-3 h-9 rounded-xl text-xs font-black border cursor-pointer transition-colors ${
      active ? 'bg-lime-400 text-lime-950 border-lime-300' : 'bg-white/5 border-white/10 text-slate-300 hover:text-lime-300'
    }`;

  const input = (
    <input
      ref={fileRef}
      type="file"
      accept="image/*,video/*"
      className="hidden"
      onChange={e => {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (f) void readFile(f);
      }}
    />
  );

  if (!loaded) {
    return (
      <div>
        {input}
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileRef.current?.click()}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && fileRef.current?.click()}
          onDragOver={e => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) void readFile(f);
          }}
          className={`rounded-2xl border-2 border-dashed px-5 py-10 text-center flex flex-col items-center gap-3 cursor-pointer transition-colors ${
            dragOver ? 'border-lime-400 bg-lime-400/10' : 'border-white/15 hover:border-lime-500/50 bg-black/25'
          }`}
        >
          {reading ? <Loader2 className="w-8 h-8 text-lime-300 animate-spin" /> : <Upload className="w-8 h-8 text-lime-300" />}
          <span className="text-base font-black text-white">{t.framerDrop || 'Choose or drop an image'}</span>
          <span className="text-sm text-slate-400">{t.framerDropHint || 'Or paste it with Ctrl+V. JPG, PNG, WebP, or the first frame of a video.'}</span>
        </div>
        {error && <p className="text-sm text-amber-300 font-bold mt-3">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {input}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-black uppercase tracking-widest text-slate-500 mr-1">{t.framerTarget || 'Convert to'}</span>
        {TARGETS.map(r => (
          <button key={r.label} onClick={() => setRatio(r.w, r.h)} className={chip(edit.ratioW === r.w && edit.ratioH === r.h)}>
            {r.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        <div className="space-y-3 min-w-0">
          <RatioCanvas source={{ bitmap: loaded.bitmap, natural: loaded.natural }} edit={edit} barFill={barFill} onEditChange={pushEdit} t={t} />
          <div className="flex flex-wrap items-center gap-2">
            {(['cover', 'contain'] as const).map(mode => (
              <button key={mode} onClick={() => setMode(mode)} className={chip(edit.mode === mode)}>
                {mode === 'cover' ? t.modeCover || 'Crop to fill' : t.modeContain || 'Fit with bars'}
              </button>
            ))}
            {edit.mode === 'contain' &&
              (['blur', 'black', 'white', 'transparent'] as const).map(fill => (
                <button key={fill} onClick={() => setBarFill(fill)} className={chip(barFill === fill)}>
                  {t[`bar_${fill}`] || fill}
                </button>
              ))}
            <span className="ml-auto flex gap-1.5">
              <button onClick={undo} disabled={histIndex <= 0} aria-label={t.undo || 'Undo'} className="w-9 h-9 rounded-xl bg-white/5 text-slate-300 disabled:opacity-30 flex items-center justify-center cursor-pointer">
                <Undo2 className="w-4 h-4" />
              </button>
              <button onClick={redo} disabled={histIndex >= history.length - 1} aria-label={t.redo || 'Redo'} className="w-9 h-9 rounded-xl bg-white/5 text-slate-300 disabled:opacity-30 flex items-center justify-center cursor-pointer">
                <Redo2 className="w-4 h-4" />
              </button>
            </span>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl bg-black/25 border border-white/10 p-4">
          <p className="text-xs text-slate-400">
            {t.label_original || 'Original size'}: <span className="font-mono text-slate-200">{loaded.natural.w}×{loaded.natural.h}</span>
          </p>
          {report && (
            <p className="text-sm font-bold text-white">
              {edit.mode === 'cover'
                ? (t.framerCropped || '{p} of the picture is cut off').replace('{p}', pct(report.cover.cropped))
                : (t.framerBars || 'Bars fill {p} of the frame').replace('{p}', pct(report.contain.padded))}
            </p>
          )}
          <label className="block">
            <span className="block text-[11px] font-black uppercase tracking-widest text-lime-300/70 mb-1.5">{t.label_output_width || 'Output width'}</span>
            <input
              inputMode="numeric"
              value={outWidth}
              onChange={e => setOutWidth(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-black/40 border border-lime-500/20 text-white font-mono focus:outline-none focus:border-lime-400"
            />
            <span className="block text-xs text-slate-400 font-mono mt-1">{outputSize.w > 0 ? `${outputSize.w} × ${outputSize.h} px` : '—'}</span>
          </label>
          <div className="flex gap-1.5">
            {(['image/jpeg', 'image/png', 'image/webp'] as const).map(f => (
              <button key={f} onClick={() => setFormat(f)} className={chip(format === f)}>
                {f.replace('image/', '').replace('jpeg', 'jpg').toUpperCase()}
              </button>
            ))}
          </div>
          <button
            onClick={download}
            disabled={exporting || !(outputSize.w > 0)}
            className="w-full h-12 rounded-2xl bg-lime-400 hover:bg-lime-300 text-lime-950 font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {t.button_download || 'Download the image'}
          </button>
          <div className="flex gap-2">
            <button onClick={() => fileRef.current?.click()} className="flex-1 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 cursor-pointer">
              {t.framerOther || 'Another image'}
            </button>
            <button onClick={clear} aria-label={t.removeFile || 'Remove the image'} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-red-500/15 text-slate-300 hover:text-red-300 flex items-center justify-center cursor-pointer">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <NextStepBar lang={lang} t={t} getResult={renderResult} />
    </div>
  );
}
