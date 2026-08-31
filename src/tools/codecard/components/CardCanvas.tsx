import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import type { Line } from '../lib/lines';
import type { CardSettings } from '../types';
import { backgroundCss, FONTS, getAspectRatio, SHADOWS } from '../lib/backgrounds';
import { getTheme } from '../lib/themes';

interface CardCanvasProps {
  settings: CardSettings;
  lines: Line[];
  /** Nodo que se captura al exportar. */
  cardRef: React.RefObject<HTMLDivElement>;
  /** Zoom de la previsualización. No afecta a la exportación. */
  zoom: number;
  onZoomChange: (zoom: number, origin?: { x: number; y: number }) => void;
  pan: { x: number; y: number };
  onPanChange: (pan: { x: number; y: number }) => void;
  /** Click en el número de línea. `invert` llega true con Alt pulsado. */
  onLineClick: (line: number, modifiers: { shift: boolean; invert: boolean }) => void;
  onClearHighlights: () => void;
  /** Con Alt pulsado se previsualiza la selección invertida sin comprometerla. */
  altHeld: boolean;
  /** Mientras se mantiene pulsado "comparar", se enseña el código sin estilo. */
  showPlain: boolean;
  /** Al cambiar, se vuelve a encuadrar la tarjeta en el escenario. */
  fitToken: number;
  interactive?: boolean;
}

/**
 * La tarjeta tal y como se exporta. Todo lo que hay dentro de `cardRef` acaba
 * en el PNG, así que aquí dentro NO puede haber ningún `overflow: auto`: el
 * scroll y el zoom viven en el escenario de fuera. Ese era justo el bug del
 * export recortado.
 */
