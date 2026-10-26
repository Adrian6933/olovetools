// ============================================================================
// Unir todos los clips en un solo vídeo, en el orden de la lista.
// ----------------------------------------------------------------------------
// Ya no es un panel aparte al final de la página: vive dentro de la tarjeta de
// exportación de arriba (ClipToolApp), que tiene el modo, los formatos y la
// calidad. Aquí quedan lo que solo tiene el vídeo unido (el fundido) y el
// progreso; lo arranca el botón grande de arriba, por eso empezar() se expone
// por ref. Meter vídeos o imágenes propios (una intro, un cierre) se hace en
// el editor, que para eso tiene línea de tiempo y admite arrastrarlos.
//
// Primero se descargan (varios a la vez, como el ZIP) y luego se exportan
// seguidos. Con "vídeo + clips" sale un ZIP con el vídeo unido y cada clip
// suelto al lado (con la marca, si va puesta).
// ============================================================================
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Loader2, Blend, CheckCircle2 } from 'lucide-react';
import type { ClipData, WatermarkConfig } from './types';
import { useBrand } from './brand';
import { mergeClipsToVideo, ultimoFalloOffline } from './mergeService';
import { FUERZA, type CalidadExport } from './nitidez';
import { loadStoredWatermarkConfig, nombreDeArchivo } from './watermarkService';
import { procesarClips, soltarDescarga, type ProgresoLote } from './lotes';
import { zipEnBlob, type EntradaZip } from './zipBlob';
import { sufijoFormato, type Encaje, type Formato } from './formato';

interface Props {
  clips: ClipData[];
  quality: string;
  /** Si la marca en todos está puesta, el vídeo unido la lleva también. */
  watermarkOn: boolean;
  watermarkConfig: WatermarkConfig | null;
  t: any;
  onBusyChange: (busy: boolean) => void;
  /** Con los clips sueltos al lado del vídeo unido, en un ZIP. */
  conClips: boolean;
  /** Forma del vídeo unido y de los clips sueltos (formato.ts). */
  formatoVideo: Formato;
  formatoClips: Formato;
  encaje: Encaje;
  /** Nitidez y resolución, elegidas en la tarjeta de arriba. */
  calidad: CalidadExport;
  /** Las opciones del vídeo (el fundido) solo si se va a unir. */
  mostrarOpciones: boolean;
}

export interface MergePanelHandle {
  /** Arranca con lo que esté puesto. */
  empezar: () => void;
}

