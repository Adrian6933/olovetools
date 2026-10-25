// ============================================================================
// Antes / después de la nitidez y la resolución, sobre un fotograma real
// ----------------------------------------------------------------------------
// Un fotograma del clip A TAMAÑO REAL (1 píxel de pantalla = 1 píxel del
// vídeo: reducido, la nitidez no se nota), partido por una línea que se
// arrastra: a la izquierda el original, a la derecha con la nitidez y la
// resolución elegidas. Arrastrar la imagen mueve la vista. Cambiar el nivel
// lo repinta al momento, así se ve qué hace cada uno.
//
// Lo usa la descarga "más nítida" de cada clip (MejoraPanel), que es quien
// baja el clip. En los selectores de calidad, en cambio, la vista previa es
// una foto de ejemplo (muestraNitidez.ts): no se baja nada.
// ============================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { crearNitidez, FUERZA, type CalidadExport } from './nitidez';

interface Props {
  /** El clip entero; null mientras se baja. */
  blob: Blob | null;
  /** 0-100 de la descarga, para el aviso de carga. */
  carga: number;
  /** Fallo al bajarlo (lo pinta en vez de la imagen). */
  error?: string | null;
  calidad: CalidadExport;
  tx: (k: string, fb: string) => string;
  /** Alto del visor (clases de Tailwind). */
  alto?: string;
}

const MOMENTOS = [0.5, 0.25, 0.75];

const ComparadorNitidez: React.FC<Props> = ({ blob, carga, error, calidad, tx, alto = 'h-[260px] sm:h-[340px]' }) => {
  const [fallo, setFallo] = useState<string | null>(null);

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
        if (vivo) setFallo(tx('en_unsupported', "Your browser can't process video this way. Try Chrome or Edge."));
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

  const listo = !!fotograma && tam.w > 0;
  const problema = error || fallo;

  return (
    <div
      ref={visor}
      className={`relative ${alto} rounded-2xl overflow-hidden bg-black border border-white/10 touch-none select-none cursor-grab active:cursor-grabbing`}
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
          <span className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-twitch text-[10px] font-black uppercase tracking-wider text-[var(--color-accent-ink)] pointer-events-none">{tx('en_after', 'Enhanced')} · {calidad.alto}p</span>
          <button type="button" onPointerDown={e => e.stopPropagation()} onClick={() => setMomento(m => m + 1)} className="absolute bottom-2 right-2 h-8 px-3 rounded-lg bg-black/70 border border-white/15 text-[11px] font-bold text-gray-200 hover:text-white flex items-center gap-1.5 cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" />{tx('en_other', 'Another frame')}
          </button>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center text-xs font-bold text-gray-400">
          {problema
            ? <><AlertCircle className="w-6 h-6 text-red-400" />{problema}</>
            : <><Loader2 className="w-6 h-6 animate-spin text-twitch" />{tx('en_loading', 'Loading the clip…')} {blob ? '' : `${carga}%`}</>}
        </div>
      )}
    </div>
  );
};

export default ComparadorNitidez;
