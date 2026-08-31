// ============================================================================
// WatermarkSnap — motor de composición
// ----------------------------------------------------------------------------
// Toma una imagen fuente y una lista de capas y las pinta. Nada aquí toca React
// ni el DOM: el mismo código sirve para el preview (un canvas del tamaño del
// visor, con una transformación de zoom/pan aplicada) y para la exportación
// (un OffscreenCanvas a resolución completa). Esa es toda la gracia: una sola
// implementación, así que lo que ves es exactamente lo que se descarga.
//
// Dos decisiones que valen la pena explicar:
//
//  1. Todas las medidas de una capa son PORCENTAJES del ancho de la imagen (o
//     del lado corto, para los márgenes). Por eso un mismo ajuste se ve igual
//     en una foto de 800 px y en una de 6000 px, que es lo que se espera de una
//     herramienta de lote.
//
//  2. El mosaico se pinta con `createPattern` + UN `fillRect`, no con un doble
//     bucle de `fillText`. La versión anterior hacía decenas de miles de
//     llamadas de dibujo por redibujo y, además, rotaba cada instancia sobre sí
//     misma dejando la rejilla recta; rotando el contexto entero la rejilla
//     entera gira, que es el patrón diagonal que la gente espera.
// ============================================================================

import type { Anchor, Layer, LogoAsset, TextLayer } from '../types';

/** Contexto 2D de cualquiera de los dos tipos de canvas. */
export type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export interface RenderStats {
  /** Llamadas de dibujo emitidas. Sirve para demostrar la mejora del mosaico. */
  drawCalls: number;
  /** Milisegundos de la composición. */
  ms: number;
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

const RAD = Math.PI / 180;

/** `letterSpacing` existe en Chrome 99+/Safari 17+; en el resto se ignora sin romper. */
const SUPPORTS_LETTER_SPACING = (() => {
  if (typeof document === 'undefined') return false;
  try {
    return 'letterSpacing' in document.createElement('canvas').getContext('2d')!;
  } catch {
    return false;
  }
})();

function createSurface(w: number, h: number): { canvas: any; ctx: Ctx2D } {
  const width = Math.max(1, Math.ceil(w));
  const height = Math.max(1, Math.ceil(h));
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(width, height);
    return { canvas, ctx: canvas.getContext('2d') as OffscreenCanvasRenderingContext2D };
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return { canvas, ctx: canvas.getContext('2d') as CanvasRenderingContext2D };
}

/** `soft-light`/`luminosity` etc. usan el nombre tal cual; `normal` es `source-over`. */
function compositeFor(blend: Layer['blend']): GlobalCompositeOperation {
  return blend === 'normal' ? 'source-over' : (blend as GlobalCompositeOperation);
}

export function fontShorthand(layer: TextLayer, sizePx: number): string {
  const style = layer.italic ? 'italic ' : '';
  return `${style}${layer.fontWeight} ${sizePx}px ${layer.fontFamily}`;
}

/**
 * Las fuentes de Google (Outfit, Jakarta) se cargan con `display=swap`, así que
 * el canvas puede pintarlas como Arial si dibujas antes de que lleguen — en
 * silencio, sin ningún error. Esto espera a que estén rasterizadas.
 */
export async function ensureFonts(layers: Layer[]): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  const jobs: Promise<unknown>[] = [];
  for (const layer of layers) {
    if (layer.kind !== 'text') continue;
    try {
      jobs.push(document.fonts.load(fontShorthand(layer, 64), layer.text || 'A'));
    } catch {
      /* familia inválida: el canvas ya cae a sans-serif por su cuenta */
    }
  }
  await Promise.all(jobs).catch(() => undefined);
}

// ---------------------------------------------------------------------------
// Medidas del motivo
// ---------------------------------------------------------------------------

export interface UnitSize {
  width: number;
  height: number;
  /** Distancia del centro del motivo a su línea base, para posicionar el texto. */
  baselineOffset: number;
}

/**
 * Tamaño del motivo de una capa en píxeles de imagen. `imageWidth` es la base
 * de todas las escalas relativas.
 */
