// ============================================================================
// ZIP sin copiar los vídeos
// ----------------------------------------------------------------------------
// JSZip lee cada archivo entero a memoria y luego arma el ZIP en otro bloque:
// con 24 clips y el vídeo unido eran varios GB de golpe en la pestaña, y al
// final salía "No se pudo crear el vídeo". Aquí el ZIP es un Blob hecho de
// trozos: las cabeceras (bytes sueltos) y los propios Blobs de los vídeos, que
// el navegador ya tiene guardados (en disco si son grandes) y no se copian.
// Lo único que se lee es el CRC de cada archivo, a pedazos.
//
// Sin comprimir (STORE): un MP4 no gana nada con deflate. ZIP64 cuando hace
// falta (archivos u offsets de más de 4 GB), que el ZIP clásico no cabe.
// ============================================================================

export interface EntradaZip {
  /** Ruta dentro del ZIP; "/" separa carpetas. */
  nombre: string;
  datos: Blob;
}

const TABLA = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

const crcDe = async (blob: Blob, signal?: AbortSignal) => {
  let c = 0xffffffff;
  const lector = blob.stream().getReader();
  for (;;) {
    if (signal?.aborted) {
      lector.cancel().catch(() => { /* ya cerrado */ });
      throw new DOMException('Cancelled', 'AbortError');
    }
    const { done, value } = await lector.read();
    if (done) break;
    for (let i = 0; i < value.length; i += 1) c = TABLA[(c ^ value[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
};

const MAX32 = 0xffffffff;
const MAX16 = 0xffff;

/** Bytes en little-endian. */
class Bytes {
  readonly u8: Uint8Array;
  private v: DataView;
  private at = 0;
  constructor(n: number) { this.u8 = new Uint8Array(n); this.v = new DataView(this.u8.buffer); }
  u16(x: number) { this.v.setUint16(this.at, x & MAX16, true); this.at += 2; return this; }
  u32(x: number) { this.v.setUint32(this.at, x >>> 0, true); this.at += 4; return this; }
  u64(x: number) { this.u32(x >>> 0); return this.u32(Math.floor(x / 4294967296)); }
  raw(b: Uint8Array) { this.u8.set(b, this.at); this.at += b.length; return this; }
}

const sello = (d: Date) => ({
  hora: ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & MAX16,
  dia: (((Math.max(1980, d.getFullYear()) - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & MAX16,
});

/**
 * Arma el ZIP. `onProgress` va de 0 a 100 según lo leído para los CRC, que
 * es lo único que tarda (unos segundos por GB).
 */
export const zipEnBlob = async (entradas: EntradaZip[], signal?: AbortSignal, onProgress?: (pct: number) => void): Promise<Blob> => {
  const utf8 = new TextEncoder();
  const { hora, dia } = sello(new Date());
  const partes: BlobPart[] = [];
  const central: Uint8Array[] = [];
  const usados = new Set<string>();
  const totalBytes = entradas.reduce((s, e) => s + e.datos.size, 0) || 1;
  let leidos = 0;
  let offset = 0;

  for (const e of entradas) {
    // Dos entradas con el mismo nombre: hay descompresores que rechazan el ZIP entero.
    let nombre = e.nombre.replace(/[\\:*?"<>|\u0000-\u001f]/g, '_');
    if (usados.has(nombre)) {
      const punto = nombre.lastIndexOf('.');
      const [base, ext] = punto > 0 ? [nombre.slice(0, punto), nombre.slice(punto)] : [nombre, ''];
      let n = 2;
      while (usados.has(`${base}_${n}${ext}`)) n += 1;
      nombre = `${base}_${n}${ext}`;
    }
    usados.add(nombre);
    const bytesNombre = utf8.encode(nombre);
    const crc = await crcDe(e.datos, signal);
    leidos += e.datos.size;
    onProgress?.(Math.round((leidos / totalBytes) * 100));
    const tam = e.datos.size;
    const tam64 = tam >= MAX32;
    const off64 = offset >= MAX32;
    const version = tam64 || off64 ? 45 : 20;

    const local = new Bytes(30 + bytesNombre.length + (tam64 ? 20 : 0));
    local.u32(0x04034b50).u16(version).u16(0x0800).u16(0).u16(hora).u16(dia).u32(crc)
      .u32(tam64 ? MAX32 : tam).u32(tam64 ? MAX32 : tam)
      .u16(bytesNombre.length).u16(tam64 ? 20 : 0).raw(bytesNombre);
    if (tam64) local.u16(0x0001).u16(16).u64(tam).u64(tam);
    partes.push(local.u8, e.datos);

    const extra = (tam64 ? 16 : 0) + (off64 ? 8 : 0);
    const c = new Bytes(46 + bytesNombre.length + (extra ? extra + 4 : 0));
    c.u32(0x02014b50).u16(version).u16(version).u16(0x0800).u16(0).u16(hora).u16(dia).u32(crc)
      .u32(tam64 ? MAX32 : tam).u32(tam64 ? MAX32 : tam)
      .u16(bytesNombre.length).u16(extra ? extra + 4 : 0).u16(0).u16(0).u16(0).u32(0)
      .u32(off64 ? MAX32 : offset).raw(bytesNombre);
    if (extra) {
      c.u16(0x0001).u16(extra);
      if (tam64) c.u64(tam).u64(tam);
      if (off64) c.u64(offset);
    }
    central.push(c.u8);
    offset += local.u8.length + tam;
  }

  const inicioCentral = offset;
  const tamCentral = central.reduce((s, c) => s + c.length, 0);
  partes.push(...central);
  offset += tamCentral;

  const zip64 = entradas.length > MAX16 || inicioCentral >= MAX32 || tamCentral >= MAX32;
  if (zip64) {
    const cola = new Bytes(56 + 20);
    cola.u32(0x06064b50).u64(44).u16(45).u16(45).u32(0).u32(0)
      .u64(entradas.length).u64(entradas.length).u64(tamCentral).u64(inicioCentral)
      // El localizador: sin él nadie encuentra el registro de arriba.
      .u32(0x07064b50).u32(0).u64(offset).u32(1);
    partes.push(cola.u8);
  }
  const fin = new Bytes(22);
  fin.u32(0x06054b50).u16(0).u16(0)
    .u16(zip64 ? MAX16 : entradas.length).u16(zip64 ? MAX16 : entradas.length)
    .u32(zip64 ? MAX32 : tamCentral).u32(zip64 ? MAX32 : inicioCentral).u16(0);
  partes.push(fin.u8);

  return new Blob(partes, { type: 'application/zip' });
};
