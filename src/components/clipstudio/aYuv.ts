// ============================================================================
// Del lienzo (RGB) a YUV con el color de los clips de Twitch
// ----------------------------------------------------------------------------
// Si se le da el lienzo al codificador tal cual, Chrome lo pasa a YUV de rango
// completo y lo etiqueta como sRGB (yuvj420p, iec61966-2-1). Los clips de
// Twitch son BT.709 de rango limitado, y cada reproductor trata ese cambio a su
// manera: más contraste, negros aplastados, colores algo distintos. Aquí se
// convierte a mano a BT.709 limitado (I420), el mismo color que el original.
// ============================================================================
import { VideoSample } from 'mediabunny';

/** BT.709 de rango limitado: lo que traen los clips. */
export const COLOR_BT709 = { primaries: 'bt709', transfer: 'bt709', matrix: 'bt709', fullRange: false } as const;

/** Convierte el contenido del lienzo en un fotograma I420 BT.709 limitado. */
export const lienzoAMuestra = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timestamp: number,
  duration: number,
): VideoSample => {
  const rgba = ctx.getImageData(0, 0, width, height).data;
  const tamY = width * height;
  const anchoC = width / 2;
  const tamC = anchoC * (height / 2);
  const datos = new Uint8Array(tamY + tamC * 2);
  const u0 = tamY;
  const v0 = tamY + tamC;

  for (let fila = 0; fila < height; fila += 2) {
    for (let col = 0; col < width; col += 2) {
      const a = (fila * width + col) * 4;
      const b = a + 4;
      const c = a + width * 4;
      const d = c + 4;
      const yA = fila * width + col;
      const yC = yA + width;
      // Luma de cada píxel; Y = 16 + 219/255 · (0,2126 R + 0,7152 G + 0,0722 B).
      datos[yA] = 16.5 + 0.182586 * rgba[a] + 0.614231 * rgba[a + 1] + 0.062007 * rgba[a + 2];
      datos[yA + 1] = 16.5 + 0.182586 * rgba[b] + 0.614231 * rgba[b + 1] + 0.062007 * rgba[b + 2];
      datos[yC] = 16.5 + 0.182586 * rgba[c] + 0.614231 * rgba[c + 1] + 0.062007 * rgba[c + 2];
      datos[yC + 1] = 16.5 + 0.182586 * rgba[d] + 0.614231 * rgba[d + 1] + 0.062007 * rgba[d + 2];
      // Croma de la media de los cuatro (4:2:0).
      const r = (rgba[a] + rgba[b] + rgba[c] + rgba[d]) / 4;
      const g = (rgba[a + 1] + rgba[b + 1] + rgba[c + 1] + rgba[d + 1]) / 4;
      const bl = (rgba[a + 2] + rgba[b + 2] + rgba[c + 2] + rgba[d + 2]) / 4;
      const iC = (fila / 2) * anchoC + col / 2;
      datos[u0 + iC] = 128.5 - 0.100644 * r - 0.338572 * g + 0.439216 * bl;
      datos[v0 + iC] = 128.5 + 0.439216 * r - 0.398942 * g - 0.040274 * bl;
    }
  }

  return new VideoSample(datos, {
    format: 'I420', codedWidth: width, codedHeight: height, timestamp, duration, colorSpace: COLOR_BT709,
  });
};
