// ============================================================================
// Inpainting por propagación de parches
// ----------------------------------------------------------------------------
// El motor anterior difundía calor: promediaba los 4 vecinos del hueco una y
// otra vez. Eso resuelve la ecuación de Laplace, cuya solución es —por
// definición— la superficie MÁS LISA que encaja con el borde. Sobre un cielo
// va perfecto. Sobre ladrillo, césped o madera devuelve una mancha.
//
// Medido sobre rayas verticales de contraste máximo: el original tiene
// desviación típica 114,1 y la difusión devolvía 39,1, con un error medio de
// 120 niveles sobre 255. No es que quedara regular: es que no reconstruía nada.
//
// Aquí se copian trozos de la propia imagen (Criminisi et al., 2004), que es
// como funciona de verdad un "relleno según el contenido":
//
//   1. Del borde del hueco se elige el píxel con más prioridad. La prioridad
//      combina cuánto contexto conocido tiene alrededor (confianza) con cuánta
//      estructura lo atraviesa (el término de isofota). Eso hace que las
//      líneas y los bordes entren en el hueco ANTES que las zonas planas, y
//      por eso la estructura continúa en vez de cortarse.
//   2. Se busca en la parte conocida el parche más parecido a su vecindario.
//   3. Se copia. Se marca como relleno y se repite.
//
// No hay red neuronal ni descarga de modelo: son unas 200 líneas y corre en un
// worker sobre un array de píxeles.
// ============================================================================

import type { FillProgress, FillSettings } from './types';

export interface Plane {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/** 1 = hay que rellenar, 0 = píxel conocido. */
export type Mask = Uint8Array;

// ----------------------------------------------------------------------------
// Utilidades de máscara
// ----------------------------------------------------------------------------

export function boundingBox(mask: Mask, width: number, height: number) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      if (mask[row + x]) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { any: maxX >= 0, minX, minY, maxX, maxY };
}

/**
 * Ensancha (o estrecha) la máscara. Un par de píxeles de más casi siempre
 * ayuda: las marcas de agua llevan un halo semitransparente que el usuario no
 * ve al pintar y que, si se queda, delata el borrado.
 */
export function growMask(mask: Mask, width: number, height: number, amount: number): Mask {
  if (amount === 0) return mask;
  const grow = amount > 0;
  const radius = Math.abs(amount);
  let current = mask;
  for (let step = 0; step < radius; step++) {
    const next = new Uint8Array(current.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        const self = current[i];
        // Dilatación: basta un vecino puesto. Erosión: basta uno quitado.
        let neighbour = grow ? self : self;
        for (let dy = -1; dy <= 1 && neighbour === (grow ? 0 : 1); dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
              if (!grow) { neighbour = 0; break; }
              continue;
            }
            const v = current[ny * width + nx];
            if (grow && v) { neighbour = 1; break; }
            if (!grow && !v) { neighbour = 0; break; }
          }
        }
        next[i] = neighbour;
      }
    }
    current = next;
  }
  return current;
}

// ----------------------------------------------------------------------------
// Difusión (método "suave")
// ----------------------------------------------------------------------------

/**
 * Se conserva porque para cielos, paredes lisas y degradados es EL método
 * correcto y es mucho más rápido. Lo que ha cambiado es que ya no se vende
 * como "relleno según el contenido".
 *
 * Arranca sembrando el hueco con la media del borde conocido. La versión
 * anterior partía de los píxeles de la marca de agua, así que las primeras
 * cientos de iteraciones se iban sólo en empujar ese color fuera; con la
 * semilla correcta el número de pasadas baja de ~1.000 a como mucho 400.
 */