export const CardCanvas: React.FC<CardCanvasProps> = ({
  settings,
  lines,
  cardRef,
  zoom,
  onZoomChange,
  pan,
  onPanChange,
  onLineClick,
  onClearHighlights,
  altHeld,
  showPlain,
  fitToken,
  interactive = true,
}) => {
  const theme = getTheme(settings.theme);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const highlighted = useMemo(() => new Set(settings.highlightedLines), [settings.highlightedLines]);
  const hasHighlight = highlighted.size > 0;

  const isLit = useCallback(
    (lineNumber: number) => {
      const inSet = highlighted.has(lineNumber);
      // Alt solo cambia lo que se VE; la selección real no se toca hasta que
      // el usuario hace Alt+click.
      return altHeld && hasHighlight ? !inSet : inSet;
    },
    [altHeld, hasHighlight, highlighted]
  );

  /**
   * Encaja la tarjeta en el escenario. Sin esto, en móvil la tarjeta (464px de
   * ancho a 375px de ventana) aparecía recortada por el `overflow: hidden` del
   * escenario y había que descubrir el arrastre para ver el resto.
   *
   * Va en un useLayoutEffect y NO en un ResizeObserver a propósito: el
   * observador no dispara mientras la pestaña está oculta, así que el encuadre
   * se quedaría congelado en el valor inicial al volver a la pestaña. Solo
   * reduce, nunca amplía: acercarse es decisión del usuario.
   */
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const card = cardRef.current;
    if (!stage || !card) return;

    const fit = () => {
      const available = stage.clientWidth - 24;
      const natural = card.offsetWidth;
      if (available <= 0 || natural <= 0) return;
      const target = Math.min(1, available / natural);
      onZoomChange(target);
      onPanChange({ x: 0, y: 0 });
    };

    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
    // Las dependencias son todo lo que cambia el tamaño natural de la tarjeta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    fitToken,
    settings.padding,
    settings.fontSize,
    settings.lineHeight,
    settings.wordWrap,
    settings.cardWidth,
    settings.aspect,
    settings.showLineNumbers,
    settings.fontFamily,
    lines.length,
  ]);

  // onWheel de React se registra como pasivo, así que preventDefault() dentro
  // no hace nada y la página seguiría desplazándose bajo el zoom. Hay que
  // enganchar el listener nativo con { passive: false }.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !interactive) return;

    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const rect = stage.getBoundingClientRect();
      onZoomChange(zoom * (event.deltaY < 0 ? 1.12 : 1 / 1.12), {
        x: event.clientX - rect.left - rect.width / 2,
        y: event.clientY - rect.top - rect.height / 2,
      });
    };

    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, [interactive, onZoomChange, zoom]);

  const startPan = (event: React.MouseEvent) => {
    // Botón central o arrastre sobre el fondo del escenario.
    if (event.button !== 0 && event.button !== 1) return;
    if ((event.target as HTMLElement).closest('.codecard-gutter-btn')) return;
    dragRef.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
  };

  useEffect(() => {
    if (!interactive) return;
    const move = (event: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      onPanChange({
        x: drag.panX + (event.clientX - drag.x),
        y: drag.panY + (event.clientY - drag.y),
      });
    };
    const up = () => {
      dragRef.current = null;
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [interactive, onPanChange]);

  const fontStack = FONTS[settings.fontFamily] || FONTS['jetbrains-mono'];
  const aspect = getAspectRatio(settings.aspect);
  const gutterWidth = `${String(lines.length + settings.startLine).length + 1}ch`;

  const codeStyle: React.CSSProperties = {
    fontFamily: fontStack,
    fontSize: `${settings.fontSize}px`,
    lineHeight: settings.lineHeight,
    tabSize: settings.tabSize,
    // Las ligaduras de Fira Code / JetBrains Mono (=> !== ->) son la razón de
    // ser de esas fuentes; poder apagarlas importa a quien enseña operadores.
    fontVariantLigatures: settings.fontLigatures ? 'contextual' : 'none',
    fontFeatureSettings: settings.fontLigatures ? undefined : '"liga" 0, "calt" 0',
  };

  return (
    <div
      ref={stageRef}
      onMouseDown={interactive ? startPan : undefined}
      className={`codecard-stage relative w-full overflow-hidden rounded-2xl bg-[#08060c] border border-white/5 flex items-center justify-center ${
        interactive ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
      style={{ minHeight: 320 }}
    >
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          // Sin transition a propósito: una transición de transform no avanza
          // mientras la pestaña está en segundo plano, así que el encuadre
          // automático se quedaba clavado en la escala anterior al volver.
          // El zoom ya va a saltos, así que tampoco se echa de menos.
        }}
      >
        <div
          ref={cardRef}
          id="codecard-render-node"
          className="codecard-card select-none"
          style={{
            background: backgroundCss(settings.background),
            padding: `${settings.padding}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            aspectRatio: aspect ? String(aspect) : undefined,
            width: 'max-content',
            boxSizing: 'border-box',
          }}
        >
          <div
            className="codecard-window relative overflow-hidden flex flex-col"
            style={{
              borderRadius: `${settings.borderRadius}px`,
              boxShadow: SHADOWS[settings.shadow],
              background: theme.bg,
              border: `1px solid ${theme.border}`,
              width: settings.wordWrap ? `${settings.cardWidth}px` : 'max-content',
              maxWidth: settings.wordWrap ? `${settings.cardWidth}px` : undefined,
            }}
          >
            {settings.windowStyle !== 'none' && (
              <div
                className="flex items-center justify-between gap-4 px-4 py-2.5"
                style={{ background: theme.chrome, borderBottom: `1px solid ${theme.border}` }}
              >
                <div className="flex items-center gap-2 shrink-0">
                  {settings.windowStyle === 'mac' && (
                    <>
                      <span className="w-3 h-3 rounded-full" style={{ background: '#ff5f56' }} />
                      <span className="w-3 h-3 rounded-full" style={{ background: '#ffbd2e' }} />
                      <span className="w-3 h-3 rounded-full" style={{ background: '#27c93f' }} />
                    </>
                  )}
                  {settings.windowStyle === 'windows' && (
                    <span className="w-10 h-3 rounded-sm" style={{ background: theme.border }} />
                  )}
                  {settings.windowStyle === 'simple' && (
                    <span className="w-3 h-3 rounded-sm" style={{ background: theme.accent, opacity: 0.7 }} />
                  )}
                </div>

                <div
                  className="text-[11px] font-semibold tracking-wide truncate"
                  style={{ color: theme.gutter, fontFamily: fontStack, maxWidth: 260 }}
                >
                  {settings.fileName}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {settings.windowStyle === 'windows' ? (
                    <>
                      <span className="w-2.5 h-0.5" style={{ background: theme.gutter }} />
                      <span className="w-2.5 h-2.5 border" style={{ borderColor: theme.gutter }} />
                      <span className="text-[11px] leading-none" style={{ color: theme.gutter }}>
                        ✕
                      </span>
                    </>
                  ) : (
                    <span className="w-10 h-3" />
                  )}
                </div>
              </div>
            )}

            {/* Código. `width: max-content` en vez de overflow-x: auto — es lo
                que garantiza que la exportación no recorte líneas largas. */}
            <div
              className="codecard-code"
              style={{
                ...codeStyle,
                width: settings.wordWrap ? '100%' : 'max-content',
                padding: '14px 0',
              }}
            >
              {lines.map((spans, index) => {
                const lineNumber = index + settings.startLine;
                const lit = isLit(lineNumber);
                const dimmed = settings.dimOthers && hasHighlight && !lit;
                return (
                  <div
                    key={index}
                    className="codecard-line flex"
                    style={{
                      background: lit ? theme.highlight : undefined,
                      boxShadow: lit ? `inset 3px 0 0 0 ${theme.accent}` : undefined,
                      opacity: dimmed && !showPlain ? 0.34 : 1,
                    }}
                  >
                    {settings.showLineNumbers && (
                      <button
                        type="button"
                        tabIndex={interactive ? 0 : -1}
                        aria-hidden={!interactive}
                        onClick={
                          interactive
                            ? event => {
                                event.stopPropagation();
                                onLineClick(lineNumber, {
                                  shift: event.shiftKey,
                                  invert: event.altKey,
                                });
                              }
                            : undefined
                        }
                        onContextMenu={
                          interactive
                            ? event => {
                                event.preventDefault();
                                onClearHighlights();
                              }
                            : undefined
                        }
                        className={`codecard-gutter-btn shrink-0 text-right pl-4 pr-3 tabular-nums bg-transparent border-0 ${
                          interactive ? 'cursor-pointer hover:brightness-150' : ''
                        }`}
                        style={{
                          width: `calc(${gutterWidth} + 1.75rem)`,
                          color: lit ? theme.accent : theme.gutter,
                          font: 'inherit',
                          lineHeight: 'inherit',
                        }}
                      >
                        {lineNumber}
                      </button>
                    )}
                    <span
                      className="codecard-line-code px-4"
                      style={{
                        whiteSpace: settings.wordWrap ? 'pre-wrap' : 'pre',
                        wordBreak: settings.wordWrap ? 'break-word' : undefined,
                        // Sangría colgante: una línea envuelta se alinea con el
                        // código, no con el margen.
                        textIndent: settings.wordWrap ? '-2ch' : undefined,
                        paddingLeft: settings.wordWrap ? 'calc(1rem + 2ch)' : undefined,
                        flex: settings.wordWrap ? '1 1 auto' : '0 0 auto',
                        minWidth: 0,
                      }}
                    >
                      {spans.length === 0 ? (
                        '​'
                      ) : showPlain ? (
                        spans.map(s => s.t).join('')
                      ) : (
                        spans.map((span, spanIndex) => (
                          <span key={spanIndex} className={span.c || undefined}>
                            {span.t}
                          </span>
                        ))
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {settings.showWatermark && (
            <div
              className="absolute bottom-2.5 right-4 flex items-center gap-1 text-[9px] font-bold tracking-wide"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" fill="currentColor" aria-hidden="true">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span>oLoveTools.com</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardCanvas;
