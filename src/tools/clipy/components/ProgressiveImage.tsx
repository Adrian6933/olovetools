import React, { useState, useEffect, useRef, useMemo } from 'react';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  isCategory?: boolean;
  /** Ancho al que se pinta la imagen en cada corte, para que el navegador
   *  elija del srcset. Sin esto asume 100vw y se baja siempre la más grande. */
  sizes?: string;
  /** La imagen no existe ni en su tamaño original: quien la use puede pintar
   *  su propio hueco en vez de dejar un recuadro negro. */
  onLoadFailed?: () => void;
}

/** Tamaño al final de la URL: `-640x360.jpg` (y con query opcional). */
const SIZE_IN_URL = /-(\d+)x(\d+)(\.\w+)(\?.*)?$/;

/** Múltiplos del tamaño base que se ofrecen en el srcset.
 *  Tope en 1.5x (960px con base 640) y no en 2x: a 2x se bajaban 1280px por
 *  portada, que con cientos de clips en pantalla es mucho peso para la mejora
 *  que se aprecia. 960 ya es el doble de los 480 de antes. */
const SRCSET_SCALES = [0.75, 1, 1.5];

/**
 * El CDN de Twitch (static-cdn.jtvnw.net) redimensiona la miniatura al tamaño
 * que se le pida en la URL, así que en vez de servir un único tamaño fijo se
 * ofrece una escalera y decide el navegador según el ancho real de la tarjeta
 * y la densidad de la pantalla. En un móvil retina la portada pasa de estirarse
 * desde 480px a bajarse ya nítida a 960px.
 *
 * Si la URL no lleva el patrón `-WxH.ext` al final (placeholders, avatares)
 * se devuelve undefined y el <img> se queda con su `src` de siempre.
 */
const buildSrcSet = (src: string): string | undefined => {
  const match = src.match(SIZE_IN_URL);
  if (!match) return undefined;

  const baseWidth = parseInt(match[1], 10);
  const baseHeight = parseInt(match[2], 10);
  if (!baseWidth || !baseHeight) return undefined;

  const ratio = baseHeight / baseWidth;
  const widths = [...new Set(SRCSET_SCALES.map(scale => Math.round(baseWidth * scale)))]
    .filter(width => width > 0 && width <= 1920);

  return widths
    .map(width => {
      const variant = src.replace(SIZE_IN_URL, `-${width}x${Math.round(width * ratio)}$3$4`);
      return `${variant} ${width}w`;
    })
    .join(', ');
};

/**
 * ProgressiveImage Component (Pixelated Loading Version)
 * Replaces blur with a sharp pixelated effect for a "low quality" retro look during load.
 */
const ProgressiveImage: React.FC<ProgressiveImageProps> = ({ src, alt, className = "", isCategory = false, sizes, onLoadFailed }) => {
  const [highResLoaded, setHighResLoaded] = useState(false);
  // Red de seguridad: si un tamaño de la escalera no existiera en el CDN, se
  // reintenta con el `src` original en vez de dejar la tarjeta en blanco.
  const [srcSetFailed, setSrcSetFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Ultra-Low Resolution calculation for visible pixels. Se ancla al tamaño
  // del final de la URL (no al primer "WxH" que aparezca) para no tocar por
  // error un número del propio identificador del clip.
  //
  // Las dos derivaciones van memoizadas porque este componente se vuelve a
  // pintar al cargar cada imagen y con cientos de clips en pantalla no tiene
  // sentido rehacer el mismo regex cada vez.
  const lowResUrl = useMemo(() => {
    if (!src) return null;
    const targetSize = isCategory ? '90x120' : '120x68';
    const out = src.replace(SIZE_IN_URL, `-${targetSize}$3$4`);
    return out === src ? null : out;
  }, [src, isCategory]);

  const fullSrcSet = useMemo(() => buildSrcSet(src), [src]);
  const srcSet = srcSetFailed ? undefined : fullSrcSet;

  // Antes la imagen buena se montaba 150ms más tarde con un setTimeout, para
  // que la pixelada llegase primero. Ya no hace falta y salía caro: con toda la
  // categoría cargada eran un temporizador, un cambio de estado y un repintado
  // POR CLIP, más de dos mil de cada. El navegador ya prioriza sola la pequeña
  // (va antes en el DOM) y la grande lleva loading="lazy" + fetchPriority="low",
  // así que ni siquiera se pide hasta que la tarjeta se acerca a la pantalla.
  useEffect(() => {
    setSrcSetFailed(false);
    setHighResLoaded(imgRef.current?.complete === true);
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-[#0a0a0f] ${className}`}>
      {/* 1. Low-Res Placeholder: PIXELATED style */}
      {lowResUrl && (
        <img
          src={lowResUrl}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className={`
            w-full h-full object-cover transition-opacity duration-700
            ${highResLoaded ? 'opacity-0' : 'opacity-100'}
            absolute inset-0
          `}
          style={{
            imageRendering: 'pixelated', // Forces sharp pixels
            filter: 'contrast(1.1)' // Makes pixels pop more
          }}
        />
      )}

      {/* 2. High-Res Image */}
      <img
        ref={imgRef}
        src={src}
        srcSet={srcSet}
        sizes={srcSet ? sizes : undefined}
        alt={alt}
        // @ts-ignore
        fetchPriority="low"
        onLoad={() => setHighResLoaded(true)}
        // Primer fallo: puede ser solo que ese peldaño del srcset no exista, así
        // que se reintenta con el src pelado. Si también falla ese, ya no hay
        // imagen que valga y se avisa al que nos usa.
        onError={() => {
          if (srcSet) setSrcSetFailed(true);
          else onLoadFailed?.();
        }}
        className={`
          w-full h-full object-cover transition-opacity duration-700 ease-out
          ${highResLoaded ? 'opacity-100' : 'opacity-0'}
          relative z-10
        `}
        loading="lazy"
        decoding="async"
      />

      {/* 3. Deep Fallback */}
      {!highResLoaded && !lowResUrl && (
        <div className="absolute inset-0 bg-[#15151b] animate-pulse" />
      )}
    </div>
  );
};

export default ProgressiveImage;
