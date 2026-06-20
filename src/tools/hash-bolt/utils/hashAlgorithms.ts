// Custom MD5 implementation for client-side processing
// Ports standard MD5 RSA Data Security algorithm to TypeScript

class MD5Hasher {
  private static safeAdd(x: number, y: number): number {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }

  private static bitRotateLeft(num: number, cnt: number): number {
    return (num << cnt) | (num >>> (32 - cnt));
  }

  private static md5cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
    return this.safeAdd(this.bitRotateLeft(this.safeAdd(this.safeAdd(a, q), this.safeAdd(x, t)), s), b);
  }

  private static md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return this.md5cmn((b & c) | (~b & d), a, b, x, s, t);
  }

  private static md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return this.md5cmn((b & d) | (c & ~d), a, b, x, s, t);
  }

  private static md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return this.md5cmn(b ^ c ^ d, a, b, x, s, t);
  }

  private static md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return this.md5cmn(c ^ (b | ~d), a, b, x, s, t);
  }

  public static hash(data: Uint8Array): Uint8Array {
    const len = data.length;
    const words: number[] = [];
    for (let i = 0; i < len * 8; i += 8) {
      words[i >> 5] |= (data[i / 8] & 0xff) << (i % 32);
    }

    // Add padding
    words[len >> 2] |= 0x80 << ((len % 4) * 8);
    const wordCount = ((len + 8) >> 6) * 16 + 14;
    while (words.length < wordCount) {
      words.push(0);
    }
    words.push(len * 8);
    words.push(0);

    let a = 1732584193;
    let b = -271733879;
    let c = -1732584194;
    let d = 271733878;

    for (let i = 0; i < words.length; i += 16) {
      const olda = a;
      const oldb = b;
      const oldc = c;
      const oldd = d;

      a = this.md5ff(a, b, c, d, words[i], 7, -680876936);
      d = this.md5ff(d, a, b, c, words[i + 1], 12, -389564586);
      c = this.md5ff(c, d, a, b, words[i + 2], 17, 606105819);
      b = this.md5ff(b, c, d, a, words[i + 3], 22, -1044525330);
      a = this.md5ff(a, b, c, d, words[i + 4], 7, -176418897);
      d = this.md5ff(d, a, b, c, words[i + 5], 12, 1200080426);
      c = this.md5ff(c, d, a, b, words[i + 6], 17, -1473231341);
      b = this.md5ff(b, c, d, a, words[i + 7], 22, -45705983);
      a = this.md5ff(a, b, c, d, words[i + 8], 7, 1770035416);
      d = this.md5ff(d, a, b, c, words[i + 9], 12, -1958414417);
      c = this.md5ff(c, d, a, b, words[i + 10], 17, -42063);
      b = this.md5ff(b, c, d, a, words[i + 11], 22, -1990404162);
      a = this.md5ff(a, b, c, d, words[i + 12], 7, 1804603682);
      d = this.md5ff(d, a, b, c, words[i + 13], 12, -40341101);
      c = this.md5ff(c, d, a, b, words[i + 14], 17, -1502002290);
      b = this.md5ff(b, c, d, a, words[i + 15], 22, 1236535329);

      a = this.md5gg(a, b, c, d, words[i + 1], 5, -165796510);
      d = this.md5gg(d, a, b, c, words[i + 6], 9, -1069501632);
      c = this.md5gg(c, d, a, b, words[i + 11], 14, 643717713);
      b = this.md5gg(b, c, d, a, words[i], 20, -373897302);
      a = this.md5gg(a, b, c, d, words[i + 5], 5, -701558691);
      d = this.md5gg(d, a, b, c, words[i + 10], 9, 38016083);
      c = this.md5gg(c, d, a, b, words[i + 15], 14, -660478335);
      b = this.md5gg(b, c, d, a, words[i + 4], 20, -405537848);
      a = this.md5gg(a, b, c, d, words[i + 9], 5, 568446438);
      d = this.md5gg(d, a, b, c, words[i + 14], 9, -1019803690);
      c = this.md5gg(c, d, a, b, words[i + 3], 14, -187363961);
      b = this.md5gg(b, c, d, a, words[i + 8], 20, 1163531501);
      a = this.md5gg(a, b, c, d, words[i + 13], 5, -1444681467);
      d = this.md5gg(d, a, b, c, words[i + 2], 9, -51403784);
      c = this.md5gg(c, d, a, b, words[i + 7], 14, 1735328473);
      b = this.md5gg(b, c, d, a, words[i + 12], 20, -1926607734);

      a = this.md5hh(a, b, c, d, words[i + 5], 4, -378558);
      d = this.md5hh(d, a, b, c, words[i + 8], 11, -2022574463);
      c = this.md5hh(c, d, a, b, words[i + 11], 16, 1839030562);
      b = this.md5hh(b, c, d, a, words[i + 14], 23, -35309556);
      a = this.md5hh(a, b, c, d, words[i + 1], 4, -1530992060);
      d = this.md5hh(d, a, b, c, words[i + 4], 11, 1272893353);
      c = this.md5hh(c, d, a, b, words[i + 7], 16, -155497632);
      b = this.md5hh(b, c, d, a, words[i + 10], 23, -1094730640);
      a = this.md5hh(a, b, c, d, words[i + 13], 4, 681279174);
      d = this.md5hh(d, a, b, c, words[i], 11, -358537222);
      c = this.md5hh(c, d, a, b, words[i + 3], 16, -722521979);
      b = this.md5hh(b, c, d, a, words[i + 6], 23, 76029189);
      a = this.md5hh(a, b, c, d, words[i + 9], 4, -640364487);
      d = this.md5hh(d, a, b, c, words[i + 12], 11, -421815835);
      c = this.md5hh(c, d, a, b, words[i + 15], 16, 955073595);
      b = this.md5hh(b, c, d, a, words[i + 2], 23, -217702635);

      a = this.md5ii(a, b, c, d, words[i], 6, -198630844);
      d = this.md5ii(d, a, b, c, words[i + 7], 10, 1126891415);
      c = this.md5ii(c, d, a, b, words[i + 14], 15, -1416354905);
      b = this.md5ii(b, c, d, a, words[i + 5], 21, -57434055);
      a = this.md5ii(a, b, c, d, words[i + 12], 6, 1700485571);
      d = this.md5ii(d, a, b, c, words[i + 3], 10, -1894986606);
      c = this.md5ii(c, d, a, b, words[i + 10], 15, -1051523);
      b = this.md5ii(b, c, d, a, words[i + 1], 21, -2054922799);
      a = this.md5ii(a, b, c, d, words[i + 8], 6, 1873313359);
      d = this.md5ii(d, a, b, c, words[i + 15], 10, -30611744);
      c = this.md5ii(c, d, a, b, words[i + 6], 15, -1560198380);
      b = this.md5ii(b, c, d, a, words[i + 13], 21, 1309151649);
      a = this.md5ii(a, b, c, d, words[i + 4], 6, -145523070);
      d = this.md5ii(d, a, b, c, words[i + 11], 10, -1120210379);
      c = this.md5ii(c, d, a, b, words[i + 2], 15, 718787259);
      b = this.md5ii(b, c, d, a, words[i + 9], 21, -343485551);

      a = this.safeAdd(a, olda);
      b = this.safeAdd(b, oldb);
      c = this.safeAdd(c, oldc);
      d = this.safeAdd(d, oldd);
    }

    // Convert back to raw bytes (16 bytes)
    const result = new Uint8Array(16);
    const state = [a, b, c, d];
    for (let i = 0; i < 4; i++) {
      const val = state[i];
      for (let j = 0; j < 4; j++) {
        result[i * 4 + j] = (val >>> (j * 8)) & 0xff;
      }
    }
    return result;
  }
}

export function computeMD5(buffer: ArrayBuffer): ArrayBuffer {
  const bytes = new Uint8Array(buffer);
  const hashBytes = MD5Hasher.hash(bytes);
  return hashBytes.buffer;
}

// Convert ArrayBuffer to Hexadecimal string
export function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert ArrayBuffer to Base64 string
export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Compute hash using Web Crypto API or fallback
export async function computeHash(algorithm: string, buffer: ArrayBuffer): Promise<ArrayBuffer> {
  const cleanAlgo = algorithm.toUpperCase();
  if (cleanAlgo === 'MD5') {
    return computeMD5(buffer);
  }
  // Native browser Web Crypto
  return await window.crypto.subtle.digest(cleanAlgo, buffer);
}