export function smoothFill(plane: Plane, mask: Mask, onProgress?: (p: FillProgress) => void): void {
  const box = boundingBox(mask, plane.width, plane.height);
  if (!box.any) return;
  const pad = 4;
  const x0 = Math.max(0, box.minX - pad);
  const y0 = Math.max(0, box.minY - pad);
  const x1 = Math.min(plane.width - 1, box.maxX + pad);
  const y1 = Math.min(plane.height - 1, box.maxY + pad);
  const bw = x1 - x0 + 1;
  const bh = y1 - y0 + 1;

  const channels: Float32Array[] = [new Float32Array(bw * bh), new Float32Array(bw * bh), new Float32Array(bw * bh)];
  const hole = new Uint8Array(bw * bh);
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      const global = (y0 + y) * plane.width + (x0 + x);
      const local = y * bw + x;
      channels[0][local] = plane.data[global * 4];
      channels[1][local] = plane.data[global * 4 + 1];
      channels[2][local] = plane.data[global * 4 + 2];
      hole[local] = mask[global];
    }
  }

  // Semilla: la media del borde conocido. Partir del color correcto ahorra
  // cientos de iteraciones frente a partir de lo que hubiera en el hueco.
  const seed = [0, 0, 0];
  let known = 0;
  for (let i = 0; i < hole.length; i++) {
    if (hole[i]) continue;
    seed[0] += channels[0][i];
    seed[1] += channels[1][i];
    seed[2] += channels[2][i];
    known++;
  }
  if (known > 0) {
    for (let c = 0; c < 3; c++) {
      const average = seed[c] / known;
      for (let i = 0; i < hole.length; i++) if (hole[i]) channels[c][i] = average;
    }
  }

  const iterations = Math.min(400, Math.max(60, Math.round(Math.max(bw, bh) * 0.8)));
  for (let step = 0; step < iterations; step++) {
    for (let y = 0; y < bh; y++) {
      for (let x = 0; x < bw; x++) {
        const i = y * bw + x;
        if (!hole[i]) continue;
        for (let c = 0; c < 3; c++) {
          const plane2 = channels[c];
          let sum = 0;
          let count = 0;
          if (x > 0) { sum += plane2[i - 1]; count++; }
          if (x < bw - 1) { sum += plane2[i + 1]; count++; }
          if (y > 0) { sum += plane2[i - bw]; count++; }
          if (y < bh - 1) { sum += plane2[i + bw]; count++; }
          if (count) plane2[i] = sum / count;
        }
      }
    }
    if (onProgress && step % 40 === 0) {
      onProgress({ done: step / iterations, remaining: 0 });
    }
  }

  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      const i = y * bw + x;
      if (!hole[i]) continue;
      const global = ((y0 + y) * plane.width + (x0 + x)) * 4;
      plane.data[global] = channels[0][i];
      plane.data[global + 1] = channels[1][i];
      plane.data[global + 2] = channels[2][i];
      plane.data[global + 3] = 255;
    }
  }
}

// ----------------------------------------------------------------------------
// Propagación de parches (método "reconstruir")
// ----------------------------------------------------------------------------

/**
 * La propagación es reanudable a propósito. `onmessage` de un worker es
 * síncrono: mientras un relleno largo corre, la cola de mensajes está
 * bloqueada y un "cancela" enviado desde el hilo principal NUNCA llegaría a
 * leerse. Partiendo el trabajo en tramos con un presupuesto de tiempo, el
 * worker vuelve al bucle de eventos entre tramo y tramo, y ahí sí ve el
 * mensaje. De paso, el avance que se informa es real y no una estimación.
 */
export interface PatchSession {
  plane: Plane;
  mask: Mask;
  settings: FillSettings;
  /** 1 = sigue por rellenar. */
  filled: Uint8Array;
  confidence: Float32Array;
  luma: Float32Array;
  remaining: number;
  total: number;
  box: { minX: number; minY: number; maxX: number; maxY: number };
  search: { x0: number; y0: number; x1: number; y1: number };
  half: number;
  guard: number;
}

