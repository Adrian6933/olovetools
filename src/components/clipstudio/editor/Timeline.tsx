// ============================================================================
// La línea de tiempo del editor, al estilo de CapCut
// ----------------------------------------------------------------------------
// Una sola pista: cada pieza ocupa lo que dura en el vídeo final, pegada a la
// anterior (al quitar o recortar, lo de detrás se corre solo). Arriba, una
// regla con los segundos; encima de todo, el cursor de reproducción, que se
// arrastra para buscar.
//
//   - Pulsar una pieza la elige y pone el cursor en ese punto.
//   - Arrastrar una pieza la cambia de sitio.
//   - Arrastrar los bordes de la elegida la recorta (el vídeo enseña el
//     fotograma del borde mientras tanto).
//   - Pulsar o arrastrar en la regla (o en hueco) mueve el cursor.
//   - Ctrl + rueda, o los botones, acercan y alejan.
//   - Imán, como en CapCut: buscando, el cursor se pega a los cortes; al
//     recortar, el borde se pega al cursor. Una línea amarilla avisa de que
//     se ha pegado.
//
// Entre pieza y pieza queda un hueco a la vista (solo dibujado: en el vídeo
// final van pegadas) para distinguirlas de un vistazo.
// Las herramientas (cortar, quitar…) llegan del editor por `herramientas`: es
// él quien sabe hacerlas; aquí solo se colocan a la izquierda del zoom.
// ============================================================================
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ImageIcon, VolumeX, Gauge, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { durFinal, fuenteLista, mmss, tiraDeFotogramas, type Pieza } from './model';

interface Props {
  piezas: Pieza[];
  seleccionada: string | null;
  /** Segundo del vídeo final por donde va el cursor. */
  posicion: number;
  reproduciendo: boolean;
  /** Tramo marcado (I / O) de la pieza elegida, en segundos del original. */
  marcas?: { a: number | null; b: number | null };
  /** Cambia cuando termina de bajarse algún clip (para pintar sus fotogramas). */
  version: number;
  herramientas?: React.ReactNode;
  onSeek: (tGlobal: number) => void;
  onSelect: (id: string, tGlobal: number) => void;
  onReorder: (next: Pieza[]) => void;
  /** Antes de recortar arrastrando (para que deshacer lo cuente como un paso). */
  onTrimStart: () => void;
  onTrim: (id: string, parche: Partial<Pieza>) => void;
  /** Enseñar en el reproductor el fotograma del borde que se arrastra. */
  onPreview: (id: string, tOriginal: number) => void;
  tx: (k: string, fb: string) => string;
}

const MIN_TRAMO = 0.3;
const ALTO_PISTA = 68;
const MARGEN = 12;
/** Media separación dibujada entre piezas, en px. */
const HUECO = 2.5;
/** A cuántos px de un corte (o del cursor) se pega lo que se arrastra. */
const IMAN = 10;

const mover = <T,>(arr: T[], de: number, a: number) => {
  const c = arr.slice();
  const [x] = c.splice(de, 1);
  c.splice(a, 0, x);
  return c;
};

/** Paso de las marcas de la regla según el zoom: una etiqueta cada ~80 px. */
const pasoRegla = (pxSeg: number) => [0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300].find(p => p * pxSeg >= 80) || 600;

type Gesto =
  | { tipo: 'pulsado'; id: string; x0: number; tx0: number }
  | { tipo: 'arrastre'; id: string; agarre: number }
  | { tipo: 'borde'; id: string; lado: 'izq' | 'der'; x0: number; inicio: number; fin: number; total: number }
  | { tipo: 'buscar' };

