// ============================================================================
// Escritor de ZIP en streaming.
// ----------------------------------------------------------------------------
// La razón de existir de este fichero es el techo de memoria. JSZip (que usa el
// resto de la suite) guarda TODOS los ficheros que le vas dando y sólo escribe
// el archivo al llamar a generateAsync: con 9.000 fotogramas de un vídeo de
// cinco minutos eso son varios GB vivos en el heap de la pestaña, y la pestaña
// se muere antes de llegar al final. Aquí cada fotograma se escribe y se
// olvida; lo único que sobrevive a un fotograma es su entrada de 60 bytes en el
// directorio central.
//
// Método STORE (sin comprimir) a propósito: un PNG/JPEG/WebP ya viene
// comprimido, y pasarle deflate encima gasta CPU para ahorrar un 1-2%. Eso
// además hace el formato trivial de escribir, porque el tamaño y el CRC de cada
// entrada se conocen ANTES de escribir su cabecera y no hace falta el
// descriptor de datos que obliga a usar el streaming con deflate.
//
// ZIP64 cuando toca: por encima de 65.535 entradas (un vídeo de 40 minutos a
// 30 fps ya las pasa) o de 4 GB, el ZIP clásico no tiene bits donde meter los
// números y el archivo sale corrupto sin avisar.
// ============================================================================

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const MAX32 = 0xffffffff;
const MAX16 = 0xffff;

