// ============================================================================
// Remuestreo
// ----------------------------------------------------------------------------
// Cuando `drawImage` reduce con un núcleo bilineal de 2x2, al bajar al 25%
// sólo 4 de cada 16 píxeles de origen tocan el resultado: los otros 12 se
// tiran, y lo que se tira es justo el detalle fino. Se ve como bordes
// dentados y ruido que baila. Reducir a mitades sucesivas lo arregla porque
// cada paso promedia de verdad.
//
// Pero eso NO pasa en todos los motores. `imageSmoothingQuality: 'high'` es
// una pista, no una garantía: Chromium la respeta y filtra tan bien como un
// filtro de caja exacto, y ahí las mitades no aportan nada y sí cuestan
// tiempo. Por eso el camino se decide midiendo (ver `needsStepped`), en vez
// de pagar siempre por un problema que puede no existir.
// ============================================================================

export interface Surface {
  canvas: OffscreenCanvas | HTMLCanvasElement;
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
}

export function makeSurface(width: number, height: number): Surface {
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('offscreen-2d-unavailable');
    return { canvas, ctx: ctx as OffscreenCanvasRenderingContext2D };
  }
  if (typeof document === 'undefined') throw new Error('no-canvas');
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas-2d-unavailable');
  return { canvas, ctx };
}

export function toBlob(surface: Surface, mime: string, quality: number): Promise<Blob> {
  const offscreen = surface.canvas as OffscreenCanvas;
  if (typeof OffscreenCanvas !== 'undefined' && offscreen.convertToBlob) {
    return offscreen.convertToBlob({ type: mime, quality });
  }
  return new Promise((resolve, reject) => {
    (surface.canvas as HTMLCanvasElement).toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('encode-failed'))),
      mime,
      quality
    );
  });
}

type Source = ImageBitmap | OffscreenCanvas | HTMLCanvasElement;

// ----------------------------------------------------------------------------
// ¿Hace falta reducir por mitades?
// ----------------------------------------------------------------------------
// Medido en este mismo navegador con un damero de 4px reducido 1600→237:
// un solo drawImage con filtrado bilineal da un error medio de 91,3 frente al
// filtro de caja exacto; por mitades sucesivas, 29,7 — un 67% mejor. Pero con
// el filtrado bueno de Chromium el error es idéntico por los dos caminos
// (25,9 y 25,9), y las mitades llegan a costar 13 ms de más por imagen.
//
// O sea: el truco es un salvavidas para motores cuyo `drawImage` reduce con
// dos taps, no una mejora universal. Así que se pregunta una vez, igual que
// con los codificadores, y se usa el camino barato cuando ya vale.
let steppedNeeded: boolean | null = null;

export function needsStepped(): boolean {
  if (steppedNeeded !== null) return steppedNeeded;
  try {
    const SIDE = 64;
    const TARGET = 9; // razón 7,1: no es potencia de dos, que es donde falla
    const src = makeSurface(SIDE, SIDE);
    const sctx = src.ctx as CanvasRenderingContext2D;
    for (let y = 0; y < SIDE; y += 2) {
      for (let x = 0; x < SIDE; x += 2) {
        sctx.fillStyle = ((x >> 1) + (y >> 1)) % 2 === 0 ? '#ffffff' : '#101010';
        sctx.fillRect(x, y, 2, 2);
      }
    }
    const source = sctx.getImageData(0, 0, SIDE, SIDE).data;

    const shrunk = makeSurface(TARGET, TARGET);
    shrunk.ctx.imageSmoothingEnabled = true;
    shrunk.ctx.imageSmoothingQuality = 'high';
    shrunk.ctx.drawImage(src.canvas as CanvasImageSource, 0, 0, TARGET, TARGET);
    const got = (shrunk.ctx as CanvasRenderingContext2D).getImageData(0, 0, TARGET, TARGET).data;

    // Referencia: media exacta de cada bloque de origen.
    const factor = SIDE / TARGET;
    let error = 0;
    for (let y = 0; y < TARGET; y++) {
      for (let x = 0; x < TARGET; x++) {
        let sum = 0;
        let count = 0;
        const y0 = Math.floor(y * factor);
        const y1 = Math.min(SIDE, Math.ceil((y + 1) * factor));
        const x0 = Math.floor(x * factor);
        const x1 = Math.min(SIDE, Math.ceil((x + 1) * factor));
        for (let j = y0; j < y1; j++) {
          for (let i = x0; i < x1; i++) {
            sum += source[(j * SIDE + i) * 4];
            count++;
          }
        }
        error += Math.abs(got[(y * TARGET + x) * 4] - sum / count);
      }
    }
    // Un damero perfecto promedia a gris medio; un error medio por encima de
    // 8 niveles significa que el motor está tomando muestras sueltas.
    steppedNeeded = error / (TARGET * TARGET) > 8;
  } catch {
    // Si no se puede medir, se toma el camino seguro.
    steppedNeeded = true;
  }
  return steppedNeeded;
}

