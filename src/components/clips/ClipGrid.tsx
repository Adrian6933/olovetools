import React, { useState, useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Clip } from './types';
import { Play, ImageOff, Loader2, Plus, Check, ArrowDownCircle, FastForward, Link as LinkIcon, Download, EyeOff, CheckCircle2, ListPlus } from 'lucide-react';
import ProgressiveImage from './ProgressiveImage';
import { AdSlot } from '../shared/AdSlot';

// Tres columnas es el tope, también en monitores grandes: la 4ª estrechaba
// demasiado la portada y es la rejilla la que crece, no el número de columnas.
const GRID_CLASSNAME = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8 xl:gap-10';

/** Ancho al que se pinta la portada en cada corte de la rejilla, para que el
 *  navegador baje del srcset el tamaño justo y no la más grande siempre. */
const THUMB_SIZES = '(min-width: 2240px) 560px, (min-width: 1800px) 25vw, (min-width: 1400px) 24vw, (min-width: 1024px) 31vw, (min-width: 640px) 47vw, 94vw';

/** Hueco mínimo y máximo de clips entre dos anuncios de la rejilla. */
const AD_GAP_MIN = 8;
const AD_GAP_MAX = 17;

/**
 * Posiciones de los anuncios dentro de la rejilla, con separación irregular en
 * vez de una cada N exactas (un patrón fijo se nota y "cansa" al bajar).
 *
 * El azar es determinista a propósito: un Math.random() suelto recolocaría los
 * anuncios en cada repintado, y con el barrido profundo eso son decenas de
 * saltos por segundo. Con este generador la posición solo depende del índice,
 * así que se mantiene estable mientras se van añadiendo clips al final.
 */
const adPositions = (total: number): Set<number> => {
  const out = new Set<number>();
  let seed = 0x9e3779b9;
  let i = Math.floor(AD_GAP_MIN / 2);
  while (i < total - 1) {
    out.add(i);
    // xorshift32: barato, sin dependencias y siempre da la misma secuencia.
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0;
    i += AD_GAP_MIN + (seed % (AD_GAP_MAX - AD_GAP_MIN + 1));
  }
  return out;
};

/**
 * Anuncio in-feed ocupando una celda de la rejilla, al estilo de YouTube o
 * Twitch. Reutiliza el slot `infeed` y el layout key que ya estaban en
 * ads.ts para el grid del hub, así que no hay que crear nada en AdSense.
 */
const FeedAdCard: React.FC = () => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-[2rem] border border-white/5 bg-[#0d0d12] p-4">
    <AdSlot position="infeed" size="rectangle" />
  </div>
);

// Construir un Intl.NumberFormat es caro y aquí se hacía uno por tarjeta y por
// render. Con 500 clips en pantalla eso son 500 constructores en cada repintado.
const VIEW_FORMATTER = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export interface ClipGridHandle {
  scrollToClip: (clipId: string) => void;
}

