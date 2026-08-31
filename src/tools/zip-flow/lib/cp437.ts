// ============================================================================
// Legacy filename decoding
// ----------------------------------------------------------------------------
// A ZIP entry either flags its name as UTF-8 (bit 11) or leaves it as raw
// bytes, which by spec means IBM code page 437. JSZip's default
// `decodeFileName` runs UTF-8 over those bytes regardless, so every archive
// produced by the Windows Explorer "Send to > Compressed folder" of an
// accented locale, by old WinRAR, or by any Japanese/Cyrillic packer, lists
// its files as mojibake ("Ficha t�cnica.pdf").
//
// We only get here for entries WITHOUT the UTF-8 flag: JSZip decodes flagged
// ones itself. Even so, plenty of packers write UTF-8 bytes and forget the
// flag, so we try strict UTF-8 first and only fall back to CP437.
// ============================================================================

/** Upper half of code page 437 (0x80–0xFF). The lower half is ASCII. */
const CP437_HIGH =
  'ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒ' +
  'áíóúñÑªº¿⌐¬½¼¡«»' +
  '░▒▓│┤╡╢╖╕╣║╗╝╜╛┐' +
  '└┴┬├─┼╞╟╚╔╩╦╠═╬╧' +
  '╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀' +
  'αßΓπΣσµτΦΘΩδ∞φε∩' +
  '≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ';

const strictUtf8 = new TextDecoder('utf-8', { fatal: true });

function toBytes(input: string[] | Uint8Array | ArrayLike<number>): Uint8Array {
  if (input instanceof Uint8Array) return input;
  // JSZip hands us either a Uint8Array or an array of char codes depending on
  // the platform support it detected.
  const out = new Uint8Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const v = (input as ArrayLike<number | string>)[i];
    out[i] = typeof v === 'string' ? v.charCodeAt(0) & 0xff : (v as number) & 0xff;
  }
  return out;
}

function decodeCp437(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    out += b < 0x80 ? String.fromCharCode(b) : CP437_HIGH[b - 0x80];
  }
  return out;
}

/**
 * Drop-in `decodeFileName` for `JSZip.loadAsync`. Pure ASCII decodes the same
 * either way, so the only names this changes are the ones that were broken.
 */
export function decodeFileName(input: string[] | Uint8Array | ArrayLike<number>): string {
  const bytes = toBytes(input);
  let ascii = true;
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] >= 0x80) {
      ascii = false;
      break;
    }
  }
  if (ascii) return decodeCp437(bytes);
  try {
    return strictUtf8.decode(bytes);
  } catch {
    return decodeCp437(bytes);
  }
}
