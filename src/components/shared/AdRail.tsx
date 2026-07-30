import React, { useEffect, useRef, useState } from 'react';
import { ADS_ENABLED, AD_CLIENT, AD_SLOTS, RAIL_BLOCKLIST } from '../../config/ads';

interface AdRailProps {
  /** Tool slug of the current page, used to respect RAIL_BLOCKLIST */
  slug: string;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** Aire entre el raíl y el borde de la ventana, y entre el raíl y el contenido.
 *  Pegado al borde (los 8px de antes) quedaba como si se saliera de la pantalla. */
const RAIL_EDGE = 24;
const RAIL_MARGIN = RAIL_EDGE * 2;

/**
 * Mide el hueco real entre el contenido visible y el borde del viewport en
 * cada lado. `#root` en sí mismo NO sirve como referencia: es un div sin
 * ancho propio (100% del body en todas las tools). El header y el footer de
 * cada tool tampoco sirven: su barra de fondo es intencionalmente w-full en
 * casi todas las herramientas aunque su contenido esté centrado, así que
 * escanear todo #root siempre da hueco cero. El límite de ancho real que nos
 * importa es el de `<main>` (el contenedor de contenido reflowable, con el
 * max-w distinto por tool: algunas max-w-7xl/1280px, Clipy hasta
 * max-w-[2200px], Formatflow max-w-[1700px]...), así que medimos ese
 * elemento en vez de adivinar su ancho o escanear todo el árbol.
 */
const useRailGaps = () => {
  const [gaps, setGaps] = useState({ left: 0, right: 0 });

  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const measure = () => {
      const viewportWidth = document.documentElement.clientWidth;
      const content = root.querySelector('main') || root;
      const rect = content.getBoundingClientRect();

      if (rect.width === 0 && rect.height === 0) return;

      setGaps({ left: Math.max(0, rect.left), right: Math.max(0, viewportWidth - rect.right) });
    };

    // setTimeout (no requestAnimationFrame) a propósito: rAF se pausa por
    // completo en pestañas en segundo plano/no visibles, dejando el hueco
    // medido congelado en su valor inicial si el usuario cambia de pestaña
    // antes del primer resize.
    const scheduleMeasure = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(measure, 50);
    };

    scheduleMeasure();

    // ResizeObserver en body: cambios de viewport. MutationObserver en #root:
    // cambios de contenido (ej. Clipy pasando de categorías a clips).
    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(document.body);
    const mutationObserver = new MutationObserver(scheduleMeasure);
    mutationObserver.observe(root, { childList: true, subtree: true });
    window.addEventListener('resize', scheduleMeasure);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
    };
  }, []);

  return gaps;
};

const Rail: React.FC<{ side: 'left' | 'right'; slot: string; configured: boolean; visible: boolean }> = ({ side, slot, configured, visible }) => {
  const insRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef(false);

  // AdSense NO sirve anuncios en localhost, así que en desarrollo el <ins> real
  // se queda vacío y parece que el raíl no existe. En DEV se pinta siempre el
  // recuadro de prueba, para poder verificar posición y hueco.
  const active = configured && !import.meta.env.DEV;

  useEffect(() => {
    if (!active || !visible || !insRef.current || pushedRef.current) return;
    if (insRef.current.getAttribute('data-ad-status')) return;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      pushedRef.current = true;
    } catch {
      // adsbygoogle.js aún no cargado o bloqueado por un ad-blocker; no es un error de la app.
    }
  }, [active, visible]);

  if (!visible) return null;

  // Primer filtro barato (evita medir en viewports obviamente estrechos); la
  // visibilidad real ya la decide `visible` (hueco medido contra #root).
  // 1400 y no 1560: Windows al 125% de escala hace que un monitor de 1920
  // reporte 1536 CSS px, así que con el umbral en 1560 los raíles no salían
  // en la resolución de escritorio más común que existe.
  return (
    <div
      aria-hidden="true"
      className={`hidden min-[1400px]:flex items-center justify-center fixed top-1/2 -translate-y-1/2 z-30 w-[120px] min-[1650px]:w-[160px] h-[600px] ${
        side === 'left' ? 'left-6' : 'right-6'
      }`}
      style={!active ? { border: '2px dashed #a855f7', borderRadius: '0.5rem', background: 'rgba(168,85,247,0.25)' } : undefined}
    >
      {active ? (
        <ins
          ref={insRef}
          className="adsbygoogle block w-full h-full"
          data-ad-client={AD_CLIENT}
          data-ad-slot={slot}
        />
      ) : (
        <span className="text-sm font-black uppercase tracking-widest text-white [writing-mode:vertical-rl] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          Ad · {side === 'left' ? 'Left Rail' : 'Right Rail'}
        </span>
      )}
    </div>
  );
};

/**
 * Fixed skyscraper rails (left + right). Visibilidad decidida en runtime
 * midiendo el hueco real entre #root (el contenedor común a todas las
 * herramientas) y el borde del viewport, no asumiendo un ancho de contenido
 * fijo — así se autocorrige para cualquier tool, ancho de ventana, zoom o
 * escalado de pantalla, sin mantener un registro de anchos por herramienta.
 * Renders nothing server-side impact-wise: CLS es 0 porque los raíles son
 * position:fixed y nunca afectan el flujo del documento.
 */
export const AdRail: React.FC<AdRailProps> = ({ slug }) => {
  const gaps = useRailGaps();

  if (RAIL_BLOCKLIST.includes(slug)) return null;

  const activeLeft = ADS_ENABLED && !!AD_SLOTS.railLeft;
  const activeRight = ADS_ENABLED && !!AD_SLOTS.railRight;

  // En producción sin slots configurados no renderizamos nada; en dev se ve
  // el placeholder para verificar el diseño antes de activar AdSense.
  if (!import.meta.env.DEV && !activeLeft && !activeRight) return null;

  const railWidth = typeof window !== 'undefined' && document.documentElement.clientWidth >= 1650 ? 160 : 120;
  const required = railWidth + RAIL_MARGIN;

  return (
    <>
      <Rail side="left" slot={AD_SLOTS.railLeft} configured={activeLeft} visible={gaps.left >= required} />
      <Rail side="right" slot={AD_SLOTS.railRight} configured={activeRight} visible={gaps.right >= required} />
    </>
  );
};