const Timeline: React.FC<Props> = ({
  piezas, seleccionada, posicion, reproduciendo, marcas, version, herramientas,
  onSeek, onSelect, onReorder, onTrimStart, onTrim, onPreview, tx,
}) => {
  const scroller = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLDivElement>(null);
  const [ancho, setAncho] = useState(800);
  const [zoom, setZoom] = useState(1);
  const gesto = useRef<Gesto | null>(null);
  const [arrastrando, setArrastrando] = useState<{ id: string; x: number } | null>(null);
  /** Dónde se ha pegado lo que se arrastra (segundo del vídeo final), para la guía. */
  const [guia, setGuia] = useState<number | null>(null);
  const piezasRef = useRef(piezas);
  piezasRef.current = piezas;

  // ---- medidas -------------------------------------------------------------
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setAncho(el.clientWidth));
    ro.observe(el);
    setAncho(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const total = piezas.reduce((s, p) => s + durFinal(p), 0);
  // Zoom 1 = todo el vídeo cabe a lo ancho. Hasta ~400 px por segundo.
  const pxAjuste = Math.max(4, (ancho - MARGEN * 2) / Math.max(total, 1));
  const zoomMax = Math.max(1, 400 / pxAjuste);
  const pxSeg = pxAjuste * Math.min(zoom, zoomMax);
  const anchoTotal = Math.max(ancho, total * pxSeg + MARGEN * 2);

  const inicios = useMemo(() => {
    const r: number[] = [];
    let acc = 0;
    for (const p of piezas) { r.push(acc); acc += durFinal(p); }
    return r;
  }, [piezas]);

  const xDe = (t: number) => MARGEN + t * pxSeg;
  const tDe = (clientX: number) => {
    const r = lienzo.current?.getBoundingClientRect();
    if (!r) return 0;
    return Math.max(0, Math.min(total, (clientX - r.left - MARGEN) / pxSeg));
  };

  // ---- zoom con Ctrl + rueda (no pasivo: si no, preventDefault no vale) ----
  const zoomRef = useRef({ zoom, zoomMax, pxSeg });
  zoomRef.current = { zoom, zoomMax, pxSeg };
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const alRodar = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const { zoom: z, zoomMax: zm } = zoomRef.current;
      setZoom(Math.max(1, Math.min(zm, z * (e.deltaY < 0 ? 1.25 : 0.8))));
    };
    el.addEventListener('wheel', alRodar, { passive: false });
    return () => el.removeEventListener('wheel', alRodar);
  }, []);

  // Ctrl + / Ctrl - (Ctrl 0 ajusta), como en los editores de escritorio.
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if ((e.target as HTMLElement)?.closest?.('input, textarea, select')) return;
      if (e.key === '+' || e.key === '=') { e.preventDefault(); setZoom(z => Math.min(zoomRef.current.zoomMax, z * 1.5)); }
      else if (e.key === '-') { e.preventDefault(); setZoom(z => Math.max(1, z / 1.5)); }
      else if (e.key === '0') { e.preventDefault(); setZoom(1); }
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, []);

  // Al acercar, el cursor se queda a la vista.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollLeft = Math.max(0, xDe(posicion) - el.clientWidth / 2);
  }, [zoom]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reproduciendo, la vista sigue al cursor.
  useEffect(() => {
    const el = scroller.current;
    if (!el || !reproduciendo) return;
    const x = xDe(posicion);
    if (x < el.scrollLeft + 20 || x > el.scrollLeft + el.clientWidth - 40) el.scrollLeft = Math.max(0, x - 60);
  }, [posicion, reproduciendo]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- tiras de fotogramas por pieza ----------------------------------------
  const [tiras, setTiras] = useState<Record<string, string[]>>({});
  useEffect(() => {
    let vivo = true;
    for (const p of piezas) {
      if (p.tipo === 'imagen') continue;
      const f = fuenteLista(p);
      if (!f || p.total <= 0 || tiras[f.url]) continue;
      const n = Math.max(6, Math.min(40, Math.ceil(p.total / 1.5)));
      tiraDeFotogramas(f.url, p.total, n)
        .then(fr => { if (vivo) setTiras(prev => (prev[f.url] ? prev : { ...prev, [f.url]: fr })); })
        .catch(() => { /* sin tira: se queda la miniatura */ });
    }
    return () => { vivo = false; };
  }, [piezas, version]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- gestos ----------------------------------------------------------------
  const capturar = (e: React.PointerEvent) => {
    try { lienzo.current?.setPointerCapture(e.pointerId); } catch { /* puntero ya suelto */ }
  };

  /** Los cortes: inicio de cada pieza y el final del vídeo. */
  const cortes = useMemo(() => [...inicios, total], [inicios, total]);

  /** Buscar con imán: cerca de un corte, al corte justo. */
  const buscarCon = (clientX: number) => {
    const t = tDe(clientX);
    const cerca = cortes.find(c => Math.abs(c - t) * pxSeg < IMAN);
    setGuia(cerca ?? null);
    onSeek(cerca ?? t);
  };

  const alPulsarFondo = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    gesto.current = { tipo: 'buscar' };
    capturar(e);
    buscarCon(e.clientX);
  };

  const alPulsarPieza = (e: React.PointerEvent, p: Pieza) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    gesto.current = { tipo: 'pulsado', id: p.id, x0: e.clientX, tx0: tDe(e.clientX) };
    capturar(e);
  };

  const alPulsarBorde = (e: React.PointerEvent, p: Pieza, lado: 'izq' | 'der') => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onTrimStart();
    gesto.current = { tipo: 'borde', id: p.id, lado, x0: e.clientX, inicio: p.inicio, fin: p.fin, total: p.total };
    capturar(e);
  };

  const alMover = (e: React.PointerEvent) => {
    const g = gesto.current;
    if (!g) return;
    if (g.tipo === 'buscar') { buscarCon(e.clientX); return; }
    if (g.tipo === 'pulsado') {
      if (Math.abs(e.clientX - g.x0) < 6) return;
      const i = piezasRef.current.findIndex(x => x.id === g.id);
      const agarre = e.clientX - (lienzo.current?.getBoundingClientRect().left || 0) - xDe(inicios[i] ?? 0);
      gesto.current = { tipo: 'arrastre', id: g.id, agarre };
      setArrastrando({ id: g.id, x: e.clientX });
      return;
    }
    if (g.tipo === 'arrastre') {
      setArrastrando({ id: g.id, x: e.clientX });
      // Se cambia de sitio al pasar la mitad de la vecina.
      const lista = piezasRef.current;
      const desde = lista.findIndex(x => x.id === g.id);
      const t = tDe(e.clientX);
      let hasta = 0;
      let acc = 0;
      for (const x of lista) {
        if (x.id === g.id) continue;
        const d = durFinal(x);
        if (t > acc + d / 2) hasta += 1;
        acc += d;
      }
      if (desde >= 0 && hasta !== desde) onReorder(mover(lista, desde, hasta));
      return;
    }
    if (g.tipo === 'borde') {
      const p = piezasRef.current.find(x => x.id === g.id);
      if (!p) return;
      const dSeg = (e.clientX - g.x0) / pxSeg;
      if (p.tipo === 'imagen') {
        // Una imagen no tiene "original": los bordes cambian cuánto se ve.
        const base = g.fin - g.inicio;
        const nuevo = Math.round(Math.max(0.5, Math.min(60, base + (g.lado === 'der' ? dSeg : -dSeg))) * 10) / 10;
        onTrim(p.id, { total: nuevo, inicio: 0, fin: nuevo });
        return;
      }
      const vel = p.velocidad || 1;
      if (g.lado === 'izq') {
        const inicio = Math.max(0, Math.min(g.fin - MIN_TRAMO, g.inicio + dSeg * vel));
        onTrim(p.id, { inicio });
        onPreview(p.id, inicio);
      } else {
        let fin = Math.min(g.total, Math.max(g.inicio + MIN_TRAMO, g.fin + dSeg * vel));
        // Imán: el borde derecho se pega al cursor si pasa cerca.
        const i = piezasRef.current.findIndex(x => x.id === p.id);
        const borde = (inicios[i] ?? 0) + (fin - p.inicio) / vel;
        const alCursor = p.inicio + (posicion - (inicios[i] ?? 0)) * vel;
        if (Math.abs(borde - posicion) * pxSeg < IMAN && alCursor > p.inicio + MIN_TRAMO && alCursor <= g.total) {
          fin = alCursor;
          setGuia(posicion);
        } else {
          setGuia(null);
        }
        onTrim(p.id, { fin });
        onPreview(p.id, Math.max(g.inicio, fin - 0.04));
      }
    }
  };

  const alSoltar = (e: React.PointerEvent) => {
    const g = gesto.current;
    gesto.current = null;
    setArrastrando(null);
    setGuia(null);
    if (g?.tipo === 'pulsado') onSelect(g.id, g.tx0);
    try { lienzo.current?.releasePointerCapture(e.pointerId); } catch { /* ya suelto */ }
  };

  // ---- dibujo ----------------------------------------------------------------
  const paso = pasoRegla(pxSeg);
  const marcasRegla: number[] = [];
  for (let s = 0; s <= total + 1e-6; s += paso) marcasRegla.push(s);

  const selIdx = piezas.findIndex(p => p.id === seleccionada);
  const sel = selIdx >= 0 ? piezas[selIdx] : null;
  // El tramo marcado, pasado a tiempo del vídeo final.
  const marcado = (() => {
    if (!sel || !marcas) return null;
    const vel = sel.velocidad || 1;
    const g = (t: number) => inicios[selIdx] + (t - sel.inicio) / vel;
    const a = marcas.a !== null ? g(marcas.a) : null;
    const b = marcas.b !== null ? g(marcas.b) : null;
    return { a, b };
  })();

  const botonZoom = 'w-8 h-8 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/25 flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed';

  return (
    <div className="flex flex-col gap-1.5 select-none">
      {/* Herramientas (del editor) y zoom */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">{herramientas}</div>
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" className={botonZoom} onClick={() => setZoom(z => Math.max(1, z / 1.5))} disabled={zoom <= 1} title={tx('ed_zoom_out', 'Zoom out') + ' (Ctrl −)'} aria-label={tx('ed_zoom_out', 'Zoom out')}><ZoomOut className="w-4 h-4" /></button>
          <input
            type="range" min={0} max={100} step={1}
            value={Math.round((Math.log(Math.min(zoom, zoomMax)) / Math.log(Math.max(zoomMax, 1.0001))) * 100)}
            onChange={e => setZoom(Math.exp((parseInt(e.target.value, 10) / 100) * Math.log(Math.max(zoomMax, 1.0001))))}
            aria-label={tx('ed_zoom', 'Zoom')}
            className="w-20 sm:w-28 accent-twitch h-1 cursor-pointer"
          />
          <button type="button" className={botonZoom} onClick={() => setZoom(z => Math.min(zoomMax, z * 1.5))} disabled={zoom >= zoomMax} title={tx('ed_zoom_in', 'Zoom in') + ' (Ctrl +)'} aria-label={tx('ed_zoom_in', 'Zoom in')}><ZoomIn className="w-4 h-4" /></button>
          <button type="button" className={botonZoom} onClick={() => setZoom(1)} title={tx('ed_zoom_fit', 'Fit the whole video') + ' (Ctrl 0)'} aria-label={tx('ed_zoom_fit', 'Fit the whole video')}><Maximize2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <div ref={scroller} className="overflow-x-auto overflow-y-hidden custom-scrollbar rounded-xl bg-black/30 border border-white/5">
        <div
          ref={lienzo}
          className="relative touch-none"
          style={{ width: anchoTotal, height: ALTO_PISTA + 34 }}
          onPointerDown={alPulsarFondo}
          onPointerMove={alMover}
          onPointerUp={alSoltar}
          onPointerCancel={alSoltar}
        >
          {/* Regla */}
          <div className="absolute inset-x-0 top-0 h-6 cursor-pointer border-b border-white/10">
            {marcasRegla.map(s => (
              <div key={s} className="absolute top-0 h-full" style={{ left: xDe(s) }}>
                <div className="absolute bottom-0 w-px h-2 bg-white/30" />
                <span className="absolute top-0.5 left-1 text-[9px] font-mono font-bold text-gray-500 whitespace-nowrap">{mmss(s)}</span>
                {/* Marcas pequeñas entre medias */}
                {[1, 2, 3, 4].map(k => (
                  <div key={k} className="absolute bottom-0 w-px h-1 bg-white/15" style={{ left: (paso * pxSeg * k) / 5 }} />
                ))}
              </div>
            ))}
          </div>

          {/* Pista */}
          <div className="absolute inset-x-0" style={{ top: 30, height: ALTO_PISTA }}>
            {piezas.map((p, i) => {
              const d = durFinal(p);
              const izq = xDe(inicios[i]);
              const w = Math.max(2, d * pxSeg);
              const elegida = p.id === seleccionada;
              const movida = arrastrando?.id === p.id;
              const f = fuenteLista(p);
              const tira = f ? tiras[f.url] : undefined;
              // Fotogramas que tocan a esta pieza: uno por "casilla" de 16:9.
              const casilla = ALTO_PISTA * 16 / 9;
              const n = Math.max(1, Math.ceil(w / casilla));
              const vel = p.velocidad || 1;
              let desplaza = 0;
              if (movida && lienzo.current) {
                const r = lienzo.current.getBoundingClientRect();
                const g = gesto.current;
                const agarre = g && g.tipo === 'arrastre' ? g.agarre : 0;
                desplaza = arrastrando!.x - r.left - agarre - izq;
              }
              return (
                <div
                  key={p.id}
                  onPointerDown={e => alPulsarPieza(e, p)}
                  className={`absolute top-0 h-full rounded-xl overflow-hidden cursor-grab active:cursor-grabbing bg-[#1a1822] transition-shadow ${
                    elegida ? 'ring-2 ring-twitch shadow-[0_0_0_4px_rgba(var(--color-accent-rgb),0.18)] z-10' : 'ring-1 ring-inset ring-white/10 hover:ring-white/40'
                  } ${movida ? 'opacity-80 z-20 shadow-2xl scale-y-105' : ''}`}
                  style={{ left: izq + HUECO, width: Math.max(2, w - HUECO * 2), transform: desplaza ? `translateX(${desplaza}px)` : undefined }}
                  title={`${p.nombre} · ${mmss(d, true)}`}
                >
                  <div className="absolute inset-0 flex">
                    {p.tipo === 'imagen' || !tira
                      ? <div className="absolute inset-0" style={{ backgroundImage: `url(${p.thumb})`, backgroundSize: 'auto 100%', backgroundRepeat: 'repeat-x' }} />
                      : Array.from({ length: n }, (_, k) => {
                        const tOrig = p.inicio + Math.min(d, (k + 0.5) * (casilla / pxSeg)) * vel;
                        const idx = Math.max(0, Math.min(tira.length - 1, Math.floor((tOrig / Math.max(p.total, 0.001)) * tira.length)));
                        return <img key={k} src={tira[idx]} alt="" draggable={false} className="h-full object-cover shrink-0" style={{ width: casilla }} />;
                      })}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
                  {w > 46 && (
                    <span className="absolute top-1 left-1.5 right-1.5 flex items-center gap-1 text-white/90 pointer-events-none">
                      {p.tipo === 'imagen' && <ImageIcon className="w-3 h-3 shrink-0" />}
                      {p.silencio && <VolumeX className="w-3 h-3 text-red-300 shrink-0" />}
                      {vel !== 1 && <span className="flex items-center gap-0.5 text-[9px] font-black shrink-0"><Gauge className="w-3 h-3" />{vel}x</span>}
                    </span>
                  )}
                  {w > 70 && (
                    <span className="absolute bottom-1 left-1.5 right-1.5 flex items-end justify-between gap-1 pointer-events-none">
                      <span className="text-[10px] font-bold text-white truncate">{p.nombre}</span>
                      <span className="text-[9px] font-mono font-bold text-white/80 shrink-0">{mmss(d, true)}</span>
                    </span>
                  )}
                </div>
              );
            })}

            {/* Tramo marcado con I / O */}
            {marcado && marcado.a !== null && marcado.b !== null && (
              <div
                className="absolute top-0 h-full bg-red-500/30 border-x-2 border-red-400 pointer-events-none z-20 bg-[repeating-linear-gradient(135deg,transparent_0_6px,rgba(0,0,0,0.25)_6px_12px)]"
                style={{ left: xDe(Math.min(marcado.a, marcado.b)), width: Math.abs(marcado.b - marcado.a) * pxSeg }}
              />
            )}
            {marcado && [marcado.a, marcado.b].map((m, k) => m !== null && (marcado.a === null || marcado.b === null) && (
              <div key={k} className="absolute top-0 h-full w-0.5 bg-red-400 pointer-events-none z-20" style={{ left: xDe(m) }} />
            ))}

            {/* Bordes de la elegida, para recortar arrastrando */}
            {sel && !arrastrando && (['izq', 'der'] as const).map(lado => {
              const x = lado === 'izq' ? xDe(inicios[selIdx]) : xDe(inicios[selIdx] + durFinal(sel));
              return (
                <div
                  key={lado}
                  onPointerDown={e => alPulsarBorde(e, sel, lado)}
                  className="absolute top-0 h-full w-3.5 z-30 cursor-ew-resize flex items-center justify-center group"
                  style={{ left: lado === 'izq' ? x + HUECO : x - HUECO - 14 }}
                  title={tx('ed_tl_trim', 'Drag to trim')}
                >
                  <span className={`h-full w-2.5 bg-twitch flex items-center justify-center shadow-lg group-hover:brightness-125 ${lado === 'izq' ? 'rounded-l-xl' : 'rounded-r-xl'}`}>
                    <span className="w-0.5 h-5 rounded-full bg-black/60" />
                  </span>
                </div>
              );
            })}
          </div>

          {/* Guía del imán */}
          {guia !== null && (
            <div className="absolute top-0 bottom-0 z-[35] w-px bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.9)] pointer-events-none" style={{ left: xDe(guia) }} />
          )}

          {/* Cursor, con el tiempo encima */}
          <div className="absolute top-0 bottom-0 z-40 pointer-events-none" style={{ left: xDe(posicion) }}>
            <div className="absolute top-0 bottom-0 -left-px w-0.5 bg-white shadow-[0_0_6px_rgba(0,0,0,0.9)]" />
            <div className="absolute top-0 left-0 -translate-x-1/2 px-1.5 h-[18px] rounded-md bg-white text-black text-[9px] font-mono font-black flex items-center whitespace-nowrap shadow-lg">
              {mmss(posicion, true)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
