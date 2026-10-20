// ============================================================================
// De MPEG-TS a MP4, en el navegador y sin recodificar
// ----------------------------------------------------------------------------
// Los clips de Kick llegan como trozos HLS en MPEG-TS. Pegados tal cual salía
// un .ts con extensión .mp4: VLC lo abre, pero muchos reproductores, móviles y
// editores no, y un <video> de Chrome tampoco, así que la marca de agua y el
// vídeo unido no podían ni leerlo. mux.js reempaqueta los mismos fotogramas en
// MP4 (fragmentado) en milisegundos: ni pierde calidad ni tarda.
// ============================================================================

/** true si el blob empieza como un MPEG-TS (byte de sincronía 0x47 cada 188). */
export const esMpegTs = async (blob: Blob): Promise<boolean> => {
  if (blob.size < 189) return false;
  const b = new Uint8Array(await blob.slice(0, 377).arrayBuffer());
  return b[0] === 0x47 && b[188] === 0x47;
};

export const tsToMp4 = async (ts: Blob): Promise<Blob> => {
  // Carga perezosa: solo quien descarga de Kick paga los ~100 KB.
  const mod: any = await import('mux.js');
  const muxjs = mod.default || mod;
  const Transmuxer = muxjs.mp4.Transmuxer;
  const datos = new Uint8Array(await ts.arrayBuffer());

  return new Promise<Blob>((resolve, reject) => {
    const tm = new Transmuxer({ remux: true });
    let init: Uint8Array | null = null;
    const trozos: Uint8Array[] = [];
    tm.on('data', (seg: { initSegment: Uint8Array; data: Uint8Array }) => {
      if (!init) init = seg.initSegment;
      trozos.push(seg.data);
    });
    tm.on('done', () => {
      if (!init || trozos.length === 0) {
        reject(new Error('No se pudo convertir el vídeo a MP4'));
        return;
      }
      resolve(new Blob([init, ...trozos], { type: 'video/mp4' }));
    });
    try {
      tm.push(datos);
      tm.flush();
    } catch (e) {
      reject(e);
    }
  });
};
