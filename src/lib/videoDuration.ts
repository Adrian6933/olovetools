/**
 * Duración real de un vídeo ya con metadatos cargados.
 *
 * Los WebM que graba MediaRecorder (los de RecordSnap, muchas grabaciones de
 * pantalla) no llevan la duración en la cabecera: `video.duration` vale
 * `Infinity` hasta que el navegador llega al final. Con eso FrameSnap lanzaba
 * un lote de 500 capturas sobre un vídeo de 2 s, FrameBolt lo daba por de 0 s
 * y GIF Bolt lo rechazaba como si estuviera roto.
 *
 * El truco de siempre: saltar muy lejos obliga a leer el final, y entonces
 * `durationchange` trae el valor bueno. Saltar funciona también con la pestaña
 * oculta (reproducir no). Se vuelve al principio al terminar.
 */
export function resolveVideoDuration(video: HTMLVideoElement, timeoutMs = 4000): Promise<number> {
  if (Number.isFinite(video.duration) && video.duration > 0) return Promise.resolve(video.duration);
  return new Promise(resolve => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      video.removeEventListener('durationchange', check);
      video.removeEventListener('timeupdate', check);
      video.removeEventListener('seeked', check);
      clearTimeout(timer);
      const d = Number.isFinite(video.duration) ? video.duration : 0;
      try {
        video.currentTime = 0;
      } catch {
        /* sin fuente: nada que rebobinar */
      }
      resolve(d);
    };
    const check = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) finish();
    };
    const timer = setTimeout(finish, timeoutMs);
    video.addEventListener('durationchange', check);
    video.addEventListener('timeupdate', check);
    video.addEventListener('seeked', check);
    try {
      video.currentTime = 1e101;
    } catch {
      finish();
    }
  });
}