const mmss = (seg: number) => {
  const s = Math.max(0, Math.round(seg));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${r}` : `${m}:${r}`;
};

type Estado =
  | ({ fase: 'descarga' } & ProgresoLote)
  | { fase: 'render'; index: number; total: number; elapsed: number; duration: number; pct: number }
  | { fase: 'zip' };

const MergePanel = forwardRef<MergePanelHandle, Props>(({
  clips, quality, watermarkOn, watermarkConfig, t, onBusyChange, conClips, formatoVideo, formatoClips, encaje, calidad, mostrarOpciones,
}, ref) => {
  const brand = useBrand();
  const [fundido, setFundido] = useState(true);
  const [estado, setEstado] = useState<Estado | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** En qué paso y por qué (técnico, en pequeño): sin esto "no se pudo" no dice nada. */
  const [detalle, setDetalle] = useState<string | null>(null);
  const [hecho, setHecho] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Al vaciar la lista el panel desaparece: el trabajo en curso se corta.
  useEffect(() => () => abortRef.current?.abort(), []);

  const total = clips.reduce((s, c) => s + (c.duration || 0), 0);
  const piezas = clips.length;

  const alto = quality === '360' ? 360 : quality === '720' ? 720 : 1080;

  const empezar = async () => {
    if (piezas < 2 || estado) return;
    setError(null);
    setDetalle(null);
    setHecho(false);
    let paso = 'download';
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    onBusyChange(true);
    try {
      const marca = watermarkOn ? (watermarkConfig ?? loadStoredWatermarkConfig(brand)) : null;
      const nitidez = FUERZA[calidad.nitidez];
      setEstado({ fase: 'descarga', hechos: 0, total: clips.length, pct: 0, bajando: 0, marcando: 0, fallos: 0 });
      // Con los clips sueltos y marca, se marcan aquí mismo mientras bajan
      // los demás; el vídeo unido parte de los originales (pone su propia
      // marca, con los fundidos encima).
      const resultados = await procesarClips(clips, {
        quality,
        fetchMovieBlob: brand.fetchMovieBlob,
        marca: conClips && marca ? { config: marca, nitidez, alto: calidad.alto } : null,
        formato: conClips ? formatoClips : 'original',
        encaje,
        calidad: conClips ? { nitidez, alto: calidad.alto } : undefined,
        guardarOriginal: true,
        signal: ctrl.signal,
        onProgress: p => setEstado({ fase: 'descarga', ...p }),
      });
      // Al vídeo unido no le puede faltar un trozo.
      const sinBajar = resultados.filter(r => !r.original).length;
      if (sinBajar) throw new Error(`${sinBajar} clip(s) could not be downloaded`);
      paso = 'render';

      const video = await mergeClipsToVideo(
        resultados.map((r, i) => ({ blob: r.original!, channelName: clips[i].broadcaster || 'Streamer' })),
        { watermark: marca, fade: fundido, height: alto, nitidez, formato: formatoVideo, encaje },
        p => setEstado({ fase: 'render', ...p }),
        ctrl.signal,
      );

      paso = 'zip';
      const ext = video.type.includes('webm') ? 'webm' : 'mp4';
      const sello = Date.now();
      if (conClips) {
        setEstado({ fase: 'zip' });
        const entradas: EntradaZip[] = [{ nombre: `${brand.storagePrefix}_compilation_${piezas}parts${sufijoFormato(formatoVideo)}.${ext}`, datos: video }];
        resultados.forEach(({ clip, res, final }, i) => {
          if (!final) return;
          const e = final.type.includes('webm') ? 'webm' : 'mp4';
          entradas.push({ nombre: `clips/${i + 1}_${nombreDeArchivo(clip.title, clip.broadcaster, clip.id)}_${res.quality}${marca ? '_watermark' : ''}${final === resultados[i].original ? '' : sufijoFormato(formatoClips)}.${e}`, datos: final });
        });
        const contenido = await zipEnBlob(entradas, ctrl.signal);
        soltarDescarga(contenido, `${brand.storagePrefix}_${quality}_video_and_clips_${sello}.zip`);
      } else {
        soltarDescarga(video, `${brand.storagePrefix}_compilation_${piezas}parts${sufijoFormato(formatoVideo)}_${sello}.${ext}`);
      }
      setHecho(true);
    } catch (e: any) {
      if (e?.name !== 'AbortError' && e?.message !== 'AbortError') {
        console.error(`Compilation failed at ${paso}`, e);
        setDetalle(`${paso}: ${e?.name && e.name !== 'Error' ? `${e.name} · ` : ''}${e?.message || String(e)}${paso === 'render' && ultimoFalloOffline ? ` (offline: ${ultimoFalloOffline})` : ''}`.slice(0, 400));
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

  useImperativeHandle(ref, () => ({
    empezar: () => {
      requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      empezar();
    },
  }));

  const pct = estado ? (estado.fase === 'zip' ? 100 : estado.pct) : 0;

  // Nada que enseñar: ni opciones (se bajan clips sueltos) ni trabajo en curso.
  if (!mostrarOpciones && !estado && !hecho && !error) return null;

  return (
    <div ref={panelRef} className="space-y-3">
      {mostrarOpciones && !estado && (
        <>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={fundido}
              onClick={() => setFundido(!fundido)}
              className={`sm:flex-1 flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl border text-left text-xs font-bold transition-colors cursor-pointer ${fundido ? 'border-twitch/50 bg-twitch/10 text-white' : 'border-white/10 text-gray-400 hover:text-white'}`}
            >
              <span className="flex items-center gap-2"><Blend className="w-4 h-4 text-twitch" />{t.mergeFade || 'Fade between clips'}</span>
              <span className={`w-9 h-5 rounded-full p-[3px] flex shrink-0 ${fundido ? 'bg-twitch justify-end' : 'bg-white/15 justify-start'}`}>
                <span className="w-3.5 h-3.5 rounded-full bg-white" />
              </span>
            </button>
            <span className="sm:self-center px-1 text-[11px] font-bold text-gray-500 tabular-nums shrink-0">
              {(t.mergeSummary || '{n} parts · {d}').replace('{n}', String(piezas)).replace('{d}', mmss(total))}
            </span>
          </div>

        </>
      )}

      {estado && (
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
            <span className="text-twitch uppercase tracking-widest flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {estado.fase === 'descarga'
                ? `${estado.marcando > 0 ? (t.watermarkAllRendering || 'Burning in') : (t.mergeDownloading || 'Downloading clips')} ${estado.hechos}/${estado.total}`
                : estado.fase === 'zip'
                  ? (t.preparingZip || 'PREPARING ZIP...')
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
            className="px-4 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-[11px] font-black uppercase tracking-widest hover:bg-red-500/25 cursor-pointer"
          >
            {t.cancel || 'Cancel'}
          </button>
        </div>
      )}

      {hecho && !estado && <p className="flex items-center gap-2 text-xs font-bold text-green-400"><CheckCircle2 className="w-4 h-4" />{t.mergeDone || 'Done! The video is in your downloads.'}</p>}
      {error && (
        <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2">
          {error}
          {detalle && <span className="block mt-1 font-mono font-normal text-[10px] text-red-300/70 break-all">{detalle}</span>}
        </p>
      )}
    </div>
  );
});
MergePanel.displayName = 'MergePanel';

export default MergePanel;
