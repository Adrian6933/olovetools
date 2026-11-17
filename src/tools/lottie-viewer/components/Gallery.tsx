import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, X } from 'lucide-react';
import type { StagedFile } from '../types';
import { formatBytes } from '../utils/lottieFile';

/**
 * One small looping preview. The player is only created while the card is on
 * screen, so a pack of 40 stickers does not run 40 animations at once.
 */
function Thumb({ lottie, file, playing }: { lottie: any; file: StagedFile; playing: boolean }) {
  const box = useRef<HTMLDivElement | null>(null);
  const anim = useRef<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!lottie || !box.current || !visible) return;
    try {
      anim.current = lottie.loadAnimation({
        container: box.current,
        renderer: 'svg',
        loop: true,
        autoplay: playing,
        // Each card gets its own copy: lottie-web mutates the data it is given.
        animationData: structuredClone(file.json),
        rendererSettings: { preserveAspectRatio: 'xMidYMid meet', progressiveLoad: true },
      });
    } catch {
      anim.current = null;
    }
    return () => {
      anim.current?.destroy();
      anim.current = null;
    };
    // `playing` is applied below without rebuilding the player.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lottie, file, visible]);

  useEffect(() => {
    if (!anim.current) return;
    if (playing) anim.current.play();
    else anim.current.pause();
  }, [playing]);

  return <div ref={box} className="w-full aspect-square" />;
}

interface Props {
  lottie: any;
  files: StagedFile[];
  t: any;
  onOpen: (file: StagedFile) => void;
  onClose: () => void;
}

/** Several files dropped at once: a contact sheet of animations, all playing. */
export function Gallery({ lottie, files, t, onOpen, onClose }: Props) {
  const [playing, setPlaying] = useState(true);
  const [bg, setBg] = useState<'dark' | 'light'>('dark');

  return (
    <div className="glass-card rounded-3xl p-4 md:p-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-black text-white">
          {(t.galleryTitle || '{n} animations').replace('{n}', String(files.length))}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBg(b => (b === 'dark' ? 'light' : 'dark'))}
            className="px-3 h-9 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 cursor-pointer"
          >
            {bg === 'dark' ? t.galleryLight || 'Light background' : t.galleryDark || 'Dark background'}
          </button>
          <button
            onClick={() => setPlaying(p => !p)}
            aria-label={playing ? t.btn_pause || 'Pause' : t.btn_play || 'Play'}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center cursor-pointer"
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button onClick={onClose} aria-label={t.btn_close || 'Close'} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="text-xs text-slate-500">{t.galleryHint || 'Click one to open it in the player and editor.'}</p>
      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 list-none p-0 m-0">
        {files.map((file, i) => (
          <li key={`${i}-${file.name}`}>
            <button
              onClick={() => onOpen(file)}
              className={`w-full text-left rounded-2xl overflow-hidden border border-white/10 hover:border-indigo-400/60 transition-colors cursor-pointer ${
                bg === 'dark' ? 'bg-[#0b0b14]' : 'bg-white'
              }`}
            >
              <Thumb lottie={lottie} file={file} playing={playing} />
              <span className="block px-3 py-2 bg-black/60 border-t border-white/5">
                <span className="block text-xs font-bold text-slate-200 truncate">{file.name}</span>
                <span className="block text-[10px] text-slate-500 font-mono">
                  {file.json.w}×{file.json.h} · {formatBytes(file.diagnostics.bytes)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
