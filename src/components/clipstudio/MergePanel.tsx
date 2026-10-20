// ============================================================================
// Unir todos los clips en un solo vídeo, en el orden de la lista.
// ----------------------------------------------------------------------------
// Primero se descargan (3 a la vez, como el ZIP) y luego se graban seguidos.
// La grabación va a velocidad real, así que se dice cuánto va a tardar antes de
// empezar, y después cuánto queda.
// ============================================================================
import React, { useEffect, useRef, useState } from 'react';
import { Clapperboard, Loader2, X, Sparkles, Blend, Download } from 'lucide-react';
import type { ClipData, WatermarkConfig } from './types';
import { useBrand } from './brand';
import { mergeClipsToVideo } from './mergeService';
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
  // Al vaciar la lista el panel desaparece: el trabajo en curso se corta.
  useEffect(() => () => abortRef.current?.abort(), []);

  const total = clips.reduce((s, c) => s + (c.duration || 0), 0);
  const alto = quality === '360' ? 360 : quality === '720' ? 720 : 1080;

  const elegirResolucion = (c: ClipData) =>
    quality === 'max'
      ? c.resolutions[0]
      : c.resolutions.find(r => r.quality === `${quality}p`) || c.resolutions.find(r => r.quality.startsWith(quality)) || c.resolutions[0];

  const empezar = async () => {
    if (clips.length < 2 || estado) return;
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
        clips.map((c, i) => ({ blob: blobs[i], channelName: c.broadcaster || 'Streamer' })),
        { watermark: marca, fade: fundido, height: alto },
        p => setEstado({ fase: 'render', ...p }),
        ctrl.signal,
      );

      const ext = video.type.includes('webm') ? 'webm' : 'mp4';
      const url = URL.createObjectURL(video);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${brand.storagePrefix}_compilation_${clips.length}clips_${Date.now()}.${ext}`;
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
        disabled={busy || clips.length < 2}
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
                .replace('{n}', String(clips.length))
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
              disabled={busy}
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
