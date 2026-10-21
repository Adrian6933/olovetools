// ============================================================================
// Descarga "más nítida" de un clip
// ----------------------------------------------------------------------------
// El clip se baja en su mejor calidad, se enseña un fotograma A TAMAÑO REAL
// (1 píxel de pantalla = 1 píxel del vídeo: reducido, la nitidez no se nota)
// partido por una línea que se arrastra: a la izquierda el original, a la
// derecha con la nitidez y la resolución elegidas. Arrastrar la imagen mueve
// la vista. "Descargar" lo pasa entero por exportOffline (fotograma a
// fotograma, sin tiempo real).
// ============================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Loader2, X, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { ClipData } from './types';
import { useBrand } from './brand';
import { obtenerFuente } from './editor/model';
import { nombreDeArchivo } from './watermarkService';
import { crearNitidez, FUERZA, guardarCalidad, leerCalidad, type CalidadExport } from './nitidez';
import CalidadSelector from './CalidadSelector';

interface Props {
  data: ClipData;
  t: any;
  onClose: () => void;
}

const MOMENTOS = [0.5, 0.25, 0.75];

const MejoraPanel: React.FC<Props> = ({ data, t, onClose }) => {
  const brand = useBrand();
  const tx = (k: string, fb: string) => (typeof t?.[k] === 'string' && t[k]) || fb;
  const [calidad, setCalidad] = useState<CalidadExport>(() => leerCalidad(brand.storagePrefix));
  const cambiarCalidad = (c: CalidadExport) => { setCalidad(c); guardarCalidad(brand.storagePrefix, c); };

  // ---- el clip, en su mejor calidad (una vez) ----
  const [blob, setBlob] = useState<Blob | null>(null);
  const [carga, setCarga] = useState(0);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let vivo = true;
    const mejor = data.resolutions[0];
    obtenerFuente(`max:${data.id}`, () => brand.fetchMovieBlob(mejor.url, (l, tot) => { if (vivo && tot > 0) setCarga(Math.round((l / tot) * 100)); }))
      .then(f => { if (vivo) setBlob(f.blob); })
      .catch(() => { if (vivo) setError(tx('en_error', 'Could not process the clip.')); });
    return () => { vivo = false; };
  }, [data.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- un fotograma para comparar ----
  const [momento, setMomento] = useState(0);
  const [fotograma, setFotograma] = useState<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (!blob) return;
    let vivo = true;
    (async () => {
      const mb = await import('mediabunny');
      const input = new mb.Input({ source: new mb.BlobSource(blob), formats: mb.ALL_FORMATS });
      try {
        const pista = await input.getPrimaryVideoTrack();
        if (!pista) throw new Error('no video');
        const dur = await input.computeDuration();
        const envuelto = await new mb.CanvasSink(pista).getCanvas(dur * MOMENTOS[momento % MOMENTOS.length]);
        if (!envuelto || !vivo) return;
        // Copia propia: el del sink se reutiliza.
        const c = document.createElement('canvas');
        c.width = envuelto.canvas.width;
        c.height = envuelto.canvas.height;
        c.getContext('2d')!.drawImage(envuelto.canvas, 0, 0);
        setFotograma(c);
      } catch {
        if (vivo) setError(tx('en_unsupported', "Your browser can't process video this way. Try Chrome or Edge."));
      } finally {
        input.dispose();
      }
    })();
    return () => { vivo = false; };
  }, [blob, momento]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- antes / después, al tamaño de salida ----
  const antes = useRef<HTMLCanvasElement>(null);
  const despues = useRef<HTMLCanvasElement>(null);
  const [tam, setTam] = useState({ w: 0, h: 0 });
  useEffect(() => {
    if (!fotograma || !antes.current || !despues.current) return;
    const escala = calidad.alto / fotograma.height;
    const w = Math.round(fotograma.width * escala);
    const h = Math.round(fotograma.height * escala);
    for (const c of [antes.current, despues.current]) { c.width = w; c.height = h; }
    const a = antes.current.getContext('2d')!;
    // El original, tal cual (escalado si se pide 1440p, para comparar lo mismo).
    a.imageSmoothingQuality = 'high';
    a.drawImage(fotograma, 0, 0, w, h);
    const d = despues.current.getContext('2d')!;
    const fuerza = FUERZA[calidad.nitidez];
    const filtro = fuerza > 0 ? crearNitidez(w, h) : null;
    d.drawImage(filtro ? filtro.aplicar(antes.current, fuerza) : antes.current, 0, 0);
    filtro?.liberar();
    setTam({ w, h });
  }, [fotograma, calidad]);

  // ---- vista: arrastrar mueve la imagen; la línea compara ----
  const visor = useRef<HTMLDivElement>(null);
  const [vista, setVista] = useState({ x: 0, y: 0 });
  const [division, setDivision] = useState(0.5);
  const gesto = useRef<{ tipo: 'mover' | 'linea'; x0: number; y0: number; vx: number; vy: number } | null>(null);
  const limitar = useCallback((x: number, y: number) => {
    const v = visor.current;
    if (!v) return { x, y };
    const W = v.clientWidth;
    const H = v.clientHeight;
    return {
      x: tam.w <= W ? (W - tam.w) / 2 : Math.max(W - tam.w, Math.min(0, x)),
      y: tam.h <= H ? (H - tam.h) / 2 : Math.max(H - tam.h, Math.min(0, y)),
    };
  }, [tam]);
  // Al cambiar de tamaño, centrado: es donde suele estar la acción.
  useEffect(() => {
    const v = visor.current;
    if (!v || !tam.w) return;
    setVista(limitar((v.clientWidth - tam.w) / 2, (v.clientHeight - tam.h) / 2));
  }, [tam, limitar]);

  const alPulsar = (e: React.PointerEvent, tipo: 'mover' | 'linea') => {
    e.preventDefault();
    e.stopPropagation();
    gesto.current = { tipo, x0: e.clientX, y0: e.clientY, vx: vista.x, vy: vista.y };
    try { visor.current?.setPointerCapture(e.pointerId); } catch { /* ya suelto */ }
  };
  const alMover = (e: React.PointerEvent) => {
    const g = gesto.current;
    const v = visor.current;
    if (!g || !v) return;
    if (g.tipo === 'linea') {
      const r = v.getBoundingClientRect();
      setDivision(Math.max(0.02, Math.min(0.98, (e.clientX - r.left) / r.width)));
    } else {
      setVista(limitar(g.vx + e.clientX - g.x0, g.vy + e.clientY - g.y0));
    }
  };
  const alSoltar = () => { gesto.current = null; };

  // ---- descargar ----
  const [proceso, setProceso] = useState<number | null>(null);
  const [hecho, setHecho] = useState(false);
  const abortar = useRef<AbortController | null>(null);
  useEffect(() => () => abortar.current?.abort(), []);
  const descargar = async () => {
    if (!blob || proceso !== null) return;
    setError(null);
    setHecho(false);
    setProceso(0);
    const ctrl = new AbortController();
    abortar.current = ctrl;
    try {
      const offline = await import('./exportOffline');
      const pieza = [{ blob, channelName: data.broadcaster || '', propio: true }];
      const ancho = Math.round((calidad.alto * 16) / 9);
      if (!(await offline.sePuedeSinTiempoReal(pieza, ancho, calidad.alto))) {
        setError(tx('en_unsupported', "Your browser can't process video this way. Try Chrome or Edge."));
        return;
      }
      const video = await offline.exportarSinTiempoReal(pieza, { alto: calidad.alto, nitidez: FUERZA[calidad.nitidez] }, p => setProceso(p.pct), ctrl.signal);
      const url = URL.createObjectURL(video);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${nombreDeArchivo(data.title, data.broadcaster, data.id)}_${calidad.alto}p${calidad.nitidez !== 'off' ? '_hd' : ''}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setHecho(true);
    } catch (e: any) {
      if (e?.name !== 'AbortError') setError(tx('en_error', 'Could not process the clip.'));
    } finally {
      abortar.current = null;
      setProceso(null);
    }
  };

  const listo = !!fotograma && tam.w > 0;

  return (
    <div className="border-t border-white/5 p-4 sm:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-white">{tx('en_title', 'Sharper download')}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{tx('en_compare', 'Drag the line to compare · drag the picture to move around')}</p>
        </div>
        <button type="button" onClick={onClose} aria-label={tx('wm_close', 'Close')} className="w-9 h-9 shrink-0 rounded-xl border border-white/10 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer"><X className="w-4 h-4" /></button>
      </div>

      {/* Comparación a tamaño real */}
      <div
        ref={visor}
        className="relative h-[260px] sm:h-[340px] rounded-2xl overflow-hidden bg-black border border-white/10 touch-none select-none cursor-grab active:cursor-grabbing"
        onPointerDown={e => alPulsar(e, 'mover')}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alSoltar}
      >
        <div className="absolute top-0 left-0" style={{ transform: `translate(${vista.x}px, ${vista.y}px)`, width: tam.w, height: tam.h, visibility: listo ? 'visible' : 'hidden' }}>
          <canvas ref={antes} className="absolute inset-0" />
          <canvas
            ref={despues}
            className="absolute inset-0"
            style={{ clipPath: `inset(0 0 0 ${Math.max(0, (visor.current?.clientWidth || 0) * division - vista.x)}px)` }}
          />
        </div>
        {listo ? (
          <>
            <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.9)] pointer-events-none" style={{ left: `${division * 100}%` }} />
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-xl cursor-ew-resize text-xs font-black"
              style={{ left: `${division * 100}%` }}
              onPointerDown={e => alPulsar(e, 'linea')}
              role="slider"
              aria-label={tx('en_compare', 'Compare')}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(division * 100)}
            >⇆</div>
            <span className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-black/70 text-[10px] font-black uppercase tracking-wider text-gray-300 pointer-events-none">{tx('en_before', 'Original')}</span>
            <span className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-twitch text-[10px] font-black uppercase tracking-wider text-[var(--color-accent-ink)] pointer-events-none">{tx('en_after', 'Enhanced')}</span>
            <button type="button" onPointerDown={e => e.stopPropagation()} onClick={() => setMomento(m => m + 1)} className="absolute bottom-2 right-2 h-8 px-3 rounded-lg bg-black/70 border border-white/15 text-[11px] font-bold text-gray-200 hover:text-white flex items-center gap-1.5 cursor-pointer">
              <RefreshCw className="w-3.5 h-3.5" />{tx('en_other', 'Another frame')}
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs font-bold text-gray-400">
            {error ? <><AlertCircle className="w-6 h-6 text-red-400" />{error}</> : <><Loader2 className="w-6 h-6 animate-spin text-twitch" />{tx('en_loading', 'Loading the clip…')} {blob ? '' : `${carga}%`}</>}
          </div>
        )}
      </div>

      <CalidadSelector valor={calidad} onChange={cambiarCalidad} t={t} />
      <p className="text-[10px] text-gray-500">{tx('q_also', 'This setting also applies to the watermark, the merged video and the editor.')}</p>

      {proceso !== null ? (
        <div className="space-y-2">
          <div className="flex justify-between text-[11px] font-bold"><span className="text-twitch flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" />{tx('en_working', 'Processing… {p}%').replace('{p}', String(proceso))}</span></div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden"><div className="h-full bg-twitch transition-[width] duration-300" style={{ width: `${Math.max(2, proceso)}%` }} /></div>
          <button type="button" onClick={() => abortar.current?.abort()} className="w-full py-2 rounded-xl border border-white/10 text-[11px] font-bold text-gray-400 hover:text-white cursor-pointer">{tx('cancel', 'Cancel')}</button>
        </div>
      ) : (
        <button
          type="button"
          onClick={descargar}
          disabled={!blob}
          className="w-full h-12 rounded-2xl bg-twitch hover:bg-twitch-dark text-[var(--color-accent-ink)] text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-twitch/25 disabled:opacity-40"
        >
          <Download className="w-4 h-4" />{tx('en_download', 'Download sharper')} · {calidad.alto}p
        </button>
      )}
      {hecho && <p className="text-[11px] font-bold text-green-400 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" />{tx('en_done', 'Done, it is in your downloads.')}</p>}
      {error && listo && <p className="text-[11px] font-bold text-red-400">{error}</p>}
    </div>
  );
};

export default MejoraPanel;