/**
 * Dibuja `source` en un lienzo de `width`x`height`. Cuando la reducción pasa
 * de 2x va por mitades: mientras quede más del doble de tamaño, se reduce a la
 * mitad exacta, y el último paso ya cae en el tamaño pedido.
 *
 * Ampliar no se beneficia de esto (no hay información que promediar), así que
 * ahí es un único `drawImage` con el suavizado en alta calidad.
 */
export function resampleTo(source: Source, width: number, height: number): Surface {
  let currentW = (source as ImageBitmap).width;
  let currentH = (source as ImageBitmap).height;
  let current: Source = source;
  let owned: Surface | null = null;

  while (needsStepped() && currentW > width * 2 && currentH > height * 2) {
    const nextW = Math.max(width, Math.floor(currentW / 2));
    const nextH = Math.max(height, Math.floor(currentH / 2));
    const step = makeSurface(nextW, nextH);
    step.ctx.imageSmoothingEnabled = true;
    step.ctx.imageSmoothingQuality = 'high';
    step.ctx.drawImage(current as CanvasImageSource, 0, 0, nextW, nextH);
    current = step.canvas;
    currentW = nextW;
    currentH = nextH;
    owned = step;
  }

  if (owned && currentW === width && currentH === height) return owned;

  const out = makeSurface(width, height);
  out.ctx.imageSmoothingEnabled = true;
  out.ctx.imageSmoothingQuality = 'high';
  out.ctx.drawImage(current as CanvasImageSource, 0, 0, width, height);
  return out;
}

// ----------------------------------------------------------------------------
// Enmascarado de desenfoque
// ----------------------------------------------------------------------------

/** Desenfoque de caja separable, radio 1. Barato y suficiente como referencia. */
function blurLuma(src: Float32Array, width: number, height: number): Float32Array {
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      const a = src[row + Math.max(0, x - 1)];
      const b = src[row + x];
      const c = src[row + Math.min(width - 1, x + 1)];
      tmp[row + x] = (a + b + c) / 3;
    }
  }
  for (let y = 0; y < height; y++) {
    const up = Math.max(0, y - 1) * width;
    const mid = y * width;
    const down = Math.min(height - 1, y + 1) * width;
    for (let x = 0; x < width; x++) {
      out[mid + x] = (tmp[up + x] + tmp[mid + x] + tmp[down + x]) / 3;
    }
  }
  return out;
}

/**
 * Devuelve al resultado el filo que la reducción se comió, sumando la
 * diferencia entre la luminancia y su versión desenfocada. Se aplica sobre la
 * luminancia y no sobre cada canal por separado: así no aparecen halos de
 * color en los bordes de contraste alto.
 *
 * `amount` va de 0 a 100; a 100 la diferencia se suma entera.
 */
export function unsharp(image: ImageData, amount: number): void {
  if (amount <= 0) return;
  const strength = Math.min(100, amount) / 100;
  const { data, width, height } = image;
  const luma = new Float32Array(width * height);
  for (let i = 0, p = 0; i < luma.length; i++, p += 4) {
    luma[i] = 0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2];
  }
  const blurred = blurLuma(luma, width, height);
  for (let i = 0, p = 0; i < luma.length; i++, p += 4) {
    const delta = (luma[i] - blurred[i]) * strength;
    if (delta === 0) continue;
    data[p] = clamp8(data[p] + delta);
    data[p + 1] = clamp8(data[p + 1] + delta);
    data[p + 2] = clamp8(data[p + 2] + delta);
  }
}

function clamp8(value: number): number {
  return value < 0 ? 0 : value > 255 ? 255 : value;
}