/** Fecha y hora en el formato de MS-DOS que el ZIP lleva arrastrando desde 1989. */
function dosStamp(date: Date): { time: number; date: number } {
  const year = Math.max(1980, date.getFullYear());
  return {
    time: ((date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1)) & MAX16,
    date: (((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()) & MAX16,
  };
}

interface CentralEntry {
  nameBytes: Uint8Array;
  crc: number;
  size: number;
  offset: number;
  time: number;
  date: number;
}

/** Escribe bytes en little-endian, que es lo único que entiende el formato. */
class ByteWriter {
  private readonly view: DataView;
  private at = 0;
  readonly bytes: Uint8Array;

  constructor(length: number) {
    this.bytes = new Uint8Array(length);
    this.view = new DataView(this.bytes.buffer);
  }

  u16(value: number) {
    this.view.setUint16(this.at, value & MAX16, true);
    this.at += 2;
    return this;
  }

  u32(value: number) {
    this.view.setUint32(this.at, value >>> 0, true);
    this.at += 4;
    return this;
  }

  /** 64 bits desde un number: seguro hasta 2^53, muy por encima de cualquier ZIP real. */
  u64(value: number) {
    this.view.setUint32(this.at, value >>> 0, true);
    this.view.setUint32(this.at + 4, Math.floor(value / 4294967296), true);
    this.at += 8;
    return this;
  }

  raw(data: Uint8Array) {
    this.bytes.set(data, this.at);
    this.at += data.length;
    return this;
  }
}

export type ChunkWriter = (chunk: Uint8Array) => Promise<void> | void;

export class ZipStreamWriter {
  private offset = 0;
  private readonly entries: CentralEntry[] = [];
  private readonly encoder = new TextEncoder();
  private readonly used = new Set<string>();

  constructor(private readonly emit: ChunkWriter) {}

  get count(): number {
    return this.entries.length;
  }

  get written(): number {
    return this.offset;
  }

  /**
   * Añade un fichero y lo suelta. Si el nombre ya estaba, se le pone un sufijo:
   * dos entradas con el mismo nombre dan un ZIP que unos descompresores abren a
   * medias y otros rechazan entero.
   */
  async add(name: string, data: Uint8Array, modified = new Date()): Promise<void> {
    const unique = this.uniqueName(name);
    const nameBytes = this.encoder.encode(unique);
    const crc = crc32(data);
    const stamp = dosStamp(modified);

    const header = new ByteWriter(30 + nameBytes.length);
    header
      .u32(0x04034b50)
      .u16(20) // versión mínima para extraer: 2.0
      .u16(0x0800) // nombre en UTF-8
      .u16(0) // método: sin comprimir
      .u16(stamp.time)
      .u16(stamp.date)
      .u32(crc)
      .u32(data.length)
      .u32(data.length)
      .u16(nameBytes.length)
      .u16(0)
      .raw(nameBytes);

    const startedAt = this.offset;
    await this.emit(header.bytes);
    await this.emit(data);
    this.offset += header.bytes.length + data.length;

    this.entries.push({ nameBytes, crc, size: data.length, offset: startedAt, time: stamp.time, date: stamp.date });
  }

  /** Cierra el archivo: directorio central y sus dos colas. */
  async finish(): Promise<void> {
    const centralStart = this.offset;

    for (const entry of this.entries) {
      // El desplazamiento es el único campo que se puede salir de 32 bits en un
      // ZIP de fotogramas: cada imagen suelta pesa muchísimo menos de 4 GB.
      const needsZip64 = entry.offset > MAX32;
      const extraLength = needsZip64 ? 12 : 0;

      const central = new ByteWriter(46 + entry.nameBytes.length + extraLength);
      central
        .u32(0x02014b50)
        .u16(needsZip64 ? 45 : 20) // versión con la que se creó
        .u16(needsZip64 ? 45 : 20) // versión mínima para extraer
        .u16(0x0800)
        .u16(0)
        .u16(entry.time)
        .u16(entry.date)
        .u32(entry.crc)
        .u32(entry.size)
        .u32(entry.size)
        .u16(entry.nameBytes.length)
        .u16(extraLength)
        .u16(0) // comentario
        .u16(0) // disco de inicio
        .u16(0) // atributos internos
        .u32(0) // atributos externos
        .u32(needsZip64 ? MAX32 : entry.offset)
        .raw(entry.nameBytes);

      if (needsZip64) {
        central.u16(0x0001).u16(8).u64(entry.offset);
      }

      await this.emit(central.bytes);
      this.offset += central.bytes.length;
    }

    const centralSize = this.offset - centralStart;
    const zip64 = this.entries.length > MAX16 || centralSize > MAX32 || centralStart > MAX32;

    if (zip64) {
      const tail = new ByteWriter(56 + 20);
      tail
        .u32(0x06064b50)
        .u64(44) // tamaño de este registro menos sus 12 primeros bytes
        .u16(45)
        .u16(45)
        .u32(0)
        .u32(0)
        .u64(this.entries.length)
        .u64(this.entries.length)
        .u64(centralSize)
        .u64(centralStart)
        // Localizador: es lo que hace que un descompresor encuentre el registro
        // de arriba en vez de creerse los ceros del final clásico.
        .u32(0x07064b50)
        .u32(0)
        .u64(this.offset)
        .u32(1);
      await this.emit(tail.bytes);
      this.offset += tail.bytes.length;
    }

    const end = new ByteWriter(22);
    end
      .u32(0x06054b50)
      .u16(0)
      .u16(0)
      .u16(zip64 ? MAX16 : this.entries.length)
      .u16(zip64 ? MAX16 : this.entries.length)
      .u32(zip64 ? MAX32 : centralSize)
      .u32(zip64 ? MAX32 : centralStart)
      .u16(0);
    await this.emit(end.bytes);
    this.offset += end.bytes.length;
  }

  private uniqueName(name: string): string {
    // Lo que Windows no admite en un nombre, mas los espacios y los
    // controles. El guion y el punto se quedan: son los separadores del
    // codigo de tiempo.
    const safe = name.replace(/[\\\/:*?"<>|\s\u0000-\u001f]/g, '_').slice(0, 180) || 'frame';
    if (!this.used.has(safe)) {
      this.used.add(safe);
      return safe;
    }
    const dot = safe.lastIndexOf('.');
    const stem = dot > 0 ? safe.slice(0, dot) : safe;
    const ext = dot > 0 ? safe.slice(dot) : '';
    for (let i = 2; ; i += 1) {
      const candidate = `${stem}_${i}${ext}`;
      if (!this.used.has(candidate)) {
        this.used.add(candidate);
        return candidate;
      }
    }
  }
}
