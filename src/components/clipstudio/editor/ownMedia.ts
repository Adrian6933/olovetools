// Vídeos que pone la persona (en "Unir" y en el editor): duración real y una
// miniatura, comprobando de paso que el navegador sabe leerlos.
import { duracionDe } from '../mergeService';

/** Lee la duración y saca un fotograma para la miniatura de un vídeo propio. */
export const prepararVideo = (file: File) =>
  new Promise<{ dur: number; thumb: string }>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.muted = true;
    v.preload = 'auto';
    v.src = url;
    v.onerror = () => { URL.revokeObjectURL(url); reject(new Error('unreadable')); };
    let dur = 0;
    v.onloadedmetadata = async () => {
      dur = await duracionDe(v);
      // Con la duración ya sabida, al fotograma de la miniatura.
      // Solo vale el salto a este punto: el de medir la duración (al final)
      // también dispara seeked y daría una miniatura negra.
      const objetivo = Math.min(1, (dur || 2) / 3);
      v.onseeked = () => { if (Math.abs(v.currentTime - objetivo) < 0.3) miniatura(); };
      v.currentTime = objetivo;
    };
    const miniatura = () => {
      const c = document.createElement('canvas');
      c.width = 160;
      c.height = 90;
      const k = Math.min(160 / (v.videoWidth || 160), 90 / (v.videoHeight || 90));
      const w = (v.videoWidth || 160) * k;
      const h = (v.videoHeight || 90) * k;
      const x = c.getContext('2d')!;
      x.fillStyle = '#000';
      x.fillRect(0, 0, 160, 90);
      x.drawImage(v, (160 - w) / 2, (90 - h) / 2, w, h);
      URL.revokeObjectURL(url);
      resolve({ dur, thumb: c.toDataURL('image/jpeg', 0.7) });
    };
  });

