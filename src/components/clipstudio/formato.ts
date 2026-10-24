// ============================================================================
// Formato de salida: tal cual, horizontal (16:9) o vertical (9:16)
// ----------------------------------------------------------------------------
// Los clips llegan en 16:9; para el móvil (TikTok, Shorts, Reels) se quieren
// en vertical. Se elige por separado para el vídeo unido y para los clips
// sueltos, y por defecto todo sale como el clip original.
//
// Al pasar de horizontal a vertical sobra imagen por los lados, y hay dos
// maneras de llenar el hueco:
//   - recortar: el centro del clip ocupa toda la pantalla (lo de los lados se
//     pierde: si la cámara del streamer va en una esquina, no sale).
//   - difuminar: el clip entero en medio y, detrás, él mismo ampliado y
//     desenfocado en vez de franjas negras. No se pierde nada.
// ============================================================================

export type Formato = 'original' | '16:9' | '9:16';
export type Encaje = 'recortar' | 'difuminar';

export const FORMATOS: Formato[] = ['original', '16:9', '9:16'];

/** Para el nombre del archivo: "_vertical", "_16x9" o nada. */
export const sufijoFormato = (f: Formato) => (f === '9:16' ? '_vertical' : f === '16:9' ? '_16x9' : '');

const par = (n: number) => Math.max(2, Math.round(n / 2) * 2);

/**
 * Medidas de salida. `base` es el lado corto que se quiere (1080, 1440...);
 * sin ella, el del clip. En vertical el lado corto es el ancho: 1080x1920.
 */
export const medidasDe = (formato: Formato, ancho: number, alto: number, base?: number) => {
  const corto = base ?? Math.min(ancho, alto);
  if (formato === '16:9') return { width: par((corto * 16) / 9), height: par(corto) };
  if (formato === '9:16') return { width: par(corto), height: par((corto * 16) / 9) };
  const k = base ? base / Math.min(ancho, alto) : 1;
  return { width: par(ancho * k), height: par(alto * k) };
};

/**
 * Devuelve la función que pinta una imagen o fotograma (w x h) en el lienzo
 * de W x H según el encaje. Lo que sobra queda en negro (el que llama lo
 * pinta antes) salvo con `difuminar`.
 */
export const crearEncaje = (ctx: CanvasRenderingContext2D, W: number, H: number, encaje: Encaje = 'difuminar') => {
  // El fondo se pinta en pequeño y se amplía: el propio escalado ya lo
  // desenfoca, y cuesta casi nada por fotograma (ctx.filter = blur a 1080x1920
  // en cada uno sí se notaba).
  let fondo: CanvasRenderingContext2D | null = null;
  if (encaje === 'difuminar') {
    const c = document.createElement('canvas');
    c.width = Math.max(2, Math.round(W / 16));
    c.height = Math.max(2, Math.round(H / 16));
    fondo = c.getContext('2d');
    if (fondo) { fondo.imageSmoothingEnabled = true; fondo.imageSmoothingQuality = 'low'; }
  }
  return (src: CanvasImageSource, w: number, h: number) => {
    const contener = Math.min(W / w, H / h);
    const cubrir = Math.max(W / w, H / h);
    // Misma forma (16:9 sobre 16:9): no hay hueco que llenar.
    const mismaForma = Math.abs(contener - cubrir) / cubrir < 0.01;
    if (encaje === 'recortar' || mismaForma) {
      const k = encaje === 'recortar' ? cubrir : contener;
      ctx.drawImage(src, (W - w * k) / 2, (H - h * k) / 2, w * k, h * k);
      return;
    }
    if (fondo) {
      const fw = fondo.canvas.width;
      const fh = fondo.canvas.height;
      const kf = Math.max(fw / w, fh / h);
      fondo.drawImage(src, (fw - w * kf) / 2, (fh - h * kf) / 2, w * kf, h * kf);
      ctx.drawImage(fondo.canvas, 0, 0, W, H);
      // Más oscuro, para que el clip de delante destaque.
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, 0, W, H);
    }
    ctx.drawImage(src, (W - w * contener) / 2, (H - h * contener) / 2, w * contener, h * contener);
  };
};
