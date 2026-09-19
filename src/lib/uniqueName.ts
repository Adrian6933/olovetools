/**
 * Nombres sin repetir para meter archivos en un ZIP.
 *
 * JSZip sobrescribe en silencio una entrada con el mismo nombre, asi que dos
 * fotos llamadas IMG_0001.jpg (de dos moviles, o de dos carpetas) dejaban una
 * sola en el ZIP y la otra desaparecia sin aviso. La segunda pasa a ser
 * "IMG_0001 (2).jpg", como hace el explorador de archivos. Sin distinguir
 * mayusculas: en Windows y macOS "Foto.JPG" y "foto.jpg" chocan al descomprimir.
 */
export function createUniqueNamer(): (name: string) => string {
  const used = new Set<string>();
  return (name: string) => {
    const dot = name.lastIndexOf('.');
    const stem = dot > 0 ? name.slice(0, dot) : name;
    const ext = dot > 0 ? name.slice(dot) : '';
    let unique = name;
    for (let n = 2; used.has(unique.toLowerCase()); n++) unique = `${stem} (${n})${ext}`;
    used.add(unique.toLowerCase());
    return unique;
  };
}