export function measureLayer(
  ctx: Ctx2D,
  layer: Layer,
  imageWidth: number,
  assets: Map<string, LogoAsset>
): UnitSize | null {
  if (layer.kind === 'logo') {
    const asset = assets.get(layer.assetId);
    if (!asset || !asset.width || !asset.height) return null;
    const width = (layer.scale / 100) * imageWidth;
    return { width, height: (width / asset.width) * asset.height, baselineOffset: 0 };
  }

  const text = layer.text;
  if (!text) return null;

  const fontPx = (layer.scale / 100) * imageWidth;
  if (fontPx < 0.5) return null;

  ctx.save();
  applyTextFont(ctx, layer, fontPx);
  const m = ctx.measureText(text);
  ctx.restore();

  // `actualBoundingBox*` da la caja real de los glifos (con tildes y descendentes),
  // no la caja em teórica: es lo que hace que la placa de fondo quede ajustada.
  const ascent = m.actualBoundingBoxAscent || fontPx * 0.75;
  const descent = m.actualBoundingBoxDescent || fontPx * 0.25;
  const width = m.width || fontPx * text.length * 0.5;
  const height = ascent + descent;

  return { width, height, baselineOffset: (ascent - descent) / 2 };
}

function applyTextFont(ctx: Ctx2D, layer: TextLayer, fontPx: number) {
  ctx.font = fontShorthand(layer, fontPx);
  if (SUPPORTS_LETTER_SPACING) {
    (ctx as CanvasRenderingContext2D).letterSpacing = `${(layer.letterSpacing / 100) * fontPx}px`;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
}

function roundRectPath(ctx: Ctx2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// ---------------------------------------------------------------------------
// Dibujo de un motivo, centrado en (0, 0) del contexto actual
// ---------------------------------------------------------------------------

function drawUnit(
  ctx: Ctx2D,
  layer: Layer,
  imageWidth: number,
  size: UnitSize,
  assets: Map<string, LogoAsset>
): number {
  if (layer.kind === 'logo') {
    const asset = assets.get(layer.assetId);
    if (!asset) return 0;
    ctx.drawImage(asset.bitmap, -size.width / 2, -size.height / 2, size.width, size.height);
    return 1;
  }

  const fontPx = (layer.scale / 100) * imageWidth;
  let calls = 0;

  applyTextFont(ctx, layer, fontPx);
  const baseline = size.baselineOffset;

  if (layer.plate.enabled) {
    const padX = (layer.plate.padX / 100) * fontPx;
    const padY = (layer.plate.padY / 100) * fontPx;
    const w = size.width + padX * 2;
    const h = size.height + padY * 2;
    ctx.fillStyle = layer.plate.color;
    roundRectPath(ctx, -w / 2, -h / 2, w, h, (layer.plate.radius / 100) * h);
    ctx.fill();
    calls++;
  }

  if (layer.shadow.enabled) {
    ctx.shadowColor = layer.shadow.color;
    ctx.shadowBlur = (layer.shadow.blur / 100) * fontPx;
    ctx.shadowOffsetX = (layer.shadow.offset / 100) * fontPx;
    ctx.shadowOffsetY = (layer.shadow.offset / 100) * fontPx;
  }

  if (layer.stroke.enabled && layer.stroke.width > 0) {
    ctx.lineWidth = (layer.stroke.width / 100) * fontPx;
    ctx.strokeStyle = layer.stroke.color;
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.strokeText(layer.text, 0, baseline);
    calls++;
    // La sombra ya la ha puesto el contorno; repetirla en el relleno la
    // duplicaría y ensuciaría los bordes.
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  ctx.fillStyle = layer.color;
  ctx.fillText(layer.text, 0, baseline);
  calls++;

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  return calls;
}

// ---------------------------------------------------------------------------
// Colocación
// ---------------------------------------------------------------------------

/** Centro del motivo, en píxeles de imagen, para una capa anclada o libre. */
export function layerCenter(
  layer: Layer,
  imageWidth: number,
  imageHeight: number,
  size: UnitSize
): { x: number; y: number } {
  if (layer.placement === 'free') {
    return { x: layer.pos.x * imageWidth, y: layer.pos.y * imageHeight };
  }

  const margin = (layer.margin / 100) * Math.min(imageWidth, imageHeight);
  // El motivo se gira sobre su centro, así que la caja que hay que mantener
  // dentro del margen es la del rectángulo rotado, no la del original.
  const rad = layer.rotation * RAD;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const halfW = (size.width * cos + size.height * sin) / 2;
  const halfH = (size.width * sin + size.height * cos) / 2;

  const anchor: Anchor = layer.anchor;
  const left = margin + halfW;
  const right = imageWidth - margin - halfW;
  const top = margin + halfH;
  const bottom = imageHeight - margin - halfH;

  const x = anchor.endsWith('left') ? left : anchor.endsWith('right') ? right : imageWidth / 2;
  const y = anchor.startsWith('top') ? top : anchor.startsWith('bottom') ? bottom : imageHeight / 2;

  return { x, y };
}

/**
 * Caja envolvente del motivo en píxeles de imagen (ya rotada). La usa el editor
 * para saber si el ratón ha pinchado encima de la marca de agua.
 */
export function layerBounds(
  ctx: Ctx2D,
  layer: Layer,
  imageWidth: number,
  imageHeight: number,
  assets: Map<string, LogoAsset>
): { x: number; y: number; width: number; height: number } | null {
  if (layer.placement === 'tile') return null;
  const size = measureLayer(ctx, layer, imageWidth, assets);
  if (!size) return null;
  const center = layerCenter(layer, imageWidth, imageHeight, size);
  const rad = layer.rotation * RAD;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const w = size.width * cos + size.height * sin;
  const h = size.width * sin + size.height * cos;
  return { x: center.x - w / 2, y: center.y - h / 2, width: w, height: h };
}

// ---------------------------------------------------------------------------
// Mosaico
// ---------------------------------------------------------------------------

/**
 * Construye la celda del patrón: el motivo, ya rotado sobre sí mismo, con su
 * hueco alrededor. Con `stagger` la celda mide dos filas de alto y la segunda
 * va desplazada media celda (hay que pintarla tres veces para que el borde
 * quede continuo al repetirse).
 */
function buildTileCell(
  layer: Layer,
  imageWidth: number,
  size: UnitSize,
  assets: Map<string, LogoAsset>
): { canvas: any; calls: number } | null {
  const rad = layer.rotation * RAD;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  // Caja del motivo ya girado, más un pelín de aire para que la sombra o el
  // contorno no queden cortados por el borde de la celda.
  const bleed = layer.kind === 'text' && (layer.shadow.enabled || layer.stroke.enabled)
    ? (layer.scale / 100) * imageWidth * 0.5
    : 2;
  const motifW = size.width * cos + size.height * sin + bleed;
  const motifH = size.width * sin + size.height * cos + bleed;

  const cellW = Math.max(2, motifW * (1 + layer.tile.gapX / 100));
  const rowH = Math.max(2, motifH * (1 + layer.tile.gapY / 100));
  const cellH = layer.tile.stagger ? rowH * 2 : rowH;

  // Un patrón desmesurado (motivo diminuto sobre una imagen enorme) se traduce
  // en una celda ridícula repetida millones de veces: el navegador lo aguanta,
  // pero no tiene sentido bajar de 2 px.
  if (cellW < 2 || cellH < 2) return null;

  const { canvas, ctx } = createSurface(cellW, cellH);
  let calls = 0;

  const paint = (cx: number, cy: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rad);
    calls += drawUnit(ctx, layer, imageWidth, size, assets);
    ctx.restore();
  };

  if (layer.tile.stagger) {
    paint(cellW / 2, rowH / 2);
    paint(0, rowH * 1.5);
    paint(cellW, rowH * 1.5);
  } else {
    paint(cellW / 2, rowH / 2);
  }

  return { canvas, calls };
}

// ---------------------------------------------------------------------------
// Composición completa
// ---------------------------------------------------------------------------

export interface RenderOptions {
  /** Capa que se está arrastrando; se le pinta un contorno de selección. */
  highlightLayerId?: string | null;
  /** Escala de pantalla, para que el contorno de selección tenga 1 px reales. */
  screenScale?: number;
  /** Oculta todas las capas: sirve para el "comparar antes/después". */
  bypass?: boolean;
}

/**
 * Pinta la imagen y sus capas en el contexto dado, en el espacio de coordenadas
 * de la imagen (0,0)-(width,height). Quien llama decide la transformación: el
 * preview aplica zoom/pan antes de llamar, la exportación no aplica ninguna.
 */
export function renderComposite(
  ctx: Ctx2D,
  source: CanvasImageSource,
  width: number,
  height: number,
  layers: Layer[],
  assets: Map<string, LogoAsset>,
  options: RenderOptions = {}
): RenderStats {
  const started = typeof performance !== 'undefined' ? performance.now() : 0;
  let drawCalls = 0;

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, width, height);
  drawCalls++;
  ctx.restore();

  if (!options.bypass) {
    for (const layer of layers) {
      if (!layer.visible || layer.opacity <= 0) continue;

      const size = measureLayer(ctx, layer, width, assets);
      if (!size || size.width <= 0 || size.height <= 0) continue;

      ctx.save();
      ctx.globalAlpha = layer.opacity;
      ctx.globalCompositeOperation = compositeFor(layer.blend);

      if (layer.placement === 'tile') {
        const cell = buildTileCell(layer, width, size, assets);
        if (cell) {
          const pattern = ctx.createPattern(cell.canvas as CanvasImageSource, 'repeat');
          if (pattern) {
            // Un único fillRect cubre la imagen entera. Girando el contexto gira
            // la rejilla completa, no cada instancia por separado.
            const rad = layer.tile.angle * RAD;
            const diag = Math.hypot(width, height);
            ctx.translate(width / 2, height / 2);
            ctx.rotate(rad);
            ctx.fillStyle = pattern;
            ctx.fillRect(-diag, -diag, diag * 2, diag * 2);
            drawCalls += 1;
          }
        }
      } else {
        const center = layerCenter(layer, width, height, size);
        ctx.translate(center.x, center.y);
        ctx.rotate(layer.rotation * RAD);
        drawCalls += drawUnit(ctx, layer, width, size, assets);
      }

      ctx.restore();
    }
  }

  // Contorno de selección: fuera del bucle para que ningún blend mode lo afecte.
  if (options.highlightLayerId && !options.bypass) {
    const layer = layers.find(l => l.id === options.highlightLayerId);
    if (layer && layer.visible && layer.placement !== 'tile') {
      const box = layerBounds(ctx, layer, width, height, assets);
      if (box) {
        const px = 1 / (options.screenScale || 1);
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.setLineDash([6 * px, 5 * px]);
        ctx.lineWidth = 1.5 * px;
        ctx.strokeStyle = '#f59e0b';
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        ctx.restore();
      }
    }
  }

  return {
    drawCalls,
    ms: (typeof performance !== 'undefined' ? performance.now() : 0) - started,
  };
}

// ---------------------------------------------------------------------------
// Render a bitmap para exportar
// ---------------------------------------------------------------------------

/**
 * Compone a resolución final y devuelve un ImageBitmap transferible. El encode
 * (que es lo que de verdad congela la interfaz: medio segundo por PNG de 12 MP)
 * lo hace el worker con este bitmap.
 */
export function renderToBitmap(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  layers: Layer[],
  assets: Map<string, LogoAsset>,
  maxSize: number
): { bitmap: ImageBitmap; width: number; height: number } | null {
  let width = sourceWidth;
  let height = sourceHeight;
  if (maxSize > 0 && Math.max(width, height) > maxSize) {
    const ratio = maxSize / Math.max(width, height);
    width = Math.max(1, Math.round(width * ratio));
    height = Math.max(1, Math.round(height * ratio));
  }

  const { canvas, ctx } = createSurface(width, height);
  renderComposite(ctx, source, width, height, layers, assets);

  if (typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas) {
    return { bitmap: canvas.transferToImageBitmap(), width, height };
  }
  return null;
}