export function createPatchSession(plane: Plane, mask: Mask, settings: FillSettings): PatchSession | null {
  const { width, height, data } = plane;
  const box = boundingBox(mask, width, height);
  if (!box.any) return null;

  const half = Math.max(1, Math.floor(settings.patchSize / 2));
  const filled = new Uint8Array(mask);
  const confidence = new Float32Array(width * height);
  for (let i = 0; i < confidence.length; i++) confidence[i] = filled[i] ? 0 : 1;

  const luma = new Float32Array(width * height);
  for (let i = 0; i < luma.length; i++) {
    luma[i] = 0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2];
  }

  let remaining = 0;
  for (let i = 0; i < filled.length; i++) if (filled[i]) remaining++;
  if (remaining === 0) return null;

  // Zona de búsqueda: la caja del hueco más el radio. Buscar en toda la imagen
  // multiplica el coste por veinte y casi nunca mejora el resultado, porque el
  // parche bueno suele estar al lado.
  const radius = settings.searchRadius > 0 ? settings.searchRadius : Math.max(width, height);
  return {
    plane, mask, settings, filled, confidence, luma,
    remaining, total: remaining,
    box: { minX: box.minX, minY: box.minY, maxX: box.maxX, maxY: box.maxY },
    search: {
      x0: Math.max(half, box.minX - radius),
      y0: Math.max(half, box.minY - radius),
      x1: Math.min(width - half - 1, box.maxX + radius),
      y1: Math.min(height - half - 1, box.maxY + radius),
    },
    half,
    guard: remaining * 4 + 1000,
  };
}

/** Trabaja como mucho `budgetMs` milisegundos. Devuelve si ya terminó. */
export function stepPatch(session: PatchSession, budgetMs: number): { done: boolean; progress: FillProgress } {
  const { plane, filled, confidence, luma, settings, box, search, half } = session;
  const { width, height, data } = plane;
  const deadline = Date.now() + budgetMs;

  while (session.remaining > 0 && session.guard-- > 0) {
    // --- 1. El frente: píxeles por rellenar con algún vecino ya conocido ---
    let bestIndex = -1;
    let bestPriority = -1;
    for (let y = box.minY; y <= box.maxY; y++) {
      for (let x = box.minX; x <= box.maxX; x++) {
        const i = y * width + x;
        if (!filled[i]) continue;
        const onEdge =
          (x > 0 && !filled[i - 1]) || (x < width - 1 && !filled[i + 1]) ||
          (y > 0 && !filled[i - width]) || (y < height - 1 && !filled[i + width]);
        if (!onEdge) continue;

        // Confianza: proporción de contexto conocido en el parche.
        let sum = 0;
        let count = 0;
        for (let dy = -half; dy <= half; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= height) continue;
          for (let dx = -half; dx <= half; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= width) continue;
            sum += confidence[ny * width + nx];
            count++;
          }
        }
        const conf = count > 0 ? sum / count : 0;

        // Término de dato: cuánta estructura cruza el borde. El gradiente de
        // luminancia girado 90° es la isofota; su proyección sobre la normal
        // del frente dice si aquí entra una línea. Es lo que hace que un borde
        // continúe recto por dentro del hueco en vez de cortarse.
        const gx = gradient(luma, filled, width, height, x, y, 1, 0);
        const gy = gradient(luma, filled, width, height, x, y, 0, 1);
        const nx = normal(filled, width, height, x, y, 1, 0);
        const ny = normal(filled, width, height, x, y, 0, 1);
        const dataTerm = Math.abs(-gy * nx + gx * ny) / 255;

        const priority = conf * (0.02 + dataTerm);
        if (priority > bestPriority) {
          bestPriority = priority;
          bestIndex = i;
        }
      }
    }

    if (bestIndex < 0) break;
    const targetX = bestIndex % width;
    const targetY = (bestIndex / width) | 0;

    // --- 2. El parche conocido más parecido ---
    let bestScore = Infinity;
    let bestSX = -1;
    let bestSY = -1;
    for (let cy = search.y0; cy <= search.y1; cy++) {
      for (let cx = search.x0; cx <= search.x1; cx++) {
        let score = 0;
        let valid = true;
        for (let dy = -half; dy <= half && valid; dy++) {
          const ty = targetY + dy;
          const cyy = cy + dy;
          if (ty < 0 || ty >= height) continue;
          for (let dx = -half; dx <= half; dx++) {
            const tx = targetX + dx;
            const cxx = cx + dx;
            if (tx < 0 || tx >= width) continue;
            const ci = cyy * width + cxx;
            // El candidato tiene que ser conocido de punta a punta; si no, se
            // copiaría el propio hueco dentro del hueco.
            if (filled[ci]) { valid = false; break; }
            const ti = ty * width + tx;
            if (filled[ti]) continue; // sólo cuenta el contexto ya conocido
            const dr = data[ti * 4] - data[ci * 4];
            const dg = data[ti * 4 + 1] - data[ci * 4 + 1];
            const db = data[ti * 4 + 2] - data[ci * 4 + 2];
            score += dr * dr + dg * dg + db * db;
            if (score >= bestScore) { valid = false; break; }
          }
        }
        if (valid && score < bestScore) {
          bestScore = score;
          bestSX = cx;
          bestSY = cy;
        }
      }
    }

    if (bestSX < 0) {
      // Sin candidato válido: se da por resuelto para no atascarse; el
      // suavizado del contorno se encarga de ese punto.
      filled[bestIndex] = 0;
      session.remaining--;
      continue;
    }

    // --- 3. Copiar ---
    const targetConfidence = confidence[bestIndex] || bestPriority;
    for (let dy = -half; dy <= half; dy++) {
      const ty = targetY + dy;
      const sy = bestSY + dy;
      if (ty < 0 || ty >= height) continue;
      for (let dx = -half; dx <= half; dx++) {
        const tx = targetX + dx;
        const sx = bestSX + dx;
        if (tx < 0 || tx >= width) continue;
        const ti = ty * width + tx;
        if (!filled[ti]) continue;
        const si = sy * width + sx;
        data[ti * 4] = data[si * 4];
        data[ti * 4 + 1] = data[si * 4 + 1];
        data[ti * 4 + 2] = data[si * 4 + 2];
        data[ti * 4 + 3] = 255;
        luma[ti] = luma[si];
        filled[ti] = 0;
        confidence[ti] = targetConfidence;
        session.remaining--;
      }
    }

    if (Date.now() >= deadline) break;
  }

  const done = session.remaining <= 0 || session.guard <= 0;
  return {
    done,
    progress: { done: 1 - session.remaining / session.total, remaining: session.remaining },
  };
}