interface ClipGridProps {
  clips: Clip[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onLoadAll: () => void;
  onClipClick: (clip: Clip) => void;
  savedClipIds: Set<string>;
  onToggleSave: (clip: Clip) => void;
  onDownloadExternal: (url: string) => void;
  onBlockStreamer: (id: string, name: string, image?: string) => void;
  /** Abre el selector de listas con nombre. El botón + de al lado no pregunta:
   * va siempre a la lista por defecto. */
  onAddToLists: (clip: Clip) => void;
  t: (key: string) => string;
  /** false en modo rendimiento: con solo 50 tarjetas montadas, el final de la
   * lista se alcanza casi al hacer scroll una vez, así que ahí la carga en
   * segundo plano la dispara Clipy directamente en vez de esto. */
  autoLoadOnScroll?: boolean;
}

const ClipCard: React.FC<{
  clip: Clip;
  onClick: (clip: Clip) => void;
  isSaved: boolean;
  onToggleSave: (clip: Clip) => void;
  onDownloadExternal: (url: string) => void;
  onBlockStreamer: (id: string, name: string, image?: string) => void;
  onAddToLists: (clip: Clip) => void;
  t: (key: string) => string;
}> = React.memo(({ clip, onClick, isSaved, onToggleSave, onDownloadExternal, onBlockStreamer, onAddToLists, t }) => {
  const [imgError, setImgError] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const formattedViews = VIEW_FORMATTER.format(clip.view_count);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(clip.url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // `content-visibility: auto` implica `contain: paint`, que RECORTA todo lo que
  // se salga de la caja. Al pasar el ratón la tarjeta sube 8px y proyecta sombra
  // hacia abajo, así que se le cortaba el borde superior y la sombra no se veía
  // nunca. El padding le da ese margen dentro de la caja pintada, y el margen
  // negativo lo compensa para que la rejilla no se separe.
  //
  // `contain-intrinsic-size` es el alto que se RESERVA mientras la tarjeta está
  // sin pintar, y hay que afinarlo: es 16:9 + 60px de la fila del título, así
  // que depende del ancho de columna y va de 211px a 364px. Con un valor único
  // de 420px se reservaban hasta 200px de más por fila, y cada fila que entraba
  // en pantalla se encogía de golpe empujando hacia arriba todo lo de abajo —
  // ese era el tirón del scroll. El `auto` hace que, una vez pintada, el
  // navegador recuerde la medida real; estos números solo cubren la primera
  // pasada, por eso basta con acertar por tramos.
  return (
    <div
      id={`clip-card-${clip.id}`}
      className="[contain-intrinsic-size:auto_245px] lg:[contain-intrinsic-size:auto_240px] 2xl:[contain-intrinsic-size:auto_258px] 3xl:[contain-intrinsic-size:auto_323px]"
      style={{
        contentVisibility: 'auto',
        padding: '0.75rem 0.5rem 2.5rem',
        margin: '-0.75rem -0.5rem -2.5rem',
      } as React.CSSProperties}
    >
      {/* El relleno de arriba existe solo para que `contain: paint` no recorte el
          hover, así que no debe ser clicable: el clic y el cursor viven aquí. */}
      <div className="group flex flex-col gap-4 cursor-pointer" onClick={() => onClick(clip)}>
        <div
          style={{ isolation: 'isolate', transform: 'translateZ(0)' }}
          className="relative aspect-video bg-[#0a0a0f] overflow-hidden rounded-[2rem] border border-white/5 transition-[transform,border-color,box-shadow] duration-[450ms] ease-expo group-hover:border-twitch-base/30 group-hover:shadow-[0_24px_50px_-12px_rgba(0,0,0,0.7),0_0_0_1px_rgba(145,70,255,0.15)] group-hover:-translate-y-2"
        >

          {!imgError ? (
            <ProgressiveImage
              src={clip.thumbnail_url}
              alt={`Miniatura del clip de Twitch de ${clip.broadcaster_name} titulado ${clip.title || 'Clip'}`}
              className="w-full h-full transition-transform duration-[900ms] ease-expo group-hover:scale-[1.06]"
              isCategory={false}
              sizes={THUMB_SIZES}
              onLoadFailed={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-[#15151b]">
              <ImageOff className="w-10 h-10 mb-2 opacity-50" />
              <span className="text-xs uppercase font-black tracking-widest">{t('no_preview')}</span>
            </div>
          )}

          {/* Sin degradados ni capas encima: la portada se ve limpia. La duración
              y las vistas se leen con su propia pastilla, que ocupa solo su texto
              en vez de teñir un tercio de la imagen. */}

          {/* Una sola barra en vez de cuatro círculos sueltos. Entra deslizándose
              desde arriba; el desenfoque solo se aplica en hover, así que nunca
              hay 500 capas con backdrop-filter activo a la vez. */}
          <div className="absolute top-3 right-3 z-30 flex items-center gap-1 rounded-2xl border border-white/10 bg-black/60 p-1 shadow-lg transition-[opacity,transform] duration-[350ms] ease-expo group-hover:backdrop-blur-md opacity-100 lg:opacity-0 lg:-translate-y-3 lg:group-hover:opacity-100 lg:group-hover:translate-y-0 lg:group-hover:delay-[120ms]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBlockStreamer(clip.broadcaster_id, clip.broadcaster_name, clip.broadcaster_image);
              }}
              className="flex items-center justify-center w-9 h-9 rounded-xl text-white/80 transition-[background-color,color,transform] duration-200 hover:bg-red-600 hover:text-white hover:scale-110 active:scale-95 cursor-pointer"
              title={t('block') || 'Ocultar streamer'}
            >
              <EyeOff className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDownloadExternal(clip.url); }}
              className="flex items-center justify-center w-9 h-9 rounded-xl text-white/80 transition-[background-color,color,transform] duration-200 hover:bg-white hover:text-black hover:scale-110 active:scale-95 cursor-pointer"
              title={t('download_zip_web')}
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleCopyLink}
              title={t('copy_link')}
              className={`flex items-center justify-center w-9 h-9 rounded-xl transition-[background-color,color,transform] duration-200 hover:scale-110 active:scale-95 cursor-pointer ${isCopied ? 'bg-green-500 text-white scale-110' : 'text-white/80 hover:bg-white hover:text-black'}`}
            >
              {isCopied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleSave(clip); }}
              title={t('save')}
              className={`flex items-center justify-center w-9 h-9 rounded-xl transition-[background-color,color,transform] duration-200 hover:scale-110 active:scale-95 cursor-pointer ${isSaved ? 'bg-twitch-base text-[var(--color-accent-ink)]' : 'text-white/80 hover:bg-twitch-base hover:text-[var(--color-accent-ink)]'}`}
            >
              {isSaved ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onAddToLists(clip); }}
              title={t('add_to_lists')}
              className="flex items-center justify-center w-9 h-9 rounded-xl text-white/80 transition-[background-color,color,transform] duration-200 hover:bg-twitch-base hover:text-[var(--color-accent-ink)] hover:scale-110 active:scale-95 cursor-pointer"
            >
              <ListPlus className="w-4 h-4" />
            </button>
          </div>

          <div className="absolute top-3 left-3 bg-black/75 px-2 py-1 rounded-lg text-[11px] font-black text-white tabular-nums z-20">
            {clip.duration}
          </div>

          <div className="absolute bottom-3 right-3 bg-black/75 px-2 py-1 rounded-lg text-[11px] font-black text-white flex items-center gap-1.5 tabular-nums z-20">
            {/* Estático a propósito: `animate-pulse` aquí significaba una animación
                en marcha POR TARJETA — con 500 clips cargados son 500 animaciones
                simultáneas manteniendo ocupado al compositor durante el scroll. */}
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            {formattedViews}
          </div>

          {/* El muelle del final de la curva (1.56) da el rebotito al aparecer. */}
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="flex items-center justify-center w-[4.5rem] h-[4.5rem] rounded-full bg-twitch-base/90 shadow-[0_10px_35px_rgba(145,70,255,0.5)] transition-[transform,opacity] duration-[420ms] ease-spring scale-100 opacity-100 lg:scale-50 lg:opacity-0 lg:group-hover:scale-100 lg:group-hover:opacity-100 lg:group-hover:delay-[80ms]">
              <Play className="w-7 h-7 text-white fill-current ml-1" />
            </div>
          </div>
        </div>

        <div className="flex gap-4 px-2">
          <div className="flex-shrink-0">
            <div className="w-11 h-11 rounded-2xl bg-[#1c1c24] p-0.5 overflow-hidden border border-white/5 opacity-60 transition-[opacity,transform] duration-300 group-hover:opacity-100 group-hover:scale-105">
              <img
                src={clip.broadcaster_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${clip.broadcaster_name}`}
                alt={`Avatar de ${clip.broadcaster_name}`}
                loading="lazy"
                decoding="async"
                className="w-full h-full rounded-2xl object-cover"
              />
            </div>
          </div>
          <div className="flex flex-col min-w-0 justify-center">
            <h3 className="font-black text-base text-gray-100 truncate group-hover:text-twitch-base transition-colors duration-200 leading-tight mb-1">
              {clip.title}
            </h3>
            <p className="text-xs text-gray-500 font-bold truncate opacity-50 transition-opacity duration-200 group-hover:opacity-90">
              {clip.broadcaster_name}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
ClipCard.displayName = 'ClipCard';

const ClipGrid = forwardRef<ClipGridHandle, ClipGridProps>(({
  clips, isLoading, hasMore, onLoadMore, onLoadAll, onClipClick, savedClipIds, onToggleSave, onDownloadExternal, onBlockStreamer, onAddToLists, t, autoLoadOnScroll = true
}, ref) => {
  const observerTarget = useRef<HTMLDivElement>(null);
  const adSlots = useMemo(() => adPositions(clips.length), [clips.length]);

  useImperativeHandle(ref, () => ({
    scrollToClip: (clipId: string) => {
      const element = document.getElementById(`clip-card-${clipId}`);
      if (!element) return;
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-4', 'ring-twitch-base/20', 'scale-105', 'z-50', 'transition-all', 'duration-500');
      setTimeout(() => {
        element.classList.remove('ring-4', 'ring-twitch-base/20', 'scale-105', 'z-50');
      }, 1500);
    },
  }), []);

  useEffect(() => {
    if (!autoLoadOnScroll) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => { if (observerTarget.current) observer.unobserve(observerTarget.current); };
  }, [hasMore, isLoading, onLoadMore, autoLoadOnScroll]);

  if (isLoading && clips.length === 0) {
    return (
      <div className={GRID_CLASSNAME}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex flex-col gap-4">
            <div className="aspect-video bg-[#1a1a24] animate-pulse rounded-[2rem]"></div>
            <div className="flex gap-4 px-2">
              <div className="w-11 h-11 rounded-2xl bg-[#1c1c24] animate-pulse"></div>
              <div className="flex-1 space-y-3 py-1"><div className="h-4 bg-[#1c1c24] rounded-xl w-3/4 animate-pulse"></div></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className={GRID_CLASSNAME}>
        {clips.map((clip, i) => {
          const adAfter = adSlots.has(i);
          return (
            <React.Fragment key={clip.id}>
              <ClipCard
                clip={clip} onClick={onClipClick} isSaved={savedClipIds.has(clip.id)}
                onToggleSave={onToggleSave} onDownloadExternal={onDownloadExternal} onBlockStreamer={onBlockStreamer}
                onAddToLists={onAddToLists} t={t}
              />
              {adAfter && <FeedAdCard />}
            </React.Fragment>
          );
        })}
      </div>
      <div ref={observerTarget} className="h-10 w-full opacity-0 pointer-events-none"></div>
      <div className="w-full flex justify-center mt-16 md:mt-24 mb-16 md:mb-24">
        {!isLoading && hasMore && (
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 w-full max-w-2xl px-2 sm:px-6">
            <button onClick={onLoadMore} className="flex-1 min-w-0 bg-[#1a1a24] hover:bg-[#2c2c36] text-white font-black text-sm md:text-base py-4 md:py-6 px-5 md:px-10 rounded-3xl md:rounded-[2rem] border border-white/5 transition-premium active:scale-95 flex items-center justify-center gap-3 shadow-2xl cursor-pointer">
              <ArrowDownCircle className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0 text-twitch-base/30" /> <span className="truncate">{t('load_more')}</span>
            </button>
            <button onClick={onLoadAll} className="flex-1 min-w-0 bg-twitch-base/60 hover:bg-twitch-base/80 text-[var(--color-accent-ink)] font-black text-sm md:text-base py-4 md:py-6 px-5 md:px-10 rounded-3xl md:rounded-[2rem] transition-premium shadow-xl shadow-twitch-base/5 active:scale-95 flex items-center justify-center gap-3 cursor-pointer">
              <FastForward className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" /> <span className="truncate">{t('load_all')}</span>
            </button>
          </div>
        )}
        {isLoading && clips.length > 0 && <div className="flex items-center gap-3 md:gap-4 text-twitch-base font-black text-sm md:text-base bg-[#1a1a24] px-6 md:px-12 py-4 md:py-6 rounded-3xl md:rounded-[2rem] shadow-2xl"><Loader2 className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0 animate-spin" /> {t('loading_results')}</div>}
        {!isLoading && !hasMore && clips.length > 0 && (
          <div className="flex items-center gap-3 text-gray-500 font-bold text-xs md:text-sm text-center px-4 md:px-8 py-4">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-twitch-base/60" /> {t('all_clips_loaded')}
          </div>
        )}
      </div>
    </>
  );
});

export default ClipGrid;