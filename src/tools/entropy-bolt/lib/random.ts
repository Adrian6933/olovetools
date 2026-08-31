// ============================================================================
// Aleatoriedad criptográfica
// ----------------------------------------------------------------------------
// Todo sale de crypto.getRandomValues. Nada de Math.random en ninguna ruta que
// toque una contraseña.
// ============================================================================

/**
 * Reserva de bytes aleatorios. La versión anterior llamaba a getRandomValues
 * una vez POR CARÁCTER (y otra vez más por cada byte rechazado), así que una
 * contraseña de 64 caracteres hacía ~70 llamadas. Pedir un bloque y consumirlo
 * cuesta una sola llamada.
 */
class RandomPool {
  private buf = new Uint8Array(256);
  private next = 256;

  byte(): number {
    if (this.next >= this.buf.length) {
      crypto.getRandomValues(this.buf);
      this.next = 0;
    }
    return this.buf[this.next++];
  }
}

/**
 * Entero uniforme en [0, max) por muestreo con rechazo.
 *
 * El rechazo NO es opcional: `byte % max` reparte los 256 valores posibles de
 * forma desigual salvo que max sea potencia de 2 (con max=10, los dígitos 0-5
 * salen 26 veces y 6-9 solo 25), y ese sesgo se traslada tal cual a la
 * contraseña. Descartando el tramo sobrante la distribución queda plana.
 *
 * Para max > 256 se componen dos bytes, de nuevo con rechazo.
 */
export function randomInt(max: number, pool: RandomPool = shared): number {
  if (max <= 1) return 0;

  if (max <= 256) {
    const limit = 256 - (256 % max);
    let r: number;
    do {
      r = pool.byte();
    } while (r >= limit);
    return r % max;
  }

  const limit = 65536 - (65536 % max);
  let r: number;
  do {
    r = (pool.byte() << 8) | pool.byte();
  } while (r >= limit);
  return r % max;
}

const shared = new RandomPool();

/** Elemento al azar de un array o de una cadena. */
export function pick<T>(items: ArrayLike<T>): T {
  return items[randomInt(items.length)];
}

/**
 * Baraja Fisher-Yates en el sitio, con el mismo generador.
 *
 * Hace falta porque el generador coloca primero un carácter obligatorio de cada
 * clase seleccionada: sin barajar, esos caracteres quedarían siempre en las
 * primeras posiciones y el resultado sería predecible en su forma (mayúscula,
 * minúscula, dígito, símbolo, y luego relleno).
 */
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}