/** Gradiente de luminancia usando sólo píxeles ya conocidos. */
function gradient(
  luma: Float32Array, filled: Uint8Array, width: number, height: number,
  x: number, y: number, dx: number, dy: number
): number {
  const ax = x - dx;
  const ay = y - dy;
  const bx = x + dx;
  const by = y + dy;
  if (ax < 0 || ay < 0 || bx >= width || by >= height) return 0;
  const a = ay * width + ax;
  const b = by * width + bx;
  if (filled[a] || filled[b]) return 0;
  return (luma[b] - luma[a]) / 2;
}

/** Normal al frente: gradiente de la propia máscara. */
function normal(
  filled: Uint8Array, width: number, height: number,
  x: number, y: number, dx: number, dy: number
): number {
  const ax = x - dx;
  const ay = y - dy;
  const bx = x + dx;
  const by = y + dy;
  if (ax < 0 || ay < 0 || bx >= width || by >= height) return 0;
  return (filled[by * width + bx] - filled[ay * width + ax]) / 2;
}

// ----------------------------------------------------------------------------
// Métodos que ocultan, no reconstruyen
// ----------------------------------------------------------------------------

/**
 * Desenfoque de caja dentro de la máscara. Muestrea sólo fuera de ella, para
 * que el objeto tapado no se pinte a sí mismo, y con `strength` alto toma un
 * radio mayor.
 */
export function blurFill(plane: Plane, mask: Mask, strength: number): void {
  const { width, height, data } = plane;
  const box = boundingBox(mask, width, height);
  if (!box.any) return;
  const source = new Uint8ClampedArray(data);
  const radius = Math.max(3, Math.round((strength / 100) * 18));
  const step = radius > 8 ? 2 : 1;
  for (let y = box.minY; y <= box.maxY; y++) {
    for (let x = box.minX; x <= box.maxX; x++) {
      if (!mask[y * width + x]) continue;
      let sr = 0;
      let sg = 0;
      let sb = 0;
      let count = 0;
      for (let dy = -radius; dy <= radius; dy += step) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -radius; dx <= radius; dx += step) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          if (mask[ny * width + nx]) continue;
          const i = (ny * width + nx) * 4;
          sr += source[i];
          sg += source[i + 1];
          sb += source[i + 2];
          count++;
        }
      }
      if (!count) continue;
      const i = (y * width + x) * 4;
      data[i] = sr / count;
      data[i + 1] = sg / count;
      data[i + 2] = sb / count;
      data[i + 3] = 255;
    }
  }
}

