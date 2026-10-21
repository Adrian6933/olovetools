// ============================================================================
// Nitidez: CAS (Contrast Adaptive Sharpening, AMD FidelityFX) en WebGL
// ----------------------------------------------------------------------------
// Los clips de Twitch llegan a 1080p con 3-8 Mbps, y lo que primero se come
// la compresión es el detalle fino que se mueve: hierba, hojas, follaje (en
// Rust se ve como una mancha verde). Ese detalle no se recupera, pero sí se
// puede devolver contraste a lo que queda.
//
// CAS mira los 8 vecinos de cada píxel y afila MÁS donde hay poco contraste
// local y MENOS donde ya hay un borde fuerte: así la hierba gana textura sin
// que salgan halos blancos alrededor del texto del HUD o de la webcam, que es
// lo que hace un "unsharp mask" normal. Es el mismo filtro que usan los juegos
// después de escalar, por eso combina bien con exportar a 1440p.
//
// Un pase de shader por fotograma: en una GPU cualquiera son milisegundos
// incluso a 1440p, nada comparado con decodificar y codificar.
// ============================================================================

const VERTICES = `
attribute vec2 p;
varying vec2 uv;
void main() {
  uv = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5);
  gl_Position = vec4(p, 0.0, 1.0);
}`;

// Port de FidelityFX CAS (versión sin escalado; el escalado ya lo hace el
// canvas antes). `fuerza` 0..1 lleva el peso de 1/8 (suave) a 1/5 (fuerte).
const FRAGMENTOS = `
precision mediump float;
varying vec2 uv;
uniform sampler2D tex;
uniform vec2 px;
uniform float fuerza;
vec3 t(float x, float y) { return texture2D(tex, uv + vec2(x, y) * px).rgb; }
void main() {
  vec3 a = t(-1.0, -1.0); vec3 b = t(0.0, -1.0); vec3 c = t(1.0, -1.0);
  vec3 d = t(-1.0,  0.0); vec3 e = t(0.0,  0.0); vec3 f = t(1.0,  0.0);
  vec3 g = t(-1.0,  1.0); vec3 h = t(0.0,  1.0); vec3 i = t(1.0,  1.0);
  vec3 mn = min(min(min(d, e), min(f, b)), h);
  vec3 mn2 = min(mn, min(min(a, c), min(g, i)));
  mn += mn2;
  vec3 mx = max(max(max(d, e), max(f, b)), h);
  vec3 mx2 = max(mx, max(max(a, c), max(g, i)));
  mx += mx2;
  vec3 amp = clamp(min(mn, 2.0 - mx) / max(mx, vec3(1e-5)), 0.0, 1.0);
  amp = sqrt(amp);
  float pico = -1.0 / mix(8.0, 5.0, fuerza);
  vec3 w = amp * pico;
  vec3 salida = ((b + d + f + h) * w + e) / (1.0 + 4.0 * w);
  gl_FragColor = vec4(clamp(salida, 0.0, 1.0), 1.0);
}`;

export interface Nitidez {
  /** Afila `fuente` (del tamaño del filtro) y devuelve el canvas con el resultado. */
  aplicar: (fuente: TexImageSource, fuerza: number) => HTMLCanvasElement;
  liberar: () => void;
}

/** Crea el filtro para un tamaño fijo. Devuelve null si no hay WebGL. */
export const crearNitidez = (ancho: number, alto: number): Nitidez | null => {
  const canvas = document.createElement('canvas');
  canvas.width = ancho;
  canvas.height = alto;
  const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, premultipliedAlpha: false, antialias: false });
  if (!gl) return null;

  const compilar = (tipo: number, codigo: string) => {
    const s = gl.createShader(tipo)!;
    gl.shaderSource(s, codigo);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
    return s;
  };
  let programa: WebGLProgram;
  try {
    programa = gl.createProgram()!;
    gl.attachShader(programa, compilar(gl.VERTEX_SHADER, VERTICES));
    gl.attachShader(programa, compilar(gl.FRAGMENT_SHADER, FRAGMENTOS));
    gl.linkProgram(programa);
    if (!gl.getProgramParameter(programa, gl.LINK_STATUS)) return null;
  } catch {
    return null;
  }
  gl.useProgram(programa);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const p = gl.getAttribLocation(programa, 'p');
  gl.enableVertexAttribArray(p);
  gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);

  const textura = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, textura);
  // NEAREST: cada vecino es un píxel exacto, sin mezclar.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform2f(gl.getUniformLocation(programa, 'px'), 1 / ancho, 1 / alto);
  const uFuerza = gl.getUniformLocation(programa, 'fuerza');
  gl.viewport(0, 0, ancho, alto);

  return {
    aplicar: (fuente, fuerza) => {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fuente);
      gl.uniform1f(uFuerza, Math.max(0, Math.min(1, fuerza)));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      return canvas;
    },
    liberar: () => {
      gl.deleteTexture(textura);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(programa);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
};

// ---- Preferencia guardada: cuánto afilar y a qué alto exportar --------------

export type NivelNitidez = 'off' | 'suave' | 'media' | 'fuerte';
export const FUERZA: Record<NivelNitidez, number> = { off: 0, suave: 0.3, media: 0.65, fuerte: 1 };

export interface CalidadExport {
  nitidez: NivelNitidez;
  /** 1080 = como viene el clip; 1440 = escalado (YouTube lo guarda mejor). */
  alto: 1080 | 1440;
}

export const CALIDAD_POR_DEFECTO: CalidadExport = { nitidez: 'off', alto: 1080 };

const clave = (prefijo: string) => `${prefijo}_export_quality`;

export const leerCalidad = (prefijo: string): CalidadExport => {
  if (typeof window === 'undefined') return CALIDAD_POR_DEFECTO;
  try {
    const g = JSON.parse(localStorage.getItem(clave(prefijo)) || 'null');
    if (g && g.nitidez in FUERZA && (g.alto === 1080 || g.alto === 1440)) return g;
  } catch { /* nada guardado */ }
  return CALIDAD_POR_DEFECTO;
};

export const guardarCalidad = (prefijo: string, c: CalidadExport) => {
  try { localStorage.setItem(clave(prefijo), JSON.stringify(c)); } catch { /* sin almacenamiento */ }
};
