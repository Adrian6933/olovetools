// ============================================================================
// Grabar el canvas con la mejor calidad que deje el navegador
// ----------------------------------------------------------------------------
// La marca de agua, el vídeo unido y el editor graban un canvas con
// MediaRecorder, y eso RECODIFICA: cada exportación pierde algo respecto al
// clip original. Medido con un clip de Twitch (1080p60, H.264 Main, 3,7 Mbps)
// y SSIM contra el original, lo que más pesaba era:
//
//   - El perfil: sin pedirlo, Chrome graba H.264 "Constrained Baseline", el
//     más pobre. High (avc1.64…) da más calidad con los mismos bits.
//   - El ritmo: el canvas se pintaba con setInterval a 60 Hz, que no va
//     sincronizado con los fotogramas del vídeo. A 60 fps unos salían dos
//     veces y otros nunca (337 distintos de 360 en 6 s): tirones. Con
//     requestVideoFrameCallback se pinta cada fotograma justo cuando sale.
//
// requestVideoFrameCallback no llega con la pestaña oculta (ver
// pestana-oculta-sin-fotogramas), así que si deja de llegar se vuelve a
// pintar con el reloj, como antes: peor ritmo, pero el vídeo no sale negro.
// ============================================================================

/** El formato más fiel que acepte este navegador, del mejor al peor. */
export const formatoDeGrabacion = (): string => {
  const candidatos = [
    'video/mp4;codecs=avc1.64002A,mp4a.40.2', // H.264 High 4.2: llega a 1080p60
    'video/mp4;codecs=avc1.640028,mp4a.40.2', // High 4.0
    'video/mp4;codecs=avc1.4D402A,mp4a.40.2', // Main
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2', // Baseline
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
  ];
  return candidatos.find(c => MediaRecorder.isTypeSupported(c)) || '';
};

/**
 * Bits por segundo para un alto dado. Holgado a propósito: el original ya
 * viene comprimido y recomprimirlo justo es lo que se nota como "menos
 * nítido". Pensado para 60 fps, que es como vienen casi todos los clips.
 */
export const bitrateDeGrabacion = (alto: number) =>
  alto >= 1440 ? 28_000_000 : alto >= 1080 ? 16_000_000 : alto >= 720 ? 9_000_000 : alto >= 480 ? 5_000_000 : 3_000_000;

/** Que el escalado (720 a 1080, vertical en 16:9…) no salga pixelado. */
export const suavizar = (ctx: CanvasRenderingContext2D) => {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
};

/**
 * Llama a `pintar` una vez por cada fotograma que presenta el vídeo. Si
 * requestVideoFrameCallback no existe o deja de llegar (pestaña oculta), pinta
 * con el reloj cada `1000/60` ms. Devuelve la función para pararlo.
 */
export const alPresentarFotograma = (v: HTMLVideoElement, pintar: () => void): (() => void) => {
  let vivo = true;
  // Al arrancar se da margen al primer fotograma antes de pintar a mano.
  let ultimo = performance.now();
  let idRvfc: number | null = null;
  const conRvfc = typeof (v as any).requestVideoFrameCallback === 'function';
  const pedir = () => {
    if (!vivo || !conRvfc) return;
    idRvfc = (v as any).requestVideoFrameCallback(() => {
      if (!vivo) return;
      ultimo = performance.now();
      pintar();
      pedir();
    });
  };
  pedir();
  const reloj = setInterval(() => {
    if (!vivo) return;
    // Sin fotogramas del vídeo hace un rato: se pinta a mano.
    if (performance.now() - ultimo > 120) pintar();
  }, 1000 / 60);
  return () => {
    vivo = false;
    clearInterval(reloj);
    if (idRvfc !== null && conRvfc) try { (v as any).cancelVideoFrameCallback(idRvfc); } catch { /* ya no está */ }
  };
};