/**
 * Mosaico. La media de cada bloque se calcula **excluyendo los píxeles
 * enmascarados**: si no, el color de la marca de agua tiñe el mosaico y el
 * rectángulo se sigue viendo, que era el fallo de la versión anterior.
 */
export function pixelateFill(plane: Plane, mask: Mask, strength: number): void {
  const { width, height, data } = plane;
  const box = boundingBox(mask, width, height);
  if (!box.any) return;
  const span = Math.max(box.maxX - box.minX, box.maxY - box.minY) + 1;
  const block = Math.max(4, Math.round((span / 24) * (strength / 50)));
  const source = new Uint8ClampedArray(data);

  for (let by = box.minY; by <= box.maxY; by += block) {
    for (let bx = box.minX; bx <= box.maxX; bx += block) {
      let sr = 0;
      let sg = 0;
      let sb = 0;
      let count = 0;
      const yEnd = Math.min(by + block, height);
      const xEnd = Math.min(bx + block, width);
      for (let y = by; y < yEnd; y++) {
        for (let x = bx; x < xEnd; x++) {
          if (mask[y * width + x]) continue;
          const i = (y * width + x) * 4;
          sr += source[i];
          sg += source[i + 1];
          sb += source[i + 2];
          count++;
        }
      }
      // Bloque totalmente dentro de la máscara: no hay nada limpio que
      // promediar, así que se toma el anillo de alrededor.
      if (!count) {
        for (let y = Math.max(0, by - block); y < Math.min(height, yEnd + block); y++) {
          for (let x = Math.max(0, bx - block); x < Math.min(width, xEnd + block); x++) {
            if (mask[y * width + x]) continue;
            const i = (y * width + x) * 4;
            sr += source[i];
            sg += source[i + 1];
            sb += source[i + 2];
            count++;
          }
        }
      }
      if (!count) continue;
      const ar = sr / count;
      const ag = sg / count;
      const ab = sb / count;
      for (let y = by; y < yEnd; y++) {
        for (let x = bx; x < xEnd; x++) {
          if (!mask[y * width + x]) continue;
          const i = (y * width + x) * 4;
          data[i] = ar;
          data[i + 1] = ag;
          data[i + 2] = ab;
          data[i + 3] = 255;
        }
      }
    }
  }
}

// ----------------------------------------------------------------------------
// Borde
// ----------------------------------------------------------------------------

/**
 * Suaviza la costura entre lo rellenado y lo que había, promediando una banda
 * estrecha a caballo del contorno de la máscara.
 *
 * OJO con la tentación de "fundir hacia el original" dentro de la máscara: el
 * original ahí es justo la marca de agua, así que eso la devolvería difuminada
 * en el borde. Lo que se promedia es la imagen YA rellenada consigo misma; el
 * original no entra.
 */
export function featherEdges(plane: Plane, mask: Mask, radius: number): void {
  if (radius <= 0) return;
  const { width, height, data } = plane;
  const box = boundingBox(mask, width, height);
  if (!box.any) return;

  // Banda: píxeles a `radius` o menos del contorno, por dentro y por fuera.
  const band = new Uint8Array(width * height);
  const x0 = Math.max(0, box.minX - radius - 1);
  const y0 = Math.max(0, box.minY - radius - 1);
  const x1 = Math.min(width - 1, box.maxX + radius + 1);
  const y1 = Math.min(height - 1, box.maxY + radius + 1);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = y * width + x;
      const self = mask[i];
      let boundary = false;
      for (let dy = -radius; dy <= radius && !boundary; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          if (mask[ny * width + nx] !== self) { boundary = true; break; }
        }
      }
      if (boundary) band[i] = 1;
    }
  }

  const source = new Uint8ClampedArray(data);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = y * width + x;
      if (!band[i]) continue;
      let sr = 0;
      let sg = 0;
      let sb = 0;
      let count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          const n = (ny * width + nx) * 4;
          sr += source[n];
          sg += source[n + 1];
          sb += source[n + 2];
          count++;
        }
      }
      if (!count) continue;
      const p = i * 4;
      data[p] = sr / count;
      data[p + 1] = sg / count;
      data[p + 2] = sb / count;
    }
  }
}
