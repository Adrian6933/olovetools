// ============================================================================
// Descarga "más nítida" de un clip
// ----------------------------------------------------------------------------
// El clip se baja en su mejor calidad y se compara antes/después sobre un
// fotograma real (ComparadorNitidez). "Descargar" lo pasa entero por
// exportOffline (fotograma a fotograma, sin tiempo real).
// ============================================================================
import React, { useEffect, useRef, useState } from 'react';
import { Download, Loader2, X, CheckCircle2 } from 'lucide-react';
import type { ClipData } from './types';
import { useBrand } from './brand';
import { obtenerFuente } from './editor/model';
import { nombreDeArchivo } from './watermarkService';
import { FUERZA, guardarCalidad, leerCalidad, type CalidadExport } from './nitidez';
import ComparadorNitidez from './ComparadorNitidez';
import AvisoGrafica from './AvisoGrafica';
import CalidadSelector from './CalidadSelector';

interface Props {
  data: ClipData;
  t: any;
  onClose: () => void;
}

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
      <ComparadorNitidez blob={blob} carga={carga} error={error && !blob ? error : null} calidad={calidad} tx={tx} />
      <AvisoGrafica tx={tx} />

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
      {error && blob && <p className="text-[11px] font-bold text-red-400">{error}</p>}
    </div>
  );
};

export default MejoraPanel;
