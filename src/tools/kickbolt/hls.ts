// Reproducir las listas HLS de Kick en un <video>. Safari las abre solo; el
// resto necesita hls.js, que se carga de la CDN la primera vez que hace falta.

let cargando: Promise<any> | null = null;

const cargarHls = (): Promise<any> => {
  if ((window as any).Hls) return Promise.resolve((window as any).Hls);
  if (cargando) return cargando;
  cargando = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.8/dist/hls.min.js';
    script.onload = () => ((window as any).Hls ? resolve((window as any).Hls) : reject(new Error('Hls not found on window')));
    script.onerror = () => { cargando = null; reject(new Error('Failed to load Hls.js')); };
    document.head.appendChild(script);
  });
  return cargando;
};

/**
 * Engancha la URL al vídeo y devuelve cómo soltarla. Antes, si el componente
 * se desmontaba mientras hls.js aún cargaba, la instancia se creaba después
 * de la limpieza y se quedaba descargando trozos para un vídeo que ya no
 * existía.
 */
export const attachKickSource = (video: HTMLVideoElement, url: string): (() => void) => {
  if (!url.includes('.m3u8')) {
    video.src = url;
    return () => {};
  }
  // hls.js primero, y el reproductor nativo solo si hls.js no puede (iPhone,
  // sin MediaSource). Preguntar a canPlayType no vale: Chrome 152 contesta
  // "maybe" a HLS y luego no reproduce estas listas, así que la vista previa
  // de los clips se quedaba en negro.
  const sinMse = typeof window !== 'undefined' && !('MediaSource' in window) && !('ManagedMediaSource' in window);
  if (sinMse && video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = url;
    return () => {};
  }
  let hls: any = null;
  let soltado = false;
  cargarHls()
    .then(Hls => {
      if (soltado) return;
      if (!Hls.isSupported()) { video.src = url; return; }
      hls = new Hls({ maxMaxBufferLength: 10 });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_e: any, d: any) => { if (d.fatal) hls?.destroy(); });
    })
    .catch(() => { if (!soltado) video.src = url; });
  return () => {
    soltado = true;
    hls?.destroy();
    hls = null;
  };
};
