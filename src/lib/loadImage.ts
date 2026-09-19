/**
 * Carga una imagen y resuelve cuando ya se puede dibujar.
 *
 * No usa `await img.decode()` a secas: en Chromium esa promesa no se resuelve
 * mientras la pestaña esta oculta, asi que si alguien soltaba una foto y se
 * iba a otra pestaña, la herramienta se quedaba en "Leyendo la imagen…" hasta
 * que volvia. El evento `load` si llega en segundo plano. Despues se intenta
 * `decode()` (evita un tirón al pintar), pero con un tope de espera.
 */
export function loadImage(src: string, opts: { crossOrigin?: string; decodeTimeoutMs?: number } = {}): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    if (opts.crossOrigin) image.crossOrigin = opts.crossOrigin;
    image.onload = () => {
      const timeout = new Promise<void>(done => setTimeout(done, opts.decodeTimeoutMs ?? 300));
      Promise.race([image.decode().catch(() => undefined), timeout]).then(() => resolve(image));
    };
    image.onerror = () => reject(new Error('image-load'));
    image.src = src;
  });
}
