// ============================================================================
// Unir todos los clips en un solo vídeo, en el orden de la lista.
// ----------------------------------------------------------------------------
// Primero se descargan (3 a la vez, como el ZIP) y luego se graban seguidos.
// La grabación va a velocidad real, así que se dice cuánto va a tardar antes de
// empezar, y después cuánto queda.
//
// Se pueden meter vídeos o imágenes propios entre los clips (una intro, un
// "suscríbete", un cierre). Se colocan por hueco: "después del clip 2" sigue
// siendo después del clip 2 aunque luego se reordenen los clips.
// ============================================================================
import React, { useEffect, useRef, useState } from 'react';
import { Clapperboard, Loader2, X, Sparkles, Blend, Download, Plus, ChevronUp, ChevronDown, ImageIcon, Film } from 'lucide-react';
import type { ClipData, WatermarkConfig } from './types';
import { useBrand } from './brand';
import { duracionDe, mergeClipsToVideo } from './mergeService';
import { loadStoredWatermarkConfig } from './watermarkService';

interface Props {
  clips: ClipData[];
  quality: string;
  /** Si la marca en todos está puesta, el vídeo unido la lleva también. */
  watermarkOn: boolean;
  watermarkConfig: WatermarkConfig | null;
  t: any;
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
}

const mmss = (seg: number) => {
  const s = Math.max(0, Math.round(seg));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${r}` : `${m}:${r}`;
};

/** Un vídeo o imagen que pone la persona. */
interface Propio {
  id: string;
  file: File;
  tipo: 'video' | 'imagen';
  nombre: string;
  /** Segundos: lo que dura el vídeo, o lo que se quiere ver la imagen. */
  dur: number;
  /** Miniatura (object URL de la imagen o fotograma del vídeo). */
  thumb: string;
  /** Cuántos clips van antes: 0 = al principio, clips.length = al final. */
  pos: number;
}

/** Lee la duración y saca un fotograma para la miniatura de un vídeo propio. */
const prepararVideo = (file: File) =>
  new Promise<{ dur: number; thumb: string }>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.muted = true;
    v.preload = 'auto';
    v.src = url;
    v.onerror = () => { URL.revokeObjectURL(url); reject(new Error('unreadable')); };
    let dur = 0;
    v.onloadedmetadata = async () => {
      dur = await duracionDe(v);
      // Con la duración ya sabida, al fotograma de la miniatura.
      // Solo vale el salto a este punto: el de medir la duración (al final)
      // también dispara seeked y daría una miniatura negra.
      const objetivo = Math.min(1, (dur || 2) / 3);
      v.onseeked = () => { if (Math.abs(v.currentTime - objetivo) < 0.3) miniatura(); };
      v.currentTime = objetivo;
    };
    const miniatura = () => {
      const c = document.createElement('canvas');
      c.width = 160;
      c.height = 90;
      const k = Math.min(160 / (v.videoWidth || 160), 90 / (v.videoHeight || 90));
      const w = (v.videoWidth || 160) * k;
      const h = (v.videoHeight || 90) * k;
      const x = c.getContext('2d')!;
      x.fillStyle = '#000';
      x.fillRect(0, 0, 160, 90);
      x.drawImage(v, (160 - w) / 2, (90 - h) / 2, w, h);
      URL.revokeObjectURL(url);
      resolve({ dur, thumb: c.toDataURL('image/jpeg', 0.7) });
    };
  });

type Estado =
  | { fase: 'descarga'; hechos: number; total: number }
  | { fase: 'render'; index: number; total: number; elapsed: number; duration: number; pct: number };

const MergePanel: React.FC<Props> = ({ clips, quality, watermarkOn, watermarkConfig, t, busy, onBusyChange }) => {
  const brand = useBrand();
  const [abierto, setAbierto] = useState(false);
  const [fundido, setFundido] = useState(true);
  const [conMarca, setConMarca] = useState(watermarkOn);
  const [estado, setEstado] = useState<Estado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [propios, setPropios] = useState<Propio[]>([]);
  const propiosRef = useRef(propios);
  propiosRef.current = propios;
  const inputRef = useRef<HTMLInputElement>(null);
  // Al vaciar la lista el panel desaparece: el trabajo en curso se corta y
  // las miniaturas de imágenes se sueltan.
  useEffect(() => () => {
    abortRef.current?.abort();
    propiosRef.current.forEach(p => { if (p.tipo === 'imagen') URL.revokeObjectURL(p.thumb); });
  }, []);

  // Si se quitan clips, lo propio que iba "al final" sigue al final.
  const n = clips.length;
  const posDe = (p: Propio) => Math.min(p.pos, n);

  const total = clips.reduce((s, c) => s + (c.duration || 0), 0) + propios.reduce((s, p) => s + p.dur, 0);
  const piezas = clips.length + propios.length;

  const anadir = async (files: FileList | null) => {
    if (!files) return;
    setError(null);
    for (const file of Array.from(files)) {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      if (file.type.startsWith('image/')) {
        setPropios(prev => [...prev, { id, file, tipo: 'imagen', nombre: file.name, dur: 4, thumb: URL.createObjectURL(file), pos: n }]);
      } else if (file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|mkv)$/i.test(file.name)) {
        try {
          const { dur, thumb } = await prepararVideo(file);
          setPropios(prev => [...prev, { id, file, tipo: 'video', nombre: file.name, dur, thumb, pos: n }]);
        } catch {
          // Lo que el navegador no sabe leer tampoco se podría grabar luego.
          setError((t.mergeOwnBad || "This browser can't read {f}. Try an MP4 or WebM.").replace('{f}', file.name));
        }
      }
    }
  };

  const mover = (id: string, paso: -1 | 1) =>
    setPropios(prev => prev.map(p => (p.id === id ? { ...p, pos: Math.max(0, Math.min(n, posDe(p) + paso)) } : p)));
  const quitar = (id: string) =>
    setPropios(prev => {
      const p = prev.find(x => x.id === id);
      if (p?.tipo === 'imagen') URL.revokeObjectURL(p.thumb);
      return prev.filter(x => x.id !== id);
    });
  const segundos = (id: string, v: number) =>
    setPropios(prev => prev.map(p => (p.id === id ? { ...p, dur: Math.max(1, Math.min(30, v || 1)) } : p)));

  /** Lo que sale en el vídeo, en orden: lo propio de cada hueco y luego su clip. */
  type Pieza = { tipo: 'clip'; clip: ClipData; i: number } | { tipo: 'propio'; p: Propio };
  const secuencia: Pieza[] = [];
  for (let i = 0; i <= n; i += 1) {
    propios.filter(p => posDe(p) === i).forEach(p => secuencia.push({ tipo: 'propio', p }));
    if (i < n) secuencia.push({ tipo: 'clip', clip: clips[i], i });
  }
  const dondeVa = (p: Propio) =>
    posDe(p) === 0 ? (t.mergeAtStart || 'At the start')
    : posDe(p) === n ? (t.mergeAtEnd || 'At the end')
    : (t.mergeAfterClip || 'After clip {n}').replace('{n}', String(posDe(p)));
  const alto = quality === '360' ? 360 : quality === '720' ? 720 : 1080;

  const elegirResolucion = (c: ClipData) =>
    quality === 'max'
      ? c.resolutions[0]
      : c.resolutions.find(r => r.quality === `${quality}p`) || c.resolutions.find(r => r.quality.startsWith(quality)) || c.resolutions[0];

  const empezar = async () => {
    if (piezas < 2 || estado) return;
    setError(null);
    setHecho(false);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    onBusyChange(true);
    try {
      setEstado({ fase: 'descarga', hechos: 0, total: clips.length });
      const blobs: Blob[] = new Array(clips.length);
      let hechos = 0;
      for (let i = 0; i < clips.length; i += 3) {
        await Promise.all(clips.slice(i, i + 3).map(async (c, k) => {
          const res = elegirResolucion(c);
          blobs[i + k] = await brand.fetchMovieBlob(res.url, () => {}, ctrl.signal);
          hechos += 1;
          setEstado({ fase: 'descarga', hechos, total: clips.length });
        }));
        if (ctrl.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
      }

      const marca = conMarca ? (watermarkConfig ?? loadStoredWatermarkConfig(brand)) : null;
      const video = await mergeClipsToVideo(
        secuencia.map(x => x.tipo === 'clip'
          ? { blob: blobs[x.i], channelName: x.clip.broadcaster || 'Streamer' }
          : { blob: x.p.file, channelName: '', propio: true, imagenSegundos: x.p.tipo === 'imagen' ? x.p.dur : undefined }),
        { watermark: marca, fade: fundido, height: alto },
        p => setEstado({ fase: 'render', ...p }),
        ctrl.signal,
      );

      const ext = video.type.includes('webm') ? 'webm' : 'mp4';
      const url = URL.createObjectURL(video);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${brand.storagePrefix}_compilation_${piezas}parts_${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Con retardo: Safari cancela la descarga si la URL desaparece ya.
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      setHecho(true);
    } catch (e: any) {
      if (e?.name !== 'AbortError' && e?.message !== 'AbortError') {
        setError(
          e?.message === 'BACKGROUND_PAUSE'
            ? (t.wm_export_paused || 'The browser paused the video to save power. Keep this tab visible and try again.')
            : (t.mergeError || 'Could not build the video. Try again, or with fewer clips.')
        );
      }
    } finally {
      abortRef.current = null;
      setEstado(null);
      onBusyChange(false);
    }
  };

  const pct = estado
    ? estado.fase === 'descarga'
      ? Math.round((estado.hechos / estado.total) * 100)
      : estado.pct
    : 0;

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => { setConMarca(watermarkOn); setAbierto(true); }}
        disabled={busy || clips.length < 1}
        title={clips.length < 2 ? (t.mergeNeedTwo || 'You need at least two clips') : undefined}
        className="w-full rounded-[2rem] border border-dashed border-twitch/40 bg-twitch/[0.06] hover:bg-twitch/[0.12] p-5 flex items-center gap-4 text-left transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group"
      >
        <span className="p-3 rounded-2xl bg-twitch/20 border border-twitch/30 shrink-0 group-hover:scale-105 transition-transform">
          <Clapperboard className="w-5 h-5 text-twitch" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-black uppercase tracking-widest text-white">{t.mergeTitle || 'Join into one video'}</span>
          <span className="block text-xs text-gray-400 mt-0.5">
            {(t.mergeDesc || 'All the clips back to back, in the order above.')} {total > 0 && <span className="text-gray-300 font-bold">{mmss(total)}</span>}
          </span>
        </span>
      </button>
    );
  }

  return (
    <div className="w-full rounded-[2rem] border border-twitch/30 bg-[#111114] p-5 sm:p-6 space-y-5 shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-4 min-w-0">
          <span className="p-3 rounded-2xl bg-twitch/20 border border-twitch/30 shrink-0">
            <Clapperboard className="w-5 h-5 text-twitch" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-black uppercase tracking-widest text-white">{t.mergeTitle || 'Join into one video'}</h3>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              {(t.mergeInfo || '{n} clips, {d} in total. It records in real time, so it takes about that long. Keep this tab open.')
                .replace('{n}', String(piezas))
                .replace('{d}', mmss(total))}
            </p>
          </div>
        </div>
        {!estado && (
          <button type="button" onClick={() => setAbierto(false)} aria-label={t.cancel || 'Close'} className="p-2 rounded-xl border border-white/10 text-gray-400 hover:text-white cursor-pointer shrink-0">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {!estado && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="video/*,image/*"
            multiple
            className="hidden"
            onChange={e => { anadir(e.target.files); e.target.value = ''; }}
          />
          {propios.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400">{t.mergeSequence || 'Video order'}</h4>
              <ol className="space-y-1.5">
                {secuencia.map((x, k) => x.tipo === 'clip' ? (
                  <li key={`c${x.i}`} className="flex items-center gap-3 p-1.5 pr-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="w-5 text-center text-[11px] font-black text-gray-600 tabular-nums">{k + 1}</span>
                    <img src={x.clip.thumbnail} alt="" className="w-14 aspect-video rounded-md object-cover bg-black shrink-0" />
                    <span className="min-w-0 flex-1 text-xs text-gray-400 truncate">
                      <span className="font-bold text-gray-300">{(t.mergeClipN || 'Clip {n}').replace('{n}', String(x.i + 1))}</span> · {x.clip.title}
                    </span>
                    <span className="text-[10px] font-bold text-gray-600 tabular-nums">{mmss(x.clip.duration)}</span>
                  </li>
                ) : (
                  <li key={x.p.id} className="flex items-center gap-3 p-1.5 pr-1.5 rounded-xl bg-twitch/10 border border-twitch/40">
                    <span className="w-5 text-center text-[11px] font-black text-twitch tabular-nums">{k + 1}</span>
                    <span className="relative w-14 aspect-video rounded-md overflow-hidden bg-black shrink-0">
                      <img src={x.p.thumb} alt="" className="w-full h-full object-cover" />
                      <span className="absolute bottom-0.5 left-0.5 p-0.5 rounded bg-black/70 text-white">
                        {x.p.tipo === 'imagen' ? <ImageIcon className="w-2.5 h-2.5" /> : <Film className="w-2.5 h-2.5" />}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="px-1.5 py-px rounded bg-twitch text-[var(--color-accent-ink)] text-[9px] font-black uppercase tracking-wider shrink-0">{t.mergeOwnBadge || 'Yours'}</span>
                        <span className="text-xs font-bold text-white truncate">{x.p.nombre}</span>
                      </span>
                      <span className="block text-[10px] text-gray-400 mt-0.5">{dondeVa(x.p)}</span>
                    </span>
                    {x.p.tipo === 'imagen' ? (
                      <label className="flex items-center gap-1 text-[10px] font-bold text-gray-400 shrink-0" title={t.mergeImageSecs || 'Seconds on screen'}>
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={x.p.dur}
                          onChange={e => segundos(x.p.id, parseInt(e.target.value, 10))}
                          aria-label={t.mergeImageSecs || 'Seconds on screen'}
                          className="w-11 bg-dark-950 border border-white/10 rounded-lg px-1.5 py-1 text-xs text-white text-center outline-none focus:border-twitch"
                        />
                        s
                      </label>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-400 tabular-nums shrink-0">{mmss(x.p.dur)}</span>
                    )}
                    <span className="flex flex-col shrink-0">
                      <button type="button" onClick={() => mover(x.p.id, -1)} disabled={posDe(x.p) === 0} aria-label={t.moveUp || 'Move up'} className="p-0.5 rounded text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-20 cursor-pointer disabled:cursor-default">
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => mover(x.p.id, 1)} disabled={posDe(x.p) === n} aria-label={t.moveDown || 'Move down'} className="p-0.5 rounded text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-20 cursor-pointer disabled:cursor-default">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </span>
                    <button type="button" onClick={() => quitar(x.p.id)} aria-label={t.mergeRemove || 'Remove'} title={t.mergeRemove || 'Remove'} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full flex items-center gap-3 p-3 rounded-2xl border border-dashed border-white/15 hover:border-twitch/50 hover:bg-twitch/[0.06] text-left transition-colors cursor-pointer group"
          >
            <span className="p-2 rounded-xl bg-white/5 group-hover:bg-twitch/20 shrink-0"><Plus className="w-4 h-4 text-twitch" /></span>
            <span className="min-w-0">
              <span className="block text-xs font-black text-white">{t.mergeAddOwn || 'Add your own video or image'}</span>
              <span className="block text-[11px] text-gray-500">{t.mergeOwnHint || 'An intro, a "subscribe" card, an outro... then place it with the arrows.'}</span>
            </span>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { on: fundido, set: setFundido, icon: <Blend className="w-4 h-4" />, label: t.mergeFade || 'Fade between clips' },
              { on: conMarca, set: setConMarca, icon: <Sparkles className="w-4 h-4" />, label: t.mergeWatermark || "Each streamer's name on their clip" },
            ].map((o, i) => (
              <button
                key={i}
                type="button"
                role="switch"
                aria-checked={o.on}
                onClick={() => o.set(!o.on)}
                className={`flex items-center justify-between gap-3 p-3 rounded-2xl border text-left text-xs font-bold transition-colors cursor-pointer ${o.on ? 'border-twitch/50 bg-twitch/10 text-white' : 'border-white/10 text-gray-400 hover:text-white'}`}
              >
                <span className="flex items-center gap-2">{o.icon}{o.label}</span>
                <span className={`w-9 h-5 rounded-full p-[3px] flex shrink-0 ${o.on ? 'bg-twitch justify-end' : 'bg-white/15 justify-start'}`}>
                  <span className="w-3.5 h-3.5 rounded-full bg-white" />
                </span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={empezar}
              disabled={busy || piezas < 2}
              title={piezas < 2 ? (t.mergeNeedTwo || 'You need at least two clips') : undefined}
              className="h-12 px-6 rounded-xl bg-twitch hover:bg-twitch-dark text-[var(--color-accent-ink)] text-xs font-black uppercase tracking-widest flex items-center gap-2 cursor-pointer shadow-lg shadow-twitch/25 disabled:opacity-50 active:scale-[0.98] transition-all"
            >
              <Download className="w-4 h-4" />
              {t.mergeGo || 'Create the video'}
            </button>
            <span className="text-[11px] font-bold text-gray-500">{alto}p · 16:9</span>
          </div>
        </>
      )}

      {estado && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
            <span className="text-twitch uppercase tracking-widest flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {estado.fase === 'descarga'
                ? `${t.mergeDownloading || 'Downloading clips'} ${estado.hechos}/${estado.total}`
                : `${t.mergeRecording || 'Recording clip'} ${estado.index}/${estado.total}`}
            </span>
            <span className="text-gray-400 tabular-nums">
              {pct}%{estado.fase === 'render' ? ` · ${mmss(Math.max(0, estado.duration - estado.elapsed))}` : ''}
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full bg-twitch transition-[width] duration-300" style={{ width: `${Math.max(2, pct)}%` }} />
          </div>
          <button
            type="button"
            onClick={() => abortRef.current?.abort()}
            className="px-4 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-[11px] font-black uppercase tracking-widest hover:bg-red-500/25 cursor-pointer"
          >
            {t.cancel || 'Cancel'}
          </button>
        </div>
      )}

      {hecho && !estado && <p className="text-xs font-bold text-green-400">{t.mergeDone || 'Done! The video is in your downloads.'}</p>}
      {error && <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2">{error}</p>}
    </div>
  );
};

export default MergePanel;
